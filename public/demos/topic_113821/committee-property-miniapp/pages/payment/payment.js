const mock = require('../../utils/mock.js')
const app = getApp()

Page({
  data: {
    currentType: 'property',
    typeOptions: [
      { key: 'property', label: '物业费' },
      { key: 'parking', label: '停车费' }
    ],
    billList: [],
    unpaidBills: [],
    paidBills: [],
    selectedBills: [],
    totalAmount: 0,
    showPayConfirm: false
  },

  onLoad(options) {
    if (options.type) {
      this.setData({ currentType: options.type })
    }
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ currentType: type, selectedBills: [], totalAmount: 0 })
    this.loadData()
  },

  loadData() {
    const bills = mock.getPaymentBills(this.data.currentType)
    const unpaid = bills.filter(b => b.status === 'unpaid')
    const paid = bills.filter(b => b.status === 'paid')
    
    this.setData({
      billList: bills,
      unpaidBills: unpaid,
      paidBills: paid
    })
  },

  toggleSelect(e) {
    const id = e.currentTarget.dataset.id
    const selected = [...this.data.selectedBills]
    const index = selected.indexOf(id)
    
    if (index > -1) {
      selected.splice(index, 1)
    } else {
      selected.push(id)
    }

    let total = 0
    this.data.unpaidBills.forEach(bill => {
      if (selected.includes(bill.id)) {
        total += bill.amount
      }
    })

    this.setData({
      selectedBills: selected,
      totalAmount: total.toFixed(2)
    })
  },

  selectAll() {
    if (this.data.selectedBills.length === this.data.unpaidBills.length) {
      this.setData({ selectedBills: [], totalAmount: 0 })
    } else {
      const allIds = this.data.unpaidBills.map(b => b.id)
      const total = this.data.unpaidBills.reduce((sum, b) => sum + b.amount, 0)
      this.setData({
        selectedBills: allIds,
        totalAmount: total.toFixed(2)
      })
    }
  },

  goToPay() {
    if (this.data.selectedBills.length === 0) {
      wx.showToast({ title: '请选择要缴费的账单', icon: 'none' })
      return
    }
    this.setData({ showPayConfirm: true })
  },

  confirmPay() {
    wx.showLoading({ title: '支付中...' })
    setTimeout(() => {
      wx.hideLoading()
      this.setData({ showPayConfirm: false })
      wx.showToast({ title: '支付成功', icon: 'success' })
      setTimeout(() => {
        this.loadData()
        this.setData({ selectedBills: [], totalAmount: 0 })
      }, 1500)
    }, 1500)
  },

  cancelPay() {
    this.setData({ showPayConfirm: false })
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: '账单详情开发中', icon: 'none' })
  }
})
