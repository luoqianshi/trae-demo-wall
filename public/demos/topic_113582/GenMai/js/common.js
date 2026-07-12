/* ============================================
   根脉 GenMai - 公共脚本
   ============================================ */

// 页面导航
function goTo(page) {
  window.location.href = page;
}

// Toast提示
function showToast(msg, duration) {
  duration = duration || 1500;
  var existing = document.querySelector('.toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.querySelector('.phone-container').appendChild(toast);

  requestAnimationFrame(function() {
    toast.classList.add('show');
  });

  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 300);
  }, duration);
}

// 功能演示提示（底部气泡）
function showDemoToast(msg, duration) {
  duration = duration || 2000;
  var existing = document.querySelector('.demo-toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'demo-toast';
  toast.textContent = msg;
  document.querySelector('.phone-container').appendChild(toast);

  requestAnimationFrame(function() {
    toast.classList.add('show');
  });

  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 300);
  }, duration);
}

// 弹窗 - 通用输入框
function showInputModal(title, placeholder, callback) {
  var overlay = document.querySelector('.modal-overlay');
  var inputEl = document.getElementById('modalInput');
  var titleEl = document.getElementById('modalTitle');

  titleEl.textContent = title;
  inputEl.value = '';
  inputEl.placeholder = placeholder || '请输入';
  overlay.classList.add('show');
  inputEl.focus();

  // 绑定确认回调
  overlay._confirmCallback = callback;
}

function closeModal() {
  var overlay = document.querySelector('.modal-overlay');
  overlay.classList.remove('show');
}

function confirmModal() {
  var overlay = document.querySelector('.modal-overlay');
  var inputEl = document.getElementById('modalInput');
  if (overlay._confirmCallback) {
    overlay._confirmCallback(inputEl.value);
  }
  closeModal();
}

// 商品详情弹窗
function showProductModal(name, price) {
  var overlay = document.getElementById('productModal');
  document.getElementById('productName').textContent = name;
  document.getElementById('productPrice').textContent = price;
  overlay.classList.add('show');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('show');
}

function exchangeProduct() {
  closeProductModal();
  showToast('兑换成功！（Demo演示）');
}

// QR Code放大弹窗
function showQRModal() {
  document.getElementById('qrModal').classList.add('show');
}

function closeQRModal() {
  document.getElementById('qrModal').classList.remove('show');
}

// 录音动画
function startRecording() {
  var overlay = document.getElementById('recordingOverlay');
  if (overlay) {
    overlay.classList.add('show');
    setTimeout(function() {
      overlay.classList.remove('show');
      showToast('录音提交成功！（Demo演示）');
    }, 2000);
  }
}

// 初始化弹窗按钮事件
function initModalEvents() {
  // 点击遮罩关闭
  var overlays = document.querySelectorAll('.modal-overlay');
  overlays.forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.classList.remove('show');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', initModalEvents);
