// ============================================
// P2 推荐结果页逻辑
// ============================================

function showLoadingState() {
  const loadingArea = document.getElementById('p2-loading');
  const resultArea = document.getElementById('p2-result');
  
  loadingArea.style.transition = 'none';
  loadingArea.style.opacity = '1';
  loadingArea.style.display = 'block';
  resultArea.style.display = 'none';
}

function showResultState() {
  const loadingArea = document.getElementById('p2-loading');
  const resultArea = document.getElementById('p2-result');
  
  loadingArea.style.transition = 'opacity 0.4s ease';
  loadingArea.style.opacity = '0';
  
  setTimeout(() => {
    loadingArea.style.display = 'none';
    resultArea.style.display = 'block';
    resultArea.style.opacity = '0';
    resultArea.style.transition = 'opacity 0.4s ease';
    requestAnimationFrame(() => {
      resultArea.style.opacity = '1';
    });
  }, 400);
}

async function runLoadingAnimation(userInput) {
  const startTime = Date.now();
  const MIN_DURATION = 2000;
  const MAX_DURATION = 15000;

  // 设置加载状态标志，防止 switchTab 干扰
  window.isLoadingRecommendations = true;

  const steps = buildLoadingSteps(userInput);

  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById(`step-dot-${i}`);
    const text = document.getElementById(`step-text-${i}`);
    dot.classList.remove('done', 'active');
    dot.classList.add('pending');
    dot.textContent = '';
    text.classList.remove('done', 'active');
  }

  for (let i = 1; i <= 4; i++) {
    document.getElementById(`step-text-${i}`).textContent = steps[i - 1].title;
    const sub = document.getElementById(`step-subtext-${i}`);
    if (sub) sub.textContent = steps[i - 1].subtitle;
  }

  let currentStep = 0;
  const ring = document.getElementById('p2-loading-ring');
  const percentEl = document.getElementById('p2-loading-percent');

  function updateStep() {
    if (currentStep > 0) {
      const prevDot = document.getElementById(`step-dot-${currentStep}`);
      const prevText = document.getElementById(`step-text-${currentStep}`);
      prevDot.classList.remove('active');
      prevDot.classList.add('done');
      prevDot.textContent = '✓';
      prevText.classList.remove('active');
      prevText.classList.add('done');
    }

    currentStep++;

    if (currentStep <= 4) {
      const dot = document.getElementById(`step-dot-${currentStep}`);
      const text = document.getElementById(`step-text-${currentStep}`);
      dot.classList.remove('pending');
      dot.classList.add('active');
      text.classList.add('active');

      const textWrapper = text ? text.closest('.p2-step-text-wrapper') : null;
      if (textWrapper) {
        textWrapper.classList.remove('step-fade-in');
        void textWrapper.offsetWidth;
        textWrapper.classList.add('step-fade-in');
      }
    }
  }

  let progress = 0;
  const progressStart = performance.now();

  function updateProgress() {
    const elapsed = performance.now() - progressStart;
    const raw = Math.min(elapsed / MAX_DURATION, 1);
    const eased = 1 - Math.pow(1 - raw, 2.2);
    progress = Math.round(eased * 100);

    percentEl.textContent = progress + '%';
    ring.style.background = `conic-gradient(var(--color-primary) ${progress * 3.6}deg, var(--color-surface) 0deg)`;

    if (raw < 1) {
      requestAnimationFrame(updateProgress);
    } else {
      progress = 100;
      percentEl.textContent = '100%';
      ring.style.background = `conic-gradient(var(--color-primary) 360deg, var(--color-surface) 0deg)`;
    }
  }
  requestAnimationFrame(updateProgress);

  updateStep();
  const stepTimers = [];

  function scheduleSteps() {
    const stepDuration = MIN_DURATION / 4;
    stepTimers.push(setTimeout(() => updateStep(), stepDuration));
    stepTimers.push(setTimeout(() => updateStep(), stepDuration * 2));
    stepTimers.push(setTimeout(() => updateStep(), stepDuration * 3));
  }
  scheduleSteps();

  let aiResult = null;
  let aiError = null;
  let isDegraded = false;

  const aiPromise = (async () => {
    try {
      if (typeof getAIRecommendation !== 'function') {
        throw new Error('AI service not loaded');
      }
      return await getAIRecommendation(userInput, places);
    } catch (err) {
      console.warn('AI 推荐失败:', err);
      aiError = err;
      isDegraded = true;
      if (typeof getLocalRecommendation === 'function') {
        return getLocalRecommendation(userInput, places);
      }
      return {
        understood: '帮你找几个合适的地方~',
        recommendations: assignRanks(generateRecommendations())
      };
    }
  })();

  const minDurationPromise = new Promise(resolve => {
    setTimeout(resolve, MIN_DURATION);
  });

  const maxDurationPromise = new Promise(resolve => {
    setTimeout(() => {
      resolve('timeout');
    }, MAX_DURATION);
  });

  const [completed] = await Promise.all([
    Promise.race([
      aiPromise.then(result => { aiResult = result; return 'ai'; }),
      maxDurationPromise
    ]),
    minDurationPromise
  ]);

  if (completed === 'timeout' && !aiResult) {
    isDegraded = true;
    aiResult = (typeof getLocalRecommendation === 'function')
      ? getLocalRecommendation(userInput, places)
      : {
          understood: '帮你找几个合适的地方~',
          recommendations: assignRanks(generateRecommendations())
        };
  }

  const remainingTime = Math.max(0, MIN_DURATION - (Date.now() - startTime));

  setTimeout(() => {
    stepTimers.forEach(t => clearTimeout(t));
    currentRecommendations = aiResult.recommendations || [];

    if (isDegraded) {
      showMessage('aiTimeout', 'info');
    }

    renderRecommendations();
    renderAIUnderstood(aiResult.understood);
    updateParamTags();

    showResultState();

    requestAnimationFrame(() => {
      try {
        refreshIcons();
      } catch (err) {
        console.error('final refreshIcons error:', err);
      }
    });

    // 清除加载状态标志
    window.isLoadingRecommendations = false;
  }, remainingTime);
}

function updateParamTags() {
  const outdoorTag = document.getElementById('param-tag-outdoor');
  if (!outdoorTag) return;

  let iconName = 'cloud';
  let text = '不限';
  let className = 'tag tag-gray';

  if (currentParams.indoors === true) {
    iconName = 'home';
    text = '室内';
    className = 'tag tag-purple';
  } else if (currentParams.indoors === false) {
    iconName = 'tree-pine';
    text = '户外';
    className = 'tag tag-teal';
  }

  outdoorTag.className = className;
  outdoorTag.innerHTML = `<i data-lucide="${iconName}" class="h-3 w-3"></i> ${text}`;
}

