/**
 * 效率复盘 Review
 */

function renderReview() {
  const tasks = getTasks();
  const now = new Date();
  const focusRecords = getFocusRecords();

  // 本周完成率
  const weekDays = getWeekDays();
  const weekTasks = tasks.filter(t => weekDays.includes(t.dueDate));
  const weekCompleted = weekTasks.filter(t => t.completed).length;
  const weekRate = weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0;

  // 本月完成率
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const monthTasks = tasks.filter(t => t.dueDate.startsWith(currentMonth));
  const monthCompleted = monthTasks.filter(t => t.completed).length;
  const monthRate = monthTasks.length > 0 ? Math.round((monthCompleted / monthTasks.length) * 100) : 0;

  // 累计专注时长（小时）
  const totalFocusMinutes = focusRecords
    .filter(r => r.completed)
    .reduce((sum, r) => sum + r.actualDuration, 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  // 连续专注天数
  const streak = calculateStreak(focusRecords.filter(r => r.completed));

  // 更新数字 - 使用动画
  animateNumber(document.getElementById('review-week'), weekRate);
  animateNumber(document.getElementById('review-month'), monthRate);
  animateNumber(document.getElementById('review-focus'), parseFloat(totalFocusHours));
  animateNumber(document.getElementById('review-streak'), streak);

  // 近7日柱状图
  renderBarChart();

  // 效率评分
  const score = Math.min(100, Math.round(weekRate * 0.5 + Math.min(totalFocusHours * 10, 50)));
  document.getElementById('review-score').textContent = score;
  document.getElementById('score-bar').style.width = score + '%';

  // 渲染成就徽章
  renderAchievements();
}

function renderAchievements() {
  const unlocked = getAchievements();
  const container = document.getElementById('achievement-grid');
  if (!container) return;

  container.innerHTML = ACHIEVEMENTS.map(ach => {
    const isUnlocked = unlocked.includes(ach.id);
    return `
      <div class="badge-item ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="badge-icon">${ach.icon}</div>
        <div class="badge-name">${ach.name}</div>
        <div class="badge-desc">${ach.desc}</div>
      </div>
    `;
  }).join('');
}

function renderBarChart() {
  const container = document.getElementById('review-chart');
  const tasks = getTasks();
  const days = [];
  const counts = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const label = `${d.getMonth()+1}/${d.getDate()}`;
    days.push(label);
    counts.push(tasks.filter(t => t.dueDate === dateStr && t.completed).length);
  }

  const maxCount = Math.max(...counts, 1);

  container.innerHTML = counts.map((count, i) => `
    <div class="bar" style="height: ${(count / maxCount) * 100}%">
      <span class="bar-label">${days[i]}</span>
    </div>
  `).join('');
}

function showClearConfirm() {
  showConfirmDialog(
    '确认重置？',
    '这将清空所有任务、专注记录和成就，不可恢复。',
    () => {
      clearAllData();
      renderDashboard();
      renderTasks();
      renderSchedule();
      renderFocusRecords();
      renderReview();
      showToast('数据已重置');
    }
  );
}
