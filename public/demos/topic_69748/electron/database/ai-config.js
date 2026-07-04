/**
 * AI 配置模块
 * 负责 AI 配置的读取和更新
 */
const { getDb } = require('./db-utils');

/**
 * 获取 AI 配置
 */
function getAiConfig() {
  const db = getDb();
  if (!db) return null;
  return db.prepare("SELECT * FROM ai_config WHERE id = 'default'").get();
}

/**
 * 更新 AI 配置
 */
function updateAiConfig(data) {
  const db = getDb();
  if (!db) return false;

  db.prepare(`
    INSERT OR REPLACE INTO ai_config (id, apiUrl, apiKey, model, promptTemplate)
    VALUES ('default', @apiUrl, @apiKey, @model, @promptTemplate)
  `).run({
    apiUrl: data.apiUrl || '',
    apiKey: data.apiKey || '',
    model: data.model || '',
    promptTemplate: data.promptTemplate || ''
  });

  return true;
}

module.exports = {
  getAiConfig,
  updateAiConfig
};
