// ===== 爱心排行榜子页面（全局对象 LeaderboardPage） =====
const LeaderboardPage = {
  // 当前榜单周期：'weekly' | 'monthly' | 'all'
  currentPeriod: 'all',
  // 排行榜数据
  list: [],

  // 渲染子页面（返回 HTML 字符串）
  render() {
    // 默认显示总榜
    this.currentPeriod = 'all'
    this.list = []

    const html = `
      <div class="nav-bar">
        <span class="nav-back" onclick="App.closeSubPage()">‹</span>
        <span class="nav-title">爱心排行榜</span>
        <span class="nav-right"></span>
      </div>
      <div class="sub-page-content">
        <!-- 顶部 Tab 切换 -->
        <div class="leaderboard-tabs">
          <div class="leaderboard-tab" data-period="weekly" onclick="LeaderboardPage.setPeriod('weekly', this)">周榜</div>
          <div class="leaderboard-tab" data-period="monthly" onclick="LeaderboardPage.setPeriod('monthly', this)">月榜</div>
          <div class="leaderboard-tab active" data-period="all" onclick="LeaderboardPage.setPeriod('all', this)">总榜</div>
        </div>

        <!-- 领奖台（前三名） -->
        <div id="leaderboardPodium">
          <div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">加载中...</div></div>
        </div>

        <!-- 排名列表（第 4 名起） -->
        <div id="leaderboardList"></div>

        <!-- 当前用户排名提示 -->
        <div id="myRankCard"></div>
      </div>
    `

    // 延迟加载数据（默认总榜）
    setTimeout(() => this.loadData(), 0)

    return html
  },

  // 切换榜单周期
  setPeriod(period, el) {
    if (this.currentPeriod === period) return
    this.currentPeriod = period
    document.querySelectorAll('.leaderboard-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.period === period)
    })
    this.loadData()
  },

  // 加载排行榜数据
  loadData() {
    const podiumEl = document.getElementById('leaderboardPodium')
    const listEl = document.getElementById('leaderboardList')
    const myRankEl = document.getElementById('myRankCard')

    if (podiumEl) {
      podiumEl.innerHTML = `<div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">加载中...</div></div>`
    }
    if (listEl) listEl.innerHTML = ''
    if (myRankEl) myRankEl.innerHTML = ''

    API.getLeaderboard(this.currentPeriod).then(list => {
      this.list = list || []
      this.renderPodium()
      this.renderList()
      this.renderMyRank()
    }).catch(() => {
      if (podiumEl) {
        podiumEl.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">加载失败，请重试</div></div>`
      }
    })
  },

  // 渲染领奖台（前三名，2-1-3 顺序）
  renderPodium() {
    const el = document.getElementById('leaderboardPodium')
    if (!el) return

    if (this.list.length === 0) {
      el.innerHTML = `<div class="podium-empty">暂无排行数据，去救助小动物赚取爱心积分吧 ❤️</div>`
      return
    }

    const top3 = this.list.slice(0, 3)
    // 第 1、2、3 名
    const first = top3[0]
    const second = top3[1]
    const third = top3[2]

    // 按 2-1-3 顺序排列
    const order = [
      { data: second, rank: 2, crown: '🥈' },
      { data: first, rank: 1, crown: '🥇' },
      { data: third, rank: 3, crown: '🥉' }
    ]

    const itemHtml = order.map(item => {
      if (!item.data) {
        // 该名次无人，占位
        return `
          <div class="podium-item rank-${item.rank}">
            <div class="podium-crown">${item.crown}</div>
            <div class="podium-avatar"></div>
            <div class="podium-name">虚位以待</div>
            <div class="podium-points">-</div>
            <div class="podium-block">${item.rank}</div>
          </div>
        `
      }
      return `
        <div class="podium-item rank-${item.rank}">
          <div class="podium-crown">${item.crown}</div>
          <div class="podium-avatar">${this._escape(item.data.avatar || '🐾')}</div>
          <div class="podium-name">${this._escape(item.data.nickname || '匿名')}${item.data.isCurrentUser ? this._meTagHtml() : ''}</div>
          <div class="podium-points">${item.data.points || 0}</div>
          <div class="podium-block">${item.rank}</div>
        </div>
      `
    }).join('')

    el.innerHTML = `<div class="podium">${itemHtml}</div>`
  },

  // 统一的"我"小标签（独立标签，领奖台与列表共用）
  _meTagHtml() {
    return '<span class="rank-me-tag" style="display:inline-block;margin-left:6px;padding:1px 6px;background:var(--primary);color:#fff;border-radius:4px;font-size:10px;font-weight:600;vertical-align:middle;">我</span>'
  },

  // 渲染排名列表（第 4 名起）
  renderList() {
    const el = document.getElementById('leaderboardList')
    if (!el) return
    if (this.list.length <= 3) {
      el.innerHTML = ''
      return
    }
    const rest = this.list.slice(3)
    const html = rest.map(item => this._rankItemHtml(item)).join('')
    el.innerHTML = `<div class="rank-list">${html}</div>`
  },

  // 单条排名 HTML
  _rankItemHtml(item) {
    const currentUserClass = item.isCurrentUser ? ' current-user' : ''
    const meTag = item.isCurrentUser ? this._meTagHtml() : ''
    return `
      <div class="rank-item${currentUserClass}">
        <div class="rank-num">${item.rank}</div>
        <div class="rank-avatar">${this._escape(item.avatar || '🐾')}</div>
        <div class="rank-info">
          <div class="rank-name">${this._escape(item.nickname || '匿名')}${meTag}</div>
        </div>
        <div class="rank-points">${item.points || 0}</div>
      </div>
    `
  },

  // 渲染当前用户排名提示
  renderMyRank() {
    const el = document.getElementById('myRankCard')
    if (!el) return
    const me = this.list.find(u => u.isCurrentUser)
    if (!me) {
      // 不在榜单中，从 API 单独获取
      API.getRank().then(res => {
        el.innerHTML = `
          <div class="my-rank-card">
            <div>
              <div class="label">我的排名</div>
              <div class="value">第 ${res.rank} 名 / 共 ${res.total} 人</div>
            </div>
            <div style="font-size:32px;">💪</div>
          </div>
        `
      })
      return
    }
    // 如果当前用户在前 3 名，也提示一下
    el.innerHTML = `
      <div class="my-rank-card">
        <div>
          <div class="label">我的排名</div>
          <div class="value">第 ${me.rank} 名 · ${me.points || 0} 积分</div>
        </div>
        <div style="font-size:32px;">${me.rank <= 3 ? '🏆' : '❤️'}</div>
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
