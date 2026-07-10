/* ========================================
   全局状态（双端联动核心）
   ======================================== */
const STATE = {
  IDLE: 'idle',
  HELP_SENT: 'help_sent',
  REPLY_SENT: 'reply_sent',
  RESOLVED: 'resolved'
};

const STORAGE_KEY = 'zhs_09_data';

function getAppState() {
  const data = loadData();
  return data.appState || STATE.IDLE;
}

function setAppState(state) {
  const data = loadData();
  data.appState = state;
  saveData(data);
}

function getCurrentRole() {
  const data = loadData();
  return data.currentRole || null;
}

function setCurrentRole(role) {
  const data = loadData();
  data.currentRole = role;
  saveData(data);
}

function getReplyData() {
  const data = loadData();
  return data.replyData || null;
}

function setReplyData(replyData) {
  const data = loadData();
  data.replyData = replyData;
  saveData(data);
}

function clearReplyData() {
  const data = loadData();
  data.replyData = null;
  saveData(data);
}

function getHistory() {
  const data = loadData();
  return data.history || [];
}

function setHistory(history) {
  const data = loadData();
  data.history = history;
  saveData(data);
}

function addHistoryItem(item) {
  const history = getHistory();
  history.unshift(item);
  setHistory(history);
}

function getHasNewForChild() {
  const data = loadData();
  return data.hasNewForChild || false;
}

function setHasNewForChild(val) {
  const data = loadData();
  data.hasNewForChild = val;
  saveData(data);
}

function getHasNewForElder() {
  const data = loadData();
  return data.hasNewForElder || false;
}

function setHasNewForElder(val) {
  const data = loadData();
  data.hasNewForElder = val;
  saveData(data);
}

function getLearnedSteps() {
  const data = loadData();
  const result = {};
  if (data.learnedSteps) {
    for (const k in data.learnedSteps) {
      result[k] = new Set(data.learnedSteps[k]);
    }
  }
  return result;
}

function setLearnedStepsObj(learnedSteps) {
  const data = loadData();
  const serializable = {};
  for (const k in learnedSteps) {
    serializable[k] = [...learnedSteps[k]];
  }
  data.learnedSteps = serializable;
  saveData(data);
}

/* ========================================
   持久化（localStorage）
   ======================================== */
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) { /* 忽略 */ }
  return {};
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) { /* 忽略 */ }
}

/* ========================================
   教程数据
   ======================================== */
const defaultTutorials = [
  {id:0, icon:'💊', title:'如何使用医保电子凭证', desc:'去医院看病不用再带实体医保卡', tags:['微信','5步','2分钟'],
   steps:['打开<strong>微信</strong>App','点击右下角「<strong>我</strong>」→ 选择「<strong>服务</strong>」','找到并点击「<strong>医疗健康</strong>」','选择「<strong>医保电子凭证</strong>」','点击「<strong>立即使用</strong>」出示二维码']},
  {id:1, icon:'📹', title:'如何和孙子视频通话', desc:'微信视频通话，看到远方的家人', tags:['微信','4步','1分钟'],
   steps:['打开微信，找到<strong>联系人</strong>的头像','点击进入<strong>聊天界面</strong>','点击右下角「<strong>+</strong>」号','选择「<strong>视频通话</strong>」等待对方接听']},
  {id:2, icon:'🚌', title:'如何查公交车到哪儿了', desc:'不用在站台干等，实时掌握车辆位置', tags:['地图App','3步'],
   steps:['打开「<strong>百度地图</strong>」或「车来了」App','在搜索栏输入<strong>公交线路号</strong>','查看车辆<strong>实时位置</strong>和预计到站时间']},
  {id:3, icon:'🏥', title:'如何手机挂号预约', desc:'不用早起排队，手机上就能挂号', tags:['医院小程序','4步'],
   steps:['打开医院<strong>公众号或小程序</strong>','选择「<strong>预约挂号</strong>」','选择<strong>科室</strong>和<strong>医生</strong>','确认时间并<strong>支付</strong>挂号费']},
  {id:4, icon:'🧹', title:'如何清理手机内存', desc:'手机变卡了？试试清理缓存', tags:['设置','3步'],
   steps:['打开手机「<strong>设置</strong>」','找到「<strong>存储空间</strong>」或「储存」','点击「<strong>清理缓存</strong>」或「一键优化」']}
];

