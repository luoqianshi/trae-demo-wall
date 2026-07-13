/* ============== 刷题 App · 视图与交互 ============== */

// ========== 模态框焦点管理 ==========
function _getFocusable(modal) {
  return [...modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(el => !el.disabled && el.offsetParent !== null);
}
function modalFocusIn(modal) {
  modal._returnFocus = document.activeElement;
  const f = _getFocusable(modal);
  if (f.length) f[0].focus();
}
function modalFocusOut(modal) {
  if (modal._returnFocus && document.contains(modal._returnFocus)) { try { modal._returnFocus.focus(); } catch {} }
  modal._returnFocus = null;
}
// 全局 Tab 焦点陷阱 + Esc 关闭（覆盖所有模态框，不受 quiz 视图限制）
document.addEventListener('keydown', (e) => {
  const modalIds = ['submitModal', 'editQModal', 'exportModal', 'rawModal'];
  const open = modalIds.map(id => document.getElementById(id)).find(m => m && !m.hidden);
  if (!open) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    if (open.id === 'submitModal') closeSubmitModal();
    else if (open.id === 'editQModal') closeEditQModal();
    else if (open.id === 'exportModal') closeExportModal();
    else if (open.id === 'rawModal') { open.hidden = true; open.style.display = 'none'; modalFocusOut(open); }
  }
  if (e.key === 'Tab') {
    const f = _getFocusable(open);
    if (f.length === 0) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

window.addEventListener('error', (e) => {
  console.error('[全局错误]', e.error || e.message, e.filename, e.lineno + ':' + e.colno);
  const status = document.getElementById('parseStatus');
  if (status && !status.hidden) showStatus('运行时错误：' + (e.message || e.error?.message || '未知'), 'err');
});

// ========== 统一选项渲染 ==========
function renderOptionsHTML(q, opts = {}) {
  const mode = opts.mode || 'quiz';
  const given = opts.given || [];
  const correct = opts.correct;
  const answered = opts.answered !== undefined ? opts.answered : (given && given.length > 0);
  const answerKeys = q.answer || [];

  return (q.options || []).map(o => {
    const isKey = answerKeys.includes(o.key);
    const isUser = given.includes(o.key);
    const isUserWrong = isUser && correct === false;
    let cls = 'opt'; let badge = '';
    if (mode === 'quiz') { if (isUser) cls += ' selected'; }
    else if (mode === 'wrongbook') { if (isKey) { cls += ' is-key'; badge = '<span class="ok key">正确答案</span>'; } }
    else if (mode === 'result') {
      if (isKey) { cls += ' is-key'; badge = '<span class="ok">正确答案</span>'; }
      if (isUserWrong) { cls += ' is-you-wrong'; badge = '<span class="ok you">你的错选</span>'; }
      else if (isUser && correct) cls += ' is-you-right';
    }
    return `<div class="${cls}" data-key="${o.key}"><span class="opt-key">${o.key}</span><span>${escapeHtml(o.text)}</span>${badge}</div>`;
  }).join('');
}

// ========== 视图切换 ==========
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

function switchView(name) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
  if (name === 'upload') {
    pauseTimer();
    pruneSyntheticState();
    state.quizBank = null;
    if (state.currentGroup && state.currentGroup.startsWith('__')) {
      const names = Object.keys(state.groups).filter(g => !g.startsWith('__'));
      state.currentGroup = names.length > 0 ? names[0] : null;
    }
    renderUpload();
  }
  if (name === 'quiz') { startTimer(); renderQuizFull(); }
  if (name === 'result') { pauseTimer(); renderResult(); renderStats(); }
  if (name === 'wrongbook') { pauseTimer(); renderWrongbook(); }
  updateWrongbookBadge();
}

// ========== 清理合成分组/结果/进度 ==========
function pruneSyntheticState() {
  let pruned = false;
  for (const k of Object.keys(state.results)) if (k.startsWith('__')) { delete state.results[k]; pruned = true; }
  for (const k of Object.keys(state.progress)) if (k.startsWith('__')) { delete state.progress[k]; pruned = true; }
  for (const k of Object.keys(state.groups)) if (k.startsWith('__')) { delete state.groups[k]; pruned = true; }
  if (pruned) { saveResults(); saveProgress(); }
}

// ========== 键盘快捷键 ==========
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    const quizView = document.getElementById('view-quiz');
    if (!quizView || !quizView.classList.contains('active')) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (document.activeElement?.isContentEditable) return;

    const bank = getQuizList();
    const q = bank[state.current];
    if (!q) return;

    if (['1','2','3','4'].includes(e.key) || ['Numpad1','Numpad2','Numpad3','Numpad4'].includes(e.code)) {
      e.preventDefault();
      const idx = (e.code || e.key).replace('Numpad', '').charCodeAt(0) - '1'.charCodeAt(0);
      const key = String.fromCharCode('A'.charCodeAt(0) + idx);
      if (idx >= 0 && idx < (q.options || []).length) selectOption(key);
    }
    if (['a','b','c','d'].includes(e.key.toLowerCase()) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const key = e.key.toUpperCase();
      if (q.options.some(o => o.key === key)) selectOption(key);
    }
    if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); if (state.current > 0) { state.current--; renderQuizFull(); } }
    if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); if (state.current < bank.length - 1) { state.current++; renderQuizFull(); } else openSubmitModal(); }
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); if (state.current < bank.length - 1) { state.current++; renderQuizFull(); } else openSubmitModal(); }
    if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undoSelection(); }
    if (e.key === 's' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); toggleStar(q.id); updateStarButton(); }
    if (e.key === 'Escape') {
      const submitModal = document.getElementById('submitModal');
      const editQModal = document.getElementById('editQModal');
      const exportModal = document.getElementById('exportModal');
      if (exportModal && !exportModal.hidden) closeExportModal();
      else if (editQModal && !editQModal.hidden) closeEditQModal();
      else if (submitModal && !submitModal.hidden) closeSubmitModal();
    }
  });
}

// ========== 选项选择 ==========
function selectOption(key) {
  const q = getQuizList()[state.current];
  if (!q) return;
  const groupResults = getGroupResults();
  const r = groupResults[q.id];
  if (!r) return;
  r._undo = [...r.given];
  if (q.type === 'multiple') { const idx = r.given.indexOf(key); if (idx >= 0) r.given.splice(idx, 1); else r.given.push(key); }
  else { r.given = [key]; }
  r.given.sort();
  setGroupResult(q.id, r.given, r.correct);
  saveResults();
  const g = state.currentGroup || '__all__';
  if (!state.progress[g]) state.progress[g] = {};
  state.progress[g].lastQid = q.id; state.progress[g].lastIdx = state.current;
  saveProgress();
  updateQuizOptions(); updateSideCell(state.current); updateQuizNav();
  // 自动下一题
  if (state.autoNext && q.type !== 'multiple') {
    const bank = getQuizList();
    setTimeout(() => { if (state.current < bank.length - 1) { state.current++; renderQuizFull(); } else openSubmitModal(); }, 300);
  }
}

function undoSelection() {
  const q = getQuizList()[state.current];
  if (!q) return;
  const groupResults = getGroupResults();
  const r = groupResults[q.id];
  if (!r || !r._undo) return;
  r.given = r._undo; delete r._undo;
  setGroupResult(q.id, r.given, r.correct);
  saveResults(); updateQuizOptions(); updateSideCell(state.current); updateQuizNav();
}

// ========== 收藏 ==========
function updateStarButton() {
  const btn = document.getElementById('starToggleBtn');
  if (!btn) return;
  const q = getQuizList()[state.current];
  if (!q) return;
  const starred = isStarred(q.id);
  btn.textContent = starred ? '★' : '☆';
  btn.title = starred ? '取消收藏' : '收藏本题';
  btn.classList.toggle('starred', starred);
}

// ========== 答题计时器 ==========
let _timerInterval = null;
let _examTimerRemaining = 0; // 考试倒计时剩余秒数

