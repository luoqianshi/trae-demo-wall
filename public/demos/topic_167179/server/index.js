/**
 * 快讯包装生成器 - MVP 集成服务
 * 统一提供：静态页面、/api/analyze、/api/render、/output/* 下载
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { analyzeScript } = require('./analyze-adapter');
const { renderJob } = require('./render-adapter');
const trackController = require('./track-controller');

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '127.0.0.1';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.zip': 'application/zip',
};

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Id');
}

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data, null, 2));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) reject(new Error('请求体过大'));
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('无效的 JSON 请求体'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  // 禁止访问上级目录
  const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\$))+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendJSON(res, 403, { error: 'Forbidden' });
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // SPA 路由兜底：返回 index.html
        const indexPath = path.join(PUBLIC_DIR, 'index.html');
        fs.readFile(indexPath, (e2, indexData) => {
          if (e2) {
            sendJSON(res, 404, { error: 'Not found' });
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(indexData);
          }
        });
      } else {
        sendJSON(res, 500, { error: err.message });
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.end(data);
  });
}

function serveOutput(req, res) {
  const prefix = '/output/';
  let fileName = decodeURIComponent(req.url.slice(prefix.length).split('?')[0]);
  fileName = path.normalize(fileName).replace(/^(\.\.(\/|\$))+/, '');
  const filePath = path.join(OUTPUT_DIR, fileName);

  if (!filePath.startsWith(OUTPUT_DIR)) {
    sendJSON(res, 403, { error: 'Forbidden' });
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      sendJSON(res, 404, { error: 'File not found' });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Content-Length': stats.size,
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  setCORS(res);

  const startTime = Date.now();
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`[${new Date().toISOString()}] ${clientIp} ${req.method} ${req.url}`);

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} -> ${res.statusCode} (${duration}ms)`);
  });

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 健康检查
  if (req.method === 'GET' && req.url === '/api/health') {
    sendJSON(res, 200, { status: 'ok', timestamp: Date.now() });
    return;
  }

  // 分析接口
  if (req.method === 'POST' && req.url === '/api/analyze') {
    try {
      const body = await parseBody(req);
      const { text, maxResults = 12, provider = 'local', apiKey, mode = 'rules-first' } = body;
      if (!text || text.trim().length === 0) {
        sendJSON(res, 400, { status: 'error', error: '缺少 text 字段' });
        return;
      }
      const options = { maxResults };
      if (provider && provider !== 'local') {
        options.provider = provider;
        options.apiKey = apiKey;
        options.mode = mode || 'rules-first';
      }
      const result = await analyzeScript(text, options);
      sendJSON(res, 200, result);
    } catch (err) {
      console.error('[analyze error]', err);
      sendJSON(res, 500, { status: 'error', error: err.message });
    }
    return;
  }

  // KIMI 连接测试
  if (req.method === 'POST' && req.url === '/api/kimi/test') {
    try {
      const body = await parseBody(req);
      const { apiKey } = body;
      if (!apiKey) {
        sendJSON(res, 400, { status: 'error', error: '缺少 apiKey 字段' });
        return;
      }
      const { callLLM } = require('../analyzer/src/llm/llm-client');
      const testText = '2024年，我国 GDP 增长 5.2%，消费市场持续回暖。';
      const points = await callLLM(testText, 'kimi', apiKey);
      sendJSON(res, 200, { status: 'ok', connected: true, sampleCount: points.length });
    } catch (err) {
      console.error('[kimi test error]', err.message);
      sendJSON(res, 200, { status: 'ok', connected: false, error: err.message });
    }
    return;
  }

  // 渲染接口
  if (req.method === 'POST' && req.url === '/api/render') {
    try {
      const body = await parseBody(req);
      const result = await renderJob(body);
      sendJSON(res, result.status === 'done' ? 200 : 500, result);
    } catch (err) {
      console.error('[render error]', err);
      sendJSON(res, 500, { status: 'error', error: err.message });
    }
    return;
  }

  // ========== 完整包装轨流程 ==========
  if (req.method === 'POST' && req.url === '/api/track/upload-media') {
    await trackController.handleUploadMedia(req, res);
    return;
  }
  if (req.method === 'POST' && req.url === '/api/track/upload-script') {
    await trackController.handleUploadScript(req, res);
    return;
  }
  if (req.method === 'POST' && req.url === '/api/track/upload-subtitle') {
    await trackController.handleUploadSubtitle(req, res);
    return;
  }
  if (req.method === 'POST' && req.url === '/api/track/transcribe') {
    await trackController.handleTranscribe(req, res);
    return;
  }
  if (req.method === 'POST' && req.url === '/api/track/align') {
    await trackController.handleAlign(req, res);
    return;
  }
  if (req.method === 'POST' && req.url === '/api/track/render') {
    await trackController.handleRenderTrack(req, res);
    return;
  }

  // 输出文件下载
  if (req.method === 'GET' && req.url.startsWith('/output/')) {
    serveOutput(req, res);
    return;
  }

  // 静态资源
  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  sendJSON(res, 404, { error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`\n🎬 快讯包装生成器 - MVP 集成服务`);
  console.log(`   访问地址: http://${HOST}:${PORT}`);
  console.log(`   分析接口: POST http://${HOST}:${PORT}/api/analyze`);
  console.log(`   渲染接口: POST http://${HOST}:${PORT}/api/render`);
  console.log(`   文件下载: GET  http://${HOST}:${PORT}/output/...\n`);
});

module.exports = server;