function getTutorialData() {
  const custom = getCustomTutorials();
  const all = [...defaultTutorials];
  custom.forEach(t => {
    const existingIdx = all.findIndex(x => x.id === t.id);
    if (existingIdx >= 0) {
      all[existingIdx] = t;
    } else {
      all.push(t);
    }
  });
  return all;
}

function getCustomTutorials() {
  const data = loadData();
  return data.customTutorials || [];
}

function setCustomTutorials(tutorials) {
  const data = loadData();
  data.customTutorials = tutorials;
  saveData(data);
}

let selectedIcon = '📱';

function selectIcon(el, icon) {
  selectedIcon = icon;
  document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('active'));
  el.classList.add('active');
}

function showAddTutorialModal() {
  const modal = document.getElementById('addTutorialModal');
  if (modal) modal.classList.add('show');
  selectedIcon = '📱';
  document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('active'));
}

function hideAddTutorialModal() {
  const modal = document.getElementById('addTutorialModal');
  if (modal) modal.classList.remove('show');
  document.getElementById('newTutorialTitle').value = '';
  document.getElementById('newTutorialDesc').value = '';
  document.getElementById('newTutorialTags').value = '';
  document.getElementById('newTutorialSteps').value = '';
}

function addNewTutorial() {
  const title = document.getElementById('newTutorialTitle').value.trim();
  const desc = document.getElementById('newTutorialDesc').value.trim();
  const tagsInput = document.getElementById('newTutorialTags').value.trim();
  const stepsInput = document.getElementById('newTutorialSteps').value.trim();

  if (!title) {
    showToast('请输入教程标题', 'warn');
    return;
  }
  if (!stepsInput) {
    showToast('请输入步骤说明', 'warn');
    return;
  }

  const tags = tagsInput ? tagsInput.split(/\s+/).slice(0, 3) : [];
  const steps = stepsInput.split('\n').filter(s => s.trim()).map(s => s.trim());

  if (steps.length === 0) {
    showToast('步骤说明不能为空', 'warn');
    return;
  }

  const custom = getCustomTutorials();
  const maxId = Math.max(...defaultTutorials.map(t => t.id), ...custom.map(t => t.id), 0);
  const newTutorial = {
    id: maxId + 1,
    icon: selectedIcon,
    title,
    desc: desc || '自定义教程',
    tags,
    steps
  };

  custom.push(newTutorial);
  setCustomTutorials(custom);

  hideAddTutorialModal();
  renderTutorials();
  showToast('✅ 教程添加成功！', 'success');
}

/* ========================================
   Toast
   ======================================== */
let toastTimer = null;
function showToast(msg, type) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'toast';
  if (type) toast.classList.add(type);
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ========================================
   工具函数
   ======================================== */
function formatTime(sec) {
  sec = Math.floor(sec);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function updateClock() {
  const clockEl = document.getElementById('clock');
  if (!clockEl) return;
  const now = new Date();
  clockEl.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
}

function initClock() {
  updateClock();
  setInterval(updateClock, 30000);
}

/* ========================================
   页面导航
   ======================================== */
function goLogin() {
  const isInApp = window.location.pathname.includes('/app/');
  window.location.href = isInApp ? '../index.html' : 'index.html';
}

function goChildHome() {
  const isInApp = window.location.pathname.includes('/app/');
  window.location.href = isInApp ? 'child-home.html' : 'app/child-home.html';
}

function goElderHome() {
  const isInApp = window.location.pathname.includes('/app/');
  window.location.href = isInApp ? 'elder-home.html' : 'app/elder-home.html';
}

function goTutorials() {
  const isInApp = window.location.pathname.includes('/app/');
  window.location.href = isInApp ? 'tutorials.html' : 'app/tutorials.html';
}

function goHomeByRole() {
  const role = getCurrentRole();
  if (role === 'child') {
    goChildHome();
  } else if (role === 'elder') {
    goElderHome();
  } else {
    goLogin();
  }
}

function logout() {
  stopScreenShare();
  setCurrentRole(null);
  showToast('👋 已退出登录', 'warn');
  setTimeout(() => goLogin(), 500);
}

/* ========================================
   屏幕共享（手机端自动开启）
   ======================================== */
let screenShareStream = null;
let screenShareActive = false;

/* 检测是否为移动设备 */
function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
}

/* 获取屏幕共享状态 */
function isScreenSharing() {
  const data = loadData();
  return data.screenSharing || false;
}

