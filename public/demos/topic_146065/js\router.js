/* ========== router.js — Hash 路由 + 页面栈管理 ========== */

const Router = (() => {
  'use strict';

  let routes = [];
  let pageStack = [];
  let currentPage = null;
  let container = null;
  let tabBar = null;
  let currentTab = 'home'; // 追踪当前 Tab（用于 Stack 页面时高亮）

  // 注册路由
  function register(pattern, pageModule, type) {
    routes.push({ pattern, page: pageModule, type });
  }

  // 设置容器和 TabBar
  function setContainer(el) { container = el; }
  function setTabBar(el) { tabBar = el; }

  // 匹配路由
  function matchRoute(hash) {
    for (const route of routes) {
      const match = hash.match(route.pattern);
      if (match) {
        return {
          page: route.page,
          type: route.type,
          param: match[1] ? parseInt(match[1], 10) : null
        };
      }
    }
    return null;
  }

  // 获取当前 Tab（用于 TabBar 高亮）
  function getCurrentTab(hash) {
    if (hash.includes('#/home')) return 'home';
    if (hash.includes('#/discover')) return 'discover';
    if (hash.includes('#/profile')) return 'profile';
    // Stack 页面时，保持当前 Tab 高亮
    return currentTab;
  }

  // 更新 TabBar 高亮
  function updateTabBar(hash) {
    if (!tabBar) return;
    const currentTab = getCurrentTab(hash);
    const items = tabBar.querySelectorAll('.tab-item');
    items.forEach(item => {
      item.classList.toggle('active', item.dataset.tab === currentTab);
    });
  }

  // Tab 切换：清空栈
  function switchTab(tabName) {
    pageStack = [];
    currentTab = tabName;
    location.hash = `#/${tabName}`;
  }

  // push 页面：入栈并导航
  function navigate(path) {
    pageStack.push(location.hash || '#/home');
    location.hash = path;
  }

  // 返回：出栈并导航
  function goBack() {
    const prev = pageStack.pop();
    if (prev) {
      location.hash = prev;
    } else {
      location.hash = '#/home';
    }
  }

  // 是否可以返回
  function canGoBack() {
    return pageStack.length > 0;
  }

  // 渲染页面
  function renderPage(matched, hash) {
    if (!matched) {
      // 未匹配到路由，回到首页
      location.hash = '#/home';
      return;
    }

    const { page, type, param } = matched;

    // 离开当前页面
    if (currentPage && currentPage.onLeave) {
      try { currentPage.onLeave(); } catch (e) { console.error('[Router] onLeave error:', e); }
    }

    // 切换页面
    currentPage = page;

    // 更新 TabBar
    updateTabBar(hash);

    // 确定动画类型
    const isTabSwitch = type === 'tab';
    const animClass = isTabSwitch ? 'tab-switch' : 'page-enter';

    // 渲染页面内容
    if (container) {
      container.className = 'page-content ' + animClass;
      // 清空容器
      container.innerHTML = '';
    }

    // 进入新页面
    if (page.onEnter) {
      try {
        page.onEnter(param, container);
      } catch (e) {
        console.error('[Router] onEnter error:', e);
      }
    }

    // 动画结束后移除 class
    setTimeout(() => {
      if (container) {
        container.classList.remove(animClass);
      }
    }, 350);
  }

  // 处理路由变化
  function handleRoute() {
    const hash = location.hash || '#/home';
    const matched = matchRoute(hash);
    // Tab 页面切换时更新 currentTab
    if (matched && matched.type === 'tab') {
      currentTab = hash.replace('#/', '').split('/')[0];
    }
    renderPage(matched, hash);
  }

  // 初始化
  function init() {
    window.addEventListener('hashchange', handleRoute);
    // 首次加载
    if (!location.hash) {
      location.hash = '#/home';
    } else {
      handleRoute();
    }
  }

  return {
    register,
    setContainer,
    setTabBar,
    switchTab,
    navigate,
    goBack,
    canGoBack,
    init,
    handleRoute
  };
})();
