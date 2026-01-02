const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

async function checkSales() {
  const dbPath = path.join(__dirname, "novy.sqlite");
  console.log("DB Path:", dbPath);

  if (!fs.existsSync(dbPath)) {
    console.log("DB file not found!");
    return;
  }

  const SQL = await initSqlJs();
  const filebuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(filebuffer);

  // Check Sales
  const sales = db.exec(
    "SELECT id, timestamp, total_amount FROM sales ORDER BY id DESC LIMIT 10"
  );
  if (sales.length > 0) {
    console.log("Sales Data:", JSON.stringify(sales[0], null, 2));
  } else {
    console.log("No sales found.");
  }

  // Check Sales by Day query
  try {
    const start = "2024-01-01"; // Wide range
    const end = "2026-01-01";
    const query = `
         SELECT 
           date(timestamp) as date,
           SUM(total_amount) as total
         FROM sales
         WHERE timestamp >= '${start} 00:00:00' AND timestamp <= '${end} 23:59:59'
         GROUP BY date(timestamp)
         ORDER BY date(timestamp) ASC
       `;
    const salesByDay = db.exec(query);
    console.log("Sales By Day:", JSON.stringify(salesByDay, null, 2));
  } catch (e) {
    console.error("Query Error:", e);
  }
}

checkSales();
