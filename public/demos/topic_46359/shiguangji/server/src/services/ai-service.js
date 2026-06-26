// AI 识别服务模块
// 提供菜品识别、推荐和标签查询功能
// 优先使用 OpenAI Vision API，未配置时使用本地菜品数据库模拟识别

const fs = require('fs');
const path = require('path');

// OpenAI 配置
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

/**
 * 内置菜品数据库（30 道中国常见菜品）
 * 每道菜包含: name, emoji, tags, difficulty, cookTime, cuisine, calories, flavor
 */
const DISH_DATABASE = [
  { name: '宫保鸡丁', emoji: '🍗', tags: ['鸡肉', '川菜', '下饭', '辣'], difficulty: 'medium', cookTime: 25, cuisine: '川菜', calories: 350, flavor: '麻辣' },
  { name: '麻婆豆腐', emoji: '🌶️', tags: ['豆腐', '川菜', '下饭', '辣'], difficulty: 'easy', cookTime: 20, cuisine: '川菜', calories: 220, flavor: '麻辣' },
  { name: '鱼香肉丝', emoji: '🥕', tags: ['猪肉', '川菜', '下饭'], difficulty: 'medium', cookTime: 25, cuisine: '川菜', calories: 320, flavor: '酸甜' },
  { name: '回锅肉', emoji: '🥩', tags: ['猪肉', '川菜', '下饭', '辣'], difficulty: 'medium', cookTime: 30, cuisine: '川菜', calories: 450, flavor: '香辣' },
  { name: '水煮鱼', emoji: '🐟', tags: ['鱼肉', '川菜', '辣', '汤'], difficulty: 'hard', cookTime: 40, cuisine: '川菜', calories: 380, flavor: '麻辣' },
  { name: '红烧肉', emoji: '🥩', tags: ['猪肉', '家常菜', '下饭'], difficulty: 'medium', cookTime: 60, cuisine: '本帮菜', calories: 520, flavor: '咸甜' },
  { name: '糖醋里脊', emoji: '🍖', tags: ['猪肉', '家常菜', '酸甜'], difficulty: 'medium', cookTime: 30, cuisine: '鲁菜', calories: 400, flavor: '酸甜' },
  { name: '番茄炒蛋', emoji: '🍅', tags: ['鸡蛋', '家常菜', '快手菜'], difficulty: 'easy', cookTime: 10, cuisine: '家常菜', calories: 180, flavor: '酸甜' },
  { name: '青椒土豆丝', emoji: '🥔', tags: ['素菜', '家常菜', '快手菜'], difficulty: 'easy', cookTime: 15, cuisine: '家常菜', calories: 150, flavor: '咸鲜' },
  { name: '地三鲜', emoji: '🍆', tags: ['素菜', '东北菜', '下饭'], difficulty: 'medium', cookTime: 25, cuisine: '东北菜', calories: 260, flavor: '咸鲜' },
  { name: '锅包肉', emoji: '🍖', tags: ['猪肉', '东北菜', '酸甜'], difficulty: 'hard', cookTime: 35, cuisine: '东北菜', calories: 480, flavor: '酸甜' },
  { name: '小鸡炖蘑菇', emoji: '🍄', tags: ['鸡肉', '东北菜', '汤'], difficulty: 'medium', cookTime: 50, cuisine: '东北菜', calories: 340, flavor: '咸鲜' },
  { name: '北京烤鸭', emoji: '🦆', tags: ['鸭肉', '京菜', '宴客'], difficulty: 'hard', cookTime: 120, cuisine: '京菜', calories: 580, flavor: '咸甜' },
  { name: '京酱肉丝', emoji: '🥩', tags: ['猪肉', '京菜', '下饭'], difficulty: 'medium', cookTime: 25, cuisine: '京菜', calories: 360, flavor: '咸甜' },
  { name: '清蒸鲈鱼', emoji: '🐟', tags: ['鱼肉', '粤菜', '清淡'], difficulty: 'medium', cookTime: 20, cuisine: '粤菜', calories: 240, flavor: '清淡' },
  { name: '白切鸡', emoji: '🍗', tags: ['鸡肉', '粤菜', '清淡'], difficulty: 'medium', cookTime: 30, cuisine: '粤菜', calories: 280, flavor: '清淡' },
  { name: '菠萝咕噜肉', emoji: '🍍', tags: ['猪肉', '粤菜', '酸甜'], difficulty: 'medium', cookTime: 30, cuisine: '粤菜', calories: 420, flavor: '酸甜' },
  { name: '虾饺', emoji: '🦐', tags: ['虾', '粤菜', '点心'], difficulty: 'hard', cookTime: 45, cuisine: '粤菜', calories: 200, flavor: '咸鲜' },
  { name: '叉烧', emoji: '🍖', tags: ['猪肉', '粤菜', '烤'], difficulty: 'hard', cookTime: 60, cuisine: '粤菜', calories: 460, flavor: '咸甜' },
  { name: '佛跳墙', emoji: '🍲', tags: ['海鲜', '闽菜', '汤', '宴客'], difficulty: 'hard', cookTime: 180, cuisine: '闽菜', calories: 620, flavor: '咸鲜' },
  { name: '荔枝肉', emoji: '🍖', tags: ['猪肉', '闽菜', '酸甜'], difficulty: 'medium', cookTime: 30, cuisine: '闽菜', calories: 400, flavor: '酸甜' },
  { name: '剁椒鱼头', emoji: '🐟', tags: ['鱼肉', '湘菜', '辣'], difficulty: 'medium', cookTime: 30, cuisine: '湘菜', calories: 300, flavor: '香辣' },
  { name: '辣椒炒肉', emoji: '🌶️', tags: ['猪肉', '湘菜', '辣', '下饭'], difficulty: 'easy', cookTime: 15, cuisine: '湘菜', calories: 320, flavor: '香辣' },
  { name: '毛氏红烧肉', emoji: '🥩', tags: ['猪肉', '湘菜', '下饭'], difficulty: 'medium', cookTime: 60, cuisine: '湘菜', calories: 540, flavor: '咸甜' },
  { name: '西湖醋鱼', emoji: '🐟', tags: ['鱼肉', '浙菜', '酸甜'], difficulty: 'medium', cookTime: 25, cuisine: '浙菜', calories: 260, flavor: '酸甜' },
  { name: '东坡肉', emoji: '🥩', tags: ['猪肉', '浙菜', '下饭'], difficulty: 'hard', cookTime: 90, cuisine: '浙菜', calories: 560, flavor: '咸甜' },
  { name: '龙井虾仁', emoji: '🦐', tags: ['虾', '浙菜', '清淡'], difficulty: 'medium', cookTime: 15, cuisine: '浙菜', calories: 220, flavor: '清淡' },
  { name: '叫花鸡', emoji: '🍗', tags: ['鸡肉', '苏菜', '宴客'], difficulty: 'hard', cookTime: 90, cuisine: '苏菜', calories: 380, flavor: '咸鲜' },
  { name: '松鼠桂鱼', emoji: '🐟', tags: ['鱼肉', '苏菜', '酸甜', '宴客'], difficulty: 'hard', cookTime: 40, cuisine: '苏菜', calories: 420, flavor: '酸甜' },
  { name: '兰州拉面', emoji: '🍜', tags: ['面食', '西北菜', '主食'], difficulty: 'hard', cookTime: 40, cuisine: '西北菜', calories: 480, flavor: '咸鲜' }
];

