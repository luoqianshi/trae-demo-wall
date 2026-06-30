(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: Time Compare ---
  var chart1 = echarts.init(document.getElementById('chart-time-compare'), null, { renderer: 'svg' });
  chart1.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['传统方式', 'AI 方式'],
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
      data: ['拍照/抄写', '识别/整理', '分类归档', '生成复习计划', '总耗时'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value',
      name: '时间（分钟）',
      nameTextStyle: { color: muted },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    series: [
      {
        name: '传统方式',
        type: 'bar',
        data: [5, 15, 5, 5, 30],
        itemStyle: { color: muted + '80', borderRadius: [4, 4, 0, 0] },
        barWidth: '30%'
      },
      {
        name: 'AI 方式',
        type: 'bar',
        data: [0.5, 1, 0.5, 1, 3],
        itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] },
        barWidth: '30%'
      }
    ]
  });
  window.addEventListener('resize', function() { chart1.resize(); });

  // --- Chart: Growth ---
  var chart2 = echarts.init(document.getElementById('chart-growth'), null, { renderer: 'svg' });
  chart2.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true
    },
    legend: {
      data: ['注册用户', '月活跃用户'],
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
      data: ['第1月', '第2月', '第3月', '第4月', '第5月', '第6月', '第7月', '第8月', '第9月', '第10月', '第11月', '第12月'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value',
      name: '用户数（人）',
      nameTextStyle: { color: muted },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    series: [
      {
        name: '注册用户',
        type: 'line',
        data: [500, 1200, 2800, 5500, 9000, 14000, 20000, 28000, 38000, 50000, 65000, 85000],
        smooth: true,
        itemStyle: { color: accent },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: accent + '40' },
              { offset: 1, color: accent + '05' }
            ]
          }
        },
        lineStyle: { width: 3 }
      },
      {
        name: '月活跃用户',
        type: 'line',
        data: [300, 800, 2000, 4000, 6500, 10000, 15000, 21000, 29000, 38000, 50000, 65000],
        smooth: true,
        itemStyle: { color: accent2 },
        lineStyle: { width: 3, type: 'dashed' }
      }
    ]
  });
  window.addEventListener('resize', function() { chart2.resize(); });
})();
