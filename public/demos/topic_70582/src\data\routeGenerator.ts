import type { Route, Segment, Layover, RouteType } from '@shared/types';
import {
  cityDatabase,
  airlines,
  calculateDistance,
  findLayoverCities,
} from './cityDatabase';

// 伪随机数生成器（基于种子，保证同一路线每次生成结果一致）
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

// 从字符串生成种子
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// 生成航班号
function generateFlightNo(rand: () => number): string {
  const code = ['CA', 'MU', 'CZ', 'HU', 'ZH', '3U', 'MF', 'SC', 'HO', '9C'][Math.floor(rand() * 10)];
  const num = Math.floor(rand() * 9000) + 1000;
  return `${code}${num}`;
}

// 生成高铁车次号
function generateTrainNo(rand: () => number): string {
  const num = Math.floor(rand() * 900) + 100;
  return `G${num}`;
}

// 根据距离计算飞行时间（分钟），平均巡航速度800km/h + 起降30分钟
function calculateFlightTime(distance: number): number {
  return Math.round((distance / 800) * 60 + 30);
}

// 根据距离计算高铁时间（分钟），平均速度250km/h
function calculateTrainTime(distance: number): number {
  return Math.round((distance / 250) * 60 + 15);
}

// 根据距离计算机票价格
function calculateFlightPrice(distance: number, tier1: number, tier2: number, rand: () => number): number {
  // 基础价格 = 距离 * 每公里单价 + 机场建设费
  const basePrice = distance * 0.7 + 50;
  // 城市级别系数（一线城市更贵）
  const tierMultiplier = 1 + (tier1 - 1) * 0.1 + (tier2 - 1) * 0.1;
  // 随机波动（0.7 ~ 1.3）
  const variation = 0.7 + rand() * 0.6;
  return Math.round((basePrice * tierMultiplier * variation) / 10) * 10;
}

// 根据距离计算高铁价格
function calculateTrainPrice(distance: number, rand: () => number): number {
  // 高铁每公里约0.45元
  const basePrice = distance * 0.45;
  const variation = 0.9 + rand() * 0.2;
  return Math.round((basePrice * variation) / 10) * 10;
}

// 计算直达价格（比中转贵）
function calculateDirectPrice(distance: number, fromTier: number, toTier: number, rand: () => number): number {
  const basePrice = distance * 1.0 + 50;
  const tierMultiplier = 1 + (fromTier - 1) * 0.15 + (toTier - 1) * 0.15;
  const variation = 1.0 + rand() * 0.3;
  return Math.round((basePrice * tierMultiplier * variation) / 10) * 10;
}

// 计算直达时间
function calculateDirectTime(distance: number): number {
  if (distance < 800) return calculateFlightTime(distance);
  return calculateFlightTime(distance);
}

