var tts = require('../../utils/tts.js')

Component({
  properties: {
    elderlyMode: { type: Boolean, value: false },
    ttsEnabled: { type: Boolean, value: false }
  },

  data: {
    expanded: false
  },

  methods: {
    onToggle: function () {
      this.setData({ expanded: !this.data.expanded })
    },

    onElderly: function () {
      var app = getApp()
      var enabled = app.toggleElderlyMode()

      var pages = getCurrentPages()
      var currentPage = pages[pages.length - 1]
      if (currentPage) {
        currentPage.setData({
          elderlyMode: enabled
        })
        if (enabled) {
          wx.setPageStyle({ style: { overflow: 'auto' } })
        }
      }

      this.setData({ elderlyMode: enabled })

      if (enabled) {
        wx.showToast({ title: '大字模式已开启', icon: 'none', duration: 1500 })
      } else {
        wx.showToast({ title: '大字模式已关闭', icon: 'none', duration: 1500 })
      }
    },

    onTts: function () {
      var enabled = tts.toggle()
      this.setData({ ttsEnabled: enabled })

      var pages = getCurrentPages()
      var currentPage = pages[pages.length - 1]
      if (currentPage) {
        currentPage.setData({ ttsEnabled: enabled })
      }
    },

    onHide: function () {
      this.setData({ expanded: false })
    }
  }
})
