// Charts for "WildKidGo" creative pitch report
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart 1: 用户痛点强度雷达 ---
  var radarEl = document.getElementById('chart-painpoint');
  if (radarEl) {
    var radar = echarts.init(radarEl, null, { renderer: 'svg' });
    radar.setOption({
      animation: false,
      tooltip: { trigger: 'item', appendToBody: true },
      legend: {
        data: ['目前家庭', '使用本产品后'],
        textStyle: { color: ink },
        bottom: 0
      },
      radar: {
        indicator: [
          { name: '找去哪儿玩', max: 10 },
          { name: '寓教于乐内容', max: 10 },
          { name: '同龄家庭社交', max: 10 },
          { name: '出行安全保障', max: 10 },
          { name: '行程组织效率', max: 10 },
          { name: '亲子互动深度', max: 10 }
        ],
        axisName: { color: ink, fontSize: 12 },
        splitLine: { lineStyle: { color: rule } },
        splitArea: { areaStyle: { color: ['transparent', bg2] } },
        axisLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'radar',
        data: [
          {
            value: [8.5, 8.8, 8.2, 7.6, 8.0, 7.4],
            name: '目前家庭',
            itemStyle: { color: accent2 },
            areaStyle: { color: accent2 + '55' },
            lineStyle: { color: accent2, width: 2 }
          },
          {
            value: [3.2, 2.5, 3.0, 3.4, 2.8, 2.2],
            name: '使用本产品后',
            itemStyle: { color: accent },
            areaStyle: { color: accent + '55' },
            lineStyle: { color: accent, width: 2 }
          }
        ]
      }]
    });
    window.addEventListener('resize', function () { radar.resize(); });
  }

  // --- Chart 2: 市场规模 / 用户增长预估 ---
  var growthEl = document.getElementById('chart-growth');
  if (growthEl) {
    var growth = echarts.init(growthEl, null, { renderer: 'svg' });
    growth.setOption({
      animation: false,
      tooltip: { trigger: 'axis', appendToBody: true },
      legend: { data: ['注册家庭(万)', '月活家庭(万)'], textStyle: { color: ink }, top: 0 },
      grid: { left: 50, right: 30, top: 40, bottom: 40 },
      xAxis: {
        type: 'category',
        data: ['第1季', '第2季', '第3季', '第4季', '第5季', '第6季', '第7季', '第8季'],
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: rule } },
        splitLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted }
      },
      series: [
        {
          name: '注册家庭(万)',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          data: [1.2, 3.5, 8.0, 16, 28, 45, 68, 95],
          itemStyle: { color: accent },
          lineStyle: { color: accent, width: 3 },
          areaStyle: { color: accent + '33' }
        },
        {
          name: '月活家庭(万)',
          type: 'line',
          smooth: true,
          symbol: 'diamond',
          symbolSize: 8,
          data: [0.6, 2.1, 5.0, 10, 18, 30, 46, 65],
          itemStyle: { color: accent2 },
          lineStyle: { color: accent2, width: 3 }
        }
      ]
    });
    window.addEventListener('resize', function () { growth.resize(); });
  }

  // --- Chart 3: 价值构成 ---
  var valueEl = document.getElementById('chart-value');
  if (valueEl) {
    var value = echarts.init(valueEl, null, { renderer: 'svg' });
    value.setOption({
      animation: false,
      tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c}%' },
      legend: { bottom: 0, textStyle: { color: ink } },
      series: [{
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: 'var(--bg)', borderWidth: 2 },
        label: { color: ink, formatter: '{b}\n{c}%' },
        data: [
          { value: 35, name: '教育增值价值', itemStyle: { color: accent } },
          { value: 28, name: '亲子情感价值', itemStyle: { color: accent2 } },
          { value: 20, name: '社交连接价值', itemStyle: { color: accent + 'AA' } },
          { value: 17, name: '出行效率价值', itemStyle: { color: accent2 + 'AA' } }
        ]
      }]
    });
    window.addEventListener('resize', function () { value.resize(); });
  }
})();
