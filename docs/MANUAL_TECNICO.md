# Manual Técnico - Novy POS

## 1. Descripción General

Novy POS es un sistema de punto de venta (POS) de escritorio desarrollado con tecnologías web modernas encapsuladas en una aplicación nativa.
Está diseñado para operar en entornos Windows (compatible con Linux/Mac) sin dependencia de servidores externos para su funcionamiento básico (arquitectura Local-First).

### Tecnologías Principales

- **Runtime:** Electron (v28+)
- **Frontend:** React (v18), TailwindCSS, Lucide Icons
- **Backend (Main Process):** Node.js
- **Base de Datos:** SQLite (vía `sql.js` y persistencia en archivo)

## 2. Arquitectura del Sistema

El sistema sigue el modelo de arquitectura de Electron con dos procesos principales:

### 2.1 Main Process (`src/main`)

- Responsable del ciclo de vida de la aplicación.
- Maneja la ventana del navegador (`BrowserWindow`).
- Gestiona la Base de Datos (`db.js`).
- Expone una API segura vía IPC (Inter-Process Communication) en `ipcHandlers.js`.
- Maneja operaciones de sistema: Impresión, Sistema de Archivos, Backups.

### 2.2 Renderer Process (`src/renderer`)

- Interfaz de usuario (SPA - Single Page Application) construida con React.
- Se comunica con el Main Process únicamente a través de `window.api` (definido en `preload.js`).
- No tiene acceso directo a Node.js ni al sistema de archivos por seguridad (Context Isolation enabled).

## 3. Estructura de Archivos

```
/
├── src/
│   ├── main/                 # Código del proceso principal
│   │   ├── index.js          # Entry point
│   │   ├── db.js             # Capa de datos (SQLite)
│   │   ├── ipcHandlers.js    # Definición de endpoints IPC
│   │   └── preload.js        # Puente seguro Main-Renderer
│   │
│   ├── renderer/             # Código del frontend
│   │   ├── src/
│   │   │   ├── components/   # Componentes UI reutilizables
│   │   │   ├── screens/      # Pantallas principales (Vistas)
│   │   │   ├── context/      # Estados globales (React Context)
│   │   │   ├── App.jsx       # Enrutamiento
│   │   │   └── main.jsx      # Entry point React
│   │   └── index.html
│
├── resources/                # Assets estáticos (iconos)
├── electron.vite.config.js   # Configuración de compilación
└── package.json              # Dependencias y scripts
```

## 4. Base de Datos (Schema)

El sistema utiliza SQLite. El archivo de base de datos se ubica en `%APPDATA%/novy/novy.sqlite` (en producción).

### Tablas Principales

- **products:** Inventario (nombre, stock, precios, códigos).
- **sales / sale_items:** Historial de ventas y detalles.
- **clients:** Base de datos de clientes y cuentas corrientes.
- **movements:** Movimientos de caja (ingresos/egresos).
- **stock_movements:** Auditoría de inventario.
- **cash_sessions:** Control de turnos y cierres de caja.
- **users:** Usuarios y roles (admin/employee).
- **settings:** Configuración global (K VS store).

## 5. Compilación y Despliegue

Para generar el ejecutable (.exe) para Windows:

1.  **Instalar dependencias:** `npm install`
2.  **Modo Desarrollo:** `npm run dev`
3.  **Compilar Producción:** `npm run build:win`

El instalador se generará en la carpeta `dist`.

## 6. Seguridad y Backups

- **Roles:** El sistema distingue entre 'admin' y 'employee'. Ciertas funciones (Configuración, Reportes Avanzados, Edición de Stock) están restringidas.
- **Backups:** Se generan en `%APPDATA%/backups`. El sistema mantiene las últimas 10 copias.
- **Cierres de Caja:** Implementa "Cierre Ciego" para empleados, ocultando los totales esperados.

## 7. Solución de Problemas Comunes

- **Error de Impresión:** Verificar que la impresora predeterminada del sistema sea la térmica de 58mm/80mm.
- **Base de Datos Corrupta:** Utilizar la función "Restaurar Copia" en Configuración.
- **Pantalla Blanca:** Revisar logs en `%APPDATA%/novy/logs` o ejecutar con `--debug`.
