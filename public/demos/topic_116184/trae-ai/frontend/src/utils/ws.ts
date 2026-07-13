import logger from './logger'

// STOMP 帧命令常量
const COMMAND_CONNECT = 'CONNECT'
const COMMAND_CONNECTED = 'CONNECTED'
const COMMAND_SUBSCRIBE = 'SUBSCRIBE'
const COMMAND_UNSUBSCRIBE = 'UNSUBSCRIBE'
const COMMAND_SEND = 'SEND'
const COMMAND_MESSAGE = 'MESSAGE'
const COMMAND_DISCONNECT = 'DISCONNECT'
const COMMAND_ERROR = 'ERROR'
const COMMAND_RECEIPT = 'RECEIPT'

// STOMP 帧结束符
const NULL_BYTE = '\u0000'
// 换行符
const LINE_FEED = '\n'

// 订阅回调函数类型
type SubscriptionCallback = (message: StompMessage) => void

// 订阅记录
interface Subscription {
  // 订阅ID（由客户端生成，用于 UNSUBSCRIBE）
  id: string
  // 目标主题（如 /topic/consultation/123）
  destination: string
  // 消息回调
  callback: SubscriptionCallback
}

// STOMP MESSAGE 帧解析后的结构
interface StompMessage {
  // 订阅ID
  subscription: string
  // 消息ID（服务端生成）
  messageId: string
  // 目标主题
  destination: string
  // 消息正文（JSON 字符串或文本）
  body: string
}

// 连接状态：IDLE 空闲 / CONNECTING 连接中 / CONNECTED 已连接 / CLOSED 已关闭
type ConnectionState = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'CLOSED'

// WebSocket 服务地址（直连后端，不走 vite 代理）
const WS_BASE_URL = 'ws://localhost:8080/ws'

// 单例 WebSocket 实例
let socket: WebSocket | null = null

// 当前连接状态
let state: ConnectionState = 'IDLE'

// 所有活跃订阅
const subscriptions = new Map<string, Subscription>()

// 订阅ID自增计数器
let subscriptionIdSeq = 0

// 连接成功回调集合
const connectCallbacks = new Set<() => void>()

// 连接错误回调集合
const errorCallbacks = new Set<(message: string) => void>()

/**
 * 将 STOMP 帧序列化为字符串.
 * <p>
 * STOMP 帧格式：COMMAND\nheader1:value1\nheader2:value2\n\nbody\u0000
 * </p>
 *
 * @param command 命令
 * @param headers 头部键值对
 * @param body    正文（可为空）
 * @returns 序列化后的帧字符串
 */
const serializeFrame = (
  command: string,
  headers: Record<string, string>,
  body = ''
): string => {
  const headerLines = Object.entries(headers)
    .map(([key, value]) => `${key}:${value}`)
    .join(LINE_FEED)
  return `${command}${LINE_FEED}${headerLines}${LINE_FEED}${LINE_FEED}${body}${NULL_BYTE}`
}

/**
 * 从原始字符串解析 STOMP 帧.
 * <p>
 * 服务端可能一次推送多帧，按 NULL_BYTE 分隔逐帧解析。
 * </p>
 *
 * @param raw 原始数据
 * @returns 解析出的帧数组
 */
const parseFrames = (raw: string): Array<{
  command: string
  headers: Record<string, string>
  body: string
}> => {
  const frames: Array<{ command: string; headers: Record<string, string>; body: string }> = []

  // 按 NULL_BYTE 分隔多帧；末尾可能为空字符串
  const segments = raw.split(NULL_BYTE)
  for (const segment of segments) {
    if (segment === '') {
      continue
    }
    const lines = segment.split(LINE_FEED)
    if (lines.length === 0) {
      continue
    }

    const command = lines[0]
    if (command === '') {
      continue
    }

    const headers: Record<string, string> = {}
    let lineIndex = 1
    // 头部行直到遇到空行
    while (lineIndex < lines.length && lines[lineIndex] !== '') {
      const line = lines[lineIndex]
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex)
        const value = line.substring(colonIndex + 1)
        headers[key] = value
      }
      lineIndex += 1
    }

    // 跳过空行，剩余部分为正文
    const body = lines.slice(lineIndex + 1).join(LINE_FEED)
    frames.push({ command, headers, body })
  }

  return frames
}

/**
 * 处理收到的单个 STOMP 帧.
 *
 * @param frame 解析后的帧
 */
const handleFrame = (frame: { command: string; headers: Record<string, string>; body: string }): void => {
  const { command, headers, body } = frame

  if (command === COMMAND_CONNECTED) {
    state = 'CONNECTED'
    logger.info('STOMP 连接已建立')
    // 通知所有等待连接的回调
    connectCallbacks.forEach((callback) => callback())
    return
  }

  if (command === COMMAND_MESSAGE) {
    const subscriptionId = headers['subscription']
    const subscription = subscriptions.get(subscriptionId)
    if (subscription) {
      const message: StompMessage = {
        subscription: subscriptionId,
        messageId: headers['message-id'] ?? '',
        destination: headers['destination'] ?? subscription.destination,
        body
      }
      subscription.callback(message)
    }
    return
  }

  if (command === COMMAND_ERROR) {
    const message = headers['message'] ?? body ?? '未知错误'
    logger.error('STOMP 错误帧', message)
    errorCallbacks.forEach((callback) => callback(message))
    return
  }

  if (command === COMMAND_RECEIPT) {
    // 收据帧，仅作日志记录，无需特殊处理
    logger.info('STOMP 收到回执', headers['receipt-id'] ?? '')
    return
  }

  // 其他命令（如 DISCONNECT 服务端确认）忽略
  logger.info('STOMP 收到未处理命令', command)
}

