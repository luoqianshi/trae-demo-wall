// ColorFlow v5 - Theme Engine + Extractor
// 架构：Theme（独立） + Extract（数据采集） + 通过消息桥接

const STYLE_ID = 'cf-style';
const ROOT_CLASS = 'cf-theme-applied';
const DEBOUNCE_MS = 200;

let observer = null;
let debounceTimer = null;
let currentColors = null;

// ============================================================
// ========== THEME SYSTEM（独立运行） ==========
// ============================================================

function clearTheme() {
  const root = document.documentElement;
  root.classList.remove(ROOT_CLASS);
  ['--cf-bg','--cf-text','--cf-heading','--cf-button','--cf-accent'].forEach(v => root.style.removeProperty(v));
  const el = document.getElementById(STYLE_ID);
  if (el) el.remove();
  stopObserver();
}

function setCSSVars(colors) {
  const r = document.documentElement.style;
  r.setProperty('--cf-bg', colors.bg);
  r.setProperty('--cf-text', colors.text);
  r.setProperty('--cf-heading', colors.heading);
  r.setProperty('--cf-button', colors.button);
  r.setProperty('--cf-accent', colors.accent);
}

function buildThemeCSS() {
  const S = ROOT_CLASS;
  return `
/* === ColorFlow Theme Engine === */
.${S} { color: var(--cf-text) !important; }
.${S} html, .${S} body { background-color: var(--cf-bg) !important; }
.${S} #app, .${S} #root, .${S} #__next, .${S} #__nuxt,
.${S} main, .${S} [role="main"] {
  background-color: var(--cf-bg) !important; color: var(--cf-text) !important;
}
.${S} canvas, .${S} video, .${S} iframe,
.${S} [class*="hero"], .${S} [class*="Hero"],
.${S} [class*="banner"], .${S} [class*="Banner"],
.${S} [class*="cover"], .${S} [class*="bg-"],
.${S} [class*="background"], .${S} [class*="Background"],
.${S} [class*="jumbo"], .${S} [class*="splash"],
.${S} [class*="parallax"], .${S} [class*="overlay"] {
  background: none !important; background-color: transparent !important;
}
.${S} h1, .${S} h2, .${S} h3, .${S} h4, .${S} h5, .${S} h6,
.${S} [class*="title"], .${S} [class*="heading"] { color: var(--cf-heading) !important; }
.${S} p, .${S} span, .${S} li, .${S} td, .${S} th,
.${S} label, .${S} legend, .${S} dd, .${S} dt,
.${S} figcaption, .${S} summary, .${S} blockquote { color: var(--cf-text) !important; }
.${S} a, .${S} [role="link"] { color: var(--cf-button) !important; }
.${S} button, .${S} [role="button"],
.${S} input[type="submit"], .${S} input[type="button"],
.${S} input[type="reset"], .${S} .btn {
  color: var(--cf-text) !important; border-color: var(--cf-button) !important;
}
.${S} .btn-primary, .${S} [class*="primary"].btn {
  background-color: var(--cf-button) !important; color: #fff !important;
}
.${S} input, .${S} textarea, .${S} select {
  -webkit-appearance: auto !important; appearance: auto !important;
  background-color: color-mix(in srgb, var(--cf-bg) 92%, #000) !important;
  color: var(--cf-text) !important;
  border: 1px solid color-mix(in srgb, var(--cf-text) 20%, transparent) !important;
}
.${S} input:focus, .${S} textarea:focus, .${S} select:focus {
  outline: none !important; border-color: var(--cf-button) !important;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--cf-button) 25%, transparent) !important;
}
.${S} input::placeholder, .${S} textarea::placeholder {
  color: color-mix(in srgb, var(--cf-text) 55%, transparent) !important;
}
.${S} form, .${S} fieldset,
.${S} [class*="search"], .${S} [class*="input-wrapper"] {
  background: transparent !important; background-color: transparent !important;
}
.${S} svg { fill: currentColor !important; stroke: currentColor !important; background: transparent !important; }
.${S} i, .${S} .icon, .${S} .fa, .${S} .fas, .${S} .far, .${S} .fab,
.${S} [class*="icon-"], .${S} [class*="-icon"], .${S} [class*="Icon"], .${S} [data-icon] {
  color: var(--cf-text) !important; background: transparent !important;
}
.${S} img, .${S} [class*="avatar"], .${S} [class*="logo"], .${S} picture {
  background: transparent !important; filter: none !important;
}
.${S} [style*="mask"], .${S} [class*="mask"] {
  background-color: var(--cf-text) !important;
  -webkit-mask-size: contain !important; mask-size: contain !important;
}
.${S} ::-webkit-scrollbar { width: 8px; height: 8px; }
.${S} ::-webkit-scrollbar-track { background: color-mix(in srgb, var(--cf-bg) 95%, #000) !important; }
.${S} ::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--cf-text) 25%, transparent) !important; border-radius: 999px; }
`;
}

