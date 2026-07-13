/**
 * 打工人的工具箱 - JSON格式化工具
 * 支持JSON格式化、压缩、复制功能
 * 支持历史记录持久化保存
 * 新增：树状编辑器，左侧目录结构，右侧内容编辑
 * 支持节点复制、新增、删除、展开收起操作
 */

(function() {
  'use strict';

  let parsedJson = null;
  let expandedPaths = new Set();
  let collapsedPaths = new Set();
  let selectedPath = [];

  /**
   * 初始化
   */
  function init() {
    bindEvents();
    loadHistory();
    
    document.addEventListener('pageEnter', (e) => {
      if (e.detail.pageId === 'json-formatterPage') {
        loadHistory();
      }
    });
    
    document.addEventListener('dataReset', loadHistory);
    document.addEventListener('dataImported', loadHistory);
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    document.getElementById('formatJsonBtn').addEventListener('click', formatJson);
    document.getElementById('compressJsonBtn').addEventListener('click', compressJson);
    document.getElementById('copyJsonBtn').addEventListener('click', copyJson);
    document.getElementById('saveJsonBtn').addEventListener('click', saveToHistory);
    document.getElementById('jsonExpandAllBtn').addEventListener('click', expandAll);
    document.getElementById('jsonCollapseAllBtn').addEventListener('click', collapseAll);
    
    document.getElementById('jsonInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        formatJson();
      }
    });
  }

  /**
   * 获取值的类型
   */
  function getValueType(value) {
    if (value === null) return 'null';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'unknown';
  }

  /**
   * 获取值的显示文本
   */
  function getValueDisplay(value) {
    const type = getValueType(value);
    if (type === 'string') {
      if (value.length > 50) return `"${value.substring(0, 50)}..."`;
      return `"${value}"`;
    }
    if (type === 'array') return `[${value.length}]`;
    if (type === 'object') return `{${Object.keys(value).length}}`;
    return String(value);
  }

  /**
   * 获取节点路径字符串
   */
  function getPathString(path) {
    return path.join('.');
  }

  /**
   * 判断节点是否展开
   */
  function isExpanded(path) {
    const pathStr = getPathString(path);
    if (expandedPaths.has('*')) {
      // 展开全部模式下，检查是否被单独收起
      return !collapsedPaths.has(pathStr);
    }
    return expandedPaths.has(pathStr);
  }

  /**
   * 切换节点展开状态
   */
  function toggleExpand(path) {
    const pathStr = getPathString(path);
    if (expandedPaths.has('*')) {
      // 展开全部模式下，用 collapsedPaths 记录收起的节点
      if (collapsedPaths.has(pathStr)) {
        collapsedPaths.delete(pathStr);
      } else {
        collapsedPaths.add(pathStr);
      }
    } else {
      if (expandedPaths.has(pathStr)) {
        expandedPaths.delete(pathStr);
      } else {
        expandedPaths.add(pathStr);
      }
    }
  }

  /**
   * 展开全部
   */
  function expandAll() {
    expandedPaths.clear();
    collapsedPaths.clear();
    expandedPaths.add('*');
    renderContentTree(parsedJson);
  }

  /**
   * 收起全部
   */
  function collapseAll() {
    expandedPaths.clear();
    collapsedPaths.clear();
    renderContentTree(parsedJson);
  }

  /**
   * 格式化JSON
   */
  async function formatJson() {
    const input = document.getElementById('jsonInput').value.trim();
    
    if (!input) {
      App.showToast('请输入JSON内容', 'warning');
      return;
    }
    
    // 第一步：解析JSON，单独捕获解析错误
    try {
      parsedJson = JSON.parse(input);
    } catch (error) {
      document.getElementById('jsonTree').innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <div class="empty-state-icon">❌</div>
          <div class="empty-state-text">JSON格式错误: ${error.message}</div>
        </div>
      `;
      document.getElementById('jsonContent').innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <div class="empty-state-icon">❌</div>
          <div class="empty-state-text">JSON格式错误: ${error.message}</div>
        </div>
      `;
      App.showToast('JSON格式错误', 'error');
      return;
    }
    
    // 第二步：渲染树，单独捕获渲染错误
    expandedPaths.clear();
    collapsedPaths.clear();
    selectedPath = [];
    
    try {
      renderContentTree(parsedJson);
    } catch (error) {
      console.error('渲染JSON树失败:', error);
      App.showToast('渲染失败: ' + error.message, 'error');
      return;
    }
    
    App.showToast('格式化成功', 'success');
  }

  /**
   * 保存到历史记录（带命名）
   */
  async function saveToHistory() {
    const input = document.getElementById('jsonInput').value.trim();
    
    if (!input) {
      App.showToast('请先输入JSON内容', 'warning');
      return;
    }
    
    // 验证JSON格式
    try {
      JSON.parse(input);
    } catch (error) {
      App.showToast('JSON格式错误', 'error');
      return;
    }
    
    showNameInputModal((name) => {
      if (!name) return;
      
      const trimmedName = name.trim();
      if (!trimmedName) {
        App.showToast('名称不能为空', 'warning');
        return;
      }
      
      Storage.addJsonHistory({
        name: trimmedName,
        content: input,
        type: parsedJson ? 'format' : 'compress'
      }).then(() => {
        loadHistory();
        App.showToast('保存成功', 'success');
      }).catch((error) => {
        console.error('保存失败:', error);
        App.showToast('保存失败', 'error');
      });
    });
  }

  /**
   * 显示名称输入模态框
   */
  function showNameInputModal(onConfirm) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background-color: #2a2a2a;
      border: 2px solid #4a4a4a;
      border-radius: 4px;
      padding: 20px;
      width: 90%;
      max-width: 320px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    `;
    
    content.innerHTML = `
      <div style="font-family: 'Press Start 2P', monospace; font-size: 10px; color: #00d4ff; margin-bottom: 16px;">📝 输入保存名称</div>
      <input type="text" id="saveNameInput" placeholder="请输入名称" 
        style="width: 100%; padding: 10px; margin-bottom: 12px; 
               background-color: #1a1a1a; border: 2px solid #4a4a4a; 
               border-radius: 4px; color: #fff; font-family: monospace; font-size: 12px;
               outline: none; box-sizing: border-box;" />
      <div style="display: flex; gap: 8px;">
        <button id="saveNameCancel" style="flex: 1; padding: 8px; 
               background-color: #4a4a4a; border: 2px solid #6a6a6a; 
               border-radius: 4px; color: #fff; font-family: 'Press Start 2P', monospace; font-size: 8px;
               cursor: pointer;">取消</button>
        <button id="saveNameConfirm" style="flex: 1; padding: 8px; 
               background-color: #00d4ff; border: 2px solid #00a8cc; 
               border-radius: 4px; color: #000; font-family: 'Press Start 2P', monospace; font-size: 8px;
               cursor: pointer;">保存</button>
      </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    const input = content.querySelector('#saveNameInput');
    const cancelBtn = content.querySelector('#saveNameCancel');
    const confirmBtn = content.querySelector('#saveNameConfirm');
    
    input.focus();
    
    const closeModal = () => {
      document.body.removeChild(modal);
    };
    
    cancelBtn.addEventListener('click', closeModal);
    
    confirmBtn.addEventListener('click', () => {
      onConfirm(input.value);
      closeModal();
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        onConfirm(input.value);
        closeModal();
      } else if (e.key === 'Escape') {
        closeModal();
      }
    });
  }

  /**
   * 压缩JSON
   */
  async function compressJson() {
    const input = document.getElementById('jsonInput').value.trim();
    
    if (!input) {
      App.showToast('请输入JSON内容', 'warning');
      return;
    }
    
    try {
      const obj = JSON.parse(input);
      const compressed = JSON.stringify(obj);
      
      document.getElementById('jsonContent').innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">压缩模式</div>
        </div>
        <div style="font-family: var(--code-font); font-size: var(--code-font-size); padding: 10px;">
          <pre style="white-space: pre-wrap; word-break: break-all;">${escapeHtml(compressed)}</pre>
        </div>
      `;
      
      App.showToast('压缩成功', 'success');
    } catch (error) {
      App.showToast('JSON格式错误', 'error');
    }
  }

  /**
   * 复制JSON
   */
  async function copyJson() {
    if (!parsedJson) {
      App.showToast('请先格式化JSON', 'warning');
      return;
    }
    
    try {
      const text = JSON.stringify(parsedJson, null, 2);
      await navigator.clipboard.writeText(text);
      App.showToast('已复制到剪贴板', 'success');
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = JSON.stringify(parsedJson, null, 2);
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      App.showToast('已复制到剪贴板', 'success');
    }
  }

  /**
   * 渲染右侧内容树
   */
  function renderContentTree(obj) {
    const container = document.getElementById('jsonContent');
    if (!obj) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">请格式化JSON查看内容</div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = '';
    buildContentTree(obj, [], container);
  }

  /**
   * 递归构建内容树 - 使用DOM API创建元素，避免innerHTML导致的安全问题
   */
  function buildContentTree(obj, path, container) {
    const type = getValueType(obj);
    
    if (type === 'object') {
      const keys = Object.keys(obj);
      keys.forEach((key) => {
        const childPath = [...path, key];
        const childObj = obj[key];
        const childType = getValueType(childObj);
        const isParent = childType === 'object' || childType === 'array';
        const hasChildren = isParent && (Object.keys(childObj).length > 0 || childObj.length > 0);
        const isExpandedNode = isExpanded(childPath);
        const isSelected = selectedPath.length > 0 && getPathString(childPath) === getPathString(selectedPath);
        
        const node = createContentNode(key, childObj, childPath, childType, hasChildren, isExpandedNode, isSelected, false);
        container.appendChild(node);
        
        if (hasChildren && isExpandedNode) {
          const childrenContainer = node.querySelector('.node-children');
          buildContentTree(childObj, childPath, childrenContainer);
        }
      });
    } else if (type === 'array') {
      obj.forEach((item, index) => {
        const childPath = [...path, `[${index}]`];
        const childType = getValueType(item);
        const isParent = childType === 'object' || childType === 'array';
        const hasChildren = isParent && (Object.keys(item).length > 0 || item.length > 0);
        const isExpandedNode = isExpanded(childPath);
        const isSelected = selectedPath.length > 0 && getPathString(childPath) === getPathString(selectedPath);
        
        const node = createContentNode(`[${index}]`, item, childPath, childType, hasChildren, isExpandedNode, isSelected, true);
        container.appendChild(node);
        
        if (hasChildren && isExpandedNode) {
          const childrenContainer = node.querySelector('.node-children');
          buildContentTree(item, childPath, childrenContainer);
        }
      });
    }
  }

  /**
   * 创建内容节点 - 使用DOM API构建，避免innerHTML的XSS和解析问题
   * @param {string} key - 键名或索引
   * @param {*} value - 节点值
   * @param {Array} childPath - 节点路径
   * @param {string} childType - 值类型
   * @param {boolean} hasChildren - 是否有子节点
   * @param {boolean} isExpandedNode - 是否已展开
   * @param {boolean} isSelected - 是否选中
   * @param {boolean} isArrayItem - 是否为数组项
   * @returns {HTMLElement} 节点元素
   */
  function createContentNode(key, value, childPath, childType, hasChildren, isExpandedNode, isSelected, isArrayItem) {
    const node = document.createElement('div');
    node.className = `json-content-node ${hasChildren ? 'has-children' : ''} ${isSelected ? 'active' : ''}`;
    
    // 创建头部行
    const header = document.createElement('div');
    header.className = 'node-header';
    
    // 展开/收起图标
    const expandIcon = document.createElement('span');
    expandIcon.className = 'expand-icon';
    if (hasChildren) {
      expandIcon.textContent = isExpandedNode ? '▼' : '▶';
      expandIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleExpand(childPath);
        renderContentTree(parsedJson);
      });
    }
    header.appendChild(expandIcon);
    
    // 键名
    const keySpan = document.createElement('span');
    keySpan.className = 'node-key';
    keySpan.textContent = isArrayItem ? key : `"${key}"`;
    header.appendChild(keySpan);
    
    // 冒号分隔符
    const colon = document.createElement('span');
    colon.style.color = 'var(--pixel-text-muted)';
    colon.textContent = ': ';
    header.appendChild(colon);
    
    // 值显示
    const valueSpan = document.createElement('span');
    valueSpan.className = `node-value json-${childType}`;
    valueSpan.textContent = getValueDisplay(value);
    header.appendChild(valueSpan);
    
    // 操作按钮区域
    const actions = document.createElement('span');
    actions.className = 'node-actions';
    
    // 复制按钮
    const copyBtn = document.createElement('button');
    copyBtn.className = 'node-action-btn';
    copyBtn.title = '复制';
    copyBtn.textContent = '📋';
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyNodeValue(value);
    });
    actions.appendChild(copyBtn);
    
    // 新增按钮（仅对象和数组可新增）
    if (childType === 'object' || childType === 'array') {
      const addBtn = document.createElement('button');
      addBtn.className = 'node-action-btn';
      addBtn.title = '新增';
      addBtn.textContent = '+';
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addNode(childPath, childType);
      });
      actions.appendChild(addBtn);
    }
    
    // 删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'node-action-btn delete';
    deleteBtn.title = '删除';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteNode(childPath);
    });
    actions.appendChild(deleteBtn);
    
    header.appendChild(actions);
    node.appendChild(header);
    
    // 子节点容器
    if (hasChildren) {
      const childrenDiv = document.createElement('div');
      childrenDiv.className = 'node-children';
      if (!isExpandedNode) {
        childrenDiv.style.display = 'none';
      }
      node.appendChild(childrenDiv);
    }
    
    return node;
  }

  /**
   * 复制节点值
   */
  async function copyNodeValue(value) {
    try {
      const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      await navigator.clipboard.writeText(text);
      App.showToast('已复制节点值', 'success');
    } catch (error) {
      App.showToast('复制失败', 'error');
    }
  }

  /**
   * 获取路径对应的对象
   */
  function getObjectByPath(path) {
    let obj = parsedJson;
    for (const part of path) {
      if (part.startsWith('[') && part.endsWith(']')) {
        const index = parseInt(part.slice(1, -1));
        obj = obj[index];
      } else {
        obj = obj[part];
      }
      if (obj === undefined) return null;
    }
    return obj;
  }

  /**
   * 获取父对象和键
   */
  function getParentAndKey(path) {
    if (path.length === 0) return { parent: null, key: null };
    
    const parentPath = path.slice(0, -1);
    const key = path[path.length - 1];
    const parent = getObjectByPath(parentPath);
    
    return { parent, key };
  }

  /**
   * 删除节点
   */
  function deleteNode(path) {
    const { parent, key } = getParentAndKey(path);
    if (!parent || key === null) {
      App.showToast('无法删除根节点', 'warning');
      return;
    }
    
    if (key.startsWith('[') && key.endsWith(']')) {
      const index = parseInt(key.slice(1, -1));
      parent.splice(index, 1);
    } else {
      delete parent[key];
    }
    
    if (selectedPath.length > 0 && getPathString(selectedPath).startsWith(getPathString(path))) {
      selectedPath = [];
    }
    
    renderContentTree(parsedJson);
    updateInputWithParsed();
    App.showToast('节点已删除', 'success');
  }

  /**
   * 新增节点
   */
  function addNode(path, type) {
    const { parent, key } = getParentAndKey(path);
    
    if (type === 'object') {
      const newKey = prompt('请输入新键名:', 'newKey');
      if (newKey !== null && newKey.trim()) {
        parent[key][newKey.trim()] = '';
        renderContentTree(parsedJson);
        updateInputWithParsed();
        App.showToast('节点已新增', 'success');
      }
    } else if (type === 'array') {
      const defaultValue = '';
      parent[key].push(defaultValue);
      renderContentTree(parsedJson);
      updateInputWithParsed();
      App.showToast('数组元素已新增', 'success');
    }
  }

  /**
   * 更新输入框内容
   */
  function updateInputWithParsed() {
    if (parsedJson) {
      document.getElementById('jsonInput').value = JSON.stringify(parsedJson, null, 2);
    }
  }

  /**
   * HTML转义
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 加载历史记录
   */
  async function loadHistory() {
    const history = await Storage.getJsonHistory();
    const container = document.getElementById('jsonHistory');
    
    if (history.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">暂无历史记录</div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = '';
    history.forEach(item => {
      const historyItem = createHistoryItem(item);
      container.appendChild(historyItem);
    });
  }

  /**
   * 创建历史记录项
   */
  function createHistoryItem(item) {
    const div = document.createElement('div');
    div.className = 'pixel-list-item';
    div.style.cursor = 'pointer';
    
    const displayName = item.name || (item.content.length > 40 ? item.content.substring(0, 40) + '...' : item.content);
    
    const typeLabel = item.type === 'compress' ? '压缩' : '格式化';
    const typeClass = item.type === 'compress' ? 'pixel-badge-warning' : 'pixel-badge-success';
    
    div.innerHTML = `
      <span class="pixel-badge ${typeClass}" style="margin-right: 8px;">${typeLabel}</span>
      <span style="flex: 1; font-size: 10px; word-break: break-all;">${escapeHtml(displayName)}</span>
      <button class="pixel-btn pixel-btn-sm" data-action="use" style="margin-left: 8px;">使用</button>
      <button class="pixel-btn pixel-btn-sm pixel-btn-danger" data-action="delete" style="margin-left: 4px;">×</button>
    `;
    
    div.querySelector('[data-action="use"]').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('jsonInput').value = item.content;
    });
    
    div.querySelector('[data-action="delete"]').addEventListener('click', async (e) => {
      e.stopPropagation();
      await Storage.removeJsonHistory(item.id);
      await loadHistory();
      App.showToast('已删除', 'success');
    });
    
    return div;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();