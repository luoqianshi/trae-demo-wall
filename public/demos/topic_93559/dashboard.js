/**
 * 首页概览 Dashboard
 */

function renderDashboard() {
  const tasks = getTodayTasks();
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const focusRecords = getFocusRecords();

  // 计算今日专注时长（小时）
  const today = getToday();
  const todayFocusMinutes = focusRecords
    .filter(r => {
      const d = new Date(r.startTime);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return dateStr === today && r.completed;
    })
    .reduce((sum, r) => sum + r.actualDuration, 0);
  const focusHours = (todayFocusMinutes / 60).toFixed(1);

  // 问候语
  const hour = new Date().getHours();
  let greeting = '早上好';
  if (hour >= 12) greeting = '下午好';
  if (hour >= 18) greeting = '晚上好';
  const remaining = total - completed;
  if (remaining > 0) {
    document.getElementById('greeting').textContent = `${greeting}，同学！今天还有 ${remaining} 项任务`;
  } else {
    document.getElementById('greeting').textContent = `${greeting}，同学！今日任务已全部完成 🎉`;
  }

  // 日期
  const weekDays = ['日','一','二','三','四','五','六'];
  const now = new Date();
  document.getElementById('current-date').textContent =
    `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 星期${weekDays[now.getDay()]}`;

  // 中考倒计时
  const zhongkaoDate = new Date(ZHONGKAO_DATE);
  const diffMs = zhongkaoDate - now;
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  document.getElementById('zhongkao-days').textContent = diffDays;

  // 统计数字 - 使用动画
  animateNumber(document.getElementById('dash-completed'), completed);
  document.getElementById('dash-total').textContent = total;
  animateNumber(document.getElementById('dash-focus'), parseFloat(focusHours));

  // 待办预览（前3条未完成）
  const container = document.getElementById('dash-tasks');
  const undone = tasks.filter(t => !t.completed).slice(0, 3);
  if (undone.length === 0) {
    container.innerHTML = '<div class="text-center text-gray-400 py-4">🎉 今日任务全部完成！</div>';
  } else {
    container.innerHTML = undone.map(t => `
      <div class="flex items-center py-2 ${t.completed ? 'task-complete' : ''}" onclick="toggleTask('${t.id}');renderDashboard();renderTasks()">
        <div class="checkbox ${t.completed ? 'checked' : ''} mr-3"></div>
        <div class="flex-1 task-title text-sm ${t.completed ? 'line-through text-gray-400' : 'text-gray-700'}">${t.title}</div>
        <span class="text-xs px-2 py-0.5 rounded-full ${CATEGORIES[t.category].class}">${CATEGORIES[t.category].icon} ${CATEGORIES[t.category].name}</span>
      </div>
    `).join('');
  }

  // 检查成就解锁
  const newAchievements = checkAndUnlockAchievements();
  newAchievements.forEach(ach => {
    showToast(`🏅 解锁成就：${ach.name}！${ach.icon}`);
  });
}
