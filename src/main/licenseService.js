const crypto = require("crypto");
const { get, run, all } = require("./db");

const SECRET_KEY = "kubo-pos-license-master-secret-key-2026-rodriguez";

// Formatear un hash hexadecimal en clave tipo XXXX-XXXX-XXXX-XXXX
function formatKey(rawHex) {
  const clean = rawHex.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `${clean.substring(0, 4)}-${clean.substring(4, 8)}-${clean.substring(8, 12)}-${clean.substring(12, 16)}`;
}

// Generar una clave de instalación amigable
function generateInstallationId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "KPOS-";
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 2) id += "-";
  }
  return id;
}

// Calcular firma HMAC para asegurar la integridad de los datos de licencia locales
function calculateDbSignature(installationId, status, trialStart, lastRun) {
  const data = `${installationId}|${status}|${trialStart || ""}|${lastRun || 0}`;
  return crypto.createHmac("sha256", SECRET_KEY).update(data).digest("hex");
}

// Calcular la clave de activación válida para un ID de instalación
function calculateActivationKey(installationId) {
  const hash = crypto.createHmac("sha256", SECRET_KEY).update(installationId).digest("hex");
  return formatKey(hash);
}

/**
 * Obtiene todas las configuraciones de licencia de la base de datos
 */
async function getLicenseSettings() {
  try {
    const rows = await all("SELECT key, value FROM settings WHERE key LIKE 'license_%'");
    return rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  } catch (e) {
    console.error("Error al leer settings de licencia:", e);
    return {};
  }
}

/**
 * Actualiza la firma de la base de datos para prevenir manipulación manual
 */
async function updateLicenseSignature(installationId, status, trialStart, lastRun) {
  const signature = calculateDbSignature(installationId, status, trialStart, lastRun);
  await run("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_signature', ?)", [signature]);
}

/**
 * Inicia el período de prueba de 7 días
 */
async function startTrial() {
  const settings = await getLicenseSettings();
  let installationId = settings.license_installation_id;

  if (!installationId) {
    installationId = generateInstallationId();
    await run("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_installation_id', ?)", [installationId]);
  }

  const now = Date.now().toString();
  
  await run("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_status', 'trial')");
  await run("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_trial_start', ?)", [now]);
  await run("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_last_run', ?)", [now]);
  
  await updateLicenseSignature(installationId, "trial", now, now);
  
  console.log(`[LICENSE] Trial iniciado para ${installationId} el ${new Date(parseInt(now)).toLocaleString()}`);
  return { success: true };
}

/**
 * Activa la versión completa usando la clave proporcionada
 */
async function activateLicense(key) {
  const settings = await getLicenseSettings();
  let installationId = settings.license_installation_id;

  if (!installationId) {
    return { success: false, message: "No se ha generado un ID de instalación." };
  }

  const expectedKey = calculateActivationKey(installationId);
  const cleanKey = key.trim().toUpperCase();

  if (cleanKey !== expectedKey) {
    return { success: false, message: "La clave de activación ingresada no es válida para este equipo." };
  }

  const now = Date.now().toString();

  await run("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_status', 'activated')");
  await run("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_key', ?)", [cleanKey]);
  await run("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_last_run', ?)", [now]);

  await updateLicenseSignature(installationId, "activated", settings.license_trial_start, now);

  console.log(`[LICENSE] Aplicación activada con éxito para ${installationId}`);
  return { success: true };
}

/**
 * Comprueba el estado de la licencia y el tiempo restante
 */
