// API 请求封装模块。所有请求返回 Promise。

const API = {
  // 获取帖子列表
  getPosts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return fetch(`/api/posts?${query}`).then(r => r.json());
  },

  // 获取单条帖子详情
  getPostDetail(topicId) {
    return fetch(`/api/posts/${topicId}`).then(r => r.json());
  },

  // 搜索
  search(q, demoOnly = true, params = {}) {
    const allParams = { q, demo_only: demoOnly ? "1" : "0", ...params };
    const query = new URLSearchParams(allParams).toString();
    return fetch(`/api/search?${query}`).then(r => r.json());
  },

  // 查重（旧接口，保留兼容）
  getDuplicates(threshold = 0.85, demoOnly = true) {
    const query = new URLSearchParams({
      threshold: String(threshold),
      demo_only: demoOnly ? "1" : "0",
    }).toString();
    return fetch(`/api/duplicates?${query}`).then(r => r.json());
  },

  // 相似作品搜索
  getSimilar(topicId, threshold = 0.5, demoOnly = true) {
    const query = new URLSearchParams({
      topic_id: String(topicId),
      threshold: String(threshold),
      demo_only: demoOnly ? "1" : "0",
    }).toString();
    return fetch(`/api/similar?${query}`).then(r => r.json());
  },

  // 赛道分析
  getTracks() {
    return fetch(`/api/tracks`).then(r => r.json());
  },

  // 趋势数据
  getTrend(topicId = null, days = 14) {
    const params = { days: String(days) };
    if (topicId !== null) params.topic_id = String(topicId);
    const query = new URLSearchParams(params).toString();
    return fetch(`/api/trend?${query}`).then(r => r.json());
  },

  // 更新状态
  getStatus() {
    return fetch(`/api/status`).then(r => r.json());
  },

  // 手动更新（POST 请求）
  update(password) {
    return fetch(`/api/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).then(r => r.json());
  },

  // 更新日志
  getUpdateLog() {
    return fetch(`/api/update-log`).then(r => r.json());
  },

  // 导出（返回下载 URL）
  exportData(format, demoOnly = true) {
    const query = new URLSearchParams({
      format,
      demo_only: demoOnly ? "1" : "0",
    }).toString();
    return `/api/export?${query}`;
  },

  // 赛事状态
  getEventStatus() {
    return fetch(`/api/event-status`).then(r => r.json());
  },

  // 首次爬取（POST 请求）
  firstScrape() {
    return fetch(`/api/first-scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).then(r => r.json());
  },
};
