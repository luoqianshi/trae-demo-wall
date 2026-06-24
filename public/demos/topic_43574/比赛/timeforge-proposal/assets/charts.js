// assets/charts.js
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: Radar ---
  var radarChart = echarts.init(document.getElementById('chart-radar'), null, { renderer: 'svg' });
  radarChart.setOption({
    animation: false,
    tooltip: {
      trigger: 'item',
      appendToBody: true
    },
    legend: {
      data: ['TimeForge', '传统待办工具', '日历应用', 'Forest/Focus'],
      bottom: 0,
      textStyle: { color: ink, fontSize: 13 }
    },
    radar: {
      center: ['50%', '50%'],
      radius: '65%',
      indicator: [
        { name: '智能任务拆解', max: 100 },
        { name: '自动计划生成', max: 100 },
        { name: '动态进度调整', max: 100 },
        { name: '进度可视化', max: 100 },
        { name: '游戏化激励', max: 100 },
        { name: '复盘分析', max: 100 }
      ],
      axisName: { color: muted, fontSize: 12 },
      splitArea: { show: false },
      splitLine: { lineStyle: { color: rule } },
      axisLine: { lineStyle: { color: rule } }
    },
    series: [{
      type: 'radar',
      data: [
        {
          name: 'TimeForge',
          value: [95, 92, 90, 88, 85, 90],
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: accent, width: 2.5 },
          areaStyle: { color: accent + '20' },
          itemStyle: { color: accent }
        },
        {
          name: '传统待办工具',
          value: [10, 30, 5, 40, 15, 10],
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: muted, width: 2, type: 'dashed' },
          areaStyle: { color: 'transparent' },
          itemStyle: { color: muted }
        },
        {
          name: '日历应用',
          value: [5, 55, 10, 20, 10, 5],
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#94A3B8', width: 2, type: 'dashed' },
          areaStyle: { color: 'transparent' },
          itemStyle: { color: '#94A3B8' }
        },
        {
          name: 'Forest/Focus',
          value: [5, 15, 5, 35, 80, 25],
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: accent2, width: 2, type: 'dashed' },
          areaStyle: { color: 'transparent' },
          itemStyle: { color: accent2 }
        }
      ]
    }]
  });
  window.addEventListener('resize', function() { radarChart.resize(); });
})();