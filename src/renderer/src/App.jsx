import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginScreen from "./screens/LoginScreen";
import PosScreen from "./screens/PosScreen";
import CustomersScreen from "./screens/CustomersScreen";
import ErrorBoundary from "./components/ErrorBoundary";
import MainLayout from "./components/MainLayout";

// Componentes Placeholder para secciones futuras
const Dashboard = () => {
  return <h1 className="text-2xl font-bold">Resumen del Día - Próximamente</h1>;
};

const Inventario = () => {
  return (
    <h1 className="text-2xl font-bold">Gestión de Stock - Próximamente</h1>
  );
};

const Clientes = () => {
  return (
    <h1 className="text-2xl font-bold">Gestión de Clientes - Próximamente</h1>
  );
};

const Proveedores = () => {
  return (
    <h1 className="text-2xl font-bold">
      Gestión de Proveedores - Próximamente
    </h1>
  );
};

const Historial = () => {
  return (
    <h1 className="text-2xl font-bold">Historial de Ventas - Próximamente</h1>
  );
};

function App() {
  return (
    <Router>
      <div className="h-screen w-screen bg-slate-900 text-white overflow-hidden font-sans">
        <ErrorBoundary>
          <Routes>
            {/* Ruta por defecto redirige al Login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Pantalla de Login */}
            <Route path="/login" element={<LoginScreen />} />

            {/* Pantalla Principal de POS (sin sidebar) */}
            <Route path="/pos" element={<PosScreen />} />

            {/* Rutas Privadas - Dentro del Layout con Sidebar */}
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ventas" element={<PosScreen />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/clientes" element={<CustomersScreen />} />
              <Route path="/proveedores" element={<Proveedores />} />
              <Route path="/historial" element={<Historial />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </div>
    </Router>
  );
}

export default App;
