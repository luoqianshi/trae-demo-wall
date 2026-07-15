// ============================================================
// 难过组 - 治愈安抚类游戏集合
// 风格：温柔温暖，安抚情绪
// 包含4个独立游戏函数，供单页HTML游戏长廊调用
// ============================================================

// ===================== 游戏1：晚安星空 =====================
function gameStarsInit(root) {
  root.innerHTML =
    '<style>' +
    '.stars-wrap{position:relative;width:100%;height:100%;overflow:hidden;background:linear-gradient(180deg,#0a0a2e 0%,#1a1a4e 50%,#0f1f3a 100%);font-family:sans-serif;}' +
    '.stars-canvas{display:block;width:100%;height:100%;cursor:crosshair;}' +
    '.stars-hud{position:absolute;top:12px;left:12px;right:12px;display:flex;justify-content:space-between;color:#dfe9ff;font-size:14px;pointer-events:none;text-shadow:0 0 6px rgba(0,0,0,.6);}' +
    '.stars-progress-wrap{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);width:70%;max-width:380px;pointer-events:none;}' +
    '.stars-progress-label{text-align:center;color:#cfd8ff;font-size:12px;margin-bottom:6px;text-shadow:0 0 6px rgba(0,0,0,.6);}' +
    '.stars-progress-bar{height:8px;background:rgba(255,255,255,.12);border-radius:6px;overflow:hidden;}' +
    '.stars-progress-fill{height:100%;width:0%;background:linear-gradient(90deg,#7aa2ff,#c4a3ff);border-radius:6px;transition:width .4s ease;}' +
    '.stars-modal{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(5,5,20,.55);z-index:10;}' +
    '.stars-modal-card{background:linear-gradient(160deg,#2a2a55,#1a1a3e);border:1px solid rgba(255,255,255,.18);border-radius:18px;padding:26px 30px;text-align:center;color:#fff;max-width:80%;box-shadow:0 8px 40px rgba(120,90,255,.35);}' +
    '.stars-modal-title{font-size:20px;margin-bottom:8px;}' +
    '.stars-modal-sub{font-size:13px;color:#b8c0e8;margin-bottom:16px;line-height:1.6;}' +
    '.stars-modal-btn{padding:8px 22px;border:none;border-radius:20px;background:linear-gradient(90deg,#7aa2ff,#c4a3ff);color:#fff;cursor:pointer;font-size:13px;}' +
    '.stars-tip{position:absolute;bottom:60px;left:50%;transform:translateX(-50%);color:#aab4e0;font-size:12px;pointer-events:none;opacity:.8;}' +
    '</style>' +
    '<div class="stars-wrap">' +
    '<canvas class="stars-canvas"></canvas>' +
    '<div class="stars-hud"><span>✨ 已点亮 <b class="stars-count">0</b> 颗星</span><span>🌟 已解锁 <b class="stars-const-count">0</b> / 5 星座</span></div>' +
    '<div class="stars-tip">轻点夜空，点亮一颗星</div>' +
    '<div class="stars-progress-wrap"><div class="stars-progress-label">下一座星座：<span class="stars-cur-name">大熊座</span></div><div class="stars-progress-bar"><div class="stars-progress-fill"></div></div></div>' +
    '<div class="stars-modal"><div class="stars-modal-card"><div class="stars-modal-title"></div><div class="stars-modal-sub"></div><button class="stars-modal-btn">继续看星星</button></div></div>' +
    '</div>';

  // 元素引用
  var canvas = root.querySelector('.stars-canvas');
  var ctx = canvas.getContext('2d');
  var countEl = root.querySelector('.stars-count');
  var constCountEl = root.querySelector('.stars-const-count');
  var fillEl = root.querySelector('.stars-progress-fill');
  var curNameEl = root.querySelector('.stars-cur-name');
  var modal = root.querySelector('.stars-modal');
  var modalTitle = root.querySelector('.stars-modal-title');
  var modalSub = root.querySelector('.stars-modal-sub');
  var modalBtn = root.querySelector('.stars-modal-btn');

  // 适配尺寸
  function resize() {
    canvas.width = canvas.clientWidth || 400;
    canvas.height = canvas.clientHeight || 400;
  }
  resize();
  window.addEventListener('resize', resize);

  // 星座数据（归一化坐标 0~1）
  var constellations = [
    { name: '大熊座', desc: '北斗指引方向，愿你今晚不再迷路。', stars: [[0.2,0.3],[0.28,0.32],[0.36,0.34],[0.44,0.36],[0.5,0.42],[0.54,0.5],[0.46,0.52]] },
    { name: '仙后座', desc: 'W 形的她，正温柔地望着你。', stars: [[0.2,0.4],[0.3,0.3],[0.4,0.42],[0.5,0.3],[0.6,0.4]] },
    { name: '猎户座', desc: '夜空猎人，守护你每一个梦。', stars: [[0.3,0.25],[0.35,0.32],[0.4,0.4],[0.45,0.48],[0.5,0.32],[0.55,0.25],[0.4,0.55]] },
    { name: '天琴座', desc: '织女的琴声，抚平所有忧伤。', stars: [[0.4,0.3],[0.45,0.4],[0.5,0.5],[0.42,0.5],[0.38,0.4]] },
    { name: '天鹅座', desc: '十字形的飞鸟，带你飞越今夜。', stars: [[0.3,0.3],[0.4,0.4],[0.5,0.5],[0.6,0.4],[0.5,0.3]] }
  ];

  // 背景小星星
  var bgStars = [];
  for (var i = 0; i < 90; i++) {
    bgStars.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.2 + 0.3, phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() * 1.5 });
  }

  var userStars = [];     // 玩家点亮的星星
  var meteors = [];       // 流星
  var particles = [];     // 庆祝粒子
  var halos = [];         // 光晕扩散
  var unlocked = [];      // 已解锁星座
  var curConstIdx = 0;
  var starsTowardNext = 0;

  // Web Audio 轻柔音效
  var audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function playDing(freq) {
    var ac = ensureAudio();
    if (!ac) return;
    var o = ac.createOscillator();
    var g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = freq || 880;
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.15, ac.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.6);
    o.connect(g).connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + 0.7);
  }
  function playChord() {
    [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { playDing(f); }, i * 120); });
  }

  // 更新 HUD
  function updateHUD() {
    countEl.textContent = userStars.length;
    constCountEl.textContent = unlocked.length;
    if (curConstIdx < constellations.length) {
      curNameEl.textContent = constellations[curConstIdx].name;
      fillEl.style.width = (starsTowardNext / 10 * 100) + '%';
    } else {
      curNameEl.textContent = '星空已圆满';
      fillEl.style.width = '100%';
    }
  }

  // 添加一颗星星
  function addStar(x, y) {
    userStars.push({ x: x, y: y, r: 1.5 + Math.random() * 1.5, phase: Math.random() * Math.PI * 2 });
    halos.push({ x: x, y: y, r: 4, alpha: 1 });
    playDing(660 + Math.random() * 220);
    starsTowardNext++;
    if (starsTowardNext >= 10 && curConstIdx < constellations.length) {
      unlockConstellation();
    }
    updateHUD();
  }

  // 解锁星座
  function unlockConstellation() {
    var c = constellations[curConstIdx];
    var placed = {
      name: c.name,
      desc: c.desc,
      points: c.stars.map(function (p) { return { x: canvas.width * (0.2 + p[0] * 0.6), y: canvas.height * (0.15 + p[1] * 0.5) }; })
    };
    unlocked.push(placed);
    curConstIdx++;
    starsTowardNext = 0;
    // 粒子庆祝
    var cx = canvas.width / 2, cy = canvas.height / 2;
    var colors = ['#ffd6a5', '#caffbf', '#a0c4ff', '#bdb2ff', '#ffc6ff'];
    for (var i = 0; i < 70; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 1 + Math.random() * 4;
      particles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color: colors[Math.floor(Math.random() * colors.length)] });
    }
    playChord();
    modalTitle.textContent = '🌟 解锁星座：' + c.name;
    modalSub.textContent = c.desc;
    modal.style.display = 'flex';
  }

  modalBtn.addEventListener('click', function () { modal.style.display = 'none'; });

  // 点击/触摸创建星星
  function handlePointer(e) {
    var rect = canvas.getBoundingClientRect();
    var x, y;
    if (e.touches && e.touches[0]) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    ensureAudio();
    addStar(x, y);
  }
  canvas.addEventListener('mousedown', handlePointer);
  canvas.addEventListener('touchstart', function (e) { e.preventDefault(); handlePointer(e); }, { passive: false });

  // 随机流星
  function maybeSpawnMeteor() {
    if (Math.random() < 0.004 && meteors.length < 2) {
      meteors.push({ x: Math.random() * canvas.width, y: -20, vx: 3 + Math.random() * 3, vy: 4 + Math.random() * 3, life: 1 });
    }
  }

  // 主循环
  var t = 0;
  function loop() {
    t += 0.016;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景星星闪烁
    for (var i = 0; i < bgStars.length; i++) {
      var s = bgStars[i];
      var tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(220,230,255,' + tw + ')';
      ctx.fill();
    }

    // 已解锁星座连线
    for (var ci = 0; ci < unlocked.length; ci++) {
      var c = unlocked[ci];
      ctx.strokeStyle = 'rgba(180,200,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var pi = 0; pi < c.points.length; pi++) {
        var p = c.points[pi];
        if (pi === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(220,230,255,0.85)';
      ctx.font = '13px sans-serif';
      ctx.fillText(c.name, c.points[0].x, c.points[0].y - 10);
      for (var pj = 0; pj < c.points.length; pj++) {
        ctx.beginPath();
        ctx.arc(c.points[pj].x, c.points[pj].y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,240,200,0.9)';
        ctx.fill();
      }
    }

    // 玩家星星
    for (var ui = 0; ui < userStars.length; ui++) {
      var us = userStars[ui];
      var utw = 0.6 + 0.4 * Math.sin(t * 3 + us.phase);
      ctx.beginPath();
      ctx.arc(us.x, us.y, us.r * utw, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,250,220,0.95)';
      ctx.shadowColor = 'rgba(255,240,180,0.8)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 光晕扩散
    for (var hi = halos.length - 1; hi >= 0; hi--) {
      var h = halos[hi];
      h.r += 1.2; h.alpha -= 0.025;
      if (h.alpha <= 0) { halos.splice(hi, 1); continue; }
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(200,220,255,' + h.alpha + ')';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 流星
    maybeSpawnMeteor();
    for (var mi = meteors.length - 1; mi >= 0; mi--) {
      var m = meteors[mi];
      m.x += m.vx; m.y += m.vy;
      var grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 6, m.y - m.vy * 6);
      grad.addColorStop(0, 'rgba(255,255,255,0.9)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.vx * 6, m.y - m.vy * 6);
      ctx.stroke();
      if (m.y > canvas.height + 50 || m.x > canvas.width + 50) meteors.splice(mi, 1);
    }

    // 庆祝粒子
    for (var pai = particles.length - 1; pai >= 0; pai--) {
      var pa = particles[pai];
      pa.x += pa.vx; pa.y += pa.vy; pa.vy += 0.05; pa.life -= 0.012;
      if (pa.life <= 0) { particles.splice(pai, 1); continue; }
      ctx.globalAlpha = pa.life;
      ctx.fillStyle = pa.color;
      ctx.beginPath();
      ctx.arc(pa.x, pa.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(loop);
  }
  loop();
  updateHUD();
}

// ===================== 游戏2：猫咪陪你 =====================
function gameCatInit(root) {
  root.innerHTML =
    '<style>' +
    '.cat-wrap{position:relative;width:100%;height:100%;overflow:hidden;background:linear-gradient(180deg,#1a2238 0%,#2a3050 100%);font-family:sans-serif;}' +
    '.cat-rain{position:absolute;inset:0;pointer-events:none;overflow:hidden;}' +
    '.cat-raindrop{position:absolute;width:2px;height:14px;background:linear-gradient(180deg,transparent,rgba(180,200,255,.5));animation:cat-fall linear infinite;}' +
    '@keyframes cat-fall{from{transform:translateY(-20px);}to{transform:translateY(110vh);}}' +
    '.cat-stage{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}' +
    '.cat-mood{position:absolute;top:16px;left:16px;width:150px;color:#ffd9a0;}' +
    '.cat-mood-label{font-size:12px;margin-bottom:4px;}' +
    '.cat-mood-bar{height:8px;background:rgba(255,255,255,.12);border-radius:6px;overflow:hidden;}' +
    '.cat-mood-fill{height:100%;width:0%;background:linear-gradient(90deg,#ffb86b,#ff8fb1);border-radius:6px;transition:width .3s;}' +
    '.cat-emoji{font-size:26px;margin-top:6px;}' +
    '.cat-flower-count{position:absolute;top:16px;right:16px;color:#ffd9a0;font-size:13px;}' +
    '.cat-body{position:relative;width:180px;height:160px;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:none;}' +
    '.cat-ear-l,.cat-ear-r{position:absolute;top:0;width:0;height:0;border-left:26px solid transparent;border-right:26px solid transparent;border-bottom:42px solid #f5a623;}' +
    '.cat-ear-l{left:24px;transform:rotate(-15deg);}' +
    '.cat-ear-r{right:24px;transform:rotate(15deg);}' +
    '.cat-head{position:absolute;top:22px;left:30px;width:120px;height:100px;background:#f5a623;border-radius:50%;}' +
    '.cat-eye-l,.cat-eye-r{position:absolute;top:52px;width:14px;height:18px;background:#3a2a1a;border-radius:50%;transition:height .12s;}' +
    '.cat-eye-l{left:62px;}.cat-eye-r{right:62px;}' +
    '.cat-body.blink .cat-eye-l,.cat-body.blink .cat-eye-r{height:2px;}' +
    '.cat-nose{position:absolute;top:74px;left:50%;transform:translateX(-50%);width:10px;height:7px;background:#ff8fb1;border-radius:50%;}' +
    '.cat-mouth{position:absolute;top:82px;left:50%;transform:translateX(-50%);width:20px;height:8px;border-bottom:2px solid #3a2a1a;border-radius:0 0 20px 20px;transition:all .2s;}' +
    '.cat-body.yawn .cat-mouth{height:18px;width:16px;background:#6a3a2a;border:none;border-radius:50%;}' +
    '.cat-tail{position:absolute;right:-10px;bottom:30px;width:70px;height:16px;background:#f5a623;border-radius:10px;transform-origin:left center;animation:cat-tail-wag 2s ease-in-out infinite;}' +
    '@keyframes cat-tail-wag{0%,100%{transform:rotate(-10deg);}50%{transform:rotate(15deg);}}' +
    '.cat-body.stretch{animation:cat-stretch .8s ease;}' +
    '@keyframes cat-stretch{0%,100%{transform:scale(1);}50%{transform:scaleY(.88) scaleX(1.08);}}' +
    '.cat-controls{position:absolute;bottom:30px;left:50%;transform:translateX(-50%);display:flex;gap:14px;}' +
    '.cat-btn{padding:10px 18px;border:none;border-radius:22px;background:linear-gradient(90deg,#ffb86b,#ff8fb1);color:#fff;font-size:14px;cursor:pointer;box-shadow:0 4px 14px rgba(255,140,100,.3);}' +
    '.cat-fish{position:absolute;font-size:26px;pointer-events:none;z-index:5;}' +
    '.cat-flower-pop{position:absolute;font-size:24px;pointer-events:none;animation:cat-flower-up 1.5s ease forwards;z-index:6;}' +
    '@keyframes cat-flower-up{0%{opacity:0;transform:translateY(0) scale(.5);}30%{opacity:1;}100%{opacity:0;transform:translateY(-90px) scale(1.2);}}' +
    '.cat-tip{position:absolute;bottom:84px;left:50%;transform:translateX(-50%);color:#ffd9a0;font-size:12px;opacity:.85;}' +
    '.cat-hearts{position:absolute;font-size:20px;pointer-events:none;animation:cat-heart-up 1.2s ease forwards;z-index:6;}' +
    '@keyframes cat-heart-up{0%{opacity:0;transform:translateY(0) scale(.5);}30%{opacity:1;}100%{opacity:0;transform:translateY(-60px) scale(1);}}' +
    '</style>' +
    '<div class="cat-wrap">' +
    '<div class="cat-rain" id="catRain"></div>' +
    '<div class="cat-mood"><div class="cat-mood-label">心情 <span class="cat-mood-val">0</span>/30</div><div class="cat-mood-bar"><div class="cat-mood-fill"></div></div><div class="cat-emoji">😴</div></div>' +
    '<div class="cat-flower-count">🌸 收集 <span class="cat-flowers">0</span> 朵</div>' +
    '<div class="cat-stage"><div class="cat-body"><div class="cat-ear-l"></div><div class="cat-ear-r"></div><div class="cat-head"></div><div class="cat-eye-l"></div><div class="cat-eye-r"></div><div class="cat-nose"></div><div class="cat-mouth"></div><div class="cat-tail"></div></div></div>' +
    '<div class="cat-tip">轻轻抚摸小猫 🐱</div>' +
    '<div class="cat-controls"><button class="cat-btn" id="catFeed">🐟 喂小鱼</button></div>' +
    '</div>';

  // 生成雨滴
  var rainBox = root.querySelector('#catRain');
  for (var i = 0; i < 60; i++) {
    var drop = document.createElement('div');
    drop.className = 'cat-raindrop';
    drop.style.left = (Math.random() * 100) + '%';
    drop.style.animationDuration = (0.6 + Math.random() * 0.8) + 's';
    drop.style.animationDelay = (Math.random() * 2) + 's';
    drop.style.opacity = (0.3 + Math.random() * 0.5);
    rainBox.appendChild(drop);
  }

  // 元素引用
  var catBody = root.querySelector('.cat-body');
  var moodFill = root.querySelector('.cat-mood-fill');
  var moodVal = root.querySelector('.cat-mood-val');
  var emojiEl = root.querySelector('.cat-emoji');
  var flowersEl = root.querySelector('.cat-flowers');
  var feedBtn = root.querySelector('#catFeed');
  var wrap = root.querySelector('.cat-wrap');

  // 状态
  var mood = 0;
  var flowers = 0;
  try { flowers = parseInt(localStorage.getItem('xinji_cat_flowers') || '0', 10) || 0; } catch (e) {}
  var lastStroke = 0;

  // Web Audio 呼噜声
  var audioCtx = null;
  var purrOsc = null, purrGain = null;
  function ensureAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function startPurr() {
    var ac = ensureAudio();
    if (!ac || purrOsc) return;
    purrOsc = ac.createOscillator();
    purrGain = ac.createGain();
    purrOsc.type = 'sine';
    purrOsc.frequency.value = 55;
    purrGain.gain.value = 0;
    purrOsc.connect(purrGain).connect(ac.destination);
    purrOsc.start();
    // 轻微频率调制模拟呼噜
    var lfo = ac.createOscillator();
    var lfoGain = ac.createGain();
    lfo.frequency.value = 6;
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain).connect(purrOsc.frequency);
    lfo.start();
    purrOsc._lfo = lfo;
  }
  function setPurrVolume(v) {
    if (purrGain) purrGain.gain.setTargetAtTime(v, audioCtx.currentTime, 0.3);
  }
  function playMeow() {
    var ac = ensureAudio();
    if (!ac) return;
    var o = ac.createOscillator();
    var g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(600, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(900, ac.currentTime + 0.15);
    o.frequency.exponentialRampToValueAtTime(500, ac.currentTime + 0.3);
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.08, ac.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.4);
    o.connect(g).connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + 0.45);
  }

  // 更新心情显示
  function updateMood() {
    moodVal.textContent = mood;
    moodFill.style.width = Math.min(mood / 30 * 100, 100) + '%';
    var emoji;
    if (mood < 5) emoji = '😴';
    else if (mood < 12) emoji = '😊';
    else if (mood < 22) emoji = '🥰';
    else emoji = '😻';
    emojiEl.textContent = emoji;
  }

  // 弹出小花
  function popFlower() {
    flowers++;
    try { localStorage.setItem('xinji_cat_flowers', String(flowers)); } catch (e) {}
    flowersEl.textContent = flowers;
    var f = document.createElement('div');
    f.className = 'cat-flower-pop';
    f.textContent = '🌸';
    var rect = catBody.getBoundingClientRect();
    var wrect = wrap.getBoundingClientRect();
    f.style.left = (rect.left - wrect.left + rect.width / 2 - 12) + 'px';
    f.style.top = (rect.top - wrect.top + 20) + 'px';
    wrap.appendChild(f);
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1500);
  }

  function popHeart(x, y) {
    var h = document.createElement('div');
    h.className = 'cat-hearts';
    h.textContent = ['💛', '💕', '✨'][Math.floor(Math.random() * 3)];
    h.style.left = x + 'px';
    h.style.top = y + 'px';
    wrap.appendChild(h);
    setTimeout(function () { if (h.parentNode) h.parentNode.removeChild(h); }, 1200);
  }

  // 抚摸猫咪
  function stroke(clientX, clientY) {
    var now = Date.now();
    if (now - lastStroke < 150) return; // 节流
    lastStroke = now;
    mood = Math.min(mood + 1, 30);
    updateMood();
    var rect = wrap.getBoundingClientRect();
    popHeart(clientX - rect.left, clientY - rect.top - 20);
    startPurr();
    setPurrVolume(0.05);
    // 每10心情送花
    if (mood % 10 === 0 && mood > 0) {
      popFlower();
      playMeow();
    }
    clearTimeout(window._catPurrTimer);
    window._catPurrTimer = setTimeout(function () { setPurrVolume(0); }, 800);
  }

  function strokeHandler(e) {
    var x, y;
    if (e.touches && e.touches[0]) { x = e.touches[0].clientX; y = e.touches[0].clientY; }
    else { x = e.clientX; y = e.clientY; }
    ensureAudio();
    stroke(x, y);
  }
  catBody.addEventListener('mousemove', function (e) { strokeHandler(e); });
  catBody.addEventListener('touchmove', function (e) { e.preventDefault(); strokeHandler(e); }, { passive: false });
  catBody.addEventListener('mousedown', function (e) { ensureAudio(); strokeHandler(e); });
  catBody.addEventListener('touchstart', function (e) { e.preventDefault(); ensureAudio(); strokeHandler(e); }, { passive: false });

  // 喂鱼按钮
  feedBtn.addEventListener('click', function () {
    ensureAudio();
    var fish = document.createElement('div');
    fish.className = 'cat-fish';
    fish.textContent = '🐟';
    var wrect = wrap.getBoundingClientRect();
    var brect = catBody.getBoundingClientRect();
    var startX = 20, startY = wrect.height - 60;
    var endX = (brect.left - wrect.left) + brect.width / 2 - 13;
    var endY = (brect.top - wrect.top) + 50;
    fish.style.left = startX + 'px';
    fish.style.top = startY + 'px';
    fish.style.transition = 'all .9s cubic-bezier(.4,.8,.5,1)';
    wrap.appendChild(fish);
    requestAnimationFrame(function () {
      fish.style.left = endX + 'px';
      fish.style.top = endY + 'px';
      fish.style.transform = 'rotate(360deg) scale(.5)';
    });
    setTimeout(function () {
      if (fish.parentNode) fish.parentNode.removeChild(fish);
      mood = Math.min(mood + 3, 30);
      updateMood();
      popHeart(endX + 13, endY);
      playMeow();
      if (mood % 10 < 3 && mood >= 10) popFlower();
    }, 900);
  });

  // 随机动画：眨眼/打哈欠/伸懒腰
  function randomAnim() {
    var r = Math.random();
    if (r < 0.5) {
      // 眨眼
      catBody.classList.add('blink');
      setTimeout(function () { catBody.classList.remove('blink'); }, 160);
    } else if (r < 0.8) {
      // 打哈欠
      catBody.classList.add('yawn');
      setTimeout(function () { catBody.classList.remove('yawn'); }, 900);
    } else {
      // 伸懒腰
      catBody.classList.add('stretch');
      setTimeout(function () { catBody.classList.remove('stretch'); }, 800);
    }
    setTimeout(randomAnim, 2500 + Math.random() * 3500);
  }
  setTimeout(randomAnim, 2000);

  updateMood();
  flowersEl.textContent = flowers;
}

// ===================== 游戏3：种一朵花 =====================
function gameFlowerInit(root) {
  root.innerHTML =
    '<style>' +
    '.flower-wrap{position:relative;width:100%;height:100%;overflow:hidden;background:linear-gradient(180deg,#3a2a4e 0%,#4a3a5e 60%,#3a3a4e 100%);font-family:sans-serif;}' +
    '.flower-petals-bg{position:absolute;inset:0;pointer-events:none;overflow:hidden;}' +
    '.flower-petal{position:absolute;font-size:18px;animation:flower-fall linear infinite;opacity:.7;}' +
    '@keyframes flower-fall{0%{transform:translateY(-30px) rotate(0deg);}100%{transform:translateY(110vh) rotate(360deg);}}' +
    '.flower-canvas-wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;}' +
    '.flower-canvas{display:block;}' +
    '.flower-hud{position:absolute;top:16px;left:16px;right:16px;display:flex;justify-content:space-between;color:#f5e0c0;font-size:13px;}' +
    '.flower-stage-label{color:#ffd9a0;font-size:14px;}' +
    '.flower-garden-count{color:#ffd9a0;font-size:13px;}' +
    '.flower-progress-wrap{position:absolute;bottom:90px;left:50%;transform:translateX(-50%);width:70%;max-width:340px;}' +
    '.flower-progress-label{text-align:center;color:#f5e0c0;font-size:12px;margin-bottom:6px;}' +
    '.flower-progress-bar{height:8px;background:rgba(255,255,255,.12);border-radius:6px;overflow:hidden;}' +
    '.flower-progress-fill{height:100%;width:0%;background:linear-gradient(90deg,#a0e0a0,#ffd6a5);border-radius:6px;transition:width .4s;}' +
    '.flower-controls{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);display:flex;gap:12px;}' +
    '.flower-btn{padding:10px 16px;border:none;border-radius:22px;background:linear-gradient(90deg,#a0d8a0,#ffd6a5);color:#3a2a1a;font-size:14px;cursor:pointer;box-shadow:0 4px 14px rgba(160,200,120,.3);}' +
    '.flower-modal{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(20,15,30,.6);z-index:20;}' +
    '.flower-modal-card{background:linear-gradient(160deg,#3a2a4e,#2a1a3e);border:1px solid rgba(255,255,255,.18);border-radius:18px;padding:24px;width:80%;max-width:340px;color:#fff;}' +
    '.flower-modal-title{font-size:16px;margin-bottom:10px;color:#ffd9a0;}' +
    '.flower-input{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;font-size:13px;margin-bottom:10px;}' +
    '.flower-modal-btns{display:flex;gap:8px;justify-content:flex-end;}' +
    '.flower-modal-btn{padding:6px 16px;border:none;border-radius:16px;cursor:pointer;font-size:13px;}' +
    '.flower-modal-ok{background:linear-gradient(90deg,#a0d8a0,#ffd6a5);color:#3a2a1a;}' +
    '.flower-modal-cancel{background:rgba(255,255,255,.15);color:#fff;}' +
    '.flower-garden-btn{position:absolute;top:42px;right:16px;padding:6px 12px;border:1px solid rgba(255,217,160,.4);border-radius:16px;background:rgba(255,217,160,.1);color:#ffd9a0;font-size:12px;cursor:pointer;}' +
    '.flower-garden-list{margin-top:12px;max-height:200px;overflow-y:auto;font-size:20px;line-height:1.8;}' +
    '.flower-tip{position:absolute;bottom:130px;left:50%;transform:translateX(-50%);color:#f5e0c0;font-size:12px;opacity:.8;}' +
    '</style>' +
    '<div class="flower-wrap">' +
    '<div class="flower-petals-bg" id="flowerPetals"></div>' +
    '<div class="flower-hud"><span class="flower-stage-label">阶段：<span class="flower-stage-name">种子</span></span></div>' +
    '<button class="flower-garden-btn" id="flowerGardenBtn">🌷 我的花园</button>' +
    '<div class="flower-canvas-wrap"><canvas class="flower-canvas" width="360" height="420"></canvas></div>' +
    '<div class="flower-tip">照顾它，看着它慢慢长大</div>' +
    '<div class="flower-progress-wrap"><div class="flower-progress-label">生长进度 <span class="flower-progress-val">0</span>%</div><div class="flower-progress-bar"><div class="flower-progress-fill"></div></div></div>' +
    '<div class="flower-controls"><button class="flower-btn" id="flowerWater">💧 浇水</button><button class="flower-btn" id="flowerSun">☀️ 晒太阳</button><button class="flower-btn" id="flowerTalk">💬 说话</button></div>' +
    '<div class="flower-modal"><div class="flower-modal-card"><div class="flower-modal-title">对小花说句话吧 🌱</div><input class="flower-input" type="text" placeholder="今天的心情..." maxlength="40"><div class="flower-modal-btns"><button class="flower-modal-btn flower-modal-cancel">取消</button><button class="flower-modal-btn flower-modal-ok">种下</button></div></div></div>' +
    '<div class="flower-modal" id="flowerGardenModal"><div class="flower-modal-card"><div class="flower-modal-title">🌷 我的花园</div><div class="flower-garden-list"></div><div class="flower-modal-btns"><button class="flower-modal-btn flower-modal-ok">关闭</button></div></div></div>' +
    '</div>';

  // 飘落花瓣背景
  var petalsBox = root.querySelector('#flowerPetals');
  var petalEmojis = ['🌸', '🌼', '💮', '🌺'];
  for (var i = 0; i < 18; i++) {
    var p = document.createElement('div');
    p.className = 'flower-petal';
    p.textContent = petalEmojis[Math.floor(Math.random() * petalEmojis.length)];
    p.style.left = (Math.random() * 100) + '%';
    p.style.animationDuration = (6 + Math.random() * 8) + 's';
    p.style.animationDelay = (Math.random() * 8) + 's';
    p.style.fontSize = (12 + Math.random() * 12) + 'px';
    petalsBox.appendChild(p);
  }

  var canvas = root.querySelector('.flower-canvas');
  var ctx = canvas.getContext('2d');
  var stageNameEl = root.querySelector('.flower-stage-name');
  var progressFill = root.querySelector('.flower-progress-fill');
  var progressVal = root.querySelector('.flower-progress-val');
  var waterBtn = root.querySelector('#flowerWater');
  var sunBtn = root.querySelector('#flowerSun');
  var talkBtn = root.querySelector('#flowerTalk');
  var modal = root.querySelector('.flower-modal');
  var gardenModal = root.querySelector('#flowerGardenModal');
  var gardenBtn = root.querySelector('#flowerGardenBtn');
  var input = root.querySelector('.flower-input');
  var okBtn = root.querySelector('.flower-modal-ok');
  var cancelBtn = root.querySelector('.flower-modal-cancel');
  var gardenList = root.querySelector('.flower-garden-list');

  // 阶段名
  var STAGES = ['种子', '发芽', '小苗', '含苞', '开花'];

  // 状态
  var stage = 0;          // 0~4
  var progress = 0;       // 当前阶段进度 0~100
  var flowerColor = '#ff8fb1'; // 花朵颜色
  var lastWords = '';
  var bloomed = false;    // 是否已开花
  var sway = 0;

  // 花园记录
  function loadGarden() {
    try { return JSON.parse(localStorage.getItem('xinji_flower_garden') || '[]'); } catch (e) { return []; }
  }
  function saveGarden(arr) {
    try { localStorage.setItem('xinji_flower_garden', JSON.stringify(arr)); } catch (e) {}
  }

  // Web Audio
  var audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function playTone(freq, dur) {
    var ac = ensureAudio();
    if (!ac) return;
    var o = ac.createOscillator();
    var g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.1, ac.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + (dur || 0.4));
    o.connect(g).connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + (dur || 0.4) + 0.05);
  }

  // 根据话语决定花色
  function decideColor(words) {
    var warm = ['开心', '快乐', '高兴', '喜欢', '爱', '好', '棒', '笑', '甜', '暖', '美', '幸', '喜', '谢谢', '希望'];
    var cool = ['难过', '伤心', '哭', '痛', '累', '烦', '忧', '愁', '想', '念', '孤', '黑', '怕', '疼', '委屈'];
    var calm = ['平静', '安静', '梦', '星', '月', '云', '空', '海', '蓝', '紫', '风', '静', '远'];
    var warmColors = ['#ff8fb1', '#ff6b6b', '#ffb86b', '#ffd93d', '#ff9a8b'];
    var coolColors = ['#6bc1ff', '#6bffa0', '#8be9fd', '#5ad1cd'];
    var calmColors = ['#a29bfe', '#74b9ff', '#b388ff', '#7aa2ff'];
    var wCount = 0, cCount = 0, calmCount = 0;
    warm.forEach(function (k) { if (words.indexOf(k) >= 0) wCount++; });
    cool.forEach(function (k) { if (words.indexOf(k) >= 0) cCount++; });
    calm.forEach(function (k) { if (words.indexOf(k) >= 0) calmCount++; });
    if (wCount >= cCount && wCount >= calmCount) return warmColors[Math.floor(Math.random() * warmColors.length)];
    if (cCount >= calmCount) return coolColors[Math.floor(Math.random() * coolColors.length)];
    if (calmCount > 0) return calmColors[Math.floor(Math.random() * calmColors.length)];
    // 无关键词，混合
    var all = warmColors.concat(calmColors);
    return all[Math.floor(Math.random() * all.length)];
  }

  // 绘制
  function draw() {
    sway += 0.02;
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    var cx = w / 2;
    var potTop = h - 150;

    // 花盆
    ctx.fillStyle = '#a85a3a';
    ctx.beginPath();
    ctx.moveTo(cx - 70, potTop);
    ctx.lineTo(cx + 70, potTop);
    ctx.lineTo(cx + 55, h - 30);
    ctx.lineTo(cx - 55, h - 30);
    ctx.closePath();
    ctx.fill();
    // 盆口
    ctx.fillStyle = '#8a4a2e';
    ctx.fillRect(cx - 76, potTop - 12, 152, 16);
    // 土壤
    ctx.fillStyle = '#4a2a1a';
    ctx.fillRect(cx - 68, potTop + 2, 136, 14);

    // 根据阶段绘制
    var baseY = potTop + 4;
    var swayOff = Math.sin(sway) * 3;

    if (stage === 0) {
      // 种子
      ctx.fillStyle = '#6a4a2a';
      ctx.beginPath();
      ctx.ellipse(cx, baseY - 4, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (stage === 1) {
      // 发芽
      ctx.strokeStyle = '#7ac74f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, baseY);
      ctx.lineTo(cx + swayOff, baseY - 20);
      ctx.stroke();
      ctx.fillStyle = '#a0e060';
      ctx.beginPath();
      ctx.ellipse(cx - 6 + swayOff, baseY - 18, 6, 3, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 6 + swayOff, baseY - 18, 6, 3, 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (stage === 2) {
      // 小苗
      ctx.strokeStyle = '#5aa030';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, baseY);
      ctx.lineTo(cx + swayOff, baseY - 70);
      ctx.stroke();
      // 叶子
      ctx.fillStyle = '#7ac74f';
      ctx.beginPath();
      ctx.ellipse(cx - 14 + swayOff * 0.6, baseY - 35, 14, 7, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 14 + swayOff * 0.6, baseY - 50, 14, 7, 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (stage === 3) {
      // 含苞
      ctx.strokeStyle = '#4a8a2a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, baseY);
      ctx.lineTo(cx + swayOff, baseY - 110);
      ctx.stroke();
      ctx.fillStyle = '#7ac74f';
      ctx.beginPath();
      ctx.ellipse(cx - 16 + swayOff * 0.6, baseY - 55, 16, 8, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 16 + swayOff * 0.6, baseY - 80, 16, 8, 0.6, 0, Math.PI * 2);
      ctx.fill();
      // 花苞
      ctx.fillStyle = flowerColor;
      ctx.beginPath();
      ctx.ellipse(cx + swayOff, baseY - 118, 10, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.ellipse(cx - 3 + swayOff, baseY - 122, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (stage === 4) {
      // 开花
      ctx.strokeStyle = '#4a8a2a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, baseY);
      ctx.lineTo(cx + swayOff, baseY - 110);
      ctx.stroke();
      ctx.fillStyle = '#7ac74f';
      ctx.beginPath();
      ctx.ellipse(cx - 16 + swayOff * 0.6, baseY - 55, 16, 8, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 16 + swayOff * 0.6, baseY - 85, 16, 8, 0.6, 0, Math.PI * 2);
      ctx.fill();
      // 花朵
      var fx = cx + swayOff, fy = baseY - 120;
      for (var p = 0; p < 6; p++) {
        var ang = (p / 6) * Math.PI * 2;
        ctx.fillStyle = flowerColor;
        ctx.beginPath();
        ctx.ellipse(fx + Math.cos(ang) * 12, fy + Math.sin(ang) * 12, 10, 7, ang, 0, Math.PI * 2);
        ctx.fill();
      }
      // 花心
      ctx.fillStyle = '#ffd93d';
      ctx.beginPath();
      ctx.arc(fx, fy, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function updateUI() {
    stageNameEl.textContent = STAGES[stage];
    progressVal.textContent = Math.floor(progress);
    progressFill.style.width = progress + '%';
  }

  // 增加进度
  function addProgress(amount, color) {
    if (bloomed) return;
    if (color) flowerColor = color;
    progress = Math.min(progress + amount, 100);
    if (progress >= 100) {
      if (stage < 4) {
        stage++;
        progress = 0;
        playTone(stage === 4 ? 880 : 660, 0.5);
        if (stage === 4) {
          bloomed = true;
          // 开花，记录到花园
          var garden = loadGarden();
          garden.push({ color: flowerColor, words: lastWords, time: Date.now() });
          saveGarden(garden);
          setTimeout(function () { showBloomTip(); }, 300);
        }
      }
    }
    updateUI();
  }

  function showBloomTip() {
    var tip = root.querySelector('.flower-tip');
    tip.textContent = '🌸 花开了！点击花朵收种子，再种下一朵';
    tip.style.opacity = '1';
  }

  // 点击花朵收种子
  canvas.addEventListener('click', function (e) {
    if (!bloomed) return;
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var cx = canvas.width / 2;
    var baseY = canvas.height - 150 + 4 - 120;
    // 判断是否点击花头区域
    if (Math.abs(x - cx) < 30 && Math.abs(y - baseY) < 30) {
      // 收种子，重置
      stage = 0;
      progress = 0;
      bloomed = false;
      flowerColor = '#ff8fb1';
      lastWords = '';
      var tip = root.querySelector('.flower-tip');
      tip.textContent = '种子已收回，照顾它，看着它慢慢长大';
      setTimeout(function () { tip.textContent = '照顾它，看着它慢慢长大'; }, 2500);
      playTone(523, 0.4);
      updateUI();
    }
  });

  // 照顾按钮
  waterBtn.addEventListener('click', function () {
    ensureAudio();
    addProgress(20);
    playTone(440, 0.2);
    var tip = root.querySelector('.flower-tip');
    tip.textContent = '💧 喝饱了水，舒服～';
    tip.style.opacity = '1';
    setTimeout(function () { if (!bloomed) tip.textContent = '照顾它，看着它慢慢长大'; }, 1500);
  });
  sunBtn.addEventListener('click', function () {
    ensureAudio();
    addProgress(20);
    playTone(587, 0.2);
    var tip = root.querySelector('.flower-tip');
    tip.textContent = '☀️ 暖暖的阳光，真好～';
    tip.style.opacity = '1';
    setTimeout(function () { if (!bloomed) tip.textContent = '照顾它，看着它慢慢长大'; }, 1500);
  });
  talkBtn.addEventListener('click', function () {
    if (bloomed) return;
    input.value = '';
    modal.style.display = 'flex';
    setTimeout(function () { input.focus(); }, 50);
  });
  cancelBtn.addEventListener('click', function () { modal.style.display = 'none'; });
  okBtn.addEventListener('click', function () {
    var words = input.value.trim();
    modal.style.display = 'none';
    ensureAudio();
    var color = decideColor(words || '平静');
    lastWords = words || '平静';
    flowerColor = color;
    addProgress(25, color);
    playTone(659, 0.3);
    var tip = root.querySelector('.flower-tip');
    tip.textContent = '💬 小花听到了你的心声';
    tip.style.opacity = '1';
    setTimeout(function () { if (!bloomed) tip.textContent = '照顾它，看着它慢慢长大'; }, 1800);
  });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') okBtn.click(); });

  // 花园
  gardenBtn.addEventListener('click', function () {
    var garden = loadGarden();
    if (garden.length === 0) {
      gardenList.innerHTML = '<div style="font-size:13px;color:#ccc;text-align:center;">还没有种过花哦～</div>';
    } else {
      gardenList.innerHTML = '';
      garden.forEach(function (g) {
        var span = document.createElement('span');
        span.style.display = 'inline-block';
        span.style.margin = '0 6px';
        span.style.cursor = 'pointer';
        span.textContent = '🌷';
        span.style.color = g.color;
        // 用背景色圆点表示花色
        var dot = document.createElement('span');
        dot.style.display = 'inline-block';
        dot.style.width = '14px';
        dot.style.height = '14px';
        dot.style.borderRadius = '50%';
        dot.style.background = g.color;
        dot.style.marginRight = '4px';
        dot.style.verticalAlign = 'middle';
        var wrap = document.createElement('div');
        wrap.style.display = 'inline-block';
        wrap.style.margin = '0 8px 6px 0';
        wrap.appendChild(dot);
        wrap.appendChild(span);
        gardenList.appendChild(wrap);
      });
      var countDiv = document.createElement('div');
      countDiv.style.fontSize = '13px';
      countDiv.style.color = '#ccc';
      countDiv.style.marginTop = '8px';
      countDiv.textContent = '共种过 ' + garden.length + ' 朵花';
      gardenList.appendChild(countDiv);
    }
    gardenModal.style.display = 'flex';
  });
  gardenModal.querySelector('.flower-modal-ok').addEventListener('click', function () { gardenModal.style.display = 'none'; });

  // 主循环
  function loop() {
    draw();
    requestAnimationFrame(loop);
  }
  loop();
  updateUI();
}

// ===================== 游戏4：写信给未来 =====================
function gameLetterInit(root) {
  root.innerHTML =
    '<style>' +
    '.letter-wrap{position:relative;width:100%;height:100%;overflow:hidden;background:linear-gradient(180deg,#2a3a5e 0%,#3a4a6e 100%);font-family:sans-serif;display:flex;flex-direction:column;}' +
    '.letter-tabs{display:flex;justify-content:center;gap:10px;padding:14px 10px 8px;}' +
    '.letter-tab{padding:6px 18px;border:1px solid rgba(255,217,160,.4);border-radius:18px;background:rgba(255,217,160,.08);color:#ffd9a0;font-size:13px;cursor:pointer;}' +
    '.letter-tab.active{background:linear-gradient(90deg,#ffd6a5,#ffb86b);color:#3a2a1a;border-color:transparent;}' +
    '.letter-scroll{flex:1;overflow-y:auto;padding:10px 16px 16px;}' +
    '.letter-paper{background:#fdf6e3;border:1px solid #e8d9b5;border-radius:10px;padding:18px 18px 20px;box-shadow:0 6px 20px rgba(0,0,0,.2);background-image:repeating-linear-gradient(0deg,transparent,transparent 27px,rgba(180,150,100,.25) 27px,rgba(180,150,100,.25) 28px);min-height:240px;}' +
    '.letter-paper-title{font-size:14px;color:#8a6a3a;margin-bottom:10px;text-align:center;}' +
    '.letter-textarea{width:100%;box-sizing:border-box;background:transparent;border:none;resize:none;font-size:14px;line-height:28px;color:#3a2a1a;font-family:sans-serif;outline:none;min-height:180px;}' +
    '.letter-section-label{font-size:13px;color:#ffd9a0;margin:14px 0 8px;}' +
    '.letter-time-row{display:flex;flex-wrap:wrap;gap:8px;}' +
    '.letter-time-btn{padding:8px 14px;border:1px solid rgba(255,217,160,.3);border-radius:18px;background:rgba(255,255,255,.06);color:#e8d9b5;font-size:13px;cursor:pointer;}' +
    '.letter-time-btn.active{background:linear-gradient(90deg,#ffb86b,#ff8fb1);color:#fff;border-color:transparent;}' +
    '.letter-stamp-row{display:flex;flex-wrap:wrap;gap:10px;}' +
    '.letter-stamp{width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-size:24px;border:2px dashed rgba(255,217,160,.4);border-radius:8px;background:rgba(255,255,255,.05);cursor:pointer;}' +
    '.letter-stamp.active{border:2px solid #ffd6a5;background:rgba(255,214,165,.2);}' +
    '.letter-send{display:block;margin:18px auto 0;padding:12px 30px;border:none;border-radius:24px;background:linear-gradient(90deg,#ff8fb1,#ffb86b);color:#fff;font-size:15px;cursor:pointer;box-shadow:0 6px 18px rgba(255,140,150,.35);}' +
    '.letter-send:disabled{opacity:.5;cursor:not-allowed;}' +
    '.letter-mailbox{display:flex;flex-direction:column;gap:12px;}' +
    '.letter-card{background:#fdf6e3;border:1px solid #e8d9b5;border-radius:10px;padding:14px;color:#3a2a1a;box-shadow:0 4px 14px rgba(0,0,0,.15);}' +
    '.letter-card-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}' +
    '.letter-card-stamp{font-size:22px;}' +
    '.letter-card-time{font-size:12px;color:#8a6a3a;}' +
    '.letter-card-preview{font-size:13px;color:#5a4a2a;line-height:1.5;white-space:pre-wrap;word-break:break-word;}' +
    '.letter-card-locked{text-align:center;color:#8a6a3a;font-size:13px;padding:10px;}' +
    '.letter-card-open-btn{margin-top:10px;padding:6px 18px;border:none;border-radius:16px;background:linear-gradient(90deg,#ffb86b,#ff8fb1);color:#fff;font-size:13px;cursor:pointer;}' +
    '.letter-empty{text-align:center;color:#ffd9a0;font-size:14px;padding:40px 0;opacity:.7;}' +
    '.letter-reply{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(20,15,30,.7);z-index:50;}' +
    '.letter-reply-card{background:#fdf6e3;border:1px solid #e8d9b5;border-radius:14px;padding:24px;width:84%;max-width:360px;color:#3a2a1a;box-shadow:0 10px 40px rgba(0,0,0,.4);}' +
    '.letter-reply-title{font-size:15px;color:#8a6a3a;margin-bottom:12px;text-align:center;}' +
    '.letter-reply-body{font-size:14px;line-height:1.8;white-space:pre-wrap;}' +
    '.letter-reply-from{font-size:12px;color:#8a6a3a;text-align:right;margin-top:12px;}' +
    '.letter-reply-close{display:block;margin:18px auto 0;padding:8px 24px;border:none;border-radius:18px;background:linear-gradient(90deg,#ffb86b,#ff8fb1);color:#fff;font-size:13px;cursor:pointer;}' +
    '.letter-anim{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(20,15,30,.8);z-index:40;flex-direction:column;}' +
    '.letter-envelope{font-size:80px;animation:letter-fly 1.6s ease forwards;}' +
    '@keyframes letter-fly{0%{transform:translateY(0) scale(1);opacity:1;}70%{transform:translateY(-200px) scale(.6);opacity:1;}100%{transform:translateY(-400px) scale(.2);opacity:0;}}' +
    '.letter-anim-text{color:#ffd9a0;font-size:14px;margin-top:20px;}' +
    '</style>' +
    '<div class="letter-wrap">' +
    '<div class="letter-tabs"><div class="letter-tab active" data-tab="write">✉️ 写信</div><div class="letter-tab" data-tab="mailbox">📮 信箱</div></div>' +
    '<div class="letter-scroll">' +
    '<div class="letter-write-pane">' +
    '<div class="letter-paper"><div class="letter-paper-title">写给未来的自己 ✨</div><textarea class="letter-textarea" placeholder="在这里写下你想说的话..."></textarea></div>' +
    '<div class="letter-section-label">📅 投递时间</div>' +
    '<div class="letter-time-row"><button class="letter-time-btn" data-days="7">1 周后</button><button class="letter-time-btn" data-days="30">1 个月后</button><button class="letter-time-btn" data-days="90">3 个月后</button><button class="letter-time-btn" data-days="365">1 年后</button></div>' +
    '<div class="letter-section-label">🏷️ 选择邮票</div>' +
    '<div class="letter-stamp-row"><div class="letter-stamp" data-stamp="🌸">🌸</div><div class="letter-stamp" data-stamp="🌙">🌙</div><div class="letter-stamp" data-stamp="⭐">⭐</div><div class="letter-stamp" data-stamp="🦋">🦋</div><div class="letter-stamp" data-stamp="🍀">🍀</div><div class="letter-stamp" data-stamp="🌈">🌈</div></div>' +
    '<button class="letter-send" disabled>📮 投递信件</button>' +
    '</div>' +
    '<div class="letter-mailbox-pane" style="display:none;"></div>' +
    '</div>' +
    '</div>' +
    '<div class="letter-anim"><div class="letter-envelope">✉️</div><div class="letter-anim-text">信件正在飞向未来...</div></div>' +
    '<div class="letter-reply"><div class="letter-reply-card"><div class="letter-reply-title">💌 来自未来的回信</div><div class="letter-reply-body"></div><div class="letter-reply-from">—— 未来的你</div><button class="letter-reply-close">收好这封信</button></div></div>';

  // 回信话术库（17条）
  var REPLIES = [
    '嘿，过去的我。你那时的难过，现在想起来已经很淡了，像被风吹散的云。',
    '谢谢你撑过来了，现在的我过得还不错，请放心。',
    '你写下的每一个字，未来的我都收到了，也都记得。',
    '那时候的你很勇敢，比你以为的更勇敢。',
    '难过没有关系，眼泪浇灌了后来开出的花。',
    '你以为熬不过去的夜，最后都成了天上的星光。',
    '我在这里，替你看着你想看的风景，替你走完你想走的路。',
    '请记得好好吃饭，好好睡觉，记得心疼自己。',
    '你不必什么都懂，慢慢来就好，时间会替你回答。',
    '你的存在本身，就是一份温柔的礼物。',
    '那些让你失眠的事，大多没有那么可怕，真的。',
    '我替你保留了那份柔软，没有变冷，也没有变硬。',
    '你担心的很多事，最后都没有发生，你只是被吓到了。',
    '辛苦了，真的辛苦了。让我隔着时间，抱抱你。',
    '未来没有你想象的那么糟，相信我，我已经在那里了。',
    '记得给自己留一盏灯，别总是一个人待在黑暗里。',
    '你比你以为的，更被这个世界悄悄爱着。'
  ];

  var textarea = root.querySelector('.letter-textarea');
  var timeBtns = root.querySelectorAll('.letter-time-btn');
  var stampBtns = root.querySelectorAll('.letter-stamp');
  var sendBtn = root.querySelector('.letter-send');
  var tabs = root.querySelectorAll('.letter-tab');
  var writePane = root.querySelector('.letter-write-pane');
  var mailboxPane = root.querySelector('.letter-mailbox-pane');
  var animOverlay = root.querySelector('.letter-anim');
  var replyOverlay = root.querySelector('.letter-reply');
  var replyBody = root.querySelector('.letter-reply-body');
  var replyClose = root.querySelector('.letter-reply-close');
  var envelope = root.querySelector('.letter-envelope');

  var chosenDays = 0;
  var chosenStamp = '';

  // Web Audio
  var audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function playChime(freq) {
    var ac = ensureAudio();
    if (!ac) return;
    var o = ac.createOscillator();
    var g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = freq || 880;
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.12, ac.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.5);
    o.connect(g).connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + 0.55);
  }

  // 加载信件
  function loadLetters() {
    try { return JSON.parse(localStorage.getItem('xinji_letters') || '[]'); } catch (e) { return []; }
  }
  function saveLetters(arr) {
    try { localStorage.setItem('xinji_letters', JSON.stringify(arr)); } catch (e) {}
  }

  // 检查可投递
  function checkSendable() {
    var hasText = textarea.value.trim().length > 0;
    var hasTime = chosenDays > 0;
    var hasStamp = chosenStamp !== '';
    sendBtn.disabled = !(hasText && hasTime && hasStamp);
  }
  textarea.addEventListener('input', checkSendable);

  // 时间选择
  timeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      timeBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      chosenDays = parseInt(btn.getAttribute('data-days'), 10);
      ensureAudio();
      playChime(660);
      checkSendable();
    });
  });

  // 邮票选择
  stampBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      stampBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      chosenStamp = btn.getAttribute('data-stamp');
      ensureAudio();
      playChime(880);
      checkSendable();
    });
  });

  // 投递
  sendBtn.addEventListener('click', function () {
    if (sendBtn.disabled) return;
    ensureAudio();
    var due = Date.now() + chosenDays * 24 * 3600 * 1000;
    var letters = loadLetters();
    letters.push({
      content: textarea.value.trim(),
      due: due,
      stamp: chosenStamp,
      time: Date.now(),
      opened: false
    });
    saveLetters(letters);
    // 动画
    animOverlay.style.display = 'flex';
    envelope.style.animation = 'none';
    // 触发重绘
    void envelope.offsetWidth;
    envelope.style.animation = 'letter-fly 1.6s ease forwards';
    playChime(523);
    setTimeout(function () { playChime(659); }, 200);
    setTimeout(function () { playChime(784); }, 400);
    setTimeout(function () {
      animOverlay.style.display = 'none';
      // 重置
      textarea.value = '';
      chosenDays = 0;
      chosenStamp = '';
      timeBtns.forEach(function (b) { b.classList.remove('active'); });
      stampBtns.forEach(function (b) { b.classList.remove('active'); });
      checkSendable();
      // 切换到信箱
      switchTab('mailbox');
    }, 1700);
  });

  // Tab 切换
  function switchTab(name) {
    tabs.forEach(function (t) {
      if (t.getAttribute('data-tab') === name) t.classList.add('active');
      else t.classList.remove('active');
    });
    if (name === 'write') {
      writePane.style.display = '';
      mailboxPane.style.display = 'none';
    } else {
      writePane.style.display = 'none';
      mailboxPane.style.display = '';
      renderMailbox();
    }
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { switchTab(t.getAttribute('data-tab')); });

  });

  // 渲染信箱
  function renderMailbox() {
    var letters = loadLetters();
    mailboxPane.innerHTML = '';
    if (letters.length === 0) {
      mailboxPane.innerHTML = '<div class="letter-empty">信箱空空如也<br>写一封信寄给未来的自己吧 ✨</div>';
      return;
    }
    var now = Date.now();
    // 按到期时间排序，先到期的在前
    letters.sort(function (a, b) { return a.due - b.due; });
    var list = document.createElement('div');
    list.className = 'letter-mailbox';
    letters.forEach(function (letter, idx) {
      var card = document.createElement('div');
      card.className = 'letter-card';
      var dueDate = new Date(letter.due);
      var isDue = now >= letter.due;
      var head = document.createElement('div');
      head.className = 'letter-card-head';
      var stampSpan = document.createElement('span');
      stampSpan.className = 'letter-card-stamp';
      stampSpan.textContent = letter.stamp || '✉️';
      var timeSpan = document.createElement('span');
      timeSpan.className = 'letter-card-time';
      if (isDue) {
        timeSpan.textContent = '已送达 · ' + formatDate(dueDate);
      } else {
        var days = Math.ceil((letter.due - now) / (24 * 3600 * 1000));
        timeSpan.textContent = '🔒 ' + days + ' 天后送达';
      }
      head.appendChild(stampSpan);
      head.appendChild(timeSpan);
      card.appendChild(head);

      if (isDue) {
        var preview = document.createElement('div');
        preview.className = 'letter-card-preview';
        preview.textContent = letter.content;
        card.appendChild(preview);
        if (!letter.opened) {
          var openBtn = document.createElement('button');
          openBtn.className = 'letter-card-open-btn';
          openBtn.textContent = '💌 打开未来的回信';
          openBtn.addEventListener('click', function () {
            letter.opened = true;
            saveLetters(letters);
            var reply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
            replyBody.textContent = reply;
            replyOverlay.style.display = 'flex';
            playChime(784);
            setTimeout(function () { playChime(988); }, 150);
            renderMailbox();
          });
          card.appendChild(openBtn);
        } else {
          var openedTip = document.createElement('div');
          openedTip.className = 'letter-card-locked';
          openedTip.textContent = '✨ 已阅读未来的回信';
          card.appendChild(openedTip);
          var reopenBtn = document.createElement('button');
          reopenBtn.className = 'letter-card-open-btn';
          reopenBtn.textContent = '💌 再读一次回信';
          reopenBtn.addEventListener('click', function () {
            var reply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
            replyBody.textContent = reply;
            replyOverlay.style.display = 'flex';
            playChime(784);
          });
          card.appendChild(reopenBtn);
        }
      } else {
        var locked = document.createElement('div');
        locked.className = 'letter-card-locked';
        locked.textContent = '🔒 信件还在飞往未来的路上...';
        card.appendChild(locked);
      }
      list.appendChild(card);
    });
    mailboxPane.appendChild(list);
  }

  function formatDate(d) {
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  replyClose.addEventListener('click', function () { replyOverlay.style.display = 'none'; });

  checkSendable();
}
