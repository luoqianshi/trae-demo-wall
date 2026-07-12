const app = getApp()
const { showModal, showToast } = require('../../utils/util.js')

Page({
  data: {
    userInfo: null,
    role: '',
    roleLabel: '',
    stats: {
      salaryMonths: 0,
      attendanceDays: 0,
      socialMonths: 0
    },
    quickMenu: [],
    menuList: []
  },

  onLoad() {
    if (!app.checkLogin()) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }
    
    this.loadUserInfo()
  },

  onShow() {
    if (app.checkLogin()) {
      this.loadUserInfo()
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        const tabBar = this.getTabBar()
        const role = app.globalData.role
        let selectedIndex = 0
        if (role === 'admin') {
          selectedIndex = 4
        } else if (role === 'manager') {
          selectedIndex = 2
        } else {
          selectedIndex = 1
        }
        tabBar.setData({ selected: selectedIndex })
      }
    }
  },

  loadUserInfo() {
    const userInfo = app.globalData.userInfo
    const role = app.globalData.role
    
    let roleLabel = '普通员工'
    if (role === 'admin') roleLabel = '人事管理员'
    else if (role === 'manager') roleLabel = '部门负责人'
    
    const menuList = this.buildMenuList(role)
    const quickMenu = this.buildQuickMenu(role)
    const stats = this.buildStats()
    
    this.setData({ userInfo, role, roleLabel, menuList, quickMenu, stats })
  },

  buildStats() {
    return {
      salaryMonths: 12,
      attendanceDays: 22,
      socialMonths: 36
    }
  },

  buildQuickMenu(role) {
    const allQuickMenus = [
      { key: 'salary-query', icon: '💰', title: '我的薪资', color: 'blue', path: '/pages/salary-query/salary-query', roles: ['admin', 'manager', 'employee'] },
      { key: 'attendance', icon: '📅', title: '考勤记录', color: 'green', path: '/pages/attendance/attendance', roles: ['admin', 'manager', 'employee'] },
      { key: 'social-security', icon: '🏦', title: '社保公积金', color: 'purple', path: '/pages/social-security/social-security', roles: ['admin'] },
      { key: 'employees', icon: '👥', title: '员工管理', color: 'orange', path: '/pages/employees/employees', roles: ['admin'] }
    ]
    
    return allQuickMenus.filter(menu => menu.roles.includes(role))
  },

  buildMenuList(role) {
    const allMenus = [
      {
        key: 'salary-items',
        icon: '📋',
        color: 'blue',
        title: '薪资项目',
        path: '/pages/salary-items/salary-items',
        roles: ['admin', 'manager', 'employee']
      },
      {
        key: 'about',
        icon: 'ℹ️',
        color: 'gray',
        title: '关于我们',
        path: '',
        roles: ['admin', 'manager', 'employee']
      },
      {
        key: 'settings',
        icon: '⚙️',
        color: 'gray',
        title: '系统设置',
        path: '',
        roles: ['admin', 'manager', 'employee']
      }
    ]
    
    return allMenus.filter(menu => menu.roles.includes(role))
  },

  handleMenuTap(e) {
    const key = e.currentTarget.dataset.key
    
    let menu = this.data.menuList.find(m => m.key === key)
    if (!menu) {
      menu = this.data.quickMenu.find(m => m.key === key)
    }
    
    if (!menu) return
    
    if (key === 'logout') {
      this.handleLogout()
      return
    }
    
    if (key === 'about') {
      this.showAbout()
      return
    }
    
    if (key === 'settings') {
      showToast('功能开发中')
      return
    }
    
    if (key === 'salary' || key === 'attendance' || key === 'social') {
      if (key === 'salary') {
        wx.switchTab({ url: '/pages/salary-query/salary-query' })
      } else if (key === 'attendance') {
        wx.switchTab({ url: '/pages/attendance/attendance' })
      } else if (key === 'social') {
        if (this.data.role === 'admin') {
          wx.navigateTo({ url: '/pages/social-security/social-security' })
        } else {
          showToast('暂无权限查看')
        }
      }
      return
    }
    
    if (menu.path) {
      const tabPages = ['/pages/employees/employees', '/pages/attendance/attendance', '/pages/salary-calc/salary-calc', '/pages/salary-query/salary-query', '/pages/profile/profile']
      if (tabPages.includes(menu.path)) {
        wx.switchTab({ url: menu.path })
      } else {
        wx.navigateTo({ url: menu.path })
      }
    }
  },

  async handleLogout() {
    const confirm = await showModal(
      '退出登录',
      '确定要退出当前账号吗？',
      { confirmText: '退出', confirmColor: '#dc2626' }
    )
    
    if (confirm) {
      app.logout()
      showToast('已退出登录')
    }
  },

  showAbout() {
    wx.showModal({
      title: '关于薪资核算系统',
      content: '版本：v1.0.0\n\n企业人事轻量化薪资管理工具，支持员工管理、考勤导入、社保公积金配置、月度薪资核算、薪资条查看、部门统计报表导出等功能。',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
