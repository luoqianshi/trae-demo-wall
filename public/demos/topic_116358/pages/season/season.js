Page({
  data: {
    currentMonth: '五月·仲夏',
    currentYear: 2025,
    currentMonthNum: 5,
    todayTip: '今日适宜补水、松土',
    solarTerm: '芒种',
    weeks: [],
    todayTasks: [
      {
        id: '1',
        type: 'water',
        title: '给琴叶榕浇水',
        desc: '距上次浇水已过7天',
        completed: false
      },
      {
        id: '2',
        type: 'sun',
        title: '为多肉晒太阳',
        desc: '今日阳光和煦，适合户外',
        completed: true
      },
      {
        id: '3',
        type: 'fertilize',
        title: '龟背竹施肥',
        desc: '生长旺季，需养分补充',
        completed: false
      }
    ],
    weekHeader: ['一', '二', '三', '四', '五', '六', '日']
  },

  onLoad() {
    this.generateCalendar()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  generateCalendar() {
    const year = 2025
    const month = 5
    const firstDay = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    
    const dayOfWeek = firstDay === 0 ? 6 : firstDay - 1
    
    const today = 11
    
    const waterDays = [3, 6, 10, 14, 18, 22, 26, 30]
    const solarTerms = { 6: '芒种' }
    
    const weeks = []
    let currentWeek = []
    
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push({ day: '', isEmpty: true })
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today
      const isWater = waterDays.includes(day)
      const isSolarTerm = solarTerms.hasOwnProperty(day)
      const solarTermName = solarTerms[day] || ''
      
      currentWeek.push({
        day: day,
        isToday: isToday,
        isWater: isWater,
        isSolarTerm: isSolarTerm,
        solarTermName: solarTermName
      })
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ day: '', isEmpty: true })
      }
      weeks.push(currentWeek)
    }
    
    this.setData({ weeks })
  },

  toggleTask(e) {
    const id = e.currentTarget.dataset.id
    const tasks = this.data.todayTasks.map(task => {
      if (task.id === id) {
        return { ...task, completed: !task.completed }
      }
      return task
    })
    this.setData({ todayTasks: tasks })
  },

  prevMonth() {
    wx.showToast({ title: '上月', icon: 'none' })
  },

  nextMonth() {
    wx.showToast({ title: '下月', icon: 'none' })
  },

  addRecord() {
    wx.showActionSheet({
      itemList: ['浇水记录', '施肥记录', '晒太阳', '其他'],
      success: (res) => {
        wx.showToast({ title: '已添加记录', icon: 'success' })
      }
    })
  },

  goToGrowth() {
    wx.navigateTo({ url: '/pages/growth/growth' })
  }
})
