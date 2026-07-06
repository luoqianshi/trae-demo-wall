(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var success = style.getPropertyValue('--success').trim();
  var warning = style.getPropertyValue('--warning').trim();

  // --- Chart: Training Growth ---
  var trainingChart = echarts.init(document.getElementById('training-chart'), null, { renderer: 'svg' });
  trainingChart.setOption({
    animation: true, animationDuration: 600,
    tooltip: { trigger: 'axis', appendToBody: true, backgroundColor: bg2, borderColor: rule, textStyle: { color: ink } },
    legend: { data: ['唱功', '舞蹈', 'Rap'], textStyle: { color: muted }, bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: ['初始'], axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted } },
    yAxis: { type: 'value', max: 100, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
    series: [
      { name: '唱功', type: 'line', data: [75], smooth: true, lineStyle: { color: accent, width: 3 }, itemStyle: { color: accent }, areaStyle: { color: accent + '22' } },
      { name: '舞蹈', type: 'line', data: [60], smooth: true, lineStyle: { color: accent2, width: 3 }, itemStyle: { color: accent2 }, areaStyle: { color: accent2 + '22' } },
      { name: 'Rap', type: 'line', data: [45], smooth: true, lineStyle: { color: accent3, width: 3 }, itemStyle: { color: accent3 }, areaStyle: { color: accent3 + '22' } }
    ]
  });
  window.addEventListener('resize', function() { trainingChart.resize(); });

  // --- Chart: Monthly Audit ---
  var auditChart = echarts.init(document.getElementById('audit-chart'), null, { renderer: 'svg' });
  auditChart.setOption({
    animation: true, animationDuration: 600,
    tooltip: { trigger: 'axis', appendToBody: true, backgroundColor: bg2, borderColor: rule, textStyle: { color: ink } },
    legend: { data: ['唱功', '舞蹈', 'Rap', '综合评分'], textStyle: { color: muted }, bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: [], axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted } },
    yAxis: { type: 'value', max: 100, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
    series: [
      { name: '唱功', type: 'bar', data: [], itemStyle: { color: accent + 'cc' } },
      { name: '舞蹈', type: 'bar', data: [], itemStyle: { color: accent2 + 'cc' } },
      { name: 'Rap', type: 'bar', data: [], itemStyle: { color: accent3 + 'cc' } },
      { name: '综合评分', type: 'line', data: [], smooth: true, lineStyle: { color: success, width: 3 }, itemStyle: { color: success } }
    ]
  });
  window.addEventListener('resize', function() { auditChart.resize(); });

  // --- Chart: Debut Radar ---
  var debutRadar = echarts.init(document.getElementById('debut-radar'), null, { renderer: 'svg' });
  debutRadar.setOption({
    animation: true, animationDuration: 800,
    tooltip: { appendToBody: true, backgroundColor: bg2, borderColor: rule, textStyle: { color: ink } },
    legend: { data: ['你的能力', '团队平均'], textStyle: { color: muted }, bottom: 0 },
    radar: {
      indicator: [
        { name: '唱功', max: 100 }, { name: '舞蹈', max: 100 },
        { name: 'Rap', max: 100 }, { name: '颜值', max: 100 },
        { name: '综艺感', max: 100 }, { name: '创作力', max: 100 }
      ],
      axisName: { color: muted },
      splitArea: { areaStyle: { color: [bg2, bg2] } },
      axisLine: { lineStyle: { color: rule } },
      splitLine: { lineStyle: { color: rule } }
    },
    series: [{
      type: 'radar',
      data: [
        { value: [90, 75, 60, 85, 70, 55], name: '你的能力', itemStyle: { color: accent }, areaStyle: { color: accent + '33' } },
        { value: [70, 70, 65, 75, 65, 50], name: '团队平均', itemStyle: { color: accent2 }, areaStyle: { color: accent2 + '33' } }
      ]
    }]
  });
  window.addEventListener('resize', function() { debutRadar.resize(); });

  // --- Chart: Fan Growth ---
  var fanChart = echarts.init(document.getElementById('fan-chart'), null, { renderer: 'svg' });
  fanChart.setOption({
    animation: true, animationDuration: 800,
    tooltip: { trigger: 'axis', appendToBody: true, backgroundColor: bg2, borderColor: rule, textStyle: { color: ink } },
    legend: { data: ['韩国', '日本', '中国', '东南亚', '欧美'], textStyle: { color: muted }, bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: ['出道','3个月','6个月','1年','2年','3年'], axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted } },
    yAxis: { type: 'value', name: '粉丝(万)', axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
    series: [
      { name: '韩国', type: 'line', stack: 'total', areaStyle: {}, data: [5,12,25,45,80,120], itemStyle: { color: accent } },
      { name: '日本', type: 'line', stack: 'total', areaStyle: {}, data: [2,8,18,35,60,90], itemStyle: { color: accent2 } },
      { name: '中国', type: 'line', stack: 'total', areaStyle: {}, data: [3,10,22,40,70,100], itemStyle: { color: accent3 } },
      { name: '东南亚', type: 'line', stack: 'total', areaStyle: {}, data: [1,5,12,25,45,70], itemStyle: { color: success } },
      { name: '欧美', type: 'line', stack: 'total', areaStyle: {}, data: [0.5,2,6,15,30,50], itemStyle: { color: warning } }
    ]
  });
  window.addEventListener('resize', function() { fanChart.resize(); });

  // --- Chart: Parallel Universe Comparison ---
  var parallelChart = echarts.init(document.getElementById('parallel-chart'), null, { renderer: 'svg' });
  parallelChart.setOption({
    animation: true, animationDuration: 800,
    tooltip: { trigger: 'axis', appendToBody: true, backgroundColor: bg2, borderColor: rule, textStyle: { color: ink } },
    legend: { data: ['宇宙A:主唱', '宇宙B:主舞', '宇宙C:Rap', '宇宙D:综艺', '宇宙E:演员'], textStyle: { color: muted }, bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: ['6个月','1年','2年','3年','5年','7年'], axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted } },
    yAxis: { type: 'value', name: '年收入(亿韩元)', axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
    series: [
      { name: '宇宙A:主唱', type: 'line', data: [0.5,2,5,8,12.5,15], smooth: true, lineStyle: { color: accent, width: 3 }, itemStyle: { color: accent } },
      { name: '宇宙B:主舞', type: 'line', data: [0.3,1.5,4,9,15.8,18], smooth: true, lineStyle: { color: accent2, width: 3 }, itemStyle: { color: accent2 } },
      { name: '宇宙C:Rap', type: 'line', data: [0.4,1.8,3.5,6,9.6,12], smooth: true, lineStyle: { color: accent3, width: 3 }, itemStyle: { color: accent3 } },
      { name: '宇宙D:综艺', type: 'line', data: [0.8,3,7,12,18.2,22], smooth: true, lineStyle: { color: success, width: 3 }, itemStyle: { color: success } },
      { name: '宇宙E:演员', type: 'line', data: [0.1,0.5,2,8,22.5,35], smooth: true, lineStyle: { color: warning, width: 3 }, itemStyle: { color: warning } }
    ]
  });
  window.addEventListener('resize', function() { parallelChart.resize(); });

  // --- Exposed update functions ---
  // These read from the global gameState object defined in the main page script
  window.updateTrainingChart = function() {
    if (typeof gameState === 'undefined') return;
    var td = gameState.trainingData;
    if (!td || !td.weeks || td.weeks.length === 0) return;
    trainingChart.setOption({
      xAxis: { data: td.weeks },
      series: [
        { name: '唱功', data: td.vocal },
        { name: '舞蹈', data: td.dance },
        { name: 'Rap', data: td.rap }
      ]
    });
  };

  window.updateAuditChart = function() {
    if (typeof gameState === 'undefined') return;
    var ah = gameState.auditHistory;
    if (!ah || ah.length === 0) return;
    var months = ah.map(function(a) { return '第' + a.month + '月'; });
    auditChart.setOption({
      xAxis: { data: months },
      series: [
        { name: '唱功', data: ah.map(function(a) { return a.vocal; }) },
        { name: '舞蹈', data: ah.map(function(a) { return a.dance; }) },
        { name: 'Rap', data: ah.map(function(a) { return a.rap; }) },
        { name: '综合评分', data: ah.map(function(a) { return a.overall; }) }
      ]
    });
  };
})();
