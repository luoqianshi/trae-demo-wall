/**
 * TimeForge X - 仪表盘脚本
 * 仪表盘页面数据加载和交互
 */
(function() {
  'use strict';
  const TF = window.TimeForge;

  async function loadDashboard() {
    try {
      const res = await TF.get('/api/dashboard');
      if (!res.success) return;

      const { user, level_info, tasks, ddl_risk, today_activity } = res;

      // 更新用户信息
      if (user) {
        TF.setUser(user);
        updateUserDisplay(user, level_info);
      }

      // 更新统计卡片
      updateStatCards(tasks, ddl_risk);

      // 更新DDL风险
      updateDdlRisk(ddl_risk);

      // 更新今日活动
      updateTodayActivity(today_activity);

      // 更新任务列表
      updateTaskList(tasks.recent || []);

      // 更新成长概览
      updateGrowthOverview(user, level_info);

      // 更新活动时间线
      updateActivityTimeline(tasks.recent || []);

    } catch (e) {
      console.error('加载仪表盘失败:', e);
    }
  }

  function updateUserDisplay(user, levelInfo) {
    const el = document.getElementById('welcomeUsername');
    if (el) el.textContent = user.username;

    const levelEl = document.getElementById('userLevelBadge');
    if (levelEl) {
      levelEl.textContent = `Lv.${levelInfo.level} ${levelInfo.level_name}`;
      levelEl.className = `badge-level ${TF.getLevelClass(levelInfo.level)}`;
    }

    const expBar = document.getElementById('expProgressBar');
    if (expBar) {
      expBar.style.width = levelInfo.exp_percentage + '%';
      expBar.textContent = `${levelInfo.current_exp}/${levelInfo.next_level_exp} EXP`;
    }

    const streakEl = document.getElementById('streakCount');
    if (streakEl) streakEl.textContent = user.streak + '天';

    const strengthEl = document.getElementById('battlePower');
    if (strengthEl) strengthEl.textContent = (levelInfo.level * 500 + user.experience % 500);
  }

  function updateStatCards(tasks, ddlRisk) {
    const totalEl = document.getElementById('statTotal');
    const progressEl = document.getElementById('statProgress');
    const completedEl = document.getElementById('statCompleted');
    const riskEl = document.getElementById('statRisk');

    if (totalEl) totalEl.textContent = tasks.total;
    if (progressEl) progressEl.textContent = tasks.in_progress;
    if (completedEl) completedEl.textContent = tasks.completed;

    const riskCount = ddlRisk['红色'] || 0;
    if (riskEl) {
      riskEl.textContent = riskCount;
      const riskIcon = document.getElementById('statRiskIcon');
      if (riskIcon && riskCount > 0) riskIcon.style.color = '#EF4444';
    }
  }

  function updateDdlRisk(ddlRisk) {
    const greenEl = document.getElementById('riskGreen');
    const yellowEl = document.getElementById('riskYellow');
    const redEl = document.getElementById('riskRed');

    if (greenEl) greenEl.textContent = ddlRisk['绿色'] || 0;
    if (yellowEl) yellowEl.textContent = ddlRisk['黄色'] || 0;
    if (redEl) redEl.textContent = ddlRisk['红色'] || 0;
  }

  function updateTodayActivity(activity) {
    const focusEl = document.getElementById('todayFocus');
    const tasksEl = document.getElementById('todayTasks');

    if (focusEl) focusEl.textContent = (activity.focus_minutes || 0) + '分钟';
    if (tasksEl) tasksEl.textContent = (activity.tasks_done || 0) + '个';
  }

  function updateTaskList(tasks) {
    const container = document.getElementById('recentTasks');
    if (!container) return;

    if (!tasks.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">暂无任务</div></div>';
      return;
    }

    container.innerHTML = tasks.map(task => {
      const subtasks = task.subtasks || [];
      const completed = subtasks.filter(s => s.completed).length;
      const progress = subtasks.length ? Math.round((completed / subtasks.length) * 100) : 0;
      let risk = '绿色';
      if (task.deadline) {
        try {
          const dl = new Date(task.deadline);
          const remaining = Math.ceil((dl - new Date()) / (1000 * 60 * 60 * 24));
          if (remaining <= 2) risk = '红色';
          else if (remaining <= 7) risk = '黄色';
        } catch (e) {}
      }
      const riskClass = TF.getRiskClass(risk);

      return `
        <div class="task-card">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h6 class="mb-1">${task.title}</h6>
              <span class="risk-indicator ${risk === '红色' ? 'high' : risk === '黄色' ? 'medium' : 'low'}">${risk}风险</span>
            </div>
            <span class="badge badge-${task.status === '已完成' ? 'success' : task.status === '已延期' ? 'danger' : 'primary'}">${task.status}</span>
          </div>
          <div class="progress" style="height:6px;">
            <div class="progress-bar" style="width:${progress}%;"></div>
          </div>
          <div class="d-flex justify-content-between mt-2">
            <small class="text-muted">${completed}/${subtasks.length} 子任务</small>
            <small class="text-muted">${task.deadline || '无截止日期'}</small>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateGrowthOverview(user, levelInfo) {
    if (!user) return;
    const expBar = document.getElementById('expBar');
    const expText = document.getElementById('expText');
    const levelDisplay = document.getElementById('levelDisplay');

    if (expBar) expBar.style.width = levelInfo.exp_percentage + '%';
    if (expText) expText.textContent = `${levelInfo.current_exp} / ${levelInfo.next_level_exp} EXP`;
    if (levelDisplay) levelDisplay.textContent = `Lv.${levelInfo.level} ${levelInfo.level_name}`;

    const powerEl = document.getElementById('powerValue');
    if (powerEl) powerEl.textContent = levelInfo.level * 500 + (user.experience % 500);
  }

  function updateActivityTimeline(tasks) {
    const container = document.getElementById('activityTimeline');
    if (!container) return;

    const now = new Date();
    const items = [];

    tasks.forEach(task => {
      items.push({
        time: task.deadline || '近期',
        content: `📋 ${task.title} - ${task.status}`,
        type: 'task',
      });
    });

    if (items.length === 0) {
      items.push({ time: '今天', content: '开始你的第一个任务吧！', type: 'info' });
    }

    container.innerHTML = items.slice(0, 5).map((item, i) => `
      <div class="timeline-item">
        <div class="timeline-time">${item.time}</div>
        <div class="timeline-content">${item.content}</div>
      </div>
    `).join('');
  }

  // 初始化
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.stat-card')) {
      loadDashboard();
    }
  });
})();