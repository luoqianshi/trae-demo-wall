(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: 旅行信息搜集渠道分布 ---
  var chartChannels = echarts.init(document.getElementById('chart-channels'), null, { renderer: 'svg' });
  chartChannels.setOption({
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
      textStyle: { color: ink, fontSize: 13 },
      itemWidth: 14,
      itemHeight: 14
    },
    color: [accent, accent2, '#2D9CDB', '#9B59B6', '#F2C94C', '#27AE60', '#E67E22'],
    series: [{
      name: '信息渠道',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 8,
        borderColor: bg2,
        borderWidth: 3
      },
      label: {
        show: true,
        formatter: '{b}\n{c}%',
        color: ink,
        fontSize: 12
      },
      labelLine: {
        length: 15,
        length2: 10
      },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0,0,0,0.2)'
        }
      },
      data: [
        { value: 32, name: '小红书' },
        { value: 24, name: '大众点评' },
        { value: 18, name: '携程/飞猪' },
        { value: 12, name: '抖音/快手' },
        { value: 8, name: '马蜂窝' },
        { value: 4, name: '知乎' },
        { value: 2, name: '其他' }
      ]
    }]
  });
  window.addEventListener('resize', function() { chartChannels.resize(); });

  // --- Chart: 旅行规划 App 用户满意度对比 ---
  var chartSatisfaction = echarts.init(document.getElementById('chart-satisfaction'), null, { renderer: 'svg' });
  chartSatisfaction.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['行业平均', '旅途智伴（目标）'],
      top: 10,
      textStyle: { color: ink, fontSize: 13 }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['信息全面性', '推荐精准度', '操作便捷性', '攻略可执行性', '个性化程度', '实时更新'],
      axisLabel: {
        color: muted,
        fontSize: 12,
        interval: 0
      },
      axisLine: { lineStyle: { color: rule } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        color: muted,
        formatter: '{value}分'
      },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    series: [
      {
        name: '行业平均',
        type: 'bar',
        data: [58, 52, 65, 48, 45, 42],
        itemStyle: {
          color: muted + '66',
          borderRadius: [6, 6, 0, 0]
        },
        barWidth: '30%'
      },
      {
        name: '旅途智伴（目标）',
        type: 'bar',
        data: [88, 85, 90, 86, 82, 80],
        itemStyle: {
          color: accent,
          borderRadius: [6, 6, 0, 0]
        },
        barWidth: '30%'
      }
    ]
  });
  window.addEventListener('resize', function() { chartSatisfaction.resize(); });
})();
