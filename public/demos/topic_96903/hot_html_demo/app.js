/**
 * 热点圈 HTML Demo - 应用逻辑
 * 移植自 Flutter hot_app，使用 vanilla JS 复刻 Provider 状态管理模式
 */

// ============ 工具函数（对应 core/utils/） ============
const GeoUtils = {
  distanceInKm(lat1, lon1, lat2, lon2) {
    const r = 6371.0;
    const toRad = (d) => (d * Math.PI) / 180.0;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },
  // 方位角（从 lat1,lon1 到 lat2,lon2，正北为 0°，顺时针）
  bearing(lat1, lon1, lat2, lon2) {
    const toRad = (d) => (d * Math.PI) / 180.0;
    const toDeg = (r) => (r * 180) / Math.PI;
    const φ1 = toRad(lat1), φ2 = toRad(lat2);
    const Δλ = toRad(lon2 - lon1);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  },
};

const FormatUtils = {
  formatHeat(h) {
    if (h >= 10000) return (h / 10000).toFixed(1) + '万';
    if (h >= 1000) return (h / 1000).toFixed(1) + 'K';
    return Math.floor(h).toString();
  },
  formatCount(c) {
    if (c >= 10000) return (c / 10000).toFixed(1) + '万';
    if (c >= 1000) return (c / 1000).toFixed(1) + 'K';
    return c.toString();
  },
};

