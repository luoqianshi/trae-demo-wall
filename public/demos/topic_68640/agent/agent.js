/**
 * Aftertype Agent - Lightweight Node.js version
 * No Electron dependency. Runs in terminal.
 * 
 * Usage:
 *   node agent.js              - Interactive mode (type in terminal)
 *   node agent.js --serve      - HTTP server only (receive injections)
 *   node agent.js --simulate   - Simulated data (for demo without typing)
 */

const http = require('http');
const readline = require('readline');

const PORT = 17380;

let sources = {};
let totalChar = 0;
let totalToken = 0;
let sessionStart = new Date().toISOString();
let sseClients = [];
let mode = 'serve'; // 'interactive' | 'serve' | 'simulate'

// App classification
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

  // Broadcast to SSE clients
  const event = JSON.stringify({ type: 'keystroke', app: appName, title: windowTitle, currency, chars: count, timestamp: Date.now() });
  sseClients.forEach(client => {
    try { client.write('data: ' + event + '\n\n'); } catch (e) {}
  });
}

function getStatus() {
  return {
    connected: true,
    simulating: mode === 'simulate',
    mode: mode,
    sources: Object.values(sources).sort((a, b) => b.lastUpdate - a.lastUpdate),
    totalChar,
    totalToken,
    sessionStart
  };
}

// HTTP Server
function startServer() {
  const server = http.createServer((req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

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
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      res.write('data: ' + JSON.stringify({ type: 'connected', status: getStatus() }) + '\n\n');
      sseClients.push(res);
      req.on('close', () => { sseClients = sseClients.filter(c => c !== res); });
      return;
    }

    // POST /api/keystroke { app, title, count }
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

    res.writeHead(404); res.end('Not found');
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════╗');
    console.log('  ║       Aftertype Agent is running          ║');
    console.log('  ╠══════════════════════════════════════════╣');
    console.log('  ║  API: http://localhost:' + PORT + '             ║');
    console.log('  ║  Status: GET  /api/status               ║');
    console.log('  ║  Events: GET  /api/events (SSE)         ║');
    console.log('  ║  Inject: POST /api/keystroke            ║');
    console.log('  ╚══════════════════════════════════════════╝');
    console.log('');
  });
}

// Interactive mode - type in terminal, each keystroke counts
function startInteractive() {
  mode = 'interactive';
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║    Aftertype Agent - Interactive Mode    ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log('  ║  你打的每个字都会实时推送到面板！        ║');
  console.log('  ║  按 Enter 换行，按 Ctrl+C 退出           ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
  console.log('  开始打字: ');
  console.log('');

  // Terminal keystrokes count as 'Terminal' app -> Token currency
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  let buffer = '';
  process.stdin.on('data', (key) => {
    // Ctrl+C
    if (key === '\u0003') {
      console.log('\n  Agent stopped.\n');
      process.exit(0);
    }

    // Enter
    if (key === '\r' || key === '\n') {
      process.stdout.write('\n');
      buffer = '';
      return;
    }

    // Backspace
    if (key === '\u007f' || key === '\b') {
      if (buffer.length > 0) {
        buffer = buffer.slice(0, -1);
        process.stdout.write('\b \b');
      }
      return;
    }

    // Regular character
    if (key.length > 0) {
      buffer += key;
      process.stdout.write(key);
      // Each keystroke -> processKey
      processKey('Terminal', 'agent.js - Interactive', 1);
    }
  });
}

// Simulate mode
function startSimulate() {
  mode = 'simulate';
  const SIM_APPS = [
    { app: 'VS Code', icon: '💻', patterns: ['main.ts', 'auth.py', 'server.js'], currency: 'token', weight: 30 },
    { app: 'Google Docs', icon: '📄', patterns: ['项目周报', '需求文档', '会议纪要'], currency: 'char', weight: 15 },
    { app: 'Gmail', icon: '📧', patterns: ['回复客户', '进度同步', '面试邀约'], currency: 'char', weight: 15 },
    { app: 'Claude', icon: '🤖', patterns: ['AI对话', '代码审查'], currency: 'token', weight: 12 },
    { app: 'Slack', icon: '💬', patterns: ['#product', '#engineering'], currency: 'char', weight: 10 },
    { app: 'Notion', icon: '📝', patterns: ['知识库', 'Sprint看板'], currency: 'char', weight: 8 },
    { app: 'Terminal', icon: '⬛', patterns: ['git commit', 'npm run dev'], currency: 'token', weight: 5 },
    { app: '飞书文档', icon: '📋', patterns: ['需求评审', '技术方案'], currency: 'char', weight: 5 }
  ];

  console.log('  Simulate mode started. Data will appear in panel.');
  console.log('  Press Ctrl+C to stop.');

  function simulateEvent() {
    const totalW = SIM_APPS.reduce((s, a) => s + a.weight, 0);
    let r = Math.random() * totalW;
    let idx = 0;
    for (let i = 0; i < SIM_APPS.length; i++) {
      r -= SIM_APPS[i].weight;
      if (r <= 0) { idx = i; break; }
    }
    const app = SIM_APPS[idx];
    const title = app.patterns[Math.floor(Math.random() * app.patterns.length)];
    const count = Math.floor(Math.random() * 5) + 1;
    processKey(app.app, title, count);
    setTimeout(simulateEvent, Math.random() * 3000 + 1000);
  }
  setTimeout(simulateEvent, 1000);
}

// Parse args
const args = process.argv.slice(2);
startServer();

if (args.includes('--simulate')) {
  startSimulate();
} else if (args.includes('--serve')) {
  console.log('  Serve mode. API only. Use POST /api/keystroke to inject data.');
  console.log('  Press Ctrl+C to stop.');
} else {
  // Default: interactive mode
  startInteractive();
}
