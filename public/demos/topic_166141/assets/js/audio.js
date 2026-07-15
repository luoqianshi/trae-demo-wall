// audio.js - Web Audio API 音效合成
// 无外部音频文件,全部通过 OscillatorNode 合成古风音效

const Audio = (() => {
  let ctx = null;
  let enabled = true;

  function getCtx() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
      } catch (e) {
        console.warn('Web Audio API 不可用', e);
        return null;
      }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function setEnabled(v) { enabled = v; }
  function isEnabled() { return enabled; }

  function playOnce(generator) {
    if (!enabled) return;
    const c = getCtx();
    if (!c) return;
    try { generator(c); } catch (e) { console.warn(e); }
  }

  // 打更声:低频脉冲三次
  function genggu() {
    playOnce(c => {
      [0, 300, 600].forEach(delay => {
        const t = c.currentTime + delay / 1000;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(55, t + 0.15);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain).connect(c.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    });
  }

  // 上朝钟鸣:中频金属感,衰减正弦
  function zhongming() {
    playOnce(c => {
      const t = c.currentTime;
      [1.0, 1.5, 2.0, 2.4].forEach((f, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f * 400, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
        osc.connect(gain).connect(c.destination);
        osc.start(t);
        osc.stop(t + 1.5);
      });
    });
  }

  // 太监传旨:短促高频
  function chuanzhi() {
    playOnce(c => {
      const t = c.currentTime;
      [0, 0.15, 0.30].forEach(d => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200 + d * 200, t + d);
        gain.gain.setValueAtTime(0, t + d);
        gain.gain.linearRampToValueAtTime(0.15, t + d + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + d + 0.12);
        osc.connect(gain).connect(c.destination);
        osc.start(t + d);
        osc.stop(t + d + 0.12);
      });
    });
  }

  // 选项点击:轻快滴答
  function click() {
    playOnce(c => {
      const t = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.08);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    });
  }

  // 勾选奏折:清脆铃铛
  function bell() {
    playOnce(c => {
      const t = c.currentTime;
      [1500, 2500].forEach(f => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain).connect(c.destination);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    });
  }

  return { setEnabled, isEnabled, genggu, zhongming, chuanzhi, click, bell, getCtx };
})();
