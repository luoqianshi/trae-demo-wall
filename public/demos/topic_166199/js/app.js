// Soloist HTML Demo - 应用主逻辑

// 当前状态
const AppState = {
  currentTab: 'home',
  pageHistory: [],
  selectedDetectionMode: 'comprehensive',
  selectedScore: null,
  currentCoursePhase: 'foundation',
  pitchAnimator: null,
  detectionTimer: null
};

// 页面初始化函数
const PageInit = {
  home: () => {
    renderHome();
  },
  detection: () => {
    renderDetectionCenter();
  },
  course: () => {
    renderCourseCenter();
  },
  score: () => {
    renderScoreLibrary();
  },
  profile: () => {
    renderProfile();
  }
};

// === 路由管理 ===
function switchTab(tabName) {
  // 隐藏所有页面
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // 显示目标页面
  const page = document.getElementById('page-' + tabName);
  if (page) {
    page.classList.add('active');
  }
  // 更新Tab栏
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  const tabItem = document.querySelector(`.tab-item[data-tab="${tabName}"]`);
  if (tabItem) {
    tabItem.classList.add('active');
  }
  AppState.currentTab = tabName;
  AppState.pageHistory = [];
  // 初始化页面
  if (PageInit[tabName]) {
    PageInit[tabName]();
  }
}

function navigateTo(pageId, data) {
  // 隐藏当前页面
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // 显示目标页面
  const page = document.getElementById('page-' + pageId);
  if (page) {
    page.classList.add('active');
  }
  // 记录历史
  AppState.pageHistory.push(AppState.currentTab);
  // 初始化子页面
  if (SubPageInit[pageId]) {
    SubPageInit[pageId](data);
  }
}

function navigateBack() {
  if (AppState.pageHistory.length > 0) {
    const prevPage = AppState.pageHistory.pop();
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('page-' + prevPage);
    if (page) {
      page.classList.add('active');
    }
    // 恢复Tab状态
    if (['home', 'detection', 'course', 'score', 'profile'].includes(prevPage)) {
      AppState.currentTab = prevPage;
      document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      const tabItem = document.querySelector(`.tab-item[data-tab="${prevPage}"]`);
      if (tabItem) tabItem.classList.add('active');
      if (PageInit[prevPage]) PageInit[prevPage]();
    }
  }
}

// === 子页面初始化 ===
const SubPageInit = {
  'detection-running': () => initDetectionRunning(),
  'detection-result': () => initDetectionResult(),
  'course-detail': (data) => initCourseDetail(data),
  'score-player': (data) => initScorePlayer(data),
  'vocal-dna': () => initVocalDNA(),
  'growth': () => initGrowthChart(),
  'achievements': () => initAchievements(),
  'ai-coach': () => initAICoach(),
  'community': () => initCommunity(),
  'leaderboard': () => initLeaderboard()
};