const TimeUtils = {
  determineStatus(startTime, endTime, lastVideoTime, isPermanent) {
    if (isPermanent) return 'permanent';
    const now = Date.now();
    if (lastVideoTime && now - lastVideoTime < 60 * 60 * 1000) return 'ongoing';
    if (startTime && now < startTime) return 'impending';
    if (endTime && now > endTime) {
      if ((now - endTime) / (1000 * 60 * 60) <= 12) return 'justEnded';
    }
    return 'ongoing';
  },
  formatTimeRemaining(target) {
    const diff = target - Date.now();
    if (diff < 0) return '即将开始';
    const days = Math.floor(diff / 86400000);
    if (days > 0) {
      const d = new Date(target);
      if (days === 1 && d.getDate() === new Date().getDate() + 1) {
        return `明天${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
      return `${days}天后`;
    }
    const hours = Math.floor(diff / 3600000);
    if (hours > 0) return `${hours}小时后`;
    const mins = Math.floor(diff / 60000);
    if (mins > 0) return `${mins}分钟后`;
    return '即将开始';
  },
  formatRelativeTime(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    return `${Math.floor(diff / 2592000000)}个月前`;
  },
};

// ============ 日期工具（行程页专用） ============
const DateUtils = {
  pad(n) { return String(n).padStart(2, '0'); },
  toDateStr(d) {
    return `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}-${this.pad(d.getDate())}`;
  },
  parseDateStr(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  },
  addDays(n) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return d;
  },
  todayStr() { return this.toDateStr(new Date()); },
  diffDays(a, b) {
    const da = this.parseDateStr(a);
    const db = this.parseDateStr(b);
    return Math.round((db - da) / 86400000);
  },
  weekLabel(d) {
    return ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  },
  friendlyDate(s) {
    const d = this.parseDateStr(s);
    const diff = this.diffDays(this.todayStr(), s);
    if (diff === 0) return '今天';
    if (diff === 1) return '明天';
    if (diff === 2) return '后天';
    if (diff === -1) return '昨天';
    return `${d.getMonth() + 1}月${d.getDate()}日 周${this.weekLabel(d)}`;
  },
};

// 出行方式定义（含图标、速度 km/h）
const TRAVEL_MODES = {
  walk:    { icon: '🚶', label: '步行', speed: 5 },
  bike:    { icon: '🚲', label: '骑行', speed: 15 },
  car:     { icon: '🚗', label: '驾车', speed: 30 },
  transit: { icon: '🚌', label: '公交', speed: 20 },
  metro:   { icon: '🚇', label: '地铁', speed: 35 },
};

// 根据距离自动推荐出行方式
function suggestMode(distKm) {
  if (distKm < 1) return 'walk';
  if (distKm < 3) return 'bike';
  if (distKm < 8) return 'metro';
  if (distKm < 20) return 'transit';
  return 'car';
}

// ============ Mock 数据（对应 feed_provider.dart / map_provider.dart） ============
const now = Date.now();
const HOUR = 3600000;
const DAY = 86400000;

const EVENT_TYPES = { sporadic: '偶发性', regular: '规律性', permanent: '常驻' };

// 生成热点相关背景图（竖屏 16:9 适配视频流）
function img(prompt, size = 'portrait_16_9') {
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;
}

const events = [
  {
    id: 'mock_2',
    name: '🍢 怀远夜市·银川深夜美食地标',
    description: '辣糊糊烤羊肉串排队中 · 现场直播',
    lat: 38.4856, lon: 106.2345,
    address: '西夏区怀远西路',
    startTime: null, endTime: null,
    type: 'regular',
    heat: 12400, heatSpeed: 120,
    videoCount: 3, likeCount: 4500, commentCount: 1800, shareCount: 620, boostCount: 1200,
    createdAt: now - 2 * HOUR,
    isPromoted: false,
    // 每日固定营业时段
    dailyHours: { start: '18:00', end: '23:30' },
    image: img('bustling northwest china night market, lamb skewer grills with smoke, red lanterns, neon food signs, crowded alley, warm ambient lighting, people walking, photorealistic, cinematic'),
    videos: [
      { title: '烤羊肉串摊位实拍', image: img('close up lamb skewers grilling on charcoal, flames and smoke, vendor flipping skewers, northwest china night market, warm glow, photorealistic, cinematic'), publisherId: 'u11', likeCount: 2800 },
      { title: '辣糊糊冒菜特写', image: img('close up spicy red stew pot bubbling, chili oil, skewers dipping in broth, steam rising, chinese street food, photorealistic, cinematic'), publisherId: 'u4', likeCount: 1200 },
      { title: '夜市全景航拍', image: img('aerial view of crowded night market alley from above, rows of food stalls with red lanterns, warm light trails, people walking, photorealistic, cinematic'), publisherId: 'u1', likeCount: 500 },
    ],
  },
  {
    id: 'mock_5',
    name: '⚽ 国足U17锦标赛·贺兰山体育场',
    description: '中国队对阵日本队 · 现场球迷助威',
    lat: 38.4900, lon: 106.2300,
    address: '贺兰山体育场',
    startTime: null, endTime: null,
    type: 'sporadic',
    heat: 15200, heatSpeed: 200,
    videoCount: 3, likeCount: 5800, commentCount: 2400, shareCount: 890, boostCount: 2100,
    createdAt: now - 30 * 60000,
    isPromoted: false,
    // 比赛日固定时段
    eventHours: { start: '19:30', end: '21:30' },
    ticketRequired: true,
    ticketOptions: [
      { id: 'vip',    name: 'VIP前排席',  price: 380, desc: '前排近距离观赛' },
      { id: 'a',      name: 'A类看台',    price: 180,  desc: '中线位置视野佳' },
      { id: 'b',      name: 'B类看台',    price: 80,   desc: '球门后方' },
      { id: 'c',      name: 'C类看台',    price: 30,   desc: '上层远观区' },
    ],
    image: img('youth football match in stadium, young players in red jersey action on pitch, crowded cheering fans in stands, green field, dramatic sports lighting, photorealistic, cinematic'),
    videos: [
      { title: '中国队进球瞬间！', image: img('football goal moment, young player in red jersey scoring, goalkeeper diving, ball in net, stadium blur background, dramatic sports lighting, photorealistic, cinematic'), publisherId: 'u3', likeCount: 3200 },
      { title: '球迷看台助威', image: img('football stadium crowd cheering, fans waving flags and scarves, red and yellow colors, passionate supporters, arms raised, dramatic lighting, photorealistic, cinematic'), publisherId: 'u5', likeCount: 1800 },
      { title: '赛后球员谢场', image: img('young football players in red jersey walking to sidelines after match, clapping to fans, stadium lights behind, sweat on faces, photorealistic, cinematic'), publisherId: 'u7', likeCount: 800 },
    ],
  },
  {
    id: 'mock_1',
    name: '🎵 周杰伦嘉年华世界巡回演唱会·银川站',
    description: '粉丝在场馆外集结 · 气氛热烈',
    lat: 38.4930, lon: 106.2450,
    address: '银川奥体中心体育馆',
    startTime: now + (DAY + 19 * HOUR + 30 * 60000),
    endTime: now + (DAY + 22 * HOUR),
    type: 'sporadic',
    heat: 9800, heatSpeed: 0,
    videoCount: 3, likeCount: 2100, commentCount: 520, shareCount: 340, boostCount: 720,
    createdAt: now - 6 * HOUR,
    isPromoted: false,
    ticketRequired: true,
    ticketOptions: [
      { id: 'vip',   name: 'VIP内场',     price: 2080, desc: '内场前排 赠周边' },
      { id: 'rock',  name: '摇滚区',      price: 1580, desc: '站立区 气氛最燃' },
      { id: 'a',     name: 'A区看台',     price: 980,  desc: '正面看台' },
      { id: 'b',     name: 'B区看台',     price: 580,  desc: '侧面看台' },
      { id: 'c',     name: 'C区看台',     price: 380,  desc: '山顶远观' },
    ],
    image: img('jay chou concert stage performance, singer silhouette holding microphone, colorful stage spotlights, raised hands crowd, atmospheric haze, dramatic lighting, photorealistic, cinematic'),
    videos: [
      { title: '舞台全景·七里香开场', image: img('concert stage wide shot, singer silhouette center stage, massive led screen behind, colorful spotlights, fog effects, large arena, photorealistic, cinematic'), publisherId: 'u10', likeCount: 1500 },
      { title: '万人大合唱·稻香', image: img('concert crowd from stage perspective, thousands of fans with phone flashlights, sea of lights, raised arms, warm golden glow, emotional atmosphere, photorealistic, cinematic'), publisherId: 'u6', likeCount: 480 },
      { title: '场馆外粉丝应援', image: img('fans gathered outside concert venue before show, holding light banners and posters, excited crowd, evening twilight, stadium lights, photorealistic, cinematic'), publisherId: 'u8', likeCount: 120 },
    ],
  },
  {
    id: 'mock_3',
    name: '🌅 览山公园·日落观景打卡',
    description: '贺兰山落日绝佳机位 · 错过等明天',
    lat: 38.5020, lon: 106.2410,
    address: '金凤区览山公园',
    startTime: new Date().setHours(18, 30, 0, 0),
    endTime: new Date().setHours(20, 30, 0, 0),
    type: 'sporadic',
    heat: 8100, heatSpeed: 45,
    videoCount: 3, likeCount: 1800, commentCount: 430, shareCount: 280, boostCount: 510,
    createdAt: now - 4 * HOUR,
    isPromoted: false,
    image: img('sunset viewing park on hill, helan mountain silhouette in distance, golden hour sky with orange clouds, people watching sunset on steps, panoramic view, photorealistic, cinematic'),
    videos: [
      { title: '贺兰山日落延时摄影', image: img('golden hour sunset behind helan mountain range, layered mountain silhouettes, dramatic orange and purple sky, time-lapse clouds, photorealistic, cinematic'), publisherId: 'u7', likeCount: 1100 },
      { title: '观景台阶梯人潮', image: img('crowded park staircase at sunset, people sitting on stone steps watching horizon, silhouettes against golden sky, casual atmosphere, photorealistic, cinematic'), publisherId: 'u9', likeCount: 500 },
      { title: '日落金光剪影打卡', image: img('silhouette of person with arms spread facing sunset on hilltop, golden backlight, helan mountain outline, warm glow, photorealistic, cinematic'), publisherId: 'u6', likeCount: 200 },
    ],
  },
  {
    id: 'mock_4',
    name: '🎬 镇北堡西部影城·大话西游取景地',
    description: '穿越西北江湖 · 网红打卡圣地',
    lat: 38.6820, lon: 105.9870,
    address: '西夏区镇北堡',
    startTime: null, endTime: null,
    type: 'permanent',
    heat: 6500, heatSpeed: 10,
    videoCount: 3, likeCount: 1200, commentCount: 310, shareCount: 180, boostCount: 350,
    createdAt: now - 7 * DAY,
    isPromoted: true,
    image: img('chinese western film studio, ancient desert fortress mud walls, sandy ground, tourists in costume, northwest china desert setting, blue sky, photorealistic, cinematic'),
    videos: [
      { title: '清城城门穿越打卡', image: img('ancient chinese fortress gate, tall mud brick archway, sandy ground, tourists walking through, desert northwest china, blue sky, photorealistic, cinematic'), publisherId: 'u6', likeCount: 680 },
      { title: '紫霞仙子经典机位', image: img('woman in ancient chinese costume standing at fortress wall, pink dress flowing, desert background, cinematic film still, golden hour, photorealistic'), publisherId: 'u8', likeCount: 340 },
      { title: '银川街市集风貌', image: img('old western town street set, wooden storefronts, dusty road, horses hitched, film extras in period costume, desert light, photorealistic, cinematic'), publisherId: 'u9', likeCount: 180 },
    ],
  },
  {
    id: 'mock_6',
    name: '🍷 漫葡小镇·贺兰山东麓红酒文化',
    description: '葡萄酒品鉴+温泉+演出 · 周末限 定',
    lat: 38.4180, lon: 106.0520,
    address: '贺兰山东麓葡萄酒产业带',
    startTime: now + (2 * DAY + 10 * HOUR),
    endTime: now + (2 * DAY + 21 * HOUR),
    type: 'sporadic',
    heat: 4200, heatSpeed: 0,
    videoCount: 2, likeCount: 680, commentCount: 180, shareCount: 95, boostCount: 140,
    createdAt: now - 12 * HOUR,
    isPromoted: false,
    image: img('wine culture town, vineyard rows with grapevines, modern winery buildings, outdoor wine tasting terrace, warm afternoon sunlight, string lights, photorealistic, cinematic'),
    videos: [
      { title: '酒窖品鉴现场', image: img('wine cellar interior, oak barrels lining walls, sommelier pouring red wine into glass, warm dim lighting, rustic atmosphere, photorealistic, cinematic'), publisherId: 'u4', likeCount: 420 },
      { title: '葡萄园日落风光', image: img('vineyard rows at golden hour, ripe purple grapes on vines, helan mountain in background, warm sunlight, wine country landscape, photorealistic, cinematic'), publisherId: 'u1', likeCount: 260 },
    ],
  },
  {
    // 远距离·东北约16km：扩大到20km范围时进入榜单，冲击Top3
    id: 'mock_8',
    name: '🎧 黄河宿集·电子音乐节',
    description: '百大DJ现场打碟 · 露天电音派对',
    lat: 38.5800, lon: 106.3800,
    address: '黄河宿集·野奢营地',
    startTime: now + 3 * HOUR,
    endTime: now + 8 * HOUR,
    type: 'sporadic',
    heat: 13500, heatSpeed: 150,
    videoCount: 3, likeCount: 3600, commentCount: 980, shareCount: 420, boostCount: 880,
    createdAt: now - 90 * 60000,
    isPromoted: false,
    ticketRequired: true,
    ticketOptions: [
      { id: 'ga',   name: '通票', price: 288, desc: '全天畅玩' },
      { id: 'vip',  name: 'VIP区', price: 688, desc: '前排+酒水' },
    ],
    image: img('outdoor electronic music festival at night, massive led stage, dj silhouette, colorful lasers and lights, raised hands crowd, smoke effects, photorealistic, cinematic'),
    videos: [
      { title: 'DJ开场炸裂混剪', image: img('dj on stage with headphones, hands in air, massive led screen behind, colorful laser beams, night festival, smoke haze, photorealistic, cinematic'), publisherId: 'u3', likeCount: 1800 },
      { title: '万人蹦迪全景', image: img('huge crowd dancing at outdoor edm festival, hands raised, stage lights, laser show, evening sky, energetic atmosphere, photorealistic, cinematic'), publisherId: 'u5', likeCount: 1100 },
      { title: '营地夜景航拍', image: img('aerial view of luxury camping site at night, glowing tents, music festival stage in distance, warm lights, dark desert, photorealistic, cinematic'), publisherId: 'u1', likeCount: 700 },
    ],
  },
  {
    // 远距离·西北约25km：扩大到30km范围时进入榜单，超越原Top1成为新Top1
    id: 'mock_7',
    name: '🎆 阅海湾·元宵大型烟花秀',
    description: '10万发烟花齐放 · 全城瞩目跨年级盛景',
    lat: 38.6800, lon: 106.0800,
    address: '阅海湾中央商务区水岸',
    startTime: now + 5 * HOUR,
    endTime: now + 6 * HOUR,
    type: 'sporadic',
    heat: 18800, heatSpeed: 260,
    videoCount: 3, likeCount: 7200, commentCount: 3100, shareCount: 1200, boostCount: 2600,
    createdAt: now - 20 * 60000,
    isPromoted: false,
    image: img('massive fireworks show over city waterfront, colorful bursts filling night sky, reflection on water, skyscrapers silhouette, crowd watching, spectacular display, photorealistic, cinematic'),
    videos: [
      { title: '10万发烟花齐放瞬间', image: img('spectacular fireworks finale, hundreds of colorful bursts lighting up night sky, huge chrysanthemum shells, waterfront reflection, photorealistic, cinematic'), publisherId: 'u3', likeCount: 4200 },
      { title: '水岸观众惊叹实拍', image: img('crowd watching fireworks from waterfront, faces lit up by colorful lights, phones recording, reflections on water, awe expressions, photorealistic, cinematic'), publisherId: 'u6', likeCount: 2000 },
      { title: '无人机航拍全景', image: img('aerial drone view of fireworks show over city skyline at night, colorful bursts above skyscrapers, river winding through city, grand scale, photorealistic, cinematic'), publisherId: 'u1', likeCount: 1000 },
    ],
  },
];

// 爆发状态（对应 heat_provider.dart 初始值）
const burstingIds = new Set(['mock_2', 'mock_5', 'mock_7', 'mock_8']);

// 焦点列表（银川及宁夏周边城市）
const focusOptions = [
  { name: '📍 当前位置', lat: 38.4872, lon: 106.2309 },
  { name: '🏙️ 石嘴山·大武口', lat: 39.0150, lon: 106.3760 },
  { name: '🌆 吴忠·利通区', lat: 37.9986, lon: 106.1989 },
  { name: '🏖️ 中卫·沙坡头', lat: 37.5149, lon: 105.1966 },
];

// 发布者数据池（视频级，每个视频对应一个发布者）
const PUBLISHERS = [
  { id: 'u1', name: '城市猎手', avatar: '🦊' },
  { id: 'u2', name: '美食探店王', avatar: '👨‍🍳' },
  // u3：认证账号（蓝色V）—— 现场直击（文旅/赛事官方合作媒体）
  { id: 'u3', name: '现场直击', avatar: '📸', verified: true, verifyType: '官方媒体' },
  { id: 'u4', name: '夜生活达人', avatar: '🦉' },
  { id: 'u5', name: '运动狂热', avatar: '🏀' },
  { id: 'u6', name: '文艺青年', avatar: '🎨' },
  { id: 'u7', name: '街拍小哥', avatar: '📷' },
  { id: 'u8', name: '潮流前线', avatar: '🎭' },
  // 认证账号（蓝色V）—— 银川文旅（政府部门）
  { id: 'u9', name: '银川文旅', avatar: '🏛️', verified: true, verifyType: '文旅部门' },
  // 认证账号（蓝色V）—— 演唱会主办方
  { id: 'u10', name: '杰伦巡演主办方', avatar: '🎤', verified: true, verifyType: '演出主办' },
  // 认证账号（蓝色V）—— 怀远夜市官方
  { id: 'u11', name: '怀远夜市官方', avatar: '🍢', verified: true, verifyType: '商户官方' },
];
// 已关注列表（预设关注 u3）
const followedPublishers = new Set(['u3']);

// 根据热点索引和视频索引获取发布者
function getPublisher(eventIndex, videoIndex) {
  return PUBLISHERS[(eventIndex * 3 + videoIndex) % PUBLISHERS.length];
}

// 根据 ID 查找发布者
function getPublisherById(id) {
  return PUBLISHERS.find((p) => p.id === id) || PUBLISHERS[0];
}

// 获取热点的第 idx 个视频（无则用热点兜底图）
function getVideo(ev, videoIndex) {
  if (ev.videos && ev.videos[videoIndex]) return ev.videos[videoIndex];
  return { title: ev.name, image: ev.image, publisherId: null, likeCount: ev.likeCount };
}

// 抖音风格分享箭头 SVG（向右箭头 + 左侧三条短横线）
const SHARE_ARROW_SVG = `<svg class="share-arrow" viewBox="0 0 48 48" width="28" height="28" fill="none">
  <path d="M28 8 L42 24 L28 40 L28 32 L12 32 L12 16 L28 16 Z" fill="#fff"/>
  <rect x="4"  y="18" width="5" height="12" rx="2" fill="#fff"/>
</svg>`;

// 热度天花板（用于柱形条填充比例）
const HEAT_CEILING = 20000;

// ============ 行程数据（独立于"想去"，更结构化） ============
// visitTime 非 null 表示已打卡（模拟"用户当天去过自动打卡"）
const trips = [
  // 今天：夜市已打卡（模拟用户当天 19:20 到达）
  { id: 't1', eventId: 'mock_2', date: DateUtils.todayStr(), startH: 19, endH: 22, mode: 'walk',    visitH: 19 },
  // 今天：览山公园日落待打卡
  { id: 't2', eventId: 'mock_3', date: DateUtils.todayStr(), startH: 18, endH: 20, mode: 'metro',   visitH: null },
  // 明天：周杰伦演唱会
  { id: 't3', eventId: 'mock_1', date: DateUtils.toDateStr(DateUtils.addDays(1)), startH: 19, endH: 22, mode: 'metro',   visitH: null, purchasedTicket: null },
  // 后天：漫葡小镇
  { id: 't4', eventId: 'mock_6', date: DateUtils.toDateStr(DateUtils.addDays(2)), startH: 10, endH: 21, mode: 'car',     visitH: null, purchasedTicket: null },
  // 大后天：西部影城
  { id: 't5', eventId: 'mock_4', date: DateUtils.toDateStr(DateUtils.addDays(3)), startH: 14, endH: 17, mode: 'car',    visitH: null, purchasedTicket: null },
  // 5 天后（超出快捷条范围，需用日历查看）：国足U17
  { id: 't6', eventId: 'mock_5', date: DateUtils.toDateStr(DateUtils.addDays(5)), startH: 19, endH: 21, mode: 'transit', visitH: null, purchasedTicket: null },
];

// ============ 足迹数据（打卡记录，含用户上传的内容） ============
// content: null 表示未上传；{type, text} 表示上传过视频/图文
const footprints = [
  // 今天：怀远夜市
  { id: 'f1', eventId: 'mock_2', date: DateUtils.todayStr(), visitH: 19,
    content: { type: 'video', text: '怀远夜市太热闹了！排队半小时终于吃到了传说中的辣糊糊 🤤', duration: 23 } },
  // 3 天前：西部影城
  { id: 'f2', eventId: 'mock_4', date: DateUtils.toDateStr(DateUtils.addDays(-3)), visitH: 15,
    content: { type: 'image', text: '镇北堡影城穿越感拉满，紫霞仙子打卡机位绝了 🎬✨' } },
  // 7 天前：览山公园
  { id: 'f3', eventId: 'mock_3', date: DateUtils.toDateStr(DateUtils.addDays(-7)), visitH: 19,
    content: null },
  // 12 天前：国足U17
  { id: 'f4', eventId: 'mock_5', date: DateUtils.toDateStr(DateUtils.addDays(-12)), visitH: 20,
    content: { type: 'video', text: 'U17 现场气氛炸裂！小将绝杀，全场球迷沸腾 ⚽🔥', duration: 45 } },
  // 18 天前：怀远夜市
  { id: 'f5', eventId: 'mock_2', date: DateUtils.toDateStr(DateUtils.addDays(-18)), visitH: 21,
    content: null },
  // 25 天前：漫葡小镇
  { id: 'f6', eventId: 'mock_6', date: DateUtils.toDateStr(DateUtils.addDays(-25)), visitH: 14,
    content: { type: 'image', text: '漫葡小镇品酒+温泉一日游，贺兰山东麓的马瑟兰惊艳 🍷✨' } },
  // 45 天前（3个月 tab 可见）：西部影城
  { id: 'f7', eventId: 'mock_4', date: DateUtils.toDateStr(DateUtils.addDays(-45)), visitH: 16,
    content: null },
  // 80 天前：览山公园
  { id: 'f8', eventId: 'mock_3', date: DateUtils.toDateStr(DateUtils.addDays(-80)), visitH: 19,
    content: { type: 'video', text: '览山公园看贺兰山落日太震撼，拍了完整一段 🌅', duration: 60 } },
  // 120 天前（全部 tab 可见）：国足U17
  { id: 'f9', eventId: 'mock_5', date: DateUtils.toDateStr(DateUtils.addDays(-120)), visitH: 21,
    content: null },
];

// ============ 消息数据（系统/他人给用户的消息） ============
const messages = [
  { id: 'm1', type: 'trip', icon: '📋', title: '行程提醒',
    text: '您关注的「周杰伦嘉年华演唱会」将于明天 19:30 开唱，记得准时前往银川奥体中心体育馆。',
    time: now - 30 * 60000, read: false },
  { id: 'm2', type: 'ticket', icon: '🎫', title: '购票提醒',
    text: '您购买的「国足U17锦标赛」A类看台票已出票，请前往「我的行程」查看电子票二维码。',
    time: now - 2 * HOUR, read: false },
  { id: 'm3', type: 'trip', icon: '📍', title: '打卡提醒',
    text: '「怀远夜市」距离您仅 0.4km，今晚 18:00 开市，去看看有什么新热点吧！',
    time: now - 5 * HOUR, read: true },
  { id: 'm4', type: 'system', icon: '🔔', title: '系统消息',
    text: '欢迎来到热点圈！发现身边正在发生的热点，不错过任何精彩瞬间。',
    time: now - DAY, read: true },
];

// ============ 发布设置数据（AI 滤镜模板 + 模拟上传视频） ============
const AI_FILTERS = [
  { id: 'none',    name: '原图',   icon: '🎞️' },
  { id: 'cartoon', name: '卡通',   icon: '🎨' },
  { id: 'fairy',   name: '仙境',   icon: '✨' },
  { id: 'oil',     name: '油画',   icon: '🖼️' },
  { id: 'retro',   name: '复古',   icon: '📽️' },
  { id: 'cyber',   name: '赛博',   icon: '🌃' },
];

// 模拟「从相册选择」上传的视频
const MOCK_UPLOAD_VIDEO = {
  image: img('first person view walking through crowded northwest china night market alley, neon food signs, warm lantern light, people passing by, handheld phone camera footage, photorealistic, cinematic'),
  duration: 23,
  // AI 识别到的热点（可能不准确，用户可改）
  detectedEventId: 'mock_2',
};

// 足迹动画节点位置（百分比，按时间顺序排列成蜿蜒路径）
const FP_NODE_POSITIONS = [
  { x: 12, y: 78 },
  { x: 30, y: 45 },
  { x: 50, y: 28 },
  { x: 70, y: 52 },
  { x: 88, y: 30 },
];

// ============ 全局状态（对应 providers/） ============
const state = {
  currentTab: 'feed',
  focus: { name: '📍 当前位置', lat: 38.4872, lon: 106.2309 },
  wantToGo: new Set(),
  currentEventIndex: 0,
  currentVideoIndices: {},
  currentTripDate: DateUtils.todayStr(), // 行程页选中的日期
  calendarViewMonth: new Date(),          // 日历弹层当前查看月份
  miniMapCollapsed: false,
  footprintRange: 30,                     // 足迹弹层查看范围（天数）
  mapRange: 10,                           // 发现范围（km），1-30，首页与地图页共用
  profileMsgTab: 'message',               // 我的页消息选项卡：message | comment
  fansCount: 128,                         // 粉丝数（mock）
  publishDraft: null,                     // 发布设置草稿（上传后编辑中）
};

// 首页当前可见热点（按 state.mapRange 距离过滤后），渲染与滑动逻辑均以此为准
let visibleFeedEvents = [];

// ============ DOM 引用 ============
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const feedVertical = $('#feed-vertical');
const mapMarkers = $('#map-markers');
const mapList = $('#map-list');
const profileBody = $('#profile-body');
const publishSheet = $('#publish-sheet');
const toastEl = $('#toast');
const tripList = $('#trip-list');
const calendarBar = $('#calendar-bar');
const tripDateTitle = $('#trip-date-title');
const tmmCanvas = $('#tmm-canvas');
const tmmSummary = $('#tmm-summary');
const calendarGrid = $('#calendar-grid');
const calTitle = $('#cal-title');
const footprintModalList = $('#footprint-modal-list');
const contentSheet = $('#content-sheet');
const ticketSheet = $('#ticket-sheet');
const paySheet = $('#pay-sheet');

// ============ Toast ============
let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1200);
}

// ============ 时间状态标签（对应 feed_page.dart） ============
// 将时间戳转为 HH:MM 字符串
function tsToHM(ts) {
  const d = new Date(ts);
  return `${DateUtils.pad(d.getHours())}:${DateUtils.pad(d.getMinutes())}`;
}

// 详细时间显示：包含日期 + 时段
function getTimeLabel(ev) {
  const isPermanent = ev.type === 'permanent';

  // 1. 常驻（咖啡馆）
  if (isPermanent) {
    return { text: '📍 常驻', cls: 'time-end' };
  }

  // 2. 每日固定时段（夜市）
  if (ev.dailyHours) {
    const now = new Date();
    const curHM = `${DateUtils.pad(now.getHours())}:${DateUtils.pad(now.getMinutes())}`;
    const inRange = curHM >= ev.dailyHours.start && curHM <= ev.dailyHours.end;
    return {
      text: `📅 每日 ${ev.dailyHours.start}-${ev.dailyHours.end} ${inRange ? '· 🔴 营业中' : '· 待营业'}`,
      cls: inRange ? 'time-live' : 'time-soon',
    };
  }

  // 3. 比赛日固定时段（CBA）
  if (ev.eventHours) {
    const now = new Date();
    const curHM = `${DateUtils.pad(now.getHours())}:${DateUtils.pad(now.getMinutes())}`;
    const inRange = curHM >= ev.eventHours.start && curHM <= ev.eventHours.end;
    return {
      text: `📅 今日 ${ev.eventHours.start}-${ev.eventHours.end} ${inRange ? '· 🔴 比赛中' : '· 待开赛'}`,
      cls: inRange ? 'time-live' : 'time-soon',
    };
  }

  // 4. 有明确 startTime/endTime（演唱会/灯光秀/市集）
  if (ev.startTime && ev.endTime) {
    const status = TimeUtils.determineStatus(ev.startTime, ev.endTime, null, false);
    const dateStr = DateUtils.friendlyDate(DateUtils.toDateStr(new Date(ev.startTime)));
    const timeRange = `${tsToHM(ev.startTime)}-${tsToHM(ev.endTime)}`;
    switch (status) {
      case 'impending':
        return { text: `📅 ${dateStr} ${timeRange} · 待开始`, cls: 'time-soon' };
      case 'ongoing':
        return { text: `📅 ${dateStr} ${timeRange} · 🔴 进行中`, cls: 'time-live' };
      case 'justEnded':
        return { text: `📅 ${dateStr} ${timeRange} · 已结束`, cls: 'time-end' };
    }
  }

  // 兜底
  return { text: '🔴 进行中', cls: 'time-live' };
}

// ============ 迷你地图 SVG（极飞风格：暗底亮路 + 路径动画） ============
function renderFeedMiniMap(ev) {
  // 目标点方位（相对当前焦点）
  const b = GeoUtils.bearing(state.focus.lat, state.focus.lon, ev.lat, ev.lon);
  const rad = (b * Math.PI) / 180;
  const R = 30; // 目标点到用户点的距离（SVG 单位）
  // 用户点固定在 (50,56)，目标点按方位角放在圆周
  const tx = Number((50 + R * Math.sin(rad)).toFixed(1));
  const ty = Number((56 - R * Math.cos(rad)).toFixed(1));
  // 折线中转点：先沿水平道路走到目标 x，再垂直转向目标 y（模拟真实路网 L 形行进）
  // 当目标偏左时先走水平段，偏右时同理；保持 L 形折线
  const mx = tx;        // 中转点 x = 目标 x
  const my = 56;        // 中转点 y = 用户 y（先水平走）
  return `
    <div class="mini-map" data-action="goto-map">
      <svg viewBox="-6 -6 112 112" class="mm-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <clipPath id="mm-clip"><circle cx="50" cy="50" r="49"/></clipPath>
        </defs>
        <g clip-path="url(#mm-clip)">
          <rect x="-6" y="-6" width="112" height="112" fill="#0c1620"/>
          <!-- 道路网（极飞风格：暗底 + 青蓝道路） -->
          <g class="mm-roads" fill="none" stroke-linecap="round">
            <path d="M-6,28 Q40,33 106,26" stroke="#2a4a66" stroke-width="2"/>
            <path d="M-6,74 Q50,70 106,77" stroke="#2a4a66" stroke-width="2"/>
            <path d="M26,-6 Q33,50 28,106" stroke="#2a4a66" stroke-width="2"/>
            <path d="M74,-6 Q67,50 77,106" stroke="#2a4a66" stroke-width="2"/>
            <path d="M-6,50 L106,50" stroke="#3a6080" stroke-width="2.5" opacity="0.7"/>
            <path d="M50,-6 L50,106" stroke="#3a6080" stroke-width="2.5" opacity="0.7"/>
          </g>
          <!-- 地标方块（建筑） -->
          <g class="mm-landmarks">
            <rect x="17" y="17" width="7" height="7" rx="1" fill="#1a2a38" stroke="#2a4050" stroke-width="0.5"/>
            <rect x="76" y="19" width="6" height="6" rx="1" fill="#1a2a38" stroke="#2a4050" stroke-width="0.5"/>
            <rect x="19" y="78" width="6" height="6" rx="1" fill="#1a2a38" stroke="#2a4050" stroke-width="0.5"/>
            <rect x="77" y="76" width="7" height="7" rx="1" fill="#1a2a38" stroke="#2a4050" stroke-width="0.5"/>
          </g>
          <!-- 折线路径动画（用户→中转→目标，1秒流动） -->
          <path class="mm-route" d="M50,56 L${mx},${my} L${tx},${ty}"/>
          <!-- 用户点（蓝） + 脉冲 -->
          <circle class="mm-user-pulse" cx="50" cy="56" r="4"/>
          <circle class="mm-user" cx="50" cy="56" r="3.5"/>
          <!-- 目标点（红，热点地） + 脉冲 -->
          <circle class="mm-target-pulse" cx="${tx}" cy="${ty}" r="4"/>
          <circle class="mm-target" cx="${tx}" cy="${ty}" r="3.5"/>
        </g>
        <!-- 圆边描边 -->
        <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(58,96,128,0.5)" stroke-width="1"/>
        <!-- NSEW 方位标记（中心落在 r=49 圆线上） -->
        <g class="mm-dirs">
          <text x="50" y="1" text-anchor="middle" dominant-baseline="middle">N</text>
          <text x="50" y="99" text-anchor="middle" dominant-baseline="middle">S</text>
          <text x="1" y="50" text-anchor="middle" dominant-baseline="middle">W</text>
          <text x="99" y="50" text-anchor="middle" dominant-baseline="middle">E</text>
        </g>
      </svg>
    </div>
  `;
}

// ============ Feed 页渲染 ============
function renderFeed() {
  feedVertical.innerHTML = '';
  // 按发现范围过滤热点（首页与地图页共用 state.mapRange）
  visibleFeedEvents = events.filter((ev) =>
    GeoUtils.distanceInKm(state.focus.lat, state.focus.lon, ev.lat, ev.lon) <= state.mapRange
  );
  // 按热度降序排名：范围变化时名次会随之改变（远处更热门的热点可能进入榜单反超）
  const sortedByHeat = [...visibleFeedEvents].sort((a, b) => b.heat - a.heat);

  if (visibleFeedEvents.length === 0) {
    feedVertical.innerHTML = `<div class="feed-empty">📡 当前 ${state.mapRange}km 范围内暂无热点<br><small>试试扩大发现范围</small></div>`;
    return;
  }

  visibleFeedEvents.forEach((ev, idx) => {
    const page = document.createElement('div');
    page.className = `feed-page bg-${idx % 4}`;
    page.dataset.eventIndex = idx;
    page.dataset.eventId = ev.id;

    const videoCount = Math.max(1, ev.videoCount);
    const isIgniting = ev.heatSpeed >= 100; // 引爆中
    const isRising = ev.heatSpeed > 0 && !isIgniting; // 上涨中
    const fillPercent = Math.min(100, (ev.heat / HEAT_CEILING) * 100);
    // 名次基于当前可见热点集计算：Top3 才算"火爆"（涨满 100%），4 名及以后按真实比例填充
    const rank = sortedByHeat.findIndex((e) => e.id === ev.id) + 1;
    const isTop3 = rank <= 3;
    const dist = GeoUtils.distanceInKm(state.focus.lat, state.focus.lon, ev.lat, ev.lon);

    // 第一个视频的数据（图片/标题/发布者/点赞）
    const firstVideo = getVideo(ev, 0);
    const publisher = getPublisherById(firstVideo.publisherId);
    const followed = followedPublishers.has(publisher.id);

    page.innerHTML = `
      <div class="heat-bar ${isIgniting ? 'igniting' : ''} ${isRising ? 'rising' : ''} ${isTop3 ? 'topfire' : ''}" data-event-id="${ev.id}">
        ${isTop3 ? `<div class="heat-bar-top-label">TOP${rank} 火爆</div>` : ''}
        <div class="heat-bar-value">🔥 ${FormatUtils.formatHeat(ev.heat)}</div>
        <div class="heat-bar-track">
          <div class="heat-bar-fill" data-target="${isTop3 ? 100 : fillPercent}" style="height: 60%">
            <div class="heat-bar-stripes"></div>
          </div>
          ${isIgniting ? `
            <div class="heat-bar-flames">
              <span style="animation-delay:0s">🔥</span>
              <span style="animation-delay:0.3s">🔥</span>
              <span style="animation-delay:0.6s">🔥</span>
            </div>
          ` : ''}
        </div>
        ${isRising ? '<div class="heat-bar-rising-icon">↑</div>' : ''}
        ${isTop3 ? `
          <div class="heat-bar-fireworks">
            <span class="fw fw1"></span>
            <span class="fw fw2"></span>
            <span class="fw fw3"></span>
            <span class="fw fw4"></span>
            <span class="fw fw5"></span>
            <span class="fw fw6"></span>
          </div>
        ` : ''}
      </div>
      <div class="video-bg" style="background-image:url('${firstVideo.image}')">
        <div class="play-icon">▶</div>
        <div class="ev-title">${firstVideo.title}</div>
        <div class="ev-meta">${FormatUtils.formatHeat(ev.heat)} 🔥 · 视角 1/${videoCount}</div>
        <div class="ev-desc">${ev.description || ''}</div>
      </div>
      <div class="gradient-overlay"></div>
      <div class="action-sidebar" data-event-id="${ev.id}">
        <div class="publisher-block" data-publisher-id="${publisher.id}">
          <div class="publisher-avatar">${publisher.avatar}</div>
          ${publisher.verified ? `<div class="pub-vbadge" title="${publisher.verifyType || '已认证'}">V</div>` : ''}
          <button class="follow-btn ${followed ? 'followed' : ''}" aria-label="关注">${followed ? '✓' : '+'}</button>
        </div>
        ${renderActionBtn('', '🤍', FormatUtils.formatCount(firstVideo.likeCount), 'like')}
        ${renderActionBtn('', '💬', FormatUtils.formatCount(ev.commentCount), 'comment')}
        ${renderActionBtn('share-btn', SHARE_ARROW_SVG, FormatUtils.formatCount(ev.shareCount), 'share')}
      </div>
      <div class="wantogo-btn ${state.wantToGo.has(ev.id) ? 'active' : ''}" data-event-id="${ev.id}">
        <span class="wg-icon">${state.wantToGo.has(ev.id) ? '✓' : '📍'}</span>
        <span class="wg-text">${state.wantToGo.has(ev.id) ? '已加入行程' : '想去'}</span>
      </div>
      <div class="hotspot-info-card">
        <div class="info-card-top">
          <div class="name">${ev.name}</div>
        </div>
        <div class="info-meta">
          <span class="meta-tag heat-mini">
            <span class="heat-mini-bar" style="width:${Math.min(100, (ev.heat / HEAT_CEILING) * 100)}%"></span>
            🔥 ${FormatUtils.formatHeat(ev.heat)}
          </span>
          <span class="meta-tag ${getTimeLabel(ev).cls}">${getTimeLabel(ev).text}</span>
          <span class="meta-tag">📍 ${ev.address}</span>
          <span class="meta-tag">📏 ${dist.toFixed(1)}km</span>
        </div>
      </div>
      ${renderFeedMiniMap(ev)}
      ${videoCount > 1 ? `
        <div class="same-indicator">
          <div class="dots">${Array.from({ length: videoCount }, (_, i) => `<div class="d ${i === 0 ? 'active' : ''}"></div>`).join('')}</div>
          <div class="hint">◀ 滑动查看同热点${videoCount}个视频 ▶</div>
        </div>
      ` : ''}
    `;

    // 热度柱形条点击 → 仅闪光反馈（热度由后台综合计算，前端不可修改）
    page.querySelector('.heat-bar').addEventListener('click', () => {
      const fill = page.querySelector('.heat-bar-fill');
      fill.classList.remove('boost-flash');
      void fill.offsetWidth; // 强制 reflow 重启动画
      fill.classList.add('boost-flash');
      setTimeout(() => fill.classList.remove('boost-flash'), 500);
      showToast('🔥 热度由浏览/点赞/发布量综合计算');
    });

    // 关注按钮
    page.querySelector('.follow-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const pubBlock = page.querySelector('.publisher-block');
      const pubId = pubBlock.dataset.publisherId;
      const btn = e.currentTarget;
      if (followedPublishers.has(pubId)) {
        followedPublishers.delete(pubId);
        btn.classList.remove('followed');
        btn.textContent = '+';
        showToast('已取消关注');
      } else {
        followedPublishers.add(pubId);
        btn.classList.add('followed');
        btn.textContent = '✓';
        showToast('✅ 关注成功');
      }
    });

    // 互动栏（点赞/评论/分享）
    page.querySelector('.action-sidebar').addEventListener('click', (e) => {
      const btn = e.target.closest('.action-btn');
      if (!btn) return;
      handleAction(btn.dataset.action, ev, btn);
    });

    // 想去按钮（热点级，独立于侧边栏）
    page.querySelector('.wantogo-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      if (state.wantToGo.has(ev.id)) {
        state.wantToGo.delete(ev.id);
        btn.classList.remove('active');
        btn.querySelector('.wg-icon').textContent = '📍';
        btn.querySelector('.wg-text').textContent = '想去';
        removeTripByEvent(ev.id);
        updateTripBadge();
        showToast('📍 已取消想去');
      } else {
        state.wantToGo.add(ev.id);
        btn.classList.add('active');
        btn.querySelector('.wg-icon').textContent = '✓';
        btn.querySelector('.wg-text').textContent = '已加入行程';
        addTripFromEvent(ev);
        updateTripBadge();
        showTripTip();
      }
      renderProfile();
    });

    const mmEl = page.querySelector('.mini-map');
    if (mmEl) mmEl.addEventListener('click', () => switchTab('map'));
    else console.warn('[mini-map] 未找到元素，innerHTML 长度=', page.innerHTML.length);

    feedVertical.appendChild(page);

    // 触发热度柱上涨动画：从初始 8% 上涨到目标高度（Top3 涨满 100%）
    const fillEl = page.querySelector('.heat-bar-fill');
    if (fillEl) {
      const target = Number(fillEl.dataset.target) || 0;
      // 延迟 120ms 让初始 8% 先渲染，再 transition 到目标值
      setTimeout(() => {
        fillEl.style.height = target + '%';
      }, 120);
    }
  });
}

function renderActionBtn(cls, icon, label, action) {
  return `
    <div class="action-btn ${cls}" data-action="${action}">
      <div class="circle">${icon}</div>
      <div class="label">${label}</div>
    </div>
  `;
}

function handleAction(action, ev, btn) {
  switch (action) {
    case 'like':
      btn.classList.add('active');
      btn.querySelector('.circle').textContent = '❤️';
      showToast('❤️ 已点赞');
      break;
    case 'comment':
      showToast('💬 查看评论');
      break;
    case 'share':
      showToast('📤 已分享');
      break;
  }
}

// ============ 行程管理 ============
function findEvent(id) { return events.find((e) => e.id === id); }

function addTripFromEvent(ev) {
  // 默认安排到明天 19:00，出行方式按距离推荐
  const dist = GeoUtils.distanceInKm(state.focus.lat, state.focus.lon, ev.lat, ev.lon);
  const mode = suggestMode(dist);
  trips.push({
    id: 't_' + Date.now(),
    eventId: ev.id,
    date: DateUtils.toDateStr(DateUtils.addDays(1)),
    startH: 19, endH: 21,
    mode,
    visitH: null,
  });
}

function removeTripByEvent(eventId) {
  const i = trips.findIndex((t) => t.eventId === eventId && t.id.startsWith('t_'));
  if (i >= 0) trips.splice(i, 1);
}

// 计算预计到达时间（基于上一行程结束时间 + 距离/速度 + 30 分钟缓冲）
function computeEta(trip, prevTrip) {
  const ev = findEvent(trip.eventId);
  if (!ev) return trip.startH;
  if (!prevTrip) return trip.startH;
  const prevEv = findEvent(prevTrip.eventId);
  if (!prevEv) return trip.startH;
  const dist = GeoUtils.distanceInKm(prevEv.lat, prevEv.lon, ev.lat, ev.lon);
  const speed = TRAVEL_MODES[trip.mode].speed;
  const travelH = dist / speed;
  const bufferH = 0.5; // 30 分钟缓冲
  const eta = prevTrip.endH + travelH + bufferH;
  return Math.min(eta, trip.startH + 0.5);
}

// 当天行程（按开始时间排序）
function tripsOfDate(dateStr) {
  return trips
    .filter((t) => t.date === dateStr)
    .sort((a, b) => a.startH - b.startH);
}

// ============ 行程页渲染 ============
function renderTrip() {
  renderCalendarBar();
  renderTripList();
  renderMiniMap();
}

function renderCalendarBar() {
  const labels = ['今天', '明天', '后天', '大后天'];
  calendarBar.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const d = DateUtils.addDays(i);
    const dateStr = DateUtils.toDateStr(d);
    const count = tripsOfDate(dateStr).length;
    const chip = document.createElement('div');
    chip.className = 'cal-chip' + (dateStr === state.currentTripDate ? ' active' : '');
    chip.innerHTML = `
      <div class="dow">${labels[i]} · 周${DateUtils.weekLabel(d)}</div>
      <div class="day">${d.getDate()}</div>
      <div class="badge ${count === 0 ? 'empty' : ''}">${count > 0 ? count + '项' : '·'}</div>
    `;
    chip.addEventListener('click', () => {
      state.currentTripDate = dateStr;
      renderTrip();
    });
    calendarBar.appendChild(chip);
  }
}

function renderTripList() {
  const dateStr = state.currentTripDate;
  const list = tripsOfDate(dateStr);
  const friendly = DateUtils.friendlyDate(dateStr);

  tripDateTitle.innerHTML = `<strong>${friendly}</strong> · ${list.length} 项行程`;

  // 检测时间冲突
  let conflictHtml = '';
  if (list.length >= 2) {
    for (let i = 0; i < list.length - 1; i++) {
      if (list[i].endH > list[i + 1].startH) {
        conflictHtml = `<div class="trip-conflict">⚠️ 有 ${list.length} 个热点时间重叠，请合理安排</div>`;
        break;
      }
    }
  }

  if (list.length === 0) {
    tripList.innerHTML = `
      <div class="trip-empty">
        <div class="big">🗺️</div>
        ${friendly}还没有行程<br/>
        在首页点击 📑想去 按钮添加行程<br/>
        或点击右上角 📅 选择其他日期
      </div>
    `;
    return;
  }

  tripList.innerHTML = conflictHtml + list.map((trip, idx) => {
    const ev = findEvent(trip.eventId);
    if (!ev) return '';
    const dist = GeoUtils.distanceInKm(state.focus.lat, state.focus.lon, ev.lat, ev.lon);
    const mode = TRAVEL_MODES[trip.mode];
    const prev = idx > 0 ? list[idx - 1] : null;
    const eta = computeEta(trip, prev);
    const etaStr = `${Math.floor(eta).toString().padStart(2, '0')}:${Math.round((eta % 1) * 60).toString().padStart(2, '0')}`;
    const checkedIn = trip.visitH !== null;
    const today = DateUtils.todayStr();
    // 当天 + 已过开始时间 + 用户到达过 → 已打卡
    const isToday = trip.date === today;
    const autoCheckable = isToday && new Date().getHours() >= trip.startH;

    // 票务标签：需要付费入场的热点显示"票"
    const needTicket = !!ev.ticketRequired;
    const purchased = !!trip.purchasedTicket;
    const ticketTag = needTicket
      ? `<span class="trip-tag ticket ${purchased ? 'purchased' : ''}" data-action="ticket" data-trip-id="${trip.id}">🎫 ${purchased ? '已购票' : '购票'}</span>`
      : '';

    return `
      <div class="trip-item ${checkedIn ? 'checked-in' : ''}" data-trip-id="${trip.id}">
        <div class="trip-time">
          <div class="h">${String(trip.startH).padStart(2, '0')}</div>
          <div class="m">:${String(0).padStart(2, '0')}</div>
        </div>
        <div class="trip-main">
          <div class="name">${ev.name}</div>
          <div class="addr">${ev.address} · ${dist.toFixed(1)}km</div>
          <div class="tags">
            <span class="trip-tag mode">${mode.icon} ${mode.label}</span>
            <span class="trip-tag eta">⏱️ ${etaStr} 到达</span>
            <span class="trip-tag">${String(trip.startH).padStart(2, '0')}:00 - ${String(trip.endH).padStart(2, '0')}:00</span>
            ${ticketTag}
          </div>
        </div>
        <div class="trip-status" data-trip-id="${trip.id}">
          <div class="checkin-badge ${checkedIn ? 'done' : ''}">${checkedIn ? '✓' : '○'}</div>
          <div class="checkin-label ${checkedIn ? 'done' : ''}">${checkedIn ? '已打卡' : (autoCheckable ? '点击打卡' : '待打卡')}</div>
        </div>
      </div>
    `;
  }).join('');

  // 绑定票标签点击 → 打开购票弹层
  tripList.querySelectorAll('.trip-tag.ticket').forEach((tag) => {
    tag.addEventListener('click', (e) => {
      e.stopPropagation();
      const trip = trips.find((t) => t.id === tag.dataset.tripId);
      if (!trip) return;
      const ev = findEvent(trip.eventId);
      if (!ev || !ev.ticketRequired) return;
      if (trip.purchasedTicket) {
        showToast('该行程已购票');
        return;
      }
      openTicketSheet(trip, ev);
    });
  });

  // 绑定打卡点击
  tripList.querySelectorAll('.trip-status').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const trip = trips.find((t) => t.id === el.dataset.tripId);
      if (!trip) return;
      if (trip.visitH !== null) {
        showToast('该行程已打卡');
        return;
      }
      const today = DateUtils.todayStr();
      if (trip.date !== today) {
        showToast('非今日行程，无法打卡');
        return;
      }
      if (new Date().getHours() < trip.startH) {
        showToast('行程尚未开始');
        return;
      }
      // 模拟"用户当天到达此地" → 自动打卡，并生成足迹记录
      trip.visitH = new Date().getHours();
      const existFp = footprints.find((x) => x.eventId === trip.eventId && x.date === trip.date);
      if (!existFp) {
        footprints.unshift({
          id: 'f_' + Date.now(),
          eventId: trip.eventId,
          date: trip.date,
          visitH: trip.visitH,
          content: null,
        });
      }
      showToast('✅ 打卡成功！');
      renderTrip();
      renderProfile();
    });
  });
}

// ============ 浮动微型地图 ============
function renderMiniMap() {
  const list = tripsOfDate(state.currentTripDate);
  const miniMap = $('#trip-mini-map');
  miniMap.classList.toggle('collapsed', state.miniMapCollapsed);

  if (list.length === 0) {
    tmmCanvas.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3);font-size:12px;">当日无行程</div>';
    tmmSummary.innerHTML = '';
    return;
  }

  // 计算各点经纬度范围，映射到 canvas 坐标
  const evs = list.map((t) => findEvent(t.eventId)).filter(Boolean);
  const lats = evs.map((e) => e.lat);
  const lons = evs.map((e) => e.lon);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const pad = 0.25; // 内边距比例
  const latRange = (maxLat - minLat) || 0.01;
  const lonRange = (maxLon - minLon) || 0.01;

  // canvas 尺寸（CSS 像素）
  const W = 100, H = 100; // 百分比坐标系

  const points = evs.map((ev, i) => {
    const x = pad + ((ev.lon - minLon) / lonRange) * (1 - 2 * pad);
    const y = 1 - (pad + ((ev.lat - minLat) / latRange) * (1 - 2 * pad));
    return { x: x * W, y: y * H, ev, trip: list[i], idx: i };
  });

  // 节点 + 连线
  let html = '';
  // 先画连线
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const done = a.trip.visitH !== null;
    html += `<div class="tmm-line ${done ? 'done' : ''}" style="
      left:${a.x}%;top:${a.y}%;width:${len}%;
      transform:rotate(${angle}deg);
    "></div>`;
  }
  // 再画节点
  points.forEach((p, i) => {
    const done = p.trip.visitH !== null;
    const eta = computeEta(p.trip, i > 0 ? list[i - 1] : null);
    const etaStr = `${String(Math.floor(eta)).padStart(2, '0')}:${String(Math.round((eta % 1) * 60)).padStart(2, '0')}`;
    html += `
      <div class="tmm-node ${done ? 'done' : ''}" style="left:${p.x}%;top:${p.y}%;">
        <div class="pin">${i + 1}</div>
        <div class="pin-time">${etaStr}</div>
      </div>
    `;
  });
  tmmCanvas.innerHTML = html;

  // 汇总：总行程数 / 总距离 / 总时长
  let totalDist = 0;
  for (let i = 0; i < evs.length; i++) {
    const from = i === 0 ? state.focus : { lat: evs[i - 1].lat, lon: evs[i - 1].lon };
    totalDist += GeoUtils.distanceInKm(from.lat, from.lon, evs[i].lat, evs[i].lon);
  }
  const totalH = list.reduce((s, t) => s + (t.endH - t.startH), 0);
  const checkedCount = list.filter((t) => t.visitH !== null).length;
  tmmSummary.innerHTML = `
    <div class="sum-item"><span>行程</span><span class="v accent">${list.length}</span></div>
    <div class="sum-item"><span>已打卡</span><span class="v">${checkedCount}/${list.length}</span></div>
    <div class="sum-item"><span>总距离</span><span class="v">${totalDist.toFixed(1)}km</span></div>
    <div class="sum-item"><span>总时长</span><span class="v">${totalH}h</span></div>
  `;
}

// ============ 日历弹层 ============
function renderCalendarModal() {
  const viewDate = state.calendarViewMonth;
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  calTitle.textContent = `${year}年${month + 1}月`;

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay(); // 0=周日
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = DateUtils.todayStr();

  let html = '';
  // 前置空格
  for (let i = 0; i < startWeekday; i++) {
    html += '<div class="cal-cell empty"></div>';
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${DateUtils.pad(month + 1)}-${DateUtils.pad(d)}`;
    const cellDate = new Date(year, month, d);
    cellDate.setHours(0, 0, 0, 0);
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === state.currentTripDate;
    const isPast = cellDate < new Date(todayStr);
    const hasTrip = trips.some((t) => t.date === dateStr);
    const classes = [
      'cal-cell',
      isToday ? 'today' : '',
      isSelected ? 'selected' : '',
      isPast ? 'past' : '',
      hasTrip ? 'has-trip' : '',
    ].filter(Boolean).join(' ');
    html += `<div class="${classes}" data-date="${dateStr}">${d}</div>`;
  }
  calendarGrid.innerHTML = html;

  calendarGrid.querySelectorAll('.cal-cell:not(.empty)').forEach((cell) => {
    cell.addEventListener('click', () => {
      state.currentTripDate = cell.dataset.date;
      $('#calendar-modal').classList.remove('show');
      renderTrip();
    });
  });
}

// ============ 地图页渲染 ============
// 热度分档：引爆(>=10K) / 热门(>=5K) / 普通(<5K) —— 大小与亮度递减
function heatTier(heat) {
  if (heat >= 10000) return 'explode';
  if (heat >= 5000) return 'hot';
  return 'normal';
}

// 真实地图风格背景：街道网格 + 主干道 + 地标 + 绿地 + 河流
function renderMapBg() {
  return `
    <svg viewBox="0 0 390 520" preserveAspectRatio="xMidYMid slice" class="map-bg-svg">
      <!-- 底色：地图浅暗灰绿 -->
      <rect width="390" height="520" fill="#1a2128"/>

      <!-- 绿地公园（贺兰山片区 + 公园） -->
      <path d="M0,40 Q60,30 120,45 L130,90 Q80,100 0,95 Z" fill="#1f2e25" opacity="0.8"/>
      <ellipse cx="300" cy="380" rx="60" ry="40" fill="#1f2e25" opacity="0.7"/>
      <path d="M250,460 Q300,450 360,465 L360,520 L240,520 Z" fill="#1f2e25" opacity="0.6"/>

      <!-- 河流（唐徕渠） -->
      <path d="M0,260 Q80,250 140,275 Q220,305 300,285 Q360,275 390,290"
            stroke="#1a3a52" stroke-width="14" fill="none" stroke-linecap="round" opacity="0.8"/>
      <path d="M0,260 Q80,250 140,275 Q220,305 300,285 Q360,275 390,290"
            stroke="#2a5a7a" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.5"/>

      <!-- 次级街道网格（细灰线） -->
      <g stroke="#2a3338" stroke-width="1" fill="none" opacity="0.6">
        <line x1="0" y1="120" x2="390" y2="120"/>
        <line x1="0" y1="180" x2="390" y2="180"/>
        <line x1="0" y1="350" x2="390" y2="350"/>
        <line x1="0" y1="420" x2="390" y2="420"/>
        <line x1="60" y1="0" x2="60" y2="520"/>
        <line x1="130" y1="0" x2="130" y2="520"/>
        <line x1="200" y1="0" x2="200" y2="520"/>
        <line x1="270" y1="0" x2="270" y2="520"/>
        <line x1="340" y1="0" x2="340" y2="520"/>
      </g>

      <!-- 主干道（黄白粗线，有发光感） -->
      <g fill="none" stroke-linecap="round">
        <!-- 横向主干道 -->
        <path d="M0,220 L390,220" stroke="#4a4030" stroke-width="8"/>
        <path d="M0,220 L390,220" stroke="#c8a85a" stroke-width="3" opacity="0.85"/>
        <!-- 纵向主干道 -->
        <path d="M100,0 L100,520" stroke="#4a4030" stroke-width="8"/>
        <path d="M100,0 L100,520" stroke="#c8a85a" stroke-width="3" opacity="0.85"/>
        <!-- 斜向主干道 -->
        <path d="M0,80 L390,300" stroke="#3a3530" stroke-width="6"/>
        <path d="M0,80 L390,300" stroke="#a89050" stroke-width="2.5" opacity="0.7"/>
      </g>

      <!-- 地标方块（建筑群） -->
      <g fill="#222a32" stroke="#3a4248" stroke-width="0.6">
        <rect x="105" y="125" width="22" height="14" rx="1"/>
        <rect x="135" y="125" width="14" height="22" rx="1"/>
        <rect x="205" y="185" width="18" height="18" rx="1"/>
        <rect x="65" y="355" width="24" height="14" rx="1"/>
        <rect x="275" y="425" width="20" height="16" rx="1"/>
        <rect x="345" y="125" width="14" height="20" rx="1"/>
        <rect x="205" y="425" width="16" height="14" rx="1"/>
      </g>

      <!-- 地标图标（著名地点） -->
      <g class="map-landmark" font-size="11" font-weight="700">
        <!-- 览山公园 -->
        <text x="40" y="60" fill="#7a9a7a" text-anchor="middle">⛰</text>
        <text x="40" y="72" fill="#5a7a5a" font-size="7" text-anchor="middle">贺兰山</text>
        <!-- 体育场 -->
        <text x="160" y="220" fill="#c8a85a" text-anchor="middle">🏟</text>
        <text x="160" y="232" fill="#8a7a3a" font-size="7" text-anchor="middle">体育场</text>
        <!-- 奥体中心 -->
        <text x="300" y="220" fill="#c8a85a" text-anchor="middle">🎤</text>
        <text x="300" y="232" fill="#8a7a3a" font-size="7" text-anchor="middle">奥体</text>
        <!-- 影视城 -->
        <text x="60" y="400" fill="#a88a5a" text-anchor="middle">🎬</text>
        <text x="60" y="412" fill="#7a5a3a" font-size="7" text-anchor="middle">影城</text>
        <!-- 夜市 -->
        <text x="220" y="360" fill="#d88a5a" text-anchor="middle">🍢</text>
        <text x="220" y="372" fill="#8a5a3a" font-size="7" text-anchor="middle">夜市</text>
      </g>

      <!-- 比例尺 -->
      <g transform="translate(20,490)">
        <line x1="0" y1="0" x2="60" y2="0" stroke="#fff" stroke-width="2" opacity="0.7"/>
        <line x1="0" y1="-3" x2="0" y2="3" stroke="#fff" stroke-width="2" opacity="0.7"/>
        <line x1="60" y1="-3" x2="60" y2="3" stroke="#fff" stroke-width="2" opacity="0.7"/>
        <text x="30" y="15" fill="#fff" font-size="8" text-anchor="middle" opacity="0.7">2km</text>
      </g>
    </svg>
  `;
}

function renderMap() {
  // 注入地图背景
  const bgLayer = $('#map-bg-layer');
  if (bgLayer) bgLayer.innerHTML = renderMapBg();

  // 按发现范围过滤热点（与首页共用 state.mapRange）
  const visible = events.filter((ev) =>
    GeoUtils.distanceInKm(state.focus.lat, state.focus.lon, ev.lat, ev.lon) <= state.mapRange
  );

  const positions = [
    { top: '18%', left: '12%' },
    { top: '32%', left: '60%' },
    { top: '48%', left: '24%' },
    { top: '58%', left: '72%' },
    { top: '72%', left: '40%' },
    { top: '78%', left: '16%' },
  ];
  mapMarkers.innerHTML = visible.map((ev, i) => {
    const tier = heatTier(ev.heat);
    const bursting = burstingIds.has(ev.id);
    return `
    <div class="map-marker tier-${tier} ${bursting ? 'bursting' : ''}"
         style="top:${positions[i % positions.length].top};left:${positions[i % positions.length].left}"
         data-event-id="${ev.id}">
      <div class="pin">
        <div class="pin-core">🔥</div>
        <div class="pin-glow"></div>
      </div>
      <div class="pin-name">${ev.name}</div>
      <div class="pin-heat">${FormatUtils.formatHeat(ev.heat)}</div>
    </div>
    `;
  }).join('');

  // 按热度排序的列表（仅当前范围内）
  const sorted = [...visible].sort((a, b) => b.heat - a.heat);
  mapList.innerHTML = sorted.map((ev, i) => `
    <div class="map-list-item">
      <div class="rank ${i < 3 ? 't' + (i + 1) : ''}">${i + 1}</div>
      <div class="info">
        <div class="name">${ev.name}</div>
        <div class="sub">${ev.address}</div>
      </div>
      <div class="heat">${FormatUtils.formatHeat(ev.heat)} 🔥</div>
    </div>
  `).join('');

  $$('.map-marker').forEach((marker) => {
    marker.addEventListener('click', () => {
      const rect = marker.getBoundingClientRect();
      const canvasRect = $('#map-canvas').getBoundingClientRect();
      const cx = rect.left - canvasRect.left + rect.width / 2;
      const cy = rect.top - canvasRect.top + rect.height / 2;
      showParticles(cx, cy);
    });
  });
}

function showParticles(cx, cy) {
  const canvas = $('#map-canvas');
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.textContent = '🔥';
    p.style.left = cx - 12 + 'px';
    p.style.top = cy - 12 + 'px';
    const dx = (Math.random() - 0.5) * 120;
    const dy = -40 - Math.random() * 80;
    p.style.setProperty('--dx', dx + 'px');
    p.style.setProperty('--dy', dy + 'px');
    canvas.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }
}

// ============ 足迹筛选与渲染 ============
// 按天数范围筛选足迹（最近 N 天），按日期倒序
function footprintsInRange(days) {
  const cutoff = DateUtils.toDateStr(DateUtils.addDays(-(days - 1)));
  return footprints
    .filter((f) => f.date >= cutoff)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.visitH - a.visitH));
}

// 渲染个人页足迹卡片（含动画 + 缩略列表）
function renderFootprintCard() {
  const recent = footprintsInRange(30);
  const contentCount = recent.filter((f) => f.content).length;

  // 动画节点：取最近 5 条（不足则全取），映射到蜿蜒路径位置
  const animNodes = recent.slice(0, 5).reverse(); // 最早→最近，呈现行进方向
  const positions = FP_NODE_POSITIONS;

  // 构建路径连线 HTML
  let pathHtml = '';
  for (let i = 0; i < animNodes.length - 1 && i < positions.length - 1; i++) {
    const a = positions[i], b = positions[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    pathHtml += `<div class="fp-path-seg" style="
      left:${a.x}%;top:${a.y}%;width:${len}%;
      --rot:${angle}deg;
      transform:rotate(${angle}deg);
      animation-delay:${0.15 * i + 0.2}s;
    "></div>`;
  }

  // 节点 HTML
  const nodesHtml = animNodes.map((f, i) => {
    const ev = findEvent(f.eventId);
    if (!ev) return '';
    const pos = positions[i] || positions[positions.length - 1];
    const hasContent = !!f.content;
    return `
      <div class="fp-node ${hasContent ? 'has-content' : ''}"
           style="left:${pos.x}%;top:${pos.y}%;animation-delay:${0.15 * i + 0.3}s;"
           data-footprint-id="${f.id}">
        <div class="paw">${hasContent ? '🎬' : '🐾'}</div>
        <div class="paw-label">${ev.name.replace(/^\S+\s/, '').slice(0, 6)}</div>
      </div>
    `;
  }).join('');

  // 漂浮爪印（装饰）
  const floatPaws = [0, 1, 2, 3].map((i) => `
    <div class="fp-float-paw" style="
      left:${20 + i * 20}%;top:${60 + (i % 2) * 20}%;
      animation-delay:${i * 0.8}s;
    ">🐾</div>
  `).join('');

  // 缩略列表（最近 30 天全部，横向滚动）
  const thumbsHtml = recent.map((f) => {
    const ev = findEvent(f.eventId);
    if (!ev) return '';
    const hasContent = !!f.content;
    const d = DateUtils.parseDateStr(f.date);
    return `
      <div class="fp-thumb ${hasContent ? 'has-content' : ''}" data-footprint-id="${f.id}">
        <div class="ic">${(ev.name.match(/^\S+/) || ['📍'])[0]}</div>
        <div class="nm">${ev.name.replace(/^\S+\s/, '').slice(0, 5)}</div>
        <div class="dt">${d.getMonth() + 1}/${d.getDate()}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="footprint-card">
      <div class="footprint-card-head">
        <h3>🐾 我的足迹</h3>
        <button class="fp-more" id="fp-more-btn">查看更多 ›</button>
      </div>
      <div class="fp-summary">近30天去过 <strong>${recent.length}</strong> 个地方，分享过 <strong>${contentCount}</strong> 条内容</div>
      <div class="fp-anim">
        <div class="fp-path">${pathHtml}</div>
        ${floatPaws}
        ${nodesHtml}
        <div class="fp-walker">🚶</div>
      </div>
      <div class="fp-thumb-list">${thumbsHtml}</div>
    </div>
  `;
}

// 渲染足迹详情弹层列表
function renderFootprintModal() {
  const list = footprintsInRange(state.footprintRange);
  if (list.length === 0) {
    footprintModalList.innerHTML = `
      <div class="fp-modal-empty">
        <div class="big">🐾</div>
        该时间段还没有足迹记录<br/>
        去探索更多热点吧！
      </div>
    `;
    return;
  }
  footprintModalList.innerHTML = list.map((f) => {
    const ev = findEvent(f.eventId);
    if (!ev) return '';
    const d = DateUtils.parseDateStr(f.date);
    const hasContent = !!f.content;
    const contentLabel = hasContent
      ? (f.content.type === 'video' ? `视频 ${f.content.duration}s` : '图文')
      : '未上传';
    return `
      <div class="fp-modal-item ${hasContent ? 'has-content' : ''}" data-footprint-id="${f.id}">
        <div class="date-col">
          <div class="d">${d.getDate()}</div>
          <div class="m">${d.getMonth() + 1}月</div>
        </div>
        <div class="info-col">
          <div class="name">${ev.name}</div>
          <div class="addr">${ev.address} · ${String(f.visitH).padStart(2, '0')}:00 到达</div>
          <div class="meta">
            <span class="meta-tag">${DateUtils.friendlyDate(f.date)}</span>
            <span class="meta-tag ${hasContent ? 'content' : ''}" data-action="view-content">${contentLabel}</span>
          </div>
        </div>
        <div class="arrow">${hasContent ? '›' : ''}</div>
      </div>
    `;
  }).join('');

  // 绑定查看内容
  footprintModalList.querySelectorAll('.fp-modal-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      const f = footprints.find((x) => x.id === item.dataset.footprintId);
      if (!f) return;
      if (!f.content) {
        showToast('该足迹未上传内容');
        return;
      }
      renderContentModal(f);
    });
  });
}

