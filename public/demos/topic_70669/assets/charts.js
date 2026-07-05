// assets/charts.js — 仙途 ECharts 图表
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var bg = style.getPropertyValue('--bg').trim();

  // --- Chart: 历练点数对比 ---
  var chartXp = echarts.init(document.getElementById('chart-xp'), null, { renderer: 'svg' });

  var tasks = [
    '喝水打卡',
    '整理邮件10分钟',
    '专注阅读30分钟',
    '写作2000字',
    '外出跑步5公里',
    '图书馆学习3小时',
    '半程马拉松',
    '首次尝试新乐器'
  ];

  var xpValues = [1, 7, 26, 49, 52, 191, 779, 127];

  chartXp.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      axisPointer: { type: 'shadow' },
      formatter: function(params) {
        return params[0].name + '<br/>历练点数: <strong>' + params[0].value + '</strong>';
      }
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: tasks,
      axisLabel: {
        color: muted,
        fontSize: 11,
        rotate: 25
      },
      axisLine: { lineStyle: { color: rule } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '历练点数',
      nameTextStyle: { color: muted, fontSize: 12 },
      axisLabel: { color: muted, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: rule } }
    },
    series: [{
      type: 'bar',
      data: xpValues.map(function(v, i) {
        var color;
        if (i === 6) color = accent3; // 半程马拉松 - 紫金（最高）
        else if (i >= 4) color = accent2; // 外出任务 - 青绿
        else color = accent; // 居家任务 - 朱砂红
        return {
          value: v,
          itemStyle: {
            color: color,
            borderRadius: [4, 4, 0, 0]
          }
        };
      }),
      barWidth: '55%',
      label: {
        show: true,
        position: 'top',
        color: ink,
        fontSize: 11,
        fontWeight: 600
      }
    }]
  });

  window.addEventListener('resize', function() { chartXp.resize(); });
})();