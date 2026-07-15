// ===== 心绪合成小游戏 =====
// 玩法：点击相邻的两个相同等级元素进行合成，合成后升级并爆炸清除周围元素，获得心动值。
// 规则优化：每次操作后，被消除的空格会由上方元素下落填补，顶部生成新的 Lv1 元素，
//         更符合常见合成/消除类手游的体验，避免高级元素随机刷新破坏策略感。

const MINIGAME_CONFIG = {
  gridSize: 5,
  maxMoves: 10,
  spawnLevel: 1,          // 新生成元素固定为 1 级
  explosionRadius: 1,     // 3x3 爆炸半径
  baseDropPerMove: 2,     // 每次操作后额外从顶部补充的元素组数（已含重力填补）
  levels: [
    { level: 1, emoji: '☕', name: '咖啡豆', color: '#8B6F47', token: 1, mergeBonus: 5 },
    { level: 2, emoji: '🍵', name: '咖啡杯', color: '#A67B5B', token: 2, mergeBonus: 10 },
    { level: 3, emoji: '💖', name: '心动咖啡', color: '#C97B7B', token: 4, mergeBonus: 20 },
    { level: 4, emoji: '✨', name: '星光特调', color: '#D4A574', token: 8, mergeBonus: 40 },
    { level: 5, emoji: '🎵', name: '心动旋律', color: '#9B8AA6', token: 16, mergeBonus: 80 }
  ],
  shopCategories: [
    { id: 'audio', name: '氛围音频', emoji: '🎧' },
    { id: 'topping', name: '调制配料', emoji: '🌿' },
    { id: 'utility', name: '小游戏道具', emoji: '🎮' },
    { id: 'decor', name: '咖啡馆装饰', emoji: '🖼️' },
    { id: 'resource', name: '资源兑换', emoji: '🔥' },
    { id: 'workshop', name: '高级功能', emoji: '🎹' }
  ],
  shopItems: [
    // 氛围音频（中高消耗，逐步解锁）
    { id: 'soft_music', type: 'audio', category: 'audio', name: '轻快音乐', desc: '咖啡馆背景轻音乐', emoji: '🎵', cost: 120 },
    { id: 'rain_sound', type: 'audio', category: 'audio', name: '窗外雨声', desc: '雨滴敲打窗户的声音', emoji: '🌧️', cost: 200 },
    { id: 'lofi_beats', type: 'audio', category: 'audio', name: 'Lofi 节拍', desc: '慵懒的 Lofi 学习背景音乐', emoji: '🎧', cost: 350 },
    { id: 'fireplace', type: 'audio', category: 'audio', name: '壁炉白噪音', desc: '噼啪作响的治愈柴火声', emoji: '🔥', cost: 280 },
    // 调制配料（中高消耗，影响主游戏）
    { id: 'mint', type: 'topping', category: 'topping', name: '解锁薄荷', desc: '调制时可加入薄荷配料', emoji: '🌿', cost: 250 },
    { id: 'cinnamon', type: 'topping', category: 'topping', name: '解锁肉桂', desc: '调制时可加入肉桂配料', emoji: '🥧', cost: 320 },
    { id: 'cocoa', type: 'topping', category: 'topping', name: '解锁可可粉', desc: '撒在饮品上的微苦可可粉', emoji: '🍫', cost: 400 },
    // 小游戏道具（低价但可重复购买，消耗心动值）
    { id: 'extra_moves', type: 'utility', category: 'utility', name: '额外步数 +3', desc: '本局小游戏增加 3 步', emoji: '👣', cost: 45, value: 3 },
    { id: 'reroll_board', type: 'utility', category: 'utility', name: '重置棋盘', desc: '本局小游戏重新生成棋盘（不扣分）', emoji: '🔄', cost: 80 },
    { id: 'merge_hint', type: 'utility', category: 'utility', name: '合成提示', desc: '高亮显示一处可合成位置', emoji: '💡', cost: 35 },
    // 咖啡馆装饰（中高消耗，纯收集）
    { id: 'cafe_plant', type: 'decor', category: 'decor', name: '窗边绿植', desc: '为咖啡馆增添一抹生机', emoji: '🪴', cost: 180 },
    { id: 'warm_lamp', type: 'decor', category: 'decor', name: '暖黄台灯', desc: '深夜营业时的温柔光源', emoji: '🛋️', cost: 260 },
    { id: 'wall_quote', type: 'decor', category: 'decor', name: '留言黑板', desc: '墙上挂着顾客留下的温暖句子', emoji: '✍️', cost: 220 },
    // 资源兑换
    { id: 'warmth_50', type: 'resource', category: 'resource', name: '50 温暖值', desc: '兑换温暖值解锁更多原料', emoji: '🔥', cost: 60, value: 50 },
    { id: 'warmth_100', type: 'resource', category: 'resource', name: '100 温暖值', desc: '大量温暖值，加速解锁', emoji: '☀️', cost: 110, value: 100 },
    // 高级功能
    { id: 'music_workshop', type: 'workshop', category: 'workshop', name: '解锁音乐工坊', desc: 'DIY 自己的咖啡馆背景音乐（高消耗）', emoji: '🎹', cost: 500 }
  ]
};

