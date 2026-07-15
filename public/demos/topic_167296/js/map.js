/**
 * 中国地图交互逻辑
 * 使用 ECharts 渲染中国分省地图
 * 悬停显示美景美食卡片，点击跳转省份详情页
 */

// 初始化 ECharts 实例
const chartDom = document.getElementById('chinaMap');
const myChart = echarts.init(chartDom, null, { renderer: 'canvas' });

// 悬浮卡片 DOM 元素引用
const hoverCard = document.getElementById('hoverCard');
const cardProvinceName = document.getElementById('cardProvinceName');
const cardSeason = document.getElementById('cardSeason');
const cardScenery = document.getElementById('cardScenery');
const cardFood = document.getElementById('cardFood');

/**
 * GeoJSON 中的省份全称 → 我们数据中的简称 映射表
 * 阿里云 DataV GeoJSON 使用全称如"新疆维吾尔自治区"
 * 我们的数据使用简称如"新疆"
 */
const NAME_MAP = {
  "北京市": "北京",
  "天津市": "天津",
  "河北省": "河北",
  "山西省": "山西",
  "内蒙古自治区": "内蒙古",
  "辽宁省": "辽宁",
  "吉林省": "吉林",
  "黑龙江省": "黑龙江",
  "上海市": "上海",
  "江苏省": "江苏",
  "浙江省": "浙江",
  "安徽省": "安徽",
  "福建省": "福建",
  "江西省": "江西",
  "山东省": "山东",
  "河南省": "河南",
  "湖北省": "湖北",
  "湖南省": "湖南",
  "广东省": "广东",
  "广西壮族自治区": "广西",
  "海南省": "海南",
  "重庆市": "重庆",
  "四川省": "四川",
  "贵州省": "贵州",
  "云南省": "云南",
  "西藏自治区": "西藏",
  "陕西省": "陕西",
  "甘肃省": "甘肃",
  "青海省": "青海",
  "宁夏回族自治区": "宁夏",
  "新疆维吾尔自治区": "新疆",
  "台湾省": "台湾",
  "香港特别行政区": "香港",
  "澳门特别行政区": "澳门"
};

/**
 * 将 GeoJSON 全称映射为我们数据中的简称
 * @param {string} geoName - GeoJSON 中的省份名称
 * @returns {string} 数据中的省份简称
 */
function toShortName(geoName) {
  // 先查映射表
  if (NAME_MAP[geoName]) return NAME_MAP[geoName];
  // 兜底：去掉常见后缀
  return geoName
    .replace(/维吾尔自治区|壮族自治区|回族自治区|特别行政区|自治区|省|市/g, '');
}

/**
 * 从 PROVINCE_DATA 构建 ECharts series 数据
 * 使用 GeoJSON 全称作为 name，确保与地图区域匹配
 */
function buildMapData() {
  return Object.keys(PROVINCE_DATA).map(shortName => ({
    name: shortName,
    value: 1
  }));
}

/**
 * cityGuide 省份（广东/广西/湖南/江西/福建/海南/贵州/云南/台湾）的景点/美食简短描述对照表
 * 悬停卡片中使用这些精简描述，与其他省份风格保持一致
 */
