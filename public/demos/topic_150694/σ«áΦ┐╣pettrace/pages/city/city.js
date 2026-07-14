const app = getApp()

Page({
  data: {
    notifications: [],
    showMoreBtn: false
  },

  onLoad: function () {
    this.initNotifications()
  },

  initNotifications: function() {
    const petData = app.globalData.petData
    const notifications = [
      {
        id: 0,
        petId: 0,
        image: petData[0].image,
        title: '【紧急寻宠】金毛犬毛毛在望京走失',
        desc: '朝阳区望京SOHO附近，见到请联系...',
        time: '5分钟前 · 距离您2.3km'
      },
      {
        id: 1,
        petId: 1,
        image: petData[1].image,
        title: '【发现流浪】一只橘猫在软件园徘徊',
        desc: '海淀区中关村软件园二期，看起来很饿...',
        time: '20分钟前 · 距离您4.1km'
      },
      {
        id: 2,
        petId: 2,
        image: petData[2].image,
        title: '【好消息】拉布拉多豆豆已找到！',
        desc: '感谢好心人的帮助，豆豆已安全回家',
        time: '1小时前'
      },
      {
        id: 3,
        petId: 3,
        image: petData[3].image,
        title: '【寻宠启事】边牧聪聪在三元桥走失',
        desc: '朝阳区三元桥附近，戴着蓝色项圈...',
        time: '2小时前 · 距离您5.7km'
      },
      {
        id: 4,
        petId: 6,
        image: petData[6].image,
        title: '【发现流浪】贵宾犬在国贸出现',
        desc: '朝阳区国贸附近，看起来像走丢的...',
        time: '2小时前 · 距离您6.2km'
      },
      {
        id: 5,
        petId: 8,
        image: petData[8].image,
        title: '【紧急寻宠】金毛大黄在大望桥附近走失',
        desc: '朝阳区大望路，4岁公犬，未绝育...',
        time: '12小时前 · 距离您8.5km'
      }
    ]
    this.setData({
      notifications: notifications.slice(0, 3),
      showMoreBtn: notifications.length > 3
    })
  },

  showAllNotifications: function() {
    const petData = app.globalData.petData
    const notifications = [
      {
        id: 0,
        petId: 0,
        image: petData[0].image,
        title: '【紧急寻宠】金毛犬毛毛在望京走失',
        desc: '朝阳区望京SOHO附近，见到请联系...',
        time: '5分钟前 · 距离您2.3km'
      },
      {
        id: 1,
        petId: 1,
        image: petData[1].image,
        title: '【发现流浪】一只橘猫在软件园徘徊',
        desc: '海淀区中关村软件园二期，看起来很饿...',
        time: '20分钟前 · 距离您4.1km'
      },
      {
        id: 2,
        petId: 2,
        image: petData[2].image,
        title: '【好消息】拉布拉多豆豆已找到！',
        desc: '感谢好心人的帮助，豆豆已安全回家',
        time: '1小时前'
      },
      {
        id: 3,
        petId: 3,
        image: petData[3].image,
        title: '【寻宠启事】边牧聪聪在三元桥走失',
        desc: '朝阳区三元桥附近，戴着蓝色项圈...',
        time: '2小时前 · 距离您5.7km'
      },
      {
        id: 4,
        petId: 6,
        image: petData[6].image,
        title: '【发现流浪】贵宾犬在国贸出现',
        desc: '朝阳区国贸附近，看起来像走丢的...',
        time: '2小时前 · 距离您6.2km'
      },
      {
        id: 5,
        petId: 8,
        image: petData[8].image,
        title: '【紧急寻宠】金毛大黄在大望桥附近走失',
        desc: '朝阳区大望路，4岁公犬，未绝育...',
        time: '12小时前 · 距离您8.5km'
      },
      {
        id: 6,
        petId: 0,
        image: petData[0].image,
        title: '【线索反馈】有人在望京西园见过类似金毛',
        desc: '邻居反映在小区垃圾桶旁见过一只金毛...',
        time: '3小时前'
      },
      {
        id: 7,
        petId: 1,
        image: petData[1].image,
        title: '【寻宠启事】英短蓝猫在回龙观走失',
        desc: '昌平区回龙观，叫"小蓝"，2岁公猫...',
        time: '4小时前 · 距离您12km'
      },
      {
        id: 8,
        petId: 2,
        image: petData[2].image,
        title: '【好消息】边牧小白已被主人接回！',
        desc: '感谢社区群友转发，小白已安全到家',
        time: '5小时前'
      },
      {
        id: 9,
        petId: 3,
        image: petData[3].image,
        title: '【发现流浪】萨摩耶在朝阳公园游荡',
        desc: '毛色很干净，应该是走丢的，很亲人...',
        time: '6小时前 · 距离您3.8km'
      },
      {
        id: 10,
        petId: 6,
        image: petData[6].image,
        title: '【寻宠启事】泰迪欢欢在劲松走失',
        desc: '朝阳区劲松附近，3岁母犬，穿粉色衣服...',
        time: '8小时前 · 距离您4.5km'
      },
      {
        id: 11,
        petId: 8,
        image: petData[8].image,
        title: '【领养通知】流浪小猫找领养家庭',
        desc: '已做体检驱虫，2个月大的橘白花猫...',
        time: '10小时前'
      }
    ]
    this.setData({
      notifications: notifications,
      showMoreBtn: false
    })
    wx.showToast({
      title: '已展开全部消息',
      icon: 'none'
    })
  },

  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  }
})
