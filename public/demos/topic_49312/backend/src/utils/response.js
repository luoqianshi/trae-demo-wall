/**
 * 统一响应工具
 */

/**
 * 成功响应
 */
function success(res, data = null, message = '操作成功', code = 200) {
  return res.status(code).json({
    code,
    message,
    data,
    success: true,
    timestamp: new Date().toISOString()
  });
}

/**
 * 分页响应
 */
function page(res, list, total, page = 1, pageSize = 10, message = '查询成功') {
  return res.status(200).json({
    code: 200,
    message,
    data: {
      list,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / pageSize)
    },
    success: true,
    timestamp: new Date().toISOString()
  });
}

/**
 * 失败响应
 */
function fail(res, message = '操作失败', code = 400, data = null) {
  return res.status(code).json({
    code,
    message,
    data,
    success: false,
    timestamp: new Date().toISOString()
  });
}

/**
 * 未授权响应
 */
function unauthorized(res, message = '未登录或登录已过期') {
  return fail(res, message, 401);
}

/**
 * 无权限响应
 */
function forbidden(res, message = '无权限执行此操作') {
  return fail(res, message, 403);
}

/**
 * 参数错误响应
 */
function badRequest(res, message = '参数错误') {
  return fail(res, message, 400);
}

/**
 * 资源不存在响应
 */
function notFound(res, message = '资源不存在') {
  return fail(res, message, 404);
}

/**
 * 服务器错误响应
 */
function serverError(res, message = '服务器内部错误') {
  return fail(res, message, 500);
}

module.exports = {
  success,
  page,
  fail,
  unauthorized,
  forbidden,
  badRequest,
  notFound,
  serverError
};