function injectStyle() {
  let el = document.getElementById(STYLE_ID);
  if (el) { el.textContent = buildThemeCSS(); return el; }
  el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = buildThemeCSS();
  document.head.appendChild(el);
  return el;
}

function handleIframes() {
  document.querySelectorAll('iframe').forEach(iframe => {
    try {
      const doc = iframe.contentDocument;
      if (!doc || !doc.documentElement) return;
      if (document.documentElement.classList.contains(ROOT_CLASS)) {
        doc.documentElement.classList.add(ROOT_CLASS);
        const r = doc.documentElement.style;
        r.setProperty('--cf-bg', currentColors.bg);
        r.setProperty('--cf-text', currentColors.text);
        r.setProperty('--cf-heading', currentColors.heading);
        r.setProperty('--cf-button', currentColors.button);
        r.setProperty('--cf-accent', currentColors.accent);
        if (!doc.getElementById(STYLE_ID)) {
          const s = doc.createElement('style');
          s.id = STYLE_ID; s.textContent = buildThemeCSS(); doc.head.appendChild(s);
        }
      } else {
        doc.documentElement.classList.remove(ROOT_CLASS);
        ['--cf-bg','--cf-text','--cf-heading','--cf-button','--cf-accent'].forEach(v => doc.documentElement.style.removeProperty(v));
        const s = doc.getElementById(STYLE_ID); if (s) s.remove();
      }
    } catch (e) {}
  });
}

