const mock = require('../../utils/mock.js')
const app = getApp()

Page({
  data: {
    currentTab: 'income',
    tabs: [
      { key: 'income', label: '公共收益' },
      { key: 'fund', label: '维修基金' }
    ],
    publicIncome: null,
    maintenanceFund: null,
    selectedMonth: 0
  },

  onLoad(options) {
    if (options.tab) {
      this.setData({ currentTab: options.tab })
    }
    this.loadData()
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
  },

  loadData() {
    const funds = mock.getPublicFunds()
    this.setData({
      publicIncome: funds.publicIncome,
      maintenanceFund: funds.maintenanceFund
    })
  },

  selectMonth(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ selectedMonth: index })
  },

  formatAmount(amount) {
    return amount.toFixed(2)
  }
})
