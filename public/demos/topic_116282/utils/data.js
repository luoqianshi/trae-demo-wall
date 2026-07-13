// utils/data.js — 饭合模拟数据

// 餐厅图片占位 (使用渐变色CSS代替实际图片)
const placeholderImages = {
  hotpot: 'linear-gradient(135deg, #D4845A, #A8643E)',
  private: 'linear-gradient(135deg, #7B9E6B, #5E8450)',
  dimsum: 'linear-gradient(135deg, #E8C87A, #D4B56A)',
  default: 'linear-gradient(135deg, #F0E8DF, #EDE5DB)'
}

const mockUser = {
  id: 'user_001',
  name: '张先生',
  handle: '@foodie_explorer',
  avatar: '',
  state: 'seated', // guest | tested | seated
  personality: 'ESRP',
  personalityName: '美食侦探',
  city: '成都',
  // 信用数据
  credit: {
    score: 'A+',
    level: '优秀',
    metrics: {
      keepRate: { value: 100, label: '守约率', color: '#5A9E6B' },
      punctualityRate: { value: 98, label: '准时率', color: '#5A9E6B' },
      paymentCredit: { value: 70, label: '付款信用', display: '良好', color: '#D4A05A' }
    },
    tags: ['准时', '付款爽快', '边界感好', '真懂吃']
  },
  stats: {
    favorites: 128,
    reviews: 56,
    likes: 342
  },
  // 入席名额
  inviteQuota: {
    total: 3,
    used: 1,
    remaining: 2
  }
}

const mockMeals = [
  {
    id: 'meal_001',
    name: '老成都火锅',
    cuisine: '川菜',
    image: placeholderImages.hotpot,
    date: '今天 19:00',
    dateLabel: '7月15日 19:00',
    location: '武侯区玉林路',
    district: '武侯区',
    distance: '1.2km',
    rating: 4.8,
    historyCount: 12,
    seats: { filled: 3, total: 4, remaining: 1 },
    budget: 150,
    dishes: ['毛肚', '鸭血', '黄喉', '鹅肠'],
    initiator: {
      name: '李老饕',
      personality: 'CSRF',
      personalityName: '烟火常客',
      avatar: '',
      creditTags: [
        { text: '准时率100%', type: 'positive' },
        { text: '真懂吃', type: 'positive' }
      ]
    },
    status: 'open',
    matchScore: 95
  },
  {
    id: 'meal_002',
    name: '梧桐私房菜',
    cuisine: '粤菜',
    image: placeholderImages.private,
    date: '明天 12:00',
    dateLabel: '7月16日 12:00',
    location: '锦江区春熙路',
    district: '锦江区',
    distance: '2.5km',
    rating: 4.9,
    historyCount: 8,
    seats: { filled: 2, total: 4, remaining: 2 },
    budget: 220,
    dishes: ['白切鸡', '烧鹅', '虾饺', '肠粉'],
    initiator: {
      name: '王食客',
      personality: 'CNIF',
      personalityName: '餐桌哲学家',
      avatar: '',
      creditTags: [
        { text: '准时率98%', type: 'positive' },
        { text: '认真吃饭', type: 'positive' }
      ]
    },
    status: 'open',
    matchScore: 92
  },
  {
    id: 'meal_003',
    name: '小龙坎火锅',
    cuisine: '川菜',
    image: placeholderImages.hotpot,
    date: '后天 18:30',
    dateLabel: '7月17日 18:30',
    location: '高新区天府大道',
    district: '高新区',
    distance: '3.8km',
    rating: 4.6,
    historyCount: 25,
    seats: { filled: 2, total: 4, remaining: 2 },
    budget: 130,
    dishes: ['毛肚', '鸭肠', '嫩牛肉', '酥肉'],
    initiator: {
      name: '赵探店',
      personality: 'ESRP',
      personalityName: '美食侦探',
      avatar: '',
      creditTags: [
        { text: '准时率95%', type: 'positive' }
      ]
    },
    status: 'open',
    matchScore: 88
  },
  {
    id: 'meal_004',
    name: '银树茶餐厅',
    cuisine: '粤菜',
    image: placeholderImages.dimsum,
    date: '周六 11:30',
    dateLabel: '7月18日 11:30',
    location: '青羊区宽窄巷子',
    district: '青羊区',
    distance: '1.8km',
    rating: 4.5,
    historyCount: 15,
    seats: { filled: 1, total: 4, remaining: 3 },
    budget: 90,
    dishes: ['菠萝包', '丝袜奶茶', '叉烧饭', '西多士'],
    initiator: {
      name: '陈小姐',
      personality: 'CSRF',
      personalityName: '烟火常客',
      avatar: '',
      creditTags: [
        { text: '准时率97%', type: 'positive' }
      ]
    },
    status: 'open',
    matchScore: 85
  }
]

