const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.tflite': 'application/octet-stream',
  '.binarypb': 'application/octet-stream',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  let filePath = req.url.split('?')[0];
  // Default to index.html
  if (filePath === '/') filePath = '/tucraft-image-tool.html';
  // Security: prevent directory traversal
  const safePath = path.normalize(path.join(ROOT, filePath)).replace(/\\/g, '/');
  if (!safePath.startsWith(path.normalize(ROOT).replace(/\\/g, '/'))) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  const ext = path.extname(safePath).toLowerCase();
  fs.readFile(safePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`图匠 TuCraft 服务已启动: http://localhost:${PORT}`);
  console.log('按 Ctrl+C 停止服务');
});
