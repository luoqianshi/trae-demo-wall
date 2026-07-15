// 超嗨组 - 高能释放类游戏（霓虹炫彩风格）
// 包含4个游戏初始化函数，供单页HTML游戏长廊调用
// 每个函数接收 root(div)，用 root.innerHTML 注入内容，内部自包含

// ==================== 1. 呼吸节拍器 ====================
function gameBreathingInit(root) {
  root.innerHTML = `
  <style>
    .br-wrap{position:relative;width:100%;height:100%;overflow:hidden;background:radial-gradient(circle at 50% 42%,#1a0b3d,#0a0520);font-family:"Segoe UI",system-ui,sans-serif;touch-action:manipulation}
    .br-particles{position:absolute;inset:0;pointer-events:none;z-index:1}
    .br-stage{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:#fff;z-index:2}
    .br-circle{width:170px;height:170px;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;box-shadow:0 0 60px currentColor,inset 0 0 40px rgba(255,255,255,.22);transition:background .4s,color .4s;font-size:18px;font-weight:bold;color:#4ad9ff;background:#4ad9ff;will-change:transform}
    .br-text{margin-top:32px;font-size:26px;letter-spacing:3px;text-shadow:0 0 18px currentColor;color:#4ad9ff;transition:color .4s}
    .br-count{margin-top:10px;font-size:15px;opacity:.85;color:#c9b3ff}
    .br-info{position:absolute;top:14px;left:0;right:0;text-align:center;color:#c9b3ff;font-size:13px;z-index:3}
    .br-info span{display:inline-block;margin:3px 5px;padding:5px 12px;background:rgba(255,255,255,.07);border:1px solid rgba(201,179,255,.25);border-radius:18px;cursor:pointer;transition:.2s}
    .br-info span.br-active{background:rgba(180,120,255,.4);border-color:#b478ff;box-shadow:0 0 12px rgba(180,120,255,.5)}
    .br-total{display:block;margin-top:8px;color:#9d8bff}
    .br-summary{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(10,5,32,.94);color:#fff;z-index:6}
    .br-summary h2{font-size:40px;color:#ff9ed8;text-shadow:0 0 30px #ff5fb0;margin:0}
    .br-summary p{color:#c9b3ff;margin-top:14px;font-size:17px}
    .br-summary button{margin-top:24px;padding:10px 28px;background:linear-gradient(90deg,#6a3dff,#c93dff);border:none;border-radius:24px;color:#fff;font-size:16px;cursor:pointer;box-shadow:0 0 24px rgba(150,80,255,.6)}
  </style>
  <div class="br-wrap">
    <canvas class="br-particles" id="brParticles"></canvas>
    <div class="br-info" id="brInfo">
      <span data-r="3">3 轮</span>
      <span data-r="5" class="br-active">5 轮</span>
      <span data-r="10">10 轮</span>
      <span data-r="0">无限</span>
      <span class="br-total" id="brTotal">累计完成 0 次</span>
    </div>
    <div class="br-stage">
      <div class="br-circle" id="brCircle">吸气</div>
      <div class="br-text" id="brText">准备开始...</div>
      <div class="br-count" id="brCount"></div>
    </div>
    <div class="br-summary" id="brSummary">
      <h2>做得很棒！</h2>
      <p id="brSummaryText"></p>
      <button id="brAgain">再来一次</button>
    </div>
  </div>`;

  // 元素引用
  const circle = root.querySelector('#brCircle');
  const text = root.querySelector('#brText');
  const countEl = root.querySelector('#brCount');
  const info = root.querySelector('#brInfo');
  const summary = root.querySelector('#brSummary');
  const summaryText = root.querySelector('#brSummaryText');
  const againBtn = root.querySelector('#brAgain');
  const totalEl = root.querySelector('#brTotal');
  const canvas = root.querySelector('#brParticles');
  const ctx = canvas.getContext('2d');

  // 状态
  let total = parseInt(localStorage.getItem('xinji_breathing_sessions') || '0');
  totalEl.textContent = '累计完成 ' + total + ' 次';
  let targetRounds = 5, curRound = 0, phaseIdx = 0, phaseT = 0, lastTs = 0;
  let running = false, loopActive = false, introT = 0;

  // 阶段：时长(秒)/目标缩放/文字/颜色（蓝→紫→粉）
  const phases = [
    { dur: 4, scale: 1.55, txt: '吸气...', col: '#4ad9ff' },
    { dur: 2, scale: 1.55, txt: '屏住...', col: '#a06bff' },
    { dur: 4, scale: 1.0, txt: '呼气...', col: '#ff7ed1' }
  ];

  // 切换轮数
  info.addEventListener('click', e => {
    const sp = e.target;
    if (sp.dataset && sp.dataset.r !== undefined) {
      info.querySelectorAll('span[data-r]').forEach(s => s.classList.remove('br-active'));
      sp.classList.add('br-active');
      targetRounds = parseInt(sp.dataset.r);
      resetGame();
    }
  });
  againBtn.addEventListener('click', resetGame);

  function resetGame() {
    summary.style.display = 'none';
    curRound = 0; phaseIdx = 0; phaseT = 0; lastTs = 0; introT = 0; running = true;
    text.textContent = '准备开始...';
    circle.style.transform = 'scale(1)';
    startLoop();
  }
  function finishGame() {
    running = false;
    total++;
    localStorage.setItem('xinji_breathing_sessions', total);
    totalEl.textContent = '累计完成 ' + total + ' 次';
    summaryText.textContent = '本次完成 ' + curRound + ' 轮呼吸，累计已做 ' + total + ' 次。';
    summary.style.display = 'flex';
  }
  function easeInOut(t) { return t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2; }

  function startLoop() {
    if (loopActive) return;
    loopActive = true;
    requestAnimationFrame(loop);
  }
  function loop(ts) {
    if (!running) { loopActive = false; return; }
    if (!lastTs) lastTs = ts;
    const dt = (ts - lastTs) / 1000; lastTs = ts;
    introT += dt;
    if (introT < 1.2) { requestAnimationFrame(loop); return; } // 开场缓冲
    const ph = phases[phaseIdx];
    phaseT += dt;
    const p = Math.min(phaseT / ph.dur, 1);
    let s;
    if (phaseIdx === 0) s = 1.0 + (1.55 - 1.0) * easeInOut(p);
    else if (phaseIdx === 1) s = 1.55;
    else s = 1.55 - (1.55 - 1.0) * easeInOut(p);
    circle.style.transform = 'scale(' + s.toFixed(3) + ')';
    circle.style.background = ph.col;
    circle.style.color = ph.col;
    text.textContent = ph.txt;
    text.style.color = ph.col;
    countEl.textContent = curRound + (targetRounds ? (' / ' + targetRounds) : '') + ' 轮';
    if (phaseT >= ph.dur) {
      phaseT = 0; phaseIdx++;
      if (phaseIdx >= phases.length) {
        phaseIdx = 0; curRound++;
        if (targetRounds && curRound >= targetRounds) { finishGame(); return; }
      }
    }
    requestAnimationFrame(loop);
  }

  // 背景粒子
  function resize() { canvas.width = root.clientWidth; canvas.height = root.clientHeight; }
  resize();
  const particles = [];
  for (let i = 0; i < 45; i++) {
    particles.push({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1, vy: -Math.random() * 0.35 - 0.05, vx: (Math.random() - 0.5) * 0.2,
      col: ['#4ad9ff', '#a06bff', '#ff7ed1', '#ffffff'][Math.floor(Math.random() * 4)],
      a: Math.random() * 0.5 + 0.2
    });
  }
  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const pt of particles) {
      pt.y += pt.vy; pt.x += pt.vx;
      if (pt.y < -5) { pt.y = canvas.height + 5; pt.x = Math.random() * canvas.width; }
      if (pt.x < -5) pt.x = canvas.width + 5;
      if (pt.x > canvas.width + 5) pt.x = -5;
      ctx.globalAlpha = pt.a; ctx.fillStyle = pt.col;
      ctx.shadowBlur = 10; ctx.shadowColor = pt.col;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    requestAnimationFrame(drawParticles);
  }
  drawParticles();
  resetGame();
}

