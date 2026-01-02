import React, { useEffect } from "react";
import { X, Lock, Crown, Mail, Globe, ArrowRight } from "lucide-react";

/**
 * Modal para versión DEMO que bloquea funcionalidades premium/backend.
 */
const DemoModal = ({ isOpen, onClose, actionName = "esta funcionalidad" }) => {
  if (!isOpen) return null;

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-purple-600/30 to-blue-600/10" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative p-6 flex flex-col items-center text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 mb-6">
            <Lock className="text-white h-8 w-8" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Modo Demo Activo
          </h2>

          <p className="text-slate-300 mb-6 leading-relaxed">
            Estás utilizando la versión de demostración para portafolio. <br />
            Para utilizar <strong>{actionName}</strong> y conectar con base de
            datos real, impresoras y servicios fiscales, necesitas la versión
            completa.
          </p>

          <div className="w-full space-y-3">
            <a
              href="mailto:contacto@alfadigital.com" // Reemplazar con el mail real del user si lo tenemos
              className="group w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3"
            >
              <Mail className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
              <span>Contactar por Desarrollo</span>
            </a>

            <button
              onClick={onClose}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3.5 rounded-xl transition-colors border border-slate-700"
            >
              Seguir Explorando
            </button>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
            <Crown size={12} className="text-yellow-500" />
            <span>Desarrollado por Alfa Digital</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoModal;
