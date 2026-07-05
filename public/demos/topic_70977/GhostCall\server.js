#!/usr/bin/env node
'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync, exec } = require('child_process');
const { WebSocketServer } = require('ws');

// ─── 配置 ───────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '8080', 10);
const HEARTBEAT_INTERVAL = 30_000;
const CERTS_DIR = path.join(__dirname, 'certs');
const MAX_CONNECTIONS = 200;      // 全局最大 WS 连接数
const MAX_PEERS_PER_ROOM = 20;    // 单个房间最大人数
const MAX_MSG_SIZE = 64 * 1024;   // 64KB 单条消息上限

// ─── 尝试 HTTPS（有证书时），否则 HTTP（localhost 是安全上下文）──
function tryLoadCerts() {
  // 方式1：文件系统证书（开发模式）
  const keyPath = path.join(CERTS_DIR, 'key.pem');
  const certPath = path.join(CERTS_DIR, 'cert.pem');
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    try {
      const tls = require('tls');
      const key = fs.readFileSync(keyPath);
      const cert = fs.readFileSync(certPath);
      tls.createSecureContext({ key, cert });
      return { key, cert };
    } catch (e) {
      console.error('[certs] 文件系统证书不可用:', e.message?.slice(0, 80));
    }
  }
  // 方式2：内嵌证书（SEA 单文件模式）
  try {
    const embedded = require('EMBEDDED_CERTS');
    const tls = require('tls');
    const key = Buffer.from(embedded.key);
    const cert = Buffer.from(embedded.cert);
    tls.createSecureContext({ key, cert });
    console.log('[certs] 使用内嵌证书');
    return { key, cert };
  } catch {
    // 无内嵌证书
  }
  return null;
}

function generateCerts() {
  // 使用 PowerShell + CngKey 生成自签名证书
  const keyPath = path.join(CERTS_DIR, 'key.pem');
  const certPath = path.join(CERTS_DIR, 'cert.pem');
  if (!fs.existsSync(CERTS_DIR)) fs.mkdirSync(CERTS_DIR, { recursive: true });
  const psScript = path.join(__dirname, 'gen-certs.ps1');
  try {
    if (fs.existsSync(psScript)) {
      execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psScript}"`, {
        stdio: 'pipe', shell: true, timeout: 15000,
      });
      console.log('[certs] 自签名证书已生成');
    }
  } catch (e) {
    console.log('[certs] 证书生成失败:', e.message?.slice(0, 80));
  }
  return tryLoadCerts();
}

// ─── 安全头 ─────────────────────────────────────────────────
const HEADERS = {
  'Content-Security-Policy': "default-src 'self'; connect-src 'self' ws: wss: https: http:; media-src 'self' blob:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// ─── IP 滑动窗口限速 ──────────────────────────────────────
const RATE_LIMIT_WINDOW = 10_000; // 10 秒窗口
const RATE_LIMIT_MAX = 30;        // 窗口内最大请求数
const ipTimestamps = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  let timestamps = ipTimestamps.get(ip);
  if (!timestamps) { timestamps = []; ipTimestamps.set(ip, timestamps); }
  // 清除过期记录
  while (timestamps.length > 0 && now - timestamps[0] > RATE_LIMIT_WINDOW) timestamps.shift();
  if (timestamps.length >= RATE_LIMIT_MAX) {
    console.log(`[rate-limit] 拒绝 IP ${ip}，${timestamps.length}/${RATE_LIMIT_MAX} 次/${RATE_LIMIT_WINDOW / 1000}s`);
    return true;
  }
  timestamps.push(now);
  return false;
}

// ─── Origin 白名单校验 ───────────────────────────────────────
function isOriginAllowed(origin) {
  if (!origin) return true; // 非浏览器连接（如 curl）放行
  const allowed = [
    'http://localhost',
    'https://localhost',
    `http://localhost:${PORT}`,
    `https://localhost:${PORT}`,
    'http://127.0.0.1',
    'https://127.0.0.1',
    `http://127.0.0.1:${PORT}`,
    `https://127.0.0.1:${PORT}`,
  ];
  // Cloudflare Tunnel 域名
  if (tunnelUrl && origin === tunnelUrl) return true;
  // 本机 IP
  if (origin.startsWith('http://') || origin.startsWith('https://')) {
    try {
      const u = new URL(origin);
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return true;
      // 允许局域网 IP
      if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(u.hostname)) return true;
      // 允许 Tunnel 域名
      if (u.hostname.endsWith('.trycloudflare.com')) return true;
    } catch { /* ignore URL parse errors for unknown origins */ }
  }
  return allowed.includes(origin);
}

