// ============ 心声树洞 - 应用入口 ============
(function(global){
  'use strict';

  const { createApp, reactive, ref, h } = Vue;
  const Store = global.TH.Store;
  const Views = global.TH.Views;

  // 全局事件总线
  const bus = {
    _listeners: {},
    on(evt, fn){ (this._listeners[evt] = this._listeners[evt] || []).push(fn); },
    emit(evt, payload){ (this._listeners[evt]||[]).forEach(fn => fn(payload)); }
  };
  global.TH.bus = bus;

  // 直接使用 reactive 包装 Store.state，让其在组件中自动响应
  const app = createApp({
    setup(){
      const route = ref({ name: 'home', params: {} });
      const storeState = Store.state; // 已是 Vue.reactive

      bus.on('nav', (r) => {
        if (typeof r === 'string') route.value = { name: r, params: {} };
        else if (r && r.name) route.value = { name: r.name, params: r.params || {} };
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      return () => {
        if (!storeState.user){
          return h(Views.LoginView, {});
        }
        return h(Views.AppShell, { route: route.value });
      };
    }
  });

  window.addEventListener('DOMContentLoaded', () => {
    app.mount('#app');
    setTimeout(() => {
      if (window.lucide && window.lucide.createIcons){
        try { window.lucide.createIcons(); } catch(e){}
      }
    }, 150);
  });

  setInterval(() => {
    if (window.lucide && window.lucide.createIcons){
      try { window.lucide.createIcons(); } catch(e){}
    }
  }, 800);

})(window);
