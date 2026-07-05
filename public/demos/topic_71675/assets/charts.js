(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Roadmap Gantt ---
  var chartEl = document.getElementById('chart-roadmap');
  if (chartEl) {
    var categories = ['Scale 扩展', 'GA 上线', 'Beta 公测', 'MVP 验证'];
    var data = [
      { name: 'MVP：2D小镇+6NPC+端到端语音+任务+定级+报告', value: [0, 3], itemStyle: { color: accent } },
      { name: 'Beta：剧情分支+A/B验证+字幕优化+成本优化', value: [3, 5], itemStyle: { color: accent2 } },
      { name: 'GA：付费订阅+成就+SLA+日语启动', value: [5, 6], itemStyle: { color: accent } },
      { name: 'Scale：3D/多人/UGC/多语种', value: [6, 9], itemStyle: { color: accent2 } }
    ];

    var chart = echarts.init(chartEl, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      tooltip: {
        appendToBody: true,
        formatter: function(p) {
          return p.data.name + '<br/>周期：第 ' + p.data.value[0] + ' - ' + p.data.value[1] + ' 月';
        }
      },
      grid: { left: 130, right: 40, top: 30, bottom: 40 },
      xAxis: {
        type: 'value',
        min: 0, max: 9,
        interval: 1,
        axisLabel: { color: muted, formatter: '{value} 月' },
        axisLine: { lineStyle: { color: rule } },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLabel: { color: ink, fontWeight: 600 },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false }
      },
      series: [{
        type: 'custom',
        renderItem: function(params, api) {
          var cat = api.value(0);
          var start = api.coord([api.value(1), cat]);
          var end = api.coord([api.value(2), cat]);
          var height = api.size([0, 1])[1] * 0.5;
          return {
            type: 'rect',
            shape: {
              x: start[0], y: start[1] - height / 2,
              width: end[0] - start[0], height: height, r: 4
            },
            style: api.style()
          };
        },
        encode: { x: [1, 2], y: 0 },
        data: data.map(function(d, i) {
          return { name: d.name, value: [i, d.value[0], d.value[1]], itemStyle: d.itemStyle };
        })
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }
})();
