// ============ 数据存储模块 ============
const Storage = {
  get(key, defaultValue) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // 保存阅读记录时，自动清除 AI 分析缓存
      if (key === 'readingRecords') {
        invalidateAIAnalysisCache();
      }
      return true;
    } catch (e) {
      return false;
    }
  }
};

// 日期格式化
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 重置演示数据
function resetDemoData() {
  if (!confirm('确定要重置演示数据吗？所有记录将恢复为初始状态。')) {
    return;
  }
  
  // 清除所有用户数据
  localStorage.removeItem('childProfile');
  localStorage.removeItem('readingRecords');
  localStorage.removeItem('userPersona');
  localStorage.removeItem('userPoints');
  localStorage.removeItem('userBadges');
  localStorage.removeItem('welcomeShown');
  localStorage.removeItem('readingGoal');
  localStorage.removeItem('weeklyChallenge');
  localStorage.removeItem('challengeRewardClaimed');
  localStorage.removeItem('demoFirstOpen');
  
  // 重新初始化
  initSampleData();
  initPointsAndBadges();
  updateUserPersona();
  
  showToast('演示数据已重置');
  
  // 刷新页面
  setTimeout(() => {
    location.reload();
  }, 800);
}

// 初始化示例数据
function initSampleData() {
  const today = new Date();
  
  if (!Storage.get('childProfile')) {
    Storage.set('childProfile', {
      nickname: '小橙子',
      ageRange: '4-5',
      gender: 'boy',
      interests: ['恐龙', '动物', '自然'],
      avatar: '🧒',
      createdAt: formatDate(today)
    });
  }

  // 预置 Kimi API Key（演示用）
  if (!localStorage.getItem('kimi_api_key')) {
    localStorage.setItem('kimi_api_key', 'YOUR_API_KEY_HERE');
  }

  if (!Storage.get('readingRecords')) {
    // 记录首次打开时间
    Storage.set('demoFirstOpen', formatDate(today));
    const records = generateSampleRecords();
    Storage.set('readingRecords', records);
  }

  if (!Storage.get('userPersona')) {
    updateUserPersona();
  }
}

