// AI 路径陪伴系统 —— 应用状态与渲染逻辑

const appState = {
  step: 'welcome',
  candidateDirections: [],
  primaryDirection: '',
  directionConditions: {},
  currentConditionDirIndex: 0,
  breakdown: {
    actions: [],
    aiSuccess: false
  },
  contract: {
    title: '',
    period: 60,
    minStandards: [],
    expectations: [],
    archived: [],
    reminder: ''
  },
  progress: {
    currentDay: 18,
    completedWorks: 3,
    totalWorks: 8,
    publishedWorks: 2,
    totalTimeHours: 42,
    feedbackCount: 4,
    nextReviewDate: '2026-08-02'
  },
  progressChecklist: [],
  waver: {
    currentQuestion: 0,
    answers: {},
    customAnswers: {},
    diagnosisResult: null
  }
};

// 基于用户输入生成最小可行动作（规则引擎兜底）
function generateBreakdownActions(dir, conditions) {
  const desiredResults = conditions?.desiredResults || '';
  const existingFoundation = conditions?.existingFoundation || '';
  const resources = conditions?.resources || '';

  const isCreative = /视频|创作|内容|设计|摄影|写作|撰稿/.test(dir);
  const isBusiness = /品牌|创业|产品|商业|副业/.test(dir);
  const isJob = /上班|工作|求职|转行/.test(dir);
  const isTech = /开发|编程|AI|技术/.test(dir);

  let actions = [];

  if (isCreative) {
    actions = [
      '完成第 1 个完整作品的选题与脚本',
      '制作并发布第 1 个作品',
      '收集第 1 条真实外部反馈',
      '测试第 2 种内容方向并发布',
      '完成第 3 个作品，总结制作流程',
      '测试第 3 种内容方向',
      '完成 6 个作品后做第一次阶段复盘'
    ];
  } else if (isBusiness) {
    actions = [
      '完成目标用户画像与痛点调研',
      '完成 3 位潜在用户深度访谈',
      '输出最小可行产品（MVP）方案',
      '完成 1 款样品/原型制作',
      '调研 3 个以上销售渠道',
      '发起小范围预售或试用测试',
      '根据反馈迭代产品方案'
    ];
  } else if (isJob) {
    actions = [
      '更新并优化个人简历与作品集',
      '投递 10 份针对性简历',
      '完成 3 次模拟面试训练',
      '获得第 1 次面试机会',
      '完成 5 次有效面试',
      '梳理面试问题库与回答框架',
      '拿到 1 个以上 offer 后做阶段复盘'
    ];
  } else if (isTech) {
    actions = [
      '确定技术栈与学习路线',
      '完成第 1 个 Demo 项目',
      '完成第 2 个 Demo 项目',
      '完成 1 个完整小项目并开源',
      '整理技术笔记与心得',
      '完成第 4、5 个 Demo 项目',
      '完成 6 个项目后做阶段复盘'
    ];
  } else {
    actions = [
      '明确方向的具体定义与目标',
      '完成第 1 次最小行动尝试',
      '记录第 1 次行动的感受与收获',
      '完成第 2 次行动并优化方法',
      '测试第 3 种不同切入方式',
      '收集至少 3 条外部反馈',
      '完成 6 次行动后做阶段复盘'
    ];
  }

  if (existingFoundation && existingFoundation.length > 30) {
    actions = actions.slice(1);
    actions.unshift('基于已有基础，确定进阶起点');
  }

  return actions;
}

// 基于用户输入动态生成最低验证标准
function generateMinStandards(dir, conditions) {
  const desired = [];
  const desiredResults = conditions?.desiredResults || '';
  const existingFoundation = conditions?.existingFoundation || '';
  const resources = conditions?.resources || '';

  // 从资源中提取时间周期
  let periodDays = 60;
  const periodMatch = resources.match(/(\d+)\s*天/);
  if (periodMatch) periodDays = parseInt(periodMatch[1]);

  // 从资源中提取每周投入时间
  let weeklyHours = 10;
  const weeklyMatch = resources.match(/每周.*?(\d+)\s*小时/);
  if (weeklyMatch) weeklyHours = parseInt(weeklyMatch[1]);

  // 根据方向类型生成验证标准
  const isCreative = /视频|创作|内容|设计|摄影|写作|撰稿/.test(dir);
  const isBusiness = /品牌|创业|产品|商业|副业/.test(dir);
  const isJob = /上班|工作|求职|转行/.test(dir);
  const isTech = /开发|编程|AI|技术/.test(dir);

  // 基础通用项
  desired.push(`完成 ${periodDays >= 60 ? 8 : 5} 个最小验证动作`);
  desired.push('完成 3 次阶段复盘');
  desired.push('收集至少 5 条真实外部反馈');

  if (isCreative) {
    desired.unshift('公开发布至少 6 个作品');
    desired.unshift('完成 8 个完整作品');
    desired.splice(3, 0, '测试 3 种内容方向');
  } else if (isBusiness) {
    desired.unshift('完成 5 个目标用户深度访谈');
    desired.unshift('输出 1 份最小可行产品原型');
    desired.splice(3, 0, '调研 3 个以上销售渠道');
  } else if (isJob) {
    desired.unshift('完成 10 次有效面试或内推');
    desired.unshift('更新并投递 30 份针对性简历');
    desired.splice(3, 0, '完成 3 次职业方向模拟面试');
  } else if (isTech) {
    desired.unshift('完成 6 个可运行的 Demo 项目');
    desired.unshift('完成 1 个完整项目并开源');
    desired.splice(3, 0, '积累 1 份技术作品集');
  } else {
    desired.unshift('输出 6 份可展示成果');
  }

  // 根据已有基础调整难度
  if (existingFoundation && existingFoundation.length > 20) {
    desired[0] = desired[0].replace(/8 个/g, '10 个').replace(/6 个/g, '8 个').replace(/5 个/g, '6 个');
  }

  // 根据投入时间调整
  if (weeklyHours >= 20) {
    desired[0] = desired[0].replace(/8 个/g, '10 个').replace(/6 个/g, '8 个');
  }

  // 去重并保留前6项
  return [...new Set(desired)].slice(0, 6);
}

// 基于用户输入生成当前期待
function generateExpectations(dir, conditions) {
  const desiredResults = conditions?.desiredResults || '';
  const lines = desiredResults.split(/[;；\n]/).filter(s => s.trim()).slice(0, 3);
  if (lines.length > 0) {
    return lines.map(l => l.trim());
  }
  return [
    '形成可展示的成果',
    '获得真实外部反馈',
    '判断方向是否值得继续'
  ];
}

