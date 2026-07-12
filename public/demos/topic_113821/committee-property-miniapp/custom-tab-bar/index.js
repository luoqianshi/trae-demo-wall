const app = getApp()

Component({
  data: {
    selected: 0,
    color: '#6c7169',
    selectedColor: '#2f6f55',
    backgroundColor: '#fffaf1',
    list: [],
    currentRole: 'owner'
  },

  attached() {
    this.updateTabBar()
  },

  methods: {
    updateTabBar() {
      const role = app.globalData.currentRole
      const tabConfig = this.getTabConfig(role)
      this.setData({
        currentRole: role,
        list: tabConfig
      })
    },

    getTabConfig(role) {
      const configs = {
        owner: [
          { pagePath: '/pages/owner-home/owner-home', text: '首页', icon: '🏠' },
          { pagePath: '/pages/announcement/list', text: '公告', icon: '📢' },
          { pagePath: '/pages/work-order/list', text: '工单', icon: '📋' },
          { pagePath: '/pages/profile/profile', text: '我的', icon: '👤' }
        ],
        committee: [
          { pagePath: '/pages/committee-workbench/workbench', text: '工作台', icon: '🏛️' },
          { pagePath: '/pages/issue/list', text: '议题', icon: '📝' },
          { pagePath: '/pages/announcement/list', text: '公告', icon: '📢' },
          { pagePath: '/pages/profile/profile', text: '我的', icon: '👤' }
        ],
        property: [
          { pagePath: '/pages/property-workbench/workbench', text: '工作台', icon: '🏢' },
          { pagePath: '/pages/work-order/list', text: '工单', icon: '📋' },
          { pagePath: '/pages/announcement/list', text: '公告', icon: '📢' },
          { pagePath: '/pages/profile/profile', text: '我的', icon: '👤' }
        ]
      }
      return configs[role] || configs.owner
    },

    switchTab(e) {
      const index = e.currentTarget.dataset.index
      const url = this.data.list[index].pagePath
      wx.switchTab({ url })
    },

    setSelected(pagePath) {
      const index = this.data.list.findIndex(item => item.pagePath === pagePath)
      if (index >= 0) {
        this.setData({ selected: index })
      }
    },

    updateAndSetSelected(pagePath) {
      this.updateTabBar()
      const index = this.data.list.findIndex(item => item.pagePath === pagePath)
      if (index >= 0) {
        this.setData({ selected: index })
      }
    }
  }
})
