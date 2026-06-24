/**
 * Popup交互逻辑 - 所有核心功能直接在popup中完成
 * 不依赖background Service Worker，避免SW休眠导致超时
 */

(function () {
  // ===== 常量 =====
  const DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions';
  const DEFAULT_MODEL = 'gpt-4o-mini';
  const DB_NAME = 'PRDGeneratorDB';
  const DB_VERSION = 1;
  const PRD_STORE = 'prdFiles';

  // ===== 状态管理 =====
  const state = {
    isListening: false,
    interactionCount: 0,
    elementCount: 0,
    currentPRD: null,
    currentHistoryId: null,
    isConfigured: false,
    apiKeyModified: false,
  };

  // ===== DOM元素 =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    statusDot: $('#statusDot'),
    statusText: $('#statusText'),
    navTabs: $$('.nav-tab'),
    btnStartListen: $('#btnStartListen'),
    btnStopListen: $('#btnStopListen'),
    interactionCount: $('#interactionCount'),
    elementCount: $('#elementCount'),
    btnExportInteractions: $('#btnExportInteractions'),
    btnGenerateManual: $('#btnGenerateManual'),
    btnGenerate: $('#btnGenerate'),
    generateHint: $('#generateHint'),
    previewSection: $('#previewSection'),
    previewContent: $('#previewContent'),
    btnClosePreview: $('#btnClosePreview'),
    btnExport: $('#btnExport'),
    loadingOverlay: $('#loadingOverlay'),
    loadingText: $('#loadingText'),
    inputApiKey: $('#inputApiKey'),
    inputApiUrl: $('#inputApiUrl'),
    inputModel: $('#inputModel'),
    btnToggleKey: $('#btnToggleKey'),
    btnSaveConfig: $('#btnSaveConfig'),
    btnTestConnection: $('#btnTestConnection'),
    configStatus: $('#configStatus'),
    historyList: $('#historyList'),
    historyEmpty: $('#historyEmpty'),
    btnClearAll: $('#btnClearAll'),
    historyPreviewSection: $('#historyPreviewSection'),
    historyPreviewTitle: $('#historyPreviewTitle'),
    historyPreviewContent: $('#historyPreviewContent'),
    btnCloseHistoryPreview: $('#btnCloseHistoryPreview'),
    btnReDownload: $('#btnReDownload'),
    btnDeleteRecord: $('#btnDeleteRecord'),
    toastContainer: $('#toastContainer'),
    collapseToggle: $('#collapseToggle'),
    collapseSection: document.querySelector('.collapse-section'),
    btnGuide: $('#btnGuide'),
    btnBackMain: $('#btnBackMain'),
    mainHeader: $('#mainHeader'),
    guideHeader: $('#guideHeader'),
    navTabsBar: document.querySelector('.nav-tabs'),
  };

  // ===== IndexedDB操作（popup直接操作，不经过background） =====

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(PRD_STORE)) {
          const store = db.createObjectStore(PRD_STORE, { keyPath: 'id' });
          store.createIndex('createTime', 'createTime', { unique: false });
        }
      };
    });
  }

  async function dbGetAllPRDs() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([PRD_STORE], 'readonly');
      const store = tx.objectStore(PRD_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.createTime - a.createTime));
      request.onerror = () => reject(request.error);
    });
  }

  async function dbGetPRD(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([PRD_STORE], 'readonly');
      const request = tx.objectStore(PRD_STORE).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function dbSavePRD(data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([PRD_STORE], 'readwrite');
      const request = tx.objectStore(PRD_STORE).put(data);
      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  async function dbDeletePRD(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([PRD_STORE], 'readwrite');
      const request = tx.objectStore(PRD_STORE).delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async function dbClearAllPRDs() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([PRD_STORE], 'readwrite');
      const request = tx.objectStore(PRD_STORE).clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // ===== 消息通信 =====

  async function sendTabMessage(message) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('无法获取当前标签页');
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, message: '页面未加载插件，请刷新页面后重试' });
        } else if (response) {
          resolve(response);
        } else {
          resolve({ success: false, message: '页面无响应，请刷新页面后重试' });
        }
      });
    });
  }

  // ===== 初始化 =====
  async function init() {
    bindEvents();
    await loadConfig();
    await refreshListeningStatus();
  }

  // ===== 事件绑定 =====
  function bindEvents() {
    dom.navTabs.forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    dom.btnStartListen.addEventListener('click', startListening);
    dom.btnStopListen.addEventListener('click', stopListening);
    dom.btnExportInteractions.addEventListener('click', exportInteractions);
    dom.btnGenerateManual.addEventListener('click', generateManual);
    dom.btnGenerate.addEventListener('click', generatePRD);

    dom.btnClosePreview.addEventListener('click', () => {
      dom.previewSection.style.display = 'none';
    });
    dom.btnExport.addEventListener('click', exportPRD);

    dom.btnToggleKey.addEventListener('click', toggleApiKeyVisibility);
    dom.btnSaveConfig.addEventListener('click', saveConfig);
    dom.btnTestConnection.addEventListener('click', testConnection);
    dom.inputApiKey.addEventListener('input', () => {
      state.apiKeyModified = true;
    });

    dom.btnClearAll.addEventListener('click', clearAllHistory);
    dom.btnCloseHistoryPreview.addEventListener('click', () => {
      dom.historyPreviewSection.style.display = 'none';
    });
    dom.btnReDownload.addEventListener('click', reDownloadHistory);
    dom.btnDeleteRecord.addEventListener('click', deleteHistoryRecord);

    // 折叠面板
    dom.collapseToggle.addEventListener('click', toggleCollapse);

    // 操作指引
    dom.btnGuide.addEventListener('click', showGuide);
    dom.btnBackMain.addEventListener('click', hideGuide);
  }

  // ===== 导航切换 =====
  function switchTab(tabName) {
    dom.navTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    $$('.tab-panel').forEach(p => p.classList.remove('active'));
    $(`#panel${capitalize(tabName)}`).classList.add('active');

    if (tabName === 'history') {
      loadHistory();
    }
  }

  // ===== 折叠面板切换 =====
  function toggleCollapse() {
    dom.collapseSection.classList.toggle('expanded');
  }

  // ===== 操作指引切换 =====
  function showGuide() {
    dom.mainHeader.style.display = 'none';
    dom.guideHeader.style.display = 'flex';
    dom.navTabsBar.style.display = 'none';
    $$('.tab-panel').forEach(p => p.classList.remove('active'));
    $('#panelGuide').classList.add('active');
  }

  function hideGuide() {
    dom.mainHeader.style.display = 'flex';
    dom.guideHeader.style.display = 'none';
    dom.navTabsBar.style.display = 'flex';
    $('#panelGuide').classList.remove('active');
    $('#panelMain').classList.add('active');
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ===== 监听控制 =====

  async function startListening() {
    try {
      const response = await sendTabMessage({ type: 'startListening' });
      if (response.success) {
        state.isListening = true;
        updateListenUI();
        showToast('监听已启动，请操作页面', 'success');
        startPolling();
      } else {
        showToast(response.message || '启动监听失败', 'error');
      }
    } catch (error) {
      showToast('启动监听失败：' + error.message, 'error');
    }
  }

  async function stopListening() {
    try {
      const response = await sendTabMessage({ type: 'stopListening' });
      if (response.success) {
        state.isListening = false;
        updateListenUI();
        stopPolling();
        showToast('监听已停止', 'success');
      } else {
        showToast(response.message || '停止监听失败', 'error');
      }
    } catch (error) {
      showToast('停止监听失败：' + error.message, 'error');
    }
  }

  function updateListenUI() {
    dom.statusDot.classList.toggle('listening', state.isListening);
    dom.statusText.textContent = state.isListening ? '监听中' : '未监听';
    dom.btnStartListen.disabled = state.isListening;
    dom.btnStopListen.disabled = !state.isListening;
    dom.btnExportInteractions.disabled = state.interactionCount === 0;
    updateGenerateButton();
  }

  // ===== 轮询 =====
  let pollingTimer = null;

  function startPolling() {
    stopPolling();
    pollingTimer = setInterval(() => refreshListeningStatus(), 2000);
  }

  function stopPolling() {
    if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null; }
  }

  async function refreshListeningStatus() {
    try {
      const response = await sendTabMessage({ type: 'getListeningStatus' });
      if (response && response.success) {
        state.isListening = response.isListening;
        state.interactionCount = response.interactionCount || 0;
        dom.interactionCount.textContent = state.interactionCount;
        updateListenUI();

        if (state.isListening) {
          const dataResponse = await sendTabMessage({ type: 'getCollectedData' });
          if (dataResponse && dataResponse.success && dataResponse.data) {
            state.elementCount = dataResponse.data.elements?.length || 0;
            dom.elementCount.textContent = state.elementCount;
          }
        }
      }
    } catch (e) { /* 静默 */ }
  }

  // ===== 导出交互记录 =====
  async function exportInteractions() {
    try {
      const response = await sendTabMessage({ type: 'getCollectedData' });
      if (!response.success || !response.data) {
        showToast('获取交互记录失败', 'error');
        return;
      }

      const data = response.data;
      const interactions = data.interactions || [];
      const elements = data.elements || [];
      const pageInfo = data.pageInfo || [];

      if (interactions.length === 0 && elements.length === 0) {
        showToast('暂无交互记录可导出', 'warning');
        return;
      }

      // 生成Markdown内容
      let md = `# 交互记录报告\n\n`;
      md += `> 生成时间：${formatTime(Date.now())}\n`;
      md += `> 页面标题：${data.title || '未知'}\n`;
      md += `> 页面URL：${data.url || '未知'}\n\n`;

      // 页面信息
      if (pageInfo.length > 0) {
        md += `## 页面信息\n\n`;
        pageInfo.forEach(info => { md += `- ${info}\n`; });
        md += '\n';
      }

      // 页面元素
      if (elements.length > 0) {
        md += `## 页面元素\n\n`;
        md += `| 类型 | 标签/名称 | 附加信息 |\n`;
        md += `|------|----------|----------|\n`;
        elements.forEach(el => {
          const label = el.label || el.text || '-';
          let extra = '';
          if (el.placeholder) extra += `占位符：${el.placeholder}；`;
          if (el.required) extra += '必填；';
          if (el.options && el.options.length > 0) extra += `选项：${el.options.join('/')}；`;
          if (el.disabled) extra += '已禁用；';
          md += `| ${el.type} | ${label} | ${extra || '-'} |\n`;
        });
        md += '\n';
      }

      // 交互行为
      if (interactions.length > 0) {
        md += `## 交互行为记录\n\n`;
        md += `| 序号 | 操作类型 | 操作目标 | 输入值 | 操作结果 |\n`;
        md += `|------|---------|---------|--------|----------|\n`;
        interactions.forEach((inter, i) => {
          md += `| ${i + 1} | ${inter.type} | ${inter.target || '-'} | ${inter.value || '-'} | ${inter.result || '-'} |\n`;
        });
        md += '\n';
      }

      // 导出文件
      const fileName = generateFileName(data.title || '交互记录', '交互记录');
      downloadMarkdown(md, fileName);

      // 自动保存到历史记录
      const record = {
        id: 'inter_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
        content: md,
        fileName,
        pageName: data.title || '交互记录',
        pageUrl: data.url || '',
        type: 'interaction',
        createTime: Date.now(),
      };
      try {
        await dbSavePRD(record);
      } catch (e) { /* 保存失败不影响导出 */ }

      showToast('交互记录已导出并保存到历史', 'success');
    } catch (error) {
      showToast('导出失败：' + error.message, 'error');
    }
  }

  // ===== 操作手册生成（popup直接调用AI） =====

  async function generateManual() {
    if (!state.isConfigured) {
      showToast('请先配置有效的API Key', 'warning');
      switchTab('settings');
      return;
    }

    if (state.interactionCount === 0) {
      showToast('请先启动监听并操作页面', 'warning');
      return;
    }

    showLoading('正在采集页面数据...');

    try {
      const dataResponse = await sendTabMessage({ type: 'getCollectedData' });
      if (!dataResponse.success || !dataResponse.data) {
        hideLoading();
        showToast('获取页面数据失败，请确认监听已启动', 'error');
        return;
      }

      showLoading('正在调用AI生成用户操作手册...');

      const pageData = dataResponse.data;

      const config = await chrome.storage.local.get(['apiKey', 'apiUrl', 'model']);
      const apiKey = config.apiKey || '';
      const apiUrl = config.apiUrl || DEFAULT_API_URL;
      const model = config.model || DEFAULT_MODEL;

      if (!apiKey) {
        hideLoading();
        showToast('API Key未配置', 'error');
        return;
      }

      const systemPrompt = buildManualSystemPrompt();
      const userPrompt = buildManualUserPrompt(pageData);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        hideLoading();
        let errorMsg = `HTTP错误 ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error?.message || errorMsg;
        } catch (e) { /* 忽略 */ }
        if (response.status === 401) errorMsg = 'API Key无效或已过期，请重新配置';
        showToast('生成失败：' + errorMsg, 'error');
        return;
      }

      const data = await response.json();
      if (!data.choices || data.choices.length === 0) {
        hideLoading();
        showToast('AI返回数据为空，请重试', 'error');
        return;
      }

      const content = data.choices[0].message.content;
      const pageName = extractPageName(content);
      const fileName = generateFileName(pageName, '操作手册');

      hideLoading();

      state.currentPRD = {
        id: 'manual_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
        content,
        fileName,
        pageName,
        pageUrl: pageData.url || '',
        type: 'manual',
        createTime: Date.now(),
      };

      // 自动保存到历史记录
      try {
        await dbSavePRD(state.currentPRD);
      } catch (e) { /* 保存失败不影响预览 */ }

      dom.previewContent.textContent = content;
      dom.previewSection.style.display = 'block';
      showToast('操作手册生成成功，已保存到历史', 'success');
    } catch (error) {
      hideLoading();
      let hint = error.message;
      if (hint.includes('Failed to fetch') || hint.includes('NetworkError')) {
        hint = '网络请求失败，请检查API地址和网络连接';
      }
      showToast('生成失败：' + hint, 'error');
    }
  }

  function buildManualSystemPrompt() {
    return `你是一位资深技术文档工程师，擅长编写清晰、易懂的用户操作手册。
你的任务是根据提供的网页交互数据和页面信息，生成一份面向终端用户的操作手册。

要求：
1. 严格按照指定的Markdown模板结构输出
2. 内容必须基于提供的页面数据，不得臆造功能
3. 语言为简体中文，通俗易懂，面向非技术用户
4. 操作步骤要详细、具体，每一步都要明确用户需要做什么、看到什么
5. 所有模块必须完整输出，不可省略
6. 输出纯Markdown格式，不要用代码块包裹

输出模板结构：
# 【页面/系统名称】用户操作手册

## 1. 手册概述
（产品简介、适用对象、手册用途）

## 2. 功能导航
| 序号 | 功能模块 | 功能说明 |
|------|---------|---------|
| 1    |         |         |

## 3. 操作步骤详解
### 3.1 [功能模块名称]
**前置条件：**（使用该功能前需要满足的条件）
**操作步骤：**
1. 步骤一（具体操作 + 在哪里操作）
2. 步骤二（具体操作 + 预期反馈）
3. ...
**预期结果：**（操作完成后的预期效果）

（按功能模块逐个展开）

## 4. 常见问题与解答
| 序号 | 问题 | 解答 |
|------|------|------|
| 1    |       |      |

## 5. 注意事项与提示
- （使用过程中需要特别注意的事项、限制、风险提示等）`;
  }

  function buildManualUserPrompt(pageData) {
    const { pageInfo, interactions, elements, url, title } = pageData;

    let prompt = `请根据以下网页数据生成用户操作手册：\n\n`;
    prompt += `## 页面基础信息\n`;
    prompt += `- 页面标题：${title || '未知'}\n`;
    prompt += `- 页面URL：${url || '未知'}\n\n`;

    if (pageInfo && pageInfo.length > 0) {
      prompt += `## 页面结构信息\n`;
      prompt += pageInfo.map(info => `- ${info}`).join('\n');
      prompt += '\n\n';
    }

    if (elements && elements.length > 0) {
      prompt += `## 页面元素信息\n`;
      prompt += elements.map(el => {
        let desc = `- 类型：${el.type}，标签：${el.label || el.text || '无'}`;
        if (el.placeholder) desc += `，占位符：${el.placeholder}`;
        if (el.required) desc += `，必填`;
        if (el.options && el.options.length > 0) desc += `，选项：${el.options.join('/')}`;
        return desc;
      }).join('\n');
      prompt += '\n\n';
    }

    if (interactions && interactions.length > 0) {
      prompt += `## 用户交互行为记录（按操作顺序）\n`;
      prompt += interactions.map((inter, i) => {
        let desc = `${i + 1}. 操作类型：${inter.type}`;
        if (inter.target) desc += `，目标：${inter.target}`;
        if (inter.value !== undefined && inter.value !== '') desc += `，输入值：${inter.value}`;
        if (inter.result) desc += `，结果：${inter.result}`;
        return desc;
      }).join('\n');
      prompt += '\n\n';
    }

    prompt += `请严格按照操作手册模板结构生成完整的Markdown文档，语言通俗易懂，步骤清晰详细，面向非技术终端用户。`;
    return prompt;
  }

  // ===== PRD生成（popup直接调用AI，不经过background） =====

  async function generatePRD() {
    if (!state.isConfigured) {
      showToast('请先配置有效的API Key', 'warning');
      switchTab('settings');
      return;
    }

    if (state.interactionCount === 0) {
      showToast('请先启动监听并操作页面', 'warning');
      return;
    }

    showLoading('正在采集页面数据...');

    try {
      const dataResponse = await sendTabMessage({ type: 'getCollectedData' });
      if (!dataResponse.success || !dataResponse.data) {
        hideLoading();
        showToast('获取页面数据失败，请确认监听已启动', 'error');
        return;
      }

      showLoading('正在调用AI生成PRD文档...');

      const pageData = dataResponse.data;

      // 从storage读取API配置
      const config = await chrome.storage.local.get(['apiKey', 'apiUrl', 'model']);
      const apiKey = config.apiKey || '';
      const apiUrl = config.apiUrl || DEFAULT_API_URL;
      const model = config.model || DEFAULT_MODEL;

      if (!apiKey) {
        hideLoading();
        showToast('API Key未配置', 'error');
        return;
      }

      // 构建提示词
      const systemPrompt = buildSystemPrompt();
      const userPrompt = buildUserPrompt(pageData);

      // 直接调用AI接口
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        hideLoading();
        let errorMsg = `HTTP错误 ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error?.message || errorMsg;
        } catch (e) { /* 忽略 */ }
        if (response.status === 401) errorMsg = 'API Key无效或已过期，请重新配置';
        showToast('生成失败：' + errorMsg, 'error');
        return;
      }

      const data = await response.json();
      if (!data.choices || data.choices.length === 0) {
        hideLoading();
        showToast('AI返回数据为空，请重试', 'error');
        return;
      }

      const content = data.choices[0].message.content;
      const pageName = extractPageName(content);
      const fileName = generateFileName(pageName, 'PRD文档');

      hideLoading();

      state.currentPRD = {
        id: 'prd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
        content,
        fileName,
        pageName,
        pageUrl: pageData.url || '',
        type: 'prd',
        createTime: Date.now(),
      };

      // 自动保存到历史记录
      try {
        await dbSavePRD(state.currentPRD);
      } catch (e) { /* 保存失败不影响预览 */ }

      dom.previewContent.textContent = content;
      dom.previewSection.style.display = 'block';
      showToast('PRD文档生成成功，已保存到历史', 'success');
    } catch (error) {
      hideLoading();
      let hint = error.message;
      if (hint.includes('Failed to fetch') || hint.includes('NetworkError')) {
        hint = '网络请求失败，请检查API地址和网络连接';
      }
      showToast('生成失败：' + hint, 'error');
    }
  }

  // ===== AI提示词构建 =====

  function buildSystemPrompt() {
    return `你是一位资深产品经理，擅长编写标准化、结构化的产品需求文档(PRD)。
你的任务是根据提供的网页交互数据和页面信息，生成一份完整的PRD文档。

要求：
1. 严格按照指定的Markdown模板结构输出
2. 内容必须基于提供的页面数据，不得臆造功能
3. 语言为简体中文，逻辑通顺、专业规范
4. 所有模块必须完整输出，不可省略
5. 输出纯Markdown格式，不要用代码块包裹

输出模板结构：
# 【页面功能名】产品需求文档

## 1. 功能概述
（当前页面/模块的业务用途、使用场景、核心价值）

## 2. 页面信息
- 页面URL：
- 页面名称：
- 页面类型：（列表页/详情页/编辑页/弹窗功能等）

## 3. 核心功能列表
| 序号 | 功能名称 | 功能描述 |
|------|---------|---------|
| 1    |         |         |

## 4. 操作流程说明
（用户操作步骤、功能触发逻辑、前置条件、后置结果）

## 5. 页面元素说明
### 5.1 按钮说明
### 5.2 表单说明
### 5.3 弹窗说明
### 5.4 筛选项说明

## 6. 业务规则
### 6.1 表单校验规则
### 6.2 状态限制规则
### 6.3 权限逻辑
### 6.4 特殊场景规则

## 7. 异常场景
| 序号 | 异常场景 | 触发条件 | 提示信息/处理方式 |
|------|---------|---------|-----------------|

## 8. 功能优先级
- 默认优先级：普通
- 说明：（如有特殊优先级标注）`;
  }

  function buildUserPrompt(pageData) {
    const { pageInfo, interactions, elements, url, title } = pageData;

    let prompt = `请根据以下网页数据生成PRD文档：\n\n`;
    prompt += `## 页面基础信息\n`;
    prompt += `- 页面标题：${title || '未知'}\n`;
    prompt += `- 页面URL：${url || '未知'}\n\n`;

    if (pageInfo && pageInfo.length > 0) {
      prompt += `## 页面结构信息\n`;
      prompt += pageInfo.map(info => `- ${info}`).join('\n');
      prompt += '\n\n';
    }

    if (elements && elements.length > 0) {
      prompt += `## 页面元素信息\n`;
      prompt += elements.map(el => {
        let desc = `- 类型：${el.type}，标签：${el.label || el.text || '无'}`;
        if (el.placeholder) desc += `，占位符：${el.placeholder}`;
        if (el.required) desc += `，必填`;
        if (el.options && el.options.length > 0) desc += `，选项：${el.options.join('/')}`;
        return desc;
      }).join('\n');
      prompt += '\n\n';
    }

    if (interactions && interactions.length > 0) {
      prompt += `## 用户交互行为记录（按操作顺序）\n`;
      prompt += interactions.map((inter, i) => {
        let desc = `${i + 1}. 操作类型：${inter.type}`;
        if (inter.target) desc += `，目标：${inter.target}`;
        if (inter.value !== undefined && inter.value !== '') desc += `，输入值：${inter.value}`;
        if (inter.result) desc += `，结果：${inter.result}`;
        return desc;
      }).join('\n');
      prompt += '\n\n';
    }

    prompt += `请严格按照PRD模板结构生成完整的Markdown文档，确保所有模块内容完整、专业。`;
    return prompt;
  }

  function extractPageName(content) {
    const match = content.match(/^#\s*【(.+?)】/m) || content.match(/^#\s*(.+?)产品需求文档/m) || content.match(/^#\s*(.+?)[\r\n]/m);
    return match ? match[1].trim() : '未命名页面';
  }

  // ===== 文件导出（popup直接下载，不经过background） =====

  function downloadMarkdown(content, fileName) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function generateFileName(pageName, suffix) {
    const now = new Date();
    const ts = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join('');
    return `${pageName}${suffix}_${ts}.md`;
  }

  async function exportPRD() {
    if (!state.currentPRD) return;
    try {
      downloadMarkdown(state.currentPRD.content, state.currentPRD.fileName);
      showToast('文件已导出', 'success');
    } catch (error) {
      showToast('导出失败：' + error.message, 'error');
    }
  }

  // ===== API配置 =====

  async function loadConfig() {
    try {
      const result = await chrome.storage.local.get(['apiKey', 'apiUrl', 'model']);
      const apiKey = result.apiKey || '';
      const apiUrl = result.apiUrl || DEFAULT_API_URL;
      const model = result.model || DEFAULT_MODEL;

      if (apiKey) {
        dom.inputApiKey.placeholder = `已配置（${apiKey.substring(0, 4)}****）`;
        dom.inputApiKey.value = '';
        state.isConfigured = true;
      } else {
        dom.inputApiKey.placeholder = '请输入API Key';
        dom.inputApiKey.value = '';
        state.isConfigured = false;
      }
      dom.inputApiUrl.value = apiUrl === DEFAULT_API_URL ? '' : apiUrl;
      dom.inputModel.value = model === DEFAULT_MODEL ? '' : model;
      state.apiKeyModified = false;
      updateGenerateButton();
    } catch (error) {
      showConfigStatus('加载配置失败', 'error');
    }
  }

  async function saveConfig() {
    const apiKeyInput = dom.inputApiKey.value.trim();
    const apiUrlInput = dom.inputApiUrl.value.trim();
    const modelInput = dom.inputModel.value.trim();

    let existingConfig = {};
    try {
      existingConfig = await chrome.storage.local.get(['apiKey']);
    } catch (e) { /* 忽略 */ }

    const saveData = {};
    if (state.apiKeyModified) {
      if (!apiKeyInput) {
        showConfigStatus('API Key不能为空', 'error');
        return false;
      }
      saveData.apiKey = apiKeyInput;
    } else {
      saveData.apiKey = existingConfig.apiKey || '';
    }
    saveData.apiUrl = apiUrlInput || DEFAULT_API_URL;
    saveData.model = modelInput || DEFAULT_MODEL;

    try {
      await chrome.storage.local.set(saveData);
      state.isConfigured = !!saveData.apiKey;
      state.apiKeyModified = false;
      if (saveData.apiKey) {
        dom.inputApiKey.placeholder = `已配置（${saveData.apiKey.substring(0, 4)}****）`;
        dom.inputApiKey.value = '';
      }
      updateGenerateButton();
      showConfigStatus('配置保存成功', 'success');
      return true;
    } catch (error) {
      showConfigStatus('保存失败：' + error.message, 'error');
      return false;
    }
  }

  async function testConnection() {
    const apiKeyInput = dom.inputApiKey.value.trim();

    if (!state.isConfigured && !state.apiKeyModified) {
      showConfigStatus('请先填写API Key', 'error');
      return;
    }
    if (state.apiKeyModified && !apiKeyInput) {
      showConfigStatus('API Key不能为空', 'error');
      return;
    }

    const saved = await saveConfig();
    if (!saved) return;

    let config;
    try {
      config = await chrome.storage.local.get(['apiKey', 'apiUrl', 'model']);
    } catch (e) {
      showConfigStatus('读取配置失败', 'error');
      return;
    }

    const apiKey = config.apiKey || '';
    const apiUrl = config.apiUrl || DEFAULT_API_URL;
    const model = config.model || DEFAULT_MODEL;

    if (!apiKey) {
      showConfigStatus('API Key未配置', 'error');
      return;
    }

    showConfigStatus('正在测试连接...', 'info');

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: '你好，请回复"连接成功"' }],
          max_tokens: 20,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
          showConfigStatus('连接成功，API Key有效', 'success');
          state.isConfigured = true;
          updateGenerateButton();
        } else {
          showConfigStatus('API返回数据格式异常，请检查接口地址', 'error');
        }
      } else {
        let errorMsg = `HTTP错误 ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error?.message || errorMsg;
        } catch (e) { /* 忽略 */ }
        if (response.status === 401) errorMsg = 'API Key无效或已过期';
        else if (response.status === 404) errorMsg = '接口地址不存在，请检查API接口地址';
        showConfigStatus('连接失败：' + errorMsg, 'error');
      }
    } catch (error) {
      let hint = error.message;
      if (hint.includes('Failed to fetch') || hint.includes('NetworkError')) {
        hint = '网络请求失败，请检查API地址和网络连接';
      }
      showConfigStatus('连接失败：' + hint, 'error');
    }
  }

  function toggleApiKeyVisibility() {
    const input = dom.inputApiKey;
    if (input.type === 'password') {
      input.type = 'text';
      dom.btnToggleKey.textContent = '🔒';
    } else {
      input.type = 'password';
      dom.btnToggleKey.textContent = '👁';
    }
  }

  function showConfigStatus(message, type) {
    dom.configStatus.textContent = message;
    dom.configStatus.className = 'config-status ' + type;
  }

  function updateGenerateButton() {
    const canGenerate = state.isConfigured && state.isListening && state.interactionCount > 0;
    dom.btnGenerate.disabled = !canGenerate;
    dom.btnGenerateManual.disabled = !canGenerate;

    if (!state.isConfigured) {
      dom.generateHint.textContent = '请先配置有效的API Key';
    } else if (!state.isListening) {
      dom.generateHint.textContent = '请先启动监听并操作页面，然后生成PRD文档';
    } else if (state.interactionCount === 0) {
      dom.generateHint.textContent = '请操作页面后再生成PRD文档';
    } else {
      dom.generateHint.textContent = `已采集 ${state.interactionCount} 条交互记录，可以生成PRD文档`;
    }
  }

  // ===== 历史记录（popup直接操作IndexedDB） =====

  async function loadHistory() {
    try {
      const list = await dbGetAllPRDs();
      renderHistoryList(list);
    } catch (error) {
      renderHistoryList([]);
    }
  }

  function renderHistoryList(list) {
    if (!list || list.length === 0) {
      dom.historyEmpty.style.display = 'block';
      dom.btnClearAll.style.display = 'none';
      const items = dom.historyList.querySelectorAll('.history-item');
      items.forEach(item => item.remove());
      return;
    }

    dom.historyEmpty.style.display = 'none';
    dom.btnClearAll.style.display = 'inline-block';

    const existingItems = dom.historyList.querySelectorAll('.history-item');
    existingItems.forEach(item => item.remove());

    list.forEach(record => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.dataset.id = record.id;

      const time = formatTime(record.createTime);
      let pageUrl = '';
      try { pageUrl = record.pageUrl ? new URL(record.pageUrl).pathname : ''; } catch (e) { pageUrl = record.pageUrl || ''; }

      const typeLabel = record.type === 'interaction' ? '交互记录' : record.type === 'manual' ? '操作手册' : 'PRD文档';
      const typeClass = record.type === 'interaction' ? 'tag-interaction' : record.type === 'manual' ? 'tag-manual' : 'tag-prd';

      item.innerHTML = `
        <div class="history-info">
          <div class="history-name">
            <span class="history-type-tag ${typeClass}">${typeLabel}</span>
            <span title="${escapeHtml(record.fileName)}">${escapeHtml(record.fileName)}</span>
          </div>
          <div class="history-meta">${time}${pageUrl ? ' · ' + escapeHtml(pageUrl) : ''}</div>
        </div>
      `;

      item.addEventListener('click', () => previewHistory(record.id));
      dom.historyList.appendChild(item);
    });
  }

  async function previewHistory(id) {
    try {
      const record = await dbGetPRD(id);
      if (record) {
        state.currentHistoryId = id;
        dom.historyPreviewTitle.textContent = record.fileName;
        dom.historyPreviewContent.textContent = record.content;
        dom.historyPreviewSection.style.display = 'block';
      } else {
        showToast('文件不存在', 'error');
      }
    } catch (error) {
      showToast('获取文件失败', 'error');
    }
  }

  async function reDownloadHistory() {
    if (!state.currentHistoryId) return;
    try {
      const record = await dbGetPRD(state.currentHistoryId);
      if (record) {
        downloadMarkdown(record.content, record.fileName);
        showToast('文件已下载', 'success');
      }
    } catch (error) {
      showToast('下载失败', 'error');
    }
  }

  async function deleteHistoryRecord() {
    if (!state.currentHistoryId) return;
    try {
      await dbDeletePRD(state.currentHistoryId);
      dom.historyPreviewSection.style.display = 'none';
      state.currentHistoryId = null;
      showToast('记录已删除', 'success');
      loadHistory();
    } catch (error) {
      showToast('删除失败', 'error');
    }
  }

  async function clearAllHistory() {
    if (!confirm('确定要清空所有历史记录吗？此操作不可恢复。')) return;
    try {
      await dbClearAllPRDs();
      dom.historyPreviewSection.style.display = 'none';
      state.currentHistoryId = null;
      showToast('已清空所有历史记录', 'success');
      loadHistory();
    } catch (error) {
      showToast('清空失败', 'error');
    }
  }

  // ===== 工具函数 =====
  function showLoading(text) {
    dom.loadingText.textContent = text || '处理中...';
    dom.loadingOverlay.style.display = 'flex';
  }

  function hideLoading() {
    dom.loadingOverlay.style.display = 'none';
  }

  function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type || 'info'}`;
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  // ===== 启动 =====
  init();
})();
