// ========================================================
// 人生显化模拟器 — Pixel Cyberpunk Edition
// ========================================================
(function () {
  'use strict';

  var currentStep = 0;
  var answers = {};
  var allQuestions = [];
  var weeklyPlan = [];
  var globalSkills = null;
  var globalPlan = null;
  var startDate = new Date();
  var tasksCompleted = 0;
  var totalTasks = 0;

  // ============ SCREEN MANAGEMENT ============
  window.showScreen = function (id) {
    var screens = document.querySelectorAll('.screen');
    screens.forEach(function (s) { s.classList.remove('active'); });
    var target = document.getElementById('screen-' + id);
    if (target) { target.classList.add('active'); window.scrollTo(0, 0); }
  };

  // ============ PIXEL AVATAR SVGs ============
  var avatarLevels = [
    '<rect fill="#00E5FF" x="6" y="2" width="4" height="2"/><rect fill="#00E5FF" x="4" y="4" width="8" height="2"/><rect fill="#B388FF" x="4" y="6" width="2" height="4"/><rect fill="#B388FF" x="10" y="6" width="2" height="4"/><rect fill="#00E5FF" x="6" y="8" width="4" height="2"/><rect fill="#e8e8f0" x="5" y="10" width="2" height="4"/><rect fill="#e8e8f0" x="9" y="10" width="2" height="4"/>',
    '<rect fill="#00E5FF" x="5" y="1" width="6" height="2"/><rect fill="#00E5FF" x="3" y="3" width="10" height="2"/><rect fill="#B388FF" x="3" y="5" width="2" height="6"/><rect fill="#B388FF" x="11" y="5" width="2" height="6"/><rect fill="#00E5FF" x="5" y="7" width="6" height="2"/><rect fill="#FFD740" x="6" y="5" width="4" height="2"/><rect fill="#e8e8f0" x="4" y="9" width="3" height="5"/><rect fill="#e8e8f0" x="9" y="9" width="3" height="5"/>',
    '<rect fill="#00E5FF" x="4" y="0" width="8" height="2"/><rect fill="#00E5FF" x="2" y="2" width="12" height="2"/><rect fill="#00E5FF" x="2" y="4" width="12" height="2"/><rect fill="#B388FF" x="2" y="6" width="3" height="6"/><rect fill="#B388FF" x="11" y="6" width="3" height="6"/><rect fill="#FFD740" x="5" y="6" width="6" height="2"/><rect fill="#00E676" x="6" y="4" width="4" height="2"/><rect fill="#e8e8f0" x="3" y="10" width="4" height="5"/><rect fill="#e8e8f0" x="9" y="10" width="4" height="5"/>',
    '<rect fill="#00E5FF" x="3" y="0" width="10" height="2"/><rect fill="#00E5FF" x="1" y="2" width="14" height="2"/><rect fill="#00E5FF" x="1" y="4" width="14" height="2"/><rect fill="#B388FF" x="1" y="6" width="4" height="8"/><rect fill="#B388FF" x="11" y="6" width="4" height="8"/><rect fill="#FFD740" x="5" y="6" width="6" height="3"/><rect fill="#00E676" x="5" y="4" width="6" height="2"/><rect fill="#FF5252" x="6" y="2" width="4" height="2"/><rect fill="#e8e8f0" x="2" y="12" width="5" height="3"/><rect fill="#e8e8f0" x="9" y="12" width="5" height="3"/>'
  ];

  function updatePixelAvatar(level) {
    var svg = avatarLevels[Math.min(level, avatarLevels.length - 1)];
    var containers = document.querySelectorAll('.pixel-avatar svg');
    containers.forEach(function (el) { el.innerHTML = svg; });
    var badge = document.querySelector('#welcomeAvatar .level-badge');
    if (badge) badge.textContent = 'LV.' + (level + 1);
  }

  // ============ GIFT SYSTEM ============
  window.showGift = function (title, desc, icon) {
    document.getElementById('giftTitle').textContent = title || 'GIFT UNLOCKED!';
    document.getElementById('giftDesc').textContent = desc || 'You earned a reward!';
    document.getElementById('giftIcon').innerHTML = icon || '&#127873;';
    document.getElementById('giftOverlay').classList.add('active');
  };
  window.closeGift = function () {
    document.getElementById('giftOverlay').classList.remove('active');
  };

  // ============ QUESTIONS ============
  var baseQuestions = [
    {
      id: 'goal', number: 'Q1', text: '你想成为什么样的人？',
      desc: '选择最接近你内心渴望的方向，这决定了你的人生蓝图底色。',
      type: 'single',
      options: [
        { value: 'civil_servant', icon: '&#9878;', title: '公务员 / 体制内', desc: '追求稳定、编制内工作、社会地位保障' },
        { value: 'teacher', icon: '&#9997;', title: '教师 / 教育工作者', desc: '传播知识、教书育人、有寒暑假的规律生活' },
        { value: 'engineer', icon: '&#9881;', title: '工程师 / 技术专家', desc: '用技术改变世界、高薪、逻辑驱动的成就感' },
        { value: 'doctor', icon: '&#9764;', title: '医生 / 医疗工作者', desc: '救死扶伤、专业壁垒高、社会尊重' },
        { value: 'rich', icon: '&#9733;', title: '有钱有权的人', desc: '追求财富自由和阶层跃升，商业精英路线' },
        { value: 'free', icon: '&#10022;', title: '自由自在的人', desc: '数字游民、自由职业、不受固定地点约束的生活' },
        { value: 'creative', icon: '&#9835;', title: '创作者 / 艺术家', desc: '用作品表达自我、追求灵感驱动的人生' },
        { value: 'entrepreneur', icon: '&#9889;', title: '创业者 / 自己当老板', desc: '打造自己的事业、承受风险换取无限可能' }
      ]
    },
    {
      id: 'age', number: 'Q2', text: '你现在的年龄是？',
      desc: '不同年龄阶段，策略和资源完全不同。',
      type: 'single',
      options: [
        { value: '18', icon: '&#127891;', title: '18 岁', desc: '刚成年，高中毕业/即将上大学' },
        { value: '19_20', icon: '&#128214;', title: '19-20 岁', desc: '大学低年级，探索期' },
        { value: '21_22', icon: '&#128187;', title: '21-22 岁', desc: '大学高年级，面临毕业选择' },
        { value: '23_25', icon: '&#128188;', title: '23-25 岁', desc: '刚毕业，职场新人/研究生初期' }
      ]
    }
  ];

  function generateDynamicQuestions() {
    var questions = [];
    var goal = answers.goal;
    questions.push({
      id: 'location', number: 'Q3', text: '你目前所在的环境是？',
      desc: '这决定了你的起跑线和可利用的资源类型。',
      type: 'single',
      options: [
        { value: 'tier1', icon: '&#127961;', title: '一线城市（北上广深）', desc: '资源密集、竞争激烈、机会多但成本高' },
        { value: 'tier2', icon: '&#127961;', title: '新一线/二线城市', desc: '发展快速、生活成本适中、性价比选择' },
        { value: 'tier3_small', icon: '&#127970;', title: '三四线城市/小县城', desc: '典型的"小镇做题家"起点，资源有限但试错成本低' },
        { value: 'rural', icon: '&#127806;', title: '农村/乡镇', desc: '从零开始，信息差和资源差最大' }
      ]
    });
    questions.push({
      id: 'education', number: 'Q4', text: '你目前的学历/学习状态是？',
      desc: '学历是跳板，但不是终点。',
      type: 'single',
      options: [
        { value: 'high_school', icon: '&#128218;', title: '高中/中专', desc: '基础教育阶段完成，准备或已经步入社会' },
        { value: 'college_bad', icon: '&#127979;', title: '专科/高职', desc: '实用技能型教育，就业导向强' },
        { value: 'college_ordinary', icon: '&#127891;', title: '普通本科（双非）', desc: '最常见的选择，靠实力说话' },
        { value: 'college_985', icon: '&#127942;', title: '985/211 高校', desc: '名校光环，资源和平台优势' },
        { value: 'postgrad', icon: '&#128300;', title: '研究生在读/已毕业', desc: '学术深造，专业壁垒更高' }
      ]
    });
    questions.push({
      id: 'family', number: 'Q5', text: '你家庭的资源支持情况是？',
      desc: '诚实面对，这能帮我们制定最务实的策略。没有资源不代表没有出路。',
      type: 'single',
      options: [
        { value: 'no_support', icon: '&#127793;', title: '几乎没有支持', desc: '父母无法提供经济/人脉/信息支持，全靠自己' },
        { value: 'basic_support', icon: '&#127793;', title: '基本生活支持', desc: '能吃饱穿暖，但没有额外资金和人脉资源' },
        { value: 'moderate_support', icon: '&#127807;', title: '有一定支持', desc: '父母能提供一定的教育资金和小额启动帮助' },
        { value: 'strong_support', icon: '&#127795;', title: '资源丰富', desc: '家庭有较好的人脉和经济基础，可以试错' }
      ]
    });
    var strengthTags = [
      { value: 'study_hard', title: '学习能力' }, { value: 'execution', title: '执行力强' },
      { value: 'discipline', title: '自律性强' }, { value: 'communication', title: '沟通表达' },
      { value: 'creativity', title: '创造力' }, { value: 'tech_skill', title: '技术天赋' },
      { value: 'social', title: '社交能力' }, { value: 'writing', title: '写作能力' },
      { value: 'resilience', title: '抗压能力' }, { value: 'vision', title: '远见/格局' }
    ];
    questions.push({
      id: 'strengths', number: 'Q6', text: '你认为自己目前最突出的优势是？',
      desc: '选择 1-3 个你最认可的标签，诚实评估。',
      type: 'multi', options: strengthTags
    });
    var weaknessTags = [
      { value: 'knowledge', title: '专业知识不足' }, { value: 'experience', title: '实践经验缺乏' },
      { value: 'network', title: '人脉资源匮乏' }, { value: 'financial', title: '经济条件有限' },
      { value: 'confidence', title: '自信心不足' }, { value: 'info_gap', title: '信息差/认知局限' },
      { value: 'planning', title: '规划能力弱' }, { value: 'english', title: '英语/外语能力' },
      { value: 'health', title: '身体健康/精力' }, { value: 'mental', title: '心理状态/焦虑' }
    ];
    questions.push({
      id: 'weaknesses', number: 'Q7', text: '你觉得自己最需要提升的方面是？',
      desc: '坦诚面对短板，才能精准突破。',
      type: 'multi', options: weaknessTags
    });
    questions.push({
      id: 'commitment', number: 'Q8', text: '你愿意为这个目标投入多少？',
      desc: '拖动滑块，评估你的决心和可用精力。',
      type: 'slider', min: 1, max: 10, minLabel: '佛系随缘', maxLabel: '全力以赴', defaultValue: 7
    });
    return questions;
  }

  function getAllQuestions() {
    return baseQuestions.concat(generateDynamicQuestions());
  }

  // ============ QUESTIONNAIRE FLOW ============
  window.startQuestionnaire = function () {
    allQuestions = getAllQuestions();
    currentStep = 0;
    answers = {};
    window.showScreen('questionnaire');
    renderQuestion();
  };

  function renderQuestion() {
    var q = allQuestions[currentStep];
    var total = allQuestions.length;
    var container = document.getElementById('questionContainer');

    var stepsHtml = '';
    for (var i = 0; i < total; i++) {
      var cls = '';
      if (i < currentStep) cls = 'completed';
      else if (i === currentStep) cls = 'current';
      stepsHtml += '<div class="progress-step ' + cls + '"></div>';
    }
    document.getElementById('progressSteps').innerHTML = stepsHtml;
    document.getElementById('progressLabel').textContent = (currentStep + 1) + ' / ' + total;

    var html = '<div class="question-card">';
    html += '<div class="question-number">' + q.number + '</div>';
    html += '<div class="question-text">' + q.text + '</div>';
    html += '<div class="question-desc">' + q.desc + '</div>';

    if (q.type === 'single') {
      html += '<div class="options-grid">';
      q.options.forEach(function (opt) {
        var selected = answers[q.id] === opt.value ? ' selected' : '';
        html += '<div class="option-card' + selected + '" data-value="' + opt.value + '" onclick="selectSingle(this, \'' + q.id + '\', \'' + opt.value + '\')">';
        html += '<span class="option-icon">' + opt.icon + '</span>';
        html += '<div class="option-title">' + opt.title + '</div>';
        html += '<div class="option-desc">' + opt.desc + '</div>';
        html += '</div>';
      });
      html += '</div>';
    } else if (q.type === 'multi') {
      html += '<div class="tags-container">';
      var selectedValues = answers[q.id] || [];
      q.options.forEach(function (opt) {
        var selected = selectedValues.indexOf(opt.value) >= 0 ? ' selected' : '';
        html += '<div class="tag-option' + selected + '" data-value="' + opt.value + '" onclick="selectMulti(this, \'' + q.id + '\', \'' + opt.value + '\')">' + opt.title + '</div>';
      });
      html += '</div>';
    } else if (q.type === 'slider') {
      var val = answers[q.id] || q.defaultValue || 5;
      html += '<div class="slider-container">';
      html += '<input type="range" min="' + q.min + '" max="' + q.max + '" value="' + val + '" oninput="selectSlider(this, \'' + q.id + '\')" id="slider-' + q.id + '">';
      html += '<div class="slider-labels"><span>' + q.minLabel + '</span><span id="slider-value-' + q.id + '" style="color:var(--accent);font-weight:600">' + val + '</span><span>' + q.maxLabel + '</span></div>';
      html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;

    document.getElementById('btnPrev').disabled = currentStep === 0;
    var isLastStep = currentStep === total - 1;
    var btnNext = document.getElementById('btnNext');
    btnNext.innerHTML = isLastStep ? 'GENERATE &gt;' : 'NEXT &gt;';
    btnNext.disabled = !answers[q.id];
  }

  window.selectSingle = function (el, qid, value) {
    answers[qid] = value;
    var siblings = el.parentElement.querySelectorAll('.option-card');
    siblings.forEach(function (s) { s.classList.remove('selected'); });
    el.classList.add('selected');
    document.getElementById('btnNext').disabled = false;
  };
  window.selectMulti = function (el, qid, value) {
    if (!answers[qid]) answers[qid] = [];
    var idx = answers[qid].indexOf(value);
    if (idx >= 0) { answers[qid].splice(idx, 1); el.classList.remove('selected'); }
    else { if (answers[qid].length >= 3) return; answers[qid].push(value); el.classList.add('selected'); }
    document.getElementById('btnNext').disabled = answers[qid].length === 0;
  };
  window.selectSlider = function (el, qid) {
    var val = parseInt(el.value);
    answers[qid] = val;
    document.getElementById('slider-value-' + qid).textContent = val;
    document.getElementById('btnNext').disabled = false;
  };
  window.prevQuestion = function () {
    if (currentStep > 0) { currentStep--; renderQuestion(); }
  };
  window.nextQuestion = function () {
    if (currentStep < allQuestions.length - 1) { currentStep++; renderQuestion(); }
    else { window.showScreen('generating'); runGeneration(); }
  };

  // ============ GENERATION ============
  function runGeneration() {
    var steps = ['analyze', 'skills', 'plan', 'visual'];
    var stepDelay = 150;
    steps.forEach(function (step, idx) {
      setTimeout(function () {
        if (idx > 0) {
          var prev = document.querySelector('.gen-step[data-step="' + steps[idx - 1] + '"]');
          if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
        }
        var cur = document.querySelector('.gen-step[data-step="' + step + '"]');
        if (cur) cur.classList.add('active');
      }, stepDelay * (idx + 1));
    });
    var skills = quantizeSkills();
    calculateGapAndGrowth(skills);
    var plan = generatePlan(skills);
    globalSkills = skills;
    globalPlan = plan;
    weeklyPlan = generateWeeklyPlan(answers.goal, startDate);

    setTimeout(function () {
      var last = document.querySelector('.gen-step[data-step="visual"]');
      if (last) { last.classList.remove('active'); last.classList.add('done'); }
      buildDashboardWithData(skills, plan);
      window.showScreen('dashboard');
      showGift('AVATAR AWAKENED!', 'Your pixel self has been born. Complete tasks to help it grow!', '&#128640;');
    }, stepDelay * (steps.length + 1));
  }

  // ============ SKILL ENGINE ============
  function quantizeSkills() {
    var goal = answers.goal;
    var age = parseInt(String(answers.age).split('_')[0]) || 20;
    var location = answers.location;
    var education = answers.education;
    var family = answers.family;
    var strengths = answers.strengths || [];
    var weaknesses = answers.weaknesses || [];
    var commitment = answers.commitment || 5;

    var goalProfiles = {
      civil_servant: { '专业考试': 90, '政策理解': 85, '公文写作': 80, '面试表达': 75, '时政敏感度': 85, '逻辑推理': 70 },
      teacher: { '学科知识': 85, '教学方法': 80, '沟通表达': 85, '心理学基础': 70, '课程设计': 75, '耐心与同理心': 80 },
      engineer: { '编程能力': 90, '系统设计': 80, '算法思维': 85, '项目经验': 70, '英语阅读': 75, '团队协作': 65 },
      doctor: { '医学知识': 90, '临床技能': 85, '英语文献': 80, '科研能力': 75, '沟通能力': 70, '抗压能力': 85 },
      rich: { '商业嗅觉': 85, '财务管理': 80, '人脉拓展': 85, '风险评估': 75, '执行力': 90, '学习能力': 70 },
      free: { '核心技能': 80, '自律管理': 85, '个人品牌': 75, '财务规划': 70, '英语能力': 65, '适应能力': 80 },
      creative: { '创意能力': 90, '技术工具': 75, '审美素养': 85, '个人品牌': 70, '持续输出': 80, '受众洞察': 65 },
      entrepreneur: { '领导力': 80, '商业模型': 85, '融资能力': 70, '产品思维': 80, '抗压韧性': 90, '人脉资源': 75 }
    };
    var targetSkills = goalProfiles[goal] || goalProfiles.engineer;
    var currentSkills = {};
    var keys = Object.keys(targetSkills);

    keys.forEach(function (skill) {
      var base = 20 + (age - 18) * 3;
      var eduBonus = { high_school: 5, college_bad: 10, college_ordinary: 15, college_985: 25, postgrad: 30 };
      base += eduBonus[education] || 10;
      var famBonus = { no_support: -5, basic_support: 0, moderate_support: 5, strong_support: 10 };
      base += famBonus[family] || 0;
      var strengthMap = { study_hard: 5, execution: 4, discipline: 5, communication: 4, creativity: 4, tech_skill: 5, social: 3, writing: 4, resilience: 4, vision: 3 };
      strengths.forEach(function (s) { base += strengthMap[s] || 2; });
      weaknesses.forEach(function () { base -= 2; });
      base += commitment * 0.5;
      var locBonus = { tier1: 5, tier2: 3, tier3_small: 0, rural: -3 };
      base += locBonus[location] || 0;
      base = Math.max(10, Math.min(targetSkills[skill] - 5, Math.round(base + Math.random() * 8)));
      currentSkills[skill] = base;
    });
    return { target: targetSkills, current: currentSkills, gap: {}, growthPotential: {} };
  }

  function calculateGapAndGrowth(skills) {
    var keys = Object.keys(skills.target);
    keys.forEach(function (k) {
      skills.gap[k] = skills.target[k] - skills.current[k];
      skills.growthPotential[k] = Math.min(100, skills.current[k] + skills.gap[k] * 0.7);
    });
    return skills;
  }

  // ============ PLAN GENERATION ============
  function generatePlan(skills) {
    var goal = answers.goal;
    var ageMap = { '18': '18 岁', '19_20': '19-20 岁', '21_22': '21-22 岁', '23_25': '23-25 岁' };
    var goalNames = {
      civil_servant: '公务员/体制内', teacher: '教师', engineer: '工程师/技术专家',
      doctor: '医生', rich: '高净值人群', free: '自由职业者/数字游民',
      creative: '创作者/艺术家', entrepreneur: '创业者'
    };
    var timeline = [
      {
        period: '第 1-3 月 · 夯实基础', title: '基础建设期',
        desc: '用 3 个月时间补齐核心短板，建立学习系统和信息获取渠道。',
        tasks: [
          { text: '建立每日学习计划表，固定学习时间 >= 3小时/天' },
          { text: '加入 2-3 个垂直领域社群/论坛' },
          { text: '完成领域入门经典书籍/课程 3 本/门' },
          { text: '搭建个人开发环境，完成第一个 Hello World 项目' },
          { text: '注册 GitHub/行业平台，建立代码/作品提交习惯' }
        ]
      },
      {
        period: '第 4-6 月 · 技能强化', title: '能力突破期',
        desc: '集中精力攻克 2-3 个核心技能，达到"可用"水平。',
        tasks: [
          { text: '核心技能刻意练习 >= 100 小时' },
          { text: '完成至少 1 个中等规模的实战项目/作品' },
          { text: '建立学习笔记系统（Notion/Obsidian/印象笔记）' },
          { text: '完成基础题库/案例训练 50 道/个' }
        ]
      },
      {
        period: '第 7-9 月 · 实践验证', title: '实战检验期',
        desc: '将学到的东西转化为实际成果，积累作品/经历/证书。',
        tasks: [
          { text: '获得第一个实质性成果（证书/作品/项目）' },
          { text: '找到 1-2 位可指导你的前辈/导师' },
          { text: '参加至少 1 次线下/线上行业活动' },
          { text: '投递简历/发布作品，获得至少 3 个反馈' }
        ]
      },
      {
        period: '第 10-12 月 · 冲刺显化', title: '冲刺收获期',
        desc: '目标冲刺、面试准备/项目上线/作品发布，实现阶段性跃升。',
        tasks: [
          { text: '冲刺目标考试/面试/上线' },
          { text: '复盘全年成长，建立个人档案' },
          { text: '制定下一年度进阶计划' },
          { text: '目标：获得实习/全职 Offer 或独立完成商业项目' }
        ]
      }
    ];
    var suggestions = [];
    if (answers.location === 'tier3_small' || answers.location === 'rural') {
      suggestions.push({ priority: '重要', title: '打破信息差', detail: '小镇做题家最大的劣势不是能力，而是信息差。建议每天花 30 分钟浏览垂直领域信息源：即刻、V2EX、知乎专栏、行业公众号。关注 5-10 个行业 KOL 的社交媒体。' });
    }
    if (answers.family === 'no_support' || answers.family === 'basic_support') {
      suggestions.push({ priority: '关键', title: '建立资源杠杆', detail: '没有家族资源，就要学会借力。积极参加行业社群、线上活动、开源社区。用实力换信任，用信任换机会。善用免费资源：图书馆、公开课、开源工具。' });
    }
    suggestions.push(
      { priority: '日常', title: '时间管理即生命管理', detail: '18-25 岁最大的资本是时间。建议使用时间追踪工具，建立"每日 3 件重要事"习惯。减少无效社交和短视频消费，将时间投资在高杠杆活动上。' },
      { priority: '长期', title: '身体健康是底层资产', detail: '无论什么目标，身体都是最重要的底层资产。保证每周 3 次以上运动，每次 30 分钟。保持规律作息，避免熬夜。' }
    );
    if (goal === 'engineer') {
      suggestions.push({ priority: '核心', title: '技术栈选择策略', detail: '不要追热点，选择一个方向深入：前端/后端/移动端/AI。先学好一门语言的底层原理，再横向扩展。GitHub + 技术博客是最低成本的个人品牌。' });
    } else if (goal === 'civil_servant') {
      suggestions.push({ priority: '核心', title: '考试策略优化', detail: '行测重点抓资料分析和逻辑判断（性价比最高），申论要积累时政素材并形成模板体系。建议每天刷题 100 道+申论 1 篇，持续 3 个月。' });
    }
    var milestones = [
      { icon: '&#127942;', name: '初心已定', desc: '明确人生目标', unlocked: true },
      { icon: '&#128218;', name: '知识启航', desc: '完成入门学习', unlocked: true },
      { icon: '&#128293;', name: '百日坚持', desc: '持续学习 100 天', unlocked: false },
      { icon: '&#127919;', name: '首战告捷', desc: '第一个实战成果', unlocked: false },
      { icon: '&#128101;', name: '破圈链接', desc: '结识行业前辈', unlocked: false },
      { icon: '&#127775;', name: '技能突破', desc: '核心技能达标', unlocked: false },
      { icon: '&#9851;', name: '阶段跨越', desc: '完成半年里程碑', unlocked: false },
      { icon: '&#127941;', name: '显化成真', desc: '实现年度目标', unlocked: false }
    ];
    return { timeline, planSuggestions: suggestions, milestones, goalName: goalNames[goal] || '目标职业' };
  }

  // ============ WEEKLY PLAN GENERATOR ============
  function generateWeeklyPlan(goal, start) {
    var weeks = [];
    var tasksByGoal = {
      engineer: [
        'LeetCode 5题', '读技术文档1h', 'GitHub commit', '项目coding 3h',
        '学习视频1节', '复盘本周代码', '休息/运动', '算法训练30min',
        '系统设计的案例学习', '刷面经1h', '写技术博客', '参与开源PR',
        '数据结构复习', 'API文档阅读', '单元测试编写', '代码重构'
      ],
      civil_servant: [
        '行测刷题50道', '申论写作1篇', '时政阅读30min', '模拟测试1套',
        '错题复盘', '面试练习', '休息/运动', '公文写作训练',
        '政策文件研读', '热点事件分析', '言语理解专项', '数量关系专项',
        '逻辑判断专项', '资料分析专项', '常识判断积累', '面试模拟对练'
      ],
      teacher: [
        '学科知识复习', '教案设计1份', '试讲练习1次', '教育心理学1章',
        '教资真题1套', '教学视频学习', '休息/运动', '板书练习',
        '课堂管理技巧', '学生心理案例分析', '新课标研读', '教学反思日志',
        '微课录制', '作业设计', '家校沟通模拟', '教育政策跟踪'
      ],
      doctor: [
        '医学知识复习', '英语文献1篇', '临床案例分析', '解剖图谱记忆',
        '执业医师真题', '实验室/实习', '休息/运动', '病历书写训练',
        '医患沟通模拟', '医学伦理学习', '检验报告解读', '处方规范练习',
        '急救技能训练', '手术视频学习', '科室轮转笔记', '科研方法学习'
      ],
      rich: [
        '商业书籍阅读', '财务管理记账', '行业报告分析', '副业尝试1次',
        '人脉拓展活动', '复盘本周收支', '休息/运动', '理财知识学习',
        '投资组合复盘', '商业模式分析', '谈判技巧练习', '领导力课程',
        '市场趋势研判', '个人IP建设', '副业收入优化', '税务知识学习'
      ],
      free: [
        '核心技能练习', '自由职业平台', '个人品牌建设', '客户沟通',
        '作品/案例整理', '财务规划复盘', '休息/运动', '时间管理复盘',
        '新工具学习', '行业社群互动', '简历/作品集更新', '报价策略优化',
        '客户需求分析', '远程协作流程', '个人网站维护', '被动收入探索'
      ],
      creative: [
        '创作输出1件', '审美素材收集', '技术工具学习', '粉丝互动',
        '内容复盘', '灵感记录', '休息/运动', '竞品作品分析',
        '配色/构图训练', '后期技能提升', '选题策划', '文案写作',
        '平台算法研究', '商业合作洽谈', '作品集整理', '跨界灵感收集'
      ],
      entrepreneur: [
        '商业模型迭代', '竞品分析', '用户调研', '融资/pitch练习',
        '团队沟通', '数据分析', '休息/运动', '产品原型设计',
        '增长黑客实验', '财务预测更新', '法务知识学习', '招聘面试',
        '客户成功案例', '行业展会/活动', '技术架构评估', '品牌故事打磨'
      ]
    };
    var baseTasks = tasksByGoal[goal] || tasksByGoal.engineer;
    var phaseColors = ['phase1', 'phase1', 'phase1', 'phase2', 'phase2', 'phase2', 'phase3', 'phase3', 'phase3', 'phase4', 'phase4', 'phase4'];

    for (var w = 0; w < 52; w++) {
      var weekStart = new Date(start);
      weekStart.setDate(start.getDate() + w * 7);
      var weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      var monthIdx = weekStart.getMonth();
      var phase = phaseColors[Math.floor(w / 4.33)] || 'phase4';
      var focus = w < 13 ? '基础建设' : w < 26 ? '技能强化' : w < 39 ? '实战检验' : '冲刺显化';
      var weekTasks = [];
      for (var d = 0; d < 7; d++) {
        var t1 = baseTasks[(w * 3 + d * 2) % baseTasks.length];
        var t2 = baseTasks[(w * 3 + d * 2 + 1) % baseTasks.length];
        var t3 = (d === 5 || d === 6) ? baseTasks[(w * 3 + d * 2 + 2) % baseTasks.length] : null;
        var dayTasks = [
          { id: 'w' + w + 'd' + d + '_0', text: t1, done: false, type: 'core' },
          { id: 'w' + w + 'd' + d + '_1', text: t2, done: false, type: 'core' }
        ];
        if (t3) dayTasks.push({ id: 'w' + w + 'd' + d + '_2', text: t3, done: false, type: 'bonus' });
        weekTasks.push({ day: d, tasks: dayTasks });
      }
      weeks.push({
        weekNum: w + 1, startDate: weekStart, endDate: weekEnd,
        month: monthIdx, phase: phase, focus: focus, tasks: weekTasks
      });
    }
    return weeks;
  }

  // ============ CANVAS RADAR CHART ============
  function drawRadarChart(skills) {
    var canvas = document.getElementById('radarCanvas');
    if (!canvas) return;
    var rect = canvas.getBoundingClientRect();
    var cw = rect.width || canvas.clientWidth || 400;
    var ch = rect.height || canvas.clientHeight || 340;
    if (cw === 0 || ch === 0) {
      requestAnimationFrame(function () { drawRadarChart(skills); });
      return;
    }
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    var w = cw, h = ch;
    var cx = w / 2, cy = h / 2 + 10;
    var radius = Math.min(w, h) / 2 - 50;
    var keys = Object.keys(skills.current);
    var n = keys.length;
    var angleStep = (Math.PI * 2) / n;

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#2a2a45';
    ctx.lineWidth = 1;
    for (var r = 0.25; r <= 1; r += 0.25) {
      ctx.beginPath();
      for (var i = 0; i < n; i++) {
        var a = i * angleStep - Math.PI / 2;
        var x = cx + Math.cos(a) * radius * r;
        var y = cy + Math.sin(a) * radius * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    // Axes
    for (var i = 0; i < n; i++) {
      var a = i * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
      ctx.stroke();
    }
    // Labels
    ctx.fillStyle = '#7a7a9a';
    ctx.font = '11px "Silkscreen", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < n; i++) {
      var a = i * angleStep - Math.PI / 2;
      var lx = cx + Math.cos(a) * (radius + 22);
      var ly = cy + Math.sin(a) * (radius + 22);
      ctx.fillText(keys[i], lx, ly);
    }

    function drawPoly(data, color, fill, dash) {
      ctx.beginPath();
      for (var i = 0; i < n; i++) {
        var a = i * angleStep - Math.PI / 2;
        var v = data[keys[i]] || 0;
        var x = cx + Math.cos(a) * radius * (v / 100);
        var y = cy + Math.sin(a) * radius * (v / 100);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      if (dash) ctx.setLineDash([4, 4]); else ctx.setLineDash([]);
      ctx.stroke();
      ctx.setLineDash([]);
      // dots
      ctx.fillStyle = color;
      for (var i = 0; i < n; i++) {
        var a = i * angleStep - Math.PI / 2;
        var v = data[keys[i]] || 0;
        var x = cx + Math.cos(a) * radius * (v / 100);
        var y = cy + Math.sin(a) * radius * (v / 100);
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }

    drawPoly(skills.target, '#B388FF', 'rgba(179,136,255,0.08)', true);
    drawPoly(skills.current, '#00E5FF', 'rgba(0,229,255,0.12)', false);
  }

  // ============ DASHBOARD RENDERING ============
  function buildDashboardWithData(skills, plan) {
    var ageMap = { '18': '18 岁', '19_20': '19-20 岁', '21_22': '21-22 岁', '23_25': '23-25 岁' };
    var ageText = ageMap[answers.age] || answers.age + ' 岁';
    var avatarLetter = plan.goalName.charAt(0);
    document.getElementById('userProfileBrief').innerHTML =
      '<div class="user-avatar">' + avatarLetter + '</div>' +
      '<div class="user-info-brief"><div class="user-name">目标: ' + plan.goalName + '</div><div class="user-tagline">' + ageText + ' START</div></div>';
    document.getElementById('yearCalProfile').innerHTML = document.getElementById('userProfileBrief').innerHTML;

    drawRadarChart(skills);

    var keys = Object.keys(skills.current);
    var currentAvg = Math.round(keys.reduce(function (s, k) { return s + skills.current[k]; }, 0) / keys.length);
    var targetAvg = Math.round(keys.reduce(function (s, k) { return s + skills.target[k]; }, 0) / keys.length);
    var gapAvg = Math.round(keys.reduce(function (s, k) { return s + skills.gap[k]; }, 0) / keys.length);
    var growthRate = Math.min(99, Math.round(gapAvg * (answers.commitment || 5) / 50));
    var level = Math.min(3, Math.floor(growthRate / 25));
    updatePixelAvatar(level);

    document.getElementById('statsGrid').innerHTML =
      '<div class="stat-item"><div class="stat-value">' + currentAvg + '</div><div class="stat-label">INDEX</div></div>' +
      '<div class="stat-item"><div class="stat-value">' + targetAvg + '</div><div class="stat-label">TARGET</div></div>' +
      '<div class="stat-item"><div class="stat-value">' + gapAvg + '</div><div class="stat-label">GAP</div></div>' +
      '<div class="stat-item"><div class="stat-value">' + growthRate + '%</div><div class="stat-label">PROGRESS</div></div>' +
      '<div class="stat-item"><div class="stat-value">' + (answers.commitment || 5) + '</div><div class="stat-label">COMMIT</div></div>' +
      '<div class="stat-item"><div class="stat-value">S</div><div class="stat-label">RANK</div></div>';

    var sbHtml = '';
    keys.forEach(function (k) {
      var pct = Math.round(skills.current[k] / skills.target[k] * 100);
      sbHtml += '<div class="skill-bar-item"><div class="skill-bar-header"><span class="skill-bar-name">' + k + '</span><span class="skill-bar-value">' + skills.current[k] + '/' + skills.target[k] + '</span></div><div class="skill-bar-track"><div class="skill-bar-fill" style="width:0%" data-target="' + pct + '"></div></div></div>';
    });
    document.getElementById('skillBars').innerHTML = sbHtml;
    setTimeout(function () {
      document.querySelectorAll('.skill-bar-fill').forEach(function (bar) {
        bar.style.width = bar.getAttribute('data-target') + '%';
      });
    }, 200);

    tasksCompleted = 0;
    totalTasks = 0;
    plan.timeline.forEach(function (phase) { totalTasks += phase.tasks.length; });
    weeklyPlan.forEach(function (w) {
      w.tasks.forEach(function (d) { totalTasks += d.tasks.length; });
    });

    var tlHtml = '';
    plan.timeline.forEach(function (phase, idx) {
      tlHtml += '<div class="timeline-item' + (idx === 0 ? ' completed' : '') + '">';
      tlHtml += '<div class="timeline-period">' + phase.period + '</div>';
      tlHtml += '<div class="timeline-title">' + phase.title + '</div>';
      tlHtml += '<div class="timeline-desc">' + phase.desc + '</div>';
      tlHtml += '<div class="timeline-tasks">';
      phase.tasks.forEach(function (task) {
        tlHtml += '<div class="timeline-task"><div class="timeline-task-check" onclick="toggleTask(this)">&nbsp;</div><span>' + task.text + '</span></div>';
      });
      tlHtml += '</div></div>';
    });
    document.getElementById('timeline').innerHTML = tlHtml;

    var psHtml = '';
    plan.planSuggestions.forEach(function (s) {
      psHtml += '<div class="plan-suggestion"><span class="plan-priority">' + s.priority + '</span><div class="plan-title">' + s.title + '</div><div class="plan-detail">' + s.detail + '</div></div>';
    });
    document.getElementById('planSuggestions').innerHTML = psHtml;

    var msHtml = '';
    plan.milestones.forEach(function (m) {
      msHtml += '<div class="milestone-badge ' + (m.unlocked ? 'unlocked' : 'locked') + '"><div class="badge-icon">' + m.icon + '</div><div class="badge-name">' + m.name + '</div><div class="badge-desc">' + m.desc + '</div></div>';
    });
    document.getElementById('milestones').innerHTML = msHtml;
    renderEvoProgressStrip();
    setTimeout(initFloatAvatar, 500);
  }

  function renderEvoProgressStrip() {
    var el = document.getElementById('evoProgressStrip');
    if (!el) return;
    var currentLevel = totalTasks > 0 ? Math.min(3, Math.floor((tasksCompleted / totalTasks) * 4)) : 0;
    var levelNames = ['NOVICE', 'APPRENTICE', 'ADEPT', 'MASTER'];
    var levelColors = ['var(--accent)', 'var(--accent2)', 'var(--success)', 'var(--warn)'];
    var html = '<div style="font-family:var(--font-pixel);font-size:0.55rem;color:var(--muted);margin-bottom:6px;letter-spacing:0.1em">EVOLUTION PROGRESS</div>';
    html += '<div style="display:flex;align-items:center;gap:4px">';
    for (var i = 0; i < 4; i++) {
      var isActive = i <= currentLevel;
      var opacity = isActive ? '1' : '0.25';
      var border = isActive ? 'border-color:' + levelColors[i] : '';
      html += '<div style="opacity:' + opacity + ';' + border + ';width:28px;height:28px;background:var(--bg3);border:1px solid var(--rule);display:flex;align-items:center;justify-content:center;image-rendering:pixelated;transition:all 0.3s">';
      html += '<svg viewBox="0 0 16 16" style="width:20px;height:20px">' + avatarLevels[i] + '</svg>';
      html += '</div>';
      if (i < 3) html += '<span style="font-family:var(--font-pixel);font-size:0.5rem;color:var(--rule)">></span>';
    }
    html += '</div>';
    html += '<div style="font-family:var(--font-pixel);font-size:0.5rem;color:' + levelColors[currentLevel] + ';margin-top:4px">LV.' + (currentLevel + 1) + ' ' + levelNames[currentLevel] + ' (' + (totalTasks > 0 ? Math.round(tasksCompleted / totalTasks * 100) : 0) + '%)</div>';
    el.innerHTML = html;
  }

  window.toggleTask = function (el) {
    var wasDone = el.classList.contains('done');
    el.classList.toggle('done');
    el.innerHTML = el.classList.contains('done') ? 'OK' : '&nbsp;';
    if (el.classList.contains('done') && !wasDone) {
      tasksCompleted++;
      var oldLevel = Math.min(3, Math.floor(((tasksCompleted - 1) / Math.max(1, totalTasks)) * 4));
      var newLevel = Math.min(3, Math.floor((tasksCompleted / Math.max(1, totalTasks)) * 4));
      if (newLevel > oldLevel) {
        updatePixelAvatar(newLevel);
        updateFloatAvatar(newLevel);
        renderEvoProgressStrip();
        var avatars = ['NOVICE', 'APPRENTICE', 'ADEPT', 'MASTER'];
        showGift('LEVEL UP! ' + avatars[newLevel], 'Your pixel self has evolved!', '&#11088;');
        showFloatBubble('我升级了! ' + avatars[newLevel]);
      } else {
        var gifts = [
          { t: 'EXP +10!', d: 'Your avatar feels stronger.', i: '&#9889;' },
          { t: 'COIN +5!', d: 'Keep grinding!', i: '&#128176;' },
          { t: 'FOCUS UP!', d: 'Your concentration deepens.', i: '&#128170;' },
          { t: 'LUCK +1!', d: 'Fortune favors the prepared.', i: '&#127808;' }
        ];
        var g = gifts[Math.floor(Math.random() * gifts.length)];
        showGift(g.t, g.d, g.i);
      }
    } else if (wasDone && !el.classList.contains('done')) {
      tasksCompleted = Math.max(0, tasksCompleted - 1);
    }
  };

  // ============ CALENDAR VIEWS ============
  window.showCalendarYear = function () {
    window.showScreen('calendar-year');
    renderYearCalendar();
  };

  function renderYearCalendar() {
    var grid = document.getElementById('calendarYearGrid');
    if (!grid || !weeklyPlan.length) return;
    var html = '';
    var monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    for (var m = 0; m < 12; m++) {
      var startOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1);
      var year = startOfMonth.getFullYear();
      var month = startOfMonth.getMonth();
      var firstDay = new Date(year, month, 1).getDay();
      var daysInMonth = new Date(year, month + 1, 0).getDate();

      html += '<div class="cal-month-card" onclick="showCalendarMonth(' + m + ')">';
      html += '<div class="cal-month-name">' + monthNames[month] + ' ' + year + '</div>';
      html += '<div class="cal-mini-grid">';
      for (var i = 0; i < firstDay; i++) html += '<div class="cal-mini-day empty"></div>';
      for (var d = 1; d <= daysInMonth; d++) {
        var date = new Date(year, month, d);
        var w = weeklyPlan.find(function (wk) { return date >= wk.startDate && date <= wk.endDate; });
        var phaseClass = w ? w.phase : '';
        var isToday = date.toDateString() === new Date().toDateString();
        html += '<div class="cal-mini-day ' + phaseClass + (isToday ? ' today' : '') + '">' + d + '</div>';
      }
      html += '</div></div>';
    }
    grid.innerHTML = html;
  }

  var currentMonthOffset = 0;
  var currentDayDate = null;

  window.showCalendarMonth = function (monthOffset) {
    currentMonthOffset = monthOffset;
    window.showScreen('calendar-month');
    renderMonthCalendar(monthOffset);
  };

  function renderMonthCalendar(monthOffset) {
    var grid = document.getElementById('monthDaysGrid');
    var title = document.getElementById('monthViewTitle');
    if (!grid || !weeklyPlan.length) return;

    var baseDate = new Date(startDate);
    baseDate.setMonth(startDate.getMonth() + monthOffset);
    var year = baseDate.getFullYear();
    var month = baseDate.getMonth();
    var monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    title.textContent = monthNames[month] + ' ' + year;

    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var html = '';

    for (var i = 0; i < firstDay; i++) html += '<div class="cal-day-cell empty"></div>';

    for (var d = 1; d <= daysInMonth; d++) {
      var date = new Date(year, month, d);
      var w = weeklyPlan.find(function (wk) { return date >= wk.startDate && date <= wk.endDate; });
      var phaseClass = w ? w.phase : '';
      var isToday = date.toDateString() === new Date().toDateString();
      var dayOfWeek = date.getDay();
      var dayData = w ? w.tasks[dayOfWeek] : null;
      var tasks = dayData ? dayData.tasks : [];
      var doneCount = tasks.filter(function (t) { return t.done; }).length;
      var totalCount = tasks.length;
      var dateStr = year + '-' + (month + 1) + '-' + d;

      html += '<div class="cal-day-cell ' + phaseClass + (isToday ? ' today' : '') + '" onclick="showDayDetail(' + year + ',' + month + ',' + d + ')">';
      html += '<span class="day-num">' + d + '</span>';
      if (totalCount > 0) {
        html += '<div class="day-tasks-mini">';
        tasks.forEach(function (t) {
          html += '<div class="dt-mini' + (t.done ? ' done' : '') + '">' + t.text + '</div>';
        });
        html += '</div>';
        html += '<span class="day-progress">' + doneCount + '/' + totalCount + '</span>';
      }
      html += '</div>';
    }
    grid.innerHTML = html;
  }

  window.showDayDetail = function (year, month, day) {
    currentDayDate = new Date(year, month, day);
    window.showScreen('day-detail');
    renderDayDetail();
  };

  window.backToMonth = function () {
    window.showCalendarMonth(currentMonthOffset);
  };

  function renderDayDetail() {
    if (!currentDayDate) return;
    var title = document.getElementById('dayDetailTitle');
    var meta = document.getElementById('dayDetailMeta');
    var list = document.getElementById('dayTasksList');

    var y = currentDayDate.getFullYear();
    var m = currentDayDate.getMonth();
    var d = currentDayDate.getDate();
    var weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    title.textContent = y + '.' + (m + 1) + '.' + d + ' ' + weekDays[currentDayDate.getDay()];

    var w = weeklyPlan.find(function (wk) { return currentDayDate >= wk.startDate && currentDayDate <= wk.endDate; });
    var dayOfWeek = currentDayDate.getDay();
    var dayData = w ? w.tasks[dayOfWeek] : null;
    var phase = w ? w.phase : '';
    var focus = w ? w.focus : '';

    meta.innerHTML = '';
    if (phase) meta.innerHTML += '<span class="day-meta-tag ' + phase + '">' + phase.toUpperCase() + '</span>';
    if (focus) meta.innerHTML += '<span class="day-meta-tag">' + focus + '</span>';

    var tasks = dayData ? dayData.tasks : [];
    var html = '';
    if (tasks.length === 0) {
      html += '<div style="color:var(--muted);font-size:0.9rem;">今日暂无任务，点击下方添加。</div>';
    } else {
      tasks.forEach(function (t, idx) {
        html += '<div class="day-task-item' + (t.done ? ' done' : '') + '" onclick="toggleDayTask(' + idx + ')">';
        html += '<div class="day-task-check' + (t.done ? ' checked' : '') + '">' + (t.done ? 'OK' : '') + '</div>';
        html += '<span class="day-task-text">' + t.text + '</span>';
        html += '<span class="day-task-type' + (t.type === 'bonus' ? ' bonus' : '') + '">' + (t.type === 'bonus' ? 'BONUS' : 'CORE') + '</span>';
        html += '</div>';
      });
    }
    list.innerHTML = html;
  }

  window.toggleDayTask = function (taskIndex) {
    if (!currentDayDate) return;
    var w = weeklyPlan.find(function (wk) { return currentDayDate >= wk.startDate && currentDayDate <= wk.endDate; });
    if (!w) return;
    var dayOfWeek = currentDayDate.getDay();
    var tasks = w.tasks[dayOfWeek].tasks;
    if (!tasks[taskIndex]) return;
    var wasDone = tasks[taskIndex].done;
    tasks[taskIndex].done = !tasks[taskIndex].done;
    var isDone = tasks[taskIndex].done;

    if (isDone && !wasDone) {
      tasksCompleted++;
      var oldLevel = Math.min(3, Math.floor(((tasksCompleted - 1) / Math.max(1, totalTasks)) * 4));
      var newLevel = Math.min(3, Math.floor((tasksCompleted / Math.max(1, totalTasks)) * 4));
      if (newLevel > oldLevel) {
        updatePixelAvatar(newLevel);
        updateFloatAvatar(newLevel);
        renderEvoProgressStrip();
        var avatars = ['NOVICE', 'APPRENTICE', 'ADEPT', 'MASTER'];
        showGift('LEVEL UP! ' + avatars[newLevel], 'Your pixel self has evolved!', '&#11088;');
        showFloatBubble('我升级了! ' + avatars[newLevel]);
      } else {
        var gifts = [
          { t: 'EXP +10!', d: 'Your avatar feels stronger.', i: '&#9889;' },
          { t: 'COIN +5!', d: 'Keep grinding!', i: '&#128176;' },
          { t: 'FOCUS UP!', d: 'Your concentration deepens.', i: '&#128170;' },
          { t: 'LUCK +1!', d: 'Fortune favors the prepared.', i: '&#127808;' }
        ];
        var g = gifts[Math.floor(Math.random() * gifts.length)];
        showGift(g.t, g.d, g.i);
        var bubbles = ['不错!', '继续保持!', '又进一步!', '好样的!', '显化中...'];
        showFloatBubble(bubbles[Math.floor(Math.random() * bubbles.length)]);
      }
    } else if (wasDone && !isDone) {
      tasksCompleted = Math.max(0, tasksCompleted - 1);
    }
    renderDayDetail();
  };

  window.addDayTask = function () {
    var input = document.getElementById('newTaskInput');
    var text = input.value.trim();
    if (!text || !currentDayDate) return;
    var w = weeklyPlan.find(function (wk) { return currentDayDate >= wk.startDate && currentDayDate <= wk.endDate; });
    if (!w) return;
    var dayOfWeek = currentDayDate.getDay();
    w.tasks[dayOfWeek].tasks.push({ id: 'custom_' + Date.now(), text: text, done: false, type: 'custom' });
    input.value = '';
    totalTasks++;
    renderDayDetail();
    showFloatBubble('新任务添加成功!');
  };

  // ============ FLOATING AVATAR ============
  var floatPos = { x: 100, y: 100 };
  var floatTarget = { x: 200, y: 200 };
  var floatVelocity = { x: 0, y: 0 };
  var floatActive = true;

  function initFloatAvatar() {
    var el = document.getElementById('floatAvatar');
    if (!el) return;
    floatPos.x = window.innerWidth - 80;
    floatPos.y = window.innerHeight - 80;
    floatTarget.x = floatPos.x;
    floatTarget.y = floatPos.y;
    el.style.left = floatPos.x + 'px';
    el.style.top = floatPos.y + 'px';
    pickNewTarget();
    requestAnimationFrame(animateFloat);
  }

  function pickNewTarget() {
    floatTarget.x = 20 + Math.random() * (window.innerWidth - 88);
    floatTarget.y = 20 + Math.random() * (window.innerHeight - 88);
    setTimeout(pickNewTarget, 3000 + Math.random() * 4000);
  }

  function animateFloat() {
    if (!floatActive) { requestAnimationFrame(animateFloat); return; }
    var dx = floatTarget.x - floatPos.x;
    var dy = floatTarget.y - floatPos.y;
    floatVelocity.x += dx * 0.002;
    floatVelocity.y += dy * 0.002;
    floatVelocity.x *= 0.94;
    floatVelocity.y *= 0.94;
    floatPos.x += floatVelocity.x;
    floatPos.y += floatVelocity.y;

    var el = document.getElementById('floatAvatar');
    if (el) {
      el.style.left = floatPos.x + 'px';
      el.style.top = floatPos.y + 'px';
      el.style.transform = 'scaleX(' + (floatVelocity.x > 0.1 ? -1 : floatVelocity.x < -0.1 ? 1 : (el.style.transform.includes('-1') ? -1 : 1)) + ')';
    }
    requestAnimationFrame(animateFloat);
  }

  window.pokeAvatar = function () {
    var msgs = ['嗨!', '加油!', '别偷懒!', '显化中...', '你可以的!', '相信自己!'];
    showFloatBubble(msgs[Math.floor(Math.random() * msgs.length)]);
    var el = document.getElementById('floatAvatar');
    if (el) {
      el.style.animation = 'none';
      el.offsetHeight;
      el.style.animation = 'shake 0.4s ease';
    }
  };

  function showFloatBubble(text) {
    var bubble = document.getElementById('floatBubble');
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.add('show');
    setTimeout(function () { bubble.classList.remove('show'); }, 2500);
  }

  window.updateFloatAvatar = function (level) {
    var svg = avatarLevels[Math.min(level, avatarLevels.length - 1)];
    var container = document.getElementById('floatAvatarSvg');
    if (container) container.innerHTML = svg;
  };

  // ============ UTILITIES ============
  window.restart = function () {
    answers = {}; currentStep = 0; globalSkills = null; globalPlan = null; weeklyPlan = [];
    window.showScreen('welcome');
  };
  window.exportPlan = function () { window.print(); };

  window.addEventListener('resize', function () {
    if (globalSkills) drawRadarChart(globalSkills);
  });
})();
