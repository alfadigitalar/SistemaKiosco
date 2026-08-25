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

  // Habilitar Web Serial API para la balanza (filtrando puertos falsos de placa madre)
  win.webContents.session.on('select-serial-port', (event, portList, webContents, callback) => {
    event.preventDefault();
    console.log('[SERIAL DEBUG] Puertos detectados por el sistema:', portList);

    if (!portList || portList.length === 0) {
      callback('');
      return;
    }

    // Buscar puertos USB reales (ignorando ttyS0-ttyS31 de motherboard sin conectar)
    const usbPort = portList.find(p => 
      p.vendorId || 
      (p.portName && (p.portName.toLowerCase().includes('usb') || p.portName.toLowerCase().includes('acm'))) ||
      (p.displayName && (
        p.displayName.toLowerCase().includes('usb') || 
        p.displayName.toLowerCase().includes('serial') ||
        p.displayName.toLowerCase().includes('ch340') || 
        p.displayName.toLowerCase().includes('ftdi') || 
        p.displayName.toLowerCase().includes('prolific') ||
        p.displayName.toLowerCase().includes('cp210')
      ))
    );

    if (usbPort) {
      console.log('[SERIAL DEBUG] Puerto USB seleccionado:', usbPort);
      callback(usbPort.portId);
    } else {
      // Si no hay adaptador USB conectado, no auto-seleccionar un puerto vacío
      console.log('[SERIAL DEBUG] No se encontró ningún adaptador USB conectado.');
      callback('');
    }
  });

  win.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'serial') {
      return true;
    }
    return false;
  });

  win.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'serial') {
      return true;
    }
    return false;
  });

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

