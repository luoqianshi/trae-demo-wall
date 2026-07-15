const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = '';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET') {
    let filePath = path.join(__dirname, req.url === '/' ? 'creative-entry.html' : req.url);
    
    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif'
    }[ext] || 'text/plain';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/remove-bg') {
    let body = [];
    req.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body);
      
      try {
        const jsonData = JSON.parse(body.toString());
        
        if (!API_KEY || API_KEY === '') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: '请在server.js中设置有效的remove.bg API密钥' 
          }));
          return;
        }

        const options = {
          hostname: 'api.remove.bg',
          path: '/v1.0/removebg',
          method: 'POST',
          headers: {
            'X-Api-Key': API_KEY,
            'Content-Type': 'application/json',
            'Content-Length': body.length
          },
          timeout: 30000
        };

        const apiReq = https.request(options, (apiRes) => {
          let apiBody = [];
          apiRes.on('data', (chunk) => {
            apiBody.push(chunk);
          }).on('end', () => {
            apiBody = Buffer.concat(apiBody);
            
            if (apiRes.statusCode === 200) {
              res.writeHead(200, { 'Content-Type': 'image/png' });
              res.end(apiBody);
            } else {
              try {
                const errorData = JSON.parse(apiBody.toString());
                res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  success: false, 
                  error: errorData.errors?.[0]?.title || 'API调用失败' 
                }));
              } catch {
                res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'API调用失败' }));
              }
            }
          });
        });

        apiReq.on('error', (e) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: '网络错误: ' + e.message }));
        });

        apiReq.on('timeout', () => {
          apiReq.destroy();
          res.writeHead(504, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: '请求超时' }));
        });

        apiReq.write(body);
        apiReq.end();
        
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: '请求格式错误: ' + e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  if (!API_KEY || API_KEY === '') {
    console.log('⚠️  警告：未设置remove.bg API密钥，抠图功能将使用本地处理');
    console.log('请访问 https://www.remove.bg/api 获取免费API密钥');
    console.log('然后在server.js中设置 API_KEY 变量');
  }
});