// 渲染内容查看弹层（视频/图文）
function renderContentModal(f) {
  const ev = findEvent(f.eventId);
  if (!ev || !f.content) return;
  const d = DateUtils.parseDateStr(f.date);
  const dateStr = `${d.getMonth() + 1}月${d.getDate()}日 ${String(f.visitH).padStart(2, '0')}:00`;
  const mediaHtml = f.content.type === 'video'
    ? `<div class="play-big">▶</div>
       <div class="media-label">视频 · ${f.content.duration}秒</div>
       <div class="media-time">📍 ${ev.address} · ${dateStr}</div>`
    : `<div class="play-big">🖼</div>
       <div class="media-label">图文记录</div>
       <div class="media-time">📍 ${ev.address} · ${dateStr}</div>`;

  contentSheet.innerHTML = `
    <div class="content-sheet-head">
      <div>
        <h3>${ev.name}</h3>
        <div class="sub">${dateStr} 打卡</div>
      </div>
      <button class="icon-btn" id="content-close">✕</button>
    </div>
    <div class="content-media">${mediaHtml}</div>
    <div class="content-text">${f.content.text}</div>
    <div class="content-actions">
      <button class="content-action">❤️ 点赞</button>
      <button class="content-action">💬 评论</button>
      <button class="content-action">📤 分享</button>
    </div>
  `;
  $('#content-modal').classList.add('show');
  $('#content-close').addEventListener('click', () => {
    $('#content-modal').classList.remove('show');
  });
  contentSheet.querySelectorAll('.content-action').forEach((btn) => {
    btn.addEventListener('click', () => showToast(btn.textContent.trim() + '（Demo）'));
  });
}

