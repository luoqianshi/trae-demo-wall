window.currentPage = 'home';
window.currentCardIndex = 0;
window.currentCategoryIndex = 0;

window.pageIntroConfig = {
  home: {
    name: '首页',
    description: '学习数据仪表盘，一目了然的学习进度展示。5大入口清晰导航，快速开始学习。',
    highlights: [
      { icon: '📊', title: '数据可视化', desc: '已学汉字、连续天数、总字数一目了然' },
      { icon: '🎯', title: '四大入口', desc: '认字卡片、课本绘本、拼音练习、趣味练习' },
      { icon: '🔥', title: '连续学习', desc: '火焰徽章激励，培养学习习惯' }
    ]
  },
  category: {
    name: '识字分类',
    description: '27个主题分类，系统化学习1343个常用汉字。每个分类都有进度追踪。',
    highlights: [
      { icon: '🌿', title: '主题分类', desc: '自然、身体、数字、家人、动物、食物...' },
      { icon: '📈', title: '进度追踪', desc: '每个分类实时显示学习进度条' },
      { icon: '🧠', title: '关联记忆', desc: '同类汉字一起学，记忆更牢固' }
    ]
  },
  grid: {
    name: '卡片网格',
    description: '3列网格展示汉字卡片，直观查看学习状态，点击进入详情学习。',
    highlights: [
      { icon: '🔤', title: '网格展示', desc: '3列网格，一目了然' },
      { icon: '🟢', title: '状态标记', desc: '已学/错题/已掌握 三色标记' },
      { icon: '👆', title: '点击学习', desc: '点击卡片进入详情学习' }
    ]
  },
  detail: {
    name: '卡片详情',
    description: '田字格大字展示，标准发音+拼读练习，组词造句全方位学习。',
    highlights: [
      { icon: '📝', title: '田字格', desc: '标准田字格展示汉字' },
      { icon: '🔊', title: '双音频', desc: '标准读音 + 拼读练习' },
      { icon: '📚', title: '组词造句', desc: '近义词、反义词、例句全掌握' }
    ]
  },
  exercise: {
    name: '练习中心',
    description: '多种练习模式，今日目标激励，学习模式筛选，针对性巩固记忆。',
    highlights: [
      { icon: '🎯', title: '今日目标', desc: '每日学习目标，进度清晰' },
      { icon: '🔄', title: '模式筛选', desc: '全部/未学/错题/已掌握' },
      { icon: '📊', title: '进度统计', desc: '错题、掌握率实时展示' }
    ]
  },
  quiz: {
    name: '答题练习',
    description: '看拼音选汉字，即时反馈，5题一组，轻松检验学习成果。',
    highlights: [
      { icon: '🔤', title: '拼音识字', desc: '看拼音选对应汉字' },
      { icon: '✅', title: '即时反馈', desc: '答对答错立刻知道' },
      { icon: '🏆', title: '结果统计', desc: '正确率、成绩一目了然' }
    ]
  },
  pinyin: {
    name: '拼音学习',
    description: '声母、韵母、整体认读音节，系统学习拼音基础知识。',
    highlights: [
      { icon: '🅰️', title: '完整拼音表', desc: '声母、单韵母、复韵母、鼻韵母' },
      { icon: '🔊', title: '发音学习', desc: '点击即可听发音' },
      { icon: '📖', title: '循序渐进', desc: '从基础到复杂系统学习' }
    ]
  },
  storybook: {
    name: '课本绘本',
    description: '26本分级绘本，从简单到困难，在故事阅读中巩固识字。',
    highlights: [
      { icon: '📕', title: '分级绘本', desc: 'L1-L3难度分级' },
      { icon: '📚', title: '年级同步', desc: '一到三年级课本同步' },
      { icon: '🔊', title: '点读功能', desc: '点字发音，边读边学' }
    ]
  },
  progress: {
    name: '学习进度',
    description: '全方位学习数据统计，看图/听音/句子/拼音分项统计。',
    highlights: [
      { icon: '📊', title: '综合统计', desc: '总学习字数、连续天数' },
      { icon: '📈', title: '分项统计', desc: '看图/听音/句子/拼音' },
      { icon: '🎯', title: '行动入口', desc: '错题本、收藏夹、学习日历' }
    ]
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
    if (typeof window.StorybookPage === 'function') {
      window.StorybookPage(container);
    }
  },
  progress: function() {
    const container = document.getElementById('appContainer');
    if (!container) return;
    if (typeof window.ProgressPage === 'function') {
      window.ProgressPage(container);
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

  window.pageRenderers[pageName]();

  updateRightPanel(pageName);

  window.dispatchEvent(new CustomEvent('pageChanged', { detail: { page: pageName } }));
};

window.switchTab = function(tabName) {
  const pageMap = {
    home: 'home',
    cards: 'category',
    exercise: 'exercise',
    profile: 'progress'
  };
  const targetPage = pageMap[tabName] || tabName;
  navigateTo(targetPage);
};

window.updateRightPanel = function(pageName) {
  const config = window.pageIntroConfig[pageName];
  if (!config) return;

  const pageIntro = document.getElementById('pageIntro');
  if (pageIntro) {
    pageIntro.innerHTML = `
      <h3 class="page-name">${config.name}</h3>
      <p class="page-desc">${config.description}</p>
    `;
  }

  const highlightsPanel = document.getElementById('highlightsPanel');
  if (highlightsPanel && config.highlights) {
    highlightsPanel.innerHTML = config.highlights.map(h => `
      <div class="highlight-card">
        <div class="highlight-card-icon">${h.icon}</div>
        <div>
          <div class="highlight-card-title">${h.title}</div>
          <div class="highlight-card-desc">${h.desc}</div>
        </div>
      </div>
    `).join('');
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
    progress: 'profile'
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
});
