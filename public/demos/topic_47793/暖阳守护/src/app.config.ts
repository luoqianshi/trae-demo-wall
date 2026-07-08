export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/health/index',
    'pages/sos/index',
    'pages/family/index',
    'pages/medication/index',
    'pages/binding/index',
    'pages/guardian/index',
    'pages/settings/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF8C42',
    navigationBarTitleText: '暖阳守护',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#FF8C42',
    borderStyle: 'white',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/health/index',
        text: '健康'
      },
      {
        pagePath: 'pages/medication/index',
        text: '用药'
      },
      {
        pagePath: 'pages/sos/index',
        text: '求助'
      }
    ]
  }
})
