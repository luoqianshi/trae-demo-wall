// ===== 崩溃组游戏：发泄释放类 =====
// 包含4个游戏：气泡漫天、砸玻璃、捏捏乐、打地鼠情绪版
// 每个函数完全自包含，接收 root (div元素) 参数

// ============ 1. 气泡漫天 ============
function gameBubblesInit(root) {
  root.innerHTML = `
    <style>
      .bubbles-wrap{position:relative;width:100%;height:100%;overflow:hidden;background:radial-gradient(circle at 50% 50%,#0f3460 0%,#16213e 100%);}
      .bubbles-canvas{display:block;width:100%;height:100%;cursor:pointer;}
      .bubbles-hud{position:absolute;top:12px;left:0;right:0;display:flex;justify-content:space-between;padding:0 20px;pointer-events:none;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}
      .bubbles-score{font-size:28px;font-weight:bold;text-shadow:0 2px 8px rgba(0,0,0,.5);}
      .bubbles-timer{font-size:24px;font-weight:bold;color:#ffd700;text-shadow:0 2px 8px rgba(0,0,0,.5);}
      .bubbles-combo{position:absolute;top:45%;left:50%;transform:translate(-50%,-50%);font-size:48px;font-weight:bold;color:#fff;text-shadow:0 0 20px #ff6b9d;pointer-events:none;opacity:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}
      .bubbles-combo.show{animation:bubbles-pop .8s ease;}
      @keyframes bubbles-pop{0%{transform:translate(-50%,-50%) scale(.3);opacity:0;}30%{transform:translate(-50%,-50%) scale(1.3);opacity:1;}100%{transform:translate(-50%,-50%) scale(1);opacity:0;}}
      .bubbles-over{position:absolute;inset:0;background:rgba(0,0,0,.75);display:none;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;z-index:5;}
      .bubbles-over.show{display:flex;}
      .bubbles-over h2{font-size:42px;margin:0 0 10px;color:#ffd700;}
      .bubbles-over p{font-size:24px;margin:5px 0;}
      .bubbles-restart{margin-top:20px;padding:12px 30px;font-size:18px;background:linear-gradient(135deg,#ff6b9d,#c44de8);color:#fff;border:none;border-radius:25px;cursor:pointer;}
      .bubbles-restart:hover{transform:scale(1.05);}
    </style>
    <div class="bubbles-wrap">
      <canvas class="bubbles-canvas"></canvas>
      <div class="bubbles-hud">
        <div class="bubbles-score">分数: 0</div>
        <div class="bubbles-timer">60</div>
      </div>
      <div class="bubbles-combo"></div>
      <div class="bubbles-over">
        <h2>时间到!</h2>
        <p>最终得分: <span class="bubbles-final">0</span></p>
        <button class="bubbles-restart">再来一次</button>
      </div>
    </div>
  `;

  // 获取元素引用
  const wrap = root.querySelector('.bubbles-wrap');
  const canvas = root.querySelector('.bubbles-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = root.querySelector('.bubbles-score');
  const timerEl = root.querySelector('.bubbles-timer');
  const comboEl = root.querySelector('.bubbles-combo');
  const overEl = root.querySelector('.bubbles-over');
  const finalEl = root.querySelector('.bubbles-final');
  const restartBtn = root.querySelector('.bubbles-restart');

  let W = 0, H = 0;
  let bubbles = [], particles = [];
  let score = 0, time = 60, combo = 0, comboTimer = 0;
  let running = true, timerInt = null, spawnTimer = 0;

  // Web Audio 音效
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // "啵"的音效
  function playPop(freq) {
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = freq || (300 + Math.random() * 200);
    o.type = 'sine';
    g.gain.setValueAtTime(0.3, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + 0.15);
  }
  // 彩虹清屏音效
  function playRainbow() {
    [600, 800, 1000, 1200].forEach((f, i) => setTimeout(() => playPop(f), i * 60));
  }

  // 响应式画布
  function resize() {
    W = canvas.width = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
  }
  resize();
  new ResizeObserver(resize).observe(wrap);

  const colors = ['#ff6b9d', '#4ecdc4', '#ffe66d', '#a8e6cf', '#c7a8ff', '#ff9f43'];

  // 生成气泡
  function spawnBubble() {
    const r = 20 + Math.random() * 40;
    const roll = Math.random();
    const special = roll < 0.05 ? 'rainbow' : (roll < 0.13 ? 'gold' : null);
    bubbles.push({
      x: Math.random() * (W - 2 * r) + r,
      y: H + r,
      r: r,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.8 - Math.random() * 1.5,
      color: special === 'gold' ? '#ffd700' : (special === 'rainbow' ? 'rainbow' : colors[Math.floor(Math.random() * colors.length)]),
      special: special,
      hue: 0,
      wobble: Math.random() * Math.PI * 2
    });
  }

  // 戳破粒子效果
  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 2 + Math.random() * 5;
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 1, color: color, r: 2 + Math.random() * 3
      });
    }
  }

  // 显示连击文字
  function showCombo(n) {
    let txt = '';
    if (n >= 10) txt = n + '连击! 神之手速!';
    else if (n >= 5) txt = n + '连击! 火力全开!';
    else if (n >= 3) txt = n + '连击!';
    else if (n >= 2) txt = '双击!';
    if (txt) {
      comboEl.textContent = txt;
      comboEl.classList.remove('show');
      void comboEl.offsetWidth;
      comboEl.classList.add('show');
    }
  }

  // 戳破气泡
  function pop(b, idx) {
    let pts = 10;
    if (b.special === 'gold') pts = 20;
    if (b.special === 'rainbow') pts = 50;

    // 连击判定
    if (combo > 0 && Date.now() - comboTimer < 1500) combo++;
    else combo = 1;
    comboTimer = Date.now();

    const mult = combo >= 5 ? 2 : 1;
    score += pts * mult;
    scoreEl.textContent = '分数: ' + score;
    showCombo(combo);

    spawnParticles(b.x, b.y, b.color === 'rainbow' ? '#fff' : b.color, b.special ? 22 : 12);

    if (b.special === 'rainbow') {
      playRainbow();
      // 清屏：所有气泡变粒子
      bubbles.forEach(bb => spawnParticles(bb.x, bb.y, bb.color === 'rainbow' ? '#fff' : bb.color, 8));
      bubbles = [];
    } else if (b.special === 'gold') {
      playPop(800);
    } else {
      playPop(300 + b.r * 5);
    }
  }

  // 处理点击
  function handle(x, y) {
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      const dx = x - b.x, dy = y - b.y;
      if (dx * dx + dy * dy < b.r * b.r) {
        pop(b, i);
        bubbles.splice(i, 1);
        return;
      }
    }
    combo = 0; // 没戳中重置连击
  }

  canvas.addEventListener('mousedown', e => {
    const r = canvas.getBoundingClientRect();
    handle(e.clientX - r.left, e.clientY - r.top);
  });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    for (const t of e.touches) handle(t.clientX - r.left, t.clientY - r.top);
  }, { passive: false });

  // 重开
  restartBtn.addEventListener('click', () => {
    score = 0; time = 60; combo = 0; bubbles = []; particles = []; running = true;
    scoreEl.textContent = '分数: 0';
    timerEl.textContent = '60';
    overEl.classList.remove('show');
    timerInt = setInterval(tick, 1000);
  });

  function tick() {
    if (!running) return;
    time--;
    timerEl.textContent = time;
    if (time <= 0) {
      running = false;
      clearInterval(timerInt);
      finalEl.textContent = score;
      overEl.classList.add('show');
    }
  }
  timerInt = setInterval(tick, 1000);

  // 主循环
  function loop() {
    if (!running) { requestAnimationFrame(loop); return; }
    ctx.clearRect(0, 0, W, H);

    spawnTimer++;
    if (spawnTimer > 25) { spawnBubble(); spawnTimer = 0; }

    // 更新+绘制气泡
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.wobble += 0.05;
      b.x += b.vx + Math.sin(b.wobble) * 0.3;
      b.y += b.vy;
      if (b.y < -b.r) { bubbles.splice(i, 1); continue; }

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      if (b.color === 'rainbow') {
        b.hue = (b.hue + 3) % 360;
        const g = ctx.createRadialGradient(b.x - b.r / 3, b.y - b.r / 3, 0, b.x, b.y, b.r);
        g.addColorStop(0, 'hsl(' + b.hue + ',100%,80%)');
        g.addColorStop(1, 'hsl(' + ((b.hue + 180) % 360) + ',100%,50%)');
        ctx.fillStyle = g;
      } else {
        const g = ctx.createRadialGradient(b.x - b.r / 3, b.y - b.r / 3, 0, b.x, b.y, b.r);
        g.addColorStop(0, 'rgba(255,255,255,.6)');
        g.addColorStop(0.3, b.color);
        g.addColorStop(1, b.color);
        ctx.fillStyle = g;
      }
      ctx.fill();
      // 高光
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.fill();

      // 特殊标记
      if (b.special === 'gold') {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold ' + (b.r * 0.6) + 'px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('★', b.x, b.y);
      } else if (b.special === 'rainbow') {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold ' + (b.r * 0.5) + 'px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('✦', b.x, b.y);
      }
    }

    // 粒子
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.15;
      p.life -= 0.025;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 连击衰减
    if (combo > 0 && Date.now() - comboTimer > 1500) combo = 0;

    requestAnimationFrame(loop);
  }
  loop();
}