// 生成 AI 推荐方向评分
function scoreDirection(dir, conditions) {
  const existingFoundation = conditions?.existingFoundation || '';
  const resources = conditions?.resources || '';
  const desiredResults = conditions?.desiredResults || '';
  let score = 50;

  // 已有基础加分
  if (existingFoundation.length > 40) score += 20;
  else if (existingFoundation.length > 20) score += 10;

  // 投入资源充足加分
  if (/每周.*?20\s*小时/.test(resources)) score += 10;
  if (/60\s*天/.test(resources) || /2\s*个月/.test(resources)) score += 5;

  // 目标明确加分
  if (desiredResults.length > 30) score += 5;

  // 方向类型难度调整
  if (/视频|创作|设计/.test(dir)) score += 5;
  if (/创业|品牌/.test(dir)) score -= 10;

  return Math.min(100, Math.max(30, score));
}

// 获取推荐方向
function getRecommendedDirection() {
  if (appState.candidateDirections.length === 0) return '';
  let bestDir = appState.candidateDirections[0];
  let bestScore = 0;
  appState.candidateDirections.forEach(dir => {
    const score = scoreDirection(dir, appState.directionConditions[dir]);
    if (score > bestScore) {
      bestScore = score;
      bestDir = dir;
    }
  });
  return bestDir;
}

// 内置方向数据
const DIRECTION_DATA = {
  'AI 视频创作': {
    analysis: '已有能力基础较强；可以在 60 天内形成作品集；可通过公开作品获得真实反馈；与用户希望建立个人职业能力的目标较一致。',
    recommendReason: '你已经拥有相关经验和初始作品，在当前时间与预算条件下，它是最容易形成有效成果和外部反馈的方向。',
    contractTitle: 'AI 视频商业创作者验证',
    minStandards: [
      '完成 8 个 AI 视频作品',
      '公开发布至少 6 个',
      '测试 3 种内容方向',
      '完成 3 次阶段复盘',
      '收集至少 5 条真实外部反馈'
    ],
    expectations: [
      '建立一组完整作品',
      '提升 AI 视频制作效率',
      '验证是否能够获得合作咨询'
    ],
    reminder: '当连续几条作品数据不好时，我很可能会想换方向。但在完成最低验证量之前，我还没有足够证据证明这条路不适合我。',
    nextAction: '完成第 4 个作品的脚本与分镜',
    reportMetrics: [
      { label: '完成作品', value: 8, unit: '个' },
      { label: '公开发布', value: 7, unit: '个' },
      { label: '测试方向', value: 3, unit: '种' },
      { label: '平均制作时间', value: '7h', unit: '从 15h 下降' },
      { label: '有效反馈', value: 6, unit: '条' },
      { label: '潜在合作咨询', value: 2, unit: '次' }
    ],
    reportAnalysis: '本轮验证没有证明用户适合制作所有类型的 AI 视频，但证明其在故事型、商业型短片方向具备较明显优势。',
    correctionFrom: '泛 AI 视频创作',
    correctionTo: '品牌故事型 AI 短片创作'
  },
  '全职上班': {
    analysis: '可以提供短期稳定收入；但与本次“建立个人作品与创作路径”的目标不同；可以作为现实保障方案保留，而不是本轮主要验证方向。',
    recommendReason: '它能提供现金流安全感，但在当前“建立个人作品与创作路径”的目标下，建议作为保障方案保留，而非本轮主要验证方向。',
    contractTitle: '全职工作稳定性验证',
    minStandards: [
      '明确当前岗位可提供的现金流保障周期',
      '评估岗位对个人长期目标的支持度',
      '保留 60 天创作/副业验证窗口',
      '完成 3 次阶段复盘',
      '确定是否调整工作投入比例'
    ],
    expectations: [
      '获得稳定现金流',
      '保留精力验证创作方向',
      '明确工作与生活目标的边界'
    ],
    reminder: '当创作遇到瓶颈时，我可能会想全身心投入工作。但在完成最低验证量之前，我还没有足够证据判断创作方向是否可行。',
    nextAction: '整理本周可投入创作的具体时间段',
    reportMetrics: [
      { label: '稳定收入月数', value: 3, unit: '个月' },
      { label: '每周投入创作', value: 8, unit: '小时' },
      { label: '完成副业作品', value: 4, unit: '个' },
      { label: '主业满意度', value: 7, unit: '/10' },
      { label: '有效反馈', value: 3, unit: '条' },
      { label: '潜在机会', value: 1, unit: '次' }
    ],
    reportAnalysis: '全职工作提供了稳定现金流，但用户在创作方向的验证进度不足，建议继续以兼职方式完成最低验证量后再做判断。',
    correctionFrom: '依赖全职收入',
    correctionTo: '全职保底 + 副业验证并行'
  },
  '手工品牌创业': {
    analysis: '目前仍处于想法和准备阶段；需要产品设计、打样、供应链和销售测试；在 60 天内完成商业验证的成本较高。',
    recommendReason: '这是一个有长期价值的方向，但当前在 60 天内完成商业验证的成本较高，建议先封存，待资源更充足时再启动。',
    contractTitle: '手工品牌创业验证',
    minStandards: [
      '完成 3 款核心产品设计稿',
      '完成至少 1 款样品打样',
      '调研 5 个潜在销售渠道',
      '完成 3 次阶段复盘',
      '收集至少 5 条目标用户反馈'
    ],
    expectations: [
      '验证产品设计是否被市场接受',
      '明确供应链与成本结构',
      '判断是否值得投入更多资源'
    ],
    reminder: '当 AI 视频数据不好时，我可能会觉得手工品牌更容易变现。但在完成最低验证量之前，我还没有足够证据判断哪个方向更适合我。',
    nextAction: '完成第一款产品的设计草图与用户画像',
    reportMetrics: [
      { label: '产品设计稿', value: 3, unit: '款' },
      { label: '完成打样', value: 1, unit: '款' },
      { label: '销售渠道调研', value: 5, unit: '个' },
      { label: '单件成本估算', value: '¥45', unit: '完成' },
      { label: '目标用户反馈', value: 6, unit: '条' },
      { label: '预售意向', value: 2, unit: '人' }
    ],
    reportAnalysis: '手工品牌在 60 天内完成了初步验证，但商业闭环尚未跑通，建议继续以小成本方式迭代，同时保留主职业收入。',
    correctionFrom: '泛手工品牌创业',
    correctionTo: '小众定制手工品类创业'
  }
};

