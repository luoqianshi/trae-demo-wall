/**
 * FlashDrop 闪投 - 服务端 v3.0
 * 支持多人房间传输（最多4人）
 * 功能：多人传输/文件夹/断点续传/P2P/图片压缩/隐私扫描/文件预览/截图传输
 */

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
//  QR Code 生成接口
// ============================================================
app.get('/api/qr', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'url required' });
    const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 1 });
    res.json({ dataUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  统计接口
// ============================================================
const serverStartTime = Date.now();

app.get('/api/stats', (req, res) => {
  let totalPeers = 0;
  for (const room of rooms.values()) {
    totalPeers += room.peers.size;
  }
  res.json({
    rooms: rooms.size,
    peers: totalPeers,
    uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    version: '3.0'
  });
});

// ============================================================
//  房间与 peer 管理
// ============================================================

// 房间列表: roomId -> { peers: Map<ws, {id, name, joinedAt}>, createdAt }
const rooms = new Map();

// 二进制 chunk 待转发映射: ws -> { targetPeerId }
const pendingTransfers = new Map();

// 可用 peerId 池
const PEER_IDS = ['P1', 'P2', 'P3', 'P4'];
const MAX_PEERS = 4;

/**
 * 生成6位随机房间ID
 */
function generateRoomId() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

/**
 * 获取房间内下一个可用的 peerId
 * @param {Map} peers - room.peers
 * @returns {string|null} 可用的 peerId，如果已满返回 null
 */
function getNextPeerId(peers) {
  const usedIds = new Set();
  for (const info of peers.values()) {
    usedIds.add(info.id);
  }
  for (const id of PEER_IDS) {
    if (!usedIds.has(id)) return id;
  }
  return null;
}

/**
 * 获取房间内所有 peer 的信息列表（用于广播）
 * @param {Map} peers - room.peers
 * @returns {Array<{id, name, joinedAt}>}
 */
function getPeersList(peers) {
  const list = [];
  for (const [ws, info] of peers) {
    list.push({ id: info.id, name: info.name || '', joinedAt: info.joinedAt });
  }
  return list;
}

/**
 * 根据 peerId 查找房间内的目标 ws
 * @param {Map} peers - room.peers
 * @param {string} targetPeerId - 目标 peerId
 * @returns {WebSocket|null}
 */
function findPeerByPeerId(peers, targetPeerId) {
  for (const [ws, info] of peers) {
    if (info.id === targetPeerId) return ws;
  }
  return null;
}

/**
 * 获取某个 ws 在房间中的 peer 信息
 * @param {Map} peers - room.peers
 * @param {WebSocket} ws
 * @returns {Object|null}
 */
function getPeerInfo(peers, ws) {
  return peers.get(ws) || null;
}

// ============================================================
//  消息转发工具
// ============================================================

/**
 * 发送 JSON 消息给指定 ws
 * @param {WebSocket} ws
 * @param {Object} msg
 */
function sendJson(ws, msg) {
  if (ws && ws.readyState === 1) {
    ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
}

/**
 * 转发消息给房间内指定的 peer（通过 targetPeerId）
 * @param {WebSocket} ws - 发送者
 * @param {Object} room - 房间对象
 * @param {string} targetPeerId - 目标 peerId
 * @param {Object} msg - 消息
 * @returns {boolean} 是否转发成功
 */
function forwardToPeer(ws, room, targetPeerId, msg) {
  const targetWs = findPeerByPeerId(room.peers, targetPeerId);
  if (targetWs && targetWs.readyState === 1) {
    sendJson(targetWs, msg);
    return true;
  }
  return false;
}

/**
 * 广播消息给房间内所有 peer（排除发送者）
 * @param {Object} room - 房间对象
 * @param {WebSocket} excludeWs - 要排除的 ws
 * @param {Object} msg - 消息
 */
function broadcastToRoom(room, excludeWs, msg) {
  for (const [ws] of room.peers) {
    if (ws !== excludeWs && ws.readyState === 1) {
      sendJson(ws, msg);
    }
  }
}

/**
 * 广播更新后的 peers-list 给房间内所有人
 * @param {Object} room - 房间对象
 * @param {WebSocket} [excludeWs] - 可选，排除某个 ws
 */
function broadcastPeersList(room, excludeWs) {
  const list = getPeersList(room.peers);
  const msg = { type: 'peers-list', peers: list };
  if (excludeWs) {
    broadcastToRoom(room, excludeWs, msg);
  } else {
    for (const [ws] of room.peers) {
      if (ws.readyState === 1) {
        sendJson(ws, msg);
      }
    }
  }
}

// ============================================================
//  WebSocket 连接处理
// ============================================================

wss.on('connection', (ws) => {
  // 当前连接所属房间ID
  let currentRoom = null;

  ws.on('message', (data, isBinary) => {
    // ---- 二进制数据：文件 chunk，根据 pendingTransfers 转发 ----
    if (isBinary) {
      const room = rooms.get(currentRoom);
      if (!room) return;

      // 查找转发目标
      const transferInfo = pendingTransfers.get(ws);
      if (transferInfo) {
        const tp = transferInfo.targetPeerId;
        if (Array.isArray(tp)) {
          // 广播模式：发给所有目标
          for (const peerId of tp) {
            const targetWs = findPeerByPeerId(room.peers, peerId);
            if (targetWs && targetWs.readyState === 1) {
              targetWs.send(data, true);
            }
          }
        } else {
          const targetWs = findPeerByPeerId(room.peers, tp);
          if (targetWs && targetWs.readyState === 1) {
            targetWs.send(data, true);
          }
        }
      } else {
        // 向后兼容：如果没有 pendingTransfer 记录，广播给所有其他 peer
        for (const [peerWs] of room.peers) {
          if (peerWs !== ws && peerWs.readyState === 1) {
            peerWs.send(data, true);
          }
        }
      }
      return;
    }

    // ---- 文本消息：JSON 解析 ----
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (e) {
      return;
    }

    switch (msg.type) {

      // ---- 创建房间：创建者自动加入为 P1 ----
      case 'create-room': {
        if (currentRoom) {
          sendJson(ws, { type: 'error', message: '当前连接已有活跃房间' });
          return;
        }
        const roomId = generateRoomId();
        const peers = new Map();
        peers.set(ws, { id: 'P1', name: msg.name || '设备1', joinedAt: Date.now() });
        currentRoom = roomId;
        rooms.set(roomId, { peers, createdAt: Date.now() });
        sendJson(ws, {
          type: 'room-created',
          roomId,
          peerId: 'P1',
          peers: getPeersList(peers)
        });
        console.log(`[Room ${roomId}] P1 创建房间`);
        break;
      }

      // ---- 加入房间：分配 P2/P3/P4 ----
      case 'join-room': {
        const { roomId } = msg;
        const room = rooms.get(roomId);
        if (!room) {
          sendJson(ws, { type: 'error', message: '房间不存在或已过期' });
          return;
        }
        if (room.peers.has(ws)) {
          sendJson(ws, { type: 'error', message: '你已经在该房间中' });
          return;
        }
        if (room.peers.size >= MAX_PEERS) {
          sendJson(ws, { type: 'error', message: `房间已满（最多${MAX_PEERS}人）` });
          return;
        }
        if (currentRoom) {
          sendJson(ws, { type: 'error', message: '当前连接已加入其他房间' });
          return;
        }

        const peerId = getNextPeerId(room.peers);
        if (!peerId) {
          sendJson(ws, { type: 'error', message: '房间已满' });
          return;
        }

        currentRoom = roomId;
        const peerName = msg.name || `设备${peerId.charAt(1)}`;
        room.peers.set(ws, { id: peerId, name: peerName, joinedAt: Date.now() });

        // 通知加入者：房间信息 + peerId + peers列表
        sendJson(ws, {
          type: 'room-joined',
          roomId,
          peerId,
          peers: getPeersList(room.peers)
        });

        // 广播给房间内其他人：有新 peer 加入
        broadcastToRoom(room, ws, {
          type: 'peer-joined',
          peerId,
          name: peerName
        });

        // 广播最新的 peers-list 给所有人
        broadcastPeersList(room);

        console.log(`[Room ${roomId}] ${peerId} 加入房间（当前 ${room.peers.size}/${MAX_PEERS} 人）`);
        break;
      }

      // ---- 发给特定 peer 的消息 ----
      case 'peer-message': {
        const room = rooms.get(currentRoom);
        if (!room) return;
        const senderInfo = getPeerInfo(room.peers, ws);
        if (!senderInfo) return;
        // 把 senderPeerId 附上，转发给目标
        const forwardMsg = {
          ...msg,
          senderPeerId: senderInfo.id
        };
        forwardToPeer(ws, room, msg.targetPeerId, forwardMsg);
        break;
      }

      // ---- 文件传输：带 targetPeerId 转发 ----
      case 'file-meta': {
        const room = rooms.get(currentRoom);
        if (!room) return;
        const senderInfo = getPeerInfo(room.peers, ws);
        if (!senderInfo) return;

        const forwardMsg = { ...msg, senderPeerId: senderInfo.id };
        let targetPeerId = msg.targetPeerId;
        console.log(`[Room ${currentRoom}] file-meta from ${senderInfo.id}: ${msg.name} target=${targetPeerId || 'broadcast'}, peers=${room.peers.size}`);

        if (targetPeerId) {
          // 指定目标：单播
          pendingTransfers.set(ws, { targetPeerId });
          forwardToPeer(ws, room, targetPeerId, forwardMsg);
        } else {
          // 未指定目标（v2 兼容 / 所有设备）：广播给所有其他 peer
          const targets = [];
          for (const [peerWs, info] of room.peers) {
            if (peerWs !== ws) targets.push(info.id);
          }
          if (targets.length > 0) {
            pendingTransfers.set(ws, { targetPeerId: targets });
            broadcastToRoom(room, ws, forwardMsg);
          }
        }
        break;
      }

      case 'file-accept':
      case 'file-reject':
      case 'file-complete': {
        const room = rooms.get(currentRoom);
        if (!room) return;
        const senderInfo = getPeerInfo(room.peers, ws);
        if (!senderInfo) return;

        // file-complete 时清除 pendingTransfer
        if (msg.type === 'file-complete') {
          pendingTransfers.delete(ws);
        }

        const forwardMsg = { ...msg, senderPeerId: senderInfo.id };
        let targetPeerId = msg.targetPeerId;

        if (targetPeerId) {
          forwardToPeer(ws, room, targetPeerId, forwardMsg);
        } else {
          broadcastToRoom(room, ws, forwardMsg);
        }
        break;
      }

      // ---- 文件夹传输 ----
      case 'folder-meta':
      case 'folder-accept':
      case 'folder-reject':
      case 'folder-file-meta':
      case 'folder-file-accept':
      case 'folder-file-complete': {
        const room = rooms.get(currentRoom);
        if (!room) return;
        const senderInfo = getPeerInfo(room.peers, ws);
        if (!senderInfo) return;

        let targetPeerId = msg.targetPeerId;
        if (!targetPeerId) {
          for (const [peerWs, info] of room.peers) {
            if (peerWs !== ws) { targetPeerId = info.id; break; }
          }
        }
        if (targetPeerId) {
          forwardToPeer(ws, room, targetPeerId, { ...msg, senderPeerId: senderInfo.id });
        }
        break;
      }

      // ---- 传输进度 ----
      case 'transfer-progress': {
        const room = rooms.get(currentRoom);
        if (!room) return;
        const senderInfo = getPeerInfo(room.peers, ws);
        if (!senderInfo) return;

        let targetPeerId = msg.targetPeerId;
        if (!targetPeerId) {
          for (const [peerWs, info] of room.peers) {
            if (peerWs !== ws) { targetPeerId = info.id; break; }
          }
        }
        if (targetPeerId) {
          forwardToPeer(ws, room, targetPeerId, { ...msg, senderPeerId: senderInfo.id });
        }
        break;
      }

      // ---- 截图传输（原 clip-sync） ----
      case 'screen-capture': {
        const room = rooms.get(currentRoom);
        if (!room) return;
        const senderInfo = getPeerInfo(room.peers, ws);
        if (!senderInfo) return;

        let targetPeerId = msg.targetPeerId;
        if (!targetPeerId) {
          for (const [peerWs, info] of room.peers) {
            if (peerWs !== ws) { targetPeerId = info.id; break; }
          }
        }
        if (targetPeerId) {
          forwardToPeer(ws, room, targetPeerId, { ...msg, senderPeerId: senderInfo.id });
        }
        break;
      }

      // ---- 隐私扫描结果 ----
      case 'privacy-result': {
        const room = rooms.get(currentRoom);
        if (!room) return;
        const senderInfo = getPeerInfo(room.peers, ws);
        if (!senderInfo) return;

        let targetPeerId = msg.targetPeerId;
        if (!targetPeerId) {
          for (const [peerWs, info] of room.peers) {
            if (peerWs !== ws) { targetPeerId = info.id; break; }
          }
        }
        if (targetPeerId) {
          forwardToPeer(ws, room, targetPeerId, { ...msg, senderPeerId: senderInfo.id });
        }
        break;
      }

      // ---- WebRTC 信令：带 targetPeerId 转发 ----
      case 'webrtc-offer':
      case 'webrtc-answer':
      case 'webrtc-ice-candidate': {
        const room = rooms.get(currentRoom);
        if (!room) return;
        const senderInfo = getPeerInfo(room.peers, ws);
        if (!senderInfo) return;

        let targetPeerId = msg.targetPeerId;
        if (!targetPeerId) {
          for (const [peerWs, info] of room.peers) {
            if (peerWs !== ws) { targetPeerId = info.id; break; }
          }
        }
        if (targetPeerId) {
          forwardToPeer(ws, room, targetPeerId, { ...msg, senderPeerId: senderInfo.id });
        }
        break;
      }

      // ---- 心跳 ----
      case 'ping':
      case 'pong':
        break;
    }
  });

  // ---- 连接断开处理 ----
  ws.on('close', () => {
    // 清理该 ws 的 pendingTransfer 记录
    pendingTransfers.delete(ws);

    if (!currentRoom || !rooms.has(currentRoom)) return;

    const room = rooms.get(currentRoom);
    const peerInfo = getPeerInfo(room.peers, ws);

    if (!peerInfo) return;

    // 从房间中移除该 peer
    room.peers.delete(ws);

    console.log(`[Room ${currentRoom}] ${peerInfo.id} 断开连接（剩余 ${room.peers.size}/${MAX_PEERS} 人）`);

    if (room.peers.size > 0) {
      // 房间还有人：广播 peer-left + 最新的 peers-list
      broadcastToRoom(room, ws, {
        type: 'peer-left',
        peerId: peerInfo.id
      });
      broadcastPeersList(room);
    } else {
      // 房间无人：删除房间
      rooms.delete(currentRoom);
      console.log(`[Room ${currentRoom}] 所有 peer 已离开，房间已删除`);
    }
  });
});

// ============================================================
//  定时清理过期房间（30分钟无活跃）
// ============================================================
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms) {
    if (now - room.createdAt > 30 * 60 * 1000) {
      for (const [ws] of room.peers) {
        try { ws.close(); } catch (e) { /* 忽略关闭错误 */ }
      }
      rooms.delete(roomId);
      console.log(`[Room ${roomId}] 已过期，自动清理`);
    }
  }
}, 60 * 1000);

// ============================================================
//  启动服务器
// ============================================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`
╔═══════════════════════════════════════════════╗
║         FlashDrop 闪投 v3.0 已启动          ║
╠═══════════════════════════════════════════════╣
║  本地访问: http://localhost:${PORT}               ║
║  局域网访问: http://${ip}:${PORT}        ║
║  房间容量: 最多 ${MAX_PEERS} 人                        ║
╠═══════════════════════════════════════════════╣
║  功能:                                        ║
║   - 多人传输（最多4人）                        ║
║   - 文件夹传输                                 ║
║   - 断点续传                                   ║
║   - P2P直连 (WebRTC)                           ║
║   - 图片压缩                                   ║
║   - 隐私扫描                                   ║
║   - 文件预览                                   ║
║   - 截图传输                                   ║
╠═══════════════════════════════════════════════╣
║  API: GET /api/stats  (统计信息)              ║
║  API: GET /api/qr     (二维码生成)            ║
╚═══════════════════════════════════════════════╝
  `);
});

/**
 * 获取本机局域网 IP
 */
function getLocalIP() {
  const os = require('os');
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}
