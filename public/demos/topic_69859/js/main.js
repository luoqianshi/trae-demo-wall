/* =================================================================
   CodeBeat 节奏编程 - 入口（事件监听 + 动画循环 + 初始化）
   ================================================================= */

// ============ 键盘事件 ============

document.addEventListener('keydown', (e) => {
  initAudio();
  const key = e.key.toUpperCase();
  const currentState = gameStateMachine.getState();

  if (key === 'ESCAPE') {
    if (currentState === 'playing' || currentState === 'paused' || currentState === 'countdown') {
      goToMenu();
    }
    return;
  }

  if (e.code === 'Space') {
    e.preventDefault();
    if (currentState === 'playing') pauseGame();
    else if (currentState === 'paused') resumeGame();
    return;
  }

  if (currentState !== 'playing') return;

  const trackKey = key;
  if (!trackKeys.includes(trackKey)) return;
  e.preventDefault();

  // 如果已经在按住该键（长按中），忽略重复 keydown
  if (state.heldKeys[trackKey]) return;

  const trackIndex = trackKeys.indexOf(trackKey);
  playTone(NOTE_FREQS[trackKey], 0.12, 'sine', 0.25);

  const now = performance.now();
  let bestNoteEl = null;
  let bestNoteData = null;
  let bestDiff = Infinity;

  // 使用轨道专属数组进行 O(1) 范围查找，避免扫描全部活跃音符
  for (const noteEl of state.trackActiveNotes[trackIndex]) {
    if (noteEl.dataset.hit === 'true') continue;
    const data = state.noteDataMap.get(noteEl);
    if (!data) continue;
    const timeDiff = (now - state.startTime) - data.time;
    const absDiff = Math.abs(timeDiff);
    if (absDiff < JUDGE_WINDOWS.GOOD && absDiff < Math.abs(bestDiff)) {
      bestNoteEl = noteEl;
      bestNoteData = data;
      bestDiff = timeDiff;
    }
  }

  if (bestNoteEl) {
    handleHit(trackKey, bestNoteEl, bestNoteData, bestDiff);
  } else {
    // 自由演奏：更悦耳的高频音色 + 点亮像素
    playTone(NOTE_FREQS[trackKey] * 1.5, 0.15, 'triangle', 0.15);
    revealPixels('FREE', NOTE_COLORS[trackKey]);
    state.keySequenceList.push(trackKey);
    showJudgePopup(trackKey, 'FREE', NOTE_COLORS[trackKey]);
    pulseJudgeLine(trackKey);
  }
});

// 长按释放事件
document.addEventListener('keyup', (e) => {
  const key = e.key.toUpperCase();
  if (!trackKeys.includes(key)) return;
  if (gameStateMachine.getState() !== 'playing') return;
  handleHoldRelease(key);
});

// ============ 按钮事件 ============

$('#btn-start').addEventListener('click', startGame);
$('#btn-replay').addEventListener('click', startGame);
$('#btn-save').addEventListener('click', saveArtwork);
$('#btn-menu').addEventListener('click', goToMenu);
$('#btn-resume').addEventListener('click', resumeGame);
$('#btn-quit').addEventListener('click', goToMenu);

// ============ 速度选择 ============
$$('.option-btn[data-speed]').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.option-btn[data-speed]').forEach(b => b.classList.remove('speed-active'));
    btn.classList.add('speed-active');
    state.noteSpeed = btn.dataset.speed;
  });
});

// ============ 画作选择 ============
$$('.option-btn[data-artwork]').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.option-btn[data-artwork]').forEach(b => b.classList.remove('artwork-active'));
    btn.classList.add('artwork-active');
    setArtwork(btn.dataset.artwork);
  });
});

// ============ 时长选择 ============
$$('.option-btn[data-duration]').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.option-btn[data-duration]').forEach(b => b.classList.remove('duration-active'));
    btn.classList.add('duration-active');
    state.gameDuration = parseInt(btn.dataset.duration, 10);
  });
});

// ============ 模式选择 ============
$$('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.gameMode = btn.dataset.mode;
  });
});

// ============ 窗口缩放 ============

const handleResize = debounce(() => {
  resizeBgCanvas();
  resizeDrawCanvas();
  cacheJudgeHitPositions();
}, 150);
window.addEventListener('resize', handleResize);

// ============ 背景动画循环 ============

let lastBgTime = performance.now();
let bgAnimFrameId = null;

/**
 * 背景渲染循环，与游戏循环独立运行。
 * @param {number} timestamp - requestAnimationFrame 时间戳。
 */
function bgAnimationLoop(timestamp) {
  if (document.hidden) {
    lastBgTime = timestamp;
    bgAnimFrameId = requestAnimationFrame(bgAnimationLoop);
    return;
  }

  const dt = (timestamp - lastBgTime) / 1000;
  lastBgTime = timestamp;

  renderWebGL(timestamp);
  updateParticles();
  drawParticles();
  updateHitParticles(dt);
  drawHitParticles();

  bgAnimFrameId = requestAnimationFrame(bgAnimationLoop);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  lastBgTime = performance.now();
});

// ============ 初始化 ============

/** 初始化所有子系统并启动背景动画。 */
function init() {
  resizeBgCanvas();
  initParticles();
  initDrawCanvas();
  initWebGL();
  cacheJudgeHitPositions();
  bgAnimFrameId = requestAnimationFrame(bgAnimationLoop);
}

init();

console.log('%c🎵 CodeBeat 节奏编程 %c已就绪',
  'font-size:20px;color:#8b5cf6;',
  'color:#e0e0f0;');
console.log('%c按 D/F/J/K 演奏 | 空格暂停 | Esc 返回菜单',
  'color:#8888aa;font-size:12px;');
