const routes = {
  index: { path: '/', title: '水电到家' },
  services: { path: '/services', title: '报修服务' },
  repair: { path: '/repair', title: '快速报修' },
  orders: { path: '/orders', title: '我的订单' },
  order: { path: '/order', title: '订单进度' },
  search: { path: '/search', title: '找服务者' },
  profile: { path: '/profile', title: '我的' },
  detail: { path: '/detail', title: '详情' }
};

function isInsideIframe() {
  try {
    return window.parent && window.parent !== window;
  } catch (e) {
    return false;
  }
}

function getCurrentRoute() {
  const hash = window.location.hash.slice(1) || '/';
  const parts = hash.split('?');
  const path = parts[0];
  const queryStr = parts[1] || '';
  const query = {};

  queryStr.split('&').forEach(param => {
    const [key, value] = param.split('=');
    if (key) query[key] = decodeURIComponent(value || '');
  });

  return { path, query };
}

function navigateTo(url) {
  const isAbsolute = url.startsWith('http');
  if (isAbsolute) {
    window.location.href = url;
  } else if (isInsideIframe()) {
    window.parent.location.hash = url;
  } else {
    window.location.hash = url;
  }
}

function redirectTo(url) {
  navigateTo(url);
}

function reLaunch(url) {
  navigateTo(url);
}

function navigateBack(delta = 1) {
  if (isInsideIframe()) {
    window.parent.history.go(-delta);
  } else {
    window.history.go(-delta);
  }
}

function getQueryParam(name) {
  if (isInsideIframe()) {
    // Inside iframe, hash contains query string like "q=xxx&id=123"
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    return params.get(name);
  }
  const { query } = getCurrentRoute();
  return query[name] || null;
}

function getPathParam(name) {
  const { path } = getCurrentRoute();
  const parts = path.split('/');
  const index = parts.indexOf(name);
  return index >= 0 && index + 1 < parts.length ? parts[index + 1] : null;
}

function onRouteChange(callback) {
  window.addEventListener('hashchange', () => {
    callback(getCurrentRoute());
  });
  callback(getCurrentRoute());
}

export {
  routes,
  getCurrentRoute,
  navigateTo,
  redirectTo,
  reLaunch,
  navigateBack,
  getQueryParam,
  getPathParam,
  onRouteChange
};