// ============ 购票流程 ============
// 支付方式
const PAY_METHODS = [
  { id: 'wechat', name: '微信支付', icon: '💚' },
  { id: 'alipay', name: '支付宝',   icon: '💙' },
  { id: 'card',   name: '银行卡',   icon: '💳' },
];

let ticketState = { trip: null, ev: null, selectedOption: null };
let payState = { ticket: null, ev: null, method: 'wechat' };

// 打开购票弹层
function openTicketSheet(trip, ev) {
  ticketState = { trip, ev, selectedOption: null };
  const friendlyDate = DateUtils.friendlyDate(trip.date);

  ticketSheet.innerHTML = `
    <div class="ticket-sheet-head">
      <div class="ev-title">${ev.name}</div>
      <div class="ev-sub">📅 ${friendlyDate} ${String(trip.startH).padStart(2,'0')}:00 · 📍 ${ev.address}</div>
    </div>
    <div class="ticket-options" id="ticket-options">
      ${ev.ticketOptions.map((opt) => `
        <div class="ticket-option" data-opt-id="${opt.id}">
          <div class="opt-radio"></div>
          <div class="opt-info">
            <div class="opt-name">${opt.name}</div>
            <div class="opt-desc">${opt.desc}</div>
          </div>
          <div class="opt-price"><span class="yuan">¥</span>${opt.price}</div>
        </div>
      `).join('')}
    </div>
    <div class="ticket-foot">
      <div class="ticket-total">
        <span class="lbl">合计</span>
        <span class="val" id="ticket-total-val"><span class="yuan">¥</span>--</span>
      </div>
      <button class="ticket-buy-btn" id="ticket-buy-btn" disabled>确认选座</button>
    </div>
  `;
  $('#ticket-modal').classList.add('show');

  // 选择票档
  ticketSheet.querySelectorAll('.ticket-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      ticketSheet.querySelectorAll('.ticket-option').forEach((o) => o.classList.remove('selected'));
      opt.classList.add('selected');
      ticketState.selectedOption = ev.ticketOptions.find((o) => o.id === opt.dataset.optId);
      $('#ticket-total-val').innerHTML = `<span class="yuan">¥</span>${ticketState.selectedOption.price}`;
      $('#ticket-buy-btn').disabled = false;
      $('#ticket-buy-btn').textContent = '去支付';
    });
  });

  // 确认 → 进入支付
  $('#ticket-buy-btn').addEventListener('click', () => {
    if (!ticketState.selectedOption) return;
    $('#ticket-modal').classList.remove('show');
    setTimeout(() => openPaySheet(ticketState.trip, ticketState.ev, ticketState.selectedOption), 200);
  });
}

