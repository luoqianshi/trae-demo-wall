    // ===== 6. UI 组件 =====

    function showModal(title, body, actions = []) {
      const root = document.getElementById('modal-root');
      const actionsHTML = actions.map((a, i) =>
        `<button class="btn ${a.style || 'btn-ghost'}" data-modal-action="${i}">${a.label}</button>`
      ).join('');

      root.innerHTML = `
        <div class="modal-overlay" data-action="close-modal">
          <div class="modal" onclick="event.stopPropagation()">
            <div class="modal-close" data-action="close-modal">×</div>
            <h3 class="modal-title">${title}</h3>
            <div class="modal-body">${body}</div>
            <div class="modal-actions">${actionsHTML}</div>
          </div>
        </div>
      `;

      root.querySelectorAll('[data-modal-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.modalAction);
          const action = actions[idx];
          if (action && action.onClick) action.onClick();
          closeModal();
        });
      });

      root.querySelector('[data-action="close-modal"]').addEventListener('click', (e) => {
        if (e.target.dataset.action === 'close-modal' || e.target.closest('[data-action="close-modal"]')) {
          closeModal();
        }
      });
    }

    function closeModal() {
      document.getElementById('modal-root').innerHTML = '';
    }

    function showToast(message, type = 'info') {
      const root = document.getElementById('toast-root');
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      const icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');
      toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
      root.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('exit');
        setTimeout(() => toast.remove(), 300);
      }, 2800);
    }

    function confirmDialog(message, onConfirm) {
      showModal('请确认', `<p>${escapeHtml(message)}</p>`, [
        { label: '取消', style: 'btn-ghost' },
        { label: '确认', style: 'btn-danger', onClick: onConfirm }
      ]);
    }

    function showCelebration(title, desc, icon) {
      const root = document.getElementById('modal-root');
      root.innerHTML = `
        <div class="celebrate-overlay">
          <div class="celebrate-box">
            <div class="celebrate-icon">${icon}</div>
            <h3 class="celebrate-title">${title}</h3>
            <p class="celebrate-desc">${desc}</p>
            <button class="btn btn-primary" data-action="close-modal">太棒了！</button>
          </div>
        </div>
      `;
      root.querySelector('[data-action="close-modal"]').addEventListener('click', closeModal);
    }

    function showDialogue(text) {
      const existing = document.querySelector('.dialogue-box');
      if (existing) existing.remove();

      const panel = document.querySelector('.nurture-stage');
      if (!panel) return;

      const box = document.createElement('div');
      box.className = 'dialogue-box';
      box.textContent = `"${text}"`;
      panel.appendChild(box);

      setTimeout(() => {
        if (box.parentNode) {
          box.style.transition = 'opacity 0.4s';
          box.style.opacity = '0';
          setTimeout(() => box.remove(), 400);
        }
      }, 4000);
    }
