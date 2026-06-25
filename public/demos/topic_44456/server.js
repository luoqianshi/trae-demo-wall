const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

const app = express();
const PORT = 8443;
const HTTP_PORT = 8080;

const sslDir = path.join(__dirname, 'ssl');
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
}

const certPath = path.join(sslDir, 'cert.pem');
const keyPath = path.join(sslDir, 'key.pem');

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.log('Generating self-signed SSL certificate...');
  const attrs = [{ name: 'commonName', value: 'smart-glasses-pos.local' }];
  const pems = selfsigned.generate(attrs, {
    keySize: 2048,
    days: 365,
    algorithm: 'sha256'
  });
  
  fs.writeFileSync(certPath, pems.cert);
  fs.writeFileSync(keyPath, pems.private);
  console.log('SSL certificate generated successfully!');
}

const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
};

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'smart-glasses-pos.html'));
});

const httpsServer = https.createServer(options, app);
const httpServer = http.createServer((req, res) => {
  res.writeHead(301, { 'Location': 'https://' + req.headers.host.replace('8080', '8443') + req.url });
  res.end();
});

httpsServer.listen(PORT, () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  
  console.log('=============================================');
  console.log('  HTTPS Server Started');
  console.log('=============================================');
  console.log('');
  
  addresses.forEach(ip => {
    console.log(`  HTTPS: https://${ip}:${PORT}`);
    console.log(`  HTTPS: https://${ip}:${PORT}/smart-glasses-pos.html`);
    console.log(`  HTTPS: https://${ip}:${PORT}/qrcode.html`);
    console.log('');
  });
  
  console.log(`  Local: https://localhost:${PORT}`);
  console.log('');
  console.log('=============================================');
  console.log('  Note: Your browser will show a security');
  console.log('        warning because this is a self-signed');
  console.log('        certificate. Click "Advanced" ->');
  console.log('        "Proceed" to continue.');
  console.log('=============================================');
  
  try {
    const qrcode = require('qrcode-terminal');
    const mainUrl = `https://${addresses[0] || 'localhost'}:${PORT}/smart-glasses-pos.html`;
    console.log('\n  Scan QR Code to access from mobile:\n');
    qrcode.generate(mainUrl, { small: true });
  } catch (e) {
    console.log('  QR code generation skipped');
  }
});

httpServer.listen(HTTP_PORT, () => {
  console.log(`HTTP server redirecting to HTTPS on port ${HTTP_PORT}`);
});
