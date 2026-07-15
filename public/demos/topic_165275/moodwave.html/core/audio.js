(function (global) {
  'use strict';

  class AudioEngine {
    constructor() {
      this.audio = new Audio();
      this.audio.crossOrigin = 'anonymous';
      this.ctx = null;
      this.masterGain = null;
      this.sourceNode = null;
      this.voiceMode = 'original';
      this._onTimeUpdate = null;
      this._onEnded = null;
      this._onLoaded = null;
      this.analyser = null;
      this._isPlaying = false;
    }

    _ensureContext() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.ctx.destination);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.masterGain.connect(this.analyser);
    }

    _connectSource() {
      if (!this.ctx) return;
      if (this.sourceNode) {
        try { this.sourceNode.disconnect(); } catch(e) {}
        this.sourceNode = null;
      }
      this.sourceNode = this.ctx.createMediaElementSource(this.audio);
      this.sourceNode.connect(this.masterGain);
    }

    setVoiceMode(mode) {
      this.voiceMode = mode;
      if (mode === 'accomp') {
        this._setAccompanimentMode(true);
      } else {
        this._setAccompanimentMode(false);
      }
    }

    _setAccompanimentMode(isAccomp) {
      if (!this.ctx || !this.masterGain) return;
      const target = isAccomp ? 0.45 : 1.0;
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(target, now + 0.5);
    }

    play(song, mood) {
      this._ensureContext();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.stop();
      if (!song.audioUrl) return;
      this.audio.src = song.audioUrl;
      this.audio.load();
      this.audio.play().catch(() => {});
      this._isPlaying = true;
      this._connectSource();
      this._setAccompanimentMode(this.voiceMode === 'accomp');
    }

    stop() {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
      } catch(e) {}
      this._isPlaying = false;
    }

    pause() {
      try { this.audio.pause(); } catch(e) {}
      this._isPlaying = false;
    }

    resume() {
      try { this.audio.play(); } catch(e) {}
      this._isPlaying = true;
    }

    seek(time) {
      try { this.audio.currentTime = time; } catch(e) {}
    }

    getCurrentTime() {
      return this.audio.currentTime || 0;
    }

    getDuration() {
      return this.audio.duration || 0;
    }

    isPlaying() {
      return this._isPlaying && !this.audio.paused;
    }

    onTimeUpdate(cb) {
      if (this._onTimeUpdate) this.audio.removeEventListener('timeupdate', this._onTimeUpdate);
      this._onTimeUpdate = () => cb(this.audio.currentTime, this.audio.duration);
      this.audio.addEventListener('timeupdate', this._onTimeUpdate);
    }

    onEnded(cb) {
      if (this._onEnded) this.audio.removeEventListener('ended', this._onEnded);
      this._onEnded = cb;
      this.audio.addEventListener('ended', cb);
    }

    onLoaded(cb) {
      if (this._onLoaded) this.audio.removeEventListener('loadedmetadata', this._onLoaded);
      this._onLoaded = () => cb(this.audio.duration);
      this.audio.addEventListener('loadedmetadata', this._onLoaded);
    }
  }

  global.AudioEngine = AudioEngine;
})(window);
