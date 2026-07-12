/**
 * AI私人咖啡甜度师 - 推荐引擎
 * 基于多因子加权模型，综合咖啡豆、心情、食物搭配、时段、健康目标
 * 输出精确加糖量（克），并支持用户反馈学习
 */
(function (global) {
  'use strict';

  // ============ 知识库：咖啡豆参数 ============
  // 烘焙度对苦味的影响（越深越苦，需要更多糖来平衡）
  var ROAST_FACTOR = {
    light:       { label: '浅焙',  bitterness: 0.3,  acidity: 0.8, adjust: -0.5 },
    medium:      { label: '中焙',  bitterness: 0.5,  acidity: 0.5, adjust: 0.0 },
    medium_dark: { label: '中深焙', bitterness: 0.7,  acidity: 0.3, adjust: 0.6 },
    dark:        { label: '深焙',  bitterness: 0.9,  acidity: 0.1, adjust: 1.2 }
  };

  // 产区风味倾向
  var ORIGIN_FACTOR = {
    africa:         { label: '非洲（埃塞/肯尼亚）',   flavor: '果酸明亮', adjust: -0.3 },
    latin_america:  { label: '中南美（哥伦比亚/巴西）', flavor: '坚果焦糖', adjust: 0.0 },
    asia:           { label: '亚洲（印尼/越南）',     flavor: '醇厚泥土', adjust: 0.3 },
    blend:          { label: '综合拼配',             flavor: '均衡',     adjust: 0.0 }
  };

  // 咖啡类型对甜度感知的影响系数
  var DRINK_FACTOR = {
    espresso:    { label: '意式浓缩', multiplier: 0.6, baseVol: 30 },
    americano:   { label: '美式',     multiplier: 1.2, baseVol: 240 },
    latte:       { label: '拿铁',     multiplier: 0.7, baseVol: 350 },
    cappuccino:  { label: '卡布奇诺', multiplier: 0.8, baseVol: 240 },
    cold_brew:   { label: '冷萃',     multiplier: 0.9, baseVol: 350 },
    pour_over:   { label: '手冲',     multiplier: 1.1, baseVol: 220 },
    mocha:       { label: '摩卡',     multiplier: 0.5, baseVol: 350 },
    flat_white:  { label: '馥芮白',   multiplier: 0.75, baseVol: 200 }
  };

  // 心情对糖分渴望的影响
  var MOOD_FACTOR = {
    tired:     { label: '疲惫',  adjust: 1.0, icon: '😮‍💨' },
    stressed:  { label: '压力大', adjust: 0.8, icon: '😣' },
    happy:     { label: '开心',  adjust: 0.3, icon: '😊' },
    relaxed:   { label: '放松',  adjust: -0.2, icon: '😌' },
    focused:   { label: '专注',  adjust: 0.1, icon: '🤓' },
    sad:       { label: '低落',  adjust: 0.6, icon: '😔' }
  };

  // 食物搭配影响
  var FOOD_FACTOR = {
    none:        { label: '无搭配',      adjust: 0.0 },
    dessert:     { label: '甜点蛋糕',    adjust: -1.0 },
    chocolate:   { label: '黑巧克力',    adjust: 0.5 },
    sandwich:    { label: '三明治/面包', adjust: 0.3 },
    savory:      { label: '咸食',        adjust: 0.4 },
    fruit:       { label: '水果',        adjust: -0.3 },
    spicy:       { label: '辛辣食物',    adjust: 0.6 }
  };

  // 时段影响
  function getTimeAdjust(hour) {
    if (hour >= 6 && hour < 11)  return 0.2;   // 早晨：需要能量
    if (hour >= 11 && hour < 17) return 0.0;   // 下午：正常
    if (hour >= 17 && hour < 22) return -0.4;  // 晚上：减少糖分
    return -0.8;                                // 深夜：最少糖
  }

  // 健康目标系数
  var HEALTH_FACTOR = {
    none:     { label: '不限制',   multiplier: 1.0 },
    moderate: { label: '适度控糖', multiplier: 0.7 },
    strict:   { label: '严格控糖', multiplier: 0.45 }
  };

  // 甜度等级映射
  function sweetnessLevel(score) {
    if (score < 1.5) return { label: '无糖',   color: '#6b7280', desc: '纯粹原味，感受咖啡本真' };
    if (score < 3.5) return { label: '微糖',   color: '#10b981', desc: '若隐若现，恰到好处' };
    if (score < 5.5) return { label: '少糖',   color: '#3b82f6', desc: '轻盈甜感，不觉负担' };
    if (score < 7.5) return { label: '半糖',   color: '#f59e0b', desc: '甜苦平衡，经典之选' };
    if (score < 9.0) return { label: '全糖',   color: '#ef4444', desc: '浓郁香甜，满足味蕾' };
    return { label: '多糖',   color: '#dc2626', desc: '极致甜蜜，能量满满' };
  }

  // 糖浆泵数换算：1泵标准糖浆 ≈ 5g 糖
  var SYRUP_PER_PUMP = 5;

  // ============ 核心推荐函数 ============
  /**
   * @param {Object} input - 用户输入
   *   - roast: 烘焙度 key
   *   - origin: 产区 key
   *   - drink: 咖啡类型 key
   *   - mood: 心情 key
   *   - food: 食物搭配 key
   *   - health: 健康目标 key
   *   - hour: 当前小时（0-23），不传则取系统时间
   * @param {Object} profile - 用户画像 { basePreference: 0-10 }
   * @returns {Object} 推荐结果
   */
  function recommend(input, profile) {
    var hour = (typeof input.hour === 'number') ? input.hour : new Date().getHours();
    var base = (profile && typeof profile.basePreference === 'number')
      ? profile.basePreference : 5.0;

    // 1. 累加各因子调整值
    var roastAdjust  = ROAST_FACTOR[input.roast]   ? ROAST_FACTOR[input.roast].adjust : 0;
    var originAdjust = ORIGIN_FACTOR[input.origin] ? ORIGIN_FACTOR[input.origin].adjust : 0;
    var moodAdjust   = MOOD_FACTOR[input.mood]     ? MOOD_FACTOR[input.mood].adjust : 0;
    var foodAdjust   = FOOD_FACTOR[input.food]     ? FOOD_FACTOR[input.food].adjust : 0;
    var timeAdjust   = getTimeAdjust(hour);

    var rawScore = base + roastAdjust + originAdjust + moodAdjust + foodAdjust + timeAdjust;

    // 2. 饮品类型乘数
    var drinkMult = DRINK_FACTOR[input.drink] ? DRINK_FACTOR[input.drink].multiplier : 1.0;
    var adjustedScore = rawScore * drinkMult;

    // 3. 健康目标系数
    var healthMult = HEALTH_FACTOR[input.health] ? HEALTH_FACTOR[input.health].multiplier : 1.0;
    adjustedScore = adjustedScore * healthMult;

    // 4. 限幅 0-10
    adjustedScore = Math.max(0, Math.min(10, adjustedScore));

    // 5. 转换为克数：1分 ≈ 0.8g 糖
    var grams = Math.round(adjustedScore * 0.8 * 10) / 10;
    var pumps = Math.round((grams / SYRUP_PER_PUMP) * 10) / 10;

    // 6. 甜度等级
    var level = sweetnessLevel(adjustedScore);

    // 7. 生成解释因子
    var factors = [
      { name: '个人偏好', value: base.toFixed(1),         effect: '基准',   icon: '👤' },
      { name: '烘焙度',   value: ROAST_FACTOR[input.roast] ? ROAST_FACTOR[input.roast].label : '-', effect: roastAdjust >= 0 ? '+' + roastAdjust.toFixed(1) : roastAdjust.toFixed(1), icon: '🔥' },
      { name: '产区',     value: ORIGIN_FACTOR[input.origin] ? ORIGIN_FACTOR[input.origin].label : '-', effect: originAdjust >= 0 ? '+' + originAdjust.toFixed(1) : originAdjust.toFixed(1), icon: '🌍' },
      { name: '心情',     value: MOOD_FACTOR[input.mood] ? MOOD_FACTOR[input.mood].label : '-', effect: moodAdjust >= 0 ? '+' + moodAdjust.toFixed(1) : moodAdjust.toFixed(1), icon: MOOD_FACTOR[input.mood] ? MOOD_FACTOR[input.mood].icon : '❓' },
      { name: '食物搭配', value: FOOD_FACTOR[input.food] ? FOOD_FACTOR[input.food].label : '-', effect: foodAdjust >= 0 ? '+' + foodAdjust.toFixed(1) : foodAdjust.toFixed(1), icon: '🍽️' },
      { name: '时段',     value: hour + ':00',            effect: timeAdjust >= 0 ? '+' + timeAdjust.toFixed(1) : timeAdjust.toFixed(1), icon: '🕐' },
      { name: '饮品类型', value: DRINK_FACTOR[input.drink] ? DRINK_FACTOR[input.drink].label : '-', effect: '×' + drinkMult.toFixed(2), icon: '☕' },
      { name: '健康目标', value: HEALTH_FACTOR[input.health] ? HEALTH_FACTOR[input.health].label : '-', effect: '×' + healthMult.toFixed(2), icon: '💪' }
    ];

    return {
      score: Math.round(adjustedScore * 100) / 100,
      grams: grams,
      pumps: pumps,
      level: level,
      factors: factors,
      input: input,
      timestamp: Date.now()
    };
  }

  // ============ 学习反馈 ============
  /**
   * 根据用户反馈调整画像基准偏好
   * @param {Object} profile - 当前用户画像
   * @param {string} feedback - 'bland' | 'perfect' | 'sweet'
   * @returns {Object} 更新后的 profile
   */
  function learn(profile, feedback) {
    var p = profile || { basePreference: 5.0, totalRecords: 0, adaptCount: 0 };
    var delta = 0;
    if (feedback === 'bland')   delta =  0.4;
    if (feedback === 'sweet')   delta = -0.4;
    // perfect: 微调收敛，不动

    // 学习率随记录数递减（前期学得快，后期稳定）
    var lr = 1.0 / (1.0 + (p.adaptCount || 0) * 0.15);
    p.basePreference = Math.max(0, Math.min(10, p.basePreference + delta * lr));
    p.basePreference = Math.round(p.basePreference * 100) / 100;
    if (feedback !== 'perfect') p.adaptCount = (p.adaptCount || 0) + 1;
    return p;
  }

  // ============ 导出 ============
  global.Engine = {
    recommend: recommend,
    learn: learn,
    sweetnessLevel: sweetnessLevel,
    ROAST_FACTOR: ROAST_FACTOR,
    ORIGIN_FACTOR: ORIGIN_FACTOR,
    DRINK_FACTOR: DRINK_FACTOR,
    MOOD_FACTOR: MOOD_FACTOR,
    FOOD_FACTOR: FOOD_FACTOR,
    HEALTH_FACTOR: HEALTH_FACTOR
  };
})(window);