// 食人格测试题目
const quizQuestions = [
  {
    id: 1,
    dimension: 'E',
    dimensionLabel: '探索倾向',
    question: '周五晚上突然有空，你会怎么选餐厅？',
    options: [
      { label: 'A', text: '打开大众点评，搜附近评分最高的新店', value: 'E' },
      { label: 'B', text: '回到上周觉得不错的那家老地方', value: 'C' }
    ]
  },
  {
    id: 2,
    dimension: 'E',
    dimensionLabel: '探索倾向',
    question: '朋友推荐了一家你没听过的菜系，你的反应？',
    options: [
      { label: 'A', text: '立刻搜攻略，找个周末就去试试', value: 'E' },
      { label: 'B', text: '先看看评价，等有人陪了再说', value: 'C' }
    ]
  },
  {
    id: 3,
    dimension: 'E',
    dimensionLabel: '探索倾向',
    question: '你收藏的餐厅列表是什么样的？',
    options: [
      { label: 'A', text: '各种想去尝试的新店，越长越好', value: 'E' },
      { label: 'B', text: '就那几家常去的，偶尔加一家', value: 'C' }
    ]
  },
  {
    id: 4,
    dimension: 'S',
    dimensionLabel: '感知方式',
    question: '到了一家新餐厅，你最先关注什么？',
    options: [
      { label: 'A', text: '菜单上的菜品描述和食材来源', value: 'S' },
      { label: 'B', text: '餐厅的氛围、装修和音乐', value: 'N' }
    ]
  },
  {
    id: 5,
    dimension: 'S',
    dimensionLabel: '感知方式',
    question: '你觉得一顿好饭最重要的标志是？',
    options: [
      { label: 'A', text: '食材新鲜，味道到位，火候精准', value: 'S' },
      { label: 'B', text: '用餐体验完整，从环境到服务都好', value: 'N' }
    ]
  },
  {
    id: 6,
    dimension: 'S',
    dimensionLabel: '感知方式',
    question: '选餐厅时你最看重哪条信息？',
    options: [
      { label: 'A', text: '人均消费和必点菜清单', value: 'S' },
      { label: 'B', text: '餐厅的风格定位和主厨理念', value: 'N' }
    ]
  },
  {
    id: 7,
    dimension: 'R',
    dimensionLabel: '决策方式',
    question: '点菜时你会怎么做？',
    options: [
      { label: 'A', text: '看评分和评价，选数据支持的好菜', value: 'R' },
      { label: 'B', text: '凭直觉和当时的心情选', value: 'I' }
    ]
  },
  {
    id: 8,
    dimension: 'R',
    dimensionLabel: '决策方式',
    question: '两个饭局时间冲突，你怎么选？',
    options: [
      { label: 'A', text: '对比两家餐厅的评分、菜品和性价比', value: 'R' },
      { label: 'B', text: '看哪家更想去，跟着感觉走', value: 'I' }
    ]
  },
  {
    id: 9,
    dimension: 'R',
    dimensionLabel: '决策方式',
    question: '饭后评价你会写什么？',
    options: [
      { label: 'A', text: '逐道菜点评，记录具体优缺点', value: 'R' },
      { label: 'B', text: '写整体感受和特别印象深刻的点', value: 'I' }
    ]
  },
  {
    id: 10,
    dimension: 'P',
    dimensionLabel: '计划倾向',
    question: '聚餐前一天你会做什么？',
    options: [
      { label: 'A', text: '确认菜单、查路线、预约到位', value: 'P' },
      { label: 'B', text: '到时再说，临时决定也行', value: 'F' }
    ]
  },
  {
    id: 11,
    dimension: 'P',
    dimensionLabel: '计划倾向',
    question: '到了餐厅发现要排队1小时，你怎么办？',
    options: [
      { label: 'A', text: '早就预约好了，直接入座', value: 'P' },
      { label: 'B', text: '换一家吧，附近走走看看', value: 'F' }
    ]
  },
  {
    id: 12,
    dimension: 'P',
    dimensionLabel: '计划倾向',
    question: '你的美食探店方式更接近哪种？',
    options: [
      { label: 'A', text: '列好清单，按计划逐一打卡', value: 'P' },
      { label: 'B', text: '走到哪吃到哪，随性发现', value: 'F' }
    ]
  }
]

