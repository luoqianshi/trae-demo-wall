/* =================================================================
   CodeBeat 节奏编程 - 游戏核心逻辑
   ================================================================= */

// ============ 游戏状态 ============
/**
 * 游戏运行时数据对象。
 * 状态流转由 gameStateMachine 统一管理，此处不再直接维护 status 字段。
 */
const state = {
  score: 0,
  combo: 0,
  maxCombo: 0,
  totalNotes: 0,
  totalHit: 0,
  perfectCount: 0,
  greatCount: 0,
  goodCount: 0,
  missCount: 0,
  noteSpeed: 'normal',
  startTime: 0,
  elapsed: 0,
  chart: [],
  activeNotes: [],
  trackActiveNotes: [[], [], [], []], // 按轨道索引 0-3 分组的音符，O(1) 查找
  noteDataMap: new Map(),
  keySequenceList: [],
  heldKeys: {},           // 当前按住的键 { trackKey: { noteEl, data, holdStartTime, judgment } }
  metronomeInterval: null,
  animFrameId: null,
  // 时长 / 模式相关
  gameDuration: 45,       // 本局游戏时长（秒）
  gameMode: MODE_NORMAL,  // 'normal' | 'life'
  hearts: LIFE_MAX_HEARTS,// 生命模式当前红心数
  nextHealCombo: LIFE_COMBO_HEAL, // 下一次回血的连击目标
};

// ============ 状态机配置 ============
gameStateMachine.addTransition('menu', 'countdown');
gameStateMachine.addTransitions('countdown', ['playing', 'menu']);
gameStateMachine.addTransitions('playing', ['paused', 'result', 'menu']);
gameStateMachine.addTransitions('paused', ['playing', 'menu']);
gameStateMachine.addTransitions('result', ['menu', 'countdown']);

gameStateMachine.onChange(({ from, to }) => {
  eventBus.emit('state:changed', { from, to });
});

// ============ 音符 DOM 对象池 ============
/**
 * 复用音符 DOM 元素，减少下落过程中频繁创建/销毁带来的 GC 抖动。
 * acquire(trackKey, noteData) 负责初始化样式并挂到轨道容器；
 * release(el) 负责清理样式、移除长条身体并从 DOM 脱离。
 */
const notePool = new ObjectPool(
  () => document.createElement('div'),
  (el, trackKey, noteData) => {
    el.className = 'note';
    el.style.cssText = '';
    el.dataset.hit = 'false';
    el.dataset.hold = noteData.isHold ? 'true' : 'false';
    el.style.backgroundImage = `url('${NOTE_IMAGES[trackKey]}')`;
    el.style.boxShadow = `0 0 12px ${NOTE_COLORS[trackKey]}, 0 0 24px ${NOTE_COLORS[trackKey]}44`;

    const existingBody = el.querySelector('.note-hold-body');
    if (existingBody) existingBody.remove();
    const existingIndicator = el.querySelector('.hold-indicator');
    if (existingIndicator) existingIndicator.remove();

    if (noteData.isHold) {
      const body = document.createElement('div');
      body.className = 'note-hold-body';
      body.style.backgroundColor = hexToRgba(NOTE_COLORS[trackKey], 0.55);
      body.style.boxShadow = `
        0 0 8px ${NOTE_COLORS[trackKey]},
        0 0 16px ${hexToRgba(NOTE_COLORS[trackKey], 0.4)},
        inset 0 0 6px rgba(255, 255, 255, 0.15)
      `;
      el.appendChild(body);

      // 头部长按标记：底部小箭头指示
      const indicator = document.createElement('div');
      indicator.className = 'hold-indicator';
      indicator.style.borderTopColor = NOTE_COLORS[trackKey];
      el.appendChild(indicator);
    }

    trackContainers[trackKey].appendChild(el);
  },
  (el) => {
    el.dataset.hit = 'true';
    el.className = '';
    el.style.cssText = '';
    const body = el.querySelector('.note-hold-body');
    if (body) body.remove();
    const indicator = el.querySelector('.hold-indicator');
    if (indicator) indicator.remove();
    if (el.parentNode) el.parentNode.removeChild(el);
  },
  40
);

const JUDGE_POPUP_POOL_SIZE = 2;
const judgePopupPools = {};
const judgePopupIndices = {};
let comboFlashEl = null;
let comboTextEl = null;

function ensureJudgePopupPool(trackKey) {
  if (judgePopupPools[trackKey]) return judgePopupPools[trackKey];

  const container = trackContainers[trackKey];
  const pools = {
    image: [],
    text: [],
  };

  for (let i = 0; i < JUDGE_POPUP_POOL_SIZE; i++) {
    const img = document.createElement('img');
    img.className = 'judge-popup judge-img';
    img.style.opacity = '0';
    container.appendChild(img);
    pools.image.push(img);
  }

  for (let i = 0; i < JUDGE_POPUP_POOL_SIZE; i++) {
    const text = document.createElement('div');
    text.className = 'judge-popup';
    text.style.opacity = '0';
    container.appendChild(text);
    pools.text.push(text);
  }

  judgePopupPools[trackKey] = pools;
  judgePopupIndices[trackKey] = { image: 0, text: 0 };
  return pools;
}

