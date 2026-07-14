/**
 * pet.js - 福结宠物（拟人化盘长结精灵）
 *
 * 职责：全局常驻，用头顶气泡播报加分/连击/成就/完成事件，
 *       支持点击对话、拖拽移动、情绪状态机、喂食抚摸与亲密度养成。
 * 依赖：store.js（loadPetData/savePetData）、app.js（AppState, showToast）
 */
(function (global) {
  'use strict';

  /* ==================== 状态 ==================== */
  var Pet = {};
  var state = {
    data: null,           // 持久化数据
    mood: 'idle',
    moodTimer: null,      // 情绪回退计时
    idleTimer: null,      // idle → sleepy 计时
    tick: null,           // setInterval 句柄
    container: null,
    char: null,
    bubble: null,
    intimacyVal: null,
    announceQueue: [],
    bubbleTimer: null,
    drag: { active: false, moved: false, startX: 0, startY: 0, offX: 0, offY: 0 }
  };

  /* ==================== 文案池 ==================== */
  var LINES = {
    finish: [
      '{name} 织成啦！你真了不起',
      '大功告成！{name} 已就绪',
      '一枚 {name}，因你而生',
      '{name} 完成，非遗又添传承',
      '太棒了！{name} 跃然指尖'
    ],
    achievement: [
      '成就解锁！继续探索吧',
      '又解锁一枚徽章，厉害！',
      '你的匠心被见证了！',
      '徽章入手，再接再厉~'
    ],
    welcomeHome: [
      '欢迎回来~想学哪个绳结？',
      '福结相伴，今日想织什么？',
      '指尖生花，从挑一个绳结开始吧',
      '我在这里等你很久啦~'
    ],
    welcomeProcess: [
      '开始织造咯，我陪你一步步来',
      '深呼吸，跟着步骤慢慢来~',
      '别急，每一步我都看着你呢',
      '这次一定能织出美美的绳结！'
    ],
    chatLow: [
      '你好呀~我是福结精灵',
      '绳结之美，在于耐心',
      '红线千匝，福意万重',
      '慢慢来，我陪你',
      '指尖的温度，是匠心的开始',
      '想织个结送人吗？',
      '我静静守在这里就好',
      '福结相伴，匠心传承'
    ],
    chatMid: [
      '老朋友又来啦~',
      '今日的绳结，想从何处起？',
      '看你织得越来越顺手了',
      '红线绕绕，福气到我家',
      '别熬夜太晚哦，要注意休息',
      '你的指尖越来越灵巧了'
    ],
    chatHigh: [
      '挚友！今天的你也闪闪发光',
      '与你一同织结，是我最开心的事',
      '你已是匠人啦，我为你骄傲',
      '福结因你而生动',
      '千结万结，都不如咱们的默契'
    ],
    petted: [
      '嗯~好舒服',
      '再摸摸我嘛',
      '你的手好温暖',
      '呼噜呼噜~'
    ],
    fed: [
      '好吃！谢谢~',
      '你真好！',
      '吃饱了有力气陪你织结啦',
      '这是我最爱的点心！'
    ],
    cooldown: [
      '我现在还不饿~',
      '等会儿再喂我吧',
      '刚刚才吃过呢',
      '别急嘛，让我歇歇'
    ],
    sleepy: [
      '我打个盹儿…',
      '困了…你继续，我看着',
      '呼…好困…'
    ]
  };

  /* ==================== 亲密度等级 ==================== */
  function getLevel(v) {
    if (v >= 100) return 4; // 知己
    if (v >= 70) return 3;  // 挚友
    if (v >= 40) return 2;  // 伙伴
    if (v >= 20) return 1;  // 相识
    return 0;               // 陌生人
  }

  /* ==================== 工具 ==================== */
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function fill(tpl, data) {
    return tpl.replace(/\{(\w+)\}/g, function (_, k) { return data[k] != null ? data[k] : ''; });
  }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  /* ==================== DOM 构建 ==================== */
  function buildDOM() {
    var c = document.createElement('div');
    c.id = 'petContainer';
    c.innerHTML =
      '<div class="pet-intimacy-badge">亲密度 <b id="petIntimacyVal">0</b></div>' +
      '<div class="pet-bubble" id="petBubble"></div>' +
      '<div class="pet-char mood-idle" id="petCharacter">' +
        '<div class="pet-body">' +
          '<div class="pet-knot-pattern"></div>' +
          '<div class="pet-face">' +
            '<div class="pet-eye pet-eye-l"></div>' +
            '<div class="pet-eye pet-eye-r"></div>' +
            '<div class="pet-mouth"></div>' +
            '<div class="pet-blush pet-blush-l"></div>' +
            '<div class="pet-blush pet-blush-r"></div>' +
          '</div>' +
          '<div class="pet-arm pet-arm-l" data-action="feed" title="喂食"></div>' +
          '<div class="pet-arm pet-arm-r" data-action="feed" title="喂食"></div>' +
        '</div>' +
        '<div class="pet-shadow"></div>' +
      '</div>';
    document.body.appendChild(c);

    state.container = c;
    state.char = c.querySelector('#petCharacter');
    state.bubble = c.querySelector('#petBubble');
    state.intimacyVal = c.querySelector('#petIntimacyVal');

    // 应用存档位置
    if (state.data.position) {
      c.style.right = 'auto';
      c.style.bottom = 'auto';
      c.style.left = state.data.position.x + 'px';
      c.style.top = state.data.position.y + 'px';
    }
  }

  /* ==================== 情绪状态机 ==================== */
  var MOODS = ['idle', 'happy', 'excited', 'sleepy', 'petted'];
  function setMood(mood, duration) {
    state.mood = mood;
    MOODS.forEach(function (m) { state.char.classList.remove('mood-' + m); });
    state.char.classList.add('mood-' + mood);

    clearTimeout(state.moodTimer);
    clearTimeout(state.idleTimer);

    if (mood !== 'idle' && mood !== 'sleepy' && duration) {
      state.moodTimer = setTimeout(function () { setMood('idle'); }, duration);
    }
    if (mood === 'idle') {
      // 20s 无操作 → sleepy
      state.idleTimer = setTimeout(function () {
        setMood('sleepy');
        if (Math.random() < 0.5) showBubble(pick(LINES.sleepy));
      }, 20000);
    } else if (mood === 'sleepy') {
      // sleepy 也算空闲，保持监听
      state.idleTimer = setTimeout(function () {
        if (Math.random() < 0.4) showBubble(pick(LINES.sleepy));
      }, 15000);
    }
  }

  function poke() {
    // 用户有操作时从 sleepy 唤醒
    if (state.mood === 'sleepy') setMood('idle');
    else if (state.mood === 'idle') {
      clearTimeout(state.idleTimer);
      state.idleTimer = setTimeout(function () {
        setMood('sleepy');
        if (Math.random() < 0.5) showBubble(pick(LINES.sleepy));
      }, 20000);
    }
  }

  /* ==================== 气泡队列 ==================== */
  function showBubble(html) {
    state.announceQueue.push(html);
    flushQueue();
  }

  function flushQueue() {
    if (state.bubbleTimer || state.announceQueue.length === 0) return;
    var html = state.announceQueue.shift();
    state.bubble.innerHTML = html;
    state.bubble.classList.remove('out');
    state.bubble.classList.add('show');

    state.bubbleTimer = setTimeout(function () {
      state.bubble.classList.remove('show');
      state.bubble.classList.add('out');
      state.bubbleTimer = setTimeout(function () {
        state.bubbleTimer = null;
        flushQueue();
      }, 280);
    }, 2800);
  }

  /* ==================== 播报 API ==================== */
  Pet.announce = function (type, data) {
    data = data || {};
    var html = '';
    switch (type) {
      case 'xp':
        if (data.combo >= 2) {
          html += '<div class="bubble-combo">' + data.combo + ' 连击</div>';
        }
        html += '<div class="bubble-xp">+' + data.xpEarned + ' XP</div>';
        // 情绪：连击≥3 兴奋，≥2 开心
        if (data.combo >= 3) setMood('excited', 4000);
        else if (data.combo >= 2) setMood('happy', 3000);
        else setMood('happy', 2500);
        showBubble(html);
        return;
      case 'finish':
        html = fill(pick(LINES.finish), { name: data.name || '绳结' });
        setMood('excited', 5000);
        showBubble(html);
        return;
      case 'achievement':
        html = pick(LINES.achievement);
        setMood('happy', 4000);
        showBubble(html);
        return;
      case 'welcome':
        if (data.page === 'process') html = pick(LINES.welcomeProcess);
        else html = pick(LINES.welcomeHome);
        setMood('happy', 2500);
        showBubble(html);
        return;
      case 'idle':
        html = pick(LINES.chatLow);
        showBubble(html);
        return;
    }
  };

  Pet.setMood = function (mood, duration) { setMood(mood, duration); };
  Pet.show = function () { state.container.classList.remove('pet-hidden'); };
  Pet.hide = function () { state.container.classList.add('pet-hidden'); };

  /* ==================== 亲密度 ==================== */
  Pet.addIntimacy = function (n) {
    var d = state.data;
    var today = todayStr();
    if (d.todayDate !== today) {
      d.todayDate = today;
      d.todayIntimacy = 0;
    }
    var DAILY_CAP = 50;
    if (d.todayIntimacy >= DAILY_CAP) return false;
    var add = Math.min(n, DAILY_CAP - d.todayIntimacy);
    d.intimacy = Math.min(100, d.intimacy + add);
    d.todayIntimacy += add;
    savePetData(d);
    refreshIntimacy();
    return true;
  };

  function refreshIntimacy() {
    if (state.intimacyVal) state.intimacyVal.textContent = state.data.intimacy;
  }

  /* ==================== 互动：喂食 / 抚摸+对话 ==================== */
  function tryFeed() {
    poke();
    var now = Date.now();
    var COOLDOWN = 10000;
    if (now - state.data.lastFeedTime < COOLDOWN) {
      state.char.classList.add('shake');
      setTimeout(function () { state.char.classList.remove('shake'); }, 400);
      showBubble(pick(LINES.cooldown));
      return;
    }
    state.data.lastFeedTime = now;
    var ok = Pet.addIntimacy(3);
    savePetData(state.data);
    setMood('happy', 2200);
    showBubble(ok ? pick(LINES.fed) : '今天吃太多啦~明天再喂我吧');
  }

  /* 点击身体 = 抚摸 + 对话（合一）：每次显示对话台词，3秒冷却内不加亲密度 */
  function patAndChat() {
    poke();
    var now = Date.now();
    var COOLDOWN = 3000;
    if (now - state.data.lastPetTime >= COOLDOWN) {
      state.data.lastPetTime = now;
      Pet.addIntimacy(1);
      savePetData(state.data);
    }
    setMood('petted', 2000);
    var lv = getLevel(state.data.intimacy);
    var pool = lv >= 3 ? LINES.chatHigh : (lv >= 1 ? LINES.chatMid : LINES.chatLow);
    showBubble(pick(pool));
  }

  /* ==================== 拖拽 ==================== */
  function onPointerDown(e) {
    var pt = getPoint(e);
    state.drag.active = true;
    state.drag.moved = false;
    state.drag.startX = pt.x;
    state.drag.startY = pt.y;
    var rect = state.container.getBoundingClientRect();
    state.drag.offX = pt.x - rect.left;
    state.drag.offY = pt.y - rect.top;
    state.char.classList.add('dragging');
    // 仅对鼠标事件 preventDefault（防止文本选择）；触摸事件保留默认以允许 click 合成
    if (e.type === 'mousedown' && e.preventDefault) e.preventDefault();
  }

  function onPointerMove(e) {
    if (!state.drag.active) return;
    var pt = getPoint(e);
    var dx = pt.x - state.drag.startX;
    var dy = pt.y - state.drag.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) state.drag.moved = true;

    var x = pt.x - state.drag.offX;
    var y = pt.y - state.drag.offY;
    // 边界约束
    var w = state.container.offsetWidth;
    var h = state.container.offsetHeight;
    x = Math.max(4, Math.min(window.innerWidth - w - 4, x));
    y = Math.max(4, Math.min(window.innerHeight - h - 4, y));

    state.container.style.right = 'auto';
    state.container.style.bottom = 'auto';
    state.container.style.left = x + 'px';
    state.container.style.top = y + 'px';
    if (e.preventDefault) e.preventDefault();
  }

  function onPointerUp(e) {
    if (!state.drag.active) return;
    state.drag.active = false;
    state.char.classList.remove('dragging');

    if (state.drag.moved) {
      // 持久化位置
      var rect = state.container.getBoundingClientRect();
      state.data.position = { x: rect.left, y: rect.top };
      savePetData(state.data);
    }
    // 未拖拽时的点击交由 click 事件处理（patAndChat / tryFeed）
  }

  function getPoint(e) {
    if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  /* ==================== 事件绑定 ==================== */
  function bindEvents() {
    // 角色拖拽（mousedown/touchstart 在 .pet-char 上）
    state.char.addEventListener('mousedown', onPointerDown);
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);
    state.char.addEventListener('touchstart', onPointerDown, { passive: false });
    document.addEventListener('touchmove', onPointerMove, { passive: false });
    document.addEventListener('touchend', onPointerUp);

    // 手臂喂食（阻止冒泡，避免触发身体对话）
    var arms = state.container.querySelectorAll('.pet-arm');
    arms.forEach(function (arm) {
      arm.addEventListener('click', function (e) {
        e.stopPropagation();
        if (state.drag.moved) return;
        tryFeed();
      });
    });

    // 身体点击 = 抚摸 + 对话（拖拽过则忽略）
    state.char.addEventListener('click', function (e) {
      if (e.target.classList.contains('pet-arm')) return; // 手臂已处理
      if (state.drag.moved) return;
      patAndChat();
    });
  }

  /* ==================== 初始化 ==================== */
  Pet.init = function () {
    if (state.container) return; // 防止重复初始化
    state.data = loadPetData();
    buildDOM();
    refreshIntimacy();
    bindEvents();
    setMood('idle');

    // 启动心跳（500ms）
    state.tick = setInterval(function () {
      // 这里可扩展：周期性 idle 台词等
    }, 500);

    // 首次进入欢迎
    setTimeout(function () {
      Pet.announce('welcome', { page: global.AppState && AppState.currentView === 'process' ? 'process' : 'home' });
    }, 600);

    return Pet;
  };

  global.Pet = Pet;

})(window);
