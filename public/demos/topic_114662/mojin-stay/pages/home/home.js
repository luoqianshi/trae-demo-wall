const { rooms, bills, stats } = require("../../utils/mock")

Page({
  data: {
    stats,
    rooms: rooms.slice(0, 3),
    pendingBills: bills.filter((item) => item.status !== "已收"),
    quicks: [
      { title: "房源管理", desc: "房态、房客、押金", url: "/pages/rooms/rooms" },
      { title: "水电抄表", desc: "录入本月读数", url: "/pages/meter/meter" },
      { title: "退租结算", desc: "押金抵扣和收据", url: "/pages/settlement/settlement" },
      { title: "经营统计", desc: "收入和入住率", url: "/pages/stats/stats" }
    ]
  },
  go(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url })
  },
  goDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` })
  }
})
