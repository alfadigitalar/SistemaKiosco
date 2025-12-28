import React, { useState, useEffect } from "react";
import {
  X,
  History,
  Plus,
  Minus,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

/**
 * Modal para ver historial de stock y realizar ajustes
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - product: objeto producto
 * - onStockUpdate: () => void (callback para recargar tabla inventario)
 */
export default function StockDetailModal({
  isOpen,
  onClose,
  product,
  onStockUpdate,
}) {
  const [mode, setMode] = useState("history"); // 'history', 'add'
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    type: "purchase", // purchase, adjustment_add, adjustment_sub, loss, return
    quantity: "",
    reason: "",
  });

  useEffect(() => {
    if (isOpen && product) {
      loadHistory();
      setMode("history");
      setFormData({ type: "purchase", quantity: "", reason: "" });
    }
  }, [isOpen, product]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await window.api.getStockMovements(product.id);
      setMovements(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar historial");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      return toast.error("Ingrese una cantidad válida");
    }

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      await window.api.addStockMovement({
        product_id: product.id,
        type: formData.type,
        quantity: parseFloat(formData.quantity),
        reason: formData.reason,
        user_id: user.id || 1, // Fallback admin
      });

      toast.success("Movimiento registrado");
      onStockUpdate(); // Recargar inventario global
      loadHistory(); // Recargar historial local
      setMode("history"); // Volver a la lista
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar movimiento");
    }
  };

  if (!isOpen || !product) return null;

  const getTypeLabel = (type) => {
    switch (type) {
      case "purchase":
        return {
          label: "Compra / Reposición",
          color: "text-green-600 bg-green-100",
          icon: <ArrowUp size={16} />,
        };
      case "adjustment_add":
        return {
          label: "Ajuste (+)",
          color: "text-blue-600 bg-blue-100",
          icon: <Plus size={16} />,
        };
      case "adjustment_sub":
        return {
          label: "Ajuste (-)",
          color: "text-orange-600 bg-orange-100",
          icon: <Minus size={16} />,
        };
      case "sale":
        return {
          label: "Venta",
          color: "text-slate-600 bg-slate-100",
          icon: <ArrowDown size={16} />,
        };
      case "loss":
        return {
          label: "Pérdida / Rotura",
          color: "text-red-600 bg-red-100",
          icon: <AlertTriangle size={16} />,
        };
      case "return":
        return {
          label: "Devolución Cliente",
          color: "text-purple-600 bg-purple-100",
          icon: <ArrowUp size={16} />,
        };
      default:
        return { label: type, color: "text-gray-600 bg-gray-100", icon: null };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <History className="text-purple-600" />
              Control de Stock: {product.name}
            </h2>
            <p className="text-sm text-slate-500">
              Stock Actual:{" "}
              <b className="text-slate-800 dark:text-slate-200">
                {product.stock_quantity} {product.measurement_unit}
              </b>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {mode === "history" ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg dark:text-white">
                  Historial de Movimientos
                </h3>
                <button
                  onClick={() => setMode("add")}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-purple-900/20 active:scale-95 transition flex items-center gap-2"
                >
                  <Plus size={18} /> Nuevo Movimiento
                </button>
              </div>

              {loading ? (
                <p className="text-center py-8 text-slate-500">Cargando...</p>
              ) : movements.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <p className="text-slate-500">
                    No hay movimientos registrados.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3 text-right">Cant.</th>
                        <th className="px-4 py-3">Razón / Usuario</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {movements.map((mov) => {
                        const typeInfo = getTypeLabel(mov.type);
                        return (
                          <tr
                            key={mov.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition dark:text-slate-300"
                          >
                            <td className="px-4 py-3">
                              {new Date(mov.timestamp).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold ${typeInfo.color}`}
                              >
                                {typeInfo.icon} {typeInfo.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold">
                              {mov.quantity}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                              <div className="font-medium text-slate-700 dark:text-slate-300">
                                {mov.reason || "-"}
                              </div>
                              <div>{mov.user_name || "Desconocido"}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            // ADD FORM
            <form
              onSubmit={handleSubmit}
              className="max-w-md mx-auto space-y-4 py-4 animate-in slide-in-from-right-4 duration-300"
            >
              <h3 className="font-bold text-lg dark:text-white text-center mb-6">
                Registrar Ajuste de Stock
              </h3>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Tipo de Movimiento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: "purchase" })
                    }
                    className={`p-3 rounded-lg border-2 text-sm font-bold transition ${
                      formData.type === "purchase"
                        ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-500"
                    }`}
                  >
                    <ArrowUp className="mx-auto mb-1" /> Compra / Entrada (+
                    Stock)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "loss" })}
                    className={`p-3 rounded-lg border-2 text-sm font-bold transition ${
                      formData.type === "loss"
                        ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-500"
                    }`}
                  >
                    <AlertTriangle className="mx-auto mb-1" /> Pérdida / Rotura
                    (- Stock)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: "adjustment_add" })
                    }
                    className={`p-3 rounded-lg border-2 text-sm font-bold transition ${
                      formData.type === "adjustment_add"
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-500"
                    }`}
                  >
                    <Plus className="mx-auto mb-1" /> Ajuste Positivo
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: "adjustment_sub" })
                    }
                    className={`p-3 rounded-lg border-2 text-sm font-bold transition ${
                      formData.type === "adjustment_sub"
                        ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-500"
                    }`}
                  >
                    <Minus className="mx-auto mb-1" /> Ajuste Negativo
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Cantidad ({product.measurement_unit})
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                  placeholder="0.00"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Motivo / Nota
                </label>
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                  rows="2"
                  placeholder="Ej: Llegó camión, Se rompió una botella..."
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMode("history")}
                  className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 active:scale-95 transition"
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
