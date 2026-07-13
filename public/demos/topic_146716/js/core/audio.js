// ============================================================
// 音频系统模块 (AudioSystem)
// 负责：背景音乐、音效播放、音量控制、天气BGM切换、地图BGM
// ============================================================

const AudioSystem = {
  // --- 内部状态 ---
  audioCtx: null,
  masterGain: null,
  bgMusicGain: null,
  bgMusicPlaying: false,
  bgmAudio: null,
  _bgMusicOscillators: [], // 保存背景音乐振荡器引用，用于彻底停止
  soundBuffers: {},
  weatherBGM: {
    current: 'normal',
    audio: null,
    oldAudio: null,
    volume: 0.3
  },

  // --- 地图特定BGM配置 ---
  mapBGM: {
    island: { type: 'peaceful', tempo: 80, mood: 'safe', label: '海岛' },
    swamp:  { type: 'tense', tempo: 110, mood: 'danger', label: '沼泽' },
    city:   { type: 'action', tempo: 120, mood: 'combat', label: '城市' },
    snow:   { type: 'cold', tempo: 90, mood: 'survival', label: '雪山' },
    desert: { type: 'heat', tempo: 100, mood: 'desperate', label: '沙漠' }
  },
  currentMapBGM: null,
  mapBgmOscillators: [],
  mapBgmGains: [],
  mapBgmTimeouts: [],
  mapBgmPlaying: false,

  // --- 初始化 ---
  init() {
    this._initAudioContext();
    return true;
  },

  _initAudioContext() {
    if (!this.audioCtx) {
      try {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('[AudioSystem] Web Audio API not supported');
        return false;
      }
    }
    return true;
  },

  // --- 地图特定BGM ---
  playMapBGM(mapId) {
    if (!this._initAudioContext()) return;
    const config = this.mapBGM[mapId];
    if (!config) {
      console.warn('[AudioSystem] No BGM config for map:', mapId);
      return;
    }

    // 如果已经在播放同一地图的BGM，不重复启动
    if (this.currentMapBGM === mapId && this.mapBgmPlaying) return;

    // 先彻底停止所有旧BGM系统（避免多套BGM同时播放）
    this._stopAllBGM();

    // 平滑过渡：先淡出旧地图BGM
    const oldMap = this.currentMapBGM;
    this.currentMapBGM = mapId;

    if (oldMap && oldMap !== mapId) {
      this._fadeOutMapBGM(() => {
        this._startMapBGM(config);
      });
    } else {
      this._startMapBGM(config);
    }
  },

  // 彻底停止所有BGM系统（旧系统 + 新系统）
  _stopAllBGM() {
    // 停止旧背景循环
    this.bgMusicPlaying = false;
    // 显式停止所有背景音乐振荡器（防止残留声音）
    this._bgMusicOscillators.forEach(node => {
      try {
        if (node && node.stop) node.stop(this.audioCtx.currentTime + 0.05);
        if (node && node.disconnect) node.disconnect();
      } catch(e) {}
    });
    this._bgMusicOscillators = [];
    // 断开并清理bgMusicGain
    if (this.bgMusicGain) {
      try {
        this.bgMusicGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        this.bgMusicGain.disconnect();
      } catch(e) {}
      this.bgMusicGain = null;
    }
    // 停止HTML5 Audio BGM
    if (this.bgmAudio) {
      try { this.bgmAudio.pause(); this.bgmAudio.currentTime = 0; this.bgmAudio.src = ''; } catch(e) {}
      this.bgmAudio = null;
    }
    // 停止天气BGM
    if (this.weatherBGM.audio) {
      try { this.weatherBGM.audio.pause(); this.weatherBGM.audio.currentTime = 0; } catch(e) {}
      this.weatherBGM.audio = null;
    }
    if (this.weatherBGM.oldAudio) {
      try { this.weatherBGM.oldAudio.pause(); } catch(e) {}
      this.weatherBGM.oldAudio = null;
    }
    this.weatherBGM.current = 'normal';
    // 停止地图特定BGM
    this._clearMapBGM();
    this.currentMapBGM = null;
  },

  _startMapBGM(config) {
    this._clearMapBGM();
    this.mapBgmPlaying = true;

    const masterVol = (window.gameSettings ? window.gameSettings.masterVol : 70) / 100;
    const musicVol = (window.gameSettings ? window.gameSettings.musicVol : 30) / 100;
    const baseVol = 0.3 * masterVol * musicVol;

    switch (config.type) {
      case 'peaceful':
        this._playIslandBGM(baseVol);
        break;
      case 'tense':
        this._playSwampBGM(baseVol);
        break;
      case 'action':
        this._playCityBGM(baseVol);
        break;
      case 'cold':
        this._playSnowBGM(baseVol);
        break;
      case 'heat':
        this._playDesertBGM(baseVol);
        break;
    }
  },

  // 海岛BGM：严肃威武的军事基地风格
  // 优先使用外部MP3，失败后回退到程序化合成
  _playIslandBGM(baseVol) {
    // 停止之前的外部音频
    if (this._islandExternalAudio) {
      try { this._islandExternalAudio.pause(); } catch(e) {}
      this._islandExternalAudio = null;
    }

    // 如果之前外部MP3加载失败过，直接使用程序化合成
    if (this._islandExternalFailed) {
      this._playIslandBGMProcedural(baseVol);
      return;
    }

    // 尝试加载外部MP3
    const audio = new Audio();
    audio.loop = true;
    audio.volume = baseVol;
    audio.src = 'audio/island_bgm.mp3';

    let externalStarted = false;
    const fallbackTimeout = setTimeout(() => {
      if (!externalStarted && this.currentMapBGM === 'island' && this.mapBgmPlaying) {
        this._islandExternalFailed = true;
        this._playIslandBGMProcedural(baseVol);
      }
    }, 1500);

    audio.oncanplaythrough = () => {
      if (this.currentMapBGM === 'island' && this.mapBgmPlaying) {
        audio.play().catch(() => {});
        this._islandExternalAudio = audio;
        externalStarted = true;
        clearTimeout(fallbackTimeout);
      }
    };

    audio.onerror = () => {
      if (!externalStarted && this.currentMapBGM === 'island' && this.mapBgmPlaying) {
        this._islandExternalFailed = true;
        clearTimeout(fallbackTimeout);
        this._playIslandBGMProcedural(baseVol);
      }
    };

    audio.load();
  },

  // 高质量程序化合成军事基地BGM
  _playIslandBGMProcedural(baseVol) {
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const duration = 16; // 更长循环，减少重复感

    // ========== 1. 行军小军鼓（更真实的军鼓音色） ==========
    // 使用带通滤波的白噪声 + 音头衰减，模拟真实军鼓
    const snarePattern = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0];
    snarePattern.forEach((hit, i) => {
      if (!hit) return;
      const t = now + i * 0.25;
      // 军鼓音色：白噪声 + 200Hz正弦音头
      const len = Math.ceil(ctx.sampleRate * 0.12);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let j = 0; j < len; j++) {
        const env = Math.exp(-j / (ctx.sampleRate * 0.025));
        const tone = Math.sin(j * 200 * 2 * Math.PI / ctx.sampleRate) * 0.3;       data[j] = ((Math.random() * 2 - 1) * 0.7 + tone) * env;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.Q.setValueAtTime(2, t);
      gain.gain.setValueAtTime(baseVol * 0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(t);
      this.mapBgmOscillators.push(src);
      this.mapBgmGains.push(gain);
    });

    // ========== 2. 低音大鼓（更厚重的 kick） ==========
    const kickPattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
    kickPattern.forEach((hit, i) => {
      if (!hit) return;
      const t = now + i * 0.25;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.2);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(baseVol * 0.2, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
      this.mapBgmOscillators.push(osc);
      this.mapBgmGains.push(gain);
    });

    // ========== 3. 铜管主旋律（改进的ADSR包络 + 颤音） ==========
    // C小调进行曲，庄严紧张
    const brassNotes = [
      // 第一乐句
      { f: 261.63, t: 0.0, d: 0.8 },   // C4
      { f: 261.63, t: 0.8, d: 0.4 },   // C4 短
      { f: 311.13, t: 1.3, d: 0.5 },   // Eb4
      { f: 261.63, t: 1.9, d: 0.6 },   // C4
      { f: 207.65, t: 2.6, d: 1.0 },   // Ab3 长
      // 第二乐句
      { f: 233.08, t: 3.8, d: 0.5 },   // Bb3
      { f: 261.63, t: 4.4, d: 0.7 },   // C4
      { f: 311.13, t: 5.2, d: 0.4 },   // Eb4
      { f: 293.66, t: 5.7, d: 0.6 },   // D4
      { f: 261.63, t: 6.4, d: 1.0 },   // C4 长
      // 第三乐句（变化）
      { f: 349.23, t: 7.6, d: 0.6 },   // F4
      { f: 311.13, t: 8.3, d: 0.5 },   // Eb4
      { f: 261.63, t: 8.9, d: 0.7 },   // C4
      { f: 233.08, t: 9.7, d: 0.5 },   // Bb3
      { f: 207.65, t: 10.3, d: 0.8 },  // Ab3
      // 结尾
      { f: 174.61, t: 11.2, d: 0.6 },  // F3
      { f: 196.00, t: 11.9, d: 0.5 },  // G3
      { f: 207.65, t: 12.5, d: 1.5 },  // Ab3 延长
      { f: 261.63, t: 14.2, d: 1.0 },  // C4 结束
    ];
    brassNotes.forEach(note => {
      const t = now + note.t;
      // 使用两个sawtooth失谐叠加模拟铜管合奏
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(note.f, t);
      osc2.frequency.setValueAtTime(note.f * 1.003, t); // 微失谐

      // 颤音
      vibrato.frequency.setValueAtTime(5.5, t);
      vibratoGain.gain.setValueAtTime(note.f * 0.008, t);
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc1.frequency);
      vibratoGain.connect(osc2.frequency);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, t);
      filter.frequency.linearRampToValueAtTime(1400, t + 0.1);
      filter.Q.setValueAtTime(2, t);

      // ADSR包络
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(baseVol * 0.09, t + 0.08);  // Attack
      gain.gain.linearRampToValueAtTime(baseVol * 0.07, t + 0.15); // Decay
      gain.gain.setValueAtTime(baseVol * 0.07, t + note.d * 0.6);  // Sustain
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);   // Release

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(t);
      osc2.start(t);
      vibrato.start(t);
      osc1.stop(t + note.d);
      osc2.stop(t + note.d);
      vibrato.stop(t + note.d);

      this.mapBgmOscillators.push(osc1, osc2, vibrato);
      this.mapBgmGains.push(gain, filter, vibratoGain);
    });

    // ========== 4. 低音贝斯线（更厚实的低音） ==========
    const bassLine = [
      { f: 65.41, t: 0.0, d: 1.0 },   // C2
      { f: 65.41, t: 1.0, d: 0.5 },   // C2 短
      { f: 65.41, t: 1.5, d: 0.5 },   // C2
      { f: 51.91, t: 2.5, d: 1.0 },   // Ab1
      { f: 58.27, t: 3.5, d: 1.0 },   // Bb1
      { f: 65.41, t: 4.5, d: 1.0 },   // C2
      { f: 65.41, t: 5.5, d: 0.5 },   // C2 短
      { f: 65.41, t: 6.0, d: 0.5 },   // C2
      { f: 51.91, t: 7.0, d: 1.0 },   // Ab1
      { f: 58.27, t: 8.0, d: 1.0 },   // Bb1
      { f: 65.41, t: 9.0, d: 1.0 },   // C2
      { f: 65.41, t: 10.0, d: 0.5 },  // C2
      { f: 51.91, t: 10.5, d: 0.5 },  // Ab1
      { f: 43.65, t: 11.5, d: 1.5 },  // F1 延长
      { f: 65.41, t: 13.5, d: 1.0 },  // C2
      { f: 51.91, t: 14.5, d: 1.0 },  // Ab1
    ];
    bassLine.forEach(note => {
      const t = now + note.t;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.f, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, t);
      filter.Q.setValueAtTime(1.2, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(baseVol * 0.08, t + 0.06);
      gain.gain.setValueAtTime(baseVol * 0.07, t + note.d * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + note.d);
      this.mapBgmOscillators.push(osc);
      this.mapBgmGains.push(gain);
    });

    // ========== 5. 弦乐铺底（增加氛围感） ==========
    const padNotes = [
      { f: 130.81, t: 0.0, d: 8.0 },   // C3
      { f: 155.56, t: 4.0, d: 8.0 },   // Eb3
      { f: 110.00, t: 8.0, d: 8.0 },   // A2
    ];
    padNotes.forEach(note => {
      const t = now + note.t;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(note.f, t);
      osc2.frequency.setValueAtTime(note.f * 1.002, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, t);
      filter.Q.setValueAtTime(0.5, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(baseVol * 0.04, t + 1.5);
      gain.gain.setValueAtTime(baseVol * 0.04, t + note.d - 1.5);
      gain.gain.linearRampToValueAtTime(0, t + note.d);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + note.d);
      osc2.stop(t + note.d);
      this.mapBgmOscillators.push(osc1, osc2);
      this.mapBgmGains.push(gain);
    });

    // ========== 6. 环境音效（海浪 + 远处军号回声） ==========
    this._playAmbientNoise(baseVol * 0.06, duration, 'lowpass', 250, 0.4);

    // 远处军号回声（偶尔）
    const echoTimeout = setTimeout(() => {
      if (this.currentMapBGM === 'island' && this.mapBgmPlaying) {
        this._playDistantBugle(baseVol * 0.5);
      }
    }, 6000 + Math.random() * 6000);
    this.mapBgmTimeouts.push(echoTimeout);

    // ========== 7. 循环 ==========
    const loopTimeout = setTimeout(() => {
      if (this.currentMapBGM === 'island' && this.mapBgmPlaying) {
        this._playIslandBGM(baseVol);
      }
    }, duration * 1000 - 300);
    this.mapBgmTimeouts.push(loopTimeout);
  },

  // 远处军号回声效果
  _playDistantBugle(baseVol) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const notes = [
      { f: 523.25, d: 0.8 },
      { f: 523.25, d: 0.4 },
      { f: 622.25, d: 0.6 },
    ];
    notes.forEach((note, i) => {
      const t = now + i * 0.6;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const delay = ctx.createDelay();
      const delayGain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.f, t);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1500, t);
      filter.Q.setValueAtTime(3, t);

      // 主音
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(baseVol * 0.06, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      // 回声
      delay.delayTime.setValueAtTime(0.3, t);
      delayGain.gain.setValueAtTime(baseVol * 0.02, t);
      delayGain.gain.exponentialRampToValueAtTime(0.001, t + note.d + 0.5);

      osc.connect(filter);
      filter.connect(gain);
      filter.connect(delay);
      delay.connect(delayGain);
      gain.connect(ctx.destination);
      delayGain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + note.d + 0.5);
      this.mapBgmOscillators.push(osc);
      this.mapBgmGains.push(gain, delayGain);
    });
  },

  _playSeagull(baseVol) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(2200, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.4);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(baseVol * 0.04, now + 0.05);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  },

  // 沼泽BGM：低沉不和谐音 + 毒泡声 + 怪物低吼
  // 沼泽BGM：黑暗压抑的恐怖风格
  // 优先使用外部MP3，失败后回退到程序化合成
  _playSwampBGM(baseVol) {
    // 停止之前的外部音频
    if (this._swampExternalAudio) {
      try { this._swampExternalAudio.pause(); } catch(e) {}
      this._swampExternalAudio = null;
    }

    // 如果之前外部MP3加载失败过，直接使用程序化合成
    if (this._swampExternalFailed) {
      this._playSwampBGMProcedural(baseVol);
      return;
    }

    // 尝试加载外部MP3
    const audio = new Audio();
    audio.loop = true;
    audio.volume = baseVol;
    audio.src = 'audio/swamp_bgm.mp3';

    let externalStarted = false;
    const fallbackTimeout = setTimeout(() => {
      if (!externalStarted && this.currentMapBGM === 'swamp' && this.mapBgmPlaying) {
        this._swampExternalFailed = true;
        this._playSwampBGMProcedural(baseVol);
      }
    }, 5000);

    audio.oncanplaythrough = () => {
      if (this.currentMapBGM === 'swamp' && this.mapBgmPlaying) {
        audio.play().catch(() => {});
        this._swampExternalAudio = audio;
        externalStarted = true;
        clearTimeout(fallbackTimeout);
      }
    };

    audio.onerror = () => {
      if (!externalStarted && this.currentMapBGM === 'swamp' && this.mapBgmPlaying) {
        this._swampExternalFailed = true;
        clearTimeout(fallbackTimeout);
        this._playSwampBGMProcedural(baseVol);
      }
    };

    audio.load();
  },

  // 沼泽程序化合成BGM（回退方案）
  _playSwampBGMProcedural(baseVol) {
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const duration = 10;

    // 主音轨：低沉不和谐音（使用triangle+sine减少高频谐波电流感）
    const dissonantFreqs = [55, 58.27, 82.41, 87.31]; // 不和谐音程
    dissonantFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      // triangle谐波比sawtooth少，sine最纯净，配合低通滤波消除电流感
      osc.type = i < 2 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      // 低通滤波：截止频率设为基频的6倍，保留温暖感但去除刺耳高频
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 6, now);
      filter.Q.setValueAtTime(0.5, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(baseVol * 0.05, now + 1.5);
      gain.gain.linearRampToValueAtTime(baseVol * 0.04, now + duration);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
      this.mapBgmOscillators.push(osc);
      this.mapBgmGains.push(gain, filter);
    });

    // 毒泡破裂声（随机低频爆裂）
    const bubbleTimeout = setTimeout(() => {
      if (this.currentMapBGM === 'swamp' && this.mapBgmPlaying) {
        this._playBubblePop(baseVol);
      }
    }, 2000 + Math.random() * 4000);
    this.mapBgmTimeouts.push(bubbleTimeout);

    // 远处怪物低吼
    const growlTimeout = setTimeout(() => {
      if (this.currentMapBGM === 'swamp' && this.mapBgmPlaying) {
        this._playDistantGrowl(baseVol);
      }
    }, 5000 + Math.random() * 5000);
    this.mapBgmTimeouts.push(growlTimeout);

    const loopTimeout = setTimeout(() => {
      if (this.currentMapBGM === 'swamp' && this.mapBgmPlaying) {
        this._playSwampBGMProcedural(baseVol);
      }
    }, duration * 1000 - 200);
    this.mapBgmTimeouts.push(loopTimeout);
  },

  _playBubblePop(baseVol) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const len = Math.ceil(ctx.sampleRate * 0.3);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(baseVol * 0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  },

  // 捕鱼游戏BGM：轻快活泼的海洋风格
  playFishingBGM() {
    if (!this._initAudioContext()) return;
    this._clearMapBGM();
    this.mapBgmPlaying = true;
    this.currentMapBGM = 'fishing';

    const masterVol = (window.gameSettings ? window.gameSettings.masterVol : 70) / 100;
    const musicVol = (window.gameSettings ? window.gameSettings.musicVol : 30) / 100;
    const baseVol = 0.25 * masterVol * musicVol;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const duration = 12;

    // 轻快的琶音：G大调，营造活泼氛围
    const notes = [392.00, 493.88, 587.33, 783.99, 587.33, 493.88, 392.00, 587.33];
    notes.forEach((freq, i) => {
      const t = now + i * 0.4;
      // 主音
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2500, t);
      filter.Q.setValueAtTime(1.5, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(baseVol * 0.1, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(baseVol * 0.06, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.6);
      this.mapBgmOscillators.push(osc);
      this.mapBgmGains.push(gain);

      // 和声
      if (i % 2 === 0) {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 1.25, t);
        gain2.gain.setValueAtTime(0, t);
        gain2.gain.linearRampToValueAtTime(baseVol * 0.04, t + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(t);
        osc2.stop(t + 0.8);
        this.mapBgmOscillators.push(osc2);
        this.mapBgmGains.push(gain2);
      }
    });

    // 气泡音效（随机）
    const bubbleTimeout = setTimeout(() => {
      if (this.currentMapBGM === 'fishing' && this.mapBgmPlaying) {
        this._playBubblePop(baseVol * 0.5);
      }
    }, 3000 + Math.random() * 5000);
    this.mapBgmTimeouts.push(bubbleTimeout);

    // 循环
    const loopTimeout = setTimeout(() => {
      if (this.currentMapBGM === 'fishing' && this.mapBgmPlaying) {
        this.playFishingBGM();
      }
    }, duration * 1000 - 200);
    this.mapBgmTimeouts.push(loopTimeout);
  },

  _playDistantGrowl(baseVol) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(40, now);
    osc.frequency.linearRampToValueAtTime(35, now + 1.5);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(baseVol * 0.06, now + 0.3);
    gain.gain.linearRampToValueAtTime(0, now + 1.5);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.5);
  },

  // 城市BGM：激烈战斗节奏
  _playCityBGM(baseVol) {
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const duration = 8;

    // 紧张的节奏低音
    const bassNotes = [55, 65.41, 73.42, 55];
    bassNotes.forEach((freq, i) => {
      const t = now + i * 2;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(baseVol * 0.07, t + 0.1);
      gain.gain.linearRampToValueAtTime(0, t + 1.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 2);
      this.mapBgmOscillators.push(osc);
      this.mapBgmGains.push(gain);
    });

    // 高频紧张音
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + duration * 0.5);
    osc.frequency.linearRampToValueAtTime(440, now + duration);
    gain.gain.setValueAtTime(baseVol * 0.03, now);
    gain.gain.linearRampToValueAtTime(baseVol * 0.05, now + duration * 0.5);
    gain.gain.linearRampToValueAtTime(baseVol * 0.03, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
    this.mapBgmOscillators.push(osc);
    this.mapBgmGains.push(gain);

    const loopTimeout = setTimeout(() => {
      if (this.currentMapBGM === 'city' && this.mapBgmPlaying) {
        this._playCityBGM(baseVol);
      }
    }, duration * 1000 - 200);
    this.mapBgmTimeouts.push(loopTimeout);
  },

  // 雪山BGM：寒冷生存感
  _playSnowBGM(baseVol) {
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const duration = 14;

    // 寒冷的风声（粉红噪声高通）
    this._playAmbientNoise(baseVol * 0.25, duration, 'highpass', 800, 0.3);

    // 冰晶般的清脆音（提高音量）
    const iceNotes = [523.25, 659.25, 783.99, 1046.50];
    iceNotes.forEach((freq, i) => {
      const t = now + i * 3.5;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(baseVol * 0.12, t + 0.5);
      gain.gain.linearRampToValueAtTime(0, t + 2.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 3);
      this.mapBgmOscillators.push(osc);
      this.mapBgmGains.push(gain);
    });

    // 增加低沉的弦乐铺垫（营造寒冷氛围）
    const bassNotes = [130.81, 98.00, 110.00];
    bassNotes.forEach((freq, i) => {
      const t = now + i * 4.5;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(baseVol * 0.18, t + 1.0);
      gain.gain.linearRampToValueAtTime(0, t + 5.0);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 6);
      this.mapBgmOscillators.push(osc);
      this.mapBgmGains.push(gain);
    });

    const loopTimeout = setTimeout(() => {
      if (this.currentMapBGM === 'snow' && this.mapBgmPlaying) {
        this._playSnowBGM(baseVol);
      }
    }, duration * 1000 - 200);
    this.mapBgmTimeouts.push(loopTimeout);
  },

  // 沙漠BGM：炎热绝望感
  _playDesertBGM(baseVol) {
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const duration = 11;

    // 热风吹过（粉红噪声带通）
    this._playAmbientNoise(baseVol * 0.1, duration, 'bandpass', 400, 2);

    // 单调的绝望旋律
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(98, now + duration * 0.5);
    osc.frequency.linearRampToValueAtTime(87.31, now + duration);
    gain.gain.setValueAtTime(baseVol * 0.05, now);
    gain.gain.linearRampToValueAtTime(baseVol * 0.07, now + duration * 0.3);
    gain.gain.linearRampToValueAtTime(baseVol * 0.04, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
    this.mapBgmOscillators.push(osc);
    this.mapBgmGains.push(gain);

    const loopTimeout = setTimeout(() => {
      if (this.currentMapBGM === 'desert' && this.mapBgmPlaying) {
        this._playDesertBGM(baseVol);
      }
    }, duration * 1000 - 200);
    this.mapBgmTimeouts.push(loopTimeout);
  },

  _playAmbientNoise(baseVol, duration, filterType, filterFreq, filterQ) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const len = Math.ceil(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    // 粉红噪声
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, now);
    if (filterQ) filter.Q.setValueAtTime(filterQ, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(baseVol, now + 1);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + duration);
    this.mapBgmOscillators.push(src);
    this.mapBgmGains.push(gain);
  },

  _fadeOutMapBGM(callback) {
    const fadeDuration = 1.0;
    const ctx = this.audioCtx;
    if (!ctx) {
      this._clearMapBGM();
      if (callback) callback();
      return;
    }
    const now = ctx.currentTime;

    this.mapBgmGains.forEach(gain => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value || 0.001, now);
        gain.gain.linearRampToValueAtTime(0.001, now + fadeDuration);
      } catch (e) {}
    });

    setTimeout(() => {
      this._clearMapBGM();
      if (callback) callback();
    }, fadeDuration * 1000 + 100);
  },

  _clearMapBGM() {
    this.mapBgmTimeouts.forEach(id => clearTimeout(id));
    this.mapBgmTimeouts = [];
    this.mapBgmOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.mapBgmGains.forEach(gain => {
      try {
        gain.disconnect();
      } catch (e) {}
    });
    this.mapBgmOscillators = [];
    this.mapBgmGains = [];
    this.mapBgmPlaying = false;
    // 停止外部音频
    if (this._islandExternalAudio) {
      try { this._islandExternalAudio.pause(); } catch(e) {}
      this._islandExternalAudio = null;
    }
    if (this._swampExternalAudio) {
      try { this._swampExternalAudio.pause(); } catch(e) {}
      this._swampExternalAudio = null;
    }
  },

  stopMapBGM() {
    this.currentMapBGM = null;
    this._fadeOutMapBGM();
  },

  // --- 背景音乐 (程序化生成) ---
  startBackgroundMusic() {
    if (!this._initAudioContext() || this.bgMusicPlaying) return;
    // 如果有地图专用BGM在播放，不叠加背景氛围音
    if (this.mapBgmPlaying && this.currentMapBGM) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      this.bgMusicGain = this.audioCtx.createGain();
      this.bgMusicGain.gain.setValueAtTime(0.045, this.audioCtx.currentTime);
      this.bgMusicGain.connect(this.audioCtx.destination);
      this.bgMusicPlaying = true;
      this._playBackgroundLoop();
    } catch (e) {
      console.warn('[AudioSystem] Background music error:', e);
    }
  },

  _playBackgroundLoop() {
    if (!this.bgMusicPlaying || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const duration = 8;

    // 低沉的氛围音
    const osc1 = this.audioCtx.createOscillator();
    const gain1 = this.audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(55, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + duration * 0.5);
    gain1.gain.linearRampToValueAtTime(0.08, now + duration);
    osc1.connect(gain1);
    gain1.connect(this.bgMusicGain);
    osc1.start(now);
    osc1.stop(now + duration);
    this._bgMusicOscillators.push(osc1, gain1);

    // 第二层 - 缓慢变化的音调
    const osc2 = this.audioCtx.createOscillator();
    const gain2 = this.audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(110, now);
    osc2.frequency.linearRampToValueAtTime(130, now + duration * 0.5);
    osc2.frequency.linearRampToValueAtTime(110, now + duration);
    gain2.gain.setValueAtTime(0.04, now);
    gain2.gain.linearRampToValueAtTime(0.06, now + duration * 0.3);
    gain2.gain.linearRampToValueAtTime(0.04, now + duration);
    osc2.connect(gain2);
    gain2.connect(this.bgMusicGain);
    osc2.start(now);
    osc2.stop(now + duration);
    this._bgMusicOscillators.push(osc2, gain2);

    // 第三层 - 高频氛围
    const osc3 = this.audioCtx.createOscillator();
    const gain3 = this.audioCtx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(220, now);
    gain3.gain.setValueAtTime(0.02, now);
    gain3.gain.linearRampToValueAtTime(0.03, now + duration * 0.7);
    gain3.gain.linearRampToValueAtTime(0.02, now + duration);
    osc3.connect(gain3);
    gain3.connect(this.bgMusicGain);
    osc3.start(now);
    osc3.stop(now + duration);
    this._bgMusicOscillators.push(osc3, gain3);

    setTimeout(() => {
      if (this.bgMusicPlaying) this._playBackgroundLoop();
    }, duration * 1000 - 100);
  },

  stopBackgroundMusic() {
    this.bgMusicPlaying = false;
    if (this.bgMusicGain && this.audioCtx) {
      this.bgMusicGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.5);
    }
    // 停止 HTML5 Audio BGM
    if (this.bgmAudio) {
      try { this.bgmAudio.pause(); this.bgmAudio.currentTime = 0; } catch(e) {}
      this.bgmAudio = null;
    }
    // 停止天气 BGM
    if (this.weatherBGM.audio) {
      try { this.weatherBGM.audio.pause(); this.weatherBGM.audio.currentTime = 0; } catch(e) {}
      this.weatherBGM.audio = null;
    }
    if (this.weatherBGM.oldAudio) {
      try { this.weatherBGM.oldAudio.pause(); } catch(e) {}
      this.weatherBGM.oldAudio = null;
    }
    this.weatherBGM.current = 'normal';
    // 停止地图BGM
    this.stopMapBGM();
  },

  setMusicVolume(vol) {
    const masterVol = (window.gameSettings ? window.gameSettings.masterVol : 70) / 100;
    const musicVol = (window.gameSettings ? window.gameSettings.musicVol : 30) / 100;
    const finalVol = vol * 0.2 * masterVol * musicVol;
    if (this.bgMusicGain && this.audioCtx) {
      this.bgMusicGain.gain.setValueAtTime(finalVol, this.audioCtx.currentTime);
    }
  },

  // --- HTML5 Audio BGM (更可靠的循环播放) ---
  playBGM() {
    // 如果当前不是城市地图，播放对应的地图BGM而非城市BGM
    if (window.currentMap && window.currentMap !== 'city') {
      if (this.mapBGM[window.currentMap]) {
        console.log('[AudioSystem] playBGM -> currentMap=' + window.currentMap + ', delegating to playMapBGM');
        this.playMapBGM(window.currentMap);
        return;
      }
    }
    if (typeof BGM_DATA === 'undefined') {
      console.error('[AudioSystem] BGM_DATA not defined');
      return;
    }
    // 防重复：如果已有BGM在播放，先渐出再播放新的
    if (this.bgmAudio && !this.bgmAudio.ended && !this.bgmAudio.paused) {
      console.log('[AudioSystem] BGM already playing, fading out first');
      this._fadeOutBGM(() => this._doPlayBGM());
      return;
    }
    this._doPlayBGM();
  },

  _doPlayBGM() {
    console.log('[AudioSystem] BGM_DATA size:', (BGM_DATA.length / 1024).toFixed(1), 'KB');
    try {
      if (this.bgmAudio) {
        try { this.bgmAudio.pause(); this.bgmAudio = null; } catch(e) {}
      }
      this.bgmAudio = new Audio(BGM_DATA);
      this.bgmAudio.loop = true;
      const masterVol = (window.gameSettings ? window.gameSettings.masterVol : 70) / 100;
      const musicVol = (window.gameSettings ? window.gameSettings.musicVol : 30) / 100;
      const targetVol = 0.3 * masterVol * musicVol;
      this.bgmAudio.volume = 0; // 从0开始渐入

      this.bgmAudio.addEventListener('canplay', () => {
        console.log('[AudioSystem] BGM can play');
      });
      this.bgmAudio.addEventListener('playing', () => {
        console.log('[AudioSystem] BGM playing, currentTime:', this.bgmAudio.currentTime);
      });
      this.bgmAudio.addEventListener('error', (e) => {
        console.error('[AudioSystem] BGM error:', e.target.error ? e.target.error.code : 'unknown');
      });

      const playPromise = this.bgmAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          // 渐入
          this._fadeInBGM(targetVol);
          console.log('[AudioSystem] BGM playing successfully, volume:', targetVol);
        }).catch((err) => {
          console.warn('[AudioSystem] BGM play failed:', err.name, err.message);
          document.addEventListener('click', function playBGMOnClick() {
            console.log('[AudioSystem] Retrying BGM after user click...');
            if (AudioSystem.bgmAudio) {
              AudioSystem.bgmAudio.play().then(() => {
                console.log('[AudioSystem] BGM playing after user interaction');
                document.removeEventListener('click', playBGMOnClick);
              }).catch((e) => console.warn('[AudioSystem] BGM still failed:', e.message));
            }
          }, { once: true });
        });
      }
    } catch(e) {
      console.error('[AudioSystem] BGM load failed:', e.message);
    }
  },

  _fadeInBGM(targetVol, step = 0.02, interval = 50) {
    if (!this.bgmAudio) return;
    const fade = setInterval(() => {
      if (!this.bgmAudio) { clearInterval(fade); return; }
      this.bgmAudio.volume = Math.min(targetVol, this.bgmAudio.volume + step);
      if (this.bgmAudio.volume >= targetVol) clearInterval(fade);
    }, interval);
  },

  _fadeOutBGM(callback, step = 0.03, interval = 50) {
    if (!this.bgmAudio) {
      if (callback) callback();
      return;
    }
    const fade = setInterval(() => {
      if (!this.bgmAudio) { clearInterval(fade); if (callback) callback(); return; }
      this.bgmAudio.volume = Math.max(0, this.bgmAudio.volume - step);
      if (this.bgmAudio.volume <= 0) {
        try { this.bgmAudio.pause(); } catch(e) {}
        this.bgmAudio = null;
        clearInterval(fade);
        if (callback) callback();
      }
    }, interval);
  },

  stopBGM() {
    this._fadeOutBGM();
  },

  // --- 天气背景音乐切换 ---
  switchWeatherMusic(bgmType) {
    console.log('[AudioSystem] Switching weather BGM to:', bgmType);
    if (this.weatherBGM.current === bgmType && this.weatherBGM.audio) {
      return;
    }
    this.weatherBGM.current = bgmType;

    if (bgmType === 'normal' || bgmType === 'clear') {
      // 如果有地图专用BGM在播放，不恢复城市BGM
      // 或者当前地图不是城市（海岛/沼泽/雪山等），也不恢复城市BGM
      if (
        (this.mapBgmPlaying && this.currentMapBGM) ||
        (window.currentMap && window.currentMap !== 'city' && window.currentMap !== 'desert')
      ) {
        // 只停止天气音效，不干扰地图BGM
        if (this.weatherBGM.audio) {
          this.weatherBGM.audio.pause();
          this.weatherBGM.audio = null;
        }
        return;
      }
      if (this.bgmAudio && this.bgmAudio.paused) {
        const masterVol = (window.gameSettings ? window.gameSettings.masterVol : 70) / 100;
        const musicVol = (window.gameSettings ? window.gameSettings.musicVol : 30) / 100;
        this.bgmAudio.volume = 0.3 * masterVol * musicVol;
        this.bgmAudio.play().catch(e => console.warn('[AudioSystem] BGM resume failed:', e));
      }
      if (this.weatherBGM.audio) {
        this.weatherBGM.audio.pause();
        this.weatherBGM.audio = null;
      }
      return;
    } else {
      if (this.bgmAudio && !this.bgmAudio.paused) {
        this.bgmAudio.pause();
      }
    }

    if (typeof WEATHER_BGM_DATA === 'undefined' || !WEATHER_BGM_DATA[bgmType]) {
      console.warn('[AudioSystem] No weather BGM data for:', bgmType);
      return;
    }

    const oldAudio = this.weatherBGM.audio;
    this.weatherBGM.oldAudio = oldAudio;

    try {
      this.weatherBGM.audio = new Audio(WEATHER_BGM_DATA[bgmType]);
      this.weatherBGM.audio.loop = true;
      this.weatherBGM.audio.volume = 0;

      const masterVol = (window.gameSettings ? window.gameSettings.masterVol : 70) / 100;
      const musicVol = (window.gameSettings ? window.gameSettings.musicVol : 30) / 100;
      const targetVolume = 0.3 * masterVol * musicVol;

      this.weatherBGM.audio.play().then(() => {
        let fadeIn = setInterval(() => {
          if (!this.weatherBGM.audio) { clearInterval(fadeIn); return; }
          this.weatherBGM.audio.volume = Math.min(targetVolume, this.weatherBGM.audio.volume + 0.02);
          if (this.weatherBGM.audio.volume >= targetVolume) { clearInterval(fadeIn); }
        }, 50);
      });

      if (oldAudio) {
        let fadeOut = setInterval(() => {
          if (!this.weatherBGM.oldAudio) { clearInterval(fadeOut); return; }
          this.weatherBGM.oldAudio.volume = Math.max(0, this.weatherBGM.oldAudio.volume - 0.02);
          if (this.weatherBGM.oldAudio.volume <= 0) {
            this.weatherBGM.oldAudio.pause();
            this.weatherBGM.oldAudio = null;
            clearInterval(fadeOut);
          }
        }, 50);
      }
    } catch(e) {
      console.error('[AudioSystem] Weather BGM switch failed:', e);
    }
  },

  // --- 预加载音效 ---
  preloadSounds() {
    if (typeof EMBEDDED_SOUNDS === 'undefined') return;
    Object.keys(EMBEDDED_SOUNDS).forEach(type => {
      try {
        var binaryStr = atob(EMBEDDED_SOUNDS[type].split(',')[1]);
        var bytes = new Uint8Array(binaryStr.length);
        for (var i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        var buf = bytes.buffer;
        this.audioCtx.decodeAudioData(buf, (decoded) => {
          this.soundBuffers[type] = decoded;
          console.log('[AudioSystem] Loaded:', type, '(' + Math.round(decoded.duration * 1000) + 'ms)');
        }, (err) => {
          console.warn('[AudioSystem] Decode failed:', type, err);
        });
      } catch(e) {
        console.warn('[AudioSystem] Load failed:', type, e.message);
      }
    });
  },

  // --- 主音效播放 ---
  playSound(type, volumeScale = 1.0) {
    // 双轨并行：同时调用新 SoundSystem（如果存在）
    if (window.SoundSystem) {
      try { SoundSystem.play(type, volumeScale); } catch (e) {}
    }

    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        console.log('[AudioSystem] AudioContext created');
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
        console.log('[AudioSystem] AudioContext resumed');
      }
      if (!this.masterGain || !this.masterGain.context || this.masterGain.context !== this.audioCtx) {
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.connect(this.audioCtx.destination);
      }
      const masterVol = (window.gameSettings ? window.gameSettings.masterVol : 70) / 100;
      const sfxVol = (window.gameSettings ? window.gameSettings.sfxVol : 80) / 100;
      this.masterGain.gain.setValueAtTime(2.0 * masterVol * sfxVol, this.audioCtx.currentTime);
    } catch(e) {
      return;
    }

    const USE_PROGRAMMATIC_SOUNDS = ['zombie_die', 'zombie_die_fast', 'zombie_die_fat',
      'zombie_die_ranged', 'zombie_die_explode', 'zombie_die_elite', 'zombie_die_poison',
      'zombie_die_stealth'];

    // 优先使用预加载的外部音效
    if (this.soundBuffers[type] && !USE_PROGRAMMATIC_SOUNDS.includes(type)) {
      try {
        var src = this.audioCtx.createBufferSource();
        src.buffer = this.soundBuffers[type];
        var gain = this.audioCtx.createGain();
        const masterVol = (window.gameSettings ? window.gameSettings.masterVol : 70) / 100;
        const sfxVol = (window.gameSettings ? window.gameSettings.sfxVol : 80) / 100;
        gain.gain.setValueAtTime(2.0 * volumeScale * masterVol * sfxVol, this.audioCtx.currentTime);

        if (type === 'zombie_hit') {
          var filter = this.audioCtx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1500, this.audioCtx.currentTime);
          filter.Q.setValueAtTime(1, this.audioCtx.currentTime);
          src.connect(filter);
          filter.connect(gain);
          gain.connect(this.audioCtx.destination);
        } else {
          src.connect(gain);
          gain.connect(this.audioCtx.destination);
        }

        if (type === 'zombie_hit' && src.buffer.duration > 0.8) {
          src.start(0, 0, 0.8);
        } else {
          src.start();
        }
        return;
      } catch(e) {
        console.warn('[AudioSystem] Play error:', type, e.message);
      }
    }

    // 程序生成音效
    this._playProgrammaticSound(type, volumeScale);
  },

  _playProgrammaticSound(type, volumeScale) {
    const now = this.audioCtx.currentTime;
    const masterVol = (window.gameSettings ? window.gameSettings.masterVol : 70) / 100;
    const sfxVol = (window.gameSettings ? window.gameSettings.sfxVol : 80) / 100;
    var progGain = this.audioCtx.createGain();
    progGain.gain.setValueAtTime(volumeScale * masterVol * sfxVol, now);
    progGain.connect(this.masterGain);
    var dest = progGain;

    const makeNoise = (dur, pink) => {
      var len = Math.max(1, Math.ceil(this.audioCtx.sampleRate * dur));
      var buf = this.audioCtx.createBuffer(1, len, this.audioCtx.sampleRate);
      var data = buf.getChannelData(0);
      if (pink) {
        var b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
        for (var i=0;i<len;i++) {
          var w = Math.random()*2-1;
          b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
          b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
          b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
          data[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11;
          b6=w*0.115926;
        }
      } else {
        for (var i=0;i<len;i++) data[i]=Math.random()*2-1;
      }
      return buf;
    };

    const playBuf = (buf, filterType, filterFreq, filterQ, vol, dur, delay) => {
      var t = now + (delay || 0);
      var src = this.audioCtx.createBufferSource();
      src.buffer = buf;
      var gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.002);
      gain.gain.linearRampToValueAtTime(0.001, t + dur);
      if (filterType) {
        var flt = this.audioCtx.createBiquadFilter();
        flt.type = filterType;
        flt.frequency.setValueAtTime(Math.max(20, filterFreq), t);
        if (filterQ) flt.Q.setValueAtTime(filterQ, t);
        src.connect(flt);
        flt.connect(gain);
      } else {
        src.connect(gain);
      }
      gain.connect(dest);
      src.start(t);
      src.stop(t + dur + 0.01);
    };

    const playTone = (freq, endFreq, oscType, vol, dur, delay) => {
      var t = now + (delay || 0);
      var osc = this.audioCtx.createOscillator();
      osc.type = oscType || 'sine';
      osc.frequency.setValueAtTime(Math.max(20, freq), t);
      if (endFreq) osc.frequency.linearRampToValueAtTime(Math.max(20, endFreq), t + dur);
      var gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.001);
      gain.gain.linearRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + dur + 0.01);
    };

    try {
      switch(type) {
        case 'pistol':
          playTone(350, 180, 'sine', 0.7, 0.015);
          playBuf(makeNoise(0.15, true), 'lowpass', 400, null, 0.85, 0.12);
          playTone(60, 30, 'sine', 0.9, 0.08);
          playTone(280, 140, 'triangle', 0.2, 0.04, 0.06);
          break;
        case 'smg':
          playTone(380, 200, 'sine', 0.6, 0.008);
          playBuf(makeNoise(0.12, true), 'lowpass', 350, null, 0.75, 0.1);
          playTone(70, 35, 'sine', 0.7, 0.05);
          playTone(320, 160, 'triangle', 0.15, 0.03, 0.04);
          break;
        case 'rifle':
          playTone(280, 140, 'sine', 0.85, 0.012);
          playBuf(makeNoise(0.25, true), 'lowpass', 280, null, 0.95, 0.2);
          playTone(45, 22, 'sine', 1.1, 0.1);
          playTone(350, 175, 'triangle', 0.22, 0.06, 0.08);
          playBuf(makeNoise(0.15, true), 'lowpass', 200, null, 0.3, 0.15, 0.12);
          break;
        case 'shotgun':
          playTone(180, 90, 'sine', 1.1, 0.02);
          playBuf(makeNoise(0.4, true), 'lowpass', 180, null, 1.0, 0.35);
          playTone(40, 20, 'sine', 1.4, 0.15);
          playTone(300, 150, 'triangle', 0.25, 0.08, 0.08);
          playBuf(makeNoise(0.2, true), 'lowpass', 150, null, 0.4, 0.2, 0.15);
          break;
        case 'sniper':
          playTone(200, 100, 'sine', 1.0, 0.015);
          playBuf(makeNoise(0.5, true), 'lowpass', 150, null, 1.0, 0.4);
          playTone(35, 18, 'sine', 1.5, 0.15);
          playBuf(makeNoise(0.35, true), 'lowpass', 180, null, 0.6, 0.3, 0.1);
          playBuf(makeNoise(0.25, true), 'lowpass', 120, null, 0.35, 0.25, 0.25);
          break;
        case 'reload':
          playTone(1000, 600, 'square', 0.6, 0.008);
          playBuf(makeNoise(0.015, false), 'bandpass', 3500, 2, 0.5, 0.01);
          playBuf(makeNoise(0.08, false), 'bandpass', 1200, 1, 0.7, 0.12, 0.05);
          playBuf(makeNoise(0.04, true), 'lowpass', 400, null, 0.6, 0.05, 0.08);
          playBuf(makeNoise(0.06, false), 'bandpass', 800, 1.5, 0.5, 0.08, 0.25);
          playTone(800, 400, 'square', 0.8, 0.015, 0.35);
          playBuf(makeNoise(0.02, false), 'bandpass', 5000, 3, 0.9, 0.02, 0.35);
          playBuf(makeNoise(0.03, true), 'lowpass', 300, null, 0.7, 0.04, 0.36);
          playBuf(makeNoise(0.05, false), 'bandpass', 600, 1, 0.4, 0.06, 0.50);
          playTone(600, 200, 'square', 1.0, 0.025, 0.58);
          playBuf(makeNoise(0.04, false), 'bandpass', 2500, 2, 0.8, 0.03, 0.58);
          playBuf(makeNoise(0.05, true), 'lowpass', 250, null, 0.9, 0.05, 0.59);
          playTone(200, 100, 'sine', 0.6, 0.04, 0.60);
          playBuf(makeNoise(0.03, false), 'bandpass', 1500, 1, 0.3, 0.04, 0.65);
          break;
        case 'footstep':
          playBuf(makeNoise(0.04, true), 'bandpass', 300, 1.2, 0.65, 0.02);
          playTone(70, 35, 'sine', 0.5, 0.06);
          playBuf(makeNoise(0.05, true), 'bandpass', 600, 1.5, 0.18, 0.03, 0.003);
          break;
        case 'zombie_hit':
          playBuf(makeNoise(0.15, true), 'lowpass', 400, null, 0.9, 0.12);
          playTone(80, 40, 'sawtooth', 0.6, 0.1);
          playTone(120, 60, 'sine', 0.4, 0.08, 0.03);
          break;
        case 'zombie_die':
          playTone(45, 35, 'sawtooth', 0.7, 0.4);
          playTone(90, 45, 'sine', 0.5, 0.35, 0.05);
          playBuf(makeNoise(0.5, true), 'bandpass', 180, 1.5, 0.5, 0.45);
          playTone(55, 25, 'triangle', 0.4, 0.3, 0.15);
          break;
        case 'zombie_die_fast':
          playTone(350, 150, 'sawtooth', 0.6, 0.18);
          playTone(180, 80, 'sine', 0.5, 0.15, 0.05);
          playBuf(makeNoise(0.2, true), 'highpass', 600, null, 0.5, 0.15);
          playTone(70, 35, 'triangle', 0.5, 0.2, 0.1);
          break;
        case 'zombie_die_fat':
          playTone(30, 18, 'sine', 1.5, 0.35);
          playBuf(makeNoise(0.6, true), 'lowpass', 150, null, 1.0, 0.4);
          playTone(50, 25, 'sawtooth', 0.9, 0.3, 0.15);
          playTone(80, 40, 'triangle', 0.6, 0.25, 0.25);
          playBuf(makeNoise(0.3, true), 'lowpass', 100, null, 0.6, 0.3, 0.35);
          break;
        case 'zombie_die_ranged':
          playTone(150, 70, 'sawtooth', 0.5, 0.15);
          playBuf(makeNoise(0.25, true), 'bandpass', 500, 2.5, 0.45, 0.18);
          playTone(100, 50, 'sine', 0.4, 0.2, 0.1);
          playTone(60, 30, 'triangle', 0.5, 0.15, 0.15);
          break;
        case 'zombie_die_explode':
          playTone(200, 100, 'sawtooth', 0.7, 0.12);
          playTone(120, 60, 'sine', 0.5, 0.1, 0.05);
          (function(delayedNow) {
            playBuf(makeNoise(0.7, true), 'lowpass', 350, null, 1.0, 0.35, 0.12);
            playTone(40, 18, 'sine', 1.6, 0.3, 0.12);
            playBuf(makeNoise(0.4, true), 'lowpass', 200, null, 0.7, 0.3, 0.22);
          })(now);
          break;
        case 'zombie_die_elite':
          playTone(80, 35, 'sawtooth', 1.0, 0.45);
          playTone(160, 70, 'sine', 0.6, 0.35, 0.1);
          playBuf(makeNoise(0.4, true), 'lowpass', 250, null, 0.8, 0.35);
          playTone(55, 25, 'triangle', 0.8, 0.3, 0.2);
          playBuf(makeNoise(0.5, true), 'lowpass', 150, null, 0.6, 0.35, 0.3);
          break;
        case 'zombie_die_poison':
          playBuf(makeNoise(0.35, true), 'bandpass', 350, 3, 0.5, 0.22);
          playTone(120, 55, 'sawtooth', 0.4, 0.18);
          playTone(180, 90, 'sine', 0.3, 0.15, 0.08);
          playBuf(makeNoise(0.25, true), 'highpass', 800, null, 0.35, 0.15, 0.15);
          playTone(70, 35, 'triangle', 0.5, 0.2, 0.2);
          break;
        case 'zombie_die_stealth':
          playTone(450, 220, 'sine', 0.35, 0.25);
          playTone(300, 150, 'triangle', 0.25, 0.2, 0.1);
          playBuf(makeNoise(0.35, true), 'highpass', 500, null, 0.4, 0.3);
          playTone(200, 100, 'sine', 0.2, 0.25, 0.2);
          playTone(150, 75, 'triangle', 0.15, 0.2, 0.3);
          break;
        case 'zombie_growl':
          playTone(35 + Math.random()*10, 28, 'sawtooth', 0.55, 0.45);
          playTone(70 + Math.random()*15, 35, 'sine', 0.4, 0.4, 0.05);
          playBuf(makeNoise(0.55, true), 'bandpass', 200, 1.2, 0.35, 0.5);
          playTone(50, 25, 'triangle', 0.3, 0.3, 0.15);
          break;
        case 'zombie_attack':
          playTone(55, 35, 'sawtooth', 0.8, 0.25);
          playTone(110, 55, 'sine', 0.5, 0.2, 0.05);
          playBuf(makeNoise(0.3, true), 'bandpass', 280, 1.5, 0.5, 0.28);
          playTone(80, 40, 'triangle', 0.4, 0.18, 0.1);
          break;
        case 'crit_hit':
          playBuf(makeNoise(0.08, false), 'bandpass', 2500, 3, 0.75, 0.05);
          playTone(2000, 1200, 'sine', 0.55, 0.06);
          break;
        case 'player_hit':
          playBuf(makeNoise(0.25, true), 'lowpass', 350, null, 0.9, 0.18);
          playTone(120, 60, 'sawtooth', 0.65, 0.12);
          playTone(160, 80, 'square', 0.4, 0.1, 0.04);
          break;
        case 'explosion':
          playBuf(makeNoise(0.5, true), 'lowpass', 350, null, 0.95, 0.4);
          playTone(45, 20, 'sine', 1.3, 0.25);
          playBuf(makeNoise(0.3, true), 'lowpass', 200, null, 0.5, 0.3, 0.1);
          break;
        case 'grenade_throw':
          playBuf(makeNoise(0.04, false), 'bandpass', 3500, 6, 0.55, 0.03);
          playTone(2800, 1200, 'sine', 0.35, 0.025);
          playBuf(makeNoise(0.03, false), 'bandpass', 2200, 4, 0.45, 0.02, 0.04);
          playTone(1200, 600, 'triangle', 0.25, 0.02, 0.045);
          playBuf(makeNoise(0.12, true), 'highpass', 1500, null, 0.3, 0.15, 0.08);
          playTone(400, 150, 'sine', 0.25, 0.12, 0.08);
          playBuf(makeNoise(0.08, true), 'bandpass', 800, 2, 0.2, 0.1, 0.12);
          break;
        case 'grenade_explode':
          playTone(150, 30, 'sawtooth', 1.4, 0.04);
          playBuf(makeNoise(0.8, true), 'lowpass', 600, null, 1.0, 0.15);
          playTone(80, 20, 'square', 1.2, 0.08, 0.02);
          playBuf(makeNoise(0.6, true), 'lowpass', 400, null, 0.9, 0.25, 0.05);
          playBuf(makeNoise(0.3, true), 'bandpass', 2500, 3, 0.5, 0.15, 0.08);
          playTone(600, 200, 'triangle', 0.4, 0.12, 0.1);
          playBuf(makeNoise(0.2, true), 'lowpass', 300, null, 0.35, 0.2, 0.18);
          playTone(100, 40, 'sine', 0.3, 0.15, 0.22);
          break;
        case 'upgrade':
          playTone(523.25, 523.25, 'sine', 0.28, 0.07);
          playTone(659.25, 659.25, 'sine', 0.28, 0.07, 0.07);
          playTone(783.99, 783.99, 'sine', 0.28, 0.08, 0.14);
          break;
        case 'level_up':
          playTone(523.25, 523.25, 'sine', 0.32, 0.09);
          playTone(659.25, 659.25, 'sine', 0.32, 0.09, 0.09);
          playTone(783.99, 783.99, 'sine', 0.32, 0.09, 0.18);
          playTone(1046.50, 1046.50, 'sine', 0.32, 0.18, 0.27);
          break;
        case 'pickup':
          playTone(880, 880, 'sine', 0.22, 0.035);
          playTone(1100, 1100, 'sine', 0.22, 0.035, 0.035);
          playTone(1320, 1320, 'sine', 0.22, 0.06, 0.07);
          break;
        case 'ally_shoot':
          playBuf(makeNoise(0.08, true), 'lowpass', 700, null, 0.4, 0.08);
          break;
      }
    } catch(e) {
      console.warn('[AudioSystem] Error playing programmatic sound:', type, e.message || e);
    }
  },

  // --- 噪声播放 ---
  playNoise(volume, duration) {
    const bufferSize = this.audioCtx.sampleRate * duration;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.audioCtx.createGain();
    noiseGain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
    noise.connect(noiseGain);
    noiseGain.connect(this.audioCtx.destination);
    noise.start();
  },

  // --- 便捷方法 ---
  playShootSound(weaponType) {
    this.playSound(weaponType, 1.0);
  },
  playExplosionSound() {
    this.playSound('explosion', 1.0);
  },
  playHitSound() {
    this.playSound('zombie_hit', 1.0);
  },
  playPowerUpSound() {
    this.playSound('pickup', 1.0);
  },
  playEnemyDeathSound(enemyType) {
    const soundMap = {
      'fast': 'zombie_die_fast',
      'fat': 'zombie_die_fat',
      'ranged': 'zombie_die_ranged',
      'explode': 'zombie_die_explode',
      'elite': 'zombie_die_elite',
      'poison': 'zombie_die_poison',
      'stealth': 'zombie_die_stealth'
    };
    this.playSound(soundMap[enemyType] || 'zombie_die', 1.0);
  },
  playAlertSound() {
    this.playSound('zombie_growl', 0.7);
  },
  playClickSound() {
    this.playSound('pickup', 0.5);
  }
};

// 暴露到全局
window.AudioSystem = AudioSystem;
