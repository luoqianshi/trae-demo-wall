// utils/mock.js — 演示模式 Mock 数据
// 新版本：聊天 + 照片以周/月聚合，朋友圈以单条展示
// 所有图片都使用内联 SVG data URL，保证离线可显示

/* ==========================================================================
 * 1. 图片 / 头像 生成
 * ========================================================================== */

function makeSvg(label, bg, color, size) {
  size = size || 400;
  color = color || '#ffffff';
  const escLabel = (label || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const decorSize = size / 4;
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="' + bg + '"/>' +
    '<stop offset="100%" stop-color="' + shadeColor(bg, -20) + '"/>' +
    '</linearGradient></defs>' +
    '<rect width="' + size + '" height="' + size + '" fill="url(#g)"/>' +
    '<circle cx="' + (size - decorSize) + '" cy="' + decorSize + '" r="' + (decorSize * 0.8) + '" fill="' + shadeColor(bg, 25) + '" opacity="0.35"/>' +
    '<circle cx="' + (decorSize * 0.6) + '" cy="' + (size - decorSize * 0.8) + '" r="' + (decorSize * 1.1) + '" fill="' + shadeColor(bg, -30) + '" opacity="0.25"/>' +
    '<text x="50%" y="52%" font-size="' + (size / 5) + '" fill="' + color + '" text-anchor="middle" dominant-baseline="middle" font-family="-apple-system,Helvetica,sans-serif">' + escLabel + '</text>' +
    '</svg>';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function shadeColor(hex, percent) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + Math.round((255 * percent) / 100)));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + Math.round((255 * percent) / 100)));
  const b = Math.max(0, Math.min(255, (n & 0xff) + Math.round((255 * percent) / 100)));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/* ---------- 头像池 ---------- */
const AVATARS = {
  me:      makeSvg('🧑‍🚀', '#7c5cfc'),
  xiaoyu:  makeSvg('🐟', '#22c55e'),
  laowang: makeSvg('👨‍💻', '#64748b'),
  jiajia:  makeSvg('🌸', '#ec4899'),
  mom:     makeSvg('👩', '#f59e0b'),
  dad:     makeSvg('👨', '#3b82f6'),
  tina:    makeSvg('👩‍🎨', '#a855f7'),
  alex:    makeSvg('🦊', '#f97316'),
  lily:    makeSvg('🌷', '#ec4899'),
  kevin:   makeSvg('🎸', '#6366f1'),
  sophie:  makeSvg('📚', '#0891b2'),
  mike:    makeSvg('🏃', '#16a34a')
};

/* ---------- 照片类型（SVG） ---------- */
const PHOTOS = {
  sunset:    makeSvg('🌇', '#f97316'),
  coffee:    makeSvg('☕', '#78350f'),
  cat:       makeSvg('🐈', '#a16207'),
  mountain:  makeSvg('⛰️', '#047857'),
  beach:     makeSvg('🏖️', '#0891b2'),
  food:      makeSvg('🍜', '#b91c1c'),
  book:      makeSvg('📖', '#1e40af'),
  concert:   makeSvg('🎤', '#be185d'),
  flower:    makeSvg('🌸', '#be185d'),
  train:     makeSvg('🚄', '#0369a1'),
  rain:      makeSvg('☔', '#334155'),
  night:     makeSvg('🌃', '#1e1b4b'),
  dog:       makeSvg('🐶', '#b45309'),
  street:    makeSvg('🏙️', '#4338ca'),
  forest:    makeSvg('🌲', '#065f46'),
  self:      makeSvg('🤳', '#7c5cfc'),
  sunrise:   makeSvg('🌅', '#fbbf24'),
  lake:      makeSvg('🏞️', '#10b981'),
  market:    makeSvg('🏪', '#ef4444'),
  gym:       makeSvg('💪', '#f97316'),
  food2:     makeSvg('🍲', '#dc2626'),
  travel:    makeSvg('✈️', '#0284c7'),
  home:      makeSvg('🏠', '#64748b'),
  work:      makeSvg('💻', '#475569'),
  party:     makeSvg('🎉', '#db2777'),
  festival:  makeSvg('🎆', '#dc2626'),
  pet:       makeSvg('🐾', '#92400e'),
  garden:    makeSvg('🌷', '#059669'),
  cake:      makeSvg('🎂', '#f472b6'),
  view:      makeSvg('🏔️', '#0369a1')
};

/* ---------- 场景定义（供照片生成和朋友圈引用） ---------- */
const SCENES = [
  { label: '🌇 夕阳',   url: PHOTOS.sunset,   city: '上海', location_name: '上海·外滩',      keyword: '夕阳' },
  { label: '☕ 咖啡',   url: PHOTOS.coffee,   city: '北京', location_name: '北京·三里屯',    keyword: '咖啡' },
  { label: '🐈 猫咪',   url: PHOTOS.cat,      city: '北京', location_name: '北京·国贸',      keyword: '猫咪' },
  { label: '⛰️ 山川',  url: PHOTOS.mountain, city: '成都', location_name: '成都·青城山',    keyword: '山' },
  { label: '🏖️ 海滩',  url: PHOTOS.beach,    city: '厦门', location_name: '厦门·环岛路',    keyword: '海' },
  { label: '🍜 美食',   url: PHOTOS.food,     city: '成都', location_name: '成都·宽窄巷子',  keyword: '美食' },
  { label: '📖 书桌',   url: PHOTOS.book,     city: '北京', location_name: '北京·家',        keyword: '读书' },
  { label: '🎤 演唱会', url: PHOTOS.concert,  city: '北京', location_name: '北京·工人体育场',keyword: '演唱会' },
  { label: '🌸 樱花',   url: PHOTOS.flower,   city: '北京', location_name: '北京·玉渊潭',    keyword: '樱花' },
  { label: '🚄 高铁',   url: PHOTOS.train,    city: '路上', location_name: '京沪高铁',       keyword: '出行' },
  { label: '☔ 雨天',   url: PHOTOS.rain,     city: '杭州', location_name: '杭州·西湖',      keyword: '雨天' },
  { label: '🌃 夜色',   url: PHOTOS.night,    city: '北京', location_name: '北京·国贸',      keyword: '夜景' },
  { label: '🐶 小狗',   url: PHOTOS.dog,      city: '成都', location_name: '成都·锦里',      keyword: '宠物' },
  { label: '🏙️ 街景',  url: PHOTOS.street,   city: '上海', location_name: '上海·南京西路',  keyword: '街景' },
  { label: '🌲 森林',   url: PHOTOS.forest,   city: '杭州', location_name: '杭州·龙井',      keyword: '自然' },
  { label: '🤳 自拍',   url: PHOTOS.self,     city: '北京', location_name: '北京·家',        keyword: '自拍' },
  { label: '🌅 日出',   url: PHOTOS.sunrise,  city: '厦门', location_name: '厦门·海边',      keyword: '日出' },
  { label: '🏞️ 湖景',  url: PHOTOS.lake,     city: '杭州', location_name: '杭州·西湖',      keyword: '湖' },
  { label: '🏪 集市',   url: PHOTOS.market,   city: '上海', location_name: '上海·愚园路',    keyword: '集市' },
  { label: '💪 运动',   url: PHOTOS.gym,      city: '北京', location_name: '北京·奥森',      keyword: '跑步' },
  { label: '🍲 火锅',   url: PHOTOS.food2,    city: '成都', location_name: '成都·春熙路',    keyword: '火锅' },
  { label: '✈️ 旅行',  url: PHOTOS.travel,   city: '路上', location_name: '机场',           keyword: '旅行' },
  { label: '🏠 居家',   url: PHOTOS.home,     city: '北京', location_name: '北京·家',        keyword: '居家' },
  { label: '💻 工作',   url: PHOTOS.work,     city: '北京', location_name: '北京·国贸',      keyword: '工作' },
  { label: '🎉 聚会',   url: PHOTOS.party,    city: '北京', location_name: '北京·三里屯',    keyword: '聚会' },
  { label: '🎆 节日',   url: PHOTOS.festival, city: '家乡', location_name: '老家',           keyword: '节日' },
  { label: '🐾 宠物',   url: PHOTOS.pet,      city: '上海', location_name: '上海·家',        keyword: '宠物' },
  { label: '🌷 花园',   url: PHOTOS.garden,   city: '苏州', location_name: '苏州·拙政园',    keyword: '园林' },
  { label: '🎂 蛋糕',   url: PHOTOS.cake,     city: '北京', location_name: '北京·三里屯',    keyword: '生日' },
  { label: '🏔️ 山景',  url: PHOTOS.view,     city: '丽江', location_name: '丽江·玉龙雪山',  keyword: '雪山' }
];

/* ==========================================================================
 * 2. 通用工具
 * ========================================================================== */

let _idCounter = 1000;
const genId = () => 'mock_' + (++_idCounter);

const now = Date.now();
const dayMs = 86400000;
const weekMs = 7 * dayMs;

function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s);
  return d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');
}
function fmtDateTime(s) {
  if (!s) return '';
  const d = new Date(s);
  return d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0') + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
function fmtDateShort(s) {
  if (!s) return '';
  const d = new Date(s);
  return String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');
}

/* 时间桶：按周/月/年取桶起始时间 */
function getPeriodStart(ts, granularity) {
  const d = new Date(ts);
  if (granularity === 'week') {
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday, 0, 0, 0, 0);
    return monday.getTime();
  }
  if (granularity === 'month') {
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  }
  return new Date(d.getFullYear(), 0, 1).getTime();
}

function getPeriodLabel(ts, granularity) {
  const d = new Date(ts);
  if (granularity === 'week') {
    const start = new Date(ts);
    const end = new Date(ts + weekMs - 1);
    return start.getFullYear() + '年 ' + (start.getMonth() + 1) + '/' + start.getDate() + ' - ' + (end.getMonth() + 1) + '/' + end.getDate();
  }
  if (granularity === 'month') {
    return d.getFullYear() + '年 ' + (d.getMonth() + 1) + '月';
  }
  return d.getFullYear() + '年';
}

/* ==========================================================================
 * 3. 核心 mock 数据池
 * ========================================================================== */

/* ---------- 用户 ---------- */
const mockUser = {
  id: genId(),
  nickname: '时光旅人',
  avatar_url: AVATARS.me,
  stats: {
    totalPhotos: 500,
    totalMoments: 120,
    totalChats: 8,
    totalMessages: 320,
    totalCapsules: 5,
    totalCities: 6,
    firstMemoryAt: '2023/08/01'
  },
  platforms: [
    { platform: 'wechat_photo', last_sync_at: new Date(now - 2 * dayMs).toISOString() },
    { platform: 'wechat_moment', last_sync_at: new Date(now - 1 * dayMs).toISOString() },
    { platform: 'wechat_chat', last_sync_at: new Date(now - 3 * dayMs).toISOString() }
  ],
  privacy: { collisionEnabled: true, collisionScope: 'friends_only' }
};

/* ---------- 胶囊（保持） ---------- */
const mockCapsules = [
  {
    id: genId(), title: '三月在成都的旅行故事', status: 'unlocked',
    cover_url: PHOTOS.mountain, seal_style: 'classic',
    sealed_at: new Date(now - 90 * dayMs).toISOString(),
    unlock_at: new Date(now - 30 * dayMs).toISOString(),
    unlocked_at: new Date(now - 30 * dayMs).toISOString(),
    location_name: '成都·宽窄巷子',
    content: { text: '三月我们去了成都。春熙路的火锅、宽窄巷子的茶馆……' },
    photos: [PHOTOS.mountain, PHOTOS.food, PHOTOS.street]
  },
  {
    id: genId(), title: '写给一年后的自己', status: 'unlocked',
    cover_url: PHOTOS.night, seal_style: 'gold',
    sealed_at: new Date(now - 400 * dayMs).toISOString(),
    unlock_at: new Date(now - 35 * dayMs).toISOString(),
    unlocked_at: new Date(now - 35 * dayMs).toISOString(),
    location_name: '北京·国贸',
    content: { text: '那时候还在为工作的方向迷茫，每天加班到深夜……' },
    photos: [PHOTOS.night, PHOTOS.coffee]
  },
  {
    id: genId(), title: '今天看到的绝美夕阳', status: 'sealed',
    cover_url: PHOTOS.sunset, seal_style: 'classic',
    sealed_at: new Date(now - 5 * dayMs).toISOString(),
    unlock_at: new Date(now + 175 * dayMs).toISOString(),
    location_name: '上海·外滩'
  },
  {
    id: genId(), title: '第一次半马的纪念', status: 'sealed',
    cover_url: PHOTOS.train, seal_style: 'blue',
    sealed_at: new Date(now - 10 * dayMs).toISOString(),
    unlock_at: new Date(now + 355 * dayMs).toISOString(),
    location_name: '厦门·环岛路'
  },
  {
    id: genId(), title: '深夜写给三年后的信', status: 'sealed',
    cover_url: PHOTOS.book, seal_style: 'gold',
    sealed_at: new Date(now - 2 * dayMs).toISOString(),
    unlock_at: new Date(now + 730 * dayMs).toISOString(),
    location_name: ''
  }
];

/* ==========================================================================
 * 3-1. 照片（320 张，散落在过去两年）
 * ========================================================================== */

const mockPhotos = (() => {
  const items = [];
  // 500 张照片，在过去 900 天里散开，有一定随机性
  const totalDays = 900;
  for (let i = 0; i < 500; i++) {
    const scene = SCENES[i % SCENES.length];
    const daysAgo = Math.floor((i / 500) * totalDays) + Math.floor(Math.random() * 8);
    // 加入一些集中爆发的时间段（模拟旅行、节日）
    let extraCluster = 0;
    if (i >= 150 && i < 190) extraCluster = -80; // 旅行期集中
    if (i >= 280 && i < 310) extraCluster = -120; // 另一段旅行
    if (i >= 420 && i < 450) extraCluster = -60; // 节日集中
    const ts = new Date(now - (daysAgo + extraCluster) * dayMs + Math.floor(Math.random() * dayMs));

    items.push({
      id: genId(),
      url: scene.url,
      thumb_url: scene.url,
      width: 1200,
      height: 800,
      taken_at: ts.toISOString(),
      taken_at_text: fmtDate(ts.toISOString()),
      city: scene.city,
      location_name: scene.location_name,
      label: scene.label,
      ai: {
        mood: ['开心', '平静', '期待', '温暖', '激动', '疲惫', '低落'][i % 7],
        mood_score: 0.55 + ((i * 7) % 40) / 100,
        keywords: [scene.keyword, scene.city]
      }
    });
  }
  items.sort((a, b) => new Date(b.taken_at) - new Date(a.taken_at));
  return items;
})();

/* ==========================================================================
 * 3-2. 朋友圈（120 条，两年跨度）
 * ========================================================================== */