// 默认方向数据兜底
function getDirectionData(name) {
  return (
    DIRECTION_DATA[name] || {
      analysis: '该方向具有一定探索价值，建议结合你的基础、资源与目标进一步拆解验证标准。',
      recommendReason: '基于你当前提供的信息，这个方向与你的描述较为匹配，可作为本轮优先验证方向。',
      contractTitle: `${name}验证`,
      minStandards: [
        '完成最低验证动作 8 次',
        '公开分享或展示至少 6 次',
        '测试 3 种不同切入方式',
        '完成 3 次阶段复盘',
        '收集至少 5 条真实外部反馈'
      ],
      expectations: ['形成可展示的成果', '获得真实外部反馈', '判断方向是否值得继续'],
      reminder: `当遇到低谷时，我可能会想换方向。但在完成最低验证量之前，我还没有足够证据判断${name}这条路是否适合我。`,
      nextAction: '完成下一个最小验证动作',
      reportMetrics: [
        { label: '完成验证动作', value: 8, unit: '次' },
        { label: '公开分享', value: 6, unit: '次' },
        { label: '测试方式', value: 3, unit: '种' },
        { label: '平均耗时', value: '-30%', unit: '下降' },
        { label: '有效反馈', value: 5, unit: '条' },
        { label: '潜在机会', value: 2, unit: '次' }
      ],
      reportAnalysis: '本轮验证完成了基础行动量，方向潜力初显，但仍需更多证据支持最终决策。',
      correctionFrom: `泛${name}`,
      correctionTo: `聚焦型${name}`
    }
  );
}

// 动摇诊断问题
const QUIZ_QUESTIONS = [
  {
    id: 'reason',
    question: '这次想放弃的直接原因是什么？',
    options: [
      '连续发布后流量没有明显增长',
      '觉得自己不适合这个方向',
      '遇到了具体的技能或资源瓶颈',
      '其它原因'
    ]
  },
  {
    id: 'dislikeType',
    question: `你是不喜欢这条路径本身，还是不喜欢现在的执行方式？`,
    options: [
      '主要是执行方式太累，投入和反馈不成正比',
      '不喜欢这件事本身',
      '两者都有点',
      '其它原因'
    ]
  },
  {
    id: 'newInfo',
    question: '最近是否出现了足以改变原选择的新信息？',
    options: [
      '没有，只是觉得另一个方向可能更容易',
      '有，发现了新的市场需求或机会',
      '有，原方向出现了不可控的负面变化',
      '其它原因'
    ]
  },
  {
    id: 'progress',
    question: '目前完成了多少最低验证任务？',
    options: ['查看当前进度']
  }
];

// DOM 元素缓存
const els = {};

function init() {
  cacheElements();
  bindEvents();
  navigateTo('welcome', false);
}

function cacheElements() {
  els.views = document.querySelectorAll('.view');

  els.welcomeStartBtn = document.getElementById('welcomeStartBtn');

  els.directionGrid = document.getElementById('directionGrid');
  els.customDirectionBtn = document.getElementById('customDirectionBtn');
  els.customInputWrap = document.getElementById('customInputWrap');
  els.customDirectionInput = document.getElementById('customDirectionInput');
  els.directionHint = document.getElementById('directionHint');
  els.primaryDirectionList = document.getElementById('primaryDirectionList');
  els.directionNextBtn = document.getElementById('directionNextBtn');

  els.conditionTabs = document.getElementById('conditionTabs');
  els.condTabPrev = document.getElementById('condTabPrev');
  els.condTabNext = document.getElementById('condTabNext');
  els.conditionDirectionLabel = document.getElementById('conditionDirectionLabel');
  els.desiredResults = document.getElementById('desiredResults');
  els.existingFoundation = document.getElementById('existingFoundation');
  els.resources = document.getElementById('resources');
  els.conditionsNextBtn = document.getElementById('conditionsNextBtn');

  els.analysisList = document.getElementById('analysisList');
  els.recommendName = document.getElementById('recommendName');
  els.recommendReason = document.getElementById('recommendReason');
  els.analysisNextBtn = document.getElementById('analysisNextBtn');

  els.breakdownPathTitle = document.getElementById('breakdownPathTitle');
  els.breakdownList = document.getElementById('breakdownList');
  els.breakdownCount = document.getElementById('breakdownCount');
  els.addBreakdownBtn = document.getElementById('addBreakdownBtn');
  els.breakdownConfirmBtn = document.getElementById('breakdownConfirmBtn');

  els.contractTitle = document.getElementById('contractTitle');
  els.contractStandards = document.getElementById('contractStandards');
  els.contractExpectations = document.getElementById('contractExpectations');
  els.contractArchived = document.getElementById('contractArchived');
  els.contractReminderInput = document.getElementById('contractReminderInput');
  els.contractSignBtn = document.getElementById('contractSignBtn');

  els.dashboardTitle = document.getElementById('dashboardTitle');
  els.dashboardProgressRing = document.getElementById('dashboardProgressRing');
  els.dashboardProgressNumber = document.getElementById('dashboardProgressNumber');
  els.dashboardDayText = document.getElementById('dashboardDayText');
  els.dashboardNextAction = document.getElementById('dashboardNextAction');
  els.progressChecklist = document.getElementById('progressChecklist');
  els.dashboardParking = document.getElementById('dashboardParking');
  els.giveUpBtn = document.getElementById('giveUpBtn');
  els.viewReportBtn = document.getElementById('viewReportBtn');

  els.waverReminder = document.getElementById('waverReminder');
  els.quizStepNumber = document.getElementById('quizStepNumber');
  els.quizQuestion = document.getElementById('quizQuestion');
  els.quizOptions = document.getElementById('quizOptions');
  els.quizCustomWrap = document.getElementById('quizCustomWrap');
  els.quizCustomInput = document.getElementById('quizCustomInput');
  els.quizNextBtn = document.getElementById('quizNextBtn');

  els.diagnosisResult = document.getElementById('diagnosisResult');
  els.strategyCard = document.getElementById('strategyCard');
  els.strategyReframe = document.getElementById('strategyReframe');
  els.strategyList = document.getElementById('strategyList');
  els.switchPathCard = document.getElementById('switchPathCard');
  els.diagnosisActions = document.getElementById('diagnosisActions');
  els.acceptStrategyBtn = document.getElementById('acceptStrategyBtn');

  els.reportPeriodText = document.getElementById('reportPeriodText');
  els.reportPathTitle = document.getElementById('reportPathTitle');
  els.reportMetrics = document.getElementById('reportMetrics');
  els.reportAnalysis = document.getElementById('reportAnalysis');
  els.correctionFrom = document.getElementById('correctionFrom');
  els.correctionTo = document.getElementById('correctionTo');
  els.reportConclusion = document.getElementById('reportConclusion');
}

