const { v4: uuidv4 } = require('uuid');

function success(data, message = 'success') {
  return {
    code: 200,
    message,
    data,
    timestamp: Date.now()
  };
}

function error(code, message) {
  return {
    code,
    message,
    data: null,
    timestamp: Date.now()
  };
}

function uuid() {
  return uuidv4().replace(/-/g, '');
}

function now() {
  return Date.now();
}

function pagination(page = 1, pageSize = 20) {
  const p = Math.max(1, parseInt(page) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
  return {
    page: p,
    pageSize: ps,
    offset: (p - 1) * ps,
    limit: ps
  };
}

function paginatedResult(list, total, page, pageSize) {
  return {
    list,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    totalPages: Math.ceil(total / pageSize)
  };
}

module.exports = {
  success,
  error,
  uuid,
  now,
  pagination,
  paginatedResult
};
