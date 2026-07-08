/**
 * 政策通 hash 路由 - 纯 HTML 版本
 *
 * 通过 location.hash 切换 6 个页面（home/form/matching/results/detail/list）。
 * 通过 window.PolicyMateRouter 暴露 API，不使用 ES modules。
 * 渲染目标为 index.html 中的 <div id="app-content"></div> 单容器。
 *
 * 路由格式：
 *   #/                  -> 首页
 *   #/form?scene=xxx    -> 表单页（场景预填）
 *   #/match?scene=xxx   -> 表单页别名（与 #/form 等价）
 *   #/matching          -> 加载页
 *   #/results           -> 结果页
 *   #/policy/<id>       -> 政策详情页
 *   #/list?status=待申报 -> 我的清单页（按状态筛选）
 */
(function (global) {
  'use strict';

  // ============ 路由表 ============
  const routes = {
    '':         { page: 'home',     title: '政策通 - 智能政策匹配' },
    'form':     { page: 'form',     title: '填写信息 - 政策通' },
    'match':    { page: 'form',     title: '填写信息 - 政策通' },  // #/match 别名，与 #/form 等价
    'matching': { page: 'matching', title: '正在匹配 - 政策通' },
    'results':  { page: 'results',  title: '匹配结果 - 政策通' },
    'policy':   { page: 'detail',   title: '政策详情 - 政策通' },
    'list':     { page: 'list',     title: '我的清单 - 政策通' }
  };

  // ============ hash 解析 ============
  /**
   * 解析当前 location.hash
   * @returns {{ routeName: string, param: string|null, query: Object }}
   */
  function parseHash() {
    const hash = location.hash.replace(/^#\/?/, '');  // 去掉 #/ 前缀
    const parts = hash.split('?');
    const path = parts[0];
    const queryStr = parts[1] || '';

    // 解析路径段
    const segments = path.split('/').filter(Boolean);
    const routeName = segments[0] || '';
    const param = segments[1] || null;  // 例如 policy/:id 中的 id

    // 解析查询参数
    const query = {};
    if (queryStr) {
      queryStr.split('&').forEach(function (pair) {
        const kv = pair.split('=');
        if (kv.length === 2) {
          query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
        }
      });
    }

    return { routeName: routeName, param: param, query: query };
  }

  // ============ 跳转 ============
  /**
   * 编程式跳转
   * @param {string} path 形如 'form?scene=retirement' 或 'policy/jn_001'
   */
  function navigate(path) {
    location.hash = '#/' + path;
  }

  // ============ 路由处理 ============
  function handleRoute() {
    const parsed = parseHash();
    const route = routes[parsed.routeName] || routes[''];

    // 切换页面 section
    document.querySelectorAll('.page').forEach(function (p) {
      p.classList.remove('active');
    });
    const target = document.getElementById('page-' + route.page);
    if (target) target.classList.add('active');

    // 更新标题
    document.title = route.title;

    // 滚动到顶部
    window.scrollTo(0, 0);

    // 调用对应的渲染函数（在 app.js 中定义）
    try {
      if (global.PolicyMateApp && typeof global.PolicyMateApp.render === 'function') {
        global.PolicyMateApp.render(route.page, parsed);
      }
    } catch (e) {
      console.error('Route render error:', e);
      const main = document.getElementById('app-content');
      if (main) {
        main.innerHTML = '<div class="max-w-3xl mx-auto px-4 py-16 text-center"><h2 class="text-xl font-bold text-gray-800 mb-2">页面加载失败</h2><p class="text-sm text-gray-500 mb-4">请刷新重试</p><button class="px-6 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition" onclick="location.hash=\'#/\'">返回首页</button></div>';
      }
    }
  }

  // ============ 初始化 ============
  function init() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();  // 初始化时触发一次
  }

  // ============ 导出 ============
  global.PolicyMateRouter = {
    parseHash: parseHash,
    navigate: navigate,
    init: init,
    handleRoute: handleRoute
  };
})(typeof window !== 'undefined' ? window : globalThis);