function updateTimerDisplay() {
  const el = document.getElementById('quizTimer');
  if (!el) return;
  if (state.examMode && state.examTimeLimit > 0 && _examTimerRemaining <= 0 && state.quizStartedAt > 0) {
    // 考试时间到，自动交卷
    el.textContent = '⏰ 时间到';
    el.style.color = 'var(--bad)';
    submitQuiz();
    return;
  }
  let elapsed;
  if (state.examMode && state.examTimeLimit > 0) {
    elapsed = _examTimerRemaining;
    el.style.color = elapsed < 60 ? 'var(--bad)' : 'var(--ink-3)';
    el.textContent = `⏱ ${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  } else {
    elapsed = state.quizElapsed + (state.quizStartedAt ? Math.floor((Date.now() - state.quizStartedAt) / 1000) : 0);
    el.style.color = 'var(--ink-3)';
    el.textContent = `⏱ ${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  }
}

function startTimer() {
  if (state.examMode && state.examTimeLimit > 0) {
    _examTimerRemaining = state.examTimeLimit * 60;
  }
  state.quizStartedAt = Date.now();
  if (_timerInterval) clearInterval(_timerInterval);
  _timerInterval = setInterval(() => {
    if (state.examMode && state.examTimeLimit > 0 && state.quizStartedAt > 0) {
      const elapsed = Math.floor((Date.now() - state.quizStartedAt) / 1000);
      _examTimerRemaining = Math.max(0, state.examTimeLimit * 60 - elapsed);
      if (_examTimerRemaining <= 0) {
        updateTimerDisplay();
        clearInterval(_timerInterval);
        submitQuiz();
        return;
      }
    }
    updateTimerDisplay();
  }, 1000);
  updateTimerDisplay();
}

function pauseTimer() {
  if (state.quizStartedAt) { state.quizElapsed += Math.floor((Date.now() - state.quizStartedAt) / 1000); state.quizStartedAt = 0; }
  if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
}

function resetTimer() {
  if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
  state.quizStartedAt = 0; state.quizElapsed = 0;
  _examTimerRemaining = state.examTimeLimit * 60;
  updateTimerDisplay();
}

function getElapsedSeconds() {
  return state.quizElapsed + (state.quizStartedAt ? Math.floor((Date.now() - state.quizStartedAt) / 1000) : 0);
}

// ========== 刷题视图 ==========
const quizIndex = document.getElementById('quizIndex');
const quizTotal = document.getElementById('quizTotal');
const quizType = document.getElementById('quizType');
const quizStem = document.getElementById('quizStem');
const quizOptions = document.getElementById('quizOptions');
const prevQBtn = document.getElementById('prevQBtn');
const nextQBtn = document.getElementById('nextQBtn');
const quitQuizBtn = document.getElementById('quitQuizBtn');

function renderQuizFull() {
  const bank = getQuizList();
  if (!bank || bank.length === 0) { switchView('upload'); return; }
  const q = bank[state.current];
  if (!q) { switchView('upload'); return; }
  const groupResults = getGroupResults();
  if (!groupResults[q.id]) setGroupResult(q.id, [], false);
  const r = groupResults[q.id];
  const total = bank.length;
  quizIndex.textContent = state.current + 1;
  quizTotal.textContent = total;
  const typeLabel = q.type === 'multiple' ? '多选题' : q.type === 'judge' ? '判断题' : '单选题';
  quizType.innerHTML = typeLabel + (q.type === 'multiple' ? ' <span class="multi-tag">多选</span>' : '') + (isStarred(q.id) ? ' <span class="star-badge">★ 收藏</span>' : '');
  quizStem.textContent = (q.no ? q.no + '. ' : '') + q.stem;
  quizOptions.innerHTML = renderOptionsHTML(q, { mode: 'quiz', given: r.given });
  quizOptions.querySelectorAll('.option, .opt').forEach(el => {
    el.addEventListener('click', () => { const k = el.dataset.key; if (k) selectOption(k); });
  });
  prevQBtn.disabled = state.current === 0;
  nextQBtn.textContent = state.current === bank.length - 1 ? '交卷' : '下一题';
  // 侧栏：进入新刷题集时构建一次，否则仅更新当前格高亮（避免每次切题全量重建）
  const grid = document.getElementById('sideGrid');
  if (_needSideRebuild || !grid || grid.children.length !== bank.length) { buildSideGrid(); _needSideRebuild = false; }
  else { updateSideCurrent(); }
  updateQuizProgress(); updateTimerDisplay(); updateStarButton();
  prefetchAdjacent(state.current, bank.length);
}

function updateQuizOptions() {
  const q = getQuizList()[state.current];
  if (!q) return;
  const groupResults = getGroupResults();
  const r = groupResults[q.id];
  if (!r) return;
  quizOptions.querySelectorAll('.option, .opt').forEach(el => {
    const key = el.dataset.key || (el.querySelector('.opt-key')?.textContent || '');
    el.classList.toggle('selected', r.given.includes(key));
  });
}

// 侧栏状态缓存（避免每次切题 O(n) 重算）
const _sideStat = { done: 0, star: 0, total: 0 };
let _lastCurrentIdx = null;
let _needSideRebuild = false;

function updateSideStats() {
  const d = document.getElementById('statDone'); if (d) d.textContent = _sideStat.done;
  const t = document.getElementById('statTodo'); if (t) t.textContent = (_sideStat.total - _sideStat.done);
  const s = document.getElementById('statStar'); if (s) s.textContent = _sideStat.star;
}

function updateSideCell(idx) {
  const grid = document.getElementById('sideGrid');
  if (!grid) return;
  const cell = grid.querySelector(`.side-cell[data-idx="${idx}"]`);
  if (!cell) return;
  const bank = getQuizList();
  const groupResults = getGroupResults();
  const q = bank[idx];
  if (!q) return;
  const r = groupResults[q.id];
  const answered = !!(r && r.given && r.given.length > 0);
  const wasDone = cell.classList.contains('done');
  cell.classList.toggle('done', answered);
  cell.classList.toggle('todo', !answered);
  const wasStar = cell.classList.contains('starred');
  const nowStar = isStarred(q.id);
  cell.classList.toggle('starred', nowStar);
  if (wasDone !== answered) _sideStat.done += answered ? 1 : -1;
  if (wasStar !== nowStar) _sideStat.star += nowStar ? 1 : -1;
  updateSideStats();
}

function updateSideCurrent() {
  const grid = document.getElementById('sideGrid');
  if (!grid) return;
  if (_lastCurrentIdx != null) {
    const prev = grid.querySelector(`.side-cell[data-idx="${_lastCurrentIdx}"]`);
    if (prev) prev.classList.remove('current');
  }
  const cur = grid.querySelector(`.side-cell[data-idx="${state.current}"]`);
  if (cur) cur.classList.add('current');
  _lastCurrentIdx = state.current;
}

function buildSideGrid() {
  const grid = document.getElementById('sideGrid');
  if (!grid) return;
  const bank = getQuizList();
  const total = bank.length;
  const groupResults = getGroupResults();
  let doneCount = 0, starCount = 0;
  const cells = bank.map((q, i) => {
    const r = groupResults[q.id];
    const answered = r && r.given && r.given.length > 0;
    if (answered) doneCount++;
    const starred = isStarred(q.id);
    if (starred) starCount++;
    return `<div class="side-cell ${answered ? 'done' : 'todo'} ${starred ? 'starred' : ''} ${i === state.current ? 'current' : ''}" data-idx="${i}">${q.no || (i + 1)}</div>`;
  }).join('');
  grid.innerHTML = cells;
  _sideStat.done = doneCount; _sideStat.star = starCount; _sideStat.total = total;
  _lastCurrentIdx = state.current;
  updateSideStats();
  grid.onclick = (e) => { const cell = e.target.closest('.side-cell'); if (!cell) return; const idx = parseInt(cell.dataset.idx, 10); if (!isNaN(idx) && idx >= 0 && idx < total) { state.current = idx; renderQuizFull(); } };
}

function updateQuizNav() {
  const bank = getQuizList();
  prevQBtn.disabled = state.current === 0;
  nextQBtn.textContent = state.current === bank.length - 1 ? '交卷' : '下一题';
  quizIndex.textContent = state.current + 1;
  updateQuizProgress();
}

const _prefetchCache = new Map();
function prefetchAdjacent(idx, total) {
  _prefetchCache.clear();
  const bank = getQuizList();
  const groupResults = getGroupResults();
  [idx - 1, idx + 1].forEach(i => {
    if (i < 0 || i >= total) return;
    const q = bank[i];
    const r = groupResults[q.id] || { given: [] };
    _prefetchCache.set(i, { stem: (q.no ? q.no + '. ' : '') + q.stem, optionsHTML: renderOptionsHTML(q, { mode: 'quiz', given: r.given }) });
  });
}

// ========== 导航按钮 ==========
prevQBtn.addEventListener('click', () => { if (state.current > 0) { state.current--; renderQuizFull(); } });
nextQBtn.addEventListener('click', () => { const bank = getQuizList(); if (state.current < bank.length - 1) { state.current++; renderQuizFull(); } else openSubmitModal(); });
quitQuizBtn.addEventListener('click', () => openSubmitModal());

// 收藏按钮
document.getElementById('starToggleBtn').addEventListener('click', () => {
  const q = getQuizList()[state.current];
  if (!q) return;
  toggleStar(q.id);
  updateStarButton();
  updateSideCell(state.current);
});

// 编辑按钮
document.getElementById('editQBtn').addEventListener('click', () => {
  const q = getQuizList()[state.current];
  if (!q) return;
  openEditQModal(q);
});

// 自动跳转
const autoNextToggle = document.getElementById('autoNextToggle');
if (autoNextToggle) { autoNextToggle.checked = state.autoNext; autoNextToggle.addEventListener('change', () => { state.autoNext = autoNextToggle.checked; }); }

// 分组切换
document.getElementById('groupSelect').addEventListener('change', (e) => {
  const newGroup = e.target.value;
  if (newGroup && state.groups[newGroup]) { state.currentGroup = newGroup; state.quizBank = null; state.current = 0; _needSideRebuild = true; renderQuizFull(); updateTopProgress(); }
});

// 侧栏
const quizLayout = document.querySelector('.quiz-layout');
document.getElementById('toggleGridBtn').addEventListener('click', () => quizLayout.classList.toggle('side-hidden'));
document.getElementById('sideCloseBtn').addEventListener('click', () => quizLayout.classList.add('side-hidden'));

// 考试配置
document.querySelectorAll('.seg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b === btn));
    state.quizOrder = btn.dataset.order;
    const examConfig = document.getElementById('examConfig');
    if (examConfig) examConfig.style.display = btn.dataset.order === 'exam' ? 'flex' : 'none';
    if (btn.dataset.order === 'exam') state.examMode = true;
    else state.examMode = false;
  });
});

