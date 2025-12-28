const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { initDatabase, get } = require("./db");
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

  /**
   * Handler para IMPRIMIR TICKET
   * Recibe: { items, total, date, ... }
   */
  const { generateTicketHTML } = require("./ticketTemplate");

  ipcMain.handle("print-ticket", async (event, ticketData) => {
    try {
      console.log("Printing ticket...", ticketData);

      // Crear ventana oculta para renderizar el ticket
      const printWin = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: true, // Para permitir imprimir
        },
      });

      // Obtener configuración del negocio
      // La tabla settings es key-value, así que traemos todo y lo mapeamos
      const { all } = require("./db"); // Importar 'all' si no está disponible, o usar 'get' y cambiar query

      // Nota: initDatabase expone 'get' en exports, pero aqui index.js trae solo { initDatabase, get }.
      // Necesitamos 'all' para traer todas las settings.
      // Si 'all' no se exporta en ./db, hay que ir a db.js y exportarlo.
      // Revisando imports arriba: const { initDatabase, get } = require("./db");
      // Asumamos que puedo importar 'all' también.

      const rawSettings = await require("./db").all("SELECT * FROM settings");
      const settings = rawSettings.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

      const storeName = settings.kiosk_name || "Novy Kiosco";
      const address = settings.kiosk_address || "Dirección no configurada";
      const logoUrl = settings.ticket_logo || null;

      // Generar HTML
      const html = generateTicketHTML({
        storeName,
        address,
        logoUrl,
        footerMessage: "¡Gracias por su compra!",
        ...ticketData,
      });

      // Cargar HTML
      await printWin.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
      );

      // Imprimir
      const printers = await printWin.webContents.getPrintersAsync();
      // Si hay impresoras, imprimir en la default
      // TODO: Permitir seleccionar impresora en config

      return new Promise((resolve, reject) => {
        printWin.webContents.print(
          { silent: true, printBackground: false },
          (success, errorType) => {
            if (!success) {
              console.error("Print failed:", errorType);
              reject(errorType);
            } else {
              console.log("Print success");
              resolve(true);
            }
            printWin.close();
          }
        );
      });
    } catch (error) {
      console.error("Error printing ticket:", error);
      return false;
    }
  });

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
