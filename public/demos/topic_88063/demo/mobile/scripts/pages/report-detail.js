/**
 * 上报详情页
 * 展示单条上报记录的完整信息、照片和处理时间线
 */
(function (global) {
    const LJ = global.LJ || (global.LJ = {})
    LJ.mobile.pages = LJ.mobile.pages || {}

    let report = null

    /**
     * 渲染页面骨架
     */
    function render(params) {
        return `
      <div class="page" id="detailPage">
        <div class="page-loading"><div class="loading-spinner" role="img" aria-label="加载中"></div><p>加载中…</p></div>
      </div>
    `
    }

    /**
     * 页面挂载
     */
    async function onMount(container, params) {
        if (!params.id) {
            container.querySelector('#detailPage').innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>参数错误</p></div>'
            return
        }
        await loadDetail(container, params.id)
    }

    /**
     * 加载详情
     */
    async function loadDetail(container, reportId) {
        try {
            const res = await LJ.mockApi.getReportDetail(reportId)
            if (res.code !== 0) {
                container.querySelector('#detailPage').innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>记录不存在</p></div>'
                return
            }
            report = res.data
            renderDetail(container)
        } catch (err) {
            console.error('加载详情失败：', err)
            container.querySelector('#detailPage').innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>加载失败</p></div>'
        }
    }

    /**
     * 渲染详情
     */
    function renderDetail(container) {
        const status = LJ.utils.getStatusInfo(report.status)
        const timelineActions = ['submit', 'audit', 'assign', 'process', 'fix', 'verify']
        const currentActionIndex = report.timeline.length - 1

        const html = `
      <!-- 状态卡片 -->
      <div class="detail-section" style="text-align:center;padding:24px 16px;">
        <div class="status-tag" style="color:${status.color};background:${status.bgColor};font-size:14px;padding:6px 16px;margin-bottom:8px;">${status.name}</div>
        <h2 style="font-size:18px;margin-bottom:4px;">${LJ.utils.escapeHtml(report.title)}</h2>
        <p style="font-size:13px;color:var(--color-text-tertiary);">工单号 ${report.orderId}</p>
      </div>

      <!-- 基本信息 -->
      <div class="detail-section">
        <h3>📋 基本信息</h3>
        <div class="detail-row"><span class="detail-label">设施类型</span><span class="detail-value">${LJ.utils.escapeHtml(report.categoryName)}</span></div>
        <div class="detail-row"><span class="detail-label">问题分类</span><span class="detail-value">${LJ.utils.escapeHtml(report.typeName)}</span></div>
        <div class="detail-row"><span class="detail-label">上报时间</span><span class="detail-value">${report.createTime}</span></div>
        <div class="detail-row"><span class="detail-label">上报人</span><span class="detail-value">${LJ.utils.escapeHtml(report.reporterName)}</span></div>
        <div class="detail-row"><span class="detail-label">位置</span><span class="detail-value">${LJ.utils.escapeHtml(report.location.address)}</span></div>
        ${report.description ? `<div class="detail-row" style="flex-direction:column;"><span class="detail-label" style="margin-bottom:6px;">问题描述</span><div class="detail-desc">${LJ.utils.escapeHtml(report.description)}</div></div>` : ''}
      </div>

      <!-- 现场照片 -->
      ${report.images && report.images.length > 0 ? `
        <div class="detail-section">
          <h3>📷 现场照片</h3>
          <div class="detail-images">
            ${report.images.map((img) => `<img src="${img}" alt="现场照片" onerror="this.style.display='none'">`).join('')}
          </div>
        </div>
      ` : ''}

      <!-- 修复照片 -->
      ${report.fixImages && report.fixImages.length > 0 ? `
        <div class="detail-section">
          <h3>🔧 修复后照片</h3>
          <div class="detail-images">
            ${report.fixImages.map((img) => `<img src="${img}" alt="修复照片" onerror="this.style.display='none'">`).join('')}
          </div>
        </div>
      ` : ''}

      <!-- 处理信息 -->
      ${report.handler ? `
        <div class="detail-section">
          <h3>🔧 处理信息</h3>
          <div class="detail-row"><span class="detail-label">处理人</span><span class="detail-value">${LJ.utils.escapeHtml(report.handler)}</span></div>
          ${report.auditRemark ? `<div class="detail-row"><span class="detail-label">审核备注</span><span class="detail-value">${LJ.utils.escapeHtml(report.auditRemark)}</span></div>` : ''}
          ${report.processRemark ? `<div class="detail-row"><span class="detail-label">处理备注</span><span class="detail-value">${LJ.utils.escapeHtml(report.processRemark)}</span></div>` : ''}
          ${report.fixRemark ? `<div class="detail-row"><span class="detail-label">修复说明</span><span class="detail-value">${LJ.utils.escapeHtml(report.fixRemark)}</span></div>` : ''}
          ${report.verifyRemark ? `<div class="detail-row"><span class="detail-label">验证备注</span><span class="detail-value">${LJ.utils.escapeHtml(report.verifyRemark)}</span></div>` : ''}
        </div>
      ` : ''}

      <!-- 处理时间线 -->
      <div class="detail-section">
        <h3>📝 处理时间线</h3>
        <div class="timeline">
          ${report.timeline.map((item, i) => `
            <div class="timeline-item ${i === currentActionIndex ? 'active' : 'done'}">
              <div class="timeline-dot"></div>
              <div class="timeline-time">${item.time}</div>
              <div class="timeline-desc">${LJ.utils.escapeHtml(item.description)}</div>
              <div class="timeline-operator">操作人：${LJ.utils.escapeHtml(item.operator)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 操作按钮 -->
      ${report.status === 'fixed' ? `
        <div style="padding:12px 0 24px;">
          <button type="button" class="btn btn-primary btn-block btn-lg" id="verifyBtn">前往验证修复结果</button>
        </div>
      ` : ''}
    `

        container.querySelector('#detailPage').innerHTML = html

        // 绑定验证按钮
        const verifyBtn = container.querySelector('#verifyBtn')
        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => {
                LJ.mobile.navigate('/verify', { id: report._id })
            })
        }

        // 图片预览（点击查看大图）
        container.querySelectorAll('.detail-images img').forEach((img) => {
            img.addEventListener('click', () => {
                LJ.mobile.showImagePreview(img.src)
            })
        })
    }

    LJ.mobile.pages['report-detail'] = { render, onMount }
})(window)
