/**
 * 打工人的工具箱 - 后台服务脚本
 * 主要功能：
 * 1. 处理侧边栏打开事件
 * 2. 处理截屏请求
 * 3. 处理标签页管理相关操作
 * 4. 处理下载相关操作
 */

// 监听扩展图标点击事件，打开侧边栏
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 在当前窗口打开侧边栏
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (error) {
    console.error('打开侧边栏失败:', error);
  }
});

// 监听安装事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('打工人的工具箱已安装');
  
  // 初始化默认设置
  const defaultSettings = {
    downloadPath: 'Downloads',
    theme: 'pixel-dark',
    toolOrder: ['qrcode', 'json-formatter', 'screenshot', 'todo', 'pomodoro', 'tab-manager', 'file-info', 'downloader'],
    hiddenTools: [],
    pomodoroWorkTime: 25,
    pomodoroBreakTime: 5,
    pomodoroLongBreakTime: 15,
    pomodoroLongBreakInterval: 4
  };
  
  chrome.storage.sync.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.sync.set({ settings: defaultSettings });
    }
  });
});

// 监听来自侧边栏的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'captureVisibleTab':
      handleCaptureVisibleTab(sendResponse);
      return true; // 异步响应
      
    case 'saveTab':
      handleSaveTab(message.tab, sendResponse);
      return true;
      
    case 'getSavedTabs':
      handleGetSavedTabs(sendResponse);
      return true;
      
    case 'removeSavedTab':
      handleRemoveSavedTab(message.tabId, sendResponse);
      return true;
      
    case 'openSavedTab':
      handleOpenSavedTab(message.url, sendResponse);
      return true;
      
    case 'downloadFile':
      handleDownloadFile(message.url, message.filename, message.path, sendResponse);
      return true;
      
    case 'startSelectionMode':
      handleStartSelectionMode(sendResponse);
      return true;
      
    case 'captureSelectedArea':
      handleCaptureSelectedArea(message.selection, sendResponse);
      return true;
      
    case 'captureSelectionCancelled':
      handleCaptureSelectionCancelled(sendResponse);
      return true;
      
    default:
      break;
  }
});

/**
 * 截取当前标签页的可见区域
 */
function handleCaptureVisibleTab(sendResponse) {
  chrome.tabs.captureVisibleTab(
    { format: 'png' },
    (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message
        });
      } else {
        sendResponse({
          success: true,
          dataUrl: dataUrl
        });
      }
    }
  );
}

/**
 * 保存标签页到列表
 */
function handleSaveTab(tab, sendResponse) {
  chrome.storage.sync.get(['savedTabs'], (result) => {
    const savedTabs = result.savedTabs || [];
    
    // 检查是否已存在
    const exists = savedTabs.find(t => t.url === tab.url);
    if (!exists) {
      savedTabs.unshift({
        id: Date.now().toString(),
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl || '',
        savedAt: new Date().toISOString()
      });
      
      chrome.storage.sync.set({ savedTabs }, () => {
        sendResponse({ success: true, savedTabs });
      });
    } else {
      sendResponse({ success: false, error: '标签页已存在' });
    }
  });
}

/**
 * 获取保存的标签页列表
 */
function handleGetSavedTabs(sendResponse) {
  chrome.storage.sync.get(['savedTabs'], (result) => {
    sendResponse({
      success: true,
      savedTabs: result.savedTabs || []
    });
  });
}

/**
 * 删除保存的标签页
 */
function handleRemoveSavedTab(tabId, sendResponse) {
  chrome.storage.sync.get(['savedTabs'], (result) => {
    const savedTabs = (result.savedTabs || []).filter(t => t.id !== tabId);
    chrome.storage.sync.set({ savedTabs }, () => {
      sendResponse({ success: true, savedTabs });
    });
  });
}

/**
 * 打开保存的标签页
 */
function handleOpenSavedTab(url, sendResponse) {
  chrome.tabs.create({ url }, () => {
    sendResponse({ success: true });
  });
}

/**
 * 下载文件
 * @param {string} url - 文件URL
 * @param {string} filename - 文件名（可包含自定义路径）
 * @param {string} path - 自定义下载路径（已在前端处理，此处保留兼容）
 * @param {function} sendResponse - 响应回调
 */
function handleDownloadFile(url, filename, path, sendResponse) {
  const downloadOptions = {
    url: url,
    filename: filename || undefined,
    saveAs: false
  };
  
  chrome.downloads.download(downloadOptions, (downloadId) => {
    if (chrome.runtime.lastError) {
      sendResponse({
        success: false,
        error: chrome.runtime.lastError.message
      });
    } else {
      sendResponse({
        success: true,
        downloadId: downloadId
      });
    }
  });
}

/**
 * 进入框选模式 - 向当前页面注入选择器脚本
 * 注意：无法在 chrome://、edge://、about: 等特殊页面注入脚本
 */
function handleStartSelectionMode(sendResponse) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      sendResponse({ success: false, error: '未找到当前标签页' });
      return;
    }
    
    const tab = tabs[0];
    const url = tab.url || '';
    
    // 检查是否为特殊页面（无法注入脚本）
    if (url.startsWith('chrome://') || 
        url.startsWith('edge://') || 
        url.startsWith('about:') ||
        url.startsWith('chrome-extension://')) {
      sendResponse({
        success: false,
        error: '无法在浏览器特殊页面使用框选截屏，请切换到普通网页（如百度、淘宝等）'
      });
      return;
    }
    
    // 注入选择器脚本到页面
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['js/tools/selector.js']
    }, (results) => {
      if (chrome.runtime.lastError) {
        sendResponse({
          success: false,
          error: '注入选择器脚本失败: ' + chrome.runtime.lastError.message
        });
      } else {
        sendResponse({ success: true });
      }
    });
  });
}

/**
 * 截取用户框选的区域
 * 先截取全屏，然后由 sidepanel 进行裁剪（service worker 无 DOM 环境）
 * @param {Object} selection - 用户选择的区域信息 {x, y, width, height}
 */
function handleCaptureSelectedArea(selection, sendResponse) {
  chrome.tabs.captureVisibleTab(
    { format: 'png' },
    (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message
        });
        return;
      }
      
      // 返回原始截图和选区信息，由 sidepanel 进行裁剪
      sendResponse({
        success: true,
        dataUrl: dataUrl,
        selection: selection
      });
    }
  );
}

/**
 * 用户取消框选
 */
function handleCaptureSelectionCancelled(sendResponse) {
  sendResponse({ success: true, cancelled: true });
}
