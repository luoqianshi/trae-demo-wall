// 中国主要城市数据库
export interface CityInfo {
  name: string;
  // 经纬度（用于计算距离）
  lat: number;
  lng: number;
  // 机场信息
  airportName: string;
  airportCode: string;
  // 主要火车站
  trainStation: string;
  // 城市特色（用于生成亮点和小贴士）
  specialties: string[];
  // 城市级别（一线/二线，影响价格）
  tier: 1 | 2 | 3;
}

export const cityDatabase: Record<string, CityInfo> = {
  北京: {
    name: '北京',
    lat: 39.9042,
    lng: 116.4074,
    airportName: '北京大兴',
    airportCode: 'PKX',
    trainStation: '北京南',
    specialties: ['烤鸭', '故宫', '胡同', '豆汁焦圈', '长城'],
    tier: 1,
  },
  上海: {
    name: '上海',
    lat: 31.2304,
    lng: 121.4737,
    airportName: '上海虹桥',
    airportCode: 'SHA',
    trainStation: '上海虹桥',
    specialties: ['小笼包', '外滩', '南京路', '本帮菜', '迪士尼'],
    tier: 1,
  },
  广州: {
    name: '广州',
    lat: 23.1291,
    lng: 113.2644,
    airportName: '广州白云',
    airportCode: 'CAN',
    trainStation: '广州南',
    specialties: ['早茶', '肠粉', '虾饺', '白云山', '沙面'],
    tier: 1,
  },
  深圳: {
    name: '深圳',
    lat: 22.5431,
    lng: 114.0579,
    airportName: '深圳宝安',
    airportCode: 'SZX',
    trainStation: '深圳北',
    specialties: ['粤菜', '世界之窗', '大梅沙', '华强北', '莲花山'],
    tier: 1,
  },
  成都: {
    name: '成都',
    lat: 30.5728,
    lng: 104.0668,
    airportName: '成都天府',
    airportCode: 'TFU',
    trainStation: '成都东',
    specialties: ['火锅', '宽窄巷子', '熊猫基地', '担担面', '钵钵鸡'],
    tier: 1,
  },
  杭州: {
    name: '杭州',
    lat: 30.2741,
    lng: 120.1551,
    airportName: '杭州萧山',
    airportCode: 'HGH',
    trainStation: '杭州东',
    specialties: ['西湖', '龙井虾仁', '宋城', '灵隐寺', '叫化鸡'],
    tier: 1,
  },
  武汉: {
    name: '武汉',
    lat: 30.5928,
    lng: 114.3055,
    airportName: '武汉天河',
    airportCode: 'WUH',
    trainStation: '武汉',
    specialties: ['热干面', '黄鹤楼', '豆皮', '东湖', '鸭脖'],
    tier: 1,
  },
  西安: {
    name: '西安',
    lat: 34.3416,
    lng: 108.9398,
    airportName: '西安咸阳',
    airportCode: 'XIY',
    trainStation: '西安北',
    specialties: ['肉夹馍', '兵马俑', '凉皮', '回民街', '羊肉泡馍'],
    tier: 2,
  },
  南京: {
    name: '南京',
    lat: 32.0603,
    lng: 118.7969,
    airportName: '南京禄口',
    airportCode: 'NKG',
    trainStation: '南京南',
    specialties: ['鸭血粉丝汤', '夫子庙', '盐水鸭', '中山陵', '蟹黄包'],
    tier: 2,
  },
  重庆: {
    name: '重庆',
    lat: 29.4316,
    lng: 106.9123,
    airportName: '重庆江北',
    airportCode: 'CKG',
    trainStation: '重庆北',
    specialties: ['火锅', '洪崖洞', '小面', '解放碑', '酸辣粉'],
    tier: 1,
  },
  长沙: {
    name: '长沙',
    lat: 28.2282,
    lng: 112.9388,
    airportName: '长沙黄花',
    airportCode: 'CSX',
    trainStation: '长沙南',
    specialties: ['茶颜悦色', '臭豆腐', '橘子洲', '米粉', '剁椒鱼头'],
    tier: 2,
  },
  青岛: {
    name: '青岛',
    lat: 36.0671,
    lng: 120.3826,
    airportName: '青岛胶东',
    airportCode: 'TAO',
    trainStation: '青岛北',
    specialties: ['海鲜', '啤酒', '栈桥', '八大关', '鲅鱼水饺'],
    tier: 2,
  },
  昆明: {
    name: '昆明',
    lat: 25.0389,
    lng: 102.7183,
    airportName: '昆明长水',
    airportCode: 'KMG',
    trainStation: '昆明南',
    specialties: ['过桥米线', '石林', '鲜花饼', '滇池', '汽锅鸡'],
    tier: 2,
  },
  厦门: {
    name: '厦门',
    lat: 24.4798,
    lng: 118.0894,
    airportName: '厦门高崎',
    airportCode: 'XMN',
    trainStation: '厦门北',
    specialties: ['沙茶面', '鼓浪屿', '海蛎煎', '南普陀', '土笋冻'],
    tier: 2,
  },
  天津: {
    name: '天津',
    lat: 39.3434,
    lng: 117.3616,
    airportName: '天津滨海',
    airportCode: 'TSN',
    trainStation: '天津西',
    specialties: ['狗不理包子', '煎饼果子', '意式风情街', '麻花', '相声'],
    tier: 2,
  },
  郑州: {
    name: '郑州',
    lat: 34.7466,
    lng: 113.6253,
    airportName: '郑州新郑',
    airportCode: 'CGO',
    trainStation: '郑州东',
    specialties: ['胡辣汤', '烩面', '少林寺', '黄河游览区', '油馍头'],
    tier: 2,
  },
  贵阳: {
    name: '贵阳',
    lat: 26.6470,
    lng: 106.6302,
    airportName: '贵阳龙洞堡',
    airportCode: 'KWE',
    trainStation: '贵阳北',
    specialties: ['酸汤鱼', '丝娃娃', '青岩古镇', '肠旺面', '黄果树瀑布'],
    tier: 2,
  },
  兰州: {
    name: '兰州',
    lat: 36.0611,
    lng: 103.8343,
    airportName: '兰州中川',
    airportCode: 'LHW',
    trainStation: '兰州西',
    specialties: ['牛肉面', '黄河铁桥', '白塔山', '甜胚子', '酿皮'],
    tier: 3,
  },
  南宁: {
    name: '南宁',
    lat: 22.8170,
    lng: 108.3665,
    airportName: '南宁吴圩',
    airportCode: 'NNG',
    trainStation: '南宁东',
    specialties: ['老友粉', '酸嘢', '青秀山', '螺蛳粉', '柠檬鸭'],
    tier: 3,
  },
  沈阳: {
    name: '沈阳',
    lat: 41.8057,
    lng: 123.4315,
    airportName: '沈阳桃仙',
    airportCode: 'SHE',
    trainStation: '沈阳北',
    specialties: ['老边饺子', '故宫', '锅包肉', '中街', '杀猪菜'],
    tier: 2,
  },
  哈尔滨: {
    name: '哈尔滨',
    lat: 45.8038,
    lng: 126.5350,
    airportName: '哈尔滨太平',
    airportCode: 'HRB',
    trainStation: '哈尔滨西',
    specialties: ['红肠', '冰雪大世界', '锅包肉', '中央大街', '马迭尔冰棍'],
    tier: 2,
  },
  大连: {
    name: '大连',
    lat: 38.9140,
    lng: 121.6147,
    airportName: '大连周水子',
    airportCode: 'DLC',
    trainStation: '大连北',
    specialties: ['海鲜', '星海广场', '焖子', '棒棰岛', '铁板鱿鱼'],
    tier: 2,
  },
  三亚: {
    name: '三亚',
    lat: 18.2528,
    lng: 109.5119,
    airportName: '三亚凤凰',
    airportCode: 'SYX',
    trainStation: '三亚',
    specialties: ['海鲜', '天涯海角', '椰子鸡', '亚龙湾', '清补凉'],
    tier: 2,
  },
  乌鲁木齐: {
    name: '乌鲁木齐',
    lat: 43.8256,
    lng: 87.6168,
    airportName: '乌鲁木齐地窝堡',
    airportCode: 'URC',
    trainStation: '乌鲁木齐',
    specialties: ['大盘鸡', '烤羊肉串', '天山天池', '馕', '拉条子'],
    tier: 3,
  },
  拉萨: {
    name: '拉萨',
    lat: 29.6500,
    lng: 91.1000,
    airportName: '拉萨贡嘎',
    airportCode: 'LXA',
    trainStation: '拉萨',
    specialties: ['酥油茶', '布达拉宫', '糌粑', '大昭寺', '藏面'],
    tier: 3,
  },
  呼和浩特: {
    name: '呼和浩特',
    lat: 40.8426,
    lng: 111.7511,
    airportName: '呼和浩特白塔',
    airportCode: 'HET',
    trainStation: '呼和浩特东',
    specialties: ['烤全羊', '奶茶', '大召寺', '手把肉', '莜面'],
    tier: 3,
  },
  太原: {
    name: '太原',
    lat: 37.8706,
    lng: 112.5489,
    airportName: '太原武宿',
    airportCode: 'TYN',
    trainStation: '太原南',
    specialties: ['刀削面', '晋祠', '过油肉', '老陈醋', '头脑'],
    tier: 2,
  },
  石家庄: {
    name: '石家庄',
    lat: 38.0428,
    lng: 114.5149,
    airportName: '石家庄正定',
    airportCode: 'SJW',
    trainStation: '石家庄',
    specialties: ['驴肉火烧', '正定古城', '缸炉烧饼', '赵州桥', '宫面'],
    tier: 2,
  },
  济南: {
    name: '济南',
    lat: 36.6512,
    lng: 117.1201,
    airportName: '济南遥墙',
    airportCode: 'TNA',
    trainStation: '济南西',
    specialties: ['把子肉', '趵突泉', '油旋', '大明湖', '甜沫'],
    tier: 2,
  },
  合肥: {
    name: '合肥',
    lat: 31.8206,
    lng: 117.2272,
    airportName: '合肥新桥',
    airportCode: 'HFE',
    trainStation: '合肥南',
    specialties: ['小龙虾', '包公祠', '臭鳜鱼', '三河古镇', '李鸿章大杂烩'],
    tier: 2,
  },
  南昌: {
    name: '南昌',
    lat: 28.6820,
    lng: 115.8579,
    airportName: '南昌昌北',
    airportCode: 'KHN',
    trainStation: '南昌西',
    specialties: ['瓦罐汤', '滕王阁', '拌粉', '藜蒿炒腊肉', '白糖糕'],
    tier: 2,
  },
  福州: {
    name: '福州',
    lat: 26.0745,
    lng: 119.2965,
    airportName: '福州长乐',
    airportCode: 'FOC',
    trainStation: '福州南',
    specialties: ['鱼丸', '三坊七巷', '佛跳墙', '肉燕', '锅边糊'],
    tier: 2,
  },
  海口: {
    name: '海口',
    lat: 20.0440,
    lng: 110.1990,
    airportName: '海口美兰',
    airportCode: 'HAK',
    trainStation: '海口东',
    specialties: ['文昌鸡', '骑楼老街', '清补凉', '海南粉', '椰子饭'],
    tier: 2,
  },
  银川: {
    name: '银川',
    lat: 38.4872,
    lng: 106.2309,
    airportName: '银川河东',
    airportCode: 'INC',
    trainStation: '银川',
    specialties: ['手抓羊肉', '沙湖', '羊杂碎', '西夏王陵', '蒿子面'],
    tier: 3,
  },
  西宁: {
    name: '西宁',
    lat: 36.6171,
    lng: 101.7782,
    airportName: '西宁曹家堡',
    airportCode: 'XNN',
    trainStation: '西宁',
    specialties: ['手抓羊肉', '青海湖', '酿皮', '塔尔寺', '酸奶'],
    tier: 3,
  },
  徐州: {
    name: '徐州',
    lat: 34.2654,
    lng: 117.1849,
    airportName: '徐州观音',
    airportCode: 'XUZ',
    trainStation: '徐州东',
    specialties: ['地锅鸡', '云龙湖', '把子肉', '龟山汉墓', '烙馍'],
    tier: 3,
  },
};

