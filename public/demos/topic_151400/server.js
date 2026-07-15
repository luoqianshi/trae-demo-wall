/**
 * Mycelium — 菌丝词源
 * Node.js 本地开发服务器（Python 不可用时的备选方案）
 *
 * 用法:
 *   node server.js        # 默认端口 8080
 *   node server.js 3000   # 自定义端口
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.argv[2] ? parseInt(process.argv[2]) : 8080;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT, req.url === '/' ? 'index.html' : decodeURIComponent(req.url));
  if (filePath.endsWith('/')) filePath += 'index.html';

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n  Mycelium 菌丝词源 已启动`);
  console.log(`  本地地址: ${url}`);
  console.log(`  项目目录: ${ROOT}`);
  console.log(`\n  按 Ctrl+C 停止服务器\n`);

  // 尝试自动打开浏览器
  const cmd = os.platform() === 'darwin' ? 'open' : os.platform() === 'win32' ? 'start' : 'xdg-open';
  const { exec } = require('child_process');
  exec(`${cmd} ${url}`, () => {});
});
