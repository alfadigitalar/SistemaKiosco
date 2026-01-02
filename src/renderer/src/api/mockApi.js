/**
 * MOCK API PARA VERSIÓN WEB (PORTFOLIO)
 * Simula el comportamiento del backend Electron para la demo en Vercel.
 */

const mockProducts = [
  {
    id: 1,
    name: "Coca Cola 500ml",
    price: 1500,
    stock: 50,
    barcode: "7790895000997",
    category: "Bebidas",
  },
  {
    id: 2,
    name: "Papas Lays Clásicas",
    price: 1200,
    stock: 20,
    barcode: "7791234567890",
    category: "Snacks",
  },
  {
    id: 3,
    name: "Alfajor Jorgito",
    price: 800,
    stock: 100,
    barcode: "7793344556677",
    category: "Golocinas",
  },
  {
    id: 4,
    name: "Agua Mineral 1L",
    price: 1000,
    stock: 30,
    barcode: "7799887766554",
    category: "Bebidas",
  },
  {
    id: 5,
    name: "Chicles Beldent",
    price: 500,
    stock: 200,
    barcode: "7791122334455",
    category: "Golocinas",
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
    return [...mockProducts];
  },

  getProductByBarcode: async (barcode) => {
    console.log("[Demo] Search by barcode:", barcode);
    return mockProducts.find((p) => p.barcode === barcode) || null;
  },

  searchProducts: async (query) => {
    console.log("[Demo] Search query:", query);
    const q = query.toLowerCase();
    return mockProducts.filter(
      (p) => p.name.toLowerCase().includes(q) || p.barcode.includes(q)
    );
  },

  addProduct: async (product) => {
    console.log("[Demo] Add product blocked");
    throw new Error("DEMO_RESTRICTED");
  },

  updateProduct: async (product) => {
    console.log("[Demo] Update product blocked");
    throw new Error("DEMO_RESTRICTED");
  },

  deleteProduct: async (id) => {
    console.log("[Demo] Delete product blocked");
    throw new Error("DEMO_RESTRICTED");
  },

  // ═══════════════════════════════════════════════════════════
  // VENTAS & CAJA
  // ═══════════════════════════════════════════════════════════
  createSale: async (saleData) => {
    console.log("[Demo] Create sale blocked", saleData);
    // Simulamos un pequeño delay para realismo
    await new Promise((resolve) => setTimeout(resolve, 500));
    throw new Error("DEMO_RESTRICTED");
  },

  getCurrentSession: async () => {
    // Simulamos que siempre hay una sesión abierta para no bloquear la UI de venta
    return {
      id: 1,
      opening_balance: 5000,
      start_time: new Date().toISOString(),
    };
  },

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

  // ═══════════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════════
  loginUser: async ({ username, password }) => {
    console.log("[Demo] Login:", username);
    const user = mockUsers.find((u) => u.username === username);

    // En demo, también permitimos 'admin' / 'admin' genérico si falla
    if (user && (user.password === password || password === "admin")) {
      return { success: true, user };
    }
    // Fallback: Login exitoso "mágico" para la demo si usan admin
    if (username === "admin") {
      return { success: true, user: mockUsers[0] };
    }

    return { success: false, message: "Demo: Use usuario 'admin'" };
  },

  updateUser: async () => {
    throw new Error("DEMO_RESTRICTED");
  },
  getUsers: async () => [...mockUsers],

  // ═══════════════════════════════════════════════════════════
  // CONFIG
  // ═══════════════════════════════════════════════════════════
  getSettings: async () => ({
    kiosk_name: "Kiosco Demo Portfolio",
    kiosk_address: "Online Demo",
    theme_color: "purple",
    theme_mode: "dark",
  }),

  updateSettings: async (settings) => {
    console.log("[Demo] Settings update simulated", settings);
    return true;
  },

  // ═══════════════════════════════════════════════════════════
  // EXTRAS
  // ═══════════════════════════════════════════════════════════
  onMobileScan: (cb) => {
    // Podríamos simular scans con teclas, por ahora no-op
    // Retornar función de limpieza dummy
    return () => {};
  },

  getServerInfo: async () => null,
  getAllActivePromos: async () => [],
  getDashboardStats: async () => ({
    dailySales: 125000,
    monthlySales: 3500000,
    totalOrders: 45,
    lowStockCount: 2,
  }),

  // AFIP MOCKS
  createElectronicInvoice: async () => {
    throw new Error("DEMO_RESTRICTED");
  },
};
