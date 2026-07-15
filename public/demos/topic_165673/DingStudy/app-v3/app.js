/* =====================================================
 *  叮咚学 v3 · 交互主逻辑 (app.js)
 *  纯前端 / ES5 语法 / IIFE 模块化
 *  依赖：window.DD (data.js) + window.ICONS (icons.js) + styles.css
 *  v3 引擎：window.World / window.Script / window.WrongBook / window.Adaptive / window.AI
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
      createdAt: Date.now(),
      /* ---- v3 新增 ---- */
      avatarFrame: '',
      v3Theme: 'glass',
      ownedThemes: { glass: true },
      ownedFrames: {},
      worldData: null,
      scripts: [],
      adaptiveHistory: [],
      wallpaper: 'grad-sunset',
      uiStyle: 'fluent'
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
    'wrongbook-v2': { auth: true,  render: renderWrongBook },
    'favorites':   { auth: true,  render: renderFavorites },
    'square':      { auth: true,  render: renderSquare },
    'post':        { auth: true,  render: renderPost },
    'library':     { auth: true,  render: renderLibrary },
    'dict':        { auth: true,  render: renderDict },
    'paper':       { auth: true,  render: renderPaper },
    'paper-quiz':  { auth: true,  render: renderPaperQuiz },
    'textbook-recite': { auth: true,  render: renderTextbook },
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
    'ai-settings': { auth: true,  render: renderAiSettings },
    /* ---- v3 新路由 ---- */
    'park':             { auth: true, render: renderPark },
    'park-shop':        { auth: true, render: renderParkShop },
    'park-visit':       { auth: true, render: renderParkVisit },
    'script-editor':    { auth: true, render: renderScriptEditor },
    'script-play':      { auth: true, render: renderScriptPlay },
    'script-rank':      { auth: true, render: renderScriptRank },
    'wrongbook':        { auth: true, render: renderWrongBookV3 },
    'wrongbook-detail': { auth: true, render: renderWrongDetail },
    'wrongbook-analysis':{ auth: true, render: renderWrongAnalysis },
    'wrongbook-camera': { auth: true, render: renderWrongBookCamera },
    'adaptive':         { auth: true, render: renderAdaptiveSetup },
    'boss':             { auth: true, render: renderBoss },
    'pathmap':          { auth: true, render: renderPathMap },
    'textbook':         { auth: true, render: renderTextbookNav },
    'textbook-read':    { auth: true, render: renderTextbookRead },
    'profile-v3':       { auth: true, render: renderProfileV3 },
    'shop-v3':          { auth: true, render: renderShopV3 },
    'achwall':          { auth: true, render: renderAchievement },
    'titlewall':        { auth: true, render: renderTitleWall },
    'wallpaper':        { auth: true, render: renderWallpaper },
    'ui-style':         { auth: true, render: renderUIStyle }
  };

  function _showView(viewName) {
    if (!ROUTES[viewName]) viewName = 'home';
    var route = ROUTES[viewName];
    if (route.auth && !state) {
      viewName = 'welcome';
      route = ROUTES[viewName];
    }
    currentView = viewName;
    $$('.view').forEach(function (v) {
      v.classList.remove('active');
      // 清理所有动画类，避免残留
      v.classList.remove('view-enter', 'slide-from-right', 'slide-from-bottom', 'scale-in');
    });
    var target = document.getElementById('view-' + viewName);
    if (target) {
      target.classList.add('active');
      // Fluent 2 页面切换动画（"从哪来回哪去"）
      var mainTabs = ['home', 'park', 'square', 'library'];
      if (mainTabs.indexOf(viewName) >= 0) {
        // 主 tab 页面：用默认淡入（.view 自带的 viewEnter 动画）
        target.style.animation = '';
      } else {
        // 子页面：从右侧滑入
        target.classList.add('slide-from-right');
      }
      // 强制重排以重启动画
      void target.offsetWidth;
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
    // tabbar 显隐与高亮
    var tabbar = document.querySelector('.tabbar');
    var mainTabs = ['home', 'park', 'square', 'library'];
    if (tabbar) {
      if (mainTabs.indexOf(viewName) >= 0) {
        tabbar.classList.remove('hidden');
        $$('.tabbar .tab').forEach(function (t) {
          t.classList.toggle('active', t.getAttribute('data-tab') === viewName);
        });
      } else {
        tabbar.classList.add('hidden');
      }
    }
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
        else if (t === 'park') go('park');
        else if (t === 'square') go('square');
        else if (t === 'subjects') go('subjects');
        else if (t === 'library') go('library');
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
      // v3: 自动收集到错题本引擎
      if (window.WrongBook) {
        try { WrongBook.addFromQuiz(q, idx, q.subject); } catch (e) {}
      }
      // 屏幕摇晃
      document.body.classList.add('shake');
      setTimeout(function () { document.body.classList.remove('shake'); }, 400);
    }
    // v3: 自适应会话提交
    if (window.Adaptive && Adaptive.getSessionStats && Adaptive.getSessionStats()) {
      try {
        var adpResult = Adaptive.submitAnswer(q.id, idx);
        if (adpResult && adpResult.over) { showAdaptiveResult(); }
      } catch (e) {}
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
    // 自适应模式结算
    if (ctx.mode === 'adaptive' && window.Adaptive && Adaptive.finishSession) {
      Adaptive.finishSession();
    }
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
        var attachLabel = p.attach === 'map' ? '我的地图' : p.attach === 'app' ? '我的应用' : p.attach === 'script' ? '我的剧本' : p.attach === 'world' ? '我的世界' : p.attach;
        attach = '<div style="font-size:12px;color:#7C5CFF;margin-top:4px">📎 ' + attachLabel + '</div>';
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
        '<option value="app">我的应用</option>' +
        '<option value="script">我的剧本</option>' +
        '<option value="world">我的世界</option>';
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
  // 37. v3 引擎初始化
  // ===================================================
  function initV3Engines() {
    if (!state) return;
    // Script 引擎
    if (window.Script && Script.config) {
      Script.config({
        getCoin: function () { return state.coin; },
        addCoin: addCoin,
        toast: toast,
        getUser: function () { return state.name; },
        getAvatar: function () { return state.avatar; }
      });
    }
    // Adaptive 引擎
    if (window.Adaptive && Adaptive.config) {
      Adaptive.config({
        getCoin: function () { return state.coin; },
        addCoin: addCoin,
        addExp: addExp,
        toast: toast,
        getUser: function () { return state.name; },
        getState: function () { return state; }
      });
    }
  }

  // ===================================================
  // 38. v3 主题系统
  // ===================================================
  function initTheme() {
    var themeId = (state && state.v3Theme) || 'glass';
    var themes = (DD && DD.THEMES) || [];
    var theme = null;
    for (var i = 0; i < themes.length; i++) {
      if (themes[i].id === themeId) { theme = themes[i]; break; }
    }
    if (theme) applyV3Theme(theme);
  }

  function applyV3Theme(theme) {
    if (!theme) return;
    var root = document.documentElement;
    if (theme.primary) root.style.setProperty('--c-primary', theme.primary);
    if (theme.secondary) root.style.setProperty('--c-secondary', theme.secondary);
    if (theme.accent) root.style.setProperty('--c-accent', theme.accent);
    if (theme.bg) root.style.setProperty('--c-bg', theme.bg);
    if (theme.card) root.style.setProperty('--c-card', theme.card);
    if (theme.text) root.style.setProperty('--c-text', theme.text);
  }

  function selectTheme(themeId) {
    var themes = (DD && DD.THEMES) || [];
    var theme = null;
    for (var i = 0; i < themes.length; i++) {
      if (themes[i].id === themeId) { theme = themes[i]; break; }
    }
    if (!theme) return;
    if (theme.price > 0 && !(state.ownedThemes && state.ownedThemes[themeId])) {
      toast('需要先购买');
      return;
    }
    state.v3Theme = themeId;
    applyV3Theme(theme);
    saveState();
    toast('主题已切换');
  }

  // ===================================================
  // 39. v3 乐园渲染（Task 5-7）
  // ===================================================
  function renderPark() {
    // 优先使用 3D 引擎，降级到 2D
    var container3d = document.getElementById('parkCanvas3d');
    var canvas2d = document.getElementById('parkCanvas');
    var engineOpts = {
      onNotify: function (type, msg) { toast(msg, type); },
      getCoin: function () { return state.coin; },
      spendCoin: function (n) {
        if (state.coin < n) { toast('叮咚币不足！'); return false; }
        state.coin -= n;
        saveState();
        renderTopbar();
        return true;
      },
      onShare: function (post) { publishToSquare(post); }
    };
    if (window.World3D && World3D.init && container3d) {
      // 3D 模式
      container3d.style.display = 'block';
      if (canvas2d) canvas2d.style.display = 'none';
      World3D.init(container3d, engineOpts);
    } else if (window.World && World.init && canvas2d) {
      // 2D 降级模式
      container3d.style.display = 'none';
      canvas2d.style.display = 'block';
      World.init(canvas2d, engineOpts);
    }
    renderSceneSelector();
    renderMaterialBar();
    renderParkToolbar();
  }

  // 统一引擎代理（自动选择 3D 或 2D）
  function parkEngine(method, arg) {
    if (window.World3D && World3D[method]) return World3D[method](arg);
    if (window.World && World[method]) return World[method](arg);
  }

  function renderSceneSelector() {
    var el = $('#sceneSelector');
    if (!el) return;
    var scenes = (DD && DD.PARK_SCENES) || [];
    el.innerHTML = '';
    scenes.forEach(function (s) {
      var card = document.createElement('div');
      card.className = 'scene-card glass';
      card.style.cssText = 'padding:8px;border-radius:12px;cursor:pointer;text-align:center';
      card.innerHTML = '<div style="font-size:32px;margin-bottom:4px">' + (s.icon || '🌍') + '</div>' +
        '<div style="font-size:12px;font-weight:700">' + escapeHtml(s.name) + '</div>';
      card.addEventListener('click', function () {
        parkEngine('setScene', s.id);
        $$('.scene-card').forEach(function (c) { c.classList.remove('active'); });
        card.classList.add('active');
      });
      el.appendChild(card);
    });
  }

  function renderMaterialBar() {
    var el = $('#materialBar');
    if (!el) return;
    var mats = (DD && DD.MATERIALS) || [];
    el.innerHTML = '';
    var categories = {};
    mats.forEach(function (m) {
      var cat = m.category || 'other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(m);
    });
    for (var cat in categories) {
      if (!Object.prototype.hasOwnProperty.call(categories, cat)) continue;
      var section = document.createElement('div');
      section.className = 'mat-section';
      section.innerHTML = '<div style="font-size:11px;color:#8E8AB0;margin:4px 0">' + escapeHtml(cat) + '</div>';
      categories[cat].forEach(function (m) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mat-btn';
        btn.style.cssText = 'padding:4px 8px;border-radius:8px;cursor:pointer;margin:2px';
        btn.innerHTML = (m.icon || '🧱') + ' ' + escapeHtml(m.name);
        btn.addEventListener('click', function () {
          parkEngine('setMaterial', m.id);
        });
        section.appendChild(btn);
      });
      el.appendChild(section);
    }
  }

  function renderParkToolbar() {
    var el = $('.park-toolbar');
    if (!el) return;
    el.innerHTML = '';
    var tools = [
      { id: 'place', icon: '🏗️', label: '放置' },
      { id: 'erase', icon: '🧹', label: '橡皮擦' },
      { id: 'move',  icon: '✋', label: '移动' }
    ];
    tools.forEach(function (t) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'park-tool-btn glass';
      btn.style.cssText = 'padding:6px 10px;border-radius:8px;cursor:pointer';
      btn.innerHTML = t.icon + ' ' + t.label;
      btn.addEventListener('click', function () {
        parkEngine('setMode', t.id);
        $$('.park-tool-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
      el.appendChild(btn);
    });
    // 撤销/重做
    var undo = document.createElement('button');
    undo.type = 'button'; undo.className = 'glass';
    undo.style.cssText = 'padding:6px 10px;border-radius:8px;cursor:pointer;margin-left:8px';
    undo.textContent = '↩ 撤销';
    undo.addEventListener('click', function () { parkEngine('undo'); });
    el.appendChild(undo);
    var redo = document.createElement('button');
    redo.type = 'button'; redo.className = 'glass';
    redo.style.cssText = 'padding:6px 10px;border-radius:8px;cursor:pointer';
    redo.textContent = '↪ 重做';
    redo.addEventListener('click', function () { parkEngine('redo'); });
    el.appendChild(redo);
    // 商店
    var shop = document.createElement('button');
    shop.type = 'button'; shop.className = 'glass';
    shop.style.cssText = 'padding:6px 10px;border-radius:8px;cursor:pointer;margin-left:auto';
    shop.textContent = '🛒 商店';
    shop.addEventListener('click', function () { openParkShop(); });
    el.appendChild(shop);
    // 分享
    var share = document.createElement('button');
    share.type = 'button'; share.className = 'glass';
    share.style.cssText = 'padding:6px 10px;border-radius:8px;cursor:pointer';
    share.textContent = '🔗 分享';
    share.addEventListener('click', function () {
      parkEngine('save');
      if (window.World3D && World3D.getShareCode) {
        var code = World3D.getShareCode();
        publishToSquare({ type: 'world', code: code, author: state.name, time: Date.now() });
        toast('世界已分享到广场！');
      } else if (window.World && World.shareToSquare) {
        World.shareToSquare();
      }
    });
    el.appendChild(share);
  }

  function openParkShop() {
    go('park-shop');
  }

  function renderParkShop() {
    var el = $('#parkShopList');
    if (!el) return;
    var mats = (DD && DD.MATERIALS) || [];
    el.innerHTML = '';
    mats.forEach(function (m) {
      if (!m.price) return;
      var card = document.createElement('div');
      card.className = 'glass';
      card.style.cssText = 'padding:12px;margin-bottom:8px;border-radius:12px;display:flex;align-items:center;gap:8px';
      card.innerHTML =
        '<div style="font-size:28px">' + (m.icon || '🧱') + '</div>' +
        '<div style="flex:1"><div style="font-weight:700">' + escapeHtml(m.name) + '</div>' +
        '<div style="font-size:12px;color:#8E8AB0">' + escapeHtml(m.category || '') + '</div></div>' +
        '<button type="button" class="glass" style="padding:4px 12px;border-radius:8px;cursor:pointer">' +
          '💰 ' + m.price + '</button>';
      var buyBtn = card.querySelector('button');
      buyBtn.addEventListener('click', function () {
        if (state.coin < m.price) { toast('叮咚币不足！'); return; }
        state.coin -= m.price;
        if (window.World && World.buyMaterial) World.buyMaterial(m.id);
        saveState();
        renderTopbar();
        toast('购买成功！', 'success');
      });
      el.appendChild(card);
    });
  }

  function renderParkVisit() {
    // 浏览他人世界（优先 3D）
    var el = $('#parkVisitWrap');
    if (!el) return;
    var postId = currentParams && currentParams.postId;
    if (!postId) { el.innerHTML = '<div class="empty-state">无效链接</div>'; return; }
    // 尝试 3D 浏览
    if (window.World3D && World3D.enterViewOnly) {
      var container3d = document.getElementById('visitCanvas3d') || el;
      World3D.enterViewOnly(container3d, postId);
    } else if (window.World && World.enterViewOnly) {
      var canvas = document.getElementById('visitCanvas');
      if (canvas) World.enterViewOnly(canvas, postId);
    }
  }

  function visitWorld(postId) {
    go('park-visit', { postId: postId });
  }

  // ===================================================
  // 40. v3 剧本系统（Task 8-10）
  // ===================================================
  function openScriptEditor() {
    if (state.coin < 50) { toast('需要 50 叮咚币创建剧本'); return; }
    state.coin -= 50;
    saveState();
    renderTopbar();
    if (window.Script && Script.createNew) Script.createNew();
    go('script-editor');
  }

  function renderScriptEditor() {
    var el = $('#scriptSceneList');
    if (!el) return;
    var scenes = (window.Script && Script._current && Script._current.scenes) || [];
    el.innerHTML = '';
    if (!scenes.length) {
      el.innerHTML = '<div class="empty-state"><div style="font-size:48px">📝</div><div class="empty-title">还没有场景</div><div class="empty-desc">点击下方按钮添加第一个场景</div></div>';
    }
    scenes.forEach(function (s, idx) {
      var card = document.createElement('div');
      card.className = 'glass';
      card.style.cssText = 'padding:12px;margin-bottom:8px;border-radius:12px;cursor:pointer';
      card.innerHTML =
        '<div style="font-weight:700;margin-bottom:4px">场景 ' + (idx + 1) + ': ' + escapeHtml(s.title || '未命名') + '</div>' +
        '<div style="font-size:12px;color:#8E8AB0">' + escapeHtml(s.text || '') + '</div>' +
        '<div style="font-size:11px;color:#7C5CFF;margin-top:4px">' + (s.choices ? s.choices.length : 0) + ' 个选项</div>';
      el.appendChild(card);
    });
    // 添加场景按钮
    var addBtn = $('#btn-add-scene');
    if (addBtn && !addBtn.dataset.v3) {
      addBtn.dataset.v3 = '1';
      addBtn.addEventListener('click', function () { addScriptScene(); });
    }
  }

  function addScriptScene() {
    if (window.Script && Script.addScene) Script.addScene({ title: '新场景', text: '' });
    renderScriptEditor();
  }

  function addScriptChoice(sceneId) {
    if (window.Script && Script.addChoice) Script.addChoice(sceneId, { text: '选项', next: 0 });
    renderScriptEditor();
  }

  function previewScript() {
    if (window.Script && Script._current) {
      playScript(Script._current.id);
    }
  }

  function playScript(scriptId) {
    var script = findScript(scriptId);
    if (!script) { toast('剧本不存在'); return; }
    go('script-play', { scriptId: scriptId });
    if (window.Script && Script.play) {
      Script.play(script, {
        onScene: function (scene) { renderScriptScene(scene); },
        onEnd: function (ending) { renderScriptEnding(ending); },
        onBack: function () { goBack(); }
      });
    }
  }

  function findScript(id) {
    if (window.Script && Script._current && Script._current.id === id) return Script._current;
    for (var i = 0; i < state.scripts.length; i++) {
      if (state.scripts[i].id === id) return state.scripts[i];
    }
    return null;
  }

  function renderScriptPlay() {
    // 播放页面由 Script.play 回调渲染
  }

  function renderScriptScene(scene) {
    var el = $('#scriptPlay');
    if (!el) return;
    el.innerHTML =
      '<div class="glass" style="padding:20px;border-radius:16px">' +
        '<h3 style="margin:0 0 12px">' + escapeHtml(scene.title || '') + '</h3>' +
        '<div style="font-size:15px;line-height:1.6;margin-bottom:16px">' + escapeHtml(scene.text || '') + '</div>' +
        '<div id="scriptChoices"></div>' +
      '</div>';
    var choiceBox = $('#scriptChoices');
    if (choiceBox && scene.choices) {
      scene.choices.forEach(function (c, idx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'glass';
        btn.style.cssText = 'padding:10px 16px;border-radius:10px;cursor:pointer;margin:4px 0;display:block;width:100%;text-align:left';
        btn.textContent = (idx + 1) + '. ' + (c.text || '继续');
        btn.addEventListener('click', function () {
          if (window.Script && Script._choose) Script._choose(idx);
        });
        choiceBox.appendChild(btn);
      });
    }
  }

  function renderScriptEnding(ending) {
    var el = $('#scriptPlay');
    if (!el) return;
    el.innerHTML =
      '<div class="glass" style="padding:24px;border-radius:16px;text-align:center">' +
        '<div style="font-size:48px;margin-bottom:12px">🎭</div>' +
        '<h3 style="margin:0 0 8px">剧终</h3>' +
        '<div style="font-size:15px;color:#8E8AB0">' + escapeHtml(ending || '感谢观看') + '</div>' +
        '<button type="button" class="glass" style="padding:10px 24px;border-radius:10px;cursor:pointer;margin-top:16px" id="btnScriptBack">返回</button>' +
      '</div>';
    var back = $('#btnScriptBack');
    if (back) back.addEventListener('click', function () { goBack(); });
  }

  function likeScript(id) {
    if (window.Script && Script.like) Script.like(id);
    toast('已点赞');
  }

  function collectScript(id) {
    if (window.Script && Script.collect) Script.collect(id);
    toast('已收藏');
  }

  function tipScript(id, amount) {
    if (state.coin < amount) { toast('叮咚币不足！'); return; }
    state.coin -= amount;
    if (window.Script && Script.tip) Script.tip(id, amount);
    saveState();
    renderTopbar();
    toast('投喂成功！');
  }

  function openScriptRank() {
    go('script-rank');
  }

  function renderScriptRank() {
    var el = $('#scriptRankList');
    if (!el) return;
    var ranking = (window.Script && Script.getRanking) ? Script.getRanking() : [];
    el.innerHTML = '';
    if (!ranking.length) {
      el.innerHTML = '<div class="empty-state"><div style="font-size:48px">🏆</div><div class="empty-title">暂无剧本</div></div>';
      return;
    }
    ranking.forEach(function (s, idx) {
      var card = document.createElement('div');
      card.className = 'glass';
      card.style.cssText = 'padding:12px;margin-bottom:8px;border-radius:12px;cursor:pointer';
      card.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<div style="font-size:20px;font-weight:900;color:#7C5CFF">#' + (idx + 1) + '</div>' +
          '<div style="flex:1"><div style="font-weight:700">' + escapeHtml(s.title || '未命名') + '</div>' +
          '<div style="font-size:12px;color:#8E8AB0">by ' + escapeHtml(s.author || '匿名') + ' · 👍 ' + (s.likes || 0) + '</div></div>' +
        '</div>';
      card.addEventListener('click', function () { playScript(s.id); });
      el.appendChild(card);
    });
  }

  // ===================================================
  // 41. v3 错题本（Task 13-15）
  // ===================================================
  function openWrongBookV3() {
    go('wrongbook');
  }

  function renderWrongBookV3() {
    if (!window.WrongBook) return;
    var stats = WrongBook.stats();
    // 更新 HTML 中已有的统计卡元素
    var elTotal = document.getElementById('wbTotal');
    if (elTotal) elTotal.textContent = stats.total || 0;
    var elReview = document.getElementById('wbReview');
    if (elReview) elReview.textContent = stats.due || 0;
    var elMaster = document.getElementById('wbMaster');
    if (elMaster) elMaster.textContent = stats.mastered || 0;
    var items = WrongBook.list({});
    var el = $('#wrongbookListV3');
    if (!el) return;
    // 统计卡
    var statsHtml =
      '<div style="display:flex;gap:8px;margin-bottom:12px">' +
        '<div class="glass" style="flex:1;padding:12px;border-radius:12px;text-align:center">' +
          '<div style="font-size:24px;font-weight:900;color:#FF5CAE">' + (stats.total || 0) + '</div>' +
          '<div style="font-size:11px;color:#8E8AB0">总错题</div></div>' +
        '<div class="glass" style="flex:1;padding:12px;border-radius:12px;text-align:center">' +
          '<div style="font-size:24px;font-weight:900;color:#7C5CFF">' + (stats.mastered || 0) + '</div>' +
          '<div style="font-size:11px;color:#8E8AB0">已掌握</div></div>' +
        '<div class="glass" style="flex:1;padding:12px;border-radius:12px;text-align:center">' +
          '<div style="font-size:24px;font-weight:900;color:#FFB84D">' + (stats.due || 0) + '</div>' +
          '<div style="font-size:11px;color:#8E8AB0">待复习</div></div>' +
      '</div>';
    // 筛选器
    var filterHtml = '<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap" id="wbFilters">' +
      '<button type="button" class="glass wb-filter active" data-filter="all" style="padding:4px 10px;border-radius:8px;cursor:pointer;font-size:12px">全部</button>' +
      '<button type="button" class="glass wb-filter" data-filter="math" style="padding:4px 10px;border-radius:8px;cursor:pointer;font-size:12px">数学</button>' +
      '<button type="button" class="glass wb-filter" data-filter="chinese" style="padding:4px 10px;border-radius:8px;cursor:pointer;font-size:12px">语文</button>' +
      '<button type="button" class="glass wb-filter" data-filter="english" style="padding:4px 10px;border-radius:8px;cursor:pointer;font-size:12px">英语</button>' +
    '</div>';
    // 错题列表
    var listHtml = '<div id="wbCardList">';
    items.forEach(function (item) {
      listHtml +=
        '<div class="glass wb-card" data-id="' + item.id + '" style="padding:12px;margin-bottom:8px;border-radius:12px;cursor:pointer">' +
          '<div style="font-weight:700;margin-bottom:4px">' + escapeHtml(item.q || '') + '</div>' +
          '<div style="font-size:12px;color:#8E8AB0">' + escapeHtml(item.subject || '') + ' · ' + (item.mastery ? '掌握度 ' + item.mastery + '%' : '未复习') + '</div>' +
        '</div>';
    });
    listHtml += '</div>';
    el.innerHTML = statsHtml + filterHtml + listHtml;
    // 卡片点击 → 翻转/详情
    $$('.wb-card', el).forEach(function (card) {
      card.addEventListener('click', function () {
        openWrongDetail(card.getAttribute('data-id'));
      });
    });
    // 筛选器
    $$('.wb-filter', el).forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('.wb-filter', el).forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var f = btn.getAttribute('data-filter');
        var filtered = f === 'all' ? items : items.filter(function (it) { return it.subject === f; });
        var cardList = $('#wbCardList');
        if (!cardList) return;
        cardList.innerHTML = '';
        filtered.forEach(function (item) {
          var c = document.createElement('div');
          c.className = 'glass wb-card';
          c.setAttribute('data-id', item.id);
          c.style.cssText = 'padding:12px;margin-bottom:8px;border-radius:12px;cursor:pointer';
          c.innerHTML =
            '<div style="font-weight:700;margin-bottom:4px">' + escapeHtml(item.q || '') + '</div>' +
            '<div style="font-size:12px;color:#8E8AB0">' + escapeHtml(item.subject || '') + ' · ' + (item.mastery ? '掌握度 ' + item.mastery + '%' : '未复习') + '</div>';
          c.addEventListener('click', function () { openWrongDetail(item.id); });
          cardList.appendChild(c);
        });
      });
    });
  }

  function flipWrongCard(id) {
    var card = document.querySelector('.wb-card[data-id="' + id + '"]');
    if (card) card.classList.toggle('flipped');
  }

  function openWrongDetail(id) {
    go('wrongbook-detail', { wrongId: id });
  }

  function renderWrongDetail() {
    var id = currentParams && currentParams.wrongId;
    if (!id || !window.WrongBook) return;
    var item = WrongBook.get(id);
    var el = $('#wbDetailCard');
    if (!el) return;
    if (!item) { el.innerHTML = '<div class="empty-state">错题不存在</div>'; return; }
    el.innerHTML =
      '<div class="glass" style="padding:16px;border-radius:12px;margin-bottom:12px">' +
        '<h3 style="margin:0 0 8px">' + escapeHtml(item.q || '') + '</h3>' +
        '<div style="font-size:14px;line-height:1.6">' + escapeHtml(item.explanation || '暂无解析') + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px">' +
        '<button type="button" class="glass" id="btnAiExplain" style="padding:8px 16px;border-radius:10px;cursor:pointer">🤖 AI 讲解</button>' +
        '<button type="button" class="glass" id="btnGenVariant" style="padding:8px 16px;border-radius:10px;cursor:pointer">🔄 举一反三</button>' +
        '<button type="button" class="glass" id="btnSetMastery" style="padding:8px 16px;border-radius:10px;cursor:pointer">✅ 标记掌握</button>' +
      '</div>' +
      '<div id="aiExplainBox" style="margin-top:12px"></div>' +
      '<div id="variantBox" style="margin-top:12px"></div>';
    var aiBtn = $('#btnAiExplain');
    if (aiBtn) aiBtn.addEventListener('click', function () { aiExplainWrong(id); });
    var varBtn = $('#btnGenVariant');
    if (varBtn) varBtn.addEventListener('click', function () { generateVariants(id); });
    var mBtn = $('#btnSetMastery');
    if (mBtn) mBtn.addEventListener('click', function () {
      WrongBook.setMastery(id, 100);
      toast('已标记掌握', 'success');
    });
  }

  function aiExplainWrong(id) {
    if (!window.WrongBook) return;
    var box = $('#aiExplainBox');
    if (box) box.innerHTML = '<div style="color:#8E8AB0">🤖 AI 正在讲解...</div>';
    WrongBook.explain(id, {
      onChunk: function (text) {
        if (!box) return;
        box.innerHTML = '<div class="glass" style="padding:12px;border-radius:12px;font-size:14px;line-height:1.6">' + escapeHtml(text) + '</div>';
      },
      onDone: function () {
        if (box) { var hint = document.createElement('div'); hint.style.cssText = 'font-size:11px;color:#8E8AB0;margin-top:4px'; hint.textContent = '讲解完成'; box.appendChild(hint); }
      }
    });
  }

  function generateVariants(id) {
    if (!window.WrongBook) return;
    var box = $('#variantBox');
    if (box) box.innerHTML = '<div style="color:#8E8AB0">🔄 正在生成变式题...</div>';
    WrongBook.generateVariants(id, {
      onDone: function (variants) {
        if (!box) return;
        box.innerHTML = '';
        variants.forEach(function (v, idx) {
          var card = document.createElement('div');
          card.className = 'glass';
          card.style.cssText = 'padding:12px;border-radius:12px;margin-bottom:8px';
          card.innerHTML =
            '<div style="font-weight:700;margin-bottom:4px">变式 ' + (idx + 1) + '</div>' +
            '<div style="font-size:14px;line-height:1.5">' + escapeHtml(v.q || '') + '</div>';
          box.appendChild(card);
        });
      },
      onError: function () {
        if (box) box.innerHTML = '<div style="color:#FF5CAE">生成失败</div>';
        toast('生成失败');
      }
    });
  }

  function openWrongAnalysis() {
    go('wrongbook-analysis');
  }

  function renderWrongAnalysis() {
    if (!window.WrongBook) return;
    var el = $('#wrongAnalysisContent');
    if (!el) return;
    var pie = WrongBook.pieChart();
    var radar = WrongBook.radarChart();
    el.innerHTML =
      '<div class="glass" style="padding:16px;border-radius:12px;margin-bottom:12px">' +
        '<h3 style="margin:0 0 8px">📊 错题分布</h3>' +
        '<div id="pieChartBox" style="text-align:center">' + (pie || '<div style="color:#8E8AB0">暂无数据</div>') + '</div>' +
      '</div>' +
      '<div class="glass" style="padding:16px;border-radius:12px;margin-bottom:12px">' +
        '<h3 style="margin:0 0 8px">🕸️ 能力雷达</h3>' +
        '<div id="radarChartBox" style="text-align:center">' + (radar || '<div style="color:#8E8AB0">暂无数据</div>') + '</div>' +
      '</div>' +
      '<div class="glass" style="padding:16px;border-radius:12px">' +
        '<h3 style="margin:0 0 8px">🤖 AI 分析</h3>' +
        '<div id="aiAnalysisBox" style="color:#8E8AB0">分析中...</div>' +
      '</div>';
    WrongBook.analyze({
      onDone: function (result) {
        var box = $('#aiAnalysisBox');
        if (box) box.innerHTML = '<div style="font-size:14px;line-height:1.6">' + escapeHtml(result.summary || result || '分析完成') + '</div>';
      }
    });
  }

  function renderWrongBookCamera() {
    var el = $('#wrongBookCameraContent');
    if (!el) return;
    el.innerHTML =
      '<div style="text-align:center">' +
        '<video id="cameraVideo" autoplay playsinline style="width:100%;max-width:400px;border-radius:12px;margin-bottom:12px"></video>' +
        '<canvas id="cameraCanvas" style="display:none"></canvas>' +
        '<div style="display:flex;gap:8px;justify-content:center">' +
          '<button type="button" class="glass" id="btnCapture" style="padding:10px 20px;border-radius:10px;cursor:pointer">📸 拍照</button>' +
          '<button type="button" class="glass" id="btnManual" style="padding:10px 20px;border-radius:10px;cursor:pointer">✏️ 手动录入</button>' +
        '</div>' +
        '<div id="ocrResult" style="margin-top:12px"></div>' +
      '</div>';
    startCamera();
    var captureBtn = $('#btnCapture');
    if (captureBtn) captureBtn.addEventListener('click', function () { capturePhoto(); });
    var manualBtn = $('#btnManual');
    if (manualBtn) manualBtn.addEventListener('click', function () { addManualWrong(); });
  }

  function startCamera() {
    var video = document.getElementById('cameraVideo');
    if (!video) return;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(function (stream) { video.srcObject = stream; })
        .catch(function () { toast('无法打开摄像头'); });
    }
  }

  function capturePhoto() {
    var video = document.getElementById('cameraVideo');
    var canvas = document.getElementById('cameraCanvas');
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    var dataUrl = canvas.toDataURL('image/png');
    // AI OCR
    var box = $('#ocrResult');
    if (box) box.innerHTML = '<div style="color:#8E8AB0">🤖 AI 识别中...</div>';
    if (window.AI && AI.ocrQuestion) {
      AI.ocrQuestion(dataUrl).then(function (result) {
        if (box) box.innerHTML = '<div class="glass" style="padding:12px;border-radius:12px;font-size:14px">' + escapeHtml(result.text || result || '识别完成') + '</div>';
        if (window.WrongBook && result) {
          WrongBook.addFromPhoto(result);
          toast('已添加到错题本', 'success');
        }
      }).catch(function () {
        if (box) box.innerHTML = '<div style="color:#FF5CAE">识别失败</div>';
      });
    } else {
      if (box) box.innerHTML = '<div style="color:#8E8AB0">AI 模块未加载</div>';
    }
  }

  function addManualWrong() {
    var box = $('#ocrResult');
    if (!box) return;
    box.innerHTML =
      '<div class="glass" style="padding:12px;border-radius:12px">' +
        '<div style="margin-bottom:8px"><label style="font-size:12px;color:#8E8AB0">题目</label>' +
        '<textarea id="manualQ" style="width:100%;padding:8px;border-radius:8px;border:1px solid #E0DEFF;resize:vertical;min-height:60px"></textarea></div>' +
        '<div style="margin-bottom:8px"><label style="font-size:12px;color:#8E8AB0">学科</label>' +
        '<select id="manualSubject" style="width:100%;padding:8px;border-radius:8px;border:1px solid #E0DEFF">' +
          '<option value="math">数学</option><option value="chinese">语文</option><option value="english">英语</option>' +
        '</select></div>' +
        '<button type="button" class="glass" id="btnAddManual" style="padding:8px 16px;border-radius:10px;cursor:pointer;width:100%">添加</button>' +
      '</div>';
    var addBtn = $('#btnAddManual');
    if (addBtn) addBtn.addEventListener('click', function () {
      var q = ($('#manualQ').value || '').trim();
      var sub = $('#manualSubject').value || 'math';
      if (!q) { toast('请输入题目'); return; }
      if (window.WrongBook) {
        WrongBook.addManual({ q: q, subject: sub });
        toast('已添加', 'success');
      }
    });
  }

  // ===================================================
  // 42. v3 自适应学习（Task 16-17）
  // ===================================================
  function openAdaptive() {
    go('adaptive');
  }

  function renderAdaptiveSetup() {
    var el = $('#adaptiveSetup');
    if (!el) return;
    el.innerHTML =
      '<div class="glass" style="padding:16px;border-radius:12px;margin-bottom:12px">' +
        '<h3 style="margin:0 0 12px">🎯 自适应学习</h3>' +
        '<div style="margin-bottom:8px"><label style="font-size:12px;color:#8E8AB0">学科</label>' +
        '<select id="adpSubject" style="width:100%;padding:8px;border-radius:8px;border:1px solid #E0DEFF">' +
          '<option value="math">数学</option><option value="chinese">语文</option><option value="english">英语</option>' +
        '</select></div>' +
        '<div style="margin-bottom:8px"><label style="font-size:12px;color:#8E8AB0">题数</label>' +
        '<select id="adpCount" style="width:100%;padding:8px;border-radius:8px;border:1px solid #E0DEFF">' +
          '<option value="10">10 题</option><option value="20">20 题</option><option value="30">30 题</option>' +
        '</select></div>' +
        '<div style="margin-bottom:12px"><label style="font-size:12px;color:#8E8AB0">模式</label>' +
        '<div style="display:flex;gap:8px">' +
          '<button type="button" class="glass adp-mode active" data-mode="normal" style="padding:8px 16px;border-radius:10px;cursor:pointer;flex:1">普通</button>' +
          '<button type="button" class="glass adp-mode" data-mode="boss" style="padding:8px 16px;border-radius:10px;cursor:pointer;flex:1">👹 BOSS 战</button>' +
        '</div></div>' +
        '<button type="button" class="glass" id="btnStartAdp" style="padding:10px 20px;border-radius:10px;cursor:pointer;width:100%;font-weight:700">开始学习</button>' +
      '</div>';
    $$('.adp-mode', el).forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('.adp-mode', el).forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });
    var startBtn = $('#btnStartAdp');
    if (startBtn) startBtn.addEventListener('click', function () {
      var subject = $('#adpSubject').value || 'math';
      var count = parseInt($('#adpCount').value, 10) || 10;
      var modeBtn = $('.adp-mode.active', el);
      var mode = modeBtn ? modeBtn.getAttribute('data-mode') : 'normal';
      startAdaptivePaper(subject, count, mode);
    });
  }

  function startAdaptivePaper(subject, count, mode) {
    if (!window.Adaptive) { toast('自适应引擎未加载'); return; }
    toast('正在生成试卷...');
    Adaptive.generatePaper({ subject: subject, count: count }).then(function (paper) {
      if (!paper || !paper.questions || !paper.questions.length) { toast('生成失败'); return; }
      if (mode === 'boss') {
        Adaptive.startBoss(paper);
        go('boss');
      } else {
        Adaptive.startSession(paper);
        quizCtx = {
          list: paper.questions, cur: 0, correct: 0, wrong: 0,
          combo: 0, maxCombo: 0, coinGain: 0, wrongList: [],
          mode: 'adaptive', subject: subject, _answered: false
        };
        go('quiz');
        renderQuizQuestion(paper.questions[0]);
      }
    }).catch(function () { toast('生成失败'); });
  }

  function renderBoss() {
    var el = $('#bossArena');
    if (!el) return;
    if (!window.Adaptive) { el.innerHTML = '<div class="empty-state">引擎未加载</div>'; return; }
    var bossState = Adaptive.getBossState();
    if (!bossState) { el.innerHTML = '<div class="empty-state">BOSS 战未开始</div>'; return; }
    var q = bossState.currentQuestion;
    var hp = bossState.hp || 100;
    var bossHp = bossState.bossHp || 100;
    el.innerHTML =
      '<div style="text-align:center;margin-bottom:12px">' +
        '<div style="font-size:48px;margin-bottom:8px">👹</div>' +
        '<div style="background:#FF5CAE;border-radius:8px;height:8px;margin-bottom:4px"><div style="background:#fff;border-radius:8px;height:100%;width:' + Math.max(0, bossHp) + '%"></div></div>' +
        '<div style="font-size:11px;color:#8E8AB0">BOSS HP: ' + Math.max(0, bossHp) + '%</div>' +
      '</div>' +
      '<div style="margin-bottom:8px">' +
        '<div style="background:#7C5CFF;border-radius:8px;height:6px;margin-bottom:2px"><div style="background:#fff;border-radius:8px;height:100%;width:' + Math.max(0, hp) + '%"></div></div>' +
        '<div style="font-size:11px;color:#8E8AB0">我的 HP: ' + Math.max(0, hp) + '%</div>' +
      '</div>' +
      (q ? '<div class="glass" style="padding:16px;border-radius:12px"><div style="font-weight:700;margin-bottom:12px">' + escapeHtml(q.q || '') + '</div>' +
        '<div id="bossOptions"></div></div>' : '<div class="empty-state">BOSS 战结束！</div>');
    if (q) {
      var optBox = $('#bossOptions');
      (q.opts || []).forEach(function (opt, idx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'glass';
        btn.style.cssText = 'padding:10px;border-radius:10px;cursor:pointer;margin:4px 0;width:100%;text-align:left';
        btn.textContent = String.fromCharCode(65 + idx) + '. ' + opt;
        btn.addEventListener('click', function () { bossAnswer(q.id, idx); });
        optBox.appendChild(btn);
      });
    }
  }

  function bossAnswer(qid, answer) {
    if (!window.Adaptive) return;
    var result = Adaptive.bossAnswer(qid, answer);
    renderBossFeedback(result);
    if (result.over) {
      renderBossResult();
    } else {
      renderBoss();
    }
  }

  function renderBossFeedback(result) {
    if (result.correct) {
      toast('回答正确！攻击 BOSS', 'success');
    } else {
      toast('回答错误！受到伤害', 'warn');
    }
  }

  function renderBossResult() {
    var el = $('#bossArena');
    if (!el) return;
    var bossState = Adaptive.getBossState();
    var won = bossState && bossState.bossHp <= 0;
    el.innerHTML =
      '<div style="text-align:center;padding:24px">' +
        '<div style="font-size:64px;margin-bottom:16px">' + (won ? '🎉' : '💀') + '</div>' +
        '<h2 style="margin:0 0 8px">' + (won ? 'BOSS 击败！' : '挑战失败') + '</h2>' +
        '<div style="font-size:14px;color:#8E8AB0;margin-bottom:16px">' + (won ? '太厉害了！' : '再接再厉！') + '</div>' +
        '<button type="button" class="glass" style="padding:10px 24px;border-radius:10px;cursor:pointer" id="btnBossBack">返回</button>' +
      '</div>';
    var back = $('#btnBossBack');
    if (back) back.addEventListener('click', function () { go('home'); });
  }

  function openPathMap() {
    go('pathmap');
  }

  function renderPathMap() {
    var el = $('#pathmapWrap');
    if (!el) return;
    if (!window.Adaptive) { el.innerHTML = '<div class="empty-state">引擎未加载</div>'; return; }
    var svg = Adaptive.renderPathMapSVG(state.subject || 'math');
    var svgBox = document.getElementById('pathMapSvg');
    if (svgBox) svgBox.innerHTML = svg;
  }

  function startPreLearn(subject, topic) {
    if (!window.Adaptive) return;
    toast('预习开始...');
    Adaptive.startPreLearn(subject, topic);
  }

  function showAdaptiveResult() {
    if (window.Adaptive && Adaptive.finishSession) Adaptive.finishSession();
    toast('自适应学习完成！', 'success');
    go('result');
  }

  // ===================================================
  // 43. v3 教材浏览（Task 11-12）
  // ===================================================
  function openTextbookV3() {
    go('textbook');
  }

  function renderTextbookNav() {
    var el = $('#txUnitList');
    if (!el) return;
    var textbooks = (DD && DD.TEXTBOOKS) || {};
    var grade = (state && state.grade) || 'pre';
    var subjects = ['chinese', 'math', 'english'];
    el.innerHTML =
      '<div style="margin-bottom:12px">' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">';
    subjects.forEach(function (sub) {
      var key = sub + '_' + grade;
      var tb = textbooks[key];
      var icon = sub === 'chinese' ? '📖' : sub === 'math' ? '📐' : '🔤';
      var label = sub === 'chinese' ? '语文' : sub === 'math' ? '数学' : '英语';
      var card = document.createElement('div');
      card.className = 'glass';
      card.style.cssText = 'padding:12px;border-radius:12px;cursor:pointer;flex:1;min-width:100px;text-align:center';
      card.innerHTML = '<div style="font-size:32px;margin-bottom:4px">' + icon + '</div>' +
        '<div style="font-weight:700">' + label + '</div>' +
        '<div style="font-size:11px;color:#8E8AB0">' + (tb ? (tb.units ? tb.units.length : 0) + ' 单元' : '暂无') + '</div>';
      card.addEventListener('click', function () {
        selectTextbookUnit(sub, grade, 0);
      });
      el.appendChild(card);
    });
    el.innerHTML += '</div></div>';
    // 显示默认学科单元列表
    var defaultTb = textbooks[subjects[0] + '_' + grade];
    if (defaultTb && defaultTb.units) {
      renderTextbookUnits(subjects[0], grade, defaultTb);
    }
  }

  function renderTextbookUnits(subject, grade, tb) {
    var el = $('#txUnitList');
    if (!el) return;
    var unitSection = document.createElement('div');
    unitSection.id = 'textbookUnits';
    unitSection.innerHTML = '<h3 style="margin:0 0 8px">单元列表</h3>';
    (tb.units || []).forEach(function (unit, idx) {
      var card = document.createElement('div');
      card.className = 'glass';
      card.style.cssText = 'padding:12px;margin-bottom:8px;border-radius:12px;cursor:pointer';
      card.innerHTML =
        '<div style="font-weight:700">' + escapeHtml(unit.name || '第' + (idx + 1) + '单元') + '</div>' +
        '<div style="font-size:12px;color:#8E8AB0">' + (unit.lessons ? unit.lessons.length : 0) + ' 课文</div>';
      card.addEventListener('click', function () {
        selectTextbookUnit(subject, grade, idx);
      });
      unitSection.appendChild(card);
    });
    // 添加 AI 总结按钮
    var aiBtn = document.createElement('button');
    aiBtn.type = 'button';
    aiBtn.className = 'glass';
    aiBtn.style.cssText = 'padding:8px 16px;border-radius:10px;cursor:pointer;margin-top:8px';
    aiBtn.textContent = '🤖 AI 知识总结';
    aiBtn.addEventListener('click', function () {
      aiSummarizeUnit(subject, grade, 0);
    });
    unitSection.appendChild(aiBtn);
    var existing = document.getElementById('textbookUnits');
    if (existing) existing.remove();
    el.appendChild(unitSection);
  }

  function selectTextbookUnit(subject, grade, unitIdx) {
    var textbooks = (DD && DD.TEXTBOOKS) || {};
    var tb = textbooks[subject + '_' + grade];
    if (!tb || !tb.units || !tb.units[unitIdx]) return;
    var unit = tb.units[unitIdx];
    var el = $('#txUnitList');
    if (!el) return;
    var existing = document.getElementById('textbookLessons');
    if (existing) existing.remove();
    var lessonSection = document.createElement('div');
    lessonSection.id = 'textbookLessons';
    lessonSection.innerHTML = '<h3 style="margin:0 0 8px">' + escapeHtml(unit.name || '单元') + '</h3>';
    (unit.lessons || []).forEach(function (lesson, idx) {
      var card = document.createElement('div');
      card.className = 'glass';
      card.style.cssText = 'padding:12px;margin-bottom:8px;border-radius:12px;cursor:pointer';
      card.innerHTML = '<div style="font-weight:700">' + escapeHtml(lesson.title || '课文') + '</div>';
      card.addEventListener('click', function () {
        openLesson(subject, grade, unitIdx, idx);
      });
      lessonSection.appendChild(card);
    });
    el.appendChild(lessonSection);
  }

  function openLesson(subject, grade, unitIdx, lessonIdx) {
    go('textbook-read', { subject: subject, grade: grade, unitIdx: unitIdx, lessonIdx: lessonIdx });
  }

  function renderTextbookRead() {
    var p = currentParams || {};
    var textbooks = (DD && DD.TEXTBOOKS) || {};
    var tb = textbooks[p.subject + '_' + p.grade];
    var lesson = null;
    if (tb && tb.units && tb.units[p.unitIdx] && tb.units[p.unitIdx].lessons) {
      lesson = tb.units[p.unitIdx].lessons[p.lessonIdx];
    }
    var el = $('#txReadBody');
    if (!el) return;
    if (!lesson) { el.innerHTML = '<div class="empty-state">课文不存在</div>'; return; }
    renderLesson(lesson);
  }

  function renderLesson(lesson) {
    var el = $('#txReadBody');
    if (!el) return;
    el.innerHTML =
      '<div class="glass" style="padding:20px;border-radius:16px;line-height:2;font-size:16px">' +
        '<h2 style="margin:0 0 16px;text-align:center">' + escapeHtml(lesson.title || '') + '</h2>' +
        '<div style="white-space:pre-wrap">' + escapeHtml(lesson.text || lesson.content || '') + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-top:12px;justify-content:center">' +
        '<button type="button" class="glass" id="btnReadSpeak" style="padding:8px 16px;border-radius:10px;cursor:pointer">🔊 朗读</button>' +
        '<button type="button" class="glass" id="btnReadBack" style="padding:8px 16px;border-radius:10px;cursor:pointer">↩ 返回</button>' +
      '</div>';
    var speak = $('#btnReadSpeak');
    if (speak) speak.addEventListener('click', function () { speakText(lesson.text || lesson.content || ''); });
    var back = $('#btnReadBack');
    if (back) back.addEventListener('click', function () { goBack(); });
  }

  function aiSummarizeUnit(subject, grade, unitIdx) {
    var textbooks = (DD && DD.TEXTBOOKS) || {};
    var tb = textbooks[subject + '_' + grade];
    if (!tb || !tb.units || !tb.units[unitIdx]) { toast('单元不存在'); return; }
    var unit = tb.units[unitIdx];
    toast('AI 正在总结...');
    if (window.AI && AI.summarizeTextbook) {
      AI.summarizeTextbook(unit).then(function (result) {
        renderKnowledgeCard(result);
      }).catch(function () { toast('总结失败'); });
    } else {
      toast('AI 模块未加载');
    }
  }

  function renderKnowledgeCard(result) {
    var el = $('#txUnitList');
    if (!el) return;
    var existing = document.getElementById('knowledgeCard');
    if (existing) existing.remove();
    var card = document.createElement('div');
    card.id = 'knowledgeCard';
    card.className = 'glass';
    card.style.cssText = 'padding:16px;border-radius:12px;margin-top:12px';
    card.innerHTML =
      '<h3 style="margin:0 0 8px">🤖 AI 知识总结</h3>' +
      '<div style="font-size:14px;line-height:1.6">' + escapeHtml(result.summary || result || '总结完成') + '</div>';
    el.appendChild(card);
  }

  // ===================================================
  // 44. v3 个性化（Task 18-19）
  // ===================================================
  function openProfileV3() {
    go('profile-v3');
  }

  function renderProfileV3() {
    var el = $('#pv3Content');
    if (!el) return;
    var frame = (state && state.avatarFrame) || '';
    var frames = (DD && DD.AVATAR_FRAMES) || [];
    var currentFrame = null;
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].id === frame) { currentFrame = frames[i]; break; }
    }
    var titleName = '';
    if (typeof getCurrentTitle === 'function') {
      var t = getCurrentTitle();
      titleName = t ? t.name : '初学者';
    }
    el.innerHTML =
      '<div style="text-align:center;margin-bottom:16px">' +
        '<div style="position:relative;display:inline-block">' +
          '<div class="avatar" style="width:80px;height:80px;font-size:48px;background:linear-gradient(135deg,#7C5CFF,#FF5CAE)">' + (state.avatar || '😀') + '</div>' +
          (currentFrame ? '<div style="position:absolute;inset:-4px;border:2px solid ' + (currentFrame.color || '#FFD700') + ';border-radius:50%;pointer-events:none"></div>' : '') +
        '</div>' +
        '<div style="font-weight:900;font-size:18px;margin-top:8px">' + escapeHtml(state.name || '叮咚学员') + '</div>' +
        '<div style="font-size:12px;color:#7C5CFF">' + escapeHtml(titleName) + '</div>' +
        '<div style="font-size:12px;color:#8E8AB0">Lv.' + DD.calcLevel(state.exp) + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:12px">' +
        '<div class="glass" style="flex:1;padding:12px;border-radius:12px;text-align:center"><div style="font-weight:900">' + (state.coin || 0) + '</div><div style="font-size:11px;color:#8E8AB0">叮咚币</div></div>' +
        '<div class="glass" style="flex:1;padding:12px;border-radius:12px;text-align:center"><div style="font-weight:900">' + (state.exp || 0) + '</div><div style="font-size:11px;color:#8E8AB0">经验</div></div>' +
        '<div class="glass" style="flex:1;padding:12px;border-radius:12px;text-align:center"><div style="font-weight:900">' + (state.streak || 0) + '</div><div style="font-size:11px;color:#8E8AB0">连胜</div></div>' +
      '</div>' +
      '<div class="glass" style="padding:12px;border-radius:12px;margin-bottom:8px;cursor:pointer" id="profileMyWorld">' +
        '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:24px">🌍</span><span style="font-weight:700">我的世界</span></div></div>' +
      '<div class="glass" style="padding:12px;border-radius:12px;margin-bottom:8px;cursor:pointer" id="profileMyScripts">' +
        '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:24px">🎭</span><span style="font-weight:700">我的剧本</span></div></div>' +
      '<div class="glass" style="padding:12px;border-radius:12px;margin-bottom:8px;cursor:pointer" id="profileAvatarFrames">' +
        '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:24px">🖼️</span><span style="font-weight:700">头像框</span></div></div>' +
      '<div class="glass" style="padding:12px;border-radius:12px;margin-bottom:8px;cursor:pointer" id="profileThemes">' +
        '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:24px">🎨</span><span style="font-weight:700">主题</span></div></div>' +
      '<div class="glass" style="padding:12px;border-radius:12px;cursor:pointer" id="profileShopV3">' +
        '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:24px">🛒</span><span style="font-weight:700">商店</span></div></div>';
    // 绑定
    var worldBtn = $('#profileMyWorld');
    if (worldBtn) worldBtn.addEventListener('click', function () { go('park'); });
    var scriptBtn = $('#profileMyScripts');
    if (scriptBtn) scriptBtn.addEventListener('click', function () { openScriptRank(); });
    var frameBtn = $('#profileAvatarFrames');
    if (frameBtn) frameBtn.addEventListener('click', function () { showAvatarFramePicker(); });
    var themeBtn = $('#profileThemes');
    if (themeBtn) themeBtn.addEventListener('click', function () { showThemePicker(); });
    var shopBtn = $('#profileShopV3');
    if (shopBtn) shopBtn.addEventListener('click', function () { openShopV3(); });
  }

  function showAvatarFramePicker() {
    var frames = (DD && DD.AVATAR_FRAMES) || [];
    if (!frames.length) { toast('暂无头像框'); return; }
    var el = $('#pv3Content');
    if (!el) return;
    var existing = document.getElementById('framePicker');
    if (existing) existing.remove();
    var picker = document.createElement('div');
    picker.id = 'framePicker';
    picker.className = 'glass';
    picker.style.cssText = 'padding:12px;border-radius:12px;margin-top:12px';
    picker.innerHTML = '<h4 style="margin:0 0 8px">选择头像框</h4>';
    frames.forEach(function (f) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'glass';
      btn.style.cssText = 'padding:6px 12px;border-radius:8px;cursor:pointer;margin:2px';
      btn.innerHTML = (f.icon || '⭕') + ' ' + escapeHtml(f.name);
      btn.addEventListener('click', function () { selectAvatarFrame(f.id); });
      picker.appendChild(btn);
    });
    el.appendChild(picker);
  }

  function selectAvatarFrame(frameId) {
    state.avatarFrame = frameId;
    saveState();
    renderProfileV3();
    toast('头像框已更换');
  }

  function showThemePicker() {
    var themes = (DD && DD.THEMES) || [];
    if (!themes.length) { toast('暂无主题'); return; }
    var el = $('#pv3Content');
    if (!el) return;
    var existing = document.getElementById('themePicker');
    if (existing) existing.remove();
    var picker = document.createElement('div');
    picker.id = 'themePicker';
    picker.className = 'glass';
    picker.style.cssText = 'padding:12px;border-radius:12px;margin-top:12px';
    picker.innerHTML = '<h4 style="margin:0 0 8px">选择主题</h4>';
    themes.forEach(function (t) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'glass';
      btn.style.cssText = 'padding:6px 12px;border-radius:8px;cursor:pointer;margin:2px';
      btn.innerHTML = (t.icon || '🎨') + ' ' + escapeHtml(t.name);
      btn.addEventListener('click', function () { selectTheme(t.id); });
      picker.appendChild(btn);
    });
    el.appendChild(picker);
  }

  function openShopV3() {
    go('shop-v3');
  }

  function renderShopV3() {
    var el = $('#shopV3List');
    if (!el) return;
    var coinEl = $('#sv3Coin');
    if (coinEl) coinEl.textContent = state.coin || 0;
    var tabs = ['材料', '头像框', '主题', '道具'];
    var listEl = $('#shopV3List');
    if (!listEl) return;
    // 默认显示道具
    renderShopV3Category('prop');
    // tab 切换
    $$('.shop-tab-btn').forEach(function (tab) {
      tab.addEventListener('click', function () {
        $$('.shop-tab-btn').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        renderShopV3Category(tab.getAttribute('data-cat') || 'prop');
      });
    });
  }

  function renderShopV3Category(cat) {
    var listEl = $('#shopV3List');
    if (!listEl) return;
    listEl.innerHTML = '';
    var items = [];
    if (cat === 'material') {
      items = (DD && DD.MATERIALS) || [];
      items = items.filter(function (m) { return m.price > 0; });
    } else if (cat === 'frame') {
      items = (DD && DD.AVATAR_FRAMES) || [];
    } else if (cat === 'theme') {
      items = (DD && DD.THEMES) || [];
    } else {
      items = SHOP_ITEMS;
    }
    items.forEach(function (it) {
      var card = document.createElement('div');
      card.className = 'glass';
      card.style.cssText = 'padding:12px;margin-bottom:8px;border-radius:12px;display:flex;align-items:center;gap:8px';
      card.innerHTML =
        '<div style="font-size:28px">' + (it.icon || '🎁') + '</div>' +
        '<div style="flex:1"><div style="font-weight:700">' + escapeHtml(it.name) + '</div>' +
        '<div style="font-size:12px;color:#8E8AB0">' + escapeHtml(it.desc || it.category || '') + '</div></div>' +
        '<button type="button" class="glass" style="padding:4px 12px;border-radius:8px;cursor:pointer">💰 ' + (it.price || 0) + '</button>';
      var buyBtn = card.querySelector('button');
      buyBtn.addEventListener('click', function () { buyShopItem(cat, it.id, it.price || 0); });
      listEl.appendChild(card);
    });
  }

  function buyShopItem(type, id, price) {
    if (state.coin < price) { toast('叮咚币不足！'); return; }
    state.coin -= price;
    if (type === 'material' && window.World && World.buyMaterial) {
      World.buyMaterial(id);
    } else if (type === 'frame') {
      if (!state.ownedFrames) state.ownedFrames = {};
      state.ownedFrames[id] = true;
    } else if (type === 'theme') {
      if (!state.ownedThemes) state.ownedThemes = {};
      state.ownedThemes[id] = true;
    } else if (type === 'prop') {
      // 道具效果
      for (var i = 0; i < SHOP_ITEMS.length; i++) {
        if (SHOP_ITEMS[i].id === id) {
          if (SHOP_ITEMS[i].effect === 'guard') { state.guards = (state.guards || 0) + 1; }
          else if (SHOP_ITEMS[i].effect === 'doubleExp') { state.doubleExpUntil = Date.now() + 30 * 60 * 1000; }
          else if (SHOP_ITEMS[i].effect === 'coinBonus') { state.coinBonusUntil = Date.now() + 30 * 60 * 1000; }
          break;
        }
      }
    }
    saveState();
    renderTopbar();
    toast('购买成功！', 'success');
  }

  // ===================================================
  // 45. v3 广场发布升级
  // ===================================================
  function publishToSquare(post) {
    var posts = getAllPosts();
    post.name = state.name;
    post.avatar = state.avatar;
    post.ts = Date.now();
    posts.unshift(post);
    setAllPosts(posts);
    state.stats.post = (state.stats.post || 0) + 1;
    saveState();
    renderSquare();
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
  // 37.5 壁纸 & 界面风格系统
  // ===================================================

  function applyWallpaper(wp) {
    if (!wp) return;
    var root = document.documentElement;
    var body = document.body;
    if (wp.type === 'gradient') {
      body.style.background = wp.value;
      body.style.backgroundSize = 'cover';
      body.style.backgroundAttachment = 'fixed';
      root.style.setProperty('--app-bg', wp.value);
    } else if (wp.type === 'bing') {
      loadBingWallpaper();
    } else if (wp.type === 'custom' && wp.value) {
      body.style.background = 'url(' + wp.value + ') center/cover no-repeat fixed';
      root.style.setProperty('--app-bg', 'url(' + wp.value + ')');
    }
    if (state) {
      state.wallpaper = wp.id;
      saveState();
    }
  }

  function loadBingWallpaper() {
    // 使用第三方必应壁纸代理（无需 API Key）
    var url = 'https://api.dujin.org/bing/1920.php';
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      document.body.style.background = 'url(' + img.src + ') center/cover no-repeat fixed';
    };
    img.onerror = function () {
      // 备用：直接设置 CSS
      document.body.style.backgroundImage = 'url(' + url + ')';
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundPosition = 'center';
    };
    img.src = url;
  }

  function setUIStyle(styleId) {
    document.documentElement.setAttribute('data-ui-style', styleId);
    if (state) {
      state.uiStyle = styleId;
      saveState();
    }
    toast('界面风格已切换为 ' + styleId);
  }

  function initWallpaperAndStyle() {
    if (!state) return;
    // 恢复界面风格
    if (state.uiStyle) {
      document.documentElement.setAttribute('data-ui-style', state.uiStyle);
    }
    // 恢复壁纸
    if (state.wallpaper) {
      var wps = (window.DD && window.DD.WALLPAPERS) || [];
      var wp = null;
      for (var i = 0; i < wps.length; i++) {
        if (wps[i].id === state.wallpaper) { wp = wps[i]; break; }
      }
      if (wp) applyWallpaper(wp);
    }
  }

  // Fluent Reveal 高亮效果
  document.addEventListener('mousemove', function (e) {
    var els = document.querySelectorAll('.fluent-reveal');
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      els[i].style.setProperty('--mx', (e.clientX - r.left) + 'px');
      els[i].style.setProperty('--my', (e.clientY - r.top) + 'px');
    }
  });

  // 渲染壁纸选择器视图
  function renderWallpaper() {
    if (!state) return;
    var wps = (window.DD && window.DD.WALLPAPERS) || [];
    var currentWp = state.wallpaper || 'grad-sunset';
    var grid = $('#wpGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (var i = 0; i < wps.length; i++) {
      (function (wp) {
        if (wp.type === 'custom') return; // 自定义在单独区域处理
        var div = document.createElement('div');
        div.className = 'wp-item' + (wp.id === currentWp ? ' active' : '');
        if (wp.type === 'gradient') {
          div.style.background = wp.value;
        } else if (wp.type === 'bing') {
          div.style.background = 'linear-gradient(135deg,#1a73e8,#4285f4)';
        }
        div.innerHTML = '<span class="wp-name">' + escapeHtml(wp.name) + '</span>' +
          (wp.price > 0 ? '<span class="wp-price">' + wp.price + ' 币</span>' : '');
        div.setAttribute('role', 'button');
        div.setAttribute('tabindex', '0');
        div.setAttribute('aria-label', wp.name);
        div.style.minHeight = '44px';
        div.addEventListener('click', function () {
          if (wp.price > 0 && state.coin < wp.price) {
            toast('叮咚币不足，需要 ' + wp.price + ' 币', 'warn');
            return;
          }
          if (wp.price > 0) {
            state.coin -= wp.price;
            updateState({ coin: state.coin });
          }
          applyWallpaper(wp);
          renderWallpaper();
          toast('壁纸已应用：' + wp.name, 'success');
        });
        grid.appendChild(div);
      })(wps[i]);
    }
    // 预览
    var preview = $('#wpPreview');
    if (preview) {
      var curWpObj = null;
      for (var j = 0; j < wps.length; j++) {
        if (wps[j].id === currentWp) { curWpObj = wps[j]; break; }
      }
      if (curWpObj && curWpObj.type === 'gradient') {
        preview.style.background = curWpObj.value;
        preview.style.display = '';
      } else {
        preview.style.display = 'none';
      }
    }
    // 自定义上传
    var uploadArea = $('#wpUploadArea');
    var fileInput = $('#wpFileInput');
    if (uploadArea && fileInput) {
      uploadArea.onclick = function () { fileInput.click(); };
      fileInput.onchange = function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
          var customWp = { id: 'custom', name: '自定义图片', type: 'custom', value: ev.target.result, price: 0 };
          applyWallpaper(customWp);
          toast('自定义壁纸已应用', 'success');
          if (preview) {
            preview.style.background = 'url(' + ev.target.result + ') center/cover no-repeat';
            preview.style.display = '';
          }
        };
        reader.readAsDataURL(file);
      };
    }
    // 必应每日壁纸按钮
    var bingBtn = $('#wpBingBtn');
    if (bingBtn) {
      bingBtn.onclick = function () {
        var bingWp = { id: 'bing-daily', name: '每日必应', type: 'bing', value: '', price: 0 };
        applyWallpaper(bingWp);
        toast('正在加载必应每日壁纸…', 'success');
      };
    }
  }

  // 渲染界面风格选择视图
  function renderUIStyle() {
    if (!state) return;
    var styles = (window.DD && window.DD.UI_STYLES) || [];
    var currentStyle = state.uiStyle || 'fluent';
    var grid = $('#uiStyleGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (var i = 0; i < styles.length; i++) {
      (function (st) {
        var div = document.createElement('div');
        div.className = 'style-item' + (st.id === currentStyle ? ' active' : '');
        div.setAttribute('role', 'button');
        div.setAttribute('tabindex', '0');
        div.setAttribute('aria-label', st.name);
        div.innerHTML =
          '<div class="style-preview" style="background:' + (st.previewBg || 'var(--c-bg-2)') + ';border:1px solid var(--c-border)"></div>' +
          '<div class="style-info">' +
            '<div class="style-name">' + escapeHtml(st.name) + '</div>' +
            '<div class="style-desc">' + escapeHtml(st.desc) + '</div>' +
            (st.price > 0 ? '<div class="style-price">' + st.price + ' 叮咚币</div>' : '<div class="style-price" style="color:var(--c-success)">免费</div>') +
          '</div>';
        div.style.minHeight = '44px';
        div.addEventListener('click', function () {
          if (st.price > 0 && state.coin < st.price) {
            toast('叮咚币不足，需要 ' + st.price + ' 币', 'warn');
            return;
          }
          if (st.price > 0 && st.id !== currentStyle) {
            state.coin -= st.price;
            updateState({ coin: state.coin });
          }
          setUIStyle(st.id);
          renderUIStyle();
        });
        grid.appendChild(div);
      })(styles[i]);
    }
  }

  // ===================================================
  // 38. 启动
  // ===================================================
  function bootstrap() {
    // 渲染所有图标
    renderIcons();
    // 加载状态
    state = loadState();
    // v3: 初始化引擎 hooks
    initV3Engines();
    // v3: 主题系统
    initTheme();
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
    // v3: 壁纸 & 界面风格
    initWallpaperAndStyle();
    // 3D 引擎 resize 监听
    window.addEventListener('resize', function () {
      if (window.World3D && World3D.resize) World3D.resize();
    });
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
