/**
 * 我的上报列表页
 * 展示用户提交的所有上报记录，支持按状态筛选
 */
(function (global) {
    const LJ = global.LJ || (global.LJ = {})
    LJ.mobile.pages = LJ.mobile.pages || {}

    let currentFilter = ''
    let reports = []
    let loading = false

    /**
     * 渲染页面骨架
     */
    function render() {
        const { STATUS_LIST } = LJ.constants
        return `
      <div class="filter-tabs" id="filterTabs" role="tablist" aria-label="状态筛选">
        <button type="button" class="filter-tab ${currentFilter === '' ? 'active' : ''}" data-status="" role="tab" aria-selected="${currentFilter === '' ? 'true' : 'false'}">全部</button>
        ${STATUS_LIST.map((s) => `
          <button type="button" class="filter-tab ${currentFilter === s.id ? 'active' : ''}" data-status="${s.id}" role="tab" aria-selected="${currentFilter === s.id ? 'true' : 'false'}">${s.name}</button>
        `).join('')}
      </div>
      <div class="page" id="reportList" aria-live="polite">
        <div class="page-loading"><div class="loading-spinner" role="img" aria-label="加载中"></div><p>加载中…</p></div>
      </div>
    `
    }

    /**
     * 页面挂载
     */
    async function onMount(container) {
        // 标记反馈为已读（用户已进入我的上报页面）
        LJ.mockApi.markFeedbackViewed()
        // 更新角标为 0
        if (LJ.mobile.updateTabbarBadge) LJ.mobile.updateTabbarBadge()

        // 筛选标签点击
        container.querySelector('#filterTabs').addEventListener('click', (e) => {
            const tab = e.target.closest('.filter-tab')
            if (!tab) return
            currentFilter = tab.dataset.status
            container.querySelectorAll('.filter-tab').forEach((t) => {
                t.classList.remove('active')
                t.setAttribute('aria-selected', 'false')
            })
            tab.classList.add('active')
            tab.setAttribute('aria-selected', 'true')
            loadReports(container)
        })

        // 列表点击
        container.querySelector('#reportList').addEventListener('click', (e) => {
            const item = e.target.closest('.my-report-item')
            if (item) {
                LJ.mobile.navigate('/report-detail', { id: item.dataset.id })
            }
        })

        await loadReports(container)
    }

    /**
     * 加载上报列表
     */
    async function loadReports(container) {
        if (loading) return
        loading = true
        const listEl = container.querySelector('#reportList')
        listEl.innerHTML = '<div class="page-loading"><div class="loading-spinner" role="img" aria-label="加载中"></div><p>加载中…</p></div>'

        try {
            const params = { page: 1, pageSize: 50 }
            if (currentFilter) params.status = currentFilter

            const res = await LJ.mockApi.getMyReports(params)
            if (res.code !== 0) {
                listEl.innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>加载失败</p></div>'
                loading = false
                return
            }

            reports = res.data.list
            renderList(container, reports)
        } catch (err) {
            console.error('加载失败：', err)
            listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>加载失败</p></div>'
        }
        loading = false
    }

    /**
     * 渲染列表
     */
    function renderList(container, list) {
        const listEl = container.querySelector('#reportList')
        if (list.length === 0) {
            listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon" aria-hidden="true">📋</div>
          <p>暂无上报记录</p>
          <button type="button" class="btn btn-primary" style="margin-top:16px;" onclick="LJ.mobile.navigate('/report')">去上报</button>
        </div>
      `
            return
        }

        listEl.innerHTML = list.map((item) => {
            const status = LJ.utils.getStatusInfo(item.status)
            return `
        <button type="button" class="my-report-item" data-id="${item._id}" aria-label="查看上报：${LJ.utils.escapeHtml(item.title)}">
          <div class="my-report-header">
            <div class="my-report-title">${LJ.utils.escapeHtml(item.title)}</div>
            <span class="status-tag" style="color:${status.color};background:${status.bgColor};">${status.name}</span>
          </div>
          <div class="my-report-time">🕐 ${item.createTime} · 工单号 ${item.orderId}</div>
          <div class="report-item-desc" style="margin-top:6px;">${LJ.utils.escapeHtml(item.description || '无描述')}</div>
          <div class="report-item-meta" style="margin-top:6px;">
            <span>📍 ${LJ.utils.escapeHtml(item.location.address)}</span>
          </div>
        </button>
      `
        }).join('')
    }

    LJ.mobile.pages['my-reports'] = { render, onMount }
})(window)
