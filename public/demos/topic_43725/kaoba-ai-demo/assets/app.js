// ===== 考霸AI Demo - 主应用逻辑 =====

// ----- 题库数据 -----
var QUESTIONS = [
  {
    id: 1, type: 'choice', category: '数据类型',
    text: '以下哪个是 JavaScript 的基本数据类型（原始类型）？',
    options: ['Array', 'Object', 'String', 'Function'],
    answer: 2,
    explanation: 'JavaScript 有 7 种原始类型：string, number, boolean, null, undefined, symbol, bigint。Array、Object、Function 都是引用类型。',
    extend: [
      '以下哪个不属于 JavaScript 原始类型？ A. Number  B. Boolean  C. Array  D. Symbol',
      'typeof null 的返回值是什么？ A. "null"  B. "undefined"  C. "object"  D. "boolean"',
      'ES6 新增了哪种原始数据类型？ A. Array  B. Map  C. Symbol  D. Set'
    ]
  },
  {
    id: 2, type: 'choice', category: '作用域',
    text: '关于 JavaScript 变量作用域，以下说法正确的是？',
    options: [
      'var 声明的变量具有块级作用域',
      'let 声明的变量具有块级作用域',
      'const 声明的变量可以重新赋值',
      '所有变量声明都具有函数作用域'
    ],
    answer: 1,
    explanation: 'let 和 const 声明的变量具有块级作用域（{} 内有效），var 声明的变量具有函数作用域。const 声明的变量不能重新赋值。',
    extend: [
      'var 在 for 循环中声明变量，循环结束后变量是否还存在？',
      'let 和 const 的主要区别是什么？',
      '以下代码输出什么：for(let i=0;i<3;i++){setTimeout(()=>console.log(i),100)}'
    ]
  },
  {
    id: 3, type: 'choice', category: 'DOM操作',
    text: '以下哪个方法可以用来获取 ID 为 "app" 的 DOM 元素？',
    options: [
      'document.querySelector(".app")',
      'document.getElementById("app")',
      'document.getElementsByTagName("app")',
      'document.getElementsByClassName("app")'
    ],
    answer: 1,
    explanation: 'getElementById 通过 ID 获取元素；querySelector(".app") 使用类选择器；getElementsByTagName 获取标签名；getElementsByClassName 获取类名。',
    extend: [
      'querySelector 和 getElementById 的区别是什么？',
      '如何用 querySelector 获取 ID 为 "app" 的元素？',
      'document.querySelectorAll 返回的是什么类型？'
    ]
  },
  {
    id: 4, type: 'fill', category: 'CSS布局',
    text: 'CSS 中，flex-direction 的默认值是 ______',
    answer: 'row',
    explanation: 'flex-direction 默认值为 row，即主轴为水平方向，子元素从左到右排列。其他值有 column、row-reverse、column-reverse。',
    extend: [
      'flex-direction 设为 column 时，子元素的排列方向是什么？',
      'flex: 1 等价于哪三个属性的简写？',
      '如何让 flex 子元素在主轴方向居中？'
    ]
  },
  {
    id: 5, type: 'choice', category: '异步编程',
    text: '以下关于 Promise 的说法，错误的是？',
    options: [
      'Promise 有三种状态：pending、fulfilled、rejected',
      'Promise 状态一旦改变就不可逆',
      'Promise.all() 中只要有一个 fulfilled 就会 fulfilled',
      'Promise 可以通过 .then() 和 .catch() 处理结果'
    ],
    answer: 2,
    explanation: 'Promise.all() 需要所有 Promise 都 fulfilled 才会 fulfilled，只要有一个 rejected 就会 rejected。Promise.any() 才是只要有一个 fulfilled 就 fulfilled。',
    extend: [
      'Promise.all 和 Promise.race 的区别是什么？',
      '如何手动创建一个 Promise？',
      'async/await 和 Promise 的关系是什么？'
    ]
  },
  {
    id: 6, type: 'choice', category: '数组方法',
    text: '以下哪个数组方法会修改原数组？',
    options: [
      'map()',
      'filter()',
      'splice()',
      'concat()'
    ],
    answer: 2,
    explanation: 'splice() 会直接修改原数组（增删改元素）。map()、filter()、concat() 都返回新数组，不修改原数组。push()、pop()、shift()、unshift()、sort()、reverse() 也会修改原数组。',
    extend: [
      'slice 和 splice 的区别是什么？',
      'map 和 forEach 的区别是什么？',
      '如何用 filter 实现数组去重？'
    ]
  },
  {
    id: 7, type: 'fill', category: '事件机制',
    text: 'JavaScript 中，阻止事件冒泡使用的方法是 event.______',
    answer: 'stopPropagation',
    explanation: 'event.stopPropagation() 阻止事件继续向父元素冒泡。event.preventDefault() 阻止事件的默认行为（如阻止表单提交、阻止链接跳转）。',
    extend: [
      'stopPropagation 和 stopImmediatePropagation 的区别？',
      '事件捕获和事件冒泡的执行顺序是什么？',
      'addEventListener 的第三个参数 useCapture 的作用是什么？'
    ]
  },
  {
    id: 8, type: 'choice', category: 'ES6特性',
    text: '以下关于箭头函数的说法，正确的是？',
    options: [
      '箭头函数有自己的 this 绑定',
      '箭头函数可以作为构造函数使用',
      '箭头函数没有自己的 this，继承外层 this',
      '箭头函数可以使用 arguments 对象'
    ],
    answer: 2,
    explanation: '箭头函数不绑定自己的 this，它从包含它的词法作用域继承 this。箭头函数不能用作构造函数（不能 new），也没有 arguments 对象。',
    extend: [
      '在对象方法中使用箭头函数会有什么问题？',
      '如何让箭头函数中的 this 指向特定对象？',
      '普通函数和箭头函数在回调中使用有什么区别？'
    ]
  },
  {
    id: 9, type: 'choice', category: 'HTTP',
    text: 'HTTP 状态码 404 表示什么？',
    options: [
      '服务器内部错误',
      '请求成功',
      '资源未找到',
      '请求被拒绝'
    ],
    answer: 2,
    explanation: '404 Not Found 表示服务器无法找到请求的资源。200 OK 表示成功，500 Internal Server Error 表示服务器内部错误，403 Forbidden 表示拒绝访问。',
    extend: [
      'HTTP 状态码 301 和 302 的区别是什么？',
      '常见的 5xx 状态码有哪些？分别表示什么？',
      'HTTP 和 HTTPS 的区别是什么？'
    ]
  },
  {
    id: 10, type: 'choice', category: '闭包',
    text: '以下代码的输出结果是什么？\nfor (var i = 0; i < 3; i++) {\n  setTimeout(function() { console.log(i); }, 100);\n}',
    options: [
      '0, 1, 2',
      '3, 3, 3',
      'undefined, undefined, undefined',
      '0, 0, 0'
    ],
    answer: 1,
    explanation: '因为 var 声明的 i 具有函数作用域，循环结束后 i = 3。三个 setTimeout 回调共享同一个 i，所以都输出 3。如果用 let 声明，每次循环都有独立的 i，就会输出 0, 1, 2。',
    extend: [
      '如何修改代码使其输出 0, 1, 2？（至少两种方法）',
      '什么是闭包？闭包的实际应用场景有哪些？',
      'let 为什么能解决这个问题？底层原理是什么？'
    ]
  }
];

