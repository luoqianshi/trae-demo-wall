/**
 * 打工人的工具箱 - TODO List
 * 支持项目维度和时间维度分类
 * 项目：可创建多个项目，每个 todo 归属一个项目（或未分类）
 * 时间：全部 / 今天 / 本周 / 已过期
 * 数据持久化到 IndexedDB
 */

(function() {
  'use strict';

  // 当前选中的筛选状态
  const state = {
    currentProject: 'all', // 'all' 全部, 'uncategorized' 未分类, 或具体 projectId
    currentTimeRange: 'all', // all / today / week / overdue
    projects: [] // 缓存项目列表
  };

  // 预设的项目颜色（像素风）
  const PROJECT_COLORS = [
    '#8b5cf6', // 紫
    '#06b6d4', // 青
    '#f59e0b', // 橙
    '#10b981', // 绿
    '#ef4444', // 红
    '#ec4899', // 粉
    '#3b82f6', // 蓝
    '#a855f7'  // 紫罗兰
  ];

  /**
   * 初始化
   */
  function init() {
    bindEvents();
    loadProjects();
    loadTodos();

    // 监听页面进入事件
    document.addEventListener('pageEnter', (e) => {
      if (e.detail.pageId === 'todoPage') {
        loadProjects();
        loadTodos();
      }
    });

    // 监听数据重置事件
    document.addEventListener('dataReset', () => {
      loadProjects();
      loadTodos();
    });
    document.addEventListener('dataImported', () => {
      loadProjects();
      loadTodos();
    });
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 添加 todo 按钮
    document.getElementById('addTodoBtn').addEventListener('click', addTodo);

    // 输入框回车添加
    document.getElementById('todoInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        addTodo();
      }
    });

    // 清除已完成按钮
    document.getElementById('clearCompletedBtn').addEventListener('click', clearCompleted);

    // 新建项目按钮
    document.getElementById('addProjectBtn').addEventListener('click', createProject);

    // 时间筛选切换
    document.querySelectorAll('.time-filter-item').forEach(item => {
      item.addEventListener('click', () => {
        const range = item.dataset.range;
        setTimeRange(range);
      });
    });
  }

  // ===================== 项目相关 =====================

  /**
   * 加载项目列表并渲染
   */
  async function loadProjects() {
    state.projects = await Storage.getProjects();
    renderProjectList();
    updateProjectSelect();
    updateProjectCounts();
  }

  /**
   * 渲染左侧项目列表
   */
  async function renderProjectList() {
    const container = document.getElementById('projectList');
    container.innerHTML = '';

    // "全部" 项
    const allItem = createProjectItem({
      id: 'all',
      name: '全部',
      color: 'var(--pixel-accent-blue)',
      isSystem: true
    });
    container.appendChild(allItem);

    // "未分类" 项
    const uncategorizedItem = createProjectItem({
      id: 'uncategorized',
      name: '未分类',
      color: '#888',
      isSystem: true
    });
    container.appendChild(uncategorizedItem);

    // 分隔线
    const divider = document.createElement('div');
    divider.style.cssText = 'height: 2px; background: var(--pixel-border); margin: 6px 0;';
    container.appendChild(divider);

    // 用户创建的项目
    state.projects.forEach(project => {
      const item = createProjectItem(project);
      container.appendChild(item);
    });
  }

  /**
   * 创建单个项目列表项
   */
  function createProjectItem(project) {
    const div = document.createElement('div');
    div.className = 'project-item' + (state.currentProject === project.id ? ' active' : '');
    div.dataset.id = project.id;

    div.innerHTML = `
      <span class="project-dot" style="background-color: ${project.color};"></span>
      <span class="project-name">${escapeHtml(project.name)}</span>
      <span class="project-count" data-count-for="${project.id}">0</span>
      ${project.isSystem ? '' : '<span class="project-delete" title="删除">✕</span>'}
    `;

    // 点击切换项目
    div.addEventListener('click', async (e) => {
      // 点击删除按钮不触发切换
      if (e.target.classList.contains('project-delete')) return;
      setCurrentProject(project.id);
    });

    // 删除项目
    if (!project.isSystem) {
      div.querySelector('.project-delete').addEventListener('click', async (e) => {
        e.stopPropagation();
        await deleteProject(project.id, project.name);
      });
    }

    return div;
  }

  /**
   * 更新每个项目的未完成数量
   */
  async function updateProjectCounts() {
    // 全部：统计所有未完成
    const allTodos = await Storage.getTodoList();
    const allPending = allTodos.filter(t => !t.completed).length;
    const allCountEl = document.querySelector('[data-count-for="all"]');
    if (allCountEl) allCountEl.textContent = allPending;

    // 未分类：projectId 为 null 的未完成
    const uncategorizedPending = allTodos.filter(t => !t.projectId && !t.completed).length;
    const uncCountEl = document.querySelector('[data-count-for="uncategorized"]');
    if (uncCountEl) uncCountEl.textContent = uncategorizedPending;

    // 每个项目
    for (const project of state.projects) {
      const count = allTodos.filter(t => t.projectId === project.id && !t.completed).length;
      const el = document.querySelector(`[data-count-for="${project.id}"]`);
      if (el) el.textContent = count;
    }
  }

  /**
   * 更新添加 todo 时的项目下拉选择框
   */
  function updateProjectSelect() {
    const select = document.getElementById('todoProjectSelect');
    if (!select) return;

    // 保留"未分类"选项
    select.innerHTML = '<option value="">未分类</option>';

    state.projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name;
      select.appendChild(option);
    });

    // 如果当前选中的是具体项目，下拉框默认选中它
    if (state.currentProject !== 'all' && state.currentProject !== 'uncategorized') {
      select.value = state.currentProject;
    }
  }

  /**
   * 切换当前选中的项目
   */
  function setCurrentProject(projectId) {
    state.currentProject = projectId;
    // 更新高亮
    document.querySelectorAll('.project-item').forEach(item => {
      item.classList.toggle('active', item.dataset.id === projectId);
    });
    // 更新下拉选择框
    const select = document.getElementById('todoProjectSelect');
    if (select) {
      if (projectId === 'all' || projectId === 'uncategorized') {
        select.value = '';
      } else {
        select.value = projectId;
      }
    }
    // 重新加载 todo
    loadTodos();
  }

  /**
   * 切换时间筛选范围
   */
  function setTimeRange(range) {
    state.currentTimeRange = range;
    // 更新高亮
    document.querySelectorAll('.time-filter-item').forEach(item => {
      item.classList.toggle('active', item.dataset.range === range);
    });
    // 重新加载
    loadTodos();
  }

  /**
   * 创建新项目（使用自定义输入 UI，避免原生 prompt）
   */
  function createProject() {
    // 检查是否已有输入框存在，避免重复
    if (document.getElementById('newProjectInputRow')) return;

    const container = document.getElementById('projectList');

    // 在列表底部插入一个输入行
    const inputRow = document.createElement('div');
    inputRow.id = 'newProjectInputRow';
    inputRow.className = 'project-item';
    inputRow.style.cssText = 'background-color: var(--pixel-bg-secondary); border-color: var(--pixel-border);';
    inputRow.innerHTML = `
      <input type="text" id="newProjectInput" class="pixel-input" style="flex:1; font-size:8px; padding: 4px 6px;" placeholder="输入项目名...">
      <span class="project-delete" id="cancelProjectBtn" title="取消" style="display:block;">✕</span>
    `;
    container.appendChild(inputRow);

    const inputEl = document.getElementById('newProjectInput');
    inputEl.focus();

    // 取消按钮
    document.getElementById('cancelProjectBtn').addEventListener('click', () => {
      inputRow.remove();
    });

    // 回车确认
    inputEl.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const name = inputEl.value.trim();
        if (!name) {
          inputRow.remove();
          return;
        }
        // 随机分配颜色
        const color = PROJECT_COLORS[state.projects.length % PROJECT_COLORS.length];
        await Storage.addProject({
          name: name,
          color: color
        });
        inputRow.remove();
        await loadProjects();
        App.showToast('项目创建成功', 'success');
      } else if (e.key === 'Escape') {
        inputRow.remove();
      }
    });
  }

  /**
   * 删除项目
   */
  async function deleteProject(projectId, projectName) {
    if (!confirm(`确定要删除项目「${projectName}」吗？\n该项目下的待办事项将变为未分类。`)) {
      return;
    }

    await Storage.deleteProject(projectId);

    // 如果当前选中的就是被删除的项目，切回"全部"
    if (state.currentProject === projectId) {
      state.currentProject = 'all';
    }

    await loadProjects();
    await loadTodos();
    await App.updateTodoBadge();
    App.showToast('项目已删除', 'success');
  }

  // ===================== TODO 相关 =====================

  /**
   * 添加TODO
   */
  async function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();

    if (!text) {
      App.showToast('请输入待办内容', 'warning');
      return;
    }

    // 获取选择的项目
    const projectSelect = document.getElementById('todoProjectSelect');
    let projectId = projectSelect.value || null;
    // 如果当前在"未分类"下，保持为 null；在"全部"下也保持为 null
    // 如果当前在具体项目下，用下拉框的值

    // 获取截止日期
    const dueInput = document.getElementById('todoDueInput');
    const dueDate = dueInput.value || null;

    await Storage.addTodo(text, {
      projectId: projectId,
      dueDate: dueDate
    });

    input.value = '';
    dueInput.value = '';
    await loadTodos();
    await loadProjects(); // 更新计数
    await App.updateTodoBadge();
  }

  /**
   * 加载TODO列表（根据当前筛选状态）
   */
  async function loadTodos() {
    const filters = {};

    // 项目筛选
    if (state.currentProject === 'uncategorized') {
      filters.projectId = null;
    } else if (state.currentProject !== 'all') {
      filters.projectId = state.currentProject;
    }

    // 时间筛选
    if (state.currentTimeRange !== 'all') {
      filters.timeRange = state.currentTimeRange;
    }

    const todos = await Storage.getTodoList(filters);
    const container = document.getElementById('todoList');
    const emptyState = document.getElementById('todoEmpty');

    // 更新统计
    updateStats(todos);

    if (todos.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    container.innerHTML = '';

    todos.forEach(todo => {
      const todoEl = createTodoItem(todo);
      container.appendChild(todoEl);
    });
  }

  /**
   * 创建TODO项
   */
  function createTodoItem(todo) {
    const div = document.createElement('div');
    div.className = 'todo-item' + (todo.completed ? ' completed' : '');
    div.dataset.id = todo.id;

    // 查找所属项目信息
    const project = state.projects.find(p => p.id === todo.projectId);

    // 计算截止日期的显示样式
    const todayStr = formatDate(new Date());
    let dueDateClass = '';
    let dueDateText = '';
    if (todo.dueDate) {
      if (!todo.completed && todo.dueDate < todayStr) {
        dueDateClass = 'overdue';
        dueDateText = `📅 已过期 ${todo.dueDate}`;
      } else if (todo.dueDate === todayStr) {
        dueDateClass = 'today';
        dueDateText = `📅 今天`;
      } else {
        dueDateText = `📅 ${todo.dueDate}`;
      }
    }

    div.innerHTML = `
      <div class="todo-checkbox ${todo.completed ? 'checked' : ''}"></div>
      <div class="todo-content">
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <div class="todo-meta">
          ${project ? `<span class="todo-project-tag"><span class="tag-dot" style="background-color: ${project.color};"></span>${escapeHtml(project.name)}</span>` : ''}
          ${todo.dueDate ? `<span class="todo-due-date ${dueDateClass}">${dueDateText}</span>` : ''}
        </div>
      </div>
      <span class="todo-delete" title="删除">✕</span>
    `;

    // 切换完成状态
    div.querySelector('.todo-checkbox').addEventListener('click', async () => {
      await Storage.toggleTodo(todo.id);
      await loadTodos();
      await updateProjectCounts();
      await App.updateTodoBadge();
    });

    // 点击文字也可以切换
    div.querySelector('.todo-text').addEventListener('click', async () => {
      await Storage.toggleTodo(todo.id);
      await loadTodos();
      await updateProjectCounts();
      await App.updateTodoBadge();
    });

    // 删除
    div.querySelector('.todo-delete').addEventListener('click', async (e) => {
      e.stopPropagation();
      await Storage.removeTodo(todo.id);
      await loadTodos();
      await updateProjectCounts();
      await App.updateTodoBadge();
    });

    return div;
  }

  /**
   * 更新统计信息
   */
  function updateStats(todos) {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;

    document.getElementById('todoTotal').textContent = total;
    document.getElementById('todoCompleted').textContent = completed;
    document.getElementById('todoPending').textContent = pending;
  }

  /**
   * 清除已完成的TODO
   * 注意：只清除当前筛选范围内的已完成项
   */
  async function clearCompleted() {
    const todos = await Storage.getTodoList({
      projectId: state.currentProject === 'all' ? undefined : (state.currentProject === 'uncategorized' ? null : state.currentProject),
      timeRange: state.currentTimeRange
    });
    const completedCount = todos.filter(t => t.completed).length;

    if (completedCount === 0) {
      App.showToast('没有已完成的事项', 'warning');
      return;
    }

    if (!confirm(`确定要清除 ${completedCount} 个已完成的事项吗？`)) {
      return;
    }

    // 逐条删除已完成项（在当前筛选范围内的）
    for (const todo of todos) {
      if (todo.completed) {
        await Storage.removeTodo(todo.id);
      }
    }

    await loadTodos();
    await updateProjectCounts();
    await App.updateTodoBadge();
    App.showToast(`已清除 ${completedCount} 个已完成事项`, 'success');
  }

  // ===================== 工具函数 =====================

  /**
   * 格式化日期为 YYYY-MM-DD
   */
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * HTML转义
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
