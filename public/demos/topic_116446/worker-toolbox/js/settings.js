/**
 * 打工人的工具箱 - 设置页面逻辑
 * 负责设置项的加载、保存、数据导入导出等功能
 */

(function() {
  'use strict';

  /**
   * 初始化设置页面
   */
  async function init() {
    await loadSettings();
    await renderToolSortList();
    bindEvents();
  }

  /**
   * 加载设置
   */
  async function loadSettings() {
    const settings = await Storage.getSettings();
    
    document.getElementById('downloadPathInput').value = settings.downloadPath;
    document.getElementById('pomodoroWorkTime').value = settings.pomodoroWorkTime;
    document.getElementById('pomodoroBreakTime').value = settings.pomodoroBreakTime;
    document.getElementById('pomodoroLongBreakTime').value = settings.pomodoroLongBreakTime;
    document.getElementById('pomodoroLongBreakInterval').value = settings.pomodoroLongBreakInterval;
  }

  /**
   * 渲染工具排序列表
   */
  async function renderToolSortList() {
    const settings = await Storage.getSettings();
    const sortList = document.getElementById('toolSortList');
    sortList.innerHTML = '';

    // 按照设置的顺序排列
    const toolMap = {};
    App.TOOLS.forEach(tool => {
      toolMap[tool.id] = tool;
    });

    const orderedTools = [];
    settings.toolOrder.forEach(toolId => {
      if (toolMap[toolId]) {
        orderedTools.push(toolMap[toolId]);
      }
    });

    // 添加未在顺序中的工具
    App.TOOLS.forEach(tool => {
      if (!orderedTools.includes(tool)) {
        orderedTools.push(tool);
      }
    });

    orderedTools.forEach((tool, index) => {
      const item = createSortableItem(tool, index, settings.hiddenTools.includes(tool.id));
      sortList.appendChild(item);
    });
  }

  /**
   * 创建可排序列表项
   */
  function createSortableItem(tool, index, isHidden) {
    const li = document.createElement('li');
    li.className = 'sortable-item';
    li.draggable = true;
    li.dataset.toolId = tool.id;
    li.dataset.index = index;

    li.innerHTML = `
      <span class="sortable-handle">⋮⋮</span>
      <span class="sortable-icon">${tool.icon}</span>
      <span class="sortable-name">${tool.name}</span>
      <div class="pixel-switch ${isHidden ? '' : 'active'}" data-tool-id="${tool.id}">
        <div class="pixel-switch-knob"></div>
      </div>
    `;

    // 开关切换
    const switchEl = li.querySelector('.pixel-switch');
    switchEl.addEventListener('click', async (e) => {
      e.stopPropagation();
      await toggleToolVisibility(tool.id);
    });

    // 拖拽事件
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragend', handleDragEnd);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);
    li.addEventListener('dragenter', handleDragEnter);
    li.addEventListener('dragleave', handleDragLeave);

    return li;
  }

  // 拖拽状态
  let draggedItem = null;

  function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.sortable-item').forEach(item => {
      item.classList.remove('drag-over');
    });
    saveToolOrder();
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
  }

  function handleDragLeave(e) {
    this.classList.remove('drag-over');
  }

  function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (draggedItem !== this) {
      const sortList = document.getElementById('toolSortList');
      const allItems = [...sortList.children];
      const draggedIndex = allItems.indexOf(draggedItem);
      const dropIndex = allItems.indexOf(this);
      
      if (draggedIndex < dropIndex) {
        this.parentNode.insertBefore(draggedItem, this.nextSibling);
      } else {
        this.parentNode.insertBefore(draggedItem, this);
      }
    }
  }

  /**
   * 保存工具顺序
   */
  async function saveToolOrder() {
    const sortList = document.getElementById('toolSortList');
    const items = sortList.querySelectorAll('.sortable-item');
    const newOrder = [];
    
    items.forEach(item => {
      newOrder.push(item.dataset.toolId);
    });
    
    const settings = await Storage.getSettings();
    settings.toolOrder = newOrder;
    await Storage.saveSettings(settings);
    
    // 重新渲染首页工具网格
    await App.renderToolGrid();
  }

  /**
   * 切换工具显示/隐藏
   */
  async function toggleToolVisibility(toolId) {
    const settings = await Storage.getSettings();
    const index = settings.hiddenTools.indexOf(toolId);
    
    if (index === -1) {
      // 隐藏工具
      settings.hiddenTools.push(toolId);
    } else {
      // 显示工具
      settings.hiddenTools.splice(index, 1);
    }
    
    await Storage.saveSettings(settings);
    
    // 更新开关状态
    const switchEl = document.querySelector(`.pixel-switch[data-tool-id="${toolId}"]`);
    if (switchEl) {
      if (index === -1) {
        switchEl.classList.remove('active');
      } else {
        switchEl.classList.add('active');
      }
    }
    
    // 重新渲染首页工具网格
    await App.renderToolGrid();
    
    App.showToast(index === -1 ? '工具已隐藏' : '工具已显示', 'success');
  }

  /**
   * 保存设置
   */
  async function saveSettings() {
    const settings = {
      downloadPath: document.getElementById('downloadPathInput').value.trim() || 'Downloads',
      pomodoroWorkTime: parseInt(document.getElementById('pomodoroWorkTime').value) || 25,
      pomodoroBreakTime: parseInt(document.getElementById('pomodoroBreakTime').value) || 5,
      pomodoroLongBreakTime: parseInt(document.getElementById('pomodoroLongBreakTime').value) || 15,
      pomodoroLongBreakInterval: parseInt(document.getElementById('pomodoroLongBreakInterval').value) || 4
    };
    
    await Storage.saveSettings(settings);
    App.showToast('设置已保存', 'success');
  }

  /**
   * 导出数据
   */
  async function exportData() {
    try {
      const data = await Storage.exportAllData();
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `worker-toolbox-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      App.showToast('数据导出成功', 'success');
    } catch (error) {
      console.error('导出失败:', error);
      App.showToast('导出失败: ' + error.message, 'error');
    }
  }

  /**
   * 导入数据
   */
  async function importData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!confirm('确定要导入数据吗？这将覆盖当前所有数据！')) {
        return;
      }
      
      await Storage.importData(data);
      App.showToast('数据导入成功', 'success');
      
      // 重新加载设置
      await loadSettings();
      await renderToolSortList();
      await App.renderToolGrid();
      
      // 触发各工具的刷新事件
      const event = new CustomEvent('dataImported');
      document.dispatchEvent(event);
      
    } catch (error) {
      console.error('导入失败:', error);
      App.showToast('导入失败: ' + error.message, 'error');
    }
  }

  /**
   * 重置所有数据
   */
  async function resetData() {
    if (!confirm('确定要重置所有数据吗？此操作不可恢复！')) {
      return;
    }
    
    try {
      await Storage.resetAllData();
      App.showToast('数据已重置', 'success');
      
      // 重新加载设置
      await loadSettings();
      await renderToolSortList();
      await App.renderToolGrid();
      
      // 触发各工具的刷新事件
      const event = new CustomEvent('dataReset');
      document.dispatchEvent(event);
      
    } catch (error) {
      console.error('重置失败:', error);
      App.showToast('重置失败: ' + error.message, 'error');
    }
  }

  /**
   * 打开默认下载文件夹
   */
  function openDownloadFolder() {
    chrome.downloads.showDefaultFolder();
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 输入框变化自动保存
    const inputs = [
      'downloadPathInput',
      'pomodoroWorkTime',
      'pomodoroBreakTime',
      'pomodoroLongBreakTime',
      'pomodoroLongBreakInterval'
    ];
    
    inputs.forEach(id => {
      document.getElementById(id).addEventListener('change', saveSettings);
    });

    // 打开下载文件夹按钮
    document.getElementById('openDownloadFolderBtn').addEventListener('click', openDownloadFolder);

    // 导出数据
    document.getElementById('exportDataBtn').addEventListener('click', exportData);

    // 导入数据
    document.getElementById('importDataBtn').addEventListener('click', () => {
      document.getElementById('importFileInput').click();
    });
    
    document.getElementById('importFileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        importData(file);
      }
      e.target.value = ''; // 重置input
    });

    // 重置数据
    document.getElementById('resetDataBtn').addEventListener('click', resetData);
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