// ----- 应用状态 -----
var state = {
  currentPage: 'home',
  currentQuestion: 0,
  answers: {},
  examStarted: false,
  examFinished: false,
  timerInterval: null,
  timeLeft: 30 * 60, // 30 minutes
  timeUsed: 0,
  uploaded: false,
  aiStep: 0
};

// ===== 导航 =====
function navigateTo(page) {
  if (page === 'exam' && !state.examStarted) {
    startDemoExam();
    return;
  }
  if (page === 'result' && !state.examFinished) {
    showToast('请先完成一次考试', 'info');
    return;
  }
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-link').forEach(function(n) { n.classList.remove('active'); });
  var target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  var navBtn = document.querySelector('.nav-link[data-page="' + page + '"]');
  if (navBtn) navBtn.classList.add('active');
  state.currentPage = page;
  window.scrollTo(0, 0);

  // Init charts when navigating
  if (page === 'result') {
    setTimeout(initResultCharts, 100);
  }
  if (page === 'history') {
    setTimeout(initHistoryChart, 100);
  }
}

// Nav click handlers
document.querySelectorAll('.nav-link').forEach(function(btn) {
  btn.addEventListener('click', function() {
    navigateTo(this.dataset.page);
  });
});

// ===== Toast =====
function showToast(msg, type) {
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast ' + (type || 'info');
  setTimeout(function() { toast.classList.add('show'); }, 10);
  setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

// ===== Modal =====
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

// ===== 创建考试 - Tab切换 =====
document.querySelectorAll('.create-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.create-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.create-panel').forEach(function(p) { p.classList.remove('active'); });
    this.classList.add('active');
    document.getElementById('panel-' + this.dataset.tab).classList.add('active');
  });
});

