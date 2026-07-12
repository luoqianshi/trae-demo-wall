(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: Feature Radar ---
  var chartRadar = echarts.init(document.getElementById('chart-radar'), null, { renderer: 'svg' });
  chartRadar.setOption({
    animationDuration: 1500,
    color: [accent, accent2],
    tooltip: { trigger: 'item', appendToBody: true, backgroundColor: bg2, borderColor: rule, borderWidth: 1 },
    legend: { 
      bottom: 0, 
      textStyle: { color: muted },
      itemWidth: 16,
      itemHeight: 10,
      itemGap: 20
    },
    radar: {
      indicator: [
        { name: '心率监测', max: 100 },
        { name: '行为识别', max: 100 },
        { name: '睡眠分析', max: 100 },
        { name: '体温监测', max: 100 },
        { name: 'GPS定位', max: 100 },
        { name: '情绪识别', max: 100 },
        { name: '饮食追踪', max: 100 },
        { name: '异常告警', max: 100 },
        { name: 'AI养宠助手', max: 100 },
        { name: '导盲犬服务', max: 100 }
      ],
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: ink, fontSize: 11, fontWeight: 600 },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } },
      splitArea: { show: true, areaStyle: { color: ['rgba(240,235,228,0.3)', 'rgba(250,248,245,0.3)'] } },
      axisLine: { lineStyle: { color: rule } },
      radius: '65%'
    },
    series: [{
      type: 'radar',
      emphasis: { lineStyle: { width: 4 } },
      data: [
        {
          value: [95, 90, 85, 80, 88, 75, 92, 90, 88, 85],
          name: 'PetMind 项圈',
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5, color: accent },
          areaStyle: { color: accent + '22' },
          itemStyle: { color: accent }
        },
        {
          value: [60, 40, 50, 30, 70, 20, 35, 45, 10, 5],
          name: '传统宠物定位器',
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5, color: accent2, type: 'dashed' },
          areaStyle: { color: accent2 + '22' },
          itemStyle: { color: accent2 }
        }
      ]
    }]
  });
  window.addEventListener('resize', function() { chartRadar.resize(); });

  // --- Chart: Daily Activity Timeline ---
  var chartActivity = echarts.init(document.getElementById('chart-activity'), null, { renderer: 'svg' });
  chartActivity.setOption({
    animationDuration: 1500,
    color: [accent, accent2, muted],
    tooltip: { 
      trigger: 'axis', 
      appendToBody: true,
      backgroundColor: bg2,
      borderColor: rule,
      borderWidth: 1,
      textStyle: { color: ink },
      formatter: function(params) {
        var result = params[0].axisValue + '<br/>';
        params.forEach(function(item) {
          result += item.marker + item.seriesName + ': ' + item.value + '<br/>';
        });
        return result;
      }
    },
    legend: { 
      bottom: 0, 
      textStyle: { color: muted },
      itemWidth: 16,
      itemHeight: 10,
      itemGap: 20
    },
    grid: { left: '3%', right: '4%', bottom: '8%', top: '5%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 11 },
      axisTick: { show: false },
      boundaryGap: false
    },
    yAxis: [
      {
        type: 'value',
        name: '活动强度',
        nameTextStyle: { color: muted, fontSize: 11 },
        axisLine: { show: false },
        axisLabel: { color: muted, fontSize: 11 },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } },
        max: 100
      },
      {
        type: 'value',
        name: '睡眠深度',
        nameTextStyle: { color: muted, fontSize: 11 },
        axisLine: { show: false },
        axisLabel: { color: muted, fontSize: 11 },
        splitLine: { show: false },
        max: 100
      }
    ],
    series: [
      {
        name: '活动量',
        type: 'bar',
        barWidth: '50%',
        data: [5, 3, 15, 45, 30, 55, 70, 25],
        itemStyle: { 
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: accent },
            { offset: 1, color: accent + '88' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: { itemStyle: { color: accent } }
      },
      {
        name: '睡眠深度',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: [90, 95, 80, 20, 15, 10, 5, 60],
        itemStyle: { color: accent2 },
        lineStyle: { width: 3, color: accent2 },
        areaStyle: { 
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: accent2 + '44' },
            { offset: 1, color: accent2 + '00' }
          ])
        }
      }
    ]
  });
  window.addEventListener('resize', function() { chartActivity.resize(); });

  // --- Chart: Health Alert Categories ---
  var chartAlerts = echarts.init(document.getElementById('chart-alerts'), null, { renderer: 'svg' });
  chartAlerts.setOption({
    animationDuration: 1500,
    color: [accent, accent2, muted, accent + 'cc', accent2 + 'cc', accent + '88'],
    tooltip: { 
      trigger: 'item', 
      appendToBody: true,
      backgroundColor: bg2,
      borderColor: rule,
      borderWidth: 1,
      textStyle: { color: ink },
      formatter: '{b}: {c} ({d}%)'
    },
    legend: { 
      right: '5%', 
      top: 'center', 
      orient: 'vertical',
      textStyle: { color: muted },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 12
    },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['38%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { 
        borderRadius: 8, 
        borderColor: '#fff', 
        borderWidth: 2 
      },
      label: { 
        show: true, 
        color: ink,
        fontSize: 11,
        formatter: '{b}\n{d}%'
      },
      labelLine: { 
        lineStyle: { color: rule },
        length: 15,
        length2: 10
      },
      data: [
        { value: 30, name: '心率异常', itemStyle: { color: accent } },
        { value: 22, name: '行为异常', itemStyle: { color: accent2 } },
        { value: 18, name: '呕吐异常', itemStyle: { color: muted } },
        { value: 15, name: '体温异常', itemStyle: { color: accent + 'cc' } },
        { value: 10, name: '饮食异常', itemStyle: { color: accent2 + 'cc' } },
        { value: 5, name: '睡眠异常', itemStyle: { color: accent + '88' } }
      ],
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' }
      }
    }]
  });
  window.addEventListener('resize', function() { chartAlerts.resize(); });

})();