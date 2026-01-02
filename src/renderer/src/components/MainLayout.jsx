import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Truck,
  History,
  DollarSign,
  BarChart3,
} from "lucide-react";

import { useConfig } from "../context/ConfigContext";
// As the logo image might be needed, we can import it or just use text for now
// import logoKubo from "../assets/kubo_transparent.png";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme, themeColor, getThemeClasses } = useConfig();
  const themeClasses = getThemeClasses(themeColor);

  const [kioskName, setKioskName] = useState("Cargando...");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.api.getSettings();
        if (settings && settings.kiosk_name) {
          setKioskName(settings.kiosk_name);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        setKioskName("POS System");
      }
    };
    loadSettings();
  }, []);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobile(true);
        setIsSidebarOpen(false);
      } else {
        setIsMobile(false);
        setIsSidebarOpen(true);
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    {
      path: "/dashboard",
      icon: <LayoutDashboard size={20} />,
      label: "Dashboard",
    },
    { path: "/ventas", icon: <ShoppingCart size={20} />, label: "Nueva Venta" },
    { path: "/caja", icon: <DollarSign size={20} />, label: "Control de Caja" },
    { path: "/inventario", icon: <Package size={20} />, label: "Inventario" },
    { path: "/clientes", icon: <Users size={20} />, label: "Clientes" },
    { path: "/proveedores", icon: <Truck size={20} />, label: "Proveedores" },
    { path: "/usuarios", icon: <Users size={20} />, label: "Usuarios" },
    {
      path: "/historial",
      icon: <History size={20} />,
      label: "Historial Ventas",
    },
    { path: "/reportes", icon: <BarChart3 size={20} />, label: "Reportes" },
    {
      path: "/configuracion",
      icon: <Settings size={20} />,
      label: "Configuración",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transform transition-all duration-300 ease-in-out flex flex-col shadow-xl border-r border-slate-200 dark:border-slate-800 ${
          isSidebarOpen
            ? "w-64 translate-x-0"
            : "w-64 -translate-x-full lg:w-20 lg:translate-x-0"
        } ${
          isMobile
            ? isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
            : ""
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          {isSidebarOpen ? (
            <div
              className={`flex items-center gap-2 font-bold text-xl ${themeClasses.text} overflow-hidden`}
            >
              {/* <img src={logoKubo} className="h-8" /> */}
              <span
                className={`text-slate-900 dark:text-white border-b-2 ${themeClasses.border} pb-0.5 truncate`}
              >
                {kioskName}
              </span>
            </div>
          ) : (
            <div
              className={`w-full flex justify-center ${themeClasses.text} font-bold text-xl`}
            >
              AP
            </div>
          )}

          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-red-500 transition-colors"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => isMobile && setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? `${themeClasses.bg} text-white shadow-lg`
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                } ${!isSidebarOpen && !isMobile ? "justify-center px-2" : ""}`}
                title={!isSidebarOpen ? item.label : ""}
              >
                <div className="shrink-0">{item.icon}</div>
                {(isSidebarOpen || isMobile) && (
                  <span className="font-medium whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div
            className={`flex items-center gap-3 ${
              !isSidebarOpen && !isMobile ? "justify-center" : ""
            }`}
          >
            {user.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="User"
                className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 object-cover ring-2 ring-slate-100 dark:ring-slate-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold shrink-0 ring-2 ring-slate-100 dark:ring-slate-700">
                {user.name ? user.name.charAt(0) : "U"}
              </div>
            )}

            {(isSidebarOpen || isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user.name || "Usuario"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user.role || "Role"}
                </p>
              </div>
            )}
          </div>

          {(isSidebarOpen || isMobile) && (
            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center gap-2 text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors px-2 py-2 rounded-lg"
            >
              <LogOut size={18} />
              <span>Salir</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Mobile Header */}
        <div className="lg:hidden h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 justify-between shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-slate-600 dark:text-slate-300"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-slate-800 dark:text-white">
            Kubo POS
          </span>
          <div className="w-6"></div> {/* Spacer */}
        </div>

        {/* Content Scrollable Area */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 relative">
          <Outlet />
        </main>

        {/* Toggle Sidebar Button Desktop */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden lg:flex absolute top-1/2 -left-3 w-6 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-r-xl items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white z-40 cursor-pointer shadow-lg transition-colors"
          title="Toggle Sidebar"
        >
          <div className="w-1 h-4 bg-slate-400 dark:bg-slate-600 rounded-full" />
        </button>
      </div>
    </div>
  );
};

export default MainLayout;