function makeMoment(daysAgo, city, location, text, media, likes, comments, mood) {
  const ts = new Date(now - daysAgo * dayMs + 8 * 3600 * 1000 + Math.floor(Math.random() * 12 * 3600 * 1000));
  const mList = media || [];
  return {
    id: genId(),
    source: 'moment',
    occurred_at: ts.toISOString(),
    occurred_at_text: fmtDate(ts.toISOString()),
    city: city,
    location_name: location,
    content: { text: text, media: mList },
    metadata: { likes_count: likes || 20, comments_count: comments || 3 },
    ai: { mood: mood || '平静', mood_score: 0.6 + Math.random() * 0.3, keywords: [city, text.slice(0, 8)] }
  };
}

const momentPool = [
  // === 最近两周（新鲜热乎） ===
  [1, '北京', '北京·三里屯', '周末的咖啡时光，慢下来的感觉真好。', [PHOTOS.coffee, PHOTOS.book], 42, 6, '平静'],
  [2, '北京', '北京·国贸', '今天下班早，抬头看见了晚霞。', [PHOTOS.sunset], 35, 4, '开心'],
  [3, '上海', '上海·外滩', '今晚的外滩，天边像被点燃了一样 🔥', [PHOTOS.sunset, PHOTOS.night, PHOTOS.street], 88, 12, '开心'],
  [4, '上海', '上海·南京西路', '出差上海，和老朋友约了一顿饭。', [PHOTOS.food], 28, 3, '温暖'],
  [5, '北京', '北京·家', '周末在家看书的感觉真好，终于把那本书读完了。', [PHOTOS.book], 36, 5, '平静'],
  [6, '北京', '北京·奥森', '晨跑 8 公里，空气不错。', [PHOTOS.gym], 24, 2, '期待'],
  [7, '北京', '北京·三里屯', '新开的咖啡店，环境超出预期。', [PHOTOS.coffee, PHOTOS.cat], 40, 5, '开心'],
  [8, '北京', '北京·家', '下雨天，适合发呆。', [PHOTOS.rain], 20, 2, '平静'],
  [9, '北京', '北京·国贸', '加班的夜晚，窗外灯火通明。', [PHOTOS.night], 18, 3, '疲惫'],
  [10, '路上', '京沪高铁', '又一次出差，在高铁上看了一部电影。', [PHOTOS.train], 30, 4, '平静'],

  // === 最近一个月 ===
  [14, '成都', '成都·宽窄巷子', '旅行的第三天，终于吃到心心念念的火锅。下次一定还来。', [PHOTOS.food, PHOTOS.street, PHOTOS.dog], 56, 9, '期待'],
  [16, '成都', '成都·锦里', '锦里的夜市真热闹，小狗也来凑热闹了。', [PHOTOS.dog, PHOTOS.food], 41, 7, '开心'],
  [18, '成都', '成都·青城山', '爬青城山，腿已经不是我的腿了。', [PHOTOS.mountain, PHOTOS.forest], 45, 6, '疲惫'],
  [20, '成都', '成都·都江堰', '山里空气真好，周末逃离城市计划。', [PHOTOS.mountain, PHOTOS.forest, PHOTOS.cat], 34, 5, '平静'],
  [22, '厦门', '厦门·环岛路', '完成了人生第一个半马！虽然配速不快，但真的跑下来了。', [PHOTOS.beach, PHOTOS.train], 128, 21, '自豪'],
  [24, '厦门', '厦门·海边', '今天早起看日出，一切都值得。', [PHOTOS.sunrise, PHOTOS.beach], 95, 14, '期待'],
  [26, '路上', '厦门高崎机场', '旅行结束，回去搬砖。', [PHOTOS.travel], 38, 4, '平静'],
  [28, '北京', '北京·奥森', '恢复跑 5km，感觉身体慢慢回到状态。', [PHOTOS.gym], 28, 4, '自豪'],
  [30, '北京', '北京·三里屯', '今天在咖啡店遇到一只超级黏人的猫。', [PHOTOS.cat, PHOTOS.coffee], 77, 11, '开心'],

  // === 1-2 个月 ===
  [35, '北京', '北京·玉渊潭', '春天的樱花，一年一会。', [PHOTOS.flower], 67, 8, '温暖'],
  [38, '北京', '北京·玉渊潭', '樱花季第二天，人比昨天更多，但花也开得更盛了。', [PHOTOS.flower, PHOTOS.night], 55, 6, '温暖'],
  [40, '上海', '上海·外滩', '夜色温柔，江风有点凉。', [PHOTOS.night, PHOTOS.street], 48, 5, '平静'],
  [42, '上海', '上海·南京西路', '出差到上海，顺便逛了一下。', [PHOTOS.street, PHOTOS.market], 44, 5, '平静'],
  [44, '上海', '上海·愚园路', '愚园路的小集市，很有生活气息。', [PHOTOS.market, PHOTOS.food], 52, 7, '开心'],
  [46, '路上', '京沪高铁', '在北京与上海之间往返，高铁成了半个家。', [PHOTOS.train], 25, 3, '平静'],
  [48, '北京', '北京·家', '整理相册，翻出了很多回忆。', [], 22, 2, '温暖'],

  // === 2-3 个月 ===
  [55, '北京', '北京·工人体育场', '和喜欢了十年的歌手在同一个场馆——这一夜值得永远记住。', [PHOTOS.concert, PHOTOS.night], 152, 18, '激动'],
  [57, '北京', '北京·工人体育场', '演唱会后遗症：循环播放同一首歌三天。', [], 88, 9, '温暖'],
  [60, '北京', '北京·国贸', '今天是入职两周年的日子，时间过得真快。', [PHOTOS.self], 62, 10, '期待'],
  [63, '北京', '北京·家', '周末在家做了一顿大餐，犒劳一下自己。', [PHOTOS.food, PHOTOS.coffee], 48, 6, '温暖'],
  [66, '杭州', '杭州·西湖', '出差路过杭州，西湖边小坐了一会。', [PHOTOS.lake, PHOTOS.rain], 55, 8, '平静'],
  [69, '杭州', '杭州·龙井', '在龙井茶园散步，空气都是茶香。', [PHOTOS.forest, PHOTOS.garden], 52, 7, '平静'],
  [72, '北京', '北京·三里屯', '今天跟朋友去新开的咖啡馆。', [PHOTOS.coffee], 33, 5, '平静'],
  [75, '北京', '北京·家', '窗外有猫在晒太阳。', [PHOTOS.cat], 35, 4, '平静'],

  // === 3-6 个月 ===
  [85, '丽江', '丽江·玉龙雪山', '第一次亲眼看见雪山，震撼。', [PHOTOS.view, PHOTOS.mountain], 98, 13, '激动'],
  [90, '丽江', '丽江·古城', '古城夜色，灯火阑珊。', [PHOTOS.night, PHOTOS.street], 76, 8, '温暖'],
  [95, '路上', '丽江三义机场', '告别丽江，带走的是满心的宁静。', [PHOTOS.travel], 42, 5, '平静'],
  [100, '北京', '北京·家', '今天开始写日记，希望能坚持下来。', [PHOTOS.book], 28, 4, '期待'],
  [105, '北京', '北京·奥森', '晨跑 8km，完成本周目标。', [PHOTOS.gym], 41, 6, '自豪'],
  [110, '北京', '北京·国贸', '最近有点焦虑，工作压力大，但也在慢慢调整。', [PHOTOS.night], 22, 5, '低落'],
  [115, '北京', '北京·国贸', '新的一年，给自己写下一些目标：坚持跑步、读完 30 本书、学会一门手艺。', [], 52, 4, '期待'],
  [120, '上海', '上海·外滩', '第一次来上海出差，外滩的夜景真的震撼。', [PHOTOS.night, PHOTOS.sunset], 71, 9, '激动'],

  // === 6-12 个月 ===
  [140, '杭州', '杭州·西湖', '西湖烟雨，江南的春天真的让人舍不得走。', [PHOTOS.rain, PHOTOS.flower, PHOTOS.forest, PHOTOS.lake], 73, 11, '平静'],
  [160, '厦门', '厦门·环岛路', '第一次去厦门，海风吹走了所有烦恼。', [PHOTOS.beach, PHOTOS.sunrise], 81, 12, '期待'],
  [180, '北京', '北京·玉渊潭', '春天的第一场约会，樱花开得正好。', [PHOTOS.flower, PHOTOS.self], 66, 8, '温暖'],
  [200, '北京', '北京·家', '搬家了，新家虽然小但很温馨。', [PHOTOS.book, PHOTOS.coffee], 45, 7, '温暖'],
  [220, '成都', '成都·宽窄巷子', '第一次去成都，被美食折服了。', [PHOTOS.food, PHOTOS.market], 62, 9, '开心'],
  [240, '北京', '北京·国贸', '今天第一次独立负责项目上线，紧张但很有成就感。', [PHOTOS.work], 58, 10, '自豪'],
  [260, '北京', '北京·三里屯', '今天跟好朋友相聚，聊了一整晚。', [PHOTOS.food, PHOTOS.party], 48, 6, '温暖'],
  [280, '北京', '北京·家', '第一次自己做饭，虽然卖相一般但味道还可以。', [PHOTOS.food], 32, 8, '自豪'],

  // === 1-1.5 年 ===
  [300, '路上', '京沪高铁', '人生第一次坐高铁出差，记录一下。', [PHOTOS.train], 29, 5, '期待'],
  [320, '北京', '北京·国贸', '入职一周年了，感谢遇到的每一个人。', [PHOTOS.self, PHOTOS.night], 60, 11, '温暖'],
  [340, '北京', '北京·家', '一个普通的周末下午，窗外有阳光。', [PHOTOS.cat], 35, 4, '平静'],
  [360, '北京', '北京·国贸', '去年的今天，刚来北京，一切都很陌生。', [PHOTOS.night], 28, 6, '温暖'],
  [380, '北京', '北京·三里屯', '周末的咖啡馆，很适合发呆。', [PHOTOS.coffee, PHOTOS.book], 33, 5, '平静'],
  [400, '北京', '北京·家', '新买了一盆绿植，希望它能活下来。', [PHOTOS.garden], 25, 3, '期待'],
  [420, '上海', '上海·外滩', '公司团建来上海，一起在外滩看夜景。', [PHOTOS.night, PHOTOS.street], 55, 7, '开心'],
  [440, '路上', '旅途中', '旅途中的夕阳，治愈系满分。', [PHOTOS.sunset, PHOTOS.travel], 48, 6, '温暖'],

  // === 1.5-2 年（更早的回忆） ===
  [460, '北京', '北京·国贸', '刚入职的第一天，有点紧张有点期待。', [PHOTOS.self], 38, 5, '期待'],
  [480, '北京', '北京·家', '来北京后租的第一个小窝。', [PHOTOS.home], 30, 4, '温暖'],
  [500, '路上', '飞往北京', '第一次一个人去另一个城市生活。', [PHOTOS.travel], 45, 6, '期待'],
  [520, '家乡', '老家', '离家前最后一顿饭，妈妈做了我最爱吃的菜。', [PHOTOS.food2, PHOTOS.home], 58, 9, '温暖'],
  [540, '家乡', '老家·过年', '除夕夜，烟花满天。', [PHOTOS.festival, PHOTOS.party], 92, 15, '激动'],
  [560, '家乡', '老家', '和发小聚会，聊起了很多童年的事。', [PHOTOS.cake, PHOTOS.food], 65, 11, '温暖'],
  [580, '家乡', '老家', '家里的小狗，每次回家都特别热情。', [PHOTOS.dog, PHOTOS.pet], 42, 6, '开心'],
  [600, '家乡', '老家·公园', '去了小时候常去的公园，一切都没变。', [PHOTOS.garden, PHOTOS.lake], 38, 5, '温暖'],
  [620, '家乡', '老家', '爸爸教我下象棋，三局两胜我赢了一次。', [PHOTOS.book], 28, 4, '开心'],
  [640, '家乡', '老家', '妈妈种的花开了，她说今年开得特别好。', [PHOTOS.flower, PHOTOS.garden], 40, 5, '温暖'],
  [660, '路上', '旅途中', '毕业旅行，和同学一起去了很多地方。', [PHOTOS.travel, PHOTOS.beach, PHOTOS.mountain], 85, 12, '激动'],
  [680, '苏州', '苏州·拙政园', '苏州园林，一步一景。', [PHOTOS.garden, PHOTOS.forest, PHOTOS.lake], 62, 8, '平静'],
  [700, '杭州', '杭州·西湖', '第一次来西湖，真的像画里一样。', [PHOTOS.lake, PHOTOS.flower], 70, 10, '期待'],
  [720, '北京', '北京·天安门', '第一次来北京，去了天安门广场。', [PHOTOS.street, PHOTOS.self], 55, 8, '激动'],

  // === 更早的回忆（两年前 → 更久远） ===
  [740, '家乡', '老家', '妈妈做的红烧肉，是任何餐馆都替代不了的味道。', [PHOTOS.food2], 60, 9, '温暖'],
  [760, '家乡', '老家·书房', '翻出了小时候的日记本，字迹特别幼稚。', [PHOTOS.book], 30, 4, '平静'],
  [780, '家乡', '老家·阳台', '爸爸养的君子兰开花了，他说等了三年。', [PHOTOS.flower, PHOTOS.garden], 42, 5, '开心'],
  [800, '路上', '京沪高铁', '在高铁上看了一部关于时间的纪录片。', [], 28, 3, '平静'],
  [820, '北京', '北京·三里屯', '第一次在酒吧听 livehouse，震得心跳加速。', [PHOTOS.concert, PHOTOS.night], 52, 7, '激动'],
  [840, '北京', '北京·国贸', '加班到凌晨 2 点，整座城市都睡了。', [PHOTOS.night, PHOTOS.work], 25, 4, '疲惫'],
  [860, '北京', '北京·奥森', '第一次跑完 10 公里，腿快废了，但心情舒畅。', [PHOTOS.gym], 40, 6, '自豪'],
  [880, '北京', '北京·家', '第一次一个人过年，煮了速冻水饺，看春晚。', [PHOTOS.food, PHOTOS.festival], 35, 10, '低落'],
  [900, '路上', '飞往丽江', '第一次坐飞机去旅行，靠窗的位置看云海。', [PHOTOS.travel], 50, 6, '期待'],
  [920, '丽江', '丽江·玉龙雪山', '在 4680 米的地方大口喘气，却笑得停不下来。', [PHOTOS.view, PHOTOS.mountain], 95, 14, '激动'],
  [940, '丽江', '丽江·古城', '夜晚的古城飘着民谣，小酒馆里有陌生人的吉他声。', [PHOTOS.night, PHOTOS.market], 72, 9, '温暖'],
  [960, '厦门', '厦门·鼓浪屿', '在鼓浪屿迷路了半天，反而遇到了最美的小巷。', [PHOTOS.beach, PHOTOS.street], 68, 8, '开心'],
  [980, '厦门', '厦门·海边', '海边落日，时间好像慢了下来。', [PHOTOS.sunset, PHOTOS.beach], 90, 11, '平静'],
  [1000, '上海', '上海·外滩', '和大学同学三年后重聚，聊了一整夜。', [PHOTOS.night, PHOTOS.party], 110, 20, '激动'],
  [1020, '上海', '上海·南京路', '人潮拥挤，但我们笑得最大声。', [PHOTOS.street, PHOTOS.self], 58, 7, '开心'],
  [1040, '杭州', '杭州·龙井', '雨后的茶山，空气里都是茶香。', [PHOTOS.garden, PHOTOS.forest], 55, 6, '平静'],
  [1060, '杭州', '杭州·灵隐寺', '在寺里求了一支签，写着「静候花开」。', [PHOTOS.forest], 45, 8, '平静'],
  [1080, '成都', '成都·春熙路', '第一次吃真正的重庆火锅，辣到眼泪直流但停不下来。', [PHOTOS.food2], 65, 10, '开心'],
  [1100, '成都', '成都·宽窄巷子', '走在巷子里，突然想让时间停在这里。', [PHOTOS.market, PHOTOS.street], 48, 6, '温暖'],
  [1120, '路上', '旅途中', '旅途中遇到的陌生人，有时候比熟人更懂你。', [PHOTOS.travel], 42, 5, '温暖'],
  [1140, '北京', '北京·798', '在 798 看了一场关于时间的展览。', [PHOTOS.view, PHOTOS.market], 52, 7, '平静'],
  [1160, '北京', '北京·国家博物馆', '站在青铜鼎前，突然觉得个人的烦恼都不算什么。', [], 45, 8, '平静'],
  [1180, '北京', '北京·颐和园', '秋天的颐和园，树叶金黄得像油画。', [PHOTOS.garden, PHOTOS.lake], 78, 10, '温暖'],
  [1200, '北京', '北京·故宫', '下雪的故宫，六百年的故事都藏在瓦片里。', [PHOTOS.view, PHOTOS.flower], 130, 22, '激动'],
  [1220, '北京', '北京·家', '搬家那天，窗外下雪了。新的开始。', [PHOTOS.home, PHOTOS.flower], 45, 7, '期待'],
  [1240, '家乡', '老家', '奶奶说，你小时候最爱在这里跑来跑去。', [PHOTOS.home, PHOTOS.garden], 58, 11, '温暖'],
  [1260, '家乡', '老家·后山', '后山的小路，我走了十几年，每次回来都要再走一遍。', [PHOTOS.forest, PHOTOS.mountain], 42, 5, '平静'],
  [1280, '家乡', '老家', '和家人一起包饺子，爸爸擀皮妈妈包馅。', [PHOTOS.food, PHOTOS.home], 66, 9, '温暖'],
  [1300, '路上', '机场', '在机场等一次延误的航班，看了一整本小说。', [PHOTOS.book, PHOTOS.travel], 35, 3, '平静'],
  [1320, '北京', '北京·三里屯', '和朋友吃火锅，吃到凌晨一点。', [PHOTOS.food2, PHOTOS.party], 60, 8, '开心'],
  [1340, '北京', '北京·国贸', '站在 33 楼的窗边，看着整座城市亮起来。', [PHOTOS.night, PHOTOS.view], 50, 6, '平静'],
  [1360, '北京', '北京·奥森', '春天的奥森，花开得像童话一样。', [PHOTOS.flower, PHOTOS.garden], 72, 9, '开心'],
  [1380, '北京', '北京·家', '深夜写代码，桌上是第 3 杯咖啡。', [PHOTOS.coffee, PHOTOS.work], 20, 3, '疲惫'],
  [1400, '北京', '北京·三里屯', '在旧书摊淘到一本泛黄的诗集，老板送了我一页书签。', [PHOTOS.book, PHOTOS.market], 38, 5, '温暖'],
  [1420, '路上', '旅途中', '旅途中的日落，是每天最好的结束。', [PHOTOS.sunset, PHOTOS.travel], 62, 8, '温暖'],
  [1440, '北京', '北京·玉渊潭', '樱花盛开的那一周，我去了三次。', [PHOTOS.flower, PHOTOS.lake], 80, 11, '开心'],
  [1460, '厦门', '厦门·环岛路', '沿着环岛路骑车，海风吹走所有烦恼。', [PHOTOS.beach, PHOTOS.gym], 75, 9, '开心'],
  [1480, '上海', '上海·愚园路', '在愚园路的一家小咖啡馆坐了整整一下午。', [PHOTOS.coffee, PHOTOS.street], 45, 5, '平静'],
  [1500, '路上', '回家的火车', '回家的火车上，一夜没睡，看了一整夜的窗外。', [PHOTOS.train, PHOTOS.night], 38, 7, '期待']
];