function getAllItems() {
  let items = places.filter(p => !p.closed);
  const w = weights;

  const typeFilters = [];
  if (w.outdoor > 0) typeFilters.push('outdoor');
  if (w.activity > 0) typeFilters.push('activity');
  if (w.indoor > 0) typeFilters.push('indoor');
  if (w.exhibition > 0) typeFilters.push('exhibition');
  if (w.picking > 0) typeFilters.push('picking');

  if (typeFilters.length > 0) {
    items = items.filter(item => {
      return typeFilters.some(filter => {
        switch (filter) {
          case 'outdoor': return isOutdoorPlace(item);
          case 'activity': return isActivityPlace(item);
          case 'indoor': return isIndoorPlace(item);
          case 'exhibition': return isExhibitionPlace(item);
          case 'picking': return isPickingPlace(item);
          default: return false;
        }
      });
    });
  }

  if (currentParams.type === 'picking') {
    items = items.filter(item => isPickingPlace(item));
  } else if (currentParams.type === 'activity') {
    items = items.filter(item => isActivityPlace(item));
  } else if (currentParams.type === 'exhibition') {
    items = items.filter(item => isExhibitionPlace(item));
  }

  if (currentParams.indoors === true) {
    items = items.filter(item => item.indoors === true);
  } else if (currentParams.indoors === false) {
    items = items.filter(item => item.indoors === false);
  }

  const targetAge = currentParams.age || profile?.ageGroup;
  if (targetAge) {
    items = items.filter(item => item.ageRange && item.ageRange.includes(targetAge));
  }

  if (currentParams.duration === 'full') {
    items = items.filter(item => item.duration === 'full');
  }

  return items;
}

// ============================================
// 类型判断辅助函数
// ============================================
function hasType(item, typeNames) {
  return item.types && item.types.some(t => typeNames.includes(t));
}

function isActivityPlace(item) {
  return hasType(item, ['playground', 'farm']);
}

function isExhibitionPlace(item) {
  return hasType(item, ['museum', 'culture', 'science']);
}

function isOutdoorPlace(item) {
  return !item.indoors && hasType(item, ['park', 'nature']);
}

function isIndoorPlace(item) {
  return item.indoors || hasType(item, ['mall', 'museum']);
}

function isPickingPlace(item) {
  return hasType(item, ['farm']);
}

function calculateScore(item) {
  let score = 50; // 基础分提高，让分数更集中在中间区间
  const w = weights;

  // ===== 权重维度计算（用户主动设置的权重，降低系数避免分数饱和）=====
  const isOutdoor = isOutdoorPlace(item);
  score += (isOutdoor ? 1 : -1) * w.outdoor * 4;

  const isActivity = isActivityPlace(item);
  score += (isActivity ? 1 : -1) * w.activity * 4;

  const isIndoor = isIndoorPlace(item);
  score += (isIndoor ? 1 : -1) * w.indoor * 4;

  const isExhibition = isExhibitionPlace(item);
  score += (isExhibition ? 1 : -1) * w.exhibition * 4;

  const isPicking = isPickingPlace(item);
  score += (isPicking ? 1 : -1) * w.picking * 4;

  const isWaterPlace = hasType(item, ['water']);
  score += (isWaterPlace ? 1 : -1) * w.water * 5;

  const crowdScoreMap = { 1: 4, 2: 2, 3: 0, 4: -2, 5: -4 };
  const crowdBase = crowdScoreMap[item.crowdLevel] || 0;
  if (w.crowd >= 0) {
    score += w.crowd * crowdBase;
  } else {
    score += w.crowd * (-crowdBase);
  }

  // ===== 差异化加分项（地点本身属性）=====

  // 1. 距离差异（核心维度，大幅拉开差距）
  const distScore = [
    [12, 10], [15, 8], [18, 6], [20, 5], [22, 4], [25, 2], [28, 0],
    [30, -2], [35, -5], [40, -8], [50, -10], [55, -12]
  ];
  let distAdd = 0;
  for (const [d, s] of distScore) {
    if (item.distance <= d) { distAdd = s; break; }
  }
  // 距离扣分不超过基础分的40%，避免分数过低
  score += Math.max(distAdd, -20);

  // 2. 人流等级自然差异（加大区分度）
  const crowdNatural = { 1: 6, 2: 3, 3: 0, 4: -3, 5: -6 };
  score += crowdNatural[item.crowdLevel] || 0;

  // 3. 年龄匹配（高权重维度）
  if (currentParams.age && item.ageRange) {
    if (item.ageRange.includes(currentParams.age)) {
      score += item.ageRange.length === 1 ? 8 : 5;
    } else if (item.ageRange.length >= 2) {
      score += 1;
    } else {
      score -= 10;
    }
  }

  // 4. 推车友好（加大区分度）
  if (currentParams.stroller) {
    score += item.strollerFriendly ? 4 : -5;
  }

  // 5. 时长匹配
  if (currentParams.duration) {
    score += item.duration === currentParams.duration ? 3 : -2;
  }

  // 6. 天气加成
  if (weather.saturday === 'sunny' && !item.indoors) score += 3;
  if (weather.saturday === 'rainy' && item.indoors) score += 4;
  if (weather.saturday === 'cloudy' && !item.indoors) score += 2;

  // 7. 停车场（加大区分度）
  if (currentParams.hasParking) {
    score += item.hasParking ? 8 : -6;
  } else {
    score += item.hasParking ? 2 : -1;
  }

  // 8. 类型丰富度（加大区分度）
  if (item.types && item.types.length > 1) {
    score += (item.types.length - 1) * 2;
  }

  // 9. 标签丰富度（加大区分度）
  if (item.tags) {
    score += Math.min(item.tags.length, 3);
  }

  // 10. 特色标签加分（核心亮点，大幅拉开差距）
  const specialTags = ['大熊猫', '海豚', '恐龙', '化石', '采摘', '花海', '划船', '游泳'];
  if (item.tags) {
    let specialCount = 0;
    for (const tag of item.tags) {
      if (specialTags.includes(tag)) specialCount++;
    }
    score += Math.min(specialCount, 3) * 3;
  }

  // 11. 行政区加分
  if (item.district === '玄武区') score += 2;

  // ===== 快速配置联动（用户明确选择的偏好）=====
  // 小月龄优先室内（0-1岁宝宝）
  const isInfant = currentParams.age === '0-1' || (profile && profile.ageGroup === '0-1');
  if (isInfant) {
    if (item.indoors) score += 15;
    else score -= 12;
  }

  if (currentParams.indoors === true && item.indoors) score += 4;
  if (currentParams.indoors === false && !item.indoors) score += 4;
  if (currentParams.crowd === 'low') {
    if (item.crowdLevel <= 2) score += 10;
    if (item.crowdLevel >= 4) score -= 10;
  }
  if (currentParams.distance === 'short' && item.distance <= 25) score += 3;
  if (currentParams.type === 'activity' && !isActivity) score -= 10;
  if (currentParams.type === 'exhibition' && !isExhibition) score -= 8;
  if (currentParams.type === 'picking' && !isPicking) score -= 8;
  if (currentParams.health === 'recovering') {
    if (item.crowdLevel <= 2) score += 4;
    if (hasType(item, ['zoo'])) score -= 6;
  }
  if (currentParams.health === 'allergy') {
    if (item.indoors) score += 12;
    else score -= 10;
    if (item.crowdLevel <= 2) score += 5;
  }

  // ===== 档案个性化加分（基于宝宝档案，降低系数）=====

  const p = profile || {};
  const stats = p.stats || {};

  // 1. 档案年龄匹配
  if (p.ageGroup && item.ageRange && item.ageRange.includes(p.ageGroup)) {
    score += 8;
  }

  // 2. 兴趣标签匹配（降低权重）
  const typeInterestMap = {
    "动物": ["zoo", "nature"],
    "自然": ["nature", "park", "farm"],
    "科学": ["science", "museum"],
    "艺术": ["culture", "museum"],
    "运动": ["park", "playground"],
    "玩水": ["water", "park"]
  };
  if (p.interests && p.interests.length > 0) {
    let interestScore = 0;
    p.interests.forEach(interest => {
      const types = typeInterestMap[interest] || [];
      if (types.some(t => item.types && item.types.includes(t))) {
        interestScore += 5;
      }
    });
    score += Math.min(interestScore, 12);
  }

  // 3. 过敏/禁忌减分
  if (p.allergies && p.allergies.length > 0) {
    if (p.allergies.includes("花粉") && !item.indoors && item.types && item.types.includes("nature")) {
      score -= 20;
    }
    if (p.allergies.includes("热") && !item.indoors) {
      score -= 10;
    }
    if (p.allergies.includes("尘") && item.indoors && hasType(item, ['mall'])) {
      score -= 8;
    }
  }

  // 4. 推车友好
  if (p.needsStroller && item.strollerFriendly) {
    score += 5;
  }

  // 5. 时长匹配
  if (p.preferredDuration && item.duration === p.preferredDuration) {
    score += 3;
  }

  // 6. 交通方式偏好
  if (p.transport === 'drive' && item.hasParking) {
    score += 3;
  }

  // 7. 车程限制
  if (p.maxDistance && item.distance > p.maxDistance) {
    score -= (item.distance - p.maxDistance) * 1;
  }

  // 8. 基于历史记录的协同过滤
  if (stats.likedTypes && stats.likedTypes.length > 0) {
    if (stats.likedTypes.some(t => item.types && item.types.includes(t))) {
      score += 5;
    }
  }
  if (stats.dislikedTypes && stats.dislikedTypes.length > 0) {
    if (stats.dislikedTypes.some(t => item.types && item.types.includes(t))) {
      score -= 10;
    }
  }

  return Math.max(0, Math.round(score));
}

