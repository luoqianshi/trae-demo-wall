/**
 * Aftertype Unified Server
 * Serves the demo page AND the Agent API on the same port (8080)
 * This avoids cross-origin issues in the preview environment.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = path.dirname(__filename);

// Agent state
let sources = {};
let totalChar = 0;
let totalToken = 0;
let sessionStart = new Date().toISOString();
let sseClients = [];

const TOKEN_APPS = ['code', 'intellij', 'pycharm', 'webstorm', 'sublime', 'terminal', 'iterm', 'powershell', 'cmd', 'claude', 'chatgpt', 'copilot', 'vim', 'neovim', 'emacs'];

function classifyApp(appName) {
  const lower = (appName || '').toLowerCase();
  for (const t of TOKEN_APPS) {
    if (lower.includes(t)) return 'token';
  }
  return 'char';
}

function getAppIcon(appName) {
  const lower = (appName || '').toLowerCase();
  if (lower.includes('code') || lower.includes('intellij') || lower.includes('pycharm') || lower.includes('vim') || lower.includes('neovim')) return '💻';
  if (lower.includes('terminal') || lower.includes('iterm') || lower.includes('powershell') || lower.includes('cmd') || lower.includes('bash') || lower.includes('shell')) return '⬛';
  if (lower.includes('word') || lower.includes('pages') || lower.includes('docs')) return '📄';
  if (lower.includes('excel') || lower.includes('sheets')) return '📊';
  if (lower.includes('gmail') || lower.includes('outlook') || lower.includes('mail')) return '📧';
  if (lower.includes('slack')) return '💬';
  if (lower.includes('wechat') || lower.includes('微信')) return '💚';
  if (lower.includes('notion')) return '📝';
  if (lower.includes('claude') || lower.includes('chatgpt') || lower.includes('copilot')) return '🤖';
  if (lower.includes('feishu') || lower.includes('飞书') || lower.includes('lark')) return '📋';
  if (lower.includes('chrome') || lower.includes('firefox') || lower.includes('safari') || lower.includes('browser')) return '🌐';
  return '🖥️';
}

function processKey(appName, windowTitle, count) {
  count = count || 1;
  const currency = classifyApp(appName);
  const icon = getAppIcon(appName);
  const key = appName;

  if (!sources[key]) {
    sources[key] = { app: appName, title: windowTitle || appName, chars: 0, currency, icon, lastUpdate: Date.now() };
  }
  sources[key].chars += count;
  sources[key].title = windowTitle || sources[key].title;
  sources[key].lastUpdate = Date.now();

  if (currency === 'token') {
    totalToken += count * 2;
  } else {
    totalChar += count;
  }

  const event = JSON.stringify({ type: 'keystroke', app: appName, title: windowTitle, currency, chars: count, timestamp: Date.now() });
  sseClients.forEach(client => {
    try { client.write('data: ' + event + '\n\n'); } catch (e) {}
  });
}

function getStatus() {
  return {
    connected: true,
    sources: Object.values(sources).sort((a, b) => b.lastUpdate - a.lastUpdate),
    totalChar,
    totalToken,
    sessionStart
  };
}

// MIME types
const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // API routes
  if (req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getStatus()));
    return;
  }

  if (req.url === '/api/reset' && req.method === 'POST') {
    sources = {}; totalChar = 0; totalToken = 0;
    sessionStart = new Date().toISOString();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  if (req.url === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write('data: ' + JSON.stringify({ type: 'connected', status: getStatus() }) + '\n\n');
    sseClients.push(res);
    req.on('close', () => { sseClients = sseClients.filter(c => c !== res); });
    return;
  }

  if (req.url === '/api/keystroke' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        processKey(data.app || 'Manual', data.title || '', data.count || 1);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, status: getStatus() }));
      } catch (e) {
        res.writeHead(400); res.end('Bad request');
      }
    });
    return;
  }

  // Static file serving
  let filePath = req.url === '/' ? '/aftertype-demo.html' : req.url;
  filePath = path.join(ROOT, filePath.split('?')[0]);

  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + req.url);
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║     Aftertype Unified Server running       ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log('  ║  Demo:  http://localhost:' + PORT + '             ║');
  console.log('  ║  API:   http://localhost:' + PORT + '/api/status   ║');
  console.log('  ║  Inject: POST /api/keystroke              ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
  console.log('  验收方法：');
  console.log('  1. 浏览器打开 http://localhost:' + PORT);
  console.log('  2. 另开终端，执行以下命令注入打字数据：');
  console.log('     curl -X POST http://localhost:' + PORT + '/api/keystroke -H "Content-Type: application/json" -d \'{"app":"VS Code","title":"main.ts","count":20}\'');
  console.log('  3. 面板上的字符数会实时跳动');
  console.log('');
});
