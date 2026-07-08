/**
 * 财富江湖 - 古风音效系统
 * 使用 Web Audio API 合成，无需外部音频文件
 */
(function() {
  'use strict';

  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  var ctx = null;

  function getCtx() {
    if (!ctx) {
      try { ctx = new AudioCtx(); } catch(e) { return null; }
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  function playTone(freqs, type, duration, gainVal, detune) {
    var c = getCtx();
    if (!c) return;

    var now = c.currentTime;
    var gain = c.createGain();
    gain.connect(c.destination);
    gain.gain.setValueAtTime(gainVal || 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    if (!Array.isArray(freqs)) freqs = [freqs];

    freqs.forEach(function(f, i) {
      var osc = c.createOscillator();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(f, now);
      if (detune) osc.detune.setValueAtTime((i - 0.5) * (detune || 8), now);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + duration);
    });
  }

  // 短笛/编钟音 — 奇遇打开
  window.playEncounterOpenSFX = function() {
    var c = getCtx();
    if (!c) return;
    var now = c.currentTime;
    var gain = c.createGain();
    gain.connect(c.destination);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    [880, 1100, 1320, 1760].forEach(function(f, i) {
      var osc = c.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.06);
      osc.connect(gain);
      osc.start(now + i * 0.06);
      osc.stop(now + 0.35);
    });
  };

  // 清脆玉石撞击 — 成就解锁
  window.playAchievementSFX = function() {
    var c = getCtx();
    if (!c) return;
    var now = c.currentTime;

    [0, 0.15].forEach(function(offset) {
      var gain = c.createGain();
      gain.connect(c.destination);
      gain.gain.setValueAtTime(0.15, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2);

      [1800, 2400, 3000].forEach(function(f, i) {
        var osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + offset + i * 0.01);
        osc.connect(gain);
        osc.start(now + offset + i * 0.01);
        osc.stop(now + offset + 0.2);
      });
    });
  };

  // 轻柔风声/流水声 — 页面/建筑切换
  window.playSwitchSFX = function() {
    var c = getCtx();
    if (!c) return;
    var now = c.currentTime;
    var gain = c.createGain();
    gain.connect(c.destination);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    // 白噪声模拟风声
    var bufferSize = c.sampleRate * 0.5;
    var buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    var noise = c.createBufferSource();
    noise.buffer = buffer;

    var filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.Q.setValueAtTime(1.5, now);

    noise.connect(filter);
    filter.connect(gain);
    noise.start(now);
    noise.stop(now + 0.5);
  };

  // 铜钱碰撞声
  window.playCoinSFX = function(isPositive) {
    var c = getCtx();
    if (!c) return;
    var now = c.currentTime;
    var gain = c.createGain();
    gain.connect(c.destination);
    gain.gain.setValueAtTime(isPositive ? 0.1 : 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    var baseFreq = isPositive ? 1200 : 800;
    [baseFreq, baseFreq * 1.5].forEach(function(f, i) {
      var osc = c.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.03);
      osc.connect(gain);
      osc.start(now + i * 0.03);
      osc.stop(now + 0.25);
    });

    // 添加一点高频泛音
    var gain2 = c.createGain();
    gain2.connect(c.destination);
    gain2.gain.setValueAtTime(0.04, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    var osc2 = c.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 3, now);
    osc2.connect(gain2);
    osc2.start(now + 0.02);
    osc2.stop(now + 0.15);
  };

  console.log('古风音效系统已就绪');
})();