// 全局排序后的地点列表（用于换一批分页）
let allScoredPlaces = [];

function generateRecommendations() {
  const allItems = getAllItems();

  allScoredPlaces = allItems.map(item => ({
    ...item,
    score: calculateScore(item),
    reasons: generateReasons(item)
  }));

  allScoredPlaces.sort((a, b) => b.score - a.score);

  // 分数归一化兜底：如果最高分超过98，映射到60-98范围，保留排名差异
  const maxScore = allScoredPlaces[0]?.score || 0;
  if (maxScore > 98) {
    const minScore = allScoredPlaces[allScoredPlaces.length - 1]?.score || 0;
    const scoreRange = maxScore - minScore;

    if (scoreRange > 0) {
      allScoredPlaces.forEach(p => {
        p.score = Math.round(60 + (p.score - minScore) / scoreRange * 38);
      });
    } else {
      // 所有分数相同，均匀分布
      allScoredPlaces.forEach((p, idx) => {
        p.score = Math.round(90 - idx * (25 / Math.max(allScoredPlaces.length - 1, 1)));
      });
    }
  }

  const maxResults = 5;
  
  // 如果严格过滤后结果为空，逐步放宽条件
  if (allScoredPlaces.length === 0) {
    // 放宽：不做年龄过滤
    let relaxedItems = places.filter(p => !p.closed);
    if (currentParams.indoors === true) {
      relaxedItems = relaxedItems.filter(item => item.indoors === true);
    } else if (currentParams.indoors === false) {
      relaxedItems = relaxedItems.filter(item => item.indoors === false);
    }
    allScoredPlaces = relaxedItems.map(item => ({
      ...item,
      score: calculateScore(item),
      reasons: generateReasons(item)
    }));
    allScoredPlaces.sort((a, b) => b.score - a.score);
  }
  
  // 如果仍然为空（极端情况），使用所有未关闭的地点
  if (allScoredPlaces.length === 0) {
    allScoredPlaces = places.filter(p => !p.closed).map(item => ({
      ...item,
      score: 50,
      reasons: generateReasons(item)
    }));
    allScoredPlaces.sort((a, b) => b.score - a.score);
  }
  
  const ageGroup = currentParams.age || profile?.ageGroup;
  if (ageGroup === '6-12') {
    const sixTwelveMatches = allScoredPlaces.filter(item => item.ageRange && item.ageRange.includes('6-12'));
    if (sixTwelveMatches.length === 0) {
      const fallback = allScoredPlaces.filter(item => item.ageRange && item.ageRange.includes('3-6')).slice(0, maxResults);
      if (fallback.length > 0) {
        showMessage('6-12岁专属地点较少，为你推荐3-6岁也适合的', 'info');
        return fallback.map((item, index) => ({ ...item, rank: index + 1 }));
      }
    }
  }
  
  return allScoredPlaces.slice(0, maxResults).map((item, index) => ({
    ...item,
    rank: index + 1
  }));
}

function getRecommendationsByPage(page) {
  const pageSize = 3;
  const start = (page - 1) * pageSize;
  const pageItems = allScoredPlaces.slice(start, start + pageSize);
  
  return pageItems.map((item, index) => ({
    ...item,
    rank: start + index + 1,
    isLastPage: start + pageSize >= allScoredPlaces.length
  }));
}

