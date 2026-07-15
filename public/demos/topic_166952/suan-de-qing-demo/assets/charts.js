(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var success = style.getPropertyValue('--success').trim();

  var progressChart = null;
  var pieChart = null;

  function renderProgressChart() {
    var el = document.getElementById('chart-progress');
    if (!el) return;
    if (progressChart) { progressChart.dispose(); progressChart = null; }
    progressChart = echarts.init(el, null, { renderer: 'svg' });

    var months = ['1月','2月','3月','4月','5月','6月','7月'];
    var debt = [50000, 49200, 48100, 47300, 46500, 44500, 42860];
    var paid = [0, 800, 1900, 2700, 3500, 5500, 7140];

    progressChart.setOption({
      animation: false,
      grid: { top: 20, right: 12, bottom: 24, left: 40 },
      legend: {
        show: true,
        top: 0,
        right: 0,
        textStyle: { fontSize: 10, color: muted },
        itemWidth: 12,
        itemHeight: 8
      },
      tooltip: { trigger: 'axis', appendToBody: true },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { fontSize: 10, color: muted },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10, color: muted, formatter: function(v) { return (v/1000) + 'k'; } },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      series: [
        {
          name: '总负债',
          type: 'line',
          data: debt,
          smooth: true,
          lineStyle: { color: accent, width: 2.5 },
          itemStyle: { color: accent },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: accent + '33' },
                { offset: 1, color: accent + '05' }
              ]
            }
          },
          symbol: 'circle',
          symbolSize: 5
        },
        {
          name: '已还本金',
          type: 'line',
          data: paid,
          smooth: true,
          lineStyle: { color: success, width: 2.5 },
          itemStyle: { color: success },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: success + '33' },
                { offset: 1, color: success + '05' }
              ]
            }
          },
          symbol: 'circle',
          symbolSize: 5
        }
      ]
    });
  }

  function renderPieChart() {
    var el = document.getElementById('chart-pie');
    if (!el) return;
    if (pieChart) { pieChart.dispose(); pieChart = null; }
    pieChart = echarts.init(el, null, { renderer: 'svg' });

    pieChart.setOption({
      animation: false,
      tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: ¥{c} ({d}%)' },
      legend: {
        orient: 'vertical',
        right: 4,
        top: 'center',
        textStyle: { fontSize: 10, color: muted },
        itemWidth: 10,
        itemHeight: 10
      },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['32%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4, borderColor: bg2, borderWidth: 2 },
        label: { show: false },
        data: [
          { value: 18500, name: '某消费金融', itemStyle: { color: '#1a5f7a' } },
          { value: 12360, name: '某互联网银行', itemStyle: { color: '#e8913a' } },
          { value: 8000, name: '某银行信用卡', itemStyle: { color: '#7c3aed' } },
          { value: 4000, name: '某电商平台', itemStyle: { color: '#2aa876' } }
        ]
      }]
    });
  }

  window.renderProgressChart = renderProgressChart;
  window.renderPieChart = renderPieChart;

  window.addEventListener('resize', function() {
    if (progressChart) progressChart.resize();
    if (pieChart) pieChart.resize();
  });

  // Initial render
  if (document.getElementById('chart-progress')) renderProgressChart();
})();
