/**
 * 任务管理 Tasks
 */

let currentFilter = 'all';
let editingTaskId = null;
let modalCategory = 'math';
let modalPriority = 'high';

function renderSubjectGrid() {
  const container = document.getElementById('subject-grid');
  container.innerHTML = Object.entries(CATEGORIES).map(([key, cat]) => `
    <button onclick="setTaskCategory('${key}')" class="subject-btn ${key === modalCategory ? 'active' : ''}" data-cat="${key}">
      <span class="subj-icon">${cat.icon}</span>
      <span>${cat.name}</span>
    </button>
  `).join('');
}

function renderTemplates() {
  const container = document.getElementById('template-list');
  if (!container) return;
  container.innerHTML = HOMEWORK_TEMPLATES.map((tpl, i) => `
    <div class="template-chip" onclick="useTemplate(${i})">
      ${CATEGORIES[tpl.category].icon} ${tpl.title}
    </div>
  `).join('');
}

function useTemplate(index) {
  const tpl = HOMEWORK_TEMPLATES[index];
  editingTaskId = null;
  document.getElementById('task-title').value = tpl.title;
  document.getElementById('task-date').value = getToday();
  setTaskCategory(tpl.category);
  setTaskPriority(tpl.priority);
  document.getElementById('modal-title').textContent = '添加任务';
  document.getElementById('save-task-btn').textContent = '保存任务';
  document.getElementById('task-modal').classList.add('show');
}

function renderTasks() {
  let tasks = getTasks();
  if (currentFilter === 'active') tasks = tasks.filter(t => !t.completed);
  if (currentFilter === 'completed') tasks = tasks.filter(t => t.completed);

  // 排序：未完成在前，高优先级在前
  tasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const pMap = { high: 0, medium: 1, low: 2 };
    return pMap[a.priority] - pMap[b.priority];
  });

  const container = document.getElementById('task-list');
  if (tasks.length === 0) {
    container.innerHTML = '<div class="text-center text-gray-400 py-8">暂无任务</div>';
    return;
  }

  container.innerHTML = tasks.map(t => `
    <div class="glass-card p-3 mb-3 ${t.completed ? 'task-complete' : ''}">
      <div class="flex items-center">
        <div class="checkbox ${t.completed ? 'checked' : ''} mr-3 flex-shrink-0" onclick="event.stopPropagation();doToggleTask('${t.id}')"></div>
        <div class="flex-1 min-w-0">
          <div class="task-title text-sm font-medium ${t.completed ? 'line-through text-gray-400' : 'text-gray-800'}">${t.title}</div>
          <div class="flex items-center gap-2 mt-1 flex-wrap">
            <span class="text-xs px-2 py-0.5 rounded-full ${CATEGORIES[t.category].class}">${CATEGORIES[t.category].icon} ${CATEGORIES[t.category].name}</span>
            <span class="text-xs px-2 py-0.5 rounded-full ${PRIORITIES[t.priority].class}">${PRIORITIES[t.priority].name}</span>
            <span class="text-xs text-gray-400">${t.dueDate}</span>
          </div>
        </div>
        <button onclick="event.stopPropagation();editTask('${t.id}')" class="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-sm ml-2 flex-shrink-0">✏️</button>
        <button onclick="event.stopPropagation();doDeleteTask('${t.id}')" class="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-sm ml-2 flex-shrink-0">🗑</button>
      </div>
    </div>
  `).join('');
}

function doToggleTask(id) {
  toggleTask(id);
  renderTasks();
  renderDashboard();
  renderSchedule();
  renderReview();
}

function doDeleteTask(id) {
  showConfirmDialog(
    '确认删除？',
    '删除后无法恢复，确定要删除这个任务吗？',
    () => {
      deleteTask(id);
      renderTasks();
      renderDashboard();
      renderSchedule();
      renderReview();
      showToast('任务已删除');
    }
  );
}

function setTaskFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('bg-white', 'text-blue-500', 'shadow');
    btn.classList.add('glass', 'text-white');
  });
  const activeBtn = document.getElementById('filter-' + filter);
  activeBtn.classList.remove('glass', 'text-white');
  activeBtn.classList.add('bg-white', 'text-blue-500', 'shadow');
  renderTasks();
}

function openTaskModal() {
  editingTaskId = null;
  document.getElementById('task-title').value = '';
  document.getElementById('task-date').value = getToday();
  setTaskCategory('math');
  setTaskPriority('high');
  document.getElementById('modal-title').textContent = '添加任务';
  document.getElementById('save-task-btn').textContent = '保存任务';
  document.getElementById('task-modal').classList.add('show');
}

function editTask(id) {
  const task = getTasks().find(t => t.id === id);
  if (!task) return;

  editingTaskId = id;
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-date').value = task.dueDate;
  setTaskCategory(task.category);
  setTaskPriority(task.priority);
  document.getElementById('modal-title').textContent = '编辑任务';
  document.getElementById('save-task-btn').textContent = '更新任务';
  document.getElementById('task-modal').classList.add('show');
}

function closeTaskModal() {
  document.getElementById('task-modal').classList.remove('show');
}

function setTaskCategory(cat) {
  modalCategory = cat;
  document.querySelectorAll('.subject-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });
}

function setTaskPriority(pri) {
  modalPriority = pri;
  document.querySelectorAll('.pri-btn').forEach(btn => {
    const isActive = btn.dataset.pri === pri;
    if (isActive) {
      if (pri === 'high') btn.className = 'pri-btn flex-1 py-2 rounded-xl text-sm bg-red-100 text-red-600';
      if (pri === 'medium') btn.className = 'pri-btn flex-1 py-2 rounded-xl text-sm bg-yellow-100 text-yellow-700';
      if (pri === 'low') btn.className = 'pri-btn flex-1 py-2 rounded-xl text-sm bg-green-100 text-green-600';
    } else {
      btn.className = 'pri-btn flex-1 py-2 rounded-xl text-sm bg-gray-100 text-gray-400';
    }
  });
}

function saveTask() {
  const title = document.getElementById('task-title').value.trim();
  const date = document.getElementById('task-date').value;
  if (!title) {
    showToast('请输入任务名称');
    return;
  }
  if (!date) {
    showToast('请选择截止日期');
    return;
  }

  if (editingTaskId) {
    updateTask(editingTaskId, {
      title,
      category: modalCategory,
      priority: modalPriority,
      dueDate: date
    });
    showToast('任务更新成功');
  } else {
    addTask({
      title,
      category: modalCategory,
      priority: modalPriority,
      dueDate: date,
      completed: false
    });
    showToast('任务添加成功');
  }

  closeTaskModal();
  renderTasks();
  renderDashboard();
  renderSchedule();
  renderReview();
}