function generateReasons(item) {
  const reasons = [];
  const score = item.score || calculateScore(item);
  const w = weights;
  const p = profile || {};
  const babyName = p.babyName || '宝宝';
  
  // ===== 正面理由（优先显示匹配度高的维度） =====
  
  // 1. 天气理由（使用宝宝名字）
  if (weather.saturday === 'sunny' && !item.indoors) {
    reasons.push({ type: 'positive', icon: 'sun', text: `周六天气不错，带${babyName}出门刚好~` });
  } else if (weather.saturday === 'rainy' && item.indoors) {
    reasons.push({ type: 'positive', icon: 'cloud-rain', text: `下雨天室内活动，${babyName}不用担心淋雨~` });
  }
  
  // 2. 类型匹配理由（根据权重和类型生成）
  if (isOutdoorPlace(item) && w.outdoor > 0) {
    reasons.push({ type: 'positive', icon: 'tree-pine', text: `户外场地开阔，${babyName}可以尽情奔跑~` });
  }
  if (isIndoorPlace(item) && w.indoor > 0) {
    reasons.push({ type: 'positive', icon: 'home', text: `室内环境舒适，${babyName}不用担心天气变化~` });
  }
  if (isExhibitionPlace(item) && w.exhibition > 0) {
    reasons.push({ type: 'positive', icon: 'frame', text: `展览内容丰富，${babyName}边玩边学效果好~` });
  }
  if (isActivityPlace(item) && w.activity > 0) {
    reasons.push({ type: 'positive', icon: 'ticket', text: `游乐设施丰富，${babyName}玩得很开心~` });
  }
  if (isPickingPlace(item) && w.picking > 0) {
    reasons.push({ type: 'positive', icon: 'cherry', text: `可以采摘互动，${babyName}体验田园乐趣~` });
  }
  
  // 3. 年龄理由（优先使用用户当前选择的年龄）
  const ageGroup = currentParams.age || p.ageGroup;
  if (ageGroup && item.ageRange && item.ageRange.includes(ageGroup)) {
    const ageText = ageGroup === '0-1' ? '小月龄' : ageGroup === '1-3' ? '学步期' : '学龄前';
    reasons.push({ type: 'positive', icon: 'baby', text: `${babyName}${ageGroup}岁了，互动体验正合适` });
  }
  
  // 4. 兴趣匹配理由（档案个性化）
  const typeInterestMap = {
    "动物": ["zoo", "nature"],
    "自然": ["nature", "park", "farm"],
    "科学": ["science", "museum"],
    "艺术": ["culture", "museum"],
    "运动": ["park", "playground"],
    "玩水": ["water", "park"]
  };
  if (p.interests && p.interests.length > 0) {
    for (const interest of p.interests) {
      const types = typeInterestMap[interest] || [];
      if (types.some(t => item.types && item.types.includes(t))) {
        reasons.push({ type: 'positive', icon: 'heart', text: `${babyName}喜欢${interest}，肯定会喜欢这里~` });
        break;
      }
    }
  }
  
  // 5. 推车理由（档案个性化）
  if ((p.needsStroller || currentParams.stroller) && item.strollerFriendly) {
    reasons.push({ type: 'positive', icon: 'car', text: `推车可以畅行，带${babyName}不累` });
  }
  
  // 6. 距离理由
  if (item.distance <= 20) {
    reasons.push({ type: 'positive', icon: 'map-pin', text: `距离仅${item.distance}分钟，说走就走` });
  } else if (item.distance <= 30) {
    reasons.push({ type: 'positive', icon: 'map-pin', text: `距离车程${item.distance}分钟，半天刚好` });
  } else if (p.maxDistance && item.distance <= p.maxDistance) {
    reasons.push({ type: 'positive', icon: 'map-pin', text: `车程${item.distance}分钟，刚好在你接受范围内` });
  }
  
  // 7. 人流理由（使用宝宝名字）
  if (item.crowdLevel <= 2) {
    reasons.push({ type: 'positive', icon: 'users', text: `预测人不多，${babyName}可以玩得更自在` });
  }
  
  // 8. 停车理由
  if ((p.transport === 'drive' || currentParams.transport === 'drive') && item.hasParking) {
    reasons.push({ type: 'positive', icon: 'car', text: '有停车场，自驾方便' });
  }
  
  // 9. 描述补充（从地点描述中提取）
  if (item.description) {
    reasons.push({ type: 'positive', icon: 'star', text: item.description });
  }
  
  // ===== 注意事项（选1条） =====
  
  // 人流警告
  if (item.crowdLevel >= 4) {
    reasons.push({ type: 'warning', icon: 'alert-triangle', text: '周末人较多，建议上午早去' });
  }
  // 距离警告（结合档案车程限制）
  else if (p.maxDistance && item.distance > p.maxDistance) {
    reasons.push({ type: 'warning', icon: 'alert-triangle', text: `距离超过你设定的${p.maxDistance}分钟车程，建议考虑其他选项` });
  }
  else if (item.distance > 40) {
    reasons.push({ type: 'warning', icon: 'alert-triangle', text: '距离稍远，建议早出发' });
  }
  // 无停车警告
  else if ((p.transport === 'drive' || currentParams.transport === 'drive') && !item.hasParking) {
    reasons.push({ type: 'warning', icon: 'alert-triangle', text: '附近停车不太方便，建议公共交通' });
  }
  // 不推车友好警告
  else if ((p.needsStroller || currentParams.stroller) && !item.strollerFriendly) {
    reasons.push({ type: 'warning', icon: 'alert-triangle', text: `推车不太方便，建议轻装出行` });
  }
  // 年龄不匹配提示
  else if (ageGroup && item.ageRange && !item.ageRange.includes(ageGroup)) {
    reasons.push({ type: 'warning', icon: 'alert-triangle', text: '年龄范围可能不太匹配，建议再确认' });
  }
  
  // 取前4条（3条正面 + 1条注意事项）
  return reasons.slice(0, 4);
}