// ==================== 2. 消灭星星情绪版 ====================
function gameStarInit(root) {
  const COLS = 8, ROWS = 10;
  const TYPES = ['😊', '😍', '😎', '🤣', '😭'];
  const BOMB = '💣', RAINBOW = '🌈';

  root.innerHTML = `
  <style>
    .st-wrap{position:relative;width:100%;height:100%;background:linear-gradient(135deg,#1a0540,#3a0a5a 60%,#0a0520);font-family:"Segoe UI",system-ui,sans-serif;color:#fff;overflow:hidden;display:flex;flex-direction:column;touch-action:manipulation}
    .st-head{padding:8px 12px;display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,.32);flex-wrap:wrap;gap:6px}
    .st-stat{font-size:12px;color:#c9b3ff}
    .st-stat b{color:#ffd76b;font-size:15px}
    .st-best{font-size:11px;color:#9d8bff}
    .st-board{flex:1;display:flex;justify-content:center;align-items:center;position:relative;overflow:hidden;padding:8px}
    .st-grid{display:grid;grid-template-columns:repeat(${COLS},1fr);gap:2px;background:rgba(0,0,0,.3);padding:4px;border-radius:8px;touch-action:none}
    .st-cell{width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:19px;cursor:pointer;border-radius:6px;transition:transform .12s,background .12s;user-select:none}
    .st-cell:hover{background:rgba(255,255,255,.14);transform:scale(1.08)}
    .st-sel{background:rgba(255,255,255,.3)!important;box-shadow:0 0 12px #fff}
    .st-shake{animation:st-shake .35s}
    @keyframes st-shake{0%,100%{transform:translate(0,0)}20%{transform:translate(-5px,3px)}40%{transform:translate(5px,-3px)}60%{transform:translate(-4px,-3px)}80%{transform:translate(4px,3px)}}
    .st-particle{position:absolute;pointer-events:none;font-size:18px;z-index:6}
    .st-combo{position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);font-size:40px;color:#ffd76b;text-shadow:0 0 22px #ff8c00;pointer-events:none;opacity:0;transition:opacity .3s;z-index:5;font-weight:bold}
    .st-levelup{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,rgba(180,80,255,.95),rgba(255,80,180,.95));padding:22px 38px;border-radius:14px;text-align:center;display:none;z-index:8;box-shadow:0 0 40px rgba(200,100,255,.7)}
    .st-levelup h2{margin:0 0 6px;font-size:24px}
    .st-levelup p{margin:0;font-size:13px;opacity:.9}
    .st-over{position:absolute;inset:0;background:rgba(10,5,32,.94);display:none;flex-direction:column;align-items:center;justify-content:center;z-index:10}
    .st-over h2{font-size:32px;color:#ff9ed8;text-shadow:0 0 24px #ff5fb0;margin:0}
    .st-over p{color:#c9b3ff;margin:10px 0}
    .st-over button{margin-top:18px;padding:10px 28px;background:linear-gradient(90deg,#6a3dff,#c93dff);border:none;border-radius:24px;color:#fff;font-size:15px;cursor:pointer;box-shadow:0 0 22px rgba(150,80,255,.6)}
  </style>
  <div class="st-wrap" id="stWrap">
    <div class="st-head">
      <div class="st-stat">第 <b id="stLevel">1</b> 关 · 目标 <b id="stTarget">500</b></div>
      <div class="st-stat">分数 <b id="stScore">0</b> · 连击 <b id="stCombo">0</b></div>
      <div class="st-best">最高 <b id="stBest">0</b></div>
    </div>
    <div class="st-board" id="stBoard">
      <div class="st-grid" id="stGrid"></div>
      <div class="st-combo" id="stComboEl"></div>
      <div class="st-levelup" id="stLevelup"><h2>过关！</h2><p>进入下一关</p></div>
      <div class="st-over" id="stOver">
        <h2 id="stOverTitle">游戏结束</h2>
        <p id="stOverText"></p>
        <button id="stRestart">重新开始</button>
      </div>
    </div>
  </div>`;

  const grid = root.querySelector('#stGrid');
  const levelEl = root.querySelector('#stLevel');
  const targetEl = root.querySelector('#stTarget');
  const scoreEl = root.querySelector('#stScore');
  const comboEl = root.querySelector('#stCombo');
  const comboDisplay = root.querySelector('#stComboEl');
  const board = root.querySelector('#stBoard');
  const wrap = root.querySelector('#stWrap');
  const levelup = root.querySelector('#stLevelup');
  const over = root.querySelector('#stOver');
  const overTitle = root.querySelector('#stOverTitle');
  const overText = root.querySelector('#stOverText');
  const restartBtn = root.querySelector('#stRestart');
  const bestEl = root.querySelector('#stBest');

  let best = parseInt(localStorage.getItem('xinji_star_best') || '0');
  bestEl.textContent = best;
  let cells = [];      // [row][col]
  let level = 1, score = 0, combo = 0;
  let target = 500;

  function randType() { return TYPES[Math.floor(Math.random() * TYPES.length)]; }
  function maybeSpecial() { return Math.random() < 0.04 ? (Math.random() < 0.5 ? BOMB : RAINBOW) : randType(); }

  function initGrid() {
    cells = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) row.push(maybeSpecial());
      cells.push(row);
    }
  }
  function render() {
    grid.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = cells[r][c];
        const div = document.createElement('div');
        div.className = 'st-cell';
        div.dataset.r = r; div.dataset.c = c;
        div.textContent = v || '';
        if (!v) div.style.visibility = 'hidden';
        grid.appendChild(div);
      }
    }
  }
  function updateUI() {
    levelEl.textContent = level;
    targetEl.textContent = target;
    scoreEl.textContent = score;
    comboEl.textContent = combo;
    if (score > best) {
      best = score;
      localStorage.setItem('xinji_star_best', best);
      bestEl.textContent = best;
    }
  }

  // BFS 找连通同色块
  function findGroup(r, c) {
    const type = cells[r][c];
    if (!type) return [];
    const visited = new Set();
    const stack = [[r, c]];
    const group = [];
    while (stack.length) {
      const [cr, cc] = stack.pop();
      const key = cr + ',' + cc;
      if (visited.has(key)) continue;
      if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLS) continue;
      if (cells[cr][cc] !== type) continue;
      visited.add(key);
      group.push([cr, cc]);
      stack.push([cr+1,cc],[cr-1,cc],[cr,cc+1],[cr,cc-1]);
    }
    return group;
  }

  // 消除并下落补位
  function eliminate(group, emoji) {
    const n = group.length;
    combo++;
    const base = n * n * 5;
    const gain = Math.floor(base * (1 + (combo - 1) * 0.15));
    score += gain;
    showCombo(combo, gain);
    group.forEach(([r, c]) => { spawnParticle(r, c, emoji); cells[r][c] = null; });
    if (n >= 6 || combo >= 3) shakeScreen();
    dropAndFill();
    render();
    updateUI();
    setTimeout(checkLevel, 50);
  }

  function dropAndFill() {
    for (let c = 0; c < COLS; c++) {
      let writeRow = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (cells[r][c] !== null) {
          if (r !== writeRow) { cells[writeRow][c] = cells[r][c]; cells[r][c] = null; }
          writeRow--;
        }
      }
      for (let r = writeRow; r >= 0; r--) cells[r][c] = maybeSpecial();
    }
  }

  function explodeBomb(r, c) {
    const group = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && cells[nr][nc]) group.push([nr, nc]);
    }
    eliminate(group, BOMB);
    shakeScreen();
  }
  function explodeRainbow(r, c) {
    const present = TYPES.filter(t => cells.some(row => row.includes(t)));
    if (present.length === 0) { cells[r][c] = null; render(); return; }
    const tgt = present[Math.floor(Math.random() * present.length)];
    const group = [];
    for (let rr = 0; rr < ROWS; rr++) for (let cc = 0; cc < COLS; cc++) {
      if (cells[rr][cc] === tgt) group.push([rr, cc]);
    }
    group.push([r, c]);
    eliminate(group, RAINBOW);
    shakeScreen();
  }

  function shakeScreen() {
    wrap.classList.remove('st-shake');
    void wrap.offsetWidth;
    wrap.classList.add('st-shake');
  }
  function showCombo(n, gain) {
    if (n < 2) return;
    comboDisplay.textContent = n + ' 连击  +' + gain;
    comboDisplay.style.opacity = '1';
    setTimeout(() => { comboDisplay.style.opacity = '0'; }, 600);
  }
  function spawnParticle(r, c, emoji) {
    const cell = grid.children[r * COLS + c];
    if (!cell) return;
    const rect = cell.getBoundingClientRect();
    const br = board.getBoundingClientRect();
    const x = rect.left - br.left + rect.width / 2;
    const y = rect.top - br.top + rect.height / 2;
    for (let i = 0; i < 4; i++) {
      const p = document.createElement('div');
      p.className = 'st-particle';
      p.textContent = emoji;
      p.style.left = x + 'px'; p.style.top = y + 'px';
      board.appendChild(p);
      const ang = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 36;
      p.animate([
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: 'translate(' + (Math.cos(ang)*dist-3) + 'px,' + (Math.sin(ang)*dist+28) + 'px) scale(.3)', opacity: 0 }
      ], { duration: 600, easing: 'ease-out' });
      setTimeout(() => p.remove(), 650);
    }
  }
  function resetCombo() { combo = 0; comboEl.textContent = 0; }

  function hasMoves() {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = cells[r][c];
      if (!t) continue;
      if (t === BOMB || t === RAINBOW) return true;
      if (findGroup(r, c).length >= 2) return true;
    }
    return false;
  }
  function checkLevel() {
    if (over.style.display === 'flex') return;
    if (score >= target) {
      level++;
      if (level > 10) { endGame(true); return; }
      target = 500 + (level - 1) * 400;
      levelup.style.display = 'block';
      setTimeout(() => {
        initGrid(); render(); updateUI();
        levelup.style.display = 'none';
      }, 1100);
      return;
    }
    if (!hasMoves()) {
      if (score < target) endGame(false);
      else { initGrid(); render(); }
    }
  }
  function endGame(win) {
    over.style.display = 'flex';
    overTitle.textContent = win ? '通关大吉！' : '游戏结束';
    overText.textContent = win ? ('最终得分 ' + score) : ('得分 ' + score + '，未达成目标 ' + target);
  }

  // 点击处理（事件委托）
  grid.addEventListener('click', e => {
    const cell = e.target.closest('.st-cell');
    if (!cell || over.style.display === 'flex' || levelup.style.display === 'block') return;
    if (!cell.textContent || cell.style.visibility === 'hidden') return;
    const r = +cell.dataset.r, c = +cell.dataset.c;
    const type = cells[r][c];
    if (!type) return;
    if (type === BOMB) { explodeBomb(r, c); return; }
    if (type === RAINBOW) { explodeRainbow(r, c); return; }
    const group = findGroup(r, c);
    if (group.length < 2) { resetCombo(); return; }
    eliminate(group, type);
  });
  restartBtn.addEventListener('click', () => {
    level = 1; score = 0; combo = 0; target = 500;
    over.style.display = 'none';
    initGrid(); render(); updateUI();
  });

  // 启动
  initGrid();
  render();
  updateUI();
}

