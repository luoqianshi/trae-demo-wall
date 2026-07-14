/**
 * @trae-gen true
 * @trae-review-status reviewed
 * @trae-module shared-js
 */

/**
 * Toast 通知系统
 * 用法: showToast('操作成功', 'success')
 * 类型: success | warning | error | info
 */
(function() {
  'use strict';

  var container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  window.showToast = function(message, type) {
    type = type || 'info';
    var c = getContainer();

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    c.appendChild(toast);

    // 触发动画
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        toast.classList.add('show');
      });
    });

    // 自动消失
    var duration = type === 'error' ? 4000 : 2500;
    setTimeout(function() {
      toast.classList.add('hide');
      toast.addEventListener('transitionend', function() {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      });
    }, duration);
  };
})();