(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: Revenue Forecast ---
  var chartRevenue = echarts.init(document.getElementById('chart-revenue'), null, { renderer: 'svg' });
  chartRevenue.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: 'rgba(19, 24, 41, 0.95)',
      borderColor: rule,
      textStyle: { color: ink, fontSize: 13 }
    },
    legend: {
      data: ['SaaS订阅', '按人数计费', '定制化服务', '模板市场'],
      top: 0,
      textStyle: { color: muted, fontSize: 12 },
      itemWidth: 16,
      itemHeight: 10,
      itemGap: 20
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['第1年', '第2年', '第3年'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 12 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '万元',
      nameTextStyle: { color: muted, fontSize: 11 },
      axisLine: { show: false },
      axisLabel: { color: muted, fontSize: 11 },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    series: [
      {
        name: 'SaaS订阅',
        type: 'bar',
        stack: 'total',
        barWidth: '40%',
        data: [80, 250, 600],
        itemStyle: { color: accent, borderRadius: [0, 0, 0, 0] }
      },
      {
        name: '按人数计费',
        type: 'bar',
        stack: 'total',
        data: [40, 120, 300],
        itemStyle: { color: accent2 }
      },
      {
        name: '定制化服务',
        type: 'bar',
        stack: 'total',
        data: [20, 80, 200],
        itemStyle: { color: '#A855F7' }
      },
      {
        name: '模板市场',
        type: 'bar',
        stack: 'total',
        data: [5, 30, 100],
        itemStyle: { color: '#F59E0B', borderRadius: [4, 4, 0, 0] }
      }
    ]
  });
  window.addEventListener('resize', function() { chartRevenue.resize(); });
})();