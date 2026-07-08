/**
 * 待办任务管理模块
 * 看板视图三列（待处理/进行中/已完成）
 * 任务卡片来自 AppData.tasks
 * 支持卡片拖拽切换状态（视觉模拟）
 */
const TasksModule = {
  _container: null,
  _tasks: [],
  _columns: [
    { key: 'todo', label: '待处理', color: 'bg-gray-100', headerColor: 'bg-gray-200 text-gray-700', borderColor: 'border-gray-300' },
    { key: 'doing', label: '进行中', color: 'bg-blue-50', headerColor: 'bg-blue-100 text-blue-700', borderColor: 'border-blue-300' },
    { key: 'done', label: '已完成', color: 'bg-green-50', headerColor: 'bg-green-100 text-green-700', borderColor: 'border-green-300' }
  ],

  init() {
    this._tasks = (window.AppData && window.AppData.tasks) || this._getDefaultTasks();
  },

  render(container) {
    this._container = container;
    this.init();

    const html = `
      <div class="flex flex-col h-full bg-gray-50">
        <!-- 顶部工具栏 -->
        <div class="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-base font-semibold text-gray-800 flex items-center gap-2">
            <i data-lucide="layout-kanban" class="w-5 h-5 text-blue-500"></i>
            任务看板
          </h3>
          <button id="tasks-add-btn" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <i data-lucide="plus" class="w-4 h-4"></i>
            新建任务
          </button>
        </div>

        <!-- 看板三列 -->
        <div class="flex-1 overflow-x-auto p-6">
          <div class="flex gap-6 min-w-[900px] h-full">
            ${this._columns.map(col => `
              <div class="flex-1 flex flex-col min-w-[280px] rounded-xl border ${col.borderColor} overflow-hidden">
                <div class="px-4 py-3 ${col.headerColor} font-semibold text-sm flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    ${col.label}
                    <span class="text-xs px-2 py-0.5 rounded-full bg-white/60" data-count="${col.key}">${this._tasks.filter(t => t.status === col.key).length}</span>
                  </span>
                  <i data-lucide="${col.key === 'todo' ? 'circle' : col.key === 'doing' ? 'loader' : 'check-circle'}" class="w-4 h-4"></i>
                </div>
                <div class="flex-1 ${col.color} p-3 space-y-3 overflow-y-auto tasks-column" data-status="${col.key}">
                  ${this._renderColumnCards(col.key)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this._bindEvents();
    if (window.lucide) lucide.createIcons();
  },

  _renderColumnCards(status) {
    const tasks = this._tasks.filter(t => t.status === status);
    if (tasks.length === 0) {
      return `
        <div class="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          <i data-lucide="inbox" class="w-6 h-6 mx-auto mb-1 opacity-50"></i>
          <p class="text-xs">暂无任务</p>
        </div>
      `;
    }
    return tasks.map(task => `
      <div class="task-card bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all cursor-move group" draggable="true" data-id="${task.id}">
        <div class="flex items-start justify-between mb-2">
          <h4 class="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">${task.title}</h4>
          <button class="task-menu-btn text-gray-300 hover:text-gray-500 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" data-id="${task.id}">
            <i data-lucide="more-horizontal" class="w-4 h-4"></i>
          </button>
        </div>
        ${task.description ? `<p class="text-xs text-gray-500 mb-3 line-clamp-2">${task.description}</p>` : ''}
        <div class="flex items-center gap-2 mb-3 flex-wrap">
          ${(task.tags || []).map(tag => `<span class="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">${tag}</span>`).join('')}
        </div>
        <div class="flex items-center justify-between text-xs text-gray-500">
          <span class="flex items-center gap-1.5">
            <div class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style="background:${task.assigneeColor || '#94a3b8'}">
              ${(task.assignee || '?').charAt(0)}
            </div>
            ${task.assignee || '未分配'}
          </span>
          <span class="flex items-center gap-1 ${this._isOverdue(task.dueDate) ? 'text-red-500' : ''}">
            <i data-lucide="calendar" class="w-3 h-3"></i>
            ${task.dueDate || '无截止日期'}
          </span>
        </div>
        ${task.source ? `
          <div class="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1 text-[10px] text-gray-400">
            <i data-lucide="link" class="w-3 h-3"></i>
            来源: ${task.source}
          </div>
        ` : ''}
      </div>
    `).join('');
  },

  _bindEvents() {
    const container = this._container;
    let draggedId = null;

    container.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        draggedId = card.dataset.id;
        card.classList.add('opacity-50', 'rotate-2');
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('opacity-50', 'rotate-2');
        draggedId = null;
      });
    });

    container.querySelectorAll('.tasks-column').forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('ring-2', 'ring-blue-300', 'ring-inset');
      });
      col.addEventListener('dragleave', () => {
        col.classList.remove('ring-2', 'ring-blue-300', 'ring-inset');
      });
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('ring-2', 'ring-blue-300', 'ring-inset');
        const newStatus = col.dataset.status;
        if (draggedId && newStatus) {
          this._moveTask(draggedId, newStatus);
        }
      });
    });

    container.querySelectorAll('.task-menu-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this._showTaskActions(id, btn);
      });
    });

    container.querySelector('#tasks-add-btn').addEventListener('click', () => {
      App.showToast('新建任务功能开发中', 'info');
    });
  },

  _moveTask(id, newStatus) {
    const task = this._tasks.find(t => t.id === id);
    if (!task || task.status === newStatus) return;
    const oldStatus = task.status;
    task.status = newStatus;
    this._refresh();
    const colLabel = this._columns.find(c => c.key === newStatus)?.label || newStatus;
    App.showToast(`任务已移至「${colLabel}」`, 'success');
  },

  _showTaskActions(id, btn) {
    const existing = document.querySelector('.task-actions-popup');
    if (existing) existing.remove();

    const task = this._tasks.find(t => t.id === id);
    if (!task) return;

    const popup = document.createElement('div');
    popup.className = 'task-actions-popup fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-2 min-w-[140px]';
    const rect = btn.getBoundingClientRect();
    popup.style.left = rect.left + 'px';
    popup.style.top = (rect.bottom + 4) + 'px';

    const otherStatuses = this._columns.filter(c => c.key !== task.status);
    popup.innerHTML = `
      <div class="text-xs text-gray-400 px-2 py-1 mb-1">移动到</div>
      ${otherStatuses.map(c => `
        <button class="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors task-move-btn" data-id="${id}" data-status="${c.key}">
          <i data-lucide="arrow-right-circle" class="w-4 h-4 text-gray-400"></i>
          ${c.label}
        </button>
      `).join('')}
      <div class="border-t border-gray-100 my-1"></div>
      <button class="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-red-50 text-red-500 flex items-center gap-2 transition-colors task-delete-btn" data-id="${id}">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
        删除
      </button>
    `;

    document.body.appendChild(popup);
    if (window.lucide) lucide.createIcons();

    const closeHandler = (e) => {
      if (!popup.contains(e.target)) {
        popup.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);

    popup.querySelectorAll('.task-move-btn').forEach(b => {
      b.addEventListener('click', () => {
        this._moveTask(b.dataset.id, b.dataset.status);
        popup.remove();
      });
    });

    popup.querySelector('.task-delete-btn').addEventListener('click', () => {
      const idx = this._tasks.findIndex(t => t.id === id);
      if (idx >= 0) {
        this._tasks.splice(idx, 1);
        this._refresh();
        App.showToast('任务已删除', 'info');
      }
      popup.remove();
    });
  },

  _refresh() {
    const container = this._container;
    this._columns.forEach(col => {
      const columnEl = container.querySelector(`.tasks-column[data-status="${col.key}"]`);
      if (columnEl) columnEl.innerHTML = this._renderColumnCards(col.key);
      const countEl = container.querySelector(`[data-count="${col.key}"]`);
      if (countEl) countEl.textContent = this._tasks.filter(t => t.status === col.key).length;
    });
    this._bindEvents();
    if (window.lucide) lucide.createIcons();
  },

  _isOverdue(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  },

  _getDefaultTasks() {
    return [
      { id: 't1', title: '完成技术方案文档', description: '输出详细的技术实现方案，包含接口定义', status: 'todo', assignee: '李工程师', assigneeColor: '#10b981', dueDate: '2026-07-10', tags: ['文档', '高优先级'], source: '会议#20260701' },
      { id: 't2', title: 'UI设计稿评审', description: '确认首页和详情页的视觉设计', status: 'todo', assignee: '王设计师', assigneeColor: '#f59e0b', dueDate: '2026-07-09', tags: ['设计'], source: '会议#20260701' },
      { id: 't3', title: '搭建项目脚手架', description: '初始化前端工程，配置Tailwind和路由', status: 'doing', assignee: '李工程师', assigneeColor: '#10b981', dueDate: '2026-07-08', tags: ['开发'], source: '会议#20260628' },
      { id: 't4', title: '需求评审会议', description: '与产品确认MVP功能范围', status: 'doing', assignee: '张经理', assigneeColor: '#3b82f6', dueDate: '2026-07-08', tags: ['会议'], source: '会议#20260628' },
      { id: 't5', title: '竞品分析报告', description: '调研3款同类产品的核心功能', status: 'done', assignee: '刘产品', assigneeColor: '#8b5cf6', dueDate: '2026-07-05', tags: ['调研'], source: '会议#20260625' },
      { id: 't6', title: '环境部署', description: '测试服务器和CI/CD流水线搭建', status: 'done', assignee: '赵运维', assigneeColor: '#ef4444', dueDate: '2026-07-03', tags: ['运维'], source: '会议#20260625' }
    ];
  }
};

window.TasksModule = TasksModule;
