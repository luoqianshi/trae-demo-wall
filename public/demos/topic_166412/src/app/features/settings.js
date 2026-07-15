(function () {
  // 设置页面通过右上角用户菜单进入，不在侧边栏显示
  const root = window.MiniFishFeatures = window.MiniFishFeatures || { items: [] };

  // 注册设置页面图标
  const icons = window.MiniFishIcons = window.MiniFishIcons || {};
  icons.settingsProfile = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  icons.settingsRefresh = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
  icons.settingsAccounts = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  icons.settingsAI = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/><path d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2"/></svg>';
  icons.settingsAbout = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

  // 设置页面数据
  window.MiniFishData = window.MiniFishData || {};
  window.MiniFishData.settings = {
    settingsTab: 'profile',
    settingsSearch: '',
    settingsNav: [
      {
        label: '账户',
        items: [
          { key: 'profile', label: '个人资料', icon: icons.settingsProfile },
          { key: 'refresh', label: '数据刷新', icon: icons.settingsRefresh }
        ]
      },
      {
        label: '平台与模型',
        items: [
          { key: 'accounts', label: '平台账号', icon: icons.settingsAccounts, badge: '9' },
          { key: 'aimodels', label: 'AI 模型管理', icon: icons.settingsAI }
        ]
      },
      {
        label: '关于',
        items: [
          { key: 'about', label: '关于 MiniFish', icon: icons.settingsAbout }
        ]
      }
    ]
  };
})();
