const app = getApp()
const { 
  calculateAllSalary,
  getSalaryRecords,
  isMonthLocked,
  lockMonth,
  unlockMonth,
  getSalaryStatistics,
  exportExcel
} = require('../../utils/mock-api.js')
const { 
  showToast, 
  showModal, 
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
    salaryList: [],
    keyword: '',
    department: 'all',
    departmentOptions: [],
    isAdmin: false,
    isLocked: false,
    hasCalculated: false,
    statistics: null,
    expandedId: '',
    showExportModal: false,
    isCalculating: false,
    deptStats: []
  },

  onLoad() {
    if (!app.checkLogin()) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }
    
    const isAdmin = app.globalData.role === 'admin'
    const currentMonth = getCurrentMonth()
    const monthList = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthList.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    
    this.setData({ 
      isAdmin,
      currentMonth,
      monthList,
      departmentOptions: [
        { value: 'all', label: '全部部门' },
        ...app.globalData.departments.map(d => ({ value: d, label: d }))
      ]
    })
    
    this.checkLockStatus()
    this.loadSalaryData()
  },

  onShow() {
    if (app.checkLogin()) {
      this.checkLockStatus()
      this.loadSalaryData()
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        const role = app.globalData.role
        let selectedIndex = 2
        if (role === 'manager') selectedIndex = 0
        this.getTabBar().setData({ selected: selectedIndex })
      }
    }
  },

  onPullDownRefresh() {
    this.loadSalaryData()
    wx.stopPullDownRefresh()
  },

  checkLockStatus() {
    const locked = isMonthLocked(this.data.currentMonth)
    this.setData({ isLocked: locked })
  },

  loadSalaryData() {
    const { currentMonth, keyword, department } = this.data
    let list = getSalaryRecords(currentMonth, { keyword, department })
    
    const hasCalculated = list.length > 0
    
    list = list.map(item => ({
      ...item,
      initials: getInitials(item.name),
      grossSalaryStr: formatMoney(item.grossSalary),
      preTaxSalaryStr: formatMoney(item.preTaxSalary),
      personalIncomeTaxStr: formatMoney(item.personalIncomeTax),
      netSalaryStr: formatMoney(item.netSalary),
      deductionTotal: formatMoney(
        Number(item.socialPersonal || 0) + 
        Number(item.housingFundPersonal || 0) + 
        Number(item.personalIncomeTax || 0)
      )
    }))
    
    const statistics = hasCalculated ? getSalaryStatistics(currentMonth, { department }) : null
    
    if (statistics) {
      statistics.totalGrossStr = formatMoney(statistics.totalGross)
      statistics.totalNetStr = formatMoney(statistics.totalNet)
      statistics.avgGrossStr = formatMoney(statistics.avgGross)
      statistics.avgNetStr = formatMoney(statistics.avgNet)
      statistics.totalTaxStr = formatMoney(statistics.totalTax || 0)
    }
    
    let deptStats = []
    if (hasCalculated && department === 'all') {
      const deptMap = {}
      list.forEach(item => {
        if (!deptMap[item.department]) {
          deptMap[item.department] = { count: 0, totalNet: 0 }
        }
        deptMap[item.department].count++
        deptMap[item.department].totalNet += Number(item.netSalary)
      })
      deptStats = Object.entries(deptMap).map(([dept, data]) => ({
        department: dept,
        count: data.count,
        avgNet: formatMoney(data.totalNet / data.count)
      })).sort((a, b) => b.count - a.count)
    }
    
    this.setData({ 
      salaryList: list, 
      hasCalculated,
      statistics,
      deptStats
    })
  },

  onMonthChange(e) {
    const index = e.detail.value
    this.setData({
      monthIndex: index,
      currentMonth: this.data.monthList[index]
    })
    this.checkLockStatus()
    this.loadSalaryData()
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
    this.loadSalaryData()
  },

  onDepartmentChange(e) {
    const index = e.detail.value
    this.setData({
      department: this.data.departmentOptions[index].value
    })
    this.loadSalaryData()
  },

  async calculateSalary() {
    if (!this.data.isAdmin) {
      showToast('当前账号无该操作权限')
      return
    }
    
    if (this.data.isLocked) {
      showToast('本月薪资已锁定，请先解锁再核算')
      return
    }
    
    const confirm = await showModal(
      '确认核算',
      `确定要核算 ${this.data.currentMonth} 月份薪资吗？`,
      { confirmText: '开始核算' }
    )
    
    if (!confirm) return
    
    this.setData({ isCalculating: true })
    showLoading('正在核算...')
    
    setTimeout(() => {
      calculateAllSalary(this.data.currentMonth)
      hideLoading()
      this.setData({ isCalculating: false })
      showToast('当月薪资核算完成', 'success')
      this.loadSalaryData()
      
      wx.vibrateShort({ type: 'medium' })
    }, 1800)
  },

  async toggleLock() {
    if (!this.data.isAdmin) {
      showToast('当前账号无该操作权限')
      return
    }
    
    if (!this.data.hasCalculated) {
      showToast('请先完成薪资核算')
      return
    }
    
    if (this.data.isLocked) {
      const confirm = await showModal(
        '确认解锁',
        '解锁后可修改数据，确定要解锁吗？',
        { confirmText: '解锁', confirmColor: '#d97706' }
      )
      
      if (confirm) {
        unlockMonth(this.data.currentMonth)
        this.setData({ isLocked: false })
        showToast('已解锁')
      }
    } else {
      const confirm = await showModal(
        '确认锁定',
        '锁定后无法修改数据，确定要锁定吗？',
        { confirmText: '锁定' }
      )
      
      if (confirm) {
        lockMonth(this.data.currentMonth)
        this.setData({ isLocked: true })
        showToast('已锁定', 'success')
      }
    }
  },

  toggleExpand(e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      expandedId: this.data.expandedId === id ? '' : id
    })
  },

  viewDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/salary-detail/salary-detail?id=${id}&month=${this.data.currentMonth}`
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

  async exportSalary(e) {
    const type = e.currentTarget.dataset.type
    
    if (!this.data.hasCalculated) {
      showToast('暂无薪资数据可导出')
      return
    }
    
    showLoading('生成文件中...')
    
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

  gotoAttendance() {
    wx.switchTab({
      url: '/pages/attendance/attendance'
    })
  }
})