document.getElementById('examCount')?.addEventListener('change', function() { state.examCount = Math.max(1, parseInt(this.value) || 20); });
document.getElementById('examTimeLimit')?.addEventListener('change', function() { state.examTimeLimit = Math.max(0, parseInt(this.value) || 0); });

// ========== 交卷弹窗 ==========
const submitModal = document.getElementById('submitModal');
const submitModalBody = document.getElementById('submitModalBody');

function openSubmitModal() {
  const bank = getQuizList();
  const total = bank.length;
  const done = getGroupDone();
  const todo = total - done;
  const groupName = state.currentGroup || '全部';
  const modeLabel = state.examMode ? '（模拟考试）' : '';
  submitModalBody.innerHTML = `
    <div>分组「<b>${escapeHtml(groupName)}</b>」${modeLabel}共 <b>${total}</b> 道题，已作答 <b>${done}</b> 道。</div>
    <div class="submit-summary">
      <div class="row ok"><span>已答</span><b>${done}</b></div>
      <div class="row warn"><span>未答</span><b>${todo}</b></div>
      <div class="row"><span>总计</span><b>${total}</b></div>
      <div class="row"><span>用时</span><b>${formatTime(getElapsedSeconds())}</b></div>
    </div>
    <div style="color:var(--muted);font-size:13px;line-height:1.6">${todo > 0 ? '你还有未答题。交卷后系统会按当前答案判分并记录到历史成绩。' : '已全部作答！交卷后将记录到历史成绩。'}</div>`;
  submitModal.hidden = false; submitModal.style.display = 'grid';
  modalFocusIn(submitModal);
}

function closeSubmitModal() { const m = document.getElementById('submitModal'); m.hidden = true; m.style.display = 'none'; modalFocusOut(m); }
function formatTime(s) { const m = Math.floor(s / 60); return `${m}'${String(s % 60).padStart(2, '0')}"`; }

document.getElementById('submitModalClose').addEventListener('click', closeSubmitModal);
document.getElementById('submitCancelBtn').addEventListener('click', closeSubmitModal);
document.getElementById('submitModalMask').addEventListener('click', closeSubmitModal);
document.getElementById('submitConfirmBtn').addEventListener('click', () => { closeSubmitModal(); submitQuiz(); });

// ========== 交卷评分 ==========
function submitQuiz() {
  const bank = getQuizList();
  const groupResults = getGroupResults();
  let correct = 0;
  bank.forEach(q => { const r = groupResults[q.id]; if (!r) return; const a = [...q.answer].sort().join(''); const g = [...r.given].sort().join(''); r.correct = a === g && g.length > 0; if (r.correct) correct++; setGroupResult(q.id, r.given, r.correct); });
  bank.forEach(q => {
    const r = groupResults[q.id]; if (!q) return;
    const idx = state.wrongbook.findIndex(w => w.qid === q.id);
    if (!r || !r.correct) {
      if (idx >= 0) { state.wrongbook[idx].wrongCount = (state.wrongbook[idx].wrongCount || 1) + 1; state.wrongbook[idx].lastWrongAt = Date.now(); state.wrongbook[idx].lastGiven = r ? (r.given || []) : []; state.wrongbook[idx].mastered = false; }
      else state.wrongbook.push({ qid: q.id, snapshot: q, wrongCount: 1, lastWrongAt: Date.now(), lastGiven: r ? (r.given || []) : [], mastered: false });
    } else { if (idx >= 0) { state.wrongbook[idx].masteredCount = (state.wrongbook[idx].masteredCount || 0) + 1; if (state.wrongbook[idx].masteredCount >= CONFIG.WRONGBOOK_MASTERED_THRESHOLD) state.wrongbook[idx].mastered = true; } }
  });
  saveWrongbook();
  const g = state.currentGroup || '__all__';
  state.progress[g] = { total: bank.length, done: getGroupDone(), correct, lastQid: null, lastIdx: 0, updatedAt: Date.now() };
  saveProgress();
  state.history.unshift({ time: Date.now(), group: g, total: bank.length, correct, score: bank.length > 0 ? Math.round(correct / bank.length * 100) : 0, elapsed: getElapsedSeconds(), examMode: state.examMode });
  saveHistory();
  const latestResults = getGroupResults();
  state.lastResult = { time: Date.now(), group: g, total: bank.length, correct, results: bank.map(q => ({ qid: q.id, given: latestResults[q.id] ? latestResults[q.id].given : [], correct: latestResults[q.id] ? latestResults[q.id].correct : false })), bankSnapshot: bank.map(q => q.id) };
  try { localStorage.setItem('shuati_lastResult_v1', JSON.stringify(state.lastResult)); } catch {}
  state.quizBank = null; // 交卷后清空当前刷题集，结果页改用 lastResult 快照渲染
  pauseTimer(); switchView('result'); renderStats();
  clearGroupResults(); saveResults(); updateTopProgress(); renderGroupSelector();
}

// ========== 结果视图 ==========
let resultCurrentIdx = 0;

function getResultSource() {
  if (state.lastResult && Array.isArray(state.lastResult.results) && state.lastResult.results.length > 0) return state.lastResult.results;
  try { const raw = localStorage.getItem('shuati_lastResult_v1'); if (raw) { const lr = JSON.parse(raw); if (lr && Array.isArray(lr.results)) { state.lastResult = lr; return lr.results; } } } catch {}
  return [];
}

