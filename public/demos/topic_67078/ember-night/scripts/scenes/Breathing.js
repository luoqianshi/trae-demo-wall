/**
 * Breathing Scene — Phase 4
 * 渐进式呼吸引导 (4-4-6 → 4-5-7 → 4-7-8)
 */
class BreathingScene {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.round = 0;
    this.phase = 'inhale';
    this.phaseStartTime = 0;
    this.textOpacity = 1;
    this.orbOpacity = 1;
    this.isRunning = false;
    this.dpr = window.devicePixelRatio || 1;
  }

  getTimings() {
    if (this.round < 3) return { inhale: 4000, hold: 4000, exhale: 6000 };
    if (this.round < 6) return { inhale: 4000, hold: 5000, exhale: 7000 };
    return { inhale: 4000, hold: 7000, exhale: 8000 };
  }

  start() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'breathing-canvas';
    this.canvas.width = window.innerWidth * this.dpr;
    this.canvas.height = window.innerHeight * this.dpr;
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.isRunning = true;
    this.phaseStartTime = performance.now();

    // 播放环境音（如果从 Pier 来 ocean 已在播放，则不重复启动）
    if (!AudioEngine.isPlaying('env_ocean')) {
      AudioEngine.play('env_ocean', { loop: true, fadeIn: 3000, volume: 0.3 });
    }

    this.animate();
  }

  animate(timestamp = performance.now()) {
    if (!this.isRunning) return;

    const timings = this.getTimings();
    const elapsed = timestamp - this.phaseStartTime;
    const phaseDuration = timings[this.phase];
    const progress = Math.min(1, elapsed / phaseDuration);

    if (progress >= 1) {
      this.nextPhase();
    }

    this.draw(progress);
    requestAnimationFrame((t) => this.animate(t));
  }

  nextPhase() {
    this.phaseStartTime = performance.now();

    switch (this.phase) {
      case 'inhale': this.phase = 'hold'; break;
      case 'hold': this.phase = 'exhale'; break;
      case 'exhale':
        this.phase = 'inhale';
        this.round++;
        this.textOpacity = Math.max(0, 1 - this.round * 0.2);
        this.orbOpacity = Math.max(0.1, 1 - this.round * 0.08);
        if (this.round >= 12 || DecayEngine.calmLevel > 85) {
          this.advance();
        }
        break;
    }
  }

  draw(progress) {
    const { width, height } = this.canvas;
    const cx = width / 2;
    const cy = height * 0.42;
    const dpr = this.dpr;

    this.ctx.clearRect(0, 0, width, height);

    const minR = 45 * dpr;
    const maxR = 85 * dpr;
    const t = this.easeInOut(progress);
    let radius;

    switch (this.phase) {
      case 'inhale': radius = minR + (maxR - minR) * t; break;
      case 'hold': radius = maxR; break;
      case 'exhale': radius = maxR - (maxR - minR) * t; break;
    }

    // 外层光晕
    const glowGrad = this.ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 2.5);
    glowGrad.addColorStop(0, `rgba(244, 162, 97, ${0.15 * this.orbOpacity})`);
    glowGrad.addColorStop(0.5, `rgba(244, 162, 97, ${0.05 * this.orbOpacity})`);
    glowGrad.addColorStop(1, 'rgba(244, 162, 97, 0)');
    this.ctx.fillStyle = glowGrad;
    this.ctx.fillRect(0, 0, width, height);

    // 光球
    const orbGrad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    orbGrad.addColorStop(0, `rgba(245, 230, 211, ${0.7 * this.orbOpacity})`);
    orbGrad.addColorStop(0.6, `rgba(244, 162, 97, ${0.5 * this.orbOpacity})`);
    orbGrad.addColorStop(1, `rgba(244, 162, 97, ${0.1 * this.orbOpacity})`);
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = orbGrad;
    this.ctx.fill();

    // 文字
    if (this.textOpacity > 0.03) {
      const fontSize = 18 * dpr;
      this.ctx.font = `300 ${fontSize}px "Noto Serif CJK SC", "STSongti-SC", serif`;
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = `rgba(232, 223, 208, ${this.textOpacity * 0.8})`;
      let text = '';
      if (this.phase === 'inhale') text = '吸...';
      else if (this.phase === 'exhale') text = '呼...';
      if (text) {
        this.ctx.fillText(text, cx, cy + radius + 50 * dpr);
      }
    }
  }

  easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  advance() {
    this.isRunning = false;
    // 光球渐隐
    const fadeInterval = setInterval(() => {
      this.orbOpacity -= 0.02;
      this.textOpacity = 0;
      if (this.orbOpacity <= 0) {
        clearInterval(fadeInterval);
        AudioEngine.fadeOut('env_ocean', 5000);
        StateManager.transition('SILENCE');
      } else {
        this.draw(0);
      }
    }, 50);
  }

  destroy() {
    this.isRunning = false;
  }
}