let mgGrid = [];
let mgSelected = null;
let mgMoves = MINIGAME_CONFIG.maxMoves;
let mgScore = 0;
let mgGameOver = false;
let mgAnimating = false;
let mgHintTimer = null;

// ===== 音频系统（Web Audio API） =====
const AudioEngine = {
  ctx: null,
  currentSource: null,
  musicTimer: null,
  init() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.log('Web Audio API not supported');
      }
    }
  },
  ensureInit() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },
  // 单个音符
  playTone(freq, duration = 0.15, type = 'sine', volume = 0.12) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  // 合成音效：短促上升音
  playMerge(level) {
    if (!state.audioEnabled) return;
    this.ensureInit();
    if (!this.ctx) return;
    const baseFreq = 300 + level * 120;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  },
  // 爆炸音效：短促噪声
  playExplode() {
    if (!state.audioEnabled) return;
    this.ensureInit();
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  },
  // 背景轻音乐：简单循环
  playCustomMelody() {
    if (!state.audioEnabled) return;
    const melody = state.getActiveMelody();
    if (!melody || !melody.notes || melody.notes.length === 0) return;
    this.ensureInit();
    if (!this.ctx || this.currentSource) return;

    const stepTime = 60 / melody.tempo / 2;
    let step = 0;
    const playStep = () => {
      if (!state.audioEnabled || state.getActiveMelody()?.id !== melody.id) return;
      const notes = melody.notes.filter(n => n.step === step);
      notes.forEach(n => this.playTone(n.freq, 0.12, 'triangle', 0.08));
      step = (step + 1) % 8;
      this.musicTimer = setTimeout(playStep, stepTime * 1000);
    };
    this.currentSource = { customMelody: true };
    playStep();
  },

  playSoftMusic() {
    if (!state.audioEnabled || !state.isAudioUnlocked('soft_music')) return;
    this.ensureInit();
    if (!this.ctx || this.currentSource) return;
    this._playAmbientPattern([261.63, 329.63, 392.00, 523.25], 0.06);
  },
  // 雨声：粉红噪声
  playRain() {
    if (!state.audioEnabled || !state.isAudioUnlocked('rain_sound')) return;
    this.ensureInit();
    if (!this.ctx || this.currentSource) return;
    this._playNoise(0.04);
  },
  // Lofi 节拍
  playLofi() {
    if (!state.audioEnabled || !state.isAudioUnlocked('lofi_beats')) return;
    this.ensureInit();
    if (!this.ctx || this.currentSource) return;
    this._playAmbientPattern([196.00, 246.94, 293.66, 349.23, 392.00], 0.05, 1200);
  },
  // 壁炉白噪音
  playFireplace() {
    if (!state.audioEnabled || !state.isAudioUnlocked('fireplace')) return;
    this.ensureInit();
    if (!this.ctx || this.currentSource) return;
    this._playNoise(0.06);
  },
  _playAmbientPattern(notes, volume, interval = 900) {
    if (!this.ctx) return;
    let index = 0;
    const playNote = () => {
      if (!state.audioEnabled) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = notes[index % notes.length];
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.8);
      index++;
      this.musicTimer = setTimeout(playNote, interval);
    };
    playNote();
  },
  _playNoise(volume) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
    this.currentSource = noise;
    this.currentGain = gain;
  },
  stop() {
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.currentSource) {
      if (typeof this.currentSource.stop === 'function') {
        try { this.currentSource.stop(); } catch (e) {}
      }
      this.currentSource = null;
    }
  }
};