// ─── Cloudflare Tunnel ───────────────────────────────────────
let tunnelUrl = null;
const tunnelWaiters = []; // tunnel URL 等待队列

function onTunnelReady(url, broadcastAll) {
  tunnelUrl = url;
  console.log(`[tunnel] 公网: ${tunnelUrl}`);
  console.log(`[tunnel] 分享链接: ${tunnelUrl}/?room=你的房间名`);
  // 广播给所有已连接客户端
  if (broadcastAll) broadcastAll(JSON.stringify({ type: 'tunnel-url', url: tunnelUrl }));
  // 通知所有等待者
  tunnelWaiters.forEach(fn => fn(url));
  tunnelWaiters.length = 0;
}

function startTunnel(proto, broadcastAll) {
  const bin = path.join(__dirname, 'cloudflared-windows-amd64.exe');
  if (!fs.existsSync(bin)) { console.log('[tunnel] cloudflared 不存在，跳过'); return; }
  try {
    console.log('[tunnel] 正在启动 Cloudflare Tunnel...');
    const cmd = `"${bin}" tunnel --url ${proto}://localhost:${PORT} --no-autoupdate`;
    const proc = exec(cmd, { cwd: __dirname, windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
    let out = '';
    proc.stdout.on('data', d => {
      out += d;
      const m = out.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (m && !tunnelUrl) { onTunnelReady(m[0], broadcastAll); }
    });
    proc.stderr.on('data', d => {
      const txt = d.toString();
      if (txt.includes('trycloudflare.com')) {
        const m = txt.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
        if (m && !tunnelUrl) { onTunnelReady(m[0], broadcastAll); }
      }
    });
    proc.on('error', (e) => { console.error('[tunnel] cloudflared 启动失败:', e.message); });
    proc.on('exit', (code) => { if (!tunnelUrl) console.error(`[tunnel] cloudflared 退出(code=${code})，公网穿透不可用`); });
    process.once('exit', () => { try { proc.kill(); } catch {} });
  } catch (e) { console.log('[tunnel] 启动失败:', e.message); }
}

// ─── 房间管理 ────────────────────────────────────────────────
const rooms = new Map();

function hashPassword(password, salt) {
  return new Promise(r => crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (_, k) => r(k.toString('hex'))));
}

async function handleJoin(ws, data) {
  const { room, displayName, password, peerId } = data;
  if (!room || !displayName) return ws.send(JSON.stringify({ type: 'error', message: '缺少房间名或显示名' }));

  let rd = rooms.get(room);
  if (rd?.passwordHash) {
    if (!password) return ws.send(JSON.stringify({ type: 'error', message: '此房间需要密码' }));
    const [salt, storedHash] = rd.passwordHash.split(':');
    if (await hashPassword(password, salt) !== storedHash) return ws.send(JSON.stringify({ type: 'error', message: '密码错误' }));
  }
  if (!rd) {
    const salt = password ? crypto.randomBytes(16).toString('hex') : null;
    const passwordHash = password ? await hashPassword(password, salt) : null;
    // 存储为 salt:hash 单字段
    const combinedHash = password ? `${salt}:${passwordHash}` : null;
    rd = { peers: new Map(), passwordHash: combinedHash, hostId: peerId, createdAt: Date.now() };
    rooms.set(room, rd);
  }

  // 房间人数限制
  if (rd.peers.size >= MAX_PEERS_PER_ROOM) {
    return ws.send(JSON.stringify({ type: 'error', message: '房间已满（最多 ' + MAX_PEERS_PER_ROOM + ' 人）' }));
  }

  const isHost = peerId === rd.hostId;
  rd.peers.set(ws, { id: peerId, displayName, joinedAt: Date.now(), isHost });

  const peerList = [];
  rd.peers.forEach((p, c) => {
    if (c !== ws) {
      peerList.push({ id: p.id, displayName: p.displayName, isHost: p.isHost });
      c.send(JSON.stringify({ type: 'peer-joined', peer: { id: peerId, displayName, isHost } }));
    }
  });

  ws.send(JSON.stringify({ type: 'join-ok', peers: peerList, hostId: rd.hostId, tunnelUrl }));
  console.log(`[room:${room}] ${displayName}(${peerId}) 加入${isHost ? ' [主持人]' : ''}，共 ${rd.peers.size} 人`);
}

function relayTo(room, targetId, msg, fromWs) {
  const rd = rooms.get(room);
  if (!rd) return;
  for (const [c, p] of rd.peers) { if (p.id === targetId && c !== fromWs) { c.send(msg); break; } }
}

function handleKick(ws, data) {
  const rd = rooms.get(data.room);
  if (!rd) return;
  const sender = rd.peers.get(ws);
  if (!sender || sender.id !== rd.hostId) return ws.send(JSON.stringify({ type: 'error', message: '仅主持人可踢人' }));
  for (const [c, p] of rd.peers) {
    if (p.id === data.targetId && c !== ws) {
      c.send(JSON.stringify({ type: 'kicked', reason: '主持人已将你移出房间' }));
      c.close(4000, 'kicked');
      break;
    }
  }
}

function removeFromRoom(ws) {
  if (ws._left) return; // 防止 leave 消息和 close 事件双重触发
  ws._left = true;
  for (const [name, rd] of rooms) {
    const peer = rd.peers.get(ws);
    if (!peer) continue;
    rd.peers.delete(ws);
    rd.peers.forEach((_, c) => c.send(JSON.stringify({ type: 'peer-left', peerId: peer.id })));
    console.log(`[room:${name}] ${peer.displayName}(${peer.id}) 离开，剩 ${rd.peers.size} 人`);
    if (peer.id === rd.hostId && rd.peers.size > 0) {
      const [next] = [...rd.peers.values()];
      rd.hostId = next.id;
      rd.peers.forEach((p, c) => { p.isHost = p.id === rd.hostId; c.send(JSON.stringify({ type: 'host-changed', hostId: rd.hostId })); });
      console.log(`[room:${name}] 主持人转让给 ${next.displayName}`);
    }
    if (rd.peers.size === 0) { rooms.delete(name); console.log(`[room:${name}] 已清空`); }
    break;
  }
}

// ─── 主入口 ──────────────────────────────────────────────────
function main() {
  const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');

  // 请求处理器（定义在 main 内部以访问 broadcastAll）
  function requestHandler(req, res) {
    // IP 限速
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    if (isRateLimited(ip)) {
      res.writeHead(429, HEADERS);
      res.end('Too Many Requests');
      return;
    }
    // Tunnel URL API
    if (req.url === '/api/tunnel-url') {
      if (req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json', ...HEADERS });
        res.end(JSON.stringify({ tunnelUrl: tunnelUrl || null }));
        return;
      }
      if (req.method === 'POST') {
        let body = '';
        let oversized = false;
        req.on('data', chunk => {
          body += chunk;
          if (body.length > 1024) { oversized = true; req.destroy(); }
        });
        req.on('end', () => {
          if (oversized) { res.writeHead(413, HEADERS); res.end('Payload Too Large'); return; }
          try {
            const data = JSON.parse(body);
            if (data.url && /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i.test(data.url)) {
              tunnelUrl = data.url;
              console.log(`[tunnel] 公网: ${tunnelUrl}`);
              broadcastAll(JSON.stringify({ type: 'tunnel-url', url: tunnelUrl }));
              res.writeHead(200, { 'Content-Type': 'application/json', ...HEADERS });
              res.end(JSON.stringify({ ok: true }));
            } else {
              res.writeHead(400, HEADERS);
              res.end(JSON.stringify({ ok: false, error: 'invalid url' }));
            }
          } catch {
            res.writeHead(400, HEADERS);
            res.end(JSON.stringify({ ok: false, error: 'invalid json' }));
          }
        });
        return;
      }
    }
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...HEADERS });
      res.end(indexHtml);
    } else {
      res.writeHead(404, HEADERS);
      res.end('Not Found');
    }
  }

  const server = http.createServer(requestHandler);

  // HTTP server 错误处理（端口占用等），避免未捕获 error 事件导致进程崩溃
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`\n  [!] 端口 ${PORT} 已被占用，请关闭占用程序或更换端口（set PORT=8081）`);
    } else {
      console.error('[server] 错误:', e.message);
    }
    process.exit(1);
  });

  const wss = new WebSocketServer({ server, maxPayload: 256 * 1024 });
  // WebSocketServer 错误兜底（如 listen 失败），防止 throw 崩溃进程
  wss.on('error', (e) => {
    console.error('[wss] 错误:', e?.message || e);
  });
  const hbMap = new Map();
  function pong() { this.isAlive = true; }

  // 广播消息给所有已连接的客户端
  function broadcastAll(data) {
    wss.clients.forEach(c => { if (c.readyState === 1) c.send(data); });
  }

  wss.on('connection', (ws, req) => {
    // 全局连接数限制
    if (wss.clients.size > MAX_CONNECTIONS) {
      ws.close(4005, 'server full');
      return;
    }
    // IP 限速
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    if (isRateLimited(ip)) {
      ws.close(4004, 'rate limited');
      return;
    }
    // Origin 校验
    const origin = req.headers.origin;
    if (!isOriginAllowed(origin)) {
      console.log(`[origin] 拒绝非白名单来源: ${origin} (IP: ${ip})`);
      ws.close(4003, 'origin not allowed');
      return;
    }

    ws.isAlive = true;
    hbMap.set(ws, setInterval(() => { if (!ws.isAlive) { ws.terminate(); return; } ws.isAlive = false; ws.ping(); }, HEARTBEAT_INTERVAL));
    ws.on('pong', pong);
    ws.on('message', async raw => {
      if (raw.length > MAX_MSG_SIZE) { console.error('[ws] 消息过大:', raw.length); return; }
      let m; try { m = JSON.parse(raw); } catch (e) { console.error('[ws] JSON 解析失败:', e.message); return; }
      switch (m.type) {
        case 'join': await handleJoin(ws, m); break;
        case 'offer': relayTo(m.room, m.targetId, JSON.stringify({ type: 'offer', fromId: m.fromId, offer: m.offer }), ws); break;
        case 'answer': relayTo(m.room, m.targetId, JSON.stringify({ type: 'answer', fromId: m.fromId, answer: m.answer }), ws); break;
        case 'ice-candidate': relayTo(m.room, m.targetId, JSON.stringify({ type: 'ice-candidate', fromId: m.fromId, candidate: m.candidate }), ws); break;
        case 'kick': handleKick(ws, m); break;
        case 'leave': removeFromRoom(ws); break;
      }
    });
    ws.on('close', () => { clearInterval(hbMap.get(ws)); hbMap.delete(ws); removeFromRoom(ws); });
    ws.on('error', (e) => { console.error('[ws] 连接错误:', e.message); });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  ╔═══════════════════════════════════════════╗`);
    console.log(`  ║   幽灵会议 GhostCall 已启动              ║`);
    console.log(`  ║   http://localhost:${PORT}                  ║`);
    console.log(`  ╚═══════════════════════════════════════════╝\n`);

    // 启动 Cloudflare Tunnel（自动生成公网分享链接）
    const proto = 'http';
    startTunnel(proto, broadcastAll);
  });

  // SIGINT/SIGTERM 优雅关闭
  function gracefulShutdown(signal) {
    console.log(`\n[${signal}] 正在优雅关闭...`);
    wss.clients.forEach(c => { if (c.readyState === 1) c.close(1001, 'server shutting down'); });
    wss.close(() => {
      server.close(() => { console.log(`[${signal}] 已关闭`); process.exit(0); });
    });
    setTimeout(() => { console.log(`[${signal}] 强制退出`); process.exit(1); }, 5000);
  }
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

main();
