const app = {
  data: {
    currentUser: null,
    tasks: [],
    rewards: [],
    childPoints: 0,
    completedTasks: [],
    exchanges: [],
    approvals: [],
    requests: [],
    activities: [],
    badges: [
      { id: 'first_task', name: '初次挑战', icon: '&#128640;', desc: '完成第一个任务', unlocked: false },
      { id: 'three_tasks', name: '三连击', icon: '&#9889;', desc: '完成3个任务', unlocked: false },
      { id: 'five_tasks', name: '任务达人', icon: '&#127942;', desc: '完成5个任务', unlocked: false },
      { id: 'ten_points', name: '积分新手', icon: '&#128176;', desc: '累计获得10积分', unlocked: false },
      { id: 'fifty_points', name: '积分达人', icon: '&#128131;', desc: '累计获得50积分', unlocked: false },
      { id: 'first_reward', name: '首次兑换', icon: '&#127873;', desc: '第一次兑换奖励', unlocked: false },
      { id: 'helper', name: '求助小能手', icon: '&#129309;', desc: '请求一次协助', unlocked: false },
      { id: 'adjuster', name: '量力而行', icon: '&#128200;', desc: '申请降低难度', unlocked: false },
    ],
    quizScore: 0,
    currentQuizIndex: 0,
    wheelPrizes: [],
    wheelCost: 10,
    wheelSpinning: false
  },

  init() {
    this.loadData();
    this.initParticles();
    this.seedSampleData();
    this.renderAll();
  },

  loadData() {
    const saved = localStorage.getItem('taskPlanetData');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(this.data, parsed);
    }
    if (!this.data.wheelPrizes) this.data.wheelPrizes = [];
    if (typeof this.data.wheelCost !== 'number') this.data.wheelCost = 10;
    if (typeof this.data.wheelSpinning !== 'boolean') this.data.wheelSpinning = false;
  },

  saveData() {
    localStorage.setItem('taskPlanetData', JSON.stringify(this.data));
  },

  seedSampleData() {
    if (this.data.tasks.length === 0) {
      this.data.tasks = [
        { id: 1, name: '整理房间', category: 'housework', difficulty: 2, points: 10, allowNeedHelp: true, allowAdjust: true, createdAt: Date.now() },
        { id: 2, name: '阅读30分钟', category: 'reading', difficulty: 2, points: 15, allowNeedHelp: false, allowAdjust: true, createdAt: Date.now() },
        { id: 3, name: '练习钢琴', category: 'study', difficulty: 3, points: 20, allowNeedHelp: true, allowAdjust: true, createdAt: Date.now() },
        { id: 4, name: '散步30分钟', category: 'exercise', difficulty: 1, points: 8, allowNeedHelp: false, allowAdjust: true, createdAt: Date.now() },
        { id: 5, name: '洗碗', category: 'housework', difficulty: 2, points: 12, allowNeedHelp: true, allowAdjust: true, createdAt: Date.now() },
        { id: 6, name: '数学作业', category: 'study', difficulty: 3, points: 25, allowNeedHelp: true, allowAdjust: true, createdAt: Date.now() },
      ];
    }

    if (this.data.rewards.length === 0) {
      this.data.rewards = [
        { id: 1, name: '看一集动画片', category: 'screen', points: 30, stock: 99, createdAt: Date.now() },
        { id: 2, name: '买一个小玩具', category: 'toy', points: 50, stock: 10, createdAt: Date.now() },
        { id: 3, name: '去公园玩', category: 'activity', points: 40, stock: 99, createdAt: Date.now() },
        { id: 4, name: '吃冰淇淋', category: 'toy', points: 20, stock: 99, createdAt: Date.now() },
        { id: 5, name: '晚睡30分钟特权', category: 'privilege', points: 35, stock: 99, createdAt: Date.now() },
      ];
    }

    if (!this.data.wheelPrizes || this.data.wheelPrizes.length === 0) {
      this.data.wheelPrizes = [
        { id: 1, label: '+5 积分', type: 'points', value: 5, color: '#FF6B6B' },
        { id: 2, label: '+10 积分', type: 'points', value: 10, color: '#6C5CE7' },
        { id: 3, label: '+15 积分', type: 'points', value: 15, color: '#00B894' },
        { id: 4, label: '谢谢参与', type: 'none', value: 0, color: '#9B9BB5' },
        { id: 5, label: '+20 积分', type: 'points', value: 20, color: '#F9CA24' },
        { id: 6, label: '+8 积分', type: 'points', value: 8, color: '#0984E3' },
      ];
    }

    this.saveData();
  },

  login(role) {
    this.data.currentUser = role;
    this.saveData();
    this.showPage(`page-${role}`);
    this.renderAll();
    this.toast('success', `欢迎回来！`, role === 'parent' ? '家长端' : '孩子端');
  },

  goHome() {
    this.data.currentUser = null;
    this.saveData();
    this.showPage('page-home');
  },

  showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
  },

  switchTab(btn, role) {
    const tabId = btn.dataset.tab;
    btn.closest('.sidebar-tabs').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
  },

  showModal(id) {
    document.getElementById(id).classList.add('active');
  },

  closeModal(id) {
    document.getElementById(id).classList.remove('active');
  },

  toast(type, message, detail) {
    const container = document.querySelector('.toast-container') || this.createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-message">${message}</div>
      ${detail ? `<div class="toast-detail">${detail}</div>` : ''}
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  },

  renderAll() {
    if (!this.data.currentUser) return;
    if (this.data.currentUser === 'parent') {
      this.renderParentDashboard();
      this.renderTaskList();
      this.renderRewardList();
      this.renderWheelConfig();
      this.renderApprovals();
      this.renderRequests();
    } else {
      this.renderChildTasks();
      this.renderMall();
      this.renderAchievements();
      this.updateChildPoints();
    }
  },

  renderParentDashboard() {
    const total = this.data.tasks.length;
    const completed = this.data.completedTasks.length;
    const pending = total - completed;
    const totalPoints = this.data.completedTasks.reduce((sum, t) => sum + t.pointsEarned, 0);

    document.getElementById('stat-total-tasks').textContent = total;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-pending').textContent = Math.max(0, pending);
    document.getElementById('stat-points').textContent = totalPoints;

    const actDiv = document.getElementById('recent-activities');
    if (this.data.activities.length === 0) {
      actDiv.innerHTML = '<p class="empty-hint">暂无活动记录</p>';
    } else {
      actDiv.innerHTML = '<div class="activity-list">' +
        this.data.activities.slice(-5).reverse().map(a => `
          <div class="activity-item">
            <span>${a.message}</span>
            <span class="activity-time">${this.timeAgo(a.time)}</span>
          </div>
        `).join('') + '</div>';
    }

    this.drawChart();
  },

  drawChart() {
    const canvas = document.getElementById('task-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth * 2;
    const h = canvas.height = 400;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, w / 2, h / 2);

    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const values = days.map(() => Math.floor(Math.random() * 5) + 1);
    const max = Math.max(...values, 1);
    const barWidth = (w / 2 - 60) / days.length - 10;

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = 30 + (h / 2 - 60) * (1 - i / 4);
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(w / 2 - 10, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(max * i / 4), 35, y + 4);
    }

    values.forEach((v, i) => {
      const x = 50 + i * (barWidth + 10);
      const barH = (v / max) * (h / 2 - 70);
      const y = h / 2 - 30 - barH;

      const gradient = ctx.createLinearGradient(x, y, x, y + barH);
      gradient.addColorStop(0, '#6C5CE7');
      gradient.addColorStop(1, '#A29BFE');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, 4);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(days[i], x + barWidth / 2, h / 2 - 10);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(v, x + barWidth / 2, y - 6);
    });
  },

  renderTaskList() {
    const container = document.getElementById('task-list');
    if (this.data.tasks.length === 0) {
      container.innerHTML = '<p class="empty-hint">暂无任务，点击上方按钮添加</p>';
      return;
    }

    const categoryMap = {
      housework: '家务劳动', study: '学习任务', exercise: '运动锻炼',
      reading: '阅读学习', life: '生活自理', other: '其他'
    };

    container.innerHTML = '<div class="task-list">' + this.data.tasks.map(t => `
      <div class="task-card" id="task-${t.id}">
        <div class="task-info">
          <h4>${t.name}</h4>
          <div class="task-meta">
            <span class="task-category">${categoryMap[t.category] || t.category}</span>
            <span class="stars">${'★'.repeat(t.difficulty)}${'☆'.repeat(5 - t.difficulty)}</span>
            <span class="task-points">&#128176; ${t.points} 积分</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="btn-danger btn-small" onclick="app.deleteTask(${t.id})">删除</button>
        </div>
      </div>
    `).join('') + '</div>';
  },

  renderRewardList() {
    const container = document.getElementById('reward-list');
    if (this.data.rewards.length === 0) {
      container.innerHTML = '<p class="empty-hint">暂无奖励，点击上方按钮添加</p>';
      return;
    }

    const categoryMap = {
      screen: '屏幕时间', toy: '玩具零食', activity: '外出活动',
      privilege: '特殊权利', other: '其他'
    };

    container.innerHTML = '<div class="reward-list">' + this.data.rewards.map(r => `
      <div class="reward-card">
        <div class="reward-info">
          <h4>${r.name}</h4>
          <div class="reward-meta">
            <span class="task-category">${categoryMap[r.category] || r.category}</span>
            <span class="task-points">&#128176; ${r.points} 积分</span>
            <span class="reward-stock ${r.stock === 0 ? 'reward-out-of-stock' : ''}">库存: ${r.stock}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="btn-danger btn-small" onclick="app.deleteReward(${r.id})">删除</button>
        </div>
      </div>
    `).join('') + '</div>';
  },

  renderWheelConfig() {
    const container = document.getElementById('wheel-config-list');
    if (!container) return;

    if (!this.data.wheelPrizes || this.data.wheelPrizes.length === 0) {
      container.innerHTML = '<p class="empty-hint">暂无转盘奖励项，点击上方按钮添加</p>';
      return;
    }

    const typeMap = {
      points: '积分奖励',
      none: '谢谢参与',
      reward: '实物奖励'
    };

    container.innerHTML = '<div class="task-list">' + this.data.wheelPrizes.map(p => `
      <div class="reward-card">
        <div class="reward-info">
          <h4>
            <span class="wheel-color-dot" style="background:${p.color}"></span>
            ${p.label}
          </h4>
          <div class="reward-meta">
            <span class="task-category">${typeMap[p.type] || p.type}</span>
            ${p.type === 'points' ? `<span class="task-points">&#128176; ${p.value} 积分</span>` : ''}
            ${p.type === 'reward' ? `<span class="task-points">&#127873; ${p.value}</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="btn-danger btn-small" onclick="app.deleteWheelPrize(${p.id})">删除</button>
        </div>
      </div>
    `).join('') + '</div>';
  },

  renderApprovals() {
    const container = document.getElementById('approval-list');
    if (this.data.approvals.length === 0) {
      container.innerHTML = '<p class="empty-hint">暂无审批请求</p>';
      return;
    }

    container.innerHTML = '<div class="task-list">' + this.data.approvals.map(a => `
      <div class="approval-card">
        <div class="task-info">
          <h4>${a.taskName}</h4>
          <div class="task-meta">
            <span class="status-badge status-${a.status}">${a.status === 'pending' ? '待审核' : a.status === 'approved' ? '已通过' : '已拒绝'}</span>
            <span style="color:var(--text-muted);font-size:0.85rem">${a.reason}</span>
          </div>
        </div>
        ${a.status === 'pending' ? `
        <div class="task-actions">
          <button class="btn-success btn-small" onclick="app.handleApproval(${a.id}, 'approved')">通过</button>
          <button class="btn-danger btn-small" onclick="app.handleApproval(${a.id}, 'rejected')">拒绝</button>
        </div>` : ''}
      </div>
    `).join('') + '</div>';
  },

  renderRequests() {
    const container = document.getElementById('request-list');
    if (this.data.requests.length === 0) {
      container.innerHTML = '<p class="empty-hint">暂无协作请求</p>';
      return;
    }

    container.innerHTML = '<div class="task-list">' + this.data.requests.map(r => `
      <div class="request-card">
        <div class="task-info">
          <h4>${r.taskName}</h4>
          <div class="task-meta">
            <span class="status-badge status-${r.status}">${r.status === 'waiting' ? '等待中' : '已协助'}</span>
            <span style="color:var(--text-muted);font-size:0.85rem">${r.time}</span>
          </div>
        </div>
        ${r.status === 'waiting' ? `
        <div class="task-actions">
          <button class="btn-success btn-small" onclick="app.handleRequest(${r.id})">确认协助</button>
        </div>` : ''}
      </div>
    `).join('') + '</div>';
  },

  showAddTask() {
    document.getElementById('task-name').value = '';
    document.getElementById('task-points').value = '';
    document.getElementById('task-difficulty').value = 1;
    this.resetStars();
    this.showModal('modal-add-task');
  },

  addTask(e) {
    e.preventDefault();
    const task = {
      id: Date.now(),
      name: document.getElementById('task-name').value,
      category: document.getElementById('task-category').value,
      difficulty: parseInt(document.getElementById('task-difficulty').value),
      points: parseInt(document.getElementById('task-points').value),
      allowNeedHelp: document.getElementById('task-allowneedhelp').checked,
      allowAdjust: document.getElementById('task-allowadjust').checked,
      createdAt: Date.now()
    };

    this.data.tasks.push(task);
    this.addActivity(`添加了新任务"${task.name}"`);
    this.saveData();
    this.closeModal('modal-add-task');
    this.renderAll();
    this.toast('success', '任务添加成功！', task.name);
  },

  deleteTask(id) {
    if (!confirm('确定删除此任务？')) return;
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    this.saveData();
    this.renderAll();
    this.toast('info', '任务已删除');
  },

  showAddReward() {
    document.getElementById('reward-name').value = '';
    document.getElementById('reward-points').value = '';
    document.getElementById('reward-stock').value = 99;
    this.showModal('modal-add-reward');
  },

  addReward(e) {
    e.preventDefault();
    const reward = {
      id: Date.now(),
      name: document.getElementById('reward-name').value,
      category: document.getElementById('reward-category').value,
      points: parseInt(document.getElementById('reward-points').value),
      stock: parseInt(document.getElementById('reward-stock').value),
      createdAt: Date.now()
    };

    this.data.rewards.push(reward);
    this.addActivity(`添加了新奖励"${reward.name}"`);
    this.saveData();
    this.closeModal('modal-add-reward');
    this.renderAll();
    this.toast('success', '奖励添加成功！', reward.name);
  },

  deleteReward(id) {
    if (!confirm('确定删除此奖励？')) return;
    this.data.rewards = this.data.rewards.filter(r => r.id !== id);
    this.saveData();
    this.renderAll();
    this.toast('info', '奖励已删除');
  },

  showAddWheelPrize() {
    document.getElementById('wheel-prize-label').value = '';
    document.getElementById('wheel-prize-value').value = '';
    this.showModal('modal-add-wheel-prize');
  },

  addWheelPrize(e) {
    e.preventDefault();
    const type = document.getElementById('wheel-prize-type').value;
    const label = document.getElementById('wheel-prize-label').value;
    const value = parseInt(document.getElementById('wheel-prize-value').value) || 0;
    const color = document.getElementById('wheel-prize-color').value;

    const prize = {
      id: Date.now(),
      label,
      type,
      value: type === 'none' ? 0 : value,
      color
    };

    this.data.wheelPrizes.push(prize);
    this.addActivity(`配置了转盘奖励项"${label}"`);
    this.saveData();
    this.closeModal('modal-add-wheel-prize');
    this.renderAll();
    this.toast('success', '转盘奖励项添加成功！', label);
  },

  deleteWheelPrize(id) {
    if (!confirm('确定删除此转盘奖励项？')) return;
    this.data.wheelPrizes = this.data.wheelPrizes.filter(p => p.id !== id);
    this.saveData();
    this.renderAll();
    this.toast('info', '转盘奖励项已删除');
  },

  onWheelPrizeTypeChange() {
    const type = document.getElementById('wheel-prize-type').value;
    const valueGroup = document.getElementById('wheel-prize-value-group');
    if (type === 'none') {
      valueGroup.style.display = 'none';
    } else {
      valueGroup.style.display = 'block';
      const label = document.querySelector('#wheel-prize-value-group label');
      label.textContent = type === 'points' ? '积分数值' : '奖励名称';
      const input = document.getElementById('wheel-prize-value');
      if (type === 'points') {
        input.type = 'number';
        input.placeholder = '如：10';
      } else {
        input.type = 'text';
        input.placeholder = '如：看一集动画片';
      }
    }
  },

  handleApproval(id, status) {
    const approval = this.data.approvals.find(a => a.id === id);
    if (approval) {
      approval.status = status;
      this.addActivity(`审批了${status === 'approved' ? '通过' : '拒绝'}难度调整申请`);
      this.saveData();
      this.renderAll();
      this.toast(status === 'approved' ? 'success' : 'error', '审批完成', status === 'approved' ? '已同意难度调整' : '已拒绝申请');
    }
  },

  handleRequest(id) {
    const req = this.data.requests.find(r => r.id === id);
    if (req) {
      req.status = 'completed';
      this.data.childPoints += 5;
      this.addActivity('协助了孩子完成任务 (+5积分)');
      this.saveData();
      this.renderAll();
      this.toast('success', '协作完成！', '额外奖励5积分');
    }
  },

  updateChildPoints() {
    document.getElementById('child-points').textContent = this.data.childPoints;
  },

  renderChildTasks() {
    const container = document.getElementById('child-task-list');
    if (this.data.tasks.length === 0) {
      container.innerHTML = '<p class="empty-hint">暂无可用任务，请等待家长添加</p>';
      return;
    }

    const completedIds = this.data.completedTasks.map(t => t.taskId);
    const categoryMap = {
      housework: '家务劳动', study: '学习任务', exercise: '运动锻炼',
      reading: '阅读学习', life: '生活自理', other: '其他'
    };

    container.innerHTML = '<div class="task-list">' + this.data.tasks.map(t => {
      const isCompleted = completedIds.includes(t.id);
      return `
        <div class="task-card ${isCompleted ? 'completed-anim' : ''}" id="child-task-${t.id}">
          <div class="task-info">
            <h4>${t.name}</h4>
            <div class="task-meta">
              <span class="task-category">${categoryMap[t.category] || t.category}</span>
              <span class="stars">${'★'.repeat(t.difficulty)}${'☆'.repeat(5 - t.difficulty)}</span>
              <span class="task-points">&#128176; ${t.points} 积分</span>
              <span class="task-status ${isCompleted ? 'task-completed' : 'task-available'}">${isCompleted ? '已完成' : '可接取'}</span>
            </div>
            <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
              ${t.allowNeedHelp ? `<button class="btn-secondary btn-small" onclick="app.requestHelp(${t.id}, '${t.name}')">&#129309; 请求协助</button>` : ''}
              ${t.allowAdjust ? `<button class="btn-secondary btn-small" onclick="app.requestAdjust(${t.id}, '${t.name}')">&#128200; 申请降难</button>` : ''}
            </div>
          </div>
          <div class="task-actions">
            ${!isCompleted ? `<button class="btn-primary btn-small" onclick="completeTask(${t.id}, '${t.name}', ${t.points})">&#10003; 完成任务</button>` : ''}
          </div>
        </div>
      `;
    }).join('') + '</div>';
  },

  renderMall() {
    const container = document.getElementById('mall-list');
    if (this.data.rewards.length === 0) {
      container.innerHTML = '<p class="empty-hint">暂无可用奖励</p>';
      return;
    }

    container.innerHTML = '<div class="mall-list">' + this.data.rewards.map(r => {
      const canAfford = this.data.childPoints >= r.points && r.stock > 0;
      return `
        <div class="mall-card">
          <div class="reward-info">
            <h4>${r.name}</h4>
            <div class="reward-meta">
              <span class="task-category">${r.category}</span>
              <span class="task-points">&#128176; ${r.points} 积分</span>
              <span class="reward-stock ${r.stock === 0 ? 'reward-out-of-stock' : ''}">库存: ${r.stock}</span>
            </div>
          </div>
          <div class="task-actions">
            ${r.stock > 0 ? `
              <button class="${canAfford ? 'btn-primary' : 'btn-secondary'} btn-small"
                onclick="${canAfford ? `app.exchangeReward(${r.id}, '${r.name}', ${r.points})` : ''}"
                ${!canAfford ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
                ${canAfford ? '&#128722; 立即兑换' : '积分不足'}
              </button>
            ` : '<span class="status-badge status-rejected">已售罄</span>'}
          </div>
        </div>
      `;
    }).join('') + '</div>';
  },

  exchangeReward(rewardId, rewardName, points) {
    const reward = this.data.rewards.find(r => r.id === rewardId);
    if (!reward || reward.stock <= 0) {
      this.toast('error', '兑换失败', '该奖励已售罄');
      return;
    }

    if (this.data.childPoints < points) {
      this.toast('error', '积分不足', `需要 ${points} 积分，你只有 ${this.data.childPoints} 积分`);
      return;
    }

    this.data.childPoints -= points;
    reward.stock--;
    this.data.exchanges.push({
      rewardId,
      rewardName,
      points,
      time: Date.now()
    });
    this.addActivity(`兑换了"${rewardName}"，消耗 ${points} 积分`);
    this.checkBadges();
    this.saveData();
    this.renderAll();
    this.toast('reward', '兑换成功！&#127873;', rewardName);
  },

  renderAchievements() {
    const completedCount = this.data.completedTasks.length;
    const totalPoints = this.data.completedTasks.reduce((s, t) => s + t.pointsEarned, 0);

    document.getElementById('ach-total-completed').textContent = completedCount;
    document.getElementById('ach-total-points').textContent = totalPoints;

    const streak = this.calculateStreak();
    document.getElementById('ach-streak').textContent = streak;

    const badgeContainer = document.getElementById('badge-list');
    badgeContainer.innerHTML = this.data.badges.map(b => `
      <div class="badge-item ${b.unlocked ? 'unlocked' : 'locked'}">
        <div class="badge-icon">${b.icon}</div>
        <div class="badge-name">${b.name}</div>
      </div>
    `).join('');
  },

  calculateStreak() {
    if (this.data.completedTasks.length === 0) return 0;
    return Math.min(7, Math.ceil(this.data.completedTasks.length / 3));
  },

  checkBadges() {
    const completedCount = this.data.completedTasks.length;
    const totalPoints = this.data.completedTasks.reduce((s, t) => s + t.pointsEarned, 0);

    this.data.badges.forEach(b => {
      if (b.unlocked) return;
      let unlock = false;
      if (b.id === 'first_task' && completedCount >= 1) unlock = true;
      if (b.id === 'three_tasks' && completedCount >= 3) unlock = true;
      if (b.id === 'five_tasks' && completedCount >= 5) unlock = true;
      if (b.id === 'ten_points' && totalPoints >= 10) unlock = true;
      if (b.id === 'fifty_points' && totalPoints >= 50) unlock = true;
      if (b.id === 'first_reward' && this.data.exchanges.length >= 1) unlock = true;

      if (unlock) {
        b.unlocked = true;
        this.toast('reward', '获得徽章！&#127942;', `${b.icon} ${b.name} - ${b.desc}`);
      }
    });
  },

  requestHelp(taskId, taskName) {
    this.data.requests.push({
      id: Date.now(),
      taskId,
      taskName,
      status: 'waiting',
      time: new Date().toLocaleString('zh-CN')
    });
    this.addActivity(`发起了对"${taskName}"的协作请求`);
    this.saveData();
    this.toast('info', '协作请求已发送', '等待家长确认');
  },

  requestAdjust(taskId, taskName) {
    this.data.approvals.push({
      id: Date.now(),
      taskId,
      taskName,
      status: 'pending',
      reason: '任务难度太高，申请降低',
      time: Date.now()
    });
    this.addActivity(`申请了"${taskName}"的难度调整`);
    this.saveData();
    this.toast('info', '难度调整申请已提交', '等待家长审批');
  },

  // ===== Wheel (转盘) =====
  spinWheel() {
    if (this.data.childPoints < this.data.wheelCost) {
      this.toast('error', '积分不足', `需要${this.data.wheelCost}积分才能抽奖`);
      return;
    }

    if (!this.data.wheelPrizes || this.data.wheelPrizes.length < 2) {
      this.toast('error', '转盘未配置', '请让家长先配置至少2个奖励项');
      return;
    }

    if (this.data.wheelSpinning) return;

    this.data.childPoints -= this.data.wheelCost;
    this.saveData();
    this.updateChildPoints();

    const prizes = this.data.wheelPrizes;
    const winIndex = Math.floor(Math.random() * prizes.length);
    const winPrize = prizes[winIndex];

    const content = document.getElementById('game-content');
    content.innerHTML = `
      <h3>&#127918; 积分大转盘</h3>
      <p style="color:var(--text-muted);margin:8px 0 16px">消耗 ${this.data.wheelCost} 积分，转动转盘赢取奖励！</p>
      <div class="wheel-wrapper">
        <div class="wheel-pointer">&#9660;</div>
        <canvas id="wheel-canvas" width="320" height="320"></canvas>
      </div>
      <div id="wheel-result" style="display:none;margin-top:16px;text-align:center">
        <div style="font-size:48px;margin:12px 0" id="wheel-result-icon"></div>
        <h2 id="wheel-result-text" style="margin-bottom:8px"></h2>
        <p id="wheel-result-detail" style="margin-bottom:20px"></p>
        <button class="btn-primary" onclick="app.closeGameOverlay()">确定</button>
      </div>
      <div id="wheel-spin-area" style="text-align:center;margin-top:16px">
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:12px" id="wheel-status">点击下方按钮开始旋转</p>
        <button class="btn-game" id="btn-spin" onclick="app.startWheelSpin(${winIndex})">&#127918; 开始旋转</button>
      </div>
    `;
    document.getElementById('game-overlay').classList.add('active');

    this.drawWheel(0);
  },

  drawWheel(rotation) {
    const canvas = document.getElementById('wheel-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.max(10, cx - 10);
    const prizes = this.data.wheelPrizes;
    const segCount = prizes.length;
    const segAngle = (Math.PI * 2) / segCount;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    prizes.forEach((prize, i) => {
      const startAngle = i * segAngle + rotation - Math.PI / 2;
      const endAngle = startAngle + segAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + segAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
      let text = prize.label;
      if (text.length > 8) text = text.substring(0, 7) + '…';
      ctx.fillText(text, radius - 16, 5);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#1A1A2E';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#F9CA24';
    ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GO', cx, cy);
  },

  startWheelSpin(winIndex) {
    if (this.data.wheelSpinning) return;
    this.data.wheelSpinning = true;

    const btn = document.getElementById('btn-spin');
    const status = document.getElementById('wheel-status');
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
    status.textContent = '转盘旋转中...';

    const prizes = this.data.wheelPrizes;
    const segCount = prizes.length;
    const segAngle = (Math.PI * 2) / segCount;

    const targetAngle = -(winIndex * segAngle + segAngle / 2);
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const totalRotation = targetAngle + Math.PI * 2 * extraSpins;

    const duration = 4000;
    const startTime = performance.now();
    const startRotation = 0;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + (totalRotation - startRotation) * eased;
      this.drawWheel(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.onWheelStop(winIndex);
      }
    };

    requestAnimationFrame(animate);
  },

  onWheelStop(winIndex) {
    this.data.wheelSpinning = false;
    const prize = this.data.wheelPrizes[winIndex];

    document.getElementById('wheel-spin-area').style.display = 'none';
    const resultDiv = document.getElementById('wheel-result');
    resultDiv.style.display = 'block';

    const iconEl = document.getElementById('wheel-result-icon');
    const textEl = document.getElementById('wheel-result-text');
    const detailEl = document.getElementById('wheel-result-detail');

    if (prize.type === 'points' && prize.value > 0) {
      this.data.childPoints += prize.value;
      this.saveData();
      this.updateChildPoints();
      this.addActivity(`转盘抽奖获得 ${prize.value} 积分`);
      iconEl.innerHTML = '&#127881;';
      textEl.textContent = prize.label;
      textEl.style.color = prize.color;
      detailEl.textContent = `恭喜！获得 ${prize.value} 积分！`;
      detailEl.style.color = 'var(--green)';
      this.showConfetti();
    } else if (prize.type === 'reward') {
      this.data.exchanges.push({
        rewardId: 0,
        rewardName: prize.value,
        points: 0,
        time: Date.now(),
        source: 'wheel'
      });
      this.addActivity(`转盘抽奖获得奖励"${prize.value}"`);
      this.saveData();
      iconEl.innerHTML = '&#127873;';
      textEl.textContent = prize.label;
      textEl.style.color = prize.color;
      detailEl.textContent = `恭喜！获得奖励：${prize.value}`;
      detailEl.style.color = 'var(--gold)';
      this.showConfetti();
    } else {
      this.addActivity('转盘抽奖未中奖');
      iconEl.innerHTML = '&#128540;';
      textEl.textContent = prize.label;
      textEl.style.color = prize.color;
      detailEl.textContent = '下次运气会更好哦！';
      detailEl.style.color = 'var(--text-muted)';
    }
  },

  // ===== Quiz =====
  startQuiz() {
    const questions = [
      { q: '1 + 1 = ?', options: ['1', '2', '3', '22'], correct: 1 },
      { q: '太阳从哪边升起？', options: ['东边', '西边', '南边', '北边'], correct: 0 },
      { q: '一年有几个月？', options: ['10', '11', '12', '13'], correct: 2 },
      { q: '5 + 3 = ?', options: ['6', '7', '8', '9'], correct: 2 },
      { q: '水的化学式是？', options: ['CO2', 'H2O', 'O2', 'NaCl'], correct: 1 },
    ];

    this.data.currentQuizIndex = 0;
    this.data.quizScore = 0;
    this.showQuizQuestion(questions);
  },

  showQuizQuestion(questions) {
    const q = questions[this.data.currentQuizIndex];
    const content = document.getElementById('game-content');
    content.innerHTML = `
      <h3>&#9889; 速答挑战</h3>
      <p style="color:var(--text-muted);margin:8px 0">第 ${this.data.currentQuizIndex + 1}/${questions.length} 题</p>
      <div class="quiz-question">${q.q}</div>
      <div class="quiz-options">
        ${q.options.map((opt, i) => `
          <button class="quiz-option" onclick="app.answerQuiz(${i}, ${q.correct})">${opt}</button>
        `).join('')}
      </div>
    `;
    document.getElementById('game-overlay').classList.add('active');
  },

  answerQuiz(selected, correct) {
    const options = document.querySelectorAll('.quiz-option');
    options.forEach((opt, i) => {
      opt.disabled = true;
      if (i === correct) opt.classList.add('correct');
      if (i === selected && i !== correct) opt.classList.add('wrong');
    });

    if (selected === correct) {
      this.data.quizScore++;
    }

    setTimeout(() => {
      this.data.currentQuizIndex++;
      const questions = [
        { q: '1 + 1 = ?', options: ['1', '2', '3', '22'], correct: 1 },
        { q: '太阳从哪边升起？', options: ['东边', '西边', '南边', '北边'], correct: 0 },
        { q: '一年有几个月？', options: ['10', '11', '12', '13'], correct: 2 },
        { q: '5 + 3 = ?', options: ['6', '7', '8', '9'], correct: 2 },
        { q: '水的化学式是？', options: ['CO2', 'H2O', 'O2', 'NaCl'], correct: 1 },
      ];

      if (this.data.currentQuizIndex < questions.length) {
        this.showQuizQuestion(questions);
      } else {
        this.finishQuiz();
      }
    }, 1000);
  },

  finishQuiz() {
    const points = this.data.quizScore * 5;
    this.data.childPoints += points;
    this.saveData();
    this.updateChildPoints();

    const content = document.getElementById('game-content');
    content.innerHTML = `
      <h3>&#9889; 速答挑战结束</h3>
      <div style="font-size:72px;margin:24px 0">${this.data.quizScore >= 4 ? '&#127881;' : this.data.quizScore >= 2 ? '&#128519;' : '&#128542;'}</div>
      <h2 style="margin-bottom:8px">${this.data.quizScore}/5 正确</h2>
      <p style="color:var(--gold);font-size:1.2rem;margin-bottom:20px">获得 ${points} 积分！</p>
      <button class="btn-primary" onclick="app.closeGameOverlay()">确定</button>
    `;

    if (points > 0) this.showConfetti();
  },

  closeGameOverlay() {
    document.getElementById('game-overlay').classList.remove('active');
  },

  // ===== Helpers =====
  setStarRating(el) {
    const value = parseInt(el.dataset.value);
    document.getElementById('task-difficulty').value = value;
    el.parentElement.querySelectorAll('.star').forEach((s, i) => {
      s.classList.toggle('active', i < value);
    });
  },

  resetStars() {
    document.querySelectorAll('#task-star-rating .star').forEach(s => s.classList.remove('active'));
    document.getElementById('task-difficulty').value = 1;
  },

  addActivity(message) {
    this.data.activities.push({
      message,
      time: Date.now()
    });
  },

  timeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  },

  showConfetti() {
    const colors = ['#6C5CE7', '#FF6B6B', '#F9CA24', '#00B894', '#0984E3'];
    for (let i = 0; i < 30; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.top = Math.random() * 50 + 50 + 'vh';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      piece.style.animationDuration = (Math.random() * 1 + 1) + 's';
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 2000);
    }
  },

  initParticles() {
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.4 + 0.1;
        const colors = ['108,92,231', '255,107,107', '0,184,148'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color},${this.opacity})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < 40; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(animate);
    }
    animate();
  }
};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

// ===== 完成任务的快捷函数 =====
function completeTask(taskId, taskName, basePoints) {
  const modal = document.getElementById('modal-complete-task');
  document.getElementById('complete-task-name').value = taskName;

  const submitBtn = document.getElementById('btn-confirm-complete');
  submitBtn.onclick = function() {
    const quality = parseFloat(document.getElementById('complete-quality').value);
    const pointsEarned = Math.round(basePoints * quality);

    app.data.completedTasks.push({
      taskId,
      taskName,
      pointsEarned,
      quality,
      time: Date.now()
    });

    app.data.childPoints += pointsEarned;
    app.addActivity(`完成了"${taskName}"，获得 ${pointsEarned} 积分`);
    app.checkBadges();
    app.saveData();
    app.closeModal('modal-complete-task');
    app.renderAll();
    app.showConfetti();
    app.toast('reward', '任务完成！🎉', `获得 ${pointsEarned} 积分`);
  };

  app.showModal('modal-complete-task');
}
