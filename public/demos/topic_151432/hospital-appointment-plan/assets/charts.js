(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var success = style.getPropertyValue('--success').trim();

  // --- Chart: Time Comparison ---
  var chartTime = echarts.init(document.getElementById('chart-time-compare'), null, { renderer: 'svg' });
  chartTime.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      appendToBody: true
    },
    legend: {
      data: ['传统流程', '新流程'],
      top: 0,
      textStyle: { color: ink }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['排队挂号', '候诊等待', '医生问诊', '缴费检查', '等报告', '回诊/离院'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value',
      name: '分钟',
      nameTextStyle: { color: muted },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } },
      axisLabel: { color: muted }
    },
    series: [
      {
        name: '传统流程',
        type: 'bar',
        data: [30, 180, 10, 20, 120, 15],
        itemStyle: { color: accent2 + 'cc', borderRadius: [4, 4, 0, 0] },
        barWidth: '35%'
      },
      {
        name: '新流程',
        type: 'bar',
        data: [5, 15, 6, 15, 5, 10],
        itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] },
        barWidth: '35%'
      }
    ]
  });
  window.addEventListener('resize', function() { chartTime.resize(); });

  // --- Chart: Key Metrics Improvement ---
  var chartMetrics = echarts.init(document.getElementById('chart-metrics'), null, { renderer: 'svg' });
  chartMetrics.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      appendToBody: true,
      formatter: function(params) {
        var result = params[0].name + '<br/>';
        params.forEach(function(item) {
          result += item.marker + ' ' + item.seriesName + ': ' + item.value + (item.seriesName === '改善幅度' ? '%' : '') + '<br/>';
        });
        return result;
      }
    },
    legend: {
      data: ['改善前', '改善后', '改善幅度'],
      top: 0,
      textStyle: { color: ink }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['患者院内等待时间', '单次接诊时长', '半日接诊量', '候诊区人流密度', '患者到院次数'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, interval: 0, rotate: 15 }
    },
    yAxis: [
      {
        type: 'value',
        name: '数值',
        nameTextStyle: { color: muted },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } },
        axisLabel: { color: muted }
      },
      {
        type: 'value',
        name: '改善幅度 %',
        nameTextStyle: { color: muted },
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: muted, formatter: '{value}%' }
      }
    ],
    series: [
      {
        name: '改善前',
        type: 'bar',
        data: [240, 10, 35, 35, 2.5],
        itemStyle: { color: accent2 + '99', borderRadius: [4, 4, 0, 0] },
        barWidth: '25%'
      },
      {
        name: '改善后',
        type: 'bar',
        data: [72, 5, 49, 14, 1],
        itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] },
        barWidth: '25%'
      },
      {
        name: '改善幅度',
        type: 'line',
        yAxisIndex: 1,
        data: [70, 50, 40, 60, 60],
        itemStyle: { color: success },
        lineStyle: { color: success, width: 2 },
        symbol: 'circle',
        symbolSize: 8,
        label: {
          show: true,
          formatter: '{c}%',
          color: success,
          fontWeight: 'bold'
        }
      }
    ]
  });
  window.addEventListener('resize', function() { chartMetrics.resize(); });
})();
