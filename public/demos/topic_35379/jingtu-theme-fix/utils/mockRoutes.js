// utils/mockRoutes.js —— 模拟路线数据 & 本地持久化（小程序版）
// 替代 H5 的 localStorage，使用 wx.setStorageSync / wx.getStorageSync

const ROUTES = [
  {
    id: 'r001',
    name: '滨河绿道·夕阳漫步线',
    distanceKm: 5.2,
    durationMin: 45,
    sports: ['散步', '慢跑'],
    timeSlots: ['白天', '夜间'],
    surfaceTypes: ['绿道', '沿河道路', '人行道'],
    tags: ['安静', '低车流', '有路灯', '风景好', '适合新手'],
    scores: { safety: 92, quietness: 88, fitness: 78, scenery: 95 },
    riskReports: [],
    polylineMock: [
      { label: '起点·滨河公园', pos: 'A' },
      { label: '木栈道段 1.2km', pos: 'B' },
      { label: '观景平台', pos: 'C' },
      { label: '终点·健身广场', pos: 'D' }
    ],
    reason: '沿河绿道路况稳定，夜间有连续路灯，适合放松慢跑'
  },
  {
    id: 'r002',
    name: '环城公园·夜间骑行圈',
    distanceKm: 8.6,
    durationMin: 38,
    sports: ['骑行', '慢跑'],
    timeSlots: ['白天', '夜间'],
    surfaceTypes: ['非机动车道', '绿道'],
    tags: ['低车流', '有路灯', '骑行友好'],
    scores: { safety: 85, quietness: 72, fitness: 92, scenery: 78 },
    riskReports: ['道路狭窄'],
    polylineMock: [
      { label: '起点·北门广场', pos: 'A' },
      { label: '护城河段 3km', pos: 'B' },
      { label: '古城墙下穿', pos: 'C' },
      { label: '终点·回到北门', pos: 'D' }
    ],
    reason: '环形路线不易迷路，非机动车道较宽，骑行节奏舒适'
  },
  {
    id: 'r003',
    name: '社区晨跑·林间小路',
    distanceKm: 3.1,
    durationMin: 22,
    sports: ['慢跑', '散步'],
    timeSlots: ['早间', '白天'],
    surfaceTypes: ['人行道', '绿道'],
    tags: ['安静', '风景好', '适合新手'],
    scores: { safety: 95, quietness: 94, fitness: 70, scenery: 90 },
    riskReports: [],
    polylineMock: [
      { label: '起点·社区东门', pos: 'A' },
      { label: '林间步道 1km', pos: 'B' },
      { label: '小广场折返点', pos: 'C' },
      { label: '终点·社区东门', pos: 'D' }
    ],
    reason: '几乎无机动车干扰，林荫小路空气好，适合晨跑新手'
  },
  {
    id: 'r004',
    name: '主干道通勤骑行带',
    distanceKm: 10.3,
    durationMin: 42,
    sports: ['骑行'],
    timeSlots: ['早间', '白天'],
    surfaceTypes: ['非机动车道', '机动车混行'],
    tags: ['路线平直', '有路灯'],
    scores: { safety: 65, quietness: 45, fitness: 88, scenery: 55 },
    riskReports: ['下班高峰车流', '噪音大'],
    polylineMock: [
      { label: '起点·地铁口 A', pos: 'A' },
      { label: '主路骑行段 5km', pos: 'B' },
      { label: '路口转折', pos: 'C' },
      { label: '终点·商务园', pos: 'D' }
    ],
    reason: '里程较长、骑行效率高，但高峰时段车流与噪音偏大'
  },
  {
    id: 'r005',
    name: '老城巷弄·夜探散步',
    distanceKm: 4.3,
    durationMin: 50,
    sports: ['散步'],
    timeSlots: ['白天', '夜间'],
    surfaceTypes: ['人行道', '沿河道路'],
    tags: ['安静', '风景好', '人文氛围'],
    scores: { safety: 78, quietness: 82, fitness: 60, scenery: 88 },
    riskReports: ['道路狭窄', '无路灯'],
    polylineMock: [
      { label: '起点·古牌坊', pos: 'A' },
      { label: '石板巷 1.5km', pos: 'B' },
      { label: '小河边', pos: 'C' },
      { label: '终点·夜市口', pos: 'D' }
    ],
    reason: '巷弄环境安静、富有人文气息，但部分路段照明不足'
  },
  {
    id: 'r006',
    name: '滨江大道·周末长距离',
    distanceKm: 9.8,
    durationMin: 80,
    sports: ['慢跑', '骑行'],
    timeSlots: ['早间', '白天'],
    surfaceTypes: ['绿道', '沿河道路'],
    tags: ['风景好', '有路灯', '低车流', '长距离'],
    scores: { safety: 88, quietness: 80, fitness: 90, scenery: 96 },
    riskReports: [],
    polylineMock: [
      { label: '起点·滨江公园', pos: 'A' },
      { label: '滨江绿道 4km', pos: 'B' },
      { label: '观江平台', pos: 'C' },
      { label: '终点·运动中心', pos: 'D' }
    ],
    reason: '视野开阔、路线长而直，适合有一定基础的跑者'
  },
  {
    id: 'r007',
    name: '校园环路·新手骑行',
    distanceKm: 3.5,
    durationMin: 18,
    sports: ['骑行', '散步'],
    timeSlots: ['早间', '白天', '夜间'],
    surfaceTypes: ['非机动车道', '绿道'],
    tags: ['低车流', '有路灯', '适合新手', '骑行友好'],
    scores: { safety: 93, quietness: 85, fitness: 75, scenery: 80 },
    riskReports: [],
    polylineMock: [
      { label: '起点·校门', pos: 'A' },
      { label: '操场外环', pos: 'B' },
      { label: '林荫路段', pos: 'C' },
      { label: '终点·图书馆前', pos: 'D' }
    ],
    reason: '封闭/半封闭道路，机动车极少，新手骑行训练首选'
  },
  {
    id: 'r008',
    name: '河道串联·夜跑推荐',
    distanceKm: 5.8,
    durationMin: 48,
    sports: ['慢跑', '散步'],
    timeSlots: ['夜间', '白天'],
    surfaceTypes: ['绿道', '沿河道路', '人行道'],
    tags: ['有路灯', '低车流', '安静', '适合新手'],
    scores: { safety: 86, quietness: 83, fitness: 80, scenery: 87 },
    riskReports: ['施工'],
    polylineMock: [
      { label: '起点·河道广场', pos: 'A' },
      { label: '南岸绿道 2.5km', pos: 'B' },
      { label: '跨河桥折返', pos: 'C' },
      { label: '终点·河道广场', pos: 'D' }
    ],
    reason: '近期有小段施工但可通行，整体夜跑体验良好'
  }
];

