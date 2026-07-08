// 爪印城市 - SPA路由系统
const Router = {
  currentRoute: 'home',
  currentParams: {},
  history: [],
  routes: {},

  register(name, handler) {
    this.routes[name] = handler;
  },

  navigate(route, params = {}) {
    this.history.push({ route: this.currentRoute, params: { ...this.currentParams } });
    this.currentRoute = route;
    this.currentParams = params;
    this._render();
    this._updateTabBar();
  },

  back() {
    if (this.history.length > 0) {
      const prev = this.history.pop();
      this.currentRoute = prev.route;
      this.currentParams = prev.params;
      this._render();
      this._updateTabBar();
    }
  },

  _render() {
    const content = document.getElementById('page-content');
    const handler = this.routes[this.currentRoute];
    if (handler) {
      content.innerHTML = handler(this.currentParams);
      // 延迟执行页面初始化脚本
      setTimeout(() => {
        const initFn = window[`init_${this.currentRoute}`];
        if (typeof initFn === 'function') {
          initFn(this.currentParams);
        }
      }, 50);
    }
    content.scrollTop = 0;
  },

  _updateTabBar() {
    const tabItems = document.querySelectorAll('.tab-item');
    const tabRoutes = ['home', 'discover', 'publish', 'profile'];
    tabItems.forEach((item, i) => {
      item.classList.toggle('active', tabRoutes[i] === this.currentRoute);
    });
  },

  init() {
    // 绑定Tab栏点击
    document.querySelectorAll('.tab-item').forEach(item => {
      item.addEventListener('click', () => {
        const route = item.dataset.route;
        this.navigate(route);
      });
    });

    // 初始渲染
    this._render();
  }
};