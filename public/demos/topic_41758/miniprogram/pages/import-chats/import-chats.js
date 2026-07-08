// pages/import-chats/import-chats.js

Page({
  data: {
    uploadState: 'init',   // init | uploaded | importing | done
    fileName: '',
    fileSize: 0,
    fileSizeText: '',      // 格式化后的文件大小
    filePath: '',          // 存储 chooseMessageFile 返回的临时路径
    importedCount: 0,
    totalMessages: 0
  },

  // 选择聊天记录文件
  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['txt', 'csv', 'json'],
      success: (res) => {
        const file = res.tempFiles[0];
        this.setData({
          fileName: file.name,
          fileSize: file.size,
          fileSizeText: this.formatSize(file.size),
          filePath: file.path,    // 存下来后续上传用
          uploadState: 'uploaded'
        });
      },
      fail: () => {
        wx.showToast({ title: '选择文件失败', icon: 'none' });
      }
    });
  },

  // 上传并导入聊天记录
  importChats() {
    const { filePath, fileName } = this.data;
    if (!filePath) {
      wx.showToast({ title: '请先选择文件', icon: 'none' });
      return;
    }
    this.setData({ uploadState: 'importing' });

    const app = getApp();
    const token = app ? app.globalData.token : wx.getStorageSync('token');

    wx.uploadFile({
      url: 'https://api.timecapsule.app/api/chats/import',
      filePath,   // ⚠️ 使用存储的路径
      name: 'file',
      formData: { filename: fileName },
      header: {
        Authorization: token ? 'Bearer ' + token : ''
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (data.code === 0) {
            this.setData({
              uploadState: 'done',
              importedCount: data.data.imported_count || 0,
              totalMessages: data.data.total_messages || 0
            });
            wx.showToast({ title: '导入完成', icon: 'success' });
          } else {
            this.setData({ uploadState: 'uploaded' });
            wx.showToast({ title: data.message || '导入失败', icon: 'none' });
          }
        } catch (e) {
          this.setData({ uploadState: 'uploaded' });
          wx.showToast({ title: '解析响应失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({ uploadState: 'uploaded' });
        wx.showToast({ title: '网络异常，请重试', icon: 'none' });
      }
    });
  },

  // 格式化文件大小
  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  },

  finish() {
    wx.navigateBack();
  }
});
