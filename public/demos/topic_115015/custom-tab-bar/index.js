Component({
  data: {
    selected: 0,
    color: "#727970",
    selectedColor: "#416743",
    list: [
      {
        pagePath: "/pages/garden/garden",
        text: "园子",
        icon: "🏠"
      },
      {
        pagePath: "/pages/identify/identify",
        text: "识草",
        icon: "📷"
      },
      {
        pagePath: "/pages/season/season",
        text: "时节",
        icon: "📅"
      },
      {
        pagePath: "/pages/profile/profile",
        text: "我的",
        icon: "👤"
      }
    ]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({ url })
      this.setData({
        selected: data.index
      })
    }
  }
})
