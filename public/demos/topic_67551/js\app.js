// ============ 页面切换 ============
let currentPage = 'home';
let currentCategory = 'today';
let currentRecordFilter = 'all';
let currentReportPeriod = 'week';

function switchPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');

  document.querySelectorAll('.tab-item').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.page === page);
  });

  // 页面特定渲染
  if (page === 'home') renderHome();
  if (page === 'record') renderRecords();
  if (page === 'report') renderReport();
  if (page === 'profile') renderProfile();
}

// AI 个性化推荐入口 - 跳转到今日推荐
function goToTodayRecommend() {
  currentCategory = 'today';
  switchPage('home');
  // 触发今日推荐的AI摘要加载
  setTimeout(() => {
    const summaryEl = document.getElementById('ai-summary');
    if (summaryEl) summaryEl.textContent = '🤖 AI 正在分析宝贝阅读喜好...';
  }, 100);
}

// ============ 初始化 ============
function init() {
  initSampleData();
  initDefaultXunfeiConfig();
  updateUserPersona();
  initPointsAndBadges();
  switchPage('home');
  initTagSelectEvents();
  
  // 首次访问显示欢迎引导
  if (!Storage.get('welcomeShown')) {
    showWelcomeModal();
  }
}

function showWelcomeModal() {
  document.getElementById('welcome-modal').classList.add('show');
}

function closeWelcomeModal() {
  document.getElementById('welcome-modal').classList.remove('show');
  Storage.set('welcomeShown', true);
  // 关闭欢迎弹窗后开始新手引导
  setTimeout(() => startUserGuide(), 300);
}

// ============ 新手引导 ============
let guideStep = 0;
const guideSteps = [
  { target: 'ai-recommend-banner', page: 'home', text: '✨ 这是 AI 个性化推荐，根据宝贝特点智能推荐好书' },
  { target: 'book-list', page: 'home', text: '📚 点击任意绘本卡片，查看详情、AI 推荐理由和阅读提示' },
  { target: 'detail-tips', page: 'home', text: '💡 阅读提示页面：AI 个性化生成亲子共读小贴士、亲子问答，帮助您更好地引导孩子', action: 'openFirstBookTips' },
  { target: 'detail-tab-record-btn', page: 'home', text: '✏️ 切换到记录标签，可以快速记录本次阅读时长、评分和互动亮点', action: 'switchRecordTab' },
  { target: 'page-record', page: 'record', text: '📝 记录页面：记录亲子阅读时光，支持语音输入和快捷标签，还有阅读目标打卡', cleanup: 'closeBookDetail' },
  { target: 'ai-video-btn', page: 'home', text: '🎥 AI 互动讲绘本：实时音视频讲解，AI 自动识别绘本画面并讲故事，沉浸式体验' },
  { target: 'analysis-report', page: 'report', text: '📊 报告页面：查看周/月分析报告，AI 智能解读能力发展和兴趣偏好雷达图' },
  { target: '.profile-header', page: 'profile', text: '👤 档案页面：查看积分徽章、孩子成长档案，管理阅读偏好和设置' },
  { target: null, page: 'home', text: '🎉 恭喜您完成了新手引导！<br><br>让我们和孩子一起，<br>开始甜蜜的亲子阅读时光吧 📚💕', isWelcome: true }
];

function startUserGuide() {
  if (Storage.get('guideShown')) return;
  guideStep = 0;
  showGuideStep();
}

function showGuideStep() {
  if (guideStep >= guideSteps.length) {
    endUserGuide();
    return;
  }
  
  const step = guideSteps[guideStep];
  
  // 如果需要切换页面
  if (currentPage !== step.page) {
    switchPage(step.page);
    setTimeout(() => {
      showGuideStep();
    }, 400);
    return;
  }
  
  // 等待页面渲染
  setTimeout(() => {
    // 执行前置操作
    if (step.action === 'openFirstBookTips') {
      openFirstBookForGuide();
      setTimeout(() => {
        switchDetailTab('tips');
        setTimeout(() => showGuideHighlight(step), 200);
      }, 400);
      return;
    }
    if (step.action === 'switchRecordTab') {
      switchDetailTab('record');
      setTimeout(() => showGuideHighlight(step), 200);
      return;
    }
    
    showGuideHighlight(step);
  }, 100);
}

