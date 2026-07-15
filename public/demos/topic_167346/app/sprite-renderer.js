/**
 * sprite-renderer.js · 宠物 sprite 主循环渲染层（v0.4 · sprite sheet 消费）
 *
 * 消费 assets/pet/sheet-meta.json v0.2 中的 5 个 sprite sheet：
 *   greet-sheet-6f.png (6 帧 · 8fps · loop=false)
 *   happy-sheet-6f.png (6 帧 · 8fps · loop=false)
 *   thirsty-sheet-4f.png (4 帧 · 4fps · loop=true)
 *   idle-sheet-4f.png (4 帧 · 4fps · loop=true)
 *   particles-sheet-8f.png (8 帧 · 8fps · loop=false)
 *
 * 契约来源：assets/pet/animations.md v0.3 §4.2 sprite sheet 消费策略 + §7 消费接口
 *
 * 消费方式：CSS background-image + background-position（横向平移） · JS setTimeout 驱动
 * fallback：sheet 加载失败 → 回退 M1a 独立 PNG（保证 Demo "能拍"底线不塌）
 *
 * DOM 结构（由 index.html 提供）：
 *   .dp-pet (root, class 会切成当前 pet_state / substate)
 *     .dp-pet__sprite (background-image = sheet, background-position = 当前帧)
 *     .dp-pet__blink (idle 眨眼层)
 *     .dp-fx-layer (数字气泡等)
 *     .dp-fx-particles (达标粒子 sheet 层)
 */

const SHEET_META_URL = '../assets/pet/sheet-meta.json';
const SHEET_DIR = '../assets/pet/';

// M1a fallback（单帧独立 PNG · 若 sheet 加载失败时回退）
const FALLBACK_FRAME = {
  greet:   '../assets/pet/greet-frame-0.png',
  happy:   '../assets/pet/happy-frame-0.png',
  thirsty: '../assets/pet/thirsty-frame-0.png',
  idle:    '../assets/pet/idle-frame-0.png',
};

// v0.4 方案 A：happy-satisfied.png 已删除入库；satisfied 变体改由 sheets.satisfied（particles sheet 别名 · 8 帧 4fps loop）驱动
// v0.4 方案 A：fx-milestone-particles.png 也已删除；粒子层合并进 satisfied sprite 一体化播放

const IDLE_BLINK_MIN = 3000;
const IDLE_BLINK_MAX = 5000;
const IDLE_BLINK_MS  = 120;

export class SpriteRenderer {
  constructor({ petRoot, spriteEl, blinkEl, fxParticlesEl, onLoopEnd }) {
    this.root = petRoot;
    this.spriteEl = spriteEl;
    this.blinkEl = blinkEl;
    this.fxParticlesEl = fxParticlesEl;
    // v0.4 P50 修复：一次性动画（loop=false）播完末帧后回调，供 pet-engine 触发状态回落
    this.onLoopEnd = onLoopEnd || (() => {});

    /** @type {Record<string, {file, frames, frame_w, frame_h, fps, loop, url}>|null} */
    this.sheets = null;
    this.sheetsReady = false;
    this.fallbackMode = false;

    this.currentState = 'idle';
    this.currentSubstate = 'default';
    this.frameIndex = 0;
    this._loopTimer = null;
    this._blinkTimer = null;
    this._particleTimer = null;
  }

  /** 异步初始化，返回 Promise：加载 sheet-meta.json + 预加载所有 sheet PNG */
  async init() {
    try {
      const meta = await fetch(SHEET_META_URL).then(r => {
        if (!r.ok) throw new Error('sheet-meta.json HTTP ' + r.status);
        return r.json();
      });
      const sheets = meta.sheets || {};
      const required = ['greet', 'happy', 'thirsty', 'idle', 'particles'];
      for (const k of required) {
        if (!sheets[k]) throw new Error('sheet-meta.json missing ' + k);
      }
      // 预加载全部 sheet + 挂 url
      await Promise.all(required.map(k => this._preloadSheet(sheets[k])));
      // 可选：satisfied 别名（sheet-meta.json v0.3+）· 若存在则预加载
      if (sheets.satisfied) {
        await this._preloadSheet(sheets.satisfied);
      }

      this.sheets = sheets;
      this.sheetsReady = true;
      console.log('[sprite-renderer] sheet-meta v' + (meta.version || '?') + ' loaded, ' + Object.keys(sheets).length + ' sheets ready');
    } catch (err) {
      console.warn('[sprite-renderer] fallback to M1a single-frame:', err.message);
      this.fallbackMode = true;
      // 预加载 fallback 资源（happy-satisfied / fx-milestone-particles / idle-blink 已在 v0.4 方案 A 移除）
      Object.values(FALLBACK_FRAME).forEach(u => { new Image().src = u; });
    }

    // 首次渲染（无论 sheet 就绪与否）
    if (this.blinkEl) this.blinkEl.classList.remove('on');
    this._render();
    this._scheduleLoop();
    this._scheduleBlink();
    return this;
  }