const mockMoments = momentPool.map(m => makeMoment.apply(null, m));

mockUser.stats.totalMoments = mockMoments.length;

/* ==========================================================================
 * 3-3. 聊天（8 个会话，300+ 条消息）
 * ========================================================================== */

function buildMessages(patterns, baseDaysAgo, stepDays) {
  const msgs = [];
  let cursor = now - baseDaysAgo * dayMs - 8 * 3600 * 1000;
  patterns.forEach((round, ri) => {
    round.forEach((msg, mi) => {
      cursor += (ri === 0 && mi === 0 ? 0 : 60000 + Math.floor(Math.random() * 300000));
      msgs.push({
        seq: msgs.length,
        sender: msg.from,
        sender_id: '',
        content: msg.text,
        content_type: msg.type || 'text',
        media_url: msg.media_url || null,
        timestamp: new Date(cursor).toISOString(),
        is_recalled: false
      });
    });
    cursor += (stepDays + Math.random() * (stepDays / 2)) * dayMs;
  });
  return msgs;
}

/* 聊天语气模板（供聚合 AI 摘要使用） */
const CHAT_TONES = {
  '小雨': '轻松活泼，像老朋友一样',
  '老王': '同事般直接高效',
  '妈妈': '温暖关心，细节里都是爱',
  '爸爸': '话不多但句句关心',
  '佳佳': '文艺细腻，喜欢分享日常',
  'Kevin': '音乐、电影、生活碎片',
  'Tina': '工作和行业讨论为主',
  'Alex': '旅行、美食、运动爱好者'
};

// === 1. 小雨（核心好友，对话最多） ===
const xiaoyuPatterns = [
  [{ from: '小雨', text: '今晚加班到几点？' }, { from: '我', text: '估计 10 点吧，咋了？' }, { from: '小雨', text: '一起吃个夜宵？我发现你家楼下新开了一家烤串店 🍢' }, { from: '我', text: '真的假的，等我！' }, { from: '小雨', text: '好嘞，我在店里等你 👌' }],
  [{ from: '小雨', text: '你上次说想跑半马，训练得咋样了？' }, { from: '我', text: '跑了 2 次 10km，感觉还可以，就是配速太慢 😮‍💨' }, { from: '小雨', text: '慢慢来！下次我们一起跑' }, { from: '我', text: '哈哈，不敢跟你跑，你速度我跟不上' }, { from: '小雨', text: '我可以慢跑配你啊 ☺️' }],
  [{ from: '我', text: '今天看夕阳太美了，拍了张照' }, { from: '我', text: '', type: 'image', media_url: PHOTOS.sunset }, { from: '小雨', text: '哇，这是在哪儿？' }, { from: '我', text: '外滩，晚上正好经过' }, { from: '小雨', text: '下次叫我！我也想拍 😤' }],
  [{ from: '小雨', text: '下周去成都玩，你有没有推荐的地方？' }, { from: '我', text: '宽窄巷子、锦里，吃的话推荐蜀大侠和小龙坎' }, { from: '我', text: '都江堰和青城山也可以去一下' }, { from: '小雨', text: '收到！回来给你带礼物' }, { from: '我', text: '哈哈不用啦，拍点照片就好' }],
  [{ from: '小雨', text: '刚刚看了你的朋友圈，演唱会那篇写得真好' }, { from: '我', text: '谢谢～那一晚真的太难忘了' }, { from: '小雨', text: '是你喜欢了十年的那个人对吧？真替你开心' }, { from: '我', text: '嗯，有时候坚持真的值得' }, { from: '小雨', text: '👏👏👏' }],
  [{ from: '小雨', text: '在吗？' }, { from: '我', text: '在，咋了' }, { from: '小雨', text: '我最近工作有点不顺心' }, { from: '我', text: '说说看？' }, { from: '小雨', text: '就是感觉做的事情没有意义，每天都在重复' }, { from: '我', text: '我有时候也这样，不过过段时间就好啦' }, { from: '小雨', text: '嗯，谢谢你听我说' }],
  [{ from: '我', text: '明天一起去看电影吗？' }, { from: '小雨', text: '好啊，看什么？' }, { from: '我', text: '最近上了一部科幻片，评分还不错' }, { from: '小雨', text: '可以，我买票' }, { from: '我', text: '不用，我买' }, { from: '小雨', text: '那就我买爆米花 🍿' }],
  [{ from: '小雨', text: '你最近在看什么书？' }, { from: '我', text: '在看《百年孤独》，虽然是第三次重读了' }, { from: '小雨', text: '哇那本真的好看' }, { from: '我', text: '对啊，每一次读都有不同的感受' }],
  [{ from: '小雨', text: '生日快乐！🎂🎂🎂' }, { from: '我', text: '谢谢小雨！' }, { from: '小雨', text: '礼物下周给你' }, { from: '我', text: '你能记得就已经是最好的礼物了 ❤️' }, { from: '小雨', text: '肉麻！' }],
  [{ from: '小雨', text: '今天天气超好的！要不要一起去跑步？' }, { from: '我', text: '好啊，奥森见？' }, { from: '小雨', text: '奥森南门，3 点？' }, { from: '我', text: '没问题' }],
  [{ from: '小雨', text: '我最近在学做饭，今天第一次做糖醋排骨' }, { from: '我', text: '结果咋样？' }, { from: '小雨', text: '味道还行，就是糖放多了 😂' }, { from: '我', text: '下次带一点过来，我帮你品鉴' }, { from: '小雨', text: '好啊好啊' }],
  [{ from: '我', text: '刚看完一本小说，哭了半天' }, { from: '小雨', text: '什么书这么感人？' }, { from: '我', text: '《追风筝的人》，你看过吗？' }, { from: '小雨', text: '看过！是真的好看，最后那句「为你，千千万万遍」我至今记得' }],
  [{ from: '小雨', text: '我换工作了！下周一入职新公司' }, { from: '我', text: '哇恭喜！做什么的？' }, { from: '小雨', text: '还是产品经理，只是换了一个行业' }, { from: '我', text: '厉害，预祝你一切顺利' }, { from: '小雨', text: '谢谢，有你鼓励就不怕了 🌟' }]
];
const xiaoyuMsgs = buildMessages(xiaoyuPatterns, 3, 10);

// === 2. 老王（同事） ===
const laowangPatterns = [
  [{ from: '老王', text: '那个接口联调得咋样了？' }, { from: '我', text: '基本 OK，文档我下午发你' }, { from: '老王', text: '好，我等你' }],
  [{ from: '老王', text: '周五晚有局，一起来吗？' }, { from: '我', text: '什么局？' }, { from: '老王', text: '老地方，产品 + 技术几个人' }, { from: '我', text: '好，我报名' }],
  [{ from: '我', text: '你那边能看到生产的监控吗？我这边报 5xx 了' }, { from: '老王', text: '看了一下，是 Redis 超时，我重启一下' }, { from: '我', text: '好的，辛苦' }, { from: '老王', text: 'OK 了，恢复正常' }],
  [{ from: '老王', text: '这周末加班的人多不多？' }, { from: '我', text: '好像不少，你要请假？' }, { from: '老王', text: '家里有点事，想看看情况' }, { from: '我', text: '有事就先回家吧，活儿我帮你兜着' }, { from: '老王', text: '谢了兄弟 👊' }],
  [{ from: '老王', text: '开会了，三楼大会议室' }, { from: '我', text: '马上到' }, { from: '老王', text: '记得带上周的报告' }, { from: '我', text: '收到' }],
  [{ from: '老王', text: '上周那个需求评审你参加吗？' }, { from: '我', text: '参加，你这边有什么特别要注意的吗？' }, { from: '老王', text: '重点关注排期，别被压太紧' }, { from: '我', text: '明白，多谢提醒' }],
  [{ from: '老王', text: '一起去吃饭吗？' }, { from: '我', text: '好，楼下那家新开的面店' }, { from: '老王', text: '走！' }],
  [{ from: '老王', text: '新版发布文档你看下，有几个地方需要你确认' }, { from: '我', text: '收到，我马上看' }, { from: '老王', text: '不急，明天上班前给我就行' }],
  [{ from: '老王', text: '今晚一起吃火锅庆祝一下项目上线' }, { from: '我', text: '好啊，去哪？' }, { from: '老王', text: '老地方，六点半见' }],
  [{ from: '老王', text: '你走了吗？我落了个充电器在公司' }, { from: '我', text: '我还在，等下我帮你拿回去' }, { from: '老王', text: '谢谢兄弟，明天请你喝咖啡' }]
];
const laowangMsgs = buildMessages(laowangPatterns, 5, 12);

// === 3. 妈妈 ===
const momPatterns = [
  [{ from: '妈妈', text: '吃饭了吗？' }, { from: '我', text: '刚吃完，今天加班晚一点' }, { from: '妈妈', text: '别太累，早点回家' }, { from: '我', text: '知道啦' }],
  [{ from: '妈妈', text: '这周末回家吗？' }, { from: '我', text: '可能不回，有个朋友结婚要去上海' }, { from: '妈妈', text: '红包准备好没？' }, { from: '我', text: '哈哈准备了，放心' }, { from: '妈妈', text: '自己的事也上点心啊！' }],
  [{ from: '妈妈', text: '北京今天降温了，多穿点' }, { from: '我', text: '穿了毛衣，不冷' }, { from: '妈妈', text: '那就好，我看你朋友圈发的演唱会，下次早点回来' }, { from: '我', text: '收到！下次一定带照片给你看' }],
  [{ from: '妈妈', text: '你爸最近血压有点高，我让他少喝酒' }, { from: '我', text: '嗯，多提醒他，有需要告诉我' }, { from: '妈妈', text: '你自己也注意身体' }, { from: '我', text: '知道啦妈' }],
  [{ from: '妈妈', text: '什么时候回家？' }, { from: '我', text: '下个月吧，具体我看时间' }, { from: '妈妈', text: '想吃啥妈给你做' }, { from: '我', text: '想吃你做的红烧肉' }, { from: '妈妈', text: '没问题 😊' }],
  [{ from: '妈妈', text: '刚才给你寄了一箱苹果' }, { from: '我', text: '哎呀，不用寄的' }, { from: '妈妈', text: '老家的苹果甜，你尝尝' }, { from: '我', text: '谢谢妈妈' }],
  [{ from: '妈妈', text: '昨天梦见你小时候了，还在上小学' }, { from: '我', text: '哈哈哈，我都这么大了' }, { from: '妈妈', text: '在妈妈眼里你永远是孩子' }, { from: '我', text: '😢 我想家了' }],
  [{ from: '妈妈', text: '你爸在你房间整理，翻到你小时候的照片了' }, { from: '我', text: '', type: 'image', media_url: PHOTOS.flower }, { from: '妈妈', text: '你看这张，笑得多傻' }, { from: '我', text: '哎呀妈，那张我自己都忘了' }],
  [{ from: '妈妈', text: '中秋回来吗？' }, { from: '我', text: '回的，明天买票' }, { from: '妈妈', text: '好，我给你做你最爱的糖醋排骨' }],
  [{ from: '妈妈', text: '你房间的灯坏了，你爸在修' }, { from: '我', text: '让他小心点，别爬太高' }, { from: '妈妈', text: '知道啦，你爸有数' }]
];
const momMsgs = buildMessages(momPatterns, 4, 15);

