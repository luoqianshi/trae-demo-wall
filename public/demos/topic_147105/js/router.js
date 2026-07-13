/**
 * Hash 路由实现
 * 支持 #/path/:param 形式
 */

const Router = {
  routes: {},
  currentRoute: null,

  // 注册路由
  register(pattern, handler) {
    this.routes[pattern] = handler;
  },

  // 解析当前 hash
  parse() {
    let hash = window.location.hash.slice(1) || '/splash';
    if (!hash.startsWith('/')) hash = '/splash';
    return hash;
  },

  // 匹配路由并执行
  async handle() {
    const path = this.parse();
    // 精确匹配
    if (this.routes[path]) {
      this.currentRoute = path;
      await this.routes[path]({});
      return;
    }
    // 动态参数匹配 #/lesson/:id
    for (const pattern of Object.keys(this.routes)) {
      if (pattern.includes(':')) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');
        if (patternParts.length === pathParts.length) {
          const params = {};
          let match = true;
          for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
              params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
            } else if (patternParts[i] !== pathParts[i]) {
              match = false;
              break;
            }
          }
          if (match) {
            this.currentRoute = pattern;
            await this.routes[pattern](params);
            return;
          }
        }
      }
    }
    // 404 回到首页
    window.location.hash = '/splash';
  },

  // 跳转
  navigate(path) {
    window.location.hash = path;
  },

  // 初始化
  init() {
    window.addEventListener('hashchange', () => this.handle());
    this.handle();
  }
};

window.Router = Router;
