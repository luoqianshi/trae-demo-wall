/**
 * 规则生成器 (AI 层降级方案)
 * 未配置大模型 API Key 时，基于 POI 数据与用户偏好的规则引擎生成差异化方案。
 * 保证 Demo 在无 Key 环境下也能输出真实、多样的可执行方案。
 */
const { POI_DATA } = require('../data/poi');

const BUDGET_BOUNDS = {
  '0-100': [0, 100],
  '100-300': [100, 300],
  '300-500': [300, 500],
  '500+': [300, 800]
};

const COMPANION_NEEDS = {
  'family': ['亲子'],
  'couple': ['约会'],
  'solo': [],
  'friends': ['社交']
};

// 三套方案的差异化主题
const PLAN_THEMES = [
  {
    key: 'outdoor',
    name: suffix => `${suffix}户外漫步之旅`,
    tags: ['户外', '放松'],
    timeSlots: ['10:00', '12:30', '14:30', '18:00', '19:30'],
    slotPrefs: [
      { cats: ['漫步', '公园'], note: '晨间放松' },
      { cats: ['餐饮'], note: '午餐补给' },
      { cats: ['公园', '漫步', '展览'], note: '午后时光' },
      { cats: ['餐饮'], note: '晚餐' },
      { cats: ['漫步', '娱乐'], note: '夜晚收尾' }
    ]
  },
  {
    key: 'culture',
    name: suffix => `${suffix}文艺探索之旅`,
    tags: ['文艺', '探索'],
    timeSlots: ['10:30', '13:00', '15:00', '18:30'],
    slotPrefs: [
      { cats: ['美术馆', '展览'], note: '沉浸展览' },
      { cats: ['餐饮'], note: '特色午餐' },
      { cats: ['展览', '购物'], note: '创意空间' },
      { cats: ['餐饮'], note: '晚餐' }
    ]
  },
  {
    key: 'social',
    name: suffix => `${suffix}城市漫游之旅`,
    tags: ['社交', '拍照'],
    timeSlots: ['11:00', '13:00', '15:30', '18:00'],
    slotPrefs: [
      { cats: ['购物', '漫步'], note: '逛街探店' },
      { cats: ['餐饮'], note: '人气午餐' },
      { cats: ['娱乐', '展览'], note: '互动体验' },
      { cats: ['餐饮', '娱乐'], note: '收尾' }
    ]
  }
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickFrom(pois, slotPref, weather, companion, budgetLimit, used, runningTotal) {
  const isBadWeather = weather === 'rainy' || weather === 'hot' || weather === 'cold';
  let candidates = pois.filter(p => slotPref.cats.includes(p.category) && !used.has(p.name));

  // 雨天/极端天气强制室内
  if (isBadWeather) {
    candidates = candidates.filter(p => p.indoor);
    if (candidates.length === 0) {
      candidates = pois.filter(p => p.indoor && !used.has(p.name));
    }
  }

  // 预算感知（优先于同伴偏好，确保总预算可控）
  if (budgetLimit) {
    const remaining = budgetLimit - (runningTotal || 0);
    if (remaining <= 0) {
      // 预算耗尽：仅选免费 POI，无则跳过该时段
      const free = candidates.filter(p => p.cost === 0);
      if (free.length > 0) candidates = free;
      else return null;
    } else {
      const within = candidates.filter(p => p.cost <= remaining);
      if (within.length > 0) {
        candidates = within;
      } else {
        // 无候选在剩余预算内：选最便宜的，但若超预算上限则跳过该时段
        candidates.sort((a, b) => a.cost - b.cost);
        const cheapest = candidates[0];
        if (cheapest && (runningTotal + cheapest.cost) > budgetLimit) return null;
        candidates = [cheapest];
      }
    }
  }

  // 同行人偏好作为软偏好：在预算可行范围内优先匹配
  const needTags = COMPANION_NEEDS[companion] || [];
  if (needTags.length > 0 && candidates.length > 2) {
    const preferred = candidates.filter(p => p.tags.some(t => needTags.includes(t)));
    if (preferred.length > 0) candidates = preferred;
  }

  if (candidates.length === 0) {
    candidates = pois.filter(p => !used.has(p.name));
  }
  if (candidates.length === 0) return null;

  return shuffle(candidates)[0];
}

function buildPlan(theme, city, weather, mood, companion, budget) {
  const pois = POI_DATA[city] || [];
  if (pois.length === 0) return null;

  const bounds = BUDGET_BOUNDS[budget] || [0, 500];
  // 预算上限对齐质量校验容差（30%），留少量余量
  const budgetLimit = bounds[1] * 1.25;
  const used = new Set();
  let runningTotal = 0;
  const activities = [];

  theme.slotPrefs.forEach((slotPref, idx) => {
    const poi = pickFrom(pois, slotPref, weather, companion, budgetLimit, used, runningTotal);
    if (poi) {
      used.add(poi.name);
      runningTotal += poi.cost;
      const extraTags = poi.tags.filter(t => (mood || []).includes(t));
      activities.push({
        time: theme.timeSlots[idx],
        name: poi.name,
        location: `${poi.district} · ${poi.name}`,
        cost: poi.cost,
        transport: poi.transport,
        note: extraTags.length > 0 ? `${slotPref.note}·${extraTags.join('、')}` : `${slotPref.note}·${poi.tags.slice(0, 2).join('、')}`
      });
    }
  });

  if (activities.length < 3) return null;

  const totalCost = activities.reduce((s, a) => s + (a.cost || 0), 0);
  const isBadWeather = weather === 'rainy' || weather === 'hot' || weather === 'cold';
  const tags = [...theme.tags];
  if (isBadWeather) tags.push(weather === 'rainy' ? '雨天适配' : '天气提醒');
  if (budget === '0-100' || budget === '100-300') tags.push('低预算');

  const moodWord = (mood && mood[0]) || '轻松';

  return {
    plan_name: theme.name(city),
    tags: [...new Set(tags)],
    activities,
    total_cost: totalCost,
    backup: isBadWeather
      ? '当前天气不佳，已优先安排室内活动；若天气转好可替换为户外公园'
      : '若遇突发降雨，可将户外活动替换为同区域商场或美术馆',
    summary: `一份${moodWord}的${city}周末方案，${theme.tags.join('与')}，总预算约 ¥${totalCost}/人。`
  };
}

/**
 * 生成 2-3 套差异化方案
 */
function generate(prefs) {
  const { city, budget, weather, mood, companion } = prefs;
  // 极端天气（雨/高温/低温）户外线降级为室内漫步主题
  const isBadWeather = weather === 'rainy' || weather === 'hot' || weather === 'cold';
  let themes = [...PLAN_THEMES];
  if (isBadWeather) {
    themes[0] = {
      ...themes[0],
      name: s => `${s}室内漫游之旅`,
      tags: ['室内', '放松'],
      slotPrefs: [
        { cats: ['展览', '美术馆', '购物'], note: '室内晨间' },
        { cats: ['餐饮'], note: '午餐补给' },
        { cats: ['展览', '美术馆', '购物'], note: '午后室内' },
        { cats: ['餐饮'], note: '晚餐' },
        { cats: ['娱乐', '展览'], note: '夜晚收尾' }
      ]
    };
  }

  const plans = [];
  for (const theme of themes) {
    const plan = buildPlan(theme, city, weather, mood, companion, budget);
    if (plan) plans.push(plan);
    if (plans.length >= 3) break;
  }
  return plans;
}

/**
 * 替换单个活动时，选一个同类型的新 POI (WI-2.1)
 * @param {object} prefs - 用户偏好
 * @param {object} oldActivity - 旧活动
 * @param {Set} usedNames - 已用地点名集合（排除重复）
 * @returns {object|null} 新 POI
 */
function pickReplacementActivity(prefs, oldActivity, usedNames) {
  const city = prefs.city || '上海';
  const pois = POI_DATA[city] || [];
  if (pois.length === 0) return null;

  // 从旧活动名推断分类
  const oldName = oldActivity.name || '';
  const oldPoi = pois.find(p => oldName.includes(p.name) || p.name.includes(oldName));
  const targetCats = oldPoi ? [oldPoi.category] : ['漫步', '展览', '餐饮'];

  // 筛选同类型、未用过的 POI
  let candidates = pois.filter(p =>
    targetCats.includes(p.category) && !usedNames.has(p.name)
  );
  if (candidates.length === 0) {
    candidates = pois.filter(p => !usedNames.has(p.name));
  }
  if (candidates.length === 0) return null;

  // 天气适配
  const isBadWeather = prefs.weather === 'rainy' || prefs.weather === 'hot' || prefs.weather === 'cold';
  if (isBadWeather) {
    const indoor = candidates.filter(p => p.indoor);
    if (indoor.length > 0) candidates = indoor;
  }

  // 预算适配
  const bounds = BUDGET_BOUNDS[prefs.budget] || [0, 500];
  const budgetMax = bounds[1] * 1.25;
  const within = candidates.filter(p => p.cost <= budgetMax);
  if (within.length > 0) candidates = within;

  return shuffle(candidates)[0];
}

module.exports = { generate, pickReplacementActivity };
