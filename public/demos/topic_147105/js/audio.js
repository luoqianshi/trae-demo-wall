/**
 * 音效引擎 - Web Audio API 程序化生成音效
 * 无需外部音频文件
 */

const AudioEngine = {
  ctx: null,
  enabled: true,

  init() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) {
        console.warn('Web Audio API 不可用');
      }
    }
    // 某些浏览器需要用户交互后才能恢复
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.enabled = window.Store.getSettings().sound;
  },

  // 播放单个音符
  _playNote(frequency, duration, type = 'sine', volume = 0.3, when = 0) {
    if (!this.enabled || !this.ctx) return;
    const startTime = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);
    // ADSR 包络
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  },

  // 正确音：C5（523.25Hz），100ms，正弦波
  playCorrect() {
    this._playNote(523.25, 0.15, 'sine', 0.25);
  },

  // 错误音：A3（220Hz），200ms，方波
  playWrong() {
    this._playNote(220, 0.25, 'square', 0.2);
    this._playNote(196, 0.25, 'square', 0.15, 0.05);
  },

  // 点击音：极短促"嗒"声
  playClick() {
    this._playNote(800, 0.04, 'triangle', 0.15);
  },

  // 升级音：上行音阶 C4-E4-G4-C5
  playLevelUp() {
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, i) => {
      this._playNote(freq, 0.2, 'sine', 0.25, i * 0.1);
    });
  },

  // 完成音：胜利和弦 C4-E4-G4 同时 500ms
  playComplete() {
    this._playNote(261.63, 0.5, 'sine', 0.2);
    this._playNote(329.63, 0.5, 'sine', 0.2);
    this._playNote(392.00, 0.5, 'sine', 0.2);
  },

  // 心恢复音：柔和"啵"声
  playHeartRecover() {
    this._playNote(440, 0.2, 'sine', 0.2);
    this._playNote(660, 0.15, 'sine', 0.15, 0.05);
  },

  // 连击音：上行短促
  playCombo() {
    this._playNote(659.25, 0.08, 'triangle', 0.2);
    this._playNote(783.99, 0.08, 'triangle', 0.2, 0.08);
    this._playNote(987.77, 0.12, 'triangle', 0.25, 0.16);
  },

  // 宝箱音
  playTreasure() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this._playNote(f, 0.15, 'sine', 0.25, i * 0.08);
    });
  },

  // 切换启用状态
  setEnabled(enabled) {
    this.enabled = enabled;
  }
};

window.AudioEngine = AudioEngine;
