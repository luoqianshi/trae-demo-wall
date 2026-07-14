/**
 * AutoFlow — 应用入口与路由
 */
const App = {
  init() {
    Store.init();
    this.router();
    window.addEventListener('hashchange', () => this.router());
    window.addEventListener('scroll', () => this.handleNavScroll());
  },

  // 路由
  router() {
    const hash = window.location.hash.slice(1) || 'landing';
    const app = document.getElementById('app');

    // 解析路由
    if (hash === 'landing' || hash === '') {
      app.innerHTML = Components.landing();
      Components.startTerminalAnim();
      this.setupReveal();
      window.scrollTo(0, 0);
    } else if (hash === 'dashboard') {
      app.innerHTML = Components.shell(Components.dashboard(), 'dashboard');
      this.setupReveal();
    } else if (hash === 'create') {
      app.innerHTML = Components.shell(Components.create(), 'create');
    } else if (hash === 'tasks') {
      app.innerHTML = Components.shell(Components.tasks(), 'tasks');
    } else if (hash.startsWith('task:')) {
      const id = hash.slice(5);
      app.innerHTML = Components.shell(Components.taskDetail(id), 'tasks');
    } else if (hash === 'plugins') {
      app.innerHTML = Components.shell(Components.plugins(), 'plugins');
    } else if (hash === 'settings') {
      app.innerHTML = Components.shell(Components.settings(), 'settings');
    } else {
      app.innerHTML = Components.landing();
      Components.startTerminalAnim();
      this.setupReveal();
    }
  },

  // 导航
  navigate(route) {
    window.location.hash = route;
    // router() will be called by hashchange event
    // But also call directly in case hash is the same
    if (window.location.hash.slice(1) === route) {
      this.router();
    }
  },

  // 重新渲染当前页面
  rerender() {
    this.router();
  },

  // 滚动 reveal 动画
  setupReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  },

  // 导航栏滚动效果
  handleNavScroll() {
    const nav = document.getElementById('landingNav');
    if (nav) {
      if (window.scrollY > 20) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }
  },
};

// 启动
document.addEventListener('DOMContentLoaded', () => App.init());