/* 设置屏幕共享状态 */
function setScreenSharing(val) {
  const data = loadData();
  data.screenSharing = val;
  saveData(data);
}

/* 自动启动屏幕共享（手机端打开时调用） */
async function autoStartScreenShare() {
  if (screenShareActive) return;
  setScreenSharing(true);
  screenShareActive = true;

  /* 尝试使用真实的 getDisplayMedia API */
  if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
    try {
      screenShareStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: false
      });
      screenShareStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
      updateScreenShareIndicator(true, 'real');
      showToast('📺 屏幕共享已自动开启', 'success');
      return;
    } catch (e) {
      /* 用户拒绝或浏览器不支持，使用模拟模式 */
    }
  }

  /* 模拟模式：浏览器不支持或用户拒绝时 */
  updateScreenShareIndicator(true, 'simulated');
  showToast('📺 屏幕共享已自动开启', 'success');
}

/* 停止屏幕共享 */
function stopScreenShare() {
  if (screenShareStream) {
    screenShareStream.getTracks().forEach(t => t.stop());
    screenShareStream = null;
  }
  screenShareActive = false;
  setScreenSharing(false);
  updateScreenShareIndicator(false);
}

/* 手动切换屏幕共享 */
function toggleScreenShare() {
  if (screenShareActive) {
    stopScreenShare();
    showToast('📺 屏幕共享已关闭', 'warn');
  } else {
    autoStartScreenShare();
  }
}

/* 更新屏幕共享指示器 UI */
function updateScreenShareIndicator(active, mode) {
  const indicator = document.getElementById('screenShareIndicator');
  if (!indicator) return;
  if (active) {
    indicator.classList.add('active');
    const dot = indicator.querySelector('.ssi-dot');
    const text = indicator.querySelector('.ssi-text');
    if (dot) dot.textContent = '●';
    if (text) text.textContent = mode === 'real' ? '屏幕共享中' : '屏幕共享中（模拟）';
  } else {
    indicator.classList.remove('active');
    const dot = indicator.querySelector('.ssi-dot');
    const text = indicator.querySelector('.ssi-text');
    if (dot) dot.textContent = '○';
    if (text) text.textContent = '屏幕共享未开启';
  }
}

/* 初始化屏幕共享指示器（所有页面通用） */
function initScreenShareIndicator() {
  const indicator = document.getElementById('screenShareIndicator');
  if (!indicator) return;
  updateScreenShareIndicator(screenShareActive || isScreenSharing(), '');
  /* 检测移动端并自动启动 */
  if (isMobileDevice() && !screenShareActive) {
    setTimeout(() => autoStartScreenShare(), 800);
  }
}

/* ========================================
   登录
   ======================================== */
function login(role) {
  setCurrentRole(role);
  if (role === 'child') {
    setHasNewForChild(false);
  } else {
    setHasNewForElder(false);
  }
  showToast(role === 'child' ? '👋 欢迎回来，子女端' : '👋 欢迎回来，长辈端', 'success');
  setTimeout(() => goHomeByRole(), 400);
}

/* ========================================
   教程渲染（教程库页用）
   ======================================== */
let learnedSteps = {};

function loadLearnedSteps() {
  learnedSteps = getLearnedSteps();
}

function saveLearnedSteps() {
  setLearnedStepsObj(learnedSteps);
}

function renderTutorials() {
  loadLearnedSteps();
  const list = document.getElementById('tutorialList');
  if (!list) return;
  const tutorials = getTutorialData();
  list.innerHTML = tutorials.map(t => {
    const done = learnedSteps[t.id] && learnedSteps[t.id].size === t.steps.length;
    return `
    <div class="tutorial-card ${done?'learned':''}" id="tc-${t.id}" onclick="toggleTutorial(${t.id})">
      <div class="t-header">
        <div class="t-icon">${t.icon}</div>
        <div class="t-info">
          <div class="t-title">${t.title}</div>
          <div class="t-desc">${t.desc}</div>
          <div class="t-tags">${t.tags.map(tag => `<span class="t-tag ${done?'done':''}">${done?'✓ ':''}${tag}</span>`).join('')}</div>
        </div>
        <div class="t-toggle">▼</div>
      </div>
      <div class="t-body"><div class="t-steps-list">
        ${t.steps.map((s,i) => {
          const sd = learnedSteps[t.id] && learnedSteps[t.id].has(i);
          return `<div class="t-step-row ${sd?'done':''}" onclick="event.stopPropagation();toggleStep(${t.id},${i})">
            <div class="t-step-num"><span>${i+1}</span></div><div class="t-step-text">${s}</div></div>`;
        }).join('')}
        <div class="t-progress">
          <div class="t-progress-bar"><div class="t-progress-fill" id="prog-${t.id}"></div></div>
          <div class="t-progress-text" id="prog-text-${t.id}">0/${t.steps.length}</div>
        </div>
      </div></div>
    </div>`;
  }).join('');
  tutorials.forEach(t => updateTutorialProgress(t.id));
  updateLearnedList();
  updateLearnedCount();
}

