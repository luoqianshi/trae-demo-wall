Page({
  data: {
    steps: [
      {
        id: 1,
        title: '下载拍摄 App',
        desc: '推荐使用 Google Street View App 或手机自带的全景相机模式。iPhone 用户可使用系统自带的"全景"模式。',
        tips: '确保手机系统版本较新，以获得最佳拍摄体验'
      },
      {
        id: 2,
        title: '选择拍摄位置',
        desc: '站在房间的中心位置，双脚站稳，双臂自然夹紧身体。保持手机垂直，不要倾斜。',
        tips: '避开家具遮挡，选择视野最开阔的位置'
      },
      {
        id: 3,
        title: '缓慢匀速旋转',
        desc: '以身体为轴心，缓慢匀速地转一圈（360度）。速度保持均匀，不要忽快忽慢。',
        tips: '旋转一圈大约需要 10-15 秒，越慢效果越好'
      },
      {
        id: 4,
        title: '检查拼接效果',
        desc: '拍摄完成后检查全景图，确保没有明显的错位、黑边或重影。光线要充足均匀。',
        tips: '避免逆光拍摄，窗户应在身后或侧面'
      },
      {
        id: 5,
        title: '保存并上传',
        desc: '将拍摄好的全景图保存为 JPG 格式，返回本平台上传。每个房间至少拍摄一张。',
        tips: '建议每个房间拍 2-3 张，选择效果最好的一张上传'
      }
    ]
  },

  onGoPublish() {
    wx.showToast({ title: '跳转发布页面', icon: 'none' })
    // wx.navigateTo({ url: '/pages/publish/publish' })
  }
})
