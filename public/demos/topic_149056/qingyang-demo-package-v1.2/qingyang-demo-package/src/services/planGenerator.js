/**
 * 轻养助手 - AI方案生成器
 * 基于知识库的生成逻辑，从recipes和exercises表中查询数据
 * 每天至少3项建议（饮食+运动+作息各至少1项）
 */

const { db } = require('../db');

// ===== 作息建议池 =====
const sleepSuggestions = [
  { content: '23:00前入睡，保证7-8小时睡眠', time_slot: '23:00' },
  { content: '午休20-30分钟', time_slot: '13:00' },
  { content: '睡前1小时不看手机，听舒缓音乐放松', time_slot: '22:00' },
  { content: '晚上9点后不进食，保持肠胃休息', time_slot: '21:00' },
  { content: '每天固定时间起床，培养生物钟', time_slot: '06:30' },
  { content: '睡前用温水泡脚15-20分钟', time_slot: '22:30' },
  { content: '午休不超过30分钟，避免影响夜间睡眠', time_slot: '13:00' },
  { content: '卧室保持安静、暗光、适宜温度(22-26度)', time_slot: '22:30' },
];

/**
 * 从数据库获取食谱
 * @param {Array} conditions - 健康状况列表
 * @returns {Object} 按category分组的食谱列表
 */
function getRecipesFromDB(conditions) {
  // 构建查询条件
  const searchConditions = conditions.length > 0 ? [...conditions] : ['general'];

  // 查询所有匹配条件的食谱
  let whereClause = '';
  const params = [];
  const likeConditions = searchConditions.map(() => "target_conditions LIKE ?").join(' OR ');
  whereClause = `WHERE (${likeConditions})`;
  searchConditions.forEach(c => params.push(`%"${c}"%`));

  const recipes = db.prepare(`
    SELECT id, name, category, target_conditions, ingredients, steps, nutrition, cook_time, difficulty, season
    FROM recipes ${whereClause}
  `).all(...params);

  // 按category分组
  const grouped = { breakfast: [], lunch: [], dinner: [], snack: [] };
  for (const r of recipes) {
    if (grouped[r.category]) {
      grouped[r.category].push({
        ...r,
        target_conditions: typeof r.target_conditions === 'string' ? JSON.parse(r.target_conditions) : r.target_conditions,
        ingredients: typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients,
        steps: typeof r.steps === 'string' ? JSON.parse(r.steps) : r.steps,
        nutrition: typeof r.nutrition === 'string' ? JSON.parse(r.nutrition) : r.nutrition
      });
    }
  }

  // 如果某个类别为空，补充通用食谱
  for (const cat of Object.keys(grouped)) {
    if (grouped[cat].length === 0) {
      const fallback = db.prepare(`
        SELECT id, name, category, target_conditions, ingredients, steps, nutrition, cook_time, difficulty, season
        FROM recipes WHERE category = ? AND target_conditions LIKE ?
        LIMIT 5
      `).all(cat, '%"general"%');

      grouped[cat] = fallback.map(r => ({
        ...r,
        target_conditions: typeof r.target_conditions === 'string' ? JSON.parse(r.target_conditions) : r.target_conditions,
        ingredients: typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients,
        steps: typeof r.steps === 'string' ? JSON.parse(r.steps) : r.steps,
        nutrition: typeof r.nutrition === 'string' ? JSON.parse(r.nutrition) : r.nutrition
      }));
    }
  }

  return grouped;
}

/**
 * 从数据库获取运动
 * @param {Array} conditions - 健康状况列表
 * @param {string} difficulty - 推荐难度
 * @returns {Object} 按category分组的运动列表
 */