// ===== 游戏逻辑 =====
function initMinigame() {
  mgGrid = [];
  mgSelected = null;
  mgMoves = MINIGAME_CONFIG.maxMoves;
  mgScore = 0;
  mgGameOver = false;
  mgAnimating = false;
  if (mgHintTimer) clearTimeout(mgHintTimer);
  mgHintTimer = null;

  for (let r = 0; r < MINIGAME_CONFIG.gridSize; r++) {
    const row = [];
    for (let c = 0; c < MINIGAME_CONFIG.gridSize; c++) {
      row.push(createRandomCell());
    }
    mgGrid.push(row);
  }
  renderMinigame();
}

function createRandomCell() {
  // 新元素统一为 1 级，保证合成升级的策略性
  return { level: MINIGAME_CONFIG.spawnLevel, id: Math.random().toString(36).slice(2, 9) };
}

function renderMinigame() {
  const screen = $('#screen-minigame');
  if (!screen) return;

  const levelInfo = MINIGAME_CONFIG.levels[0];
  screen.innerHTML = `
    <div class="minigame-header">
      <button class="back-btn" onclick="renderHome()">← 返回</button>
      <h2>🧩 心绪合成</h2>
      <p class="screen-subtitle">把相同的心绪合成在一起，收集心动值</p>
    </div>
    <div class="minigame-stats">
      <div class="minigame-stat">
        <span class="stat-emoji">💗</span>
        <span class="stat-value" id="mg-tokens">${state.heartTokens}</span>
        <span class="stat-label">心动值</span>
      </div>
      <div class="minigame-stat">
        <span class="stat-emoji">⭐</span>
        <span class="stat-value" id="mg-score">${mgScore}</span>
        <span class="stat-label">本局得分</span>
      </div>
      <div class="minigame-stat">
        <span class="stat-emoji">👣</span>
        <span class="stat-value" id="mg-moves">${mgMoves}</span>
        <span class="stat-label">剩余步数</span>
      </div>
    </div>
    <div class="minigame-board" id="mg-board">
      ${renderGridHTML()}
    </div>
    <div class="minigame-controls">
      <button class="mg-action-btn" onclick="resetMinigame()">🔄 新开一局</button>
      <button class="mg-action-btn hint" onclick="useMergeHint()">💡 提示</button>
      <button class="mg-action-btn" onclick="buyExtraMovesQuick()">👣 +3 步（45💗）</button>
      <button class="mg-action-btn secondary" onclick="renderMinigameShop()">🛒 心动商店</button>
    </div>
    <div id="mg-shop" class="minigame-shop hidden">
      <h3>💝 用心动值兑换奖励</h3>
      <div class="shop-list">
        ${renderShopHTML()}
      </div>
    </div>
    <div class="minigame-help">
      <p>💡 玩法：点击一个元素，再点击相邻（上下左右）的同级元素合成。目标位置会升一级，源元素消失，上方元素下落补齐，顶部生成新的 Lv1 咖啡豆。只有最高级合成才会触发额外清除奖励。</p>
    </div>
  `;
  bindMinigameEvents();
}

