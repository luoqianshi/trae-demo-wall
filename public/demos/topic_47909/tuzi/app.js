const STORAGE_KEYS = {
  TASKS: 'bunny_tasks',
  RECORDS: 'bunny_records',
  STATS: 'bunny_stats'
};

const ENCOURAGE_MESSAGES = [
  '今天也完成啦！',
  '小兔子为你鼓掌！',
  '又坚持了一天！',
  '继续保持这个节奏！',
  '你真的超棒的！',
  '好厉害，继续加油！',
  '兔兔为你点赞～',
  '每一天都在进步！'
];

const PRESET_PACKS = {
  study: [
    { name: '背单词 20 个', category: '学习' },
    { name: '阅读 30 分钟', category: '学习' },
    { name: '听英语听力 15 分钟', category: '学习' },
    { name: '复习当天功课', category: '学习' }
  ],
  fitness: [
    { name: '跑步 3 公里', category: '运动' },
    { name: '俯卧撑 30 个', category: '运动' },
    { name: '仰卧起坐 50 个', category: '运动' },
    { name: '拉伸 15 分钟', category: '运动' }
  ],
  life: [
    { name: '早起 7 点前起床', category: '生活' },
    { name: '喝 8 杯水', category: '生活' },
    { name: '整理房间', category: '生活' },
    { name: '阅读 20 分钟', category: '生活' }
  ],
  health: [
    { name: '吃早餐', category: '健康' },
    { name: '运动 30 分钟', category: '健康' },
    { name: '11 点前睡觉', category: '健康' },
    { name: '冥想 10 分钟', category: '健康' }
  ]
};

let state = {
  tasks: [],
  records: [],
  stats: {
    totalCheckIns: 0,
    currentStreak: 0,
    longestStreak: 0
  },
  badges: [],
  skin: 'default',
  soundEnabled: true
};

let taskToDelete = null;
let taskToEdit = null;
let selectedTaskFilter = 'all';
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();
let batchMode = false;
let selectedTaskIds = new Set();

function shouldShowTaskToday(task) {
  return shouldShowTaskOnDate(task, getTodayString());
}

function shouldShowTaskOnDate(task, dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay();
  
  if (task.repeatType === 'daily') {
    return true;
  }
  
  if (task.repeatType === 'weekly') {
    return task.weekDays && task.weekDays.includes(dayOfWeek);
  }
  
  if (task.repeatType === 'period') {
    return dateStr >= task.startDate && dateStr <= task.endDate;
  }
  
  return false;
}

function init() {
  loadData();
  renderDate();
  renderTasks();
  renderStats();
  renderWeekCalendar();
  renderProgress();
  renderRecordsPage();
  renderBadges();
  applySkin();
  updateSoundToggle();
  bindEvents();
}

function loadData() {
  try {
    const tasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    const records = localStorage.getItem(STORAGE_KEYS.RECORDS);
    const stats = localStorage.getItem(STORAGE_KEYS.STATS);
    const badges = localStorage.getItem('bunny_badges');
    const skin = localStorage.getItem('bunny_skin');
    const soundEnabled = localStorage.getItem('bunny_sound');

    if (tasks) {
      state.tasks = JSON.parse(tasks);
      // 数据迁移：为旧数据添加缺失字段
      state.tasks.forEach(task => {
        if (task.repeatType === undefined) task.repeatType = 'daily';
        if (task.weekDays === undefined) task.weekDays = [];
        if (task.startDate === undefined) task.startDate = '';
        if (task.endDate === undefined) task.endDate = '';
      });
    }
    if (records) state.records = JSON.parse(records);
    if (stats) state.stats = JSON.parse(stats);
    if (badges) state.badges = JSON.parse(badges);
    if (skin) state.skin = skin;
    if (soundEnabled !== null) state.soundEnabled = soundEnabled === 'true';
  } catch (e) {
    console.error('加载数据失败:', e);
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(state.records));
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(state.stats));
    localStorage.setItem('bunny_badges', JSON.stringify(state.badges));
    localStorage.setItem('bunny_skin', state.skin);
    localStorage.setItem('bunny_sound', state.soundEnabled);
  } catch (e) {
    console.error('保存数据失败:', e);
  }
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayDateTimeString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function renderDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekDay = weekDays[now.getDay()];

  document.getElementById('todayDate').textContent = `${year}年${month}月${day}日`;
  document.getElementById('dateWeek').textContent = weekDay;
}

function isTaskCheckedToday(taskId) {
  const today = getTodayString();
  return state.records.some(r => r.taskId === taskId && r.date === today);
}

function getCategoryClass(category) {
  const map = {
    '学习': 'cat-study',
    '运动': 'cat-sport',
    '生活': 'cat-life',
    '健康': 'cat-health',
    '自定义': 'cat-custom'
  };
  return map[category] || 'cat-custom';
}

