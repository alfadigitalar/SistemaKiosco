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

  // Profit Stats
  const [profitToday, setProfitToday] = useState(null);
  const [profitMonth, setProfitMonth] = useState(null);
  const [customDate, setCustomDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [customProfit, setCustomProfit] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await window.api.getDashboardStats();
        setStats(data);

        // Fetch Profit Today
        const todayStr = new Date().toISOString().split("T")[0];
        const todayStats = await window.api.getProfitStats({
          startDate: todayStr,
          endDate: todayStr,
        });
        setProfitToday(todayStats);

        // Fetch Profit Month
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0];
        const monthStats = await window.api.getProfitStats({
          startDate: firstDay,
          endDate: lastDay,
        });
        setProfitMonth(monthStats);

        // Fetch Initial Custom (Today)
        setCustomProfit(todayStats);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Handler for custom date
  useEffect(() => {
    const fetchCustom = async () => {
      if (!customDate) return;
      const data = await window.api.getProfitStats({
        startDate: customDate,
        endDate: customDate,
      });
      setCustomProfit(data);
    };
    fetchCustom();
  }, [customDate]);

  if (loading)
    return <div className="p-8 text-white">Cargando Dashboard...</div>;

  return (
    <div className="p-6 h-full flex flex-col gap-6 bg-slate-50 dark:bg-slate-900 overflow-y-auto text-slate-900 dark:text-white transition-colors duration-300">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          Panel de Control
        </h1>
        <div className="text-sm text-slate-500 font-medium">
          {new Date().toLocaleDateString("es-AR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/* SECCIÓN 1: RESUMEN GENERAL (User Specified)          */}
      {/* ════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-4">
          Resumen General
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ventas este Mes */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Ventas Mes
                </p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  ${stats?.totalMonth?.toLocaleString()}
                </h3>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                <Calendar size={20} />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </div>

          {/* Stock Bajo */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Stock Crítico
                </p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {stats?.lowStockCount}{" "}
                  <span className="text-sm font-normal text-slate-400">
                    prod.
                  </span>
                </h3>
              </div>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                <AlertTriangle size={20} />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </div>

          {/* Estado General */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Estado Sistema
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    En Linea
                  </h3>
                </div>
              </div>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/* SECCIÓN 2: ANÁLISIS DE GANANCIAS (Detallado)         */}
      {/* ════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-4">
          Análisis Financiero
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Ventas Hoy */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-blue-500">
            <p className="text-xs text-slate-400 font-bold uppercase">
              Ventas Hoy
            </p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              ${stats?.totalDay?.toLocaleString()}
            </p>
          </div>

          {/* Ganancia Hoy */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-emerald-500">
            <p className="text-xs text-slate-400 font-bold uppercase">
              Ganancia Real Hoy
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              $
              {profitToday?.totalProfit?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* Ganancia Mes */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-indigo-500">
            <p className="text-xs text-slate-400 font-bold uppercase">
              Ganancia Real Mes
            </p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              $
              {profitMonth?.totalProfit?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* Calculadora Histórica */}
          <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-500 uppercase">
                Histórico
              </span>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="text-xs p-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded"
              />
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 mr-2">Ganancia:</span>
              <span className="text-lg font-bold text-slate-700 dark:text-white">
                $
                {customProfit?.totalProfit?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/* SECCIÓN 3: GRÁFICOS Y TOP PRODUCTS                   */}
      {/* ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[300px]">
        {/* Gráfico Simple de Ventas (Barras usando CSS) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">
            Evolución de Ventas (7 días)
          </h2>
          <div className="flex-1 flex items-end gap-2 h-full border-b border-l border-slate-200 dark:border-slate-600 p-4 relative">
            {/* Ejes de guía visual */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
              <div className="border-t border-slate-900 w-full"></div>
              <div className="border-t border-slate-900 w-full"></div>
              <div className="border-t border-slate-900 w-full"></div>
              <div className="border-t border-slate-900 w-full"></div>
            </div>

            {stats?.salesChartData?.map((item) => {
              const maxVal = Math.max(
                ...stats.salesChartData.map((d) => d.total)
              );
              const height = maxVal > 0 ? (item.total / maxVal) * 100 : 0;
              return (
                <div
                  key={item.date}
                  className="flex-1 flex flex-col items-center gap-2 group z-10 h-full justify-end"
                >
                  <div
                    className="w-full max-w-[40px] bg-blue-500 rounded-t-sm hover:bg-blue-400 transition-all relative group shadow-lg"
                    style={{ height: `${height}%`, minHeight: "4px" }}
                  >
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-20 pointer-events-none shadow-xl">
                      ${item.total.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center font-medium">
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
                Sin datos recientes
              </div>
            )}
          </div>
        </div>

        {/* Productos Top */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <ShoppingBag
              size={20}
              className="text-purple-600 dark:text-purple-400"
            />
            Top Productos
          </h2>
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <ul className="space-y-3">
              {stats?.topProducts?.map((prod, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : index === 1
                          ? "bg-slate-200 text-slate-700"
                          : index === 2
                          ? "bg-orange-100 text-orange-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {prod.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg shadow-sm whitespace-nowrap ml-2">
                    {prod.total_qty} u.
                  </span>
                </li>
              ))}
              {(!stats?.topProducts || stats.topProducts.length === 0) && (
                <p className="text-slate-500 text-sm text-center py-10 opacity-50">
                  Esperando ventas...
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
