(function(window) {
  const Toast = {
    container: null,

    init() {
      this.container = document.createElement('div');
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
      `;
      document.body.appendChild(this.container);
    },

    show(message, type = 'info', duration = 1500) {
      if (!this.container) {
        this.init();
      }

      const toast = document.createElement('div');
      const icons = {
        success: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        info: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
        warning: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>',
        error: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
      };

      const colors = {
        success: { bg: '#2A9D8F', text: '#fff' },
        info: { bg: '#3B82F6', text: '#fff' },
        warning: { bg: '#F5A623', text: '#fff' },
        error: { bg: '#E85D4E', text: '#fff' }
      };

      const color = colors[type] || colors.info;

      toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: ${color.bg}; color: ${color.text}; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-size: 14px;">
          ${icons[type] || icons.info}
          <span>${message}</span>
        </div>
      `;

      toast.style.cssText = `
        opacity: 0;
        transform: translateY(-10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      `;

      this.container.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      });

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }, duration);
    },

    success(message, duration) {
      this.show(message, 'success', duration);
    },

    info(message, duration) {
      this.show(message, 'info', duration);
    },

    warning(message, duration) {
      this.show(message, 'warning', duration);
    },

    error(message, duration) {
      this.show(message, 'error', duration);
    }
  };

  window.Toast = Toast;
})(window);