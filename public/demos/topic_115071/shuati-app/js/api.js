/* ============== 刷题 App · 核心：配置、状态、存储、工具 ============== */

// ========== 配置常量 ==========
const CONFIG = {
  DEDUP_STEM_PREFIX_LEN: 30,
  HISTORY_MAX_ITEMS: 50,
  PREVIEW_MAX_ITEMS: 8,
  WRONGBOOK_MASTERED_THRESHOLD: 2,
  PDF_LINE_TOLERANCE: 5,
  BADGE_MAX_DISPLAY: 99,
  SVG_RING_RADIUS: 52,
  SAVE_RESULTS_DEBOUNCE_MS: 300,
  SAVE_PROGRESS_DEBOUNCE_MS: 500,
  LS_BANK: 'shuati_bank_v1',
  LS_HIST: 'shuati_history_v1',
  LS_WB: 'shuati_wrongbook_v1',
  LS_PROG: 'shuati_progress_v1',
  LS_RESULTS: 'shuati_results_v1',
  LS_LAST_RESULT: 'shuati_lastResult_v1',
  LS_STARRED: 'shuati_starred_v1',
  LS_THEME: 'shuati_theme',
};

// SVG 环形图周长（预计算）
CONFIG.SVG_RING_CIRCUMFERENCE = 2 * Math.PI * CONFIG.SVG_RING_RADIUS;

// ========== 工具函数 ==========
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sortByNo(arr) {
  return [...arr].sort((a, b) => {
    const na = parseInt(a.no, 10) || 0;
    const nb = parseInt(b.no, 10) || 0;
    return na - nb;
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));
}

// Toast 通知（替代 alert）
let _toastTimer = null;
function toast(msg, kind) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = 'toast ' + (kind || '');
  el.textContent = msg;
  container.appendChild(el);
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    el.classList.add('fadeout');
    el.addEventListener('animationend', () => el.remove());
  }, 2500);
}

function debounce(fn, delay) {
  let timer;
  const debounced = function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
  debounced.cancel = () => { clearTimeout(timer); };
  debounced.flush = function(...args) {
    clearTimeout(timer);
    return fn.apply(this, args);
  };
  return debounced;
}

// ========== 后端 API 客户端 ==========
const API_BASE = (location.protocol === 'file:' || (location.hostname === 'localhost' && location.port === '8765'))
  ? 'http://localhost:8766'
  : ''; // 同源

async function api(path, opts = {}) {
  try {
    const url = (API_BASE || '') + path;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    console.warn('[API] ' + path + ' 调用失败:', err.message);
    return null;
  }
}

// ========== 全局状态 ==========
const state = {
  bank: [],          // 全部题库 {id, type, stem, options, answer, explanation, source, group}
  groups: {},        // 分组索引 { groupName: [q1, q2, ...] }
  currentGroup: null,// 当前分组名（null = 全部）
  results: {},       // 按分组存作答 { groupName: { qid: {given, correct, _undo} } }
  quizBank: null,    // 当前刷题集（顺序/乱序/考试/收藏/错题 等子集）；主库 state.bank 永不被覆盖
  current: 0,        // 当前题号（组内索引）
  history: [],       // 历史成绩
  lastRawText: '',   // 最近解析的原始文本
  quizOrder: 'sequential',
  wrongbook: [],     // 错题本
  practiceMode: 'normal',
  autoNext: false,   // 选择后自动跳转下一题
  progress: {},      // { groupName: { total, done, correct, lastQid, lastIdx, updatedAt } }
  online: false,
  lastResult: null,
  quizStartedAt: 0,  // 本次答题开始时间戳
  quizElapsed: 0,    // 本次答题已用秒数
  starred: {},       // 收藏 { qid: true }
  examMode: false,   // 模拟考试模式
  examCount: 20,     // 抽题数量
  examTimeLimit: 0,  // 考试限时（分钟），0=不限时
};

// ========== 分组相关 ==========
function getGroupBank() {
  if (!state.currentGroup || state.currentGroup === '__all__') return state.bank;
  return state.groups[state.currentGroup] || [];
}

// 当前刷题集：优先返回子集（考试/收藏/错题等），否则返回当前分组主库
function getQuizList() {
  return state.quizBank || getGroupBank();
}

function getGroupResults() {
  const g = state.currentGroup || '__all__';
  return state.results[g] || {};
}

function setGroupResult(qid, given, correct) {
  const g = state.currentGroup || '__all__';
  if (!state.results[g]) state.results[g] = {};
  state.results[g][qid] = { given, correct };
}

function clearGroupResults() {
  const g = state.currentGroup || '__all__';
  state.results[g] = {};
}

function getGroupDone() {
  const r = getGroupResults();
  return Object.values(r).filter(x => x && x.given && x.given.length > 0).length;
}

function getGroupDoneFor(groupName) {
  const r = state.results[groupName] || {};
  return Object.values(r).filter(x => x && x.given && x.given.length > 0).length;
}

