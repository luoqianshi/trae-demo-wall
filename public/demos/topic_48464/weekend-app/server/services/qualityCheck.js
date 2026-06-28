/**
 * 输出质量校验 (WI-0.7)
 * 校验方案结构完整性、字段非空、预算合理性、地点真实性、天气适配性。
 */
const { POI_DATA } = require('../data/poi');

// 预算区间映射
const BUDGET_RANGES = {
  '0-100': [0, 100],
  '100-300': [100, 300],
  '300-500': [300, 500],
  '500+': [300, 1000]
};

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isValidPlan(plan) {
  if (!plan || typeof plan !== 'object') return false;
  if (!isNonEmptyString(plan.plan_name)) return false;
  if (!Array.isArray(plan.tags) || plan.tags.length === 0) return false;
  if (!Array.isArray(plan.activities) || plan.activities.length < 3) return false;
  if (typeof plan.total_cost !== 'number') return false;
  if (!isNonEmptyString(plan.summary)) return false;
  // 每个活动必填字段校验（transport/note 为可选，精简 Prompt 不含这两个字段）
  for (const a of plan.activities) {
    if (!isNonEmptyString(a.time)) return false;
    if (!isNonEmptyString(a.name)) return false;
    if (!isNonEmptyString(a.location)) return false;
    if (typeof a.cost !== 'number') return false;
  }
  return true;
}

/**
 * 检查预算合理性：总费用是否落在用户选定区间内（允许 ±20% 容差）
 */
function checkBudget(plan, budgetKey) {
  const range = BUDGET_RANGES[budgetKey];
  if (!range) return true; // 未知区间不拦截
  const [low, high] = range;
  // 容差 30%，低预算额外放宽 30 元保底，避免全天含两餐仍超限
  const tolerance = Math.max(high * 0.3, 30);
  // 费用低于区间下限不算失败（省钱是好事），只拦截超上限
  return plan.total_cost <= high + tolerance;
}

/**
 * 检查地点真实性：推荐地点是否在 POI 数据库中或包含真实可识别地点
 * 对大模型输出做宽松校验：只要活动 location/name 命中已知 POI 或包含城市真实地标即通过
 */
function checkLocationAuthenticity(plan, city) {
  const cityPois = POI_DATA[city] || [];
  const poiNames = new Set(cityPois.map(p => p.name));
  let hitCount = 0;
  for (const a of plan.activities) {
    const loc = (a.location || '') + (a.name || '');
    // 命中已知 POI 名称，或包含城市区域/地标关键词
    const inPoi = [...poiNames].some(n => loc.includes(n) || n.includes(loc));
    const hasDistrict = cityPois.some(p => loc.includes(p.district));
    if (inPoi || hasDistrict) hitCount++;
  }
  // 至少一半活动有真实地点依据
  return hitCount >= Math.ceil(plan.activities.length / 2);
}

/**
 * 检查天气适配性：雨天/极端天气下室内活动占比
 */
function checkWeatherAdaptation(plan, weather) {
  if (weather !== 'rainy' && weather !== 'hot' && weather !== 'cold') return true;
  const indoorActivities = plan.activities.filter(a => {
    const text = (a.name || '') + (a.note || '');
    return text.includes('室内') || text.includes('馆') || text.includes('商场') ||
           text.includes('影院') || text.includes('展') || text.includes('中心');
  });
  return indoorActivities.length >= Math.ceil(plan.activities.length / 2);
}

/**
 * 综合校验，返回 { valid, issues[] }
 */
function validate(plan, { budget, weather, city } = {}) {
  const issues = [];
  if (!isValidPlan(plan)) {
    issues.push('方案结构不完整：缺少必填字段或活动数量不足');
    return { valid: false, issues };
  }
  if (budget && !checkBudget(plan, budget)) {
    issues.push(`预算超限：方案总费用 ¥${plan.total_cost} 不在 ${budget} 区间内`);
  }
  if (city && !checkLocationAuthenticity(plan, city)) {
    issues.push('地点真实性存疑：过半活动无法匹配真实 POI');
  }
  if (weather && !checkWeatherAdaptation(plan, weather)) {
    issues.push('天气适配不足：当前天气下室内活动占比偏低');
  }
  return { valid: issues.length === 0, issues };
}

module.exports = { validate, isValidPlan, checkBudget, checkLocationAuthenticity, checkWeatherAdaptation };
