/**
 * 个人中心页
 * 用户信息、贡献统计、成就系统、设置
 */
(function (global) {
    const LJ = global.LJ || (global.LJ = {})
    LJ.mobile.pages = LJ.mobile.pages || {}

    let stats = { totalReports: 0, fixedCount: 0, verifyCount: 0 }
    let userInfo = null
    let notificationEnabled = true

    /**
     * 渲染页面骨架
     */
    function render() {
        return `
      <div class="page" id="profilePage">
        <div class="page-loading"><div class="loading-spinner" role="img" aria-label="加载中"></div><p>加载中…</p></div>
      </div>
    `
    }

    /**
     * 页面挂载
     */
    async function onMount(container) {
        await loadData(container)
    }

    /**
     * 加载数据
     */
    async function loadData(container) {
        try {
            const [userRes, statsRes] = await Promise.all([
                LJ.mockApi.login(),
                LJ.mockApi.getUserStats()
            ])
            userInfo = userRes.data
            stats = statsRes.data || stats
            notificationEnabled = LJ.utils.getStorage('notificationEnabled', true)
            renderPage(container)
            bindEvents(container)
        } catch (err) {
            console.error('加载失败：', err)
            container.querySelector('#profilePage').innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>加载失败</p></div>'
        }
    }

    /**
     * 渲染页面
     */
    function renderPage(container) {
        const levelInfo = LJ.utils.calcLevel(stats)
        container.querySelector('#profilePage').innerHTML = `
      <!-- 用户信息 -->
      <div class="profile-header">
        <div class="profile-avatar">
          <img src="${userInfo.avatarUrl}" alt="头像" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23E8792B%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 font-size=%2240%22 fill=%22white%22 text-anchor=%22middle%22>用户</text></svg>'">
        </div>
        <div class="profile-info">
          <h3>${LJ.utils.escapeHtml(userInfo.nickName)}</h3>
          <p>🏅 ${levelInfo.levelTitle}</p>
          <p style="margin-top:2px;">经验值 ${levelInfo.currentExp} / ${levelInfo.nextLevelExp}</p>
        </div>
      </div>

      <!-- 贡献统计 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-num">${stats.totalReports || 0}</div>
          <div class="stat-label">上报数量</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${stats.fixedCount || 0}</div>
          <div class="stat-label">已修复</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${stats.verifyCount || 0}</div>
          <div class="stat-label">验证次数</div>
        </div>
      </div>

      <!-- 等级进度 -->
      <div class="level-card">
        <div class="level-header">
          <span class="level-title">🏅 ${levelInfo.levelTitle}</span>
          <span class="level-exp">${levelInfo.currentExp} / ${levelInfo.nextLevelExp} EXP</span>
        </div>
        <div class="level-progress">
          <div class="level-progress-bar" style="width:${levelInfo.progress}%;"></div>
        </div>
        <div style="font-size:12px;color:var(--color-text-tertiary);margin-top:6px;text-align:center;">
          距下一等级还需 ${Math.max(0, levelInfo.nextLevelExp - levelInfo.currentExp)} 经验值
        </div>
      </div>

      <!-- 勋章 -->
      <div class="detail-section">
        <h3>🎖️ 我的勋章</h3>
        <div class="medals-grid">
          ${levelInfo.medals.map((m) => `
            <div class="medal-item ${m.unlocked ? 'unlocked' : ''}">
              <div class="medal-icon">${m.icon}</div>
              <div class="medal-name">${m.name}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 设置菜单 -->
      <div class="menu-list">
        <div class="menu-item" role="group" aria-label="消息通知设置">
          <span class="icon" aria-hidden="true">🔔</span>
          <span class="label">消息通知</span>
          <label class="switch">
            <input type="checkbox" id="notifSwitch" ${notificationEnabled ? 'checked' : ''} aria-label="消息通知开关">
            <span class="slider"></span>
          </label>
        </div>
        <button type="button" class="menu-item" id="privacyBtn" aria-label="隐私设置">
          <span class="icon" aria-hidden="true">🔒</span>
          <span class="label">隐私设置</span>
          <span class="arrow" aria-hidden="true">›</span>
        </button>
        <button type="button" class="menu-item" id="feedbackBtn" aria-label="意见反馈">
          <span class="icon" aria-hidden="true">💬</span>
          <span class="label">意见反馈</span>
          <span class="arrow" aria-hidden="true">›</span>
        </button>
        <button type="button" class="menu-item" id="aboutBtn" aria-label="关于我们">
          <span class="icon" aria-hidden="true">ℹ️</span>
          <span class="label">关于我们</span>
          <span class="arrow" aria-hidden="true">›</span>
        </button>
      </div>

      <!-- 重置数据（调试用） -->
      <div class="menu-list">
        <button type="button" class="menu-item" id="resetBtn" style="color:var(--color-danger);" aria-label="重置演示数据">
          <span class="icon" aria-hidden="true">🔄</span>
          <span class="label">重置演示数据</span>
          <span class="arrow" aria-hidden="true">›</span>
        </button>
      </div>

      <div style="text-align:center;padding:16px 0 24px;color:var(--color-text-tertiary);font-size:12px;">
        路见 v1.0.0 · Demo 演示版
      </div>
    `
    }

    /**
     * 绑定事件
     */
    function bindEvents(container) {
        // 通知开关
        const notifSwitch = container.querySelector('#notifSwitch')
        if (notifSwitch) {
            notifSwitch.addEventListener('change', (e) => {
                notificationEnabled = e.target.checked
                LJ.utils.setStorage('notificationEnabled', notificationEnabled)
                LJ.mobile.showToast(notificationEnabled ? '已开启通知' : '已关闭通知')
            })
        }

        // 隐私设置
        const privacyBtn = container.querySelector('#privacyBtn')
        if (privacyBtn) privacyBtn.addEventListener('click', () => {
            LJ.mobile.showToast('隐私设置功能开发中')
        })

        // 意见反馈
        const feedbackBtn = container.querySelector('#feedbackBtn')
        if (feedbackBtn) feedbackBtn.addEventListener('click', () => {
            LJ.mobile.showModal({
                title: '意见反馈',
                content: '反馈邮箱：lujian-feedback@example.com\n\n感谢您的支持与建议！',
                showCancel: false,
                confirmText: '知道了'
            })
        })

        // 关于我们
        const aboutBtn = container.querySelector('#aboutBtn')
        if (aboutBtn) aboutBtn.addEventListener('click', () => {
            LJ.mobile.showModal({
                title: '关于路见',
                content: '路见 - 无障碍设施上报平台\n让城市更友好，让出行更无障碍。\n\n版本 1.0.0 · Demo 演示版',
                showCancel: false,
                confirmText: '知道了'
            })
        })

        // 重置数据
        const resetBtn = container.querySelector('#resetBtn')
        if (resetBtn) resetBtn.addEventListener('click', () => {
            LJ.mobile.showModal({
                title: '重置演示数据',
                content: '将清除所有本地数据并恢复初始状态，确定继续吗？',
                confirmText: '确定重置',
                cancelText: '取消',
                onConfirm: () => {
                    LJ.mockApi.resetData()
                    LJ.mobile.showToast('数据已重置')
                    setTimeout(() => LJ.mobile.navigate('/'), 1000)
                }
            })
        })
    }

    LJ.mobile.pages.profile = { render, onMount }
})(window)
