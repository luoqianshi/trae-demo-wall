export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.volume = 1;
    this.muted = false;
  }

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.ctx.destination);

    // Resume context on first user interaction
    const resumeHandler = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      document.removeEventListener('click', resumeHandler);
      document.removeEventListener('touchstart', resumeHandler);
      document.removeEventListener('keydown', resumeHandler);
    };
    document.addEventListener('click', resumeHandler);
    document.addEventListener('touchstart', resumeHandler);
    document.addEventListener('keydown', resumeHandler);
  }

  playSound(type) {
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    switch (type) {
      case 'shoot':
        this._playTone(440, 0.05, 'square', 0.3);
        break;
      case 'sun_collect':
        this._playTone(880, 0.1, 'sine', 0.4);
        break;
      case 'plant':
        this._playTone(200, 0.08, 'triangle', 0.5);
        break;
      case 'explosion':
        this._playNoise(0.2, 0.6);
        break;
      case 'zombie_die':
        this._playTone(100, 0.15, 'sawtooth', 0.4);
        break;
      case 'chomp':
        this._playTone(300, 0.06, 'square', 0.3);
        break;
      case 'freeze':
        this._playSweep(1200, 600, 0.1, 'sine', 0.4);
        break;
      case 'hybrid':
        this._playSweep(440, 880, 0.3, 'sine', 0.4);
        break;
      case 'boss_alert':
        this._playAlternating(440, 550, 0.5, 'square', 0.5);
        break;
      case 'coin':
        this._playTone(1400, 0.05, 'sine', 0.3);
        break;
    }
  }

  _playTone(frequency, duration, waveType, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = waveType || 'sine';
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(volume * this.volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }

  _playSweep(startFreq, endFreq, duration, waveType, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = waveType || 'sine';
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

    gain.gain.setValueAtTime(volume * this.volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }

  _playNoise(duration, volume) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * this.volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    source.connect(gain);
    gain.connect(this.masterGain);

    source.start(this.ctx.currentTime);
    source.stop(this.ctx.currentTime + duration);
  }

  _playAlternating(freq1, freq2, duration, waveType, volume) {
    const halfDuration = duration / 2;
    const iterations = 4;
    const iterDuration = duration / iterations;

    for (let i = 0; i < iterations; i++) {
      const freq = i % 2 === 0 ? freq1 : freq2;
      const startTime = this.ctx.currentTime + i * iterDuration;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = waveType || 'square';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(volume * this.volume, startTime);
      gain.gain.setValueAtTime(0.001, startTime + iterDuration * 0.9);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + iterDuration);
    }
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
    }
  }

  mute() {
    this.muted = true;
    if (this.masterGain) {
      this.masterGain.gain.value = 0;
    }
  }

  unmute() {
    this.muted = false;
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  isMuted() {
    return this.muted;
  }

  getVolume() {
    return this.volume;
  }
}
