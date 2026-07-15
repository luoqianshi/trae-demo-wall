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
      backgroundColor: bg2,
      borderColor: rule,
      textStyle: { color: ink }
    },
    legend: {
      data: ['订阅收入', '虚拟商品', '增值服务', '广告合作'],
      bottom: 0,
      textStyle: { color: muted }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2', 'Q3', 'Q4'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: {
        color: muted,
        formatter: function(value, index) {
          var years = ['第1年', '', '', '', '第2年', '', '', '', '第3年', '', '', ''];
          return years[index] ? years[index] + '\n' + value : value;
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '万元',
      nameTextStyle: { color: muted },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } },
      axisLabel: { color: muted }
    },
    series: [
      {
        name: '订阅收入',
        type: 'bar',
        stack: 'total',
        data: [5, 12, 25, 40, 60, 85, 110, 140, 180, 220, 260, 300],
        itemStyle: { color: accent }
      },
      {
        name: '虚拟商品',
        type: 'bar',
        stack: 'total',
        data: [2, 5, 12, 20, 35, 50, 70, 90, 120, 150, 180, 210],
        itemStyle: { color: accent2 }
      },
      {
        name: '增值服务',
        type: 'bar',
        stack: 'total',
        data: [1, 3, 6, 10, 15, 22, 30, 40, 50, 65, 80, 95],
        itemStyle: { color: muted }
      },
      {
        name: '广告合作',
        type: 'bar',
        stack: 'total',
        data: [0, 1, 3, 5, 10, 15, 22, 30, 40, 55, 70, 85],
        itemStyle: { color: accent + '80' }
      }
    ]
  });
  window.addEventListener('resize', function() { chartRevenue.resize(); });
})();
