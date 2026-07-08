export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/community/index',
    'pages/mine/index',
    'pages/order-detail/index',
    'pages/order-publish/index',
    'pages/orders-list/index',
    'pages/invitation-list/index',
    'pages/article-detail/index',
    'pages/article-publish/index',
    'pages/profile-edit/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0e7c7b',
    navigationBarTitleText: '滴滴带钓',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f5f9f8'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#0e7c7b',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/community/index',
        text: '社区'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
