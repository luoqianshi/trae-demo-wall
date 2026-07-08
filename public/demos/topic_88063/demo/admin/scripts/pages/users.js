/**
 * 上报者管理页
 * 用户列表、上报排行榜、用户详情查看
 */
(function (global) {
    const LJ = global.LJ || (global.LJ = {})
    LJ.admin = LJ.admin || {}
    LJ.admin.pages = LJ.admin.pages || {}

    let users = []

    /**
     * 渲染页面骨架
     */
    function render() {
        return `
      <div id="usersPage">
        <div class="page-loading"><div class="loading-spinner" role="img" aria-label="加载中"></div><p>加载中…</p></div>
      </div>
    `
    }

    /**
     * 页面挂载
     */
    async function onMount(container) {
        try {
            const res = await LJ.mockAdminApi.getUserList()
            if (res.code !== 0) {
                container.querySelector('#usersPage').innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>加载失败</p></div>'
                return
            }
            users = res.data
            renderPage(container)
            bindEvents(container)
        } catch (err) {
            console.error('加载用户列表失败：', err)
            container.querySelector('#usersPage').innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>加载失败</p></div>'
        }
    }

    /**
     * 渲染页面
     */
    function renderPage(container) {
        if (users.length === 0) {
            container.querySelector('#usersPage').innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">👥</div><p>暂无上报者数据</p></div>'
            return
        }

        const totalReports = users.reduce((sum, u) => sum + u.totalReports, 0)
        const totalVerified = users.reduce((sum, u) => sum + u.verifiedCount, 0)

        container.querySelector('#usersPage').innerHTML = `
      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-card-icon primary">👥</div>
          <div class="stat-card-info">
            <div class="stat-card-value">${users.length}</div>
            <div class="stat-card-label">上报者总数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon secondary">📋</div>
          <div class="stat-card-info">
            <div class="stat-card-value">${totalReports}</div>
            <div class="stat-card-label">总上报数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon success">✅</div>
          <div class="stat-card-info">
            <div class="stat-card-value">${totalVerified}</div>
            <div class="stat-card-label">已验证通过</div>
          </div>
        </div>
      </div>

      <div class="chart-grid">
        <!-- 用户列表 -->
        <div class="table-wrapper">
          <div class="table-toolbar">
            <div class="card-title">上报者列表</div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>用户</th>
                <th>联系方式</th>
                <th>上报数</th>
                <th>已验证</th>
                <th>最后上报</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${users.map((u) => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <img src="${u.avatarUrl}" alt="头像" style="width:32px;height:32px;border-radius:50%;" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><rect fill=%22%23E8792B%22 width=%2232%22 height=%2232%22/></svg>'">
                      <span>${LJ.utils.escapeHtml(u.nickName)}</span>
                    </div>
                  </td>
                  <td style="font-size:13px;color:var(--color-text-secondary);">${u.phone || '未绑定'}</td>
                  <td><span style="font-weight:600;color:var(--color-primary);">${u.totalReports}</span></td>
                  <td>${u.verifiedCount}</td>
                  <td style="font-size:12px;color:var(--color-text-tertiary);">${u.lastReportTime}</td>
                  <td><button type="button" class="table-action-btn" data-action="detail" data-id="${u.openid}">详情</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- 排行榜 -->
        <div class="chart-card">
          <div class="chart-card-header">
            <div class="chart-card-title">🏆 上报贡献榜</div>
          </div>
          <ul class="rank-list">
            ${users.slice(0, 10).map((u, i) => {
            const rankClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : ''
            return `
                <li class="rank-item">
                  <span class="rank-num ${rankClass}">${i + 1}</span>
                  <img src="${u.avatarUrl}" alt="头像" style="width:32px;height:32px;border-radius:50%;" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><rect fill=%22%23E8792B%22 width=%2232%22 height=%2232%22/></svg>'">
                  <div style="flex:1;">
                    <div style="font-weight:500;">${LJ.utils.escapeHtml(u.nickName)}</div>
                    <div style="font-size:12px;color:var(--color-text-tertiary);">验证通过 ${u.verifiedCount} 单</div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:18px;font-weight:700;color:var(--color-primary);">${u.totalReports}</div>
                    <div style="font-size:11px;color:var(--color-text-tertiary);">上报数</div>
                  </div>
                </li>
              `
        }).join('')}
          </ul>
        </div>
      </div>
    `
    }

    /**
     * 绑定事件
     */
    function bindEvents(container) {
        container.querySelector('#usersPage').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="detail"]')
            if (!btn) return
            showUserDetail(btn.dataset.id)
        })
    }

    /**
     * 显示用户详情
     */
    async function showUserDetail(openid) {
        const user = users.find((u) => u.openid === openid)
        if (!user) return

        LJ.admin.showModal({
            title: '用户详情',
            content: `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          <img src="${user.avatarUrl}" alt="头像" style="width:56px;height:56px;border-radius:50%;" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 56 56%22><rect fill=%22%23E8792B%22 width=%2256%22 height=%2256%22/></svg>'">
          <div>
            <div style="font-size:16px;font-weight:600;">${LJ.utils.escapeHtml(user.nickName)}</div>
            <div style="font-size:13px;color:var(--color-text-secondary);">${user.phone || '未绑定手机'}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
          <div style="text-align:center;padding:12px;background:var(--color-bg);border-radius:var(--radius-sm);">
            <div style="font-size:20px;font-weight:700;color:var(--color-primary);">${user.totalReports}</div>
            <div style="font-size:12px;color:var(--color-text-secondary);">总上报</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--color-bg);border-radius:var(--radius-sm);">
            <div style="font-size:20px;font-weight:700;color:var(--color-success);">${user.verifiedCount}</div>
            <div style="font-size:12px;color:var(--color-text-secondary);">已验证</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--color-bg);border-radius:var(--radius-sm);">
            <div style="font-size:20px;font-weight:700;color:var(--color-secondary);">${user.totalReports - user.verifiedCount}</div>
            <div style="font-size:12px;color:var(--color-text-secondary);">处理中</div>
          </div>
        </div>
        <div style="font-size:13px;color:var(--color-text-secondary);">
          <p>最后上报时间：${user.lastReportTime}</p>
          <p>OpenID：${user.openid}</p>
        </div>
      `,
            showCancel: false,
            confirmText: '关闭'
        })
    }

    LJ.admin.pages.users = { render, onMount }
})(window)
