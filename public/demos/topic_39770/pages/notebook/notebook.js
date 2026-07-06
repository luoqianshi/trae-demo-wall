/**
 * 错题本预览页 - 打印预览效果
 * 模拟A4纸比例的错题本，支持生成PDF和分享给家长
 */

const app = getApp()

Page({
  data: {
    // 错题本信息
    notebookTitle: '我的错题本',
    studentName: '小明',
    dateStr: '',
    // 预览的错题（取前3道）
    previewQuestions: [],
    // 总错题数
    totalCount: 0
  },

  onLoad() {
    this.loadPreviewData()
  },

  /**
   * 加载预览数据
   */
  loadPreviewData() {
    const questions = app.globalData.wrongQuestions || []
    const now = new Date()
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`

    // 取前3道错题作为预览
    const previewQuestions = questions.slice(0, 3)

    this.setData({
      dateStr,
      previewQuestions,
      totalCount: questions.length
    })
  },

  /**
   * 生成PDF（模拟）
   */
  onGeneratePDF() {
    wx.showLoading({
      title: '正在生成PDF...',
      mask: true
    })

    setTimeout(() => {
      wx.hideLoading()
      wx.showModal({
        title: '生成成功',
        content: '错题本PDF已生成！在实际使用中，这里会调用微信文档接口保存文件。',
        showCancel: false,
        confirmText: '好的',
        confirmColor: '#667eea'
      })
    }, 2000)
  },

  /**
   * 分享给家长（模拟）
   */
  onShareToParent() {
    wx.showModal({
      title: '分享给家长',
      content: '在实际使用中，这里会调起微信分享功能，将错题本发送给家长微信。',
      showCancel: true,
      cancelText: '取消',
      confirmText: '分享',
      confirmColor: '#667eea',
      success(res) {
        if (res.confirm) {
          wx.showToast({
            title: '已发送给家长',
            icon: 'success',
            duration: 2000
          })
        }
      }
    })
  }
})