function bindEvents() {
  // 欢迎页
  els.welcomeStartBtn.addEventListener('click', () => navigateTo('direction'));

  // 方向选择
  els.directionGrid.querySelectorAll('.direction-card[data-value]').forEach((card) => {
    card.addEventListener('click', () => toggleDirection(card.dataset.value));
  });

  // 自定义方向
  els.customDirectionBtn.addEventListener('click', () => {
    els.customInputWrap.classList.toggle('hidden');
    if (!els.customInputWrap.classList.contains('hidden')) {
      els.customDirectionInput.focus();
    }
  });

  els.customDirectionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const value = els.customDirectionInput.value.trim();
      if (value && !appState.candidateDirections.includes(value)) {
        if (appState.candidateDirections.length >= 3) {
          alert('最多只能选择 3 个方向');
          return;
        }
        appState.candidateDirections.push(value);
        addCustomDirectionCard(value);
        els.customDirectionInput.value = '';
        renderDirectionSelection();
      }
    }
  });

  // 下一步按钮
  els.directionNextBtn.addEventListener('click', () => {
    appState.currentConditionDirIndex = 0;
    navigateTo('conditions');
  });

  // 验证条件页标签切换
  els.condTabPrev.addEventListener('click', () => {
    if (appState.currentConditionDirIndex > 0) {
      saveCurrentCondition();
      appState.currentConditionDirIndex -= 1;
      renderConditionsPage();
    }
  });

  els.condTabNext.addEventListener('click', () => {
    if (appState.currentConditionDirIndex < appState.candidateDirections.length - 1) {
      saveCurrentCondition();
      appState.currentConditionDirIndex += 1;
      renderConditionsPage();
    }
  });

  // 验证条件下一步
  els.conditionsNextBtn.addEventListener('click', () => {
    saveCurrentCondition();
    const currentDir = appState.candidateDirections[appState.currentConditionDirIndex];
    const cond = appState.directionConditions[currentDir];
    if (!cond || !cond.desiredResults || !cond.existingFoundation || !cond.resources) {
      alert('请完整填写当前方向的验证条件');
      return;
    }

    // 如果还有下一个方向，自动跳转
    if (appState.currentConditionDirIndex < appState.candidateDirections.length - 1) {
      appState.currentConditionDirIndex += 1;
      renderConditionsPage();
      return;
    }

    // 检查是否所有方向都填完了
    const allFilled = appState.candidateDirections.every((dir) => {
      const c = appState.directionConditions[dir];
      return c && c.desiredResults && c.existingFoundation && c.resources;
    });

    if (!allFilled) {
      alert('请为所有方向填写完整的验证条件');
      return;
    }

    navigateTo('analysis');
  });

  els.analysisNextBtn.addEventListener('click', async () => {
    if (!appState.primaryDirection) {
      alert('请选择一条要验证的路径');
      return;
    }
    // 进入路径拆分页并触发 AI 拆分
    await navigateToBreakdownWithAI();
  });
  els.addBreakdownBtn.addEventListener('click', () => {
    appState.breakdown.actions.push('新的动作');
    renderBreakdownList();
  });

  els.breakdownConfirmBtn.addEventListener('click', async () => {
    const actions = appState.breakdown.actions.filter(a => a.trim());
    if (actions.length === 0) {
      alert('请至少添加一个可行动作');
      return;
    }
    appState.breakdown.actions = actions;
    // 进入契约页并触发 AI 分析
    await navigateToContractWithAI();
  });

  els.contractSignBtn.addEventListener('click', () => {
    const reminder = els.contractReminderInput.value.trim();
    if (reminder) {
      appState.contract.reminder = reminder;
    }
    // 基于路径拆分的动作初始化进度追踪
    appState.progressChecklist = appState.breakdown.actions.map((text) => ({ text, done: false }));
    // 更新进度总数
    appState.progress.totalWorks = appState.breakdown.actions.length;
    appState.progress.completedWorks = 0;
    // 根据周期更新当前天（演示数据：30%进度）
    appState.progress.currentDay = Math.floor(appState.contract.period * 0.3);
    navigateTo('dashboard');
  });
  els.giveUpBtn.addEventListener('click', () => {
    appState.waver.currentQuestion = 0;
    appState.waver.answers = {};
    appState.waver.customAnswers = {};
    navigateTo('waver');
  });
  els.viewReportBtn.addEventListener('click', () => navigateTo('report'));
  els.quizNextBtn.addEventListener('click', () => handleQuizNext());
  els.acceptStrategyBtn.addEventListener('click', () => {
    const data = getDirectionData(appState.primaryDirection);
    data.nextAction = '完成一条 20 秒轻量作品，控制在 3 天内发布';
    navigateTo('dashboard');
  });

  // 返回按钮
  document.querySelectorAll('[data-back]').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.back));
  });
}

