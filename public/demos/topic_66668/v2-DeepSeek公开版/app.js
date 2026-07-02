/* ===== AI课代表 Demo - DeepSeek API版 ===== */

var DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
var DEEPSEEK_MODEL = 'deepseek-chat';

var currentPage = 'home';
var cardsData = [];
var quizData = [];
var quizAnswers = {};
var mindmapData = null;
var granularity = 'quick';

// ===== Page Navigation =====
function showPage(id) {
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) pages[i].classList.remove('active');
  document.getElementById('page-' + id).classList.add('active');
  currentPage = id;
  window.scrollTo(0, 0);
}
function goHome() { showPage('home'); }
function goInput() { showPage('input'); document.getElementById('note-input').focus(); }
function showAbout() { document.getElementById('about-modal').classList.add('active'); }
function closeModal(e) { if (e.target.classList.contains('modal')) document.getElementById('about-modal').classList.remove('active'); }
function closeModalDirect() { document.getElementById('about-modal').classList.remove('active'); }

// ===== Chip Select =====
function selectChip(el) {
  var chips = el.parentElement.querySelectorAll('.chip');
  for (var i = 0; i < chips.length; i++) chips[i].classList.remove('active');
  el.classList.add('active');
  granularity = el.dataset.granularity;
  var customOpts = document.getElementById('custom-options');
  if (granularity === 'custom') { customOpts.style.display = 'block'; }
  else { customOpts.style.display = 'none'; }
}

// ===== Examples =====
var EXAMPLES = {
  java: 'Spring MVC是一个基于Java的Web框架，它实现了Model-View-Controller设计模式，用于构建Web应用程序。',
  history: '辛亥革命发生于1911年，推翻了清朝统治，结束了中国两千多年的封建帝制，建立了中华民国。',
  english: 'Passive Voice（被动语态）用于强调动作的承受者。结构为：be + 过去分词。'
};
function loadExample(key) { document.getElementById('note-input').value = EXAMPLES[key]; }
function loadDemo() { loadExample('java'); goInput(); }

// ===== AI Processing =====
function startGenerate() {
  var text = document.getElementById('note-input').value.trim();
  var apiKey = document.getElementById('api-key-input').value.trim();
  if (!text) { showToast('请先输入或粘贴笔记内容！'); return; }
  if (!apiKey) { showToast('请输入 DeepSeek API Key！（可在 platform.deepseek.com 免费获取）'); return; }
  showPage('process');
  callDeepSeek(text, apiKey);
}

function setProcessStatus(msg) {
  var el = document.getElementById('process-status');
  if (el) el.textContent = msg;
}

function setProcessStep(idx) {
  var steps = document.querySelectorAll('.pstep');
  for (var i = 0; i < steps.length; i++) steps[i].classList.remove('active');
  if (idx >= 0 && idx < steps.length) steps[idx].classList.add('active');
}

