const AppState = {
  settings: {
    elderName: '奶奶',
    aiName: '小忆',
    fontSize: 'normal',
    voiceSpeed: 1
  },
  currentPage: 'welcome',
  pageHistory: []
};

const mockData = {
  stories: [
    { id: 1, title: '童年的夏天', content: '记得小时候，每到夏天，院子里的老槐树就会开满白色的花，整个院子都飘着淡淡的清香。我和小伙伴们会在树下乘凉，听爷爷讲过去的故事...', date: '2026-06-15', cover: 'assets/memoir-cover.jpg', duration: '3分20秒' },
    { id: 2, title: '第一次上学', content: '七岁那年，妈妈牵着我的手送我去学校。我背着新书包，心里又紧张又兴奋。校门口有很多小朋友，有的在哭，有的在笑...', date: '2026-06-10', cover: 'assets/photo-sample.jpg', duration: '4分15秒' },
    { id: 3, title: '过年的记忆', content: '小时候最盼望过年了。过年前几天，大人们就开始忙里忙外，蒸馒头、炸丸子、写春联。我们小孩子就在旁边跑来跑去，等着吃好吃的...', date: '2026-06-05', cover: 'assets/memoir-cover.jpg', duration: '5分02秒' },
    { id: 4, title: '工作的第一年', content: '十八岁那年，我离开了家，去城里的工厂上班。第一次领到工资的时候，心里特别激动，给家里买了很多东西...', date: '2026-05-28', cover: 'assets/photo-sample.jpg', duration: '3分48秒' },
    { id: 5, title: '结婚那天', content: '结婚那天天气特别好，来了很多亲戚朋友。我穿着新做的红棉袄，心里既害羞又开心...', date: '2026-05-20', cover: 'assets/memoir-cover.jpg', duration: '4分30秒' },
    { id: 6, title: '孩子出生', content: '当听到孩子第一声啼哭的时候，我流下了眼泪。那一刻，我觉得自己是世界上最幸福的人...', date: '2026-05-15', cover: 'assets/photo-sample.jpg', duration: '3分55秒' },
    { id: 7, title: '搬新家', content: '那年我们搬进了新房子，虽然不大，但是是我们自己的家。我把每个房间都收拾得干干净净...', date: '2026-05-08', cover: 'assets/memoir-cover.jpg', duration: '2分50秒' }
  ],
  photos: [
    { id: 1, url: 'assets/photo-sample.jpg', caption: '全家福', date: '2026-06-01' },
    { id: 2, url: 'assets/hero-welcome.jpg', caption: '老院子', date: '2026-05-20' },
    { id: 3, url: 'assets/memoir-cover.jpg', caption: '年轻时的照片', date: '2026-04-15' },
    { id: 4, url: 'assets/photo-sample.jpg', caption: '和老朋友聚会', date: '2026-03-10' }
  ],
  familyMembers: [
    { id: 1, name: '儿子', relation: '儿子', avatar: null },
    { id: 2, name: '女儿', relation: '女儿', avatar: null },
    { id: 3, name: '孙子', relation: '孙子', avatar: null },
    { id: 4, name: '老伴', relation: '配偶', avatar: null }
  ],
  comments: [
    { id: 1, author: '儿子', content: '妈，您讲的故事太感人了，我听了好几遍。', date: '2026-06-16' },
    { id: 2, author: '女儿', content: '原来您小时候还有这么多趣事呢！', date: '2026-06-12' },
    { id: 3, author: '孙子', content: '奶奶，我最喜欢听您讲故事了！', date: '2026-06-08' },
    { id: 4, author: '儿子', content: '这些回忆太珍贵了，一定要好好保存下来。', date: '2026-06-06' },
    { id: 5, author: '老伴', content: '是啊，时间过得真快啊。', date: '2026-06-01' }
  ]
};

function iconHome() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
}

function iconMic() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
}

function iconBook() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>';
}

function iconUser() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
}

function iconBack() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
}

function iconPlay() {
  return '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
}

function iconPause() {
  return '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
}

function iconArrow() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
}

function iconCamera() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
}

function iconShare() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
}

function iconCheck() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
}

function saveSettings() {
  localStorage.setItem('timeMemoirSettings', JSON.stringify(AppState.settings));
}

function loadSettings() {
  const saved = localStorage.getItem('timeMemoirSettings');
  if (saved) {
    AppState.settings = { ...AppState.settings, ...JSON.parse(saved) };
  }
}

function isFirstVisit() {
  return !localStorage.getItem('timeMemoirInitialized');
}

