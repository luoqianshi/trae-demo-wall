/**
 * 易道 App - 主应用入口
 * SPA路由框架 + 全局状态管理
 */

// 全局应用对象
const App = {
  // 当前页面
  currentPage: 'home',
  
  // 状态存储
  state: {
    divinationHistory: [],
    studyProgress: {
      completedCourses: [],
      totalProgress: 0
    },
    lastVisitedPage: null
  },
  
  // 路由表
  routes: {
    home: renderHomePage,
    divination: renderDivinationPage,
    bagua: renderBaguaPage,
    study: renderStudyPage,
    tools: renderToolsPage,
    database: renderDatabasePage
  },
  
  // 初始化
  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.bindNavigation();
    this.loadState();
    this.renderCurrentPage();
  },
  
  // 绑定导航事件
  bindNavigation() {
    // 导航链接点击
    const navLinks = document.querySelectorAll('.navbar-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        if (page) this.navigateTo(page);
      });
    });
    
    // 卡片快捷导航
    const navCards = document.querySelectorAll('.card[data-page]');
    navCards.forEach(card => {
      card.addEventListener('click', () => {
        const page = card.dataset.page;
        if (page) this.navigateTo(page);
      });
    });
    
    // Hero按钮导航
    const heroBtns = document.querySelectorAll('.hero-actions .btn[data-page]');
    heroBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        if (page) this.navigateTo(page);
      });
    });
    
    // 首页图片展示卡导航
    const visualCards = document.querySelectorAll('.visual-card[data-page]');
    visualCards.forEach(card => {
      card.addEventListener('click', () => {
        const page = card.dataset.page;
        if (page) this.navigateTo(page);
      });
    });
    
    // 首页底部功能条导航
    const miniFeatures = document.querySelectorAll('.mini-feature[data-page]');
    miniFeatures.forEach(feat => {
      feat.addEventListener('click', () => {
        const page = feat.dataset.page;
        if (page) this.navigateTo(page);
      });
    });
    
    // 移动端菜单按钮
    const menuBtn = document.getElementById('menuBtn');
    const navbarLinks = document.getElementById('navbarLinks');
    
    if (menuBtn && navbarLinks) {
      menuBtn.addEventListener('click', () => {
        navbarLinks.classList.toggle('visible');
      });
      
      // 点击导航后关闭菜单
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 768) {
            navbarLinks.classList.remove('visible');
          }
        });
      });
    }
  },
  
  // 页面导航
  navigateTo(page) {
    if (!this.routes[page]) {
      console.warn(`Page "${page}" not found`);
      return;
    }
    
    // 隐藏所有页面
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    
    // 更新导航状态
    const navLinks = document.querySelectorAll('.navbar-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.dataset.page === page) {
        link.classList.add('active');
      }
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
      targetPage.classList.add('active');
    }
    
    // 调用渲染函数
    this.routes[page]();
    
    // 更新当前页面
    this.currentPage = page;
    this.state.lastVisitedPage = page;
    this.saveState();
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
  
  // 渲染当前页面
  renderCurrentPage() {
    const page = this.currentPage || 'home';
    this.routes[page]();
  },
  
  // 加载状态
  loadState() {
    const savedState = Storage.load('appState');
    if (savedState) {
      this.state = {...this.state, ...savedState};
    }
    
    // 加载卜卦历史
    const history = Storage.load('divinationHistory');
    if (history) {
      this.state.divinationHistory = history;
    }
    
    // 加载学习进度
    const progress = Storage.load('studyProgress');
    if (progress) {
      this.state.studyProgress = progress;
    }
  },
  
  // 保存状态
  saveState() {
    Storage.save('appState', this.state);
  },
  
  // 清除状态
  clearState() {
    Storage.clear();
    this.state = {
      divinationHistory: [],
      studyProgress: {
        completedCourses: [],
        totalProgress: 0
      },
      lastVisitedPage: null
    };
  }
};

// ========== 页面渲染函数 ==========

function renderHomePage() {
  // 首页已由HTML静态渲染，无需动态渲染
}

function renderDivinationPage() {
  if (typeof DivinationModule !== 'undefined') {
    DivinationModule.render();
  }
}

function renderBaguaPage() {
  if (typeof BaguaModule !== 'undefined') {
    BaguaModule.render();
  }
}

function renderStudyPage() {
  if (typeof StudyModule !== 'undefined') {
    StudyModule.render();
  }
}

function renderToolsPage() {
  if (typeof ToolsModule !== 'undefined') {
    ToolsModule.render();
  }
}

function renderDatabasePage() {
  if (typeof DatabaseModule !== 'undefined') {
    DatabaseModule.render();
  }
}

// ========== 页面跳转工具函数 ==========

function gotoPage(page) {
  App.navigateTo(page);
}

// ========== DOM加载完成后初始化 ==========
  
// 全局导航函数（供HTML onclick调用）
function gotoPage(page) {
  App.navigateTo(page);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// 如果DOMContentLoaded已经触发，立即执行
if (document.readyState !== 'loading') {
  App.init();
}

// ========== 首页样式增强 ==========

// 为首页添加专属样式
const heroStyles = `
  .page-hero {
    min-height: calc(100vh - var(--navbar-height));
    max-width: none;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  
  .hero-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #1A1510 0%, #2A2015 100%);
    z-index: 0;
  }
  
  .hero-bg::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, rgba(201, 162, 39, 0.2) 0%, transparent 60%);
    animation: glowPulse 4s ease-in-out infinite;
  }
  
  .hero-content {
    text-align: center;
    color: var(--color-text-inverse);
    position: relative;
    z-index: 1;
    padding: var(--spacing-xl);
  }
  
  .hero-title {
    font-size: var(--font-size-hero);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.4em;
    margin-bottom: var(--spacing-md);
    color: var(--color-primary);
    text-shadow: 0 4px 30px rgba(201, 162, 39, 0.3);
  }
  
  .hero-subtitle {
    font-size: var(--font-size-lg);
    color: var(--color-text-muted);
    letter-spacing: 0.2em;
    margin-bottom: var(--spacing-2xl);
  }
  
  .hero-actions {
    display: flex;
    gap: var(--spacing-lg);
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .feature-grid {
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .feature-icon {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-md);
    font-size: var(--font-size-xl);
    color: var(--color-bg);
  }
  
  .card[data-page] {
    cursor: pointer;
  }
  
  .card[data-page] h3 {
    color: var(--color-secondary);
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-sm);
  }
  
  .card[data-page] p {
    color: var(--color-text-light);
    font-size: var(--font-size-sm);
  }
`;

// 添加样式到页面
const styleSheet = document.createElement('style');
styleSheet.textContent = heroStyles;
document.head.appendChild(styleSheet);