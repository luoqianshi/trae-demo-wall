const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

function createServer() {
  return http.createServer((req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);

    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') {
      urlPath = '/zhixueban.html';
    }

    const filePath = path.join(__dirname, decodeURIComponent(urlPath));

    fs.readFile(filePath, (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 - File Not Found');
        } else {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('500 - Internal Server Error');
        }
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
}

function startServer(port) {
  const server = createServer();
  server.listen(port, () => {
    console.log(`\n========================================`);
    console.log(`  🎉 智学伴网站已启动！`);
    console.log(`  访问地址: http://localhost:${port}`);
    console.log(`  首页文件: zhixueban.html`);
    console.log(`========================================\n`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`端口 ${port} 已被占用，尝试端口 ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('服务器启动失败:', err);
      process.exit(1);
    }
  });
}

const START_PORT = 5000;
startServer(START_PORT);
