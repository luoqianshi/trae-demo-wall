export class AudioSystem {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
  }

  getContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  playTone(frequency, duration, type = 'sine', volume = 0.1) {
    if (!this.enabled) return;
    
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  playStart() {
    this.playTone(523.25, 0.2);
    setTimeout(() => this.playTone(659.25, 0.2), 150);
    setTimeout(() => this.playTone(783.99, 0.3), 300);
  }

  playHit() {
    this.playTone(800, 0.1, 'square', 0.05);
    setTimeout(() => this.playTone(600, 0.15, 'square', 0.03), 50);
  }

  playDamage() {
    this.playTone(200, 0.3, 'sawtooth', 0.08);
    setTimeout(() => this.playTone(150, 0.2, 'sawtooth', 0.05), 100);
  }

  playSuccess() {
    this.playTone(523.25, 0.15);
    setTimeout(() => this.playTone(659.25, 0.15), 100);
    setTimeout(() => this.playTone(783.99, 0.2), 200);
  }

  playFail() {
    this.playTone(200, 0.2, 'triangle', 0.08);
    setTimeout(() => this.playTone(150, 0.3, 'triangle', 0.05), 150);
  }

  playCollect() {
    this.playTone(440, 0.1);
    setTimeout(() => this.playTone(554.37, 0.1), 80);
    setTimeout(() => this.playTone(659.25, 0.15), 160);
  }

  playWeakness() {
    this.playTone(300, 0.15, 'sine', 0.03);
    setTimeout(() => this.playTone(400, 0.15, 'sine', 0.03), 100);
  }

  playSpawn() {
    this.playTone(150, 0.2, 'sawtooth', 0.03);
    setTimeout(() => this.playTone(200, 0.2, 'sawtooth', 0.03), 100);
  }

  playBossEnter() {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.playTone(100 + i * 25, 0.3, 'square', 0.05);
      }, i * 150);
    }
    
    setTimeout(() => {
      this.playTone(330, 0.2);
      setTimeout(() => this.playTone(440, 0.2), 150);
      setTimeout(() => this.playTone(554.37, 0.3), 300);
    }, 600);
  }

  playVictory() {
    const notes = [523.25, 587.33, 659.25, 783.99, 880];
    
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.2), i * 150);
    });
    
    setTimeout(() => {
      this.playTone(1046.50, 0.3);
    }, 750);
  }

  playGameOver() {
    this.playTone(330, 0.3, 'triangle', 0.08);
    setTimeout(() => this.playTone(261.63, 0.4, 'triangle', 0.08), 200);
    setTimeout(() => this.playTone(196, 0.5, 'triangle', 0.06), 400);
  }
}