Page({
  data: {
    plantName: '我的小龟背',
    days: 128,
    records: [
      {
        id: '1',
        date: '2023.10.12',
        weather: '晴',
        weatherIcon: '☀️',
        image: '/images/龟背竹成长记录_成株阶段.jpg',
        content: '今天它长出了第一片新叶，浅绿色的，非常娇嫩。仿佛能听到生命拔节的声音。',
        type: 'growth'
      },
      {
        id: '2',
        date: '2023.10.05',
        weather: '阴',
        weatherIcon: '🌥️',
        image: '/images/龟背竹成长记录_中苗阶段.jpg',
        content: '换了更大的盆，希望它的根系能在这里自由呼吸。剪掉了一些枯黄的叶尖。',
        type: 'repot'
      },
      {
        id: '3',
        date: '2023.09.28',
        weather: '晴',
        weatherIcon: '☀️',
        image: '/images/龟背竹成长记录_小苗阶段.jpg',
        content: '晨光落在叶面上，那是它们最美的时刻。我拍下了这张照片，作为我们相遇第一周的纪念。',
        type: 'water'
      }
    ]
  },

  onLoad() {
  },

  generateVideo() {
    wx.showToast({ title: '正在生成成长视频...', icon: 'loading', duration: 2000 })
    setTimeout(() => {
      wx.showToast({ title: '视频生成成功', icon: 'success' })
    }, 2000)
  },

  addRecord() {
    wx.showActionSheet({
      itemList: ['拍照记录', '从相册选择', '文字记录'],
      success: (res) => {
        wx.showToast({ title: '添加记录', icon: 'none' })
      }
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
