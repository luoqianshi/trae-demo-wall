// miniprogram/config.js
// 全局配置项。可按需修改后使用。
//
// 使用方式：
//   const config = require('../config.js');
//   config.mapKey // 取腾讯地图 key
//
// 关于 mapKey（腾讯位置服务 key）：
//   - 为空字符串时，小程序会走本地经纬度 → 城市锚点的 fallback 逻辑（精度较低）。
//   - 有 key 时，会调用腾讯地图官方的"逆地理编码"接口，返回真实的省/市/区/街道。
//   - 申请地址：https://lbs.qq.com/dev/console/key/manage
//     申请类型选"WebServiceAPI"，启用"逆地理编码"功能。
module.exports = {
  mapKey: "WRTBZ-SQJLU-IQVVE-GKV5R-3VZLT-ABFCX", // 在这里填入你在腾讯位置服务申请的 key。示例：'ABCD1-EFG34-HIJK5-LMN67-OPQ'
  reverseGeocodeUrl: "https://apis.map.qq.com/ws/geocoder/v1/",
  // 定位相关参数
  location: {
    highAccuracy: true,
    highAccuracyExpireTime: 4000,
    type: "gcj02",
  },
  // 大模型 API 配置（用于模拟发布者聊天）
  llm: {
    apiUrl: "https://api.deepseek.com/v1/chat/completions",
    apiKey: "YOUR_API_KEY_HERE",
    model: "deepseek-chat",
    temperature: 0.7,
    maxTokens: 500,
  },
};
