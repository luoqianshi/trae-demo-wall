// 地点数据 - 南京遛娃地点
const PLACES = [
  // ===== 原有 3 个地点 =====
  {
    id: 1,
    name: "紫金山昆虫博物馆",
    district: "玄武区",
    indoors: true,
    types: ["museum", "nature"],
    ageRange: ["3-6"],
    strollerFriendly: true,
    crowdLevel: 4,
    distance: 30,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "可以摸甲虫、看蝴蝶标本制作",
    tags: ["科普", "昆虫"],
    detail: {
      hero: {
        primaryIcon: "bug",
        secondaryIcon: "microscope",
        secondaryPosition: "top-right",
        colorTheme: "teal"
      },
      businessHours: "9:00-17:00",
      address: "玄武区四方城西路26号",
      transport: "地铁2号线下马坊站，换乘34路公交至中山陵停车场",
      parking: "景区停车场，按次收费",
      ticketPrice: { price: "60元/人", note: "1.2米以下儿童免票" },
      tips: ["可以摸甲虫", "蝴蝶标本制作体验", "适合3岁以上"],
      reviews: [{ rating: 5, content: "男孩子超喜欢昆虫标本" }],
      nearbyPlaces: [4, 11, 12]
    }
  },
  {
    id: 2,
    name: "绿博园",
    district: "建邺区",
    indoors: false,
    types: ["park", "nature"],
    ageRange: ["0-1", "1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 2,
    distance: 28,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "大草坪、荷兰园，适合奔跑野餐",
    tags: ["野餐", "亲子"],
    detail: {
      hero: {
        primaryIcon: "trees",
        secondaryIcon: "mountain",
        secondaryPosition: "top-right",
        colorTheme: "teal"
      },
      businessHours: "08:30-18:30",
      address: "建邺区扬子江大道228号",
      transport: "地铁10号线绿博园站，2号口出步行5分钟",
      parking: "景区停车场，8元/次",
      ticketPrice: { price: "免费", note: "无需预约" },
      tips: ["大草坪适合野餐", "荷兰园春季郁金香很美", "建议自带食物"],
      reviews: [{ rating: 5, content: "草坪很大，宝宝跑得很开心" }],
      nearbyPlaces: [5, 16]
    }
  },
  {
    id: 3,
    name: "玄武湖公园",
    district: "玄武区",
    indoors: false,
    types: ["park", "nature"],
    ageRange: ["0-1", "1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 3,
    distance: 15,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "划船、喂鸭子、环湖步道",
    tags: ["划船", "喂鱼"],
    detail: {
      hero: {
        primaryIcon: "waves",
        secondaryIcon: "ship",
        secondaryPosition: "top-left",
        colorTheme: "teal"
      },
      businessHours: "五洲区域6:00-22:00(5-10月)/6:00-21:00(11-4月)；环湖路24小时",
      address: "玄武区玄武巷1号",
      transport: "地铁1号线玄武门站，3号口出",
      parking: "玄武门停车场，10元/小时",
      ticketPrice: { price: "免费", note: "无需预约" },
      tips: ["推车友好", "喂鸭子自带面包", "建议早上去人少"],
      reviews: [{ rating: 5, content: "环湖步道推车很方便" }],
      nearbyPlaces: [1, 4, 8]
    }
  },

  // ===== 公园/户外类 =====
  {
    id: 4,
    name: "中山植物园",
    district: "玄武区",
    indoors: false,
    types: ["park", "nature"],
    ageRange: ["1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 2,
    distance: 28,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "热带植物馆+大花园，认识各种奇花异草",
    tags: ["植物", "科普"],
    detail: {
      hero: {
        primaryIcon: "flower-2",
        secondaryIcon: "leaf",
        secondaryPosition: "top-right",
        colorTheme: "teal"
      },
      businessHours: "8:30-17:30(5-9月)/8:30-17:00(10-4月)",
      address: "玄武区前湖后村1号",
      transport: "地铁2号线苜蓿园站，换乘20路公交",
      parking: "植物园停车场，10元/次",
      ticketPrice: { price: "北园15元/南园45元/通票50元", note: "1.4米以下儿童免票" },
      tips: ["南园热带植物宫适合冬天去", "北园人少更清幽", "桥世界孩子喜欢"],
      reviews: [{ rating: 4, content: "热带植物馆很有特色" }, { rating: 5, content: "认识了很多植物" }],
      nearbyPlaces: [1, 3, 8, 21]
    }
  },
  {
    id: 5,
    name: "鱼嘴湿地公园",
    district: "建邺区",
    indoors: false,
    types: ["park", "nature"],
    ageRange: ["0-1", "1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 2,
    distance: 40,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "江边灯塔、日落湿地，拍照遛娃两不误",
    tags: ["江景", "日落"],
    detail: {
      hero: {
        primaryIcon: "sunrise",
        secondaryIcon: "waves",
        secondaryPosition: "bottom-right",
        colorTheme: "teal"
      },
      businessHours: "全天24小时开放",
      address: "建邺区扬子江大道888号",
      transport: "地铁2号线鱼嘴站，8号口出",
      parking: "景区停车场，免费",
      ticketPrice: { price: "免费", note: "无需预约" },
      tips: ["日落时分最美", "江边风大注意保暖", "带推车完全OK"],
      reviews: [{ rating: 5, content: "灯塔拍照绝美，宝宝喜欢看江" }, { rating: 4, content: "日落很浪漫" }],
      nearbyPlaces: [2, 16, 20]
    }
  },
  {
    id: 6,
    name: "将军山风景区",
    district: "雨花台区",
    indoors: false,
    types: ["park", "nature"],
    ageRange: ["3-6"],
    strollerFriendly: false,
    crowdLevel: 2,
    distance: 35,
    duration: "full",
    hasParking: true,
    closed: true,
    description: "已闭园（原森林氧吧、山间小溪，适合带娃爬山玩水）",
    tags: ["爬山", "森林"],
    detail: {
      hero: {
        primaryIcon: "mountain",
        secondaryIcon: "trees",
        secondaryPosition: "top-left",
        colorTheme: "teal"
      },
      businessHours: "景区已关闭",
      address: "雨花台区铁心桥高家库村",
      transport: "",
      parking: "",
      ticketPrice: { price: "", note: "景区已关闭" },
      tips: ["该景区已于2016年关闭，请勿前往"],
      reviews: [],
      nearbyPlaces: [7]
    }
  },

  // ===== 博物馆/科普类 =====
  {
    id: 7,
    name: "南京科技馆",
    district: "雨花台区",
    indoors: true,
    types: ["museum", "science"],
    ageRange: ["1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 3,
    distance: 25,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "互动科学展品，机器人、力学实验玩不停",
    tags: ["科技", "互动"],
    detail: {
      hero: {
        primaryIcon: "cpu",
        secondaryIcon: "atom",
        secondaryPosition: "top-right",
        colorTheme: "purple"
      },
      businessHours: "周三至周日9:00-17:00，周一周二闭馆（法定节假日除外）",
      address: "雨花台区紫荆花路9号",
      transport: "地铁1号线花神庙站，2号口出步行15分钟",
      parking: "科技馆停车场，免费",
      ticketPrice: { price: "免费", note: "需公众号预约" },
      tips: ["周二闭馆别跑空", "互动项目要排队", "建议上午去"],
      reviews: [{ rating: 5, content: "互动体验很棒，孩子玩了一上午" }, { rating: 4, content: "免费的很值" }],
      nearbyPlaces: [6, 10]
    }
  },
  {
    id: 8,
    name: "南京博物院",
    district: "玄武区",
    indoors: true,
    types: ["museum", "culture"],
    ageRange: ["3-6"],
    strollerFriendly: true,
    crowdLevel: 4,
    distance: 22,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "历史文化启蒙，有专门的儿童互动体验区",
    tags: ["历史", "文化"],
    detail: {
      hero: {
        primaryIcon: "landmark",
        secondaryIcon: "book-open",
        secondaryPosition: "top-right",
        colorTheme: "yellow"
      },
      businessHours: "09:00-17:00，16:00停止检票，周一闭馆（法定节假日除外）",
      address: "玄武区中山东路321号",
      transport: "地铁2号线明故宫站，1号口出步行5分钟",
      parking: "博物院停车场，10元/小时",
      ticketPrice: { price: "免费", note: "需公众号提前预约" },
      tips: ["一定要提前预约", "建议上午去，下午人多", "有儿童体验室"],
      reviews: [{ rating: 5, content: "历史馆很震撼，儿童体验区适合小朋友" }],
      nearbyPlaces: [1, 3, 4, 35]
    }
  },
  {
    id: 9,
    name: "江苏省科技馆",
    district: "鼓楼区",
    indoors: true,
    types: ["museum", "science"],
    ageRange: ["3-6"],
    strollerFriendly: true,
    crowdLevel: 2,
    distance: 20,
    duration: "half",
    hasParking: true,
    closed: true,
    description: "已关闭（原人少体验好，动手实验项目丰富）",
    tags: ["实验", "科技"],
    detail: {
      hero: {
        primaryIcon: "microscope",
        secondaryIcon: "flask-conical",
        secondaryPosition: "top-left",
        colorTheme: "purple"
      },
      businessHours: "已关闭",
      address: "鼓楼区石头城118号",
      transport: "",
      parking: "",
      ticketPrice: { price: "", note: "已关闭" },
      tips: ["该馆已关闭"],
      reviews: [],
      nearbyPlaces: [27]
    }
  },
  {
    id: 10,
    name: "南京地质博物馆",
    district: "玄武区",
    indoors: true,
    types: ["museum", "science", "nature"],
    ageRange: ["3-6"],
    strollerFriendly: true,
    crowdLevel: 2,
    distance: 18,
    duration: "half",
    hasParking: false,
    closed: false,
    description: "恐龙化石、宝石矿石，小小地质学家的天堂",
    tags: ["恐龙", "化石"],
    detail: {
      hero: {
        primaryIcon: "gem",
        secondaryIcon: "skull",
        secondaryPosition: "top-right",
        colorTheme: "purple"
      },
      businessHours: "周三至周五9:30-16:30，周六日9:00-16:30，周一、周二休息",
      address: "玄武区珠江路700号",
      transport: "地铁2号线西安门站，3号口出步行10分钟",
      parking: "无专用停车场，建议公共交通",
      ticketPrice: { price: "免费", note: "无需预约，携带身份证" },
      tips: ["恐龙化石是亮点", "周一周二闭馆", "市中心停车不便"],
      reviews: [{ rating: 5, content: "恐龙化石宝宝超喜欢" }],
      nearbyPlaces: [8, 35]
    }
  },

  // ===== 动物园/自然类 =====
  {
    id: 11,
    name: "红山森林动物园",
    district: "玄武区",
    indoors: false,
    types: ["zoo", "nature"],
    ageRange: ["0-1", "1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 5,
    distance: 20,
    duration: "full",
    hasParking: true,
    closed: false,
    description: "看大熊猫、长颈鹿、考拉，宝宝最爱打卡地",
    tags: ["大熊猫", "动物"],
    detail: {
      hero: {
        primaryIcon: "paw-print",
        secondaryIcon: "heart",
        secondaryPosition: "top-right",
        colorTheme: "yellow"
      },
      businessHours: "08:30-16:30",
      address: "玄武区和燕路168号",
      transport: "地铁1号线红山动物园站，1号口出步行3分钟",
      parking: "北门停车场，10元/小时",
      ticketPrice: { price: "70元/人", note: "年卡120元/人；1.4米以下儿童免票" },
      tips: ["早上动物更活跃", "考拉馆很热门", "山路多建议穿舒适鞋"],
      reviews: [{ rating: 5, content: "大熊猫和考拉太可爱了" }, { rating: 5, content: "宝宝看动物看呆了" }],
      nearbyPlaces: [3, 10]
    }
  },
  {
    id: 12,
    name: "南京海底世界",
    district: "玄武区",
    indoors: true,
    types: ["zoo", "nature", "water"],
    ageRange: ["0-1", "1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 4,
    distance: 28,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "海底隧道、海豚表演，梦幻海洋之旅",
    tags: ["海豚", "海洋"],
    detail: {
      hero: {
        primaryIcon: "fish",
        secondaryIcon: "waves",
        secondaryPosition: "top-right",
        colorTheme: "purple"
      },
      businessHours: "9:00-16:30",
      address: "玄武区中山陵园四方城8号",
      transport: "地铁2号线苜蓿园站，换乘观光车",
      parking: "海底世界停车场，10元/小时",
      ticketPrice: { price: "180元/人", note: "1.2米以下儿童免票；年卡更划算" },
      tips: ["海豚表演有固定场次", "海底隧道很出片", "建议工作日去"],
      reviews: [{ rating: 4, content: "海底隧道很美，但价格偏贵" }],
      nearbyPlaces: [1, 4, 21]
    }
  },

  // ===== 室内游乐场 =====
  {
    id: 13,
    name: "奈尔宝家庭中心",
    district: "建邺区",
    indoors: true,
    types: ["playground", "mall"],
    ageRange: ["0-1", "1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 4,
    distance: 26,
    duration: "full",
    hasParking: true,
    closed: false,
    description: "大型室内亲子乐园，吃喝玩乐一站式搞定",
    tags: ["乐园", "一站式"],
    detail: {
      hero: {
        primaryIcon: "castle",
        secondaryIcon: "sparkles",
        secondaryPosition: "top-right",
        colorTheme: "pink"
      
      },
      businessHours: "周二至周日10:00-21:00（周一闭店清洁）",
      address: "建邺区江东中路258号华采天地购物中心3楼",
      transport: "地铁2号线元通站，5号口出步行5分钟",
      parking: "华采天地停车场，8元/小时",
      ticketPrice: { price: "298元/一大一小", note: "多平台有优惠团购" },
      tips: ["穿防滑袜入场", "工作日人少体验好", "内有亲子餐厅"],
      reviews: [{ rating: 5, content: "颜值超高，宝宝玩了一整天" }, { rating: 4, content: "价格略贵但值得" }],
      nearbyPlaces: [2, 5, 16]
    }
  },
  {
    id: 14,
    name: "万达宝贝王",
    district: "江宁区",
    indoors: true,
    types: ["playground", "mall"],
    ageRange: ["1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 3,
    distance: 35,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "淘气堡、电玩、角色扮演，放电好去处",
    tags: ["淘气堡", "电玩"],
    detail: {
      hero: {
        primaryIcon: "gamepad-2",
        secondaryIcon: "star",
        secondaryPosition: "top-left",
        colorTheme: "pink"
      
      },
      businessHours: "10:00-21:30",
      address: "江宁区竹山路59号江宁万达广场2层",
      transport: "地铁1号线天印大道站，打车起步价",
      parking: "万达广场停车场，6元/小时",
      ticketPrice: { price: "按项目收费，约30-50元/次", note: "可办充值卡更划算" },
      tips: ["淘气堡人气最高", "周末人多建议上午去"],
      reviews: [{ rating: 4, content: "孩子很喜欢淘气堡" }],
      nearbyPlaces: [28, 38]
    }
  },
  {
    id: 15,
    name: "卡通尼乐园",
    district: "鼓楼区",
    indoors: true,
    types: ["playground", "mall"],
    ageRange: ["1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 3,
    distance: 18,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "滑梯球池+角色扮演，适合各年龄段宝宝",
    tags: ["球池", "角色扮演"],
    detail: {
      hero: {
        primaryIcon: "smile",
        secondaryIcon: "balloon",
        secondaryPosition: "top-right",
        colorTheme: "pink"
      
      },
      businessHours: "10:00-21:30",
      address: "鼓楼区凤凰书城4楼（南京多家分店）",
      transport: "地铁1号线玄武门站，步行10分钟",
      parking: "凤凰书城停车场，8元/小时",
      ticketPrice: { price: "按项目收费，约20-50元/次", note: "可办会员卡" },
      tips: ["球池区最受欢迎", "南京有多家分店可选"],
      reviews: [{ rating: 4, content: "滑梯球池小朋友玩疯了" }],
      nearbyPlaces: [17, 27]
    }
  },

  // ===== 商场/亲子 =====
  {
    id: 16,
    name: "河西金鹰世界",
    district: "建邺区",
    indoors: true,
    types: ["mall"],
    ageRange: ["0-1", "1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 3,
    distance: 24,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "亲子楼层+儿童乐园+美食，雨天遛娃首选",
    tags: ["商场", "美食"],
    detail: {
      hero: {
        primaryIcon: "shopping-bag",
        secondaryIcon: "utensils",
        secondaryPosition: "top-left",
        colorTheme: "pink"
      
      },
      businessHours: "10:00-22:00",
      address: "建邺区应天大街888号",
      transport: "地铁2号线集庆门大街站，7A号口出",
      parking: "金鹰世界停车场，6元/小时",
      ticketPrice: { price: "商场免费入场", note: "有儿童乐园需购票" },
      tips: ["亲子楼层在3-4楼", "美食选择多", "雨天遛娃首选"],
      reviews: [{ rating: 4, content: "亲子楼层设施不错" }],
      nearbyPlaces: [2, 5, 33, 34]
    }
  },
  {
    id: 17,
    name: "德基广场",
    district: "玄武区",
    indoors: true,
    types: ["mall"],
    ageRange: ["1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 4,
    distance: 16,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "市中心高端商场，有儿童区和亲子餐厅",
    tags: ["市中心", "亲子餐厅"],
    detail: {
      hero: {
        primaryIcon: "shopping-cart",
        secondaryIcon: "gift",
        secondaryPosition: "top-right",
        colorTheme: "pink"
      
      },
      businessHours: "10:00-22:00",
      address: "玄武区中山路18号（新街口）",
      transport: "地铁1号线/2号线新街口站，7号口出",
      parking: "德基广场停车场，12元/小时",
      ticketPrice: { price: "商场免费入场", note: "有高端儿童区" },
      tips: ["高端商场，儿童品牌集中", "有亲子餐厅"],
      reviews: [{ rating: 4, content: "儿童区品牌不错" }],
      nearbyPlaces: [3, 8, 35]
    }
  },

  // ===== 农场/采摘 =====
  {
    id: 18,
    name: "陌上花渡",
    district: "栖霞区",
    indoors: false,
    types: ["farm", "nature", "park"],
    ageRange: ["1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 2,
    distance: 50,
    duration: "full",
    hasParking: true,
    closed: false,
    description: "花海、采摘、小动物，全家郊游好去处",
    tags: ["采摘", "花海"],
    detail: {
      hero: {
        primaryIcon: "apple",
        secondaryIcon: "flower-2",
        secondaryPosition: "top-left",
        colorTheme: "yellow"
      
      },
      businessHours: "9:00-17:00（花期季节可能会延长）",
      address: "栖霞区八卦洲街道",
      transport: "建议自驾，地铁1号线迈皋桥站换乘公交567路",
      parking: "景区停车场，免费",
      ticketPrice: { price: "免费", note: "部分活动项目收费" },
      tips: ["春秋季花海最美", "适合搭配八卦洲一日游"],
      reviews: [{ rating: 4, content: "花海很美，适合拍照" }],
      nearbyPlaces: []
    }
  },

  // ===== 主题乐园 =====
  {
    id: 19,
    name: "银杏湖乐园",
    district: "江宁区",
    indoors: false,
    types: ["playground", "park", "nature"],
    ageRange: ["3-6"],
    strollerFriendly: true,
    crowdLevel: 4,
    distance: 55,
    duration: "full",
    hasParking: true,
    closed: false,
    description: "大型主题乐园，有儿童区+生态区+游乐设施",
    tags: ["过山车", "主题乐园"],
    detail: {
      hero: {
        primaryIcon: "roller-coaster",
        secondaryIcon: "sparkles",
        secondaryPosition: "top-right",
        colorTheme: "primary"
      
      },
      businessHours: "9:30-17:00（周末及节假日延长）",
      address: "江宁区银杏湖大道520号",
      transport: "地铁S1号线正方中路站，换乘免费接驳车",
      parking: "乐园停车场，10元/次",
      ticketPrice: { price: "260元/人", note: "1.2米以下儿童免票；年卡更划算" },
      tips: ["生态区适合小宝宝", "游乐区适合3岁以上", "带好防晒和水"],
      reviews: [{ rating: 5, content: "生态区很漂亮，孩子很喜欢" }, { rating: 4, content: "游乐设施适合大一点的孩子" }],
      nearbyPlaces: [28, 38]
    }
  },

  // ===== 其他特色 =====
  {
    id: 20,
    name: "南京奥体中心游泳馆",
    district: "建邺区",
    indoors: true,
    types: ["water", "playground"],
    ageRange: ["0-1", "1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 3,
    distance: 22,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "儿童戏水池，恒温室内，夏天玩水不怕晒",
    tags: ["游泳", "玩水"],
    detail: {
      hero: {
        primaryIcon: "waves",
        secondaryIcon: "droplets",
        secondaryPosition: "bottom-left",
        colorTheme: "purple"
      },
      businessHours: "周一至周五12:00-22:00，周末及节假日10:00-22:00",
      address: "建邺区江东中路222号奥体中心内",
      transport: "地铁2号线奥体东站，3号口出步行5分钟",
      parking: "奥体中心停车场，5元/小时",
      ticketPrice: { price: "35-40元/次", note: "不限时，可办季卡" },
      tips: ["水质很好", "有儿童戏水池", "自带拖鞋毛巾"],
      reviews: [{ rating: 4, content: "水质干净，儿童池很适合小宝宝" }],
      nearbyPlaces: [2, 5, 16]
    }
  },

  // ===== 新增：公园/户外类 =====
  {
    id: 21,
    name: "钟山体育公园",
    district: "玄武区",
    indoors: false,
    types: ["park", "nature"],
    ageRange: ["0-1", "1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 3,
    distance: 15,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "超大草坪滑草放风筝，网红树旁野餐露营",
    tags: ["草坪", "滑草"],
    detail: {
      hero: {
        primaryIcon: "mountain",
        secondaryIcon: "sun",
        secondaryPosition: "top-right",
        colorTheme: "teal"
      
      },
      businessHours: "全天开放",
      address: "玄武区沪宁高速公路连接线（钟灵街地铁站旁）",
      transport: "地铁2号线钟灵街站，1号口出步行3分钟",
      parking: "灵谷寺停车场，10元/次",
      ticketPrice: { price: "免费", note: "无需预约" },
      tips: ["网红树在草坪中央", "适合带野餐垫", "滑草板自备"],
      reviews: [{ rating: 5, content: "大草坪太适合遛娃了！" }, { rating: 5, content: "网红树超出片" }],
      nearbyPlaces: [4, 1, 12]
    }
  },

  // ===== 新增：公园/户外类（续）=====
  {
    id: 22,
    name: "聚宝山公园",
    district: "栖霞区",
    indoors: false,
    types: ["park", "nature"],
    ageRange: ["0-1", "1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 2,
    distance: 25,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "有儿童乐园和定向越野，人少空气好",
    tags: ["森林", "儿童乐园"],
    detail: {
      hero: {
        primaryIcon: "trees",
        secondaryIcon: "compass",
        secondaryPosition: "top-right",
        colorTheme: "teal"
      
      },
      businessHours: "全天开放",
      address: "栖霞区栖霞大道与仙尧路交汇处",
      transport: "地铁4号线聚宝山站，1号口出步行5分钟",
      parking: "公园停车场，免费",
      ticketPrice: { price: "免费", note: "金陵矩阵等付费项目单独购票" },
      tips: ["金陵矩阵适合3岁以上", "有儿童乐园", "可以搭帐篷"],
      reviews: [{ rating: 4, content: "金陵矩阵孩子很喜欢" }],
      nearbyPlaces: [25, 24]
    }
  },
  {
    id: 23,
    name: "莫愁湖公园",
    district: "建邺区",
    indoors: false,
    types: ["park"],
    ageRange: ["0-1", "1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 3,
    distance: 12,
    duration: "half",
    hasParking: false,
    closed: false,
    description: "市区老牌公园，海棠花季美，有儿童游乐区",
    tags: ["赏花", "划船"],
    detail: {
      hero: {
        primaryIcon: "flower-2",
        secondaryIcon: "ship",
        secondaryPosition: "top-left",
        colorTheme: "teal"
      
      },
      businessHours: "07:00-21:00",
      address: "建邺区水西门大街132号",
      transport: "地铁2号线莫愁湖站，1号口出步行3分钟",
      parking: "无专用停车场，建议公共交通",
      ticketPrice: { price: "免费", note: "无需预约" },
      tips: ["海棠花季3-4月最美", "有儿童游乐区", "可以划船"],
      reviews: [{ rating: 4, content: "春季海棠花很美" }],
      nearbyPlaces: [27, 15]
    }
  },
  {
    id: 24,
    name: "羊山公园",
    district: "栖霞区",
    indoors: false,
    types: ["park", "nature"],
    ageRange: ["0-1", "1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 2,
    distance: 30,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "仙林大学城旁，大草坪放风筝，有小山坡攀爬",
    tags: ["草坪", "放风筝"],
    detail: {
      hero: {
        primaryIcon: "sunrise",
        secondaryIcon: "wind",
        secondaryPosition: "top-right",
        colorTheme: "teal"
      
      },
      businessHours: "全天开放",
      address: "栖霞区仙林大学城东部（仙林大道与九乡河西路交汇处）",
      transport: "地铁2号线羊山公园站，1号口出步行5分钟",
      parking: "公园停车场，免费",
      ticketPrice: { price: "免费", note: "无需预约" },
      tips: ["大草坪适合放风筝", "有小山坡可以攀爬", "仙林大学城附近可逛"],
      reviews: [{ rating: 5, content: "人少草好，小朋友跑得很开心" }],
      nearbyPlaces: [25]
    }
  },
  {
    id: 25,
    name: "仙林湖公园",
    district: "栖霞区",
    indoors: false,
    types: ["park", "nature"],
    ageRange: ["0-1", "1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 2,
    distance: 35,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "环湖步道推车友好，有沙池和儿童滑梯",
    tags: ["环湖", "沙池"],
    detail: {
      hero: {
        primaryIcon: "waves",
        secondaryIcon: "umbrella",
        secondaryPosition: "bottom-right",
        colorTheme: "teal"
      },
      businessHours: "全天开放",
      address: "栖霞区仙林大学城白象片区",
      transport: "地铁4号线仙林湖站，1号口出步行3分钟",
      parking: "公园停车场，免费",
      ticketPrice: { price: "免费", note: "无需预约" },
      tips: ["环湖步道推车友好", "有沙池和滑梯", "可以喂黑天鹅"],
      reviews: [{ rating: 5, content: "人少环境好，适合遛娃散步" }],
      nearbyPlaces: [24]
    }
  },
  {
    id: 26,
    name: "白鹭洲公园",
    district: "秦淮区",
    indoors: false,
    types: ["park"],
    ageRange: ["0-1", "1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 2,
    distance: 10,
    duration: "half",
    hasParking: false,
    closed: false,
    description: "老城南水乡园林，小桥流水喂鱼看鸭子",
    tags: ["喂鱼", "园林"],
    detail: {
      hero: {
        primaryIcon: "landmark",
        secondaryIcon: "fish",
        secondaryPosition: "top-left",
        colorTheme: "teal"
      
      },
      businessHours: "6:00-22:00",
      address: "秦淮区长乐路174号（夫子庙旁）",
      transport: "地铁3号线武定门站，3号口出步行5分钟",
      parking: "无专用停车场，建议公共交通",
      ticketPrice: { price: "免费", note: "灯会期间部分区域收费" },
      tips: ["喂鱼很有意思", "紧邻夫子庙可逛", "春节灯会很美"],
      reviews: [{ rating: 4, content: "喂鱼孩子很兴奋" }],
      nearbyPlaces: [3, 8]
    }
  },
  {
    id: 27,
    name: "清凉山公园",
    district: "鼓楼区",
    indoors: false,
    types: ["park"],
    ageRange: ["0-1", "1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 1,
    distance: 12,
    duration: "half",
    hasParking: false,
    closed: false,
    description: "人少的清幽山林公园，适合慢慢散步",
    tags: ["清幽", "爬山"],
    detail: {
      hero: {
        primaryIcon: "leaf",
        secondaryIcon: "mountain",
        secondaryPosition: "top-right",
        colorTheme: "teal"
      
      },
      businessHours: "6:00-22:00",
      address: "鼓楼区清凉山路83号（近广州路）",
      transport: "地铁2号线汉中门站，2号口出步行10分钟",
      parking: "无专用停车场，建议公共交通",
      ticketPrice: { price: "免费", note: "无需预约" },
      tips: ["人少清幽", "适合慢慢散步", "园内有崇正书院"],
      reviews: [{ rating: 4, content: "市区难得的清静公园" }],
      nearbyPlaces: [23, 9]
    }
  },

  // ===== 新增：动物园/动物类 =====
  {
    id: 28,
    name: "紫清湖野生动物世界",
    district: "江宁区",
    indoors: false,
    types: ["zoo", "nature"],
    ageRange: ["1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 3,
    distance: 45,
    duration: "full",
    hasParking: true,
    closed: false,
    description: "小火车看动物+大马戏+大熊猫馆，一整天",
    tags: ["大熊猫", "大马戏"],
    detail: {
      hero: {
        primaryIcon: "paw-print",
        secondaryIcon: "train",
        secondaryPosition: "top-right",
        colorTheme: "yellow"
      
      },
      businessHours: "9:00-17:00",
      address: "江宁区汤山街道环镇北路8号",
      transport: "建议自驾，导航至紫清湖旅游区；地铁S6号线泉都大街站",
      parking: "景区停车场，免费",
      ticketPrice: { price: "150元/人", note: "1.2米以下儿童免票；含大马戏" },
      tips: ["小火车看动物必坐", "大马戏很精彩", "建议一整天"],
      reviews: [{ rating: 5, content: "大马戏太精彩了，宝宝全程鼓掌" }],
      nearbyPlaces: [19, 38]
    }
  },
  {
    id: 29,
    name: "金牛湖野生动物王国",
    district: "六合区",
    indoors: false,
    types: ["zoo", "nature"],
    ageRange: ["1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 3,
    distance: 65,
    duration: "full",
    hasParking: true,
    closed: false,
    description: "大型野生动物园，自驾区和步行区都有",
    tags: ["自驾", "动物"],
    detail: {
      hero: {
        primaryIcon: "paw-print",
        secondaryIcon: "car",
        secondaryPosition: "top-left",
        colorTheme: "yellow"
      
      },
      businessHours: "9:00-17:00",
      address: "六合区金牛湖街道金牛湖风景区",
      transport: "地铁S8号线金牛湖站，换乘接驳车或打车",
      parking: "景区停车场，10元/次",
      ticketPrice: { price: "160元/人", note: "1.4米以下儿童免票；含自驾区小火车" },
      tips: ["自驾区可以开车进去", "步行区有萌宠互动", "建议早上去"],
      reviews: [{ rating: 4, content: "动物很多，小朋友很喜欢" }],
      nearbyPlaces: [37]
    }
  },

  // ===== 新增：主题/室内乐园 =====
  {
    id: 30,
    name: "南京欢乐谷",
    district: "栖霞区",
    indoors: false,
    types: ["playground", "park"],
    ageRange: ["3-6"],
    strollerFriendly: true,
    crowdLevel: 4,
    distance: 35,
    duration: "full",
    hasParking: true,
    closed: false,
    description: "森海世界低龄区专为小宝宝设计，摩天轮看江景",
    tags: ["主题乐园", "摩天轮"],
    detail: {
      hero: {
        primaryIcon: "roller-coaster",
        secondaryIcon: "ferris-wheel",
        secondaryPosition: "top-right",
        colorTheme: "primary"
      
      },
      businessHours: "10:00-21:00（周末及节假日延长至22:00）",
      address: "栖霞区经济技术开发区欢乐谷北路8号",
      transport: "地铁2号线经天路站，换乘免费接驳车",
      parking: "欢乐谷停车场，20元/次",
      ticketPrice: { price: "260元/人", note: "1.2米以下儿童免票；有年卡" },
      tips: ["森海世界是低龄区", "建议平日去，周末排队久", "带好水杯"],
      reviews: [{ rating: 4, content: "森海世界很适合小宝宝" }],
      nearbyPlaces: [25]
    }
  },
  {
    id: 31,
    name: "弘阳未来世界",
    district: "浦口区",
    indoors: true,
    types: ["playground", "mall"],
    ageRange: ["0-1", "1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 4,
    distance: 30,
    duration: "full",
    hasParking: true,
    closed: false,
    description: "室内大型游乐场，摩天轮+双层旋转木马，雨天首选",
    tags: ["室内", "摩天轮"],
    detail: {
      hero: {
        primaryIcon: "castle",
        secondaryIcon: "star",
        secondaryPosition: "top-right",
        colorTheme: "pink"
      
      },
      businessHours: "10:00-21:30",
      address: "浦口区大桥北路48号弘阳广场内",
      transport: "地铁S8号线毛纺厂路站，步行10分钟",
      parking: "弘阳广场停车场，免费",
      ticketPrice: { price: "150元/人（夜场79元）", note: "可购买单项票" },
      tips: ["摩天轮必坐", "室内不怕风雨", "周边有餐饮配套"],
      reviews: [{ rating: 4, content: "下雨天来的，孩子玩得很开心" }],
      nearbyPlaces: []
    }
  },
  {
    id: 32,
    name: "南京松鼠部落",
    district: "浦口区",
    indoors: false,
    types: ["park", "nature", "farm"],
    ageRange: ["1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 3,
    distance: 40,
    duration: "full",
    hasParking: true,
    closed: false,
    description: "户外森林亲子乐园，攀爬+萌宠+蹦蹦云",
    tags: ["萌宠", "森林"],
    detail: {
      hero: {
        primaryIcon: "trees",
        secondaryIcon: "heart",
        secondaryPosition: "top-left",
        colorTheme: "teal"
      
      },
      businessHours: "9:00-17:30（周末延长）",
      address: "浦口区汤泉街道园林路",
      transport: "地铁10号线龙华路站，换乘公交或打车",
      parking: "景区停车场，免费",
      ticketPrice: { price: "60元/人（挂牌价100元）", note: "各平台有优惠" },
      tips: ["萌宠区最受欢迎", "可以搭帐篷", "建议自带食物"],
      reviews: [{ rating: 5, content: "松鼠就在身边跑，孩子超激动" }],
      nearbyPlaces: []
    }
  },
  {
    id: 33,
    name: "MELAND CLUB",
    district: "建邺区",
    indoors: true,
    types: ["playground", "mall"],
    ageRange: ["0-1", "1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 4,
    distance: 24,
    duration: "full",
    hasParking: true,
    closed: false,
    description: "高颜值室内亲子乐园，模拟城市+滑梯海洋球池",
    tags: ["室内", "角色扮演"],
    detail: {
      hero: {
        primaryIcon: "castle",
        secondaryIcon: "sparkles",
        secondaryPosition: "top-right",
        colorTheme: "pink"
      
      },
      businessHours: "10:00-21:00",
      address: "建邺区应天大街888号金鹰世界3楼",
      transport: "地铁2号线集庆门大街站，7A号口出",
      parking: "金鹰世界停车场，6元/小时",
      ticketPrice: { price: "288元/一大一小", note: "多平台有团购优惠" },
      tips: ["穿防滑袜", "模拟城市区必玩", "建议工作日去体验更好"],
      reviews: [{ rating: 5, content: "设计感超强，宝宝玩到不想走" }],
      nearbyPlaces: [16, 34]
    }
  },
  {
    id: 34,
    name: "土拨鼠俱乐部",
    district: "建邺区",
    indoors: true,
    types: ["playground", "mall"],
    ageRange: ["1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 3,
    distance: 24,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "乐园+研学+角色扮演一体，寓教于乐",
    tags: ["研学", "角色扮演"],
    detail: {
      hero: {
        primaryIcon: "smile",
        secondaryIcon: "book-open",
        secondaryPosition: "top-right",
        colorTheme: "pink"
      
      },
      businessHours: "10:00-21:00",
      address: "建邺区应天大街888号金鹰世界内",
      transport: "地铁2号线集庆门大街站，7A号口出",
      parking: "金鹰世界停车场，6元/小时",
      ticketPrice: { price: "约150-200元/人", note: "各平台有优惠" },
      tips: ["角色扮演区是特色", "适合3岁以上"],
      reviews: [{ rating: 4, content: "角色扮演很有趣" }],
      nearbyPlaces: [16, 33]
    }
  },

  // ===== 新增：科普/文化类 =====
  {
    id: 35,
    name: "南京图书馆少儿馆",
    district: "玄武区",
    indoors: true,
    types: ["museum", "culture"],
    ageRange: ["0-1", "1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 2,
    distance: 14,
    duration: "half",
    hasParking: false,
    closed: false,
    description: "免费亲子阅读，绘本超多，有儿童活动区",
    tags: ["绘本", "免费"],
    detail: {
      hero: {
        primaryIcon: "book-open",
        secondaryIcon: "heart",
        secondaryPosition: "top-right",
        colorTheme: "yellow"
      
      },
      businessHours: "周二至周日9:30-11:30，14:00-17:00（周一闭馆）",
      address: "玄武区中山东路189号南京图书馆一楼",
      transport: "地铁2号线大行宫站，1号口出步行3分钟",
      parking: "无专用停车场，建议公共交通",
      ticketPrice: { price: "免费", note: "凭身份证免费入馆" },
      tips: ["0-3岁和4-6岁分区", "绘本多且新", "有亲子活动"],
      reviews: [{ rating: 5, content: "免费绘本资源超丰富" }],
      nearbyPlaces: [8, 17]
    }
  },
  {
    id: 36,
    name: "南京市青少年宫",
    district: "鼓楼区",
    indoors: true,
    types: ["museum", "culture"],
    ageRange: ["1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 2,
    distance: 16,
    duration: "half",
    hasParking: false,
    closed: false,
    description: "新开放综合体，有儿童体验区和公益课堂",
    tags: ["体验", "公益"],
    detail: {
      hero: {
        primaryIcon: "landmark",
        secondaryIcon: "star",
        secondaryPosition: "top-left",
        colorTheme: "yellow"
      
      },
      businessHours: "9:00-17:30",
      address: "鼓楼区马台街9号",
      transport: "地铁1号线玄武门站，步行15分钟",
      parking: "无专用停车场，建议公共交通",
      ticketPrice: { price: "免费（部分课程/活动收费）", note: "需关注公众号预约" },
      tips: ["公益课程提前预约", "有儿童体验区", "适合3岁以上"],
      reviews: [{ rating: 4, content: "公益课性价比很高" }],
      nearbyPlaces: [15, 27]
    }
  },

  // ===== 新增：农场/特色类 =====
  {
    id: 37,
    name: "巴布洛生态谷",
    district: "六合区",
    indoors: false,
    types: ["farm", "nature", "park"],
    ageRange: ["1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 2,
    distance: 70,
    duration: "full",
    hasParking: true,
    closed: false,
    description: "大型生态农场，采摘+萌宠+花海+房车露营",
    tags: ["采摘", "露营"],
    detail: {
      hero: {
        primaryIcon: "apple",
        secondaryIcon: "flower-2",
        secondaryPosition: "top-left",
        colorTheme: "yellow"
      },
      businessHours: "9:00-17:00",
      address: "六合区竹镇镇永鸿巴布洛生态谷",
      transport: "建议自驾，导航至巴布洛生态谷",
      parking: "景区停车场，免费",
      ticketPrice: { price: "60元/人", note: "送采摘券；各平台有优惠" },
      tips: ["采摘按季节不同", "可以烧烤露营", "建议一天"],
      reviews: [{ rating: 4, content: "采摘活动孩子很喜欢" }],
      nearbyPlaces: [29]
    }
  },
  {
    id: 38,
    name: "黄龙山庄",
    district: "江宁区",
    indoors: false,
    types: ["farm", "nature"],
    ageRange: ["1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 2,
    distance: 45,
    duration: "full",
    hasParking: true,
    closed: false,
    description: "采摘+烧烤+垂钓，适合家庭周末农家乐",
    tags: ["采摘", "烧烤"],
    detail: {
      hero: {
        primaryIcon: "apple",
        secondaryIcon: "utensils",
        secondaryPosition: "top-right",
        colorTheme: "yellow"
      },
      businessHours: "8:00-18:00",
      address: "江宁区横溪街道黄龙山庄",
      transport: "建议自驾，导航至黄龙山庄",
      parking: "山庄停车场，免费",
      ticketPrice: { price: "免费入园", note: "采摘按斤收费" },
      tips: ["采摘葡萄/草莓按季节", "可以烧烤垂钓", "适合家庭聚会"],
      reviews: [{ rating: 4, content: "采摘活动不错" }],
      nearbyPlaces: [28, 19]
    }
  },

  // ===== 新增：采摘/农场类 =====
  {
    id: 39,
    name: "丰硕农场",
    district: "江宁区",
    indoors: false,
    types: ["farm", "nature"],
    ageRange: ["1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 3,
    distance: 45,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "汤山龙尚湖畔的亲子农场，草莓采摘+垂钓+观光",
    tags: ["采摘", "垂钓"],
    detail: {
      hero: {
        primaryIcon: "apple",
        secondaryIcon: "fish",
        secondaryPosition: "top-right",
        colorTheme: "yellow"
      },
      businessHours: "9:00-17:00",
      address: "江宁区汤山街道龙尚社区",
      transport: "建议自驾，导航至丰硕农场",
      parking: "农场停车场，免费",
      ticketPrice: { price: "约9.9-69元（家庭畅玩券）", note: "含草莓采摘2斤+垂钓" },
      tips: ["有采摘护照更划算", "草莓季12-5月", "旁边有温泉民宿"],
      reviews: [{ rating: 4, content: "草莓很甜，孩子摘得很开心" }],
      nearbyPlaces: [28, 38]
    }
  },
  {
    id: 40,
    name: "傅家边农业科技观光园",
    district: "溧水区",
    indoors: false,
    types: ["farm", "nature", "park"],
    ageRange: ["1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 3,
    distance: 60,
    duration: "full",
    hasParking: true,
    closed: false,
    description: "南京最大农业观光园，草莓/蓝莓/桃子采摘+春季赏梅",
    tags: ["采摘", "赏花"],
    detail: {
      hero: {
        primaryIcon: "flower-2",
        secondaryIcon: "apple",
        secondaryPosition: "top-left",
        colorTheme: "yellow"
      },
      businessHours: "8:00-17:00",
      address: "溧水区洪蓝镇傅家边",
      transport: "地铁S7号线中山湖站，换乘溧水23路至傅家边科技园站",
      parking: "景区停车场，免费",
      ticketPrice: { price: "免费入园", note: "采摘按斤收费，梅花节期间免费" },
      tips: ["草莓季12-5月", "梅花节2-3月", "建议自驾更方便"],
      reviews: [{ rating: 5, content: "草莓又大又甜，孩子超喜欢" }],
      nearbyPlaces: []
    }
  },
  {
    id: 41,
    name: "锁石村生态园",
    district: "江宁区",
    indoors: false,
    types: ["farm", "nature"],
    ageRange: ["1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 2,
    distance: 40,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "汤山老牌草莓采摘地，大棚多、草莓高产",
    tags: ["采摘", "草莓"],
    detail: {
      hero: {
        primaryIcon: "apple",
        secondaryIcon: "sun",
        secondaryPosition: "top-right",
        colorTheme: "yellow"
      },
      businessHours: "8:00-17:00",
      address: "江宁区汤山街道麒麟锁石村社区988号",
      transport: "南京锁金村乘公交游船线至锁石村站",
      parking: "村口停车场，免费",
      ticketPrice: { price: "免费入园", note: "草莓采摘按斤收费约30-50元/斤" },
      tips: ["草莓季12-5月", "大棚多不怕下雨", "建议上午去草莓最新鲜"],
      reviews: [{ rating: 4, content: "草莓又大又甜" }],
      nearbyPlaces: [39, 28]
    }
  },
  {
    id: 42,
    name: "鑫淼龍锦园",
    district: "江宁区",
    indoors: false,
    types: ["farm", "nature"],
    ageRange: ["1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 2,
    distance: 35,
    duration: "half",
    hasParking: true,
    closed: false,
    description: "采摘+热带海洋鱼观赏+农家菜，孩子新鲜体验",
    tags: ["采摘", "海洋鱼"],
    detail: {
      hero: {
        primaryIcon: "apple",
        secondaryIcon: "fish",
        secondaryPosition: "top-left",
        colorTheme: "yellow"
      },
      businessHours: "9:00-17:00",
      address: "江宁区淳化街道青龙社区青龙大道8号",
      transport: "建议自驾，导航至鑫淼龍锦园",
      parking: "园区停车场，免费",
      ticketPrice: { price: "免费入园", note: "采摘和用餐按需收费" },
      tips: ["热带鱼馆孩子很喜欢", "可以吃农家菜", "适合半天游"],
      reviews: [{ rating: 5, content: "又摘水果又看鱼，孩子兴奋得不行" }],
      nearbyPlaces: [38]
    }
  },
  {
    id: 43,
    name: "鑫农庄",
    district: "江宁区",
    indoors: false,
    types: ["farm", "nature"],
    ageRange: ["1-3", "3-6"],
    strollerFriendly: true,
    crowdLevel: 2,
    distance: 45,
    duration: "full",
    hasParking: true,
    closed: false,
    description: "禄口综合农家乐，水果采摘+餐饮+团建",
    tags: ["采摘", "农家乐"],
    detail: {
      hero: {
        primaryIcon: "apple",
        secondaryIcon: "utensils",
        secondaryPosition: "top-right",
        colorTheme: "yellow"
      },
      businessHours: "9:00-18:00",
      address: "江宁区禄口国际机场南区金铜路1088号",
      transport: "建议自驾，导航至鑫农庄",
      parking: "农庄停车场，免费",
      ticketPrice: { price: "免费入园", note: "采摘按斤收费，餐饮另算" },
      tips: ["蓝莓采摘是特色", "有餐饮配套", "适合家庭聚会"],
      reviews: [{ rating: 4, content: "蓝莓很好吃，环境不错" }],
      nearbyPlaces: [38]
    }
  }
];

// 供全局使用
window.PLACES = PLACES;