function addCustomDirectionCard(value) {
  const card = document.createElement('button');
  card.className = 'direction-card selected';
  card.type = 'button';
  card.dataset.value = value;
  card.innerHTML = `<span class="direction-emoji">✨</span><span class="direction-name">${escapeHtml(value)}</span>`;
  card.addEventListener('click', () => toggleDirection(value));
  els.directionGrid.insertBefore(card, els.customDirectionBtn);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function toggleDirection(value) {
  const index = appState.candidateDirections.indexOf(value);
  if (index >= 0) {
    appState.candidateDirections.splice(index, 1);
    delete appState.directionConditions[value];
  } else {
    if (appState.candidateDirections.length >= 3) {
      alert('最多只能选择 3 个方向');
      return;
    }
    appState.candidateDirections.push(value);
  }
  renderDirectionSelection();
}

function renderDirectionSelection() {
  const cards = els.directionGrid.querySelectorAll('.direction-card[data-value]');
  cards.forEach((card) => {
    const value = card.dataset.value;
    const selected = appState.candidateDirections.includes(value);
    card.classList.toggle('selected', selected);
    card.classList.toggle('disabled', !selected && appState.candidateDirections.length >= 3);
  });

  els.directionHint.textContent = `已选 ${appState.candidateDirections.length} / 3`;
  els.directionNextBtn.disabled = appState.candidateDirections.length === 0;
}

function navigateTo(step, animate = true) {
  appState.step = step;

  els.views.forEach((view) => {
    const isTarget = view.id === `view-${step}`;
    if (isTarget) {
      view.classList.add('active');
      if (animate) {
        view.style.opacity = '0';
        view.style.transform = 'translateY(16px)';
        requestAnimationFrame(() => {
          view.style.opacity = '1';
          view.style.transform = 'translateY(0)';
        });
      }
    } else {
      view.classList.remove('active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderView(step);
}

function renderView(step) {
  switch (step) {
    case 'conditions':
      renderConditionsPage();
      break;
    case 'analysis':
      renderAnalysis();
      break;
    case 'breakdown':
      renderBreakdown();
      break;
    case 'contract':
      renderContract();
      break;
    case 'dashboard':
      renderDashboard();
      break;
    case 'waver':
      renderWaver();
      break;
    case 'diagnosis':
      renderDiagnosis();
      break;
    case 'report':
      renderReport();
      break;
    default:
      break;
  }
}

// 保存当前方向的条件
function saveCurrentCondition() {
  const dir = appState.candidateDirections[appState.currentConditionDirIndex];
  if (!dir) return;
  appState.directionConditions[dir] = {
    desiredResults: els.desiredResults.value.trim(),
    existingFoundation: els.existingFoundation.value.trim(),
    resources: els.resources.value.trim()
  };
}

// 渲染验证条件页
function renderConditionsPage() {
  const dirs = appState.candidateDirections;
  const idx = appState.currentConditionDirIndex;
  const currentDir = dirs[idx];

  // 渲染标签
  els.conditionTabs.innerHTML = dirs
    .map((dir, i) => {
      const cond = appState.directionConditions[dir];
      const isCompleted = cond && cond.desiredResults && cond.existingFoundation && cond.resources;
      return `
        <button class="condition-tab ${i === idx ? 'active' : ''} ${isCompleted ? 'completed' : ''}" data-index="${i}" type="button">
          ${escapeHtml(dir)}
        </button>
      `;
    })
    .join('');

  els.conditionTabs.querySelectorAll('.condition-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      saveCurrentCondition();
      appState.currentConditionDirIndex = parseInt(tab.dataset.index);
      renderConditionsPage();
    });
  });

  els.condTabPrev.disabled = idx <= 0;
  els.condTabNext.disabled = idx >= dirs.length - 1;

  els.conditionDirectionLabel.textContent = `正在为「${currentDir}」填写验证条件`;

  // 恢复当前方向的数据
  const cond = appState.directionConditions[currentDir] || {};
  els.desiredResults.value = cond.desiredResults || '';
  els.existingFoundation.value = cond.existingFoundation || '';
  els.resources.value = cond.resources || '';

  // 更新按钮文案
  const isLast = idx === dirs.length - 1;
  const allPrevFilled = dirs.slice(0, idx).every((d) => {
    const c = appState.directionConditions[d];
    return c && c.desiredResults && c.existingFoundation && c.resources;
  });

  if (isLast && allPrevFilled) {
    els.conditionsNextBtn.textContent = '生成 AI 路径分析';
  } else {
    els.conditionsNextBtn.textContent = isLast ? '生成 AI 路径分析' : '下一个方向';
  }
}

function renderAnalysis() {
  const recommended = getRecommendedDirection();
  const allDirections = [...appState.candidateDirections];

  els.analysisList.innerHTML = allDirections
    .map((dir) => {
      const isRecommended = dir === recommended;
      const isSelected = dir === appState.primaryDirection;
      const data = getDirectionData(dir);
      const cond = appState.directionConditions[dir];
      const score = scoreDirection(dir, cond);
      return `
        <div class="analysis-item ${isSelected ? 'recommended' : ''}" data-dir="${escapeHtml(dir)}">
          <div class="analysis-header">
            <span class="analysis-name">${escapeHtml(dir)}</span>
            ${isRecommended ? '<span class="analysis-badge">AI 推荐</span>' : ''}
            ${isSelected ? '<span class="analysis-badge" style="background:var(--accent);">已选择</span>' : ''}
          </div>
          <p class="analysis-body">${data.analysis}</p>
          <div class="analysis-footer">
            <span class="analysis-score">匹配度：<b>${score}</b> / 100</span>
            <button class="btn btn-primary btn-small" data-select-dir="${escapeHtml(dir)}" type="button">
              ${isSelected ? '✓ 已选此路径' : '选择此路径'}
            </button>
          </div>
        </div>
      `;
    })
    .join('');

  // 绑定选择按钮
  els.analysisList.querySelectorAll('[data-select-dir]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      appState.primaryDirection = btn.dataset.selectDir;
      renderAnalysis();
      updateAnalysisNextBtn();
    });
  });

  const recData = getDirectionData(recommended);
  els.recommendName.textContent = recommended;
  els.recommendReason.textContent = recData.recommendReason;

  updateAnalysisNextBtn();
}

function updateAnalysisNextBtn() {
  if (appState.primaryDirection) {
    els.analysisNextBtn.disabled = false;
    els.analysisNextBtn.textContent = `确认「${appState.primaryDirection}」为主路径`;
  } else {
    els.analysisNextBtn.disabled = true;
    els.analysisNextBtn.textContent = '请选择一条路径';
  }
}

// ===== AI 分析相关 =====

const AI_PROXY_URL = 'http://localhost:3000';

// 调用 AI 生成路径拆分（最小可行动作）
async function askAIForBreakdown(direction, conditions) {
  const prompt = `你是一位专业的行动规划教练，擅长将模糊的大目标拆解为具体可执行的最小行动。

用户选择了「${direction}」作为验证方向。

用户填写的验证条件如下：
- 希望获得的结果：${conditions.desiredResults || '未填写'}
- 已有基础：${conditions.existingFoundation || '未填写'}
- 可投入资源：${conditions.resources || '未填写'}

请将这个方向的验证目标拆解为 6-8 个最小可行动作，按先后顺序排列。

要求：
1. 每个动作都是一个具体的、可以在 1-3 天内完成的最小单元
2. 动作之间有逻辑递进关系，从易到难
3. 每个动作以动词开头，清晰具体
4. 考虑用户的已有基础和可投入资源，难度适中
5. 第 1 个动作应该是最简单的启动动作，降低开始门槛
6. 中间穿插 1-2 个复盘/反馈收集动作

请以 JSON 格式返回，结构如下：
{
  "actions": ["动作1", "动作2", "动作3", ...]
}`;

  const response = await fetch(AI_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: '你是行动规划教练，擅长目标拆解。必须返回 JSON。' },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`AI 服务返回 ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI 返回内容为空');
  }

  return JSON.parse(content);
}

// 调用 AI 生成最低验证标准
async function askAIForStandards(direction, conditions) {
  const prompt = `你是一位专业的路径规划顾问。用户选择了「${direction}」作为验证方向。

用户填写的验证条件如下：
- 希望获得的结果：${conditions.desiredResults || '未填写'}
- 已有基础：${conditions.existingFoundation || '未填写'}
- 可投入资源：${conditions.resources || '未填写'}

请基于以上信息，为用户生成个性化的最低验证标准。

要求：
1. 生成 5-6 条具体的、可量化的验证标准
2. 标准要基于用户的实际资源和基础，具有可执行性
3. 每条标准以动词开头
4. 同时生成 3 条用户对这段验证期的期待
5. 生成一段「冷静时的自己给动摇时的自己」的提醒语（50-80字）

请以 JSON 格式返回，结构如下：
{
  "minStandards": ["标准1", "标准2", ...],
  "expectations": ["期待1", "期待2", "期待3"],
  "reminder": "提醒语"
}`;

  const response = await fetch(AI_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: '你是路径规划顾问，擅长将模糊目标拆解为可验证的最小行动标准。必须返回 JSON。' },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`AI 服务返回 ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI 返回内容为空');
  }

  return JSON.parse(content);
}

