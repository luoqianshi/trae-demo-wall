/**
 * CareerQuest Demo - Interactive Application Logic
 */

// ===== GLOBAL STATE =====
var State = {
  entryChoice: null,
  valuesAnswers: [],
  sjtAnswers: [],
  valuesScores: { salary: 0, growth: 0, balance: 0, stable: 0, social: 0, freedom: 0 },
  strengthType: null,
  selectedJob: null,
  sceneAnswers: [],
  currentSceneIndex: 0
};

// ===== SCREEN NAVIGATION =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  var el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    window.scrollTo(0, 0);
  }
}

// ===== ENTRY DIVERSION =====
var selectedEntryCard = null;
function selectEntry(choice, card) {
  State.entryChoice = choice;
  document.querySelectorAll('#screen-entry .option-card').forEach(function(c) { c.classList.remove('selected'); });
  card.classList.add('selected');
  selectedEntryCard = card;
  document.getElementById('entry-confirm-btn').disabled = false;
}

function confirmEntry() {
  if (!State.entryChoice) return;
  var choice = State.entryChoice;
  if (choice === 'A' || choice === 'C') {
    showScreen('screen-m1-values');
    renderValuesQuestions();
  } else if (choice === 'B') {
    State.valuesScores = { salary: 55, growth: 70, balance: 60, stable: 45, social: 50, freedom: 65 };
    State.strengthType = 'balanced';
    showScreen('screen-m2');
    renderJobCards();
  } else if (choice === 'D') {
    showScreen('screen-direct');
  }
}

function restartDemo() {
  State = {
    entryChoice: null,
    valuesAnswers: [],
    sjtAnswers: [],
    valuesScores: { salary: 0, growth: 0, balance: 0, stable: 0, social: 0, freedom: 0 },
    strengthType: null,
    selectedJob: null,
    sceneAnswers: [],
    currentSceneIndex: 0
  };
  document.querySelectorAll('.option-card').forEach(function(c) { c.classList.remove('selected'); });
  document.getElementById('entry-confirm-btn').disabled = true;
  showScreen('screen-entry');
}

// ===== MODULE 1: VALUES ASSESSMENT =====
var valuesQuestions = [
  {
    text: "你刚入职一家公司，老板给你两个项目选择：A 项目工资高但内容重复，B 项目工资一般但能让你学到新东西。你会怎么选？",
    options: [
      { text: "选 A，经济回报是我目前最看重的", scores: { salary: 3, growth: 0, balance: 0, stable: 1, social: 0, freedom: 0 } },
      { text: "选 B，成长机会比眼前收入更重要", scores: { salary: 0, growth: 3, balance: 0, stable: 0, social: 0, freedom: 1 } },
      { text: "看哪个工作时间更可控，我不想加班太多", scores: { salary: 0, growth: 0, balance: 3, stable: 1, social: 0, freedom: 0 } },
      { text: "选 B，而且我想接触更多人、了解不同业务", scores: { salary: 0, growth: 1, balance: 0, stable: 0, social: 2, freedom: 1 } }
    ]
  },
  {
    text: '你的朋友都在讨论 "35 岁危机"，你对此的想法是？',
    options: [
      { text: "我更关注当下的收入和储蓄，未来走一步看一步", scores: { salary: 2, growth: 0, balance: 0, stable: 0, social: 0, freedom: 0 } },
      { text: "所以我必须不断进阶，保持学习，让自己不可替代", scores: { salary: 0, growth: 3, balance: 0, stable: 0, social: 0, freedom: 1 } },
      { text: "我应该找一份更稳定、能干到退休的工作", scores: { salary: 0, growth: 0, balance: 0, stable: 3, social: 0, freedom: 0 } },
      { text: "如果工作不稳定，我希望能有时间和自由做自己的事", scores: { salary: 0, growth: 0, balance: 1, stable: 0, social: 0, freedom: 3 } }
    ]
  },
  {
    text: "周末你有两种过法：A. 独自在家看书、学新技能；B. 和朋友聚会、参加志愿活动。你更倾向哪种？",
    options: [
      { text: "选 A，独处让我更有能量", scores: { salary: 0, growth: 1, balance: 2, stable: 0, social: 0, freedom: 1 } },
      { text: "选 B，我喜欢和人打交道、帮助别人", scores: { salary: 0, growth: 0, balance: 0, stable: 0, social: 3, freedom: 0 } },
      { text: "看心情，有时候独处有时候社交", scores: { salary: 0, growth: 0, balance: 1, stable: 1, social: 1, freedom: 1 } },
      { text: "如果选 A，那是因为我在学习能赚钱的新技能", scores: { salary: 2, growth: 1, balance: 0, stable: 0, social: 0, freedom: 0 } }
    ]
  },
  {
    text: "如果有一份工作让你每天只工作 4 小时但收入减半，你愿意吗？",
    options: [
      { text: "不愿意，收入对我来说很重要", scores: { salary: 3, growth: 0, balance: 0, stable: 0, social: 0, freedom: 0 } },
      { text: "愿意，我有更多时间发展副业或爱好", scores: { salary: 0, growth: 0, balance: 2, stable: 0, social: 0, freedom: 3 } },
      { text: "看情况，如果工作有意思、能学到东西可以考虑", scores: { salary: 0, growth: 2, balance: 1, stable: 0, social: 0, freedom: 1 } },
      { text: "不愿意，我担心收入不稳定会影响生活", scores: { salary: 0, growth: 0, balance: 0, stable: 3, social: 0, freedom: 0 } }
    ]
  },
  {
    text: "你理想的工作环境是什么样的？",
    options: [
      { text: "大公司，流程清晰，福利完善，有安全感", scores: { salary: 1, growth: 0, balance: 0, stable: 3, social: 0, freedom: 0 } },
      { text: "创业公司，变化快，能参与决策，成长空间大", scores: { salary: 0, growth: 2, balance: 0, stable: 0, social: 0, freedom: 2 } },
      { text: "自由职业或远程办公，自己掌控时间和节奏", scores: { salary: 0, growth: 0, balance: 2, stable: 0, social: 0, freedom: 3 } },
      { text: "公益组织或教育行业，感觉自己的工作有意义", scores: { salary: 0, growth: 0, balance: 0, stable: 0, social: 3, freedom: 1 } }
    ]
  }
];

function renderValuesQuestions() {
  var container = document.getElementById('values-questions');
  container.innerHTML = '';
  valuesQuestions.forEach(function(q, idx) {
    var card = document.createElement('div');
    card.className = 'question-card';
    card.id = 'vq-' + idx;
    if (idx > 0) card.style.display = 'none';
    var html = '<div class="q-num">问题 ' + (idx + 1) + ' / ' + valuesQuestions.length + '</div>';
    html += '<div class="q-text">' + q.text + '</div>';
    html += '<div class="q-opts">';
    q.options.forEach(function(opt, oidx) {
      html += '<div class="q-opt" onclick="selectValueOption(' + idx + ',' + oidx + ',this)">' + opt.text + '</div>';
    });
    html += '</div>';
    card.innerHTML = html;
    container.appendChild(card);
  });
  updateValuesProgress();
}

