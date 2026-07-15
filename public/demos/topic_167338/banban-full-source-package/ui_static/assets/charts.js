(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var bg3 = style.getPropertyValue('--bg3').trim();
  var purple = style.getPropertyValue('--purple').trim();
  var green = style.getPropertyValue('--green').trim();
  var orange = style.getPropertyValue('--orange').trim();
  var pink = style.getPropertyValue('--pink').trim();
  var blue = style.getPropertyValue('--blue').trim();

  // --- Chart: Timeline (一天时间状态分布) ---
  var timelineChart = echarts.init(document.getElementById('chart-timeline'), null, { renderer: 'svg' });
  timelineChart.setOption({
    animation: false,
    tooltip: {
      appendToBody: true,
      formatter: function(params) {
        return params.marker + params.name + ': ' + params.value + ' 小时';
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 24,
      axisLabel: {
        color: muted,
        formatter: '{value}:00'
      },
      axisLine: { lineStyle: { color: rule } },
      splitLine: { lineStyle: { color: rule } }
    },
    yAxis: {
      type: 'category',
      data: ['今天'],
      axisLabel: { color: muted },
      axisLine: { lineStyle: { color: rule } }
    },
    series: [{
      type: 'custom',
      renderItem: function(params, api) {
        var categoryIndex = api.value(0);
        var start = api.coord([api.value(1), categoryIndex]);
        var end = api.coord([api.value(2), categoryIndex]);
        var height = api.size([0, 1])[1] * 0.6;
        var rectShape = echarts.graphic.clipRectByRect({
          x: start[0],
          y: start[1] - height / 2,
          width: end[0] - start[0],
          height: height
        }, {
          x: params.coordSys.x,
          y: params.coordSys.y,
          width: params.coordSys.width,
          height: params.coordSys.height
        });
        return rectShape && {
          type: 'rect',
          transition: ['shape'],
          shape: rectShape,
          style: api.style()
        };
      },
      data: [
        { value: [0, 0, 7, '睡眠'], itemStyle: { color: bg3, borderRadius: [4, 4, 4, 4] } },
        { value: [0, 7, 8.5, '晨间准备'], itemStyle: { color: '#3b82f6', opacity: 0.4, borderRadius: [4, 4, 4, 4] } },
        { value: [0, 8.5, 9.5, '深度专注'], itemStyle: { color: purple, borderRadius: [4, 0, 0, 4] } },
        { value: [0, 9.5, 10.5, '工作执行'], itemStyle: { color: blue, borderRadius: [0, 0, 0, 0] } },
        { value: [0, 10.5, 11, '沟通协作'], itemStyle: { color: green, borderRadius: [0, 0, 0, 0] } },
        { value: [0, 11, 12, '深度专注'], itemStyle: { color: purple, borderRadius: [0, 4, 4, 0] } },
        { value: [0, 12, 13.5, '午休'], itemStyle: { color: '#14b8a6', opacity: 0.5, borderRadius: [4, 4, 4, 4] } },
        { value: [0, 13.5, 14.5, '多任务切换'], itemStyle: { color: pink, borderRadius: [4, 0, 0, 4] } },
        { value: [0, 14.5, 16, '深度专注'], itemStyle: { color: purple, borderRadius: [0, 0, 0, 0] } },
        { value: [0, 16, 16.5, '休息恢复'], itemStyle: { color: accent2, opacity: 0.6, borderRadius: [4, 4, 4, 4] } },
        { value: [0, 16.5, 18, '学习探索'], itemStyle: { color: orange, borderRadius: [4, 4, 4, 4] } },
        { value: [0, 18, 19, '工作执行'], itemStyle: { color: blue, borderRadius: [4, 4, 4, 4] } },
        { value: [0, 19, 21, '个人时间'], itemStyle: { color: bg3, borderRadius: [4, 4, 4, 4] } },
        { value: [0, 21, 24, '睡眠前'], itemStyle: { color: bg3, borderRadius: [4, 4, 4, 4] } }
      ],
      encode: {
        x: [1, 2],
        y: 0
      }
    }]
  });
  window.addEventListener('resize', function() { timelineChart.resize(); });

  // --- Chart: Radar (八维认知画像) ---
  var radarChart = echarts.init(document.getElementById('chart-radar'), null, { renderer: 'svg' });
  radarChart.setOption({
    animation: false,
    tooltip: {
      appendToBody: true
    },
    radar: {
      indicator: [
        { name: '认知深度', max: 100 },
        { name: '行动力', max: 100 },
        { name: '结构化', max: 100 },
        { name: '社交能量', max: 100 },
        { name: '情绪稳定', max: 100 },
        { name: '抗压能力', max: 100 },
        { name: '时间规划', max: 100 },
        { name: '成长动机', max: 100 }
      ],
      radius: '65%',
      center: ['50%', '55%'],
      splitNumber: 4,
      axisName: {
        color: ink,
        fontSize: 13,
        fontWeight: 500
      },
      splitLine: {
        lineStyle: { color: rule }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: [bg2, bg3, bg2, bg3]
        }
      },
      axisLine: {
        lineStyle: { color: rule }
      }
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: [82, 55, 75, 35, 60, 45, 68, 88],
          name: '你的认知画像',
          areaStyle: {
            color: {
              type: 'radial',
              x: 0.5,
              y: 0.5,
              r: 0.5,
              colorStops: [
                { offset: 0, color: 'rgba(124, 140, 255, 0.3)' },
                { offset: 1, color: 'rgba(94, 234, 212, 0.1)' }
              ]
            }
          },
          lineStyle: {
            color: accent,
            width: 2
          },
          itemStyle: {
            color: accent2
          }
        }
      ]
    }]
  });
  window.addEventListener('resize', function() { radarChart.resize(); });

})();
