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
    icon: path.join(__dirname, "../renderer/public/favicon.png"), // Icono de la ventana
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
    win.loadFile(path.join(__dirname, "../../app/index.html"));
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
  const {
    generateTicketHTML,
    generateFacturaHTML,
  } = require("./ticketTemplate");

  ipcMain.handle("print-ticket", async (event, ticketData) => {
    try {
      console.log("Printing ticket...", ticketData);
      const isA4 = ticketData.format === "a4";

      // Crear ventana oculta para renderizar el ticket
      const printWin = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: true, // Para permitir imprimir
        },
      });

      // Obtener configuración del negocio
      const { all } = require("./db");

      const rawSettings = await all("SELECT * FROM settings");
      const settings = rawSettings.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

      const storeName = settings.kiosk_name || "Novy Kiosco";
      const address = settings.kiosk_address || "Dirección no configurada";
      const logoUrl = settings.ticket_logo || null;

      // Generar HTML según formato
      let html;
      if (isA4) {
        // Factura formato AFIP
        html = generateFacturaHTML({
          storeName: settings.tax_business_name || storeName,
          address: settings.kiosk_address || "Dirección no configurada",
          logoUrl,
          cuit: settings.tax_cuit || "",
          salesPoint: settings.tax_sales_point || "1",
          invoiceType: ticketData.invoiceType || "C",
          condicionIva: settings.tax_condition || "Monotributo",
          ingresosBrutos: settings.tax_iibb || "",
          inicioActividades: settings.tax_start_date || "",
          voucherNumber: ticketData.voucherNumber || 0,
          cae: ticketData.cae || "",
          caeFchVto: ticketData.caeFchVto || "",
          clientName: ticketData.clientName || "Consumidor Final",
          clientDni: ticketData.clientDni || "",
          clientAddress: ticketData.clientAddress || "",
          clientName: ticketData.clientName || "Consumidor Final",
          clientDni: ticketData.clientDni || "",
          clientAddress: ticketData.clientAddress || "",
          clientCondicionIva: ticketData.condicionIva || "Consumidor Final",
          date: ticketData.date,
          items: ticketData.items,
          total: ticketData.total,
        });
      } else {
        // Ticket formato térmico
        html = generateTicketHTML({
          storeName,
          address,
          logoUrl,
          footerMessage: "¡Gracias por su compra!",
          ...ticketData,
        });
      }

      // Cargar HTML
      await printWin.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
      );

      // Imprimir
      // Si es A4, permitimos seleccionar impresora (silent: false)
      // Si es Ticket (default), imprimimos directo (silent: true)

      return new Promise((resolve, reject) => {
        printWin.webContents.print(
          {
            silent: !isA4,
            printBackground: false,
          },
          (success, errorType) => {
            if (!success) {
              console.error("Print failed:", errorType);
              reject(errorType);
            } else {
              console.log("Print success");
              resolve(true);
            }
            printWin.close();
          },
        );
      });
    } catch (error) {
      console.error("Error printing ticket:", error);
      return false;
    }
  });

  ipcMain.handle("save-budget-pdf", async (event, budgetData) => {
    try {
      const { dialog } = require("electron");
      const fs = require("fs");
      const { generateBudgetHTML } = require("./ticketTemplate");

      const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: "Guardar Presupuesto",
        defaultPath: `Presupuesto-${Date.now()}.pdf`,
        filters: [{ name: "Documentos PDF", extensions: ["pdf"] }],
      });

      if (!filePath) {
        return { success: false, cancelled: true };
      }

      // Crear ventana oculta para renderizar el presupuesto
      const printWin = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: true,
        },
      });

      // Obtener configuración del negocio
      const { all } = require("./db");
      const rawSettings = await all("SELECT * FROM settings");
      const settings = rawSettings.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

      const storeName = settings.kiosk_name || "Novy Kiosco";
      const address = settings.kiosk_address || "Dirección no configurada";

      const html = generateBudgetHTML({
        storeName,
        address,
        date: budgetData.date,
        validUntil: budgetData.validUntil || "",
        items: budgetData.items,
        total: budgetData.total,
        clientName: budgetData.clientName || "Consumidor Final",
        clientDni: budgetData.clientDni || "",
        clientEmail: budgetData.clientEmail || "",
        clientPhone: budgetData.clientPhone || "",
        refNumber: budgetData.refNumber || "",
      });

      // Cargar HTML
      await printWin.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
      );

      // Generar PDF
      const pdfBuffer = await printWin.webContents.printToPDF({
        marginsType: 0, // No margins (handled by CSS)
        pageSize: "A4",
        printBackground: true,
      });

      // Guardar archivo
      await fs.promises.writeFile(filePath, pdfBuffer);
      printWin.close();

      return { success: true, filePath };
    } catch (error) {
      console.error("Error saving budget PDF:", error);
      return { success: false, error: error.message };
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
