import React, { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);

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
      setLoading(true);
      try {
        const currentSession = await window.api.getCurrentSession();
        setSession(currentSession);

        if (currentSession) {
          const sum = await window.api.getCashSummary(currentSession.id);
          setSummary(sum);
          const movs = await window.api.getMovements(20);
          setMovements(movs);
        }
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar datos de caja");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshKey]);

  // Abrir Caja
  const handleOpenBox = async (e) => {
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
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  // Cerrar Caja
  const handleCloseBox = async () => {
    if (!session || !summary) return;
    if (
      !window.confirm(
        "¿Seguro que desea cerrar la caja? Esta acción generará el reporte final."
      )
    )
      return;

    try {
      const result = await window.api.closeCashSession({
        sessionId: session.id,
        finalAmount: summary.finalBalance,
        totalSales: summary.totalSalesCash,
        totalMovements: summary.totalIn - summary.totalOut,
      });

      if (result.success) {
        toast.success("Caja cerrada exitosamente");
        setSession(null);
        setSummary(null);
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error al cerrar caja");
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
      <div className="h-full flex items-center justify-center bg-slate-900 p-6">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700 text-center">
          <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
            <Archive size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Caja Cerrada</h1>
          <p className="text-slate-400 mb-8">
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
                className="w-full bg-slate-900 border border-slate-600 rounded-xl py-4 pl-10 pr-4 text-2xl text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
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
    <div className="p-6 h-full flex flex-col gap-6 bg-slate-900 overflow-y-auto">
      {/* Header y Acciones Principales */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Banknote className="text-green-400" /> Control de Caja
          </h1>
          <p className="text-slate-400 mt-1">
            Abierta el {new Date(session.opened_at).toLocaleString()}
          </p>
        </div>
        <button
          onClick={handleCloseBox}
          className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-900/20 transition flex items-center gap-2"
        >
          <Archive size={20} /> CERRAR CAJA
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Inicial */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <p className="text-slate-400 text-sm font-medium mb-1">
            Monto Inicial
          </p>
          <p className="text-2xl font-bold text-white">
            ${summary?.initialAmount?.toLocaleString()}
          </p>
        </div>
        {/* Ventas Efectivo */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <p className="text-slate-400 text-sm font-medium mb-1">
            Ventas (Efectivo)
          </p>
          <p className="text-2xl font-bold text-green-400">
            +${summary?.totalSalesCash?.toLocaleString()}
          </p>
        </div>
        {/* Movimientos */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <p className="text-slate-400 text-sm font-medium mb-1">
            Entradas / Salidas
          </p>
          <div className="flex gap-3 items-baseline">
            <span className="text-green-400 font-bold">
              +${summary?.totalIn?.toLocaleString()}
            </span>
            <span className="text-slate-500">/</span>
            <span className="text-red-400 font-bold">
              -${summary?.totalOut?.toLocaleString()}
            </span>
          </div>
        </div>
        {/* Total Teórico */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 p-6 rounded-2xl border border-blue-700/50 shadow-xl">
          <p className="text-blue-200 text-sm font-medium mb-1">
            Total en Caja (Teórico)
          </p>
          <p className="text-4xl font-black text-white">
            ${summary?.finalBalance?.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Formulario de Movimientos */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-fit">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
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
                    : "bg-slate-700 text-slate-400"
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
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                <ArrowDownCircle size={18} /> RETIRO
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Monto</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={movementAmount}
                onChange={(e) => setMovementAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Descripción
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Compra de hielo, Pago proveedor..."
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-bold text-white">
              Últimos Movimientos
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {movements.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-slate-500">
                No hay movimientos registrados
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="text-slate-400 text-xs uppercase bg-slate-900/50">
                  <tr>
                    <th className="p-3">Hora</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {movements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-700/30">
                      <td className="p-3 text-slate-400 text-sm font-mono">
                        {new Date(mov.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-3">
                        {mov.type === "entry" ? (
                          <span className="text-green-400 text-xs font-bold px-2 py-1 bg-green-900/30 rounded">
                            INGRESO
                          </span>
                        ) : (
                          <span className="text-red-400 text-xs font-bold px-2 py-1 bg-red-900/30 rounded">
                            RETIRO
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-white text-sm">
                        {mov.description}
                      </td>
                      <td
                        className={`p-3 text-right font-bold text-sm ${
                          mov.type === "entry"
                            ? "text-green-400"
                            : "text-red-400"
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
    </div>
  );
};

export default CajaScreen;
