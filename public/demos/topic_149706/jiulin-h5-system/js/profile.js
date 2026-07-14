// 我的页面逻辑
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    JLCommon.renderBottomNav(4);
  });

  window.showLegal = function() {
    document.getElementById('legal-modal').classList.add('show');
  };

  window.hideLegal = function() {
    document.getElementById('legal-modal').classList.remove('show');
  };

  // 点击模态框背景关闭
  document.getElementById('legal-modal').addEventListener('click', function(e) {
    if (e.target === this) hideLegal();
  });
})();