// ============ 2. 砸玻璃 ============
function gameSmashInit(root) {
  root.innerHTML = `
    <style>
      .smash-wrap{position:relative;width:100%;height:100%;overflow:hidden;background:linear-gradient(180deg,#1a1a2e,#0f3460);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}
      .smash-canvas{display:block;width:100%;height:100%;cursor:crosshair;}
      .smash-hud{position:absolute;top:12px;left:0;right:0;padding:0 20px;display:flex;justify-content:space-between;align-items:center;pointer-events:none;color:#fff;}
      .smash-count{font-size:24px;font-weight:bold;text-shadow:0 2px 8px rgba(0,0,0,.5);}
      .smash-rage-wrap{width:200px;height:20px;background:rgba(0,0,0,.4);border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,.3);}
      .smash-rage-bar{height:100%;width:0%;background:linear-gradient(90deg,#ff6b9d,#ff3838);transition:width .2s;}
      .smash-rage-label{color:#fff;font-size:12px;margin-right:8px;}
      .smash-ult{position:absolute;bottom:30px;left:50%;transform:translateX(-50%);padding:14px 36px;font-size:18px;font-weight:bold;background:linear-gradient(135deg,#ff3838,#c44de8);color:#fff;border:none;border-radius:30px;cursor:pointer;display:none;box-shadow:0 4px 20px rgba(255,56,56,.5);animation:smash-pulse 1s infinite;}
      .smash-ult.show{display:block;}
      @keyframes smash-pulse{0%,100%{transform:translateX(-50%) scale(1);}50%{transform:translateX(-50%) scale(1.08);}}
      .smash-tip{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:rgba(255,255,255,.4);font-size:16px;pointer-events:none;text-align:center;}
      .smash-combo{position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);font-size:40px;font-weight:bold;color:#ff6b9d;text-shadow:0 0 20px #ff3838;pointer-events:none;opacity:0;}
      .smash-combo.show{animation:smash-pop .8s ease;}
      @keyframes smash-pop{0%{transform:translate(-50%,-50%) scale(.3);opacity:0;}30%{transform:translate(-50%,-50%) scale(1.4);opacity:1;}100%{transform:translate(-50%,-50%) scale(1);opacity:0;}}
    </style>
    <div class="smash-wrap">
      <canvas class="smash-canvas"></canvas>
      <div class="smash-hud">
        <div class="smash-count">已砸碎: 0</div>
        <div style="display:flex;align-items:center;">
          <span class="smash-rage-label">怒气</span>
          <div class="smash-rage-wrap"><div class="smash-rage-bar"></div></div>
        </div>
      </div>
      <div class="smash-combo"></div>
      <div class="smash-tip">点击玻璃窗释放压力！<br>钢化玻璃需砸3次</div>
      <button class="smash-ult">释放大招 💥</button>
    </div>
  `;

  const wrap = root.querySelector('.smash-wrap');
  const canvas = root.querySelector('.smash-canvas');
  const ctx = canvas.getContext('2d');
  const countEl = root.querySelector('.smash-count');
  const rageBar = root.querySelector('.smash-rage-bar');
  const ultBtn = root.querySelector('.smash-ult');
  const comboEl = root.querySelector('.smash-combo');
  const tipEl = root.querySelector('.smash-tip');

  let W = 0, H = 0;
  let glasses = [], particles = [];
  let count = 0, rage = 0, comboCount = 0, comboTimer = 0;

  // Web Audio 玻璃破碎音效
  let audioCtx = null;
  function ensureAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  function playSmash(freq) {
    ensureAudio();
    // 噪声+衰减 模拟玻璃碎裂
    const bufSize = Math.floor(audioCtx.sampleRate * 0.3);
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 3);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const g = audioCtx.createGain();
    g.gain.value = 0.4;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = freq || 2000;
    src.connect(filter); filter.connect(g); g.connect(audioCtx.destination);
    src.start();
  }
  function playUlt() {
    playSmash(500);
    setTimeout(() => playSmash(800), 100);
    setTimeout(() => playSmash(1200), 200);
  }

  function resize() {
    W = canvas.width = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
  }
  resize();
  new ResizeObserver(resize).observe(wrap);

  // 生成玻璃窗
  function spawnGlass() {
    const types = ['normal', 'normal', 'normal', 'tempered', 'colorful'];
    const type = types[Math.floor(Math.random() * types.length)];
    const w = 100 + Math.random() * 80;
    const h = 70 + Math.random() * 50;
    glasses.push({
      x: Math.random() * Math.max(40, W - w - 40) + 20,
      y: Math.random() * Math.max(100, H - h - 120) + 70,
      w: w, h: h,
      hp: type === 'tempered' ? 3 : 1,
      maxHp: type === 'tempered' ? 3 : 1,
      type: type,
      cracks: [],
      shake: 0,
      hue: type === 'colorful' ? Math.random() * 360 : null
    });
    if (tipEl) tipEl.style.display = 'none';
  }
  for (let i = 0; i < 4; i++) spawnGlass();

  // 添加裂纹
  function addCrack(g, x, y) {
    const cracks = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < cracks; i++) {
      const a = Math.random() * Math.PI * 2;
      const len = 20 + Math.random() * 30;
      g.cracks.push({ x1: x, y1: y, x2: x + Math.cos(a) * len, y2: y + Math.sin(a) * len });
    }
  }

  // 碎片粒子
  function spawnShards(x, y, w, h, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 3 + Math.random() * 8;
      particles.push({
        x: x + Math.random() * w, y: y + Math.random() * h,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2,
        life: 1, color: color,
        size: 3 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3
      });
    }
  }

  function showCombo(n) {
    let txt = '';
    if (n >= 10) txt = n + '连砸! 毁灭者!';
    else if (n >= 5) txt = n + '连砸! 狂暴!';
    else if (n >= 3) txt = n + '连砸!';
    if (txt) {
      comboEl.textContent = txt;
      comboEl.classList.remove('show');
      void comboEl.offsetWidth;
      comboEl.classList.add('show');
    }
  }

  // 砸玻璃
  function smash(g, idx, hx, hy) {
    g.hp--;
    g.shake = 8;
    addCrack(g, hx - g.x, hy - g.y);

    if (g.hp <= 0) {
      // 完全碎裂
      count++;
      countEl.textContent = '已砸碎: ' + count;

      if (Date.now() - comboTimer < 1500) comboCount++; else comboCount = 1;
      comboTimer = Date.now();
      showCombo(comboCount);

      rage = Math.min(100, rage + (g.type === 'tempered' ? 20 : 12));
      rageBar.style.width = rage + '%';
      if (rage >= 100) ultBtn.classList.add('show');

      const baseColor = g.type === 'colorful' ? 'hsl(' + g.hue + ',90%,60%)' : 'rgba(200,230,255,.9)';
      spawnShards(g.x, g.y, g.w, g.h, baseColor, g.type === 'colorful' ? 30 : 20);

      if (g.type === 'colorful') {
        // 彩色粒子四散
        for (let i = 0; i < 15; i++) {
          spawnShards(g.x, g.y, g.w, g.h, 'hsl(' + Math.random() * 360 + ',90%,60%)', 1);
        }
        playSmash(3000);
      } else {
        playSmash(2000 + Math.random() * 1000);
      }

      glasses.splice(idx, 1);
      setTimeout(spawnGlass, 300);
    } else {
      playSmash(1500);
    }
  }

  function handle(x, y) {
    for (let i = glasses.length - 1; i >= 0; i--) {
      const g = glasses[i];
      if (x >= g.x && x <= g.x + g.w && y >= g.y && y <= g.y + g.h) {
        smash(g, i, x, y);
        return;
      }
    }
    comboCount = 0;
  }

  canvas.addEventListener('mousedown', e => {
    const r = canvas.getBoundingClientRect();
    handle(e.clientX - r.left, e.clientY - r.top);
  });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    for (const t of e.touches) handle(t.clientX - r.left, t.clientY - r.top);
  }, { passive: false });

  // 大招：全屏粉碎
  ultBtn.addEventListener('click', () => {
    if (rage < 100) return;
    rage = 0; rageBar.style.width = '0%';
    ultBtn.classList.remove('show');
    playUlt();
    glasses.forEach(g => {
      const color = g.type === 'colorful' ? 'hsl(' + g.hue + ',90%,60%)' : 'rgba(200,230,255,.9)';
      spawnShards(g.x, g.y, g.w, g.h, color, 25);
      count++;
    });
    countEl.textContent = '已砸碎: ' + count;
    glasses = [];
    for (let i = 0; i < 5; i++) setTimeout(spawnGlass, i * 150);
    comboEl.textContent = '全屏粉碎!';
    comboEl.classList.remove('show');
    void comboEl.offsetWidth;
    comboEl.classList.add('show');
  });

  function loop() {
    ctx.clearRect(0, 0, W, H);

    // 绘制玻璃
    for (const g of glasses) {
      ctx.save();
      if (g.shake > 0) {
        ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
        g.shake *= 0.8;
        if (g.shake < 0.5) g.shake = 0;
      }
      // 玻璃主体
      ctx.fillStyle = g.type === 'colorful' ? 'hsla(' + g.hue + ',80%,60%,.25)' : 'rgba(200,230,255,.15)';
      ctx.strokeStyle = g.type === 'colorful' ? 'hsl(' + g.hue + ',90%,70%)' : 'rgba(200,230,255,.8)';
      ctx.lineWidth = 2;
      ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeRect(g.x, g.y, g.w, g.h);
      // 左上高光
      ctx.fillStyle = 'rgba(255,255,255,.15)';
      ctx.beginPath();
      ctx.moveTo(g.x + 5, g.y + 5);
      ctx.lineTo(g.x + g.w * 0.4, g.y + 5);
      ctx.lineTo(g.x + 5, g.y + g.h * 0.4);
      ctx.closePath();
      ctx.fill();
      // 裂纹
      ctx.strokeStyle = 'rgba(255,255,255,.7)';
      ctx.lineWidth = 1.5;
      for (const c of g.cracks) {
        ctx.beginPath();
        ctx.moveTo(g.x + c.x1, g.y + c.y1);
        ctx.lineTo(g.x + c.x2, g.y + c.y2);
        ctx.stroke();
      }
      // 钢化玻璃 hp 指示
      if (g.maxHp > 1) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(g.hp + '/' + g.maxHp, g.x + g.w / 2, g.y + g.h / 2);
      }
      ctx.restore();
    }

    // 碎片粒子
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.3;
      p.rot += p.vr;
      p.life -= 0.015;
      if (p.life <= 0 || p.y > H + 50) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (Date.now() - comboTimer > 1500) comboCount = 0;

    requestAnimationFrame(loop);
  }
  loop();
}


