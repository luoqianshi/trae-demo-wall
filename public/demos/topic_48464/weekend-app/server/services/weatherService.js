/**
 * 天气适配服务 (WI-1.1)
 * 基于 Open-Meteo 免费 API（无需 Key）获取实时天气。
 *
 * 映射策略：
 * - daily weather_code 代表全天可能出现的天气类型
 * - 只有显著降雨（概率≥60%）才判为 rainy，否则按实际天气码映射
 * - 毛毛雨（code 51-57）仅作参考，不强制判为雨天
 * - 高温（≥33°C）和低温（≤5°C）优先于晴/多云判断
 */
const config = require('../config');

const CITY_COORDS = {
  '上海': { lat: 31.23, lon: 121.47 },
  '北京': { lat: 39.90, lon: 116.41 },
  '广州': { lat: 23.13, lon: 113.26 },
  '深圳': { lat: 22.54, lon: 114.06 },
  '杭州': { lat: 30.27, lon: 120.15 },
  '成都': { lat: 30.57, lon: 104.07 },
  '南京': { lat: 32.06, lon: 118.80 },
  '武汉': { lat: 30.59, lon: 114.31 },
  '西安': { lat: 34.27, lon: 108.95 },
  '重庆': { lat: 29.56, lon: 106.55 },
  '苏州': { lat: 31.30, lon: 120.62 },
  '长沙': { lat: 28.23, lon: 112.94 },
  '天津': { lat: 39.08, lon: 117.20 },
  '青岛': { lat: 36.07, lon: 120.38 },
  '厦门': { lat: 24.48, lon: 118.09 },
  '昆明': { lat: 25.04, lon: 102.71 }
};

/**
 * 获取所有支持城市列表
 */
function getSupportedCities() {
  return Object.keys(CITY_COORDS);
}

/**
 * 根据经纬度找到最近的支持城市
 * @param {number} lat 纬度
 * @param {number} lon 经度
 * @returns {{ city: string, distance: number }|null}
 */
function findNearestCity(lat, lon) {
  let nearest = null;
  let minDist = Infinity;
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    // 使用 Haversine 公式计算球面距离
    const dist = haversineDistance(lat, lon, coords.lat, coords.lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = { city, distance: Math.round(dist) };
    }
  }
  return nearest;
}

/**
 * Haversine 公式计算两点间球面距离（km）
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径 km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * WMO 天气代码映射
 * 参考: https://open-meteo.com/en/docs WMO Weather interpretation codes (WW)
 * 0: 晴  1-3: 多云  45-48: 雾  51-57: 毛毛雨  61-67: 雨  71-77: 雪
 * 80-82: 阵雨  85-86: 阵雪  95: 雷暴  96-99: 雷暴伴冰雹
 *
 * 温度判断优先级：极端温度（高温/低温）> 降水 > 晴/多云
 */
function mapWeatherCode(code, tempMax, precipProb) {
  // 1. 优先判断极端温度（无论晴雨，高温/低温都需要特殊推荐）
  if (tempMax >= 33) return 'hot';
  if (tempMax <= 5) return 'cold';

  // 2. 雷暴/雪/雨等恶劣天气
  if (code >= 95) return 'rainy'; // 雷暴
  if (code >= 71 && code <= 77) return 'cold'; // 雪
  if (code >= 85 && code <= 86) return 'cold'; // 阵雪
  // Rain (61-67): 实际降雨
  if (code >= 61 && code <= 67) {
    return precipProb >= 40 ? 'rainy' : 'cloudy';
  }
  // Rain showers (80-82)
  if (code >= 80 && code <= 82) {
    return precipProb >= 40 ? 'rainy' : 'cloudy';
  }
  // Drizzle (51-57): 毛毛雨，仅当降雨概率高时才判为雨天
  if (code >= 51 && code <= 57) {
    return precipProb >= 60 ? 'rainy' : 'cloudy';
  }
  // Fog
  if (code >= 45 && code <= 48) return 'cloudy';
  // Clear / mainly clear / partly cloudy
  if (code === 0) return 'sunny';
  if (code >= 1 && code <= 3) return 'cloudy';

  return 'cloudy';
}

const WEATHER_LABELS = {
  'sunny': '晴',
  'rainy': '雨',
  'cloudy': '多云',
  'hot': '高温',
  'cold': '低温'
};

const weatherCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 分钟

/**
 * 获取城市实时天气
 * @returns {Promise<{weather, tempMax, precipProb, label, code, source, cached}>}
 */
async function getWeather(city) {
  const coords = CITY_COORDS[city];
  if (!coords) return { weather: 'sunny', tempMax: 25, precipProb: 0, label: '晴', code: 0, source: 'default', cached: false };

  // 缓存命中
  const cacheKey = city;
  if (weatherCache.has(cacheKey)) {
    const cached = weatherCache.get(cacheKey);
    if (Date.now() - cached.ts < CACHE_TTL) {
      return { ...cached.data, cached: true };
    }
    weatherCache.delete(cacheKey);
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=weather_code,temperature_2m_max,precipitation_probability_max&timezone=Asia/Shanghai&forecast_days=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`WEATHER_API_${res.status}`);
    const data = await res.json();

    const code = data.daily?.weather_code?.[0] ?? 0;
    const tempMax = data.daily?.temperature_2m_max?.[0] ?? 25;
    const precipProb = data.daily?.precipitation_probability_max?.[0] ?? 0;
    const weather = mapWeatherCode(code, tempMax, precipProb);
    const label = WEATHER_LABELS[weather] || '多云';

    const result = { weather, tempMax: Math.round(tempMax), precipProb, label, code, source: 'open-meteo', cached: false };
    weatherCache.set(cacheKey, { data: result, ts: Date.now() });
    return result;
  } catch (err) {
    console.warn(`[Weather] 获取${city}天气失败: ${err.message}，使用默认值`);
    return { weather: 'sunny', tempMax: 25, precipProb: 0, label: '晴', code: 0, source: 'fallback', cached: false };
  }
}

module.exports = { getWeather, CITY_COORDS, WEATHER_LABELS, getSupportedCities, findNearestCity };
