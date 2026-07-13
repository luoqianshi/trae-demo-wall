// 启动临时HTTP服务器来验证 standalone HTML
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 5180;

const server = createServer((req, res) => {
  const filePath = join(__dirname, 'remote-tutoring-standalone.html');
  try {
    const content = readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(content);
    console.log(`✔ Served: ${req.url}`);
  } catch (e) {
    res.writeHead(500);
    res.end('Error: ' + e.message);
  }
});

server.listen(PORT, () => {
  console.log(`\n📦 Standalone Demo 服务运行中:`);
  console.log(`👉 http://localhost:${PORT}/\n`);
  console.log(`按 Ctrl+C 停止服务\n`);
});
