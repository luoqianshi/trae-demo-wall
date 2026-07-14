// ============================================
// AI 对话推荐服务
// 支持：真实豆包大模型 API + 本地关键词降级方案
// ============================================

const AI_STORAGE_KEY = 'kidgo_ai_config';

// 默认配置（用户可通过隐藏配置入口修改）
const DEFAULT_AI_CONFIG = {
  enabled: true,
  apiKey: '',
  endpoint: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-v4-flash'
};

let AI_CONFIG = { ...DEFAULT_AI_CONFIG };

// 当前 AI 理解结果（供全局使用）
let currentAIResult = null;

// 初始化配置：优先从 localStorage 读取
function initAIConfig() {
  try {
    const saved = localStorage.getItem(AI_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      AI_CONFIG = { ...DEFAULT_AI_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('AI config load failed:', e);
  }
}

// 保存配置到 localStorage
function saveAIConfig(config) {
  AI_CONFIG = { ...AI_CONFIG, ...config };
  try {
    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(AI_CONFIG));
  } catch (e) {
    console.warn('AI config save failed:', e);
  }
}

// 设置默认 API Key（首次使用 Demo 时）
function setDefaultApiKeyIfEmpty(key) {
  if (!AI_CONFIG.apiKey && key) {
    saveAIConfig({ apiKey: key });
  }
}

// 是否启用真实 AI
function isAIEnabled() {
  return AI_CONFIG.enabled && AI_CONFIG.apiKey && AI_CONFIG.apiKey.length > 10;
}

// 获取当前配置（用于配置面板）
function getAIConfig() {
  return { ...AI_CONFIG };
}

// ============================================
// 主入口：获取 AI 推荐
// 架构：大模型做语义分析 → 本地算法做推荐
// ============================================
async function getAIRecommendation(userInput, placesData) {
  const input = (userInput || '').trim();

  if (!input) {
    return getLocalRecommendation(input, placesData);
  }

  if (isAIEnabled()) {
    try {
      const aiResult = await analyzeByAI(input);
      if (aiResult && aiResult.params) {
        currentAIResult = aiResult;
        const localResult = getLocalRecommendationWithParams(aiResult.params, placesData);
        return {
          understood: aiResult.understood || localResult.understood,
          params: { ...localResult.params, ...aiResult.params },
          recommendations: localResult.recommendations
        };
      }
    } catch (err) {
      console.warn('AI API 调用失败，降级到本地方案：', err);
    }
  }

  // 本地降级
  const localResult = getLocalRecommendation(input, placesData);
  currentAIResult = localResult;
  return localResult;
}

// ============================================
// 大模型语义分析（提取需求参数）
// ============================================
async function analyzeByAI(userInput) {
  const systemPrompt = buildSystemPrompt(userInput);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(AI_CONFIG.endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

    if (!content) {
      throw new Error('API 返回内容为空');
    }

    return parseAIResponse(content);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// 解析 AI 返回的 JSON
function parseAIResponse(content) {
  // 先尝试直接解析
  try {
    return JSON.parse(content);
  } catch (e) {
    // 尝试提取 markdown 代码块或 JSON 片段
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1]);
    }
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('无法解析 AI 返回内容');
  }
}

// 构建 System Prompt（大模型只做语义分析，不做推荐）
function buildSystemPrompt(userInput) {
  return `你是一个亲子出行需求分析助手。请分析用户的遛娃需求，提取关键参数。

用户需求：${userInput}

请严格返回以下JSON格式，不要有其他内容：
{
  "understood": "用一句话总结用户需求，要体现深度理解，比如'想带3岁宝宝去室内玩，车程半小时内，还要有吃饭的地方'",
  "params": {
    "ageGroup": "0-1"|"1-3"|"3-6"|"6-12"|null,
    "indoors": true|false|null,
    "types": ["park","museum","nature","zoo","playground","mall","farm","science","culture","water"],
    "maxDistance": 30|60|null,
    "duration": "half"|"full",
    "lessCrowd": true|false,
    "strollerFriendly": true|false,
    "excludePlaces": ["地点名称"],
    "excludeTypes": ["类型名称"]
  }
}

参数说明：
- ageGroup：孩子年龄段，从可选值中选一个，不确定就null
- indoors：true=室内优先, false=户外优先, null=不限
- types：用户明确想去的地点类型数组，从可选值中选
- maxDistance：可接受的车程（分钟），null表示不限
- duration：half=半天, full=一整天
- lessCrowd：是否要人少的地方
- strollerFriendly：是否需要推车友好
- excludePlaces：用户明确说不想去的地点名称数组
- excludeTypes：用户明确说不想去的类型数组

注意：
1. 只返回纯JSON，不要markdown代码块，不要解释文字
2. types 和 excludeTypes 只能从给定的可选值中选择
3. 如果用户没提到某个参数，就设为null或空数组`;
}

