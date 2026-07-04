/* =================================================================
   CodeBeat 节奏编程 - DOM 引用缓存
   ================================================================= */

// ============ 画布 ============
const bgCanvas = $('#bg-canvas');
const bgCtx = bgCanvas.getContext('2d');

// ============ 屏幕 ============
const startScreen = $('#start-screen');
const gameScreen = $('#game-screen');
const resultScreen = $('#result-screen');
const pauseOverlay = $('#pause-overlay');

// ============ 游戏区域 ============
const tracksArea = $('#tracks-area');
const drawCanvas = $('#draw-canvas');
const drawCtx = drawCanvas.getContext('2d');

// ============ HUD ============
const hudScore = $('#hud-score');
const hudCombo = $('#hud-combo');
const hudAccuracy = $('#hud-accuracy');
const hudTimer = $('#hud-timer');
const hudCompletion = $('#hud-completion');
const hudHearts = $('#hud-hearts');
const heartsDisplay = $('#hearts-display');

// ============ 结果界面 ============
const resultScore = $('#result-score');
const resultMaxCombo = $('#result-maxcombo');
const resultAccuracy = $('#result-accuracy');
const resultPerfect = $('#result-perfect');
const resultGreat = $('#result-great');
const resultGood = $('#result-good');
const resultMiss = $('#result-miss');
const resultArtwork = $('#result-artwork');
const keySequence = $('#key-sequence');
const resultGradeImg = $('#result-grade-img');

// ============ 轨道容器 ============
const trackKeys = ['D', 'F', 'J', 'K'];
const trackContainers = {
  D: $('#track-D'),
  F: $('#track-F'),
  J: $('#track-J'),
  K: $('#track-K'),
};