var SHORT_DESC = {
  // 广东
  '\u5e7f\u5dde\u5854\uff08\u5c0f\u86ee\u5996\uff09': '\u5e7f\u5dde\u5730\u6807\u5efa\u7b51\uff0c\u767b\u5854\u77b0\u73e0\u6c5f\u5168\u666f',
  '\u4e16\u754c\u4e4b\u7a97': '\u6c47\u805a\u4e16\u754c\u540d\u80dc\u7684\u7f29\u5fae\u666f\u533a',
  '\u4f5b\u5c71\u7956\u5e99': '\u96c6\u53e4\u5efa\u7b51\u3001\u6b66\u672f\u3001\u9676\u827a\u4e8e\u4e00\u4f53',
  '\u5e7f\u5f0f\u65e9\u8336': '\u70b9\u5fc3\u7cbe\u81f4\u591a\u6837\uff0c\u4e00\u76c5\u4e24\u4ef6\u60ec\u610f\u65e9\u8336',
  '\u5149\u660e\u4e73\u9e3d': '\u76ae\u8106\u8089\u5ae9\u3001\u6c41\u6c34\u4e30\u76c8',
  '\u53cc\u76ae\u5976': '\u53e3\u611f\u7ec6\u817b\u5ae9\u6ed1\uff0c\u5976\u9999\u6d53\u90c1',

  // 广西
  '\u6fdf\u6c5f\u98ce\u666f\u540d\u80dc\u533a': '\u6842\u6797\u5c71\u6c34\u7684\u7075\u9b42\u6240\u5728\uff0c\u767e\u91cc\u753b\u5eca',
  '\u9752\u79c0\u5c71\u98ce\u666f\u533a': '\u5357\u5b81\u7684\u57ce\u5e02\u7eff\u80ba',
  '\u5317\u6d77\u94f6\u6ee9': '\u4e2d\u56fd\u5341\u5927\u6700\u7f8e\u6d77\u6ee9\u4e4b\u4e00',
  '\u6842\u6797\u7c73\u7c89': '\u6e05\u723d\u9999\u53e3\uff0c\u6842\u6797\u6700\u5177\u4ee3\u8868\u6027\u5c0f\u5403',
  '\u8001\u53cb\u7c89': '\u9178\u8fa3\u9c9c\u9999\u3001\u5f00\u80c3\u89e3\u817b',
  '\u5317\u6d77\u6d77\u9c9c': '\u767d\u707c\u6e05\u84b8\uff0c\u53e3\u611f\u9c9c\u7f8e',

  // 湖南
  '\u6a58\u5b50\u6d32': '\u9752\u5e74\u6bdb\u6cfd\u4e1c\u96d5\u50cf\u77d1\u7acb\u6b64\u5730\uff0c\u957f\u6c99\u5730\u6807',
  '\u6b66\u9675\u6e90\u98ce\u666f\u540d\u80dc\u533a': '\u4e09\u5343\u5947\u5cf0\u62d4\u5730\u800c\u8d77\uff0c\u4e16\u754c\u81ea\u7136\u9057\u4ea7',
  '\u6caf\u6c5f\u98ce\u5149\u5e26': '\u53e4\u570e\u6cbb\u6c5f\u6cb3\u7eff\u9053\uff0c\u6cbf\u6c5f\u98ce\u666f\u7eca\u4e3d',
  '\u957f\u6c99\u81ed\u8c46\u8150': '\u5916\u7126\u91cc\u5ae9\uff0c\u957f\u6c99\u540d\u7247',
  '\u571f\u5bb6\u4e09\u4e0b\u9505': '\u590f\u591c\u914d\u5564\u9152\u7edd\u914d',
  '\u8840\u7cd7\u9e2d': '\u82d7\u65cf\u975e\u9057\u7f8e\u98df\uff0c\u6cd5\u706b\u70e4\u5236\u9999\u8fa3\u8f6f\u7c73',

  // 江西
  '\u5a04\u6e90\u7bc0\u5cad': '\u68af\u7530\u82b1\u6d77\u4e0e\u6652\u79cb\u4eba\u5bb6\uff0c\u6444\u5f71\u5929\u5802',
  '\u6ed5\u738b\u9601': '\u6c5f\u5357\u4e09\u5927\u540d\u697c\u4e4b\u9996\uff0c\u56e0\u738b\u52c3\u300a\u6ed5\u738b\u9601\u5e8f\u300b\u540d\u626c\u5929\u4e0b',
  '\u5e90\u5c71': '\u4e16\u754c\u6587\u5316\u666f\u89c2\u9057\u4ea7\uff0c\u5321\u5e90\u5947\u79c0\u7532\u5929\u4e0b',
  '\u94c5\u5c71\u70eb\u7c89': '\u7c73\u7c89\u723d\u6ed1\u52b2\u9053\uff0c\u6c64\u9c9c\u5473\u7f8e',
  '\u5357\u660c\u62cc\u7c89 + \u74e6\u7f50\u6c64': '\u6c5f\u897f\u65e9\u9910\u53cc\u58c1\uff0c\u62cc\u7c89\u914d\u74e6\u7f50\u7c64\u6c64',
  '\u5e90\u5c71\u77f3\u9e21': '\u5e90\u5c71\u7279\u4ea7\u86d9\u7c7b\uff0c\u8089\u8d28\u7ec6\u5ae9\u9c9c\u7f8e',
  // 福建
  '\u9f13\u6d6a\u5c7f': '\u4e16\u754c\u6587\u5316\u9057\u4ea7\uff0c\u4e07\u56fd\u5efa\u7b51\u4e0e\u6d77\u5c9b\u98ce\u60c5\u4ea4\u878d',
  '\u4e09\u574a\u4e03\u5df7': '\u4e2d\u56fd\u57ce\u5e02\u91cc\u574a\u5236\u5ea6\u6d3b\u5316\u77f3\uff0c\u6c47\u805a\u660e\u6e05\u53e4\u5efa\u7b51',
  '\u5f00\u5143\u5bfa': '\u798f\u5efa\u89c4\u6a21\u6700\u5927\u4f5b\u6559\u5bfa\u9662\uff0c\u4e1c\u897f\u53cc\u5854\u5c79\u7acb\u5343\u5e74',
  '\u6c99\u8336\u9762': '\u53a6\u95e8\u62db\u724c\u5c0f\u5403\uff0c\u6c99\u8336\u9171\u718a\u5236\u6d53\u90c1\u9c9c\u9999',
  '\u798f\u5dde\u9c7c\u4e38': '\u4ee5\u9ca8\u9c7c\u8089\u6253\u6210\u6ce5\u5305\u88f9\u732a\u8089\u9985\uff0c\u53e3\u611fQ\u5f39\u9c9c\u7f8e',
  '\u9762\u7ebf\u7cca': '\u6cc9\u5dde\u7ecf\u5178\u65e9\u9910\uff0c\u7ec6\u5982\u53d1\u4e1d\u642d\u914d\u5927\u80a0\u918b\u8089',

  // 海南
  '\u86e4\u652f\u6d32\u5c9b': '\u6d77\u6c34\u6e05\u6f88\u89c1\u5e95\uff0c\u73ca\u7469\u793e\u4f1a\u4e30\u5bcc\uff0c\u4e2d\u56fd\u7684\u9a6c\u5c14\u4ee3\u592b',
  '\u9a91\u697c\u8001\u8857': '\u6700\u5177\u5357\u6d0b\u98ce\u60c5\u7684\u767e\u5e74\u8001\u8857\uff0c\u9a91\u697c\u5efa\u7b51\u7fa4\u62cd\u7167\u6781\u51fa\u7247',
  '\u65e5\u6708\u6e7e': '\u56fd\u5185\u51b2\u6d6a\u53d1\u6e90\u5730\uff0c\u6d77\u6e7e\u5f62\u72b6\u5982\u6708\u5f2f\uff0c\u6d6a\u6f2b\u6c1b\u56f4\u6ee1\u5206',
  '\u6e05\u84b8\u6d77\u9c9c': '\u7b2c\u4e00\u5e02\u573a\u73b0\u635e\u6d77\u9c9c\uff0c\u9f99\u867e\u548c\u77f3\u6591\u9c7f\u4e0d\u53ef\u9519\u8fc7',
  '\u6e05\u8865\u51c9': '\u6d77\u5357\u7b2c\u4e00\u89e3\u6691\u795e\u5668\uff0c\u6930\u5976\u6ce1\u52a0\u4e30\u5bcc\u6c34\u679c\uff0c\u6e05\u751c\u723d\u6ed1',
  '\u6587\u660c\u9e21': '\u6d77\u5357\u56db\u5927\u540d\u83dc\u4e4b\u9996\uff0c\u76ae\u8106\u8089\u5ae9\u9aa8\u9165\uff0c\u914d\u59dc\u4e1d\u8592\u6c41\u7edd\u4f73',

  // 贵州
  '\u9752\u5ca9\u53e4\u9547': '\u8d35\u5dde\u56db\u5927\u53e4\u9547\u4e4b\u4e00\uff0c\u516d\u767e\u5e74\u5546\u57e0\u70df\u706b\u6c14\u6d53\u90c1',
  '\u9075\u4e49\u4f1a\u8bae\u4f1a\u5740': '\u4e2d\u56fd\u9769\u547d\u4f1f\u5927\u8f6c\u6298\u7684\u8c61\u5f81\uff0c\u611f\u53d7\u5386\u53f2\u539a\u91cd',
  '\u9ec4\u679c\u6811\u7011\u5e03': '\u4e9a\u6d32\u6700\u5927\u7011\u5e03\uff0c\u78c5\u7934\u6c14\u52bf\u78c5\u7934\uff0c\u53ef\u6c34\u5e18\u6d1e\u7a7f\u8d8a\u80cc\u540e',
  '\u80a0\u65fa\u9762': '\u8d35\u9633\u65e9\u9910\u4e4b\u738b\uff0c\u7ea2\u6cb9\u6c64\u5e95\u6d53\u9999\u56db\u6ea2\uff0c\u80a0\u65faQ\u5f39\u8840\u65fa\u5ae9\u6ed1',
  '\u867e\u5b50\u7f8a\u8089\u7c89': '\u9075\u4e49\u5934\u724c\u65e9\u9910\uff0c\u7ea2\u6cb9\u6d47\u76d6\u7f8a\u8089\u9c9c\u5ae9\u4e0d\u81bb',
  '\u5b89\u987a\u88f9\u5377': '\u8584\u7c73\u76ae\u88f9\u723d\u8106\u914d\u83dc\uff0c\u9178\u8fa3\u6e05\u9999\u5916\u8f6f\u5185\u8106',

  // 云南
  '\u6ec7\u6c60': '\u4e91\u5357\u6700\u5927\u9ad8\u539f\u6e56\u6cca\uff0c\u51ac\u5b63\u7ea2\u5634\u9e25\u7fe9\u8e43\u6210\u666f',
  '\u6d31\u6d77': '\u4e91\u5357\u7b2c\u4e8c\u5927\u6e56\u6cca\uff0c\u78a7\u6ce2\u4e07\u9876\u5012\u6620\u82cd\u5c71\u98ce\u82b1\u96ea\u6708\u8bd7\u610f',
  '\u4e3d\u6c5f\u53e4\u57ce\uff08\u5927\u7814\uff09': '\u7eb3\u897f\u53e4\u90fd\u5c0f\u6865\u6d41\u6c34\uff0c\u591c\u8272\u71c3\u706f\u7fe0\u74a8\u5982\u68a6',
  '\u8fc7\u6865\u7c73\u7ebf': '\u4e91\u5357\u7b2c\u4e00\u540d\u7247\uff0c\u6eda\u70eb\u9e21\u6c64\u81ea\u52a9\u6db1\u70eb\uff0c\u9c9c\u9999\u6d53\u90c1',
  '\u4e73\u6247': '\u767d\u65cf\u5976\u7247\u5377\u73ab\u7470\u7cd6\uff0c\u5916\u8106\u5185\u97e7\u5976\u9999\u8db3',
  '\u7eb3\u897f\u70e4\u9c7c': '\u8584\u8377\u8fa3\u6912\u814c\u70ad\u70e4\uff0c\u5916\u7126\u91cc\u5ae9\u6e05\u9999\u56db\u6ea2',

  // 台湾
  '\u53f0\u5317101': '\u66fe\u4e3a\u4e16\u754c\u7b2c\u4e00\u9ad8\u697c\uff0c89\u5c42\u89c2\u666f\u53f0\u77b0\u53f0\u5317\u5168\u666f\uff0c\u8de8\u5e74\u70df\u706b\u66f4\u662f\u4e00\u7edd',
  '\u897f\u5b50\u6e7e': '\u9ad8\u96c4\u6700\u7f8e\u65e5\u843d\u89c2\u8d4f\u5730\uff0c\u6a58\u7ea2\u4f59\u6656\u6620\u7167\u6d77\u9762',
  '\u5b89\u5e73\u53e4\u5821': '\u53f0\u6e7e\u7b2c\u4e00\u5ea7\u57ce\u5821\uff0c\u7ea2\u7816\u57ce\u5899\u89c1\u8bc1\u56db\u767e\u5e74\u6ca7\u6851',
  '\u5c0f\u7b3c\u5305': '\u53f0\u5f0f\u5c0f\u7b3c\u5305\u76ae\u8584\u9985\u591a\u6c64\u6c41\u9c9c\u7f8e\uff0c\u53f0\u5317\u7f8e\u98df\u540d\u7247',
  '\u6728\u74dc\u725b\u5976': '\u516d\u5408\u591c\u5e02\u62db\u724c\u996e\u54c1\uff0c\u9999\u751c\u987a\u6ed1\u6d88\u6691\u89e3\u6e34',
  '\u68fa\u6750\u677f': '\u53f0\u5357\u72ec\u521b\u7ecf\u5178\u5c0f\u5403\uff0c\u539a\u5410\u53f8\u586b\u6d77\u9c9c\u6d53\u6c64\u5916\u9165\u5185\u9c9c'
};

