// 爪印城市 - 弹窗组件
const Modal = {
  show(title, contentHtml, onClose) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    content.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div class="modal-title" style="margin-bottom:0;">${title}</div>
        <span style="font-size:20px;cursor:pointer;color:var(--text-light);" onclick="Modal.close()">✕</span>
      </div>
      <div>${contentHtml}</div>
    `;
    overlay.style.display = 'flex';
    overlay.onclick = (e) => {
      if (e.target === overlay) Modal.close();
    };
    this._onClose = onClose;
  },

  close() {
    document.getElementById('modal-overlay').style.display = 'none';
    if (this._onClose) this._onClose();
  }
};