function showGuideHighlight(step) {
  // 移除之前的引导层
  closeGuideOverlay();
  
  // 欢迎页（最后一步）：居中显示，不高亮任何元素
  if (step.isWelcome) {
    // 创建引导遮罩
    const overlay = document.createElement('div');
    overlay.id = 'guide-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:linear-gradient(135deg,rgba(255,140,66,0.92) 0%,rgba(255,176,122,0.92) 100%);z-index:5999;';
    document.body.appendChild(overlay);
    
    // 创建欢迎卡片
    const welcomeCard = document.createElement('div');
    welcomeCard.id = 'guide-tooltip';
    welcomeCard.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:20px;padding:36px 28px 28px;width:calc(100% - 48px);max-width:320px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.2);z-index:9999;animation:welcome-bounce 0.6s ease-out;';
    welcomeCard.innerHTML = `
      <div style="font-size:56px;margin-bottom:12px;">📚💕</div>
      <div style="font-size:20px;font-weight:700;color:#333;margin-bottom:10px;">欢迎加入童书伴读</div>
      <div style="font-size:14px;color:#666;line-height:1.8;margin-bottom:24px;">🎉 恭喜您完成了新手引导！<br><br>让我们和孩子一起，<br>开始甜蜜的亲子阅读时光吧 ✨</div>
      <button onclick="endUserGuide()" style="background:linear-gradient(135deg,#FF8C42,#FF6B1A);color:#fff;border:none;border-radius:10px;padding:12px 32px;font-size:15px;cursor:pointer;font-weight:600;width:100%;box-shadow:0 4px 12px rgba(255,107,26,0.3);">开始亲子阅读之旅 →</button>
      <div style="font-size:11px;color:#ccc;margin-top:14px;">${guideStep + 1} / ${guideSteps.length}</div>
    `;
    document.body.appendChild(welcomeCard);
    
    // 添加动画样式
    if (!document.getElementById('guide-welcome-style')) {
      const style = document.createElement('style');
      style.id = 'guide-welcome-style';
      style.textContent = `
        @keyframes welcome-bounce {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          60% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    return;
  }
  
  // 获取目标元素
  let targetEl;
  if (step.target && step.target.startsWith('.')) {
    // class 选择器
    targetEl = document.querySelector(step.target);
  } else if (step.target && step.target.includes('tab-item')) {
    targetEl = document.querySelector(step.target);
  } else if (step.target) {
    targetEl = document.getElementById(step.target);
  }
  
  if (!targetEl) {
    guideStep++;
    showGuideStep();
    return;
  }
  
  // 创建引导遮罩
  const overlay = document.createElement('div');
  overlay.id = 'guide-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:5999;';
  overlay.onclick = endUserGuide;
  document.body.appendChild(overlay);
  
  // 创建高亮框
  const rect = targetEl.getBoundingClientRect();
  const highlight = document.createElement('div');
  highlight.id = 'guide-highlight';
  highlight.style.cssText = `position:fixed;top:${rect.top-4}px;left:${rect.left-4}px;width:${rect.width+8}px;height:${rect.height+8}px;border:3px solid #FF8C42;border-radius:10px;box-shadow:0 0 0 4px rgba(255,140,66,0.2);z-index:6000;pointer-events:none;`;
  document.body.appendChild(highlight);
  
  // 创建提示框（固定在底部）
  const tooltip = document.createElement('div');
  tooltip.id = 'guide-tooltip';
  tooltip.style.cssText = 'position:fixed;left:50%;bottom:30px;transform:translateX(-50%);background:#fff;border-radius:14px;padding:18px 20px 16px;width:calc(100% - 40px);max-width:320px;box-shadow:0 -4px 24px rgba(0,0,0,0.25);z-index:9999;text-align:center;';
  const isLastStep = guideStep === guideSteps.length - 1;
  tooltip.innerHTML = `
    <div style="font-size:14px;color:#333;line-height:1.6;margin-bottom:14px;">${step.text}</div>
    <div style="display:flex;gap:10px;justify-content:center;">
      ${isLastStep ? 
        `<button onclick="endUserGuide()" style="background:linear-gradient(135deg,#FF8C42,#FF6B1A);color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:14px;cursor:pointer;font-weight:600;width:100%;">完成 ✨</button>` :
        `<button onclick="endUserGuide()" style="background:#f5f5f5;color:#666;border:none;border-radius:8px;padding:8px 18px;font-size:13px;cursor:pointer;font-weight:500;">跳过</button>
         <button onclick="nextGuideStep()" style="background:linear-gradient(135deg,#FF8C42,#FF6B1A);color:#fff;border:none;border-radius:8px;padding:8px 20px;font-size:13px;cursor:pointer;font-weight:600;">下一步 →</button>`
      }
    </div>
    <div style="font-size:11px;color:#ccc;margin-top:10px;">${guideStep + 1} / ${guideSteps.length}</div>
  `;
  document.body.appendChild(tooltip);
  
  // 滚动到目标元素
  if (step.target === 'page-record' || step.target === 'analysis-report' || step.target === '.profile-header') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// 引导专用：打开第一本书的详情
function openFirstBookForGuide() {
  const firstBook = document.querySelector('.book-card-main');
  if (firstBook) {
    firstBook.click();
  }
}

function nextGuideStep() {
  const step = guideSteps[guideStep];
  if (step.cleanup === 'closeBookDetail') {
    try { closeBookDetail(); } catch(e) {}
  }
  
  guideStep++;
  showGuideStep();
}

function endUserGuide() {
  closeGuideOverlay();
  try { closeBookDetail(); } catch(e) {}
  Storage.set('guideShown', true);
}

function closeGuideOverlay() {
  const overlay = document.getElementById('guide-overlay');
  const highlight = document.getElementById('guide-highlight');
  const tooltip = document.getElementById('guide-tooltip');
  if (overlay) overlay.remove();
  if (highlight) highlight.remove();
  if (tooltip) tooltip.remove();
}

// 重置引导（用于测试）
function resetUserGuide() {
  localStorage.removeItem('guideShown');
  showToast('引导已重置，刷新页面后可重新体验');
}

function initDefaultXunfeiConfig() {
  if (!localStorage.getItem('xunfei_app_id')) {
    localStorage.setItem('xunfei_app_id', 'f4b7fd4a');
  }
  if (!localStorage.getItem('xunfei_api_key')) {
    localStorage.setItem('xunfei_api_key', 'a0a789b9b73b5583e0b152eeee15e0c1');
  }
  if (!localStorage.getItem('xunfei_api_secret')) {
    localStorage.setItem('xunfei_api_secret', 'YjAyN2RlMDFiYzg1MDcwMzc4ODhmNWE5');
  }
}

function initTagSelectEvents() {
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('tag-select')) {
      const tag = e.target;
      const parent = tag.parentElement;
      if (parent.id === 'age-select' || parent.id === 'gender-select') return;
      if (tag.closest('#interest-tags') || tag.closest('#ai-tags')) return;
      if (tag.closest('.goal-selector') || tag.closest('.challenge-selector')) return;
      
      // 投入程度标签组：单选
      if (parent.id === 'voice-emotion-tags' || 
          parent.id === 'quick-reaction-tags' || 
          parent.id === 'detail-record-emotion-tags') {
        parent.querySelectorAll('.tag-select').forEach(t => t.classList.remove('selected'));
        tag.classList.add('selected');
      } else {
        tag.classList.toggle('selected');
      }
    }
  });
}

