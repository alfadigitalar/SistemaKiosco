const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { initDatabase } = require("./db");
const { registerIpcHandlers } = require("./ipcHandlers");
const { startServer, stopServer } = require("./server");

let mainWindow;
let serverInfo;

/**
 * Crea la ventana principal de la aplicación
 */
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#0f172a", // Evita el flash blanco al cargar
    webPreferences: {
      // Ruta al script de preload (puente de comunicación)
      preload: path.join(__dirname, "../preload/index.js"),
      // Sandbox deshabilitado para permitir contextBridge
      sandbox: false,
      // Seguridad: No exponer Node.js al renderer
      nodeIntegration: false,
      // Seguridad: Aislar contextos
      contextIsolation: true,
    },
  });

  mainWindow = win;

  // Cargar la URL según el entorno
  // En desarrollo: Servidor de Vite (localhost:5173)
  // En producción: Archivo HTML compilado
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
    // Abrir DevTools en desarrollo
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../../dist/index.html"));
  }

  // Iniciar servidor de escáner local
  serverInfo = startServer(win);
  if (serverInfo) {
    console.log("Scanner Server Info:", serverInfo);
  } else {
    console.error("Failed to initialize scanner server.");
  }
}

// ═══════════════════════════════════════════════════════════
// CICLO DE VIDA DE LA APLICACIÓN
// ═══════════════════════════════════════════════════════════

app.whenReady().then(() => {
  // 1. Inicializar Base de Datos (SQLite)
  initDatabase();

  // 2. Registrar Handlers IPC (comunicación main<->renderer)
  registerIpcHandlers();

  // Handler para obtener info del servidor de escáner
  ipcMain.handle("get-server-info", () => serverInfo);

  // 3. Crear Ventana Principal
  createWindow();

  // macOS: Reabrir ventana al hacer clic en el dock
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Windows/Linux: Cerrar app cuando todas las ventanas se cierran
app.on("window-all-closed", () => {
  stopServer(); // Detener servidor
  if (process.platform !== "darwin") app.quit();
});
