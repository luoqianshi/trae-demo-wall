/**
 * 日程规划 Schedule
 */

let calendarDate = new Date();
let selectedDate = null;

function renderSchedule() {
  renderCalendar();
  renderTodaySchedule();
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  document.getElementById('calendar-month').textContent = `${year}年${month + 1}月`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const tasks = getTasks();
  const datesWithTasks = new Set(tasks.map(t => t.dueDate));

  const today = getToday();

  let html = '';
  for (let i = 0; i < startPadding; i++) {
    html += '<div class="date-cell" style="visibility:hidden"></div>';
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === today;
    const hasTask = datesWithTasks.has(dateStr);
    const isSelected = dateStr === selectedDate;
    html += `<div class="date-cell ${isToday ? 'today' : ''} ${hasTask ? 'has-task' : ''} ${isSelected ? 'selected' : ''}" onclick="showDateTasks('${dateStr}')">${d}</div>`;
  }
  document.getElementById('calendar-grid').innerHTML = html;
}

function changeMonth(delta) {
  calendarDate.setMonth(calendarDate.getMonth() + delta);
  renderCalendar();
}

function renderTodaySchedule() {
  const container = document.getElementById('schedule-today');
  const tasks = getTodayTasks().sort((a, b) => {
    const pMap = { high: 0, medium: 1, low: 2 };
    return pMap[a.priority] - pMap[b.priority];
  });

  if (tasks.length === 0) {
    container.innerHTML = '<div class="text-center text-gray-400 py-4">今天没有安排任务</div>';
    return;
  }

  container.innerHTML = tasks.map(t => `
    <div class="flex items-center py-2 ${t.completed ? 'task-complete' : ''}" onclick="toggleTask('${t.id}');renderSchedule();renderDashboard();renderTasks();renderReview()">
      <div class="checkbox ${t.completed ? 'checked' : ''} mr-3"></div>
      <div class="flex-1 min-w-0">
        <div class="task-title text-sm ${t.completed ? 'line-through text-gray-400' : 'text-gray-800'}">${t.title}</div>
      </div>
      <span class="text-xs px-2 py-0.5 rounded-full ${CATEGORIES[t.category].class}">${CATEGORIES[t.category].icon} ${CATEGORIES[t.category].name}</span>
    </div>
  `).join('');
}

function showDateTasks(dateStr) {
  selectedDate = dateStr;
  renderCalendar();

  const tasks = getTasksByDate(dateStr);
  const container = document.getElementById('schedule-today');
  const titleEl = document.getElementById('schedule-title');

  if (dateStr === getToday()) {
    titleEl.textContent = '今日任务';
  } else {
    const d = new Date(dateStr);
    const weekDays = ['日','一','二','三','四','五','六'];
    titleEl.textContent = `${d.getMonth()+1}月${d.getDate()}日 星期${weekDays[d.getDay()]}`;
  }

  if (tasks.length === 0) {
    container.innerHTML = `<div class="text-center text-gray-400 py-4">${dateStr === getToday() ? '今天没有安排任务' : '该日期没有任务'}</div>`;
  } else {
    container.innerHTML = tasks.map(t => `
      <div class="flex items-center py-2 ${t.completed ? 'task-complete' : ''}" onclick="toggleTask('${t.id}');renderSchedule();renderDashboard();renderTasks();renderReview()">
        <div class="checkbox ${t.completed ? 'checked' : ''} mr-3"></div>
        <div class="flex-1 min-w-0">
          <div class="task-title text-sm ${t.completed ? 'line-through text-gray-400' : 'text-gray-800'}">${t.title}</div>
        </div>
        <span class="text-xs px-2 py-0.5 rounded-full ${CATEGORIES[t.category].class}">${CATEGORIES[t.category].icon} ${CATEGORIES[t.category].name}</span>
      </div>
    `).join('');
  }
}
