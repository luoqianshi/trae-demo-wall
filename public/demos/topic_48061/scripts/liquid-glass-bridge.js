/* =========================================================
 * liquid-glass-bridge.js · 把根目录的两个 LiquidGlass 引擎
 * 桥接到 app-liquid.html，给项目里所有"玻璃容器"动态挂载滤镜。
 *
 * 设计目标：
 *   1. 不修改原 app.html / 原 scripts / 原 styles；
 *   2. 自动收集需要变成玻璃的元素（按 CSS 选择器）；
 *   3. 支持引擎切换（auto / svg / webgl / off）；
 *   4. 监听 router 切换 + DOM 变动，新加入的卡牌自动套样式；
 *   5. 提供右下角开关。
 * ========================================================= */

/* ---------- 1) 动态加载根目录的两个引擎脚本（IIFE，挂到 window.LiquidGlass） ---------- */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-lg-src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.dataset.lgSrc = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('load failed: ' + src));
    document.head.appendChild(s);
  });
}

await loadScript('liquid-glass.js');
await loadScript('liquid-glass-webgl.js');

const LG = window.LiquidGlass;
if (!LG) {
  console.warn('[LG bridge] LiquidGlass 未加载，退回到磨砂玻璃。');
}

/* ---------- 2) 哪些元素要变成玻璃？ ---------- */
const GLASS_SELECTORS = [
  '.panel',
  '.top-meta-card',
  '.card-back',
  '.card-front',
  '.draw-btn.btn-primary',
  '.btn-secondary',
  '.theme-seg',
  '.nav-item',
];

function collectTargets() {
  return Array.from(document.querySelectorAll(GLASS_SELECTORS.join(',')));
}

/* ---------- 3) 引擎管理 ---------- */
const instances = new WeakMap();   // el -> {destroy()}
let currentEngine = 'auto';        // auto / svg / webgl / off

function pickEngine() {
  if (currentEngine !== 'auto') return currentEngine;
  if (!LG || !LG.detect) return 'off';
  const cap = LG.detect();
  // 注意：detect() 实际返回 {svgBackdrop, webgl}，不是 {svg, webgl}
  if (cap.svgBackdrop) return 'svg';
  if (cap.webgl) return 'svg'; // bridge 没准备背景图，WebGL 也走 SVG 兜底；用户可在面板手动切到 webgl 试
  return 'off';
}

/** 为单个元素挂滤镜 */
function attach(el) {
  if (!LG) return;
  if (instances.has(el)) return; // 已挂过
  const engine = pickEngine();
  if (engine === 'off') return;

  // 不同元素用不同参数，让按钮的折射弱一点、面板的强一点
  const isButton = el.matches('.btn-primary, .btn-secondary, .nav-item');
  const opts = {
    strength: isButton ? 8 : 18,
    bezel: isButton ? 18 : 36,
    thickness: 80,
    ior: 1.8,
    blur: 0.4,
    saturate: 1.6,
    specular: 0.45,
  };

  try {
    let inst;
    if (engine === 'svg') {
      inst = LG.svg(el, opts);
    } else if (engine === 'webgl') {
      // WebGL 模式需要一张"背景图"做采样。
      // 这里把 body 的彩色渐变背景渲染成截图较麻烦，
      // 干脆传一个透明 1x1，让 WebGL 退化为半透明叠色——
      // 视觉上由 backdrop-filter 的磨砂 + 投影来撑场。
      inst = LG.webgl(el, opts, null);
    }
    if (inst) instances.set(el, inst);
  } catch (err) {
    console.warn('[LG bridge] attach failed:', err);
  }
}

/** 卸载单个 */
function detach(el) {
  const inst = instances.get(el);
  if (inst) {
    try { inst.destroy(); } catch (e) {}
    instances.delete(el);
  }
  // 清掉 inline 残留
  el.style.backdropFilter = '';
  el.style.webkitBackdropFilter = '';
}

/** 全量重建 */
function rebuildAll() {
  // 先清干净已有的
  collectTargets().forEach(detach);
  // 再按当前引擎重挂
  if (pickEngine() !== 'off') {
    collectTargets().forEach(attach);
  }
}

/* ---------- 4) 监听 DOM 变动 + 路由切换 ---------- */
const mo = new MutationObserver((muts) => {
  if (pickEngine() === 'off') return;
  for (const m of muts) {
    m.addedNodes.forEach((n) => {
      if (!(n instanceof HTMLElement)) return;
      if (n.matches?.(GLASS_SELECTORS.join(','))) attach(n);
      n.querySelectorAll?.(GLASS_SELECTORS.join(',')).forEach(attach);
    });
  }
});
mo.observe(document.body, { childList: true, subtree: true });

// 路由 hash 变更后，等下一帧重建（让 router 渲染完）
window.addEventListener('hashchange', () => {
  requestAnimationFrame(() => requestAnimationFrame(rebuildAll));
});

/* ---------- 5) 控制面板交互 ---------- */
const body = document.body;
const toggle = document.getElementById('lgDemoToggle');
const sel = document.getElementById('lgDemoEngine');

function applyOn(on) {
  body.dataset.lgOn = on ? '1' : '0';
  if (on) {
    rebuildAll();
  } else {
    collectTargets().forEach(detach);
  }
}

toggle?.addEventListener('change', () => applyOn(toggle.checked));
sel?.addEventListener('change', () => {
  currentEngine = sel.value;
  if (toggle?.checked) rebuildAll();
});

/* ---------- 6) 首次启动 ---------- */
// 等首屏渲染完再挂（router 用 hashchange 注入模板）
window.addEventListener('load', () => {
  // 给 router 一点时间渲染 #today 模板
  setTimeout(() => applyOn(true), 200);
});