function renderTasks() {
  const taskList = document.getElementById('taskList');
  const emptyState = document.getElementById('emptyState');
  const taskCount = document.getElementById('taskCount');

  const activeTasks = state.tasks.filter(t => t.enabled && shouldShowTaskToday(t));

  if (activeTasks.length === 0) {
    taskList.innerHTML = '';
    emptyState.classList.add('show');
    taskCount.textContent = '0';
    return;
  }

  emptyState.classList.remove('show');

  const today = getTodayString();
  const sortedTasks = [...activeTasks].sort((a, b) => {
    const aChecked = isTaskCheckedToday(a.id);
    const bChecked = isTaskCheckedToday(b.id);
    if (aChecked !== bChecked) return aChecked ? 1 : -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  taskList.innerHTML = sortedTasks.map(task => {
    const checked = isTaskCheckedToday(task.id);
    const catClass = getCategoryClass(task.category);
    const isSelected = selectedTaskIds.has(task.id);
    
    if (batchMode) {
      return `
        <div class="task-item batch ${isSelected ? 'selected' : ''}" data-id="${task.id}">
          <label class="batch-checkbox">
            <input type="checkbox" class="batch-task-cb" data-id="${task.id}" ${isSelected ? 'checked' : ''}>
            <span class="batch-cb-box"></span>
          </label>
          <div class="task-info">
            <div class="task-name">${escapeHtml(task.name)}</div>
            <span class="task-category ${catClass}">${escapeHtml(task.category)}</span>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="task-item ${checked ? 'done' : ''}" data-id="${task.id}">
        <div class="task-info">
          <div class="task-name">${escapeHtml(task.name)}</div>
          <span class="task-category ${catClass}">${escapeHtml(task.category)}</span>
        </div>
        <div class="task-actions">
          <button class="edit-btn" data-id="${task.id}" aria-label="编辑任务">
            ✎
          </button>
          <button class="checkin-btn ${checked ? 'done' : ''}" 
                  data-id="${task.id}" 
                  aria-label="${checked ? '已打卡' : '打卡'}">
            ${checked ? '' : '✓'}
          </button>
          <button class="delete-btn" data-id="${task.id}" aria-label="删除任务">
            ×
          </button>
        </div>
      </div>
    `;
  }).join('');

  const checkedCount = activeTasks.filter(t => isTaskCheckedToday(t.id)).length;
  taskCount.textContent = `${checkedCount}/${activeTasks.length}`;
}

function renderStats() {
  const activeTasks = state.tasks.filter(t => t.enabled);
  const checkedCount = activeTasks.filter(t => isTaskCheckedToday(t.id)).length;

  document.getElementById('totalCheckIns').textContent = state.stats.totalCheckIns;
  document.getElementById('currentStreak').textContent = state.stats.currentStreak;
  document.getElementById('longestStreak').textContent = state.stats.longestStreak;
}

function renderProgress() {
  const activeTasks = state.tasks.filter(t => t.enabled);
  const checkedCount = activeTasks.filter(t => isTaskCheckedToday(t.id)).length;
  const total = activeTasks.length;
  const percent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

  document.getElementById('progressPercent').textContent = percent + '%';
  document.getElementById('progressFill').style.width = percent + '%';
  document.getElementById('progressDetail').textContent = `已完成 ${checkedCount} / 总任务 ${total}`;
}

function renderWeekCalendar() {
  const container = document.getElementById('weekDays');
  const dates = [...new Set(state.records.map(r => r.date))];
  const today = getTodayString();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  
  let html = '';
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    const dayName = weekDays[date.getDay()];
    const dayNum = date.getDate();
    const hasCheckins = dates.includes(dateStr);
    const isToday = dateStr === today;
    
    html += `
      <div class="week-day ${hasCheckins ? 'checked' : ''} ${isToday ? 'today' : ''}">
        <span class="day-name">${dayName}</span>
        <span class="day-num">${dayNum}</span>
        ${hasCheckins ? '<span class="day-dot"></span>' : ''}
      </div>
    `;
  }
  
  container.innerHTML = html;
}

function renderRecordsPage() {
  // 更新摘要
  document.getElementById('summaryTotal').textContent = state.stats.totalCheckIns;
  document.getElementById('summaryCurrent').textContent = state.stats.currentStreak;
  document.getElementById('summaryLongest').textContent = state.stats.longestStreak;
  
  // 渲染日历
  renderMonthCalendar();
  
  // 渲染任务筛选器
  renderTaskFilter();
  
  // 渲染最近记录
  renderRecentRecords();
}

function renderTaskFilter() {
  const container = document.getElementById('recentRecords');
  if (!container) return;
  
  // 获取有打卡记录的任务列表（去重）
  const taskIds = [...new Set(state.records.map(r => r.taskId))];
  const tasksWithRecords = taskIds.map(id => state.tasks.find(t => t.id === id)).filter(Boolean);
  
  // 构建筛选器 HTML
  let filterHtml = '<div class="task-filter">';
  filterHtml += '<select id="taskFilterSelect">';
  filterHtml += '<option value="all">全部任务</option>';
  
  tasksWithRecords.forEach(task => {
    const selected = selectedTaskFilter === task.id ? 'selected' : '';
    filterHtml += `<option value="${task.id}" ${selected}>${escapeHtml(task.name)}</option>`;
  });
  
  filterHtml += '</select>';
  filterHtml += '</div>';
  
  // 在 h3 标题后插入筛选器
  const h3 = container.parentElement.querySelector('h3');
  const existingFilter = container.parentElement.querySelector('.task-filter');
  if (existingFilter) {
    existingFilter.remove();
  }
  if (h3 && tasksWithRecords.length > 0) {
    h3.insertAdjacentHTML('afterend', filterHtml);
    
    // 绑定筛选事件
    const select = document.getElementById('taskFilterSelect');
    if (select) {
      select.addEventListener('change', function() {
        selectedTaskFilter = this.value;
        renderRecentRecords();
      });
    }
  }
}

function renderMonthCalendar() {
  const container = document.getElementById('calendarDays');
  const monthLabel = document.getElementById('calendarMonth');
  
  monthLabel.textContent = `${calendarYear}年${calendarMonth + 1}月`;
  
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const today = getTodayString();
  const dates = [...new Set(state.records.map(r => r.date))];
  const activeTasks = state.tasks.filter(t => t.enabled);
  
  let html = '';
  
  // 填充空白
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="calendar-day empty"></div>';
  }
  
  // 填充日期
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasCheckins = dates.includes(dateStr);
    const isToday = dateStr === today;
    const isFuture = dateStr > today;
    
    // 检查这天有没有任务安排
    const dayTasks = activeTasks.filter(t => shouldShowTaskOnDate(t, dateStr));
    const hasTasks = dayTasks.length > 0;
    
    html += `
      <div class="calendar-day ${hasCheckins ? 'checked' : ''} ${hasTasks ? 'has-task' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}" data-date="${dateStr}">
        ${day}
        ${hasCheckins ? '<span class="check-mark">✓</span>' : ''}
        ${!hasCheckins && hasTasks ? '<span class="task-dot"></span>' : ''}
      </div>
    `;
  }
  
  container.innerHTML = html;
  
  // 绑定点击事件
  container.querySelectorAll('.calendar-day:not(.empty)').forEach(dayEl => {
    dayEl.addEventListener('click', function() {
      const dateStr = this.dataset.date;
      showDayDetail(dateStr);
    });
  });
}

