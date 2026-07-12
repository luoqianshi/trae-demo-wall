const app = getApp()
const { 
  getEmployeeById, 
  addEmployee, 
  updateEmployee 
} = require('../../utils/mock-api.js')
const { 
  showToast, 
  showLoading, 
  hideLoading,
  formatMoney 
} = require('../../utils/util.js')

Page({
  data: {
    mode: 'add',
    employeeId: '',
    form: {
      employeeNo: '',
      name: '',
      department: '',
      position: '',
      hireDate: '',
      status: 'active',
      baseSalary: '',
      postSalary: '',
      fixedAllowance: '',
      phone: ''
    },
    departmentOptions: [],
    statusOptions: [
      { value: 'active', label: '在职' },
      { value: 'inactive', label: '离职' }
    ],
    departmentIndex: 0,
    statusIndex: 0,
    isView: false,
    totalSalary: '0.00'
  },

  onLoad(options) {
    const mode = options.mode || 'add'
    const id = options.id || ''
    
    const departmentOptions = app.globalData.departments
    
    this.setData({
      mode,
      employeeId: id,
      isView: mode === 'view',
      departmentOptions
    })
    
    if (mode !== 'add' && id) {
      this.loadEmployee(id)
    }
    
    if (mode === 'add') {
      wx.setNavigationBarTitle({ title: '新增员工' })
      this.generateEmployeeNo()
    } else if (mode === 'edit') {
      wx.setNavigationBarTitle({ title: '编辑员工' })
    } else {
      wx.setNavigationBarTitle({ title: '员工详情' })
    }
  },

  generateEmployeeNo() {
    const timestamp = Date.now().toString().slice(-4)
    this.setData({
      'form.employeeNo': `EMP${timestamp}`
    })
  },

  loadEmployee(id) {
    const emp = getEmployeeById(id)
    if (emp) {
      const deptIndex = app.globalData.departments.indexOf(emp.department)
      const statusIndex = emp.status === 'active' ? 0 : 1
      
      this.setData({
        form: {
          employeeNo: emp.employeeNo,
          name: emp.name,
          department: emp.department,
          position: emp.position,
          hireDate: emp.hireDate,
          status: emp.status,
          baseSalary: String(emp.baseSalary),
          postSalary: String(emp.postSalary),
          fixedAllowance: String(emp.fixedAllowance),
          phone: emp.phone || ''
        },
        departmentIndex: deptIndex >= 0 ? deptIndex : 0,
        statusIndex,
        totalSalary: formatMoney(Number(emp.baseSalary) + Number(emp.postSalary) + Number(emp.fixedAllowance))
      })
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`form.${field}`]: value
    })
    
    if (['baseSalary', 'postSalary', 'fixedAllowance'].includes(field)) {
      this.calculateTotal()
    }
  },

  calculateTotal() {
    const { baseSalary, postSalary, fixedAllowance } = this.data.form
    const total = Number(baseSalary || 0) + Number(postSalary || 0) + Number(fixedAllowance || 0)
    this.setData({ totalSalary: formatMoney(total) })
  },

  onDepartmentChange(e) {
    const index = e.detail.value
    this.setData({
      departmentIndex: index,
      'form.department': this.data.departmentOptions[index]
    })
  },

  onStatusChange(e) {
    const index = e.detail.value
    this.setData({
      statusIndex: index,
      'form.status': this.data.statusOptions[index].value
    })
  },

  onHireDateChange(e) {
    this.setData({
      'form.hireDate': e.detail.value
    })
  },

  validateForm() {
    const { form } = this.data
    
    if (!form.employeeNo.trim()) {
      showToast('请输入工号')
      return false
    }
    if (!form.name.trim()) {
      showToast('请输入姓名')
      return false
    }
    if (!form.department) {
      showToast('请选择部门')
      return false
    }
    if (!form.position.trim()) {
      showToast('请输入岗位')
      return false
    }
    if (!form.hireDate) {
      showToast('请选择入职日期')
      return false
    }
    if (!form.baseSalary || isNaN(Number(form.baseSalary))) {
      showToast('请输入基本工资')
      return false
    }
    if (!form.postSalary || isNaN(Number(form.postSalary))) {
      showToast('请输入岗位工资')
      return false
    }
    if (!form.fixedAllowance || isNaN(Number(form.fixedAllowance))) {
      showToast('请输入固定补贴')
      return false
    }
    
    return true
  },

  async handleSave() {
    if (this.data.isView) return
    
    if (!this.validateForm()) return
    
    showLoading('保存中...')
    
    setTimeout(() => {
      try {
        const formData = {
          ...this.data.form,
          baseSalary: Number(Number(this.data.form.baseSalary).toFixed(2)),
          postSalary: Number(Number(this.data.form.postSalary).toFixed(2)),
          fixedAllowance: Number(Number(this.data.form.fixedAllowance).toFixed(2))
        }
        
        if (this.data.mode === 'add') {
          addEmployee(formData)
        } else {
          updateEmployee(this.data.employeeId, formData)
        }
        
        hideLoading()
        showToast('员工信息保存成功', 'success')
        
        setTimeout(() => {
          wx.navigateBack()
        }, 1000)
      } catch (e) {
        hideLoading()
        showToast(e.message || '保存失败')
      }
    }, 600)
  },

  goEdit() {
    this.setData({
      mode: 'edit',
      isView: false
    })
    wx.setNavigationBarTitle({ title: '编辑员工' })
  }
})