function getReusableJudgePopup(trackKey, type) {
  const pools = ensureJudgePopupPool(trackKey);
  const indexState = judgePopupIndices[trackKey];
  const pool = pools[type];
  const popup = pool[indexState[type] % pool.length];
  indexState[type]++;
  return popup;
}

function ensureComboEffectElements() {
  if (!comboFlashEl) {
    comboFlashEl = document.createElement('div');
    comboFlashEl.className = 'combo-flash';
    comboFlashEl.style.opacity = '0';
    document.body.appendChild(comboFlashEl);
  }

  if (!comboTextEl) {
    comboTextEl = document.createElement('div');
    comboTextEl.className = 'combo-text';
    comboTextEl.style.opacity = '0';
    document.body.appendChild(comboTextEl);
  }
}

function resetGameState() {
  state.score = 0;
  state.combo = 0;
  state.maxCombo = 0;
  state.totalNotes = 0;
  state.totalHit = 0;
  state.perfectCount = 0;
  state.greatCount = 0;
  state.goodCount = 0;
  state.missCount = 0;
  state.startTime = 0;
  state.elapsed = 0;
  state.chart = generateChart();
  state.activeNotes = [];
  state.trackActiveNotes = [[], [], [], []];
  state.noteDataMap = new Map();
  state.keySequenceList = [];
  state.heldKeys = {};
  chartIndex = 0;

  // 生命模式初始化
  state.hearts = LIFE_MAX_HEARTS;
  state.nextHealCombo = LIFE_COMBO_HEAL;

  for (const trackKey of trackKeys) {
    trackContainers[trackKey].innerHTML = '';
    delete judgePopupPools[trackKey];
    delete judgePopupIndices[trackKey];
  }

  notePool.clear();
  initDrawCanvas(); // 内部会调用 initPixelArt()
}

// ============ 谱面生成 ============

/**
 * 生成随机谱面。
 * @returns {Object[]} 音符数据数组，每个元素包含 track / time / isHold / holdDuration 等字段。
 */
function generateChart() {
  const notes = [];
  const interval = BEAT_MS; // 每拍一个音符（四分音符）
  let time = 3000; // 3秒后开始
  let lastHoldTime = 0; // 上一个长按的结束时间，保证间距

  const patterns = [
    { tracks: [0], weight: 8 },        // 单音
    { tracks: [1], weight: 8 },
    { tracks: [2], weight: 8 },
    { tracks: [3], weight: 8 },
    { tracks: [0, 1], weight: 1 },     // 双音
    { tracks: [2, 3], weight: 1 },
    { tracks: [0, 2], weight: 1 },
    { tracks: [1, 3], weight: 1 },
    { tracks: [], weight: 6 },          // 休止
  ];

  const totalWeight = patterns.reduce((s, p) => s + p.weight, 0);

  while (time < (state.gameDuration + 2) * 1000) {
    let r = Math.random() * totalWeight;
    let pattern = patterns[0];
    for (const p of patterns) {
      r -= p.weight;
      if (r <= 0) { pattern = p; break; }
    }
    // 长按滑条：只在单音轨道且与上一个长按间隔足够时生成
    // 注意：若生成了长按，就不再生成同一拍的普通音符，避免重叠
    if (pattern.tracks.length === 1 && time - lastHoldTime > BEAT_MS * 3 && Math.random() < 0.25) {
      const holdDuration = BEAT_MS * (1.5 + Math.random() * 2.5); // 1.5~4拍长按
      notes.push({ track: pattern.tracks[0], time, holdDuration, isHold: true });
      lastHoldTime = time + holdDuration;
    } else {
      // 非长按：正常生成普通音符
      for (const track of pattern.tracks) {
        notes.push({ track, time, isHold: false });
      }
    }

    if (Math.random() < 0.05) {
      time += interval * 0.67;
    } else {
      time += interval;
    }
  }
  return notes;
}

// ============ 音符管理 ============

/**
 * 获取当前轨道区域高度。
 * @returns {number}
 */
function getTrackHeight() {
  return tracksArea.clientHeight;
}

/**
 * 判定线在轨道中的纵向比例（底部起 85% 处）。
 * @returns {number}
 */
function getJudgeLineRatio() {
  return 0.85;
}

/**
 * 根据距命中时间计算音符纵向位置。
 * @param {number} timeUntilHit - 距离命中还有多少毫秒（可为负）。
 * @param {number} travelTime - 音符从生成到判定线的总下落时间。
 * @returns {number} 音符的 top 值（像素）。
 */
function noteY(timeUntilHit, travelTime) {
  const trackH = getTrackHeight();
  const judgeY = trackH * getJudgeLineRatio();
  const progress = timeUntilHit / travelTime;
  return judgeY - progress * judgeY;
}

