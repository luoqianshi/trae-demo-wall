// ============================================
// 懒婆娘的穿搭指南 - 前端应用
// ============================================

// ============================================
// 全局状态管理
// ============================================
const AppState = {
  profile: null,
  wardrobe: [],
  currentPage: 'home',
  specialDays: [],
  outfitHistory: []
};

// 今日数据缓存
const TodayData = {
  weather: null,
  almanac: null,
  horoscope: null,
  recommendation: null,
  message: null,
  currentScene: null,
  allScenes: null
};

// ============================================
// 工具函数
// ============================================
const Utils = {
  formatDate(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },
  getWeekday(date = new Date()) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
  },
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },
  getZodiacSign(month, day) {
    const signs = [
      { name: '摩羯座', start: [1, 1], end: [1, 19] },
      { name: '水瓶座', start: [1, 20], end: [2, 18] },
      { name: '双鱼座', start: [2, 19], end: [3, 20] },
      { name: '白羊座', start: [3, 21], end: [4, 19] },
      { name: '金牛座', start: [4, 20], end: [5, 20] },
      { name: '双子座', start: [5, 21], end: [6, 21] },
      { name: '巨蟹座', start: [6, 22], end: [7, 22] },
      { name: '狮子座', start: [7, 23], end: [8, 22] },
      { name: '处女座', start: [8, 23], end: [9, 22] },
      { name: '天秤座', start: [9, 23], end: [10, 23] },
      { name: '天蝎座', start: [10, 24], end: [11, 22] },
      { name: '射手座', start: [11, 23], end: [12, 21] },
      { name: '摩羯座', start: [12, 22], end: [12, 31] }
    ];
    return signs.find(s => {
      const [sm, sd] = s.start;
      const [em, ed] = s.end;
      if (month === sm && day >= sd) return true;
      if (month === em && day <= ed) return true;
      return false;
    })?.name || '摩羯座';
  }
};

// ============================================
// 模拟数据
// ============================================
const MockData = {
  // 颜色库
  colors: [
    { name: '白色', code: '#FFFFFF' },
    { name: '黑色', code: '#2D2D2D' },
    { name: '灰色', code: '#9E9E9E' },
    { name: '米色', code: '#F5F5DC' },
    { name: '棕色', code: '#8B4513' },
    { name: '红色', code: '#E53935' },
    { name: '粉色', code: '#FF69B4' },
    { name: '橙色', code: '#FF9800' },
    { name: '黄色', code: '#FFEB3B' },
    { name: '绿色', code: '#4CAF50' },
    { name: '蓝色', code: '#2196F3' },
    { name: '紫色', code: '#9C27B0' }
  ],

  // 衣物分类 - SVG图标（颜色可控）
  clothingCategories: [
    { id: 'top', name: '上装', icon: 'top' },
    { id: 'bottom', name: '下装', icon: 'bottom' },
    { id: 'dress', name: '连衣裙', icon: 'dress' },
    { id: 'outer', name: '外套', icon: 'outer' },
    { id: 'shoes', name: '鞋履', icon: 'shoes' },
    { id: 'accessory', name: '配饰', icon: 'accessory' }
  ],

  // SVG图标库 - 使用Iconify Phosphor图标（MIT开源，颜色可控）
  svgIcons: {
    top: `<iconify-icon icon="ph:t-shirt" width="28" height="28"></iconify-icon>`,
    bottom: `<iconify-icon icon="ph:pants" width="28" height="28"></iconify-icon>`,
    dress: `<iconify-icon icon="ph:dress" width="28" height="28"></iconify-icon>`,
    outer: `<iconify-icon icon="ph:coat-hanger" width="28" height="28"></iconify-icon>`,
    shoes: `<iconify-icon icon="ph:high-heel" width="28" height="28"></iconify-icon>`,
    accessory: `<iconify-icon icon="ph:star" width="28" height="28"></iconify-icon>`
  },

  // 根据衣物名称获取更精确的图标
  getItemIcon(item) {
    const name = item.name || '';
    if (name.includes('项链')) return `<iconify-icon icon="mdi:necklace" width="28" height="28"></iconify-icon>`;
    if (name.includes('耳环')) return `<iconify-icon icon="ph:ear" width="28" height="28"></iconify-icon>`;
    if (name.includes('手链') || name.includes('手镯')) return `<iconify-icon icon="ph:hand" width="28" height="28"></iconify-icon>`;
    if (name.includes('戒指')) return `<iconify-icon icon="ph:circle" width="28" height="28"></iconify-icon>`;
    if (name.includes('包') || name.includes('袋')) return `<iconify-icon icon="ph:handbag" width="28" height="28"></iconify-icon>`;
    if (name.includes('帽')) return `<iconify-icon icon="ph:hard-hat" width="28" height="28"></iconify-icon>`;
    if (name.includes('围巾') || name.includes('丝巾')) return `<iconify-icon icon="ph:scarf" width="28" height="28"></iconify-icon>`;
    if (name.includes('腰带')) return `<iconify-icon icon="ph:belt" width="28" height="28"></iconify-icon>`;
    if (name.includes('眼镜') || name.includes('墨镜')) return `<iconify-icon icon="ph:eyeglasses" width="28" height="28"></iconify-icon>`;
    if (name.includes('手表')) return `<iconify-icon icon="ph:watch" width="28" height="28"></iconify-icon>`;
    // 默认用分类图标
    const cat = this.clothingCategories.find(c => c.id === item.category);
    return cat && this.svgIcons[cat.icon] ? this.svgIcons[cat.icon] : this.svgIcons.top;
  },

  // 天气图标
  weatherIcons: {
    '晴': '☀️',
    '多云': '⛅',
    '阴': '☁️',
    '小雨': '🌧️',
    '大雨': '⛈️',
    '雪': '❄️'
  },

  // 老公留言库
  husbandMessages: [
    { text: '老婆今天穿什么都好看，自信点！', mood: 'encourage' },
    { text: '记得带伞，别淋湿了，我会心疼的', mood: 'care' },
    { text: '今天降温了，多穿点，别感冒了', mood: 'care' },
    { text: '你穿那件蓝色连衣裙特别美，今天试试？', mood: 'suggest' },
    { text: '工作再忙也要记得吃饭，爱你', mood: 'love' },
    { text: '今晚我做饭，你好好休息', mood: 'sweet' },
    { text: '你的笑容是我每天最大的动力', mood: 'love' },
    { text: '今天也要元气满满哦，加油！', mood: 'encourage' }
  ],

  // 星座运势模板
  horoscopeTemplates: {
    '白羊座': ['今日活力满满，适合尝试新风格', '红色单品能激发你的热情', '大胆穿搭，展现自信魅力'],
    '金牛座': ['今日适合稳重的穿搭', '经典款式最能衬托你的气质', '米色和棕色是你的幸运色'],
    '双子座': ['多变是你的标签', '尝试叠穿展现个性', '配饰能为你的造型加分'],
    '巨蟹座': ['温柔如你', '浅粉色系最能衬托气质', '柔软面料让你更舒适'],
    '狮子座': ['自信女王', '大胆尝试夸张配饰', '金色元素为你加分'],
    '处女座': ['细节控上线', '精致剪裁最能打动你', '简约搭配最显高级感'],
    '天秤座': ['优雅是你的代名词', '裙装是今日首选', '平衡配色让你魅力加分'],
    '天蝎座': ['神秘感加分', '深色系让你魅力倍增', '黑色单品是你的王牌'],
    '射手座': ['自由奔放', '休闲风最适合今天的你', '舒适穿搭让你行动自如'],
    '摩羯座': ['干练利落', '职场风让你气场全开', '经典配色展现专业感'],
    '水瓶座': ['特立独行', '混搭风展现你的创意', '独特搭配彰显个性'],
    '双鱼座': ['浪漫梦幻', '纱裙或飘逸面料最适合', '柔美风格最衬你']
  }
};

// ============================================
// 时尚穿搭推荐引擎 v2.0
// ============================================

// 颜色搭配知识库
const ColorRules = {
  warm: ['红色', '橙色', '棕色', '米色', '粉色', '黄色'],
  cool: ['蓝色', '绿色', '紫色', '灰色', '白色', '黑色'],
  neutral: ['白色', '黑色', '灰色', '米色', '棕色'],
  classicPairs: [
    ['白色', '蓝色'], ['白色', '黑色'], ['黑色', '灰色'],
    ['米色', '棕色'], ['白色', '米色'], ['蓝色', '白色'],
    ['黑色', '红色'], ['粉色', '白色'], ['灰色', '蓝色']
  ],
  maxColors: 3
};

// 风格特质库
const StyleTraits = {
  '优雅': { categories: ['dress', 'outer'], colors: ['黑色', '米色', '白色', '粉色'], occasions: ['约会', '正式'] },
  '干练': { categories: ['top', 'bottom', 'outer'], colors: ['黑色', '白色', '灰色', '蓝色'], occasions: ['通勤', '正式'] },
  '甜美': { categories: ['dress', 'top'], colors: ['粉色', '白色', '米色'], occasions: ['约会', '休闲'] },
  '酷飒': { categories: ['outer', 'bottom'], colors: ['黑色', '红色', '灰色'], occasions: ['休闲', '通勤'] },
  '休闲': { categories: ['top', 'bottom', 'shoes'], colors: ['白色', '蓝色', '灰色'], occasions: ['休闲', '运动'] },
  '复古': { categories: ['dress', 'outer'], colors: ['棕色', '米色', '红色'], occasions: ['约会', '休闲'] },
  '简约': { categories: ['top', 'bottom', 'dress'], colors: ['白色', '黑色', '灰色'], occasions: ['通勤', '居家'] },
  '活力': { categories: ['top', 'shoes'], colors: ['黄色', '橙色', '绿色'], occasions: ['运动', '休闲'] }
};

// 用户风格偏好映射
const UserStylePreferences = {
  '通勤': ['干练', '简约', '优雅'],
  '休闲': ['休闲', '甜美', '活力'],
  '运动': ['活力', '休闲', '简约'],
  '约会': ['优雅', '甜美', '复古'],
  '正式': ['干练', '优雅', '简约'],
  '居家': ['简约', '休闲', '甜美'],
  '复古': ['复古', '优雅', '甜美'],
  '简约': ['简约', '干练', '优雅']
};

// 时尚搭配规则
const FashionRules = {
  topBottomCombos: [
    { top: '衬衫', bottom: '西裤', style: '干练' },
    { top: 'T恤', bottom: '牛仔裤', style: '休闲' },
    { top: '雪纺衫', bottom: '半身裙', style: '优雅' },
    { top: '针织衫', bottom: '阔腿裤', style: '简约' }
  ],
  monochromeBonus: 15,
  contrastBonus: 10,
  neutralBalanceBonus: 8
};

