/* ================================================
   Shared Parking Mini-Program — Common JS
   ================================================ */

const ParkingApp = {
  pages: {
    home: 'index.html',
    detail: 'detail.html',
    reserve: 'reserve.html',
    success: 'success.html',
    orders: 'orders.html',
    profile: 'profile.html'
  },

  init() {
    this.bindBackButtons();
    this.bindSelectButtons();
    this.bindFilterTabs();
    this.bindParkingCards();
    this.bindNavigation();
    this.updateTime();
  },

  navigateTo(page) {
    if (page && this.pages[page]) {
      window.location.href = this.pages[page];
    }
  },

  goBack() {
    if (document.referrer && document.referrer.includes(window.location.host)) {
      window.history.back();
    } else {
      this.navigateTo('home');
    }
  },

  bindBackButtons() {
    document.querySelectorAll('[data-action="back"]').forEach(btn => {
      btn.addEventListener('click', () => this.goBack());
    });
  },

  bindSelectButtons() {
    document.querySelectorAll('.select-btn-group').forEach(group => {
      const buttons = group.querySelectorAll('.select-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          if (group.dataset.onSelect) {
            window[group.dataset.onSelect]?.(btn);
          }
        });
      });
    });
  },

  bindFilterTabs() {
    document.querySelectorAll('.filter-tabs').forEach(tabsContainer => {
      const tabs = tabsContainer.querySelectorAll('.filter-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
        });
      });
    });
  },

  bindParkingCards() {
    document.querySelectorAll('[data-action="view-detail"]').forEach(card => {
      card.addEventListener('click', () => {
        this.navigateTo('detail');
      });
    });
  },

  bindNavigation() {
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const page = el.dataset.nav;
        this.navigateTo(page);
      });
    });
  },

  updateTime() {
    const timeEl = document.getElementById('status-time');
    if (timeEl) {
      const update = () => {
        const now = new Date();
        const h = now.getHours().toString().padStart(2, '0');
        const m = now.getMinutes().toString().padStart(2, '0');
        timeEl.textContent = `${h}:${m}`;
      };
      update();
      setInterval(update, 30000);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ParkingApp.init();
});
