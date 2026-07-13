/**
 * 统一响应工具
 * 创建日期: 2026-07-10
 */

module.exports = {
  success: (data = null, message = 'success') => {
    return { code: 200, message, data, timestamp: Date.now() };
  },
  created: (data = null, message = '创建成功') => {
    return { code: 201, message, data, timestamp: Date.now() };
  },
  badRequest: (message = '参数错误', error = null) => {
    return { code: 400, message, error, timestamp: Date.now() };
  },
  unauthorized: (message = '未授权') => {
    return { code: 401, message, timestamp: Date.now() };
  },
  forbidden: (message = '无权限访问') => {
    return { code: 403, message, timestamp: Date.now() };
  },
  notFound: (message = '资源不存在') => {
    return { code: 404, message, timestamp: Date.now() };
  },
  internalError: (message = '服务器内部错误', error = null) => {
    return { code: 500, message, error, timestamp: Date.now() };
  }
};