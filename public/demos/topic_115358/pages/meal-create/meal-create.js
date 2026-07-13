// pages/meal-create/meal-create.js
const app = getApp()

const STEPS = [
  { key: 'restaurant', label: '选餐厅', num: '1' },
  { key: 'time', label: '时间人数', num: '2' },
  { key: 'budget', label: '预算菜单', num: '3' },
  { key: 'vibe', label: '氛围偏好', num: '4' },
  { key: 'confirm', label: '确认发布', num: '5' }
]

const RESTAURANTS = [
  { id: 'r1', name: '老成都火锅', cuisine: '川菜', district: '锦江区', rating: 4.8, price: '¥120/人', image: 'linear-gradient(135deg, #F5E6D3, #E8D4B8)' },
  { id: 'r2', name: '粤味轩', cuisine: '粤菜', district: '武侯区', rating: 4.6, price: '¥150/人', image: 'linear-gradient(135deg, #E8F0E0, #D0E0C8)' },
  { id: 'r3', name: '樱花日料', cuisine: '日料', district: '高新区', rating: 4.9, price: '¥200/人', image: 'linear-gradient(135deg, #F0E5E8, #E0D0D5)' },
  { id: 'r4', name: '烟火烧烤', cuisine: '烧烤', district: '成华区', rating: 4.7, price: '¥80/人', image: 'linear-gradient(135deg, #F5E6D3, #E8C8A0)' }
]

const DISHES = ['毛肚', '鸭肠', '黄喉', '肥牛', '虾滑', '麻辣牛肉', '贡菜', '土豆片', '金针菇', '豆腐']

const VIBE_OPTIONS = [
  { id: 'chat', label: '轻松聊天', desc: '边吃边聊，认识新朋友', icon: 'message-circle' },
  { id: 'foodie', label: '美食专注', desc: '认真吃饭，少说话多吃菜', icon: 'utensils' },
  { id: 'quiet', label: '安静氛围', desc: '不打扰，各自享受美食', icon: 'volume-x' },
  { id: 'lively', label: '热闹氛围', desc: '人多热闹，气氛要嗨', icon: 'users' }
]

const DINER_OPTIONS = [
  { id: 'same', label: '相似食人格', desc: '口味相近，默契满分', icon: 'star' },
  { id: 'complement', label: '互补食人格', desc: '点菜搭配，各有所长', icon: 'refresh-cw' },
  { id: 'any', label: '都可以', desc: '随缘就好', icon: 'shuffle' }
]

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    steps: STEPS,
    currentStep: 0,
    progress: 20,
    restaurantId: '',
    restaurantName: '',
    date: '',
    time: '',
    peopleCount: 4,
    budget: 100,
    selectedDishes: [],
    selectedVibe: '',
    selectedDinerType: '',
    note: '',
    restaurants: RESTAURANTS,
    dishes: DISHES,
    vibeOptions: VIBE_OPTIONS,
    dinerOptions: DINER_OPTIONS,
    canNext: false
  },

  onLoad() {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 44,
      navBarHeight: app.globalData.navBarHeight || 44,
      date: dateStr,
      time: '19:00'
    })
  },

  onTapBack() {
    if (this.data.currentStep > 0) {
      this._goPrev()
    } else {
      wx.navigateBack()
    }
  },

  onTapClose() {
    wx.showModal({
      title: '退出编辑',
      content: '确定要退出吗？已填写的内容将不会保存。',
      confirmColor: '#D45A5A',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack()
        }
      }
    })
  },

  _goNext() {
    const next = this.data.currentStep + 1
    if (next >= STEPS.length) {
      this._submit()
      return
    }
    this.setData({
      currentStep: next,
      progress: (next + 1) * 20,
      canNext: this._canProceed(next)
    })
  },

  _goPrev() {
    const prev = this.data.currentStep - 1
    if (prev < 0) return
    this.setData({
      currentStep: prev,
      progress: (prev + 1) * 20,
      canNext: true
    })
  },

  _canProceed(stepIndex) {
    const d = this.data
    switch (stepIndex) {
      case 1: return !!d.restaurantId
      case 2: return !!d.date && !!d.time && d.peopleCount >= 2
      case 3: return d.budget > 0 && d.selectedDishes.length > 0
      case 4: return !!d.selectedVibe && !!d.selectedDinerType
      default: return true
    }
  },

  _submit() {
    wx.showLoading({ title: '发布中...' })
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({ title: '发布成功', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/meal-list/meal-list' })
      }, 1500)
    }, 1000)
  },

  onTapRestaurant(e) {
    const id = e.currentTarget.dataset.id
    const restaurant = RESTAURANTS.find(r => r.id === id)
    this.setData({
      restaurantId: id,
      restaurantName: restaurant.name,
      canNext: true
    })
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value, canNext: true })
  },

  onTimeChange(e) {
    this.setData({ time: e.detail.value, canNext: true })
  },

  onTapPeople(e) {
    const count = parseInt(e.currentTarget.dataset.count)
    this.setData({ peopleCount: count, canNext: true })
  },

  onBudgetChange(e) {
    this.setData({ budget: e.detail.value, canNext: true })
  },

  onTapDish(e) {
    const dish = e.currentTarget.dataset.dish
    const selected = [...this.data.selectedDishes]
    const idx = selected.indexOf(dish)
    if (idx >= 0) {
      selected.splice(idx, 1)
    } else {
      selected.push(dish)
    }
    this.setData({
      selectedDishes: selected,
      canNext: selected.length > 0
    })
  },

  onTapVibe(e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      selectedVibe: id,
      canNext: !!this.data.selectedDinerType
    })
  },

  onTapDinerType(e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      selectedDinerType: id,
      canNext: !!this.data.selectedVibe
    })
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value })
  },

  onTapNext() {
    if (!this.data.canNext) return
    this._goNext()
  },

  onTapPrev() {
    this._goPrev()
  }
})