/**
 * 创建（或复用）音符元素。
 * - 普通音符：48x48 图片
 * - 长按音符：48x48 头部图片 + 下方彩色长条身体
 *
 * @param {string} trackKey - 轨道键名 D/F/J/K。
 * @param {Object} noteData - 音符数据。
 * @returns {HTMLElement} 音符 DOM 元素。
 */
function createNoteElement(trackKey, noteData) {
  return notePool.acquire(trackKey, noteData);
}

/**
 * 更新所有活跃音符的位置。
 * @param {number} now - 当前 performance.now() 时间戳。
 */
function updateNotePositions(now) {
  const travelTime = SPEED_MAP[state.noteSpeed];
  const trackH = getTrackHeight();
  const judgeY = trackH * getJudgeLineRatio();

  for (const noteEl of state.activeNotes) {
    if (noteEl.dataset.hit === 'true') continue;
    const data = state.noteDataMap.get(noteEl);
    if (!data) continue;

    const timeUntilHit = data.time - (now - state.startTime);

    if (data.isHold) {
      // 长按音符：头部 + 身体
      const tailTime = data.time + data.holdDuration;
      const timeUntilTail = tailTime - (now - state.startTime);

      // 如果尾部已过判定线 + 判定窗口，视为错过
      if (timeUntilTail < -JUDGE_WINDOWS.GOOD) {
        handleMiss(noteEl, data);
        continue;
      }

      const headY = noteY(timeUntilHit, travelTime);
      const tailY = noteY(timeUntilTail, travelTime);
      const bodyHeight = Math.max(0, tailY - headY);

      noteEl.style.top = headY + 'px';
      const body = noteEl.querySelector('.note-hold-body');
      if (body) {
        body.style.top = '24px'; // 头部图片一半高度
        body.style.height = bodyHeight + 'px';
      }

      // 如果头部已过判定线但还没按，等待玩家按下
      // 如果头部已过判定窗口，标记为 miss
      if (timeUntilHit < -JUDGE_WINDOWS.GOOD) {
        // 头部已错过，但长按可能还没开始
        if (!state.heldKeys[trackKeys[data.track]]) {
          handleMiss(noteEl, data);
          continue;
        }
      }
    } else {
      // 普通音符
      const y = noteY(timeUntilHit, travelTime);
      if (timeUntilHit < -JUDGE_WINDOWS.GOOD) {
        handleMiss(noteEl, data);
        continue;
      }
      noteEl.style.top = y + 'px';
    }
  }
}

/**
 * 从活跃集合中移除音符并回收到对象池。
 * @param {HTMLElement} noteEl - 要移除的音符元素。
 */
function removeNote(noteEl) {
  const data = state.noteDataMap.get(noteEl);
  state.noteDataMap.delete(noteEl);

  const idx = state.activeNotes.indexOf(noteEl);
  if (idx !== -1) state.activeNotes.splice(idx, 1);

  if (data) {
    const trackList = state.trackActiveNotes[data.track];
    const tIdx = trackList.indexOf(noteEl);
    if (tIdx !== -1) trackList.splice(tIdx, 1);
  }

  notePool.release(noteEl);
}

// ============ 判定系统 ============

/**
 * 处理音符错过。
 * @param {HTMLElement} noteEl - 错过的音符元素。
 * @param {Object} data - 音符数据。
 */
function handleMiss(noteEl, data) {
  noteEl.dataset.hit = 'true';
  noteEl.classList.add('missed');
  state.combo = 0;
  state.missCount++;
  state.totalNotes++;
  updateHUD();
  showJudgePopup(trackKeys[data.track], 'MISS', '#ef4444');
  // Miss 不点亮任何像素（revealPixels 内部判断 MISS 为 0）
  revealPixels('MISS', '#ef4444');
  eventBus.emit('note:miss', { track: trackKeys[data.track], data });

  // 生命模式：失去一颗红心
  if (state.gameMode === MODE_LIFE) {
    const isDead = loseHeart();
    if (isDead) {
      setTimeout(() => removeNote(noteEl), 400);
      setTimeout(() => gameOver(), 500);
      return;
    }
  }

  setTimeout(() => removeNote(noteEl), 400);
}

/**
 * 处理音符命中（普通音符）。
 * @param {string} trackKey - 轨道键名。
 * @param {HTMLElement} noteEl - 命中的音符元素。
 * @param {Object} data - 音符数据。
 * @param {number} timeDiff - 命中时间差（正为提前，负为延后）。
 */
