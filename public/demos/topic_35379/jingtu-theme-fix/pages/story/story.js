// pages/story/story.js —— 故事溯源页
Page({
  data: {
    theme: 'light',
    // 用户上传的图片（本地缓存）
    uploadedImages: [],
    // 故事列表
    stories: [
      {
        icon: '🌿',
        title: '我们与传统地图的不同',
        desc: '传统地图应用主打通勤效率，追求最快路线、最短时间。而静途，只专注于运动慢行场景。我们相信，慢下来，才能发现身边的美好。',
        highlight: '不做通勤导航，只做运动慢行'
      },
      {
        icon: '🚴',
        title: '骑行分为两种',
        desc: '我们将骑行分为「燃脂运动」和「观景休闲」两类。燃脂骑行追求无中断的长绿道、平整路面，适合运动锻炼；观景轻骑行注重风景优美、环境安静，适合情侣约会、亲子陪伴。',
        highlight: '骑行不为通勤，只为热爱'
      },
      {
        icon: '💚',
        title: '慢行的公益价值',
        desc: '每一条被推荐的路线，背后都有用户的共建反馈。你上报的每一个问题、上传的每一条私藏路线，都在帮助更多人找到安全、安静、美丽的慢行空间。这是我们的全民共建计划。',
        highlight: '你的每一次反馈，都在改变城市'
      },
      {
        icon: '📸',
        title: '记录你的慢行瞬间',
        desc: '在这里，你可以上传步道风景、骑行途中的美丽瞬间。这些照片仅保存在你的设备中，成为你与这座城市的独家记忆。',
        highlight: '本地相册，专属回忆'
      }
    ]
  },

  onLoad: function () {
    // 初始化主题
    const app = getApp();
    this.setData({ theme: app.getTheme() });
    // 加载已保存的图片
    try {
      const saved = wx.getStorageSync('jingtu_story_images');
      if (saved) {
        this.setData({ uploadedImages: saved });
      }
    } catch (e) {
      // ignore
    }
  },

  // 选择图片
  onChooseImage: function () {
    const self = this;
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        const newImages = self.data.uploadedImages.concat(res.tempFilePaths);
        // 本地缓存（仅保存文件路径）
        wx.setStorageSync('jingtu_story_images', newImages);
        self.setData({ uploadedImages: newImages });
        wx.showToast({ title: '已保存到本地', icon: 'success' });
      }
    });
  },

  // 删除图片
  onDeleteImage: function (e) {
    const index = e.currentTarget.dataset.index;
    const newImages = this.data.uploadedImages.filter(function (_, i) { return i !== index; });
    wx.setStorageSync('jingtu_story_images', newImages);
    this.setData({ uploadedImages: newImages });
  },

  // 预览图片
  onPreviewImage: function (e) {
    const current = e.currentTarget.dataset.src;
    wx.previewImage({
      current: current,
      urls: this.data.uploadedImages
    });
  },

  // 返回首页
  onBack: function () {
    wx.navigateBack();
  },

  // 去首页
  onGoIndex: function () {
    wx.redirectTo({ url: '/pages/index/index' });
  },

  // 主题切换回调
  onThemeChange: function(theme) {
    this.setData({ theme: theme });
  }
});