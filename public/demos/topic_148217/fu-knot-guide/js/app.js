/**
 * app.js - 应用主入口：全局状态、页面导航、事件绑定
 * 依赖：所有其他 JS 模块（需按顺序在 HTML 中先加载）
 */

// ----- 全局状态 -----
var AppState = {
  currentView: 'home',
  selectedKnot: null,
  selectedKnotData: null,
  currentStepIdx: 0,
  prevStepIdx: 0,
  isProcessMode: true
};

// ----- Toast 提示 -----
function showToast(msg) {
  var t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function () { t.remove(); }, 2200);
}

// ----- 页面导航 -----
function switchPage(pageName) {
  AppState.currentView = pageName;

  // 切换页面可见性
  document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('show'); });
  var pg = document.getElementById('page-' + pageName);
  if (pg) pg.classList.add('show');

  // 更新导航高亮
  document.querySelectorAll('#topNav button').forEach(function (b) { b.classList.remove('active'); });
  var btn = document.querySelector('#topNav button[data-page="' + pageName + '"]');
  if (btn) btn.classList.add('active');

  // 流程模式：全屏舞台，禁止 body 滚动
  document.body.classList.toggle('process-active', pageName === 'process');

  // 按页面触发对应渲染
  if (pageName === 'home') renderHome();
  if (pageName === 'achievements') renderAchievementsPage();

  // 福结宠物播报（偶尔触发，避免每次切页都打扰）
  if (window.Pet && Pet.announce) {
    if (pageName === 'process') {
      Pet.announce('welcome', { page: 'process' });
    } else if (pageName === 'home' && Math.random() < 0.4) {
      Pet.announce('welcome', { page: 'home' });
    }
  }
}

function backToHome() {
  switchPage('home');
}

// ----- 键盘导航（流程式模式下） -----
document.addEventListener('keydown', function (e) {
  if (AppState.currentView !== 'process') return;
  if (document.getElementById('finishBlock').classList.contains('show')) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault(); nextStep();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault(); prevStep();
  }
});

// ----- 导航按钮事件委托 -----
document.getElementById('topNav').addEventListener('click', function (e) {
  if (e.target.tagName === 'BUTTON') {
    switchPage(e.target.dataset.page);
  }
});

// ----- 启动 -----
renderHome();
if (window.Pet && Pet.init) Pet.init();
