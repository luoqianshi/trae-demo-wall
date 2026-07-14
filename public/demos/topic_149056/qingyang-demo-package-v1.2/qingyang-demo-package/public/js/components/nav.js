const nav = {
  tabs: [
    { label: '首页', icon: '\u{1F3E0}', hash: '#/' },
    { label: '方案', icon: '\u{1F4CB}', hash: '#/plan' },
    { label: '饮食', icon: '\u{1F372}', hash: '#/nutrition' },
    { label: '运动', icon: '\u{1F3C3}', hash: '#/fitness' },
    { label: '社区', icon: '\u{1F465}', hash: '#/community' },
    { label: '我的', icon: '\u{1F464}', hash: '#/profile' },
  ],

  render(activeHash = '#/') {
    const navEl = document.getElementById('bottom-nav');
    if (!navEl) return;
    navEl.classList.remove('hidden');
    navEl.innerHTML = this.tabs.map(tab => {
      const isActive = tab.hash === activeHash ? ' active' : '';
      return `
        <button class="nav-item${isActive}" data-hash="${tab.hash}">
          <span class="nav-icon">${tab.icon}</span>
          <span class="nav-label">${tab.label}</span>
        </button>
      `;
    }).join('');

    navEl.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.hash = btn.dataset.hash;
      });
    });
  },

  hide() {
    const navEl = document.getElementById('bottom-nav');
    if (navEl) navEl.classList.add('hidden');
  },

  show() {
    const navEl = document.getElementById('bottom-nav');
    if (navEl) navEl.classList.remove('hidden');
  },

  update(hash) {
    this.render(hash);
  }
};
