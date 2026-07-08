// ============================================
// 财富江湖 - 核心引擎
// 数据模型 + AI调用 + 剧情生成 + 角色成长
// ============================================

const APP_KEY = 'wealth_jianghu_data';

// ============================================
// 默认数据模型
// ============================================
function getDefaultData() {
  return {
    user: {
      name: '少侠',
      age: '',
      job: '',
      city: '',
      income: 0,
      savings: 0,
      debt: 0,
      monthlyFixed: 0,
      riskLevel: '稳健'
    },
    hero: {
      level: 1,
      exp: 0,
      title: '初入江湖',
      coins: 0,
      forestStage: 0,
      wisdom: 10,
      courage: 10,
      luck: 10
    },
    stats: {
      healthScore: 0,
      totalCheckups: 0,
      totalDecisions: 0,
      totalPredictions: 0,
      goodDecisions: 0
    },
    buildings: { yiguan: 0, chatting: 0, guanxing: 0, zhulin: 0 },
    exams: [],
    decisions: [],
    predictions: [],
    chapters: [],
    quests: {
      active: [],
      completed: []
    },
    aiMode: 'simulate',
    apiKey: '',
    createdAt: new Date().toISOString()
  };
}

function getData() {
  const d = localStorage.getItem(APP_KEY);
  if (!d) return getDefaultData();
  try {
    const parsed = JSON.parse(d);
    // 合并默认值，兼容旧版
    return mergeDeep(getDefaultData(), parsed);
  } catch (e) {
    return getDefaultData();
  }
}

function saveData(data) {
  localStorage.setItem(APP_KEY, JSON.stringify(data));
}

function mergeDeep(defaults, source) {
  const output = JSON.parse(JSON.stringify(defaults));
  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = mergeDeep(output[key] || {}, source[key]);
    } else if (source[key] !== undefined) {
      output[key] = source[key];
    }
  }
  return output;
}

// ============================================
// 工具函数
// ============================================
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function formatMoney(n) {
  if (!n && n !== 0) return '--';
  return '¥' + Number(n).toLocaleString('zh-CN');
}

function getToday() { return new Date().toISOString().slice(0, 10); }

function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

// ============================================
// 江湖事件流（叙事层打通）
// ============================================
const EVENT_KEY = 'wealth_jianghu_events';

function pushEvent(npc, icon, message, style) {
  try {
    const raw = localStorage.getItem(EVENT_KEY);
    const events = raw ? JSON.parse(raw) : [];
    events.unshift({
      id: uid(),
      npc: npc,
      icon: icon,
      message: message,
      style: style || 'normal',
      time: new Date().toISOString()
    });
    // 最多保留 30 条
    if (events.length > 30) events.length = 30;
    localStorage.setItem(EVENT_KEY, JSON.stringify(events));
  } catch (e) {
    // 静默失败
  }
}

