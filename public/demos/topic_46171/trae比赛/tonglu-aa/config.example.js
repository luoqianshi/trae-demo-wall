// ============================================================
// config.example.js — 同路 AA API 配置模板
// ============================================================
// 使用方法：
//   1. 复制本文件为 config.local.js
//   2. 填入你的真实 API Key
//   3. 在 index.html 中将 <script src="config.js"> 替换为 <script src="config.local.js">
//   4. 将 config.local.js 加入 .gitignore，切勿提交到公开仓库
// ============================================================

const CONFIG = {

  // --- AI 文案生成 (MiMo / OpenAI 兼容格式) ---
  // 申请地址：https://api.xiaomimimo.com/
  AI: {
    API_KEY: 'sk-your-mimo-api-key-here', // ← 替换为你的真实 Key
    BASE_URL: 'https://api.xiaomimimo.com/v1/chat/completions',
    MODEL: 'mimo-v2-flash',
    ENABLED: true,
    THINKING_DISABLED: true,
    TIMEOUT_MS: 15000,
  },

  // --- 地理编码 (Open-Meteo Geocoding API，免费无需 Key) ---
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
  // 注册地址：https://openrouteservice.org/
  ORS: {
    BASE_URL: 'https://api.openrouteservice.org/v2/directions/driving-car',
    API_KEY: 'your-ors-api-key-here', // ← 替换为你的 ORS Key
  },

  // --- 地图服务配置 ---
  // provider: leaflet_osm（默认，免费）| gaode（高德）| tencent（腾讯）
  // 高德 Key 申请：https://console.amap.com/
  // 腾讯 Key 申请：https://lbs.qq.com/
  MAP: {
    PROVIDER: 'leaflet_osm',
    KEY: 'your-map-api-key-here', // ← 高德/腾讯地图 Key
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
