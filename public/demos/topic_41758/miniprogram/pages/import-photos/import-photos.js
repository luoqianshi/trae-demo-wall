const { upload } = require('../../utils/request');

Page({
  data: {
    selectedPhotos: [],
    uploading: false,
    uploadProgress: { current: 0, total: 0, done: false }
  },

  // 选择照片
  choosePhotos() {
    const remain = 500 - this.data.selectedPhotos.length;
    if (remain <= 0) {
      wx.showToast({ title: '一次最多选择 500 张', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: Math.min(remain, 9),
      mediaType: ['image'],
      success: (res) => {
        const newPhotos = res.tempFiles.map(f => ({
          path: f.tempFilePath,
          size: f.size,
          name: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`
        }));

        this.setData({
          selectedPhotos: [...this.data.selectedPhotos, ...newPhotos]
        });
      }
    });
  },

  // 移除照片
  removePhoto(e) {
    const idx = e.currentTarget.dataset.index;
    const photos = this.data.selectedPhotos;
    photos.splice(idx, 1);
    this.setData({ selectedPhotos: photos });
  },

  // 批量上传
  startUpload() {
    if (this.data.selectedPhotos.length === 0) {
      wx.showToast({ title: '请先选择照片', icon: 'none' });
      return;
    }

    this.setData({
      uploading: true,
      uploadProgress: { current: 0, total: this.data.selectedPhotos.length, done: false }
    });

    this.uploadBatch(0);
  },

  // 并发上传（最多 5 个同时）
  uploadBatch(startIdx) {
    const { selectedPhotos, uploadProgress } = this.data;
    const CONCURRENCY = 5;
    const batch = selectedPhotos.slice(startIdx, startIdx + CONCURRENCY);

    if (batch.length === 0) return;

    let completed = 0;

    batch.forEach((photo, i) => {
      upload(photo.path, { filename: photo.name })
        .then(data => {
          // 记录已上传照片 ID
          const app = getApp();
          app.globalData.selectedPhotoIds.push(data.photo_id || data.id);
        })
        .catch(err => {
          console.error('上传失败:', photo.name, err);
        })
        .finally(() => {
          completed++;
          const current = uploadProgress.current + completed;
          this.setData({
            'uploadProgress.current': current
          });

          // 当前批次完成，启动下一批
          if (completed === batch.length) {
            const nextIdx = startIdx + CONCURRENCY;
            if (nextIdx < selectedPhotos.length) {
              this.uploadBatch(nextIdx);
            } else {
              // 全部完成
              this.setData({
                uploading: false,
                'uploadProgress.done': true
              });
              wx.showToast({ title: `已导入 ${current} 张照片`, icon: 'success' });
              wx.navigateBack();
            }
          }
        });
    });
  },

  // 跳过
  skip() {
    wx.navigateBack();
  }
});
