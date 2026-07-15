const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 9090;

const server = http.createServer((req, res) => {
    if (req.url === '/api/analyze' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const { apiKey, prompt } = JSON.parse(body);
            
            const options = {
                hostname: 'api.deepseek.com',
                port: 443,
                path: '/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey,
                    'Content-Length': Buffer.byteLength(JSON.stringify({
                        model: 'deepseek-chat',
                        messages: [
                            { role: 'system', content: '你是一只可爱的悄悄鸭，专门帮助小朋友分析和兄弟姐妹之间的小矛盾，语气温柔、可爱。' },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.8,
                        max_tokens: 500
                    }))
                }
            };
            
            const proxyReq = https.request(options, proxyRes => {
                let proxyBody = '';
                proxyRes.on('data', chunk => {
                    proxyBody += chunk.toString();
                });
                proxyRes.on('end', () => {
                    res.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(proxyBody);
                });
            });
            
            proxyReq.on('error', error => {
                res.writeHead(500, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ error: error.message }));
            });
            
            proxyReq.write(JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: '你是一只可爱的悄悄鸭，专门帮助小朋友分析和兄弟姐妹之间的小矛盾，语气温柔、可爱。' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.8,
                max_tokens: 500
            }));
            proxyReq.end();
        });
    } else {
        const filePath = req.url === '/' ? '/index.html' : req.url;
        const fullPath = path.join(__dirname, filePath);
        
        fs.readFile(fullPath, (err, content) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            
            let contentType = 'text/html';
            if (filePath.endsWith('.css')) contentType = 'text/css';
            if (filePath.endsWith('.js')) contentType = 'application/javascript';
            if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';
            if (filePath.endsWith('.png')) contentType = 'image/png';
            if (filePath.endsWith('.svg')) contentType = 'image/svg+xml';
            
            res.writeHead(200, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });
            res.end(content);
        });
    }
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});