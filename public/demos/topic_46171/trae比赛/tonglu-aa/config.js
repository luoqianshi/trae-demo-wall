// ============================================================
// config.js — 同路 AA API 配置（安全占位版）
// ============================================================
// ⚠️ 安全说明：
//   本文件中的 AI API_KEY 为占位值，不会暴露真实密钥。
//   如需启用 AI 功能，请复制 config.example.js 为 config.local.js，
//   填入你的真实 Key，并在 index.html 中加载 config.local.js（替换本文件）。
//   或通过环境变量/后端代理注入 Key，切勿将真实 Key 提交到公开仓库。
// ============================================================

const CONFIG = {

  // --- AI 文案生成 (MiMo / OpenAI 兼容格式) ---
  // 如需启用 AI，请填入你的 API Key。留空则自动使用本地模板 fallback。
  AI: {
    API_KEY: 'YOUR_API_KEY_HERE',
    BASE_URL: 'https://api.xiaomimimo.com/v1/chat/completions',
    MODEL: 'mimo-v2-flash',
    ENABLED: true, // 设为 false 可完全跳过 AI 调用
    THINKING_DISABLED: true,
    TIMEOUT_MS: 15000, // AI 请求超时
  },

  // --- 地理编码 (Open-Meteo Geocoding API，免费无需 Key，支持 CORS) ---
  GEOCODE: {
    BASE_URL: 'https://geocoding-api.open-meteo.com/v1/search',
    USER_AGENT: 'TongluAA/1.0',
    TIMEOUT_MS: 10000,
  },

  // --- OSRM 路线规划 (Demo 服务器，免费) ---
  OSRM: {
    BASE_URL: 'https://router.project-osrm.org/route/v1/driving',
    TIMEOUT_MS: 10000,
  },

  // --- OpenRouteService 备选路线规划 (需免费注册 Key) ---
  ORS: {
    BASE_URL: 'https://api.openrouteservice.org/v2/directions/driving-car',
    API_KEY: '', // 在 https://openrouteservice.org 注册后填入
  },

  // --- 地图服务配置 ---
  // provider: leaflet_osm（默认，免费无 Key）| gaode（高德）| tencent（腾讯）
  MAP: {
    PROVIDER: 'leaflet_osm',
    KEY: '', // 高德/腾讯地图 API Key（占位）
  },

  // --- Open-Meteo 天气 (完全免费，无需 Key) ---
  WEATHER: {
    BASE_URL: 'https://api.open-meteo.com/v1/forecast',
    FORECAST_DAYS: 7,
    TIMEOUT_MS: 10000,
  },

  // --- 油价 (元/升，无免费实时 API，使用近期均价) ---
  FUEL_PRICE: {
    '92号汽油': 7.8,
    '95号汽油': 8.2,
  },

  // --- 高速费估算 (元/km) ---
  TOLL_RATE_PER_KM: 0.45,

  // --- 门票默认原价 (学生半价) ---
  TICKET_PRICE: 100,

  // --- 餐饮人均 (元) ---
  MEAL_PRICE: 40,
};

// 暴露到全局
window.CONFIG = CONFIG;
