/**
 * 体验引擎：职业库、创业库、场景配置、AI 对话生成、任务系统
 * 数据持久化：localStorage（archive）
 */

(function (global) {
  'use strict';

  // ===== 年龄段配置（影响文案/交互/任务复杂度）=====
  var AGE_MODES = {
    '6-10': {
      key: '6-10',
      label: '启蒙探索',
      style: '卡通',
      icon: 'palette',
      taskHint: '点击选择答案，或写下你想到的第一个词',
      questionHint: '用简单的话回答就好啦',
      font: 'text-lg',
      bubblePadding: 'p-5',
    },
    '11-15': {
      key: '11-15',
      label: '深度体验',
      style: '写实',
      icon: 'building-2',
      taskHint: '选择你的策略，或用一段话说明你的想法',
      questionHint: '请具体阐述你的观点和理由',
      font: 'text-base',
      bubblePadding: 'p-4',
    },
    '16-18': {
      key: '16-18',
      label: '真实预演',
      style: '拟真',
      icon: 'briefcase',
      taskHint: '做出你的决策，给出真实场景下的判断依据',
      questionHint: '请基于行业真实情况，给出你的专业判断',
      font: 'text-base',
      bubblePadding: 'p-4',
    },
  };

  // ===== 职业库 =====
  var JOBS = [
    {
      id: 'product-manager',
      name: '产品经理',
      icon: 'briefcase',
      color: '#F59E0B',
      bg: 'from-amber-50 to-orange-50',
      company: '智行科技',
      industry: '互联网',
      salary: '15-30K',
      hot: true,
      summary: '定义产品方向、协调研发与设计、对结果负责',
      skills: ['用户洞察', '需求分析', '跨团队协作', '数据驱动'],
      hr: { name: '李女士', title: 'HR 经理', avatar: '👩‍💼', tone: '严谨' },
      manager: { name: '王总监', title: '产品总监', avatar: '👨‍💼', tone: '务实' },
      office: '海淀知春路·联合创业办公空间',
    },
    {
      id: 'ui-designer',
      name: 'UI 设计师',
      icon: 'palette',
      color: '#FB923C',
      bg: 'from-orange-50 to-rose-50',
      company: '星眸设计',
      industry: '设计',
      salary: '12-25K',
      summary: '把产品需求转化为易用且美的界面',
      skills: ['视觉设计', '交互理解', 'Figma/Sketch', '动效基础'],
      hr: { name: '周老师', title: '设计主管', avatar: '👩‍🎨', tone: '感性' },
      manager: { name: '陈主创', title: '设计总监', avatar: '👨‍🎨', tone: '挑剔' },
      office: '朝阳798·创意园区',
    },
    {
      id: 'game-designer',
      name: '游戏数值策划',
      icon: 'gamepad-2',
      color: '#F472B6',
      bg: 'from-rose-50 to-pink-50',
      company: '奇点互娱',
      industry: '游戏',
      salary: '15-35K',
      hot: true,
      summary: '设计角色成长、经济系统与战斗平衡',
      skills: ['数学建模', 'Excel/脚本', '玩家心理', '数据敏感'],
      hr: { name: '林 HR', title: '招聘负责人', avatar: '🧑‍💼', tone: '直接' },
      manager: { name: '吴制作人', title: '主策', avatar: '🧑‍💻', tone: '硬核' },
      office: '漕河泾·游戏产业基地',
    },
    {
      id: 'data-analyst',
      name: '数据分析师',
      icon: 'bar-chart-3',
      color: '#7DD3FC',
      bg: 'from-sky-50 to-cyan-50',
      company: '数智洞察',
      industry: '企业服务',
      salary: '13-28K',
      summary: '从数据中发现业务规律，输出可执行洞察',
      skills: ['SQL/Python', '统计学', '业务理解', '可视化'],
      hr: { name: '赵 HR', title: '人力负责人', avatar: '👩‍💼', tone: '稳重' },
      manager: { name: '高首席', title: '数据负责人', avatar: '🧑‍💼', tone: '逻辑' },
      office: '陆家嘴·金融数据大厦',
    },
    {
      id: 'new-media',
      name: '新媒体运营',
      icon: 'megaphone',
      color: '#6EE7B7',
      bg: 'from-emerald-50 to-teal-50',
      company: '有话文化',
      industry: '内容',
      salary: '10-22K',
      summary: '选题、写稿、互动，让账号持续增长',
      skills: ['内容嗅觉', '热点捕捉', '文案能力', '数据分析'],
      hr: { name: '孙 HR', title: '行政人事', avatar: '👩‍💼', tone: '亲切' },
      manager: { name: '韩主编', title: '内容总监', avatar: '🧑‍💼', tone: '年轻' },
      office: '望京·网红办公园区',
    },
    {
      id: 'psychologist',
      name: '心理咨询师',
      icon: 'heart-pulse',
      color: '#C4B5FD',
      bg: 'from-violet-50 to-purple-50',
      company: '心晴工作室',
      industry: '专业服务',
      salary: '12-25K',
      summary: '倾听、共情、引导来访者发现自我',
      skills: ['共情能力', '专业知识', '伦理意识', '倾听'],
      hr: { name: '黄行政', title: '行政主管', avatar: '👩‍💼', tone: '温和' },
      manager: { name: '苏老师', title: '首席咨询师', avatar: '🧑‍⚕️', tone: '沉稳' },
      office: '静安·心理咨询中心',
    },
  ];

  // ===== 创业方向库 =====
  var STARTUPS = [
    {
      id: 'edtech',
      name: '教育科技',
      icon: 'graduation-cap',
      color: '#F59E0B',
      bg: 'from-amber-50 to-yellow-50',
      summary: '用技术让学习更高效',
      product: '智能学习助手',
      market: 'K12 + 职业培训',
      initialFund: 100,
      investors: [
        { name: '陈总', firm: '启明资本', style: '关注数据' },
        { name: 'Lina', firm: '未来基金', style: '关注团队' },
      ],
    },
    {
      id: 'healthtech',
      name: '健康科技',
      icon: 'heart-pulse',
      color: '#FB923C',
      bg: 'from-orange-50 to-red-50',
      summary: '用产品让健康管理更轻松',
      product: '健康饮食规划 APP',
      market: '一二线城市白领',
      initialFund: 120,
      investors: [
        { name: '王总', firm: '生命科学基金', style: '关注合规' },
        { name: '吴经理', firm: '健康产业投资', style: '关注市场' },
      ],
    },
    {
      id: 'content',
      name: '内容创作',
      icon: 'video',
      color: '#F472B6',
      bg: 'from-rose-50 to-pink-50',
      summary: '打造下一个现象级 IP',
      product: '短视频内容矩阵',
      market: '18-35 岁年轻人',
      initialFund: 50,
      investors: [
        { name: '张总', firm: '文创资本', style: '关注创意' },
        { name: 'Maya', firm: '新内容基金', style: '关注数据' },
      ],
    },
    {
      id: 'greentech',
      name: '绿色科技',
      icon: 'leaf',
      color: '#6EE7B7',
      bg: 'from-emerald-50 to-green-50',
      summary: '让可持续生活方式成为日常',
      product: '碳足迹追踪器',
      market: '环保意识消费者',
      initialFund: 80,
      investors: [
        { name: '刘总', firm: 'ESG 基金', style: '关注长期价值' },
        { name: 'Ada', firm: '气候投资联盟', style: '关注技术' },
      ],
    },
  ];

  // ===== 体验阶段定义 =====
  // 就业：4 步（自荐 → 面试 → 入职 → 任务）
  // 创业：5 步（市场 → 产品 → 团队 → 融资 → 应对）
  var STAGES = {
    job: [
      { key: 'intro', name: '自我介绍', icon: 'user' },
      { key: 'interview', name: 'AI 面试', icon: 'message-circle' },
      { key: 'onboard', name: '入职日', icon: 'door-open' },
      { key: 'task', name: '工作挑战', icon: 'target' },
    ],
    startup: [
      { key: 'market', name: '市场调研', icon: 'search' },
      { key: 'product', name: '产品定位', icon: 'package' },
      { key: 'team', name: '团队组建', icon: 'users' },
      { key: 'funding', name: '融资谈判', icon: 'handshake' },
      { key: 'crisis', name: '应对挑战', icon: 'shield-alert' },
    ],
  };

  // ===== 通用面试问题模板（HR + 直属上级）=====
  function buildInterviewQuestions(job, ageMode) {
    var isYoung = ageMode === '6-10';
    var intros = {
      '6-10': '小朋友，你为什么想当' + job.name + '呀？',
      '11-15': '先做个自我介绍吧，重点说说为什么对这个方向感兴趣。',
      '16-18': '请在 60 秒内完成自我介绍，并说明你选择 ' + job.name + ' 方向的核心动机。',
    };
    var scenes = {
      '6-10': '假如你今天第一天上班，你会做什么？',
      '11-15': '想象一个真实的工作场景：你刚接到一个紧急任务，但时间不够，你会怎么办？',
      '16-18': job.industry + ' 行业里，你认为 ' + job.name + ' 面临的最大挑战是什么？',
    };
    var skillQs = {
      '6-10': '你最擅长 ' + job.skills[0] + ' 吗？能举个例子吗？',
      '11-15': '在 ' + job.skills.join('、') + ' 这几项能力中，你认为自己的强项和短板分别是什么？',
      '16-18': '结合 ' + job.industry + ' 行业现状，请举例说明你会如何运用 ' + job.skills[0] + ' 解决一个具体业务问题。',
    };
    var stressQs = {
      '6-10': '如果遇到不开心的事，你会怎么处理？',
      '11-15': '和同事意见不一致时，你通常怎么处理？',
      '16-18': '如果你的方案被上级否决，但你坚信自己是对的，你会怎么做？',
    };
    return [
      { from: 'hr', text: intros[ageMode] },
      { from: 'hr', text: skillQs[ageMode] },
      { from: 'manager', text: scenes[ageMode] },
      { from: 'manager', text: stressQs[ageMode] },
    ];
  }

  // ===== AI 回复生成器（基于关键词 + 长度 + 阶段）=====
  function generateReply(userInput, role, ageMode) {
    var input = (userInput || '').trim();
    if (!input) {
      return role === 'hr'
        ? '要不你试着把想法组织成两三句话，再告诉我一次？'
        : '具体说说看？我想听你的真实想法。';
    }
    var len = input.length;
    var lower = input.toLowerCase();

    // 关键词反应
    var posKeywords = ['喜欢', '热爱', '兴趣', '好奇', '想', '希望', '梦想', '成长'];
    var negKeywords = ['不知道', '不清楚', '不会', '没想', '随便', '无所谓'];
    var logicalKeywords = ['因为', '所以', '首先', '其次', '然后', '最后', '比如', '举例'];

    if (negKeywords.some(function (k) { return input.indexOf(k) >= 0; })) {
      return '你的回答让我感觉到你还没完全想清楚。其实没有标准答案，说出你的真实想法就好——这一次，能再具体一些吗？';
    }
    if (posKeywords.some(function (k) { return input.indexOf(k) >= 0; })) {
      return '我感受到了你的热情。这种内在动力在这个行业很重要——那你能说说，要把这个兴趣变成职业，你打算怎么做？';
    }
    if (logicalKeywords.some(function (k) { return input.indexOf(k) >= 0; }) || len > 40) {
      return '这个回答有条理。你提到的逻辑值得展开——那如果资源只够你做一件事，你会优先选哪个？';
    }
    if (len < 8) {
      return '能再多说两句吗？我想了解更多你的想法。';
    }
    return '嗯，明白了。那接下来问个具体的——' + (
      ageMode === '6-10'
        ? '如果给你一个超能力帮你完成工作，你希望是什么？'
        : '假设团队里有人不配合你，你会怎么处理？'
    );
  }

  // ===== 任务生成器 =====
  function buildJobTasks(job, ageMode) {
    var easyTasks = [
      {
        title: '市场调研',
        desc: '了解 3 个竞品的特点，写出它们的优缺点',
        options: ageMode === '6-10' ? [
          { label: '看图说话，描述最喜欢的功能', score: 10 },
          { label: '让爸爸妈妈陪我一起看', score: 8 },
          { label: '上网搜资料', score: 12 },
        ] : [
          { label: '系统性对比，输出表格', score: 15 },
          { label: '深度体验 1 个产品写报告', score: 12 },
          { label: '采访 3 个真实用户', score: 18 },
        ],
      },
      {
        title: '协作沟通',
        desc: '和一位同事讨论一个方案，需要达成一致',
        options: ageMode === '6-10' ? [
          { label: '先听对方说完', score: 10 },
          { label: '说出我的想法', score: 10 },
          { label: '一起想新办法', score: 15 },
        ] : [
          { label: '坚持自己的方案', score: 5 },
          { label: '倾听后寻找共识', score: 15 },
          { label: '整合双方方案产出新版本', score: 20 },
        ],
      },
      {
        title: '应急处理',
        desc: '客户突然来电，需求紧急且超出原计划',
        options: ageMode === '6-10' ? [
          { label: '先告诉老师', score: 10 },
          { label: '先安抚对方', score: 12 },
          { label: '问清楚再回复', score: 14 },
        ] : [
          { label: '立刻答应并承诺时间', score: 5 },
          { label: '先评估再给出方案', score: 18 },
          { label: '拒绝并说明原因', score: 10 },
        ],
      },
    ];
    return easyTasks;
  }

  // ===== 创业阶段：决策卡 =====
  function buildStartupStages(startup, ageMode) {
    return [
      {
        key: 'market',
        title: '市场调研',
        scene: 'AI 为你生成了 ' + startup.market + ' 的市场报告。',
        data: {
          tam: Math.floor(Math.random() * 500) + 300 + ' 亿',
          growth: (Math.random() * 20 + 8).toFixed(1) + '%',
          competitors: Math.floor(Math.random() * 30) + 20,
        },
        question: '基于这些数据，你认为产品应该主打哪个卖点？',
        options: [
          { label: '低价普惠，扩大用户面', score: { users: 1.2, fund: -0.8 } },
          { label: '高端品质，提高客单价', score: { users: 0.7, fund: 1.5 } },
          { label: '聚焦细分人群，做深做精', score: { users: 0.9, fund: 1.1 } },
        ],
      },
      {
        key: 'product',
        title: '产品定位',
        scene: '定义 MVP（最小可行产品）的核心功能。',
        question: '你的 MVP 应该优先包含哪些能力？',
        options: [
          { label: '核心功能 1 个，深度打磨', score: { users: 1.0, fund: 1.2 } },
          { label: '3 个核心功能，快速验证', score: { users: 1.3, fund: 0.8 } },
          { label: '完整产品，覆盖全场景', score: { users: 0.8, fund: 0.5 } },
        ],
      },
      {
        key: 'team',
        title: '团队组建',
        scene: '你找到了 3 位候选人，需要选 2 位加入创始团队。',
        question: '你会优先选择哪两位？',
        options: [
          { label: '技术大牛 + 销售老兵', score: { users: 1.1, fund: 1.0 } },
          { label: '产品经理 + 设计师', score: { users: 1.3, fund: 0.9 } },
          { label: '连续创业者 + 行业专家', score: { users: 0.9, fund: 1.4 } },
        ],
      },
      {
        key: 'funding',
        title: '融资谈判',
        scene: '投资人 ' + startup.investors[0].name + '（' + startup.investors[0].firm + '）正在听你的路演。',
        question: 'TA 关注 ' + startup.investors[0].style + '。你的开场重点是？',
        options: [
          { label: '讲市场规模和增长', score: { users: 1.2, fund: 1.0 } },
          { label: '讲团队和执行力', score: { users: 0.8, fund: 1.3 } },
          { label: '讲技术壁垒和差异化', score: { users: 0.9, fund: 1.2 } },
        ],
      },
      {
        key: 'crisis',
        title: '应对挑战',
        scene: '⚠️ 突发：核心供应商涨价 30%，你的现金流只剩 2 个月。',
        question: '你的第一反应是？',
        options: [
          { label: '紧急寻找替代供应商', score: { users: 1.0, fund: 1.1 } },
          { label: '调价转嫁成本', score: { users: 0.7, fund: 1.4 } },
          { label: '压缩运营成本 + 加速融资', score: { users: 0.9, fund: 1.2 } },
        ],
      },
    ];
  }

  // ===== localStorage 持久化 =====
  var STORAGE_KEY = 'life_preview_archive_v1';

  function loadArchive() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultArchive();
      var data = JSON.parse(raw);
      if (!data || !data.sessions) return defaultArchive();
      return data;
    } catch (e) {
      return defaultArchive();
    }
  }

  function defaultArchive() {
    return {
      ageMode: '11-15',
      totalXP: 0,
      sessions: [],
    };
  }

  function saveArchive(archive) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(archive));
    } catch (e) {
      console.warn('保存失败', e);
    }
  }

  function recordSession(archive, session) {
    archive.sessions = archive.sessions || [];
    archive.sessions.unshift(session);
    if (archive.sessions.length > 50) archive.sessions = archive.sessions.slice(0, 50);
    archive.totalXP = (archive.totalXP || 0) + (session.xp || 0);
    saveArchive(archive);
    return archive;
  }

  function clearArchive() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    return defaultArchive();
  }

  // ===== 工具 =====
  function getQueryParam(key) {
    var s = window.location.search.substring(1);
    var parts = s.split('&');
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].split('=');
      if (decodeURIComponent(kv[0]) === key) return decodeURIComponent(kv[1] || '');
    }
    return '';
  }

  function findById(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function formatTime(ms) {
    var sec = Math.floor(ms / 1000);
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + '分' + s + '秒';
  }

  // 暴露 API
  global.LP = {
    AGE_MODES: AGE_MODES,
    JOBS: JOBS,
    STARTUPS: STARTUPS,
    STAGES: STAGES,
    buildInterviewQuestions: buildInterviewQuestions,
    buildJobTasks: buildJobTasks,
    buildStartupStages: buildStartupStages,
    generateReply: generateReply,
    loadArchive: loadArchive,
    recordSession: recordSession,
    clearArchive: clearArchive,
    getQueryParam: getQueryParam,
    findById: findById,
    formatTime: formatTime,
  };
})(window);
