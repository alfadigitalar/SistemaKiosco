const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

async function checkSales() {
  const dbPath = path.join(__dirname, "novy.sqlite");

  if (!fs.existsSync(dbPath)) {
    console.log("NO DB");
    return;
  }

  const SQL = await initSqlJs();
  const filebuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(filebuffer);

  // Check Sales by Day query
  try {
    const start = "2024-01-01";
    const end = "2026-01-01";
    const query = `SELECT date(timestamp) as date, SUM(total_amount) as total FROM sales WHERE timestamp >= '${start} 00:00:00' AND timestamp <= '${end} 23:59:59' GROUP BY date(timestamp) ORDER BY date(timestamp) ASC`;

    const res = db.exec(query);
    if (res.length > 0) {
      console.log("COLUMNS:", res[0].columns.join(", "));
      res[0].values.forEach((v) => console.log("ROW:", v.join(" | ")));
    } else {
      console.log("NO RESULTS for query");
    }
  } catch (e) {
    console.error("Query Error:", e);
  }
}

checkSales();
