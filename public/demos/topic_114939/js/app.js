window.currentPage = 'home';
window.currentCardIndex = 0;
window.currentCategoryIndex = 0;

window.escapeHtml = function(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
};

window.VoiceToken = {
  _cache: null,
  _promise: null,
  _tokenUrl: 'https://voice.yixian.fun/api/get-token',
  get: function() {
    const self = this;
    const now = Math.floor(Date.now() / 1000);
    if (self._cache && self._cache.expireAt > now + 30) {
      return Promise.resolve(self._cache.token);
    }
    if (self._promise) {
      return self._promise;
    }
    self._promise = fetch(self._tokenUrl)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        self._promise = null;
        if (data && data.code === 0 && data.token) {
          self._cache = {
            token: data.token,
            expireAt: data.expire_at || (now + 240)
          };
          return data.token;
        }
        return '';
      })
      .catch(function() {
        self._promise = null;
        return '';
      });
    return self._promise;
  }
};

window.pageIntroConfig = {
  home: {
    name: '首页',
    description: '学习数据仪表盘，一目了然的学习进度展示。5大入口清晰导航，快速开始学习。',
    designStory: '首页采用数据可视化设计，让用户一眼看到自己的学习成果。连续学习火焰徽章激励用户养成学习习惯。四大入口卡片设计，降低操作门槛，适合认知水平较低的用户。',
    userScenario: '老王每天早上打开首页，看到已学128个字、连续7天学习的记录，感到很有成就感，点击"认字卡片"开始今天的学习。',
    techImplementation: '使用本地存储记录学习数据，页面加载时实时计算统计信息，无需后端API。',
    comparison: '传统识字App首页信息杂乱，本产品精简核心数据，突出学习成果，给用户正向激励。',
    highlights: [
      { icon: '📊', title: '数据可视化', desc: '已学汉字、连续天数、总字数一目了然' },
      { icon: '🎯', title: '四大入口', desc: '认字卡片、课本绘本、拼音练习、趣味练习' },
      { icon: '🔥', title: '连续学习', desc: '火焰徽章激励，培养学习习惯' }
    ],
    userStoryKey: 'xiaozhou'
  },
  category: {
    name: '识字分类',
    description: '27个主题分类，系统化学习1343个常用汉字。每个分类都有进度追踪。',
    designStory: '按主题分类学习，符合认知规律。同类汉字一起学，记忆更牢固。每个分类显示进度条，让用户清楚知道自己学到哪里。',
    userScenario: '小周想学习日常生活相关的汉字，点击"日常食物"分类，看到进度35%，开始学习未学的汉字。',
    techImplementation: '分类数据从JSON加载，进度数据存储在本地，切换分类时实时计算显示。',
    comparison: '传统识字工具按拼音排序，不符合用户认知习惯。本产品按主题分类，更贴近生活场景。',
    highlights: [
      { icon: '🌿', title: '主题分类', desc: '自然、身体、数字、家人、动物、食物...' },
      { icon: '📈', title: '进度追踪', desc: '每个分类实时显示学习进度条' },
      { icon: '🧠', title: '关联记忆', desc: '同类汉字一起学，记忆更牢固' }
    ],
    userStoryKey: 'xiaozhou'
  },
  grid: {
    name: '卡片网格',
    description: '3列网格展示汉字卡片，直观查看学习状态，点击进入详情学习。',
    designStory: '网格布局清晰展示每个汉字的学习状态，三色标记（未学/已学/已掌握）让用户一目了然。大卡片设计适合触控操作。',
    userScenario: '李姐浏览卡片网格，看到"山"字是未学状态，点击进入详情页开始学习。',
    techImplementation: '动态生成卡片DOM，根据学习状态添加不同样式类。',
    comparison: '传统App文字密集，本产品大卡片布局，视觉清晰，操作方便。',
    highlights: [
      { icon: '🔤', title: '网格展示', desc: '3列网格，一目了然' },
      { icon: '🟢', title: '状态标记', desc: '已学/错题/已掌握 三色标记' },
      { icon: '👆', title: '点击学习', desc: '点击卡片进入详情学习' }
    ],
    userStoryKey: 'xiaozhou'
  },
  detail: {
    name: '卡片详情',
    description: '田字格大字展示，标准发音+拼读练习，组词造句全方位学习。',
    designStory: '田字格大字展示帮助用户建立字形认知，标准发音帮助纠正读音，组词和例句帮助理解字义和用法。这是为听障人士设计的核心学习场景。',
    userScenario: '小周学习"山"字，看到田字格中的字形，点击喇叭听发音，学习组词"高山""山水"，阅读例句加深理解。',
    techImplementation: '调用腾讯云COS真实音频资源，支持拼音发音和汉字拼读，语速可调至0.7倍适合听障人士。',
    comparison: '传统识字工具发音太快，不适合听障人士。本产品发音清晰，语速放慢，支持反复播放。',
    highlights: [
      { icon: '📝', title: '田字格', desc: '标准田字格展示汉字' },
      { icon: '🔊', title: '双音频', desc: '标准读音 + 拼读练习' },
      { icon: '📚', title: '组词造句', desc: '近义词、反义词、例句全掌握' }
    ],
    userStoryKey: 'xiaozhou'
  },
  exercise: {
    name: '练习中心',
    description: '多种练习模式，今日目标激励，学习模式筛选，针对性巩固记忆。',
    designStory: '多种练习模式满足不同学习需求，今日目标给用户明确的学习方向，模式筛选让用户可以针对性练习错题。',
    userScenario: '李姐看到今日目标完成了60%，点击"看图选字"开始练习，巩固今天学的汉字。',
    techImplementation: '根据用户学习状态动态生成练习题，错题自动收集。',
    comparison: '传统App练习模式单一，本产品提供看图选字、听音选字、句子练习等多种模式。',
    highlights: [
      { icon: '🎯', title: '今日目标', desc: '每日学习目标，进度清晰' },
      { icon: '🔄', title: '模式筛选', desc: '全部/未学/错题/已掌握' },
      { icon: '📊', title: '进度统计', desc: '错题、掌握率实时展示' }
    ],
    userStoryKey: 'xiaozhou'
  },
  quiz: {
    name: '答题练习',
    description: '看拼音选汉字，即时反馈，5题一组，轻松检验学习成果。',
    designStory: '看拼音选汉字的练习方式，帮助用户建立拼音与汉字的对应关系。即时反馈让用户立刻知道对错，增强学习效果。',
    userScenario: '小周做完5题练习，答对4题，正确率80%，系统鼓励他继续加油。',
    techImplementation: '随机生成题目，选项打乱顺序，答题后即时显示正确答案和反馈。',
    comparison: '传统App反馈延迟，本产品即时反馈，答对有庆祝动画，答错温柔提示。',
    highlights: [
      { icon: '🔤', title: '拼音识字', desc: '看拼音选对应汉字' },
      { icon: '✅', title: '即时反馈', desc: '答对答错立刻知道' },
      { icon: '🏆', title: '结果统计', desc: '正确率、成绩一目了然' }
    ],
    userStoryKey: 'xiaozhou'
  },
  pinyin: {
    name: '拼音学习',
    description: '声母、韵母、整体认读音节，系统学习拼音基础知识。',
    designStory: '完整的拼音表，点击即可听发音，帮助用户打好拼音基础。拼音是识字的关键，尤其对听障人士来说，学好拼音能帮助他们更好地理解发音。',
    userScenario: '老王学习拼音"b"，点击卡片听发音，看口型示意图，反复练习直到掌握。',
    techImplementation: '调用腾讯云TTS生成的标准拼音发音，支持23个声母、35个韵母。',
    comparison: '传统拼音学习工具界面复杂，本产品简洁清晰，专注发音学习。',
    highlights: [
      { icon: '🅰️', title: '完整拼音表', desc: '声母、单韵母、复韵母、鼻韵母' },
      { icon: '🔊', title: '发音学习', desc: '点击即可听发音' },
      { icon: '📖', title: '循序渐进', desc: '从基础到复杂系统学习' }
    ],
    userStoryKey: 'xiaozhou'
  },
  storybook: {
    name: '课本绘本',
    description: '26本分级绘本，从简单到困难，在故事阅读中巩固识字。',
    designStory: '分级绘本设计，从L1到L3难度递增，适合不同识字水平的用户。点读功能让用户可以边读边听，加深理解。',
    userScenario: '小周选择L1难度的"小猫钓鱼"绘本，逐页阅读，点击文字听发音。',
    techImplementation: '绘本数据包含每页内容和对应的音频映射，点读时播放对应文字发音。',
    comparison: '传统绘本阅读工具没有点读功能，本产品支持点字发音，边读边学。',
    highlights: [
      { icon: '📕', title: '分级绘本', desc: 'L1-L3难度分级' },
      { icon: '📚', title: '年级同步', desc: '一到三年级课本同步' },
      { icon: '🔊', title: '点读功能', desc: '点字发音，边读边学' }
    ],
    userStoryKey: 'xiaozhou'
  },
  progress: {
    name: '学习进度',
    description: '全方位学习数据统计，看图/听音/句子/拼音分项统计。',
    designStory: '多维度学习数据统计，让用户看到自己的进步。成就徽章系统激励用户持续学习。',
    userScenario: '李姐查看学习进度，看到总学习字数128，连续7天，各项练习的正确率都在提升。',
    techImplementation: '本地存储记录所有学习数据，定期计算统计信息。',
    comparison: '传统App进度展示单一，本产品多维度统计，让用户全面了解自己的学习情况。',
    highlights: [
      { icon: '📊', title: '综合统计', desc: '总学习字数、连续天数' },
      { icon: '📈', title: '分项统计', desc: '看图/听音/句子/拼音' },
      { icon: '🎯', title: '行动入口', desc: '收藏夹、学习日历、设置' }
    ],
    userStoryKey: 'xiaozhou'
  },
  store: {
    name: '识字商店',
    description: '积分兑换学习道具与主题皮肤，把学习行为转化为可见奖励，营造游戏化成就感。',
    designStory: '商店用积分体系把"坚持学习"变成可兑换的奖励，提升留存与粘性。勋章、皮肤等虚拟物品满足用户的情感与成就感需求。',
    userScenario: '小周连续学习 7 天攒够积分，在商店兑换了"自然主题皮肤"，学习界面焕然一新，更有动力继续打卡。',
    techImplementation: '积分余额与兑换状态存储于本地（localStorage / GameSystem.state），兑换后即时更新 UI，无需后端接口。',
    comparison: '传统教育产品缺乏激励闭环，本产品用游戏化商店把"学"和"得"绑定，显著提升用户留存。',
    highlights: [
      { icon: '🏆', title: '积分体系', desc: '学习赚积分，越学越有动力' },
      { icon: '🎨', title: '主题皮肤', desc: '兑换专属学习界面皮肤' },
      { icon: '🎁', title: '道具奖励', desc: '红心恢复、XP 翻倍等道具' }
    ],
    userStoryKey: 'xiaozhou'
  },
  lesson: {
    name: '课程学习',
    description: '多邻国风格学习地图，10个主题课程，闯关式学习，每完成一节获得XP和识字币奖励。',
    designStory: '学习地图设计让用户清晰看到自己的学习路径和进度，闯关式设计增加成就感和期待感。每个课程完成后获得奖励，激励用户继续学习。',
    userScenario: '小周从首页点击"认识数字"课程，开始逐字学习"一、二、三"，每学完一个字获得XP奖励，完成课程后解锁下一关卡。',
    techImplementation: '课程数据配置在JSON中，学习进度存储于本地，完成课程后自动解锁下一关卡。',
    comparison: '传统识字工具没有课程体系，用户不知道学什么。本产品提供清晰的学习路径，让用户循序渐进学习。',
    highlights: [
      { icon: '🗺️', title: '学习地图', desc: '10个主题课程，一目了然的学习路径' },
      { icon: '🎮', title: '闯关模式', desc: '逐字学习，完成获得奖励' },
      { icon: '🔓', title: '关卡解锁', desc: '完成前置课程解锁新关卡' }
    ],
    userStoryKey: 'xiaozhou'
  },
  speak: {
    name: '语音练习',
    description: '多邻国风格口语练习，录制发音与标准发音对比，AI评分即时反馈，帮助纠正发音。',
    designStory: '仿照多邻国的语音练习模式，用户录制自己的发音，系统给出评分和反馈。大按钮设计适合老年用户，慢速播放方便听障人士学习。',
    userScenario: '老王点击语音练习，看到"山"字，先听标准发音，然后点击麦克风录制自己的发音，系统评分85分，鼓励他继续加油。',
    techImplementation: '使用MediaRecorder API录制音频，Web Audio API实现波形可视化，模拟评分算法给出合理分数。',
    comparison: '传统识字工具只有被动听发音，本产品支持主动发音练习和评分反馈，让学习更有互动性和成就感。',
    highlights: [
      { icon: '🎤', title: '语音录制', desc: '点击麦克风录制自己的发音' },
      { icon: '📊', title: 'AI评分', desc: '即时评分反馈，帮助纠正发音' },
      { icon: '📈', title: '波形显示', desc: '实时波形可视化，直观看到声音' }
    ],
    userStoryKey: 'xiaozhou'
  }
};