// 运行时补丁池（保存用户对预置路线的上报修改）
// key: routeId, value: { scores, riskReports, ... }
let runtimePatches = {};

/** 读取持久化的 UGC 路线 */
function loadUserRoutes() {
  try {
    const raw = wx.getStorageSync('jingtu_user_routes');
    if (raw && Array.isArray(raw)) return raw;
  } catch (e) {
    // ignore
  }
  return [];
}

/** 保存 UGC 路线到本地存储 */
function saveUserRoutes(list) {
  try {
    wx.setStorageSync('jingtu_user_routes', list);
  } catch (e) {
    // ignore
  }
}

/** 加载运行时补丁（跨页面保留对预置路线的修改） */
function loadPatches() {
  try {
    const raw = wx.getStorageSync('jingtu_patches');
    if (raw && typeof raw === 'object') runtimePatches = raw;
  } catch (e) {
    // ignore
  }
}

/** 保存运行时补丁 */
function savePatches() {
  try {
    wx.setStorageSync('jingtu_patches', runtimePatches);
  } catch (e) {
    // ignore
  }
}

/** 取得全部路线（预置 + UGC） */
function getAllRoutes() {
  return ROUTES.concat(loadUserRoutes());
}

/** 应用运行时补丁后的路线列表 */
function getAllRoutesPatched() {
  loadPatches();
  const base = getAllRoutes();
  return base.map(function (r) {
    if (!runtimePatches[r.id]) return r;
    const patch = runtimePatches[r.id];
    const merged = Object.assign({}, r, patch);
    if (patch.scores) {
      merged.scores = Object.assign({}, r.scores, patch.scores);
    }
    if (patch.riskReports) {
      const baseRisks = r.riskReports || [];
      merged.riskReports = Array.from(new Set(baseRisks.concat(patch.riskReports)));
    }
    return merged;
  });
}

/** 按 id 查询路线（已应用补丁） */
function getRouteById(id) {
  return getAllRoutesPatched().find(function (r) { return r.id === id; });
}

/** 更新路线（UGC 直接写入存储，预置写运行时补丁） */
function updateRoute(id, patch) {
  // 先尝试 UGC 池
  const userRoutes = loadUserRoutes();
  const idx = userRoutes.findIndex(function (r) { return r.id === id; });
  if (idx >= 0) {
    userRoutes[idx] = Object.assign({}, userRoutes[idx], patch);
    if (patch.scores) {
      userRoutes[idx].scores = Object.assign({}, userRoutes[idx].scores, patch.scores);
    }
    if (patch.riskReports) {
      const baseRisks = userRoutes[idx].riskReports || [];
      userRoutes[idx].riskReports = Array.from(new Set(baseRisks.concat(patch.riskReports)));
    }
    saveUserRoutes(userRoutes);
    return true;
  }
  // 预置路线：写入运行时补丁
  loadPatches();
  if (!runtimePatches[id]) runtimePatches[id] = {};
  runtimePatches[id] = Object.assign({}, runtimePatches[id], patch);
  savePatches();
  return true;
}

/** 新增用户上传路线 */
function addUserRoute(route) {
  const list = loadUserRoutes();
  list.push(route);
  saveUserRoutes(list);
}

/** 清空全部演示数据 */
function resetAll() {
  runtimePatches = {};
  try { wx.setStorageSync('jingtu_patches', {}); } catch (e) {}
  try { wx.setStorageSync('jingtu_user_routes', []); } catch (e) {}
  try { wx.removeStorageSync('jingtu_pref'); } catch (e) {}
}

/** 保存 / 读取用户当前偏好（推荐页顶部可回显） */
function setPreference(p) {
  try { wx.setStorageSync('jingtu_pref', p); } catch (e) {}
}
function getPreference() {
  try {
    const raw = wx.getStorageSync('jingtu_pref');
    return raw || null;
  } catch (e) { return null; }
}

module.exports = {
  ROUTES: ROUTES,
  getAllRoutes: getAllRoutes,
  getAllRoutesPatched: getAllRoutesPatched,
  getRouteById: getRouteById,
  updateRoute: updateRoute,
  addUserRoute: addUserRoute,
  resetAll: resetAll,
  setPreference: setPreference,
  getPreference: getPreference
};