// 食人格结果详情
const personalityDetails = {
  ESRP: {
    code: 'ESRP',
    name: '美食侦探',
    tagline: '看完所有榜单和测评再出发，每一道菜都有道理',
    dims: [
      { letter: 'E', label: '探索派', color: 'terracotta' },
      { letter: 'S', label: '实感派', color: 'olive' },
      { letter: 'R', label: '理性派', color: 'amber' },
      { letter: 'P', label: '计划党', color: 'slate' }
    ],
    description: '吃饭对你来说从来不是随便的事。你会在出发前研究每家餐厅的评分、必点菜、避雷菜、人均消费、排队时长，甚至会提前看菜单模拟下单。你相信数据驱动的用餐决策，认为一顿好饭需要充分的准备。',
    diningStyle: '提前研究菜单，到店后精准点菜，很少临时加菜，每道菜都有理由。',
    suitableRestaurants: ['米其林', '黑珍珠', '大众点评高分店', '需预订的热门餐厅'],
    matches: [
      { code: 'ESRP', name: '美食侦探', desc: '同类型老饕局', color: 'terracotta' },
      { code: 'CSRP', name: '老饕守护者', desc: '相互启发', color: 'olive' }
    ],
    warnings: ['没有菜单的店', '不知道今天有什么菜的私房菜', '临时换餐厅'],
    quote: '这家店我研究过了，前三道菜是必点的，最后那道甜品可以跳过。'
  },
  CSRF: {
    code: 'CSRF',
    name: '烟火常客',
    tagline: '老地方，老味道，熟悉的就是最好的',
    dims: [
      { letter: 'C', label: '保守派', color: 'terracotta' },
      { letter: 'S', label: '实感派', color: 'olive' },
      { letter: 'R', label: '理性派', color: 'amber' },
      { letter: 'F', label: '随性党', color: 'slate' }
    ],
    description: '你有一份属于自己的美食地图，那些藏在巷子里的老店是你的秘密花园。你不需要花哨的推荐，因为最好的味道你已经知道了。对你来说，一家好餐厅值得反复去，熟悉的老板、稳定的出品，才是吃饭该有的样子。',
    diningStyle: '常去固定几家店，跟老板熟络，点固定的几道拿手菜，偶尔尝新。',
    suitableRestaurants: ['老字号', '苍蝇馆子', '社区店', '开了10年以上的店'],
    matches: [
      { code: 'CSRF', name: '烟火常客', desc: '一起去老地方', color: 'terracotta' },
      { code: 'CNIF', name: '餐桌哲学家', desc: '互补搭配', color: 'olive' }
    ],
    warnings: ['网红打卡店', '经常换菜单的店', '装修过于精致的店'],
    quote: '别排队了，我带你去后面那条街，有家开了二十年的馆子，比这强多了。'
  },
  CNIF: {
    code: 'CNIF',
    name: '餐桌哲学家',
    tagline: '吃饭不仅是填饱肚子，更是一场生活的修行',
    dims: [
      { letter: 'C', label: '保守派', color: 'terracotta' },
      { letter: 'N', label: '直觉派', color: 'olive' },
      { letter: 'I', label: '感性派', color: 'amber' },
      { letter: 'F', label: '随性党', color: 'slate' }
    ],
    description: '你吃饭讲究的是一个"境"字。环境、器皿、上菜顺序、同桌的人，都会影响你对这顿饭的评价。你喜欢有故事、有温度的餐厅，相信好的用餐体验是五感的综合艺术。',
    diningStyle: '注重用餐氛围，喜欢和懂吃的人同桌，享受边吃边聊的过程。',
    suitableRestaurants: ['私房菜', '有主厨理念的店', '小众雅致餐厅', '有故事的院子餐厅'],
    matches: [
      { code: 'CNIF', name: '餐桌哲学家', desc: '灵魂共鸣', color: 'terracotta' },
      { code: 'ENRP', name: '美食策展人', desc: '审美互补', color: 'olive' }
    ],
    warnings: ['快餐连锁', '嘈杂的大排档', '没有独立空间的店'],
    quote: '这顿饭不在于吃了什么，而在于和谁吃、在什么情境下吃。'
  },
  ENRP: {
    code: 'ENRP',
    name: '美食策展人',
    tagline: '每一顿饭都是一次策展，从食材到摆盘都讲究',
    dims: [
      { letter: 'E', label: '探索派', color: 'terracotta' },
      { letter: 'N', label: '直觉派', color: 'olive' },
      { letter: 'R', label: '理性派', color: 'amber' },
      { letter: 'P', label: '计划党', color: 'slate' }
    ],
    description: '你把吃饭当成一门艺术来经营。从选餐厅、研究主厨背景到搭配菜品顺序，每一步都精心策划。你喜欢探索新店，但也讲究品质和格调，是朋友圈里的美食风向标。',
    diningStyle: '精心策划每一餐，注重菜品搭配和用餐节奏，喜欢分享美食发现。',
    suitableRestaurants: ['新开业精品店', '主厨餐厅', 'fusion料理', '有品鉴菜单的店'],
    matches: [
      { code: 'ENRP', name: '美食策展人', desc: '品鉴搭子', color: 'terracotta' },
      { code: 'ESRP', name: '美食侦探', desc: '攻略互补', color: 'olive' }
    ],
    warnings: ['出品不稳定的店', '没有品鉴菜单的店', '环境粗糙的网红店'],
    quote: '这家新店的主厨是从米其林出来的，这套品鉴菜单的节奏感非常好。'
  }
}

