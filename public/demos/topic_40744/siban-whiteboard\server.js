import express from 'express'
import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import path from 'path'

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

const PORT = process.env.PORT || 3000

app.use(express.static(path.join(process.cwd(), 'public')))

app.get('/api/room/create', (req, res) => {
  const roomId = 'room-' + Math.random().toString(36).substring(2, 10)
  rooms.set(roomId, {
    id: roomId,
    elements: [],
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000,
    clients: new Set(),
    isPremium: false,
  })
  console.log(`[Server] 创建房间: ${roomId}, 过期时间: ${new Date(rooms.get(roomId).expiresAt)}`)
  res.json({ roomId, expiresAt: rooms.get(roomId).expiresAt })
})

app.get('/api/room/info/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId)
  if (!room) {
    return res.status(404).json({ error: '房间不存在' })
  }
  res.json({ 
    roomId: room.id,
    expiresAt: room.expiresAt,
    clientCount: room.clients.size,
    isPremium: room.isPremium
  })
})

app.get('/api/room/extend/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId)
  if (!room) {
    return res.status(404).json({ error: '房间不存在' })
  }
  room.expiresAt = Date.now() + 60 * 60 * 1000
  console.log(`[Server] 房间 ${room.id} 已续期，新过期时间: ${new Date(room.expiresAt)}`)
  res.json({ expiresAt: room.expiresAt })
})

app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'))
})

const rooms = new Map()

wss.on('connection', (ws, req) => {
  console.log('[Server] 新客户端连接')
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      console.log('[Server] 收到消息:', message.type)
      
      switch (message.type) {
        case 'join': {
          const { roomId } = message
          let room = rooms.get(roomId)
          
          if (!room) {
            room = {
              id: roomId,
              elements: [],
              createdAt: Date.now(),
              expiresAt: Date.now() + 60 * 60 * 1000,
              clients: new Set(),
              isPremium: false,
            }
            rooms.set(roomId, room)
            console.log(`[Server] 创建房间: ${roomId}`)
          }
          
          room.clients.add(ws)
          ws.currentRoom = roomId
          
          const response = {
            type: 'joined',
            roomId,
            elements: room.elements,
            expiresAt: room.expiresAt,
            clientCount: room.clients.size,
          }
          ws.send(JSON.stringify(response))
          console.log(`[Server] 客户端加入房间: ${roomId}, 当前人数: ${room.clients.size}`)
          
          broadcast(roomId, {
            type: 'clientCount',
            count: room.clients.size,
          }, ws)
          break
        }
        
        case 'add': {
          const { roomId, element } = message
          const room = rooms.get(roomId)
          if (!room) return
          
          room.elements.push(element)
          console.log(`[Server] 房间 ${roomId} 添加元素: ${element.type}, 总数: ${room.elements.length}`)
          
          broadcast(roomId, {
            type: 'added',
            element,
          }, ws)
          break
        }
        
        case 'update': {
          const { roomId, id, updates } = message
          const room = rooms.get(roomId)
          if (!room) return
          
          const index = room.elements.findIndex(el => el.id === id)
          if (index !== -1) {
            room.elements[index] = { ...room.elements[index], ...updates }
            console.log(`[Server] 房间 ${roomId} 更新元素: ${id}`)
            
            broadcast(roomId, {
              type: 'updated',
              id,
              updates,
            }, ws)
          }
          break
        }
        
        case 'delete': {
          const { roomId, id } = message
          const room = rooms.get(roomId)
          if (!room) return
          
          room.elements = room.elements.filter(el => el.id !== id)
          console.log(`[Server] 房间 ${roomId} 删除元素: ${id}, 总数: ${room.elements.length}`)
          
          broadcast(roomId, {
            type: 'deleted',
            id,
          }, ws)
          break
        }
        
        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong' }))
          break
        }
      }
    } catch (err) {
      console.error('[Server] 消息处理错误:', err)
    }
  })
  
  ws.on('close', () => {
    const roomId = ws.currentRoom
    if (roomId) {
      const room = rooms.get(roomId)
      if (room) {
        room.clients.delete(ws)
        console.log(`[Server] 客户端离开房间: ${roomId}, 当前人数: ${room.clients.size}`)
        
        broadcast(roomId, {
          type: 'clientCount',
          count: room.clients.size,
        }, null)
        
        if (room.clients.size === 0 && !room.isPremium) {
          setTimeout(() => {
            const currentRoom = rooms.get(roomId)
            if (currentRoom && currentRoom.clients.size === 0) {
              rooms.delete(roomId)
              console.log(`[Server] 房间 ${roomId} 已被清理（无活跃客户端）`)
            }
          }, 5 * 60 * 1000)
        }
      }
    }
    console.log('[Server] 客户端断开连接')
  })
  
  ws.on('error', (err) => {
    console.error('[Server] WebSocket 错误:', err)
  })
})

function broadcast(roomId, message, excludeWs) {
  const room = rooms.get(roomId)
  if (!room) return
  
  room.clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  })
}

setInterval(() => {
  const now = Date.now()
  rooms.forEach((room, roomId) => {
    if (now > room.expiresAt && !room.isPremium) {
      room.elements = []
      room.expiresAt = now + 60 * 60 * 1000
      console.log(`[Server] 房间 ${roomId} 已过期，数据已清空`)
      
      room.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'expired',
            roomId,
            expiresAt: room.expiresAt,
          }))
        }
      })
    }
  })
}, 60 * 1000)

server.listen(PORT, () => {
  console.log(`\n思板协作白板服务器启动成功！`)
  console.log(`HTTP 服务: http://localhost:${PORT}`)
  console.log(`WebSocket 服务: ws://localhost:${PORT}`)
  console.log(`\n免费版房间有效期: 1小时`)
  console.log(`自动清理过期房间: 每分钟检查`)
})
