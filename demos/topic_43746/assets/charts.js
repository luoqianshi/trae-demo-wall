// assets/charts.js
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: Pain Points Radar ---
  var chartEl = document.getElementById('chart-painpoints');
  if (!chartEl) return;
  var chart1 = echarts.init(chartEl, null, { renderer: 'svg' });

  var painPoints = [
    { name: '不懂短视频文案', value: 92 },
    { name: '写剧本耗时太长', value: 88 },
    { name: '不会设计钩子', value: 85 },
    { name: '不懂平台算法', value: 78 },
    { name: '缺乏学术深度', value: 72 },
    { name: '选题困难', value: 68 }
  ];

  var option1 = {
    tooltip: {
      appendToBody: true,
      trigger: 'item',
      formatter: function(params) {
        return '<strong>' + params.name + '</strong><br/>痛点指数: ' + params.value + '%';
      }
    },
    animation: false,
    color: [accent, accent2],
    legend: {
      data: ['学术人群体', '知识博主群体'],
      textStyle: { color: muted, fontSize: 12 },
      bottom: 0,
      icon: 'circle'
    },
    radar: {
      indicator: painPoints.map(function(p) {
        return { name: p.name, max: 100 };
      }),
      radius: '60%',
      center: ['50%', '45%'],
      splitNumber: 4,
      shape: 'polygon',
      axisName: {
        color: muted,
        fontSize: 11,
        fontWeight: 600
      },
      splitLine: {
        lineStyle: { color: rule }
      },
      splitArea: {
        areaStyle: { color: [bg2] }
      },
      axisLine: {
        lineStyle: { color: rule }
      }
    },
    series: [
      {
        name: '学术人群体',
        type: 'radar',
        data: [
          {
            value: [92, 88, 85, 78, 40, 55],
            name: '学术人群体',
            areaStyle: { color: accent + '33' },
            lineStyle: { color: accent, width: 2 },
            itemStyle: { color: accent }
          }
        ],
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: '知识博主群体',
        type: 'radar',
        data: [
          {
            value: [50, 55, 60, 75, 72, 68],
            name: '知识博主群体',
            areaStyle: { color: accent2 + '33' },
            lineStyle: { color: accent2, width: 2 },
            itemStyle: { color: accent2 }
          }
        ],
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  };

  chart1.setOption(option1);
  window.addEventListener('resize', function() { chart1.resize(); });

})();