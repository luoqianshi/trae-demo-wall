// ============ 推荐算法 ============
// ============ 优化推荐算法 ============

// 能力映射表
const abilityMap = {
  '语言表达': 'language',
  '自然认知': 'science',
  '情绪认知': 'emotion',
  '社交能力': 'social',
  '科学思维': 'science',
  '艺术美育': 'art'
};

function getRecommendedBooks(categoryId, limit = 4) {
  const profile = Storage.get('childProfile', {});
  const persona = Storage.get('userPersona', {});
  const records = Storage.get('readingRecords', []);
  const userInterests = profile.interests || [];
  const childAge = profile.ageRange || '3-4';

  let filteredBooks = [...bookDatabase];

  // ========== 分类筛选 ==========
  const categoryFilters = {
    'cognition': (b) => b.tags.includes('认知启蒙'),
    'interactive': (b) => b.tags.some(t => ['翻翻书', '立体书', '洞洞书', '触摸书', '声音书', '互动书', '互动'].includes(t)),
    'emotion': (b) => b.tags.includes('情绪成长'),
    'habit': (b) => b.tags.includes('行为习惯'),
    'family': (b) => b.tags.includes('亲情家庭'),
    'school': (b) => b.tags.includes('入园校园'),
    'life': (b) => b.tags.includes('生命与爱'),
    'science': (b) => b.tags.includes('科普百科'),
    'traditional': (b) => b.tags.includes('国学传统'),
    'literature': (b) => b.tags.includes('语言文学'),
    'logic': (b) => b.tags.includes('益智思维'),
    'art': (b) => b.tags.includes('艺术美育'),
    'bridge': (b) => b.tags.includes('幼小衔接')
  };

  if (categoryFilters[categoryId]) {
    filteredBooks = filteredBooks.filter(categoryFilters[categoryId]);
  }

  // ========== 1. 协同过滤 - 计算书籍相似度 ==========
  const readBooks = records.map(r => r.bookTitle);
  const readBookIds = new Set(records.map(r => {
    const book = bookDatabase.find(b => b.title === r.bookTitle);
    return book ? book.id : -1;
  }));

  // 构建已读书籍的特征向量
  const readCategories = {};
  const readAbilities = { language: 0, science: 0, art: 0, social: 0, emotion: 0 };
  
  records.forEach(r => {
    const book = bookDatabase.find(b => b.title === r.bookTitle);
    if (book) {
      book.tags.forEach(tag => {
        readCategories[tag] = (readCategories[tag] || 0) + 1;
      });
      Object.entries(book.abilities).forEach(([key, val]) => {
        readAbilities[key] = (readAbilities[key] || 0) + val;
      });
    }
  });

  // 计算每本书与已读历史的相似度
  function calculateSimilarity(book) {
    let similarity = 0;
    
    // 标签相似度
    book.tags.forEach(tag => {
      if (readCategories[tag]) {
        similarity += readCategories[tag] * 2;
      }
    });
    
    // 能力向量相似度
    Object.entries(book.abilities).forEach(([key, val]) => {
      if (readAbilities[key] > 0) {
        similarity += val * readAbilities[key] / 10;
      }
    });
    
    return similarity;
  }

  // ========== 2. 新鲜度因子 ==========
  // 统计已读分类和作者
  const readCategorySet = new Set();
  const readAuthorSet = new Set();
  records.forEach(r => {
    const book = bookDatabase.find(b => b.title === r.bookTitle);
    if (book) {
      book.tags.forEach(t => readCategorySet.add(t));
      readAuthorSet.add(book.author);
    }
  });

  // ========== 3. 能力短板加权 ==========
  const weakAbilities = persona.weakAbilities || [];

  // ========== 计算综合推荐分数 ==========
  const scoredBooks = filteredBooks.map(book => {
    let score = 0;
    const factors = [];

    // ---------- A. 协同过滤分数 (满分 30) ----------
    const similarity = calculateSimilarity(book);
    // 如果是相似书籍，给予高分
    if (similarity > 0 && !readBookIds.has(book.id)) {
      score += Math.min(similarity, 30);
      factors.push({ name: '同类推荐', score: Math.min(similarity, 30) });
    }

    // ---------- B. 能力短板强化 (满分 25) ----------
    let abilityBoost = 0;
    weakAbilities.forEach(weak => {
      const key = abilityMap[weak];
      if (key && book.abilities[key]) {
        // 能力值越高，权重越高
        abilityBoost += book.abilities[key] * 5;
      }
    });
    abilityBoost = Math.min(abilityBoost, 25);
    if (abilityBoost > 0) {
      score += abilityBoost;
      factors.push({ name: '能力补强', score: abilityBoost });
    }

    // ---------- C. 新鲜度因子 (满分 20) ----------
    let freshnessBonus = 0;
    
    // 新分类书籍加分
    const isNewCategory = book.tags.some(t => !readCategorySet.has(t));
    if (isNewCategory && !readBookIds.has(book.id)) {
      freshnessBonus += 10;
    }
    
    // 新作者加分
    if (!readAuthorSet.has(book.author) && !readBookIds.has(book.id)) {
      freshnessBonus += 5;
    }
    
    // 完全未读的书加分
    if (!readBookIds.has(book.id)) {
      freshnessBonus += 5;
    }
    
    score += freshnessBonus;
    if (freshnessBonus > 0) {
      factors.push({ name: '探索新领域', score: freshnessBonus });
    }

    // ---------- D. 兴趣匹配 (满分 15) ----------
    let interestScore = 0;
    book.tags.forEach(tag => {
      if (userInterests.includes(tag)) {
        interestScore += 5;
      }
    });
    // 画像兴趣匹配
    Object.entries(persona.interestProfile || {}).forEach(([interest, count]) => {
      if (book.tags.some(t => t.includes(interest) || interest.includes(t))) {
        interestScore += Math.min(count, 3);
      }
    });
    interestScore = Math.min(interestScore, 15);
    score += interestScore;
    if (interestScore > 0) {
      factors.push({ name: '兴趣匹配', score: interestScore });
    }

    // ---------- E. 适龄匹配 (满分 10) ----------
    const bookAges = book.ageRange.split('-').map(Number);
    const childAges = childAge.split('-').map(Number);
    const ageOverlap = Math.min(bookAges[1], childAges[1]) - Math.max(bookAges[0], childAges[0]);
    let ageScore = 0;
    if (ageOverlap >= 1) {
      ageScore = 10;
    } else if (ageOverlap >= 0) {
      ageScore = 7;
    } else if (bookAges[0] <= childAges[0]) {
      ageScore = 5;
    }
    score += ageScore;
    if (ageScore > 0) {
      factors.push({ name: '适龄', score: ageScore });
    }

    // ---------- F. 书籍质量因子 (满分 5) ----------
    // 高能力值的书略加分
    const avgAbility = Object.values(book.abilities).reduce((a, b) => a + b, 0) / 5;
    score += Math.round(avgAbility);

    // 生成个性化推荐理由
    const reason = generateRecommendationReason(book, profile, persona, factors);

    return { ...book, score, recommendationReason: reason };
  });

  // 按分数降序排列
  scoredBooks.sort((a, b) => b.score - a.score);

  // 如果是"今日推荐"，加入多样性
  if (categoryId === 'today') {
    // 取前几名，然后打散增加多样性
    const topCount = Math.min(3, scoredBooks.length);
    const top = scoredBooks.slice(0, topCount);
    const rest = scoredBooks.slice(topCount);
    
    // 打散顺序
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    
    return [...top, ...rest].slice(0, limit);
  }

  return scoredBooks.slice(0, limit);
}

