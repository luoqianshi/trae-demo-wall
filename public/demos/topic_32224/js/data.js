// ===== 海岛决策引擎 - 共享数据 =====

const ISLANDS = [
  {
    id: 1,
    name: "巴厘岛",
    location: "印度尼西亚",
    region: "东南亚",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop",
    matchScore: 96,
    tags: ["文化", "冲浪", "梯田", "SPA"],
    rating: 4.8,
    bestMonths: [4, 5, 6, 7, 8, 9, 10],
    bestSeason: "4月-10月",
    visa: "免签30天",
    flightTime: "约6小时",
    currency: "印尼盾 (IDR)",
    monthlyScores: {
      1: 75, 2: 78, 3: 82, 4: 90, 5: 93, 6: 94, 7: 93, 8: 92, 9: 90, 10: 88, 11: 80, 12: 76
    },
    oceanScore: {
      waterQuality: 92, visibility: 88, biodiversity: 95, coralHealth: 90,
      beachQuality: 94, waveQuality: 89, marineProtection: 85, sustainability: 87
    },
    ratings: {
      oceanScore: { waterQuality: 92, visibility: 88, biodiversity: 95, coralHealth: 90, beachQuality: 94, waveQuality: 89, marineProtection: 85, sustainability: 87 },
      suitability: 96,
      accessibility: 92,
      costEffectiveness: 92
    },
    reasons: [
      "文化体验丰富，乌布皇宫和德格拉朗梯田展现巴厘历史与自然之美",
      "最佳季节4-10月气候宜人，适合冲浪、徒步等户外活动",
      "免签政策便利，直飞航班多，性价比极高"
    ],
    price: { min: 3500, max: 5800, unit: "人" },
    climate: [27, 27, 28, 28, 28, 27, 27, 27, 27, 28, 28, 27],
    experiences: ["寺庙巡游", "梯田徒步", "冲浪课程", "传统SPA", "日落晚餐"],
    dailyCost: { accommodation: 300, food: 150, activities: 200, transport: 80, shopping: 100 },
    access: "直飞航班：北京/上海/广州均有直飞，飞行时间约6-7小时。落地签/免签入境。",
    attractions: [
      { icon: "🏛️", name: "乌布皇宫", desc: "巴厘岛最著名的皇家宫殿，感受传统巴厘建筑艺术" },
      { icon: "🌾", name: "德格拉朗梯田", desc: "UNESCO世界遗产，层层叠叠的翠绿稻田" },
      { icon: "🏄", name: "库塔海滩", desc: "冲浪者的天堂，适合各级别冲浪爱好者" },
      { icon: "🌅", name: "海神庙", desc: "建在海上岩石上的印度教寺庙，日落时分最美" }
    ]
  },
  {
    id: 2,
    name: "马尔代夫",
    location: "印度洋",
    region: "印度洋",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&h=400&fit=crop",
    matchScore: 98,
    tags: ["蜜月", "潜水", "水上屋", "珊瑚礁"],
    rating: 4.9,
    bestMonths: [11, 12, 1, 2, 3, 4],
    bestSeason: "11月-4月",
    visa: "免签30天",
    flightTime: "约8小时",
    currency: "马尔代夫拉菲亚 (MVR)",
    monthlyScores: {
      1: 92, 2: 93, 3: 94, 4: 92, 5: 85, 6: 78, 7: 75, 8: 76, 9: 80, 10: 85, 11: 90, 12: 91
    },
    oceanScore: {
      waterQuality: 98, visibility: 96, biodiversity: 94, coralHealth: 92,
      beachQuality: 97, waveQuality: 85, marineProtection: 93, sustainability: 90
    },
    ratings: {
      oceanScore: { waterQuality: 98, visibility: 96, biodiversity: 94, coralHealth: 92, beachQuality: 97, waveQuality: 85, marineProtection: 93, sustainability: 90 },
      suitability: 98,
      accessibility: 92,
      costEffectiveness: 72
    },
    reasons: [
      "世界顶级潜水胜地，珊瑚礁和海洋生物极为丰富",
      "水上屋住宿体验独一无二，蜜月旅行首选",
      "11月-4月最佳季节气候绝佳，海水能见度极高"
    ],
    price: { min: 14700, max: 24500, unit: "人" },
    climate: [28, 28, 29, 30, 29, 28, 28, 28, 28, 28, 28, 28],
    experiences: ["水上屋住宿", "深潜探索", "海豚观赏", "日落巡航", "私人沙滩晚餐"],
    dailyCost: { accommodation: 2000, food: 400, activities: 600, transport: 300, shopping: 200 },
    access: "需转机：经新加坡/吉隆坡/迪拜转机至马累，再乘水上飞机或快艇上岛。",
    attractions: [
      { icon: "🏝️", name: "马累市区", desc: "世界上最小的首都，体验当地市场和文化" },
      { icon: "🐠", name: "班多士潜水点", desc: "世界级潜水胜地，丰富的海洋生物" },
      { icon: "🌊", name: "荧光海滩", desc: "夜晚可见荧光海滩的自然奇观" },
      { icon: "🐬", name: "海豚湾", desc: "乘船观赏野生海豚跃出水面的壮观场景" }
    ]
  },
  {
    id: 3,
    name: "普吉岛",
    location: "泰国",
    region: "东南亚",
    image: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=600&h=400&fit=crop",
    matchScore: 93,
    tags: ["夜生活", "海滩", "跳岛", "美食"],
    rating: 4.6,
    bestMonths: [11, 12, 1, 2, 3, 4],
    bestSeason: "11月-4月",
    visa: "免签60天",
    flightTime: "约5小时",
    currency: "泰铢 (THB)",
    monthlyScores: {
      1: 90, 2: 91, 3: 92, 4: 90, 5: 82, 6: 75, 7: 72, 8: 73, 9: 78, 10: 84, 11: 88, 12: 89
    },
    oceanScore: {
      waterQuality: 85, visibility: 82, biodiversity: 88, coralHealth: 80,
      beachQuality: 90, waveQuality: 86, marineProtection: 78, sustainability: 80
    },
    ratings: {
      oceanScore: { waterQuality: 85, visibility: 82, biodiversity: 88, coralHealth: 80, beachQuality: 90, waveQuality: 86, marineProtection: 78, sustainability: 80 },
      suitability: 93,
      accessibility: 94,
      costEffectiveness: 94
    },
    reasons: [
      "泰国最大海岛，夜生活和美食体验丰富多彩",
      "性价比极高，消费水平亲民，适合各类旅行者",
      "11月-4月气候舒适，海水清澈，跳岛游体验绝佳"
    ],
    price: { min: 3200, max: 5300, unit: "人" },
    climate: [28, 29, 30, 30, 29, 28, 28, 28, 28, 28, 28, 28],
    experiences: ["跳岛游", "泰式按摩", "夜市美食", "大象保护营", "帆船出海"],
    dailyCost: { accommodation: 250, food: 120, activities: 180, transport: 60, shopping: 150 },
    access: "直飞航班：国内多城市直飞普吉，飞行时间约4-5小时。免签入境。",
    attractions: [
      { icon: "🗿", name: "大佛", desc: "45米高的白色大理石佛像，俯瞰全岛" },
      { icon: "🏖️", name: "芭东海滩", desc: "最热闹的海滩，丰富的水上活动和夜生活" },
      { icon: "⛵", name: "皮皮岛", desc: "电影《海滩》取景地，绝美海湾" },
      { icon: "🌺", name: "查龙寺", desc: "普吉岛最大的佛教寺庙，金碧辉煌" }
    ]
  },
  {
    id: 4,
    name: "夏威夷",
    location: "美国",
    region: "北美太平洋",
    image: "https://images.unsplash.com/photo-1542259671-fa4d4e0a7e9e?w=600&h=400&fit=crop",
    matchScore: 91,
    tags: ["火山", "冲浪", "雨林", "观鲸"],
    rating: 4.7,
    bestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    bestSeason: "全年适宜",
    visa: "需美签",
    flightTime: "约10小时",
    currency: "美元 (USD)",
    monthlyScores: {
      1: 88, 2: 89, 3: 90, 4: 91, 5: 92, 6: 93, 7: 94, 8: 94, 9: 93, 10: 92, 11: 90, 12: 88
    },
    oceanScore: {
      waterQuality: 93, visibility: 90, biodiversity: 91, coralHealth: 88,
      beachQuality: 95, waveQuality: 96, marineProtection: 89, sustainability: 88
    },
    ratings: {
      oceanScore: { waterQuality: 93, visibility: 90, biodiversity: 91, coralHealth: 88, beachQuality: 95, waveQuality: 96, marineProtection: 89, sustainability: 88 },
      suitability: 91,
      accessibility: 75,
      costEffectiveness: 76
    },
    reasons: [
      "全年适宜旅行，气候宜人，每个季节都有独特魅力",
      "火山国家公园和雨林徒步体验独一无二",
      "世界级冲浪胜地，威基基海滩闻名全球"
    ],
    price: { min: 8000, max: 13300, unit: "人" },
    climate: [23, 23, 24, 25, 26, 27, 28, 28, 27, 26, 25, 24],
    experiences: ["火山国家公园", "冲浪课程", "草裙舞表演", "观鲸之旅", "雨林徒步"],
    dailyCost: { accommodation: 800, food: 300, activities: 400, transport: 150, shopping: 250 },
    access: "需转机：经东京/首尔转机至檀香山，或直飞约10小时。需美国签证。",
    attractions: [
      { icon: "🌋", name: "基拉韦厄火山", desc: "世界上最活跃的火山之一，观赏熔岩流" },
      { icon: "🏄", name: "威基基海滩", desc: "夏威夷最著名的海滩，冲浪初学者天堂" },
      { icon: "🐋", name: "茂宜岛观鲸", desc: "冬季观赏座头鲸迁徙的绝佳地点" },
      { icon: "🌺", name: "波利尼西亚文化中心", desc: "了解太平洋岛屿文化的主题公园" }
    ]
  },
  {
    id: 5,
    name: "圣托里尼",
    location: "希腊",
    region: "地中海",
    image: "https://images.unsplash.com/photo-1613395877344-13d4c2807df5?w=600&h=400&fit=crop",
    matchScore: 94,
    tags: ["浪漫", "日落", "蓝顶教堂", "葡萄酒"],
    rating: 4.8,
    bestMonths: [5, 6, 7, 8, 9, 10],
    bestSeason: "5月-10月",
    visa: "申根签",
    flightTime: "约12小时",
    currency: "欧元 (EUR)",
    monthlyScores: {
      1: 50, 2: 52, 3: 60, 4: 72, 5: 85, 6: 92, 7: 96, 8: 95, 9: 88, 10: 78, 11: 62, 12: 54
    },
    oceanScore: {
      waterQuality: 91, visibility: 93, biodiversity: 82, coralHealth: 75,
      beachQuality: 88, waveQuality: 78, marineProtection: 86, sustainability: 89
    },
    ratings: {
      oceanScore: { waterQuality: 91, visibility: 93, biodiversity: 82, coralHealth: 75, beachQuality: 88, waveQuality: 78, marineProtection: 86, sustainability: 89 },
      suitability: 94,
      accessibility: 72,
      costEffectiveness: 74
    },
    reasons: [
      "世界最美日落观赏地伊亚小镇，浪漫氛围无可比拟",
      "蓝顶教堂与白色悬崖建筑相映成趣，摄影圣地",
      "5月-10月最佳季节气候舒适，火山岛风光独特"
    ],
    price: { min: 9000, max: 15000, unit: "人" },
    climate: [12, 12, 14, 17, 21, 25, 28, 28, 25, 21, 17, 14],
    experiences: ["悬崖餐厅", "帆船巡游", "火山温泉", "葡萄酒品鉴", "蓝顶教堂摄影"],
    dailyCost: { accommodation: 1200, food: 350, activities: 300, transport: 100, shopping: 200 },
    access: "需转机：经雅典转机至圣托里尼，飞行总时长约12-14小时。需申根签证。",
    attractions: [
      { icon: "⛪", name: "蓝顶教堂", desc: "圣托里尼标志性景观，白色建筑配蓝色圆顶" },
      { icon: "🌅", name: "伊亚日落", desc: "被誉为世界最美日落观赏点" },
      { icon: "🏛️", name: "阿克罗蒂里遗址", desc: "保存完好的米诺斯文明古城遗址" },
      { icon: "🍷", name: "桑托酒庄", desc: "品尝当地特色火山葡萄酒，俯瞰海景" }
    ]
  },
  {
    id: 6,
    name: "斐济",
    location: "南太平洋",
    region: "南太平洋",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    matchScore: 89,
    tags: ["潜水", "文化", "珊瑚礁", "部落"],
    rating: 4.5,
    bestMonths: [5, 6, 7, 8, 9, 10],
    bestSeason: "5月-10月",
    visa: "免签4个月",
    flightTime: "约11小时",
    currency: "斐济元 (FJD)",
    monthlyScores: {
      1: 82, 2: 84, 3: 86, 4: 88, 5: 90, 6: 91, 7: 90, 8: 89, 9: 88, 10: 86, 11: 84, 12: 82
    },
    oceanScore: {
      waterQuality: 95, visibility: 94, biodiversity: 93, coralHealth: 91,
      beachQuality: 92, waveQuality: 88, marineProtection: 90, sustainability: 92
    },
    ratings: {
      oceanScore: { waterQuality: 95, visibility: 94, biodiversity: 93, coralHealth: 91, beachQuality: 92, waveQuality: 88, marineProtection: 90, sustainability: 92 },
      suitability: 89,
      accessibility: 95,
      costEffectiveness: 86
    },
    reasons: [
      "南太平洋原始海岛风情，珊瑚礁保护极佳，潜水天堂",
      "免签4个月政策友好，旅行安排更加灵活",
      "5月-10月气候凉爽宜人，部落文化体验独特"
    ],
    price: { min: 5800, max: 9600, unit: "人" },
    climate: [27, 27, 27, 27, 26, 25, 24, 24, 25, 25, 26, 27],
    experiences: ["鲨鱼潜水", "部落文化", "漂流探险", "海钓", "珊瑚礁浮潜"],
    dailyCost: { accommodation: 600, food: 200, activities: 350, transport: 120, shopping: 100 },
    access: "需转机：经香港/首尔/悉尼转机至楠迪，飞行总时长约10-12小时。免签入境。",
    attractions: [
      { icon: "🦈", name: "贝卡环礁", desc: "与公牛鲨共潜的世界著名潜水点" },
      { icon: "🏝️", name: "玛玛努卡群岛", desc: "《荒岛余生》取景地，绝美白沙滩" },
      { icon: "🎭", name: "文化村", desc: "体验传统卡瓦仪式和米克舞表演" },
      { icon: "💧", name: "萨贝托温泉", desc: "天然泥浴温泉，独特的护肤体验" }
    ]
  },
  {
    id: 7,
    name: "冲绳",
    location: "日本",
    region: "东亚",
    image: "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=600&h=400&fit=crop",
    matchScore: 90,
    tags: ["美食", "海滩", "文化", "潜水"],
    rating: 4.6,
    bestMonths: [4, 5, 6, 9, 10],
    bestSeason: "4月-6月",
    visa: "免签",
    flightTime: "约3小时",
    currency: "日元 (JPY)",
    monthlyScores: {
      1: 65, 2: 68, 3: 75, 4: 88, 5: 92, 6: 90, 7: 82, 8: 80, 9: 86, 10: 85, 11: 76, 12: 68
    },
    oceanScore: {
      waterQuality: 90, visibility: 87, biodiversity: 89, coralHealth: 86,
      beachQuality: 91, waveQuality: 84, marineProtection: 88, sustainability: 90
    },
    ratings: {
      oceanScore: { waterQuality: 90, visibility: 87, biodiversity: 89, coralHealth: 86, beachQuality: 91, waveQuality: 84, marineProtection: 88, sustainability: 90 },
      suitability: 90,
      accessibility: 93,
      costEffectiveness: 88
    },
    reasons: [
      "日本最近的离岛，飞行仅3小时即可抵达",
      "琉球文化和美食独具特色，融合中日元素",
      "4月-6月最佳季节避开台风季，海水温暖清澈"
    ],
    price: { min: 5000, max: 8400, unit: "人" },
    climate: [17, 17, 19, 21, 24, 27, 29, 29, 27, 25, 22, 19],
    experiences: ["潜水", "琉球料理", "古宇利大桥", "美丽海水族馆", "空手道体验"],
    dailyCost: { accommodation: 500, food: 200, activities: 250, transport: 100, shopping: 150 },
    access: "直飞航班：北京/上海/香港有直飞那霸航班，飞行时间约2.5-3小时。免签入境。",
    attractions: [
      { icon: "🐟", name: "美丽海水族馆", desc: "世界最大水族馆之一，观赏鲸鲨" },
      { icon: "🌉", name: "古宇利大桥", desc: "跨越碧蓝海面的绝美跨海大桥" },
      { icon: "🏯", name: "首里城", desc: "琉球王国都城，融合中日建筑风格" },
      { icon: "🏖️", name: "万座毛", desc: "象鼻形海蚀崖，冲绳标志性景观" }
    ]
  },
  {
    id: 8,
    name: "坎昆",
    location: "墨西哥",
    region: "加勒比海",
    image: "https://images.unsplash.com/photo-1552074291-ad4df10d0c73?w=600&h=400&fit=crop",
    matchScore: 87,
    tags: ["古迹", "派对", "天坑", "粉红湖"],
    rating: 4.4,
    bestMonths: [12, 1, 2, 3, 4],
    bestSeason: "12月-4月",
    visa: "需美签/墨签",
    flightTime: "约15小时",
    currency: "墨西哥比索 (MXN)",
    monthlyScores: {
      1: 90, 2: 91, 3: 92, 4: 90, 5: 85, 6: 80, 7: 78, 8: 79, 9: 82, 10: 86, 11: 88, 12: 89
    },
    oceanScore: {
      waterQuality: 88, visibility: 85, biodiversity: 90, coralHealth: 83,
      beachQuality: 92, waveQuality: 80, marineProtection: 82, sustainability: 81
    },
    ratings: {
      oceanScore: { waterQuality: 88, visibility: 85, biodiversity: 90, coralHealth: 83, beachQuality: 92, waveQuality: 80, marineProtection: 82, sustainability: 81 },
      suitability: 87,
      accessibility: 70,
      costEffectiveness: 80
    },
    reasons: [
      "玛雅遗迹奇琴伊察展现古文明魅力，世界新七大奇迹之一",
      "粉红湖和天坑潜水体验独一无二，地质奇观令人惊叹",
      "12月-4月最佳季节气候温暖舒适，全包度假村体验极佳"
    ],
    price: { min: 6600, max: 11000, unit: "人" },
    climate: [24, 25, 26, 27, 28, 29, 29, 29, 29, 28, 26, 25],
    experiences: ["玛雅遗迹", "天坑潜水", "全包度假村", "粉红湖", "浮潜探索"],
    dailyCost: { accommodation: 700, food: 250, activities: 350, transport: 100, shopping: 180 },
    access: "需转机：经美国/欧洲转机至坎昆，飞行总时长约15-18小时。需签证。",
    attractions: [
      { icon: "🗿", name: "奇琴伊察", desc: "世界新七大奇迹之一，玛雅文明巅峰之作" },
      { icon: "💧", name: "塞诺特天坑", desc: "天然地下水池，独特的潜水体验" },
      { icon: "🦩", name: "粉红湖", desc: "因藻类而呈现粉红色的天然湖泊" },
      { icon: "🏖️", name: "女人岛", desc: "坎昆附近的宁静小岛，适合浮潜" }
    ]
  }
];