// === 4. 爸爸（新） ===
const dadPatterns = [
  [{ from: '爸爸', text: '最近工作忙吗？' }, { from: '我', text: '还行，不是特别忙' }, { from: '爸爸', text: '注意身体，别总熬夜' }],
  [{ from: '爸爸', text: '你发的那篇关于跑步的文章我看了' }, { from: '我', text: '哈哈你居然看了' }, { from: '爸爸', text: '年轻人要有坚持的事，挺好' }],
  [{ from: '爸爸', text: '我给你妈买了个新手机，她不太会用' }, { from: '我', text: '等我回去教她' }, { from: '爸爸', text: '不急，先把你自己的事做好' }],
  [{ from: '我', text: '爸，母亲节送什么好？' }, { from: '爸爸', text: '你妈她一直说想去北京看看你' }, { from: '我', text: '那我国庆接你们来' }, { from: '爸爸', text: '好，我跟你妈说一声' }],
  [{ from: '爸爸', text: '你寄回家的茶叶收到了，你妈说挺好喝' }, { from: '我', text: '好喝就行，我下次再买一些' }, { from: '爸爸', text: '不用特意买，你自己也省着花' }],
  [{ from: '爸爸', text: '你妈让我问你，上次寄的衣服收到没' }, { from: '我', text: '收到了，穿上还挺合身' }, { from: '爸爸', text: '嗯，她自己给你挑的，肯定没错' }],
  [{ from: '我', text: '爸，今天我做了个重要决定' }, { from: '爸爸', text: '什么决定？' }, { from: '我', text: '准备换一个城市生活一段时间' }, { from: '爸爸', text: '不管你做什么决定，我和你妈都支持你' }]
];
const dadMsgs = buildMessages(dadPatterns, 20, 30);

// === 5. 佳佳（文艺朋友） ===
const jiajiaPatterns = [
  [{ from: '佳佳', text: '你最近在听什么歌？' }, { from: '我', text: '在循环一张民谣专辑' }, { from: '佳佳', text: '分享一下？' }, { from: '我', text: '好，等下我发你' }],
  [{ from: '佳佳', text: '看了一部很棒的电影，想推荐给你' }, { from: '我', text: '什么电影？' }, { from: '佳佳', text: '是枝裕和的《步履不停》' }, { from: '我', text: '啊，那部我看过两遍，真的好' }, { from: '佳佳', text: '就是那种看完沉默很久的片子' }],
  [{ from: '佳佳', text: '今天去了一个很棒的展览' }, { from: '佳佳', text: '', type: 'image', media_url: PHOTOS.garden }, { from: '我', text: '这是在哪里？' }, { from: '佳佳', text: '798，你来过吗？' }, { from: '我', text: '去过几次，感觉很不错' }],
  [{ from: '佳佳', text: '推荐你读这本书《人类群星闪耀时》' }, { from: '我', text: '收藏了，周末看' }, { from: '佳佳', text: '看完我们聊聊' }],
  [{ from: '佳佳', text: '今天天气真好，适合出去走走' }, { from: '我', text: '我也在想，去哪呢' }, { from: '佳佳', text: '玉渊潭？据说樱花快开了' }, { from: '我', text: '好主意，周末见' }],
  [{ from: '佳佳', text: '刚从云南旅行回来，想跟你分享照片' }, { from: '佳佳', text: '', type: 'image', media_url: PHOTOS.mountain }, { from: '我', text: '哇，大理？丽江？' }, { from: '佳佳', text: '都去了！真的太美' }, { from: '我', text: '下次带我！' }],
  [{ from: '佳佳', text: '今天翻到以前的日记，突然很怀旧' }, { from: '我', text: '我懂，有时候就是这样' }, { from: '佳佳', text: '时间过得好快啊' }, { from: '我', text: '是啊，所以要更珍惜现在' }]
];
const jiajiaMsgs = buildMessages(jiajiaPatterns, 8, 14);

// === 6. Kevin（音乐电影朋友） ===
const kevinPatterns = [
  [{ from: 'Kevin', text: '新出的那张专辑听了吗？' }, { from: '我', text: '还没，咋样？' }, { from: 'Kevin', text: '超棒，我已经循环一整天了' }, { from: '我', text: '马上听！' }],
  [{ from: 'Kevin', text: '这周末有个音乐节，一起去吗？' }, { from: '我', text: '好啊！' }, { from: 'Kevin', text: '我买票' }, { from: '我', text: '我请你吃饭' }],
  [{ from: 'Kevin', text: '你有没有推荐的摇滚乐队？' }, { from: '我', text: '万能青年旅店你可以听听' }, { from: 'Kevin', text: '我去试试' }, { from: 'Kevin', text: '听完了，确实厉害' }, { from: '我', text: '对吧，歌词写得特别好' }],
  [{ from: 'Kevin', text: '昨晚看了一部老电影，《海上钢琴师》' }, { from: '我', text: '经典！你居然才看' }, { from: 'Kevin', text: '太经典了，我有点不敢轻易看' }, { from: '我', text: '值得一看再看' }],
  [{ from: 'Kevin', text: '我最近在学吉他，手指好痛 😂' }, { from: '我', text: '坚持一下，过了那道坎就好了' }, { from: 'Kevin', text: '你是学了多久入门的？' }, { from: '我', text: '大概三个月吧，慢慢来' }],
  [{ from: 'Kevin', text: '今晚有电影放映，去不去？' }, { from: '我', text: '什么电影？' }, { from: 'Kevin', text: '《千与千寻》重映' }, { from: '我', text: '必须去！我买票' }],
  [{ from: 'Kevin', text: '我组了一个小乐队，下个月第一场演出' }, { from: '我', text: '哇！真的假的？！' }, { from: 'Kevin', text: '真的，你来捧场' }, { from: '我', text: '必须到！' }]
];
const kevinMsgs = buildMessages(kevinPatterns, 12, 18);

// === 7. Tina（同事/行业讨论） ===
const tinaPatterns = [
  [{ from: 'Tina', text: '你看了这周的行业报告吗？' }, { from: '我', text: '看了一部分，数据挺有意思的' }, { from: 'Tina', text: '我觉得增长那块儿的分析特别到位' }, { from: '我', text: '嗯，同意' }],
  [{ from: 'Tina', text: '下周的分享你准备了吗？' }, { from: '我', text: '差不多了，你呢' }, { from: 'Tina', text: '我还在改 PPT，总觉得差点什么' }, { from: '我', text: '发我看看，帮你把把关' }, { from: 'Tina', text: '好，多谢' }],
  [{ from: 'Tina', text: '公司新出的那套工具你用过吗？' }, { from: '我', text: '试了一下，挺不错的，效率能提升不少' }, { from: 'Tina', text: '那我也去试试' }],
  [{ from: 'Tina', text: '今晚大家聚餐，你去吗？' }, { from: '我', text: '去呀，在哪？' }, { from: 'Tina', text: '楼下川菜馆，7 点' }, { from: '我', text: '好，准时到' }],
  [{ from: 'Tina', text: '你上次分享的那本书我读完了' }, { from: '我', text: '感觉怎么样？' }, { from: 'Tina', text: '很受启发，准备重读一次' }, { from: '我', text: '好品味 👏' }],
  [{ from: 'Tina', text: '会议室你订了吗？' }, { from: '我', text: '订好了，3 号会议室下午 2 点' }, { from: 'Tina', text: '收到' }]
];
const tinaMsgs = buildMessages(tinaPatterns, 6, 20);

// === 8. Alex（旅行运动朋友） ===
const alexPatterns = [
  [{ from: 'Alex', text: '下周末去爬山吗？' }, { from: '我', text: '去哪？' }, { from: 'Alex', text: '香山，据说秋天的景色超棒' }, { from: '我', text: '好啊，一起' }],
  [{ from: 'Alex', text: '我最近在练骑行，周末骑了 60 公里' }, { from: '我', text: '厉害了！' }, { from: 'Alex', text: '下次一起骑呀' }, { from: '我', text: '好，等我准备准备' }],
  [{ from: 'Alex', text: '你那台相机借我用一下？周末要去旅行' }, { from: '我', text: '没问题，你什么时候来拿？' }, { from: 'Alex', text: '周五下班我来找你' }],
  [{ from: 'Alex', text: '刚跑完 10km，配速 PB 了！' }, { from: '我', text: '恭喜啊，多少？' }, { from: 'Alex', text: '49 分 20 秒，终于破 50 了' }, { from: '我', text: '厉害！继续加油' }],
  [{ from: 'Alex', text: '推荐你一家超级好吃的日料' }, { from: '我', text: '在哪？' }, { from: 'Alex', text: '三里屯那边，等我发地址给你' }, { from: 'Alex', text: '', type: 'image', media_url: PHOTOS.food }],
  [{ from: 'Alex', text: '我周末去了箭扣长城，真的太壮观' }, { from: 'Alex', text: '', type: 'image', media_url: PHOTOS.mountain }, { from: '我', text: '哇，看着都累但超值得' }, { from: 'Alex', text: '下次一起去！' }],
  [{ from: 'Alex', text: '滑雪季来了，你今年去崇礼吗？' }, { from: '我', text: '想去！一起啊' }, { from: 'Alex', text: '好，下个月看天气就出发' }]
];
const alexMsgs = buildMessages(alexPatterns, 10, 16);

const mockConversations = [
  { id: 'conv_xiaoyu', conversation_name: '小雨', conversation_type: 'private', avatar_url: AVATARS.xiaoyu, source: 'wechat', messages: xiaoyuMsgs, last_message: xiaoyuMsgs[xiaoyuMsgs.length - 1].content, last_message_at: xiaoyuMsgs[xiaoyuMsgs.length - 1].timestamp },
  { id: 'conv_laowang', conversation_name: '老王', conversation_type: 'private', avatar_url: AVATARS.laowang, source: 'wechat', messages: laowangMsgs, last_message: laowangMsgs[laowangMsgs.length - 1].content, last_message_at: laowangMsgs[laowangMsgs.length - 1].timestamp },
  { id: 'conv_mom', conversation_name: '妈妈', conversation_type: 'private', avatar_url: AVATARS.mom, source: 'wechat', messages: momMsgs, last_message: momMsgs[momMsgs.length - 1].content, last_message_at: momMsgs[momMsgs.length - 1].timestamp },
  { id: 'conv_dad', conversation_name: '爸爸', conversation_type: 'private', avatar_url: AVATARS.dad, source: 'wechat', messages: dadMsgs, last_message: dadMsgs[dadMsgs.length - 1].content, last_message_at: dadMsgs[dadMsgs.length - 1].timestamp },
  { id: 'conv_jiajia', conversation_name: '佳佳', conversation_type: 'private', avatar_url: AVATARS.jiajia, source: 'wechat', messages: jiajiaMsgs, last_message: jiajiaMsgs[jiajiaMsgs.length - 1].content, last_message_at: jiajiaMsgs[jiajiaMsgs.length - 1].timestamp },
  { id: 'conv_kevin', conversation_name: 'Kevin', conversation_type: 'private', avatar_url: AVATARS.kevin, source: 'wechat', messages: kevinMsgs, last_message: kevinMsgs[kevinMsgs.length - 1].content, last_message_at: kevinMsgs[kevinMsgs.length - 1].timestamp },
  { id: 'conv_tina', conversation_name: 'Tina', conversation_type: 'private', avatar_url: AVATARS.tina, source: 'wechat', messages: tinaMsgs, last_message: tinaMsgs[tinaMsgs.length - 1].content, last_message_at: tinaMsgs[tinaMsgs.length - 1].timestamp },
  { id: 'conv_alex', conversation_name: 'Alex', conversation_type: 'private', avatar_url: AVATARS.alex, source: 'wechat', messages: alexMsgs, last_message: alexMsgs[alexMsgs.length - 1].content, last_message_at: alexMsgs[alexMsgs.length - 1].timestamp }
];

mockUser.stats.totalMessages = mockConversations.reduce((s, c) => s + c.messages.length, 0);
mockUser.stats.totalChats = mockConversations.length;

/* ==========================================================================
 * 4. 聚合：聊天总结卡 / 照片组
 * ========================================================================== */

function buildChatSummaries(granularity) {
  const summaries = [];
  mockConversations.forEach(conv => {
    const buckets = {};
    conv.messages.forEach(msg => {
      const start = getPeriodStart(new Date(msg.timestamp).getTime(), granularity);
      if (!buckets[start]) {
        buckets[start] = { messages: [], keywords: {}, textCount: 0, imageCount: 0 };
      }
      buckets[start].messages.push(msg);
      if (msg.content_type === 'image') buckets[start].imageCount++;
      else buckets[start].textCount++;
    });

    Object.keys(buckets).forEach(start => {
      const b = buckets[start];
      const total = b.messages.length;
      const startTs = parseInt(start);
      const endTs = startTs +
        (granularity === 'week' ? weekMs - 1 :
         granularity === 'month' ?
           (new Date(new Date(startTs).getFullYear(), new Date(startTs).getMonth() + 1, 0).getDate()) * dayMs - 1 :
           (new Date(new Date(startTs).getFullYear(), 11, 31).getTime() - startTs));

      const excerpts = b.messages.filter(m => m.content_type !== 'image').slice(0, 3).map(m => ({
        sender: m.sender, text: m.content, timestamp: m.timestamp
      }));
      const topics = total >= 12 ? ['深度交流', '日常分享'] : total >= 5 ? ['日常闲聊', '问候'] : ['简短联系', '问候'];
      const tone = CHAT_TONES[conv.conversation_name] || '日常亲切';
      const aiCaption = '你与 ' + conv.conversation_name + ' 在这段时间聊了 ' + total + ' 条消息，' + tone + '。主要话题围绕 ' + topics.join('、') + '。';

      summaries.push({
        id: 'cs_' + conv.id + '_' + start,
        conversation_id: conv.id,
        conversation_name: conv.conversation_name,
        avatar_url: conv.avatar_url,
        granularity: granularity,
        period_start: new Date(startTs).toISOString(),
        period_end: new Date(endTs).toISOString(),
        period_label: getPeriodLabel(startTs, granularity),
        message_count: total,
        text_count: b.textCount,
        image_count: b.imageCount,
        ai_summary: { topics: topics, caption: aiCaption, highlight_text: excerpts.length > 0 ? excerpts[0].text : '' },
        excerpts: excerpts,
        occurred_at: b.messages[0].timestamp,
        sort_time: startTs
      });
    });
  });
  summaries.sort((a, b) => b.sort_time - a.sort_time);
  return summaries;
}

