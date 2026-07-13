// ============================================================
// js/flight-controls.js
// 中华文化粒子云引擎 · 3D 飞行导航控制器（Task 5.1）
// 在保留 OrbitControls 拖拽转向的基础上叠加 WASD/QE/Shift 飞行：
// - W/S：沿相机前向平移（前进/后退）
// - A/D：沿相机右向平移（左移/右移）
// - Q/E：升降（世界 Y 轴）
// - Shift：速度 ×3 加速
// - 鼠标滚轮：调整 flySpeedMultiplier（0.5x ~ 5x），不再拉近相机
// - 速度阻尼：velocity 用帧率无关 lerp 平滑追随目标速度，实现"惯性"手感
// - OrbitControls 兼容：每帧把 velocity*dt 同步加到 camera.position 与 controls.target，
//   使旋转中心随相机一起平移，OrbitControls 拖拽转向与 WASD 飞行互不干扰
// ============================================================

import * as THREE from 'three';

export class FlightControls {
  /**
   * @param {object} opts
   * @param {THREE.PerspectiveCamera} opts.camera
   * @param {import('three/addons/controls/OrbitControls.js').OrbitControls} opts.controls
   * @param {HTMLElement} opts.domElement  接收鼠标事件的 canvas
   */
  constructor({ camera, controls, domElement }) {
    this.camera = camera;
    this.controls = controls;
    this.domElement = domElement;

    // ====== 速度参数 ======
    this.baseSpeed = 220;            // 基础平移速度（单位/秒）
    this.flySpeedMultiplier = 1.0;   // 滚轮调节的倍率（0.5 ~ 5）
    this.shiftMultiplier = 3.0;      // Shift 加速倍率
    this.accelLerp = 6.0;            // 速度阻尼系数（越大越灵敏，越小越滑）

    // ====== 输入状态 ======
    /** @type {{w:boolean,a:boolean,s:boolean,d:boolean,q:boolean,e:boolean,shift:boolean}} */
    this.keys = { w: false, a: false, s: false, d: false, q: false, e: false, shift: false };

    // ====== 当前速度向量（用于阻尼平滑） ======
    this.velocity = new THREE.Vector3();

    // ====== 飞行目标（供 search 调用 flyTo） ======
    this._flyTarget = null;          // { camPos: Vector3, target: Vector3, t: 0..1, duration: 1.0 }

    // ====== HUD 状态 ======
    this.hudState = { speed: 0, x: 0, y: 0, z: 0, multiplier: 1.0 };

    // ====== 临时向量（避免每帧 new） ======
    this._fwd = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0);
    this._desired = new THREE.Vector3();
    this._delta = new THREE.Vector3();

    // 标记是否已启用
    this._enabled = false;