// 页面 → 应显示的右侧面板 key 数组（与 index.html 的 data-panel 值一一对应）
window.PAGE_PANEL_MAP = {
  home:      ['completion', 'narration', 'panelIntro', 'highlights', 'userStory', 'socialValue', 'future', 'tech', 'miniProgram'],
  category:  ['narration', 'panelIntro', 'highlights', 'userStory'],
  grid:      ['narration', 'panelIntro', 'highlights', 'userStory'],
  detail:    ['narration', 'panelIntro', 'highlights', 'userStory'],
  exercise:  ['narration', 'panelIntro', 'highlights', 'userStory'],
  quiz:      ['narration', 'panelIntro', 'highlights', 'userStory'],
  pinyin:    ['narration', 'panelIntro', 'highlights', 'userStory'],
  storybook: ['narration', 'panelIntro', 'highlights', 'userStory'],
  store:     ['narration', 'panelIntro', 'highlights', 'miniProgram'],
  progress:  ['narration', 'panelIntro', 'highlights', 'userStory'],
  lesson:    ['narration', 'panelIntro', 'highlights', 'userStory'],
  speak:     ['narration', 'panelIntro', 'highlights', 'userStory']
};

window.userStories = {
  xiaozhou: {
    avatar: '👦',
    name: '小周，听障人士',
    text: '"我从小听不见，装了人工耳蜗。市面上的识字软件都是给正常孩子做的，没有为听障人士设计的。这个软件填补了空白，声音慢，我终于能好好学认字了。"',
    highlight: '专为听障人士设计，填补市场空白'
  }
};