  _preloadSheet(sheetSpec) {
    return new Promise((resolve, reject) => {
      const url = SHEET_DIR + sheetSpec.file;
      sheetSpec.url = url;
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('preload failed: ' + url));
      img.src = url;
    });
  }

  /** 由 pet-engine.onStateChange 调用 */
  setState(state, substate = 'default') {
    if (state === this.currentState && substate === this.currentSubstate) return;

    const shouldPreReact = this._shouldPlayPreReact(this.currentState, state);

    this.currentState = state;
    this.currentSubstate = substate;
    this.frameIndex = 0;

    if (shouldPreReact) {
      this.root.classList.add('pre-react');
      setTimeout(() => this.root.classList.remove('pre-react'), 260);
    }

    this._render();
    this._scheduleLoop();
    this._scheduleBlink();
  }

  _shouldPlayPreReact(from, to) {
    // animations §5.2 pre-react 4×4 适用矩阵
    if (from === 'thirsty') return false;
    if (to === 'thirsty') return false;
    if (from === 'greet' && to === 'idle') return false;
    if (from === to) return false;
    return true;
  }

  /**
   * 挑选当前状态使用的 sheet spec。
   * satisfied 变体走 sheets.satisfied（若存在），否则回退 sheets.particles（v0.3 别名基础）。
   */
  _pickSpec() {
    if (!this.sheetsReady) return null;
    if (this.currentSubstate === 'satisfied') {
      return this.sheets.satisfied || this.sheets.particles || null;
    }
    return this.sheets[this.currentState] || null;
  }

  _render() {
    // 根 class 更新
    this.root.classList.remove('greet', 'happy', 'thirsty', 'idle', 'satisfied');
    this.root.classList.add(this.currentState);
    if (this.currentSubstate === 'satisfied') this.root.classList.add('satisfied');

    // fallback 模式：走 M1a 单帧（satisfied 无 fallback · 用 happy 兜底）
    if (this.fallbackMode || !this.sheetsReady) {
      const url = FALLBACK_FRAME[this.currentState] || FALLBACK_FRAME.idle;
      this.spriteEl.style.backgroundImage = `url("${url}")`;
      this.spriteEl.style.backgroundPosition = '0 0';
      this.spriteEl.style.backgroundSize = '100% 100%';
      return;
    }

    // sheet 模式：background-image = sheet · background-position = 百分比切帧
    const spec = this._pickSpec();
    if (!spec) {
      // 状态未在 sheet 中定义（如意外扩展）· 回退 fallback
      const url = FALLBACK_FRAME.idle;
      this.spriteEl.style.backgroundImage = `url("${url}")`;
      this.spriteEl.style.backgroundPosition = '0 0';
      this.spriteEl.style.backgroundSize = '100% 100%';
      return;
    }
    const idx = this.frameIndex % spec.frames;
    // sheet 是横向拼接：总宽 = frames × frame_w · 缩放到显示尺寸
    // background-size = (frames*100%) × 100% · background-position 用百分比切帧
    this.spriteEl.style.backgroundImage = `url("${spec.url}")`;
    this.spriteEl.style.backgroundSize = `${spec.frames * 100}% 100%`;
    // 正确公式（DS 测试页验证）：正百分比 idx/(frames-1)*100
    const posX = spec.frames > 1 ? (idx * 100) / (spec.frames - 1) : 0;
    this.spriteEl.style.backgroundPosition = `${posX}% 0`;
  }

  _scheduleLoop() {
    if (this._loopTimer) clearTimeout(this._loopTimer);
    if (this.fallbackMode || !this.sheetsReady) {
      // fallback 模式：无循环（单帧驻留）· 保持 Demo "能拍"底线
      return;
    }
    // v0.4 方案 A: satisfied 变体走 sheets.satisfied（8 帧 4fps loop=true 一体化播放）
    const spec = this._pickSpec();
    if (!spec || spec.frames < 2) return;
    const dur = Math.max(1, Math.round(1000 / spec.fps));
    this._loopTimer = setTimeout(() => {
      // loop=false 且已到末帧 → 停在末帧不循环 + 通知 engine 触发回落
      if (!spec.loop && this.frameIndex >= spec.frames - 1) {
        // P50 修复：一次性动画播完，通知 engine 状态回落
        try { this.onLoopEnd({ state: this.currentState, substate: this.currentSubstate }); } catch (_) { /* ignore */ }
        return;
      }
      this.frameIndex = (this.frameIndex + 1) % spec.frames;
      this._render();
      this._scheduleLoop();
    }, dur);
  }

  _scheduleBlink() {
    // v0.4: idle-sheet-4f.png 主循环已包含眨眼动画，独立 blink 层废弃
    if (this._blinkTimer) clearTimeout(this._blinkTimer);
    return;
  }

  /**
   * v0.4 方案 A：达标粒子已合并进 sheets.satisfied 一体化播放（八帧循环内建粒子扩散）。
   * 保留此空方法以维持既有调用点（index.html triggerParticles → sprite.triggerParticles）。
   */
  triggerParticles() {
    // NOP：粒子随 sheets.satisfied 主循环播放，无独立触发。
  }

  destroy() {
    if (this._loopTimer) clearTimeout(this._loopTimer);
    if (this._blinkTimer) clearTimeout(this._blinkTimer);
  }
}