// ===== Call DeepSeek API =====
function callDeepSeek(text, apiKey) {
  setProcessStep(0);
  setProcessStatus('正在调用 DeepSeek 大模型...');

  var wordLimit = '约30个汉字';
  var modeDesc = '速记模式';
  if (granularity === 'detailed') {
    wordLimit = '约120个汉字';
    modeDesc = '详记模式';
  } else if (granularity === 'custom') {
    var custom = document.getElementById('custom-prompt').value.trim();
    wordLimit = custom || '约80个汉字';
    modeDesc = '自定义模式：' + wordLimit;
  }

  var systemPrompt = '你是一个专业的课后AI助教"AI课代表"。你的任务是根据学生输入的课堂笔记内容，自动联想扩展相关知识点，并生成记忆卡片。\n\n' +
    '要求：\n' +
    '1. 根据学生输入的文本，识别核心主题\n' +
    '2. 除了从原文提取知识点外，还要主动联想扩展3-5个相关知识点（如输入Spring MVC，要联想出DispatcherServlet、RESTful、@Controller等）\n' +
    '3. 当前模式：' + modeDesc + '，每条答案控制在' + wordLimit + '以内\n' +
    '4. 不要在答案文本中包含任何[source:xxx]标记，来源信息只通过JSON的source字段区分\n\n' +
    '必须严格按以下JSON格式输出，不要输出任何其他内容：\n' +
    '{\n' +
    '  "cards": [\n' +
    '    {"q": "问题", "a": "答案", "source": "input或ai"},\n' +
    '    ...\n' +
    '  ],\n' +
    '  "mindmap": {\n' +
    '    "title": "主题名称",\n' +
    '    "branches": [\n' +
    '      {"title": "分支名", "children": ["子节点1", "子节点2"]}\n' +
    '    ]\n' +
    '  },\n' +
    '  "quiz": [\n' +
    '    {"q": "题目", "options": ["选项A", "选项B", "选项C", "选项D"], "correct": "正确答案"}\n' +
    '  ]\n' +
    '}';

  var fill = document.getElementById('progress-fill');
  fill.style.width = '20%';

  fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '请为以下课堂笔记生成记忆卡片、思维导图和模拟考题：\n\n' + text }
      ],
      temperature: 0.7,
      max_tokens: 3000
    })
  })
  .then(function(response) {
    if (!response.ok) {
      return response.json().then(function(err) {
        throw new Error(err.error?.message || 'API请求失败，状态码：' + response.status);
      });
    }
    return response.json();
  })
  .then(function(data) {
    setProcessStep(2);
    setProcessStatus('正在解析AI响应...');
    fill.style.width = '60%';

    var content = data.choices[0].message.content;
    // Extract JSON from response (handle markdown code blocks)
    var jsonStr = content;
    var jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    try {
      var result = JSON.parse(jsonStr);
      setProcessStep(3);
      fill.style.width = '80%';
      setTimeout(function() {
        processDeepSeekResult(result);
        setProcessStep(4);
        fill.style.width = '100%';
        setProcessStatus('完成！');
        setTimeout(function() {
          showPage('result');
          switchResultTab('cards');
        }, 300);
      }, 500);
    } catch (parseErr) {
      console.error('JSON解析错误:', parseErr, content);
      showToast('AI返回格式异常，请重试。错误详情：' + parseErr.message);
      showPage('input');
    }
  })
  .catch(function(err) {
    console.error('DeepSeek API 错误:', err);
    showToast('API调用失败：' + err.message);
    showPage('input');
  });
}

// ===== Process DeepSeek Response =====
function processDeepSeekResult(result) {
  // 清理函数：去除答案中的[source:xxx]标记
  function cleanSource(text) {
    if (!text) return text;
    return text.replace(/\[source:[^\]]*\]/g, '').trim();
  }

  // 1. Cards
  cardsData = [];
  if (result.cards && Array.isArray(result.cards)) {
    for (var i = 0; i < result.cards.length; i++) {
      var c = result.cards[i];
      var answer = cleanSource(c.a);
      cardsData.push({
        id: i,
        question: cleanSource(c.q),
        answer: answer,
        original: answer,
        source: c.source === 'ai' ? 'ai-knowledge' : 'input'
      });
    }
  }

  // 2. Mindmap
  mindmapData = null;
  if (result.mindmap) {
    mindmapData = result.mindmap;
  }

  // 3. Quiz
  quizData = [];
  if (result.quiz && Array.isArray(result.quiz)) {
    for (var i = 0; i < result.quiz.length; i++) {
      var q = result.quiz[i];
      quizData.push({
        id: i,
        question: q.q || '未知题目',
        options: q.options || [],
        correct: q.correct || ''
      });
    }
  }
  quizAnswers = {};

  // 4. Update UI
  var aiCount = cardsData.filter(function(c) { return c.source === 'ai-knowledge'; }).length;
  document.getElementById('badge-cards').textContent = cardsData.length;
  document.getElementById('result-summary').textContent =
    'DeepSeek为你生成了 ' + cardsData.length + ' 张记忆卡片（含 ' + aiCount + ' 张AI联想扩展）、1 张思维导图、' + quizData.length + ' 道模拟题';

  renderCards();
  renderMindmap();
  renderQuiz();
}

