const app = getApp()
const api = require('../../utils/api.js')

Page({
  data: {
    userData: null,
    allBottles: [],
    filteredBottles: [],
    matchedCount: 0,
    riverCount: 0,
    currentFilter: 'all',
    filterOptions: [
      { id: 'all', name: '全部', icon: '✨' },
      { id: 'matched', name: '共鸣记忆', icon: '💫' },
      { id: 'personal', name: '我的独白', icon: '📝' }
    ],
    showEmpty: false,
    loading: true
  },

  onLoad: function () {
    this.loadData()
  },

  onShow: function () {
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const result = await api.getRivers()
      const rivers = result.rivers
      const allBottles = []

      rivers.forEach(function(river) {
        if (river.bottles) {
          river.bottles.forEach(function(bottle) {
            const bottleTypeName = getBottleTypeName(bottle.bottleType)
            const timeStr = formatTime(bottle.createdAt)
            
            allBottles.push({
              id: bottle.id,
              riverId: river.id,
              riverName: river.name,
              content: bottle.content,
              bottleType: bottle.bottleType,
              bottleTypeName: bottleTypeName,
              status: bottle.status,
              createTime: bottle.createdAt,
              timeStr: timeStr
            })
          })
        }
      })

      allBottles.sort(function(a, b) {
        return new Date(b.createTime) - new Date(a.createTime)
      })

      const matchedCount = countMatched(allBottles)

      this.setData({
        allBottles: allBottles,
        filteredBottles: allBottles,
        matchedCount: matchedCount,
        riverCount: rivers.length,
        showEmpty: allBottles.length === 0,
        loading: false
      })
    } catch (err) {
      console.error('获取数据失败:', err)
      this.setData({ loading: false })
    }
  },

  changeFilter: function (e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({
      currentFilter: filter
    })
    this.filterBottles(filter)
  },

  filterBottles: function (filter) {
    let filtered = this.data.allBottles
    
    if (filter === 'matched') {
      filtered = this.data.allBottles.filter(function(b) {
        return b.status === 'matched'
      })
    } else if (filter === 'personal') {
      filtered = this.data.allBottles.filter(function(b) {
        return b.status !== 'matched'
      })
    }

    this.setData({
      filteredBottles: filtered
    })
  },

  async deleteBottle(e) {
    const riverId = e.currentTarget.dataset.riverid
    const bottleId = e.currentTarget.dataset.bottleid
    
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条记忆吗？',
      success: async function(res) {
        if (res.confirm) {
          try {
            await api.deleteBottle(bottleId)
            wx.showToast({
              title: '已删除',
              icon: 'success'
            })
            this.loadData()
          } catch (err) {
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }.bind(this)
    })
  },

  async unbindRiver() {
    wx.showModal({
      title: '解除绑定',
      content: '解除绑定后，这条长河将不再显示，但记忆数据将保留。确定要解除绑定吗？',
      success: async function(res) {
        if (res.confirm) {
          wx.showToast({
            title: '已解除绑定',
            icon: 'success'
          })
        }
      }
    })
  },

  goToRiver: function (e) {
    const riverId = e.currentTarget.dataset.riverid
    wx.navigateTo({
      url: '/pages/river/river?id=' + riverId
    })
  }
})

function getBottleTypeName(type) {
  const typeMap = {
    personal: '私人念想',
    shared: '金色共鸣'
  }
  return typeMap[type] || type
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return year + '年' + month + '月' + day + '日'
}

function countMatched(bottles) {
  let count = 0
  bottles.forEach(function(b) {
    if (b.status === 'matched') count++
  })
  return count
}