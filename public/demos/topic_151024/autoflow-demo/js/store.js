/**
 * AutoFlow — 状态管理
 */
const Store = {
  state: {
    route: 'landing',
    tasks: [],
    stats: {
      timeSaved: 0,
      tasksExecuted: 0,
      activeFlows: 0,
      weeklyTrend: [3, 5, 2, 8, 6, 9, 4],
    },
    currentInput: '',
    currentParsed: null,
    isExecuting: false,
  },

  // 初始化一些示例任务
  init() {
    const now = Date.now();
    this.state.tasks = [
      {
        id: 't1', scenarioId: 'data-export', name: '每日销售数据自动导出与汇报',
        input: '每天早上9点从OA系统导出昨日销售数据，整理成Excel发到部门群',
        icon: '📊', status: 'success', createdAt: now - 3600000 * 2,
        trigger: '定时触发 · 每日 09:00',
        steps: Scenarios.dataExport.parsed.steps,
        result: Scenarios.dataExport.result,
      },
      {
        id: 't2', scenarioId: 'info-collect', name: '竞品价格定期采集与对比分析',
        input: '每周五下午从竞品网站采集价格信息，生成对比报告',
        icon: '🔍', status: 'running', createdAt: now - 3600000 * 8,
        trigger: '定时触发 · 每周五 15:00',
        steps: Scenarios.infoCollect.parsed.steps,
        result: null,
      },
      {
        id: 't3', scenarioId: 'file-process', name: '下载文件夹图片自动归档',
        input: '把下载文件夹里的图片按日期分类，压缩后上传到云盘',
        icon: '📁', status: 'success', createdAt: now - 3600000 * 24,
        trigger: '手动触发 · 立即执行',
        steps: Scenarios.fileProcess.parsed.steps,
        result: Scenarios.fileProcess.result,
      },
      {
        id: 't4', scenarioId: 'form-fill', name: '月度报销单自动填写',
        input: '自动填写月度报销单，金额从消费记录中统计',
        icon: '✍️', status: 'pending', createdAt: now - 3600000 * 48,
        trigger: '手动触发 · 每月末',
        steps: Scenarios.formFill.parsed.steps,
        result: null,
      },
    ];
    this.state.stats.timeSaved = 32.5;
    this.state.stats.tasksExecuted = 147;
    this.state.stats.activeFlows = 4;
  },

  // 路由
  setRoute(route) {
    this.state.route = route;
    window.location.hash = route;
  },

  // 任务操作
  addTask(task) {
    this.state.tasks.unshift(task);
    this.state.stats.tasksExecuted++;
    if (task.status === 'success') {
      this.state.stats.activeFlows++;
    }
  },

  updateTask(id, updates) {
    const task = this.state.tasks.find(t => t.id === id);
    if (task) Object.assign(task, updates);
  },

  getTask(id) {
    return this.state.tasks.find(t => t.id === id);
  },

  getTasks(filter) {
    if (!filter || filter === 'all') return this.state.tasks;
    return this.state.tasks.filter(t => t.status === filter);
  },

  // 格式化时间
  formatTime(timestamp) {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    const mins = Math.floor(diff / 60000);
    if (mins > 0) return `${mins}分钟前`;
    return '刚刚';
  },

  // Toast 通知
  toast(msg, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },
};
