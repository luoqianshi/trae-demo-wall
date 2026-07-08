// pages/home/home.js
const app = getApp()

Page({
  data: {
    dateDisplay: '',
    greeting: '',
    displayName: '',
    isLoggedIn: false,
    userInfo: null,
    persistDays: 32,
    nutritionTarget: {
      calories: 1800,
      protein: 150,
      carb: 250,
      fat: 65,
      fiber: 25,
      vitaminC: 100,
      calcium: 800
    },
    todayCalories: 0,
    todayProtein: 0,
    todayCarb: 0,
    todayFat: 0,
    todayFiber: 0,
    todayVitaminC: 0,
    todayCalcium: 0,
    exerciseCalories: 0,
    calorieProgress: 0,
    proteinProgress: 0,
    carbProgress: 0,
    fatProgress: 0,
    fiberProgress: 0,
    vitaminCProgress: 0,
    calciumProgress: 0,
    calorieGap: 0,
    meals: {
      breakfast: { desc: '燕麦粥 + 鸡蛋', cal: 380 },
      lunch: { desc: '鸡胸肉沙拉 + 糙米', cal: 520 },
      dinner: { desc: '三文鱼 + 蔬菜汤', cal: 340 }
    },
    exerciseDesc: '跑步 30min · 消耗 280 kcal'
  },

  onLoad() {
    this.initData()
    this.drawProgressRing()
  },

  onShow() {
    // 每次显示页面时刷新数据和登录状态
    this.refreshLoginState()
    this.refreshData()
  },

  // 刷新登录状态
  refreshLoginState() {
    const isLoggedIn = app.globalData.isLoggedIn
    const userInfo = app.globalData.userInfo
    const hour = new Date().getHours()
    const greeting = app.getTimeGreeting()

    let displayName = '请先登录'
    if (isLoggedIn && userInfo && userInfo.nickName) {
      displayName = userInfo.nickName
    }

    this.setData({
      isLoggedIn,
      userInfo,
      greeting,
      displayName
    })
  },

  // 初始化数据
  initData() {
    const now = new Date()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    
    // 格式化日期
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    const greeting = app.getTimeGreeting()
    const isLoggedIn = app.globalData.isLoggedIn
    const userInfo = app.globalData.userInfo

    let displayName = '请先登录'
    if (isLoggedIn && userInfo && userInfo.nickName) {
      displayName = userInfo.nickName
    }

    this.setData({
      dateDisplay: `${month}月${day}日 ${weekDays[now.getDay()]}`,
      greeting,
      displayName,
      isLoggedIn,
      userInfo,
      nutritionTarget: app.globalData.nutritionTarget
    })
  },

  // 刷新数据
  refreshData() {
    const todayDiet = app.globalData.todayDiet
    const target = app.globalData.nutritionTarget
    
    // 计算进度
    const calorieProgress = Math.min(Math.round((todayDiet.totalCalories / target.calories) * 100), 100)
    const proteinProgress = Math.min(Math.round((todayDiet.totalProtein / target.protein) * 100), 100)
    const carbProgress = Math.min(Math.round((todayDiet.totalCarb / target.carb) * 100), 100)
    const fatProgress = Math.min(Math.round((todayDiet.totalFat / target.fat) * 100), 100)
    const fiberProgress = Math.min(Math.round(((todayDiet.totalFiber || 0) / target.fiber) * 100), 100)
    const vitaminCProgress = Math.min(Math.round(((todayDiet.totalVitaminC || 0) / target.vitaminC) * 100), 100)
    const calciumProgress = Math.min(Math.round(((todayDiet.totalCalcium || 0) / target.calcium) * 100), 100)
    
    // 计算热量缺口
    const calorieGap = todayDiet.totalCalories - app.globalData.todayExercise.totalCalories - target.calories

    this.setData({
      todayCalories: todayDiet.totalCalories,
      todayProtein: todayDiet.totalProtein,
      todayCarb: todayDiet.totalCarb,
      todayFat: todayDiet.totalFat,
      todayFiber: todayDiet.totalFiber || 0,
      todayVitaminC: todayDiet.totalVitaminC || 0,
      todayCalcium: todayDiet.totalCalcium || 0,
      exerciseCalories: app.globalData.todayExercise.totalCalories,
      calorieProgress,
      proteinProgress,
      carbProgress,
      fatProgress,
      fiberProgress,
      vitaminCProgress,
      calciumProgress,
      calorieGap
    })

    // 重绘进度环
    this.drawProgressRing(calorieProgress)
  },

  // 绘制进度环
  drawProgressRing(progress = 0) {
    setTimeout(() => {
      const query = wx.createSelectorQuery().in(this)
      query.select('#progressRing')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0] || !res[0].node) return

          try {
            const canvas = res[0].node
            const ctx = canvas.getContext('2d')

            const dpr = 2
            canvas.width = res[0].width * dpr
            canvas.height = res[0].height * dpr
            ctx.scale(dpr, dpr)

            const centerX = res[0].width / 2
            const centerY = res[0].height / 2
            const radius = Math.min(centerX, centerY) - 12
            const lineWidth = 12

            ctx.clearRect(0, 0, res[0].width, res[0].height)

            ctx.beginPath()
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
            ctx.strokeStyle = '#E5E0E5'
            ctx.lineWidth = lineWidth
            ctx.stroke()

            if (progress > 0) {
              ctx.beginPath()
              ctx.arc(centerX, centerY, radius, -Math.PI / 2, (-Math.PI / 2) + (2 * Math.PI * progress / 100))
              ctx.strokeStyle = '#96AD93'
              ctx.lineWidth = lineWidth
              ctx.lineCap = 'round'
              ctx.stroke()
            }

            ctx.fillStyle = '#424242'
            ctx.font = 'bold 28px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(`${progress}%`, centerX, centerY - 10)

            ctx.fillStyle = '#A6A6B2'
            ctx.font = '20px sans-serif'
            ctx.fillText('热量', centerX, centerY + 15)
          } catch (e) {
            console.error('[Canvas] 绘制失败:', e)
          }
        })
    }, 300)
  },

  // 点击头像/登录区域跳转到我的页面
  onTapAvatar() {
    wx.switchTab({
      url: '/pages/profile/profile'
    })
  },

  // 快速录入
  quickAdd(e) {
    const mealType = e.currentTarget.dataset.type
    // diet是tabBar页面，不能用navigateTo，通过全局变量传递餐次类型
    app.globalData.selectedMealType = mealType
    wx.switchTab({
      url: '/pages/diet/diet'
    })
  },

  // 导航到工具页面
  navigateToTool(e) {
    const path = e.currentTarget.dataset.path
    wx.navigateTo({ url: path })
  }
})
