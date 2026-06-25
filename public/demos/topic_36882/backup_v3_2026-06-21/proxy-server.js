/**
 * 遗韵工坊 V3 - CORS代理服务器
 * 
 * 由于SiliconFlow等AI API不支持浏览器端CORS直接调用，
 * 本代理服务器作为本地中转，帮助前端绕过CORS限制。
 * 
 * 使用方式：
 * 1. 安装Node.js (https://nodejs.org/)
 * 2. 在终端中运行: node proxy-server.js
 * 3. 在页面的AI设置中，CORS代理URL填入: http://localhost:3001/proxy?url=
 * 
 * 支持的所有API提供商:
 * - SiliconFlow: https://api.siliconflow.cn/v1
 * - OpenAI: https://api.openai.com/v1
 * - DeepSeek: https://api.deepseek.com/v1
 * - 通义千问: https://dashscope.aliyuncs.com/compatible-mode/v1
 * - 智谱GLM: https://open.bigmodel.cn/api/paas/v4
 * - Claude: https://api.anthropic.com/v1
 * - 任意自定义API
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3001;

function proxyRequest(targetUrl, headers, body, res) {
  const parsed = new URL(targetUrl);
  const options = {
    hostname: parsed.hostname,
    port: parsed.port || 443,
    path: parsed.pathname + parsed.search,
    method: 'POST',
    headers: {
      ...headers,
      'host': parsed.hostname
    }
  };

  const proto = parsed.protocol === 'https:' ? https : http;
  const req = proto.request(options, (proxyRes) => {
    // 添加CORS头，允许前端读取响应
    res.writeHead(proxyRes.statusCode, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Content-Type': proxyRes.headers['content-type'] || 'application/json'
    });
    proxyRes.pipe(res);
  });

  req.on('error', (err) => {
    res.writeHead(500, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Content-Type': 'application/json'
    });
    res.end(JSON.stringify({ error: { message: '代理请求失败: ' + err.message } }));
  });

  req.write(body);
  req.end();
}

const server = http.createServer((req, res) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    });
    res.end();
    return;
  }

  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;

  // 状态检查
  if (path === '/status' || path === '/') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      status: 'running',
      port: PORT,
      message: '遗韵工坊 CORS代理服务器运行中'
    }));
    return;
  }

  // 代理接口 /proxy?url=...
  if (path === '/proxy') {
    const targetUrl = parsed.query.url;
    if (!targetUrl) {
      res.writeHead(400, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ error: { message: '缺少 url 参数' } }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      proxyRequest(targetUrl, req.headers, body, res);
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`✓ 遗韵工坊 CORS 代理服务器已启动`);
  console.log(`  监听地址: http://localhost:${PORT}`);
  console.log(`  代理接口: http://localhost:${PORT}/proxy?url=目标API地址`);
  console.log('');
  console.log(`  请在页面AI设置 -> CORS代理URL 填入:`);
  console.log(`  http://localhost:${PORT}/proxy?url=`);
  console.log('');
  console.log('  按 Ctrl+C 停止服务器');
});