/**
 * 建立 WebSocket 连接并发送 STOMP CONNECT 帧.
 * <p>
 * 若已连接则直接 resolve；若正在连接则等待连接完成后触发回调。
 * </p>
 *
 * @param token JWT Token，作为查询参数传递以完成握手鉴权
 * @returns 连接成功时 resolve，失败时 reject
 */
export const connect = (token: string): Promise<void> => {
  if (state === 'CONNECTED' && socket && socket.readyState === WebSocket.OPEN) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const onConnected = (): void => {
      resolve()
    }
    const onError = (message: string): void => {
      reject(new Error(message))
    }

    connectCallbacks.add(onConnected)
    errorCallbacks.add(onError)

    // 使用 URL 构造查询字符串，避免字符串拼接（规范第 17 条）
    const url = new URL(`${WS_BASE_URL}`)
    url.searchParams.set('token', token)

    state = 'CONNECTING'
    try {
      socket = new WebSocket(url.toString())
    } catch (e) {
      state = 'CLOSED'
      logger.error('WebSocket 创建失败', e)
      reject(e instanceof Error ? e : new Error('WebSocket 创建失败'))
      return
    }

    socket.onopen = (): void => {
      // 发送 STOMP CONNECT 帧
      const connectFrame = serializeFrame(COMMAND_CONNECT, {
        'accept-version': '1.2',
        host: 'localhost'
      })
      socket?.send(connectFrame)
    }

    socket.onmessage = (event: MessageEvent): void => {
      const frames = parseFrames(event.data as string)
      frames.forEach((frame) => handleFrame(frame))
    }

    socket.onerror = (): void => {
      logger.error('WebSocket 连接发生错误')
      onError('WebSocket 连接发生错误，请检查网络或后端服务')
    }

    socket.onclose = (): void => {
      const wasConnected = state === 'CONNECTED'
      state = 'CLOSED'
      logger.info('WebSocket 连接已关闭')
      if (!wasConnected) {
        onError('WebSocket 连接已关闭，未能建立 STOMP 会话')
      }
      // 清理回调集合，避免内存泄漏
      connectCallbacks.delete(onConnected)
      errorCallbacks.delete(onError)
    }
  })
}

/**
 * 订阅 STOMP 主题.
 * <p>
 * 必须在连接建立后调用。返回订阅ID，可用于取消订阅。
 * </p>
 *
 * @param destination 目标主题（如 /topic/consultation/123）
 * @param callback    收到消息时的回调
 * @returns 订阅ID
 */
export const subscribe = (destination: string, callback: SubscriptionCallback): string => {
  if (state !== 'CONNECTED' || !socket || socket.readyState !== WebSocket.OPEN) {
    throw new Error('STOMP 未连接，无法订阅主题')
  }

  subscriptionIdSeq += 1
  const subId = `sub-${subscriptionIdSeq}`

  subscriptions.set(subId, { id: subId, destination, callback })

  const subscribeFrame = serializeFrame(COMMAND_SUBSCRIBE, {
    id: subId,
    destination,
    ack: 'auto'
  })
  socket.send(subscribeFrame)

  logger.info('已订阅 STOMP 主题', destination)
  return subId
}

/**
 * 取消订阅.
 *
 * @param subscriptionId 订阅ID（由 subscribe 返回）
 */
export const unsubscribe = (subscriptionId: string): void => {
  if (state !== 'CONNECTED' || !socket || socket.readyState !== WebSocket.OPEN) {
    subscriptions.delete(subscriptionId)
    return
  }

  const unsubscribeFrame = serializeFrame(COMMAND_UNSUBSCRIBE, {
    id: subscriptionId
  })
  socket.send(unsubscribeFrame)
  subscriptions.delete(subscriptionId)
  logger.info('已取消订阅', subscriptionId)
}

/**
 * 发送消息到服务端应用目的地.
 * <p>
 * 后端配置应用前缀为 /app，故 destination 通常以 /app 开头。
 * </p>
 *
 * @param destination 目的地（如 /app/chat.sendMessage）
 * @param message     消息正文（字符串，通常为 JSON）
 */
export const send = (destination: string, message: string): void => {
  if (state !== 'CONNECTED' || !socket || socket.readyState !== WebSocket.OPEN) {
    throw new Error('STOMP 未连接，无法发送消息')
  }

  const sendFrame = serializeFrame(
    COMMAND_SEND,
    { destination, 'content-type': 'application/json' },
    message
  )
  socket.send(sendFrame)
}

/**
 * 断开 STOMP 连接并关闭 WebSocket.
 */
export const disconnect = (): void => {
  if (socket && state === 'CONNECTED' && socket.readyState === WebSocket.OPEN) {
    const disconnectFrame = serializeFrame(COMMAND_DISCONNECT, {
      receipt: 'disconnect-receipt'
    })
    try {
      socket.send(disconnectFrame)
    } catch (e) {
      logger.error('发送 DISCONNECT 帧失败', e)
    }
  }

  subscriptions.clear()
  connectCallbacks.clear()
  errorCallbacks.clear()

  if (socket) {
    try {
      socket.close()
    } catch (e) {
      logger.error('关闭 WebSocket 失败', e)
    }
    socket = null
  }
  state = 'IDLE'
  logger.info('STOMP 连接已主动断开')
}

/**
 * 获取当前连接状态.
 *
 * @returns 连接状态字符串
 */
export const getConnectionState = (): ConnectionState => {
  return state
}

export default {
  connect,
  subscribe,
  unsubscribe,
  send,
  disconnect,
  getConnectionState
}
