const express = require('express');
const { db } = require('../db');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/v1/nutrition/recipes
 * 返回食谱列表，支持按健康状况和餐次筛选
 * Query: condition, category, difficulty, season, page, pageSize
 */
router.get('/recipes', (req, res) => {
  try {
    const { condition, category, difficulty, season, page = 1, pageSize = 200 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (condition && condition !== 'all') {
      whereClause += " AND (target_conditions LIKE ? OR target_conditions LIKE ?)";
      params.push(`%"${condition}"%`, '%"general"%');
    }
    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }
    if (difficulty) {
      whereClause += ' AND difficulty = ?';
      params.push(difficulty);
    }
    if (season && season !== 'all') {
      whereClause += " AND (season = ? OR season = 'all')";
      params.push(season);
    }

    // 查询总数
    const countResult = db.prepare(`SELECT COUNT(*) as total FROM recipes ${whereClause}`).get(...params);
    const total = countResult.total;

    // 查询数据（包含食材和步骤，供前端直接展示详情）
    const recipes = db.prepare(`
      SELECT id, name, category, target_conditions, ingredients, steps, nutrition, cook_time, difficulty, season, image_url, description, benefits, tips, suitable_for, not_suitable, tags, created_at
      FROM recipes ${whereClause}
      ORDER BY id ASC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    // 解析JSON字段
    const parsedRecipes = recipes.map(r => ({
      ...r,
      target_conditions: typeof r.target_conditions === 'string' ? JSON.parse(r.target_conditions) : r.target_conditions,
      ingredients: typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients,
      steps: typeof r.steps === 'string' ? JSON.parse(r.steps) : r.steps,
      nutrition: typeof r.nutrition === 'string' ? JSON.parse(r.nutrition) : r.nutrition,
      benefits: typeof r.benefits === 'string' ? JSON.parse(r.benefits) : r.benefits,
      tips: typeof r.tips === 'string' ? JSON.parse(r.tips) : r.tips,
      suitable_for: typeof r.suitable_for === 'string' ? JSON.parse(r.suitable_for) : r.suitable_for,
      not_suitable: typeof r.not_suitable === 'string' ? JSON.parse(r.not_suitable) : r.not_suitable,
      tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags
    }));

    res.json({
      code: 0,
      message: 'ok',
      data: {
        list: parsedRecipes,
        pagination: {
          page: parseInt(page),
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    console.error('[Nutrition] 获取食谱列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * GET /api/v1/nutrition/recipes/:id
 * 返回单道食谱详情（含食材和做法步骤）
 */
router.get('/recipes/:id', (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);

    if (!recipe) {
      return res.status(404).json({ code: 404, message: '食谱不存在', data: null });
    }

    // 解析JSON字段
    const parsedRecipe = {
      ...recipe,
      target_conditions: typeof recipe.target_conditions === 'string' ? JSON.parse(recipe.target_conditions) : recipe.target_conditions,
      ingredients: typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients) : recipe.ingredients,
      steps: typeof recipe.steps === 'string' ? JSON.parse(recipe.steps) : recipe.steps,
      nutrition: typeof recipe.nutrition === 'string' ? JSON.parse(recipe.nutrition) : recipe.nutrition,
      benefits: typeof recipe.benefits === 'string' ? JSON.parse(recipe.benefits) : recipe.benefits,
      tips: typeof recipe.tips === 'string' ? JSON.parse(recipe.tips) : recipe.tips,
      suitable_for: typeof recipe.suitable_for === 'string' ? JSON.parse(recipe.suitable_for) : recipe.suitable_for,
      not_suitable: typeof recipe.not_suitable === 'string' ? JSON.parse(recipe.not_suitable) : recipe.not_suitable,
      tags: typeof recipe.tags === 'string' ? JSON.parse(recipe.tags) : recipe.tags
    };

    res.json({
      code: 0,
      message: 'ok',
      data: parsedRecipe
    });
  } catch (err) {
    console.error('[Nutrition] 获取食谱详情失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * GET /api/v1/nutrition/recommend
 * 根据用户健康档案推荐食谱（分析用户指标后返回个性化推荐）
 */
router.get('/recommend', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;

    // 如果没有用户认证，返回通用推荐
    if (!userId) {
      const categories = ['breakfast', 'lunch', 'dinner', 'snack'];
      const recommendations = {};

      for (const cat of categories) {
        const recipes = db.prepare(`
          SELECT id, name, category, target_conditions, ingredients, steps, nutrition, cook_time, difficulty, season, image_url, description, benefits, tips, suitable_for, not_suitable, tags
          FROM recipes WHERE target_conditions LIKE ? AND category = ?
          ORDER BY id ASC
        `).all('%"general"%', cat);

        recommendations[cat] = recipes.map(r => ({
          ...r,
          target_conditions: typeof r.target_conditions === 'string' ? JSON.parse(r.target_conditions) : r.target_conditions,
          ingredients: typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients,
          steps: typeof r.steps === 'string' ? JSON.parse(r.steps) : r.steps,
          nutrition: typeof r.nutrition === 'string' ? JSON.parse(r.nutrition) : r.nutrition,
          benefits: typeof r.benefits === 'string' ? JSON.parse(r.benefits) : r.benefits,
          tips: typeof r.tips === 'string' ? JSON.parse(r.tips) : r.tips,
          suitable_for: typeof r.suitable_for === 'string' ? JSON.parse(r.suitable_for) : r.suitable_for,
          not_suitable: typeof r.not_suitable === 'string' ? JSON.parse(r.not_suitable) : r.not_suitable,
          tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags
        }));
      }

      return res.json({
        code: 0,
        message: 'ok',
        data: {
          user_conditions: ['general'],
          reasons: ['均衡营养食谱（通用推荐，登录后可获得个性化推荐）'],
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

    // 确定用户健康条件
    const conditions = [];

    // BMI判断
    let bmi = null;
    if (profile && profile.height && profile.weight) {
      const heightM = profile.height / 100;
      bmi = profile.weight / (heightM * heightM);
      if (bmi >= 24) conditions.push('weight_loss');
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

    // 如果没有特殊条件，推荐general
    if (conditions.length === 0) {
      conditions.push('general');
    }

    // 构建查询条件（包含通用食谱，确保推荐内容丰富）
    let whereClause = '';
    const params = [];
    if (conditions.length > 0) {
      // 同时匹配用户具体条件和通用食谱
      const allConditions = [...conditions, 'general'];
      const likeConditions = allConditions.map(() => "target_conditions LIKE ?").join(' OR ');
      whereClause = `WHERE (${likeConditions})`;
      allConditions.forEach(c => params.push(`%"${c}"%`));
    }

    // 查询推荐食谱（每个类别返回全部符合条件的食谱）
    const categories = ['breakfast', 'lunch', 'dinner', 'snack'];
    const recommendations = {};

    for (const cat of categories) {
      const catWhere = whereClause ? `${whereClause} AND category = ?` : 'WHERE category = ?';
      const catParams = [...params, cat];

      const recipes = db.prepare(`
        SELECT id, name, category, target_conditions, ingredients, steps, nutrition, cook_time, difficulty, season, image_url, description, benefits, tips, suitable_for, not_suitable, tags
        FROM recipes ${catWhere}
        ORDER BY id ASC
      `).all(...catParams);

      recommendations[cat] = recipes.map(r => ({
        ...r,
        target_conditions: typeof r.target_conditions === 'string' ? JSON.parse(r.target_conditions) : r.target_conditions,
        ingredients: typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients,
        steps: typeof r.steps === 'string' ? JSON.parse(r.steps) : r.steps,
        nutrition: typeof r.nutrition === 'string' ? JSON.parse(r.nutrition) : r.nutrition,
        benefits: typeof r.benefits === 'string' ? JSON.parse(r.benefits) : r.benefits,
        tips: typeof r.tips === 'string' ? JSON.parse(r.tips) : r.tips,
        suitable_for: typeof r.suitable_for === 'string' ? JSON.parse(r.suitable_for) : r.suitable_for,
        not_suitable: typeof r.not_suitable === 'string' ? JSON.parse(r.not_suitable) : r.not_suitable,
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags
      }));
    }

    // 构建推荐理由
    const reasons = [];
    if (conditions.includes('hypertension')) reasons.push('低盐降压食谱');
    if (conditions.includes('diabetes')) reasons.push('低GI控糖食谱');
    if (conditions.includes('hyperlipidemia')) reasons.push('低脂降脂食谱');
    if (conditions.includes('weight_loss')) reasons.push('低卡减脂食谱');
    if (conditions.includes('general')) reasons.push('均衡营养食谱');

    res.json({
      code: 0,
      message: 'ok',
      data: {
        user_conditions: conditions,
        reasons,
        recommendations
      }
    });
  } catch (err) {
    console.error('[Nutrition] 获取推荐食谱失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

module.exports = router;
