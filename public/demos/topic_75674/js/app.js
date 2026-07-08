/**
 * @fileoverview 主入口模块
 * @description 负责导入所有模块、在 DOMContentLoaded 时初始化应用、绑定全局事件。
 *              是整个应用的启动入口，协调各模块之间的协作。
 * @module app
 */

import { EventBus } from './event-bus.js';
import { StorageAPI } from './storage.js';
import { ContextParser } from './context-parser.js';
import { AIGeneration } from './ai-generation.js';
import { ConversationModule } from './conversation.js';
import { ReplyShowcase } from './reply-showcase.js';

// ============================================================
// DOM Ready 初始化
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  // 1. 初始化会话管理模块
  await ConversationModule.init();

  // 2. 初始化回复展示模块
  ReplyShowcase.init();

  // 3. 绑定输入区 paste 事件 → parseAndSet
  _bindInputArea();

  // 4. 绑定生成按钮 click 事件 → AIGeneration.generate
  _bindGenerateButton();

  // 5. 绑定新建会话按钮
  _bindNewSessionButton();

  // 6. 绑定设置面板相关事件
  _bindSettingsPanel();

  // 7. 绑定移动端侧边栏汉堡菜单
  _bindMobileSidebar();

  // 8. 监听 AI 生成请求事件（由 ReplyShowcase 重试按钮等触发）
  EventBus.on('ai:generate-request', () => {
    _handleGenerate();
  });

  // 9. 监听情绪分析生成请求
  EventBus.on('ai:emotion-generate-request', () => {
    _handleEmotionAnalysis();
  });
});

// ============================================================
// 事件绑定
// ============================================================

/**
 * 绑定输入区粘贴事件
 * @private
 */
function _bindInputArea() {
  const inputArea = document.getElementById('ycjs-input-area');
  if (!inputArea) return;

  // 监听 paste 事件
  inputArea.addEventListener('paste', (e) => {
    // 延迟获取粘贴内容（等待浏览器写入）
    setTimeout(() => {
      const rawText = inputArea.value || inputArea.textContent || '';
      if (rawText.trim()) {
        ConversationModule.parseAndSet(rawText);
        // 清空输入区
        inputArea.value = '';
        inputArea.textContent = '';
      }
    }, 50);
  });

  // 监听手动提交（如果用户输入后按 Ctrl+Enter）
  inputArea.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      const rawText = inputArea.value || '';
      if (rawText.trim()) {
        ConversationModule.parseAndSet(rawText);
        inputArea.value = '';
      }
    }
  });
}

/**
 * 绑定生成回复按钮
 * @private
 */
function _bindGenerateButton() {
  const btn = document.getElementById('ycjs-btn-generate');
  if (!btn) return;

  btn.addEventListener('click', () => {
    _handleGenerate();
  });
}

/**
 * 处理生成回复的逻辑
 * @private
 */
async function _handleGenerate() {
  const messages = ConversationModule.getMessagesForAI();

  // 校验：消息不能为空
  if (!messages || messages.length === 0) {
    ReplyShowcase.showError('请先粘贴聊天内容');
    return;
  }

  // 获取当前会话设置
  const session = ConversationModule.currentSession;
  const myName = session?.settings?.myName || '我';
  const otherName = session?.settings?.otherName || '对方';

  // 从偏好设置中读取默认语气
  const prefs = StorageAPI.getPreferences();

  // 构建请求
  const request = {
    messages,
    myName,
    otherName,
    requestType: 'both', // 同时生成回复和情绪分析
    tone: prefs.defaultTone || 'friendly',
  };

  // 触发 AI 生成
  EventBus.emit('ai:generation-start', { sessionId: session?.id });

  try {
    const response = await AIGeneration.generate(request);

    if (response && response.success) {
      EventBus.emit('ai:reply-generated', {
        sessionId: session?.id,
        response,
      });
    } else {
      EventBus.emit('ai:generation-error', {
        sessionId: session?.id,
        error: response?.error || 'AI 生成失败，请重试',
      });
    }
  } catch (err) {
    EventBus.emit('ai:generation-error', {
      sessionId: session?.id,
      error: err.message || '网络错误，请检查连接后重试',
    });
  }
}

