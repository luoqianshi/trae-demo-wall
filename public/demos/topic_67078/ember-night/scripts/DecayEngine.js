/**
 * DecayEngine — 渐进衰减引擎
 * calmLevel 0→100 驱动全局视觉/听觉衰减
 */
class DecayEngine {
  static calmLevel = 0;
  static baseRate = 0.3;
  static sensorBoost = 0;
  static listeners = [];
  static lastTick = 0;
  static running = false;

  static init() {
    this.lastTick = performance.now();
    this.running = true;
    this.tick();
  }

  static tick() {
    if (!this.running) return;

    const now = performance.now();
    const dt = (now - this.lastTick) / 1000;
    this.lastTick = now;

    this.calmLevel += (this.baseRate + this.sensorBoost) * dt;
    this.calmLevel = Math.min(100, Math.max(0, this.calmLevel));

    this.applyGlobalEffects();
    this.notifyListeners();

    requestAnimationFrame(() => this.tick());
  }

  static applyGlobalEffects() {
    const root = document.documentElement;
    // 视觉衰减：亮度从 1.0 → 0.3
    const brightness = Math.max(0.3, 1 - this.calmLevel * 0.007);
    root.style.setProperty('--global-brightness', brightness);
    // 视觉衰减：暖色从 0% → 30%
    const warmth = Math.min(30, this.calmLevel * 0.3);
    root.style.setProperty('--global-warmth', `${warmth}%`);
    // 音量衰减：从 0.6 → 0.12（主音量 60% 基础上降到 20%）
    const volume = Math.max(0.12, 0.6 - this.calmLevel * 0.0048);
    AudioEngine.setMasterVolume(volume);
  }

  static addCalm(amount) {
    this.calmLevel += amount;
    this.calmLevel = Math.min(100, this.calmLevel);
  }

  static onPhoneFlat() { this.sensorBoost = 1.5; }
  static onPhoneStill() { this.sensorBoost = 2.5; }
  static onUserInteract() { this.sensorBoost = 0; }

  static onChange(fn) { this.listeners.push(fn); }
  static notifyListeners() { this.listeners.forEach(fn => fn(this.calmLevel)); }

  static reset() {
    this.calmLevel = 0;
    this.sensorBoost = 0;
  }
}
