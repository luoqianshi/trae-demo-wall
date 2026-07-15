/* ============================================
   刷题有道 - 核心应用逻辑
   纯原生 JS 实现，无依赖，数据存 LocalStorage
   ============================================ */

/* ===== 1. 工具函数 ===== */
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const fmtDate = (iso) => {
  const d = new Date(iso);
  return `${d.getMonth()+1}月${d.getDate()}日`;
};

const fmtDateTime = (iso) => {
  const d = new Date(iso);
  return `${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const fmtTime = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};

/* LocalStorage 封装 */
const Store = {
  get(key, def) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
    catch { return def; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  remove(key) { localStorage.removeItem(key); }
};

/* Toast 提示 */
function toast(msg, duration = 2000) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

/* 模态框 */
function showModal({ title, body, footer }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">${title}</div>
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  return overlay;
}

function closeModal(overlay) { if (overlay) overlay.remove(); }

/* ===== 2. 数据键名 ===== */
const KEYS = {
  banks: 'zx_banks',
  questions: 'zx_questions',
  records: 'zx_records',
  wrongs: 'zx_wrongs',
  settings: 'zx_settings'
};

/* ===== 3. 默认设置 ===== */
const DEFAULT_SETTINGS = {
  theme: 'light',
  showTimer: true,
  autoNext: false,
  showExplanation: true,
  practiceMode: 'sequential',
  aiEnabled: false,
  aiApiKey: '',
  aiApiEndpoint: ''
};

/* ===== 4. 示例题库 ===== */
const SAMPLE_BANK = {
  id: 'sample-001',
  name: '计算机基础常识',
  description: '计算机基础知识测试，涵盖硬件、软件、网络等基础概念',
  category: '计算机',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  questions: [
    {
      id: 'q1',
      content: '下列哪个不是计算机的输入设备？',
      type: 'single',
      options: ['键盘', '鼠标', '显示器', '扫描仪'],
      correctAnswers: [2],
      explanation: '显示器是输出设备，用于显示计算机处理后的信息。键盘、鼠标和扫描仪都是输入设备，用于向计算机输入数据和指令。',
      difficulty: 1
    },
    {
      id: 'q2',
      content: '以下属于操作系统的有哪些？（多选）',
      type: 'multiple',
      options: ['Windows', 'Photoshop', 'Linux', 'macOS'],
      correctAnswers: [0, 2, 3],
      explanation: 'Windows、Linux 和 macOS 都是操作系统。Photoshop 是应用软件，属于图像处理工具，不是操作系统。',
      difficulty: 1
    },
    {
      id: 'q3',
      content: 'CPU 的中文全称是中央处理器。',
      type: 'judge',
      options: ['正确', '错误'],
      correctAnswers: [0],
      explanation: 'CPU 即 Central Processing Unit，中文全称为"中央处理器"，是计算机的运算和控制核心。',
      difficulty: 1
    },
    {
      id: 'q4',
      content: '1 个字节（Byte）等于多少位（bit）？',
      type: 'single',
      options: ['4 位', '8 位', '16 位', '32 位'],
      correctAnswers: [1],
      explanation: '1 Byte = 8 bit。字节是计算机存储容量的基本单位，每个字节由 8 个二进制位组成。',
      difficulty: 2
    },
    {
      id: 'q5',
      content: 'HTTP 协议默认使用的端口号是？',
      type: 'single',
      options: ['21', '22', '80', '443'],
      correctAnswers: [2],
      explanation: 'HTTP 协议默认端口为 80，HTTPS 默认端口为 443，FTP 默认端口为 21，SSH 默认端口为 22。',
      difficulty: 2
    },
    {
      id: 'q6',
      content: 'RAM 断电后数据会丢失，ROM 断电后数据不会丢失。',
      type: 'judge',
      options: ['正确', '错误'],
      correctAnswers: [0],
      explanation: 'RAM（随机存取存储器）是易失性存储器，断电后数据丢失；ROM（只读存储器）是非易失性存储器，断电后数据保留。',
      difficulty: 2
    },
    {
      id: 'q7',
      content: '以下哪些是编程语言？（多选）',
      type: 'multiple',
      options: ['Python', 'HTTP', 'Java', 'SQL'],
      correctAnswers: [0, 2, 3],
      explanation: 'Python、Java 和 SQL 都是编程语言。HTTP 是超文本传输协议，属于网络通信协议，不是编程语言。',
      difficulty: 2
    },
    {
      id: 'q8',
      content: 'IPv4 地址由多少位二进制数组成？',
      type: 'single',
      options: ['16 位', '32 位', '64 位', '128 位'],
      correctAnswers: [1],
      explanation: 'IPv4 地址由 32 位二进制数组成，通常表示为 4 个十进制数（0-255），如 192.168.1.1。IPv6 则由 128 位组成。',
      difficulty: 3
    }
  ]
};

/* ===== 5. 数据管理器 ===== */
const DB = {
  getBanks() { return Store.get(KEYS.banks, []); },
  saveBanks(banks) { Store.set(KEYS.banks, banks); },

  getQuestions() { return Store.get(KEYS.questions, []); },
  saveQuestions(qs) { Store.set(KEYS.questions, qs); },

  getRecords() { return Store.get(KEYS.records, []); },
  saveRecords(rs) { Store.set(KEYS.records, rs); },

  getWrongs() { return Store.get(KEYS.wrongs, []); },
  saveWrongs(ws) { Store.set(KEYS.wrongs, ws); },

  getSettings() {
    return { ...DEFAULT_SETTINGS, ...Store.get(KEYS.settings, {}) };
  },
  saveSettings(s) { Store.set(KEYS.settings, s); },

  /* 初始化示例数据 */
  initSample() {
    if (this.getBanks().length === 0) {
      const bank = { ...SAMPLE_BANK };
      bank.totalQuestions = bank.questions.length;
      const { questions, ...bankMeta } = bank;
      questions.forEach(q => q.bankId = bank.id);
      this.saveBanks([bankMeta]);
      this.saveQuestions(questions);
    }
  },

  /* 获取题库的题目 */
  getQuestionsByBank(bankId) {
    return this.getQuestions().filter(q => q.bankId === bankId);
  },

  /* 获取题库的错题 */
  getWrongsByBank(bankId) {
    return this.getWrongs().filter(w => w.bankId === bankId);
  },

  /* 添加答题记录 + 更新错题 */
  addRecord(questionId, bankId, userAnswers, isCorrect, timeSpent) {
    const records = this.getRecords();
    records.push({
      id: uid(),
      questionId, bankId,
      isCorrect,
      userAnswers,
      timeSpent,
      answeredAt: new Date().toISOString()
    });
    this.saveRecords(records);

    /* 错题处理 */
    const wrongs = this.getWrongs();
    const existing = wrongs.find(w => w.questionId === questionId);
    if (!isCorrect) {
      if (existing) {
        existing.wrongCount++;
        existing.lastWrongAt = new Date().toISOString();
      } else {
        wrongs.push({
          id: uid(),
          questionId, bankId,
          wrongCount: 1,
          lastWrongAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      }
      this.saveWrongs(wrongs);
    } else {
      /* 答对了，从错题本移除 */
      if (existing) {
        const filtered = wrongs.filter(w => w.questionId !== questionId);
        this.saveWrongs(filtered);
      }
    }
  },

  /* 删除题库 */
  deleteBank(bankId) {
    this.saveBanks(this.getBanks().filter(b => b.id !== bankId));
    this.saveQuestions(this.getQuestions().filter(q => q.bankId !== bankId));
    this.saveWrongs(this.getWrongs().filter(w => w.bankId !== bankId));
  },

  /* 导入题库 */
  importBank(data) {
    const banks = this.getBanks();
    const questions = this.getQuestions();
    const bankId = uid();

    const bank = {
      id: bankId,
      name: data.name || '未命名题库',
      description: data.description || '',
      category: data.category || '未分类',
      totalQuestions: (data.questions || []).length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    banks.push(bank);

    (data.questions || []).forEach(q => {
      questions.push({
        id: uid(),
        bankId,
        content: q.content,
        type: q.type || 'single',
        options: q.options,
        correctAnswers: q.correctAnswers,
        explanation: q.explanation || '暂无解析',
        difficulty: q.difficulty || 2
      });
    });

    this.saveBanks(banks);
    this.saveQuestions(questions);
    return bank;
  },

  /* 统计 */
  getStats() {
    const records = this.getRecords();
    const wrongs = this.getWrongs();
    const totalTime = records.reduce((s, r) => s + r.timeSpent, 0);
    const correctCount = records.filter(r => r.isCorrect).length;
    const accuracy = records.length > 0 ? Math.round(correctCount / records.length * 100) : 0;
    return {
      total: records.length,
      correct: correctCount,
      wrong: records.length - correctCount,
      accuracy,
      totalTime,
      wrongCount: wrongs.length
    };
  },

  /* 获取最近7天答题数据 */
  getRecentRecords() {
    const records = this.getRecords();
    const now = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getMonth()+1}/${d.getDate()}`;
      const dayRecords = records.filter(r => {
        const rd = new Date(r.answeredAt);
        return rd.toDateString() === d.toDateString();
      });
      days.push({
        date: key,
        count: dayRecords.length,
        correct: dayRecords.filter(r => r.isCorrect).length
      });
    }
    return days;
  },

  /* 数据导出 */
  exportData() {
    return {
      banks: this.getBanks(),
      questions: this.getQuestions(),
      records: this.getRecords(),
      wrongs: this.getWrongs(),
      settings: this.getSettings(),
      exportAt: new Date().toISOString()
    };
  },

  /* 数据导入 */
  importAllData(data) {
    if (data.banks) this.saveBanks(data.banks);
    if (data.questions) this.saveQuestions(data.questions);
    if (data.records) this.saveRecords(data.records);
    if (data.wrongs) this.saveWrongs(data.wrongs);
    if (data.settings) this.saveSettings(data.settings);
  },

  /* 清空所有数据 */
  clearAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  }
};