// 带加载状态的路径拆分页导航
async function navigateToBreakdownWithAI() {
  navigateTo('breakdown');
  showBreakdownLoading();

  const primary = appState.primaryDirection;
  const conditions = appState.directionConditions[primary] || {};
  const data = getDirectionData(primary);

  appState.contract.title = data.contractTitle;
  appState.contract.archived = appState.candidateDirections.filter((d) => d !== primary);

  try {
    const aiResult = await askAIForBreakdown(primary, conditions);
    appState.breakdown.actions = aiResult.actions || generateBreakdownActions(primary, conditions);
    appState.breakdown.aiSuccess = true;
  } catch (err) {
    console.warn('AI 路径拆分失败，降级为规则引擎:', err.message);
    appState.breakdown.actions = generateBreakdownActions(primary, conditions);
    appState.breakdown.aiSuccess = false;
  }

  renderBreakdownContent();
}

function showBreakdownLoading() {
  const list = els.breakdownList;
  list.innerHTML = `
    <div class="breakdown-loading">
      <div class="ai-loading-spinner"></div>
      <div class="breakdown-loading-text">
        <h4>AI 正在拆解你的路径...</h4>
        <p>基于你的目标、基础和资源，生成最小可行动作</p>
      </div>
    </div>
  `;
  els.breakdownCount.textContent = '生成中...';
}

function renderBreakdownContent() {
  els.breakdownPathTitle.textContent = appState.contract.title;
  renderBreakdownList();
}

function renderBreakdownList() {
  const actions = appState.breakdown.actions;
  els.breakdownCount.textContent = `${actions.length} 个动作`;

  if (actions.length === 0) {
    els.breakdownList.innerHTML = '<p class="hint">还没有动作，点击下方按钮添加。</p>';
    return;
  }

  els.breakdownList.innerHTML = actions
    .map(
      (action, i) => `
      <div class="breakdown-item" data-index="${i}">
        <span class="breakdown-handle">⋮⋮</span>
        <input type="text" class="breakdown-input" value="${escapeHtml(action)}" data-index="${i}" />
        <button class="breakdown-delete" data-index="${i}" type="button" title="删除">×</button>
      </div>
    `
    )
    .join('');

  els.breakdownList.querySelectorAll('.breakdown-input').forEach((input) => {
    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.index);
      appState.breakdown.actions[idx] = e.target.value;
    });
  });

  els.breakdownList.querySelectorAll('.breakdown-delete').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.index);
      appState.breakdown.actions.splice(idx, 1);
      renderBreakdownList();
    });
  });
}

function renderBreakdown() {
  const primary = appState.primaryDirection;
  const data = getDirectionData(primary);

  appState.contract.title = data.contractTitle;
  appState.contract.archived = appState.candidateDirections.filter((d) => d !== primary);

  if (appState.breakdown.actions.length === 0) {
    els.breakdownPathTitle.textContent = data.contractTitle;
    showBreakdownLoading();
    const conditions = appState.directionConditions[primary] || {};
    appState.breakdown.actions = generateBreakdownActions(primary, conditions);
    appState.breakdown.aiSuccess = false;
    setTimeout(() => renderBreakdownContent(), 800);
  } else {
    renderBreakdownContent();
  }
}

// 带加载状态的契约页导航
async function navigateToContractWithAI() {
  navigateTo('contract');
  showContractLoading();

  const primary = appState.primaryDirection;
  const conditions = appState.directionConditions[primary] || {};
  const data = getDirectionData(primary);

  // 先用规则引擎填充基础数据（兜底）
  appState.contract.title = data.contractTitle;
  appState.contract.archived = appState.candidateDirections.filter((d) => d !== primary);

  try {
    const aiResult = await askAIForStandards(primary, conditions);

    appState.contract.minStandards = aiResult.minStandards || generateMinStandards(primary, conditions);
    appState.contract.expectations = aiResult.expectations || generateExpectations(primary, conditions);
    appState.contract.reminder = aiResult.reminder || data.reminder;
    appState._aiSuccess = true;
  } catch (err) {
    console.warn('AI 分析失败，降级为规则引擎:', err.message);
    appState.contract.minStandards = generateMinStandards(primary, conditions);
    appState.contract.expectations = generateExpectations(primary, conditions);
    appState.contract.reminder = data.reminder;
    appState._aiSuccess = false;
  }

  renderContractContent();
}

function showContractLoading() {
  const contractCard = document.querySelector('#view-contract .contract-card');
  if (contractCard) {
    contractCard.style.opacity = '0.5';
    contractCard.style.pointerEvents = 'none';
  }
  // 在契约卡片上方插入加载提示
  const loadingHtml = `
    <div class="card ai-loading-card" id="aiLoadingCard">
      <div class="ai-loading">
        <div class="ai-loading-spinner"></div>
        <div>
          <h3 class="ai-loading-title">AI 正在分析你的路径...</h3>
          <p class="ai-loading-text">基于你填写的方向、基础和资源，生成个性化的验证标准</p>
        </div>
      </div>
    </div>
  `;
  const contractView = document.getElementById('view-contract');
  const existing = document.getElementById('aiLoadingCard');
  if (!existing) {
    contractView.querySelector('.contract-card').insertAdjacentHTML('beforebegin', loadingHtml);
  }
}

function renderContractContent() {
  // 移除加载提示
  const loadingCard = document.getElementById('aiLoadingCard');
  if (loadingCard) loadingCard.remove();

  // 恢复契约卡片
  const contractCard = document.querySelector('#view-contract .contract-card');
  if (contractCard) {
    contractCard.style.opacity = '1';
    contractCard.style.pointerEvents = 'auto';
  }

  const data = getDirectionData(appState.primaryDirection);
  els.contractTitle.textContent = appState.contract.title;
  els.contractStandards.innerHTML = appState.contract.minStandards.map((s) => `<li>${escapeHtml(s)}</li>`).join('');
  els.contractExpectations.innerHTML = appState.contract.expectations.map((e) => `<li>${escapeHtml(e)}</li>`).join('');

  if (appState.contract.archived.length === 0) {
    els.contractArchived.innerHTML = '<span class="tag">暂无</span>';
  } else {
    els.contractArchived.innerHTML = appState.contract.archived.map((d) => `<span class="tag">${escapeHtml(d)}</span>`).join('');
  }

  els.contractReminderInput.value = appState.contract.reminder;

  // 显示 AI 来源标识
  const reminderCard = els.contractReminderInput.closest('.card');
  const existingBadge = reminderCard.querySelector('.ai-source-badge');
  if (existingBadge) existingBadge.remove();
  const badge = document.createElement('div');
  badge.className = 'ai-source-badge';
  badge.innerHTML = appState._aiSuccess
    ? '<span class="ai-badge ai-badge-success">✨ 已由 AI 个性化生成，可自行修改</span>'
    : '<span class="ai-badge ai-badge-fallback">⚠️ AI 服务暂不可用，已使用规则生成，可自行修改</span>';
  reminderCard.querySelector('h3').insertAdjacentElement('afterend', badge);
}

