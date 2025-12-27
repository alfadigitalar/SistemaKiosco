const selfsigned = require("selfsigned");
console.log("Testing basic generation...");
try {
  const pems = selfsigned.generate(null, { days: 365 });
  console.log("Result type:", typeof pems);
  console.log("Result keys:", pems ? Object.keys(pems) : "null");
} catch (e) {
  console.error("Error:", e);
}
