/* ============================================================
   toast.js — Toast 通知系统
   ============================================================ */

const Toast = (() => {
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function show(type, title, message, duration = 4000) {
    const c = getContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;

    const icons = {
      success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#10b981" stroke-width="2"/><path d="M6 10l3 3 5-5" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#ef4444" stroke-width="2"/><path d="M7 7l6 6M13 7l-6 6" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/></svg>',
      warning: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L2 18h16L10 2z" stroke="#f59e0b" stroke-width="2" stroke-linejoin="round"/><path d="M10 8v4M10 14v1" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#3b82f6" stroke-width="2"/><path d="M10 9v5M10 6v1" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/></svg>',
    };

    toast.innerHTML = `
      <span class="toast__icon">${icons[type] || icons.info}</span>
      <div class="toast__content">
        ${title ? `<div class="toast__title">${title}</div>` : ''}
        ${message ? `<div class="toast__message">${message}</div>` : ''}
      </div>
      <button class="toast__close" aria-label="关闭">&times;</button>
    `;

    toast.querySelector('.toast__close').addEventListener('click', () => {
      dismiss(toast);
    });

    c.appendChild(toast);

    // 强制重绘后触发动画
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
    });

    if (duration > 0) {
      setTimeout(() => dismiss(toast), duration);
    }

    return toast;
  }

  function dismiss(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }

  return {
    success: (title, msg, dur) => show('success', title, msg, dur),
    error: (title, msg, dur) => show('error', title, msg, dur),
    warning: (title, msg, dur) => show('warning', title, msg, dur),
    info: (title, msg, dur) => show('info', title, msg, dur),
  };
})();

window.Toast = Toast;