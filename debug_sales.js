const { initDatabase, all } = require("./src/main/db");

async function checkSales() {
  await initDatabase();
  const sales = await all(
    "SELECT id, timestamp, total_amount FROM sales ORDER BY id DESC LIMIT 10"
  );
  console.log("Last 10 sales:", JSON.stringify(sales, null, 2));
}

checkSales();