// ============================================
// 本地推荐算法（根据 params 生成推荐）
// ============================================
function getLocalRecommendationWithParams(params, placesData) {
  // 应用提取的参数到全局 currentParams（包括年龄、室内外、时长等）
  applyParamsToCurrent(params);

  // 使用统一的 getAllItems() 获取过滤后的地点列表
  // 这样首次推荐和"换一批"使用相同的过滤逻辑（年龄、室内外、时长等）
  let allItems = typeof getAllItems === 'function' ? getAllItems() : placesData.filter(p => !p.closed);

  // ===== 放宽条件：如果严格过滤后结果为空，逐步放宽 =====
  if (allItems.length === 0) {
    allItems = placesData.filter(p => !p.closed);
    
    // 保留室内/户外过滤（如果用户明确指定了）
    if (params.indoors === true) {
      allItems = allItems.filter(item => item.indoors === true);
    } else if (params.indoors === false) {
      allItems = allItems.filter(item => item.indoors === false);
    }
    
    // 保留时长过滤（如果用户明确指定了）
    if (params.duration === 'full') {
      allItems = allItems.filter(item => item.duration === 'full');
    } else if (params.duration === 'half') {
      allItems = allItems.filter(item => item.duration === 'half');
    }
    
    // 保留类型过滤（如果用户明确指定了）
    if (params.types && params.types.length > 0) {
      allItems = allItems.filter(item => item.types && item.types.some(t => params.types.includes(t)));
    }
  }

  // 额外的 AI 提取参数过滤
  // 距离硬过滤（如果用户明确要求了车程限制）
  if (params.maxDistance && params.maxDistance > 0) {
    const withinDistance = allItems.filter(item => !item.distance || item.distance <= params.maxDistance);
    if (withinDistance.length >= 3) {
      allItems = withinDistance;
    }
  }

  // 排除用户不想去的地点
  if (params.excludePlaces && params.excludePlaces.length > 0) {
    allItems = allItems.filter(p => {
      return !params.excludePlaces.some(excludeName => 
        p.name.includes(excludeName) || excludeName.includes(p.name)
      );
    });
  }
  
  // 排除用户不想去的类型
  if (params.excludeTypes && params.excludeTypes.length > 0) {
    allItems = allItems.filter(p => {
      return !p.types || !p.types.some(t => params.excludeTypes.includes(t));
    });
  }

  const scored = allItems.map(item => ({
    ...item,
    score: typeof calculateScore === 'function' ? calculateScore(item) : 50 + Math.floor(Math.random() * 20),
    reasons: typeof generateReasons === 'function' ? generateReasons(item) : [],
    rank: 0
  }));

  scored.sort((a, b) => b.score - a.score);

  // 如果提取了特定类型，做额外过滤提升
  const filtered = filterByExtractedTypes(scored, params);

  // 兜底：如果过滤后结果为空，使用所有未关闭的地点
  let finalResults = filtered;
  if (finalResults.length === 0) {
    finalResults = placesData.filter(p => !p.closed).map(item => ({
      ...item,
      score: 50 + Math.floor(Math.random() * 15),
      reasons: typeof generateReasons === 'function' ? generateReasons(item) : [],
      rank: 0
    }));
    finalResults.sort((a, b) => b.score - a.score);
  }

  // 设置全局 allScoredPlaces，供"换一批"分页使用
  if (typeof allScoredPlaces !== 'undefined') {
    allScoredPlaces = finalResults;
  }
  if (typeof recPage !== 'undefined') {
    recPage = 1;
  }

  // 返回最多5个结果
  const maxResults = 5;
  return {
    understood: buildUnderstoodText(params),
    params,
    recommendations: assignRanks(finalResults.slice(0, maxResults))
  };
}

