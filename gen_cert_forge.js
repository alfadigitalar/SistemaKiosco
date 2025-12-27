const forge = require("node-forge");
const fs = require("fs");
const path = require("path");

console.log("Generating 2048-bit key-pair...");
const keys = forge.pki.rsa.generateKeyPair(2048);
console.log("Key pair generated.");

const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = "01";
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);

const attrs = [
  {
    name: "commonName",
    value: "Novy POS",
  },
  {
    name: "countryName",
    value: "AR",
  },
  {
    shortName: "ST",
    value: "Buenos Aires",
  },
  {
    name: "localityName",
    value: "Buenos Aires",
  },
  {
    name: "organizationName",
    value: "Novy",
  },
  {
    shortName: "OU",
    value: "POS",
  },
];

cert.setSubject(attrs);
cert.setIssuer(attrs);

// Set extensions
cert.setExtensions([
  {
    name: "basicConstraints",
    cA: true,
  },
  {
    name: "keyUsage",
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true,
  },
  {
    name: "subjectAltName",
    altNames: [
      {
        type: 7, // IP
        ip: "127.0.0.1",
      },
      {
        type: 7, // IP
        ip: "192.168.18.169", // Hardcoded for this specific user env based on logs
      },
    ],
  },
]);

// Sign
cert.sign(keys.privateKey, forge.md.sha256.create());
console.log("Certificate signed.");

const pem = {
  private: forge.pki.privateKeyToPem(keys.privateKey),
  cert: forge.pki.certificateToPem(cert),
};

const content = `module.exports = {
  private: \`${pem.private}\`,
  cert: \`${pem.cert}\`
};`;

fs.writeFileSync(path.join(__dirname, "src/main/cert.js"), content);
console.log("src/main/cert.js created successfully.");
