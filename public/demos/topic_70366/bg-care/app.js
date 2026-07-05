App({
  onLaunch() {
    const records = wx.getStorageSync('bp_records') || []
    const userInfo = wx.getStorageSync('user_info') || null
    const aiConfig = wx.getStorageSync('ai_config') || null
    const elderlyMode = wx.getStorageSync('elderly_mode') || false
    this.globalData.records = records
    this.globalData.userInfo = userInfo
    this.globalData.aiConfig = aiConfig
    this.globalData.elderlyMode = elderlyMode
    this.globalData.ttsEnabled = false
  },

  globalData: {
    records: [],
    userInfo: null,
    aiConfig: null,
    elderlyMode: false,
    ttsEnabled: false
  },

  toggleElderlyMode() {
    this.globalData.elderlyMode = !this.globalData.elderlyMode
    wx.setStorageSync('elderly_mode', this.globalData.elderlyMode)
    return this.globalData.elderlyMode
  },

  saveRecords(records) {
    this.globalData.records = records
    wx.setStorageSync('bp_records', records)
  },

  addRecord(record) {
    const records = this.globalData.records
    record.id = Date.now().toString()
    record.createdAt = new Date().toISOString()
    records.unshift(record)
    this.saveRecords(records)
    return record
  },

  deleteRecord(id) {
    const records = this.globalData.records.filter(r => r.id !== id)
    this.saveRecords(records)
  },

  clearAllRecords() {
    this.globalData.records = []
    wx.removeStorageSync('bp_records')
  },

  saveUserInfo(info) {
    this.globalData.userInfo = info
    wx.setStorageSync('user_info', info)
  },

  getRecordsByDays(days) {
    const now = Date.now()
    const cutoff = now - days * 24 * 60 * 60 * 1000
    return this.globalData.records.filter(r => new Date(r.createdAt).getTime() >= cutoff)
  },

  setAiConfig(config) {
    this.globalData.aiConfig = { ...this.globalData.aiConfig, ...config }
  }
})
