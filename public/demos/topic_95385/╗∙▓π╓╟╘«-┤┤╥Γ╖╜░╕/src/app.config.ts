export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/policy/index',
    'pages/qa/index',
    'pages/mine/index',
    'pages/policy-detail/index',
    'pages/push/index',
    'pages/guide/index'
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#F5F3EF',
    navigationBarTitleText: '基层智援',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F5F3EF'
  },
  tabBar: {
    color: '#666666',
    selectedColor: '#5CACEE',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/policy/index',
        text: '政策库'
      },
      {
        pagePath: 'pages/qa/index',
        text: '问答'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})