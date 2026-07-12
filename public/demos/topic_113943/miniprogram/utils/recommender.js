// utils/recommender.js
// 礼物推荐算法

const { giftDatabase, keywordMatchMap } = require('./gift-data.js');

// 品类视觉配置：emoji 图标 + 渐变色（替代实物图片，零网络依赖）
const categoryConfig = {
  electronics: { icon: '🎧', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  watch:       { icon: '⌚', gradient: 'linear-gradient(135deg, #2c3e50, #4ca1af)' },
  jewelry:     { icon: '💎', gradient: 'linear-gradient(135deg, #ee9ca7, #ffdde1)' },
  cosmetics:   { icon: '💄', gradient: 'linear-gradient(135deg, #f857a6, #ff5858)' },
  beauty:      { icon: '🧴', gradient: 'linear-gradient(135deg, #fceabb, #f8b500)' },
  stationery:  { icon: '✒️', gradient: 'linear-gradient(135deg, #8e9eab, #eef2f3)' },
  home:        { icon: '🏡', gradient: 'linear-gradient(135deg, #a8e063, #56ab2f)' },
  photography: { icon: '📷', gradient: 'linear-gradient(135deg, #485563, #29323c)' },
  diy:         { icon: '🧩', gradient: 'linear-gradient(135deg, #f7971e, #ffd200)' },
  perfume:     { icon: '🌸', gradient: 'linear-gradient(135deg, #ff9a9e, #fad0c4)' },
  flowers:     { icon: '💐', gradient: 'linear-gradient(135deg, #ff6a88, #ff99ac)' },
  book:        { icon: '📚', gradient: 'linear-gradient(135deg, #c79081, #dfa579)' },
  experience:  { icon: '🎫', gradient: 'linear-gradient(135deg, #f6d365, #fda085)' },
  gaming:      { icon: '🎮', gradient: 'linear-gradient(135deg, #5f2c82, #49a09d)' },
  clothes:     { icon: '👕', gradient: 'linear-gradient(135deg, #43cea2, #185a9d)' },
  food:        { icon: '🍫', gradient: 'linear-gradient(135deg, #f6d365, #fda085)' },
  pets:        { icon: '🐾', gradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
  sports:      { icon: '🏃', gradient: 'linear-gradient(135deg, #ff8008, #ffc837)' },
  travel:      { icon: '✈️', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  handmade:    { icon: '🧶', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  arts:        { icon: '🎨', gradient: 'linear-gradient(135deg, #fa709a, #fee140)' },
  'tea-coffee':{ icon: '☕', gradient: 'linear-gradient(135deg, #c79081, #dfa579)' }
};

function getCategoryConfig(category) {
  return categoryConfig[category] || { icon: '🎁', gradient: 'linear-gradient(135deg, #e8788a, #88c4d8)' };
}

/**
 * 从心愿文本中提取关键词
 */
function extractWishKeywords(wishText) {
  if (!wishText) return [];

  const keywords = [];
  for (const keyword in keywordMatchMap) {
    if (wishText.indexOf(keyword) > -1) {
      const tags = keywordMatchMap[keyword];
      for (let i = 0; i < tags.length; i++) {
        if (keywords.indexOf(tags[i]) === -1) {
          keywords.push(tags[i]);
        }
      }
    }
  }

  return keywords;
}

/**
 * 计算单个礼物的综合评分
 */
function calculateGiftScore(gift, formData, wishKeywords) {
  let practical = gift.scores.practical;
  let emotional = gift.scores.emotional;
  let unique = gift.scores.unique;
  let budgetMatch = gift.scores.budgetMatch;

  // 性别匹配加分
  if (gift.genderSuitability.indexOf(formData.gender) > -1) {
    practical += 5;
    emotional += 3;
  } else {
    practical -= 20;
    emotional -= 15;
  }

  // 年龄匹配加分
  if (gift.ageSuitability.indexOf(formData.age) > -1) {
    practical += 5;
  }

  // 职业匹配加分
  if (gift.careerSuitability.indexOf(formData.career) > -1) {
    practical += 8;
  }

  // 兴趣爱好匹配
  let hobbyMatches = 0;
  for (let i = 0; i < gift.tags.length; i++) {
    if (formData.hobbies.indexOf(gift.tags[i]) > -1) {
      hobbyMatches++;
    }
  }
  if (hobbyMatches > 0) {
    practical += hobbyMatches * 8;
    emotional += hobbyMatches * 5;
    unique += hobbyMatches * 3;
  }

  // 生活方式匹配
  if (gift.tags.indexOf(formData.lifestyle) > -1) {
    practical += 6;
    emotional += 4;
  }

  // 心愿关键词匹配（大幅加分）
  let wishMatch = false;
  for (let i = 0; i < gift.tags.length; i++) {
    if (wishKeywords.indexOf(gift.tags[i]) > -1) {
      wishMatch = true;
      break;
    }
  }
  if (wishMatch) {
    practical += 15;
    emotional += 20;
    unique += 10;
  }

  // 预算匹配度计算（基于区间）
  // 礼物价格在用户选择的区间内，匹配度最高；偏离区间则按距离区间中点的比例衰减
  const budgetMin = formData.budgetMin;
  const budgetMax = formData.budgetMax;
  const budgetCenter = (budgetMin + budgetMax) / 2;
  if (gift.basePrice >= budgetMin && gift.basePrice <= budgetMax) {
    // 在区间内：90~100 分（区间正中央得满分，越靠近边界略降）
    const distFromCenter = Math.abs(gift.basePrice - budgetCenter) / Math.max(1, (budgetMax - budgetMin) / 2);
    budgetMatch = 100 - distFromCenter * 10;
  } else {
    // 在区间外：按距离区间中点的比例衰减
    const budgetDiff = Math.abs(gift.basePrice - budgetCenter) / Math.max(1, budgetCenter);
    budgetMatch = Math.max(0, 90 - budgetDiff * 80);
  }

  // 场合匹配
  if (formData.occasion === 'valentine' || formData.occasion === 'anniversary') {
    emotional += 10;
    unique += 5;
  } else if (formData.occasion === 'birthday') {
    emotional += 5;
  }

  // 确保分数在合理范围
  practical = Math.min(100, Math.max(0, practical));
  emotional = Math.min(100, Math.max(0, emotional));
  unique = Math.min(100, Math.max(0, unique));
  budgetMatch = Math.min(100, Math.max(0, budgetMatch));

  // 加权计算总分
  const total = practical * 0.4 + emotional * 0.3 + unique * 0.2 + budgetMatch * 0.1;

  return {
    practical: Math.round(practical),
    emotional: Math.round(emotional),
    unique: Math.round(unique),
    budgetMatch: Math.round(budgetMatch),
    total: Math.round(total)
  };
}

/**
 * 生成推荐
 */
function computeRecommendations(formData) {
  // 基于用户选择的预算区间 [budgetMin, budgetMax] 划分三档
  const budgetMin = formData.budgetMin;
  const budgetMax = formData.budgetMax;
  const span = budgetMax - budgetMin;

  // 三档划分：
  // - 心意之选：区间下三分之一（偏低价位）
  // - 实用精选：区间中三分之一（中等价位）
  // - 惊喜优选：区间上三分之一 + 上浮 20%（偏高价位的惊喜）
  const tiers = {
    surprise: { min: budgetMin + span * 0.66, max: budgetMax * 1.2, label: '惊喜优选' },
    practical: { min: budgetMin + span * 0.33, max: budgetMin + span * 0.66, label: '实用精选' },
    heartfelt: { min: budgetMin * 0.8, max: budgetMin + span * 0.33, label: '心意之选' }
  };

  // 从心愿文本提取关键词
  const wishKeywords = extractWishKeywords(formData.wish);

  // 为每个礼物计算匹配分
  const scoredGifts = giftDatabase.map(gift => {
    const scores = calculateGiftScore(gift, formData, wishKeywords);
    let finalScore = scores.total;

    // 广告优先级加权：置顶 +15 / 优先 +8 / 普通 +3
    // 让商家投放的广告商品在排序中获得靠前位置（但不强制置顶，避免破坏相关性）
    if (gift.adInfo && gift.adInfo.isAd) {
      const adBoost = gift.adInfo.adLevel === 'top' ? 15
        : gift.adInfo.adLevel === 'priority' ? 8
        : 3;
      finalScore += adBoost;
    }

    var catConfig = getCategoryConfig(gift.category);
    return Object.assign({}, gift, {
      finalScore: finalScore,
      scoreDetails: scores,
      categoryIcon: catConfig.icon,
      categoryGradient: catConfig.gradient
    });
  });

  // 过滤掉已送过的类型
  const filteredGifts = scoredGifts.filter(gift => {
    return formData.history.indexOf(gift.category) === -1;
  });

  // ============ 应用用户反馈 ============
  // feedback 结构: { likedGiftIds: [], dislikedGiftIds: [], dislikedCategories: [] }
  const feedback = formData.feedback || {};
  const dislikedGiftIds = feedback.dislikedGiftIds || [];
  const dislikedCategories = feedback.dislikedCategories || [];
  const likedGiftIds = feedback.likedGiftIds || [];

  // 统计喜欢的礼物所属的 category
  const likedCategories = {};
  likedGiftIds.forEach(id => {
    const likedGift = giftDatabase.find(g => g.id === id);
    if (likedGift) {
      likedCategories[likedGift.category] = (likedCategories[likedGift.category] || 0) + 1;
    }
  });

  filteredGifts.forEach(gift => {
    if (dislikedCategories.indexOf(gift.category) > -1) {
      gift.finalScore *= 0.5;
    }
    if (likedCategories[gift.category]) {
      const boost = Math.min(0.2, likedCategories[gift.category] * 0.05);
      gift.finalScore *= (1 + boost);
    }
  });

  // 排除点过"不感兴趣"的具体礼物
  const filteredByFeedback = filteredGifts.filter(gift => {
    return dislikedGiftIds.indexOf(gift.id) === -1;
  });

  // ============ 多级兜底：候选池不足时逐级放宽过滤条件 ============
  // fallbackLevel: 0=正常 | 1=恢复不感兴趣礼物 | 2=恢复已送过类型 | 3=全量兜底
  // 阈值 8：保证三档筛选后每档至少有 2~3 个候选
  const MIN_POOL = 8;
  let effectivePool = filteredByFeedback.slice();
  let fallbackLevel = 0;
  let emptyReason = '';

  if (effectivePool.length < MIN_POOL) {
    // 级别 1：恢复被"不感兴趣"排除的具体礼物（penalty -30 让它们排最后）
    fallbackLevel = 1;
    const restored = filteredGifts.filter(gift => dislikedGiftIds.indexOf(gift.id) > -1);
    restored.forEach(gift => { gift.finalScore -= 30; });
    effectivePool = effectivePool.concat(restored);
  }

  if (effectivePool.length < MIN_POOL) {
    // 级别 2：恢复被"已送过类型"排除的礼物（penalty -50，更靠后）
    fallbackLevel = 2;
    const restoredHistory = scoredGifts.filter(gift => formData.history.indexOf(gift.category) > -1);
    restoredHistory.forEach(gift => {
      gift.finalScore -= 50;
      gift.isRepeated = true;  // 标记为已送过类型，UI 可提示
    });
    effectivePool = effectivePool.concat(restoredHistory);
  }

  if (effectivePool.length < MIN_POOL) {
    // 级别 3：全量兜底（极端情况：数据库本身就少）
    fallbackLevel = 3;
    effectivePool = scoredGifts.slice();
  }

  // 根据兜底级别生成用户可读的空状态原因（仅在最终某档为空时使用）
  if (fallbackLevel === 1) {
    emptyReason = '你点过太多"不感兴趣"，已自动恢复部分礼物，可清除反馈重试';
  } else if (fallbackLevel === 2) {
    emptyReason = '可选范围较窄，已包含部分已送过的类型，建议调整预算或送过类型';
  } else if (fallbackLevel === 3) {
    emptyReason = '当前条件下匹配较少，已展示全部可用礼物';
  }

  const recommendations = {
    surprise: [],
    practical: [],
    heartfelt: []
  };

  // 三档按优先级顺序筛选，每档选中后从候选池移除（基于礼物 id 互斥）
  // 优先级：surprise（惊喜优选）> practical（实用精选）> heartfelt（心意之选）
  // 这样高价档先挑，避免高价礼物被低价档"截胡"
  const TIERS = ['surprise', 'practical', 'heartfelt'];
  let pool = effectivePool.slice();
  const chosenIds = {};

  // 全局排序后的备选清单（用于某档为空时跨档补充）
  const globalSorted = effectivePool.slice().sort((a, b) => b.finalScore - a.finalScore);

  TIERS.forEach(tier => {
    const tierBudget = tiers[tier];

    // 在剩余候选池中按价格区间筛选
    let tierGifts = pool.filter(gift => {
      if (chosenIds[gift.id]) return false;
      return gift.basePrice >= tierBudget.min && gift.basePrice <= tierBudget.max;
    });

    // 如果该档次礼物不够，放宽价格范围
    if (tierGifts.length < 3) {
      tierGifts = pool.filter(gift => {
        if (chosenIds[gift.id]) return false;
        return gift.basePrice >= tierBudget.min * 0.7 && gift.basePrice <= tierBudget.max * 1.3;
      });
    }

    // 价格区间完全无货时，从全局 top 补充（最终兜底，确保每档非空）
    if (tierGifts.length === 0) {
      tierGifts = globalSorted.filter(gift => !chosenIds[gift.id]);
    }

    // 按最终得分排序
    tierGifts.sort((a, b) => b.finalScore - a.finalScore);

    // 取前4个，并标记为已选（互斥）
    const picked = tierGifts.slice(0, 4);
    picked.forEach(gift => { chosenIds[gift.id] = true; });
    recommendations[tier] = picked;

    // 从候选池中移除已选礼物，供下一档使用
    pool = pool.filter(gift => !chosenIds[gift.id]);
  });

  // 计算总推荐数，用于前端判断是否完全空
  const totalCount = recommendations.surprise.length + recommendations.practical.length + recommendations.heartfelt.length;

  return Object.assign(recommendations, {
    _meta: {
      fallbackLevel,
      emptyReason,
      isEmpty: totalCount === 0,
      totalCount
    }
  });
}

/**
 * 生成礼物升级建议
 */
function generateUpgradeTips(topGift) {
  const tips = [];

  if (topGift) {
    const category = topGift.category;

    if (category === 'electronics') {
      tips.push('本次选择了数码产品，下次可以考虑配套的配件或升级款');
      tips.push('也可以从"实用"转向"体验"，比如一起去旅行或看演出');
    } else if (category === 'jewelry' || category === 'watch') {
      tips.push('本次选择了配饰类，下次可以考虑同款系列的其他单品');
      tips.push('纪念日可以选择更有纪念意义的定制款或限量款');
    } else if (category === 'diy' || category === 'handmade') {
      tips.push('本次是手工/定制类，下次可以升级为更花时间的DIY项目');
      tips.push('也可以考虑"体验式礼物"，一起做手工、上课程');
    } else if (category === 'beauty' || category === 'cosmetics') {
      tips.push('本次选择了美妆护肤，下次可以尝试同品牌高端线产品');
      tips.push('也可以搭配护肤仪、美容仪等工具类礼物');
    } else if (category === 'experience') {
      tips.push('本次是体验式礼物，下次可以升级为更特别的体验（如旅行）');
      tips.push('也可以选择实物礼物+体验的组合，双重惊喜');
    } else {
      tips.push('根据TA这次的反馈，调整下次礼物的方向');
      tips.push('可以尝试不同类型的礼物，保持新鲜感');
    }
  }

  tips.push('建议建立一个"礼物灵感清单"，平时想到就记下来');
  tips.push('下一个节日提前2-3周开始准备，更从容也更有心意');

  return tips;
}

module.exports = {
  computeRecommendations,
  generateUpgradeTips,
  extractWishKeywords
};
