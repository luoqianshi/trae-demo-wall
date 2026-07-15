// assets/charts.js
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var yellow = style.getPropertyValue('--yellow').trim();
  var blue = style.getPropertyValue('--blue').trim();
  var purple = style.getPropertyValue('--purple').trim();

  // --- Chart: Market Size Trend ---
  var chartMarket = echarts.init(document.getElementById('chart-market'), null, { renderer: 'svg' });
  chartMarket.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: '#fff',
      borderColor: rule,
      borderRadius: 12,
      textStyle: { color: ink, fontSize: 13 }
    },
    legend: {
      data: ['儿童齿科与口腔护理', '龋齿检测辅助系统'],
      bottom: 0,
      textStyle: { color: muted, fontSize: 12 },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 20
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '12%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['2020', '2021', '2022', '2023', '2024', '2025E'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 12 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '亿元',
      nameTextStyle: { color: muted, fontSize: 12 },
      axisLine: { show: false },
      axisLabel: { color: muted, fontSize: 12 },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    series: [
      {
        name: '儿童齿科与口腔护理',
        type: 'bar',
        data: [129.8, 155.2, 182.6, 231.5, 268.4, 310.2],
        barWidth: '30%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: accent },
              { offset: 1, color: '#00CEC9' }
            ]
          },
          borderRadius: [8, 8, 0, 0]
        }
      },
      {
        name: '龋齿检测辅助系统',
        type: 'line',
        data: [72.3, 85.1, 98.6, 108.2, 125.0, 144.5],
        smooth: true,
        symbol: 'circle',
        symbolSize: 10,
        lineStyle: { color: accent2, width: 3 },
        itemStyle: { color: accent2, borderColor: '#fff', borderWidth: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: accent2 + '40' },
              { offset: 1, color: accent2 + '08' }
            ]
          }
        }
      }
    ]
  });
  window.addEventListener('resize', function() { chartMarket.resize(); });
})();