// 场合权重
const OccasionFromYi = {
  '出行': ['休闲', '运动'],
  '会友': ['休闲', '约会'],
  '穿搭': ['通勤', '正式', '约会'],
  '购物': ['休闲'],
  '约会': ['约会', '正式']
};

// 季节温度对应表
const SeasonTemp = {
  '春': { min: 15, max: 25 },
  '夏': { min: 25, max: 40 },
  '秋': { min: 15, max: 25 },
  '冬': { min: -10, max: 15 }
};

// 穿搭场景定义
const OutfitScenes = {
  '通勤': {
    icon: 'ph:briefcase',
    label: '通勤',
    description: '干练专业',
    preferOccasions: ['通勤', '正式'],
    preferTraits: ['干练', '简约', '优雅'],
    minItems: 3
  },
  '约会': {
    icon: 'ph:heart',
    label: '约会',
    description: '温柔优雅',
    preferOccasions: ['约会', '正式'],
    preferTraits: ['优雅', '甜美', '复古'],
    minItems: 3
  },
  '休闲': {
    icon: 'ph:coffee',
    label: '休闲',
    description: '舒适随性',
    preferOccasions: ['休闲', '运动'],
    preferTraits: ['休闲', '简约', '活力'],
    minItems: 2
  },
  '运动': {
    icon: 'ph:sneaker',
    label: '运动',
    description: '活力动感',
    preferOccasions: ['运动', '休闲'],
    preferTraits: ['活力', '休闲', '简约'],
    minItems: 2
  },
  '居家': {
    icon: 'ph:house',
    label: '居家',
    description: '轻松自在',
    preferOccasions: ['居家'],
    preferTraits: ['简约', '休闲', '甜美'],
    minItems: 2
  }
};

// 给单件衣物评分
function scoreItem(item, context) {
  let score = 0;
  const { weather, almanac, profile } = context;

  // 季节匹配
  if (item.seasons) {
    const currentSeason = getSeasonFromTemp(weather.temp);
    if (item.seasons.includes(currentSeason)) score += 25;
    else score -= 15;
  }

  // 温度匹配
  const isLight = isLightFabric(item);
  const isHeavy = isHeavyFabric(item);
  if (weather.temp > 28 && isLight) score += 20;
  else if (weather.temp > 28 && isHeavy) score -= 20;
  else if (weather.temp < 18 && isHeavy) score += 20;
  else if (weather.temp < 18 && isLight) score -= 20;
  else score += 12;

  // 幸运色匹配
  if (almanac && almanac.luckyColor && item.color === almanac.luckyColor) {
    score += 15;
  }
  if (almanac && almanac.luckyColor) {
    if (ColorRules.warm.includes(almanac.luckyColor) && ColorRules.warm.includes(item.color)) score += 5;
    if (ColorRules.cool.includes(almanac.luckyColor) && ColorRules.cool.includes(item.color)) score += 5;
  }

  // 用户风格偏好匹配
  if (profile && profile.styles && profile.styles.length > 0) {
    const userTraits = profile.styles.flatMap(s => UserStylePreferences[s] || []);
    const itemTraits = getItemTraits(item);
    const traitMatch = userTraits.filter(t => itemTraits.includes(t));
    score += Math.min(traitMatch.length * 10, 20);
  }

  // 场合匹配
  if (almanac && almanac.yi) {
    let targetOccasions = [];
    almanac.yi.forEach(yi => {
      if (OccasionFromYi[yi]) targetOccasions.push(...OccasionFromYi[yi]);
    });
    if (item.occasions && targetOccasions.length > 0) {
      const match = item.occasions.filter(o => targetOccasions.includes(o));
      score += Math.min(match.length * 5, 10);
    }
  }

  // 星座加成
  if (profile) {
    const zodiacStyle = getZodiacStyle(profile.zodiac);
    if (zodiacStyle.preferCategories.includes(item.category)) score += 5;
    if (zodiacStyle.preferColors.includes(item.color)) score += 5;
  }

  return score;
}

// 获取衣物的风格特质
function getItemTraits(item) {
  const traits = [];
  for (const [traitName, traitData] of Object.entries(StyleTraits)) {
    const catMatch = traitData.categories.includes(item.category);
    const colorMatch = traitData.colors.includes(item.color);
    const occasionMatch = item.occasions && item.occasions.some(o => traitData.occasions.includes(o));
    if (catMatch || colorMatch || occasionMatch) {
      traits.push(traitName);
    }
  }
  return traits;
}

// 评估整套搭配的协调性
function scoreOutfit(items, context) {
  let harmonyScore = 0;
  const colors = items.map(i => i.color);
  const uniqueColors = [...new Set(colors)];

  // 颜色数量控制
  if (uniqueColors.length <= 2) harmonyScore += 20;
  else if (uniqueColors.length <= 3) harmonyScore += 15;
  else harmonyScore -= 10;

  // 同色系搭配加分
  const warmCount = colors.filter(c => ColorRules.warm.includes(c)).length;
  const coolCount = colors.filter(c => ColorRules.cool.includes(c)).length;
  if (warmCount >= 2 || coolCount >= 2) harmonyScore += FashionRules.monochromeBonus;

  // 经典搭配加分
  const tops = items.filter(i => i.category === 'top');
  const bottoms = items.filter(i => i.category === 'bottom');
  if (tops.length > 0 && bottoms.length > 0) {
    const isClassic = ColorRules.classicPairs.some(pair =>
      (pair[0] === tops[0].color && pair[1] === bottoms[0].color) ||
      (pair[1] === tops[0].color && pair[0] === bottoms[0].color)
    );
    if (isClassic) harmonyScore += 15;
  }

  // 中性色平衡加分
  const neutralCount = colors.filter(c => ColorRules.neutral.includes(c)).length;
  if (neutralCount >= 1 && uniqueColors.length >= 2) harmonyScore += FashionRules.neutralBalanceBonus;

  // 风格统一加分
  const allTraits = items.flatMap(i => getItemTraits(i));
  const traitCounts = {};
  allTraits.forEach(t => traitCounts[t] = (traitCounts[t] || 0) + 1);
  const maxTraitCount = Math.max(...Object.values(traitCounts), 0);
  if (maxTraitCount >= 2) harmonyScore += 12;

  return harmonyScore;
}

// 根据温度判断当前季节
function getSeasonFromTemp(temp) {
  if (temp >= 25) return '夏';
  if (temp >= 15) return '春';
  if (temp >= 5) return '秋';
  return '冬';
}

// 判断是否轻薄面料
function isLightFabric(item) {
  const lightKeywords = ['雪纺', 'T恤', '衬衫', '连衣裙', '碎花', '小白鞋'];
  return lightKeywords.some(k => item.name.includes(k));
}

// 判断是否厚重面料
function isHeavyFabric(item) {
  const heavyKeywords = ['西装', '风衣', '针织', '短靴', '铅笔裙'];
  return heavyKeywords.some(k => item.name.includes(k));
}

// 星座穿搭偏好
function getZodiacStyle(zodiac) {
  const styles = {
    '白羊座': { preferCategories: ['top', 'bottom'], preferColors: ['红色', '白色'] },
    '金牛座': { preferCategories: ['outer', 'accessory'], preferColors: ['绿色', '棕色'] },
    '双子座': { preferCategories: ['top', 'accessory'], preferColors: ['黄色', '蓝色'] },
    '巨蟹座': { preferCategories: ['dress', 'outer'], preferColors: ['白色', '银色'] },
    '狮子座': { preferCategories: ['dress', 'accessory'], preferColors: ['红色', '金色'] },
    '处女座': { preferCategories: ['top', 'bottom'], preferColors: ['灰色', '米色'] },
    '天秤座': { preferCategories: ['dress', 'accessory'], preferColors: ['粉色', '蓝色'] },
    '天蝎座': { preferCategories: ['dress', 'outer'], preferColors: ['黑色', '红色'] },
    '射手座': { preferCategories: ['top', 'shoes'], preferColors: ['紫色', '蓝色'] },
    '摩羯座': { preferCategories: ['outer', 'bottom'], preferColors: ['黑色', '棕色'] },
    '水瓶座': { preferCategories: ['top', 'accessory'], preferColors: ['蓝色', '绿色'] },
    '双鱼座': { preferCategories: ['dress', 'accessory'], preferColors: ['粉色', '紫色'] }
  };
  return styles[zodiac] || { preferCategories: [], preferColors: [] };
}

