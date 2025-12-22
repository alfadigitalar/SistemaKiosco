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

  // ═══════════════════════════════════════════════════════════
  // MÉTODOS DE VENTAS
  // ═══════════════════════════════════════════════════════════

  // Procesar venta completa (items + pago)
  createSale: (saleData) => ipcRenderer.invoke("create-sale", saleData),

  // ═══════════════════════════════════════════════════════════
  // MÉTODOS DE USUARIO / AUTENTICACIÓN
  // ═══════════════════════════════════════════════════════════

  // Iniciar sesión
  loginUser: (credentials) => ipcRenderer.invoke("login-user", credentials),
});
