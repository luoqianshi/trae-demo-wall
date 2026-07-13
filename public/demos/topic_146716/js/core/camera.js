// ============================================================
// 相机系统模块 (CameraSystem)
// 负责：屏幕震动、相机后坐力、视角控制
// ============================================================

const CameraSystem = {
  initialized: false,

  // 屏幕震动状态
  shakeIntensity: 0,
  shakeDuration: 0,
  shakeTimer: 0,

  // 相机后坐力状态
  recoilOffset: new THREE.Vector3(),
  recoilVelocity: new THREE.Vector3(),

  init() {
    this.initialized = true;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.recoilOffset.set(0, 0, 0);
    this.recoilVelocity.set(0, 0, 0);
    console.log('[CameraSystem] Initialized');
    return true;
  },

  // --- 屏幕震动 ---
  screenShake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = 0;
  },

  updateShake(dt, camera) {
    if (!camera) return { x: 0, y: 0 };
    if (this.shakeTimer < this.shakeDuration) {
      this.shakeTimer += dt;
      const factor = 1 - this.shakeTimer / this.shakeDuration;
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity * factor;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity * factor;
      camera.position.x += shakeX;
      camera.position.y += shakeY;
      return { x: shakeX, y: shakeY };
    }
    return { x: 0, y: 0 };
  },

  // --- 相机后坐力 ---
  applyRecoil(intensity, direction) {
    this.recoilVelocity.add(direction.clone().multiplyScalar(-intensity));
  },

  updateRecoil(dt, camera) {
    if (!camera) return;
    // 阻尼恢复
    this.recoilVelocity.multiplyScalar(1 - 5 * dt);
    this.recoilOffset.add(this.recoilVelocity.clone().multiplyScalar(dt));
    this.recoilOffset.multiplyScalar(1 - 3 * dt);
    // 应用到相机
    camera.position.add(this.recoilOffset);
  },

  // --- 重置 ---
  reset() {
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.recoilOffset.set(0, 0, 0);
    this.recoilVelocity.set(0, 0, 0);
  }
};

window.CameraSystem = CameraSystem;