function handleHit(trackKey, noteEl, data, timeDiff) {
  if (data.isHold) {
    handleHoldStart(trackKey, noteEl, data, timeDiff);
    return;
  }

  noteEl.dataset.hit = 'true';
  const absDiff = Math.abs(timeDiff);

  let judgment, score, popupColor;
  if (absDiff < JUDGE_WINDOWS.PERFECT) {
    judgment = 'PERFECT';
    score = JUDGE_SCORES.PERFECT;
    popupColor = '#f59e0b';
    state.perfectCount++;
    playPerfectDing();
  } else if (absDiff < JUDGE_WINDOWS.GREAT) {
    judgment = 'GREAT';
    score = JUDGE_SCORES.GREAT;
    popupColor = '#8b5cf6';
    state.greatCount++;
  } else {
    judgment = 'GOOD';
    score = JUDGE_SCORES.GOOD;
    popupColor = '#3b82f6';
    state.goodCount++;
  }

  state.score += score;
  state.combo++;
  if (state.combo > state.maxCombo) state.maxCombo = state.combo;
  state.totalNotes++;
  state.totalHit++;
  state.keySequenceList.push(trackKey);

  checkComboMilestone();
  updateHUD();
  showJudgePopup(trackKey, judgment, popupColor);
  pulseJudgeLine(trackKey);
  triggerHitEffect(NOTE_COLORS[trackKey], trackKey);
  executeAction(trackKey, judgment);
  eventBus.emit('note:hit', { track: trackKey, judgment, data });

  noteEl.classList.add('hit');
  setTimeout(() => removeNote(noteEl), 300);
}

// ============ 长按滑条系统 ============

/**
 * 长按开始：按下键盘时命中长按音符头部。
 * @param {string} trackKey - 轨道键名。
 * @param {HTMLElement} noteEl - 长按音符元素。
 * @param {Object} data - 音符数据。
 * @param {number} timeDiff - 命中时间差。
 */
function handleHoldStart(trackKey, noteEl, data, timeDiff) {
  // 标记为已命中头部
  noteEl.dataset.hit = 'true';
  noteEl.classList.add('hold-active');

  const absDiff = Math.abs(timeDiff);
  let judgment, score, popupColor;
  if (absDiff < JUDGE_WINDOWS.PERFECT) {
    judgment = 'PERFECT';
    score = 30;
    popupColor = '#f59e0b';
    state.perfectCount++;
    playPerfectDing();
  } else if (absDiff < JUDGE_WINDOWS.GREAT) {
    judgment = 'GREAT';
    score = 20;
    popupColor = '#8b5cf6';
    state.greatCount++;
  } else {
    judgment = 'GOOD';
    score = 10;
    popupColor = '#3b82f6';
    state.goodCount++;
  }

  state.score += score;
  state.totalNotes++;
  state.totalHit++;
  state.keySequenceList.push(trackKey + '↓');

  // 记录按住的键
  state.heldKeys[trackKey] = {
    noteEl,
    data,
    holdStartTime: performance.now(),
    judgment,
  };

  // 头部命中判定弹窗
  showJudgePopup(trackKey, judgment, popupColor);
  pulseJudgeLine(trackKey);
  triggerHitEffect(NOTE_COLORS[trackKey], trackKey);
  executeAction(trackKey, judgment);
  eventBus.emit('note:hit', { track: trackKey, judgment, data, hold: true });
  updateHUD();
}

/**
 * 长按释放：松开按键时检查是否完成滑条。
 * @param {string} trackKey - 轨道键名。
 */
function handleHoldRelease(trackKey) {
  const held = state.heldKeys[trackKey];
  if (!held) return;

  const { noteEl, data, holdStartTime, judgment } = held;
  delete state.heldKeys[trackKey];

  const now = performance.now();
  const tailTime = data.time + data.holdDuration;
  const tailDiff = (now - state.startTime) - tailTime;

  // 尾部是否在判定窗口内
  if (tailDiff >= -JUDGE_WINDOWS.GOOD && tailDiff <= JUDGE_WINDOWS.GOOD) {
    // 完美释放
    state.score += 50;
    state.combo++;
    if (state.combo > state.maxCombo) state.maxCombo = state.combo;
    state.keySequenceList.push('^' + trackKey);
    showJudgePopup(trackKey, 'PERFECT', '#f59e0b');
    playPerfectDing();
  } else if (tailDiff >= -JUDGE_WINDOWS.GOOD * 2 && tailDiff <= JUDGE_WINDOWS.GOOD * 2) {
    // 勉强释放
    state.score += 20;
    state.combo++;
    if (state.combo > state.maxCombo) state.maxCombo = state.combo;
    state.keySequenceList.push('^' + trackKey);
    showJudgePopup(trackKey, 'GOOD', '#3b82f6');
  } else {
    // 释放太早或太晚
    state.combo = 0;
    state.missCount++;
    showJudgePopup(trackKey, 'MISS', '#ef4444');
  }

  noteEl.classList.remove('hold-active');
  noteEl.classList.add('hit');
  pulseJudgeLine(trackKey);
  checkComboMilestone();
  updateHUD();
  eventBus.emit('note:holdRelease', { track: trackKey, data });

  setTimeout(() => removeNote(noteEl), 300);
}

