export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/challenge/index',
    'pages/knowledge/index',
    'pages/mine/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#52C41A',
    navigationBarTitleText: '护眼小助手',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F6FFED'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#52C41A',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/challenge/index',
        text: '闯关'
      },
      {
        pagePath: 'pages/knowledge/index',
        text: '知识'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})