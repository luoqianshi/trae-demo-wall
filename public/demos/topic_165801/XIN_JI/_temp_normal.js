// =====================================================================
// 一般组 - 轻度娱乐类游戏（4个）
// 所有函数自包含，CSS类名加前缀，变量在函数内部声明
// =====================================================================

// ---------------------------------------------------------------------
// 游戏1：涂鸦画板
// ---------------------------------------------------------------------
function gameDoodleInit(root) {
  // 颜色配置（15种颜色，按色系排列）
  const COLORS = [
    '#1a1a1a', '#6b7280', '#9ca3af', // 灰阶3色
    '#ef4444', '#f97316', '#f59e0b', // 暖色3色
    '#eab308', '#84cc16', '#10b981', // 黄绿3色
    '#06b6d4', '#3b82f6', '#6366f1', // 冷色3色
    '#8b5cf6', '#d946ef', '#ec4899'  // 紫粉3色
  ];
  const MAX_HISTORY = 20;

  let canvas, ctx;
  let isDrawing = false;
  let lastX = 0, lastY = 0;
  let currentColor = '#1a1a1a';
  let brushSize = 8;
  let isEraser = false;
  let history = [];
  let historyStep = -1;

  root.innerHTML = `
    <style>
      .doodle-wrap{font-family:'Segoe UI','Microsoft YaHei',sans-serif;color:#fff;max-width:820px;margin:0 auto;padding:12px;}
      .doodle-title{font-size:24px;font-weight:800;text-align:center;background:linear-gradient(90deg,#6366f1,#ec4899);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:6px;}
      .doodle-sub{text-align:center;color:rgba(255,255,255,.6);font-size:13px;margin-bottom:12px;}
      .doodle-canvas-box{position:relative;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.3);margin:0 auto;}
      .doodle-canvas{display:block;cursor:crosshair;touch-action:none;}
      .doodle-toolbar{display:flex;flex-direction:column;gap:10px;align-items:center;margin-top:14px;background:rgba(255,255,255,.08);padding:12px 18px;border-radius:16px;border:1px solid rgba(255,255,255,.1);}
      .doodle-palette{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;max-width:420px;}
      .doodle-color{width:26px;height:26px;border-radius:50%;border:2.5px solid transparent;cursor:pointer;transition:all .2s;position:relative;}
      .doodle-color:hover{transform:scale(1.2);}
      .doodle-color.active{border-color:#fff;transform:scale(1.15);box-shadow:0 0 10px rgba(255,255,255,.5);}
      .doodle-size-row{display:flex;align-items:center;gap:10px;width:100%;max-width:380px;}
      .doodle-size-label{font-size:12px;color:rgba(255,255,255,.6);min-width:56px;}
      .doodle-size-slider{flex:1;-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;background:rgba(255,255,255,.2);outline:none;}
      .doodle-size-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:18px;height:18px;border-radius:50%;background:#6366f1;cursor:pointer;transition:all .2s;}
      .doodle-size-slider::-webkit-slider-thumb:hover{transform:scale(1.2);}
      .doodle-size-val{font-size:13px;color:#fff;font-weight:600;min-width:32px;text-align:right;}
      .doodle-preview{width:46px;height:28px;display:flex;align-items:center;justify-content:center;border-left:1px solid rgba(255,255,255,.15);padding-left:8px;}
      .doodle-dot{border-radius:50%;background:#333;transition:all .1s;}
      .doodle-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center;}
      .doodle-btn{width:36px;height:36px;border-radius:50%;border:none;background:rgba(255,255,255,.12);cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;}
      .doodle-btn:hover{background:rgba(255,255,255,.2);transform:scale(1.05);}
      .doodle-btn.active{background:linear-gradient(135deg,#6366f1,#8b5cf6);}
      .doodle-divider{width:1px;height:24px;background:rgba(255,255,255,.15);}
      .doodle-tip{margin-top:10px;color:rgba(255,255,255,.4);font-size:12px;text-align:center;}
    </style>
    <div class="doodle-wrap">
      <div class="doodle-title">🎨 涂鸦画板</div>
      <div class="doodle-sub">随意涂抹，让情绪流淌在指尖</div>
      <div class="doodle-canvas-box">
        <canvas class="doodle-canvas" id="doodleCanvas" width="760" height="440"></canvas>
      </div>
      <div class="doodle-toolbar">
        <div class="doodle-palette" id="doodlePalette"></div>
        <div class="doodle-size-row">
          <span class="doodle-size-label">画笔粗细</span>
          <input type="range" class="doodle-size-slider" id="doodleSize" min="2" max="50" value="8">
          <span class="doodle-size-val" id="doodleSizeVal">8px</span>
          <div class="doodle-preview">
            <div class="doodle-dot" id="doodleDot"></div>
          </div>
        </div>
        <div class="doodle-tools">
          <button class="doodle-btn" id="doodleUndo" title="撤销 Ctrl+Z">↶</button>
          <button class="doodle-btn" id="doodleRedo" title="重做 Ctrl+Shift+Z">↷</button>
          <div class="doodle-divider"></div>
          <button class="doodle-btn" id="doodleEraser" title="橡皮擦">🧽</button>
          <button class="doodle-btn" id="doodleClear" title="清空画布">🗑️</button>
          <button class="doodle-btn" id="doodleSave" title="保存PNG">💾</button>
        </div>
      </div>
      <div class="doodle-tip">快捷键：Ctrl+Z 撤销 / Ctrl+Shift+Z 重做</div>
    </div>
  `;

  canvas = root.querySelector('#doodleCanvas');
  ctx = canvas.getContext('2d');
  const paletteEl = root.querySelector('#doodlePalette');
  const sizeSlider = root.querySelector('#doodleSize');
  const sizeValEl = root.querySelector('#doodleSizeVal');
  const dotEl = root.querySelector('#doodleDot');
  const undoBtn = root.querySelector('#doodleUndo');
  const redoBtn = root.querySelector('#doodleRedo');
  const eraserBtn = root.querySelector('#doodleEraser');
  const clearBtn = root.querySelector('#doodleClear');
  const saveBtn = root.querySelector('#doodleSave');

  // 自适应画布宽度
  function resizeCanvas() {
    const maxW = Math.min(760, root.clientWidth - 24);
    const ratio = canvas.height / canvas.width;
    canvas.style.width = maxW + 'px';
    canvas.style.height = (maxW * ratio) + 'px';
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // 初始化调色板
  COLORS.forEach((color, idx) => {
    const btn = document.createElement('div');
    btn.className = 'doodle-color' + (idx === 0 ? ' active' : '');
    btn.style.background = color;
    btn.dataset.color = color;
    btn.addEventListener('click', () => {
      root.querySelectorAll('.doodle-color').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentColor = color;
      isEraser = false;
      eraserBtn.classList.remove('active');
      updateDot();
    });
    paletteEl.appendChild(btn);
  });

  // 更新笔刷预览点
  function updateDot() {
    const s = Math.min(brushSize, 24);
    dotEl.style.width = s + 'px';
    dotEl.style.height = s + 'px';
    dotEl.style.background = isEraser ? '#e5e5e5' : currentColor;
  }
  updateDot();

  // 保存历史
  function saveHistory() {
    historyStep++;
    if (historyStep < history.length) history = history.slice(0, historyStep);
    history.push(canvas.toDataURL());
    if (history.length > MAX_HISTORY) { history.shift(); historyStep--; }
    updateHistBtns();
  }

  function updateHistBtns() {
    undoBtn.style.opacity = historyStep > 0 ? '1' : '0.4';
    redoBtn.style.opacity = historyStep < history.length - 1 ? '1' : '0.4';
  }

  function undo() {
    if (historyStep > 0) {
      historyStep--;
      restore(history[historyStep]);
    }
  }
  function redo() {
    if (historyStep < history.length - 1) {
      historyStep++;
      restore(history[historyStep]);
    }
  }
  function restore(dataUrl) {
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  }

  // 初始化画布
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  saveHistory();

  // 获取坐标
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const t = e.touches ? e.touches[0] : e;
    return {
      x: (t.clientX - rect.left) * sx,
      y: (t.clientY - rect.top) * sy
    };
  }

  function startDraw(e) {
    isDrawing = true;
    const p = getPos(e);
    lastX = p.x; lastY = p.y;
  }
  function draw(e) {
    if (!isDrawing) return;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = isEraser ? '#ffffff' : currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastX = p.x; lastY = p.y;
  }
  function stopDraw() {
    if (isDrawing) { isDrawing = false; saveHistory(); }
  }

  // 鼠标事件
  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);
  // 触摸事件
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(e); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); }, { passive: false });
  canvas.addEventListener('touchend', stopDraw);

  // 粗细滑块
  sizeSlider.addEventListener('input', () => {
    brushSize = +sizeSlider.value;
    sizeValEl.textContent = brushSize + 'px';
    updateDot();
  });

  // 橡皮擦
  eraserBtn.addEventListener('click', () => {
    isEraser = !isEraser;
    eraserBtn.classList.toggle('active');
    if (isEraser) {
      root.querySelectorAll('.doodle-color').forEach(b => b.classList.remove('active'));
    }
    updateDot();
  });

  // 清空
  clearBtn.addEventListener('click', () => {
    if (confirm('确定要清空画布吗？')) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveHistory();
    }
  });

  // 保存
  saveBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `涂鸦_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  });

  // 撤销重做按钮
  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);

  // 键盘快捷键
  function onKey(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
    }
  }
  document.addEventListener('keydown', onKey);
}


// ---------------------------------------------------------------------
// 游戏2：2048情绪版
// ---------------------------------------------------------------------
function game2048Init(root) {
  const EMOJIS = ['😐', '😊', '🤩', '🥳', '🤗', '😇', '🥰', '😍', '🌟', '💫'];
  const GRID = 4;
  let grid = [];
  let score = 0;
  let bestScore = 0;
  let unlocked = [1, 2];
  let touchStartX = 0, touchStartY = 0;
  let gameOver = false;

  root.innerHTML = `
    <style>
      .t2048-wrap{font-family:'Segoe UI','Microsoft YaHei',sans-serif;color:#fff;max-width:440px;margin:0 auto;padding:12px;}
      .t2048-title{font-size:26px;font-weight:800;text-align:center;background:linear-gradient(90deg,#fbbf24,#ec4899);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:8px;}
      .t2048-score-row{display:flex;gap:12px;margin-bottom:14px;}
      .t2048-score-box{flex:1;background:rgba(255,255,255,.1);backdrop-filter:blur(10px);border-radius:14px;padding:12px;text-align:center;border:1px solid rgba(255,255,255,.15);}
      .t2048-score-label{font-size:11px;color:rgba(255,255,255,.6);margin-bottom:3px;}
      .t2048-score-val{font-size:22px;font-weight:bold;color:#fff;}
      .t2048-best .t2048-score-val{background:linear-gradient(135deg,#fbbf24,#f59e0b);-webkit-background-clip:text;background-clip:text;color:transparent;}
      .t2048-board{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:10px;background:rgba(255,255,255,.08);backdrop-filter:blur(15px);border-radius:18px;border:1px solid rgba(255,255,255,.15);box-shadow:0 8px 30px rgba(0,0,0,.25);}
      .t2048-cell{aspect-ratio:1;background:rgba(255,255,255,.06);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:34px;transition:all .15s ease;position:relative;}
      .t2048-cell.has{animation:t2048pop .2s ease;}
      @keyframes t2048pop{0%{transform:scale(0);}50%{transform:scale(1.2);}100%{transform:scale(1);}}
      .t2048-cell.merged{animation:t2048merge .3s ease;}
      @keyframes t2048merge{0%{transform:scale(1);}50%{transform:scale(1.3);}100%{transform:scale(1);}}
      .t2048-cell[data-lv="1"]{background:linear-gradient(135deg,#94a3b8,#64748b);}
      .t2048-cell[data-lv="2"]{background:linear-gradient(135deg,#60a5fa,#3b82f6);}
      .t2048-cell[data-lv="3"]{background:linear-gradient(135deg,#a78bfa,#8b5cf6);}
      .t2048-cell[data-lv="4"]{background:linear-gradient(135deg,#f472b6,#ec4899);}
      .t2048-cell[data-lv="5"]{background:linear-gradient(135deg,#fb923c,#f97316);}
      .t2048-cell[data-lv="6"]{background:linear-gradient(135deg,#facc15,#eab308);}
      .t2048-cell[data-lv="7"]{background:linear-gradient(135deg,#4ade80,#22c55e);}
      .t2048-cell[data-lv="8"]{background:linear-gradient(135deg,#2dd4bf,#14b8a6);}
      .t2048-cell[data-lv="9"]{background:linear-gradient(135deg,#fbbf24,#f59e0b);box-shadow:0 0 18px rgba(251,191,36,.5);}
      .t2048-cell[data-lv="10"]{background:linear-gradient(135deg,#f472b6,#8b5cf6);box-shadow:0 0 25px rgba(236,72,153,.6);}
      .t2048-controls{display:flex;gap:12px;margin-top:18px;}
      .t2048-btn{flex:1;padding:13px;background:linear-gradient(135deg,#8b5cf6,#ec4899);border:none;border-radius:14px;color:#fff;font-size:15px;font-weight:bold;cursor:pointer;transition:all .3s;}
      .t2048-btn:hover{transform:translateY(-2px);box-shadow:0 5px 18px rgba(139,92,246,.5);}
      .t2048-btn.sec{background:rgba(255,255,255,.12);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.2);}
      .t2048-collection{margin-top:14px;background:rgba(255,255,255,.08);border-radius:14px;padding:10px 14px;border:1px solid rgba(255,255,255,.1);}
      .t2048-coll-label{font-size:12px;color:rgba(255,255,255,.6);margin-bottom:6px;text-align:center;}
      .t2048-coll-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;}
      .t2048-coll-item{aspect-ratio:1;background:rgba(255,255,255,.06);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;position:relative;}
      .t2048-coll-item.locked{filter:grayscale(1) brightness(.4);}
      .t2048-coll-item.locked::after{content:'🔒';position:absolute;font-size:10px;}
      .t2048-tip{margin-top:12px;color:rgba(255,255,255,.45);font-size:12px;text-align:center;line-height:1.5;}
      .t2048-ovr{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(5px);display:none;align-items:center;justify-content:center;z-index:99;}
      .t2048-ovr.show{display:flex;animation:t2048fade .3s ease;}
      @keyframes t2048fade{from{opacity:0;}to{opacity:1;}}
      .t2048-modal{background:rgba(30,30,60,.95);backdrop-filter:blur(20px);border-radius:22px;padding:26px;max-width:340px;width:85%;border:1px solid rgba(255,255,255,.2);box-shadow:0 15px 50px rgba(0,0,0,.5);text-align:center;animation:t2048up .3s ease;}
      @keyframes t2048up{from{transform:translateY(30px);opacity:0;}to{transform:translateY(0);opacity:1;}}
      .t2048-modal h2{color:#fff;margin-bottom:12px;font-size:22px;}
      .t2048-over-emoji{font-size:58px;margin-bottom:10px;}
      .t2048-over-score{color:#fbbf24;font-size:28px;font-weight:bold;margin:10px 0 18px;}
    </style>
    <div class="t2048-wrap">
      <div class="t2048-title">😊 2048情绪版</div>
      <div class="t2048-score-row">
        <div class="t2048-score-box">
          <div class="t2048-score-label">当前分数</div>
          <div class="t2048-score-val" id="t2048score">0</div>
        </div>
        <div class="t2048-score-box t2048-best">
          <div class="t2048-score-label">最高分</div>
          <div class="t2048-score-val" id="t2048best">0</div>
        </div>
      </div>
      <div class="t2048-board" id="t2048board"></div>
      <div class="t2048-collection">
        <div class="t2048-coll-label">📚 已解锁表情</div>
        <div class="t2048-coll-grid" id="t2048coll"></div>
      </div>
      <div class="t2048-controls">
        <button class="t2048-btn sec" id="t2048restart">🔄 重新开始</button>
      </div>
      <div class="t2048-tip">使用方向键或滑动屏幕移动表情<br>合成更高级的表情，收集全部10种！</div>
    </div>
    <div class="t2048-ovr" id="t2048over">
      <div class="t2048-modal">
        <div class="t2048-over-emoji">😢</div>
        <h2>游戏结束！</h2>
        <div class="t2048-over-score" id="t2048overscore">0</div>
        <button class="t2048-btn" id="t2048again">再来一局</button>
      </div>
    </div>
  `;

  const boardEl = root.querySelector('#t2048board');
  const scoreEl = root.querySelector('#t2048score');
  const bestEl = root.querySelector('#t2048best');
  const collEl = root.querySelector('#t2048coll');
  const overEl = root.querySelector('#t2048over');
  const overScoreEl = root.querySelector('#t2048overscore');

  // 读取存档
  bestScore = parseInt(localStorage.getItem('xinji_2048_best') || '0');
  unlocked = JSON.parse(localStorage.getItem('xinji_2048_unlocked') || '[1, 2]');
  bestEl.textContent = bestScore;

  // 渲染图鉴
  function renderColl() {
    collEl.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
      const item = document.createElement('div');
      item.className = 't2048-coll-item' + (unlocked.includes(i) ? '' : ' locked');
      item.textContent = EMOJIS[i - 1];
      item.title = '等级 ' + i;
      collEl.appendChild(item);
    }
  }
  renderColl();

  // 初始化
  function resetGame() {
    grid = Array(GRID).fill(null).map(() => Array(GRID).fill(0));
    score = 0;
    gameOver = false;
    overEl.classList.remove('show');
    updateScore();
    addTile();
    addTile();
    render();
  }

  function addTile() {
    const empty = [];
    for (let i = 0; i < GRID; i++)
      for (let j = 0; j < GRID; j++)
        if (grid[i][j] === 0) empty.push([i, j]);
    if (empty.length === 0) return false;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 1 : 2;
    return true;
  }

  function render() {
    boardEl.innerHTML = '';
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const cell = document.createElement('div');
        cell.className = 't2048-cell';
        if (grid[i][j] > 0) {
          cell.classList.add('has');
          cell.dataset.lv = grid[i][j];
          cell.textContent = EMOJIS[grid[i][j] - 1];
        }
        boardEl.appendChild(cell);
      }
    }
  }

  function updateScore() {
    scoreEl.textContent = score;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('xinji_2048_best', bestScore);
      bestEl.textContent = bestScore;
    }
  }

  function unlock(lv) {
    if (!unlocked.includes(lv)) {
      unlocked.push(lv);
      unlocked.sort((a, b) => a - b);
      localStorage.setItem('xinji_2048_unlocked', JSON.stringify(unlocked));
      renderColl();
    }
  }

  function move(dir) {
    if (gameOver) return;
    let moved = false;
    const newGrid = grid.map(r => [...r]);

    if (dir === 'left' || dir === 'right') {
      for (let i = 0; i < GRID; i++) {
        let row = newGrid[i].filter(x => x !== 0);
        if (dir === 'right') row.reverse();
        const nr = [];
        for (let j = 0; j < row.length; j++) {
          if (j < row.length - 1 && row[j] === row[j + 1]) {
            const nl = row[j] + 1;
            nr.push(nl);
            score += Math.pow(2, nl);
            unlock(nl);
            j++;
          } else nr.push(row[j]);
        }
        while (nr.length < GRID) nr.push(0);
        if (dir === 'right') nr.reverse();
        for (let j = 0; j < GRID; j++) {
          if (newGrid[i][j] !== nr[j]) moved = true;
          newGrid[i][j] = nr[j];
        }
      }
    } else {
      for (let j = 0; j < GRID; j++) {
        let col = [];
        for (let i = 0; i < GRID; i++) if (newGrid[i][j] !== 0) col.push(newGrid[i][j]);
        if (dir === 'down') col.reverse();
        const nc = [];
        for (let i = 0; i < col.length; i++) {
          if (i < col.length - 1 && col[i] === col[i + 1]) {
            const nl = col[i] + 1;
            nc.push(nl);
            score += Math.pow(2, nl);
            unlock(nl);
            i++;
          } else nc.push(col[i]);
        }
        while (nc.length < GRID) nc.push(0);
        if (dir === 'down') nc.reverse();
        for (let i = 0; i < GRID; i++) {
          if (newGrid[i][j] !== nc[i]) moved = true;
          newGrid[i][j] = nc[i];
        }
      }
    }

    if (moved) {
      grid = newGrid;
      addTile();
      updateScore();
      render();
      checkOver();
    }
  }

  function checkOver() {
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        if (grid[i][j] === 0) return;
        if (j < GRID - 1 && grid[i][j] === grid[i][j + 1]) return;
        if (i < GRID - 1 && grid[i][j] === grid[i + 1][j]) return;
      }
    }
    gameOver = true;
    overScoreEl.textContent = score;
    overEl.classList.add('show');
  }

  // 键盘
  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); move('up'); break;
      case 'ArrowDown': e.preventDefault(); move('down'); break;
      case 'ArrowLeft': e.preventDefault(); move('left'); break;
      case 'ArrowRight': e.preventDefault(); move('right'); break;
    }
  });

  // 触摸
  boardEl.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  boardEl.addEventListener('touchend', (e) => {
    if (!touchStartX && touchStartX !== 0) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) move(dx > 0 ? 'right' : 'left');
    } else {
      if (Math.abs(dy) > 30) move(dy > 0 ? 'down' : 'up');
    }
    touchStartX = null; touchStartY = null;
  }, { passive: true });

  root.querySelector('#t2048restart').addEventListener('click', resetGame);
  root.querySelector('#t2048again').addEventListener('click', resetGame);

  resetGame();
}


// ---------------------------------------------------------------------
// 游戏3：找不同
// ---------------------------------------------------------------------
function gameDiffInit(root) {
  // 关卡数据
  const LEVELS = [
    {
      name: '校园', emoji: '🏫', sticker: '🎒',
      bg: 'linear-gradient(180deg, #87ceeb 0%, #98fb98 70%, #90ee90 100%)',
      items: [
        { emoji: '🏫', x: 50, y: 30, size: 54 },
        { emoji: '🌳', x: 15, y: 55, size: 40 },
        { emoji: '🌳', x: 85, y: 60, size: 40 },
        { emoji: '☀️', x: 80, y: 10, size: 32 },
        { emoji: '🎒', x: 30, y: 70, size: 28 },
        { emoji: '📚', x: 60, y: 75, size: 26 },
        { emoji: '🦋', x: 45, y: 20, size: 22 },
        { emoji: '🌼', x: 20, y: 85, size: 20 },
        { emoji: '🌼', x: 70, y: 88, size: 20 },
        { emoji: '🐦', x: 25, y: 15, size: 18 },
      ],
      diffs: [
        { index: 3, prop: 'emoji', value: '⛅', desc: '太阳变云' },
        { index: 5, prop: 'emoji', value: '📖', desc: '书本变化' },
        { index: 6, prop: 'x', value: 55, desc: '蝴蝶移动' },
        { index: 7, prop: 'emoji', value: '🌸', desc: '花朵变化' },
        { index: 9, prop: 'size', value: 26, desc: '小鸟变大' },
      ]
    },
    {
      name: '动物园', emoji: '🦁', sticker: '🦁',
      bg: 'linear-gradient(180deg, #ffd89b 0%, #19547b 100%)',
      items: [
        { emoji: '🦁', x: 50, y: 50, size: 50 },
        { emoji: '🐘', x: 20, y: 55, size: 45 },
        { emoji: '🦒', x: 75, y: 35, size: 45 },
        { emoji: '🌴', x: 10, y: 30, size: 40 },
        { emoji: '🌴', x: 90, y: 25, size: 40 },
        { emoji: '🐒', x: 85, y: 70, size: 28 },
        { emoji: '🦜', x: 15, y: 15, size: 23 },
        { emoji: '🌿', x: 35, y: 80, size: 26 },
        { emoji: '🌿', x: 65, y: 82, size: 26 },
        { emoji: '🦋', x: 40, y: 25, size: 20 },
      ],
      diffs: [
        { index: 0, prop: 'emoji', value: '🐯', desc: '狮子变老虎' },
        { index: 2, prop: 'size', value: 55, desc: '长颈鹿变大' },
        { index: 5, prop: 'emoji', value: '🐵', desc: '猴子变化' },
        { index: 6, prop: 'x', value: 25, desc: '鹦鹉移动' },
        { index: 9, prop: 'emoji', value: '🐝', desc: '蝴蝶变蜜蜂' },
      ]
    },
    {
      name: '美食街', emoji: '🍜', sticker: '🍡',
      bg: 'linear-gradient(180deg, #ff9a9e 0%, #fecfef 100%)',
      items: [
        { emoji: '🍜', x: 30, y: 40, size: 50 },
        { emoji: '🍣', x: 65, y: 35, size: 45 },
        { emoji: '🍡', x: 50, y: 60, size: 42 },
        { emoji: '🍦', x: 15, y: 55, size: 36 },
        { emoji: '🧋', x: 80, y: 65, size: 36 },
        { emoji: '🍰', x: 50, y: 20, size: 32 },
        { emoji: '🥟', x: 25, y: 75, size: 30 },
        { emoji: '🍪', x: 70, y: 80, size: 28 },
        { emoji: '🍓', x: 85, y: 25, size: 26 },
        { emoji: '🍒', x: 10, y: 30, size: 24 },
      ],
      diffs: [
        { index: 0, prop: 'emoji', value: '🍲', desc: '拉面变火锅' },
        { index: 3, prop: 'size', value: 46, desc: '冰淇淋变大' },
        { index: 5, prop: 'emoji', value: '🎂', desc: '蛋糕变化' },
        { index: 7, prop: 'x', value: 78, desc: '饼干移动' },
        { index: 9, prop: 'emoji', value: '🍇', desc: '樱桃变葡萄' },
      ]
    }
  ];

  let curLevel = 0;
  let curMode = 'casual'; // casual/timed
  let found = [];
  let hints = 3;
  let timeLeft = 60;
  let timer = null;
  let stickers = [];
  let started = false;

  root.innerHTML = `
    <style>
      .diff-wrap{font-family:'Segoe UI','Microsoft YaHei',sans-serif;color:#fff;max-width:820px;margin:0 auto;padding:12px;}
      .diff-title{font-size:24px;font-weight:800;text-align:center;background:linear-gradient(90deg,#3b82f6,#8b5cf6);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:8px;}
      .diff-info{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;}
      .diff-info-box{background:rgba(255,255,255,.1);backdrop-filter:blur(10px);border-radius:12px;padding:8px 14px;text-align:center;border:1px solid rgba(255,255,255,.12);min-width:80px;}
      .diff-info-label{font-size:10px;color:rgba(255,255,255,.6);margin-bottom:2px;}
      .diff-info-val{font-size:18px;font-weight:bold;color:#fff;}
      .diff-info-val.warn{color:#ef4444;animation:diffpulse .5s ease infinite;}
      @keyframes diffpulse{0%,100%{transform:scale(1);}50%{transform:scale(1.1);}}
      .diff-scenes{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;}
      .diff-scene{position:relative;width:370px;height:270px;border-radius:16px;overflow:hidden;cursor:crosshair;border:2px solid rgba(255,255,255,.18);box-shadow:0 8px 25px rgba(0,0,0,.25);}
      @media(max-width:820px){.diff-scene{width:100%;max-width:340px;height:250px;}}
      .diff-scene.shake{animation:diffshake .4s ease;}
      @keyframes diffshake{0%,100%{transform:translateX(0);}20%{transform:translateX(-8px);}40%{transform:translateX(8px);}60%{transform:translateX(-6px);}80%{transform:translateX(6px);}}
      .diff-item{position:absolute;font-size:28px;transform:translate(-50%,-50%);transition:all .3s;pointer-events:none;}
      .diff-marker{position:absolute;width:44px;height:44px;border:3px solid #22c55e;border-radius:50%;transform:translate(-50%,-50%);animation:diffmark .5s ease;pointer-events:none;}
      .diff-marker::before{content:'✓';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#22c55e;font-size:22px;font-weight:bold;}
      @keyframes diffmark{0%{transform:translate(-50%,-50%) scale(0);opacity:0;}50%{transform:translate(-50%,-50%) scale(1.3);opacity:1;}100%{transform:translate(-50%,-50%) scale(1);opacity:1;}}
      .diff-controls{display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap;}
      .diff-btn{padding:10px 20px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border:none;border-radius:14px;color:#fff;font-size:14px;font-weight:bold;cursor:pointer;transition:all .3s;}
      .diff-btn:hover{transform:translateY(-2px);box-shadow:0 5px 16px rgba(59,130,246,.5);}
      .diff-btn.sec{background:rgba(255,255,255,.12);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.2);}
      .diff-btn.hint{background:linear-gradient(135deg,#f59e0b,#ef4444);}
      .diff-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;}
      .diff-ovr{position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(5px);display:none;align-items:center;justify-content:center;z-index:99;}
      .diff-ovr.show{display:flex;animation:difffade .3s ease;}
      @keyframes difffade{from{opacity:0;}to{opacity:1;}}
      .diff-modal{background:rgba(30,30,60,.95);backdrop-filter:blur(20px);border-radius:22px;padding:24px;max-width:380px;width:88%;border:1px solid rgba(255,255,255,.2);box-shadow:0 15px 50px rgba(0,0,0,.5);text-align:center;animation:diffup .3s ease;max-height:85vh;overflow-y:auto;}
      @keyframes diffup{from{transform:translateY(30px);opacity:0;}to{transform:translateY(0);opacity:1;}}
      .diff-modal h2{color:#fff;margin-bottom:14px;font-size:20px;}
      .diff-modal p{color:rgba(255,255,255,.7);margin-bottom:14px;line-height:1.6;font-size:13px;}
      .diff-mode-row,.diff-lvl-row{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;justify-content:center;}
      .diff-mode-btn,.diff-lvl-btn{flex:1;min-width:100px;padding:12px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.18);border-radius:12px;color:#fff;cursor:pointer;transition:all .3s;font-size:13px;}
      .diff-mode-btn:hover,.diff-lvl-btn:hover{background:rgba(255,255,255,.18);transform:translateY(-2px);}
      .diff-mode-btn.sel,.diff-lvl-btn.sel{border-color:#3b82f6;background:rgba(59,130,246,.2);}
      .diff-sticker-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;}
      .diff-sticker-item{aspect-ratio:1;background:rgba(255,255,255,.06);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:32px;position:relative;}
      .diff-sticker-item.locked{filter:grayscale(1) brightness(.4);}
      .diff-sticker-item.locked::after{content:'🔒';position:absolute;font-size:14px;bottom:6px;}
      .diff-sticker-item.unlocked{background:rgba(251,191,36,.12);border:2px solid rgba(251,191,36,.35);}
      .diff-sticker-name{font-size:10px;color:rgba(255,255,255,.6);margin-top:3px;}
      .diff-victory-emoji{font-size:56px;animation:diffbounce 1s ease infinite;}
      @keyframes diffbounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
    </style>
    <div class="diff-wrap">
      <div class="diff-title">🔍 找不同</div>
      <div class="diff-info">
        <div class="diff-info-box"><div class="diff-info-label">关卡</div><div class="diff-info-val" id="diffLevel">1/3</div></div>
        <div class="diff-info-box"><div class="diff-info-label">找到</div><div class="diff-info-val" id="diffFound">0/5</div></div>
        <div class="diff-info-box" id="diffTimerBox" style="display:none;"><div class="diff-info-label">时间</div><div class="diff-info-val" id="diffTimer">60</div></div>
        <div class="diff-info-box"><div class="diff-info-label">模式</div><div class="diff-info-val" id="diffMode" style="font-size:13px;">休闲</div></div>
      </div>
      <div class="diff-scenes">
        <div class="diff-scene" id="diffScene1"></div>
        <div class="diff-scene" id="diffScene2"></div>
      </div>
      <div class="diff-controls">
        <button class="diff-btn sec" id="diffStartBtn">🎮 选择关卡</button>
        <button class="diff-btn hint" id="diffHintBtn">🔍 放大镜 (3)</button>
        <button class="diff-btn sec" id="diffStickerBtn">🏆 贴纸</button>
      </div>
    </div>
    <div class="diff-ovr" id="diffStartOvr">
      <div class="diff-modal">
        <h2>🎮 开始游戏</h2>
        <p style="margin-bottom:8px;">选择模式</p>
        <div class="diff-mode-row">
          <div class="diff-mode-btn sel" data-mode="casual">
            <div style="font-size:24px;margin-bottom:4px;">😌</div>
            <div>休闲模式</div>
            <div style="font-size:10px;color:rgba(255,255,255,.5);margin-top:2px;">无时间限制</div>
          </div>
          <div class="diff-mode-btn" data-mode="timed">
            <div style="font-size:24px;margin-bottom:4px;">⏱️</div>
            <div>限时模式</div>
            <div style="font-size:10px;color:rgba(255,255,255,.5);margin-top:2px;">60秒挑战</div>
          </div>
        </div>
        <p style="margin-bottom:8px;">选择关卡</p>
        <div class="diff-lvl-row">
          <div class="diff-lvl-btn sel" data-lv="0">
            <div style="font-size:24px;margin-bottom:4px;">🏫</div>
            <div>校园</div>
          </div>
          <div class="diff-lvl-btn" data-lv="1">
            <div style="font-size:24px;margin-bottom:4px;">🦁</div>
            <div>动物园</div>
          </div>
          <div class="diff-lvl-btn" data-lv="2">
            <div style="font-size:24px;margin-bottom:4px;">🍜</div>
            <div>美食街</div>
          </div>
        </div>
        <button class="diff-btn" id="diffStartGame">开始游戏</button>
      </div>
    </div>
    <div class="diff-ovr" id="diffStickerOvr">
      <div class="diff-modal">
        <h2>🏆 贴纸收集</h2>
        <div class="diff-sticker-grid" id="diffStickerGrid"></div>
        <button class="diff-btn" id="diffCloseSticker">关闭</button>
      </div>
    </div>
    <div class="diff-ovr" id="diffVictoryOvr">
      <div class="diff-modal">
        <div class="diff-victory-emoji" id="diffVicEmoji">🎉</div>
        <h2 id="diffVicTitle">太棒了！</h2>
        <p id="diffVicText">你找到了所有不同！</p>
        <div style="margin-bottom:14px;">
          <span style="font-size:42px;" id="diffNewSticker">🎖️</span>
          <p style="color:#fbbf24;margin-top:6px;" id="diffStickerText">获得新贴纸！</p>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="diff-btn" style="flex:1;" id="diffNextBtn">下一关</button>
          <button class="diff-btn sec" style="flex:1;" id="diffCloseVic">返回</button>
        </div>
      </div>
    </div>
    <div class="diff-ovr" id="diffOverOvr">
      <div class="diff-modal">
        <div style="font-size:56px;margin-bottom:10px;">😢</div>
        <h2>时间到！</h2>
        <p>你找到了 <span id="diffOverFound" style="color:#fbbf24;font-weight:bold;">0</span>/5 处不同</p>
        <p style="margin-top:8px;">再试一次吧！</p>
        <button class="diff-btn" style="margin-top:16px;" id="diffRetry">再试一次</button>
      </div>
    </div>
  `;

  const scene1 = root.querySelector('#diffScene1');
  const scene2 = root.querySelector('#diffScene2');
  const levelEl = root.querySelector('#diffLevel');
  const foundEl = root.querySelector('#diffFound');
  const timerBox = root.querySelector('#diffTimerBox');
  const timerEl = root.querySelector('#diffTimer');
  const modeEl = root.querySelector('#diffMode');
  const hintBtn = root.querySelector('#diffHintBtn');
  const startOvr = root.querySelector('#diffStartOvr');
  const stickerOvr = root.querySelector('#diffStickerOvr');
  const stickerGrid = root.querySelector('#diffStickerGrid');
  const victoryOvr = root.querySelector('#diffVictoryOvr');
  const overOvr = root.querySelector('#diffOverOvr');
  const overFoundEl = root.querySelector('#diffOverFound');

  // 读取存档
  stickers = JSON.parse(localStorage.getItem('xinji_diff_progress') || '[]');

  // 渲染贴纸
  function renderStickers() {
    stickerGrid.innerHTML = '';
    LEVELS.forEach((lv, idx) => {
      const item = document.createElement('div');
      item.className = 'diff-sticker-item ' + (stickers.includes(idx) ? 'unlocked' : 'locked');
      item.innerHTML = `${lv.sticker}<div class="diff-sticker-name">${lv.name}</div>`;
      stickerGrid.appendChild(item);
    });
  }

  // 渲染场景
  function renderScenes() {
    const lv = LEVELS[curLevel];
    scene1.style.background = lv.bg;
    scene2.style.background = lv.bg;
    scene1.innerHTML = '';
    scene2.innerHTML = '';

    lv.items.forEach((item, idx) => {
      const el1 = createItem(item);
      el1.dataset.idx = idx;
      scene1.appendChild(el1);

      const item2 = { ...item };
      const diff = lv.diffs.find(d => d.index === idx);
      if (diff) item2[diff.prop] = diff.value;
      const el2 = createItem(item2);
      el2.dataset.idx = idx;
      scene2.appendChild(el2);
    });

    found.forEach(idx => markDiff(idx));
  }

  function createItem(item) {
    const el = document.createElement('div');
    el.className = 'diff-item';
    el.textContent = item.emoji;
    el.style.left = item.x + '%';
    el.style.top = item.y + '%';
    el.style.fontSize = item.size + 'px';
    return el;
  }

  function markDiff(idx) {
    const lv = LEVELS[curLevel];
    const diff = lv.diffs.find(d => d.index === idx);
    const item = lv.items[idx];
    let x2 = item.x;
    if (diff && diff.prop === 'x') x2 = diff.value;

    const m1 = document.createElement('div');
    m1.className = 'diff-marker';
    m1.style.left = item.x + '%';
    m1.style.top = item.y + '%';
    scene1.appendChild(m1);

    const m2 = document.createElement('div');
    m2.className = 'diff-marker';
    m2.style.left = x2 + '%';
    m2.style.top = item.y + '%';
    scene2.appendChild(m2);
  }

  // 点击场景
  function onSceneClick(e, sceneIdx) {
    if (!started) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const lv = LEVELS[curLevel];
    let ok = false;

    for (const diff of lv.diffs) {
      if (found.includes(diff.index)) continue;
      const item = lv.items[diff.index];
      let ix = item.x;
      let iy = item.y;
      // 在第2张图上，x可能变了
      if (sceneIdx === 1 && diff.prop === 'x') ix = diff.value;
      const dist = Math.sqrt(Math.pow(x - ix, 2) + Math.pow(y - iy, 2));
      if (dist < 14) {
        ok = true;
        found.push(diff.index);
        markDiff(diff.index);
        playSfx('correct');
        foundEl.textContent = found.length + '/5';
        if (found.length === 5) {
          stopTimer();
          setTimeout(showVictory, 500);
        }
        break;
      }
    }

    if (!ok) {
      e.currentTarget.classList.add('shake');
      setTimeout(() => e.currentTarget.classList.remove('shake'), 400);
      playSfx('wrong');
    }
  }

  scene1.addEventListener('click', (e) => onSceneClick(e, 0));
  scene2.addEventListener('click', (e) => onSceneClick(e, 1));

  // 音效
  function playSfx(type) {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      if (type === 'correct') {
        osc.frequency.value = 800; osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.2);
        osc.start(); osc.stop(ac.currentTime + 0.2);
      } else {
        osc.frequency.value = 200; osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.1, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.15);
        osc.start(); osc.stop(ac.currentTime + 0.15);
      }
    } catch (e) {}
  }

  // 放大镜
  hintBtn.addEventListener('click', () => {
    if (hints <= 0 || !started) return;
    const lv = LEVELS[curLevel];
    const unfound = lv.diffs.filter(d => !found.includes(d.index));
    if (unfound.length === 0) return;
    const hint = unfound[Math.floor(Math.random() * unfound.length)];
    const item = lv.items[hint.index];

    const rect = scene1.getBoundingClientRect();
    const hx = rect.left + (item.x / 100) * rect.width;
    const hy = rect.top + (item.y / 100) * rect.height;

    const circle = document.createElement('div');
    circle.style.cssText = `
      position:fixed;width:70px;height:70px;border:3px solid #f59e0b;border-radius:50%;
      left:${hx}px;top:${hy}px;transform:translate(-50%,-50%);pointer-events:none;z-index:50;
      animation:hintGlow 1.5s ease-in-out 2;
    `;
    document.body.appendChild(circle);
    setTimeout(() => circle.remove(), 3000);

    hints--;
    hintBtn.textContent = `🔍 放大镜 (${hints})`;
    if (hints <= 0) hintBtn.disabled = true;
  });

  // 添加hintGlow动画到style
  const hintStyle = document.createElement('style');
  hintStyle.textContent = `@keyframes hintGlow{0%,100%{opacity:.5;transform:translate(-50%,-50%) scale(1);}50%{opacity:1;transform:translate(-50%,-50%) scale(1.2);}}`;
  document.head.appendChild(hintStyle);

  // 开始游戏
  function startGame() {
    startOvr.classList.remove('show');
    found = [];
    hints = 3;
    timeLeft = 60;
    started = true;

    levelEl.textContent = (curLevel + 1) + '/3';
    foundEl.textContent = '0/5';
    modeEl.textContent = curMode === 'casual' ? '休闲' : '限时';
    hintBtn.textContent = `🔍 放大镜 (${hints})`;
    hintBtn.disabled = false;

    if (curMode === 'timed') {
      timerBox.style.display = 'block';
      timerEl.textContent = timeLeft;
      timerEl.classList.remove('warn');
      startTimer();
    } else {
      timerBox.style.display = 'none';
      stopTimer();
    }
    renderScenes();
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(() => {
      timeLeft--;
      timerEl.textContent = timeLeft;
      if (timeLeft <= 10) timerEl.classList.add('warn');
      if (timeLeft <= 0) { stopTimer(); showOver(); }
    }, 1000);
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  function showVictory() {
    const lv = LEVELS[curLevel];
    const isNew = !stickers.includes(curLevel);
    if (isNew) {
      stickers.push(curLevel);
      localStorage.setItem('xinji_diff_progress', JSON.stringify(stickers));
    }
    root.querySelector('#diffVicEmoji').textContent = isNew ? '🎊' : '🎉';
    root.querySelector('#diffVicTitle').textContent = isNew ? '恭喜通关！' : '太棒了！';
    root.querySelector('#diffNewSticker').textContent = lv.sticker;
    root.querySelector('#diffStickerText').textContent = isNew ? '获得新贴纸：' + lv.name + '！' : '已收集此贴纸';
    victoryOvr.classList.add('show');
  }

  function showOver() {
    overFoundEl.textContent = found.length;
    overOvr.classList.add('show');
  }

  // 模式选择
  root.querySelectorAll('.diff-mode-btn').forEach(b => {
    b.addEventListener('click', () => {
      curMode = b.dataset.mode;
      root.querySelectorAll('.diff-mode-btn').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
    });
  });
  // 关卡选择
  root.querySelectorAll('.diff-lvl-btn').forEach(b => {
    b.addEventListener('click', () => {
      curLevel = +b.dataset.lv;
      root.querySelectorAll('.diff-lvl-btn').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
    });
  });

  root.querySelector('#diffStartBtn').addEventListener('click', () => startOvr.classList.add('show'));
  root.querySelector('#diffStartGame').addEventListener('click', startGame);
  root.querySelector('#diffStickerBtn').addEventListener('click', () => { renderStickers(); stickerOvr.classList.add('show'); });
  root.querySelector('#diffCloseSticker').addEventListener('click', () => stickerOvr.classList.remove('show'));
  root.querySelector('#diffNextBtn').addEventListener('click', () => {
    victoryOvr.classList.remove('show');
    if (curLevel < LEVELS.length - 1) {
      curLevel++;
      root.querySelectorAll('.diff-lvl-btn').forEach(x => x.classList.remove('sel'));
      root.querySelector(`.diff-lvl-btn[data-lv="${curLevel}"]`).classList.add('sel');
      startGame();
    } else {
      startOvr.classList.add('show');
    }
  });
  root.querySelector('#diffCloseVic').addEventListener('click', () => victoryOvr.classList.remove('show'));
  root.querySelector('#diffRetry').addEventListener('click', () => { overOvr.classList.remove('show'); startGame(); });

  // 初始显示开始界面
  startOvr.classList.add('show');
  // 先渲染一个默认场景做背景
  renderScenes();
}


// ---------------------------------------------------------------------
// 游戏4：翻花绳
// ---------------------------------------------------------------------
function gameRopeInit(root) {
  const PATTERNS = [
    { name: '面条', emoji: '🍜', desc: '最基础的花样', steps: 1 },
    { name: '大桥', emoji: '🌉', desc: '像一座大桥', steps: 2 },
    { name: '剪刀', emoji: '✂️', desc: '像一把剪刀', steps: 2 },
    { name: '五角星', emoji: '⭐', desc: '美丽的五角星', steps: 3 },
    { name: '蜘蛛网', emoji: '🕸️', desc: '像蜘蛛网一样', steps: 4 },
    { name: '降落伞', emoji: '🪂', desc: '像降落伞', steps: 3 },
    { name: '铁塔', emoji: '🗼', desc: '像埃菲尔铁塔', steps: 4 },
    { name: '渔网', emoji: '🕸️', desc: '像捕鱼的渔网', steps: 4 },
  ];

  let canvas, ctx;
  let nodes = [];
  let curMode = 'free'; // free/tutorial
  let curPattern = 0;
  let curStep = 0;
  let dragging = null;
  let swingT = 0;
  let unlocked = [0];
  let rafId = null;

  root.innerHTML = `
    <style>
      .rope-wrap{font-family:'Segoe UI','Microsoft YaHei',sans-serif;color:#fff;max-width:560px;margin:0 auto;padding:12px;}
      .rope-title{font-size:24px;font-weight:800;text-align:center;background:linear-gradient(90deg,#22c55e,#14b8a6);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:8px;}
      .rope-mode-bar{background:rgba(255,255,255,.08);border-radius:14px;padding:10px 16px;text-align:center;border:1px solid rgba(255,255,255,.12);margin-bottom:10px;}
      .rope-mode-name{font-size:16px;font-weight:bold;color:#fff;}
      .rope-pat-name{font-size:14px;color:#4ade80;margin-top:3px;}
      .rope-step-info{font-size:12px;color:rgba(255,255,255,.6);margin-top:4px;}
      .rope-step-hint{background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);border-radius:10px;padding:8px 12px;margin-top:8px;color:#86efac;font-size:12px;line-height:1.5;}
      .rope-canvas-box{display:flex;justify-content:center;}
      .rope-canvas{background:rgba(255,255,255,.04);backdrop-filter:blur(10px);border-radius:18px;border:2px solid rgba(255,255,255,.12);box-shadow:0 8px 25px rgba(0,0,0,.25);cursor:grab;touch-action:none;}
      .rope-canvas:active{cursor:grabbing;}
      .rope-controls{display:flex;gap:8px;justify-content:center;margin-top:14px;flex-wrap:wrap;}
      .rope-btn{padding:10px 18px;background:linear-gradient(135deg,#22c55e,#14b8a6);border:none;border-radius:14px;color:#fff;font-size:14px;font-weight:bold;cursor:pointer;transition:all .3s;}
      .rope-btn:hover{transform:translateY(-2px);box-shadow:0 5px 16px rgba(34,197,94,.4);}
      .rope-btn.sec{background:rgba(255,255,255,.12);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.2);}
      .rope-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;}
      .rope-nav{display:flex;gap:8px;}
      .rope-tip{margin-top:10px;color:rgba(255,255,255,.45);font-size:12px;text-align:center;line-height:1.6;}
      .rope-ovr{position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(5px);display:none;align-items:center;justify-content:center;z-index:99;}
      .rope-ovr.show{display:flex;animation:ropefade .3s ease;}
      @keyframes ropefade{from{opacity:0;}to{opacity:1;}}
      .rope-modal{background:rgba(30,30,60,.95);backdrop-filter:blur(20px);border-radius:22px;padding:22px;max-width:420px;width:88%;border:1px solid rgba(255,255,255,.2);box-shadow:0 15px 50px rgba(0,0,0,.5);text-align:center;animation:ropeup .3s ease;max-height:85vh;overflow-y:auto;}
      @keyframes ropeup{from{transform:translateY(30px);opacity:0;}to{transform:translateY(0);opacity:1;}}
      .rope-modal h2{color:#fff;margin-bottom:14px;font-size:20px;}
      .rope-mode-row{display:flex;gap:10px;margin-bottom:14px;}
      .rope-mode-btn{flex:1;padding:14px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.18);border-radius:12px;color:#fff;cursor:pointer;transition:all .3s;font-size:13px;}
      .rope-mode-btn:hover{background:rgba(255,255,255,.18);transform:translateY(-2px);}
      .rope-mode-btn.sel{border-color:#22c55e;background:rgba(34,197,94,.18);}
      .rope-pat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px;}
      .rope-pat-item{background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);border-radius:12px;padding:10px;cursor:pointer;transition:all .3s;text-align:center;font-size:13px;color:#fff;}
      .rope-pat-item:hover{background:rgba(255,255,255,.14);transform:translateY(-2px);border-color:rgba(34,197,94,.4);}
      .rope-pat-item.locked{opacity:.5;filter:grayscale(.7);cursor:not-allowed;}
      .rope-pat-item.sel{border-color:#22c55e;background:rgba(34,197,94,.15);}
      .rope-pat-emoji{font-size:30px;margin-bottom:4px;}
      .rope-pat-desc{font-size:10px;color:rgba(255,255,255,.5);margin-top:2px;}
      .rope-flash{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:72px;z-index:200;pointer-events:none;opacity:0;}
      .rope-flash.show{animation:ropeflash 1s ease-out forwards;}
      @keyframes ropeflash{0%{opacity:0;transform:translate(-50%,-50%) scale(0);}30%{opacity:1;transform:translate(-50%,-50%) scale(1.3);}70%{opacity:1;transform:translate(-50%,-50%) scale(1);}100%{opacity:0;transform:translate(-50%,-50%) scale(.8);}}
    </style>
    <div class="rope-wrap">
      <div class="rope-title">🪢 翻花绳</div>
      <div class="rope-mode-bar">
        <div class="rope-mode-name" id="ropeModeName">自由模式</div>
        <div class="rope-pat-name" id="ropePatName">自由玩耍</div>
        <div class="rope-step-info" id="ropeStepInfo" style="display:none;">第 0/0 步</div>
        <div class="rope-step-hint" id="ropeStepHint" style="display:none;"></div>
      </div>
      <div class="rope-canvas-box">
        <canvas class="rope-canvas" id="ropeCanvas" width="480" height="380"></canvas>
      </div>
      <div class="rope-controls">
        <button class="rope-btn sec" id="ropeReset">🔄 重置</button>
        <div class="rope-nav" id="ropeNav" style="display:none;">
          <button class="rope-btn sec" id="ropePrev">⬅️ 上一步</button>
          <button class="rope-btn sec" id="ropeNext">下一步 ➡️</button>
        </div>
        <button class="rope-btn sec" id="ropeTutorial">📖 教程</button>
        <button class="rope-btn sec" id="ropeGallery">🎨 花样图鉴</button>
      </div>
      <div class="rope-tip">拖动绳子上的节点翻出各种花样<br>教程模式按提示操作，自由模式随意玩耍~</div>
    </div>
    <div class="rope-ovr" id="ropeTutorialOvr">
      <div class="rope-modal">
        <h2>📖 选择模式</h2>
        <div class="rope-mode-row">
          <div class="rope-mode-btn sel" data-mode="free">
            <div style="font-size:24px;margin-bottom:4px;">🎮</div>
            <div>自由模式</div>
            <div style="font-size:10px;color:rgba(255,255,255,.5);margin-top:2px;">随意玩耍</div>
          </div>
          <div class="rope-mode-btn" data-mode="tutorial">
            <div style="font-size:24px;margin-bottom:4px;">📚</div>
            <div>教程模式</div>
            <div style="font-size:10px;color:rgba(255,255,255,.5);margin-top:2px;">学习8种花样</div>
          </div>
        </div>
        <div id="ropePatSelBox" style="display:none;">
          <h2 style="font-size:16px;">选择花样</h2>
          <div class="rope-pat-grid" id="ropePatGrid"></div>
        </div>
        <button class="rope-btn" id="ropeStartBtn">开始</button>
      </div>
    </div>
    <div class="rope-ovr" id="ropeGalleryOvr">
      <div class="rope-modal">
        <h2>🎨 花样图鉴</h2>
        <div class="rope-pat-grid" id="ropeGalleryGrid"></div>
        <button class="rope-btn sec" id="ropeCloseGallery">关闭</button>
      </div>
    </div>
    <div class="rope-flash" id="ropeFlash">✨</div>
  `;

  canvas = root.querySelector('#ropeCanvas');
  ctx = canvas.getContext('2d');
  const modeNameEl = root.querySelector('#ropeModeName');
  const patNameEl = root.querySelector('#ropePatName');
  const stepInfoEl = root.querySelector('#ropeStepInfo');
  const stepHintEl = root.querySelector('#ropeStepHint');
  const navEl = root.querySelector('#ropeNav');
  const prevBtn = root.querySelector('#ropePrev');
  const nextBtn = root.querySelector('#ropeNext');
  const tutorialOvr = root.querySelector('#ropeTutorialOvr');
  const galleryOvr = root.querySelector('#ropeGalleryOvr');
  const patSelBox = root.querySelector('#ropePatSelBox');
  const patGrid = root.querySelector('#ropePatGrid');
  const galleryGrid = root.querySelector('#ropeGalleryGrid');
  const flashEl = root.querySelector('#ropeFlash');

  // 读取存档
  unlocked = JSON.parse(localStorage.getItem('xinji_rope_unlocked') || '[0]');

  // 自适应
  function resize() {
    const maxW = Math.min(480, root.clientWidth - 24);
    canvas.style.width = maxW + 'px';
    canvas.style.height = (maxW * 380 / 480) + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  // === 形状生成函数 ===
  function genNoodle() {
    const ns = [];
    const cx = 240, cy = 190;
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      ns.push(mkN(cx + Math.cos(a) * 115, cy + Math.sin(a) * 95, i));
    }
    ns[0].pinned = true; ns[5].pinned = true;
    ns[10].pinned = true; ns[15].pinned = true;
    return ns;
  }
  function genBridge() {
    const ns = [];
    const cx = 240, cy = 190;
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      let r = 115;
      if (i >= 3 && i <= 7) r = 75;
      if (i >= 13 && i <= 17) r = 75;
      ns.push(mkN(cx + Math.cos(a) * r, cy + Math.sin(a) * 95, i));
    }
    ns[0].pinned = true; ns[5].pinned = true;
    ns[10].pinned = true; ns[15].pinned = true;
    ns[3].pinned = true; ns[7].pinned = true;
    return ns;
  }
  function genScissors() {
    const ns = [];
    const cx = 240, cy = 190;
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      let x = cx + Math.cos(a) * 115;
      let y = cy + Math.sin(a) * 95;
      if (i >= 2 && i <= 8) { x = cx - 50 + (i - 2) * 24; y = cy - 50 + (i - 2) * 14; }
      if (i >= 12 && i <= 18) { x = cx + 50 - (i - 12) * 24; y = cy + 50 - (i - 12) * 14; }
      ns.push(mkN(x, y, i));
    }
    ns[0].pinned = true; ns[5].pinned = true;
    ns[10].pinned = true; ns[15].pinned = true;
    return ns;
  }
  function genStar() {
    const ns = [];
    const cx = 240, cy = 190;
    const outer = 125, inner = 55;
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? outer : inner;
      ns.push(mkN(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.82, i));
    }
    ns[0].pinned = true; ns[4].pinned = true;
    ns[8].pinned = true; ns[12].pinned = true; ns[16].pinned = true;
    return ns;
  }
  function genWeb() {
    const ns = [];
    const cx = 240, cy = 190;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r = 75 + Math.sin(a * 6) * 38;
      ns.push(mkN(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.82, i));
    }
    ns[0].pinned = true; ns[6].pinned = true;
    ns[12].pinned = true; ns[18].pinned = true;
    return ns;
  }
  function genParachute() {
    const ns = [];
    const cx = 240, cy = 170;
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI;
      let x = cx + Math.cos(a + Math.PI) * 95;
      let y = cy + Math.sin(a + Math.PI) * 75;
      if (i >= 15) { x = cx + (i - 17.5) * 14; y = cy + 75 + (i - 15) * 9; }
      if (i <= 5) { x = cx + (i - 2.5) * 14; y = cy + 75 + (5 - i) * 9; }
      ns.push(mkN(x, y, i));
    }
    ns[0].pinned = true; ns[5].pinned = true;
    ns[10].pinned = true; ns[15].pinned = true;
    return ns;
  }
  function genTower() {
    const ns = [];
    const cx = 240;
    for (let i = 0; i < 20; i++) {
      let x, y;
      if (i < 5) { x = cx - 115 + i * 46; y = 310; }
      else if (i < 10) { const t = i - 5; x = cx + 115 - t * 19; y = 310 - t * 38; }
      else if (i < 15) { const t = i - 10; x = cx + 20 - t * 19; y = 120 + t * 19; }
      else { const t = i - 15; x = cx - 75 + t * 19; y = 215 + t * 24; }
      ns.push(mkN(x, y, i));
    }
    ns[0].pinned = true; ns[4].pinned = true;
    ns[9].pinned = true; ns[14].pinned = true;
    return ns;
  }
  function genFishnet() {
    const ns = [];
    const cx = 240, cy = 190;
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const r = 95 + Math.sin(a * 8) * 28;
      ns.push(mkN(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.78, i));
    }
    ns[0].pinned = true; ns[7].pinned = true;
    ns[14].pinned = true; ns[21].pinned = true;
    return ns;
  }
  function mkN(x, y, i) {
    return { x, y, ox: x, oy: y, vx: 0, vy: 0, pinned: false, idx: i };
  }

  // 每个pattern的步骤形状生成器序列
  const PAT_STEPS = {
    0: [genNoodle],
    1: [genNoodle, genBridge],
    2: [genNoodle, genScissors],
    3: [genNoodle, genBridge, genStar],
    4: [genNoodle, genBridge, genStar, genWeb],
    5: [genNoodle, genBridge, genParachute],
    6: [genNoodle, genBridge, genStar, genTower],
    7: [genNoodle, genBridge, genWeb, genFishnet],
  };
  const STEP_HINTS = [
    '将绳子套在双手拇指和小指上，形成基础形状',
    '用中指勾取对面的绳子',
    '继续编织，调整节点位置',
    '完成最终花样！',
  ];

  // 渲染花样网格（用于选择和图鉴）
  function renderPatGrid(container, forTutorial) {
    container.innerHTML = '';
    PATTERNS.forEach((p, idx) => {
      const item = document.createElement('div');
      const isUnlocked = unlocked.includes(idx);
      item.className = 'rope-pat-item' + (isUnlocked ? '' : ' locked') + (idx === curPattern && forTutorial ? ' sel' : '');
      item.innerHTML = `
        <div class="rope-pat-emoji">${p.emoji}</div>
        <div>${p.name}</div>
        <div class="rope-pat-desc">${p.desc}</div>
        ${!isUnlocked && forTutorial ? '<div style="font-size:10px;color:#fbbf24;margin-top:3px;">🔒 未解锁</div>' : ''}
      `;
      if (forTutorial && isUnlocked) {
        item.addEventListener('click', () => {
          curPattern = idx;
          renderPatGrid(container, true);
        });
      } else if (!forTutorial) {
        item.addEventListener('click', () => {
          if (isUnlocked) showPatternDirect(idx);
        });
      }
      container.appendChild(item);
    });
  }

  // 直接显示花样（预览）
  function showPatternDirect(idx) {
    galleryOvr.classList.remove('show');
    const steps = PAT_STEPS[idx];
    nodes = JSON.parse(JSON.stringify(steps[steps.length - 1]()));
    modeNameEl.textContent = '花样预览';
    patNameEl.textContent = PATTERNS[idx].name;
    stepInfoEl.style.display = 'none';
    stepHintEl.style.display = 'none';
    navEl.style.display = 'none';
    showFlash();
    playDing();
  }

  // 闪光效果
  function showFlash() {
    flashEl.classList.remove('show');
    void flashEl.offsetWidth;
    flashEl.classList.add('show');
  }

  // 音效
  function playDing() {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.frequency.value = 1200; osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.4);
      osc.start(); osc.stop(ac.currentTime + 0.4);
      setTimeout(() => {
        const o2 = ac.createOscillator();
        const g2 = ac.createGain();
        o2.connect(g2); g2.connect(ac.destination);
        o2.frequency.value = 1600; o2.type = 'sine';
        g2.gain.setValueAtTime(0.2, ac.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.3);
        o2.start(); o2.stop(ac.currentTime + 0.3);
      }, 150);
    } catch (e) {}
  }

  // 解锁花样
  function unlock(idx) {
    if (idx >= PATTERNS.length) return;
    if (!unlocked.includes(idx)) {
      unlocked.push(idx);
      localStorage.setItem('xinji_rope_unlocked', JSON.stringify(unlocked));
    }
  }

  // 加载步骤
  function loadStep(step) {
    const steps = PAT_STEPS[curPattern];
    if (step < 0 || step >= steps.length) return;
    curStep = step;
    nodes = JSON.parse(JSON.stringify(steps[step]()));
    stepInfoEl.textContent = `第 ${step + 1}/${steps.length} 步`;
    stepHintEl.textContent = '💡 ' + (STEP_HINTS[step] || STEP_HINTS[STEP_HINTS.length - 1]);
    prevBtn.disabled = step === 0;
    nextBtn.disabled = step === steps.length - 1;
    if (step === steps.length - 1) {
      setTimeout(() => {
        showFlash();
        playDing();
        unlock(curPattern + 1);
      }, 500);
    }
  }

  // 开始模式
  function startMode() {
    tutorialOvr.classList.remove('show');
    if (curMode === 'free') {
      modeNameEl.textContent = '自由模式';
      patNameEl.textContent = '自由玩耍';
      stepInfoEl.style.display = 'none';
      stepHintEl.style.display = 'none';
      navEl.style.display = 'none';
      nodes = genNoodle();
    } else {
      curStep = 0;
      modeNameEl.textContent = '教程模式';
      patNameEl.textContent = PATTERNS[curPattern].name;
      stepInfoEl.style.display = 'block';
      stepHintEl.style.display = 'block';
      navEl.style.display = 'flex';
      loadStep(0);
    }
  }

  // 重置
  root.querySelector('#ropeReset').addEventListener('click', () => {
    if (curMode === 'tutorial') loadStep(curStep);
    else nodes = genNoodle();
  });
  prevBtn.addEventListener('click', () => { if (curStep > 0) loadStep(curStep - 1); });
  nextBtn.addEventListener('click', () => {
    const steps = PAT_STEPS[curPattern];
    if (curStep < steps.length - 1) loadStep(curStep + 1);
  });

  // 教程按钮
  root.querySelector('#ropeTutorial').addEventListener('click', () => {
    renderPatGrid(patGrid, true);
    tutorialOvr.classList.add('show');
  });
  // 图鉴按钮
  root.querySelector('#ropeGallery').addEventListener('click', () => {
    renderPatGrid(galleryGrid, false);
    galleryOvr.classList.add('show');
  });
  root.querySelector('#ropeCloseGallery').addEventListener('click', () => galleryOvr.classList.remove('show'));

  // 模式选择
  root.querySelectorAll('.rope-mode-btn').forEach(b => {
    b.addEventListener('click', () => {
      curMode = b.dataset.mode;
      root.querySelectorAll('.rope-mode-btn').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
      patSelBox.style.display = curMode === 'tutorial' ? 'block' : 'none';
    });
  });
  root.querySelector('#ropeStartBtn').addEventListener('click', startMode);

  // === 交互 ===
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const t = e.touches ? e.touches[0] : e;
    return { x: (t.clientX - rect.left) * sx, y: (t.clientY - rect.top) * sy };
  }

  function startDrag(e) {
    e.preventDefault();
    const p = getPos(e);
    let best = null, minD = 30;
    for (const n of nodes) {
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d < minD) { minD = d; best = n; }
    }
    if (best) dragging = best;
  }
  function drag(e) {
    if (!dragging) return;
    e.preventDefault();
    const p = getPos(e);
    dragging.x = p.x; dragging.y = p.y;
    dragging.vx = 0; dragging.vy = 0;
  }
  function endDrag() { dragging = null; }

  canvas.addEventListener('mousedown', startDrag);
  canvas.addEventListener('mousemove', drag);
  canvas.addEventListener('mouseup', endDrag);
  canvas.addEventListener('mouseleave', endDrag);
  canvas.addEventListener('touchstart', startDrag, { passive: false });
  canvas.addEventListener('touchmove', drag, { passive: false });
  canvas.addEventListener('touchend', endDrag);

  // === 动画循环 ===
  function animate() {
    swingT += 0.02;
    if (!dragging) {
      for (const n of nodes) {
        if (n.pinned) {
          n.x = n.ox + Math.sin(swingT + n.ox * 0.01) * 2;
          n.y = n.oy + Math.cos(swingT * 0.8 + n.oy * 0.01) * 1.5;
        } else {
          n.vx += (n.ox - n.x) * 0.02;
          n.vy += (n.oy - n.y) * 0.02;
          n.vx *= 0.92; n.vy *= 0.92;
          n.x += n.vx; n.y += n.vy;
        }
      }
    }
    draw();
    rafId = requestAnimationFrame(animate);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 背景微光
    const g = ctx.createRadialGradient(240, 190, 0, 240, 190, 230);
    g.addColorStop(0, 'rgba(255,255,255,0.04)');
    g.addColorStop(1, 'rgba(255,255,255,0.01)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (nodes.length < 2) return;

    // 绳子渐变
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(236, 72, 153, 0.7)';
    const rg = ctx.createLinearGradient(
      nodes[0].x, nodes[0].y,
      nodes[Math.floor(nodes.length / 2)].x, nodes[Math.floor(nodes.length / 2)].y
    );
    rg.addColorStop(0, '#ec4899');
    rg.addColorStop(0.5, '#8b5cf6');
    rg.addColorStop(1, '#3b82f6');
    ctx.strokeStyle = rg;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < nodes.length; i++) {
      const xc = (nodes[i].x + nodes[i - 1].x) / 2;
      const yc = (nodes[i].y + nodes[i - 1].y) / 2;
      ctx.quadraticCurveTo(nodes[i - 1].x, nodes[i - 1].y, xc, yc);
    }
    const xc = (nodes[nodes.length - 1].x + nodes[0].x) / 2;
    const yc = (nodes[nodes.length - 1].y + nodes[0].y) / 2;
    ctx.quadraticCurveTo(nodes[nodes.length - 1].x, nodes[nodes.length - 1].y, xc, yc);
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 绘制pinned节点（金色圈）
    for (const n of nodes) {
      if (n.pinned) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 11, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  // 初始化
  nodes = genNoodle();
  animate();

  // 默认打开教程选择
  setTimeout(() => tutorialOvr.classList.add('show'), 300);
}
