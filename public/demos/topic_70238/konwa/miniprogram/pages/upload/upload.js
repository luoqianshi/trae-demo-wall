const { getGradeList, getSubjectList } = require('../../utils/mockData.js')

Page({
  data: {
    tempImage: '',
    gradeList: [],
    subjectList: [],
    selectedGrade: '三年级',
    selectedSubject: 'math',
    fromAlbum: false
  },

  onLoad(options) {
    const app = getApp()
    this.setData({
      gradeList: getGradeList(),
      subjectList: getSubjectList(),
      fromAlbum: options.from === 'album',
      statusBarHeight: app.globalData.statusBarHeight || 20
    })

    if (options.from === 'album') {
      this.chooseImage()
    }
  },

  onReady() {
    if (!this.data.fromAlbum) {
      this.takePhoto()
    }
  },

  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'back',
      success: (res) => {
        this.setData({
          tempImage: res.tempFiles[0].tempFilePath
        })
      },
      fail: () => {
        this.setData({
          tempImage: ''
        })
      }
    })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        this.setData({
          tempImage: res.tempFiles[0].tempFilePath
        })
      },
      fail: () => {
        this.setData({
          tempImage: ''
        })
      }
    })
  },

  reTake() {
    this.takePhoto()
  },

  chooseFromAlbum() {
    this.chooseImage()
  },

  selectGrade(e) {
    const grade = e.currentTarget.dataset.grade
    this.setData({
      selectedGrade: grade
    })
  },

  selectSubject(e) {
    const subject = e.currentTarget.dataset.id
    this.setData({
      selectedSubject: subject
    })
  },

  startAnalyze() {
    if (!this.data.tempImage) {
      wx.showToast({
        title: '请先上传试卷图片',
        icon: 'none'
      })
      return
    }

    const imagePath = this.data.tempImage
    const grade = this.data.selectedGrade
    const subject = this.data.selectedSubject

    wx.navigateTo({
      url: `/pages/scanning/scanning?image=${encodeURIComponent(imagePath)}&grade=${grade}&subject=${subject}`
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
