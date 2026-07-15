// ===== 积分兑换子页面（全局对象 ExchangePage） =====
const ExchangePage = {
  // 当前用户的友善积分（渲染时读取一次，兑换成功后更新）
  friendlyPoints: 0,
  // 兑换选项缓存
  options: [],
  // 兑换记录缓存
  records: [],

  // 渲染子页面（返回 HTML 字符串）
  render() {
    const user = API.getCurrentUser()
    const points = user.points || { base: 0, friendly: 0 }
    this.friendlyPoints = points.friendly || 0

    const html = `
      <div class="nav-bar">
        <span class="nav-back" onclick="App.closeSubPage()">‹</span>
        <span class="nav-title">积分兑换</span>
        <span class="nav-right"></span>
      </div>
      <div class="sub-page-content">
        <!-- 顶部当前友善积分 -->
        <div class="exchange-current-card">
          <div class="exchange-current-label">我的友善积分</div>
          <div>
            <span class="exchange-current-value" id="exchangeCurrentPoints">${this.friendlyPoints}</span>
            <span class="exchange-current-unit">分</span>
          </div>
        </div>

        <!-- 兑换选项网格 -->
        <div class="exchange-section-title">可兑换项目</div>
        <div class="exchange-grid" id="exchangeGrid">
          <div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">⏳</div><div class="empty-text">加载中...</div></div>
        </div>

        <!-- 兑换记录 -->
        <div class="exchange-section-title" style="margin-top:24px;">兑换记录</div>
        <div class="exchange-records" id="exchangeRecords">
          <div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">加载中...</div></div>
        </div>
      </div>
    `

    // 延迟加载数据
    setTimeout(() => this.loadData(), 0)

    return html
  },

  // 加载兑换选项和记录
  loadData() {
    // 加载兑换选项
    API.getExchangeOptions().then(options => {
      this.options = options || []
      this.renderOptions()
    })

    // 加载兑换记录
    this.refreshRecords()
  },

  // 渲染兑换选项网格
  renderOptions() {
    const el = document.getElementById('exchangeGrid')
    if (!el) return
    if (this.options.length === 0) {
      el.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🎁</div><div class="empty-text">暂无可兑换项目</div></div>`
      return
    }
    el.innerHTML = this.options.map(opt => this._optionHtml(opt)).join('')
  },

  // 单个兑换选项 HTML
  _optionHtml(opt) {
    const insufficient = this.friendlyPoints < opt.points
    const btnHtml = insufficient
      ? `<button class="btn btn-outline" disabled>积分不足</button>`
      : `<button class="btn btn-primary" onclick="ExchangePage.openConfirm('${opt.id}')">立即兑换</button>`
    return `
      <div class="exchange-option">
        <div class="exchange-option-icon">${opt.icon || '🎁'}</div>
        <div class="exchange-option-name">${this._escape(opt.name || '')}</div>
        <div class="exchange-option-desc">${this._escape(opt.desc || '')}</div>
        <div class="exchange-option-points">${opt.points} 积分</div>
        ${btnHtml}
      </div>
    `
  },

  // 打开兑换确认弹窗
  openConfirm(optionId) {
    const opt = this.options.find(o => o.id === optionId)
    if (!opt) return
    // 积分不足再次校验
    if (this.friendlyPoints < opt.points) {
      Util.toast('友善积分不足')
      return
    }
    const remaining = this.friendlyPoints - opt.points

    // 遮罩（点击外部关闭）
    const mask = document.createElement('div')
    mask.className = 'bottom-sheet-mask show'
    mask.id = 'exchangeConfirmMask'
    mask.addEventListener('click', () => this.closeConfirm())

    // 居中确认弹窗
    const modal = document.createElement('div')
    modal.className = 'center-modal show'
    modal.id = 'exchangeConfirmModal'
    modal.innerHTML = `
      <div class="exchange-confirm-modal">
        <span class="sheet-close" style="position:absolute;top:10px;right:12px;font-size:18px;color:var(--text-3);cursor:pointer;" onclick="ExchangePage.closeConfirm()">✕</span>
        <div class="exchange-confirm-icon">${opt.icon || '🎁'}</div>
        <div class="exchange-confirm-name">${this._escape(opt.name || '')}</div>
        <div class="exchange-confirm-desc">${this._escape(opt.desc || '')}</div>
        <div class="exchange-confirm-points">消耗 ${opt.points} 积分</div>
        <div class="exchange-confirm-balance">兑换后剩余 ${remaining} 积分</div>
        <div class="exchange-confirm-actions">
          <button class="btn btn-outline" onclick="ExchangePage.closeConfirm()">取消</button>
          <button class="btn btn-primary" onclick="ExchangePage.doExchange('${opt.id}')">确认兑换</button>
        </div>
      </div>
    `
    document.body.appendChild(mask)
    document.body.appendChild(modal)
  },

  // 关闭确认弹窗
  closeConfirm() {
    const modal = document.getElementById('exchangeConfirmModal')
    const mask = document.getElementById('exchangeConfirmMask')
    if (modal) modal.remove()
    if (mask) mask.remove()
  },

  // 执行兑换
  doExchange(optionId) {
    const opt = this.options.find(o => o.id === optionId)
    if (!opt) return
    Util.showLoading('兑换中...')
    API.exchangePoints(optionId).then(res => {
      Util.hideLoading()
      if (res && res.success) {
        this.closeConfirm()
        // 新返回结构：{success, data: {exchangeId, remainingPoints}}
        const remaining = (res.data && res.data.remainingPoints != null)
          ? res.data.remainingPoints
          : (this.friendlyPoints - opt.points)
        // 更新本地积分
        this.friendlyPoints = remaining
        // 显示积分扣减提示
        Util.toast(`兑换成功！消耗 ${opt.points} 积分`)
        // 更新顶部积分显示
        const pointsEl = document.getElementById('exchangeCurrentPoints')
        if (pointsEl) pointsEl.textContent = this.friendlyPoints
        // 重新渲染选项（按钮置灰状态可能变化）
        this.renderOptions()
        // 刷新兑换记录
        this.refreshRecords()
      } else {
        Util.toast((res && res.message) || '兑换失败')
      }
    }).catch(err => {
      Util.hideLoading()
      Util.toast('兑换失败：' + (err && err.message ? err.message : ''))
    })
  },

  // 刷新兑换记录
  refreshRecords() {
    const el = document.getElementById('exchangeRecords')
    API.getExchangeRecords().then(records => {
      this.records = records || []
      if (!el) return
      if (this.records.length === 0) {
        el.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">暂无兑换记录</div></div>`
        return
      }
      el.innerHTML = this.records.map(r => this._recordHtml(r)).join('')
    })
  },

  // 单条兑换记录 HTML
  _recordHtml(r) {
    // pending（待处理，橙色）/ completed（已完成，绿色）/ rejected（已拒绝，红色）
    let statusText, statusClass, statusStyle
    if (r.status === 'completed') {
      statusText = '已完成'
      statusClass = 'completed'
      statusStyle = ''
    } else if (r.status === 'rejected') {
      statusText = '已拒绝'
      statusClass = ''
      statusStyle = 'background:var(--accent-bg);color:var(--accent);'
    } else {
      statusText = '待处理'
      statusClass = 'pending'
      statusStyle = ''
    }
    return `
      <div class="exchange-record">
        <div class="exchange-record-info">
          <div class="exchange-record-name">${this._escape(r.optionName || '')}</div>
          <div class="exchange-record-time">${Util.timeAgo(r.createdAt)}</div>
        </div>
        <span class="exchange-record-status ${statusClass}"${statusStyle ? ` style="${statusStyle}"` : ''}>${statusText}</span>
        <div class="exchange-record-points">-${r.points || 0}</div>
      </div>
    `
  },

  // HTML 转义
  _escape(text) {
    if (text == null) return ''
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }
}
