const UI = {
  currentPage: 'page-home',
  toastTimer: null,

  navigateTo(pageId) {
    const currentEl = document.getElementById(this.currentPage);
    const targetEl = document.getElementById(pageId);

    if (currentEl && targetEl) {
      currentEl.classList.remove('active');
      currentEl.classList.add('back');
      setTimeout(() => {
        currentEl.classList.remove('back');
      }, 400);

      targetEl.classList.add('active');
      this.currentPage = pageId;

      if (pageId === 'page-health') {
        setTimeout(() => {
          Health.generateChart();
        }, 300);
      }

      if (pageId === 'page-appointments') {
        setTimeout(() => {
          Service.renderAppointments();
        }, 300);
      }
    }
  },

  navigateBack() {
    const pageMap = {
      'page-health': 'page-home',
      'page-community': 'page-home',
      'page-booking': 'page-community',
      'page-voice': 'page-home',
      'page-sos': 'page-home',
      'page-appointments': 'page-home'
    };
    const targetPage = pageMap[this.currentPage];
    if (targetPage) {
      this.navigateTo(targetPage);
    }
  },

  showToast(msg, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  },

  showModal(icon, title, text, autoClose = false) {
    document.getElementById('modalIcon').textContent = icon;
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalText').textContent = text;
    document.getElementById('modalOverlay').classList.add('show');
    if (autoClose) {
      setTimeout(() => {
        this.closeModal();
      }, 2000);
    }
  },

  closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
  },

  makeCall(phone) {
    this.showModal('📞', '正在拨打', `女儿\n${phone}`, true);
  },

  initEventListeners() {
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        if (this.currentPage !== 'page-home') {
          this.navigateBack();
        }
      }
    });
  }
};