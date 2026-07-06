const StorageUtils = {
  set: (key, value) => {
    try {
      const data = typeof value === 'object' ? JSON.stringify(value) : value
      wx.setStorageSync(key, data)
      return true
    } catch (err) {
      console.error('Storage set error:', err)
      return false
    }
  },

  get: (key, defaultValue = null) => {
    try {
      const data = wx.getStorageSync(key)
      if (data === '') return defaultValue
      try {
        return JSON.parse(data)
      } catch (e) {
        return data || defaultValue
      }
    } catch (err) {
      console.error('Storage get error:', err)
      return defaultValue
    }
  },

  remove: (key) => {
    try {
      wx.removeStorageSync(key)
      return true
    } catch (err) {
      console.error('Storage remove error:', err)
      return false
    }
  },

  clear: () => {
    try {
      wx.clearStorageSync()
      return true
    } catch (err) {
      console.error('Storage clear error:', err)
      return false
    }
  },

  getKeys: () => {
    try {
      return wx.getStorageInfoSync().keys || []
    } catch (err) {
      console.error('Storage getKeys error:', err)
      return []
    }
  },

  getInfo: () => {
    try {
      return wx.getStorageInfoSync()
    } catch (err) {
      console.error('Storage getInfo error:', err)
      return { keys: [], currentSize: 0, limitSize: 10240 }
    }
  },

  getUserInfo: () => {
    return StorageUtils.get('userInfo')
  },

  setUserInfo: (userInfo) => {
    return StorageUtils.set('userInfo', userInfo)
  },

  removeUserInfo: () => {
    return StorageUtils.remove('userInfo')
  },

  getOpenid: () => {
    return StorageUtils.get('openid')
  },

  setOpenid: (openid) => {
    return StorageUtils.set('openid', openid)
  },

  removeOpenid: () => {
    return StorageUtils.remove('openid')
  },

  getRegion: () => {
    return StorageUtils.get('region', { province: '', city: '', district: '' })
  },

  setRegion: (region) => {
    return StorageUtils.set('region', region)
  },

  removeRegion: () => {
    return StorageUtils.remove('region')
  },

  getPreferences: () => {
    return StorageUtils.get('preferences', {
      tastes: [],
      categories: [],
      notification: true
    })
  },

  setPreferences: (preferences) => {
    return StorageUtils.set('preferences', preferences)
  },

  removePreferences: () => {
    return StorageUtils.remove('preferences')
  },

  getUserPreferences: () => {
    return StorageUtils.get('userPreferences', null)
  },

  setUserPreferences: (preferences) => {
    return StorageUtils.set('userPreferences', preferences)
  },

  removeUserPreferences: () => {
    return StorageUtils.remove('userPreferences')
  },

  getFridgeItems: () => {
    return StorageUtils.get('fridgeItems', [])
  },

  setFridgeItems: (items) => {
    return StorageUtils.set('fridgeItems', items)
  },

  addFridgeItem: (item) => {
    const items = StorageUtils.getFridgeItems()
    items.unshift(item)
    return StorageUtils.setFridgeItems(items)
  },

  removeFridgeItem: (itemId) => {
    const items = StorageUtils.getFridgeItems()
    const filtered = items.filter(item => item._id !== itemId)
    return StorageUtils.setFridgeItems(filtered)
  },

  updateFridgeItem: (itemId, updates) => {
    const items = StorageUtils.getFridgeItems()
    const index = items.findIndex(item => item._id === itemId)
    if (index !== -1) {
      items[index] = { ...items[index], ...updates }
      return StorageUtils.setFridgeItems(items)
    }
    return false
  },

  getVoteRecords: () => {
    return StorageUtils.get('voteRecords', [])
  },

  setVoteRecords: (records) => {
    return StorageUtils.set('voteRecords', records)
  },

  addVoteRecord: (record) => {
    const records = StorageUtils.getVoteRecords()
    records.push(record)
    return StorageUtils.setVoteRecords(records)
  },

  hasVoted: (voteId) => {
    const records = StorageUtils.getVoteRecords()
    return records.some(record => record.voteId === voteId)
  },

  getReadMessages: () => {
    return StorageUtils.get('readMessages', [])
  },

  setReadMessages: (ids) => {
    return StorageUtils.set('readMessages', ids)
  },

  markMessageRead: (messageId) => {
    const ids = StorageUtils.getReadMessages()
    if (!ids.includes(messageId)) {
      ids.push(messageId)
      return StorageUtils.setReadMessages(ids)
    }
    return true
  },

  isMessageRead: (messageId) => {
    const ids = StorageUtils.getReadMessages()
    return ids.includes(messageId)
  },

  getGuideCompleted: () => {
    return StorageUtils.get('isGuideCompleted', false)
  },

  setGuideCompleted: (completed) => {
    return StorageUtils.set('isGuideCompleted', completed)
  },

  resetGuide: () => {
    return StorageUtils.remove('isGuideCompleted')
  },

  clearUserData: () => {
    StorageUtils.removeUserInfo()
    StorageUtils.removeOpenid()
    StorageUtils.removeRegion()
    StorageUtils.removePreferences()
    StorageUtils.resetGuide()
    return true
  }
}

module.exports = StorageUtils