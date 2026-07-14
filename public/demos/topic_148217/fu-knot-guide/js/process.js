/**
 * process.js v7 - 流程式制作模式（单场景渐进式 + 游戏化）
 * 依赖：app.js(AppState), scene2d-core.js, achievements.js
 *
 * 核心变化：
 *   - 不再为每个步骤重建 DOM 和 2D 场景
 *   - 2D 容器只初始化一次，步骤切换只更新内容
 *   - Scene2D.transitionTo() 增量添加/移除元素
 */

/* ========== 状态 ========== */
var interactState = { threadDone: false, tightenValue: 0 };
var prevStepIdx = -1;
var isTransitioning = false;
var sceneInited = false; // 2D 场景是否已初始化

/** 获取当前绳结的交互配置（threadStep / tightenStep），无声明则返回空对象 */
function getInteractions() {
  var id = AppState.selectedKnotData && AppState.selectedKnotData.id;
  var impl = (window.Scene2D && Knots2D) ? Knots2D.get(id) : null;
  return (impl && impl.interactions) || {};
}

function startProcess() {
  AppState.isProcessMode = true;
  AppState.currentStepIdx = 0;
  prevStepIdx = -1;
  sceneInited = false;
  interactState.threadDone = false;
  interactState.tightenValue = 0;
  isTransitioning = false;
  switchPage('process');
  document.getElementById('scene3dContainer').style.display = '';
  renderGameHeader();
  renderProcessHeader();
  renderProcessProgress();
  renderProcessStepCard();
}

/* ========== 游戏化顶部栏 ========== */
function renderGameHeader() {
  var gh = document.getElementById('gameHeader');
  if (!gh) return;

  gh.innerHTML =
    '<div class="game-bar">' +
      '<div class="game-xp-section">' +
        '<span class="xp-icon">\u2B50</span>' +
        '<div class="xp-track"><div class="xp-fill" id="xpFill" style="width:0%"></div></div>' +
        '<span class="xp-text" id="xpText">0 XP</span>' +
      '</div>' +
      '<div class="game-combo" id="comboDisplay" style="display:none;">' +
        '<span class="combo-fire">\uD83D\uDD25</span>' +
        '<span class="combo-count" id="comboCount">0</span>' +
        '<span class="combo-label">\u8FDE\u51FB</span>' +
      '</div>' +
    '</div>';
}

function updateGameUI() {
  var state = Scene2D.getGameState ? Scene2D.getGameState() : { combo: 0, totalXP: 0 };

  var fill = document.getElementById('xpFill');
  var text = document.getElementById('xpText');
  if (fill && text) {
    var totalSteps = AppState.selectedKnotData.steps.length || 7;
    var maxXP = totalSteps * 15 + (totalSteps - 1) * 5 * totalSteps / 2;
    var pct = Math.min(100, (state.totalXP / maxXP) * 100);
    fill.style.width = pct + '%';
    text.textContent = state.totalXP + ' XP';
  }

  var cd = document.getElementById('comboDisplay');
  var cc = document.getElementById('comboCount');
  if (cd && cc) {
    if (state.combo >= 2) {
      cd.style.display = 'flex';
      cc.textContent = state.combo;
      cd.classList.add('combo-pop');
      setTimeout(function () { cd.classList.remove('combo-pop'); }, 300);
    } else {
      cd.style.display = 'none';
    }
  }
}

/* ========== 流程式头部 ========== */
function renderProcessHeader() {
  document.getElementById('procIcon').textContent = AppState.selectedKnotData.icon;
  document.getElementById('procTitle').textContent = AppState.selectedKnotData.name;
  document.getElementById('procSub').textContent = AppState.selectedKnotData.difficulty + ' \u00B7 ' + AppState.selectedKnotData.time;
  document.getElementById('finishBlock').classList.remove('show');
}