/**
 * 检查并触发连击里程碑特效。
 */
function checkComboMilestone() {
  if (state.combo === 10 || state.combo === 20 || state.combo === 50) {
    playComboMilestone(state.combo);
    showComboEffect(state.combo);
    eventBus.emit('combo:milestone', { combo: state.combo });
  }

  // 生命模式：每达成 LIFE_COMBO_HEAL 连击恢复一颗红心
  if (state.gameMode === MODE_LIFE && state.combo >= state.nextHealCombo) {
    if (state.hearts < LIFE_MAX_HEARTS) {
      healHeart();
    }
    state.nextHealCombo += LIFE_COMBO_HEAL;
  }
}

/**
 * 在判定线处显示判定弹窗。
 * @param {string} trackKey - 轨道键名。
 * @param {string} text - 判定文字（PERFECT/GREAT/GOOD/MISS/FREE）。
 * @param {string} color - 弹窗颜色。
 */
function showJudgePopup(trackKey, text, color) {
  const useImage = Boolean(JUDGE_IMAGES[text]);
  const popup = getReusableJudgePopup(trackKey, useImage ? 'image' : 'text');
  popup.getAnimations().forEach(animation => animation.cancel());

  if (useImage) {
    popup.src = JUDGE_IMAGES[text];
    popup.style.color = color;
  } else {
    popup.textContent = text;
    popup.style.color = color;
    popup.style.textShadow = `0 0 10px ${color}`;
  }

  popup.style.top = (getTrackHeight() * getJudgeLineRatio() - 20) + 'px';
  popup.style.opacity = '1';
  popup.animate(
    [
      { opacity: 1, transform: 'translateX(-50%) translateY(0)' },
      { opacity: 0, transform: 'translateX(-50%) translateY(-40px)' },
    ],
    {
      duration: 600,
      easing: 'ease-out',
    }
  ).onfinish = () => {
    popup.style.opacity = '0';
  };
}

/**
 * 显示连击里程碑全屏特效。
 * @param {number} combo - 当前连击数。
 */
function showComboEffect(combo) {
  const colors = { 10: '#06b6d4', 20: '#8b5cf6', 50: '#f59e0b' };
  const color = colors[combo] || '#f59e0b';
  ensureComboEffectElements();

  comboFlashEl.style.backgroundColor = color;
  comboFlashEl.style.opacity = '0.35';
  comboFlashEl.getAnimations().forEach(animation => animation.cancel());
  comboFlashEl.animate(
    [
      { opacity: 0.35 },
      { opacity: 0 },
    ],
    {
      duration: 500,
      easing: 'ease-out',
    }
  ).onfinish = () => {
    comboFlashEl.style.opacity = '0';
  };

  comboTextEl.textContent = combo + ' COMBO!';
  comboTextEl.style.color = color;
  comboTextEl.style.opacity = '1';
  comboTextEl.getAnimations().forEach(animation => animation.cancel());
  comboTextEl.animate(
    [
      { opacity: 0, transform: 'translate(-50%, -50%) scale(0.3)' },
      { opacity: 1, transform: 'translate(-50%, -50%) scale(1.2)', offset: 0.2 },
      { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.4 },
      { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.8 },
      { opacity: 0, transform: 'translate(-50%, -50%) scale(1.1)' },
    ],
    {
      duration: 800,
      easing: 'ease-out',
    }
  ).onfinish = () => {
    comboTextEl.style.opacity = '0';
  };
}

/**
 * 让判定线产生脉冲动画。
 * @param {string} trackKey - 轨道键名。
 */
function pulseJudgeLine(trackKey) {
  const line = document.getElementById('judge-' + trackKey);
  if (!line) return;
  line.classList.remove('pulse');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      line.classList.add('pulse');
    });
  });
}

/**
 * 根据按键触发右侧画布的对应动作。
 * 所有按键都触发像素显影，K 键额外执行清屏。
 * @param {string} trackKey - 轨道键名 D/F/J/K。
 * @param {string} [judgment] - 判定结果，用于决定显影像素数量。
 */
function executeAction(trackKey, judgment) {
  if (trackKey === 'K') {
    clearCanvas();
  } else {
    revealPixels(judgment || 'FREE', NOTE_COLORS[trackKey]);
  }
}

/**
 * 更新 HUD（分数、连击、准确率、完成度、红心）。
 */
function updateHUD() {
  hudScore.textContent = state.score;

  // 连击数字 bump 抖动
  const comboStr = state.combo + '';
  if (hudCombo.textContent !== comboStr) {
    hudCombo.textContent = comboStr;
    hudCombo.classList.remove('bump');
    void hudCombo.offsetWidth;
    hudCombo.classList.add('bump');
  }

  const accuracy = state.totalNotes > 0
    ? Math.round((state.totalHit / state.totalNotes) * 100)
    : 100;
  hudAccuracy.textContent = accuracy + '%';

  // 更新像素画完成度
  const completion = getCompletionPercent();
  if (hudCompletion) {
    hudCompletion.textContent = completion + '%';
  }

  // 生命模式：显示红心
  if (state.gameMode === MODE_LIFE && hudHearts) {
    hudHearts.classList.remove('hidden');
    renderHearts();
  } else if (hudHearts) {
    hudHearts.classList.add('hidden');
  }
}

