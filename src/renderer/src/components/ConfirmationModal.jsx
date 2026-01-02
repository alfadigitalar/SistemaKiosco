import React, { useEffect } from "react";
import { AlertTriangle, Check, X } from "lucide-react";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar acción",
  message = "¿Estás seguro de continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDestructive = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      }
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-slate-200 dark:border-slate-700 scale-100 opacity-100">
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              isDestructive
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            }`}
          >
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-slate-500 dark:text-slate-400">{message}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`py-3 px-4 rounded-xl text-white font-bold transition flex items-center justify-center gap-2 ${
              isDestructive
                ? "bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20"
                : "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20"
            }`}
          >
            <Check size={18} />
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
