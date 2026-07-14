const express = require('express');
const { db } = require('../db');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/v1/fitness/exercises
 * 返回运动列表，支持按类型和难度筛选
 * Query: category, difficulty, equipment, condition, page, pageSize
 */
router.get('/exercises', (req, res) => {
  try {
    const { category, difficulty, equipment, condition, page = 1, pageSize = 100 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }
    if (difficulty) {
      whereClause += ' AND difficulty = ?';
      params.push(difficulty);
    }
    if (equipment) {
      whereClause += ' AND equipment = ?';
      params.push(equipment);
    }
    if (condition && condition !== 'all') {
      whereClause += " AND (target_conditions LIKE ? OR target_conditions LIKE ?)";
      params.push(`%"${condition}"%`, '%"general"%');
    }

    // 查询总数
    const countResult = db.prepare(`SELECT COUNT(*) as total FROM exercises ${whereClause}`).get(...params);
    const total = countResult.total;

    // 查询数据（包含步骤和提示，供前端直接展示详情）
    const exercises = db.prepare(`
      SELECT id, name, category, target_conditions, difficulty, duration, calories_per_hour, equipment, steps, tips, muscle_groups, image_url, video_url, description, benefits, common_mistakes, variations, created_at
      FROM exercises ${whereClause}
      ORDER BY id ASC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    // 解析JSON字段
    const parsedExercises = exercises.map(e => ({
      ...e,
      target_conditions: typeof e.target_conditions === 'string' ? JSON.parse(e.target_conditions) : e.target_conditions,
      steps: typeof e.steps === 'string' ? JSON.parse(e.steps) : e.steps,
      tips: typeof e.tips === 'string' ? JSON.parse(e.tips) : e.tips,
      muscle_groups: typeof e.muscle_groups === 'string' ? JSON.parse(e.muscle_groups) : e.muscle_groups,
      benefits: typeof e.benefits === 'string' ? JSON.parse(e.benefits) : e.benefits,
      common_mistakes: typeof e.common_mistakes === 'string' ? JSON.parse(e.common_mistakes) : e.common_mistakes,
      variations: typeof e.variations === 'string' ? JSON.parse(e.variations) : e.variations
    }));

    res.json({
      code: 0,
      message: 'ok',
      data: {
        list: parsedExercises,
        pagination: {
          page: parseInt(page),
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    console.error('[Fitness] 获取运动列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * GET /api/v1/fitness/exercises/:id
 * 返回单项运动详情（含图文步骤分解）
 */
router.get('/exercises/:id', (req, res) => {
  try {
    const exerciseId = parseInt(req.params.id);
    const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(exerciseId);

    if (!exercise) {
      return res.status(404).json({ code: 404, message: '运动不存在', data: null });
    }

    // 解析JSON字段
    const parsedExercise = {
      ...exercise,
      target_conditions: typeof exercise.target_conditions === 'string' ? JSON.parse(exercise.target_conditions) : exercise.target_conditions,
      steps: typeof exercise.steps === 'string' ? JSON.parse(exercise.steps) : exercise.steps,
      tips: typeof exercise.tips === 'string' ? JSON.parse(exercise.tips) : exercise.tips,
      muscle_groups: typeof exercise.muscle_groups === 'string' ? JSON.parse(exercise.muscle_groups) : exercise.muscle_groups,
      benefits: typeof exercise.benefits === 'string' ? JSON.parse(exercise.benefits) : exercise.benefits,
      common_mistakes: typeof exercise.common_mistakes === 'string' ? JSON.parse(exercise.common_mistakes) : exercise.common_mistakes,
      variations: typeof exercise.variations === 'string' ? JSON.parse(exercise.variations) : exercise.variations
    };

    res.json({
      code: 0,
      message: 'ok',
      data: parsedExercise
    });
  } catch (err) {
    console.error('[Fitness] 获取运动详情失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * GET /api/v1/fitness/recommend
 * 根据用户健康档案推荐运动（BMI+疾病+运动习惯综合分析）
 */
router.get('/recommend', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;

    // 如果没有用户认证，返回通用推荐
    if (!userId) {
      const categories = ['aerobic', 'resistance', 'flexibility'];
      const recommendations = {};

      for (const cat of categories) {
        const exercises = db.prepare(`
          SELECT id, name, category, target_conditions, difficulty, duration, calories_per_hour, equipment, steps, tips, muscle_groups, image_url, video_url, description, benefits, common_mistakes, variations
          FROM exercises WHERE target_conditions LIKE ? AND category = ?
          ORDER BY id ASC
        `).all('%"general"%', cat);

        recommendations[cat] = exercises.map(e => ({
          ...e,
          target_conditions: typeof e.target_conditions === 'string' ? JSON.parse(e.target_conditions) : e.target_conditions,
          steps: typeof e.steps === 'string' ? JSON.parse(e.steps) : e.steps,
          tips: typeof e.tips === 'string' ? JSON.parse(e.tips) : e.tips,
          muscle_groups: typeof e.muscle_groups === 'string' ? JSON.parse(e.muscle_groups) : e.muscle_groups,
          benefits: typeof e.benefits === 'string' ? JSON.parse(e.benefits) : e.benefits,
          common_mistakes: typeof e.common_mistakes === 'string' ? JSON.parse(e.common_mistakes) : e.common_mistakes,
          variations: typeof e.variations === 'string' ? JSON.parse(e.variations) : e.variations
        }));
      }

      return res.json({
        code: 0,
        message: 'ok',
        data: {
          user_conditions: ['general'],
          bmi: null,
          recommended_difficulty: 'beginner',
          reasons: ['通用运动推荐（登录后可获得个性化推荐）'],
          recommendations
        }
      });
    }

    // 获取用户档案
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);

    // 获取用户体检指标
    const allMetrics = db.prepare(
      'SELECT metric_type, value FROM health_metrics WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);

    const metricsByType = {};
    for (const m of allMetrics) {
      if (!metricsByType[m.metric_type]) {
        metricsByType[m.metric_type] = (function(v) { try { return typeof v === 'string' ? JSON.parse(v) : v } catch(e) { return v } })(m.value);
      }
    }

    // 分析健康条件
    const conditions = [];
    let bmi = null;
    let bmiCategory = 'normal';

    // BMI判断
    if (profile && profile.height && profile.weight) {
      const heightM = profile.height / 100;
      bmi = profile.weight / (heightM * heightM);
      if (bmi < 18.5) bmiCategory = 'underweight';
      else if (bmi >= 28) bmiCategory = 'obese';
      else if (bmi >= 24) bmiCategory = 'overweight';
    }

    if (bmiCategory === 'overweight' || bmiCategory === 'obese') {
      conditions.push('weight_loss');
    }

    // 血压
    const bp = metricsByType['blood_pressure'];
    if (bp && (bp.systolic >= 140 || bp.diastolic >= 90)) {
      conditions.push('hypertension');
    }

    // 血糖
    const bs = metricsByType['blood_sugar'];
    if (bs && bs.fasting >= 6.1) {
      conditions.push('diabetes');
    }

    // 血脂
    const bl = metricsByType['blood_lipid'];
    if (bl && (bl.total_cholesterol >= 5.2 || bl.triglycerides >= 1.7)) {
      conditions.push('hyperlipidemia');
    }

    if (conditions.length === 0) {
      conditions.push('general');
    }

    // 运动习惯
    let exerciseHabits = null;
    if (profile && profile.exercise_habits) {
      try {
        exerciseHabits = typeof profile.exercise_habits === 'string'
          ? JSON.parse(profile.exercise_habits)
          : profile.exercise_habits;
      } catch (e) {
        exerciseHabits = null;
      }
    }

    // 确定推荐难度
    let recommendedDifficulty = 'beginner';
    if (exerciseHabits && exerciseHabits.frequency) {
      const freq = exerciseHabits.frequency;
      if (freq === 'daily' || freq === '4-6_times') {
        recommendedDifficulty = 'intermediate';
      }
    }
    // BMI过高或高血压建议从beginner开始
    if (bmiCategory === 'obese' || conditions.includes('hypertension')) {
      recommendedDifficulty = 'beginner';
    }

    // 构建查询（包含通用运动，确保推荐内容丰富）
    let whereClause = '';
    const params = [];
    if (conditions.length > 0) {
      // 同时匹配用户具体条件和通用运动
      const allConditions = [...conditions, 'general'];
      const likeConditions = allConditions.map(() => "target_conditions LIKE ?").join(' OR ');
      whereClause = `WHERE (${likeConditions})`;
      allConditions.forEach(c => params.push(`%"${c}"%`));
    }

    // 按类别查询推荐运动
    const categories = ['aerobic', 'resistance', 'flexibility'];
    const recommendations = {};

    for (const cat of categories) {
      let catWhere = whereClause ? `${whereClause} AND category = ?` : 'WHERE category = ?';
      const catParams = [...params, cat];

      // 对于非拉伸类，限制难度
      if (cat !== 'flexibility') {
        catWhere += ' AND difficulty = ?';
        catParams.push(recommendedDifficulty);
      }

      const exercises = db.prepare(`
        SELECT id, name, category, target_conditions, difficulty, duration, calories_per_hour, equipment, steps, tips, muscle_groups, image_url, video_url, description, benefits, common_mistakes, variations
        FROM exercises ${catWhere}
        ORDER BY id ASC
      `).all(...catParams);

      recommendations[cat] = exercises.map(e => ({
        ...e,
        target_conditions: typeof e.target_conditions === 'string' ? JSON.parse(e.target_conditions) : e.target_conditions,
        steps: typeof e.steps === 'string' ? JSON.parse(e.steps) : e.steps,
        tips: typeof e.tips === 'string' ? JSON.parse(e.tips) : e.tips,
        muscle_groups: typeof e.muscle_groups === 'string' ? JSON.parse(e.muscle_groups) : e.muscle_groups,
        benefits: typeof e.benefits === 'string' ? JSON.parse(e.benefits) : e.benefits,
        common_mistakes: typeof e.common_mistakes === 'string' ? JSON.parse(e.common_mistakes) : e.common_mistakes,
        variations: typeof e.variations === 'string' ? JSON.parse(e.variations) : e.variations
      }));
    }

    // 构建推荐理由
    const reasons = [];
    if (conditions.includes('hypertension')) reasons.push('推荐低强度有氧运动，避免憋气用力');
    if (conditions.includes('diabetes')) reasons.push('规律有氧运动有助于提高胰岛素敏感性');
    if (conditions.includes('hyperlipidemia')) reasons.push('有氧运动可促进脂质代谢');
    if (conditions.includes('weight_loss')) reasons.push('增加有氧运动时长，促进脂肪消耗');
    if (bmiCategory === 'obese') reasons.push('建议从低冲击运动开始，保护关节');
    if (recommendedDifficulty === 'beginner') reasons.push('根据当前状况建议从初级开始');
    if (recommendedDifficulty === 'intermediate') reasons.push('根据运动基础推荐中级强度');

    res.json({
      code: 0,
      message: 'ok',
      data: {
        user_conditions: conditions,
        bmi: bmi !== null ? { value: Math.round(bmi * 10) / 10, category: bmiCategory } : null,
        recommended_difficulty: recommendedDifficulty,
        reasons,
        recommendations
      }
    });
  } catch (err) {
    console.error('[Fitness] 获取推荐运动失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

module.exports = router;