window.pageRenderers = {
  home: function() {
    const container = document.getElementById('appContainer');
    if (!container) return;
    if (typeof window.HomePage === 'function') {
      window.HomePage(container);
    }
  },
  lesson: function(options) {
    const container = document.getElementById('appContainer');
    if (!container) return;
    if (typeof window.LessonPage === 'function') {
      const lessonId = options && typeof options === 'object' ? options.lessonId : options;
      window.LessonPage(container, lessonId);
    }
  },
  store: function() {
    const container = document.getElementById('appContainer');
    if (!container) return;
    if (typeof window.StorePage === 'function') {
      window.StorePage(container);
    }
  },
  category: function() {
    const container = document.getElementById('appContainer');
    if (!container) return;
    if (typeof window.CategoryPage === 'function') {
      window.CategoryPage(container);
    }
  },
  grid: function() {
    const container = document.getElementById('appContainer');
    if (!container) return;
    if (typeof window.GridPage === 'function') {
      window.GridPage(container, window.currentCategoryIndex);
    }
  },
  detail: function() {
    const container = document.getElementById('appContainer');
    if (!container) return;
    if (typeof window.DetailPage === 'function') {
      window.DetailPage(container, window.currentCardIndex);
    }
  },
  exercise: function() {
    const container = document.getElementById('appContainer');
    if (!container) return;
    if (typeof window.ExercisePage === 'function') {
      window.ExercisePage(container);
    }
  },
  quiz: function() {
    const container = document.getElementById('appContainer');
    if (!container) return;
    if (typeof window.QuizPage === 'function') {
      window.QuizPage(container);
    }
  },
  pinyin: function() {
    const container = document.getElementById('appContainer');
    if (!container) return;
    if (typeof window.PinyinPage === 'function') {
      window.PinyinPage(container);
    }
  },
  storybook: function() {
    const container = document.getElementById('appContainer');
    if (!container) return;
    if (typeof window.StorybookPage !== 'function') return;
    if (window.DemoData && window.DemoData.storybooks && window.DemoData.storybooks.length > 0) {
      window.StorybookPage(container);
      return;
    }
    container.innerHTML = '<div style="text-align:center;padding:80px 20px;color:#999;">加载绘本数据中...</div>';
    fetch('assets/data/storybooks.json')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(books => {
        if (!window.DemoData) window.DemoData = {};
        window.DemoData.storybooks = books;
        if (typeof window.StorybookPage === 'function') {
          window.StorybookPage(container);
        }
      })
      .catch(err => {
        container.innerHTML = '<div style="text-align:center;padding:80px 20px;color:#ef4444;">绘本数据加载失败 (' + err + ')，请确认 demo 通过 server.js 启动</div>';
      });
  },
  progress: function() {
    const container = document.getElementById('appContainer');
    if (!container) return;
    if (typeof window.ProgressPage === 'function') {
      window.ProgressPage(container);
    }
  },
  speak: function() {
    const container = document.getElementById('appContainer');
    if (!container) return;
    if (typeof window.SpeakPage === 'function') {
      window.SpeakPage(container);
    }
  }
};

