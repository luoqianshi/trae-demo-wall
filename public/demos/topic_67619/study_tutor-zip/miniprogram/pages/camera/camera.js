const { callFn } = require('../../utils/cloud')

Page({
  data: {
    uploading: false,
    errorMsg: ''
  },

  async chooseAndUpload() {
    if (this.data.uploading) return
    this.setData({ uploading: true, errorMsg: '' })

    try {
      const choose = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      })

      const tempPath = choose.tempFiles[0].tempFilePath
      const cloudPath = `questions/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const upload = await wx.cloud.uploadFile({ cloudPath, filePath: tempPath })

      const result = await callFn('fn-ocr', { fileID: upload.fileID })

      wx.navigateTo({
        url: '/pages/edit/edit',
        success: (res) => {
          res.eventChannel.emit('ocrData', {
            fileID: upload.fileID,
            ocr: result
          })
        }
      })
    } catch (err) {
      console.error(err)
      this.setData({ errorMsg: err.message || '上传失败，请重试' })
    } finally {
      this.setData({ uploading: false })
    }
  }
})
