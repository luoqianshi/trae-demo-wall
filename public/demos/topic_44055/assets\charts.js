(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var green = style.getPropertyValue('--green').trim();

  // --- Chart: 月度回测准确率 ---
  var chartBacktest = echarts.init(document.getElementById('chart-backtest'), null, { renderer: 'svg' });

  var months = ['25/01','25/02','25/03','25/04','25/05','25/06','25/07','25/08','25/09','25/10','25/11','25/12','26/01','26/02','26/03','26/04'];
  var pureRule = [43.9, 47.1, 57.0, 51.0, 47.0, 44.2, 45.5, 68.7, 53.0, 52.1, 49.1, 45.1, 48.8, 41.0, 58.4, 40.7];
  var onlineLearn = [50.6, 58.4, 57.0, 57.7, 55.2, 50.5, 55.5, 65.3, 54.3, 56.2, 60.7, 49.4, 58.6, 49.2, 57.1, 59.7];

  var option = {
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      formatter: function(params) {
        var m = params[0].name;
        var r = params[0].value + '%';
        var l = params[1].value + '%';
        var diff = (params[1].value - params[0].value).toFixed(1);
        var sign = diff > 0 ? '+' : '';
        return m + '<br/>纯规则: ' + r + '<br/>在线学习: ' + l + '<br/><b>提升: ' + sign + diff + '%</b>';
      }
    },
    legend: {
      bottom: 0,
      textStyle: { color: muted, fontSize: 13 },
      data: ['纯规则', '在线学习']
    },
    grid: { top: 20, right: 30, bottom: 40, left: 50 },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: rule } },
      axisTick: { show: false },
      axisLabel: { color: muted, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      min: 35,
      max: 75,
      axisLabel: { color: muted, fontSize: 12, formatter: '{value}%' },
      splitLine: { lineStyle: { color: rule } }
    },
    series: [
      {
        name: '纯规则',
        type: 'line',
        data: pureRule,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: muted, width: 2, type: 'dashed' },
        itemStyle: { color: muted },
        areaStyle: { color: muted + '15' }
      },
      {
        name: '在线学习',
        type: 'line',
        data: onlineLearn,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: accent, width: 3 },
        itemStyle: { color: accent },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: accent + '30' },
            { offset: 1, color: accent + '05' }
          ])
        }
      }
    ]
  };

  chartBacktest.setOption(option);
  window.addEventListener('resize', function() { chartBacktest.resize(); });
})();