// === 首页渲染 ===
function renderHome() {
  const user = MockData.user;
  const progress = MockData.todayProgress;

  document.getElementById('home-content').innerHTML = `
    <div class="home-greeting">
      <div class="greeting-text">
        <div class="name">你好，${user.nickname}</div>
        <div class="streak">🔥 连续打卡${user.streakDays}天</div>
      </div>
      <div class="avatar">${user.avatar}</div>
    </div>

    <div class="today-progress">
      <div class="info">
        <div class="label">今日练习</div>
        <div class="minutes">${progress.minutes}分钟</div>
        <div class="target">目标${progress.target}分钟</div>
      </div>
      <canvas id="home-progress-ring"></canvas>
    </div>

    <div class="quick-entry">
      ${MockData.quickEntries.map((e, i) => `
        <div class="quick-entry-item" onclick="handleQuickEntry(${i})">
          <div class="quick-entry-icon" style="background:linear-gradient(135deg,${e.color[0]},${e.color[1]})">${e.icon}</div>
          <div class="quick-entry-label">${e.title}</div>
        </div>
      `).join('')}
    </div>

    <div class="stats-row">
      <div class="stat-card gradient-1"><div class="icon">⏱️</div><div class="value">${MockData.weeklyStats.practiceMinutes}分</div><div class="label">练习时长</div></div>
      <div class="stat-card gradient-2"><div class="icon">📚</div><div class="value">${MockData.weeklyStats.completedCourses}</div><div class="label">完成课程</div></div>
      <div class="stat-card gradient-3"><div class="icon">⭐</div><div class="value">${MockData.weeklyStats.avgScore}</div><div class="label">平均评分</div></div>
    </div>

    <div class="card">
      <div class="card-title">推荐课程</div>
      ${MockData.courseModules.filter(m => m.status === 'in_progress' || m.status === 'available').slice(0, 2).map(m => `
        <div class="course-card" style="margin:8px 0;box-shadow:none;background:var(--bg-page)" onclick="navigateTo('course-detail','${m.id}')">
          <div class="course-index ${m.status}">${m.index}</div>
          <div class="course-info">
            <div class="title">${m.title}<span class="status-badge ${m.status}">${m.status==='completed'?'已完成':m.status==='in_progress'?'学习中':'可学习'}</span></div>
            <div class="desc">${m.description}</div>
            <div class="meta"><span>${m.duration}分钟</span><span>难度${'★'.repeat(m.difficulty)}</span></div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <div class="card-title">最近练习</div>
      ${MockData.detectionHistory.slice(0, 3).map(h => `
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--divider)" onclick="navigateTo('detection-result')">
          <div>
            <div style="font-size:14px">${h.modeName}</div>
            <div style="font-size:12px;color:var(--text-hint)">${formatRelativeTime(h.timestamp)}</div>
          </div>
          <div style="font-size:18px;font-weight:700;color:${getScoreColor(h.score)}">${h.score}分</div>
        </div>
      `).join('')}
    </div>
  `;

  drawProgressRing('home-progress-ring', progress.percent);
}

function handleQuickEntry(index) {
  const routes = ['detection-running', 'course-detail', 'score-player', 'ai-coach'];
  const params = [null, MockData.courseModules[2].id, MockData.scores[0].id, null];
  navigateTo(routes[index], params[index]);
}

// === AI检测中心渲染 ===
function renderDetectionCenter() {
  document.getElementById('detection-content').innerHTML = `
    <div class="page-header-gradient">
      <div class="title">AI声乐检测中心</div>
      <div class="subtitle">🎧 三重AI检测：音准+姿态+口型</div>
    </div>

    <div class="detection-modes">
      ${MockData.detectionModes.map(m => `
        <div class="mode-card ${AppState.selectedDetectionMode === m.mode ? 'selected' : ''}" onclick="selectDetectionMode('${m.mode}')">
          <div class="mode-icon" style="background:linear-gradient(135deg,${m.gradient[0]},${m.gradient[1]})">${m.icon}</div>
          <div class="mode-info">
            <div class="title">${m.title}</div>
            <div class="desc">${m.description}</div>
            <div class="tags">${m.tags.map(t => `<span class="tag tag-primary">${t}</span>`).join('')}</div>
          </div>
          ${AppState.selectedDetectionMode === m.mode ? '<div style="font-size:20px;color:var(--primary)">✓</div>' : ''}
        </div>
      `).join('')}
    </div>

    <button class="start-detect-btn" onclick="navigateTo('detection-running')">开始检测</button>

    <div class="card">
      <div class="card-title">检测历史</div>
      ${MockData.detectionHistory.map(h => `
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--divider);cursor:pointer" onclick="navigateTo('detection-result')">
          <div>
            <div style="font-size:14px">${h.modeName}</div>
            <div style="font-size:12px;color:var(--text-hint)">${formatDate(h.timestamp)} · ${h.duration}秒</div>
          </div>
          <div style="font-size:24px;font-weight:700;color:${getScoreColor(h.score)}">${h.score}<span style="font-size:12px;color:var(--text-hint)">分</span></div>
        </div>
      `).join('')}
    </div>
  `;
}

function selectDetectionMode(mode) {
  AppState.selectedDetectionMode = mode;
  renderDetectionCenter();
}

// === 课程中心渲染 ===
function renderCourseCenter() {
  const completed = MockData.courseModules.filter(m => m.status === 'completed').length;
  const total = MockData.courseModules.length;

  document.getElementById('course-content').innerHTML = `
    <div class="page-header-gradient">
      <div style="display:flex;align-items:center">
        <div class="title">课程中心</div>
        <span class="tag-white" style="background:rgba(255,255,255,0.2);font-size:13px;padding:2px 8px;border-radius:10px;margin-left:12px">${completed}/${total}</span>
      </div>
    </div>

    <div class="goal-tabs">
      ${['全部', 'K歌速成', '气息改善', '音准矫正', '舞台表现'].map((g, i) => `
        <div class="goal-tab ${i === 0 ? 'active' : ''}" onclick="selectGoal(${i})">${g}</div>
      `).join('')}
    </div>

    <div class="phase-tabs">
      ${['基础期', '进阶期', '应用期'].map((p, i) => `
        <div class="phase-tab ${i === 0 ? 'active' : ''}" onclick="selectPhase(${i})">${p}</div>
      `).join('')}
    </div>

    <div id="course-list"></div>
  `;
  renderCourseList('foundation');
}

function selectPhase(index) {
  document.querySelectorAll('.phase-tab').forEach((t, i) => {
    t.classList.toggle('active', i === index);
  });
  const phases = ['foundation', 'intermediate', 'advanced'];
  renderCourseList(phases[index]);
}

function selectGoal(index) {
  document.querySelectorAll('.goal-tab').forEach((t, i) => {
    t.classList.toggle('active', i === index);
  });
}

function renderCourseList(phase) {
  const modules = MockData.courseModules.filter(m => m.phase === phase);
  const phaseNames = { foundation: '基础期', intermediate: '进阶期', advanced: '应用期' };
  const completed = modules.filter(m => m.status === 'completed').length;

  document.getElementById('course-list').innerHTML = `
    <div class="card">
      <div style="font-size:16px;font-weight:500">${phaseNames[phase]}</div>
      <div style="font-size:12px;color:var(--text-hint);margin-top:2px">已完成 ${completed}/${modules.length} 模块</div>
    </div>
    ${modules.map(m => `
      <div class="course-card" onclick="navigateTo('course-detail','${m.id}')">
        <div class="course-index ${m.status}">${m.index}</div>
        <div class="course-info">
          <div class="title">${m.title}<span class="status-badge ${m.status}">${m.status==='completed'?'已完成':m.status==='in_progress'?'学习中':m.status==='available'?'可学习':'未解锁'}</span></div>
          <div class="desc">${m.description}</div>
          <div class="meta">
            <span>${m.duration}分钟</span>
            <span>难度${'★'.repeat(m.difficulty)}</span>
            ${m.status === 'in_progress' ? `<span style="color:var(--primary)">进度${m.progress}%</span>` : ''}
          </div>
        </div>
      </div>
    `).join('')}
  `;
}

// === 曲谱库渲染 ===
function renderScoreLibrary() {
  document.getElementById('score-content').innerHTML = `
    <div class="page-header-gradient">
      <div style="display:flex;align-items:center">
        <div class="title">曲谱库</div>
      </div>
    </div>

    <div class="recognition-entry" onclick="alert('拍照识谱功能演示')">
      <div class="info">
        <div class="title">📷 拍照识谱</div>
        <div class="desc">一键识别五线谱/简谱，支持PDF导入</div>
      </div>
      <div style="font-size:24px">→</div>
    </div>

    <div class="category-tabs">
      ${['全部', '流行', '民谣', '经典', '儿歌'].map((c, i) => `
        <div class="category-tab ${i === 0 ? 'active' : ''}" onclick="selectCategory(${i})">${c}</div>
      `).join('')}
    </div>

    ${MockData.scores.map(s => `
      <div class="score-card" onclick="navigateTo('score-player','${s.id}')">
        <div class="score-cover" style="background:linear-gradient(135deg,${s.coverColor[0]},${s.coverColor[1]})">🎼</div>
        <div class="score-info">
          <div class="title">${s.title} ${s.isFavorite ? '❤️' : '🤍'}</div>
          <div class="artist">${s.artist}</div>
          <div class="meta"><span>${s.key}</span><span>${s.bpm}BPM</span><span>难度${'★'.repeat(s.difficulty)}</span></div>
        </div>
        <div style="font-size:20px;color:var(--primary)">▶</div>
      </div>
    `).join('')}
  `;
}

function selectCategory(index) {
  document.querySelectorAll('.category-tab').forEach((t, i) => {
    t.classList.toggle('active', i === index);
  });
}

// === 个人中心渲染 ===
function renderProfile() {
  const user = MockData.user;
  const dna = MockData.vocalDNA;

  document.getElementById('profile-content').innerHTML = `
    <div class="profile-header">
      <div class="avatar">${user.avatar}</div>
      <div class="name">${user.nickname}</div>
      <div class="tags">
        <span class="tag-white" style="background:rgba(255,255,255,0.2);font-size:12px;padding:2px 8px;border-radius:10px">${user.voiceType}</span>
        <span class="tag-white" style="background:rgba(255,255,255,0.2);font-size:12px;padding:2px 8px;border-radius:10px">⭐ 会员</span>
      </div>
      <div style="font-size:13px;margin-top:12px;opacity:0.9">🔥 连续打卡${user.streakDays}天</div>
    </div>

    <div class="profile-stats">
      <div class="item"><div class="value">${formatDuration(user.totalPracticeMinutes)}</div><div class="label">累计练习</div></div>
      <div class="item"><div class="value">${user.completedCourses}</div><div class="label">完成课程</div></div>
      <div class="item"><div class="value">${user.highestScore}</div><div class="label">最高评分</div></div>
    </div>

    <div class="card" style="cursor:pointer" onclick="navigateTo('vocal-dna')">
      <div style="display:flex;align-items:center">
        <div style="width:56px;height:56px;border-radius:28px;background:linear-gradient(135deg,#6C63FF,#8B5CF6);display:flex;align-items:center;justify-content:center;font-size:28px">🧬</div>
        <div style="flex:1;margin-left:16px">
          <div style="font-size:16px;font-weight:500">声乐DNA档案</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">声部：${dna.voiceType} · 音域：${dna.range.lowest}-${dna.range.highest}</div>
        </div>
        <div style="font-size:13px;color:var(--primary)">查看 ></div>
      </div>
    </div>

    <div class="function-list">
      ${[
        { icon: '🧬', title: '声乐DNA档案', desc: '查看你的声音特征', route: 'vocal-dna' },
        { icon: '📈', title: '成长曲线', desc: '追踪学习进步轨迹', route: 'growth' },
        { icon: '🏆', title: '成就徽章', desc: '解锁更多成就', route: 'achievements' },
        { icon: '🤖', title: 'AI私教', desc: '智能声乐指导', route: 'ai-coach' },
        { icon: '👥', title: '歌友社区', desc: '分享交流心得', route: 'community' },
        { icon: '📊', title: '排行榜', desc: '与歌友比拼进步', route: 'leaderboard' }
      ].map(f => `
        <div class="function-item" onclick="navigateTo('${f.route}')">
          <div class="icon">${f.icon}</div>
          <div class="info"><div class="title">${f.title}</div><div class="desc">${f.desc}</div></div>
          <div class="arrow">›</div>
        </div>
      `).join('')}
    </div>
  `;
}

// === 工具函数 ===
function formatRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  return '刚刚';
}

function formatDate(timestamp) {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}-${d.getDate().toString().padStart(2, '0')}`;
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}小时${m}分` : `${h}小时`;
}

// === 初始化 ===
document.addEventListener('DOMContentLoaded', () => {
  // 绑定Tab点击
  document.querySelectorAll('.tab-item').forEach(item => {
    item.addEventListener('click', () => {
      switchTab(item.dataset.tab);
    });
  });
  // 默认显示首页
  switchTab('home');
});
