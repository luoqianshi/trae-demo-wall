const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 推荐算法权重配置
 * 综合得分 = 静态偏好分 * 0.4 + 动态行为分 * 0.6
 */
const WEIGHTS = {
  // 总权重
  STATIC: 0.4,
  DYNAMIC: 0.6,

  // 静态基础偏好细分（占静态部分）
  HOMETOWN: 0.15,   // 家乡地区匹配
  CATEGORY: 0.15,   // 爱吃品类匹配
  TASTE: 0.10,      // 口味偏好匹配

  // 动态行为偏好细分（占动态部分）
  WANT: 0.20,       // 想吃清单记录
  FRIDGE: 0.20,     // 冰箱购入记录
  VOTE_FAV: 0.20,   // 投票/收藏记录

  // 优化加分项
  SEASON_BOOST: 0.10,   // 当季美食加权
  HOT_BOOST: 0.10,      // 热度加权

  // 去重惩罚
  DEDUP_PENALTY: -0.5   // 已加入想吃/冰箱的美食降权
}

/**
 * 口味关键词映射表（用于在美食未显式标注 tastes 时进行兜底匹配）
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

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const {
    page = 1,
    pageSize = 20,
    filter = null,
    scene = 'home',
    userPreferences = null
  } = event

  try {
    // 筛选联动：当用户主动使用筛选时，临时覆盖个性化推荐
    if (filter && Object.keys(filter).length > 0) {
      return await getFilteredResults(filter, page, pageSize)
    }

    return await getRecommendations(OPENID, page, pageSize, scene, userPreferences)
  } catch (err) {
    return {
      success: false,
      error: err.message,
      message: '推荐获取失败'
    }
  }
}

/**
 * 筛选覆盖逻辑：用户主动筛选时，按筛选条件查询并按热度排序
 */
