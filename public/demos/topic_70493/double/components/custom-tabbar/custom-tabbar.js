Component({
  properties: {
    current: {
      type: String,
      value: 'index'
    }
  },

  data: {
    tabs: [
      { id: 'index', name: '长河', icon: '🌊', activeIcon: '🌊' },
      { id: 'cabin', name: '船舱', icon: '🏠', activeIcon: '🏠' },
      { id: 'features', name: '特色', icon: '✨', activeIcon: '✨' }
    ]
  },

  methods: {
    switchTab: function (e) {
      const id = e.currentTarget.dataset.id
      if (id === this.properties.current) return
      
      wx.redirectTo({
        url: '/pages/' + id + '/' + id
      })
    }
  }
})