/**
 * 渲染悬浮卡片内容
 * @param {string} name - 省份名称（GeoJSON 全称或数据简称均可）
 */
function renderHoverCard(name) {
  // 兼容全称和简称
  const shortName = toShortName(name);
  const data = PROVINCE_DATA[shortName] || PROVINCE_DATA[name];
  if (!data) return;

  // 填充省份名称和最佳季节
  cardProvinceName.textContent = shortName;
  cardSeason.textContent = '最佳: ' + data.bestSeason;

  // 填充美景列表（最多显示3个）
  // 如果省份使用 cityGuide 模式（无 scenery），则从城市攻略提取前3个热门景点
  // cityGuide 省份的描述原文较长，用简短描述替代，与其他省份风格一致
  var sceneryList = data.scenery || [];
  if (sceneryList.length === 0 && data.cityGuide) {
    sceneryList = data.cityGuide.slice(0, 3).map(function(c) {
      var topAttr = (c.attractions && c.attractions[0]) || { name: c.city };
      var shortDesc = SHORT_DESC[topAttr.name] || '';
      return { name: topAttr.name, desc: shortDesc };
    });
  }
  cardScenery.innerHTML = sceneryList.slice(0, 3).map(s =>
    `<li><strong>${s.name}</strong>${s.desc ? ' - ' + s.desc : ''}</li>`
  ).join('');

  // 填充美食列表（最多显示3个）
  // 如果省份使用 cityGuide 模式（无 food），则从城市攻略提取前3个热门美食
  var foodList = data.food || [];
  if (foodList.length === 0 && data.cityGuide) {
    foodList = data.cityGuide.slice(0, 3).map(function(c) {
      var topFood = (c.foods && c.foods[0]) || { name: c.city };
      var shortDesc = SHORT_DESC[topFood.name] || '';
      return { name: topFood.name, desc: shortDesc };
    });
  }
  cardFood.innerHTML = foodList.slice(0, 3).map(f =>
    `<li><strong>${f.name}</strong>${f.desc ? ' - ' + f.desc : ''}</li>`
  ).join('');
}