// ==================== 3. 跳一跳 ====================
function gameJumpInit(root) {
  root.innerHTML = `
  <style>
    .jp-wrap{position:relative;width:100%;height:100%;overflow:hidden;background:linear-gradient(180deg,#0a0520,#1a0b3d 60%,#2a1050);font-family:"Segoe UI",system-ui,sans-serif;color:#fff;touch-action:none}
    .jp-canvas{display:block;width:100%;height:100%}
    .jp-ui{position:absolute;top:10px;left:0;right:0;text-align:center;color:#c9b3ff;font-size:13px;pointer-events:none;z-index:2}
    .jp-ui b{color:#ffd76b;font-size:18px}
    .jp-best{position:absolute;top:34px;right:12px;font-size:11px;color:#9d8bff;z-index:2}
    .jp-hint{position:absolute;bottom:14px;left:0;right:0;text-align:center;font-size:12px;color:#8a7bbf;z-index:2;pointer-events:none}
    .jp-super{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:46px;color:#ffd700;text-shadow:0 0 30px #ffae00;font-weight:bold;opacity:0;transition:opacity .4s;z-index:3;pointer-events:none}
    .jp-over{position:absolute;inset:0;background:rgba(10,5,32,.94);display:none;flex-direction:column;align-items:center;justify-content:center;z-index:10}
    .jp-over h2{font-size:34px;color:#ff9ed8;text-shadow:0 0 24px #ff5fb0;margin:0}
    .jp-over p{color:#c9b3ff;margin:10px 0}
    .jp-over button{margin-top:18px;padding:10px 28px;background:linear-gradient(90deg,#6a3dff,#c93dff);border:none;border-radius:24px;color:#fff;font-size:15px;cursor:pointer;box-shadow:0 0 22px rgba(150,80,255,.6)}
    .jp-skins{position:absolute;bottom:42px;left:0;right:0;text-align:center;font-size:12px;color:#8a7bbf;z-index:2;pointer-events:none}
  </style>
  <div class="jp-wrap" id="jpWrap">
    <canvas class="jp-canvas" id="jpCanvas"></canvas>
    <div class="jp-ui">得分 <b id="jpScore">0</b></div>
    <div class="jp-best">最高 <b id="jpBest">0</b></div>
    <div class="jp-skins" id="jpSkins">🤖 默认</div>
    <div class="jp-super" id="jpSuper">超神模式！</div>
    <div class="jp-hint">按住蓄力，松开起跳</div>
    <div class="jp-over" id="jpOver">
      <h2 id="jpOverTitle">游戏结束</h2>
      <p id="jpOverText"></p>
      <button id="jpRestart">重新开始</button>
    </div>
  </div>`;

  const canvas = root.querySelector('#jpCanvas');
  const ctx = canvas.getContext('2d');
  const wrap = root.querySelector('#jpWrap');
  const scoreEl = root.querySelector('#jpScore');
  const bestEl = root.querySelector('#jpBest');
  const skinsEl = root.querySelector('#jpSkins');
  const superEl = root.querySelector('#jpSuper');
  const over = root.querySelector('#jpOver');
  const overTitle = root.querySelector('#jpOverTitle');
  const overText = root.querySelector('#jpOverText');
  const restartBtn = root.querySelector('#jpRestart');

  let best = parseInt(localStorage.getItem('xinji_jump_best') || '0');
  bestEl.textContent = best;

  let W = 0, H = 0;
  function resize() { W = canvas.width = root.clientWidth; H = canvas.height = root.clientHeight; }
  resize();

  // 平台与角色
  let platforms = [];        // {d:深度, x:水平偏移, r:半径}
  let curIdx = 0;
  let char = { d: 0, x: 0, h: 0, jumping: false, charging: false, chargeStart: 0, falling: false, scaleY: 1, jumpProg: 0, startD: 0, startX: 0, jumpDist: 0, targetX: 0, maxH: 0 };
  let score = 0, centerStreak = 0;
  let superMode = false, superTimer = 0;
  let gameOver = false;
  let bgHue = 260;
  let particles = [];

  function rand(min, max) { return min + Math.random() * (max - min); }
  function nextPlatform() {
    const last = platforms[platforms.length - 1];
    const gap = 70 + score * 3.5 + rand(0, 35);
    const d = last.d + gap;
    const x = rand(-50, 50);
    const r = Math.max(15, 30 - score * 0.25 + rand(-4, 6));
    platforms.push({ d, x, r });
  }
  function getSkin() {
    if (best >= 300 || score >= 300) return '⭐';
    if (best >= 100 || score >= 100) return '🐰';
    return '🤖';
  }
  function skinLabel() {
    const s = getSkin();
    if (s === '⭐') return '⭐ 300分';
    if (s === '🐰') return '🐰 100分';
    return '🤖 默认';
  }

  function reset() {
    platforms = [{ d: 0, x: 0, r: 28 }];
    curIdx = 0;
    char = { d: 0, x: 0, h: 0, jumping: false, charging: false, chargeStart: 0, falling: false, scaleY: 1, jumpProg: 0, startD: 0, startX: 0, jumpDist: 0, targetX: 0, maxH: 0 };
    score = 0; centerStreak = 0; superMode = false; superTimer = 0; gameOver = false;
    particles = [];
    for (let i = 0; i < 4; i++) nextPlatform();
    over.style.display = 'none';
    scoreEl.textContent = 0;
    skinsEl.textContent = skinLabel();
  }

  function startCharge() {
    if (char.jumping || char.falling || gameOver) return;
    char.charging = true;
    char.chargeStart = performance.now();
  }
  function releaseCharge() {
    if (!char.charging) return;
    char.charging = false;
    const t = (performance.now() - char.chargeStart) / 1000;
    const power = Math.min(t / 1.4, 1);
    if (power < 0.05) return;
    char.jumping = true;
    char.startD = char.d; char.startX = char.x;
    char.jumpDist = power * 230;
    char.jumpProg = 0;
    char.maxH = 45 + char.jumpDist * 0.22;
    const next = platforms[curIdx + 1];
    char.targetX = next ? next.x : char.x;
  }

  function checkLanding() {
    const next = platforms[curIdx + 1];
    if (!next) { char.falling = true; return; }
    const diff = Math.abs(char.d - next.d);
    if (diff <= next.r) {
      curIdx++;
      char.d = next.d; char.x = next.x;
      let gain = 1;
      if (diff <= next.r * 0.28) {
        gain = 2; centerStreak++;
        spawnRing(next.x, next.d, '#ffd700');
        if (centerStreak >= 5 && !superMode) activateSuper();
      } else {
        centerStreak = 0;
      }
      score += gain;
      scoreEl.textContent = score;
      skinsEl.textContent = skinLabel();
      if (score > best) { best = score; localStorage.setItem('xinji_jump_best', best); bestEl.textContent = best; }
      while (platforms.length < curIdx + 5) nextPlatform();
    } else {
      char.falling = true;
    }
  }
  function activateSuper() {
    superMode = true; superTimer = 6;
    superEl.style.opacity = '1';
    setTimeout(() => { superEl.style.opacity = '0'; }, 1400);
  }
  function spawnRing(x, d, col) {
    const scale = projScale(d - platforms[curIdx].d);
    particles.push({ type: 'ring', x: W/2 + x*scale, y: groundY(d), r: 5, maxR: 40*scale, col, life: 1 });
  }
  function spawnHit(x, y, col) {
    for (let i = 0; i < 10; i++) {
      const ang = Math.random() * Math.PI * 2;
      particles.push({ type: 'spark', x, y, vx: Math.cos(ang)*rand(1,4), vy: Math.sin(ang)*rand(1,4)-1, col, life: 1 });
    }
  }

  // 投影
  const horizonY = () => H * 0.32;
  const groundY0 = () => H * 0.72;
  function projScale(relD) { return 1 / (1 + relD * 0.006); }
  function groundY(d) {
    const relD = d - platforms[curIdx].d;
    const sc = projScale(relD);
    return groundY0() + (horizonY() - groundY0()) * (1 - sc);
  }

  function update(dt) {
    if (gameOver) return;
    if (char.charging) {
      const t = (performance.now() - char.chargeStart) / 1000;
      char.scaleY = 1 - Math.min(t / 1.4, 1) * 0.4;
    } else if (!char.jumping && !char.falling) {
      char.scaleY = 1;
    }
    if (char.jumping) {
      char.jumpProg += 0.022;
      if (char.jumpProg >= 1) {
        char.jumpProg = 1;
        char.d = char.startD + char.jumpDist;
        char.x = char.targetX;
        char.h = 0;
        char.jumping = false;
        checkLanding();
      } else {
        char.d = char.startD + char.jumpDist * char.jumpProg;
        char.x = char.startX + (char.targetX - char.startX) * char.jumpProg;
        char.h = char.maxH * 4 * char.jumpProg * (1 - char.jumpProg);
      }
    }
    if (char.falling) {
      char.h -= 7;
      if (char.h < -200) endGame();
    }
    if (superMode) {
      superTimer -= dt;
      if (superTimer <= 0) superMode = false;
    }
    bgHue = (bgHue + (superMode ? 1.5 : 0.2)) % 360;
    // 粒子更新
    for (const p of particles) {
      if (p.type === 'ring') { p.r += 2; p.life -= 0.04; }
      else { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.03; }
    }
    particles = particles.filter(p => p.life > 0);
  }

  function endGame() {
    gameOver = true;
    over.style.display = 'flex';
    overTitle.textContent = '游戏结束';
    overText.textContent = '得分 ' + score + (score >= best ? '（新纪录！）' : '');
  }

  function drawPlatform(p, isCurrent) {
    const relD = p.d - platforms[curIdx].d;
    const sc = projScale(relD);
    const sx = W/2 + p.x * sc;
    const sy = groundY(p.d);
    const r = p.r * sc;
    const rh = r * 0.38;
    // 侧面（圆柱）
    ctx.fillStyle = isCurrent ? '#4a2f8a' : '#2e1f52';
    ctx.beginPath();
    ctx.moveTo(sx - r, sy);
    ctx.lineTo(sx - r, sy + r * 0.5);
    ctx.ellipse(sx, sy + r*0.5, r, rh, 0, Math.PI, 0, true);
    ctx.lineTo(sx + r, sy);
    ctx.ellipse(sx, sy, r, rh, 0, 0, Math.PI);
    ctx.closePath(); ctx.fill();
    // 顶面
    const grad = ctx.createRadialGradient(sx - r*0.3, sy - rh*0.3, 0, sx, sy, r);
    grad.addColorStop(0, isCurrent ? '#d4b8ff' : '#6a5a8a');
    grad.addColorStop(1, isCurrent ? '#6a4dba' : '#3a2a5a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(sx, sy, r, rh, 0, 0, Math.PI*2);
    ctx.fill();
    // 中心标记
    if (isCurrent) {
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.beginPath(); ctx.arc(sx, sy, Math.max(1.5, r*0.16), 0, Math.PI*2); ctx.fill();
    }
  }
  function drawChar() {
    const relD = char.d - platforms[curIdx].d;
    const sc = projScale(relD);
    const sx = W/2 + char.x * sc;
    const sy = groundY(char.d) - char.h * sc;
    const size = 38 * sc;
    ctx.save();
    ctx.translate(sx, sy - size*0.1);
    ctx.scale(1, char.scaleY);
    ctx.font = size + 'px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (superMode) { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 22; }
    else { ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 8; }
    ctx.fillText(getSkin(), 0, 0);
    ctx.restore();
    // 蓄力条
    if (char.charging) {
      const t = (performance.now() - char.chargeStart) / 1400;
      const p = Math.min(t, 1);
      const w = 90, h = 7, bx = W/2 - w/2, by = H - 46;
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(bx, by, w, h);
      const g = ctx.createLinearGradient(bx, 0, bx+w, 0);
      g.addColorStop(0,'#4ad9ff'); g.addColorStop(.5,'#ffd700'); g.addColorStop(1,'#ff4a4a');
      ctx.fillStyle = g; ctx.fillRect(bx, by, w*p, h);
    }
  }
  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      if (p.type === 'ring') {
        ctx.strokeStyle = p.col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.stroke();
      } else {
        ctx.fillStyle = p.col; ctx.shadowBlur = 8; ctx.shadowColor = p.col;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
  function drawBackground() {
    if (superMode) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'hsl(' + bgHue + ',70%,18%)');
      g.addColorStop(1, 'hsl(' + (bgHue+60) + ',70%,8%)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0a0520'); g.addColorStop(1, '#2a1050');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    // 远处光晕
    ctx.fillStyle = superMode ? 'rgba(255,200,80,.12)' : 'rgba(120,80,255,.1)';
    ctx.beginPath(); ctx.arc(W/2, horizonY(), W*0.35, 0, Math.PI*2); ctx.fill();
  }

  function render() {
    drawBackground();
    const camD = platforms[curIdx].d;
    const visible = platforms.filter(p => p.d - camD > -30 && p.d - camD < 420)
      .sort((a, b) => b.d - a.d);
    for (const p of visible) drawPlatform(p, p === platforms[curIdx]);
    drawChar();
    drawParticles();
  }

  let lastTs = 0, rafActive = false;
  function loop(ts) {
    if (gameOver && over.style.display === 'flex') { rafActive = false; return; }
    if (!lastTs) lastTs = ts;
    const dt = (ts - lastTs) / 1000; lastTs = ts;
    update(dt);
    render();
    if (gameOver && over.style.display !== 'flex') endGame();
    rafActive = true;
    requestAnimationFrame(loop);
  }
  function startLoop() { if (!rafActive) { rafActive = true; requestAnimationFrame(loop); } }

  // 输入：鼠标+触摸（pointer 事件统一）
  wrap.addEventListener('pointerdown', e => { e.preventDefault(); startCharge(); });
  wrap.addEventListener('pointerup', e => { e.preventDefault(); releaseCharge(); });
  wrap.addEventListener('pointercancel', () => releaseCharge());
  restartBtn.addEventListener('click', () => { reset(); lastTs = 0; startLoop(); });
  window.addEventListener('resize', resize);

  reset();
  startLoop();
}

// ==================== 4. 节奏大师简化版 ====================
function gameRhythmInit(root) {
  root.innerHTML = `
  <style>
    .rh-wrap{position:relative;width:100%;height:100%;overflow:hidden;background:radial-gradient(circle at 50% 50%,#1a0b3d,#0a0520);font-family:"Segoe UI",system-ui,sans-serif;color:#fff;touch-action:none}
    .rh-canvas{display:block;width:100%;height:100%}
    .rh-ui{position:absolute;top:10px;left:0;right:0;text-align:center;color:#c9b3ff;font-size:13px;pointer-events:none;z-index:2}
    .rh-ui b{color:#ffd76b;font-size:18px}
    .rh-combo{position:absolute;top:48px;left:0;right:0;text-align:center;font-size:22px;color:#4ad9ff;text-shadow:0 0 18px #4ad9ff;z-index:2;pointer-events:none}
    .rh-miss{position:absolute;top:72px;left:0;right:0;text-align:center;font-size:12px;color:#ff6b6b;z-index:2;pointer-events:none}
    .rh-best{position:absolute;top:12px;right:12px;font-size:11px;color:#9d8bff;z-index:2}
    .rh-modes{position:absolute;bottom:14px;left:0;right:0;text-align:center;z-index:2}
    .rh-modes span{display:inline-block;margin:0 4px;padding:6px 14px;background:rgba(255,255,255,.08);border:1px solid rgba(201,179,255,.3);border-radius:18px;font-size:12px;color:#c9b3ff;cursor:pointer;transition:.2s}
    .rh-modes span.rh-active{background:rgba(180,120,255,.4);border-color:#b478ff;box-shadow:0 0 12px rgba(180,120,255,.5);color:#fff}
    .rh-ascend{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:48px;color:#aef;font-weight:bold;text-shadow:0 0 30px #6cf;opacity:0;transition:opacity .5s;z-index:3;pointer-events:none}
    .rh-over{position:absolute;inset:0;background:rgba(10,5,32,.94);display:none;flex-direction:column;align-items:center;justify-content:center;z-index:10}
    .rh-over h2{font-size:32px;color:#ff9ed8;text-shadow:0 0 24px #ff5fb0;margin:0}
    .rh-over p{color:#c9b3ff;margin:10px 0}
    .rh-over button{margin-top:18px;padding:10px 28px;background:linear-gradient(90deg,#6a3dff,#c93dff);border:none;border-radius:24px;color:#fff;font-size:15px;cursor:pointer;box-shadow:0 0 22px rgba(150,80,255,.6)}
  </style>
  <div class="rh-wrap" id="rhWrap">
    <canvas class="rh-canvas" id="rhCanvas"></canvas>
    <div class="rh-ui">得分 <b id="rhScore">0</b></div>
    <div class="rh-best">最高 <b id="rhBest">0</b></div>
    <div class="rh-combo" id="rhCombo">连击 0</div>
    <div class="rh-miss" id="rhMiss"></div>
    <div class="rh-ascend" id="rhAscend">飞升！</div>
    <div class="rh-modes" id="rhModes">
      <span data-m="heart" class="rh-active">心跳</span>
      <span data-m="disco">蹦迪</span>
      <span data-m="random">随机</span>
    </div>
    <div class="rh-over" id="rhOver">
      <h2>游戏结束</h2>
      <p id="rhOverText"></p>
      <button id="rhRestart">重新开始</button>
    </div>
  </div>`;

  const canvas = root.querySelector('#rhCanvas');
  const ctx = canvas.getContext('2d');
  const wrap = root.querySelector('#rhWrap');
  const scoreEl = root.querySelector('#rhScore');
  const bestEl = root.querySelector('#rhBest');
  const comboEl = root.querySelector('#rhCombo');
  const missEl = root.querySelector('#rhMiss');
  const ascendEl = root.querySelector('#rhAscend');
  const modes = root.querySelector('#rhModes');
  const over = root.querySelector('#rhOver');
  const overText = root.querySelector('#rhOverText');
  const restartBtn = root.querySelector('#rhRestart');

  let best = parseInt(localStorage.getItem('xinji_rhythm_best') || '0');
  bestEl.textContent = best;

  let W = 0, H = 0, CX = 0, CY = 0, R = 0;
  function resize() {
    W = canvas.width = root.clientWidth; H = canvas.height = root.clientHeight;
    CX = W / 2; CY = H / 2;
    R = Math.min(W, H) * 0.32;
  }
  resize();

  // 状态
  let notes = [];   // {r, speed, color, hit, missed}
  let particles = [];
  let score = 0, combo = 0, missCount = 0;
  let mode = 'heart';
  let spawnTimer = 0;
  let ascendActive = false, ascendTimer = 0;
  let gameOver = false;
  let bgStars = [];
  for (let i = 0; i < 80; i++) bgStars.push({ x: Math.random(), y: Math.random(), s: Math.random()*1.5+0.5, tw: Math.random()*Math.PI*2 });
  let flashColor = null, flashT = 0;

  const NOTE_COLORS = ['#4ad9ff', '#a06bff', '#ff7ed1', '#ffd76b', '#7eff9e'];

  // Web Audio
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){} }
  }
  function playTone(freq, type, dur, vol) {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type; osc.frequency.value = freq;
    osc.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t); osc.stop(t + dur);
  }
  function playSound(kind) {
    initAudio();
    if (!audioCtx) return;
    if (kind === 'perfect') {
      const scale = [523, 587, 659, 698, 784, 880][Math.min(combo, 5)];
      playTone(scale, 'sine', 0.18, 0.25);
    } else if (kind === 'good') {
      playTone(440, 'sine', 0.14, 0.18);
    } else if (kind === 'miss') {
      playTone(120, 'sawtooth', 0.2, 0.12);
    } else if (kind === 'beat') {
      playTone(80, 'square', 0.08, 0.15);
    }
  }

  function getSpawnInterval() {
    if (mode === 'heart') return 1.15;
    if (mode === 'disco') return 0.42;
    return 0.3 + Math.random() * 1.1;
  }
  function getNoteSpeed() {
    if (mode === 'heart') return R / 1.5;
    if (mode === 'disco') return R / 0.85;
    return R / (0.8 + Math.random() * 0.7);
  }
  function spawnNote() {
    notes.push({ r: 0, speed: getNoteSpeed(), color: NOTE_COLORS[Math.floor(Math.random()*NOTE_COLORS.length)], hit: false, missed: false });
  }

  function reset() {
    notes = []; particles = [];
    score = 0; combo = 0; missCount = 0;
    spawnTimer = 0; ascendActive = false; ascendTimer = 0;
    gameOver = false; flashColor = null; flashT = 0;
    over.style.display = 'none';
    scoreEl.textContent = 0; comboEl.textContent = '连击 0'; missEl.textContent = '';
  }

  function judgeClick() {
    initAudio();
    const active = notes.filter(n => !n.hit && !n.missed);
    if (active.length === 0) return;
    let bestN = null, bestDiff = Infinity;
    for (const n of active) {
      const diff = Math.abs(n.r - R);
      if (diff < bestDiff) { bestDiff = diff; bestN = n; }
    }
    if (bestDiff < R * 0.1) {
      bestN.hit = true;
      score += 100 + combo; combo++;
      spawnHitParticles(bestN.color);
      playSound('perfect');
      flashColor = bestN.color; flashT = 0.3;
      if (combo > 0 && combo % 20 === 0) triggerAscend();
    } else if (bestDiff < R * 0.25) {
      bestN.hit = true;
      score += 50; combo++;
      spawnHitParticles(bestN.color);
      playSound('good');
    } else {
      // 点到了但太早/太晚
      bestN.missed = true;
      miss();
    }
    updateUI();
  }
  function miss(note) {
    if (note) note.missed = true;
    combo = 0; missCount++;
    playSound('miss');
    missEl.textContent = 'Miss ' + missCount + '/5';
    if (missCount >= 5) endGame();
    updateUI();
  }
  function triggerAscend() {
    ascendActive = true; ascendTimer = 5;
    ascendEl.style.opacity = '1';
    setTimeout(() => { ascendEl.style.opacity = '0'; }, 1500);
  }
  function spawnHitParticles(col) {
    for (let i = 0; i < 14; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 4;
      particles.push({ x: CX, y: CY, vx: Math.cos(ang)*sp, vy: Math.sin(ang)*sp, col, life: 1 });
    }
  }
  function updateUI() {
    scoreEl.textContent = score;
    comboEl.textContent = '连击 ' + combo;
    if (score > best) { best = score; localStorage.setItem('xinji_rhythm_best', best); bestEl.textContent = best; }
  }
  function endGame() {
    gameOver = true;
    over.style.display = 'flex';
    overText.textContent = '得分 ' + score + (score >= best ? '（新纪录！）' : '');
  }

  function update(dt) {
    if (gameOver) return;
    spawnTimer += dt;
    if (spawnTimer >= getSpawnInterval()) {
      spawnTimer = 0;
      spawnNote();
      if (mode === 'disco') playSound('beat');
    }
    // 节奏点扩散
    for (const n of notes) {
      if (!n.hit && !n.missed) {
        n.r += n.speed * dt;
        if (n.r > R * 1.35) miss(n);
      }
    }
    notes = notes.filter(n => n.r < R * 2 && !n.hit);
    // 粒子
    for (const p of particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.025; }
    particles = particles.filter(p => p.life > 0);
    if (ascendActive) { ascendTimer -= dt; if (ascendTimer <= 0) ascendActive = false; }
    if (flashT > 0) flashT -= dt;
    for (const s of bgStars) s.tw += dt * 2;
  }

  function render() {
    // 背景
    if (ascendActive) {
      const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(W, H));
      g.addColorStop(0, '#1a0b3d'); g.addColorStop(1, '#020010');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // 星空
      ctx.fillStyle = '#fff';
      for (const s of bgStars) {
        ctx.globalAlpha = 0.3 + Math.sin(s.tw) * 0.3 + 0.4;
        ctx.fillRect(s.x * W, s.y * H, s.s, s.s);
      }
      ctx.globalAlpha = 1;
    } else {
      const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(W, H)*0.7);
      g.addColorStop(0, '#1a0b3d'); g.addColorStop(1, '#0a0520');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    // 命中闪光
    if (flashT > 0 && flashColor) {
      ctx.globalAlpha = flashT * 1.5;
      ctx.fillStyle = flashColor;
      ctx.beginPath(); ctx.arc(CX, CY, R * 1.6, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // 判定圈（外圈）
    ctx.strokeStyle = ascendActive ? '#aef' : '#7a5dba';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 16; ctx.shadowColor = ascendActive ? '#6cf' : '#7a5dba';
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0;
    // 节奏点（从中心向外扩散的环）
    for (const n of notes) {
      if (n.hit) continue;
      ctx.strokeStyle = n.color;
      ctx.lineWidth = 4;
      ctx.globalAlpha = n.missed ? 0.3 : 1;
      ctx.shadowBlur = 12; ctx.shadowColor = n.color;
      ctx.beginPath(); ctx.arc(CX, CY, n.r, 0, Math.PI*2); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    // 中心点击区
    const cg = ctx.createRadialGradient(CX, CY, 0, CX, CY, 30);
    cg.addColorStop(0, 'rgba(255,255,255,.5)');
    cg.addColorStop(1, 'rgba(180,120,255,.1)');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(CX, CY, 28, 0, Math.PI*2); ctx.fill();
    // 粒子
    for (const p of particles) {
      ctx.globalAlpha = p.life; ctx.fillStyle = p.col;
      ctx.shadowBlur = 8; ctx.shadowColor = p.col;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }

  let lastTs = 0, rafActive = false;
  function loop(ts) {
    if (gameOver && over.style.display === 'flex') { rafActive = false; return; }
    if (!lastTs) lastTs = ts;
    const dt = (ts - lastTs) / 1000; lastTs = ts;
    update(dt);
    render();
    rafActive = true;
    requestAnimationFrame(loop);
  }
  function startLoop() { if (!rafActive) { rafActive = true; requestAnimationFrame(loop); } }

  // 输入
  wrap.addEventListener('pointerdown', e => { e.preventDefault(); judgeClick(); });
  modes.addEventListener('click', e => {
    const sp = e.target;
    if (sp.dataset && sp.dataset.m) {
      modes.querySelectorAll('span').forEach(s => s.classList.remove('rh-active'));
      sp.classList.add('rh-active');
      mode = sp.dataset.m;
      reset();
    }
  });
  restartBtn.addEventListener('click', () => { reset(); lastTs = 0; startLoop(); });
  window.addEventListener('resize', resize);

  reset();
  startLoop();
}