function renderGridHTML() {
  let html = '';
  for (let r = 0; r < MINIGAME_CONFIG.gridSize; r++) {
    for (let c = 0; c < MINIGAME_CONFIG.gridSize; c++) {
      const cell = mgGrid[r][c];
      const levelData = cell ? MINIGAME_CONFIG.levels[cell.level - 1] : null;
      const selectedClass = mgSelected && mgSelected.r === r && mgSelected.c === c ? 'selected' : '';
      const hintClass = cell && cell._hint ? 'hint' : '';
      const newClass = cell && cell._new ? 'new' : '';
      const emptyClass = !cell ? 'empty' : '';
      html += `<div class="mg-cell ${selectedClass} ${hintClass} ${newClass} ${emptyClass}" data-r="${r}" data-c="${c}" style="${levelData ? `--cell-color:${levelData.color}` : ''}">
        ${cell ? `<span class="mg-cell-emoji">${levelData.emoji}</span><span class="mg-cell-level">Lv${cell.level}</span>` : ''}
      </div>`;
    }
  }
  return html;
}

function renderShopHTML() {
  return MINIGAME_CONFIG.shopCategories.map(cat => {
    const items = MINIGAME_CONFIG.shopItems.filter(i => i.category === cat.id);
    const itemsHtml = items.map(item => {
      const owned = isShopItemOwned(item);
      const affordable = state.heartTokens >= item.cost;
      const disabled = owned || !affordable;
      return `
        <div class="shop-item ${owned ? 'owned' : ''} ${!affordable ? 'locked' : ''}">
          <span class="shop-emoji">${item.emoji}</span>
          <div class="shop-info">
            <h4>${item.name}</h4>
            <p>${item.desc}</p>
          </div>
          <button class="shop-buy-btn" onclick="buyShopItem('${item.id}')" ${disabled ? 'disabled' : ''}>
            ${owned ? '已拥有' : `${item.cost} 💗`}
          </button>
        </div>
      `;
    }).join('');
    return `
      <div class="shop-category">
        <h4 class="shop-category-title"><span>${cat.emoji}</span> ${cat.name}</h4>
        <div class="shop-category-items">${itemsHtml}</div>
      </div>
    `;
  }).join('');
}

function isShopItemOwned(item) {
  if (item.type === 'audio') return state.isAudioUnlocked(item.id);
  if (item.type === 'topping') return state.unlockedToppings.includes(item.id);
  if (item.type === 'decor') return (state.unlockedDecor || []).includes(item.id);
  if (item.type === 'workshop') return state.unlockedWorkshop || false;
  if (item.type === 'utility') return false; // 道具可重复购买
  if (item.type === 'resource') return false;
  return false;
}

function bindMinigameEvents() {
  const board = $('#mg-board');
  if (!board) return;
  board.querySelectorAll('.mg-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const r = parseInt(cell.dataset.r);
      const c = parseInt(cell.dataset.c);
      handleCellClick(r, c);
    });
  });
}

function handleCellClick(r, c) {
  if (mgGameOver || mgAnimating) return;
  const cell = mgGrid[r][c];
  if (!cell) return;

  if (mgHintTimer) {
    clearHint();
  }

  if (!mgSelected) {
    mgSelected = { r, c };
    renderMinigameGrid();
    return;
  }

  const { r: sr, c: sc } = mgSelected;
  if (sr === r && sc === c) {
    mgSelected = null;
    renderMinigameGrid();
    return;
  }

  const selectedCell = mgGrid[sr][sc];
  const isAdjacent = Math.abs(sr - r) + Math.abs(sc - c) === 1;
  if (!isAdjacent || !selectedCell || selectedCell.level !== cell.level) {
    mgSelected = { r, c };
    renderMinigameGrid();
    return;
  }

  performMerge(sr, sc, r, c);
}

