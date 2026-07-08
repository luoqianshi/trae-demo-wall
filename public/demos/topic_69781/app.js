// app.js
App({
  globalData: {
    userInfo: null,     // { avatarUrl, nickName }
    isLoggedIn: false,
    // 用户档案
    profile: {
      height: 170,      // cm
      weight: 65,       // kg
      age: 25,
      gender: 'male',   // male/female
      activityLevel: 'medium', // low/medium/high/veryHigh
      goal: 'loseFat'   // loseFat/gainMuscle/maintain/controlSugar
    },
    // 营养目标（根据档案自动计算）
    nutritionTarget: {
      calories: 2000,
      protein: 150,
      carb: 250,
      fat: 65,
      fiber: 25,
      vitaminC: 100,
      calcium: 800
    },
    // 今日饮食记录
    todayDiet: {
      date: '',
      meals: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarb: 0,
      totalFat: 0,
      totalFiber: 0,
      totalVitaminC: 0,
      totalCalcium: 0
    },
    // 今日运动消耗
    todayExercise: {
      totalCalories: 0,
      records: []
    }
  },

  onLaunch() {
    // 初始化日期
    this.globalData.todayDiet.date = this.getTodayDate()
    
    // 从本地存储加载数据
    this.loadFromStorage()
    
    // 计算营养目标
    this.calculateNutritionTarget()
  },

  // 获取时段问候语
  getTimeGreeting() {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 9) return '早上好'
    if (hour >= 9 && hour < 11) return '上午好'
    if (hour >= 11 && hour < 13) return '中午好'
    if (hour >= 13 && hour < 18) return '下午好'
    if (hour >= 18 && hour < 22) return '晚上好'
    // 22:00 - 次日6:00
    if (hour >= 22 || hour < 3) return '晚安，该休息了'
    // 3:00 - 6:00
    return '夜深了，注意休息'
  },

  // 获取今日日期
  getTodayDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 计算基础代谢率 (BMR)
  calculateBMR(profile) {
    const { gender, age, height, weight } = profile
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161
    }
  },

  // 计算每日总能量消耗 (TDEE)
  calculateTDEE(bmr, activityLevel) {
    const factors = {
      low: 1.2,
      medium: 1.55,
      high: 1.725,
      veryHigh: 1.9
    }
    return bmr * factors[activityLevel]
  },

  // 根据目标调整热量
  adjustCaloriesByGoal(tdee, goal) {
    switch (goal) {
      case 'loseFat': return tdee - 500
      case 'gainMuscle': return tdee + 300
      case 'controlSugar': return tdee - 200
      default: return tdee
    }
  },

  // 计算营养目标
  calculateNutritionTarget() {
    const profile = this.globalData.profile
    const bmr = this.calculateBMR(profile)
    const tdee = this.calculateTDEE(bmr, profile.activityLevel)
    const targetCalories = Math.round(this.adjustCaloriesByGoal(tdee, profile.goal))
    
    // 根据目标调整营养素比例
    let proteinRatio, carbRatio, fatRatio
    switch (profile.goal) {
      case 'loseFat':
        proteinRatio = 0.35; carbRatio = 0.35; fatRatio = 0.30
        break
      case 'gainMuscle':
        proteinRatio = 0.30; carbRatio = 0.45; fatRatio = 0.25
        break
      default:
        proteinRatio = 0.25; carbRatio = 0.50; fatRatio = 0.25
    }
    
    this.globalData.nutritionTarget = {
      calories: targetCalories,
      protein: Math.round((targetCalories * proteinRatio) / 4),
      carb: Math.round((targetCalories * carbRatio) / 4),
      fat: Math.round((targetCalories * fatRatio) / 9)
    }
    
    // 保存到本地
    this.saveToStorage()
  },

  // 保存到本地存储
  saveToStorage() {
    try {
      wx.setStorageSync('profile', this.globalData.profile)
      wx.setStorageSync('todayDiet', this.globalData.todayDiet)
      wx.setStorageSync('nutritionTarget', this.globalData.nutritionTarget)
    } catch (e) {
      console.error('[App] 保存数据失败:', e)
    }
  },

  // 从本地存储加载
  loadFromStorage() {
    try {
      const profile = wx.getStorageSync('profile')
      if (profile) {
        this.globalData.profile = profile
      }
      
      const nutritionTarget = wx.getStorageSync('nutritionTarget')
      if (nutritionTarget) {
        this.globalData.nutritionTarget = nutritionTarget
      }

      // 加载用户登录信息
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo && userInfo.nickName) {
        this.globalData.userInfo = userInfo
        this.globalData.isLoggedIn = true
      }
    } catch (e) {
      console.error('[App] 加载数据失败:', e)
    }
  }
})
