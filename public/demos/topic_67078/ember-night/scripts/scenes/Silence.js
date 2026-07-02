/**
 * Silence Scene — Phase 5
 * 静默陪伴 → 全黑 → 自动关闭
 */
class SilenceScene {
  constructor(container) {
    this.container = container;
    this.pulseTimer = null;
    this.shutdownTimer = null;
  }

  start() {
    this.container.style.background = '#000';

    // 释放 Wake Lock，允许系统自动息屏
    WakeLockManager.release();

    // 30秒后第一次脉动
    setTimeout(() => this.pulse(), 30000);

    // 每90秒一次脉动
    this.pulseTimer = setInterval(() => this.pulse(), 90000);

    // 5分钟后彻底关闭
    this.shutdownTimer = setTimeout(() => this.shutdown(), 300000);

    // 传感器加速
    SensorManager.onStill(() => {
      clearTimeout(this.shutdownTimer);
      this.shutdownTimer = setTimeout(() => this.shutdown(), 60000);
    });
  }

  pulse() {
    const el = document.createElement('div');
    el.className = 'silence-pulse';
    this.container.appendChild(el);
    setTimeout(() => el.remove(), 4500);
  }

  shutdown() {
    clearInterval(this.pulseTimer);
    AudioEngine.fadeOutAll(5000);
    document.title = '晚安 ✦';
    // 最终彻底黑屏
    document.body.style.background = '#000';
    this.container.innerHTML = '';
  }

  destroy() {
    clearInterval(this.pulseTimer);
    clearTimeout(this.shutdownTimer);
  }
}