function getExercisesFromDB(conditions, difficulty = 'beginner') {
  const searchConditions = conditions.length > 0 ? [...conditions] : ['general'];

  let whereClause = '';
  const params = [];
  const likeConditions = searchConditions.map(() => "target_conditions LIKE ?").join(' OR ');
  whereClause = `WHERE (${likeConditions})`;
  searchConditions.forEach(c => params.push(`%"${c}"%`));

  // 有氧运动查询
  const aerobicExercises = db.prepare(`
    SELECT id, name, category, target_conditions, difficulty, duration, calories_per_hour, equipment, steps, tips, muscle_groups
    FROM exercises ${whereClause} AND category = 'aerobic' AND difficulty = ?
    LIMIT 5
  `).all(...params, difficulty);

  // 抗阻训练查询
  const resistanceExercises = db.prepare(`
    SELECT id, name, category, target_conditions, difficulty, duration, calories_per_hour, equipment, steps, tips, muscle_groups
    FROM exercises ${whereClause} AND category = 'resistance' AND difficulty = ?
    LIMIT 5
  `).all(...params, difficulty);

  // 拉伸放松查询
  const flexibilityExercises = db.prepare(`
    SELECT id, name, category, target_conditions, difficulty, duration, calories_per_hour, equipment, steps, tips, muscle_groups
    FROM exercises ${whereClause} AND category = 'flexibility'
    LIMIT 5
  `).all(...params);

  const parseExercise = e => ({
    ...e,
    target_conditions: typeof e.target_conditions === 'string' ? JSON.parse(e.target_conditions) : e.target_conditions,
    steps: typeof e.steps === 'string' ? JSON.parse(e.steps) : e.steps,
    tips: typeof e.tips === 'string' ? JSON.parse(e.tips) : e.tips,
    muscle_groups: typeof e.muscle_groups === 'string' ? JSON.parse(e.muscle_groups) : e.muscle_groups
  });

  // 如果没有数据，使用fallback
  let aerobic = aerobicExercises.map(parseExercise);
  let resistance = resistanceExercises.map(parseExercise);
  let flexibility = flexibilityExercises.map(parseExercise);

  if (aerobic.length === 0) {
    const fallback = db.prepare(`
      SELECT id, name, category, target_conditions, difficulty, duration, calories_per_hour, equipment, steps, tips, muscle_groups
      FROM exercises WHERE category = 'aerobic' AND target_conditions LIKE ?
      LIMIT 5
    `).all('%"general"%');
    aerobic = fallback.map(parseExercise);
  }

  if (resistance.length === 0) {
    const fallback = db.prepare(`
      SELECT id, name, category, target_conditions, difficulty, duration, calories_per_hour, equipment, steps, tips, muscle_groups
      FROM exercises WHERE category = 'resistance' AND target_conditions LIKE ? AND difficulty = ?
      LIMIT 5
    `).all('%"general"%', difficulty);
    resistance = fallback.map(parseExercise);
  }

  if (flexibility.length === 0) {
    const fallback = db.prepare(`
      SELECT id, name, category, target_conditions, difficulty, duration, calories_per_hour, equipment, steps, tips, muscle_groups
      FROM exercises WHERE category = 'flexibility' AND target_conditions LIKE ?
      LIMIT 5
    `).all('%"general"%');
    flexibility = fallback.map(parseExercise);
  }

  return { aerobic, resistance, flexibility };
}

/**
 * 生成30天方案
 * @param {Object} profile - 用户档案
 * @param {Array} healthConditions - 健康状况列表
 * @returns {Array} 30天的方案数据
 */
