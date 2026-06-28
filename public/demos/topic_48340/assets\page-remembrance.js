/* =========================================================
   《你好，我的思念》page-remembrance.js
   - ① 学习素材列表
   - ② 照片 → 视频网格
   - ③ 打电话给爷爷（合并：还原声音 + 思念复刻对话）
     状态：idle → dialing → connecting → inCall → ended
     场景：greeting / vent / share / free
   ========================================================= */
(function () {
  'use strict';

  var $learn = document.getElementById('learnList');
  var $grid = document.getElementById('photoGrid');
  if (!$learn || !$grid) return;

  var R = (window.HML && window.HML.getRemembrance) ? window.HML.getRemembrance() : { grandfather: { name: '爷爷', learnFrom: [], photos: [], dialogue: [] } };
  var gf = R.grandfather || {};

  /* ---------- ① 学习素材列表 ---------- */
  (function renderLearn() {
    var html = (gf.learnFrom || []).map(function (s) {
      return '<div style="display:flex;align-items:flex-start;gap:.4rem;"><span style="color:var(--accent);">·</span><span>' + escape(s) + '</span></div>';
    }).join('');
    $learn.innerHTML = html;
  })();

  /* ---------- ② 照片 → 视频网格 ---------- */
  (function renderPhotos() {
    var photos = gf.photos || [];
    var html = photos.map(function (p, i) {
      var palette = ['#d8b591', '#c89b78', '#a37559', '#b9886a'];
      var bg = palette[i % palette.length];
      var initials = (p.caption || '').slice(0, 1);
      return ''
        + '<button type="button" class="photo-thumb" data-idx="' + i + '" '
        +   'style="cursor:pointer;position:relative;aspect-ratio:4/3;border-radius:0.9rem;border:1px solid var(--rule);'
        +   'background:linear-gradient(135deg, ' + bg + ', color-mix(in srgb, ' + bg + ' 60%, var(--deep)));'
        +   'display:grid;place-items:center;overflow:hidden;color:var(--paper);'
        +   'transition:transform .15s ease, box-shadow .15s ease;">'
        +   '<div style="font-family:var(--font-title);font-size:2.4rem;opacity:.85;">' + escape(initials) + '</div>'
        +   '<div style="position:absolute;left:.5rem;bottom:.5rem;background:color-mix(in srgb, var(--deep) 70%, transparent);color:var(--paper);'
        +     'font-size:.7rem;padding:.15rem .45rem;border-radius:999px;">' + (p.yearsAgo || '') + ' 年前</div>'
        +   '<div class="play-icon" style="position:absolute;right:.5rem;top:.5rem;width:1.6rem;height:1.6rem;border-radius:50%;'
        +     'background:color-mix(in srgb, var(--paper) 90%, transparent);display:grid;place-items:center;color:var(--accent);font-size:.7rem;">▶</div>'
        + '</button>';
    }).join('');
    $grid.innerHTML = html;

    Array.prototype.forEach.call($grid.querySelectorAll('.photo-thumb'), function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        var p = photos[idx] || {};
        if (window.__showToast) window.__showToast('AI 已生成 5 秒动态影像 · ' + (p.caption || ''));
      });
    });
  })();

  /* ---------- ③ 打电话给爷爷 ---------- */
  var STAGE = {
    avatar: document.getElementById('phoneAvatar'),
    name: document.getElementById('phoneName'),
    statusText: document.getElementById('statusText'),
    dialDisplay: document.getElementById('dialDisplay'),
    dialPad: document.getElementById('dialPad'),
    callPanel: document.getElementById('callPanel'),
    callTimer: document.getElementById('callTimer'),
    callTranscript: document.getElementById('callTranscript'),
    callInputForm: document.getElementById('callInputForm'),
    callUserInput: document.getElementById('callUserInput'),
    btnMute: document.getElementById('btnMute'),
    btnKeypad: document.getElementById('btnKeypad'),
    btnCall: document.getElementById('btnCall'),
    btnSpeaker: document.getElementById('btnSpeaker'),
    btnEnd: document.getElementById('btnEnd'),
    tip: document.getElementById('callTip'),
    tabs: document.getElementById('sceneTabs')
  };

  /* 状态机 */
  var state = 'idle';      // idle | dialing | connecting | inCall | ended
  var currentScene = 'greeting';
  var dialBuffer = '';     // 拨号缓冲
  var timerId = null;
  var callSeconds = 0;

  /* 场景预设：开场白 + 用户示例输入 + 爷爷回复 */
  var SCENES = {
    greeting: {
      open: [
        { side: 'departed', text: '哎，孩子，怎么想起给爷爷打电话了？' }
      ],
      hints: [
        { user: '爷爷，我今天下班好累。', reply: '那就回家歇歇。饭做了没？先吃饱，外头的事吃完再想。' },
        { user: '爷爷，我想你了。', reply: '爷爷知道。家里那盏灯，记得常亮。' }
      ]
    },
    vent: {
      // 委屈倾诉：和家人关系不好时
      open: [
        { side: 'departed', text: '哎，怎么了？听你声音不太对，是在外头受委屈了？跟爷爷说。' }
      ],
      hints: [
        { user: '爷爷，我跟爸妈又吵架了，他们根本不理解我。', reply: '爸妈那代人，吃过我们没吃过的苦，讲话是硬了点，但心是软的。慢慢讲，别赌气，他们也是头一回当爸妈。' },
        { user: '他们总觉得我做得不够好，我做什么他们都看不上。', reply: '他们说你，是盼你过得好。你做得好的时候，他们也跟人家念叨，只是当着你嘴硬。爷爷知道。' },
        { user: '我有时候觉得，活着真累。', reply: '累了就歇歇。家里这盏灯一直给你留着，不用急着赶路。先把自己照顾好，再谈其他。' },
        { user: '我觉得我真没用。', reply: '瞎说。你小时候那点出息，爷爷都记着。再难，也别拿"没用"两个字骂自己，那不是事实。' }
      ]
    },
    share: {
      open: [
        { side: 'departed', text: '哟，听声音就知道有喜事。说给爷爷听听。' }
      ],
      hints: [
        { user: '爷爷，我们家买新房子了。', reply: '爷爷听着心里高兴。新家客厅记得给爷爷那把藤椅留个位置。' },
        { user: '我升职了！', reply: '好样的。是你踏实干出来的。今晚给爷爷敬一杯，爷爷心里有数。' }
      ]
    },
    free: {
      open: [
        { side: 'departed', text: '哎，孩子。我在呢，你想说啥？' }
      ],
      hints: [
        { user: '爷爷，你还好吗？', reply: '爷爷一直在。你这一打过来，爷爷就高兴。' }
      ]
    }
  };

  /* 关键词路由（用于 free 输入） */
  function pickReplyByKeyword(t) {
    if (/哭|难过|想念|想您|想爷|想奶|想爸|想妈|想|念/.test(t)) {
      return '爷爷知道。家里那盏灯，记得常亮。';
    }
    if (/买房|新家|装修|搬家|房子/.test(t)) {
      return '爷爷听着心里高兴。新家客厅记得给爷爷那把藤椅留个位置。';
    }
    if (/工作|累|加班|忙|升职|辞职|跳槽/.test(t)) {
      return '别太拼。忙的时候想起爷爷就深呼吸三次，心里就静了。';
    }
    if (/孩子|儿子|女儿|小宝|怀孕|生/.test(t)) {
      return '哈哈，又多一个人喊我太爷爷。替爷爷抱抱。';
    }
    if (/吵架|不理解|委屈|没用|失望|生气|烦|讨厌|恨|关系|爸妈|父母|家人|妈|爸/.test(t)) {
      // 委屈/家庭关系：核心场景
      if (/没用|累|活|轻生|不想活|想死|自残/.test(t)) {
        return '别这样想。累了就歇歇，爷爷这边灯一直亮着。明天给爷爷再打一个，爷爷听你说。';
      }
      if (/吵架|生气|打|骂/.test(t)) {
        return '哎，别赌气。家人是打不断的，慢慢讲，他们只是嘴硬。';
      }
      return '心里有委屈，跟爷爷说。说完就轻了，爷爷不嫌烦。';
    }
    if (/生日|节日|过年|中秋|春节|端午|元宵|结婚|纪念/.test(t)) {
      return '家里那盏灯，记得常亮。';
    }
    if (/工作|学习|考试|考研|考公|毕业|论文|论文答辩/.test(t)) {
      return '慢慢来。你认真做，爷爷看着呢。';
    }
    if (/爷爷|奶奶|外婆|姥爷|爸爸|妈妈|妈|爸|父|母|家人/.test(t)) {
      return '都在呢。你好好生活，他们就放心了。';
    }
    return '哎，爷爷听着呢。';
  }

  /* 拨号阶段 */
  function startDialing() {
    state = 'dialing';
    STAGE.statusText.textContent = '呼叫中…';
    STAGE.avatar.classList.add('pulsing');
    STAGE.dialDisplay.style.display = '';
    STAGE.dialPad.style.display = '';
    STAGE.callPanel.style.display = 'none';
    STAGE.btnCall.style.display = 'none';
    STAGE.btnEnd.style.display = '';
    STAGE.btnKeypad.style.display = 'none';
    STAGE.btnMute.style.display = 'none';
    STAGE.btnSpeaker.style.display = 'none';
    STAGE.tip.innerHTML = '📞 正在呼叫爷爷 · AI 复刻加载中…<br>请使用拨号键盘输入完整号码（演示中点任意 11 位即可），或直接点击挂断取消。';
    dialBuffer = '';
    renderDialDisplay();
  }
  function renderDialDisplay() {
    var remain = '';
    for (var r = 0; r < (11 - dialBuffer.length); r++) remain += '_';
    STAGE.dialDisplay.textContent = dialBuffer.split('').join(' ') + ' ' + remain;
  }

  /* 接通 */
  function connectCall() {
    state = 'connecting';
    STAGE.statusText.textContent = '正在接通…';
    STAGE.tip.innerHTML = '🔔 爷爷正在接听…';
    setTimeout(function () { enterCall(); }, 1100);
  }

  /* 通话中 */
  function enterCall() {
    state = 'inCall';
    STAGE.avatar.classList.remove('pulsing');
    STAGE.statusText.textContent = '通话中';
    STAGE.dialDisplay.style.display = 'none';
    STAGE.dialPad.style.display = 'none';
    STAGE.callPanel.style.display = '';
    STAGE.btnCall.style.display = 'none';
    STAGE.btnEnd.style.display = '';
    STAGE.btnKeypad.style.display = '';
    STAGE.btnMute.style.display = '';
    STAGE.btnSpeaker.style.display = '';
    STAGE.tip.innerHTML = '🎙️ 这是一通"打给爷爷"的电话 · AI 复刻仅用于家人之间的思念<br>⚖ 请先阅读 <a href="./page-ethics.html" style="color: var(--paper); text-decoration: underline;">伦理边界</a>。';
    STAGE.callTranscript.innerHTML = '';
    callSeconds = 0;
    updateTimer();
    timerId = setInterval(function () {
      callSeconds++;
      updateTimer();
    }, 1000);
    /* 播放爷爷的开场白 */
    var scene = SCENES[currentScene] || SCENES.greeting;
    var greet = (scene.open && scene.open[0]) || { side: 'departed', text: '哎，孩子。' };
    showTypingThenSay(greet.text, 700);
  }

  function updateTimer() {
    var m = Math.floor(callSeconds / 60), s = callSeconds % 60;
    STAGE.callTimer.textContent = '通话中 · ' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  }

  /* 挂断 */
  function endCall() {
    state = 'ended';
    if (timerId) { clearInterval(timerId); timerId = null; }
    STAGE.avatar.classList.remove('pulsing');
    STAGE.statusText.textContent = '通话结束';
    STAGE.callPanel.style.display = 'none';
    STAGE.dialPad.style.display = 'none';
    STAGE.dialDisplay.style.display = 'none';
    STAGE.btnCall.style.display = '';
    STAGE.btnEnd.style.display = 'none';
    STAGE.btnKeypad.style.display = 'none';
    STAGE.btnMute.style.display = 'none';
    STAGE.btnSpeaker.style.display = 'none';
    STAGE.tip.innerHTML = '📵 通话已结束 · 这一刻，可以把今天想说的话记到 <a href="./page-memory.html" style="color:var(--paper);text-decoration:underline;">家庭时间线</a>。';
  }

  /* 在 transcript 追加一条用户消息 */
  function appendLive(text) {
    var div = document.createElement('div');
    div.className = 'call-msg live';
    div.textContent = text;
    STAGE.callTranscript.appendChild(div);
    scrollTranscript();
  }
  function appendDeparted(text) {
    var div = document.createElement('div');
    div.className = 'call-msg departed';
    div.textContent = text;
    STAGE.callTranscript.appendChild(div);
    scrollTranscript();
  }
  function showTyping() {
    var div = document.createElement('div');
    div.className = 'call-msg departed';
    div.setAttribute('data-typing', '1');
    div.innerHTML = '<span class="typing"></span><span class="typing"></span><span class="typing"></span>';
    STAGE.callTranscript.appendChild(div);
    scrollTranscript();
  }
  function replaceTyping(text) {
    var t = STAGE.callTranscript.querySelector('[data-typing="1"]');
    if (t) { t.removeAttribute('data-typing'); t.textContent = text; }
    else { appendDeparted(text); }
    scrollTranscript();
  }
  function scrollTranscript() {
    STAGE.callTranscript.scrollTop = STAGE.callTranscript.scrollHeight;
  }
  function showTypingThenSay(text, delay) {
    showTyping();
    setTimeout(function () { replaceTyping(text); }, delay || 800);
  }

  /* 用户发送消息 */
  function sendUserMsg(raw) {
    var t = (raw || '').trim();
    if (!t) return;
    appendLive(t);
    STAGE.callUserInput.value = '';
    var reply;
    var scene = SCENES[currentScene] || SCENES.greeting;
    /* 兼容写法：找到第一条匹配前缀的 hint */
    var hint = null;
    if (scene.hints) {
      for (var i = 0; i < scene.hints.length; i++) {
        if (scene.hints[i].user.indexOf(t.slice(0, 6)) !== -1) { hint = scene.hints[i]; break; }
      }
    }
    if (hint) {
      reply = hint.reply;
    } else {
      reply = pickReplyByKeyword(t);
    }
    showTypingThenSay(reply, 900 + Math.min(t.length, 30) * 30);
  }

  /* 拨号键盘 */
  Array.prototype.forEach.call(STAGE.dialPad.querySelectorAll('.dial-key'), function (k) {
    k.addEventListener('click', function () {
      if (state !== 'dialing') return;
      var n = k.getAttribute('data-num');
      if (dialBuffer.length < 11) dialBuffer += n;
      renderDialDisplay();
      if (dialBuffer.length >= 11) {
        setTimeout(connectCall, 600);
      }
    });
  });

  /* 拨号按钮 → 开始 */
  STAGE.btnCall.addEventListener('click', function () { startDialing(); });
  /* 挂断 */
  STAGE.btnEnd.addEventListener('click', function () { endCall(); });
  /* 静音切换 */
  STAGE.btnMute.addEventListener('click', function () {
    var on = STAGE.btnMute.textContent.trim() === '🔇';
    STAGE.btnMute.textContent = on ? '🔊' : '🔇';
    if (window.__showToast) window.__showToast(on ? '已开启静音' : '已关闭静音');
  });
  /* 拨号键盘（通话中） */
  STAGE.btnKeypad.addEventListener('click', function () {
    var visible = STAGE.dialPad.style.display !== 'none';
    STAGE.dialPad.style.display = visible ? 'none' : '';
    STAGE.dialDisplay.style.display = visible ? 'none' : '';
  });
  /* 免提 */
  STAGE.btnSpeaker.addEventListener('click', function () {
    if (window.__showToast) window.__showToast('已切换免提');
  });

  /* 场景切换 */
  Array.prototype.forEach.call(STAGE.tabs.querySelectorAll('.scene-tab'), function (t) {
    t.addEventListener('click', function () {
      Array.prototype.forEach.call(STAGE.tabs.querySelectorAll('.scene-tab'), function (x) { x.classList.remove('active'); });
      t.classList.add('active');
      currentScene = t.getAttribute('data-scene') || 'greeting';
      if (state === 'inCall') {
        var scene = SCENES[currentScene] || SCENES.greeting;
        var greet = (scene.open && scene.open[0]) || { side: 'departed', text: '哎，孩子。' };
        appendDeparted('— 切换话题 —');
        showTypingThenSay(greet.text, 700);
      } else if (state === 'idle' || state === 'ended') {
        if (window.__showToast) window.__showToast('场景已切换：' + (currentScene === 'vent' ? '委屈倾诉' : currentScene === 'share' ? '分享喜悦' : currentScene === 'free' ? '自由对话' : '日常问候'));
      }
    });
  });

  /* 输入框发送 */
  STAGE.callInputForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (state !== 'inCall') return;
    sendUserMsg(STAGE.callUserInput.value);
  });

  /* 工具 */
  function escape(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();
