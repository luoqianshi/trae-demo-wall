/* ============================================================
   api.js — 后端 API 接口封装
   调用 MVP 集成服务：/api/analyze、/api/render
   ============================================================ */

/**
 * 调用本地规则引擎分析口播稿
 * @param {string} rawText
 * @returns {Promise<Array>} 识别结果数组
 */
window.analyzeText = async function (rawText) {
  if (!rawText || rawText.trim().length < 10) {
    throw new Error('文稿内容过短，请至少输入 10 个字符');
  }

  const body = { text: rawText, maxResults: 12 };

  const kimiEnabled = AppState.get('kimiEnabled');
  const kimiApiKey = AppState.get('kimiApiKey');
  if (kimiEnabled && kimiApiKey) {
    body.provider = 'kimi';
    body.apiKey = kimiApiKey;
    body.mode = AppState.get('kimiMode') || 'rules-first';
  }

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok || data.status === 'error') {
    throw new Error(data.error || '识别失败');
  }

  return data.results || [];
};

/**
 * 调用渲染服务生成透明 MOV
 * @param {object} payload { templateId, params, settings }
 * @returns {Promise<{jobId, onProgress}>}
 */
window.renderTemplate = async function (payload) {
  return {
    jobId: null,
    onProgress: async function (callback) {
      // 模拟排队+处理中的进度反馈（后端实际是同步渲染）
      callback({ jobId: 'pending', status: 'queued', progress: 0.05 });
      await new Promise((r) => setTimeout(r, 200));
      callback({ jobId: 'pending', status: 'processing', progress: 0.1 });

      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.status === 'failed' || data.status === 'error') {
        callback({
          jobId: data.jobId || 'failed',
          status: 'failed',
          progress: 0,
          error: { message: data.error || '渲染失败' },
        });
        return;
      }

      callback({
        jobId: data.jobId,
        status: 'done',
        progress: 1,
        downloadUrl: data.downloadUrl,
        outputPath: data.outputPath,
      });
    },
  };
};
