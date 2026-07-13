(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: Henan cities by cultural density ---
  var chart1 = echarts.init(document.getElementById('chart-henan-cities'), null, { renderer: 'svg' });
  chart1.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    grid: { left: '3%', right: '8%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'value', name: '文化维度数量',
      axisLabel: { color: muted }, nameTextStyle: { color: muted },
      axisLine: { lineStyle: { color: rule } }
    },
    yAxis: {
      type: 'category',
      data: ['郑州','洛阳','开封','南阳','安阳','许昌','商丘','周口','信阳','焦作','新乡','驻马店','漯河','三门峡','濮阳','鹤壁','平顶山','济源'],
      axisLabel: { color: ink, fontSize: 12 },
      axisLine: { lineStyle: { color: rule } }
    },
    series: [{
      type: 'bar',
      data: [18,17,16,15,14,13,13,12,12,11,11,10,10,9,9,8,8,6],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: accent2 }, { offset: 1, color: accent }
        ]),
        borderRadius: [0, 4, 4, 0]
      },
      label: { show: true, position: 'right', color: muted, fontSize: 11 }
    }]
  });
  window.addEventListener('resize', function() { chart1.resize(); });

  // --- Chart: Content dimension distribution ---
  var chart2 = echarts.init(document.getElementById('chart-dimensions'), null, { renderer: 'svg' });
  chart2.setOption({
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true },
    legend: { bottom: 0, textStyle: { color: muted } },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      label: { show: true, position: 'outside', color: ink, fontSize: 12 },
      emphasis: { label: { fontSize: 16, fontWeight: 'bold' } },
      itemStyle: { borderRadius: 6, borderColor: bg2, borderWidth: 3 },
      data: [
        { value: 28, name: '美食', itemStyle: { color: accent } },
        { value: 24, name: '历史人物', itemStyle: { color: accent2 } },
        { value: 18, name: '地域文化', itemStyle: { color: accent + 'cc' } },
        { value: 14, name: '现代人物', itemStyle: { color: accent2 + '99' } },
        { value: 10, name: '自然地理', itemStyle: { color: muted } },
        { value: 6, name: '历史沿革', itemStyle: { color: rule } }
      ]
    }]
  });
  window.addEventListener('resize', function() { chart2.resize(); });

  // --- Chart: User scenario breakdown ---
  var chart3 = echarts.init(document.getElementById('chart-scenarios'), null, { renderer: 'svg' });
  chart3.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    radar: {
      center: ['50%', '55%'],
      radius: '65%',
      indicator: [
        { name: '文旅探索', max: 100 },
        { name: '乡愁情感', max: 100 },
        { name: '教育学习', max: 100 },
        { name: '文化保护', max: 100 },
        { name: '内容创作', max: 100 },
        { name: '社交互动', max: 100 }
      ],
      axisName: { color: muted, fontSize: 11 }
    },
    series: [{
      type: 'radar',
      data: [{ value: [95, 90, 75, 85, 70, 80], name: '故里九州', areaStyle: { color: accent + '33' }, lineStyle: { color: accent }, itemStyle: { color: accent } }],
      symbol: 'circle', symbolSize: 6
    }]
  });
  window.addEventListener('resize', function() { chart3.resize(); });
})();