/**
 * 处理情绪分析的逻辑
 * @private
 */
async function _handleEmotionAnalysis() {
  const messages = ConversationModule.getMessagesForAI();
  if (!messages || messages.length === 0) {
    ReplyShowcase.showError('请先粘贴聊天内容');
    return;
  }

  const session = ConversationModule.currentSession;
  const myName = session?.settings?.myName || '我';
  const otherName = session?.settings?.otherName || '对方';

  // 触发 AI 生成开始事件
  EventBus.emit('ai:generation-start', { sessionId: session?.id });

  try {
    const response = await AIGeneration.generate({
      messages,
      myName,
      otherName,
      requestType: 'both',
    });
    if (response && response.success) {
      EventBus.emit('ai:reply-generated', { sessionId: session?.id, response });
    }
  } catch (err) {
    EventBus.emit('ai:generation-error', { sessionId: session?.id, error: err.message });
  }
}

/**
 * 绑定新建会话按钮
 * @private
 */
function _bindNewSessionButton() {
  const btn = document.getElementById('ycjs-btn-new-session');
  if (!btn) return;

  btn.addEventListener('click', () => {
    ConversationModule.createSession();
    ReplyShowcase.clear();

    // 移动端自动关闭侧边栏
    _closeMobileSidebar();
  });
}

/**
 * 服务商 value → DEFAULT_PROVIDERS 索引映射
 */
const PROVIDER_VALUE_MAP = {
  openai: 0,
  zhipu: 1,
  deepseek: 2,
  qwen: 3,
  ark: 4,
};
const PROVIDER_INDEX_MAP = {
  0: 'openai',
  1: 'zhipu',
  2: 'deepseek',
  3: 'qwen',
  4: 'ark',
};

/**
 * 从表单加载配置到 LocalStorage
 * @private
 */
function _loadSettingsForm() {
  const providers = AIGeneration.getProviders();
  const activeIdx = providers.findIndex(p => p.enabled) || 0;
  const activeProvider = providers[activeIdx];

  // 填充 AI 服务商
  const providerSelect = document.getElementById('ycjs-setting-provider');
  if (providerSelect) {
    providerSelect.value = PROVIDER_INDEX_MAP[activeIdx] || 'zhipu';
  }

  // 填充 API Key
  const apiKeyInput = document.getElementById('ycjs-setting-apikey');
  if (apiKeyInput) {
    apiKeyInput.value = activeProvider?.apiKey || '';
  }

  // 填充自定义 API 地址
  const baseUrlInput = document.getElementById('ycjs-setting-baseurl');
  if (baseUrlInput) {
    baseUrlInput.value = activeProvider?.baseUrl || '';
  }

  // 填充偏好设置
  const toneSelect = document.getElementById('ycjs-setting-default-tone');
  if (toneSelect) {
    const prefs = StorageAPI.getPreferences();
    toneSelect.value = prefs.defaultTone || 'friendly';
  }

  const maxSessionsInput = document.getElementById('ycjs-setting-max-sessions');
  if (maxSessionsInput) {
    const prefs = StorageAPI.getPreferences();
    maxSessionsInput.value = prefs.maxHistorySessions || 50;
  }
}

/**
 * 保存表单配置到 LocalStorage
 * @private
 */
function _saveSettingsForm() {
  // 读取表单
  const providerValue = document.getElementById('ycjs-setting-provider')?.value || 'zhipu';
  const apiKey = document.getElementById('ycjs-setting-apikey')?.value?.trim() || '';
  const customBaseUrl = document.getElementById('ycjs-setting-baseurl')?.value?.trim() || '';
  const tone = document.getElementById('ycjs-setting-default-tone')?.value || 'friendly';
  const maxSessions = parseInt(document.getElementById('ycjs-setting-max-sessions')?.value || '50', 10);

  const targetIdx = PROVIDER_VALUE_MAP[providerValue];
  if (targetIdx === undefined) return;

  // 更新 Provider 配置
  const providers = AIGeneration.getProviders();
  providers.forEach((p, i) => {
    p.enabled = (i === targetIdx);
    if (i === targetIdx) {
      p.apiKey = apiKey;
      if (customBaseUrl) p.baseUrl = customBaseUrl;
    }
  });
  AIGeneration.saveProviders(providers);

  // 更新偏好设置
  StorageAPI.savePreferences({
    defaultTone: tone,
    maxHistorySessions: maxSessions,
  });

  // 轻提示
  _showToast('设置已保存');
}