function updateValuesProgress() {
  var pct = (State.valuesAnswers.length / valuesQuestions.length) * 100;
  document.getElementById('values-progress').style.width = pct + '%';
}

function selectValueOption(qIdx, oIdx, el) {
  var card = document.getElementById('vq-' + qIdx);
  card.querySelectorAll('.q-opt').forEach(function(o) { o.classList.remove('selected'); });
  el.classList.add('selected');

  State.valuesAnswers[qIdx] = oIdx;
  var scores = valuesQuestions[qIdx].options[oIdx].scores;
  for (var key in scores) {
    State.valuesScores[key] += scores[key];
  }
  updateValuesProgress();

  setTimeout(function() {
    card.style.display = 'none';
    if (qIdx + 1 < valuesQuestions.length) {
      document.getElementById('vq-' + (qIdx + 1)).style.display = 'block';
    } else {
      document.getElementById('values-nav').style.display = 'block';
    }
  }, 400);
}

function finishValues() {
  var maxScore = 9;
  for (var key in State.valuesScores) {
    State.valuesScores[key] = Math.min(100, Math.round((State.valuesScores[key] / maxScore) * 100));
  }
  showScreen('screen-m1-sjt');
  renderSJTQuestions();
}

// ===== MODULE 1: SJT STRENGTHS =====
var sjtQuestions = [
  {
    text: "团队项目中，一位成员一直在质疑你的方案，会议上气氛变得紧张。你会怎么做？",
    options: [
      { text: "先停下来，认真听听他的具体顾虑是什么", type: "empathy" },
      { text: "用数据和逻辑逐一回应他的质疑点", type: "logic" },
      { text: "提出一个折中方案，让大家先推进起来", type: "execution" },
      { text: "把他的质疑记下来，会后单独沟通，避免会议上僵持", type: "social" }
    ]
  },
  {
    text: '老板给你一个模糊的需求：\"提升用户活跃度\"。你的第一反应是？',
    options: [
      { text: "先拆解\"活跃\"的定义，列出可以量化的指标", type: "logic" },
      { text: "找几个典型用户聊聊，看看他们真正的痛点是什么", type: "empathy" },
      { text: "快速脑暴几个活动方案，选一个先试试", type: "creative" },
      { text: "召集相关同事开会，对齐大家对\"活跃\"的理解", type: "social" }
    ]
  },
  {
    text: "你手上有三个任务，都很紧急。你会怎么安排？",
    options: [
      { text: "按影响力和 deadline 排序，先做对业务影响最大的", type: "logic" },
      { text: "先快速完成最容易的，建立 momentum", type: "execution" },
      { text: "和老板确认优先级，确保我的判断是对的", type: "social" },
      { text: "看看哪个任务能激发我的创造力，优先做那个", type: "creative" }
    ]
  },
  {
    text: "公司要推出一个新功能，需要你写一份面向用户的介绍文案。你会怎么写？",
    options: [
      { text: "从用户痛点出发，告诉他们这个功能解决了什么问题", type: "empathy" },
      { text: "突出功能亮点和数据支撑，用简洁有力的表达", type: "logic" },
      { text: "想一个有创意的标题和故事线，让用户产生共鸣", type: "creative" },
      { text: "先和运营、设计对齐风格，确保和品牌调性一致", type: "social" }
    ]
  }
];

function renderSJTQuestions() {
  var container = document.getElementById('sjt-questions');
  container.innerHTML = '';
  sjtQuestions.forEach(function(q, idx) {
    var card = document.createElement('div');
    card.className = 'question-card';
    card.id = 'sjt-' + idx;
    if (idx > 0) card.style.display = 'none';
    var html = '<div class="q-num">情境 ' + (idx + 1) + ' / ' + sjtQuestions.length + '</div>';
    html += '<div class="q-text">' + q.text + '</div>';
    html += '<div class="q-opts">';
    q.options.forEach(function(opt, oidx) {
      html += '<div class="q-opt" onclick="selectSJTOption(' + idx + ',' + oidx + ',this)">' + opt.text + '</div>';
    });
    html += '</div>';
    card.innerHTML = html;
    container.appendChild(card);
  });
  updateSJTProgress();
}

function updateSJTProgress() {
  var pct = (State.sjtAnswers.length / sjtQuestions.length) * 100;
  document.getElementById('sjt-progress').style.width = pct + '%';
}

function selectSJTOption(qIdx, oIdx, el) {
  var card = document.getElementById('sjt-' + qIdx);
  card.querySelectorAll('.q-opt').forEach(function(o) { o.classList.remove('selected'); });
  el.classList.add('selected');

  State.sjtAnswers[qIdx] = sjtQuestions[qIdx].options[oIdx].type;
  updateSJTProgress();

  setTimeout(function() {
    card.style.display = 'none';
    if (qIdx + 1 < sjtQuestions.length) {
      document.getElementById('sjt-' + (qIdx + 1)).style.display = 'block';
    } else {
      document.getElementById('sjt-nav').style.display = 'block';
    }
  }, 400);
}

function finishSJT() {
  var counts = { logic: 0, empathy: 0, creative: 0, social: 0, execution: 0 };
  State.sjtAnswers.forEach(function(t) { if (counts[t] !== undefined) counts[t]++; });

  var max = 0, domType = 'balanced';
  for (var t in counts) {
    if (counts[t] > max) { max = counts[t]; domType = t; }
  }
  State.strengthType = domType;

  showScreen('screen-m1-result');
  renderM1Result();
}

// ===== MODULE 1 RESULT =====
function renderM1Result() {
  var chartDom = document.getElementById('radar-chart');
  var myChart = echarts.init(chartDom, null, { renderer: 'svg' });
  var scores = State.valuesScores;
  myChart.setOption({
    animation: false,
    tooltip: { trigger: 'item' },
    radar: {
      indicator: [
        { name: '薪资回报', max: 100 },
        { name: '成长空间', max: 100 },
        { name: '工作生活平衡', max: 100 },
        { name: '稳定感', max: 100 },
        { name: '社会价值', max: 100 },
        { name: '人际自由度', max: 100 }
      ],
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: '#94a3b8', fontSize: 12 },
      splitLine: { lineStyle: { color: '#334155' } },
      splitArea: { areaStyle: { color: ['rgba(30,41,59,0.3)', 'rgba(30,41,59,0.5)'] } },
      axisLine: { lineStyle: { color: '#334155' } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: [scores.salary, scores.growth, scores.balance, scores.stable, scores.social, scores.freedom],
        name: '你的价值观',
        areaStyle: { color: 'rgba(6,182,212,0.2)' },
        lineStyle: { color: '#06b6d4', width: 2 },
        itemStyle: { color: '#06b6d4' }
      }]
    }]
  });
  window.addEventListener('resize', function() { myChart.resize(); });

  var typeLabels = {
    logic: '逻辑分析型',
    empathy: '共情理解型',
    creative: '创意表达型',
    social: '沟通协调型',
    execution: '执行推进型',
    balanced: '综合均衡型'
  };
  var typeDescs = {
    logic: '你擅长用数据和逻辑解决问题，适合需要理性分析、结构化思维的岗位。',
    empathy: '你能敏锐感知他人需求，适合需要用户洞察、人际理解的岗位。',
    creative: '你善于跳出框架思考，适合需要创新、表达和创造的岗位。',
    social: '你擅长协调多方关系，适合需要沟通协作、资源整合的岗位。',
    execution: '你注重结果和效率，适合需要快速推进、落地执行的岗位。',
    balanced: '你具备多方面能力，适应性强，可以在多种类型的岗位中找到自己的位置。'
  };

  var badgeRow = document.getElementById('strength-badges');
  badgeRow.innerHTML = '<span class="badge badge-accent">' + typeLabels[State.strengthType] + '</span>';
  document.getElementById('strength-desc').textContent = typeDescs[State.strengthType];
}