/**
 * 定位悬浮卡片到鼠标附近
 * @param {number} x - 鼠标X坐标
 * @param {number} y - 鼠标Y坐标
 */
function positionHoverCard(x, y) {
  const cardWidth = 320;
  const cardHeight = hoverCard.offsetHeight || 300;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // 计算卡片位置，避免超出窗口边界
  let posX = x + 15;
  let posY = y + 15;

  // 右边界检测
  if (posX + cardWidth > windowWidth) {
    posX = x - cardWidth - 15;
  }
  // 下边界检测
  if (posY + cardHeight > windowHeight) {
    posY = y - cardHeight - 15;
  }

  // 确保不超出左上边界
  posX = Math.max(10, posX);
  posY = Math.max(10, posY);

  hoverCard.style.left = posX + 'px';
  hoverCard.style.top = posY + 'px';
}

/** 显示悬浮卡片 */
function showHoverCard() {
  hoverCard.classList.add('visible');
}

/** 隐藏悬浮卡片 */
function hideHoverCard() {
  hoverCard.classList.remove('visible');
}

/**
 * 获取 GeoJSON 中所有区域名称
 * 用于识别哪些是岛屿区域以便隐藏
 */
function getGeoNames(geoJson) {
  return geoJson.features.map(f => f.properties.name);
}