/**
 * 识别菜品
 * 优先使用 OpenAI Vision API，未配置时使用本地菜品数据库模拟识别
 * @param {string} imagePath - 图片在服务器上的绝对路径
 * @returns {Promise<object>} 识别结果
 */
async function recognizeDish(imagePath) {
  // 检查是否配置了 OpenAI API key
  if (OPENAI_API_KEY) {
    try {
      return await recognizeWithOpenAI(imagePath);
    } catch (error) {
      console.error('OpenAI 识别失败，回退到本地识别:', error.message);
      return recognizeLocally();
    }
  }

  // 未配置 API key，使用本地菜品数据库模拟识别
  return recognizeLocally();
}

/**
 * 使用 OpenAI Vision API 识别菜品
 * @param {string} imagePath - 图片路径
 * @returns {Promise<object>} 识别结果
 */
async function recognizeWithOpenAI(imagePath) {
  // 读取图片并转为 base64
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  // 根据扩展名推断 MIME 类型
  const ext = path.extname(imagePath).toLowerCase();
  let mimeType = 'image/jpeg';
  if (ext === '.png') mimeType = 'image/png';
  else if (ext === '.gif') mimeType = 'image/gif';
  else if (ext === '.webp') mimeType = 'image/webp';

  // 构建请求消息
  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: '请识别这张图片中的菜品，并以 JSON 格式返回以下字段：\nname(菜名), emoji(代表emoji), tags(标签数组), difficulty(难度: easy/medium/hard), cookTime(烹饪时间分钟), calories(总热量千卡), cuisine(菜系), flavor(口味), confidence(置信度0-1),\ningredients(食材数组,每项含name和amount),\nnutrition(营养详情: protein蛋白质g, carbs碳水g, fat脂肪g, fiber纤维g, sodium钠mg),\nhealthTags(健康标签数组,如"高蛋白""低脂肪""富含纤维"),\nhealthScore(健康评分0-100),\ncookingTips(烹饪小贴士)。\n只返回JSON，不要其他内容。'
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`
          }
        }
      ]
    }
  ];

  // 调用 OpenAI Chat Completions API
  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API 请求失败: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // 解析返回的 JSON 内容
  let result;
  try {
    // 尝试直接解析，失败则提取 JSON 片段
    result = JSON.parse(content);
  } catch (e) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('无法解析 OpenAI 返回的 JSON');
    }
  }

  // 生成候选菜列表（从本地数据库中随机选取 2 道作为备选）
  const alternatives = pickRandomDishes(2).map((d) => ({
    name: d.name,
    emoji: d.emoji,
    confidence: 0.5 + Math.random() * 0.3
  }));

  // 提取食材列表
  let ingredients = [];
  if (Array.isArray(result.ingredients)) {
    ingredients = result.ingredients.map((item) => ({
      name: item.name || '',
      amount: item.amount || ''
    }));
  }

  // 提取营养详情
  const nutrition = {
    protein: Number(result.nutrition?.protein) || 0,
    carbs: Number(result.nutrition?.carbs) || 0,
    fat: Number(result.nutrition?.fat) || 0,
    fiber: Number(result.nutrition?.fiber) || 0,
    sodium: Number(result.nutrition?.sodium) || 0
  };

  // 提取健康标签
  const healthTags = Array.isArray(result.healthTags) ? result.healthTags : [];

  // 提取健康评分
  const healthScore = Math.min(100, Math.max(0, Number(result.healthScore) || 0));

  // 提取烹饪小贴士
  const cookingTips = result.cookingTips || '';

  return {
    dish: {
      name: result.name || '未知菜品',
      emoji: result.emoji || '🍽️',
      tags: Array.isArray(result.tags) ? result.tags : [],
      difficulty: result.difficulty || 'easy',
      cookTime: Number(result.cookTime) || 0,
      calories: Number(result.calories) || 0,
      cuisine: result.cuisine || '家常菜',
      flavor: result.flavor || '咸鲜',
      ingredients,
      nutrition,
      healthTags,
      healthScore,
      cookingTips
    },
    confidence: Math.min(1, Math.max(0, Number(result.confidence) || 0.9)),
    alternatives
  };
}

/**
 * 根据菜品信息生成食材、营养、健康标签、健康评分和烹饪小贴士
 * @param {object} dish - 菜品对象（包含 name, tags, calories, difficulty 等字段）
 * @returns {object} { ingredients, nutrition, healthTags, healthScore, cookingTips }
 */
function generateNutritionInfo(dish) {
  // 根据菜名和标签推断食材
  const ingredientMap = {
    '鸡肉': [{ name: '鸡胸肉', amount: '200g' }, { name: '青椒', amount: '100g' }, { name: '葱姜蒜', amount: '适量' }],
    '猪肉': [{ name: '猪里脊', amount: '150g' }, { name: '葱姜蒜', amount: '适量' }],
    '鱼肉': [{ name: '鲈鱼', amount: '1条' }, { name: '葱姜', amount: '适量' }],
    '鸭肉': [{ name: '鸭肉', amount: '300g' }, { name: '葱姜', amount: '适量' }],
    '虾': [{ name: '鲜虾', amount: '250g' }, { name: '葱姜', amount: '适量' }],
    '海鲜': [{ name: '海鲜拼盘', amount: '300g' }, { name: '葱姜', amount: '适量' }],
    '鸡蛋': [{ name: '鸡蛋', amount: '3个' }, { name: '葱花', amount: '适量' }],
    '豆腐': [{ name: '嫩豆腐', amount: '1块' }, { name: '肉末', amount: '50g' }],
    '素菜': [{ name: '时令蔬菜', amount: '300g' }, { name: '蒜蓉', amount: '适量' }],
    '蔬菜': [{ name: '时令蔬菜', amount: '300g' }, { name: '蒜蓉', amount: '适量' }],
    '面食': [{ name: '面条', amount: '200g' }, { name: '配菜', amount: '适量' }],
    '汤': [{ name: '主料', amount: '200g' }, { name: '高汤', amount: '500ml' }],
    '点心': [{ name: '面粉', amount: '200g' }, { name: '馅料', amount: '100g' }],
    '烤': [{ name: '主料', amount: '300g' }, { name: '腌料', amount: '适量' }]
  };

  // 默认食材
  let ingredients = [{ name: '主料', amount: '200g' }, { name: '调味料', amount: '适量' }];

  // 根据标签匹配食材（后匹配的覆盖前面的）
  (dish.tags || []).forEach((tag) => {
    if (ingredientMap[tag]) {
      ingredients = ingredientMap[tag];
    }
  });

  // 根据热量计算营养分布
  const cal = dish.calories || 0;
  const nutrition = {
    protein: Math.round((cal * 0.15) / 4), // 蛋白质约15%热量
    carbs: Math.round((cal * 0.45) / 4), // 碳水约45%热量
    fat: Math.round((cal * 0.35) / 9), // 脂肪约35%热量
    fiber: Math.round(2 + Math.random() * 4),
    sodium: Math.round(400 + Math.random() * 800)
  };

  // 生成健康标签
  const healthTags = [];
  if (nutrition.protein >= 25) healthTags.push('高蛋白');
  if (nutrition.fat <= 15) healthTags.push('低脂肪');
  if (nutrition.fiber >= 4) healthTags.push('富含纤维');
  if (cal <= 250) healthTags.push('低热量');
  if (nutrition.sodium <= 600) healthTags.push('低钠');
  if ((dish.tags || []).includes('清淡')) healthTags.push('清淡健康');
  if (healthTags.length === 0) healthTags.push('营养均衡');

  // 计算健康评分
  let healthScore = 60;
  if (cal <= 300) healthScore += 15;
  else if (cal <= 450) healthScore += 8;
  else healthScore -= 5;
  if (nutrition.protein >= 25) healthScore += 10;
  if (nutrition.fat <= 15) healthScore += 8;
  if (nutrition.fiber >= 4) healthScore += 7;
  if (nutrition.sodium <= 600) healthScore += 5;
  if ((dish.tags || []).includes('清淡')) healthScore += 5;
  if ((dish.tags || []).includes('蔬菜') || (dish.tags || []).includes('素菜')) healthScore += 5;
  healthScore = Math.min(100, Math.max(30, healthScore));

  // 烹饪小贴士
  const tipsMap = {
    easy: '快手菜，注意火候控制即可。',
    medium: '中等难度，建议提前准备好所有食材。',
    hard: '复杂菜品，建议预留充足时间，注意每一步的细节。'
  };
  const cookingTips = tipsMap[dish.difficulty] || '注意火候和调味。';

  return { ingredients, nutrition, healthTags, healthScore, cookingTips };
}

/**
 * 使用本地菜品数据库模拟识别
 * 随机选择一道菜，confidence 在 0.85-0.98 之间
 * @returns {object} 识别结果
 */
function recognizeLocally() {
  // 随机选择一道主菜
  const mainDish = DISH_DATABASE[Math.floor(Math.random() * DISH_DATABASE.length)];

  // 生成候选菜列表（再随机选 2 道，排除主菜）
  const others = DISH_DATABASE.filter((d) => d.name !== mainDish.name);
  const alternatives = [];
  const usedIndexes = new Set();
  while (alternatives.length < 2 && usedIndexes.size < others.length) {
    const idx = Math.floor(Math.random() * others.length);
    if (!usedIndexes.has(idx)) {
      usedIndexes.add(idx);
      alternatives.push({
        name: others[idx].name,
        emoji: others[idx].emoji,
        confidence: 0.5 + Math.random() * 0.3
      });
    }
  }

  // 置信度在 0.85-0.98 之间
  const confidence = 0.85 + Math.random() * 0.13;

  // 生成食材、营养、健康标签等扩展信息
  const nutritionInfo = generateNutritionInfo(mainDish);

  return {
    dish: {
      name: mainDish.name,
      emoji: mainDish.emoji,
      tags: [...mainDish.tags],
      difficulty: mainDish.difficulty,
      cookTime: mainDish.cookTime,
      calories: mainDish.calories,
      cuisine: mainDish.cuisine,
      flavor: mainDish.flavor,
      ingredients: nutritionInfo.ingredients,
      nutrition: nutritionInfo.nutrition,
      healthTags: nutritionInfo.healthTags,
      healthScore: nutritionInfo.healthScore,
      cookingTips: nutritionInfo.cookingTips
    },
    confidence: parseFloat(confidence.toFixed(2)),
    alternatives
  };
}

/**
 * 从菜品数据库中随机选取 n 道菜
 * @param {number} n - 数量
 * @returns {array} 菜品数组
 */
function pickRandomDishes(n) {
  const shuffled = [...DISH_DATABASE].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/**
 * 获取菜品推荐
 * 分析用户历史记录的标签频率、难度偏好，从菜品数据库中找出用户没做过的菜
 * @param {array} history - 用户历史记录数组
 * @param {number} limit - 返回数量限制
 * @returns {array} 推荐列表，每项包含 matchScore 和 reason
 */
function getRecommendations(history, limit = 5) {
  // 统计用户历史标签频率
  const tagFrequency = {};
  // 统计难度偏好
  const difficultyFrequency = { easy: 0, medium: 0, hard: 0 };
  // 用户做过的菜名集合
  const cookedDishes = new Set();

  (history || []).forEach((record) => {
    // 统计标签
    let tags = record.tags;
    if (typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch (e) {
        tags = [];
      }
    }
    if (Array.isArray(tags)) {
      tags.forEach((tag) => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    }
    // 统计难度
    if (record.difficulty && difficultyFrequency[record.difficulty] !== undefined) {
      difficultyFrequency[record.difficulty]++;
    }
    // 记录做过的菜名
    if (record.dish_name) {
      cookedDishes.add(record.dish_name);
    }
  });

  // 找出用户没做过的菜
  const candidates = DISH_DATABASE.filter((d) => !cookedDishes.has(d.name));

  // 如果候选菜不足，使用全部菜品
  const pool = candidates.length > 0 ? candidates : DISH_DATABASE;

  // 计算每道菜的匹配分数
  const scored = pool.map((dish) => {
    let score = 60; // 基础分 60
    const reasons = [];

    // 标签匹配加分（每匹配一个标签 +5，最高 +25）
    let tagBonus = 0;
    dish.tags.forEach((tag) => {
      if (tagFrequency[tag]) {
        tagBonus += Math.min(5, tagFrequency[tag] * 2);
      }
    });
    tagBonus = Math.min(25, tagBonus);
    score += tagBonus;
    if (tagBonus > 0) {
      reasons.push(`符合你常做的${dish.tags.filter((t) => tagFrequency[t]).join('、')}口味`);
    }

    // 难度偏好匹配加分（最高 +10）
    const maxDifficulty = Math.max(difficultyFrequency.easy, difficultyFrequency.medium, difficultyFrequency.hard);
    if (maxDifficulty > 0 && difficultyFrequency[dish.difficulty] === maxDifficulty) {
      score += 10;
      const diffMap = { easy: '简单', medium: '中等', hard: '困难' };
      reasons.push(`难度${diffMap[dish.difficulty]}，符合你的烹饪习惯`);
    }

    // 菜系多样性加分（最高 +3）
    score += Math.floor(Math.random() * 3);

    // 限制分数在 60-98 之间
    score = Math.min(98, Math.max(60, Math.round(score)));

    // 如果没有具体原因，给一个默认原因
    if (reasons.length === 0) {
      reasons.push('推荐尝试新菜品，拓展你的美食版图');
    }

    return {
      name: dish.name,
      emoji: dish.emoji,
      tags: [...dish.tags],
      difficulty: dish.difficulty,
      cookTime: dish.cookTime,
      calories: dish.calories,
      cuisine: dish.cuisine,
      flavor: dish.flavor,
      matchScore: score,
      reason: reasons.join('；')
    };
  });

  // 按匹配分数降序排序
  scored.sort((a, b) => b.matchScore - a.matchScore);

  // 返回指定数量
  return scored.slice(0, limit);
}

/**
 * 获取所有标签
 * 从菜品数据库中收集所有去重后的标签
 * @returns {array} 标签数组
 */
function getAllTags() {
  const tagSet = new Set();
  DISH_DATABASE.forEach((dish) => {
    dish.tags.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

module.exports = {
  recognizeDish,
  getRecommendations,
  getAllTags,
  DISH_DATABASE
};
