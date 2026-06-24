/**
 * Background Service Worker - 插件后台服务
 * 负责消息中转、AI调用、文件存储等核心逻辑
 */

// 导入模块（Service Worker中importScripts路径相对于SW文件位置）
try {
  importScripts('../lib/storage.js', '../lib/ai-service.js', '../lib/prd-generator.js');
} catch (e) {
  console.error('importScripts失败:', e);
}

// ===== Service Worker保活机制 =====
chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    // 定期唤醒Service Worker，防止被浏览器回收
  }
});

// ===== 消息监听 =====
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = messageHandlers[message.type];
  if (handler) {
    handler(message, sender)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, message: err.message || '未知错误' }));
    return true; // 保持消息通道开放
  }
});

// ===== 消息处理函数映射 =====
const messageHandlers = {
  startListening: async (msg) => handleStartListening(msg.tabId),
  stopListening: async (msg) => handleStopListening(msg.tabId),
  getCollectedData: async (msg) => handleGetCollectedData(msg.tabId),
  getListeningStatus: async (msg) => handleGetListeningStatus(msg.tabId),
  generatePRD: async (msg) => handleGeneratePRD(msg.data),
  savePRD: async (msg) => handleSavePRD(msg.data),
  getAllPRDs: async () => handleGetAllPRDs(),
  getPRD: async (msg) => handleGetPRD(msg.id),
  deletePRD: async (msg) => handleDeletePRD(msg.id),
  clearAllPRDs: async () => handleClearAllPRDs(),
  saveConfig: async (msg) => handleSaveConfig(msg.data),
  getConfig: async () => handleGetConfig(),
  testConnection: async () => handleTestConnection(),
  exportPRD: async (msg) => handleExportPRD(msg.data),
  ping: async () => ({ success: true, message: 'pong' }),
};

/**
 * 启动页面监听
 */
async function handleStartListening(tabId) {
  if (!tabId) return { success: false, message: '无法获取当前标签页' };
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'startListening' });
    return { success: true, message: '监听已启动' };
  } catch (error) {
    return { success: false, message: '无法连接到页面，请刷新页面后重试' };
  }
}

/**
 * 停止页面监听
 */
async function handleStopListening(tabId) {
  if (!tabId) return { success: false, message: '无法获取当前标签页' };
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'stopListening' });
    return { success: true, message: '监听已停止' };
  } catch (error) {
    return { success: false, message: '无法连接到页面' };
  }
}

/**
 * 获取采集数据
 */
async function handleGetCollectedData(tabId) {
  if (!tabId) return { success: false, message: '无法获取当前标签页' };
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'getCollectedData' });
    return response;
  } catch (error) {
    return { success: false, message: '无法获取页面数据，请确认监听已启动' };
  }
}

/**
 * 获取监听状态
 */
async function handleGetListeningStatus(tabId) {
  if (!tabId) return { success: false, message: '无法获取当前标签页', isListening: false };
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'getListeningStatus' });
    return response;
  } catch (error) {
    return { success: false, isListening: false, interactionCount: 0 };
  }
}

/**
 * 生成PRD文档
 */
async function handleGeneratePRD(pageData) {
  try {
    await aiService.init();
    if (!aiService.isConfigured()) {
      return { success: false, message: '请先配置有效的API Key' };
    }
    const content = await aiService.generatePRD(pageData);
    const pageName = PRDGenerator.extractPageName(content);
    const fileName = PRDGenerator.generateFileName(pageName);
    return {
      success: true,
      data: { content, fileName, pageName, pageUrl: pageData.url || '' },
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 保存PRD文件
 */
async function handleSavePRD(data) {
  try {
    const record = await storageManager.savePRD({
      fileName: data.fileName,
      content: data.content,
      pageUrl: data.pageUrl || '',
      pageName: data.pageName || '',
      createTime: Date.now(),
    });
    return { success: true, data: record };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 获取所有PRD文件列表
 */
async function handleGetAllPRDs() {
  try {
    const list = await storageManager.getAllPRDs();
    return { success: true, data: list };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 获取单个PRD文件
 */
async function handleGetPRD(id) {
  try {
    const prd = await storageManager.getPRD(id);
    if (!prd) return { success: false, message: '文件不存在' };
    return { success: true, data: prd };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 删除PRD文件
 */
async function handleDeletePRD(id) {
  try {
    await storageManager.deletePRD(id);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 清空所有PRD文件
 */
async function handleClearAllPRDs() {
  try {
    await storageManager.clearAllPRDs();
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 保存配置 - 关键修复：必须先init从storage加载现有值，再合并更新
 */
async function handleSaveConfig(data) {
  try {
    // 先从storage加载现有配置到内存（防止SW重启后内存为空覆盖有效值）
    await aiService.init();
    // 只更新传入的字段
    await aiService.updateConfig(data);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 获取配置
 */
async function handleGetConfig() {
  try {
    await aiService.init();
    const configs = {
      apiKey: aiService.apiKey ? aiService.apiKey.substring(0, 4) + '****' : '',
      apiUrl: aiService.apiUrl,
      model: aiService.model,
      isConfigured: aiService.isConfigured(),
    };
    return { success: true, data: configs };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 测试API连接
 */
async function handleTestConnection() {
  try {
    await aiService.init();
    const result = await aiService.testConnection();
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 导出PRD文件
 */
async function handleExportPRD(data) {
  try {
    PRDGenerator.exportMarkdown(data.content, data.fileName);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 插件安装/更新事件
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('PRD智能生成助手 v1.1.2 已安装');
  } else if (details.reason === 'update') {
    console.log('PRD智能生成助手已更新至 v1.1.2');
  }
});