/**
 * 判断区域是否是需要保留的省份（非南海等小岛屿）
 * 保留：34个省级行政区
 * 隐藏：九段线区域、南海诸岛等小区域
 */
function buildHiddenRegions(geoJson) {
  const keepSet = new Set(Object.keys(NAME_MAP));
  const allNames = getGeoNames(geoJson);
  // 找出不在保留列表中的区域
  return allNames.filter(n => !keepSet.has(n));
}

/**
 * 清理台湾省 GeoJSON 坐标数据
 * 移除台湾主岛以东的小岛（绿岛、兰屿等），经度阈值约 121.7°E
 * @param {Object} feature - 台湾省 GeoJSON feature
 * @returns {Object} 清理后的 feature
 */
function cleanTaiwanCoords(feature) {
  // 策略：过滤掉中心点经度 > 122°E 的多边形（即独立离岛如绿岛、兰屿）
  // 台湾主岛中心经度约 120.9°E，不会被误删

  /**
   * 计算多边形的中心经度
   */
  function polygonCenterLng(polygon) {
    var sum = 0;
    for (var i = 0; i < polygon.length; i++) {
      sum += polygon[i][0];
    }
    return sum / polygon.length;
  }

  var cleaned = JSON.parse(JSON.stringify(feature));
  var geometry = cleaned.geometry;

  if (geometry.type === 'MultiPolygon') {
    geometry.coordinates = geometry.coordinates.filter(function(polygonGroup) {
      // 保留至少一个多边形中心经度 <= 122 的组
      return polygonGroup.some(function(polygon) {
        return polygonCenterLng(polygon) <= 122;
      });
    });
    geometry.coordinates = geometry.coordinates.map(function(polygonGroup) {
      return polygonGroup.filter(function(polygon) {
        return polygonCenterLng(polygon) <= 122;
      });
    });
  }

  return cleaned;
}