function generatePlan(profile, healthConditions = []) {
  const days = 30;
  const plan = [];

  // 判断BMI类别
  let bmiCategory = 'normal';
  if (profile && profile.height && profile.weight) {
    const heightM = profile.height / 100;
    const bmi = profile.weight / (heightM * heightM);
    if (bmi < 18.5) bmiCategory = 'underweight';
    else if (bmi >= 28) bmiCategory = 'obese';
    else if (bmi >= 24) bmiCategory = 'overweight';
  }

  // 判断健康状况
  const hasHypertension = healthConditions.includes('hypertension');
  const hasDiabetes = healthConditions.includes('diabetes');
  const hasLipidIssue = healthConditions.includes('hyperlipidemia');

  // 确定运动难度
  let exerciseDifficulty = 'beginner';
  if (profile && profile.exercise_habits) {
    try {
      const habits = typeof profile.exercise_habits === 'string'
        ? JSON.parse(profile.exercise_habits)
        : profile.exercise_habits;
      if (habits.frequency === 'daily' || habits.frequency === '4-6_times') {
        exerciseDifficulty = 'intermediate';
      }
    } catch (e) {
      // ignore
    }
  }
  if (bmiCategory === 'obese' || hasHypertension) {
    exerciseDifficulty = 'beginner';
  }

  // 从数据库加载知识库
  const recipes = getRecipesFromDB(healthConditions);
  const exercises = getExercisesFromDB(healthConditions, exerciseDifficulty);

  // 循环选取，避免每天完全相同
  function pickRandom(arr, count, offset) {
    const results = [];
    const len = arr.length;
    if (len === 0) return results;
    for (let i = 0; i < count && i < len; i++) {
      results.push(arr[(offset + i) % len]);
    }
    return results;
  }

  for (let day = 1; day <= days; day++) {
    const dayOffset = (day - 1) * 5;
    const date = getDateForDay(day);
    const isWeekend = new Date(date).getDay() % 6 === 0; // 0=周日, 6=周六
    const dayType = isWeekend ? '周末' : '工作日';
    const items = [];

    // === 饮食部分：三餐合并为一项 ===
    const breakfastPool = recipes.breakfast;
    const lunchPool = recipes.lunch;
    const dinnerPool = recipes.dinner;
    const bf = breakfastPool[(dayOffset) % Math.max(1, breakfastPool.length)];
    const lu = lunchPool[(dayOffset + 1) % Math.max(1, lunchPool.length)];
    const di = dinnerPool[(dayOffset + 2) % Math.max(1, dinnerPool.length)];

    if (bf || lu || di) {
      const totalCalories = (bf?.nutrition?.calories || 300) + (lu?.nutrition?.calories || 500) + (di?.nutrition?.calories || 400);
      items.push({
        item_type: 'diet',
        content: JSON.stringify({
          text: `${dayType}三餐搭配`,
          breakfast: bf ? `早餐 ${bf.name}` : '早餐',
          lunch: lu ? `午餐 ${lu.name}` : '午餐',
          dinner: di ? `晚餐 ${di.name}` : '晚餐',
          total_calories: totalCalories,
          recipe_ids: [bf?.id, lu?.id, di?.id].filter(Boolean)
        }),
        time_slot: '全天',
        is_custom: 0,
        recipe_ids: JSON.stringify([bf?.id, lu?.id, di?.id].filter(Boolean))
      });
    }

    // === 运动部分：中午+晚上两次 ===
    // 中午时段（12:30-13:00）
    if (exercises.aerobic.length > 0) {
      const midDay = exercises.aerobic[dayOffset % exercises.aerobic.length];
      const midDuration = midDay.duration || 30;
      const midStartTime = '12:30';
      const midEndTime = formatEndTime(midStartTime, midDuration);
      items.push({
        item_type: 'exercise',
        content: JSON.stringify({
          text: `午间运动：${midDay.name} ${midDuration}分钟`,
          calories: Math.round((midDay.calories_per_hour || 300) * midDuration / 60),
          exercise_type: 'aerobic',
          exercise_name: midDay.name,
          exercise_id: midDay.id,
          duration: midDuration,
          period: '午间',
          start_time: midStartTime,
          end_time: midEndTime,
          tutorial_search_url: 'https://www.baidu.com/s?wd=' + encodeURIComponent(midDay.name + ' 正确动作 教学'),
          steps: midDay.steps || []
        }),
        time_slot: midStartTime,
        is_custom: 0,
        exercise_id: midDay.id
      });
    }

    // 晚上时段
    const exerciseTypeCycle = day % 3;
    let eveningExercise = null;
    let eveningStartTime = '18:30';
    let eveningEndTime = '19:00';
    if (exerciseTypeCycle === 1 && exercises.resistance.length > 0) {
      eveningExercise = exercises.resistance[(dayOffset + 1) % exercises.resistance.length];
    } else if (exerciseTypeCycle === 2 && exercises.flexibility.length > 0) {
      eveningExercise = exercises.flexibility[(dayOffset + 2) % exercises.flexibility.length];
      eveningStartTime = '21:00';
      eveningEndTime = '21:15';
    } else if (exercises.aerobic.length > 0) {
      eveningExercise = exercises.aerobic[(dayOffset + 3) % exercises.aerobic.length];
    }
    if (eveningExercise) {
      const eveDuration = eveningExercise.duration || 30;
      eveningEndTime = formatEndTime(eveningStartTime, eveDuration);
      items.push({
        item_type: 'exercise',
        content: JSON.stringify({
          text: `晚间运动：${eveningExercise.name} ${eveDuration}分钟`,
          calories: Math.round((eveningExercise.calories_per_hour || 300) * eveDuration / 60),
          exercise_type: eveningExercise.category,
          exercise_name: eveningExercise.name,
          exercise_id: eveningExercise.id,
          duration: eveDuration,
          period: '晚间',
          start_time: eveningStartTime,
          end_time: eveningEndTime,
          tutorial_search_url: 'https://www.baidu.com/s?wd=' + encodeURIComponent(eveningExercise.name + ' 正确动作 教学'),
          steps: eveningExercise.steps || []
        }),
        time_slot: eveningStartTime,
        is_custom: 0,
        exercise_id: eveningExercise.id
      });
    }

    // === 作息部分 ===
    // 午休建议
    items.push({
      item_type: 'sleep',
      content: JSON.stringify({ text: '午休20-30分钟，恢复精力' }),
      time_slot: '13:00',
      is_custom: 0
    });
    // 晚间作息
    const sleepPool = [...sleepSuggestions];
    const selectedSleep = pickRandom(sleepPool, 1, dayOffset + 4);
    for (const s of selectedSleep) {
      items.push({
        item_type: 'sleep',
        content: JSON.stringify({ text: s.content }),
        time_slot: s.time_slot,
        is_custom: 0
      });
    }

    plan.push({ day, date, items });
  }

  return plan;
}

/**
 * 获取从今天起第N天的日期字符串
 */
function getDateForDay(dayOffset) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset - 1);
  return date.toISOString().split('T')[0];
}

/**
 * 根据开始时间和持续分钟数计算结束时间
 * @param {string} startTime - 格式 "HH:MM"
 * @param {number} durationMinutes - 持续分钟数
 * @returns {string} 结束时间 "HH:MM"
 */
function formatEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

/**
 * 从体检指标中提取健康条件
 */
function extractHealthConditions(metricsByType) {
  const conditions = [];

  const bp = metricsByType['blood_pressure'];
  if (bp) {
    if (bp.systolic >= 140 || bp.diastolic >= 90) {
      conditions.push('hypertension');
    }
  }

  const bs = metricsByType['blood_sugar'];
  if (bs) {
    if (bs.fasting >= 6.1 || bs.postprandial >= 7.8) {
      conditions.push('diabetes');
    }
  }

  const bl = metricsByType['blood_lipid'];
  if (bl) {
    if (bl.total_cholesterol >= 5.2 || bl.triglycerides >= 1.7) {
      conditions.push('hyperlipidemia');
    }
  }

  return conditions;
}

module.exports = { generatePlan, extractHealthConditions };
