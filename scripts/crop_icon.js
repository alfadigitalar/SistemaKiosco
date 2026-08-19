const { Jimp } = require("jimp");
const path = require("path");
const fs = require("fs");

const iconPath = path.join(__dirname, "../build/icon.png");

async function cropIcon() {
  try {
    console.log(`Leyendo icono desde: ${iconPath}`);
    // Jimp.read might need to be awaited or not depending on version, but typically returns a promise or uses node-style callback if not awaited.
    // Modern jimp uses static read() returning a promise.
    const image = await Jimp.read(iconPath);

    console.log("Recortando bordes vacíos...");
    image.autocrop();

    await image.write(iconPath);
    console.log("✅ Icono recortado exitosamente.");
  } catch (error) {
    const errorMsg = `Error: ${error.message}\nStack: ${error.stack}`;
    fs.writeFileSync("crop_error.txt", errorMsg);
    console.error("❌ Error. Details in crop_error.txt");
    process.exit(1);
  }
}

cropIcon();