// 表单选项
const OPTIONS = {
  months: [
    { value: "1", label: "1月" }, { value: "2", label: "2月" },
    { value: "3", label: "3月" }, { value: "4", label: "4月" },
    { value: "5", label: "5月" }, { value: "6", label: "6月" },
    { value: "7", label: "7月" }, { value: "8", label: "8月" },
    { value: "9", label: "9月" }, { value: "10", label: "10月" },
    { value: "11", label: "11月" }, { value: "12", label: "12月" }
  ],
  days: [
    { value: "3", label: "3天" }, { value: "5", label: "5天" },
    { value: "7", label: "7天" }, { value: "10", label: "10天" },
    { value: "14", label: "14天" }
  ],
  budgets: [
    { value: "low", label: "经济型 (¥3000以下)" },
    { value: "medium", label: "舒适型 (¥3000-8000)" },
    { value: "high", label: "豪华型 (¥8000-15000)" },
    { value: "luxury", label: "奢华型 (¥15000+)" }
  ]
};

// 地区列表
const REGIONS = ["全部", "东南亚", "南太平洋", "加勒比海", "地中海", "印度洋", "东亚", "北美太平洋"];

// 海洋评分维度
const OCEAN_LABELS = {
  waterQuality: "水质清澈度", visibility: "水下能见度",
  biodiversity: "生物多样性", coralHealth: "珊瑚礁健康",
  beachQuality: "沙滩质量", waveQuality: "海浪质量",
  marineProtection: "海洋保护", sustainability: "可持续性"
};

