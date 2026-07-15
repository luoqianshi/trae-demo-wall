/**
 * water-bg.js · 环境层水位背景状态机
 *
 * 消费 assets/pet/sheet-meta.json v0.2 中的 environment.water_cup_bg 5 档背景。
 * 契约来源：assets/pet/animations.md v0.3 §4.5 环境层水位状态机
 *
 * 公式（animations §4.5.3）：
 *   level_index = min(4, floor(today_total_ml / 1500 * 4))
 *   0=空杯(000) · 1=25% · 2=50% · 3=75% · 4=100%(达标)
 *
 * 切换时机（animations §4.5.4）：
 *   - drink 事件（today_total 变化） → 立即更新
 *   - 跨零点清零 → 切回 000
 *   - refill 不切换（refill 是加水到杯，不是喝进肚）
 *   - APP 启动 → 读 today_total 初始化
 *
 * 视觉过渡（animations §4.5.5）：CSS transition background-image 300ms ease-out
 */

const MILESTONE_ML = 1500;
const LEVEL_FILES = ['000', '025', '050', '075', '100'];
const ASSET_DIR = '../assets/pet/';

/**
 * 计算水位档位（0..4）
 * @param {number} totalMl - today_total_ml
 * @returns {number} level 0..4
 */
export function pickWaterLevel(totalMl) {
  if (!Number.isFinite(totalMl) || totalMl < 0) return 0;
  return Math.min(4, Math.floor(totalMl / MILESTONE_ML * 4));
}

/**
 * 水位背景管理器
 */
export class WaterBg {
  constructor({ targetEl } = {}) {
    // 挂在 body（默认）或指定容器（便于测试）
    this.target = targetEl || document.body;
    this.currentLevel = -1; // -1 表示未初始化
  }

  /**
   * 预加载所有 5 档背景（避免切换时闪烁）
   */
  preload() {
    for (const suffix of LEVEL_FILES) {
      const img = new Image();
      img.src = `${ASSET_DIR}bg-desktop-water-${suffix}.png`;
    }
  }

  /**
   * 根据当前 today_total_ml 更新水位背景
   * @param {number} todayTotalMl
   * @returns {number} 应用的 level（若无变化返回 currentLevel · 若变化返回新 level）
   */
  update(todayTotalMl) {
    const level = pickWaterLevel(todayTotalMl);
    if (level === this.currentLevel) return level;
    this.currentLevel = level;
    const suffix = LEVEL_FILES[level];
    this.target.style.backgroundImage = `url("${ASSET_DIR}bg-desktop-water-${suffix}.png")`;
    this.target.dataset.waterLevel = String(level);
    return level;
  }

  /**
   * 跨零点清零：切回空杯
   */
  reset() {
    this.currentLevel = -1;
    this.update(0);
  }
}