// ============================================
// 本地降级方案：关键词匹配 + 本地推荐算法
// ============================================
function getLocalRecommendation(userInput, placesData) {
  const params = extractParamsFromInputLocal(userInput);
  return getLocalRecommendationWithParams(params, placesData);
}

// 本地关键词参数提取
function extractParamsFromInputLocal(input) {
  const params = {
    ageGroup: null,
    indoors: null,
    types: [],
    maxDistance: null,
    duration: 'half',
    lessCrowd: false,
    strollerFriendly: false,
    excludePlaces: [],
    excludeTypes: []
  };

  const originalText = input || '';
  let text = originalText.toLowerCase();
  
  text = text.replace(/[·~—–—−\|\\\/]/g, '');
  
  let cleanText = originalText.replace(/[·~—–—−\|\\\/]/g, '');

  // 提取排除的地点和类型（不想去XX、不要去XX、不去XX、XX就算了）
  const excludePatterns = ['不想去', '不要去', '不去', '不要', '别去', '不用', '不需要', '不一定要', '算了吧', '就算了', '算了', '就不用了', '避开', '排除', 'pass掉'];
  excludePatterns.forEach(pattern => {
    const idx = cleanText.indexOf(pattern);
    if (idx !== -1) {
      // 处理「XX就算了」这种句式（pattern在后面）
      let excludeText;
      if (pattern === '就算了' || pattern === '算了' || pattern === '算了吧') {
        excludeText = cleanText.substring(0, idx).trim();
        // 去掉前面的「那个」等无关词
        excludeText = excludeText.replace(/^(那个|这个|那种|这种)\s*/, '');
      } else {
        excludeText = cleanText.substring(idx + pattern.length).trim();
      }
      if (excludeText.includes('，') || excludeText.includes('。') || excludeText.includes('、')) {
        excludeText = excludeText.split(/[，。、]/)[0].trim();
      }
      
      if (excludeText.length > 0) {
        const excludeLower = excludeText.toLowerCase();
        
        // 判断排除的是地点还是类型
        if (excludeLower.includes('室内')) {
          params.indoors = false;
        } else if (excludeLower.includes('户外') || excludeLower.includes('室外')) {
          params.indoors = true;
        } else if (excludeLower.includes('人多') || excludeLower.includes('拥挤') || excludeLower.includes('人太多') || excludeLower.includes('人挤')) {
          params.lessCrowd = true;
        } else if (excludeLower.includes('公园') || excludeLower.includes('户外公园')) {
          params.excludeTypes.push('park');
          params.excludeTypes.push('nature');
        } else if (excludeLower.includes('博物馆') || excludeLower.includes('科技馆')) {
          params.excludeTypes.push('museum');
          params.excludeTypes.push('science');
        } else if (excludeLower.includes('游乐场') || excludeLower.includes('乐园') || excludeLower.includes('游乐园')) {
          params.excludeTypes.push('playground');
        } else if (excludeLower.includes('商场') || excludeLower.includes('购物中心') || excludeLower.includes('购物中心')) {
          params.excludeTypes.push('mall');
        } else if (excludeLower.includes('农场') || excludeLower.includes('采摘')) {
          params.excludeTypes.push('farm');
        } else {
          params.excludePlaces.push(excludeText);
        }
      }
      cleanText = cleanText.substring(0, idx);
    }
  });
  
  text = cleanText.toLowerCase();

  // 年龄
  const monthMatch = text.match(/(\d+)\s*个?月/);
  if (monthMatch) {
    const months = parseInt(monthMatch[1]);
    if (months < 12) {
      params.ageGroup = '0-1';
    }
  }

  let detectedAge = null;

  const halfAgeMatch = text.match(/(\d)\s*岁半/);
  if (halfAgeMatch) {
    detectedAge = parseInt(halfAgeMatch[1]) + 0.5;
  }

  if (!detectedAge) {
    const ageMatch = text.match(/(\d+(?:\.\d+)?)\s*岁/);
    if (ageMatch) {
      detectedAge = parseFloat(ageMatch[1]);
    }
  }

  if (detectedAge) {
    if (detectedAge < 1) params.ageGroup = '0-1';
    else if (detectedAge <= 3) params.ageGroup = '1-3';
    else if (detectedAge <= 6) params.ageGroup = '3-6';
    else params.ageGroup = '6-12';
  } else if (text.includes('小月龄') || text.includes('婴儿')) {
    params.ageGroup = '0-1';
  } else if (text.includes('学步') || text.includes('一岁') || text.includes('两') || text.includes('二岁') || text.includes('2岁')) {
    params.ageGroup = '1-3';
  } else if (text.includes('学龄前')) {
    params.ageGroup = '3-6';
  }

  // 室内/户外
  if (text.includes('室内') || text.includes('下雨天') || text.includes('下雨') || text.includes('空调') 
      || text.includes('凉快') || text.includes('太热') || text.includes('天热') || text.includes('梅雨季') 
      || text.includes('梅雨') || text.includes('连阴雨') || text.includes('避暑') || text.includes('冬天') 
      || text.includes('天冷') || text.includes('寒风') || text.includes('不想晒太阳') || text.includes('怕晒') 
      || text.includes('不要太晒')) {
    params.indoors = true;
  } else if (text.includes('户外') || text.includes('室外') || text.includes('公园') || text.includes('阳光') 
             || text.includes('晒太阳') || text.includes('天气好') || text.includes('晴天') || text.includes('出太阳')
             || text.includes('春暖花开') || text.includes('秋高气爽') || text.includes('放风') || text.includes('透气')
             || text.includes('闷坏了') || text.includes('补钙')) {
    params.indoors = false;
  }

  // 类型偏好
  const typeKeywords = {
    park: ['公园', '大草坪', '野餐', '搭帐篷', '骑车', '滑板车', '放风筝', '绿道', '郊野', '爬山', '登山', '徒步', '植物园', '森林公园', '景区', '风景区', '放松', '休息', '休闲', '透透气', '透透风'],
    museum: ['博物馆', '看展', '展览', '科普', '涨知识', '长见识', '学知识', '学东西', '涨涨知识', '恐龙', '化石', '文物', '历史', '美术馆', '艺术馆', '博物院'],
    nature: ['自然', '植物', '森林', '户外', '遛弯', '散步', '呼吸新鲜空气', '亲近自然', '看风景', '拍照', '拍照片', '拍照好看', '打卡', '吸氧', '森系', '山水', '湖边', '河边', '花海', '好看的地方', '风景好', '景色'],
    zoo: ['动物园', '动物', '大熊猫', '海底', '海洋', '看动物', '海洋馆', '水族馆', '看熊猫', '看海豚', '海底世界', '喂动物', '小动物'],
    playground: ['游乐场', '乐园', '淘气堡', '滑梯', '玩的地方', '放电', '耗电', '精力旺盛', '消耗体力', '蹦跶', '疯玩', '秋千', '游乐园', '主题乐园', '欢乐谷', '生日', '生日派对', '生日聚会', '小朋友聚会', '庆祝生日', '宝宝生日'],
    mall: ['商场', '购物', '吃饭', '逛商场', '买买买', '购物中心', '一站式', '吃饭方便', '遛娃圣地', '亲子餐厅'],
    farm: ['农场', '采摘', '草莓', '花海', '农家乐', '田园', '果园', '采摘园', '摘草莓', '摘水果', '喂小羊', '骑马', '农庄'],
    science: ['科技', '科学', '实验', '科技馆', '机器人', '体验馆', '科学实验', '天文', '航天', 'VR', 'VR互动', '互动体验', 'AR', '虚拟现实'],
    culture: ['历史', '文化', '博物院', '古迹', '古遗址', '人文', '非遗', '传统文化', '手工', '陶艺', '画画', '绘本', '图书馆', '书店'],
    water: ['游泳', '玩水', '水上乐园', '泳池', '戏水', '水上世界', '游泳馆', '漂流', '温泉', '海边', '沙滩', '踩水']
  };

  for (const [type, keywords] of Object.entries(typeKeywords)) {
    if (keywords.some(k => text.includes(k))) {
      if (!params.types.includes(type)) params.types.push(type);
    }
  }

  // 车程
  if (text.includes('半小时') || text.includes('30分钟') || text.includes('近') || text.includes('近一点')
      || text.includes('车程不要太远') || text.includes('车程近') || text.includes('车程不远')
      || text.includes('不要太远') || text.includes('不远') || text.includes('车程短')) {
    params.maxDistance = 30;
  } else if (text.includes('一小时') || text.includes('1小时') || text.includes('60分钟')) {
    params.maxDistance = 60;
  }

  // 时长（先检查否定表达，再检查肯定表达）
  if (text.includes('不用一整天') || text.includes('不要一整天') || text.includes('半天就行') 
      || text.includes('半天就够') || text.includes('只要半天') || text.includes('半天')) {
    params.duration = 'half';
  } else if (text.includes('一整天') || text.includes('一天') || text.includes('全天') 
             || text.includes('呆一天') || text.includes('玩一天')) {
    params.duration = 'full';
  }

  // 特殊需求
  if (text.includes('人少') || text.includes('安静') || text.includes('不挤') || text.includes('清净')
      || text.includes('人挤人不去') || text.includes('别太挤') || text.includes('不要人多')
      || text.includes('人多的地方不去') || text.includes('太挤了') || text.includes('人太多的不去')
      || text.includes('不去人多的') || text.includes('不要人挤人')) {
    params.lessCrowd = true;
  }
  if (text.includes('推车') || text.includes('婴儿车') || text.includes('无障碍')) {
    params.strollerFriendly = true;
  }
  
  // 健康需求（过敏、花粉、身体恢复）
  if (text.includes('过敏') || text.includes('花粉') || text.includes('花粉症') || text.includes('避开花粉')
      || text.includes('过敏性鼻炎') || text.includes('鼻炎') || text.includes('哮喘') || text.includes('敏感体质')) {
    params.health = 'allergy';
    params.indoors = true;
  }
  if (text.includes('身体恢复') || text.includes('刚康复') || text.includes('大病初愈') || text.includes('术后')
      || text.includes('需要休息') || text.includes('休养')) {
    params.health = 'recovering';
    params.lessCrowd = true;
  }
  
  // 停车需求
  if (text.includes('好停车') || text.includes('有停车场') || text.includes('开车方便') 
      || text.includes('停车方便') || text.includes('停车位充足')) {
    params.hasParking = true;
  }
  
  // 空间需求（地方大、能跑）
  if (text.includes('地方大') || text.includes('能跑') || text.includes('大草坪') 
      || text.includes('开阔') || text.includes('能跑能跳') || text.includes('空间大')) {
    if (!params.types.includes('park')) params.types.push('park');
    if (!params.types.includes('nature')) params.types.push('nature');
  }
  
  // 聚会场景
  if (text.includes('聚会') || text.includes('约了朋友') || text.includes('几个家庭') 
      || text.includes('生日') || text.includes('宝宝生日')) {
    if (!params.types.includes('park')) params.types.push('park');
    if (!params.types.includes('farm')) params.types.push('farm');
  }
  
  // 老人/全家出行
  if (text.includes('爷爷奶奶') || text.includes('老人') || text.includes('全家') || text.includes('不累')) {
    params.strollerFriendly = true;
    if (!params.types.includes('park')) params.types.push('park');
  }
  
  // 小月龄特殊处理
  if (text.includes('小月龄') || text.includes('6个月') || text.includes('百天') || text.includes('1岁不到')) {
    params.ageGroup = '0-1';
    params.strollerFriendly = true;
    params.maxDistance = 30;
  }
  
  // 多龄段需求
  if (text.includes('从1岁到') || text.includes('两个宝宝') || text.includes('年龄差') 
      || text.includes('大小孩') || text.includes('各年龄段')) {
    params.ageGroup = 'all';
  }
  
  // 餐饮配套需求（有吃的、有餐厅 → 商场优先）
  if (text.includes('附近有吃的') || text.includes('里面有餐厅') || text.includes('有餐饮') 
      || text.includes('吃饭方便') || text.includes('有吃的') || text.includes('餐厅') 
      || text.includes('吃饭的地方') || text.includes('美食') || text.includes('吃的地方多')) {
    if (!params.types.includes('mall')) params.types.push('mall');
    params.hasDining = true;
  }

  return params;
}
function filterByExtractedTypes(scoredItems, params) {
  if (!params.types || params.types.length === 0) return scoredItems;

  // 只保留类型匹配的地点
  const filtered = scoredItems.filter(item => {
    return item.types && item.types.some(t => params.types.includes(t));
  });

  // 如果类型过滤后结果为空，返回原数组（不加类型提升）
  if (filtered.length === 0) {
    return scoredItems;
  }

  // 对匹配的地点提升分数（按匹配类型数量加分，避免全部饱和）
  const boosted = filtered.map(item => {
    const matchCount = item.types.filter(t => params.types.includes(t)).length;
    return {
      ...item,
      score: item.score + matchCount * 5
    };
  });

  boosted.sort((a, b) => b.score - a.score);
  return boosted;
}

