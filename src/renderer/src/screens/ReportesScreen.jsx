import React, { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  BarChart3,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useConfig } from "../context/ConfigContext";

const ReportesScreen = () => {
  const { kioskName } = useConfig();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Helper to get local ISO date (YYYY-MM-DD)
  const getLocalDate = (dateObj = new Date()) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Default: Últimos 30 días (Local Time)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return getLocalDate(d);
  });
  const [endDate, setEndDate] = useState(() => getLocalDate(new Date()));

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await window.api.getAdvancedReport({
        startDate,
        endDate,
      });
      if (data.error) throw new Error(data.error);
      setReportData(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al generar reporte");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []); // Initial load

  const handleExportPDF = () => {
    if (!reportData) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Reporte Financiero - ${kioskName}`, 14, 20);

      doc.setFontSize(12);
      doc.text(`Desde: ${startDate}  Hasta: ${endDate}`, 14, 30);

      // Summary Table
      autoTable(doc, {
        startY: 35,
        head: [["Concepto", "Valor"]],
        body: [
          [
            "Ventas Totales",
            `$${reportData.summary.totalSales.toLocaleString()}`,
          ],
          [
            "Ganancia Estimada",
            `$${reportData.summary.estimatedProfit.toLocaleString()}`,
          ],
          ["Transacciones", reportData.summary.totalTransactions],
          [
            "Ticket Promedio",
            `$${reportData.summary.averageTicket.toLocaleString()}`,
          ],
        ],
      });

      // Top Products Table
      doc.text("Productos Más Vendidos", 14, doc.lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Producto", "Cantidad", "Total $"]],
        body: reportData.topProducts.map((p) => [
          p.name,
          p.quantity,
          `$${p.total.toLocaleString()}`,
        ]),
      });

      doc.save(`Reporte_${startDate}_${endDate}.pdf`);
      toast.success("PDF descargado");
    } catch (e) {
      toast.error("Error al exportar PDF");
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    try {
      // 1. Ventas por Día
      let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for Excel
      csvContent += "REPORTE DE VENTAS POR DIA\n";
      csvContent += `Desde: ${startDate},Hasta: ${endDate}\n\n`;
      csvContent += "Fecha,Total Ventas\n";

      reportData.salesByDay.forEach((row) => {
        csvContent += `${row.date},${row.total.toFixed(2)}\n`;
      });

      // 2. Top Productos (Append to same file or separate? Let's do separate sections)
      csvContent += "\n\nPRODUCTOS MAS VENDIDOS\n";
      csvContent += "Producto,Cantidad,Total $\n";
      reportData.topProducts.forEach((p) => {
        // Escape commas in names
        const cleanName = p.name.replace(/,/g, " ");
        csvContent += `${cleanName},${p.quantity},${p.total.toFixed(2)}\n`;
      });

      csvContent += "\n\nRESUMEN GENERAL\n";
      csvContent += "Concepto,Valor\n";
      csvContent += `Ventas Totales,${reportData.summary.totalSales.toFixed(
        2
      )}\n`;
      csvContent += `Ganancia Estimada,${reportData.summary.estimatedProfit.toFixed(
        2
      )}\n`;
      csvContent += `Transacciones,${reportData.summary.totalTransactions}\n`;
      csvContent += `Ticket Promedio,${reportData.summary.averageTicket.toFixed(
        2
      )}\n`;

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `Reporte_Datos_${startDate}_${endDate}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV generado exitosamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al exportar CSV");
    }
  };

  // Simple CSS Bar Chart Component
  const BarChart = ({ data }) => {
    if (!data || data.length === 0)
      return <div className="text-gray-400">Sin datos para graficar</div>;

    const maxVal = Math.max(...data.map((d) => d.total));

    return (
      <div className="flex items-end justify-between h-64 gap-2 w-full pt-6">
        {data.map((item, idx) => {
          const heightPercent = maxVal > 0 ? (item.total / maxVal) * 100 : 0;

          // Parse manual de YYYY-MM-DD para evitar errores de UTC
          const [y, m, d] = item.date.split("-");
          const day = d;
          const month = m;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center justify-end group relative min-w-[20px] h-full"
            >
              {/* Tooltip */}
              <div className="absolute -top-12 bg-slate-800 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                <p className="font-bold">
                  {day}/{month}/{y}
                </p>
                <p>${item.total.toLocaleString()}</p>
              </div>

              {/* Bar */}
              <div
                className="w-full bg-blue-500 rounded-t-md hover:bg-blue-600 transition-all duration-300 relative"
                style={{ height: `${heightPercent}%` }}
              ></div>

              {/* Label */}
              <span className="text-[10px] text-slate-500 mt-2 rotate-45 origin-left translate-y-2 w-full overflow-hidden truncate">
                {day}/{month}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="text-blue-600" /> Reportes Avanzados
          </h1>
          <p className="text-slate-500">Analice el rendimiento de su negocio</p>
        </div>

        <div className="flex items-end gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div>
            <label className="block text-xs text-slate-400 ml-1">Desde</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border border-slate-300 dark:border-slate-600 rounded p-1 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 ml-1">Hasta</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border border-slate-300 dark:border-slate-600 rounded p-1 text-sm outline-none"
            />
          </div>
          <button
            onClick={fetchReport}
            className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition"
          >
            <Calendar size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : reportData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                  <DollarSign size={24} />
                </div>
              </div>
              <p className="text-slate-500 text-sm">Ventas Totales</p>
              <h3 className="text-2xl font-bold">
                ${reportData.summary.totalSales.toLocaleString()}
              </h3>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                  <TrendingUp size={24} />
                </div>
              </div>
              <p className="text-slate-500 text-sm">Ganancia Estimada</p>
              <h3 className="text-2xl font-bold">
                ${reportData.summary.estimatedProfit.toLocaleString()}
              </h3>
              <p className="text-xs text-slate-400">
                *Based on Sale Price - Cost Price
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                  <ShoppingBag size={24} />
                </div>
              </div>
              <p className="text-slate-500 text-sm">Transacciones</p>
              <h3 className="text-2xl font-bold">
                {reportData.summary.totalTransactions}
              </h3>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
                  <BarChart3 size={24} />
                </div>
              </div>
              <p className="text-slate-500 text-sm">Ticket Promedio</p>
              <h3 className="text-2xl font-bold">
                ${Math.round(reportData.summary.averageTicket).toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Main Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">Evolución de Ventas</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 text-sm text-green-600 hover:bg-green-50 px-3 py-1 rounded-lg transition"
                    title="Exportar datos para Excel"
                  >
                    <FileSpreadsheet size={16} /> CSV / Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg transition"
                  >
                    <Download size={16} /> PDF
                  </button>
                </div>
              </div>
              <div className="w-full h-auto">
                <BarChart data={reportData.salesByDay} />
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
              <h2 className="text-lg font-bold mb-4">Top 10 Productos</h2>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {reportData.topProducts.map((product, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1 text-slate-800 dark:text-white">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {product.quantity} vendidos
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                      ${product.total.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <BarChart3 size={48} className="mb-4 opacity-20" />
          <p>Seleccione un rango de fechas y genere el reporte</p>
        </div>
      )}
    </div>
  );
};

export default ReportesScreen;
