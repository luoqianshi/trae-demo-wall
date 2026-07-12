const { bills } = require("../../utils/mock")

Page({
  data: {
    tabs: ["全部", "待收", "逾期", "已收"],
    active: "全部",
    bills,
    list: bills
  },
  setTab(e) {
    const active = e.currentTarget.dataset.tab
    this.setData({
      active,
      list: active === "全部" ? this.data.bills : this.data.bills.filter((item) => item.status === active)
    })
  },
  markPaid(e) {
    const id = e.currentTarget.dataset.id
    const bills = this.data.bills.map((item) => item.id === id ? { ...item, status: "已收" } : item)
    this.setData({ bills, list: this.data.active === "全部" ? bills : bills.filter((item) => item.status === this.data.active) })
    wx.showToast({ title: "已标记收款", icon: "success" })
  }
})
