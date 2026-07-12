/**
 * AI 旅行规划引擎 - 路线数据模型
 * 包含3条预设路线模板 + 通用数据结构
 */

const ROUTE_TEMPLATES = {
  northwest: {
    id: 'northwest',
    name: '西北大环线',
    subtitle: '西安→兰州→敦煌→青海湖→西宁',
    region: '陕西·甘肃·青海',
    totalKm: 3200,
    defaultDays: 10,
    maxDays: 14,
    minDays: 7,
    heroImage: 'assets/hero_northwest.jpg',
    description: '穿越河西走廊，探访丝路古迹，青海湖骑行，敦煌莫高窟',
    highlights: ['莫高窟', '鸣沙山月牙泉', '青海湖', '茶卡盐湖', '嘉峪关'],
    routePoints: [
      {name:'西安',km:0,alt:400,province:'陕西'},
      {name:'兰州',km:650,alt:1520,province:'甘肃'},
      {name:'武威',km:950,alt:1500,province:'甘肃'},
      {name:'张掖',km:1250,alt:1400,province:'甘肃'},
      {name:'嘉峪关',km:1550,alt:1600,province:'甘肃'},
      {name:'敦煌',km:1850,alt:1100,province:'甘肃'},
      {name:'大柴旦',km:2450,alt:3100,province:'青海'},
      {name:'茶卡盐湖',km:2750,alt:3050,province:'青海'},
      {name:'青海湖',km:2950,alt:3200,province:'青海'},
      {name:'西宁',km:3200,alt:2260,province:'青海'}
    ],
    spots: {
      all: [
        {name:'莫高窟',region:'敦煌',tag:'甘肃',badge:'accent',mustDo:'A类窟+数字中心电影',traps:'应急票只看4个窟，旺季提前1月预约',parking:'数字中心停车10元',price:'正常票238元/人（8窟+电影），应急票100元',duration:'3-4小时'},
        {name:'鸣沙山月牙泉',region:'敦煌',tag:'甘肃',badge:'accent',mustDo:'骑骆驼+滑沙+月牙泉日落',traps:'骆驼100元/人，拍照另收费；鞋套15元可自带',parking:'景区停车场5元',price:'110元/人，3日有效',duration:'3-5小时'},
        {name:'嘉峪关关城',region:'嘉峪关',tag:'甘肃',badge:'accent',mustDo:'三重城体系+悬壁长城',traps:'骑骆驼/穿铠甲先谈好价；古玩摊基本是玻璃货',parking:'大型免费停车场',price:'旺季110元/人',duration:'3-4小时'},
        {name:'张掖七彩丹霞',region:'张掖',tag:'甘肃',badge:'accent',mustDo:'4号观景台日落+2号观景台日出',traps:'深度游328元/人性价比一般，普通票足够',parking:'景区停车场10元',price:'75元+区间车20元=95元',duration:'3-4小时'},
        {name:'青海湖',region:'青海湖',tag:'青海',badge:'blue',mustDo:'二郎剑景区或环湖西路免费观景点',traps:'二郎剑门票90元较贵，环湖西路很多免费点',parking:'路边可停',price:'二郎剑90元/人，环湖西路免费',duration:'2-4小时'},
        {name:'茶卡盐湖',region:'茶卡',tag:'青海',badge:'blue',mustDo:'天空之镜广场+小火车',traps:'鞋套租赁10元，下水必须穿鞋套；旺季人极多',parking:'停车场10元',price:'60元+小火车50元单程',duration:'3-4小时'},
        {name:'塔尔寺',region:'西宁',tag:'青海',badge:'blue',mustDo:'大金瓦殿+酥油花馆',traps:'殿内禁止拍照；需请导游讲解',parking:'停车场15元',price:'70元/人',duration:'2-3小时'}
      ]
    },
    dailyKm: [650,300,300,300,300,600,300,200,250,0],
    food: [
      {city:'兰州',food:'牛肉面',price:'8-12/碗',shop:'马子禄、吾穆勒',trap:'景区附近15-20元别吃'},
      {city:'兰州',food:'手抓羊肉',price:'人均60-120',shop:'阿西娅',trap:'配三炮台茶'},
      {city:'敦煌',food:'驴肉黄面',price:'人均40-60',shop:'达记酱驴肉黄面馆',trap:'沙洲夜市价格偏高'},
      {city:'敦煌',food:'杏皮水',price:'5-10/杯',shop:'沙洲夜市',trap:'——'},
      {city:'张掖',food:'搓鱼子',price:'人均20-30',shop:'孙记炒炮',trap:'——'},
      {city:'西宁',food:'手抓羊肉',price:'人均50-80',shop:'益鑫手抓',trap:'——'},
      {city:'西宁',food:'酸奶',price:'5-8/碗',shop:'德禄酸奶',trap:'——'}
    ],
    hotels: [
      {city:'兰州',price:'180-280',advance:'1天',tip:'西站附近快捷酒店'},
      {city:'张掖',price:'200-350',advance:'2天',tip:'丹霞景区附近方便看日出'},
      {city:'嘉峪关',price:'220-350',advance:'1天',tip:'市区酒店'},
      {city:'敦煌',price:'300-600',advance:'7天',tip:'旺季极抢手！鸣沙山附近民宿'},
      {city:'大柴旦',price:'400-700',advance:'3天',tip:'住宿稀缺，提前预订'},
      {city:'茶卡',price:'300-500',advance:'3天',tip:'旺季紧张'},
      {city:'西宁',price:'200-350',advance:'1天',tip:'选择多'}
    ],
    gasPrice: {陕西:7.9,甘肃:7.9,青海:7.8},
    tollRate: 0.45,
    galaxySpots: [
      {name:'鸣沙山',level:'★★★★',dates:'全程',temp:'15-25°C',feature:'沙漠星空，无遮挡'},
      {name:'青海湖环湖西路',level:'★★★★★',dates:'全程',temp:'5-15°C',feature:'湖面倒影+暗夜'},
      {name:'茶卡盐湖',level:'★★★★★',dates:'全程',temp:'5-10°C',feature:'天空之镜+星空'}
    ],
    risks: [
      {title:'高原反应',prob:'中',desc:'青海湖3200m、茶卡3050m。备红景天、氧气罐'},
      {title:'敦煌高温',prob:'高',desc:'7月地表60°C+，上午游览，下午休息'},
      {title:'莫高窟预约',prob:'高',desc:'旺季提前30天预约，应急票体验差'}
    ]
  },

  xinjiang: {
    id: 'xinjiang',
    name: '新疆南北疆大穿越',
    subtitle: '渭南→喀什14天自驾',
    region: '陕西·甘肃·新疆',
    totalKm: 4200,
    defaultDays: 14,
    maxDays: 18,
    minDays: 10,
    heroImage: 'assets/hero_xinjiang_1280x720.jpg',
    description: '独库公路全段、赛里木湖、帕米尔高原、喀什古城',
    highlights: ['独库公路', '赛里木湖', '喀什古城', '帕米尔高原', '巴音布鲁克'],
    routePoints: [
      {name:'渭南',km:0,alt:340,province:'陕西'},
      {name:'兰州',km:675,alt:1520,province:'甘肃'},
      {name:'嘉峪关',km:1425,alt:1600,province:'甘肃'},
      {name:'哈密',km:1995,alt:800,province:'新疆'},
      {name:'吐鲁番',km:2395,alt:35,province:'新疆'},
      {name:'乌鲁木齐',km:2575,alt:800,province:'新疆'},
      {name:'赛里木湖',km:3125,alt:2073,province:'新疆'},
      {name:'独山子',km:3425,alt:1280,province:'新疆'},
      {name:'哈希勒根达坂',km:3545,alt:3400,province:'新疆'},
      {name:'那拉提',km:3625,alt:1800,province:'新疆'},
      {name:'巴音布鲁克',km:3705,alt:2500,province:'新疆'},
      {name:'库车',km:3965,alt:1100,province:'新疆'},
      {name:'喀什',km:4685,alt:1300,province:'新疆'},
      {name:'喀拉库勒湖',km:4975,alt:3615,province:'新疆'},
      {name:'塔县',km:5075,alt:3100,province:'新疆'}
    ],
    spots: {
      all: [
        {name:'嘉峪关关城',region:'嘉峪关',tag:'甘肃',badge:'accent',mustDo:'三重城体系+悬壁长城+第一墩',traps:'骑骆驼先谈价；古玩摊是玻璃货',parking:'景区门口200米',price:'旺季110元/人',duration:'3-4小时'},
        {name:'交河故城',region:'吐鲁番',tag:'新疆',badge:'accent',mustDo:'世界文化遗产，2300年生土古城',traps:'火焰山内越野150元纯坑',parking:'停车场距入口200米',price:'70元/人',duration:'1.5-2小时'},
        {name:'赛里木湖',region:'赛里木湖',tag:'北疆',badge:'blue',mustDo:'自驾环湖90km，顺时针8个点位',traps:'景区内餐饮巨贵，自带干粮',parking:'每个景点有指定停车场',price:'门票70+自驾75=145元/人',duration:'6-8小时'},
        {name:'独库公路',region:'天山',tag:'天山',badge:'blue',mustDo:'独山子大峡谷+乔尔玛+那拉提+巴音布鲁克',traps:'见半箱油就加；区间测速极严',parking:'各景点有停车场',price:'公路免费，景点另收费',duration:'建议3天2晚'},
        {name:'喀什古城',region:'喀什',tag:'南疆',badge:'gold',mustDo:'开城仪式+百年老茶馆+艾提尕尔清真寺',traps:'跟拍写真低价吸引后加钱；和田玉警惕',parking:'古城内禁机动车，停东门外',price:'古城免费，清真寺45元',duration:'2天'},
        {name:'帕米尔高原',region:'塔县',tag:'帕米尔',badge:'gold',mustDo:'白沙湖+喀拉库勒湖+盘龙古道+班迪尔蓝湖',traps:'高反！动作放慢；骑马先讲死价格',parking:'车能开到湖边几十米',price:'联票约300-340元/人',duration:'2-3天'}
      ]
    },
    dailyKm: [675,750,570,580,550,500,80,260,720,0,290,75,290,720],
    food: [
      {city:'兰州',food:'牛肉面',price:'8-12/碗',shop:'马子禄、吾穆勒',trap:'景区附近15-20元别吃'},
      {city:'兰州',food:'手抓羊肉',price:'人均60-120',shop:'阿西娅',trap:'配三炮台茶'},
      {city:'嘉峪关',food:'烤肉',price:'人均50-100',shop:'大唐美食街',trap:'羊肉串3-5元/串正常价'},
      {city:'哈密',food:'哈密瓜',price:'3-8元/斤',shop:'阿勒屯古街夜市',trap:'景区门口10元+/斤别买'},
      {city:'吐鲁番',food:'拌面',price:'25-40/份',shop:'苏来曼拌面王',trap:'火焰山景区内餐饮巨贵'},
      {city:'乌鲁木齐',food:'大盘鸡',price:'人均60-100',shop:'血站大盘鸡',trap:'大巴扎内餐饮偏贵20-30%'},
      {city:'那拉提',food:'马肉纳仁',price:'人均40-80',shop:'镇上哈萨克餐厅',trap:'景区内骑马先谈好价'},
      {city:'巴音布鲁克',food:'黑头羊肉',price:'人均50-80',shop:'镇上牧民餐厅',trap:'——'},
      {city:'库车',food:'库车大馕',price:'5/个',shop:'库车大馕城',trap:'——'},
      {city:'喀什',food:'烤包子',price:'3-5/个',shop:'古城东门附近',trap:'古城内偶有溢价至5-8元'},
      {city:'喀什',food:'缸子肉',price:'25-40/缸',shop:'艾提尕尔周边老店',trap:'超过50元就是宰客'},
      {city:'塔县',food:'牦牛肉火锅',price:'人均80-160',shop:'冰山来客',trap:'景区门口毡房价格偏高'}
    ],
    hotels: [
      {city:'兰州',price:'180-280',advance:'1天',tip:'西站附近快捷酒店'},
      {city:'嘉峪关',price:'220-350',advance:'1天',tip:'市区酒店'},
      {city:'哈密',price:'180-280',advance:'1天',tip:'市区酒店'},
      {city:'乌鲁木齐',price:'250-400',advance:'1天',tip:'新市区/沙依巴克区'},
      {city:'赛里木湖',price:'400-800',advance:'2周',tip:'东门外博乐/精河性价比高'},
      {city:'那拉提镇',price:'200-350',advance:'1-2周',tip:'镇上酒店'},
      {city:'巴音布鲁克镇',price:'300-600',advance:'2周',tip:'旺季紧张！'},
      {city:'库车',price:'200-320',advance:'1天',tip:'经济型选择多'},
      {city:'喀什古城',price:'350-700',advance:'7天以上',tip:'古城民宿，旺季房源紧张！'},
      {city:'塔什库尔干',price:'350-700',advance:'2-3周',tip:'高原住宿稀缺，含氧房极抢手！'}
    ],
    gasPrice: {陕西:7.9,甘肃:7.9,新疆:7.7},
    tollRate: 0.42,
    galaxySpots: [
      {name:'赛里木湖西海岸',level:'★★★★',dates:'7月30-31日',temp:'3-10°C',feature:'湖面银河倒影'},
      {name:'巴音布鲁克',level:'★★★★★',dates:'7月31日-8月1日',temp:'0-8°C',feature:'九曲十八弯+银河'},
      {name:'喀拉库勒湖',level:'★★★★★',dates:'8月4-6日',temp:'-2-6°C',feature:'雪山+湖面倒影+银心'},
      {name:'塔县周边',level:'★★★★★',dates:'8月4-5日',temp:'5-10°C',feature:'海拔3100m，银河+慕士塔格同框'},
      {name:'库车戈壁',level:'★★★★',dates:'8月1-2日',temp:'18-25°C',feature:'胡杨+戈壁+星空'}
    ],
    risks: [
      {title:'独库封路',prob:'低',desc:'7月底旺季极少封路。替代：绕行G30→G218（多约200km）'},
      {title:'高原反应',prob:'中',desc:'喀拉库勒湖3600m。备红景天、氧气罐'},
      {title:'吐鲁番高温',prob:'100%',desc:'地表70°C+，早上8-11点游览'},
      {title:'加油站关闭',prob:'低',desc:'天黑前加满，独库沿线见半箱就加'},
      {title:'无信号',prob:'高',desc:'独库中段、盘龙古道。提前下载离线地图'}
    ]
  },

  sichuan: {
    id: 'sichuan',
    name: '川藏线318',
    subtitle: '成都→拉萨10天自驾',
    region: '四川·西藏',
    totalKm: 2100,
    defaultDays: 10,
    maxDays: 14,
    minDays: 8,
    heroImage: 'assets/hero_sichuan.jpg',
    description: '中国最美景观大道，穿越横断山脉，抵达圣城拉萨',
    highlights: ['折多山', '稻城亚丁', '然乌湖', '布达拉宫', '羊卓雍措'],
    routePoints: [
      {name:'成都',km:0,alt:500,province:'四川'},
      {name:'雅安',km:140,alt:600,province:'四川'},
      {name:'康定',km:280,alt:2560,province:'四川'},
      {name:'新都桥',km:350,alt:3460,province:'四川'},
      {name:'雅江',km:410,alt:2600,province:'四川'},
      {name:'理塘',km:520,alt:4014,province:'四川'},
      {name:'巴塘',km:650,alt:2580,province:'四川'},
      {name:'芒康',km:790,alt:3875,province:'西藏'},
      {name:'左贡',km:950,alt:3750,province:'西藏'},
      {name:'邦达',km:1050,alt:4120,province:'西藏'},
      {name:'八宿',km:1150,alt:3260,province:'西藏'},
      {name:'然乌',km:1280,alt:3850,province:'西藏'},
      {name:'波密',km:1430,alt:2750,province:'西藏'},
      {name:'通麦',km:1580,alt:2070,province:'西藏'},
      {name:'林芝',km:1700,alt:2900,province:'西藏'},
      {name:'工布江达',km:1850,alt:3330,province:'西藏'},
      {name:'拉萨',km:2100,alt:3650,province:'西藏'}
    ],
    spots: {
      all: [
        {name:'折多山',region:'康定',tag:'四川',badge:'accent',mustDo:'4298m垭口，云海+经幡',traps:'高反高发区，不要剧烈运动',parking:'垭口停车场',price:'免费',duration:'30-60分钟'},
        {name:'新都桥',region:'新都桥',tag:'四川',badge:'accent',mustDo:'摄影天堂，光影+藏寨',traps:'旺季住宿紧张且贵',parking:'路边可停',price:'免费',duration:'半天'},
        {name:'稻城亚丁',region:'稻城',tag:'四川',badge:'accent',mustDo:'牛奶海+五色海+仙乃日',traps:'长线徒步10km+，海拔4600m',parking:'香格里拉镇',price:'门票150+区间车120=270元',duration:'1-2天'},
        {name:'然乌湖',region:'然乌',tag:'西藏',badge:'blue',mustDo:'雪山倒影，晨雾最美',traps:'雨季湖水浑浊',parking:'湖边可停',price:'免费',duration:'2-3小时'},
        {name:'米堆冰川',region:'波密',tag:'西藏',badge:'blue',mustDo:'中国最美冰川，徒步1.5h',traps:'马帮100元/人，可步行',parking:'景区停车场',price:'50元+区间车36元',duration:'3-4小时'},
        {name:'布达拉宫',region:'拉萨',tag:'西藏',badge:'gold',mustDo:'白宫+红宫+珍宝馆',traps:'旺季提前7天预约，黄牛票贵3倍',parking:'周边停车场',price:'旺季200元/人（5-10月）',duration:'3-4小时'},
        {name:'羊卓雍措',region:'拉萨',tag:'西藏',badge:'gold',mustDo:'三大圣湖之一，蓝得不像真的',traps:'岗巴拉山口藏獒合影收费',parking:'观景台',price:'60元/人',duration:'半天'}
      ]
    },
    dailyKm: [140,140,70,60,110,130,140,160,100,100,130,150,150,120,150,250,0],
    food: [
      {city:'成都',food:'火锅',price:'人均80-150',shop:'蜀大侠、小龙坎',trap:'景区附近火锅偏贵'},
      {city:'康定',food:'牦牛肉汤锅',price:'人均60-100',shop:'老城餐馆',trap:'——'},
      {city:'理塘',food:'藏餐',price:'人均40-60',shop:'勒通古镇',trap:'——'},
      {city:'巴塘',food:'川菜',price:'人均30-50',shop:'县城餐馆',trap:'——'},
      {city:'林芝',food:'石锅鸡',price:'人均80-120',shop:'鲁朗石锅鸡',trap:'鲁朗镇价格偏高'},
      {city:'拉萨',food:'藏面+甜茶',price:'人均15-25',shop:'光明港琼甜茶馆',trap:'——'},
      {city:'拉萨',food:'牦牛肉火锅',price:'人均80-120',shop:'亿头牛',trap:'——'}
    ],
    hotels: [
      {city:'成都',price:'200-400',advance:'1天',tip:'选择多'},
      {city:'康定',price:'200-400',advance:'2天',tip:'老城方便'},
      {city:'新都桥',price:'300-600',advance:'3天',tip:'摄影旺季紧张'},
      {city:'稻城/香格里拉镇',price:'300-600',advance:'7天',tip:'亚丁景区门口'},
      {city:'巴塘',price:'200-350',advance:'2天',tip:'进藏前最后一站四川'},
      {city:'左贡',price:'200-350',advance:'2天',tip:'住宿条件一般'},
      {city:'然乌',price:'250-400',advance:'2天',tip:'湖边客栈'},
      {city:'波密',price:'250-400',advance:'2天',tip:'选择较多'},
      {city:'林芝',price:'300-500',advance:'3天',tip:'西藏江南'},
      {city:'拉萨',price:'300-800',advance:'7天',tip:'旺季布达拉宫附近紧张'}
    ],
    gasPrice: {四川:8.0,西藏:8.5},
    tollRate: 0.5,
    galaxySpots: [
      {name:'新都桥',level:'★★★★★',dates:'全程',temp:'5-15°C',feature:'摄影天堂，光污染极低'},
      {name:'理塘',level:'★★★★★',dates:'全程',temp:'0-10°C',feature:'世界高城，4000m+暗夜'},
      {name:'然乌湖',level:'★★★★★',dates:'全程',temp:'5-10°C',feature:'雪山+湖面+星空'},
      {name:'羊卓雍措',level:'★★★★★',dates:'全程',temp:'5-10°C',feature:'圣湖星空，海拔4400m'}
    ],
    risks: [
      {title:'高原反应',prob:'高',desc:'全程海拔2500-5000m，理塘4014m。备氧气罐、红景天'},
      {title:'路况危险',prob:'中',desc:'海通沟、怒江72拐、通麦天险。雨季塌方多发'},
      {title:'车辆故障',prob:'中',desc:'偏远地区修车难，出发前全面保养'},
      {title:'加油站稀缺',prob:'高',desc:'部分路段200km+无加油站，见站就加'}
    ]
  }
};

// 通用配置
const CONFIG = {
  oilPriceBase: 7.8,
  foodPerPersonPerDay: {经济:50,舒适:80,豪华:150},
  hotelPerNight: {经济:200,舒适:400,豪华:800},
  peopleMultiplier: {1:1,2:1.8,3:2.5,4:3.2,5:4,6:4.8},
  carTypes: {
    '轿车':{oilPer100km:7,tollDiscount:1},
    'SUV':{oilPer100km:9,tollDiscount:1},
    'MPV':{oilPer100km:10,tollDiscount:1},
    '房车':{oilPer100km:12,tollDiscount:1.2}
  }
};

// 导出
if(typeof module !== 'undefined' && module.exports) {
  module.exports = {ROUTE_TEMPLATES, CONFIG};
}