function showDayDetail(dateStr) {
  const section = document.getElementById('dayDetailSection');
  const title = document.getElementById('dayDetailTitle');
  const list = document.getElementById('dayDetailList');
  
  const date = new Date(dateStr + 'T00:00:00');
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  title.textContent = `${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`;
  
  const activeTasks = state.tasks.filter(t => t.enabled);
  const dayTasks = activeTasks.filter(t => shouldShowTaskOnDate(t, dateStr));
  
  if (dayTasks.length === 0) {
    list.innerHTML = '<p class="no-records">这一天没有任务安排</p>';
  } else {
    // 获取这天的打卡记录
    const dayRecords = state.records.filter(r => r.date === dateStr);
    const checkedTaskIds = dayRecords.map(r => r.taskId);
    
    list.innerHTML = dayTasks.map(task => {
      const checked = checkedTaskIds.includes(task.id);
      const catClass = getCategoryClass(task.category);
      return `
        <div class="day-detail-item ${checked ? 'done' : ''}">
          <span class="task-category ${catClass}">${escapeHtml(task.category)}</span>
          <span class="day-detail-name">${escapeHtml(task.name)}</span>
          <span class="day-detail-status">${checked ? '✓ 已打卡' : '未打卡'}</span>
        </div>
      `;
    }).join('');
  }
  
  section.style.display = 'block';
}

function closeDayDetail() {
  document.getElementById('dayDetailSection').style.display = 'none';
}

function changeCalendarMonth(delta) {
  calendarMonth += delta;
  if (calendarMonth < 0) {
    calendarMonth = 11;
    calendarYear--;
  } else if (calendarMonth > 11) {
    calendarMonth = 0;
    calendarYear++;
  }
  renderMonthCalendar();
}

