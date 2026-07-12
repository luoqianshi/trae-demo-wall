const app = getApp()

Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/employees/employees",
        text: "员工",
        icon: "👥"
      },
      {
        pagePath: "/pages/attendance/attendance",
        text: "考勤",
        icon: "📋"
      },
      {
        pagePath: "/pages/salary-calc/salary-calc",
        text: "核算",
        icon: "🧮"
      },
      {
        pagePath: "/pages/salary-query/salary-query",
        text: "查询",
        icon: "🔍"
      },
      {
        pagePath: "/pages/profile/profile",
        text: "我的",
        icon: "👤"
      }
    ],
    role: 'employee',
    visibleTabs: [],
    indicatorOffset: '0px',
    indicatorWidth: '0px'
  },

  attached() {
    this.updateTabVisibility()
  },

  observers: {
    'selected': function(val) {
      this.calculateIndicator()
    }
  },

  methods: {
    updateTabVisibility() {
      const role = app.globalData.role
      const allList = this.data.list
      
      let visibleTabs = []
      if (role === 'admin') {
        visibleTabs = allList
      } else if (role === 'manager') {
        visibleTabs = [
          allList[2],
          allList[3],
          allList[4]
        ]
      } else {
        visibleTabs = [
          allList[3],
          allList[4]
        ]
      }
      
      this.setData({ role, visibleTabs })
      
      setTimeout(() => {
        this.calculateIndicator()
      }, 100)
    },

    calculateIndicator() {
      const { visibleTabs, selected } = this.data
      const count = visibleTabs.length
      if (count === 0) return
      
      const screenWidth = wx.getSystemInfoSync().windowWidth
      const tabWidth = screenWidth / count
      const indicatorW = tabWidth * 0.7
      const offset = selected * tabWidth + (tabWidth - indicatorW) / 2
      
      this.setData({
        indicatorOffset: offset + 'px',
        indicatorWidth: indicatorW + 'px'
      })
    },

    switchTab(e) {
      const index = e.currentTarget.dataset.index
      const url = this.data.visibleTabs[index].pagePath
      
      this.setData({
        selected: index
      })
      
      this.calculateIndicator()
      
      wx.switchTab({ url })
    },

    setSelected(index) {
      this.setData({ selected: index })
      this.calculateIndicator()
    }
  }
})