function renderRecommendations() {
  const container = document.getElementById('recommendations-list');
  
  // 更新结果数量显示
  const countEl = document.getElementById('p2-result-num');
  if (countEl) {
    countEl.textContent = Math.max(1, currentRecommendations.length);
  }
  
  container.innerHTML = currentRecommendations.map(item => `
    <div class="card rec-card rank-${item.rank <= 3 ? item.rank : 3}" data-id="${item.id}" data-action="select-card">
      <div class="rec-rank-badge">${item.rank === 1 ? '<i data-lucide="trophy" class="h-4 w-4 gold"></i>' : item.rank === 2 ? '<i data-lucide="trophy" class="h-4 w-4 silver"></i>' : item.rank === 3 ? '<i data-lucide="trophy" class="h-4 w-4 bronze"></i>' : `<span class="rec-rank-num">${item.rank}</span>`}</div>
      
      <div class="rec-card-header">
        <div class="rec-card-title-row">
          <div class="rec-card-name">
            ${escapeHtml(item.name)}
          </div>
          <div class="rec-card-tags">
            <span class="tag tag-gray"><i data-lucide="map-pin" class="h-3 w-3"></i> ${escapeHtml(item.district)}</span>
            <span class="tag tag-gray"><i data-lucide="car" class="h-3 w-3"></i> 自驾${item.distance}分钟</span>
            <span class="tag ${item.indoors ? 'tag-purple' : 'tag-teal'}">${item.indoors ? '<i data-lucide="home" class="h-3 w-3"></i> 室内' : '<i data-lucide="tree-pine" class="h-3 w-3"></i> 户外'}</span>
            ${item.tags ? item.tags.slice(0, 2).map(tag => `<span class="tag tag-yellow">${escapeHtml(tag)}</span>`).join('') : ''}
          </div>
        </div>
        <div class="rec-score">
          <span class="rec-score-num" data-target="${item.score}">0</span><span>%匹配</span>
        </div>
      </div>
      
      <div class="rec-reasons">
        ${(item.reasons && item.reasons.length > 0 ? item.reasons : [{type: 'normal', icon: 'star', text: '综合推荐，适合当前需求'}]).map(r => `
          <div class="rec-reason-item ${r.type}">
            <i data-lucide="${r.icon}" class="h-3.5 w-3.5 rec-reason-icon"></i>
            <span>${escapeHtml(r.text)}</span>
          </div>
        `).join('')}
      </div>
      
      ${item.crowdLevel >= 4 ? `
        <div class="rec-warning-box">
          <i data-lucide="alert-triangle" class="h-4 w-4 rec-warning-icon"></i>
          <span class="rec-warning-text">注意：周末人较多，建议上午早去避开高峰</span>
        </div>
      ` : ''}
      
      <div class="rec-card-actions">
        <button class="rec-card-btn" data-id="${item.id}" data-action="view-detail">查看详情</button>
        <button class="rec-card-btn primary" data-id="${item.id}" data-action="ask-family">问问家人</button>
        <button class="rec-card-btn" data-id="${item.id}" data-action="add-fav">收藏</button>
      </div>
    </div>
  `).join('');

  try {
    refreshIcons();
  } catch (err) {
    console.error('renderRecommendations refreshIcons error:', err);
  }

  // 触发数字滚动动画（从 0 滚动到目标分数）
  const scoreNums = container.querySelectorAll('.rec-score-num');
  scoreNums.forEach((el, idx) => {
    const target = parseInt(el.getAttribute('data-target')) || 0;
    setTimeout(() => {
      if (typeof animateNumber === 'function') {
        animateNumber(el, 0, target, 600, '');
      } else {
        el.textContent = target;
      }
    }, 80 + idx * 100);
  });

  // 触发列表项依次淡入
  container.classList.remove('list-fade-in');
  void container.offsetWidth;
  container.classList.add('list-fade-in');

  // 事件委托：推荐列表点击处理
  const recContainer = document.getElementById('recommendations-list');
  if (recContainer && !recContainer._kidgo_delegated) {
    recContainer._kidgo_delegated = true;
    recContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (btn) {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);
        if (action === 'view-detail') viewDetail(id);
        else if (action === 'ask-family') askFamily(id);
        else if (action === 'add-fav') addToFav(id);
        return;
      }
      const card = e.target.closest('.rec-card[data-action="select-card"]');
      if (card) {
        const id = parseInt(card.dataset.id);
        selectRecCard(id);
      }
    });
  }

  // 默认选中第一个卡片
  if (currentRecommendations.length > 0) {
    selectedDestination = currentRecommendations[0];
    const firstCard = container.querySelector('.rec-card');
    if (firstCard) {
      firstCard.classList.add('selected');
    }
  }
}

// ============================================
// P2 权重调整
// ============================================
function resetWeights() {
  weights = {
    outdoor: 0,
    activity: 0,
    indoor: 0,
    exhibition: 0,
    picking: 0,
    water: 0,
    crowd: 0
  };
  
  store.set('weights', weights);
  
  const keys = ['outdoor', 'activity', 'indoor', 'exhibition', 'picking', 'crowd'];
  keys.forEach(key => {
    const valEl = document.getElementById(`w-${key}-val`);
    if (valEl) {
      valEl.textContent = '中性';
      valEl.className = 'weight-value';
    }
  });
}

function adjustWeight(key, delta) {
  weights[key] = Math.max(-2, Math.min(2, weights[key] + delta));

  store.set('weights', weights);

  const labels = { '-2': '−−', '-1': '−', '0': '中性', '1': '+', '2': '++' };
  const valEl = document.getElementById(`w-${key}-val`);
  if (valEl) {
    valEl.textContent = labels[weights[key]];
    valEl.className = 'weight-value';
    if (weights[key] > 0) valEl.classList.add('weight-positive');
    if (weights[key] < 0) valEl.classList.add('weight-negative');

    // 数字跳动动画
    valEl.classList.remove('bump');
    void valEl.offsetWidth;
    valEl.classList.add('bump');
  }

  recPage = 1;
  currentRecommendations = generateRecommendations();
  renderRecommendations();
  updateRefreshBtnText();
  renderAIUnderstood(null);
}

// ============================================
// P2 换一批（分页逻辑）
// ============================================
function refreshRecommend() {
  const wrapper = document.getElementById('recs-wrapper');
  const refreshBtn = document.getElementById('refresh-btn');
  const list = document.getElementById('recommendations-list');

  if (!list) return;

  // 如果当前结果少于等于5个，没有可换的批次
  if (allScoredPlaces.length <= 5) {
    showMessage('onlyOne', 'info');
    return;
  }

  // 添加旧卡片滑出动画
  list.classList.remove('list-fade-in');
  list.classList.add('list-fade-out');
  wrapper.style.pointerEvents = 'none';

  setTimeout(() => {
    list.classList.remove('list-fade-out');

    recPage++;
    const nextPageItems = getRecommendationsByPage(recPage);

    if (nextPageItems.length === 0) {
      recPage = 1;
      currentRecommendations = getRecommendationsByPage(1);
      showMessage('backToTop', 'info');
    } else {
      currentRecommendations = nextPageItems;
      if (nextPageItems[0] && nextPageItems[0].isLastPage) {
        showMessage('noMore', 'info');
      }
    }

    renderRecommendations();
    updateRefreshBtnText();
    renderAIUnderstood(null);

    list.classList.remove('list-fade-in');
    void list.offsetWidth;
    list.classList.add('list-slide-in');

    wrapper.style.pointerEvents = 'auto';
  }, 350);
}

function updateRefreshBtnText() {
  const btn = document.getElementById('refresh-btn');
  if (!btn) return;

  // 如果结果少于等于5个，按钮文字改为"已是最匹配"
  if (allScoredPlaces.length <= 5) {
    btn.innerHTML = '<i data-lucide="check" class="h-4 w-4"></i><span>已是最匹配</span>';
    btn.disabled = true;
    btn.style.opacity = '0.6';
  } else {
    btn.disabled = false;
    btn.style.opacity = '1';
    const totalPages = Math.ceil(allScoredPlaces.length / 3);
    if (recPage >= totalPages || allScoredPlaces.length <= 3) {
      btn.innerHTML = '<i data-lucide="refresh-cw" class="h-4 w-4"></i><span>回到TOP3</span>';
    } else {
      btn.innerHTML = '<i data-lucide="refresh-cw" class="h-4 w-4"></i><span>换一批看看</span>';
    }
  }
  refreshIcons();
}

