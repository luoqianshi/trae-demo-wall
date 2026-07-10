// ============================================================
// 星邻圈 Demo — 模拟数据
// ============================================================

var DB = {

  // 当前用户
  currentUser: {
    id: 'u001',
    name: '星湖居民',
    avatar: '🙋',
    community: '星湖花园 3 期',
    phone: '138****8888'
  },

  // 小区列表
  communities: [
    '星湖花园 3 期', '星湖花园 1 期', '翠湖天地', '锦绣华庭',
    '保利香槟', '万科城', '龙湖天街'
  ],

  // 房源数据
  houses: [
    { id: 'h1', community: '星湖花园 3 期', layout: '2 室 1 厅', area: 89, price: 3500, direction: '南北通透', floor: '中楼层/18 层', decoration: '精装修', tags: ['近地铁', '拎包入住'], contact: '王房东', phone: '139****1234', desc: '星湖花园 3 期，精装两室，南北通透，家电齐全，拎包入住。步行 5 分钟到地铁口，周边配套完善。' },
    { id: 'h2', community: '星湖花园 3 期', layout: '3 室 2 厅', area: 120, price: 5200, direction: '南向', floor: '高楼层/18 层', decoration: '精装修', tags: ['带阳台', '家电齐全'], contact: '李房东', phone: '139****5678', desc: '三室两厅，南向采光好，大阳台，全新家电。适合一家三口居住。' },
    { id: 'h3', community: '星湖花园 1 期', layout: '1 室 1 厅', area: 45, price: 2200, direction: '东向', floor: '低楼层/6 层', decoration: '简装', tags: ['单身公寓', '近园区'], contact: '张房东', phone: '137****9999', desc: '单身公寓，适合园区上班族。月租实惠，水电网全包。' },
    { id: 'h4', community: '翠湖天地', layout: '2 室 2 厅', area: 95, price: 4200, direction: '南北通透', floor: '中楼层/24 层', decoration: '精装修', tags: ['拎包入住', '近地铁'], contact: '陈房东', phone: '136****4321', desc: '翠湖天地精装两室，南北通透，小区环境优美，绿化率高。' },
    { id: 'h5', community: '锦绣华庭', layout: '3 室 1 厅', area: 110, price: 4800, direction: '南向', floor: '高楼层/16 层', decoration: '精装修', tags: ['带阳台', '近学校'], contact: '刘房东', phone: '135****6789', desc: '锦绣华庭三室，南向大阳台，近学校，适合有娃家庭。' },
    { id: 'h6', community: '保利香槟', layout: '1 室 1 厅', area: 50, price: 2600, direction: '西向', floor: '低楼层/12 层', decoration: '精装修', tags: ['单身公寓', '拎包入住'], contact: '赵房东', phone: '133****5555', desc: '保利香槟精装一室，西向采光，适合年轻白领。' }
  ],

  // 二手闲置数据
  secondhand: [
    { id: 's1', title: '婴儿车 + 安全座椅套装', price: 200, community: '星湖花园 3 期', seller: '宝妈小林', avatar: '👩', time: '2 小时前', desc: '宝宝大了用不上了，九成新，安全座椅几乎没用过。同小区面交。', comments: [{ user: '邻居小王', text: '还能便宜点吗？', time: '1 小时前' }] },
    { id: 's2', title: '小米电视 55 寸', price: 800, community: '翠湖天地', seller: '数码哥', avatar: '👨', time: '5 小时前', desc: '搬家出闲置，55 寸小米电视，无坏点，遥控器齐全。', comments: [] },
    { id: 's3', title: '宜家书架 + 收纳箱', price: 50, community: '星湖花园 1 期', seller: '阿强', avatar: '🧑', time: '昨天', desc: '搬家带走不了，宜家四层书架加两个收纳箱，50 自提。', comments: [{ user: '租客小李', text: '还在吗？我想要', time: '昨天' }] },
    { id: 's4', title: 'Switch + 健身环', price: 1200, community: '万科城', seller: '游戏宅', avatar: '🧑‍💻', time: '3 天前', desc: '吃灰出，95 新，带健身环和两个手柄。', comments: [] }
  ],

  // 邻里互助数据
  helps: [
    { id: 'm1', title: '帮忙代取快递', community: '星湖花园 3 期', requester: '加班狗小陈', avatar: '😤', time: '30 分钟前', reward: '一杯奶茶', status: '待响应', desc: '今天加班到很晚，有个快递在驿站快超时了，求邻居帮忙取一下，明天请你喝奶茶！' },
    { id: 'm2', title: '出差帮忙喂猫 3 天', community: '翠湖天地', requester: '猫奴阿May', avatar: '🐱', time: '2 小时前', reward: '猫零食大礼包', status: '待响应', desc: '出差 3 天，家里猫咪需要喂食铲屎，求同小区邻居帮忙，回来送猫零食大礼包！' },
    { id: 'm3', title: '搭把手搬个沙发', community: '星湖花园 1 期', requester: '新邻居老周', avatar: '💪', time: '昨天', reward: '一顿饭', status: '已完成', desc: '新搬来，有个沙发搬不动，求两个邻居帮忙抬一下，请吃饭！' },
    { id: 'm4', title: '帮忙浇花一周', community: '锦绣华庭', requester: '旅游中阿芳', avatar: '🌴', time: '3 天前', reward: '特产伴手礼', status: '进行中', desc: '出去旅游一周，阳台上的花需要浇水，求邻居帮忙照看。' }
  ],

  // 家政服务数据
  services: [
    { id: 'sv1', name: '张姐保洁', type: '日常保洁', rating: 4.9, orders: 326, price: '50 元/小时', community: '星湖花园 3 期', certified: true, desc: '从事家政 8 年，擅长日常保洁、开荒保洁、玻璃清洗。', reviews: [{ user: '星湖居民', rating: 5, text: '张姐干活特别仔细，家里打扫得干干净净！', time: '3 天前' }, { user: '翠湖业主', rating: 5, text: '推荐！准时到达，态度好。', time: '1 周前' }] },
    { id: 'sv2', name: '快修达', type: '维修', rating: 4.7, orders: 512, price: '上门费 30 元', community: '全区', certified: true, desc: '水电维修、管道疏通、家电维修，30 分钟上门。', reviews: [{ user: '万科住户', rating: 5, text: '水管漏水半小时就修好了，专业！', time: '2 天前' }] },
    { id: 'sv3', name: '李阿姨月嫂', type: '月嫂/育婴', rating: 5.0, orders: 89, price: '面议', community: '锦绣华庭', certified: true, desc: '持证月嫂，10 年经验，擅长新生儿护理、产妇护理。', reviews: [{ user: '新手妈妈', rating: 5, text: '李阿姨太专业了，月子期间帮了大忙！', time: '5 天前' }] },
    { id: 'sv4', name: '净衣坊', type: '洗衣/熨烫', rating: 4.6, orders: 203, price: '15 元/件起', community: '全区', certified: true, desc: '上门取送，干洗水洗、窗帘清洗、鞋包护理。', reviews: [{ user: '忙碌白领', rating: 4, text: '取送很方便，洗得也挺干净。', time: '1 周前' }] }
  ],

  // 首页信息流
  feed: [
    { type: 'house', icon: '🏠', title: '新房源上架', text: '星湖花园 3 期 · 2 室 1 厅 · 3500 元/月', time: '刚刚' },
    { type: 'secondhand', icon: '🛋️', title: '新闲置发布', text: '婴儿车 + 安全座椅套装 · 200 元', time: '2 小时前' },
    { type: 'help', icon: '🤝', title: '邻居求助', text: '帮忙代取快递 · 报酬：一杯奶茶', time: '30 分钟前' },
    { type: 'service', icon: '✨', title: '认证服务商', text: '张姐保洁 · 4.9 分 · 326 单', time: '今天' },
    { type: 'secondhand', icon: '📺', title: '新闲置发布', text: '小米电视 55 寸 · 800 元', time: '5 小时前' },
    { type: 'help', icon: '🐱', title: '邻居求助', text: '出差帮忙喂猫 3 天 · 猫零食大礼包', time: '2 小时前' }
  ]
};
