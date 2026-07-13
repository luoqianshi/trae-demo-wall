/**
 * 打工人的工具箱 - 侧边栏主逻辑
 * 负责页面导航、工具列表渲染、全局事件处理
 */

(function() {
  'use strict';

  // 工具配置
  const TOOLS = [
    {
      id: 'qrcode',
      name: '二维码生成',
      icon: '📱',
      pageId: 'qrcodePage',
      color: 'green'
    },
    {
      id: 'json-formatter',
      name: 'JSON格式化',
      icon: '📋',
      pageId: 'json-formatterPage',
      color: 'blue'
    },
    {
      id: 'screenshot',
      name: '网页截屏',
      icon: '📸',
      pageId: 'screenshotPage',
      color: 'pink'
    },
    {
      id: 'todo',
      name: 'TODO List',
      icon: '📝',
      pageId: 'todoPage',
      color: 'yellow'
    },
    {
      id: 'pomodoro',
      name: '番茄钟',
      icon: '🍅',
      pageId: 'pomodoroPage',
      color: 'orange'
    },
    {
      id: 'tab-manager',
      name: '标签页管理',
      icon: '📑',
      pageId: 'tab-managerPage',
      color: 'purple'
    },
    {
      id: 'file-info',
      name: '文件信息',
      icon: '📁',
      pageId: 'file-infoPage',
      color: 'green'
    },
    {
      id: 'color-picker',
      name: '取色器',
      icon: '🎨',
      pageId: 'color-pickerPage',
      color: 'pink'
    },
    {
      id: 'downloader',
      name: '下载器',
      icon: '⬇️',
      pageId: 'downloaderPage',
      color: 'blue'
    }
  ];

  // 当前页面
  let currentPage = 'homePage';
  
  // 拖拽相关状态
  let draggedItem = null;
  let dragStartIndex = null;
  let longPressTimer = null;
  let isDragging = false;

  /**
   * 初始化
   */
  async function init() {
    await renderToolGrid();
    await updateTodoBadge();
    bindEvents();
    initPomodoroHeader();
  }

  /**
   * 渲染工具网格
   */
  async function renderToolGrid() {
    const settings = await Storage.getSettings();
    const toolGrid = document.getElementById('toolGrid');
    toolGrid.innerHTML = '';

    // 按照设置的顺序排列工具
    const orderedTools = [];
    const toolMap = {};
    TOOLS.forEach(tool => {
      toolMap[tool.id] = tool;
    });

    // 按设置的顺序添加
    settings.toolOrder.forEach(toolId => {
      if (toolMap[toolId] && !settings.hiddenTools.includes(toolId)) {
        orderedTools.push(toolMap[toolId]);
      }
    });

    // 添加未在顺序中的工具
    TOOLS.forEach(tool => {
      if (!orderedTools.includes(tool) && !settings.hiddenTools.includes(tool.id)) {
        orderedTools.push(tool);
      }
    });

    // 渲染工具卡片
    orderedTools.forEach((tool, index) => {
      const card = createToolCard(tool, index);
      toolGrid.appendChild(card);
    });
  }

  /**
   * 创建工具卡片
   */
  function createToolCard(tool, index) {
    const card = document.createElement('div');
    card.className = 'tool-card';
    card.dataset.toolId = tool.id;
    card.dataset.index = index;
    card.draggable = false;

    card.innerHTML = `
      <div class="tool-icon">${tool.icon}</div>
      <div class="tool-name">${tool.name}</div>
      ${tool.id === 'todo' ? '<div class="tool-badge" id="todoBadge" style="display: none;"></div>' : ''}
    `;

    // 点击跳转
    card.addEventListener('click', () => {
      if (!isDragging) {
        navigateTo(tool.pageId);
      }
    });

    // 长按拖拽排序
    card.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // 左键
        longPressTimer = setTimeout(() => {
          isDragging = true;
          card.draggable = true;
          card.classList.add('dragging');
          draggedItem = card;
          dragStartIndex = index;
          
          // 触发拖拽
          const dragEvent = new DragEvent('dragstart', {
            bubbles: true,
            cancelable: true,
            dataTransfer: new DataTransfer()
          });
          card.dispatchEvent(dragEvent);
        }, 500); // 500ms长按
      }
    });

    card.addEventListener('mouseup', () => {
      clearTimeout(longPressTimer);
      if (isDragging) {
        card.draggable = false;
        card.classList.remove('dragging');
        isDragging = false;
      }
    });

    card.addEventListener('mouseleave', () => {
      clearTimeout(longPressTimer);
    });

    // 拖拽事件
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);
    card.addEventListener('dragenter', handleDragEnter);
    card.addEventListener('dragleave', handleDragLeave);

    return card;
  }

  /**
   * 拖拽开始
   */
  function handleDragStart(e) {
    draggedItem = this;
    dragStartIndex = parseInt(this.dataset.index);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  /**
   * 拖拽结束
   */
  function handleDragEnd(e) {
    this.classList.remove('dragging');
    this.draggable = false;
    isDragging = false;
    
    // 移除所有拖拽样式
    document.querySelectorAll('.tool-card').forEach(card => {
      card.classList.remove('drag-over');
    });
    
    // 保存新顺序
    saveToolOrder();
  }

  /**
   * 拖拽经过
   */
  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  /**
   * 拖拽进入
   */
  function handleDragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
  }

  /**
   * 拖拽离开
   */
  function handleDragLeave(e) {
    this.classList.remove('drag-over');
  }

  /**
   * 放置
   */
  function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (draggedItem !== this) {
      const toolGrid = document.getElementById('toolGrid');
      const allCards = [...toolGrid.children];
      const draggedIndex = allCards.indexOf(draggedItem);
      const dropIndex = allCards.indexOf(this);
      
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
    const toolGrid = document.getElementById('toolGrid');
    const cards = toolGrid.querySelectorAll('.tool-card');
    const newOrder = [];
    
    cards.forEach(card => {
      newOrder.push(card.dataset.toolId);
    });
    
    const settings = await Storage.getSettings();
    settings.toolOrder = newOrder;
    await Storage.saveSettings(settings);
  }

  /**
   * 页面导航
   */
  function navigateTo(pageId) {
    // 隐藏当前页面
    document.getElementById(currentPage).classList.remove('active');
    
    // 显示新页面
    document.getElementById(pageId).classList.add('active');
    
    currentPage = pageId;
    
    // 滚动到顶部
    document.querySelector('.main-content').scrollTop = 0;
    
    // 触发页面进入事件
    triggerPageEnter(pageId);
  }

  /**
   * 触发页面进入事件
   */
  function triggerPageEnter(pageId) {
    const event = new CustomEvent('pageEnter', { detail: { pageId } });
    document.dispatchEvent(event);
  }

  /**
   * 初始化首页番茄钟倒计时显示
   */
  function initPomodoroHeader() {
    // 等待 Pomodoro 模块加载完成
    const checkPomodoro = setInterval(() => {
      if (window.Pomodoro) {
        clearInterval(checkPomodoro);
        
        // 获取初始状态并更新显示
        const state = window.Pomodoro.getCurrentState();
        updatePomodoroHeader(state);
        
        // 添加状态变化监听器
        window.Pomodoro.addStateChangeListener(updatePomodoroHeader);
      }
    }, 100);
  }
  
  /**
   * 更新首页番茄钟倒计时显示
   */
  function updatePomodoroHeader(state) {
    const headerPomodoro = document.getElementById('headerPomodoro');
    const headerPomodoroTime = document.getElementById('headerPomodoroTime');
    const headerPomodoroIcon = document.getElementById('headerPomodoroIcon');
    
    if (!headerPomodoro || !headerPomodoroTime || !headerPomodoroIcon) {
      return;
    }
    
    // 只有当计时器运行时才显示
    if (state.isRunning) {
      headerPomodoro.style.display = 'flex';
      headerPomodoroTime.textContent = state.timeStr;
      headerPomodoroIcon.textContent = state.isWorkMode ? '🍅' : '☕';
      headerPomodoroTime.style.color = state.isWorkMode 
        ? 'var(--pixel-accent-green)' 
        : 'var(--pixel-accent-blue)';
    } else {
      headerPomodoro.style.display = 'none';
    }
  }
  
  /**
   * 更新TODO角标数量
   */
  async function updateTodoBadge() {
    const todos = await Storage.getTodoList();
    const pendingCount = todos.filter(t => !t.completed).length;
    const badge = document.getElementById('todoBadge');
    
    if (badge) {
      if (pendingCount > 0) {
        badge.textContent = pendingCount > 99 ? '99+' : pendingCount;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 设置按钮
    document.getElementById('settingsBtn').addEventListener('click', () => {
      navigateTo('settingsPage');
    });

    // 返回按钮
    document.querySelectorAll('.back-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetPage = btn.dataset.page;
        navigateTo(targetPage);
      });
    });
  }

  /**
   * 显示Toast提示
   */
  function showToast(message, type = 'success', duration = 2000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `pixel-toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideDown 0.3s ease reverse';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }

  /**
   * 格式化文件大小
   */
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 格式化日期
   */
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    // 1分钟内
    if (diff < 60000) {
      return '刚刚';
    }
    // 1小时内
    if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前';
    }
    // 1天内
    if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前';
    }
    // 7天内
    if (diff < 604800000) {
      return Math.floor(diff / 86400000) + '天前';
    }
    
    return date.toLocaleDateString('zh-CN');
  }

  // 导出到全局
  window.App = {
    TOOLS,
    navigateTo,
    showToast,
    formatFileSize,
    formatDate,
    renderToolGrid,
    updateTodoBadge
  };

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
