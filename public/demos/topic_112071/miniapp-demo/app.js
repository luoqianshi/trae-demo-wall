App({
  globalData: {
    userRole: '',
    userInfo: null,
    houses: [],
    messages: [],
    currentHouse: null
  },

  onLaunch() {
    this.initMockData()
  },

  initMockData() {
    const houses = [
      {
        id: 1,
        title: '西湖区文三路 精装修两室一厅 朝南带阳台',
        price: 3800,
        area: 78,
        rooms: '2室1厅',
        floor: '12/18层',
        direction: '南',
        decoration: '精装',
        type: '整租',
        location: '文三路地铁站 500m',
        tags: ['整租', '近地铁', '有电梯', '朝南'],
        facilities: ['停车位', '暖气', 'WiFi', '热水器', '厨房', '洗衣机', '空调', '电视'],
        description: '房子位于西湖区文三路核心地段，周边配套齐全，步行5分钟到地铁站。房间精装修，家具家电齐全，拎包即可入住。小区环境安静，24小时保安，适合上班族居住。',
        landlord: { name: '张房东', avatar: '张', verified: true },
        hasVR: true,
        status: 'available',
        images: ['https://picsum.photos/400/300?random=1'],
        panorama: 'https://pannellum.org/images/alma.jpg',
        panoramaRooms: [
          { name: '客厅', area: '28㎡', pitch: 0, yaw: 0 },
          { name: '主卧', area: '18㎡', pitch: -5, yaw: 120 },
          { name: '厨房', area: '8㎡', pitch: -8, yaw: -60 }
        ]
      },
      {
        id: 2,
        title: '滨江区政府旁 一居室公寓 拎包入住',
        price: 2800,
        area: 45,
        rooms: '1室1厅',
        floor: '6/20层',
        direction: '东',
        decoration: '精装',
        type: '整租',
        location: '滨江区政府站 300m',
        tags: ['整租', '近地铁', '有电梯'],
        facilities: ['WiFi', '热水器', '厨房', '洗衣机', '空调', '电视'],
        description: '滨江核心地段，近地铁站，周边商场超市齐全。精装修一居室，适合单身白领。',
        landlord: { name: '李房东', avatar: '李', verified: true },
        hasVR: true,
        status: 'available',
        images: ['https://picsum.photos/400/300?random=2'],
        panorama: 'https://pannellum.org/images/bma-0.jpg',
        panoramaRooms: [
          { name: '客厅', area: '20㎡', pitch: 0, yaw: 0 },
          { name: '卧室', area: '15㎡', pitch: -5, yaw: 90 }
        ]
      },
      {
        id: 3,
        title: '拱墅区万达广场 三室两厅 南北通透',
        price: 5200,
        area: 110,
        rooms: '3室2厅',
        floor: '8/16层',
        direction: '南北',
        decoration: '精装',
        type: '整租',
        location: '万达广场站 800m',
        tags: ['整租', '近地铁', '有电梯', '南北通透'],
        facilities: ['停车位', 'WiFi', '热水器', '厨房', '洗衣机', '空调', '电视', '暖气'],
        description: '万达广场附近，三室两厅适合家庭居住。南北通透，采光极好。',
        landlord: { name: '王房东', avatar: '王', verified: true },
        hasVR: false,
        status: 'available',
        images: ['https://picsum.photos/400/300?random=3'],
        panorama: ''
      }
    ]

    const messages = [
      {
        id: 1,
        houseId: 1,
        landlordId: 1,
        landlordName: '张房东',
        unread: 2,
        lastMessage: '可以的，我周六下午在家等您',
        lastTime: '14:35',
        avatar: '张',
        chatHistory: [
          { id: 1, from: 'landlord', type: 'house', content: '', house: houses[0], time: '14:30' },
          { id: 2, from: 'landlord', type: 'text', content: '您好，这套房子还在出租，随时可以看房的', time: '14:30' },
          { id: 3, from: 'tenant', type: 'text', content: '好的，我看了全景图，房子挺满意的。请问可以养宠物吗？', time: '14:31' },
          { id: 4, from: 'landlord', type: 'text', content: '小型宠物可以的，大型犬不行哦。您什么时候方便来看房？', time: '14:32' },
          { id: 5, from: 'tenant', type: 'text', content: '这周末可以，周六下午2点方便吗？', time: '14:33' },
          { id: 6, from: 'landlord', type: 'text', content: '可以的，我周六下午在家等您。地址是文三路168号3单元1202', time: '14:35' }
        ]
      }
    ]

    this.globalData.houses = houses
    this.globalData.messages = messages
  }
})