window.navigateTo = function(pageName, options) {
  if (!window.pageRenderers[pageName]) {
    console.warn('Page not found:', pageName);
    return;
  }

  if (options && typeof options.cardIndex === 'number') {
    window.currentCardIndex = options.cardIndex;
  }
  if (options && typeof options.categoryIndex === 'number') {
    window.currentCategoryIndex = options.categoryIndex;
  }

  window.currentPage = pageName;

  updateNavActive(pageName);
  updateTabbarActive(pageName);

  const appContainer = document.getElementById('appContainer');
  if (appContainer) {
    appContainer.classList.remove('page-transition');
    void appContainer.offsetWidth;
    appContainer.classList.add('page-transition');
  }

  window.pageRenderers[pageName](options);
  updateRightPanel(pageName);

  window.dispatchEvent(new CustomEvent('pageChanged', { detail: { page: pageName } }));
};

window.navigateToChar = function(char) {
  const data = window.DemoData;
  if (!data || !data.cards) {
    navigateTo('detail');
    return;
  }

  let cardIndex = -1;
  let categoryIndex = -1;

  for (let i = 0; i < data.cards.length; i++) {
    if (data.cards[i].char === char) {
      cardIndex = i;
      const catId = data.cards[i].categoryId;
      for (let j = 0; j < data.categories.length; j++) {
        if (data.categories[j].id === catId) {
          categoryIndex = j;
          break;
        }
      }
      break;
    }
  }

  if (cardIndex >= 0) {
    window.currentCardIndex = cardIndex;
    window.currentCategoryIndex = categoryIndex >= 0 ? categoryIndex : 0;
    navigateTo('detail');
  } else {
    navigateTo('detail');
  }
};

