// ===== 聊天模块（全局对象 ChatPage） =====
const ChatPage = {
  currentOtherId: null,   // 当前 1v1 聊天的对方 ID
  pollInterval: null,     // 轮询定时器
  lastMsgTime: 0,         // 已加载消息中最新一条的时间戳
  lastCount: 0,           // 已加载消息条数
  otherName: '消息',      // 对方昵称（用于标题）
  // 分页状态
  page: 1,                // 当前已加载的页码（1 = 最近一页）
  hasMore: true,          // 是否还有更早的历史可加载
  loadingMore: false,     // 是否正在加载更多（防止重复触发）
  loadedMessages: [],     // 已加载的消息（按时间正序，旧→新）

  // ===== 会话列表子页面 =====
  renderConversations() {
    // 延迟加载，确保容器已挂载到 DOM
    setTimeout(() => this._loadConversations(), 0)
    return `
      <div class="nav-bar">
        <span class="nav-back" onclick="App.closeSubPage()">‹</span>
        <span class="nav-title">消息</span>
        <span class="nav-right"></span>
      </div>
      <div class="sub-page-content" id="convWrap">
        <div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">加载中...</div></div>
      </div>
    `
  },

  // 加载会话列表
  _loadConversations() {
    API.getConversations().then(list => {
      const wrap = document.getElementById('convWrap')
      if (!wrap) return
      if (!list || list.length === 0) {
        wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><div class="empty-text">还没有消息</div></div>`
        return
      }
      const html = '<div class="chat-conv-list">' + list.map(c => {
        // 图片消息预览显示为 [图片]
        let preview = c.lastMessage || ''
        if (typeof preview === 'string' && preview.indexOf('data:image') === 0) preview = '[图片]'
        // 未读数超过 99 显示 99+
        const unreadText = c.unread > 99 ? '99+' : c.unread
        return `
          <div class="chat-conv-item" onclick="ChatPage.open('${c.otherId}')">
            <div class="chat-conv-avatar">${c.otherAvatar || '🐾'}</div>
            <div class="chat-conv-info">
              <div class="chat-conv-top">
                <div class="chat-conv-name">${this._escape(c.otherName)}</div>
                <div class="chat-conv-time">${Util.timeAgo(c.lastTime)}</div>
              </div>
              <div class="chat-conv-bottom">
                <div class="chat-conv-preview">${this._escape(preview)}</div>
                ${c.unread > 0 ? `<div class="chat-conv-unread">${unreadText}</div>` : ''}
              </div>
            </div>
          </div>`
      }).join('') + '</div>'
      wrap.innerHTML = html
    })
  },

  // 打开 1v1 聊天
  open(otherId) {
    App.openSubPage(() => this.render(otherId))
  },

  // ===== 1v1 聊天子页面 =====
  render(otherId) {
    // 清理上一次的轮询
    this._clearPoll()
    this.currentOtherId = otherId
    this.lastMsgTime = 0
    this.lastCount = 0
    // 重置分页状态
    this.page = 1
    this.hasMore = true
    this.loadingMore = false
    this.loadedMessages = []

    // 查找对方昵称
    const other = Store.findById('users', otherId)
    this.otherName = other ? other.nickname : '聊天'

    // 延迟加载历史 + 标记已读 + 启动轮询 + 绑定滚动加载
    setTimeout(() => {
      this._loadHistory(otherId, true)
      API.markRead(otherId)
      this.pollInterval = setInterval(() => this._pollNew(otherId), 5000)
      // 滚动到顶部时加载更早的历史
      const box = document.getElementById('chatMessages')
      if (box) {
        box.addEventListener('scroll', () => this._onScroll(otherId))
      }
    }, 0)

    return `
      <div class="nav-bar">
        <span class="nav-back" onclick="ChatPage._back()">‹</span>
        <span class="nav-title">${this._escape(this.otherName)}</span>
        <span class="nav-right"></span>
      </div>
      <div class="chat-messages" id="chatMessages">
        <div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">加载中...</div></div>
      </div>
      <div class="chat-input-bar">
        <input class="chat-input" id="chatInput" placeholder="输入消息..." autocomplete="off"
               onkeydown="if(event.key==='Enter'){event.preventDefault();ChatPage._send()}" />
        <span class="chat-img-btn" onclick="document.getElementById('chatImgInput').click()">📷</span>
        <input type="file" id="chatImgInput" accept="image/*" style="display:none"
               onchange="ChatPage._onImgPick(this)" />
        <button class="chat-send-btn" onclick="ChatPage._send()">发送</button>
      </div>
    `
  },

  // 返回（清理轮询）
  _back() {
    this._clearPoll()
    App.closeSubPage()
  },

  // 清理轮询定时器
  _clearPoll() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  },

  // 加载第 1 页历史并渲染
  _loadHistory(otherId, scroll) {
    this.page = 1
    this.hasMore = true
    this.loadingMore = false
    this.loadedMessages = []
    API.getChatHistory(otherId, 1).then(res => {
      const box = document.getElementById('chatMessages')
      if (!box) return
      const list = (res && res.list) || []
      this.hasMore = !!(res && res.hasMore)
      const me = API.getCurrentUser()
      const other = Store.findById('users', otherId)
      const otherAvatar = other ? (other.avatar || '🐾') : '🐾'
      const myAvatar = me.avatar || '🐾'

      if (list.length === 0) {
        box.innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><div class="empty-text">开始聊天吧</div></div>`
        this.lastCount = 0
        this.lastMsgTime = 0
        return
      }

      // 记录最新消息时间与数量
      this.loadedMessages = list
      const newest = list[list.length - 1]
      this.lastMsgTime = newest.createdAt
      this.lastCount = list.length

      // 渲染时临时占用 loadingMore，避免 innerHTML 重置触发滚动加载
      this.loadingMore = true
      box.innerHTML = this._renderWrap(list, me.id, myAvatar, otherAvatar)
      if (scroll) this._scrollToBottom()
      this.loadingMore = false
    })
  },

  // 滚动监听：接近顶部时加载更早的历史
  _onScroll(otherId) {
    const box = document.getElementById('chatMessages')
    if (!box) return
    if (box.scrollTop < 30 && this.hasMore && !this.loadingMore && this.loadedMessages.length > 0) {
      this._loadMore(otherId)
    }
  },

  // 加载下一页（更早的历史），插入到列表顶部
  _loadMore(otherId) {
    if (this.loadingMore || !this.hasMore) return
    this.loadingMore = true
    this._setLoadMoreHint('加载中...')
    const nextPage = this.page + 1
    API.getChatHistory(otherId, nextPage).then(res => {
      const box = document.getElementById('chatMessages')
      if (!box) { this.loadingMore = false; return }
      const olderList = (res && res.list) || []
      this.hasMore = !!(res && res.hasMore)
      if (olderList.length === 0) {
        this.hasMore = false
        this.loadingMore = false
        this._setLoadMoreHint('没有更多消息了')
        return
      }
      this.page = nextPage
      // 记录原滚动位置，渲染后恢复，避免视图跳动
      const prevScrollHeight = box.scrollHeight
      const prevScrollTop = box.scrollTop
      // 更早的消息前置到已加载列表（保持旧→新顺序）
      this.loadedMessages = olderList.concat(this.loadedMessages)
      const me = API.getCurrentUser()
      const other = Store.findById('users', otherId)
      const otherAvatar = other ? (other.avatar || '🐾') : '🐾'
      const myAvatar = me.avatar || '🐾'
      box.innerHTML = this._renderWrap(this.loadedMessages, me.id, myAvatar, otherAvatar)
      // 恢复滚动位置：原位置 + 新增内容高度
      box.scrollTop = prevScrollTop + (box.scrollHeight - prevScrollHeight)
      // loadingMore 最后释放，防止 innerHTML 重置时误触发再次加载
      this.loadingMore = false
    }).catch(() => {
      this.loadingMore = false
      this._setLoadMoreHint(this.hasMore ? '上拉加载更多' : '没有更多消息了')
    })
  },

  // 更新"加载更多"提示文案
  _setLoadMoreHint(text) {
    const hint = document.getElementById('chatLoadMore')
    if (hint) hint.textContent = text
  },

  // 渲染整个消息区（含顶部"加载更多"提示）
  _renderWrap(list, myId, myAvatar, otherAvatar) {
    const hintText = this.hasMore ? '上拉加载更多' : '没有更多消息了'
    const hint = `<div class="chat-load-more" id="chatLoadMore">${hintText}</div>`
    return hint + this._renderMessages(list, myId, myAvatar, otherAvatar)
  },

  // 轮询拉取新消息（只追加新消息，不全量重新渲染；按 createdAt 去重）
  _pollNew(otherId) {
    const box = document.getElementById('chatMessages')
    if (!box) { // 页面已离开，清理
      this._clearPoll()
      return
    }
    API.getChatHistory(otherId, 1).then(res => {
      if (!res || !res.list || res.list.length === 0) return
      const list = res.list
      const newest = list[list.length - 1]
      // 没有新消息则跳过
      if (this.lastCount > 0 && newest.createdAt <= this.lastMsgTime) return

      const me = API.getCurrentUser()
      const other = Store.findById('users', otherId)
      const otherAvatar = other ? (other.avatar || '🐾') : '🐾'
      const myAvatar = me.avatar || '🐾'

      // 之前是空状态：直接全量渲染
      if (this.loadedMessages.length === 0) {
        this.loadingMore = true // 临时占用，避免 innerHTML 重置触发滚动加载
        this.loadedMessages = list
        this.lastMsgTime = newest.createdAt
        this.lastCount = list.length
        this.hasMore = !!res.hasMore
        box.innerHTML = this._renderWrap(list, me.id, myAvatar, otherAvatar)
        this._scrollToBottom()
        this.loadingMore = false
        API.markRead(otherId)
        return
      }

      // 按 createdAt 去重，过滤出真正的新消息
      const prevLastTime = this.lastMsgTime
      const newMsgs = list.filter(m => m.createdAt > this.lastMsgTime)
      if (newMsgs.length === 0) return
      this.loadedMessages = this.loadedMessages.concat(newMsgs)
      this.lastMsgTime = newest.createdAt
      this.lastCount = this.loadedMessages.length
      // 只追加新消息的 HTML（用上一条最新消息的时间作为时间分隔判断基准）
      const appendHtml = this._renderMessages(newMsgs, me.id, myAvatar, otherAvatar, prevLastTime)
      box.insertAdjacentHTML('beforeend', appendHtml)
      this._scrollToBottom()
      // 收到新消息标记已读
      API.markRead(otherId)
    })
  },

  // 渲染消息列表（含时间分隔）
  // prevTime: 可选，上一条消息的 createdAt，用于判断首条消息是否需要时间分隔
  _renderMessages(list, myId, myAvatar, otherAvatar, prevTime) {
    let html = ''
    let lastTime = prevTime || 0
    list.forEach(m => {
      // 与上一条间隔超过 5 分钟则显示时间分隔
      if (lastTime === 0 || (m.createdAt - lastTime) > 5 * 60 * 1000) {
        html += `<div class="chat-time-sep"><span>${this._formatMsgTime(m.createdAt)}</span></div>`
      }
      lastTime = m.createdAt
      const isSelf = m.fromId === myId
      const avatar = isSelf ? myAvatar : otherAvatar
      let content = ''
      if (m.type === 'image') {
        content = `<img class="chat-msg-img" src="${m.content}" onclick="ChatPage._previewImage('${this._escape(m.content)}')" />`
      } else {
        content = `<div class="chat-bubble">${this._escape(m.content)}</div>`
      }
      html += `
        <div class="chat-msg ${isSelf ? 'self' : 'other'}">
          <div class="chat-msg-avatar">${avatar}</div>
          ${content}
        </div>`
    })
    return html
  },

  // 发送文本消息
  _send() {
    const input = document.getElementById('chatInput')
    if (!input) return
    const text = input.value.trim()
    if (!text) return
    const otherId = this.currentOtherId
    input.value = ''
    API.sendMessage(otherId, text, 'text').then(() => {
      this._loadHistory(otherId, true)
    })
  },

  // 选择图片发送
  _onImgPick(input) {
    const file = input.files && input.files[0]
    if (!file) return
    input.value = '' // 重置以便重复选择同一文件
    Util.showLoading('发送中...')
    Util.compressImage(file).then(dataUrl => {
      Util.hideLoading()
      API.sendMessage(this.currentOtherId, dataUrl, 'image').then(() => {
        this._loadHistory(this.currentOtherId, true)
      })
    }).catch(() => {
      Util.hideLoading()
      Util.toast('图片处理失败')
    })
  },

  // 预览大图
  _previewImage(src) {
    const layer = document.createElement('div')
    layer.className = 'chat-img-preview'
    layer.innerHTML = `<img src="${src}" />`
    layer.addEventListener('click', () => layer.remove())
    document.body.appendChild(layer)
  },

  // 滚动到底部
  _scrollToBottom() {
    const box = document.getElementById('chatMessages')
    if (box) box.scrollTop = box.scrollHeight
  },

  // 格式化消息时间（今天显示时分，昨天显示"昨天 时分"，否则 MM-DD HH:MM）
  _formatMsgTime(ts) {
    const d = new Date(ts)
    const now = new Date()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const sameDay = d.toDateString() === now.toDateString()
    if (sameDay) return hh + ':' + mm
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return '昨天 ' + hh + ':' + mm
    return (d.getMonth() + 1) + '-' + d.getDate() + ' ' + hh + ':' + mm
  },

  // HTML 转义，防止消息内容破坏结构
  _escape(str) {
    if (str == null) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
}