// ===== MODULE 2: JOB RECOMMENDATIONS =====
var jobs = [
  {
    id: 'pm',
    name: '产品经理',
    match: 92,
    industry: '互联网',
    function: '产品',
    org: '中厂/初创',
    desc: '负责产品规划、需求分析和跨团队协作，需要逻辑思维和用户洞察。',
    tags: ['逻辑型', '共情型'],
    scores: { logic: 85, empathy: 80, creative: 60, social: 75, execution: 70 }
  },
  {
    id: 'content',
    name: '内容运营',
    match: 78,
    industry: '新媒体',
    function: '运营',
    org: '自媒体/MCN',
    desc: '负责选题策划、内容生产和数据复盘，需要创意表达和用户感知。',
    tags: ['创意型', '共情型'],
    scores: { logic: 55, empathy: 85, creative: 90, social: 60, execution: 65 }
  },
  {
    id: 'data',
    name: '数据分析师',
    match: 85,
    industry: '电商',
    function: '分析',
    org: '大厂',
    desc: '通过数据发现业务问题、输出分析结论，需要逻辑严谨和数字敏感。',
    tags: ['逻辑型'],
    scores: { logic: 95, empathy: 45, creative: 40, social: 50, execution: 70 }
  },
  {
    id: 'user_ops',
    name: '用户运营',
    match: 71,
    industry: '教育',
    function: '运营',
    org: '中厂',
    desc: '负责用户生命周期管理、活动策划和社群运营，需要沟通协调和执行力。',
    tags: ['社交型', '执行型'],
    scores: { logic: 60, empathy: 80, creative: 55, social: 90, execution: 85 }
  }
];

function renderJobCards() {
  var sorted = jobs.slice().sort(function(a, b) {
    var sa = a.scores[State.strengthType] || 50;
    var sb = b.scores[State.strengthType] || 50;
    return sb - sa;
  });

  var container = document.getElementById('job-cards');
  container.innerHTML = '';
  sorted.forEach(function(job) {
    var card = document.createElement('div');
    card.className = 'job-card';
    card.onclick = function() { selectJob(job); };
    var html = '<div class="job-match">' + job.match + '%</div>';
    html += '<div class="job-name">' + job.name + '</div>';
    html += '<div class="job-meta">';
    html += '<span>' + job.industry + '</span>';
    html += '<span>' + job.function + '</span>';
    html += '<span>' + job.org + '</span>';
    html += '</div>';
    html += '<div class="job-desc">' + job.desc + '</div>';
    card.innerHTML = html;
    container.appendChild(card);
  });
}

function selectJob(job) {
  State.selectedJob = job;
  showScreen('screen-m4-workday');
  renderWorkday();
}

function goToModule2() {
  showScreen('screen-m2');
  renderJobCards();
}

// ===== COMPARE TABLE =====
function toggleCompare() {
  var compareScreen = document.getElementById('screen-compare');
  if (compareScreen.classList.contains('active')) {
    showScreen('screen-m2');
  } else {
    showScreen('screen-compare');
    renderCompareTable();
  }
}