function startObserver() {
  if (observer) return;
  observer = new MutationObserver(() => {
    if (!document.documentElement.classList.contains(ROOT_CLASS)) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(handleIframes, DEBOUNCE_MS);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
}

function stopObserver() {
  if (observer) { observer.disconnect(); observer = null; }
  clearTimeout(debounceTimer);
}

function applyTheme(colors) {
  clearTheme();
  currentColors = colors;
  setCSSVars(colors);
  injectStyle();
  document.documentElement.classList.add(ROOT_CLASS);
  handleIframes();
  startObserver();
  return true;
}

function revertTheme() {
  clearTheme();
  currentColors = null;
  return true;
}

// ============================================================
// ========== EXTRACT SYSTEM（数据采集） ==========
// ============================================================
// 输出标准：ExtractResult

function rgbToHex(rgb) {
  if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return null;
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return '#' + [m[1], m[2], m[3]].map(c => (+c).toString(16).padStart(2, '0')).join('');
}

function colorDistance(hex1, hex2) {
  if (!hex1 || !hex2) return 1000;
  const r1 = parseInt(hex1.slice(1, 3), 16), g1 = parseInt(hex1.slice(3, 5), 16), b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16), g2 = parseInt(hex2.slice(3, 5), 16), b2 = parseInt(hex2.slice(5, 7), 16);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function classifyColor(hex, source, cs) {
  // 分类颜色类型
  const bg = rgbToHex(cs.backgroundColor);
  const text = rgbToHex(cs.color);
  const border = rgbToHex(cs.borderColor);

  if (source === 'background' || (bg && hex === bg)) return 'background';
  if (source === 'text' || (text && hex === text)) return 'text';
  if (border && hex === border) return 'border';
  return 'accent';
}

function calculateWeight(el, type) {
  // 权重计算：基于元素重要性
  let w = 0.3;
  const tag = el.tagName.toLowerCase();
  const cls = (el.className || '').toString().toLowerCase();
  const id = (el.id || '').toLowerCase();

  // 标签权重
  if (tag === 'body') w += type === 'background' ? 0.5 : 0.3;
  if (tag === 'button' || tag === 'a') w += 0.3;
  if (tag === 'h1' || tag === 'h2') w += 0.2;
  if (tag === 'header' || tag === 'nav') w += 0.2;
  if (tag === 'main') w += 0.2;

  // class/id 语义权重
  const semantic = ['primary', 'accent', 'brand', 'main', 'hero', 'cta', 'action', 'btn', 'button', 'nav', 'header', 'logo'];
  semantic.forEach(s => {
    if (cls.includes(s) || id.includes(s)) w += 0.15;
  });

  // 元素大小权重（面积大 = 更重要）
  const rect = el.getBoundingClientRect();
  const area = rect.width * rect.height;
  const pageArea = window.innerWidth * window.innerHeight;
  if (area > 0 && pageArea > 0) {
    const ratio = area / pageArea;
    if (ratio > 0.1) w += 0.2;
    else if (ratio > 0.05) w += 0.1;
  }

  return Math.min(1, Math.round(w * 100) / 100);
}

function deduplicateColors(colorEntries) {
  // 去重：相同色值只保留权重最高的
  const map = new Map();
  for (const entry of colorEntries) {
    const key = entry.value.toLowerCase();
    if (!map.has(key) || map.get(key).weight < entry.weight) {
      map.set(key, entry);
    }
  }
  return [...map.values()];
}

function extractPageColors() {
  const colorEntries = [];

  // 1. body 背景 + 文字
  const body = document.body;
  if (body) {
    const cs = getComputedStyle(body);
    const bg = rgbToHex(cs.backgroundColor);
    const text = rgbToHex(cs.color);
    if (bg && bg !== '#00000000' && bg !== '#ffffff' || bg === '#ffffff') {
      colorEntries.push({ value: bg || '#ffffff', type: 'background', weight: calculateWeight(body, 'background') });
    }
    if (text) {
      colorEntries.push({ value: text, type: 'text', weight: calculateWeight(body, 'text') });
    }
  }

  // 2. 按钮
  document.querySelectorAll('button, [role="button"], input[type="submit"], .btn, [class*="button"]').forEach(el => {
    const cs = getComputedStyle(el);
    const bg = rgbToHex(cs.backgroundColor);
    if (bg && bg !== 'transparent') {
      colorEntries.push({ value: bg, type: 'accent', weight: calculateWeight(el, 'accent') });
    }
  });

  // 3. 链接
  document.querySelectorAll('a[href]').forEach(el => {
    const cs = getComputedStyle(el);
    const color = rgbToHex(cs.color);
    if (color) {
      colorEntries.push({ value: color, type: 'accent', weight: calculateWeight(el, 'accent') });
    }
  });

  // 4. 标题
  document.querySelectorAll('h1, h2, h3').forEach(el => {
    const cs = getComputedStyle(el);
    const color = rgbToHex(cs.color);
    if (color) {
      colorEntries.push({ value: color, type: 'text', weight: calculateWeight(el, 'text') });
    }
  });

  // 5. 导航/头部
  document.querySelectorAll('header, nav, [class*="header"], [class*="nav"]').forEach(el => {
    const cs = getComputedStyle(el);
    const bg = rgbToHex(cs.backgroundColor);
    if (bg && bg !== 'transparent') {
      colorEntries.push({ value: bg, type: 'background', weight: calculateWeight(el, 'background') });
    }
  });

  return deduplicateColors(colorEntries).sort((a, b) => b.weight - a.weight);
}

function extractIcons() {
  const icons = [];

  // SVG 图标
  document.querySelectorAll('svg').forEach(svg => {
    const rect = svg.getBoundingClientRect();
    if (rect.width < 5 || rect.height < 5 || rect.width > 200 || rect.height > 200) return;
    const source = svg.closest('header') ? 'header' : svg.closest('footer') ? 'footer' : svg.closest('button') ? 'button' : 'body';
    icons.push({ type: 'svg', value: svg.outerHTML.slice(0, 200), source });
  });

  // IMG 图标（头像、logo、favicon）
  document.querySelectorAll('img[src]').forEach(img => {
    const cls = (img.className || '').toString().toLowerCase();
    const alt = (img.alt || '').toLowerCase();
    const isIcon = cls.includes('icon') || cls.includes('logo') || cls.includes('avatar') ||
                   alt.includes('icon') || alt.includes('logo') ||
                   img.width <= 64 || img.height <= 64;
    if (!isIcon) return;
    const source = img.closest('header') ? 'header' : img.closest('footer') ? 'footer' : 'body';
    icons.push({ type: 'img', value: img.src, source });
  });

  // Icon Font
  document.querySelectorAll('i[class*="fa-"], i[class*="icon-"], i[class*="material"], span[class*="icon"]').forEach(el => {
    const cls = el.className;
    const source = el.closest('header') ? 'header' : el.closest('footer') ? 'footer' : 'button' ? 'button' : 'body';
    icons.push({ type: 'font', value: cls.toString().slice(0, 100), source });
  });

  // Favicon
  const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
  if (favicon) {
    icons.push({ type: 'img', value: favicon.href, source: 'favicon' });
  }

  return icons.slice(0, 30); // 限制数量
}

function extractPage() {
  const url = window.location.href;
  const colors = extractPageColors();
  const icons = extractIcons();
  return {
    url,
    colors,
    icons,
    timestamp: Date.now()
  };
}

// ============================================================
// ========== 消息监听 ==========
// ============================================================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  try {
    switch (msg.type) {
      case 'APPLY_COLORS':
        sendResponse({ success: applyTheme(msg.colors) });
        break;
      case 'REVERT_COLORS':
        sendResponse({ success: revertTheme() });
        break;
      case 'GET_STATUS':
        sendResponse({ hasAppliedColors: document.documentElement.classList.contains(ROOT_CLASS) });
        break;
      case 'EXTRACT_PAGE':
        sendResponse({ result: extractPage() });
        break;
      case 'GENERATE_THEME':
        // Bridge: ExtractResult → Theme colors
        const theme = generateThemeFromExtract(msg.extractResult);
        sendResponse({ colors: theme });
        break;
    }
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
  return true;
});

// ============================================================
// ========== BRIDGE：ExtractResult → Theme ==========
// ============================================================
function generateThemeFromExtract(result) {
  if (!result || !result.colors || result.colors.length === 0) {
    return { bg: '#ffffff', text: '#333333', heading: '#111827', button: '#3b82f6', accent: '#3b82f6' };
  }

  const byType = {};
  result.colors.forEach(c => {
    if (!byType[c.type]) byType[c.type] = [];
    byType[c.type].push(c);
  });

  // 按权重取最高
  const getBest = (type) => byType[type]?.sort((a, b) => b.weight - a.weight)[0]?.value;
  const bg = getBest('background') || '#ffffff';
  const text = getBest('text') || '#333333';
  const accent = getBest('accent') || getBest('border') || '#3b82f6';

  // heading = text 的加深版
  const heading = darkenHex(text, 30);
  // button = accent
  const button = accent;

  return { bg, text, heading, button, accent };
}

function darkenHex(hex, percent) {
  if (!hex || hex.length < 7) return hex;
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, Math.round(r * (1 - percent / 100)));
  g = Math.max(0, Math.round(g * (1 - percent / 100)));
  b = Math.max(0, Math.round(b * (1 - percent / 100)));
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}