// 生成示例阅读记录（动态日期，基于首次打开时间）
function generateSampleRecords() {
  const records = [];
  const today = new Date();
  
  // 真实借阅记录模板（20条高质量记录）
  const bookRecords = [
    { duration: 25, rating: 5, emotion: ['主动提问', '兴奋', '专注投入'], ability: ['观察力', '好奇心'], highlight: '孩子被故事深深吸引了，全程很安静地听，生怕错过什么。好的表现：阅读理解能力在提升，能跟上故事节奏。互动片段：读完后孩子问了好几个为什么，我们一起查资料找答案。' },
    { duration: 18, rating: 5, emotion: ['好奇', '开心', '意犹未尽'], ability: ['想象力', '词汇积累'], highlight: '今天读这本书，用时约18分钟。好的表现：能回答出故事的主要内容和人物。困难：有些深层含义还不太理解。互动片段：边读边讨论，孩子说自己也想经历这样的冒险。' },
    { duration: 30, rating: 4, emotion: ['有兴趣', '认真听'], ability: ['记忆力', '阅读理解', '词汇积累'], highlight: '这本书很有教育意义，孩子从中学到了很多道理。好的表现：能联系到自己的生活实际。互动片段：我们讨论以后遇到类似情况怎么办，孩子说得很有道理。' },
    { duration: 22, rating: 4, emotion: ['主动提问', '兴奋'], ability: ['科学思维', '探索精神'], highlight: '孩子主动要求读第二遍，说太好看了。好的表现：对阅读越来越有兴趣了，会主动要书看。互动片段：我们一起猜接下来会发生什么，孩子猜对了好几个地方。' },
    { duration: 15, rating: 4, emotion: ['有兴趣'], ability: ['语言表达', '记忆力', '阅读理解'], highlight: '内容很有趣，孩子听完还想再读一遍，意犹未尽。好的表现：主动提问，好奇心很强。互动片段：我们角色扮演书里的角色，玩得特别开心。' },
    { duration: 28, rating: 5, emotion: ['开心', '好奇', '兴奋'], ability: ['感知觉', '观察力', '动手能力'], highlight: '孩子主动要求读第二遍，说太好看了。好的表现：对阅读越来越有兴趣了，会主动要书看。互动片段：我们一起猜接下来会发生什么，孩子猜对了好几个地方。' },
    { duration: 20, rating: 4, emotion: ['偶尔提问', '认真听'], ability: ['记忆力', '词汇积累'], highlight: '读的时候，孩子特别投入，眼睛都不眨一下，听得很入迷。好的表现：专注力有进步，能坐得住了。互动片段：读完后孩子给我复述了一遍故事，虽然不太完整但很认真。' },
    { duration: 35, rating: 4, emotion: ['开心', '认真听'], ability: ['阅读理解', '语言表达', '词汇积累'], highlight: '孩子被故事深深吸引了，全程很安静地听，生怕错过什么。好的表现：阅读理解能力在提升，能跟上故事节奏。互动片段：读完后孩子问了好几个为什么，我们一起查资料找答案。' },
    { duration: 12, rating: 5, emotion: ['意犹未尽', '专注投入'], ability: ['想象力', '语言表达', '阅读理解'], highlight: '孩子说这本书很好看，最喜欢书里的主角，说要向他学习。好的表现：能说出自己喜欢的原因和理由。互动片段：我们讨论如果是自己会怎么做，孩子说了很多有意思的想法。' },
    { duration: 24, rating: 4, emotion: ['有兴趣'], ability: ['情绪认知', '同理心'], highlight: '这本书的故事很感人，孩子听完若有所思，好像被触动了。好的表现：能感受到故事里的情感。互动片段：我们讨论了什么是友情/亲情/勇气，孩子说得头头是道。' },
    { duration: 32, rating: 5, emotion: ['好奇', '专注投入'], ability: ['好奇心', '探索精神', '观察力'], highlight: '孩子主动要求读第二遍，说太好看了。好的表现：对阅读越来越有兴趣了，会主动要书看。互动片段：我们一起猜接下来会发生什么，孩子猜对了好几个地方。' },
    { duration: 19, rating: 4, emotion: ['意犹未尽', '兴奋'], ability: ['阅读理解', '想象力'], highlight: '故事很感人，孩子听完若有所思，好像被触动了。好的表现：能感受到故事里的情感。互动片段：我们讨论了什么是友情/亲情/勇气，孩子说得头头是道。' },
    { duration: 27, rating: 4, emotion: ['开心'], ability: ['好奇心', '探索精神'], highlight: '内容很有趣，孩子听完还想再读一遍，意犹未尽。好的表现：主动提问，好奇心很强。互动片段：我们角色扮演书里的角色，玩得特别开心。' },
    { duration: 14, rating: 3, emotion: ['需要引导'], ability: ['词汇积累', '记忆力'], highlight: '读了这本书，用时约14分钟。好的表现：能回答出故事的主要内容和人物。困难：有些深层含义还不太理解。互动片段：边读边讨论，孩子说自己也想经历这样的冒险。' },
    { duration: 33, rating: 5, emotion: ['专注投入', '主动提问', '兴奋'], ability: ['词汇积累', '阅读理解', '记忆力'], highlight: '内容很有趣，孩子听完还想再读一遍，意犹未尽。好的表现：主动提问，好奇心很强。互动片段：我们角色扮演书里的角色，玩得特别开心。' },
    { duration: 21, rating: 4, emotion: ['比较喜欢'], ability: ['词汇积累', '记忆力', '想象力'], highlight: '读的时候，孩子特别投入，眼睛都不眨一下，听得很入迷。好的表现：专注力有进步，能坐得住了。互动片段：读完后孩子给我复述了一遍故事，虽然不太完整但很认真。' },
    { duration: 16, rating: 5, emotion: ['意犹未尽', '主动提问'], ability: ['好奇心', '自然认知', '观察力'], highlight: '孩子被故事深深吸引了，全程很安静地听，生怕错过什么。好的表现：阅读理解能力在提升，能跟上故事节奏。互动片段：读完后孩子问了好几个为什么，我们一起查资料找答案。' },
    { duration: 29, rating: 5, emotion: ['主动要求再读', '专注投入', '很喜欢'], ability: ['专注力', '空间想象'], highlight: '孩子被故事深深吸引了，全程很安静地听，生怕错过什么。好的表现：阅读理解能力在提升，能跟上故事节奏。互动片段：读完后孩子问了好几个为什么，我们一起查资料找答案。' },
    { duration: 23, rating: 4, emotion: ['认真听', '比较喜欢'], ability: ['阅读理解', '词汇积累'], highlight: '读了用时约23分钟。好的表现：能回答出故事的主要内容和人物。困难：有些深层含义还不太理解。互动片段：边读边讨论，孩子说自己也想经历这样的冒险。' },
    { duration: 31, rating: 4, emotion: ['有兴趣', '开心'], ability: ['语言表达', '阅读理解', '记忆力'], highlight: '内容很有趣，孩子听完还想再读一遍，意犹未尽。好的表现：主动提问，好奇心很强。互动片段：我们角色扮演书里的角色，玩得特别开心。' },
  ];

  // 匹配的绘本标题
  const bookTitles = [
    '好饿的毛毛虫', '棕色的熊，你在看什么', '点点点', '谁藏起来了',
    '首先有一个苹果', '晚安月亮', '好安静的蟋蟀', '从头动到脚',
    '小金鱼逃走了', '我的情绪小怪兽', '生气汤', '菲菲生气了',
    '猜猜我有多爱你', '逃家小兔', '我爸爸', '我妈妈',
    '爷爷一定有办法', '你看起来好像很好吃', '爱心树', '抱抱',
    '大卫不可以', '牙齿大街的新鲜事', '肚子里有个火车站', '小熊宝宝绘本系列',
    '魔法亲亲', '我爱幼儿园', '小种子', '爷爷变成了幽灵',
    '巴巴爸爸开火车', '小鼹鼠摘月亮', '三角龙大战', '超级飞侠',
    '小熊很忙', '波西和皮普', '奇迹幼儿数学', '真相只有一个',
    'DK幼儿认知', '益智迷宫大挑战', '揭秘恐龙', '玩出来的科学脑',
    '托马斯和朋友们', '迪士尼我会自己读', '聪明的小海狸', '动物朋友'
  ];

  // 生成最近7天的记录（确保有4-5条）
  const recentRecords = 4 + Math.floor(Math.random() * 2);
  for (let i = 0; i < recentRecords; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const recordDate = new Date(today);
    recordDate.setDate(today.getDate() - daysAgo);
    const bookIdx = Math.floor(Math.random() * bookTitles.length);
    const recordData = bookRecords[Math.floor(Math.random() * bookRecords.length)];
    records.push({
      date: formatDate(recordDate),
      bookTitle: bookTitles[bookIdx],
      ...recordData
    });
  }

  // 生成最近8-30天的记录（确保有12-15条）
  const middleRecords = 12 + Math.floor(Math.random() * 4);
  for (let i = 0; i < middleRecords; i++) {
    const daysAgo = 7 + Math.floor(Math.random() * 23);
    const recordDate = new Date(today);
    recordDate.setDate(today.getDate() - daysAgo);
    const bookIdx = Math.floor(Math.random() * bookTitles.length);
    const recordData = bookRecords[Math.floor(Math.random() * bookRecords.length)];
    records.push({
      date: formatDate(recordDate),
      bookTitle: bookTitles[bookIdx],
      ...recordData
    });
  }

  // 生成30-60天的记录（确保有10-15条）
  const oldRecords = 10 + Math.floor(Math.random() * 6);
  for (let i = 0; i < oldRecords; i++) {
    const daysAgo = 30 + Math.floor(Math.random() * 30);
    const recordDate = new Date(today);
    recordDate.setDate(today.getDate() - daysAgo);
    const bookIdx = Math.floor(Math.random() * bookTitles.length);
    const recordData = bookRecords[Math.floor(Math.random() * bookRecords.length)];
    records.push({
      date: formatDate(recordDate),
      bookTitle: bookTitles[bookIdx],
      ...recordData
    });
  }

  records.sort((a, b) => b.date.localeCompare(a.date));
  return records;
}

