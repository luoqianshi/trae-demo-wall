// assets/charts.js
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart 1: Content Dimension Distribution ---
  var chart1 = echarts.init(document.getElementById('chart-dim-pie'), null, { renderer: 'svg' });
  chart1.setOption({
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 11, color: muted } },
    series: [{
      type: 'pie', radius: ['35%', '65%'], center: ['50%', '42%'],
      label: { color: ink, fontSize: 11 },
      labelLine: { lineStyle: { color: rule } },
      data: [
        { value: 30, name: '地域文化', itemStyle: { color: accent } },
        { value: 25, name: '历史人物', itemStyle: { color: accent2 } },
        { value: 15, name: '现代人物', itemStyle: { color: '#8b6914' } },
        { value: 15, name: '美食', itemStyle: { color: '#c0392b' } },
        { value: 10, name: '自然地理', itemStyle: { color: '#5d8aa8' } },
        { value: 5, name: '历史沿革', itemStyle: { color: muted } }
      ]
    }]
  });
  window.addEventListener('resize', function() { chart1.resize(); });

  // --- Chart 2: Data Scale Comparison ---
  var chart2 = echarts.init(document.getElementById('chart-scale-bar'), null, { renderer: 'svg' });
  chart2.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true, axisPointer: { type: 'shadow' } },
    legend: { bottom: 0, textStyle: { fontSize: 11, color: muted }, data: ['传统人工', 'AI 辅助'] },
    grid: { top: 30, left: 80, right: 30, bottom: 40 },
    xAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } } },
    yAxis: {
      type: 'category', data: ['镇/村深度内容', '县级基础数据', '市级文化数据', '省级概览数据'],
      axisLabel: { color: ink, fontSize: 11 }, axisLine: { lineStyle: { color: rule } }
    },
    series: [
      { name: '传统人工', type: 'bar', data: [1800, 2851, 334, 34], itemStyle: { color: muted }, barWidth: 12 },
      { name: 'AI 辅助', type: 'bar', data: [180, 285, 34, 4], itemStyle: { color: accent }, barWidth: 12 }
    ]
  });
  window.addEventListener('resize', function() { chart2.resize(); });

  // --- Chart 3: Revenue Model Radar ---
  var chart3 = echarts.init(document.getElementById('chart-revenue-radar'), null, { renderer: 'svg' });
  chart3.setOption({
    animation: false,
    tooltip: { appendToBody: true },
    radar: {
      indicator: [
        { name: '变现速度', max: 10 },
        { name: '市场规模', max: 10 },
        { name: '利润率', max: 10 },
        { name: '技术门槛', max: 10 },
        { name: '可扩展性', max: 10 }
      ],
      axisName: { color: ink, fontSize: 11 },
      splitLine: { lineStyle: { color: rule } },
      splitArea: { areaStyle: { color: [bg2, 'transparent'] } },
      axisLine: { lineStyle: { color: rule } }
    },
    series: [{
      type: 'radar', areaStyle: { opacity: 0.15 },
      data: [
        { value: [8, 5, 7, 3, 4], name: '教育课程包', itemStyle: { color: accent } },
        { value: [6, 8, 6, 5, 6], name: '政府数字名片', itemStyle: { color: accent2 } },
        { value: [4, 9, 8, 7, 9], name: '文化数据API', itemStyle: { color: '#5d8aa8' } },
        { value: [3, 7, 9, 8, 7], name: '文化IP授权', itemStyle: { color: '#8b6914' } }
      ]
    }],
    legend: { bottom: 0, textStyle: { fontSize: 11, color: muted } }
  });
  window.addEventListener('resize', function() { chart3.resize(); });

  // --- Chart 4: User Retention Funnel ---
  var chart4 = echarts.init(document.getElementById('chart-retention-funnel'), null, { renderer: 'svg' });
  chart4.setOption({
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c}%' },
    series: [{
      type: 'funnel', left: '10%', right: '10%', top: 20, bottom: 40,
      label: { color: ink, fontSize: 11, formatter: '{b}\n{c}%' },
      labelLine: { lineStyle: { color: rule } },
      data: [
        { value: 100, name: '首次访问', itemStyle: { color: accent } },
        { value: 65, name: '浏览城市/县区', itemStyle: { color: accent2 } },
        { value: 40, name: '设为家乡', itemStyle: { color: '#c0392b' } },
        { value: 30, name: '每日一县打开', itemStyle: { color: '#8b6914' } },
        { value: 20, name: '分享名片', itemStyle: { color: '#5d8aa8' } },
        { value: 15, name: '7日回访', itemStyle: { color: muted } }
      ]
    }]
  });
  window.addEventListener('resize', function() { chart4.resize(); });
})();
