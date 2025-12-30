import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ConfirmationModal from "../components/ConfirmationModal";
import { useConfig } from "../context/ConfigContext";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  Archive,
  ArrowUpCircle,
  ArrowDownCircle,
  Banknote,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";

const CajaScreen = () => {
  const { kioskName, kioskAddress } = useConfig();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const [closingWithRealAmount, setClosingWithRealAmount] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Estados de carga de datos auxiliares
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados para inputs
  const [initialAmount, setInitialAmount] = useState("");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDesc, setMovementDesc] = useState("");
  const [movementType, setMovementType] = useState("withdrawal"); // 'withdrawal' | 'entry'

  // Cargar datos al montar y al refrescar
  useEffect(() => {
    const fetchData = async () => {
      console.log("CajaScreen: Iniciando fetchData...");
      setLoading(true);
      try {
        console.log("CajaScreen: Llamando a getCurrentSession...");
        const currentSession = await window.api.getCurrentSession();
        console.log("CajaScreen: currentSession recibido:", currentSession);

        setSession(currentSession);

        if (currentSession) {
          console.log("CajaScreen: Llamando a getCashSummary...");
          const sum = await window.api.getCashSummary(currentSession.id);
          console.log("CajaScreen: summary recibido:", sum);
          setSummary(sum);

          console.log("CajaScreen: Llamando a getMovements...");
          const movs = await window.api.getMovements(20);
          console.log("CajaScreen: movements recibidos:", movs);
          setMovements(movs);
        } else {
          console.log("CajaScreen: No hay sesión activa.");
        }
      } catch (error) {
        console.error("CajaScreen Error:", error);
        toast.error("Error al cargar datos de caja: " + error.message);
      } finally {
        console.log("CajaScreen: Finalizando loading...");
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshKey]);

  // PDF Report Generation
  const generateCloseReportPDF = (
    closedSession,
    finalSummary,
    sessionMovements,
    realAmount
  ) => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.setTextColor(40);
      doc.text("Reporte de Cierre de Caja", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(kioskName || "Kubo Kiosco", 14, 28);
      doc.text(`Dirección: ${kioskAddress || "-"}`, 14, 33);
      doc.text(
        `Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        14,
        38
      );

      // Resumen Principal
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Resumen Financiero", 14, 50);

      const summaryData = [
        ["Monto Inicial", `$${finalSummary.initialAmount?.toLocaleString()}`],
        [
          "Ventas (Efectivo)",
          `$${finalSummary.totalSalesCash?.toLocaleString()}`,
        ],
        ["Total Entradas", `$${finalSummary.totalIn?.toLocaleString()}`],
        ["Total Salidas", `-$${finalSummary.totalOut?.toLocaleString()}`],
        ["TOTAL SISTEMA", `$${finalSummary.finalBalance?.toLocaleString()}`],
        ["ARQUEO (REAL)", `$${(realAmount || 0)?.toLocaleString()}`],
        [
          "DIFERENCIA",
          `$${(
            (realAmount || 0) - finalSummary.finalBalance
          ).toLocaleString()}`,
        ],
      ];

      autoTable(doc, {
        startY: 55,
        head: [["Concepto", "Monto"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [30, 41, 59] }, // Slate-800
        columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
      });

      // Tabla de Movimientos
      if (sessionMovements && sessionMovements.length > 0) {
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.text("Detalle de Movimientos", 14, finalY);

        const movRows = sessionMovements.map((m) => [
          new Date(m.timestamp).toLocaleTimeString(),
          m.type === "entry" ? "INGRESO" : "RETIRO",
          m.description,
          `$${m.amount.toLocaleString()}`,
        ]);

        autoTable(doc, {
          startY: finalY + 5,
          head: [["Hora", "Tipo", "Descripción", "Monto"]],
          body: movRows,
          theme: "striped",
          headStyles: { fillColor: [71, 85, 105] }, // Slate-600
          columnStyles: { 3: { halign: "right" } },
        });
      }

      doc.save(`Cierre_Caja_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Reporte PDF generado");
    } catch (error) {
      console.error("Error PDF:", error);
      toast.error("Error al generar PDF");
    }
  };

  // Abrir Caja
  const handleOpenBox = async (e) => {
    // ... (Existing logic) ...
    e.preventDefault();
    if (!initialAmount || initialAmount < 0)
      return toast.error("Monto inválido");

    try {
      // TODO: Obtener userId real del contexto
      const result = await window.api.openCashSession({
        initialAmount: parseFloat(initialAmount),
        userId: 1,
      });

      if (result.success) {
        toast.success("Caja abierta correctamente");

        // Redirigir al Dashboard una vez abierta
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);

        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión");
    }
  };

  // Solicitar Cierre (Abre Modal)
  const requestCloseBox = () => {
    if (!session || !summary) return;
    setIsConfirmOpen(true);
  };

  // Confirmar Cierre (Ejecuta Acción)
  const confirmCloseBox = async () => {
    try {
      const realAmount = closingWithRealAmount
        ? parseFloat(closingWithRealAmount)
        : 0;

      // Capturar estado actual para el reporte antes de borrarlo
      const closingSession = session;
      const closingSummary = summary;
      const closingMovements = movements;

      const result = await window.api.closeCashSession({
        sessionId: session.id,
        finalAmount: summary.finalBalance,
        totalSales: summary.totalSalesCash,
        totalMovements: summary.totalIn - summary.totalOut,
        realAmount: realAmount,
      });

      if (result.success) {
        toast.success("Caja cerrada exitosamente");

        // Generar PDF con los datos capturados
        // Pasamos realAmount para que salga en el PDF el arqueo
        generateCloseReportPDF(
          closingSession,
          closingSummary,
          closingMovements,
          realAmount
        );

        setSession(null);
        setSummary(null);
        setRefreshKey((prev) => prev + 1);
        setClosingWithRealAmount("");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cerrar caja");
    } finally {
      setIsConfirmOpen(false);
    }
  };

  // Agregar Movimiento
  const handleAddMovement = async (e) => {
    e.preventDefault();
    if (!movementAmount || movementAmount <= 0)
      return toast.error("Monto inválido");
    if (!movementDesc) return toast.error("Ingrese una descripción");

    try {
      const result = await window.api.addCashMovement({
        type: movementType,
        amount: parseFloat(movementAmount),
        description: movementDesc,
        userId: 1, // TODO: User real
      });

      if (result.success) {
        toast.success("Movimiento registrado");
        setMovementAmount("");
        setMovementDesc("");
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error al registrar movimiento");
    }
  };

  if (loading) return <div className="p-8 text-white">Cargando Caja...</div>;

  // VISTA: CAJA CERRADA
  if (!session) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 text-center transition-colors">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
            <Archive size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Caja Cerrada
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Ingrese el monto inicial para comenzar las operaciones del día.
          </p>

          <form onSubmit={handleOpenBox} className="space-y-6">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl py-4 pl-10 pr-4 text-2xl text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              ABRIR CAJA
            </button>
          </form>
        </div>
      </div>
    );
  }

  // VISTA: CAJA ABIERTA
  return (
    <div className="p-6 h-full flex flex-col gap-6 bg-slate-50 dark:bg-slate-900 overflow-y-auto text-slate-900 dark:text-white transition-colors duration-300">
      {/* Header y Acciones Principales */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Banknote className="text-green-600 dark:text-green-400" /> Control
            de Caja
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Abierta el {new Date(session.opened_at).toLocaleString()}
          </p>
        </div>
        <button
          onClick={requestCloseBox}
          className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-900/20 transition flex items-center gap-2"
        >
          <Archive size={20} /> CERRAR CAJA
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Inicial */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
            Monto Inicial
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            ${summary?.initialAmount?.toLocaleString()}
          </p>
        </div>
        {/* Ventas Efectivo */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
            Ventas (Efectivo)
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {user?.role === "admin"
              ? `+$${summary?.totalSalesCash?.toLocaleString()}`
              : "******"}
          </p>
        </div>
        {/* Movimientos */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
            Entradas / Salidas
          </p>
          <div className="flex gap-3 items-baseline">
            <span className="text-green-600 dark:text-green-400 font-bold">
              {user?.role === "admin"
                ? `+$${summary?.totalIn?.toLocaleString()}`
                : "***"}
            </span>
            <span className="text-slate-400 dark:text-slate-500">/</span>
            <span className="text-red-600 dark:text-red-400 font-bold">
              {user?.role === "admin"
                ? `-$${summary?.totalOut?.toLocaleString()}`
                : "***"}
            </span>
          </div>
        </div>
        {/* Total Teórico */}
        <div className="bg-gradient-to-br from-blue-100 to-slate-100 dark:from-blue-900 dark:to-slate-900 p-6 rounded-2xl border border-blue-200 dark:border-blue-700/50 shadow-xl">
          <p className="text-blue-700 dark:text-blue-200 text-sm font-medium mb-1">
            Total en Caja (Teórico)
          </p>
          <p className="text-4xl font-black text-blue-900 dark:text-white">
            {user?.role === "admin"
              ? `$${summary?.finalBalance?.toLocaleString()}`
              : "******"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Formulario de Movimientos */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 h-fit shadow-sm transition-colors">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <DollarSign size={20} /> Registrar Movimiento
          </h2>
          <form onSubmit={handleAddMovement} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setMovementType("entry")}
                className={`p-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition ${
                  movementType === "entry"
                    ? "bg-green-600 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                }`}
              >
                <ArrowUpCircle size={18} /> INGRESO
              </button>
              <button
                type="button"
                onClick={() => setMovementType("withdrawal")}
                className={`p-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition ${
                  movementType === "withdrawal"
                    ? "bg-red-600 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                }`}
              >
                <ArrowDownCircle size={18} /> RETIRO
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                Monto
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                value={movementAmount}
                onChange={(e) => setMovementAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                Descripción
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Compra de hielo, Pago proveedor..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                value={movementDesc}
                onChange={(e) => setMovementDesc(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition shadow-lg mt-2"
            >
              REGISTRAR
            </button>
          </form>
        </div>

        {/* Tabla de Movimientos Recientes */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden shadow-sm transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              Últimos Movimientos
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {movements.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-slate-400 dark:text-slate-500">
                No hay movimientos registrados
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="text-slate-500 dark:text-slate-400 text-xs uppercase bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="p-3">Hora</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {movements.map((mov) => (
                    <tr
                      key={mov.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="p-3 text-slate-500 dark:text-slate-400 text-sm font-mono">
                        {new Date(mov.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-3">
                        {mov.type === "entry" ? (
                          <span className="text-green-600 dark:text-green-400 text-xs font-bold px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded">
                            INGRESO
                          </span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded">
                            RETIRO
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-white text-sm">
                        {mov.description}
                      </td>
                      <td
                        className={`p-3 text-right font-bold text-sm ${
                          mov.type === "entry"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {mov.type === "entry" ? "+" : "-"}$
                        {mov.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Cierre de Caja (Arqueo) */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 p-6 animate-in zoom-in-95">
            <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">
              Cerrar Caja
            </h2>
            <p className="mb-6 text-slate-600 dark:text-slate-400">
              Por favor, realice el arqueo y cuente el dinero físico en caja.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Monto Real (En efectivo)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full text-3xl font-bold p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0.00"
                value={closingWithRealAmount}
                onChange={(e) => setClosingWithRealAmount(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmCloseBox}
                className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg"
              >
                Confirmar Cierre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CajaScreen;