app.whenReady().then(async () => {
  // 1. Inicializar Base de Datos (SQLite)
  try {
    await initDatabase();
  } catch (error) {
    console.error("Error crítico al iniciar la base de datos:", error);
    const { dialog } = require("electron");
    dialog.showErrorBox("Error de Base de Datos", "No se pudo iniciar la base de datos: " + error.message);
    app.quit();
    return;
  }

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
      const paperWidth = ticketData.paperWidth || settings.ticket_paper_width || "58mm";

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
          paperWidth,
          ...ticketData,
        });
      }

      // Cargar HTML
      await printWin.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
      );

      // Configurar opciones de impresión
      // Para tickets térmicos: configuramos el tamaño de papel en micrones
      // 58mm = 58000 micrones, 80mm = 80000 micrones
      // Alto: usamos un valor grande (el papel continuo se corta automáticamente)
      const printOptions = {
        silent: ticketData.showDialog ? false : !isA4,
        printBackground: false,
      };

      if (!isA4) {
        // Configurar tamaño de papel personalizado para impresora térmica
        const widthMicrons = paperWidth === "80mm" ? 80000 : 58000;
        printOptions.pageSize = {
          width: widthMicrons,
          height: 300000, // Alto suficiente, la térmica corta automático
        };
        printOptions.margins = {
          marginType: "none",
        };
      }

      return new Promise((resolve, reject) => {
        printWin.webContents.print(
          printOptions,
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

  // Handler para previsualizar ticket (para testing sin impresora)
  ipcMain.handle("preview-ticket", async (event, ticketData) => {
    try {
      const { all } = require("./db");
      const rawSettings = await all("SELECT * FROM settings");
      const settings = rawSettings.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

      const storeName = settings.kiosk_name || "Novy Kiosco";
      const address = settings.kiosk_address || "Dirección no configurada";
      const logoUrl = settings.ticket_logo || null;
      const paperWidth = ticketData.paperWidth || settings.ticket_paper_width || "58mm";
      const is80mm = paperWidth === "80mm";

      const html = generateTicketHTML({
        storeName,
        address,
        logoUrl,
        footerMessage: "¡Gracias por su compra!",
        paperWidth,
        ...ticketData,
      });

      // Abrir ventana VISIBLE para previsualizar
      const previewWin = new BrowserWindow({
        width: is80mm ? 340 : 240,
        height: 600,
        title: `Vista previa - Ticket #${ticketData.ticketId || "TEST"}`,
        resizable: true,
        webPreferences: {
          nodeIntegration: false,
        },
      });

      await previewWin.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
      );

      return true;
    } catch (error) {
      console.error("Error previewing ticket:", error);
      return false;
    }
  });

  // Handler para guardar ticket térmico o A4 como PDF
  ipcMain.handle("save-ticket-pdf", async (event, ticketData) => {
    try {
      const { dialog } = require("electron");
      const fs = require("fs");
      
      const { all } = require("./db");
      const rawSettings = await all("SELECT * FROM settings");
      const settings = rawSettings.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

      const storeName = settings.kiosk_name || "Novy Kiosco";
      const address = settings.kiosk_address || "Dirección no configurada";
      const logoUrl = settings.ticket_logo || null;
      const paperWidth = ticketData.paperWidth || settings.ticket_paper_width || "58mm";
      const isA4 = ticketData.format === "a4";

      const defaultName = isA4
        ? `Factura-A4-${ticketData.ticketId || Date.now()}.pdf`
        : `Ticket-${ticketData.ticketId || Date.now()}.pdf`;

      const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: isA4 ? "Guardar Factura / Comprobante A4" : "Guardar Ticket PDF",
        defaultPath: defaultName,
        filters: [{ name: "Documentos PDF", extensions: ["pdf"] }],
      });

      if (!filePath) {
        return { success: false, cancelled: true };
      }

      const printWin = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: true,
        },
      });

      const html = generateTicketHTML({
        storeName,
        address,
        logoUrl,
        footerMessage: "¡Gracias por su compra!",
        paperWidth,
        format: isA4 ? "a4" : "ticket",
        ...ticketData,
      });

      await printWin.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
      );

      let printOptions = {
        printBackground: true,
      };

      if (isA4) {
        printOptions.pageSize = "A4";
        printOptions.marginsType = 0; // Márgenes estándar para A4
      } else {
        const widthMicrons = paperWidth === "80mm" ? 80000 : 58000;
        const numItems = ticketData.items ? ticketData.items.length : 1;
        const heightMicrons = 95000 + (numItems * 30000);
        printOptions.pageSize = {
          width: widthMicrons,
          height: heightMicrons,
        };
        printOptions.marginsType = 1; // 1 = no margin
      }

      const pdfBuffer = await printWin.webContents.printToPDF(printOptions);

      fs.writeFileSync(filePath, pdfBuffer);
      printWin.close();

      return { success: true, path: filePath };
    } catch (error) {
      console.error("Error saving ticket PDF:", error);
      return { success: false, message: error.message };
    }
  });

  // Handler para guardar ticket como Imagen PNG (Ideal para WhatsApp y apps de celular como Fun Print)
  ipcMain.handle("save-ticket-image", async (event, ticketData) => {
    try {
      const { dialog } = require("electron");
      const fs = require("fs");

      const { all } = require("./db");
      const rawSettings = await all("SELECT * FROM settings");
      const settings = rawSettings.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

      const storeName = settings.kiosk_name || "Novy Kiosco";
      const address = settings.kiosk_address || "Dirección no configurada";
      const logoUrl = settings.ticket_logo || null;
      const paperWidth = ticketData.paperWidth || settings.ticket_paper_width || "58mm";

      const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: "Guardar Ticket como Imagen (para Celular / Fun Print)",
        defaultPath: `Ticket-${ticketData.ticketId || Date.now()}.png`,
        filters: [{ name: "Imágenes PNG", extensions: ["png"] }],
      });

      if (!filePath) {
        return { success: false, cancelled: true };
      }

      const is80mm = paperWidth === "80mm";
      const winWidth = is80mm ? 576 : 384;

      const printWin = new BrowserWindow({
        show: false,
        width: winWidth,
        height: 800,
        backgroundColor: "#ffffff",
        webPreferences: {
          nodeIntegration: true,
        },
      });

      const html = generateTicketHTML({
        storeName,
        address,
        logoUrl,
        footerMessage: "¡Gracias por su compra!",
        paperWidth,
        ...ticketData,
      });

      await printWin.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
      );

      // Obtener la altura real del contenido renderizado
      const height = await printWin.webContents.executeJavaScript(
        "document.body.scrollHeight"
      );
      printWin.setSize(winWidth, Math.max(height + 30, 200));

      await new Promise((r) => setTimeout(r, 250));

      const image = await printWin.webContents.capturePage();
      fs.writeFileSync(filePath, image.toPNG());
      printWin.close();

      return { success: true, path: filePath };
    } catch (error) {
      console.error("Error saving ticket image:", error);
      return { success: false, message: error.message };
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
