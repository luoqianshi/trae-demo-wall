(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: 核心价值维度雷达图 ---
  var chartValueEl = document.getElementById('chart-value');
  if (chartValueEl) {
    var chart1 = echarts.init(chartValueEl, null, { renderer: 'svg' });
    chart1.setOption({
      animation: false,
      tooltip: {
        appendToBody: true,
        backgroundColor: bg2,
        borderColor: rule,
        textStyle: { color: ink }
      },
      legend: {
        data: ['DIY装机助手', '传统方式'],
        bottom: 0,
        textStyle: { color: muted },
        itemWidth: 12,
        itemHeight: 12
      },
      radar: {
        center: ['50%', '48%'],
        radius: '65%',
        indicator: [
          { name: '兼容性保障', max: 100 },
          { name: '操作便捷度', max: 100 },
          { name: '时间效率', max: 100 },
          { name: '预算合理性', max: 100 },
          { name: '信息透明度', max: 100 },
          { name: '用户体验', max: 100 }
        ],
        axisName: { color: muted, fontSize: 12 },
        splitArea: { show: false },
        splitLine: { lineStyle: { color: rule } },
        axisLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'radar',
        name: 'DIY装机助手',
        data: [{ value: [95, 90, 92, 88, 85, 90], name: 'DIY装机助手' }],
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: accent, width: 2 },
        areaStyle: { color: accent + '33' },
        itemStyle: { color: accent }
      }, {
        type: 'radar',
        name: '传统方式',
        data: [{ value: [40, 25, 30, 35, 20, 28], name: '传统方式' }],
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: accent2, width: 2 },
        areaStyle: { color: accent2 + '22' },
        itemStyle: { color: accent2 }
      }]
    });
    window.addEventListener('resize', function() { chart1.resize(); });
  }

  // --- Chart: 主流游戏帧率对比柱状图 ---
  var chartFpsEl = document.getElementById('chart-fps');
  if (chartFpsEl) {
    var chart2 = echarts.init(chartFpsEl, null, { renderer: 'svg' });
    chart2.setOption({
      animation: false,
      tooltip: {
        appendToBody: true,
        backgroundColor: bg2,
        borderColor: rule,
        textStyle: { color: ink },
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['RTX 4060', 'RTX 4070', 'RTX 4070 Ti', 'RTX 4080'],
        bottom: 0,
        textStyle: { color: muted },
        itemWidth: 12,
        itemHeight: 12
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['英雄联盟', 'CS2', '绝地求生', '永劫无间', '原神', '赛博朋克\n2077', '黑神话\n悟空', 'APEX英雄'],
        axisLabel: { color: muted, fontSize: 11 },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: 'FPS',
        nameTextStyle: { color: muted },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule } },
        axisLine: { show: false }
      },
      series: [
        {
          name: 'RTX 4060',
          type: 'bar',
          data: [240, 200, 120, 85, 60, 55, 50, 180],
          itemStyle: { color: accent + '99', borderRadius: [4, 4, 0, 0] },
          barGap: '10%'
        },
        {
          name: 'RTX 4070',
          type: 'bar',
          data: [360, 300, 180, 120, 60, 80, 75, 240],
          itemStyle: { color: accent + 'CC', borderRadius: [4, 4, 0, 0] }
        },
        {
          name: 'RTX 4070 Ti',
          type: 'bar',
          data: [400, 350, 210, 150, 60, 100, 90, 280],
          itemStyle: { color: accent2 + 'AA', borderRadius: [4, 4, 0, 0] }
        },
        {
          name: 'RTX 4080',
          type: 'bar',
          data: [500, 450, 260, 180, 60, 120, 110, 330],
          itemStyle: { color: accent2, borderRadius: [4, 4, 0, 0] }
        }
      ]
    });
    window.addEventListener('resize', function() { chart2.resize(); });
  }
})();