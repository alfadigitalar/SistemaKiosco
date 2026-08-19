import React, { useState, useEffect } from "react";
import { 
  KeyRound, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  Copy, 
  Check, 
  AlertTriangle,
  Lock,
  Gift
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function LicenseGate({ children }) {
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activationKey, setActivationKey] = useState("");
  const [activating, setActivating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionChoice, setActionChoice] = useState(""); // 'welcome' | 'input_key'

  const checkLicense = async () => {
    try {
      if (window.api && window.api.checkLicenseStatus) {
        const info = await window.api.checkLicenseStatus();
        setLicenseInfo(info);
        if (info.status === "new") {
          setActionChoice("welcome");
        }
      }
    } catch (error) {
      console.error("Error al verificar licencia:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLicense();
    // Comprobar cada 5 minutos por seguridad
    const interval = setInterval(checkLicense, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartTrial = async () => {
    try {
      setLoading(true);
      if (window.api && window.api.startTrial) {
        const res = await window.api.startTrial();
        if (res.success) {
          toast.success("Período de prueba iniciado con éxito.");
          await checkLicense();
        } else {
          toast.error(res.message || "Error al iniciar período de prueba.");
          setLoading(false);
        }
      }
    } catch (e) {
      toast.error("Error de comunicación.");
      setLoading(false);
    }
  };

  const handleActivate = async (e) => {
    if (e) e.preventDefault();
    if (!activationKey.trim()) {
      toast.error("Por favor ingrese la clave de activación.");
      return;
    }
    
    setActivating(true);
    try {
      if (window.api && window.api.activateLicense) {
        const res = await window.api.activateLicense(activationKey);
        if (res.success) {
          toast.success("¡Licencia activada con éxito! Bienvenido a Kubo POS completo.");
          await checkLicense();
        } else {
          toast.error(res.message || "La clave de activación es incorrecta.");
        }
      }
    } catch (err) {
      toast.error("Error de comunicación al intentar activar.");
    } finally {
      setActivating(false);
    }
  };

  const copyIdToClipboard = () => {
    if (licenseInfo && licenseInfo.installationId) {
      navigator.clipboard.writeText(licenseInfo.installationId);
      setCopied(true);
      toast.success("ID de Instalación copiado al portapapeles.");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // 1. Pantalla de carga
  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-white z-[999999]">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium tracking-wide">Validando licencia del sistema...</p>
      </div>
    );
  }

  // Si no hay datos (por ejemplo, modo desarrollo en web pura), permitir el paso
  if (!licenseInfo) {
    return children;
  }

  // 2. Pantalla de Bienvenida (Nuevas instalaciones)
  if (licenseInfo.status === "new" && actionChoice === "welcome") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 text-white z-[999999] p-4 overflow-y-auto">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Fondo estético */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>

          <div className="flex flex-col items-center text-center relative z-10">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
              <Gift className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">¡Bienvenido a Kubo POS!</h1>
            <p className="text-slate-400 text-sm mb-8">
              Para comenzar a utilizar el sistema de gestión y facturación para su negocio, seleccione una opción.
            </p>

            <button
              onClick={handleStartTrial}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2 mb-4 group"
            >
              <Clock className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Iniciar 7 días de prueba gratis
            </button>

            <button
              onClick={() => setActionChoice("input_key")}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Ya tengo clave de activación
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla para ingresar la clave de activación desde la bienvenida
  if (licenseInfo.status === "new" && actionChoice === "input_key") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 text-white z-[999999] p-4 overflow-y-auto">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <h2 className="text-xl font-bold tracking-tight mb-2 flex items-center gap-2">
              <KeyRound className="w-6 h-6 text-blue-400" />
              Activar Versión Completa
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Ingrese la clave de activación provista por el Ing. Rodríguez para desbloquear la versión completa.
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
              <div className="overflow-hidden">
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">ID de Instalación</span>
                <span className="font-mono text-sm font-semibold tracking-wider text-slate-300 select-all block truncate">
                  {licenseInfo.installationId}
                </span>
              </div>
              <button
                onClick={copyIdToClipboard}
                className="p-2.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors border border-slate-800"
                title="Copiar ID"
              >
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1.5 font-medium">Clave de Activación</label>
                <input
                  type="text"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={activationKey}
                  onChange={(e) => setActivationKey(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-mono tracking-wider focus:outline-none focus:border-blue-500 text-center text-lg text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActionChoice("welcome")}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={activating}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {activating ? "Validando..." : "Activar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 3. Pantalla de error de Reloj (Clock-tampering)
  if (licenseInfo.clockTampered) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 text-white z-[999999] p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>

          <div className="flex flex-col items-center text-center relative z-10">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-red-400 mb-2">Discrepancia de Fecha y Hora</h1>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              El sistema detectó que la fecha del equipo se ha retrocedido. Por favor, ajuste el reloj de Windows a la hora actual de internet y reinicie la aplicación.
            </p>
            <div className="text-xs text-slate-500 border border-slate-800 rounded-xl p-3 bg-slate-950 w-full mb-6">
              Si el problema persiste, contacte al Ing. Rodríguez.
            </div>
            <button
              onClick={checkLicense}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors border border-slate-700"
            >
              Reintentar verificación
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Pantalla de Manipulación de Base de Datos / Tampered
  if (licenseInfo.status === "tampered") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 text-white z-[999999] p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>

          <div className="flex flex-col items-center text-center relative z-10">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-red-500 mb-2">Error de Integridad de Licencia</h1>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Los archivos de licencia del sistema han sido alterados o la firma digital no coincide. Comuníquese con el Ing. Rodríguez para restablecer la instalación.
            </p>
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 w-full text-left mb-6 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block">ID de Instalación</span>
                <span className="font-mono text-sm tracking-wider text-slate-400 select-all block truncate max-w-[240px]">
                  {licenseInfo.installationId}
                </span>
              </div>
              <button
                onClick={copyIdToClipboard}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white border border-slate-800"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. Pantalla de Expiración del período de prueba
  if (licenseInfo.status === "trial" && licenseInfo.expired) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 text-white z-[999999] p-4 overflow-y-auto">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Fondo estético */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
              <Lock className="w-8 h-8 animate-bounce" />
            </div>
            
            <h1 className="text-2xl font-bold tracking-tight text-center text-white mb-2">
              Período de Prueba Terminado
            </h1>
            <p className="text-slate-400 text-sm text-center mb-6 leading-relaxed">
              Su prueba gratuita de 7 días ha finalizado. Para seguir usando el sistema y acceder a todos sus datos guardados, por favor contacte al **Ing. Rodríguez** e ingrese su clave de activación.
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 w-full mb-6 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Su ID de Instalación</span>
                <span className="font-mono text-sm font-semibold tracking-wider text-blue-400 select-all block truncate max-w-[240px]">
                  {licenseInfo.installationId}
                </span>
              </div>
              <button
                onClick={copyIdToClipboard}
                className="p-2.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors border border-slate-800"
              >
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <form onSubmit={handleActivate} className="w-full space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1.5 font-medium">Clave de Activación</label>
                <input
                  type="text"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={activationKey}
                  onChange={(e) => setActivationKey(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-mono tracking-wider focus:outline-none focus:border-blue-500 text-center text-lg text-white"
                />
              </div>

              <button
                type="submit"
                disabled={activating}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {activating ? "Validando..." : "Desbloquear Sistema"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 6. Licencia válida: Renderizar la aplicación e inyectar el cartelito si es modo Trial
  const isTrial = licenseInfo.status === "trial" && !licenseInfo.expired;
  
  return (
    <>
      {children}
      {isTrial && (
        <div className="fixed bottom-4 right-4 bg-slate-800 border border-slate-700 text-slate-200 px-4 py-3 rounded shadow-md flex items-center gap-3 z-[99999] hover:opacity-50 transition-opacity duration-300 font-sans cursor-default">
          <Clock className="w-5 h-5 text-slate-400" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Versión de Prueba</span>
            <span className="text-xs text-slate-400">
              Quedan {licenseInfo.hoursRemaining}h {licenseInfo.minutesRemaining}m
            </span>
          </div>
        </div>
      )}
    </>
  );
}