// 智能搭配主函数 - 为每个场景生成一套穿搭
function composeSmartOutfit(wardrobe) {
  const context = {
    weather: TodayData.weather || { temp: 25, weather: '多云', city: '北京' },
    almanac: TodayData.almanac || { yi: ['出行', '会友'], luckyColor: '粉色' },
    horoscope: TodayData.horoscope || { fortune: '今日运势不错', love: 3 },
    profile: AppState.profile || { zodiac: '天秤座', styles: ['通勤', '休闲'] }
  };

  // 按分类分组
  const byCategory = {};
  wardrobe.forEach(item => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  // 确定今日推荐场景
  const todayScenes = determineTodayScenes(context);
  
  // 为每个场景生成一套穿搭
  const sceneOutfits = {};
  todayScenes.forEach(sceneKey => {
    const scene = OutfitScenes[sceneKey];
    if (scene) {
      const outfit = generateSceneOutfit(wardrobe, scene, context, byCategory);
      if (outfit && outfit.items.length >= scene.minItems) {
        sceneOutfits[sceneKey] = outfit;
      }
    }
  });

  // 如果没有生成任何场景穿搭，生成一套默认穿搭
  if (Object.keys(sceneOutfits).length === 0) {
    const defaultOutfit = generateDefaultOutfit(wardrobe, context, byCategory);
    sceneOutfits['休闲'] = defaultOutfit;
  }

  return { type: 'multi-scene', scenes: sceneOutfits, context };
}

// 确定今日推荐场景
function determineTodayScenes(context) {
  const { almanac, profile } = context;
  const sceneScores = {};
  
  Object.keys(OutfitScenes).forEach(key => sceneScores[key] = 0);
  
  // 根据黄历"宜"加分
  if (almanac && almanac.yi) {
    almanac.yi.forEach(yi => {
      if (OccasionFromYi[yi]) {
        OccasionFromYi[yi].forEach(occasion => {
          Object.entries(OutfitScenes).forEach(([key, scene]) => {
            if (scene.preferOccasions.includes(occasion)) {
              sceneScores[key] += 20;
            }
          });
        });
      }
    });
  }
  
  // 根据用户偏好加分
  if (profile && profile.styles) {
    profile.styles.forEach(style => {
      if (OutfitScenes[style]) {
        sceneScores[style] += 15;
      }
    });
  }
  
  // 根据天气调整
  if (context.weather.temp > 30) {
    sceneScores['居家'] += 10;
    sceneScores['运动'] += 5;
  } else if (context.weather.temp < 15) {
    sceneScores['通勤'] += 5;
  }
  
  // 排序并返回前3个场景
  return Object.entries(sceneScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => key);
}

// 为特定场景生成穿搭
function generateSceneOutfit(wardrobe, scene, context, byCategory) {
  const scored = wardrobe.map(item => {
    let score = scoreItem(item, context);
    
    if (item.occasions) {
      const occasionMatch = item.occasions.filter(o => scene.preferOccasions.includes(o));
      score += occasionMatch.length * 15;
    }
    
    const itemTraits = getItemTraits(item);
    const traitMatch = itemTraits.filter(t => scene.preferTraits.includes(t));
    score += traitMatch.length * 10;
    
    return { ...item, score };
  });

  const getBest = (cat) => {
    if (!byCategory[cat] || byCategory[cat].length === 0) return null;
    const catItems = scored.filter(i => i.category === cat).sort((a, b) => b.score - a.score);
    const topN = Math.min(2, catItems.length);
    return catItems[Math.floor(Math.random() * topN)];
  };

  let items = [];
  
  if (scene.label === '约会' || scene.label === '居家') {
    const dress = getBest('dress');
    if (dress) items.push(dress);
  }
  
  if (items.length === 0) {
    const top = getBest('top');
    const bottom = getBest('bottom');
    if (top && bottom) {
      items.push(top, bottom);
    } else if (top) {
      items.push(top);
    }
  }
  
  const shoe = getBest('shoes');
  if (shoe && !items.some(i => i.category === 'shoes')) items.push(shoe);
  
  if (scene.label === '约会' || scene.label === '通勤') {
    const outer = getBest('outer');
    if (outer && !items.some(i => i.category === 'outer') && context.weather.temp <= 28) {
      items.push(outer);
    }
  }
  
  if (scene.label === '约会' || scene.label === '通勤') {
    const accessory = getBest('accessory');
    if (accessory && !items.some(i => i.category === 'accessory') && items.length < 5) {
      items.push(accessory);
    }
  }

  const reasons = generateOutfitReasons(items, context);
  
  reasons.unshift({
    icon: '✨',
    text: `这套搭配专为"${scene.label}"场景设计，${scene.description}`
  });

  return { items, reasons, scene: scene.label };
}

// 生成默认穿搭
function generateDefaultOutfit(wardrobe, context, byCategory) {
  const scored = wardrobe.map(item => ({ ...item, score: scoreItem(item, context) }));
  
  const getBest = (cat) => {
    const catItems = scored.filter(i => i.category === cat).sort((a, b) => b.score - a.score);
    return catItems.length > 0 ? catItems[0] : null;
  };

  let items = [];
  const top = getBest('top');
  const bottom = getBest('bottom');
  if (top && bottom) items.push(top, bottom);
  
  const shoe = getBest('shoes');
  if (shoe) items.push(shoe);
  
  const accessory = getBest('accessory');
  if (accessory && items.length < 4) items.push(accessory);

  const reasons = generateOutfitReasons(items, context);
  return { items, reasons, scene: '休闲' };
}

// 生成搭配原因
function generateOutfitReasons(items, context) {
  const reasons = [];
  const { weather, almanac, profile } = context;
  const zodiac = profile.zodiac || '天秤座';

  const allTraits = items.flatMap(i => getItemTraits(i));
  const traitCounts = {};
  allTraits.forEach(t => traitCounts[t] = (traitCounts[t] || 0) + 1);
  const dominantTrait = Object.entries(traitCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '优雅';

  // 天气原因
  const cityName = weather.city || '北京';
  if (weather.temp > 28) {
    const lightItems = items.filter(i => isLightFabric(i));
    if (lightItems.length > 0) {
      reasons.push({ icon: '🌤️', text: `${cityName}今天 ${weather.temp}°C，${lightItems.map(i => i.name).join('、')}透气不闷热，夏天穿刚刚好` });
    } else {
      reasons.push({ icon: '🌤️', text: `${cityName}今天 ${weather.temp}°C，天气有点热，记得选透气面料哦` });
    }
  } else if (weather.temp < 18) {
    const heavyItems = items.filter(i => isHeavyFabric(i));
    if (heavyItems.length > 0) {
      reasons.push({ icon: '🌤️', text: `${cityName}今天 ${weather.temp}°C，${heavyItems.map(i => i.name).join('、')}保暖又有型` });
    } else {
      reasons.push({ icon: '🌤️', text: `${cityName}今天 ${weather.temp}°C，气温偏低，建议注意保暖` });
    }
  } else {
    reasons.push({ icon: '🌤️', text: `${cityName}今天 ${weather.temp}°C，${weather.weather}，气温舒适，穿这套刚刚好` });
  }

  // 风格原因
  const styleDescriptions = {
    '优雅': '整体偏优雅风，温柔又有气质，适合今天的场合',
    '干练': '干练利落的搭配，气场全开，专业感满满',
    '甜美': '甜美风穿搭，软萌又可爱，心情都会变好',
    '酷飒': '酷飒有型，帅气中带着女人味，回头率超高',
    '休闲': '休闲舒适，随性自然，轻松自在过一天',
    '复古': '复古韵味，经典不过时，品味藏在细节里',
    '简约': '简约不简单，less is more，高级感拉满',
    '活力': '活力满满，元气十足，今天也是能量满满的一天'
  };
  if (styleDescriptions[dominantTrait]) {
    reasons.push({ icon: '✨', text: styleDescriptions[dominantTrait] });
  }

  // 黄历原因
  const luckyItems = items.filter(i => i.color === almanac.luckyColor);
  if (luckyItems.length > 0) {
    reasons.push({ icon: '📅', text: `黄历宜${almanac.yi.slice(0, 2).join('、')}，${luckyItems.map(i => i.name).join('、')}的${almanac.luckyColor}是今日幸运色，好运加成` });
  } else {
    reasons.push({ icon: '📅', text: `黄历宜${almanac.yi.slice(0, 2).join('、')}，今日幸运色是${almanac.luckyColor}` });
  }

  // 星座原因
  const zodiacFortunes = {
    '白羊座': '今天活力值爆表，穿这套能让你更有冲劲',
    '金牛座': '今天适合稳重点，经典款最衬你的气质',
    '双子座': '今天心情多变，这套百搭款怎么穿都对',
    '巨蟹座': '今天温柔感拉满，柔软面料让你更舒服',
    '狮子座': '今天气场全开，大胆穿，你本来就是焦点',
    '处女座': '今天细节控上线，这套精致剪裁正合你意',
    '天秤座': '今天优雅在线，平衡配色让你魅力加分',
    '天蝎座': '今天神秘感满满，深色系让你更有魅力',
    '射手座': '今天自由奔放，舒适穿搭让你行动自如',
    '摩羯座': '今天干练利落，这套职场风让你气场全开',
    '水瓶座': '今天创意十足，独特搭配彰显你的个性',
    '双鱼座': '今天浪漫满溢，柔美风格最衬你的气质'
  };
  const fortuneText = zodiacFortunes[zodiac] || '今天运势不错，穿这套准没错';
  
  const zodiacStyle = getZodiacStyle(zodiac);
  const zodiacMatch = items.find(i => zodiacStyle.preferCategories.includes(i.category) || zodiacStyle.preferColors.includes(i.color));
  if (zodiacMatch) {
    reasons.push({ icon: '⭐', text: `${fortuneText}，${zodiacMatch.name}特别适合今天的你` });
  } else {
    reasons.push({ icon: '⭐', text: fortuneText });
  }

  // 颜色搭配原因
  const uniqueColors = [...new Set(items.map(i => i.color))];
  if (uniqueColors.length <= 2) {
    reasons.push({ icon: '🎨', text: `${uniqueColors.join('、')}两色搭配，简约大方，高级感拿捏住了` });
  } else if (uniqueColors.length <= 3) {
    reasons.push({ icon: '🎨', text: `${uniqueColors.join('、')}三色组合，层次分明又不杂乱，配色很讲究` });
  }

  return reasons;
}

// ============================================
// 页面渲染函数
// ============================================

// 渲染首页
function renderHomePage(container) {
  const profile = AppState.profile || {};
  const today = Utils.formatDate();
  const weekday = Utils.getWeekday();

  container.innerHTML = `
    <div class="page page-transition-enter">
      <div style="margin-bottom:var(--space-md);">
        <p style="color:var(--text-secondary);font-size:var(--font-size-sm);">${today} ${weekday}</p>
      </div>

      <div class="card letter-card" id="message-card">
        <div class="letter-stamp"><div class="letter-stamp-inner">💌</div></div>
        <div id="message-skeleton">
          <div class="skeleton skeleton-text" style="width:80%;"></div>
          <div class="skeleton skeleton-text" style="width:60%;"></div>
          <div class="skeleton skeleton-text-sm" style="width:40%;margin-top:var(--space-md);"></div>
        </div>
        <div id="message-content" style="display:none;"></div>
      </div>

      <div class="card outfit-card" id="outfit-card">
        <div id="outfit-skeleton">
          <div class="skeleton skeleton-title" style="margin:0 auto var(--space-lg);"></div>
          <div style="display:flex;justify-content:center;gap:var(--space-md);margin-bottom:var(--space-lg);">
            <div class="skeleton skeleton-circle" style="width:56px;height:56px;"></div>
            <div class="skeleton skeleton-circle" style="width:56px;height:56px;"></div>
            <div class="skeleton skeleton-circle" style="width:56px;height:56px;"></div>
          </div>
          <div class="skeleton skeleton-button"></div>
        </div>
        <div id="outfit-content" style="display:none;"></div>
      </div>

      <div class="card" id="reason-card">
        <div class="card-title">💡 为什么推荐这套？</div>
        <div id="reason-skeleton">
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text" style="width:90%;"></div>
          <div class="skeleton skeleton-text" style="width:70%;"></div>
        </div>
        <div id="reason-content" style="display:none;"></div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:var(--space-md);margin-bottom:var(--space-md);">
        <div class="card" id="weather-card" style="padding:var(--space-md);">
          <div id="weather-skeleton">
            <div class="skeleton skeleton-circle" style="width:40px;height:40px;margin:0 auto var(--space-sm);"></div>
            <div class="skeleton skeleton-text" style="width:60%;margin:0 auto;"></div>
            <div class="skeleton skeleton-text-sm" style="width:40%;margin:var(--space-sm) auto 0;"></div>
          </div>
          <div id="weather-content" style="display:none;"></div>
        </div>
        <div class="card" id="almanac-card" style="padding:var(--space-md);">
          <div id="almanac-skeleton">
            <div class="skeleton skeleton-circle" style="width:40px;height:40px;margin:0 auto var(--space-sm);"></div>
            <div class="skeleton skeleton-text" style="width:60%;margin:0 auto;"></div>
            <div class="skeleton skeleton-text-sm" style="width:40%;margin:var(--space-sm) auto 0;"></div>
          </div>
          <div id="almanac-content" style="display:none;"></div>
        </div>
        <div class="card" id="horoscope-card" style="padding:var(--space-md);">
          <div id="horoscope-skeleton">
            <div class="skeleton skeleton-circle" style="width:40px;height:40px;margin:0 auto var(--space-sm);"></div>
            <div class="skeleton skeleton-text" style="width:60%;margin:0 auto;"></div>
            <div class="skeleton skeleton-text-sm" style="width:40%;margin:var(--space-sm) auto 0;"></div>
          </div>
          <div id="horoscope-content" style="display:none;"></div>
        </div>
      </div>

      <div id="special-day-countdown" style="display:none;"></div>
    </div>
  `;

  loadHusbandMessage();
  loadWeather();
  loadAlmanac();
  loadHoroscope();
  loadRecommendation();
  loadSpecialDayCountdown();
}

function loadSpecialDayCountdown() {
  const container = document.getElementById('special-day-countdown');
  if (!container) return;

  const upcoming = getUpcomingSpecialDay();
  if (!upcoming) {
    container.style.display = 'none';
    return;
  }

  const daysLeft = upcoming.daysLeft;
  const isToday = daysLeft === 0;
  const isNear = daysLeft <= 7;
  const typeIcon = upcoming.type === 'birthday' ? '🎂' : upcoming.type === 'anniversary' ? '💍' : '💕';
  const urgencyText = isToday ? '就是今天！' : daysLeft === 1 ? '明天！' : `还有 ${daysLeft} 天`;
  const dateStr = (() => {
    const d = new Date(upcoming.date);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  })();

  container.style.display = 'block';
  container.innerHTML = `
    <div class="card" style="margin-top:var(--space-md);background:linear-gradient(135deg, #FFF8F3 0%, #FFE8D6 100%);border:1px solid var(--accent-light);position:relative;overflow:hidden;">
      <div style="position:absolute;top:-10px;right:-10px;font-size:60px;opacity:0.1;">${typeIcon}</div>
      <div style="display:flex;align-items:center;gap:var(--space-md);position:relative;">
        <div style="font-size:32px;flex-shrink:0;">${typeIcon}</div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:var(--font-size-md);color:var(--ink);">${upcoming.name}</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:2px;">${dateStr}</div>
        </div>
        <div style="text-align:center;flex-shrink:0;">
          <div style="font-size:var(--font-size-lg);font-weight:700;color:${isToday ? 'var(--danger)' : isNear ? 'var(--warning)' : 'var(--accent)'};">${urgencyText}</div>
        </div>
      </div>
      ${isNear ? `
        <div style="margin-top:var(--space-sm);padding-top:var(--space-sm);border-top:1px dashed var(--border-light);display:flex;gap:var(--space-sm);">
          <button class="btn btn-primary btn-sm" style="flex:1;font-size:var(--font-size-xs);" onclick="generateSpecialOutfit('${upcoming.id}')">👗 浪漫穿搭</button>
          <button class="btn btn-secondary btn-sm" style="flex:1;font-size:var(--font-size-xs);" onclick="shareSpecialDay('${upcoming.id}')">📤 提醒卡片</button>
        </div>
      ` : ''}
    </div>
  `;
}

// 打字机效果
function typewriterEffect(element, text, speed = 30) {
  return new Promise(resolve => {
    element.textContent = '';
    let i = 0;
    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    element.appendChild(cursor);

    const timer = setInterval(() => {
      if (i < text.length) {
        cursor.before(text[i]);
        i++;
      } else {
        clearInterval(timer);
        setTimeout(() => {
          cursor.remove();
          resolve();
        }, 1500);
      }
    }, speed);
  });
}

// 按钮涟漪效果
function createRipple(event, button) {
  const ripple = document.createElement('span');
  ripple.className = 'btn-ripple';
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
  button.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

// 为所有按钮添加涟漪监听
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (btn) createRipple(e, btn);
});

// 加载老公留言
async function loadHusbandMessage() {
  const skeleton = document.getElementById('message-skeleton');
  const content = document.getElementById('message-content');

  await Utils.delay(400);

  const messages = MockData.husbandMessages;
  const msg = messages[Math.floor(Math.random() * messages.length)];
  TodayData.message = msg;

  skeleton.style.display = 'none';
  content.style.display = 'block';

  content.innerHTML = `
    <div class="letter-text" id="letter-text"></div>
    <div class="letter-signature">— 你的老公</div>
  `;

  const textEl = document.getElementById('letter-text');
  await typewriterEffect(textEl, msg.text, 30);
}

// 加载穿搭推荐（核心）- 多场景版本
async function loadRecommendation() {
  const skeleton = document.getElementById('outfit-skeleton');
  const content = document.getElementById('outfit-content');
  const wardrobe = AppState.wardrobe;

  await Utils.delay(600);

  let recommendation;
  if (wardrobe.length > 0) {
    recommendation = composeSmartOutfit(wardrobe);
  } else {
    recommendation = {
      type: 'multi-scene',
      scenes: {
        '休闲': {
          items: [
            { name: '白色T恤', category: 'top', color: '白色', reason: '百搭经典' },
            { name: '蓝色牛仔裤', category: 'bottom', color: '蓝色', reason: '舒适休闲' },
            { name: '小白鞋', category: 'shoes', color: '白色', reason: '清新百搭' }
          ],
          reasons: [
            { icon: '✨', text: '这套搭配专为"休闲"场景设计，舒适随性' },
            { icon: '🌤️', text: '今天天气不错，这套休闲搭配刚刚好' }
          ],
          scene: '休闲'
        }
      }
    };
  }
  TodayData.recommendation = recommendation;

  skeleton.style.display = 'none';
  content.style.display = 'block';

  const scenes = recommendation.scenes || {};
  const sceneKeys = Object.keys(scenes);
  const firstScene = sceneKeys[0] || '休闲';

  const sceneTabs = sceneKeys.map((key, index) => {
    const scene = OutfitScenes[key] || { label: key, icon: 'ph:star' };
    const isActive = index === 0;
    return `
      <button class="scene-tab ${isActive ? 'active' : ''}" data-scene="${key}" onclick="switchScene('${key}')" style="
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-full);
        border: none;
        background: ${isActive ? 'var(--primary)' : 'var(--bg-card)'};
        color: ${isActive ? '#fff' : 'var(--text-secondary)'};
        font-size: var(--font-size-sm);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
        box-shadow: ${isActive ? 'var(--shadow-sm)' : 'none'};
      ">
        <iconify-icon icon="${scene.icon}" width="16" height="16"></iconify-icon>
        ${scene.label}
      </button>
    `;
  }).join('');

  const firstOutfit = scenes[firstScene];
  const outfitIcons = firstOutfit.items.map(item => {
    const cat = MockData.clothingCategories.find(c => c.id === item.category);
    const colorInfo = MockData.colors.find(c => c.name === item.color);
    const isLightBg = colorInfo && (colorInfo.code === '#FFFFFF' || colorInfo.code === '#F5F5DC' || colorInfo.code === '#FFEB3B');
    const textColor = isLightBg ? '#333' : '#fff';
    const borderStyle = isLightBg ? 'border:1px solid var(--border-light);' : '';
    const svgIcon = MockData.getItemIcon(item);
    return `
      <div class="outfit-item" style="text-align:center;flex:1;min-width:60px;">
        <div class="outfit-item-avatar" style="background:${colorInfo ? colorInfo.code : 'var(--primary-bg)'};color:${textColor};${borderStyle}">
          ${svgIcon}
        </div>
        <div style="font-size:var(--font-size-xs);font-weight:500;">${item.name}</div>
        <div style="font-size:var(--font-size-xs);color:var(--text-muted);">${cat ? cat.name : ''}</div>
      </div>
    `;
  }).join('');

  content.innerHTML = `
    <div style="text-align:center;margin-bottom:var(--space-md);">
      <div style="font-size:var(--font-size-xs);color:var(--primary);font-weight:500;margin-bottom:var(--space-xs);">👗 今日穿搭推荐</div>
      <h2 style="font-size:var(--font-size-xl);font-weight:700;">为你精选的搭配</h2>
    </div>
    
    <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-lg);overflow-x:auto;padding-bottom:var(--space-sm);-webkit-overflow-scrolling:touch;">
      ${sceneTabs}
    </div>
    
    <div id="scene-outfit-display">
      <div style="display:flex;justify-content:center;align-items:flex-start;gap:var(--space-md);margin-bottom:var(--space-lg);flex-wrap:wrap;">
        ${outfitIcons}
      </div>
    </div>
    
    <div style="display:flex;gap:var(--space-md);">
      <button class="btn btn-primary" style="flex:1;" onclick="Router.navigate('outfit')">👀 查看全身搭配</button>
      <button class="btn btn-secondary" style="flex:1;" onclick="refreshRecommendation(this)">
        <span id="dice-icon">🎲</span> 换一套
      </button>
    </div>
  `;

  TodayData.currentScene = firstScene;
  TodayData.allScenes = scenes;

  updateReasonCard(firstOutfit.reasons);
}

// 切换场景
function switchScene(sceneKey) {
  const scenes = TodayData.allScenes;
  if (!scenes || !scenes[sceneKey]) return;

  const outfit = scenes[sceneKey];
  TodayData.currentScene = sceneKey;

  document.querySelectorAll('.scene-tab').forEach(tab => {
    const isActive = tab.dataset.scene === sceneKey;
    tab.style.background = isActive ? 'var(--primary)' : 'var(--bg-card)';
    tab.style.color = isActive ? '#fff' : 'var(--text-secondary)';
    tab.style.boxShadow = isActive ? 'var(--shadow-sm)' : 'none';
    tab.classList.toggle('active', isActive);
  });

  const display = document.getElementById('scene-outfit-display');
  if (display) {
    const outfitIcons = outfit.items.map(item => {
      const cat = MockData.clothingCategories.find(c => c.id === item.category);
      const colorInfo = MockData.colors.find(c => c.name === item.color);
      const isLightBg = colorInfo && (colorInfo.code === '#FFFFFF' || colorInfo.code === '#F5F5DC' || colorInfo.code === '#FFEB3B');
      const textColor = isLightBg ? '#333' : '#fff';
      const borderStyle = isLightBg ? 'border:1px solid var(--border-light);' : '';
      const svgIcon = MockData.getItemIcon(item);
      return `
        <div class="outfit-item" style="text-align:center;flex:1;min-width:60px;">
          <div class="outfit-item-avatar" style="background:${colorInfo ? colorInfo.code : 'var(--primary-bg)'};color:${textColor};${borderStyle}">
            ${svgIcon}
          </div>
          <div style="font-size:var(--font-size-xs);font-weight:500;">${item.name}</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-muted);">${cat ? cat.name : ''}</div>
        </div>
      `;
    }).join('');

    display.innerHTML = `
      <div style="display:flex;justify-content:center;align-items:flex-start;gap:var(--space-md);margin-bottom:var(--space-lg);flex-wrap:wrap;animation:pageEnter 0.3s ease;">
        ${outfitIcons}
      </div>
    `;
  }

  updateReasonCard(outfit.reasons);
}

// 刷新推荐
function refreshRecommendation(btn) {
  const dice = document.getElementById('dice-icon');
  if (dice) dice.classList.add('dice-rolling');

  const content = document.getElementById('outfit-content');
  content.style.opacity = '0';
  content.style.transition = 'opacity 0.3s ease';

  setTimeout(() => {
    loadRecommendation();
    if (dice) dice.classList.remove('dice-rolling');
  }, 300);
}

// 更新推荐原因卡片
function updateReasonCard(reasons) {
  const skeleton = document.getElementById('reason-skeleton');
  const content = document.getElementById('reason-content');
  if (!skeleton || !content) return;

  if (!reasons || reasons.length === 0) return;

  skeleton.style.display = 'none';
  content.style.display = 'block';

  const reasonsHtml = reasons.map(r => `
    <div class="flex items-center gap-md" style="margin-bottom:var(--space-sm);padding:var(--space-sm);background:var(--bg-main);border-radius:var(--radius-md);">
      <div style="font-size:20px;flex-shrink:0;">${r.icon}</div>
      <div style="font-size:var(--font-size-sm);color:var(--text-secondary);line-height:1.6;">${r.text}</div>
    </div>
  `).join('');

  content.innerHTML = reasonsHtml;
}

// 加载天气
async function loadWeather() {
  const skeleton = document.getElementById('weather-skeleton');
  const content = document.getElementById('weather-content');
  const profile = AppState.profile || {};
  const city = profile.city || '北京';

  await Utils.delay(500);

  const weathers = ['晴', '多云', '阴', '小雨'];
  const weather = weathers[Math.floor(Math.random() * weathers.length)];
  const temp = 20 + Math.floor(Math.random() * 15);
  const icon = MockData.weatherIcons[weather] || '☀️';

  TodayData.weather = { city, weather, temp };

  skeleton.style.display = 'none';
  content.style.display = 'block';

  const weatherAnimClass = weather === '晴' ? 'sun-rotating' : 'weather-icon-float';

  content.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:32px;margin-bottom:var(--space-xs);" class="${weatherAnimClass}">${icon}</div>
      <div style="font-size:var(--font-size-lg);font-weight:700;">${temp}°C</div>
      <div style="font-size:var(--font-size-xs);color:var(--text-muted);">${weather}</div>
      <div style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-top:var(--space-xs);">${city}</div>
    </div>
  `;
}

// 加载黄历
async function loadAlmanac() {
  const skeleton = document.getElementById('almanac-skeleton');
  const content = document.getElementById('almanac-content');

  await Utils.delay(600);

  const yiList = ['出行', '会友', '穿搭', '购物', '约会'];
  const jiList = ['争吵', '熬夜', '暴饮暴食'];
  const luckyColors = ['红色', '粉色', '米色', '白色'];
  const luckyColor = luckyColors[Math.floor(Math.random() * luckyColors.length)];
  const luckyNum = Math.floor(Math.random() * 9) + 1;

  TodayData.almanac = { yi: yiList, ji: jiList, luckyColor, luckyNum };

  skeleton.style.display = 'none';
  content.style.display = 'block';

  content.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:28px;margin-bottom:var(--space-xs);">📅</div>
      <div style="font-size:var(--font-size-sm);font-weight:500;margin-bottom:var(--space-xs);">今日黄历</div>
      <div style="font-size:var(--font-size-xs);color:var(--success);">宜 ${yiList.slice(0, 2).join(' ')}</div>
      <div style="font-size:var(--font-size-xs);color:var(--danger);margin-top:2px;">忌 ${jiList.slice(0, 2).join(' ')}</div>
      <div style="margin-top:var(--space-sm);">
        <span class="tag tag-primary" style="font-size:10px;padding:2px 8px;">${luckyColor}</span>
      </div>
    </div>
  `;
}

// 加载星座运势
async function loadHoroscope() {
  const skeleton = document.getElementById('horoscope-skeleton');
  const content = document.getElementById('horoscope-content');
  const profile = AppState.profile || {};
  const zodiac = profile.zodiac || '天秤座';

  await Utils.delay(700);

  const templates = MockData.horoscopeTemplates[zodiac] || ['今日运势不错，保持好心情'];
  const fortune = templates[Math.floor(Math.random() * templates.length)];
  const love = Math.floor(Math.random() * 3) + 3;

  TodayData.horoscope = { fortune, love };

  skeleton.style.display = 'none';
  content.style.display = 'block';

  content.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:28px;margin-bottom:var(--space-xs);">⭐</div>
      <div style="font-size:var(--font-size-sm);font-weight:500;margin-bottom:var(--space-xs);">${zodiac}</div>
      <div style="font-size:var(--font-size-xs);color:var(--text-secondary);line-height:1.5;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${fortune}</div>
      <div style="margin-top:var(--space-sm);font-size:var(--font-size-xs);color:var(--primary);">${'★'.repeat(love)}${'☆'.repeat(5-love)}</div>
    </div>
  `;
}

// ============================================
// 其他页面渲染函数（简化版）
// ============================================

function renderProfilePage(container) {
  container.innerHTML = `
    <div class="page">
      <h1 style="font-size:var(--font-size-2xl);margin-bottom:var(--space-lg);">个人档案</h1>
      <div class="card">
        <h3 style="margin-bottom:var(--space-md);">基本信息</h3>
        <div style="margin-bottom:var(--space-md);">
          <label style="display:block;margin-bottom:var(--space-xs);color:var(--text-secondary);">昵称</label>
          <input type="text" id="profile-nickname" class="form-input" value="${AppState.profile?.nickname || ''}" placeholder="请输入昵称">
        </div>
        <div style="margin-bottom:var(--space-md);">
          <label style="display:block;margin-bottom:var(--space-xs);color:var(--text-secondary);">城市</label>
          <input type="text" id="profile-city" class="form-input" value="${AppState.profile?.city || ''}" placeholder="请输入城市">
        </div>
        <div style="margin-bottom:var(--space-md);">
          <label style="display:block;margin-bottom:var(--space-xs);color:var(--text-secondary);">星座</label>
          <select id="profile-zodiac" class="form-input">
            <option value="">请选择</option>
            ${['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'].map(z => 
              `<option value="${z}" ${AppState.profile?.zodiac === z ? 'selected' : ''}>${z}</option>`
            ).join('')}
          </select>
        </div>
        <div style="margin-bottom:var(--space-md);">
          <label style="display:block;margin-bottom:var(--space-xs);color:var(--text-secondary);">体型</label>
          <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);">
            ${['偏瘦','标准','微胖','丰满'].map(bt => {
              const isSelected = AppState.profile?.bodyType === bt;
              return `<label style="display:flex;align-items:center;gap:var(--space-xs);padding:var(--space-sm) var(--space-md);background:${isSelected ? 'var(--primary-bg)' : 'var(--bg-main)'};border-radius:var(--radius-full);cursor:pointer;">
                <input type="radio" name="profile-bodyType" value="${bt}" ${isSelected ? 'checked' : ''}>
                <span>${bt}</span>
              </label>`;
            }).join('')}
          </div>
        </div>
        <div style="margin-bottom:var(--space-md);">
          <label style="display:block;margin-bottom:var(--space-xs);color:var(--text-secondary);">肤色</label>
          <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);">
            ${['冷白皮','暖黄皮','小麦色','偏黑'].map(st => {
              const isSelected = AppState.profile?.skinTone === st;
              return `<label style="display:flex;align-items:center;gap:var(--space-xs);padding:var(--space-sm) var(--space-md);background:${isSelected ? 'var(--primary-bg)' : 'var(--bg-main)'};border-radius:var(--radius-full);cursor:pointer;">
                <input type="radio" name="profile-skinTone" value="${st}" ${isSelected ? 'checked' : ''}>
                <span>${st}</span>
              </label>`;
            }).join('')}
          </div>
        </div>
        <div style="margin-bottom:var(--space-md);">
          <label style="display:block;margin-bottom:var(--space-xs);color:var(--text-secondary);">风格偏好（多选）</label>
          <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);">
            ${['通勤','休闲','运动','约会','正式','居家'].map(style => {
              const isSelected = AppState.profile?.styles?.includes(style);
              return `<label style="display:flex;align-items:center;gap:var(--space-xs);padding:var(--space-sm) var(--space-md);background:${isSelected ? 'var(--primary-bg)' : 'var(--bg-main)'};border-radius:var(--radius-full);cursor:pointer;">
                <input type="checkbox" name="profile-styles" value="${style}" ${isSelected ? 'checked' : ''}>
                <span>${style}</span>
              </label>`;
            }).join('')}
          </div>
        </div>
        <button class="btn btn-primary btn-block" onclick="saveProfile()">保存档案</button>
      </div>
    </div>
  `;
}

function saveProfile() {
  const nickname = document.getElementById('profile-nickname').value;
  const city = document.getElementById('profile-city').value;
  const zodiac = document.getElementById('profile-zodiac').value;
  const styleCheckboxes = document.querySelectorAll('input[name="profile-styles"]:checked');
  const styles = Array.from(styleCheckboxes).map(cb => cb.value);
  const bodyTypeRadio = document.querySelector('input[name="profile-bodyType"]:checked');
  const bodyType = bodyTypeRadio ? bodyTypeRadio.value : '';
  const skinToneRadio = document.querySelector('input[name="profile-skinTone"]:checked');
  const skinTone = skinToneRadio ? skinToneRadio.value : '';

  if (!nickname || !city || !zodiac) {
    alert('请填写完整信息');
    return;
  }

  if (city.trim().length < 2) {
    alert('请输入有效的城市名称');
    return;
  }

  AppState.profile = {
    nickname,
    city,
    zodiac,
    styles,
    bodyType,
    skinTone,
    createdAt: new Date().toISOString()
  };

  localStorage.setItem('lw_profile', JSON.stringify(AppState.profile));
  Router.navigate('home');
}

// 预置衣物库 - 40件不同种类的衣物
const PresetWardrobe = [
  // 上装 10件
  { name: '白色雪纺衬衫', category: 'top', color: '白色', seasons: ['春','夏','秋'], occasions: ['通勤','正式','约会'] },
  { name: '黑色修身西装', category: 'top', color: '黑色', seasons: ['春','秋','冬'], occasions: ['通勤','正式'] },
  { name: '粉色针织衫', category: 'top', color: '粉色', seasons: ['春','秋','冬'], occasions: ['约会','休闲'] },
  { name: '灰色卫衣', category: 'top', color: '灰色', seasons: ['春','秋','冬'], occasions: ['休闲','运动'] },
  { name: '蓝色牛仔衬衫', category: 'top', color: '蓝色', seasons: ['春','秋'], occasions: ['休闲','通勤'] },
  { name: '白色基础T恤', category: 'top', color: '白色', seasons: ['春','夏'], occasions: ['休闲','运动','居家'] },
  { name: '米色丝绸衬衫', category: 'top', color: '米色', seasons: ['春','夏','秋'], occasions: ['通勤','约会'] },
  { name: '红色波点上衣', category: 'top', color: '红色', seasons: ['春','夏'], occasions: ['约会','休闲'] },
  { name: '绿色亚麻衬衫', category: 'top', color: '绿色', seasons: ['春','夏'], occasions: ['休闲','通勤'] },
  { name: '紫色蝴蝶结衬衫', category: 'top', color: '紫色', seasons: ['春','夏','秋'], occasions: ['约会','正式'] },
  // 下装 8件
  { name: '黑色西装裤', category: 'bottom', color: '黑色', seasons: ['春','夏','秋','冬'], occasions: ['通勤','正式'] },
  { name: '蓝色直筒牛仔裤', category: 'bottom', color: '蓝色', seasons: ['春','夏','秋'], occasions: ['休闲','运动'] },
  { name: '米色阔腿裤', category: 'bottom', color: '米色', seasons: ['春','夏','秋'], occasions: ['通勤','休闲'] },
  { name: '灰色运动裤', category: 'bottom', color: '灰色', seasons: ['春','秋','冬'], occasions: ['运动','居家'] },
  { name: '粉色百褶裙', category: 'bottom', color: '粉色', seasons: ['春','夏','秋'], occasions: ['约会','休闲'] },
  { name: '黑色皮裙', category: 'bottom', color: '黑色', seasons: ['春','秋','冬'], occasions: ['约会','通勤'] },
  { name: '白色半身裙', category: 'bottom', color: '白色', seasons: ['春','夏'], occasions: ['约会','休闲'] },
  { name: '棕色灯芯绒裤', category: 'bottom', color: '棕色', seasons: ['秋','冬'], occasions: ['休闲','通勤'] },
  // 连衣裙 6件
  { name: '蓝色碎花连衣裙', category: 'dress', color: '蓝色', seasons: ['春','夏'], occasions: ['约会','休闲'] },
  { name: '黑色修身连衣裙', category: 'dress', color: '黑色', seasons: ['春','夏','秋'], occasions: ['正式','约会','通勤'] },
  { name: '红色波点连衣裙', category: 'dress', color: '红色', seasons: ['春','夏','秋'], occasions: ['约会','正式'] },
  { name: '白色蕾丝连衣裙', category: 'dress', color: '白色', seasons: ['春','夏'], occasions: ['约会','正式'] },
  { name: '粉色纱裙', category: 'dress', color: '粉色', seasons: ['春','夏'], occasions: ['约会','休闲'] },
  { name: '米色针织连衣裙', category: 'dress', color: '米色', seasons: ['秋','冬'], occasions: ['通勤','休闲'] },
  // 外套 6件
  { name: '米色风衣', category: 'outer', color: '米色', seasons: ['春','秋'], occasions: ['通勤','休闲'] },
  { name: '黑色西装外套', category: 'outer', color: '黑色', seasons: ['春','秋','冬'], occasions: ['通勤','正式'] },
  { name: '粉色针织开衫', category: 'outer', color: '粉色', seasons: ['春','秋'], occasions: ['休闲','居家'] },
  { name: '灰色运动外套', category: 'outer', color: '灰色', seasons: ['春','秋','冬'], occasions: ['运动','休闲'] },
  { name: '棕色皮夹克', category: 'outer', color: '棕色', seasons: ['秋','冬'], occasions: ['休闲','约会'] },
  { name: '白色短款羽绒服', category: 'outer', color: '白色', seasons: ['冬'], occasions: ['通勤','休闲'] },
  // 鞋履 6件
  { name: '黑色高跟鞋', category: 'shoes', color: '黑色', seasons: ['春','夏','秋'], occasions: ['通勤','约会','正式'] },
  { name: '白色运动鞋', category: 'shoes', color: '白色', seasons: ['春','夏','秋'], occasions: ['休闲','运动'] },
  { name: '米色乐福鞋', category: 'shoes', color: '米色', seasons: ['春','夏','秋'], occasions: ['通勤','休闲'] },
  { name: '棕色短靴', category: 'shoes', color: '棕色', seasons: ['秋','冬'], occasions: ['休闲','通勤'] },
  { name: '粉色平底鞋', category: 'shoes', color: '粉色', seasons: ['春','夏'], occasions: ['约会','休闲'] },
  { name: '灰色雪地靴', category: 'shoes', color: '灰色', seasons: ['冬'], occasions: ['休闲','居家'] },
  // 配饰 4件
  { name: '红色手提包', category: 'accessory', color: '红色', seasons: ['春','夏','秋','冬'], occasions: ['通勤','约会','正式'] },
  { name: '银色项链', category: 'accessory', color: '灰色', seasons: ['春','夏','秋','冬'], occasions: ['约会','正式'] },
  { name: '米色围巾', category: 'accessory', color: '米色', seasons: ['秋','冬'], occasions: ['通勤','休闲'] },
  { name: '黑色腰带', category: 'accessory', color: '黑色', seasons: ['春','夏','秋','冬'], occasions: ['通勤','正式'] }
];

// 自动添加预置衣物
function loadPresetWardrobe() {
  if (AppState.wardrobe.length > 0) return false;
  PresetWardrobe.forEach(item => {
    AppState.wardrobe.push({
      id: Utils.generateId(),
      ...item,
      addedAt: new Date().toISOString()
    });
  });
  localStorage.setItem('lw_wardrobe', JSON.stringify(AppState.wardrobe));
  return true;
}

// 导入衣物（JSON格式）
function importWardrobe(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (!Array.isArray(data)) {
      alert('导入失败：数据格式不正确，请传入JSON数组');
      return false;
    }
    let count = 0;
    data.forEach(item => {
      if (!item.name || !item.category || !item.color) return;
      AppState.wardrobe.push({
        id: Utils.generateId(),
        name: item.name,
        category: item.category,
        color: item.color,
        seasons: item.seasons || ['春','夏','秋','冬'],
        occasions: item.occasions || ['休闲'],
        addedAt: new Date().toISOString()
      });
      count++;
    });
    localStorage.setItem('lw_wardrobe', JSON.stringify(AppState.wardrobe));
    alert(`成功导入 ${count} 件衣物`);
    Router.navigate('wardrobe');
    return true;
  } catch (e) {
    alert('导入失败：JSON格式错误');
    return false;
  }
}

// 导出衣橱为JSON
function exportWardrobe() {
  const data = JSON.stringify(AppState.wardrobe, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `我的衣橱_${Utils.formatDate()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function renderWardrobePage(container) {
  const wardrobe = AppState.wardrobe;

  if (wardrobe.length === 0) {
    container.innerHTML = `
      <div class="page">
        <h1 style="font-size:var(--font-size-2xl);margin-bottom:var(--space-lg);">我的衣橱</h1>
        <div class="empty-state">
          <div class="empty-state-illustration">👗</div>
          <div class="empty-state-title">衣橱还是空的</div>
          <p>添加衣物后，AI会根据天气和运势为你推荐穿搭</p>
          <div class="empty-state-action" style="display:flex;flex-direction:column;gap:var(--space-sm);">
            <button class="btn btn-primary btn-block" onclick="Router.navigate('addClothes')">+ 手动添加</button>
            <button class="btn btn-secondary btn-block" onclick="quickLoadPreset()">📦 一键导入示例衣橱</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // 按分类统计
  const categoryCounts = {};
  MockData.clothingCategories.forEach(c => { categoryCounts[c.id] = 0; });
  wardrobe.forEach(item => {
    if (categoryCounts[item.category] !== undefined) categoryCounts[item.category]++;
  });

  const itemsHtml = wardrobe.map(item => {
    const cat = MockData.clothingCategories.find(c => c.id === item.category);
    const colorInfo = MockData.colors.find(c => c.name === item.color);
    const isLightBg = colorInfo && (colorInfo.code === '#FFFFFF' || colorInfo.code === '#F5F5DC' || colorInfo.code === '#FFEB3B');
    const textColor = isLightBg ? '#333' : '#fff';
    const borderStyle = isLightBg ? 'border:1px solid var(--border-light);' : '';
    return `
      <div class="list-item">
        <div class="list-item-avatar" style="background:${colorInfo ? colorInfo.code : 'var(--primary-bg)'};color:${textColor};${borderStyle}width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
          ${MockData.getItemIcon(item)}
        </div>
        <div class="list-item-content">
          <div class="list-item-title">${item.name}</div>
          <div class="list-item-subtitle">${cat ? cat.name : ''} · ${item.color} · ${item.seasons?.join('、') || '四季'}</div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="deleteClothes('${item.id}')">删除</button>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="page">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);">
        <h1 style="font-size:var(--font-size-2xl);">我的衣橱</h1>
        <span style="font-size:var(--font-size-sm);color:var(--text-muted);">${wardrobe.length} 件</span>
      </div>

      <div style="display:flex;gap:var(--space-xs);margin-bottom:var(--space-md);flex-wrap:wrap;">
        ${MockData.clothingCategories.map(c => `
          <span style="font-size:var(--font-size-xs);padding:2px 10px;background:var(--bg-main);border-radius:var(--radius-full);color:var(--text-secondary);">${c.name} ${categoryCounts[c.id]}</span>
        `).join('')}
      </div>

      <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-md);">
        <button class="btn btn-primary" style="flex:1;" onclick="Router.navigate('addClothes')">+ 添加</button>
        <button class="btn btn-secondary" style="flex:1;" onclick="exportWardrobe()">📤 导出</button>
        <button class="btn btn-secondary" style="flex:1;" onclick="showImportForm()">📥 导入</button>
      </div>

      <div id="import-form" style="display:none;margin-bottom:var(--space-md);"></div>

      <div>${itemsHtml}</div>
    </div>
  `;
}

function showImportForm() {
  const form = document.getElementById('import-form');
  if (!form) return;
  form.style.display = 'block';
  form.innerHTML = `
    <div class="card">
      <h3 style="margin-bottom:var(--space-sm);">导入衣物</h3>
      <p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-bottom:var(--space-sm);">粘贴JSON格式衣物数据，或选择文件导入</p>
      <textarea id="import-textarea" class="form-input" style="min-height:120px;font-size:var(--font-size-xs);margin-bottom:var(--space-sm);" placeholder='[{"name":"白色衬衫","category":"top","color":"白色","seasons":["春","夏"],"occasions":["通勤"]}]'></textarea>
      <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-sm);">
        <input type="file" id="import-file" accept=".json" style="display:none;" onchange="handleImportFile(event)">
        <button class="btn btn-secondary" style="flex:1;" onclick="document.getElementById('import-file').click()">选择文件</button>
      </div>
      <div style="display:flex;gap:var(--space-sm);">
        <button class="btn btn-secondary" style="flex:1;" onclick="cancelImportForm()">取消</button>
        <button class="btn btn-primary" style="flex:1;" onclick="confirmImport()">导入</button>
      </div>
    </div>
  `;
}

function cancelImportForm() {
  const form = document.getElementById('import-form');
  if (form) { form.style.display = 'none'; form.innerHTML = ''; }
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('import-textarea').value = e.target.result;
  };
  reader.readAsText(file);
}

function confirmImport() {
  const text = document.getElementById('import-textarea').value.trim();
  if (!text) {
    alert('请输入或选择JSON文件');
    return;
  }
  importWardrobe(text);
}

function quickLoadPreset() {
  const success = loadPresetWardrobe();
  if (success) {
    Router.navigate('wardrobe');
  } else {
    alert('衣橱已有衣物，无法重复导入示例数据');
  }
}

function deleteClothes(id) {
  AppState.wardrobe = AppState.wardrobe.filter(item => item.id !== id);
  localStorage.setItem('lw_wardrobe', JSON.stringify(AppState.wardrobe));
  Router.navigate('wardrobe');
}

function renderAddClothesPage(container) {
  container.innerHTML = `
    <div class="page">
      <h1 style="font-size:var(--font-size-2xl);margin-bottom:var(--space-lg);">添加衣物</h1>
      <div class="card">
        <div style="margin-bottom:var(--space-md);">
          <label style="display:block;margin-bottom:var(--space-xs);color:var(--text-secondary);">名称</label>
          <input type="text" id="clothes-name" class="form-input" placeholder="例如：白色雪纺衬衫">
        </div>
        <div style="margin-bottom:var(--space-md);">
          <label style="display:block;margin-bottom:var(--space-xs);color:var(--text-secondary);">分类</label>
          <select id="clothes-category" class="form-input">
            ${MockData.clothingCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div style="margin-bottom:var(--space-md);">
          <label style="display:block;margin-bottom:var(--space-xs);color:var(--text-secondary);">颜色</label>
          <select id="clothes-color" class="form-input">
            ${MockData.colors.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div style="margin-bottom:var(--space-md);">
          <label style="display:block;margin-bottom:var(--space-xs);color:var(--text-secondary);">适用季节</label>
          <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;">
            ${['春','夏','秋','冬'].map(s => `
              <label style="display:flex;align-items:center;gap:var(--space-xs);">
                <input type="checkbox" name="clothes-seasons" value="${s}">
                <span>${s}</span>
              </label>
            `).join('')}
          </div>
        </div>
        <div style="margin-bottom:var(--space-md);">
          <label style="display:block;margin-bottom:var(--space-xs);color:var(--text-secondary);">适用场合</label>
          <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;">
            ${['通勤','休闲','约会','运动','正式','居家'].map(o => `
              <label style="display:flex;align-items:center;gap:var(--space-xs);">
                <input type="checkbox" name="clothes-occasions" value="${o}">
                <span>${o}</span>
              </label>
            `).join('')}
          </div>
        </div>
        <button class="btn btn-primary btn-block" onclick="saveClothes()">保存</button>
      </div>
    </div>
  `;
}

function saveClothes() {
  const name = document.getElementById('clothes-name').value;
  const category = document.getElementById('clothes-category').value;
  const color = document.getElementById('clothes-color').value;
  const seasons = Array.from(document.querySelectorAll('input[name="clothes-seasons"]:checked')).map(cb => cb.value);
  const occasions = Array.from(document.querySelectorAll('input[name="clothes-occasions"]:checked')).map(cb => cb.value);

  if (!name || !category || !color) {
    alert('请填写完整信息');
    return;
  }

  const item = {
    id: Utils.generateId(),
    name,
    category,
    color,
    seasons: seasons.length > 0 ? seasons : ['春','夏','秋','冬'],
    occasions: occasions.length > 0 ? occasions : ['休闲'],
    addedAt: new Date().toISOString()
  };

  AppState.wardrobe.push(item);
  localStorage.setItem('lw_wardrobe', JSON.stringify(AppState.wardrobe));
  Router.navigate('wardrobe');
}

function renderOutfitPage(container) {
  const rec = TodayData.recommendation;
  const currentScene = TodayData.currentScene || '休闲';
  const outfit = rec?.scenes?.[currentScene];

  if (!outfit) {
    container.innerHTML = `
      <div class="page">
        <h1 style="font-size:var(--font-size-2xl);margin-bottom:var(--space-lg);">全身搭配</h1>
        <div class="empty-state">
          <div class="empty-state-illustration">👗</div>
          <div class="empty-state-title">暂无搭配</div>
          <p>请先返回首页生成推荐</p>
        </div>
      </div>
    `;
    return;
  }

  const itemsHtml = outfit.items.map((item, index) => {
    const cat = MockData.clothingCategories.find(c => c.id === item.category);
    const colorInfo = MockData.colors.find(c => c.name === item.color);
    return `
      <div style="display:flex;align-items:center;gap:var(--space-md);margin-bottom:var(--space-md);padding:var(--space-md);background:var(--bg-card);border-radius:var(--radius-md);">
        <div style="font-size:var(--font-size-lg);font-weight:700;color:var(--primary);width:32px;">${index + 1}</div>
        <div class="list-item-avatar" style="background:${colorInfo ? colorInfo.code : 'var(--primary-bg)'};color:${colorInfo && colorInfo.code === '#FFFFFF' ? '#333' : '#fff'};width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
          ${MockData.getItemIcon(item)}
        </div>
        <div style="flex:1;">
          <div style="font-weight:500;">${item.name}</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-muted);">${cat ? cat.name : ''} · ${item.color}</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="page">
      <h1 style="font-size:var(--font-size-2xl);margin-bottom:var(--space-lg);">全身搭配</h1>
      <div class="card" style="margin-bottom:var(--space-lg);">
        <div style="font-size:var(--font-size-xs);color:var(--primary);font-weight:500;margin-bottom:var(--space-sm);">场景：${currentScene}</div>
        ${itemsHtml}
      </div>
      <button class="btn btn-secondary btn-block" onclick="Router.navigate('home')">返回首页</button>
    </div>
  `;
}

function renderSpecialDaysPage(container) {
  const specialDays = AppState.specialDays || [];

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const getDaysUntil = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    let diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) {
      const nextYear = new Date(today.getFullYear() + 1, target.getMonth(), target.getDate());
      diff = Math.ceil((nextYear - today) / (1000 * 60 * 60 * 24));
    }
    return diff;
  };

  const getTypeIcon = (type) => {
    const icons = { 'anniversary': '💍', 'birthday': '🎂', 'date': '💕', 'other': '📅' };
    return icons[type] || '📅';
  };

  const getTypeLabel = (type) => {
    const labels = { 'anniversary': '纪念日', 'birthday': '生日', 'date': '约会日', 'other': '重要日子' };
    return labels[type] || '重要日子';
  };

  const sortedDays = [...specialDays].sort((a, b) => {
    return getDaysUntil(a.date) - getDaysUntil(b.date);
  });

  const daysHtml = sortedDays.length > 0 ? sortedDays.map(day => {
    const daysLeft = getDaysUntil(day.date);
    const isToday = daysLeft === 0;
    const isNear = daysLeft <= 7 && daysLeft > 0;
    const urgencyColor = isToday ? 'var(--danger)' : isNear ? 'var(--warning)' : 'var(--accent)';
    const urgencyText = isToday ? '就是今天！' : daysLeft === 1 ? '明天！' : `还有 ${daysLeft} 天`;

    return `
      <div class="card" style="margin-bottom:var(--space-md);position:relative;overflow:hidden;">
        <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${urgencyColor};"></div>
        <div style="display:flex;align-items:center;gap:var(--space-md);padding-left:var(--space-sm);">
          <div style="font-size:36px;flex-shrink:0;">${getTypeIcon(day.type)}</div>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:var(--font-size-md);">${day.name}</div>
            <div style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:2px;">${formatDate(day.date)} · ${getTypeLabel(day.type)}</div>
            ${day.note ? `<div style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-top:4px;">📝 ${day.note}</div>` : ''}
          </div>
          <div style="text-align:center;flex-shrink:0;">
            <div style="font-size:var(--font-size-lg);font-weight:700;color:${urgencyColor};">${urgencyText}</div>
          </div>
        </div>
        ${isNear || isToday ? `
          <div style="margin-top:var(--space-md);padding-top:var(--space-sm);border-top:1px dashed var(--border-light);display:flex;gap:var(--space-sm);">
            <button class="btn btn-primary btn-sm" style="flex:1;font-size:var(--font-size-xs);" onclick="generateSpecialOutfit('${day.id}')">👗 推荐浪漫穿搭</button>
            <button class="btn btn-secondary btn-sm" style="flex:1;font-size:var(--font-size-xs);" onclick="shareSpecialDay('${day.id}')">📤 生成提醒卡片</button>
          </div>
        ` : ''}
        <button onclick="deleteSpecialDay('${day.id}')" style="position:absolute;top:var(--space-sm);right:var(--space-sm);background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px;padding:4px;">×</button>
      </div>
    `;
  }).join('') : `
    <div class="empty-state">
      <div class="empty-state-illustration">📅</div>
      <div class="empty-state-title">还没有记录特殊日子</div>
      <p>添加纪念日、生日等重要日期，到时间自动推荐浪漫穿搭</p>
      <div class="empty-state-action">
        <button class="btn btn-primary btn-block" onclick="showAddSpecialDayForm()">+ 添加第一个特殊日子</button>
      </div>
    </div>
  `;

  container.innerHTML = `
    <div class="page">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
        <h1 style="font-size:var(--font-size-2xl);">特殊日子</h1>
        ${specialDays.length > 0 ? `<button class="btn btn-primary" onclick="showAddSpecialDayForm()">+ 添加</button>` : ''}
      </div>
      <div id="special-days-list">${daysHtml}</div>
      <div id="add-special-day-form" style="display:none;"></div>
    </div>
  `;
}

function showAddSpecialDayForm() {
  const form = document.getElementById('add-special-day-form');
  const list = document.getElementById('special-days-list');
  if (list) list.style.display = 'none';
  if (!form) return;

  form.style.display = 'block';
  form.innerHTML = `
    <div class="card">
      <h3 style="margin-bottom:var(--space-md);">添加特殊日子</h3>
      <div style="margin-bottom:var(--space-md);">
        <label style="display:block;margin-bottom:var(--space-xs);color:var(--text-secondary);">名称</label>
        <input type="text" id="special-day-name" class="form-input" placeholder="例如：结婚纪念日">
      </div>
      <div style="margin-bottom:var(--space-md);">
        <label style="display:block;margin-bottom:var(--space-xs);color:var(--text-secondary);">日期</label>
        <input type="date" id="special-day-date" class="form-input">
      </div>
      <div style="margin-bottom:var(--space-md);">
        <label style="display:block;margin-bottom:var(--space-xs);color:var(--text-secondary);">类型</label>
        <select id="special-day-type" class="form-input">
          <option value="anniversary">纪念日</option>
          <option value="birthday">生日</option>
          <option value="date">约会日</option>
          <option value="other">其他重要日子</option>
        </select>
      </div>
      <div style="margin-bottom:var(--space-md);">
        <label style="display:block;margin-bottom:var(--space-xs);color:var(--text-secondary);">备注（可选）</label>
        <input type="text" id="special-day-note" class="form-input" placeholder="例如：第一次约会的日子">
      </div>
      <div style="display:flex;gap:var(--space-sm);">
        <button class="btn btn-secondary" style="flex:1;" onclick="cancelAddSpecialDay()">取消</button>
        <button class="btn btn-primary" style="flex:1;" onclick="saveSpecialDay()">保存</button>
      </div>
    </div>
  `;
}

function cancelAddSpecialDay() {
  const form = document.getElementById('add-special-day-form');
  const list = document.getElementById('special-days-list');
  if (form) { form.style.display = 'none'; form.innerHTML = ''; }
  if (list) list.style.display = 'block';
}

function saveSpecialDay() {
  const name = document.getElementById('special-day-name').value.trim();
  const date = document.getElementById('special-day-date').value;
  const type = document.getElementById('special-day-type').value;
  const note = document.getElementById('special-day-note').value.trim();

  if (!name || !date) {
    alert('请填写名称和日期');
    return;
  }

  const day = {
    id: Utils.generateId(),
    name,
    date,
    type,
    note,
    createdAt: new Date().toISOString()
  };

  AppState.specialDays.push(day);
  localStorage.setItem('lw_special_days', JSON.stringify(AppState.specialDays));
  Router.navigate('specialDays');
}

function deleteSpecialDay(id) {
  AppState.specialDays = AppState.specialDays.filter(d => d.id !== id);
  localStorage.setItem('lw_special_days', JSON.stringify(AppState.specialDays));
  Router.navigate('specialDays');
}

function getUpcomingSpecialDay() {
  const days = AppState.specialDays || [];
  if (days.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const withDays = days.map(d => {
    const target = new Date(d.date);
    target.setHours(0, 0, 0, 0);
    let diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) {
      const next = new Date(today.getFullYear() + 1, target.getMonth(), target.getDate());
      diff = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
    }
    return { ...d, daysLeft: diff };
  });

  withDays.sort((a, b) => a.daysLeft - b.daysLeft);
  return withDays[0];
}

function generateSpecialOutfit(dayId) {
  const day = AppState.specialDays.find(d => d.id === dayId);
  if (!day) return;

  const wardrobe = AppState.wardrobe;
  if (wardrobe.length === 0) {
    alert('衣橱还是空的，先添加一些衣物吧~');
    return;
  }

  const context = {
    weather: TodayData.weather || { temp: 25, weather: '多云', city: '北京' },
    almanac: TodayData.almanac || { yi: ['约会'], luckyColor: '粉色' },
    profile: AppState.profile || { zodiac: '天秤座', styles: ['约会'] }
  };

  const byCategory = {};
  wardrobe.forEach(item => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  const romanticScene = OutfitScenes['约会'];
  const outfit = generateSceneOutfit(wardrobe, romanticScene, context, byCategory);

  if (!outfit || outfit.items.length === 0) {
    alert('暂时无法生成搭配，请先添加更多衣物~');
    return;
  }

  const itemsHtml = outfit.items.map(item => {
    const cat = MockData.clothingCategories.find(c => c.id === item.category);
    const colorInfo = MockData.colors.find(c => c.name === item.color);
    const isLightBg = colorInfo && (colorInfo.code === '#FFFFFF' || colorInfo.code === '#F5F5DC' || colorInfo.code === '#FFEB3B');
    const textColor = isLightBg ? '#333' : '#fff';
    const borderStyle = isLightBg ? 'border:1px solid var(--border-light);' : '';
    return `
      <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-sm);">
        <div style="width:40px;height:40px;border-radius:var(--radius-md);background:${colorInfo ? colorInfo.code : 'var(--primary-bg)'};color:${textColor};${borderStyle}display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          ${MockData.getItemIcon(item)}
        </div>
        <div>
          <div style="font-weight:500;font-size:var(--font-size-sm);">${item.name}</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-muted);">${cat ? cat.name : ''} · ${item.color}</div>
        </div>
      </div>
    `;
  }).join('');

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:var(--space-md);';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  modal.innerHTML = `
    <div class="card" style="max-width:400px;width:100%;max-height:80vh;overflow-y:auto;animation:pageEnter 0.3s ease;">
      <div style="text-align:center;margin-bottom:var(--space-md);">
        <div style="font-size:32px;margin-bottom:var(--space-xs);">${day.type === 'birthday' ? '🎂' : '💍'}</div>
        <h3 style="font-size:var(--font-size-lg);">${day.name} · 浪漫穿搭</h3>
        <p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:var(--space-xs);">为这个特殊日子精心搭配</p>
      </div>
      <div style="margin-bottom:var(--space-md);">${itemsHtml}</div>
      ${outfit.reasons ? `
        <div style="padding:var(--space-sm);background:var(--bg-main);border-radius:var(--radius-md);margin-bottom:var(--space-md);">
          ${outfit.reasons.slice(0, 3).map(r => `<div style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-bottom:var(--space-xs);">${r.icon} ${r.text}</div>`).join('')}
        </div>
      ` : ''}
      <button class="btn btn-primary btn-block" onclick="this.closest('div[style*=fixed]').remove()">知道了</button>
    </div>
  `;

  document.body.appendChild(modal);
}