/**
 * 清理海南省 GeoJSON 坐标数据
 * 遍历所有多边形，移除纬度低于 18°N 的多边形（南海岛礁）
 * 保留海南主岛和近海小岛
 * @param {Object} feature - 海南省 GeoJSON feature
 * @returns {Object} 清理后的 feature
 */
function cleanHainanCoords(feature) {
  var MIN_LAT = 18.0; // 海南主岛最低约 18.2°N，留余量到 18°

  /**
   * 判断一个多边形（坐标数组）的最低纬度是否 >= MIN_LAT
   * @param {Array} polygon - 多边形坐标 [[lng,lat], ...]
   * @returns {boolean}
   */
  function polygonAboveMinLat(polygon) {
    for (var i = 0; i < polygon.length; i++) {
      if (polygon[i][1] < MIN_LAT) return false;
    }
    return true;
  }

  // 深拷贝避免修改原数据
  var cleaned = JSON.parse(JSON.stringify(feature));
  var geometry = cleaned.geometry;

  if (geometry.type === 'MultiPolygon') {
    // MultiPolygon: [ [ [ [lng,lat], ... ] ], ... ]
    // 过滤掉包含低纬度点的多边形
    geometry.coordinates = geometry.coordinates.filter(function(polygonGroup) {
      return polygonGroup.some(function(polygon) {
        return polygonAboveMinLat(polygon);
      });
    });
    // 进一步清理每个多边形组内的子多边形
    geometry.coordinates = geometry.coordinates.map(function(polygonGroup) {
      return polygonGroup.filter(function(polygon) {
        return polygonAboveMinLat(polygon);
      });
    });
  } else if (geometry.type === 'Polygon') {
    // Polygon: [ [lng,lat], ... ]
    if (!polygonAboveMinLat(geometry.coordinates[0])) {
      // 主多边形低于阈值，整个移除（极端情况）
      geometry.coordinates = [];
    }
  }

  return cleaned;
}

/**
 * 配置并渲染 ECharts 地图
 * @param {Object} geoJson - 中国地图 GeoJSON 数据
 */
