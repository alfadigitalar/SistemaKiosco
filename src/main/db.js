const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

let db;
let dbPath;
let SQL;

/**
 * Inicializa la conexión a la base de datos SQL.js
 * y crea las tablas necesarias si no existen.
 */
async function initDatabase() {
  // Detectar si estamos en desarrollo o producción
  const isDev = process.env.NODE_ENV === "development";

  // Ruta del archivo de base de datos
  dbPath = isDev
    ? path.join(__dirname, "../../novy.sqlite")
    : path.join(app.getPath("userData"), "novy.sqlite");

  console.log("Inicializando base de datos SQL.js en:", dbPath);

  try {
    // Cargar SQL.js (librería puro JavaScript)
    SQL = await initSqlJs();

    // Verificar si existe el archivo de base de datos
    if (fs.existsSync(dbPath)) {
      // Cargar base de datos existente desde archivo
      const filebuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(filebuffer);
      console.log("Base de datos existente cargada.");
    } else {
      // Crear nueva base de datos en memoria
      db = new SQL.Database();
      console.log("Nueva base de datos creada en memoria.");
      createTables(); // Crea todas las tablas iniciales
    }

    // MIGRACIÓN MANUAL: Asegurar que exista la tabla cash_sessions (para DBs existentes)
    db.run(`
      CREATE TABLE IF NOT EXISTS cash_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        closed_at DATETIME,
        initial_amount REAL,
        final_amount REAL,
        total_sales REAL,
        total_movements REAL,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);

    // MIGRACIÓN MANUAL: Tabla Proveedores (Fase 9)
    db.run(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_name TEXT,
        phone TEXT,
        email TEXT,
        notes TEXT,
        is_active INTEGER DEFAULT 1
      );
    `);

    // MIGRATION: Add supplier_id to products if not exists
    try {
      // Check if column exists (naive check or just try alter table and ignore error)
      // SQLite doesn't support IF NOT EXISTS in ADD COLUMN directly in all versions,
      // but we can try catch it.
      db.run("ALTER TABLE products ADD COLUMN supplier_id INTEGER");
    } catch (e) {
      // Column likely exists
    }

    // MIGRACIÓN MANUAL: Tabla Settings (Fase 10)
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Default settings
    const existingSettings = db.exec(
      "SELECT * FROM settings WHERE key = 'kiosk_name'"
    );
    if (!existingSettings.length || !existingSettings[0].values.length) {
      try {
        db.run(
          "INSERT INTO settings (key, value) VALUES ('kiosk_name', 'Kiosco System')"
        );
        db.run(
          "INSERT INTO settings (key, value) VALUES ('theme_color', 'blue')"
        );
      } catch (e) {
        // Ignorar si ya existen
      }
    }

    saveDatabase(); // Guardar cambios de estructura
  } catch (error) {
    console.error("Error al inicializar base de datos:", error);
    throw error;
  }
}

/**
 * Guarda la base de datos en disco.
 * IMPORTANTE: Debe llamarse después de cada INSERT/UPDATE/DELETE
 * ya que SQL.js trabaja en memoria.
 */
function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  console.log("Base de datos guardada en disco.");
}

/**
 * Ejecuta una consulta SQL que modifica datos (INSERT, UPDATE, DELETE)
 * y guarda automáticamente los cambios en disco.
 */
function run(sql, params = []) {
  if (!db) return Promise.reject(new Error("Base de datos no inicializada"));
  try {
    db.run(sql, params);

    // Intentar obtener el último ID insertado
    // db.exec devuelve: [{ columns: ['last_insert_rowid()'], values: [[id]] }]
    let lastId = null;
    try {
      const stmt = db.prepare("SELECT last_insert_rowid()");
      if (stmt.step()) {
        lastId = stmt.get()[0];
      }
      stmt.free();
    } catch (e) {
      console.warn("Could not retrieve lastId", e);
    }

    saveDatabase(); // Auto-guardar para persistencia
    return Promise.resolve({ success: true, lastId });
  } catch (err) {
    console.error("Error en run():", err);
    return Promise.reject(err);
  }
}

/**
 * Obtiene una sola fila de la base de datos.
 * Retorna null si no hay resultados.
 */
function get(sql, params = []) {
  if (!db) return Promise.reject(new Error("Base de datos no inicializada"));
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return Promise.resolve(result);
  } catch (err) {
    console.error("Error en get():", err);
    return Promise.reject(err);
  }
}

/**
 * Obtiene múltiples filas de la base de datos.
 * Retorna array vacío si no hay resultados.
 */
function all(sql, params = []) {
  if (!db) return Promise.reject(new Error("Base de datos no inicializada"));
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return Promise.resolve(rows);
  } catch (err) {
    console.error("Error en all():", err);
    return Promise.reject(err);
  }
}

/**
 * Crea las tablas necesarias para el sistema POS.
 * Se ejecuta solo cuando la base de datos es nueva.
 */
function createTables() {
  const schema = `
    -- ═══════════════════════════════════════════════════════════
    -- TABLA: USUARIOS
    -- Almacena los usuarios del sistema (admin, empleados)
    -- ═══════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'employee')) DEFAULT 'employee',
      active INTEGER DEFAULT 1
    );
    
    -- Usuario administrador por defecto
    INSERT OR IGNORE INTO users (name, username, password_hash, role)
    VALUES ('Administrador', 'admin', 'admin123', 'admin');

    -- ═══════════════════════════════════════════════════════════
    -- TABLA: PRODUCTOS
    -- Catálogo de productos con precios y stock
    -- ═══════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE,
      name TEXT NOT NULL,
      cost_price REAL DEFAULT 0,
      sale_price REAL NOT NULL,
      stock_quantity INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 5,
      category_id INTEGER,
      is_active INTEGER DEFAULT 1
    );
    
    -- Producto de prueba para test inicial
    INSERT OR IGNORE INTO products (barcode, name, cost_price, sale_price, stock_quantity)
    VALUES ('123456', 'Coca Cola 2.25L - PRUEBA', 1500, 2500, 50);

    -- ═══════════════════════════════════════════════════════════
    -- TABLA: CLIENTES
    -- Registro de clientes para fiados y cuenta corriente
    -- ═══════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dni TEXT UNIQUE,
      phone TEXT,
      current_debt REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    -- ═══════════════════════════════════════════════════════════
    -- TABLA: VENTAS
    -- Encabezado de cada venta realizada
    -- ═══════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER,
      client_id INTEGER,
      total_amount REAL NOT NULL,
      payment_method TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(client_id) REFERENCES clients(id)
    );

    -- ═══════════════════════════════════════════════════════════
    -- TABLA: ITEMS DE VENTA
    -- Detalle de cada producto vendido
    -- ═══════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price_at_sale REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY(sale_id) REFERENCES sales(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );

    -- ═══════════════════════════════════════════════════════════
    -- TABLA: MOVIMIENTOS DE CAJA
    -- Registro de entradas y salidas de dinero
    -- ═══════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      type TEXT CHECK(type IN ('entry', 'withdrawal')),
      amount REAL NOT NULL,
      description TEXT,
      user_id INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `;

  try {
    db.run(schema);
    console.log("✅ Tablas creadas exitosamente.");
  } catch (e) {
    console.error("Error al crear tablas:", e);
  }
}

module.exports = { initDatabase, run, get, all };
