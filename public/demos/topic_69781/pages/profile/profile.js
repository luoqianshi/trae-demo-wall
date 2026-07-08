// pages/profile/profile.js - 莫兰迪风格
const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    userInfo: {
      avatarUrl: '',
      nickName: ''
    },
    bodyData: {
      height: 175,
      weight: 70,
      age: 28,
      gender: '男',
      activityLevel: '中等活跃'
    },
    fitnessGoal: '减脂',
    fitnessGoalValue: 'loseFat',
    goals: [
      { label: '减脂', value: 'loseFat' },
      { label: '增肌', value: 'gainMuscle' },
      { label: '维持', value: 'maintain' },
      { label: '控糖', value: 'controlSugar' }
    ],
    nutritionTargets: {
      calories: 2200,
      protein: 165,
      carbs: 275,
      fat: 73
    },
    nutritionProgress: {
      calories: 75,
      protein: 68,
      carbs: 60,
      fat: 55
    },
    weightRecords: [
      { date: '2024-01-15', weight: 70.5 },
      { date: '2024-01-14', weight: 70.8 },
      { date: '2024-01-13', weight: 71.0 }
    ],
    showEditModal: false,
    editField: '',
    editValue: '',
    showWeightModal: false,
    newWeight: '',
    showLoginModal: false,
    communityMenu: [
      { key: 'publish', label: '我的发布', icon: '📝', color: '#96AD93' },
      { key: 'market', label: '我的闲置', icon: '🏷️', color: '#E3A37D' },
      { key: 'orders', label: '我的订单', icon: '📦', color: '#B5B5C1' },
      { key: 'favorites', label: '我的收藏', icon: '❤️', color: '#CC858E' }
    ]
  },

  onLoad() {
    this.loadUserInfo()
    this.calculateNutrition()
  },

  onShow() {
    this.loadUserInfo()
  },

  // 加载本地存储的用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.nickName) {
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo
      })
    }
  },

  // 保存用户信息到本地存储
  saveUserInfo() {
    const { userInfo } = this.data
    if (userInfo.nickName) {
      wx.setStorageSync('userInfo', userInfo)
    }
  },

  // 获取头像（通过 chooseAvatar 按钮）
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({ 'userInfo.avatarUrl': avatarUrl }, () => {
      this.checkLoginComplete()
    })
  },

  // 获取昵称（通过 nickname 输入框）
  onNicknameInput(e) {
    const nickName = e.detail.value
    this.setData({ 'userInfo.nickName': nickName })
  },

  // 昵称输入框确认
  onNicknameConfirm(e) {
    const nickName = e.detail.value
    if (nickName) {
      this.setData({ 'userInfo.nickName': nickName }, () => {
        this.checkLoginComplete()
      })
    }
  },

  // 检查登录是否完成（头像+昵称都有）
  checkLoginComplete() {
    const { userInfo } = this.data
    if (userInfo.avatarUrl && userInfo.nickName) {
      // 调用 wx.login 获取登录凭证
      wx.login({
        success: (res) => {
          if (res.code) {
            // 同步到全局
            app.globalData.isLoggedIn = true
            app.globalData.userInfo = userInfo
            this.setData({ isLoggedIn: true })
            this.saveUserInfo()
            wx.showToast({ title: '登录成功', icon: 'success' })
          }
        },
        fail: () => {
          // 即使 wx.login 失败也保存用户信息
          app.globalData.isLoggedIn = true
          app.globalData.userInfo = userInfo
          this.setData({ isLoggedIn: true })
          this.saveUserInfo()
          wx.showToast({ title: '登录成功', icon: 'success' })
        }
      })
    }
  },

  // 点击未登录区域 - 弹出登录弹窗
  onTapLogin() {
    if (!this.data.isLoggedIn) {
      this.setData({ showLoginModal: true })
    }
  },

  // 关闭登录弹窗
  hideLoginModal() {
    this.setData({ showLoginModal: false })
  },

  // 登录弹窗中选择头像
  onLoginChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl
    this.setData({ 'userInfo.avatarUrl': avatarUrl })
  },

  // 登录弹窗中输入昵称
  onLoginNicknameInput(e) {
    this.setData({ 'userInfo.nickName': e.detail.value })
  },

  // 登录弹窗确认
  onLoginConfirm() {
    const { userInfo } = this.data
    if (!userInfo.avatarUrl) {
      wx.showToast({ title: '请选择头像', icon: 'none' })
      return
    }
    if (!userInfo.nickName || !userInfo.nickName.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    // 调用 wx.login
    wx.login({
      success: () => {
        this.doLoginSuccess()
      },
      fail: () => {
        this.doLoginSuccess()
      }
    })
  },

  doLoginSuccess() {
    const { userInfo } = this.data
    app.globalData.isLoggedIn = true
    app.globalData.userInfo = userInfo
    this.setData({
      isLoggedIn: true,
      showLoginModal: false
    })
    this.saveUserInfo()
    wx.showToast({ title: '登录成功', icon: 'success' })
  },

  // 社区菜单跳转
  onCommunityMenuTap(e) {
    const key = e.currentTarget.dataset.key
    switch (key) {
      case 'publish':
        wx.switchTab({
          url: '/pages/community/community'
        })
        break
      case 'market':
        wx.switchTab({
          url: '/pages/community/community'
        })
        break
      case 'orders':
        wx.showToast({ title: '暂无订单记录', icon: 'none' })
        break
      case 'favorites':
        wx.showToast({ title: '暂无收藏商品', icon: 'none' })
        break
    }
  },

  // 退出登录
  onLogout() {
    const that = this
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmColor: '#CC858E',
      success(res) {
        if (res.confirm) {
          wx.removeStorageSync('userInfo')
          // 清除全局状态
          app.globalData.isLoggedIn = false
          app.globalData.userInfo = null
          that.setData({
            isLoggedIn: false,
            userInfo: {
              avatarUrl: '',
              nickName: ''
            }
          })
          wx.showToast({ title: '已退出登录', icon: 'success' })
        }
      }
    })
  },

  calculateNutrition() {
    const { bodyData, fitnessGoal } = this.data
    let bmr = 0

    if (bodyData.gender === '男') {
      bmr = 88.362 + (13.397 * bodyData.weight) + (4.799 * bodyData.height) - (5.677 * bodyData.age)
    } else {
      bmr = 447.593 + (9.247 * bodyData.weight) + (3.098 * bodyData.height) - (4.330 * bodyData.age)
    }

    let activityMultiplier = 1.2
    switch (bodyData.activityLevel) {
      case '久坐': activityMultiplier = 1.2; break
      case '轻度活动': activityMultiplier = 1.375; break
      case '中等活跃': activityMultiplier = 1.55; break
      case '非常活跃': activityMultiplier = 1.725; break
      case '极度活跃': activityMultiplier = 1.9; break
    }

    let tdee = bmr * activityMultiplier
    let targetCalories = tdee

    switch (fitnessGoal) {
      case '减脂': targetCalories = tdee - 500; break
      case '增肌': targetCalories = tdee + 300; break
      case '控糖': targetCalories = tdee - 200; break
    }

    const protein = Math.round(targetCalories * 0.3 / 4)
    const carbs = Math.round(targetCalories * 0.45 / 4)
    const fat = Math.round(targetCalories * 0.25 / 9)

    // 计算营养进度（模拟值）
    const nutritionProgress = {
      calories: Math.min(Math.round(targetCalories / 2500 * 100), 100),
      protein: Math.min(Math.round(protein / 200 * 100), 100),
      carbs: Math.min(Math.round(carbs / 350 * 100), 100),
      fat: Math.min(Math.round(fat / 100 * 100), 100)
    }

    this.setData({
      nutritionTargets: {
        calories: Math.round(targetCalories),
        protein,
        carbs,
        fat
      },
      nutritionProgress
    })
  },

  onEdit(e) {
    const field = e.currentTarget ? e.currentTarget.dataset.field : e
    const valueMap = {
      height: this.data.bodyData.height,
      weight: this.data.bodyData.weight,
      age: this.data.bodyData.age,
      gender: this.data.bodyData.gender,
      activityLevel: this.data.bodyData.activityLevel
    }
    this.setData({
      showEditModal: true,
      editField: field,
      editValue: String(valueMap[field] || '')
    })
  },

  onEditConfirm() {
    const { editField, editValue, bodyData } = this.data
    let value = editValue

    if (['height', 'weight', 'age'].includes(editField)) {
      value = parseFloat(editValue)
    }

    this.setData({
      [`bodyData.${editField}`]: value,
      showEditModal: false
    }, () => {
      this.calculateNutrition()
    })
  },

  onEditCancel() {
    this.setData({ showEditModal: false })
  },

  onEditInput(e) {
    this.setData({ editValue: e.detail.value })
  },

  selectGoal(e) {
    const goal = e.currentTarget.dataset.goal
    const goalObj = this.data.goals.find(g => g.value === goal)
    this.setData({
      fitnessGoal: goalObj ? goalObj.label : goal,
      fitnessGoalValue: goal
    }, () => {
      this.calculateNutrition()
    })
  },

  showAddWeight() {
    this.setData({ showWeightModal: true, newWeight: '' })
  },

  onWeightInput(e) {
    this.setData({ newWeight: e.detail.value })
  },

  addWeightRecord() {
    const { newWeight, weightRecords } = this.data
    if (!newWeight || isNaN(newWeight)) {
      wx.showToast({ title: '请输入有效体重', icon: 'none' })
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const newRecord = { date: today, weight: parseFloat(newWeight) }

    this.setData({
      weightRecords: [newRecord, ...weightRecords].slice(0, 10),
      ['bodyData.weight']: parseFloat(newWeight),
      showWeightModal: false
    }, () => {
      this.calculateNutrition()
      wx.showToast({ title: '记录成功', icon: 'success' })
    })
  },

  cancelAddWeight() {
    this.setData({ showWeightModal: false })
  },

  deleteWeightRecord(e) {
    const index = e.currentTarget.dataset.index
    const weightRecords = this.data.weightRecords.filter((_, i) => i !== index)
    this.setData({ weightRecords })
  },

  shareAppMessage() {
    return {
      title: '我的健身档案',
      path: '/pages/profile/profile'
    }
  }
})
