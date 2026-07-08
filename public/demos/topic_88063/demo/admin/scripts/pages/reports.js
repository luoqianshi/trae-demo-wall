/**
 * 工单管理页
 * 工单列表、筛选、分页、状态流转操作
 */
(function (global) {
    const LJ = global.LJ || (global.LJ = {})
    LJ.admin = LJ.admin || {}
    LJ.admin.pages = LJ.admin.pages || {}

    const { STATUS_LIST, PROBLEM_TYPES, PAGE_SIZE } = LJ.constants

    // 筛选状态
    const filter = {
        status: '',
        typeId: '',
        keyword: '',
        page: 1,
        pageSize: PAGE_SIZE
    }

    let total = 0
    let list = []

    /**
     * 渲染页面
     */
    function render() {
        return `
      <div id="reportsPage">
        <div class="table-wrapper">
          <!-- 工具栏 -->
          <div class="table-toolbar">
            <label for="keywordInput" class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);">搜索关键词</label>
            <input type="text" class="form-input search-input" id="keywordInput" name="keyword" placeholder="搜索工单号、标题、描述、地址…" value="${filter.keyword}" autocomplete="off">
            <select class="form-select" id="statusFilter" aria-label="状态筛选">
              <option value="">全部状态</option>
              ${STATUS_LIST.map((s) => `<option value="${s.id}" ${filter.status === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
            </select>
            <select class="form-select" id="typeFilter" aria-label="类型筛选">
              <option value="">全部类型</option>
              ${PROBLEM_TYPES.map((t) => `<option value="${t.id}" ${filter.typeId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
            </select>
            <button type="button" class="btn btn-primary btn-sm" id="searchBtn">搜索</button>
            <button type="button" class="btn btn-outline btn-sm" id="resetBtn">重置</button>
          </div>

          <!-- 数据表格 -->
          <div id="tableBody" aria-live="polite">
            <div class="page-loading"><div class="loading-spinner" role="img" aria-label="加载中"></div><p>加载中…</p></div>
          </div>

          <!-- 分页 -->
          <div class="pagination" id="pagination"></div>
        </div>
      </div>
    `
    }

    /**
     * 页面挂载
     */
    async function onMount(container) {
        bindEvents(container)
        await loadData(container)
    }

    /**
     * 绑定事件
     */
    function bindEvents(container) {
        // 搜索
        const searchBtn = container.querySelector('#searchBtn')
        const keywordInput = container.querySelector('#keywordInput')
        searchBtn.addEventListener('click', () => {
            filter.keyword = keywordInput.value.trim()
            filter.page = 1
            loadData(container)
        })
        keywordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchBtn.click()
        })

        // 状态筛选
        container.querySelector('#statusFilter').addEventListener('change', (e) => {
            filter.status = e.target.value
            filter.page = 1
            loadData(container)
        })

        // 类型筛选
        container.querySelector('#typeFilter').addEventListener('change', (e) => {
            filter.typeId = e.target.value
            filter.page = 1
            loadData(container)
        })

        // 重置
        container.querySelector('#resetBtn').addEventListener('click', () => {
            filter.status = ''
            filter.typeId = ''
            filter.keyword = ''
            filter.page = 1
            container.querySelector('#keywordInput').value = ''
            container.querySelector('#statusFilter').value = ''
            container.querySelector('#typeFilter').value = ''
            loadData(container)
        })

        // 表格操作（事件委托）
        container.querySelector('#tableBody').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]')
            if (!btn) return
            const id = btn.dataset.id
            const action = btn.dataset.action
            handleAction(container, action, id)
        })

        // 分页
        container.querySelector('#pagination').addEventListener('click', (e) => {
            const btn = e.target.closest('.page-btn')
            if (!btn || btn.disabled) return
            const page = parseInt(btn.dataset.page, 10)
            filter.page = page
            loadData(container)
        })
    }

    /**
     * 加载数据
     */
    async function loadData(container) {
        const body = container.querySelector('#tableBody')
        body.innerHTML = '<div class="page-loading"><div class="loading-spinner" role="img" aria-label="加载中"></div><p>加载中…</p></div>'

        try {
            const res = await LJ.mockAdminApi.getReportList(filter)
            if (res.code !== 0) {
                body.innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>加载失败</p></div>'
                return
            }
            list = res.data.list
            total = res.data.total
            renderTable(container)
            renderPagination(container)
        } catch (err) {
            console.error('加载工单失败：', err)
            body.innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>加载失败</p></div>'
        }
    }

    /**
     * 渲染表格
     */
    function renderTable(container) {
        const body = container.querySelector('#tableBody')
        if (list.length === 0) {
            body.innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">📋</div><p>暂无工单数据</p></div>'
            return
        }

        body.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>工单号</th>
            <th>标题</th>
            <th>类型</th>
            <th>状态</th>
            <th>上报人</th>
            <th>位置</th>
            <th>上报时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((r) => {
            const status = LJ.utils.getStatusInfo(r.status)
            return `
              <tr>
                <td class="table-cell-id">${r.orderId}</td>
                <td class="table-cell-title" title="${LJ.utils.escapeHtml(r.title)}">${LJ.utils.escapeHtml(r.title)}</td>
                <td>${LJ.utils.escapeHtml(r.typeName)}</td>
                <td><span class="status-tag" style="color:${status.color};background:${status.bgColor};">${status.name}</span></td>
                <td>${LJ.utils.escapeHtml(r.reporterName)}</td>
                <td class="table-cell-desc" title="${LJ.utils.escapeHtml(r.location.address)}">${LJ.utils.escapeHtml(r.location.address)}</td>
                <td style="font-size:12px;color:var(--color-text-tertiary);white-space:nowrap;">${r.createTime}</td>
                <td class="table-actions">${renderActions(r)}</td>
              </tr>
            `
        }).join('')}
        </tbody>
      </table>
    `
    }

    /**
     * 渲染操作按钮（根据状态）
     */
    function renderActions(r) {
        const buttons = [`<button type="button" class="table-action-btn" data-action="detail" data-id="${r._id}">详情</button>`]
        if (r.status === 'pending') {
            buttons.push(`<button type="button" class="table-action-btn" data-action="audit" data-id="${r._id}">审核</button>`)
        }
        if (r.status === 'approved') {
            buttons.push(`<button type="button" class="table-action-btn" data-action="assign" data-id="${r._id}">派单</button>`)
        }
        if (r.status === 'processing') {
            buttons.push(`<button type="button" class="table-action-btn" data-action="fix" data-id="${r._id}">标记修复</button>`)
        }
        return buttons.join('')
    }

    /**
     * 处理操作
     */
    function handleAction(container, action, id) {
        if (action === 'detail') {
            LJ.admin.navigate('/report-detail', { id })
            return
        }
        if (action === 'audit') showAuditModal(container, id)
        if (action === 'assign') showAssignModal(container, id)
        if (action === 'fix') showFixModal(container, id)
    }

    /**
     * 审核弹窗
     */
    function showAuditModal(container, id) {
        LJ.admin.showModal({
            title: '审核工单',
            content: `
        <fieldset class="form-group" style="border:none;padding:0;margin:0;">
          <legend class="form-label">审核结果</legend>
          <div style="display:flex;gap:12px;" role="radiogroup" aria-label="审核结果">
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer;">
              <input type="radio" name="auditResult" value="true" checked> 通过
            </label>
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer;">
              <input type="radio" name="auditResult" value="false"> 驳回
            </label>
          </div>
        </fieldset>
        <div class="form-group">
          <label class="form-label" for="auditRemark">审核备注</label>
          <textarea class="form-textarea" id="auditRemark" name="auditRemark" rows="3" placeholder="请输入审核备注"></textarea>
        </div>
      `,
            confirmText: '提交审核',
            onConfirm: async () => {
                const passed = document.querySelector('input[name="auditResult"]:checked').value === 'true'
                const remark = document.getElementById('auditRemark').value.trim() || (passed ? '审核通过' : '审核驳回')
                const res = await LJ.mockAdminApi.auditReport(id, passed, remark)
                if (res.code === 0) {
                    LJ.admin.showToast('审核成功')
                    loadData(container)
                } else {
                    LJ.admin.showToast(res.message || '审核失败')
                }
            }
        })
    }

    /**
     * 派单弹窗
     */
    function showAssignModal(container, id) {
        LJ.admin.showModal({
            title: '派单处理',
            content: `
        <div class="form-group">
          <label class="form-label" for="handlerSelect">指派处理人</label>
          <select class="form-select" id="handlerSelect" name="handler">
            <option value="张师傅">张师傅（市政维修）</option>
            <option value="李师傅">李师傅（设施维护）</option>
            <option value="王师傅">王师傅（无障碍专项）</option>
            <option value="赵师傅">赵师傅（综合维修）</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="assignRemark">派单备注</label>
          <textarea class="form-textarea" id="assignRemark" name="assignRemark" rows="3" placeholder="请输入派单备注（可选）"></textarea>
        </div>
      `,
            confirmText: '确认派单',
            onConfirm: async () => {
                const handler = document.getElementById('handlerSelect').value
                const remark = document.getElementById('assignRemark').value.trim()
                const res = await LJ.mockAdminApi.assignReport(id, handler, remark)
                if (res.code === 0) {
                    LJ.admin.showToast('派单成功')
                    loadData(container)
                } else {
                    LJ.admin.showToast(res.message || '派单失败')
                }
            }
        })
    }

    /**
     * 标记修复弹窗
     */
    function showFixModal(container, id) {
        LJ.admin.showModal({
            title: '标记已修复',
            content: `
        <div class="form-group">
          <label class="form-label" for="fixRemark">修复说明</label>
          <textarea class="form-textarea" id="fixRemark" name="fixRemark" rows="4" placeholder="请描述修复情况" aria-required="true"></textarea>
        </div>
      `,
            confirmText: '确认修复',
            onConfirm: async () => {
                const remark = document.getElementById('fixRemark').value.trim()
                if (!remark) {
                    LJ.admin.showToast('请填写修复说明')
                    return false
                }
                const res = await LJ.mockAdminApi.markFixed(id, remark)
                if (res.code === 0) {
                    LJ.admin.showToast('已标记修复')
                    loadData(container)
                } else {
                    LJ.admin.showToast(res.message || '操作失败')
                }
                return true
            }
        })
    }

    /**
     * 渲染分页
     */
    function renderPagination(container) {
        const pagEl = container.querySelector('#pagination')
        const totalPages = Math.ceil(total / filter.pageSize)
        if (totalPages <= 1) {
            pagEl.innerHTML = `<div class="page-info">共 ${total} 条</div>`
            return
        }

        let buttons = ''
        // 上一页
        buttons += `<button type="button" class="page-btn" data-page="${filter.page - 1}" ${filter.page <= 1 ? 'disabled' : ''} aria-label="上一页">‹</button>`
        // 页码
        const start = Math.max(1, filter.page - 2)
        const end = Math.min(totalPages, filter.page + 2)
        for (let i = start; i <= end; i++) {
            buttons += `<button type="button" class="page-btn ${i === filter.page ? 'active' : ''}" data-page="${i}" aria-current="${i === filter.page ? 'page' : 'false'}" aria-label="第${i}页">${i}</button>`
        }
        // 下一页
        buttons += `<button type="button" class="page-btn" data-page="${filter.page + 1}" ${filter.page >= totalPages ? 'disabled' : ''} aria-label="下一页">›</button>`

        pagEl.innerHTML = buttons + `<div class="page-info">共 ${total} 条 / ${totalPages} 页</div>`
    }

    LJ.admin.pages.reports = { render, onMount }
})(window)