// 渲染 AI 理解的需求气泡
function renderAIUnderstood(text) {
  const bubble = document.getElementById('p2-ai-understood');
  if (!bubble) return;

  if (text) {
    const textEl = document.getElementById('p2-ai-understood-text');
    if (textEl) textEl.textContent = text;
    bubble.style.display = 'flex';
  } else {
    bubble.style.display = 'none';
  }
}

// ============================================
// P2 卡片交互
// ============================================
function selectRecCard(id) {
  selectedDestination = currentRecommendations.find(item => item.id === id);
  if (selectedDestination) {
    showMessage('已选：' + selectedDestination.name, 'success');
    
    // 更新卡片选中状态的视觉反馈
    document.querySelectorAll('.rec-card').forEach(card => {
      card.classList.remove('selected');
    });
    const selectedCard = document.querySelector(`.rec-card[data-id="${id}"]`);
    if (selectedCard) {
      selectedCard.classList.add('selected');
    }
  }
}

function viewDetail(id) {
  try {
    const item = currentRecommendations.find(i => i.id === id) || places.find(p => p.id === id);
    if (!item) return;
    currentDetailPlace = item; // ← 设置当前详情地点，供底部操作栏使用
    renderDetailPage(item);
    switchTab('detail');

    // 触发详情页区块淡入（重启动画）
    const p6Content = document.querySelector('.p6-content');
    if (p6Content) {
      p6Content.classList.remove('p6-content-enter');
      void p6Content.offsetWidth;
      p6Content.classList.add('p6-content-enter');
    }
  } catch (err) {
    console.error('viewDetail error:', err);
  }
}

function renderDetailPage(item) {
  const detail = item.detail || {};
  const hero = detail.hero || {};
  const colorTheme = hero.colorTheme || 'teal';

  const heroEl = document.getElementById('p6-hero');
  if (heroEl) heroEl.className = 'p6-hero hero-' + colorTheme;

  const primaryIconContainer = document.getElementById('p6-hero-primary-icon');
  if (primaryIconContainer) {
    primaryIconContainer.innerHTML = '<i data-lucide="' + (hero.primaryIcon || 'map-pin') + '" class="h-40 w-40"></i>';
  }

  const heroName = document.querySelector('.p6-hero-name');
  if (heroName) heroName.textContent = item.name;

  const typeTag = document.getElementById('p6-tag-type');
  if (typeTag) {
    const typeLabels = getTypeLabels(item.types);
    typeTag.textContent = typeLabels[0] || '其他';
    typeTag.className = 'tag tag-' + colorTheme;
  }

  const tagDistrict = document.getElementById('p6-tag-district');
  if (tagDistrict) tagDistrict.textContent = item.district + ' · ' + item.distance + '分钟';

  const score = item.score || 90;
  const scoreSpan = document.querySelector('.p6-hero-score span');
  if (scoreSpan) {
    scoreSpan.textContent = '0%';
    setTimeout(() => {
      if (typeof animateNumber === 'function') {
        animateNumber(scoreSpan, 0, score, 600, '%');
      } else {
        scoreSpan.textContent = score + '%';
      }
    }, 150);
  }

  const elDesc = document.getElementById('p6-desc');
  if (elDesc) elDesc.textContent = detail.description || item.description || '';

  const elHours = document.getElementById('p6-business-hours');
  if (elHours) elHours.textContent = detail.businessHours || '暂无信息';

  const elAddress = document.getElementById('p6-address');
  if (elAddress) elAddress.textContent = detail.address || '暂无信息';

  const elTransport = document.getElementById('p6-transport');
  if (elTransport) elTransport.textContent = detail.transport || '暂无信息';

  const elParking = document.getElementById('p6-parking');
  if (elParking) elParking.textContent = detail.parking || '暂无信息';

  renderReasons(item);
  renderTicketInfo(detail);
  renderParentChildInfo(item, detail);
  renderTips(detail);
  renderReviews(detail);
  renderNearbyPlaces(detail);

  updateFavoriteState(item);
  updateConfirmButton();

  refreshIcons();
}

function getTypeLabels(types) {
  if (!types || types.length === 0) return [];
  const typeMap = {
    'museum': '博物馆', 'science': '科技馆', 'culture': '文化',
    'nature': '自然', 'park': '公园', 'zoo': '动物园',
    'farm': '农场', 'playground': '乐园', 'mall': '商场',
    'water': '水上', 'indoor': '室内', 'outdoor': '户外'
  };
  return types.map(t => typeMap[t] || t).slice(0, 2);
}

function renderReasons(item) {
  const list = document.getElementById('p6-reasons-list');
  if (!list) return;
  let reasons = item.reasons || [];
  if (reasons.length === 0) reasons = generateSimpleReasons(item);
  const displayReasons = reasons.slice(0, 4);
  list.innerHTML = displayReasons.map(r => '<div class="p6-reason-item"><i data-lucide="' + r.icon + '" class="h-4 w-4"></i><span>' + escapeHtml(r.text) + '</span></div>').join('');
}

function generateSimpleReasons(item) {
  const reasons = [];
  if (item.distance <= 20) reasons.push({ icon: 'map-pin', text: '距离仅' + item.distance + '分钟，说走就走' });
  else if (item.distance <= 30) reasons.push({ icon: 'map-pin', text: '距离车程' + item.distance + '分钟，半天刚好' });
  if (item.strollerFriendly) reasons.push({ icon: 'car', text: '推车可以畅行，带娃不累' });
  if (item.ageRange && item.ageRange.length > 0) reasons.push({ icon: 'baby', text: '适合' + item.ageRange.join('、') + '宝宝' });
  if (item.tags && item.tags.length > 0) reasons.push({ icon: 'star', text: item.tags[0] + '体验，寓教于乐' });
  if (item.crowdLevel && item.crowdLevel <= 2) reasons.push({ icon: 'users', text: '人流量适中，游玩体验好' });
  if (item.hasParking) reasons.push({ icon: 'parking-circle', text: '有停车场，停车方便' });
  return reasons;
}

