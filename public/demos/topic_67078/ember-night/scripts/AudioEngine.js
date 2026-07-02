/**
 * AudioEngine — Web Audio API 音频管理
 * 支持多层音频混合、淡入淡出、主音量控制
 */
class AudioEngine {
  static ctx = null;
  static masterGain = null;
  static layers = {};
  static isResumed = false;

  static init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.6;
  }

  static async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.isResumed = true;
  }

  static async load(name, url) {
    try {
      const response = await fetch(url);
      if (!response.ok) return;
      const buffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(buffer);
      this.layers[name] = { buffer: audioBuffer, source: null, gain: null };
    } catch (e) {
      console.warn(`[AudioEngine] Failed to load: ${name}`, e);
    }
  }

  static play(name, { loop = true, fadeIn = 2000, volume = 1 } = {}) {
    if (!this.isResumed || !this.layers[name]) return;
    const layer = this.layers[name];

    // 停止之前的播放
    if (layer.source) {
      try { layer.source.stop(); } catch {}
    }

    layer.gain = this.ctx.createGain();
    layer.gain.connect(this.masterGain);
    layer.gain.gain.setValueAtTime(0, this.ctx.currentTime);
    layer.gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + fadeIn / 1000);

    layer.source = this.ctx.createBufferSource();
    layer.source.buffer = layer.buffer;
    layer.source.loop = loop;
    layer.source.connect(layer.gain);
    layer.source.start();
  }

  static fadeOut(name, duration = 3000) {
    const layer = this.layers[name];
    if (!layer || !layer.source || !layer.gain) return;
    layer.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration / 1000);
    setTimeout(() => {
      try { layer.source.stop(); } catch {}
      layer.source = null;
    }, duration + 100);
  }

  static isPlaying(name) {
    const layer = this.layers[name];
    return !!(layer && layer.source);
  }

  static fadeOutAll(duration = 5000) {
    if (!this.masterGain) return;
    this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration / 1000);
  }

  static setMasterVolume(value) {
    if (!this.masterGain) return;
    this.masterGain.gain.linearRampToValueAtTime(
      Math.max(0, Math.min(1, value)),
      this.ctx.currentTime + 0.5
    );
  }
}
