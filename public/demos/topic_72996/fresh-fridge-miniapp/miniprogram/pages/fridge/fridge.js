const app = getApp()
const Cloud = require('../../utils/cloud.js')
const DateUtils = require('../../utils/date.js')
const StorageUtils = require('../../utils/storage.js')
const RecommendUtils = require('../../utils/recommend.js')

Page({
  data: {
    isDoorOpen: false,
    activeInsideTab: 'cold',
    wantList: [],
    coldItems: [],
    freshItems: [],
    expiredItems: [],
    stats: {
      total: 0,
      coldCount: 0,
      freshCount: 0,
      expiredCount: 0,
      coldCapacity: 20,
      freshCapacity: 15
    },
    isSelectMode: false,
    selectedIds: [],
    showWantPanel: false,
    isWantSelectMode: false,
    selectedWantIds: [],
    showNoteModal: false,
    currentNoteItem: {},
    noteText: '',
    seasonalRecommend: '',
    dragItem: null,
    dragStartY: 0,
    dragIndex: -1
  },

  onLoad: function (options) {
    this.loadSeasonalRecommend()
    this.loadData()
  },

  onShow: function () {
    this.loadData()
  },

  onPullDownRefresh: function () {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  loadSeasonalRecommend: function () {
    // 接入 recommendation 云函数，获取适配的应季美食推荐
    const userPrefs = StorageUtils.getUserPreferences()
    const params = {
      page: 1,
      pageSize: 3,
      scene: 'fridge'
    }
    if (userPrefs) {
      params.userPreferences = userPrefs
    }

    RecommendUtils.getRecommendations(params).then(res => {
      if (res.success && res.data.success) {
        const list = res.data.data.list || []
        const names = list.map(f => f.name).slice(0, 2).join('、')
        this.setData({
          seasonalRecommend: names || '去榜单发现更多美食'
        })
      } else {
        this.setData({
          seasonalRecommend: '去榜单发现更多美食'
        })
      }
    }).catch(() => {
      this.setData({
        seasonalRecommend: '去榜单发现更多美食'
      })
    })
  },

  loadData: function () {
    const userId = app.globalData.openid || StorageUtils.getOpenid()
    if (!userId) return Promise.resolve()

    return Promise.all([
      this.loadWantList(),
      this.loadFridgeList()
    ])
  },

  loadWantList: function () {
    return Cloud.callFunction('wantManager', {
      action: 'getList'
    }).then(res => {
      if (res.success && res.data && res.data.success) {
        this.setData({ wantList: res.data.data || [] })
      }
    }).catch(() => {})
  },

  loadFridgeList: function () {
    const userId = app.globalData.openid || StorageUtils.getOpenid()
    console.log('[冰箱] 加载冰箱列表，userId:', userId)

    return Cloud.callFunction('fridgeManager', {
      action: 'getList'
    }).then(res => {
      console.log('[冰箱] fridgeManager 返回:', res)
      if (res.success && res.data && res.data.success) {
        const { coldItems, freshItems, expiredItems, stats } = res.data.data
        console.log('[冰箱] 冷藏层:', coldItems.length, '保鲜层:', freshItems.length, '过期:', expiredItems.length)

        const formatItems = (items) => {
          return items.map(item => ({
            ...item,
            expireDateStr: DateUtils.formatDate(item.expireDate, 'MM月DD日')
          }))
        }

        this.setData({
          coldItems: formatItems(coldItems),
          freshItems: formatItems(freshItems),
          expiredItems: formatItems(expiredItems),
          stats
        })
      } else {
        console.error('[冰箱] 加载失败:', res)
        wx.showToast({ title: '加载冰箱数据失败', icon: 'none' })
      }
    }).catch(err => {
      console.error('[冰箱] 调用 fridgeManager 异常:', err)
      wx.showToast({ title: '加载冰箱数据异常', icon: 'none' })
    })
  },

  onOpenDoor: function () {
    if (this.data.isDoorOpen) return
    this.setData({ isDoorOpen: true })
  },

  onCloseDoor: function () {
    this.setData({
      isDoorOpen: false,
      isSelectMode: false,
      selectedIds: []
    })
  },

  onInsideTabChange: function (e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeInsideTab: tab })
  },

  onToggleSelectMode: function () {
    this.setData({
      isSelectMode: !this.data.isSelectMode,
      selectedIds: []
    })
  },

  onToggleSelect: function (e) {
    const id = e.currentTarget.dataset.id
    const selectedIds = [...this.data.selectedIds]
    const index = selectedIds.indexOf(id)
    
    if (index > -1) {
      selectedIds.splice(index, 1)
    } else {
      selectedIds.push(id)
    }
    
    this.setData({ selectedIds })
  },

  onBatchDelete: function () {
    if (this.data.selectedIds.length === 0) return

    wx.showModal({
      title: '确认删除',
      content: `确定要删除选中的${this.data.selectedIds.length}件食材吗？`,
      success: (res) => {
        if (res.confirm) {
          const tasks = this.data.selectedIds.map(id =>
            Cloud.callFunction('fridgeManager', {
              action: 'deleteItem',
              itemId: id
            })
          )
          Promise.all(tasks).then(() => {
            this.setData({
              selectedIds: [],
              isSelectMode: false
            })
            this.loadFridgeList()
            wx.showToast({ title: '删除成功', icon: 'success' })
          })
        }
      }
    })
  },

  onClearExpired: function () {
    wx.showModal({
      title: '清理过期食材',
      content: '确定要清理所有过期食材吗？',
      success: (res) => {
        if (res.confirm) {
          Cloud.callFunction('fridgeManager', {
            action: 'clearExpired'
          }).then(result => {
            if (result.success) {
              this.loadFridgeList()
              wx.showToast({ title: result.data.message, icon: 'success' })
            }
          })
        }
      }
    })
  },

  onEditNote: function (e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      showNoteModal: true,
      currentNoteItem: item,
      noteText: item.note || ''
    })
  },

  onNoteInput: function (e) {
    this.setData({ noteText: e.detail.value })
  },

  onSaveNote: function () {
    const { currentNoteItem, noteText } = this.data
    Cloud.callFunction('fridgeManager', {
      action: 'updateNote',
      itemId: currentNoteItem._id,
      note: noteText
    }).then(res => {
      if (res.success) {
        this.setData({ showNoteModal: false })
        this.loadFridgeList()
        wx.showToast({ title: '保存成功', icon: 'success' })
      }
    })
  },

  onCloseNoteModal: function () {
    this.setData({ showNoteModal: false })
  },

  stopPropagation: function () {},

  onStickerTap: function () {
    wx.switchTab({ url: '/pages/discovery/discovery' })
  },

  onOpenWantPanel: function () {
    this.setData({ showWantPanel: true })
  },

  onCloseWantPanel: function () {
    this.setData({
      showWantPanel: false,
      isWantSelectMode: false,
      selectedWantIds: []
    })
  },

  onToggleWantSelectMode: function () {
    this.setData({
      isWantSelectMode: !this.data.isWantSelectMode,
      selectedWantIds: []
    })
  },

  onToggleWantSelect: function (e) {
    const id = e.currentTarget.dataset.id
    const selectedWantIds = [...this.data.selectedWantIds]
    const index = selectedWantIds.indexOf(id)
    
    if (index > -1) {
      selectedWantIds.splice(index, 1)
    } else {
      selectedWantIds.push(id)
    }
    
    this.setData({ selectedWantIds })
  },

  onBatchMoveToFridge: function () {
    if (this.data.selectedWantIds.length === 0) return

    wx.showModal({
      title: '移入冰箱',
      content: `确定要将选中的${this.data.selectedWantIds.length}件美食移入冰箱吗？`,
      success: (res) => {
        if (res.confirm) {
          Cloud.callFunction('wantManager', {
            action: 'batchMoveToFridge',
            itemIds: this.data.selectedWantIds
          }).then(result => {
            if (result.success && result.data && result.data.success) {
              this.setData({
                selectedWantIds: [],
                isWantSelectMode: false
              })
              this.loadData()
              wx.showToast({ title: result.data.message || '已移入冰箱', icon: 'success' })
            } else {
              wx.showToast({ title: (result.data && result.data.message) || '操作失败', icon: 'none' })
            }
          })
        }
      }
    })
  },

  onBatchDeleteWant: function () {
    if (this.data.selectedWantIds.length === 0) return

    wx.showModal({
      title: '删除想吃',
      content: `确定要删除选中的${this.data.selectedWantIds.length}件美食吗？`,
      success: (res) => {
        if (res.confirm) {
          Cloud.callFunction('wantManager', {
            action: 'batchDelete',
            itemIds: this.data.selectedWantIds
          }).then(result => {
            if (result.success) {
              this.setData({
                selectedWantIds: [],
                isWantSelectMode: false
              })
              this.loadWantList()
              wx.showToast({ title: '删除成功', icon: 'success' })
            }
          })
        }
      }
    })
  },

  onMoveSingleToFridge: function (e) {
    const item = e.currentTarget.dataset.item
    Cloud.callFunction('wantManager', {
      action: 'batchMoveToFridge',
      itemIds: [item._id]
    }).then(result => {
      if (result.success && result.data && result.data.success) {
        this.loadData()
        wx.showToast({ title: result.data.message || '已移入冰箱', icon: 'success' })
      } else {
        wx.showToast({ title: (result.data && result.data.message) || '操作失败', icon: 'none' })
      }
    })
  },

  onDeleteWantItem: function (e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除想吃',
      content: '确定要从想吃清单中移除吗？',
      success: (res) => {
        if (res.confirm) {
          Cloud.callFunction('wantManager', {
            action: 'deleteItem',
            itemId: id
          }).then(result => {
            if (result.success) {
              this.loadWantList()
              wx.showToast({ title: '已移除', icon: 'success' })
            }
          })
        }
      }
    })
  },

  onWantItemLongPress: function (e) {
    if (this.data.isWantSelectMode) return
    wx.vibrateShort({ type: 'medium' })
    const id = e.currentTarget.dataset.id
    this.setData({
      isWantSelectMode: true,
      selectedWantIds: [id]
    })
  },

  onWantTouchStart: function (e) {
    if (this.data.isWantSelectMode) return
    const touch = e.touches[0]
    const id = e.currentTarget.dataset.id
    const index = this.data.wantList.findIndex(item => item._id === id)
    
    this.setData({
      dragItem: id,
      dragStartY: touch.clientY,
      dragIndex: index
    })
  },

  onWantTouchMove: function (e) {
    if (!this.data.dragItem || this.data.isWantSelectMode) return
    
    const touch = e.touches[0]
    const moveY = touch.clientY
    const itemHeight = 140
    const moveIndex = Math.floor((moveY - this.data.dragStartY) / itemHeight)
    const newIndex = this.data.dragIndex + moveIndex
    
    if (newIndex < 0 || newIndex >= this.data.wantList.length) return
    if (newIndex === this.data.dragIndex) return
    
    const wantList = [...this.data.wantList]
    const item = wantList.splice(this.data.dragIndex, 1)[0]
    wantList.splice(newIndex, 0, item)
    
    this.setData({
      wantList,
      dragIndex: newIndex
    })
  },

  onWantTouchEnd: function () {
    if (!this.data.dragItem) return

    const items = this.data.wantList.map((item, index) => ({
      id: item._id,
      sortOrder: index + 1
    }))

    Cloud.callFunction('wantManager', {
      action: 'updateSortOrder',
      items
    }).catch(() => {})

    this.setData({
      dragItem: null,
      dragStartY: 0,
      dragIndex: -1
    })
  },

  onImageError: function (e) {
    const id = e.currentTarget.dataset.id
    const fallback = 'https://placehold.co/120x120/FF6B35/FFFFFF?text=Food'

    const replaceImage = (list) => {
      if (!list || list.length === 0) return list
      return list.map(item => {
        if (item._id === id) {
          return { ...item, image: fallback }
        }
        return item
      })
    }

    this.setData({
      wantList: replaceImage(this.data.wantList),
      coldItems: replaceImage(this.data.coldItems),
      freshItems: replaceImage(this.data.freshItems),
      expiredItems: replaceImage(this.data.expiredItems)
    })
  }
})