/**
 * 渲染红心显示。
 */
function renderHearts() {
  if (!heartsDisplay) return;
  heartsDisplay.innerHTML = '';
  for (let i = 0; i < LIFE_MAX_HEARTS; i++) {
    const span = document.createElement('span');
    span.className = 'heart ' + (i < state.hearts ? 'filled' : 'empty');
    span.textContent = '❤';
    heartsDisplay.appendChild(span);
  }
}

/**
 * 生命模式失去一颗红心。返回是否因此游戏结束。
 */
function loseHeart() {
  if (state.gameMode !== MODE_LIFE) return false;
  if (state.hearts <= 0) return false;

  state.hearts--;
  renderHearts();

  // 播放失血音效
  playTone(150, 0.25, 'sawtooth', 0.3);

  // 最后一颗红心消失时的破碎动画
  if (state.hearts === 0) {
    return true; // 游戏结束
  }
  return false;
}

/**
 * 生命模式恢复一颗红心。
 */
function healHeart() {
  if (state.gameMode !== MODE_LIFE) return;
  if (state.hearts >= LIFE_MAX_HEARTS) return;

  state.hearts++;
  renderHearts();

  // 播放治愈音效（上扬琶音）
  playTone(523, 0.12, 'sine', 0.25);
  setTimeout(() => playTone(659, 0.12, 'sine', 0.25), 80);
  setTimeout(() => playTone(784, 0.15, 'sine', 0.25), 160);
}

/**
 * 立即结束游戏（生命模式红心耗尽）。
 */
function gameOver() {
  stopBackgroundMusic();
  _stopPixelAnimation();
  if (state.animFrameId) cancelAnimationFrame(state.animFrameId);

  // 清理所有音符
  for (const tk of Object.keys(state.heldKeys)) {
    const held = state.heldKeys[tk];
    state.missCount++;
    removeNote(held.noteEl);
  }
  state.heldKeys = {};
  const remaining = [...state.activeNotes];
  for (const noteEl of remaining) {
    if (noteEl.dataset.hit === 'false') {
      state.missCount++;
      state.totalNotes++;
    }
    removeNote(noteEl);
  }

  // 强制进入 result 状态
  if (!gameStateMachine.transition('result')) {
    // 兜底：直接切换 UI
  }

  showGameOverResult();
}

/**
 * 显示生命模式红心耗尽的结果界面。
 */
function showGameOverResult() {
  const accuracy = state.totalNotes > 0 ? state.totalHit / state.totalNotes : 1;
  let grade;
  if (accuracy >= 0.95) grade = 'S';
  else if (accuracy >= 0.85) grade = 'A';
  else if (accuracy >= 0.70) grade = 'B';
  else if (accuracy >= 0.55) grade = 'C';
  else grade = 'D';

  resultGradeImg.src = GRADE_IMAGES[grade];
  resultScore.textContent = state.score;
  resultMaxCombo.textContent = state.maxCombo;
  resultAccuracy.textContent = Math.round(accuracy * 100) + '%';
  resultPerfect.textContent = state.perfectCount;
  resultGreat.textContent = state.greatCount;
  resultGood.textContent = state.goodCount;
  resultMiss.textContent = state.missCount;

  if (hudCompletion) hudCompletion.textContent = getCompletionPercent() + '%';

  // 修改结果标题为 "红心耗尽！"
  const resultTitleEl = resultScreen.querySelector('.result-title');
  if (resultTitleEl) resultTitleEl.textContent = '💔 红心耗尽！';

  keySequence.innerHTML = '<span style="color:var(--text-dim)">代码序列：</span>' +
    state.keySequenceList.map(k => {
      if (k.endsWith('↓')) return `<span class="k-${k[0].toLowerCase()}" style="text-decoration:underline">${k[0]}</span>`;
      if (k.startsWith('^')) return `<span class="k-${k[1].toLowerCase()}">↑${k[1]}</span>`;
      return `<span class="k-${k.toLowerCase()}">${k}</span>`;
    }).join(' ');

  // 一次性点亮所有像素，带交错动画
  const revealAnimTime = revealAllPixels();

  // 等显影完成后再切换界面
  setTimeout(() => {
    _stopPixelAnimation();

    // 低沉的结束音效
    playTone(200, 0.3, 'sawtooth', 0.15);
    setTimeout(() => playTone(300, 0.3, 'sawtooth', 0.12), 150);

    resultArtwork.innerHTML = '';
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = drawCanvas.width;
    previewCanvas.height = drawCanvas.height;
    const previewCtx = previewCanvas.getContext('2d');
    previewCtx.drawImage(drawCanvas, 0, 0);
    previewCanvas.style.width = '100%';
    previewCanvas.style.height = '100%';
    resultArtwork.appendChild(previewCanvas);

    gameScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    eventBus.emit('game:end', { score: state.score, maxCombo: state.maxCombo, grade });
  }, revealAnimTime);
}