// ===== Render Cards =====
function renderCards() {
  var grid = document.getElementById('cards-grid');
  var html = '';
  for (var idx = 0; idx < cardsData.length; idx++) {
    var card = cardsData[idx];
    var tag = card.source === 'ai-knowledge'
      ? '<span class="card-tag-ai">AI联想</span>'
      : '<span class="card-tag-input">原文</span>';

    html += '<div class="card-item" data-cid="' + idx + '">' +
      '<input type="checkbox" class="card-select" title="勾选以保存到笔记本" onclick="toggleCardSelect(event,this)">' +
      '<div class="card-inner">' +
        '<div class="card-front">' +
          '<div class="card-label">卡片 ' + (idx + 1) + '  ' + tag + '</div>' +
          '<div class="card-q">' + escapeHtml(card.question) + '</div>' +
          '<div class="card-hint">点击翻转查看答案</div>' +
        '</div>' +
        '<div class="card-back">' +
          '<div class="card-a">' + escapeHtml(card.answer) + '</div>' +
          '<div class="card-hint">点击翻回</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }
  grid.innerHTML = html;

  var items = grid.querySelectorAll('.card-item');
  for (var i = 0; i < items.length; i++) {
    (function(el) {
      el.addEventListener('click', function(e) {
        if (e.target.classList.contains('card-select')) return;
        el.classList.toggle('flipped');
      });
    })(items[i]);
  }
}

function toggleCardSelect(e, checkbox) {
  e.stopPropagation();
  var cardItem = checkbox.closest('.card-item');
  if (checkbox.checked) cardItem.classList.add('selected');
  else cardItem.classList.remove('selected');
}

function shuffleCards() {
  var a = cardsData.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  cardsData = a;
  renderCards();
}

// ===== Render Mindmap =====
function renderMindmap() {
  var container = document.getElementById('mindmap-container');
  if (!mindmapData) { container.innerHTML = '<p style="text-align:center;color:#64748b;">未生成思维导图</p>'; return; }

  var branchesHtml = '';
  if (mindmapData.branches) {
    for (var i = 0; i < mindmapData.branches.length; i++) {
      var b = mindmapData.branches[i];
      branchesHtml += '<div class="mm-branch"><div class="mm-line"></div><div>';
      branchesHtml += '<div class="mm-node">' + escapeHtml(b.title || '') + '</div>';
      if (b.children && b.children.length > 1) {
        branchesHtml += '<div class="mm-children">';
        for (var j = 1; j < b.children.length; j++) {
          branchesHtml += '<div class="mm-child"><div class="mm-dot"></div>' + escapeHtml(b.children[j]) + '</div>';
        }
        branchesHtml += '</div>';
      }
      branchesHtml += '</div></div>';
    }
  }

  container.innerHTML =
    '<div class="mindmap-root">' +
      '<div class="mm-root-node">' + escapeHtml(mindmapData.title || '知识框架') + '</div>' +
      '<div class="mm-branches">' + branchesHtml + '</div>' +
    '</div>';
}

// ===== Render Quiz =====
function renderQuiz() {
  var container = document.getElementById('quiz-container');
  var actions = document.getElementById('quiz-actions');
  var scorePanel = document.getElementById('quiz-score');

  if (quizData.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#64748b;">未生成模拟题。</p>';
    actions.style.display = 'none';
    scorePanel.style.display = 'none';
    return;
  }

  actions.style.display = 'block';
  scorePanel.style.display = 'none';

  var html = '';
  for (var idx = 0; idx < quizData.length; idx++) {
    var q = quizData[idx];
    html += '<div class="quiz-item" data-qid="' + idx + '">' +
      '<div class="quiz-q"><span class="quiz-num">' + (idx + 1) + '</span>' +
      '<span>' + escapeHtml(q.question) + '</span></div>' +
      '<div class="quiz-options">';
    for (var oid = 0; oid < q.options.length; oid++) {
      var encodedOpt = encodeURIComponent(q.options[oid]);
      html += '<label class="quiz-opt" onclick="selectOption(this,' + idx + ',\'' + encodedOpt.replace(/'/g, "\\'") + '\')">' +
        '<input type="radio" name="q-' + idx + '" value="' + encodedOpt + '">' +
        '<span>' + escapeHtml(q.options[oid]) + '</span></label>';
    }
    html += '</div></div>';
  }
  container.innerHTML = html;
}

function selectOption(el, qid, encodedOpt) {
  quizAnswers[qid] = decodeURIComponent(encodedOpt);
  var parent = el.closest('.quiz-options');
  var opts = parent.querySelectorAll('.quiz-opt');
  for (var i = 0; i < opts.length; i++) opts[i].classList.remove('selected');
  el.classList.add('selected');
}

function submitQuiz() {
  if (Object.keys(quizAnswers).length < quizData.length) {
    showToast('还有 ' + (quizData.length - Object.keys(quizAnswers).length) + ' 道题未作答。');
    return;
  }
  var correct = 0;
  for (var idx = 0; idx < quizData.length; idx++) {
    var q = quizData[idx];
    var item = document.querySelector('.quiz-item[data-qid="' + idx + '"]');
    var opts = item.querySelectorAll('.quiz-opt');
    var userAnswer = quizAnswers[idx];
    for (var i = 0; i < opts.length; i++) {
      var val = decodeURIComponent(opts[i].querySelector('input').value);
      opts[i].classList.remove('selected');
      if (val === q.correct) { opts[i].classList.add('correct'); }
      else if (val === userAnswer && val !== q.correct) { opts[i].classList.add('wrong'); }
      opts[i].style.pointerEvents = 'none';
      opts[i].querySelector('input').disabled = true;
    }
    if (userAnswer === q.correct) correct++;
  }
  var score = Math.round((correct / quizData.length) * 100);
  var scorePanel = document.getElementById('quiz-score');
  var actions = document.getElementById('quiz-actions');
  var comment = score >= 80 ? '太棒了！知识掌握很牢固' : score >= 60 ? '不错，继续加油' : '建议回顾记忆卡片，巩固薄弱知识点';
  scorePanel.innerHTML =
    '<div class="score-num">' + score + '分</div>' +
    '<div class="score-label">答对 ' + correct + ' / ' + quizData.length + ' 题</div>' +
    '<div class="score-detail">' + comment + '</div>' +
    '<button class="btn-secondary" style="margin-top:1rem;" onclick="renderQuiz()">重新测试</button>';
  scorePanel.style.display = 'block';
  actions.style.display = 'none';
}

// ===== Result Tabs =====
function switchResultTab(el, tab) {
  if (typeof el === 'string') { tab = el; el = null; }
  var tabs = document.querySelectorAll('.rtab');
  for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
  if (el) el.classList.add('active');
  var panels = document.querySelectorAll('.result-panel');
  for (var i = 0; i < panels.length; i++) panels[i].classList.remove('active');
  document.getElementById('panel-' + tab).classList.add('active');
}

// ===== Utilities =====
function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ===================================================================
   ★ 笔记本功能：存笔记、展示、导出、清空
   =================================================================== */

var NOTEBOOK_KEY = 'ai_study_notebook_v2';

function getNotebook() {
  try { var raw = localStorage.getItem(NOTEBOOK_KEY); return raw ? JSON.parse(raw) : []; }
  catch (e) { return []; }
}
function saveNotebook(list) {
  localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(list));
  updateNotebookBadge();
}
function updateNotebookBadge() {
  var list = getNotebook();
  var el = document.getElementById('nav-notebook-count');
  if (el) {
    el.textContent = list.length;
    el.style.display = list.length > 0 ? 'inline-block' : 'none';
  }
}

function saveSelectedToNotebook() {
  var selected = document.querySelectorAll('.card-item.selected');
  if (selected.length === 0) { showToast('请先在卡片上勾选☑️，再点击"存入选中"！'); return; }
  var notebook = getNotebook();
  var added = 0;
  for (var i = 0; i < selected.length; i++) {
    var cid = parseInt(selected[i].dataset.cid);
    var card = cardsData[cid];
    if (!card) continue;
    var exists = false;
    for (var j = 0; j < notebook.length; j++) { if (notebook[j].question === card.question) { exists = true; break; } }
    if (!exists) {
      notebook.push({ question: card.question, answer: card.answer, source: card.source, savedAt: new Date().toLocaleString('zh-CN') });
      added++;
    }
  }
  saveNotebook(notebook);
  for (var i = 0; i < selected.length; i++) {
    selected[i].classList.remove('selected');
    var cb = selected[i].querySelector('.card-select');
    if (cb) cb.checked = false;
  }
  showToast('已保存 ' + added + ' 张卡片到笔记本！');
}

function showNotebook() {
  document.getElementById('notebook-modal').classList.add('active');
  renderNotebookList();
}
function closeNotebookModal(e) { if (e.target.classList.contains('modal')) document.getElementById('notebook-modal').classList.remove('active'); }
function closeNotebookDirect() { document.getElementById('notebook-modal').classList.remove('active'); }

function renderNotebookList() {
  var list = getNotebook();
  var container = document.getElementById('notebook-list');
  document.getElementById('notebook-count').textContent = '已收录 ' + list.length + ' 条笔记';
  if (list.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:2rem;">笔记本为空，在记忆卡片Tab中选择卡片并点击"存入选中"即可添加。</p>';
    return;
  }
  var html = '';
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var tag = item.source === 'ai-knowledge' ? '<span class="nb-tag ai">AI联想</span>' : '<span class="nb-tag input">原文</span>';
    html += '<div class="notebook-item" data-nbid="' + i + '">' +
      '<input type="checkbox" class="nb-select" title="勾选" onclick="toggleNoteSelect(event,this)">' +
      '<div class="nb-header">' +
        '<div class="nb-q">' + escapeHtml(item.question) + ' ' + tag + '</div>' +
        '<button class="nb-export-single" onclick="exportSingleNote(' + i + ',event)">📥 导出</button>' +
      '</div>' +
      '<div class="nb-a">' + escapeHtml(item.answer) + '</div>' +
      '<div class="nb-meta">保存于 ' + (item.savedAt || '') + '</div>' +
    '</div>';
  }
  container.innerHTML = html;
}

