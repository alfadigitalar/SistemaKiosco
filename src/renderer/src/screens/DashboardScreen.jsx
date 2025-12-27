import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Calendar,
  ShoppingBag,
} from "lucide-react";

const DashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await window.api.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading)
    return <div className="p-8 text-white">Cargando Dashboard...</div>;

  return (
    <div className="p-6 h-full flex flex-col gap-6 bg-slate-900 overflow-y-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Resumen General</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-blue-900/30 rounded-lg text-blue-400">
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-slate-400 text-sm">Ventas Hoy</p>
          <p className="text-3xl font-bold text-white">
            ${stats?.totalDay?.toLocaleString()}
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-purple-900/30 rounded-lg text-purple-400">
              <Calendar size={24} />
            </div>
          </div>
          <p className="text-slate-400 text-sm">Ventas este Mes</p>
          <p className="text-3xl font-bold text-white">
            ${stats?.totalMonth?.toLocaleString()}
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-red-900/30 rounded-lg text-red-400">
              <AlertTriangle size={24} />
            </div>
          </div>
          <p className="text-slate-400 text-sm">Stock Bajo</p>
          <p className="text-3xl font-bold text-white">
            {stats?.lowStockCount}{" "}
            <span className="text-sm font-normal text-slate-500">
              productos
            </span>
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 p-6 rounded-2xl border border-emerald-700/50 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-emerald-900/50 rounded-lg text-emerald-400">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-emerald-200 text-sm">Estado General</p>
          <p className="text-xl font-bold text-white">Operativo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Gráfico Simple de Ventas (Barras usando CSS) */}
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6">
            Evolución de Ventas (7 días)
          </h2>
          <div className="flex-1 flex items-end gap-2 h-64 border-b border-l border-slate-600 p-4">
            {stats?.salesChartData?.map((item) => {
              // Normalizar altura (max 100%)
              const maxVal = Math.max(
                ...stats.salesChartData.map((d) => d.total)
              );
              const height = maxVal > 0 ? (item.total / maxVal) * 100 : 0;
              return (
                <div
                  key={item.date}
                  className="flex-1 flex flex-col items-center gap-2 group"
                >
                  <div
                    className="w-full bg-blue-500/50 rounded-t-lg hover:bg-blue-500 transition-all relative group"
                    style={{ height: `${height}%`, minHeight: "4px" }}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                      ${item.total.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 rotate-0">
                    {new Date(item.date).toLocaleDateString("es-ES", {
                      weekday: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              );
            })}
            {(!stats?.salesChartData || stats.salesChartData.length === 0) && (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                No hay datos suficientes
              </div>
            )}
          </div>
        </div>

        {/* Productos Top */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg overflow-hidden flex flex-col">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ShoppingBag size={20} className="text-purple-400" /> Top Productos
          </h2>
          <div className="flex-1 overflow-y-auto pr-2">
            <ul className="space-y-3">
              {stats?.topProducts?.map((prod, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-500">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-200">
                      {prod.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-purple-900/30 text-purple-400 rounded-full">
                    {prod.total_qty} un.
                  </span>
                </li>
              ))}
              {(!stats?.topProducts || stats.topProducts.length === 0) && (
                <p className="text-slate-500 text-sm text-center py-4">
                  Sin datos de ventas
                </p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
