const { rooms } = require("../../utils/mock")

Page({
  data: {
    rooms,
    roomIndex: 0,
    selectedRoom: rooms[0],
    form: {
      month: "2026-07",
      waterFee: 0,
      electricFee: 0,
      serviceFee: 100,
      discount: 0
    },
    total: 0
  },
  onLoad() {
    this.calc()
  },
  pickRoom(e) {
    const roomIndex = Number(e.detail.value)
    this.setData({ roomIndex, selectedRoom: this.data.rooms[roomIndex] }, () => this.calc())
  },
  input(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ [`form.${key}`]: Number(e.detail.value || 0) }, () => this.calc())
  },
  calc() {
    const room = this.data.selectedRoom
    const f = this.data.form
    const total = room.rent + Number(f.waterFee) + Number(f.electricFee) + Number(f.serviceFee) - Number(f.discount)
    this.setData({ total })
  },
  createBill() {
    wx.showModal({
      title: "收租单已生成",
      content: `本期应收 ¥${this.data.total}，可截图或复制给房客确认。`,
      showCancel: false
    })
  }
})
