import React, { useState } from "react";
import {
  X,
  CreditCard,
  Banknote,
  Wallet,
  CheckCircle,
  UserCheck,
} from "lucide-react";

/**
 * Modal de Pago
 * Permite seleccionar método de pago (Efectivo, Tarjeta, Mixto)
 * y procesar la transacción con cálculo de vuelto.
 */
export default function PaymentModal({
  isOpen,
  onClose,
  total,
  onConfirm,
  clientName,
}) {
  const [metodo, setMetodo] = useState("efectivo"); // efectivo | tarjeta | mixto
  const [montoRecibido, setMontoRecibido] = useState("");
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [montoTarjeta, setMontoTarjeta] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [exito, setExito] = useState(false);

  // Resetear estado al cerrar
  const handleClose = () => {
    setMetodo("efectivo");
    setMontoRecibido("");
    setMontoEfectivo("");
    setMontoTarjeta("");
    setProcesando(false);
    setExito(false);
    onClose();
  };

  // Calcular vuelto
  const calcularVuelto = () => {
    if (metodo === "efectivo") {
      const recibido = parseFloat(montoRecibido) || 0;
      return Math.max(0, recibido - total);
    }
    if (metodo === "mixto") {
      const efectivo = parseFloat(montoEfectivo) || 0;
      const tarjeta = parseFloat(montoTarjeta) || 0;
      return Math.max(0, efectivo + tarjeta - total);
    }
    return 0; // Tarjeta no tiene vuelto
  };

  // Validar si el pago es suficiente
  const pagoValido = () => {
    if (metodo === "efectivo") {
      return parseFloat(montoRecibido) >= total;
    }
    if (metodo === "tarjeta" || metodo === "checking_account") {
      return true; // Siempre válido
    }
    if (metodo === "mixto") {
      const efectivo = parseFloat(montoEfectivo) || 0;
      const tarjeta = parseFloat(montoTarjeta) || 0;
      return efectivo + tarjeta >= total;
    }
    return false;
  };

  // Procesar pago
  const procesarPago = async () => {
    if (!pagoValido()) return;

    setProcesando(true);

    // Simular pequeño delay para UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Llamar al callback con los datos del pago
    const pagoData = {
      metodo,
      total,
      montoRecibido: metodo === "efectivo" ? parseFloat(montoRecibido) : null,
      montoEfectivo: metodo === "mixto" ? parseFloat(montoEfectivo) : null,
      montoTarjeta: metodo === "mixto" ? parseFloat(montoTarjeta) : null,
      vuelto: calcularVuelto(),
    };

    const resultado = await onConfirm(pagoData);

    if (resultado.success) {
      setExito(true);
      // Cerrar automáticamente después de 2 segundos
      setTimeout(() => {
        handleClose();
      }, 2000);
    } else {
      setProcesando(false);
      alert("Error al procesar la venta: " + resultado.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Procesar Pago</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {exito ? (
            // Pantalla de Éxito
            <div className="text-center py-8">
              <div className="mx-auto w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-green-400 mb-2">
                ¡Venta Exitosa!
              </h3>
              <p className="text-slate-400">
                La transacción se ha completado correctamente.
              </p>
              {calcularVuelto() > 0 && (
                <p className="text-3xl font-bold text-yellow-400 mt-4">
                  Vuelto: ${calcularVuelto().toFixed(2)}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Total a Pagar */}
              <div className="text-center mb-6">
                <p className="text-slate-400 text-sm">Total a pagar</p>
                <p className="text-4xl font-black text-green-400">
                  ${total.toFixed(2)}
                </p>
              </div>

              {/* Selector de Método */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <button
                  onClick={() => setMetodo("efectivo")}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1 transition border-2 ${
                    metodo === "efectivo"
                      ? "bg-green-900/30 border-green-500 text-green-400"
                      : "bg-slate-700 border-transparent text-slate-300 hover:border-slate-500"
                  }`}
                >
                  <Banknote size={24} />
                  <span className="text-sm font-medium">Efectivo</span>
                </button>
                <button
                  onClick={() => setMetodo("tarjeta")}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1 transition border-2 ${
                    metodo === "tarjeta"
                      ? "bg-blue-900/30 border-blue-500 text-blue-400"
                      : "bg-slate-700 border-transparent text-slate-300 hover:border-slate-500"
                  }`}
                >
                  <CreditCard size={24} />
                  <span className="text-sm font-medium">Tarjeta</span>
                </button>
                <button
                  onClick={() => setMetodo("mixto")}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1 transition border-2 ${
                    metodo === "mixto"
                      ? "bg-purple-900/30 border-purple-500 text-purple-400"
                      : "bg-slate-700 border-transparent text-slate-300 hover:border-slate-500"
                  }`}
                >
                  <Wallet size={24} />
                  <span className="text-sm font-medium">Mixto</span>
                </button>
              </div>

              {/* Opción de Cuenta Corriente (Solo si hay cliente) */}
              {clientName && (
                <button
                  onClick={() => setMetodo("checking_account")}
                  className={`w-full mb-6 p-3 rounded-xl flex items-center justify-center gap-2 transition border-2 ${
                    metodo === "checking_account"
                      ? "bg-orange-900/30 border-orange-500 text-orange-400"
                      : "bg-slate-700 border-transparent text-slate-300 hover:border-slate-500"
                  }`}
                >
                  <UserCheck size={24} />
                  <span className="font-medium">
                    Cuenta Corriente ({clientName})
                  </span>
                </button>
              )}

              {/* Inputs según método */}
              {metodo === "checking_account" && (
                <div className="text-center p-6 bg-slate-900 rounded-xl mb-4 border border-orange-500/30">
                  <p className="text-orange-400 font-bold text-lg mb-2">
                    Venta a Crédito
                  </p>
                  <p className="text-slate-400">
                    Se asignará una deuda de{" "}
                    <strong className="text-white">${total.toFixed(2)}</strong>{" "}
                    al cliente <strong>{clientName}</strong>.
                  </p>
                </div>
              )}

              {metodo === "efectivo" && (
                <div className="space-y-4">
                  <div>
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
                  </div>
                  {parseFloat(montoRecibido) > 0 && (
                    <div className="text-center p-4 bg-slate-900 rounded-xl">
                      <p className="text-sm text-slate-400">Vuelto</p>
                      <p className="text-3xl font-bold text-yellow-400">
                        ${calcularVuelto().toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {metodo === "tarjeta" && (
                <div className="text-center p-6 bg-slate-900 rounded-xl">
                  <CreditCard
                    className="mx-auto mb-2 text-blue-400"
                    size={48}
                  />
                  <p className="text-slate-400">
                    Pase la tarjeta por el lector o ingrese el pago manualmente.
                  </p>
                </div>
              )}

              {metodo === "mixto" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">
                      Monto en Efectivo
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
                      Monto con Tarjeta
                    </label>
                    <input
                      type="number"
                      value={montoTarjeta}
                      onChange={(e) => setMontoTarjeta(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl text-xl text-white text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
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
            </>
          )}
        </div>

        {/* Footer - Botón Confirmar */}
        {!exito && (
          <div className="p-4 bg-slate-900 border-t border-slate-700">
            <button
              onClick={procesarPago}
              disabled={!pagoValido() || procesando}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition ${
                pagoValido() && !procesando
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-slate-700 text-slate-500 cursor-not-allowed"
              }`}
            >
              {procesando ? (
                <span className="animate-pulse">Procesando...</span>
              ) : (
                <>
                  <CheckCircle size={24} /> Confirmar Pago
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