function renderContract() {
  const primary = appState.primaryDirection;
  const data = getDirectionData(primary);
  const conditions = appState.directionConditions[primary] || {};

  appState.contract.title = data.contractTitle;
  appState.contract.minStandards = generateMinStandards(primary, conditions);
  appState.contract.expectations = generateExpectations(primary, conditions);
  appState.contract.archived = appState.candidateDirections.filter((d) => d !== primary);
  if (!appState.contract.reminder) {
    appState.contract.reminder = data.reminder;
  }

  els.contractTitle.textContent = data.contractTitle;
  els.contractStandards.innerHTML = appState.contract.minStandards.map((s) => `<li>${escapeHtml(s)}</li>`).join('');
  els.contractExpectations.innerHTML = appState.contract.expectations.map((e) => `<li>${escapeHtml(e)}</li>`).join('');

  if (appState.contract.archived.length === 0) {
    els.contractArchived.innerHTML = '<span class="tag">暂无</span>';
  } else {
    els.contractArchived.innerHTML = appState.contract.archived.map((d) => `<span class="tag">${escapeHtml(d)}</span>`).join('');
  }

  els.contractReminderInput.value = appState.contract.reminder;
}

function renderDashboard() {
  const data = getDirectionData(appState.primaryDirection);
  els.dashboardTitle.textContent = data.contractTitle;
  els.dashboardDayText.textContent = `验证这条路的第 ${appState.progress.currentDay} 天`;

  if (appState.progressChecklist.length > 0) {
    const nextItem = appState.progressChecklist.find((item) => !item.done);
    els.dashboardNextAction.textContent = nextItem ? nextItem.text : data.nextAction;
  } else {
    els.dashboardNextAction.textContent = data.nextAction;
  }

  // 进度环
  const percent = Math.min(100, (appState.progress.completedWorks / appState.progress.totalWorks) * 100);
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (percent / 100) * circumference;
  els.dashboardProgressRing.style.strokeDasharray = `${circumference}`;
  els.dashboardProgressRing.style.strokeDashoffset = `${circumference}`;
  els.dashboardProgressNumber.textContent = Math.round(percent);

  requestAnimationFrame(() => {
    els.dashboardProgressRing.style.strokeDashoffset = `${offset}`;
  });

  // 进度追踪
  if (appState.progressChecklist.length === 0) {
    appState.progressChecklist = data.minStandards.map((text) => ({ text, done: false }));
  }
  els.progressChecklist.innerHTML = appState.progressChecklist
    .map(
      (item, i) => `
      <div class="progress-check-item ${item.done ? 'done' : ''}" data-index="${i}">
        <span class="progress-check-checkbox"></span>
        <span class="progress-check-text">${escapeHtml(item.text)}</span>
      </div>
    `
    )
    .join('');

  els.progressChecklist.querySelectorAll('.progress-check-item').forEach((el) => {
    el.addEventListener('click', () => {
      const i = parseInt(el.dataset.index);
      appState.progressChecklist[i].done = !appState.progressChecklist[i].done;
      // 更新已完成作品数
      const doneCount = appState.progressChecklist.filter((x) => x.done).length;
      appState.progress.completedWorks = Math.min(appState.progress.totalWorks, doneCount);
      renderDashboard();
    });
  });

  // 想法停车场（可展开/收起）
  const parking = appState.candidateDirections.filter((d) => d !== appState.primaryDirection);
  const parkingCard = els.dashboardParking.parentElement;

  if (parking.length === 0) {
    els.dashboardParking.innerHTML = '<p class="hint" style="margin:0">暂无封存方向</p>';
  } else {
    els.dashboardParking.innerHTML = parking
      .map((d, i) => {
        const cond = appState.directionConditions[d] || {};
        return `
        <div class="parking-item">
          <div class="parking-item-header">
            <span class="parking-item-name">${escapeHtml(d)}</span>
            <span class="parking-item-arrow">›</span>
          </div>
          <div class="parking-item-detail hidden">
            <div class="parking-detail-row">
              <span class="parking-detail-label">希望结果</span>
              <span class="parking-detail-text">${escapeHtml(cond.desiredResults || '未填写')}</span>
            </div>
            <div class="parking-detail-row">
              <span class="parking-detail-label">已有基础</span>
              <span class="parking-detail-text">${escapeHtml(cond.existingFoundation || '未填写')}</span>
            </div>
            <div class="parking-detail-row">
              <span class="parking-detail-label">可投入资源</span>
              <span class="parking-detail-text">${escapeHtml(cond.resources || '未填写')}</span>
            </div>
          </div>
        </div>
      `;
      })
      .join('');

    els.dashboardParking.querySelectorAll('.parking-item-header').forEach((header) => {
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        const detail = header.nextElementSibling;
        const arrow = header.querySelector('.parking-item-arrow');
        detail.classList.toggle('hidden');
        arrow.classList.toggle('open');
      });
    });
  }

  const parkingHeader = parkingCard.querySelector('.parking-lot-header');
  const parkingContent = parkingCard.querySelector('.parking-lot-content');
  const parkingArrow = parkingCard.querySelector('.parking-lot-arrow');

  parkingHeader.addEventListener('click', () => {
    parkingContent.classList.toggle('hidden');
    parkingArrow.classList.toggle('open');
  });
}

