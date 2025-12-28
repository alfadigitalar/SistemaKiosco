import React, { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  Eye,
  ChevronRight,
  X,
  Printer,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-hot-toast";

const HistorialScreen = () => {
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modal Detalle
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleDetails, setSaleDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Estado para Devoluciones
  const [returnMode, setReturnMode] = useState(false);
  const [itemsToReturn, setItemsToReturn] = useState({}); // { itemId: quantity }

  // Cargar ventas (inicialmente carga las últimas 100)
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await window.api.getSalesHistory({ startDate, endDate });
      setSales(data);
    } catch (error) {
      toast.error("Error al cargar historial");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []); // Carga inicial

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const openDetails = async (sale) => {
    setSelectedSale(sale);
    setReturnMode(false); // Reset return mode
    setItemsToReturn({});
    setLoadingDetails(true);
    setSaleDetails([]);
    try {
      const details = await window.api.getSaleDetails(sale.id);
      setSaleDetails(details);
    } catch (error) {
      toast.error("Error al cargar detalle");
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleItemReturn = (index, maxQty) => {
    setItemsToReturn((prev) => {
      const newState = { ...prev };
      if (newState[index]) {
        delete newState[index];
      } else {
        newState[index] = maxQty; // Default to max
      }
      return newState;
    });
  };

  const updateReturnQty = (index, qty, max) => {
    if (qty < 1) qty = 1;
    if (qty > max) qty = max;
    setItemsToReturn((prev) => ({ ...prev, [index]: qty }));
  };

  const calculateReturnTotal = () => {
    let total = 0;
    Object.keys(itemsToReturn).forEach((index) => {
      const item = saleDetails[index];
      total += item.unit_price_at_sale * itemsToReturn[index];
    });
    return total;
  };

  const handleProcessReturn = async () => {
    if (Object.keys(itemsToReturn).length === 0) {
      toast.error("Seleccione al menos un producto para devolver");
      return;
    }

    const toastId = toast.loading("Procesando devolución...");
    try {
      const itemsPayload = Object.keys(itemsToReturn).map((index) => ({
        productId: saleDetails[index].product_id,
        quantity: itemsToReturn[index],
        price: saleDetails[index].unit_price_at_sale,
      }));

      await window.api.processReturn({
        saleId: selectedSale.id,
        items: itemsPayload,
        totalRefund: calculateReturnTotal(),
        userId: 1, // TODO: Get actual current user ID from context/auth
        reason: "Devolución en Kiosco",
      });

      toast.success("Devolución procesada correctamente", { id: toastId });
      setSelectedSale(null); // Close modal
      fetchHistory(); // Refresh lists (optional)
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar devolución", { id: toastId });
    }
  };

  const handleReprint = async (sale) => {
    const toastId = toast.loading("Preparando ticket...");
    try {
      // 1. Obtener items
      const details = await window.api.getSaleDetails(sale.id);

      // 2. Mapear items al formato de impresión
      const itemsForTicket = details.map((d) => ({
        quantity: d.quantity,
        name: d.product_name,
        price: d.unit_price_at_sale, // El ticket calcula subtotal
      }));

      // 3. Imprimir
      await window.api.printTicket({
        ticketId: sale.id,
        date: new Date(sale.timestamp).toLocaleString("es-AR"),
        items: itemsForTicket,
        total: sale.total_amount,
      });

      toast.success("Ticket enviado a imprimir", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Error al reimprimir", { id: toastId });
    }
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300">
      {/* Header y Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Historial de Ventas
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Consultar transacciones pasadas
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex items-end gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
        >
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1 ml-1">
              Desde
            </label>
            <input
              type="date"
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1 ml-1">
              Hasta
            </label>
            <input
              type="date"
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg transition shadow-sm"
          >
            <Search size={18} />
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transition-colors">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 transition-colors">
            <tr>
              <th className="p-4 text-slate-500 dark:text-slate-400 font-medium">
                ID
              </th>
              <th className="p-4 text-slate-500 dark:text-slate-400 font-medium">
                Fecha
              </th>
              <th className="p-4 text-slate-500 dark:text-slate-400 font-medium">
                Cliente
              </th>
              <th className="p-4 text-slate-500 dark:text-slate-400 font-medium">
                Pago
              </th>
              <th className="p-4 text-slate-500 dark:text-slate-400 font-medium">
                Usuario
              </th>
              <th className="p-4 text-slate-500 dark:text-slate-400 font-medium text-right">
                Total
              </th>
              <th className="p-4 text-slate-500 dark:text-slate-400 font-medium text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-500">
                  Cargando...
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-500">
                  No se encontraron ventas
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="p-4 font-mono text-slate-500 dark:text-slate-400">
                    #{sale.id}
                  </td>
                  <td className="p-4 text-sm text-slate-700 dark:text-white">
                    {new Date(sale.timestamp).toLocaleString("es-AR", {
                      hour12: false,
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="p-4 font-medium text-slate-800 dark:text-white">
                    {sale.client_name || (
                      <span className="text-slate-400 dark:text-slate-500 italic">
                        Consumidor Final
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm capitalize text-slate-600 dark:text-slate-300">
                    {sale.payment_method === "checking_account"
                      ? "Cta. Cte."
                      : sale.payment_method}
                  </td>
                  <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                    {sale.user_name}
                  </td>
                  <td className="p-4 text-right font-bold text-green-600 dark:text-green-400">
                    ${sale.total_amount.toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleReprint(sale)}
                        className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        title="Re-imprimir Ticket"
                      >
                        <Printer size={18} />
                      </button>
                      <button
                        onClick={() => openDetails(sale)}
                        className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        title="Ver Detalles"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detalle */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[90vh] transition-colors">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  Detalle Venta #{selectedSale.id}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date(selectedSale.timestamp).toLocaleString("es-AR", {
                    hour12: false,
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingDetails ? (
                <div className="text-center py-8 text-slate-500">
                  Cargando items...
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-700">
                      {returnMode && <th className="pb-3 w-10"></th>}
                      <th className="pb-3 font-normal">Producto</th>
                      <th className="pb-3 font-normal text-right">Cant.</th>
                      <th className="pb-3 font-normal text-right">
                        Precio Unit.
                      </th>
                      <th className="pb-3 font-normal text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {saleDetails.map((item, idx) => {
                      const isSelected = !!itemsToReturn[idx];
                      return (
                        <tr
                          key={idx}
                          className={
                            isSelected ? "bg-red-50 dark:bg-red-900/10" : ""
                          }
                        >
                          {returnMode && (
                            <td className="py-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  toggleItemReturn(idx, item.quantity)
                                }
                                className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                              />
                            </td>
                          )}
                          <td className="py-3">
                            <div className="font-medium text-slate-800 dark:text-white">
                              {item.product_name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-500 font-mono">
                              {item.barcode}
                            </div>
                          </td>
                          <td className="py-3 text-right text-slate-700 dark:text-white">
                            {returnMode && isSelected ? (
                              <input
                                type="number"
                                min="1"
                                max={item.quantity}
                                value={itemsToReturn[idx]}
                                onChange={(e) =>
                                  updateReturnQty(
                                    idx,
                                    parseInt(e.target.value),
                                    item.quantity
                                  )
                                }
                                className="w-16 p-1 text-center border rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              item.quantity
                            )}
                          </td>
                          <td className="py-3 text-right text-slate-500 dark:text-slate-400">
                            ${item.unit_price_at_sale}
                          </td>
                          <td className="py-3 text-right font-bold text-slate-800 dark:text-white">
                            $
                            {returnMode && isSelected
                              ? (
                                  item.unit_price_at_sale * itemsToReturn[idx]
                                ).toLocaleString()
                              : item.subtotal.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div
              className={`p-6 border-t border-slate-200 dark:border-slate-700 ${
                returnMode
                  ? "bg-red-50 dark:bg-red-900/20"
                  : "bg-slate-50 dark:bg-slate-900/50"
              } flex justify-between items-center gap-4 rounded-b-2xl transition-colors`}
            >
              <div>
                {!returnMode ? (
                  <button
                    onClick={() => setReturnMode(true)}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium px-4 py-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <RotateCcw size={18} /> Iniciar Devolución
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setReturnMode(false);
                      setItemsToReturn({});
                    }}
                    className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                {returnMode ? (
                  <>
                    <span className="text-lg text-red-600 dark:text-red-400 font-bold">
                      A Reembolsar: ${calculateReturnTotal().toLocaleString()}
                    </span>
                    <button
                      onClick={handleProcessReturn}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all"
                    >
                      Confirmar
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-lg text-slate-500 dark:text-slate-400">
                      Total Venta:
                    </span>
                    <span className="text-3xl font-black text-green-600 dark:text-green-400">
                      ${selectedSale.total_amount.toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialScreen;
