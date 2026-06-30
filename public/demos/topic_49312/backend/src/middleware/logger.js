/**
 * 操作日志中间件
 * 自动记录所有API请求的操作日志
 */
const logger = require('../utils/logger');
const { getClientIP } = require('./auth');

/**
 * 操作日志中间件
 * 记录每个请求的操作信息到operation_logs表
 */
function operationLogger(moduleName) {
  return (req, res, next) => {
    const startTime = Date.now();
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';

    // 包装res.json以捕获响应结果
    const originalJson = res.json.bind(res);
    let responseBody = null;

    res.json = function(body) {
      responseBody = body;
      return originalJson(body);
    };

    // 在响应结束时记录日志
    res.on('finish', () => {
      const executionTime = Date.now() - startTime;
      const method = req.method;
      const url = req.originalUrl || req.url;
      const status = res.statusCode >= 200 && res.statusCode < 400 ? 1 : 0;

      // 根据请求方法推断操作类型
      let action = '';
      let content = '';
      if (method === 'GET') {
        action = '查询';
        content = `查询${moduleName}数据`;
      } else if (method === 'POST') {
        action = '新增';
        content = `新增${moduleName}数据`;
      } else if (method === 'PUT') {
        action = '修改';
        content = `修改${moduleName}数据`;
      } else if (method === 'DELETE') {
        action = '删除';
        content = `删除${moduleName}数据`;
      }

      // 登录特殊处理
      if (url.includes('/auth/login')) {
        action = '登录';
        content = `${req.body?.username || '未知用户'}尝试登录`;
        if (status) {
          content = `${req.body?.username || ''}登录成功`;
        } else {
          content = `${req.body?.username || ''}登录失败`;
        }
      }

      // 如果是查询列表且没有特殊操作，记录为列表查询
      if (method === 'GET' && !url.includes('/:') && responseBody?.success !== false) {
        content = `查询${moduleName}列表`;
      }

      logger.log({
        userId: req.userId || null,
        username: req.user?.username || null,
        realName: req.user?.real_name || null,
        module: moduleName,
        action,
        content,
        method,
        url,
        ip,
        userAgent: userAgent.substring(0, 500),
        params: {
          query: req.query,
          body: method !== 'GET' ? sanitizeBody(req.body) : undefined
        },
        result: responseBody ? { code: responseBody.code, message: responseBody.message } : null,
        status,
        executionTime
      });
    });

    next();
  };
}

/**
 * 清理敏感字段后再记录
 */
function sanitizeBody(body) {
  if (!body) return body;
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'authorization', 'secret', 'oldPassword', 'newPassword'];
  sensitiveFields.forEach(f => {
    if (sanitized[f]) {
      sanitized[f] = '******';
    }
  });
  return sanitized;
}

module.exports = operationLogger;
