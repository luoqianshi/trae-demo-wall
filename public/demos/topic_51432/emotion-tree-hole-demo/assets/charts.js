(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: Mental Health Detection Rate ---
  var chart1 = echarts.init(document.getElementById('chart-mental-health'), null, { renderer: 'svg' });
  chart1.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: 'rgba(15,23,42,0.95)',
      borderColor: rule,
      textStyle: { color: ink }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['抑郁', '焦虑', '睡眠障碍', '强迫症状', '敌对情绪', '人际敏感'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      name: '检出率(%)',
      nameTextStyle: { color: muted },
      axisLine: { lineStyle: { color: rule } },
      splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } },
      axisLabel: { color: muted }
    },
    series: [{
      type: 'bar',
      data: [
        { value: 24.6, itemStyle: { color: accent2 } },
        { value: 18.3, itemStyle: { color: accent3 } },
        { value: 22.1, itemStyle: { color: accent } },
        { value: 12.5, itemStyle: { color: muted } },
        { value: 15.8, itemStyle: { color: accent2 + 'cc' } },
        { value: 20.4, itemStyle: { color: accent + 'cc' } }
      ],
      barWidth: '50%',
      label: {
        show: true,
        position: 'top',
        formatter: '{c}%',
        color: ink,
        fontSize: 13,
        fontWeight: 600
      }
    }]
  });
  window.addEventListener('resize', function() { chart1.resize(); });

  // --- Chart: Resource Comparison ---
  var chart2 = echarts.init(document.getElementById('chart-resources'), null, { renderer: 'svg' });
  chart2.setOption({
    animation: false,
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      backgroundColor: 'rgba(15,23,42,0.95)',
      borderColor: rule,
      textStyle: { color: ink }
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
      itemStyle: { borderRadius: 8, borderColor: bg2, borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold',
          color: ink
        }
      },
      data: [
        { value: 0.03, name: '专业心理服务覆盖', itemStyle: { color: accent } },
        { value: 0.33, name: '学校心理老师配比', itemStyle: { color: accent3 } },
        { value: 99.64, name: '未获得专业支持', itemStyle: { color: 'rgba(148,163,184,0.3)' } }
      ]
    }]
  });
  window.addEventListener('resize', function() { chart2.resize(); });

  // --- Chart: Usage Scenarios ---
  var chart3 = echarts.init(document.getElementById('chart-scenarios'), null, { renderer: 'svg' });
  chart3.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: 'rgba(15,23,42,0.95)',
      borderColor: rule,
      textStyle: { color: ink }
    },
    legend: {
      data: ['情绪倾诉', 'CBT练习', '绘画疗愈', '冥想引导'],
      textStyle: { color: muted },
      bottom: 0
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value',
      name: '使用频次',
      nameTextStyle: { color: muted },
      axisLine: { lineStyle: { color: rule } },
      splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } },
      axisLabel: { color: muted }
    },
    series: [
      {
        name: '情绪倾诉',
        type: 'line',
        smooth: true,
        data: [320, 380, 350, 420, 450, 280, 260],
        lineStyle: { color: accent, width: 3 },
        itemStyle: { color: accent },
        areaStyle: { color: 'rgba(56,189,248,0.1)' }
      },
      {
        name: 'CBT练习',
        type: 'line',
        smooth: true,
        data: [180, 220, 200, 250, 280, 150, 140],
        lineStyle: { color: accent2, width: 3 },
        itemStyle: { color: accent2 },
        areaStyle: { color: 'rgba(244,114,182,0.1)' }
      },
      {
        name: '绘画疗愈',
        type: 'line',
        smooth: true,
        data: [120, 150, 140, 180, 200, 280, 320],
        lineStyle: { color: accent3, width: 3 },
        itemStyle: { color: accent3 },
        areaStyle: { color: 'rgba(167,139,250,0.1)' }
      },
      {
        name: '冥想引导',
        type: 'line',
        smooth: true,
        data: [200, 180, 220, 190, 210, 350, 380],
        lineStyle: { color: muted, width: 3 },
        itemStyle: { color: muted },
        areaStyle: { color: 'rgba(148,163,184,0.1)' }
      }
    ]
  });
  window.addEventListener('resize', function() { chart3.resize(); });
})();