function rebuildGroups() {
  state.groups = {};
  state.bank.forEach(q => {
    const g = q.group || '未分组';
    if (!state.groups[g]) state.groups[g] = [];
    state.groups[g].push(q);
  });
}

// ========== 收藏 ==========
function isStarred(qid) { return !!state.starred[qid]; }
function toggleStar(qid) {
  if (state.starred[qid]) delete state.starred[qid];
  else state.starred[qid] = true;
  saveStarred();
}
function getStarredQuestions() {
  return state.bank.filter(q => state.starred[q.id]);
}
function saveStarred() {
  localStorage.setItem(CONFIG.LS_STARRED, JSON.stringify(state.starred));
  if (state.online) api('/api/starred', { method: 'PUT', body: JSON.stringify(state.starred) });
}

// ========== 保存指示器 ==========
let _pendingSaves = 0;

function showSaveIndicator() {
  const el = document.getElementById('saveIndicator');
  if (!el) return;
  _pendingSaves++;
  el.classList.add('saving');
}

function hideSaveIndicator() {
  _pendingSaves = Math.max(0, _pendingSaves - 1);
  if (_pendingSaves === 0) {
    const el = document.getElementById('saveIndicator');
    if (el) el.classList.remove('saving');
  }
}

// ========== 持久化保存（带防抖） ==========
function _doSaveResults() {
  // 落盘前剥离 _undo 等临时字段，避免污染 localStorage / 后端
  const cleaned = {};
  for (const g of Object.keys(state.results)) {
    const grp = state.results[g];
    if (grp && typeof grp === 'object') {
      cleaned[g] = {};
      for (const qid of Object.keys(grp)) {
        const { _undo, ...rest } = grp[qid] || {};
        cleaned[g][qid] = rest;
      }
    }
  }
  localStorage.setItem(CONFIG.LS_RESULTS, JSON.stringify(cleaned));
  const promise = api('/api/results', { method: 'PUT', body: JSON.stringify(cleaned) });
  promise.finally(hideSaveIndicator);
}

function _doSaveProgress() {
  localStorage.setItem(CONFIG.LS_PROG, JSON.stringify(state.progress));
  const promise = api('/api/progress', { method: 'PUT', body: JSON.stringify(state.progress) });
  promise.finally(hideSaveIndicator);
}

const saveResultsDebounced = debounce(_doSaveResults, CONFIG.SAVE_RESULTS_DEBOUNCE_MS);
const saveProgressDebounced = debounce(_doSaveProgress, CONFIG.SAVE_PROGRESS_DEBOUNCE_MS);

/** 保存作答记录（高频：每次点击选项调用） */
function saveResults() {
  updateTopProgress();
  updateQuizProgress();
  showSaveIndicator();
  saveResultsDebounced();
}

function saveResultsNow() { saveResultsDebounced.cancel(); _doSaveResults(); }
function saveProgress() { updateTopProgress(); showSaveIndicator(); saveProgressDebounced(); }
function saveProgressNow() { saveProgressDebounced.cancel(); _doSaveProgress(); }

function saveBank() {
  localStorage.setItem(CONFIG.LS_BANK, JSON.stringify(state.bank));
  api('/api/bank', { method: 'PUT', body: JSON.stringify(state.bank) });
}

function saveHistory() {
  localStorage.setItem(CONFIG.LS_HIST, JSON.stringify(state.history));
  api('/api/history', { method: 'PUT', body: JSON.stringify(state.history) });
}

function saveWrongbook() {
  localStorage.setItem(CONFIG.LS_WB, JSON.stringify(state.wrongbook));
  api('/api/wrongbook', { method: 'PUT', body: JSON.stringify(state.wrongbook) });
  updateWrongbookBadge();
}

// ========== 顶部进度条 ==========
function updateTopProgress() {
  const elFill = document.getElementById('topProgressFill');
  const elStat = document.getElementById('topProgressStat');
  if (!elFill || !elStat) return;
  const bank = getQuizList();
  const total = bank.length;
  const done = getGroupDone();
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  elFill.style.width = pct + '%';
  elStat.textContent = total > 0 ? `${done}/${total} · ${pct}%` : '';
}

function setConnBadge() {
  const el = document.getElementById('topProgressConn');
  if (!el) return;
  el.classList.toggle('online', !!state.online);
  el.classList.toggle('offline', !state.online);
  el.textContent = '●';
  el.title = state.online ? '后端已连接 · 数据已同步' : '后端离线 · 数据仅存于本机';
}

function updateQuizProgress() {
  const elFill = document.getElementById('quizBarFill');
  const elPct = document.getElementById('quizPct');
  if (!elFill || !elPct) return;
  const bank = getQuizList();
  const total = bank.length;
  const done = getGroupDone();
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  elFill.style.width = pct + '%';
  elPct.textContent = pct + '%';
}

