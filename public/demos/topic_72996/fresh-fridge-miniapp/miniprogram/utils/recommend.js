const Cloud = require('./cloud.js')

/**
 * 推荐算法权重（与云函数保持一致，用于本地快速预览计算）
 */
const WEIGHTS = {
  STATIC: 0.4,
  DYNAMIC: 0.6,
  HOMETOWN: 0.15,
  CATEGORY: 0.15,
  TASTE: 0.10,
  WANT: 0.20,
  FRIDGE: 0.20,
  VOTE_FAV: 0.20,
  SEASON_BOOST: 0.10,
  HOT_BOOST: 0.10,
  DEDUP_PENALTY: -0.5
}

/**
 * 口味关键词映射表（用于本地兜底匹配）
 */
const TASTE_KEYWORDS = {
  sweet: ['甜', '糖', '蜜', '草莓', '蛋糕', '巧克力', '蜂蜜', '冰淇淋'],
  sour: ['酸', '柠檬', '醋', '杨梅', '山楂', '葡萄', '酸奶', '李子'],
  salty: ['咸', '盐', '腊肉', '咸鱼', '海带', '紫菜', '咸鸭蛋'],
  spicy: ['辣', '辣椒', '花椒', '火锅', '辣酱', '生姜', '大蒜'],
  bitter: ['苦', '咖啡', '茶叶', '苦瓜', '莲子心'],
  umami: ['鲜', '海鲜', '菌菇', '鸡汤', '鱼汤', '蚝油', '鸡精'],
  sweet_sour: ['酸甜', '糖醋', '番茄', '菠萝', '山楂', '橙汁'],
  spicy_sour: ['酸辣', '酸菜', '泡椒', '酸豆角'],
  salty_fresh: ['咸鲜', '红烧', '清蒸', '酱油'],
  light: ['清淡', '清蒸', '白灼', '粥', '清汤'],
  rich: ['浓郁', '红烧', '咖喱', '奶油', '芝士', '黄油'],
  fragrant: ['清香', '薄荷', '柠檬草', '茉莉', '绿茶', '桂花']
}

const RecommendUtils = {
  /**
   * 调用推荐云函数获取个性化推荐
   * @param {Object} params - { page, pageSize, filter, scene, userPreferences }
   * @returns {Promise} 云函数返回结果
   */
  getRecommendations: function (params = {}) {
    return Cloud.callFunction('recommendation', {
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      filter: params.filter || null,
      scene: params.scene || 'home',
      userPreferences: params.userPreferences || null
    })
  },

  /**
   * 本地计算简单得分（用于快速预览，无需调用云函数）
   * 综合得分 = 静态偏好分 * 0.4 + 动态行为分 * 0.6 + 季节/热度加分
   * @param {Object} food - 美食对象
   * @param {Object} userPrefs - 用户偏好 { hometown, favoriteCategories, tastePreferences }
   * @param {Object} behavior - 用户行为 { wantList, fridge, favorites, votes }
   * @returns {Number} 综合得分
   */
  calculateScore: function (food, userPrefs, behavior) {
    if (!food) return 0

    const prefs = userPrefs || {}
    const beh = behavior || {}

    // 静态基础偏好分（×0.4）
    const staticScore = calculateLocalStaticScore(food, prefs) * WEIGHTS.STATIC

    // 动态行为偏好分（×0.6）
    const dynamicScore = calculateLocalDynamicScore(food, beh) * WEIGHTS.DYNAMIC

    // 优化加分
    const seasonBoost = calculateLocalSeasonBoost(food)
    const hotBoost = calculateLocalHotBoost(food)
    const dedupPenalty = calculateLocalDedupPenalty(food, beh)

    return Number((staticScore + dynamicScore + seasonBoost + hotBoost + dedupPenalty).toFixed(4))
  },

  /**
   * 处理筛选覆盖逻辑
   * 当用户主动使用筛选时，构建筛选参数覆盖个性化推荐
   * @param {Object} filter - 前端筛选状态 { region, category, time, tag, keyword }
   * @param {Object} userPrefs - 用户偏好（用于解析家乡省份等）
   * @returns {Object|null} 筛选参数对象，无有效筛选时返回 null
   */
  filterOverrides: function (filter, userPrefs) {
    if (!filter || Object.keys(filter).length === 0) {
      return null
    }

    const override = {}
    const prefs = userPrefs || {}

    // 品类筛选
    if (filter.category && filter.category !== 'all' && filter.category !== 'seasonal') {
      override.category = filter.category
    }

    // 地区筛选
    if (filter.region === 'hometown') {
      const province = extractProvince(prefs.hometown)
      if (province) override.originProvince = province
    } else if (filter.region === 'custom' && prefs.customProvince) {
      override.originProvince = prefs.customProvince
    }

    // 时间筛选
    if (filter.time === 'month') {
      override.month = new Date().getMonth() + 1
    } else if (filter.time === 'season') {
      override.months = getSeasonMonths()
    } else if (filter.time === 'week') {
      override.month = new Date().getMonth() + 1
    }

    // 特征标签筛选
    if (filter.tag === 'mailable') {
      override.canMail = true
      override.category = 'snack'
    } else if (filter.tag === 'seasonal') {
      override.month = new Date().getMonth() + 1
    } else if (filter.tag === 'fresh') {
      override.canMail = true
      override.category = 'vegetable'
    } else if (filter.tag === 'hometown') {
      const province = extractProvince(prefs.hometown)
      if (province) override.originProvince = province
    }

    // 关键词搜索
    if (filter.keyword) {
      override.keyword = filter.keyword
    }

    // 无有效筛选条件时返回 null（走个性化推荐）
    if (Object.keys(override).length === 0) {
      return null
    }

    return override
  },

  /**
   * 批量本地计算得分并排序（用于快速预览）
   * @param {Array} foods - 美食列表
   * @param {Object} userPrefs - 用户偏好
   * @param {Object} behavior - 用户行为
   * @param {Number} limit - 返回数量
   * @returns {Array} 按得分降序排列的美食列表
   */
  rankByScore: function (foods, userPrefs, behavior, limit = 20) {
    if (!foods || foods.length === 0) return []

    const scored = foods.map(food => ({
      ...food,
      _recommendScore: this.calculateScore(food, userPrefs, behavior)
    }))

    scored.sort((a, b) => b._recommendScore - a._recommendScore)

    return scored.slice(0, limit)
  },

  WEIGHTS: WEIGHTS
}

