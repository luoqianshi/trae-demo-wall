/* ================================================================
 * Banban Core — 统一入口 v1.0
 *
 * 所有页面引入此文件即可获得完整的核心功能
 *
 * 使用方式：
 *   <script src="core/index.js"></script>
 *
 * 然后即可使用：
 *   window.BanbanCore.DataModel
 *   window.BanbanCore.EventBus
 *   window.BanbanCore.Store
 *   window.BanbanCore.CommandBus
 *   window.BanbanCore.AIPlanManager
 *   window.BanbanCore.APIAdapter
 *
 * 或简写别名：
 *   DataModel / EventBus / Store / CommandBus / AIPlanManager / APIAdapter
 * ================================================================ */

(function() {
  'use strict';

  // 检查是否已加载
  if (window.BanbanCore) {
    console.warn('[BanbanCore] 已加载，跳过重复初始化');
    return;
  }

  // 各模块已通过各自的 script 标签加载到 window 上
  // 这里统一导出

  const BanbanCore = {
    version: '1.0.0',

    // 核心模块
    DataModel: window.DataModel || window.BanbanDataModel,
    EventBus: window.EventBus || window.BanbanEventBus,
    Store: window.Store || window.BanbanStore,
    CommandBus: window.CommandBus || window.BanbanCommandBus,
    AIPlanManager: window.AIPlanManager || window.BanbanAIPlanManager,
    APIAdapter: window.APIAdapter || window.BanbanAPIAdapter,

    // 初始化
    async init(options = {}) {
      console.log('[BanbanCore] 初始化中...');

      // 1. 加载初始数据
      const loadResult = await this.APIAdapter.loadInitialData();
      console.log(`[BanbanCore] 数据加载完成 (来源: ${loadResult.source})`);

      // 2. 设置自动保存
      if (options.autoSave !== false) {
        this.APIAdapter.setupAutoSave();
      }

      console.log('[BanbanCore] 初始化完成');
      return loadResult;
    },

    // 便捷：页面间导航上下文
    navigateContext: {
      source: null,
      target: null,
      params: {},

      set(source, target, params) {
        this.source = source;
        this.target = target;
        this.params = params || {};
        // 存到 sessionStorage 供目标页面读取
        sessionStorage.setItem('banban_nav_context', JSON.stringify({
          source, target, params,
          timestamp: Date.now(),
        }));
      },

      get() {
        try {
          const raw = sessionStorage.getItem('banban_nav_context');
          if (raw) {
            const ctx = JSON.parse(raw);
            // 5分钟内有效
            if (Date.now() - ctx.timestamp < 5 * 60 * 1000) {
              return ctx;
            }
          }
        } catch (e) {}
        return null;
      },

      clear() {
        sessionStorage.removeItem('banban_nav_context');
        this.source = null;
        this.target = null;
        this.params = {};
      },
    },
  };

  // 暴露到全局
  window.BanbanCore = BanbanCore;

  // 兼容旧的简写别名（各模块自己已经设置了）

  console.log('[BanbanCore] v1.0.0 已加载');
})();