/**
 * 显示轻提示（Toast）
 * @private
 */
function _showToast(message) {
  let toast = document.getElementById('ycjs-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ycjs-toast';
    toast.style.cssText = 'position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#1E293B; color:#fff; padding:10px 20px; border-radius:8px; font-size:14px; z-index:9999; opacity:0; transition:opacity 0.3s; pointer-events:none;';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

/**
 * 绑定设置面板事件
 * @private
 */
function _bindSettingsPanel() {
  // 打开设置按钮（齿轮图标）
  const settingsBtn = document.getElementById('ycjs-btn-settings');
  const settingsDrawer = document.getElementById('ycjs-settings-drawer');
  const settingsOverlay = document.getElementById('ycjs-settings-overlay');

  if (settingsBtn && settingsDrawer) {
    settingsBtn.addEventListener('click', () => {
      _loadSettingsForm(); // 打开时加载当前配置
      settingsDrawer.classList.add('ycjs-settings-drawer--open');
      if (settingsOverlay) settingsOverlay.classList.add('ycjs-settings-overlay--visible');
    });
  }

  // 关闭设置面板
  function closeSettings() {
    settingsDrawer.classList.remove('ycjs-settings-drawer--open');
    if (settingsOverlay) settingsOverlay.classList.remove('ycjs-settings-overlay--visible');
  }

  if (settingsDrawer) {
    const closeBtn = settingsDrawer.querySelector('.ycjs-settings-drawer__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeSettings);
    }
  }

  if (settingsOverlay) {
    settingsOverlay.addEventListener('click', closeSettings);
  }

  // 保存设置按钮
  const saveBtn = document.getElementById('ycjs-btn-save-settings');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      _saveSettingsForm();
    });
  }

  // 数据导出
  const exportBtn = document.getElementById('ycjs-btn-export');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
        const data = await StorageAPI.exportAll();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        a.href = url;
        a.download = `ycjs_backup_${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        alert('导出失败: ' + err.message);
      }
    });
  }

  // 数据导入
  const importBtn = document.getElementById('ycjs-btn-import');
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (!confirm('导入将覆盖现有数据，是否继续？')) return;
          await StorageAPI.importAll(data);
          alert('导入成功，页面将刷新');
          window.location.reload();
        } catch (err) {
          alert('导入失败: ' + err.message);
        }
      });
      fileInput.click();
    });
  }

  // 清除所有数据
  const clearBtn = document.getElementById('ycjs-btn-clear-data');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (!confirm('确定要清除所有数据？此操作不可撤销！')) return;
      try {
        await StorageAPI.clearAll();
        localStorage.removeItem('ycjs_active_session');
        alert('数据已清除，页面将刷新');
        window.location.reload();
      } catch (err) {
        alert('清除失败: ' + err.message);
      }
    });
  }
}

/**
 * 绑定移动端侧边栏汉堡菜单
 * @private
 */
function _bindMobileSidebar() {
  const menuBtn = document.getElementById('ycjs-btn-menu');
  const sidebar = document.getElementById('ycjs-sidebar');
  const overlay = document.getElementById('ycjs-sidebar-overlay');

  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('ycjs-sidebar--open');
      if (overlay) overlay.classList.toggle('ycjs-sidebar-overlay--visible');
    });
  }

  if (overlay && sidebar) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('ycjs-sidebar--open');
      overlay.classList.remove('ycjs-sidebar-overlay--visible');
    });
  }
}

/**
 * 关闭移动端侧边栏
 * @private
 */
function _closeMobileSidebar() {
  const sidebar = document.getElementById('ycjs-sidebar');
  const overlay = document.getElementById('ycjs-sidebar-overlay');
  if (sidebar) sidebar.classList.remove('ycjs-sidebar--open');
  if (overlay) overlay.classList.remove('ycjs-sidebar-overlay--visible');
}
