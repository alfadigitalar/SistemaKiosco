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
      } = product;

      await run(
        `INSERT INTO products (barcode, name, cost_price, sale_price, stock_quantity, min_stock, category_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          barcode,
          name,
          cost_price,
          sale_price,
          stock_quantity,
          min_stock,
          category_id,
        ]
      );

      return { success: true };
    } catch (error) {
      console.error("Error al crear producto:", error);
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
      await run(
        `INSERT INTO sales (user_id, client_id, total_amount, payment_method)
         VALUES (?, ?, ?, ?)`,
        [userId || 1, clientId || null, total, paymentMethod]
      );

      // Obtener el ID de la venta recién creada
      const lastSale = await get("SELECT last_insert_rowid() as id");
      const saleId = lastSale?.id;

      if (!saleId) {
        throw new Error("No se pudo obtener el ID de la venta");
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
      await run(
        "INSERT INTO clients (name, dni, phone, current_debt) VALUES (?, ?, ?, ?)",
        [name, dni, phone, current_debt || 0]
      );
      return { success: true };
    } catch (error) {
      console.error("Error al crear cliente:", error);
      return { success: false, message: error.message };
    }
  });

  // Actualizar cliente
  ipcMain.handle("update-customer", async (event, customer) => {
    try {
      const { id, name, dni, phone, current_debt } = customer;
      await run(
        "UPDATE clients SET name = ?, dni = ?, phone = ?, current_debt = ? WHERE id = ?",
        [name, dni, phone, current_debt, id]
      );
      return { success: true };
    } catch (error) {
      console.error("Error al actualizar cliente:", error);
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
  // HANDLERS DE USUARIO / AUTENTICACIÓN
  // ═══════════════════════════════════════════════════════════

  // Login de usuario
  ipcMain.handle("login-user", async (event, { username, password }) => {
    try {
      const user = await get(
        "SELECT * FROM users WHERE username = ? AND password_hash = ?",
        [username, password]
      );

      if (user) {
        return { success: true, name: user.name, role: user.role, id: user.id };
      } else {
        return { success: false, message: "Credenciales incorrectas" };
      }
    } catch (error) {
      console.error("Error de login:", error);
      return { success: false, message: "Error del servidor" };
    }
  });
}

module.exports = { registerIpcHandlers };
