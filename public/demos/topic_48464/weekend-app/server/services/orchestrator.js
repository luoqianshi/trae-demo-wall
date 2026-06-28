/**
 * 方案生成编排服务 (WI-0.4 / WI-1.1 / WI-1.3 / WI-1.4)
 * 编排全链路：偏好校验 → 天气适配 → 缓存检查 → 组装Prompt → 调AI → 质量校验 → 兜底降级 → 埋点 → 返回。
 */
const config = require('../config');
const { buildPrompt } = require('./promptEngine');
const llmClient = require('./llmClient');
const mockGenerator = require('./mockGenerator');
const { validate } = require('./qualityCheck');
const { getFallbackPlans } = require('./templateFallback');
const { getWeather } = require('./weatherService');
const { PlanCache } = require('./cacheManager');
const analytics = require('./analytics');

const cache = new PlanCache();

const VALID_CITIES = ['上海', '北京', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '重庆', '苏州', '长沙', '天津', '青岛', '厦门', '昆明'];
const VALID_BUDGETS = ['0-100', '100-300', '300-500', '500+'];
const VALID_WEATHERS = ['sunny', 'rainy', 'cloudy', 'hot', 'cold'];
const VALID_COMPANIONS = ['solo', 'couple', 'family', 'friends'];

function normalizePrefs(input) {
  const prefs = {
    city: input.city || '上海',
    budget: VALID_BUDGETS.includes(input.budget) ? input.budget : '100-300',
    weather: VALID_WEATHERS.includes(input.weather) ? input.weather : 'sunny',
    mood: Array.isArray(input.mood) ? input.mood.filter(Boolean) : ['放松'],
    companion: VALID_COMPANIONS.includes(input.companion) ? input.companion : 'solo'
  };
  if (!VALID_CITIES.includes(prefs.city)) prefs.city = '上海';
  if (prefs.mood.length === 0) prefs.mood = ['放松'];
  return prefs;
}

/**
 * 生成方案主流程
 * @param {object} input - 用户偏好
 * @param {object} options - { bypassCache, autoWeather }
 * @returns {Promise<{plans, source, latency, cached, weather}>}
 */
async function generatePlans(input, options = {}) {
  const t0 = Date.now();
  let prefs = normalizePrefs(input);
  const { bypassCache = false, autoWeather = false } = options;

  // 天气适配 (WI-1.1): 获取实时天气作为参考
  // 自动切换逻辑：降雨概率高→雨天；高温→hot；低温→cold
  let weatherInfo = null;
  if (autoWeather && config.weather.enabled && !config.demo.offlineMode) {
    weatherInfo = await getWeather(prefs.city);
    const autoWeatherType = weatherInfo.weather;
    // 当检测到恶劣天气（雨/高温/低温）且用户未手动指定时自动切换
    if (autoWeatherType === 'rainy' && prefs.weather !== 'rainy') {
      prefs.weather = 'rainy';
    } else if (autoWeatherType === 'hot' && prefs.weather === 'sunny') {
      // 仅当用户选了晴天时自动切为高温（用户手动选雨天/多云不覆盖）
      prefs.weather = 'hot';
    } else if (autoWeatherType === 'cold' && prefs.weather === 'sunny') {
      prefs.weather = 'cold';
    }
  }

  // 缓存检查 (WI-1.3)
  if (config.cache.enabled && !bypassCache) {
    const cached = cache.get(prefs);
    if (cached) {
      return {
        plans: cached,
        source: 'cache',
        latency: Date.now() - t0,
        cached: true,
        weather: weatherInfo
      };
    }
  }

  let source = 'llm';
  let plans = [];

  // 1. 尝试大模型（配置了 Key 且非离线模式时）
  if (config.llm.apiKey && !config.demo.offlineMode) {
    const { systemPrompt, userPrompt } = buildPrompt(prefs);
    const raw = await llmClient.generate(prefs, { systemPrompt, userPrompt });
    if (Array.isArray(raw) && raw.length > 0) {
      plans = raw;
    }
  }

  // 2. 未配置 Key 或 LLM 失败 → 规则生成器
  if (plans.length === 0) {
    source = config.llm.apiKey ? 'mock(fallback)' : 'mock';
    plans = mockGenerator.generate(prefs);
  }

  // 3. 质量校验，剔除不合规方案
  const ctx = { budget: prefs.budget, weather: prefs.weather, city: prefs.city };
  let validPlans = plans.filter(p => validate(p, ctx).valid);

  // 4. 校验失败过多 → 补充兜底模板
  if (validPlans.length < 2) {
    source = validPlans.length === 0 ? 'template' : `${source}+template`;
    const fallback = getFallbackPlans(prefs.city, prefs.budget, prefs.weather, prefs.mood, prefs.companion);
    const merged = [...validPlans, ...fallback];
    const seen = new Set();
    validPlans = merged.filter(p => {
      if (seen.has(p.plan_name)) return false;
      seen.add(p.plan_name);
      return true;
    }).slice(0, 3);
  }

  // 保底：确保至少返回 1 套
  if (validPlans.length === 0) {
    source = 'template';
    validPlans = getFallbackPlans(prefs.city, prefs.budget, prefs.weather, prefs.mood, prefs.companion);
  }

  // 写入缓存
  if (config.cache.enabled) {
    cache.set(prefs, validPlans);
  }

  // 埋点 (WI-1.4)
  if (config.analytics.enabled) {
    analytics.track('generate', {
      city: prefs.city,
      budget: prefs.budget,
      weather: prefs.weather,
      companion: prefs.companion,
      source,
      plan_count: validPlans.length,
      latency_ms: Date.now() - t0
    });
  }

  return {
    plans: validPlans,
    source,
    latency: Date.now() - t0,
    cached: false,
    weather: weatherInfo
  };
}

/**
 * 替换单个活动 (WI-2.1 / F5)
 * 在一个已有方案中，替换某个时段的活动，保持其余活动不变。
 * @param {object} plan - 完整方案
 * @param {number} activityIndex - 要替换的活动序号
 * @param {object} prefs - 用户偏好
 * @returns {object} 替换后的新方案
 */
function replaceActivity(plan, activityIndex, prefs) {
  const activities = [...(plan.activities || [])];
  if (activityIndex < 0 || activityIndex >= activities.length) return plan;

  const oldActivity = activities[activityIndex];
  // 用规则生成器选一个新的同类型活动，排除已用的地点
  const usedNames = new Set(activities.map(a => a.name));
  const newActivity = mockGenerator.pickReplacementActivity(prefs, oldActivity, usedNames);

  if (newActivity) {
    activities[activityIndex] = {
      time: oldActivity.time, // 保持时间不变
      name: newActivity.name,
      location: `${newActivity.district} · ${newActivity.name}`,
      cost: newActivity.cost,
      transport: newActivity.transport,
      note: newActivity.tags.slice(0, 2).join('、')
    };
  }

  const totalCost = activities.reduce((s, a) => s + (a.cost || 0), 0);

  return {
    ...plan,
    activities,
    total_cost: totalCost,
    summary: plan.summary // 保持摘要不变
  };
}

module.exports = { generatePlans, normalizePrefs, cache, replaceActivity };