// 记录本次新生成的格子，用于高亮动画
let mgNewCells = [];

function performMerge(r1, c1, r2, c2) {
  mgAnimating = true;
  mgNewCells = [];
  const level = mgGrid[r1][c1].level;
  const newId = Math.random().toString(36).slice(2, 9);
  let gained;

  if (level >= MINIGAME_CONFIG.levels.length) {
    // 最高级：两个最高级合成，保留一个并触发一次范围清除奖励
    mgGrid[r2][c2] = null;
    gained = MINIGAME_CONFIG.levels[level - 1].mergeBonus;
    const exploded = explodeArea(r1, c1);
    gained += exploded.tokens;
    AudioEngine.playExplode();
  } else {
    // 标准合成：源格子清空，目标格子升一级，并标记为新生成
    mgGrid[r2][c2] = { level: level + 1, id: newId, _new: true };
    mgGrid[r1][c1] = null;
    gained = MINIGAME_CONFIG.levels[level].mergeBonus;
    AudioEngine.playMerge(level);
  }

  mgScore += gained;
  mgMoves--;
  mgSelected = null;
  showToast(`+${gained} 心动值`);

  // 重力下落 + 顶部补充新的 Lv1 元素
  applyGravityAndRefill();

  // 300ms 后清除新生成标记
  setTimeout(() => {
    for (let r = 0; r < MINIGAME_CONFIG.gridSize; r++) {
      for (let c = 0; c < MINIGAME_CONFIG.gridSize; c++) {
        if (mgGrid[r][c]) delete mgGrid[r][c]._new;
      }
    }
    renderMinigameGrid();
  }, 300);

  mgAnimating = false;
  updateMinigameStats();
  renderMinigameGrid();
  checkGameOver();
}

function explodeArea(centerR, centerC) {
  let count = 0;
  let tokens = 0;
  const radius = MINIGAME_CONFIG.explosionRadius;
  for (let r = centerR - radius; r <= centerR + radius; r++) {
    for (let c = centerC - radius; c <= centerC + radius; c++) {
      if (r === centerR && c === centerC) continue; // 保留中心元素
      if (r >= 0 && r < MINIGAME_CONFIG.gridSize && c >= 0 && c < MINIGAME_CONFIG.gridSize) {
        const cell = mgGrid[r][c];
        if (cell) {
          const data = MINIGAME_CONFIG.levels[cell.level - 1];
          tokens += data.token;
          count++;
          mgGrid[r][c] = null;
        }
      }
    }
  }
  return { count, tokens };
}

function applyGravityAndRefill() {
  const size = MINIGAME_CONFIG.gridSize;
  // 按列处理：非空元素下落到底部
  for (let c = 0; c < size; c++) {
    const column = [];
    for (let r = 0; r < size; r++) {
      if (mgGrid[r][c]) column.push(mgGrid[r][c]);
    }
    // 底部对齐
    for (let r = size - 1; r >= 0; r--) {
      const idx = size - 1 - r;
      mgGrid[r][c] = idx < column.length ? column[column.length - 1 - idx] : null;
    }
  }
  // 顶部空位补充新的 Lv1 元素
  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size; r++) {
      if (!mgGrid[r][c]) {
        mgGrid[r][c] = createRandomCell();
      }
    }
  }
}

function checkGameOver() {
  if (mgMoves <= 0) {
    endMinigame('步数用尽');
    return;
  }
  if (!hasValidMove()) {
    endMinigame('没有可合成的相邻元素');
  }
}

function hasValidMove() {
  for (let r = 0; r < MINIGAME_CONFIG.gridSize; r++) {
    for (let c = 0; c < MINIGAME_CONFIG.gridSize; c++) {
      const cell = mgGrid[r][c];
      if (!cell) continue;
      const dirs = [[0, 1], [1, 0]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr < MINIGAME_CONFIG.gridSize && nc < MINIGAME_CONFIG.gridSize) {
          const neighbor = mgGrid[nr][nc];
          if (neighbor && neighbor.level === cell.level) return true;
        }
      }
    }
  }
  return false;
}

