const app = getApp()
const Cloud = require('../../utils/cloud.js')
const categoriesData = require('../../data/categories.js')

const TABS = [
  { id: 'hot', name: '人气榜', sortBy: 'voteCount' },
  { id: 'mail', name: '邮购榜', sortBy: 'mailVoteCount' }
]

Page({
  data: {
    tabs: TABS,
    activeTab: 'hot',
    voteList: [],
    votedIds: [],
    loading: true,
    isEmpty: false
  },

  onLoad: function () {
    this.loadVoteList()
  },

  onShow: function () {
    this.loadVoteList()
  },

  onPullDownRefresh: function () {
    this.loadVoteList(() => {
      wx.stopPullDownRefresh()
    })
  },

  onTabChange: function (e) {
    const tabId = e.currentTarget.dataset.id
    if (tabId === this.data.activeTab) return
    this.setData({ activeTab: tabId, voteList: [], loading: true })
    this.loadVoteList()
  },

  loadVoteList: function (callback) {
    const tab = TABS.find(t => t.id === this.data.activeTab) || TABS[0]
    const isMailTab = this.data.activeTab === 'mail'

    this.setData({ loading: true })

    Cloud.callFunction('foodCRUD', {
      action: 'list',
      query: {},
      page: 1,
      pageSize: 30,
      sortBy: tab.sortBy,
      sortOrder: 'desc'
    }).then(res => {
      if (res.success && res.data && res.data.success) {
        const list = (res.data.data && res.data.data.list) || []
        const voteList = list.map((item, index) => ({
          ...item,
          rank: index + 1,
          categoryName: this.getCategoryName(item.category),
          displayVotes: isMailTab ? (item.mailVoteCount || 0) : (item.voteCount || 0)
        }))

        this.setData({
          voteList,
          isEmpty: voteList.length === 0,
          loading: false
        })
        this.checkVotedStatus(voteList)
      } else {
        this.setData({ voteList: [], isEmpty: true, loading: false })
      }
      if (callback) callback()
    }).catch(() => {
      this.setData({ voteList: [], isEmpty: true, loading: false })
      if (callback) callback()
    })
  },

  checkVotedStatus: function (voteList) {
    const openid = app.globalData.openid
    if (!openid || voteList.length === 0) return

    const today = new Date()
    const dateStr = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()

    Cloud.query('voteRecords', {
      openid: openid,
      voteDate: dateStr
    }).then(res => {
      if (res.success && res.data) {
        const votedIds = res.data.map(record => record.foodId)
        this.setData({ votedIds })
      }
    }).catch(() => {})
  },

  getCategoryName: function (categoryId) {
    if (!categoryId) return ''
    const category = categoriesData.getCategoryById(categoryId)
    return category ? category.name : ''
  },

  onVote: function (e) {
    const foodId = e.currentTarget.dataset.id
    if (this.data.votedIds.indexOf(foodId) > -1) {
      wx.showToast({ title: '今天已经投过票了', icon: 'none' })
      return
    }

    const voteType = this.data.activeTab === 'mail' ? 'mail' : 'general'
    const isMailTab = this.data.activeTab === 'mail'

    Cloud.callFunction('voteFood', {
      foodId: foodId,
      voteType: voteType
    }).then(res => {
      if (res.success && res.data && res.data.success) {
        const votedIds = [...this.data.votedIds, foodId]
        let voteList = this.data.voteList.map(item => {
          if (item._id === foodId) {
            return {
              ...item,
              voteCount: res.data.voteCount,
              mailVoteCount: res.data.mailVoteCount,
              displayVotes: isMailTab ? res.data.mailVoteCount : res.data.voteCount
            }
          }
          return item
        })

        voteList.sort((a, b) => b.displayVotes - a.displayVotes)
        voteList.forEach((item, index) => { item.rank = index + 1 })

        this.setData({ votedIds, voteList })
        wx.showToast({ title: '投票成功', icon: 'success' })
      } else {
        wx.showToast({ title: (res.data && res.data.message) || '投票失败', icon: 'none' })
      }
    }).catch(() => {
      wx.showToast({ title: '投票失败', icon: 'none' })
    })
  },

  onFoodTap: function (e) {
    const foodId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/foodDetail/foodDetail?id=${foodId}`
    })
  },

  onImageError: function (e) {
    const id = e.currentTarget.dataset.id
    const fallback = 'https://placehold.co/300x300/FF6B35/FFFFFF?text=Food'
    const voteList = this.data.voteList.map(item => {
      if (item._id === id) {
        return { ...item, images: [fallback] }
      }
      return item
    })
    this.setData({ voteList })
  }
})
