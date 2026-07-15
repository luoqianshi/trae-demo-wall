// ===== 积分明细子页面（全局对象 PointsPage） =====
const PointsPage = {
  // 分页与筛选状态
  currentPage: 1,
  currentFilter: '',  // '' | 'base' | 'friendly'
  hasMore: false,
  loading: false,
  // 总记录数（用于显示空状态）
  totalCount: 0,

  // 渲染子页面（返回 HTML 字符串）
  render() {
    // 重置状态
    this.currentPage = 1
    this.currentFilter = ''
    this.hasMore = false
    this.loading = false
    this.totalCount = 0

    const user = API.getCurrentUser()
    const points = user.points || { base: 0, friendly: 0 }
    const total = (points.base || 0) + (points.friendly || 0)

    const html = `
      <div class="nav-bar">
        <span class="nav-back" onclick="App.closeSubPage()">‹</span>
        <span class="nav-title">积分明细</span>
        <span class="nav-right"></span>
      </div>
      <div class="sub-page-content" id="pointsScrollContent" onscroll="PointsPage.onScroll(this)">
        <!-- 顶部积分总览 -->
        <div class="card points-overview-card">
          <div class="points-overview-total">
            <div class="points-overview-label">总积分</div>
            <div class="points-overview-value">${total}</div>
          </div>
          <div class="points-overview-split">
            <div class="points-overview-item">
              <div class="points-overview-item-label">基础积分</div>
              <div class="points-overview-item-value base">${points.base || 0}</div>
            </div>
            <div class="points-overview-item">
              <div class="points-overview-item-label">友善积分</div>
              <div class="points-overview-item-value friendly">${points.friendly || 0}</div>
            </div>
          </div>
        </div>

        <!-- 筛选 chips -->
        <div class="chips-row">
          <div class="chip active" data-filter="" onclick="PointsPage.setFilter('', this)">全部</div>
          <div class="chip" data-filter="base" onclick="PointsPage.setFilter('base', this)">基础</div>
          <div class="chip" data-filter="friendly" onclick="PointsPage.setFilter('friendly', this)">友善</div>
        </div>

        <!-- 记录列表 -->
        <div class="points-list" id="pointsList">
          <div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">加载中...</div></div>
        </div>
      </div>
    `

    // 延迟加载首屏数据（确保 DOM 已就绪）
    setTimeout(() => this.loadRecords(true), 0)

    return html
  },

  // 切换筛选
  setFilter(filter, el) {
    if (this.currentFilter === filter) return
    this.currentFilter = filter
    // 更新 chips 高亮
    document.querySelectorAll('#pointsScrollContent .chip').forEach(c => {
      c.classList.toggle('active', c.dataset.filter === filter)
    })
    this.currentPage = 1
    this.hasMore = false
    this.loadRecords(true)
  },

  // 加载积分记录
  loadRecords(reset) {
    if (this.loading) return
    this.loading = true
    const listEl = document.getElementById('pointsList')
    if (!listEl) return

    // 重置时显示加载中
    if (reset) {
      listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">加载中...</div></div>`
    } else {
      // 追加：在底部显示加载提示
      const more = document.createElement('div')
      more.className = 'points-load-more loading'
      more.id = 'pointsLoadingMore'
      listEl.appendChild(more)
    }

    const params = {
      page: this.currentPage,
      pageSize: 20
    }
    if (this.currentFilter) params.type = this.currentFilter

    API.getPointRecords(params).then(res => {
      this.loading = false
      this.totalCount = res.total || 0
      this.hasMore = !!res.hasMore

      // 移除加载提示
      const moreEl = document.getElementById('pointsLoadingMore')
      if (moreEl) moreEl.remove()

      const records = res.list || []
      if (reset && records.length === 0) {
        listEl.innerHTML = this._emptyHtml()
        return
      }
      if (reset) {
        listEl.innerHTML = records.map(r => this._recordHtml(r)).join('')
      } else {
        listEl.insertAdjacentHTML('beforeend', records.map(r => this._recordHtml(r)).join(''))
      }

      // 没有更多数据时显示提示
      if (!this.hasMore && this.currentPage > 1) {
        const end = document.createElement('div')
        end.className = 'points-load-more'
        end.textContent = '— 没有更多了 —'
        listEl.appendChild(end)
      }
    }).catch(() => {
      this.loading = false
      const moreEl = document.getElementById('pointsLoadingMore')
      if (moreEl) moreEl.remove()
      if (reset) {
        listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">加载失败，请重试</div></div>`
      }
    })
  },

  // 滚动监听：到达底部加载更多
  onScroll(el) {
    if (this.loading || !this.hasMore) return
    const threshold = 60
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      this.currentPage++
      this.loadRecords(false)
    }
  },

  // 单条记录 HTML
  _recordHtml(record) {
    const isNegative = (record.points || 0) < 0
    const valueStr = (isNegative ? '' : '+') + (record.points || 0)
    const icon = this._iconFor(record)
    return `
      <div class="point-record">
        <div class="point-record-icon ${isNegative ? 'negative' : ''}">${icon}</div>
        <div class="point-record-content">
          <div class="point-record-reason">${this._escape(record.reason || '未说明')}</div>
          <div class="point-record-time">${Util.timeAgo(record.createdAt)} · ${record.type === 'base' ? '基础' : '友善'}</div>
        </div>
        <div class="point-record-value ${isNegative ? 'negative' : 'positive'}">${valueStr}</div>
      </div>
    `
  },

  // 根据记录原因返回图标 emoji
  _iconFor(record) {
    const reason = (record.reason || '').toLowerCase()
    if (reason.includes('认证')) return '🪪'
    if (reason.includes('救助')) return '🚑'
    if (reason.includes('领养')) return '🏠'
    if (reason.includes('宠物') || reason.includes('日记')) return '🐾'
    if (reason.includes('标记')) return '📍'
    if (reason.includes('兑换')) return '🎁'
    if (reason.includes('好评')) return '⭐'
    if (record.type === 'base') return '🎯'
    return '❤️'
  },

  // 空状态 HTML
  _emptyHtml() {
    const filterText = this.currentFilter === 'base' ? '基础积分'
      : this.currentFilter === 'friendly' ? '友善积分'
      : '积分'
    return `
      <div class="empty-state" style="padding:60px 20px;">
        <div class="empty-icon">📊</div>
        <div class="empty-text">暂无${filterText}记录</div>
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
