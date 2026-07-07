/**
 * 食光机 - 首页逻辑（落地页）
 * 已登录用户自动跳转到仪表盘，未登录用户展示项目介绍
 */

(async function () {
  // 渲染导航栏（高亮"首页"）
  await renderNav('home');

  // 检查登录状态（首页不强制登录）
  const user = await checkAuth({ allowHome: true });

  // 已登录则跳转到仪表盘
  if (user) {
    window.location.href = 'dashboard.html';
    return;
  }

  // 未登录用户：将 CTA 按钮指向登录页，并加载展示数据
  updateCtaLinks();
  loadShowcaseStats();
})();

/**
 * 更新 CTA 按钮链接（未登录指向登录页）
 */
function updateCtaLinks() {
  const heroCta = document.getElementById('heroCtaBtn');
  const ctaBtn = document.getElementById('ctaBtn');
  if (heroCta) heroCta.setAttribute('href', 'login.html');
  if (ctaBtn) ctaBtn.setAttribute('href', 'login.html');
}

/**
 * 加载展示统计数据
 * 尝试从公开 API 获取展示数据，失败则使用静态展示数据
 */
async function loadShowcaseStats() {
  // 静态展示数据（默认值）
  const showcaseData = {
    statUsers: '100+',
    statRecords: '500+',
    statPosts: '200+',
    statLikes: '1000+'
  };

  try {
    // 尝试请求公开健康检查接口，验证服务可用性
    await fetch('/api/health');
  } catch (e) {
    // 服务不可用时也使用静态展示数据
  }

  // 渲染静态展示数据
  Object.keys(showcaseData).forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.textContent = showcaseData[id];
  });
}