// 打开支付弹层
function openPaySheet(trip, ev, ticket) {
  payState = { trip, ev, ticket, method: 'wechat' };
  const friendlyDate = DateUtils.friendlyDate(trip.date);

  paySheet.innerHTML = `
    <div class="pay-sheet-head">
      <h3>确认支付</h3>
      <button class="icon-btn" id="pay-close">✕</button>
    </div>
    <div class="pay-amount-box">
      <div class="lbl">支付金额</div>
      <div class="amt"><span class="yuan">¥</span>${ticket.price}</div>
    </div>
    <div class="pay-detail">
      <div class="pay-detail-row"><span class="k">商品名称</span><span class="v">${ev.name}</span></div>
      <div class="pay-detail-row"><span class="k">票档</span><span class="v">${ticket.name}</span></div>
      <div class="pay-detail-row"><span class="k">场次</span><span class="v">${friendlyDate} ${String(trip.startH).padStart(2,'0')}:00</span></div>
      <div class="pay-detail-row"><span class="k">场馆</span><span class="v">${ev.address}</span></div>
    </div>
    <div class="pay-methods" id="pay-methods">
      ${PAY_METHODS.map((m) => `
        <div class="pay-method ${m.id === 'wechat' ? 'selected' : ''}" data-method-id="${m.id}">
          <div class="pm-ic">${m.icon}</div>
          <div class="pm-name">${m.name}</div>
          <div class="pm-radio"></div>
        </div>
      `).join('')}
    </div>
    <button class="pay-confirm-btn" id="pay-confirm-btn">确认支付 ¥${ticket.price}</button>
  `;
  $('#pay-modal').classList.add('show');

  // 切换支付方式
  paySheet.querySelectorAll('.pay-method').forEach((m) => {
    m.addEventListener('click', () => {
      paySheet.querySelectorAll('.pay-method').forEach((o) => o.classList.remove('selected'));
      m.classList.add('selected');
      payState.method = m.dataset.methodId;
    });
  });

  // 关闭
  $('#pay-close').addEventListener('click', () => $('#pay-modal').classList.remove('show'));

  // 确认支付 → 模拟支付中 → 成功
  $('#pay-confirm-btn').addEventListener('click', () => {
    const btn = $('#pay-confirm-btn');
    btn.classList.add('paying');
    btn.textContent = '支付中...';
    setTimeout(() => {
      // 回写购票信息到 trip
      trip.purchasedTicket = {
        optionId: payState.ticket.id,
        optionName: payState.ticket.name,
        price: payState.ticket.price,
        method: payState.method,
        orderId: 'T' + Date.now().toString().slice(-10),
        paidAt: Date.now(),
      };
      renderPaySuccess(trip, ev, payState.ticket);
    }, 1500);
  });
}

