(function(window) {
  // ============================================================
  // Router性能优化：路由缓存 + 防抖处理
  // ============================================================
  
  // 高频路由排在前面，优化匹配效率
  const HIGH_FREQUENCY_ROUTES = ['/', '/home', '/search', '/profile', '/activity'];
  
  const Router = {
    routes: [],
    notFoundHandler: null,
    history: [],
    historyIndex: -1,
    isNavigatingBack: false,
    
    // 缓存已匹配的路由结果
    routeCache: new Map(),
    cacheMaxSize: 50,
    
    // 路径解析缓存
    pathCache: new Map(),
    pathCacheMaxSize: 20,
    
    // hash变化防抖计时器
    hashChangeTimer: null,
    hashChangeDelay: 50,

    // 按频率排序路由，高频路由优先匹配
    sortRoutes() {
      this.routes.sort((a, b) => {
        const aFreq = HIGH_FREQUENCY_ROUTES.indexOf(a.path);
        const bFreq = HIGH_FREQUENCY_ROUTES.indexOf(b.path);
        
        if (aFreq !== -1 && bFreq !== -1) {
          return aFreq - bFreq;
        }
        if (aFreq !== -1) return -1;
        if (bFreq !== -1) return 1;
        
        // 静态路由优先于动态路由
        const aIsDynamic = a.path.includes(':');
        const bIsDynamic = b.path.includes(':');
        if (!aIsDynamic && bIsDynamic) return -1;
        if (aIsDynamic && !bIsDynamic) return 1;
        
        return 0;
      });
    },

    addRoute(path, handler) {
      const keys = [];
      const pattern = path.replace(/:([^/]+)/g, (_, key) => {
        keys.push(key);
        return '([^/]+)';
      }).replace(/\//g, '\\/');
      const regex = new RegExp(`^${pattern}$`);
      this.routes.push({ path, regex, keys, handler });
      // 添加新路由后重新排序
      this.sortRoutes();
      // 清除路径缓存
      this.pathCache.clear();
    },

    // 缓存路径解析结果
    getCachedPath() {
      const hash = window.location.hash;
      
      if (this.pathCache.has(hash)) {
        return this.pathCache.get(hash);
      }
      
      const parts = hash.slice(1).split('?');
      const path = parts[0] || '/';
      const params = {};
      
      if (parts.length > 1) {
        const queryString = parts[1];
        const pairs = queryString.split('&');
        pairs.forEach(pair => {
          const [key, value] = pair.split('=');
          if (key) {
            params[key] = decodeURIComponent(value || '');
          }
        });
      }
      
      const result = { path, params };
      
      // 缓存管理，避免无限增长
      if (this.pathCache.size >= this.pathCacheMaxSize) {
        const firstKey = this.pathCache.keys().next().value;
        this.pathCache.delete(firstKey);
      }
      this.pathCache.set(hash, result);
      
      return result;
    },

    getRouteParam(name) {
      const { path } = this.getCachedPath();
      const parts = path.split('/');
      const paramIndex = parts.indexOf(name) + 1;
      return paramIndex > 0 && paramIndex < parts.length ? parts[paramIndex] : null;
    },

    setNotFound(handler) {
      this.notFoundHandler = handler;
    },

    navigate(path) {
      this.isNavigatingBack = false;
      window.location.hash = path;
    },

    back() {
      this.isNavigatingBack = true;
      window.history.back();
    },

    getParams() {
      return this.getCachedPath();
    },

    getPath() {
      const { path } = this.getCachedPath();
      return path;
    },

    getQueryParam(key) {
      const { params } = this.getCachedPath();
      return params[key];
    },

    isBackNavigation() {
      return this.isNavigatingBack;
    },

    init() {
      this.handleRoute();
      
      // 使用防抖处理hashchange事件，避免频繁触发
      window.addEventListener('hashchange', () => {
        if (this.hashChangeTimer) {
          clearTimeout(this.hashChangeTimer);
        }
        this.hashChangeTimer = setTimeout(() => {
          this.handleRoute();
        }, this.hashChangeDelay);
      });
      
      window.addEventListener('popstate', () => {
        this.isNavigatingBack = true;
      });
    },

    // 缓存路由匹配结果
    getCachedRoute(path) {
      if (this.routeCache.has(path)) {
        return this.routeCache.get(path);
      }
      return null;
    },

    // 缓存匹配结果
    cacheRoute(path, match) {
      if (this.routeCache.size >= this.cacheMaxSize) {
        // 删除最早的缓存项
        const firstKey = this.routeCache.keys().next().value;
        this.routeCache.delete(firstKey);
      }
      this.routeCache.set(path, match);
    },

    handleRoute() {
      const { path, params } = this.getCachedPath();

      // 检查缓存
      const cached = this.getCachedRoute(path);
      if (cached) {
        cached.handler({ path, params: cached.params });
        // BUG修复：路由处理完成后重置后退标志
        this.isNavigatingBack = false;
        return;
      }

      // 遍历路由匹配
      for (const route of this.routes) {
        const match = path.match(route.regex);
        if (match) {
          const routeParams = { ...params };
          route.keys.forEach((key, index) => {
            routeParams[key] = match[index + 1];
          });
          
          // 缓存匹配结果
          this.cacheRoute(path, { handler: route.handler, params: routeParams });
          
          route.handler({ path, params: routeParams });
          // BUG修复：路由处理完成后重置后退标志
          this.isNavigatingBack = false;
          return;
        }
      }

      if (this.notFoundHandler) {
        this.notFoundHandler({ path, params });
      } else {
        console.error(`No route handler found for: ${path}`);
      }
      // BUG修复：路由处理完成后重置后退标志
      this.isNavigatingBack = false;
    },
    
    // 清除所有缓存
    clearCache() {
      this.routeCache.clear();
      this.pathCache.clear();
    }
  };

  window.Router = Router;
})(window);