// ===== 成绩分析 - Tab切换 =====
document.querySelectorAll('.analysis-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.analysis-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.analysis-panel').forEach(function(p) { p.classList.remove('active'); });
    this.classList.add('active');
    document.getElementById('apanel-' + this.dataset.atab).classList.add('active');
    if (this.dataset.atab === 'radar') {
      setTimeout(initResultCharts, 100);
    }
  });
});

// ===== 上传模拟 =====
function simulateUpload() {
  if (state.uploaded) return;
  state.uploaded = true;
  document.getElementById('upload-status').style.display = 'block';
  showToast('文件上传成功，AI正在解析试卷...', 'success');
  setTimeout(function() {
    document.getElementById('upload-status').innerHTML =
      '<div style="display:flex;align-items:center;gap:0.5rem;color:var(--success);font-size:0.88rem">' +
      '<span>✓</span><span>试卷解析完成！识别到 10 道题目（8道选择 + 2道填空），点击下方按钮开始考试</span></div>';
  }, 2000);
}

function generateFromUpload() {
  if (!state.uploaded) {
    showToast('请先上传试卷文件', 'error');
    return;
  }
  startDemoExam();
}

// ===== AI对话 =====
var aiResponses = [
  '好的！我来帮你生成一份 JavaScript 基础测试试卷。\n\n📋 试卷配置：\n- 学科：计算机科学 - JavaScript\n- 题数：10题（8道选择题 + 2道填空题）\n- 难度：中等\n- 时长：30分钟\n\n正在生成试卷，请稍候...',
  '✅ 试卷生成完成！共 10 道题目，涵盖数据类型、作用域、DOM操作、CSS布局、异步编程、数组方法、事件机制、ES6特性、HTTP、闭包等知识点。\n\n点击下方按钮即可开始考试！'
];