function renderMap(geoJson) {
  // 使用自定义地图名 'china_custom'，避免 ECharts 自动添加南海诸岛缩略图
  echarts.registerMap('china_custom', geoJson);

  // 需要隐藏的区域（非省级行政区的岛屿等）
  const hiddenNames = buildHiddenRegions(geoJson);
  const hiddenRegions = hiddenNames.map(name => ({
    name: name,
    itemStyle: { areaColor: 'transparent', borderColor: 'transparent' },
    label: { show: false }
  }));

  const option = {
    // 背景透明，使用页面渐变背景
    backgroundColor: 'transparent',

    // 禁用默认 tooltip
    tooltip: { show: false },

    // 纯 series 方式渲染地图（不使用 geo + geoIndex）
    series: [
      {
        name: '省份',
        type: 'map',
        map: 'china_custom',
        roam: false,       // 禁止缩放和平移
        zoom: 1.2,
        scaleLimit: { min: 1, max: 10 },
        // 统一省份填充色
        itemStyle: {
          areaColor: '#2d3748',
          borderColor: '#4a5568',
          borderWidth: 1
        },
        // 默认显示省份名称标签（香港澳门河北由 HTML overlay 单独显示）
        label: {
          show: true,
          color: 'rgba(255,255,255,0.85)',
          fontSize: 11,
          fontWeight: 'normal',
          formatter: function(params) {
            var shortName = toShortName(params.name);
            if (shortName === '香港' || shortName === '澳门' || shortName === '河北') return '';
            return shortName;
          }
        },
        // 鼠标悬停高亮样式
        emphasis: {
          itemStyle: {
            areaColor: '#c53030',
            borderColor: '#fff',
            borderWidth: 1.5,
            shadowBlur: 20,
            shadowColor: 'rgba(197, 48, 48, 0.5)'
          },
          label: {
            show: true,
            color: '#fff',
            fontSize: 13,
            fontWeight: 'bold',
            formatter: function(params) {
              var sn = toShortName(params.name);
              if (sn === '香港' || sn === '澳门' || sn === '河北') return '';
              return sn;
            }
          }
        },
        // 鼠标选中样式
        select: {
          itemStyle: {
            areaColor: '#d69e2e',
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            color: '#fff',
            fontWeight: 'bold',
            formatter: function(params) {
              var sn = toShortName(params.name);
              if (sn === '香港' || sn === '澳门' || sn === '河北') return '';
              return sn;
            }
          }
        },
        // 名称映射：显示全称 → 数据简称
        nameMap: NAME_MAP,
        data: buildMapData(),
        // 隐藏非省级行政区的岛屿（南海诸岛等）
        // 香港和澳门区域极小，ECharts 会合并标签为"港澳"，这里隐藏自带标签
        // 改用 graphic 组件单独显示
        regions: [
          ...hiddenRegions,
          {
            name: '香港特别行政区',
            label: { show: false }
          },
          {
            name: '澳门特别行政区',
            label: { show: false }
          },
          {
            name: '河北省',
            label: { show: false }
          },
          {
            name: '台湾省',
            label: {
              show: true,
              position: 'right',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 11,
              fontWeight: 'normal',
              formatter: '台湾'
            }
          }
        ]
      }
    ]
  };

  myChart.setOption(option, true);

  // ========== 用 HTML overlay 为香港/澳门/河北添加独立标签 ==========
  function addHKMOLabels() {
    const container = document.getElementById('chinaMap');
    container.querySelectorAll('.hk-mo-label').forEach(el => el.remove());

    const hkPx = myChart.convertToPixel('series', [114.17, 22.32]);
    const moPx = myChart.convertToPixel('series', [113.55, 22.20]);
    const hbPx = myChart.convertToPixel('series', [115.47, 38.87]);
    if (!hkPx || !moPx || !hbPx) return;

    const items = [
      { text: '香港', x: hkPx[0] + 6, y: hkPx[1] - 1, name: '香港', geoName: '香港特别行政区' },
      { text: '澳门', x: moPx[0] - 19, y: moPx[1] + 9, name: '澳门', geoName: '澳门特别行政区' },
      { text: '河北', x: hbPx[0] - 10, y: hbPx[1] + 5, name: '河北', geoName: '河北省' }
    ];

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'hk-mo-label';
      el.textContent = item.text;
      el.style.cssText = 'position:absolute;left:' + item.x + 'px;top:' + item.y + 'px;color:rgba(255,255,255,0.85);font-size:11px;font-family:Microsoft YaHei,sans-serif;cursor:pointer;white-space:nowrap;pointer-events:auto;text-shadow:0 1px 3px rgba(0,0,0,0.8);z-index:5;transition:transform 0.2s ease,font-size 0.2s ease,color 0.2s ease;transform-origin:center;';
      el.addEventListener('mouseenter', function() {
        el.style.color = '#fff';
        el.style.fontSize = '13px';
        el.style.fontWeight = 'bold';
        renderHoverCard(item.geoName);
        showHoverCard();
      });
      el.addEventListener('mouseleave', function() {
        el.style.color = 'rgba(255,255,255,0.85)';
        el.style.fontSize = '11px';
        el.style.fontWeight = 'normal';
        hideHoverCard();
      });
      el.addEventListener('click', function() {
        window.location.href = 'province.html?name=' + encodeURIComponent(item.name);
      });
      container.appendChild(el);
    });
  }

  // ECharts 每次渲染完成后立即添加标签（包括初次渲染和 resize 后的重绘），保证标签位置准确且无延迟
  myChart.on('finished', addHKMOLabels);
  // requestAnimationFrame 兜底，确保首次渲染时 labels 即刻出现
  requestAnimationFrame(addHKMOLabels);

  window.addEventListener('resize', function() {
    myChart.resize();
    // addHKMOLabels 由 finished 事件自动触发，无需额外调用
  });

  // ========== 事件绑定 ==========

  // 鼠标悬停在省份上 → 显示美景美食卡片
  myChart.on('mouseover', function (params) {
    if (params.componentType === 'series') {
      const shortName = toShortName(params.name);
      if (PROVINCE_DATA[shortName]) {
        renderHoverCard(params.name);
        showHoverCard();
      }
    }
  });

  // 鼠标移出省份 → 隐藏卡片
  myChart.on('mouseout', function (params) {
    if (params.componentType === 'series') {
      hideHoverCard();
    }
  });

  // 点击省份 → 跳转详情页
  myChart.on('click', function (params) {
    if (params.componentType === 'series') {
      const shortName = toShortName(params.name);
      if (PROVINCE_DATA[shortName]) {
        window.location.href = `province.html?name=${encodeURIComponent(shortName)}`;
      }
    }
  });

  // 鼠标在地图上移动时更新卡片位置
  chartDom.addEventListener('mousemove', function (e) {
    if (hoverCard.classList.contains('visible')) {
      positionHoverCard(e.clientX, e.clientY);
    }
  });
}