// 生成 AI 理解文本
function buildUnderstoodText(params) {
  const parts = [];

  if (params.ageGroup) {
    const ageText = { '0-1': '小月龄宝宝', '1-3': '学步期宝宝', '3-6': '学龄前宝宝', '6-12': '大孩子' }[params.ageGroup] || '宝宝';
    parts.push(`带${ageText}`);
  }

  if (params.indoors === true) parts.push('去室内');
  else if (params.indoors === false) parts.push('去户外');

  if (params.types.length > 0) {
    const typeLabels = {
      museum: '博物馆/展览', nature: '自然公园', zoo: '动物园/海洋馆',
      playground: '游乐场', mall: '商场', farm: '农场/采摘',
      science: '科技馆', culture: '文化场馆', water: '玩水/游泳'
    };
    parts.push(`玩${params.types.map(t => typeLabels[t] || t).join('、')}`);
  }

  if (params.maxDistance) parts.push(`${params.maxDistance}分钟内`);
  if (params.duration === 'full') parts.push('一整天');
  else if (params.duration === 'half') parts.push('半天');
  if (params.lessCrowd) parts.push('人少优先');
  if (params.strollerFriendly) parts.push('推车友好');

  if (parts.length === 0) return '帮你找几个合适的地方~';
  return `想${parts.join('，')}`;
}