// 优化的推荐理由生成
function generateRecommendationReason(book, profile, persona, factors) {
  const nickname = profile.nickname || '宝贝';
  const reasons = [];

  // 根据加分因素生成理由
  const factorNames = factors.map(f => f.name);
  
  if (factorNames.includes('能力补强')) {
    const weak = persona.weakAbilities?.[0] || '综合';
    reasons.push(`针对性地提升${weak}能力`);
  }
  
  if (factorNames.includes('探索新领域')) {
    reasons.push(`发现不同主题的精彩世界`);
  }
  
  if (factorNames.includes('同类推荐')) {
    reasons.push(`延续宝贝喜欢的故事风格`);
  }
  
  if (factorNames.includes('兴趣匹配')) {
    reasons.push(`符合宝贝的兴趣偏好`);
  }
  
  if (factorNames.includes('适龄')) {
    reasons.push(`适合${book.ageRange}岁阅读`);
  }

  // 确保至少有2个理由
  if (reasons.length < 2) {
    if (book.abilities.language >= 5) {
      reasons.push(`优美的语言滋养`);
    }
    if (book.abilities.science >= 4) {
      reasons.push(`有趣的科学启蒙`);
    }
  }

  return reasons.slice(0, 2).join('；') + '。';
}

// ============ 旧的推荐理由生成函数保留兼容 ============
function generateRecommendationReasonOld(book, profile, persona) {
  const reasons = [];
  const nickname = profile.nickname || '宝贝';

  if (profile.interests && profile.interests.some(i => book.tags.some(t => t.includes(i) || i.includes(t)))) {
    reasons.push(`因为${nickname}喜欢${profile.interests[0]}，这本${book.tags[0]}主题的绘本一定会让宝贝着迷`);
  }

  if (persona.weakAbilities && persona.weakAbilities.some(w => {
    const map = { '语言表达': 'language', '自然认知': 'science', '情绪认知': 'emotion', '社交能力': 'social' };
    return book.abilities[map[w]] >= 4;
  })) {
    reasons.push(`能够帮助提升${persona.weakAbilities[0]}能力，是很好的启蒙读物`);
  }

  reasons.push(`适合${book.ageRange}岁的孩子，图文比例恰到好处`);

  if (book.abilities.language >= 5) {
    reasons.push(`语言优美，能够丰富${nickname}的词汇量`);
  }

  return reasons.slice(0, 2).join('；') + '。';
}