// 支付成功页
function renderPaySuccess(trip, ev, ticket) {
  const friendlyDate = DateUtils.friendlyDate(trip.date);
  const methodName = PAY_METHODS.find((m) => m.id === payState.method).name;
  const order = trip.purchasedTicket;

  paySheet.innerHTML = `
    <div class="pay-success">
      <div class="check">✓</div>
      <div class="title">支付成功</div>
      <div class="sub">电子票已加入行程</div>
      <div class="order-info">
        <span class="k">订单号</span><span class="v">${order.orderId}</span><br/>
        <span class="k">商品</span><span class="v">${ev.name}</span><br/>
        <span class="k">票档</span><span class="v">${ticket.name}</span><br/>
        <span class="k">场次</span><span class="v">${friendlyDate} ${String(trip.startH).padStart(2,'0')}:00</span><br/>
        <span class="k">场馆</span><span class="v">${ev.address}</span><br/>
        <span class="k">支付方式</span><span class="v">${methodName}</span><br/>
        <span class="k">金额</span><span class="v">¥${ticket.price}</span>
      </div>
      <button class="pay-success-btn" id="pay-done-btn">完成</button>
    </div>
  `;
  $('#pay-done-btn').addEventListener('click', () => {
    $('#pay-modal').classList.remove('show');
    renderTrip();
    showToast('🎫 购票成功，已加入行程');
  });
}

// ============ 个人页渲染（统计 + 足迹卡片） ============
function renderProfile() {
  const followingCount = followedPublishers.size;
  const checkedCount = footprints.length;
  const unreadCount = messages.filter((m) => !m.read).length;
  profileBody.innerHTML = `
    <div class="profile-avatar">👤</div>
    <div class="profile-name">城市探索者</div>
    <div class="profile-sub">探索足迹: ${footprints.length} 个打卡点</div>
    <div class="profile-stats">
      <div class="stat-item"><div class="val">${events.length}</div><div class="lbl">热点</div></div>
      <div class="stat-item"><div class="val">${followingCount}</div><div class="lbl">关注</div></div>
      <div class="stat-item"><div class="val">${state.fansCount}</div><div class="lbl">粉丝</div></div>
      <div class="stat-item"><div class="val">${checkedCount}</div><div class="lbl">打卡</div></div>
    </div>
    ${renderFootprintCard()}
    <div class="profile-tabs">
      <button class="profile-tab ${state.profileMsgTab === 'message' ? 'active' : ''}" data-ptab="message">
        消息${unreadCount > 0 ? `<span class="ptab-badge">${unreadCount}</span>` : ''}
      </button>
      <button class="profile-tab ${state.profileMsgTab === 'comment' ? 'active' : ''}" data-ptab="comment">
        评论
      </button>
    </div>
    <div class="profile-tab-body" id="profile-tab-body">
      ${renderProfileTabBody()}
    </div>
  `;
  // 绑定查看更多
  $('#fp-more-btn').addEventListener('click', () => {
    renderFootprintModal();
    $('#footprint-modal').classList.add('show');
  });
  // 缩略列表点击查看内容
  profileBody.querySelectorAll('.fp-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const f = footprints.find((x) => x.id === thumb.dataset.footprintId);
      if (!f) return;
      if (!f.content) {
        showToast('该足迹未上传内容');
        return;
      }
      renderContentModal(f);
    });
  });
  // 动画节点点击查看内容
  profileBody.querySelectorAll('.fp-node').forEach((node) => {
    node.addEventListener('click', () => {
      const f = footprints.find((x) => x.id === node.dataset.footprintId);
      if (!f) return;
      if (!f.content) {
        showToast('该足迹未上传内容');
        return;
      }
      renderContentModal(f);
    });
  });
  // 消息/评论选项卡切换
  profileBody.querySelectorAll('.profile-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      state.profileMsgTab = tab.dataset.ptab;
      profileBody.querySelectorAll('.profile-tab').forEach((t) =>
        t.classList.toggle('active', t.dataset.ptab === state.profileMsgTab)
      );
      $('#profile-tab-body').innerHTML = renderProfileTabBody();
      bindProfileTabBody();
    });
  });
  bindProfileTabBody();
}

// 渲染我的页选项卡内容
function renderProfileTabBody() {
  if (state.profileMsgTab === 'message') {
    if (messages.length === 0) {
      return `<div class="profile-empty">📭 暂无消息</div>`;
    }
    return `<div class="msg-list">` + messages.map((m) => `
      <div class="msg-item ${m.read ? '' : 'unread'}" data-msg-id="${m.id}">
        <div class="msg-icon">${m.icon}</div>
        <div class="msg-main">
          <div class="msg-head">
            <span class="msg-title">${m.title}</span>
            <span class="msg-time">${TimeUtils.formatRelativeTime(m.time)}</span>
          </div>
          <div class="msg-text">${m.text}</div>
        </div>
        ${m.read ? '' : '<span class="msg-dot"></span>'}
      </div>
    `).join('') + `</div>`;
  }
  // 评论选项卡：查看历史评论过的视频（预留，暂无数据）
  return `<div class="profile-empty">💬 还没有评论过视频<br><small>在热点视频下发表评论，会在这里显示</small></div>`;
}

