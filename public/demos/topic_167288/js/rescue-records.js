// ===== 我的救助记录子页面（全局对象 RescueRecordsPage） =====
const RescueRecordsPage = {
  render() {
    setTimeout(() => this._load(), 0)
    return `
      <div class="nav-bar">
        <span class="nav-back" onclick="App.closeSubPage()">‹</span>
        <span class="nav-title">我的救助记录</span>
        <span class="nav-right"></span>
      </div>
      <div class="sub-page-content" id="rescueRecordsContent">
        <div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">加载中...</div></div>
      </div>
    `
  },

  _load() {
    API.getMyRescueRecords().then(list => {
      const container = document.getElementById('rescueRecordsContent')
      if (!container) return
      if (!list || list.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">🚑</div><div class="empty-text">暂无救助记录</div></div>`
        return
      }
      const statusMap = {
        rescuing: { label: '救助中', class: 'tag-orange' },
        resolved: { label: '已救助', class: 'tag-green' }
      }
      container.innerHTML = list.map(record => {
        const status = statusMap[record.status] || { label: record.status, class: 'tag-gray' }
        return `
          <div class="card card-tap" style="margin:12px 16px;" onclick="App.openSubPage(()=>RescuePage.render('${record.markerId}'))">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;background:var(--accent-bg);border-radius:12px;flex-shrink:0;">🚑</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:15px;font-weight:600;">${this._escape(record.markerTitle)}</div>
                <div style="font-size:13px;color:var(--text-3);margin-top:2px;">${Util.timeAgo(record.createdAt)}</div>
              </div>
              <span class="tag ${status.class}">${status.label}</span>
            </div>
          </div>
        `
      }).join('')
    })
  },

  _escape(str) {
    if (!str) return ''
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }
}
