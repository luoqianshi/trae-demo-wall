// utils/recommend.js —— AI 推荐核心算法（小程序版）
// 算法 = 距离匹配分 + 类型/时段命中 + 四维评分 × 权重 − 情境扣分 + 模板加分
// 输出每条路线的 recommendScore 与自然语言 aiReason

const mockRoutes = require('./mockRoutes.js');

// 人群预设模板配置（与首页 index.js 保持一致）
const TEMPLATE_CONFIG = {
  'elderly': {
    name: '中老年散步',
    weights: { safety: 0.45, quietness: 0.40, fitness: 0.05, scenery: 0.10 },
    penalties: { '陡坡': 20, '大车路': 25, '机动车混行': 18, '道路狭窄': 15 },
    bonus: { '有休息区': 10, '有公厕': 8, '平缓': 12 }
  },
  'youth_night': {
    name: '青年夜跑',
    weights: { safety: 0.50, quietness: 0.20, fitness: 0.20, scenery: 0.10 },
    penalties: { '无路灯': 30, '道路狭窄': 12, '施工': 15 },
    bonus: { '有路灯': 15, '绿道连续': 10, '平缓': 8 }
  },
  'family': {
    name: '亲子慢行',
    weights: { safety: 0.50, quietness: 0.25, fitness: 0.05, scenery: 0.20 },
    penalties: { '无防护': 20, '陡坡': 25, '道路狭窄': 18, '机动车混行': 20 },
    bonus: { '有休息区': 15, '有公厕': 12, '有儿童设施': 10, '平缓': 10 }
  },
  'fitness_cycling': {
    name: '燃脂骑行',
    weights: { safety: 0.15, quietness: 0.20, fitness: 0.50, scenery: 0.15 },
    penalties: { '台阶': 25, '拥挤路口': 20, '行人密集': 18, '红绿灯多': 15, '道路狭窄': 12 },
    bonus: { '绿道连续': 15, '路面平整': 12, '无中断': 10, '骑行友好': 8 }
  },
  'scenic_cycling': {
    name: '观景轻骑行',
    weights: { safety: 0.15, quietness: 0.35, fitness: 0.10, scenery: 0.40 },
    penalties: { '噪音大': 15, '机动车混行': 12 },
    bonus: { '滨河': 15, '公园': 12, '风景好': 10, '平缓': 8 }
  }
};

// 分时动态规则（根据时段调整权重与扣分）
function getTimeBasedAdjustments(timeSlot) {
  const adjustments = {
    weightMultiplier: { safety: 1, quietness: 1, fitness: 1, scenery: 1 },
    extraPenalties: {},
    extraBonus: {},
    timeDesc: ''
  };

  // 早间 5-7 点：安静权重拉满，优先人少平缓步道
  if (timeSlot === '早间') {
    adjustments.weightMultiplier.quietness = 1.5;
    adjustments.extraBonus['平缓'] = 8;
    adjustments.extraBonus['人少'] = 10;
    adjustments.timeDesc = '清晨时段，安静权重提升';
  }

  // 夜间（21点后）：路灯评分权重提升，无路灯道路额外扣15分
  if (timeSlot === '夜间') {
    adjustments.weightMultiplier.safety = 1.3;
    adjustments.extraPenalties['无路灯'] = 15;
    adjustments.extraBonus['有路灯'] = 10;
    adjustments.timeDesc = '夜间时段，照明权重提升';
  }

  // 通勤高峰时段（早7-9、晚17-19）：车流扣分翻倍，自动避开主干道
  // 这里用时段近似：早间/白天都可能包含高峰，夜间不包含
  if (timeSlot === '早间' || timeSlot === '白天') {
    adjustments.extraPenalties['下班高峰车流'] = 12; // 原有12分，翻倍为24分（在基础扣分上叠加）
    adjustments.extraPenalties['机动车混行'] = 10;
    adjustments.timeDesc = '通勤高峰时段，主干道额外扣分';
  }

  return adjustments;
}

