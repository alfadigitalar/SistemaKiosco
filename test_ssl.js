const selfsigned = require("selfsigned"); // Ensure this is require-able
const os = require("os");

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        if (
          iface.address.startsWith("192.168.") ||
          iface.address.startsWith("10.")
        ) {
          return iface.address;
        }
      }
    }
  }
  return "127.0.0.1";
}

try {
  const localIp = getLocalIp();
  console.log("Local IP:", localIp);

  console.log("Generating certs...");
  const attrs = [{ name: "commonName", value: localIp }];
  const pems = selfsigned.generate(attrs, { days: 365, algorithm: "sha256" });

  if (pems && pems.private && pems.cert) {
    console.log("SUCCESS: Keys generated.");
    console.log("Private Key length:", pems.private.length);
    console.log("Cert length:", pems.cert.length);
  } else {
    console.log("FAILURE: No keys returned.");
  }
} catch (e) {
  console.error("CRITICAL ERROR:", e);
}
