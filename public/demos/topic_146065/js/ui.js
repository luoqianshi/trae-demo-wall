/* ========== ui.js — UI 工具（Toast、确认弹窗、日期格式化） ========== */

const UI = (() => {
  'use strict';

  let toastTimer = null;

  // Toast 提示
  function toast(message, duration) {
    duration = duration || 1500;
    // 移除已有 toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    if (toastTimer) clearTimeout(toastTimer);

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.querySelector('.phone-frame').appendChild(toast);

    toastTimer = setTimeout(() => {
      toast.remove();
    }, duration);
  }

  // 确认弹窗
  function confirm(options) {
    const { title, desc, confirmText, cancelText, danger, onConfirm, onCancel } = options;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog';
    dialog.innerHTML = `
      <div class="modal-title">${FoodCard.escapeHtml(title || '确认')}</div>
      ${desc ? `<div class="modal-desc">${FoodCard.escapeHtml(desc)}</div>` : ''}
      <div class="modal-actions">
        <div class="modal-btn cancel">${FoodCard.escapeHtml(cancelText || '取消')}</div>
        <div class="modal-btn confirm${danger ? ' danger' : ''}">${FoodCard.escapeHtml(confirmText || '确定')}</div>
      </div>`;

    overlay.appendChild(dialog);
    document.querySelector('.phone-frame').appendChild(overlay);

    // 取消
    dialog.querySelector('.cancel').addEventListener('click', () => {
      overlay.remove();
      if (onCancel) onCancel();
    });

    // 确认
    dialog.querySelector('.confirm').addEventListener('click', () => {
      overlay.remove();
      if (onConfirm) onConfirm();
    });

    // 点击遮罩取消
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        if (onCancel) onCancel();
      }
    });
  }

  // 格式化日期
  function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);

    if (days === 0) {
      const hours = Math.floor(diff / 3600000);
      if (hours === 0) {
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return '刚刚';
        return `${mins}分钟前`;
      }
      return `${hours}小时前`;
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${date.getFullYear()}-${month}-${day}`;
    }
  }

  // 格式化完整日期时间
  function formatDateTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day} ${hours}:${mins}`;
  }

  // 更新状态栏时间
  function updateStatusBarTime() {
    const timeEl = document.querySelector('.status-bar .time');
    if (timeEl) {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      timeEl.textContent = `${h}:${m}`;
    }
  }

  return {
    toast,
    confirm,
    formatDate,
    formatDateTime,
    updateStatusBarTime
  };
})();
