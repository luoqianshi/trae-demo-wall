// charts.js - 峡谷思路 创意方案图表
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var danger = style.getPropertyValue('--danger').trim();

  // --- Chart: 各段位玩家"卡分主要原因"自评分布 ---
  var el = document.getElementById('chart-segment');
  if (el) {
    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        appendToBody: true,
        backgroundColor: bg2,
        borderColor: rule,
        textStyle: { color: ink, fontSize: 12 }
      },
      legend: {
        data: ['操作不熟', '意识/大局观薄弱', '队友/匹配'],
        textStyle: { color: muted, fontSize: 12 },
        top: 0,
        itemWidth: 14,
        itemHeight: 8
      },
      grid: { left: 50, right: 30, top: 50, bottom: 40, containLabel: true },
      xAxis: {
        type: 'category',
        data: ['黄金以下', '铂金', '钻石', '星耀', '巅峰<1500', '巅峰>1500'],
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted, fontSize: 11 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '玩家自评占比 (%)',
        nameTextStyle: { color: muted, fontSize: 11 },
        axisLine: { show: false },
        axisLabel: { color: muted, fontSize: 11 },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      series: [
        {
          name: '操作不熟',
          type: 'bar',
          stack: 'total',
          data: [55, 42, 30, 22, 18, 15],
          itemStyle: { color: accent2 + 'cc' },
          barWidth: '50%'
        },
        {
          name: '意识/大局观薄弱',
          type: 'bar',
          stack: 'total',
          data: [25, 35, 45, 55, 62, 40],
          itemStyle: { color: accent },
          label: {
            show: true,
            position: 'inside',
            color: '#0b0d18',
            fontWeight: 'bold',
            fontSize: 11,
            formatter: '{c}%'
          }
        },
        {
          name: '队友/匹配',
          type: 'bar',
          stack: 'total',
          data: [20, 23, 25, 23, 20, 45],
          itemStyle: { color: danger + 'aa' }
        }
      ]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  }
})();
