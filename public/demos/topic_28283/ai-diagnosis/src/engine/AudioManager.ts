export class AudioManager {
  private audioContext: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmPlaying: boolean = false;

  init() {
    try {
      this.audioContext = new AudioContext();
    } catch {
      this.soundEnabled = false;
    }
  }

  private get ctx(): AudioContext {
    if (!this.audioContext) this.init();
    return this.audioContext!;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'square', volume: number = 0.15, freqEnd?: number) {
    if (!this.soundEnabled || !this.audioContext) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playJump() {
    this.playTone(400, 0.15, 'square', 0.12, 800);
  }

  playBigJump() {
    this.playTone(300, 0.2, 'square', 0.12, 600);
  }

  playCoin() {
    this.playTone(988, 0.05, 'square', 0.1);
    setTimeout(() => this.playTone(1319, 0.3, 'square', 0.1), 50);
  }

  playStomp() {
    this.playTone(400, 0.1, 'square', 0.15, 100);
  }

  playPowerUp() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'square', 0.1), i * 80);
    });
  }

  playDeath() {
    const notes = [494, 440, 370, 330, 294, 247];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'square', 0.12), i * 120);
    });
  }

  playLevelComplete() {
    const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'square', 0.1), i * 100);
    });
  }

  playBlockBreak() {
    this.playTone(200, 0.1, 'square', 0.15, 80);
  }

  playBump() {
    this.playTone(200, 0.08, 'triangle', 0.1, 100);
  }

  playFlagpole() {
    const notes = [330, 392, 494, 587, 659, 784, 988, 1175];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'square', 0.08), i * 70);
    });
  }

  startBGM() {
    if (!this.musicEnabled || !this.audioContext || this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.playBGMLoop();
  }

  private playBGMLoop() {
    if (!this.bgmPlaying || !this.musicEnabled || !this.audioContext) return;
    // 简化的8-bit BGM旋律 (超级玛丽主题简化版)
    const melody = [
      659, 659, 0, 659, 0, 523, 659, 0, 784, 0, 0, 0, 392, 0, 0, 0,
      523, 0, 0, 392, 0, 0, 330, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
    const noteLength = 0.12;
    let time = this.ctx.currentTime;

    melody.forEach((freq) => {
      if (freq > 0 && this.bgmPlaying) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.06, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + noteLength * 0.9);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + noteLength);
        this.bgmOscillators.push(osc);
      }
      time += noteLength;
    });

    const loopDuration = melody.length * noteLength * 1000;
    if (this.bgmPlaying) {
      setTimeout(() => this.playBGMLoop(), loopDuration);
    }
  }

  stopBGM() {
    this.bgmPlaying = false;
    this.bgmOscillators.forEach(osc => {
      try { osc.stop(); } catch { /* ignore */ }
    });
    this.bgmOscillators = [];
  }

  toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) this.stopBGM();
    return this.musicEnabled;
  }

  isSoundEnabled(): boolean { return this.soundEnabled; }
  isMusicEnabled(): boolean { return this.musicEnabled; }

  resume() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}
