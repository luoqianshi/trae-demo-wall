/**
 * 二手车购买手册 - 主应用逻辑
 * 集成路由、搜索、收藏、页面渲染等功能
 */

(function () {
  'use strict';

  const appState = AppState.getInstance();
  const eventBus = EventBus.getInstance();

  /* ===== 页面容器引用 ===== */
  function getPageContainer() {
    return document.getElementById('page-container');
  }

  /* ===== 路由注册 ===== */
  function registerRoutes() {
    RouterModule.register('home', renderHomePage);
    RouterModule.register('guide/select', () => renderGuidePage('select'));
    RouterModule.register('guide/inspect', () => renderGuidePage('inspect'));
    RouterModule.register('guide/contract', () => renderGuidePage('contract'));
    RouterModule.register('guide/prepare', () => renderGuidePage('prepare'));
    RouterModule.register('toolbox', renderToolboxPage);
    RouterModule.register('toolbox/checklist', renderToolboxPage);
    RouterModule.register('toolbox/calculator', renderToolboxPage);

    RouterModule.onNotFound(() => {
      const container = getPageContainer();
      container.innerHTML = `
        <div style="text-align:center;padding:4rem 2rem;">
          <div style="font-size:4rem;margin-bottom:1rem;">🔍</div>
          <h2>页面未找到</h2>
          <p style="color:var(--gray-500);">请检查链接是否正确，或返回首页</p>
          <a href="#home" class="btn btn-primary" style="margin-top:1rem;">返回首页</a>
        </div>
      `;
    });
  }

  /* ===== 首页渲染 ===== */
  function renderHomePage() {
    const container = getPageContainer();
    container.innerHTML = `
      <div class="page active" id="page-home">
        <div class="hero">
          <h1>🚗 二手车购买完全手册</h1>
          <p>从选车到签约，从看车到整备，手把手教你买到靠谱二手车</p>
          <div class="hero-stats">
            <div class="hero-stat">
              <span class="num">4</span>
              <span class="label">篇深度指南</span>
            </div>
            <div class="hero-stat">
              <span class="num">46</span>
              <span class="label">项检查清单</span>
            </div>
            <div class="hero-stat">
              <span class="num">💰</span>
              <span class="label">落地成本计算</span>
            </div>
          </div>
        </div>

        <div class="section-title">📌 快速导航</div>
        <div class="quick-nav" id="quick-nav"></div>

        <div class="budget-section">
          <div class="section-title">💵 按预算选车</div>
          <div class="budget-grid" id="budget-grid"></div>
        </div>

        <div class="beginner-section">
          <div class="section-title">🌟 新手必看</div>
          <div class="beginner-list" id="beginner-list"></div>
        </div>

        <div class="disclaimer">
          <strong>⚠️ 免责声明：</strong>本网站所有内容仅供参考，不构成任何购买建议。<br>
          实际车况以专业第三方检测机构出具的检测报告为准。二手车交易存在风险，请谨慎决策。<br>
          数据来源标注于各篇文章内，部分数据（如保值率、维修成本）会随时间变化，请注意查看更新时间。
        </div>
      </div>
    `;

    renderQuickNav(container);
    renderBudgetGrid(container);
    renderBeginnerList(container);
  }

  function renderQuickNav(container) {
    const nav = container.querySelector('#quick-nav');
    const cards = [
      { icon: '🔍', iconClass: 'blue', title: '选车篇', description: '预算规划、车型选择、保值率分析', route: 'guide/select' },
      { icon: '🔎', iconClass: 'green', title: '看车篇', description: '事故车识别、发动机检查、路试指南', route: 'guide/inspect' },
      { icon: '📝', iconClass: 'orange', title: '签约篇', description: '合同要点、过户流程、法律风险', route: 'guide/contract' },
      { icon: '🔧', iconClass: 'red', title: '整备篇', description: '买车后必做的保养与整备清单', route: 'guide/prepare' }
    ];

    cards.forEach(card => {
      const cardEl = ComponentFactory.createNavCard({
        ...card,
        onClick: () => { window.location.hash = card.route; }
      });
      nav.appendChild(cardEl);
    });
  }

  function renderBudgetGrid(container) {
    const grid = container.querySelector('#budget-grid');
    const budgets = [
      { price: '3-5万', tagline: '练手代步首选', recommend: '飞度、Polo、雨燕、比亚迪F3', route: 'guide/select' },
      { price: '5-8万', tagline: '家用性价比之选', recommend: '卡罗拉、轩逸、朗逸', route: 'guide/select' },
      { price: '8-12万', tagline: '品质升级', recommend: '凯美瑞、雅阁、迈腾', route: 'guide/select' },
      { price: '12-18万', tagline: '豪华入门', recommend: '3系、A4L、C级', route: 'guide/select' }
    ];

    budgets.forEach(b => {
      const card = document.createElement('div');
      card.className = 'budget-card';
      card.innerHTML = `
        <div class="price">${b.price}</div>
        <div class="tagline">${b.tagline}</div>
        <div class="recommend">推荐：${b.recommend}</div>
      `;
      card.addEventListener('click', () => { window.location.hash = b.route; });
      grid.appendChild(card);
    });
  }

  function renderBeginnerList(container) {
    const list = container.querySelector('#beginner-list');
    const steps = [
      { num: '1', title: '确定预算和车型', desc: '先算清楚落地总价，不要只看裸车价', clickable: true, route: 'guide/select', hint: '点击查看选车指南 →' },
      { num: '2', title: '查询维修和出险记录', desc: '使用第三方App查询，排除事故车、泡水车', clickable: false },
      { num: '3', title: '现场看车 + 第三方检测', desc: '带Checklist逐项检查，最好委托独立检测', clickable: true, route: 'guide/inspect', hint: '点击查看看车指南 →' },
      { num: '4', title: '试驾体验', desc: '至少开20分钟，包含不同路况', clickable: false },
      { num: '5', title: '签订合同 + 过户', desc: '确保合同中有车况保证条款，完成过户手续', clickable: true, route: 'guide/contract', hint: '点击查看签约指南 →' },
      { num: '6', title: '保险 + 整备', desc: '买保险、换全车油液、做安全检查', clickable: true, route: 'guide/prepare', hint: '点击查看整备指南 →' }
    ];

    steps.forEach(step => {
      const item = document.createElement('div');
      item.className = 'beginner-item ' + (step.clickable ? 'clickable' : 'non-clickable');
      item.innerHTML = `
        <div class="step-num">${step.num}</div>
        <div>
          <h4>${step.title}</h4>
          <p>${step.desc}</p>
          ${step.clickable ? `<span class="click-hint">${step.hint}</span>` : ''}
        </div>
      `;
      if (step.clickable && step.route) {
        item.addEventListener('click', () => { window.location.hash = step.route; });
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.addEventListener('keydown', (e) => { if (e.key === 'Enter') { window.location.hash = step.route; } });
      }
      list.appendChild(item);
    });
  }

  /* ===== 指南详情页渲染 ===== */
  function renderGuidePage(guideId) {
    const guide = GuidesData.getGuide(guideId);
    if (!guide) {
      window.location.hash = 'home';
      return;
    }

    const container = getPageContainer();
    const favorites = appState.get('favorites') || [];
    const isFav = favorites.includes(guideId);

    const guideNames = {
      'select': '选车篇',
      'inspect': '看车篇',
      'contract': '签约篇',
      'prepare': '整备篇'
    };

    const allGuides = GuidesData.getAllGuides().filter(g => g.id !== guideId);

    container.innerHTML = `
      <div class="page active" id="page-guide">
        <div id="guide-breadcrumb"></div>

        <div class="guide-layout">
          <aside class="guide-sidebar">
            <h4>📑 目录</h4>
            <div id="guide-toc"></div>
          </aside>

          <article class="guide-content" id="guide-content">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1rem;">
              <div>
                <h1>${guide.title}</h1>
                <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;margin-bottom:1rem;">
                  ${guide.tags.map(t => `<span class="badge badge-data">${t}</span>`).join('')}
                  <span style="font-size:0.8rem;color:var(--gray-500);">
                    📅 更新于 ${guide.updated}
                  </span>
                </div>
              </div>
              <button class="btn-fav ${isFav ? 'favorited' : ''}" id="btn-fav" data-guide="${guideId}">
                ${isFav ? '❤️ 已收藏' : '🤍 收藏'}
              </button>
            </div>
            <div id="guide-body"></div>
            <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid var(--gray-200);font-size:0.8rem;color:var(--gray-500);">
              <strong>📚 数据来源：</strong>${guide.sources.join('；')}
            </div>
          </article>

          <aside class="guide-right">
            <div class="related-reading">
              <h4>📖 相关阅读</h4>
              ${allGuides.map(g => `
                <a href="#guide/${g.id}" class="related-item">${g.icon} ${g.title}</a>
              `).join('')}
            </div>
            <div style="background:#fff;border-radius:var(--radius);padding:1.25rem;box-shadow:var(--shadow);">
              <h4 style="font-size:0.85rem;font-weight:700;color:var(--gray-500);margin-bottom:0.75rem;">🛠️ 实用工具</h4>
              <a href="#toolbox/checklist" class="related-item">📋 看车避坑 Checklist</a>
              <a href="#toolbox/calculator" class="related-item">🧮 落地成本计算器</a>
            </div>
          </aside>
        </div>

        <div class="disclaimer">
          <strong>⚠️ 免责声明：</strong>本文内容仅供参考，不构成任何购买建议。<br>
          实际车况以专业第三方检测机构出具的检测报告为准。文中涉及的数据标注了来源和更新时间，部分数据会随时间变化。
        </div>
      </div>
    `;

    const breadcrumb = container.querySelector('#guide-breadcrumb');
    const bc = ComponentFactory.createBreadcrumb([
      { label: '首页', href: '#home' },
      { label: guideNames[guideId] || guide.title, href: `#guide/${guideId}` }
    ]);
    breadcrumb.appendChild(bc);

    const guideBody = container.querySelector('#guide-body');
    guideBody.innerHTML = marked.parse(guide.content);

    const headings = [];
    guideBody.querySelectorAll('h2, h3').forEach(h => {
      const id = h.textContent.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\u4e00-\u9fa5-]/g, '');
      h.id = id;
      headings.push({ id, text: h.textContent, level: h.tagName === 'H2' ? 2 : 3 });
    });

    const tocContainer = container.querySelector('#guide-toc');
    const toc = ComponentFactory.createTOC(headings);
    tocContainer.appendChild(toc);

    const favBtn = container.querySelector('#btn-fav');
    if (favBtn) {
      favBtn.addEventListener('click', () => toggleFavorite(guideId, favBtn));
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          document.querySelectorAll('.toc-list a').forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`);
          });
        }
      });
    }, { rootMargin: '-80px 0px -70% 0px' });

    headings.forEach(h => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
  }

  /* ===== 工具箱页面 ===== */
  function renderToolboxPage() {
    const container = getPageContainer();
    const currentHash = window.location.hash.replace('#', '');
    const activeTab = currentHash.includes('calculator') ? 'calculator' : 'checklist';

    container.innerHTML = `
      <div class="page active" id="page-toolbox">
        <div id="toolbox-breadcrumb"></div>

        <h1 style="font-size:1.75rem;font-weight:800;margin-bottom:1.5rem;">🛠️ 工具箱</h1>

        <div class="toolbox-tabs">
          <button class="toolbox-tab ${activeTab === 'checklist' ? 'active' : ''}" data-tab="checklist">
            📋 看车避坑 Checklist
          </button>
          <button class="toolbox-tab ${activeTab === 'calculator' ? 'active' : ''}" data-tab="calculator">
            🧮 落地成本计算器
          </button>
        </div>

        <div id="toolbox-panels"></div>
      </div>
    `;

    const breadcrumb = container.querySelector('#toolbox-breadcrumb');
    const bc = ComponentFactory.createBreadcrumb([
      { label: '首页', href: '#home' },
      { label: '工具箱', href: '#toolbox' }
    ]);
    breadcrumb.appendChild(bc);

    const panelsContainer = container.querySelector('#toolbox-panels');

    container.querySelectorAll('.toolbox-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        window.location.hash = `toolbox/${tabName}`;
        switchToolboxTab(tabName, panelsContainer, container);
      });
    });

    switchToolboxTab(activeTab, panelsContainer, container);
  }

  function switchToolboxTab(tabName, panelsContainer, container) {
    container.querySelectorAll('.toolbox-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabName);
    });

    panelsContainer.innerHTML = '';

    if (tabName === 'checklist') {
      const panel = document.createElement('div');
      panel.className = 'toolbox-panel active';
      panelsContainer.appendChild(panel);
      ChecklistModule.render(panel);
    } else if (tabName === 'calculator') {
      const panel = document.createElement('div');
      panel.className = 'toolbox-panel active';
      panelsContainer.appendChild(panel);
      CalculatorModule.render(panel);
    }
  }

  /* ===== 收藏功能 ===== */
  function toggleFavorite(guideId, btnEl) {
    let favorites = appState.get('favorites') || [];
    const index = favorites.indexOf(guideId);

    if (index > -1) {
      favorites.splice(index, 1);
      if (btnEl) {
        btnEl.classList.remove('favorited');
        btnEl.innerHTML = '🤍 收藏';
      }
      ComponentFactory.createToast('已取消收藏');
    } else {
      favorites.push(guideId);
      if (btnEl) {
        btnEl.classList.add('favorited');
        btnEl.innerHTML = '❤️ 已收藏';
      }
      ComponentFactory.createToast('❤️ 已加入收藏');
    }

    appState.set('favorites', favorites);
    eventBus.emit('favorites:changed', favorites);
  }

  /* ===== 搜索功能 ===== */
  function initSearch() {
    const searchToggle = document.getElementById('search-toggle');
    const searchOverlay = document.getElementById('search-overlay');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchClose = document.getElementById('search-close');

    if (!searchToggle || !searchOverlay) return;

    searchToggle.addEventListener('click', () => {
      searchOverlay.classList.add('active');
      setTimeout(() => searchInput?.focus(), 100);
    });

    searchClose?.addEventListener('click', () => {
      searchOverlay.classList.remove('active');
      if (searchInput) searchInput.value = '';
      if (searchResults) searchResults.innerHTML = '';
    });

    searchOverlay.addEventListener('click', (e) => {
      if (e.target === searchOverlay) {
        searchOverlay.classList.remove('active');
        if (searchInput) searchInput.value = '';
        if (searchResults) searchResults.innerHTML = '';
      }
    });

    let debounceTimer;
    searchInput?.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = searchInput.value.trim();
        if (query.length === 0) {
          searchResults.innerHTML = '';
          return;
        }
        if (query.length < 2) {
          searchResults.innerHTML = '<div class="search-no-result">请输入至少2个字符</div>';
          return;
        }

        const results = GuidesData.searchGuides(query);

        if (results.length === 0) {
          searchResults.innerHTML = '<div class="search-no-result">😔 未找到相关内容，请尝试其他关键词</div>';
        } else {
          searchResults.innerHTML = results.map(r => `
            <div class="search-result-item" data-route="guide/${r.id}">
              <h4>${r.icon} ${r.title}</h4>
              <p>${r.snippet}</p>
            </div>
          `).join('');

          searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
              const route = item.dataset.route;
              searchOverlay.classList.remove('active');
              if (searchInput) searchInput.value = '';
              if (searchResults) searchResults.innerHTML = '';
              window.location.hash = route;
            });
          });
        }
      }, 300);
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchOverlay.classList.add('active');
        setTimeout(() => searchInput?.focus(), 100);
      }
    });
  }

  /* ===== 导航菜单 ===== */
  function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navbarNav = document.getElementById('navbar-nav');

    navToggle?.addEventListener('click', () => {
      navbarNav?.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (navbarNav && navToggle && !navToggle.contains(e.target) && !navbarNav.contains(e.target)) {
        navbarNav.classList.remove('open');
      }
    });

    navbarNav?.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navbarNav.classList.remove('open');
      });
    });
  }

  /* ===== 回到顶部按钮 ===== */
  function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ===== 初始化 ===== */
  function init() {
    registerRoutes();
    initNavigation();
    initSearch();
    initBackToTop();

    eventBus.on('route:changed', (route) => {
      appState.set('currentPage', route);
    });

    if (!window.location.hash) {
      window.location.hash = 'home';
    }
  }

  document.addEventListener('DOMContentLoaded', init);

})();