function getEvents() {
  try {
    const raw = localStorage.getItem(EVENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function getTitleByLevel(lv) {
  const titles = [
    '初入江湖', '江湖小虾米', '行走的账房', '精打细算客',
    '钱袋守护者', '财富游侠', '金银捕快', '财运宗师',
    '逍遥财主', '财富江湖传说'
  ];
  return titles[clamp(lv - 1, 0, titles.length - 1)];
}

function calcLevel(exp) {
  // 每级需要经验 = 等级 * 100
  let lv = 1;
  let need = 100;
  let remaining = exp;
  while (remaining >= need) {
    remaining -= need;
    lv++;
    need = lv * 100;
  }
  return { level: lv, exp: exp, curExp: remaining, needExp: need, pct: Math.min(remaining / need * 100, 100) };
}

function addExp(amount, reason) {
  const data = getData();
  data.hero.exp += amount;
  const beforeLv = data.hero.level;
  const lvInfo = calcLevel(data.hero.exp);
  data.hero.level = lvInfo.level;
  data.hero.title = getTitleByLevel(lvInfo.level);
  if (lvInfo.level > beforeLv) {
    data.hero.coins += lvInfo.level * 10;
  }
  saveData(data);
  return { ...lvInfo, leveledUp: lvInfo.level > beforeLv, reason };
}

function upgradeBuilding(key) {
  const data = getData();
  data.buildings[key] = Math.min((data.buildings[key] || 0) + 1, 5);
  saveData(data);
}

// ============================================
// 通义千问 API 调用
// ============================================
async function callQwen(systemPrompt, userPrompt) {
  const data = getData();
  if (!data.apiKey || data.aiMode !== 'real') return null;
  try {
    const res = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + data.apiKey
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });
    const json = await res.json();
    return json.output?.text || json.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error('AI调用失败：', e);
    return null;
  }
}

// ============================================
// 剧情章回生成器
// ============================================
const CHAPTER_TITLES = {
  exam: ['把脉诊金', '夜观钱脉', '医馆问诊', '银钱探源', '财脉通达'],
  decision: ['路遇钱掌柜', '客栈论价', '渡口抉择', '市井考验', '消费迷阵'],
  prediction: ['观星问运', '未来折扇', '十年一梦', '命运罗盘', '江湖远图']
};

function buildStoryPrompt(type, data, detail) {
  const user = data.user;
  const name = user.name || '少侠';
  const city = user.city || '某城';
  const job = user.job || '江湖人士';
  const income = user.income || 0;
  const savings = user.savings || 0;
  const debt = user.debt || 0;

  const base = `你是一位说书人，正在用古典章回体小说的风格，讲述一个现代中国人的财务江湖故事。
主角叫${name}，${user.age ? user.age + '岁' : '年纪不详'}，在${city}做${job}。
月收入约${formatMoney(income)}，积蓄${formatMoney(savings)}，负债${formatMoney(debt)}。`;

  if (type === 'exam') {
    return base + `\n\n刚刚主角在医馆完成了一次钱包体检，总分为${detail.score}分（满分100）。
八维度得分：储蓄${detail.dimensions.saving}、负债${detail.dimensions.debt}、流动性${detail.dimensions.liquidity}、保障${detail.dimensions.protection}、投资${detail.dimensions.investment}、消费${detail.dimensions.consumption}、目标${detail.dimensions.goal}、应急${detail.dimensions.emergency}。\n\n请生成一个章回标题（格式：第X回 · 标题）和一段200字以内的古风故事正文。
正文要包含：主角去了医馆，郎中（NPC）诊断出了什么问题，给了什么建议，主角听完有何感悟。
用中文古典小说风格，语言生动，有画面感。只输出标题和正文，不要其他内容。`;
  }

  if (type === 'decision') {
    return base + `\n\n主角在江湖路上遇到钱掌柜，正在犹豫是否要花${formatMoney(detail.amount)}购买/支出「${detail.item}」。\nAI判官给出的结论是：${detail.result}。\n理由是：${detail.reason}。\n\n请生成一个章回标题（格式：第X回 · 标题）和一段200字以内的古风故事正文。
正文要把这个消费决定写成江湖中的一段遭遇：钱掌柜如何引诱，主角如何抉择，结局如何，主角的修为（财商）有何变化。
用中文古典小说风格，生动有趣。只输出标题和正文。`;
  }

  if (type === 'prediction') {
    return base + `\n\n主角登上观星台，想知道自己能否在${detail.years}年内实现「${detail.goal}」目标，需要${formatMoney(detail.amount)}。\nAI推演给出的概率是${detail.prob}%，并给出路径建议。\n\n请生成一个章回标题（格式：第X回 · 标题）和一段200字以内的古风故事正文。
正文要写成观星师为主角展开一把折扇，扇面上显现未来景象，主角看到不同选择的结局，心生决断。
用中文古典小说风格，有画面感。只输出标题和正文。`;
  }

  return base;
}

function simulateStoryChapter(type, data, detail) {
  const name = data.user.name || '少侠';
  const city = data.user.city || '某城';
  const titles = CHAPTER_TITLES[type];
  const title = titles[Math.floor(Math.random() * titles.length)];
  const chapterNum = (data.chapters?.length || 0) + 1;
  let body = '';

  if (type === 'exam') {
    const score = detail.score;
    let diagnosis = score >= 80 ? '根基扎实，只需微调' : score >= 60 ? '略有隐疾，宜早调理' : '脉象凶险，需速治之';
    body = `却说${name}行至${city}医馆，郎中轻抚钱袋，闭目把脉。半晌睁眼道："${diagnosis}。`;
    if (score < 60) body += ' 储蓄薄弱，负债压身，若不加紧开源节流，恐有断粮之险。';
    else if (score < 80) body += ' 收入尚可，然保障不足，应急之金未备，一旦风雨来袭，难免狼狈。';
    else body += ' 收入稳健，储蓄充盈，负债可控，已是同辈中的佼佼者。';
    body += `"\n\n${name}闻言颔首，提笔在病历本上记下医嘱，心道：理财如习武，一日不可懈怠。`;
  }

  if (type === 'decision') {
    const resultText = detail.result === '值得' ? '毅然应下' : detail.result === '可考虑' ? '沉吟再三，终是按捺冲动' : '断然拒绝';
    body = `${name}行至茶亭，忽见钱掌柜捧着「${detail.item}」迎面而来，笑里藏刀："客官，此物只${formatMoney(detail.amount)}，错过可惜！"\n\n${name}${resultText}。旁观众人窃窃私语："${detail.reason}"\n\n此事一过，${name}摸摸钱袋，自觉修为又进一层。`;
  }

  if (type === 'prediction') {
    body = `夜幕降临，${name}独上观星台。观星师展开一把折扇，扇面星河流转。\n\n"${detail.goal}，需${formatMoney(detail.amount)}，以你今日修为，${detail.years}年内达成概率约${detail.prob}%。" 观星师指着扇面，"若每月多攒一成，概率可大增；若依旧挥霍，则如镜花水月。"\n\n${name}望着星河，心中已有定计。`;
  }

  return {
    id: uid(),
    type,
    title: `第${toChineseNum(chapterNum)}回 · ${title}`,
    body,
    date: getToday(),
    source: 'simulated'
  };
}

function toChineseNum(n) {
  const cn = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'];
  return n <= 15 ? cn[n] : '若干';
}

async function generateStoryChapter(type, detail) {
  const data = getData();
  const prompt = buildStoryPrompt(type, data, detail);
  let llmText = null;
  if (data.aiMode === 'real' && data.apiKey) {
    llmText = await callQwen('你是擅长写古典章回体小说的说书人，语言生动、有画面感，200字以内。', prompt);
  }

  let chapter;
  if (llmText) {
    const lines = llmText.split('\n').filter(l => l.trim());
    let title = lines[0] || '';
    let body = lines.slice(1).join('\n').trim();
    // 如果第一行不是“第X回”，则生成一个
    if (!title.includes('回')) {
      const chapterNum = (data.chapters?.length || 0) + 1;
      title = `第${toChineseNum(chapterNum)}回 · ${title.replace(/[·：:]/g, '').trim()}`;
    }
    chapter = {
      id: uid(), type, title, body,
      date: getToday(), source: 'llm'
    };
  } else {
    chapter = simulateStoryChapter(type, data, detail);
  }

  data.chapters = data.chapters || [];
  data.chapters.unshift(chapter);
  saveData(data);
  return chapter;
}

// ============================================
// 中国场景题库
// ============================================
const CHINESE_SCENARIOS = [
  {
    id: 'gift_money',
    name: '份子钱',
    icon: '🧧',
    desc: '婚礼/满月酒随多少合适？',
    template: '同事在${city}办婚礼，月薪${income}，该随多少份子钱？',
    factors: ['关系亲疏', '当地行情', '自身收入']
  },
  {
    id: 'house_down',
    name: '买房首付',
    icon: '🏠',
    desc: '攒首付 vs 先租房',
    template: '想在${city}买房，首付约${amount}，该现在开始攒钱还是继续租房？',
    factors: ['房价收入比', '公积金', '月供压力']
  },
  {
    id: 'spring_festival',
    name: '春节开销',
    icon: '🎆',
    desc: '红包、年货、聚会预算',
    template: '过年回${city}，要给父母红包、晚辈压岁钱、置办年货，预算该多少？',
    factors: ['家庭人数', '当地习俗', '年度结余']
  },
  {
    id: 'new_phone',
    name: '换手机',
    icon: '📱',
    desc: '分期买新机值不值',
    template: '看中新手机${amount}，旧手机还能用，要不要换/分期？',
    factors: ['旧机残值', '分期成本', '使用需求']
  },
  {
    id: 'gym_card',
    name: '健身年卡',
    icon: '💪',
    desc: '健康投资是否划算',
    template: '健身房年卡${amount}，离家远但设施好，值不值得办？',
    factors: ['使用频率', '替代方案', '健康收益']
  },
  {
    id: 'milk_tea',
    name: '奶茶外卖',
    icon: '🧋',
    desc: '每日小开销的积少成多',
    template: '每天一杯奶茶约30元，一个月就是900元，这笔钱值得花吗？',
    factors: ['频率', '健康', '替代成本']
  },
  {
    id: 'wedding_gift',
    name: '彩礼基金',
    icon: '💍',
    desc: '结婚彩礼与婚礼预算',
    template: '计划结婚，${city}习俗彩礼约${amount}，该如何规划？',
    factors: ['双方协商', '家庭支持', '长期目标']
  },
  {
    id: 'education_fund',
    name: '教育金',
    icon: '📚',
    desc: '孩子教育/自我提升',
    template: '想给孩子/自己准备一笔教育基金${amount}，该定投还是一次性存？',
    factors: ['时间跨度', '通胀', '风险承受']
  }
];

function getScenarioById(id) { return CHINESE_SCENARIOS.find(s => s.id === id); }

// ============================================
// 模拟诊断逻辑
// ============================================
function simulateExam(formData) {
  const income = Number(formData.income) || 0;
  const savings = Number(formData.savings) || 0;
  const debt = Number(formData.debt) || 0;
  const fixed = Number(formData.monthlyFixed) || 0;

  // 八维度评分
  const saving = clamp(Math.round((savings / Math.max(income * 6, 1)) * 100), 0, 100); // 6个月收入为100
  const debtScore = clamp(Math.round(100 - (debt / Math.max(income * 12, 1)) * 100), 0, 100);
  const liquidity = clamp(Math.round((savings / Math.max(fixed * 6, 1)) * 50), 0, 100); // 6个月固定支出
  const protection = Number(formData.insurance) || 50;
  const investment = Number(formData.invest) || 30;
  const consumption = clamp(100 - Math.round((Number(formData.flexible) || 0) / Math.max(income * 0.5, 1) * 50), 0, 100);
  const goal = Number(formData.goalClarity) || 50;
  const emergency = clamp(Math.round((savings / Math.max(fixed * 3, 1)) * 50), 0, 100);

  const dimensions = {
    saving, debt: debtScore, liquidity, protection, investment, consumption, goal, emergency
  };
  const score = Math.round(Object.values(dimensions).reduce((a, b) => a + b, 0) / 8);

  let overall = '健康';
  let advice = '财务状况良好，继续保持。';
  if (score < 60) { overall = '需调理'; advice = '储蓄薄弱或负债偏高，建议先建立应急金，控制非必要支出。'; }
  else if (score < 80) { overall = '亚健康'; advice = '整体尚可，但保障或目标规划不足，建议完善保险并制定储蓄计划。'; }
  else { overall = '康健'; advice = '财务根基扎实，可适当追求投资增值。'; }

  return { score, overall, advice, dimensions };
}

function simulateDecision(item, amount, income) {
  amount = Number(amount) || 0;
  income = Number(income) || 0;
  const ratio = income > 0 ? amount / income : 0;
  let result, reason, exp;
  if (ratio < 0.05) {
    result = '值得';
    reason = '金额占收入比例小，不会影响整体财务健康。';
    exp = 5;
  } else if (ratio < 0.3) {
    result = '可考虑';
    reason = '金额适中，建议确认是否真正需要，且不影响本月储蓄目标。';
    exp = 3;
  } else {
    result = '不值得';
    reason = '金额占收入比例过高，可能挤压储蓄和应急资金。';
    exp = 8;
  }
  return { result, reason, exp, ratio };
}

function simulatePrediction(goal, amount, years, data) {
  amount = Number(amount) || 0;
  years = Number(years) || 1;
  const income = Number(data.user.income) || 0;
  const savings = Number(data.user.savings) || 0;
  const monthlySave = income * 0.3; // 默认每月存30%
  const totalSave = savings + monthlySave * years * 12;
  const gap = amount - totalSave;
  let prob = clamp(Math.round((totalSave / amount) * 100), 0, 100);
  if (gap <= 0) prob = 100;
  let path = '';
  if (prob >= 80) path = '按当前节奏即可达成，建议稳健储蓄，避免大额冲动消费。';
  else if (prob >= 50) path = '有难度但可行，需每月提高储蓄比例至40%以上，并减少非必要支出。';
  else path = '差距较大，建议降低目标金额、延长期限，或寻找额外收入来源。';
  return { prob, gap, monthlySave, path };
}

// ============================================
// NPC 对话
// ============================================
const NPCS = {
  doctor: { name: '孙郎中', title: '医馆主人', avatar: '👴', color: '#5B8C6A' },
  merchant: { name: '钱掌柜', title: '客栈老板', avatar: '💰', color: '#C0392B' },
  astrologer: { name: '星语师', title: '观星台主', avatar: '🔮', color: '#7EC8E3' },
  fairy: { name: '竹仙', title: '竹林守护者', avatar: '🎋', color: '#4A7C59' },
  guide: { name: '老渔翁', title: '江湖引路人', avatar: '🎣', color: '#8D8468' }
};

function getNPCDialogue(npcId, context) {
  const npc = NPCS[npcId];
  const dialogues = {
    doctor: [
      '来者莫急，先伸出钱袋，老夫把一把脉。',
      '财脉如人脉，不通则痛。你这钱脉，需细细调理。',
      '良药苦口，忠言逆耳。老夫说的，你可要记牢。'
    ],
    merchant: [
      '客官里边请！今日小店有好货，价格实惠！',
      '这物件不多见，错过今日，明日可就涨价喽。',
      '买不买由你，但钱掌柜我从不坑人。'
    ],
    astrologer: [
      '星垂平野阔，月涌大江流。要看未来，先静心。',
      '这折扇上，有你十年的运势。',
      '命由天定，运由己造。我指给你看，路要自己走。'
    ],
    fairy: [
      '竹林深处有人家，你的修为，竹儿都记得。',
      '每做对一个决定，林中便多一株新竹。',
      '莫急，财富如竹，一节一节往上长。'
    ],
    guide: [
      '江湖路远，钱袋要稳，脚步要轻。',
      '前方医馆、茶亭、观星台、竹林，各有所获。',
      '少侠，先去创建角色，再来闯荡不迟。'
    ]
  };
  const list = dialogues[npcId] || dialogues.guide;
  return { ...npc, text: list[Math.floor(Math.random() * list.length)] };
}

// ============================================
// 任务系统
// ============================================
const QUEST_TEMPLATES = [
  { id: 'first_exam', name: '初入医馆', desc: '完成第一次钱包体检', reward: 30, type: 'exam' },
  { id: 'first_decision', name: '茶亭论价', desc: '完成第一次消费决策', reward: 20, type: 'decision' },
  { id: 'first_prediction', name: '夜观星象', desc: '完成第一次未来推演', reward: 25, type: 'prediction' },
  { id: 'three_good', name: '明辨是非', desc: '累计做出3次明智决策', reward: 50, type: 'decision' },
  { id: 'forest_grow', name: '竹林初成', desc: '竹林成长到第3阶段', reward: 40, type: 'zhulin' }
];

function checkQuests() {
  const data = getData();
  data.quests = data.quests || { active: [], completed: [] };
  const completedIds = data.quests.completed.map(q => q.id);
  const activeIds = data.quests.active.map(q => q.id);

  // 初始化新手任务
  QUEST_TEMPLATES.forEach(qt => {
    if (!completedIds.includes(qt.id) && !activeIds.includes(qt.id)) {
      data.quests.active.push({ ...qt, progress: 0, target: qt.id === 'three_good' ? 3 : 1 });
    }
  });

  // 更新进度
  data.quests.active = data.quests.active.map(q => {
    let progress = q.progress;
    if (q.id === 'first_exam') progress = Math.min(data.stats.totalCheckups || 0, 1);
    if (q.id === 'first_decision') progress = Math.min(data.stats.totalDecisions || 0, 1);
    if (q.id === 'first_prediction') progress = Math.min(data.stats.totalPredictions || 0, 1);
    if (q.id === 'three_good') progress = Math.min(data.stats.goodDecisions || 0, 3);
    if (q.id === 'forest_grow') progress = Math.min(data.hero.forestStage || 0, 3);
    return { ...q, progress };
  });

  // 完成奖励
  const newlyCompleted = [];
  data.quests.active = data.quests.active.filter(q => {
    if (q.progress >= q.target) {
      data.hero.exp += q.reward;
      data.hero.coins += Math.floor(q.reward / 5);
      newlyCompleted.push(q);
      return false;
    }
    return true;
  });
  data.quests.completed.push(...newlyCompleted);

  // 升级检查
  const lvInfo = calcLevel(data.hero.exp);
  if (lvInfo.level > data.hero.level) {
    data.hero.level = lvInfo.level;
    data.hero.title = getTitleByLevel(lvInfo.level);
  }

  saveData(data);
  return newlyCompleted;
}

function getForestStage() {
  const data = getData();
  const total = (data.stats.totalCheckups || 0) + (data.stats.totalDecisions || 0) + (data.stats.totalPredictions || 0);
  const good = data.stats.goodDecisions || 0;
  const score = total + good * 2;
  return clamp(Math.floor(score / 5), 0, 10);
}

function updateForest() {
  const data = getData();
  data.hero.forestStage = getForestStage();
  saveData(data);
}

// ============================================
// 徽章成就系统
// ============================================
const BADGE_TEMPLATES = [
  { 
    id: 'first_exam_badge', 
    name: '初入江湖', 
    desc: '完成首次钱包体检', 
    icon: 'cross',
    color: '#5B8C6A'
  },
  { 
    id: 'three_decisions_badge', 
    name: '明察秋毫', 
    desc: '完成3次消费决策', 
    icon: 'balance',
    color: '#C0392B'
  },
  { 
    id: 'first_prediction_badge', 
    name: '未卜先知', 
    desc: '完成首次未来推演', 
    icon: 'crystal',
    color: '#7EC8E3'
  }
];

function checkBadges() {
  const data = getData();
  data.badges = data.badges || { unlocked: [], locked: [] };
  
  const unlockedIds = data.badges.unlocked.map(b => b.id);
  
  BADGE_TEMPLATES.forEach(bt => {
    if (unlockedIds.includes(bt.id)) return;
    
    let shouldUnlock = false;
    if (bt.id === 'first_exam_badge') {
      shouldUnlock = (data.stats.totalCheckups || 0) >= 1;
    } else if (bt.id === 'three_decisions_badge') {
      shouldUnlock = (data.stats.totalDecisions || 0) >= 3;
    } else if (bt.id === 'first_prediction_badge') {
      shouldUnlock = (data.stats.totalPredictions || 0) >= 1;
    }
    
    if (shouldUnlock) {
      data.badges.unlocked.push({ ...bt, unlockedAt: getToday() });
    }
  });
  
  data.badges.locked = BADGE_TEMPLATES.filter(bt => !unlockedIds.includes(bt.id));
  
  saveData(data);
  return data.badges;
}

function getBadges() {
  const data = getData();
  return data.badges || { unlocked: [], locked: [] };
}

// ============================================
// 演示数据
// ============================================
function loadDemoData() {
  const demo = {
    user: { name: '林小满', age: 28, job: '上班族', city: '杭州', income: 12000, savings: 50000, debt: 8000, monthlyFixed: 6000, riskLevel: '稳健' },
    hero: { level: 3, exp: 280, title: '精打细算客', coins: 56, forestStage: 2, wisdom: 24, courage: 22, luck: 20 },
    stats: { healthScore: 72, totalCheckups: 2, totalDecisions: 3, totalPredictions: 1, goodDecisions: 2 },
    buildings: { yiguan: 2, chatting: 2, guanxing: 1, zhulin: 3 },
    exams: [
      { id: uid(), date: '2026-06-20', score: 68, overall: '亚健康', advice: '储蓄尚可，但保障与投资不足。', dimensions: { saving: 70, debt: 65, liquidity: 60, protection: 50, investment: 45, consumption: 75, goal: 60, emergency: 65 } },
      { id: uid(), date: '2026-06-25', score: 72, overall: '亚健康', advice: '整体改善，建议增加应急金。', dimensions: { saving: 75, debt: 70, liquidity: 65, protection: 55, investment: 50, consumption: 78, goal: 65, emergency: 70 } }
    ],
    decisions: [
      { id: uid(), date: '2026-06-21', item: '份子钱 800元', amount: 800, result: '可考虑', reason: '关系亲近，金额占月收入6.7%，需控制其他支出。', scenario: 'gift_money' },
      { id: uid(), date: '2026-06-22', item: 'iPhone 16 Pro 8999元', amount: 8999, result: '不值得', reason: '占月收入75%，建议攒钱或选性价比机型。', scenario: 'new_phone' },
      { id: uid(), date: '2026-06-23', item: '健身年卡 2000元', amount: 2000, result: '值得', reason: '健康投资，月均167元，可接受。', scenario: 'gym_card' }
    ],
    predictions: [
      { id: uid(), date: '2026-06-24', goal: '买房首付', amount: 300000, years: 5, prob: 58, path: '每月需存约5000元，并减少大额消费。' }
    ],
    chapters: [
      { id: uid(), type: 'exam', title: '第一回 · 把脉诊金', body: '林小满初入杭州医馆，孙郎中轻抚钱袋，闭目把脉。半晌道：“略有隐疾，宜早调理。收入虽稳，然应急金未备，保障不足，一旦风雨来袭，难免狼狈。”小满颔首，记下医嘱。', date: '2026-06-20', source: 'simulated' },
      { id: uid(), type: 'decision', title: '第二回 · 路遇钱掌柜', body: '林小满行至茶亭，钱掌柜捧着iPhone 16 Pro迎面而来：“客官，此机只8999，错过可惜！”小满断然拒绝。旁人私语：“占月收入75%，建议攒钱或选性价比机型。”小满摸摸钱袋，自觉修为又进一层。', date: '2026-06-22', source: 'simulated' }
    ],
    quests: {
      active: [{ id: 'three_good', name: '明辨是非', desc: '累计做出3次明智决策', reward: 50, type: 'decision', progress: 2, target: 3 }],
      completed: [
        { id: 'first_exam', name: '初入医馆', desc: '完成第一次钱包体检', reward: 30 },
        { id: 'first_decision', name: '茶亭论价', desc: '完成第一次消费决策', reward: 20 },
        { id: 'first_prediction', name: '夜观星象', desc: '完成第一次未来推演', reward: 25 }
      ]
    },
    badges: {
      unlocked: [
        { id: 'first_exam_badge', name: '初入江湖', desc: '完成首次钱包体检', icon: 'cross', color: '#5B8C6A', unlockedAt: '2026-06-20' },
        { id: 'three_decisions_badge', name: '明察秋毫', desc: '完成3次消费决策', icon: 'balance', color: '#C0392B', unlockedAt: '2026-06-23' },
        { id: 'first_prediction_badge', name: '未卜先知', desc: '完成首次未来推演', icon: 'crystal', color: '#7EC8E3', unlockedAt: '2026-06-24' }
      ],
      locked: []
    },
    aiMode: 'simulate',
    apiKey: ''
  };
  saveData(demo);
  return demo;
}

console.log('[财富江湖] 核心引擎已加载');