// 绑定选项卡内容交互
function bindProfileTabBody() {
  if (state.profileMsgTab === 'message') {
    profileBody.querySelectorAll('.msg-item').forEach((item) => {
      item.addEventListener('click', () => {
        const msg = messages.find((x) => x.id === item.dataset.msgId);
        if (!msg) return;
        msg.read = true; // 标记已读
        item.classList.remove('unread');
        item.querySelector('.msg-dot')?.remove();
        // 更新未读角标
        const unread = messages.filter((m) => !m.read).length;
        const badge = profileBody.querySelector('.profile-tab[data-ptab="message"] .ptab-badge');
        if (unread > 0) { if (badge) badge.textContent = unread; }
        else { badge?.remove(); }
        showToast(`${msg.title}：${msg.text.slice(0, 18)}…`);
      });
    });
  }
}

// ============ 发布设置（上传视频后） ============
// 初始化发布草稿
function initPublishDraft() {
  const detected = findEvent(MOCK_UPLOAD_VIDEO.detectedEventId);
  state.publishDraft = {
    title: '',
    desc: '',
    eventId: MOCK_UPLOAD_VIDEO.detectedEventId, // AI 识别到的热点
    detectedEventId: MOCK_UPLOAD_VIDEO.detectedEventId, // 原始识别值（用于显示"AI 识别"标记）
    aiFilterOn: false,
    filterId: 'none',
    isPrivate: false,
    allowComment: true,
    allowDownload: true,
    showLocation: true,
    detectedLabel: detected ? detected.name.replace(/^\S+\s/, '') : '未识别',
  };
}

// 渲染发布设置页
function renderPublishModal() {
  const d = state.publishDraft;
  if (!d) return;
  const ev = findEvent(d.eventId);
  const filterName = AI_FILTERS.find((f) => f.id === d.filterId)?.name || '原图';

  publishSheet.innerHTML = `
    <div class="pub-topbar">
      <button class="pub-cancel" id="pub-cancel">✕</button>
      <span class="pub-title">发布</span>
      <button class="pub-publish-btn" id="pub-publish-btn">发布</button>
    </div>
    <div class="pub-scroll">
      <!-- 视频预览 -->
      <div class="pub-preview">
        <div class="pub-video ${d.aiFilterOn && d.filterId !== 'none' ? 'filter-' + d.filterId : ''}"
             style="background-image:url('${MOCK_UPLOAD_VIDEO.image}')">
          <div class="pub-play">▶</div>
          <div class="pub-duration">00:${String(MOCK_UPLOAD_VIDEO.duration).padStart(2, '0')}</div>
          ${d.aiFilterOn && d.filterId !== 'none' ? `<div class="pub-filter-tag">${filterName}滤镜</div>` : ''}
        </div>
      </div>

      <!-- 标题 -->
      <div class="pub-field">
        <label class="pub-label">标题</label>
        <input class="pub-input" id="pub-input-title" type="text" maxlength="30"
               placeholder="给视频起个标题（选填）" value="${d.title.replace(/"/g, '&quot;')}" />
      </div>

      <!-- 描述 -->
      <div class="pub-field">
        <label class="pub-label">描述</label>
        <textarea class="pub-textarea" id="pub-input-desc" maxlength="100" rows="2"
                  placeholder="添加描述，让更多人看到…">${d.desc}</textarea>
      </div>

      <!-- AI 识别热点（可修改） -->
      <div class="pub-field">
        <div class="pub-field-head">
          <label class="pub-label">绑定热点</label>
          <span class="pub-ai-tag">🤖 AI 识别</span>
        </div>
        <div class="pub-event-select" id="pub-event-current">
          <span class="pub-ev-icon">📍</span>
          <span class="pub-ev-name">${ev ? ev.name : '未绑定'}</span>
          <span class="pub-ev-arrow">▾</span>
        </div>
        <div class="pub-event-list" id="pub-event-list" style="display:none;">
          ${events.map((e) => `
            <div class="pub-event-opt ${e.id === d.eventId ? 'selected' : ''}" data-event-id="${e.id}">
              <span class="pub-ev-icon">📍</span>
              <div class="pub-ev-info">
                <div class="pub-ev-name">${e.name}</div>
                <div class="pub-ev-sub">${e.address}</div>
              </div>
              ${e.id === d.eventId ? '<span class="pub-ev-check">✓</span>' : ''}
            </div>
          `).join('')}
        </div>
        <div class="pub-hint">识别不准？点击上方可修改绑定的热点</div>
      </div>

      <!-- AI 滤镜 -->
      <div class="pub-field">
        <div class="pub-toggle-row">
          <div class="pub-toggle-info">
            <span class="pub-toggle-name">🎨 AI 滤镜</span>
            <span class="pub-toggle-sub">智能美化，一键切换风格</span>
          </div>
          <div class="pub-switch ${d.aiFilterOn ? 'on' : ''}" id="pub-switch-filter" data-key="aiFilterOn"></div>
        </div>
        ${d.aiFilterOn ? `
          <div class="pub-filter-grid" id="pub-filter-grid">
            ${AI_FILTERS.map((f) => `
              <div class="pub-filter-tpl ${f.id === d.filterId ? 'selected' : ''}" data-filter-id="${f.id}">
                <div class="pub-filter-icon filter-${f.id}">${f.icon}</div>
                <div class="pub-filter-name">${f.name}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- 隐私与权限开关组 -->
      <div class="pub-field pub-group">
        <div class="pub-toggle-row">
          <div class="pub-toggle-info">
            <span class="pub-toggle-name">🔒 私密</span>
            <span class="pub-toggle-sub">仅自己可见</span>
          </div>
          <div class="pub-switch ${d.isPrivate ? 'on' : ''}" data-key="isPrivate"></div>
        </div>
        <div class="pub-toggle-row">
          <div class="pub-toggle-info">
            <span class="pub-toggle-name">💬 允许评论</span>
            <span class="pub-toggle-sub">关闭后他人无法评论</span>
          </div>
          <div class="pub-switch ${d.allowComment ? 'on' : ''}" data-key="allowComment"></div>
        </div>
        <div class="pub-toggle-row">
          <div class="pub-toggle-info">
            <span class="pub-toggle-name">⬇️ 允许下载</span>
            <span class="pub-toggle-sub">关闭后他人无法保存</span>
          </div>
          <div class="pub-switch ${d.allowDownload ? 'on' : ''}" data-key="allowDownload"></div>
        </div>
        <div class="pub-toggle-row">
          <div class="pub-toggle-info">
            <span class="pub-toggle-name">📍 显示位置</span>
            <span class="pub-toggle-sub">在视频中展示热点位置</span>
          </div>
          <div class="pub-switch ${d.showLocation ? 'on' : ''}" data-key="showLocation"></div>
        </div>
      </div>
    </div>
  `;
  bindPublishModal();
}

// 绑定发布设置页交互
function bindPublishModal() {
  const d = state.publishDraft;
  // 取消
  $('#pub-cancel').addEventListener('click', () => {
    if (confirm('放弃本次发布？')) {
      $('#publish-modal').classList.remove('show');
      state.publishDraft = null;
    }
  });
  // 标题/描述双向绑定
  $('#pub-input-title').addEventListener('input', (e) => { d.title = e.target.value; });
  $('#pub-input-desc').addEventListener('input', (e) => { d.desc = e.target.value; });
  // 热点选择展开/收起
  $('#pub-event-current').addEventListener('click', () => {
    const list = $('#pub-event-list');
    list.style.display = list.style.display === 'none' ? 'block' : 'none';
  });
  // 选择热点
  publishSheet.querySelectorAll('.pub-event-opt').forEach((opt) => {
    opt.addEventListener('click', () => {
      d.eventId = opt.dataset.eventId;
      const ev = findEvent(d.eventId);
      $('#pub-event-current .pub-ev-name').textContent = ev ? ev.name : '未绑定';
      $('#pub-event-list').style.display = 'none';
      publishSheet.querySelectorAll('.pub-event-opt').forEach((o) => {
        o.classList.toggle('selected', o.dataset.eventId === d.eventId);
        const check = o.querySelector('.pub-ev-check');
        if (o.dataset.eventId === d.eventId && !check) {
          o.insertAdjacentHTML('beforeend', '<span class="pub-ev-check">✓</span>');
        } else if (o.dataset.eventId !== d.eventId && check) {
          check.remove();
        }
      });
    });
  });
  // 开关切换
  publishSheet.querySelectorAll('.pub-switch').forEach((sw) => {
    sw.addEventListener('click', () => {
      const key = sw.dataset.key;
      d[key] = !d[key];
      sw.classList.toggle('on', d[key]);
      // AI 滤镜开关变化时重渲染（展开/收起模板网格 + 预览滤镜效果）
      if (key === 'aiFilterOn') renderPublishModal();
    });
  });
  // 滤镜模板选择
  publishSheet.querySelectorAll('.pub-filter-tpl').forEach((tpl) => {
    tpl.addEventListener('click', () => {
      d.filterId = tpl.dataset.filterId;
      publishSheet.querySelectorAll('.pub-filter-tpl').forEach((t) =>
        t.classList.toggle('selected', t.dataset.filterId === d.filterId)
      );
      // 更新预览滤镜效果与标签
      const video = publishSheet.querySelector('.pub-video');
      video.className = 'pub-video' + (d.aiFilterOn && d.filterId !== 'none' ? ' filter-' + d.filterId : '');
      const filterName = AI_FILTERS.find((f) => f.id === d.filterId)?.name || '原图';
      let tag = video.querySelector('.pub-filter-tag');
      if (d.filterId !== 'none') {
        if (!tag) {
          tag = document.createElement('div');
          tag.className = 'pub-filter-tag';
          video.appendChild(tag);
        }
        tag.textContent = filterName + '滤镜';
      } else if (tag) {
        tag.remove();
      }
    });
  });
  // 发布
  $('#pub-publish-btn').addEventListener('click', () => {
    const ev = findEvent(d.eventId);
    const filterName = d.aiFilterOn && d.filterId !== 'none'
      ? AI_FILTERS.find((f) => f.id === d.filterId)?.name : '';
    $('#publish-modal').classList.remove('show');
    state.publishDraft = null;
    const parts = ['✅ 发布成功'];
    if (ev) parts.push(`已绑定：${ev.name.replace(/^\S+\s/, '')}`);
    if (d.isPrivate) parts.push('私密可见');
    if (filterName) parts.push(`${filterName}滤镜`);
    showToast(parts.join(' · '));
  });
}

// 模拟上传过程：进度动画 → 打开发布页
function simulateUploadThenOpenPublish() {
  // 用 upload-modal 的 sheet 显示进度
  const sheet = $('#upload-modal .upload-sheet');
  sheet.innerHTML = `
    <div class="pub-progress-wrap">
      <div class="pub-progress-title">📤 正在上传视频…</div>
      <div class="pub-progress-bar"><div class="pub-progress-fill" id="pub-progress-fill"></div></div>
      <div class="pub-progress-pct" id="pub-progress-pct">0%</div>
    </div>
  `;
  let pct = 0;
  const fill = $('#pub-progress-fill');
  const pctEl = $('#pub-progress-pct');
  const timer = setInterval(() => {
    pct += Math.random() * 18 + 8;
    if (pct >= 100) {
      pct = 100;
      clearInterval(timer);
      fill.style.width = '100%';
      pctEl.textContent = '100%';
      setTimeout(() => {
        $('#upload-modal').classList.remove('show');
        // 恢复 upload-sheet 原内容（下次再用）
        sheet.innerHTML = `
          <button class="upload-item" data-upload-action="shoot">📷 拍摄视频</button>
          <button class="upload-item" data-upload-action="album">🖼 从相册选择</button>
        `;
        bindUploadItems();
        // 打开发布设置页
        initPublishDraft();
        renderPublishModal();
        $('#publish-modal').classList.add('show');
      }, 350);
    } else {
      fill.style.width = pct + '%';
      pctEl.textContent = Math.floor(pct) + '%';
    }
  }, 180);
}

// 绑定上传选项（可重复绑定，因上传后 sheet 内容会重置）
function bindUploadItems() {
  $$('.upload-item').forEach((btn) => {
    btn.onclick = () => {
      const action = btn.dataset.uploadAction;
      $('#upload-modal').classList.remove('show');
      if (action === 'album') {
        // 模拟选完视频后上传
        $('#upload-modal').classList.add('show');
        simulateUploadThenOpenPublish();
      } else if (action === 'shoot') {
        showToast('📷 Demo 暂未实现拍摄');
      }
    };
  });
}

// ============ Tab 切换 ============
function switchTab(tab) {
  if (tab === 'upload') {
    $('#upload-modal').classList.add('show');
    return;
  }
  state.currentTab = tab;
  $$('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.tab === tab));
  $$('.page').forEach((p) => p.classList.remove('active'));
  const pageMap = { feed: 'page-feed', map: 'page-map', trip: 'page-trip', profile: 'page-profile' };
  $('#' + pageMap[tab]).classList.add('active');
  if (tab === 'trip') renderTrip();
  if (tab === 'feed') renderFeed(); // 范围可能在地图页改过，回到首页时按最新范围刷新
  if (tab === 'profile') renderProfile(); // 关注数等可能变化，刷新统计与选项卡
}

// ============ 焦点切换 ============
function renderFocusOptions() {
  const container = $('#focus-options');
  container.innerHTML = focusOptions.map((o, i) => `
    <div class="focus-option" data-idx="${i}">
      <span class="ic">📍</span>
      <span>${o.name}</span>
    </div>
  `).join('');
  $$('.focus-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      const idx = +opt.dataset.idx;
      state.focus = { ...focusOptions[idx] };
      $('#focus-name').textContent = focusOptions[idx].name.replace('📍 ', '');
      $('#focus-modal').classList.remove('show');
      // 焦点变化后可见热点集改变，重置首页滑动状态
      state.currentEventIndex = 0;
      state.currentVideoIndices = {};
      feedVertical.scrollTop = 0;
      renderFeed();
      if (state.currentTab === 'trip') renderTrip();
      showToast(`已切换至${focusOptions[idx].name.replace('📍 ', '')}`);
    });
  });
}