// ============ 游戏循环 ============

/**
 * 游戏主循环。
 * @param {number} timestamp - requestAnimationFrame 传入的时间戳。
 */
function gameLoop(timestamp) {
  if (gameStateMachine.getState() !== 'playing') return;
  if (!state.startTime) state.startTime = timestamp;

  const elapsed = timestamp - state.startTime;
  state.elapsed = elapsed;

  const remaining = Math.max(0, Math.ceil(state.gameDuration - elapsed / 1000));
  hudTimer.textContent = remaining + 's';

  updateNotePositions(timestamp);
  spawnNotes(timestamp);

  if (elapsed >= state.gameDuration * 1000) {
    endGame();
    return;
  }
  state.animFrameId = requestAnimationFrame(gameLoop);
}

let chartIndex = 0;

/**
 * 根据当前时间生成（激活）即将进入判定区的音符。
 * @param {number} timestamp - 当前时间戳。
 */
function spawnNotes(timestamp) {
  const travelTime = SPEED_MAP[state.noteSpeed];
  const elapsed = timestamp - state.startTime;

  while (chartIndex < state.chart.length) {
    const noteData = state.chart[chartIndex];
    const timeUntilHit = noteData.time - elapsed;
    if (timeUntilHit > travelTime + 100) break;

    // 长按音符：用尾部时间判断是否过期
    const effectiveTime = noteData.isHold
      ? noteData.time + noteData.holdDuration
      : noteData.time;
    const effectiveUntilHit = effectiveTime - elapsed;

    if (effectiveUntilHit > -JUDGE_WINDOWS.GOOD) {
      const trackKey = trackKeys[noteData.track];
      const noteEl = createNoteElement(trackKey, noteData);
      state.activeNotes.push(noteEl);
      state.trackActiveNotes[noteData.track].push(noteEl);
      state.noteDataMap.set(noteEl, noteData);
    }
    chartIndex++;
  }
}

// ============ 倒计时 ============

/**
 * 显示 3-2-1-GO 倒计时。
 * @param {Function} onComplete - 倒计时结束后的回调。
 */
function showCountdown(onComplete) {
  const overlay = $('#countdown-overlay');
  const numberEl = $('#countdown-number');
  const sequence = ['3', '2', '1', 'GO!'];
  let index = 0;
  overlay.classList.remove('hidden');

  function showNext() {
    if (index >= sequence.length) {
      overlay.classList.add('hidden');
      onComplete();
      return;
    }
    numberEl.textContent = sequence[index];
    numberEl.classList.remove('countdown-number');
    void numberEl.offsetWidth;
    numberEl.classList.add('countdown-number');
    index++;
    setTimeout(showNext, 800);
  }
  showNext();
}

// ============ 游戏流程 ============

/**
 * 开始一局新游戏。
 */
function startGame() {
  try {
    initAudio();

    if (!gameStateMachine.transition('countdown')) return;

    resetGameState();

    // 确保结果标题恢复正常
    const resultTitleEl = resultScreen.querySelector('.result-title');
    if (resultTitleEl) resultTitleEl.textContent = '作品完成！';

    // 初始化红心 HUD 可见性
    if (state.gameMode === MODE_LIFE) {
      hudHearts.classList.remove('hidden');
      renderHearts();
    } else {
      hudHearts.classList.add('hidden');
    }

    startScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    pauseOverlay.classList.add('hidden');
    $('#countdown-overlay').classList.add('hidden');
    cacheJudgeHitPositions();

    updateHUD();
    hudTimer.textContent = state.gameDuration + 's';

    stopBackgroundMusic();
    if (state.metronomeInterval) clearInterval(state.metronomeInterval);
    if (state.animFrameId) cancelAnimationFrame(state.animFrameId);

    eventBus.emit('game:start', { speed: state.noteSpeed });

    showCountdown(() => {
      if (gameStateMachine.transition('playing')) {
        state.startTime = 0;
        startBackgroundMusic();
        state.animFrameId = requestAnimationFrame(gameLoop);
      }
    });
  } catch (err) {
    console.error('startGame 出错:', err);
    goToMenu();
  }
}

/**
 * 暂停游戏。
 */
function pauseGame() {
  if (!gameStateMachine.transition('paused')) return;
  pauseOverlay.classList.remove('hidden');
  stopBackgroundMusic();
  if (state.animFrameId) cancelAnimationFrame(state.animFrameId);
  eventBus.emit('game:pause');
}

/**
 * 恢复游戏。
 */
