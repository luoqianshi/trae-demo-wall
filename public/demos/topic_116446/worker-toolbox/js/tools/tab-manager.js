/**
 * 打工人的工具箱 - 标签页管理
 * 保存当前标签页到列表，可随时点击打开
 * 数据持久化保存
 */

(function() {
  'use strict';

  /**
   * 初始化
   */
  function init() {
    bindEvents();
    loadSavedTabs();
    
    // 监听页面进入事件
    document.addEventListener('pageEnter', (e) => {
      if (e.detail.pageId === 'tab-managerPage') {
        loadSavedTabs();
      }
    });
    
    // 监听数据重置事件
    document.addEventListener('dataReset', loadSavedTabs);
    document.addEventListener('dataImported', loadSavedTabs);
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 保存当前标签页按钮
    document.getElementById('saveCurrentTabBtn').addEventListener('click', saveCurrentTab);
    
    // 清空所有标签按钮
    document.getElementById('clearAllTabsBtn').addEventListener('click', clearAllTabs);
  }

  /**
   * 保存当前标签页
   */
  function saveCurrentTab() {
    // 获取当前活动标签页
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs && tabs.length > 0) {
        const tab = tabs[0];
        
        // 检查是否已保存
        const savedTabs = await Storage.getSavedTabs();
        const exists = savedTabs.find(t => t.url === tab.url);
        
        if (exists) {
          App.showToast('该标签页已保存', 'warning');
          return;
        }
        
        // 保存标签页
        await Storage.saveTab({
          title: tab.title,
          url: tab.url,
          favIconUrl: tab.favIconUrl || ''
        });
        
        await loadSavedTabs();
        App.showToast('标签页已保存', 'success');
      } else {
        App.showToast('无法获取当前标签页', 'error');
      }
    });
  }

  /**
   * 加载保存的标签页
   */
  async function loadSavedTabs() {
    const tabs = await Storage.getSavedTabs();
    const container = document.getElementById('savedTabsList');
    const emptyState = document.getElementById('tabsEmpty');
    
    if (tabs.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    
    emptyState.style.display = 'none';
    container.innerHTML = '';
    
    tabs.forEach(tab => {
      const tabEl = createTabItem(tab);
      container.appendChild(tabEl);
    });
  }

  /**
   * 创建标签页项
   */
  function createTabItem(tab) {
    const div = document.createElement('div');
    div.className = 'tab-item';
    
    // 网站图标
    const favicon = tab.favIconUrl 
      ? `<img class="tab-favicon" src="${escapeHtml(tab.favIconUrl)}" alt="" onerror="this.style.display='none'">`
      : `<span class="tab-favicon" style="font-size: 16px;">🌐</span>`;
    
    div.innerHTML = `
      ${favicon}
      <div style="flex: 1; min-width: 0;">
        <div class="tab-title" title="${escapeHtml(tab.title)}">${escapeHtml(tab.title)}</div>
        <div class="tab-url" style="color: var(--pixel-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(tab.url)}</div>
      </div>
      <div class="tab-actions">
        <button class="pixel-btn pixel-btn-sm pixel-btn-danger" data-action="delete" title="删除">×</button>
      </div>
    `;
    
    // 点击打开标签页
    div.addEventListener('click', (e) => {
      // 如果点击的是删除按钮，不打开
      if (e.target.closest('[data-action="delete"]')) {
        return;
      }
      openTab(tab.url);
    });
    
    // 删除按钮
    div.querySelector('[data-action="delete"]').addEventListener('click', async (e) => {
      e.stopPropagation();
      await Storage.removeSavedTab(tab.id);
      await loadSavedTabs();
      App.showToast('已删除', 'success');
    });
    
    return div;
  }

  /**
   * 打开标签页
   */
  function openTab(url) {
    chrome.tabs.create({ url }, () => {
      if (chrome.runtime.lastError) {
        App.showToast('打开失败: ' + chrome.runtime.lastError.message, 'error');
      }
    });
  }

  /**
   * 清空所有标签页
   */
  async function clearAllTabs() {
    const tabs = await Storage.getSavedTabs();
    
    if (tabs.length === 0) {
      App.showToast('没有可清除的标签页', 'warning');
      return;
    }
    
    if (!confirm(`确定要清除所有 ${tabs.length} 个保存的标签页吗？`)) {
      return;
    }
    
    await Storage.clearSavedTabs();
    await loadSavedTabs();
    App.showToast('已清空所有标签页', 'success');
  }

  /**
   * HTML转义
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