function renderCompareTable() {
  var tbody = document.getElementById('compare-body');
  var rows = [
    { label: '核心能力要求', vals: ['逻辑思维 + 用户洞察', '创意表达 + 热点敏感', '数据分析 + 业务理解', '沟通协调 + 执行力'] },
    { label: '日常工作节奏', vals: ['会议多、碎片化', '自主性强、有创意周期', '专注分析、节奏稳定', '活动驱动、节奏快'] },
    { label: '沟通协作强度', vals: ['高（跨多部门）', '中（主要和编辑/设计）', '低（偏独立分析）', '高（直接面对用户）'] },
    { label: '薪资天花板', vals: ['很高', '中高', '高', '中等'] },
    { label: '入门门槛', vals: ['中', '低', '中高', '低'] },
    { label: '与你的匹配度', vals: ['92%', '78%', '85%', '71%'] }
  ];

  tbody.innerHTML = '';
  rows.forEach(function(row) {
    var tr = document.createElement('tr');
    var html = '<td>' + row.label + '</td>';
    row.vals.forEach(function(v) {
      if (row.label === '与你的匹配度') {
        var pct = parseInt(v);
        html += '<td><span class="score-bar"><span class="score-bar-fill" style="width:' + pct + '%"></span></span>' + v + '</td>';
      } else {
        html += '<td>' + v + '</td>';
      }
    });
    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

// ===== MODULE 4: WORKDAY TIMELINE =====
function renderWorkday() {
  document.getElementById('workday-job-name').textContent = State.selectedJob.name;
  document.getElementById('workday-job-title').textContent = State.selectedJob.name;

  var timelines = {
    pm: [
      { time: '09:00', title: '查收消息，梳理今日优先级', desc: '打开飞书/钉钉，查看 overnight 的用户反馈、数据报表，和工程师确认昨天上线的功能是否稳定。' },
      { time: '10:30', title: '需求评审会', desc: '和设计、开发、测试一起评审新功能方案。你需要回答：为什么做这个？用户痛点是什么？数据支撑在哪里？' },
      { time: '14:00', title: '用户访谈', desc: '和 3 位目标用户进行 30 分钟深度访谈，了解他们在使用产品时遇到的具体问题。' },
      { time: '16:00', title: '写 PRD', desc: '把今天的调研结论整理成需求文档，明确功能逻辑、交互流程和验收标准。' },
      { time: '18:30', title: '数据复盘', desc: '查看上周 A/B 测试的结果，分析实验数据，决定下一步优化方向。' }
    ],
    content: [
      { time: '09:30', title: '刷热点，找选题', desc: '浏览各平台热点榜单、竞品账号、用户评论，找到今天可以切入的选题方向。' },
      { time: '11:00', title: '策划内容结构', desc: '确定标题、开头钩子、内容框架和结尾引导，写一份简要的内容大纲。' },
      { time: '14:00', title: '内容创作', desc: '根据大纲撰写正文，寻找配图/素材，调整排版和格式。' },
      { time: '16:30', title: '发布 & 监测', desc: '内容发布后紧盯前 1 小时的阅读、点赞、评论数据，及时在评论区互动。' },
      { time: '18:00', title: '数据复盘', desc: '分析今天内容的表现，总结哪些选题/标题/形式效果更好，为明天做准备。' }
    ],
    data: [
      { time: '09:00', title: '查看数据仪表盘', desc: '打开 BI 工具，查看昨日核心指标（GMV、转化率、客单价）是否有异常波动。' },
      { time: '10:30', title: '业务方需求沟通', desc: '市场部同事想知道 "618 大促期间哪些品类增长最快"，你需要明确分析维度和交付时间。' },
      { time: '14:00', title: '数据提取 & 清洗', desc: '写 SQL 提取相关数据，处理异常值和缺失值，确保数据质量。' },
      { time: '16:00', title: '分析 & 可视化', desc: '用 Excel 或 Python 做分析，制作图表，找到数据背后的业务洞察。' },
      { time: '17:30', title: '输出分析报告', desc: '把分析结论写成简洁的报告，用业务语言解释数据发现，给出可落地的建议。' }
    ],
    user_ops: [
      { time: '09:30', title: '查看用户数据', desc: '查看昨日新增、活跃、留存数据，识别异常波动，标记需要关注的用户群体。' },
      { time: '10:30', title: '策划本周活动', desc: '设计一个提升用户活跃度的线上活动，确定玩法、奖励机制和传播路径。' },
      { time: '14:00', title: '社群运营', desc: '在核心用户群中发布活动信息，回复用户问题，收集反馈并记录。' },
      { time: '16:00', title: '和产研沟通', desc: '把用户反馈中涉及产品问题的部分整理给产品经理，推动体验优化。' },
      { time: '17:30', title: '活动数据复盘', desc: '分析活动参与率、转化率和用户满意度，输出复盘报告。' }
    ]
  };

  var data = timelines[State.selectedJob.id] || timelines.pm;
  var container = document.getElementById('workday-timeline');
  container.innerHTML = '';
  data.forEach(function(item) {
    var div = document.createElement('div');
    div.className = 'timeline-item';
    div.innerHTML = '<div class="time-label">' + item.time + '</div><div class="time-title">' + item.title + '</div><div class="time-desc">' + item.desc + '</div>';
    container.appendChild(div);
  });
}

function startScenes() {
  State.currentSceneIndex = 0;
  State.sceneAnswers = [];
  showScreen('screen-m4-scene');
  renderScene();
}

// ===== MODULE 4: SCENES =====
var scenes = {
  pm: [
    {
      speaker: '张总监', role: '产品总监', avatar: '\uD83D\uDC54',
      message: '小林，我们最近收到很多用户反馈说 App 的搜索功能不好用。我需要你分析一下问题出在哪里，然后给我一个优化方案。你打算怎么做？',
      options: [
        { text: '先拉数据看看搜索转化率、热搜词和用户流失路径', tag: 'data-driven', reaction: '靠谱！数据先行，这点我很放心交给你。不过别忘了也听听用户怎么说，纯看数据容易漏掉感受层面的东西。' },
        { text: '先找几个用户聊聊，了解他们觉得"不好用"具体指什么', tag: 'user-centric', reaction: '嗯，先理解用户再动手，产品意识不错！不过光访谈不够，回头记得拉数据验证你的判断。' },
        { text: '先调研一下竞品是怎么做搜索的，看看行业最佳实践', tag: 'competitive', reaction: '了解竞品是好事，但优先级不对哦。我们应该先搞清楚自己的问题在哪，再去参考别人。' }
      ]
    },
    {
      speaker: '李工程师', role: '后端开发', avatar: '\uD83D\uDCBB',
      message: '你提的搜索优化方案，我评估了一下，实现成本很高，大概要 3 周。而且老板这周就在催另一个需求了。你怎么想？',
      options: [
        { text: '我们能不能先做 MVP，把最核心的优化点拆出来，1 周先上线？', tag: 'pragmatic', reaction: 'MVP 思路很好，1 周我能搞定。这样既能快速验证效果，也不会耽误老板那边的需求，双赢。' },
        { text: '那我和老板沟通一下，看看能不能调整优先级', tag: 'communicative', reaction: '也行，老板那边的优先级确实需要产品来把控。但这个搜索问题挺严重的，别拖太久啊。' },
        { text: '3 周确实久，但我可以同步准备数据和测试方案，上线后立即验证效果', tag: 'strategic', reaction: '长远来看这样更稳。不过你得帮我扛住老板的压力，别让她半路又砍了。' }
      ]
    },
    {
      speaker: '王设计师', role: 'UI 设计师', avatar: '\uD83C\uDFA8',
      message: '搜索结果的展示方式，我觉得用卡片式更好，用户扫起来更舒服。但之前你们定的方案是列表式。要不要改？',
      options: [
        { text: '我觉得两种方案各做一版原型，我们找几个用户测一下再决定', tag: 'data-driven', reaction: '太好了！最怕产品自己拍脑袋做决定。你们测的时候叫上我，我想看看用户实际操作时的反应。' },
        { text: '卡片式确实视觉更好，但如果搜索结果很多，卡片式会不会占用太多屏幕空间？', tag: 'analytical', reaction: '你考虑得很周到。确实，手机端卡片式信息密度可能不够。要不我出两版设计稿，你评估一下？' },
        { text: '我倾向于先按列表式上线，等数据稳定后再 A/B 测试卡片式', tag: 'pragmatic', reaction: '有点失望，我花了一整天画的卡片式原型...不过你说得对，先跑起来再迭代，我不会往心里去（才怪）。' }
      ]
    }
  ],
  content: [
    {
      speaker: '主编', role: '内容主编', avatar: '\uD83D\uDCDD',
      message: '这周的热点事件发酵很快，我们要不要追？但追热点可能会让我们的账号显得不够深度。你怎么看？',
      options: [
        { text: '可以追，但要用我们的专业视角做差异化解读，不能只是复述热点', tag: 'creative', reaction: '嗯，这个思路我喜欢。差异化才是我们的护城河，别做搬运工。去写吧，我期待看到你的角度。' },
        { text: '先看一下这个热点的搜索量和讨论趋势，如果热度够高就追', tag: 'data-driven', reaction: '行，先用数据说话。但注意，有些话题虽然热度高，但跟我们账号定位不搭，别为了流量丢了调性。' },
        { text: '我觉得要看这个热点和我们的定位是否匹配，不匹配的硬追反而掉粉', tag: 'strategic', reaction: '稳重！保持调性比追一波流量重要多了。这点自觉性很难得，不用我多操心了。' }
      ]
    },
    {
      speaker: '数据同事', role: '数据运营', avatar: '\uD83D\uDCCA',
      message: '最近几篇干货长文的阅读量都不高，但收藏率很高。短视频的数据倒是越来越好。我们是不是要调整内容方向？',
      options: [
        { text: '长文和短视频不冲突，可以把长文的核心观点拆解成短视频系列', tag: 'pragmatic', reaction: '好思路！一鱼多吃，长文积累深度，短视频负责传播。你去做策划吧，我这边帮你盯数据。' },
        { text: '阅读量不高可能是标题和封面的问题，先优化分发环节再判断内容', tag: 'analytical', reaction: '你分析得挺细的。确实，很多好内容就是被标题拖累了。要不这周试试 AB 测标题？' },
        { text: '收藏率高说明内容有价值，也许可以尝试付费专栏或知识产品', tag: 'strategic', reaction: '想法大胆，我喜欢！不过付费内容的产品逻辑和免费完全不同，建议先小范围测试一下用户付费意愿。' }
      ]
    },
    {
      speaker: '粉丝私信', role: '用户反馈', avatar: '\uD83D\uDCAC',
      message: '一位老粉私信说："最近内容质量下降了，感觉你们越来越像营销号。"你怎么办？',
      options: [
        { text: '认真回复他，感谢他的反馈，承诺我们会调整', tag: 'user-centric', reaction: '收到，感谢你的真诚回复。老粉的感受很重要，下次选题的时候多关注一下这类用户的需求。' },
        { text: '把他的反馈截屏发到团队群里，让大家讨论一下是否真的存在问题', tag: 'communicative', reaction: '能把负面反馈主动拿出来讨论，这种心态不错。团队确实该定期做这样的复盘。' },
        { text: '整理最近 30 天的内容数据，看质量和互动是否真的在下滑', tag: 'data-driven', reaction: '这才是正确的做法！不要被一条私信带着情绪走，用数据验证一下再做判断。' }
      ]
    }
  ],
  data: [
    {
      speaker: '市场总监', role: '市场部', avatar: '\uD83D\uDCE2',
      message: '618 大促期间，我们想知道到底是哪些品类的增长带动了整体业绩。你能帮我们分析一下吗？',
      options: [
        { text: '我来拆解 GMV 的构成，看看各品类的贡献占比和同比增长', tag: 'logic', reaction: '好！如果能再做一个环比（跟去年同期对比）就更完整了。你做分析的时候也帮我看一下品类间的关联购买情况。' },
        { text: '先了解你们最关心的是流量端还是转化端，这样可以更有针对性', tag: 'analytical', reaction: '说实话，都关心...不过你的思路对，先聚焦比撒网式分析更高效。我们就从流量端开始吧。' },
        { text: '我可以先拉一版数据，你们确认维度后再深入', tag: 'pragmatic', reaction: '没问题，先给个初步结果，我们内部讨论后再决定深挖方向。这种渐进式的工作方式我很舒服。' }
      ]
    },
    {
      speaker: '业务VP', role: '管理层', avatar: '\uD83D\uDCBC',
      message: '上个月的转化率下降了 15%，我需要你在周五之前给我一个分析报告，解释清楚原因。',
      options: [
        { text: '15% 的下降幅度很大，我需要先排查是流量质量变化还是页面体验问题', tag: 'data-driven', reaction: '思路清晰，排除法是对的。我最怕听到"可能是这个也可能是那个"这种模糊结论。周五我等你。' },
        { text: '周五之前可以，但这么多维度，我建议先聚焦 2-3 个核心假设来验证', tag: 'pragmatic', reaction: '可以，不过别漏掉支付环节，上次就是支付接口不稳定导致的下降，别犯同样的错。' },
        { text: '能否告诉我您最关注哪个环节的转化率，我们先从那个入口排查', tag: 'analytical', reaction: '嗯...我最关心的是下单到支付的转化。能问出这个问题的分析师不多，你有点东西。' }
      ]
    },
    {
      speaker: '产品经理', role: '产品部', avatar: '\uD83D\uDCF1',
      message: '新上线的推荐算法，我们想验证它是否真的比旧算法更好。你怎么看？',
      options: [
        { text: '做一个 A/B 测试，分别跑一周，对比核心指标的差异', tag: 'data-driven', reaction: '专业！建议再加一个显著性检验，确保结果不是偶然的。你帮我们设计一下实验方案吧。' },
        { text: '除了数据，也要看用户的长期留存，新算法可能在短期指标上占优但长期反而差', tag: 'analytical', reaction: '提醒得好！我们确实容易只看短期数据。你能帮我把分析周期拉长到两周吗？' },
        { text: '我先拉一下新算法上线前后的同期数据，看看趋势是否自然变化', tag: 'logic', reaction: '同期对比是个好起点。但光看大盘可能不够，建议分人群看一下，不同用户群体受到的影响可能不一样。' }
      ]
    }
  ],
  user_ops: [
    {
      speaker: '运营总监', role: '运营部', avatar: '\uD83D\uDE80',
      message: '这周 DAU 下降了 10%，我们要不要发一个大额优惠券拉回来？',
      options: [
        { text: '先别急，DAU 下降的原因还没搞清楚，发券可能治标不治本', tag: 'analytical', reaction: '你说得对，我太焦虑了。那赶紧分析一下，我给你拉一下最近 7 天的用户结构数据。' },
        { text: '可以先发一个小额券试探一下，看看用户对价格敏感度如何', tag: 'pragmatic', reaction: '也是个办法。小步试错，成本低。你去设计一下券的面额和使用条件，别直接发无门槛的。' },
        { text: '我觉得可以同步做，问问用户为什么不来了，是更好的做法', tag: 'user-centric', reaction: '同步做挺好的，效率和洞察兼顾。要不你去社群里做一个小调研？我帮你发公告。' }
      ]
    },
    {
      speaker: '客服主管', role: '客服部', avatar: '\uD83C\uDFA7',
      message: '最近用户投诉量突然上升，大家都在说是产品的问题。你怎么看？',
      options: [
        { text: '我来拉一下投诉分类的数据，看看上升集中在哪个维度，不能凭感觉判断', tag: 'data-driven', reaction: '太好了，终于有人愿意先看数据了。客服那边已经被各部门推来推去，有你这句话我就安心了。' },
        { text: '投诉量上升可能是产品问题，也可能是我们客服主动外呼触发了反馈，先确认一下', tag: 'analytical', reaction: '你考虑的角度我们没想过。确实，上周我们加了一批主动回访...这样排查更合理。' },
        { text: '先安抚客服团队的情绪，同时我去找几个投诉用户了解具体情况', tag: 'social', reaction: '谢谢你！客服团队最近压力确实很大，有人愿意理解她们的工作已经很难得了。我去安排几个典型用户给你访谈。' }
      ]
    },
    {
      speaker: '老板', role: '管理层', avatar: '\uD83D\uDC54',
      message: '下个月要做用户增长，能不能策划一个爆款活动？',
      options: [
        { text: '我先了解一下我们的用户画像和竞品的活动策略，再给你一个具体的方案', tag: 'strategic', reaction: '靠谱，不喜欢一拍脑袋就行动的人。三天后给我一个方案框架，我会认真看。' },
        { text: '爆款活动需要预算和资源支持，我们先讨论一下这次增长的目标和可用资源', tag: 'pragmatic', reaction: '很务实。预算方面，如果方案够好，我可以向上申请。但你得先告诉我 ROI 大概能到多少。' },
        { text: '我觉得与其做一个大活动，不如拆成几个小活动持续刺激，这样更稳健', tag: 'data-driven', reaction: '有趣的想法。但我关心的是，小活动的爆发力够不够？如果数据能证明持续小活动 > 单次大活动，我支持你。' }
      ]
    }
  ]
};

function renderScene() {
  var jobId = State.selectedJob.id;
  var sceneList = scenes[jobId] || scenes.pm;
  var scene = sceneList[State.currentSceneIndex];
  var total = sceneList.length;

  document.getElementById('scene-progress').style.width =
    ((State.currentSceneIndex) / total * 100) + '%';

  var container = document.getElementById('scene-content');
  var html = '<div class="scene-card">';
  html += '<div class="scene-header">';
  html += '<div class="scene-avatar">' + scene.avatar + '</div>';
  html += '<div><div class="scene-avatar-name">' + scene.speaker + '</div>';
  html += '<div class="scene-avatar-role">' + scene.role + '</div></div>';
  html += '</div>';
  html += '<div class="scene-message">' + scene.message + '</div>';
  html += '<div class="q-num" style="margin-bottom:0.75rem;">场景 ' + (State.currentSceneIndex + 1) + ' / ' + total + '</div>';
  html += '<div class="q-opts">';
  var labels = ['A', 'B', 'C', 'D'];
  scene.options.forEach(function(opt, idx) {
    html += '<div class="q-opt" onclick="selectSceneOption(' + idx + ', this)"><span class="opt-letter">' + labels[idx] + '</span><span class="opt-text">' + opt.text + '</span></div>';
  });
  html += '</div></div>';
  container.innerHTML = html;
}

function selectSceneOption(oIdx, el) {
  var jobId = State.selectedJob.id;
  var sceneList = scenes[jobId] || scenes.pm;
  var scene = sceneList[State.currentSceneIndex];
  var opt = scene.options[oIdx];
  var tag = opt.tag;
  var reaction = opt.reaction || '';
  State.sceneAnswers.push(tag);

  el.parentElement.querySelectorAll('.q-opt').forEach(function(o) { o.classList.remove('selected'); o.style.pointerEvents = 'none'; });
  el.classList.add('selected');

  // Show colleague reaction
  if (reaction) {
    var container = document.getElementById('scene-content');
    var reactionDiv = document.createElement('div');
    reactionDiv.className = 'colleague-reaction';
    reactionDiv.innerHTML = '<div class="reaction-speaker">' + scene.speaker + ' 的反应</div>' + reaction;
    container.querySelector('.scene-card').appendChild(reactionDiv);
  }

  setTimeout(function() {
    State.currentSceneIndex++;
    if (State.currentSceneIndex < sceneList.length) {
      renderScene();
    } else {
      document.getElementById('scene-progress').style.width = '100%';
      document.getElementById('scene-nav').style.display = 'block';
    }
  }, 1500);
}

function finishScenes() {
  showScreen('screen-m4-result');
  renderM4Result();
}

function renderM4Result() {
  var jobId = State.selectedJob.id;

  var jobInsights = {
    pm: {
      likes: ['需求拆解和逻辑分析', '用户调研和洞察', '跨部门沟通协调', '数据驱动的决策方式'],
      gaps: ['模糊需求带来的不确定性', '多方意见协调的时间成本', '会议多、碎片化的工作节奏'],
      resume: '在产品经理职业模拟中，独立完成了用户问题调研、需求方案设计和跨团队评审协作。掌握了产品经理核心工作流程，具备需求分析、PRD 撰写和项目管理的基础能力。'
    },
    content: {
      likes: ['内容创意和选题策划', '文字表达和用户共鸣', '热点敏感和创意输出', '数据分析优化内容效果'],
      gaps: ['持续高频产出的压力', '内容效果的焦虑感', '热点追逐带来的疲惫'],
      resume: '完成了内容运营职业模拟，熟悉选题策划、内容创作、数据复盘的全流程。对内容运营的核心能力有实践认知，具备热点敏感度和内容策划基础能力。'
    },
    data: {
      likes: ['数据分析的逻辑推理', '用数据解释业务问题', '独立安静的工作状态', '清晰的产出和结论'],
      gaps: ['需要和业务方反复沟通需求', '分析结论有时不被采纳的无力感', '技术工具学习的持续投入'],
      resume: '通过数据分析职业模拟，熟悉业务需求沟通、数据提取清洗、分析报告输出的完整流程。具备 SQL 数据提取、Excel 分析和报告撰写的基础能力。'
    },
    user_ops: {
      likes: ['直接面对用户的成就感', '活动策划和落地执行', '多任务并行的工作节奏', '快速的正向反馈'],
      gaps: ['用户问题的重复性', '活动效果波动的焦虑', '需要持续维护社群的精力投入'],
      resume: '完成了用户运营职业模拟，熟悉用户数据分析、活动策划、社群运营和跨部门沟通的完整链路。理解用户运营的核心指标和运营策略，具备活动策划基础能力。'
    }
  };

  var data = jobInsights[jobId] || jobInsights.pm;

  var likeList = document.getElementById('like-list');
  likeList.innerHTML = '';
  data.likes.forEach(function(item) {
    var li = document.createElement('li');
    li.textContent = item;
    likeList.appendChild(li);
  });

  var gapList = document.getElementById('gap-list');
  gapList.innerHTML = '';
  data.gaps.forEach(function(item) {
    var li = document.createElement('li');
    li.textContent = item;
    gapList.appendChild(li);
  });

  var job = State.selectedJob;
  var fitScores = document.getElementById('fit-scores');
  var scoreTypes = [
    { label: '核心能力匹配', score: job.match },
    { label: '工作方式匹配', score: Math.min(100, job.match + Math.floor(Math.random() * 10 - 5)) },
    { label: '成长空间匹配', score: Math.min(100, job.match + Math.floor(Math.random() * 15 - 7)) }
  ];
  fitScores.innerHTML = '';
  scoreTypes.forEach(function(item) {
    var pct = Math.min(100, item.score);
    var div = document.createElement('div');
    div.style.marginBottom = '0.75rem';
    div.innerHTML = '<div style="display:flex;justify-content:space-between;margin-bottom:0.3rem;font-size:0.9rem;"><span>' + item.label + '</span><span style="color:var(--accent);font-weight:600;">' + pct + '%</span></div><div class="score-bar"><div class="score-bar-fill" style="width:' + pct + '%"></div></div>';
    fitScores.appendChild(div);
  });

  document.getElementById('resume-text').textContent = data.resume;

  // ===== COLLEAGUE REVIEWS =====
  var colleagueReviews = {
    pm: [
      { name: '张总监', role: '产品总监', avatar: '\uD83D\uDC54', text: '这个实习生很有产品感，遇到问题不会急着给方案，而是先搞清楚"为什么"。沟通的时候逻辑清晰，不绕弯子。假以时日，应该能独立负责一条产品线。' },
      { name: '李工程师', role: '后端开发', avatar: '\uD83D\uDCBB', text: '我给过的需求优先级他都能理解，不会一拍脑袋就改方案。和他合作比较省心，至少不用来回扯皮。要是产品经理都这样就好了。' },
      { name: '王设计师', role: 'UI 设计师', avatar: '\uD83C\uDFA8', text: '能站在用户角度思考问题的产品不多。不过有时候还是偏理性了，如果多一点对设计细节的关注就更好了。总体来说，合作体验不错。' }
    ],
    content: [
      { name: '主编', role: '内容主编', avatar: '\uD83D\uDCDD', text: '选题眼光不错，知道什么是好内容。不过写速度还得练练，互联网的速度可不是慢慢打磨的。继续加油，未来可期。' },
      { name: '数据同事', role: '数据运营', avatar: '\uD83D\uDCCA', text: '难得有内容同学会主动看数据，而且分析得还挺有深度。和这样的人合作，我的数据报告终于不会被束之高阁了。' },
      { name: '老粉丝', role: '忠实读者', avatar: '\uD83D\uDCAC', text: '感觉你们最近的选题越来越有深度了，不像以前那么浮躁。继续这个方向，我会一直关注的。' }
    ],
    data: [
      { name: '市场总监', role: '市场部', avatar: '\uD83D\uDCE2', text: '这个分析师给出的结论不是简单报数据，而是用业务语言解释了背后的原因。和业务部门沟通起来完全没有障碍，难得。' },
      { name: '业务VP', role: '管理层', avatar: '\uD83D\uDCBC', text: '报告写得很清晰，结论明确、逻辑自洽。不回避问题，也不甩锅，这种风格我很欣赏。如果团队里多几个这样的人就好了。' },
      { name: '产品经理', role: '产品部', avatar: '\uD83D\uDCF1', text: '他提出的分析维度我们都没考虑到，特别是分人群看算法效果的建议，让我们的实验设计更严谨了。合作很愉快。' }
    ],
    user_ops: [
      { name: '运营总监', role: '运营部', avatar: '\uD83D\uDE80', text: '沉稳，遇事不慌，会先分析再行动。这在运营岗特别重要，因为每天都是突发状况。执行力也不错，布置的任务基本不用跟催。' },
      { name: '客服主管', role: '客服部', avatar: '\uD83C\uDFA7', text: '很少有运营能理解客服团队的辛苦，他能站在我们的角度思考问题。这种共情能力在跨部门协作中非常加分。' },
      { name: '老板', role: '管理层', avatar: '\uD83D\uDC54', text: '方案做得很细致，不光有创意还有数据支撑，ROI 也能讲清楚。最让我放心的是，他知道什么时候该推进、什么时候该求助。' }
    ]
  };

  var reviews = colleagueReviews[jobId] || colleagueReviews.pm;
  var reviewsEl = document.getElementById('colleague-reviews');
  reviewsEl.innerHTML = '';
  reviews.forEach(function(r) {
    var card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = '<div class="review-header"><div class="review-avatar">' + r.avatar + '</div><div><div class="review-name">' + r.name + '</div><div class="review-role">' + r.role + '</div></div></div><div class="review-text">' + r.text + '</div>';
    reviewsEl.appendChild(card);
  });
}

function copyResume() {
  var text = document.getElementById('resume-text').textContent;
  navigator.clipboard.writeText(text).then(function() {
    var btn = document.querySelector('#resume-snippet .copy-btn');
    btn.textContent = '已复制!';
    setTimeout(function() { btn.textContent = '复制'; }, 2000);
  });
}

// ===== MODULE 5: ACTION PATH =====
function goToModule5() {
  showScreen('screen-m5');
  renderM5();
}

function renderM5() {
  var jobId = State.selectedJob.id;

  var paths = {
    pm: {
      have: ['基本的逻辑分析能力', '一定的文字表达能力', '对互联网产品的兴趣'],
      need: ['系统学习产品方法论', '掌握基础数据分析工具', '积累一个完整的项目经验'],
      steps: [
        { phase: '本周可做', title: '读一本产品经理入门书', desc: '推荐《俞军产品方法论》或《从点子到产品》，建立对产品工作的基本认知框架。', tasks: ['每天读 30 分钟，输出 3 条读书笔记', '整理书中最触动你的 3 个观点'] },
        { phase: '1-2 个月', title: '完成一个产品分析练习', desc: '找一款你常用的 App，写一份完整的产品分析报告。包含：产品定位、目标用户、核心功能、数据表现、优化建议。', tasks: ['选定一款 App，深度使用 1 周', '用 AXURE / Figma 画核心页面原型', '输出 1500 字以上的分析文档'] },
        { phase: '3-6 个月', title: '学习数据分析基础', desc: '产品经理最常用的数据分析工具是 SQL 和 Excel 透视表。', tasks: ['学习 SQL 基础（SELECT / WHERE / GROUP BY / JOIN）', '掌握 Excel 数据透视表和基础图表', '在产品分析报告中加入数据验证'] },
        { phase: '求职准备', title: '准备作品集和面试', desc: '将你的产品分析文档整理成作品集，并准备以下面试内容：', tasks: ['一份可展示的产品分析作品', '一个你常用产品的优化方案（面试高频题）', '对目标公司产品的深度调研'] }
      ],
      interview: '面试官问："你为什么想做产品经理？"\n\n回答思路：结合你在这个模拟中的体验 + 你的背景 + 你为这个方向做了哪些准备。\n\n示例：我在职业模拟中体验了产品经理的一天，发现我特别享受"从模糊问题中找到清晰方向"的过程。我的逻辑思维和共情能力让我觉得自己适合这个方向。为了进入这个领域，我已经读完了《产品方法论》，并独立完成了一款 App 的产品分析。'
    },
    content: {
      have: ['文字表达能力', '对热点话题的敏感度', '基本的审美和信息整理能力'],
      need: ['系统建立内容方法论', '掌握数据复盘能力', '积累作品和粉丝基础'],
      steps: [
        { phase: '本周可做', title: '开始运营一个内容账号', desc: '不要等到"准备好了"再开始，立刻开一个账号开始写。选题优先选你自己感兴趣、有独特视角的方向。', tasks: ['确定内容定位和目标受众', '制定第一周的选题计划（3-5 篇）', '输出第一篇完整内容'] },
        { phase: '1-2 个月', title: '建立内容数据复盘习惯', desc: '每周固定一个时间复盘本周内容的数据表现。关注：阅读量、完读率、收藏率、评论率。', tasks: ['用飞书/Notion 记录每篇内容的数据', '分析 Top3 和 Bottom3 内容，找规律', '调整第二周的内容策略'] },
        { phase: '3-6 个月', title: '学习内容营销的系统方法', desc: '系统学习内容运营的知识体系，包括：选题策略、内容策划、数据分析。', tasks: ['学习 2-3 个内容运营课程', '建立内容选题库和工作流程', '尝试一种新的内容形式（视频/长文/图文）'] },
        { phase: '求职准备', title: '准备作品集', desc: '将你运营账号的经验整理成作品集。', tasks: ['整理账号的数据成果', '写出 2-3 篇你认为最好的内容', '准备面试常见问题的回答框架'] }
      ],
      interview: '面试官问："你平时关注哪些内容账号？"\n\n回答思路：不要说"我关注了很多"，而是要展示你的洞察能力。\n\n示例：我最关注的是 X 账号。他们的内容特点是...我觉得他们做得好是因为...（分析内容策略、用户定位、差异化）。最近他们有一个选题我觉得可以做得更好...（展示主动思考）。'
    },
    data: {
      have: ['逻辑思维能力', '对数字的敏感度', '基本的 Excel 使用能力'],
      need: ['掌握 SQL 和 Python', '理解业务逻辑', '积累分析实战经验'],
      steps: [
        { phase: '本周可做', title: '学习 SQL 基础语法', desc: '数据分析的入门工具是 SQL，几乎所有数据岗位的面试都会考。', tasks: ['完成 SQL 基础教程（w3school / 牛客网）', '练习 30 道基础 SQL 题', '每天写 3 条 SQL 总结'] },
        { phase: '1-2 个月', title: '学习 Python 数据分析', desc: '进阶工具是 Python，重点学习 pandas、matplotlib 两个库。', tasks: ['完成 pandas 基础教程', '用 Python 分析一个真实数据集（如 Kaggle）', '把分析过程写成报告'] },
        { phase: '3-6 个月', title: '积累分析实战经验', desc: '找一个你感兴趣的业务场景，独立完成一次完整的数据分析。', tasks: ['选择一个业务问题（如"某 App 用户流失分析"）', '完成从问题定义到结论输出的全流程', '把分析写成可展示的报告'] },
        { phase: '求职准备', title: '准备作品集和面试', desc: '将你的分析报告整理成作品集。', tasks: ['整理 2-3 个完整的数据分析项目', '准备面试高频 SQL 题', '练习用业务语言讲述数据故事'] }
      ],
      interview: '面试官问："如何判断数据波动是异常还是正常？"\n\n回答思路：展示你的分析框架。\n\n示例：我会从这几个维度判断：① 看同期对比（上周 vs 上上周同期）② 看环比（今天 vs 昨天）③ 看外部因素（是否有节假日、促销活动）④ 做统计检验判断波动是否在置信区间内。如果排除以上因素后仍有异常，才算真正的异常。'
    },
    user_ops: {
      have: ['良好的沟通表达能力', '基本的活动策划意识', '对用户需求的敏感度'],
      need: ['掌握数据化运营方法', '积累活动策划经验', '理解用户生命周期管理'],
      steps: [
        { phase: '本周可做', title: '深度使用一款产品，记录用户体验', desc: '找一个你常用的 App，从运营视角重新体验它。', tasks: ['记录 App 中的关键运营节点（弹窗、push、活动入口）', '分析它们分别针对哪个用户生命周期阶段', '输出 5 个你认为值得学习的运营策略'] },
        { phase: '1-2 个月', title: '策划并执行一个小活动', desc: '不要纸上谈兵，立刻策划一个小活动并执行。可以是社群活动、线上打卡、话题征集等。', tasks: ['确定活动目标、玩法和传播路径', '准备活动素材（文案、海报、话术）', '执行并记录数据，活动后做复盘'] },
        { phase: '3-6 个月', title: '学习数据化运营', desc: '用户运营需要用数据说话，重点学习 DAU / 留存 / 转化率等核心指标。', tasks: ['理解用户生命周期的 5 个阶段', '学会用数据拆解运营问题', '完成一个用户分层的分析练习'] },
        { phase: '求职准备', title: '准备作品集', desc: '将你的活动策划和数据分析整理成作品。', tasks: ['整理活动策划方案和复盘报告', '用数据展示你策划活动的效果', '准备面试高频问题（如何提升留存、如何做活动策划）'] }
      ],
      interview: '面试官问："如果 DAU 下降了，你怎么办？"\n\n回答思路：展示你的分析框架，不要急于给解决方案。\n\n示例：DAU 下降的原因可能有很多，我会先做排查：① 是新增用户减少还是老用户流失？② 是整体下降还是某个渠道下降？③ 是否受外部因素影响（竞品动作、季节性）？确认问题后，再针对性地制定策略。这样比直接给方案更符合数据分析的逻辑。'
    }
  };

  var data = paths[jobId] || paths.pm;

  var haveEl = document.getElementById('m5-have');
  haveEl.innerHTML = '';
  data.have.forEach(function(item) {
    var li = document.createElement('li');
    li.textContent = item;
    haveEl.appendChild(li);
  });

  var needEl = document.getElementById('m5-need');
  needEl.innerHTML = '';
  data.need.forEach(function(item) {
    var li = document.createElement('li');
    li.textContent = item;
    needEl.appendChild(li);
  });

  var pathsEl = document.getElementById('action-paths');
  pathsEl.innerHTML = '';
  data.steps.forEach(function(step) {
    var div = document.createElement('div');
    div.className = 'path-card';
    div.innerHTML = '<div class="path-phase">' + step.phase + '</div>';
    div.innerHTML += '<div class="path-title">' + step.title + '</div>';
    div.innerHTML += '<div class="path-desc">' + step.desc + '</div>';
    div.innerHTML += '<ul class="path-tasks">';
    step.tasks.forEach(function(task) {
      div.innerHTML += '<li>' + task + '</li>';
    });
    div.innerHTML += '</ul>';
    pathsEl.appendChild(div);
  });

  document.getElementById('interview-text').innerHTML = data.interview.replace(/\n/g, '<br>');
}

function copyInterview() {
  var text = document.getElementById('interview-text').textContent;
  navigator.clipboard.writeText(text).then(function() {
    var btn = document.querySelector('#interview-snippet .copy-btn');
    btn.textContent = '已复制!';
    setTimeout(function() { btn.textContent = '复制'; }, 2000);
  });
}

// ===== DIRECT PATH (for D users) =====
var selectedDirectJob = null;
function selectDirectJob(job, card) {
  selectedDirectJob = job;
  document.querySelectorAll('#screen-direct .option-card').forEach(function(c) { c.classList.remove('selected'); });
  card.classList.add('selected');
  document.getElementById('direct-confirm-btn').disabled = false;
}

function confirmDirectJob() {
  var jobMap = { '产品经理': 'pm', '内容运营': 'content', '数据分析': 'data', '用户运营': 'user_ops' };
  var jobId = jobMap[selectedDirectJob];
  State.selectedJob = jobs.find(function(j) { return j.id === jobId; });
  showScreen('screen-m5');
  renderM5();
}
