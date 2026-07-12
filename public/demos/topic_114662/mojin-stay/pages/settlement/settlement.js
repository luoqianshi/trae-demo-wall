const { rooms } = require("../../utils/mock")
const tenantRooms = rooms.filter((item) => item.tenant)

Page({
  data: {
    rooms: tenantRooms,
    roomIndex: 0,
    selectedRoom: tenantRooms[0],
    damageFee: 0,
    cleaningFee: 120,
    unpaidFee: 0,
    refund: 0
  },
  onLoad() {
    this.calc()
  },
  pickRoom(e) {
    const roomIndex = Number(e.detail.value)
    this.setData({ roomIndex, selectedRoom: this.data.rooms[roomIndex] }, () => this.calc())
  },
  input(e) {
    this.setData({ [e.currentTarget.dataset.key]: Number(e.detail.value || 0) }, () => this.calc())
  },
  calc() {
    const room = this.data.selectedRoom
    const refund = room.deposit - this.data.damageFee - this.data.cleaningFee - this.data.unpaidFee
    this.setData({ refund })
  },
  createReceipt() {
    wx.showModal({
      title: "退租收据",
      content: `押金结余 ¥${this.data.refund}，可发给房客确认。`,
      showCancel: false
    })
  }
})
