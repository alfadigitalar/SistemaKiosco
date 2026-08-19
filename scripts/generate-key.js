const crypto = require("crypto");

const SECRET_KEY = "kubo-pos-license-master-secret-key-2026-rodriguez";

// Formatear un hash hexadecimal en clave tipo XXXX-XXXX-XXXX-XXXX
function formatKey(rawHex) {
  const clean = rawHex.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `${clean.substring(0, 4)}-${clean.substring(4, 8)}-${clean.substring(8, 12)}-${clean.substring(12, 16)}`;
}

// Calcular la clave de activación
function calculateActivationKey(installationId) {
  const hash = crypto.createHmac("sha256", SECRET_KEY).update(installationId).digest("hex");
  return formatKey(hash);
}

// Obtener argumentos de consola
const args = process.argv.slice(2);
let installationId = "";

// Buscar argumento --id o capturar el primer argumento directo
const idIndex = args.indexOf("--id");
if (idIndex !== -1 && args[idIndex + 1]) {
  installationId = args[idIndex + 1];
} else if (args[0] && !args[0].startsWith("-")) {
  installationId = args[0];
}

if (!installationId) {
  console.log("\x1b[31m%s\x1b[0m", "❌ Error: Falta el ID de Instalación.");
  console.log("\nUso del generador:");
  console.log("  node scripts/generate-key.js <ID_DE_INSTALACION>");
  console.log("  node scripts/generate-key.js --id <ID_DE_INSTALACION>");
  console.log("\nEjemplo:");
  console.log("  node scripts/generate-key.js KPOS-ABCD-EFGH-IJKL\n");
  process.exit(1);
}

const cleanId = installationId.trim().toUpperCase();

// Validar estructura básica
if (!cleanId.startsWith("KPOS-") || cleanId.split("-").length !== 4) {
  console.log("\x1b[33m%s\x1b[0m", "⚠️  Advertencia: El formato del ID no parece estándar (debería ser KPOS-XXXX-XXXX-XXXX).");
}

const activationKey = calculateActivationKey(cleanId);

console.log("\n\x1b[36m%s\x1b[0m", "====================================================");
console.log("\x1b[32m%s\x1b[0m", "       🔑 GENERADOR DE CLAVES DE KUBO POS 🔑");
console.log("\x1b[36m%s\x1b[0m", "====================================================");
console.log(`\n  🖥️  ID de Instalación:  \x1b[33m${cleanId}\x1b[0m`);
console.log(`  🔑 Clave de Activación:  \x1b[1m\x1b[32m${activationKey}\x1b[0m`);
console.log("\n\x1b[36m%s\x1b[0m", "====================================================");
console.log("  Copie esta clave y provéasela al cliente.");
console.log("  Esta clave activará el sistema de forma permanente.\n");
