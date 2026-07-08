// pages/exercise/exercise.js - 莫兰迪风格
const app = getApp()

Page({
  data: {
    // 热量缺口相关
    intakeCalories: 1240,
    burnCalories: 0,
    basalMetabolic: 1520,
    calorieDeficit: 0,
    deficitPercent: 0,
    // 运动类型分类
    exerciseType: '有氧',
    // 20+运动类型
    commonExercises: [
      // 有氧运动
      { id: 1, name: '跑步', icon: '跑', type: '有氧', caloriesPerMin: 10 },
      { id: 2, name: '快走', icon: '走', type: '有氧', caloriesPerMin: 5 },
      { id: 3, name: '骑行', icon: '骑', type: '有氧', caloriesPerMin: 8 },
      { id: 4, name: '游泳', icon: '游', type: '有氧', caloriesPerMin: 12 },
      { id: 5, name: '跳绳', icon: '绳', type: '有氧', caloriesPerMin: 13 },
      { id: 6, name: '椭圆机', icon: '椭', type: '有氧', caloriesPerMin: 9 },
      { id: 7, name: '划船机', icon: '划', type: '有氧', caloriesPerMin: 10 },
      { id: 8, name: '爬楼梯', icon: '梯', type: '有氧', caloriesPerMin: 11 },
      // 力量训练
      { id: 9, name: '深蹲', icon: '蹲', type: '力量', caloriesPerMin: 7 },
      { id: 10, name: '卧推', icon: '卧', type: '力量', caloriesPerMin: 6 },
      { id: 11, name: '硬拉', icon: '拉', type: '力量', caloriesPerMin: 8 },
      { id: 12, name: '引体向上', icon: '引', type: '力量', caloriesPerMin: 8 },
      { id: 13, name: '哑铃弯举', icon: '举', type: '力量', caloriesPerMin: 5 },
      { id: 14, name: '俯卧撑', icon: '撑', type: '力量', caloriesPerMin: 7 },
      { id: 15, name: '平板支撑', icon: '板', type: '力量', caloriesPerMin: 4 },
      { id: 16, name: '划船', icon: '桨', type: '力量', caloriesPerMin: 6 },
      // HIIT/其他
      { id: 17, name: '波比跳', icon: '波', type: 'HIIT', caloriesPerMin: 14 },
      { id: 18, name: 'HIIT燃脂', icon: '燃', type: 'HIIT', caloriesPerMin: 15 },
      { id: 19, name: '瑜伽', icon: '瑜', type: 'HIIT', caloriesPerMin: 4 },
      { id: 20, name: '普拉提', icon: '普', type: 'HIIT', caloriesPerMin: 5 },
      { id: 21, name: '拉伸', icon: '伸', type: 'HIIT', caloriesPerMin: 3 },
      { id: 22, name: '拳击', icon: '拳', type: 'HIIT', caloriesPerMin: 12 }
    ],
    selectedExercise: null,
    duration: '',
    showAddModal: false,
    // 自定义运动弹窗
    showCustomModal: false,
    customName: '',
    customCalories: '',
    customType: '有氧',
    // 记忆模式
    lastExerciseRecords: [],
    showLastSection: false,
    exerciseHistory: [],
    filteredExercises: [],
    todaySummary: {
      totalCalories: 0,
      totalTime: 0,
      exerciseCount: 0
    }
  },

  onLoad() {
    this.loadCustomExercises()
    this.loadHistory()
    this.loadLastRecords()
    this.filterExercises()
  },

  onShow() {
    this.calculateTodaySummary()
    this.loadLastRecords()
  },

  // 加载自定义运动
  loadCustomExercises() {
    try {
      const customExercises = wx.getStorageSync('customExercises') || []
      if (customExercises.length > 0) {
        const allExercises = [...this.data.commonExercises, ...customExercises]
        this.setData({ commonExercises: allExercises })
      }
    } catch (e) {
      console.error('[Exercise] 加载自定义运动失败:', e)
    }
  },

  // 加载上次运动记录（记忆模式）
  loadLastRecords() {
    try {
      const lastRecords = wx.getStorageSync('lastExerciseRecords') || []
      const today = new Date().toISOString().split('T')[0]
      // 只显示前一天及之前的记录
      const filtered = lastRecords.filter(r => r.date !== today)
      this.setData({
        lastExerciseRecords: filtered,
        showLastSection: filtered.length > 0
      })
    } catch (e) {
      console.error('[Exercise] 加载上次运动记录失败:', e)
    }
  },

  // 快速添加上次运动
  quickAddLast(e) {
    const record = e.currentTarget.dataset.record
    // 在运动列表中找到对应的运动
    const exercise = this.data.commonExercises.find(ex => ex.name === record.name)
    if (exercise) {
      this.setData({
        selectedExercise: exercise,
        duration: String(record.duration || ''),
        showAddModal: true
      })
    } else {
      wx.showToast({ title: '该运动类型已不存在', icon: 'none' })
    }
  },

  filterExercises() {
    const { commonExercises, exerciseType } = this.data
    const filtered = commonExercises.filter(ex => ex.type === exerciseType)
    this.setData({
      filteredExercises: filtered,
      selectedExercise: null,
      duration: ''
    })
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ exerciseType: type }, () => {
      this.filterExercises()
    })
  },

  selectExercise(e) {
    const exercise = e.currentTarget.dataset.exercise
    this.setData({ selectedExercise: exercise })
  },

  onDurationInput(e) {
    this.setData({ duration: e.detail.value })
  },

  showAddModal() {
    if (!this.data.selectedExercise) {
      wx.showToast({ title: '请先选择运动类型', icon: 'none' })
      return
    }
    this.setData({ showAddModal: true, duration: this.data.duration || '' })
  },

  onDurationModalInput(e) {
    this.setData({ duration: e.detail.value })
  },

  confirmAdd() {
    const { selectedExercise, duration, exerciseHistory } = this.data

    if (!duration || isNaN(duration) || parseFloat(duration) <= 0) {
      wx.showToast({ title: '请输入有效时长', icon: 'none' })
      return
    }

    const minutes = parseFloat(duration)
    const calories = Math.round(selectedExercise.caloriesPerMin * minutes)

    const newRecord = {
      id: Date.now(),
      name: selectedExercise.name,
      icon: selectedExercise.icon,
      type: selectedExercise.type,
      duration: minutes,
      calories: calories,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }

    this.setData({
      exerciseHistory: [newRecord, ...exerciseHistory],
      showAddModal: false,
      selectedExercise: null,
      duration: ''
    })

    wx.setStorageSync('exerciseHistory', this.data.exerciseHistory)

    // 保存到上次运动记录（记忆模式）
    this.saveLastRecord(newRecord)

    this.calculateTodaySummary()
    wx.showToast({ title: `消耗 ${calories} 千卡`, icon: 'success' })
  },

  // 保存上次运动记录
  saveLastRecord(record) {
    try {
      let lastRecords = wx.getStorageSync('lastExerciseRecords') || []
      // 同名运动只保留最近一条
      lastRecords = lastRecords.filter(r => r.name !== record.name)
      lastRecords.unshift({
        name: record.name,
        icon: record.icon,
        type: record.type,
        duration: record.duration,
        caloriesPerMin: Math.round(record.calories / record.duration),
        date: record.date
      })
      // 最多保存5条
      if (lastRecords.length > 5) {
        lastRecords = lastRecords.slice(0, 5)
      }
      wx.setStorageSync('lastExerciseRecords', lastRecords)
      this.setData({
        lastExerciseRecords: lastRecords,
        showLastSection: lastRecords.length > 0
      })
    } catch (e) {
      console.error('[Exercise] 保存上次运动记录失败:', e)
    }
  },

  cancelAdd() {
    this.setData({ showAddModal: false })
  },

  // === 自定义运动 ===
  openCustomModal() {
    this.setData({
      showCustomModal: true,
      customName: '',
      customCalories: '',
      customType: '有氧'
    })
  },

  closeCustomModal() {
    this.setData({ showCustomModal: false })
  },

  onCustomNameInput(e) {
    this.setData({ customName: e.detail.value })
  },

  onCustomCaloriesInput(e) {
    this.setData({ customCalories: e.detail.value })
  },

  onCustomTypeChange(e) {
    this.setData({ customType: e.detail.value })
  },

  selectCustomType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ customType: type })
  },

  saveCustomExercise() {
    const { customName, customCalories, customType, commonExercises } = this.data

    if (!customName.trim()) {
      wx.showToast({ title: '请输入运动名称', icon: 'none' })
      return
    }
    if (!customCalories || isNaN(customCalories) || parseFloat(customCalories) <= 0) {
      wx.showToast({ title: '请输入每分钟消耗卡路里', icon: 'none' })
      return
    }

    const newExercise = {
      id: Date.now(),
      name: customName.trim(),
      icon: customName.trim().charAt(0),
      type: customType,
      caloriesPerMin: parseFloat(customCalories),
      isCustom: true
    }

    const allExercises = [...commonExercises, newExercise]
    this.setData({
      commonExercises: allExercises,
      showCustomModal: false
    })

    // 保存自定义运动到本地
    try {
      const customList = allExercises.filter(ex => ex.isCustom)
      wx.setStorageSync('customExercises', customList)
    } catch (e) {
      console.error('[Exercise] 保存自定义运动失败:', e)
    }

    this.filterExercises()
    wx.showToast({ title: '自定义运动已添加', icon: 'success' })
  },

  calculateTodaySummary() {
    const exerciseHistory = wx.getStorageSync('exerciseHistory') || []
    const today = new Date().toISOString().split('T')[0]

    const todayRecords = exerciseHistory.filter(record => record.date === today)

    const totalCalories = todayRecords.reduce((sum, record) => sum + record.calories, 0)
    const totalTime = todayRecords.reduce((sum, record) => sum + record.duration, 0)

    // 计算热量缺口
    const intakeCalories = this.data.intakeCalories
    const basalMetabolic = this.data.basalMetabolic
    const burnCalories = totalCalories
    const calorieDeficit = intakeCalories - burnCalories - basalMetabolic
    const deficitPercent = Math.min(Math.max(Math.abs(calorieDeficit) / 800 * 100, 0), 100)

    // 同步到全局数据
    app.globalData.todayExercise.totalCalories = totalCalories

    this.setData({
      todaySummary: {
        totalCalories,
        totalTime,
        exerciseCount: todayRecords.length
      },
      exerciseHistory,
      burnCalories,
      calorieDeficit: Math.abs(calorieDeficit),
      deficitPercent
    })
  },

  loadHistory() {
    const exerciseHistory = wx.getStorageSync('exerciseHistory') || []

    const mockData = [
      { id: 1, name: '跑步', icon: '跑', type: '有氧', duration: 30, calories: 300, date: new Date().toISOString().split('T')[0], time: '07:30' },
      { id: 2, name: '深蹲', icon: '蹲', type: '力量', duration: 45, calories: 315, date: new Date().toISOString().split('T')[0], time: '18:00' },
      { id: 3, name: '游泳', icon: '游', type: '有氧', duration: 40, calories: 480, date: this.getPreviousDate(1), time: '06:45' },
      { id: 4, name: '瑜伽', icon: '瑜', type: 'HIIT', duration: 30, calories: 120, date: this.getPreviousDate(1), time: '19:00' },
      { id: 5, name: 'HIIT燃脂', icon: '燃', type: 'HIIT', duration: 20, calories: 300, date: this.getPreviousDate(2), time: '17:30' }
    ]

    if (exerciseHistory.length === 0) {
      this.setData({ exerciseHistory: mockData })
      wx.setStorageSync('exerciseHistory', mockData)
    } else {
      this.setData({ exerciseHistory })
    }

    this.calculateTodaySummary()
  },

  getPreviousDate(daysAgo) {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    return d.toISOString().split('T')[0]
  },

  deleteRecord(e) {
    const index = e.currentTarget.dataset.index
    wx.showModal({
      title: '删除记录',
      content: '确定要删除这条运动记录吗？',
      confirmColor: '#96AD93',
      success: (res) => {
        if (res.confirm) {
          let exerciseHistory = this.data.exerciseHistory
          exerciseHistory.splice(index, 1)
          this.setData({ exerciseHistory })
          wx.setStorageSync('exerciseHistory', exerciseHistory)
          this.calculateTodaySummary()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  }
})