// 更新用户画像
function updateUserPersona() {
  const records = Storage.get('readingRecords', []);
  const profile = Storage.get('childProfile', {});

  const interestProfile = {};
  const abilityCounts = {};
  const emotionCounts = {};
  let totalMinutes = 0;
  const uniqueBooks = new Set();

  records.forEach(r => {
    totalMinutes += r.duration || 0;
    uniqueBooks.add(r.bookTitle);

    (r.ability || []).forEach(a => {
      abilityCounts[a] = (abilityCounts[a] || 0) + 1;
    });

    (r.emotion || []).forEach(e => {
      emotionCounts[e] = (emotionCounts[e] || 0) + 1;
    });

    const book = bookDatabase.find(b => b.title === r.bookTitle);
    if (book && book.tags) {
      book.tags.forEach(tag => {
        interestProfile[tag] = (interestProfile[tag] || 0) + 1;
      });
    }
  });

  // 计算能力百分比
  const abilityGroups = {
    '语言': ['语言表达', '语言'],
    '科学': ['自然认知', '科学思维', '科学'],
    '社交': ['社交能力', '社交'],
    '情绪': ['情绪认知', '情商'],
    '艺术': ['艺术美育', '艺术']
  };
  
  const abilityGroupCounts = {};
  Object.entries(abilityGroups).forEach(([name, tags]) => {
    abilityGroupCounts[name] = tags.reduce((sum, tag) => sum + (abilityCounts[tag] || 0), 0);
  });
  
  const abilityPercentages = {};
  Object.entries(abilityGroupCounts).forEach(([name, count]) => {
    if (count > 0) {
      abilityPercentages[name] = Math.min(95, 30 + count * 5);
    } else {
      abilityPercentages[name] = 30;
    }
  });
  
  const sortedAbilities = Object.entries(abilityPercentages)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
  
  const strongAbilities = sortedAbilities.slice(0, 2).filter(name => abilityPercentages[name] >= 70);
  const weakAbilities = sortedAbilities.slice(-2).filter(name => abilityPercentages[name] < 50);

  const persona = {
    totalMinutes,
    uniqueBooks: uniqueBooks.size,
    totalRecords: records.length,
    strongAbilities,
    weakAbilities,
    abilityData: abilityPercentages,
    emotionData: emotionCounts,
    interestData: interestProfile,
    ageRange: profile.ageRange || '4-5',
    updatedAt: formatDate(new Date())
  };

  Storage.set('userPersona', persona);
  return persona;
}

