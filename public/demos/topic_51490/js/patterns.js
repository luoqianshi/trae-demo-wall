/**
 * 设计模式实现模块
 * 包含 5 种经典设计模式：Singleton / Observer / Factory / Module / Strategy
 */

/* ===== 1. Singleton（单例模式） =====
 * 应用场景：全局应用状态管理、缓存管理
 * 确保一个类只有一个实例，并提供全局访问点
 */

class AppState {
  static #instance = null;

  constructor() {
    if (AppState.#instance) {
      return AppState.#instance;
    }
    this.state = {
      currentPage: 'home',
      favorites: [],
      checklistData: {},
      searchHistory: [],
      theme: 'light'
    };
    this.listeners = new Map();
    this.#loadFromStorage();
    AppState.#instance = this;
  }

  static getInstance() {
    if (!AppState.#instance) {
      AppState.#instance = new AppState();
    }
    return AppState.#instance;
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
    this.#notify(key, value);
    this.#saveToStorage();
  }

  on(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);
  }

  #notify(key, value) {
    const callbacks = this.listeners.get(key) || [];
    callbacks.forEach(cb => cb(value));
  }

  #loadFromStorage() {
    try {
      const saved = localStorage.getItem('ucbg_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      }
    } catch (e) { /* ignore */ }
  }

  #saveToStorage() {
    try {
      const toSave = {
        favorites: this.state.favorites,
        checklistData: this.state.checklistData,
        searchHistory: this.state.searchHistory
      };
      localStorage.setItem('ucbg_state', JSON.stringify(toSave));
    } catch (e) { /* ignore */ }
  }

  reset() {
    this.state = {
      currentPage: 'home',
      favorites: [],
      checklistData: {},
      searchHistory: [],
      theme: 'light'
    };
    localStorage.removeItem('ucbg_state');
  }
}

/* ===== 2. Observer（观察者模式） =====
 * 应用场景：跨组件事件通信、DOM 事件管理
 * 发布-订阅机制，解耦组件间通信
 */

class EventBus {
  static #instance = null;

  constructor() {
    if (EventBus.#instance) return EventBus.#instance;
    this.events = new Map();
    EventBus.#instance = this;
  }

  static getInstance() {
    if (!EventBus.#instance) {
      EventBus.#instance = new EventBus();
    }
    return EventBus.#instance;
  }

  on(event, callback, priority = 0) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push({ callback, priority });
    this.events.get(event).sort((a, b) => b.priority - a.priority);
    return () => this.off(event, callback);
  }

  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  off(event, callback) {
    if (!this.events.has(event)) return;
    const handlers = this.events.get(event);
    const idx = handlers.findIndex(h => h.callback === callback);
    if (idx !== -1) handlers.splice(idx, 1);
  }

  emit(event, ...args) {
    if (!this.events.has(event)) return;
    this.events.get(event).forEach(({ callback }) => {
      try { callback(...args); } catch (e) { console.error(`[EventBus] ${event}:`, e); }
    });
  }
}

/* ===== 3. Factory（工厂模式） =====
 * 应用场景：统一创建 UI 组件（面包屑、卡片、目录等）
 * 将对象创建逻辑封装，调用方无需关心具体创建细节
 */

class ComponentFactory {
  static createBreadcrumb(items) {
    const nav = document.createElement('nav');
    nav.className = 'breadcrumb';
    nav.setAttribute('aria-label', '面包屑导航');
    items.forEach((item, index) => {
      if (index > 0) {
        const sep = document.createElement('span');
        sep.className = 'sep';
        sep.textContent = '>';
        nav.appendChild(sep);
      }
      if (index === items.length - 1) {
        const span = document.createElement('span');
        span.textContent = item.label;
        span.style.color = 'var(--gray-900)';
        nav.appendChild(span);
      } else {
        const a = document.createElement('a');
        a.href = item.href || '#';
        a.textContent = item.label;
        if (item.onClick) {
          a.addEventListener('click', (e) => { e.preventDefault(); item.onClick(); });
        }
        nav.appendChild(a);
      }
    });
    return nav;
  }