// 生成时间字符串
function timeToString(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// 生成中转小贴士
function generateTips(layoverCity: string, layoverType: 'airport' | 'station' | 'city', rand: () => number): string[] {
  const city = cityDatabase[layoverCity];
  const allTips: string[] = [];

  if (layoverType === 'airport') {
    allTips.push('航站楼有免费中转休息区');
    allTips.push('机场WiFi免费连接');
    allTips.push('行李可办理直挂');
    allTips.push('航站楼有行李寄存服务');
  } else if (layoverType === 'station') {
    allTips.push('站内便捷换乘通道');
    allTips.push('站台有便利店');
    allTips.push('建议提前取好联程票');
    allTips.push('换乘等待区有充电桩');
  } else {
    allTips.push('地铁站直达市区');
    allTips.push('行李可寄存在车站');
    allTips.push('市区交通便利');
  }

  // 添加城市特色小贴士
  if (city) {
    const food = city.specialties.find((s) => ['烤鸭', '火锅', '早茶', '肉夹馍', '热干面', '鸭血粉丝汤', '海鲜', '小笼包', '过桥米线', '鱼丸', '刀削面', '大盘鸡', '牛肉面', '酸汤鱼', '沙茶面', '茶颜悦色', '臭豆腐', '胡辣汤', '把子肉', '狗不理包子', '驴肉火烧', '老友粉', '瓦罐汤', '手抓羊肉', '酥油茶', '锅包肉', '焖子', '文昌鸡', '蟹黄包', '地锅鸡', '小龙虾', '拌粉'].includes(s));
    if (food) allTips.push(`推荐品尝${food}`);
    const attraction = city.specialties.find((s) => ['故宫', '外滩', '西湖', '黄鹤楼', '兵马俑', '夫子庙', '洪崖洞', '橘子洲', '栈桥', '石林', '鼓浪屿', '趵突泉', '滕王阁', '三坊七巷', '骑楼老街', '青海湖', '冰雪大世界', '星海广场', '天涯海角', '大召寺', '晋祠', '正定古城', '包公祠', '云龙湖', '青岩古镇', '大昭寺', '西夏王陵', '少林寺', '黄河铁桥', '白塔山', '亚龙湾'].includes(s));
    if (attraction) allTips.push(`可去${attraction}打卡`);
  }

  // 随机选3条
  const shuffled = allTips.sort(() => rand() - 0.5);
  return shuffled.slice(0, 3);
}

// 生成亮点
function generateHighlights(
  layoverCity: string,
  layoverDuration: number,
  savings: number,
  routeType: RouteType,
  rand: () => number
): string[] {
  const city = cityDatabase[layoverCity];
  const highlights: string[] = [];

  // 停留时间亮点
  if (layoverDuration <= 60) {
    highlights.push(`${layoverCity}快速中转仅${layoverDuration}分钟`);
  } else if (layoverDuration <= 240) {
    highlights.push(`${layoverCity}停留${Math.round(layoverDuration / 60)}小时`);
  } else {
    highlights.push(`${layoverCity}停留${Math.round(layoverDuration / 60)}小时可出站游玩`);
  }

  // 城市特色亮点
  if (city) {
    const food = city.specialties[0];
    if (food) highlights.push(`可品尝${food}`);
  }

  // 省钱亮点
  if (savings > 500) {
    highlights.push(`省${savings}元等于白赚一顿大餐`);
  } else if (savings > 300) {
    highlights.push(`省${savings}元吃顿好的`);
  } else {
    highlights.push(`比直达省${savings}元`);
  }

  // 路线类型亮点
  if (routeType === 'boomerang') {
    highlights.push('回旋镖航线额外游玩');
  } else if (routeType === 'same_train') {
    highlights.push('同站换乘无需提取行李');
  } else if (routeType === 'open_jaw') {
    highlights.push('开口程一次旅行多玩一城');
  }

  // 随机打乱并取3条
  return highlights.sort(() => rand() - 0.5).slice(0, 3);
}

// 生成单条中转路线
function generateRoute(
  from: string,
  to: string,
  layoverCity: string,
  routeType: RouteType,
  date: string,
  seed: number
): Route {
  const rand = seededRandom(seed);
  const fromCity = cityDatabase[from];
  const toCity = cityDatabase[to];
  const layoverCityInfo = cityDatabase[layoverCity];

  // 计算各段距离
  const dist1 = calculateDistance(from, layoverCity);
  const dist2 = calculateDistance(layoverCity, to);

  // 确定交通方式
  let transportType: 'flight' | 'train' = 'flight';
  if (routeType === 'same_train') {
    transportType = 'train';
  } else if (routeType === 'open_jaw') {
    // 开口程：一段飞机一段高铁
    transportType = 'flight';
  } else {
    // 短距离优先高铁，长距离优先飞机
    transportType = dist1 + dist2 > 1500 ? 'flight' : (rand() > 0.5 ? 'flight' : 'train');
  }

  // 生成第一段
  const seg1Duration = transportType === 'flight'
    ? calculateFlightTime(dist1)
    : calculateTrainTime(dist1);
  const seg1Price = transportType === 'flight'
    ? calculateFlightPrice(dist1, fromCity.tier, layoverCityInfo.tier, rand)
    : calculateTrainPrice(dist1, rand);

  // 生成第二段（开口程第二段用另一种交通方式）
  let transportType2 = transportType;
  if (routeType === 'open_jaw') {
    transportType2 = 'train';
  }

  const seg2Duration = transportType2 === 'flight'
    ? calculateFlightTime(dist2)
    : calculateTrainTime(dist2);
  const seg2Price = transportType2 === 'flight'
    ? calculateFlightPrice(dist2, layoverCityInfo.tier, toCity.tier, rand)
    : calculateTrainPrice(dist2, rand);

  // 中转停留时间
  let layoverDuration: number;
  let layoverType: 'airport' | 'station' | 'city';
  if (routeType === 'same_train') {
    layoverDuration = 15 + Math.floor(rand() * 30);
    layoverType = 'station';
  } else if (routeType === 'boomerang') {
    // 回旋镖：长停留（6-15小时），适合深度游
    const longOptions = [
      360 + Math.floor(rand() * 180),   // 6-9小时 市区游
      540 + Math.floor(rand() * 180),   // 9-12小时 深度游
      720 + Math.floor(rand() * 360),   // 12-18小时 过夜深度游
    ];
    layoverDuration = longOptions[Math.floor(rand() * longOptions.length)];
    layoverType = 'city';
  } else if (routeType === 'open_jaw') {
    // 开口程：中长停留（4-10小时），适合市区游
    const midOptions = [
      240 + Math.floor(rand() * 120),   // 4-6小时
      360 + Math.floor(rand() * 180),   // 6-9小时 市区游
      540 + Math.floor(rand() * 120),   // 9-11小时
    ];
    layoverDuration = midOptions[Math.floor(rand() * midOptions.length)];
    layoverType = 'city';
  } else {
    // 经典中转：多种停留时长混合
    const mixedOptions = [
      60 + Math.floor(rand() * 90),     // 1-2.5小时
      150 + Math.floor(rand() * 90),    // 2.5-4小时
      240 + Math.floor(rand() * 120),   // 4-6小时
    ];
    layoverDuration = mixedOptions[Math.floor(rand() * mixedOptions.length)];
    layoverType = rand() > 0.5 ? 'airport' : 'station';
  }

  // 计算出发时间（随机在6:00-12:00之间）
  const startMinutes = 360 + Math.floor(rand() * 360);
  const seg1Departure = startMinutes;
  const seg1Arrival = seg1Departure + seg1Duration;
  const seg2Departure = seg1Arrival + layoverDuration;
  const seg2Arrival = seg2Departure + seg2Duration;

  const totalPrice = seg1Price + seg2Price;
  const totalDuration = seg1Duration + layoverDuration + seg2Duration;

  // 直达价格和时间
  const directDistance = calculateDistance(from, to);
  const directPrice = calculateDirectPrice(directDistance, fromCity.tier, toCity.tier, rand);
  const directDuration = calculateDirectTime(directDistance);

  const savings = directPrice - totalPrice;
  const extraTime = totalDuration - directDuration;

  // 类型标签
  const typeLabels: Record<RouteType, string> = {
    boomerang: '回旋镖航线',
    open_jaw: '开口程方案',
    same_train: '同车接续',
    normal: '经典中转',
    nunchaku: '双截棍航线',
  };

  // 生成段信息
  const segments: Segment[] = [
    {
      id: `seg-${seed}-1`,
      type: transportType,
      from: transportType === 'flight' ? fromCity.airportName : fromCity.trainStation,
      to: transportType === 'flight' ? layoverCityInfo.airportName : layoverCityInfo.trainStation,
      departureTime: timeToString(seg1Departure),
      arrivalTime: timeToString(seg1Arrival),
      duration: seg1Duration,
      price: seg1Price,
      carrier: transportType === 'flight'
        ? airlines[Math.floor(rand() * airlines.length)]
        : '中国铁路',
      ...(transportType === 'flight' ? { flightNo: generateFlightNo(rand) } : { trainNo: generateTrainNo(rand) }),
    },
    {
      id: `seg-${seed}-2`,
      type: transportType2,
      from: transportType2 === 'flight' ? layoverCityInfo.airportName : layoverCityInfo.trainStation,
      to: transportType2 === 'flight' ? toCity.airportName : toCity.trainStation,
      departureTime: timeToString(seg2Departure),
      arrivalTime: timeToString(seg2Arrival),
      duration: seg2Duration,
      price: seg2Price,
      carrier: transportType2 === 'flight'
        ? airlines[Math.floor(rand() * airlines.length)]
        : '中国铁路',
      ...(transportType2 === 'flight' ? { flightNo: generateFlightNo(rand) } : { trainNo: generateTrainNo(rand) }),
    },
  ];

  const layovers: Layover[] = [
    {
      city: layoverCity,
      duration: layoverDuration,
      type: layoverType,
      tips: generateTips(layoverCity, layoverType, rand),
    },
  ];

  return {
    id: `route-${from}-${to}-${layoverCity}-${routeType}-${seed}`,
    type: routeType,
    typeLabel: typeLabels[routeType],
    from,
    to,
    date,
    totalPrice,
    totalDuration,
    segments,
    layovers,
    savings,
    extraTime,
    highlights: generateHighlights(layoverCity, layoverDuration, savings, routeType, rand),
    rating: Math.round((4.0 + rand() * 1.0) * 10) / 10, // 4.0-5.0
    reviewCount: Math.floor(rand() * 300) + 20,
    directPrice,
    directDuration,
  };
}

// 主函数：根据出发地和目的地生成中转方案
export function generateRoutes(from: string, to: string, date: string): Route[] {
  // 如果出发地或目的地不在数据库中，返回空数组
  if (!cityDatabase[from] || !cityDatabase[to]) {
    return [];
  }

  // 如果出发地和目的地相同，返回空数组
  if (from === to) {
    return [];
  }

  // 找到合适的中转城市
  const layoverCities = findLayoverCities(from, to, 6);

  if (layoverCities.length === 0) {
    return [];
  }

  const routes: Route[] = [];
  const baseSeed = stringToSeed(`${from}-${to}-${date}`);

  // 为每个中转城市生成不同类型的路线
  const routeTypes: RouteType[] = ['boomerang', 'open_jaw', 'same_train', 'normal'];

  layoverCities.forEach((layoverCity, index) => {
    // 每个城市生成1-2条路线
    const numRoutes = index < 3 ? 2 : 1;
    for (let i = 0; i < numRoutes; i++) {
      const routeType = routeTypes[(index + i) % routeTypes.length];
      const seed = baseSeed + index * 100 + i * 10;
      const route = generateRoute(from, to, layoverCity, routeType, date, seed);
      routes.push(route);
    }
  });

  // 按价格排序
  routes.sort((a, b) => a.totalPrice - b.totalPrice);

  return routes;
}
