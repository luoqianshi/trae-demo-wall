/**
 * modal.js - 弹窗组件
 * Creates and manages modal dialogs with confirmation and custom content modes.
 */
const Modal = {
  // Track active modal overlays
  _overlays: [],

  /**
   * Internal: create modal element
   * @param {Object} options - modal options
   * @param {string} options.title - modal title
   * @param {string} options.content - HTML content for modal body
   * @param {string} [options.confirmText='确定'] - confirm button text
   * @param {string} [options.cancelText='取消'] - cancel button text
   * @param {Function} [options.onConfirm] - confirm callback
   * @param {Function} [options.onCancel] - cancel callback
   * @param {boolean} [options.danger=false] - if true, style confirm button as danger
   * @returns {HTMLElement} modal overlay element
   */
  _create(options) {
    const {
      title = '',
      content = '',
      confirmText = '确定',
      cancelText = '取消',
      onConfirm = null,
      onCancel = null,
      danger = false
    } = options || {};

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.25s ease;
      padding: 16px;
      box-sizing: border-box;
    `;

    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'modal-container';
    modal.style.cssText = `
      background: #fff;
      border-radius: 12px;
      width: 100%;
      max-width: 340px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      transform: scale(0.9) translateY(10px);
      transition: transform 0.25s ease;
      overflow: hidden;
    `;

    // Build header
    let html = '';

    if (title) {
      html += `
        <div style="
          padding: 20px 20px 0 20px;
          font-size: 17px;
          font-weight: 600;
          color: #1a1a2e;
          line-height: 1.4;
        ">${this._escapeHtml(title)}</div>`;
    }

    // Build body
    html += `
      <div style="
        padding: 12px 20px 20px 20px;
        font-size: 14px;
        color: #555;
        line-height: 1.6;
      ">${content}</div>`;

    // Build footer with buttons
    const confirmBtnStyle = danger
      ? `background: #e74c3c; color: #fff;`
      : `background: #4a90d9; color: #fff;`;

    html += `
      <div style="
        display: flex;
        border-top: 1px solid #f0f0f0;
      ">
        <button class="modal-btn-cancel" style="
          flex: 1;
          padding: 14px 0;
          border: none;
          background: #fff;
          font-size: 16px;
          color: #888;
          cursor: pointer;
          border-right: 1px solid #f0f0f0;
          -webkit-tap-highlight-color: transparent;
        ">${this._escapeHtml(cancelText)}</button>
        <button class="modal-btn-confirm" style="
          flex: 1;
          padding: 14px 0;
          border: none;
          ${confirmBtnStyle}
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        ">${this._escapeHtml(confirmText)}</button>
      </div>`;

    modal.innerHTML = html;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Track this overlay
    this._overlays.push(overlay);

    // Trigger enter animation
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      modal.style.transform = 'scale(1) translateY(0)';
    });

    // Button handlers
    const cancelBtn = modal.querySelector('.modal-btn-cancel');
    const confirmBtn = modal.querySelector('.modal-btn-confirm');

    const closeModal = (confirmed) => {
      overlay.style.opacity = '0';
      modal.style.transform = 'scale(0.9) translateY(10px)';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        const idx = this._overlays.indexOf(overlay);
        if (idx > -1) this._overlays.splice(idx, 1);
      }, 250);

      if (confirmed && typeof onConfirm === 'function') {
        onConfirm();
      } else if (!confirmed && typeof onCancel === 'function') {
        onCancel();
      }
    };

    cancelBtn.addEventListener('click', () => closeModal(false));
    confirmBtn.addEventListener('click', () => closeModal(true));

    // Close on overlay click (outside modal)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(false);
      }
    });

    return overlay;
  },

  /**
   * Show a confirmation dialog
   * @param {Object} options - modal options
   * @param {string} options.title - modal title
   * @param {string} options.message - confirmation message text
   * @param {string} [options.confirmText='确定'] - confirm button text
   * @param {string} [options.cancelText='取消'] - cancel button text
   * @param {boolean} [options.danger=false] - if true, style as danger dialog
   * @returns {Promise<boolean>} resolves to true (confirmed) or false (cancelled)
   */
  confirm(options) {
    return new Promise((resolve) => {
      const {
        title = '确认',
        message = '',
        confirmText = '确定',
        cancelText = '取消',
        danger = false
      } = options || {};

      this._create({
        title,
        content: `<p>${this._escapeHtml(message)}</p>`,
        confirmText,
        cancelText,
        danger,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  },

  /**
   * Show a custom modal with HTML content
   * @param {Object} options - modal options
   * @param {string} options.title - modal title
   * @param {string} options.content - HTML string for modal body
   * @param {string} [options.confirmText='确定'] - confirm button text
   * @param {string} [options.cancelText='取消'] - cancel button text
   * @param {Function} [options.onConfirm] - confirm callback
   * @param {Function} [options.onCancel] - cancel callback
   */
  custom(options) {
    this._create(options || {});
  },

  /**
   * Close all open modals
   */
  closeAll() {
    const overlays = [...this._overlays];
    overlays.forEach(overlay => {
      const modal = overlay.querySelector('.modal-container');
      if (modal) {
        overlay.style.opacity = '0';
        modal.style.transform = 'scale(0.9) translateY(10px)';
      }
    });
    setTimeout(() => {
      overlays.forEach(overlay => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      });
      this._overlays = [];
    }, 250);
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