function renderProcessProgress() {
  var bar = document.getElementById('progressBar');
  var steps = AppState.selectedKnotData.steps;
  var html = '';
  steps.forEach(function (s, i) {
    var cls = i < AppState.currentStepIdx ? 'done' : (i === AppState.currentStepIdx ? 'active' : '');
    html += '<div class="pdot ' + cls + '" onclick="gotoStep(' + i + ')">' + (i < AppState.currentStepIdx ? '\u2713' : (i + 1)) + '</div>';
    if (i < steps.length - 1) html += '<div class="pline ' + (i < AppState.currentStepIdx ? 'done' : '') + '"></div>';
  });
  bar.innerHTML = html;
}

/* ========== 过渡动画状态管理 ========== */
function setButtonsEnabled(enabled) {
  var btns = document.querySelectorAll('.btn-prev, .btn-next, .btn-finish, #nextBtn');
  btns.forEach(function (b) { b.disabled = !enabled; b.style.opacity = enabled ? '1' : '0.5'; });
  var dots = document.querySelectorAll('.pdot');
  dots.forEach(function (d) { d.style.pointerEvents = enabled ? 'auto' : 'none'; });
}

/* ========== 渲染步骤卡片 ========== */
function renderProcessStepCard() {
  // 步骤信息区域（标题、描述、交互等）
  var infoContainer = document.getElementById('stepInfoContainer');
  // 按钮区域
  var container = document.getElementById('stepCardContainer');
  var s = AppState.selectedKnotData.steps[AppState.currentStepIdx];
  var total = AppState.selectedKnotData.steps.length;

  var toolsHTML = '';
  if (s.tools) {
    toolsHTML = '<table class="tool-tbl">' + s.tools.map(function (t) {
      return '<tr><td>' + t.name + '</td><td>' + t.note + '</td></tr>';
    }).join('') + '</table>';
  }

  var interactiveHTML = '';
  var interactions = getInteractions();
  var threadStep = interactions.threadStep;
  var tightenStep = interactions.tightenStep;
  if (threadStep !== undefined && AppState.currentStepIdx === threadStep && !interactState.threadDone) {
    interactiveHTML = '<div class="interact-zone" id="interactZone">' +
      '<div class="interact-hint">\uD83D\uDC46 \u70B9\u51FB\u5706\u5708\u5B8C\u6210\u201C\u7A7F\u7EBF\u201D\u64CD\u4F5C</div>' +
      '<div class="interact-target" id="interactTarget" onclick="doThread()"></div>' +
      '</div>';
  } else if (threadStep !== undefined && AppState.currentStepIdx === threadStep && interactState.threadDone) {
    interactiveHTML = '<div class="interact-zone thread-success">' +
      '<div class="interact-hint">\u2705 \u7A7F\u7EBF\u6210\u529F\uFF01\u7EE7\u7EED\u4E0B\u4E00\u6B65</div></div>';
  } else if (tightenStep !== undefined && AppState.currentStepIdx === tightenStep) {
    var pct = interactState.tightenValue;
    interactiveHTML = '<div class="interact-zone tighten-zone">' +
      '<div class="interact-hint">\uD83D\uDC46 \u62D6\u52A8\u6ED1\u5757\u8C03\u6574\u6536\u7D27\u7A0B\u5EA6</div>' +
      '<input type="range" min="0" max="100" value="' + pct + '" class="tighten-slider" id="tightenSlider" oninput="onTightenSlide(this.value)">' +
      '<div class="tighten-label">\u6536\u7D27\u7A0B\u5EA6: <b>' + pct + '%</b></div>' +
      '</div>';
  }

  // 步骤信息（不含 2D 容器）
  infoContainer.innerHTML =
    '<div class="step-card">' +
    '<span class="sc-num">\u7B2C ' + (AppState.currentStepIdx + 1) + ' \u6B65 / \u5171 ' + total + ' \u6B65</span>' +
    '<h3 id="stepTitle">' + s.title + '</h3>' +
    '<div class="sc-desc">' + s.desc + '</div>' +
    toolsHTML +
    interactiveHTML +
    '<div class="tip-box">\uD83D\uDCA1 ' + s.tip + ' &nbsp;<small style="color:#999">(\u67E5\u770B\u7EF3\u7ED3\u5F62\u6001)</small></div>' +
    '</div>';

  // 按钮区域
  container.innerHTML =
    '<div class="btn-row" id="btnRow">' +
    '<button class="btn btn-prev" onclick="prevStep()" ' + (AppState.currentStepIdx === 0 ? 'style="visibility:hidden"' : '') + '>\u2190 \u4E0A\u4E00\u6B65</button>' +
    (AppState.currentStepIdx < total - 1
      ? '<button class="btn btn-next" id="nextBtn" onclick="nextStep()">\u4E0B\u4E00\u6B65 \u2192</button>'
      : '<button class="btn btn-finish" onclick="finishProcess()">\u2728 \u5B8C\u6210\u7EF3\u7ED3</button>') +
    '</div>';

  // 初始化或切换 2D 场景（用实际容器尺寸，确保 canvas 填满舞台且无变形）
  setTimeout(function () {
    var box = document.getElementById('scene3dContainer');
    if (!box) return;
    var w = box.clientWidth;
    var h = box.clientHeight;

    if (w < 10 || h < 10) {
      setTimeout(function () {
        var w2 = box.clientWidth;
        var h2 = box.clientHeight;
        if (w2 > 10 && h2 > 10) initOrStepScene(box, w2, h2);
      }, 200);
      return;
    }
    initOrStepScene(box, w, h);
  }, 100);
}

