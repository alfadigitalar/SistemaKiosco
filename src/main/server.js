const express = require("express");
const https = require("https");
const { Server } = require("socket.io");
const ip = require("ip");
const path = require("path");
// const selfsigned = require("selfsigned"); // Disabled due to instability
const os = require("os");

let io;
let server;
const PORT = 3000;

// Helper para encontrar la IP local correcta
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Saltar interfaces internas y no-IPv4
      if (iface.family === "IPv4" && !iface.internal) {
        // Priorizar redes comunes de hogar/oficina (192.168.x.x)
        if (
          iface.address.startsWith("192.168.") ||
          iface.address.startsWith("10.")
        ) {
          return iface.address;
        }
      }
    }
  }
  return "127.0.0.1"; // Fallback
}

function startServer(mainWindow) {
  const app = express();
  const localIp = getLocalIp();

  // Servir archivos estáticos
  const scannerPath = path.join(__dirname, "scanner");
  app.use(express.static(scannerPath));

  // Socket.io Logic
  const attachSocket = (srv) => {
    io = new Server(srv, { cors: { origin: "*" } });
    io.on("connection", (socket) => {
      console.log("Mobile client connected:", socket.id);
      socket.on("scan", (code) => {
        console.log("Received scan:", code);
        if (mainWindow) mainWindow.webContents.send("mobile-scan", code);
      });
      socket.on("disconnect", () => console.log("Mobile disconnected"));
    });
  };

  try {
    // Intento 1: HTTPS (Preferido para cámara)
    console.log("Iniciando servidor HTTPS en:", localIp);

    // Cargar certificados estáticos
    let pems;
    try {
      pems = require("./cert"); // Carga desde cert.js
      console.log("Certificados estáticos cargados.");
    } catch (e) {
      throw new Error(
        "No se pudo cargar cert.js. Ejecuta node gen_cert_forge.js primero."
      );
    }

    server = https.createServer({ key: pems.private, cert: pems.cert }, app);
    attachSocket(server);

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Scanner server running on https://${localIp}:${PORT}`);
    });

    return { ip: localIp, port: PORT, url: `https://${localIp}:${PORT}` };
  } catch (error) {
    console.error(
      "FALLO HTTPS - INICIANDO MODO REPLIEGUE (HTTP):",
      error.message
    );

    try {
      // Intento 2: HTTP (Fallback, pero la cámara fallará en móviles)
      if (server) server.close();
      server = require("http").createServer(app);
      attachSocket(server);

      server.listen(PORT, "0.0.0.0", () => {
        console.log(
          `Scanner server running on http://${localIp}:${PORT} (Modo inseguro - Cámara limitada)`
        );
      });

      return { ip: localIp, port: PORT, url: `http://${localIp}:${PORT}` };
    } catch (httpError) {
      console.error("FATAL: No se pudo iniciar ni HTTPS ni HTTP", httpError);
      return null;
    }
  }
}

function stopServer() {
  if (io) {
    io.close();
  }
  if (server) {
    server.close();
  }
}

module.exports = { startServer, stopServer };