/* ===================== 本地计算辅助函数 ===================== */

function calculateLocalStaticScore(food, prefs) {
  let score = 0

  // 家乡地区匹配（15%）
  if (prefs.hometown && food.origin) {
    const province = extractProvince(prefs.hometown)
    if (province && food.origin.includes(province)) {
      score += WEIGHTS.HOMETOWN
    }
  }

  // 爱吃品类匹配（15%）
  if (prefs.favoriteCategories && prefs.favoriteCategories.includes(food.category)) {
    score += WEIGHTS.CATEGORY
  }

  // 口味偏好匹配（10%）
  if (prefs.tastePreferences && prefs.tastePreferences.length > 0) {
    const foodTastes = food.tastes || food.tasteTags || []
    if (Array.isArray(foodTastes) && foodTastes.length > 0) {
      if (foodTastes.some(t => prefs.tastePreferences.includes(t))) {
        score += WEIGHTS.TASTE
      }
    } else {
      const text = (food.name || '') + (food.description || '')
      for (const tasteId of prefs.tastePreferences) {
        const keywords = TASTE_KEYWORDS[tasteId]
        if (keywords && keywords.some(kw => text.includes(kw))) {
          score += WEIGHTS.TASTE
          break
        }
      }
    }
  }

  return score
}

function calculateLocalDynamicScore(food, behavior) {
  let score = 0

  // 想吃清单记录（20%）
  const wantCategories = extractLocalCategories(behavior.wantList)
  const wantOrigins = extractLocalOrigins(behavior.wantList)
  if (wantCategories.includes(food.category)) {
    score += WEIGHTS.WANT / 2
  }
  if (food.origin && matchLocalOrigin(food.origin, wantOrigins)) {
    score += WEIGHTS.WANT / 2
  }

  // 冰箱购入记录（20%）
  const fridgeCategories = extractLocalCategories(behavior.fridge)
  const fridgeOrigins = extractLocalOrigins(behavior.fridge)
  if (fridgeCategories.includes(food.category)) {
    score += WEIGHTS.FRIDGE / 2
  }
  if (food.origin && matchLocalOrigin(food.origin, fridgeOrigins)) {
    score += WEIGHTS.FRIDGE / 2
  }

  // 投票/收藏记录（20%）
  const behaviorFoods = behavior.behaviorFoods || []
  const behaviorCategories = extractLocalCategories(behaviorFoods)
  const behaviorOrigins = extractLocalOrigins(behaviorFoods)
  if (behaviorCategories.includes(food.category)) {
    score += WEIGHTS.VOTE_FAV / 2
  }
  if (food.origin && matchLocalOrigin(food.origin, behaviorOrigins)) {
    score += WEIGHTS.VOTE_FAV / 2
  }

  return score
}

function calculateLocalSeasonBoost(food) {
  if (!food.seasonMonths || food.seasonMonths.length === 0) return 0
  const currentMonth = new Date().getMonth() + 1
  if (food.seasonMonths.includes(currentMonth)) {
    return WEIGHTS.SEASON_BOOST
  }
  return 0
}

function calculateLocalHotBoost(food) {
  if (!food.hotScore) return 0
  const normalizedHot = Math.min(food.hotScore / 10000, 1)
  return normalizedHot * WEIGHTS.HOT_BOOST
}

function calculateLocalDedupPenalty(food, behavior) {
  const wantFoodIds = new Set((behavior.wantList || []).map(w => w.foodId).filter(Boolean))
  const fridgeFoodIds = new Set((behavior.fridge || []).map(f => f.foodId).filter(Boolean))
  if (wantFoodIds.has(food._id) || fridgeFoodIds.has(food._id)) {
    return WEIGHTS.DEDUP_PENALTY
  }
  return 0
}

function extractProvince(hometown) {
  if (!hometown) return ''
  const parts = hometown.split(/[\s,，]+/)
  return parts[0] || ''
}

function extractProvinceFromOrigin(origin) {
  if (!origin) return ''
  const match = origin.match(/^(.+?[省市区])/)
  return match ? match[1] : origin.substring(0, 2)
}

function extractLocalCategories(items) {
  if (!items || items.length === 0) return []
  const cats = items.map(item => item.category).filter(Boolean)
  return [...new Set(cats)]
}

function extractLocalOrigins(items) {
  if (!items || items.length === 0) return []
  const origins = items.map(item => extractProvinceFromOrigin(item.origin)).filter(Boolean)
  return [...new Set(origins)]
}

function matchLocalOrigin(foodOrigin, originList) {
  if (!foodOrigin || originList.length === 0) return false
  const foodProvince = extractProvinceFromOrigin(foodOrigin)
  return originList.some(o => foodOrigin.includes(o) || (foodProvince && o.includes(foodProvince)))
}

function getSeasonMonths() {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return [3, 4, 5]
  if (month >= 6 && month <= 8) return [6, 7, 8]
  if (month >= 9 && month <= 11) return [9, 10, 11]
  return [12, 1, 2]
}

module.exports = RecommendUtils
