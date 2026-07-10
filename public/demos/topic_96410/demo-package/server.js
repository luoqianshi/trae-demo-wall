const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const ROOT = __dirname;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.atlas': 'text/plain'
};

const server = http.createServer((req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;
    
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    try {
        pathname = decodeURIComponent(pathname);
    } catch (e) {
        console.log('Decode error:', e.message);
    }
    
    const filePath = path.join(ROOT, pathname);
    
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 Forbidden');
        return;
    }
    
    fs.stat(filePath, (err, stats) => {
        if (err) {
            console.log(`404: ${filePath}`);
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found: ' + pathname);
            return;
        }
        
        if (stats.isDirectory()) {
            const indexPath = path.join(filePath, 'index.html');
            fs.access(indexPath, fs.constants.F_OK, (err) => {
                if (err) {
                    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('403 Forbidden');
                } else {
                    serveFile(indexPath, res);
                }
            });
        } else {
            serveFile(filePath, res);
        }
    });
});

function serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.log(`Error reading: ${filePath}`, err.message);
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('500 Internal Server Error');
            return;
        }
        
        console.log(`200: ${filePath} (${data.length} bytes)`);
        res.writeHead(200, { 
            'Content-Type': contentType,
            'Content-Length': data.length
        });
        res.end(data);
    });
}

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`端口 ${PORT} 已被占用!`);
        server.listen(0);
    } else {
        console.error('Server error:', err);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    const actualPort = server.address().port;
    console.log('='.repeat(60));
    console.log('服务器启动成功!');
    console.log('='.repeat(60));
    console.log(`访问地址: http://localhost:${actualPort}/`);
    console.log('备用地址: http://127.0.0.1:${actualPort}/`);
    console.log('='.repeat(60));
});