window.switchTab = function(tabName) {
  const pageMap = {
    home: 'home',
    cards: 'category',
    exercise: 'exercise',
    speak: 'speak',
    profile: 'progress'
  };
  const targetPage = pageMap[tabName] || tabName;
  navigateTo(targetPage);
};

window.updateRightPanel = function(pageName) {
  const config = window.pageIntroConfig[pageName];
  const map = window.PAGE_PANEL_MAP ? window.PAGE_PANEL_MAP[pageName] : null;

  // store 现已补条目，缺 config 或 map 才退出（不再无脑 return 导致右侧错乱）
  if (!config || !map) {
    console.warn('updateRightPanel: missing config/map for', pageName);
    return;
  }

  // ① 按 PAGE_PANEL_MAP 显隐 8 个面板
  const ALL_KEYS = ['completion', 'narration', 'panelIntro', 'highlights', 'userStory', 'socialValue', 'future', 'tech', 'miniProgram'];
  ALL_KEYS.forEach(function(key) {
    const el = document.querySelector('[data-panel="' + key + '"]');
    if (el) {
      el.style.display = map.indexOf(key) !== -1 ? '' : 'none';
    }
  });

  // home 用两列网格，其余单列堆叠
  const sidebar = document.querySelector('.right-sidebar');
  if (sidebar) {
    sidebar.classList.toggle('home-grid', pageName === 'home');
  }

  // ② 渲染 ③ 当前页面（含 💡用户场景 / 🔧技术实现 / ⚖️对比优势 3 张小卡）
  const pageIntro = document.getElementById('pageIntro');
  if (pageIntro) {
    const esc = window.escapeHtml;
    pageIntro.innerHTML = `
      <h3 class="page-name">${esc(config.name)}</h3>
      <p class="page-desc">${esc(config.description)}</p>
      ${config.designStory ? `<div class="page-design-story">💡 ${esc(config.designStory)}</div>` : ''}
      <div class="intro-mini-cards">
        <div class="intro-mini-card"><div class="intro-mini-icon">💡</div><div class="intro-mini-body"><div class="intro-mini-title">用户场景</div><div class="intro-mini-text">${esc(config.userScenario || '')}</div></div></div>
        <div class="intro-mini-card"><div class="intro-mini-icon">🔧</div><div class="intro-mini-body"><div class="intro-mini-title">技术实现</div><div class="intro-mini-text">${esc(config.techImplementation || '')}</div></div></div>
        <div class="intro-mini-card"><div class="intro-mini-icon">⚖️</div><div class="intro-mini-body"><div class="intro-mini-title">对比优势</div><div class="intro-mini-text">${esc(config.comparison || '')}</div></div></div>
      </div>`;
  }

  // ③ 渲染 ④ 设计亮点
  const highlightsPanel = document.getElementById('highlightsPanel');
  if (highlightsPanel && config.highlights) {
    const esc = window.escapeHtml;
    highlightsPanel.innerHTML = config.highlights.map(function(h) {
      return `
      <div class="highlight-card">
        <div class="highlight-card-icon">${esc(h.icon)}</div>
        <div><div class="highlight-card-title">${esc(h.title)}</div><div class="highlight-card-desc">${esc(h.desc)}</div></div>
      </div>`;
    }).join('');
  }

  // ④ 渲染 ⑤ 用户故事（仅当本页显示 ⑤ 且配置存在）
  const userStoryPanel = document.getElementById('userStoryPanel');
  if (userStoryPanel && map.indexOf('userStory') !== -1 && config.userStoryKey && window.userStories[config.userStoryKey]) {
    const esc = window.escapeHtml;
    const story = window.userStories[config.userStoryKey];
    userStoryPanel.innerHTML = `
      <div class="story-card">
        <div class="story-avatar">${esc(story.avatar)}</div>
        <div class="story-info">
          <div class="story-name">${esc(story.name)}</div>
          <div class="story-text">${esc(story.text)}</div>
          <div class="story-highlight">✨ ${esc(story.highlight)}</div>
        </div>
      </div>`;
  }
};

// 技术架构面板折叠（镜像已有的 toggleCompletionPanel）
window.toggleTechPanel = function() {
  const el = document.querySelector('[data-panel="tech"]');
  if (el) {
    el.classList.toggle('collapsed');
  }
};

function updateNavActive(pageName) {
  const navItems = document.querySelectorAll('.nav-menu .nav-item');
  navItems.forEach(item => {
    const page = item.dataset.page;
    if (page === pageName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

function updateTabbarActive(pageName) {
  const tabItems = document.querySelectorAll('.phone-tabbar .tab-item');
  const tabMap = {
    home: 'home',
    category: 'cards',
    grid: 'cards',
    detail: 'cards',
    exercise: 'exercise',
    quiz: 'exercise',
    pinyin: 'exercise',
    storybook: 'cards',
    progress: 'profile',
    speak: 'speak'
  };
  const activeTab = tabMap[pageName] || 'home';

  tabItems.forEach(item => {
    const tab = item.dataset.tab;
    if (tab === activeTab) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  navigateTo('home');
  setTimeout(function() {
    const phoneFrame = document.querySelector('.phone-frame');
    if (phoneFrame) {
      phoneFrame.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 500);
});