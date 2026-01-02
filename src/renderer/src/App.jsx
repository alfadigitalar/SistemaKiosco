import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LoginScreen from "./screens/LoginScreen";
import PosScreen from "./screens/PosScreen";
import CustomersScreen from "./screens/CustomersScreen";
import InventarioScreen from "./screens/InventarioScreen";
import CajaScreen from "./screens/CajaScreen";
import ErrorBoundary from "./components/ErrorBoundary";
import MainLayout from "./components/MainLayout";

import DashboardScreen from "./screens/DashboardScreen";
import HistorialScreen from "./screens/HistorialScreen";
import ProveedoresScreen from "./screens/ProveedoresScreen";
import { ConfigProvider } from "./context/ConfigContext";
import UsersScreen from "./screens/UsersScreen";
import ConfiguracionScreen from "./screens/ConfiguracionScreen";
import ReportesScreen from "./screens/ReportesScreen";

// Componentes Placeholder para secciones futuras

function App() {
  return (
    <Router>
      <div className="min-h-screen w-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white overflow-x-hidden font-sans transition-colors duration-300">
        <ConfigProvider>
          <ErrorBoundary>
            <Toaster
              position="top-center"
              reverseOrder={false}
              gutter={8}
              containerClassName=""
              containerStyle={{
                zIndex: 999999,
              }}
              toastOptions={{
                className: "",
                duration: 5000,
                style: {
                  background: "#1e293b",
                  color: "#fff",
                  padding: "16px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  boxShadow:
                    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                },
                success: {
                  style: {
                    background: "#10b981",
                  },
                  iconTheme: {
                    primary: "#fff",
                    secondary: "#10b981",
                  },
                },
                error: {
                  style: {
                    background: "#ef4444",
                  },
                  iconTheme: {
                    primary: "#fff",
                    secondary: "#ef4444",
                  },
                },
              }}
            />
            <Routes>
              {/* Ruta por defecto redirige al Login */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Pantalla de Login */}
              <Route path="/login" element={<LoginScreen />} />

              {/* Pantalla Principal de POS (sin sidebar) */}
              <Route path="/pos" element={<PosScreen />} />

              {/* Rutas Privadas - Dentro del Layout con Sidebar */}
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<DashboardScreen />} />
                <Route path="/ventas" element={<PosScreen />} />
                <Route path="/caja" element={<CajaScreen />} />
                <Route path="/inventario" element={<InventarioScreen />} />
                <Route path="/clientes" element={<CustomersScreen />} />
                <Route path="/proveedores" element={<ProveedoresScreen />} />
                <Route path="/usuarios" element={<UsersScreen />} />
                <Route path="/historial" element={<HistorialScreen />} />
                <Route
                  path="/configuracion"
                  element={<ConfiguracionScreen />}
                />
                <Route path="/reportes" element={<ReportesScreen />} />
              </Route>
            </Routes>
          </ErrorBoundary>
        </ConfigProvider>
      </div>
    </Router>
  );
}

export default App;
