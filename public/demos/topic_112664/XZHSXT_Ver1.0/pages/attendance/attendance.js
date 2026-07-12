const app = getApp()
const { 
  getAttendanceList, 
  getAttendanceByEmployee,
  saveAttendance,
  calculateAttendanceDeduction,
  importAttendance,
  getEmployeeList,
  getEmployeeById,
  isMonthLocked
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
    attendanceList: [],
    keyword: '',
    department: 'all',
    departmentOptions: [],
    isAdmin: false,
    showEditModal: false,
    editData: {},
    currentEmployee: null,
    showImportModal: false,
    importResult: null,
    isLocked: false,
    expandedId: '',
    stats: {
      totalEmployees: 0,
      normalCount: 0,
      hasDeduction: 0,
      totalDeduction: '0'
    }
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
    this.loadAttendance()
  },

  onShow() {
    if (app.checkLogin()) {
      this.checkLockStatus()
      this.loadAttendance()
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({ selected: 1 })
      }
    }
  },

  onPullDownRefresh() {
    this.loadAttendance()
    wx.stopPullDownRefresh()
  },

  checkLockStatus() {
    const locked = isMonthLocked(this.data.currentMonth)
    this.setData({ isLocked: locked })
  },

  loadAttendance() {
    const { currentMonth, keyword, department } = this.data
    let list = getAttendanceList(currentMonth, { keyword, department })
    
    const activeEmployees = getEmployeeList({ status: 'active-only' })
    const activeEmployeeIds = activeEmployees.map(e => e.id)
    
    const existingIds = list.map(a => a.employeeId)
    activeEmployees.forEach(emp => {
      if (!existingIds.includes(emp.id)) {
        list.push({
          id: '',
          employeeId: emp.id,
          employeeNo: emp.employeeNo,
          name: emp.name,
          department: emp.department,
          month: currentMonth,
          workDays: 22,
          personalLeaveDays: 0,
          sickLeaveDays: 0,
          absentDays: 0,
          lateTimes: 0,
          lateMinutes: 0,
          personalLeaveDeduction: 0,
          sickLeaveDeduction: 0,
          lateDeduction: 0,
          otherDeduction: 0,
          totalDeduction: 0,
          isNew: true
        })
      }
    })
    
    list = list.map(item => {
      const totalDed = Number(item.personalLeaveDeduction || 0) + 
        Number(item.sickLeaveDeduction || 0) + 
        Number(item.lateDeduction || 0) + 
        Number(item.otherDeduction || 0)
      return {
        ...item,
        initials: getInitials(item.name),
        totalDeduction: formatMoney(totalDed),
        hasDeduction: totalDed > 0,
        statusLevel: this.getStatusLevel(item, totalDed)
      }
    })
    
    const totalEmployees = list.length
    const hasDeductionCount = list.filter(i => i.hasDeduction).length
    const totalDeductionSum = list.reduce((sum, i) => sum + Number(i.totalDeduction.replace(/,/g, '')), 0)
    
    this.setData({
      attendanceList: list,
      stats: {
        totalEmployees,
        normalCount: totalEmployees - hasDeductionCount,
        hasDeduction: hasDeductionCount,
        totalDeduction: formatMoney(totalDeductionSum)
      }
    })
  },

  getStatusLevel(item, totalDed) {
    if (totalDed === 0 && Number(item.absentDays) === 0) return 'normal'
    if (totalDed > 0 && totalDed < 500) return 'warning'
    return 'danger'
  },

  onMonthChange(e) {
    const index = e.detail.value
    this.setData({
      monthIndex: index,
      currentMonth: this.data.monthList[index]
    })
    this.checkLockStatus()
    this.loadAttendance()
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
    this.loadAttendance()
  },

  onDepartmentChange(e) {
    const index = e.detail.value
    this.setData({
      department: this.data.departmentOptions[index].value
    })
    this.loadAttendance()
  },

  toggleExpand(e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      expandedId: this.data.expandedId === id ? '' : id
    })
  },

  editAttendance(e) {
    if (!this.data.isAdmin) {
      showToast('当前账号无该操作权限')
      return
    }
    
    if (this.data.isLocked) {
      showToast('本月薪资已锁定，请先解锁再修改')
      return
    }
    
    const employeeId = e.currentTarget.dataset.employeeId
    const employee = getEmployeeById(employeeId)
    const attendance = getAttendanceByEmployee(employeeId, this.data.currentMonth)
    
    const editData = attendance ? {
      workDays: String(attendance.workDays),
      personalLeaveDays: String(attendance.personalLeaveDays),
      sickLeaveDays: String(attendance.sickLeaveDays),
      absentDays: String(attendance.absentDays),
      lateTimes: String(attendance.lateTimes),
      lateMinutes: String(attendance.lateMinutes),
      otherDeduction: String(attendance.otherDeduction)
    } : {
      workDays: '22',
      personalLeaveDays: '0',
      sickLeaveDays: '0',
      absentDays: '0',
      lateTimes: '0',
      lateMinutes: '0',
      otherDeduction: '0'
    }
    
    const deduction = calculateAttendanceDeduction(employee, editData)
    
    this.setData({
      showEditModal: true,
      editData: {
        ...editData,
        personalLeaveDeduction: formatMoney(deduction.personalLeaveDeduction),
        sickLeaveDeduction: formatMoney(deduction.sickLeaveDeduction),
        lateDeduction: formatMoney(deduction.lateDeduction),
        totalDeduction: formatMoney(deduction.totalDeduction)
      },
      currentEmployee: employee
    })
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
    
    this.recalculateDeduction()
  },

  recalculateDeduction() {
    if (!this.data.currentEmployee) return
    
    const deduction = calculateAttendanceDeduction(this.data.currentEmployee, this.data.editData)
    
    this.setData({
      'editData.personalLeaveDeduction': formatMoney(deduction.personalLeaveDeduction),
      'editData.sickLeaveDeduction': formatMoney(deduction.sickLeaveDeduction),
      'editData.lateDeduction': formatMoney(deduction.lateDeduction),
      'editData.totalDeduction': formatMoney(deduction.totalDeduction)
    })
  },

  recalcAllDeduction() {
    if (!this.data.isAdmin) {
      showToast('当前账号无该操作权限')
      return
    }
    
    if (this.data.isLocked) {
      showToast('本月薪资已锁定，请先解锁再修改')
      return
    }
    
    showLoading('重新计算中...')
    
    const { currentMonth } = this.data
    const employees = getEmployeeList({ status: 'active-only' })
    
    setTimeout(() => {
      employees.forEach(emp => {
        const attendance = getAttendanceByEmployee(emp.id, currentMonth)
        if (attendance) {
          const deduction = calculateAttendanceDeduction(emp, attendance)
          saveAttendance({
            ...attendance,
            personalLeaveDeduction: deduction.personalLeaveDeduction,
            sickLeaveDeduction: deduction.sickLeaveDeduction,
            lateDeduction: deduction.lateDeduction
          })
        }
      })
      
      hideLoading()
      showToast('扣款重新计算完成', 'success')
      this.loadAttendance()
    }, 800)
  },

  async saveEdit() {
    if (this.data.isLocked) {
      showToast('本月薪资已锁定，请先解锁再修改')
      return
    }
    
    showLoading('保存中...')
    
    setTimeout(() => {
      const { currentMonth, editData, currentEmployee } = this.data
      
      saveAttendance({
        employeeId: currentEmployee.id,
        employeeNo: currentEmployee.employeeNo,
        name: currentEmployee.name,
        department: currentEmployee.department,
        month: currentMonth,
        workDays: Number(editData.workDays),
        personalLeaveDays: Number(editData.personalLeaveDays),
        sickLeaveDays: Number(editData.sickLeaveDays),
        absentDays: Number(editData.absentDays),
        lateTimes: Number(editData.lateTimes),
        lateMinutes: Number(editData.lateMinutes),
        otherDeduction: Number(editData.otherDeduction),
        personalLeaveDeduction: Number(editData.personalLeaveDeduction),
        sickLeaveDeduction: Number(editData.sickLeaveDeduction),
        lateDeduction: Number(editData.lateDeduction)
      })
      
      hideLoading()
      showToast('保存成功', 'success')
      this.setData({ showEditModal: false })
      this.loadAttendance()
    }, 500)
  },

  handleImport() {
    if (!this.data.isAdmin) {
      showToast('当前账号无该操作权限')
      return
    }
    
    if (this.data.isLocked) {
      showToast('本月薪资已锁定，请先解锁再修改')
      return
    }
    
    showLoading('导入中...')
    
    setTimeout(() => {
      const result = importAttendance(this.data.currentMonth, null)
      hideLoading()
      
      this.setData({
        showImportModal: true,
        importResult: result
      })
      
      if (result.successCount > 0) {
        showToast(`考勤导入完成，成功${result.successCount}条`)
        this.loadAttendance()
      }
    }, 1500)
  },

  closeImportModal() {
    this.setData({ showImportModal: false })
  },

  gotoSalaryCalc() {
    wx.switchTab({
      url: '/pages/salary-calc/salary-calc'
    })
  }
})
