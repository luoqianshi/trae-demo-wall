/**
 * 方案模板兜底 (WI-0.8)
 * 大模型调用失败/质量校验不过时，按城市+预算返回预置基础方案。
 * 共 6 套模板，覆盖低/中/高预算与室内外场景。
 */
const { POI_DATA } = require('../data/poi');

function pickPoi(city, predicate, used = new Set(), maxCost = Infinity) {
  let pool = (POI_DATA[city] || []).filter(p => predicate(p) && !used.has(p.name) && p.cost <= maxCost);
  if (pool.length === 0) {
    pool = (POI_DATA[city] || []).filter(p => predicate(p) && !used.has(p.name));
  }
  if (pool.length === 0) {
    pool = (POI_DATA[city] || []).filter(p => !used.has(p.name) && p.cost <= maxCost);
  }
  if (pool.length === 0) {
    const fallback = (POI_DATA[city] || []).filter(p => !used.has(p.name));
    if (fallback.length === 0) return null;
    // 预算紧张时选最便宜
    fallback.sort((a, b) => a.cost - b.cost);
    return fallback[0];
  }
  // 优先选便宜的，增加随机性
  pool.sort((a, b) => a.cost - b.cost);
  const top = pool.slice(0, Math.min(3, pool.length));
  return top[Math.floor(Math.random() * top.length)];
}

function buildActivity(time, poi, note) {
  return {
    time,
    name: poi.name,
    location: `${poi.district} · ${poi.name}`,
    cost: poi.cost,
    transport: poi.transport,
    note: note || poi.tags.join('、')
  };
}

/**
 * 生成兜底方案（2套）
 */
function getFallbackPlans(city, budget, weather, mood, companion) {
  const used = new Set();
  const isBadWeather = weather === 'rainy' || weather === 'hot' || weather === 'cold';
  // 预算上限（对齐质量校验容差）
  const BUDGET_MAX = { '0-100': 130, '100-300': 390, '300-500': 650, '500+': 1040 };
  const maxCost = BUDGET_MAX[budget] || 400;
  // 单项预算：占总预算约 40%，确保多活动可组合
  const slotMax = maxCost * 0.45;

  // 方案A：经典休闲线
  const morning1 = pickPoi(city, p => p.category === '漫步' || p.category === '展览', used, slotMax);
  if (morning1) used.add(morning1.name);
  const lunch1 = pickPoi(city, p => p.category === '餐饮', used, slotMax);
  if (lunch1) used.add(lunch1.name);
  const afternoon1 = pickPoi(city, p => isBadWeather
    ? (p.indoor && (p.category === '美术馆' || p.category === '展览' || p.category === '购物'))
    : (p.category === '公园' || p.category === '展览'), used, slotMax);
  if (afternoon1) used.add(afternoon1.name);
  const dinner1 = pickPoi(city, p => p.category === '餐饮', used, slotMax);
  if (dinner1) used.add(dinner1.name);
  const evening1 = pickPoi(city, p => p.category === '漫步' || p.category === '娱乐', used, slotMax);

  const planA = {
    plan_name: `${city}经典周末漫步`,
    tags: ['经典', isBadWeather ? '室内为主' : '户外', (budget === '0-100' || budget === '100-300') ? '低预算' : '品质'],
    activities: [
      morning1 && buildActivity('10:00', morning1),
      lunch1 && buildActivity('12:30', lunch1),
      afternoon1 && buildActivity('14:30', afternoon1),
      dinner1 && buildActivity('18:00', dinner1),
      evening1 && buildActivity('19:30', evening1)
    ].filter(Boolean),
    total_cost: 0,
    backup: isBadWeather ? '天气不佳，已优先安排室内活动' : '若临时下雨，可将户外活动替换为商场或美术馆',
    summary: `一份${city}经典周末方案，从晨间漫步到夜晚归途，轻松自在。`
  };
  planA.total_cost = planA.activities.reduce((s, a) => s + (a.cost || 0), 0);

  // 方案B：文艺探索线
  used.clear();
  const morning2 = pickPoi(city, p => p.category === '美术馆' || p.category === '展览', used, slotMax);
  if (morning2) used.add(morning2.name);
  const lunch2 = pickPoi(city, p => p.category === '餐饮', used, slotMax);
  if (lunch2) used.add(lunch2.name);
  const afternoon2 = pickPoi(city, p => p.category === '购物' || p.category === '展览', used, slotMax);
  if (afternoon2) used.add(afternoon2.name);
  const dinner2 = pickPoi(city, p => p.category === '餐饮', used, slotMax);

  const planB = {
    plan_name: `${city}文艺探索之旅`,
    tags: ['文艺', '探索', '拍照'],
    activities: [
      morning2 && buildActivity('10:30', morning2),
      lunch2 && buildActivity('13:00', lunch2),
      afternoon2 && buildActivity('15:00', afternoon2),
      dinner2 && buildActivity('18:30', dinner2)
    ].filter(Boolean),
    total_cost: 0,
    backup: '如遇闭馆，可改访同区域其他展览或商场',
    summary: `沉浸${city}文艺空间，用展览与街巷填满一个充实的周末。`
  };
  planB.total_cost = planB.activities.reduce((s, a) => s + (a.cost || 0), 0);

  return [planA, planB].filter(p => p.activities.length >= 3);
}

module.exports = { getFallbackPlans };