function renderResult() {
  const lr = state.lastResult;
  const src = getResultSource();
  // 基于 lastResult 快照从主库还原题目，做到模式无关（考试/收藏/错题均可靠）
  const bank = (lr && lr.bankSnapshot ? lr.bankSnapshot : []).map(id => state.bank.find(q => q.id === id)).filter(Boolean);
  const total = bank.length;
  const correct = src.filter(r => r && r.correct).length;
  document.getElementById('scoreNum').textContent = correct;
  document.getElementById('scoreOf').textContent = total;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const pctEl = document.getElementById('scorePercent');
  if (pctEl) pctEl.textContent = pct + '%';
  const ringFg = document.getElementById('ringFg');
  ringFg.style.strokeDashoffset = CONFIG.SVG_RING_CIRCUMFERENCE * (1 - (total ? correct / total : 0));
  const title = document.getElementById('resultTitle');
  const sub = document.getElementById('resultSub');
  if (total === 0) { title.textContent = '暂无答题记录'; sub.textContent = '请先导入题库并开始刷题。'; }
  else if (pct === 100) { title.textContent = '满分！太强了 🎉'; sub.textContent = '继续挑战更高难度吧。'; }
  else if (pct >= 80) { title.textContent = '表现不错'; sub.textContent = '点击题号查看每题详情。'; }
  else { title.textContent = '继续加油'; sub.textContent = '点击题号查看每题详情。'; }
  const grid = document.getElementById('resultGrid');
  if (total === 0) { grid.innerHTML = ''; document.getElementById('resultDetail').hidden = true; return; }
  grid.innerHTML = bank.map((q, i) => {
    const r = src[i]; const answered = r && r.given && r.given.length > 0;
    let cls = 'result-cell';
    if (!answered) cls += ' todo'; else if (r.correct) cls += ' right'; else cls += ' wrong';
    if (isStarred(q.id)) cls += ' starred';
    if (i === resultCurrentIdx) cls += ' current';
    return `<div class="${cls}" data-idx="${i}">${q.no || (i + 1)}</div>`;
  }).join('');
  grid.onclick = (e) => { const cell = e.target.closest('.result-cell'); if (!cell) return; const idx = parseInt(cell.dataset.idx, 10); if (!isNaN(idx)) showResultDetail(idx); };
  showResultDetail(resultCurrentIdx); renderHistoryList();
}

