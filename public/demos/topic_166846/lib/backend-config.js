/**
 * 这里只保存代理地址，不保存 DashScope API Key。
 *
 * 本地调试时，将地址改成运行 backend 的电脑局域网 IP，例如：
 *   http://192.168.1.20:8787
 *
 * 生产环境应使用 HTTPS 域名，例如：
 *   https://assistant-api.example.com
 */
export const BACKEND_HTTP_URL = 'http://192.168.0.102:8787';

/**
 * 公网部署后建议设置代理访问令牌。
 * 它不是 DashScope API Key，只能访问你自己的受限代理。
 */
export const PROXY_ACCESS_TOKEN = '';

function trimTrailingSlash(value) {
  if (!value) {
    return '';
  }
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function tokenQuery() {
  if (!PROXY_ACCESS_TOKEN) {
    return '';
  }
  return '?token=' + encodeURIComponent(PROXY_ACCESS_TOKEN);
}

export function isBackendConfigured() {
  return !!trimTrailingSlash(BACKEND_HTTP_URL);
}

export function buildBackendHttpUrl(path) {
  const base = trimTrailingSlash(BACKEND_HTTP_URL);
  if (!base) {
    return '';
  }
  return base + path + tokenQuery();
}

export function buildBackendWebSocketUrl() {
  const base = trimTrailingSlash(BACKEND_HTTP_URL);
  if (!base) {
    return '';
  }

  let socketBase = base;
  if (socketBase.indexOf('https://') === 0) {
    socketBase = 'wss://' + socketBase.slice(8);
  } else if (socketBase.indexOf('http://') === 0) {
    socketBase = 'ws://' + socketBase.slice(7);
  }
  return socketBase + '/ws/translate' + tokenQuery();
}
