// 初始化：读取并应用主题
(async function initTheme() {
  try {
    const theme = await WebMarkerTheme.getStoredTheme();
    WebMarkerTheme.applyTheme(theme);
  } catch (e) { /* ignore */ }
})();

document.getElementById('openSidebar').addEventListener('click', async () => {
  try {
    if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query || !chrome.sidePanel) {
      console.warn('Web Marker: 扩展上下文不可用');
      return;
    }
    // 获取当前标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
      // 通过 background 打开侧边栏（同时通知它记录 hostTabId）
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL', tabId: tab.id }, () => {
          if (chrome.runtime.lastError) {
            // 兜底：直接调用
            chrome.sidePanel.open({ tabId: tab.id }).finally(resolve);
          } else {
            resolve();
          }
        });
      });
      // 关闭 popup
      window.close();
    }
  } catch (error) {
    const msg = (error && error.message) || String(error);
    if (!/Extension context invalidated|Receiving end does not exist|cannot be accessed/i.test(msg)) {
      console.error('打开侧边栏失败:', error);
    }
  }
});