// 所有城市名列表
export const allCityNames = Object.keys(cityDatabase);

// 航空公司列表
export const airlines = [
  '中国国航', '东方航空', '南方航空', '海南航空',
  '深圳航空', '四川航空', '厦门航空', '山东航空',
  '吉祥航空', '春秋航空', '成都航空', '西部航空',
  '长龙航空', '华夏航空', '天津航空', '首都航空',
];

// 计算两个城市之间的距离（公里），使用Haversine公式
export function calculateDistance(city1: string, city2: string): number {
  const c1 = cityDatabase[city1];
  const c2 = cityDatabase[city2];
  if (!c1 || !c2) return 1000;

  const R = 6371; // 地球半径（公里）
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.lat * Math.PI) / 180) *
      Math.cos((c2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// 找出适合作为中转的城市（距离出发地和目的地都不太远，且不是出发地/目的地）
export function findLayoverCities(from: string, to: string, count = 5): string[] {
  const directDistance = calculateDistance(from, to);
  const candidates: { city: string; detour: number }[] = [];

  for (const cityName of allCityNames) {
    if (cityName === from || cityName === to) continue;
    const city = cityDatabase[cityName];

    // 中转城市到出发地和目的地的距离之和
    const distFrom = calculateDistance(from, cityName);
    const distTo = calculateDistance(cityName, to);
    const totalDetour = distFrom + distTo;

    // 绕行比例 = (总绕行距离 - 直达距离) / 直达距离
    const detourRatio = directDistance > 0 ? (totalDetour - directDistance) / directDistance : 0;

    // 绕行比例在合理范围内（0.1 ~ 1.5），说明是合理的中转城市
    if (detourRatio > 0.05 && detourRatio < 1.6 && totalDetour < directDistance * 2.5) {
      candidates.push({ city: cityName, detour: detourRatio });
    }
  }

  // 按绕行比例排序，取前count个
  candidates.sort((a, b) => a.detour - b.detour);
  return candidates.slice(0, count).map((c) => c.city);
}
