// ===========================================================
// MammoSentry · 主应用
// ===========================================================

const APP = {
  route: 'dashboard',
  charts: {},

  init() {
    this.setupRouter();
    this.startClock();
    this.highlightNav();
    // 初始化 Lucide 图标
    if (window.lucide) window.lucide.createIcons();
  },

  // === 路由 ===
  setupRouter() {
    const handle = () => {
      const hash = window.location.hash || '#/dashboard';
      const route = hash.replace('#/', '').split('/')[0] || 'dashboard';
      this.route = route;
      this.render();
      this.highlightNav();
      // 滚动到顶
      document.getElementById('page-root').scrollTop = 0;
      // 重置图表实例
      Object.values(this.charts).forEach(c => c && c.dispose && c.dispose());
      this.charts = {};
    };
    window.addEventListener('hashchange', handle);
    handle();
  },

  highlightNav() {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.route === this.route);
    });
  },

  startClock() {
    const update = () => {
      const el = document.getElementById('topbar-time');
      if (!el) return;
      const d = new Date();
      const pad = n => String(n).padStart(2, '0');
      el.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    update();
    setInterval(update, 1000);
  },

  // === 渲染入口 ===
  render() {
    const root = document.getElementById('page-root');
    const section = document.getElementById('crumb-section');
    const page = document.getElementById('crumb-page');

    const map = {
      dashboard: { render: renderDashboard, section: '系统', page: '工作台' },
      analysis: { render: renderAnalysis, section: '诊断', page: '影像分析' },
      results: { render: renderResults, section: '诊断', page: '检测结果' },
      models: { render: renderModels, section: '研究', page: '模型中心' },
      dataset: { render: renderDataset, section: '研究', page: '数据集' },
    };
    const m = map[this.route] || map.dashboard;
    section.textContent = m.section;
    page.textContent = m.page;
    root.innerHTML = m.render();
    if (window.lucide) window.lucide.createIcons();
    // 图表初始化
    setTimeout(() => this.initCharts(), 50);
  },

  // === 图表初始化 ===
  initCharts() {
    if (this.route === 'dashboard') {
      this.chartSparkline();
      this.chartMiniROC();
      this.chartThroughput();
    } else if (this.route === 'models') {
      this.chartTrainingCurves();
      this.chartRocCurve();
      this.chartConfusion();
    } else if (this.route === 'dataset') {
      this.chartLesionPie();
      this.chartAgeBar();
      this.chartSourceDonut();
    }
  },

  // ---------- 图表: 仪表盘 ----------
  chartSparkline() {
    const el = document.getElementById('chart-spark-1');
    if (!el) return;
    this.charts.spark1 = echarts.init(el, null, { renderer: 'svg' });
    this.charts.spark1.setOption({
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      xAxis: { type: 'category', show: false, data: Array.from({ length: 24 }, (_, i) => i) },
      yAxis: { type: 'value', show: false, min: 'dataMin', max: 'dataMax' },
      series: [{
        type: 'line', smooth: true, symbol: 'none',
        lineStyle: { color: '#00E5E5', width: 1.5 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 229, 229, 0.3)' },
            { offset: 1, color: 'rgba(0, 229, 229, 0)' },
          ])
        },
        data: [12, 18, 25, 21, 30, 28, 35, 42, 38, 45, 52, 48, 55, 62, 58, 65, 72, 68, 75, 82, 78, 85, 92, 88]
      }]
    });
  },

  chartMiniROC() {
    const el = document.getElementById('chart-mini-roc');
    if (!el) return;
    this.charts.miniRoc = echarts.init(el, null, { renderer: 'svg' });
    this.charts.miniRoc.setOption({
      grid: { left: 30, right: 12, top: 12, bottom: 24 },
      xAxis: {
        type: 'value', min: 0, max: 1, name: 'FPR', nameLocation: 'middle', nameGap: 14,
        nameTextStyle: { color: '#7A8499', fontSize: 9, fontFamily: 'JetBrains Mono' },
        axisLine: { lineStyle: { color: '#1F2940' } },
        axisLabel: { color: '#7A8499', fontSize: 9, fontFamily: 'JetBrains Mono' },
        splitLine: { lineStyle: { color: '#1F2940', type: 'dashed' } },
      },
      yAxis: {
        type: 'value', min: 0, max: 1, name: 'TPR', nameLocation: 'middle', nameGap: 18,
        nameTextStyle: { color: '#7A8499', fontSize: 9, fontFamily: 'JetBrains Mono' },
        axisLine: { lineStyle: { color: '#1F2940' } },
        axisLabel: { color: '#7A8499', fontSize: 9, fontFamily: 'JetBrains Mono' },
        splitLine: { lineStyle: { color: '#1F2940', type: 'dashed' } },
      },
      series: [
        {
          type: 'line', smooth: true, symbol: 'none',
          lineStyle: { color: '#00E5E5', width: 2 },
          data: Array.from({ length: 50 }, (_, i) => {
            const x = i / 49;
            const y = 1 - Math.pow(1 - x, 2.3);
            return [x, y];
          }),
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 229, 229, 0.18)' },
              { offset: 1, color: 'rgba(0, 229, 229, 0)' },
            ])
          }
        },
        {
          type: 'line', symbol: 'none',
          lineStyle: { color: '#2E3A5C', type: 'dashed', width: 1 },
          data: [[0, 0], [1, 1]],
        }
      ]
    });
  },

  chartThroughput() {
    const el = document.getElementById('chart-throughput');
    if (!el) return;
    this.charts.throughput = echarts.init(el, null, { renderer: 'svg' });
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    this.charts.throughput.setOption({
      grid: { left: 32, right: 16, top: 16, bottom: 24 },
      tooltip: { trigger: 'axis', backgroundColor: '#0E1320', borderColor: '#2E3A5C', textStyle: { color: '#E8ECF4', fontSize: 11 } },
      xAxis: {
        type: 'category', data: hours,
        axisLine: { lineStyle: { color: '#1F2940' } },
        axisLabel: { color: '#7A8499', fontSize: 9, fontFamily: 'JetBrains Mono', interval: 3 },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#1F2940' } },
        axisLabel: { color: '#7A8499', fontSize: 9, fontFamily: 'JetBrains Mono' },
        splitLine: { lineStyle: { color: '#1F2940', type: 'dashed' } },
      },
      series: [{
        type: 'bar', barWidth: 8,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#00E5E5' },
            { offset: 1, color: 'rgba(0, 229, 229, 0.2)' },
          ]),
          borderRadius: [2, 2, 0, 0],
        },
        data: [12, 8, 5, 3, 2, 1, 4, 18, 32, 48, 56, 62, 68, 72, 64, 58, 52, 48, 42, 36, 28, 22, 18, 14],
      }]
    });
  },

  // ---------- 图表: 模型中心 ----------
  chartTrainingCurves() {
    const el = document.getElementById('chart-train-curves');
    if (!el) return;
    this.charts.train = echarts.init(el, null, { renderer: 'svg' });
    const epochs = MODEL_METRICS.trainLoss.map((_, i) => i + 1);
    this.charts.train.setOption({
      grid: { left: 50, right: 24, top: 36, bottom: 36 },
      legend: {
        top: 0, right: 0, textStyle: { color: '#E8ECF4', fontSize: 11, fontFamily: 'JetBrains Mono' },
        itemWidth: 12, itemHeight: 4,
      },
      tooltip: { trigger: 'axis', backgroundColor: '#0E1320', borderColor: '#2E3A5C', textStyle: { color: '#E8ECF4', fontSize: 11 } },
      xAxis: {
        type: 'category', name: 'Epoch', nameLocation: 'middle', nameGap: 22,
        nameTextStyle: { color: '#7A8499', fontSize: 10, fontFamily: 'JetBrains Mono' },
        data: epochs,
        axisLine: { lineStyle: { color: '#1F2940' } },
        axisLabel: { color: '#7A8499', fontSize: 10, fontFamily: 'JetBrains Mono' },
        splitLine: { lineStyle: { color: '#1F2940', type: 'dashed' } },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#1F2940' } },
        axisLabel: { color: '#7A8499', fontSize: 10, fontFamily: 'JetBrains Mono' },
        splitLine: { lineStyle: { color: '#1F2940', type: 'dashed' } },
      },
      series: [
        {
          name: 'Train Loss', type: 'line', smooth: true, symbol: 'none',
          lineStyle: { color: '#00E5E5', width: 2 },
          data: MODEL_METRICS.trainLoss,
        },
        {
          name: 'Val Loss', type: 'line', smooth: true, symbol: 'none',
          lineStyle: { color: '#FF6B7A', width: 2, type: 'dashed' },
          data: MODEL_METRICS.valLoss,
        },
        {
          name: 'Train Acc', type: 'line', smooth: true, symbol: 'none',
          lineStyle: { color: '#5EE6A8', width: 2 },
          yAxisIndex: 0,
          data: MODEL_METRICS.trainAcc,
        },
        {
          name: 'Val Acc', type: 'line', smooth: true, symbol: 'none',
          lineStyle: { color: '#FFB84D', width: 2, type: 'dashed' },
          data: MODEL_METRICS.valAcc,
        },
      ]
    });
  },

  chartRocCurve() {
    const el = document.getElementById('chart-roc');
    if (!el) return;
    this.charts.roc = echarts.init(el, null, { renderer: 'svg' });
    const points = Array.from({ length: 100 }, (_, i) => {
      const x = i / 99;
      const y = 1 - Math.pow(1 - x, 2.6);
      return [x, y];
    });
    this.charts.roc.setOption({
      grid: { left: 50, right: 24, top: 36, bottom: 36 },
      title: {
        text: 'AUC = 0.954', right: 16, top: 8,
        textStyle: { color: '#00E5E5', fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 600 },
      },
      tooltip: { trigger: 'axis', backgroundColor: '#0E1320', borderColor: '#2E3A5C' },
      xAxis: {
        type: 'value', min: 0, max: 1, name: '1 - Specificity', nameLocation: 'middle', nameGap: 22,
        nameTextStyle: { color: '#7A8499', fontSize: 10, fontFamily: 'JetBrains Mono' },
        axisLine: { lineStyle: { color: '#1F2940' } },
        axisLabel: { color: '#7A8499', fontSize: 10, fontFamily: 'JetBrains Mono' },
        splitLine: { lineStyle: { color: '#1F2940', type: 'dashed' } },
      },
      yAxis: {
        type: 'value', min: 0, max: 1, name: 'Sensitivity', nameLocation: 'middle', nameGap: 38,
        nameTextStyle: { color: '#7A8499', fontSize: 10, fontFamily: 'JetBrains Mono' },
        axisLine: { lineStyle: { color: '#1F2940' } },
        axisLabel: { color: '#7A8499', fontSize: 10, fontFamily: 'JetBrains Mono' },
        splitLine: { lineStyle: { color: '#1F2940', type: 'dashed' } },
      },
      series: [
        { type: 'line', smooth: false, symbol: 'none', lineStyle: { color: '#00E5E5', width: 2.5 }, data: points,
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 229, 229, 0.25)' },
            { offset: 1, color: 'rgba(0, 229, 229, 0)' },
          ])}
        },
        { type: 'line', symbol: 'none', lineStyle: { color: '#2E3A5C', type: 'dashed', width: 1 }, data: [[0, 0], [1, 1]] },
        { type: 'scatter', symbolSize: 8, itemStyle: { color: '#FFB84D' }, data: [[0.08, 0.78]] }
      ]
    });
  },

  chartConfusion() {
    const el = document.getElementById('chart-confusion');
    if (!el) return;
    this.charts.conf = echarts.init(el, null, { renderer: 'svg' });
    const labels = ['良性', '肿块', '钙化', '不对称'];
    const data = [
      [0, 0, 2380, 8, 6, 4], [0, 1, 12, 156, 3, 2], [0, 2, 18, 8, 1284, 22], [0, 3, 4, 1, 12, 286],
      [1, 0, 8, 1242, 6, 2], [1, 1, 1456, 18, 12, 4], [1, 2, 22, 8, 1284, 32], [1, 3, 3, 2, 18, 268],
      [2, 0, 12, 18, 1098, 28], [2, 1, 18, 12, 1284, 48], [2, 2, 1024, 32, 22, 198], [2, 3, 6, 4, 22, 168],
      [3, 0, 4, 8, 18, 286], [3, 1, 2, 4, 8, 32], [3, 2, 6, 4, 18, 124], [3, 3, 8, 12, 32, 1284],
    ];
    this.charts.conf.setOption({
      grid: { left: 60, right: 16, top: 30, bottom: 30 },
      xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#1F2940' } }, axisLabel: { color: '#E8ECF4', fontSize: 11, fontFamily: 'JetBrains Mono' }, name: '预测', nameLocation: 'middle', nameGap: 24, nameTextStyle: { color: '#7A8499', fontSize: 10 } },
      yAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#1F2940' } }, axisLabel: { color: '#E8ECF4', fontSize: 11, fontFamily: 'JetBrains Mono' }, name: '实际', nameLocation: 'middle', nameGap: 38, nameTextStyle: { color: '#7A8499', fontSize: 10 } },
      tooltip: { backgroundColor: '#0E1320', borderColor: '#2E3A5C' },
      visualMap: { show: false, min: 0, max: 2400, inRange: { color: ['#070A12', '#00E5E5'] } },
      series: [{ type: 'heatmap', data, label: { show: true, color: '#070A12', fontSize: 9, fontFamily: 'JetBrains Mono' } }]
    });
  },

  // ---------- 图表: 数据集 ----------
  chartLesionPie() {
    const el = document.getElementById('chart-lesion');
    if (!el) return;
    this.charts.lesion = echarts.init(el, null, { renderer: 'svg' });
    this.charts.lesion.setOption({
      tooltip: { backgroundColor: '#0E1320', borderColor: '#2E3A5C' },
      legend: { orient: 'vertical', right: 0, top: 'middle', textStyle: { color: '#E8ECF4', fontSize: 11, fontFamily: 'JetBrains Mono' } },
      series: [{
        type: 'pie', radius: ['52%', '78%'], center: ['38%', '50%'],
        label: { show: false },
        itemStyle: { borderColor: '#070A12', borderWidth: 2 },
        data: [
          { name: '肿块', value: 3214, itemStyle: { color: '#FF6B7A' } },
          { name: '钙化', value: 2867, itemStyle: { color: '#FFB84D' } },
          { name: '不对称', value: 1612, itemStyle: { color: '#00E5E5' } },
          { name: '良性', value: 1820, itemStyle: { color: '#5EE6A8' } },
          { name: '正常', value: 1687, itemStyle: { color: '#7A8499' } },
        ]
      }]
    });
  },

  chartAgeBar() {
    const el = document.getElementById('chart-age');
    if (!el) return;
    this.charts.age = echarts.init(el, null, { renderer: 'svg' });
    this.charts.age.setOption({
      grid: { left: 44, right: 16, top: 16, bottom: 30 },
      xAxis: { type: 'category', data: DATASET_STATS.ageDistribution.map(d => d.range), axisLine: { lineStyle: { color: '#1F2940' } }, axisLabel: { color: '#7A8499', fontSize: 10, fontFamily: 'JetBrains Mono' } },
      yAxis: { type: 'value', axisLine: { lineStyle: { color: '#1F2940' } }, axisLabel: { color: '#7A8499', fontSize: 10, fontFamily: 'JetBrains Mono' }, splitLine: { lineStyle: { color: '#1F2940', type: 'dashed' } } },
      tooltip: { backgroundColor: '#0E1320', borderColor: '#2E3A5C' },
      series: [{
        type: 'bar', barWidth: 22,
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#00E5E5' },
          { offset: 1, color: 'rgba(0, 229, 229, 0.15)' },
        ]), borderRadius: [2, 2, 0, 0] },
        data: DATASET_STATS.ageDistribution.map(d => d.count),
      }]
    });
  },

  chartSourceDonut() {
    const el = document.getElementById('chart-source');
    if (!el) return;
    this.charts.source = echarts.init(el, null, { renderer: 'svg' });
    this.charts.source.setOption({
      tooltip: { backgroundColor: '#0E1320', borderColor: '#2E3A5C' },
      series: [{
        type: 'pie', radius: ['62%', '82%'], center: ['50%', '50%'],
        label: { position: 'center', formatter: () => '11200\n总样本', color: '#E8ECF4', fontSize: 14, fontFamily: 'JetBrains Mono', fontWeight: 600, lineHeight: 20 },
        itemStyle: { borderColor: '#070A12', borderWidth: 3 },
        data: DATASET_STATS.sources.map((s, i) => ({
          name: s.name, value: s.cases,
          itemStyle: { color: ['#00E5E5', '#FF6B7A', '#FFB84D', '#5EE6A8'][i] }
        }))
      }]
    });
  },
};

