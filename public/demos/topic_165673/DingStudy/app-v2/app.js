/* =====================================================
 *  叮咚学 v2 · 交互主逻辑 (app.js)
 *  纯前端 / ES5 语法 / IIFE 模块化
 *  依赖：window.DD (data.js) + window.ICONS (icons.js) + styles.css
 * ===================================================== */

(function () {
  'use strict';

  // ===================================================
  // 0. 工具函数
  // ===================================================
  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function todayStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1);
    var day = String(d.getDate());
    return d.getFullYear() + '-' + (m.length < 2 ? '0' + m : m) + '-' + (day.length < 2 ? '0' + day : day);
  }

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function dateKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function randomPick(arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function safeGet(key, def) {
    try { var v = localStorage.getItem(key); return v == null ? def : JSON.parse(v); }
    catch (e) { return def; }
  }
  function safeSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { return false; }
  }

  // ===================================================
  // 1. 图标渲染（用 ICONS.icon 替换 data-icon 元素）
  // ===================================================
  function renderIcons() {
    $$('[data-icon]').forEach(function (el) {
      var name = el.getAttribute('data-icon');
      var size = parseInt(el.getAttribute('data-icon-size') || '20', 10);
      var color = el.getAttribute('data-icon-color') || 'currentColor';
      if (!name) return;
      el.innerHTML = window.ICONS.icon(name, size, color);
      var svg = el.querySelector('svg');
      if (svg) {
        if (!svg.classList.contains('icon') && !el.classList.contains('icon')) {
          svg.classList.add('icon');
        }
      }
    });
  }

  // ===================================================
  // 2. Toast / 确认弹窗
  // ===================================================
  var toastTimer = null;
  function toast(msg, type) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show' + (type ? ' toast-' + type : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  function confirmDialog(title, message, onOk, onCancel) {
    var m = $('#confirmModal');
    $('#cfTitle').textContent = title || '确认';
    $('#cfMessage').textContent = message || '确定要执行此操作？';
    m.style.display = 'flex';
    var ok = $('#cf-ok'), cn = $('#cf-cancel');
    function close(result) {
      m.style.display = 'none';
      ok.onclick = null; cn.onclick = null;
      if (result && onOk) onOk();
      if (!result && onCancel) onCancel();
    }
    ok.onclick = function () { close(true); };
    cn.onclick = function () { close(false); };
  }

  function openModal(id) { var m = document.getElementById(id); if (m) m.style.display = 'flex'; }
  function closeModal(id) { var m = document.getElementById(id); if (m) m.style.display = 'none'; }

  // ===================================================
  // 3. 状态管理
  // ===================================================
  var STORAGE_KEY = 'dd';
  var ACCOUNTS_KEY = 'dd.accounts';
  var CURRENT_KEY  = 'dd.current';
  var POSTS_KEY    = 'dd.posts';

  var state = null;

  function loadState() {
    var cur = localStorage.getItem(CURRENT_KEY);
    if (!cur) return null;
    try {
      var accs = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
      for (var i = 0; i < accs.length; i++) {
        if (accs[i].name === cur) return accs[i].state || null;
      }
    } catch (e) {}
    return null;
  }

  function saveState() {
    if (!state) return;
    try {
      var accs = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
      var found = false;
      for (var i = 0; i < accs.length; i++) {
        if (accs[i].name === state.name) {
          accs[i].state = state;
          accs[i].updatedAt = Date.now();
          found = true; break;
        }
      }
      if (!found) {
        accs.push({ name: state.name, state: state, updatedAt: Date.now() });
      }
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accs));
    } catch (e) { console.error(e); }
  }

  function defaultState(name) {
    return {
      name: name || '叮咚学员',
      avatar: '😀',
      grade: 'pre',
      version: 'pep',
      coin: 0,
      exp: 0,
      level: 1,
      streak: 0,
      lastActiveDate: '',
      lastStreakDate: '',
      guards: 0,
      doubleExpUntil: 0,
      coinBonusUntil: 0,
      achievements: {},
      titleEquipped: '',
      stats: {
        correct: 0, wrong: 0, total: 0, maxCombo: 0, reviews: 0,
        speak: 0, post: 0, invite: 0, mapClear: 0
      },
      subjectCorrect: {},
      wrongBook: [],
      favorites: [],
      progress: {
        chinese:{ node:0, done:[] },
        math:   { node:0, done:[] },
        english:{ node:0, done:[] },
        science:{ node:0, done:[] },
        politics:{node:0, done:[] },
        history:{ node:0, done:[] },
        music:  { node:0, done:[] },
        art:    { node:0, done:[] }
      },
      visited: {},
      maps: [],
      apps: [],
      classCode: '',
      mood: [],
      settings: { theme: 'auto', fs: 2, zoom: 100 },
      calendar: {},
      onboardingDone: false,
      ratePrompted: false,
      createdAt: Date.now()
    };
  }

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

  // 浅合并到子对象
  function updateStatePath(path, value) {
    if (!state) return;
    var parts = path.split('.');
    var obj = state;
    for (var i = 0; i < parts.length - 1; i++) {
      if (obj[parts[i]] == null) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
    saveState();
  }

  // ===================================================
  // 4. 主题 / 字号系统
  // ===================================================
  function getPreferredTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }
  function applyTheme() {
    var t = (state && state.settings && state.settings.theme) || 'auto';
    if (t === 'auto') t = getPreferredTheme();
    document.documentElement.setAttribute('data-theme', t);
    // 主题按钮图标
    var btn = $('#btnTheme');
    if (btn) {
      var sp = btn.querySelector('[data-icon]');
      if (sp) sp.setAttribute('data-icon', t === 'dark' ? 'moon' : 'sun');
    }
    // 同步设置视图
    $$('#themeToggle .theme-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-theme') === ((state && state.settings && state.settings.theme) || 'auto'));
    });
  }
  function setTheme(t) {
    if (!state) return;
    state.settings.theme = t;
    saveState();
    applyTheme();
  }
  function applyFontSize() {
    var fs = (state && state.settings && state.settings.fs != null) ? state.settings.fs : 2;
    document.documentElement.setAttribute('data-fs', String(fs));
    var zoom = (state && state.settings && state.settings.zoom) || 100;
    document.documentElement.style.setProperty('--fs-scale', (zoom / 100).toFixed(2));
    $$('#fsControl .fs-btn').forEach(function (b) {
      b.classList.toggle('active', parseInt(b.getAttribute('data-fs'), 10) === fs);
    });
    var z = $('#zoomVal'); if (z) z.textContent = zoom + '%';
    var r = $('#set-zoom'); if (r) r.value = zoom;
  }
  function setFontSize(fs) {
    if (!state) return;
    state.settings.fs = fs;
    saveState();
    applyFontSize();
  }
  function setZoom(z) {
    if (!state) return;
    state.settings.zoom = z;
    saveState();
    applyFontSize();
  }

  // ===================================================
  // 5. 路由 / 视图切换
  // ===================================================
  var historyStack = [];
  var currentView = 'welcome';
  var currentParams = null;

  var ROUTES = {
    'welcome':     { auth: false, render: null },
    'register':    { auth: false, render: null },
    'login':       { auth: false, render: null },
    'profile':     { auth: true,  render: renderProfile },
    'grade':       { auth: true,  render: renderGrade },
    'home':        { auth: true,  render: renderHome },
    'subjects':    { auth: true,  render: renderSubjects },
    'map':         { auth: true,  render: renderMap },
    'quiz':        { auth: true,  render: renderQuiz },
    'result':      { auth: true,  render: renderResult },
    'wrongbook':   { auth: true,  render: renderWrongBook },
    'favorites':   { auth: true,  render: renderFavorites },
    'square':      { auth: true,  render: renderSquare },
    'post':        { auth: true,  render: renderPost },
    'library':     { auth: true,  render: renderLibrary },
    'dict':        { auth: true,  render: renderDict },
    'paper':       { auth: true,  render: renderPaper },
    'paper-quiz':  { auth: true,  render: renderPaperQuiz },
    'textbook':    { auth: true,  render: renderTextbook },
    'mapstudio':   { auth: true,  render: renderMapStudio },
    'appstudio':   { auth: true,  render: renderAppStudio },
    'me':          { auth: true,  render: renderMe },
    'shop':        { auth: true,  render: renderShop },
    'achievement': { auth: true,  render: renderAchievement },
    'title':       { auth: true,  render: renderTitleWall },
    'report':      { auth: true,  render: renderReport },
    'calendar':    { auth: true,  render: renderCalendar },
    'class':       { auth: true,  render: renderClass },
    'mood':        { auth: true,  render: renderMood },
    'settings':    { auth: true,  render: renderSettings },
    'ai-settings': { auth: true,  render: renderAiSettings }
  };

  function _showView(viewName) {
    if (!ROUTES[viewName]) viewName = 'home';
    var route = ROUTES[viewName];
    if (route.auth && !state) {
      viewName = 'welcome';
      route = ROUTES[viewName];
    }
    currentView = viewName;
    $$('.view').forEach(function (v) { v.classList.remove('active'); });
    var target = document.getElementById('view-' + viewName);
    if (target) {
      target.classList.add('active');
      target.classList.remove('view-enter');
      // 强制重新触发动画
      void target.offsetWidth;
      target.classList.add('view-enter');
    }
    // 顶部栏显示控制
    var tb = $('#topbar');
    if (tb) {
      if (viewName === 'welcome' || viewName === 'register' || viewName === 'login') {
        tb.style.display = 'none';
      } else {
        tb.style.display = 'flex';
      }
    }
    // 渲染
    if (route.render) {
      try { route.render(); } catch (e) { console.error(e); }
    }
    // 刷新顶部状态
    renderTopbar();
    // 焦点管理：移动焦点到主标题
    setTimeout(function () {
      var h = target && target.querySelector('h1, h2');
      if (h && h.id) h.setAttribute('tabindex', '-1'), h.focus({ preventScroll: false });
    }, 50);
    // 更新 hash
    if (window.location.hash.replace('#', '') !== viewName) {
      try { history.replaceState(null, '', '#' + viewName); } catch (e) {}
    }
    // tabbar active
    var tabMap = { home: 'home', subjects: 'subjects', square: 'square', me: 'me' };
    $$('.tabbar .tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabMap[viewName]);
    });
  }

  function go(viewName, params) {
    if (!viewName) return;
    if (currentView && currentView !== viewName) {
      historyStack.push({ view: currentView, params: currentParams });
    }
    currentParams = params || null;
    _showView(viewName);
  }

  function goBack() {
    if (historyStack.length > 0) {
      var prev = historyStack.pop();
      currentParams = prev.params;
      _showView(prev.view);
    } else {
      go('home');
    }
  }

  function onHashChange() {
    var h = window.location.hash.replace('#', '');
    if (!h) h = (state ? 'home' : 'welcome');
    if (h !== currentView) {
      _showView(h);
    }
  }

  // ===================================================
  // 6. 顶部状态栏
  // ===================================================
  function renderTopbar() {
    if (!state) return;
    setAvatar($('#topAvatar'), state.avatar);
    var n = $('#topName'); if (n) n.textContent = state.name;
    var s = $('#topStreak'); if (s) s.textContent = state.streak || 0;
    var c = $('#topCoin'); if (c) c.textContent = state.coin || 0;
  }

  function setAvatar(el, avatar) {
    if (!el) return;
    el.textContent = '';
    el.style.backgroundImage = '';
    if (avatar && avatar.indexOf && avatar.indexOf('data:') === 0) {
      el.style.backgroundImage = 'url(' + avatar + ')';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    } else {
      el.textContent = avatar || '😀';
    }
  }

  // ===================================================
  // 7. 注册 / 登录
  // ===================================================
  function bindAuth() {
    var btnReg = $('#btn-register');
    if (btnReg) {
      btnReg.addEventListener('click', function () {
        var name = ($('#reg-name').value || '').trim();
        var pass = $('#reg-pass').value || '';
        var pass2 = $('#reg-pass2').value || '';

        // 清除旧错误
        $('#reg-name-err').textContent = '';
        $('#reg-pass-err').textContent = '';
        $('#reg-pass2-err').textContent = '';
        $('#reg-name').parentNode.classList.remove('has-error');
        $('#reg-pass').parentNode.classList.remove('has-error');
        $('#reg-pass2').parentNode.classList.remove('has-error');

        var ok = true;
        if (!name) {
          $('#reg-name-err').textContent = '请输入昵称';
          $('#reg-name').parentNode.classList.add('has-error');
          ok = false;
        } else if (name.length < 2) {
          $('#reg-name-err').textContent = '昵称至少 2 个字';
          $('#reg-name').parentNode.classList.add('has-error');
          ok = false;
        }
        if (pass.length < 4) {
          $('#reg-pass-err').textContent = '密码至少 4 位';
          $('#reg-pass').parentNode.classList.add('has-error');
          ok = false;
        }
        if (pass !== pass2) {
          $('#reg-pass2-err').textContent = '两次密码不一致';
          $('#reg-pass2').parentNode.classList.add('has-error');
          ok = false;
        }
        if (!ok) return;

        var accs = [];
        try { accs = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]'); } catch (e) { accs = []; }
        for (var i = 0; i < accs.length; i++) {
          if (accs[i].name === name) {
            $('#reg-name-err').textContent = '昵称已被占用，换一个吧';
            $('#reg-name').parentNode.classList.add('has-error');
            return;
          }
        }
        var newAcc = { name: name, pass: pass, state: defaultState(name), createdAt: Date.now() };
        accs.push(newAcc);
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accs));
        localStorage.setItem(CURRENT_KEY, name);
        state = newAcc.state;
        toast('注册成功！来选个头像吧', 'success');
        go('profile');
      });
    }

    var btnLogin = $('#btn-login');
    if (btnLogin) {
      btnLogin.addEventListener('click', function () {
        var name = ($('#login-name').value || '').trim();
        var pass = $('#login-pass').value || '';
        var tip = $('#login-tip');
        if (!name || !pass) { tip.textContent = '请输入昵称和密码'; return; }
        var accs = [];
        try { accs = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]'); } catch (e) { accs = []; }
        var hit = null;
        for (var i = 0; i < accs.length; i++) {
          if (accs[i].name === name) { hit = accs[i]; break; }
        }
        if (!hit)       { tip.textContent = '没有这个用户，先注册一个吧'; return; }
        if (hit.pass !== pass) { tip.textContent = '密码不对，再试一次'; return; }
        localStorage.setItem(CURRENT_KEY, name);
        state = hit.state;
        tip.textContent = '';
        markActive();
        toast('欢迎回来，' + name, 'success');
        go('home');
      });
    }
  }

  // ===================================================
  // 8. 头像 / 昵称设置
  // ===================================================
  function renderProfile() {
    if (!state) return;
    var input = $('#profile-name'); if (input) input.value = state.name;
    var grid = $('#presetAvatars');
    if (grid && !grid.dataset.init) {
      grid.innerHTML = '';
      DD.PRESET_AVATARS.forEach(function (em) {
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 'avatar-item';
        d.style.cssText = 'width:100%;aspect-ratio:1;border-radius:12px;background:#F0EEFF;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;border:2px solid transparent;transition:all .2s';
        d.textContent = em;
        d.setAttribute('role', 'radio');
        d.setAttribute('aria-label', '头像 ' + em);
        d.addEventListener('click', function () {
          $$('.avatar-item', grid).forEach(function (x) { x.style.borderColor = 'transparent'; x.style.background = '#F0EEFF'; });
          d.style.borderColor = '#7C5CFF';
          d.style.background = 'rgba(124,92,255,.15)';
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
    setAvatar($('#currentAvatar'), state && state.avatar);
  }
  function highlightSelectedAvatar() {
    var grid = $('#presetAvatars');
    if (!grid || !state) return;
    $$('.avatar-item', grid).forEach(function (x) {
      var match = (x.textContent === state.avatar);
      x.style.borderColor = match ? '#7C5CFF' : 'transparent';
      x.style.background = match ? 'rgba(124,92,255,.15)' : '#F0EEFF';
    });
  }
  function bindProfile() {
    var up = $('#profile-upload');
    if (up) {
      up.addEventListener('change', function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        if (f.size > 1.5 * 1024 * 1024) return toast('图片太大（≤1.5MB）', 'warn');
        var reader = new FileReader();
        reader.onload = function (ev) {
          state.avatar = ev.target.result;
          updateState({ avatar: state.avatar });
          renderCurrentAvatar();
          $$('.avatar-item').forEach(function (x) {
            x.style.borderColor = 'transparent';
            x.style.background = '#F0EEFF';
          });
          toast('头像已更新', 'success');
        };
        reader.readAsDataURL(f);
      });
    }
    var next = $('#btn-profile-next');
    if (next) {
      next.addEventListener('click', function () {
        var name = ($('#profile-name').value || '').trim();
        if (name) updateState({ name: name });
        toast('太棒了！', 'success');
        go('grade');
      });
    }
  }

  // ===================================================
  // 9. 年级 / 教材选择
  // ===================================================
  function renderGrade() {
    var gs = $('#grade-select'), vs = $('#version-select');
    if (gs && !gs.dataset.init) {
      gs.innerHTML = '';
      DD.GRADES.forEach(function (g) {
        var o = document.createElement('option'); o.value = g.id; o.textContent = g.name;
        gs.appendChild(o);
      });
      gs.dataset.init = '1';
    }
    if (vs && !vs.dataset.init) {
      vs.innerHTML = '';
      DD.VERSIONS.forEach(function (v) {
        var o = document.createElement('option'); o.value = v.id; o.textContent = v.name;
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
        toast('设置完成！开始学习吧', 'success');
        go('home');
        if (!state.onboardingDone) {
          setTimeout(function () { $('#tutorial').style.display = 'block'; showTutorialStep(1); }, 600);
        }
      };
    }
  }

  // ===================================================
  // 10. 主页
  // ===================================================
  var currentMode = 'preview';
  function renderHome() {
    if (!state) return;
    setAvatar($('#homeAvatar'), state.avatar);
    var n = $('#homeName'); if (n) n.textContent = state.name;
    var g = $('#homeGrade');
    if (g) {
      var gr = DD.GRADES.filter(function (x) { return x.id === state.grade; })[0];
      g.textContent = gr ? gr.name : '学前班';
    }
    var v = $('#homeVersion');
    if (v) {
      var vr = DD.VERSIONS.filter(function (x) { return x.id === state.version; })[0];
      v.textContent = vr ? vr.name : '人教版';
    }
    var s = $('#homeStreak'); if (s) s.textContent = state.streak || 0;
    var c = $('#homeCoin'); if (c) c.textContent = state.coin || 0;
    var titleTag = $('#homeTitleTag');
    if (titleTag) {
      var t = getCurrentTitle();
      titleTag.textContent = t ? t.name : '初学者';
    }
    var modeText = $('#mode-info-text');
    if (modeText) {
      var map = { preview: '预习 · AI 老师讲解', learn: '学习 · 闯关答题', review: '复习 · 错题回顾' };
      modeText.textContent = map[currentMode] || '请选择学习模式';
    }
    renderDailyTasks();
    markActive();
  }

  function renderDailyTasks() {
    var tasks = DD.makeDailyTasks();
    var list = $('#dailyList');
    var bar = $('#dailyBar');
    if (!list) return;
    list.innerHTML = '';
    var doneCount = 0;
    tasks.forEach(function (t) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 0';
      var ico = '<span data-icon="' + t.icon + '" style="width:18px;height:18px;color:#7C5CFF" aria-hidden="true"></span>';
      row.innerHTML =
        '<span style="display:inline-flex;width:24px;height:24px;border-radius:50%;background:' + (t.done ? '#2ECC71' : '#F0EEFF') + ';color:#fff;align-items:center;justify-content:center">' +
        (t.done ? '✓' : '') + '</span>' +
        '<div style="flex:1;font-size:13px">' + t.name + '</div>' +
        '<div style="font-size:12px;color:#8E8AB0">' + t.current + '/' + t.target + '</div>';
      list.appendChild(row);
      if (t.done) doneCount++;
    });
    if (bar) {
      var pct = tasks.length ? Math.round(doneCount / tasks.length * 100) : 0;
      bar.style.width = pct + '%';
    }
    setTimeout(renderIcons, 0);
  }

  function bindHome() {
    // 快速入口
    $$('.quick-card').forEach(function (card) {
      var quick = card.getAttribute('data-quick');
      function go_quick() {
        if (quick === 'preview' || quick === 'learn' || quick === 'review') {
          currentMode = quick;
          var map = { preview: 'preview', learn: 'learn', review: 'review' };
          go('subjects', { mode: quick });
        } else if (quick === 'read') { go('textbook'); }
        else if (quick === 'dict') { go('dict'); }
        else if (quick === 'paper') { go('paper'); }
        else if (quick === 'mapstudio') { go('mapstudio'); }
        else if (quick === 'appstudio') { go('appstudio'); }
        else if (quick === 'mood') { go('mood'); }
        else if (quick === 'report') { go('report'); }
        else if (quick === 'calendar') { go('calendar'); }
        else if (quick === 'class') { go('class'); }
      }
      card.addEventListener('click', go_quick);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go_quick(); }
      });
    });
    // 底部 tabbar
    $$('.tabbar .tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var t = tab.getAttribute('data-tab');
        if (t === 'home') go('home');
        else if (t === 'subjects') go('subjects');
        else if (t === 'square') go('square');
        else if (t === 'me') go('me');
      });
    });
    // 教程步骤
    var tutCur = 1;
    function showTutorialStep(n) {
      $$('.tutorial-step').forEach(function (s) { s.style.display = 'none'; });
      var cur = $('.tutorial-step[data-step="' + n + '"]');
      if (cur) cur.style.display = 'block';
      tutCur = n;
    }
    var tp = $('#tut-prev'), tn = $('#tut-next');
    if (tp) tp.addEventListener('click', function () { showTutorialStep(Math.max(1, tutCur - 1)); });
    if (tn) tn.addEventListener('click', function () {
      if (tutCur >= 4) {
        $('#tutorial').style.display = 'none';
        state.onboardingDone = true;
        saveState();
      } else { showTutorialStep(tutCur + 1); }
    });
  }

  // ===================================================
  // 11. 学科入口
  // ===================================================
  function renderSubjects() {
    var grid = $('#subjectGrid');
    if (!grid) return;
    grid.innerHTML = '';
    var modeName = (currentParams && currentParams.mode) || currentMode || 'learn';
    currentMode = modeName;
    DD.SUBJECTS.forEach(function (s) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'subject-card ' + s.id;
      card.setAttribute('aria-label', s.name);
      card.innerHTML =
        '<div class="subject-icon"><span data-icon="' + s.icon + '" style="width:36px;height:36px;color:#fff" aria-hidden="true"></span></div>' +
        '<div>' +
          '<div class="subject-name">' + s.name + '</div>' +
          '<div class="subject-meta">' + s.sub.length + ' 个版本</div>' +
        '</div>';
      card.addEventListener('click', function () {
        go('map', { subject: s.id });
      });
      grid.appendChild(card);
    });
    setTimeout(renderIcons, 0);
  }

  // ===================================================
  // 12. 闯关地图
  // ===================================================
  var mapSubject = '';
  var mapNodes = [];
  function renderMap() {
    if (!state) return;
    var params = currentParams || {};
    mapSubject = params.subject || 'chinese';
    var sub = DD.findSubject(mapSubject) || DD.SUBJECTS[0];
    var n = $('#map-subject-name');
    if (n) n.textContent = sub.name;
    var nodes = DD.makeMapNodes(sub.name);
    // 加载存档
    var prog = state.progress[mapSubject] || { node: 0, done: [] };
    nodes.forEach(function (node, idx) {
      node.locked = idx > prog.node;
      node.star = prog.done[idx] || 0;
    });
    mapNodes = nodes;
    var path = $('#mapPath');
    path.innerHTML = '';
    nodes.forEach(function (node, idx) {
      if (idx > 0) {
        var c = document.createElement('div'); c.className = 'map-connector';
        path.appendChild(c);
      }
      var div = document.createElement('button');
      div.type = 'button';
      div.className = 'map-node';
      if (node.star > 0) div.classList.add('done');
      if (!node.locked && node.star === 0) div.classList.add('current');
      if (node.locked) div.classList.add('locked');
      div.setAttribute('aria-label', node.name + (node.locked ? '（未解锁）' : ''));
      var starStr = '';
      for (var i = 0; i < 3; i++) starStr += (i < node.star ? '★' : '☆');
      div.innerHTML =
        '<div class="node-index">' + (idx + 1) + '</div>' +
        '<div class="node-info">' +
          '<div class="node-title">' + node.name + '</div>' +
          '<div class="node-meta">' + node.desc + ' · ' + node.total + ' 题</div>' +
        '</div>' +
        '<div class="node-stars">' + starStr + '</div>';
      if (!node.locked) {
        div.addEventListener('click', function () {
          startQuiz(mapSubject, idx, node.total);
        });
      } else {
        div.addEventListener('click', function () { toast('先通关前一关', 'warn'); });
      }
      path.appendChild(div);
    });
  }

  // ===================================================
  // 13. 答题页
  // ===================================================
  var quizCtx = null; // { subject, nodeIdx, total, list, cur, correct, wrong, combo, maxCombo, coinGain, wrongList, startTime, mode }
  function startQuiz(subject, nodeIdx, total) {
    var qs = DD.QUESTIONS.filter(function (q) { return q.subject === subject; });
    if (!qs.length) { toast('该学科暂无题目', 'warn'); return; }
    var list = shuffle(qs).slice(0, total || 5);
    quizCtx = {
      subject: subject,
      nodeIdx: nodeIdx,
      total: total,
      list: list,
      cur: 0,
      correct: 0,
      wrong: 0,
      combo: 0,
      maxCombo: 0,
      coinGain: 0,
      wrongList: [],
      startTime: Date.now(),
      mode: 'map'
    };
    go('quiz');
  }
  function startPaperQuiz(subject, diff, num) {
    var qs = DD.QUESTIONS.filter(function (q) { return q.subject === subject; });
    if (diff !== 'mix') qs = qs.filter(function (q) { return q.diff === diff; });
    if (!qs.length) qs = DD.QUESTIONS.filter(function (q) { return q.subject === subject; });
    if (!qs.length) { toast('该学科暂无题目', 'warn'); return; }
    var list = shuffle(qs).slice(0, num);
    quizCtx = {
      subject: subject, nodeIdx: -1, total: num, list: list,
      cur: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, coinGain: 0,
      wrongList: [], startTime: Date.now(), mode: 'paper',
      diff: diff
    };
    go('paper-quiz');
  }

  function renderQuiz() { renderQuizGeneric('quiz', true); }
  function renderPaperQuiz() { renderQuizGeneric('paper-quiz', false); }

  function renderQuizGeneric(prefix, withHelpers) {
    if (!quizCtx) { go('map'); return; }
    var i = quizCtx.cur;
    if (i >= quizCtx.list.length) { finishQuiz(); return; }
    var q = quizCtx.list[i];
    var total = quizCtx.list.length;
    var pct = Math.round((i / total) * 100);
    var pbar = $('#' + (prefix === 'quiz' ? 'quizProgress' : 'pqProgress'));
    var ptext = $('#' + (prefix === 'quiz' ? 'quizProgressText' : 'pqProgressText'));
    if (pbar) pbar.style.width = pct + '%';
    if (ptext) ptext.textContent = (i + 1) + '/' + total;
    if (withHelpers) {
      var cb = $('#quizCombo'); if (cb) cb.textContent = quizCtx.combo;
      var cn = $('#quizCoin'); if (cn) cn.textContent = quizCtx.coinGain;
      var tm = $('#quizTimer');
      if (tm && quizCtx._timerStart) {
        tm.textContent = Math.floor((Date.now() - quizCtx._timerStart) / 1000);
      }
    }
    var qEl = $('#' + (prefix === 'quiz' ? 'quizQuestion' : 'pqQuestion'));
    if (qEl) qEl.textContent = q.q;
    var opts = $('#' + (prefix === 'quiz' ? 'quizOptions' : 'pqOptions'));
    if (opts) {
      opts.innerHTML = '';
      q.opts.forEach(function (o, idx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'opt-btn';
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-label', '选项 ' + (idx + 1) + ' ' + o);
        btn.innerHTML = '<div class="opt-label">' + ['A','B','C','D'][idx] + '</div><div class="opt-text">' + escapeHtml(o) + '</div>';
        btn.addEventListener('click', function () { answerQuestion(btn, idx, q, prefix); });
        opts.appendChild(btn);
      });
    }
    if (withHelpers) {
      // 收藏状态
      var fav = $('#fav-text');
      if (fav) {
        var isFav = state.favorites.some(function (f) { return f.id === q.id; });
        fav.textContent = isFav ? '已收藏' : '收藏';
      }
    }
    // 启动计时
    quizCtx._timerStart = Date.now();
    quizCtx._qStart = Date.now();
    quizCtx._answered = false;
  }

  function answerQuestion(btn, idx, q, prefix) {
    if (quizCtx._answered) return;
    quizCtx._answered = true;
    var correct = idx === q.a;
    var card = $('#' + (prefix === 'quiz' ? 'quizCard' : 'paperQuizCard'));
    var opts = $('#' + (prefix === 'quiz' ? 'quizOptions' : 'pqOptions'));

    // 禁用所有按钮
    $$('.opt-btn', opts).forEach(function (b) { b.disabled = true; });
    // 高亮
    btn.classList.add(correct ? 'correct' : 'wrong');
    if (!correct) {
      // 标记正确答案
      var btns = $$('.opt-btn', opts);
      if (btns[q.a]) btns[q.a].classList.add('correct');
    }
    if (correct) {
      quizCtx.correct++;
      quizCtx.combo++;
      if (quizCtx.combo > quizCtx.maxCombo) quizCtx.maxCombo = quizCtx.combo;
      var gain = q.exp || 5;
      // 双倍经验
      if (state.doubleExpUntil && state.doubleExpUntil > Date.now()) gain *= 2;
      // 金币加成
      var coin = Math.max(1, Math.round(gain / 2));
      if (state.coinBonusUntil && state.coinBonusUntil > Date.now()) coin *= 2;
      quizCtx.coinGain += coin;
      // 答对统计
      state.stats.correct++; state.stats.total++;
      state.subjectCorrect[q.subject] = (state.subjectCorrect[q.subject] || 0) + 1;
      // 经验
      addExp(gain);
      addCoin(coin);
      // 烟花
      if (prefix === 'quiz') {
        card.classList.add('correct');
        setTimeout(function () { card.classList.remove('correct'); }, 500);
        fireConfetti();
        flyCoin(btn);
      } else {
        fireConfetti($('#confetti2'));
      }
      var cb = $('#quizCombo'); if (cb) cb.textContent = quizCtx.combo;
      var cn = $('#quizCoin'); if (cn) cn.textContent = quizCtx.coinGain;
    } else {
      quizCtx.wrong++;
      quizCtx.combo = 0;
      state.stats.wrong++; state.stats.total++;
      // 加入错题本
      addWrong(q);
      quizCtx.wrongList.push(q);
      // 屏幕摇晃
      document.body.classList.add('shake');
      setTimeout(function () { document.body.classList.remove('shake'); }, 400);
    }
    // 启用下一题按钮
    if (prefix === 'quiz') {
      var nb = $('#btn-next'); if (nb) nb.disabled = false;
    } else {
      var nb2 = $('#btn-pq-next'); if (nb2) nb2.disabled = false;
    }
  }

  function finishQuiz() {
    if (!quizCtx) return;
    var ctx = quizCtx;
    var isPaper = ctx.mode === 'paper';
    // 更新关卡进度（仅地图模式）
    if (!isPaper) {
      var prog = state.progress[ctx.subject] || { node: 0, done: [] };
      // 答对 60% 算通关
      var ratio = ctx.correct / ctx.list.length;
      var star = ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.5 ? 1 : 0;
      if (star > 0) {
        if (!prog.done[ctx.nodeIdx] || prog.done[ctx.nodeIdx] < star) prog.done[ctx.nodeIdx] = star;
        if (ctx.nodeIdx >= prog.node) prog.node = ctx.nodeIdx + 1;
        // 通关奖励
        var nodes = DD.makeMapNodes((DD.findSubject(ctx.subject) || {}).name || '');
        var reward = nodes[ctx.nodeIdx] && nodes[ctx.nodeIdx].reward;
        if (reward) {
          addCoin(reward.coin);
          addExp(reward.exp);
          ctx.coinGain += reward.coin;
          ctx._mapReward = reward;
        }
        state.stats.mapClear++;
      }
      state.progress[ctx.subject] = prog;
    }
    // 错题入错题本
    ctx.wrongList.forEach(addWrong);
    saveState();
    go('result');
  }

  function nextQuestion(prefix) {
    if (!quizCtx) return;
    quizCtx.cur++;
    renderQuizGeneric(prefix, true);
  }

  function renderResult() {
    if (!quizCtx) { go('home'); return; }
    var ctx = quizCtx;
    var ratio = ctx.correct / ctx.list.length;
    var emoji = '🏆';
    var title = '太棒了！';
    var sub = '继续加油！';
    if (ratio >= 0.9) { emoji = '🏆'; title = '完美！'; sub = '你是学习小天才！'; }
    else if (ratio >= 0.7) { emoji = '🎉'; title = '太棒了！'; sub = '差一点就完美了'; }
    else if (ratio >= 0.5) { emoji = '💪'; title = '不错！'; sub = '再努力一下就更好'; }
    else { emoji = '🤔'; title = '加油！'; sub = '错题记得复习哦'; }
    var re = $('#resultEmoji'); if (re) re.textContent = emoji;
    var rt = $('#resultTitle'); if (rt) rt.textContent = title;
    var rs = $('#resultSub'); if (rs) rs.textContent = sub;

    var st = $('#resultStats');
    if (st) {
      st.innerHTML =
        '<div class="stat-card glass" style="padding:12px"><div style="font-weight:800;font-size:18px">' + ctx.correct + '</div><div style="font-size:11px;color:#8E8AB0">答对</div></div>' +
        '<div class="stat-card glass" style="padding:12px"><div style="font-weight:800;font-size:18px">' + ctx.wrong + '</div><div style="font-size:11px;color:#8E8AB0">答错</div></div>' +
        '<div class="stat-card glass" style="padding:12px"><div style="font-weight:800;font-size:18px">' + ctx.maxCombo + '</div><div style="font-size:11px;color:#8E8AB0">最高连击</div></div>' +
        '<div class="stat-card glass" style="padding:12px"><div style="font-weight:800;font-size:18px;color:#FFB300">+' + ctx.coinGain + '</div><div style="font-size:11px;color:#8E8AB0">获得金币</div></div>';
    }
    // 成就展示
    var ach = $('#resultAch');
    if (ach) {
      ach.innerHTML = '';
      var newAch = state.achievements || {};
      DD.ACHIEVEMENTS.forEach(function (a) {
        if (newAch[a.id] && newAch[a.id].justUnlocked) {
          var div = document.createElement('div');
          div.className = 'achv-card';
          div.style.cssText = 'display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#FFD700,#FFA500);color:#fff;padding:8px 16px;border-radius:999px;margin:4px';
          div.innerHTML = '<span data-icon="' + a.icon + '" style="width:16px;height:16px;color:#fff"></span><span>解锁：' + a.name + '</span>';
          ach.appendChild(div);
        }
      });
      if (!ach.children.length) ach.innerHTML = '<div style="font-size:12px;color:#8E8AB0">暂无新成就</div>';
      setTimeout(renderIcons, 0);
    }
    // 再来一次
    var ra = $('#btn-result-again');
    if (ra) {
      ra.onclick = function () {
        if (ctx.mode === 'paper') {
          startPaperQuiz(ctx.subject, ctx.diff, ctx.total);
        } else {
          startQuiz(ctx.subject, ctx.nodeIdx, ctx.total);
        }
      };
    }
  }

  // 烟花
  function fireConfetti(root) {
    root = root || $('#confetti');
    if (!root) return;
    var colors = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
    for (var i = 0; i < 20; i++) {
      var p = document.createElement('div');
      p.className = 'confetti-piece ' + colors[Math.floor(Math.random() * colors.length)];
      var angle = Math.random() * Math.PI * 2;
      var dist = 80 + Math.random() * 100;
      p.style.setProperty('--x', (Math.cos(angle) * dist) + 'px');
      p.style.setProperty('--y', (Math.sin(angle) * dist) + 'px');
      root.appendChild(p);
      (function (el) { setTimeout(function () { el.remove(); }, 1300); })(p);
    }
  }
  function flyCoin(fromBtn) {
    var av = $('#topCoin');
    if (!av) return;
    var r1 = fromBtn.getBoundingClientRect();
    var r2 = av.getBoundingClientRect();
    var c = document.createElement('div');
    c.className = 'coin-fly';
    c.textContent = '+💎';
    c.style.left = r1.left + 'px';
    c.style.top = r1.top + 'px';
    c.style.setProperty('--cx', (r2.left - r1.left) + 'px');
    c.style.setProperty('--cy', (r2.top - r1.top) + 'px');
    document.body.appendChild(c);
    setTimeout(function () { c.remove(); }, 1100);
  }

  // ===================================================
  // 14. 错题本
  // ===================================================
  function addWrong(q) {
    if (!state.wrongBook.some(function (w) { return w.id === q.id; })) {
      state.wrongBook.push({
        id: q.id, q: q.q, opts: q.opts, a: q.a, exp: q.exp,
        diff: q.diff, subject: q.subject, ts: Date.now()
      });
      saveState();
    }
  }
  var wbFilter = 'all';
  function renderWrongBook() {
    var list = $('#wrongList');
    if (!list) return;
    var items = state.wrongBook.slice();
    if (wbFilter !== 'all') items = items.filter(function (x) { return x.subject === wbFilter; });
    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = '<div class="empty-state"><div style="font-size:48px">📒</div><div class="empty-title">错题本是空的</div><div class="empty-desc">答错题目会自动收集到这</div></div>';
      return;
    }
    items.forEach(function (q) {
      var sub = DD.findSubject(q.subject);
      var div = document.createElement('div');
      div.className = 'glass';
      div.style.cssText = 'padding:12px;margin-bottom:8px;border-radius:12px';
      div.innerHTML =
        '<div style="font-size:11px;color:#8E8AB0;margin-bottom:4px">' + (sub ? sub.name : '') + ' · ' + (q.diff || '') + '</div>' +
        '<div style="font-weight:800;margin-bottom:8px">' + escapeHtml(q.q) + '</div>' +
        '<div style="font-size:13px;color:#2ECC71">答案：' + escapeHtml(q.opts[q.a]) + '</div>';
      list.appendChild(div);
    });
    // 筛选按钮
    $$('.filter-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-filter') === wbFilter);
      b.classList.toggle('btn-ghost', b.getAttribute('data-filter') !== wbFilter);
      b.onclick = function () { wbFilter = b.getAttribute('data-filter'); renderWrongBook(); };
    });
    var redo = $('#btn-wb-redo');
    if (redo) {
      redo.onclick = function () {
        if (!items.length) return;
        var first = items[0];
        var ids = items.map(function (i) { return i.id; });
        var qs = DD.QUESTIONS.filter(function (q) { return ids.indexOf(q.id) >= 0; });
        if (!qs.length) return;
        quizCtx = {
          subject: first.subject, nodeIdx: -1, total: qs.length, list: qs,
          cur: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, coinGain: 0,
          wrongList: [], startTime: Date.now(), mode: 'review'
        };
        go('quiz');
      };
    }
  }

  // ===================================================
  // 15. 收藏本
  // ===================================================
  function renderFavorites() {
    var list = $('#favList');
    if (!list) return;
    list.innerHTML = '';
    var favs = state.favorites;
    if (!favs.length) {
      list.innerHTML = '<div class="empty-state"><div style="font-size:48px">⭐</div><div class="empty-title">还没有收藏</div><div class="empty-desc">答题时点星标即可收藏</div></div>';
      return;
    }
    favs.forEach(function (q) {
      var sub = DD.findSubject(q.subject);
      var div = document.createElement('div');
      div.className = 'glass';
      div.style.cssText = 'padding:12px;margin-bottom:8px;border-radius:12px';
      div.innerHTML =
        '<div style="font-size:11px;color:#8E8AB0;margin-bottom:4px">' + (sub ? sub.name : '') + '</div>' +
        '<div style="font-weight:800;margin-bottom:8px">' + escapeHtml(q.q) + '</div>' +
        '<div style="font-size:13px;color:#5A577A">' + q.opts.map(function (o, i) {
          return '<div style="padding:2px 0' + (i === q.a ? ';color:#2ECC71;font-weight:700' : '') + '">' + ['A','B','C','D'][i] + '. ' + escapeHtml(o) + (i === q.a ? ' ✓' : '') + '</div>';
        }).join('') + '</div>';
      list.appendChild(div);
    });
  }
  function toggleFav(q) {
    var i = state.favorites.findIndex(function (f) { return f.id === q.id; });
    if (i >= 0) {
      state.favorites.splice(i, 1);
      toast('已取消收藏');
    } else {
      state.favorites.push({
        id: q.id, q: q.q, opts: q.opts, a: q.a, exp: q.exp,
        diff: q.diff, subject: q.subject, ts: Date.now()
      });
      toast('已收藏 ⭐', 'success');
    }
    saveState();
  }

  // ===================================================
  // 16. 广场 + 动态
  // ===================================================
  function getAllPosts() {
    var posts = safeGet(POSTS_KEY, []);
    if (!Array.isArray(posts)) posts = [];
    return posts;
  }
  function setAllPosts(posts) { safeSet(POSTS_KEY, posts); }

  function renderSquare() {
    // 活动横幅
    var today = new Date();
    var day = today.getDate();
    var month = today.getMonth() + 1;
    var banner = null;
    for (var i = 0; i < DD.EVENTS.length; i++) {
      if (DD.EVENTS[i].day === day) { banner = DD.EVENTS[i]; break; }
    }
    if (!banner) banner = { title: '日常活动', tip: '每天学习一点点，进步一大步', reward: { coin: 20, exp: 30 } };
    var et = $('#eventTitle'); if (et) et.textContent = banner.title;
    var etip = $('#eventTip'); if (etip) etip.textContent = banner.tip;

    // 动态列表
    var list = $('#postList');
    if (!list) return;
    var posts = getAllPosts();
    if (!posts.length) {
      list.innerHTML = '<div class="empty-state"><div style="font-size:48px">📣</div><div class="empty-title">还没有动态</div><div class="empty-desc">快来发布第一条吧</div></div>';
      return;
    }
    list.innerHTML = '';
    posts.slice(0, 50).forEach(function (p) {
      var div = document.createElement('div');
      div.className = 'glass';
      div.style.cssText = 'padding:12px;margin-bottom:8px;border-radius:12px';
      var attach = '';
      if (p.attach) {
        attach = '<div style="font-size:12px;color:#7C5CFF;margin-top:4px">📎 ' + (p.attach === 'map' ? '我的地图' : '我的应用') + '</div>';
      }
      var mediaCount = (p.media && p.media.length) || 0;
      var mediaInfo = mediaCount ? '<div style="font-size:12px;color:#5A577A;margin-top:4px">📎 ' + mediaCount + ' 个附件</div>' : '';
      div.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
          '<div class="avatar small" style="background:linear-gradient(135deg,#7C5CFF,#FF5CAE)">' + escapeHtml(p.avatar || '😀') + '</div>' +
          '<div style="flex:1"><div style="font-weight:800;font-size:13px">' + escapeHtml(p.name || '匿名') + '</div>' +
          '<div style="font-size:11px;color:#8E8AB0">' + new Date(p.ts).toLocaleString() + '</div></div>' +
        '</div>' +
        '<div style="font-size:14px;color:#1F1D3A;line-height:1.5">' + escapeHtml(p.text || '') + '</div>' +
        attach + mediaInfo;
      list.appendChild(div);
    });
  }

  function renderPost() {
    // 附加选项
    var sel = $('#post-attach');
    if (sel) {
      sel.innerHTML = '<option value="">无</option>' +
        '<option value="map">我的地图</option>' +
        '<option value="app">我的应用</option>';
    }
  }
  function bindPost() {
    var pub = $('#btn-publish');
    if (pub) {
      pub.addEventListener('click', function () {
        var text = ($('#post-text').value || '').trim();
        if (!text) { toast('写点什么吧', 'warn'); return; }
        var posts = getAllPosts();
        posts.unshift({
          name: state.name,
          avatar: state.avatar,
          text: text,
          media: [],
          attach: $('#post-attach').value || '',
          ts: Date.now()
        });
        setAllPosts(posts);
        state.stats.post = (state.stats.post || 0) + 1;
        saveState();
        $('#post-text').value = '';
        toast('发布成功！', 'success');
        go('square');
      });
    }
  }

  // ===================================================
  // 17. 学习库
  // ===================================================
  function renderLibrary() {}

  // ===================================================
  // 18. 字词典（带防抖）
  // ===================================================
  function renderDict() {
    var input = $('#dict-input');
    var list = $('#dictList');
    if (!list) return;
    function doRender() {
      var q = (input.value || '').toLowerCase().trim();
      list.innerHTML = '';
      var items = DD.DICT;
      if (q) {
        items = items.filter(function (d) {
          return (d.pinyin && d.pinyin.toLowerCase().indexOf(q) >= 0) ||
            (d.meaning && d.meaning.indexOf(q) >= 0) ||
            (d.en && d.en.toLowerCase().indexOf(q) >= 0) ||
            (d.example && d.example.indexOf(q) >= 0);
        });
      }
      if (!items.length) {
        list.innerHTML = '<div class="empty-state"><div style="font-size:48px">🔍</div><div class="empty-title">没找到结果</div><div class="empty-desc">试试别的词</div></div>';
        return;
      }
      items.slice(0, 100).forEach(function (d) {
        var div = document.createElement('div');
        div.className = 'glass';
        div.style.cssText = 'padding:12px;margin-bottom:8px;border-radius:12px';
        div.innerHTML =
          '<div style="display:flex;align-items:baseline;gap:8px">' +
            '<div style="font-weight:800;font-size:20px;color:#7C5CFF">' + escapeHtml(d.meaning) + '</div>' +
            '<div style="font-size:13px;color:#8E8AB0">[' + escapeHtml(d.pinyin) + ']</div>' +
            '<div style="font-size:13px;color:#2ECC71;margin-left:auto">/' + escapeHtml(d.en) + '/</div>' +
          '</div>' +
          (d.example ? '<div style="font-size:13px;color:#5A577A;margin-top:4px">例：' + escapeHtml(d.example) + '</div>' : '') +
          (d.near && d.near.length ? '<div style="font-size:12px;color:#8E8AB0;margin-top:2px">近义词：' + d.near.map(escapeHtml).join('、') + '</div>' : '') +
          (d.ant && d.ant.length ? '<div style="font-size:12px;color:#8E8AB0;margin-top:2px">反义词：' + d.ant.map(escapeHtml).join('、') + '</div>' : '') +
          (d.sentence ? '<div style="font-size:12px;color:#5A577A;margin-top:4px;font-style:italic">"' + escapeHtml(d.sentence) + '"</div>' : '');
        list.appendChild(div);
      });
    }
    if (input && !input.dataset.init) {
      var t = null;
      input.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(doRender, 200);
      });
      input.dataset.init = '1';
    }
    doRender();
  }

  // ===================================================
  // 19. AI 试卷
  // ===================================================
  function renderPaper() {
    var sel = $('#paper-subject');
    if (sel && !sel.dataset.init) {
      sel.innerHTML = '';
      DD.SUBJECTS.forEach(function (s) {
        var o = document.createElement('option'); o.value = s.id; o.textContent = s.name;
        sel.appendChild(o);
      });
      sel.dataset.init = '1';
    }
    var start = $('#btn-paper-start');
    if (start) {
      start.onclick = function () {
        var sub = sel.value;
        var diff = $('#paper-diff').value;
        var num = parseInt($('#paper-num').value, 10);
        var mode = ($('#paper-mode') && $('#paper-mode').value) || 'local';
        if (mode === 'ai' && window.AI && window.AI.hasRealAI()) {
          startPaperQuizAI(sub, diff, num);
        } else {
          startPaperQuiz(sub, diff, num);
        }
      };
    }
  }

  /** AI 试卷：AI 生成题目 → 进入答题 */
  function startPaperQuizAI(subject, diff, num) {
    if (typeof toast === 'function') toast('AI 正在出题...', 'success');
    var btn = $('#btn-paper-start');
    if (btn) { btn.disabled = true; btn.textContent = 'AI 出题中...'; }
    window.AI.generateQuestions(subject, diff, num).then(function (questions) {
      if (btn) { btn.disabled = false; btn.textContent = '开始答题'; }
      if (!questions || !questions.length) {
        if (typeof toast === 'function') toast('AI 出题失败，使用本地题库', 'warn');
        return startPaperQuiz(subject, diff, num);
      }
      // 补充必要字段
      var i = 0;
      questions.forEach(function (q) {
        q.id = q.id || ('ai_' + Date.now() + '_' + (i++));
        q.subject = q.subject || subject;
        q.diff = q.diff || diff;
        if (typeof q.a !== 'number') q.a = 0;
        if (!q.opts || !q.opts.length) q.opts = ['A', 'B', 'C', 'D'];
      });
      quizCtx = {
        list: questions,
        cur: 0,
        correct: 0, wrong: 0, combo: 0, maxCombo: 0,
        wrongList: [], startTime: Date.now(), mode: 'paper',
        subject: subject, diff: diff, source: 'ai'
      };
      go('paper-quiz');
    }).catch(function (e) {
      if (btn) { btn.disabled = false; btn.textContent = '开始答题'; }
      if (typeof toast === 'function') toast('AI 出题出错：' + e.message, 'danger');
      startPaperQuiz(subject, diff, num);
    });
  }

  // ===================================================
  // 20. 课文朗读
  // ===================================================
  var speechRec = null;
  function renderTextbook() {
    var list = $('#textbookList');
    if (!list) return;
    list.innerHTML = '';
    DD.ARTICLES.forEach(function (a, idx) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'glass';
      card.style.cssText = 'padding:16px;margin-bottom:8px;border-radius:12px;text-align:left;width:100%;display:block;cursor:pointer';
      card.innerHTML =
        '<div style="display:flex;align-items:center;gap:12px">' +
          '<div style="width:48px;height:48px;background:linear-gradient(135deg,#7C5CFF,#FF5CAE);border-radius:12px;display:flex;align-items:center;justify-content:center">' +
            '<span data-icon="mic" style="width:24px;height:24px;color:#fff" aria-hidden="true"></span>' +
          '</div>' +
          '<div style="flex:1">' +
            '<div style="font-weight:800">' + escapeHtml(a.title) + '</div>' +
            '<div style="font-size:12px;color:#8E8AB0">' + escapeHtml(a.author) + ' · ' + escapeHtml(a.grade) + '</div>' +
          '</div>' +
        '</div>';
      card.addEventListener('click', function () { openTextbook(idx); });
      list.appendChild(card);
    });
    setTimeout(renderIcons, 0);
  }
  function openTextbook(idx) {
    var a = DD.ARTICLES[idx];
    if (!a) return;
    $('#tbModalTitle').textContent = a.title + ' · ' + a.author;
    $('#tbModalBody').innerHTML =
      '<div style="background:#F0EEFF;padding:16px;border-radius:12px;line-height:1.8;font-size:18px;font-weight:700;margin-bottom:12px;white-space:pre-wrap">' + escapeHtml(a.text) + '</div>' +
      '<div style="font-size:13px;color:#5A577A;line-height:1.6">' + escapeHtml(a.translation) + '</div>';
    openModal('tbModal');
    var sp = $('#btn-tb-speak');
    if (sp) sp.onclick = function () { speakText(a.text); };
    var rd = $('#btn-tb-read');
    if (rd) rd.onclick = function () { startSpeechRecognition(a.text); };
  }
  function speakText(t) {
    if (!('speechSynthesis' in window)) { toast('当前浏览器不支持朗读', 'warn'); return; }
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(t);
      u.lang = 'zh-CN'; u.rate = 0.9; u.pitch = 1.0;
      window.speechSynthesis.speak(u);
      toast('开始朗读', 'success');
    } catch (e) { toast('朗读失败', 'danger'); }
  }
  function startSpeechRecognition(target) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('当前浏览器不支持语音识别', 'warn'); return; }
    try {
      speechRec = new SR();
      speechRec.lang = 'zh-CN';
      speechRec.interimResults = false;
      speechRec.onresult = function (e) {
        var txt = e.results[0][0].transcript;
        if (target && txt.indexOf(target.substring(0, 5)) >= 0) {
          toast('读得不错！', 'success');
          state.stats.speak = (state.stats.speak || 0) + 1;
          saveState();
        } else {
          toast('再试一次: ' + txt, 'warn');
        }
      };
      speechRec.onerror = function (e) { toast('识别失败：' + e.error, 'danger'); };
      speechRec.onend = function () { toast('识别结束'); };
      speechRec.start();
      toast('请开始朗读...', 'success');
    } catch (e) { toast('权限被拒绝', 'danger'); }
  }

  // ===================================================
  // 21. 地图工坊
  // ===================================================
  function renderMapStudio() {
    var sel = $('#ms-subject');
    if (sel && !sel.dataset.init) {
      sel.innerHTML = '';
      DD.SUBJECTS.forEach(function (s) {
        var o = document.createElement('option'); o.value = s.id; o.textContent = s.name;
        sel.appendChild(o);
      });
      sel.dataset.init = '1';
    }
    var btn = $('#btn-ms-create');
    if (btn) {
      btn.onclick = function () {
        var name = ($('#ms-name').value || '').trim() || '我的地图';
        var subject = sel.value;
        var num = parseInt($('#ms-num').value, 10);
        if (!state.maps) state.maps = [];
        state.maps.push({ name: name, subject: subject, num: num, ts: Date.now() });
        saveState();
        toast('地图已生成！', 'success');
        $('#ms-name').value = '';
        renderMSList();
      };
    }
    renderMSList();
  }
  function renderMSList() {
    var list = $('#msList');
    if (!list) return;
    list.innerHTML = '';
    if (!state.maps || !state.maps.length) {
      list.innerHTML = '<div class="empty-state"><div style="font-size:48px">🗺️</div><div class="empty-title">还没有地图</div><div class="empty-desc">创建你的专属地图吧</div></div>';
      return;
    }
    state.maps.forEach(function (m, i) {
      var sub = DD.findSubject(m.subject);
      var div = document.createElement('div');
      div.className = 'glass';
      div.style.cssText = 'padding:12px;margin-bottom:8px;border-radius:12px;display:flex;align-items:center;gap:12px';
      div.innerHTML =
        '<span data-icon="target" style="width:24px;height:24px;color:#7C5CFF" aria-hidden="true"></span>' +
        '<div style="flex:1"><div style="font-weight:800">' + escapeHtml(m.name) + '</div>' +
        '<div style="font-size:12px;color:#8E8AB0">' + (sub ? sub.name : '') + ' · ' + m.num + ' 题</div></div>' +
        '<button class="btn btn-sm" data-ms-play="' + i + '" aria-label="开始">开始</button>' +
        '<button class="btn btn-sm btn-ghost" data-ms-share="' + i + '" aria-label="分享">分享</button>';
      list.appendChild(div);
    });
    setTimeout(function () {
      $$('[data-ms-play]').forEach(function (b) {
        b.onclick = function () {
          var i = parseInt(b.getAttribute('data-ms-play'), 10);
          var m = state.maps[i];
          startQuiz(m.subject, 0, m.num);
        };
      });
      $$('[data-ms-share]').forEach(function (b) {
        b.onclick = function () {
          var i = parseInt(b.getAttribute('data-ms-share'), 10);
          var m = state.maps[i];
          var posts = getAllPosts();
          posts.unshift({
            name: state.name, avatar: state.avatar,
            text: '我创建了一张地图：' + m.name,
            attach: 'map', media: [], ts: Date.now()
          });
          setAllPosts(posts);
          toast('已分享到广场', 'success');
        };
      });
      renderIcons();
    }, 0);
  }

  // ===================================================
  // 22. 应用工坊
  // ===================================================
  function renderAppStudio() {
    var sel = $('#as-subject');
    if (sel && !sel.dataset.init) {
      sel.innerHTML = '';
      DD.SUBJECTS.forEach(function (s) {
        var o = document.createElement('option'); o.value = s.id; o.textContent = s.name;
        sel.appendChild(o);
      });
      sel.dataset.init = '1';
    }
    var btn = $('#btn-as-create');
    if (btn) {
      btn.onclick = function () {
        var name = ($('#as-name').value || '').trim() || '我的应用';
        var type = $('#as-type').value;
        var subject = sel.value;
        if (!state.apps) state.apps = [];
        state.apps.push({ name: name, type: type, subject: subject, ts: Date.now() });
        saveState();
        toast('应用已创建！', 'success');
        $('#as-name').value = '';
        renderASList();
      };
    }
    renderASList();
  }
  function renderASList() {
    var list = $('#asList');
    if (!list) return;
    list.innerHTML = '';
    if (!state.apps || !state.apps.length) {
      list.innerHTML = '<div class="empty-state"><div style="font-size:48px">🧩</div><div class="empty-title">还没有应用</div><div class="empty-desc">创建你的专属小应用</div></div>';
      return;
    }
    state.apps.forEach(function (a, i) {
      var sub = DD.findSubject(a.subject);
      var div = document.createElement('div');
      div.className = 'glass';
      div.style.cssText = 'padding:12px;margin-bottom:8px;border-radius:12px;display:flex;align-items:center;gap:12px';
      div.innerHTML =
        '<span data-icon="palette" style="width:24px;height:24px;color:#FF5CAE" aria-hidden="true"></span>' +
        '<div style="flex:1"><div style="font-weight:800">' + escapeHtml(a.name) + '</div>' +
        '<div style="font-size:12px;color:#8E8AB0">' + a.type + ' · ' + (sub ? sub.name : '') + '</div></div>' +
        '<button class="btn btn-sm" data-as-play="' + i + '" aria-label="试用">试用</button>' +
        '<button class="btn btn-sm btn-ghost" data-as-share="' + i + '" aria-label="分享">分享</button>';
      list.appendChild(div);
    });
    setTimeout(function () {
      $$('[data-as-play]').forEach(function (b) {
        b.onclick = function () {
          var i = parseInt(b.getAttribute('data-as-play'), 10);
          var a = state.apps[i];
          startQuiz(a.subject, 0, 5);
        };
      });
      $$('[data-as-share]').forEach(function (b) {
        b.onclick = function () {
          var i = parseInt(b.getAttribute('data-as-share'), 10);
          var a = state.apps[i];
          var posts = getAllPosts();
          posts.unshift({
            name: state.name, avatar: state.avatar,
            text: '我做了一个应用：' + a.name,
            attach: 'app', media: [], ts: Date.now()
          });
          setAllPosts(posts);
          toast('已分享到广场', 'success');
        };
      });
      renderIcons();
    }, 0);
  }

  // ===================================================
  // 23. 我的
  // ===================================================
  function renderMe() {
    if (!state) return;
    setAvatar($('#meAvatar'), state.avatar);
    var n = $('#meName'); if (n) n.textContent = state.name;
    var g = $('#meGrade');
    if (g) {
      var gr = DD.GRADES.filter(function (x) { return x.id === state.grade; })[0];
      var vr = DD.VERSIONS.filter(function (x) { return x.id === state.version; })[0];
      g.textContent = (gr ? gr.name : '') + ' · ' + (vr ? vr.name : '');
    }
    var titleTag = $('#meTitleTag');
    if (titleTag) {
      var t = getCurrentTitle();
      titleTag.textContent = t ? t.name : '初学者';
    }
    var lv = DD.calcLevel(state.exp);
    var badge = $('#meLevelBadge'); if (badge) badge.textContent = 'Lv.' + lv;
    var lt = $('#meLevelText'); if (lt) lt.textContent = 'Lv.' + lv;
    var next = DD.nextLevelExp(lv);
    var prev = lv > 1 ? DD.LEVELS[lv - 1] : 0;
    var need = isFinite(next) ? (next - state.exp) : 0;
    var nl = $('#meLevelNext'); if (nl) nl.textContent = '还需 ' + Math.max(0, need) + ' 经验';
    var lf = $('#meLevelFill');
    if (lf) {
      var pct = isFinite(next) ? Math.min(100, Math.round((state.exp - prev) / (next - prev) * 100)) : 100;
      lf.style.width = pct + '%';
    }
    var c = $('#meCoin'); if (c) c.textContent = state.coin;
    var e = $('#meExp'); if (e) e.textContent = state.exp;
    var s = $('#meStreak'); if (s) s.textContent = state.streak;
    var co = $('#meCorrect'); if (co) co.textContent = state.stats.correct;
  }

  // ===================================================
  // 24. 商店
  // ===================================================
  var SHOP_ITEMS = [
    { id: 'guard',    icon: 'shield',  name: '保护卡', desc: '漏签一天不掉连胜', price: 50,  effect: 'guard' },
    { id: 'dblexp',   icon: 'lightning', name: '双倍经验卡', desc: '30 分钟双倍经验', price: 80,  effect: 'doubleExp' },
    { id: 'coinbonus',icon: 'coin',    name: '金币加成卡', desc: '30 分钟金币双倍', price: 60,  effect: 'coinBonus' }
  ];
  function renderShop() {
    var c = $('#shopCoin'); if (c) c.textContent = state.coin;
    var list = $('#shopList');
    if (!list) return;
    list.innerHTML = '';
    SHOP_ITEMS.forEach(function (it) {
      var card = document.createElement('div');
      card.className = 'glass';
      card.style.cssText = 'padding:16px;margin-bottom:12px;border-radius:12px;display:flex;align-items:center;gap:12px';
      card.innerHTML =
        '<div style="width:56px;height:56px;background:linear-gradient(135deg,#FFB300,#FF7E5F);border-radius:14px;display:flex;align-items:center;justify-content:center">' +
          '<span data-icon="' + it.icon + '" style="width:28px;height:28px;color:#fff" aria-hidden="true"></span>' +
        '</div>' +
        '<div style="flex:1">' +
          '<div style="font-weight:800">' + it.name + '</div>' +
          '<div style="font-size:12px;color:#8E8AB0">' + it.desc + '</div>' +
        '</div>' +
        '<button class="btn btn-sm" data-shop-buy="' + it.id + '" data-price="' + it.price + '" aria-label="购买"><span data-icon="coin" style="width:14px;height:14px" aria-hidden="true"></span> ' + it.price + '</button>';
      list.appendChild(card);
    });
    setTimeout(function () {
      $$('[data-shop-buy]').forEach(function (b) {
        b.onclick = function () {
          var id = b.getAttribute('data-shop-buy');
          var price = parseInt(b.getAttribute('data-price'), 10);
          if (state.coin < price) return toast('叮咚币不够', 'warn');
          addCoin(-price);
          if (id === 'guard') {
            state.guards = (state.guards || 0) + 1;
            toast('已购买保护卡 +1', 'success');
          } else if (id === 'dblexp') {
            state.doubleExpUntil = Date.now() + 30 * 60 * 1000;
            toast('双倍经验已开启 30 分钟', 'success');
          } else if (id === 'coinbonus') {
            state.coinBonusUntil = Date.now() + 30 * 60 * 1000;
            toast('金币加成已开启 30 分钟', 'success');
          }
          saveState();
          renderShop();
        };
      });
      renderIcons();
    }, 0);
  }

  // ===================================================
  // 25. 成就墙
  // ===================================================
  function checkAchievements() {
    if (!state) return;
    var stats = {
      correctCount: state.stats.correct,
      maxCombo: state.stats.maxCombo,
      loginStreak: state.streak,
      subjectCount: Object.keys(state.subjectCorrect).length,
      reviewCount: state.stats.reviews,
      mapClear: state.stats.mapClear,
      speakCount: state.stats.speak,
      postCount: state.stats.post,
      coin: state.coin,
      level: DD.calcLevel(state.exp),
      inviteCount: state.stats.invite,
      totalCount: state.stats.total
    };
    // 合并 subjectCorrect
    stats.subjectCorrect = state.subjectCorrect;
    var newOnes = [];
    DD.ACHIEVEMENTS.forEach(function (a) {
      var unlock = false;
      try { unlock = a.check(stats); } catch (e) { unlock = false; }
      if (unlock && !state.achievements[a.id]) {
        state.achievements[a.id] = { unlocked: true, ts: Date.now(), justUnlocked: true };
        newOnes.push(a);
      }
    });
    saveState();
    // 弹窗（只弹第一个，避免刷屏）
    if (newOnes.length) {
      setTimeout(function () { showAchPop(newOnes[0]); }, 400);
    }
  }
  function showAchPop(a) {
    var m = $('#achModal');
    var b = $('#achBadgeIcon'); if (b) b.innerHTML = '<span data-icon="' + a.icon + '" style="width:48px;height:48px;color:#fff"></span>';
    var n = $('#achModalName'); if (n) n.textContent = a.name;
    var d = $('#achModalDesc'); if (d) d.textContent = a.desc;
    openModal('achModal');
    setTimeout(renderIcons, 0);
  }
  function renderAchievement() {
    var grid = $('#achvGrid');
    if (!grid) return;
    grid.innerHTML = '';
    var total = DD.ACHIEVEMENTS.length;
    var got = 0;
    DD.ACHIEVEMENTS.forEach(function (a) {
      var ok = state.achievements[a.id];
      if (ok) got++;
      var card = document.createElement('div');
      card.className = 'glass';
      card.style.cssText = 'padding:12px;text-align:center;border-radius:12px;opacity:' + (ok ? '1' : '0.5');
      card.innerHTML =
        '<div style="width:48px;height:48px;margin:0 auto 8px;background:linear-gradient(135deg,' + (ok ? '#FFD700,#FFA500' : '#8E8AB0,#5A577A') + ');border-radius:50%;display:flex;align-items:center;justify-content:center">' +
          '<span data-icon="' + a.icon + '" style="width:24px;height:24px;color:#fff" aria-hidden="true"></span>' +
        '</div>' +
        '<div style="font-weight:800;font-size:12px">' + escapeHtml(a.name) + '</div>' +
        '<div style="font-size:10px;color:#8E8AB0;margin-top:2px">' + (ok ? '已解锁' : '未解锁') + '</div>';
      grid.appendChild(card);
    });
    var cnt = $('#achvCount'); if (cnt) cnt.textContent = got + ' / ' + total;
    setTimeout(renderIcons, 0);
  }

  // ===================================================
  // 26. 称号墙
  // ===================================================
  function getCurrentTitle() {
    if (!state.titleEquipped) return null;
    for (var i = 0; i < DD.TITLES.length; i++) if (DD.TITLES[i].id === state.titleEquipped) return DD.TITLES[i];
    return null;
  }
  function renderTitleWall() {
    var cur = $('#ttlCurrent');
    if (cur) {
      var t = getCurrentTitle();
      cur.textContent = t ? t.name : '暂未装备';
    }
    var grid = $('#ttlGrid');
    if (!grid) return;
    grid.innerHTML = '';
    var stats = {
      correctCount: state.stats.correct, maxCombo: state.stats.maxCombo,
      subjectCount: Object.keys(state.subjectCorrect).length,
      subjectCorrect: state.subjectCorrect, level: DD.calcLevel(state.exp),
      totalCount: state.stats.total
    };
    DD.TITLES.forEach(function (t) {
      var unlock = false;
      try { unlock = t.check(stats); } catch (e) {}
      var equipped = state.titleEquipped === t.id;
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'glass';
      card.style.cssText = 'padding:12px;text-align:left;border-radius:12px;width:100%;display:block;cursor:' + (unlock ? 'pointer' : 'not-allowed') + ';opacity:' + (unlock ? '1' : '0.5');
      if (equipped) card.style.borderColor = '#7C5CFF';
      card.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<div style="width:36px;height:36px;background:linear-gradient(135deg,#7C5CFF,#FF5CAE);border-radius:10px;display:flex;align-items:center;justify-content:center">' +
            '<span data-icon="' + t.icon + '" style="width:18px;height:18px;color:#fff" aria-hidden="true"></span>' +
          '</div>' +
          '<div style="flex:1">' +
            '<div style="font-weight:800;font-size:13px">' + escapeHtml(t.name) + '</div>' +
            '<div style="font-size:11px;color:#8E8AB0">' + escapeHtml(t.desc) + '</div>' +
            '<div style="font-size:10px;color:#5A577A;margin-top:2px">条件：' + escapeHtml(t.condition || '') + '</div>' +
          '</div>' +
        '</div>' +
        (unlock ? '<div style="margin-top:8px;text-align:center;color:#7C5CFF;font-size:12px;font-weight:800">' + (equipped ? '已装备' : '点击装备') + '</div>' : '<div style="margin-top:8px;text-align:center;color:#8E8AB0;font-size:12px">未解锁</div>');
      if (unlock) {
        card.onclick = function () {
          state.titleEquipped = (state.titleEquipped === t.id) ? '' : t.id;
          saveState();
          renderTitleWall();
          toast(equipped ? '已卸下称号' : '已装备称号', 'success');
        };
      }
      grid.appendChild(card);
    });
    setTimeout(renderIcons, 0);
  }

  // ===================================================
  // 27. 学习报告
  // ===================================================
  var reportPeriod = 'week';
  function renderReport() {
    $$('.report-tab').forEach(function (b) {
      var p = b.getAttribute('data-period');
      b.classList.toggle('active', p === reportPeriod);
      b.classList.toggle('btn-ghost', p !== reportPeriod);
      b.onclick = function () { reportPeriod = p; renderReport(); };
    });
    var today = new Date();
    var fromDate = new Date(today);
    fromDate.setDate(today.getDate() - (reportPeriod === 'week' ? 6 : 29));
    var total = 0, correct = 0, bySub = {};
    for (var d = new Date(fromDate); d <= today; d.setDate(d.getDate() + 1)) {
      var k = dateKey(d);
      var rec = state.calendar[k];
      if (!rec) continue;
      total += rec.total || 0;
      correct += rec.correct || 0;
      if (rec.bySub) {
        for (var sk in rec.bySub) {
          bySub[sk] = (bySub[sk] || 0) + rec.bySub[sk];
        }
      }
    }
    var ratio = total ? Math.round(correct / total * 100) : 0;
    // 环形图
    var donut = $('#donutChart');
    if (donut) {
      var r = 70, c2 = 2 * Math.PI * r;
      var len = (ratio / 100) * c2;
      donut.innerHTML =
        '<svg width="180" height="180" viewBox="0 0 180 180" aria-label="正确率 ' + ratio + '%">' +
          '<defs><linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#7C5CFF"/><stop offset="100%" stop-color="#FF5CAE"/>' +
          '</linearGradient></defs>' +
          '<circle cx="90" cy="90" r="' + r + '" class="donut-track"/>' +
          '<circle cx="90" cy="90" r="' + r + '" class="donut-fill" stroke-dasharray="' + len + ' ' + c2 + '"/>' +
        '</svg>' +
        '<div class="donut-center"><div class="donut-value">' + ratio + '%</div><div class="donut-label">正确率</div></div>';
    }
    var rs = $('#reportStats');
    if (rs) {
      rs.innerHTML =
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">' +
          '<div class="glass" style="padding:12px;text-align:center"><div style="font-weight:800;font-size:18px">' + total + '</div><div style="font-size:11px;color:#8E8AB0">总答题</div></div>' +
          '<div class="glass" style="padding:12px;text-align:center"><div style="font-weight:800;font-size:18px;color:#2ECC71">' + correct + '</div><div style="font-size:11px;color:#8E8AB0">答对</div></div>' +
          '<div class="glass" style="padding:12px;text-align:center"><div style="font-weight:800;font-size:18px;color:#FF5E5E">' + (total - correct) + '</div><div style="font-size:11px;color:#8E8AB0">答错</div></div>' +
        '</div>';
    }
    // 柱状图
    var bar = $('#barChart');
    if (bar) {
      bar.innerHTML = '';
      var maxV = 1;
      for (var s in bySub) if (bySub[s] > maxV) maxV = bySub[s];
      DD.SUBJECTS.forEach(function (sub) {
        var v = bySub[sub.id] || 0;
        var h = Math.max(4, (v / maxV) * 130);
        var it = document.createElement('div');
        it.className = 'bar-item';
        it.innerHTML =
          '<div class="bar-value">' + v + '</div>' +
          '<div class="bar" style="height:' + h + 'px"></div>' +
          '<div class="bar-label">' + sub.name + '</div>';
        bar.appendChild(it);
      });
    }
    // AI 周报总结按钮
    var aiBtn = $('#btn-report-ai');
    if (aiBtn && !aiBtn.dataset.init) {
      aiBtn.addEventListener('click', function () {
        var box = $('#reportAiBox');
        if (!box || !window.AI) return;
        aiBtn.disabled = true;
        box.textContent = 'AI 正在总结...';
        box.classList.add('ai-streaming');
        window.AI.summarizeWeek({
          total: total,
          correct: correct,
          ratio: ratio,
          bySub: bySub
        }).then(function (reply) {
          box.textContent = reply;
          box.classList.remove('ai-streaming');
          aiBtn.disabled = false;
        }).catch(function (e) {
          box.textContent = '出错了：' + (e.message || '未知错误');
          box.classList.remove('ai-streaming');
          aiBtn.disabled = false;
        });
      });
      aiBtn.dataset.init = '1';
    }
  }

  // ===================================================
  // 28. 学习日历
  // ===================================================
  var calYear = 2026, calMonth = 6; // 0-indexed
  function renderCalendar() {
    var now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();
    drawCalendar();
  }
  function drawCalendar() {
    var title = $('#calMonth');
    if (title) title.textContent = calYear + '-' + pad2(calMonth + 1);
    var grid = $('#heatmap');
    if (!grid) return;
    grid.innerHTML = '';
    var firstDay = new Date(calYear, calMonth, 1).getDay();
    var lastDate = new Date(calYear, calMonth + 1, 0).getDate();
    var total = firstDay + lastDate;
    for (var i = 0; i < total; i++) {
      if (i < firstDay) {
        var blank = document.createElement('div');
        grid.appendChild(blank);
        continue;
      }
      var day = i - firstDay + 1;
      var k = calYear + '-' + pad2(calMonth + 1) + '-' + pad2(day);
      var rec = state.calendar[k];
      var lvl = 0;
      if (rec) {
        if (rec.total >= 20) lvl = 4;
        else if (rec.total >= 10) lvl = 3;
        else if (rec.total >= 5) lvl = 2;
        else if (rec.total > 0) lvl = 1;
      }
      var cell = document.createElement('div');
      cell.className = 'heat-cell';
      cell.setAttribute('data-level', String(lvl));
      cell.title = k + ' · ' + (rec ? rec.total + ' 题' : '无学习');
      cell.addEventListener('click', function () {
        var detail = $('#calDetail');
        if (!detail) return;
        if (rec) {
          detail.style.display = 'block';
          detail.innerHTML =
            '<div style="font-weight:800">' + k + '</div>' +
            '<div style="font-size:13px;color:#5A577A;margin-top:4px">答题：' + (rec.total || 0) + ' · 正确：' + (rec.correct || 0) + '</div>';
        } else {
          detail.style.display = 'block';
          detail.innerHTML = '<div style="font-weight:800">' + k + '</div><div style="font-size:13px;color:#8E8AB0;margin-top:4px">这天没有学习</div>';
        }
      });
      grid.appendChild(cell);
    }
  }
  function bindCalendar() {
    var p = $('#cal-prev'), n = $('#cal-next');
    if (p) p.addEventListener('click', function () {
      calMonth--;
      if (calMonth < 0) { calMonth = 11; calYear--; }
      drawCalendar();
    });
    if (n) n.addEventListener('click', function () {
      calMonth++;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      drawCalendar();
    });
  }

  // ===================================================
  // 29. 班级
  // ===================================================
  var MATE_NAMES = ['小亮', '小红', '小华', '小丽', '小强', '小芳', '小明', '小华'];
  function generateClassmates(count) {
    var arr = [];
    for (var i = 0; i < count; i++) {
      arr.push({
        name: MATE_NAMES[i % MATE_NAMES.length] + (i >= MATE_NAMES.length ? Math.floor(i / MATE_NAMES.length + 1) : ''),
        score: Math.floor(Math.random() * 500) + 100,
        isMe: false
      });
    }
    arr.push({ name: state.name, score: state.stats.correct * 5 + state.exp, isMe: true });
    arr.sort(function (a, b) { return b.score - a.score; });
    return arr;
  }
  function renderClass() {
    var code = state.classCode || '';
    var name = $('#clsName');
    var meta = $('#clsMeta');
    var rank = $('#rankList');
    if (!code) {
      if (name) name.textContent = '未加入班级';
      if (meta) meta.textContent = '输入 6 位班级码加入';
      if (rank) rank.innerHTML = '';
      return;
    }
    if (name) name.textContent = '班级 ' + code;
    if (meta) meta.textContent = '12 位同学';
    if (rank) {
      rank.innerHTML = '';
      var list = generateClassmates(11);
      list.forEach(function (m, i) {
        var div = document.createElement('div');
        div.className = 'rank-item';
        if (m.isMe) div.style.background = 'linear-gradient(135deg, rgba(124,92,255,.15), rgba(255,92,174,.05))';
        var noCls = 'rank-no';
        if (i === 0) noCls += ' gold';
        else if (i === 1) noCls += ' silver';
        else if (i === 2) noCls += ' bronze';
        var medal = i < 3 ? ['🥇','🥈','🥉'][i] : (i + 1);
        div.innerHTML =
          '<div class="' + noCls + '">' + medal + '</div>' +
          '<div class="rank-info"><div class="rank-name">' + (m.isMe ? '我（' + m.name + '）' : escapeHtml(m.name)) + '</div>' +
          '<div class="rank-meta">积分 ' + m.score + '</div></div>' +
          '<div class="rank-score">' + m.score + '</div>';
        rank.appendChild(div);
      });
    }
  }
  function bindClass() {
    var btn = $('#btn-class-join');
    if (btn) {
      btn.addEventListener('click', function () {
        var code = ($('#class-code').value || '').trim().toUpperCase();
        if (code.length !== 6) return toast('请输入 6 位班级码', 'warn');
        state.classCode = code;
        saveState();
        toast('已加入班级 ' + code, 'success');
        renderClass();
      });
    }
  }

  // ===================================================
  // 30. 心情日记
  // ===================================================
  function renderMood() {
    var emoji = $('#moodEmoji');
    var tl = $('#moodTimeline');
    if (!tl) return;
    if (emoji && !emoji.dataset.cur) emoji.dataset.cur = '😊';
    // 表情按钮
    $$('.mood-btn').forEach(function (b) {
      b.style.cssText = 'font-size:32px;background:#F0EEFF;border-radius:50%;width:48px;height:48px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid transparent';
      b.onclick = function () {
        $$('.mood-btn').forEach(function (x) { x.style.borderColor = 'transparent'; });
        b.style.borderColor = '#7C5CFF';
        var m = b.getAttribute('data-mood');
        emoji.textContent = m;
        emoji.dataset.cur = m;
      };
    });
    // 时间线
    var moods = (state.mood || []).slice().sort(function (a, b) { return b.ts - a.ts; });
    if (!moods.length) {
      tl.innerHTML = '<div style="padding:12px;color:#8E8AB0">还没有记录，先写一条吧～</div>';
      return;
    }
    tl.innerHTML = '';
    moods.forEach(function (m) {
      var div = document.createElement('div');
      div.className = 'mood-item';
      div.innerHTML =
        '<div class="mood-date">' + new Date(m.ts).toLocaleString() + '</div>' +
        '<div class="mood-text"><span class="mood-emoji-sm">' + escapeHtml(m.emoji) + '</span> ' + escapeHtml(m.text) + '</div>';
      tl.appendChild(div);
    });
  }
  function bindMood() {
    var save = $('#btn-mood-save');
    if (save) {
      save.addEventListener('click', function () {
        var e = $('#moodEmoji').dataset.cur || '😊';
        var t = ($('#mood-text').value || '').trim();
        if (!state.mood) state.mood = [];
        state.mood.push({ emoji: e, text: t, ts: Date.now() });
        saveState();
        $('#mood-text').value = '';
        toast('心情已记录', 'success');
        renderMood();
      });
    }
    // AI 回应
    var aiBtn = $('#btn-mood-ai');
    if (aiBtn && !aiBtn.dataset.init) {
      aiBtn.addEventListener('click', function () {
        var e = $('#moodEmoji').dataset.cur || '😊';
        var t = ($('#mood-text').value || '').trim();
        if (!t) { toast('先写点东西吧～', 'warn'); return; }
        if (!window.AI) return;
        var box = $('#moodAiBox');
        if (box) {
          box.style.display = 'block';
          box.textContent = 'AI 正在回应...';
          box.classList.add('ai-streaming');
        }
        aiBtn.disabled = true;
        window.AI.respondMood(t, e).then(function (reply) {
          if (box) {
            box.textContent = reply;
            box.classList.remove('ai-streaming');
          }
          aiBtn.disabled = false;
        }).catch(function (err) {
          if (box) {
            box.textContent = '出错了：' + (err.message || '未知错误');
            box.classList.remove('ai-streaming');
          }
          aiBtn.disabled = false;
        });
      });
      aiBtn.dataset.init = '1';
    }
  }

  // ===================================================
  // 31. 设置
  // ===================================================
  function renderSettings() {
    applyTheme();
    applyFontSize();
    // AI 入口卡状态
    if (typeof _refreshAiEntryStatus === 'function') _refreshAiEntryStatus();
    var tt = $('#themeToggle');
    if (tt) {
      $$('.theme-btn', tt).forEach(function (b) {
        b.onclick = function () { setTheme(b.getAttribute('data-theme')); };
      });
    }
    var fc = $('#fsControl');
    if (fc) {
      $$('.fs-btn', fc).forEach(function (b) {
        b.onclick = function () { setFontSize(parseInt(b.getAttribute('data-fs'), 10)); };
      });
    }
    var z = $('#set-zoom');
    if (z && !z.dataset.init) {
      z.addEventListener('input', function () { setZoom(parseInt(z.value, 10)); });
      z.dataset.init = '1';
    }
    var clr = $('#btn-clear-data');
    if (clr) {
      clr.onclick = function () {
        confirmDialog('清空数据', '这将清空所有账号、学习记录等数据，无法恢复。确定吗？', function () {
          try {
            localStorage.removeItem(ACCOUNTS_KEY);
            localStorage.removeItem(CURRENT_KEY);
            localStorage.removeItem(POSTS_KEY);
            // 清空每日任务缓存
            var keys = [];
            for (var i = 0; i < localStorage.length; i++) {
              var k = localStorage.key(i);
              if (k && k.indexOf('dd_day_') === 0) keys.push(k);
            }
            keys.forEach(function (k) { localStorage.removeItem(k); });
          } catch (e) {}
          state = null;
          toast('数据已清空', 'success');
          go('welcome');
        });
      };
    }
    var lo = $('#btn-logout');
    if (lo) {
      lo.onclick = function () {
        confirmDialog('退出登录', '确定要退出当前账号吗？', function () {
          try { localStorage.removeItem(CURRENT_KEY); } catch (e) {}
          state = null;
          toast('已退出', 'success');
          go('welcome');
        });
      };
    }
  }

  // ===================================================
  // 31.5 AI 老师设置
  // ===================================================
  function renderAiSettings() {
    if (!window.AI) return;
    var cfg = window.AI.loadConfig();
    var en = $('#aiEnabled');
    var url = $('#aiBaseUrl');
    var key = $('#aiApiKey');
    var model = $('#aiModel');
    var temp = $('#aiTemp');
    var tempVal = $('#aiTempVal');
    var pm = $('#aiParentMode');
    if (en) en.checked = !!cfg.enabled;
    if (url) url.value = cfg.baseUrl || '';
    if (key) key.value = cfg.apiKey || '';
    if (model) model.value = cfg.model || '';
    if (temp) {
      var t = typeof cfg.temperature === 'number' ? cfg.temperature : 0.5;
      temp.value = t;
      if (tempVal) tempVal.textContent = t.toFixed(1);
    }
    if (pm) pm.checked = !!cfg.parentMode;
    // 人设高亮
    _highlightPersona(cfg.persona);
    // 入口卡状态
    _refreshAiEntryStatus();
    // 渲染图标
    setTimeout(renderIcons, 0);
    // 绑定事件（带 init 标记，多次调用安全）
    if (typeof bindAiSettings === 'function') bindAiSettings();
  }

  function _highlightPersona(p) {
    $$('#aiPersonaGrid .persona-card').forEach(function (c) {
      c.classList.toggle('active', c.getAttribute('data-persona') === p);
    });
  }

  function _refreshAiEntryStatus() {
    var el = $('#aiEntryStatus');
    if (!el || !window.AI) return;
    if (window.AI.hasRealAI()) {
      el.textContent = 'AI 模式 · ' + (window.AI.config.model || '已配置');
      el.style.color = '#2ECC71';
    } else if (window.AI.config && window.AI.config.parentMode) {
      el.textContent = '家长模式已开启（使用本地）';
      el.style.color = '#FFB84A';
    } else {
      el.textContent = '本地模式 · 点击配置';
      el.style.color = '#5A577A';
    }
  }

  function bindAiSettings() {
    if (!window.AI) return;
    // 温度
    var temp = $('#aiTemp');
    if (temp && !temp.dataset.init) {
      temp.addEventListener('input', function () {
        var v = parseFloat(temp.value);
        var tv = $('#aiTempVal');
        if (tv) tv.textContent = v.toFixed(1);
      });
      temp.dataset.init = '1';
    }
    // 人设选择
    $$('#aiPersonaGrid .persona-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var p = card.getAttribute('data-persona');
        _highlightPersona(p);
        if (window.AI && window.AI.config) {
          window.AI.config.persona = p;
          window.AI.saveConfig(window.AI.config);
        }
        _refreshAiEntryStatus();
      });
    });
    // API Key 显示/隐藏
    var toggle = $('#aiApiKeyToggle');
    if (toggle && !toggle.dataset.init) {
      toggle.addEventListener('click', function () {
        var k = $('#aiApiKey');
        if (k) k.type = (k.type === 'password') ? 'text' : 'password';
      });
      toggle.dataset.init = '1';
    }
    // 启用 AI
    var en = $('#aiEnabled');
    if (en && !en.dataset.init) {
      en.addEventListener('change', function () {
        var cfg = window.AI.loadConfig();
        cfg.enabled = en.checked;
        window.AI.saveConfig(cfg);
        _refreshAiEntryStatus();
      });
      en.dataset.init = '1';
    }
    // 家长模式
    var pm = $('#aiParentMode');
    if (pm && !pm.dataset.init) {
      pm.addEventListener('change', function () {
        var cfg = window.AI.loadConfig();
        cfg.parentMode = pm.checked;
        window.AI.saveConfig(cfg);
        _refreshAiEntryStatus();
      });
      pm.dataset.init = '1';
    }
    // 测试连接
    var t = $('#btnAiTest');
    if (t && !t.dataset.init) {
      t.addEventListener('click', function () {
        // 先保存当前输入
        var cfg = {
          enabled: $('#aiEnabled') ? $('#aiEnabled').checked : false,
          baseUrl: ($('#aiBaseUrl') && $('#aiBaseUrl').value || '').trim(),
          apiKey: ($('#aiApiKey') && $('#aiApiKey').value || '').trim(),
          model: ($('#aiModel') && $('#aiModel').value || '').trim() || 'deepseek-chat',
          temperature: parseFloat(($('#aiTemp') && $('#aiTemp').value) || '0.5'),
          persona: (window.AI.config && window.AI.config.persona) || 'gentle',
          parentMode: $('#aiParentMode') && $('#aiParentMode').checked
        };
        window.AI.saveConfig(cfg);
        var result = $('#aiTestResult');
        if (result) {
          result.className = 'test-result loading';
          result.innerHTML = '<span class="dot dot-load"></span> 正在测试连接...';
        }
        t.disabled = true;
        window.AI.testConnection().then(function (r) {
          t.disabled = false;
          if (!result) return;
          if (r.ok) {
            result.className = 'test-result success';
            result.innerHTML = '<span class="dot dot-ok"></span> ' + r.msg;
          } else {
            result.className = 'test-result fail';
            result.innerHTML = '<span class="dot dot-err"></span> ' + r.msg;
          }
        });
      });
      t.dataset.init = '1';
    }
    // 保存
    var s = $('#btnAiSave');
    if (s && !s.dataset.init) {
      s.addEventListener('click', function () {
        var cfg = {
          enabled: $('#aiEnabled') ? $('#aiEnabled').checked : false,
          baseUrl: ($('#aiBaseUrl') && $('#aiBaseUrl').value || '').trim(),
          apiKey: ($('#aiApiKey') && $('#aiApiKey').value || '').trim(),
          model: ($('#aiModel') && $('#aiModel').value || '').trim() || 'deepseek-chat',
          temperature: parseFloat(($('#aiTemp') && $('#aiTemp').value) || '0.5'),
          persona: (window.AI.config && window.AI.config.persona) || 'gentle',
          parentMode: $('#aiParentMode') && $('#aiParentMode').checked
        };
        window.AI.saveConfig(cfg);
        _refreshAiEntryStatus();
        if (typeof toast === 'function') toast('AI 配置已保存', 'success');
      });
      s.dataset.init = '1';
    }
    // 清除
    var cl = $('#btnAiClear');
    if (cl && !cl.dataset.init) {
      cl.addEventListener('click', function () {
        if (typeof confirmDialog === 'function') {
          confirmDialog('清除配置', '确定要清除 AI 配置吗？这会删除保存的 API Key。', function () {
            window.AI.clearConfig();
            renderAiSettings();
            if (typeof toast === 'function') toast('已清除', 'success');
          });
        } else {
          if (window.confirm('确定要清除 AI 配置吗？')) {
            window.AI.clearConfig();
            renderAiSettings();
          }
        }
      });
      cl.dataset.init = '1';
    }
  }

  // ===================================================
  // 32. AI 助手
  // ===================================================
  /**
   * 调用 AI 回复
   * @param {string} text 用户输入
   * @param {object} ctx { subject, question, etc. }
   * @returns {Promise<string>}
   */
  function aiReply(text, ctx) {
    ctx = ctx || {};
    if (!window.AI) return Promise.resolve('AI 模块未加载');
    var persona = window.AI.config ? window.AI.config.persona : 'gentle';
    var subject = ctx.subject || '';
    var sys = window.AI.buildSystemPrompt({ persona: persona, subject: subject });
    var messages = [
      { role: 'system', content: sys },
      { role: 'user', content: text }
    ];
    return window.AI.chat(messages, ctx);
  }

  /** 创建 AI 聊天气泡（支持流式更新） */
  function appendAiMsg(text, from) {
    var h = $('#aiHistory');
    if (!h) return null;
    var div = document.createElement('div');
    div.className = 'ai-msg ai-msg-' + (from || 'ai');
    div.style.cssText = 'padding:8px 12px;border-radius:12px;margin-bottom:8px;max-width:80%;white-space:pre-wrap;word-break:break-word;line-height:1.55;' +
      (from === 'me' ? 'background:#7C5CFF;color:#fff;margin-left:auto' : 'background:#F0EEFF;color:#1F1D3A');
    div.textContent = text || '';
    h.appendChild(div);
    h.scrollTop = h.scrollHeight;
    return div;
  }

  /** 切换"打字中"光标 */
  function setAiMsgStreaming(div, on) {
    if (!div) return;
    div.classList.toggle('ai-streaming', !!on);
  }

  function bindAI() {
    var float = $('#floatAi');
    var header = $('#btnAi');
    function openAI() {
      var h = $('#aiHistory');
      if (h && !h.children.length) appendAiMsg('你好！我是 AI 老师，有什么可以帮你的？', 'ai');
      openModal('aiModal');
      setTimeout(function () { $('#ai-input').focus(); }, 100);
    }
    if (float) float.addEventListener('click', openAI);
    if (header) header.addEventListener('click', openAI);
    var send = $('#btn-ai-send');
    var input = $('#ai-input');
    function doSend() {
      var v = (input.value || '').trim();
      if (!v) return;
      appendAiMsg(v, 'me');
      input.value = '';
      var aiMsg = appendAiMsg('', 'ai');
      setAiMsgStreaming(aiMsg, true);
      aiReply(v).then(function (reply) {
        setAiMsgStreaming(aiMsg, false);
        if (aiMsg) aiMsg.textContent = reply;
        var h = $('#aiHistory'); if (h) h.scrollTop = h.scrollHeight;
      }).catch(function (e) {
        setAiMsgStreaming(aiMsg, false);
        if (aiMsg) aiMsg.textContent = '出错了：' + (e.message || '未知错误');
      });
    }
    if (send) send.addEventListener('click', doSend);
    if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSend(); });
  }

  /**
   * AI 题目讲解（流式追加到指定元素）
   * @param {object} q 题目
   * @param {string} containerSel 容器选择器
   * @param {object} opts { subject, autoStart: true }
   */
  function aiExplainInto(q, containerSel, opts) {
    opts = opts || {};
    var el = typeof containerSel === 'string' ? $(containerSel) : containerSel;
    if (!el) return;
    if (window.AI && window.AI.hasRealAI() && window.AI.chatStream) {
      var persona = window.AI.config.persona;
      var subject = opts.subject || (q && q.subject) || 'general';
      var sys = window.AI.buildSystemPrompt({ persona: persona, subject: subject });
      var userText = '请讲解这道题：\n' +
        '题目：' + (q.q || '') + '\n' +
        '选项：' + (q.opts ? q.opts.map(function (o, i) { return (i + 1) + '. ' + o; }).join(' / ') : '（无）') + '\n' +
        '正确答案：' + (q.opts && typeof q.a === 'number' ? q.opts[q.a] : '（无）') + '\n' +
        (q.exp ? '已有提示：' + q.exp + '\n' : '') +
        '\n请：1) 解释考查的知识点；2) 给出详细解题思路；3) 教孩子怎么想到答案。' +
        '回答不超过 400 字。';
      var messages = [
        { role: 'system', content: sys },
        { role: 'user', content: userText }
      ];
      el.textContent = '';
      el.classList.add('ai-streaming');
      var full = '';
      window.AI.chatStream(messages, {
        onChunk: function (chunk) {
          full += chunk;
          el.textContent = full;
        },
        onDone: function () {
          el.classList.remove('ai-streaming');
        },
        onError: function (e) {
          el.classList.remove('ai-streaming');
          el.textContent = '讲解失败：' + e.message;
        }
      }).catch(function (e) {
        el.classList.remove('ai-streaming');
        el.textContent = '讲解失败：' + (e.message || '未知错误');
      });
    } else {
      // 走 chat 接口（本地兜底）
      el.textContent = '正在讲解...';
      window.AI.explainQuestion(q, opts).then(function (text) {
        el.textContent = text;
      }).catch(function (e) {
        el.textContent = '讲解失败：' + (e.message || '未知错误');
      });
    }
  }

  // ===================================================
  // 33. 等级 / 经验 / 金币
  // ===================================================
  function addExp(n) {
    if (!n) return;
    state.exp = (state.exp || 0) + n;
    var newLv = DD.calcLevel(state.exp);
    var oldLv = state.level || 1;
    if (newLv > oldLv) {
      state.level = newLv;
      setTimeout(function () { showLevelUp(newLv); }, 600);
    }
    saveState();
  }
  function addCoin(n) {
    if (!n) return;
    state.coin = (state.coin || 0) + n;
    saveState();
    renderTopbar();
  }
  function showLevelUp(n) {
    var el = $('#levelUpNum'); if (el) el.textContent = n;
    openModal('levelUpModal');
  }

  // ===================================================
  // 34. 标记活动 / 每日任务 / 错题入 calendar
  // ===================================================
  function markActive() {
    if (!state) return;
    var t = todayStr();
    if (state.lastActiveDate === t) return;
    var prev = state.lastActiveDate;
    state.lastActiveDate = t;
    // 连胜
    if (prev) {
      var d1 = new Date(prev);
      var d2 = new Date(t);
      var diff = Math.round((d2 - d1) / 86400000);
      if (diff === 1) {
        state.streak = (state.streak || 0) + 1;
      } else if (diff > 1) {
        if ((state.guards || 0) > 0) {
          state.guards--;
          // 保护卡生效
        } else {
          state.streak = 1;
        }
      }
    } else {
      state.streak = 1;
    }
    saveState();
  }
  function recordQuiz(q, correct) {
    var t = todayStr();
    if (!state.calendar[t]) state.calendar[t] = { total: 0, correct: 0, bySub: {} };
    state.calendar[t].total++;
    if (correct) state.calendar[t].correct++;
    state.calendar[t].bySub[q.subject] = (state.calendar[t].bySub[q.subject] || 0) + 1;
  }
  function updateDailyTask(name) {
    var tasks = DD.makeDailyTasks();
    var found = tasks.filter(function (t) { return t.name.indexOf(name) >= 0; })[0];
    if (found && !found.done) {
      found.current++;
      if (found.current >= found.target) { found.done = true; addCoin(found.reward.coin); addExp(found.reward.exp); }
      try { localStorage.setItem('dd_day_' + new Date().toDateString(), JSON.stringify(tasks)); } catch (e) {}
    }
  }

  // ===================================================
  // 35. 7 天评分提示
  // ===================================================
  function maybeRatePrompt() {
    if (!state || state.ratePrompted) return;
    var created = state.createdAt || Date.now();
    if (Date.now() - created < 7 * 86400000) return;
    if (state.stats.total < 30) return;
    state.ratePrompted = true;
    saveState();
    setTimeout(function () {
      confirmDialog('喜欢叮咚学吗？', '你已经学习 7 天啦，给我们打个分吧！', function () {
        toast('感谢支持！', 'success');
      });
    }, 1500);
  }

  // ===================================================
  // 36. 绑定全局事件
  // ===================================================
  function bindGlobal() {
    // data-go 链接
    document.body.addEventListener('click', function (e) {
      var t = e.target.closest('[data-go]');
      if (t) {
        e.preventDefault();
        var v = t.getAttribute('data-go');
        go(v);
        return;
      }
      var c = e.target.closest('[data-close]');
      if (c) {
        e.preventDefault();
        closeModal(c.getAttribute('data-close'));
        return;
      }
    });
    // 关闭模态
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        ['aiModal', 'achModal', 'levelUpModal', 'confirmModal', 'tbModal'].forEach(function (id) { closeModal(id); });
      }
    });
    // 顶部按钮
    var sb = $('#btnSettings');
    if (sb) sb.addEventListener('click', function () { go('settings'); });
    // 浏览器返回
    window.addEventListener('popstate', function () { onHashChange(); });
    // 主题切换按钮（快速切换）
    var tb = $('#btnTheme');
    if (tb) {
      tb.addEventListener('click', function () {
        var cur = (state && state.settings.theme) || 'auto';
        var next = cur === 'light' ? 'dark' : cur === 'dark' ? 'auto' : 'light';
        setTheme(next);
        toast('主题：' + (next === 'auto' ? '跟随系统' : next === 'dark' ? '深色' : '浅色'));
      });
    }
    var fb = $('#btnFont');
    if (fb) {
      fb.addEventListener('click', function () {
        var cur = (state && state.settings.fs) || 2;
        var next = (cur + 1) % 4;
        setFontSize(next);
        toast('字号已切换');
      });
    }
  }

  // ===================================================
  // 37. 答题页交互绑定
  // ===================================================
  function bindQuiz() {
    var ask = $('#btn-ask-ai');
    if (ask) ask.addEventListener('click', function () {
      if (!quizCtx) return;
      var q = quizCtx.list[quizCtx.cur];
      if (!q) return;
      openModal('aiModal');
      var h = $('#aiHistory');
      if (h) h.innerHTML = '';
      var qBox = document.createElement('div');
      qBox.className = 'ai-msg';
      qBox.style.cssText = 'padding:10px 12px;border-radius:12px;margin-bottom:8px;background:#F0EEFF;color:#5A577A;font-size:12px;line-height:1.5';
      qBox.textContent = '题目：' + q.q;
      h.appendChild(qBox);
      var aiMsg = appendAiMsg('', 'ai');
      setAiMsgStreaming(aiMsg, true);
      aiExplainInto(q, aiMsg, { subject: q.subject });
    });
    var dk = $('#btn-dont-know');
    if (dk) dk.addEventListener('click', function () {
      if (!quizCtx || quizCtx._answered) return;
      var q = quizCtx.list[quizCtx.cur];
      var opts = $('#quizOptions');
      if (opts) {
        var btns = $$('.opt-btn', opts);
        if (btns[q.a]) btns[q.a].classList.add('correct');
      }
      quizCtx._answered = true;
      quizCtx.wrong++;
      quizCtx.combo = 0;
      state.stats.wrong++; state.stats.total++;
      addWrong(q);
      quizCtx.wrongList.push(q);
      recordQuiz(q, false);
      updateDailyTask('完成');
      var nb = $('#btn-next'); if (nb) nb.disabled = false;
    });
    var nx = $('#btn-next');
    if (nx) nx.addEventListener('click', function () {
      if (!quizCtx) return;
      var q = quizCtx.list[quizCtx.cur];
      if (q) recordQuiz(q, quizCtx._answered && quizCtx.combo > 0);
      nextQuestion('quiz');
    });
    var fv = $('#btn-fav');
    if (fv) fv.addEventListener('click', function () {
      if (!quizCtx) return;
      var q = quizCtx.list[quizCtx.cur];
      if (q) toggleFav(q);
      var ft = $('#fav-text');
      if (ft) {
        var isFav = state.favorites.some(function (f) { return f.id === q.id; });
        ft.textContent = isFav ? '已收藏' : '收藏';
      }
    });
    var pnx = $('#btn-pq-next');
    if (pnx) pnx.addEventListener('click', function () {
      if (!quizCtx) return;
      var q = quizCtx.list[quizCtx.cur];
      if (q) recordQuiz(q, quizCtx._answered && quizCtx.combo > 0);
      nextQuestion('paper-quiz');
    });
  }

  // ===================================================
  // 38. 启动
  // ===================================================
  function bootstrap() {
    // 渲染所有图标
    renderIcons();
    // 加载状态
    state = loadState();
    // 绑定
    bindAuth();
    bindProfile();
    bindHome();
    bindPost();
    bindQuiz();
    bindAI();
    bindCalendar();
    bindClass();
    bindMood();
    bindGlobal();
    // 主题 / 字号
    applyTheme();
    applyFontSize();
    // hash 路由
    var hash = window.location.hash.replace('#', '');
    if (hash && ROUTES[hash]) _showView(hash);
    else _showView(state ? 'home' : 'welcome');
    // 标记活动
    if (state) markActive();
    // 检查成就
    if (state) checkAchievements();
    // 7 天评分
    setTimeout(maybeRatePrompt, 3000);
  }

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
