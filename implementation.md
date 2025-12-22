# Plan de Implementación "Paso a Paso" - Sistema POS Novy

> [!NOTE] > **Cambio de Estrategia:** Debido a dificultades para compilar librerías nativas en Windows, hemos migrado a **`sql.js`**. Esta librería funciona con Javascript puro y no requiere instalaciones complejas en tu sistema.

## Fase 1: Cimientos del Backend (Electron + SQLite)

**Objetivo:** Tener la aplicación corriendo y la base de datos lista.

1.  **Estructura de Archivos**: Configurar `main`, `preload` y `renderer` (Ya realizado).
2.  **Base de Datos (`db.js`)**:
    - **[HECHO]** Instalar `sql.js` (Alternativa puro JS).
    - **[HECHO]** Configurar persistencia manual en archivo `novy.sqlite`.
    - **[HECHO]** Script de creación de tablas: `users`, `products`, `clients`, `sales`, `sale_items`, `movements`.
3.  **Lógica de Productos (`ipcHandlers.js`)**:
    - **[HECHO]** Handlers para: `getProductos`, `buscarProducto`, `crearProducto`.
    - Adaptados para usar la nueva librería `sql.js` (async/await simulado).
4.  **Puente Seguro (`preload.js`)**:
    - **[HECHO]** Exponer API segura via `contextBridge`.

## Fase 2: Interfaz de Usuario y Seguridad (Frontend UI)

**Objetivo:** Estructura visual profesional y segura.

1.  **Configuración React**:
    - Instalar `react-router-dom` (Navegación).
    - Instalar `react-hot-toast` (Notificaciones).
    - Instalar `lucide-react` (Iconos).
2.  **Pantalla de Login**:
    - Crear vista de inicio de sesión.
    - IPC `loginUser`: Verificar credenciales contra la DB.
3.  **Layout Principal**:
    - Sidebar lateral fijo.
    - Área de contenido dinámica.
4.  **Error Boundary**: Protección contra pantallas blancas por errores.

## Fase 3: La Pantalla de Ventas (Checkout)

**Objetivo:** Interfaz ágil para cobrar.

1.  **Interfaz POS (`PosScreen.jsx`)**:
    - Dos columnas: Productos y Totales.
    - Diseño Touch-Friendly.
2.  **Lógica del Escáner**:
    - Input "autofocus" invisible.
    - Detectar `Enter` -> Búsqueda en DB.
3.  **Carrito de Compras**:
    - Manejo de estado (Zustand/State).

## Fase 4: Procesar el Pago y Guardar

**Objetivo:** Cerrar la venta.

1.  **Modal de Pago**:
    - Efectivo / Débito / Mixto.
    - Calculadora de Vuelto.
2.  **Guardado**:
    - Transacción en DB (Venta + Items).
    - Resta de Stock.

## Fase 5: Gestión de Clientes y Fiados

**Objetivo:** Créditos.

1.  **Fiados**:
    - Asignar cliente a venta.
    - Registro de deuda en cta. cte.

---

## 🚀 Próximo Paso (Ahora)

Vamos a instalar las librerías visuales para comenzar la **Fase 2**:
`npm install react-router-dom react-hot-toast lucide-react clsx tailwind-merge`
