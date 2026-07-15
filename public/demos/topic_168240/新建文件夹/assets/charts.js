(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: Test Pass Trend ---
  var chartTests = echarts.init(document.getElementById('chart-tests'), null, { renderer: 'svg' });
  chartTests.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true, backgroundColor: bg2, borderColor: rule, textStyle: { color: ink } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['v0.6.0', 'v0.7.0', 'v0.8.0', 'v0.9.0', 'v0.9.1'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } },
      axisLabel: { color: muted }
    },
    series: [{
      name: '测试通过数',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 10,
      lineStyle: { width: 3, color: accent },
      itemStyle: { color: accent, borderColor: bg2, borderWidth: 2 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: accent + '44' },
            { offset: 1, color: accent + '05' }
          ]
        }
      },
      data: [288, 520, 890, 2109, 2145]
    }]
  });
  window.addEventListener('resize', function() { chartTests.resize(); });

  // --- Chart: Module File Distribution ---
  var chartModules = echarts.init(document.getElementById('chart-modules'), null, { renderer: 'svg' });
  var moduleData = [
    { value: 900, name: 'M1 Agent集群' },
    { value: 500, name: 'M2 技能集群' },
    { value: 400, name: 'M3 端云协同' },
    { value: 500, name: 'M4 场景引擎' },
    { value: 400, name: 'M7 积木编排' },
    { value: 700, name: 'M8 控制塔' },
    { value: 400, name: 'M9 开发者工坊' },
    { value: 350, name: 'M10 系统卫士' },
    { value: 450, name: 'M11 MCP总线' },
    { value: 400, name: 'M12 安全盾' },
    { value: 600, name: 'Frontend 前端' },
    { value: 500, name: 'Shared/Docs/Scripts' }
  ];
  chartModules.setOption({
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true, backgroundColor: bg2, borderColor: rule, textStyle: { color: ink } },
    legend: {
      type: 'scroll', orient: 'vertical', right: 10, top: 20, bottom: 20,
      textStyle: { color: muted },
      pageTextStyle: { color: muted }
    },
    series: [{
      name: '代码文件数',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: bg2, borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold', color: ink }
      },
      labelLine: { show: false },
      data: moduleData,
      color: [
        accent, accent2, '#06b6d4', '#10b981', '#f59e0b',
        '#ef4444', '#ec4899', '#8b5cf6', '#6366f1', '#14b8a6',
        '#84cc16', '#a855f7'
      ]
    }]
  });
  window.addEventListener('resize', function() { chartModules.resize(); });
})();
