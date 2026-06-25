const app = getApp()

Page({
  data: {
    reminders: [],
    todayReminders: [],
    showModal: false,
    editingId: null,
    formData: {
      drugName: '',
      time: '',
      dosage: '',
      frequency: '',
      note: ''
    },
    frequencyOptions: [
      { label: '每天一次', value: 'daily' },
      { label: '每天两次', value: 'twice' },
      { label: '每天三次', value: 'thrice' },
      { label: '每周一次', value: 'weekly' }
    ],
    frequencyIndex: 0
  },

  onLoad: function () {
    this.loadReminders()
  },

  onShow: function () {
    this.loadReminders()
  },

  loadReminders: function () {
    const reminders = app.getRecords('medicine') || []
    const today = new Date().toLocaleDateString('zh-CN')
    const todayReminders = reminders.filter(r => {
      return !r.taken
    })
    
    this.setData({
      reminders: reminders.slice(0, 20),
      todayReminders: todayReminders.slice(0, 10)
    })
  },

  showAddModal: function () {
    this.setData({
      showModal: true,
      editingId: null,
      formData: {
        drugName: '',
        time: '',
        dosage: '',
        frequency: '',
        note: ''
      },
      frequencyIndex: 0
    })
  },

  hideModal: function () {
    this.setData({
      showModal: false
    })
  },

  stopPropagation: function () {
  },

  onFormInput: function (e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`formData.${field}`]: e.detail.value
    })
  },

  onTimeChange: function (e) {
    this.setData({
      'formData.time': e.detail.value
    })
  },

  onFrequencyChange: function (e) {
    const index = parseInt(e.detail.value)
    this.setData({
      frequencyIndex: index,
      'formData.frequency': this.data.frequencyOptions[index].label
    })
  },

  saveReminder: function () {
    const { drugName, time, dosage, frequency, note } = this.data.formData
    
    if (!drugName || !time || !dosage || !frequency) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (this.data.editingId) {
      const reminders = app.getRecords('medicine')
      const updated = reminders.map(r => {
        if (r.id === this.data.editingId) {
          return { ...r, drugName, time, dosage, frequency, note }
        }
        return r
      })
      wx.setStorageSync('medicine', updated)
      app.globalData.medicineRecords = updated
    } else {
      app.saveRecord('medicine', {
        drugName,
        time,
        dosage,
        frequency,
        note,
        taken: false
      })
    }

    this.hideModal()
    this.loadReminders()
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
  },

  editReminder: function (e) {
    const id = e.currentTarget.dataset.id
    const reminder = this.data.reminders.find(r => r.id === id)
    if (reminder) {
      const frequencyIndex = this.data.frequencyOptions.findIndex(
        opt => opt.label === reminder.frequency
      )
      this.setData({
        showModal: true,
        editingId: id,
        formData: {
          drugName: reminder.drugName,
          time: reminder.time,
          dosage: reminder.dosage.toString(),
          frequency: reminder.frequency,
          note: reminder.note || ''
        },
        frequencyIndex: frequencyIndex >= 0 ? frequencyIndex : 0
      })
    }
  },

  deleteReminder: function (e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个用药提醒吗？',
      success: (res) => {
        if (res.confirm) {
          const reminders = app.getRecords('medicine').filter(r => r.id !== id)
          wx.setStorageSync('medicine', reminders)
          app.globalData.medicineRecords = reminders
          this.loadReminders()
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        }
      }
    })
  },

  takeMedicine: function (e) {
    const id = e.currentTarget.dataset.id
    const reminders = app.getRecords('medicine')
    const updated = reminders.map(r => {
      if (r.id === id) {
        return { ...r, taken: true }
      }
      return r
    })
    wx.setStorageSync('medicine', updated)
    app.globalData.medicineRecords = updated
    this.loadReminders()
    wx.showToast({
      title: '已确认服用',
      icon: 'success'
    })
  }
})