/**
 * 加载中国地图 GeoJSON 数据并初始化
 */
async function initMap() {
  try {
    const geoJsonUrl = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json';
    const response = await fetch(geoJsonUrl);

    if (!response.ok) {
      throw new Error('地图数据加载失败');
    }

    const geoJson = await response.json();

    // === 第一步：按名称过滤，只保留34个省级行政区 ===
    const keepSet = new Set(Object.keys(NAME_MAP));
    geoJson.features = geoJson.features.filter(f => keepSet.has(f.properties.name));

    // === 第二步：坐标级兜底清理 ===
    // 清理海南省中的南海岛礁多边形（纬度 < 18°N）
    // 清理台湾省中的东侧离岛（中心经度 > 122°E）
    geoJson.features = geoJson.features.map(f => {
      if (f.properties.name === '海南省') return cleanHainanCoords(f);
      if (f.properties.name === '台湾省') return cleanTaiwanCoords(f);
      return f;
    });

    // === 第三步：删除任何残留的低纬度区域（南海诸岛框等） ===
    geoJson.features = geoJson.features.filter(f => {
      if (!f.geometry || !f.geometry.coordinates) return false;
      var coords = f.geometry.coordinates;
      var minLat = Infinity;
      // 递归提取所有坐标点的纬度
      function extractMinLat(c) {
        if (typeof c[0] === 'number') {
          if (c[1] < minLat) minLat = c[1];
        } else {
          c.forEach(extractMinLat);
        }
      }
      extractMinLat(coords);
      // 如果某区域最低纬度低于 16°N，说明是南海诸岛，删除
      return minLat >= 16;
    });

    renderMap(geoJson);
  } catch (error) {
    console.error('地图初始化失败:', error);
    chartDom.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#fff;">
        <h2 style="margin-bottom:15px;">地图加载失败</h2>
        <p style="opacity:0.7;margin-bottom:20px;">请检查网络连接后刷新页面</p>
        <button onclick="location.reload()" style="padding:10px 30px;border:none;border-radius:25px;background:#c53030;color:#fff;cursor:pointer;font-size:1rem;">重新加载</button>
      </div>
    `;
  }
}

// 窗口大小变化时重新调整图表
window.addEventListener('resize', function () {
  myChart.resize();
});

// 监听地图容器尺寸变化（flex 布局下 window.resize 可能不够）
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(function () {
    myChart.resize();
  }).observe(chartDom);
}

// 启动地图初始化
initMap();
