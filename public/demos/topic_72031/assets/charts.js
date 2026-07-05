// ============================================================
// 周报智析 Dashboard Charts
// All charts use ECharts with dark theme matching the HTML
// ============================================================

window.addEventListener('load', function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim() || '#00d4ff';
  var accent2 = style.getPropertyValue('--accent2').trim() || '#0ea5e9';
  var accent3 = style.getPropertyValue('--accent3').trim() || '#22c55e';
  var accent4 = style.getPropertyValue('--accent4').trim() || '#f59e0b';
  var accent5 = style.getPropertyValue('--accent5').trim() || '#ef4444';
  var ink = style.getPropertyValue('--ink').trim() || '#e8eef5';
  var muted = style.getPropertyValue('--muted').trim() || '#8b9bb4';
  var bg2 = style.getPropertyValue('--bg2').trim() || '#111827';
  var rule = style.getPropertyValue('--rule').trim() || '#1e293b';

  var baseTooltip = {
    backgroundColor: bg2,
    borderColor: rule,
    textStyle: { color: ink }
  };

  var weeks = ['06-06~06-12', '06-13~06-19', '06-20~06-26', '06-27~07-03'];

  // ===== Member data =====
  var memberData = {
    '黄*丽': {
      scores: [
        { week: weeks[0], 产出: 3, 进度: 4, 风险: 3, 协作: 5, 规范: 5, total: 3.75 },
        { week: weeks[1], 产出: 3, 进度: 4, 风险: 3, 协作: 5, 规范: 5, total: 3.75 },
        { week: weeks[2], 产出: 3, 进度: 5, 风险: 3, 协作: 5, 规范: 5, total: 4.00 },
        { week: weeks[3], 产出: 4, 进度: 5, 风险: 5, 协作: 5, 规范: 5, total: 4.70 },
      ],
      avg: { 产出: 3.0, 进度: 4.3, 风险: 3.3, 协作: 5.0, 规范: 5.0, total: 3.83 }
    },
    '李*芳': {
      scores: [
        { week: weeks[0], 产出: 4, 进度: 3, 风险: 4, 协作: 4, 规范: 5, total: 3.85 },
        { week: weeks[1], 产出: 4, 进度: 4, 风险: 4, 协作: 4, 规范: 5, total: 4.10 },
        { week: weeks[2], 产出: 4, 进度: 4, 风险: 3, 协作: 4, 规范: 5, total: 3.95 },
        { week: weeks[3], 产出: 5, 进度: 4, 风险: 4, 协作: 4, 规范: 5, total: 4.35 },
      ],
      avg: { 产出: 4.3, 进度: 3.8, 风险: 3.8, 协作: 4.0, 规范: 5.0, total: 4.06 }
    },
    '王*强': {
      scores: [
        { week: weeks[0], 产出: 4, 进度: 3, 风险: 3, 协作: 3, 规范: 5, total: 3.55 },
        { week: weeks[1], 产出: 4, 进度: 4, 风险: 4, 协作: 3, 规范: 5, total: 3.90 },
        { week: weeks[2], 产出: 4, 进度: 4, 风险: 3, 协作: 4, 规范: 5, total: 3.85 },
        { week: weeks[3], 产出: 4, 进度: 5, 风险: 4, 协作: 4, 规范: 5, total: 4.25 },
      ],
      avg: { 产出: 4.0, 进度: 4.0, 风险: 3.5, 协作: 3.5, 规范: 5.0, total: 3.89 }
    },
    '马*超': {
      scores: [
        { week: weeks[0], 产出: 5, 进度: 4, 风险: 3, 协作: 4, 规范: 5, total: 4.15 },
        { week: weeks[1], 产出: 5, 进度: 4, 风险: 4, 协作: 4, 规范: 5, total: 4.35 },
        { week: weeks[2], 产出: 4, 进度: 5, 风险: 4, 协作: 4, 规范: 5, total: 4.30 },
        { week: weeks[3], 产出: 5, 进度: 4, 风险: 3, 协作: 4, 规范: 5, total: 4.20 },
      ],
      avg: { 产出: 4.8, 进度: 4.3, 风险: 3.5, 协作: 4.0, 规范: 5.0, total: 4.25 }
    },
    '胡*涛': {
      scores: [
        { week: weeks[0], 产出: 5, 进度: 3, 风险: 2, 协作: 3, 规范: 5, total: 3.45 },
        { week: weeks[1], 产出: 5, 进度: 4, 风险: 3, 协作: 3, 规范: 5, total: 3.90 },
        { week: weeks[2], 产出: 4, 进度: 4, 风险: 3, 协作: 4, 规范: 5, total: 3.85 },
        { week: weeks[3], 产出: 5, 进度: 4, 风险: 3, 协作: 3, 规范: 5, total: 3.95 },
      ],
      avg: { 产出: 4.8, 进度: 3.8, 风险: 2.8, 协作: 3.3, 规范: 5.0, total: 3.79 }
    }
  };

  // ============================================================
  // Chart 1: Team Score Trend (Line)
  // ============================================================
  var chart1 = echarts.init(document.getElementById('chart-team-score'), null, { renderer: 'canvas' });
  chart1.setOption({
    tooltip: { trigger: 'axis', ...baseTooltip },
    grid: { left: 40, right: 20, top: 30, bottom: 40 },
    xAxis: { type: 'category', data: weeks, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, fontSize: 11 } },
    yAxis: { type: 'value', min: 0, max: 5, axisLine: { show: false }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
    series: [{
      data: [3.73, 3.87, 3.87, 3.91],
      type: 'line',
      smooth: true,
      lineStyle: { color: accent, width: 3 },
      itemStyle: { color: accent },
      symbolSize: 10,
      label: { show: true, position: 'top', color: ink, fontSize: 12, formatter: '{c}' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: accent + '40' }, { offset: 1, color: accent + '00' }] } }
    }]
  });
  window.addEventListener('resize', function() { chart1.resize(); });

  // ============================================================
  // Chart 2: Submit Rate Trend (Bar)
  // ============================================================
  var chart2 = echarts.init(document.getElementById('chart-submit-rate'), null, { renderer: 'canvas' });
  chart2.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}<br/>提交率: {c}%', ...baseTooltip },
    grid: { left: 40, right: 20, top: 30, bottom: 40 },
    xAxis: { type: 'category', data: weeks, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, fontSize: 11 } },
    yAxis: { type: 'value', min: 0, max: 100, axisLine: { show: false }, axisLabel: { color: muted, formatter: '{value}%' }, splitLine: { lineStyle: { color: rule } } },
    series: [{
      data: [86.7, 86.7, 93.3, 90.0],
      type: 'bar',
      barWidth: '50%',
      itemStyle: { color: accent3, borderRadius: [6, 6, 0, 0] },
      label: { show: true, position: 'top', color: ink, formatter: '{c}%' }
    }]
  });
  window.addEventListener('resize', function() { chart2.resize(); });

  // ============================================================
  // Chart 3: Requirements & Completed Trend (Stacked Bar + Line)
  // ============================================================
  var chart3 = echarts.init(document.getElementById('chart-req-completed'), null, { renderer: 'canvas' });
  chart3.setOption({
    tooltip: { trigger: 'axis', ...baseTooltip },
    legend: { data: ['唯一需求', '唯一工单', '已完成'], textStyle: { color: muted }, top: 0 },
    grid: { left: 40, right: 20, top: 40, bottom: 40 },
    xAxis: { type: 'category', data: weeks, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, fontSize: 11 } },
    yAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
    series: [
      { name: '唯一需求', type: 'bar', stack: 'total', data: [15, 13, 14, 15], itemStyle: { color: accent4 }, barWidth: '40%' },
      { name: '唯一工单', type: 'bar', stack: 'total', data: [5, 4, 3, 4], itemStyle: { color: accent2 } },
      { name: '已完成', type: 'line', data: [0, 0, 0, 2], lineStyle: { color: accent5, width: 3 }, itemStyle: { color: accent5 }, symbolSize: 10 }
    ]
  });
  window.addEventListener('resize', function() { chart3.resize(); });

  // ============================================================
  // Chart 4: Anomaly Trend (Bar)
  // ============================================================
  var chart4 = echarts.init(document.getElementById('chart-anomaly'), null, { renderer: 'canvas' });
  chart4.setOption({
    tooltip: { trigger: 'axis', ...baseTooltip },
    grid: { left: 40, right: 20, top: 30, bottom: 40 },
    xAxis: { type: 'category', data: weeks, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, fontSize: 11 } },
    yAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
    series: [{
      data: [2, 3, 0, 3],
      type: 'bar',
      barWidth: '50%',
      itemStyle: {
        color: function(params) { return params.value > 0 ? accent5 : accent3; },
        borderRadius: [6, 6, 0, 0]
      },
      label: { show: true, position: 'top', color: ink }
    }]
  });
  window.addEventListener('resize', function() { chart4.resize(); });

  // ============================================================
  // Chart 5: Member Radar (updated on member switch)
  // ============================================================
  var chart5 = echarts.init(document.getElementById('chart-radar'), null, { renderer: 'canvas' });
  var dims = ['产出', '进度', '风险', '协作', '规范'];

  function renderRadar(memberName) {
    var data = memberData[memberName];
    var latest = data.scores[data.scores.length - 1];
    var avg = data.avg;

    chart5.setOption({
      tooltip: { ...baseTooltip },
      legend: { data: ['本周', '历史均值'], textStyle: { color: muted }, bottom: 0 },
      radar: {
        indicator: dims.map(function(d) { return { name: d, max: 5 }; }),
        shape: 'polygon',
        splitNumber: 5,
        axisName: { color: ink, fontSize: 13 },
        splitLine: { lineStyle: { color: rule } },
        splitArea: { areaStyle: { color: [bg2, 'transparent'] } },
        axisLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'radar',
        data: [
          {
            value: dims.map(function(d) { return latest[d]; }),
            name: '本周',
            areaStyle: { color: accent + '30' },
            lineStyle: { color: accent, width: 2 },
            itemStyle: { color: accent }
          },
          {
            value: dims.map(function(d) { return avg[d]; }),
            name: '历史均值',
            areaStyle: { color: accent2 + '15' },
            lineStyle: { color: accent2, width: 2, type: 'dashed' },
            itemStyle: { color: accent2 }
          }
        ]
      }]
    }, true);
  }
  renderRadar('黄*丽');
  window.addEventListener('resize', function() { chart5.resize(); });

  // ============================================================
  // Chart 6: Member Score Trend (Line, multi-dimension)
  // ============================================================
  var chart6 = echarts.init(document.getElementById('chart-member-trend'), null, { renderer: 'canvas' });

  function renderMemberTrend(memberName) {
    var data = memberData[memberName];
    var series = dims.map(function(dim) {
      return {
        name: dim,
        type: 'line',
        data: data.scores.map(function(s) { return s[dim]; }),
        symbolSize: 6,
        lineStyle: { width: 2 }
      };
    });
    series.push({
      name: '加权总分',
      type: 'line',
      data: data.scores.map(function(s) { return s.total; }),
      lineStyle: { width: 4, type: 'dashed' },
      symbolSize: 10,
      label: { show: true, position: 'top', color: ink, fontSize: 11, formatter: '{c}' }
    });

    chart6.setOption({
      tooltip: { trigger: 'axis', ...baseTooltip },
      legend: { data: dims.concat(['加权总分']), textStyle: { color: muted, fontSize: 11 }, top: 0, type: 'scroll' },
      color: [accent, accent2, accent4, accent3, accent5, '#a855f7'],
      grid: { left: 40, right: 20, top: 40, bottom: 40 },
      xAxis: { type: 'category', data: weeks, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, fontSize: 10, rotate: 15 } },
      yAxis: { type: 'value', min: 0, max: 5.5, axisLine: { show: false }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
      series: series
    }, true);
  }
  renderMemberTrend('黄*丽');
  window.addEventListener('resize', function() { chart6.resize(); });

  // ============================================================
  // Chart 7: Baseline Comparison (Grouped Bar)
  // ============================================================
  var chart7 = echarts.init(document.getElementById('chart-baseline'), null, { renderer: 'canvas' });

  function renderBaseline(memberName) {
    var data = memberData[memberName];
    var latest = data.scores[data.scores.length - 1];
    var avg = data.avg;

    chart7.setOption({
      tooltip: { trigger: 'axis', ...baseTooltip },
      legend: { data: ['本周', '历史均值'], textStyle: { color: muted }, top: 0 },
      grid: { left: 40, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: dims, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted } },
      yAxis: { type: 'value', min: 0, max: 5.5, axisLine: { show: false }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
      series: [
        {
          name: '本周',
          type: 'bar',
          data: dims.map(function(d) { return latest[d]; }),
          itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] },
          label: { show: true, position: 'top', color: ink, fontSize: 11 }
        },
        {
          name: '历史均值',
          type: 'bar',
          data: dims.map(function(d) { return avg[d]; }),
          itemStyle: { color: accent2, borderRadius: [4, 4, 0, 0] },
          label: { show: true, position: 'top', color: muted, fontSize: 11, formatter: function(p) { return p.value.toFixed(1); } }
        }
      ]
    }, true);
  }
  renderBaseline('黄*丽');
  window.addEventListener('resize', function() { chart7.resize(); });

  // ============================================================
  // Chart 8: Requirement Progress Trend (Area)
  // ============================================================
  var chart8 = echarts.init(document.getElementById('chart-req-progress'), null, { renderer: 'canvas' });
  chart8.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}<br/>进度: {c}%', ...baseTooltip },
    grid: { left: 50, right: 30, top: 30, bottom: 50 },
    xAxis: { type: 'category', data: weeks, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, fontSize: 11 } },
    yAxis: { type: 'value', min: 0, max: 105, axisLine: { show: false }, axisLabel: { color: muted, formatter: '{value}%' }, splitLine: { lineStyle: { color: rule } } },
    series: [{
      data: [22, 44, 70, 89],
      type: 'line',
      smooth: true,
      lineStyle: { color: accent, width: 3 },
      itemStyle: { color: accent },
      symbolSize: 14,
      label: { show: true, position: 'top', color: ink, fontSize: 14, formatter: '{c}%' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: accent + '50' }, { offset: 1, color: accent + '00' }] } },
      markLine: { data: [{ yAxis: 100, lineStyle: { color: accent3, type: 'dashed' }, label: { formatter: '完成线', color: accent3 } }] }
    }]
  });
  window.addEventListener('resize', function() { chart8.resize(); });

  // ============================================================
  // Chart 9: Anomaly by Type (Pie)
  // ============================================================
  var chart9 = echarts.init(document.getElementById('chart-anomaly-type'), null, { renderer: 'canvas' });
  chart9.setOption({
    tooltip: { trigger: 'item', ...baseTooltip },
    legend: { orient: 'vertical', left: 'left', textStyle: { color: muted, fontSize: 11 } },
    color: [accent5, accent4, accent2, accent3, '#a855f7'],
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      data: [
        { value: 3, name: '连续未提交' },
        { value: 3, name: '新增风险' },
        { value: 1, name: '进度回退' },
        { value: 1, name: '停滞' },
      ],
      label: { color: ink, fontSize: 12 },
      labelLine: { lineStyle: { color: rule } },
      itemStyle: { borderColor: bg2, borderWidth: 2 }
    }]
  });
  window.addEventListener('resize', function() { chart9.resize(); });

  // ============================================================
  // Chart 10: Anomaly by Severity (Pie)
  // ============================================================
  var chart10 = echarts.init(document.getElementById('chart-anomaly-sev'), null, { renderer: 'canvas' });
  chart10.setOption({
    tooltip: { trigger: 'item', ...baseTooltip },
    legend: { orient: 'vertical', left: 'left', textStyle: { color: muted, fontSize: 11 } },
    color: [accent5, accent4],
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      data: [
        { value: 2, name: '高 (HIGH)' },
        { value: 6, name: '中 (MEDIUM)' },
      ],
      label: { color: ink, fontSize: 12 },
      labelLine: { lineStyle: { color: rule } },
      itemStyle: { borderColor: bg2, borderWidth: 2 }
    }]
  });
  window.addEventListener('resize', function() { chart10.resize(); });

  // ============================================================
  // Tab switching logic
  // ============================================================
  window.switchTab = function(tabName) {
    document.querySelectorAll('.demo-tab').forEach(function(tab) { tab.classList.remove('active'); });
    event.target.classList.add('active');
    document.querySelectorAll('.demo-panel').forEach(function(panel) { panel.classList.remove('active'); });
    document.getElementById('panel-' + tabName).classList.add('active');
    // Trigger resize for charts that were hidden
    setTimeout(function() {
      [chart1, chart2, chart3, chart4, chart5, chart6, chart7, chart8, chart9, chart10].forEach(function(c) { c.resize(); });
    }, 100);
  };

  // ============================================================
  // Member switching logic
  // ============================================================
  window.switchMember = function(memberName) {
    document.querySelectorAll('.member-chip').forEach(function(chip) { chip.classList.remove('active'); });
    event.target.classList.add('active');
    renderRadar(memberName);
    renderMemberTrend(memberName);
    renderBaseline(memberName);
  };

});

