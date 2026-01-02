const { contextBridge, ipcRenderer } = require("electron");

/**
 * Puente de Comunicación Seguro (Preload)
 *
 * Expone métodos protegidos que permiten al proceso renderer (React)
 * comunicarse con el proceso main (Electron/Node) sin exponer
 * directamente el objeto ipcRenderer (por seguridad).
 */
contextBridge.exposeInMainWorld("api", {
  // ═══════════════════════════════════════════════════════════
  // MÉTODOS DE PRODUCTOS
  // ═══════════════════════════════════════════════════════════

  // Obtener todos los productos activos
  getProducts: () => ipcRenderer.invoke("get-products"),

  // Buscar producto por código de barras
  getProductByBarcode: (barcode) =>
    ipcRenderer.invoke("get-product-by-barcode", barcode),

  // Buscar productos por nombre (LIKE)
  searchProducts: (query) => ipcRenderer.invoke("search-products", query),

  // Crear nuevo producto
  addProduct: (product) => ipcRenderer.invoke("add-product", product),

  // Actualizar producto
  updateProduct: (product) => ipcRenderer.invoke("update-product", product),

  // Eliminar producto
  deleteProduct: (id) => ipcRenderer.invoke("delete-product", id),

  // Promos
  getPromoItems: (promoId) => ipcRenderer.invoke("get-promo-items", promoId),

  // Control de Stock Avanzado
  addStockMovement: (data) => ipcRenderer.invoke("add-stock-movement", data),
  getStockMovements: (productId) =>
    ipcRenderer.invoke("get-stock-movements", productId),

  // Impresión
  printTicket: (data) => ipcRenderer.invoke("print-ticket", data),

  // ═══════════════════════════════════════════════════════════
  // MÉTODOS DE VENTAS
  // ═══════════════════════════════════════════════════════════

  // Procesar venta completa (items + pago)
  createSale: (saleData) => ipcRenderer.invoke("create-sale", saleData),

  // ═══════════════════════════════════════════════════════════
  // MÉTODOS DE CLIENTES
  // ═══════════════════════════════════════════════════════════

  getCustomers: () => ipcRenderer.invoke("get-customers"),
  createCustomer: (customer) => ipcRenderer.invoke("create-customer", customer),
  updateCustomer: (customer) => ipcRenderer.invoke("update-customer", customer),
  deleteCustomer: (id) => ipcRenderer.invoke("delete-customer", id),
  processDebtPayment: (data) =>
    ipcRenderer.invoke("process-debt-payment", data),

  // ═══════════════════════════════════════════════════════════
  // MÉTODOS DE CAJA (CASH CONTROL)
  // ═══════════════════════════════════════════════════════════
  getCurrentSession: () => ipcRenderer.invoke("get-current-session"),
  openCashSession: (data) => ipcRenderer.invoke("open-cash-session", data),
  closeCashSession: (data) => ipcRenderer.invoke("close-cash-session", data),
  getCashSummary: (sessionId) =>
    ipcRenderer.invoke("get-cash-summary", sessionId),
  addCashMovement: (movement) =>
    ipcRenderer.invoke("add-cash-movement", movement),
  getMovements: (limit) => ipcRenderer.invoke("get-movements", limit),

  // ═══════════════════════════════════════════════════════════
  // MÉTODOS DE ESTADÍSTICAS Y REPORTES
  // ═══════════════════════════════════════════════════════════
  getDashboardStats: () => ipcRenderer.invoke("get-dashboard-stats"),
  getProfitStats: (filters) => ipcRenderer.invoke("get-profit-stats", filters),
  getSalesHistory: (filters) =>
    ipcRenderer.invoke("get-sales-history", filters),
  getSaleDetails: (saleId) => ipcRenderer.invoke("get-sale-details", saleId),
  getAdvancedReport: (filters) =>
    ipcRenderer.invoke("get-advanced-report", filters),
  getAllActivePromos: () => ipcRenderer.invoke("get-all-active-promos"),

  // ═══════════════════════════════════════════════════════════
  // MÉTODOS DE PROVEEDORES
  // ═══════════════════════════════════════════════════════════
  getSuppliers: () => ipcRenderer.invoke("get-suppliers"),
  createSupplier: (data) => ipcRenderer.invoke("create-supplier", data),
  updateSupplier: (data) => ipcRenderer.invoke("update-supplier", data),
  deleteSupplier: (id) => ipcRenderer.invoke("delete-supplier", id),

  // ═══════════════════════════════════════════════════════════
  // MÉTODOS DE CONFIGURACIÓN
  // ═══════════════════════════════════════════════════════════
  getSettings: () => ipcRenderer.invoke("get-settings"),
  updateSettings: (data) => ipcRenderer.invoke("update-settings", data),

  // ═══════════════════════════════════════════════════════════
  // MÉTODOS DE USUARIO / AUTENTICACIÓN
  // ═══════════════════════════════════════════════════════════

  // Iniciar sesión
  loginUser: (credentials) => ipcRenderer.invoke("login-user", credentials),

  // Actualizar usuario
  updateUser: (data) => ipcRenderer.invoke("update-user", data),

  // Exportar Datos
  exportData: () => ipcRenderer.invoke("export-data"),

  // Gestión de Usuarios
  getUsers: () => ipcRenderer.invoke("get-users"),
  createUser: (data) => ipcRenderer.invoke("create-user", data),
  updateUser: (data) => ipcRenderer.invoke("update-user", data),
  deleteUser: (id) => ipcRenderer.invoke("delete-user", id),

  // Email
  sendEmailTicket: (data) => ipcRenderer.invoke("send-email-ticket", data),

  // ARCA (AFIP)
  createElectronicInvoice: (data) =>
    ipcRenderer.invoke("create-electronic-invoice", data),

  // ═══════════════════════════════════════════════════════════
  // ESCÁNER MÓVIL
  // ═══════════════════════════════════════════════════════════
  getServerInfo: () => ipcRenderer.invoke("get-server-info"),
  onMobileScan: (callback) => {
    const listener = (event, code) => callback(code);
    ipcRenderer.on("mobile-scan", listener);
    // Retornar función de limpieza
    return () => ipcRenderer.removeListener("mobile-scan", listener);
  },
});
