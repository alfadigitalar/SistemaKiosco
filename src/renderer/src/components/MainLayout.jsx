import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  History,
  LogOut,
} from "lucide-react";

export default function MainLayout() {
  const navigate = useNavigate();

  const cerrarSesion = () => {
    navigate("/"); // Volver al login
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Lateral Fijo */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-slate-700">
          Kiosco System
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 p-3 hover:bg-slate-700 rounded transition"
          >
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link
            to="/ventas"
            className="flex items-center gap-3 p-3 hover:bg-slate-700 rounded transition"
          >
            <ShoppingCart size={20} /> Nueva Venta
          </Link>
          <Link
            to="/inventario"
            className="flex items-center gap-3 p-3 hover:bg-slate-700 rounded transition"
          >
            <Package size={20} /> Inventario
          </Link>
          <Link
            to="/clientes"
            className="flex items-center gap-3 p-3 hover:bg-slate-700 rounded transition"
          >
            <Users size={20} /> Clientes
          </Link>
          <Link
            to="/proveedores"
            className="flex items-center gap-3 p-3 hover:bg-slate-700 rounded transition"
          >
            <Truck size={20} /> Proveedores
          </Link>
          <Link
            to="/historial"
            className="flex items-center gap-3 p-3 hover:bg-slate-700 rounded transition"
          >
            <History size={20} /> Historial Ventas
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={cerrarSesion}
            className="flex items-center gap-3 text-red-400 hover:text-red-300 w-full"
          >
            <LogOut size={20} /> Salir
          </button>
        </div>
      </aside>

      {/* Área de Contenido Dinámica */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Aquí se renderizarán las rutas hijas (Ventas, Inventario, etc.) */}
        <Outlet />
      </main>
    </div>
  );
}