function sendAiMsg() {
  var input = document.getElementById('ai-input');
  var msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  var chat = document.getElementById('ai-chat');

  // User message
  chat.innerHTML += '<div class="chat-msg user"><div class="chat-avatar">U</div><div class="chat-bubble">' + escapeHtml(msg) + '</div></div>';

  // AI response
  setTimeout(function() {
    chat.innerHTML += '<div class="chat-msg ai"><div class="chat-avatar">AI</div><div class="chat-bubble">' +
      aiResponses[state.aiStep].replace(/\n/g, '<br>') + '</div></div>';
    state.aiStep++;
    chat.scrollTop = chat.scrollHeight;

    if (state.aiStep >= 2) {
      setTimeout(function() {
        showToast('试卷已生成，即将开始考试...', 'success');
        setTimeout(startDemoExam, 1500);
      }, 1000);
    }
  }, 800);

  chat.scrollTop = chat.scrollHeight;
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== 开始考试 =====
function startDemoExam() {
  state.currentQuestion = 0;
  state.answers = {};
  state.examStarted = true;
  state.examFinished = false;
  state.timeLeft = 30 * 60;
  state.timeUsed = 0;
  state.uploaded = false;
  state.aiStep = 0;

  // Reset upload status
  var uploadStatus = document.getElementById('upload-status');
  if (uploadStatus) {
    uploadStatus.style.display = 'none';
    uploadStatus.innerHTML = '';
  }

  // Navigate to exam page
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.getElementById('page-exam').classList.add('active');
  document.querySelectorAll('.nav-link').forEach(function(n) { n.classList.remove('active'); });
  var navBtn = document.querySelector('.nav-link[data-page="exam"]');
  if (navBtn) navBtn.classList.add('active');
  window.scrollTo(0, 0);

  renderQuestion();
  renderNav();
  startTimer();
  showToast('考试开始！祝你取得好成绩', 'info');
}

// ===== 计时器 =====
function startTimer() {
  clearInterval(state.timerInterval);
  updateTimerDisplay();
  state.timerInterval = setInterval(function() {
    state.timeLeft--;
    state.timeUsed++;
    if (state.timeLeft <= 0) {
      clearInterval(state.timerInterval);
      showToast('时间到！自动交卷', 'error');
      confirmSubmit();
      return;
    }
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  var m = Math.floor(state.timeLeft / 60);
  var s = state.timeLeft % 60;
  document.getElementById('exam-timer').textContent = '⏱ ' + m + ':' + (s < 10 ? '0' : '') + s;
  if (state.timeLeft < 300) {
    document.getElementById('exam-timer').style.color = 'var(--danger)';
  } else {
    document.getElementById('exam-timer').style.color = 'var(--accent)';
  }
}

// ===== 渲染题目 =====
function renderQuestion() {
  var q = QUESTIONS[state.currentQuestion];
  var container = document.getElementById('question-container');
  var progressText = '第 ' + (state.currentQuestion + 1) + '/' + QUESTIONS.length + ' 题';
  document.getElementById('exam-progress-text').textContent = progressText;

  var html = '<div class="question-card">';
  html += '<div class="question-num">' + getCategoryLabel(q.category) + ' · 第 ' + (state.currentQuestion + 1) + ' 题</div>';
  html += '<div class="question-text">' + escapeHtml(q.text).replace(/\n/g, '<br>') + '</div>';

  if (q.type === 'choice') {
    html += '<div class="option-list">';
    var labels = ['A', 'B', 'C', 'D'];
    q.options.forEach(function(opt, i) {
      var selected = state.answers[q.id] === i ? ' selected' : '';
      html += '<div class="option-item' + selected + '" onclick="selectOption(' + q.id + ',' + i + ')">' +
        '<div class="option-radio"></div><span>' + labels[i] + '. ' + escapeHtml(opt) + '</span></div>';
    });
    html += '</div>';
  } else if (q.type === 'fill') {
    var val = state.answers[q.id] || '';
    html += '<input class="fill-input" placeholder="请输入答案..." value="' + escapeHtml(val) + '" ' +
      'oninput="fillAnswer(' + q.id + ', this.value)">';
  }

  html += '</div>';
  container.innerHTML = html;

  // Update nav buttons
  document.getElementById('btn-prev').style.visibility = state.currentQuestion === 0 ? 'hidden' : 'visible';
  document.getElementById('btn-next').style.visibility = state.currentQuestion === QUESTIONS.length - 1 ? 'hidden' : 'visible';
}

function getCategoryLabel(cat) {
  var map = {
    '数据类型': '🏷️ 数据类型', '作用域': '🏷️ 作用域', 'DOM操作': '🏷️ DOM',
    'CSS布局': '🏷️ CSS', '异步编程': '🏷️ 异步', '数组方法': '🏷️ 数组',
    '事件机制': '🏷️ 事件', 'ES6特性': '🏷️ ES6', 'HTTP': '🏷️ HTTP', '闭包': '🏷️ 闭包'
  };
  return map[cat] || '🏷️ ' + cat;
}

// ===== 答题操作 =====
function selectOption(qId, optIndex) {
  state.answers[qId] = optIndex;
  renderQuestion();
  renderNav();
}

function fillAnswer(qId, value) {
  state.answers[qId] = value;
}

// ===== 题目导航 =====
function renderNav() {
  var nav = document.getElementById('question-nav');
  var html = '';
  QUESTIONS.forEach(function(q, i) {
    var cls = 'q-nav-btn';
    if (i === state.currentQuestion) cls += ' current';
    else if (state.answers[q.id] !== undefined && state.answers[q.id] !== '') cls += ' answered';
    html += '<div class="' + cls + '" onclick="goToQuestion(' + i + ')">' + (i + 1) + '</div>';
  });
  nav.innerHTML = html;
}

function goToQuestion(index) {
  state.currentQuestion = index;
  renderQuestion();
  renderNav();
}

function prevQuestion() {
  if (state.currentQuestion > 0) {
    state.currentQuestion--;
    renderQuestion();
    renderNav();
  }
}

function nextQuestion() {
  if (state.currentQuestion < QUESTIONS.length - 1) {
    state.currentQuestion++;
    renderQuestion();
    renderNav();
  }
}

// ===== 交卷 =====
function submitExam() {
  var unanswered = 0;
  QUESTIONS.forEach(function(q) {
    if (state.answers[q.id] === undefined || state.answers[q.id] === '') unanswered++;
  });
  document.getElementById('modal-submit-msg').innerHTML =
    '你还有 <strong>' + unanswered + '</strong> 题未作答，确定要交卷吗？';
  openModal('modal-submit');
}

function confirmSubmit() {
  closeModal('modal-submit');
  clearInterval(state.timerInterval);
  state.examFinished = true;
  calculateResult();
  navigateTo('result');
}

// ===== 计算成绩 =====
function calculateResult() {
  var correct = 0, wrong = 0, unanswered = 0;
  var wrongList = [];

  QUESTIONS.forEach(function(q) {
    var userAns = state.answers[q.id];
    if (userAns === undefined || userAns === '') {
      unanswered++;
    } else if (q.type === 'choice') {
      if (userAns === q.answer) correct++;
      else { wrong++; wrongList.push(q); }
    } else if (q.type === 'fill') {
      if (userAns.trim().toLowerCase() === q.answer.toLowerCase()) correct++;
      else { wrong++; wrongList.push(q); }
    }
  });

  var score = Math.round((correct / QUESTIONS.length) * 100);
  var m = Math.floor(state.timeUsed / 60);
  var s = state.timeUsed % 60;

  document.getElementById('result-score').textContent = score;
  document.getElementById('result-correct').textContent = correct;
  document.getElementById('result-wrong').textContent = wrong;
  document.getElementById('result-unanswered').textContent = unanswered;
  document.getElementById('result-time').textContent = m + ':' + (s < 10 ? '0' : '') + s;

  // Render wrong questions
  renderWrongQuestions(wrongList);
  renderExtendQuestions(wrongList);

  // Update home stats
  document.getElementById('stat-exams').textContent = parseInt(document.getElementById('stat-exams').textContent) + 1;
  document.getElementById('stat-avg').textContent = Math.round((parseInt(document.getElementById('stat-avg').textContent) + score) / 2);
  document.getElementById('stat-wrong').textContent = parseInt(document.getElementById('stat-wrong').textContent) + wrong;
}

// ===== 渲染错题分析 =====
function renderWrongQuestions(wrongList) {
  var container = document.getElementById('wrong-questions-list');
  var allCorrectMsg = document.getElementById('all-correct-msg');

  if (wrongList.length === 0) {
    container.innerHTML = '';
    allCorrectMsg.style.display = 'block';
    return;
  }

  allCorrectMsg.style.display = 'none';
  var html = '';
  var labels = ['A', 'B', 'C', 'D'];

  wrongList.forEach(function(q, idx) {
    var userAns = state.answers[q.id];
    var userAnsText = q.type === 'choice' ? labels[userAns] + '. ' + q.options[userAns] : userAns;
    var correctAnsText = q.type === 'choice' ? labels[q.answer] + '. ' + q.options[q.answer] : q.answer;

    html += '<div class="wq-card">';
    html += '<div class="wq-header" onclick="toggleWq(this)">';
    html += '<div class="wq-num">' + (idx + 1) + '</div>';
    html += '<div class="wq-title">第 ' + q.id + ' 题 - ' + q.category + '</div>';
    html += '<div class="wq-arrow">▼</div>';
    html += '</div>';
    html += '<div class="wq-body">';

    // Question
    html += '<div class="wq-section"><div class="wq-section-title">题目</div>';
    html += '<div class="wq-section-content">' + escapeHtml(q.text).replace(/\n/g, '<br>') + '</div></div>';

    // Your answer (wrong)
    html += '<div class="wq-section"><div class="wq-section-title wrong">❌ 你的答案</div>';
    html += '<div class="wq-section-content" style="border-left:3px solid var(--danger)">' + escapeHtml(userAnsText) + '</div></div>';

    // Correct answer
    html += '<div class="wq-section"><div class="wq-section-title correct">✅ 正确答案</div>';
    html += '<div class="wq-section-content" style="border-left:3px solid var(--success)">' + escapeHtml(correctAnsText) + '</div></div>';

    // Explanation
    html += '<div class="wq-section"><div class="wq-section-title extend">📖 解析</div>';
    html += '<div class="wq-section-content" style="border-left:3px solid var(--accent)">' + escapeHtml(q.explanation) + '</div></div>';

    html += '</div></div>';
  });

  container.innerHTML = html;
}

function toggleWq(header) {
  var body = header.nextElementSibling;
  var arrow = header.querySelector('.wq-arrow');
  body.classList.toggle('open');
  arrow.classList.toggle('open');
}

// ===== 渲染举一反三 =====
function renderExtendQuestions(wrongList) {
  var container = document.getElementById('extend-questions-list');

  if (wrongList.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--muted)">' +
      '<div style="font-size:3rem;margin-bottom:0.5rem">🌟</div>' +
      '<div style="font-weight:700">没有错题，无需举一反三</div></div>';
    return;
  }

  var html = '';
  wrongList.forEach(function(q, idx) {
    html += '<div class="card" style="margin-bottom:1rem">';
    html += '<div class="card-header"><div class="card-title">第 ' + q.id + ' 题的举一反三</div>' +
      '<span style="font-size:0.8rem;color:var(--muted);background:var(--bg);padding:0.2rem 0.6rem;border-radius:6px">' +
      q.category + '</span></div>';
    html += '<div style="background:var(--bg);border-radius:8px;padding:0.8rem;margin-bottom:0.8rem;font-size:0.88rem;color:var(--muted)">' +
      '<strong style="color:var(--ink)">原题：</strong>' + escapeHtml(q.text).replace(/\n/g, '<br>') + '</div>';

    q.extend.forEach(function(eq, ei) {
      html += '<div class="extend-question" onclick="this.style.background=\'rgba(74,144,217,0.2)\'">' +
        '<strong style="color:var(--accent)">变式题 ' + (ei + 1) + '：</strong> ' + escapeHtml(eq) + '</div>';
    });

    html += '</div>';
  });

  container.innerHTML = html;
}

// ===== Charts =====
var radarChart = null;
var historyChart = null;

function initResultCharts() {
  if (!document.getElementById('chart-radar')) return;
  var el = document.getElementById('chart-radar');

  // Calculate category scores
  var categories = {};
  QUESTIONS.forEach(function(q) {
    if (!categories[q.category]) categories[q.category] = { total: 0, correct: 0 };
    categories[q.category].total++;
    var userAns = state.answers[q.id];
    if (userAns !== undefined && userAns !== '') {
      if (q.type === 'choice' && userAns === q.answer) categories[q.category].correct++;
      if (q.type === 'fill' && userAns.trim().toLowerCase() === q.answer.toLowerCase()) categories[q.category].correct++;
    }
  });

  var indicators = [];
  var currentData = [];
  Object.keys(categories).forEach(function(cat) {
    indicators.push({ name: cat, max: 100 });
    currentData.push(Math.round((categories[cat].correct / categories[cat].total) * 100));
  });

  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  if (radarChart) radarChart.dispose();
  radarChart = echarts.init(el, null, { renderer: 'svg' });
  radarChart.setOption({
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true },
    radar: {
      indicator: indicators,
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: ink, fontSize: 12, fontWeight: 600 },
      splitLine: { lineStyle: { color: rule } },
      splitArea: { show: true, areaStyle: { color: [bg2, 'rgba(74,144,217,0.03)'] } },
      axisLine: { lineStyle: { color: rule } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: currentData,
        name: '本次考试',
        areaStyle: { color: accent + '33' },
        lineStyle: { color: accent, width: 2 },
        itemStyle: { color: accent }
      }]
    }]
  });
  window.addEventListener('resize', function() { if (radarChart) radarChart.resize(); });
}

function initHistoryChart() {
  if (!document.getElementById('chart-history')) return;
  var el = document.getElementById('chart-history');

  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();

  if (historyChart) historyChart.dispose();
  historyChart = echarts.init(el, null, { renderer: 'svg' });
  historyChart.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    legend: { data: ['考试分数', '知识点掌握率'], bottom: 0, textStyle: { color: muted } },
    grid: { left: 50, right: 30, top: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: ['6/10', '6/15', '6/18', '6/20', '6/22', '6/24'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value', max: 100,
      axisLine: { lineStyle: { color: rule } },
      splitLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    series: [
      {
        name: '考试分数', type: 'bar',
        data: [72, 78, 65, 68, 75, 92],
        itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] },
        barWidth: '30%'
      },
      {
        name: '知识点掌握率', type: 'line',
        data: [70, 75, 68, 72, 78, 85],
        lineStyle: { color: accent2, width: 2 },
        itemStyle: { color: accent2 },
        smooth: true
      }
    ]
  });
  window.addEventListener('resize', function() { if (historyChart) historyChart.resize(); });
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', function() {
  // Nothing special needed on load
});
