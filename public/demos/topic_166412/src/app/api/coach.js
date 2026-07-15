/**
 * Coach API
 * GET /coach/overview        - 教练总览
 * GET /coach/profile         - 创作者画像
 * GET /coach/route-plan      - 路线规划
 * GET /coach/growth-series   - 成长曲线
 * GET /coach/snapshots       - 历史快照
 * GET /coach/cases/summary   - 案例摘要
 * GET /coach/cases           - 案例列表
 * GET /coach/cases/:id       - 案例详情
 */
(function () {
  const api = window.MiniFishAPI;
  if (!api) { console.error('[coach.js] MiniFishAPI not loaded'); return; }

  window.MiniFishAPI.coach = {
    /**
     * 教练总览
     * @param {object} params - { creator_account_id }
     */
    overview(params) {
      return api.get('/coach/overview', params);
    },

    /**
     * 创作者画像
     * @param {object} params - { creator_account_id }
     */
    profile(params) {
      return api.get('/coach/profile', params);
    },

    /**
     * 路线规划
     * @param {object} params - { creator_account_id }
     */
    routePlan(params) {
      return api.get('/coach/route-plan', params);
    },

    /**
     * 成长曲线
     * @param {object} params - { creator_account_id, range }
     */
    growthSeries(params) {
      return api.get('/coach/growth-series', params);
    },

    /**
     * 历史快照
     * @param {object} params - { creator_account_id, cursor, limit }
     */
    snapshots(params) {
      return api.get('/coach/snapshots', params);
    },
    createSnapshot(body) {
      return api.post('/coach/snapshots', body, null, api.withIdempotency());
    },
    snapshot(id) { return api.get('/coach/snapshots/' + encodeURIComponent(id)); },
    createAssessment(body) {
      return api.post('/coach/assessments', body, null, api.withIdempotency());
    },
    assessment(id) {
      return api.get('/coach/assessments/' + encodeURIComponent(id));
    },
    adoptAssessment(id, body) {
      return api.post('/coach/assessments/' + encodeURIComponent(id) + '/adoptions', body || {});
    },

    /**
     * 案例摘要
     * @param {object} params - { creator_account_id }
     */
    casesSummary(params) {
      return api.get('/coach/cases/summary', params);
    },

    /**
     * 案例列表
     * @param {object} params - { category, creator_account_id, cursor, limit }
     */
    cases(params) {
      return api.get('/coach/cases', params);
    },

    /**
     * 案例详情
     * @param {string} id - case ID
     */
    caseDetail(id) {
      return api.get('/coach/cases/' + id);
    }
  };
})();
