/* =====================================================
 *  叮咚学 · 交互主逻辑 (app.js)
 *  纯前端 / ES5 语法 / IIFE 模块化
 *  依赖：window.DD (由 data/data.js 提供)
 * ===================================================== */

(function () {
  'use strict';

  // ===================================================
  // 0. 工具函数
  // ===================================================
  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // 获取今天的日期字符串 YYYY-MM-DD
  function todayStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1);
    var day = String(d.getDate());
    return d.getFullYear() + '-' + (m.length < 2 ? '0' + m : m) + '-' + (day.length < 2 ? '0' + day : day);
  }

  // 从数组里随机抽一个
  function randomPick(arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // 简单 HTML 转义
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 浅拷贝（够用就行）
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // toast 提示
  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.add('hidden'); }, 3000);
  }

  // ===================================================
  // 1. 状态管理
  // ===================================================
  var STORAGE_KEY = 'dd';
  var ACCOUNTS_KEY = 'dd.accounts';
  var CURRENT_KEY = 'dd.current';
  var POSTS_KEY = 'dd.posts';

  // 加载当前用户 state（找不到则返回 null）
  function loadState() {
    var cur = localStorage.getItem(CURRENT_KEY);
    if (!cur) return null;
    try {
      var accs = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
      var acc = null;
      for (var i = 0; i < accs.length; i++) {
        if (accs[i].name === cur) { acc = accs[i]; break; }
      }
      return acc ? acc.state : null;
    } catch (e) { return null; }
  }

  // 保存当前用户 state
  function saveState() {
    if (!state) return;
    try {
      var accs = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
      for (var i = 0; i < accs.length; i++) {
        if (accs[i].name === state.name) {
          accs[i].state = state;
          accs[i].updatedAt = Date.now();
          break;
        }
      }
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accs));
    } catch (e) { console.error(e); }
  }

  // 初始化一个全新 state
  function defaultState(name) {
    return {
      name: name || '叮咚学员',
      avatar: '😀',
      grade: 'pre',
      version: 'pep',
      coin: 0,
      streak: 0,
      lastActiveDate: '',
      lastStreakDate: '',
      guards: 0,
      achievements: {},
      stats: { correct: 0, wrong: 0, maxCombo: 0, reviews: 0 },
      progress: {
        chinese: { node: 0, done: [] },
        math:    { node: 0, done: [] },
        english: { node: 0, done: [] },
        science: { node: 0, done: [] },
        politics:{ node: 0, done: [] },
        history: { node: 0, done: [] },
        music:   { node: 0, done: [] },
        art:     { node: 0, done: [] },
      },
      visited: {},
      maps: [],
      apps: [],
      posts: 0,
      mode: 'ai',
      daily: { date: '', tasks: [] },
    };
  }

  // 更新 state（浅合并），自动保存+检查成就
  function updateState(patch) {
    if (!state) return;
    for (var k in patch) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) {
        state[k] = patch[k];
      }
    }
    saveState();
    checkAchievements();
  }

  // ===================================================
  // 2. 路由 / 视图切换
  // ===================================================
  var historyStack = [];
  var currentView = 'welcome';

  function _showView(viewName) {
    currentView = viewName;
    $$('.view').forEach(function (v) { v.classList.remove('active'); });
    var target = document.getElementById('view-' + viewName);
    if (target) target.classList.add('active');

    // topbar 显示控制
    var tb = $('#topbar');
    if (tb) {
      if (viewName === 'welcome' || viewName === 'register' || viewName === 'login') {
        tb.classList.add('hidden');
      } else {
        tb.classList.remove('hidden');
      }
    }
    onViewEnter(viewName);
  }

  function go(viewName) {
    if (!viewName) return;
    // 非主页切换时压栈
    if (currentView && currentView !== viewName) {
      historyStack.push(currentView);
    }
    _showView(viewName);
  }

  function goBack() {
    if (historyStack.length > 0) {
      var prev = historyStack.pop();
      _showView(prev);
    } else {
      go('home');
    }
  }

  // 进入某个视图时执行
  function onViewEnter(viewName) {
    if (!state && viewName !== 'welcome' && viewName !== 'register' && viewName !== 'login') {
      go('welcome');
      return;
    }
    switch (viewName) {
      case 'home':       renderHome(); break;
      case 'subjects':   renderSubjects(); break;
      case 'map':        renderMap(); break;
      case 'quiz':       renderQuiz(); break;
      case 'result':     renderResult(); break;
      case 'square':     renderSquare(); break;
      case 'post':       renderPostForm(); break;
      case 'library':    bindLibrary(); break;
      case 'dict':       renderDict(); break;
      case 'paper':      renderPaperForm(); break;
      case 'mapstudio':  renderMapStudio(); break;
      case 'appstudio':  renderAppStudio(); break;
      case 'me':         renderMe(); break;
      case 'shop':       renderShop(); break;
      case 'achievement':renderAchievement(); break;
      case 'profile':    renderProfile(); break;
      case 'grade':      renderGrade(); break;
    }
    // 任何页面切换都刷新顶部状态
    renderTopbar();
  }

  // ===================================================
  // 3. 注册 / 登录
  // ===================================================
  function bindAuth() {
    var btnReg = $('#btn-register');
    if (btnReg) {
      btnReg.addEventListener('click', function () {
        var name = ($('#reg-name').value || '').trim();
        var pass = $('#reg-pass').value || '';
        var pass2= $('#reg-pass2').value || '';
        if (!name) return toast('请输入昵称');
        if (name.length < 2) return toast('昵称至少 2 个字');
        if (pass.length < 4) return toast('密码至少 4 位');
        if (pass !== pass2) return toast('两次密码不一样');
        var accs = [];
        try { accs = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]'); } catch (e) { accs = []; }
        for (var i = 0; i < accs.length; i++) {
          if (accs[i].name === name) return toast('昵称已被占用，换一个吧');
        }
        var newAcc = {
          name: name,
          pass: pass,
          state: defaultState(name),
          createdAt: Date.now(),
        };
        accs.push(newAcc);
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accs));
        localStorage.setItem(CURRENT_KEY, name);
        state = newAcc.state;
        toast('注册成功！来选个头像吧');
        go('profile');
      });
    }

    var btnLogin = $('#btn-login');
    if (btnLogin) {
      btnLogin.addEventListener('click', function () {
        var name = ($('#login-name').value || '').trim();
        var pass = $('#login-pass').value || '';
        var tip  = $('#login-tip');
        if (!name || !pass) { tip.textContent = '请输入昵称和密码'; return; }
        var accs = [];
        try { accs = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]'); } catch (e) { accs = []; }
        var hit = null;
        for (var i = 0; i < accs.length; i++) {
          if (accs[i].name === name) { hit = accs[i]; break; }
        }
        if (!hit)              { tip.textContent = '没有这个用户'; return; }
        if (hit.pass !== pass) { tip.textContent = '密码不对'; return; }
        localStorage.setItem(CURRENT_KEY, name);
        state = hit.state;
        tip.textContent = '';
        toast('欢迎回来，' + name);
        go('home');
      });
    }
  }

  // ===================================================
  // 4. 头像 / 昵称设置
  // ===================================================
  function renderProfile() {
    if (!state) return;
    var input = $('#profile-name');
    if (input) input.value = state.name;
    var grid = $('#presetAvatars');
    if (grid && !grid.dataset.init) {
      grid.innerHTML = '';
      DD.PRESET_AVATARS.forEach(function (em) {
        var d = document.createElement('div');
        d.className = 'avatar-item';
        d.textContent = em;
        d.addEventListener('click', function () {
          $$('.avatar-item', grid).forEach(function (x) { x.classList.remove('selected'); });
          d.classList.add('selected');
          state.avatar = em;
          updateState({ avatar: em });
          renderCurrentAvatar();
        });
        grid.appendChild(d);
      });
      grid.dataset.init = '1';
    }
    renderCurrentAvatar();
    highlightSelectedAvatar();
  }

  function renderCurrentAvatar() {
    var av = $('#currentAvatar');
    if (av && state) {
      av.textContent = '';
      av.style.backgroundImage = '';
      if (state.avatar && state.avatar.length > 2 && state.avatar.indexOf('data:') === 0) {
        av.style.backgroundImage = 'url(' + state.avatar + ')';
        av.classList.add('image');
      } else {
        av.textContent = state.avatar || '😀';
        av.classList.remove('image');
      }
    }
  }

  function highlightSelectedAvatar() {
    var grid = $('#presetAvatars');
    if (!grid) return;
    $$('.avatar-item', grid).forEach(function (x) {
      if (x.textContent === state.avatar) x.classList.add('selected');
      else x.classList.remove('selected');
    });
  }

  function bindProfile() {
    var up = $('#profile-upload');
    if (up) {
      up.addEventListener('change', function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        if (f.size > 1.5 * 1024 * 1024) return toast('图片太大（≤1.5MB）');
        var reader = new FileReader();
        reader.onload = function (ev) {
          state.avatar = ev.target.result;
          updateState({ avatar: state.avatar });
          renderCurrentAvatar();
          $$('.avatar-item').forEach(function (x) { x.classList.remove('selected'); });
          toast('头像已更新');
        };
        reader.readAsDataURL(f);
      });
    }
    var next = $('#btn-profile-next');
    if (next) {
      next.addEventListener('click', function () {
        var name = ($('#profile-name').value || '').trim();
        if (name) updateState({ name: name });
        go('grade');
      });
    }
  }

  // ===================================================
  // 5. 年级 / 教材选择
  // ===================================================
  function renderGrade() {
    var gs = $('#grade-select'), vs = $('#version-select');
    if (gs && !gs.dataset.init) {
      gs.innerHTML = '';
      DD.GRADES.forEach(function (g) {
        var o = document.createElement('option');
        o.value = g.id; o.textContent = g.name;
        gs.appendChild(o);
      });
      gs.dataset.init = '1';
    }
    if (vs && !vs.dataset.init) {
      vs.innerHTML = '';
      DD.VERSIONS.forEach(function (v) {
        var o = document.createElement('option');
        o.value = v.id; o.textContent = v.name;
        vs.appendChild(o);
      });
      vs.dataset.init = '1';
    }
    if (gs) gs.value = state.grade || 'pre';
    if (vs) vs.value = state.version || 'pep';

    var btn = $('#btn-grade-finish');
    if (btn) {
      btn.onclick = function () {
        updateState({ grade: gs.value, version: vs.value });
        toast('设置完成！开始学习吧');
        go('home');
      };
    }
  }

  // ===================================================
  // 顶部状态栏
  // ===================================================
  function renderTopbar() {
    if (!state) return;
    var av = $('#topAvatar'); if (av) {
      av.textContent = '';
      av.style.backgroundImage = '';
      if (state.avatar && state.avatar.indexOf('data:') === 0) {
        av.style.backgroundImage = 'url(' + state.avatar + ')';
        av.classList.add('image');
      } else {
        av.textContent = state.avatar || '😀';
        av.classList.remove('image');
      }
    }
    var tn = $('#topName');   if (tn) tn.textContent = state.name;
    var ts = $('#topStreak'); if (ts) ts.textContent = state.streak;
    var tc = $('#topCoin');   if (tc) tc.textContent = state.coin;
  }

  // ===================================================
  // 6. 主页
  // ===================================================
  function refreshDaily() {
    if (!state.daily) state.daily = { date: '', tasks: [] };
    var t = todayStr();
    if (state.daily.date !== t) {
      state.daily.date = t;
      state.daily.tasks = DD.makeDailyTasks();
      saveState();
    }
  }

  function progressDaily(id, add) {
    if (!state.daily || !state.daily.tasks) return;
    state.daily.tasks.forEach(function (tk) {
      if (tk.id === id) {
        tk.prog = Math.min(tk.target, tk.prog + add);
        if (tk.prog >= tk.target) tk.done = true;
      }
    });
    saveState();
  }

  function renderHome() {
    refreshDaily();
    var av = $('#homeAvatar');
    if (av) {
      av.textContent = '';
      av.style.backgroundImage = '';
      if (state.avatar && state.avatar.indexOf('data:') === 0) {
        av.style.backgroundImage = 'url(' + state.avatar + ')';
        av.classList.add('image');
      } else {
        av.textContent = state.avatar || '😀';
        av.classList.remove('image');
      }
    }
    $('#homeName').textContent    = state.name;
    var g = DD.GRADES.filter(function (x) { return x.id === state.grade; })[0];
    var v = DD.VERSIONS.filter(function (x) { return x.id === state.version; })[0];
    $('#homeGrade').textContent   = g ? g.name : '学前班';
    $('#homeVersion').textContent = v ? v.name : '人教版';
    $('#homeStreak').textContent  = state.streak;
    $('#homeCoin').textContent    = state.coin;

    // 每日任务
    var list = $('#dailyList'); list.innerHTML = '';
    var total = state.daily.tasks.length;
    var done  = 0;
    state.daily.tasks.forEach(function (tk) {
      if (tk.done) done++;
      var row = document.createElement('div');
      row.className = 'daily-item';
      row.innerHTML =
        '<span>' + escapeHtml(tk.name) + '</span>' +
        '<span class="daily-prog">' + tk.prog + '/' + tk.target + (tk.done ? ' ✅' : '') + '</span>';
      list.appendChild(row);
    });
    var pct = total ? Math.round(done * 100 / total) : 0;
    var bar = $('#dailyBar');
    if (bar) bar.style.width = pct + '%';

    // 模式按钮
    var ai = $('#modeAIBtn'), tr = $('#modeTradBtn');
    if (ai && tr) {
      if (state.mode === 'ai') { ai.classList.add('active'); tr.classList.remove('active'); }
      else                    { tr.classList.add('active'); ai.classList.remove('active'); }
    }

    // 顶部状态
    renderTopbar();
  }

  function bindHome() {
    var main = $('#view-home');
    if (!main) return;

    // 8 个 quick-card
    $$('.quick-card', main).forEach(function (c) {
      c.addEventListener('click', function () {
        var q = c.getAttribute('data-quick');
        if (q === 'preview' || q === 'learn' || q === 'review') {
          go('subjects');
          // 记住进来的方式
          pendingMode = q;
        } else if (q === 'read') {
          openReadView();
        } else if (q === 'dict') {
          go('dict');
        } else if (q === 'paper') {
          go('paper');
        } else if (q === 'map') {
          go('mapstudio');
        } else if (q === 'app') {
          go('appstudio');
        }
      });
    });

    // 模式切换
    var ai = $('#modeAIBtn'), tr = $('#modeTradBtn');
    if (ai) ai.addEventListener('click', function () { updateState({ mode: 'ai' }); renderHome(); });
    if (tr) tr.addEventListener('click', function () { updateState({ mode: 'trad' }); renderHome(); });

    // 底部 tab
    $$('.tabbar .tab').forEach(function (t) {
      t.addEventListener('click', function () {
        $$('.tabbar .tab').forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        var k = t.getAttribute('data-tab');
        if (k === 'learn')   go('subjects');
        if (k === 'square')  go('square');
        if (k === 'library') go('library');
        if (k === 'me')      go('me');
      });
    });
  }

  // ===================================================
  // 读课文（用弹窗展示一篇文章）
  // ===================================================
  function openReadView() {
    var g = DD.GRADES.filter(function (x) { return x.id === state.grade; })[0];
    var text = (g ? g.name : '') + ' · 课文朗读\n\n' +
      '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。\n' +
      '——李白《静夜思》\n\n' +
      '锄禾日当午，汗滴禾下土。\n谁知盘中餐，粒粒皆辛苦。\n' +
      '——李绅《悯农》';
    openAiModal('📚 跟我读一读', text);
    markActive();
    progressDaily('d3', 1);
  }

  // ===================================================
  // 7. 学科入口
  // ===================================================
  function renderSubjects() {
    var grid = $('#subjectGrid'); if (!grid) return;
    grid.innerHTML = '';
    DD.SUBJECTS.forEach(function (s) {
      var p = state.progress[s.id] || { node: 0, done: [] };
      var total = 5;
      var done  = (p.done || []).length;
      var card = document.createElement('div');
      card.className = 'subject-card glass';
      card.setAttribute('data-sub', s.id);
      card.innerHTML =
        '<div class="sc-emoji">' + s.emoji + '</div>' +
        '<div class="sc-name">' + escapeHtml(s.name) + '</div>' +
        '<div class="sc-sub">' + escapeHtml((s.sub && s.sub[0]) || '') + '</div>' +
        '<div class="sc-bar"><div class="sc-bar-inner" style="width:' +
        Math.round(done * 100 / total) + '%"></div></div>' +
        '<div class="sc-prog">' + done + '/' + total + ' 关</div>';
      card.addEventListener('click', function () {
        currentSubject = s;
        state.visited[s.id] = (state.visited[s.id] || 0) + 1;
        saveState();
        go('map');
      });
      grid.appendChild(card);
    });
  }

  // ===================================================
  // 8. 闯关地图
  // ===================================================
  var currentSubject = null;
  var pendingMode = 'learn';

  function renderMap() {
    if (!currentSubject) { go('subjects'); return; }
    var titleEl = $('#mapTitle');
    if (titleEl) titleEl.textContent = currentSubject.emoji + ' ' + currentSubject.name + ' 闯关';

    var path = $('#mapPath'); path.innerHTML = '';
    var nodes = DD.makeMapNodes(currentSubject.name);
    var p = state.progress[currentSubject.id] || { node: 0, done: [] };
    var nextIdx = p.done.length;

    nodes.forEach(function (n, i) {
      var div = document.createElement('div');
      var done = (p.done || []).indexOf(i) >= 0;
      var cur  = (i === nextIdx);
      var cls  = 'map-node';
      if (done) cls += ' done';
      else if (cur) cls += ' current';
      else cls += ' locked';
      div.className = cls;
      div.innerHTML =
        '<div class="mn-ic">' + n.ic + '</div>' +
        '<div class="mn-name">' + escapeHtml(n.name) + '</div>' +
        '<div class="mn-reward">+' + n.reward + ' 💎</div>' +
        (done ? '<div class="mn-state">✅ 已通关</div>' :
         cur  ? '<div class="mn-state">▶ 当前关</div>' :
                '<div class="mn-state">🔒 未解锁</div>');
      if (cur) {
        div.addEventListener('click', function () {
          currentNode = i;
          currentNodeReward = n.reward;
          currentQuestions = buildQuizFor(currentSubject.id, i);
          currentIdx = 0;
          combo = 0;
          quizEarned = 0;
          quizCorrect = 0;
          quizWrong = 0;
          go('quiz');
        });
      }
      path.appendChild(div);
    });
  }

  // 根据学科和关卡生成题目
  function buildQuizFor(subjectId, nodeIdx) {
    var all = (DD.QUESTIONS[subjectId] || []).slice();
    if (!all.length) {
      // 兜底：随便出一道通用题
      return [{
        q: '这是一个示例题：' + subjectId + ' 的第 ' + (nodeIdx + 1) + ' 关',
        opts: ['选项A', '选项B', '选项C', '选项D'],
        a: 0,
        exp: '这是一个示例题的讲解。'
      }];
    }
    // 简单洗牌后取前 min(5, all)
    for (var i = all.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = all[i]; all[i] = all[j]; all[j] = t;
    }
    return all.slice(0, Math.min(5, all.length));
  }

  // ===================================================
  // 9. 答题页
  // ===================================================
  var currentNode = 0;
  var currentNodeReward = 0;
  var currentQuestions = [];
  var currentIdx = 0;
  var combo = 0;
  var quizEarned = 0;
  var quizCorrect = 0;
  var quizWrong = 0;
  var quizExp = 0;
  var answeredThisQ = false;
  var pendingReviewList = []; // 复习模式下要出的题

  function renderQuiz() {
    answeredThisQ = false;
    var total = currentQuestions.length;
    var i = currentIdx;
    var q = currentQuestions[i];
    if (!q) { go('result'); return; }

    // 顶部条
    var bar = $('#quizBar');
    if (bar) bar.style.width = Math.round((i / total) * 100) + '%';
    var cmb = $('#combo'); if (cmb) cmb.textContent = combo;
    var ern = $('#earn');   if (ern) ern.textContent = quizEarned;

    var sbj = currentSubject ? (currentSubject.emoji + ' ' + currentSubject.name) : '学科';
    var g = DD.GRADES.filter(function (x) { return x.id === state.grade; })[0];
    $('#quizSubject').textContent = sbj + ' · ' + (g ? g.name : '');

    var stemEl = $('#quizStem');
    stemEl.innerHTML = '';
    stemEl.textContent = (pendingMode === 'preview' ? '【预习】' :
                         pendingMode === 'review' ? '【复习】' : '【学习】') + ' ' + q.q;
    // 学习模式：题干/选项点击 → AI 讲解
    if (pendingMode === 'learn' || pendingMode === 'preview') {
      stemEl.style.cursor = 'help';
      stemEl.onclick = function () { explainCurrentQ(); };
    } else {
      stemEl.style.cursor = '';
      stemEl.onclick = null;
    }

    var optWrap = $('#quizOptions'); optWrap.innerHTML = '';
    q.opts.forEach(function (op, idx) {
      var b = document.createElement('button');
      b.className = 'opt-btn';
      b.textContent = ['A','B','C','D'][idx] + '. ' + op;
      b.addEventListener('click', function () { onAnswer(idx, b); });
      if (pendingMode === 'learn') {
        b.addEventListener('contextmenu', function (e) {
          e.preventDefault();
          explainCurrentQ();
        });
      }
      optWrap.appendChild(b);
    });

    var next = $('#btnNext');
    if (next) next.classList.add('hidden');
  }

  function onAnswer(idx, btnEl) {
    if (answeredThisQ) return;
    answeredThisQ = true;
    var q = currentQuestions[currentIdx];
    if (!q) return;
    var right = (idx === q.a);
    var btns = $$('#quizOptions .opt-btn');
    btns.forEach(function (b, i) {
      b.disabled = true;
      if (i === q.a) b.classList.add('right');
      if (i === idx && !right) b.classList.add('wrong');
    });

    if (right) {
      combo++;
      quizCorrect++;
      state.stats.correct = (state.stats.correct || 0) + 1;
      state.stats.maxCombo = Math.max(state.stats.maxCombo || 0, combo);
      var gain = 5 + combo;        // 答对奖励
      if (state.flagCoinPlus) gain = Math.round(gain * 1.5);
      var expGain = state.flagExp2x ? 10 : 5;  // 经验双倍卡：10 vs 5
      quizExp += expGain;
      state.coin += gain;
      quizEarned += gain;
      // 复习模式也算入复习次数
      if (pendingMode === 'review') state.stats.reviews = (state.stats.reviews || 0) + 1;
      saveState();
      markActive();
      progressDaily('d1', 1);
      progressDaily('d2', 1);
      if (pendingMode === 'review') progressDaily('d3', 1);
      renderTopbar();
      toast('答对了！+' + gain + ' 💎');
    } else {
      combo = 0;
      quizWrong++;
      state.stats.wrong = (state.stats.wrong || 0) + 1;
      saveState();
      renderTopbar();
      toast('答错啦，看看 AI 讲解吧');
      // 自动弹出讲解
      setTimeout(function () { explainCurrentQ(); }, 350);
    }

    // 显示"下一题"
    var next = $('#btnNext');
    if (next) {
      next.classList.remove('hidden');
      next.onclick = function () { goNext(); };
    }
  }

  function goNext() {
    currentIdx++;
    if (currentIdx >= currentQuestions.length) {
      finishQuiz();
    } else {
      renderQuiz();
    }
  }

  function finishQuiz() {
    // 通关判定：所有题都答过
    if (pendingMode !== 'review' && currentSubject) {
      var p = state.progress[currentSubject.id] || { node: 0, done: [] };
      if (p.done.indexOf(currentNode) < 0) p.done.push(currentNode);
      state.progress[currentSubject.id] = p;
      // 奖励
      state.coin += currentNodeReward;
      quizEarned += currentNodeReward;
      saveState();
    }
    // 复习模式：复习次数+1
    if (pendingMode === 'review') {
      state.stats.reviews = (state.stats.reviews || 0) + 1;
      saveState();
    }
    // 清掉临时加成
    state.flagCoinPlus = false;
    state.flagExp2x = false;
    saveState();
    renderTopbar();
    go('result');
  }

  function explainCurrentQ() {
    var q = currentQuestions[currentIdx];
    if (!q) return;
    var msg =
      '🤖 AI 老师讲解：\n\n' +
      '题目：' + q.q + '\n\n' +
      '正确答案：' + q.opts[q.a] + '\n\n' +
      '解析：' + q.exp + '\n\n' +
      '💡 小贴士：先读懂题目再选，不确定的可以排除两个明显不对的。';
    openAiModal('讲解', msg);
  }

  function bindQuiz() {
    var ask = $('#btnAskAI');
    if (ask) ask.addEventListener('click', function () { explainCurrentQ(); });
    var idont = $('#btnIDont');
    if (idont) idont.addEventListener('click', function () { explainCurrentQ(); });
  }

  // ===================================================
  // 10. 结算页
  // ===================================================
  function renderResult() {
    var pct = quizCorrect + quizWrong > 0 ? quizCorrect / (quizCorrect + quizWrong) : 0;
    var em = '🎉', title = '闯关成功！';
    if (pct < 0.4)  { em = '😅'; title = '再试一次吧～'; }
    else if (pct < 0.8) { em = '💪'; title = '做得不错！'; }
    $('#resultEmoji').textContent = em;
    $('#resultTitle').textContent  = title;
    $('#rsCorrect').textContent    = quizCorrect;
    $('#rsWrong').textContent      = quizWrong;
    $('#rsCoin').textContent       = quizEarned;
    $('#rsExp').textContent        = quizExp;
    $('#rsAch').innerHTML          = '';
    renderTopbar();

    var ag = $('#btnAgain');
    if (ag) ag.onclick = function () {
      // 重新生成当前关卡的题目
      if (currentSubject) {
        currentQuestions = buildQuizFor(currentSubject.id, currentNode);
        currentIdx = 0;
        combo = 0; quizEarned = 0; quizCorrect = 0; quizWrong = 0; quizExp = 0;
        go('quiz');
      } else {
        go('home');
      }
    };
  }

  // ===================================================
  // 11. AI 对话
  // ===================================================
  var AI_REPLIES = [
    '嗯嗯，让我想想～',
    '这是一个好问题！',
    '老师帮你梳理一下思路 ✨',
    '你真是个爱思考的小朋友！',
    '别着急，我们一步一步来。',
    '记住：不理解的时候，先把题目读三遍。',
    '棒棒哒！继续保持好奇心 🌟',
  ];

  function aiReply(userText) {
    var s = (userText || '').toLowerCase();
    if (/你好|hello|hi\b/.test(s)) return '你好呀！我是你的 AI 老师，有什么问题尽管问我～';
    if (/\d\s*\+\s*\d/.test(s)) {
      try {
        var expr = userText.match(/[\d\+\-\*\/\.\s]+/)[0];
        // eslint-disable-next-line no-new-func
        var v = Function('"use strict";return (' + expr + ')')();
        return '算出来是：' + v + ' 🎉';
      } catch (e) { return '数字表达式我没看懂～'; }
    }
    if (/谢谢|thank/.test(s)) return '不客气，继续加油！';
    if (/拼音/.test(s))      return '中文拼音是学习语文的基础，多读多练就熟练啦。';
    if (/英语|english/.test(s)) return '英语要多听多说，可以先从单词开始～';
    if (/数学|math/.test(s)) return '数学的关键是理解概念，再多做一些题巩固。';
    if (/物理|化学|生物|科学/.test(s)) return '科学很有趣，生活中多观察，多做小实验！';
    if (/历史/.test(s))      return '历史是一面镜子，记住关键人物和时间就能学懂。';
    if (/怎么学|如何学|学习/.test(s)) return '我的建议：①预习 ②认真听课 ③复习，三环紧扣效率最高！';
    return randomPick(AI_REPLIES) + ' 你说：「' + userText + '」，我先记下啦～';
  }

  function openAiModal(title, preText) {
    var modal = $('#aiModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    var log = $('#aiLog'); log.innerHTML = '';
    function addMsg(role, text) {
      var d = document.createElement('div');
      d.className = 'ai-msg ai-' + role;
      d.textContent = text;
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
    }
    addMsg('bot', '你好呀！我是你的 AI 老师～');
    if (preText) addMsg('bot', preText);
    // 把当前问题的标题记下来
    var head = modal.querySelector('.modal-head h3');
    if (head && title) head.textContent = '🤖 ' + title;
  }

  function closeAiModal() { var m = $('#aiModal'); if (m) m.classList.add('hidden'); }

  function bindAi() {
    var float = $('#floatAi');
    if (float) float.addEventListener('click', function () { openAiModal('叮咚 AI 助手'); });
    var send = $('#aiSend');
    if (send) send.addEventListener('click', function () {
      var inp = $('#aiInput'); var t = (inp.value || '').trim();
      if (!t) return;
      var log = $('#aiLog');
      var d = document.createElement('div');
      d.className = 'ai-msg ai-user'; d.textContent = t;
      log.appendChild(d);
      inp.value = '';
      setTimeout(function () {
        var r = document.createElement('div');
        r.className = 'ai-msg ai-bot'; r.textContent = aiReply(t);
        log.appendChild(r); log.scrollTop = log.scrollHeight;
      }, 350);
    });
    var inp = $('#aiInput');
    if (inp) inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); $('#aiSend').click(); }
    });
  }

  // ===================================================
  // 12. 广场
  // ===================================================
  function getPosts() {
    try { return JSON.parse(localStorage.getItem(POSTS_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function setPosts(arr) { localStorage.setItem(POSTS_KEY, JSON.stringify(arr)); }

  function renderSquare() {
    // 活动横幅
    var d = new Date().getDate();
    var ev = DD.EVENTS.filter(function (e) { return e.day === d; })[0];
    var banner = $('#eventBanner');
    if (banner) {
      if (ev) {
        banner.classList.remove('hidden');
        banner.innerHTML = '<div class="eb-title">' + escapeHtml(ev.title) + '</div>' +
                           '<div class="eb-tip">' + escapeHtml(ev.tip) + '</div>';
      } else {
        banner.classList.add('hidden');
        banner.innerHTML = '';
      }
    }
    var list = $('#squareList'); list.innerHTML = '';
    var posts = getPosts();
    if (!posts.length) {
      list.innerHTML = '<div class="empty-tip">广场还很安静～快来发布第一条动态吧 🌱</div>';
      return;
    }
    posts.slice().reverse().forEach(function (p) {
      var c = document.createElement('div');
      c.className = 'post-card glass';
      var media = '';
      if (p.img)    media += '<img class="post-media" src="' + p.img + '" />';
      if (p.audio)  media += '<audio class="post-media" controls src="' + p.audio + '"></audio>';
      if (p.video)  media += '<video class="post-media" controls src="' + p.video + '"></video>';
      var attach = '';
      if (p.mapName) attach += '<span class="post-attach">🗺️ ' + escapeHtml(p.mapName) + '</span>';
      if (p.appName) attach += '<span class="post-attach">🧩 ' + escapeHtml(p.appName) + '</span>';
      c.innerHTML =
        '<div class="post-head"><div class="post-ava">' + escapeHtml(p.avatar || '😀') + '</div>' +
        '<div><div class="post-name">' + escapeHtml(p.name) + '</div>' +
        '<div class="post-time">' + escapeHtml(p.time || '') + '</div></div></div>' +
        '<div class="post-text">' + escapeHtml(p.text || '') + '</div>' + media +
        (attach ? '<div class="post-attachs">' + attach + '</div>' : '');
      list.appendChild(c);
    });
  }

  function renderPostForm() {
    var selM = $('#postMap'), selA = $('#postApp');
    if (selM) {
      selM.innerHTML = '<option value="">不附加</option>';
      (state.maps || []).forEach(function (m, i) {
        selM.appendChild(new Option(m.name, String(i)));
      });
    }
    if (selA) {
      selA.innerHTML = '<option value="">不附加</option>';
      (state.apps || []).forEach(function (a, i) {
        selA.appendChild(new Option(a.name, String(i)));
      });
    }
    $('#postText').value = '';
    var ids = ['postImg', 'postAudio', 'postVideo'];
    ids.forEach(function (id) { var x = document.getElementById(id); if (x) x.value = ''; });
  }

  function bindSquare() {
    var btn = $('#btnPost');
    if (btn) btn.addEventListener('click', function () { go('post'); });
    var send = $('#btnPostSend');
    if (send) {
      send.addEventListener('click', function () {
        var text = ($('#postText').value || '').trim();
        if (!text) return toast('写点什么吧');
        var posts = getPosts();
        var post = {
          name: state.name,
          avatar: state.avatar,
          text: text,
          time: new Date().toLocaleString('zh-CN'),
          img: null, audio: null, video: null,
          mapName: '', appName: '',
        };
        function readFile(file, cb) {
          if (!file) return cb(null);
          if (file.size > 4 * 1024 * 1024) { toast('文件太大（≤4MB）'); return cb(null); }
          var r = new FileReader();
          r.onload = function (ev) { cb(ev.target.result); };
          r.readAsDataURL(file);
        }
        var imgF = $('#postImg').files[0];
        var audF = $('#postAudio').files[0];
        var vidF = $('#postVideo').files[0];
        var rest = 3 - [imgF, audF, vidF].filter(Boolean).length;
        var step = 0;
        function done() {
          step++;
          if (step >= rest) finalize();
        }
        function finalize() {
          var mIdx = parseInt(($('#postMap').value || ''), 10);
          var aIdx = parseInt(($('#postApp').value || ''), 10);
          if (!isNaN(mIdx) && state.maps[mIdx]) post.mapName = state.maps[mIdx].name;
          if (!isNaN(aIdx) && state.apps[aIdx]) post.appName = state.apps[aIdx].name;
          posts.push(post);
          setPosts(posts);
          state.posts = (state.posts || 0) + 1;
          saveState();
          toast('发布成功！');
          go('square');
        }
        if (imgF) readFile(imgF, function (d) { post.img = d; done(); }); else done();
        if (audF) readFile(audF, function (d) { post.audio = d; done(); }); else done();
        if (vidF) readFile(vidF, function (d) { post.video = d; done(); }); else done();
      });
    }
  }

  // ===================================================
  // 13. 学习库入口
  // ===================================================
  function bindLibrary() {
    $$('[data-lib]').forEach(function (c) {
      c.addEventListener('click', function () {
        var k = c.getAttribute('data-lib');
        if (k === 'dict' || k === 'paper') {
          go(k);
        } else {
          toast('该功能开发中，敬请期待～');
        }
      });
    });
  }

  // ===================================================
  // 13.1 字词典
  // ===================================================
  function renderDict() {
    var r = $('#dictResult');
    if (r) r.innerHTML = '<div class="empty-tip">输入汉字或英文，开始查询吧～</div>';
  }
  function bindDict() {
    var btn = $('#dictBtn'), inp = $('#dictInput');
    function search() {
      var v = (inp.value || '').trim();
      if (!v) return;
      var key = v.toLowerCase();
      var item = DD.DICT[v] || DD.DICT[key];
      var r = $('#dictResult');
      if (!item) {
        r.innerHTML = '<div class="empty-tip">没有找到 "' + escapeHtml(v) + '"，试试别的字或单词？</div>';
        return;
      }
      r.innerHTML =
        '<div class="dict-card">' +
        '<div class="dict-key">' + escapeHtml(v) + '</div>' +
        '<div class="dict-row">📝 拼音：' + escapeHtml(item.pinyin || '-') + '</div>' +
        '<div class="dict-row">💡 释义：' + escapeHtml(item.meaning || '-') + '</div>' +
        '<div class="dict-row">📖 例句：' + escapeHtml(item.example || '-') + '</div>' +
        '<div class="dict-row">🌍 英文：' + escapeHtml(item.en || '-') + '</div>' +
        (item.near && item.near.length ? '<div class="dict-row">🔗 近义：' + item.near.map(escapeHtml).join('、') + '</div>' : '') +
        (item.ant  && item.ant.length  ? '<div class="dict-row">⚡ 反义：' + item.ant.map(escapeHtml).join('、') + '</div>' : '') +
        '</div>';
    }
    if (btn) btn.addEventListener('click', search);
    if (inp) inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); search(); }
    });
  }

  // ===================================================
  // 13.2 AI 试卷
  // ===================================================
  function renderPaperForm() {
    var sel = $('#paperSubject');
    if (sel && !sel.dataset.init) {
      sel.innerHTML = '';
      DD.SUBJECTS.forEach(function (s) {
        sel.appendChild(new Option(s.emoji + ' ' + s.name, s.id));
      });
      sel.dataset.init = '1';
    }
  }
  function bindPaper() {
    var btn = $('#btnPaperStart');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var sub = $('#paperSubject').value;
      var diff = $('#paperDiff').value;
      var count = parseInt($('#paperCount').value, 10) || 5;
      var pool = (DD.QUESTIONS[sub] || []).slice();
      if (!pool.length) return toast('这个学科暂时没有题');
      // 简单按难度筛选：没有level字段时随机
      for (var i = pool.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
      }
      currentSubject = DD.SUBJECTS.filter(function (s) { return s.id === sub; })[0] || null;
      currentQuestions = pool.slice(0, Math.min(count, pool.length));
      currentIdx = 0; combo = 0; quizEarned = 0; quizCorrect = 0; quizWrong = 0; quizExp = 0;
      pendingMode = 'learn';
      // 试卷完成后自动批改
      pendingPaperAuto = true;
      go('quiz');
    });
  }
  var pendingPaperAuto = false;

  // ===================================================
  // 14. 地图工坊
  // ===================================================
  function renderMapStudio() {
    var list = $('#msList'); if (list) list.innerHTML = '';
    (state.maps || []).forEach(function (m, i) {
      var c = document.createElement('div');
      c.className = 'ms-item glass';
      c.innerHTML =
        '<div class="msi-name">🗺️ ' + escapeHtml(m.name) + '</div>' +
        '<div class="msi-meta">关卡：' + (m.questions || []).length + ' · 主题色：' + escapeHtml(m.color || 'pink') + '</div>' +
        '<div class="msi-actions">' +
          '<button class="btn btn-ghost small" data-ms-play="' + i + '">试玩</button>' +
          '<button class="btn btn-ghost small" data-ms-share="' + i + '">分享到广场</button>' +
          '<button class="btn btn-danger small" data-ms-del="' + i + '">删除</button>' +
        '</div>';
      list.appendChild(c);
    });
    bindMapStudioActions();
  }
  function bindMapStudioActions() {
    $$('[data-ms-play]').forEach(function (b) {
      b.onclick = function () {
        var i = parseInt(b.getAttribute('data-ms-play'), 10);
        var m = state.maps[i]; if (!m) return;
        currentSubject = { id: 'custom', name: m.name, emoji: '🗺️' };
        // 把 m.questions 转成题目格式
        currentQuestions = (m.questions || []).map(function (q) {
          return { q: q, opts: ['A','B','C','D'], a: 0, exp: '这是一个自定义题目，请和 AI 老师讨论～' };
        });
        if (!currentQuestions.length) return toast('这个地图还没有题目');
        currentNode = 0; currentNodeReward = 5; currentIdx = 0;
        combo = 0; quizEarned = 0; quizCorrect = 0; quizWrong = 0; quizExp = 0;
        pendingMode = 'learn';
        go('quiz');
      };
    });
    $$('[data-ms-share]').forEach(function (b) {
      b.onclick = function () {
        var i = parseInt(b.getAttribute('data-ms-share'), 10);
        var m = state.maps[i]; if (!m) return;
        var posts = getPosts();
        posts.push({
          name: state.name, avatar: state.avatar,
          text: '我刚做了一张地图：' + m.name,
          time: new Date().toLocaleString('zh-CN'),
          mapName: m.name, img: null, audio: null, video: null,
        });
        setPosts(posts);
        state.posts = (state.posts || 0) + 1;
        saveState();
        toast('已分享到广场');
      };
    });
    $$('[data-ms-del]').forEach(function (b) {
      b.onclick = function () {
        var i = parseInt(b.getAttribute('data-ms-del'), 10);
        if (!confirm('确定删除这张地图？')) return;
        state.maps.splice(i, 1); saveState(); renderMapStudio();
      };
    });
  }
  function bindMapStudio() {
    var save = $('#btnMsSave');
    if (save) {
      save.addEventListener('click', function () {
        var name = ($('#ms-name').value || '').trim();
        var count= parseInt($('#ms-count').value, 10);
        var color= $('#ms-color').value;
        var qs   = ($('#ms-qs').value || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!name) return toast('给地图起个名字吧');
        // 如果题目不足，按数量补空
        while (qs.length < count) qs.push('（待出题）');
        qs = qs.slice(0, count);
        state.maps = state.maps || [];
        state.maps.push({ name: name, count: count, color: color, questions: qs, createdAt: Date.now() });
        saveState();
        toast('地图已保存');
        $('#ms-name').value = ''; $('#ms-qs').value = '';
        renderMapStudio();
      });
    }
    var share = $('#btnMsShare');
    if (share) {
      share.addEventListener('click', function () {
        $('#btnMsSave').click();
        var last = (state.maps || [])[(state.maps || []).length - 1];
        if (!last) return;
        var posts = getPosts();
        posts.push({
          name: state.name, avatar: state.avatar,
          text: '我做的地图 ' + last.name + ' 邀请你来玩！',
          time: new Date().toLocaleString('zh-CN'),
          mapName: last.name, img: null, audio: null, video: null,
        });
        setPosts(posts);
        state.posts = (state.posts || 0) + 1;
        saveState();
        toast('已发到广场');
      });
    }
  }

  // ===================================================
  // 15. 应用工坊
  // ===================================================
  function renderAppStudio() {
    var list = $('#asList'); if (list) list.innerHTML = '';
    (state.apps || []).forEach(function (a, i) {
      var c = document.createElement('div');
      c.className = 'ms-item glass';
      c.innerHTML =
        '<div class="msi-name">🧩 ' + escapeHtml(a.name) + '</div>' +
        '<div class="msi-meta">' + escapeHtml(a.desc || '') + '</div>' +
        '<pre class="msi-code">' + escapeHtml((a.code || '').slice(0, 200)) + '</pre>' +
        '<div class="msi-actions">' +
          '<button class="btn btn-ghost small" data-as-share="' + i + '">分享到广场</button>' +
          '<button class="btn btn-danger small" data-as-del="' + i + '">删除</button>' +
        '</div>';
      list.appendChild(c);
    });
    bindAppStudioActions();
  }
  function bindAppStudioActions() {
    $$('[data-as-share]').forEach(function (b) {
      b.onclick = function () {
        var i = parseInt(b.getAttribute('data-as-share'), 10);
        var a = state.apps[i]; if (!a) return;
        var posts = getPosts();
        posts.push({
          name: state.name, avatar: state.avatar,
          text: '推荐我的小应用：' + a.name + ' — ' + (a.desc || ''),
          time: new Date().toLocaleString('zh-CN'),
          appName: a.name, img: null, audio: null, video: null,
        });
        setPosts(posts);
        state.posts = (state.posts || 0) + 1;
        saveState();
        toast('已发到广场');
      };
    });
    $$('[data-as-del]').forEach(function (b) {
      b.onclick = function () {
        var i = parseInt(b.getAttribute('data-as-del'), 10);
        if (!confirm('确定删除这个应用？')) return;
        state.apps.splice(i, 1); saveState(); renderAppStudio();
      };
    });
  }
  function bindAppStudio() {
    var save = $('#btnAsSave');
    if (save) {
      save.addEventListener('click', function () {
        var name = ($('#as-name').value || '').trim();
        var desc = ($('#as-desc').value || '').trim();
        var code = ($('#as-code').value || '').trim();
        if (!name) return toast('给应用起个名字吧');
        state.apps = state.apps || [];
        state.apps.push({ name: name, desc: desc, code: code, createdAt: Date.now() });
        saveState();
        toast('应用已保存');
        $('#as-name').value = ''; $('#as-desc').value = ''; $('#as-code').value = '';
        renderAppStudio();
      });
    }
    var share = $('#btnAsShare');
    if (share) {
      share.addEventListener('click', function () {
        $('#btnAsSave').click();
        var last = (state.apps || [])[(state.apps || []).length - 1];
        if (!last) return;
        var posts = getPosts();
        posts.push({
          name: state.name, avatar: state.avatar,
          text: '推荐我的小应用：' + last.name,
          time: new Date().toLocaleString('zh-CN'),
          appName: last.name, img: null, audio: null, video: null,
        });
        setPosts(posts);
        state.posts = (state.posts || 0) + 1;
        saveState();
        toast('已发到广场');
      });
    }
  }

  // ===================================================
  // 16. 我的
  // ===================================================
  function renderMe() {
    var av = $('#meAvatar');
    if (av) {
      av.textContent = '';
      av.style.backgroundImage = '';
      if (state.avatar && state.avatar.indexOf('data:') === 0) {
        av.style.backgroundImage = 'url(' + state.avatar + ')';
        av.classList.add('image');
      } else {
        av.textContent = state.avatar || '😀';
        av.classList.remove('image');
      }
    }
    var g = DD.GRADES.filter(function (x) { return x.id === state.grade; })[0];
    var v = DD.VERSIONS.filter(function (x) { return x.id === state.version; })[0];
    $('#meName').textContent = state.name;
    $('#meMeta').textContent = (g ? g.name : '') + ' · ' + (v ? v.name : '');
    $('#meStreak').textContent    = state.streak;
    $('#meCoin').textContent      = state.coin;
    $('#meGuard').textContent     = state.guards || 0;
    var achCount = 0;
    for (var k in state.achievements) if (state.achievements[k]) achCount++;
    $('#meAchCount').textContent  = achCount;

    var out = $('#btnLogout');
    if (out) out.onclick = function () {
      if (!confirm('确定退出登录吗？数据不会丢～')) return;
      localStorage.removeItem(CURRENT_KEY);
      state = null;
      go('welcome');
    };
  }

  // ===================================================
  // 17. 商店
  // ===================================================
  function renderShop() {}
  function bindShop() {
    $$('[data-buy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-buy');
        if (k === 'guard') {
          if (state.coin < 30) return toast('叮咚币不够哦');
          state.coin -= 30; state.guards = (state.guards || 0) + 1;
          saveState(); renderTopbar();
          toast('购买成功！保护卡 +1 🛡️');
        } else if (k === 'exp2x') {
          if (state.coin < 20) return toast('叮咚币不够哦');
          state.coin -= 20; state.flagExp2x = true; saveState(); renderTopbar();
          toast('已激活：经验双倍（本次学习生效）');
        } else if (k === 'coinPlus') {
          if (state.coin < 15) return toast('叮咚币不够哦');
          state.coin -= 15; state.flagCoinPlus = true; saveState(); renderTopbar();
          toast('已激活：金币加成 +50%（本次学习生效）');
        }
      });
    });
  }

  // ===================================================
  // 18. 成就墙
  // ===================================================
  function checkAchievements() {
    if (!state) return;
    DD.ACHIEVEMENTS.forEach(function (a) {
      if (!state.achievements[a.id] && a.check(state)) {
        state.achievements[a.id] = { at: Date.now() };
        saveState();
        showAchModal(a);
      }
    });
  }
  function showAchModal(a) {
    var m = $('#achModal'); if (!m) return;
    m.classList.remove('hidden');
    $('#achPopTitle').textContent = '🎉 ' + a.name;
    $('#achPopDesc').textContent  = a.desc;
    m.querySelector('.ach-pop-emoji').textContent = a.emoji;
  }
  function renderAchievement() {
    var list = $('#achList'); if (!list) return;
    list.innerHTML = '';
    DD.ACHIEVEMENTS.forEach(function (a) {
      var ok = !!state.achievements[a.id];
      var c = document.createElement('div');
      c.className = 'ach-card glass' + (ok ? ' unlocked' : ' locked');
      c.innerHTML =
        '<div class="ach-emoji">' + (ok ? a.emoji : '🔒') + '</div>' +
        '<div class="ach-name">' + escapeHtml(a.name) + '</div>' +
        '<div class="ach-desc">' + escapeHtml(a.desc) + '</div>';
      list.appendChild(c);
    });
  }

  // ===================================================
  // 19. 连胜机制
  // ===================================================
  function markActive() {
    if (!state) return;
    var t = todayStr();
    var last = state.lastActiveDate || '';
    if (last === t) {
      // 今天已经记录过
      state.lastActiveDate = t;
      saveState();
      return;
    }
    // 上次记录与今天的差（天）
    if (last) {
      var d1 = new Date(last + 'T00:00:00');
      var d2 = new Date(t + 'T00:00:00');
      var diff = Math.round((d2 - d1) / (24 * 3600 * 1000));
      if (diff === 1) {
        state.streak = (state.streak || 0) + 1;
      } else if (diff > 1) {
        // 断了：先尝试用保护卡
        if ((state.guards || 0) > 0) {
          state.guards -= 1;
          state.streak = (state.streak || 0) + 1;
          toast('🛡️ 用了一张保护卡，连胜延续！');
        } else {
          state.streak = 1;
          toast('⚠️ 连胜中断，已重新开始');
        }
      } else if (diff <= 0) {
        // 异常时间，跳过
      }
    } else {
      // 第一次
      state.streak = (state.streak || 0) + 1;
    }
    state.lastActiveDate = t;
    state.lastStreakDate = t;
    saveState();
    renderTopbar();
  }

  // ===================================================
  // 20. 通用绑定
  // ===================================================
  function bindGlobal() {
    // data-go 通用跳转
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-go]');
      if (t) {
        e.preventDefault();
        go(t.getAttribute('data-go'));
      }
      if (e.target.closest('[data-go-back]')) {
        e.preventDefault();
        goBack();
      }
      if (e.target.closest('[data-close-modal]')) {
        closeAiModal();
        var am = $('#achModal'); if (am) am.classList.add('hidden');
      }
    });
    // 顶部按钮
    var sb = $('#btnShop');        if (sb) sb.addEventListener('click', function () { go('shop'); });
    var ac = $('#btnAchievement'); if (ac) ac.addEventListener('click', function () { go('achievement'); });
    var ab = $('#btnAi');          if (ab) ab.addEventListener('click', function () { openAiModal('叮咚 AI 助手'); });
    // topbar 头像/名字也跳到"我的"
    var ta = $('#topAvatar'); if (ta) ta.addEventListener('click', function () { go('me'); });
    var tn = $('#topName');   if (tn) tn.addEventListener('click', function () { go('me'); });
  }

  // ===================================================
  // 21. 启动
  // ===================================================
  var state = null;

  function bootstrap() {
    bindGlobal();
    bindAuth();
    bindProfile();
    bindHome();
    bindLibrary();
    bindQuiz();
    bindAi();
    bindSquare();
    bindDict();
    bindPaper();
    bindMapStudio();
    bindAppStudio();
    bindShop();

    // 尝试恢复登录
    state = loadState();
    if (state) {
      // 兼容老 state
      state.guards = state.guards || 0;
      state.achievements = state.achievements || {};
      state.stats = state.stats || { correct: 0, wrong: 0, maxCombo: 0, reviews: 0 };
      state.maps = state.maps || [];
      state.apps = state.apps || [];
      state.daily = state.daily || { date: '', tasks: [] };
      saveState();
      go('home');
    } else {
      go('welcome');
    }
  }

  // 等待 data.js 加载完毕
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})();
