// 爪印城市 - 应用入口
(function() {
  'use strict';

  // 全局Toast方法
  window.showToast = function(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2000);
  };

  // 初始化应用
  document.addEventListener('DOMContentLoaded', () => {
    Router.init();
  });
})();