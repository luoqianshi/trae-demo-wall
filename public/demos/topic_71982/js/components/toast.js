/**
 * toast.js - 提示组件
 * Displays brief notification messages that auto-dismiss.
 */
const Toast = {
  // Currently active toast element
  _currentToast: null,
  // Currently active timeout
  _currentTimeout: null,

  /**
   * Show toast message
   * @param {string} message - message text to display
   * @param {string} type - toast type: 'success' | 'error' | 'warning' | 'info'
   * @param {number} duration - display duration in milliseconds (default 2000)
   */
  show(message, type = 'success', duration = 2000) {
    // Remove existing toast if any
    this._removeCurrent();

    // Map type to icon and background color
    const config = {
      success: { icon: '&#10003;', bg: '#2ecc71', color: '#fff' },
      error:   { icon: '&#10007;', bg: '#e74c3c', color: '#fff' },
      warning: { icon: '&#9888;',  bg: '#f39c12', color: '#fff' },
      info:    { icon: '&#8505;',  bg: '#4a90d9', color: '#fff' }
    };

    const c = config[type] || config.info;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.style.cssText = `
      position: fixed;
      top: 60px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      padding: 10px 20px;
      border-radius: 8px;
      background: ${c.bg};
      color: ${c.color};
      font-size: 14px;
      line-height: 1.5;
      z-index: 20000;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      opacity: 0;
      transition: opacity 0.3s ease, transform 0.3s ease;
      max-width: 80vw;
      text-align: center;
      pointer-events: none;
      white-space: nowrap;
    `;

    toast.innerHTML = `
      <span style="font-size: 16px; flex-shrink: 0;">${c.icon}</span>
      <span>${this._escapeHtml(message)}</span>
    `;

    document.body.appendChild(toast);
    this._currentToast = toast;

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Auto-dismiss after duration
    this._currentTimeout = setTimeout(() => {
      this._removeCurrent();
    }, duration);
  },

  /**
   * Remove the current toast element with exit animation
   */
  _removeCurrent() {
    // Clear pending timeout
    if (this._currentTimeout) {
      clearTimeout(this._currentTimeout);
      this._currentTimeout = null;
    }

    // Animate out and remove
    if (this._currentToast) {
      const toast = this._currentToast;
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
      this._currentToast = null;
    }
  },

  /**
   * Show success toast
   * @param {string} message - message text
   */
  success(message) {
    this.show(message, 'success');
  },

  /**
   * Show error toast
   * @param {string} message - message text
   */
  error(message) {
    this.show(message, 'error');
  },

  /**
   * Show warning toast
   * @param {string} message - message text
   */
  warning(message) {
    this.show(message, 'warning');
  },

  /**
   * Show info toast
   * @param {string} message - message text
   */
  info(message) {
    this.show(message, 'info');
  },

  /**
   * Escape HTML special characters to prevent XSS
   * @param {string} str - string to escape
   * @returns {string} escaped string
   */
  _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
};
