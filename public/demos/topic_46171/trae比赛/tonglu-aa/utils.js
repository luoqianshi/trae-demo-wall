// ============================================================
// utils.js — 同路 AA 工具函数
// ============================================================

const Utils = {
  // ===== 天气代码映射 (Open-Meteo WMO codes → 中文) =====
  WEATHER_CODES: {
    0:  { icon: '☀️', desc: '晴天' },
    1:  { icon: '🌤️', desc: '多云' },
    2:  { icon: '⛅', desc: '多云' },
    3:  { icon: '☁️', desc: '阴天' },
    45: { icon: '🌫️', desc: '雾' },
    48: { icon: '🌫️', desc: '雾凇' },
    51: { icon: '🌦️', desc: '小雨' },
    53: { icon: '🌦️', desc: '小雨' },
    55: { icon: '🌧️', desc: '中雨' },
    56: { icon: '🌧️', desc: '冻雨' },
    57: { icon: '🌧️', desc: '冻雨' },
    61: { icon: '🌧️', desc: '小雨' },
    63: { icon: '🌧️', desc: '中雨' },
    65: { icon: '⛈️', desc: '大雨' },
    66: { icon: '🌧️', desc: '冻雨' },
    67: { icon: '⛈️', desc: '冻雨' },
    71: { icon: '🌨️', desc: '小雪' },
    73: { icon: '🌨️', desc: '中雪' },
    75: { icon: '❄️', desc: '大雪' },
    77: { icon: '🌨️', desc: '雪粒' },
    80: { icon: '🌦️', desc: '阵雨' },
    81: { icon: '🌧️', desc: '阵雨' },
    82: { icon: '⛈️', desc: '暴雨' },
    85: { icon: '🌨️', desc: '阵雪' },
    86: { icon: '❄️', desc: '暴雪' },
    95: { icon: '⛈️', desc: '雷雨' },
    96: { icon: '⛈️', desc: '雷雨冰雹' },
    99: { icon: '⛈️', desc: '强雷暴' },
  },

  // 判断是否恶劣天气
  isBadWeather(code) {
    return [65, 75, 82, 95, 96, 99].includes(code);
  },

  // 判断是否中等天气
  isModerateWeather(code) {
    return code >= 51 && !this.isBadWeather(code);
  },

  // 获取天气信息
  getWeatherInfo(code) {
    return this.WEATHER_CODES[code] || { icon: '❓', desc: '未知' };
  },

  // ===== 金额格式化 =====
  formatMoney(amount) {
    return '¥' + Number(amount).toFixed(2);
  },

  // ===== 距离格式化 (米 → 公里) =====
  formatDistance(meters) {
    return (meters / 1000).toFixed(1);
  },

  // ===== 时间格式化 (秒 → "Xh YYmin") =====
  formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    if (h === 0) return `${m}min`;
    return `${h}h ${String(m).padStart(2, '0')}min`;
  },

  // ===== 日期格式化 (中文) =====
  formatDate(date) {
    const d = new Date(date);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
  },

  // ===== 完整日期格式化 =====
  formatDateFull(date) {
    const d = new Date(date);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
  },

  // ===== 获取今天日期 (偏移天数) =====
  getTripDate(offsetDays = 5) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return this.formatDateFull(d);
  },

  // ===== 带超时的 fetch =====
  async fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  },

  // ===== 防抖 =====
  debounce(fn, delay = 300) {
    let timer = null;
    return function (...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // ===== 相对时间格式化 =====
  formatTimeAgo(timestamp) {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    return `${Math.floor(hours / 24)} 天前`;
  },
};

window.Utils = Utils;
