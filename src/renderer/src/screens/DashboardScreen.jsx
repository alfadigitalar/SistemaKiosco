import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Calendar,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const DashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [expiringCount, setExpiringCount] = useState(0);

  // Profit Stats
  const [profitToday, setProfitToday] = useState(null);
  const [profitMonth, setProfitMonth] = useState(null);
  const [customDate, setCustomDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [customProfit, setCustomProfit] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);

  // Close calendar on outside click or scroll
  useEffect(() => {
    if (!showCalendar) return;
    const handleClose = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    const handleScroll = () => setShowCalendar(false);
    document.addEventListener("mousedown", handleClose);
    const scrollContainer = document.querySelector(".overflow-y-auto");
    if (scrollContainer)
      scrollContainer.addEventListener("scroll", handleScroll);
    return () => {
      document.removeEventListener("mousedown", handleClose);
      if (scrollContainer)
        scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [showCalendar]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await window.api.getDashboardStats();
        setStats(data);

        // Helper for Local YYYY-MM-DD
        const getLocalISO = () => {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, "0");
          const day = String(now.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        // Fetch Profit Today
        const todayStr = getLocalISO();
        const todayStats = await window.api.getProfitStats({
          startDate: todayStr,
          endDate: todayStr,
        });
        setProfitToday(todayStats);

        // Fetch Profit Month
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        // Format dates manually to avoid UTC shift
        const fYear = firstDay.getFullYear();
        const fMonth = String(firstDay.getMonth() + 1).padStart(2, "0");
        const fDay = String(firstDay.getDate()).padStart(2, "0");
        const firstDayStr = `${fYear}-${fMonth}-${fDay}`;

        const lYear = lastDay.getFullYear();
        const lMonth = String(lastDay.getMonth() + 1).padStart(2, "0");
        const lDay = String(lastDay.getDate()).padStart(2, "0");
        const lastDayStr = `${lYear}-${lMonth}-${lDay}`;

        const monthStats = await window.api.getProfitStats({
          startDate: firstDayStr,
          endDate: lastDayStr,
        });
        setProfitMonth(monthStats);

        // Fetch Initial Custom (Today)
        setCustomProfit(todayStats);

        // Update Custom Date Picker to Local Today
        setCustomDate(todayStr);

        // FEFO: Fetch expiring products count
        const expiringProducts = await window.api.getExpiringProducts(7);
        setExpiringCount(expiringProducts?.length || 0);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

          {/* FEFO: Productos por Vencer */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Por Vencer
                </p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {expiringCount}{" "}
                  <span className="text-sm font-normal text-slate-400">
                    prod.
                  </span>
                </h3>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                <Calendar size={20} />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
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
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-visible group hover:shadow-md transition-all border-l-4 border-l-cyan-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Histórico
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
                  {(() => {
                    const [y, m, d] = customDate.split("-").map(Number);
                    return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                  })()}
                </p>
              </div>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className={`p-2 rounded-lg transition-colors ${
                  showCalendar
                    ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                    : "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-200 dark:hover:bg-cyan-900/50"
                }`}
              >
                <Calendar size={20} />
              </button>
            </div>
            <div>
              <span className="text-xs text-slate-400">Ganancia:</span>
              <h3 className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                $
                {customProfit?.totalProfit?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>

            {/* Popup Calendar */}
            {showCalendar && (
              <>
                <div
                  ref={calendarRef}
                  className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl shadow-black/20 p-4 w-72"
                >
                  {(() => {
                    const [y, m, d] = customDate.split("-").map(Number);
                    const viewMonth = m - 1;
                    const viewYear = y;
                    const firstOfMonth = new Date(viewYear, viewMonth, 1);
                    const startDay =
                      firstOfMonth.getDay() === 0
                        ? 6
                        : firstOfMonth.getDay() - 1;
                    const daysInMonth = new Date(
                      viewYear,
                      viewMonth + 1,
                      0,
                    ).getDate();
                    const weeks = [];
                    let dayCounter = 1 - startDay;
                    for (let w = 0; w < 6; w++) {
                      const week = [];
                      for (let wd = 0; wd < 7; wd++) {
                        week.push(dayCounter);
                        dayCounter++;
                      }
                      if (week[0] > daysInMonth) break;
                      weeks.push(week);
                    }
                    const prevMonth = () => {
                      const prev = new Date(viewYear, viewMonth - 1, 1);
                      setCustomDate(
                        `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-01`,
                      );
                    };
                    const nextMonth = () => {
                      const next = new Date(viewYear, viewMonth + 1, 1);
                      setCustomDate(
                        `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`,
                      );
                    };
                    const selectDay = (day) => {
                      setCustomDate(
                        `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
                      );
                      setShowCalendar(false);
                    };
                    const monthName = firstOfMonth.toLocaleDateString("es-AR", {
                      month: "long",
                      year: "numeric",
                    });
                    const dayNames = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
                    const today = new Date();
                    const isToday = (day) =>
                      day === today.getDate() &&
                      viewMonth === today.getMonth() &&
                      viewYear === today.getFullYear();
                    const isSelected = (day) =>
                      day === d && viewMonth === m - 1 && viewYear === y;
                    return (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={prevMonth}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">
                            {monthName}
                          </span>
                          <button
                            onClick={nextMonth}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                        <div className="grid grid-cols-7 mb-1">
                          {dayNames.map((dn) => (
                            <div
                              key={dn}
                              className="text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 py-1"
                            >
                              {dn}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-0.5">
                          {weeks.map((week, wi) =>
                            week.map((day, di) => {
                              const inMonth = day >= 1 && day <= daysInMonth;
                              return (
                                <button
                                  key={`${wi}-${di}`}
                                  onClick={() => inMonth && selectDay(day)}
                                  disabled={!inMonth}
                                  className={`text-xs h-8 w-full rounded-lg transition-all duration-150 font-medium
                                    ${!inMonth ? "text-transparent cursor-default" : ""}
                                    ${inMonth && !isSelected(day) && !isToday(day) ? "text-slate-600 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-600 dark:hover:text-cyan-400 cursor-pointer" : ""}
                                    ${inMonth && isSelected(day) ? "bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/30" : ""}
                                    ${inMonth && isToday(day) && !isSelected(day) ? "bg-slate-100 dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 font-bold ring-1 ring-cyan-500/30" : ""}
                                  `}
                                >
                                  {inMonth ? day : ""}
                                </button>
                              );
                            }),
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const now = new Date();
                            setCustomDate(
                              `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
                            );
                            setShowCalendar(false);
                          }}
                          className="mt-3 w-full text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 py-2 rounded-lg transition-colors border border-slate-100 dark:border-slate-700"
                        >
                          Hoy
                        </button>
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/* SECCIÓN 3: GRÁFICOS Y TOP PRODUCTS                   */}
      {/* ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-6 flex-1 min-h-[300px]">
        {/* Gráfico Simple de Ventas (Barras usando CSS) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col">
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
                ...stats.salesChartData.map((d) => d.total),
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
                    {(() => {
                      // Parsear fecha manualmente para evitar problemas de UTC
                      const [y, m, d] = item.date.split("-");
                      const localDate = new Date(
                        parseInt(y),
                        parseInt(m) - 1,
                        parseInt(d),
                      );
                      return localDate.toLocaleDateString("es-ES", {
                        weekday: "short",
                        day: "numeric",
                      });
                    })()}
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
      </div>
    </div>
  );
};

export default DashboardScreen;
