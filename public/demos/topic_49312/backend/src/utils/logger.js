/**
 * 操作日志工具
 */
const db = require('./db');
const dayjs = require('dayjs');

/**
 * 记录操作日志
 * @param {Object} params
 * @param {number} params.userId - 操作人ID
 * @param {string} params.username - 操作人用户名
 * @param {string} params.realName - 操作人真实姓名
 * @param {string} params.module - 操作模块
 * @param {string} params.action - 操作动作
 * @param {string} params.content - 操作内容
 * @param {string} params.method - 请求方法
 * @param {string} params.url - 请求URL
 * @param {string} params.ip - IP地址
 * @param {string} params.userAgent - 浏览器信息
 * @param {string} params.params - 请求参数
 * @param {string} params.result - 操作结果
 * @param {number} params.status - 1:成功 0:失败
 * @param {number} params.executionTime - 执行时间(ms)
 */
function log(params) {
  try {
    const stmt = db.prepare(`
      INSERT INTO operation_logs (user_id, username, real_name, module, action, content,
        method, url, ip, user_agent, params, result, status, execution_time, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      params.userId || null,
      params.username || null,
      params.realName || null,
      params.module || 'system',
      params.action || 'unknown',
      params.content || null,
      params.method || null,
      params.url || null,
      params.ip || null,
      params.userAgent || null,
      params.params ? JSON.stringify(params.params).substring(0, 2000) : null,
      params.result ? JSON.stringify(params.result).substring(0, 2000) : null,
      params.status !== undefined ? params.status : 1,
      params.executionTime || 0,
      dayjs().format('YYYY-MM-DD HH:mm:ss')
    );
  } catch (e) {
    console.error('记录日志失败:', e.message);
  }
}

module.exports = { log };