// 同步首页与地图页所有范围选择器 UI（共用 state.mapRange）
function syncAllRangeUI(km) {
  const p = ((km - 1) / (30 - 1)) * 100;
  ['#feed-range-value', '#range-value'].forEach((sel) => {
    const el = $(sel); if (el) el.textContent = km + 'km';
  });
  ['#feed-rs-current', '#rs-current'].forEach((sel) => {
    const el = $(sel); if (el) el.textContent = km + 'km';
  });
  ['#feed-rs-slider', '#rs-slider'].forEach((sel) => {
    const el = $(sel); if (el) { el.value = km; el.style.setProperty('--p', p + '%'); }
  });
  // 两套预设按钮统一高亮（同范围应一致）
  $$('.rs-preset').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.km) === km);
  });
}

// ============ 事件绑定 ============
function bindEvents() {
  // 底部导航
  $$('.nav-item').forEach((nav) => {
    nav.addEventListener('click', () => switchTab(nav.dataset.tab));
  });

  // 焦点选择器
  $('#focus-selector').addEventListener('click', () => {
    $('#focus-modal').classList.add('show');
  });

  // ===== 地图页范围选择器 =====
  const rangeSheet = $('#range-sheet');
  const rangeSlider = $('#rs-slider');
  const rsCurrent = $('#rs-current');
  const rsPresets = rangeSheet ? rangeSheet.querySelectorAll('.rs-preset') : [];

  // 更新地图页滑块填充比例（用于 CSS 渐变）
  function updateSliderFill(km) {
    const p = ((km - 1) / (30 - 1)) * 100;
    rangeSlider.style.setProperty('--p', p + '%');
  }

  // 打开/关闭地图页面板
  const rangeTagBtn = $('#range-tag-btn');
  if (rangeTagBtn && rangeSheet) {
    rangeTagBtn.addEventListener('click', () => {
      syncAllRangeUI(state.mapRange);
      rangeSheet.classList.add('open');
    });
    $('#range-sheet-mask').addEventListener('click', () => rangeSheet.classList.remove('open'));
    $('#rs-confirm').addEventListener('click', () => {
      state.mapRange = Number(rangeSlider.value);
      syncAllRangeUI(state.mapRange); // 同步首页范围显示
      rangeSheet.classList.remove('open');
      renderMap();
      showToast(`已更新范围：${state.mapRange}km`);
    });

    // 滑块拖动实时更新（仅当前面板）
    rangeSlider.addEventListener('input', () => {
      const km = Number(rangeSlider.value);
      rsCurrent.textContent = km + 'km';
      updateSliderFill(km);
      rsPresets.forEach((b) => b.classList.toggle('active', Number(b.dataset.km) === km));
    });

    // 预设按钮（仅绑定地图页面板内）
    rsPresets.forEach((btn) => {
      btn.addEventListener('click', () => {
        const km = Number(btn.dataset.km);
        rangeSlider.value = km;
        rsCurrent.textContent = km + 'km';
        updateSliderFill(km);
        rsPresets.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    updateSliderFill(state.mapRange);
  } else {
    console.error('[range] map range-tag-btn NOT found');
  }

  // ===== 首页范围选择器（与地图页共用 state.mapRange） =====
  const feedRangeSheet = $('#feed-range-sheet');
  const feedRangeSlider = $('#feed-rs-slider');
  const feedRsCurrent = $('#feed-rs-current');
  const feedRsPresets = feedRangeSheet ? feedRangeSheet.querySelectorAll('.rs-preset') : [];

  function updateFeedSliderFill(km) {
    const p = ((km - 1) / (30 - 1)) * 100;
    feedRangeSlider.style.setProperty('--p', p + '%');
  }

  const feedRangeTagBtn = $('#feed-range-tag-btn');
  if (feedRangeTagBtn && feedRangeSheet) {
    feedRangeTagBtn.addEventListener('click', () => {
      syncAllRangeUI(state.mapRange);
      feedRangeSheet.classList.add('open');
    });
    $('#feed-range-sheet-mask').addEventListener('click', () => feedRangeSheet.classList.remove('open'));
    $('#feed-rs-confirm').addEventListener('click', () => {
      state.mapRange = Number(feedRangeSlider.value);
      syncAllRangeUI(state.mapRange); // 同步地图页范围显示
      feedRangeSheet.classList.remove('open');
      // 重置首页滑动状态，按新范围重新渲染（名次随之变化）
      state.currentEventIndex = 0;
      state.currentVideoIndices = {};
      feedVertical.scrollTop = 0;
      renderFeed();
      showToast(`已更新范围：${state.mapRange}km`);
    });

    feedRangeSlider.addEventListener('input', () => {
      const km = Number(feedRangeSlider.value);
      feedRsCurrent.textContent = km + 'km';
      updateFeedSliderFill(km);
      feedRsPresets.forEach((b) => b.classList.toggle('active', Number(b.dataset.km) === km));
    });

    feedRsPresets.forEach((btn) => {
      btn.addEventListener('click', () => {
        const km = Number(btn.dataset.km);
        feedRangeSlider.value = km;
        feedRsCurrent.textContent = km + 'km';
        updateFeedSliderFill(km);
        feedRsPresets.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    updateFeedSliderFill(state.mapRange);
  }

  // 初始同步两页范围显示
  syncAllRangeUI(state.mapRange);

  // 弹层关闭
  $$('.modal-mask').forEach((mask) => {
    mask.addEventListener('click', (e) => {
      if (e.target === mask) mask.classList.remove('show');
    });
  });

  // 上传选项（封装为可重复绑定，上传后 sheet 内容会重置）
  bindUploadItems();

  // 日历弹层
  $('#open-calendar').addEventListener('click', () => {
    state.calendarViewMonth = DateUtils.parseDateStr(state.currentTripDate);
    renderCalendarModal();
    $('#calendar-modal').classList.add('show');
  });
  $('#cal-prev').addEventListener('click', () => {
    state.calendarViewMonth = new Date(state.calendarViewMonth.getFullYear(), state.calendarViewMonth.getMonth() - 1, 1);
    renderCalendarModal();
  });
  $('#cal-next').addEventListener('click', () => {
    state.calendarViewMonth = new Date(state.calendarViewMonth.getFullYear(), state.calendarViewMonth.getMonth() + 1, 1);
    renderCalendarModal();
  });

  // 微型地图收缩
  $('#tmm-toggle').addEventListener('click', () => {
    state.miniMapCollapsed = !state.miniMapCollapsed;
    renderMiniMap();
  });

  // 足迹弹层关闭
  $('#footprint-close').addEventListener('click', () => {
    $('#footprint-modal').classList.remove('show');
  });
  // 足迹弹层范围 Tab 切换
  $$('.fp-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.fp-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      state.footprintRange = +tab.dataset.range;
      renderFootprintModal();
    });
  });

  // Feed 纵向滑动跟踪
  feedVertical.addEventListener('scroll', () => {
    const idx = Math.round(feedVertical.scrollTop / feedVertical.clientHeight);
    if (idx !== state.currentEventIndex) state.currentEventIndex = idx;
  });

  // Feed 横向滑动（触屏）
  let hStartX = 0, hStartY = 0;
  feedVertical.addEventListener('touchstart', (e) => {
    hStartX = e.touches[0].clientX;
    hStartY = e.touches[0].clientY;
  }, { passive: true });
  feedVertical.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - hStartX;
    const dy = e.changedTouches[0].clientY - hStartY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const ev = visibleFeedEvents[state.currentEventIndex];
      if (!ev || ev.videoCount <= 1) return;
      const cur = state.currentVideoIndices[state.currentEventIndex] || 0;
      if (dx < 0 && cur < ev.videoCount - 1) {
        state.currentVideoIndices[state.currentEventIndex] = cur + 1;
        updateVideoIndicator(state.currentEventIndex, cur + 1);
        showToast(`视角 ${cur + 2}/${ev.videoCount}`);
      } else if (dx > 0 && cur > 0) {
        state.currentVideoIndices[state.currentEventIndex] = cur - 1;
        updateVideoIndicator(state.currentEventIndex, cur - 1);
        showToast(`视角 ${cur}/${ev.videoCount}`);
      } else if (dx < 0 && cur === ev.videoCount - 1) {
        showToast('已为你切换到下一个热点');
        feedVertical.scrollTo({ top: (state.currentEventIndex + 1) * feedVertical.clientHeight, behavior: 'smooth' });
      }
    }
  }, { passive: true });

  // Feed 横向滑动（桌面 Shift+滚轮）
  feedVertical.addEventListener('wheel', (e) => {
    if (e.shiftKey) {
      e.preventDefault();
      const ev = visibleFeedEvents[state.currentEventIndex];
      if (!ev || ev.videoCount <= 1) return;
      const cur = state.currentVideoIndices[state.currentEventIndex] || 0;
      if (e.deltaY > 0 && cur < ev.videoCount - 1) {
        state.currentVideoIndices[state.currentEventIndex] = cur + 1;
        updateVideoIndicator(state.currentEventIndex, cur + 1);
      } else if (e.deltaY < 0 && cur > 0) {
        state.currentVideoIndices[state.currentEventIndex] = cur - 1;
        updateVideoIndicator(state.currentEventIndex, cur - 1);
      }
    }
  }, { passive: false });
}

function updateVideoIndicator(eventIndex, videoIndex) {
  const page = feedVertical.children[eventIndex];
  if (!page) return;
  const ev = visibleFeedEvents[eventIndex];
  const video = getVideo(ev, videoIndex);

  // 更新视角指示器圆点
  const dots = page.querySelectorAll('.same-indicator .d');
  dots.forEach((d, i) => d.classList.toggle('active', i === videoIndex));

  // 更新视角文字（热度值随热点走，不随视频变）
  const meta = page.querySelector('.ev-meta');
  if (meta) {
    meta.textContent = `${FormatUtils.formatHeat(ev.heat)} 🔥 · 视角 ${videoIndex + 1}/${ev.videoCount}`;
  }

  // 更新背景图（视频级，随横向切换变化）
  const videoBg = page.querySelector('.video-bg');
  if (videoBg) {
    videoBg.style.backgroundImage = `url('${video.image}')`;
    // 重启淡入动画
    videoBg.style.animation = 'none';
    void videoBg.offsetWidth;
    videoBg.style.animation = '';
  }

  // 更新视频标题
  const title = page.querySelector('.ev-title');
  if (title) title.textContent = video.title;

  // 更新发布者头像（视频级，随横向切换变化）
  const publisher = getPublisherById(video.publisherId);
  const pubBlock = page.querySelector('.publisher-block');
  if (pubBlock) {
    pubBlock.dataset.publisherId = publisher.id;
    pubBlock.querySelector('.publisher-avatar').textContent = publisher.avatar;
    // V 认证角标：认证账号显示，非认证账号移除
    const oldBadge = pubBlock.querySelector('.pub-vbadge');
    if (publisher.verified) {
      if (!oldBadge) {
        const badge = document.createElement('div');
        badge.className = 'pub-vbadge';
        badge.textContent = 'V';
        badge.title = publisher.verifyType || '已认证';
        pubBlock.appendChild(badge);
      } else {
        oldBadge.title = publisher.verifyType || '已认证';
      }
    } else if (oldBadge) {
      oldBadge.remove();
    }
    const followed = followedPublishers.has(publisher.id);
    const followBtn = pubBlock.querySelector('.follow-btn');
    followBtn.classList.toggle('followed', followed);
    followBtn.textContent = followed ? '✓' : '+';
  }

  // 更新点赞数（视频级）
  const likeBtn = page.querySelector('[data-action="like"] .label');
  if (likeBtn) likeBtn.textContent = FormatUtils.formatCount(video.likeCount);

  // 注意：热度柱形条（.heat-bar）不在此更新——热度是热点级，横向切视频时保持不变
}

// ============ 行程 Tab badge + tip ============
function updateTripBadge() {
  const badge = $('#trip-badge');
  const count = state.wantToGo.size;
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'flex';
    // 重新触发 pop 动画
    badge.classList.remove('pop');
    void badge.offsetWidth;
    badge.classList.add('pop');
  } else {
    badge.style.display = 'none';
  }
}

let tripTipTimer = null;
function showTripTip() {
  const tip = $('#trip-tip');
  tip.classList.add('show');
  clearTimeout(tripTipTimer);
  tripTipTimer = setTimeout(() => tip.classList.remove('show'), 2000);
}

// ============ 时钟 ============
function updateClock() {
  const d = new Date();
  $('#clock').textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ============ 启动 ============
// 预加载所有视频图片（文生图接口异步生成，提前请求避免切换时显示"正在生成"占位图）
function preloadAllImages() {
  const urls = new Set();
  events.forEach((ev) => {
    if (ev.image) urls.add(ev.image);
    if (ev.videos) ev.videos.forEach((v) => urls.add(v.image));
  });
  // 发布页上传视频预览图（动态生成，需提前预热）
  if (MOCK_UPLOAD_VIDEO.image) urls.add(MOCK_UPLOAD_VIDEO.image);
  urls.forEach((url) => {
    const im = new Image();
    im.src = url;
  });
}

function init() {
  renderFeed();
  renderMap();
  renderProfile();
  renderTrip();
  renderFocusOptions();
  bindEvents();
  updateClock();
  updateTripBadge();
  preloadAllImages();
  setInterval(updateClock, 30000);
}

// 确保 DOM 完全解析后再初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