/* ===== 6. 路由 ===== */
let currentRoute = 'banks';
const routes = {};

function registerRoute(name, renderFn) { routes[name] = renderFn; }

function navigate(name, params = {}) {
  currentRoute = name;
  window.scrollTo(0, 0);
  render(params);
}

function render(params = {}) {
  const app = $('#app');
  const fn = routes[currentRoute] || routes.banks;
  app.innerHTML = '';
  const page = fn(params);
  page.classList.add('page-enter');
  app.appendChild(page);
  updateNavActive();
}

function updateNavActive() {
  $$('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.route === currentRoute);
  });
}

/* ===== 7. 底部导航 ===== */
function renderNav() {
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.innerHTML = `
    <button class="nav-item active" data-route="banks">
      <span class="nav-icon">📚</span>题库
    </button>
    <button class="nav-item" data-route="wrongs">
      <span class="nav-icon">📝</span>错题本
    </button>
    <button class="nav-item" data-route="profile">
      <span class="nav-icon">👤</span>我的
    </button>`;
  nav.addEventListener('click', e => {
    const item = e.target.closest('.nav-item');
    if (item) navigate(item.dataset.route);
  });
  return nav;
}

/* ===== 8. 页面：题库列表 ===== */
function renderBanksPage() {
  const page = document.createElement('div');
  const banks = DB.getBanks();

  page.innerHTML = `
    <div class="page-header">
      <h1>刷题有道</h1>
      <div class="subtitle">智能备考助手 · 自定义题库</div>
    </div>
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input type="text" id="bankSearch" placeholder="搜索题库...">
    </div>
    <div style="margin-bottom:16px">
      <button class="btn btn-accent btn-block" id="goImport">+ 导入题库</button>
    </div>
    <div id="bankList"></div>
  `;

  function renderList(filter = '') {
    const list = $('#bankList', page);
    const filtered = banks.filter(b => b.name.toLowerCase().includes(filter.toLowerCase()));

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="icon">📚</div>
          <div class="title">${filter ? '未找到匹配的题库' : '还没有题库'}</div>
          <div class="desc">${filter ? '试试其他关键词' : '点击上方按钮导入你的第一个题库'}</div>
        </div>`;
      return;
    }

    list.innerHTML = filtered.map(b => `
      <div class="bank-card" data-id="${b.id}">
        <div class="bank-name">${b.name}<span class="bank-cat">${b.category}</span></div>
        <div class="bank-meta">
          <span>📄 ${b.totalQuestions} 题</span>
          <span>📅 ${fmtDate(b.createdAt)}</span>
        </div>
        <div class="bank-actions">
          <button class="btn btn-primary btn-sm" data-action="start" data-id="${b.id}">开始刷题</button>
          <button class="btn btn-outline btn-sm" data-action="delete" data-id="${b.id}">删除</button>
        </div>
      </div>
    `).join('');

    /* 绑定事件 */
    $$('.bank-card', list).forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('[data-action]')) return;
        /* 点击卡片开始刷题 */
        navigate('practice', { bankId: card.dataset.id });
      });
    });
    $$('[data-action="start"]', list).forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        navigate('practice', { bankId: btn.dataset.id });
      });
    });
    $$('[data-action="delete"]', list).forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const bank = banks.find(b => b.id === id);
        const overlay = showModal({
          title: '确认删除',
          body: `<p style="color:var(--text-secondary);font-size:14px">确定要删除题库「${bank.name}」吗？所有相关的题目和错题记录将被清除。</p>`,
          footer: `
            <button class="btn btn-ghost" id="cancelDel">取消</button>
            <button class="btn btn-danger" id="confirmDel">删除</button>`
        });
        $('#cancelDel', overlay).onclick = () => closeModal(overlay);
        $('#confirmDel', overlay).onclick = () => {
          DB.deleteBank(id);
          closeModal(overlay);
          toast('题库已删除');
          render();
        };
      });
    });
  }

  renderList();

  $('#bankSearch', page).addEventListener('input', e => renderList(e.target.value));
  $('#goImport', page).addEventListener('click', () => navigate('import'));

  return page;
}

/* ===== 9. 页面：导入题库 ===== */
function renderImportPage() {
  const page = document.createElement('div');

  page.innerHTML = `
    <div class="page-header">
      <h1>导入题库</h1>
      <div class="subtitle">支持 JSON 格式题库导入</div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="field-label">JSON 文本导入</div>
      <textarea class="textarea" id="jsonInput" placeholder='粘贴 JSON 格式题库数据&#10;格式示例见下方模板'></textarea>
      <button class="btn btn-primary btn-block" id="importJsonBtn" style="margin-top:12px">导入</button>
    </div>

    <div class="import-zone" id="fileZone">
      <div class="icon">📁</div>
      <div class="text">点击选择文件或拖拽文件到此处</div>
      <div class="hint">支持 .json 文件</div>
      <input type="file" id="fileInput" accept=".json" style="display:none">
    </div>

    <div class="setting-section">
      <div class="section-title">导入格式说明</div>
      <div class="card">
        <div style="font-size:13px;color:var(--text-secondary);line-height:1.8">
          <p style="margin-bottom:8px"><b>type</b> 字段：single(单选) / multiple(多选) / judge(判断)</p>
          <p style="margin-bottom:8px"><b>correctAnswers</b>：正确选项的索引数组（从0开始）</p>
          <p style="margin-bottom:8px"><b>difficulty</b>：1(简单) / 2(中等) / 3(困难)</p>
        </div>
      </div>
    </div>

    <div class="setting-section">
      <div class="section-title">格式模板</div>
      <div class="card">
        <pre style="font-size:12px;overflow-x:auto;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap">${JSON_TEMPLATE}</pre>
      </div>
      <button class="btn btn-ghost btn-block" id="copyTemplate" style="margin-top:12px">复制模板</button>
    </div>

    <button class="btn btn-ghost btn-block" id="goBack" style="margin-top:12px">返回题库</button>
  `;

  /* 文件选择 */
  const fileZone = $('#fileZone', page);
  const fileInput = $('#fileInput', page);
  fileZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => handleFile(e.target.files[0]));
  fileZone.addEventListener('dragover', e => { e.preventDefault(); fileZone.style.borderColor = 'var(--accent)'; });
  fileZone.addEventListener('dragleave', () => { fileZone.style.borderColor = ''; });
  fileZone.addEventListener('drop', e => {
    e.preventDefault();
    fileZone.style.borderColor = '';
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        doImport(data);
      } catch (err) {
        toast('文件解析失败，请检查 JSON 格式');
      }
    };
    reader.readAsText(file);
  }

  /* JSON 文本导入 */
  $('#importJsonBtn', page).addEventListener('click', () => {
    const text = $('#jsonInput', page).value.trim();
    if (!text) { toast('请输入 JSON 数据'); return; }
    try {
      const data = JSON.parse(text);
      doImport(data);
    } catch (err) {
      toast('JSON 格式错误，请检查');
    }
  });

  function doImport(data) {
    if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
      toast('题库数据格式不正确，需要包含 questions 数组');
      return;
    }
    /* 验证题目格式 */
    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      if (!q.content || !q.options || !q.correctAnswers) {
        toast(`第 ${i+1} 题格式不正确，缺少必填字段`);
        return;
      }
    }
    const bank = DB.importBank(data);
    toast(`成功导入「${bank.name}」，共 ${bank.totalQuestions} 题`);
    setTimeout(() => navigate('banks'), 800);
  }

  /* 复制模板 */
  $('#copyTemplate', page).addEventListener('click', () => {
    navigator.clipboard.writeText(JSON_TEMPLATE).then(() => toast('模板已复制到剪贴板'));
  });

  $('#goBack', page).addEventListener('click', () => navigate('banks'));

  return page;
}

const JSON_TEMPLATE = JSON.stringify({
  name: "题库名称",
  description: "题库描述",
  category: "分类",
  questions: [
    {
      content: "题目内容",
      type: "single",
      options: ["选项A", "选项B", "选项C", "选项D"],
      correctAnswers: [0],
      explanation: "答案解析",
      difficulty: 1
    }
  ]
}, null, 2);

/* ===== 10. 页面：刷题 ===== */
function renderPracticePage({ bankId }) {
  const page = document.createElement('div');
  const bank = DB.getBanks().find(b => b.id === bankId);
  if (!bank) { toast('题库不存在'); setTimeout(() => navigate('banks'), 500); return page; }

  const settings = DB.getSettings();
  let questions = DB.getQuestionsByBank(bankId);

  /* 判断题模式：选项自动填充 */
  questions = questions.map(q => {
    if (q.type === 'judge' && (!q.options || q.options.length === 0)) {
      return { ...q, options: ['正确', '错误'] };
    }
    return q;
  });

  if (settings.practiceMode === 'random') {
    questions = [...questions].sort(() => Math.random() - 0.5);
  }

  if (questions.length === 0) {
    page.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <div class="title">该题库暂无题目</div>
        <button class="btn btn-ghost" id="goBack">返回题库</button>
      </div>`;
    $('#goBack', page).onclick = () => navigate('banks');
    return page;
  }

  let currentIdx = 0;
  let selectedAnswers = [];
  let answered = false;
  let startTime = Date.now();
  let totalTime = 0;
  let results = []; /* 答题结果记录 */
  let timerInterval = null;

  function renderQuestion() {
    const q = questions[currentIdx];
    selectedAnswers = [];
    answered = false;
    startTime = Date.now();

    page.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <button class="btn btn-ghost btn-sm" id="exitBtn">← 退出</button>
      </div>
      <div class="practice-header">
        <div class="practice-progress-text">${currentIdx + 1} / ${questions.length}</div>
        ${settings.showTimer ? `<div class="practice-timer">⏱ <span id="timer">00:00</span></div>` : ''}
      </div>
      <div class="progress-bar"><div class="fill" style="width:${(currentIdx / questions.length) * 100}%"></div></div>
      <div class="bank-card" style="margin-bottom:20px;cursor:default">
        <div class="question-type-tag ${q.type === 'single' ? 'tag-single' : q.type === 'multiple' ? 'tag-multiple' : 'tag-judge'}">
          ${q.type === 'single' ? '单选题' : q.type === 'multiple' ? '多选题' : '判断题'}
          ${q.difficulty === 1 ? ' · 简单' : q.difficulty === 2 ? ' · 中等' : ' · 困难'}
        </div>
        <div class="question-content">${q.content}</div>
        <div id="optionsList"></div>
        <div id="feedbackArea"></div>
        <div id="actionArea" style="margin-top:20px"></div>
      </div>
    `;

    renderOptions(q);
    renderAction();

    $('#exitBtn', page).onclick = exitPractice;

    if (settings.showTimer) startTimer();
  }

  function renderOptions(q) {
    const container = $('#optionsList', page);
    container.innerHTML = q.options.map((opt, i) => `
      <div class="option-item" data-idx="${i}">
        <div class="option-label">${String.fromCharCode(65 + i)}</div>
        <div class="option-text">${opt}</div>
      </div>
    `).join('');

    $$('.option-item', container).forEach(el => {
      el.addEventListener('click', () => {
        if (answered) return;
        const idx = parseInt(el.dataset.idx);
        if (q.type === 'multiple') {
          if (selectedAnswers.includes(idx)) {
            selectedAnswers = selectedAnswers.filter(a => a !== idx);
            el.classList.remove('selected');
          } else {
            selectedAnswers.push(idx);
            el.classList.add('selected');
          }
        } else {
          selectedAnswers = [idx];
          $$('.option-item', container).forEach(e => e.classList.remove('selected'));
          el.classList.add('selected');
        }
        renderAction();
      });
    });
  }

  function renderAction() {
    const area = $('#actionArea', page);
    if (!answered) {
      area.innerHTML = `<button class="btn btn-primary btn-block" id="submitBtn" ${selectedAnswers.length === 0 ? 'disabled style="opacity:0.5"' : ''}>提交答案</button>`;
      const btn = $('#submitBtn', area);
      if (btn && selectedAnswers.length > 0) {
        btn.onclick = submitAnswer;
      }
    } else {
      const isLast = currentIdx === questions.length - 1;
      area.innerHTML = `<button class="btn btn-primary btn-block" id="nextBtn">${isLast ? '查看结果' : '下一题 →'}</button>`;
      $('#nextBtn', area).onclick = nextQuestion;
    }
  }

  function submitAnswer() {
    if (answered) return;
    answered = true;
    if (timerInterval) clearInterval(timerInterval);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    totalTime += timeSpent;

    const q = questions[currentIdx];
    const correctSet = new Set(q.correctAnswers);
    const userSet = new Set(selectedAnswers);
    const isCorrect = correctSet.size === userSet.size && [...correctSet].every(a => userSet.has(a));

    /* 标记选项 */
    $$('.option-item', page).forEach(el => {
      const idx = parseInt(el.dataset.idx);
      el.classList.add('disabled');
      if (correctSet.has(idx)) el.classList.add('correct');
      else if (userSet.has(idx)) el.classList.add('wrong');
    });

    /* 反馈 */
    const fb = $('#feedbackArea', page);
    fb.innerHTML = `
      <div class="answer-feedback ${isCorrect ? 'correct' : 'wrong'}">
        ${isCorrect ? '✓ 回答正确' : '✗ 回答错误'}
      </div>
      ${settings.showExplanation ? `
        <div class="explanation-box">
          <div class="exp-title">💡 解析</div>
          <div class="exp-text">${q.explanation}</div>
        </div>` : ''}
    `;

    /* 记录 */
    results.push({ questionId: q.id, isCorrect, timeSpent });
    DB.addRecord(q.id, q.bankId, selectedAnswers, isCorrect, timeSpent);

    renderAction();

    if (settings.autoNext) {
      setTimeout(nextQuestion, 1500);
    }
  }

  function nextQuestion() {
    if (currentIdx < questions.length - 1) {
      currentIdx++;
      renderQuestion();
    } else {
      renderResult();
    }
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    let sec = 0;
    timerInterval = setInterval(() => {
      sec++;
      const el = $('#timer', page);
      if (el) el.textContent = fmtTime(sec);
      else clearInterval(timerInterval);
    }, 1000);
  }

  function exitPractice() {
    if (timerInterval) clearInterval(timerInterval);
    const overlay = showModal({
      title: '确认退出',
      body: `<p style="color:var(--text-secondary);font-size:14px">退出后本次答题进度不会保存，确定退出吗？</p>`,
      footer: `
        <button class="btn btn-ghost" id="cancelExit">继续答题</button>
        <button class="btn btn-danger" id="confirmExit">退出</button>`
    });
    $('#cancelExit', overlay).onclick = () => { closeModal(overlay); startTimer(); };
    $('#confirmExit', overlay).onclick = () => { closeModal(overlay); navigate('banks'); };
  }

  function renderResult() {
    const correct = results.filter(r => r.isCorrect).length;
    const total = results.length;
    const accuracy = Math.round(correct / total * 100);

    page.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <button class="btn btn-ghost btn-sm" id="exitBtn2">← 返回题库</button>
      </div>
      <div class="card">
        <div class="result-hero">
          <div class="result-score">${accuracy}<span class="percent">%</span></div>
          <div class="result-label">${accuracy >= 80 ? '太棒了！' : accuracy >= 60 ? '继续加油！' : '需要努力！'}</div>
        </div>
        <div class="result-stats">
          <div class="result-stat">
            <div class="num correct">${correct}</div>
            <div class="label">答对</div>
          </div>
          <div class="result-stat">
            <div class="num wrong">${total - correct}</div>
            <div class="label">答错</div>
          </div>
          <div class="result-stat">
            <div class="num time">${fmtTime(totalTime)}</div>
            <div class="label">用时</div>
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn btn-ghost" id="retryBtn" style="flex:1">重新刷题</button>
          <button class="btn btn-primary" id="backBtn" style="flex:1">返回题库</button>
        </div>
      </div>
    `;
    $('#exitBtn2', page).onclick = () => navigate('banks');
    $('#retryBtn', page).onclick = () => { results = []; totalTime = 0; renderQuestion(); };
    $('#backBtn', page).onclick = () => navigate('banks');
  }

  renderQuestion();
  return page;
}