function buildPhotoGroups(granularity) {
  const buckets = {};
  mockPhotos.forEach(p => {
    const start = getPeriodStart(new Date(p.taken_at).getTime(), granularity);
    if (!buckets[start]) buckets[start] = { photos: [], cities: {}, keywords: {}, moods: {} };
    const b = buckets[start];
    b.photos.push(p);
    b.cities[p.city] = (b.cities[p.city] || 0) + 1;
    if (p.ai && p.ai.mood) b.moods[p.ai.mood] = (b.moods[p.ai.mood] || 0) + 1;
    if (p.ai && p.ai.keywords) p.ai.keywords.forEach(k => b.keywords[k] = (b.keywords[k] || 0) + 1);
  });

  const groups = [];
  Object.keys(buckets).forEach(start => {
    const b = buckets[start];
    if (b.photos.length < 2) return;
    const startTs = parseInt(start);
    const endTs = startTs +
      (granularity === 'week' ? weekMs - 1 :
       granularity === 'month' ?
         (new Date(new Date(startTs).getFullYear(), new Date(startTs).getMonth() + 1, 0).getDate()) * dayMs - 1 :
         (new Date(new Date(startTs).getFullYear(), 11, 31).getTime() - startTs));

    const topCities = Object.entries(b.cities).sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => e[0]);
    const topKeywords = Object.entries(b.keywords).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
    const topMoodEntry = Object.entries(b.moods).sort((a, b) => b[1] - a[1])[0];
    const coverUrls = b.photos.slice(0, 4).map(p => p.url);

    const captionText = '这' + (granularity === 'week' ? '周' : granularity === 'month' ? '个月' : '一年') +
      '你共拍了 ' + b.photos.length + ' 张照片，主要地点在 ' + topCities.join('、') +
      '。整体心情偏「' + (topMoodEntry ? topMoodEntry[0] : '平静') +
      '」，关键词有：' + topKeywords.join(' · ') + '。';

    groups.push({
      id: 'pg_' + start,
      granularity: granularity,
      period_start: new Date(startTs).toISOString(),
      period_end: new Date(endTs).toISOString(),
      period_label: getPeriodLabel(startTs, granularity),
      photo_count: b.photos.length,
      cover_urls: coverUrls,
      location_name: topCities.join(' · '),
      city: topCities[0],
      ai_summary: { caption: captionText, mood: topMoodEntry ? topMoodEntry[0] : '平静', mood_score: 0.7, keywords: topKeywords },
      photos: b.photos.slice(),
      sort_time: startTs
    });
  });

  groups.sort((a, b) => b.sort_time - a.sort_time);
  return groups;
}

function estimateGranularity(source) {
  if (source === 'chat') {
    const total = mockConversations.reduce((s, c) => s + c.messages.length, 0);
    if (total < 30) return 'month';
    if (total < 120) return 'week';
    return 'week';
  }
  if (source === 'photo') {
    if (mockPhotos.length < 60) return 'month';
    if (mockPhotos.length < 300) return 'week';
    return 'week';
  }
  return 'week';
}

/* ==========================================================================
 * 5. 跨时空对话 AI 回复
 * ========================================================================== */

const dialogAnswers = [
  { keywords: ['成都', '旅行', '宽窄巷子'], answer: '根据记录，你今年和小雨去了成都，朋友圈写着「吃了无数顿火锅，走了无数条巷子」——那是你最近一年里最放松的一次旅行。' },
  { keywords: ['加班', '工作', '累'], answer: '你有一条深夜的朋友圈：「窗外的雨好像在陪我」。但其实你也常常在加班后的清晨奖励自己一杯咖啡。请对自己好一点。' },
  { keywords: ['跑步', '半马', '马拉松'], answer: '你在厦门完成了人生第一个半马，配速虽然不快但坚持跑完。当时 Alex 和小雨都给你发了祝贺。' },
  { keywords: ['演唱会', '十年', '音乐'], answer: '那一夜你写了很长一段文字，说「有时候坚持真的值得」。你那天拍了两张照片：一张舞台，一张散场的夜色。' },
  { keywords: ['妈妈', '家人', '父母', '爸爸'], answer: '妈妈平均每周会问你一次「吃饭了吗」和「周末回不回家」。爸爸话不多，但他常常转发你发的朋友圈。有机会多回家看看。' },
  { keywords: ['夕阳', '外滩', '上海'], answer: '你在外滩拍过好几次夕阳，其中有一张配文是「天边像被点燃了一样」——那一条收到了 88 个赞。' },
  { keywords: ['朋友', '小雨', '佳佳', '聚会'], answer: '你和小雨每月至少见一次，一起吃夜宵或看电影。佳佳则是你文艺方面的同路人——你们常常互相推荐书和电影。' }
];

/* ==========================================================================
 * 5-1. 工具函数：节日/生日/日期计算
 * ========================================================================== */

/* 获取星期几的文字 */
function getWeekdayText(year, month, day) {
  const d = new Date(year, month, day);
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
}

/* 计算两个日期之间相差的天数（d2 - d1） */
function daysBetween(d1, d2) {
  const date1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const date2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((date2 - date1) / dayMs);
}

/* 获取某年的父亲节（6月第三个周日） */
function getFathersDay(year) {
  const juneFirst = new Date(year, 5, 1); // 6月1日（月份从0开始）
  const firstDayOfWeek = juneFirst.getDay(); // 0=周日
  // 第一个周日是几号
  const firstSunday = firstDayOfWeek === 0 ? 1 : 1 + (7 - firstDayOfWeek);
  // 第三个周日
  const thirdSunday = firstSunday + 14;
  return new Date(year, 5, thirdSunday);
}

/* 获取某年的母亲节（5月第二个周日） */
function getMothersDay(year) {
  const mayFirst = new Date(year, 4, 1); // 5月1日
  const firstDayOfWeek = mayFirst.getDay();
  const firstSunday = firstDayOfWeek === 0 ? 1 : 1 + (7 - firstDayOfWeek);
  const secondSunday = firstSunday + 7;
  return new Date(year, 4, secondSunday);
}

/* 生成某一年今日的 AI 总结 */
function generateYearlySummary(year, yearsAgo, photos, moments, chats) {
  const total = photos.length + moments.length + chats.length;
  if (total === 0) return '';

  const parts = [];
  if (photos.length > 0) {
    const locations = [...new Set(photos.map(p => p.city).filter(Boolean))];
    parts.push(`拍了${photos.length}张照片${locations.length > 0 ? '，在' + locations.slice(0, 2).join('、') : ''}`);
  }
  if (moments.length > 0) {
    const firstMoment = moments[0];
    const mood = firstMoment.ai && firstMoment.ai.mood ? `心情${firstMoment.ai.mood}` : '';
    parts.push(`发了${moments.length}条朋友圈${mood ? '，' + mood : ''}`);
  }
  if (chats.length > 0) {
    const names = chats.map(c => c.conversation_name).slice(0, 2);
    parts.push(`和${names.join('、')}聊了天`);
  }

  return `${yearsAgo}年前的今天，你${parts.join('；')}。`;
}

/* ==========================================================================
 * 5-2. 黑暗时刻数据（AI 严格评估 + 多源集合）
 * ========================================================================== */

let _darkMomentsCache = null;

