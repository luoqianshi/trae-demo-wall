const dashboardPage = {
  tasks: [],
  summary: null,
  score: null,

  async render() {
    const app = document.getElementById('app');
    const today = new Date();
    const weekday = ['日', '一', '二', '三', '四', '五', '六'][today.getDay()];
    const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 周${weekday}`;

    app.innerHTML = `
      <div class="page">
        <div class="welcome-card">
          <div class="greeting">\u{1F44B} 你好</div>
          <div class="username">今天是健康的一天</div>
          <div class="date-text">${dateStr}</div>
        </div>

        <div class="section">
          <div id="health-score-area">
            <div class="card" style="margin-top:0;">
              <div style="display:flex;align-items:center;gap:16px;">
                <div class="circle-progress" style="width:72px;height:72px;margin:0;flex-shrink:0;">
                  <svg width="72" height="72" viewBox="0 0 72 72" style="transform:rotate(-90deg);">
                    <circle fill="none" stroke="var(--border)" stroke-width="6" cx="36" cy="36" r="30"></circle>
                    <circle fill="none" stroke="var(--primary)" stroke-width="6" stroke-linecap="round" cx="36" cy="36" r="30" stroke-dasharray="188.5" stroke-dashoffset="188.5" id="score-circle"></circle>
                  </svg>
                  <div class="circle-text" style="font-size:16px;" id="score-text">--</div>
                </div>
                <div style="flex:1;">
                  <div style="font-size:16px;font-weight:600;color:var(--text);margin-bottom:4px;">健康评分</div>
                  <div style="font-size:13px;color:var(--text-secondary);" id="score-desc">加载中...</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">今日任务</div>
          <div id="dashboard-tasks">
            <div class="loading"><div class="loading-spinner"></div><div class="loading-text">加载中...</div></div>
          </div>
          <div id="task-progress" style="padding:0 16px;margin-top:8px;"></div>
        </div>

        <div class="section">
          <div class="section-title">健康概览</div>
          <div class="health-grid" id="dashboard-health">
            <div class="health-item">
              <div class="health-icon">\u{2696}</div>
              <div class="health-value" id="health-bmi">--</div>
              <div class="health-label">BMI</div>
            </div>
            <div class="health-item">
              <div class="health-icon">\u{1FA78}</div>
              <div class="health-value" id="health-bp">--</div>
              <div class="health-label">血压</div>
            </div>
            <div class="health-item">
              <div class="health-icon">\u{1F948}</div>
              <div class="health-value" id="health-bs">--</div>
              <div class="health-label">血糖</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">快捷入口</div>
          <div class="quick-actions">
            <button class="quick-action" id="qa-analysis">
              <div class="action-icon">\u{1F4CB}</div>
              <div class="action-label">录入体检数据</div>
            </button>
            <button class="quick-action" id="qa-nutrition">
              <div class="action-icon">\u{1F372}</div>
              <div class="action-label">查看饮食推荐</div>
            </button>
            <button class="quick-action" id="qa-fitness">
              <div class="action-icon">\u{1F3C3}</div>
              <div class="action-label">查看运动教程</div>
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.loadTasks();
    await this.loadHealthSummary();
    await this.loadHealthScore();
  },

  bindEvents() {
    document.getElementById('qa-analysis')?.addEventListener('click', () => {
      window.location.hash = '#/analysis';
    });
    document.getElementById('qa-nutrition')?.addEventListener('click', () => {
      window.location.hash = '#/nutrition';
    });
    document.getElementById('qa-fitness')?.addEventListener('click', () => {
      window.location.hash = '#/fitness';
    });
  },

  async loadHealthScore() {
    const isGuest = localStorage.getItem('guestMode');
    if (isGuest) {
      this.updateScoreUI(null);
      return;
    }

    try {
      // Try analysis report API first, then fallback to achievements/score
      const result = await api.request('/analysis/report', { method: 'GET' });
      if (result.code === 0 && result.data) {
        this.score = result.data.score || 0;
        this.updateScoreUI(this.score);
      } else {
        const scoreResult = await api.getScore();
        if (scoreResult.code === 0 && scoreResult.data) {
          this.score = scoreResult.data.total_score || 0;
          this.updateScoreUI(this.score);
        } else {
          this.updateScoreUI(null);
        }
      }
    } catch (err) {
      this.updateScoreUI(null);
    }
  },

  updateScoreUI(score) {
    const circle = document.getElementById('score-circle');
    const text = document.getElementById('score-text');
    const desc = document.getElementById('score-desc');
    if (!circle || !text || !desc) return;

    if (score === null || score === undefined) {
      text.textContent = '--';
      desc.textContent = '录入体检数据获取评分';
      circle.style.strokeDashoffset = '188.5';
      return;
    }

    const s = Math.max(0, Math.min(100, parseInt(score) || 0));
    const circumference = 2 * Math.PI * 30;
    const offset = circumference - (s / 100) * circumference;
    const color = s >= 80 ? 'var(--success)' : (s >= 60 ? 'var(--accent)' : 'var(--danger)');
    const label = s >= 80 ? '健康状况良好' : (s >= 60 ? '健康状况一般' : '建议关注健康');

    circle.style.strokeDashoffset = offset;
    circle.style.stroke = color;
    text.textContent = s;
    text.style.color = color;
    desc.textContent = label;
  },

  async loadTasks() {
    const container = document.getElementById('dashboard-tasks');
    const progressContainer = document.getElementById('task-progress');
    if (!container) return;

    const isGuest = localStorage.getItem('guestMode');
    if (isGuest) {
      container.innerHTML = this.renderGuestTasks();
      this.renderTaskProgress();
      this.bindTaskEvents();
      return;
    }

    try {
      const result = await api.getTodayTasks();
      if (result.code === 0 && result.data) {
        this.tasks = Array.isArray(result.data) ? result.data : (result.data.tasks || []);
        container.innerHTML = this.renderTaskList();
        this.renderTaskProgress();
        this.bindTaskEvents();
      } else {
        container.innerHTML = this.renderGuestTasks();
        this.renderTaskProgress();
        this.bindTaskEvents();
      }
    } catch (err) {
      container.innerHTML = this.renderGuestTasks();
      this.renderTaskProgress();
      this.bindTaskEvents();
    }
  },

  renderTaskProgress() {
    const container = document.getElementById('task-progress');
    if (!container) return;

    const tasks = this.tasks.length > 0 ? this.tasks : this.getGuestTaskData();
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:13px;color:var(--text-secondary);">今日进度</span>
        <span style="font-size:13px;font-weight:600;color:var(--primary);">${percent}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${percent}%;"></div>
      </div>
      <div style="font-size:12px;color:var(--text-light);margin-top:4px;text-align:right;">已完成 ${completed}/${total}</div>
    `;
  },

  getGuestTaskData() {
    return [
      { id: 'g1', type: 'diet', content: '早餐：全麦面包 + 鸡蛋 + 牛奶', time: '08:00', completed: false },
      { id: 'g2', type: 'exercise', content: '午间散步 15分钟', time: '12:30', completed: false },
      { id: 'g3', type: 'water', content: '下午喝水 500ml', time: '15:00', completed: false },
      { id: 'g4', type: 'diet', content: '晚餐：清淡饮食，少油少盐', time: '18:30', completed: false },
      { id: 'g5', type: 'sleep', content: '23:00 前准备入睡', time: '23:00', completed: false },
    ];
  },

  async loadHealthSummary() {
    const isGuest = localStorage.getItem('guestMode');
    if (isGuest) {
      document.getElementById('health-bmi').textContent = '--';
      document.getElementById('health-bp').textContent = '--';
      document.getElementById('health-bs').textContent = '--';
      return;
    }

    try {
      const result = await api.getSummary();
      if (result.code === 0 && result.data) {
        const data = result.data;
        if (data.bmi) {
          const bmiEl = document.getElementById('health-bmi');
          bmiEl.textContent = data.bmi.toFixed(1);
          // BMI颜色指示
          if (data.bmi >= 28) bmiEl.style.color = 'var(--danger)';
          else if (data.bmi >= 24) bmiEl.style.color = 'var(--warning)';
          else if (data.bmi >= 18.5) bmiEl.style.color = 'var(--success)';
          else bmiEl.style.color = 'var(--primary)';
        } else {
          document.getElementById('health-bmi').textContent = '未录入';
          document.getElementById('health-bmi').style.fontSize = '13px';
        }
        if (data.bloodPressure) {
          document.getElementById('health-bp').textContent = data.bloodPressure;
        } else {
          document.getElementById('health-bp').textContent = '未录入';
          document.getElementById('health-bp').style.fontSize = '13px';
        }
        if (data.bloodSugar) {
          document.getElementById('health-bs').textContent = data.bloodSugar;
        } else {
          document.getElementById('health-bs').textContent = '未录入';
          document.getElementById('health-bs').style.fontSize = '13px';
        }
      } else {
        // API返回错误
        this.setHealthDefaults('加载失败');
      }
    } catch (err) {
      console.error('[Dashboard] 加载健康摘要失败:', err);
      this.setHealthDefaults('加载失败');
    }
  },

  setHealthDefaults(text) {
    const ids = ['health-bmi', 'health-bp', 'health-bs'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = text || '--';
        if (text && text !== '--') el.style.fontSize = '13px';
      }
    });
  },

  renderTaskList() {
    if (!this.tasks || this.tasks.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">\u{1F389}</div>
          <div class="empty-title">今天没有待办任务</div>
          <div class="empty-desc">去方案页面生成你的健康计划吧</div>
          <button class="btn btn-primary btn-sm" onclick="window.location.hash='#/plan'">查看方案</button>
        </div>
      `;
    }

    return this.tasks.map(task => {
      const icons = { diet: '\u{1F37D}', exercise: '\u{1F3C3}', sleep: '\u{1F634}', water: '\u{1F4A7}', other: '\u{1F4DD}' };
      const icon = icons[task.type] || icons.other;
      const statusCls = task.completed ? 'completed' : '';
      const statusText = task.completed ? '已完成' : '去完成';
      const btnCls = task.completed ? 'btn btn-sm btn-secondary task-status-btn' : 'btn btn-sm btn-primary task-status-btn';

      return `
        <div class="task-item ${statusCls}" data-task-id="${task.id || ''}" data-type="${task.type || ''}" data-completed="${task.completed ? 1 : 0}">
          <div class="task-icon">${icon}</div>
          <div class="task-info">
            <div class="task-content">${task.content || task.title || '任务'}</div>
            <div class="task-meta">${task.time || ''} ${task.type ? '\u{00B7} ' + this.getTypeName(task.type) : ''}</div>
          </div>
          <div class="task-action">
            <button class="${btnCls}" data-task-id="${task.id || ''}" data-completed="${task.completed ? 1 : 0}">
              ${statusText}
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  renderGuestTasks() {
    const guestTasks = this.getGuestTaskData();

    return guestTasks.map(task => {
      const icons = { diet: '\u{1F37D}', exercise: '\u{1F3C3}', sleep: '\u{1F634}', water: '\u{1F4A7}', other: '\u{1F4DD}' };
      const icon = icons[task.type] || icons.other;

      return `
        <div class="task-item" data-task-id="${task.id}" data-type="${task.type}" data-completed="0">
          <div class="task-icon">${icon}</div>
          <div class="task-info">
            <div class="task-content">${task.content}</div>
            <div class="task-meta">${task.time} \u{00B7} ${this.getTypeName(task.type)}</div>
          </div>
          <div class="task-action">
            <button class="btn btn-sm btn-primary task-status-btn" data-task-id="${task.id}" data-completed="0">去完成</button>
          </div>
        </div>
      `;
    }).join('');
  },

  getTypeName(type) {
    const names = { diet: '饮食', exercise: '运动', sleep: '睡眠', water: '饮水', other: '其他' };
    return names[type] || '其他';
  },

  bindTaskEvents() {
    document.querySelectorAll('.task-status-btn').forEach(btn => {
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
          showToast('任务完成！', 'success');
          this.renderTaskProgress();
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
            showToast('任务完成！', 'success');
            // Update local task state for progress bar
            const task = this.tasks.find(t => String(t.id) === String(taskId));
            if (task) task.completed = true;
            this.renderTaskProgress();
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
  }
};