function endMinigame(reason) {
  mgGameOver = true;
  state.addHeartTokens(mgScore);
  setTimeout(() => {
    showToast(`本局结束：${reason}，获得 ${mgScore} 心动值`);
    updateMinigameStats();
    renderMinigameGrid();
    showContinueDialog();
  }, 300);
}

function showContinueDialog() {
  const controls = document.querySelector('.minigame-controls');
  if (!controls) return;
  controls.innerHTML = `
    <button class="mg-action-btn" onclick="resetMinigame()">🔄 新开一局</button>
    <button class="mg-action-btn" onclick="buyExtraMovesContinue()">👣 花 45💗 续 3 步</button>
    <button class="mg-action-btn secondary" onclick="renderMinigameShop()">🛒 心动商店</button>
  `;
}

function buyExtraMovesQuick() {
  if (state.spendHeartTokens(45)) {
    mgMoves += 3;
    showToast('本局步数 +3');
    updateMinigameStats();
  } else {
    showToast('心动值不足');
  }
}

function buyExtraMovesContinue() {
  if (state.spendHeartTokens(45)) {
    mgGameOver = false;
    mgMoves += 3;
    showToast('续命成功，步数 +3');
    updateMinigameStats();
    renderMinigameGrid();
    // 恢复常规控制按钮
    const controls = document.querySelector('.minigame-controls');
    if (controls) {
      controls.innerHTML = `
        <button class="mg-action-btn" onclick="resetMinigame()">🔄 新开一局</button>
        <button class="mg-action-btn hint" onclick="useMergeHint()">💡 提示</button>
        <button class="mg-action-btn" onclick="buyExtraMovesQuick()">👣 +3 步（45💗）</button>
        <button class="mg-action-btn secondary" onclick="renderMinigameShop()">🛒 心动商店</button>
      `;
    }
  } else {
    showToast('心动值不足，无法续步');
  }
}

function resetMinigame() {
  if (mgScore > 0 && !mgGameOver) {
    state.addHeartTokens(mgScore);
    showToast(`已结算 ${mgScore} 心动值`);
  }
  initMinigame();
}

function renderMinigameGrid() {
  const board = $('#mg-board');
  if (board) board.innerHTML = renderGridHTML();
  bindMinigameEvents();
}

function updateMinigameStats() {
  const tokensEl = $('#mg-tokens');
  const scoreEl = $('#mg-score');
  const movesEl = $('#mg-moves');
  if (tokensEl) tokensEl.textContent = state.heartTokens;
  if (scoreEl) scoreEl.textContent = mgScore;
  if (movesEl) movesEl.textContent = mgMoves;
}

function renderMinigameShop() {
  const shop = $('#mg-shop');
  if (!shop) return;
  shop.classList.toggle('hidden');
  if (!shop.classList.contains('hidden')) {
    const list = shop.querySelector('.shop-list');
    if (list) list.innerHTML = renderShopHTML();
  }
}