function generateDarkMoments() {
  if (_darkMomentsCache) return _darkMomentsCache;

  // 严格筛选的黑暗时刻：AI 评估情绪评分 < 0.3 才入选
  // 每条时刻是一个集合，包含照片、朋友圈、聊天记录等多源数据
  const darkEpisodeData = [
    {
      // --- 今年的时刻 1 ---
      months_ago: 2,
      title: '连续加班低谷期',
      mood_label: '极度疲惫',
      severity: 'high',
      emotion_score: 0.22,
      ai_reason: '连续 8 天凌晨 2 点后入睡，朋友圈连续 5 条表达疲惫和迷茫，与好友聊天中出现「撑不住了」「不想干了」等关键词，情绪评分 0.22',
      period: '2026年4月中旬',
      duration_days: 8,
      // 照片
      photos: [
        { url: mockPhotos[2] ? mockPhotos[2].url : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%231a1a38%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23888%22 font-size=%2220%22%3E🌃%3C/text%3E%3C/svg%3E', caption: '凌晨2点的公司大楼' },
        { url: mockPhotos[3] ? mockPhotos[3].url : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%231a1a38%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23888%22 font-size=%2220%22%3E☕%3C/text%3E%3C/svg%3E', caption: '第N杯咖啡' }
      ],
      // 朋友圈
      moments: [
        { text: '第8天凌晨2点。不知道这样的日子什么时候是个头。', time: '凌晨 2:17', location: '北京·国贸' },
        { text: '累到不想说话，连朋友圈都不想发了。', time: '晚上 11:42', location: '北京·家' },
        { text: '窗外的雨好像在陪我。', time: '凌晨 1:47', location: '北京·国贸' }
      ],
      // 聊天记录
      chats: [
        { name: '好友小A', excerpt: '我真的撑不住了...每天都想辞职', message_count: 15 },
        { name: '家人群', excerpt: '（沉默了3天没说话）', message_count: 0 }
      ],
      location: '北京·国贸',
      in_year_2026: true
    },
    {
      // --- 今年的时刻 2 ---
      months_ago: 5,
      title: '项目失败后的自我怀疑',
      mood_label: '深度焦虑',
      severity: 'high',
      emotion_score: 0.25,
      ai_reason: '负责的核心项目上线失败，朋友圈连续一周自我否定，与 mentor 聊天中多次出现「我是不是不行」，情绪评分 0.25',
      period: '2026年1月下旬',
      duration_days: 10,
      photos: [
        { url: mockPhotos[4] ? mockPhotos[4].url : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%231a1a38%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23888%22 font-size=%2220%22%3E🌧️%3C/text%3E%3C/svg%3E', caption: '那天的下雨天' }
      ],
      moments: [
        { text: '第一次觉得自己可能真的不适合做这行。', time: '晚上 10:30', location: '北京·家' },
        { text: '大家都在前进，只有我在原地踏步。', time: '深夜 11:58', location: '' },
        { text: '失眠的第3天。', time: '凌晨 3:20', location: '北京·家' }
      ],
      chats: [
        { name: '导师老王', excerpt: '老师，我是不是真的不行...', message_count: 23 },
        { name: '好友小A', excerpt: '我好怕让所有人失望', message_count: 18 }
      ],
      location: '北京·家',
      in_year_2026: true
    },
    {
      // --- 去年的时刻 1 ---
      months_ago: 14,
      title: '一个人在异乡过年',
      mood_label: '深度孤独',
      severity: 'medium',
      emotion_score: 0.28,
      ai_reason: '春节期间独自一人留守异乡，连续 5 天社交动态为零，与家人通话中情绪低落，朋友圈仅发了一条速冻水饺照片，情绪评分 0.28',
      period: '2025年春节',
      duration_days: 7,
      photos: [
        { url: mockPhotos[5] ? mockPhotos[5].url : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%231a1a38%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23888%22 font-size=%2220%22%3E🥟%3C/text%3E%3C/svg%3E', caption: '速冻水饺就是年夜饭' }
      ],
      moments: [
        { text: '第一次一个人过年，煮了速冻水饺，看春晚。', time: '晚上 8:30', location: '北京·出租屋' },
        { text: '窗外都是烟花，我在房间里听歌。', time: '凌晨 0:15', location: '北京·出租屋' }
      ],
      chats: [
        { name: '妈妈', excerpt: '妈，我在这边挺好的...（声音哽咽）', message_count: 8 },
        { name: '大学室友群', excerpt: '（看了一眼大家发的合照，默默关掉了）', message_count: 0 }
      ],
      location: '北京·出租屋',
      in_year_2026: false
    },
    {
      // --- 去年的时刻 2 ---
      months_ago: 18,
      title: '被分手的那段日子',
      mood_label: '极度低落',
      severity: 'high',
      emotion_score: 0.18,
      ai_reason: '分手后连续两周情绪崩溃，朋友圈全部设为仅自己可见，聊天记录中多次出现「为什么是我」「我做错了什么」，深夜听歌时长暴增 300%，情绪评分 0.18',
      period: '2024年12月',
      duration_days: 14,
      photos: [
        { url: mockPhotos[6] ? mockPhotos[6].url : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%231a1a38%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23888%22 font-size=%2220%22%3E💔%3C/text%3E%3C/svg%3E', caption: '删掉了所有合照' }
      ],
      moments: [
        { text: '（仅自己可见）为什么是我...', time: '凌晨 2:45', location: '' },
        { text: '（仅自己可见）我到底做错了什么', time: '凌晨 4:10', location: '' },
        { text: '（仅自己可见）吃不下，睡不着', time: '下午 3:20', location: '北京·家' }
      ],
      chats: [
        { name: '闺蜜小李', excerpt: '我真的好难受...我走不出来', message_count: 42 },
        { name: '前任（已删除）', excerpt: '（聊天记录已清空）', message_count: 0 }
      ],
      location: '北京·家',
      in_year_2026: false
    }
  ];

  _darkMomentsCache = darkEpisodeData.map((item, idx) => {
    const ts = new Date(now - item.months_ago * 30 * dayMs);
    const photo_count = item.photos ? item.photos.length : 0;
    const moment_count = item.moments ? item.moments.length : 0;
    const chat_count = item.chats ? item.chats.length : 0;
    const total_items = photo_count + moment_count + chat_count;

    return {
      id: 'dm_' + genId(),
      title: item.title,
      detected_at: ts.toISOString(),
      detected_at_text: fmtDate(ts.toISOString()),
      period: item.period,
      duration_days: item.duration_days,
      mood_label: item.mood_label,
      severity: item.severity,
      emotion_score: item.emotion_score,
      ai_reason: item.ai_reason,
      location: item.location,
      photo_count: photo_count,
      moment_count: moment_count,
      chat_count: chat_count,
      total_items: total_items,
      photos: item.photos || [],
      moments: item.moments || [],
      chats: item.chats || [],
      in_year_2026: item.in_year_2026
    };
  });

  // 按时间倒序
  _darkMomentsCache.sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at));

  return _darkMomentsCache;
}

/* 生成黑暗时刻的 AI 总结 + 鼓励话 */
function generateDarkMomentSummary(mode) {
  const allMoments = generateDarkMoments();
  const filtered = mode === 'year'
    ? allMoments.filter(m => m.in_year_2026)
    : allMoments;

  if (filtered.length === 0) {
    return {
      total_episodes: 0,
      total_days: 0,
      worst_mood: '',
      summary_text: '今年还没有黑暗时刻，愿你一直被阳光包围 ☀️',
      encouragement_text: '',
      positive_evidence: []
    };
  }

  // 统计
  const totalDays = filtered.reduce((sum, m) => sum + (m.duration_days || 0), 0);
  const worstMood = filtered.length > 0 ? filtered[0].mood_label : '';

  // ========== AI 总结文案（根据 mode 不同而不同）==========
  let summaryText = '';
  if (mode === 'year') {
    summaryText = `今年你经历了 ${filtered.length} 段黑暗时刻，累计 ${totalDays} 天。最深的低谷是「${filtered[0].title}」，情绪评分低至 ${filtered[0].emotion_score}。但你看——每一次你都走出来了。`;
  } else {
    summaryText = `记录显示你共经历了 ${filtered.length} 段黑暗时刻，累计 ${totalDays} 天。从${filtered[filtered.length-1].title}到${filtered[0].title}，你一直在与自己对话、成长。`;
  }

  // ========== 鼓励话（根据 mode 和时间段不同而不同）==========
  // 从 mock 数据中找真实的积极记忆作为证据
  const positiveMoments = mockMoments.filter(m => {
    const d = new Date(m.occurred_at);
    return d.getFullYear() === 2026;
  });
  const positiveChats = mockConversations.filter(c => {
    const latestMsg = c.messages[c.messages.length - 1];
    if (!latestMsg) return false;
    const d = new Date(latestMsg.timestamp);
    return d.getFullYear() === 2026;
  });

  let positiveEvidence = [];
  let encouragementText = '';

  if (mode === 'year') {
    // 今年模式：结合今年最近的积极记忆，对比今年的黑暗时刻
    // 找今年最近的积极朋友圈
    const recentPositiveMoment = positiveMoments.length > 0
      ? positiveMoments[positiveMoments.length - 1]
      : null;
    const recentPositiveChat = positiveChats.length > 0
      ? positiveChats[positiveChats.length - 1]
      : null;

    positiveEvidence = [
      { type: 'photo', text: '5月初你拍的奥森公园晨跑照片，阳光洒在你脸上 🌅' },
      { type: 'moment', text: '3月你发朋友圈：「今天独立完成项目复盘，虽然过程很艰难，但学到了很多」✨' },
      { type: 'chat', text: '和导师老王的聊天里你说：「老师，我想通了，失败也是成长的一部分」💪' }
    ];

    encouragementText = `但看看现在的你——

5月初你去奥森晨跑，阳光洒在你脸上；3月你独立完成项目复盘后发朋友圈说学到了很多；和导师聊天时你说想通了，失败也是成长的一部分。

今年那些以为熬不过去的夜晚，都变成了你脚下的路。你比自己想象的更强大。🌟`;
  } else {
    // 所有模式：结合最近的积极记忆（2026年），对比所有历史黑暗时刻
    positiveEvidence = [
      { type: 'photo', text: '上周和朋友去公园野餐的照片，你笑得很灿烂 🌸' },
      { type: 'moment', text: '你发朋友圈说：「今天天气真好，骑车去上班心情都变好了」☀️' },
      { type: 'chat', text: '和小A的聊天里你说：「最近状态越来越好了，找到了新的节奏」💪' }
    ];

    encouragementText = `但看看现在的你——

上周和朋友去公园野餐，你笑得那么灿烂；你发朋友圈说今天骑车上班心情真好；和好朋友聊天时你说找到了新的节奏。

从2024年被分手的崩溃，到2025年一个人在异乡过年，再到今年连续加班的低谷——每一次你都走过来了。那些打不倒你的，终会让你更强大。🌟`;
  }

  return {
    total_episodes: filtered.length,
    total_days: totalDays,
    worst_mood: worstMood,
    summary_text: summaryText,
    encouragement_text: encouragementText,
    positive_evidence: positiveEvidence
  };
}

/* ==========================================================================
 * 5-3. 暖心时刻数据（AI 识别高能量温暖时刻 + 多源集合）
 * ========================================================================== */

let _warmMomentsCache = null;

function generateWarmMoments() {
  if (_warmMomentsCache) return _warmMomentsCache;

  // 暖心时刻：AI 评估情绪评分 > 0.7 才入选
  // 每条时刻是一个集合，包含照片、朋友圈、聊天记录等多源数据
  const warmEpisodeData = [
    {
      // --- 今年的时刻 1 ---
      months_ago: 1,
      title: '奥森晨跑的清晨',
      mood_label: '元气满满',
      warmth_level: 'high',
      emotion_score: 0.85,
      ai_reason: '连续 5 天清晨 6 点起床去奥森跑步，朋友圈连续分享晨跑照片和日出，与好友聊天中充满「太舒服了」「今天状态超好」等积极词汇，情绪评分 0.85',
      period: '2026年5月中旬',
      duration_days: 5,
      photos: [
        { url: mockPhotos[0] ? mockPhotos[0].url : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%231a1a38%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23888%22 font-size=%2220%22%3E🌅%3C/text%3E%3C/svg%3E', caption: '奥森的日出' },
        { url: mockPhotos[1] ? mockPhotos[1].url : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%231a1a38%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23888%22 font-size=%2220%22%3E🏃%3C/text%3E%3C/svg%3E', caption: '跑完10公里的自己' }
      ],
      moments: [
        { text: '奥森的日出太美了！跑完10公里，整个人都通透了。', time: '早上 7:30', location: '北京·奥林匹克森林公园' },
        { text: '连续第5天晨跑，原来早起真的会上瘾。', time: '早上 8:15', location: '北京·家' },
        { text: '阳光洒在脸上的时候，觉得一切都值得。', time: '早上 7:45', location: '北京·奥林匹克森林公园' }
      ],
      chats: [
        { name: '跑友小林', excerpt: '明天还约吗？我已经爱上早起了！', message_count: 12 },
        { name: '妈妈', excerpt: '儿子，看到你朋友圈了，注意身体别太累', message_count: 5 }
      ],
      location: '北京·奥林匹克森林公园',
      in_year_2026: true
    },
    {
      // --- 今年的时刻 2 ---
      months_ago: 3,
      title: '项目成功上线的庆祝',
      mood_label: '成就感爆棚',
      warmth_level: 'high',
      emotion_score: 0.88,
      ai_reason: '独立负责的项目成功上线，朋友圈发布庆祝动态获得大量点赞，团队群里被同事疯狂夸奖，与导师聊天中表达「终于做到了」的激动，情绪评分 0.88',
      period: '2026年3月下旬',
      duration_days: 3,
      photos: [
        { url: mockPhotos[7] ? mockPhotos[7].url : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%231a1a38%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23888%22 font-size=%2220%22%3E🎉%3C/text%3E%3C/svg%3E', caption: '项目上线截图' },
        { url: mockPhotos[8] ? mockPhotos[8].url : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%231a1a38%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23888%22 font-size=%2220%22%3E🍻%3C/text%3E%3C/svg%3E', caption: '团队聚餐' }
      ],
      moments: [
        { text: '今天项目终于上线了！第一次独立负责，紧张但超有成就感！', time: '下午 6:30', location: '北京·公司' },
        { text: '团队聚餐，大家说我进步很大，眼眶有点湿。', time: '晚上 9:15', location: '北京·海底捞' },
        { text: '感谢这段时间没有放弃的自己。', time: '深夜 11:20', location: '北京·家' }
      ],
      chats: [
        { name: '工作群', excerpt: '恭喜恭喜！项目上线成功！', message_count: 38 },
        { name: '导师老王', excerpt: '做得非常好，我看到了你的成长', message_count: 8 }
      ],
      location: '北京·公司',
      in_year_2026: true
    },
    {
      // --- 去年的时刻 1 ---
      months_ago: 12,
      title: '回家过年的温暖',
      mood_label: '幸福满溢',
      warmth_level: 'high',
      emotion_score: 0.82,
      ai_reason: '春节回家与家人团聚，朋友圈分享大量家庭合照和美食，与妈妈聊天中充满关心和温暖，连续 7 天情绪评分都在 0.8 以上，情绪评分 0.82',
      period: '2025年春节',
      duration_days: 7,
      photos: [
        { url: mockPhotos[9] ? mockPhotos[9].url : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%231a1a38%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23888%22 font-size=%2220%22%3E👨‍👩‍👦%3C/text%3E%3C/svg%3E', caption: '全家福' },
        { url: mockPhotos[10] ? mockPhotos[10].url : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%231a1a38%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23888%22 font-size=%2220%22%3E🍲%3C/text%3E%3C/svg%3E', caption: '妈妈做的红烧肉' }
      ],
      moments: [
        { text: '回家的感觉真好，妈妈做的红烧肉还是小时候的味道。', time: '晚上 7:00', location: '老家' },
        { text: '和爸爸下棋，赢了一局，他笑得像个孩子。', time: '下午 3:30', location: '老家' },
        { text: '一家人围在一起看春晚，这才是过年。', time: '晚上 8:30', location: '老家' }
      ],
      chats: [
        { name: '妈妈', excerpt: '儿子，妈给你做了你最爱吃的，快回来', message_count: 15 },
        { name: '家人群', excerpt: '（满屏的红包和祝福）', message_count: 56 }
      ],
      location: '老家',
      in_year_2026: false
    },
    {
      // --- 去年的时刻 2 ---
      months_ago: 16,
      title: '和好友的西藏之旅',
      mood_label: '自由畅快',
      warmth_level: 'medium',
      emotion_score: 0.78,
      ai_reason: '和好友自驾西藏，朋友圈连续分享沿途风景和旅行感悟，聊天记录中充满「太美了」「人生值得」等感叹，情绪评分 0.78',
      period: '2025年2月',
      duration_days: 10,
      photos: [
        { url: mockPhotos[11] ? mockPhotos[11].url : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%231a1a38%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23888%22 font-size=%2220%22%3E🏔️%3C/text%3E%3C/svg%3E', caption: '布达拉宫' },
        { url: mockPhotos[12] ? mockPhotos[12].url : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%231a1a38%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23888%22 font-size=%2220%22%3E🚗%3C/text%3E%3C/svg%3E', caption: '318国道' }
      ],
      moments: [
        { text: '站在布达拉宫前，突然觉得所有的烦恼都不重要了。', time: '下午 4:30', location: '拉萨' },
        { text: '和好友自驾318，一路风景一路歌，这就是活着的意义吧。', time: '晚上 8:00', location: '林芝' },
        { text: '星空下的帐篷，好友说：「我们要一直这样自由下去。」', time: '凌晨 1:00', location: '纳木错' }
      ],
      chats: [
        { name: '好友小A', excerpt: '这次旅行太值了，下次我们去新疆！', message_count: 28 },
        { name: '旅行群', excerpt: '（分享了200张照片）', message_count: 45 }
      ],
      location: '西藏',
      in_year_2026: false
    }
  ];

  _warmMomentsCache = warmEpisodeData.map((item, idx) => {
    const ts = new Date(now - item.months_ago * 30 * dayMs);
    const photo_count = item.photos ? item.photos.length : 0;
    const moment_count = item.moments ? item.moments.length : 0;
    const chat_count = item.chats ? item.chats.length : 0;
    const total_items = photo_count + moment_count + chat_count;

    return {
      id: 'wm_' + genId(),
      title: item.title,
      detected_at: ts.toISOString(),
      detected_at_text: fmtDate(ts.toISOString()),
      period: item.period,
      duration_days: item.duration_days,
      mood_label: item.mood_label,
      warmth_level: item.warmth_level,
      emotion_score: item.emotion_score,
      ai_reason: item.ai_reason,
      location: item.location,
      photo_count: photo_count,
      moment_count: moment_count,
      chat_count: chat_count,
      total_items: total_items,
      photos: item.photos || [],
      moments: item.moments || [],
      chats: item.chats || [],
      in_year_2026: item.in_year_2026
    };
  });

  // 按时间倒序
  _warmMomentsCache.sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at));

  return _warmMomentsCache;
}

/* 生成暖心时刻的 AI 总结 + 温暖寄语 */
function generateWarmMomentSummary(mode) {
  const allMoments = generateWarmMoments();
  const filtered = mode === 'year'
    ? allMoments.filter(m => m.in_year_2026)
    : allMoments;

  if (filtered.length === 0) {
    return {
      total_episodes: 0,
      total_days: 0,
      best_mood: '',
      summary_text: '今年还没有暖心时刻，去创造属于你的温暖吧 ☀️',
      warm_message_text: '',
      warm_evidence: []
    };
  }

  // 统计
  const totalDays = filtered.reduce((sum, m) => sum + (m.duration_days || 0), 0);
  const bestMood = filtered.length > 0 ? filtered[0].mood_label : '';

  // AI 总结文案
  let summaryText = '';
  if (mode === 'year') {
    summaryText = `今年你经历了 ${filtered.length} 段暖心时刻，累计 ${totalDays} 天。最温暖的时刻是「${filtered[0].title}」，情绪评分高达 ${filtered[0].emotion_score}。这些光芒，是你给自己的礼物。`;
  } else {
    summaryText = `记录显示你共经历了 ${filtered.length} 段暖心时刻，累计 ${totalDays} 天。从${filtered[filtered.length-1].title}到${filtered[0].title}，你的生命里从不缺少温暖。`;
  }

  // 温暖寄语
  let warmMessageText = '';
  let warmEvidence = [];

  if (mode === 'year') {
    warmEvidence = [
      { type: 'photo', text: '5月奥森晨跑时你拍下的日出，阳光正好 🌅' },
      { type: 'moment', text: '3月项目上线后你发朋友圈：「感谢没有放弃的自己」✨' },
      { type: 'chat', text: '和妈妈的聊天里她说：「儿子，妈给你做了你最爱吃的」❤️' }
    ];

    warmMessageText = `这些温暖不是偶然——

5月你在奥森拍下的日出，是你连续5天早起跑出来的；3月项目上线后的成就感，是你熬过无数次加班换来的；妈妈给你做的红烧肉，是你每年回家都不变的牵挂。

你值得拥有这些美好，因为你一直在努力成为更好的自己。☀️`;
  } else {
    warmEvidence = [
      { type: 'photo', text: '西藏之旅中你和好友在纳木错看星空的照片 🌌' },
      { type: 'moment', text: '回家过年时你发朋友圈：「一家人围在一起看春晚，这才是过年」🏠' },
      { type: 'chat', text: '导师老王说：「做得非常好，我看到了你的成长」💪' }
    ];

    warmMessageText = `你的生命里从不缺少温暖——

从西藏纳木错的星空，到回家过年的全家福；从项目上线时团队的掌声，到奥森晨跑时的第一缕阳光。

这些时刻像星星一样散落在你的记忆里，提醒你：无论多难，你都有让自己幸福的能力。☀️`;
  }

  return {
    total_episodes: filtered.length,
    total_days: totalDays,
    best_mood: bestMood,
    summary_text: summaryText,
    warm_message_text: warmMessageText,
    warm_evidence: warmEvidence
  };
}

/* ==========================================================================
 * 6. API 路由表
 * ========================================================================== */

const ROUTES = {
  /* ---------- 用户 ---------- */
  'POST /api/auth/phone': () => ({ token: 'mock_jwt_token_dev_' + Date.now(), user: mockUser }),
  'GET /api/user/me': () => ({ user: mockUser }),

  /* ---------- 胶囊 ---------- */
  'GET /api/capsules': (params) => {
    let list = mockCapsules;
    if (params && params.status && params.status !== 'all') list = list.filter(c => c.status === params.status);
    const page = parseInt(params && params.page) || 1;
    const size = parseInt(params && params.size) || 20;
    const start = (page - 1) * size;
    return {
      items: list.slice(start, start + size).map(c => ({ ...c, sealed_at_text: fmtDate(c.sealed_at), unlock_at_text: fmtDate(c.unlock_at) })),
      total: list.length, page: page, page_size: size
    };
  },
  'POST /api/capsules': (data) => {
    const capsule = {
      id: genId(), title: data.title, status: 'sealed', seal_style: 'classic',
      sealed_at: new Date().toISOString(), unlock_at: data.unlock_at || new Date(now + 365 * dayMs).toISOString(),
      cover_url: PHOTOS.sunset, content: { text: data.message || '' }
    };
    mockCapsules.unshift(capsule);
    return { capsule: capsule };
  },
  'GET /api/capsules/': (params, urlParts) => {
    const id = urlParts[3];
    const capsule = mockCapsules.find(c => c.id === id);
    if (!capsule) return { __error: { code: 404, message: '胶囊不存在' } };
    return { capsule: { ...capsule, sealed_at_text: fmtDate(capsule.sealed_at), unlock_at_text: fmtDate(capsule.unlock_at) }, photos: capsule.photos || [] };
  },

  /* ---------- 对话 AI ---------- */
  'POST /api/dialog': (data) => {
    const q = (data && data.query ? data.query : '').toString();
    let hit = dialogAnswers[0];
    for (let i = 0; i < dialogAnswers.length; i++) {
      const item = dialogAnswers[i];
      if (item.keywords.some(kw => q.indexOf(kw) !== -1)) { hit = item; break; }
    }
    return { answer: hit.answer, sources: [{ capsule_id: mockCapsules[0].id, snippet: '胶囊：' + mockCapsules[0].title }] };
  },

  /* ---------- 照片（列表/上传） ---------- */
  'POST /api/photos/upload': () => { const p = mockPhotos[0]; return { photo: { id: p.id, url: p.url, thumb_url: p.thumb_url } }; },
  'GET /api/photos': (params) => {
    const page = parseInt(params && params.page) || 1;
    const size = parseInt(params && params.size) || 20;
    const start = (page - 1) * size;
    return { items: mockPhotos.slice(start, start + size), total: mockPhotos.length, page: page, page_size: size };
  },

  /* ---------- 照片组（聚合） ---------- */
  'GET /api/photos/groups': (params) => {
    const granularity = (params && params.granularity) || estimateGranularity('photo');
    const page = parseInt(params && params.page) || 1;
    const size = parseInt(params && params.size) || 10;
    const groups = buildPhotoGroups(granularity);
    const start = (page - 1) * size;
    const items = groups.slice(start, start + size).map(g => ({
      id: g.id, granularity: g.granularity,
      period_start: g.period_start, period_end: g.period_end, period_label: g.period_label,
      photo_count: g.photo_count, cover_urls: g.cover_urls,
      location_name: g.location_name, ai_summary: g.ai_summary
    }));
    return { items: items, total: groups.length, page: page, page_size: size, granularity: granularity };
  },
  'GET /api/photos/groups/': (params, urlParts) => {
    const id = urlParts[4];
    const granularity = (params && params.granularity) || estimateGranularity('photo');
    const groups = buildPhotoGroups(granularity);
    const g = groups.find(x => x.id === id);
    if (!g) return { __error: { code: 404, message: '照片组不存在' } };
    const page = parseInt(params && params.page) || 1;
    const size = parseInt(params && params.size) || 30;
    const start = (page - 1) * size;
    return {
      group: {
        id: g.id, granularity: g.granularity, period_label: g.period_label,
        period_start: g.period_start, period_end: g.period_end,
        photo_count: g.photo_count, cover_urls: g.cover_urls,
        location_name: g.location_name, ai_summary: g.ai_summary
      },
      photos: g.photos.slice(start, start + size).map(p => ({
        id: p.id, url: p.url, thumb_url: p.thumb_url, taken_at: p.taken_at,
        taken_at_text: fmtDate(p.taken_at), location_name: p.location_name, city: p.city
      })),
      total: g.photos.length, page: page, page_size: size
    };
  },

  /* ---------- 朋友圈 ---------- */
  'GET /api/moments': (params) => {
    const page = parseInt(params && params.page) || 1;
    const size = parseInt(params && params.size) || 20;
    const max = parseInt(params && params.max) || mockMoments.length;
    const items = mockMoments.slice(0, max);
    const start = (page - 1) * size;
    const paginated = items.slice(start, start + size);
    return { items: paginated, total: items.length, page: page, page_size: size, total_available: mockMoments.length };
  },

  /* ---------- 聊天：会话列表 ---------- */
  'POST /api/chats/import': () => ({
    imported_count: mockConversations.length,
    total_messages: mockConversations.reduce((s, c) => s + c.messages.length, 0)
  }),
  'GET /api/chats/conversations': () => {
    const items = mockConversations.map(c => ({
      id: c.id, conversation_name: c.conversation_name, conversation_type: c.conversation_type,
      avatar_url: c.avatar_url, source: c.source, last_message: c.last_message,
      last_message_at: c.last_message_at, last_message_at_text: fmtDateTime(c.last_message_at),
      message_count: c.messages.length
    }));
    return { items: items, total: items.length };
  },

  /* ---------- 聊天：总结卡 ---------- */
  'GET /api/chats/summaries': (params) => {
    const granularity = (params && params.granularity) || estimateGranularity('chat');
    const page = parseInt(params && params.page) || 1;
    const size = parseInt(params && params.size) || 10;
    const summaries = buildChatSummaries(granularity);
    const start = (page - 1) * size;
    const items = summaries.slice(start, start + size);
    return { items: items, total: summaries.length, page: page, page_size: size, granularity: granularity };
  },
  'GET /api/chats/summaries/': (params, urlParts) => {
    const id = urlParts[4];
    const granularity = (params && params.granularity) || estimateGranularity('chat');
    const summaries = buildChatSummaries(granularity);
    const summary = summaries.find(s => s.id === id);
    if (!summary) return { __error: { code: 404, message: '总结卡不存在' } };

    const conv = mockConversations.find(c => c.id === summary.conversation_id);
    const startTs = new Date(summary.period_start).getTime();
    const endTs = new Date(summary.period_end).getTime();
    const periodMessages = conv.messages.filter(m => {
      const t = new Date(m.timestamp).getTime();
      return t >= startTs && t <= endTs;
    });
    const messages = periodMessages.map(m => ({
      ...m,
      timestamp_text: fmtDateTime(m.timestamp),
      is_me: m.sender === '我',
      avatar_url: m.sender === '我' ? AVATARS.me : conv.avatar_url
    }));

    return {
      summary: {
        id: summary.id, conversation_id: summary.conversation_id,
        conversation_name: summary.conversation_name, avatar_url: summary.avatar_url,
        granularity: summary.granularity, period_start: summary.period_start,
        period_end: summary.period_end, period_label: summary.period_label,
        message_count: summary.message_count, ai_summary: summary.ai_summary,
        excerpts: summary.excerpts
      },
      messages: messages, total_messages: messages.length
    };
  },

  /* ---------- 聊天：单会话详情（支持定位） ---------- */
  'GET /api/chats/conversations/': (params, urlParts) => {
    const id = urlParts[4];
    const conv = mockConversations.find(c => c.id === id);
    if (!conv) return { __error: { code: 404, message: '会话不存在' } };

    const size = parseInt(params && params.size) || 50;
    const cursor = parseInt(params && params.cursor) || 0;
    const ordered = conv.messages.slice();
    const messages = ordered.slice(cursor, cursor + size).map(m => ({
      ...m,
      timestamp_text: fmtDateTime(m.timestamp),
      is_me: m.sender === '我',
      avatar_url: m.sender === '我' ? AVATARS.me : conv.avatar_url
    }));

    let anchor_index = -1;
    if (params && params.period_start) {
      const anchorTs = new Date(decodeURIComponent(params.period_start)).getTime();
      for (let i = 0; i < ordered.length; i++) {
        if (new Date(ordered[i].timestamp).getTime() >= anchorTs) { anchor_index = i - cursor; break; }
      }
    }
    const nextCursor = cursor + size < ordered.length ? cursor + size : null;

    return {
      conversation: {
        id: conv.id, conversation_name: conv.conversation_name,
        conversation_type: conv.conversation_type, avatar_url: conv.avatar_url,
        message_count: conv.messages.length
      },
      messages: messages, next_cursor: nextCursor, anchor_index: anchor_index, total_messages: ordered.length
    };
  },

  /* ---------- 记忆时间线（混合三类，支持按类别过滤） ---------- */
  'GET /api/memories': (params) => {
    const source = params && params.source;
    const page = parseInt(params && params.page) || 1;
    const size = parseInt(params && params.size) || 30;
    const granularity = params && params.granularity || 'auto';

    const chatCards = [];
    const photoCards = [];
    const momentCards = [];

    // 聊天总结卡
    if (!source || source === 'chat') {
      const g = granularity === 'auto' ? estimateGranularity('chat') : granularity;
      const summaries = buildChatSummaries(g);
      summaries.forEach(s => {
        chatCards.push({
          _id: 'cs_' + s.id, type: 'chat_summary',
          sort_time: s.sort_time, occurred_at: s.occurred_at,
          occurred_at_text: fmtDate(s.occurred_at),
          data: {
            id: s.id, conversation_id: s.conversation_id,
            conversation_name: s.conversation_name, avatar_url: s.avatar_url,
            period_label: s.period_label, message_count: s.message_count,
            granularity: s.granularity, ai_summary: s.ai_summary
          }
        });
      });
    }

    // 照片组卡
    if (!source || source === 'photo') {
      const g = granularity === 'auto' ? estimateGranularity('photo') : granularity;
      const groups = buildPhotoGroups(g);
      groups.forEach(g2 => {
        photoCards.push({
          _id: 'pg_' + g2.id, type: 'photo_group',
          sort_time: g2.sort_time, occurred_at: g2.period_start,
          occurred_at_text: fmtDate(g2.period_start),
          data: {
            id: g2.id, period_label: g2.period_label,
            photo_count: g2.photo_count, cover_urls: g2.cover_urls,
            location_name: g2.location_name,
            granularity: g2.granularity, ai_summary: g2.ai_summary
          }
        });
      });
    }

    // 朋友圈（单条）
    if (!source || source === 'moment') {
      const maxMoment = source === 'moment' ? mockMoments.length : Math.min(50, mockMoments.length);
      mockMoments.slice(0, maxMoment).forEach(m => {
        momentCards.push({
          _id: 'mm_' + m.id, type: 'moment',
          sort_time: new Date(m.occurred_at).getTime(),
          occurred_at: m.occurred_at, occurred_at_text: m.occurred_at_text,
          data: m
        });
      });
    }

    let cards = [];
    if (source === 'chat') {
      cards = chatCards;
    } else if (source === 'photo') {
      cards = photoCards;
    } else if (source === 'moment') {
      cards = momentCards;
    } else {
      // 全部：混合三类，确保不会某一类霸占首屏
      // 策略：先各自按时间倒序排序，然后交叉合并（轮询取）
      chatCards.sort((a, b) => b.sort_time - a.sort_time);
      photoCards.sort((a, b) => b.sort_time - a.sort_time);
      momentCards.sort((a, b) => b.sort_time - a.sort_time);

      // 轮询：从 chat, photo, moment 各取一条，直到全部取出
      const maxLen = Math.max(chatCards.length, photoCards.length, momentCards.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < chatCards.length) cards.push(chatCards[i]);
        if (i < photoCards.length) cards.push(photoCards[i]);
        if (i < momentCards.length) cards.push(momentCards[i]);
      }
    }

    // 关键词过滤
    if (params && params.keyword) {
      const kw = params.keyword;
      cards = cards.filter(c => {
        const text =
          (c.data && c.data.ai_summary && c.data.ai_summary.caption) ||
          (c.data && c.data.content && c.data.content.text) ||
          (c.data && c.data.location_name) ||
          (c.data && c.data.conversation_name) || '';
        return text.indexOf(kw) !== -1;
      });
    }

    // 单一分类：统一按时间倒序排序
    if (source) {
      cards.sort((a, b) => b.sort_time - a.sort_time);
    }

    const start = (page - 1) * size;
    const pageItems = cards.slice(start, start + size);

    return {
      items: pageItems,
      total: cards.length,
      page: page,
      page_size: size,
      total_moments: mockMoments.length,
      moments_on_timeline: Math.min(50, mockMoments.length),
      granularity_used: granularity
    };
  },

  /* ---------- N年今日：首页卡片（AI 总结） ---------- */
  'GET /api/on-this-day': () => {
    const today = new Date();
    const month = today.getMonth();
    const day = today.getDate();
    const currentYear = today.getFullYear();

    // 收集历年今日的记忆
    const yearsData = [];
    for (let yearsAgo = 1; yearsAgo <= 5; yearsAgo++) {
      const targetYear = currentYear - yearsAgo;
      const yearPhotos = mockPhotos.filter(p => {
        const d = new Date(p.taken_at);
        return d.getFullYear() === targetYear && d.getMonth() === month && d.getDate() === day;
      });
      const yearMoments = mockMoments.filter(m => {
        const d = new Date(m.occurred_at);
        return d.getFullYear() === targetYear && d.getMonth() === month && d.getDate() === day;
      });
      // 聊天记录：找当天有消息的会话
      const yearChats = [];
      mockConversations.forEach(conv => {
        const dayMsgs = conv.messages.filter(msg => {
          const d = new Date(msg.timestamp);
          return d.getFullYear() === targetYear && d.getMonth() === month && d.getDate() === day;
        });
        if (dayMsgs.length > 0) {
          yearChats.push({
            conversation_id: conv.id,
            conversation_name: conv.conversation_name,
            avatar_url: conv.avatar_url,
            message_count: dayMsgs.length,
            excerpt: dayMsgs[Math.floor(dayMsgs.length / 2)].content
          });
        }
      });

      const totalItems = yearPhotos.length + yearMoments.length + yearChats.length;

      yearsData.push({
        years_ago: yearsAgo,
        year: targetYear,
        date_text: `${targetYear}年${month + 1}月${day}日`,
        has_content: totalItems > 0,
        photo_count: yearPhotos.length,
        moment_count: yearMoments.length,
        chat_count: yearChats.length,
        total_count: totalItems,
        photos: yearPhotos.slice(0, 6).map(p => ({ id: p.id, url: p.url, location_name: p.location_name })),
        moments: yearMoments.slice(0, 3).map(m => ({
          id: m.id,
          text: m.content.text,
          location_name: m.location_name,
          mood: m.ai && m.ai.mood
        })),
        chats: yearChats.slice(0, 2)
      });
    }

    // 计算整体统计
    const totalMemories = yearsData.reduce((sum, y) => sum + y.total_count, 0);
    const yearsWithContent = yearsData.filter(y => y.has_content).length;

    // 生成 AI 总结文案
    let aiSummary = '';
    if (totalMemories === 0) {
      aiSummary = '这一天还没有留下记忆，去创造属于今天的故事吧 ✨';
    } else {
      const latestYear = yearsData.find(y => y.has_content);
      if (latestYear) {
        const items = [];
        if (latestYear.photo_count > 0) items.push(`${latestYear.photo_count}张照片`);
        if (latestYear.moment_count > 0) items.push(`${latestYear.moment_count}条朋友圈`);
        if (latestYear.chat_count > 0) items.push(`${latestYear.chat_count}段对话`);
        aiSummary = `${latestYear.years_ago}年前的今天，你留下了${items.join('、')}。${yearsWithContent > 1 ? `再往前翻翻，还有${yearsWithContent - 1}年的今日记忆等你发现…` : ''}`;
      }
    }

    return {
      date_text: `${month + 1}月${day}日`,
      weekday_text: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][today.getDay()],
      ai_summary: aiSummary,
      total_memories: totalMemories,
      years_with_content: yearsWithContent,
      years: yearsData
    };
  },

  /* ---------- N年今日：详情页数据（按年份分组） ---------- */
  'GET /api/on-this-day/detail': () => {
    const today = new Date();
    const month = today.getMonth();
    const day = today.getDate();
    const currentYear = today.getFullYear();

    const yearsData = [];
    for (let yearsAgo = 1; yearsAgo <= 5; yearsAgo++) {
      const targetYear = currentYear - yearsAgo;

      // 照片
      const yearPhotos = mockPhotos.filter(p => {
        const d = new Date(p.taken_at);
        return d.getFullYear() === targetYear && d.getMonth() === month && d.getDate() === day;
      });

      // 朋友圈
      const yearMoments = mockMoments.filter(m => {
        const d = new Date(m.occurred_at);
        return d.getFullYear() === targetYear && d.getMonth() === month && d.getDate() === day;
      });

      // 聊天
      const yearChats = [];
      mockConversations.forEach(conv => {
        const dayMsgs = conv.messages.filter(msg => {
          const d = new Date(msg.timestamp);
          return d.getFullYear() === targetYear && d.getMonth() === month && d.getDate() === day;
        });
        if (dayMsgs.length > 0) {
          yearChats.push({
            conversation_id: conv.id,
            conversation_name: conv.conversation_name,
            avatar_url: conv.avatar_url,
            message_count: dayMsgs.length,
            excerpts: dayMsgs.slice(0, 3).map(m => ({
              sender: m.sender,
              content: m.content,
              is_me: m.sender === '我'
            }))
          });
        }
      });

      const totalCount = yearPhotos.length + yearMoments.length + yearChats.length;

      yearsData.push({
        years_ago: yearsAgo,
        year: targetYear,
        date_text: `${targetYear}年${month + 1}月${day}日`,
        weekday_text: getWeekdayText(targetYear, month, day),
        has_content: totalCount > 0,
        photo_count: yearPhotos.length,
        moment_count: yearMoments.length,
        chat_count: yearChats.length,
        total_count: totalCount,
        photos: yearPhotos,
        moments: yearMoments,
        chats: yearChats,
        ai_summary: generateYearlySummary(targetYear, yearsAgo, yearPhotos, yearMoments, yearChats)
      });
    }

    return {
      date_text: `${month + 1}月${day}日`,
      weekday_text: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][today.getDay()],
      years: yearsData
    };
  },

  /* ---------- 呵护提醒：家人节日和生日关怀 ---------- */
  'GET /api/holiday-today': () => {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const day = today.getDate();

    const reminders = [];

    // === 家人呵护配置 ===
    // 为了演示效果：今天设为父亲节，母亲生日设为5天后
    // 实际使用时根据真实日期计算
    const demoMode = true; // 演示模式：确保有2条卡片展示

    if (demoMode) {
      // 卡片1：今天是父亲节
      reminders.push({
        id: 'care_father_today',
        type: 'care_today',
        category: 'father',
        title: '今天是父亲节',
        emoji: '👨',
        icon_bg: 'rgba(59, 130, 246, 0.2)',
        care_message: '爸爸沉默寡言，却用肩膀扛起了整个家。今天别忘了给他打个电话，说声辛苦了。',
        blessing_text: '爸爸，父亲节快乐！谢谢您一直以来默默的付出与守护，我爱您！❤️',
        is_today: true,
        days_left: 0,
        person: '父亲',
        action_text: '送祝福'
      });

      // 卡片2：5天后是母亲生日
      reminders.push({
        id: 'care_mother_soon',
        type: 'care_upcoming',
        category: 'mother',
        title: '5天后是妈妈的生日',
        emoji: '🎂',
        icon_bg: 'rgba(236, 72, 153, 0.2)',
        care_message: '妈妈的生日总是记得比谁都清楚，今年也别忘记提前准备好心意哦～',
        blessing_text: '',
        is_today: false,
        days_left: 5,
        person: '妈妈',
        action_text: '记下了'
      });
    } else {
      // 真实日期计算模式（备用）
      // 父亲节（6月第三个周日）
      const fathersDay = getFathersDay(today.getFullYear());
      const fathersDayDiff = daysBetween(today, fathersDay);
      if (fathersDayDiff === 0) {
        reminders.push({
          id: 'care_father_today',
          type: 'care_today',
          category: 'father',
          title: '今天是父亲节',
          emoji: '👨',
          icon_bg: 'rgba(59, 130, 246, 0.2)',
          care_message: '爸爸沉默寡言，却用肩膀扛起了整个家。今天别忘了给他打个电话，说声辛苦了。',
          blessing_text: '爸爸，父亲节快乐！谢谢您一直以来默默的付出与守护，我爱您！❤️',
          is_today: true,
          days_left: 0,
          person: '父亲',
          action_text: '送祝福'
        });
      }

      // 母亲节（5月第二个周日）
      const mothersDay = getMothersDay(today.getFullYear());
      const mothersDayDiff = daysBetween(today, mothersDay);
      if (mothersDayDiff === 0) {
        reminders.push({
          id: 'care_mother_today',
          type: 'care_today',
          category: 'mother',
          title: '今天是母亲节',
          emoji: '👩',
          icon_bg: 'rgba(236, 72, 153, 0.2)',
          care_message: '妈妈的爱藏在每一顿热饭、每一句叮嘱里。今天给她一个大大的拥抱吧。',
          blessing_text: '妈妈，母亲节快乐！谢谢您无私的爱与付出，我爱您！❤️',
          is_today: true,
          days_left: 0,
          person: '母亲',
          action_text: '送祝福'
        });
      }

      // 家人生日
      const familyBirthdays = [
        { name: '爸爸', relation: 'father', month: 6, day: 28, emoji: '🎂', icon_bg: 'rgba(59, 130, 246, 0.2)',
          care_message: '爸爸的生日总是记不住？今年提前准备，给他一个惊喜吧。',
          blessing_text: '爸爸，生日快乐！愿您身体健康，笑口常开！🎂❤️' },
        { name: '妈妈', relation: 'mother', month: 7, day: 3, emoji: '🎂', icon_bg: 'rgba(236, 72, 153, 0.2)',
          care_message: '妈妈的生日总是记得比谁都清楚，今年也别忘记提前准备好心意哦～',
          blessing_text: '妈妈，生日快乐！愿您永远年轻美丽，幸福安康！🎂❤️' }
      ];

      familyBirthdays.forEach(b => {
        const birthday = new Date(today.getFullYear(), b.month - 1, b.day);
        const diff = daysBetween(today, birthday);

        if (diff === 0) {
          reminders.push({
            id: `care_birthday_${b.relation}`,
            type: 'care_today',
            category: 'birthday',
            title: `今天是${b.name}的生日`,
            emoji: b.emoji,
            icon_bg: b.icon_bg,
            care_message: `记得给${b.name}送上最温暖的祝福，让今天变得特别。`,
            blessing_text: b.blessing_text,
            is_today: true,
            days_left: 0,
            person: b.name,
            action_text: '送祝福'
          });
        } else if (diff > 0 && diff <= 7) {
          reminders.push({
            id: `care_birthday_soon_${b.relation}`,
            type: 'care_upcoming',
            category: 'birthday',
            title: `${diff}天后是${b.name}的生日`,
            emoji: b.emoji,
            icon_bg: b.icon_bg,
            care_message: b.care_message,
            blessing_text: '',
            is_today: false,
            days_left: diff,
            person: b.name,
            action_text: '记下了'
          });
        }
      });
    }

    return {
      date_text: `${month}月${day}日`,
      reminder_count: reminders.length,
      reminders: reminders
    };
  },

  /* ---------- 黑暗时刻：首页概览 ---------- */
  'GET /api/dark-moments/overview': () => {
    const darkMoments = generateDarkMoments();
    const yearCount = darkMoments.filter(m => m.in_year_2026).length;

    return {
      total_count: darkMoments.length,
      year_count: yearCount,
      latest_moment: darkMoments[0] || null
    };
  },

  /* ---------- 黑暗时刻：列表（含 AI 总结 + 鼓励话）---------- */
  'GET /api/dark-moments': (params) => {
    const mode = (params && params.mode) || 'year'; // year | all
    const page = parseInt(params && params.page) || 1;
    const size = parseInt(params && params.size) || 20;

    const darkMoments = generateDarkMoments();
    const filtered = mode === 'year'
      ? darkMoments.filter(m => m.in_year_2026)
      : darkMoments;

    const start = (page - 1) * size;
    const items = filtered.slice(start, start + size);

    // AI 总结 + 鼓励话（基于真实积极数据）
    const summary = generateDarkMomentSummary(mode);

    return {
      mode: mode,
      items: items,
      total: filtered.length,
      page: page,
      page_size: size,
      ai_summary: summary.summary_text,
      ai_encouragement: summary.encouragement_text,
      positive_evidence: summary.positive_evidence,
      stats: {
        total_episodes: summary.total_episodes,
        total_days: summary.total_days,
        worst_mood: summary.worst_mood
      }
    };
  },

  /* ---------- 黑暗时刻：详情 ---------- */
  'GET /api/dark-moments/': (params, urlParts) => {
    const id = urlParts[3];
    const darkMoments = generateDarkMoments();
    const moment = darkMoments.find(m => m.id === id);
    if (!moment) return { __error: { code: 404, message: '黑暗时刻不存在' } };

    return {
      dark_moment: moment
    };
  },

  /* ---------- 暖心时刻：首页概览 ---------- */
  'GET /api/warm-moments/overview': () => {
    const warmMoments = generateWarmMoments();
    const yearCount = warmMoments.filter(m => m.in_year_2026).length;

    return {
      total_count: warmMoments.length,
      year_count: yearCount,
      latest_moment: warmMoments[0] || null
    };
  },

  /* ---------- 暖心时刻：列表（含 AI 总结 + 温暖寄语）---------- */
  'GET /api/warm-moments': (params) => {
    const mode = (params && params.mode) || 'year';
    const page = parseInt(params && params.page) || 1;
    const size = parseInt(params && params.size) || 20;

    const warmMoments = generateWarmMoments();
    const filtered = mode === 'year'
      ? warmMoments.filter(m => m.in_year_2026)
      : warmMoments;

    const start = (page - 1) * size;
    const items = filtered.slice(start, start + size);

    const summary = generateWarmMomentSummary(mode);

    return {
      mode: mode,
      items: items,
      total: filtered.length,
      page: page,
      page_size: size,
      ai_summary: summary.summary_text,
      ai_warm_message: summary.warm_message_text,
      warm_evidence: summary.warm_evidence,
      stats: {
        total_episodes: summary.total_episodes,
        total_days: summary.total_days,
        best_mood: summary.best_mood
      }
    };
  },

  /* ---------- 暖心时刻：详情 ---------- */
  'GET /api/warm-moments/': (params, urlParts) => {
    const id = urlParts[3];
    const warmMoments = generateWarmMoments();
    const moment = warmMoments.find(m => m.id === id);
    if (!moment) return { __error: { code: 404, message: '暖心时刻不存在' } };

    return {
      warm_moment: moment
    };
  }
};

/* ==========================================================================
 * 7. 路由匹配 + 入口
 * ========================================================================== */

function matchRoute(method, url) {
  const splitParts = url.split('?');
  const path = splitParts[0];
  const queryStr = splitParts.length > 1 ? splitParts[1] : '';
  const params = {};
  if (queryStr) {
    queryStr.split('&').forEach(pair => {
      const kv = pair.split('=');
      params[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || ''));
    });
  }
  const key = method + ' ' + path;
  if (ROUTES[key]) return { handler: ROUTES[key], urlParts: path.split('/'), params: params };

  const parts = path.split('/');
  if (method === 'GET' && parts[1] === 'api' && parts[2] === 'capsules' && parts[3]) {
    return { handler: ROUTES['GET /api/capsules/'], urlParts: parts, params: params };
  }
  if (method === 'GET' && parts[1] === 'api' && parts[2] === 'chats' && parts[3] === 'conversations' && parts[4]) {
    return { handler: ROUTES['GET /api/chats/conversations/'], urlParts: parts, params: params };
  }
  if (method === 'GET' && parts[1] === 'api' && parts[2] === 'chats' && parts[3] === 'summaries' && parts[4]) {
    return { handler: ROUTES['GET /api/chats/summaries/'], urlParts: parts, params: params };
  }
  if (method === 'GET' && parts[1] === 'api' && parts[2] === 'photos' && parts[3] === 'groups' && parts[4]) {
    return { handler: ROUTES['GET /api/photos/groups/'], urlParts: parts, params: params };
  }
  if (method === 'POST' && parts[1] === 'api' && parts[2] === 'capsules' && parts[4] === 'dialog') {
    return { handler: ROUTES['POST /api/dialog'], urlParts: parts, params: params };
  }
  if (method === 'GET' && parts[1] === 'api' && parts[2] === 'dark-moments' && parts[3] && parts[3] !== 'overview') {
    return { handler: ROUTES['GET /api/dark-moments/'], urlParts: parts, params: params };
  }
  if (method === 'GET' && parts[1] === 'api' && parts[2] === 'warm-moments' && parts[3] && parts[3] !== 'overview') {
    return { handler: ROUTES['GET /api/warm-moments/'], urlParts: parts, params: params };
  }
  return null;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, (ms || 300) + Math.random() * 200));
}

async function mockRequest(method, url, data) {
  await delay();
  const match = matchRoute(method, url);
  if (!match) {
    return { code: 404, message: 'Mock: 路由未匹配 ' + method + ' ' + url, data: null };
  }
  // GET/DELETE: 合并 URL query string 解析出的 params 和传入的 data 参数
  let handlerArg;
  if (method === 'GET' || method === 'DELETE') {
    handlerArg = { ...match.params, ...(data || {}) };
  } else {
    handlerArg = data;
  }
  const result = match.handler(handlerArg, match.urlParts);
  if (result && result.__error) {
    return { code: result.__error.code, message: result.__error.message, data: null };
  }
  return { code: 0, message: 'ok', data: result };
}

module.exports = { mockRequest: mockRequest };
