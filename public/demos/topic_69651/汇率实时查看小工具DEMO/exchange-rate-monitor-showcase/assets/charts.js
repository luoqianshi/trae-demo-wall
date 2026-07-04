(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var bg = style.getPropertyValue('--bg').trim();

  // --- Chart: USD/JPY 趋势图 ---
  var chartTrend = echarts.init(document.getElementById('chart-usdjpy-trend'), null, { renderer: 'svg' });
  var dates = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07'];
  var rates = [149.2, 152.8, 156.1, 159.7, 161.9, 160.5, 162.6];
  chartTrend.setOption({
    animation: false,
    tooltip: { appendToBody: true, trigger: 'axis' },
    grid: { top: 40, right: 30, bottom: 40, left: 60 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 12 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 148,
      axisLine: { show: false },
      axisLabel: { color: muted, fontSize: 12 },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    series: [{
      type: 'line',
      data: rates,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3, color: accent },
      itemStyle: { color: accent },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: accent + '40' },
            { offset: 1, color: accent + '05' }
          ]
        }
      }
    }]
  });
  window.addEventListener('resize', function() { chartTrend.resize(); });

  // --- Chart: 功能对比雷达图 ---
  var chartRadar = echarts.init(document.getElementById('chart-features-radar'), null, { renderer: 'svg' });
  chartRadar.setOption({
    animation: false,
    tooltip: { appendToBody: true },
    radar: {
      indicator: [
        { name: '实时更新', max: 100 },
        { name: '低资源占用', max: 100 },
        { name: '可定制性', max: 100 },
        { name: '易用性', max: 100 },
        { name: '开源性', max: 100 }
      ],
      shape: 'circle',
      radius: '65%',
      axisName: { color: muted, fontSize: 13 },
      splitArea: { areaStyle: { color: ['transparent', bg2 + '60', 'transparent', bg2 + '60', 'transparent'] } },
      axisLine: { lineStyle: { color: rule } },
      splitLine: { lineStyle: { color: rule } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: [95, 90, 88, 92, 100],
        name: '汇率监控工具',
        lineStyle: { color: accent, width: 2 },
        itemStyle: { color: accent },
        areaStyle: { color: accent + '30' }
      }]
    }]
  });
  window.addEventListener('resize', function() { chartRadar.resize(); });

  // --- Chart: 使用场景统计 ---
  var chartScenario = echarts.init(document.getElementById('chart-scenarios'), null, { renderer: 'svg' });
  chartScenario.setOption({
    animation: false,
    tooltip: { appendToBody: true, trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { top: 30, right: 30, bottom: 40, left: 120 },
    xAxis: {
      type: 'value',
      axisLabel: { color: muted, fontSize: 12 },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } },
      axisLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: ['企业财务', '跨境贸易', '外汇投资', '出国旅行', '个人理财'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 13 },
      axisTick: { show: false }
    },
    series: [{
      type: 'bar',
      data: [35, 28, 45, 52, 60],
      barWidth: 22,
      itemStyle: {
        color: function(p) {
          var colors = [accent, accent2, accent, accent2, accent];
          return colors[p.dataIndex];
        },
        borderRadius: [0, 4, 4, 0]
      }
    }]
  });
  window.addEventListener('resize', function() { chartScenario.resize(); });

})();