// ==================== 积分和徽章系统 ====================

const badgeDefinitions = [
  { id: 'first_read', name: '初入书海', icon: '📖', desc: '完成第1次阅读记录', category: 'reading', condition: { type: 'totalRecords', value: 1 } },
  { id: 'read_10', name: '阅读小能手', icon: '📚', desc: '累计阅读10本绘本', category: 'reading', condition: { type: 'totalBooks', value: 10 } },
  { id: 'read_30', name: '阅读达人', icon: '🏆', desc: '累计阅读30本绘本', category: 'reading', condition: { type: 'totalBooks', value: 30 } },
  { id: 'read_50', name: '阅读大师', icon: '👑', desc: '累计阅读50本绘本', category: 'reading', condition: { type: 'totalBooks', value: 50 } },
  { id: 'streak_3', name: '三天坚持', icon: '🔥', desc: '连续打卡3天', category: 'streak', condition: { type: 'streak', value: 3 } },
  { id: 'streak_7', name: '坚持不懈', icon: '💪', desc: '连续打卡7天', category: 'streak', condition: { type: 'streak', value: 7 } },
  { id: 'streak_30', name: '月度之星', icon: '🌟', desc: '连续打卡30天', category: 'streak', condition: { type: 'streak', value: 30 } },
  { id: 'diverse_3', name: '小小探索家', icon: '🌈', desc: '阅读3个不同分类', category: 'diverse', condition: { type: 'categories', value: 3 } },
  { id: 'diverse_5', name: '博学多才', icon: '🎯', desc: '阅读5个不同分类', category: 'diverse', condition: { type: 'categories', value: 5 } },
  { id: 'diverse_8', name: '全方位小达人', icon: '💎', desc: '阅读8个不同分类', category: 'diverse', condition: { type: 'categories', value: 8 } },
  { id: 'detail_5', name: '认真记录员', icon: '✍️', desc: '5条带互动亮点的记录', category: 'detail', condition: { type: 'detailedRecords', value: 5 } },
  { id: 'detail_20', name: '观察小达人', icon: '🔍', desc: '20条详细阅读记录', category: 'detail', condition: { type: 'detailedRecords', value: 20 } },
  { id: 'emotion_10', name: '情绪小专家', icon: '😊', desc: '10条带情绪标签的记录', category: 'detail', condition: { type: 'emotionRecords', value: 10 } },
  { id: 'rating_5', name: '五星好评官', icon: '⭐', desc: '给出5个五星评分', category: 'detail', condition: { type: 'fiveStarRatings', value: 5 } },
  { id: 'time_100', name: '百日陪伴', icon: '⏰', desc: '累计阅读100分钟', category: 'time', condition: { type: 'totalMinutes', value: 100 } },
  { id: 'time_500', name: '时光收藏家', icon: '📅', desc: '累计阅读500分钟', category: 'time', condition: { type: 'totalMinutes', value: 500 } },
  { id: 'category_expert', name: '分类专家', icon: '🎓', desc: '某分类阅读10本', category: 'category', condition: { type: 'categoryMax', value: 10 } },
];