async function getFilteredResults(filter, page, pageSize) {
  const where = buildFilterWhere(filter)
  const skip = (page - 1) * pageSize

  const countResult = await db.collection('foods').where(where).count()
  const total = countResult.total

  const listResult = await db.collection('foods')
    .where(where)
    .orderBy('hotScore', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()

  return {
    success: true,
    data: {
      list: listResult.data,
      total,
      page,
      pageSize,
      hasMore: skip + pageSize < total,
      isFiltered: true
    },
    message: '筛选成功'
  }
}

/**
 * 构建筛选条件 where 子句
 */
function buildFilterWhere(filter) {
  const where = { status: 'approved' }

  if (filter.category) {
    where.category = filter.category
  }

  if (filter.originProvince) {
    where.origin = db.RegExp({
      regexp: filter.originProvince,
      options: 'i'
    })
  }

  if (filter.months && Array.isArray(filter.months) && filter.months.length > 0) {
    where.seasonMonths = _.in(filter.months)
  } else if (filter.month !== undefined && filter.month !== null) {
    where.seasonMonths = _.in([filter.month])
  }

  if (filter.canMail !== undefined && filter.canMail !== null) {
    where.canMail = filter.canMail
  }

  if (filter.keyword) {
    where.name = db.RegExp({
      regexp: filter.keyword,
      options: 'i'
    })
  }

  return where
}

/**
 * 个性化推荐主流程
 */
async function getRecommendations(openid, page, pageSize, scene, clientPrefs) {
  // 1. 加载用户静态偏好
  const userPrefs = clientPrefs || await loadUserPreferences(openid)

  // 2. 加载用户动态行为数据
  const behaviorData = await loadUserBehavior(openid)

  // 3. 加载候选美食
  const candidates = await loadCandidateFoods(scene)

  // 4. 对每条候选美食计算综合得分
  const scored = candidates.map(food => {
    const staticScore = calculateStaticScore(food, userPrefs) * WEIGHTS.STATIC
    const dynamicScore = calculateDynamicScore(food, behaviorData) * WEIGHTS.DYNAMIC
    const seasonBoost = calculateSeasonBoost(food)
    const hotBoost = calculateHotBoost(food)
    const dedupPenalty = calculateDedupPenalty(food, behaviorData)

    const totalScore = staticScore + dynamicScore + seasonBoost + hotBoost + dedupPenalty

    return {
      ...food,
      _recommendScore: Number(totalScore.toFixed(4)),
      _staticScore: Number(staticScore.toFixed(4)),
      _dynamicScore: Number(dynamicScore.toFixed(4)),
      _seasonBoost: Number(seasonBoost.toFixed(4)),
      _hotBoost: Number(hotBoost.toFixed(4))
    }
  })

  // 5. 按综合得分降序排列
  scored.sort((a, b) => b._recommendScore - a._recommendScore)

  // 6. 多样性处理：避免同品类扎堆
  const diversified = applyDiversity(scored)

  // 7. 分页返回
  const skip = (page - 1) * pageSize
  const paged = diversified.slice(skip, skip + pageSize)
  const total = diversified.length

  return {
    success: true,
    data: {
      list: paged,
      total,
      page,
      pageSize,
      hasMore: skip + pageSize < total,
      isFiltered: false,
      scene
    },
    message: '推荐成功'
  }
}

/**
 * 加载用户静态偏好（userPreferences 集合）
 */
async function loadUserPreferences(openid) {
  if (!openid) {
    return getDefaultPreferences()
  }

  try {
    const result = await db.collection('userPreferences')
      .where({ userId: openid })
      .get()

    if (result.data.length === 0) {
      return getDefaultPreferences()
    }

    return result.data[0]
  } catch (err) {
    return getDefaultPreferences()
  }
}

function getDefaultPreferences() {
  return {
    hometown: '',
    provinceCode: '',
    cityCode: '',
    favoriteCategories: [],
    tastePreferences: [],
    tasteTags: []
  }
}

/**
 * 加载用户动态行为数据（wantList / fridge / voteRecords / favorites）
 */
async function loadUserBehavior(openid) {
  if (!openid) {
    return {
      wantList: [],
      fridge: [],
      votes: [],
      favorites: [],
      behaviorFoods: [],
      wantFoodIds: new Set(),
      fridgeFoodIds: new Set()
    }
  }

  const [wantResult, fridgeResult, voteResult, favResult] = await Promise.all([
    db.collection('wantList').where({ userId: openid, status: 'active' }).limit(100).get(),
    db.collection('fridge').where({ userId: openid, status: 'active' }).limit(100).get(),
    db.collection('voteRecords').where({ openid: openid }).limit(100).get(),
    db.collection('favorites').where({ openid: openid }).limit(100).get()
  ])

  // 提取投票/收藏涉及的美食ID，查询对应美食详情用于品类/产地分析
  const votedFoodIds = [...new Set(voteResult.data.map(v => v.foodId).filter(Boolean))]
  const favoritedFoodIds = [...new Set(favResult.data.map(f => f.foodId).filter(Boolean))]
  const behaviorFoodIds = [...new Set([...votedFoodIds, ...favoritedFoodIds])]

  let behaviorFoods = []
  if (behaviorFoodIds.length > 0) {
    // 分批查询（_.in 单次最多 20 条）
    const batches = []
    for (let i = 0; i < behaviorFoodIds.length; i += 20) {
      const batchIds = behaviorFoodIds.slice(i, i + 20)
      batches.push(
        db.collection('foods').where({ _id: _.in(batchIds) }).field({
          category: true,
          origin: true,
          subCategory: true
        }).get()
      )
    }
    const batchResults = await Promise.all(batches)
    behaviorFoods = batchResults.flatMap(r => r.data)
  }

  return {
    wantList: wantResult.data,
    fridge: fridgeResult.data,
    votes: voteResult.data,
    favorites: favResult.data,
    behaviorFoods: behaviorFoods,
    wantFoodIds: new Set(wantResult.data.map(w => w.foodId).filter(Boolean)),
    fridgeFoodIds: new Set(fridgeResult.data.map(f => f.foodId).filter(Boolean))
  }
}

/**
 * 加载候选美食
 * scene='fridge' 时仅加载当季美食
 */
async function loadCandidateFoods(scene) {
  const where = { status: 'approved' }

  if (scene === 'fridge') {
    const currentMonth = new Date().getMonth() + 1
    where.seasonMonths = _.in([currentMonth])
  }

  const result = await db.collection('foods')
    .where(where)
    .limit(100)
    .get()

  return result.data
}

/* ===================== 静态基础偏好计算（权重40%） ===================== */

function calculateStaticScore(food, prefs) {
  let score = 0

  // 家乡地区匹配（15%）：美食 origin 匹配用户家乡省份
  score += calculateHometownScore(food, prefs)

  // 爱吃品类匹配（15%）：美食 category 匹配用户选择的品类
  score += calculateCategoryScore(food, prefs)

  // 口味偏好匹配（10%）：美食 tastes 匹配用户口味偏好
  score += calculateTasteScore(food, prefs)

  return score
}

function calculateHometownScore(food, prefs) {
  if (!prefs.hometown || !food.origin) return 0
  const province = extractProvinceFromHometown(prefs.hometown)
  if (province && food.origin.includes(province)) {
    return WEIGHTS.HOMETOWN
  }
  return 0
}

function calculateCategoryScore(food, prefs) {
  if (!prefs.favoriteCategories || !food.category) return 0
  if (prefs.favoriteCategories.includes(food.category)) {
    return WEIGHTS.CATEGORY
  }
  return 0
}

function calculateTasteScore(food, prefs) {
  if (!prefs.tastePreferences || prefs.tastePreferences.length === 0) return 0

  // 优先使用美食显式标注的 tastes / tasteTags
  const foodTastes = food.tastes || food.tasteTags || []
  if (Array.isArray(foodTastes) && foodTastes.length > 0) {
    const matched = foodTastes.some(t => prefs.tastePreferences.includes(t))
    if (matched) return WEIGHTS.TASTE
  }

  // 兜底：通过口味关键词在美食名称/描述中匹配
  const text = (food.name || '') + (food.description || '')
  for (const tasteId of prefs.tastePreferences) {
    const keywords = TASTE_KEYWORDS[tasteId]
    if (keywords && keywords.some(kw => text.includes(kw))) {
      return WEIGHTS.TASTE
    }
  }

  return 0
}

/* ===================== 动态行为偏好计算（权重60%） ===================== */

function calculateDynamicScore(food, behavior) {
  let score = 0

  // 想吃清单记录（20%）：分析 wantList 提取 category 和 origin
  score += calculateWantScore(food, behavior)

  // 冰箱购入记录（20%）：分析 fridge 提取 category 和 origin
  score += calculateFridgeScore(food, behavior)

  // 投票/浏览/收藏记录（20%）：分析 votes 和 favorites
  score += calculateVoteFavScore(food, behavior)

  return score
}

function calculateWantScore(food, behavior) {
  const wantCategories = extractCategories(behavior.wantList)
  const wantOrigins = extractOrigins(behavior.wantList)

  let score = 0
  if (wantCategories.includes(food.category)) {
    score += WEIGHTS.WANT / 2
  }
  if (food.origin && matchOrigin(food.origin, wantOrigins)) {
    score += WEIGHTS.WANT / 2
  }
  return score
}

function calculateFridgeScore(food, behavior) {
  const fridgeCategories = extractCategories(behavior.fridge)
  const fridgeOrigins = extractOrigins(behavior.fridge)

  let score = 0
  if (fridgeCategories.includes(food.category)) {
    score += WEIGHTS.FRIDGE / 2
  }
  if (food.origin && matchOrigin(food.origin, fridgeOrigins)) {
    score += WEIGHTS.FRIDGE / 2
  }
  return score
}

function calculateVoteFavScore(food, behavior) {
  const behaviorCategories = extractCategories(behavior.behaviorFoods)
  const behaviorOrigins = extractOrigins(behavior.behaviorFoods)

  let score = 0
  if (behaviorCategories.includes(food.category)) {
    score += WEIGHTS.VOTE_FAV / 2
  }
  if (food.origin && matchOrigin(food.origin, behaviorOrigins)) {
    score += WEIGHTS.VOTE_FAV / 2
  }
  return score
}

/* ===================== 推荐算法优化 ===================== */

/**
 * 当季美食加权：当前月份在 seasonMonths 中的美食额外加分
 */
function calculateSeasonBoost(food) {
  if (!food.seasonMonths || food.seasonMonths.length === 0) return 0
  const currentMonth = new Date().getMonth() + 1
  if (food.seasonMonths.includes(currentMonth)) {
    return WEIGHTS.SEASON_BOOST
  }
  return 0
}

/**
 * 热度加权：hotScore 高的美食适当加分
 */
function calculateHotBoost(food) {
  if (!food.hotScore) return 0
  const normalizedHot = Math.min(food.hotScore / 10000, 1)
  return normalizedHot * WEIGHTS.HOT_BOOST
}

/**
 * 去重逻辑：已加入想吃清单或冰箱的美食降低推荐权重
 */
function calculateDedupPenalty(food, behavior) {
  if (behavior.wantFoodIds.has(food._id) || behavior.fridgeFoodIds.has(food._id)) {
    return WEIGHTS.DEDUP_PENALTY
  }
  return 0
}

/**
 * 多样性处理：保证推荐结果品类多样性，避免同品类扎堆
 * 策略：同一品类在结果前列占比不超过阈值，超出部分延后排列
 */
function applyDiversity(scored) {
  if (scored.length === 0) return scored

  const result = []
  const deferred = []
  const categoryCount = {}
  const maxPerCategory = Math.max(3, Math.ceil(scored.length * 0.25))

  for (const item of scored) {
    const cat = item.category || 'other'
    if (!categoryCount[cat]) categoryCount[cat] = 0

    if (categoryCount[cat] < maxPerCategory) {
      result.push(item)
      categoryCount[cat]++
    } else {
      deferred.push(item)
    }
  }

  // 将被延后的美食按得分追加到末尾
  deferred.sort((a, b) => b._recommendScore - a._recommendScore)
  return result.concat(deferred)
}

/* ===================== 工具函数 ===================== */

/**
 * 从家乡字符串中提取省份名称
 * 输入格式如 "辽宁省 沈阳市" 或 "北京市"
 */
function extractProvinceFromHometown(hometown) {
  if (!hometown) return ''
  const parts = hometown.split(/[\s,，]+/)
  return parts[0] || ''
}

/**
 * 从产地字符串中提取省份
 * 输入格式如 "辽宁省丹东市" 或 "广东省广州市从化区"
 */
function extractProvinceFromOrigin(origin) {
  if (!origin) return ''
  const match = origin.match(/^(.+?[省市区])/)
  return match ? match[1] : origin.substring(0, 2)
}

/**
 * 从行为记录列表中提取品类集合
 */
function extractCategories(items) {
  if (!items || items.length === 0) return []
  const cats = items
    .map(item => item.category)
    .filter(Boolean)
  return [...new Set(cats)]
}

/**
 * 从行为记录列表中提取产地产省集合
 */
function extractOrigins(items) {
  if (!items || items.length === 0) return []
  const origins = items
    .map(item => extractProvinceFromOrigin(item.origin))
    .filter(Boolean)
  return [...new Set(origins)]
}

/**
 * 判断美食产地是否匹配行为产地产省集合
 */
function matchOrigin(foodOrigin, originList) {
  if (!foodOrigin || originList.length === 0) return false
  const foodProvince = extractProvinceFromOrigin(foodOrigin)
  return originList.some(o => foodOrigin.includes(o) || (foodProvince && o.includes(foodProvince)))
}