    // OrbitControls 默认滚轮缩放禁用，改由本类接管
    if (this.controls) {
      this.controls.enableZoom = false;
    }
  }

  /**
   * 启用：注册键盘 / 滚轮监听
   */
  enable() {
    if (this._enabled) return;
    this._enabled = true;
    this._onKeyDown = (e) => this._handleKey(e, true);
    this._onKeyUp = (e) => this._handleKey(e, false);
    this._onWheel = (e) => this._handleWheel(e);
    this._onBlur = () => this._resetKeys();

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
    // 捕获阶段 + preventDefault，彻底接管滚轮（防止页面滚动 + 屏蔽 OrbitControls 缩放）
    this.domElement.addEventListener('wheel', this._onWheel, { passive: false });
  }

  /**
   * 禁用：移除监听并清空按键状态
   */
  disable() {
    if (!this._enabled) return;
    this._enabled = false;
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onBlur);
    this.domElement.removeEventListener('wheel', this._onWheel);
    this._resetKeys();
    this.velocity.set(0, 0, 0);
    this._flyTarget = null;
  }

  _resetKeys() {
    this.keys.w = this.keys.a = this.keys.s = this.keys.d = this.keys.q = this.keys.e = this.keys.shift = false;
  }

  /**
   * 键盘事件处理：仅拦截 WASD/QE，避免影响输入框等
   * 输入框获焦时不拦截
   */
  _handleKey(e, isDown) {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return; // 搜索框/自定义输入框中不触发飞行
    const k = e.key.toLowerCase();
    const map = { w: 'w', a: 'a', s: 's', d: 'd', q: 'q', e: 'e' };
    if (map[k]) {
      this.keys[map[k]] = isDown;
      e.preventDefault();
    }
    if (e.key === 'Shift') {
      this.keys.shift = isDown;
    }
  }

  /**
   * 滚轮事件：调整为调速倍率（向上滚加速、向下滚减速，范围 0.5 ~ 5）
   */
  _handleWheel(e) {
    e.preventDefault();
    e.stopPropagation();
    const dir = Math.sign(e.deltaY);
    // deltaY < 0（向上滚）→ 增大倍率；deltaY > 0（向下滚）→ 减小倍率
    const factor = dir < 0 ? 1.12 : 1 / 1.12;
    this.flySpeedMultiplier = Math.max(0.5, Math.min(5.0, this.flySpeedMultiplier * factor));
  }

  /**
   * 平滑飞向目标点（供搜索框调用）
   * @param {THREE.Vector3} targetWorld  目标世界坐标（粒子簇中心）
   * @param {number} [duration=1.2]     飞行时长（秒）
   * @param {number} [distance=320]      相机停留时距目标的距离
   */
  flyTo(targetWorld, duration = 1.2, distance = 320) {
    // 计算目标相机位置：从当前相机方向反向退 distance 距离
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    const camPos = targetWorld.clone().add(camDir.multiplyScalar(-distance));
    this._flyTarget = {
      camPos,
      target: targetWorld.clone(),
      t: 0,
      duration
    };
    // 飞行期间清空手动速度，避免冲突
    this.velocity.set(0, 0, 0);
  }

  /**
   * 每帧更新：处理 flyTo 动画 + WASD 速度阻尼 + 同步 controls.target
   * @param {number} dt 秒
   */
  update(dt) {
    if (!this._enabled) return;

    // ====== 1) flyTo 动画优先（搜索触发） ======
    if (this._flyTarget) {
      const ft = this._flyTarget;
      ft.t += dt / ft.duration;
      const k = Math.min(1, ft.t);
      // easeInOutCubic
      const ease = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      this.camera.position.lerpVectors(this.camera.position, ft.camPos, ease * 0.2 + 0.1);
      this.controls.target.lerpVectors(this.controls.target, ft.target, ease * 0.2 + 0.1);
      if (k >= 1) this._flyTarget = null;
      this._syncHUD();
      return;
    }

    // ====== 2) 计算相机前向 / 右向 ======
    this.camera.getWorldDirection(this._fwd);
    this._right.crossVectors(this._fwd, this._up).normalize();

    // ====== 3) 期望速度 ======
    this._desired.set(0, 0, 0);
    if (this.keys.w) this._desired.add(this._fwd);
    if (this.keys.s) this._desired.sub(this._fwd);
    if (this.keys.d) this._desired.add(this._right);
    if (this.keys.a) this._desired.sub(this._right);
    if (this.keys.e) this._desired.add(this._up);
    if (this.keys.q) this._desired.sub(this._up);

    const speed = this.baseSpeed * this.flySpeedMultiplier * (this.keys.shift ? this.shiftMultiplier : 1);
    if (this._desired.lengthSq() > 0) {
      this._desired.normalize().multiplyScalar(speed);
    }

    // ====== 4) 速度阻尼：帧率无关 lerp ======
    const lerpK = 1 - Math.exp(-this.accelLerp * dt);
    this.velocity.lerp(this._desired, lerpK);

    // ====== 5) 应用位移：camera.position 与 controls.target 同步平移 ======
    this._delta.copy(this.velocity).multiplyScalar(dt);
    if (this._delta.lengthSq() > 0) {
      this.camera.position.add(this._delta);
      this.controls.target.add(this._delta);
    }

    this._syncHUD();
  }

  /**
   * 同步 HUD 状态（供 UI 调用 getHUDState 读取）
   * @private
   */
  _syncHUD() {
    const p = this.camera.position;
    this.hudState.x = p.x;
    this.hudState.y = p.y;
    this.hudState.z = p.z;
    this.hudState.speed = this.velocity.length();
    this.hudState.multiplier = this.flySpeedMultiplier;
  }

  /**
   * 对外暴露 HUD 状态快照
   * @returns {{speed:number,x:number,y:number,z:number,multiplier:number}}
   */
  getHUDState() {
    return {
      speed: Math.round(this.hudState.speed),
      x: Math.round(this.hudState.x),
      y: Math.round(this.hudState.y),
      z: Math.round(this.hudState.z),
      multiplier: Number(this.hudState.multiplier.toFixed(2))
    };
  }
}

// 功能描述：3D 飞行导航控制器。导出 FlightControls 类，构造时接收 {camera, controls, domElement}，
// 在保留 OrbitControls 拖拽转向的基础上叠加 WASD/QE/Shift 飞行控制：
// 1) WASD 沿相机前向/右向平移，Q/E 沿世界 Y 轴升降，Shift 速度 ×3 加速；
// 2) 鼠标滚轮改为调整 flySpeedMultiplier（0.5x~5x），禁用 OrbitControls.enableZoom，不再拉近相机；
// 3) 速度阻尼：维护 velocity 向量，每帧用帧率无关 lerp（1 - exp(-accelLerp*dt)）平滑追随期望速度，
//    实现加速/减速的"惯性"手感；位移同步加到 camera.position 与 controls.target，使旋转中心随相机平移，
//    OrbitControls 拖拽转向与 WASD 飞行互不干扰；
// 4) flyTo(target, duration, distance)：供搜索框调用，相机在 duration 秒内沿 easeInOutCubic 平滑飞向目标点，
//    飞行期间清空手动速度避免冲突；
// 5) getHUDState()：对外暴露 {speed, x, y, z, multiplier} 快照供顶部 HUD 显示；
// 6) enable()/disable()：注册/移除 keydown/keyup/blur/wheel 监听，输入框获焦时不拦截键盘事件；
// 7) _handleWheel 用 preventDefault + stopPropagation 彻底接管滚轮；
// 8) 临时向量复用避免每帧 new，性能友好。
