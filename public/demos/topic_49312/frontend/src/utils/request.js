import axios from 'axios';
import { message } from 'antd';
import { getToken, removeToken } from './auth';

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 将 snake_case 字符串转换为 camelCase
 */
function snakeToCamel(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 递归将对象的所有 key 从 snake_case 转换为 camelCase
 */
function keysToCamel(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(keysToCamel);
  if (typeof obj !== 'object') return obj;

  const result = {};
  for (const key of Object.keys(obj)) {
    const camelKey = snakeToCamel(key);
    result[camelKey] = keysToCamel(obj[key]);
  }
  return result;
}

/**
 * 将 camelCase 字符串转换为 snake_case
 */
function camelToSnake(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * 递归将对象的所有 key 从 camelCase 转换为 snake_case
 */
function keysToSnake(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(keysToSnake);
  if (typeof obj !== 'object') return obj;
  // 避免处理 dayjs 等特殊对象
  if (obj.format && typeof obj.format === 'function') return obj;

  const result = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = camelToSnake(key);
    result[snakeKey] = keysToSnake(obj[key]);
  }
  return result;
}

// 请求拦截器 - 自动添加 JWT Token + 参数名转换
request.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 将分页参数 page 转换为 pageNum（后端统一使用 pageNum）
    if (config.params && config.params.page !== undefined) {
      config.params.pageNum = config.params.page;
      delete config.params.page;
    }

    // 将薪资月份参数 month 转换为 period（仅对薪资相关API）
    if (config.params && config.params.month !== undefined) {
      // salary records API 使用 period
      if (config.url && config.url.includes('/salaries/records')) {
        config.params.period = config.params.month;
        delete config.params.month;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 401自动跳转登录页，其他错误提示，自动转换snake_case为camelCase
request.interceptors.response.use(
  (response) => {
    let { data } = response;

    // 接受 code 为 0、2xx 或 success 为 true 的响应为成功
    if (data.code && data.code !== 0 && (data.code < 200 || data.code >= 300)) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message || '请求失败'));
    }

    // 递归转换所有 snake_case 字段名为 camelCase
    data = keysToCamel(data);

    return data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录');
          removeToken();
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          message.error('没有权限执行此操作');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器内部错误');
          break;
        default:
          message.error(data?.message || `请求失败 (${status})`);
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请稍后重试');
    } else {
      message.error('网络连接异常');
    }
    return Promise.reject(error);
  }
);

export const get = (url, params, config) =>
  request.get(url, { params, ...config });

export const post = (url, data, config) =>
  request.post(url, data, config);

export const put = (url, data, config) =>
  request.put(url, data, config);

export const del = (url, config) =>
  request.delete(url, config);

export default request;
