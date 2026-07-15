// ===== 我的领养申请子页面（全局对象 ApplicationsPage） =====
const ApplicationsPage = {
  render() {
    setTimeout(() => this._load(), 0)
    return `
      <div class="nav-bar">
        <span class="nav-back" onclick="App.closeSubPage()">‹</span>
        <span class="nav-title">我的领养申请</span>
        <span class="nav-right"></span>
      </div>
      <div class="sub-page-content" id="appsContent">
        <div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">加载中...</div></div>
      </div>
    `
  },

  _load() {
    API.getMyApplications().then(list => {
      const container = document.getElementById('appsContent')
      if (!container) return
      if (!list || list.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">暂无领养申请记录</div></div>`
        return
      }
      const statusMap = {
        pending: { label: '待审核', class: 'tag-orange' },
        approved: { label: '已通过', class: 'tag-green' },
        rejected: { label: '已拒绝', class: 'tag-red' }
      }
      container.innerHTML = list.map(app => {
        const status = statusMap[app.status] || { label: app.status, class: 'tag-gray' }
        return `
          <div class="card card-tap" style="margin:12px 16px;" onclick="App.openSubPage(()=>AdoptionPage.renderDetail('${app.listingId}'))">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;background:var(--primary-bg);border-radius:12px;flex-shrink:0;">${app.petIcon || '🐾'}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:15px;font-weight:600;">${this._escape(app.petName)}</div>
                <div style="font-size:13px;color:var(--text-3);margin-top:2px;">${Util.timeAgo(app.createdAt)}</div>
              </div>
              <span class="tag ${status.class}">${status.label}</span>
            </div>
            ${app.message ? `<div style="font-size:13px;color:var(--text-2);margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">留言：${this._escape(app.message)}</div>` : ''}
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