// 应用提取的参数到全局 currentParams
function applyParamsToCurrent(params) {
  if (params.ageGroup) currentParams.age = params.ageGroup;
  if (params.indoors === true) {
    currentParams.indoors = true;
    currentParams.weather = 'indoor';
  } else if (params.indoors === false) {
    currentParams.indoors = false;
    currentParams.weather = 'sunny';
  }
  if (params.duration) currentParams.duration = params.duration;
  if (params.lessCrowd) currentParams.crowd = 'low';
  if (params.strollerFriendly) currentParams.stroller = true;
  if (params.hasParking) currentParams.hasParking = true;

  // 类型偏好映射到权重
  if (params.types.includes('museum') || params.types.includes('culture') || params.types.includes('science')) {
    weights.exhibition = 1;
  }
  if (params.types.includes('playground') || params.types.includes('farm')) {
    weights.activity = 1;
  }
  if (params.types.includes('nature') || params.types.includes('park')) {
    weights.outdoor = 1;
  }
  if (params.types.includes('mall')) {
    weights.indoor = 1;
  }
  if (params.types.includes('farm')) {
    weights.picking = 1;
  }
  if (params.types.includes('water')) {
    weights.water = 1;
  }
  if (params.lessCrowd) {
    weights.crowd = 1;
  }
}