function toggleTutorial(id) {
  const card = document.getElementById('tc-' + id);
  if (card) card.classList.toggle('open');
}

function toggleStep(tid, idx) {
  if (!learnedSteps[tid]) learnedSteps[tid] = new Set();
  if (learnedSteps[tid].has(idx)) {
    learnedSteps[tid].delete(idx);
  } else {
    learnedSteps[tid].add(idx);
  }
  saveLearnedSteps();
  renderTutorials();
  const card = document.getElementById('tc-' + tid);
  if (card) card.classList.add('open');
}

function updateTutorialProgress(id) {
  const tutorials = getTutorialData();
  const t = tutorials.find(x => x.id === id);
  if (!t) return;
  const total = t.steps.length;
  const done = learnedSteps[id] ? learnedSteps[id].size : 0;
  const bar = document.getElementById('prog-' + id);
  const text = document.getElementById('prog-text-' + id);
  if (bar) bar.style.width = (done / total * 100) + '%';
  if (text) text.textContent = `${done}/${total}`;
}

function updateLearnedList() {
  const list = document.getElementById('learnedList');
  if (!list) return;
  const tutorials = getTutorialData();
  const learned = tutorials.filter(t => learnedSteps[t.id] && learnedSteps[t.id].size === t.steps.length);
  if (learned.length === 0) {
    list.innerHTML = '<div style="padding:0 1rem;color:var(--muted);font-size:0.82rem">暂无已学教程，点击上方卡片开始学习</div>';
    return;
  }
  list.innerHTML = learned.map(t => `<div class="learned-item"><div class="li-check">✓</div><span>${t.icon} ${t.title}</span></div>`).join('');
}

function updateLearnedCount() {
  const countEl = document.getElementById('learnedCount');
  if (!countEl) return;
  const tutorials = getTutorialData();
  const count = tutorials.filter(t => learnedSteps[t.id] && learnedSteps[t.id].size === t.steps.length).length;
  countEl.textContent = `已学 ${count}/${tutorials.length}`;
}

/* ========================================
   求助历史渲染
   ======================================== */
function renderHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;
  const history = getHistory();
  if (history.length === 0) {
    list.innerHTML = '<div style="padding:0 1rem;color:var(--muted);font-size:0.82rem">暂无求助记录</div>';
    return;
  }
  list.innerHTML = history.map(h => `
    <div class="history-item">
      <div class="hi-icon">${h.icon}</div>
      <div class="hi-content">
        <div class="hi-title">${h.title}</div>
        <div class="hi-time">${h.time}</div>
      </div>
      <div class="hi-status ${h.resolved?'resolved':'pending'}">${h.resolved?'已解决':'待解决'}</div>
    </div>
  `).join('');
}

/* ========================================
   状态横幅渲染
   ======================================== */
function renderBanner() {
  const banner = document.getElementById('banner');
  if (!banner) return;
  const role = getCurrentRole();
  const appState = getAppState();
  banner.className = 'banner';
  if (role === 'child') {
    if (appState === STATE.HELP_SENT) {
      banner.classList.add('show', 'warn');
      banner.innerHTML = '📥 妈妈刚刚发来求助截图，请标注后回复';
    } else if (appState === STATE.REPLY_SENT) {
      banner.classList.add('show', 'success');
      banner.innerHTML = '✅ 你已回复妈妈，等待她操作';
    }
  } else if (role === 'elder') {
    if (appState === STATE.HELP_SENT) {
      banner.classList.add('show', 'info');
      banner.innerHTML = '⏳ 截图已发送，等待女儿回复...';
    } else if (appState === STATE.REPLY_SENT) {
      banner.classList.add('show', 'success');
      banner.innerHTML = '📩 女儿已回复你的求助，请查看下方';
    }
  }
}
