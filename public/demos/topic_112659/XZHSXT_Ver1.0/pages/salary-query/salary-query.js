const app = getApp()
const { 
  getSalaryRecords,
  getSalaryStatistics,
  getEmployeeSalaryHistory,
  calculateAllSalary,
  exportExcel
} = require('../../utils/mock-api.js')
const { 
  showToast, 
  showLoading, 
  hideLoading,
  getCurrentMonth,
  formatMoney,
  getInitials
} = require('../../utils/util.js')

Page({
  data: {
    currentMonth: '',
    monthList: [],
    monthIndex: 0,
    role: 'employee',
    isAdmin: false,
    isManager: false,
    department: 'all',
    departmentOptions: [],
    keyword: '',
    activeTab: 'list',
    salaryList: [],
    statistics: null,
    deptStatistics: [],
    personalHistory: [],
    userInfo: null,
    showExportModal: false
  },

  onLoad() {
    if (!app.checkLogin()) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }
    
    const role = app.globalData.role
    const isAdmin = role === 'admin'
    const isManager = role === 'manager'
    const userInfo = app.globalData.userInfo
    const currentMonth = getCurrentMonth()
    const monthList = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthList.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    
    let deptOptions = [
      { value: 'all', label: '全部部门' },
      ...app.globalData.departments.map(d => ({ value: d, label: d }))
    ]
    
    if (isManager) {
      deptOptions = [{ value: userInfo.department, label: userInfo.department }]
    }
    
    this.setData({ 
      role,
      isAdmin,
      isManager,
      userInfo,
      currentMonth,
      monthList,
      departmentOptions: deptOptions,
      department: isManager ? userInfo.department : 'all'
    })
    
    this.loadData()
  },

  onShow() {
    if (app.checkLogin()) {
      this.loadData()
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        const tabBar = this.getTabBar()
        const role = app.globalData.role
        let selectedIndex = 0
        if (role === 'admin') {
          selectedIndex = 3
        } else if (role === 'manager') {
          selectedIndex = 1
        } else {
          selectedIndex = 0
        }
        tabBar.setData({ selected: selectedIndex })
      }
    }
  },

  onPullDownRefresh() {
    this.loadData()
    wx.stopPullDownRefresh()
  },

  loadData() {
    if (this.data.role === 'employee') {
      this.loadPersonalHistory()
    } else {
      this.loadSalaryList()
      this.loadStatistics()
    }
  },

  loadSalaryList() {
    const { currentMonth, keyword, department, role, userInfo } = this.data
    let params = { keyword }
    
    if (role === 'manager') {
      params.department = userInfo.department
    } else {
      params.department = department
    }
    
    let list = getSalaryRecords(currentMonth, params)
    
    list = list.map(item => ({
      ...item,
      initials: getInitials(item.name),
      netSalaryStr: formatMoney(item.netSalary),
      grossSalaryStr: formatMoney(item.grossSalary)
    }))
    
    this.setData({ salaryList: list })
  },

  loadStatistics() {
    const { currentMonth, department, role, userInfo } = this.data
    let params = {}
    
    if (role === 'manager') {
      params.department = userInfo.department
    } else if (department !== 'all') {
      params.department = department
    }
    
    const stats = getSalaryStatistics(currentMonth, params)
    
    if (stats) {
      stats.totalGrossStr = formatMoney(stats.totalGross)
      stats.totalNetStr = formatMoney(stats.totalNet)
      stats.avgGrossStr = formatMoney(stats.avgGross)
      stats.avgNetStr = formatMoney(stats.avgNet)
      
      let maxAvgNet = 0
      const deptStats = stats.departments.map(d => {
        const avgNet = Number(d.avgNet)
        if (avgNet > maxAvgNet) maxAvgNet = avgNet
        return {
          ...d,
          totalGrossStr: formatMoney(d.totalGross),
          totalNetStr: formatMoney(d.totalNet),
          avgGrossStr: formatMoney(d.avgGross),
          avgNetStr: formatMoney(d.avgNet),
          progressPercent: 0
        }
      })
      
      if (maxAvgNet > 0) {
        deptStats.forEach(d => {
          d.progressPercent = Math.round((Number(d.avgNet) / maxAvgNet) * 100)
        })
      }
      
      this.setData({ 
        statistics: stats,
        deptStatistics: deptStats
      })
    }
  },

  loadPersonalHistory() {
    const userInfo = app.globalData.userInfo
    const history = getEmployeeSalaryHistory(userInfo.id)
    
    let maxNet = 0
    let totalNet = 0
    const formatted = history.map(item => {
      const net = Number(item.netSalary)
      if (net > maxNet) maxNet = net
      totalNet += net
      
      const monthParts = item.month.split('-')
      const monthShort = monthParts[1] + '月'
      
      return {
        ...item,
        netSalaryStr: formatMoney(item.netSalary),
        grossSalaryStr: formatMoney(item.grossSalary),
        personalIncomeTaxStr: formatMoney(item.personalIncomeTax),
        monthShort,
        barHeight: 0
      }
    })
    
    if (maxNet > 0) {
      formatted.forEach(item => {
        item.barHeight = Math.round((Number(item.netSalary) / maxNet) * 100)
      })
    }
    
    const avgNet = history.length > 0 ? totalNet / history.length : 0
    
    this.setData({ 
      personalHistory: formatted,
      totalNetStr: formatMoney(totalNet),
      avgNetStr: formatMoney(avgNet),
      maxNetStr: formatMoney(maxNet)
    })
  },

  onMonthChange(e) {
    const index = e.detail.value
    this.setData({
      monthIndex: index,
      currentMonth: this.data.monthList[index]
    })
    this.loadData()
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
    this.loadSalaryList()
  },

  onDepartmentChange(e) {
    const index = e.detail.value
    this.setData({
      department: this.data.departmentOptions[index].value
    })
    this.loadData()
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  viewDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/salary-detail/salary-detail?id=${id}&month=${this.data.currentMonth}`
    })
  },

  viewHistoryDetail(e) {
    const id = e.currentTarget.dataset.id
    const month = e.currentTarget.dataset.month
    wx.navigateTo({
      url: `/pages/salary-detail/salary-detail?id=${id}&month=${month}`
    })
  },

  openExportModal() {
    if (!this.data.isAdmin) {
      showToast('当前账号无该操作权限')
      return
    }
    this.setData({ showExportModal: true })
  },

  closeExportModal() {
    this.setData({ showExportModal: false })
  },

  async exportStats(e) {
    const type = e.currentTarget.dataset.type
    showLoading('生成报表中...')
    
    try {
      const result = await exportExcel(type, this.data.currentMonth)
      hideLoading()
      this.setData({ showExportModal: false })
      
      if (result.success) {
        showToast('文件已生成，可保存至手机', 'success')
      }
    } catch (err) {
      hideLoading()
      showToast('导出失败')
    }
  },

  gotoSalaryCalc() {
    wx.switchTab({
      url: '/pages/salary-calc/salary-calc'
    })
  }
})