/**
 * 初始化或切换步骤场景
 * 核心改变：场景只初始化一次，步骤切换用 transitionTo 增量操作
 */
function initOrStepScene(box, w, h) {
  if (!sceneInited) {
    // 第一次：初始化场景并渲染第一步
    Scene2D.init(box, w, h);
    Scene2D.renderStep(AppState.currentStepIdx, AppState.selectedKnotData.steps.length, AppState.selectedKnotData.id);
    prevStepIdx = AppState.currentStepIdx;
    sceneInited = true;
  } else {
    // 后续步骤：只切换，不重建场景
    Scene2D.resize(w, h);
    if (prevStepIdx !== AppState.currentStepIdx) {
      runStepTransition(prevStepIdx, AppState.currentStepIdx);
    }
  }
}

/* ========== 步骤过渡动画 ========== */
function runStepTransition(fromIdx, toIdx) {
  var total = AppState.selectedKnotData.steps.length;

  setButtonsEnabled(false);
  isTransitioning = true;

  // 后退时重置连击
  if (toIdx < fromIdx) {
    if (Scene2D.resetCombo) Scene2D.resetCombo();
  }

  Scene2D.transitionTo(fromIdx, toIdx, total, function () {
    isTransitioning = false;
    prevStepIdx = toIdx;

    setButtonsEnabled(true);

    var inter = getInteractions();
    if (toIdx !== inter.threadStep) interactState.threadDone = false;
    if (toIdx !== inter.tightenStep) interactState.tightenValue = 0;

    // 前进时触发庆祝
    if (toIdx > fromIdx && Scene2D.celebrateStep) {
      var result = Scene2D.celebrateStep(toIdx);
      showCelebrationPopup(result);
    }

    updateGameUI();
  }, AppState.selectedKnotData.id);
}

/* ========== 庆祝播报（由福结宠物接管） ========== */
function showCelebrationPopup(result) {
  if (window.Pet && Pet.announce) Pet.announce('xp', result);
}

/* ========== 交互 ========== */
function doThread() {
  if (interactState.threadDone || isTransitioning) return;
  interactState.threadDone = true;
  var target = document.getElementById('interactTarget');
  if (target) { target.classList.add('thread-done'); target.innerHTML = '\u2713'; }
  var hint = document.querySelector('#interactZone .interact-hint');
  if (hint) hint.textContent = '\u2705 \u7A7F\u7EBF\u6210\u529F\uFF01\u7EE7\u7EED\u4E0B\u4E00\u6B65';
  showToast('\u2705 \u7A7F\u7EBF\u6210\u529F\uFF01');

  if (Scene2D.celebrateStep) {
    var inter = getInteractions();
    var r = Scene2D.celebrateStep(inter.threadStep !== undefined ? inter.threadStep : 4);
    showCelebrationPopup(r);
    updateGameUI();
  }
}

