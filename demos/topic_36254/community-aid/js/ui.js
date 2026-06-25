// UI工具模块
window.CommunityAidUI = (function() {
  let toastTimer = null;

  // 显示Toast通知
  function showToast(message, duration) {
    duration = duration || 2500;
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
      toast.classList.remove('show');
    }, duration);
  }

  // 打开弹窗
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  // 关闭弹窗
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  // 关闭所有弹窗
  function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(function(modal) {
      modal.classList.remove('show');
    });
    document.body.style.overflow = '';
  }

  // 格式化当前时间
  function formatCurrentTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes;
  }

  // 根据服务时长计算星级（1-5星）
  function getStarRating(hours) {
    if (hours >= 400) return 5;
    if (hours >= 300) return 4;
    if (hours >= 200) return 3;
    if (hours >= 100) return 2;
    return 1;
  }

  // 生成彩色头像（基于姓名首字）
  function generateAvatarColor(name) {
    const colors = [
      ['#FF6B6B', '#FF8E8E'], ['#4ECDC4', '#6FE3DA'], ['#45B7D1', '#6FC9E0'],
      ['#FFA07A', '#FFB899'], ['#98D8C8', '#B3E5DC'], ['#F7DC6F', '#F9E082'],
      ['#BB8FCE', '#C9A0DC'], ['#85C1E2', '#A0D4ED'], ['#82E0AA', '#A6EBBF'],
      ['#F1948A', '#F5B7B1']
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  }

  // 转义HTML防止XSS
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  return {
    showToast: showToast,
    openModal: openModal,
    closeModal: closeModal,
    closeAllModals: closeAllModals,
    formatCurrentTime: formatCurrentTime,
    getStarRating: getStarRating,
    generateAvatarColor: generateAvatarColor,
    escapeHtml: escapeHtml
  };
})();
