/**
 * 数据统计看板模块
 */
window.DashboardModule = {
  render() {
    const stats = (window.AppData && window.AppData.stats) || {};
    const container = document.createElement('div');
    container.className = 'space-y-6';

    // 头部
    const header = document.createElement('div');
    header.innerHTML = `
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <i data-lucide="bar-chart-3" class="w-7 h-7 text-sky-500"></i>
        数据统计看板
      </h2>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">实时了解使用数据与效率提升</p>
    `;
    container.appendChild(header);

    // KPI卡片
    const kpiData = [
      { key: 'totalDuration', label: '总时长', unit: '小时', icon: 'clock', color: 'sky' },
      { key: 'totalWords', label: '总字数', unit: '万字', icon: 'type', color: 'indigo' },
      { key: 'totalRecords', label: '总记录数', unit: '条', icon: 'file-text', color: 'emerald' },
      { key: 'timeSaved', label: '节省时间', unit: '小时', icon: 'zap', color: 'amber' },
      { key: 'languages', label: '支持语言', unit: '种', icon: 'globe', color: 'violet' },
      { key: 'accuracy', label: '准确率', unit: '%', icon: 'target', color: 'rose' }
    ];

    const kpiGrid = document.createElement('div');
    kpiGrid.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4';
    kpiGrid.innerHTML = kpiData.map(kpi => {
      const value = stats[kpi.key] || 0;
      return `
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-${kpi.color}-100 dark:bg-${kpi.color}-900/30 flex items-center justify-center text-${kpi.color}-600 dark:text-${kpi.color}-400">
              <i data-lucide="${kpi.icon}" class="w-4 h-4"></i>
            </div>
            <span class="text-xs text-slate-500 dark:text-slate-400">${kpi.label}</span>
          </div>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">${value}</p>
          <p class="text-xs text-slate-400 dark:text-slate-500">${kpi.unit}</p>
        </div>
      `;
    }).join('');
    container.appendChild(kpiGrid);

    // 图表区域
    const chartsGrid = document.createElement('div');
    chartsGrid.className = 'grid grid-cols-1 lg:grid-cols-2 gap-6';

    // 柱状图：效率对比
    const barChartWrap = document.createElement('div');
    barChartWrap.className = 'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5';
    barChartWrap.innerHTML = `
      <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <i data-lucide="bar-chart-2" class="w-4 h-4 text-sky-500"></i>
        效率对比（分钟/千字）
      </h3>
      <div class="relative h-64">
        <canvas id="efficiency-bar-chart"></canvas>
      </div>
    `;
    chartsGrid.appendChild(barChartWrap);

    // 饼图：场景使用频率
    const pieChartWrap = document.createElement('div');
    pieChartWrap.className = 'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5';
    pieChartWrap.innerHTML = `
      <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <i data-lucide="pie-chart" class="w-4 h-4 text-sky-500"></i>
        场景使用频率
      </h3>
      <div class="relative h-64 flex items-center justify-center">
        <canvas id="scene-pie-chart"></canvas>
      </div>
    `;
    chartsGrid.appendChild(pieChartWrap);

    container.appendChild(chartsGrid);

    // 最近活动
    const activitySection = document.createElement('div');
    activitySection.className = 'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5';
    activitySection.innerHTML = `
      <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <i data-lucide="activity" class="w-4 h-4 text-sky-500"></i>
        最近活动
      </h3>
      <div class="space-y-3">
        ${(stats.recentActivities || [
          { action: '完成会议转写', time: '10分钟前', detail: '产品周会 - 3人参与' },
          { action: '导出PDF报告', time: '1小时前', detail: '项目评审记录' },
          { action: '创建团队', time: '3小时前', detail: '研发团队' },
          { action: '安装插件', time: '昨天', detail: '智能摘要插件' }
        ]).map(act => `
          <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
            <div class="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <i data-lucide="check" class="w-4 h-4"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-900 dark:text-white">${act.action}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">${act.detail}</p>
            </div>
            <span class="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">${act.time}</span>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(activitySection);

    return container;
  },

  init() {
    // 初始化 Chart.js 图表
    this.initBarChart();
    this.initPieChart();
  },

  initBarChart() {
    const canvas = document.getElementById('efficiency-bar-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['人工速记', '普通转写', '声纹智转'],
        datasets: [{
          label: '耗时（分钟/千字）',
          data: [45, 12, 3],
          backgroundColor: [
            'rgba(148, 163, 184, 0.7)',
            'rgba(56, 189, 248, 0.7)',
            'rgba(16, 185, 129, 0.7)'
          ],
          borderColor: [
            'rgb(148, 163, 184)',
            'rgb(56, 189, 248)',
            'rgb(16, 185, 129)'
          ],
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { color: 'rgb(148, 163, 184)' }
          },
          x: {
            grid: { display: false },
            ticks: { color: 'rgb(148, 163, 184)' }
          }
        }
      }
    });
  },

  initPieChart() {
    const canvas = document.getElementById('scene-pie-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['会议', '课堂', '访谈', '医疗', '法庭', '跨国交流'],
        datasets: [{
          data: [35, 25, 15, 10, 8, 7],
          backgroundColor: [
            'rgba(56, 189, 248, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(244, 63, 94, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(99, 102, 241, 0.8)'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: 'rgb(148, 163, 184)', padding: 16, font: { size: 12 } }
          }
        },
        cutout: '60%'
      }
    });
  }
};