// ===========================================================
// 页面渲染函数
// ===========================================================

// ---------- 工作台 ----------
function renderDashboard() {
  return `
    <div class="page">
      <div class="section-header fade-up">
        <span class="section-num">01 / 05</span>
        <h1 class="section-title">工作台</h1>
        <span class="section-subtitle">DASHBOARD · SYSTEM OVERVIEW</span>
      </div>

      <!-- 关键指标 -->
      <div class="grid grid-cols-4 gap-5 mb-8">
        <div class="metric fade-up fade-up-1">
          <div class="metric-label"><i data-lucide="scan-line" class="w-3 h-3"></i>今日检测</div>
          <div class="metric-value">142<span class="metric-unit">/例</span></div>
          <div class="metric-delta up"><i data-lucide="trending-up" class="w-3 h-3"></i>+12.7% vs 昨日</div>
          <div id="chart-spark-1" class="metric-spark" style="width: 110px; height: 36px;"></div>
        </div>
        <div class="metric fade-up fade-up-2">
          <div class="metric-label"><i data-lucide="alert-triangle" class="w-3 h-3"></i>阳性检出率</div>
          <div class="metric-value" style="color: #FF6B7A;">37.3<span class="metric-unit">%</span></div>
          <div class="metric-delta up"><i data-lucide="trending-up" class="w-3 h-3"></i>+2.1pp vs 上周</div>
        </div>
        <div class="metric fade-up fade-up-3">
          <div class="metric-label"><i data-lucide="zap" class="w-3 h-3"></i>平均推理</div>
          <div class="metric-value">286<span class="metric-unit">ms</span></div>
          <div class="metric-delta down"><i data-lucide="trending-down" class="w-3 h-3"></i>-18ms vs 基线</div>
        </div>
        <div class="metric fade-up fade-up-4">
          <div class="metric-label"><i data-lucide="target" class="w-3 h-3"></i>模型 AUC</div>
          <div class="metric-value" style="color: #5EE6A8;">0.954</div>
          <div class="metric-delta up"><i data-lucide="trending-up" class="w-3 h-3"></i>+0.008 vs v2.2</div>
        </div>
      </div>

      <div class="section-divider"></div>

      <!-- 主区: 实时流 + 风险预警 -->
      <div class="grid grid-cols-12 gap-5">
        <!-- 实时推理流 -->
        <div class="col-span-8 fade-up fade-up-2">
          <div class="card">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <div class="px-5 py-4 border-b border-ink-700/50 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="status-dot status-dot--scan"></span>
                <h3 class="font-display text-lg">实时推理流</h3>
                <span class="font-mono text-xs text-ink-100/40">LIVE INFERENCE</span>
              </div>
              <div class="flex items-center gap-4 text-xs font-mono text-ink-100/50">
                <span>队列: <span class="text-scan-500">14</span></span>
                <span>吞吐: <span class="text-ink-100">6.2/s</span></span>
                <span class="badge badge--ok">A100 × 4</span>
              </div>
            </div>
            <div class="px-5 py-3 font-mono text-[10px] text-ink-100/40 grid grid-cols-[130px_100px_90px_100px_1fr_80px_80px] gap-4 border-b border-ink-700/30">
              <div>CASE_ID</div>
              <div>PATIENT</div>
              <div>VIEW</div>
              <div>STATUS</div>
              <div>PROGRESS</div>
              <div class="text-right">CONF</div>
              <div class="text-right">LATENCY</div>
            </div>
            <div id="stream-list">
              ${renderStreamList()}
            </div>
            <div class="px-5 py-3 border-t border-ink-700/30 text-center font-mono text-xs text-ink-100/40">
              <a href="#/analysis" class="hover:text-scan-500 transition">→ 查看完整队列 · 142 例今日</a>
            </div>
          </div>
        </div>

        <!-- 高风险预警 -->
        <div class="col-span-4 fade-up fade-up-3">
          <div class="card h-full">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <div class="px-5 py-4 border-b border-ink-700/50 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <i data-lucide="alert-octagon" class="w-4 h-4 text-coral-500"></i>
                <h3 class="font-display text-lg">高风险预警</h3>
              </div>
              <span class="badge badge--warn">8 例</span>
            </div>
            <div class="p-3 space-y-2">
              ${MOCK_CASES.filter(c => c.biradsScore >= 4).slice(0, 6).map(c => `
                <a href="#/results" class="block p-3 border border-ink-700/50 hover:border-coral-500/50 hover:bg-coral-500/5 transition group">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-mono text-xs text-ink-100/60 group-hover:text-coral-400 transition">${c.id}</span>
                    <div class="birads birads-${c.biradsScore}" style="width: 36px; height: 36px; font-size: 14px;">${c.biradsScore}</div>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <div class="font-mono text-ink-100/50">
                      <span>${c.examType}</span>
                      <span class="text-ink-100/30 mx-1.5">·</span>
                      <span>${c.patientAge}y</span>
                    </div>
                    <span class="font-mono text-coral-400">${(c.confidence * 100).toFixed(0)}%</span>
                  </div>
                </a>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="section-divider"></div>

      <!-- 副区: ROC + 吞吐 + 模型状态 -->
      <div class="grid grid-cols-12 gap-5">
        <div class="col-span-4 fade-up fade-up-3">
          <div class="card p-5 h-full">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-display text-lg">ROC 曲线</h3>
              <span class="font-mono text-xs text-scan-500">AUC 0.954</span>
            </div>
            <div id="chart-mini-roc" style="height: 180px;"></div>
            <div class="grid grid-cols-3 gap-3 mt-4 text-center">
              <div>
                <div class="font-mono text-[10px] text-ink-100/40">SENS</div>
                <div class="font-display text-xl text-mint-500">0.918</div>
              </div>
              <div>
                <div class="font-mono text-[10px] text-ink-100/40">SPEC</div>
                <div class="font-display text-xl text-scan-500">0.892</div>
              </div>
              <div>
                <div class="font-mono text-[10px] text-ink-100/40">F1</div>
                <div class="font-display text-xl">0.911</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-span-5 fade-up fade-up-4">
          <div class="card p-5 h-full">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-display text-lg">24h 推理吞吐</h3>
              <span class="font-mono text-xs text-ink-100/50">单位: 例 / 小时</span>
            </div>
            <div id="chart-throughput" style="height: 220px;"></div>
          </div>
        </div>
        <div class="col-span-3 fade-up fade-up-5">
          <div class="card p-5 h-full">
            <h3 class="font-display text-lg mb-4">模型状态</h3>
            <div class="space-y-3 text-xs">
              <div class="flex justify-between items-center">
                <span class="font-mono text-ink-100/50">生产模型</span>
                <span class="badge badge--scan">v2.3.0</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="font-mono text-ink-100/50">AB 测试</span>
                <span class="badge badge--caution">v2.4-rc</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="font-mono text-ink-100/50">影子模式</span>
                <span class="badge badge--ok">活跃</span>
              </div>
              <div class="border-t border-ink-700/40 pt-3 mt-3">
                <div class="font-mono text-[10px] text-ink-100/40 mb-2">资源占用</div>
                <div class="space-y-2">
                  <div>
                    <div class="flex justify-between mb-1"><span class="font-mono text-ink-100/50">GPU 0</span><span class="font-mono">68%</span></div>
                    <div class="progress"><div class="progress-bar" style="width: 68%"></div></div>
                  </div>
                  <div>
                    <div class="flex justify-between mb-1"><span class="font-mono text-ink-100/50">GPU 1</span><span class="font-mono">72%</span></div>
                    <div class="progress"><div class="progress-bar" style="width: 72%"></div></div>
                  </div>
                  <div>
                    <div class="flex justify-between mb-1"><span class="font-mono text-ink-100/50">GPU 2</span><span class="font-mono">54%</span></div>
                    <div class="progress"><div class="progress-bar" style="width: 54%"></div></div>
                  </div>
                  <div>
                    <div class="flex justify-between mb-1"><span class="font-mono text-ink-100/50">GPU 3</span><span class="font-mono">81%</span></div>
                    <div class="progress"><div class="progress-bar--warn progress-bar" style="width: 81%"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderStreamList() {
  return STREAM_INITIAL.map(s => {
    const statusMap = {
      preprocess: { label: '预处理', class: 'badge--scan' },
      infer: { label: '推理中', class: 'badge--caution' },
      postprocess: { label: '后处理', class: 'badge--ok' },
    };
    const st = statusMap[s.status];
    return `
      <div class="stream-row">
        <div class="text-ink-100/80">${s.id}</div>
        <div class="text-ink-100/60">${s.patient}</div>
        <div class="text-ink-100/50">${s.view}</div>
        <div><span class="badge ${st.class}">${st.label}</span></div>
        <div class="progress" style="height: 3px;"><div class="progress-bar" style="width: ${s.progress}%"></div></div>
        <div class="text-right ${s.conf ? 'text-mint-500' : 'text-ink-100/30'}">${s.conf ? (s.conf * 100).toFixed(0) + '%' : '—'}</div>
        <div class="text-right text-ink-100/50">${(200 + Math.random() * 150).toFixed(0)}ms</div>
      </div>
    `;
  }).join('');
}

// ---------- 影像分析 ----------
function renderAnalysis() {
  return `
    <div class="page">
      <div class="section-header fade-up">
        <span class="section-num">02 / 05</span>
        <h1 class="section-title">影像分析</h1>
        <span class="section-subtitle">MAMMOGRAPHY · AI INFERENCE</span>
      </div>

      <div class="grid grid-cols-12 gap-5">
        <!-- 左侧: 上传 + 控制台 -->
        <div class="col-span-4 space-y-5">
          <!-- 上传区 -->
          <div class="card fade-up fade-up-1">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <div class="px-5 py-4 border-b border-ink-700/50 flex items-center gap-3">
              <i data-lucide="upload-cloud" class="w-4 h-4 text-scan-500"></i>
              <h3 class="font-display text-lg">影像上传</h3>
            </div>
            <div class="p-5">
              <div class="dropzone rounded-sm p-8 text-center">
                <div class="w-12 h-12 mx-auto mb-3 border border-ink-600 rounded-sm flex items-center justify-center">
                  <i data-lucide="file-image" class="w-5 h-5 text-ink-100/40"></i>
                </div>
                <div class="text-sm text-ink-100/80 mb-1">拖拽 DICOM 文件至此处</div>
                <div class="text-xs font-mono text-ink-100/40 mb-4">支持 .dcm · .png · .jpg · 最大 50MB</div>
                <button class="btn btn-primary">
                  <i data-lucide="folder-open" class="w-3.5 h-3.5"></i>
                  选择文件
                </button>
              </div>
              <div class="mt-4 space-y-2 text-xs font-mono">
                <div class="flex items-center justify-between p-2 bg-ink-850 border border-ink-700/50 rounded-sm">
                  <div class="flex items-center gap-2">
                    <i data-lucide="file" class="w-3 h-3 text-scan-500"></i>
                    <span>L_MLO_00142.dcm</span>
                  </div>
                  <span class="text-mint-500 flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i>24.6MB</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-ink-850 border border-ink-700/50 rounded-sm">
                  <div class="flex items-center gap-2">
                    <i data-lucide="file" class="w-3 h-3 text-scan-500"></i>
                    <span>R_MLO_00142.dcm</span>
                  </div>
                  <span class="text-mint-500 flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i>25.1MB</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 推理控制台 -->
          <div class="card fade-up fade-up-2">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <div class="px-5 py-4 border-b border-ink-700/50 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <i data-lucide="terminal" class="w-4 h-4 text-scan-500"></i>
                <h3 class="font-display text-lg">推理控制台</h3>
              </div>
              <span class="status-dot status-dot--scan"></span>
            </div>
            <div class="p-5 space-y-4">
              <div>
                <label class="font-mono text-[10px] uppercase tracking-widest text-ink-100/40 block mb-2">模型选择</label>
                <select class="w-full bg-ink-850 border border-ink-700 px-3 py-2 text-sm font-mono">
                  <option>MammoSentry v2.3 (生产)</option>
                  <option>MammoSentry v2.4-rc (AB)</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-mono text-[10px] uppercase tracking-widest text-ink-100/40 block mb-2">阈值 (conf)</label>
                  <input type="text" value="0.50" class="w-full bg-ink-850 border border-ink-700 px-3 py-2 text-sm font-mono" />
                </div>
                <div>
                  <label class="font-mono text-[10px] uppercase tracking-widest text-ink-100/40 block mb-2">NMS IoU</label>
                  <input type="text" value="0.45" class="w-full bg-ink-850 border border-ink-700 px-3 py-2 text-sm font-mono" />
                </div>
              </div>
              <button class="btn btn-primary w-full justify-center" onclick="runInference()">
                <i data-lucide="play" class="w-3.5 h-3.5"></i>
                运行 AI 推理
              </button>
              <div class="border-t border-ink-700/50 pt-4">
                <div class="font-mono text-[10px] uppercase tracking-widest text-ink-100/40 mb-2">DICOM 元数据</div>
                <div class="space-y-1.5 text-xs font-mono">
                  <div class="flex justify-between"><span class="text-ink-100/40">PatientID</span><span>P-A8F2-1039</span></div>
                  <div class="flex justify-between"><span class="text-ink-100/40">Modality</span><span>MG</span></div>
                  <div class="flex justify-between"><span class="text-ink-100/40">View</span><span>L-MLO</span></div>
                  <div class="flex justify-between"><span class="text-ink-100/40">Pixel Spacing</span><span>0.1 mm</span></div>
                  <div class="flex justify-between"><span class="text-ink-100/40">Matrix</span><span>2294×1914</span></div>
                  <div class="flex justify-between"><span class="text-ink-100/40">Bits Stored</span><span>12</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间: 钼靶双视图 -->
        <div class="col-span-8 space-y-5">
          <div class="grid grid-cols-2 gap-5 fade-up fade-up-2">
            <div>
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-[10px] text-ink-100/40">L-MLO</span>
                  <span class="font-mono text-xs text-ink-100/60">左乳 · 轴位</span>
                </div>
                <div class="flex items-center gap-1">
                  <button class="p-1 hover:bg-ink-800 rounded-sm" data-tooltip="放大"><i data-lucide="zoom-in" class="w-3.5 h-3.5"></i></button>
                  <button class="p-1 hover:bg-ink-800 rounded-sm" data-tooltip="重置"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i></button>
                  <button class="p-1 hover:bg-ink-800 rounded-sm" data-tooltip="对比度"><i data-lucide="sliders-horizontal" class="w-3.5 h-3.5"></i></button>
                </div>
              </div>
              <div class="mammo-frame">
                <div class="mammo-image"></div>
                <div class="heatmap"></div>
                <div class="scanline"></div>
                <div class="mammo-label tl">L · MLO</div>
                <div class="mammo-label tr">142</div>
                <div class="mammo-label bl">2026-06-27</div>
                <div class="mammo-label br">Hologic</div>
                <div class="roi-box" style="left: 35%; top: 38%; width: 30%; height: 25%;">
                  <div class="roi-label">L-Sup · 0.94 · mass</div>
                </div>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-[10px] text-ink-100/40">R-MLO</span>
                  <span class="font-mono text-xs text-ink-100/60">右乳 · 轴位</span>
                </div>
                <div class="flex items-center gap-1">
                  <button class="p-1 hover:bg-ink-800 rounded-sm"><i data-lucide="zoom-in" class="w-3.5 h-3.5"></i></button>
                  <button class="p-1 hover:bg-ink-800 rounded-sm"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i></button>
                  <button class="p-1 hover:bg-ink-800 rounded-sm"><i data-lucide="sliders-horizontal" class="w-3.5 h-3.5"></i></button>
                </div>
              </div>
              <div class="mammo-frame">
                <div class="mammo-image"></div>
                <div class="scanline"></div>
                <div class="mammo-label tl">R · MLO</div>
                <div class="mammo-label tr">142</div>
                <div class="mammo-label bl">2026-06-27</div>
                <div class="mammo-label br">Hologic</div>
              </div>
            </div>
          </div>

          <!-- 终端日志 -->
          <div class="card fade-up fade-up-4">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <div class="px-5 py-3 border-b border-ink-700/50 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="font-mono text-[10px] text-ink-100/40">$</span>
                <span class="font-mono text-xs">mammo.infer · v2.3.0 · cuda:0 · fp16</span>
              </div>
              <div class="flex items-center gap-3 text-xs font-mono text-ink-100/50">
                <span>STATUS: <span class="text-mint-500">RUNNING</span></span>
                <span>UPTIME: <span class="text-ink-100">00:01:23</span></span>
              </div>
            </div>
            <div class="terminal" id="terminal-output">
              ${INFERENCE_LOGS.map(l => `
                <div class="terminal-line">
                  <span class="terminal-time">${l.time}</span>
                  <span class="terminal-level terminal-level--${l.level}">${l.level.toUpperCase().padEnd(5)}</span>
                  <span class="terminal-msg">${l.msg}</span>
                </div>
              `).join('')}
              <div class="terminal-line">
                <span class="terminal-time">${new Date().toTimeString().split(' ')[0]}.000</span>
                <span class="terminal-level terminal-level--scan">READY</span>
                <span class="terminal-msg">等待推理任务...<span class="terminal-cursor"></span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function runInference() {
  const term = document.getElementById('terminal-output');
  if (!term) return;
  const newLog = (msg, level = 'info') => {
    const time = new Date().toTimeString().split(' ')[0] + '.' + String(Math.floor(Math.random() * 999)).padStart(3, '0');
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = `<span class="terminal-time">${time}</span><span class="terminal-level terminal-level--${level}">${level.toUpperCase().padEnd(5)}</span><span class="terminal-msg">${msg}</span>`;
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
  };
  newLog('> 启动推理任务 [TASK-2026-00142]');
  newLog('> 加载权重 · swin_tiny_224 + resnet18_ft_best ✓', 'ok');
  setTimeout(() => newLog('> 推理完成 · 312ms · GPU mem 1.42GB', 'ok'), 800);
  setTimeout(() => newLog('⚠ 检测到高置信阳性 (0.94) · 自动标记 BI-RADS 5', 'warn'), 1400);
  setTimeout(() => newLog('> Grad-CAM 热力图已更新', 'info'), 2000);
}

// ---------- 检测结果 ----------
function renderResults() {
  const c = RESULT_CASE;
  return `
    <div class="page">
      <div class="section-header fade-up">
        <span class="section-num">03 / 05</span>
        <h1 class="section-title">检测结果</h1>
        <span class="section-subtitle">DETECTION · ${c.id}</span>
      </div>

      <div class="grid grid-cols-12 gap-5">
        <!-- 左侧: 影像 + 标注 -->
        <div class="col-span-7 space-y-5">
          <div class="card fade-up fade-up-1">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <div class="px-5 py-4 border-b border-ink-700/50 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <i data-lucide="image" class="w-4 h-4 text-scan-500"></i>
                <h3 class="font-display text-lg">影像与 AI 标注</h3>
                <span class="font-mono text-xs text-ink-100/40">L-MLO · 2294×1914</span>
              </div>
              <div class="flex items-center gap-2 text-xs font-mono">
                <label class="flex items-center gap-1.5 text-ink-100/60 cursor-pointer">
                  <input type="checkbox" checked class="accent-scan-500"> 热力图
                </label>
                <label class="flex items-center gap-1.5 text-ink-100/60 cursor-pointer">
                  <input type="checkbox" checked class="accent-scan-500"> ROI
                </label>
                <label class="flex items-center gap-1.5 text-ink-100/60 cursor-pointer">
                  <input type="checkbox" class="accent-scan-500"> 关键点
                </label>
              </div>
            </div>
            <div class="p-5">
              <div class="mammo-frame" style="aspect-ratio: 5/4;">
                <div class="mammo-image"></div>
                <div class="heatmap"></div>
                <div class="scanline"></div>
                <div class="mammo-label tl">L · MLO</div>
                <div class="mammo-label tr">142</div>
                <div class="mammo-label bl">2026-06-27</div>
                <div class="mammo-label br">MammoSentry v2.3</div>
                <div class="roi-box" style="left: 32%; top: 36%; width: 32%; height: 26%;">
                  <div class="roi-label">病灶 1 · mass · 0.94</div>
                </div>
                <div class="roi-box" style="left: 55%; top: 60%; width: 12%; height: 8%; border-color: #FFB84D; box-shadow: 0 0 0 1px rgba(255,184,77,0.2), 0 0 8px rgba(255,184,77,0.4);">
                  <div class="roi-label" style="color: #FFB84D; border-color: #FFB84D;">钙化 · 0.62</div>
                </div>
              </div>
              <div class="mt-3 flex items-center gap-6 text-xs font-mono text-ink-100/50">
                <span>ROI 数量: <span class="text-coral-400">2</span></span>
                <span>置信度峰值: <span class="text-coral-400">0.94</span></span>
                <span>热力图最大响应: <span class="text-amber-500">0.87</span></span>
                <span>覆盖面积: <span class="text-ink-100">3.2%</span></span>
              </div>
            </div>
          </div>

          <!-- 病灶分类概率 -->
          <div class="card fade-up fade-up-3">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <div class="px-5 py-4 border-b border-ink-700/50 flex items-center gap-3">
              <i data-lucide="bar-chart-3" class="w-4 h-4 text-scan-500"></i>
              <h3 class="font-display text-lg">分类概率分布</h3>
            </div>
            <div class="p-5 space-y-4">
              ${[
                { name: '肿块 (Mass)', value: c.classification.mass, color: '#FF6B7A' },
                { name: '钙化 (Calcification)', value: c.classification.calcification, color: '#FFB84D' },
                { name: '不对称 (Asymmetry)', value: c.classification.asymmetry, color: '#00E5E5' },
                { name: '良性 (Benign)', value: c.classification.benign, color: '#5EE6A8' },
              ].map(item => `
                <div>
                  <div class="flex justify-between mb-1.5">
                    <span class="text-sm">${item.name}</span>
                    <span class="font-mono text-sm" style="color: ${item.color};">${(item.value * 100).toFixed(1)}%</span>
                  </div>
                  <div class="progress" style="height: 6px;"><div class="progress-bar" style="width: ${item.value * 100}%; background: ${item.color}; box-shadow: 0 0 8px ${item.color}80;"></div></div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- 右侧: 诊断报告 -->
        <div class="col-span-5 space-y-5">
          <!-- BI-RADS 卡片 -->
          <div class="card fade-up fade-up-2">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <div class="p-6">
              <div class="flex items-center justify-between mb-5">
                <div>
                  <div class="font-mono text-[10px] text-ink-100/40 mb-1">BI-RADS ASSESSMENT</div>
                  <div class="font-display text-2xl">${c.biradsLabel}</div>
                </div>
                <div class="birads birads-${c.birads}">${c.birads}</div>
              </div>
              <div class="birads-scale mb-4">
                <div class="s0"></div>
                <div class="s1"></div>
                <div class="s2"></div>
                <div class="s3"></div>
                <div class="s4"></div>
                <div class="s5"></div>
                <div class="s6"></div>
              </div>
              <div class="grid grid-cols-7 text-[9px] font-mono text-ink-100/40 text-center mb-5">
                <div>0</div><div>1</div><div>2</div><div>3</div><div>4</div><div>5</div><div>6</div>
              </div>
              <div class="border-t border-ink-700/50 pt-4 space-y-2.5 text-sm">
                <div class="flex justify-between">
                  <span class="text-ink-100/50">恶性置信度</span>
                  <span class="font-mono text-coral-400 font-semibold">${(c.confidence * 100).toFixed(1)}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-ink-100/50">病灶类别</span>
                  <span class="font-mono">${c.lesion.type}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-ink-100/50">位置</span>
                  <span class="font-mono text-xs">${c.lesion.location}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-ink-100/50">大小</span>
                  <span class="font-mono">${c.lesion.size}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-ink-100/50">形态</span>
                  <span class="font-mono">${c.lesion.shape}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-ink-100/50">边缘</span>
                  <span class="font-mono">${c.lesion.margin}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-ink-100/50">腺体密度</span>
                  <span class="font-mono text-xs">${c.breastDensity}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 风险因素 -->
          <div class="card fade-up fade-up-3">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <div class="px-5 py-4 border-b border-ink-700/50 flex items-center gap-3">
              <i data-lucide="gauge" class="w-4 h-4 text-scan-500"></i>
              <h3 class="font-display text-lg">风险因素评分</h3>
            </div>
            <div class="p-5 space-y-3">
              ${c.riskFactors.map(r => `
                <div>
                  <div class="flex justify-between mb-1.5 text-xs">
                    <span>${r.name}</span>
                    <span class="font-mono ${r.level === 'high' ? 'text-coral-400' : r.level === 'mid' ? 'text-amber-500' : 'text-mint-500'}">${(r.value * 100).toFixed(0)}%</span>
                  </div>
                  <div class="progress" style="height: 4px;">
                    <div class="progress-bar ${r.level === 'high' ? 'progress-bar--warn' : r.level === 'mid' ? 'progress-bar--caution' : 'progress-bar--ok'}" style="width: ${r.value * 100}%;"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 操作 -->
          <div class="flex gap-3 fade-up fade-up-4">
            <button class="btn btn-primary flex-1 justify-center">
              <i data-lucide="check" class="w-3.5 h-3.5"></i> 确认诊断
            </button>
            <button class="btn flex-1 justify-center">
              <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i> 申请复检
            </button>
            <button class="btn flex-1 justify-center">
              <i data-lucide="download" class="w-3.5 h-3.5"></i> 导出报告
            </button>
          </div>
        </div>
      </div>

      <!-- 历史对比 -->
      <div class="section-divider"></div>

      <div class="grid grid-cols-12 gap-5">
        <div class="col-span-7 fade-up fade-up-4">
          <div class="card">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <div class="px-5 py-4 border-b border-ink-700/50 flex items-center gap-3">
              <i data-lucide="history" class="w-4 h-4 text-scan-500"></i>
              <h3 class="font-display text-lg">历史检查对比</h3>
            </div>
            <table class="dt">
              <thead>
                <tr>
                  <th>检查日期</th>
                  <th>BI-RADS</th>
                  <th>AI 建议</th>
                  <th>医嘱</th>
                </tr>
              </thead>
              <tbody>
                ${c.comparisonStudies.map(s => `
                  <tr>
                    <td class="text-ink-100/80">${s.date}</td>
                    <td>
                      <span class="birads birads-${s.birads}" style="width: 28px; height: 28px; font-size: 13px; display: inline-flex; align-items: center; justify-content: center;">${s.birads}</span>
                    </td>
                    <td class="text-ink-100/60">${s.note}</td>
                    <td>
                      ${s.birads >= 4 ? '<span class="badge badge--warn">高风险</span>' : s.birads === 3 ? '<span class="badge badge--caution">随访</span>' : '<span class="badge badge--ok">常规</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="col-span-5 fade-up fade-up-5">
          <div class="card p-6 h-full">
            <div class="font-mono text-[10px] text-ink-100/40 mb-3">// CLINICAL RECOMMENDATION</div>
            <h3 class="font-display text-xl mb-3">临床建议</h3>
            <p class="text-sm text-ink-100/80 leading-relaxed mb-4">${c.recommendation}</p>
            <div class="border-t border-ink-700/50 pt-4 space-y-2 text-xs font-mono text-ink-100/60">
              <div class="flex items-start gap-2">
                <i data-lucide="arrow-right" class="w-3 h-3 text-scan-500 mt-0.5"></i>
                <span>建议 1 周内完成穿刺活检</span>
              </div>
              <div class="flex items-start gap-2">
                <i data-lucide="arrow-right" class="w-3 h-3 text-scan-500 mt-0.5"></i>
                <span>同步进行乳腺超声检查</span>
              </div>
              <div class="flex items-start gap-2">
                <i data-lucide="arrow-right" class="w-3 h-3 text-scan-500 mt-0.5"></i>
                <span>关注淋巴结状态 (腋下/锁骨上)</span>
              </div>
              <div class="flex items-start gap-2">
                <i data-lucide="arrow-right" class="w-3 h-3 text-scan-500 mt-0.5"></i>
                <span>必要时进行 MRI 增强检查</span>
              </div>
            </div>
            <div class="mt-4 p-3 border border-coral-500/30 bg-coral-500/5 text-xs text-coral-400 font-mono flex items-start gap-2">
              <i data-lucide="alert-circle" class="w-3.5 h-3.5 mt-0.5 shrink-0"></i>
              <span>本结果由 AI 模型辅助生成，最终诊断需由放射科医师结合临床信息确认。</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ---------- 模型中心 ----------
function renderModels() {
  return `
    <div class="page">
      <div class="section-header fade-up">
        <span class="section-num">04 / 05</span>
        <h1 class="section-title">模型中心</h1>
        <span class="section-subtitle">SWIN + RESNET · TRAINING & EVAL</span>
      </div>

      <!-- 模型信息卡 -->
      <div class="grid grid-cols-12 gap-5 mb-5">
        <div class="col-span-4 fade-up fade-up-1">
          <div class="card p-6 h-full">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <div class="font-mono text-[10px] text-ink-100/40 mb-2">// PRODUCTION MODEL</div>
            <h2 class="font-display text-3xl mb-1">${MODEL_METRICS.name}</h2>
            <div class="font-mono text-xs text-ink-100/50 mb-5">${MODEL_METRICS.version} · ${MODEL_METRICS.backbone}</div>
            <div class="space-y-2.5 text-xs font-mono">
              <div class="flex justify-between"><span class="text-ink-100/40">预训练数据</span><span class="text-right">${MODEL_METRICS.pretrained}</span></div>
              <div class="flex justify-between"><span class="text-ink-100/40">总参数量</span><span>${MODEL_METRICS.totalParams}</span></div>
              <div class="flex justify-between"><span class="text-ink-100/40">FLOPs</span><span>${MODEL_METRICS.flops}</span></div>
              <div class="flex justify-between"><span class="text-ink-100/40">推理速度</span><span>${MODEL_METRICS.inferenceSpeed}</span></div>
              <div class="flex justify-between"><span class="text-ink-100/40">Epochs</span><span>${MODEL_METRICS.epochs}</span></div>
              <div class="flex justify-between"><span class="text-ink-100/40">Batch Size</span><span>${MODEL_METRICS.batchSize}</span></div>
              <div class="flex justify-between"><span class="text-ink-100/40">Learning Rate</span><span>${MODEL_METRICS.learningRate}</span></div>
            </div>
            <div class="mt-5 pt-5 border-t border-ink-700/50 flex gap-2">
              <button class="btn btn-primary flex-1 justify-center text-xs">
                <i data-lucide="download" class="w-3 h-3"></i> 导出权重
              </button>
              <button class="btn flex-1 justify-center text-xs">
                <i data-lucide="git-branch" class="w-3 h-3"></i> 版本
              </button>
            </div>
          </div>
        </div>

        <div class="col-span-8 fade-up fade-up-2">
          <div class="card h-full">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <div class="px-5 py-4 border-b border-ink-700/50 flex items-center justify-between">
              <h3 class="font-display text-lg">双阶段模型架构</h3>
              <span class="font-mono text-xs text-ink-100/40">Swin-T → ResNet-18 · Transfer Learning</span>
            </div>
            <div class="p-6">
              <div class="flex items-center gap-1 flex-wrap">
                ${ARCH_NODES.map((n, i) => `
                  <div class="arch-block relative" style="min-width: 76px;">
                    <div class="arch-block__name">${n.name}</div>
                    <div class="arch-block__detail">${n.detail}</div>
                    ${i < ARCH_NODES.length - 1 ? '<div class="arch-arrow absolute -right-2 top-1/2 -translate-y-1/2 text-scan-500 text-sm">›</div>' : ''}
                  </div>
                `).join('')}
              </div>
              <div class="mt-8 grid grid-cols-2 gap-6">
                <div class="border-l-2 border-scan-500 pl-4">
                  <div class="font-mono text-[10px] text-ink-100/40 mb-1">// STAGE 1 · 自监督预训练</div>
                  <h4 class="font-display text-lg mb-2">Swin Transformer (Tiny)</h4>
                  <p class="text-xs text-ink-100/60 leading-relaxed">
                    在 CBIS-DDSM / TCIA 上进行自监督预训练 (MAE 范式)，
                    学习乳腺影像的局部-全局特征表达。分层窗口注意力机制
                    (W-MSA / SW-MSA) 兼顾计算效率与长程依赖捕获。
                  </p>
                </div>
                <div class="border-l-2 border-coral-500 pl-4">
                  <div class="font-mono text-[10px] text-ink-100/40 mb-1">// STAGE 2 · 监督微调</div>
                  <h4 class="font-display text-lg mb-2">ResNet-18 (ImageNet-1k)</h4>
                  <p class="text-xs text-ink-100/60 leading-relaxed">
                    加载 ImageNet 预训练权重，冻结前 12 层进行特征复用，
                    末层 FC 替换为 4 分类头 (良性/肿块/钙化/不对称)，
                    在下游任务数据上以 1e-4 学习率微调 60 epochs。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 训练曲线 + ROC -->
      <div class="grid grid-cols-12 gap-5 mb-5">
        <div class="col-span-8 fade-up fade-up-3">
          <div class="card p-5">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-display text-lg">训练曲线 · Loss & Accuracy</h3>
              <span class="font-mono text-xs text-ink-100/40">60 epochs · 收敛良好</span>
            </div>
            <div id="chart-train-curves" style="height: 300px;"></div>
          </div>
        </div>
        <div class="col-span-4 fade-up fade-up-4">
          <div class="card p-5 h-full">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <h3 class="font-display text-lg mb-3">评估指标</h3>
            <div class="space-y-3">
              ${[
                { name: 'Accuracy', value: MODEL_METRICS.accuracy, color: '#5EE6A8' },
                { name: 'AUC', value: MODEL_METRICS.auc, color: '#00E5E5' },
                { name: 'Sensitivity', value: MODEL_METRICS.sensitivity, color: '#FFB84D' },
                { name: 'Specificity', value: MODEL_METRICS.specificity, color: '#FF6B7A' },
                { name: 'F1-Score', value: MODEL_METRICS.f1Score, color: '#33EEEE' },
                { name: 'Precision', value: MODEL_METRICS.precision, color: '#7DEFBA' },
              ].map(m => `
                <div>
                  <div class="flex justify-between mb-1 text-xs">
                    <span class="font-mono text-ink-100/60">${m.name}</span>
                    <span class="font-mono" style="color: ${m.color};">${m.value.toFixed(3)}</span>
                  </div>
                  <div class="progress" style="height: 4px;">
                    <div style="width: ${m.value * 100}%; height: 100%; background: ${m.color};"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- ROC + 混淆矩阵 -->
      <div class="grid grid-cols-12 gap-5">
        <div class="col-span-6 fade-up fade-up-4">
          <div class="card p-5">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-display text-lg">ROC 曲线</h3>
              <span class="badge badge--ok">Test Set · 3850 例</span>
            </div>
            <div id="chart-roc" style="height: 300px;"></div>
          </div>
        </div>
        <div class="col-span-6 fade-up fade-up-5">
          <div class="card p-5">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-display text-lg">混淆矩阵</h3>
              <span class="font-mono text-xs text-ink-100/40">4-class classification</span>
            </div>
            <div id="chart-confusion" style="height: 300px;"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ---------- 数据集 ----------
function renderDataset() {
  return `
    <div class="page">
      <div class="section-header fade-up">
        <span class="section-num">05 / 05</span>
        <h1 class="section-title">数据集</h1>
        <span class="section-subtitle">CBIS-DDSM · TCIA · INBREAST</span>
      </div>

      <!-- 关键统计 -->
      <div class="grid grid-cols-4 gap-5 mb-5">
        <div class="metric fade-up fade-up-1">
          <div class="metric-label"><i data-lucide="database" class="w-3 h-3"></i>训练集</div>
          <div class="metric-value">11,200<span class="metric-unit">例</span></div>
          <div class="metric-delta up"><i data-lucide="trending-up" class="w-3 h-3"></i>本轮采样 100%</div>
        </div>
        <div class="metric fade-up fade-up-2">
          <div class="metric-label"><i data-lucide="test-tubes" class="w-3 h-3"></i>验证集</div>
          <div class="metric-value">950<span class="metric-unit">例</span></div>
          <div class="metric-delta up">分层采样</div>
        </div>
        <div class="metric fade-up fade-up-3">
          <div class="metric-label"><i data-lucide="flask-conical" class="w-3 h-3"></i>测试集</div>
          <div class="metric-value">3,850<span class="metric-unit">例</span></div>
          <div class="metric-delta up">独立中心</div>
        </div>
        <div class="metric fade-up fade-up-4">
          <div class="metric-label"><i data-lucide="activity" class="w-3 h-3"></i>阳性率</div>
          <div class="metric-value" style="color: #FF6B7A;">34.7<span class="metric-unit">%</span></div>
          <div class="metric-delta">临床真实 2-5% · 训练加权</div>
        </div>
      </div>

      <div class="section-divider"></div>

      <!-- 分布图区 -->
      <div class="grid grid-cols-12 gap-5 mb-5">
        <div class="col-span-4 fade-up fade-up-2">
          <div class="card p-5 h-full">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <h3 class="font-display text-lg mb-3">病灶类型分布</h3>
            <div id="chart-lesion" style="height: 280px;"></div>
            <div class="mt-4 space-y-1.5 text-xs font-mono">
              <div class="flex justify-between"><span class="text-ink-100/50">肿块</span><span class="text-coral-400">3,214</span></div>
              <div class="flex justify-between"><span class="text-ink-100/50">钙化</span><span class="text-amber-500">2,867</span></div>
              <div class="flex justify-between"><span class="text-ink-100/50">不对称</span><span class="text-scan-500">1,612</span></div>
              <div class="flex justify-between"><span class="text-ink-100/50">良性</span><span class="text-mint-500">1,820</span></div>
              <div class="flex justify-between"><span class="text-ink-100/50">正常</span><span class="text-ink-100/40">1,687</span></div>
            </div>
          </div>
        </div>
        <div class="col-span-5 fade-up fade-up-3">
          <div class="card p-5 h-full">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <h3 class="font-display text-lg mb-3">患者年龄分布</h3>
            <div id="chart-age" style="height: 240px;"></div>
            <div class="mt-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <div class="font-mono text-[10px] text-ink-100/40">中位年龄</div>
                <div class="font-display text-xl text-scan-500">52</div>
              </div>
              <div>
                <div class="font-mono text-[10px] text-ink-100/40">主要人群</div>
                <div class="font-display text-xl">40-60</div>
              </div>
              <div>
                <div class="font-mono text-[10px] text-ink-100/40">极差</div>
                <div class="font-display text-xl">22-86</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-span-3 fade-up fade-up-4">
          <div class="card p-5 h-full">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <h3 class="font-display text-lg mb-3">数据来源</h3>
            <div id="chart-source" style="height: 180px;"></div>
            <div class="mt-2 space-y-1 text-xs font-mono">
              ${DATASET_STATS.sources.map((s, i) => `
                <div class="flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-sm" style="background: ${['#00E5E5', '#FF6B7A', '#FFB84D', '#5EE6A8'][i]};"></span>
                    <span>${s.name}</span>
                  </span>
                  <span class="text-ink-100/60">${(s.contribution * 100).toFixed(0)}%</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- 训练测试集划分 -->
      <div class="grid grid-cols-12 gap-5">
        <div class="col-span-7 fade-up fade-up-3">
          <div class="card">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <div class="px-5 py-4 border-b border-ink-700/50 flex items-center justify-between">
              <h3 class="font-display text-lg">数据划分详情</h3>
              <span class="font-mono text-xs text-ink-100/40">分层采样 · 8 : 0.7 : 2.7</span>
            </div>
            <table class="dt">
              <thead>
                <tr>
                  <th>数据集</th>
                  <th>阳性 (Malignant)</th>
                  <th>阴性 (Benign/Normal)</th>
                  <th class="num">合计</th>
                  <th class="num">阳性率</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="text-ink-100/80">训练集 Train</td>
                  <td class="text-coral-400">${DATASET_STATS.classBalance.trainPos.toLocaleString()}</td>
                  <td class="text-mint-500">${DATASET_STATS.classBalance.trainNeg.toLocaleString()}</td>
                  <td class="num text-ink-100">${DATASET_STATS.totalTrain.toLocaleString()}</td>
                  <td class="num">${(DATASET_STATS.classBalance.trainPos / DATASET_STATS.totalTrain * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td class="text-ink-100/80">验证集 Val</td>
                  <td class="text-coral-400">${DATASET_STATS.classBalance.valPos}</td>
                  <td class="text-mint-500">${DATASET_STATS.classBalance.valNeg}</td>
                  <td class="num text-ink-100">${DATASET_STATS.totalVal.toLocaleString()}</td>
                  <td class="num">${(DATASET_STATS.classBalance.valPos / DATASET_STATS.totalVal * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td class="text-ink-100/80">测试集 Test</td>
                  <td class="text-coral-400">${DATASET_STATS.classBalance.testPos.toLocaleString()}</td>
                  <td class="text-mint-500">${DATASET_STATS.classBalance.testNeg.toLocaleString()}</td>
                  <td class="num text-ink-100">${DATASET_STATS.totalTest.toLocaleString()}</td>
                  <td class="num">${(DATASET_STATS.classBalance.testPos / DATASET_STATS.totalTest * 100).toFixed(1)}%</td>
                </tr>
                <tr class="bg-ink-850/40 font-semibold">
                  <td class="text-ink-100">合计 Total</td>
                  <td class="text-coral-400">${(DATASET_STATS.classBalance.trainPos + DATASET_STATS.classBalance.valPos + DATASET_STATS.classBalance.testPos).toLocaleString()}</td>
                  <td class="text-mint-500">${(DATASET_STATS.classBalance.trainNeg + DATASET_STATS.classBalance.valNeg + DATASET_STATS.classBalance.testNeg).toLocaleString()}</td>
                  <td class="num text-ink-100">${(DATASET_STATS.totalTrain + DATASET_STATS.totalVal + DATASET_STATS.totalTest).toLocaleString()}</td>
                  <td class="num">34.7%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="col-span-5 fade-up fade-up-4">
          <div class="card p-5 h-full">
            <div class="card-corner tl"></div><div class="card-corner tr"></div>
            <div class="card-corner bl"></div><div class="card-corner br"></div>
            <h3 class="font-display text-lg mb-3">数据增强策略</h3>
            <div class="space-y-3">
              ${Object.entries(DATASET_STATS.augmentation).map(([name, ratio]) => `
                <div>
                  <div class="flex justify-between mb-1.5 text-xs">
                    <span>${name}</span>
                    <span class="font-mono text-scan-500">${(ratio * 100).toFixed(0)}%</span>
                  </div>
                  <div class="progress" style="height: 4px;">
                    <div class="progress-bar" style="width: ${ratio * 100}%;"></div>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="mt-5 pt-4 border-t border-ink-700/50 space-y-2 text-xs font-mono text-ink-100/50">
              <div class="flex items-center gap-2">
                <i data-lucide="info" class="w-3 h-3 text-scan-500"></i>
                <span>阳性病例通过 SMOTE 过采样补足至 35%</span>
              </div>
              <div class="flex items-center gap-2">
                <i data-lucide="info" class="w-3 h-3 text-scan-500"></i>
                <span>所有图像统一至 224×224, CLAHE 均衡化</span>
              </div>
              <div class="flex items-center gap-2">
                <i data-lucide="info" class="w-3 h-3 text-scan-500"></i>
                <span>5-fold 交叉验证, 报告均值±标准差</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ===========================================================
// 启动
// ===========================================================
document.addEventListener('DOMContentLoaded', () => APP.init());

// 窗口大小变化时重绘图表
window.addEventListener('resize', () => {
  Object.values(APP.charts).forEach(c => c && c.resize && c.resize());
});
