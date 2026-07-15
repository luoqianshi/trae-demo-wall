// ===== 主应用：路由、tabBar、全局状态 =====
const App = {
  currentPage: 'map',
  map: null, // Leaflet 地图实例

  init() {
    // 初始化 mock 数据
    MockData.init()
    // 确保当前用户存在
    API.getCurrentUser()

    // 更新状态栏时间
    this.updateStatusBarTime()
    setInterval(() => this.updateStatusBarTime(), 60000)

    // TabBar 点击
    document.querySelectorAll('.tab-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page
        this.switchTab(page)
      })
    })

    // 初始化各页面
    MapPage.init()
    AdoptionPage.init()
    ProfilePage.init()
    CommunityPage.init()

    // 默认显示地图页
    this.switchTab('map')
  },

  // 切换 Tab
  switchTab(page) {
    this.currentPage = page
    // 更新 TabBar 高亮
    document.querySelectorAll('.tab-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page)
    })
    // 更新页面显示
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
    document.getElementById('page-' + page).classList.add('active')

    // 页面切换回调
    if (page === 'map' && MapPage.onShow) MapPage.onShow()
    if (page === 'adoption' && AdoptionPage.onShow) AdoptionPage.onShow()
    if (page === 'profile' && ProfilePage.onShow) ProfilePage.onShow()
    if (page === 'community' && CommunityPage.onShow) CommunityPage.onShow()
  },

  // 打开子页面
  openSubPage(renderer) {
    const container = document.getElementById('subPage')
    container.innerHTML = renderer()
    container.classList.add('active')
    // 滚动到顶部
    const content = container.querySelector('.sub-page-content')
    if (content) content.scrollTop = 0
  },

  // 关闭子页面
  closeSubPage() {
    const container = document.getElementById('subPage')
    container.classList.remove('active')
    setTimeout(() => { container.innerHTML = '' }, 300)
    // 刷新当前页面
    if (this.currentPage === 'profile' && ProfilePage.onShow) ProfilePage.onShow()
    if (this.currentPage === 'adoption' && AdoptionPage.onShow) AdoptionPage.onShow()
  },

  // 更新状态栏时间
  updateStatusBarTime() {
    const now = new Date()
    const h = now.getHours()
    const m = String(now.getMinutes()).padStart(2, '0')
    document.getElementById('statusTime').textContent = h + ':' + m
  },

  // 显示积分奖励弹窗
  showPointsReward(points, reason) {
    const modal = document.createElement('div')
    modal.className = 'center-modal show'
    modal.style.zIndex = '600'
    modal.innerHTML = `
      <div style="text-align:center;padding:30px 24px;">
        <div style="font-size:48px;margin-bottom:8px;">🎉</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:4px;">+${points} 积分</div>
        <div style="font-size:14px;color:var(--text-3);">${reason}</div>
        <button class="btn btn-primary btn-block" style="margin-top:20px;" onclick="this.closest('.center-modal').remove()">好的</button>
      </div>
    `
    const mask = document.createElement('div')
    mask.className = 'bottom-sheet-mask show'
    mask.style.zIndex = '599'
    mask.addEventListener('click', () => { modal.remove(); mask.remove() })
    document.body.appendChild(mask)
    document.body.appendChild(modal)
  }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => App.init())
