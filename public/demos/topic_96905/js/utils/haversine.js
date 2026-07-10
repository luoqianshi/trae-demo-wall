/**
 * Haversine 距离计算工具
 * 计算两个经纬度坐标之间的直线距离（km）
 */

/**
 * 角度转弧度
 * @param {number} deg - 角度
 * @returns {number} 弧度
 */
function toRad(deg) {
  return deg * Math.PI / 180;
}

/**
 * 计算两个经纬度坐标之间的直线距离（km）
 * @param {number} lat1 - 起点纬度
 * @param {number} lng1 - 起点经度
 * @param {number} lat2 - 终点纬度
 * @param {number} lng2 - 终点经度
 * @returns {number} 直线距离（km）
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // 地球半径（km）
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
