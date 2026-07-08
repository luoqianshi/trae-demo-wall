// ===== 入口文件 (main.js) =====
// 创建 Vue 应用、组装各模块、挂载、启动通知轮询、全局错误处理
window.HomeStash = window.HomeStash || {};
(function () {
  const { createApp, ref } = Vue;
  const { state: stateMod, computed: computedMod, methods: methodsMod,
          helpers, storage, aiMock, aiReal, aiVoice, constants } = HomeStash;

  createApp({
    setup() {
      // 1. 创建响应式 state
      const state = stateMod.createInitialState();

      // 2. 创建所有 computed
      const allComputed = computedMod(state);

      // 3. 创建模板需要的 ref
      const aiMessagesRef = ref(null);
      const importInput = ref(null);

      // 4. 创建所有方法（传入 state/computed/helpers/storage/ai/aiMessagesRef）
      const methods = methodsMod(state, allComputed, helpers, storage, aiMock, aiReal, aiVoice, aiMessagesRef);

      // 5. 加载演示数据 / localStorage 缓存
      stateMod.loadDemoData(state);

      // 6. 启动通知轮询（60 秒检查临期/借出超期）
      methods.startNotificationPolling();

      // 7. 全局错误处理（避免白屏）
      window.addEventListener('error', (e) => {
        // #ifdef DEBUG
        console.error('全局错误:', e);
        // #endif
        methods.showToast('发生错误: ' + (e.message || '未知'), '⚠️');
      });

      // 8. 暴露给模板
      return {
        // state（reactive 对象，模板直接访问字段）
        state,
        // refs
        aiMessagesRef,
        importInput,
        // computed
        ...allComputed,
        // methods
        ...methods,
        // 常量
        emojiList: constants.EMOJI_OPTIONS,
        avatarOptions: constants.AVATAR_OPTIONS,
        // helpers（模板需要）
        getExpiryInfo: helpers.getExpiryInfo,
        getCategoryLabel: helpers.getCategoryLabel,
        formatDateTime: helpers.formatDateTime
      };
    }
  }).mount('#app');
})();
