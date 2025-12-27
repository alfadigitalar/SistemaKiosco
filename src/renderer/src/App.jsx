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
import ConfiguracionScreen from "./screens/ConfiguracionScreen";

// Componentes Placeholder para secciones futuras

function App() {
  return (
    <Router>
      <div className="h-screen w-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white overflow-hidden font-sans transition-colors duration-300">
        <ConfigProvider>
          <ErrorBoundary>
            <Toaster
              position="top-right"
              toastOptions={{
                style: { background: "#334155", color: "#fff" },
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
                <Route path="/historial" element={<HistorialScreen />} />
                <Route
                  path="/configuracion"
                  element={<ConfiguracionScreen />}
                />
              </Route>
            </Routes>
          </ErrorBoundary>
        </ConfigProvider>
      </div>
    </Router>
  );
}

export default App;