function buyShopItem(itemId) {
  const item = MINIGAME_CONFIG.shopItems.find(i => i.id === itemId);
  if (!item) return;

  if (item.type === 'audio') {
    if (state.isAudioUnlocked(item.id)) {
      showToast('已拥有该音频');
      return;
    }
    if (state.spendHeartTokens(item.cost)) {
      state.unlockAudio(item.id);
      showToast(`解锁音频：${item.name}`);
      if (item.id === 'soft_music') AudioEngine.playSoftMusic();
      if (item.id === 'rain_sound') AudioEngine.playRain();
      if (item.id === 'lofi_beats') AudioEngine.playLofi();
      if (item.id === 'fireplace') AudioEngine.playFireplace();
    } else {
      showToast('心动值不足');
      return;
    }
  } else if (item.type === 'topping') {
    if (state.unlockedToppings.includes(item.id)) {
      showToast('已拥有该配料');
      return;
    }
    if (state.buyIngredient('topping', item.id, item.cost)) {
      showToast(`解锁配料：${item.name}`);
    } else {
      showToast('心动值不足');
      return;
    }
  } else if (item.type === 'decor') {
    if ((state.unlockedDecor || []).includes(item.id)) {
      showToast('已拥有该装饰');
      return;
    }
    if (state.spendHeartTokens(item.cost)) {
      state.unlockDecor(item.id);
      showToast(`解锁装饰：${item.name}`);
    } else {
      showToast('心动值不足');
      return;
    }
  } else if (item.type === 'utility') {
    if (item.id === 'extra_moves') {
      if (state.spendHeartTokens(item.cost)) {
        mgMoves += item.value;
        showToast(`本局步数 +${item.value}`);
        updateMinigameStats();
      } else {
        showToast('心动值不足');
        return;
      }
    } else if (item.id === 'reroll_board') {
      if (state.spendHeartTokens(item.cost)) {
        initMinigame();
        showToast('棋盘已重置');
      } else {
        showToast('心动值不足');
        return;
      }
    } else if (item.id === 'merge_hint') {
      if (state.spendHeartTokens(item.cost)) {
        useMergeHint(true);
      } else {
        showToast('心动值不足');
        return;
      }
    }
  } else if (item.type === 'resource') {
    if (state.buyWarmth(item.value, item.cost)) {
      showToast(`兑换 ${item.value} 温暖值成功`);
    } else {
      showToast('心动值不足');
      return;
    }
  } else if (item.type === 'workshop') {
    if (state.unlockedWorkshop) {
      showToast('已解锁音乐工坊');
      return;
    }
    if (state.spendHeartTokens(item.cost)) {
      state.unlockWorkshop();
      showToast('解锁音乐工坊成功！快去谱写你的旋律吧');
    } else {
      showToast('心动值不足');
      return;
    }
  }

  updateMinigameStats();
  renderMinigameShop();
}

function useMergeHint(paid = false) {
  if (mgGameOver || mgAnimating) return;
  if (!paid && state.heartTokens < 15) {
    showToast('心动值不足，提示需要 15 心动值');
    return;
  }

  // 找到一对可合成元素
  let pair = null;
  for (let r = 0; r < MINIGAME_CONFIG.gridSize && !pair; r++) {
    for (let c = 0; c < MINIGAME_CONFIG.gridSize && !pair; c++) {
      const cell = mgGrid[r][c];
      if (!cell) continue;
      const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < MINIGAME_CONFIG.gridSize && nc >= 0 && nc < MINIGAME_CONFIG.gridSize) {
          const neighbor = mgGrid[nr][nc];
          if (neighbor && neighbor.level === cell.level) {
            pair = { r, c, nr, nc };
            break;
          }
        }
      }
    }
  }

  if (!pair) {
    showToast('当前没有可合成提示');
    return;
  }

  if (!paid) state.spendHeartTokens(15);

  // 标记提示
  mgGrid[pair.r][pair.c]._hint = true;
  mgGrid[pair.nr][pair.nc]._hint = true;
  renderMinigameGrid();

  if (mgHintTimer) clearTimeout(mgHintTimer);
  mgHintTimer = setTimeout(clearHint, 2000);
}

function clearHint() {
  for (let r = 0; r < MINIGAME_CONFIG.gridSize; r++) {
    for (let c = 0; c < MINIGAME_CONFIG.gridSize; c++) {
      if (mgGrid[r][c]) delete mgGrid[r][c]._hint;
    }
  }
  mgHintTimer = null;
  renderMinigameGrid();
}

// 从底部导航进入小游戏
function showMinigame() {
  showScreen('minigame');
  initMinigame();
}
