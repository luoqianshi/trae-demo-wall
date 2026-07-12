App({
  globalData: {
    currentRole: 'owner',
    userInfo: null,
    communityInfo: {
      name: '阳光花园小区',
      building: '3栋',
      room: '1802'
    }
  },

  onLaunch() {
    const savedRole = wx.getStorageSync('currentRole')
    if (savedRole) {
      this.globalData.currentRole = savedRole
    }
  },

  switchRole(role) {
    this.globalData.currentRole = role
    wx.setStorageSync('currentRole', role)
  },

  getRoleConfig() {
    const roleMap = {
      owner: {
        name: '业主',
        tabBar: [
          { pagePath: 'pages/owner-home/owner-home', text: '首页', icon: 'home' },
          { pagePath: 'pages/announcement/list', text: '公告', icon: 'notice' },
          { pagePath: 'pages/work-order/list', text: '工单', icon: 'order' },
          { pagePath: 'pages/profile/profile', text: '我的', icon: 'user' }
        ]
      },
      committee: {
        name: '业委会',
        tabBar: [
          { pagePath: 'pages/committee-workbench/workbench', text: '工作台', icon: 'home' },
          { pagePath: 'pages/issue/list', text: '议题', icon: 'issue' },
          { pagePath: 'pages/announcement/list', text: '公告', icon: 'notice' },
          { pagePath: 'pages/profile/profile', text: '我的', icon: 'user' }
        ]
      },
      property: {
        name: '物业',
        tabBar: [
          { pagePath: 'pages/property-workbench/workbench', text: '工作台', icon: 'home' },
          { pagePath: 'pages/work-order/list', text: '工单', icon: 'order' },
          { pagePath: 'pages/announcement/list', text: '公告', icon: 'notice' },
          { pagePath: 'pages/profile/profile', text: '我的', icon: 'user' }
        ]
      }
    }
    return roleMap[this.globalData.currentRole] || roleMap.owner
  }
})