// 分配排名
function assignRanks(items) {
  // 分数归一化：如果最高分超过98，映射到60-98范围，保留排名差异
  const scores = items.map(i => Number(i.score) || 0);
  const maxScore = Math.max(...scores, 1);

  if (maxScore > 98) {
    const minScore = Math.min(...scores);
    const range = maxScore - minScore;

    if (range > 0) {
      items = items.map(item => ({
        ...item,
        score: Math.round(60 + ((Number(item.score) || 0) - minScore) / range * 38)
      }));
    } else {
      items = items.map((item, idx) => ({
        ...item,
        score: Math.round(90 - idx * (25 / Math.max(items.length - 1, 1)))
      }));
    }
  }

  return items.map((item, index) => ({
    ...item,
    rank: index + 1,
    score: Math.max(0, Math.min(100, Number(item.score) || 0))
  }));
}

// ============================================
// 种草收藏夹 AI 分析
// ============================================
async function analyzeCollectionByAI(text) {
  if (!text || !isAIEnabled()) {
    return null;
  }

  const weatherInfo = window.weather || { saturday: 'sunny' };

  const systemPrompt = `你是一个专业的亲子出行内容分析助手。用户会粘贴从小红书、公众号等地方看到的遛娃相关内容，你需要：

1. 识别内容中提到的地点名称（支持模糊匹配和简称）：
   - 如果看到"红山动物园"，要识别为"红山森林动物园"
   - 如果看到"中山陵音乐台"，要关联到"中山陵"或"钟山风景区"
   - 如果看到"紫金山"，要关联到"钟山风景区"或"紫金山"相关地点
   - 如果看到"珍珠泉"、"栖霞山"等简称，要识别为完整名称
   - 支持各种句式："今天去了XX"、"带娃去了XX"、"XX真好玩"等

2. 判断地点类型（从以下选择：公园/博物馆/自然/动物园/游乐场/商场/农场/科技馆/文化/水乐园）

3. 判断是室内还是户外

4. 分析是否适合带娃去，给出理由（2-3条）

5. 建议是"本周可去"还是"预留到下周"还是"先收藏"
   - 如果是室内地点，本周可去
   - 如果是户外地点 + 周六有雨 → 建议预留到下周
   - 如果是户外地点 + 周六晴天 → 本周可去

6. 用口语化的、像朋友建议的语气

当前天气信息：周六天气=${weatherInfo.saturday}

返回 JSON 格式：
{
  "placeName": "识别到的地点名（尽量使用完整名称）",
  "matched": true/false,
  "type": "类型",
  "indoors": true/false,
  "analysis": "分析理由，2-3句话",
  "suggestion": "this_week" / "next_week" / "save_later",
  "suggestionReason": "为什么这么建议"
}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(AI_CONFIG.endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.5,
        max_tokens: 1000
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

    if (!content) {
      throw new Error('API 返回内容为空');
    }

    return parseAIResponse(content);
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('种草分析 AI 调用失败，降级到本地：', err);
    return null;
  }
}

// 生成动态加载步骤文字
function buildLoadingSteps(userInput) {
  const params = extractParamsFromInputLocal(userInput);
  const steps = [];

  // 步骤1：天气
  if (params.indoors === true) {
    steps.push({ title: '帮你看看天气~', subtitle: '夏天热/下雨天，室内更舒服' });
  } else {
    steps.push({ title: '帮你看看天气~', subtitle: '周六晴 27°C，出门刚刚好' });
  }

  // 步骤2：筛选
  let step2Title = '翻翻地点库...';
  let step2Subtitle = '从 50 个遛娃地里找最合适的';

  if (params.types.length > 0) {
    const typeLabels = {
      museum: '博物馆/展览', nature: '自然公园', zoo: '动物园/海洋馆',
      playground: '游乐场', mall: '商场', farm: '农场/采摘',
      science: '科技馆', culture: '文化场馆', water: '玩水/游泳'
    };
    const typeText = params.types.map(t => typeLabels[t] || t).join('、');
    step2Title = `筛选${typeText}...`;
    step2Subtitle = '找到了几个符合条件的地点';
  } else if (params.indoors === true) {
    step2Title = '筛选室内场所...';
    step2Subtitle = '找到了几个带空调的遛娃地';
  } else if (params.indoors === false) {
    step2Title = '筛选户外场所...';
    step2Subtitle = '找到了几个适合撒欢的户外地';
  } else if (params.lessCrowd) {
    step2Title = '查查哪里人比较少...';
    step2Subtitle = '排除了周末人多的热门景点';
  } else if (params.maxDistance) {
    step2Title = `筛选${params.maxDistance}分钟内的...`;
    step2Subtitle = '找到了几个距离合适的地方';
  }
  steps.push({ title: step2Title, subtitle: step2Subtitle });

  // 步骤3：适合宝宝
  let step3Title = '看看适不适合荔枝~';
  let step3Subtitle = '荔枝 3 岁了，这个年龄段正合适';

  if (params.ageGroup === '0-1') {
    step3Subtitle = '小月龄宝宝适合轻松、推车友好的地方';
  } else if (params.ageGroup === '1-3') {
    step3Subtitle = '学步期宝宝适合互动多、安全的地方';
  } else if (params.ageGroup === '6-12') {
    step3Subtitle = '大孩子可以玩得更丰富、更有挑战';
  }
  if (params.strollerFriendly) {
    step3Subtitle = '推车可以畅行，带娃不累';
  }
  steps.push({ title: step3Title, subtitle: step3Subtitle });

  // 步骤4：整理
  steps.push({ title: '整理一下推荐~', subtitle: '搞定！5 个好地方已备好' });

  return steps;
}

// 初始化
initAIConfig();
