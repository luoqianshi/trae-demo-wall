// ========================================
// IF LIFE · 路由控制
// ========================================

const Router = {
  currentPage: 'landing',

  // 页面顺序（用于方向感知动画）
  pageOrder: ['landing', 'setup', 'simulation', 'timeline', 'parallel', 'lab', 'portrait'],

  goTo(pageId) {
    if (pageId === this.currentPage) return;

    const oldPage = document.getElementById('page-' + this.currentPage);
    const newPage = document.getElementById('page-' + pageId);

    if (oldPage) {
      oldPage.classList.remove('page-active');
    }
    if (newPage) {
      newPage.classList.add('page-active');
      // 重置滚动
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    this.currentPage = pageId;
    State.currentPage = pageId;

    // 触发页面进入回调
    if (UI.onPageEnter) {
      UI.onPageEnter(pageId);
    }
  },

  next() {
    const currentIndex = this.pageOrder.indexOf(this.currentPage);
    if (currentIndex < this.pageOrder.length - 1) {
      this.goTo(this.pageOrder[currentIndex + 1]);
    }
  },

  prev() {
    const currentIndex = this.pageOrder.indexOf(this.currentPage);
    if (currentIndex > 0) {
      this.goTo(this.pageOrder[currentIndex - 1]);
    }
  }
};
