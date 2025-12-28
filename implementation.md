# Plan de Implementación - Sistema POS "Novy"

> [!NOTE] > **Cambio de Estrategia:** Migrado a **`sql.js`** (JavaScript puro) debido a dificultades de compilación de librerías nativas en Windows.

---

## 📋 Requisitos Técnicos (Stack)

| Tecnología               | Requerida | Implementada               |
| ------------------------ | --------- | -------------------------- |
| Electron                 | ✅        | ✅                         |
| React.js (Hooks)         | ✅        | ✅                         |
| Tailwind CSS (Dark Mode) | ✅        | ✅                         |
| Zustand / Context API    | ✅        | ⚠️ useState (simplificado) |
| SQLite                   | ✅        | ✅ sql.js                  |
| React Router DOM         | ✅        | ✅                         |
| JavaScript ES6+          | ✅        | ✅                         |

## 🏗️ Arquitectura

| Requisito                   | Estado                               |
| --------------------------- | ------------------------------------ |
| IPC Main/Renderer separados | ✅                                   |
| preload.js + contextBridge  | ✅                                   |
| nodeIntegration: false      | ✅                                   |
| Error Boundary global       | ✅                                   |
| Estructura modular          | ⚠️ Por carpetas (screens/components) |

## 💾 Base de Datos (SQLite)

| Tabla        | Campos                                                                                       | Estado |
| ------------ | -------------------------------------------------------------------------------------------- | ------ |
| `users`      | id, name, username, password_hash, role, active                                              | ✅     |
| `products`   | id, barcode, name, cost_price, sale_price, stock_quantity, min_stock, category_id, is_active | ✅     |
| `clients`    | id, name, dni, phone, current_debt, is_active                                                | ✅     |
| `sales`      | id, timestamp, user_id, client_id, total_amount, payment_method                              | ✅     |
| `sale_items` | id, sale_id, product_id, quantity, unit_price_at_sale, subtotal                              | ✅     |
| `movements`  | id, timestamp, type, amount, description, user_id                                            | ✅     |

---

## Fase 1: Cimientos del Backend ✅ COMPLETO

- [x] Estructura de Archivos (`main`, `preload`, `renderer`)
- [x] Conexión SQLite con `sql.js` + persistencia manual
- [x] Creación de 6 tablas del schema
- [x] IPC Handlers para Productos (getAll, search, add, getByBarcode)
- [x] API segura via `contextBridge`

## Fase 2: Interfaz de Usuario ✅ COMPLETO

- [x] Librerías: `react-router-dom`, `react-hot-toast`, `lucide-react`
- [x] Pantalla de Login con verificación contra DB
- [x] Layout Principal (Sidebar + Contenido dinámico)
- [x] Error Boundary (Dark Mode)
- [x] Rutas configuradas en `App.jsx`

## Fase 3: Pantalla de Ventas (POS) ✅ COMPLETO

- [x] Layout 2 columnas (Lista Productos | Totales)
- [x] Input escáner con autofocus permanente
- [x] Búsqueda automática al presionar Enter
- [x] Carrito: agregar, eliminar, calcular subtotales
- [x] Diseño Touch-Friendly (botones grandes)
- [x] Fix: Z-Index de Toasts para visibilidad

## Fase 4: Procesar Pago ✅ COMPLETO

- [x] Modal de Pago (`PaymentModal.jsx`)
- [x] Métodos: Efectivo / Tarjeta / Mixto (split payment)
- [x] Calculadora de Vuelto automática
- [x] Guardar venta en tabla `sales` + `sale_items`
- [x] Descontar stock automáticamente

## Fase 5: Gestión de Clientes y Fiados ✅ COMPLETO

- [x] Pantalla `ClientesScreen.jsx` (CRUD)
- [x] Asignar cliente a venta
- [x] Campo `current_debt` actualizable
- [x] Función "Pago a Cuenta" (decrementar deuda)
- [x] Vista de deudas por cliente
- [x] Fix: Bug de input DNI/Teléfono bloqueado
- [x] Fix: Selector de cliente en POS (debounce)

## Fase 6: Inventario (CRUD Productos) ✅ COMPLETO

- [x] Pantalla `InventarioScreen.jsx`
- [x] Tabla con todos los productos
- [x] Indicador visual (Rojo si `stock <= min_stock`)
- [x] Formulario crear/editar productos
- [x] Validación de código de barras único
- [x] Escaneo móvil directo para alta de productos

