App({
  globalData: {
    userInfo: null,
    petData: [],
    adoptedPets: [],
    lostPets: [],
    topics: [],
    hospitals: []
  },

  onLaunch: function () {
    this.initData();
    this.checkLogin();
  },

  initData: function() {
    this.globalData.petData = [
      {
        id: 0,
        name: "毛毛",
        breed: "金毛寻回犬",
        gender: "公",
        age: "约2岁",
        image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop",
        type: "lost",
        statusText: "走失寻回",
        distance: "2.3",
        publishTime: "15分钟前",
        location: "朝阳区 · 望京SOHO附近",
        lostTime: "3天前",
        features: "左耳有白斑，戴红项圈",
        description: "毛毛是一只2岁的公金毛，性格温顺亲人，会握手、坐下等指令。3天前傍晚在望京SOHO附近遛弯时，因追逐一只流浪猫跑丢了。走失时戴着红色项圈，项圈上有主人联系方式的吊牌。左耳内侧有一小块白色斑点，比较好辨认。",
        publisher: "李先生",
        commentCount: 3
      },
      {
        id: 1,
        name: "小橘",
        breed: "橘猫",
        gender: "公",
        age: "约1岁",
        image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop",
        type: "found",
        statusText: "发现流浪",
        distance: "4.1",
        publishTime: "20分钟前",
        location: "海淀区 · 中关村软件园",
        lostTime: "未知",
        features: "体型偏瘦，很亲人",
        description: "在中关村软件园二期发现一只橘猫，看起来很饿，一直在垃圾桶旁边找东西吃。性格温顺，容易接近，像是走丢的宠物猫。",
        publisher: "王女士",
        commentCount: 2
      },
      {
        id: 2,
        name: "豆豆",
        breed: "拉布拉多",
        gender: "母",
        age: "3岁",
        image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=300&fit=crop",
        type: "found",
        statusText: "已找回",
        distance: "1.8",
        publishTime: "1小时前",
        location: "朝阳区 · 三里屯",
        lostTime: "2天前",
        features: "黑色短毛，戴蓝项圈",
        description: "豆豆已经安全回家！感谢好心人的帮助，在三里屯附近找到了她。",
        publisher: "张女士",
        commentCount: 5
      },
      {
        id: 3,
        name: "聪聪",
        breed: "边境牧羊犬",
        gender: "公",
        age: "2岁",
        image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop",
        type: "lost",
        statusText: "走失寻回",
        distance: "5.7",
        publishTime: "2小时前",
        location: "朝阳区 · 三元桥",
        lostTime: "1天前",
        features: "黑白相间，戴蓝项圈",
        description: "聪聪是一只非常聪明的边牧，1天前在三元桥附近走失。",
        publisher: "刘先生",
        commentCount: 1
      },
      {
        id: 4,
        name: "雪球",
        breed: "萨摩耶",
        gender: "母",
        age: "1岁",
        image: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=300&fit=crop",
        type: "adopt",
        statusText: "待领养",
        distance: "3.2",
        publishTime: "3小时前",
        location: "朝阳区 · 朝阳公园",
        lostTime: "无",
        features: "雪白长毛，微笑天使",
        description: "雪球是一只可爱的萨摩耶，性格活泼开朗，已完成疫苗和驱虫，希望找到一个有爱心的家庭。",
        publisher: "北京领养中心",
        commentCount: 8
      },
      {
        id: 5,
        name: "花花",
        breed: "英短",
        gender: "母",
        age: "6个月",
        image: "https://images.unsplash.com/photo-1494256997604-768d1f608cac?w=400&h=300&fit=crop",
        type: "adopt",
        statusText: "待领养",
        distance: "4.5",
        publishTime: "4小时前",
        location: "海淀区 · 五道口",
        lostTime: "无",
        features: "蓝白相间，眼睛很大",
        description: "花花是一只6个月大的英短蓝白猫，性格温顺粘人，已完成疫苗。",
        publisher: "猫咪之家",
        commentCount: 6
      },
      {
        id: 6,
        name: "旺财",
        breed: "贵宾犬",
        gender: "公",
        age: "3岁",
        image: "https://images.unsplash.com/photo-1612195583950-b8a741f3eafc?w=400&h=300&fit=crop",
        type: "found",
        statusText: "发现流浪",
        distance: "6.2",
        publishTime: "5小时前",
        location: "朝阳区 · 国贸",
        lostTime: "未知",
        features: "棕色卷毛",
        description: "在国贸附近发现一只贵宾犬，看起来像是走丢的，很亲人。",
        publisher: "陈女士",
        commentCount: 0
      },
      {
        id: 7,
        name: "咪咪",
        breed: "田园猫",
        gender: "母",
        age: "1岁",
        image: "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=400&h=300&fit=crop",
        type: "adopt",
        statusText: "待领养",
        distance: "2.8",
        publishTime: "6小时前",
        location: "西城区 · 西单",
        lostTime: "无",
        features: "三花猫",
        description: "咪咪是一只三花猫，非常聪明，会用猫砂，已完成疫苗。",
        publisher: "流浪猫救助站",
        commentCount: 4
      },
      {
        id: 8,
        name: "大黄",
        breed: "金毛寻回犬",
        gender: "公",
        age: "4岁",
        image: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&h=300&fit=crop",
        type: "lost",
        statusText: "走失寻回",
        distance: "8.5",
        publishTime: "12小时前",
        location: "朝阳区 · 大望路",
        lostTime: "5天前",
        features: "体型较大，戴红项圈",
        description: "大黄是一只4岁的公金毛，5天前在大望路附近走失。",
        publisher: "赵先生",
        commentCount: 2
      }
    ];

    this.globalData.topics = [
      {
        id: 0,
        title: "#望京寻宠互助#",
        desc: "望京地区宠物主人互助交流，一起寻找走失的毛孩子",
        posts: 128,
        members: 2341
      },
      {
        id: 1,
        title: "#猫咪领养指南#",
        desc: "分享猫咪领养经验，帮助流浪猫找到温暖的家",
        posts: 86,
        members: 1567
      },
      {
        id: 2,
        title: "#狗狗训练技巧#",
        desc: "交流狗狗训练心得，让毛孩子更听话",
        posts: 64,
        members: 987
      },
      {
        id: 3,
        title: "#宠物医疗科普#",
        desc: "分享宠物健康知识，预防疾病",
        posts: 45,
        members: 723
      }
    ];

    this.globalData.hospitals = [
      {
        id: 0,
        name: "北京宠爱国际动物医院",
        address: "朝阳区望京SOHO T1",
        rating: 4.8,
        services: ["急诊", "内科", "外科", "美容"]
      },
      {
        id: 1,
        name: "瑞鹏宠物医院",
        address: "海淀区中关村大街",
        rating: 4.6,
        services: ["疫苗", "驱虫", "绝育", "眼科"]
      },
      {
        id: 2,
        name: "美联众合动物医院",
        address: "朝阳区三里屯太古里",
        rating: 4.7,
        services: ["骨科", "牙科", "皮肤科", "住院"]
      }
    ];
  },

  checkLogin: function() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.globalData.userInfo = userInfo;
      }
    } catch (e) {
      console.error('读取登录信息失败', e);
    }
  },

  login: function(userInfo) {
    this.globalData.userInfo = userInfo;
    try {
      wx.setStorageSync('userInfo', userInfo);
    } catch (e) {
      console.error('保存登录信息失败', e);
    }
  },

  logout: function() {
    this.globalData.userInfo = null;
    try {
      wx.removeStorageSync('userInfo');
    } catch (e) {
      console.error('清除登录信息失败', e);
    }
  }
})
