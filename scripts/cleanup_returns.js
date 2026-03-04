/**
 * Script de limpieza: elimina devoluciones de prueba y corrige el stock.
 * USAR UNA SOLA VEZ. Cerrar la app antes de ejecutar.
 *
 * Ejecutar: node scripts/cleanup_returns.js
 */
const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

async function cleanup() {
  const dbPath = path.join(__dirname, "../novy.sqlite");

  if (!fs.existsSync(dbPath)) {
    console.error("No se encontró la base de datos en:", dbPath);
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const filebuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(filebuffer);

  // 1. Ver devoluciones existentes
  const returns = db.exec("SELECT * FROM returns");
  if (returns.length > 0) {
    console.log("\n=== Devoluciones encontradas ===");
    console.log("Columnas:", returns[0].columns.join(", "));
    returns[0].values.forEach((row) => {
      console.log("  ", row.join(" | "));
    });
  } else {
    console.log("No hay devoluciones en la base de datos.");
    process.exit(0);
  }

  // 2. Obtener items devueltos para revertir el stock
  const returnItems = db.exec(`
    SELECT ri.product_id, ri.quantity, p.name, p.stock_quantity
    FROM return_items ri
    JOIN products p ON ri.product_id = p.id
  `);

  if (returnItems.length > 0) {
    console.log("\n=== Items devueltos (se revertirá el stock) ===");
    returnItems[0].values.forEach((row) => {
      const [productId, qty, name, currentStock] = row;
      console.log(
        `  ${name}: stock actual ${currentStock} → será ${currentStock - qty} (restando ${qty})`,
      );
    });

    // 3. Revertir stock (restar lo que se sumó por devoluciones)
    const stmt = db.prepare(
      "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
    );
    returnItems[0].values.forEach((row) => {
      const [productId, qty] = row;
      stmt.run([qty, productId]);
    });
    stmt.free();
    console.log("\n✓ Stock revertido.");
  }

  // 4. Borrar registros de devoluciones
  db.run("DELETE FROM return_items");
  db.run("DELETE FROM return_items WHERE 1=1"); // por si acaso
  db.run("DELETE FROM returns");
  console.log("✓ Tablas return_items y returns vaciadas.");

  // 5. Guardar
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  console.log("✓ Base de datos guardada en:", dbPath);
  console.log("\n¡Limpieza completada! Podés reiniciar la app.");
}

cleanup().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
