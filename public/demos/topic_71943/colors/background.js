// ColorFlow v2 - Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('ColorFlow v2 已安装');
});

// 页面加载完成后自动注入已保存的主题
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== 'complete') return;
  chrome.storage.local.get(['cfColors'], data => {
    if (!data.cfColors) return;
    chrome.tabs.sendMessage(tabId, { type: 'APPLY_COLORS', colors: data.cfColors }, () => {
      void chrome.runtime.lastError; // 忽略无法注入的页面
    });
  });
});
