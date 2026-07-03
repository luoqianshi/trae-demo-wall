/**
 * Aftertype Desktop Agent
 * 
 * Lightweight system tray app that:
 * 1. Counts global keystrokes (count only, no content stored)
 * 2. Identifies active window title to classify typing source
 * 3. Categorizes: IDE/Terminal -> Token, Documents/Mail/Chat -> Char
 * 4. Serves data via HTTP API on port 17380
 * 5. Falls back to simulation mode when keyboard hook unavailable
 */

const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const cors = require('cors');

let tray = null;
let mainWindow = null;
let server = null;
let isPaused = false;
let useSimulation = false;

// State tracking
let sources = {};  // { 'VS Code': { app, title, chars, currency, icon, lastUpdate } }
let totalChar = 0;
let totalToken = 0;
let sessionStart = new Date().toISOString();
let sseClients = [];

// App classification rules
const TOKEN_APPS = ['visual studio code', 'vscode', 'intellij', 'pycharm', 'webstorm', 'sublime', 'terminal', 'iterm', 'powershell', 'cmd', 'claude', 'chatgpt', 'copilot', 'bard', 'gemini'];

function classifyApp(appName) {
  const lower = (appName || '').toLowerCase();
  for (const token of TOKEN_APPS) {
    if (lower.includes(token)) return 'token';
  }
  return 'char';
}

function getAppIcon(appName) {
  const lower = (appName || '').toLowerCase();
  if (lower.includes('code') || lower.includes('intellij') || lower.includes('pycharm')) return '💻';
  if (lower.includes('terminal') || lower.includes('iterm') || lower.includes('powershell') || lower.includes('cmd')) return '⬛';
  if (lower.includes('word') || lower.includes('pages') || lower.includes('docs')) return '📄';
  if (lower.includes('excel') || lower.includes('sheets')) return '📊';
  if (lower.includes('gmail') || lower.includes('outlook') || lower.includes('mail')) return '📧';
  if (lower.includes('slack')) return '💬';
  if (lower.includes('wechat') || lower.includes('微信')) return '💚';
  if (lower.includes('notion')) return '📝';
  if (lower.includes('claude') || lower.includes('chatgpt') || lower.includes('copilot')) return '🤖';
  if (lower.includes('feishu') || lower.includes('飞书') || lower.includes('lark')) return '📋';
  if (lower.includes('chrome') || lower.includes('firefox') || lower.includes('safari') || lower.includes('edge')) return '🌐';
  if (lower.includes('figma')) return '🎨';
  return '🖥️';
}

// Process a keystroke event
function processKey(appName, windowTitle) {
  if (isPaused) return;

  const currency = classifyApp(appName);
  const icon = getAppIcon(appName);
  const key = appName || 'Unknown';

  if (!sources[key]) {
    sources[key] = {
      app: appName || 'Unknown',
      title: windowTitle || appName || 'Unknown',
      chars: 0,
      currency: currency,
      icon: icon,
      lastUpdate: Date.now()
    };
  }
  sources[key].chars += 1;
  sources[key].title = windowTitle || sources[key].title;
  sources[key].lastUpdate = Date.now();

  if (currency === 'token') {
    totalToken += 2;
  } else {
    totalChar += 1;
  }

  // Push SSE event
  broadcastEvent({
    type: 'keystroke',
    app: appName,
    title: windowTitle,
    currency: currency,
    chars: 1,
    timestamp: Date.now()
  });
}

// Broadcast SSE event to all connected clients
function broadcastEvent(event) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  sseClients.forEach(client => {
    try { client.write(data); } catch (e) { /* client disconnected */ }
  });
}

// Get current status
function getStatus() {
  return {
    connected: !useSimulation,
    simulating: useSimulation,
    paused: isPaused,
    sources: Object.values(sources).sort((a, b) => b.lastUpdate - a.lastUpdate),
    totalChar: totalChar,
    totalToken: totalToken,
    sessionStart: sessionStart
  };
}

// ==================== HTTP Server ====================
function startServer() {
  const expressApp = express();
  expressApp.use(cors());
  expressApp.use(express.json());

  // Status endpoint
  expressApp.get('/api/status', (req, res) => {
    res.json(getStatus());
  });

  // Reset endpoint
  expressApp.post('/api/reset', (req, res) => {
    sources = {};
    totalChar = 0;
    totalToken = 0;
    sessionStart = new Date().toISOString();
    res.json({ success: true });
  });

  // SSE endpoint for real-time events
  expressApp.get('/api/events', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', status: getStatus() })}\n\n`);
    
    sseClients.push(res);
    
    req.on('close', () => {
      sseClients = sseClients.filter(c => c !== res);
    });
  });

  // Manual keystroke injection (for testing)
  expressApp.post('/api/keystroke', (req, res) => {
    const { app, title, count } = req.body;
    const c = count || 1;
    for (let i = 0; i < c; i++) {
      processKey(app || 'Manual', title || '');
    }
    res.json({ success: true, status: getStatus() });
  });

  server = expressApp.listen(17380, () => {
    console.log('Aftertype Agent API running on http://localhost:17380');
  });
}

// ==================== Keyboard Hook ====================
async function setupKeyboardHook() {
  try {
    const uiohook = require('uiohook-napi');
    
    uiohook.hookStart();
    uiohook.on('input', (event) => {
      if (event.type === 'eventKeyDown' || event.type === 5) {
        if (isPaused) return;
        
        // Get active window
        const activeWin = getActiveWindow();
        processKey(activeWin.app, activeWin.title);
      }
    });
    
    console.log('Keyboard hook started (uiohook-napi)');
    return true;
  } catch (e) {
    console.log('uiohook-napi not available:', e.message);
    return false;
  }
}

