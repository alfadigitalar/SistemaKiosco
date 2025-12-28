const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

async function checkProducts() {
  try {
    const SQL = await initSqlJs();
    const dbPath = path.join(__dirname, "../novy.sqlite");

    if (!fs.existsSync(dbPath)) {
      console.log("❌ Database file NOT found at:", dbPath);
      return;
    }

    console.log("📂 Reading database from:", dbPath);
    const filebuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(filebuffer);

    // Get last 5 products
    const res = db.exec(
      "SELECT id, name, barcode, is_active FROM products ORDER BY id DESC LIMIT 5"
    );

    if (res.length > 0) {
      console.log("✅ Found Products:");
      const columns = res[0].columns;
      const values = res[0].values;
      values.forEach((row) => {
        console.log(
          JSON.stringify(Object.fromEntries(columns.map((c, i) => [c, row[i]])))
        );
      });
    } else {
      console.log("⚠️ No products found in table.");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

checkProducts();
