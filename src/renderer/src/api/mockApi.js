/**
 * MOCK API PARA VERSIÓN WEB (PORTFOLIO)
 * Simula el comportamiento del backend Electron para la demo en Vercel.
 */

const mockProducts = [
  {
    id: 1,
    name: "Coca Cola 500ml",
    cost_price: 1000,
    sale_price: 1500,
    stock_quantity: 50,
    min_stock: 10,
    barcode: "7790895000997",
    category: "Bebidas",
    measurement_unit: "un",
    is_promo: false,
  },
  {
    id: 2,
    name: "Papas Lays Clásicas",
    cost_price: 800,
    sale_price: 1200,
    stock_quantity: 20,
    min_stock: 5,
    barcode: "7791234567890",
    category: "Snacks",
    measurement_unit: "un",
    is_promo: false,
  },
  {
    id: 3,
    name: "Alfajor Jorgito",
    cost_price: 400,
    sale_price: 800,
    stock_quantity: 100,
    min_stock: 20,
    barcode: "7793344556677",
    category: "Golocinas",
    measurement_unit: "un",
    is_promo: false,
  },
  {
    id: 4,
    name: "Agua Mineral 1L",
    cost_price: 600,
    sale_price: 1000,
    stock_quantity: 30,
    min_stock: 5,
    barcode: "7799887766554",
    category: "Bebidas",
    measurement_unit: "un",
    is_promo: false,
  },
  {
    id: 5,
    name: "Chicles Beldent",
    cost_price: 300,
    sale_price: 500,
    stock_quantity: 200,
    min_stock: 50,
    barcode: "7791122334455",
    category: "Golocinas",
    measurement_unit: "un",
    is_promo: false,
  },
];

const mockUsers = [
  {
    id: 1,
    name: "Administrador",
    username: "admin",
    role: "admin",
    password: "123",
  },
  {
    id: 2,
    name: "Vendedor Demo",
    username: "vendedor",
    role: "employee",
    password: "123",
  },
];

const mockCustomers = [
  {
    id: 1,
    name: "Cliente Consumidor Final",
    document: "00000000",
    address: "Venta al paso",
  },
  {
    id: 2,
    name: "Juan Pérez",
    document: "20123456789",
    address: "Calle Falsa 123",
  },
];