## Fase 7: Control de Caja ✅ COMPLETO

- [x] Función "Abrir Caja" (monto inicial)
- [x] Función "Cerrar Caja" (cuadre del día)
- [x] Registro de retiros manuales (gastos/proveedores)
- [x] Tabla `movements` para entradas/salidas
- [x] Reporte de cierre

## Fase 8: Dashboard y Reportes ✅ COMPLETO

- [x] Ventas del día / semana / mes
- [x] Productos más vendidos
- [x] Alertas de stock bajo
- [x] Historial de ventas con filtros

## Fase 9: Proveedores y Pedidos (PDF) ✅ COMPLETO

- [x] Backend: Tabla `suppliers` y Handlers CRUD
- [x] Frontend: Pantalla `ProveedoresScreen.jsx` (ABM)
- [x] Frontend: Generador de Pedidos
  - [x] Selección de proveedor y productos
  - [x] Botón "Cargar Faltantes" (Stock bajo)
  - [x] Exportación a PDF (jsPDF)
- [x] Integración en `App.jsx`

## Fase 10: Configuración y Personalización ✅ COMPLETO

- [x] Fix: Eliminado borde blanco y flash (bg-slate-900)
- [x] Backend: Tabla `settings` y Handlers
- [x] Frontend: `ConfigContext` para identidad global
- [x] Frontend: Pantalla de Configuración (Nombre y Color)
- [x] Integración: Tema dinámico en Sidebar y Botones

## Fase 11: Escáner Móvil y Conectividad ✅ COMPLETO

- [x] Servidor local (Express + Socket.io) en puerto 3000
- [x] Web App de escáner (`html5-qrcode`)
- [x] Vinculación por QR desde el POS
- [x] Soporte para **Linterna/Flash** en escáner móvil (Overlay UI)
- [x] **Detección inteligente de IP Local** (filtro de VirtualBox/VPN)
- [x] Feedback sonoro y vibración

## Fase 12: Mejoras de UI/UX ✅ COMPLETO

- [x] `ConfirmationModal`: Reemplazo de `window.confirm` nativos
- [x] Animaciones: Efecto `active:scale-95` en botones principales
- [x] Toast Notifications visibles (Z-Index fix)

## Fase 17: Gestión de Usuarios (Empleados)

### Objetivo

Permitir al administrador crear, editar y eliminar usuarios directamente desde el sistema para solucionar problemas de persistencia de datos con `sql.js`.

### Backend (`src/main/ipcHandlers.js`)

1.  **Get Users**: `ipcMain.handle("get-users")` -> `SELECT * FROM users`.
2.  **Create User**: `ipcMain.handle("create-user")` -> `INSERT INTO users ...`.
3.  **Update User**: `ipcMain.handle("update-user")` -> `UPDATE users ...`.
4.  **Delete User**: `ipcMain.handle("delete-user")` -> `UPDATE users SET active = 0`.

### Frontend

1.  **Nueva Pantalla**: `src/renderer/src/screens/UsersScreen.jsx`.
    - Tabla de usuarios.
    - Modal de creación/edición.
2.  **Navegación**:
    - Agregar ruta `/users` en `App.jsx`.
    - Agregar link en Sidebar (visible solo para admin).

---

## 🚀 Estado Actual

| Fase | Descripción             | Estado |
| ---- | ----------------------- | ------ |
| 1    | Backend + SQLite        | ✅     |
| 2    | UI + Login + Layout     | ✅     |
| 3    | POS + Escáner + Carrito | ✅     |
| 4    | Modal de Pago + Guardar | ✅     |
| 5    | Clientes y Fiados       | ✅     |
| 6    | Inventario CRUD         | ✅     |
| 7    | Control de Caja         | ✅     |
| 8    | Dashboard/Reportes      | ✅     |
| 9    | Proveedores y Pedidos   | ✅     |
| 10   | Configuración y Tema    | ✅     |
| 11   | Escáner Móvil + Flash   | ✅     |
| 12   | UI Polish + IP Fix      | ✅     |
| 17   | Gestión de Usuarios     | 🔄     |

**Repositorio:** https://github.com/alfadigitalar/SistemaKiosco
