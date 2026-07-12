const app = getApp()
const { 
  getSocialSecurityList,
  getSocialSecurityByEmployee,
  updateSocialSecurity,
  batchUpdateSocialSecurity,
  calculateSocialSecurityAmount,
  getEmployeeList,
  isMonthLocked
} = require('../../utils/mock-api.js')
const { 
  showToast, 
  showModal, 
  showLoading, 
  hideLoading,
  formatMoney,
  getInitials,
  getCurrentMonth
} = require('../../utils/util.js')

Page({
  data: {
    list: [],
    stats: null,
    keyword: '',
    department: 'all',
    departmentOptions: [],
    isAdmin: false,
    showEditModal: false,
    editData: {},
    currentEmployee: null,
    showBatchModal: false,
    batchData: {
      socialBase: '',
      housingFundBase: '',
      socialPersonalRate: '10.5',
      housingFundPersonalRate: '12'
    },
    selectedIds: [],
    isBatchMode: false,
    isLocked: false,
    currentMonth: ''
  },

  onLoad() {
    if (!app.checkLogin()) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }
    
    const isAdmin = app.globalData.role === 'admin'
    const currentMonth = getCurrentMonth()
    
    this.setData({ 
      isAdmin,
      currentMonth,
      departmentOptions: [
        { value: 'all', label: '全部部门' },
        ...app.globalData.departments.map(d => ({ value: d, label: d }))
      ]
    })
    
    this.checkLockStatus()
    this.loadList()
  },

  onShow() {
    if (app.checkLogin()) {
      this.checkLockStatus()
      this.loadList()
    }
  },

  onPullDownRefresh() {
    this.loadList()
    wx.stopPullDownRefresh()
  },

  checkLockStatus() {
    const locked = isMonthLocked(this.data.currentMonth)
    this.setData({ isLocked: locked })
  },

  loadList() {
    const { keyword, department } = this.data
    let list = getSocialSecurityList({ keyword, department, onlyActive: true })
    
    let totalSocial = 0
    let totalHousingFund = 0
    let totalAmount = 0
    
    list = list.map(item => {
      const amount = calculateSocialSecurityAmount(item)
      totalSocial += amount.socialPersonal
      totalHousingFund += amount.housingFundPersonal
      totalAmount += amount.total
      return {
        ...item,
        initials: getInitials(item.name),
        socialPersonal: formatMoney(amount.socialPersonal),
        housingFundPersonal: formatMoney(amount.housingFundPersonal),
        total: formatMoney(amount.total)
      }
    })
    
    const stats = {
      totalCount: list.length,
      totalSocialStr: formatMoney(totalSocial),
      totalHousingFundStr: formatMoney(totalHousingFund),
      totalAmountStr: formatMoney(totalAmount),
      avgAmountStr: list.length > 0 ? formatMoney(totalAmount / list.length) : '0'
    }
    
    this.setData({ list, stats })
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
    this.loadList()
  },

  onDepartmentChange(e) {
    const index = e.detail.value
    this.setData({
      department: this.data.departmentOptions[index].value
    })
    this.loadList()
  },

  toggleBatchMode() {
    if (!this.data.isAdmin) {
      showToast('当前账号无该操作权限')
      return
    }
    this.setData({
      isBatchMode: !this.data.isBatchMode,
      selectedIds: []
    })
  },

  toggleSelect(e) {
    const id = e.currentTarget.dataset.id
    const selectedIds = [...this.data.selectedIds]
    const index = selectedIds.indexOf(id)
    
    if (index > -1) {
      selectedIds.splice(index, 1)
    } else {
      selectedIds.push(id)
    }
    
    this.setData({ selectedIds })
  },

  selectAll() {
    if (this.data.selectedIds.length === this.data.list.length) {
      this.setData({ selectedIds: [] })
    } else {
      this.setData({ selectedIds: this.data.list.map(item => item.employeeId) })
    }
  },

  openBatchModal() {
    if (this.data.selectedIds.length === 0) {
      showToast('请先选择员工')
      return
    }
    
    this.setData({ showBatchModal: true })
  },

  closeBatchModal() {
    this.setData({ showBatchModal: false })
  },

  onBatchInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`batchData.${field}`]: e.detail.value
    })
  },

  async confirmBatchUpdate() {
    if (this.data.isLocked) {
      showToast('本月薪资已锁定，请先解锁再修改')
      return
    }
    
    const { socialBase, housingFundBase, socialPersonalRate, housingFundPersonalRate } = this.data.batchData
    
    const updateData = {}
    if (socialBase) updateData.socialBase = Number(socialBase)
    if (housingFundBase) updateData.housingFundBase = Number(housingFundBase)
    if (socialPersonalRate) updateData.socialPersonalRate = Number(socialPersonalRate) / 100
    if (housingFundPersonalRate) updateData.housingFundPersonalRate = Number(housingFundPersonalRate) / 100
    
    if (Object.keys(updateData).length === 0) {
      showToast('请至少填写一项')
      return
    }
    
    showLoading('批量更新中...')
    
    setTimeout(() => {
      batchUpdateSocialSecurity(this.data.selectedIds, updateData)
      hideLoading()
      showToast(`已更新${this.data.selectedIds.length}名员工`, 'success')
      this.setData({ 
        showBatchModal: false,
        isBatchMode: false,
        selectedIds: []
      })
      this.loadList()
    }, 800)
  },

  editItem(e) {
    if (!this.data.isAdmin) {
      showToast('当前账号无该操作权限')
      return
    }
    
    if (this.data.isLocked) {
      showToast('本月薪资已锁定，请先解锁再修改')
      return
    }
    
    const employeeId = e.currentTarget.dataset.employeeId
    const ss = getSocialSecurityByEmployee(employeeId)
    
    if (ss) {
      const amount = calculateSocialSecurityAmount(ss)
      this.setData({
        showEditModal: true,
        editData: {
          socialBase: String(ss.socialBase),
          housingFundBase: String(ss.housingFundBase),
          socialPersonalRate: String((ss.socialPersonalRate * 100).toFixed(1)),
          housingFundPersonalRate: String((ss.housingFundPersonalRate * 100).toFixed(1)),
          socialPersonal: formatMoney(amount.socialPersonal),
          housingFundPersonal: formatMoney(amount.housingFundPersonal),
          total: formatMoney(amount.total)
        },
        currentEmployee: ss
      })
    }
  },

  closeEditModal() {
    this.setData({ showEditModal: false })
  },

  onEditInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    
    this.setData({
      [`editData.${field}`]: value
    })
    
    this.recalculateAmount()
  },

  recalculateAmount() {
    const { socialBase, housingFundBase, socialPersonalRate, housingFundPersonalRate } = this.data.editData
    
    const socialBaseNum = Number(socialBase) || 0
    const housingBaseNum = Number(housingFundBase) || 0
    const socialRateNum = (Number(socialPersonalRate) || 0) / 100
    const housingRateNum = (Number(housingFundPersonalRate) || 0) / 100
    
    const socialPersonal = socialBaseNum * socialRateNum
    const housingFundPersonal = housingBaseNum * housingRateNum
    const total = socialPersonal + housingFundPersonal
    
    this.setData({
      'editData.socialPersonal': formatMoney(socialPersonal),
      'editData.housingFundPersonal': formatMoney(housingFundPersonal),
      'editData.total': formatMoney(total)
    })
  },

  async saveEdit() {
    if (this.data.isLocked) {
      showToast('本月薪资已锁定，请先解锁再修改')
      return
    }
    
    showLoading('保存中...')
    
    setTimeout(() => {
      const { editData, currentEmployee } = this.data
      
      updateSocialSecurity(currentEmployee.employeeId, {
        socialBase: Number(editData.socialBase),
        housingFundBase: Number(editData.housingFundBase),
        socialPersonalRate: Number(editData.socialPersonalRate) / 100,
        housingFundPersonalRate: Number(editData.housingFundPersonalRate) / 100
      })
      
      hideLoading()
      showToast('保存成功', 'success')
      this.setData({ showEditModal: false })
      this.loadList()
    }, 500)
  }
})