function shareSpecialDay(dayId) {
  const day = AppState.specialDays.find(d => d.id === dayId);
  if (!day) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(day.date);
  target.setHours(0, 0, 0, 0);
  let diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) {
    const next = new Date(today.getFullYear() + 1, target.getMonth(), target.getDate());
    diff = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
  }

  const dateStr = `${target.getMonth() + 1}月${target.getDate()}日`;
  const countdownText = diff === 0 ? '就是今天' : `还有 ${diff} 天`;
  const typeIcon = day.type === 'birthday' ? '🎂' : day.type === 'anniversary' ? '💍' : '💕';

  const card = document.createElement('div');
  card.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:var(--space-md);';
  card.onclick = (e) => { if (e.target === card) card.remove(); };

  card.innerHTML = `
    <div style="max-width:360px;width:100%;background:linear-gradient(135deg, #FFF8F3 0%, #FFF0E8 100%);border-radius:20px;padding:2rem;text-align:center;box-shadow:0 8px 32px rgba(212,165,116,0.3);animation:pageEnter 0.3s ease;">
      <div style="font-size:48px;margin-bottom:var(--space-md);">${typeIcon}</div>
      <div style="font-family:'Noto Serif SC',serif;font-size:1.5rem;font-weight:700;color:var(--ink);margin-bottom:var(--space-xs);">${day.name}</div>
      <div style="font-size:0.9rem;color:var(--text-muted);margin-bottom:var(--space-lg);">${dateStr}</div>
      <div style="font-size:2.5rem;font-weight:700;color:var(--primary);margin-bottom:var(--space-sm);font-family:'Lora',serif;">${countdownText}</div>
      <div style="width:40px;height:2px;background:var(--accent);margin:0 auto var(--space-lg);"></div>
      ${day.note ? `<div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:var(--space-lg);font-style:italic;">"${day.note}"</div>` : ''}
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:var(--space-md);">来自「懒婆娘的穿搭指南」</div>
      <button class="btn btn-primary btn-block" onclick="this.closest('div[style*=fixed]').remove()">关闭</button>
      <div style="font-size:0.7rem;color:var(--text-muted);margin-top:var(--space-sm);">截图分享给TA吧~</div>
    </div>
  `;

  document.body.appendChild(card);
}

// ============================================
// 路由系统
// ============================================
const Router = {
  routes: {
    'home': renderHomePage,
    'profile': renderProfilePage,
    'wardrobe': renderWardrobePage,
    'addClothes': renderAddClothesPage,
    'outfit': renderOutfitPage,
    'specialDays': renderSpecialDaysPage
  },

  navigate(page, params = {}) {
    AppState.currentPage = page;
    window.location.hash = page;

    const renderer = this.routes[page];
    if (renderer) {
      const content = document.getElementById('main-content');
      content.style.opacity = '0';
      content.style.transition = 'opacity 0.15s ease';

      setTimeout(() => {
        content.innerHTML = '';
        renderer(content, params);
        requestAnimationFrame(() => {
          content.style.opacity = '1';
          content.style.transition = 'opacity 0.25s ease';
        });
      }, 150);
    }

    this.updateNav(page);
  },

  updateNav(page) {
    const navItems = document.querySelectorAll('.nav-item');
    const navMap = { 'addClothes': 'wardrobe', 'outfit': 'home' };
    const activePage = navMap[page] || page;
    navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.page === activePage);
    });
  }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 加载本地数据
  const savedProfile = localStorage.getItem('lw_profile');
  if (savedProfile) {
    AppState.profile = JSON.parse(savedProfile);
  }

  const savedWardrobe = localStorage.getItem('lw_wardrobe');
  if (savedWardrobe) {
    AppState.wardrobe = JSON.parse(savedWardrobe);
  }

  const savedSpecialDays = localStorage.getItem('lw_special_days');
  if (savedSpecialDays) {
    AppState.specialDays = JSON.parse(savedSpecialDays);
  }

  // 首次使用自动加载预置衣橱
  if (AppState.wardrobe.length === 0) {
    loadPresetWardrobe();
  }

  // 检查是否是首次使用
  if (!AppState.profile) {
    Router.navigate('profile');
  } else {
    const hash = window.location.hash.replace('#', '') || 'home';
    Router.navigate(hash);
  }

  // 显示底部导航
  document.getElementById('bottom-nav').classList.remove('hidden');

  // 导航点击事件
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      Router.navigate(page);
    });
  });
});

// 监听hash变化
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '') || 'home';
  if (hash !== AppState.currentPage) {
    Router.navigate(hash);
  }
});
