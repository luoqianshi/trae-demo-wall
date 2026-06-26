export default defineAppConfig({
  pages: [
    'pages/chat/index',
    'pages/audio/index',
    'pages/health/index',
    'pages/family/index',
    'pages/mine/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF6B35',
    navigationBarTitleText: '银发陪伴',
    navigationBarTextStyle: 'white',
    backgroundColor: '#FFF8F0'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#FF6B35',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/chat/index',
        text: '陪伴聊天'
      },
      {
        pagePath: 'pages/audio/index',
        text: '有声内容'
      },
      {
        pagePath: 'pages/health/index',
        text: '健康养生'
      },
      {
        pagePath: 'pages/family/index',
        text: '家庭中心'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