// ============ 3. 捏捏乐 ============
function gameSquishyInit(root) {
  root.innerHTML = `
    <style>
      .squishy-wrap{position:relative;width:100%;height:100%;background:radial-gradient(circle at 50% 40%,#2a2a5e 0%,#1a1a2e 100%);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden;}
      .squishy-canvas{display:block;width:100%;height:100%;touch-action:none;}
      .squishy-skins{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);display:flex;gap:12px;}
      .squishy-skin-btn{width:60px;height:60px;border-radius:50%;border:3px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);font-size:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;}
      .squishy-skin-btn.active{border-color:#ffd700;transform:scale(1.15);box-shadow:0 0 20px #ffd700;}
      .squishy-info{position:absolute;top:20px;left:0;right:0;text-align:center;color:#fff;pointer-events:none;}
      .squishy-count{font-size:20px;opacity:.9;}
      .squishy-hint{font-size:14px;opacity:.5;margin-top:4px;}
      .squishy-egg{position:absolute;top:35%;left:50%;transform:translate(-50%,-50%);font-size:80px;pointer-events:none;opacity:0;z-index:5;}
      .squishy-egg.show{animation:squishy-egg 1.5s ease;}
      @keyframes squishy-egg{0%{transform:translate(-50%,-50%) scale(0) rotate(0);}30%{transform:translate(-50%,-50%) scale(1.5) rotate(20deg);opacity:1;}70%{opacity:1;}100%{transform:translate(-50%,-50%) scale(1) rotate(0);opacity:0;}}
    </style>
    <div class="squishy-wrap">
      <canvas class="squishy-canvas"></canvas>
      <div class="squishy-info">
        <div class="squishy-count">已捏: 0 次</div>
        <div class="squishy-hint">按住拖动来捏它~</div>
      </div>
      <div class="squishy-egg"></div>
      <div class="squishy-skins">
        <button class="squishy-skin-btn active" data-skin="cat">🐱</button>
        <button class="squishy-skin-btn" data-skin="dino">🦕</button>
        <button class="squishy-skin-btn" data-skin="cloud">☁️</button>
        <button class="squishy-skin-btn" data-skin="slime">🟢</button>
      </div>
    </div>
  `;

  const wrap = root.querySelector('.squishy-wrap');
  const canvas = root.querySelector('.squishy-canvas');
  const ctx = canvas.getContext('2d');
  const countEl = root.querySelector('.squishy-count');
  const eggEl = root.querySelector('.squishy-egg');
  const skinBtns = root.querySelectorAll('.squishy-skin-btn');

  let W = 0, H = 0;
  function resize() {
    W = canvas.width = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
  }
  resize();
  new ResizeObserver(resize).observe(wrap);

  // 4种皮肤配置
  const skins = {
    cat: { color: '#ffb6c1', accent: '#ff8fa3' },
    dino: { color: '#7ed957', accent: '#4caf50' },
    cloud: { color: '#e8e8e8', accent: '#bdbdbd' },
    slime: { color: '#a8e6cf', accent: '#66bb6a' }
  };
  let curSkin = 'cat';

  const baseRadius = 80;
  const N = 24; // 轮廓点数
  let points = []; // 弹簧物理点 {ang, dr, vr}
  function initPoints() {
    points = [];
    for (let i = 0; i < N; i++) {
      points.push({ ang: (i / N) * Math.PI * 2, dr: 0, vr: 0 });
    }
  }
  initPoints();

  let pressing = false;
  let lastX = 0, lastY = 0;
  let squishCount = 0;

  // Web Audio 捏捏音效
  let audioCtx = null;
  function ensureAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  function playSquish() {
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.setValueAtTime(300, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.2);
    o.type = 'sine';
    g.gain.setValueAtTime(0.2, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + 0.2);
  }

  function setSkin(s) {
    curSkin = s;
    skinBtns.forEach(b => b.classList.toggle('active', b.dataset.skin === s));
  }
  skinBtns.forEach(b => b.addEventListener('click', () => setSkin(b.dataset.skin)));

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    if (e.touches) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function start(p) {
    pressing = true;
    lastX = p.x; lastY = p.y;
  }
  function move(p) {
    if (!pressing) return;
    // 拖动影响附近的轮廓点（拉伸形变）
    for (const pt of points) {
      const px = W / 2 + Math.cos(pt.ang) * (baseRadius + pt.dr);
      const py = H / 2 + Math.sin(pt.ang) * (baseRadius + pt.dr);
      const ddx = p.x - px, ddy = p.y - py;
      const dist = Math.sqrt(ddx * ddx + ddy * ddy);
      if (dist < 70) {
        const force = (70 - dist) / 70 * 0.5;
        pt.dr -= force * 3;
      }
    }
    lastX = p.x; lastY = p.y;
  }
  function end() {
    if (!pressing) return;
    pressing = false;
    squishCount++;
    countEl.textContent = '已捏: ' + squishCount + ' 次';
    playSquish();
    // 每10次触发彩蛋
    if (squishCount % 10 === 0) {
      const eggs = ['🤩', '🥳', '😎', '🤪', '💖', '✨', '🌟', '💫', '🎉'];
      eggEl.textContent = eggs[Math.floor(Math.random() * eggs.length)];
      eggEl.classList.remove('show');
      void eggEl.offsetWidth;
      eggEl.classList.add('show');
      // 全体弹跳
      for (const pt of points) pt.dr += 12;
    }
  }

  canvas.addEventListener('mousedown', e => start(getPos(e)));
  canvas.addEventListener('mousemove', e => move(getPos(e)));
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); start(getPos(e)); }, { passive: false });
  canvas.addEventListener('touchmove', e => { e.preventDefault(); move(getPos(e)); }, { passive: false });
  canvas.addEventListener('touchend', end);

  // 主循环：弹簧物理模拟
  function loop() {
    const cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);

    // 弹簧回弹：dr 向 0 回弹
    for (const pt of points) {
      const force = -0.15 * pt.dr; // 弹簧力 F = -k*x
      pt.vr += force;
      pt.vr *= 0.85; // 阻尼
      pt.dr += pt.vr;
    }

    const skin = skins[curSkin];

    // 阴影
    ctx.beginPath();
    ctx.ellipse(cx, cy + baseRadius * 0.9, baseRadius * 0.8, baseRadius * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.fill();

    // 主体（变形圆）
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const pt = points[i % N];
      const r = baseRadius + pt.dr;
      const x = cx + Math.cos(pt.ang) * r;
      const y = cy + Math.sin(pt.ang) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const grad = ctx.createRadialGradient(cx - baseRadius * 0.3, cy - baseRadius * 0.3, 0, cx, cy, baseRadius * 1.2);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.3, skin.color);
    grad.addColorStop(1, skin.accent);
    ctx.fillStyle = grad;
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#333';
    const eyeY = cy - baseRadius * 0.15;
    ctx.beginPath();
    ctx.arc(cx - baseRadius * 0.3, eyeY, baseRadius * 0.08, 0, Math.PI * 2);
    ctx.arc(cx + baseRadius * 0.3, eyeY, baseRadius * 0.08, 0, Math.PI * 2);
    ctx.fill();
    // 眼睛高光
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - baseRadius * 0.28, eyeY - 2, baseRadius * 0.03, 0, Math.PI * 2);
    ctx.arc(cx + baseRadius * 0.32, eyeY - 2, baseRadius * 0.03, 0, Math.PI * 2);
    ctx.fill();

    // 嘴巴（捏时变O）
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (pressing) {
      ctx.arc(cx, cy + baseRadius * 0.2, baseRadius * 0.12, 0, Math.PI * 2);
    } else {
      ctx.arc(cx, cy + baseRadius * 0.15, baseRadius * 0.2, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();

    // 腮红
    ctx.fillStyle = 'rgba(255,150,150,.5)';
    ctx.beginPath();
    ctx.arc(cx - baseRadius * 0.45, cy + baseRadius * 0.1, baseRadius * 0.1, 0, Math.PI * 2);
    ctx.arc(cx + baseRadius * 0.45, cy + baseRadius * 0.1, baseRadius * 0.1, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(loop);
  }
  loop();
}


// ============ 4. 打地鼠情绪版 ============
function gameWhackInit(root) {
  root.innerHTML = `
    <style>
      .whack-wrap{position:relative;width:100%;height:100%;background:linear-gradient(180deg,#3d2c2c,#1a1a2e);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden;display:flex;flex-direction:column;align-items:center;padding-top:20px;}
      .whack-hud{color:#fff;text-align:center;margin-bottom:15px;}
      .whack-score{font-size:28px;font-weight:bold;color:#ffd700;}
      .whack-timer{font-size:22px;margin-top:4px;}
      .whack-combo{position:absolute;top:42%;left:50%;transform:translate(-50%,-50%);font-size:32px;font-weight:bold;color:#ff6b9d;text-shadow:0 0 20px #ff3838;pointer-events:none;opacity:0;z-index:10;text-align:center;}
      .whack-combo.show{animation:whack-pop 1s ease;}
      @keyframes whack-pop{0%{transform:translate(-50%,-50%) scale(.3);opacity:0;}20%{transform:translate(-50%,-50%) scale(1.3);opacity:1;}80%{opacity:1;}100%{opacity:0;}}
      .whack-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;width:90%;max-width:420px;}
      .whack-hole{position:relative;aspect-ratio:1;background:radial-gradient(ellipse at center,#1a0a0a 0%,#2d1810 70%,#3d2418 100%);border-radius:50%;overflow:hidden;box-shadow:inset 0 8px 20px rgba(0,0,0,.7);cursor:pointer;}
      .whack-hole::after{content:'';position:absolute;bottom:0;left:0;right:0;height:30%;background:linear-gradient(180deg,transparent,#1a0a0a);pointer-events:none;}
      .whack-monster{position:absolute;left:50%;bottom:-100%;transform:translateX(-50%);font-size:50px;transition:bottom .2s ease-out;pointer-events:none;filter:drop-shadow(0 4px 6px rgba(0,0,0,.5));}
      .whack-hole.up .whack-monster{bottom:15%;}
      .whack-hole.hit .whack-monster{animation:whack-hit .35s ease forwards;}
      @keyframes whack-hit{0%{transform:translateX(-50%) scale(1);}50%{transform:translateX(-50%) scale(1.3) rotate(25deg);}100%{transform:translateX(-50%) scale(0) rotate(360deg);bottom:-100%;}}
      .whack-points{position:absolute;top:20%;left:50%;transform:translateX(-50%);color:#ffd700;font-weight:bold;font-size:20px;pointer-events:none;opacity:0;z-index:2;text-shadow:0 2px 4px #000;}
      .whack-points.show{animation:whack-pts .8s ease;}
      @keyframes whack-pts{0%{opacity:1;transform:translateX(-50%) translateY(0);}100%{opacity:0;transform:translateX(-50%) translateY(-40px);}}
      .whack-over{position:absolute;inset:0;background:rgba(0,0,0,.85);display:none;flex-direction:column;align-items:center;justify-content:center;color:#fff;z-index:20;padding:20px;}
      .whack-over.show{display:flex;}
      .whack-over h2{font-size:36px;color:#ffd700;margin:0 0 10px;}
      .whack-over p{font-size:22px;margin:5px 0;}
      .whack-lb{background:rgba(255,255,255,.1);padding:15px 25px;border-radius:12px;margin:15px 0;max-width:300px;width:85%;}
      .whack-lb-title{font-size:16px;color:#ffd700;margin-bottom:8px;text-align:center;}
      .whack-lb div{display:flex;justify-content:space-between;padding:4px 0;font-size:15px;border-bottom:1px solid rgba(255,255,255,.1);}
      .whack-lb div:last-child{border:none;}
      .whack-lb .rank1{color:#ffd700;font-weight:bold;}
      .whack-restart{margin-top:15px;padding:12px 30px;font-size:18px;background:linear-gradient(135deg,#ff6b9d,#c44de8);color:#fff;border:none;border-radius:25px;cursor:pointer;}
      .whack-restart:hover{transform:scale(1.05);}
    </style>
    <div class="whack-wrap">
      <div class="whack-hud">
        <div class="whack-score">得分: 0</div>
        <div class="whack-timer">⏱ 30</div>
      </div>
      <div class="whack-combo"></div>
      <div class="whack-grid"></div>
      <div class="whack-over">
        <h2>时间到!</h2>
        <p>得分: <span class="whack-final">0</span></p>
        <div class="whack-lb"></div>
        <button class="whack-restart">再玩一次</button>
      </div>
    </div>
  `;

  const wrap = root.querySelector('.whack-wrap');
  const grid = root.querySelector('.whack-grid');
  const scoreEl = root.querySelector('.whack-score');
  const timerEl = root.querySelector('.whack-timer');
  const comboEl = root.querySelector('.whack-combo');
  const overEl = root.querySelector('.whack-over');
  const finalEl = root.querySelector('.whack-final');
  const lbEl = root.querySelector('.whack-lb');
  const restartBtn = root.querySelector('.whack-restart');

  // 烦恼怪兽配置
  const monsters = [
    { emoji: '📚', name: '作业怪', pts: 10 },
    { emoji: '📝', name: '考试怪', pts: 15 },
    { emoji: '👥', name: '社交怪', pts: 20 },
    { emoji: '⏰', name: '早起怪', pts: 25 }
  ];
  const LB_KEY = 'xinji_whack_lb';

  let holes = [];
  let score = 0, time = 30, combo = 0, comboTimer = 0;
  let running = false, gameInt = null, spawnInt = null;

  // 建3x3地洞
  for (let i = 0; i < 9; i++) {
    const hole = document.createElement('div');
    hole.className = 'whack-hole';
    hole.innerHTML = '<div class="whack-monster"></div><div class="whack-points"></div>';
    hole.addEventListener('click', () => hit(i));
    hole.addEventListener('touchstart', e => { e.preventDefault(); hit(i); }, { passive: false });
    grid.appendChild(hole);
    holes.push({
      el: hole,
      monster: hole.querySelector('.whack-monster'),
      points: hole.querySelector('.whack-points'),
      up: false, type: null, hideT: null
    });
  }

  // Web Audio 打击音效
  let audioCtx = null;
  function ensureAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  function playHit(pts) {
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.setValueAtTime(200 + pts * 10, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.15);
    o.type = 'square';
    g.gain.setValueAtTime(0.2, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + 0.15);
  }

  // 怪兽弹出
  function pop(holeIdx) {
    const h = holes[holeIdx];
    if (h.up || !running) return;
    const m = monsters[Math.floor(Math.random() * monsters.length)];
    h.type = m;
    h.monster.textContent = m.emoji;
    h.up = true;
    h.el.classList.add('up');
    if (h.hideT) clearTimeout(h.hideT);
    h.hideT = setTimeout(() => {
      if (h.up) {
        h.up = false;
        h.el.classList.remove('up');
        h.type = null;
      }
    }, 1200 + Math.random() * 800);
  }

  // 打中怪兽
  function hit(holeIdx) {
    const h = holes[holeIdx];
    if (!h.up || !h.type || !running) return;
    const pts = h.type.pts;

    // 连击系统
    if (Date.now() - comboTimer < 1500) combo++; else combo = 1;
    comboTimer = Date.now();

    let mult = 1;
    if (combo >= 10) mult = 3;
    else if (combo >= 5) mult = 2;

    const gained = pts * mult;
    score += gained;
    scoreEl.textContent = '得分: ' + score;

    // 显示得分浮字
    h.points.textContent = '+' + gained;
    h.points.classList.remove('show');
    void h.points.offsetWidth;
    h.points.classList.add('show');

    // 连击提示
    let txt = '';
    if (combo >= 10) txt = '无敌! x3 (' + combo + '连击)';
    else if (combo >= 5) txt = '暴走模式 双倍分! (' + combo + '连击)';
    else if (combo >= 3) txt = '不错! (' + combo + '连击)';
    if (txt) {
      comboEl.textContent = txt;
      comboEl.classList.remove('show');
      void comboEl.offsetWidth;
      comboEl.classList.add('show');
    }

    playHit(pts);
    h.up = false;
    if (h.hideT) { clearTimeout(h.hideT); h.hideT = null; }
    h.el.classList.remove('up');
    h.el.classList.add('hit');
    setTimeout(() => h.el.classList.remove('hit'), 350);
    h.type = null;
  }

  // 排行榜
  function getLb() {
    try { return JSON.parse(localStorage.getItem(LB_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveLb(s) {
    const lb = getLb();
    lb.push(s);
    lb.sort((a, b) => b - a);
    const top = lb.slice(0, 5);
    try { localStorage.setItem(LB_KEY, JSON.stringify(top)); } catch (e) {}
    return top;
  }
  function renderLb() {
    const lb = getLb();
    if (lb.length === 0) {
      lbEl.innerHTML = '<div class="whack-lb-title">🏆 排行榜</div><div style="text-align:center;opacity:.6;">还没有记录</div>';
      return;
    }
    lbEl.innerHTML = '<div class="whack-lb-title">🏆 排行榜 Top5</div>' +
      lb.map((s, i) => '<div class="' + (i === 0 ? 'rank1' : '') + '"><span>#' + (i + 1) + '</span><span>' + s + '分</span></div>').join('');
  }

  function start() {
    score = 0; time = 30; combo = 0; running = true;
    scoreEl.textContent = '得分: 0';
    timerEl.textContent = '⏱ 30';
    overEl.classList.remove('show');
    holes.forEach(h => {
      h.up = false; h.type = null;
      if (h.hideT) { clearTimeout(h.hideT); h.hideT = null; }
      h.el.classList.remove('up', 'hit');
    });

    gameInt = setInterval(() => {
      time--;
      timerEl.textContent = '⏱ ' + time;
      if (time <= 0) end();
    }, 1000);

    spawnInt = setInterval(() => {
      if (!running) return;
      const idx = Math.floor(Math.random() * 9);
      pop(idx);
      // 偶尔双开增加难度
      if (Math.random() < 0.2) {
        const idx2 = Math.floor(Math.random() * 9);
        if (idx2 !== idx) setTimeout(() => pop(idx2), 200);
      }
    }, 700);
  }

  function end() {
    running = false;
    clearInterval(gameInt);
    clearInterval(spawnInt);
    finalEl.textContent = score;
    saveLb(score);
    renderLb();
    overEl.classList.add('show');
    holes.forEach(h => {
      h.up = false;
      if (h.hideT) { clearTimeout(h.hideT); h.hideT = null; }
      h.el.classList.remove('up');
    });
  }

  restartBtn.addEventListener('click', start);

  // 连击衰减检测
  setInterval(() => {
    if (combo > 0 && Date.now() - comboTimer > 1500) combo = 0;
  }, 200);

  start();
}
