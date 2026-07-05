/* ============================================
   鸢韵潍风 - Hash 路由
   ============================================ */

const ROUTES = {
  '/dashboard': { title: '首页大屏', file: 'dashboard', dark: false },
  '/hall':      { title: '数字展厅', file: 'hall',      dark: false },
  '/masters':   { title: '匠人档案', file: 'masters',   dark: false },
  '/travel':    { title: '文旅地图', file: 'travel',    dark: false },
  '/stats':     { title: '数据看板', file: 'stats',     dark: true  },
  '/gallery':   { title: '纹样素材库', file: 'gallery', dark: false }
};

const loadedScripts = new Set();

const Router = {
  init() {
    window.addEventListener('hashchange', () => this.render());
    this.render();
  },

  current() {
    const hash = location.hash.replace('#', '') || '/dashboard';
    return ROUTES[hash] ? hash : '/dashboard';
  },

  async render() {
    const route = this.current();
    const conf = ROUTES[route];
    const view = document.getElementById('page-view');
    const topbar = document.querySelector('.topbar');

    // 切换顶部主题
    topbar.classList.toggle('dark', conf.dark);
    document.body.classList.toggle('dark-mode', conf.dark);

    // 高亮导航
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.toggle('active', n.getAttribute('data-route') === route);
    });

    // 滚动到顶
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 加载页面 HTML 片段
    view.innerHTML = `<div class="page-loading"><div class="loading-seal">鸢</div><p>正在展开卷轴…</p></div>`;

    try {
      const res = await fetch(`assets/pages/${conf.file}.html?v=` + Date.now());
      const html = await res.text();
      view.innerHTML = html;

      // 加载对应 CSS
      await this.loadCss(`assets/css/${conf.file}.css`);

      // 加载对应 JS（每次重新执行）
      await this.loadJs(`assets/js/${conf.file}.js`, true);

      // 更新标题
      document.title = `鸢韵潍风 · ${conf.title}`;
    } catch (e) {
      console.error('路由加载失败', e);
      view.innerHTML = `<div class="page-loading"><p style="color:var(--vermilion)">页面加载失败，请检查控制台</p></div>`;
    }
  },

  loadCss(href) {
    const id = `css-${href}`;
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = href + '?v=' + Date.now();
      document.head.appendChild(link);
    }
    return new Promise((resolve) => {
      if (link.onload !== null) link.onload = resolve;
      else resolve();
      // 兜底
      setTimeout(resolve, 800);
    });
  },

  loadJs(src, reload) {
    if (reload) {
      const old = document.querySelector(`script[data-page="${src}"]`);
      if (old) old.remove();
    } else if (loadedScripts.has(src)) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src + '?v=' + Date.now();
      script.dataset.page = src;
      script.onload = () => { loadedScripts.add(src); resolve(); };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
};

window.Router = Router;
