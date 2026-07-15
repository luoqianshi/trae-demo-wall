export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/record/index',
    'pages/mine/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0a0a0a',
    navigationBarTitleText: '文明养犬预警',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0a0a0a'
  },
  tabBar: {
    color: 'rgba(255, 255, 255, 0.4)',
    selectedColor: '#00ff88',
    backgroundColor: '#1a1a1a',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '监控'
      },
      {
        pagePath: 'pages/record/index',
        text: '记录'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})