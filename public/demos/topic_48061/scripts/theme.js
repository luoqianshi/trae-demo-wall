/**
 * theme.js · 主题管理器（Dark / Light / Auto）
 * ---------------------------------------------------------
 * 与 styles/theme.css 配套：
 *   - <html data-theme="dark|light|auto">
 *   - 当 data-theme="auto" 时，根据系统 prefers-color-scheme 给 <html> 加
 *     额外类名 .is-light-system / .is-dark-system，让 CSS 媒体查询完全失效
 *     转由 JS 控制（避免 CSS 媒体查询和强制覆盖之间的冲突）。
 *
 * 必须在 module 之外、CSS 之前由 inline-script 调用 applyStoredTheme() 一次，
 * 用于消除「白闪」（FOUC）。inline-script 写在 HTML 顶端。
 */

const STORAGE_KEY = 'heal-theme';
const VALID = new Set(['dark', 'light', 'auto']);
const mql = typeof matchMedia === 'function'
    ? matchMedia('(prefers-color-scheme: light)')
    : null;

/** 读取持久化主题（默认 auto）。可在 inline script 内安全调用。 */
export function readStoredTheme() {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        return VALID.has(v) ? v : 'auto';
    } catch (_) {
        return 'auto';
    }
}

/** 立即把 data-theme 与 is-light-system 类应用到 <html>。无副作用。 */
export function applyTheme(theme) {
    const html = document.documentElement;
    const t = VALID.has(theme) ? theme : 'auto';
    html.setAttribute('data-theme', t);

    const isLightSystem = !!(mql && mql.matches);
    html.classList.toggle('is-light-system', t === 'auto' && isLightSystem);
    html.classList.toggle('is-dark-system', t === 'auto' && !isLightSystem);
}

/** 仅写入 localStorage + applyTheme + 派发自定义事件（供 UI 同步高亮）。 */
export function setTheme(theme) {
    const t = VALID.has(theme) ? theme : 'auto';
    try { localStorage.setItem(STORAGE_KEY, t); } catch (_) { }
    applyTheme(t);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: t } }));
}

/** 当前生效的主题（'dark' | 'light' | 'auto'）。 */
export function getTheme() {
    return readStoredTheme();
}

/** 实际渲染的色板（auto 会展开为 dark 或 light）。 */
export function getResolvedTheme() {
    const t = readStoredTheme();
    if (t !== 'auto') return t;
    return mql && mql.matches ? 'light' : 'dark';
}

/** 循环切换 auto → light → dark → auto。 */
export function cycleTheme() {
    const order = ['auto', 'light', 'dark'];
    const cur = readStoredTheme();
    const next = order[(order.indexOf(cur) + 1) % order.length];
    setTheme(next);
    return next;
}

/**
 * 启动主题系统：
 *   1. 应用持久化主题
 *   2. 监听系统色彩偏好（仅 auto 模式下重新计算）
 */
export function initTheme() {
    applyTheme(readStoredTheme());

    if (mql && typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', () => {
            if (readStoredTheme() === 'auto') applyTheme('auto');
        });
    }
}

/** 给小按钮显示的图标。 */
export function themeIcon(theme) {
    return theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🌗';
}

/** 给提示文案。 */
export function themeLabel(theme) {
    return theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '跟随系统';
}

/**
 * 测量分段控件每个按钮的 .ts-label 自然宽度，写入按钮的 --label-w CSS 变量。
 * 这样 CSS 端的 width 过渡就能用精确像素值，避开 width:auto 不可过渡的限制，
 * 同时不需要在动画过程中反复测量文字宽度。
 *
 * 仅在初始化（DOM 就绪后）和窗口字号/缩放变化后调用一次即可。
 */
export function measureSegLabels(seg) {
    if (!seg) return;
    const btns = seg.querySelectorAll('.theme-seg-btn');
    btns.forEach(btn => {
        const label = btn.querySelector('.ts-label');
        if (!label) return;
        // 临时把 label 强制展开，量真实宽度，再还原
        const prevWidth = label.style.width;
        const prevOpacity = label.style.opacity;
        const prevPadding = label.style.paddingLeft;
        label.style.width = 'auto';
        label.style.opacity = '0';
        label.style.paddingLeft = '0';
        const w = Math.ceil(label.getBoundingClientRect().width);
        label.style.width = prevWidth;
        label.style.opacity = prevOpacity;
        label.style.paddingLeft = prevPadding;
        btn.style.setProperty('--label-w', `${w}px`);
    });
}