async function checkLicenseStatus() {
  const settings = await getLicenseSettings();
  let installationId = settings.license_installation_id;
  let status = settings.license_status;
  let trialStart = settings.license_trial_start;
  let lastRun = settings.license_last_run;
  let dbSignature = settings.license_signature;

  // 1. Si no hay ID de instalación, comprobamos si ya está activado (caso de migración de cliente existente)
  if (!installationId) {
    installationId = generateInstallationId();
    await run("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_installation_id', ?)", [installationId]);
    
    if (status === "activated") {
      // Cliente existente migrado: generar clave y firma para este nuevo ID automáticamente
      const key = calculateActivationKey(installationId);
      const nowStr = Date.now().toString();
      await run("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_key', ?)", [key]);
      await run("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_last_run', ?)", [nowStr]);
      await updateLicenseSignature(installationId, "activated", trialStart, nowStr);
      
      return {
        status: "activated",
        installationId,
        expired: false,
        clockTampered: false,
        hoursRemaining: null,
        minutesRemaining: null
      };
    }
    
    return {
      status: "new",
      installationId,
      expired: false,
      clockTampered: false,
      hoursRemaining: 168,
      minutesRemaining: 0
    };
  }

  // Si no hay status, es nueva también
  if (!status) {
    return {
      status: "new",
      installationId,
      expired: false,
      clockTampered: false,
      hoursRemaining: 168,
      minutesRemaining: 0
    };
  }

  const now = Date.now();

  // 2. Verificar la firma digital para asegurar que no editaron la base de datos
  const expectedSignature = calculateDbSignature(installationId, status, trialStart, lastRun);
  if (dbSignature && dbSignature !== expectedSignature) {
    console.warn("[LICENSE] ¡Firma digital de licencia inválida! Posible intento de hackeo.");
    return {
      status: "tampered",
      installationId,
      expired: true,
      clockTampered: false,
      hoursRemaining: 0
    };
  }

  // 3. Verificar alteración de reloj (clock-tampering)
  // Permitimos una tolerancia de 10 minutos por posibles desajustes normales del sistema
  if (lastRun && now < parseInt(lastRun) - 10 * 60 * 1000) {
    console.warn(`[LICENSE] Alteración de reloj detectada. Hora actual (${new Date(now).toLocaleString()}) es anterior al último registro (${new Date(parseInt(lastRun)).toLocaleString()})`);
    return {
      status,
      installationId,
      expired: true,
      clockTampered: true,
      hoursRemaining: 0
    };
  }

  // 4. Si está activada, validar la clave
  if (status === "activated") {
    const expectedKey = calculateActivationKey(installationId);
    if (settings.license_key !== expectedKey) {
      console.warn("[LICENSE] Clave almacenada no coincide con el ID de instalación.");
      return {
        status: "tampered",
        installationId,
        expired: true,
        clockTampered: false,
        hoursRemaining: 0
      };
    }

    // Actualizar la última fecha de ejecución y firma
    const nowStr = now.toString();
    await run("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_last_run', ?)", [nowStr]);
    await updateLicenseSignature(installationId, "activated", trialStart, nowStr);

    return {
      status: "activated",
      installationId,
      expired: false,
      clockTampered: false,
      hoursRemaining: null
    };
  }

  // 5. Si está en período de prueba
  if (status === "trial") {
    if (!trialStart) {
      // Inconsistencia, reiniciar trial de seguridad
      trialStart = now.toString();
      await run("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_trial_start', ?)", [trialStart]);
    }

    const startMs = parseInt(trialStart);
    const limitMs = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos
    const elapsedMs = now - startMs;
    const remainingMs = Math.max(0, limitMs - elapsedMs);
    
    const totalMinutes = Math.floor(remainingMs / (1000 * 60));
    const hoursRemaining = Math.floor(totalMinutes / 60);
    const minutesRemaining = totalMinutes % 60;

    const expired = elapsedMs >= limitMs;

    // Actualizar la última fecha de ejecución y firma si no ha expirado y la hora es válida
    if (!expired) {
      const nowStr = now.toString();
      await run("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_last_run', ?)", [nowStr]);
      await updateLicenseSignature(installationId, "trial", trialStart, nowStr);
    }

    return {
      status: "trial",
      installationId,
      expired,
      clockTampered: false,
      hoursRemaining,
      minutesRemaining
    };
  }

  return {
    status: "new",
    installationId,
    expired: false,
    clockTampered: false,
    hoursRemaining: 1
  };
}

module.exports = {
  checkLicenseStatus,
  startTrial,
  activateLicense,
  calculateActivationKey
};
