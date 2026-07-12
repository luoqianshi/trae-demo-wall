const app = getApp()
const { showToast, showLoading, hideLoading } = require('../../utils/util.js')

Page({
  data: {
    roleOptions: [
      { value: 'admin', label: '人事管理员', desc: '全部功能权限', icon: '👑' },
      { value: 'manager', label: '部门负责人', desc: '查看本部门数据', icon: '📋' },
      { value: 'employee', label: '普通员工', desc: '仅查看个人薪资', icon: '👤' }
    ],
    selectedRole: 'admin',
    employeeNo: '',
    agree: true,
    isLoading: false
  },

  onLoad() {
    if (app.checkLogin()) {
      this.navigateToHome()
    }
  },

  selectRole(e) {
    const role = e.currentTarget.dataset.role
    this.setData({ selectedRole: role })
    
    wx.vibrateShort({ type: 'light' })
  },

  onInputEmployeeNo(e) {
    this.setData({ employeeNo: e.detail.value })
  },

  toggleAgree() {
    this.setData({ agree: !this.data.agree })
  },

  handleLogin() {
    if (!this.data.agree) {
      showToast('请先同意用户协议')
      return
    }

    if (this.data.selectedRole === 'employee' && !this.data.employeeNo.trim()) {
      showToast('请输入工号')
      return
    }

    this.setData({ isLoading: true })
    showLoading('登录中...')

    setTimeout(() => {
      hideLoading()
      
      const role = this.data.selectedRole
      let userInfo = {}
      
      if (role === 'admin') {
        userInfo = {
          id: 'admin-001',
          name: '张人事',
          employeeNo: 'EMP0001',
          department: '人事部',
          position: '人事主管',
          avatar: ''
        }
      } else if (role === 'manager') {
        userInfo = {
          id: 'manager-001',
          name: '李经理',
          employeeNo: 'EMP0002',
          department: '技术部',
          position: '技术经理',
          avatar: ''
        }
      } else {
        userInfo = {
          id: 'employee-001',
          name: '王员工',
          employeeNo: this.data.employeeNo || 'EMP0003',
          department: '技术部',
          position: '前端工程师',
          avatar: ''
        }
      }

      const token = 'mock_token_' + Date.now()
      app.setUserInfo(userInfo, token, role)
      
      this.setData({ isLoading: false })
      showToast('登录成功', 'success')
      
      setTimeout(() => {
        this.navigateToHome()
      }, 800)
    }, 1000)
  },

  navigateToHome() {
    const role = app.globalData.role
    if (role === 'employee') {
      wx.switchTab({ url: '/pages/salary-query/salary-query' })
    } else if (role === 'manager') {
      wx.switchTab({ url: '/pages/salary-calc/salary-calc' })
    } else {
      wx.switchTab({ url: '/pages/employees/employees' })
    }
  }
})
