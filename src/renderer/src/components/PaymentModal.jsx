import React, { useState, useEffect } from "react";
import {
  Banknote,
  CreditCard,
  Wallet,
  X,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";

const PaymentModal = ({ isOpen, onClose, total, onConfirm }) => {
  const [metodo, setMetodo] = useState("efectivo");
  const [montoRecibido, setMontoRecibido] = useState("");
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [montoTarjeta, setMontoTarjeta] = useState("");
  const [procesando, setProcesando] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMetodo("efectivo");
      setMontoRecibido("");
      setMontoEfectivo("");
      setMontoTarjeta("");
      setProcesando(false);
    }
  }, [isOpen]);

  // Set default amount for card/mp when selected
  useEffect(() => {
    if (metodo === "tarjeta" || metodo === "mercadopago") {
      setMontoRecibido(total.toString());
    }
  }, [metodo, total]);

  const pagoValido = () => {
    if (metodo === "efectivo") {
      return parseFloat(montoRecibido || 0) >= total;
    }
    if (metodo === "mixto") {
      const totalIngresado =
        (parseFloat(montoEfectivo) || 0) + (parseFloat(montoTarjeta) || 0);
      return Math.abs(totalIngresado - total) < 0.1; // Margin for float errors
    }
    return true; // Tarjeta / MP assumed full payment
  };

  const procesarPago = async () => {
    if (!pagoValido()) {
      toast.error("Monto insuficiente");
      return;
    }

    setProcesando(true);
    let datosPago = { metodo };

    if (metodo === "efectivo") {
      datosPago.monto = total;
      datosPago.montoRecibido = parseFloat(montoRecibido);
      datosPago.vuelto = parseFloat(montoRecibido) - total;
    } else if (metodo === "tarjeta") {
      datosPago.monto = total;
      datosPago.tarjeta = true;
    } else if (metodo === "mercadopago") {
      datosPago.monto = total;
      datosPago.mercadopago = true;
    } else if (metodo === "mixto") {
      datosPago.monto = total;
      datosPago.efectivo = parseFloat(montoEfectivo) || 0;
      datosPago.tarjeta = parseFloat(montoTarjeta) || 0;
      datosPago.isMixed = true;
    }

    await onConfirm(datosPago);
    setProcesando(false);
    onClose();
  };

  // Enable Enter key to confirm payment globally in the modal
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === "Enter" && isOpen) {
        e.preventDefault();
        // Solo procesar si el pago es válido y no se está procesando ya
        if (pagoValido() && !procesando) {
          procesarPago();
        }
      }
      // Escape to close
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, metodo, montoRecibido, montoEfectivo, montoTarjeta, procesando]);

  if (!isOpen) return null;

  const vuelto =
    metodo === "efectivo" && montoRecibido
      ? parseFloat(montoRecibido) - total
      : 0;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-700 transform transition-all scale-100">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Procesar Pago</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>

          <div className="text-center mb-8">
            <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-bold">
              Total a pagar
            </p>
            <p className="text-5xl font-black text-green-400">
              ${total.toFixed(2)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setMetodo("efectivo")}
              className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition border-2 ${
                metodo === "efectivo"
                  ? "bg-green-600/20 border-green-500 text-green-400"
                  : "bg-slate-700/50 border-transparent text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Banknote size={24} />
              <span className="font-bold">Efectivo</span>
            </button>
            <button
              onClick={() => setMetodo("tarjeta")}
              className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition border-2 ${
                metodo === "tarjeta"
                  ? "bg-blue-600/20 border-blue-500 text-blue-400"
                  : "bg-slate-700/50 border-transparent text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <CreditCard size={24} />
              <span className="font-bold">Tarjeta</span>
            </button>
            <button
              onClick={() => setMetodo("mixto")}
              className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition border-2 ${
                metodo === "mixto"
                  ? "bg-purple-600/20 border-purple-500 text-purple-400"
                  : "bg-slate-700/50 border-transparent text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Wallet size={24} />
              <span className="font-bold">Mixto</span>
            </button>
            <button
              onClick={() => setMetodo("mercadopago")}
              className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition border-2 ${
                metodo === "mercadopago"
                  ? "bg-cyan-600/20 border-cyan-500 text-cyan-400"
                  : "bg-slate-700/50 border-transparent text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Smartphone size={24} />
              <span className="font-bold">Mercado Pago</span>
            </button>
          </div>

          <div className="min-h-[160px]">
            {metodo === "efectivo" && (
              <div className="space-y-4">
                <label className="text-sm text-slate-400 mb-1 block">
                  Monto Recibido
                </label>
                <input
                  type="number"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl text-2xl text-white text-center font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                  autoFocus
                />
                <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl">
                  <span className="text-slate-400">Vuelto</span>
                  <span
                    className={`text-2xl font-bold font-mono ${
                      vuelto < 0 ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    ${vuelto > 0 ? vuelto.toFixed(2) : "0.00"}
                  </span>
                </div>
              </div>
            )}

            {metodo === "tarjeta" && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400">
                  <CreditCard size={32} />
                </div>
                <p className="text-slate-300">
                  Procese el pago por <b>${total.toFixed(2)}</b> en el lector de
                  tarjetas.
                </p>
              </div>
            )}

            {metodo === "mercadopago" && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400">
                  <Smartphone size={32} />
                </div>
                <p className="text-slate-300">
                  Solicite o muestre el QR por <b>${total.toFixed(2)}</b>.
                </p>
              </div>
            )}

            {metodo === "mixto" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">
                      Efectivo
                    </label>
                    <input
                      type="number"
                      value={montoEfectivo}
                      onChange={(e) => setMontoEfectivo(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl text-xl text-white text-center font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">
                      Tarjeta
                    </label>
                    <input
                      type="number"
                      value={montoTarjeta}
                      onChange={(e) => setMontoTarjeta(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl text-xl text-white text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="text-center p-3 bg-slate-900 rounded-xl">
                  <p className="text-sm text-slate-400">Total Ingresado</p>
                  <p className="text-xl font-bold text-white">
                    $
                    {(
                      (parseFloat(montoEfectivo) || 0) +
                      (parseFloat(montoTarjeta) || 0)
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={procesarPago}
          disabled={!pagoValido() || procesando}
          className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-6 text-xl transition flex items-center justify-center gap-3"
        >
          {procesando ? (
            "Procesando..."
          ) : (
            <>
              <CheckCircle2 size={24} /> Confirmar Pago
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;
