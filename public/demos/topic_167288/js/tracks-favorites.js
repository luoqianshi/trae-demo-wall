// ===== 我的追踪/收藏子页面（全局对象 TracksPage / FavoritesPage） =====

// 我的追踪
const TracksPage = {
  render() {
    setTimeout(() => this._load('tracks'), 0)
    return `
      <div class="nav-bar">
        <span class="nav-back" onclick="App.closeSubPage()">‹</span>
        <span class="nav-title">我的追踪</span>
        <span class="nav-right"></span>
      </div>
      <div class="sub-page-content" id="tracksContent">
        <div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">加载中...</div></div>
      </div>
    `
  },
  _load() {
    API.getTracks().then(list => {
      const container = document.getElementById('tracksContent')
      if (!container) return
      if (!list || list.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📍</div><div class="empty-text">暂无追踪标记</div></div>`
        return
      }
      container.innerHTML = this._renderList(list)
    })
  },
  _renderList(list) {
    return list.map(m => `
      <div class="list-item" onclick="App.switchTab('map')">
        <div class="list-item-icon">${this._typeIcon(m.type)}</div>
        <div class="list-item-content">
          <div class="list-item-title">${this._escape(m.title)}</div>
          <div class="list-item-desc">${this._escape(m.address || '')} · ${Util.timeAgo(m.createdAt)}</div>
        </div>
        ${m.isUrgent ? '<span class="tag tag-red">紧急</span>' : ''}
      </div>
    `).join('')
  },
  _typeIcon(type) {
    const map = { rescue: '🆘', adoption: '🏠', place: '🌳', hospital: '🏥', service: '🛎️' }
    return map[type] || '🐾'
  },
  _escape(str) {
    if (!str) return ''
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }
}

// 我的收藏
const FavoritesPage = {
  render() {
    setTimeout(() => this._load(), 0)
    return `
      <div class="nav-bar">
        <span class="nav-back" onclick="App.closeSubPage()">‹</span>
        <span class="nav-title">我的收藏</span>
        <span class="nav-right"></span>
      </div>
      <div class="sub-page-content" id="favsContent">
        <div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">加载中...</div></div>
      </div>
    `
  },
  _load() {
    API.getFavorites().then(list => {
      const container = document.getElementById('favsContent')
      if (!container) return
      if (!list || list.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">⭐</div><div class="empty-text">暂无收藏标记</div></div>`
        return
      }
      container.innerHTML = TracksPage._renderList(list)
    })
  }
}