function toggleNoteSelect(e, checkbox) {
  e.stopPropagation();
  var item = checkbox.closest('.notebook-item');
  if (checkbox.checked) item.classList.add('selected');
  else item.classList.remove('selected');
}

var allNotesSelected = false;
function toggleSelectAllNotes() {
  var items = document.querySelectorAll('.notebook-item');
  var checkboxes = document.querySelectorAll('.nb-select');
  allNotesSelected = !allNotesSelected;
  for (var i = 0; i < items.length; i++) {
    checkboxes[i].checked = allNotesSelected;
    if (allNotesSelected) items[i].classList.add('selected');
    else items[i].classList.remove('selected');
  }
  var btn = event.target;
  btn.textContent = allNotesSelected ? '☐ 取消' : '☑️ 全选';
}

function exportSelectedNotes(format) {
  var checked = document.querySelectorAll('.notebook-item.selected');
  if (checked.length === 0) { showToast('请先在笔记本中勾选要导出的条目！'); return; }
  var list = getNotebook();
  var selected = [];
  for (var i = 0; i < checked.length; i++) {
    var idx = parseInt(checked[i].dataset.nbid);
    if (list[idx]) selected.push(list[idx]);
  }
  doExportList(selected, format, '选中');
}

function exportSingleNote(idx, e) {
  if (e) e.stopPropagation();
  var list = getNotebook();
  if (!list[idx]) return;
  doExportList([list[idx]], 'txt', '单条');
}

