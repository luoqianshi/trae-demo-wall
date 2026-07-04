/* =================================================================
   CodeBeat 节奏编程 - 音频引擎（Web Audio API）
   ================================================================= */

let audioCtx = null;
let noiseBuffer = null;
let audioAvailable = true;

/**
 * 初始化音频上下文。
 * 若浏览器不支持 Web Audio 或创建失败，则标记 audioAvailable=false，
 * 后续所有音频函数自动静默跳过，不影响游戏进行。
 */
function initAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(err => {
        console.warn('音频上下文恢复失败:', err.message);
      });
    }
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    console.warn('浏览器不支持 Web Audio API，音频功能已禁用');
    audioAvailable = false;
    return;
  }

  try {
    audioCtx = new AudioContextClass();
    audioAvailable = true;
    noiseBuffer = null; // audioCtx 重建时清除缓存
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch (err) {
    console.warn('AudioContext 初始化失败，音频功能已禁用:', err.message);
    audioCtx = null;
    audioAvailable = false;
  }
}

// ============ 基础音效 ============

/** 播放指定频率的短音 */
function playTone(freq, duration = 0.12, type = 'sine', volume = 0.3) {
  if (!audioCtx || !audioAvailable) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

/** 节拍器滴答声 */
function playTick() {
  if (!audioCtx || !audioAvailable) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(800, now);
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.04);
}

/** 完美判定叮音效 */
function playPerfectDing() {
  if (!audioCtx || !audioAvailable) return;
  playTone(1200, 0.15, 'sine', 0.25);
  setTimeout(() => playTone(1600, 0.1, 'sine', 0.2), 80);
}

/** 连击里程碑音效 */
function playComboMilestone(combo) {
  if (!audioCtx || !audioAvailable) return;
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.2), i * 100);
  });
}

// ============ 背景音乐（120BPM 鼓组） ============

const BGM_SCHEDULER_LOOKAHEAD_MS = 25;
const BGM_SCHEDULE_AHEAD_SEC = 0.12;
let bgmSchedulerId = null;
let bgmBeatCount = 0;
let nextBeatTime = 0;

/** 创建噪声 buffer（缓存复用） */
function getNoiseBuffer() {
  if (noiseBuffer) return noiseBuffer;
  if (!audioCtx || !audioAvailable) return null;
  const bufferSize = audioCtx.sampleRate * 0.2;
  noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

/** 底鼓（第1拍） */
function playKick(time) {
  if (!audioCtx || !audioAvailable) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.setValueAtTime(60, time);
  osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);
  gain.gain.setValueAtTime(0.24, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(time);
  osc.stop(time + 0.15);
}

/** 军鼓（第3拍） */
function playSnare(time) {
  if (!audioCtx || !audioAvailable) return;
  const buffer = getNoiseBuffer();
  if (!buffer) return;
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 200;
  filter.Q.value = 1;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.14, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start(time);
  noise.stop(time + 0.2);
}

/** 闭合嗨帽（每拍） */
function playHiHat(time) {
  if (!audioCtx || !audioAvailable) return;
  const buffer = getNoiseBuffer();
  if (!buffer) return;
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 8000;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.035, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start(time);
  noise.stop(time + 0.05);
}

/** 安排单拍鼓点 */
function scheduleBeat(time, beat) {
  if (!audioCtx || !audioAvailable) return;
  playHiHat(time);
  if (beat === 0) playKick(time);
  if (beat === 2) playSnare(time);
}

function scheduleBackgroundMusic() {
  if (!audioCtx || !audioAvailable) return;

  while (nextBeatTime < audioCtx.currentTime + BGM_SCHEDULE_AHEAD_SEC) {
    scheduleBeat(nextBeatTime, bgmBeatCount % 4);
    bgmBeatCount++;
    nextBeatTime += BEAT_MS / 1000;
  }

  bgmSchedulerId = window.setTimeout(scheduleBackgroundMusic, BGM_SCHEDULER_LOOKAHEAD_MS);
}

function ensureAudioReady() {
  if (!audioCtx || !audioAvailable) return false;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return true;
}

function stopScheduledBackgroundMusic() {
  if (bgmSchedulerId) {
    clearTimeout(bgmSchedulerId);
    bgmSchedulerId = null;
  }
}

/** 启动背景音乐 */
function startBackgroundMusic() {
  stopBackgroundMusic();
  if (!ensureAudioReady()) return;

  bgmBeatCount = 0;
  nextBeatTime = audioCtx.currentTime + 0.05;
  scheduleBackgroundMusic();
}

/** 停止背景音乐 */
function stopBackgroundMusic() {
  stopScheduledBackgroundMusic();
}