function setInitialized() {
  localStorage.setItem('timeMemoirInitialized', 'true');
}

function applyFontSize() {
  document.documentElement.classList.remove('font-size-normal', 'font-size-large', 'font-size-xl');
  document.documentElement.classList.add('font-size-' + AppState.settings.fontSize);
}

function setFontSize(size) {
  AppState.settings.fontSize = size;
  applyFontSize();
  saveSettings();
}

function cycleFontSize() {
  const sizes = ['normal', 'large', 'xl'];
  const currentIndex = sizes.indexOf(AppState.settings.fontSize);
  const nextIndex = (currentIndex + 1) % sizes.length;
  setFontSize(sizes[nextIndex]);
}

function showPage(pageId, addToHistory = true) {
  document.querySelectorAll('.page-section').forEach(section => {
    section.classList.remove('page-active');
  });

  const targetPage = document.getElementById('page-' + pageId);
  if (targetPage) {
    targetPage.classList.add('page-active');

    if (addToHistory && AppState.currentPage !== pageId) {
      AppState.pageHistory.push(AppState.currentPage);
    }
    AppState.currentPage = pageId;

    const tabPages = ['home', 'chat', 'stories', 'profile'];
    const activeTab = tabPages.includes(pageId) ? pageId : null;
    renderTabBar(activeTab);
    window.scrollTo(0, 0);
  }
}

function goBack() {
  if (AppState.pageHistory.length > 0) {
    const prevPage = AppState.pageHistory.pop();
    showPage(prevPage, false);
  } else {
    showPage('home', false);
  }
}

function renderTabBar(activeTab) {
  const tabBar = document.getElementById('tab-bar');
  if (!tabBar) return;

  if (['home', 'chat', 'stories', 'profile'].includes(AppState.currentPage)) {
    tabBar.style.display = 'flex';
  } else {
    tabBar.style.display = 'none';
    return;
  }

  const tabs = [
    { id: 'home', label: '首页', icon: iconHome },
    { id: 'chat', label: '聊一聊', icon: iconMic },
    { id: 'stories', label: '故事集', icon: iconBook },
    { id: 'profile', label: '我的', icon: iconUser }
  ];

  tabBar.innerHTML = tabs.map(tab => `
    <button class="tab-item ${activeTab === tab.id ? 'tab-active' : ''}" data-tab="${tab.id}">
      ${tab.icon()}
      <span>${tab.label}</span>
    </button>
  `).join('');

  tabBar.querySelectorAll('.tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      showPage(tab.dataset.tab);
    });
  });
}

function renderStatusBar() {
  const statusBar = document.querySelector('.status-bar');
  if (!statusBar) return;

  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const timeString = `${hours}:${minutes}`;

  statusBar.innerHTML = `
    <div class="status-bar-time">${timeString}</div>
    <div class="status-bar-icons">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
      <svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="7" width="16" height="10" rx="2"/><rect x="18" y="10" width="2" height="4"/><rect x="4" y="9" width="10" height="6" fill="white"/></svg>
    </div>
  `;
}

function initDemoMode() {
  AppState.settings = {
    elderName: '奶奶',
    aiName: '小忆',
    fontSize: 'normal',
    voiceSpeed: 1
  };
  setInitialized();
  saveSettings();
}

function bindWelcomeEvents() {
  const startBtn = document.getElementById('btn-start');
  const skipBtn = document.getElementById('btn-skip');
  const elderNameInput = document.getElementById('input-elder-name');
  const aiNameInput = document.getElementById('input-ai-name');

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (elderNameInput) {
        AppState.settings.elderName = elderNameInput.value || '奶奶';
      }
      if (aiNameInput) {
        AppState.settings.aiName = aiNameInput.value || '小忆';
      }
      saveSettings();
      setInitialized();
      showPage('home');
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      initDemoMode();
      showPage('home');
    });
  }
}

function bindHomeEvents() {
  const fontBtn = document.getElementById('btn-font-size');
  if (fontBtn) {
    fontBtn.addEventListener('click', cycleFontSize);
  }
}

function init() {
  loadSettings();
  applyFontSize();
  renderStatusBar();

  const urlParams = new URLSearchParams(window.location.search);
  const demoMode = urlParams.get('demo') === '1';

  if (demoMode) {
    initDemoMode();
    showPage('home');
  } else if (isFirstVisit()) {
    showPage('welcome');
  } else {
    showPage('home');
  }

  bindWelcomeEvents();
  bindHomeEvents();

  setInterval(renderStatusBar, 60000);
}

document.addEventListener('DOMContentLoaded', init);
