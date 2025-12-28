const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

async function fixDb() {
  try {
    const SQL = await initSqlJs();
    const dbPath = path.join(__dirname, "../novy.sqlite");

    if (!fs.existsSync(dbPath)) {
      console.log("Database file not found at:", dbPath);
      return;
    }

    const filebuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(filebuffer);

    console.log("Database opened.");

    // 1. Check Users Table
    const res = db.exec("PRAGMA table_info(users)");
    const columns = res[0].values.map((val) => val[1]);
    console.log("Current Users Columns:", columns);

    let changed = false;

    // 2. Add columns if missing
    if (!columns.includes("birthday")) {
      console.log("Adding birthday column...");
      db.run("ALTER TABLE users ADD COLUMN birthday DATE");
      changed = true;
    }

    if (!columns.includes("profile_picture")) {
      console.log("Adding profile_picture column...");
      db.run("ALTER TABLE users ADD COLUMN profile_picture TEXT");
      changed = true;
    }

    if (!columns.includes("created_at")) {
      console.log("Adding created_at column...");
      db.run(
        "ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
      );
      changed = true;
    }

    // 4. Create stock_movements if missing
    const tables = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='stock_movements'"
    );
    if (!tables.length || tables[0].values.length === 0) {
      console.log("Creating stock_movements table...");
      db.run(`CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('purchase', 'adjustment_add', 'adjustment_sub', 'sale', 'loss', 'return')),
        quantity REAL NOT NULL,
        reason TEXT,
        user_id INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(product_id) REFERENCES products(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);
      changed = true;
    }

    // 5. Save if changed
    if (changed) {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
      console.log("Database updated successfully.");
    } else {
      console.log("Database structure is already up to date.");
    }

    // Check again
    const res2 = db.exec("PRAGMA table_info(users)");
    const columns2 = res2[0].values.map((val) => val[1]);
    console.log("Final Users Columns:", columns2);
  } catch (err) {
    console.error("Error fixing DB:", err);
  }
}

fixDb();
