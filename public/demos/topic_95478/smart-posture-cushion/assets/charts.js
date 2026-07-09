(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart 1: 年龄分布 ---
  var chart1 = echarts.init(document.getElementById('chart-age'), null, { renderer: 'svg' });
  chart1.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    legend: {
      data: ['2020年', '2024年'],
      textStyle: { color: muted },
      top: 0
    },
    grid: { left: '8%', right: '8%', bottom: '10%', top: '15%' },
    xAxis: {
      type: 'category',
      data: ['18-25岁', '26-35岁', '36-45岁', '46-55岁', '56-65岁', '65岁+'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      name: '占比 (%)',
      nameTextStyle: { color: muted, fontSize: 12 },
      axisLine: { show: false },
      axisLabel: { color: muted, fontSize: 12 },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    series: [
      {
        name: '2020年',
        type: 'bar',
        data: [8, 22, 28, 24, 12, 6],
        itemStyle: { color: accent2, borderRadius: [4, 4, 0, 0] },
        barWidth: '30%'
      },
      {
        name: '2024年',
        type: 'bar',
        data: [15, 31, 26, 18, 7, 3],
        itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] },
        barWidth: '30%'
      }
    ]
  });
  window.addEventListener('resize', function() { chart1.resize(); });

  // --- Chart 2: 市场规模 ---
  var chart2 = echarts.init(document.getElementById('chart-market'), null, { renderer: 'svg' });
  chart2.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    legend: {
      data: ['市场规模', '同比增长率'],
      textStyle: { color: muted },
      top: 0
    },
    grid: { left: '10%', right: '10%', bottom: '10%', top: '15%' },
    xAxis: {
      type: 'category',
      data: ['2022', '2023', '2024', '2025', '2026', '2027', '2028'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 12 }
    },
    yAxis: [
      {
        type: 'value',
        name: '亿元',
        nameTextStyle: { color: muted, fontSize: 12 },
        axisLine: { show: false },
        axisLabel: { color: muted, fontSize: 12 },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      {
        type: 'value',
        name: '增长率 %',
        nameTextStyle: { color: muted, fontSize: 12 },
        axisLine: { show: false },
        axisLabel: { color: muted, fontSize: 12 },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '市场规模',
        type: 'bar',
        data: [186, 234, 298, 385, 502, 660, 870],
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: accent },
              { offset: 1, color: accent + '44' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '40%'
      },
      {
        name: '同比增长率',
        type: 'line',
        yAxisIndex: 1,
        data: [25.8, 27.4, 28.9, 29.2, 30.4, 31.5, 31.8],
        itemStyle: { color: accent2 },
        lineStyle: { width: 2, color: accent2 },
        symbol: 'circle',
        symbolSize: 7,
        smooth: true
      }
    ]
  });
  window.addEventListener('resize', function() { chart2.resize(); });
})();
