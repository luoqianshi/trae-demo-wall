const { getRoom } = require("../../utils/mock")

Page({
  data: {
    room: null,
    feeItems: []
  },
  onLoad(query) {
    const room = getRoom(query.id)
    this.setData({
      room,
      feeItems: [
        { label: "月租", value: `¥${room.rent}` },
        { label: "押金", value: `¥${room.deposit}` },
        { label: "水费单价", value: `¥${room.water}/吨` },
        { label: "电费单价", value: `¥${room.electric}/度` }
      ]
    })
  },
  goRent() {
    wx.switchTab({ url: "/pages/rent/rent" })
  },
  goMeter() {
    wx.navigateTo({ url: "/pages/meter/meter" })
  }
})
