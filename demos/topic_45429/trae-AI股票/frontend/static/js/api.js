/**
 * AI智股 - 前端 API 客户端
 * 统一封装对后端 /api/* 的请求
 */
const API = (function () {
  const BASE = ""; // 同源部署，无需配置

  async function request(url, options = {}) {
    const opts = {
      headers: { "Content-Type": "application/json" },
      ...options,
    };
    if (opts.body && typeof opts.body !== "string") {
      opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(BASE + url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.code !== 0) {
      throw new Error(data.msg || `请求失败 (${res.status})`);
    }
    return data.data;
  }

  function upload(url, formData) {
    return fetch(BASE + url, { method: "POST", body: formData }).then((r) => r.json());
  }

  return {
    // 数据接入
    data: {
      upload: (formData) => upload("/api/data/upload", formData),
      generate: (params) => request("/api/data/generate", { method: "POST", body: params }),
      preview: (path) => request(`/api/data/preview?path=${encodeURIComponent(path)}`),

      // 数据库连接
      dbConnect: (cfg) => request("/api/data/db/connect", { method: "POST", body: cfg }),
      dbTables: (cfg) => request("/api/data/db/tables", { method: "POST", body: cfg }),
      dbSchema: (cfg) => request("/api/data/db/schema", { method: "POST", body: cfg }),
      dbQuery: (cfg) => request("/api/data/db/query", { method: "POST", body: cfg }),
      dbPreview: (cfg) => request("/api/data/db/preview", { method: "POST", body: cfg }),
      dbAggregate: (cfg) => request("/api/data/db/aggregate", { method: "POST", body: cfg }),

      // 文件聚合统计
      fileAggregate: (cfg) => request("/api/data/aggregate/file", { method: "POST", body: cfg }),
    },

    // 模型训练
    model: {
      list: () => request("/api/model/list"),
      presets: () => request("/api/model/presets"),
      train: (payload) => request("/api/model/train", { method: "POST", body: payload }),
      compare: (payload) => request("/api/model/compare", { method: "POST", body: payload }),
    },

    // 可视化
    visualize: {
      forecast: (payload) => request("/api/visualize/forecast", { method: "POST", body: payload }),
      error: (payload) => request("/api/visualize/error-distribution", { method: "POST", body: payload }),
      attention: (payload) => request("/api/visualize/attention", { method: "POST", body: payload }),
      metrics: (payload) => request("/api/visualize/metrics-compare", { method: "POST", body: payload }),
    },

    health: () => request("/api/health"),
  };
})();

window.API = API;
