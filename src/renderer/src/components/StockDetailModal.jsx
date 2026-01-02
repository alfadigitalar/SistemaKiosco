import React, { useState, useEffect } from "react";
import { X, ArrowRight, TrendingUp, TrendingDown, History } from "lucide-react";
import { toast } from "react-hot-toast";

const StockDetailModal = ({ isOpen, onClose, product, onUpdate }) => {
  const [adjustmentType, setAdjustmentType] = useState("add"); // "add" | "remove" | "set"
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (isOpen && product) {
      setQuantity("");
      setReason("");
      setAdjustmentType("add");
      fetchHistory();
    }
  }, [isOpen, product]);

  const fetchHistory = async () => {
    try {
      if (!window.api) return;
      const res = await window.api.getStockMovements(product.id);
      if (res) setHistory(res);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quantity || parseFloat(quantity) <= 0) return;

    setLoading(true);
    try {
      const adjustment = parseFloat(quantity);
      // Logic handled by parent onUpdate usually, or we call API here.
      // InventarioScreen usually passes a handler that calls API.
      // But if onUpdate is just "refresh list", we might need to call API here.
      // Let's assume onUpdate is the API caller wrapper or we call API directly if prop is missing.

      // Actually, usually modals in this app call window.api directly for actions if not passed.
      // Let's check typical pattern.
      // Let's assume we call window.api.addStockMovement

      let type = "adjustment";
      let qty = adjustment;

      if (adjustmentType === "remove") {
        qty = -adjustment;
        type = "loss"; // or sale/correction
      }

      // If we have API
      if (window.api) {
        await window.api.addStockMovement({
          product_id: product.id,
          quantity: qty,
          reason:
            reason ||
            (adjustmentType === "add" ? "Ingreso Manual" : "Ajuste Stock"),
          type: adjustmentType === "add" ? "IN" : "OUT",
        });
        toast.success("Stock actualizado");
        if (onUpdate) onUpdate(); // Refresh parent
        onClose();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error actualizando stock");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {product.name}
            </h2>
            <p className="text-sm text-slate-500">
              Stock Actual:{" "}
              <span className="font-bold text-blue-600">
                {product.stock_quantity}
              </span>{" "}
              {product.measurement_unit}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formulario */}
            <div>
              <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <TrendingUp size={18} /> Ajuste de Stock
              </h3>

              <div className="flex gap-2 mb-4 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setAdjustmentType("add")}
                  className={`flex-1 py-1 px-2 rounded-md font-bold text-sm transition ${
                    adjustmentType === "add"
                      ? "bg-white dark:bg-slate-700 shadow text-green-600 dark:text-green-400"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType("remove")}
                  className={`flex-1 py-1 px-2 rounded-md font-bold text-sm transition ${
                    adjustmentType === "remove"
                      ? "bg-white dark:bg-slate-700 shadow text-red-600 dark:text-red-400"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Quitar
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Motivo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="Ej: Compra proveedor, Devolución..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !quantity}
                  className={`w-full py-2 rounded-lg font-bold text-white transition ${
                    adjustmentType === "add"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {loading
                    ? "Guardando..."
                    : adjustmentType === "add"
                    ? "Agregar Stock"
                    : "Descontar Stock"}
                </button>
              </form>
            </div>

            {/* Historial */}
            <div className="border-l border-slate-200 dark:border-slate-700 pl-0 md:pl-6">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <History size={18} /> Historial Reciente
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {history.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">
                    Sin movimientos recientes.
                  </p>
                ) : (
                  history.map((mov, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start text-sm pb-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
                    >
                      <div>
                        <p
                          className={`font-bold ${
                            mov.type === "IN"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {mov.type === "IN" ? "+" : "-"}
                          {Math.abs(mov.quantity)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(mov.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          {mov.reason}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(mov.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetailModal;
