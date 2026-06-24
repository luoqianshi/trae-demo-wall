Component({
  properties: {
    currentPage: {
      type: String,
      value: ''
    }
  },
  methods: {
    switchTab: function (e) {
      const page = e.currentTarget.dataset.page
      if (page === this.properties.currentPage) return
      wx.navigateTo({
        url: page
      })
    }
  }
})