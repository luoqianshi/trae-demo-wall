/**
 * 工单详情页（Admin）
 * 展示工单完整信息、照片、时间线，支持状态流转操作
 */
(function (global) {
    const LJ = global.LJ || (global.LJ = {})
    LJ.admin = LJ.admin || {}
    LJ.admin.pages = LJ.admin.pages || {}

    let report = null
    let mapInstance = null

    /**
     * 渲染页面骨架
     */
    function render(params) {
        return `
      <div id="detailPage">
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
     * 销毁
     */
    function onDestroy() {
        if (mapInstance) {
            mapInstance.destroy()
            mapInstance = null
        }
    }

    /**
     * 加载详情
     */
    async function loadDetail(container, reportId) {
        try {
            const res = await LJ.mockAdminApi.getReportDetail(reportId)
            if (res.code !== 0) {
                container.querySelector('#detailPage').innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">⚠️</div><p>工单不存在</p></div>'
                return
            }
            report = res.data
            renderDetail(container)
            bindEvents(container)
            // 延迟初始化地图
            setTimeout(() => initMap(container), 100)
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
        container.querySelector('#detailPage').innerHTML = `
      <!-- 状态横幅 -->
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h2 style="font-size:18px;margin-bottom:4px;">${LJ.utils.escapeHtml(report.title)}</h2>
          <p style="font-size:13px;color:var(--color-text-tertiary);">工单号 ${report.orderId} · 上报时间 ${report.createTime}</p>
        </div>
        <span class="status-tag" style="color:${status.color};background:${status.bgColor};font-size:14px;padding:6px 16px;">${status.name}</span>
      </div>

      <div class="detail-grid">
        <!-- 左侧：基本信息 + 照片 -->
        <div>
          <!-- 基本信息 -->
          <div class="detail-card">
            <h3>📋 基本信息</h3>
            <div class="detail-row"><span class="detail-label">设施分类</span><span class="detail-value">${LJ.utils.escapeHtml(report.categoryName)}</span></div>
            <div class="detail-row"><span class="detail-label">问题类型</span><span class="detail-value">${LJ.utils.escapeHtml(report.typeName)}</span></div>
            <div class="detail-row"><span class="detail-label">上报人</span><span class="detail-value">${LJ.utils.escapeHtml(report.reporterName)} ${report.reporterPhone ? '(' + report.reporterPhone + ')' : ''}</span></div>
            <div class="detail-row"><span class="detail-label">上报时间</span><span class="detail-value">${report.createTime}</span></div>
            <div class="detail-row"><span class="detail-label">更新时间</span><span class="detail-value">${report.updateTime || report.createTime}</span></div>
            ${report.description ? `<div class="detail-row" style="flex-direction:column;"><span class="detail-label" style="margin-bottom:6px;">问题描述</span><div style="line-height:1.6;">${LJ.utils.escapeHtml(report.description)}</div></div>` : ''}
          </div>

          <!-- 现场照片 -->
          ${report.images && report.images.length > 0 ? `
            <div class="detail-card">
              <h3>📷 现场照片</h3>
              <div class="detail-images">
                ${report.images.map((img) => `<img src="${img}" alt="现场照片" onerror="this.style.display='none'">`).join('')}
              </div>
            </div>
          ` : ''}

          <!-- 修复照片 -->
          ${report.fixImages && report.fixImages.length > 0 ? `
            <div class="detail-card">
              <h3>🔧 修复后照片</h3>
              <div class="detail-images">
                ${report.fixImages.map((img) => `<img src="${img}" alt="修复照片" onerror="this.style.display='none'">`).join('')}
              </div>
            </div>
          ` : ''}

          <!-- 处理信息 -->
          ${report.handler || report.auditRemark || report.processRemark || report.fixRemark || report.verifyRemark ? `
            <div class="detail-card">
              <h3>🔧 处理信息</h3>
              ${report.auditor ? `<div class="detail-row"><span class="detail-label">审核人</span><span class="detail-value">${LJ.utils.escapeHtml(report.auditor)}</span></div>` : ''}
              ${report.handler ? `<div class="detail-row"><span class="detail-label">处理人</span><span class="detail-value">${LJ.utils.escapeHtml(report.handler)}</span></div>` : ''}
              ${report.auditRemark ? `<div class="detail-row"><span class="detail-label">审核备注</span><span class="detail-value">${LJ.utils.escapeHtml(report.auditRemark)}</span></div>` : ''}
              ${report.processRemark ? `<div class="detail-row"><span class="detail-label">处理备注</span><span class="detail-value">${LJ.utils.escapeHtml(report.processRemark)}</span></div>` : ''}
              ${report.fixRemark ? `<div class="detail-row"><span class="detail-label">修复说明</span><span class="detail-value">${LJ.utils.escapeHtml(report.fixRemark)}</span></div>` : ''}
              ${report.verifyRemark ? `<div class="detail-row"><span class="detail-label">验证备注</span><span class="detail-value">${LJ.utils.escapeHtml(report.verifyRemark)}</span></div>` : ''}
            </div>
          ` : ''}
        </div>

        <!-- 右侧：位置 + 时间线 + 操作 -->
        <div>
          <!-- 位置信息 -->
          <div class="detail-card">
            <h3>📍 位置信息</h3>
            <div class="detail-row"><span class="detail-label">地址</span><span class="detail-value">${LJ.utils.escapeHtml(report.location.address)}</span></div>
            <div class="detail-row"><span class="detail-label">坐标</span><span class="detail-value" style="font-family:monospace;font-size:12px;">${report.location.latitude.toFixed(6)}, ${report.location.longitude.toFixed(6)}</span></div>
            <div class="admin-map" id="detailMap"></div>
          </div>

          <!-- 处理时间线 -->
          <div class="detail-card">
            <h3>📝 处理时间线</h3>
            <div class="admin-timeline">
              ${report.timeline.map((item, i) => `
                <div class="timeline-item ${i === report.timeline.length - 1 ? 'active' : 'done'}">
                  <div class="timeline-dot"></div>
                  <div class="timeline-time">${item.time}</div>
                  <div class="timeline-desc">${LJ.utils.escapeHtml(item.description)}</div>
                  <div class="timeline-operator">操作人：${LJ.utils.escapeHtml(item.operator)}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 操作按钮 -->
          ${renderActionBar()}
        </div>
      </div>
    `
    }

    /**
     * 渲染操作按钮
     */
    function renderActionBar() {
        const buttons = []
        if (report.status === 'pending') {
            buttons.push('<button type="button" class="btn btn-primary" id="auditBtn">审核工单</button>')
        }
        if (report.status === 'approved') {
            buttons.push('<button type="button" class="btn btn-primary" id="assignBtn">派单处理</button>')
        }
        if (report.status === 'processing') {
            buttons.push('<button type="button" class="btn btn-success" id="fixBtn">标记已修复</button>')
        }
        if (buttons.length === 0) {
            return ''
        }
        return `<div class="action-bar">${buttons.join('')}</div>`
    }

    /**
   * 初始化地图
   */
    function initMap(container) {
        const mapEl = container.querySelector('#detailMap')
        if (!mapEl || !global.AMap) return
        try {
            mapInstance = new AMap.Map(mapEl, {
                zoom: 16,
                center: [report.location.longitude, report.location.latitude]
            })
            // 使用内联样式绘制 marker，避免外部图片加载失败
            const marker = new AMap.Marker({
                position: [report.location.longitude, report.location.latitude],
                title: report.title,
                content: '<div style="width:24px;height:24px;background:#E8792B;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>',
                offset: new AMap.Pixel(-12, -12)
            })
            mapInstance.add(marker)

            // 添加信息窗体显示地址名称
            const infoWindow = new AMap.InfoWindow({
                content: `<div style="padding:8px 12px;min-width:160px;">
          <div style="font-weight:600;font-size:13px;color:#1C1917;margin-bottom:4px;">${LJ.utils.escapeHtml(report.title)}</div>
          <div style="font-size:12px;color:#57534E;">📍 ${LJ.utils.escapeHtml(report.location.address)}</div>
        </div>`,
                offset: new AMap.Pixel(0, -20)
            })
            marker.on('click', () => {
                infoWindow.open(mapInstance, [report.location.longitude, report.location.latitude])
            })
            // 默认打开信息窗体
            infoWindow.open(mapInstance, [report.location.longitude, report.location.latitude])
        } catch (err) {
            console.warn('地图初始化失败：', err)
            mapEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--color-text-tertiary);font-size:13px;">地图加载失败</div>'
        }
    }

    /**
     * 绑定事件
     */
    function bindEvents(container) {
        const auditBtn = container.querySelector('#auditBtn')
        const assignBtn = container.querySelector('#assignBtn')
        const fixBtn = container.querySelector('#fixBtn')

        if (auditBtn) auditBtn.addEventListener('click', () => showAuditModal(container))
        if (assignBtn) assignBtn.addEventListener('click', () => showAssignModal(container))
        if (fixBtn) fixBtn.addEventListener('click', () => showFixModal(container))

        // 图片预览
        container.querySelectorAll('.detail-images img').forEach((img) => {
            img.addEventListener('click', () => {
                LJ.admin.showModal({
                    title: '照片预览',
                    content: `<img src="${img.src}" alt="照片预览" style="width:100%;border-radius:var(--radius-sm);">`,
                    showCancel: false
                })
            })
        })
    }

    /**
     * 审核弹窗
     */
    function showAuditModal(container) {
        LJ.admin.showModal({
            title: '审核工单',
            content: `
        <div class="form-group">
          <label class="form-label">审核结果</label>
          <div style="display:flex;gap:12px;">
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer;">
              <input type="radio" name="auditResult" value="true" checked> 通过
            </label>
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer;">
              <input type="radio" name="auditResult" value="false"> 驳回
            </label>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">审核备注</label>
          <textarea class="form-textarea" id="auditRemark" rows="3" placeholder="请输入审核备注"></textarea>
        </div>
      `,
            confirmText: '提交审核',
            onConfirm: async () => {
                const passed = document.querySelector('input[name="auditResult"]:checked').value === 'true'
                const remark = document.getElementById('auditRemark').value.trim() || (passed ? '审核通过' : '审核驳回')
                const res = await LJ.mockAdminApi.auditReport(report._id, passed, remark)
                if (res.code === 0) {
                    LJ.admin.showToast('审核成功')
                    report = res.data
                    renderDetail(container)
                    bindEvents(container)
                    setTimeout(() => initMap(container), 100)
                } else {
                    LJ.admin.showToast(res.message || '审核失败')
                }
            }
        })
    }

    /**
     * 派单弹窗
     */
    function showAssignModal(container) {
        LJ.admin.showModal({
            title: '派单处理',
            content: `
        <div class="form-group">
          <label class="form-label">指派处理人</label>
          <select class="form-select" id="handlerSelect">
            <option value="张师傅">张师傅（市政维修）</option>
            <option value="李师傅">李师傅（设施维护）</option>
            <option value="王师傅">王师傅（无障碍专项）</option>
            <option value="赵师傅">赵师傅（综合维修）</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">派单备注</label>
          <textarea class="form-textarea" id="assignRemark" rows="3" placeholder="请输入派单备注（可选）"></textarea>
        </div>
      `,
            confirmText: '确认派单',
            onConfirm: async () => {
                const handler = document.getElementById('handlerSelect').value
                const remark = document.getElementById('assignRemark').value.trim()
                const res = await LJ.mockAdminApi.assignReport(report._id, handler, remark)
                if (res.code === 0) {
                    LJ.admin.showToast('派单成功')
                    report = res.data
                    renderDetail(container)
                    bindEvents(container)
                    setTimeout(() => initMap(container), 100)
                } else {
                    LJ.admin.showToast(res.message || '派单失败')
                }
            }
        })
    }

    /**
     * 标记修复弹窗
     */
    function showFixModal(container) {
        LJ.admin.showModal({
            title: '标记已修复',
            content: `
        <div class="form-group">
          <label class="form-label">修复说明</label>
          <textarea class="form-textarea" id="fixRemark" rows="4" placeholder="请描述修复情况"></textarea>
        </div>
      `,
            confirmText: '确认修复',
            onConfirm: async () => {
                const remark = document.getElementById('fixRemark').value.trim()
                if (!remark) {
                    LJ.admin.showToast('请填写修复说明')
                    return false
                }
                const res = await LJ.mockAdminApi.markFixed(report._id, remark)
                if (res.code === 0) {
                    LJ.admin.showToast('已标记修复')
                    report = res.data
                    renderDetail(container)
                    bindEvents(container)
                    setTimeout(() => initMap(container), 100)
                } else {
                    LJ.admin.showToast(res.message || '操作失败')
                }
                return true
            }
        })
    }

    LJ.admin.pages['report-detail'] = { render, onMount, onDestroy }
})(window)