  static createTOC(headings) {
    const ul = document.createElement('ul');
    ul.className = 'toc-list';
    headings.forEach(h => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${h.id}`;
      a.textContent = h.text;
      a.style.paddingLeft = `${(h.level - 1) * 12 + 8}px`;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const el = document.getElementById(h.id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          document.querySelectorAll('.toc-list a.active').forEach(x => x.classList.remove('active'));
          a.classList.add('active');
        }
      });
      li.appendChild(a);
      ul.appendChild(li);
    });
    return ul;
  }

  static createNavCard({ icon, iconClass, title, description, onClick }) {
    const card = document.createElement('div');
    card.className = 'nav-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', onClick);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') onClick(); });

    const iconDiv = document.createElement('div');
    iconDiv.className = `card-icon ${iconClass}`;
    iconDiv.textContent = icon;

    const content = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.textContent = title;
    const p = document.createElement('p');
    p.textContent = description;
    content.appendChild(h3);
    content.appendChild(p);

    card.appendChild(iconDiv);
    card.appendChild(content);
    return card;
  }

  static createBadge(text, type = 'data') {
    const span = document.createElement('span');
    span.className = `badge badge-${type}`;
    span.textContent = text;
    return span;
  }

  static createToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }
}

/* ===== 4. Module（模块模式） =====
 * 应用场景：使用 ES6 模块组织代码
 * 实际项目中使用 export/import，此处用 IIFE 模拟模块化
 * 各功能模块见 checklist.js、calculator.js、markdown.js
 */

const RouterModule = (() => {
  const routes = new Map();
  let currentRoute = null;
  let notFoundHandler = null;

  function register(pattern, handler) {
    routes.set(pattern, handler);
  }

  function navigate(hash) {
    const route = hash.replace('#', '') || 'home';
    const handler = routes.get(route);

    if (handler) {
      if (currentRoute) {
        document.querySelectorAll('.page.active').forEach(p => p.classList.remove('active'));
      }
      handler();
      currentRoute = route;
      window.scrollTo({ top: 0, behavior: 'smooth' });

      document.querySelectorAll('.site-nav a').forEach(a => {
        const href = a.getAttribute('href');
        a.classList.toggle('active', href === `#${route}` || href === `#${route.split('/')[0]}`);
      });

      EventBus.getInstance().emit('route:changed', route);
    } else if (notFoundHandler) {
      notFoundHandler();
    }
  }

  function onNotFound(handler) {
    notFoundHandler = handler;
  }

  function getCurrentRoute() {
    return currentRoute;
  }

  window.addEventListener('hashchange', () => navigate(window.location.hash));
  window.addEventListener('load', () => navigate(window.location.hash));

  return { register, navigate, onNotFound, getCurrentRoute };
})();

/* ===== 5. Strategy（策略模式） =====
 * 应用场景：计算器根据不同条件（全款/贷款、不同城市、不同排量）切换计算策略
 * 将算法族封装，使它们可以互相替换
 */

class TaxStrategy {
  calculate(price, displacement) { throw new Error('Must implement'); }
}

class FuelTaxStrategy extends TaxStrategy {
  calculate(price, displacement) {
    if (displacement <= 1.0) return price * 0.01;
    if (displacement <= 1.6) return price * 0.03;
    if (displacement <= 2.0) return price * 0.05;
    if (displacement <= 2.5) return price * 0.09;
    return price * 0.12;
  }
}

class NEVTaxStrategy extends TaxStrategy {
  calculate(price, displacement) {
    return 0; // 新能源车免征购置税
  }
}

class RegistrationFeeStrategy {
  calculate(city) {
    const fees = {
      'beijing': 500, 'shanghai': 500, 'guangzhou': 500, 'shenzhen': 500,
      'chengdu': 300, 'hangzhou': 300, 'default': 300
    };
    return fees[city] || fees['default'];
  }
}

class InsuranceStrategy {
  calculate(price, coverage) {
    const baseRate = 0.035;
    const coverageMultiplier = {
      'basic': 0.7,
      'standard': 1.0,
      'full': 1.4
    };
    const multiplier = coverageMultiplier[coverage] || 1.0;
    return Math.round(price * baseRate * multiplier);
  }
}

class CalculatorContext {
  constructor() {
    this.taxStrategy = new FuelTaxStrategy();
    this.regFeeStrategy = new RegistrationFeeStrategy();
    this.insuranceStrategy = new InsuranceStrategy();
  }

  setTaxStrategy(strategy) {
    this.taxStrategy = strategy;
  }

  calculateTotal({ price, displacement, city, coverage, fuelType }) {
    if (fuelType === 'nev') {
      this.setTaxStrategy(new NEVTaxStrategy());
    } else {
      this.setTaxStrategy(new FuelTaxStrategy());
    }

    const purchaseTax = Math.round(this.taxStrategy.calculate(price, displacement));
    const registrationFee = this.regFeeStrategy.calculate(city);
    const insurance = this.insuranceStrategy.calculate(price, coverage);
    const vehicleTax = fuelType === 'nev' ? 0 : 360;
    const compulsoryInsurance = fuelType === 'nev' ? 0 : 950;
    const inspectionFee = 300;
    const preparationCost = Math.round(price * 0.01);

    const breakdown = [
      { name: '车辆裸车价', value: price },
      { name: '购置税', value: purchaseTax },
      { name: '交强险', value: compulsoryInsurance },
      { name: '商业险', value: insurance },
      { name: '车船税', value: vehicleTax },
      { name: '上牌费', value: registrationFee },
      { name: '检测费', value: inspectionFee },
      { name: '整备预估费', value: preparationCost }
    ];

    const total = breakdown.reduce((sum, item) => sum + item.value, 0);

    return { total, breakdown };
  }
}

/* ===== 导出到全局 ===== */
window.AppState = AppState;
window.EventBus = EventBus;
window.ComponentFactory = ComponentFactory;
window.RouterModule = RouterModule;
window.CalculatorContext = CalculatorContext;
window.TaxStrategy = TaxStrategy;
window.FuelTaxStrategy = FuelTaxStrategy;
window.NEVTaxStrategy = NEVTaxStrategy;
window.RegistrationFeeStrategy = RegistrationFeeStrategy;
window.InsuranceStrategy = InsuranceStrategy;