function renderRecentRecords() {
  const container = document.getElementById('recentRecords');
  
  // 根据筛选条件过滤记录
  let filteredRecords = [...state.records];
  if (selectedTaskFilter !== 'all') {
    filteredRecords = filteredRecords.filter(r => r.taskId === selectedTaskFilter);
  }
  
  const sortedRecords = filteredRecords.sort((a, b) => 
    new Date(b.checkedAt) - new Date(a.checkedAt)
  ).slice(0, 20);
  
  if (sortedRecords.length === 0) {
    container.innerHTML = '<p class="no-records">暂无打卡记录</p>';
    return;
  }
  
  const html = sortedRecords.map(record => {
    const date = new Date(record.checkedAt);
    const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
    const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const catClass = getCategoryClass(getTaskCategory(record.taskId));
    
    return `
      <div class="record-item">
        <div class="record-info">
          <span class="record-task">${escapeHtml(record.taskName)}</span>
          <span class="record-task ${catClass}">${escapeHtml(getTaskCategory(record.taskId))}</span>
        </div>
        <div class="record-time">
          <span class="record-date">${dateStr}</span>
          <span class="record-clock">${timeStr}</span>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
}

function getTaskCategory(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  return task ? task.category : '自定义';
}

function renderBadges() {
  const badges = document.querySelectorAll('.badge-item');
  const badgesList = state.badges || [];
  
  badges.forEach(badge => {
    const badgeId = badge.dataset.badge;
    if (badgesList.includes(badgeId)) {
      badge.classList.remove('locked');
      badge.classList.add('unlocked');
    } else {
      badge.classList.add('locked');
      badge.classList.remove('unlocked');
    }
  });
}

function checkAndAwardBadges() {
  const total = state.stats.totalCheckIns;
  const streak = state.stats.currentStreak;
  const badgesList = state.badges || [];
  let newBadges = [];
  
  // 初次打卡
  if (total >= 1 && !badgesList.includes('first')) {
    newBadges.push('first');
  }
  
  // 连续3天
  if (streak >= 3 && !badgesList.includes('three')) {
    newBadges.push('three');
  }
  
  // 连续7天
  if (streak >= 7 && !badgesList.includes('seven')) {
    newBadges.push('seven');
  }
  
  // 连续30天
  if (streak >= 30 && !badgesList.includes('thirty')) {
    newBadges.push('thirty');
  }
  
  // 打卡100次
  if (total >= 100 && !badgesList.includes('hundred')) {
    newBadges.push('hundred');
  }
  
  if (newBadges.length > 0) {
    state.badges = [...badgesList, ...newBadges];
    saveData();
    renderBadges();
    
    if (newBadges.length === 1) {
      showToast('🏅 获得新徽章！');
    } else {
      showToast(`🏅 获得${newBadges.length}个新徽章！`);
    }
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function generateId() {
  return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function addTask(name, category, repeatType = 'daily', weekDays = [], startDate = '', endDate = '') {
  const task = {
    id: generateId(),
    name: name.trim(),
    category: category,
    repeatType: repeatType,
    weekDays: weekDays,
    startDate: startDate,
    endDate: endDate,
    reminderTime: '',
    enabled: true,
    createdAt: getTodayString()
  };

  state.tasks.push(task);
  saveData();
  renderTasks();
  renderStats();
  renderProgress();
  showToast('任务添加成功！');
}

function editTask(taskId, newName, newCategory, newRepeatType = 'daily', newWeekDays = [], newStartDate = '', newEndDate = '') {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  task.name = newName.trim();
  task.category = newCategory;
  task.repeatType = newRepeatType;
  task.weekDays = newWeekDays;
  task.startDate = newStartDate;
  task.endDate = newEndDate;
  saveData();
  renderTasks();
  renderProgress();
  showToast('任务已更新');
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter(t => t.id !== taskId);
  state.records = state.records.filter(r => r.taskId !== taskId);
  recalculateStats();
  saveData();
  renderTasks();
  renderStats();
  renderWeekCalendar();
  renderProgress();
  renderRecordsPage();
  showToast('任务已删除');
}

function checkIn(taskId) {
  const today = getTodayString();

  if (isTaskCheckedToday(taskId)) {
    showToast('今天已经打过卡啦～');
    return;
  }

  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  const record = {
    id: 'record_' + Date.now(),
    taskId: task.id,
    taskName: task.name,
    date: today,
    checkedAt: getTodayDateTimeString()
  };

  state.records.push(record);
  recalculateStats();
  saveData();
  renderTasks();
  renderStats();
  renderWeekCalendar();
  renderProgress();
  checkAndAwardBadges();
  updateSkinLockStatus();

  playCheckinSound();
  showCheckinModal();
}

function recalculateStats() {
  const totalCheckIns = state.records.length;

  const dates = [...new Set(state.records.map(r => r.date))].sort();
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (let i = 0; i < dates.length; i++) {
    const currentDate = new Date(dates[i]);
    
    if (prevDate) {
      const diffDays = Math.round((currentDate - prevDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }

    longestStreak = Math.max(longestStreak, tempStreak);
    prevDate = currentDate;
  }

  const today = getTodayString();
  const yesterday = getYesterdayString();
  
  if (dates.includes(today)) {
    let streak = 1;
    let checkDate = new Date(today);
    
    for (let i = 0; i < 365; i++) {
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      const dateStr = formatDate(checkDate);
      if (dates.includes(dateStr)) {
        streak++;
      } else {
        break;
      }
    }
    currentStreak = streak;
  } else if (dates.includes(yesterday)) {
    let streak = 0;
    let checkDate = new Date(yesterday);
    
    for (let i = 0; i < 365; i++) {
      const dateStr = formatDate(checkDate);
      if (dates.includes(dateStr)) {
        streak++;
      } else {
        break;
      }
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    }
    currentStreak = streak;
  } else {
    currentStreak = 0;
  }

  state.stats.totalCheckIns = totalCheckIns;
  state.stats.currentStreak = currentStreak;
  state.stats.longestStreak = Math.max(longestStreak, state.stats.longestStreak || 0);
}

function getYesterdayString() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDate(yesterday);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function showCheckinModal() {
  const modal = document.getElementById('checkinModal');
  const encourageText = document.getElementById('encourageText');
  
  const randomMsg = ENCOURAGE_MESSAGES[Math.floor(Math.random() * ENCOURAGE_MESSAGES.length)];
  encourageText.textContent = randomMsg;

  const bunny = document.getElementById('checkinBunny');
  bunny.style.animation = 'none';
  bunny.offsetHeight;
  bunny.style.animation = '';

  modal.classList.add('show');
  createConfetti();

  setTimeout(() => {
    closeCheckinModal();
  }, 3000);
}

function closeCheckinModal() {
  document.getElementById('checkinModal').classList.remove('show');
}

function createConfetti() {
  const colors = ['#e8793f', '#7cbf8f', '#ffd6ca', '#ffb088', '#a8d8b5', '#ffcc00'];
  
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.top = '-10px';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.width = (Math.random() * 8 + 6) + 'px';
    confetti.style.height = (Math.random() * 8 + 6) + 'px';
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    confetti.style.animation = `confettiFall ${Math.random() * 2 + 2}s linear forwards`;
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    
    document.body.appendChild(confetti);
    
    setTimeout(() => {
      confetti.remove();
    }, 4500);
  }
}

function showAddTaskModal() {
  document.getElementById('addTaskModal').classList.add('show');
  document.getElementById('taskName').value = '';
  document.getElementById('taskName').focus();
  
  const firstRadio = document.querySelector('input[name="category"][value="学习"]');
  if (firstRadio) firstRadio.checked = true;
}

function closeAddTaskModal() {
  document.getElementById('addTaskModal').classList.remove('show');
}

function showDeleteModal(taskId) {
  taskToDelete = taskId;
  document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
  taskToDelete = null;
  document.getElementById('deleteModal').classList.remove('show');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

function showEditModal(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  taskToEdit = taskId;
  document.getElementById('editTaskId').value = taskId;
  document.getElementById('editTaskName').value = task.name;
  
  // 设置分类
  const categoryRadios = document.querySelectorAll('input[name="editCategory"]');
  categoryRadios.forEach(radio => {
    radio.checked = radio.value === task.category;
  });
  
  // 设置重复类型
  const repeatType = task.repeatType || 'daily';
  const repeatTypeRadios = document.querySelectorAll('input[name="editRepeatType"]');
  repeatTypeRadios.forEach(radio => {
    radio.checked = radio.value === repeatType;
  });
  
  // 设置星期
  const weekDays = task.weekDays || [];
  document.querySelectorAll('input[name="editWeekdays"]').forEach(cb => {
    cb.checked = weekDays.includes(parseInt(cb.value));
  });
  
  // 设置日期范围
  document.getElementById('editRepeatStartDate').value = task.startDate || '';
  document.getElementById('editRepeatEndDate').value = task.endDate || '';
  
  // 显示/隐藏选项
  toggleRepeatOptions('edit', repeatType);
  
  document.getElementById('editTaskModal').classList.add('show');
  document.getElementById('editTaskName').focus();
}

function toggleRepeatOptions(prefix, repeatType) {
  let scope = document;
  if (prefix === 'edit') {
    scope = document.getElementById('editTaskModal') || document;
  } else {
    scope = document.getElementById('addTaskModal') || document;
  }
  
  const weekdayOptions = scope.querySelector('.weekday-options');
  const periodOptions = scope.querySelector('.period-options');
  
  if (weekdayOptions) {
    weekdayOptions.style.display = repeatType === 'weekly' ? 'flex' : 'none';
  }
  if (periodOptions) {
    periodOptions.style.display = repeatType === 'period' ? 'grid' : 'none';
  }
}

function closeEditModal() {
  taskToEdit = null;
  document.getElementById('editTaskModal').classList.remove('show');
}

function switchPage(pageName) {
  // 移除所有页面的active类
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // 移除所有导航项的active类
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // 添加当前页面的active类
  const page = document.getElementById('page' + pageName.charAt(0).toUpperCase() + pageName.slice(1));
  if (page) {
    page.classList.add('active');
  }
  
  // 添加当前导航项的active类
  const navItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
  if (navItem) {
    navItem.classList.add('active');
  }
  
  // 如果切换到记录页，刷新数据
  if (pageName === 'records') {
    renderRecordsPage();
  }
  
  // 如果切换到我的页面，刷新徽章
  if (pageName === 'me') {
    renderBadges();
  }
}

function toggleBatchMode() {
  batchMode = !batchMode;
  selectedTaskIds.clear();
  document.getElementById('batchBar').style.display = batchMode ? 'flex' : 'none';
  document.getElementById('selectAllTasks').checked = false;
  updateBatchCount();
  renderTasks();
}

function updateBatchCount() {
  document.getElementById('batchCount').textContent = `已选 ${selectedTaskIds.size} 项`;
  const deleteBtn = document.getElementById('batchDeleteBtn');
  deleteBtn.disabled = selectedTaskIds.size === 0;
  deleteBtn.style.opacity = selectedTaskIds.size === 0 ? '0.5' : '1';
}

function toggleTaskSelection(taskId, checked) {
  if (checked) {
    selectedTaskIds.add(taskId);
  } else {
    selectedTaskIds.delete(taskId);
  }
  updateBatchCount();
  
  // 更新全选状态
  const activeTasks = state.tasks.filter(t => t.enabled && shouldShowTaskToday(t));
  const allSelected = activeTasks.length > 0 && activeTasks.every(t => selectedTaskIds.has(t.id));
  document.getElementById('selectAllTasks').checked = allSelected;
}

function toggleSelectAll(checked) {
  const activeTasks = state.tasks.filter(t => t.enabled && shouldShowTaskToday(t));
  if (checked) {
    activeTasks.forEach(t => selectedTaskIds.add(t.id));
  } else {
    selectedTaskIds.clear();
  }
  renderTasks();
  updateBatchCount();
}

function batchDeleteTasks() {
  if (selectedTaskIds.size === 0) {
    showToast('请先选择任务');
    return;
  }
  
  if (confirm(`确定要删除选中的 ${selectedTaskIds.size} 个任务吗？`)) {
    const idsToDelete = [...selectedTaskIds];
    idsToDelete.forEach(taskId => {
      state.tasks = state.tasks.filter(t => t.id !== taskId);
      state.records = state.records.filter(r => r.taskId !== taskId);
    });
    
    selectedTaskIds.clear();
    recalculateStats();
    saveData();
    renderTasks();
    renderStats();
    renderWeekCalendar();
    renderProgress();
    renderRecordsPage();
    updateBatchCount();
    showToast(`已删除 ${idsToDelete.length} 个任务`);
  }
}

function clearAllData() {
  if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
    state.tasks = [];
    state.records = [];
    state.stats = {
      totalCheckIns: 0,
      currentStreak: 0,
      longestStreak: 0
    };
    state.badges = [];
    saveData();
    renderTasks();
    renderStats();
    renderWeekCalendar();
    renderProgress();
    renderRecordsPage();
    renderBadges();
    showToast('数据已清空');
  }
}

function applySkin() {
  const skin = state.skin || 'default';
  const rabbit = document.getElementById('rabbit');
  const checkinBunny = document.getElementById('checkinBunny');
  const avatarRabbit = document.querySelector('.avatar-rabbit');
  
  if (rabbit) {
    rabbit.className = 'rabbit skin-' + skin;
  }
  if (checkinBunny) {
    checkinBunny.className = 'checkin-bunny skin-' + skin;
  }
  if (avatarRabbit) {
    avatarRabbit.className = 'avatar-rabbit skin-' + skin;
  }
  
  // 更新皮肤选择器
  document.querySelectorAll('.skin-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.skin === skin);
  });
  
  // 更新皮肤卡片
  document.querySelectorAll('.skin-card').forEach(card => {
    card.classList.toggle('active', card.dataset.skin === skin);
  });
  
  // 检查解锁状态
  updateSkinLockStatus();
}

function updateSkinLockStatus() {
  const streak = state.stats.currentStreak;
  const longest = state.stats.longestStreak;
  const goldenUnlocked = Math.max(streak, longest) >= 30;
  
  document.querySelectorAll('[data-skin="golden"]').forEach(el => {
    if (el.classList.contains('skin-btn') || el.classList.contains('skin-card')) {
      el.classList.toggle('locked', !goldenUnlocked);
    }
  });
}

function changeSkin(skinName) {
  // 检查是否解锁
  if (skinName === 'golden') {
    const streak = state.stats.currentStreak;
    const longest = state.stats.longestStreak;
    if (Math.max(streak, longest) < 30) {
      showToast('连续打卡30天解锁金兔子～');
      return;
    }
  }
  
  state.skin = skinName;
  saveData();
  applySkin();
  showToast('皮肤切换成功！');
}

function addPresetPack(packName) {
  const pack = PRESET_PACKS[packName];
  if (!pack) return;
  
  // 读取当前表单中选择的重复类型设置
  const repeatType = document.querySelector('input[name="repeatType"]:checked')?.value || 'daily';
  let weekDays = [];
  let startDate = '';
  let endDate = '';
  
  if (repeatType === 'weekly') {
    document.querySelectorAll('input[name="weekdays"]:checked').forEach(cb => {
      weekDays.push(parseInt(cb.value));
    });
  } else if (repeatType === 'period') {
    startDate = document.getElementById('repeatStartDate')?.value || '';
    endDate = document.getElementById('repeatEndDate')?.value || '';
  }
  
  pack.forEach(item => {
    addTask(item.name, item.category, repeatType, weekDays, startDate, endDate);
  });
  
  showToast(`已添加${pack.length}个任务`);
  closeAddTaskModal();
}

function playCheckinSound() {
  if (!state.soundEnabled) return;
  
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch (e) {
    console.log('音频播放失败:', e);
  }
}

function updateSoundToggle() {
  const toggle = document.getElementById('soundToggle');
  if (toggle) {
    toggle.checked = state.soundEnabled;
  }
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  saveData();
  updateSoundToggle();
  showToast(state.soundEnabled ? '音效已开启' : '音效已关闭');
}

function enableReminders() {
  if (!('Notification' in window)) {
    showToast('您的浏览器不支持通知功能');
    return;
  }
  
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      showToast('打卡提醒已开启');
      const btn = document.getElementById('enableReminderBtn');
      if (btn) {
        btn.textContent = '已开启';
        btn.classList.add('active');
      }
    } else {
      showToast('通知权限被拒绝');
    }
  });
}

function showPosterModal() {
  generatePoster();
  document.getElementById('posterModal').classList.add('show');
}

function closePosterModal() {
  document.getElementById('posterModal').classList.remove('show');
}

function generatePoster() {
  const canvas = document.getElementById('posterCanvas');
  const ctx = canvas.getContext('2d');
  
  // 背景
  const gradient = ctx.createLinearGradient(0, 0, 0, 480);
  gradient.addColorStop(0, '#fff5e6');
  gradient.addColorStop(1, '#fffaf3');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 300, 480);
  
  // 标题
  ctx.fillStyle = '#2b2118';
  ctx.font = 'bold 24px "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('蹦兔打卡', 150, 50);
  
  // 日期
  ctx.fillStyle = '#9a8b7c';
  ctx.font = '14px "PingFang SC", sans-serif';
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  ctx.fillText(dateStr, 150, 75);
  
  // 画兔子
  drawRabbitOnCanvas(ctx, 150, 140, 60);
  
  // 统计数据
  const total = state.stats.totalCheckIns;
  const streak = state.stats.currentStreak;
  const activeTasks = state.tasks.filter(t => t.enabled).length;
  const checkedToday = state.tasks.filter(t => t.enabled && isTaskCheckedToday(t.id)).length;
  
  ctx.fillStyle = '#e8793f';
  ctx.font = 'bold 20px "PingFang SC", sans-serif';
  ctx.fillText(`累计打卡 ${total} 次`, 150, 250);
  
  ctx.fillStyle = '#7cbf8f';
  ctx.font = '16px "PingFang SC", sans-serif';
  ctx.fillText(`连续打卡 ${streak} 天`, 150, 275);
  
  ctx.fillStyle = '#5a4a3a';
  ctx.font = '14px "PingFang SC", sans-serif';
  ctx.fillText(`今日完成 ${checkedToday}/${activeTasks}`, 150, 300);
  
  // 鼓励语
  const randomMsg = ENCOURAGE_MESSAGES[Math.floor(Math.random() * ENCOURAGE_MESSAGES.length)];
  ctx.fillStyle = '#e8793f';
  ctx.font = 'bold 18px "PingFang SC", sans-serif';
  ctx.fillText(randomMsg, 150, 350);
  
  // 底部
  ctx.fillStyle = '#9a8b7c';
  ctx.font = '12px "PingFang SC", sans-serif';
  ctx.fillText('和小兔子一起坚持打卡吧！', 150, 450);
}

function drawRabbitOnCanvas(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  
  const scale = size / 60;
  ctx.scale(scale, scale);
  
  // 耳朵
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = 3;
  
  // 左耳
  ctx.beginPath();
  ctx.ellipse(-20, -35, 12, 28, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // 左耳内侧
  ctx.fillStyle = '#ffd6ca';
  ctx.beginPath();
  ctx.ellipse(-20, -35, 5, 18, -0.2, 0, Math.PI * 2);
  ctx.fill();
  
  // 右耳
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(20, -35, 12, 28, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // 右耳内侧
  ctx.fillStyle = '#ffd6ca';
  ctx.beginPath();
  ctx.ellipse(20, -35, 5, 18, 0.2, 0, Math.PI * 2);
  ctx.fill();
  
  // 脸
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(0, 0, 35, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // 眼睛
  ctx.fillStyle = '#2b2118';
  ctx.beginPath();
  ctx.arc(-12, -5, 4, 0, Math.PI * 2);
  ctx.arc(12, -5, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // 鼻子
  ctx.fillStyle = '#ff9aa2';
  ctx.beginPath();
  ctx.ellipse(0, 5, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // 腮红
  ctx.fillStyle = 'rgba(255, 192, 203, 0.7)';
  ctx.beginPath();
  ctx.ellipse(-22, 8, 6, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(22, 8, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // 嘴巴（微笑）
  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 12, 6, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  
  ctx.restore();
}

function savePoster() {
  const canvas = document.getElementById('posterCanvas');
  const link = document.createElement('a');
  link.download = '蹦兔打卡_' + getTodayString() + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('海报已保存！');
}

function bindEvents() {
  // 添加任务
  document.getElementById('addTaskBtn').addEventListener('click', showAddTaskModal);
  document.getElementById('closeAddModal').addEventListener('click', closeAddTaskModal);
  document.getElementById('cancelAddBtn').addEventListener('click', closeAddTaskModal);

  document.getElementById('addTaskForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const taskName = document.getElementById('taskName').value.trim();
    const category = document.querySelector('input[name="category"]:checked')?.value || '学习';
    const repeatType = document.querySelector('input[name="repeatType"]:checked')?.value || 'daily';
    
    let weekDays = [];
    let startDate = '';
    let endDate = '';
    
    if (repeatType === 'weekly') {
      document.querySelectorAll('input[name="weekdays"]:checked').forEach(cb => {
        weekDays.push(parseInt(cb.value));
      });
    } else if (repeatType === 'period') {
      startDate = document.getElementById('repeatStartDate')?.value || '';
      endDate = document.getElementById('repeatEndDate')?.value || '';
    }

    if (!taskName) {
      showToast('请输入任务名称');
      return;
    }

    addTask(taskName, category, repeatType, weekDays, startDate, endDate);
    closeAddTaskModal();
  });

  // 主题任务包
  document.querySelectorAll('.pack-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const packName = this.dataset.pack;
      addPresetPack(packName);
    });
  });

  // 任务列表操作
  document.getElementById('taskList').addEventListener('click', function(e) {
    const target = e.target;
    
    // 批量模式下点击整行切换选中
    if (batchMode) {
      const cb = target.closest('.task-item')?.querySelector('.batch-task-cb');
      if (cb && !target.matches('input[type="checkbox"]')) {
        cb.checked = !cb.checked;
        toggleTaskSelection(cb.dataset.id, cb.checked);
        cb.closest('.task-item').classList.toggle('selected', cb.checked);
      }
      return;
    }
    
    if (target.classList.contains('checkin-btn') && !target.classList.contains('done')) {
      const taskId = target.dataset.id;
      checkIn(taskId);
    }
    
    if (target.classList.contains('edit-btn')) {
      const taskId = target.dataset.id;
      showEditModal(taskId);
    }
    
    if (target.classList.contains('delete-btn')) {
      const taskId = target.dataset.id;
      showDeleteModal(taskId);
    }
  });
  
  // 批量模式下复选框变化
  document.getElementById('taskList').addEventListener('change', function(e) {
    if (e.target.classList.contains('batch-task-cb')) {
      toggleTaskSelection(e.target.dataset.id, e.target.checked);
      e.target.closest('.task-item').classList.toggle('selected', e.target.checked);
    }
  });

  // 打卡成功弹窗
  document.getElementById('closeCheckinModal').addEventListener('click', closeCheckinModal);
  document.getElementById('checkinModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeCheckinModal();
    }
  });

  // 删除任务弹窗
  document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
  document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
    if (taskToDelete) {
      deleteTask(taskToDelete);
      closeDeleteModal();
    }
  });

  document.getElementById('deleteModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeDeleteModal();
    }
  });

  // 编辑任务弹窗
  document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
  document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
  
  document.getElementById('editTaskForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const taskId = document.getElementById('editTaskId').value;
    const taskName = document.getElementById('editTaskName').value.trim();
    const category = document.querySelector('input[name="editCategory"]:checked')?.value || '学习';
    const repeatType = document.querySelector('input[name="editRepeatType"]:checked')?.value || 'daily';
    
    let weekDays = [];
    let startDate = '';
    let endDate = '';
    
    if (repeatType === 'weekly') {
      document.querySelectorAll('input[name="editWeekdays"]:checked').forEach(cb => {
        weekDays.push(parseInt(cb.value));
      });
    } else if (repeatType === 'period') {
      startDate = document.getElementById('editRepeatStartDate')?.value || '';
      endDate = document.getElementById('editRepeatEndDate')?.value || '';
    }

    if (!taskName) {
      showToast('请输入任务名称');
      return;
    }

    editTask(taskId, taskName, category, repeatType, weekDays, startDate, endDate);
    closeEditModal();
  });
  
  document.getElementById('editTaskModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeEditModal();
    }
  });

  // 模态框点击背景关闭
  document.getElementById('addTaskModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeAddTaskModal();
    }
  });

  // 键盘事件
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeAddTaskModal();
      closeCheckinModal();
      closeDeleteModal();
      closeEditModal();
      closePosterModal();
    }
  });
  
  // 底部导航
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const pageName = this.dataset.page;
      switchPage(pageName);
    });
  });
  
  // 清空数据
  document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
  
  // 批量管理
  document.getElementById('manageBtn').addEventListener('click', toggleBatchMode);
  document.getElementById('batchCancelBtn').addEventListener('click', toggleBatchMode);
  document.getElementById('batchDeleteBtn').addEventListener('click', batchDeleteTasks);
  document.getElementById('selectAllTasks').addEventListener('change', function() {
    toggleSelectAll(this.checked);
  });
  
  // 兔子点击动画
  const rabbit = document.getElementById('rabbit');
  if (rabbit) {
    rabbit.addEventListener('click', function() {
      this.style.animation = 'none';
      this.offsetHeight;
      this.style.animation = 'rabbitJump 0.4s ease-out';
    });
  }
  
  // 皮肤选择
  document.querySelectorAll('.skin-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const skinName = this.dataset.skin;
      changeSkin(skinName);
    });
  });
  
  document.querySelectorAll('.skin-card').forEach(card => {
    card.addEventListener('click', function() {
      const skinName = this.dataset.skin;
      changeSkin(skinName);
    });
  });
  
  // 音效开关
  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.addEventListener('change', toggleSound);
  }
  
  // 提醒按钮
  const reminderBtn = document.getElementById('enableReminderBtn');
  if (reminderBtn) {
    reminderBtn.addEventListener('click', enableReminders);
  }
  
  // 海报相关
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', showPosterModal);
  }
  
  const closePosterBtn = document.getElementById('closePosterBtn');
  if (closePosterBtn) {
    closePosterBtn.addEventListener('click', closePosterModal);
  }
  
  const closePosterModalBtn = document.getElementById('closePosterModal');
  if (closePosterModalBtn) {
    closePosterModalBtn.addEventListener('click', closePosterModal);
  }
  
  const posterModal = document.getElementById('posterModal');
  if (posterModal) {
    posterModal.addEventListener('click', function(e) {
      if (e.target === this) {
        closePosterModal();
      }
    });
  }
  
  const savePosterBtn = document.getElementById('savePosterBtn');
  if (savePosterBtn) {
    savePosterBtn.addEventListener('click', savePoster);
  }
  
  // 重复类型切换事件
  document.querySelectorAll('input[name="repeatType"]').forEach(radio => {
    radio.addEventListener('change', function() {
      toggleRepeatOptions('', this.value);
    });
  });
  
  document.querySelectorAll('input[name="editRepeatType"]').forEach(radio => {
    radio.addEventListener('change', function() {
      toggleRepeatOptions('edit', this.value);
    });
  });
  
  // 日历月份切换
  document.getElementById('prevMonth').addEventListener('click', function() {
    changeCalendarMonth(-1);
  });
  document.getElementById('nextMonth').addEventListener('click', function() {
    changeCalendarMonth(1);
  });
  
  // 日期详情关闭
  document.getElementById('closeDayDetail').addEventListener('click', closeDayDetail);
}

document.addEventListener('DOMContentLoaded', init);
