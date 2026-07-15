(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: 目标用户群体分布预估 ---
  var chartUsers = echarts.init(document.getElementById('chart-users'), null, { renderer: 'svg' });
  chartUsers.setOption({
    animation: false,
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      formatter: '{b}: {c}% ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: muted }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 8,
        borderColor: bg2,
        borderWidth: 2
      },
      label: {
        show: true,
        color: ink,
        formatter: '{b}\n{c}%'
      },
      labelLine: {
        lineStyle: { color: rule }
      },
      data: [
        { value: 35, name: '军事爱好者', itemStyle: { color: accent } },
        { value: 30, name: '体能训练者', itemStyle: { color: accent2 } },
        { value: 20, name: '青少年学生', itemStyle: { color: muted } },
        { value: 15, name: '休闲玩家', itemStyle: { color: rule } }
      ]
    }]
  });
  window.addEventListener('resize', function() { chartUsers.resize(); });

  // --- Chart: 产品迭代规划（甘特图风格） ---
  var chartRoadmap = echarts.init(document.getElementById('chart-roadmap'), null, { renderer: 'svg' });
  var categories = ['MVP阶段', '迭代阶段', '成熟阶段', '扩展阶段'];
  var data = [
    { name: 'MVP阶段', value: [0, 2], itemStyle: { color: accent } },
    { name: '迭代阶段', value: [2, 4], itemStyle: { color: accent2 } },
    { name: '成熟阶段', value: [4, 6], itemStyle: { color: muted } },
    { name: '扩展阶段', value: [6, 12], itemStyle: { color: rule } }
  ];

  chartRoadmap.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      axisPointer: { type: 'shadow' },
      formatter: function(params) {
        var p = params[0];
        return p.name + '<br/>第 ' + p.value[0] + ' 月 - 第 ' + p.value[1] + ' 月';
      }
    },
    grid: {
      left: '15%',
      right: '8%',
      top: '10%',
      bottom: '12%'
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 12,
      interval: 1,
      name: '月份',
      nameTextStyle: { color: muted },
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, formatter: '{value}月' },
      splitLine: { lineStyle: { color: rule, opacity: 0.3 } }
    },
    yAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: ink, fontWeight: 600 },
      splitLine: { show: false }
    },
    series: [{
      type: 'custom',
      renderItem: function(params, api) {
        var categoryIndex = api.value(2) !== undefined ? api.value(2) : params.dataIndex;
        var start = api.coord([api.value(0), categoryIndex]);
        var end = api.coord([api.value(1), categoryIndex]);
        var height = api.size([0, 1])[1] * 0.5;
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
          style: api.style({ fill: data[categoryIndex].itemStyle.color })
        };
      },
      encode: {
        x: [0, 1],
        y: 2
      },
      data: [
        { value: [0, 2, 0], itemStyle: { color: accent } },
        { value: [2, 4, 1], itemStyle: { color: accent2 } },
        { value: [4, 6, 2], itemStyle: { color: muted } },
        { value: [6, 12, 3], itemStyle: { color: rule } }
      ]
    }]
  });
  window.addEventListener('resize', function() { chartRoadmap.resize(); });

  // --- Chart: 市场定位矩阵 ---
  var chartMatrix = echarts.init(document.getElementById('chart-matrix'), null, { renderer: 'svg' });
  chartMatrix.setOption({
    animation: false,
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      formatter: function(p) {
        return '<strong>' + p.data[3] + '</strong><br/>操作性: ' + p.data[0] + '<br/>文化深度: ' + p.data[1];
      }
    },
    grid: { top: '12%', right: '12%', bottom: '15%', left: '15%' },
    xAxis: {
      type: 'value',
      min: 0, max: 1,
      name: '低操作性              高操作性 →',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { color: muted, fontSize: 12 },
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { show: false },
      splitLine: { lineStyle: { color: rule, opacity: 0.3 } }
    },
    yAxis: {
      type: 'value',
      min: 0, max: 1,
      name: '低文化深度              高文化深度 →',
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: { color: muted, fontSize: 12 },
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { show: false },
      splitLine: { lineStyle: { color: rule, opacity: 0.3 } }
    },
    graphic: [
      { type: 'text', left: '18%', top: '18%', style: { text: '策略深耕区', fill: muted, fontSize: 11 } },
      { type: 'text', right: '18%', top: '18%', style: { text: '我们的位置', fill: accent, fontSize: 11, fontWeight: 'bold' } },
      { type: 'text', left: '18%', bottom: '18%', style: { text: '休闲轻量区', fill: muted, fontSize: 11 } },
      { type: 'text', right: '18%', bottom: '18%', style: { text: '动作爽感区', fill: muted, fontSize: 11 } }
    ],
    series: [{
      type: 'scatter',
      symbolSize: function(d) { return d[2]; },
      itemStyle: {
        color: function(p) {
          return p.dataIndex === 4 ? accent : (p.dataIndex === 3 ? accent2 + 'cc' : muted + '99');
        },
        shadowBlur: 10,
        shadowColor: 'rgba(0,0,0,0.3)'
      },
      label: {
        show: true,
        formatter: function(p) { return p.data[3]; },
        position: 'top',
        color: ink,
        fontWeight: 600,
        fontSize: 12
      },
      data: [
        [0.85, 0.40, 28, '军事射击游戏'],
        [0.20, 0.70, 28, '军事策略游戏'],
        [0.75, 0.15, 28, '泛跑酷游戏'],
        [0.60, 0.80, 28, '线下VR体验'],
        [0.78, 0.75, 40, '军营障碍王']
      ],
      markLine: {
        silent: true,
        lineStyle: { type: 'dashed', color: rule, opacity: 0.5 },
        data: [
          { xAxis: 0.5 },
          { yAxis: 0.5 }
        ]
      }
    }]
  });
  window.addEventListener('resize', function() { chartMatrix.resize(); });
})();
