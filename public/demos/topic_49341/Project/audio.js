const AudioManager = {
  audioContext: null,
  bgmOscillators: [],
  bgmGain: null,
  sfxGain: null,
  isPlaying: false,
  currentBgm: null,
  settings: {
    audioEnabled: true,
    bgmVolume: 0.15,
    sfxVolume: 0.3
  },

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.bgmGain = this.audioContext.createGain();
      this.bgmGain.gain.value = this.settings.bgmVolume;
      this.bgmGain.connect(this.audioContext.destination);
      
      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = this.settings.sfxVolume;
      this.sfxGain.connect(this.audioContext.destination);
      
      const savedSettings = Storage.loadSettings();
      this.settings = { ...this.settings, ...savedSettings };
      this.updateVolumes();
    } catch (e) {
      console.warn('Web Audio not supported:', e);
      this.settings.audioEnabled = false;
    }
  },

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  },

  updateVolumes() {
    if (this.bgmGain) {
      this.bgmGain.gain.value = this.settings.audioEnabled ? this.settings.bgmVolume : 0;
    }
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.settings.audioEnabled ? this.settings.sfxVolume : 0;
    }
  },

  setBgmVolume(volume) {
    this.settings.bgmVolume = volume;
    this.updateVolumes();
    Storage.saveSettings(this.settings);
  },

  setSfxVolume(volume) {
    this.settings.sfxVolume = volume;
    this.updateVolumes();
    Storage.saveSettings(this.settings);
  },

  toggleMute() {
    this.settings.audioEnabled = !this.settings.audioEnabled;
    this.updateVolumes();
    Storage.saveSettings(this.settings);
    return this.settings.audioEnabled;
  },

  playBGM(type) {
    if (!this.audioContext || !this.settings.audioEnabled) return;
    
    this.stopBGM();
    this.currentBgm = type;
    this.isPlaying = true;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    if (type === 'home') {
      this._createAmbientBGM([220, 277, 330], 1.5, 0.08);
    } else if (type === 'school') {
      this._createAmbientBGM([330, 392, 440, 523], 2, 0.06);
    } else if (type === 'people') {
      this._createAmbientBGM([392, 494, 587, 659], 1.8, 0.1);
    }
  },

  _createAmbientBGM(frequencies, interval, noteDuration) {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    
    const playNextNote = () => {
      if (!this.isPlaying || this.currentBgm !== (frequencies[0] === 220 ? 'home' : frequencies[0] === 330 ? 'school' : 'people')) {
        return;
      }
      
      const freq = frequencies[Math.floor(Math.random() * frequencies.length)];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.5);
      gain.gain.linearRampToValueAtTime(0, now + noteDuration);
      
      osc.connect(gain);
      gain.connect(this.bgmGain);
      
      osc.start(now);
      osc.stop(now + noteDuration + 0.2);
      
      this.bgmOscillators.push(osc);
      
      setTimeout(() => {
        const index = this.bgmOscillators.indexOf(osc);
        if (index > -1) this.bgmOscillators.splice(index, 1);
      }, (noteDuration + 0.5) * 1000);
      
      setTimeout(playNextNote, interval * 1000 + Math.random() * 1000);
    };
    
    setTimeout(playNextNote, 500);
  },

  stopBGM() {
    this.isPlaying = false;
    this.currentBgm = null;
    this.bgmOscillators.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    this.bgmOscillators = [];
  },

  playSFX(type) {
    if (!this.audioContext || !this.settings.audioEnabled) return;
    this.resume();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    if (type === 'page') {
      this._playPageTurn(now);
    } else if (type === 'positive') {
      this._playChime(now);
    } else if (type === 'negative') {
      this._playLowPiano(now);
    } else if (type === 'click') {
      this._playClick(now);
    } else if (type === 'transition') {
      this._playTransition(now);
    }
  },

  _playPageTurn(now) {
    const ctx = this.audioContext;
    const noise = ctx.createBufferSource();
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    
    const gain = ctx.createGain();
    gain.gain.value = 0.2;
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    
    noise.start(now);
    noise.stop(now + 0.15);
  },

  _playChime(now) {
    const ctx = this.audioContext;
    const frequencies = [523.25, 659.25, 783.99];
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = now + i * 0.08;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start(startTime);
      osc.stop(startTime + 1.3);
    });
  },

  _playLowPiano(now) {
    const ctx = this.audioContext;
    const frequencies = [293.66, 220];
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      const startTime = now + i * 0.15;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start(startTime);
      osc.stop(startTime + 1.6);
    });
  },

  _playClick(now) {
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 800;
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.12);
  },

  _playTransition(now) {
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.8);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.2);
    gain.gain.linearRampToValueAtTime(0, now + 0.8);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.9);
  }
};
