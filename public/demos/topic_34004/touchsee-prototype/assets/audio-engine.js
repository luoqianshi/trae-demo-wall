// ============================================================
// TouchSee Audio Engine — 声音辅助引擎（触觉+听觉双重保险）
// 非语音短促蜂鸣音，仅在 <2m 近距/危险距离触发
// ============================================================
(function (global) {
  'use strict';

  var state = {
    enabled: false,
    audioCtx: null,
    masterGain: null,
    lastPlayTime: 0,
    pulseTimer: null,
    currentParams: null,
  };

  // 最小播放间隔（ms），避免高频调用导致声音堆积
  var MIN_PLAY_INTERVAL = 80;
  // 蜂鸣音持续时间（ms）
  var BEEP_DURATION = 50;

  // ====== 初始化 AudioContext（需用户交互后调用） ======
  function init() {
    if (state.audioCtx) return;
    try {
      var AudioContext = global.AudioContext || global.webkitAudioContext;
      if (!AudioContext) {
        console.warn('[TouchSee Audio] Web Audio API not supported');
        return;
      }
      state.audioCtx = new AudioContext();
      state.masterGain = state.audioCtx.createGain();
      state.masterGain.gain.value = 1.0;
      state.masterGain.connect(state.audioCtx.destination);
    } catch (e) {
      console.warn('[TouchSee Audio] Failed to init AudioContext:', e);
    }
  }

  // ====== 开关声音辅助 ======
  function setEnabled(enabled) {
    if (enabled && !state.audioCtx) {
      init();
    }
    state.enabled = enabled;
    if (!enabled) {
      stopAll();
    }
    // 恢复 AudioContext（浏览器可能挂起）
    if (enabled && state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
  }

  function isEnabled() {
    return state.enabled;
  }

  // ====== 播放单个蜂鸣音 ======
  function playBeep(freq, volume, pan) {
    if (!state.audioCtx || !state.enabled) return;

    var now = state.audioCtx.currentTime;

    // Oscillator (square wave for buzzer feel)
    var osc = state.audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;

    // Gain node with ADSR envelope
    var gain = state.audioCtx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.005); // Attack 5ms
    gain.gain.linearRampToValueAtTime(volume * 0.7, now + 0.02); // Decay
    gain.gain.setValueAtTime(volume * 0.7, now + BEEP_DURATION / 1000 - 0.01);
    gain.gain.linearRampToValueAtTime(0, now + BEEP_DURATION / 1000); // Release

    // Stereo panner for direction
    var panner;
    try {
      panner = state.audioCtx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
    } catch (e) {
      // Fallback: no panning
      panner = state.audioCtx.createGain();
      panner.gain.value = 1;
    }

    // Connect: osc → gain → panner → masterGain → destination
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(state.masterGain);

    osc.start(now);
    osc.stop(now + BEEP_DURATION / 1000 + 0.01);
  }

  // ====== 主接口：输入障碍物列表，播放声音 ======
  // obstacles: [{ azimuth, elevation, distance, type, confidence }]
  function playAlert(obstacles) {
    if (!state.enabled || !state.audioCtx) return;
    if (!obstacles || obstacles.length === 0) {
      stopAll();
      return;
    }

    // 节流
    var now = Date.now();
    if (now - state.lastPlayTime < MIN_PLAY_INTERVAL) return;
    state.lastPlayTime = now;

    // 从障碍物列表中提取声音参数（仲裁：取最近+最高优先级）
    var params = getSoundParams(obstacles);
    if (!params || !params.trigger) {
      stopAll();
      return;
    }

    // 如果参数没变化，不重新调度
    if (state.currentParams &&
        state.currentParams.freq === params.freq &&
        state.currentParams.volume === params.volume &&
        state.currentParams.pan === params.pan &&
        state.currentParams.interval === params.interval) {
      return; // 保持现有脉冲序列
    }

    state.currentParams = params;

    // 清除旧的脉冲定时器
    if (state.pulseTimer) {
      clearInterval(state.pulseTimer);
      state.pulseTimer = null;
    }

    // 播放第一个蜂鸣
    playBeep(params.freq, params.volume, params.pan);

    // 调度后续脉冲序列
    state.pulseTimer = setInterval(function () {
      if (!state.enabled) {
        clearInterval(state.pulseTimer);
        state.pulseTimer = null;
        return;
      }
      playBeep(params.freq, params.volume, params.pan);
    }, params.interval);
  }

  // ====== 从障碍物列表提取声音参数（仲裁逻辑） ======
  function getSoundParams(obstacles) {
    if (!obstacles || obstacles.length === 0) return null;

    var best = null;
    var bestScore = -1;

    for (var i = 0; i < obstacles.length; i++) {
      var obs = obstacles[i];
      var dist = obs.distance;

      // 只考虑 <2m 的障碍物
      if (dist >= 2.0) continue;

      // 仲裁分数：距离越近分数越高 + 类型优先级
      var typePattern = (global.TouchSee && global.TouchSee.Engine && global.TouchSee.Engine.TYPE_PATTERNS[obs.type]) || { priority: 3 };
      var score = (2.0 - dist) * 10 + typePattern.priority;

      if (score > bestScore) {
        bestScore = score;
        best = obs;
      }
    }

    if (!best) return { trigger: false };

    var dist = best.distance;
    var trigger = true;
    var freq, volume, interval;

    if (dist < 1.0) {
      // 危险：1000Hz，急促连续
      freq = 1000;
      volume = 0.6;
      interval = 125; // 8Hz = 125ms
    } else {
      // 近距：600Hz，短促双音
      freq = 600;
      volume = 0.3;
      interval = 200; // ~5Hz
    }

    // 方向编码：方位角 → 左右声相
    // -90° → -1 (左), 0° → 0 (中), +90° → +1 (右)
    // 后方障碍物（|azimuth|>90°）降低音量 50%
    var az = best.azimuth;
    var pan = 0;
    var azClamped = az;
    if (az > 180) azClamped = az - 360;
    if (az < -180) azClamped = az + 360;

    if (Math.abs(azClamped) <= 90) {
      // 前方/侧方
      pan = azClamped / 90;
    } else {
      // 后方：映射到边缘 + 降低音量
      pan = azClamped > 0 ? 1 : -1;
      volume *= 0.5;
    }

    return {
      trigger: trigger,
      freq: freq,
      volume: volume,
      pan: pan,
      interval: interval,
      distance: dist,
      azimuth: best.azimuth,
      type: best.type,
    };
  }

  // ====== 停止所有声音 ======
  function stopAll() {
    if (state.pulseTimer) {
      clearInterval(state.pulseTimer);
      state.pulseTimer = null;
    }
    state.currentParams = null;
  }

  // ====== 获取当前声音状态（用于 UI 显示） ======
  function getStatus() {
    if (!state.enabled) return { enabled: false, active: false };
    if (!state.currentParams || !state.currentParams.trigger) {
      return { enabled: true, active: false };
    }
    return {
      enabled: true,
      active: true,
      freq: state.currentParams.freq,
      volume: state.currentParams.volume,
      pan: state.currentParams.pan,
      distance: state.currentParams.distance,
    };
  }

  // ====== 导出 ======
  global.TouchSee = global.TouchSee || {};
  global.TouchSee.Audio = {
    init: init,
    setEnabled: setEnabled,
    isEnabled: isEnabled,
    playAlert: playAlert,
    stopAll: stopAll,
    getStatus: getStatus,
    getSoundParams: getSoundParams,
  };
})(window);
