// miniprogram/utils/cityCoords.js
// 城市名 → 中心经纬度 的映射（统一数据源，避免各处格式不一致）
// 用法：const { cityToCoord } = require('./utils/cityCoords.js');
//       const { lat, lng } = cityToCoord('北京市');

const CITY_COORDS = {
  '北京市': { lat: 39.904, lng: 116.407 },
  '上海市': { lat: 31.230, lng: 121.474 },
  '天津市': { lat: 39.143, lng: 117.190 },
  '重庆市': { lat: 29.563, lng: 106.551 },
  '南京市': { lat: 32.060, lng: 118.796 },
  '苏州市': { lat: 31.299, lng: 120.585 },
  '无锡市': { lat: 31.491, lng: 120.312 },
  '常州市': { lat: 31.797, lng: 119.946 },
  '镇江市': { lat: 32.203, lng: 119.446 },
  '扬州市': { lat: 32.394, lng: 119.427 },
  '南通市': { lat: 32.015, lng: 120.865 },
  '徐州市': { lat: 34.204, lng: 117.286 },
  '连云港市': { lat: 34.596, lng: 119.222 },
  '盐城市': { lat: 33.377, lng: 120.139 },
  '淮安市': { lat: 33.510, lng: 119.021 },
  '泰州市': { lat: 32.455, lng: 119.922 },
  '宿迁市': { lat: 33.963, lng: 118.275 },
  '杭州市': { lat: 30.274, lng: 120.155 },
  '宁波市': { lat: 29.868, lng: 121.544 },
  '温州市': { lat: 28.000, lng: 120.672 },
  '绍兴市': { lat: 30.030, lng: 120.580 },
  '嘉兴市': { lat: 30.746, lng: 120.755 },
  '湖州市': { lat: 30.892, lng: 120.088 },
  '金华市': { lat: 29.078, lng: 119.647 },
  '台州市': { lat: 28.656, lng: 121.421 },
  '合肥市': { lat: 31.820, lng: 117.227 },
  '马鞍山市': { lat: 31.670, lng: 118.506 },
  '芜湖市': { lat: 31.353, lng: 118.434 },
  '蚌埠市': { lat: 32.939, lng: 117.363 },
  '滁州市': { lat: 32.287, lng: 118.316 },
  '安庆市': { lat: 30.509, lng: 117.045 },
  '广州市': { lat: 23.129, lng: 113.264 },
  '深圳市': { lat: 22.543, lng: 114.058 },
  '东莞市': { lat: 23.021, lng: 113.752 },
  '佛山市': { lat: 23.029, lng: 113.122 },
  '珠海市': { lat: 22.270, lng: 113.576 },
  '中山市': { lat: 22.515, lng: 113.392 },
  '惠州市': { lat: 23.112, lng: 114.416 },
  '成都市': { lat: 30.572, lng: 104.066 },
  '武汉市': { lat: 30.592, lng: 114.305 },
  '西安市': { lat: 34.341, lng: 108.939 },
  '郑州市': { lat: 34.746, lng: 113.625 },
  '长沙市': { lat: 28.228, lng: 112.938 },
  '南昌市': { lat: 28.682, lng: 115.857 },
  '济南市': { lat: 36.651, lng: 117.120 },
  '青岛市': { lat: 36.067, lng: 120.383 },
  '厦门市': { lat: 24.479, lng: 118.089 },
  '福州市': { lat: 26.074, lng: 119.296 },
  '沈阳市': { lat: 41.805, lng: 123.431 },
  '大连市': { lat: 38.914, lng: 121.614 },
  '哈尔滨市': { lat: 45.803, lng: 126.535 },
  '长春市': { lat: 43.817, lng: 125.323 },
  '石家庄市': { lat: 38.042, lng: 114.514 },
  '太原市': { lat: 37.870, lng: 112.548 },
  '昆明市': { lat: 25.038, lng: 102.718 },
  '贵阳市': { lat: 26.647, lng: 106.630 },
  '南宁市': { lat: 22.817, lng: 108.366 },
  '海口市': { lat: 20.044, lng: 110.199 },
  '兰州市': { lat: 36.061, lng: 103.834 },
  '乌鲁木齐市': { lat: 43.825, lng: 87.616 }
};

// 把城市名做归一化（去掉"市/区/省/县"等后缀），方便模糊匹配
function normalize(name) {
  if (!name) return '';
  return String(name).replace(/[市区省县]/g, '').trim();
}

// 根据城市名获取坐标，支持模糊匹配（"北京市"、"北京"、"北京朝阳区" 都能匹配到北京）
function cityToCoord(cityName) {
  if (!cityName) return null;
  const key = String(cityName).trim();
  // 先直接匹配（含"市"字）
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  // 再模糊匹配（去掉"市/区/省/县"）
  const normKey = normalize(key);
  for (const cname in CITY_COORDS) {
    if (normalize(cname) === normKey) return CITY_COORDS[cname];
  }
  // 包含匹配（如 "北京朝阳区" → 匹配 "北京市"）
  for (const cname in CITY_COORDS) {
    if (normKey.indexOf(normalize(cname)) > -1 || normalize(cname).indexOf(normKey) > -1) {
      return CITY_COORDS[cname];
    }
  }
  return null;
}

module.exports = { CITY_COORDS, cityToCoord, normalize };
