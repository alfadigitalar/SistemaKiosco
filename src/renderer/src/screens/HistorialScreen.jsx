import React, { useState, useEffect } from "react";
import { Search, Calendar, Eye, ChevronRight, X } from "lucide-react";
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

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden bg-slate-900 text-white">
      {/* Header y Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Historial de Ventas</h1>
          <p className="text-slate-400">Consultar transacciones pasadas</p>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex items-end gap-3 bg-slate-800 p-3 rounded-xl border border-slate-700"
        >
          <div>
            <label className="text-xs text-slate-400 block mb-1 ml-1">
              Desde
            </label>
            <input
              type="date"
              className="bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1 ml-1">
              Hasta
            </label>
            <input
              type="date"
              className="bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg transition"
          >
            <Search size={18} />
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto bg-slate-800 rounded-xl shadow-lg border border-slate-700">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-900/50 sticky top-0 z-10">
            <tr>
              <th className="p-4 text-slate-400 font-medium">ID</th>
              <th className="p-4 text-slate-400 font-medium">Fecha</th>
              <th className="p-4 text-slate-400 font-medium">Cliente</th>
              <th className="p-4 text-slate-400 font-medium">Pago</th>
              <th className="p-4 text-slate-400 font-medium">Usuario</th>
              <th className="p-4 text-slate-400 font-medium text-right">
                Total
              </th>
              <th className="p-4 text-slate-400 font-medium text-center">
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
                  className="border-b border-slate-700 hover:bg-slate-700/30 transition"
                >
                  <td className="p-4 font-mono text-slate-400">#{sale.id}</td>
                  <td className="p-4 text-sm">
                    {new Date(sale.timestamp).toLocaleString()}
                  </td>
                  <td className="p-4 font-medium text-white">
                    {sale.client_name || (
                      <span className="text-slate-500 italic">
                        Consumidor Final
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm capitalize text-slate-300">
                    {sale.payment_method === "checking_account"
                      ? "Cta. Cte."
                      : sale.payment_method}
                  </td>
                  <td className="p-4 text-sm text-slate-400">
                    {sale.user_name}
                  </td>
                  <td className="p-4 text-right font-bold text-green-400">
                    ${sale.total_amount.toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => openDetails(sale)}
                      className="p-2 bg-blue-900/30 text-blue-400 rounded-lg hover:bg-blue-900/50 transition"
                    >
                      <Eye size={18} />
                    </button>
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
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">
                  Detalle Venta #{selectedSale.id}
                </h2>
                <p className="text-sm text-slate-400">
                  {new Date(selectedSale.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-slate-400 hover:text-white"
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
                    <tr className="text-slate-500 border-b border-slate-700">
                      <th className="pb-3 font-normal">Producto</th>
                      <th className="pb-3 font-normal text-right">Cant.</th>
                      <th className="pb-3 font-normal text-right">
                        Precio Unit.
                      </th>
                      <th className="pb-3 font-normal text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {saleDetails.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3">
                          <div className="font-medium text-white">
                            {item.product_name}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {item.barcode}
                          </div>
                        </td>
                        <td className="py-3 text-right text-white">
                          {item.quantity}
                        </td>
                        <td className="py-3 text-right text-slate-400">
                          ${item.unit_price_at_sale}
                        </td>
                        <td className="py-3 text-right font-bold text-white">
                          ${item.subtotal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-6 border-t border-slate-700 bg-slate-900/50 flex justify-end items-center gap-4 rounded-b-2xl">
              <span className="text-lg text-slate-400">Total Venta:</span>
              <span className="text-3xl font-black text-green-400">
                ${selectedSale.total_amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialScreen;