function renderTicketInfo(detail) {
  const prices = document.getElementById('p6-ticket-prices');
  const booking = document.getElementById('p6-booking-info');
  if (!prices || !booking) return;
  const ticketPrice = detail.ticketPrice || {};
  let priceHtml = '';
  if (ticketPrice.price === '免费' || ticketPrice.price === 0 || (ticketPrice.adult === 0 && ticketPrice.child === 0)) {
    priceHtml = '<div>成人票 <strong>免费</strong> / 儿童票 <strong>免费</strong></div>';
  } else if (ticketPrice.price) {
    priceHtml = '<div>' + escapeHtml(ticketPrice.price) + '</div>';
  } else {
    priceHtml = '<div>成人票 <strong>' + (ticketPrice.adult || 0) + ' 元</strong> / 儿童票 <strong>' + (ticketPrice.child || 0) + ' 元</strong></div>';
  }
  if (ticketPrice.note) priceHtml += '<div>' + escapeHtml(ticketPrice.note) + '</div>';
  prices.innerHTML = priceHtml;
  if (detail.bookingInfo) {
    booking.innerHTML = '<div>预约方式：' + escapeHtml(detail.bookingInfo) + '</div>';
  } else {
    booking.innerHTML = '';
  }
  let tagHtml = '';
  if (ticketPrice.price === '免费' || ticketPrice.price === 0 || (ticketPrice.adult === 0 && ticketPrice.child === 0)) {
    tagHtml = '<div><span class="p6-ticket-tag"><i data-lucide="tag" class="h-3 w-3"></i>免费开放</span></div>';
  } else if (detail.bookingInfo && detail.bookingInfo.includes('提前')) {
    tagHtml = '<div><span class="p6-ticket-tag"><i data-lucide="tag" class="h-3 w-3"></i>建议提前购票</span></div>';
  }
  if (tagHtml) booking.innerHTML += tagHtml;
}

function renderParentChildInfo(item, detail) {
  const parentChildInfo = detail.parentChildInfo || {};
  const ageRange = document.getElementById('p6-age-range');
  if (ageRange) ageRange.textContent = item.ageRange ? item.ageRange.join('、') : '暂无信息';
  const stroller = document.getElementById('p6-stroller');
  if (stroller) stroller.textContent = item.strollerFriendly || parentChildInfo.strollerFriendly ? '是' : '否';
  const nursing = document.getElementById('p6-nursing-room');
  if (nursing) nursing.textContent = parentChildInfo.hasNursingRoom ? '有' : '无';
  const facilities = document.getElementById('p6-facilities');
  if (facilities) facilities.textContent = parentChildInfo.facilities ? parentChildInfo.facilities.join('、') : '暂无';
  const ageTag = document.getElementById('p6-age-tag');
  if (ageTag) ageTag.innerHTML = item.ageRange ? '<span class="tag">适合 ' + item.ageRange.join('、') + '</span>' : '';
}

function renderTips(detail) {
  const list = document.getElementById('p6-tips-list');
  if (!list) return;
  const tips = detail.tips || [];
  
  // 人流预警
  const crowdLevel = detail.crowdLevel || 3;
  if (crowdLevel >= 4) {
    tips.unshift('周末人流量较大，建议上午早去');
  } else if (crowdLevel === 3) {
    tips.unshift('周末人流量适中，正常出行即可');
  }
  
  if (tips.length === 0) {
    list.innerHTML = '<div class="p6-tip-item"><i data-lucide="info" class="h-3.5 w-3.5"></i><span>暂无特别注意事项</span></div>';
    return;
  }
  list.innerHTML = tips.map(tip => '<div class="p6-tip-item"><i data-lucide="info" class="h-3.5 w-3.5"></i><span>' + escapeHtml(tip) + '</span></div>').join('');
}

function renderReviews(detail) {
  const list = document.getElementById('p6-reviews-list');
  if (!list) return;
  const reviews = detail.reviews || [];
  if (reviews.length === 0) {
    list.innerHTML = '<div class="p6-review-item"><div class="p6-review-content">暂无评价</div></div>';
    return;
  }
  const avatarColors = [
    { bg: 'var(--color-pink-light)', icon: 'heart', color: 'var(--color-pink)' },
    { bg: 'var(--state-info-light)', icon: 'user', color: 'var(--state-info)' },
    { bg: 'var(--color-teal-light)', icon: 'star', color: 'var(--color-teal)' }
  ];
  list.innerHTML = reviews.map((review, index) => {
    const avatar = avatarColors[index % avatarColors.length];
    return '<div class="p6-review-item"><div class="p6-review-header"><div class="p6-review-avatar" style="background: ' + avatar.bg + ';"><i data-lucide="' + avatar.icon + '" class="h-3.5 w-3.5" style="color: ' + avatar.color + ';"></i></div><div class="p6-review-user">' + escapeHtml(review.user) + '</div><div class="p6-review-date">' + escapeHtml(review.date) + '</div></div><div class="p6-review-content">' + escapeHtml(review.content) + '</div></div>';
  }).join('');
}

function renderNearbyPlaces(detail) {
  const list = document.getElementById('p6-nearby-list');
  if (!list) return;
  const nearbyIds = detail.nearbyPlaces || [];
  if (nearbyIds.length === 0) {
    list.innerHTML = '<div class="p6-nearby-item"><div class="p6-nearby-name">暂无附近推荐</div></div>';
    return;
  }
  const nearbyPlaces = nearbyIds.map(id => places.find(p => p.id === id)).filter(Boolean);
  if (nearbyPlaces.length === 0) {
    list.innerHTML = '<div class="p6-nearby-item"><div class="p6-nearby-name">暂无附近推荐</div></div>';
    return;
  }
  const colorThemes = ['teal', 'purple', 'yellow', 'pink', 'primary'];
  list.innerHTML = nearbyPlaces.slice(0, 2).map((place, index) => {
    const theme = (place.detail && place.detail.hero && place.detail.hero.colorTheme) || colorThemes[index % colorThemes.length];
    const themeColor = 'var(--color-' + theme + ')';
    const bgColor = 'var(--color-' + theme + '-light)';
    const typeLabels = getTypeLabels(place.types);
    const primaryIcon = (place.detail && place.detail.hero && place.detail.hero.primaryIcon) || 'map-pin';
    return '<div class="p6-nearby-item" style="background: ' + bgColor + ';" onclick="viewDetail(' + place.id + ')"><div class="p6-nearby-header"><i data-lucide="' + primaryIcon + '" class="h-4 w-4" style="color: ' + themeColor + ';"></i><span class="p6-nearby-name">' + escapeHtml(place.name) + '</span></div><div class="p6-nearby-tags"><span class="p6-nearby-tag" style="background: rgba(0,0,0,0.08); color: ' + themeColor + ';">' + (typeLabels[0] || '景点') + '</span><span class="p6-nearby-tag" style="background: rgba(0,0,0,0.08); color: ' + themeColor + ';">' + escapeHtml(place.district) + '</span><span class="p6-nearby-tag" style="background: rgba(0,0,0,0.08); color: ' + themeColor + ';">' + (place.duration === 'half' ? '半天' : '全天') + '</span></div></div>';
  }).join('');
}