function initPointsAndBadges() {
  const pointsData = getPointsData();
  if (pointsData.initialized) return;

  const records = Storage.get('readingRecords', []);
  const persona = Storage.get('userPersona', {});
  let totalPoints = 0;
  const seenBooks = new Set();
  const seenCategories = new Set();

  const sortedRecords = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));

  sortedRecords.forEach(record => {
    const wasNewBook = !seenBooks.has(record.bookTitle);
    const book = bookDatabase.find(b => b.title === record.bookTitle);
    const wasNewCategory = book && !seenCategories.has(book.category);

    if (wasNewBook) seenBooks.add(record.bookTitle);
    if (wasNewCategory) seenCategories.add(book.category);

    const pointsList = calculatePointsForRecord(record, wasNewBook, wasNewCategory);
    pointsList.forEach(p => {
      totalPoints += p.points;
      pointsData.records.push({
        id: Date.now() + Math.random(),
        points: p.points,
        reason: p.reason,
        recordId: record.id,
        time: record.date,
        timestamp: new Date(record.date).getTime()
      });
    });
  });

  if (persona.totalBooks >= 10) {
    totalPoints += pointRules.milestone10.points;
    pointsData.records.push({ id: Date.now(), points: pointRules.milestone10.points, reason: pointRules.milestone10.name, time: formatDate(new Date()), timestamp: Date.now() });
  }
  if (persona.totalBooks >= 30) {
    totalPoints += pointRules.milestone30.points;
    pointsData.records.push({ id: Date.now() + 1, points: pointRules.milestone30.points, reason: pointRules.milestone30.name, time: formatDate(new Date()), timestamp: Date.now() });
  }
  if (persona.totalBooks >= 50) {
    totalPoints += pointRules.milestone50.points;
    pointsData.records.push({ id: Date.now() + 2, points: pointRules.milestone50.points, reason: pointRules.milestone50.name, time: formatDate(new Date()), timestamp: Date.now() });
  }

  if (persona.streakDays >= 3) {
    totalPoints += pointRules.streak3.points;
    pointsData.records.push({ id: Date.now() + 3, points: pointRules.streak3.points, reason: pointRules.streak3.name, time: formatDate(new Date()), timestamp: Date.now() });
  }
  if (persona.streakDays >= 7) {
    totalPoints += pointRules.streak7.points;
    pointsData.records.push({ id: Date.now() + 4, points: pointRules.streak7.points, reason: pointRules.streak7.name, time: formatDate(new Date()), timestamp: Date.now() });
  }
  if (persona.streakDays >= 30) {
    totalPoints += pointRules.streak30.points;
    pointsData.records.push({ id: Date.now() + 5, points: pointRules.streak30.points, reason: pointRules.streak30.name, time: formatDate(new Date()), timestamp: Date.now() });
  }

  pointsData.totalPoints = totalPoints;
  pointsData.records.sort((a, b) => b.timestamp - a.timestamp);
  pointsData.initialized = true;

  checkBadges();
  savePointsData(pointsData);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 如果 DOM 已经加载完毕
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}