function doExportList(items, format, suffix) {
  var content = '', filename = '';
  if (format === 'md') {
    filename = 'AI课代表_笔记本_' + suffix + '_' + fmtDate() + '.md';
    content = '# 📒 AI课代表笔记本（' + suffix + ' ' + items.length + '条）\n\n';
    content += '> 导出时间：' + new Date().toLocaleString('zh-CN') + '\n\n---\n\n';
    for (var i = 0; i < items.length; i++) {
      var src = items[i].source === 'ai-knowledge' ? 'AI联想' : '原文';
      content += '## ' + (i+1) + '. ' + items[i].question + ' [' + src + ']\n\n' + items[i].answer + '\n\n> 保存于：' + (items[i].savedAt||'') + '\n\n---\n\n';
    }
  } else {
    filename = 'AI课代表_笔记本_' + suffix + '_' + fmtDate() + '.txt';
    content = '=============================================\n';
    content += '  AI课代表 - 笔记本（' + suffix + ' ' + items.length + '条）\n';
    content += '  导出时间：' + new Date().toLocaleString('zh-CN') + '\n';
    content += '=============================================\n\n';
    for (var i = 0; i < items.length; i++) {
      var src = items[i].source === 'ai-knowledge' ? 'AI联想' : '原文';
      content += '[' + (i+1) + '] ' + items[i].question + ' [' + src + ']\n';
      content += '    ' + items[i].answer.replace(/\n/g, '\n    ') + '\n';
      content += '    [保存于：' + (items[i].savedAt||'') + ']\n\n';
    }
  }
  var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

var toastTimer = null;
function showToast(msg) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    el.classList.remove('show');
  }, 2500);
}

var confirmCallback = null;
function showConfirm(msg, onYes) {
  document.getElementById('confirm-msg').textContent = msg;
  confirmCallback = onYes;
  var yesBtn = document.getElementById('confirm-yes-btn');
  yesBtn.onclick = function() {
    var cb = confirmCallback;
    closeConfirmModal();
    if (cb) cb();
  };
  document.getElementById('confirm-modal').classList.add('active');
}
function closeConfirmModal() {
  document.getElementById('confirm-modal').classList.remove('active');
  confirmCallback = null;
}

