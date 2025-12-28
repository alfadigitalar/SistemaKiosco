const { ipcMain } = require("electron");
const { all, get, run } = require("./db");

/**
 * Registra todos los handlers IPC para la aplicación.
 * Usa ASYNC/AWAIT con los wrappers de Promesa de db.js
 */
function registerIpcHandlers() {
  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE PRODUCTOS
  // ═══════════════════════════════════════════════════════════

  // Obtener todos los productos activos
  ipcMain.handle("get-products", async () => {
    try {
      const rows = await all(
        "SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC"
      );
      return rows;
    } catch (error) {
      console.error("Error al obtener productos:", error);
      return [];
    }
  });

  // Obtener producto por código de barras
  ipcMain.handle("get-product-by-barcode", async (event, barcode) => {
    try {
      const row = await get(
        "SELECT * FROM products WHERE barcode = ? AND is_active = 1",
        [barcode]
      );
      return row;
    } catch (error) {
      console.error("Error al buscar producto por código:", error);
      return null;
    }
  });

  // Buscar productos por nombre (LIKE)
  ipcMain.handle("search-products", async (event, query) => {
    try {
      const rows = await all(
        "SELECT * FROM products WHERE name LIKE ? AND is_active = 1 LIMIT 20",
        [`%${query}%`]
      );
      return rows;
    } catch (error) {
      console.error("Error al buscar productos:", error);
      return [];
    }
  });

  // Crear nuevo producto
  ipcMain.handle("add-product", async (event, product) => {
    try {
      const {
        barcode,
        name,
        cost_price,
        sale_price,
        stock_quantity,
        min_stock,
        category_id,
        supplier_id,
      } = product;

      await run(
        `INSERT INTO products (barcode, name, cost_price, sale_price, stock_quantity, min_stock, category_id, supplier_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          barcode,
          name,
          cost_price,
          sale_price,
          stock_quantity,
          min_stock,
          category_id,
          supplier_id,
        ]
      );

      return { success: true };
    } catch (error) {
      console.error("Error al crear producto:", error);
      // Mejorar mensaje si es error de duplicado
      if (error.message.includes("UNIQUE constraint failed")) {
        return { success: false, error: "El código de barras ya existe." };
      }
      return { success: false, error: error.message };
    }
  });

  // Actualizar producto
  ipcMain.handle("update-product", async (event, product) => {
    try {
      const {
        id,
        barcode,
        name,
        cost_price,
        sale_price,
        stock_quantity,
        min_stock,
        category_id,
        supplier_id,
      } = product;

      await run(
        `UPDATE products 
         SET barcode=?, name=?, cost_price=?, sale_price=?, stock_quantity=?, min_stock=?, category_id=?, supplier_id=?
         WHERE id=?`,
        [
          barcode,
          name,
          cost_price,
          sale_price,
          stock_quantity,
          min_stock,
          category_id,
          supplier_id,
          id,
        ]
      );

      return { success: true };
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      if (error.message.includes("UNIQUE constraint failed")) {
        return { success: false, error: "El código de barras ya existe." };
      }
      return { success: false, error: error.message };
    }
  });

  // Eliminar producto (Soft Delete)
  ipcMain.handle("delete-product", async (event, id) => {
    try {
      await run("UPDATE products SET is_active = 0 WHERE id = ?", [id]);
      return { success: true };
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      return { success: false, error: error.message };
    }
  });

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE VENTAS
  // ═══════════════════════════════════════════════════════════

  /**
   * Crear nueva venta (TRANSACCIÓN COMPLETA)
   *
   * Recibe: {
   *   items: [{ id, cantidad, sale_price }],
   *   total: number,
   *   paymentMethod: string,
   *   userId: number (opcional),
   *   clientId: number (opcional)
   * }
   *
   * Proceso:
   * 1. Insertar en tabla 'sales'
   * 2. Insertar cada item en 'sale_items'
   * 3. Descontar stock de cada producto
   */
  ipcMain.handle("create-sale", async (event, saleData) => {
    try {
      const { items, total, paymentMethod, userId, clientId } = saleData;

      // 1. Insertar venta principal
      const insertResult = await run(
        `INSERT INTO sales (user_id, client_id, total_amount, payment_method)
         VALUES (?, ?, ?, ?)`,
        [userId || 1, clientId || null, total, paymentMethod]
      );

      // Obtener el ID de la venta recién creada
      const saleId = insertResult.lastId;

      if (!saleId) {
        throw new Error("No se pudo obtener el ID de la venta (lastId null)");
      }

      // 2. Insertar items y descontar stock
      for (const item of items) {
        // Insertar item de venta
        await run(
          `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price_at_sale, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [
            saleId,
            item.id,
            item.cantidad,
            item.sale_price,
            item.cantidad * item.sale_price,
          ]
        );

        // Descontar stock del producto
        await run(
          `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`,
          [item.cantidad, item.id]
        );
      }

      // 3. Si es Cuenta Corriente, actualizar deuda del cliente
      if (paymentMethod === "checking_account" && clientId) {
        await run(
          "UPDATE clients SET current_debt = current_debt + ? WHERE id = ?",
          [total, clientId]
        );
      }

      console.log(`✅ Venta #${saleId} registrada exitosamente`);
      return { success: true, saleId };
    } catch (error) {
      console.error("Error al procesar venta:", error);
      return { success: false, message: error.message };
    }
  });

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE CLIENTES
  // ═══════════════════════════════════════════════════════════

  // Obtener todos los clientes activos
  ipcMain.handle("get-customers", async () => {
    try {
      const rows = await all(
        "SELECT * FROM clients WHERE is_active = 1 ORDER BY name ASC"
      );
      return rows;
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      return [];
    }
  });

  // Crear nuevo cliente
  ipcMain.handle("create-customer", async (event, customer) => {
    try {
      const { name, dni, phone, current_debt } = customer;
      // Tratar DNI vacío como NULL para evitar error de UNIQUE
      const safeDni = dni && dni.trim() !== "" ? dni.trim() : null;

      await run(
        "INSERT INTO clients (name, dni, phone, current_debt) VALUES (?, ?, ?, ?)",
        [name, safeDni, phone, current_debt || 0]
      );
      return { success: true };
    } catch (error) {
      console.error("Error al crear cliente:", error);
      if (error.message.includes("UNIQUE constraint failed")) {
        return { success: false, message: "El DNI ya existe." };
      }
      return { success: false, message: error.message };
    }
  });

  // Actualizar cliente
  ipcMain.handle("update-customer", async (event, customer) => {
    try {
      const { id, name, dni, phone, current_debt } = customer;
      const safeDni = dni && dni.trim() !== "" ? dni.trim() : null;

      await run(
        "UPDATE clients SET name = ?, dni = ?, phone = ?, current_debt = ? WHERE id = ?",
        [name, safeDni, phone, current_debt, id]
      );
      return { success: true };
    } catch (error) {
      console.error("Error al actualizar cliente:", error);
      if (error.message.includes("UNIQUE constraint failed")) {
        return { success: false, message: "El DNI ya existe." };
      }
      return { success: false, message: error.message };
    }
  });

  // Eliminar cliente (Soft Delete)
  ipcMain.handle("delete-customer", async (event, id) => {
    try {
      await run("UPDATE clients SET is_active = 0 WHERE id = ?", [id]);
      return { success: true };
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      return { success: false, message: error.message };
    }
  });

  // Procesar pago de deuda
  ipcMain.handle(
    "process-debt-payment",
    async (event, { clientId, amount, userId }) => {
      try {
        // 1. Descontar deuda del cliente
        await run(
          "UPDATE clients SET current_debt = current_debt - ? WHERE id = ?",
          [amount, clientId]
        );

        // 2. Registrar movimiento en caja
        await run(
          "INSERT INTO movements (type, amount, description, user_id) VALUES (?, ?, ?, ?)",
          ["entry", amount, `Pago de deuda cliente #${clientId}`, userId || 1]
        );

        return { success: true };
      } catch (error) {
        console.error("Error al procesar pago de deuda:", error);
        return { success: false, message: error.message };
      }
    }
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE CONTROL DE CAJA
  // ═══════════════════════════════════════════════════════════

  // Obtener sesión actual (si hay una abierta)
  ipcMain.handle("get-current-session", async () => {
    try {
      const session = await get(
        "SELECT * FROM cash_sessions WHERE closed_at IS NULL ORDER BY id DESC LIMIT 1"
      );
      return session;
    } catch (error) {
      console.error("Error al obtener sesión de caja:", error);
      return null;
    }
  });

  // Abrir Caja
  ipcMain.handle(
    "open-cash-session",
    async (event, { initialAmount, userId }) => {
      try {
        // Verificar si ya hay una abierta
        const existing = await get(
          "SELECT id FROM cash_sessions WHERE closed_at IS NULL"
        );
        if (existing) {
          return { success: false, message: "Ya hay una caja abierta." };
        }

        await run(
          "INSERT INTO cash_sessions (user_id, initial_amount) VALUES (?, ?)",
          [userId, initialAmount]
        );
        return { success: true };
      } catch (error) {
        console.error("Error al abrir caja:", error);
        return { success: false, message: error.message };
      }
    }
  );

  // Cerrar Caja
  ipcMain.handle(
    "close-cash-session",
    async (event, { sessionId, finalAmount, totalSales, totalMovements }) => {
      try {
        await run(
          `UPDATE cash_sessions 
         SET closed_at = CURRENT_TIMESTAMP, final_amount = ?, total_sales = ?, total_movements = ? 
         WHERE id = ?`,
          [finalAmount, totalSales, totalMovements, sessionId]
        );
        return { success: true };
      } catch (error) {
        console.error("Error al cerrar caja:", error);
        return { success: false, message: error.message };
      }
    }
  );

  // Obtener Resumen de Caja (Ventas, Movimientos, Deudoas)
  ipcMain.handle("get-cash-summary", async (event, sessionId) => {
    try {
      // 1. Obtener fecha de inicio de la sesión
      const session = await get(
        "SELECT opened_at, initial_amount FROM cash_sessions WHERE id = ?",
        [sessionId]
      );
      if (!session) throw new Error("Sesión no encontrada");

      const startDate = session.opened_at;

      // 2. Sumar Ventas en EFECTIVO desde esa fecha
      // Nota: asumimos que payment_method 'cash' es efectivo.
      const salesResult = await get(
        `SELECT SUM(total_amount) as total 
         FROM sales 
         WHERE timestamp >= ? AND payment_method = 'efectivo'`, // Ajustar 'efectivo' según como lo guardes en POS
        [startDate]
      );
      const totalSalesCash = salesResult.total || 0;

      // 3. Sumar Movimientos (Entradas y Salidas)
      const movementsResult = await all(
        "SELECT type, SUM(amount) as total FROM movements WHERE timestamp >= ? GROUP BY type",
        [startDate]
      );

      let totalIn = 0;
      let totalOut = 0;

      movementsResult.forEach((row) => {
        if (row.type === "entry") totalIn += row.total;
        if (row.type === "withdrawal") totalOut += row.total;
      });

      // Calculo final teórico
      const finalBalance =
        session.initial_amount + totalSalesCash + totalIn - totalOut;

      return {
        initialAmount: session.initial_amount,
        totalSalesCash,
        totalIn,
        totalOut,
        finalBalance,
      };
    } catch (error) {
      console.error("Error al obtener resumen:", error);
      return { error: error.message };
    }
  });

  // Agregar Movimiento Manual
  ipcMain.handle("add-cash-movement", async (event, movement) => {
    try {
      const { type, amount, description, userId } = movement;
      await run(
        "INSERT INTO movements (type, amount, description, user_id) VALUES (?, ?, ?, ?)",
        [type, amount, description, userId]
      );
      return { success: true };
    } catch (error) {
      console.error("Error al agregar movimiento:", error);
      return { success: false, message: error.message };
    }
  });

  // Obtener Movimientos Recientes
  ipcMain.handle("get-movements", async (event, limit = 50) => {
    try {
      const rows = await all(
        "SELECT * FROM movements ORDER BY id DESC LIMIT ?",
        [limit]
      );
      return rows;
    } catch (error) {
      return [];
    }
  });

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE ESTADÍSTICAS Y DASHBOARD
  // ═══════════════════════════════════════════════════════════

  ipcMain.handle("get-dashboard-stats", async () => {
    try {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const firstDayOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      )
        .toISOString()
        .split("T")[0];

      // 1. Ventas de Hoy
      const salesToday = await get(
        "SELECT SUM(total_amount) as total FROM sales WHERE date(timestamp) = date('now', 'localtime')"
      );

      // 2. Ventas del Mes
      const salesMonth = await get(
        "SELECT SUM(total_amount) as total FROM sales WHERE date(timestamp) >= ?",
        [firstDayOfMonth]
      );

      // 3. Productos con Stock Bajo
      const lowStock = await get(
        "SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock AND is_active = 1"
      );

      // 4. Últimas 5 ventas
      const lastSales = await all(
        `SELECT s.id, s.timestamp, s.total_amount, u.name as user_name 
         FROM sales s 
         LEFT JOIN users u ON s.user_id = u.id 
         ORDER BY s.id DESC LIMIT 5`
      );

      // 5. Top 5 Productos más vendidos (Histórico)
      const topProducts = await all(
        `SELECT p.name, SUM(si.quantity) as total_qty
         FROM sale_items si
         JOIN products p ON si.product_id = p.id
         GROUP BY si.product_id
         ORDER BY total_qty DESC
         LIMIT 5`
      );

      // 6. Ventas últimos 7 días (para gráfico)
      const salesLast7Days = await all(
        `SELECT date(timestamp) as date, SUM(total_amount) as total
         FROM sales
         WHERE date(timestamp) >= date('now', '-6 days')
         GROUP BY date(timestamp)
         ORDER BY date(timestamp) ASC`
      );

      return {
        totalDay: salesToday?.total || 0,
        totalMonth: salesMonth?.total || 0,
        lowStockCount: lowStock?.count || 0,
        lastSales,
        topProducts,
        salesChartData: salesLast7Days,
      };
    } catch (error) {
      console.error("Error al obtener stats:", error);
      return {
        totalDay: 0,
        totalMonth: 0,
        lowStockCount: 0,
        lastSales: [],
        topProducts: [],
        salesChartData: [],
      };
    }
  });

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE HISTORIAL
  // ═══════════════════════════════════════════════════════════

  ipcMain.handle("get-sales-history", async (event, { startDate, endDate }) => {
    try {
      let query = `
        SELECT s.id, s.timestamp, s.total_amount, s.payment_method, 
               c.name as client_name, u.name as user_name
        FROM sales s
        LEFT JOIN clients c ON s.client_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE 1=1
      `;

      const params = [];

      if (startDate) {
        query += " AND date(s.timestamp) >= ?";
        params.push(startDate);
      }
      if (endDate) {
        query += " AND date(s.timestamp) <= ?";
        params.push(endDate);
      }

      query += " ORDER BY s.id DESC LIMIT 100"; // Límite de seguridad

      const rows = await all(query, params);
      return rows;
    } catch (error) {
      console.error("Error al obtener historial:", error);
      return [];
    }
  });

  // Obtener detalle de una venta
  ipcMain.handle("get-sale-details", async (event, saleId) => {
    try {
      const items = await all(
        `
            SELECT si.*, p.name as product_name, p.barcode
            FROM sale_items si
            LEFT JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
          `,
        [saleId]
      );
      return items;
    } catch (error) {
      console.error("Error al obtener detalle venta:", error);
      return [];
    }
  });

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE PROVEEDORES
  // ═══════════════════════════════════════════════════════════

  // Obtener proveedores
  ipcMain.handle("get-suppliers", async () => {
    try {
      const rows = await all(
        "SELECT * FROM suppliers WHERE is_active = 1 ORDER BY name ASC"
      );
      return rows;
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
      return [];
    }
  });

  // Crear proveedor
  ipcMain.handle("create-supplier", async (event, supplier) => {
    try {
      const { name, contact_name, phone, email, notes } = supplier;
      await run(
        "INSERT INTO suppliers (name, contact_name, phone, email, notes) VALUES (?, ?, ?, ?, ?)",
        [name, contact_name, phone, email, notes]
      );
      return { success: true };
    } catch (error) {
      console.error("Error al crear proveedor:", error);
      return { success: false, message: error.message };
    }
  });

  // Actualizar proveedor
  ipcMain.handle("update-supplier", async (event, supplier) => {
    try {
      const { id, name, contact_name, phone, email, notes } = supplier;
      await run(
        "UPDATE suppliers SET name=?, contact_name=?, phone=?, email=?, notes=? WHERE id=?",
        [name, contact_name, phone, email, notes, id]
      );
      return { success: true };
    } catch (error) {
      console.error("Error al actualizar proveedor:", error);
      return { success: false, message: error.message };
    }
  });

  // Eliminar proveedor
  ipcMain.handle("delete-supplier", async (event, id) => {
    try {
      await run("UPDATE suppliers SET is_active = 0 WHERE id = ?", [id]);
      return { success: true };
    } catch (error) {
      console.error("Error al eliminar proveedor:", error);
      return { success: false, message: error.message };
    }
  });

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE CONFIGURACIÓN
  // ═══════════════════════════════════════════════════════════

  // Obtener configuraciones
  ipcMain.handle("get-settings", async () => {
    try {
      const rows = await all("SELECT * FROM settings");
      const settings = {
        kiosk_name: "Kiosco System",
        theme_color: "blue",
      };
      rows.forEach((row) => {
        settings[row.key] = row.value;
      });
      return settings;
    } catch (error) {
      console.error("Error al obtener settings:", error);
      return { kiosk_name: "Kiosco System", theme_color: "blue" };
    }
  });

  // Actualizar configuraciones
  ipcMain.handle("update-settings", async (event, settings) => {
    try {
      // settings es un objeto { kiosk_name: '...', theme_color: '...' }
      for (const [key, value] of Object.entries(settings)) {
        // Upsert manual: intentar update, si no afecta filas, hacer insert
        // SQLite no tiene ON CONFLICT en UPDATE standard fácilmente sin UNIQUE index, pero key es PK.
        // Usaremos REPLACE INTO o INSERT OR REPLACE
        await run(
          "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
          [key, value]
        );
      }
      return { success: true };
    } catch (error) {
      console.error("Error al actualizar settings:", error);
      return { success: false, message: error.message };
    }
  });

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE USUARIO / AUTENTICACIÓN
  // ═══════════════════════════════════════════════════════════

  // Login de usuario
  ipcMain.handle("login-user", async (event, { username, password }) => {
    try {
      console.log(
        `[LOGIN DEBUG] Intentando login con usuario: '${username}' y contraseña: '${password}'`
      );

      // 1. Buscar usuario por nombre de usuario solamente
      const user = await get("SELECT * FROM users WHERE username = ?", [
        username,
      ]);

      if (!user) {
        console.log(
          `[LOGIN DEBUG] ❌ Usuario '${username}' NO encontrado en la base de datos.`
        );

        // DEBUG: Mostrar qué usuarios SÍ existen para comparar
        const allUsers = await all("SELECT id, username FROM users");
        console.log(
          "[LOGIN DEBUG] Usuarios disponibles en DB:",
          allUsers.map((u) => `"${u.username}"`)
        );

        return { success: false, message: "Usuario no encontrado" };
      }

      console.log(
        `[LOGIN DEBUG] ✅ Usuario encontrado: ID=${user.id}, Nombre='${user.name}', Role='${user.role}'`
      );
      console.log(
        `[LOGIN DEBUG] Contraseña almacenada en DB: '${user.password_hash}'`
      );

      // 2. Verificar contraseña (comparación directa de texto)
      // Nota: SQLite es case-sensitive por defecto solo si no se cambia el collation,
      // pero en JS la comparación === es estricta.
      if (user.password_hash === password) {
        console.log(`[LOGIN DEBUG] ✅ Contraseña CORRECTA.`);
        return { success: true, name: user.name, role: user.role, id: user.id };
      } else {
        console.log(
          `[LOGIN DEBUG] ❌ Contraseña INCORRECTA. La DB espera '${user.password_hash}' pero recibió '${password}'`
        );
        return { success: false, message: "Contraseña incorrecta" };
      }
    } catch (error) {
      console.error("Error de login:", error);
      return { success: false, message: "Error del servidor" };
    }
  });

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE GESTIÓN DE USUARIOS (CRUD)
  // ═══════════════════════════════════════════════════════════

  // Obtener todos los usuarios activos
  ipcMain.handle("get-users", async () => {
    try {
      // Ocultamos el hash en la lista (opcional, pero buena práctica)
      // Aunque para editar a veces se necesita saber si tiene pass.
      const rows = await all(
        "SELECT id, name, username, role, active FROM users WHERE active = 1 ORDER BY name ASC"
      );
      return rows;
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      return [];
    }
  });

  // Crear usuario
  ipcMain.handle("create-user", async (event, userData) => {
    try {
      const { name, username, password, role } = userData;
      // TODO: En el futuro, usar bcrypt para hashear password.
      // Por ahora texto plano como el resto del sistema.
      await run(
        "INSERT INTO users (name, username, password_hash, role, active) VALUES (?, ?, ?, ?, 1)",
        [name, username, password, role || "employee"]
      );
      return { success: true };
    } catch (error) {
      console.error("Error al crear usuario:", error);
      if (error.message.includes("UNIQUE constraint failed")) {
        return { success: false, message: "El nombre de usuario ya existe." };
      }
      return { success: false, message: error.message };
    }
  });

  // Actualizar usuario
  ipcMain.handle("update-user", async (event, userData) => {
    try {
      const { id, name, username, password, role } = userData;

      if (password && password.trim() !== "") {
        // Si viene password, actualizamos todo
        await run(
          "UPDATE users SET name=?, username=?, password_hash=?, role=? WHERE id=?",
          [name, username, password, role, id]
        );
      } else {
        // Si no, solo datos
        await run("UPDATE users SET name=?, username=?, role=? WHERE id=?", [
          name,
          username,
          role,
          id,
        ]);
      }
      return { success: true };
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      if (error.message.includes("UNIQUE constraint failed")) {
        return { success: false, message: "El nombre de usuario ya existe." };
      }
      return { success: false, message: error.message };
    }
  });

  // Eliminar usuario (Soft Delete)
  ipcMain.handle("delete-user", async (event, id) => {
    try {
      // Evitar borrar al admin principal (id 1 usualmente)
      // O chequear nombre de usuario 'admin'
      if (id === 1) {
        return {
          success: false,
          message: "No se puede eliminar al Administrador principal.",
        };
      }
      await run("UPDATE users SET active = 0 WHERE id = ?", [id]);
      return { success: true };
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      return { success: false, message: error.message };
    }
  });
}

module.exports = { registerIpcHandlers };