function onTightenSlide(val) {
  if (isTransitioning) return;
  interactState.tightenValue = parseInt(val, 10);
  var label = document.querySelector('.tighten-label b');
  if (label) label.textContent = interactState.tightenValue + '%';
  Scene2D.renderTighten(interactState.tightenValue);

  if (interactState.tightenValue >= 100) {
    if (Scene2D.celebrateStep) {
      var inter = getInteractions();
      var r = Scene2D.celebrateStep(inter.tightenStep !== undefined ? inter.tightenStep : 5);
      showCelebrationPopup(r);
      updateGameUI();
    }
  }
}

/* ========== 步骤跳转 ========== */
function gotoStep(i) {
  if (isTransitioning || i === AppState.currentStepIdx) return;

  var from = AppState.currentStepIdx;
  AppState.currentStepIdx = i;
  interactState.threadDone = false;
  interactState.tightenValue = 0;

  if (i < from && Scene2D.resetCombo) Scene2D.resetCombo();

  renderProcessProgress();
  renderProcessStepCard();
}

function nextStep() {
  if (isTransitioning) return;
  if (AppState.currentStepIdx >= AppState.selectedKnotData.steps.length - 1) return;

  AppState.currentStepIdx++;
  interactState.threadDone = false;
  interactState.tightenValue = 0;

  renderProcessProgress();
  renderProcessStepCard();
}

function prevStep() {
  if (isTransitioning) return;
  if (AppState.currentStepIdx <= 0) return;

  AppState.currentStepIdx--;
  interactState.threadDone = false;
  interactState.tightenValue = 0;

  if (Scene2D.resetCombo) Scene2D.resetCombo();

  renderProcessProgress();
  renderProcessStepCard();
}

function finishProcess() {
  if (isTransitioning) return;

  if (Scene2D.celebrateStep) {
    var r = Scene2D.celebrateStep(6);
    if (window.Pet && Pet.announce) Pet.announce('finish', { name: AppState.selectedKnotData.name, combo: r.combo, xpEarned: r.xpEarned });
    updateGameUI();
  }

  var total = AppState.selectedKnotData.steps.length;
  Scene2D.transitionTo(AppState.currentStepIdx, Math.max(AppState.currentStepIdx, total - 1), total, function () {
    document.getElementById('stepInfoContainer').innerHTML = '';
    document.getElementById('stepCardContainer').innerHTML = '';
    document.getElementById('scene3dContainer').style.display = 'none';
    document.getElementById('finishBlock').classList.add('show');

    var state = Scene2D.getGameState ? Scene2D.getGameState() : { totalXP: 0, maxCombo: 0 };
    document.getElementById('finishMsg').innerHTML =
      '\u606D\u559C\u5B8C\u6210 <b>' + AppState.selectedKnotData.name + '</b>\uFF01<br>' +
      '\u83B7\u5F97 <b style="color:#C41E3A;font-size:1.3em;">' + state.totalXP + ' XP</b> ' +
      '\u00B7 \u6700\u9AD8 <b style="color:#FF8C00;">' + state.maxCombo + 'x</b> \u8FDE\u51FB<br>' +
      '\u975E\u9057\u6280\u827A\uFF0C\u56E0\u4F60\u7684\u53C2\u4E0E\u800C\u4F20\u627F\u3002';

    var dots = document.querySelectorAll('#progressBar .pdot');
    dots.forEach(function (d) { d.className = 'pdot done'; d.textContent = '\u2713'; });
    document.querySelectorAll('#progressBar .pline').forEach(function (l) { l.classList.add('done'); });

    sceneInited = false;
    Scene2D.dispose();
    recordCompletion('process');
  }, AppState.selectedKnotData.id);
}