const pointRules = {
  recordBase: { points: 10, name: '阅读记录' },
  hasRating: { points: 5, name: '记录评分' },
  hasHighlights10: { points: 10, name: '详细记录' },
  hasHighlights50: { points: 20, name: '优质记录' },
  hasHighlights100: { points: 30, name: '深度记录' },
  hasEmotionTags: { points: 5, name: '情绪标签' },
  hasAbilityTags: { points: 5, name: '能力标签' },
  newCategory: { points: 15, name: '新分类探索' },
  streak3: { points: 20, name: '连续3天打卡' },
  streak7: { points: 50, name: '连续7天打卡' },
  streak30: { points: 200, name: '连续30天打卡' },
  milestone10: { points: 30, name: '阅读10本里程碑' },
  milestone30: { points: 100, name: '阅读30本里程碑' },
  milestone50: { points: 200, name: '阅读50本里程碑' },
};

function getPointsData() {
  return Storage.get('pointsData', {
    totalPoints: 0,
    records: [],
    unlockedBadges: [],
    unlockedAt: {}
  });
}

function savePointsData(data) {
  Storage.set('pointsData', data);
}

function calculateBadgeProgress(badgeDef, persona, records) {
  const condition = badgeDef.condition;
  let current = 0;
  let target = condition.value;

  switch (condition.type) {
    case 'totalRecords':
      current = persona.recordCount || 0;
      break;
    case 'totalBooks':
      current = persona.totalBooks || 0;
      break;
    case 'streak':
      current = persona.streakDays || 0;
      break;
    case 'categories':
      const interestProfile = persona.interestProfile || {};
      current = Object.keys(interestProfile).length;
      break;
    case 'detailedRecords':
      current = records.filter(r => r.interactionHighlights && r.interactionHighlights.length > 10).length;
      break;
    case 'emotionRecords':
      current = records.filter(r => r.emotionTags && r.emotionTags.length > 0).length;
      break;
    case 'fiveStarRatings':
      current = records.filter(r => r.rating === 5).length;
      break;
    case 'totalMinutes':
      current = persona.totalMinutes || 0;
      break;
    case 'categoryMax':
      const bookCounts = {};
      records.forEach(r => {
        const book = bookDatabase.find(b => b.title === r.bookTitle);
        if (book) {
          bookCounts[book.category] = (bookCounts[book.category] || 0) + 1;
        }
      });
      current = Math.max(...Object.values(bookCounts), 0);
      break;
  }

  return { current: Math.min(current, target), target, percent: Math.min(100, Math.round((current / target) * 100)) };
}

