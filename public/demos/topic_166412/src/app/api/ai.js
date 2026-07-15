/**
 * AI API
 * GET  /ai/usage/summary       - 用量汇总
 * GET  /ai/usage/series        - 用量趋势
 * GET  /ai/usage/records       - 用量明细
 * GET  /ai/providers           - 供应商列表
 * GET  /ai/models              - 模型列表
 * POST /ai/comparisons         - 创建模型对比任务
 * GET  /ai/comparisons/:id     - 获取对比结果
 */
(function () {
  const api = window.MiniFishAPI;
  if (!api) { console.error('[ai.js] MiniFishAPI not loaded'); return; }

  window.MiniFishAPI.ai = {
    connections() { return api.get('/ai/connections'); },
    createConnection(body) { return api.post('/ai/connections', body); },
    updateConnection(id, body) { return api.patch('/ai/connections/' + encodeURIComponent(id), body); },
    removeConnection(id) { return api.delete('/ai/connections/' + encodeURIComponent(id)); },
    putSecret(id, secret) { return api.put('/ai/connections/' + encodeURIComponent(id) + '/secret', { secret }); },
    testConnection(id) {
      return api.post('/ai/connections/' + encodeURIComponent(id) + '/tests', {}, null, api.withIdempotency());
    },
    probeConnection(id) {
      return api.post('/ai/connections/' + encodeURIComponent(id) + '/capability-probes', {}, null, api.withIdempotency());
    },
    providers() {
      return api.get('/ai/providers');
    },
    models() {
      return api.get('/ai/models');
    },
    routingPolicy() { return api.get('/ai/routing-policy'); },
    updateRoutingPolicy(body) { return api.put('/ai/routing-policy', body); },
    /**
     * 用量汇总
     * @param {object} params - { range }
     */
    usageSummary(params) {
      return api.get('/ai/usage/summary', params);
    },

    /**
     * 用量趋势
     * @param {object} params - { range, granularity }
     */
    usageSeries(params) {
      return api.get('/ai/usage/series', params);
    },

    /**
     * 用量明细列表
     * @param {object} params - { model, status, cursor, limit }
     */
    usageRecords(params) {
      return api.get('/ai/usage/records', params);
    },

    /**
     * 创建模型对比任务
     * @param {object} body - { prompt, model_ids, capability, creator_account_id }
     */
    createComparison(body) {
      return api.post('/ai/comparisons', body, null, api.withIdempotency());
    },

    /**
     * 获取对比结果
     * @param {string} id - comparison ID
     */
    comparisonResult(id) {
      return api.get('/ai/comparisons/' + id);
    }
  };
})();
