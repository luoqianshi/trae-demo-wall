/**
 * ui.js · 通用 UI 工具（动效 / 弹窗 / Toast）
 */
import { $, el, clamp, HP_MAX } from './utils.js';

let hpFrom = 0;
let hpRafId = null;

/** HP 数字+进度条同步缓动 */
export function animateHp(target, instant = false) {
  const $val = $('#hpVal');
  const $fill = $('#hpFill');
  if (!$val || !$fill) return;
  target = clamp(Number(target) || 0, 0, HP_MAX);
  if (instant) {
    hpFrom = target;
    $val.textContent = target;
    $fill.style.width = `${target}%`;
    return;
  }
  const from = parseFloat($val.textContent) || 0;
  const duration = 900;
  const start = performance.now();
  cancelAnimationFrame(hpRafId);
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const v = from + (target - from) * eased;
    $val.textContent = Math.round(v);
    $fill.style.width = `${clamp(v, 0, HP_MAX)}%`;
    if (t < 1) hpRafId = requestAnimationFrame(tick);
  };
  hpRafId = requestAnimationFrame(tick);
  hpFrom = target;
}

/** 飘字 +N HP */
export function popHpDelta(amount, anchorEl) {
  const host = anchorEl || $('.hp-panel');
  if (!host) return;
  const span = el('span', { class: 'hp-delta' }, `+${amount}`);
  // 定位：在 host 内的 hp-value 处
  const valBox = host.querySelector('.hp-value');
  if (valBox) {
    const rect = valBox.getBoundingClientRect();
    const parentRect = host.getBoundingClientRect();
    span.style.left = `${rect.left - parentRect.left + rect.width + 12}px`;
    span.style.top  = `${rect.top  - parentRect.top  + 8}px`;
  } else {
    span.style.left = '60%';
    span.style.top = '20%';
  }
  host.appendChild(span);
  setTimeout(() => span.remove(), 1300);
}

/** Toast */
let toastTimer = null;
export function toast(msg, kind = 'info') {
  let $t = $('#toastBox');
  if (!$t) {
    $t = el('div', { id: 'toastBox', class: 'toast' });
    document.body.appendChild($t);
  }
  $t.textContent = msg;
  $t.className = `toast show is-${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $t.classList.remove('show'); }, 2200);
}

/** Modal */
let modalMask = null;
export function openModal(contentNode) {
  closeModal();
  modalMask = el('div', { class: 'modal-mask', onClick: (e) => { if (e.target === modalMask) closeModal(); } }, [
    el('div', { class: 'modal-body', role: 'dialog' }, [
      el('button', { class: 'modal-close', 'aria-label': '关闭', onClick: closeModal }, '×'),
      contentNode,
    ]),
  ]);
  document.body.appendChild(modalMask);
  document.addEventListener('keydown', escClose);
}
export function closeModal() {
  if (modalMask) { modalMask.remove(); modalMask = null; }
  document.removeEventListener('keydown', escClose);
}
function escClose(e) { if (e.key === 'Escape') closeModal(); }

/** 礼花效果 */
export function confetti(count = 36) {
  const layer = el('div', { class: 'confetti' });
  const colors = ['#7CFFB2', '#FF9F7C', '#5DB4FF', '#C77DFF', '#FFD66B'];
  for (let i = 0; i < count; i++) {
    const piece = el('span');
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty('--x', `${(Math.random() - 0.5) * 200}px`);
    piece.style.animationDelay = `${Math.random() * 200}ms`;
    piece.style.animationDuration = `${1400 + Math.random() * 800}ms`;
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 2500);
}