// 消息通知数据
const mockNotifications = [
  {
    id: 1,
    type: 'confirm',
    section: '今天',
    icon: 'check-circle',
    iconBg: '#EAF0FA',
    iconColor: '#5A8E9E',
    title: '你的入席申请已通过',
    body: '老成都火锅 · 7月15日 19:00 · 发起人已确认你的入席',
    time: '10分钟前',
    unread: true
  },
  {
    id: 2,
    type: 'reminder',
    section: '今天',
    icon: 'clock',
    iconBg: '#FDF6E8',
    iconColor: '#D4A05A',
    title: '饭局即将开始',
    body: '老成都火锅 · 今天 19:00 · 请提前15分钟到店',
    time: '2小时前',
    unread: false
  },
  {
    id: 3,
    type: 'recommend',
    section: '今天',
    icon: 'star',
    iconBg: '#FBEDED',
    iconColor: '#D4845A',
    title: '有新的匹配饭局',
    body: '梧桐私房菜 · 你的食人格与发起人匹配度92%',
    time: '5小时前',
    unread: false
  },
  {
    id: 4,
    type: 'credit',
    section: '昨天',
    icon: 'heart',
    iconBg: '#EEF5EB',
    iconColor: '#5A9E6B',
    title: '完成饭局评价',
    body: '你对小龙坎火锅的同桌还没有完成评价，去评价获得信用积分',
    time: '昨天 22:30',
    unread: false
  },
  {
    id: 5,
    type: 'quota',
    section: '昨天',
    icon: 'ticket',
    iconBg: '#FDF6E8',
    iconColor: '#D4A05A',
    title: '获得入席名额',
    body: '你完成了一局饭合，获得1个入席名额，本月剩余2个',
    time: '昨天 21:15',
    unread: false
  },
  {
    id: 6,
    type: 'credit',
    section: '昨天',
    icon: 'badge',
    iconBg: '#EEF5EB',
    iconColor: '#5A9E6B',
    title: '获得新信用标签',
    body: '同桌为你打上了「真懂吃」标签',
    time: '昨天 21:00',
    unread: false
  },
  {
    id: 7,
    type: 'cancel',
    section: '更早',
    icon: 'alert',
    iconBg: '#FBEDED',
    iconColor: '#D45A5A',
    title: '饭局已取消',
    body: '发起人取消了「私房粤菜 · 7月12日」饭局',
    time: '3天前',
    unread: false,
    muted: true
  }
]

module.exports = {
  mockUser,
  mockMeals,
  quizQuestions,
  personalityDetails,
  mockNotifications,
  placeholderImages
}
