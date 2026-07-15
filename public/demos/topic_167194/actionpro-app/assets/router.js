const Router = {
  getParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  },
  navigate(page, params) {
    let url = `${page}.html`;
    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      url += '?' + queryString;
    }
    window.location.href = url;
  },
  getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop().replace('.html', '') || 'index';
  }
};