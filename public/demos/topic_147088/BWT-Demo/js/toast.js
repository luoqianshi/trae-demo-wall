/**
 * BWT Demo - Global Toast Notification System
 * Usage: showToast(message, type) — type: 'success' | 'error' | 'warning' | 'info'
 */
(function () {
  'use strict';

  var TOAST_ICONS = {
    success: '\u2713', // ✓
    error:   '\u2717', // ✗
    warning: '!',
    info:    '\u2139'  // ℹ
  };

  var TOAST_COLORS = {
    success: 'var(--bwt-primary)',
    error:   'var(--bwt-danger)',
    warning: 'var(--bwt-warning)',
    info:    '#7B829E'
  };

  var container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.id = 'bwt-toast-container';
      container.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column-reverse;gap:8px;align-items:center;pointer-events:none;';
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(message, type) {
    type = type || 'info';
    var icon = TOAST_ICONS[type] || TOAST_ICONS.info;
    var color = TOAST_COLORS[type] || TOAST_COLORS.info;

    var toast = document.createElement('div');
    toast.style.cssText =
      'display:flex;align-items:center;gap:10px;padding:12px 20px;' +
      'background-color:var(--bwt-card);border:1px solid var(--bwt-border);' +
      'border-radius:var(--bwt-radius-md);color:var(--bwt-text);' +
      'font-family:var(--bwt-font-body);font-size:14px;line-height:1.5;' +
      'box-shadow:0 4px 12px rgba(0,0,0,0.3);pointer-events:auto;' +
      'opacity:0;transform:translateY(12px);transition:opacity 0.3s ease, transform 0.3s ease;';

    // Icon
    var iconEl = document.createElement('span');
    iconEl.textContent = icon;
    iconEl.style.cssText =
      'width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;' +
      'font-size:13px;font-weight:700;flex-shrink:0;' +
      'background-color:' + color + '20;color:' + color + ';';
    toast.appendChild(iconEl);

    // Message
    var msgEl = document.createElement('span');
    msgEl.textContent = message;
    toast.appendChild(msgEl);

    getContainer().appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(function () {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    // Auto remove after 3 seconds
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // Expose globally
  window.showToast = showToast;
})();