function recommend(preference) {
  const pref = preference || {};
  const distanceKm = typeof pref.distanceKm === 'number' ? pref.distanceKm : 5;
  const sport = pref.sport || '慢跑';
  const timeSlot = pref.timeSlot || '白天';
  const priority = pref.priority || '安静优先';
  const templateId = pref.template || '';

  const all = mockRoutes.getAllRoutesPatched();

  // 获取分时动态调整
  const timeAdj = getTimeBasedAdjustments(timeSlot);

  // 获取模板配置（如果有）
  const templateConfig = TEMPLATE_CONFIG[templateId] || null;

  const scored = all.map(function (route) {
    // 1. 距离匹配分
    const diff = Math.abs(route.distanceKm - distanceKm);
    const distanceScore = Math.max(0, 40 - diff * 6);

    // 2. 类型/时段匹配分
    const sportHit = (route.sports || []).indexOf(sport) >= 0 ? 20 : 0;
    const timeHit = (route.timeSlots || []).indexOf(timeSlot) >= 0 ? 20 : 0;

    // 3. 四维评分 × 权重（优先使用模板权重，否则使用偏好权重）
    let weights = { safety: 0.25, quietness: 0.25, fitness: 0.25, scenery: 0.25 };

    // 模板权重优先
    if (templateConfig) {
      weights = Object.assign({}, templateConfig.weights);
    } else {
      // 否则使用偏好权重
      if (priority === '安全优先') {
        weights.safety = 0.55; weights.quietness = 0.15; weights.fitness = 0.15; weights.scenery = 0.15;
      }
      if (priority === '安静优先') {
        weights.safety = 0.15; weights.quietness = 0.55; weights.fitness = 0.15; weights.scenery = 0.15;
      }
      if (priority === '风景优先') {
        weights.safety = 0.15; weights.quietness = 0.15; weights.fitness = 0.15; weights.scenery = 0.55;
      }
      if (priority === '运动适配优先') {
        weights.safety = 0.15; weights.quietness = 0.15; weights.fitness = 0.55; weights.scenery = 0.15;
      }
    }

    // 应用分时权重调整
    weights.safety = weights.safety * timeAdj.weightMultiplier.safety;
    weights.quietness = weights.quietness * timeAdj.weightMultiplier.quietness;
    weights.fitness = weights.fitness * timeAdj.weightMultiplier.fitness;
    weights.scenery = weights.scenery * timeAdj.weightMultiplier.scenery;

    // 权重归一化（确保总和为1）
    const weightSum = weights.safety + weights.quietness + weights.fitness + weights.scenery;
    if (weightSum > 0) {
      weights.safety = weights.safety / weightSum;
      weights.quietness = weights.quietness / weightSum;
      weights.fitness = weights.fitness / weightSum;
      weights.scenery = weights.scenery / weightSum;
    }

    const scores = route.scores || { safety: 60, quietness: 60, fitness: 60, scenery: 60 };
    const dimScore =
      scores.safety * weights.safety +
      scores.quietness * weights.quietness +
      scores.fitness * weights.fitness +
      scores.scenery * weights.scenery;

    // 4. 情境扣分（基础 + 模板 + 分时）
    let penalty = 0;
    const risks = route.riskReports || [];
    const surfaceTypes = route.surfaceTypes || [];
    const tags = route.tags || [];

    // 基础扣分
    if (risks.indexOf('无路灯') >= 0 && timeSlot === '夜间') penalty += 25;
    if (risks.indexOf('下班高峰车流') >= 0) penalty += 12;
    if (risks.indexOf('道路狭窄') >= 0 && sport === '骑行') penalty += 10;
    if (risks.indexOf('噪音大') >= 0 && (priority === '安静优先' || (templateConfig && templateConfig.weights.quietness > 0.3))) penalty += 12;
    if (risks.indexOf('施工') >= 0) penalty += 6;
    if (risks.indexOf('积水') >= 0) penalty += 8;
    if (risks.indexOf('路面不平') >= 0 && sport === '骑行') penalty += 10;
    if (risks.indexOf('骑行不友好') >= 0 && sport === '骑行') penalty += 14;

    // 模板额外扣分
    if (templateConfig && templateConfig.penalties) {
      Object.keys(templateConfig.penalties).forEach(function (key) {
        if (risks.indexOf(key) >= 0 || surfaceTypes.indexOf(key) >= 0 || tags.indexOf(key) >= 0) {
          penalty += templateConfig.penalties[key];
        }
      });
    }

    // 分时额外扣分
    Object.keys(timeAdj.extraPenalties).forEach(function (key) {
      if (risks.indexOf(key) >= 0 || surfaceTypes.indexOf(key) >= 0) {
        penalty += timeAdj.extraPenalties[key];
      }
    });

    // 5. 模板加分（bonus）
    let bonusScore = 0;
    if (templateConfig && templateConfig.bonus) {
      Object.keys(templateConfig.bonus).forEach(function (key) {
        if (tags.indexOf(key) >= 0 || surfaceTypes.indexOf(key) >= 0) {
          bonusScore += templateConfig.bonus[key];
        }
      });
    }

    // 分时额外加分
    Object.keys(timeAdj.extraBonus).forEach(function (key) {
      if (tags.indexOf(key) >= 0) {
        bonusScore += timeAdj.extraBonus[key];
      }
    });

    // 6. 汇总
    const recommendScore = Math.max(
      0,
      Math.round(distanceScore + sportHit + timeHit + dimScore * 0.2 - penalty + bonusScore)
    );

    // 7. AI 自然语言解释
    const reasons = [];
    if (diff < 1.5) reasons.push('里程与你的目标非常匹配');
    else reasons.push('里程 ' + route.distanceKm + 'km 与目标 ' + distanceKm + 'km 稍有偏差');
    if (sportHit) reasons.push(sport + '适配良好');
    else reasons.push('不太适合' + sport);
    if (timeHit) reasons.push(timeSlot + '时段推荐');
    else reasons.push(timeSlot + '并非最推荐时段');

    // 模板相关解释
    if (templateConfig) {
      reasons.push('「' + templateConfig.name + '」模板已调整权重');
      if (bonusScore > 0) reasons.push('路线符合模板加分项，额外加分' + bonusScore);
    }

    // 分时动态解释
    if (timeAdj.timeDesc) {
      reasons.push(timeAdj.timeDesc);
    }

    // 原有偏好解释（如果没有模板）
    if (!templateConfig) {
      if (priority === '安静优先' && scores.quietness >= 80) reasons.push('安静度评分高，优先推荐');
      if (priority === '安全优先' && scores.safety >= 85) reasons.push('夜间有路灯、高安全评分');
      if (priority === '风景优先' && scores.scenery >= 85) reasons.push('风景指数非常高');
      if (priority === '运动适配优先' && scores.fitness >= 85) reasons.push('路面平直、运动节奏好');
    }

    if (penalty > 0) reasons.push('路况反馈扣分' + penalty);
    if (risks.indexOf('无路灯') >= 0 && timeSlot === '夜间') reasons.push('⚠ 夜间无路灯，建议谨慎选择');

    return Object.assign({}, route, {
      recommendScore: recommendScore,
      aiReason: reasons.join('；') + '。' + (route.reason || '')
    });
  });

  scored.sort(function (a, b) { return b.recommendScore - a.recommendScore; });
  return scored.slice(0, 5);
}

module.exports = {
  recommend: recommend,
  TEMPLATE_CONFIG: TEMPLATE_CONFIG
};
