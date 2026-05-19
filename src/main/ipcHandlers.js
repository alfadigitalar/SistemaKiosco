const { ipcMain, dialog, BrowserWindow } = require("electron");
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
        expiration_date, // FEFO
      } = product;

      const result = await run(
        `INSERT INTO products (barcode, name, cost_price, sale_price, stock_quantity, min_stock, category_id, supplier_id, measurement_unit, is_promo, expiration_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          expiration_date || null,
        ],
      );

      const newProductId = result.lastId;

      // Si es promo, insertar sus items
      if (is_promo && promo_items && Array.isArray(promo_items)) {
        for (const item of promo_items) {
          await run(
            "INSERT INTO promo_items (promo_id, product_id, quantity) VALUES (?, ?, ?)",
            [newProductId, item.product_id, item.quantity],
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
        expiration_date, // FEFO
      } = product;

      await run(
        `UPDATE products 
         SET barcode=?, name=?, cost_price=?, sale_price=?, stock_quantity=?, min_stock=?, category_id=?, supplier_id=?, measurement_unit=?, is_promo=?, expiration_date=?
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
          expiration_date || null,
          id,
        ],
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
              [id, item.product_id, item.quantity],
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
        [promoId],
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
        "SELECT * FROM products WHERE is_promo = 1 AND is_active = 1",
      );

      // 2. Para cada promo, obtener sus items
      const promosWithItems = await Promise.all(
        promos.map(async (promo) => {
          const promoItems = await all(
            `SELECT pi.*, p.name, p.barcode 
             FROM promo_items pi
             JOIN products p ON pi.product_id = p.id
             WHERE pi.promo_id = ?`,
            [promo.id],
          );
          return { ...promo, items: promoItems };
        }),
      );

      return promosWithItems;
    } catch (error) {
      console.error("Error al obtener promos activas:", error);
      return [];
    }
  });

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE FEFO (Control de Vencimientos)
  // ═══════════════════════════════════════════════════════════

  // Obtener productos próximos a vencer
  ipcMain.handle("get-expiring-products", async (event, { days = 7 } = {}) => {
    try {
      const products = await all(
        `SELECT * FROM products 
         WHERE is_active = 1 
           AND expiration_date IS NOT NULL 
           AND date(expiration_date) <= date('now', '+' || ? || ' days')
           AND date(expiration_date) >= date('now', '-30 days')
         ORDER BY expiration_date ASC`,
        [days],
      );
      return products;
    } catch (error) {
      console.error("Error al obtener productos por vencer:", error);
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
        [userId || 1, clientId || null, total, paymentMethod, localTimestamp],
      );

      // Obtener el ID de la venta recién creada
      const saleId = insertResult.lastId;

      if (!saleId) {
        throw new Error("No se pudo obtener el ID de la venta (lastId null)");
      }

      // 2. Insertar items y descontar stock
      for (const item of items) {
        // Insertar item de venta con nombre guardado
        await run(
          `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price_at_sale, subtotal, product_name_at_sale)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            saleId,
            item.id,
            item.cantidad,
            item.sale_price,
            item.cantidad * item.sale_price,
            item.name, // Guardar nombre histórico (crucial para Items Libres y cambios de nombre)
          ],
        );

        // Si es item libre (ID -1), NO descontar stock
        if (item.id === -1) continue;

        // Descontar stock del producto (Manejo de Promos)
        // Verificar si es promo
        const productInfo = await get(
          "SELECT is_promo FROM products WHERE id = ?",
          [item.id],
        );

        if (productInfo && productInfo.is_promo === 1) {
          // Es promo: Descontar stock de sus componentes
          const components = await all(
            "SELECT product_id, quantity FROM promo_items WHERE promo_id = ?",
            [item.id],
          );
          for (const comp of components) {
            // Cantidad a descontar = (qtyComponente * qtyVenta)
            await run(
              "UPDATE products SET stock_quantity = MAX(stock_quantity - ?, 0) WHERE id = ?",
              [comp.quantity * item.cantidad, comp.product_id],
            );
            // Opcional: Registrar movimiento de stock para cada componente (si tuviéramos tabla detallada)
          }
        } else {
          // Es producto normal
          await run(
            `UPDATE products SET stock_quantity = MAX(stock_quantity - ?, 0) WHERE id = ?`,
            [item.cantidad, item.id],
          );
        }
      }

      // 3. Si es Cuenta Corriente, actualizar deuda del cliente
      if (paymentMethod === "checking_account" && clientId) {
        await run(
          "UPDATE clients SET current_debt = current_debt + ? WHERE id = ?",
          [total, clientId],
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
        "SELECT * FROM clients WHERE is_active = 1 ORDER BY name ASC",
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
        [name, safeDni, phone, current_debt || 0],
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
        [name, safeDni, phone, current_debt, id],
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
          [amount, clientId],
        );

        // 2. Registrar movimiento en caja
        await run(
          "INSERT INTO movements (type, amount, description, user_id) VALUES (?, ?, ?, ?)",
          ["entry", amount, `Pago de deuda cliente #${clientId}`, userId || 1],
        );

        return { success: true };
      } catch (error) {
        console.error("Error al procesar pago de deuda:", error);
        return { success: false, message: error.message };
      }
    },
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE CONTROL DE CAJA
  // ═══════════════════════════════════════════════════════════

  // Obtener sesión actual (si hay una abierta)
  ipcMain.handle("get-current-session", async () => {
    try {
      const session = await get(
        "SELECT * FROM cash_sessions WHERE closed_at IS NULL ORDER BY id DESC LIMIT 1",
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
          "SELECT id FROM cash_sessions WHERE closed_at IS NULL",
        );
        if (existing) {
          return { success: false, message: "Ya hay una caja abierta." };
        }

        await run(
          "INSERT INTO cash_sessions (user_id, initial_amount) VALUES (?, ?)",
          [userId, initialAmount],
        );
        return { success: true };
      } catch (error) {
        console.error("Error al abrir caja:", error);
        return { success: false, message: error.message };
      }
    },
  );

  // Cerrar Caja
  ipcMain.handle(
    "close-cash-session",
    async (
      event,
      { sessionId, finalAmount, totalSales, totalMovements, realAmount },
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
          ],
        );
        return { success: true };
      } catch (error) {
        console.error("Error al cerrar caja:", error);
        return { success: false, message: error.message };
      }
    },
  );

  // Obtener Resumen de Caja (Ventas, Movimientos, Deudoas)
  ipcMain.handle("get-cash-summary", async (event, sessionId) => {
    try {
      // 1. Obtener fecha de inicio de la sesión
      const session = await get(
        "SELECT opened_at, initial_amount FROM cash_sessions WHERE id = ?",
        [sessionId],
      );
      if (!session) throw new Error("Sesión no encontrada");

      const startDate = session.opened_at;

      // 2. Sumar Ventas en EFECTIVO desde esa fecha
      // Nota: asumimos que payment_method 'cash' es efectivo.
      const salesResult = await get(
        `SELECT SUM(total_amount) as total 
         FROM sales 
         WHERE timestamp >= ? AND payment_method = 'efectivo'`, // Ajustar 'efectivo' según como lo guardes en POS
        [startDate],
      );
      const totalSalesCash = salesResult.total || 0;

      // 3. Sumar Movimientos (Entradas y Salidas)
      const movementsResult = await all(
        "SELECT type, SUM(amount) as total FROM movements WHERE timestamp >= ? GROUP BY type",
        [startDate],
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
          "SELECT * FROM cash_sessions WHERE closed_at IS NULL ORDER BY id DESC LIMIT 1",
        );

        if (!session) throw new Error("No hay caja abierta.");

        // 2. Calcular Saldo Actual
        const startDate = session.opened_at;

        // Ventas Efectivo
        const salesResult = await get(
          "SELECT SUM(total_amount) as total FROM sales WHERE timestamp >= ? AND payment_method = 'efectivo'",
          [startDate],
        );
        const totalSales = salesResult.total || 0;

        // Movimientos Previos
        const movementsResult = await all(
          "SELECT type, SUM(amount) as total FROM movements WHERE timestamp >= ? GROUP BY type",
          [startDate],
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
        [type, amount, description, userId],
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
        [limit],
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
      // Calcular fechas en hora local usando JavaScript
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfMonth = `${firstOfMonth.getFullYear()}-${String(firstOfMonth.getMonth() + 1).padStart(2, "0")}-${String(firstOfMonth.getDate()).padStart(2, "0")}`;

      // 1. Ventas de Hoy - usando substr para comparar con fecha local
      const salesToday = await get(
        "SELECT SUM(total_amount) as total FROM sales WHERE substr(timestamp, 1, 10) = ?",
        [todayStr],
      );

      // 2. Ventas del Mes - usando substr para comparar con fecha local
      const salesMonth = await get(
        "SELECT SUM(total_amount) as total FROM sales WHERE substr(timestamp, 1, 10) >= ?",
        [firstDayOfMonth],
      );

      // 3. Productos con Stock Bajo
      const lowStock = await get(
        "SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock AND is_active = 1 AND (is_promo = 0 OR is_promo IS NULL)",
      );

      // 4. Últimas 5 ventas
      const lastSales = await all(
        `SELECT s.id, s.timestamp, s.total_amount, u.name as user_name 
         FROM sales s 
         LEFT JOIN users u ON s.user_id = u.id 
         ORDER BY s.id DESC LIMIT 5`,
      );

      // 5. Ventas últimos 7 días (para gráfico)
      // Usamos substr para extraer la fecha directamente del timestamp guardado en formato local
      // Esto evita problemas de conversión a UTC que tiene la función date()
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const sevenDaysAgoStr = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, "0")}-${String(sevenDaysAgo.getDate()).padStart(2, "0")}`;

      const salesLast7Days = await all(
        `SELECT substr(timestamp, 1, 10) as date, SUM(total_amount) as total
         FROM sales
         WHERE substr(timestamp, 1, 10) >= ?
         GROUP BY substr(timestamp, 1, 10)
         ORDER BY substr(timestamp, 1, 10) ASC`,
        [sevenDaysAgoStr],
      );

      return {
        totalDay: salesToday?.total || 0,
        totalMonth: salesMonth?.total || 0,
        lowStockCount: lowStock?.count || 0,
        lastSales,
        salesChartData: salesLast7Days,
      };
    } catch (error) {
      console.error("Error al obtener stats:", error);
      return {
        totalDay: 0,
        totalMonth: 0,
        lowStockCount: 0,
        lastSales: [],
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
      `;

        const summary = await get(summaryQuery, [start, end]);

        // Descontar reembolsos del período
        const refundQuery = `SELECT COALESCE(SUM(total_refund), 0) as total_refunded FROM returns WHERE timestamp >= ? AND timestamp <= ?`;
        const refundResult = await get(refundQuery, [start, end]);
        const refunded = refundResult ? refundResult.total_refunded : 0;

        if (summary) {
          summary.totalSales = (summary.totalSales || 0) - refunded;
          summary.estimatedProfit = (summary.estimatedProfit || 0) - refunded;
        }

        // 2. Ventas por Día (Para el Gráfico)
        // Usamos substr para extraer la fecha directamente del timestamp guardado en formato local
        // Esto evita problemas de conversión a UTC que tiene la función date()
        const salesByDayQuery = `
         SELECT 
           substr(timestamp, 1, 10) as date,
           SUM(total_amount) as total
         FROM sales
         WHERE timestamp >= ? AND timestamp <= ?
         GROUP BY substr(timestamp, 1, 10)
         ORDER BY substr(timestamp, 1, 10) ASC
       `;
        const salesByDay = await all(salesByDayQuery, [start, end]);

        // 3. Top Productos más vendidos en el periodo (descontando devoluciones)
        const topProductsQuery = `
          SELECT 
            p.name,
            SUM(si.quantity) - COALESCE(ret.returned_qty, 0) as quantity,
            SUM(si.subtotal) - COALESCE(ret.returned_total, 0) as total
          FROM sale_items si
          JOIN sales s ON si.sale_id = s.id
          JOIN products p ON si.product_id = p.id
          LEFT JOIN (
            SELECT ri.product_id, SUM(ri.quantity) as returned_qty, SUM(ri.subtotal) as returned_total
            FROM return_items ri
            JOIN returns r ON ri.return_id = r.id
            WHERE r.timestamp >= ? AND r.timestamp <= ?
            GROUP BY ri.product_id
          ) ret ON ret.product_id = si.product_id
          WHERE s.timestamp >= ? AND s.timestamp <= ?
          GROUP BY si.product_id
          HAVING quantity > 0
          ORDER BY quantity DESC
          LIMIT 10
        `;
        const topProducts = await all(topProductsQuery, [
          start,
          end,
          start,
          end,
        ]);

        // 4. Top Productos MENOS vendidos (incluyendo 0 ventas, descontando devoluciones)
        const leastSoldQuery = `
          SELECT 
            p.name,
            COALESCE(SUM(filtered_sales.quantity), 0) - COALESCE(ret.returned_qty, 0) as quantity,
            COALESCE(SUM(filtered_sales.subtotal), 0) - COALESCE(ret.returned_total, 0) as total
          FROM products p
          LEFT JOIN (
            SELECT si.product_id, si.quantity, si.subtotal
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            WHERE s.timestamp >= ? AND s.timestamp <= ?
          ) filtered_sales ON p.id = filtered_sales.product_id
          LEFT JOIN (
            SELECT ri.product_id, SUM(ri.quantity) as returned_qty, SUM(ri.subtotal) as returned_total
            FROM return_items ri
            JOIN returns r ON ri.return_id = r.id
            WHERE r.timestamp >= ? AND r.timestamp <= ?
            GROUP BY ri.product_id
          ) ret ON ret.product_id = p.id
          WHERE p.is_active = 1
          GROUP BY p.id
          ORDER BY quantity ASC, total ASC
          LIMIT 10
        `;
        const leastSoldProducts = await all(leastSoldQuery, [
          start,
          end,
          start,
          end,
        ]);

        return {
          summary: {
            totalTransactions: summary.totalTransactions || 0,
            totalSales: summary.totalSales || 0,
            averageTicket: summary.averageTicket || 0,
            estimatedProfit: summary.estimatedProfit || 0,
          },
          salesByDay: salesByDay || [],
          topProducts: topProducts || [],
          leastSoldProducts: leastSoldProducts || [],
        };
      } catch (error) {
        console.error("Error en reporte avanzado:", error);
        return { error: error.message };
      }
    },
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE DEVOLUCIONES
  // ═══════════════════════════════════════════════════════════

  ipcMain.handle("process-return", async (event, returnData) => {
    try {
      const { items, totalRefund, saleId, userId, reason } = returnData;
      console.log("[RETURN] Procesando devolución:", {
        saleId,
        totalRefund,
        itemCount: items?.length,
        userId,
      });

      // 1. Registrar devolución (sin transacciones, sql.js guarda en cada run())
      const result = await run(
        "INSERT INTO returns (sale_id, total_refund, reason, user_id) VALUES (?, ?, ?, ?)",
        [saleId, totalRefund, reason || "Devolución", userId],
      );

      const returnId = result.lastId;
      console.log("[RETURN] Return registrado con ID:", returnId);

      if (!returnId) {
        console.error("[RETURN] No se pudo obtener el ID de la devolución");
        return {
          success: false,
          message: "Error interno: no se obtuvo ID de devolución",
        };
      }

      // 2. Procesar Items
      for (const item of items) {
        const shouldReturnStock = item.returnStock !== false; // default true
        console.log("[RETURN] Procesando item:", {
          productId: item.productId,
          qty: item.quantity,
          price: item.price,
          returnStock: shouldReturnStock,
        });

        // a. Registrar item de devolución
        await run(
          "INSERT INTO return_items (return_id, product_id, quantity, refund_price, subtotal) VALUES (?, ?, ?, ?, ?)",
          [
            returnId,
            item.productId,
            item.quantity,
            item.price,
            item.quantity * item.price,
          ],
        );

        // b. Devolver Stock (solo si returnStock es true)
        if (shouldReturnStock && item.quantity > 0) {
          await run(
            "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?",
            [item.quantity, item.productId],
          );

          // c. Registrar Movimiento de Stock
          await run(
            "INSERT INTO stock_movements (product_id, type, quantity, reason, user_id) VALUES (?, 'return', ?, ?, ?)",
            [
              item.productId,
              item.quantity,
              `Devolución Ticket #${saleId}`,
              userId,
            ],
          );
        }
      }

      // 3. Registrar Salida de Caja (Refund) - Opcional
      // Nota: Se registra el movimiento de stock pero no hay tabla de caja separada por ahora
      // El reembolso queda registrado en la tabla 'returns' con el monto total

      console.log("[RETURN] Devolución completada exitosamente, ID:", returnId);
      return { success: true, returnId };
    } catch (error) {
      console.error("[RETURN] Error processing return:", error);
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

  // Obtener estadísticas de ganancias (Real Profit - descontando devoluciones)
  ipcMain.handle("get-profit-stats", async (event, { startDate, endDate }) => {
    try {
      // Calcular ventas brutas
      let salesQuery = `
        SELECT 
          SUM((si.unit_price_at_sale - COALESCE(p.cost_price, 0)) * si.quantity) as total_profit,
          SUM(si.unit_price_at_sale * si.quantity) as total_revenue,
          SUM(COALESCE(p.cost_price, 0) * si.quantity) as total_cost
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        LEFT JOIN sales s ON si.sale_id = s.id
        WHERE 1=1
      `;

      const salesParams = [];

      if (startDate) {
        salesQuery += " AND s.timestamp >= ?";
        salesParams.push(startDate + " 00:00:00");
      }
      if (endDate) {
        salesQuery += " AND s.timestamp <= ?";
        salesParams.push(endDate + " 23:59:59");
      }

      const salesResult = await get(salesQuery, salesParams);

      // Calcular total reembolsado
      let refundQuery = `
        SELECT COALESCE(SUM(total_refund), 0) as total_refunded
        FROM returns
        WHERE 1=1
      `;
      const refundParams = [];

      if (startDate) {
        refundQuery += " AND timestamp >= ?";
        refundParams.push(startDate + " 00:00:00");
      }
      if (endDate) {
        refundQuery += " AND timestamp <= ?";
        refundParams.push(endDate + " 23:59:59");
      }

      const refundResult = await get(refundQuery, refundParams);
      const refunded = refundResult ? refundResult.total_refunded : 0;

      const grossRevenue =
        salesResult && salesResult.total_revenue
          ? salesResult.total_revenue
          : 0;
      const grossProfit =
        salesResult && salesResult.total_profit ? salesResult.total_profit : 0;
      const totalCost =
        salesResult && salesResult.total_cost ? salesResult.total_cost : 0;

      return {
        totalProfit: grossProfit - refunded,
        totalRevenue: grossRevenue - refunded,
        totalCost: totalCost,
        totalRefunded: refunded,
      };
    } catch (error) {
      console.error("Error al obtener ganancias:", error);
      return { totalProfit: 0, totalRevenue: 0, totalCost: 0 };
    }
  });

  // Obtener detalle de una venta (con info de devoluciones)
  ipcMain.handle("get-sale-details", async (event, saleId) => {
    try {
      const items = await all(
        `
            SELECT si.*, p.name as product_name, p.barcode,
                   COALESCE(ri_agg.returned_qty, 0) as returned_quantity
            FROM sale_items si
            LEFT JOIN products p ON si.product_id = p.id
            LEFT JOIN (
              SELECT ri.product_id, r.sale_id, SUM(ri.quantity) as returned_qty
              FROM return_items ri
              JOIN returns r ON ri.return_id = r.id
              GROUP BY ri.product_id, r.sale_id
            ) ri_agg ON ri_agg.product_id = si.product_id AND ri_agg.sale_id = si.sale_id
            WHERE si.sale_id = ?
          `,
        [saleId],
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
        "SELECT * FROM suppliers WHERE is_active = 1 ORDER BY name ASC",
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
        [name, contact_name, phone, email, notes],
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
        [name, contact_name, phone, email, notes, id],
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
        budget_enabled: "false",
      };
      rows.forEach((row) => {
        settings[row.key] = row.value;
      });
      return settings;
    } catch (error) {
      console.error("Error al obtener settings:", error);
      return {
        kiosk_name: "Kiosco System",
        theme_color: "blue",
        budget_enabled: "false",
      };
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
          [key, value],
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
        `[LOGIN DEBUG] Intentando login con usuario: '${username}' y contraseña: '${password}'`,
      );

      // 1. Buscar usuario por nombre de usuario solamente
      const user = await get("SELECT * FROM users WHERE username = ?", [
        username,
      ]);

      if (!user) {
        console.log(
          `[LOGIN DEBUG] ❌ Usuario '${username}' NO encontrado en la base de datos.`,
        );

        // DEBUG: Mostrar qué usuarios SÍ existen para comparar
        const allUsers = await all("SELECT id, username FROM users");
        console.log(
          "[LOGIN DEBUG] Usuarios disponibles en DB:",
          allUsers.map((u) => `"${u.username}"`),
        );

        return { success: false, message: "Usuario no encontrado" };
      }

      console.log(
        `[LOGIN DEBUG] ✅ Usuario encontrado: ID=${user.id}, Nombre='${user.name}', Role='${user.role}'`,
      );
      console.log(
        `[LOGIN DEBUG] Contraseña almacenada en DB: '${user.password_hash}'`,
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
          `[LOGIN DEBUG] ❌ Contraseña INCORRECTA. La DB espera '${user.password_hash}' pero recibió '${password}'`,
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
        "SELECT id, name, username, role, active FROM users WHERE active = 1 ORDER BY name ASC",
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
        [name, username, password, role || "employee"],
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
        [product_id, type, quantity, reason, user_id],
      );

      // 2. Actualizar Stock del Producto
      // Si es entrada (purchase, adjustment_add, return) -> SUMA
      // Si es salida (sale, adjustment_sub, loss) -> RESTA
      let operator = "+";
      if (["sale", "adjustment_sub", "loss"].includes(type)) {
        operator = "-";
      }

      const clampedQuery =
        operator === "-"
          ? `UPDATE products SET stock_quantity = MAX(stock_quantity - ?, 0) WHERE id = ?`
          : `UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`;

      await run(clampedQuery, [quantity, product_id]);

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
        [productId],
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
            .join(","),
        );
        return [headerRow, ...values].join("\n");
      };

      // 3. Fetch & Write Products
      const products = await all("SELECT * FROM products");
      fs.writeFileSync(
        path.join(destFolder, "productos_novy.csv"),
        toCSV(products),
      );

      // 4. Fetch & Write Clients
      const clients = await all("SELECT * FROM clients");
      fs.writeFileSync(
        path.join(destFolder, "clientes_novy.csv"),
        toCSV(clients),
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
          "SELECT key, value FROM settings WHERE key IN ('tax_enabled', 'tax_cuit', 'tax_sales_point', 'tax_cert_path', 'tax_key_path', 'tax_business_name', 'tax_iibb', 'tax_start_date', 'tax_condition')",
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
        if (!config.tax_cuit || !config.tax_sales_point) {
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
          businessName: config.tax_business_name,
          iibb: config.tax_iibb,
          startDate: config.tax_start_date,
          condition: config.tax_condition,
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
            ],
          );
        }

        return result;
      } catch (error) {
        console.error("Error en create-electronic-invoice:", error);
        return { success: false, message: error.message };
      }
    },
  );

  // Handler para ENVIAR TICKET POR EMAIL (PDF)
  ipcMain.handle(
    "send-email-ticket",
    async (event, { email, subject, ticketData }) => {
      try {
        console.log("Sending email to:", email);

        // 1. Obtener Configuración SMTP
        console.log("[EMAIL] Obteniendo configuración...");
        const settings = await all(
          "SELECT key, value FROM settings WHERE key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'kiosk_name', 'tax_business_name', 'kiosk_address', 'tax_cuit', 'tax_sales_point', 'tax_condition', 'tax_iibb', 'tax_start_date')",
        );
        const config = {};
        settings.forEach((row) => (config[row.key] = row.value));

        if (!config.smtp_host || !config.smtp_user || !config.smtp_pass) {
          console.error("[EMAIL] SMTP Faltante");
          return { success: false, message: "SMTP no configurado" };
        }

        // 2. Generar HTML (Mismo que para imprimir)
        console.log("[EMAIL] Generando HTML...");
        const { generateFacturaHTML } = require("./ticketTemplate");

        // Completamos info del negocio si no viene en ticketData
        const storeName =
          config.tax_business_name || config.kiosk_name || "MI KIOSCO";
        const address = config.kiosk_address || "";
        const cuit = config.tax_cuit || "";
        const salesPoint = config.tax_sales_point || "1";
        const condicionIva = config.tax_condition || "Responsable Inscripto";

        // aseguramos que ticketData tenga los datos fiscales correctos
        const fullTicketData = {
          ...ticketData,
          storeName,
          address,
          cuit,
          salesPoint,
          condicionIva,
          ingresosBrutos: config.tax_iibb || "",
          inicioActividades: config.tax_start_date || "",
          format: "a4", // Forzamos A4 para email
        };

        // Forzar tipo C si es Monotributo o Exento (override frontend)
        if (condicionIva === "Monotributo" || condicionIva === "Exento") {
          fullTicketData.invoiceType = "C";
        }

        const html = generateFacturaHTML(fullTicketData);
        console.log("[EMAIL] HTML Generado. Creando ventana...");

        // 3. Generar PDF usando Electron (printToPDF)
        const pdfWin = new BrowserWindow({
          show: false,
          webPreferences: { nodeIntegration: true },
        });

        await pdfWin.loadURL(
          `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
        );

        const pdfBuffer = await pdfWin.webContents.printToPDF({
          printBackground: true,
          pageSize: "A4",
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        });

        console.log(
          "PDF generated, size:",
          pdfBuffer ? pdfBuffer.length : "undefined",
        );

        if (!pdfBuffer) {
          throw new Error("Error generating PDF: Buffer is empty or undefined");
        }

        console.log("[EMAIL] Convirtiendo Buffer...");
        const finalBuffer = Buffer.from(pdfBuffer);
        console.log("[EMAIL] Buffer final listo. Tamaño:", finalBuffer.length);

        pdfWin.close();

        // 4. Enviar Email con Nodemailer
        console.log("[EMAIL] Configurando Nodemailer...");
        const transporter = nodemailer.createTransport({
          host: config.smtp_host,
          port: parseInt(config.smtp_port) || 587,
          secure: config.smtp_secure === "true", // true for 465, false for other ports
          auth: {
            user: config.smtp_user,
            pass: config.smtp_pass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        console.log("[EMAIL] Enviando...");
        const info = await transporter.sendMail({
          from: `"${storeName}" <${config.smtp_user}>`,
          to: email,
          subject: subject || `Factura de Compra - ${storeName}`,
          text: `Adjunto encontrarás tu factura de compra.\n\nGracias por elegirnos.\n${storeName}`,
          attachments: [
            {
              filename: `Factura_${fullTicketData.voucherNumber || "0"}.pdf`,
              content: finalBuffer,
            },
          ],
        });

        console.log("Email sent:", info.messageId);
        return { success: true };
      } catch (error) {
        console.error("Error sending email:", error);
        return {
          success: false,
          message: error.message + (error.stack ? "\n" + error.stack : ""),
        };
      }
    },
  );

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE BACKUP
  // ═══════════════════════════════════════════════════════════

  // Crear Backup
  ipcMain.handle("create-backup", async () => {
    try {
      const { app } = require("electron");
      const isDev = process.env.NODE_ENV === "development";

      // Definir rutas dentro del handler para asegurar que app está listo
      const userDataPath = app.getPath("userData");
      const BACKUP_DIR = path.join(userDataPath, "backups");

      // Crear directorio si no existe
      if (!fs.existsSync(BACKUP_DIR)) {
        console.log(`[BACKUP] Creando directorio: ${BACKUP_DIR}`);
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
      }

      const dbPath = isDev
        ? path.join(__dirname, "../../novy.sqlite")
        : path.join(userDataPath, "novy.sqlite");

      console.log(`[BACKUP] Intentando backup de: ${dbPath}`);

      if (!fs.existsSync(dbPath)) {
        console.error(
          `[BACKUP] Error: No se encontró la base de datos en ${dbPath}`,
        );
        return {
          success: false,
          message: `Base de datos no encontrada en: ${dbPath}`,
        };
      }

      // Nombre del archivo con fecha local para mejor legibilidad
      const now = new Date();
      const timestamp =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0") +
        "_" +
        String(now.getHours()).padStart(2, "0") +
        "-" +
        String(now.getMinutes()).padStart(2, "0") +
        "-" +
        String(now.getSeconds()).padStart(2, "0");

      const backupName = `backup_${timestamp}.sqlite`;
      const backupPath = path.join(BACKUP_DIR, backupName);

      console.log(`[BACKUP] Copiando a: ${backupPath}`);
      fs.copyFileSync(dbPath, backupPath);

      // Limpieza de backups antiguos (Mantener últimos 10)
      try {
        const files = fs
          .readdirSync(BACKUP_DIR)
          .filter((f) => f.startsWith("backup_") && f.endsWith(".sqlite"))
          .map((f) => ({
            name: f,
            path: path.join(BACKUP_DIR, f),
            time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
          }))
          .sort((a, b) => b.time - a.time); // Más nuevos primero

        if (files.length > 10) {
          const toDelete = files.slice(10);
          toDelete.forEach((f) => {
            console.log(`[BACKUP] Eliminando backup antiguo: ${f.name}`);
            fs.unlinkSync(f.path);
          });
        }
      } catch (cleanError) {
        console.warn(
          "[BACKUP] Error limpiando backups antiguos (no crítico):",
          cleanError,
        );
      }

      return { success: true, path: backupPath };
    } catch (error) {
      console.error("[BACKUP] Error fatal:", error);
      return { success: false, message: error.message };
    }
  });

  // Listar Backups
  ipcMain.handle("get-backups", async () => {
    try {
      const { app } = require("electron");
      const userDataPath = app.getPath("userData");
      const BACKUP_DIR = path.join(userDataPath, "backups");

      if (!fs.existsSync(BACKUP_DIR)) {
        return { success: true, backups: [] };
      }

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
      const userDataPath = app.getPath("userData");
      const BACKUP_DIR = path.join(userDataPath, "backups");

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
