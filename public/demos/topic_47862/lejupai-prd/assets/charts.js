(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart 1: 银发经济市场规模趋势 ---
  var chartMarket = echarts.init(document.getElementById('chart-market'), null, { renderer: 'svg' });
  chartMarket.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      formatter: function(params) {
        var s = params[0].name + '<br/>';
        params.forEach(function(p) {
          s += p.marker + p.seriesName + ': ' + p.value + ' 万亿元<br/>';
        });
        return s;
      }
    },
    legend: {
      data: ['老年用品市场', '银发经济总规模(预测)'],
      bottom: 0,
      textStyle: { color: muted, fontSize: 12 }
    },
    grid: { left: '8%', right: '8%', top: '10%', bottom: '18%' },
    xAxis: {
      type: 'category',
      data: ['2014', '2024', '2025', '2035(预测)', '2050(预测)'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      name: '万亿元',
      nameTextStyle: { color: muted, fontSize: 12 },
      axisLine: { show: false },
      axisLabel: { color: muted, fontSize: 12 },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    series: [
      {
        name: '老年用品市场',
        type: 'bar',
        data: [2.6, 5.4, 6.1, null, null],
        itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] },
        barWidth: '30%'
      },
      {
        name: '银发经济总规模(预测)',
        type: 'line',
        data: [null, null, 7, 30, 50],
        itemStyle: { color: accent2 },
        lineStyle: { width: 3, type: 'dashed' },
        symbol: 'circle',
        symbolSize: 8,
        areaStyle: { color: accent2 + '15' }
      }
    ]
  });
  window.addEventListener('resize', function() { chartMarket.resize(); });

  // --- Chart 2: 竞品功能覆盖矩阵（雷达图） ---
  var chartCompetitor = echarts.init(document.getElementById('chart-competitor'), null, { renderer: 'svg' });
  chartCompetitor.setOption({
    animation: false,
    tooltip: { appendToBody: true },
    legend: {
      data: ['糖豆', '美篇', '红松', '小年糕', '兴趣岛', '乐聚派(目标)'],
      bottom: 0,
      textStyle: { color: muted, fontSize: 11 },
      itemWidth: 12,
      itemHeight: 12
    },
    radar: {
      indicator: [
        { name: '线下活动组织', max: 5 },
        { name: '社交关系链', max: 5 },
        { name: '队长管理工具', max: 5 },
        { name: '积分激励', max: 5 },
        { name: '赛事荣誉', max: 5 },
        { name: '适老化设计', max: 5 },
        { name: '代际联动', max: 5 }
      ],
      center: ['50%', '48%'],
      radius: '60%',
      axisName: { color: ink, fontSize: 12 },
      splitLine: { lineStyle: { color: rule } },
      splitArea: { areaStyle: { color: [bg2, 'transparent'] } },
      axisLine: { lineStyle: { color: rule } }
    },
    series: [{
      type: 'radar',
      data: [
        { value: [4, 1, 0, 0, 0, 2, 0], name: '糖豆', areaStyle: { opacity: 0.05 } },
        { value: [0, 2, 0, 0, 0, 2, 0], name: '美篇', areaStyle: { opacity: 0.05 } },
        { value: [1, 3, 0, 0, 0, 3, 0], name: '红松', areaStyle: { opacity: 0.05 } },
        { value: [0, 1, 0, 0, 0, 3, 0], name: '小年糕', areaStyle: { opacity: 0.05 } },
        { value: [0, 2, 0, 0, 0, 3, 0], name: '兴趣岛', areaStyle: { opacity: 0.05 } },
        {
          value: [5, 4, 5, 5, 4, 5, 4],
          name: '乐聚派(目标)',
          areaStyle: { color: accent + '20' },
          lineStyle: { color: accent, width: 2 },
          itemStyle: { color: accent }
        }
      ]
    }],
    color: [muted, muted, muted, muted, muted, accent]
  });
  window.addEventListener('resize', function() { chartCompetitor.resize(); });

  // --- Chart 3: 项目里程碑甘特图 ---
  var chartGantt = echarts.init(document.getElementById('chart-gantt'), null, { renderer: 'svg' });
  var phases = [
    { name: '需求评审', start: 1, end: 1, color: accent },
    { name: '设计评审', start: 2, end: 3, color: accent2 },
    { name: '技术评审', start: 3, end: 3, color: accent2 },
    { name: 'MVP开发', start: 4, end: 10, color: accent },
    { name: 'MVP测试', start: 11, end: 12, color: accent2 },
    { name: 'MVP灰度', start: 13, end: 13, color: accent },
    { name: 'Beta开发', start: 14, end: 22, color: accent2 },
    { name: 'GA发布', start: 23, end: 26, color: accent }
  ];
  chartGantt.setOption({
    animation: false,
    tooltip: {
      appendToBody: true,
      formatter: function(params) {
        return params.name + '<br/>第' + phases[params.dataIndex].start + '周 - 第' + phases[params.dataIndex].end + '周';
      }
    },
    grid: { left: '15%', right: '8%', top: '8%', bottom: '12%' },
    xAxis: {
      type: 'value',
      name: '周',
      nameTextStyle: { color: muted, fontSize: 12 },
      min: 0,
      max: 27,
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 12 },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      data: phases.map(function(p) { return p.name; }).reverse(),
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: ink, fontSize: 12 }
    },
    series: [{
      type: 'custom',
      renderItem: function(params, api) {
        var idx = api.value(0);
        var phase = phases[phases.length - 1 - idx];
        var start = api.coord([phase.start, idx]);
        var end = api.coord([phase.end + 0.5, idx]);
        var height = api.size([0, 1])[1] * 0.5;
        return {
          type: 'rect',
          shape: {
            x: start[0],
            y: start[1] - height / 2,
            width: end[0] - start[0],
            height: height,
            r: 4
          },
          style: {
            fill: phase.color,
            opacity: 0.85
          }
        };
      },
      data: phases.map(function(p, i) {
        return [i, p.start, p.end];
      }),
      encode: { x: [1, 2], y: 0 }
    }]
  });
  window.addEventListener('resize', function() { chartGantt.resize(); });

})();
