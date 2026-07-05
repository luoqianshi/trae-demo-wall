const app = getApp()
const api = require('../../utils/api.js')

Page({
  data: {
    rivers: [],
    showEmpty: false,
    loading: true
  },

  onLoad: function () {
    this.loadRivers()
  },

  onShow: function () {
    this.loadRivers()
  },

  async loadRivers() {
    this.setData({ loading: true })
    try {
      const result = await api.getRivers()
      if (result.success) {
        const riversWithInfo = result.rivers.map(function(river) {
          const relationName = getRelationName(river.relationType)
          const statusText = getStatusText(river.status)
          const updateTime = formatTime(river.updatedAt)
          const glowOpacity = river.status === 'active' ? 0.3 : 0.1
          
          return {
            id: river.id,
            name: river.name || '未命名长河',
            relationType: river.relationType,
            relationName: relationName,
            status: river.status,
            statusText: statusText,
            memberCount: river.members ? river.members.length : 0,
            updateTime: updateTime,
            glowOpacity: glowOpacity
          }
        })
        
        this.setData({
          rivers: riversWithInfo,
          showEmpty: riversWithInfo.length === 0,
          loading: false
        })
      } else {
        console.error('获取长河失败:', result.message)
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('获取长河失败:', err)
      this.setData({ loading: false })
    }
  },

  goToCreate: function () {
    wx.navigateTo({
      url: '/pages/create/create'
    })
  },

  goToRiver: function (e) {
    const riverId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/river/river?id=' + riverId
    })
  },

  onPullDownRefresh: function () {
    this.loadRivers()
    wx.stopPullDownRefresh()
  },

  onShareAppMessage: function () {
    return {
      title: '双人记忆摆渡船 - 一起记录美好回忆',
      desc: '每一条河，都藏着两个人的故事',
      path: '/pages/index/index'
    }
  },

  onShareTimeline: function () {
    return {
      title: '双人记忆摆渡船 - 一起记录美好回忆',
      query: '',
      imageUrl: ''
    }
  }
})

function getStatusText(status) {
  const statusMap = {
    pending: '待确认',
    active: '已绑定',
    expired: '已失效'
  }
  return statusMap[status] || status
}

function getRelationName(type) {
  const relationMap = {
    lover: '恋人',
    friend: '闺蜜',
    family: '家人',
    childhood: '发小',
    custom: '自定义'
  }
  return relationMap[type] || type
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return month + '月' + day + '日'
}