// 费用类型
const COST_LABELS = {
  accommodation: "住宿", food: "餐饮",
  activities: "活动", transport: "交通", shopping: "购物"
};

// 评分维度中文映射
const RATING_DIMENSIONS = {
  oceanScore: "海洋质量",
  suitability: "季节适宜",
  accessibility: "交通便利",
  costEffectiveness: "性价比"
};

/**
 * 根据用户偏好推荐最佳海岛
 * @param {Object} userPrefs - 用户偏好 { month: string }
 * @returns {Array} 排名前3的海岛（已附加 matchScore）
 */
function getRecommendations(userPrefs) {
  const month = parseInt(userPrefs.month) || 6;
  return [...ISLANDS]
    .filter(i => i.monthlyScores && i.monthlyScores[month])
    .sort((a, b) => (b.monthlyScores[month] || 0) - (a.monthlyScores[month] || 0))
    .slice(0, 3)
    .map(i => ({
      ...i,
      matchScore: i.monthlyScores[month]
    }));
}

/**
 * 获取模拟卫星海洋数据
 * @param {number} islandId - 海岛ID (1-8)
 * @param {number} month - 月份 (1-12)
 * @returns {Object} 卫星监测数据
 */
function getSatelliteData(islandId, month) {
  const mockData = {
    1: { waterTemp: 28, visibility: 25, waveHeight: 0.8, rainProb: 30 },
    2: { waterTemp: 30, visibility: 40, waveHeight: 0.5, rainProb: 15 },
    3: { waterTemp: 29, visibility: 20, waveHeight: 1.0, rainProb: 35 },
    4: { waterTemp: 26, visibility: 30, waveHeight: 0.6, rainProb: 20 },
    5: { waterTemp: 24, visibility: 35, waveHeight: 0.4, rainProb: 10 },
    6: { waterTemp: 28, visibility: 30, waveHeight: 0.7, rainProb: 25 },
    7: { waterTemp: 27, visibility: 22, waveHeight: 0.9, rainProb: 40 },
    8: { waterTemp: 29, visibility: 28, waveHeight: 0.5, rainProb: 18 }
  };
  return mockData[islandId] || { waterTemp: 26, visibility: 20, waveHeight: 0.8, rainProb: 30 };
}