import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  History,
  LogOut,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  BarChart3,
} from "lucide-react";
import { useConfig } from "../context/ConfigContext";
import ConfirmationModal from "./ConfirmationModal";

export default function MainLayout() {
  const navigate = useNavigate();
  const { kioskName, getThemeClasses } = useConfig();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Obtener usuario del almacenamiento local para verificar rol
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch (e) {
    console.error("Error parsing user from localStorage", e);
    localStorage.removeItem("user"); // Clear bad data
  }
  const isAdmin = user?.role === "admin";

  // State for Security Modal
  const [showLogoutBlocker, setShowLogoutBlocker] = useState(false);

  const cerrarSesion = async () => {
    try {
      const session = await window.api.getCurrentSession();
      if (session) {
        // Caja abierta: Mostrar modal de bloqueo
        setShowLogoutBlocker(true);
      } else {
        // Caja cerrada: Permitir salir
        localStorage.removeItem("user");
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      navigate("/");
    }
  };

  const theme = getThemeClasses(); // Obtener clases del tema actual

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };
    // Initial check
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Estilos dinámicos para el sidebar según el tema
  const sidebarClass = `${
    isCollapsed ? "w-20" : "w-64"
  } flex flex-col transition-all duration-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700 relative shrink-0`;

  // Helper para links activos (opcional, para highlights)
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const getLinkClass = (path) => `
    flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium whitespace-nowrap overflow-hidden
    ${
      isActive(path)
        ? `${theme.bg} text-white shadow-lg`
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
    }
    ${isCollapsed ? "justify-center" : ""}
  `;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300 overflow-hidden">
      {/* Sidebar Lateral Fijo */}
      <aside className={sidebarClass}>
        {/* Botón de Colapsar (flotante en el borde) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute -right-4 top-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:text-slate-900 dark:hover:text-white transition-transform z-50`}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="p-6 text-xl font-bold border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 overflow-hidden whitespace-nowrap h-[88px]">
          <div className={`w-3 h-8 rounded-full ${theme.bg} shrink-0`}></div>
          {!isCollapsed && (
            <span className="transition-opacity duration-300">{kioskName}</span>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-2 overflow-y-auto overflow-x-hidden">
          <Link
            to="/dashboard"
            className={getLinkClass("/dashboard")}
            title="Dashboard"
          >
            <LayoutDashboard size={20} className="shrink-0" />{" "}
            {!isCollapsed && "Dashboard"}
          </Link>
          <Link
            to="/ventas"
            className={getLinkClass("/ventas")}
            title="Nueva Venta"
          >
            <ShoppingCart size={20} className="shrink-0" />{" "}
            {!isCollapsed && "Nueva Venta"}
          </Link>
          <Link
            to="/caja"
            className={getLinkClass("/caja")}
            title="Control de Caja"
          >
            <DollarSign size={20} className="shrink-0" />{" "}
            {!isCollapsed && "Control de Caja"}
          </Link>
          <Link
            to="/inventario"
            className={getLinkClass("/inventario")}
            title="Inventario"
          >
            <Package size={20} className="shrink-0" />{" "}
            {!isCollapsed && "Inventario"}
          </Link>
          <Link
            to="/clientes"
            className={getLinkClass("/clientes")}
            title="Clientes"
          >
            <Users size={20} className="shrink-0" />{" "}
            {!isCollapsed && "Clientes"}
          </Link>
          <Link
            to="/proveedores"
            className={getLinkClass("/proveedores")}
            title="Proveedores"
          >
            <Truck size={20} className="shrink-0" />{" "}
            {!isCollapsed && "Proveedores"}
          </Link>
          {isAdmin && (
            <Link
              to="/usuarios"
              className={getLinkClass("/usuarios")}
              title="Gestión de Usuarios"
            >
              <Shield size={20} className="shrink-0" />{" "}
              {!isCollapsed && "Usuarios"}
            </Link>
          )}
          <Link
            to="/historial"
            className={getLinkClass("/historial")}
            title="Historial Ventas"
          >
            <History size={20} className="shrink-0" />{" "}
            {!isCollapsed && "Historial Ventas"}
          </Link>
          <Link
            to="/reportes"
            className={getLinkClass("/reportes")}
            title="Reportes Avanzados"
          >
            <BarChart3 size={20} className="shrink-0" />{" "}
            {!isCollapsed && "Reportes"}
          </Link>

          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
            <Link
              to="/configuracion"
              className={getLinkClass("/configuracion")}
              title="Configuración"
            >
              <Settings size={20} className="shrink-0" />{" "}
              {!isCollapsed && "Configuración"}
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          {/* User Profile Section */}
          <div
            className={`flex items-center gap-3 mb-4 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="relative shrink-0">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="Perfil"
                  className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <Users size={20} />
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="font-bold text-sm truncate text-slate-700 dark:text-slate-200">
                  {user.name ? user.name.split(" ")[0] : "Usuario"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">
                  {user.role === "admin" ? "Administrador" : "Empleado"}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={cerrarSesion}
            className={`flex items-center gap-3 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 w-full p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium whitespace-nowrap overflow-hidden ${
              isCollapsed ? "justify-center" : ""
            }`}
            title="Salir"
          >
            <LogOut size={20} className="shrink-0" /> {!isCollapsed && "Salir"}
          </button>
        </div>
      </aside>

      {/* Área de Contenido Dinámica */}
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>

      {/* Modal de Bloqueo de Salida */}
      <ConfirmationModal
        isOpen={showLogoutBlocker}
        onClose={() => setShowLogoutBlocker(false)}
        onConfirm={() => navigate("/caja")}
        title="⚠️ No es posible salir"
        message="Tiene una CAJA ABIERTA en este momento. Por razones de seguridad, debe cerrar la caja antes de salir del sistema."
        confirmText="Ir a Cerrar Caja"
        cancelText="Entendido"
        isDestructive={true}
      />
    </div>
  );
}
