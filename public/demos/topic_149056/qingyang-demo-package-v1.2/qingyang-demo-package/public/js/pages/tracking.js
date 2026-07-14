const trackingPage = {
  tasks: [],
  weeklyReport: null,

  async render() {
    const app = document.getElementById('app');

    app.innerHTML = `
      <div class="page">
        <div class="page-header">
          <h1>进度追踪</h1>
          <div class="subtitle">记录每一天的健康变化</div>
        </div>

        <div class="section">
          <div class="section-title">本周完成率</div>
          <div class="card">
            <div id="tracking-progress">
              <div class="loading"><div class="loading-spinner"></div></div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">今日打卡</div>
          <div id="tracking-tasks">
            <div class="loading"><div class="loading-spinner"></div><div class="loading-text">加载中...</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">周度报告</div>
          <div id="tracking-report">
            <div class="loading"><div class="loading-spinner"></div><div class="loading-text">加载中...</div></div>
          </div>
        </div>
      </div>
    `;

    await this.loadData();
  },

  async loadData() {
    const isGuest = localStorage.getItem('guestMode');

    // 加载今日任务
    await this.loadTasks(isGuest);

    // 加载周报
    await this.loadWeeklyReport(isGuest);

    // 更新完成率
    this.updateProgress();
  },

  async loadTasks(isGuest) {
    const container = document.getElementById('tracking-tasks');
    if (!container) return;

    if (isGuest) {
      this.tasks = [
        { id: 't1', type: 'diet', content: '早餐：燕麦粥 + 蓝莓 + 坚果', time: '08:00', completed: true },
        { id: 't2', type: 'exercise', content: '工间操 10分钟', time: '10:00', completed: true },
        { id: 't3', type: 'water', content: '下午喝水 500ml', time: '15:00', completed: false },
        { id: 't4', type: 'diet', content: '晚餐：清淡饮食', time: '18:30', completed: false },
        { id: 't5', type: 'sleep', content: '23:00 前准备入睡', time: '23:00', completed: false },
      ];
    } else {
      try {
        const result = await api.getTodayTasks();
        if (result.code === 0 && result.data) {
          this.tasks = Array.isArray(result.data) ? result.data : (result.data.tasks || []);
        }
      } catch (err) {
        // 静默处理
      }
    }

    this.renderTasks(container);
  },

  renderTasks(container) {
    const icons = { diet: '🍽️', exercise: '🏃', sleep: '😴', water: '💧', other: '📝' };
    const typeNames = { diet: '饮食', exercise: '运动', sleep: '睡眠', water: '饮水', other: '其他' };

    if (!this.tasks || this.tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 32px 16px;">
          <div class="empty-icon">📝</div>
          <div class="empty-title">今天暂无任务</div>
        </div>
      `;
      return;
    }

    container.innerHTML = this.tasks.map(task => {
      const icon = icons[task.type] || icons.other;
      const typeName = typeNames[task.type] || '其他';
      const statusCls = task.completed ? 'completed' : '';
      const statusText = task.completed ? '已完成' : '去完成';
      const btnCls = task.completed ? 'btn btn-sm btn-secondary task-check-btn' : 'btn btn-sm btn-primary task-check-btn';

      return `
        <div class="task-item ${statusCls}" data-task-id="${task.id || ''}" data-completed="${task.completed ? 1 : 0}">
          <div class="task-icon">${icon}</div>
          <div class="task-info">
            <div class="task-content">${task.content || task.title || '任务'}</div>
            <div class="task-meta">${task.time || ''} · ${typeName}</div>
          </div>
          <div class="task-action">
            <button class="${btnCls}" data-task-id="${task.id || ''}" data-completed="${task.completed ? 1 : 0}">
              ${statusText}
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.bindTaskEvents();
  },

  bindTaskEvents() {
    document.querySelectorAll('.task-check-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        const isCompleted = btn.dataset.completed === '1';
        const taskItem = btn.closest('.task-item');
        const isGuest = localStorage.getItem('guestMode');

        if (isCompleted) return;

        if (isGuest) {
          taskItem.classList.add('completed');
          taskItem.dataset.completed = '1';
          btn.dataset.completed = '1';
          btn.textContent = '已完成';
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-secondary');
          this.updateProgress();
          showToast('打卡成功！', 'success');
          return;
        }

        btn.disabled = true;
        btn.textContent = '提交中...';

        try {
          const result = await api.submitFeedback({
            taskId,
            completed: true,
            timestamp: new Date().toISOString(),
          });

          if (result.code === 0) {
            taskItem.classList.add('completed');
            taskItem.dataset.completed = '1';
            btn.dataset.completed = '1';
            btn.textContent = '已完成';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
            this.updateProgress();
            showToast('打卡成功！', 'success');
          } else {
            showToast(result.message || '操作失败', 'error');
          }
        } catch (err) {
          showToast('网络错误', 'error');
        } finally {
          btn.disabled = false;
        }
      });
    });
  },

  updateProgress() {
    const container = document.getElementById('tracking-progress');
    if (!container) return;

    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 环形进度
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 24px;">
        <div class="circle-progress">
          <svg width="100" height="100">
            <circle class="circle-bg" cx="50" cy="50" r="${radius}"></circle>
            <circle class="circle-fill" cx="50" cy="50" r="${radius}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${offset}"></circle>
          </svg>
          <div class="circle-text">${percentage}%</div>
        </div>
        <div style="flex: 1;">
          <div class="stat-value">${completed}<span style="font-size: 14px; color: var(--text-light);"> / ${total}</span></div>
          <div class="stat-label">今日已完成任务</div>
          <div class="progress-bar mt-8">
            <div class="progress-fill" style="width: ${percentage}%"></div>
          </div>
        </div>
      </div>
    `;
  },

  async loadWeeklyReport(isGuest) {
    const container = document.getElementById('tracking-report');
    if (!container) return;

    if (isGuest) {
      this.renderMockReport(container);
      return;
    }

    try {
      const result = await api.getWeeklyReport();
      if (result.code === 0 && result.data) {
        this.weeklyReport = result.data;
        this.renderReport(container);
      } else {
        this.renderMockReport(container);
      }
    } catch (err) {
      this.renderMockReport(container);
    }
  },

  renderMockReport(container) {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    container.innerHTML = `
      <div class="report-card">
        <div class="report-title">
          📊 本周总结
          <span class="tag tag-primary" style="margin-left: auto;">${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${today.getMonth() + 1}/${today.getDate()}</span>
        </div>
        <div class="report-summary">
          <p>✅ 本周完成任务 <strong style="color: var(--primary);">18/35</strong> 项，完成率 <strong style="color: var(--primary);">51%</strong></p>
          <p>🍽️ 饮食达标 <strong style="color: var(--success);">5/7</strong> 天</p>
          <p>🏃 运动完成 <strong style="color: var(--warning);">3/7</strong> 天</p>
          <p>😴 睡眠达标 <strong style="color: var(--success);">6/7</strong> 天</p>
          <p style="margin-top: 12px; color: var(--primary); font-weight: 500;">💡 建议：增加运动频率，争取每天至少运动20分钟</p>
        </div>
      </div>
    `;
  },

  renderReport(container) {
    const data = this.weeklyReport;

    container.innerHTML = `
      <div class="report-card">
        <div class="report-title">
          📊 周度报告
          ${data.weekRange ? `<span class="tag tag-primary" style="margin-left: auto;">${data.weekRange}</span>` : ''}
        </div>
        <div class="report-summary">
          ${data.summary ? `<p>${data.summary}</p>` : ''}
          ${data.totalTasks !== undefined ? `<p>✅ 本周完成任务 <strong style="color: var(--primary);">${data.completedTasks || 0}/${data.totalTasks}</strong> 项</p>` : ''}
          ${data.completionRate !== undefined ? `<p>📈 完成率 <strong style="color: var(--primary);">${data.completionRate}%</strong></p>` : ''}
          ${data.suggestions ? `
            <div style="margin-top: 12px; padding: 12px; background: rgba(13, 148, 136, 0.05); border-radius: 8px;">
              <div style="font-weight: 600; color: var(--primary); margin-bottom: 8px;">💡 改善建议</div>
              ${(Array.isArray(data.suggestions) ? data.suggestions : [data.suggestions]).map(s => `<p style="margin-bottom: 4px;">• ${s}</p>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
};