/* ===== 思维导图导出 ===== */
function exportMindmapMD() {
  if (!mindmapData) { showToast('暂无思维导图可导出！'); return; }
  var content = '# 🧠 ' + mindmapData.title + '\n\n';
  content += '> 导出时间：' + new Date().toLocaleString('zh-CN') + '\n\n';
  for (var i = 0; i < mindmapData.branches.length; i++) {
    var b = mindmapData.branches[i];
    content += '## ' + (i+1) + '. ' + b.title + '\n\n';
    for (var j = 0; j < b.children.length; j++) {
      content += '- ' + b.children[j] + '\n';
    }
    content += '\n';
  }
  var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = '思维导图_' + fmtDate() + '.md';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function exportMindmapPNG() {
  if (!mindmapData) { showToast('暂无思维导图可导出！'); return; }

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var pad = 30, nodeH = 34, gapY = 60, gapChild = 24, lineLen = 50;

  var totalH = pad * 2;
  for (var i = 0; i < mindmapData.branches.length; i++) {
    var b = mindmapData.branches[i];
    var bh = Math.max(nodeH, b.children.length * gapChild + 10);
    totalH += bh + gapY;
  }
  totalH -= gapY;

  ctx.font = 'bold 15px "Microsoft YaHei",sans-serif';
  var rootW = ctx.measureText(mindmapData.title).width + 36;
  var maxBranchW = 0, maxChildW = 0;
  for (var i = 0; i < mindmapData.branches.length; i++) {
    var b = mindmapData.branches[i];
    ctx.font = 'bold 13px "Microsoft YaHei",sans-serif';
    maxBranchW = Math.max(maxBranchW, ctx.measureText(b.title).width + 28);
    ctx.font = '12px "Microsoft YaHei",sans-serif';
    for (var j = 0; j < b.children.length; j++) {
      maxChildW = Math.max(maxChildW, ctx.measureText(b.children[j]).width + 20);
    }
  }

  var canvasW = pad + rootW + lineLen + Math.max(maxBranchW, maxChildW + 20) + pad + 40;
  var canvasH = Math.max(totalH, 160);
  canvas.width = canvasW * 2; canvas.height = canvasH * 2;
  canvas.style.width = canvasW + 'px'; canvas.style.height = canvasH + 'px';
  ctx.scale(2, 2);

  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvasW, canvasH);

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r); ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h); ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r); ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath();
  }

  var rootX = pad, rootY = canvasH/2 - nodeH/2;
  ctx.fillStyle = '#2563eb'; rr(rootX, rootY, rootW, nodeH, 8); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 15px "Microsoft YaHei",sans-serif';
  ctx.textBaseline = 'middle'; ctx.fillText(mindmapData.title, rootX+18, rootY+nodeH/2);

  var curY = pad;
  for (var i = 0; i < mindmapData.branches.length; i++) {
    var b = mindmapData.branches[i];
    var bh = Math.max(nodeH, b.children.length * gapChild + 10);
    var by = curY + bh/2 - nodeH/2;

    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rootX+rootW, rootY+nodeH/2);
    ctx.bezierCurveTo(rootX+rootW+lineLen*0.5, rootY+nodeH/2, rootX+rootW+lineLen*0.5, by+nodeH/2, rootX+rootW+lineLen, by+nodeH/2);
    ctx.stroke();

    ctx.font = 'bold 13px "Microsoft YaHei",sans-serif';
    var bw = ctx.measureText(b.title).width + 28;
    ctx.fillStyle = '#dbeafe'; rr(rootX+rootW+lineLen, by, bw, nodeH, 6); ctx.fill();
    ctx.fillStyle = '#1e3a5f'; ctx.fillText(b.title, rootX+rootW+lineLen+14, by+nodeH/2);

    for (var j = 0; j < b.children.length; j++) {
      var cy = curY + j*gapChild + gapChild/2 + 5;
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath(); ctx.arc(rootX+rootW+lineLen+bw+15, cy, 3.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#334155'; ctx.font = '12px "Microsoft YaHei",sans-serif';
      ctx.fillText(b.children[j], rootX+rootW+lineLen+bw+24, cy);
    }
    curY += bh + gapY;
  }

  var link = document.createElement('a');
  link.download = '思维导图_' + fmtDate() + '.png';
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link); link.click();
  document.body.removeChild(link);
}

function clearNotebook() {
  showConfirm('确定要清空笔记本吗？所有已保存的笔记将被删除。', function() {
    localStorage.removeItem(NOTEBOOK_KEY);
    updateNotebookBadge();
    renderNotebookList();
  });
}
function fmtDate() {
  var d = new Date();
  return d.getFullYear() + '' + pad(d.getMonth()+1) + '' + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes());
}
function pad(n) { return n < 10 ? '0'+n : ''+n; }

// ===== Init =====
document.addEventListener('DOMContentLoaded', function() { showPage('home'); updateNotebookBadge(); });
