/**
 * utils.js · 通用工具函数（日期 / 数字 / DOM）
 */

export const HP_MAX = 100;

/** 今日 YYYY-MM-DD */
export const todayStr = () => fmtDate(new Date());

/** 任意日期 → YYYY-MM-DD */
export function fmtDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
export function pad2(n) { return String(n).padStart(2, '0'); }

/** 距 install 天数 */
export function daysSince(dateStr) {
  if (!dateStr) return 1;
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date(todayStr() + 'T00:00:00');
  return Math.max(1, Math.round((now - d) / 86400000) + 1);
}

/** 该日期所在周的周一 YYYY-MM-DD */
export function mondayOf(d) {
  const x = new Date(d);
  const day = x.getDay() || 7; // 周日 → 7
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - (day - 1));
  return x;
}

/** 昨日 YYYY-MM-DD */
export function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return fmtDate(d);
}

/** HP → 热力图色阶 0-4 */
export function hpLevel(hp) {
  if (hp <= 0) return 0;
  if (hp < 20) return 1;
  if (hp < 50) return 2;
  if (hp < 80) return 3;
  return 4;
}

/** mm:ss 格式化 */
export function fmtMmSs(sec) {
  sec = Math.max(0, Math.floor(sec));
  return `${pad2(Math.floor(sec / 60))}:${pad2(sec % 60)}`;
}

/** 中文日期文本（如：6月22日 星期一） */
export function cnDate(d = new Date()) {
  return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
}

/** clamp */
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/** 简单 DOM 工具 */
export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset' && typeof v === 'object') Object.entries(v).forEach(([dk, dv]) => node.dataset[dk] = dv);
    else if (k in node && k !== 'list') node[k] = v;
    else node.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c == null || c === false) return;
    if (typeof c === 'string' || typeof c === 'number') node.appendChild(document.createTextNode(String(c)));
    else node.appendChild(c);
  });
  return node;
}
