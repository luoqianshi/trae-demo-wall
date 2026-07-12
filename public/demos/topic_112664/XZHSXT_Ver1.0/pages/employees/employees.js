const app = getApp()
const { 
  getEmployeeList, 
  deleteEmployee, 
  exportExcel 
} = require('../../utils/mock-api.js')
const { 
  showToast, 
  showModal, 
  showLoading, 
  hideLoading,
  getInitials,
  formatMoney 
} = require('../../utils/util.js')

Page({
  data: {
    employees: [],
    keyword: '',
    department: 'all',
    status: 'active-only',
    departmentOptions: [],
    statusOptions: [
      { value: 'active-only', label: '在职' },
      { value: 'inactive', label: '离职' },
      { value: 'all', label: '全部' }
    ],
    isAdmin: false,
    showFilter: false,
    stats: {
      total: 0,
      active: 0,
      departments: 0,
      avgSalary: '0'
    }
  },

  onLoad() {
    if (!app.checkLogin()) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }
    
    const isAdmin = app.globalData.role === 'admin'
    this.setData({ 
      isAdmin,
      departmentOptions: [
        { value: 'all', label: '全部部门' },
        ...app.globalData.departments.map(d => ({ value: d, label: d }))
      ]
    })
    
    this.loadEmployees()
  },

  onShow() {
    if (app.checkLogin()) {
      this.loadEmployees()
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({ selected: 0 })
      }
    }
  },

  onPullDownRefresh() {
    this.loadEmployees()
    wx.stopPullDownRefresh()
  },

  loadEmployees() {
    const { keyword, department, status } = this.data
    const employees = getEmployeeList({ keyword, department, status })
    
    const allEmployees = getEmployeeList({ status: 'all' })
    const activeEmployees = allEmployees.filter(e => e.status === 'active')
    const deptSet = new Set(activeEmployees.map(e => e.department))
    const totalSalary = activeEmployees.reduce((sum, e) => 
      sum + Number(e.baseSalary) + Number(e.postSalary) + Number(e.fixedAllowance), 0
    )
    const avgSalary = activeEmployees.length > 0 ? totalSalary / activeEmployees.length : 0
    
    this.setData({
      stats: {
        total: allEmployees.length,
        active: activeEmployees.length,
        departments: deptSet.size,
        avgSalary: formatMoney(avgSalary)
      }
    })
    
    const formatted = employees.map(emp => ({
      ...emp,
      initials: getInitials(emp.name),
      totalSalary: formatMoney(Number(emp.baseSalary) + Number(emp.postSalary) + Number(emp.fixedAllowance))
    }))
    
    this.setData({ employees: formatted })
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
    this.loadEmployees()
  },

  onDepartmentChange(e) {
    const index = e.detail.value
    this.setData({ 
      department: this.data.departmentOptions[index].value 
    })
    this.loadEmployees()
  },

  onStatusChange(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ status })
    this.loadEmployees()
  },

  toggleFilter() {
    this.setData({ showFilter: !this.data.showFilter })
  },

  addEmployee() {
    if (!this.data.isAdmin) {
      showToast('当前账号无该操作权限')
      return
    }
    wx.navigateTo({
      url: '/pages/employee-edit/employee-edit?mode=add'
    })
  },

  editEmployee(e) {
    if (!this.data.isAdmin) {
      showToast('当前账号无该操作权限')
      return
    }
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/employee-edit/employee-edit?mode=edit&id=${id}`
    })
  },

  viewEmployee(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/employee-edit/employee-edit?mode=view&id=${id}`
    })
  },

  async deleteEmployee(e) {
    if (!this.data.isAdmin) {
      showToast('当前账号无该操作权限')
      return
    }
    
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    
    const confirm = await showModal(
      '确认删除',
      `确定要删除员工「${name}」吗？删除后不可恢复。`,
      { confirmText: '删除', confirmColor: '#dc2626' }
    )
    
    if (confirm) {
      showLoading('删除中...')
      setTimeout(() => {
        deleteEmployee(id)
        hideLoading()
        showToast('删除成功', 'success')
        this.loadEmployees()
      }, 500)
    }
  },

  async exportEmployees() {
    if (!this.data.isAdmin) {
      showToast('当前账号无该操作权限')
      return
    }
    
    showLoading('生成报表中...')
    
    try {
      const result = await exportExcel('employees', 'all')
      hideLoading()
      
      if (result.success) {
        showToast('文件已生成，可保存至手机', 'success')
      }
    } catch (e) {
      hideLoading()
      showToast('导出失败')
    }
  }
})
