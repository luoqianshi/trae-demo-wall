(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: Building Comparison ---
  var chartBuilding = echarts.init(document.getElementById('chart-building'), null, { renderer: 'svg' });
  chartBuilding.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['1号楼', '2号楼', '3号楼', '4号楼'],
      bottom: 0,
      textStyle: { color: muted }
    },
    grid: {
      left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value',
      name: '用电量 (kWh)',
      nameTextStyle: { color: muted },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } },
      axisLabel: { color: muted }
    },
    color: [accent, accent2, muted, accent + '99'],
    series: [
      { name: '1号楼', type: 'bar', data: [320, 302, 301, 334, 390, 330, 320], barWidth: '15%' },
      { name: '2号楼', type: 'bar', data: [220, 182, 191, 234, 290, 230, 210], barWidth: '15%' },
      { name: '3号楼', type: 'bar', data: [150, 232, 201, 154, 190, 180, 170], barWidth: '15%' },
      { name: '4号楼', type: 'bar', data: [98, 112, 130, 145, 160, 140, 120], barWidth: '15%' }
    ]
  });
  window.addEventListener('resize', function() { chartBuilding.resize(); });

  // --- Chart: 24h Load Curve ---
  var chartLoad = echarts.init(document.getElementById('chart-load'), null, { renderer: 'svg' });
  var hours = [];
  var loadData = [];
  var loadData2 = [];
  for (var i = 0; i < 24; i++) {
    hours.push(i + ':00');
    // Simulate daily load curve with peaks at 12:00 and 21:00
    var base = 15 + Math.sin((i - 6) / 18 * Math.PI * 2) * 25;
    if (i >= 11 && i <= 13) base += 20;
    if (i >= 20 && i <= 22) base += 25;
    loadData.push(Math.max(5, Math.round(base + Math.random() * 8)));
    loadData2.push(Math.max(5, Math.round(base * 0.85 + Math.random() * 6)));
  }
  chartLoad.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true
    },
    legend: {
      data: ['今日负荷', '昨日负荷'],
      bottom: 0,
      textStyle: { color: muted }
    },
    grid: {
      left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: hours,
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value',
      name: '功率 (kW)',
      nameTextStyle: { color: muted },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } },
      axisLabel: { color: muted }
    },
    color: [accent, accent2],
    series: [
      {
        name: '今日负荷',
        type: 'line',
        smooth: true,
        data: loadData,
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: accent + '40' },
              { offset: 1, color: accent + '05' }
            ]
          }
        },
        lineStyle: { width: 3 }
      },
      {
        name: '昨日负荷',
        type: 'line',
        smooth: true,
        data: loadData2,
        lineStyle: { width: 2, type: 'dashed' }
      }
    ]
  });
  window.addEventListener('resize', function() { chartLoad.resize(); });

  // --- Chart: Pie Distribution ---
  var chartPie = echarts.init(document.getElementById('chart-pie'), null, { renderer: 'svg' });
  chartPie.setOption({
    animation: false,
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      formatter: '{b}: {c} kWh ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: muted }
    },
    color: [accent, accent2, muted, accent + 'cc', accent2 + 'cc', accent + '66'],
    series: [
      {
        name: '用电占比',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: bg2,
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: ink
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 435, name: '1号楼' },
          { value: 310, name: '2号楼' },
          { value: 234, name: '3号楼' },
          { value: 135, name: '4号楼' },
          { value: 148, name: '5号楼' },
          { value: 92, name: '6号楼' }
        ]
      }
    ]
  });
  window.addEventListener('resize', function() { chartPie.resize(); });
})();
