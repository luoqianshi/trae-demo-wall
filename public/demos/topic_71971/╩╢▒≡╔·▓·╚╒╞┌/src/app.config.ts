export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/history/index',
    'pages/guide/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF6B6B',
    navigationBarTitleText: '银发识期宝',
    navigationBarTextStyle: 'white',
    backgroundColor: '#FFF8F8'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#FF6B6B',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '拍照识别'
      },
      {
        pagePath: 'pages/history/index',
        text: '历史记录'
      },
      {
        pagePath: 'pages/guide/index',
        text: '使用指南'
      }
    ]
  }
})
