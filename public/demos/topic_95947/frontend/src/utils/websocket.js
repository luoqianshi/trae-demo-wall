class WebSocketService {
  constructor() {
    this.socket = null
    this.url = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/default'
    this.reconnectInterval = 5000
    this.maxReconnectAttempts = 3
    this.reconnectAttempts = 0
    this.reconnectTimer = null
    this.manuallyClosed = false
    this.listeners = {}
    this.connected = false
  }

  connect() {
    if (this.socket && [WebSocket.CONNECTING, WebSocket.OPEN].includes(this.socket.readyState)) {
      return
    }

    this.manuallyClosed = false

    if (this.socket) {
      this.socket.close()
    }

    this.socket = new WebSocket(this.url)

    this.socket.onopen = () => {
      console.log('WebSocket connected')
      this.connected = true
      this.reconnectAttempts = 0
      this.notify('connected', { status: 'connected' })
      this.startPing()
    }

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.notify('error', { error, retryable: this.reconnectAttempts < this.maxReconnectAttempts })
    }

    this.socket.onclose = () => {
      console.warn('WebSocket disconnected')
      this.connected = false
      clearInterval(this.pingInterval)
      this.notify('disconnected', { status: 'disconnected', retryable: !this.manuallyClosed })
      if (this.manuallyClosed) return
      this.scheduleReconnect()
    }
  }

  disconnect() {
    this.manuallyClosed = true
    clearTimeout(this.reconnectTimer)
    clearInterval(this.pingInterval)
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  startPing() {
    clearInterval(this.pingInterval)
    this.pingInterval = setInterval(() => {
      if (this.connected && this.socket) {
        this.send({ type: 'ping' })
      }
    }, 30000)
  }

  scheduleReconnect() {
    if (this.reconnectTimer || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('WebSocket reconnect stopped: backend is unavailable or max attempts reached')
        this.notify('reconnect_stopped', { status: 'stopped' })
      }
      return
    }

    this.reconnectAttempts += 1
    const delay = this.reconnectInterval * this.reconnectAttempts
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      console.log(`Reconnecting WebSocket... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      this.connect()
    }, delay)
  }

  send(message) {
    if (this.connected && this.socket) {
      this.socket.send(JSON.stringify(message))
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'order_created':
        this.notify('order_created', message.data)
        break
      case 'order_status_changed':
        this.notify('order_status_changed', message.data)
        break
      case 'inventory_alert':
        this.notify('inventory_alert', message.data)
        break
      case 'member_warning':
        this.notify('member_warning', message.data)
        break
      case 'marketing_reminder':
        this.notify('marketing_reminder', message.data)
        break
      case 'pong':
        break
      default:
        this.notify('message', message)
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      )
    }
  }

  notify(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in listener:', error)
        }
      })
    }
  }
}

const websocketService = new WebSocketService()

export default websocketService
