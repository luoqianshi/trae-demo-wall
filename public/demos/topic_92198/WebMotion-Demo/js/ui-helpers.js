/**
 * WebMotion - UI 辅助函数
 * 从 app.js 提取的通用 UI 工具（Toast、Modal、Prompt）
 */
const UIHelpers = (function() {
  /** 显示 Modal */
  function showModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  /** 隐藏 Modal */
  function hideModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  }

  /** 显示 Toast 消息 */
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    // 使用 textContent 防止 XSS
    const iconSpan = document.createElement('span');
    iconSpan.textContent = icons[type] || '';
    toast.appendChild(iconSpan);
    toast.appendChild(document.createTextNode(' ' + message));
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.2s';
      setTimeout(() => toast.remove(), 200);
    }, 3000);
  }

  /** 模拟 prompt() 的自定义对话框（Electron 不支持原生 prompt） */
  function showPrompt(title, defaultValue, callback) {
    const existing = document.querySelector('.prompt-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'prompt-overlay';
    overlay.innerHTML = `
      <div class="prompt-dialog">
        <div class="prompt-title"></div>
        <input type="text" class="prompt-input" value="${(defaultValue || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}">
        <div class="prompt-btns">
          <button class="prompt-ok">确定</button>
          <button class="prompt-cancel">取消</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.prompt-title').textContent = title;

    const input = overlay.querySelector('.prompt-input');
    input.focus();
    input.select();

    const cleanup = () => overlay.remove();
    const confirm = () => { cleanup(); if (callback) callback(input.value); };
    const cancel = () => { cleanup(); if (callback) callback(null); };

    overlay.querySelector('.prompt-ok').addEventListener('click', confirm);
    overlay.querySelector('.prompt-cancel').addEventListener('click', cancel);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') confirm();
      else if (e.key === 'Escape') cancel();
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) cancel(); });
  }

  return { showModal, hideModal, showToast, showPrompt };
})();