/* ===== 11. 页面：错题本 ===== */
function renderWrongsPage() {
  const page = document.createElement('div');
  const wrongs = DB.getWrongs();
  const banks = DB.getBanks();

  page.innerHTML = `
    <div class="page-header">
      <h1>错题本</h1>
      <div class="subtitle">${wrongs.length} 道错题待复习</div>
    </div>
    <div class="filter-chips" id="filterChips">
      <div class="chip active" data-bank="all">全部</div>
      ${banks.map(b => `<div class="chip" data-bank="${b.id}">${b.name}</div>`).join('')}
    </div>
    <div id="wrongList"></div>
  `;

  let currentFilter = 'all';

  function renderList() {
    const list = $('#wrongList', page);
    let filtered = wrongs;
    if (currentFilter !== 'all') {
      filtered = wrongs.filter(w => w.bankId === currentFilter);
    }

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="icon">🎉</div>
          <div class="title">${currentFilter === 'all' ? '还没有错题' : '该题库暂无错题'}</div>
          <div class="desc">继续刷题，错题会自动收录到这里</div>
        </div>`;
      return;
    }

    /* 按错误次数排序 */
    filtered.sort((a, b) => b.wrongCount - a.wrongCount);

    const questions = DB.getQuestions();
    list.innerHTML = filtered.map(w => {
      const q = questions.find(qi => qi.id === w.questionId);
      if (!q) return '';
      const bank = banks.find(b => b.id === w.bankId);
      return `
        <div class="wrong-item" data-id="${w.id}" data-qid="${q.id}" data-bank="${w.bankId}">
          <div class="wrong-q">${q.content}</div>
          <div class="wrong-meta">
            <span class="wrong-count-badge">错 ${w.wrongCount} 次</span>
            <span>📚 ${bank ? bank.name : '未知'}</span>
            <span>🕒 ${fmtDate(w.lastWrongAt)}</span>
          </div>
        </div>
      `;
    }).join('');

    $$('.wrong-item', list).forEach(item => {
      item.addEventListener('click', () => {
        const qid = item.dataset.qid;
        const bankId = item.dataset.bank;
        showWrongDetail(qid, bankId);
      });
    });
  }

  function showWrongDetail(qid, bankId) {
    const questions = DB.getQuestions();
    const q = questions.find(qi => qi.id === qid);
    if (!q) return;
    const bank = banks.find(b => b.id === bankId);

    let opts = q.options;
    if (q.type === 'judge' && (!opts || opts.length === 0)) opts = ['正确', '错误'];

    const correctLabels = q.correctAnswers.map(i => String.fromCharCode(65 + i)).join('、');

    const overlay = showModal({
      title: '错题详情',
      body: `
        <div style="margin-bottom:16px">
          <span class="question-type-tag ${q.type === 'single' ? 'tag-single' : q.type === 'multiple' ? 'tag-multiple' : 'tag-judge'}">
            ${q.type === 'single' ? '单选题' : q.type === 'multiple' ? '多选题' : '判断题'}
          </span>
          <span style="font-size:12px;color:var(--text-muted)">来自：${bank ? bank.name : ''}</span>
        </div>
        <div class="question-content" style="margin-bottom:16px">${q.content}</div>
        <div>
          ${opts.map((opt, i) => `
            <div class="option-item ${q.correctAnswers.includes(i) ? 'correct' : ''}">
              <div class="option-label">${String.fromCharCode(65 + i)}</div>
              <div class="option-text">${opt}</div>
            </div>
          `).join('')}
        </div>
        <div class="explanation-box">
          <div class="exp-title">💡 正确答案：${correctLabels}</div>
          <div class="exp-text">${q.explanation}</div>
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" id="closeDetail">关闭</button>
        <button class="btn btn-primary" id="retryWrong">重新作答</button>
      `
    });

    $('#closeDetail', overlay).onclick = () => closeModal(overlay);
    $('#retryWrong', overlay).onclick = () => {
      closeModal(overlay);
      /* 进入单题刷题模式 - 用 bankId 的题库但只刷这一题 */
      navigate('practice', { bankId, singleQuestionId: qid });
      /* 简化：直接刷新题库页面，用户可以重新刷 */
      toast('已进入刷题模式，重新答对后将自动移出错题本');
    };
  }

  /* 筛选事件 */
  $$('.chip', page).forEach(chip => {
    chip.addEventListener('click', () => {
      $$('.chip', page).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.bank;
      renderList();
    });
  });

  renderList();
  return page;
}

/* ===== 12. 页面：我的 ===== */
function renderProfilePage() {
  const page = document.createElement('div');
  const stats = DB.getStats();
  const settings = DB.getSettings();
  const recent = DB.getRecentRecords();

  const hour = new Date().getHours();
  const greeting = hour < 6 ? '凌晨好' : hour < 12 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';

  /* 简易柱状图 */
  const maxCount = Math.max(...recent.map(d => d.count), 1);
  const chartBars = recent.map(d => `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
      <div style="height:80px;display:flex;align-items:flex-end;width:100%">
        <div style="width:100%;height:${(d.count / maxCount) * 100}%;background:linear-gradient(180deg,var(--primary),var(--primary-light));border-radius:4px 4px 0 0;min-height:2px;transition:height .3s"></div>
      </div>
      <div style="font-size:10px;color:var(--text-muted)">${d.date}</div>
    </div>
  `).join('');

  page.innerHTML = `
    <div class="page-header">
      <h1>我的</h1>
    </div>

    <div class="profile-hero">
      <div class="greeting">${greeting}，学习者</div>
      <div class="sub">坚持刷题，每日进步一点点</div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-num">${stats.total}</div>
        <div class="stat-label">总答题数</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-num">${stats.accuracy}%</div>
        <div class="stat-label">正确率</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏱</div>
        <div class="stat-num">${fmtTime(stats.totalTime)}</div>
        <div class="stat-label">刷题时长</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📌</div>
        <div class="stat-num">${stats.wrongCount}</div>
        <div class="stat-label">错题总数</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:24px">
      <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:16px">最近7天答题情况</div>
      <div style="display:flex;gap:6px;height:100px">${chartBars}</div>
    </div>

    <!-- 错题本入口 -->
    <div class="setting-section">
      <div class="section-title">错题本</div>
      <div class="setting-group">
        <div class="setting-row" id="goWrongs">
          <div>
            <div class="row-label">📝 我的错题本</div>
            <div class="row-desc">${stats.wrongCount} 道错题待复习</div>
          </div>
          <div class="row-right">→</div>
        </div>
      </div>
    </div>

    <!-- 刷题偏好 -->
    <div class="setting-section">
      <div class="section-title">刷题偏好</div>
      <div class="setting-group">
        <div class="setting-row">
          <div>
            <div class="row-label">答题顺序</div>
            <div class="row-desc">${settings.practiceMode === 'sequential' ? '顺序答题' : '随机答题'}</div>
          </div>
          <div class="row-right">
            <select class="select" id="practiceMode" style="width:auto;padding:6px 10px">
              <option value="sequential" ${settings.practiceMode === 'sequential' ? 'selected' : ''}>顺序</option>
              <option value="random" ${settings.practiceMode === 'random' ? 'selected' : ''}>随机</option>
            </select>
          </div>
        </div>
        <div class="setting-row">
          <div>
            <div class="row-label">答题计时</div>
            <div class="row-desc">答题时显示计时器</div>
          </div>
          <div class="toggle ${settings.showTimer ? 'on' : ''}" data-setting="showTimer"></div>
        </div>
        <div class="setting-row">
          <div>
            <div class="row-label">自动跳下一题</div>
            <div class="row-desc">答对后自动进入下一题</div>
          </div>
          <div class="toggle ${settings.autoNext ? 'on' : ''}" data-setting="autoNext"></div>
        </div>
        <div class="setting-row">
          <div>
            <div class="row-label">显示解析</div>
            <div class="row-desc">答题后自动显示解析</div>
          </div>
          <div class="toggle ${settings.showExplanation ? 'on' : ''}" data-setting="showExplanation"></div>
        </div>
      </div>
    </div>

    <!-- AI 接口设置 -->
    <div class="setting-section">
      <div class="section-title">AI 接口</div>
      <div class="setting-group">
        <div class="setting-row">
          <div>
            <div class="row-label">🤖 启用 AI 功能</div>
            <div class="row-desc">智能解析、题目推荐等</div>
          </div>
          <div class="toggle ${settings.aiEnabled ? 'on' : ''}" data-setting="aiEnabled"></div>
        </div>
        <div class="setting-row" id="aiConfigRow">
          <div>
            <div class="row-label">⚙️ AI 接口配置</div>
            <div class="row-desc">${settings.aiApiKey ? '已配置' : '点击配置 API Key 和接口地址'}</div>
          </div>
          <div class="row-right">→</div>
        </div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="setting-section">
      <div class="section-title">数据管理</div>
      <div class="setting-group">
        <div class="setting-row" id="exportData">
          <div>
            <div class="row-label">📤 导出数据</div>
            <div class="row-desc">备份所有题库和记录</div>
          </div>
          <div class="row-right">→</div>
        </div>
        <div class="setting-row" id="importData">
          <div>
            <div class="row-label">📥 导入数据</div>
            <div class="row-desc">从备份文件恢复</div>
          </div>
          <div class="row-right">→</div>
        </div>
        <div class="setting-row" id="clearData">
          <div>
            <div class="row-label" style="color:var(--error)">🗑 清空所有数据</div>
            <div class="row-desc">删除全部题库、记录和设置</div>
          </div>
          <div class="row-right">→</div>
        </div>
      </div>
    </div>

    <div style="text-align:center;padding:20px 0;color:var(--text-muted);font-size:12px">
      刷题有道 v1.0 · 本地数据，安全无忧
    </div>
  `;

  /* 事件绑定 */
  $('#goWrongs', page).onclick = () => navigate('wrongs');

  /* 切换设置 */
  $$('.toggle', page).forEach(t => {
    t.addEventListener('click', () => {
      const key = t.dataset.setting;
      const newSettings = { ...DB.getSettings() };
      newSettings[key] = !newSettings[key];
      DB.saveSettings(newSettings);
      t.classList.toggle('on');
      toast('设置已保存');
    });
  });

  /* 答题顺序 */
  $('#practiceMode', page).onchange = e => {
    const s = { ...DB.getSettings(), practiceMode: e.target.value };
    DB.saveSettings(s);
    toast('设置已保存');
  };

  /* AI 配置 */
  $('#aiConfigRow', page).onclick = () => {
    const s = DB.getSettings();
    const overlay = showModal({
      title: 'AI 接口配置',
      body: `
        <div class="field-group">
          <label class="field-label">API 接口地址</label>
          <input class="input" id="aiEndpoint" value="${s.aiApiEndpoint || ''}" placeholder="https://api.example.com/v1/chat">
        </div>
        <div class="field-group">
          <label class="field-label">API Key</label>
          <input class="input" id="aiKey" type="password" value="${s.aiApiKey || ''}" placeholder="输入你的 API Key">
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:8px">
          配置后可使用 AI 智能解析功能。密钥仅保存在本地浏览器中。
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" id="cancelAi">取消</button>
        <button class="btn btn-primary" id="saveAi">保存</button>
      `
    });
    $('#cancelAi', overlay).onclick = () => closeModal(overlay);
    $('#saveAi', overlay).onclick = () => {
      const newSettings = {
        ...DB.getSettings(),
        aiApiEndpoint: $('#aiEndpoint', overlay).value.trim(),
        aiApiKey: $('#aiKey', overlay).value.trim()
      };
      DB.saveSettings(newSettings);
      closeModal(overlay);
      toast('AI 配置已保存');
      render();
    };
  };

  /* 导出数据 */
  $('#exportData', page).onclick = () => {
    const data = DB.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `刷题有道_备份_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('数据已导出');
  };

  /* 导入数据 */
  $('#importData', page).onclick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          const overlay = showModal({
            title: '确认导入',
            body: `<p style="color:var(--text-secondary);font-size:14px">导入将覆盖当前所有数据，确定继续吗？</p>`,
            footer: `
              <button class="btn btn-ghost" id="cancelImport">取消</button>
              <button class="btn btn-danger" id="confirmImport">确认导入</button>
            `
          });
          $('#cancelImport', overlay).onclick = () => closeModal(overlay);
          $('#confirmImport', overlay).onclick = () => {
            DB.importAllData(data);
            closeModal(overlay);
            toast('数据导入成功');
            render();
          };
        } catch {
          toast('文件格式错误');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  /* 清空数据 */
  $('#clearData', page).onclick = () => {
    const overlay = showModal({
      title: '⚠️ 危险操作',
      body: `<p style="color:var(--error);font-size:14px;font-weight:500">此操作将永久删除所有题库、答题记录、错题和设置，且不可恢复！</p>
             <p style="color:var(--text-secondary);font-size:13px;margin-top:8px">建议先导出数据备份。</p>`,
      footer: `
        <button class="btn btn-ghost" id="cancelClear">取消</button>
        <button class="btn btn-danger" id="confirmClear">确认清空</button>
      `
    });
    $('#cancelClear', overlay).onclick = () => closeModal(overlay);
    $('#confirmClear', overlay).onclick = () => {
      DB.clearAll();
      closeModal(overlay);
      toast('所有数据已清空');
      DB.initSample();
      render();
    };
  };

  return page;
}

/* ===== 13. 注册路由 & 启动 ===== */
registerRoute('banks', renderBanksPage);
registerRoute('import', renderImportPage);
registerRoute('practice', renderPracticePage);
registerRoute('wrongs', renderWrongsPage);
registerRoute('profile', renderProfilePage);

/* 初始化 */
DB.initSample();
document.body.appendChild(renderNav());
render();