function resumeGame() {
  if (!gameStateMachine.transition('playing')) return;
  pauseOverlay.classList.add('hidden');
  cacheJudgeHitPositions();
  state.startTime = performance.now() - state.elapsed;
  startBackgroundMusic();
  state.animFrameId = requestAnimationFrame(gameLoop);
  eventBus.emit('game:resume');
}

/**
 * 结束游戏并展示结果。
 * 分两阶段：先清理并触发全像素显影，等动画完成后切换结果界面。
 */
function endGame() {
  if (!gameStateMachine.transition('result')) return;
  stopBackgroundMusic();
  // 注意：先不停止像素画动画，等显影完成后再停

  // 确保结果界面标题恢复为正常文本
  const resultTitleEl = resultScreen.querySelector('.result-title');
  if (resultTitleEl) resultTitleEl.textContent = '作品完成！';

  // 释放所有按住的长按
  for (const tk of Object.keys(state.heldKeys)) {
    const held = state.heldKeys[tk];
    state.combo = 0;
    state.missCount++;
    removeNote(held.noteEl);
  }
  state.heldKeys = {};

  const remaining = [...state.activeNotes];
  for (const noteEl of remaining) {
    if (noteEl.dataset.hit === 'false') {
      state.missCount++;
      state.totalNotes++;
      state.combo = 0;
    }
    removeNote(noteEl);
  }

  // 计算等级
  const accuracy = state.totalNotes > 0 ? state.totalHit / state.totalNotes : 1;
  let grade;
  if (accuracy >= 0.95) grade = 'S';
  else if (accuracy >= 0.85) grade = 'A';
  else if (accuracy >= 0.70) grade = 'B';
  else if (accuracy >= 0.55) grade = 'C';
  else grade = 'D';

  // 更新结果数据
  resultGradeImg.src = GRADE_IMAGES[grade];
  resultScore.textContent = state.score;
  resultMaxCombo.textContent = state.maxCombo;
  resultAccuracy.textContent = Math.round(accuracy * 100) + '%';
  resultPerfect.textContent = state.perfectCount;
  resultGreat.textContent = state.greatCount;
  resultGood.textContent = state.goodCount;
  resultMiss.textContent = state.missCount;

  // 显示最终像素画完成度（此时已是 100%）
  const finalCompletion = getCompletionPercent();
  if (hudCompletion) hudCompletion.textContent = finalCompletion + '%';

  // 触发全像素显影（带交错动画）
  const revealAnimTime = revealAllPixels();

  // 构建按键序列
  keySequence.innerHTML = '<span style="color:var(--text-dim)">代码序列：</span>' +
    state.keySequenceList.map(k => {
      if (k.endsWith('↓')) return `<span class="k-${k[0].toLowerCase()}" style="text-decoration:underline">${k[0]}</span>`;
      if (k.startsWith('^')) return `<span class="k-${k[1].toLowerCase()}">↑${k[1]}</span>`;
      return `<span class="k-${k.toLowerCase()}">${k}</span>`;
    }).join(' ');

  // 等待显影动画完成后，复制画布并切换结果界面
  setTimeout(() => {
    _stopPixelAnimation();

    // 庆祝音效：明亮琶音
    playTone(523, 0.15, 'sine', 0.2);
    setTimeout(() => playTone(659, 0.15, 'sine', 0.2), 100);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.2), 200);
    setTimeout(() => playTone(1047, 0.3, 'sine', 0.25), 300);

    resultArtwork.innerHTML = '';
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = drawCanvas.width;
    previewCanvas.height = drawCanvas.height;
    const previewCtx = previewCanvas.getContext('2d');
    previewCtx.drawImage(drawCanvas, 0, 0);
    previewCanvas.style.width = '100%';
    previewCanvas.style.height = '100%';
    resultArtwork.appendChild(previewCanvas);

    gameScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    eventBus.emit('game:end', { score: state.score, maxCombo: state.maxCombo, grade });
  }, revealAnimTime);
}

/**
 * 返回主菜单。
 */
function goToMenu() {
  const from = gameStateMachine.getState();
  if (from === 'menu') return;

  // 若状态机拒绝转换（理论上不应发生），仍执行 UI 兜底清理，
  // 保证玩家不会被困在非菜单界面。
  if (!gameStateMachine.transition('menu')) {
    console.warn(`goToMenu: 状态机未接受 ${from} -> menu 的转换`);
  }

  stopBackgroundMusic();
  _stopPixelAnimation();
  if (state.animFrameId) cancelAnimationFrame(state.animFrameId);
  state.heldKeys = {};
  gameScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
  pauseOverlay.classList.add('hidden');
  $('#countdown-overlay').classList.add('hidden');
  startScreen.classList.remove('hidden');
  eventBus.emit('game:menu');
}

/**
 * 保存当前画布作品为 PNG。
 */
function saveArtwork() {
  try {
    const link = document.createElement('a');
    link.download = 'codebeat-artwork-' + Date.now() + '.png';
    link.href = drawCanvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('保存作品失败:', err);
    alert('保存失败，请重试');
  }
}
