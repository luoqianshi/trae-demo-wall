/**
 * 食光机 - AI 引擎
 * 包含菜品数据库、模拟AI识别、智能推荐算法
 */
const AIEngine = (function () {

  // 菜品数据库 - 用于模拟AI识别和推荐
  const DISH_DATABASE = [
    { name: '番茄炒蛋', emoji: '🍳', tags: ['家常菜', '快手菜', '鸡蛋'], difficulty: 'easy', cookTime: 10, cuisine: '中餐', calories: 200, flavor: '咸鲜' },
    { name: '红烧肉', emoji: '🥩', tags: ['家常菜', '硬菜', '猪肉'], difficulty: 'hard', cookTime: 90, cuisine: '中餐', calories: 450, flavor: '甜咸' },
    { name: '清蒸鲈鱼', emoji: '🐟', tags: ['清淡', '海鲜', '健康'], difficulty: 'medium', cookTime: 20, cuisine: '中餐', calories: 180, flavor: '清淡' },
    { name: '宫保鸡丁', emoji: '🥘', tags: ['川菜', '家常菜', '鸡肉'], difficulty: 'medium', cookTime: 25, cuisine: '川菜', calories: 320, flavor: '麻辣' },
    { name: '麻婆豆腐', emoji: '🥡', tags: ['川菜', '家常菜', '豆腐'], difficulty: 'easy', cookTime: 15, cuisine: '川菜', calories: 250, flavor: '麻辣' },
    { name: '蒜蓉西兰花', emoji: '🥦', tags: ['健康', '快手菜', '蔬菜'], difficulty: 'easy', cookTime: 10, cuisine: '中餐', calories: 80, flavor: '清淡' },
    { name: '红烧排骨', emoji: '🍖', tags: ['家常菜', '硬菜', '猪肉'], difficulty: 'hard', cookTime: 80, cuisine: '中餐', calories: 400, flavor: '甜咸' },
    { name: '番茄牛腩煲', emoji: '🍲', tags: ['家常菜', '炖菜', '牛肉'], difficulty: 'medium', cookTime: 120, cuisine: '中餐', calories: 350, flavor: '酸甜' },
    { name: '蛋炒饭', emoji: '🍚', tags: ['快手菜', '主食', '鸡蛋'], difficulty: 'easy', cookTime: 10, cuisine: '中餐', calories: 280, flavor: '咸鲜' },
    { name: '酸辣土豆丝', emoji: '🥔', tags: ['家常菜', '快手菜', '蔬菜'], difficulty: 'easy', cookTime: 15, cuisine: '中餐', calories: 150, flavor: '酸辣' },
    { name: '油焖大虾', emoji: '🍤', tags: ['海鲜', '硬菜', '宴客'], difficulty: 'medium', cookTime: 25, cuisine: '中餐', calories: 220, flavor: '咸鲜' },
    { name: '凯撒沙拉', emoji: '🥗', tags: ['健康', '西餐', '轻食'], difficulty: 'easy', cookTime: 10, cuisine: '西餐', calories: 120, flavor: '清淡' },
    { name: '牛肉面', emoji: '🍜', tags: ['主食', '面食', '牛肉'], difficulty: 'medium', cookTime: 60, cuisine: '中餐', calories: 380, flavor: '咸鲜' },
    { name: '饺子', emoji: '🥟', tags: ['主食', '面食', '家常菜'], difficulty: 'hard', cookTime: 90, cuisine: '中餐', calories: 300, flavor: '咸鲜' },
    { name: '糖醋里脊', emoji: '🍖', tags: ['家常菜', '硬菜', '猪肉'], difficulty: 'medium', cookTime: 30, cuisine: '中餐', calories: 380, flavor: '酸甜' },
    { name: '鱼香肉丝', emoji: '🥘', tags: ['川菜', '家常菜', '猪肉'], difficulty: 'medium', cookTime: 20, cuisine: '川菜', calories: 280, flavor: '酸甜辣' },
    { name: '蒸蛋羹', emoji: '🍳', tags: ['家常菜', '快手菜', '鸡蛋'], difficulty: 'easy', cookTime: 15, cuisine: '中餐', calories: 120, flavor: '清淡' },
    { name: '可乐鸡翅', emoji: '🍗', tags: ['家常菜', '鸡肉', '快手菜'], difficulty: 'easy', cookTime: 30, cuisine: '中餐', calories: 320, flavor: '甜咸' },
    { name: '麻辣香锅', emoji: '🍲', tags: ['川菜', '硬菜', '麻辣'], difficulty: 'medium', cookTime: 35, cuisine: '川菜', calories: 500, flavor: '麻辣' },
    { name: '寿司', emoji: '🍣', tags: ['日料', '主食', '轻食'], difficulty: 'medium', cookTime: 40, cuisine: '日料', calories: 200, flavor: '清淡' },
    { name: '意大利面', emoji: '🍝', tags: ['西餐', '主食', '面食'], difficulty: 'easy', cookTime: 25, cuisine: '西餐', calories: 350, flavor: '咸鲜' },
    { name: '小笼包', emoji: '🥟', tags: ['面食', '早餐', '家常菜'], difficulty: 'hard', cookTime: 120, cuisine: '中餐', calories: 250, flavor: '咸鲜' },
    { name: '皮蛋瘦肉粥', emoji: '🍚', tags: ['早餐', '粥品', '家常菜'], difficulty: 'easy', cookTime: 45, cuisine: '中餐', calories: 180, flavor: '咸鲜' },
    { name: '回锅肉', emoji: '🥩', tags: ['川菜', '家常菜', '猪肉'], difficulty: 'medium', cookTime: 25, cuisine: '川菜', calories: 400, flavor: '香辣' },
    { name: '凉拌黄瓜', emoji: '🥒', tags: ['快手菜', '凉菜', '蔬菜'], difficulty: 'easy', cookTime: 5, cuisine: '中餐', calories: 50, flavor: '酸辣' },
    { name: '葱油拌面', emoji: '🍜', tags: ['主食', '面食', '快手菜'], difficulty: 'easy', cookTime: 15, cuisine: '中餐', calories: 300, flavor: '咸鲜' },
    { name: '烤鸡翅', emoji: '🍗', tags: ['家常菜', '鸡肉', '烤箱菜'], difficulty: 'easy', cookTime: 40, cuisine: '中餐', calories: 280, flavor: '咸香' },
    { name: '丝瓜蛋汤', emoji: '🍵', tags: ['汤品', '家常菜', '快手菜'], difficulty: 'easy', cookTime: 15, cuisine: '中餐', calories: 80, flavor: '清淡' },
    { name: '咖喱鸡饭', emoji: '🍛', tags: ['西餐', '主食', '鸡肉'], difficulty: 'medium', cookTime: 35, cuisine: '东南亚', calories: 420, flavor: '咖喱' },
    { name: '手抓饼', emoji: '🫓', tags: ['早餐', '面食', '快手菜'], difficulty: 'easy', cookTime: 10, cuisine: '中餐', calories: 260, flavor: '咸香' }
  ];

  // 所有可用标签
  const ALL_TAGS = ['家常菜', '快手菜', '健康', '硬菜', '川菜', '西餐', '日料', '海鲜', '蔬菜', '牛肉', '猪肉', '鸡肉', '鸡蛋', '豆腐', '面食', '主食', '炖菜', '凉菜', '汤品', '早餐', '轻食', '宴客', '麻辣', '清淡', '甜咸', '酸甜', '烤箱菜', '东南亚'];

  /**
   * 模拟AI菜品识别
   * @param {string} imageData - 图片base64数据（当前版本不实际分析图片）
   * @param {Function} onProgress - 进度回调
   * @returns {Promise<Object>} 识别结果
   */
  function recognizeDish(imageData, onProgress) {
    return new Promise((resolve) => {
      const steps = [
        '正在分析图像特征...',
        '识别食材成分...',
        '匹配菜品数据库...',
        '生成识别结果...'
      ];

      let stepIndex = 0;

      const interval = setInterval(() => {
        if (onProgress) onProgress(steps[stepIndex]);
        stepIndex++;

        if (stepIndex >= steps.length) {
          clearInterval(interval);

          // 模拟识别：从数据库中随机选择一道菜
          const dish = DISH_DATABASE[Math.floor(Math.random() * DISH_DATABASE.length)];
          const confidence = 0.85 + Math.random() * 0.13; // 85%-98%

          resolve({
            success: true,
            dish: { ...dish },
            confidence: confidence,
            alternatives: getRandomAlternatives(dish, 2)
          });
        }
      }, 600);
    });
  }

  /**
   * 获取随机备选菜品
   */
  function getRandomAlternatives(excludeDish, count) {
    const others = DISH_DATABASE.filter(d => d.name !== excludeDish.name);
    const alternatives = [];
    for (let i = 0; i < count && others.length > 0; i++) {
      const idx = Math.floor(Math.random() * others.length);
      alternatives.push(others[idx]);
      others.splice(idx, 1);
    }
    return alternatives;
  }

  /**
   * 智能推荐算法
   * 基于用户烹饪历史分析口味偏好，推荐最匹配的菜品
   * @param {Array} history - 用户历史记录
   * @param {number} limit - 推荐数量
   * @returns {Array} 推荐列表
   */
  function getRecommendations(history, limit) {
    limit = limit || 5;

    if (!history || history.length === 0) {
      // 无历史数据时返回热门推荐
      return DISH_DATABASE
        .slice()
        .sort(() => Math.random() - 0.5)
        .slice(0, limit)
        .map(d => ({ ...d, matchScore: 70 + Math.floor(Math.random() * 15), reason: '热门推荐' }));
    }

    // 分析用户偏好
    const tagFrequency = {};
    const cuisineFrequency = {};
    const flavorFrequency = {};
    const difficultyPreference = { easy: 0, medium: 0, hard: 0 };
    const cookedNames = new Set(history.map(r => r.dishName));

    history.forEach(record => {
      if (record.tags) {
        record.tags.forEach(tag => {
          tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        });
      }
      if (record.difficulty && difficultyPreference[record.difficulty] !== undefined) {
        difficultyPreference[record.difficulty]++;
      }
    });

    // 从数据库中找出用户没做过的菜
    const candidates = DISH_DATABASE.filter(d => !cookedNames.has(d.name));

    // 计算每道菜的匹配分数
    const scored = candidates.map(dish => {
      let score = 50; // 基础分
      let reasons = [];

      // 标签匹配
      let tagMatches = 0;
      if (dish.tags) {
        dish.tags.forEach(tag => {
          if (tagFrequency[tag]) {
            score += tagFrequency[tag] * 8;
            tagMatches++;
          }
        });
      }
      if (tagMatches > 0) {
        reasons.push(`符合你常做的"${dish.tags.find(t => tagFrequency[t])}"风格`);
      }

      // 难度匹配 - 推荐与用户水平相近或略高的难度
      const totalCooked = history.length;
      if (totalCooked > 0) {
        const easyRatio = difficultyPreference.easy / totalCooked;
        const mediumRatio = difficultyPreference.medium / totalCooked;
        const hardRatio = difficultyPreference.hard / totalCooked;

        if (dish.difficulty === 'easy' && easyRatio > 0.4) {
          score += 10;
        } else if (dish.difficulty === 'medium' && mediumRatio > 0.3) {
          score += 12;
        } else if (dish.difficulty === 'hard' && hardRatio > 0.2) {
          score += 15;
          reasons.push('挑战进阶难度');
        } else if (dish.difficulty === 'medium' && easyRatio > 0.5) {
          score += 8;
          reasons.push('适合你当前的水平进阶');
        }
      }

      // 多样性奖励 - 鼓励尝试新菜系
      const userCuisines = new Set();
      history.forEach(r => {
        if (r.tags) {
          r.tags.forEach(t => {
            if (['川菜', '西餐', '日料', '东南亚'].includes(t)) userCuisines.add(t);
          });
        }
      });
      if (!userCuisines.has(dish.cuisine) && dish.cuisine !== '中餐') {
        score += 8;
        reasons.push(`尝试新的${dish.cuisine}风味`);
      }

      // 健康偏好
      if (tagFrequency['健康'] && dish.calories < 200) {
        score += 10;
        reasons.push('符合你的健康饮食偏好');
      }

      // 快手菜偏好
      if (tagFrequency['快手菜'] && dish.cookTime <= 15) {
        score += 8;
        reasons.push('快手菜，省时省力');
      }

      // 限制分数范围
      score = Math.min(98, Math.max(60, score));

      return {
        ...dish,
        matchScore: Math.round(score),
        reason: reasons.length > 0 ? reasons[0] : '值得一试'
      };
    });

    // 按匹配分数排序
    scored.sort((a, b) => b.matchScore - a.matchScore);

    return scored.slice(0, limit);
  }

  /**
   * 获取所有标签
   */
  function getAllTags() {
    return ALL_TAGS;
  }

  /**
   * 获取菜品数据库
   */
  function getDishDatabase() {
    return DISH_DATABASE;
  }

  /**
   * 根据名称搜索菜品
   */
  function searchDishes(keyword) {
    if (!keyword) return DISH_DATABASE;
    const kw = keyword.toLowerCase();
    return DISH_DATABASE.filter(d =>
      d.name.toLowerCase().includes(kw) ||
      d.tags.some(t => t.toLowerCase().includes(kw))
    );
  }

  return {
    recognizeDish,
    getRecommendations,
    getAllTags,
    getDishDatabase,
    searchDishes
  };
})();
