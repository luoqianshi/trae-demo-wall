/**
 * Trends API
 * GET    /trends              - 趋势列表
 * GET    /trends/:id          - 趋势详情
 * GET    /trends/:id/series   - 趋势热度曲线
 * GET    /materials           - 素材库列表
 * GET    /candidates          - 候选池列表
 * PUT    /candidates/:id      - 加入候选池（幂等）
 * DELETE /candidates/:id      - 移出候选池
 */
(function () {
  const api = window.MiniFishAPI;
  if (!api) { console.error('[trends.js] MiniFishAPI not loaded'); return; }

  window.MiniFishAPI.trends = {
    /**
     * 获取趋势列表
     * @param {object} params - { platform, list_type, sort, range, cursor, limit }
     */
    list(params) {
      return api.get('/trends', params);
    },

    /**
     * 获取趋势详情
     * @param {string} id - trend ID
     */
    detail(id) {
      return api.get('/trends/' + id);
    },

    /**
     * 获取趋势热度曲线
     * @param {string} id - trend ID
     * @param {object} params - { range }
     */
    series(id, params) {
      return api.get('/trends/' + id + '/series', params);
    },

    /**
     * 获取素材库列表
     * @param {object} params - { platform, type, cursor, limit }
     */
    materials(params) {
      return api.get('/materials', params);
    },

    /**
     * 获取候选池列表
     * @param {object} params - { cursor, limit }
     */
    candidates(params) {
      return api.get('/candidates', params);
    },

    /**
     * 加入候选池（幂等）
     * @param {string} trendId
     */
    addCandidate(trendId) {
      return api.put('/candidates/' + trendId);
    },

    /**
     * 移出候选池
     * @param {string} trendId
     */
    removeCandidate(trendId) {
      return api.delete('/candidates/' + trendId);
    }
  };
})();
