/**
 * Pawlo Stories (兔佩洛) — 参赛 Demo 版应用逻辑
 * 面向 3-7 岁孩子的 AI 互动睡前故事
 *
 * 屏幕流程: 落地页 → 设置页 → 故事地图 → 编织过渡 → 故事播放器 → 结局页
 */

(function () {
  'use strict';

  // ==================== 状态管理 ====================
  var state = {
    screen: 'landing',        // landing | setup | map | weave | player | ending
    theme: 'night',           // night | day
    child: { nickname: '', interests: [] },
    stones: 0,
    completed: [],            // 已通关的故事 id
    currentStory: null,       // 当前故事数据
    session: null,            // { beat, nodes, picks, traits, phase }
    quotaMax: 3,
    countedTonight: [],
    lastDate: ''              // 配额按天重置
  };

  // 运行时引用（需要清理）
  var streamTimer = null;     // 流式生成 interval
  var weaveTimer = null;      // 编织过渡 timeout
  var animLeaveTimer = null;  // 页面离场动画 timeout
  var animEnterTimer = null;  // 页面入场动画清理 timeout

  // 兴趣标签
  var INTEREST_CHIPS = [
    { k: 'dinosaur', emoji: '🦕', label: '恐龙' },
    { k: 'space', emoji: '🚀', label: '太空' },
    { k: 'ocean', emoji: '🌊', label: '海洋' },
    { k: 'rainbow', emoji: '🌈', label: '彩虹' },
    { k: 'animal', emoji: '🐰', label: '小动物' },
    { k: 'flower', emoji: '🌸', label: '花朵' },
    { k: 'star', emoji: '⭐', label: '星星' },
    { k: 'music', emoji: '🎵', label: '音乐' }
  ];

  // 品格特质中文标签
  var TRAIT_LABELS = {
    empathy: '同理心', curiosity: '好奇心', courage: '勇气',
    imagination: '想象力', cooperation: '合作', creativity: '创造力', persistence: '坚持'
  };

  var TRAIT_EMOJI = {
    empathy: '💞', curiosity: '🔭', courage: '🦁',
    imagination: '🎨', cooperation: '🤝', creativity: '💡', persistence: '🧗'
  };

  // ==================== 持久化 ====================
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function save() {
    try {
      localStorage.setItem('pawlo-demo', JSON.stringify({
        child: state.child,
        stones: state.stones,
        completed: state.completed,
        theme: state.theme,
        quotaMax: state.quotaMax,
        countedTonight: state.countedTonight,
        lastDate: state.lastDate,
        seen: true
      }));
    } catch (e) {}
  }

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem('pawlo-demo') || '{}');
      if (raw.child) state.child = raw.child;
      if (typeof raw.stones === 'number') state.stones = raw.stones;
      if (Array.isArray(raw.completed)) state.completed = raw.completed;
      if (raw.theme) state.theme = raw.theme;
      if (typeof raw.quotaMax === 'number') state.quotaMax = raw.quotaMax;
      if (Array.isArray(raw.countedTonight)) state.countedTonight = raw.countedTonight;
      if (raw.lastDate) state.lastDate = raw.lastDate;

      // 按天重置配额
      var today = todayStr();
      if (state.lastDate !== today) {
        state.countedTonight = [];
        state.lastDate = today;
        save();
      }

      if (raw.seen && state.child.nickname) state.screen = 'map';
    } catch (e) {}
  }

  // ==================== 清理函数 ====================
  function cleanupTimers() {
    if (streamTimer) { clearInterval(streamTimer); streamTimer = null; }
    if (weaveTimer) { clearTimeout(weaveTimer); weaveTimer = null; }
    if (animLeaveTimer) { clearTimeout(animLeaveTimer); animLeaveTimer = null; }
    if (animEnterTimer) { clearTimeout(animEnterTimer); animEnterTimer = null; }
  }

  function stopSpeech() {
    if ('speechSynthesis' in window && speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
  }

  // ==================== Toast ====================
  function showToast(msg, duration) {
    var existing = document.getElementById('toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);

    // 触发入场动画
    requestAnimationFrame(function () {
      toast.classList.add('show');
    });

    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, duration || 2200);
  }

  // ==================== 工具函数 ====================
  function starsHtml(count) {
    var html = '<div class="stars">';
    for (var i = 0; i < (count || 5); i++) {
      html += '<i style="top:' + (5 + Math.random() * 25) + '%;left:' + (10 + Math.random() * 80) +
        '%;animation-delay:' + (Math.random() * 3).toFixed(1) + 's"></i>';
    }
    html += '</div>';
    return html;
  }

  function firefliesHtml() {
    return '<span class="firefly" style="top:46%;left:14%"></span>' +
      '<span class="firefly" style="top:64%;left:82%;animation-delay:4s"></span>' +
      '<span class="firefly" style="top:80%;left:30%;animation-delay:7.5s"></span>';
  }

  function orbHtml(size) {
    var cls = size === 'sm' ? 's-orb sm' : 's-orb';
    return '<div class="' + cls + '">' +
      '<div class="halo"></div>' +
      '<img src="assets/illustrations/pawlo-bunny.jpg" alt="兔子佩洛">' +
      '</div>';
  }

  function getStory(id) {
    for (var i = 0; i < STORIES.length; i++) {
      if (STORIES[i].id === id) return STORIES[i];
    }
    return null;
  }

  // ==================== 屏幕渲染 ====================
  function render(animate) {
    // 清理定时器和语音
    cleanupTimers();
    stopSpeech();

    var app = document.getElementById('app');
    app.className = 'frame theme-' + state.theme;

    var html = '';
    switch (state.screen) {
      case 'landing':  html = renderLanding(); break;
      case 'setup':    html = renderSetup(); break;
      case 'map':      html = renderMap(); break;
      case 'weave':    html = renderWeave(); break;
      case 'player':   html = renderPlayer(); break;
      case 'ending':   html = renderEnding(); break;
    }

    if (animate) {
      // 带过渡动画的渲染：先清理上一次未完成的动画定时器
      if (animLeaveTimer) { clearTimeout(animLeaveTimer); animLeaveTimer = null; }
      if (animEnterTimer) { clearTimeout(animEnterTimer); animEnterTimer = null; }
      app.classList.add('page-leaving');
      animLeaveTimer = setTimeout(function () {
        animLeaveTimer = null;
        app.innerHTML = html;
        app.classList.remove('page-leaving');
        app.classList.add('page-enter-active');
        bindEvents();
        // 动画结束后清理
        animEnterTimer = setTimeout(function () {
          animEnterTimer = null;
          app.classList.remove('page-enter-active');
        }, 500);
        window.scrollTo(0, 0);
      }, 180);
    } else {
      app.innerHTML = html;
      bindEvents();
      window.scrollTo(0, 0);
    }
  }

  // -------------------- 落地页 --------------------
  function renderLanding() {
    return '<div class="s-screen brand">' +
      starsHtml(6) +
      '<div class="landing" style="padding:60px 30px 36px">' +
        orbHtml() +
        '<h1>每晚，为你的孩子<br>编织一个独一无二的睡前故事</h1>' +
        '<p class="sub">抱着孩子一起读。每页结尾，你们一起做一个温柔的选择，故事就顺着选择实时生长——还会织进孩子的名字和今晚的喜好。</p>' +
        '<div class="props">' +
          '<div class="prop"><div class="ico">🌙</div><div><div class="pt">你们一起选</div><div class="pd">故事顺着选择实时生长</div></div></div>' +
          '<div class="prop"><div class="ico">✨</div><div><div class="pt">织入名字与喜好</div><div class="pd">每一晚都是新故事</div></div></div>' +
          '<div class="prop"><div class="ico">🤝</div><div><div class="pt">只奖励"讲完"</div><div class="pd">永远不给孩子打分</div></div></div>' +
        '</div>' +
        '<p class="trust">🔒 为 3–7 岁设计 · 家长全程主导 · 只保留昵称，绝不收真实身份</p>' +
        '<div class="cta-row">' +
          '<button class="s-btn" id="startBtn">开始今晚的故事 →</button>' +
          '<button class="s-btn ghost" id="returnBtn">我来过了，直接进 ›</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // -------------------- 设置页 --------------------
  function renderSetup() {
    var chipsHtml = '';
    INTEREST_CHIPS.forEach(function (c) {
      var on = state.child.interests.indexOf(c.k) >= 0;
      chipsHtml += '<button class="s-chip' + (on ? ' on' : '') + '" data-chip="' + c.k + '">' + c.emoji + ' ' + c.label + '</button>';
    });

    var nick = state.child.nickname || '';
    var canEnter = nick.trim().length > 0;

    return '<div class="s-screen brand">' +
      starsHtml(5) +
      '<div style="position:absolute;top:16px;left:14px;z-index:6">' +
        '<button class="s-icon" id="backLanding">‹</button>' +
      '</div>' +
      '<div class="setup" style="padding:54px 22px 34px">' +
        orbHtml('sm') +
        '<p class="hello">我是佩洛，今晚由我来讲故事。<br>先告诉我——今晚讲给谁听呀？</p>' +
        '<div class="s-paper">' +
          '<label class="field-label">今晚的小听众，叫什么名字？</label>' +
          '<input class="nick-input" id="nickInput" maxlength="20" placeholder="宝宝的昵称（只存在这台设备）" value="' + nick + '">' +
          '<div class="section-gap"></div>' +
          '<label class="field-label">TA 今晚想听点什么？<span style="font-weight:400;font-size:11px;opacity:0.55;margin-left:6px">可多选 · 每晚都能换</span></label>' +
          '<div class="chip-row" id="chipRow">' + chipsHtml + '</div>' +
          '<p style="font-size:11px;color:var(--ink-soft);margin-top:10px;line-height:1.5">🔒 我们只保留昵称和喜好（关联匿名设备标识），绝不收集真实姓名、照片或生日。</p>' +
        '</div>' +
        '<button class="s-btn' + (canEnter ? '' : ' disabled') + '" id="enterMap"' + (canEnter ? '' : ' disabled') + '>进入月光森林 →</button>' +
        (!canEnter ? '<p style="font-size:12px;color:var(--mut);text-align:center;margin-top:8px">先填上昵称，就能开始啦</p>' : '') +
      '</div>' +
    '</div>';
  }

  // -------------------- 故事地图 --------------------
  function renderMap() {
    var name = state.child.nickname || '小宝贝';
    var remaining = Math.max(0, state.quotaMax - state.countedTonight.length);

    // 关卡节点
    var nodesHtml = '';
    LEVELS.forEach(function (level, i) {
      var story = getStory(level.id);
      var status;
      if (i === 0 || state.completed.indexOf(LEVELS[i - 1].id) >= 0) {
        status = state.completed.indexOf(level.id) >= 0 ? 'done' : 'cur';
      } else {
        status = 'lock';
      }

      var coverImg = story ? 'assets/illustrations/' + story.coverImage : '';
      var ctaText;
      if (status === 'cur') ctaText = '今晚就讲这个 ▸';
      else if (status === 'done') ctaText = '🌑 再讲一次';
      else ctaText = '讲完上一关，就会亮起来';

      var lockMark = status === 'lock' ? '<span class="lock-mark">🔒</span>' : '';

      nodesHtml += '<div class="node ' + status + '" data-story="' + level.id + '" data-locked="' + (status === 'lock') + '">' +
        '<img class="art" src="' + coverImg + '" alt="' + level.title + '">' +
        lockMark +
        '<div class="nb">' +
          '<div class="t">' + level.emoji + ' ' + level.title + '</div>' +
          '<div class="s">' + level.sub + '</div>' +
          '<span class="cta">' + ctaText + '</span>' +
        '</div>' +
      '</div>';
    });

    // 蜿蜒路径 SVG
    var trailSvg = '<svg class="trail-svg" viewBox="0 0 400 800" preserveAspectRatio="none">' +
      '<path d="M80,60 Q200,100 320,180 Q200,260 80,340 Q200,420 320,500 Q200,580 80,660 Q200,720 200,780" />' +
      '</svg>';

    return '<div class="map">' +
      starsHtml(6) +
      firefliesHtml() +
      '<div class="bar">' +
        '<div class="bar-title">🌙 佩洛 · 睡前故事</div>' +
        '<div class="bar-right">' +
          '<span class="pearl-count"><span class="pearl"></span> × ' + state.stones + '</span>' +
          '<div class="icon-group">' +
            '<button class="s-icon" id="settingsBtn" title="设置">⚙</button>' +
            '<button class="s-icon" id="themeBtn" title="日/夜">' + (state.theme === 'night' ? '🌗' : '☀') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="greet">' +
        '<img class="g-ava" src="assets/illustrations/pawlo-bunny.jpg" alt="佩洛">' +
        '<span><strong>' + name + '</strong>，晚上好呀～又见面啦 🌙 今晚想听点什么？</span>' +
      '</div>' +
      '<div class="who">' +
        '<div class="who-l">' +
          '<div class="who-t">讲给</div>' +
          '<div class="who-n">' + name + '</div>' +
        '</div>' +
        '<button class="who-edit" id="editProfile">✎ 修改</button>' +
      '</div>' +
      '<div class="quota">' +
        (remaining > 0
          ? '🌙 今晚还能开 <span class="q-num">' + remaining + '</span> 个新故事 · 重讲不计次'
          : '🌙 今晚的新故事都讲完啦 · 重讲随时都行') +
      '</div>' +
      '<div class="trail">' +
        trailSvg +
        nodesHtml +
      '</div>' +
      '<p style="font-size:11px;color:var(--mut);text-align:center;line-height:1.7;padding:0 36px 30px">' +
        '讲完一个故事点亮下一关 · 月亮石只奖励"讲完"，和选了哪条路无关' +
      '</p>' +
    '</div>';
  }

  // -------------------- 编织过渡 --------------------
  function renderWeave() {
    var name = state.child.nickname;
    var txt = name ? '佩洛正在为 <em>' + name + '</em> 编织今晚的故事…' : '佩洛正在编织今晚的故事…';

    return '<div class="weave">' +
      starsHtml(6) +
      '<div style="position:absolute;top:16px;left:14px;z-index:6">' +
        '<button class="s-icon" id="backFromWeave" title="返回">‹</button>' +
      '</div>' +
      '<div class="w-orb">' +
        '<div class="w-rays"></div>' +
        '<img class="w-ava" src="assets/illustrations/pawlo-bunny.jpg" alt="佩洛正在编织故事">' +
      '</div>' +
      '<p class="w-txt">' + txt + '</p>' +
      '<p class="w-sub">每一晚，都是一个新故事</p>' +
      '<div class="w-bar"><div class="w-fill"></div></div>' +
    '</div>';
  }

  // -------------------- 故事播放器 --------------------
  function renderPlayer() {
    var s = state.session;
    if (!s) return '';

    var story = state.currentStory;
    var beat = s.beat;
    var totalBeats = 3;
    var currentNode = s.nodes[s.nodes.length - 1];
    var isEnded = s.phase === 'ended';
    var isStreaming = s.streaming;

    // 进度点
    var dotsHtml = '';
    for (var b = 1; b <= totalBeats; b++) {
      var dotCls = b <= beat ? '' : (isStreaming && b === beat + 1 ? 'cur' : 'off');
      dotsHtml += '<span class="pearl ' + dotCls + '"></span>';
    }

    // 场景图
    var sceneHtml;
    if (isStreaming) {
      sceneHtml = '<div class="drawing-slot"></div>';
    } else if (currentNode && currentNode.image) {
      sceneHtml = '<div class="scene"><img src="assets/illustrations/' + currentNode.image + '" alt="故事场景"></div>';
    } else {
      sceneHtml = '<div class="scene"><img src="assets/illustrations/pawlo-bunny.jpg" alt="佩洛"></div>';
    }

    // 正文
    var proseHtml;
    if (isStreaming) {
      proseHtml = '<p><span id="streamText">' + (s.streamingText || '') + '</span><span class="caret"></span></p>';
    } else if (currentNode) {
      var text = currentNode.text;
      // 提取末尾提问
      var m = text.match(/([^。.！!？?\n]*[？?][""』」]?)\s*$/);
      if (m && m[1].trim() && m[1].trim().length <= 90) {
        proseHtml = '<p>' + text.slice(0, m.index) + '<span class="ask">' + m[1] + '</span></p>';
      } else {
        proseHtml = '<p>' + text + '</p>';
      }
    } else {
      proseHtml = '<p></p>';
    }

    // 选项
    var choicesHtml = '';
    if (!isStreaming && !isEnded && s.currentChoice) {
      choicesHtml = '<div class="choices" id="choicesSection">';
      choicesHtml += '<p style="font-size:12.5px;font-weight:600;color:var(--moon);padding:0 2px;margin-bottom:2px">🤲 替 TA 选一条路 <span style="font-weight:400;font-size:11px;color:var(--mut);margin-left:5px">(家长选)</span></p>';
      s.currentChoice.options.forEach(function (opt) {
        var emoji = TRAIT_EMOJI[opt.trait] || '✨';
        choicesHtml += '<button class="choice" data-option="' + opt.id + '">' +
          '<span class="c-emoji">' + emoji + '</span>' +
          '<span class="c-body"><span class="c-label">' + opt.label + '</span>' +
          '<span class="c-hint">' + opt.hint + '</span></span>' +
        '</button>';
      });
      choicesHtml += '</div>';
    } else if (!isStreaming && isEnded) {
      choicesHtml = '<button class="btn" id="seeEnding">故事讲完了 · 看看它的走向 →</button>';
    }

    // 朗读提示
    var footHtml = '<p style="font-size:11px;color:var(--mut);text-align:center;line-height:1.7;padding:14px 30px 0">📖 这一页由家长读给宝宝听</p>';

    return '<div class="player">' +
      '<div class="bar">' +
        '<button class="s-icon b-back" id="backMap">‹</button>' +
        '<div class="b-mid">' +
          '<div class="b-title">' + story.title + '</div>' +
          '<div class="b-page">第 ' + beat + ' 页</div>' +
        '</div>' +
        '<button class="s-pill b-read" id="narrateBtn">🔊 朗读</button>' +
      '</div>' +
      '<div class="dots">' + dotsHtml + '</div>' +
      '<div class="page">' +
        sceneHtml +
        '<div class="prose" id="proseArea">' + proseHtml + '</div>' +
      '</div>' +
      choicesHtml +
      footHtml +
    '</div>';
  }

  // -------------------- 结局页 --------------------
  function renderEnding() {
    var s = state.session;
    if (!s || !s.ending) return '';

    var name = state.child.nickname || '小宝贝';
    var e = s.ending;

    // 火花
    var sparksHtml = '';
    for (var i = 0; i < 5; i++) {
      sparksHtml += '<span class="spark"></span>';
    }

    // 成长主题标签
    var tagsHtml = '';
    e.traits.forEach(function (tr) {
      tagsHtml += '<span class="ec-tag">' + (TRAIT_EMOJI[tr] || '') + ' ' + (TRAIT_LABELS[tr] || tr) + '</span>';
    });

    return '<div class="ending">' +
      starsHtml(5) +
      '<div class="ehead">今晚的故事，落幕了 🌙</div>' +
      '<div class="ehead-sub">晚安，' + name + ' 🌙</div>' +
      '<div class="stage">' +
        '<span class="pearl lg"></span>' +
        sparksHtml +
      '</div>' +
      '<p class="reward">获得月亮石 × 1<br><span style="font-size:12px;color:var(--mut)">讲完就有 · 和选了哪条路无关</span></p>' +
      '<div class="ecards">' +
        '<div class="ecard">' +
          '<div class="ec-head">🌟 这一次的故事走向</div>' +
          '<div class="ec-body">' + e.consequence + '</div>' +
        '</div>' +
        '<div class="ecard">' +
          '<div class="ec-head">🌱 故事里的成长主题</div>' +
          '<div class="ec-tags">' + tagsHtml + '</div>' +
        '</div>' +
        '<div class="ecard">' +
          '<div class="ec-head">💬 睡前聊一聊</div>' +
          '<div class="ec-body">' + e.talk + '</div>' +
          '<div style="font-size:11px;color:var(--mut);margin-top:8px">这一段佩洛不朗读，留给爸爸妈妈。</div>' +
        '</div>' +
      '</div>' +
      '<div class="eval-note">* 我们只描述这一次故事的走向，不给孩子打分，也没有对错之分。</div>' +
      '<div class="e-actions">' +
        '<button class="s-btn" id="replayBtn">换一条路,再讲一次</button>' +
        '<div class="row">' +
          '<button class="s-btn ghost" id="shareBtn">🌙 分享</button>' +
          '<button class="s-btn ghost" id="backMapEnd">回到地图</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // ==================== 事件绑定 ====================
  function bindEvents() {
    // 落地页
    var startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.onclick = function () { state.screen = 'setup'; render(true); };

    var returnBtn = document.getElementById('returnBtn');
    if (returnBtn) returnBtn.onclick = function () {
      if (state.child.nickname) { state.screen = 'map'; render(true); }
      else { state.screen = 'setup'; render(true); }
    };

    // 设置页
    var backLanding = document.getElementById('backLanding');
    if (backLanding) backLanding.onclick = function () { state.screen = 'landing'; render(true); };

    var nickInput = document.getElementById('nickInput');
    if (nickInput) {
      nickInput.oninput = function () {
        state.child.nickname = nickInput.value.trim();
        // 动态更新按钮状态
        var enterBtn = document.getElementById('enterMap');
        var canEnter = state.child.nickname.length > 0;
        if (enterBtn) {
          if (canEnter) {
            enterBtn.classList.remove('disabled');
            enterBtn.disabled = false;
          } else {
            enterBtn.classList.add('disabled');
            enterBtn.disabled = true;
          }
        }
        // 动态显示/隐藏提示
        var hint = enterBtn ? enterBtn.nextElementSibling : null;
        if (hint && hint.tagName === 'P') {
          hint.style.display = canEnter ? 'none' : '';
        }
      };
    }

    var chipRow = document.getElementById('chipRow');
    if (chipRow) {
      chipRow.querySelectorAll('.s-chip').forEach(function (chip) {
        chip.onclick = function () {
          var k = chip.getAttribute('data-chip');
          var idx = state.child.interests.indexOf(k);
          if (idx >= 0) { state.child.interests.splice(idx, 1); chip.classList.remove('on'); }
          else { state.child.interests.push(k); chip.classList.add('on'); }
        };
      });
    }

    var enterMap = document.getElementById('enterMap');
    if (enterMap) enterMap.onclick = function () {
      if (!state.child.nickname) return;
      save();
      state.screen = 'map';
      render(true);
    };

    // 地图
    var settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.onclick = function () { openParentGate(); };

    var themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.onclick = function () {
      state.theme = state.theme === 'night' ? 'day' : 'night';
      save();
      render();
    };

    var editProfile = document.getElementById('editProfile');
    if (editProfile) editProfile.onclick = function () { state.screen = 'setup'; render(true); };

    // 关卡节点
    document.querySelectorAll('.node').forEach(function (node) {
      node.onclick = function () {
        if (node.getAttribute('data-locked') === 'true') return;
        var storyId = node.getAttribute('data-story');
        startStory(storyId, state.completed.indexOf(storyId) >= 0);
      };
    });

    // 编织过渡页
    var backFromWeave = document.getElementById('backFromWeave');
    if (backFromWeave) backFromWeave.onclick = function () {
      cleanupTimers();
      stopSpeech();
      state.session = null;
      state.currentStory = null;
      state.screen = 'map';
      render(true);
    };

    // 播放器
    var backMap = document.getElementById('backMap');
    if (backMap) backMap.onclick = function () {
      cleanupTimers();
      stopSpeech();
      state.session = null;
      state.currentStory = null;
      state.screen = 'map';
      render(true);
    };

    var narrateBtn = document.getElementById('narrateBtn');
    if (narrateBtn) narrateBtn.onclick = function () {
      if (!('speechSynthesis' in window)) {
        showToast('当前浏览器不支持语音朗读');
        return;
      }
      var s = state.session;
      if (!s) return;
      var node = s.nodes[s.nodes.length - 1];
      if (!node) return;
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        narrateBtn.classList.remove('on');
        narrateBtn.textContent = '🔊 朗读';
      } else {
        var utter = new SpeechSynthesisUtterance(node.text);
        utter.lang = 'zh-CN';
        utter.rate = 0.9;
        // 保存按钮引用，回调中检查是否仍在 DOM 中
        var btnRef = narrateBtn;
        utter.onend = function () {
          if (btnRef && document.body.contains(btnRef)) {
            btnRef.classList.remove('on');
            btnRef.textContent = '🔊 朗读';
          }
        };
        utter.onerror = function () {
          if (btnRef && document.body.contains(btnRef)) {
            btnRef.classList.remove('on');
            btnRef.textContent = '🔊 朗读';
          }
        };
        speechSynthesis.speak(utter);
        narrateBtn.classList.add('on');
        narrateBtn.textContent = '⏸ 停止';
      }
    };

    // 选项点击
    document.querySelectorAll('.choice').forEach(function (choice) {
      choice.onclick = function () {
        var optId = choice.getAttribute('data-option');
        // 选项高亮反馈
        choice.classList.add('selected');
        // 禁用其他选项
        document.querySelectorAll('.choice').forEach(function (c) {
          if (c !== choice) c.style.opacity = '0.35';
          c.style.pointerEvents = 'none';
        });
        // 短暂延迟后执行
        setTimeout(function () {
          chooseOption(optId);
        }, 280);
      };
    });

    // 查看结局
    var seeEnding = document.getElementById('seeEnding');
    if (seeEnding) seeEnding.onclick = function () {
      state.screen = 'ending';
      render(true);
    };

    // 结局页
    var replayBtn = document.getElementById('replayBtn');
    if (replayBtn) replayBtn.onclick = function () {
      if (state.currentStory) startStory(state.currentStory.id, true);
    };

    var shareBtn = document.getElementById('shareBtn');
    if (shareBtn) shareBtn.onclick = function () {
      var shareText = '🌙 今晚和' + (state.child.nickname || '宝宝') + '一起讲了《' + state.currentStory.title + '》';
      if (navigator.share) {
        navigator.share({
          title: '兔佩洛 · AI 互动睡前故事',
          text: shareText,
          url: location.href
        }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText + ' ' + location.href).then(function () {
          showToast('已复制到剪贴板 📋');
        }).catch(function () {
          showToast(shareText);
        });
      } else {
        showToast(shareText);
      }
    };

    var backMapEnd = document.getElementById('backMapEnd');
    if (backMapEnd) backMapEnd.onclick = function () {
      state.session = null;
      state.currentStory = null;
      state.screen = 'map';
      render(true);
    };
  }

  // ==================== 故事流程 ====================
  function startStory(storyId, isReplay) {
    var story = getStory(storyId);
    if (!story) return;

    // 配额检查
    if (!isReplay && state.countedTonight.indexOf(storyId) < 0) {
      if (state.quotaMax - state.countedTonight.length <= 0) {
        showToast('🌙 今晚的新故事都讲完啦！重讲随时都行哦～');
        return;
      }
      state.countedTonight.push(storyId);
      save();
    }

    state.currentStory = story;
    state.screen = 'weave';
    render(true);

    // 模拟编织延迟
    weaveTimer = setTimeout(function () {
      weaveTimer = null;
      // 初始化会话
      var openingText = story.opening.text;
      // 个性化：如果有昵称，在开头织入
      if (state.child.nickname) {
        openingText = '今晚，' + state.child.nickname + '要听一个关于月光森林的故事。' + openingText;
      }

      state.session = {
        beat: 1,
        nodes: [{
          text: openingText,
          image: story.coverImage
        }],
        picks: {},
        traits: [],
        phase: 'awaiting-choice',
        decisionIndex: 0,
        currentChoice: story.choicePoints[0],
        streaming: false,
        streamingText: ''
      };
      state.screen = 'player';
      render(true);
    }, 2200);
  }

  function chooseOption(optId) {
    var s = state.session;
    if (!s || !s.currentChoice) return;

    var story = state.currentStory;
    var choice = s.currentChoice;
    var option = null;
    for (var i = 0; i < choice.options.length; i++) {
      if (choice.options[i].id === optId) { option = choice.options[i]; break; }
    }
    if (!option) return;

    var decisionIndex = s.decisionIndex;
    var isFinal = decisionIndex >= story.choicePoints.length - 1;

    // 记录选择
    s.picks[choice.id] = optId;
    s.traits.push(option.trait);

    // 开始流式生成
    s.streaming = true;
    s.streamingText = '';
    render();

    // 模拟流式文本
    var fullText = option.text;
    // 个性化：如果有昵称，在文本中偶尔织入
    if (state.child.nickname && Math.random() > 0.5) {
      fullText = fullText.replace(/露娜/g, state.child.nickname + '和露娜', 1);
    }

    var charIndex = 0;
    streamTimer = setInterval(function () {
      // 会话已被替换（用户导航离开或开始了新故事），停止流式
      if (state.session !== s) {
        clearInterval(streamTimer);
        streamTimer = null;
        return;
      }
      if (charIndex >= fullText.length) {
        clearInterval(streamTimer);
        streamTimer = null;
        finishBeat(s, story, choice, option, isFinal, decisionIndex);
        return;
      }
      // 每次加 2-3 个字
      var chunk = fullText.slice(charIndex, charIndex + 2 + Math.floor(Math.random() * 2));
      s.streamingText += chunk;
      charIndex += chunk.length;

      // 使用 requestAnimationFrame 更新流式文本显示，避免布局抖动
      var currentText = s.streamingText;
      requestAnimationFrame(function () {
        var streamEl = document.getElementById('streamText');
        if (streamEl) {
          streamEl.textContent = currentText;
          // 自动滚动到最新文本
          var proseArea = document.getElementById('proseArea');
          if (proseArea) {
            proseArea.scrollTop = proseArea.scrollHeight;
          }
        }
      });
    }, 80);
  }

  function finishBeat(s, story, choice, option, isFinal, decisionIndex) {
    // 会话已被替换，放弃本次结束处理
    if (state.session !== s) return;

    s.streaming = false;
    s.streamingText = '';

    // 添加新节点
    var newNode = {
      text: option.text,
      image: matchSceneImage(option.scenePrompt, story)
    };
    s.nodes.push(newNode);
    s.beat = s.nodes.length;

    if (isFinal) {
      // 故事结束
      s.phase = 'ended';
      s.currentChoice = null;

      // 构建结局
      var cp1Choice = s.picks[story.choicePoints[0].id];
      var cp3Choice = s.picks[story.choicePoints[2].id];

      var consequence = '';
      if (story.consequences && story.consequences.cp1 && story.consequences.cp1[cp1Choice]) {
        consequence += story.consequences.cp1[cp1Choice] + ' ';
      }
      if (story.consequences && story.consequences.cp3 && story.consequences.cp3[cp3Choice]) {
        consequence += story.consequences.cp3[cp3Choice];
      }

      var talk = '';
      if (story.talk && story.talk[cp3Choice]) {
        talk = story.talk[cp3Choice];
      }

      // 去重特质标签
      var uniqueTraits = [];
      s.traits.forEach(function (tr) {
        if (uniqueTraits.indexOf(tr) < 0) uniqueTraits.push(tr);
      });

      s.ending = {
        consequence: consequence.trim(),
        traits: uniqueTraits,
        talk: talk
      };

      // 奖励月亮石
      state.stones += 1;
      // 标记通关
      if (state.completed.indexOf(story.id) < 0) {
        state.completed.push(story.id);
      }
      save();
    } else {
      // 下一关
      var nextIndex = decisionIndex + 1;
      s.decisionIndex = nextIndex;
      s.currentChoice = story.choicePoints[nextIndex];
      s.phase = 'awaiting-choice';
    }

    render();

    // 流式结束后滚动到选项区域
    if (!isFinal) {
      setTimeout(function () {
        var choicesSection = document.getElementById('choicesSection');
        if (choicesSection) {
          choicesSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  }

  // 场景图匹配
  function matchSceneImage(scenePrompt, story) {
    var imageMap = {
      // 新故事场景图映射（更具体的关键词放在前面）
      'firefly': 'firefly-pond.jpg',
      'owl': 'forest-path.jpg',
      'glow': 'pip-turtle-glow.jpg',
      'bunny': 'pawlo-star-lit.jpg',
      'lantern': 'pawlo-lantern-path.jpg',
      'helper': 'momo-snow-helper.jpg',
      'carry': 'momo-snowball-caught.jpg',
      'snowball': 'momo-snowball-home.jpg',
      'fish': 'pip-sea-friend.jpg',
      'bubble': 'pip-sea-friend.jpg',
      'coral': 'pip-turtle-brave.jpg',
      'sea turtle': 'pip-turtle-home.jpg',
      'wave': 'pip-restless-wave.jpg',
      'meadow': 'dandelion.jpg',
      'bear': 'momo-warm-huddle.jpg',
      'snow': 'momo-snowy-search.jpg',
      'footprint': 'momo-snowy-search.jpg',
      'hug': 'momo-warm-huddle.jpg',
      // 原有故事场景图映射
      'fox hedgehog': 'friend-tower.jpg',
      'fireflies': 'firefly-pond.jpg',
      'fox on big rock': 'rock-valley.jpg',
      'stepping stones': 'story-the-singing-brook.jpg',
      'turtle': 'friend-tower.jpg',
      'log bridge': 'forest-path.jpg',
      'sing': 'sing-moon.jpg',
      'tower': 'friend-tower.jpg',
      'dandelion': 'dandelion.jpg',
      'moon': 'moon-gaze.jpg',
      'cloud': 'story-the-sneezing-cloud.jpg',
      'mushroom': 'story-the-mushroom-post.jpg',
      'brook': 'story-the-singing-brook.jpg',
      'lighthouse': 'story-the-star-lighthouse.jpg',
      'star': 'story-the-star-lighthouse.jpg'
    };

    for (var key in imageMap) {
      if (scenePrompt.toLowerCase().indexOf(key) >= 0) {
        return imageMap[key];
      }
    }
    return story.coverImage;
  }

  // ==================== 家长门 ====================
  var gateA, gateB, gateAnswer, gateInput;

  function openParentGate() {
    // 安全检查：如果门内容被设置面板替换了，先恢复
    var gateEq = document.getElementById('gateEq');
    if (!gateEq) {
      restoreGate();
      gateEq = document.getElementById('gateEq');
    }
    if (!gateEq) return; // 仍然找不到，放弃操作

    gateA = 3 + Math.floor(Math.random() * 7);
    gateB = 2 + Math.floor(Math.random() * 7);
    gateAnswer = gateA + gateB;
    gateInput = '';

    gateEq.textContent = gateA + ' + ' + gateB + ' = ?';
    gateEq.classList.remove('bad');
    renderKeypad();
    document.getElementById('parentGate').classList.add('show');
  }

  function closeParentGate() {
    document.getElementById('parentGate').classList.remove('show');
  }

  function renderKeypad() {
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
    var html = '';
    keys.forEach(function (k) {
      if (k === '') {
        html += '<div></div>';
      } else {
        var cls = k === '⌫' ? 'key fn' : 'key';
        html += '<button class="' + cls + '" data-key="' + k + '">' + k + '</button>';
      }
    });
    var keypad = document.getElementById('gateKeypad');
    keypad.innerHTML = html;

    keypad.querySelectorAll('.key').forEach(function (btn) {
      btn.onclick = function () {
        var k = btn.getAttribute('data-key');
        if (k === '⌫') {
          gateInput = gateInput.slice(0, -1);
        } else if (gateInput.length < 3) {
          gateInput += k;
          if (parseInt(gateInput, 10) === gateAnswer) {
            setTimeout(function () {
              closeParentGate();
              // 显示设置面板
              showSettingsPanel();
            }, 200);
          } else if (gateInput.length >= String(gateAnswer).length) {
            document.getElementById('gateEq').classList.add('bad');
            setTimeout(function () {
              gateInput = '';
              document.getElementById('gateEq').classList.remove('bad');
              document.getElementById('gateEq').textContent = gateA + ' + ' + gateB + ' = ?';
            }, 520);
          }
        }
        var eqEl = document.getElementById('gateEq');
        if (gateInput) {
          eqEl.textContent = gateA + ' + ' + gateB + ' = ' + gateInput;
        } else {
          eqEl.textContent = gateA + ' + ' + gateB + ' = ?';
        }
      };
    });
  }

  function showSettingsPanel() {
    var remaining = Math.max(0, state.quotaMax - state.countedTonight.length);
    var html = '<div class="settings-panel">' +
      '<div class="sp-head">⚙️ 家长设置</div>' +
      '<div class="sp-list">' +
        '<div class="sp-row"><span>每晚新故事配额</span><span class="sp-val">' + state.quotaMax + '</span></div>' +
        '<div class="sp-row"><span>今晚剩余</span><span class="sp-val">' + remaining + '</span></div>' +
        '<div class="sp-row"><span>已收集月亮石</span><span class="sp-val">🌙 × ' + state.stones + '</span></div>' +
        '<div class="sp-row"><span>已通关故事</span><span class="sp-val">' + state.completed.length + ' / 10</span></div>' +
      '</div>' +
      '<div class="sp-actions">' +
        '<button class="s-btn ghost" id="spClose">关闭</button>' +
        '<button class="s-btn ghost" id="spReset">重置全部进度</button>' +
      '</div>' +
      '<p style="font-size:11px;color:var(--mut);text-align:center;margin-top:8px">Demo 版设置面板</p>' +
    '</div>';

    var overlay = document.getElementById('parentGate');
    overlay.querySelector('.gate').innerHTML = html;
    overlay.classList.add('show');

    document.getElementById('spClose').onclick = function () {
      closeParentGate();
      // 恢复 gate 原始内容
      restoreGate();
    };
    document.getElementById('spReset').onclick = function () {
      if (confirm('确定要重置全部进度吗？这将清除昵称、月亮石和通关记录。')) {
        localStorage.removeItem('pawlo-demo');
        state.child = { nickname: '', interests: [] };
        state.stones = 0;
        state.completed = [];
        state.countedTonight = [];
        state.lastDate = todayStr();
        closeParentGate();
        restoreGate();
        state.screen = 'landing';
        render(true);
        showToast('已重置，重新开始吧 🌙');
      }
    };
  }

  function restoreGate() {
    document.getElementById('parentGate').querySelector('.gate').innerHTML =
      '<div style="text-align:center;font-size:28px;margin-bottom:6px">🌙</div>' +
      '<div class="gate-title">家长确认</div>' +
      '<div class="gate-sub">请家长来解一道题，替孩子守住这道门</div>' +
      '<div id="gateEq" class="eq">? + ? = ?</div>' +
      '<div class="keypad" id="gateKeypad"></div>' +
      '<button class="s-btn ghost" id="gateCancel" style="margin-top:4px">算了，回去陪孩子</button>';
  }

  // 家长门：事件委托（取消按钮 + 点击遮罩关闭）
  document.getElementById('parentGate').addEventListener('click', function (e) {
    if (e.target === this || e.target.closest('#gateCancel')) {
      closeParentGate();
      // 如果门内容被设置面板替换了，恢复原始内容
      if (!document.getElementById('gateEq')) {
        restoreGate();
      }
    }
  });

  // ==================== 全局事件守护 ====================
  // 页面隐藏时停止语音朗读（流式定时器保留，回来后继续）
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stopSpeech();
    }
  });

  // 页面卸载前清理所有定时器和语音
  window.addEventListener('beforeunload', function () {
    cleanupTimers();
    stopSpeech();
  });

  // ==================== 启动 ====================
  load();
  render();
})();
