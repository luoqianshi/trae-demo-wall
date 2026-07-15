/**
 * Dashboard API
 * GET /dashboard/overview - 仪表盘总览
 * GET /dashboard/series   - 仪表盘图表序列
 */
(function () {
  const api = window.MiniFishAPI;
  if (!api) { console.error('[dashboard.js] MiniFishAPI not loaded'); return; }

  window.MiniFishAPI.dashboard = {
    /**
     * 获取仪表盘总览
     * @param {object} params - { scope, creator_account_id, range }
     */
    overview(params) {
      return api.get('/dashboard/overview', params);
    },

    /**
     * 获取仪表盘图表序列数据
     * @param {object} params - { scope, creator_account_id, range }
     */
    series(params) {
      return api.get('/dashboard/series', params);
    }
  };
})();