function updateFavoriteState(item) {
  const btn = document.getElementById('p6-btn-favorite');
  if (!btn) return;
  p6IsFavorited = collections.some(c => c.placeName === item.name);
  if (p6IsFavorited) btn.classList.add('active');
  else btn.classList.remove('active');
}

function updateConfirmButton() {
  p6IsConfirmed = false;
  const btn = document.getElementById('p6-btn-confirm');
  if (btn) {
    btn.textContent = '就这里了';
    btn.classList.remove('disabled');
  }
}

let currentDetailPlace = null;
let p6IsFavorited = false;
let p6IsConfirmed = false;

function toggleP6Favorite() {
  if (!currentDetailPlace) return;
  const btn = document.getElementById('p6-btn-favorite');
  p6IsFavorited = !p6IsFavorited;
  if (p6IsFavorited) {
    if (btn) {
      btn.classList.add('active');
      const span = btn.querySelector('span');
      if (span) span.textContent = '已收藏';
    }
    const exists = collections.some(c => c.placeName === currentDetailPlace.name);
    if (!exists) {
      const barColors = ['next-week', 'this-week', 'this-month'];
      const statusLabels = {
        'next-week': '⏳ 预留至下周',
        'this-week': '✅ 本周可去',
        'this-month': '📅 本月计划'
      };
      const statuses = {
        'next-week': 'nextWeek',
        'this-week': 'thisWeek',
        'this-month': 'thisMonth'
      };
      const randomColor = barColors[Math.floor(Math.random() * barColors.length)];
      collections.unshift({
        id: Date.now(),
        placeName: currentDetailPlace.name,
        status: statuses[randomColor],
        statusLabel: statusLabels[randomColor],
        barColor: randomColor,
        types: [currentDetailPlace.indoors ? '室内' : '户外'],
        note: '从详情页收藏'
      });
      updateCollectionCount();
      renderCollectionList();
      if (typeof store !== 'undefined' && store.set) {
        store.set('collections', collections);
      }
    }
    showMessage('added', 'success');
  } else {
    if (btn) {
      btn.classList.remove('active');
      const span = btn.querySelector('span');
      if (span) span.textContent = '收藏';
    }
    // 从收藏中移除
    const idx = collections.findIndex(c => c.placeName === currentDetailPlace.name);
    if (idx > -1) {
      collections.splice(idx, 1);
      updateCollectionCount();
      renderCollectionList();
      if (typeof store !== 'undefined' && store.set) {
        store.set('collections', collections);
      }
    }
    showMessage('removed', 'info');
  }
}

function p6AskFamily() {
  if (!currentDetailPlace) return;
  selectedDestination = currentDetailPlace;
  goToShare();
}

function p6Confirm() {
  if (p6IsConfirmed) return;
  if (!currentDetailPlace) return;

  // 弹出确认弹窗
  const confirmed = confirm(`确定选「${currentDetailPlace.name}」出发吗？`);
  if (!confirmed) return;

  showMessage('tripConfirmed', 'success');
  p6IsConfirmed = true;
  const btn = document.getElementById('p6-btn-confirm');
  if (btn) {
    btn.textContent = '已选定';
    btn.classList.add('disabled');
  }
}

function askFamily(id) {
  selectedDestination = currentRecommendations.find(item => item.id === id);
  goToShare();
}

function addToFav(id) {
  const item = currentRecommendations.find(i => i.id === id);
  const exists = collections.some(c => c.placeName === item.name);
  
  if (exists) {
    showMessage('exists', 'info');
    return;
  }
  
  const barColors = ['next-week', 'this-week', 'this-month'];
  const statusLabels = {
    'next-week': '⏳ 预留至下周',
    'this-week': '✅ 本周可去',
    'this-month': '📅 本月计划'
  };
  const statuses = {
    'next-week': 'nextWeek',
    'this-week': 'thisWeek',
    'this-month': 'thisMonth'
  };
  const randomColor = barColors[Math.floor(Math.random() * barColors.length)];
  
  collections.unshift({
    id: Date.now(),
    placeName: item.name,
    status: statuses[randomColor],
    statusLabel: statusLabels[randomColor],
    barColor: randomColor,
    types: [item.indoors ? '室内' : '户外'],
    note: '从推荐页收藏'
  });
  
  updateCollectionCount();
  renderCollectionList();
  if (typeof store !== 'undefined' && store.set) {
    store.set('collections', collections);
  }
  showMessage('added', 'success');
}

// 仅更新分享页DOM内容（不触发switchTab，避免递归）
function updateSharePage() {
  if (!selectedDestination) return;

  document.getElementById('p3-selected-name').textContent = selectedDestination.name;
  document.getElementById('p3-card-title').textContent = selectedDestination.name;
  document.getElementById('p3-card-score').textContent = `匹配度 ${selectedDestination.score}%`;

  const reason = selectedDestination.reasons && selectedDestination.reasons.length > 0
    ? selectedDestination.reasons[0].text
    : '是个适合带荔枝去的好地方~';
  document.getElementById('p3-card-reason').textContent = reason;

  if (selectedDestination.crowdLevel >= 4) {
    document.getElementById('p3-card-warning').textContent = '周末人较多，建议上午早去';
  } else {
    document.getElementById('p3-card-warning').textContent = '人不多，体验应该不错';
  }

  // 动态更新分享卡片中的年龄信息
  const ageEl = document.querySelector('.p3-card-info-grid .p3-card-info-item:nth-child(3) .p3-card-info-text');
  if (ageEl) {
    const ageGroup = currentParams.age || profile?.ageGroup;
    if (ageGroup) {
      ageEl.textContent = `适合${ageGroup}岁`;
    } else if (selectedDestination.ageRange && selectedDestination.ageRange.length > 0) {
      ageEl.textContent = `适合${selectedDestination.ageRange.join('、')}岁`;
    }
  }

  // 更新微信预览中的地点名
  const wechatTitle = document.querySelector('.p3-wechat-card-title');
  if (wechatTitle) wechatTitle.textContent = `遛娃搭子推荐 · ${selectedDestination.name}`;
  const wechatDesc = document.querySelector('.p3-wechat-card-desc');
  if (wechatDesc) wechatDesc.innerHTML = `<i data-lucide="star" class="h-3 w-3"></i> 匹配度${selectedDestination.score}% · 周六晴 · 半天`;
  const wechatBubble = document.querySelector('.p3-wechat-msg.right .p3-wechat-bubble:first-child');
  if (wechatBubble) wechatBubble.textContent = `这周去${selectedDestination.name}？`;
}

function goToShare() {
  if (!selectedDestination && currentRecommendations.length > 0) {
    selectedDestination = currentRecommendations[0];
  }

  if (!selectedDestination) {
    showMessage('noSelection', 'warning');
    return;
  }

  updateSharePage();
  switchTab('share');
}