function renderWaver() {
  els.waverReminder.textContent = appState.contract.reminder;
  const qIndex = appState.waver.currentQuestion;
  const q = QUIZ_QUESTIONS[qIndex];

  els.quizStepNumber.textContent = qIndex + 1;
  els.quizQuestion.textContent = q.question;

  if (q.id === 'progress') {
    const percent = ((appState.progress.completedWorks / appState.progress.totalWorks) * 100).toFixed(1);
    els.quizOptions.innerHTML = `
      <div class="quiz-progress">
        已完成 ${appState.progress.completedWorks} / ${appState.progress.totalWorks} 个作品，当前验证进度 ${percent}%。
      </div>
      <button class="quiz-option selected" data-value="ack">
        <span class="quiz-option-marker"></span>
        <span>我已了解当前进度</span>
      </button>
    `;
    els.quizCustomWrap.classList.add('hidden');
    appState.waver.answers[q.id] = 'ack';
    els.quizNextBtn.disabled = false;
  } else {
    const selectedValue = appState.waver.answers[q.id];
    const isOther = selectedValue === '其它原因';
    els.quizOptions.innerHTML = q.options
      .map(
        (opt) => `
        <button class="quiz-option ${selectedValue === opt ? 'selected' : ''}" data-value="${escapeHtml(opt)}">
          <span class="quiz-option-marker"></span>
          <span>${escapeHtml(opt)}</span>
        </button>
      `
      )
      .join('');

    if (isOther) {
      els.quizCustomWrap.classList.remove('hidden');
      els.quizCustomInput.value = appState.waver.customAnswers[q.id] || '';
      els.quizNextBtn.disabled = !els.quizCustomInput.value.trim();
    } else {
      els.quizCustomWrap.classList.add('hidden');
      els.quizNextBtn.disabled = !selectedValue;
    }
  }

  els.quizOptions.querySelectorAll('.quiz-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      appState.waver.answers[q.id] = btn.dataset.value;
      if (btn.dataset.value !== '其它原因') {
        appState.waver.customAnswers[q.id] = '';
      }
      renderWaver();
    });
  });

  els.quizCustomInput.oninput = () => {
    appState.waver.customAnswers[q.id] = els.quizCustomInput.value.trim();
    els.quizNextBtn.disabled = !els.quizCustomInput.value.trim();
  };

  if (qIndex === QUIZ_QUESTIONS.length - 1) {
    els.quizNextBtn.textContent = '查看诊断结果';
  } else {
    els.quizNextBtn.textContent = '下一步';
  }
}

function handleQuizNext() {
  const qIndex = appState.waver.currentQuestion;
  if (qIndex < QUIZ_QUESTIONS.length - 1) {
    appState.waver.currentQuestion += 1;
    renderWaver();
  } else {
    runDiagnosis();
    navigateTo('diagnosis');
  }
}

function runDiagnosis() {
  const answers = appState.waver.answers;
  const custom = appState.waver.customAnswers;
  const percent = (appState.progress.completedWorks / appState.progress.totalWorks) * 100;
  const reasons = [];

  // 判断是否应该建议更换路径
  const dislikesCore = answers.dislikeType && answers.dislikeType.includes('不喜欢这件事本身');
  const negativeChange = answers.newInfo && answers.newInfo.includes('不可控的负面变化');
  const shouldSwitch = dislikesCore || negativeChange;

  if (shouldSwitch) {
    if (dislikesCore) {
      reasons.push('用户明确表示不喜欢当前路径本身');
    }
    if (negativeChange) {
      reasons.push('原方向出现了不可控的负面变化');
    }
    if (percent >= 50) {
      reasons.push('已完成一定验证量，具备转向判断基础');
    }

    appState.waver.diagnosisResult = {
      shouldSwitch: true,
      title: '建议考虑更换路径',
      reasons,
      reframe: '',
      strategies: []
    };
    return;
  }

  // 不建议更换路径
  if (percent < 100) {
    reasons.push('尚未完成最低作品验证量');
  }

  if (answers.dislikeType && !answers.dislikeType.includes('不喜欢')) {
    reasons.push(`用户并不排斥${appState.primaryDirection}本身`);
  }

  if (answers.reason && (answers.reason.includes('制作时间太长') || custom.reason?.includes('时间'))) {
    reasons.push('当前主要问题是制作周期过长');
  }

  if (answers.reason && answers.reason.includes('流量')) {
    reasons.push('当前主要问题是短期反馈不足');
  }

  if (answers.newInfo && answers.newInfo.includes('没有')) {
    reasons.push('想更换方向主要由短期低反馈触发');
    reasons.push('没有出现改变原决策的新证据');
  }

  appState.waver.diagnosisResult = {
    shouldSwitch: false,
    title: '当前不建议更换路径',
    reasons,
    reframe: '需要调整的不是方向，而是单条作品的制作成本。',
    strategies: [
      '下一条视频从 60 秒缩短为 20 秒',
      '优先复用已有角色和场景',
      '将制作周期控制在 3 天以内',
      '暂停追求复杂镜头和完整叙事',
      '完成两条轻量作品后再次复盘'
    ]
  };
}

function renderDiagnosis() {
  const result = appState.waver.diagnosisResult;
  if (!result) return;

  els.diagnosisResult.innerHTML = `
    <span class="diagnosis-badge">诊断结论</span>
    <h2 class="diagnosis-title">${result.title}</h2>
    <ul class="diagnosis-reasons">
      ${result.reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}
    </ul>
  `;

  if (result.shouldSwitch) {
    els.strategyCard.classList.add('hidden');
    els.switchPathCard.classList.remove('hidden');
    els.diagnosisActions.innerHTML = `
      <button class="btn btn-ghost" data-back="dashboard">返回首页</button>
      <button class="btn btn-primary" id="switchPathBtn">换一条路试试</button>
    `;
    document.getElementById('switchPathBtn').addEventListener('click', () => {
      navigateTo('direction');
    });
  } else {
    els.strategyCard.classList.remove('hidden');
    els.switchPathCard.classList.add('hidden');
    els.strategyReframe.textContent = result.reframe;
    els.strategyList.innerHTML = result.strategies.map((s) => `<li>${escapeHtml(s)}</li>`).join('');
    els.diagnosisActions.innerHTML = `
      <button class="btn btn-primary" id="acceptStrategyBtn">接受路径校正</button>
    `;
    document.getElementById('acceptStrategyBtn').addEventListener('click', () => {
      const data = getDirectionData(appState.primaryDirection);
      data.nextAction = '完成一条 20 秒轻量作品，控制在 3 天内发布';
      navigateTo('dashboard');
    });
  }
}

function renderReport() {
  const data = getDirectionData(appState.primaryDirection);
  els.reportPeriodText.textContent = `验证周期：2026-06-26 至 2026-08-25 · 共 ${appState.progress.period} 天`;
  els.reportPathTitle.textContent = `${data.contractTitle}结果`;

  els.reportMetrics.innerHTML = data.reportMetrics
    .map(
      (m) => `
      <div class="metric-card">
        <span class="metric-label">${m.label}</span>
        <div>
          <span class="metric-value">${m.value}</span>
          ${m.unit ? `<span class="metric-unit">${m.unit}</span>` : ''}
        </div>
      </div>
    `
    )
    .join('');

  els.reportAnalysis.textContent = data.reportAnalysis;
  els.correctionFrom.textContent = data.correctionFrom;
  els.correctionTo.textContent = data.correctionTo;
  els.reportConclusion.textContent = '你没有得到一个永久的人生答案，但已经获得了足以支持下一步选择的真实证据。';
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);
