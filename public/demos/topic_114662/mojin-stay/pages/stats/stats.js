const { stats } = require("../../utils/mock")
const maxIncome = Math.max(...stats.months.map((item) => item.income))
const months = stats.months.map((item) => ({
  ...item,
  percent: Math.round((item.income / maxIncome) * 100)
}))

Page({
  data: {
    stats: {
      ...stats,
      months
    }
  }
})
