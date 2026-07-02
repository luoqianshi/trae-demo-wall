/**
 * SensorManager — 陀螺仪/加速度计管理
 * 检测手机放平、静止状态
 */
class SensorManager {
  static isFlat = false;
  static isStill = false;
  static hasPermission = false;
  static motionBuffer = [];
  static stillCallbacks = [];
  static flatCallbacks = [];

  static async requestPermission() {
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const perm = await DeviceMotionEvent.requestPermission();
        this.hasPermission = (perm === 'granted');
      } catch {
        this.hasPermission = false;
      }
    } else if ('DeviceMotionEvent' in window) {
      this.hasPermission = true;
    }

    if (this.hasPermission) {
      this.startListening();
    }
  }

  static startListening() {
    window.addEventListener('deviceorientation', (e) => {
      const beta = e.beta || 0;
      const gamma = e.gamma || 0;
      const wasFlat = this.isFlat;
      this.isFlat = Math.abs(beta) < 20 && Math.abs(gamma) < 20;

      if (this.isFlat && !wasFlat) {
        DecayEngine.onPhoneFlat();
        this.flatCallbacks.forEach(fn => fn());
      }
    }, { passive: true });

    window.addEventListener('devicemotion', (e) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const magnitude = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      this.motionBuffer.push(magnitude);
      if (this.motionBuffer.length > 90) this.motionBuffer.shift();

      if (this.motionBuffer.length >= 60) {
        const variance = this.getVariance(this.motionBuffer);
        const wasStill = this.isStill;
        this.isStill = variance < 0.15;

        if (this.isStill && !wasStill) {
          DecayEngine.onPhoneStill();
          this.stillCallbacks.forEach(fn => fn());
        }
      }
    }, { passive: true });
  }

  static getVariance(arr) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((sum, val) => sum + (val - mean) ** 2, 0) / arr.length;
  }

  static onStill(fn) { this.stillCallbacks.push(fn); }
  static onFlat(fn) { this.flatCallbacks.push(fn); }
}
