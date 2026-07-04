// ============ 通用组件 ============
let toastTimer = null;

function showToast(message, duration = 2500, type = 'success') {
  const toast = document.getElementById('toast');
  if (message.includes('<div') || message.includes('<strong') || message.includes('<span')) {
    toast.innerHTML = message;
  } else {
    toast.textContent = message;
  }
  // 设置提示类型样式
  toast.classList.remove('toast-success', 'toast-error');
  if (type === 'error') {
    toast.classList.add('toast-error');
  } else {
    toast.classList.add('toast-success');
  }
  toast.classList.remove('animate');
  void toast.offsetWidth;
  toast.classList.add('show', 'animate');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show', 'animate');
  }, duration);
}

let confirmCallback = null;

function showConfirm(title, content, callback) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-content').textContent = content;
  confirmCallback = callback;
  document.getElementById('confirm-modal').classList.add('show');
}

function closeConfirm(confirmed) {
  document.getElementById('confirm-modal').classList.remove('show');
  if (confirmCallback) {
    confirmCallback(confirmed);
    confirmCallback = null;
  }
}

// 点击弹窗外部关闭
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      if (overlay.id === 'confirm-modal') {
        closeConfirm(false);
      } else {
        overlay.classList.remove('show');
      }
    }
  });
});
