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

## Fase 4: Procesar Pago ✅ COMPLETO

- [x] Modal de Pago (`PaymentModal.jsx`)
- [x] Métodos: Efectivo / Tarjeta / Mixto (split payment)
- [x] Calculadora de Vuelto automática
- [x] Guardar venta en tabla `sales` + `sale_items`
- [x] Descontar stock automáticamente

## Fase 5: Gestión de Clientes y Fiados ⏳ PENDIENTE

- [ ] Pantalla `ClientesScreen.jsx` (CRUD)
- [ ] Asignar cliente a venta
- [ ] Campo `current_debt` actualizable
- [ ] Función "Pago a Cuenta" (decrementar deuda)
- [ ] Vista de deudas por cliente

## Fase 6: Inventario (CRUD Productos) ⏳ PENDIENTE

- [ ] Pantalla `InventarioScreen.jsx`
- [ ] Tabla con todos los productos
- [ ] Indicador visual (Rojo si `stock <= min_stock`)
- [ ] Formulario crear/editar productos
- [ ] Validación de código de barras único

## Fase 7: Control de Caja ⏳ PENDIENTE

- [ ] Función "Abrir Caja" (monto inicial)
- [ ] Función "Cerrar Caja" (cuadre del día)
- [ ] Registro de retiros manuales (gastos/proveedores)
- [ ] Tabla `movements` para entradas/salidas
- [ ] Reporte de cierre

## Fase 8: Dashboard y Reportes ⏳ PENDIENTE

- [ ] Ventas del día / semana / mes
- [ ] Productos más vendidos
- [ ] Alertas de stock bajo
- [ ] Historial de ventas con filtros

---

## 🚀 Estado Actual

| Fase | Descripción             | Estado |
| ---- | ----------------------- | ------ |
| 1    | Backend + SQLite        | ✅     |
| 2    | UI + Login + Layout     | ✅     |
| 3    | POS + Escáner + Carrito | ✅     |
| 4    | Modal de Pago + Guardar | ✅     |
| 5    | Clientes y Fiados       | ⏳     |
| 6    | Inventario CRUD         | ⏳     |
| 7    | Control de Caja         | ⏳     |
| 8    | Dashboard/Reportes      | ⏳     |

**Repositorio:** https://github.com/alfadigitalar/SistemaKiosco