export const mockApi = {
  // Flag para identificar que estamos en modo demo
  isDemo: true,

  // ═══════════════════════════════════════════════════════════
  // PRODUCTOS
  // ═══════════════════════════════════════════════════════════
  getProducts: async () => {
    console.log("[Demo] Getting products...");
    return [
      ...mockProducts,
      {
        id: 999,
        name: "PRODUCTO PRUEBA",
        cost_price: 50,
        sale_price: 100,
        stock_quantity: 999,
        min_stock: 10,
        barcode: "123456",
        category: "Demo",
        measurement_unit: "un",
        is_promo: false,
      }, // Producto solicitado
    ];
  },

  getProductByBarcode: async (barcode) => {
    console.log("[Demo] Search by barcode:", barcode);
    if (barcode === "123456")
      return {
        id: 999,
        name: "PRODUCTO PRUEBA",
        cost_price: 50,
        sale_price: 100,
        stock_quantity: 999,
        min_stock: 10,
        barcode: "123456",
        category: "Demo",
        measurement_unit: "un",
        is_promo: false,
      };
    return mockProducts.find((p) => p.barcode === barcode) || null;
  },

  searchProducts: async (query) => {
    console.log("[Demo] Search query:", query);
    const q = query.toLowerCase();
    const results = mockProducts.filter(
      (p) => p.name.toLowerCase().includes(q) || p.barcode.includes(q)
    );
    if ("producto prueba".includes(q)) {
      results.push({
        id: 999,
        name: "PRODUCTO PRUEBA",
        cost_price: 50,
        sale_price: 100,
        stock_quantity: 999,
        min_stock: 10,
        barcode: "123456",
        category: "Demo",
        measurement_unit: "un",
        is_promo: false,
      });
    }
    return results;
  },

  addProduct: async (product) => {
    console.log("[Demo] Restricted");
    throw new Error("DEMO_RESTRICTED");
  },
  updateProduct: async (product) => {
    console.log("[Demo] Restricted");
    throw new Error("DEMO_RESTRICTED");
  },
  deleteProduct: async (id) => {
    console.log("[Demo] Restricted");
    throw new Error("DEMO_RESTRICTED");
  },

  getPromoItems: async (promoId) => [],
  addStockMovement: async (data) => {
    throw new Error("DEMO_RESTRICTED");
  },
  getStockMovements: async (productId) => [],
  printTicket: async (data) => console.log("[Demo] Print ticket skipped"),

  // ═══════════════════════════════════════════════════════════
  // VENTAS & CAJA
  // ═══════════════════════════════════════════════════════════
  createSale: async (saleData) => {
    console.log("[Demo] Creating Sale:", saleData);
    // Permitir la venta para la experiencia de usuario (según solicitud "realizar una venta")
    // Retornamos éxito simulado
    return { success: true, saleId: Math.floor(Math.random() * 1000) };
  },

  getCurrentSession: async () => ({
    id: 1,
    opening_balance: 5000,
    start_time: new Date().toISOString(),
  }),

  openCashSession: async () => {
    throw new Error("DEMO_RESTRICTED");
  },
  closeCashSession: async () => {
    throw new Error("DEMO_RESTRICTED");
  },
  getCashSummary: async () => ({
    opening_balance: 5000,
    sales_total: 15000,
    expenses_total: 2000,
    final_balance: 18000,
    payment_methods: { cash: 10000, card: 5000 },
  }),
  addCashMovement: async () => {
    throw new Error("DEMO_RESTRICTED");
  },
  getMovements: async () => [],

  // ═══════════════════════════════════════════════════════════
  // CLIENTES
  // ═══════════════════════════════════════════════════════════
  getCustomers: async () => [...mockCustomers],
  createCustomer: async () => {
    throw new Error("DEMO_RESTRICTED");
  },
  updateCustomer: async () => {
    throw new Error("DEMO_RESTRICTED");
  },
  deleteCustomer: async () => {
    throw new Error("DEMO_RESTRICTED");
  },
  processDebtPayment: async () => {
    throw new Error("DEMO_RESTRICTED");
  },

  // ═══════════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════════
  loginUser: async ({ username, password }) => {
    // Permitir admin/admin
    if (
      username === "admin" ||
      (username === "vendedor" && password === "123")
    ) {
      return {
        success: true,
        user: mockUsers.find((u) => u.username === username) || mockUsers[0],
      };
    }
    return { success: false, message: "Demo: Use usuario 'admin'" };
  },

  updateUser: async () => {
    throw new Error("DEMO_RESTRICTED");
  },
  getUsers: async () => [...mockUsers],
  createUser: async () => {
    throw new Error("DEMO_RESTRICTED");
  },
  deleteUser: async () => {
    throw new Error("DEMO_RESTRICTED");
  },
  exportData: async () => {
    throw new Error("DEMO_RESTRICTED");
  },
  sendEmailTicket: async () => console.log("[Demo] Email simulation"),

  // ═══════════════════════════════════════════════════════════
  // ESTADISTICAS
  // ═══════════════════════════════════════════════════════════
  getDashboardStats: async () => ({
    totalDay: 125000,
    totalMonth: 3500000,
    totalOrders: 45,
    lowStockCount: 2,
    salesChartData: [], // Prevent map error
    topProducts: [], // Prevent map error
  }),
  getProfitStats: async () => ({
    revenue: 10000,
    cost: 5000,
    totalProfit: 5000,
    margin: 50,
  }),
  getSalesHistory: async () => [],
  getSaleDetails: async () => null,
  getAdvancedReport: async () => [],
  getAllActivePromos: async () => [],

  // ═══════════════════════════════════════════════════════════
  // PROVEEDORES
  // ═══════════════════════════════════════════════════════════
  getSuppliers: async () => [],
  createSupplier: async () => {
    throw new Error("DEMO_RESTRICTED");
  },
  updateSupplier: async () => {
    throw new Error("DEMO_RESTRICTED");
  },
  deleteSupplier: async () => {
    throw new Error("DEMO_RESTRICTED");
  },

  // ═══════════════════════════════════════════════════════════
  // CONFIG
  // ═══════════════════════════════════════════════════════════
  getSettings: async () => ({
    kiosk_name: "Kiosco Demo", // Cambio solicitado
    kiosk_address: "Versión de Prueba Online",
    theme_color: "purple",
    theme_mode: "dark",
    tax_enabled: "false", // Importante string
  }),

  updateSettings: async (settings) => {
    console.log(
      "[Demo] Update settings restricted in logic, but returning success to not crash UI"
    );
    return true;
  },

  // ═══════════════════════════════════════════════════════════
  // EXTRAS
  // ═══════════════════════════════════════════════════════════
  onMobileScan: (cb) => {
    return () => {};
  },

  getServerInfo: async () => null,

  // AFIP MOCKS
  createElectronicInvoice: async () => {
    throw new Error("DEMO_RESTRICTED");
  },
};
