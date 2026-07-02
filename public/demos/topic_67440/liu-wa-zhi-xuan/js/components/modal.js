(function(window) {
  const Modal = {
    overlay: null,
    container: null,
    isOpen: false,
    _confirmHandler: null,
    _cancelHandler: null,

    init() {
      this.overlay = document.createElement('div');
      this.overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9998;
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;

      this.container = document.createElement('div');
      this.container.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.9);
        background: #fff;
        border-radius: 12px;
        z-index: 9999;
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
        max-width: 90%;
        width: 400px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      `;

      document.body.appendChild(this.overlay);
      document.body.appendChild(this.container);

      this.overlay.addEventListener('click', () => this.close());
    },

    _removeButtonHandlers() {
      const confirmBtn = this.container.querySelector('.btn-modal-confirm');
      const cancelBtn = this.container.querySelector('.btn-modal-cancel');
      
      if (confirmBtn && this._confirmHandler) {
        confirmBtn.removeEventListener('click', this._confirmHandler);
        this._confirmHandler = null;
      }
      if (cancelBtn && this._cancelHandler) {
        cancelBtn.removeEventListener('click', this._cancelHandler);
        this._cancelHandler = null;
      }
    },

    open(options) {
      if (!this.overlay) {
        this.init();
      }

      this._removeButtonHandlers();

      const {
        title = '',
        content = '',
        confirmText = '确定',
        cancelText = '取消',
        onConfirm = null,
        onCancel = null,
        showCancel = true
      } = options || {};

      this.container.innerHTML = `
        <div style="padding: 20px; border-bottom: 1px solid #E8DFD5;">
          <h3 style="font-size: 18px; font-weight: 600; color: #2D2A26; margin: 0;">${title}</h3>
        </div>
        <div style="padding: 20px;">
          <div style="font-size: 14px; color: #2D2A26; line-height: 1.6;">${content}</div>
        </div>
        <div style="padding: 12px 20px; border-top: 1px solid #E8DFD5; display: flex; justify-content: flex-end; gap: 12px;">
          ${showCancel ? `
            <button class="btn-modal-cancel" style="padding: 8px 16px; font-size: 14px; color: #8C8279; background: transparent; border: none; cursor: pointer; border-radius: 6px;">
              ${cancelText}
            </button>
          ` : ''}
          <button class="btn-modal-confirm" style="padding: 8px 16px; font-size: 14px; color: #fff; background: #E85D4E; border: none; cursor: pointer; border-radius: 6px;">
            ${confirmText}
          </button>
        </div>
      `;

      this._confirmHandler = () => {
        if (onConfirm) onConfirm();
        this.close();
      };
      this._cancelHandler = () => {
        if (onCancel) onCancel();
        this.close();
      };

      this.container.querySelector('.btn-modal-confirm')?.addEventListener('click', this._confirmHandler);
      this.container.querySelector('.btn-modal-cancel')?.addEventListener('click', this._cancelHandler);

      this.overlay.style.display = 'block';
      this.container.style.display = 'block';

      requestAnimationFrame(() => {
        this.overlay.style.opacity = '1';
        this.container.style.opacity = '1';
        this.container.style.transform = 'translate(-50%, -50%) scale(1)';
      });

      this.isOpen = true;
    },

    close() {
      if (!this.isOpen) return;

      this.overlay.style.opacity = '0';
      this.container.style.opacity = '0';
      this.container.style.transform = 'translate(-50%, -50%) scale(0.9)';

      setTimeout(() => {
        this.overlay.style.display = 'none';
        this.container.style.display = 'none';
        this.isOpen = false;
        this._removeButtonHandlers();
      }, 300);
    },

    confirm(options) {
      this.open(options);
    },

    alert(options) {
      this.open({ ...options, showCancel: false });
    },

    prompt(options) {
      const { defaultValue = '' } = options || {};

      this.open({
        ...options,
        content: `
          <input type="text" class="modal-input" value="${defaultValue}" 
            style="width: 100%; padding: 10px 12px; border: 1px solid #E8DFD5; border-radius: 6px; font-size: 14px; margin-top: 8px;"
          />
        `,
        onConfirm: () => {
          const input = this.container.querySelector('.modal-input');
          const value = input?.value || '';
          if (options.onConfirm) {
            options.onConfirm(value);
          }
        }
      });
    }
  };

  window.Modal = Modal;
})(window);