function showResultDetail(idx) {
  resultCurrentIdx = idx;
  document.querySelectorAll('.result-cell').forEach(el => el.classList.toggle('current', parseInt(el.dataset.idx, 10) === idx));
  const detail = document.getElementById('resultDetail');
  const lr = state.lastResult;
  if (!lr || !Array.isArray(lr.results)) { detail.hidden = true; return; }
  const r = lr.results[idx]; if (!r) { detail.hidden = true; return; }
  detail.hidden = false;
  const q = state.bank.find(q => q.id === r.qid);
  if (!q) { detail.innerHTML = '<div class="dim">题目已不存在（可能被清空）</div>'; return; }
  const answered = r.given && r.given.length > 0;
  const optsHtml = renderOptionsHTML(q, { mode: 'result', given: r.given, correct: r.correct, answered });
  const explainHtml = q.explanation ? `<div class="rd-explain"><span class="rd-explain-label">💡 解析</span><p>${escapeHtml(q.explanation)}</p></div>` : '';
  const statusBadge = !answered ? '<span style="color:var(--muted)">未作答</span>' : r.correct ? '<span style="color:var(--good)">✓ 答对</span>' : '<span style="color:var(--bad)">✗ 答错</span>';
  detail.innerHTML = `
    <div class="rd-stem"><span style="color:var(--accent);font-weight:600">${q.no || (idx + 1)}.</span> ${escapeHtml(q.stem)}</div>
    <div class="rd-opts">${optsHtml}</div>${explainHtml}
    <div class="rd-summary"><span>${statusBadge}</span><span class="${answered && r.correct ? 'you right' : 'you'}">你的答案：<b>${answered ? r.given.join(' ') : '未作答'}</b></span><span class="key">正确答案：<b>${q.answer.join(' ') || '未识别'}</b></span></div>
    <div class="rd-nav"><button class="btn ghost" id="rdPrev" ${idx === 0 ? 'disabled' : ''}>← 上一题</button><span class="dim">${idx + 1}/${lr.results.length}</span><button class="btn primary" id="rdNext" ${idx === lr.results.length - 1 ? 'disabled' : ''}>下一题 →</button></div>`;
  document.getElementById('rdPrev').onclick = () => { if (idx > 0) showResultDetail(idx - 1); };
  document.getElementById('rdNext').onclick = () => { if (idx < lr.results.length - 1) showResultDetail(idx + 1); };
  detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderHistoryList() {
  const section = document.getElementById('historySection');
  const list = document.getElementById('historyList');
  if (!section || !list) return;
  const history = state.history || [];
  if (history.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  list.innerHTML = `
    <table class="history-table"><thead><tr><th>日期</th><th>分组</th><th>模式</th><th>得分</th><th>正确率</th><th>用时</th></tr></thead><tbody>
    ${history.map(h => { const date = new Date(h.time).toLocaleString('zh-CN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }); const elapsed = h.elapsed ? formatTime(h.elapsed) : '--'; const sc = h.score >= 80 ? 'score-good' : h.score >= 60 ? 'score-ok' : 'score-bad'; return `<tr><td>${date}</td><td>${escapeHtml(h.group || '全部')}</td><td>${h.examMode ? '📝考试' : '练习'}</td><td>${h.correct}/${h.total}</td><td class="${sc}">${h.score}%</td><td>${elapsed}</td></tr>`; }).join('')}
    </tbody></table>`;
}

// ========== 统计分析 ==========
function renderStats() {
  const section = document.getElementById('statsSection');
  const cards = document.getElementById('statsCards');
  if (!section || !cards) return;
  const stats = getStats();
  const groups = Object.keys(stats.byGroup);
  if (groups.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';

  let cardsHtml = '';
  // 按题型统计
  const typeNames = { single: '单选题', multiple: '多选题', judge: '判断题' };
  for (const [t, s] of Object.entries(stats.byType)) {
    if (s.total === 0) continue;
    const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
    const cls = pct >= 80 ? 'stat-good' : pct >= 60 ? 'stat-ok' : 'stat-bad';
    cardsHtml += `<div class="stat-card ${cls}"><div class="stat-card-label">${typeNames[t] || t}</div><div class="stat-card-num">${pct}%</div><div class="stat-card-sub">${s.correct}/${s.total} 正确</div></div>`;
  }
  // 按分组统计
  for (const [g, s] of Object.entries(stats.byGroup)) {
    const cls = s.pct >= 80 ? 'stat-good' : s.pct >= 60 ? 'stat-ok' : 'stat-bad';
    cardsHtml += `<div class="stat-card ${cls}"><div class="stat-card-label" title="${escapeHtml(g)}">${escapeHtml(g.length > 18 ? g.slice(0,18)+'...' : g)}</div><div class="stat-card-num">${s.pct}%</div><div class="stat-card-sub">${s.correct}/${s.total} 正确</div></div>`;
  }
  cards.innerHTML = cardsHtml;
}

// ========== 结果页按钮 ==========
document.getElementById('backHomeBtn').addEventListener('click', () => switchView('upload'));
document.getElementById('redoWrongBtn').addEventListener('click', () => { const src = getResultSource(); const wrongIds = src.filter(r => !r.correct).map(r => r.qid); const wrongBank = state.bank.filter(q => wrongIds.includes(q.id)); if (wrongBank.length === 0) { alert('没有错题，全对！'); return; } state.quizBank = shuffle(wrongBank); state.currentGroup = '__wrongbook__'; state.current = 0; state.examMode = false; clearGroupResults(); state.lastResult = null; try { localStorage.removeItem('shuati_lastResult_v1'); } catch {} _needSideRebuild = true; saveResults(); updateTopProgress(); switchView('quiz'); });
document.getElementById('exportResultBtn').addEventListener('click', () => { const lr = state.lastResult; if (!lr) { alert('暂无成绩可导出'); return; } openExportModal('result', lr); });

// ========== 错题本视图 ==========
let _wbSelected = new Set(); // 批量选中的 qid 集合

function getWrongbookStats() {
  const items = state.wrongbook || [];
  const active = items.filter(w => !w.mastered);
  const mastered = items.filter(w => w.mastered);
  const byGroup = {};
  items.forEach(w => { const g = (w.snapshot && w.snapshot.group) || '未知'; if (!byGroup[g]) byGroup[g] = { total: 0, active: 0 }; byGroup[g].total++; if (!w.mastered) byGroup[g].active++; });
  const byType = { single: 0, multiple: 0, judge: 0 };
  active.forEach(w => { const t = (w.snapshot && w.snapshot.type) || 'single'; if (byType[t] !== undefined) byType[t]++; });
  return { total: items.length, active: active.length, mastered: mastered.length, byGroup, byType };
}

function renderWrongbook() {
  const info = document.getElementById('wbInfo');
  const list = document.getElementById('wbList');
  const statsGrid = document.getElementById('wbStatsGrid');
  const filter = document.getElementById('wbFilter');
  const items = state.wrongbook || [];
  _wbSelected.clear();

  if (items.length === 0) {
    info.innerHTML = '暂无错题';
    list.innerHTML = `<div class="wb-empty"><div class="wb-empty-icon">📭</div><div>还没做错过题呢～</div><div style="font-size:12px;margin-top:6px">交卷后做错的题会自动收入这里</div></div>`;
    if (statsGrid) statsGrid.innerHTML = '';
    if (filter) { filter.innerHTML = '<option value="all">全部分组</option>'; filter.disabled = true; }
    document.getElementById('wbSelectAllBtn').disabled = true;
    document.getElementById('wbBatchRemoveBtn').disabled = true;
    return;
  }

  const stats = getWrongbookStats();
  info.innerHTML = `待复习 <b>${stats.active}</b> 道 · 已掌握 <b>${stats.mastered}</b> 道 · 共 <b>${stats.total}</b> 道`;

  // 统计卡片
  if (statsGrid) {
    const typeNames = { single: '单选', multiple: '多选', judge: '判断' };
    let cardsHtml = '';
    for (const [t, count] of Object.entries(stats.byType)) {
      if (count > 0) cardsHtml += `<div class="wb-stat-card"><span class="wb-stat-label">${typeNames[t] || t}</span><span class="wb-stat-num">${count}</span></div>`;
    }
    const topGroups = Object.entries(stats.byGroup).sort((a, b) => b[1].active - a[1].active).slice(0, 4);
    for (const [g, s] of topGroups) {
      cardsHtml += `<div class="wb-stat-card"><span class="wb-stat-label" title="${escapeHtml(g)}">📁 ${escapeHtml(g.length > 8 ? g.slice(0,8)+'...' : g)}</span><span class="wb-stat-num">${s.active}</span></div>`;
    }
    statsGrid.innerHTML = cardsHtml;
  }

  // 分组筛选下拉
  if (filter) {
    const groups = Object.keys(stats.byGroup);
    const currentVal = filter.value;
    filter.innerHTML = '<option value="all">全部分组</option>' + groups.map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)} (${stats.byGroup[g].active} 待复习)</option>`).join('');
    filter.value = currentVal !== 'all' && groups.includes(currentVal) ? currentVal : 'all';
    filter.disabled = groups.length <= 1;
  }

  // 筛选 + 排序
  const filterGroup = filter ? filter.value : 'all';
  let filtered = [...items];
  if (filterGroup !== 'all') filtered = filtered.filter(w => w.snapshot && w.snapshot.group === filterGroup);

  const sorted = filtered.sort((a, b) => {
    if (a.mastered !== b.mastered) return a.mastered ? 1 : -1; // 未掌握在前
    return (b.lastWrongAt || 0) - (a.lastWrongAt || 0);        // 最近错的在前
  });

  // 按分组聚合
  const grouped = {};
  sorted.forEach(w => {
    const g = (w.snapshot && w.snapshot.group) || '未知';
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(w);
  });

  let html = '';
  for (const [g, ws] of Object.entries(grouped)) {
    const activeCount = ws.filter(w => !w.mastered).length;
    html += `<div class="wb-group">
      <div class="wb-group-head" data-group="${escapeHtml(g)}">
        <span class="wb-group-name">📁 ${escapeHtml(g)}</span>
        <span class="wb-group-meta">${ws.length} 题 · ${activeCount} 待复习</span>
        <span class="wb-group-arrow">▾</span>
      </div>
      <div class="wb-group-body">`;
    ws.forEach(w => {
      const q = w.snapshot;
      if (!q) return;
      const isActive = !w.mastered;
      const masteryPct = CONFIG.WRONGBOOK_MASTERED_THRESHOLD > 0
        ? Math.min(100, Math.round(((w.masteredCount || 0) / CONFIG.WRONGBOOK_MASTERED_THRESHOLD) * 100))
        : 0;
      const ansStr = (q.answer || []).join(' ');
      const typeTag = q.type === 'multiple' ? '多选' : q.type === 'judge' ? '判断' : '单选';
      const lastAns = (w.lastGiven || []).join(' ') || '未作答';
      const checkedAttr = _wbSelected.has(q.id) ? 'checked' : '';

      html += `<div class="wb-item ${isActive ? '' : 'mastered'}" data-qid="${q.id}">
        <div class="wb-item-top">
          <label class="wb-check" title="选中此项" onclick="event.stopPropagation()"><input type="checkbox" class="wb-checkbox" data-qid="${q.id}" ${checkedAttr} /><span></span></label>
          <div class="wb-item-main">
            <div class="wb-head">
              <span><span class="wb-no">${escapeHtml(q.no || '')}</span><span class="multi-tag">${typeTag}</span>${isStarred(q.id) ? '<span class="star-badge">★</span>' : ''}</span>
              <span class="wb-status ${isActive ? 'wb-status-active' : 'wb-status-ok'}">${isActive ? '× 待复习' : '✓ 已掌握'}</span>
            </div>
            <div class="wb-stem">${escapeHtml(q.stem)}</div>
            <div class="wb-meta-row">
              <span class="wb-times">错 <b>${w.wrongCount || 1}</b> 次</span>
              <span class="wb-your-ans">你的答案 <b>${escapeHtml(lastAns)}</b></span>
              <span class="wb-key-ans">正确答案 <b>${ansStr || '未识别'}</b></span>
              ${isActive ? `<span class="wb-mastery-bar" title="掌握进度：答对 ${w.masteredCount || 0}/${CONFIG.WRONGBOOK_MASTERED_THRESHOLD} 次"><span class="wb-mastery-fill" style="width:${masteryPct}%"></span></span>` : ''}
            </div>
          </div>
        </div>
        <!-- 展开：查看答案详情 -->
        <div class="wb-detail" id="wbDetail_${q.id}" style="display:none">
          <div class="wb-opts">${renderOptionsHTML(q, { mode: 'wrongbook' })}</div>
          ${q.explanation ? `<div class="wb-explain"><span class="wb-explain-label">💡 解析</span><p>${escapeHtml(q.explanation)}</p></div>` : ''}
        </div>
        <div class="wb-foot">
          <button class="btn-mini" data-act="view" data-qid="${q.id}">👁 查看答案</button>
          <button class="btn-mini" data-act="redo" data-qid="${q.id}">🔄 重做</button>
          ${isActive ? `<button class="btn-mini" data-act="master" data-qid="${q.id}">✓ 标记掌握</button>` : `<button class="btn-mini" data-act="unmaster" data-qid="${q.id}">↩ 重新学习</button>`}
          <button class="btn-mini danger" data-act="remove" data-qid="${q.id}">🗑 移除</button>
        </div>
      </div>`;
    });
    html += `</div></div>`;
  }
  list.innerHTML = html;

  // 事件委托
  list.onclick = (e) => {
    const btn = e.target.closest('.btn-mini');
    const groupHead = e.target.closest('.wb-group-head');
    const itemEl = e.target.closest('.wb-item');

    if (btn) {
      e.stopPropagation();
      const qid = btn.dataset.qid;
      const w = state.wrongbook.find(w => w.qid === qid);
      const act = btn.dataset.act;

      if (act === 'view') {
        const detail = document.getElementById('wbDetail_' + qid);
        if (detail) {
          const isHidden = detail.style.display === 'none';
          detail.style.display = isHidden ? 'block' : 'none';
          btn.textContent = isHidden ? '👁 收起答案' : '👁 查看答案';
        }
      } else if (act === 'redo') {
        if (w && w.snapshot) startSingleRedo(w);
      } else if (act === 'remove') {
        if (confirm('确定从错题本移除这道题？')) {
          state.wrongbook = state.wrongbook.filter(w => w.qid !== qid);
          saveWrongbook(); renderWrongbook();
        }
      } else if (act === 'master') {
        if (w) { w.mastered = true; w.masteredCount = CONFIG.WRONGBOOK_MASTERED_THRESHOLD; saveWrongbook(); renderWrongbook(); }
      } else if (act === 'unmaster') {
        if (w) { w.mastered = false; w.masteredCount = 0; saveWrongbook(); renderWrongbook(); }
      }
    } else if (groupHead) {
      // 折叠/展开分组
      const body = groupHead.nextElementSibling;
      const arrow = groupHead.querySelector('.wb-group-arrow');
      if (body) {
        const isHidden = body.style.display === 'none';
        body.style.display = isHidden ? '' : 'none';
        if (arrow) arrow.textContent = isHidden ? '▾' : '▸';
      }
    } else if (itemEl && !e.target.closest('button') && !e.target.closest('label')) {
      // 点击卡片本身 → 展开/收起
      const detail = itemEl.querySelector('[id^="wbDetail_"]');
      const viewBtn = itemEl.querySelector('[data-act="view"]');
      if (detail && viewBtn) {
        const isHidden = detail.style.display === 'none';
        detail.style.display = isHidden ? 'block' : 'none';
        viewBtn.textContent = isHidden ? '👁 收起答案' : '👁 查看答案';
      }
    }
  };

  // checkbox 变化
  list.addEventListener('change', (e) => {
    if (!e.target.classList.contains('wb-checkbox')) return;
    const qid = e.target.dataset.qid;
    if (e.target.checked) _wbSelected.add(qid); else _wbSelected.delete(qid);
    updateBatchButtons();
  });

  updateBatchButtons();
  document.getElementById('wbSelectAllBtn').disabled = false;
}

function startSingleRedo(w) {
  state.quizBank = [w.snapshot];
  state.practiceMode = 'wrong';
  state.currentGroup = '__wrong_single__';
  state.current = 0; state.examMode = false; clearGroupResults();
  state.lastResult = null; try { localStorage.removeItem('shuati_lastResult_v1'); } catch {}
  _needSideRebuild = true;
  saveResults(); updateTopProgress(); switchView('quiz');
}

function updateBatchButtons() {
  const btn = document.getElementById('wbBatchRemoveBtn');
  if (btn) btn.disabled = _wbSelected.size === 0;
}

// 工具栏按钮
document.getElementById('wbSelectAllBtn').addEventListener('click', () => {
  const checkboxes = document.querySelectorAll('#wbList .wb-checkbox');
  const allChecked = [...checkboxes].every(cb => cb.checked);
  checkboxes.forEach(cb => { cb.checked = !allChecked; const qid = cb.dataset.qid; if (cb.checked) _wbSelected.add(qid); else _wbSelected.delete(qid); });
  updateBatchButtons();
});

document.getElementById('wbBatchRemoveBtn').addEventListener('click', () => {
  if (_wbSelected.size === 0) return;
  if (!confirm(`确定从错题本移除选中的 ${_wbSelected.size} 道题？`)) return;
  state.wrongbook = state.wrongbook.filter(w => !_wbSelected.has(w.qid));
  _wbSelected.clear();
  saveWrongbook(); renderWrongbook();
});

document.getElementById('wbFilter').addEventListener('change', () => { _wbSelected.clear(); renderWrongbook(); });

document.getElementById('wbClearBtn').addEventListener('click', () => {
  if (state.wrongbook.length === 0) { alert('错题本已经是空的'); return; }
  if (confirm('确定清空整个错题本？此操作不可撤销。')) { state.wrongbook = []; _wbSelected.clear(); saveWrongbook(); renderWrongbook(); }
});

document.getElementById('wbPracticeBtn').addEventListener('click', () => {
  const active = state.wrongbook.filter(w => !w.mastered);
  if (active.length === 0) { alert('没有待复习的错题 🎉'); return; }
  state.quizBank = shuffle(active.map(w => w.snapshot));
  state.practiceMode = 'wrong'; state.currentGroup = '__wrongbook__';
  state.current = 0; state.examMode = false; clearGroupResults();
  state.lastResult = null; try { localStorage.removeItem('shuati_lastResult_v1'); } catch {}
  _needSideRebuild = true;
  saveResults(); updateTopProgress(); switchView('quiz');
});

document.getElementById('wbExportBtn').addEventListener('click', () => {
  const items = state.wrongbook || [];
  if (items.length === 0) { alert('错题本为空'); return; }
  openExportModal('wrongbook', items);
});

// ========== 上传视图 ==========
function renderUpload() {
  const actionsRow = document.getElementById('actionsRow'); const actionsInfo = document.getElementById('actionsInfo');
  const groupCards = document.getElementById('groupCards'); const previewCard = document.getElementById('previewCard');
  const previewCount = document.getElementById('previewCount'); const previewList = document.getElementById('previewList');
  if (state.bank.length === 0) { actionsRow.hidden = true; previewCard.hidden = true; if (groupCards) groupCards.innerHTML = ''; return; }
  actionsRow.hidden = false;
  const overview = getGlobalOverview();
  const groupNames = Object.keys(state.groups).filter(g => !g.startsWith('__'));
  const starredCount = Object.keys(state.starred).length;
  actionsInfo.innerHTML = `共 <b>${overview.totalQ}</b> 题 · ${groupNames.length} 分组 · 已答 <b>${overview.totalDone}</b> (${overview.donePct}%) · 正确率 <b>${overview.correctPct}%</b>${starredCount > 0 ? ` · ★ <b>${starredCount}</b> 收藏` : ''}`;
  if (groupCards) {
    groupCards.innerHTML = groupNames.map(g => { const count = (state.groups[g] || []).length; const r = state.results[g] || {}; const done = Object.values(r).filter(x => x && x.given && x.given.length > 0).length; const pct = count > 0 ? Math.round((done / count) * 100) : 0; const isActive = state.currentGroup === g; return `<div class="group-card ${isActive ? 'active' : ''}" data-group="${escapeHtml(g)}"><div class="gc-name" title="${escapeHtml(g)}">${escapeHtml(g)}</div><div class="gc-meta"><span class="count">${count} 题</span><span>已答 ${done}</span><span>·</span><span>${pct}%</span></div><div class="gc-bar"><div class="gc-bar-fill" style="width:${pct}%"></div></div><div class="gc-actions"><button class="btn small ghost" data-act="star" data-group="${escapeHtml(g)}">★ 刷收藏</button><button class="btn small ghost danger" data-act="delete" data-group="${escapeHtml(g)}">删除</button><button class="btn small primary" data-act="start" data-group="${escapeHtml(g)}">刷题</button></div></div>`; }).join('');
    groupCards.onclick = (e) => { const card = e.target.closest('.group-card'); if (!card) return; const g = card.dataset.group; const act = e.target.dataset.act; if (act === 'delete') { e.stopPropagation(); deleteGroup(g); } else if (act === 'star') { e.stopPropagation(); startStarredQuiz(g); } else if (act === 'start') { e.stopPropagation(); state.currentGroup = g; state.examMode = false; renderUpload(); startQuizCurrentGroup(); } else { state.currentGroup = g; state.examMode = false; renderUpload(); renderGroupSelector(); updateTopProgress(); } };
  }
  const searchEl = document.getElementById('bankSearch');
  const searchTerm = searchEl ? searchEl.value.toLowerCase() : '';
  const previewBank = getGroupBank().filter(q => !searchTerm || q.stem.toLowerCase().includes(searchTerm) || (q.no || '').includes(searchTerm));
  previewCard.hidden = false;
  previewCount.textContent = state.currentGroup ? `「${state.currentGroup}」${previewBank.length} 题` : `${previewBank.length} 题`;
  previewList.innerHTML = previewBank.slice(0, CONFIG.PREVIEW_MAX_ITEMS).map(q => `
    <li class="preview-item" data-qid="${q.id}">
      <span class="qno">${q.no || ''}.</span>${escapeHtml(q.stem.slice(0, 80))}${q.stem.length > 80 ? '...' : ''}
      <span class="dim" style="font-size:12px">[${escapeHtml(q.group || '?')}]</span>
      ${isStarred(q.id) ? '<span style="color:var(--accent)">★</span>' : ''}
      <span style="margin-left:auto;display:flex;gap:4px">
        <button class="btn-mini-xs" data-act="edit-preview" data-qid="${q.id}">✎</button>
        <button class="btn-mini-xs danger" data-act="del-preview" data-qid="${q.id}">×</button>
      </span>
    </li>`).join('');
  // 事件委托
  previewList.onclick = (e) => { const btn = e.target.closest('.btn-mini-xs'); if (!btn) return; e.stopPropagation(); const qid = btn.dataset.qid; const q = state.bank.find(q => q.id === qid); if (!q) return; if (btn.dataset.act === 'edit-preview') openEditQModal(q); else if (btn.dataset.act === 'del-preview') { if (confirm('确定删除这道题？')) { state.bank = state.bank.filter(q => q.id !== qid); delete state.starred[qid]; saveStarred(); rebuildGroups(); saveBank(); renderUpload(); renderGroupSelector(); } } };
}

// 搜索
document.getElementById('bankSearch')?.addEventListener('input', debounce(() => renderUpload(), 200));

function startStarredQuiz(groupName) {
  const starred = state.bank.filter(q => state.starred[q.id] && q.group === groupName);
  if (starred.length === 0) { alert(`分组「${groupName}」中没有收藏的题目`); return; }
  state.quizBank = shuffle(starred);
  state.currentGroup = '__starred__';
  state.current = 0; state.examMode = false; clearGroupResults();
  state.lastResult = null; try { localStorage.removeItem('shuati_lastResult_v1'); } catch {}
  _needSideRebuild = true;
  saveResults(); updateTopProgress(); switchView('quiz');
}

// ========== 分组操作 ==========
function deleteGroup(groupName) { const bank = state.groups[groupName]; if (!bank || bank.length === 0) { delete state.groups[groupName]; delete state.results[groupName]; delete state.progress[groupName]; state.currentGroup = null; renderUpload(); renderGroupSelector(); updateTopProgress(); return; } if (!confirm(`确定删除分组「${groupName}」？\n\n${bank.length} 道题及作答记录都会被删除。`)) return; state.bank = state.bank.filter(q => q.group !== groupName); delete state.groups[groupName]; delete state.results[groupName]; delete state.progress[groupName]; state.wrongbook = state.wrongbook.filter(w => !(w.snapshot && w.snapshot.group === groupName)); if (state.currentGroup === groupName) { const names = Object.keys(state.groups); state.currentGroup = names.length > 0 ? names[0] : null; } saveBank(); saveResults(); saveProgress(); saveWrongbook(); renderUpload(); renderGroupSelector(); updateTopProgress(); showStatus(`已删除分组「${groupName}」`, 'ok'); }

function startQuizCurrentGroup() {
  const bank = getQuizList(); if (bank.length === 0) return;
  pruneSyntheticState();
  // 模拟考试：随机抽题
  if (state.examMode) {
    const count = Math.min(state.examCount, bank.length);
    state.quizBank = shuffle(bank).slice(0, count);
    state.currentGroup = '__exam__';
  } else {
    state.quizBank = state.quizOrder === 'shuffle' ? shuffle(bank) : sortByNo(bank);
    // currentGroup 保持当前真实分组（用于进度追踪和分组选择器高亮）
  }
  const g = state.currentGroup || '__all__';
  const prog = state.progress[g] || {};
  const doneCount = getGroupDone();
  if (!state.examMode && doneCount > 0 && doneCount < bank.length) {
    const resume = confirm(`检测到上次未完成的进度（已答 ${doneCount}/${bank.length} 题），是否继续？\n\n点"取消"将从头开始。`);
    if (!resume) { state.current = 0; clearGroupResults(); }
    else state.current = Math.min(prog.lastIdx || 0, bank.length - 1);
  } else { state.current = 0; clearGroupResults(); }
  state.lastResult = null; try { localStorage.removeItem('shuati_lastResult_v1'); } catch {}
  state.progress[g] = { total: bank.length, done: 0, correct: 0, lastQid: null, lastIdx: 0, updatedAt: Date.now() };
  _needSideRebuild = true;
  resetTimer(); saveProgress(); saveResults(); updateTopProgress(); switchView('quiz');
}

document.getElementById('clearBankBtn').addEventListener('click', async () => { if (confirm('确定清空全部题库？\n\n所有分组、作答记录、进度都会被清除。')) { state.bank = []; state.groups = {}; state.currentGroup = null; state.results = {}; state.progress = {}; state.wrongbook = []; state.starred = {}; saveBank(); saveResults(); saveProgress(); saveWrongbook(); saveStarred(); try { await api('/api/clear', { method: 'POST' }); } catch {} renderUpload(); renderGroupSelector(); updateTopProgress(); showStatus('题库已全部清空', 'ok'); } });
document.getElementById('goQuizBtn').addEventListener('click', () => startQuizCurrentGroup());
document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);

// 手动录题
document.getElementById('manualEntryBtn').addEventListener('click', () => openEditQModal(null));

// 导出题库
document.getElementById('exportBankBtn').addEventListener('click', () => { if (state.bank.length === 0) { alert('题库为空'); return; } openExportModal('bank', state.bank); });

// ========== 题目编辑弹窗 ==========
let _editingQ = null; // 正在编辑的题目（null = 新增）

function openEditQModal(q) {
  _editingQ = q;
  const title = document.getElementById('editQModalTitle');
  const body = document.getElementById('editQModalBody');
  const deleteBtn = document.getElementById('editQDeleteBtn');
  title.textContent = q ? '编辑题目' : '手动录题';
  deleteBtn.style.display = q ? '' : 'none';
  const type = q ? q.type : 'single';
  const stem = q ? q.stem : '';
  const opts = q ? q.options : [{ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' }];
  const answer = q ? (q.answer || []).join(',') : '';
  const group = q ? (q.group || '') : (state.currentGroup || '');
  const explanation = q ? (q.explanation || '') : '';
  body.innerHTML = `
    <div class="form-group"><label>题型</label><select id="eqType"><option value="single" ${type === 'single' ? 'selected' : ''}>单选题</option><option value="multiple" ${type === 'multiple' ? 'selected' : ''}>多选题</option><option value="judge" ${type === 'judge' ? 'selected' : ''}>判断题</option></select></div>
    <div class="form-group"><label>题号</label><input id="eqNo" value="${escapeHtml(q ? (q.no || '') : '')}" placeholder="如 1" /></div>
    <div class="form-group"><label>题干</label><textarea id="eqStem" rows="3">${escapeHtml(stem)}</textarea></div>
    <div class="form-group"><label>选项</label>
      ${opts.map((o, i) => `<div class="form-opt"><span class="opt-key">${o.key}</span><input id="eqOpt${o.key}" value="${escapeHtml(o.text)}" placeholder="选项 ${o.key}" /></div>`).join('')}
    </div>
    <div class="form-group"><label>答案（多选用逗号分隔，如 A,B）</label><input id="eqAnswer" value="${escapeHtml(answer)}" placeholder="A" /></div>
    <div class="form-group"><label>分组</label><input id="eqGroup" value="${escapeHtml(group)}" placeholder="分组名" /></div>
    <div class="form-group"><label>解析（可选）</label><textarea id="eqExplanation" rows="2">${escapeHtml(explanation)}</textarea></div>`;
  const modal = document.getElementById('editQModal');
  modal.hidden = false; modal.style.display = 'grid';
  modalFocusIn(modal);}

function closeEditQModal() { const m = document.getElementById('editQModal'); m.hidden = true; m.style.display = 'none'; modalFocusOut(m); }

document.getElementById('editQModalClose').addEventListener('click', closeEditQModal);
document.getElementById('editQModalMask').addEventListener('click', closeEditQModal);
document.getElementById('editQCancelBtn').addEventListener('click', closeEditQModal);

document.getElementById('editQSaveBtn').addEventListener('click', () => {
  const type = document.getElementById('eqType').value;
  const no = document.getElementById('eqNo').value.trim();
  const stem = document.getElementById('eqStem').value.trim();
  const opts = ['A','B','C','D'].map(k => { const v = document.getElementById('eqOpt' + k).value.trim(); return v ? { key: k, text: v } : null; }).filter(Boolean);
  const ansStr = document.getElementById('eqAnswer').value.trim().toUpperCase();
  const group = document.getElementById('eqGroup').value.trim() || '未分组';
  const explanation = document.getElementById('eqExplanation').value.trim();
  if (!stem) { alert('题干不能为空'); return; }
  if (opts.length < 2) { alert('至少需要两个选项'); return; }
  const answer = ansStr.split(/[,，\s]+/).filter(s => /^[A-D]$/.test(s));
  if (answer.length === 0 && type !== 'judge') { alert('请填写正确答案'); return; }
  const qData = { no, type, stem, options: opts, answer, group, explanation, source: '' };
  if (_editingQ) {
    // 编辑模式
    const idx = state.bank.findIndex(q => q.id === _editingQ.id);
    if (idx >= 0) { state.bank[idx] = { ...state.bank[idx], ...qData, id: _editingQ.id }; }
    // 更新错题本中的快照
    const wbIdx = state.wrongbook.findIndex(w => w.qid === _editingQ.id);
    if (wbIdx >= 0 && state.wrongbook[wbIdx].snapshot) state.wrongbook[wbIdx].snapshot = { ...state.wrongbook[wbIdx].snapshot, ...qData };
  } else {
    // 新增模式
    state.bank.push({ id: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2,7), ...qData });
  }
  rebuildGroups(); saveBank(); saveWrongbook(); closeEditQModal(); renderUpload(); renderGroupSelector();
  // 如果正在刷题，刷新当前题目
  if (document.getElementById('view-quiz').classList.contains('active')) { _needSideRebuild = true; renderQuizFull(); }
});

document.getElementById('editQDeleteBtn').addEventListener('click', () => {
  if (!_editingQ) return;
  if (!confirm('确定删除本题？此操作不可撤销。')) return;
  state.bank = state.bank.filter(q => q.id !== _editingQ.id);
  state.wrongbook = state.wrongbook.filter(w => w.qid !== _editingQ.id);
  delete state.starred[_editingQ.id]; saveStarred();
  rebuildGroups(); saveBank(); saveWrongbook(); closeEditQModal(); renderUpload(); renderGroupSelector();
  if (document.getElementById('view-quiz').classList.contains('active')) { _needSideRebuild = true; if (getQuizList().length === 0) switchView('upload'); else renderQuizFull(); }
});

// ========== 导出弹窗 ==========
function openExportModal(type, data) {
  const body = document.getElementById('exportModalBody');
  let html = '';
  const now = new Date().toLocaleString('zh-CN');
  if (type === 'bank') {
    html = `<h2 style="margin:0 0 16px">题库导出</h2><p style="color:var(--muted)">导出时间：${now} · 共 ${data.length} 题</p>`;
    const groups = {}; data.forEach(q => { const g = q.group || '未分组'; if (!groups[g]) groups[g] = []; groups[g].push(q); });
    for (const [g, qs] of Object.entries(groups)) {
      html += `<h3 style="margin:24px 0 8px">📁 ${escapeHtml(g)}（${qs.length} 题）</h3>`;
      qs.forEach(q => { html += `<div style="margin:12px 0;padding:12px;border:1px solid var(--line);border-radius:8px"><b>${q.no || ''}. ${escapeHtml(q.stem)}</b><br>${(q.options||[]).map(o => `${o.key}. ${escapeHtml(o.text)}`).join('<br>')}<br><span style="color:var(--good)">答案：${(q.answer||[]).join(' ')}</span>${q.explanation ? `<br><span style="color:var(--muted)">解析：${escapeHtml(q.explanation)}</span>` : ''}</div>`; });
    }
  } else if (type === 'wrongbook') {
    html = `<h2 style="margin:0 0 16px">错题本导出</h2><p style="color:var(--muted)">导出时间：${now} · 共 ${data.length} 题</p>`;
    data.forEach(w => { const q = w.snapshot; if (!q) return; html += `<div style="margin:12px 0;padding:12px;border:1px solid var(--line);border-radius:8px;border-left:4px solid var(--bad)"><b>${q.no || ''}. ${escapeHtml(q.stem)}</b><br>${(q.options||[]).map(o => `${o.key}. ${escapeHtml(o.text)}`).join('<br>')}<br><span style="color:var(--good)">答案：${(q.answer||[]).join(' ')}</span> · <span style="color:var(--bad)">做错 ${w.wrongCount||1} 次</span></div>`; });
  } else if (type === 'result') {
    const lr = data; html = `<h2 style="margin:0 0 16px">成绩单</h2><p style="color:var(--muted)">${new Date(lr.time).toLocaleString('zh-CN')} · ${lr.correct}/${lr.total} · ${lr.score}% · 用时 ${formatTime(lr.elapsed||0)}</p>`;
    const bank = state.bank.filter(q => lr.bankSnapshot.includes(q.id));
    bank.forEach(q => { const r = (lr.results||[]).find(r => r.qid === q.id); if (!r) return; const cls = r.correct ? 'border-left:4px solid var(--good)' : 'border-left:4px solid var(--bad)'; html += `<div style="margin:12px 0;padding:12px;border:1px solid var(--line);border-radius:8px;${cls}"><b>${q.no || ''}. ${escapeHtml(q.stem)}</b><br>你的答案：${r.given.join(' ')||'未作答'} · 正确答案：${(q.answer||[]).join(' ')}</div>`; });
  }
  body.innerHTML = html;
  const modal = document.getElementById('exportModal');
  modal.hidden = false; modal.style.display = 'grid';
  modalFocusIn(modal);
}

function closeExportModal() { const m = document.getElementById('exportModal'); m.hidden = true; m.style.display = 'none'; modalFocusOut(m); }
document.getElementById('exportModalClose').addEventListener('click', closeExportModal);
document.getElementById('exportModalMask').addEventListener('click', closeExportModal);
document.getElementById('exportPrintBtn').addEventListener('click', () => { const content = document.getElementById('exportModalBody').innerHTML; const w = window.open('', '_blank', 'width=800,height=600'); w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>刷题导出</title><style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:24px;line-height:1.8;color:#333}</style></head><body>${content}</body></html>`); w.document.close(); w.print(); });
document.getElementById('exportCopyBtn').addEventListener('click', () => { const content = document.getElementById('exportModalBody').innerText; navigator.clipboard.writeText(content).then(() => alert('已复制到剪贴板')).catch(() => alert('复制失败')); });

// ========== 分组选择器 ==========
function renderGroupSelector() {
  const sel = document.getElementById('groupSelect'); if (!sel) return;
  const names = Object.keys(state.groups).filter(g => !g.startsWith('__'));
  if (names.length === 0) { sel.innerHTML = '<option value="">暂无分组</option>'; sel.disabled = true; return; }
  sel.disabled = false;
  sel.innerHTML = names.map(g => `<option value="${escapeHtml(g)}" ${g === state.currentGroup ? 'selected' : ''}>${escapeHtml(g)}（${state.groups[g].length}题 · 已答${getGroupDoneFor(g)}）</option>`).join('');
}

// ========== 初始化 ==========
(async function init() {
  if (new URLSearchParams(location.search).get('clear') === '1') {
    Object.values(CONFIG).filter(v => typeof v === 'string' && v.startsWith('shuati_')).forEach(k => localStorage.removeItem(k));
    location.replace(location.pathname); return;
  }
  initTheme(); updateThemeIcon();
  try { const raw = localStorage.getItem(CONFIG.LS_LAST_RESULT); if (raw) state.lastResult = JSON.parse(raw); } catch {}
  await loadFromStorage(); updateWrongbookBadge(); setupKeyboardShortcuts(); renderUpload();
})();