// Get active window using active-win or fallback
let activeWinModule = null;
async function loadActiveWin() {
  try {
    activeWinModule = require('active-win');
    return true;
  } catch (e) {
    console.log('active-win not available:', e.message);
    return false;
  }
}

function getActiveWindow() {
  // Synchronous fallback - active-win is async so we cache last result
  return lastActiveWin || { app: 'Unknown', title: 'Unknown' };
}

let lastActiveWin = { app: 'Unknown', title: 'Unknown' };

// Poll active window periodically
async function pollActiveWindow() {
  if (!activeWinModule) return;
  try {
    const win = await activeWinModule();
    if (win) {
      lastActiveWin = { app: win.owner.name || 'Unknown', title: win.title || '' };
    }
  } catch (e) {
    // ignore
  }
}

// ==================== Simulation Mode ====================
const SIM_APPS = [
  { app: 'VS Code', icon: '💻', patterns: ['main.ts', 'auth.py', 'server.js', 'README.md', 'config.json'], currency: 'token', weight: 30 },
  { app: 'Google Docs', icon: '📄', patterns: ['项目周报', '产品需求文档', '会议纪要', 'OKR规划'], currency: 'char', weight: 15 },
  { app: 'Gmail', icon: '📧', patterns: ['回复客户邮件', '项目进度同步', '面试邀约'], currency: 'char', weight: 15 },
  { app: 'Claude', icon: '🤖', patterns: ['AI对话', '代码审查', '文档生成'], currency: 'token', weight: 12 },
  { app: 'Slack', icon: '💬', patterns: ['#product-team', '#engineering', '私聊:张三'], currency: 'char', weight: 10 },
  { app: 'Notion', icon: '📝', patterns: ['知识库', 'Sprint看板', '设计文档'], currency: 'char', weight: 8 },
  { app: 'Terminal', icon: '⬛', patterns: ['git commit', 'npm run dev', 'docker build'], currency: 'token', weight: 5 },
  { app: '飞书文档', icon: '📋', patterns: ['需求评审', '周会记录', '技术方案'], currency: 'char', weight: 5 }
];

let simTimer = null;

function startSimulation() {
  useSimulation = true;
  console.log('Starting simulation mode...');

  function simulateEvent() {
    if (isPaused || !useSimulation) return;

    const totalWeight = SIM_APPS.reduce((s, a) => s + a.weight, 0);
    let r = Math.random() * totalWeight;
    let appIdx = 0;
    for (let i = 0; i < SIM_APPS.length; i++) {
      r -= SIM_APPS[i].weight;
      if (r <= 0) { appIdx = i; break; }
    }

    const app = SIM_APPS[appIdx];
    const title = app.patterns[Math.floor(Math.random() * app.patterns.length)];
    const charCount = Math.floor(Math.random() * 5) + 1;

    for (let i = 0; i < charCount; i++) {
      processKey(app.app, title);
    }

    simTimer = setTimeout(simulateEvent, Math.random() * 3000 + 1000);
  }

  simTimer = setTimeout(simulateEvent, 2000);
}

function stopSimulation() {
  if (simTimer) { clearTimeout(simTimer); simTimer = null; }
  useSimulation = false;
}

// ==================== Tray ====================
function createTray() {
  // Use a simple icon - in production, use a proper icon file
  tray = new Tray(createTrayIcon());
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Aftertype Agent', enabled: false },
    { type: 'separator' },
    { 
      label: isPaused ? '恢复计数' : '暂停计数', 
      click: () => {
        isPaused = !isPaused;
        tray.setToolTip('Aftertype Agent' + (isPaused ? ' (已暂停)' : ''));
        createTray(); // refresh menu
      }
    },
    { 
      label: useSimulation ? '模拟模式运行中' : 'Agent模式运行中',
      enabled: false 
    },
    { type: 'separator' },
    { 
      label: '重置计数',
      click: () => {
        sources = {};
        totalChar = 0;
        totalToken = 0;
        sessionStart = new Date().toISOString();
        console.log('Counters reset');
      }
    },
    { type: 'separator' },
    { 
      label: '退出',
      click: () => {
        stopSimulation();
        if (server) server.close();
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Aftertype Agent');
  tray.setContextMenu(contextMenu);
}

// Create a simple 16x16 tray icon buffer
function createTrayIcon() {
  const { nativeImage } = require('electron');
  // Create a simple icon (a green dot on transparent background)
  const size = 16;
  const icon = nativeImage.createEmpty();
  // In production, use a proper icon file
  // For now, use Electron's default
  return icon;
}

// ==================== App Lifecycle ====================
app.whenReady().then(async () => {
  // Start HTTP server first (critical for panel connection)
  startServer();

  // Try to load keyboard hook
  const hookReady = await setupKeyboardHook();
  const activeWinReady = await loadActiveWin();

  if (hookReady && activeWinReady) {
    console.log('Real keyboard hook active');
    // Poll active window every 500ms
    setInterval(pollActiveWindow, 500);
  } else {
    console.log('Falling back to simulation mode');
    startSimulation();
  }

  // Create tray
  createTray();

  // Don't show in dock/taskbar
  if (process.platform === 'darwin') app.dock.hide();
});

app.on('window-all-closed', (e) => {
  // Prevent app from quitting when window is closed (tray-only app)
  e.preventDefault();
});

app.on('before-quit', () => {
  stopSimulation();
  if (server) server.close();
});