function checkBadges() {
  const persona = Storage.get('userPersona', {});
  const records = Storage.get('readingRecords', []);
  const pointsData = getPointsData();
  const newlyUnlocked = [];

  badgeDefinitions.forEach(badge => {
    if (!pointsData.unlockedBadges.includes(badge.id)) {
      const progress = calculateBadgeProgress(badge, persona, records);
      if (progress.current >= progress.target) {
        pointsData.unlockedBadges.push(badge.id);
        pointsData.unlockedAt[badge.id] = Date.now();
        newlyUnlocked.push(badge);
      }
    }
  });

  if (newlyUnlocked.length > 0) {
    savePointsData(pointsData);
  }

  return newlyUnlocked;
}

// ============ 徽章解锁庆祝动画 ============
function showBadgeCelebration(badge) {
  document.getElementById('celebration-badge-icon').textContent = badge.icon;
  document.getElementById('celebration-badge-name').textContent = badge.name;
  document.getElementById('celebration-badge-desc').textContent = badge.desc;
  
  const modal = document.getElementById('badge-celebration-modal');
  modal.classList.add('show');
  
  // 启动彩纸动画
  startConfetti();
}

function startConfetti() {
  const container = document.getElementById('confetti-container');
  container.innerHTML = '';
  
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'];
  const emojis = ['⭐', '🌟', '✨', '💫', '🎉', '🏆', '🎊', '💝'];
  
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      font-size: ${12 + Math.random() * 16}px;
      left: ${Math.random() * 100}%;
      top: -30px;
      animation: confetti-fall ${1.5 + Math.random() * 1.5}s ease-out forwards;
      animation-delay: ${Math.random() * 0.5}s;
    `;
    particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    container.appendChild(particle);
  }
}

function closeCelebrationModal() {
  document.getElementById('badge-celebration-modal').classList.remove('show');
}

// 添加彩纸动画CSS
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
  @keyframes confetti-fall {
    0% {
      transform: translateY(0) rotate(0deg) scale(1);
      opacity: 1;
    }
    100% {
      transform: translateY(400px) rotate(${360 + Math.random() * 360}deg) scale(0.5);
      opacity: 0;
    }
  }
`;
document.head.appendChild(confettiStyle);

function addPoints(points, reason, recordId = null) {
  if (points <= 0) return;

  const pointsData = getPointsData();
  pointsData.totalPoints += points;
  pointsData.records.unshift({
    id: Date.now() + Math.random(),
    points: points,
    reason: reason,
    recordId: recordId,
    time: formatDate(new Date()),
    timestamp: Date.now()
  });

  if (pointsData.records.length > 200) {
    pointsData.records = pointsData.records.slice(0, 200);
  }

  savePointsData(pointsData);
}

function calculatePointsForRecord(record, wasNewBook, wasNewCategory) {
  const pointsEarned = [];

  pointsEarned.push({ points: pointRules.recordBase.points, reason: pointRules.recordBase.name });

  if (record.rating && record.rating > 0) {
    pointsEarned.push({ points: pointRules.hasRating.points, reason: pointRules.hasRating.name });
  }

  if (record.interactionHighlights && record.interactionHighlights.length > 10) {
    const highlightLength = record.interactionHighlights.length;
    if (highlightLength > 100) {
      pointsEarned.push({ points: pointRules.hasHighlights100.points, reason: pointRules.hasHighlights100.name });
    } else if (highlightLength > 50) {
      pointsEarned.push({ points: pointRules.hasHighlights50.points, reason: pointRules.hasHighlights50.name });
    } else {
      pointsEarned.push({ points: pointRules.hasHighlights10.points, reason: pointRules.hasHighlights10.name });
    }
  }

  if (record.emotionTags && record.emotionTags.length > 0) {
    pointsEarned.push({ points: pointRules.hasEmotionTags.points, reason: pointRules.hasEmotionTags.name });
  }

  if (record.abilityTags && record.abilityTags.length > 0) {
    pointsEarned.push({ points: pointRules.hasAbilityTags.points, reason: pointRules.hasAbilityTags.name });
  }

  if (wasNewCategory) {
    pointsEarned.push({ points: pointRules.newCategory.points, reason: pointRules.newCategory.name });
  }

  return pointsEarned;
}

function checkMilestones(oldPersona, newPersona) {
  const milestones = [];
  const oldBooks = oldPersona.totalBooks || 0;
  const newBooks = newPersona.totalBooks || 0;

  if (oldBooks < 10 && newBooks >= 10) {
    milestones.push({ points: pointRules.milestone10.points, reason: pointRules.milestone10.name });
  }
  if (oldBooks < 30 && newBooks >= 30) {
    milestones.push({ points: pointRules.milestone30.points, reason: pointRules.milestone30.name });
  }
  if (oldBooks < 50 && newBooks >= 50) {
    milestones.push({ points: pointRules.milestone50.points, reason: pointRules.milestone50.name });
  }

  const oldStreak = oldPersona.streakDays || 0;
  const newStreak = newPersona.streakDays || 0;

  if (oldStreak < 3 && newStreak >= 3) {
    milestones.push({ points: pointRules.streak3.points, reason: pointRules.streak3.name });
  }
  if (oldStreak < 7 && newStreak >= 7) {
    milestones.push({ points: pointRules.streak7.points, reason: pointRules.streak7.name });
  }
  if (oldStreak < 30 && newStreak >= 30) {
    milestones.push({ points: pointRules.streak30.points, reason: pointRules.streak30.name });
  }

  return milestones;
}

// ============ AI 分析缓存机制 ============

// 获取 AI 缓存的日期标识
function getAICacheDate(type) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const dayOfWeek = now.getDay();
  
  if (type === 'month') {
    // 月报告：每周一刷新
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(date + mondayOffset);
    return formatDate(monday);
  } else if (type === 'week') {
    // 周报告：每2天刷新
    const dayNumber = Math.floor(date / 2);
    const refreshDay = dayNumber * 2;
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(refreshDay).padStart(2, '0')}`;
  } else {
    // 默认按天
    return formatDate(now);
  }
}

// 获取 AI 分析缓存
function getAIAnalysisCache(type) {
  const cacheKey = `ai_analysis_${type}`;
  const cache = Storage.get(cacheKey);
  const cacheDate = getAICacheDate(type);
  
  if (cache && cache.date === cacheDate) {
    return cache.data;
  }
  return null;
}

// 保存 AI 分析缓存
function saveAIAnalysisCache(type, data) {
  const cacheKey = `ai_analysis_${type}`;
  const cacheDate = getAICacheDate(type);
  // 直接用 localStorage 避免触发 Storage.set 的缓存清除逻辑
  localStorage.setItem(cacheKey, JSON.stringify({
    date: cacheDate,
    data: data,
    updatedAt: Date.now()
  }));
}

// 清除 AI 分析缓存（新增/删除记录时调用）
function invalidateAIAnalysisCache() {
  localStorage.removeItem('ai_analysis_week');
  localStorage.removeItem('ai_analysis_month');
}

// 检测是否有新数据需要刷新 AI 分析
function hasNewReadingData() {
  const cacheWeek = Storage.get('ai_analysis_week');
  const cacheMonth = Storage.get('ai_analysis_month');
  const records = Storage.get('readingRecords', []);
  
  // 如果没有缓存，需要刷新
  if (!cacheWeek && !cacheMonth) return true;
  
  // 检查最新记录时间是否在缓存之后
  if (records.length > 0) {
    const latestRecord = records[0];
    const latestTime = new Date(latestRecord.date).getTime();
    
    if (cacheWeek && latestTime > cacheWeek.updatedAt) return true;
    if (cacheMonth && latestTime > cacheMonth.updatedAt) return true;
  }
  
  return false;
}

// 生成降级分析（基于规则的本地分析）
function generateFallbackAnalysis(records, period) {
  const profile = Storage.get('childProfile', {});
  const nickname = profile.nickname || '宝贝';
  const totalBooks = new Set(records.map(r => r.bookTitle)).size;
  const totalMinutes = records.reduce((sum, r) => sum + (r.duration || 0), 0);
  
  // 分析阅读偏好
  const bookTitles = records.map(r => r.bookTitle);
  const titleCounts = {};
  bookTitles.forEach(t => titleCounts[t] = (titleCounts[t] || 0) + 1);
  const topBook = Object.entries(titleCounts).sort((a, b) => b[1] - a[1])[0];
  
  // 分析能力标签
  const abilityCounts = {};
  records.forEach(r => {
    (r.ability || []).forEach(a => abilityCounts[a] = (abilityCounts[a] || 0) + 1);
  });
  const topAbilities = Object.entries(abilityCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  
  // 分析情绪标签
  const emotionCounts = {};
  records.forEach(r => {
    (r.emotion || []).forEach(e => emotionCounts[e] = (emotionCounts[e] || 0) + 1);
  });
  const topEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).slice(0, 2);
  
  // 生成阅读偏好描述
  let preference = '';
  if (topBook) {
    preference = `${nickname}近期反复阅读《${topBook[0]}》，对这个故事特别感兴趣。`;
  } else {
    preference = `${nickname}阅读范围广泛，喜欢探索不同主题的绘本。`;
  }
  
  // 生成能力发展描述
  let ability = '';
  if (topAbilities.length > 0) {
    const abilityStr = topAbilities.map(([a]) => a).join('、');
    ability = `在${abilityStr}方面表现积极，这些都是成长中的亮点。`;
  } else {
    ability = `阅读习惯良好，正在全面发展各项能力。`;
  }
  
  // 生成建议
  let suggestion = '';
  const lowAbilities = Object.entries(abilityCounts)
    .filter(([, count]) => count <= 1)
    .map(([a]) => a);
  if (lowAbilities.length > 0) {
    suggestion = `可以尝试拓展${lowAbilities[0]}相关的绘本，全面发展。`;
  } else {
    suggestion = `继续保持当前的阅读习惯，多样化选择会让收获更丰富。`;
  }
  
  // 生成拓展推荐
  let expand = '科普认知、情感教育、创意想象';
  if (topEmotions.length > 0 && topEmotions[0][0].includes('开心')) {
    expand = '情绪管理、社交礼仪、勇气挑战';
  }
  
  return {
    preference: preference + `累计阅读${totalBooks}本，时长约${totalMinutes}分钟。`,
    ability: ability,
    suggestion: suggestion,
    expand: expand,
    isFallback: true
  };
}
