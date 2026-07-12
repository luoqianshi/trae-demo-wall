const app = getApp()

Page({
  data: {
    currentRole: 'owner',
    roleOptions: [
      { key: 'owner', label: '业主', icon: '👤' },
      { key: 'committee', label: '业委会', icon: '🏛️' },
      { key: 'property', label: '物业', icon: '🏢' }
    ],
    roleConfig: null,
    menuGroups: [
      {
        title: '生活服务',
        items: [
          { icon: '📱', label: '门禁通行', path: '/pages/access/access' },
          { icon: '💰', label: '物业费', path: '/pages/payment/payment?type=property' },
          { icon: '🚗', label: '停车费', path: '/pages/payment/payment?type=parking' },
          { icon: '📋', label: '我的工单', path: '/pages/work-order/list' }
        ]
      },
      {
        title: '公共事务',
        items: [
          { icon: '📢', label: '小区公告', path: '/pages/announcement/list' },
          { icon: '📝', label: '公共议题', path: '/pages/issue/list' },
          { icon: '🗳️', label: '业主表决', path: '/pages/vote/list' },
          { icon: '🏛️', label: '业主大会', path: '/pages/meeting/meeting' }
        ]
      },
      {
        title: '信息公开',
        items: [
          { icon: '📊', label: '公共收益', path: '/pages/funds/funds?tab=income' },
          { icon: '🏦', label: '维修基金', path: '/pages/funds/funds?tab=fund' },
          { icon: '🔍', label: '巡检记录', path: '/pages/inspection/inspection?tab=records' },
          { icon: '📑', label: '身份认证', path: '' }
        ]
      },
      {
        title: '设置与帮助',
        items: [
          { icon: '⚙️', label: '设置', path: '' },
          { icon: '❓', label: '帮助中心', path: '' },
          { icon: '📞', label: '联系我们', path: '' },
          { icon: 'ℹ️', label: '关于', path: '' }
        ]
      }
    ]
  },

  onLoad() {
    this.setData({
      currentRole: app.globalData.currentRole,
      roleConfig: app.getRoleConfig()
    })
  },

  onShow() {
    this.setData({
      currentRole: app.globalData.currentRole,
      roleConfig: app.getRoleConfig()
    })
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().updateAndSetSelected('/pages/profile/profile')
    }
  },

  switchRole(e) {
    const role = e.currentTarget.dataset.role
    if (role === this.data.currentRole) return

    wx.showModal({
      title: '切换角色',
      content: `确定切换到${this.getRoleLabel(role)}视角吗？`,
      success: (res) => {
        if (res.confirm) {
          app.switchRole(role)
          this.setData({
            currentRole: role,
            roleConfig: app.getRoleConfig()
          })
          wx.showToast({ title: '切换成功', icon: 'success' })
          
          const homePath = this.getHomePath(role)
          setTimeout(() => {
            wx.switchTab({ url: homePath })
          }, 800)
        }
      }
    })
  },

  getRoleLabel(role) {
    const map = { owner: '业主', committee: '业委会', property: '物业' }
    return map[role] || role
  },

  getHomePath(role) {
    const map = {
      owner: '/pages/owner-home/owner-home',
      committee: '/pages/committee-workbench/workbench',
      property: '/pages/property-workbench/workbench'
    }
    return map[role] || '/pages/owner-home/owner-home'
  },

  goToMenu(e) {
    const path = e.currentTarget.dataset.path
    if (!path) {
      wx.showToast({ title: '功能开发中', icon: 'none' })
      return
    }
    if (path.startsWith('/pages/work-order') || path.startsWith('/pages/announcement')) {
      wx.switchTab({ url: path })
    } else {
      wx.navigateTo({ url: path })
    }
  }
})
