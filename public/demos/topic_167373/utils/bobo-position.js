// utils/bobo-position.js
// V0.2.0-fix：波波立绘位置计算与边界保护（首页日历页）
//
// 抽出为可测纯函数，避免直接依赖 Page `this` 上下文
//  - DEFAULT_BOBO_SIZE_RPX：与 home.js BOBO_SIZE_RPX 保持一致
//  - SCREEN_WIDTH_RPX：小程序 rpx 自适应，固定 750
//  - SAFE_TOP_RPX：状态栏下方最小留白
//  - SAFE_BOTTOM_RESERVE_RPX：tabBar + FAB dock + 缓冲（≈280rpx）
//
// 输入输出单位均为 rpx（与 home.js boboStyle 一致）

const DEFAULT_BOBO_SIZE_RPX = 192;
const SCREEN_WIDTH_RPX = 750;
const SAFE_TOP_RPX = 40;
const SAFE_BOTTOM_RESERVE_RPX = 280;

/**
 * 计算屏幕高度（rpx）。
 * 入参 sysInfo 形如 wx.getSystemInfoSync() 的返回；
 *   - windowWidth 物理像素（px）
 *   - windowHeight 物理像素（px）
 * rpx 换算：1rpx = (windowWidth / 750) px → 1px = 750 / windowWidth rpx
 */
function calcScreenHeightRpx(sysInfo) {
  const w = (sysInfo && sysInfo.windowWidth) || 375;
  const h = (sysInfo && sysInfo.windowHeight) || 667;
  return h * (750 / w);
}

/**
 * 边界保护：把 (x, y) 夹到屏幕合法区域内。
 * @param {number} x
 * @param {number} y
 * @param {object} [opts]
 * @param {number} [opts.boboSize=192]  波波尺寸（rpx）
 * @param {number} [opts.screenHeightRpx]  屏幕高度（rpx），不传则按 667px 兜底
 * @returns {{x:number, y:number}}
 */
function clampBoboPosition(x, y, opts) {
  const o = opts || {};
  const boboSize = o.boboSize != null && isFinite(o.boboSize) ? o.boboSize : DEFAULT_BOBO_SIZE_RPX;
  const screenH = o.screenHeightRpx != null && isFinite(o.screenHeightRpx)
    ? o.screenHeightRpx
    : calcScreenHeightRpx({ windowHeight: 667, windowWidth: 375 });

  const minX = 0;
  const maxX = SCREEN_WIDTH_RPX - boboSize;
  const minY = SAFE_TOP_RPX;
  const maxY = screenH - SAFE_BOTTOM_RESERVE_RPX - boboSize;
  const cx = Math.max(minX, Math.min(maxX, Number(x) || 0));
  const cy = Math.max(minY, Math.min(maxY, Number(y) || 0));
  return { x: cx, y: cy };
}

/**
 * 解析 AppSettings.boboPosition；非法值返回 null。
 * 入参接受：
 *   - null / undefined → null
 *   - {x, y} 数字 → 数字（未做边界裁剪）
 *   - 其它 → null
 */
function parseBoboPosition(pos) {
  if (pos == null) return null;
  if (typeof pos !== 'object') return null;
  const x = Number(pos.x);
  const y = Number(pos.y);
  if (!isFinite(x) || !isFinite(y)) return null;
  return { x, y };
}

/**
 * 屏幕坐标 px → rpx（用于 touch 事件 clientX/Y）
 * @param {number} px
 * @param {number} windowWidthPx  物理像素宽度，默认 375
 */
function pxToRpx(px, windowWidthPx) {
  const w = windowWidthPx || 375;
  return (Number(px) || 0) * (750 / w);
}

/**
 * 组合：夹取 (clientX, clientY) 对应的 rpx 落点（用于 onBoboTouchMove）
 * @param {number} startClientX
 * @param {number} startClientY
 * @param {number} curClientX
 * @param {number} curClientY
 * @param {number} originLeftRpx
 * @param {number} originTopRpx
 * @param {object} [opts]  { boboSize, screenHeightRpx, windowWidthPx }
 */
function moveDeltaToRpx(startClientX, startClientY, curClientX, curClientY, originLeftRpx, originTopRpx, opts) {
  const o = opts || {};
  const w = (o.windowWidthPx || (o.sysInfo && o.sysInfo.windowWidth) || 375);
  const dx = pxToRpx(curClientX - startClientX, w);
  const dy = pxToRpx(curClientY - startClientY, w);
  return clampBoboPosition(originLeftRpx + dx, originTopRpx + dy, {
    boboSize: o.boboSize,
    screenHeightRpx: o.screenHeightRpx
  });
}

/**
 * 判断触摸位移是否超过拖动阈值（8rpx）
 */
function isOverDragThreshold(deltaXrpx, deltaYrpx, thresholdRpx) {
  const t = thresholdRpx != null ? thresholdRpx : 8;
  return Math.abs(Number(deltaXrpx) || 0) > t || Math.abs(Number(deltaYrpx) || 0) > t;
}

module.exports = {
  DEFAULT_BOBO_SIZE_RPX,
  SCREEN_WIDTH_RPX,
  SAFE_TOP_RPX,
  SAFE_BOTTOM_RESERVE_RPX,
  calcScreenHeightRpx,
  clampBoboPosition,
  parseBoboPosition,
  pxToRpx,
  moveDeltaToRpx,
  isOverDragThreshold
};
