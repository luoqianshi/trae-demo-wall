/** WebSocket 客户端：连接后端，分发事件到 store。 */
import type { WsEvent } from '../types'

type Handler = (event: WsEvent) => void

let ws: WebSocket | null = null
let currentProjectId: string | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let shouldReconnect = false
const handlers: Set<Handler> = new Set()

export function connectWs(projectId: string, onEvent: Handler) {
  disconnectWs()
  currentProjectId = projectId
  shouldReconnect = true
  handlers.clear()
  handlers.add(onEvent)
  doConnect()
}

function doConnect() {
  if (!currentProjectId) return

  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  // 统一走 location.host，开发环境由 Vite 代理转发
  const url = `${protocol}//${location.host}/api/ws/${currentProjectId}`
  ws = new WebSocket(url)

  ws.onopen = () => {
    console.log('WS 已连接:', currentProjectId)
  }

  ws.onmessage = (ev) => {
    try {
      const data: WsEvent = JSON.parse(ev.data)
      handlers.forEach(h => h(data))
    } catch (e) {
      console.error('WS 消息解析失败', e)
    }
  }

  ws.onclose = () => {
    console.log('WS 关闭')
    ws = null
    if (shouldReconnect && currentProjectId) {
      reconnectTimer = setTimeout(doConnect, 2000)
    }
  }

  ws.onerror = (e) => {
    console.error('WS 错误', e)
  }
}

export function disconnectWs() {
  shouldReconnect = false
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (ws) {
    ws.close()
    ws = null
  }
  currentProjectId = null
  handlers.clear()
}
