require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { initDatabase } = require('../config/database');
const { success, error } = require('../common/utils');

const userService = require('../services/user-service/routes');
const navigationService = require('../services/navigation-service/routes');
const aiVisionService = require('../services/ai-vision-service/routes');
const guardianService = require('../services/guardian-service/routes');
const communityService = require('../services/community-service/routes');
const messageService = require('../services/message-service/routes');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

initDatabase();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', (req, res) => {
  res.json(success({ status: 'ok', service: 'tongban-gateway', time: new Date().toISOString() }));
});

app.use('/api/user', userService);
app.use('/api/navigation', navigationService);
app.use('/api/ai', aiVisionService);
app.use('/api/guardian', guardianService);
app.use('/api/community', communityService);
app.use('/api/message', messageService);

app.use('/uploads', express.static(require('path').join(__dirname, '..', 'data', 'uploads')));

app.use((req, res) => {
  res.status(404).json(error(404, '接口不存在'));
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json(error(500, '服务器内部错误'));
});

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server, path: '/ws' });

const wsClients = new Map();

wss.on('connection', (ws, req) => {
  const userId = req.url.split('?')[1]?.split('=')[1];
  if (userId) {
    wsClients.set(userId, ws);
    console.log(`WebSocket 连接: ${userId}`);
  }

  ws.on('close', () => {
    if (userId) {
      wsClients.delete(userId);
      console.log(`WebSocket 断开: ${userId}`);
    }
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch (e) {}
  });
});

function sendToUser(userId, message) {
  const ws = wsClients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    return true;
  }
  return false;
}

function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

global.sendToUser = sendToUser;
global.broadcast = broadcast;

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║      瞳伴后端服务启动成功                           ║
║      API地址: http://localhost:${PORT}              ║
║      WebSocket: ws://localhost:${PORT}/ws          ║
║      健康检查: http://localhost:${PORT}/health      ║
╚══════════════════════════════════════════════════╝
  `);
});
