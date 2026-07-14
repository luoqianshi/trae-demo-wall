// ============================================
// 常量配置
// ============================================
const STATUS_CONFIG = {
  nextWeek:  { label: '⏳ 预留至下周', barColor: 'next-week' },
  thisWeek:  { label: '✅ 本周可去',    barColor: 'this-week'  },
  thisMonth: { label: '📅 本月计划',    barColor: 'this-month' },
};

const FEELING_CONFIG = {
  love:    { text: '还会再去',  icon: 'star',  tagClass: 'love'    },
  ok:      { text: '一般',      icon: 'minus', tagClass: 'ok'      },
  dislike: { text: '不想再去了', icon: 'x',     tagClass: 'dislike' },
};

const TOAST_MESSAGES = {
  added: '已加入收藏夹~',
  exists: '已在收藏夹中~',
  emptyInput: '先粘贴点内容吧~',
  copySuccess: '文案已复制，去微信粘贴吧~',
  copyFail: '复制失败，请手动复制',
  noSelection: '请先选择一个目的地',
  tripConfirmed: '🎉 已确认出行，祝玩得开心~',
  underDev: '功能开发中~',
  error: '出了点小问题，刷新试试~',
  // 新增：一些常见场景的提示
  removed: '已取消收藏~',
  saved: '记录已保存~',
  shared: '已生成分享卡~',
  backToTop: '已回到最匹配的推荐~',
  noMore: '没有更多啦，试试调整偏好~',
  onlyOne: '目前只有这些符合你的要求啦~',
  aiTimeout: '网络有点慢，先用本地推荐给你～'
};

// 不同消息对应的 Toast 类型
const TOAST_TYPES = {
  added: 'success',
  exists: 'info',
  emptyInput: 'warning',
  copySuccess: 'success',
  copyFail: 'error',
  noSelection: 'warning',
  tripConfirmed: 'success',
  underDev: 'info',
  error: 'error',
  removed: 'info',
  saved: 'success',
  shared: 'success',
  backToTop: 'info',
  noMore: 'info',
  onlyOne: 'info'
};

// ============================================
// 数据类型定义（JSDoc）
// ============================================
/**
 * @typedef {Object} CollectionItem - 收藏项
 * @property {number} id
 * @property {string} placeName
 * @property {'nextWeek'|'thisWeek'|'thisMonth'} status
 * @property {string} statusLabel
 * @property {string} barColor
 * @property {string[]} types
 * @property {string} note
 */

/**
 * @typedef {Object} TimelineRecord - 遛娃档案记录
 * @property {number} id
 * @property {string} date
 * @property {string} dayOfWeek
 * @property {string} placeName
 * @property {'love'|'ok'|'dislike'} feeling
 * @property {string} feelingLabel
 * @property {string} duration
 * @property {string} note
 */

// ============================================
// 模拟数据
// ============================================

const weather = {
  saturday: 'sunny',
  sunday: 'cloudy',
  saturdayTemp: 27,
  sundayTemp: 25
};

// 地点数据 - 南京遛娃地点（20个）
// 地点数据从 data/place.js 加载
const places = window.PLACES || [];

// 兼容旧代码引用
const destinations = places;
const activities = [];

let collections = [
  {
    id: 1,
    placeName: '紫金山昆虫博物馆',
    status: 'nextWeek',
    statusLabel: '⏳ 预留至下周',
    barColor: 'next-week',
    types: ['户外/科普'],
    note: '等晴天了去'
  },
  {
    id: 2,
    placeName: '南京海底世界',
    status: 'thisWeek',
    statusLabel: '✅ 本周可去',
    barColor: 'this-week',
    types: ['室内/海洋馆'],
    note: '这周有空，带荔枝去看看海豚'
  },
  {
    id: 3,
    placeName: '汤山温泉亲子酒店',
    status: 'thisMonth',
    statusLabel: '📅 本月计划',
    barColor: 'this-month',
    types: ['度假/温泉'],
    note: '下个月全家去度假'
  }
];

let records = [
  {
    id: 1,
    date: '6月21日',
    dayOfWeek: '周六',
    placeName: '紫金山昆虫博物馆',
    feeling: 'love',
    feelingLabel: '还会再去',
    duration: '半天',
    note: '荔枝摸了甲虫，很开心~'
  },
  {
    id: 2,
    date: '6月14日',
    dayOfWeek: '周六',
    placeName: '南京科技馆',
    feeling: 'ok',
    feelingLabel: '一般',
    duration: '全天',
    note: '人太多，排队时间长'
  },
  {
    id: 3,
    date: '6月7日',
    dayOfWeek: '周日',
    placeName: '绿博园',
    feeling: 'love',
    feelingLabel: '还会再去',
    duration: '半天',
    note: ''
  },
  {
    id: 4,
    date: '5月31日',
    dayOfWeek: '周六',
    placeName: '南京博物院',
    feeling: 'ok',
    feelingLabel: '一般',
    duration: '全天',
    note: ''
  }
];
