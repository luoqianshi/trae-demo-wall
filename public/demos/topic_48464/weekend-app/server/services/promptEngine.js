/**
 * Prompt 工程引擎 (WI-0.5 · 速度优化版)
 * 根据用户偏好组装结构化 Prompt，仅注入筛选后的高相关 POI（减少输入 token），
 * 精简输出 Schema（减少输出 token），从根上缩短大模型生成耗时。
 */
const { POI_DATA } = require('../data/poi');

const MOOD_DESC = {
  '放松': '舒缓节奏，自然景观和静谧空间',
  '探索': '小众有新鲜感的地点',
  '社交': '适合交流的餐厅、市集、互动展览',
  '运动': '步行、骑行、公园等身体活动',
  '文艺': '美术馆、书店、创意园区'
};

const COMPANION_DESC = {
  'solo': '单人友好',
  'couple': '浪漫氛围',
  'family': '儿童友好含室内外备选',
  'friends': '多人互动热闹场景'
};

const WEATHER_DESC = {
  'sunny': '晴天适合户外',
  'rainy': '雨天必须室内',
  'cloudy': '室内外均可',
  'hot': '高温优先室内空调场所',
  'cold': '低温优先室内温暖场所'
};

const BUDGET_BOUNDS = {
  '0-100': [0, 100],
  '100-300': [0, 300],
  '300-500': [0, 500],
  '500+': [0, 9999]
};

/**
 * 按偏好筛选 Top N 高相关 POI，减少注入 Prompt 的数据量
 */
function filterRelevantPois(city, prefs) {
  const pois = POI_DATA[city] || [];
  if (pois.length === 0) return [];

  const [minCost, maxCost] = BUDGET_BOUNDS[prefs.budget] || [0, 500];
  const isBadWeather = prefs.weather === 'rainy' || prefs.weather === 'hot' || prefs.weather === 'cold';

  // 评分排序：预算匹配 + 天气匹配 + 心情匹配
  const scored = pois.map(p => {
    let score = 0;
    if (p.cost <= maxCost) score += 3;
    if (isBadWeather && p.indoor) score += 4;
    if (!isBadWeather && !p.indoor) score += 2;
    // 心情匹配
    const moodMap = { '文艺': ['文艺', '展览', '博物馆'], '运动': ['漫步', '公园'], '放松': ['公园', '漫步'], '社交': ['餐饮', '市集'], '探索': ['小众', '创意'] };
    (prefs.mood || []).forEach(m => {
      const keywords = moodMap[m] || [];
      keywords.forEach(kw => {
        if (p.tags.some(t => t.includes(kw)) || p.category.includes(kw)) score += 2;
      });
    });
    return { poi: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  // 取前 15 个，确保品类多样
  const selected = [];
  const categories = new Set();
  for (const { poi } of scored) {
    if (selected.length >= 15) break;
    // 每个品类最多 4 个，保证多样性
    if (categories.has(poi.category) && [...selected].filter(s => s.category === poi.category).length >= 4) continue;
    selected.push(poi);
    categories.add(poi.category);
  }
  return selected;
}

/**
 * 组装精简 Prompt（速度优化版）
 */
function buildPrompt(prefs) {
  const { city, budget, weather, mood, companion } = prefs;
  const relevantPois = filterRelevantPois(city, prefs);

  // 精简 POI 列表：只保留名字/品类/区域/费用/室内外
  const poiList = relevantPois.map(p =>
    `${p.name}(${p.category},${p.district},¥${p.cost},${p.indoor ? '室内' : '户外'})`
  ).join('; ');

  const moodTexts = (mood || ['放松']).map(m => MOOD_DESC[m] || m).join('、');
  const weatherText = WEATHER_DESC[weather] || '不限';
  const companionText = COMPANION_DESC[companion] || '';

  const systemPrompt = `你是城市周末活动策划师。只输出JSON数组，不解释。`;

  const userPrompt = `为以下偏好生成3套差异化周末方案。

城市:${city} 预算:${budget}元/人 天气:${weatherText} 心情:${moodTexts} 同行:${companionText}

可选地点:${poiList}

要求:地点从上方选取;总费用在预算内;三套风格完全不同(如户外/文艺/社交)。
${weather === 'rainy' || weather === 'hot' || weather === 'cold' ? '当前天气恶劣，全部活动必须室内。' : ''}

输出JSON数组(无markdown,不要任何解释文字):
[{"plan_name":"名称(10-20字)","tags":["标签1","标签2"],"activities":[{"time":"10:00","name":"活动名","location":"区域·地点","cost":0}],"total_cost":0,"backup":"备选建议一句话","summary":"一句话总结"}]`;

  return { systemPrompt, userPrompt };
}

module.exports = { buildPrompt, filterRelevantPois };