function updateWrongbookBadge() {
  const badge = document.getElementById('wbBadge');
  if (!badge) return;
  const count = (state.wrongbook || []).filter(w => !w.mastered).length;
  if (count > 0) { badge.hidden = false; badge.textContent = count > CONFIG.BADGE_MAX_DISPLAY ? '99+' : count; }
  else { badge.hidden = true; }
}

// ========== 全局进度概览 ==========
function getGlobalOverview() {
  let totalQ = 0, totalDone = 0, totalCorrect = 0;
  for (const g of Object.keys(state.groups)) {
    const bank = state.groups[g] || [];
    const results = state.results[g] || {};
    const done = Object.values(results).filter(x => x && x.given && x.given.length > 0).length;
    const correct = Object.values(results).filter(x => x && x.correct).length;
    totalQ += bank.length; totalDone += done; totalCorrect += correct;
  }
  return { totalQ, totalDone, totalCorrect,
    donePct: totalQ > 0 ? Math.round((totalDone / totalQ) * 100) : 0,
    correctPct: totalDone > 0 ? Math.round((totalCorrect / totalDone) * 100) : 0,
  };
}

// ========== 统计分析 ==========
function getStats() {
  const stats = { byGroup: {}, byType: { single: {total:0,correct:0}, multiple: {total:0,correct:0}, judge: {total:0,correct:0} } };
  for (const g of Object.keys(state.groups)) {
    const bank = state.groups[g] || [];
    const results = state.results[g] || {};
    let gTotal = 0, gCorrect = 0;
    bank.forEach(q => {
      const r = results[q.id];
      if (r && r.given && r.given.length > 0) {
        gTotal++;
        if (r.correct) gCorrect++;
        const t = q.type || 'single';
        if (!stats.byType[t]) stats.byType[t] = { total: 0, correct: 0 };
        stats.byType[t].total++;
        if (r.correct) stats.byType[t].correct++;
      }
    });
    stats.byGroup[g] = { total: gTotal, correct: gCorrect, pct: gTotal > 0 ? Math.round((gCorrect / gTotal) * 100) : 0 };
  }
  return stats;
}

// ========== 页面关闭前刷盘 ==========
window.addEventListener('beforeunload', () => { saveResultsNow(); saveProgressNow(); });
window.addEventListener('pagehide', () => { saveResultsNow(); saveProgressNow(); });

// ========== 从存储加载 ==========
async function loadFromStorage() {
  const remote = await api('/api/all');
  if (remote) {
    state.online = true;
    state.bank = remote.bank || [];
    state.history = remote.history || [];
    state.wrongbook = remote.wrongbook || [];
    state.progress = remote.progress || {};
    if (remote.results && typeof remote.results === 'object') state.results = remote.results;
    else try { state.results = JSON.parse(localStorage.getItem(CONFIG.LS_RESULTS) || '{}'); } catch { state.results = {}; }
    if (remote.starred && typeof remote.starred === 'object') state.starred = remote.starred;
    console.log('[已从后端加载]', { bank: state.bank.length, wrongbook: state.wrongbook.length, history: state.history.length });
  } else {
    state.online = false;
    try {
      state.bank = JSON.parse(localStorage.getItem(CONFIG.LS_BANK) || '[]');
      state.history = JSON.parse(localStorage.getItem(CONFIG.LS_HIST) || '[]');
      state.wrongbook = JSON.parse(localStorage.getItem(CONFIG.LS_WB) || '[]');
      state.progress = JSON.parse(localStorage.getItem(CONFIG.LS_PROG) || '{}') || {};
      state.results = JSON.parse(localStorage.getItem(CONFIG.LS_RESULTS) || '{}');
      state.starred = JSON.parse(localStorage.getItem(CONFIG.LS_STARRED) || '{}');
    } catch { /* ignore */ }
    console.warn('[后端不可用，使用 localStorage 降级]');
  }
  rebuildGroups();
  state.bank = state.bank.map(q => ({
    ...q, answer: Array.isArray(q.answer) ? q.answer : [], options: Array.isArray(q.options) ? q.options : [],
  }));
  rebuildGroups();
  const groupNames = Object.keys(state.groups);
  if (groupNames.length > 0 && !state.currentGroup) state.currentGroup = groupNames[0];
  updateTopProgress(); setConnBadge(); renderGroupSelector();
}

// ========== 主题 ==========
function initTheme() {
  const saved = localStorage.getItem(CONFIG.LS_THEME);
  if (saved) document.documentElement.dataset.theme = saved;
  else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.dataset.theme = 'dark';
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem(CONFIG.LS_THEME)) document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
    });
  }
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem(CONFIG.LS_THEME, next); updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;
  const isDark = document.documentElement.dataset.theme === 'dark';
  btn.textContent = isDark ? '☀️' : '🌙';
  btn.title = isDark ? '切换到亮色模式' : '切换到暗色模式';
}
