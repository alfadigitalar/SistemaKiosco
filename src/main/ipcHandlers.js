const { ipcMain, dialog } = require("electron");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
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
  // Obtener todos los productos activos
  ipcMain.handle("get-products", async () => {
    try {
      // Calculamos el stock dinámico para promos basado en sus componentes
      const query = `
        SELECT p.*,
          (
            SELECT MIN(CAST(comp.stock_quantity / pi.quantity AS INTEGER))
            FROM promo_items pi
            JOIN products comp ON pi.product_id = comp.id
            WHERE pi.promo_id = p.id
          ) as calculated_promo_stock
        FROM products p
        WHERE p.is_active = 1 
        ORDER BY p.name ASC
      `;

      const rows = await all(query);

      // Sobrescribimos stock_quantity si es promo
      return rows.map((p) => ({
        ...p,
        stock_quantity: p.is_promo
          ? p.calculated_promo_stock !== null
            ? p.calculated_promo_stock
            : 0
          : p.stock_quantity,
      }));
    } catch (error) {
      console.error("Error al obtener productos:", error);
      return [];
    }
  });

  // Obtener producto por código de barras
  // Obtener producto por código de barras
  ipcMain.handle("get-product-by-barcode", async (event, barcode) => {
    try {
      const query = `
        SELECT p.*,
          (
            SELECT MIN(CAST(comp.stock_quantity / pi.quantity AS INTEGER))
            FROM promo_items pi
            JOIN products comp ON pi.product_id = comp.id
            WHERE pi.promo_id = p.id
          ) as calculated_promo_stock
        FROM products p
        WHERE p.barcode = ? AND p.is_active = 1
      `;

      const row = await get(query, [barcode]);

      if (row) {
        row.stock_quantity = row.is_promo
          ? row.calculated_promo_stock !== null
            ? row.calculated_promo_stock
            : 0
          : row.stock_quantity;
      }
      return row;
    } catch (error) {
      console.error("Error al buscar producto por código:", error);
      return null;
    }
  });

  // Buscar productos por nombre (LIKE)
  // Buscar productos por nombre (LIKE)
  ipcMain.handle("search-products", async (event, query) => {
    try {
      const sql = `
        SELECT p.*,
          (
            SELECT MIN(CAST(comp.stock_quantity / pi.quantity AS INTEGER))
            FROM promo_items pi
            JOIN products comp ON pi.product_id = comp.id
            WHERE pi.promo_id = p.id
          ) as calculated_promo_stock
        FROM products p
        WHERE p.name LIKE ? AND p.is_active = 1 
        LIMIT 20
      `;

      const rows = await all(sql, [`%${query}%`]);

      return rows.map((p) => ({
        ...p,
        stock_quantity: p.is_promo
          ? p.calculated_promo_stock !== null
            ? p.calculated_promo_stock
            : 0
          : p.stock_quantity,
      }));
    } catch (error) {
      console.error("Error al buscar productos:", error);
      return [];
    }
  });

  // Crear nuevo producto (o Promo)
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
        measurement_unit,
        is_promo, // Nuevo
        promo_items, // Nuevo: Array de { product_id, quantity }
      } = product;

      const result = await run(
        `INSERT INTO products (barcode, name, cost_price, sale_price, stock_quantity, min_stock, category_id, supplier_id, measurement_unit, is_promo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          barcode || null,
          name || "", // Prevent NOT NULL error if undefined
          cost_price || 0,
          sale_price || 0,
          stock_quantity || 0,
          min_stock || 0,
          category_id,
          supplier_id,
          measurement_unit || "un",
          is_promo ? 1 : 0,
        ]
      );

      const newProductId = result.lastId;

      // Si es promo, insertar sus items
      if (is_promo && promo_items && Array.isArray(promo_items)) {
        for (const item of promo_items) {
          await run(
            "INSERT INTO promo_items (promo_id, product_id, quantity) VALUES (?, ?, ?)",
            [newProductId, item.product_id, item.quantity]
          );
        }
      }

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

        measurement_unit,
        is_promo, // Nuevo
        promo_items, // Nuevo
      } = product;

      await run(
        `UPDATE products 
         SET barcode=?, name=?, cost_price=?, sale_price=?, stock_quantity=?, min_stock=?, category_id=?, supplier_id=?, measurement_unit=?, is_promo=?
         WHERE id=?`,
        [
          barcode || null, // Allow NULL if empty string
          name || "",
          cost_price || 0,
          sale_price || 0,
          stock_quantity || 0,
          min_stock || 0,
          category_id,
          supplier_id,
          measurement_unit || "un",
          is_promo ? 1 : 0, // is_promo no estaba en el update, agregarlo
          id,
        ]
      );

      // Si es promo, actualizar items (Borrar y Reinsertar es lo más fácil)
      if (is_promo) {
        // 1. Borrar items viejos
        await run("DELETE FROM promo_items WHERE promo_id = ?", [id]);

        // 2. Insertar nuevos
        if (promo_items && Array.isArray(promo_items)) {
          for (const item of promo_items) {
            await run(
              "INSERT INTO promo_items (promo_id, product_id, quantity) VALUES (?, ?, ?)",
              [id, item.product_id, item.quantity]
            );
          }
        }
      }

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

  // Obtener items de una promo
  ipcMain.handle("get-promo-items", async (event, promoId) => {
    try {
      // Join con products para obtener nombres de componentes
      const items = await all(
        `
              SELECT pi.*, p.name, p.barcode 
              FROM promo_items pi
              JOIN products p ON pi.product_id = p.id
              WHERE pi.promo_id = ?
          `,
        [promoId]
      );
      return items;
    } catch (error) {
      console.error("Error al obtener items de promo:", error);
      return [];
    }
  });

  // Obtener todas las promos activas con sus items (para detección automática en POS)
  ipcMain.handle("get-all-active-promos", async () => {
    try {
      // 1. Obtener productos que son promos activos
      const promos = await all(
        "SELECT * FROM products WHERE is_promo = 1 AND is_active = 1"
      );

      // 2. Para cada promo, obtener sus items
      const promosWithItems = await Promise.all(
        promos.map(async (promo) => {
          const promoItems = await all(
            `SELECT pi.*, p.name, p.barcode 
             FROM promo_items pi
             JOIN products p ON pi.product_id = p.id
             WHERE pi.promo_id = ?`,
            [promo.id]
          );
          return { ...promo, items: promoItems };
        })
      );

      return promosWithItems;
    } catch (error) {
      console.error("Error al obtener promos activas:", error);
      return [];
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

      // Generar timestamp LOCAL (YYYY-MM-DD HH:MM:SS)
      // SQLite store dates as strings, defaulting to UTC. We want Local Time.
      // Generar timestamp LOCAL (YYYY-MM-DD HH:MM:SS) usando el reloj del sistema
      const now = new Date();
      const localTimestamp =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0") +
        " " +
        String(now.getHours()).padStart(2, "0") +
        ":" +
        String(now.getMinutes()).padStart(2, "0") +
        ":" +
        String(now.getSeconds()).padStart(2, "0");

      // 1. Insertar venta principal
      const insertResult = await run(
        `INSERT INTO sales (user_id, client_id, total_amount, payment_method, timestamp)
         VALUES (?, ?, ?, ?, ?)`,
        [userId || 1, clientId || null, total, paymentMethod, localTimestamp]
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

        // Descontar stock del producto (Manejo de Promos)
        // Verificar si es promo
        const productInfo = await get(
          "SELECT is_promo FROM products WHERE id = ?",
          [item.id]
        );

        if (productInfo && productInfo.is_promo === 1) {
          // Es promo: Descontar stock de sus componentes
          const components = await all(
            "SELECT product_id, quantity FROM promo_items WHERE promo_id = ?",
            [item.id]
          );
          for (const comp of components) {
            // Cantidad a descontar = (qtyComponente * qtyVenta)
            await run(
              "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
              [comp.quantity * item.cantidad, comp.product_id]
            );
            // Opcional: Registrar movimiento de stock para cada componente (si tuviéramos tabla detallada)
          }
        } else {
          // Es producto normal
          await run(
            `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`,
            [item.cantidad, item.id]
          );
        }
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
    async (
      event,
      { sessionId, finalAmount, totalSales, totalMovements, realAmount }
    ) => {
      try {
        const difference =
          realAmount !== undefined ? realAmount - finalAmount : 0;

        await run(
          `UPDATE cash_sessions 
         SET closed_at = CURRENT_TIMESTAMP, final_amount = ?, total_sales = ?, total_movements = ?, real_amount = ?, difference = ?
         WHERE id = ?`,
          [
            finalAmount,
            totalSales,
            totalMovements,
            realAmount !== undefined ? realAmount : null,
            difference,
            sessionId,
          ]
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

      // VALIDACIÓN DE SALDO NEGATIVO
      if (type === "withdrawal") {
        // 1. Obtener Sesión Actual
        const session = await get(
          "SELECT * FROM cash_sessions WHERE closed_at IS NULL ORDER BY id DESC LIMIT 1"
        );

        if (!session) throw new Error("No hay caja abierta.");

        // 2. Calcular Saldo Actual
        const startDate = session.opened_at;

        // Ventas Efectivo
        const salesResult = await get(
          "SELECT SUM(total_amount) as total FROM sales WHERE timestamp >= ? AND payment_method = 'efectivo'",
          [startDate]
        );
        const totalSales = salesResult.total || 0;

        // Movimientos Previos
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

        const currentBalance =
          session.initial_amount + totalSales + totalIn - totalOut;

        // 3. Verificar si alcanza
        if (amount > currentBalance) {
          return {
            success: false,
            message: `Saldo insuficiente. Disponible: $${currentBalance.toLocaleString()}`,
          };
        }
      }

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
        "SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock AND is_active = 1 AND (is_promo = 0 OR is_promo IS NULL)"
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

  // Reporte Avanzado (Rango de Fechas)
  ipcMain.handle(
    "get-advanced-report",
    async (event, { startDate, endDate }) => {
      try {
        // Validar fechas
        if (!startDate || !endDate) {
          throw new Error("Se requieren fechas de inicio y fin.");
        }

        const start = startDate + " 00:00:00";
        const end = endDate + " 23:59:59";

        // 1. Resumen General (Ventas, Ganancia, Transacciones, Ticket Promedio)
        const summaryQuery = `
        SELECT 
          COUNT(s.id) as totalTransactions,
          SUM(s.total_amount) as totalSales,
          AVG(s.total_amount) as averageTicket,
          SUM(
            (SELECT SUM((si.unit_price_at_sale - COALESCE(p.cost_price, 0)) * si.quantity)
             FROM sale_items si
             JOIN products p ON si.product_id = p.id
             WHERE si.sale_id = s.id)
          ) as estimatedProfit
        FROM sales s
        WHERE s.timestamp >= ? AND s.timestamp <= ?
      `; // SQLite uses ISO strings for comparison

        const summary = await get(summaryQuery, [start, end]);

        // 2. Ventas por Día (Para el Gráfico)
        const salesByDayQuery = `
         SELECT 
           date(timestamp) as date,
           SUM(total_amount) as total
         FROM sales
         WHERE timestamp >= ? AND timestamp <= ?
         GROUP BY date(timestamp)
         ORDER BY date(timestamp) ASC
       `;
        const salesByDay = await all(salesByDayQuery, [start, end]);

        // 3. Top Productos más vendidos en el periodo
        const topProductsQuery = `
         SELECT 
           p.name,
           SUM(si.quantity) as quantity,
           SUM(si.subtotal) as total
         FROM sale_items si
         JOIN sales s ON si.sale_id = s.id
         JOIN products p ON si.product_id = p.id
         WHERE s.timestamp >= ? AND s.timestamp <= ?
         GROUP BY si.product_id
         ORDER BY quantity DESC
         LIMIT 10
       `;
        const topProducts = await all(topProductsQuery, [start, end]);

        return {
          summary: {
            totalTransactions: summary.totalTransactions || 0,
            totalSales: summary.totalSales || 0,
            averageTicket: summary.averageTicket || 0,
            estimatedProfit: summary.estimatedProfit || 0,
          },
          salesByDay: salesByDay || [],
          topProducts: topProducts || [],
        };
      } catch (error) {
        console.error("Error en reporte avanzado:", error);
        return { error: error.message };
      }
    }
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE DEVOLUCIONES
  // ═══════════════════════════════════════════════════════════

  ipcMain.handle("process-return", async (event, returnData) => {
    try {
      const { items, totalRefund, saleId, userId, reason } = returnData;

      await run("BEGIN TRANSACTION");

      // 1. Registrar devolución
      const result = await run(
        "INSERT INTO returns (sale_id, total_refund, reason, user_id) VALUES (?, ?, ?, ?)",
        [saleId, totalRefund, reason || "Devolución", userId]
      );
      // 'run' en db.js devuelve Changes info, pero necesitamos el ID.
      // sql.js devuelve el lastInsertId en el result object si modificamos db.js,
      // pero por defecto db.js wrapper devuelve algo?
      // Revisé db.js y devuelve: return db.prepare(sql).run(params); (o similar).
      // better-sqlite3 style: result.lastInsertRowid.
      // sql.js 'run' returns nothing useful directly usually, but let's check db.js implementation.
      // Si db.js usa db.run(sql, params), sql.js no devuelve el ID ahí.
      // Necesito 'select last_insert_rowid()'.

      const idResult = await get("SELECT last_insert_rowid() as id");
      const returnId = idResult.id;

      // 2. Procesar Items
      for (const item of items) {
        // a. Registrar item de devolución
        await run(
          "INSERT INTO return_items (return_id, product_id, quantity, refund_price, subtotal) VALUES (?, ?, ?, ?, ?)",
          [
            returnId,
            item.productId,
            item.quantity,
            item.price,
            item.quantity * item.price,
          ]
        );

        // b. Devolver Stock
        await run(
          "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?",
          [item.quantity, item.productId]
        );

        // c. Registrar Movimiento de Stock
        await run(
          "INSERT INTO stock_movements (product_id, type, quantity, reason, user_id) VALUES (?, 'return', ?, ?, ?)",
          [
            item.productId,
            item.quantity,
            `Devolución Ticket #${saleId}`,
            userId,
          ]
        );
      }

      // 3. Registrar Salida de Caja (Refund)
      // Solo si el monto es > 0
      if (totalRefund > 0) {
        await run(
          "INSERT INTO movements (type, amount, description, user_id) VALUES ('withdrawal', ?, ?, ?)",
          [totalRefund, `Reembolso Devolución Ticket #${saleId}`, userId]
        );
      }

      await run("COMMIT");
      return { success: true, returnId };
    } catch (error) {
      await run("ROLLBACK");
      console.error("Error processing return:", error);
      return { success: false, message: error.message };
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

  // Obtener estadísticas de ganancias (Real Profit)
  ipcMain.handle("get-profit-stats", async (event, { startDate, endDate }) => {
    try {
      let query = `
        SELECT 
          SUM((si.unit_price_at_sale - COALESCE(p.cost_price, 0)) * si.quantity) as total_profit,
          SUM(si.unit_price_at_sale * si.quantity) as total_revenue,
          SUM(COALESCE(p.cost_price, 0) * si.quantity) as total_cost
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        LEFT JOIN sales s ON si.sale_id = s.id
        WHERE 1=1
      `;

      const params = [];

      if (startDate) {
        // SQLite string comparison works for ISO dates
        query += " AND s.timestamp >= ?";
        params.push(startDate + " 00:00:00");
      }
      if (endDate) {
        query += " AND s.timestamp <= ?";
        params.push(endDate + " 23:59:59");
      }

      const result = await get(query, params);
      // Ensure we return numbers, not nulls
      return {
        totalProfit: result && result.total_profit ? result.total_profit : 0,
        totalRevenue: result && result.total_revenue ? result.total_revenue : 0,
        totalCost: result && result.total_cost ? result.total_cost : 0,
      };
    } catch (error) {
      console.error("Error al obtener ganancias:", error);
      return { totalProfit: 0, totalRevenue: 0, totalCost: 0 };
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
        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            birthday: user.birthday,
            profile_picture: user.profile_picture,
            created_at: user.created_at,
          },
        };
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
      const { id, name, username, password, role, birthday, profile_picture } =
        userData;

      // Construcción dinámica del query
      console.log("[UPDATE DEBUG] Recibida data:", {
        id,
        name,
        username,
        hasBirthday: !!birthday,
        hasPic: !!profile_picture,
      });
      if (profile_picture)
        console.log("[UPDATE DEBUG] Pic Length:", profile_picture.length);

      let fields = [];
      let params = [];

      if (name) {
        fields.push("name=?");
        params.push(name);
      }
      if (username) {
        fields.push("username=?");
        params.push(username);
      }
      if (password && password.trim() !== "") {
        fields.push("password_hash=?");
        params.push(password);
      }
      if (role) {
        fields.push("role=?");
        params.push(role);
      }

      // Permitir borrar (null) o actualizar
      if (birthday !== undefined) {
        fields.push("birthday=?");
        params.push(birthday);
      }
      if (profile_picture !== undefined) {
        fields.push("profile_picture=?");
        params.push(profile_picture);
      }

      params.push(id); // WHERE id=?

      if (fields.length > 0) {
        const sql = `UPDATE users SET ${fields.join(", ")} WHERE id=?`;
        await run(sql, params);
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

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE CONTROL DE STOCK
  // ═══════════════════════════════════════════════════════════

  // Registrar movimiento de stock y actualizar inventario
  ipcMain.handle("add-stock-movement", async (event, movement) => {
    try {
      const { product_id, type, quantity, reason, user_id } = movement;

      // 1. Registrar Movimiento
      await run(
        "INSERT INTO stock_movements (product_id, type, quantity, reason, user_id) VALUES (?, ?, ?, ?, ?)",
        [product_id, type, quantity, reason, user_id]
      );

      // 2. Actualizar Stock del Producto
      // Si es entrada (purchase, adjustment_add, return) -> SUMA
      // Si es salida (sale, adjustment_sub, loss) -> RESTA
      let operator = "+";
      if (["sale", "adjustment_sub", "loss"].includes(type)) {
        operator = "-";
      }

      await run(
        `UPDATE products SET stock_quantity = stock_quantity ${operator} ? WHERE id = ?`,
        [quantity, product_id]
      );

      return { success: true };
    } catch (error) {
      console.error("Error al registrar movimiento:", error);
      return { success: false, message: error.message };
    }
  });

  // Obtener historial de movimientos de un producto
  ipcMain.handle("get-stock-movements", async (event, productId) => {
    try {
      const rows = await all(
        `SELECT sm.*, u.name as user_name 
         FROM stock_movements sm
         LEFT JOIN users u ON sm.user_id = u.id
         WHERE sm.product_id = ?
         ORDER BY sm.timestamp DESC`,
        [productId]
      );
      return rows;
    } catch (error) {
      console.error("Error al obtener movimientos:", error);
      return [];
    }
  });

  // ═══════════════════════════════════════════════════════════
  // HANDLERS GENERALES
  // ═══════════════════════════════════════════════════════════

  // Exportar Data a CSV
  ipcMain.handle("export-data", async (event) => {
    try {
      // 1. Seleccionar Carpeta
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: "Seleccionar Carpeta para Exportar",
        properties: ["openDirectory"],
      });

      if (canceled || filePaths.length === 0) {
        return { success: false, message: "Exportación cancelada" };
      }

      const destFolder = filePaths[0];

      // 2. Helper to CSV
      const toCSV = (rows) => {
        if (!rows || rows.length === 0) return "";
        const headers = Object.keys(rows[0]);
        const headerRow = headers.join(",");
        const values = rows.map((row) =>
          headers
            .map((field) => {
              let val =
                row[field] === null || row[field] === undefined
                  ? ""
                  : row[field];
              val = val.toString().replace(/"/g, '""'); // Escape quotes
              if (val.search(/("|,|\n)/g) >= 0) val = `"${val}"`; // Quote if needed
              return val;
            })
            .join(",")
        );
        return [headerRow, ...values].join("\n");
      };

      // 3. Fetch & Write Products
      const products = await all("SELECT * FROM products");
      fs.writeFileSync(
        path.join(destFolder, "productos_novy.csv"),
        toCSV(products)
      );

      // 4. Fetch & Write Clients
      const clients = await all("SELECT * FROM clients");
      fs.writeFileSync(
        path.join(destFolder, "clientes_novy.csv"),
        toCSV(clients)
      );

      // 5. Fetch & Write Sales
      const sales = await all(`
        SELECT s.id, s.timestamp, s.total_amount, s.payment_method, 
               u.name as vendedor, c.name as cliente 
        FROM sales s 
        LEFT JOIN users u ON s.user_id = u.id 
        LEFT JOIN clients c ON s.client_id = c.id
      `);
      fs.writeFileSync(path.join(destFolder, "ventas_novy.csv"), toCSV(sales));

      return { success: true, path: destFolder };
    } catch (error) {
      console.error("Error exporting data:", error);
      return { success: false, message: error.message };
    }
  });

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE EMAIL (Fase 35)
  // ═══════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE ARCA / AFIP (Fase 40)
  // ═══════════════════════════════════════════════════════════
  const { createInvoice } = require("./afipService");

  ipcMain.handle(
    "create-electronic-invoice",
    async (event, { saleId, total, items, clientDoc }) => {
      try {
        // 1. Obtener configuración
        const settingsRows = await all(
          "SELECT key, value FROM settings WHERE key IN ('tax_enabled', 'tax_cuit', 'tax_sales_point', 'tax_cert_path', 'tax_key_path')"
        );
        const config = {};
        settingsRows.forEach((row) => (config[row.key] = row.value));

        // Validar si está habilitado
        if (config.tax_enabled !== "true") {
          return {
            success: false,
            message: "Facturación electrónica deshabilitada",
          };
        }

        // Validar datos mínimos
        if (
          !config.tax_cuit ||
          !config.tax_sales_point ||
          !config.tax_cert_path ||
          !config.tax_key_path
        ) {
          return {
            success: false,
            message: "Faltan datos de configuración de AFIP",
          };
        }

        const afipConfig = {
          cuit: config.tax_cuit,
          salesPoint: config.tax_sales_point,
          certPath: config.tax_cert_path,
          keyPath: config.tax_key_path,
        };

        // 2. Llamar Servicio
        const result = await createInvoice(afipConfig, {
          total,
          items,
          clientDoc,
        });

        if (result.success) {
          // 3. Guardar en BD
          await run(
            `
             UPDATE sales 
             SET invoice_type = ?, invoice_number = ?, cae = ?, cae_expiration = ?
             WHERE id = ?
          `,
            [
              result.voucherType.toString(),
              result.voucherNumber,
              result.cae,
              result.caeFchVto,
              saleId,
            ]
          );
        }

        return result;
      } catch (error) {
        console.error("Error en create-electronic-invoice:", error);
        return { success: false, message: error.message };
      }
    }
  );

  ipcMain.handle(
    "send-email-ticket",
    async (event, { email, subject, ticketData, pdfBuffer }) => {
      try {
        // 1. Obtener Configuración SMTP
        const settings = await all(
          "SELECT * FROM settings WHERE key LIKE 'smtp_%'"
        );
        const config = {};
        settings.forEach((s) => (config[s.key] = s.value));

        if (!config.smtp_host || !config.smtp_user || !config.smtp_pass) {
          return {
            success: false,
            message: "Falta configurar SMTP en Configuración",
          };
        }

        // 2. Configurar Transporter
        const transporter = nodemailer.createTransport({
          host: config.smtp_host,
          port: parseInt(config.smtp_port) || 587,
          secure: config.smtp_secure === "true", // true for 465, false for other ports
          auth: {
            user: config.smtp_user,
            pass: config.smtp_pass,
          },
        });

        // 3. Enviar Email
        await transporter.sendMail({
          from: `"Novy POS" <${config.smtp_user}>`,
          to: email,
          subject: subject || "Su Ticket de Compra",
          text: "Adjunto encontrará su comprobante de compra. Gracias por su preferencia!",
          attachments: [
            {
              filename: `Ticket_${Date.now()}.pdf`,
              content: Buffer.from(pdfBuffer), // pdfBuffer viene como ArrayBuffer o Uint8Array desde Renderer
            },
          ],
        });

        return { success: true };
      } catch (error) {
        console.error("Error enviando email:", error);
        return { success: false, message: error.message };
      }
    }
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE BACKUP
  // ═══════════════════════════════════════════════════════════

  const BACKUP_DIR = path.join(
    require("electron").app.getPath("userData"),
    "backups"
  );
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
  }

  // Crear Backup
  ipcMain.handle("create-backup", async () => {
    try {
      const { app } = require("electron");
      const isDev = process.env.NODE_ENV === "development";
      const dbPath = isDev
        ? path.join(__dirname, "../../novy.sqlite")
        : path.join(app.getPath("userData"), "novy.sqlite");

      if (!fs.existsSync(dbPath)) {
        return { success: false, message: "No database found to backup" };
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupName = `backup_${timestamp}.sqlite`;
      const backupPath = path.join(BACKUP_DIR, backupName);

      fs.copyFileSync(dbPath, backupPath);

      // Clean old backups (keep last 10)
      const files = fs
        .readdirSync(BACKUP_DIR)
        .filter((f) => f.startsWith("backup_") && f.endsWith(".sqlite"))
        .sort((a, b) => {
          return (
            fs.statSync(path.join(BACKUP_DIR, b)).mtime.getTime() -
            fs.statSync(path.join(BACKUP_DIR, a)).mtime.getTime()
          );
        });

      if (files.length > 10) {
        files.slice(10).forEach((f) => fs.unlinkSync(path.join(BACKUP_DIR, f)));
      }

      return { success: true, path: backupPath };
    } catch (error) {
      console.error("Backup error:", error);
      return { success: false, message: error.message };
    }
  });

  // Listar Backups
  ipcMain.handle("list-backups", async () => {
    try {
      const files = fs
        .readdirSync(BACKUP_DIR)
        .filter((f) => f.startsWith("backup_") && f.endsWith(".sqlite"))
        .map((f) => {
          const stats = fs.statSync(path.join(BACKUP_DIR, f));
          return {
            name: f,
            path: path.join(BACKUP_DIR, f),
            size: stats.size,
            date: stats.mtime,
          };
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return { success: true, backups: files };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // Restaurar Backup (Peligroso)
  ipcMain.handle("restore-backup", async (event, backupFileName) => {
    try {
      const { app } = require("electron");
      const isDev = process.env.NODE_ENV === "development";
      const dbPath = isDev
        ? path.join(__dirname, "../../novy.sqlite")
        : path.join(app.getPath("userData"), "novy.sqlite");

      const backupPath = path.join(BACKUP_DIR, backupFileName);

      if (!fs.existsSync(backupPath)) {
        return { success: false, message: "Backup file not found" };
      }

      // Close DB connection if possible...
      // SQL.js usually loads in memory in 'initDatabase' but if we are just copying file:
      // Since we use SQL.js on a FILE, we might have file locks?
      // In 'db.js', we load `new SQL.Database(filebuffer)`. We don't hold a lock on the file constantly
      // UNLESS we are in the middle of writing with `saveDatabase`.
      // `saveDatabase` writes `fs.writeFileSync(dbPath, data);`.
      // So copying OVER it should be fine as long as no write is happening.

      fs.copyFileSync(backupPath, dbPath);

      // Force Reload Application to reload DB from file
      app.relaunch();
      app.exit(0);

      return { success: true };
    } catch (error) {
      console.error("Restore error:", error);
      return { success: false, message: error.message };
    }
  });
}

module.exports = { registerIpcHandlers };
