// CodeInsight · charts
(function () {
  if (!window.echarts) return;

  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim() || '#5eead4';
  var accent2 = style.getPropertyValue('--accent2').trim() || '#a78bfa';
  var ink = style.getPropertyValue('--ink').trim() || '#eef1f7';
  var muted = style.getPropertyValue('--muted').trim() || '#8a92a6';
  var rule = style.getPropertyValue('--rule').trim() || '#262c3a';
  var bg2 = style.getPropertyValue('--bg2').trim() || '#141821';
  var warn = style.getPropertyValue('--warn').trim() || '#fbbf24';
  var danger = style.getPropertyValue('--danger').trim() || '#f87171';

  var baseTextStyle = { color: muted, fontFamily: 'JetMono, monospace', fontSize: 12 };

  // --- Chart: scene frequency (pie/donut) ---
  var elScene = document.getElementById('chart-scene');
  if (elScene) {
    var c1 = echarts.init(elScene, null, { renderer: 'svg' });
    c1.setOption({
      animation: false,
      tooltip: { trigger: 'item', appendToBody: true, backgroundColor: bg2, borderColor: rule, textStyle: { color: ink } },
      legend: {
        bottom: 0, left: 'center',
        textStyle: { color: muted, fontFamily: 'JetMono, monospace', fontSize: 11 },
        itemWidth: 10, itemHeight: 10
      },
      color: [accent, accent2, warn, muted, accent + '99'],
      series: [{
        name: '场景占比',
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '46%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: bg2, borderWidth: 2 },
        label: { color: ink, fontFamily: 'JetMono, monospace', fontSize: 12, formatter: '{b}\n{d}%' },
        labelLine: { lineStyle: { color: muted } },
        data: [
          { value: 38, name: 'OJ 刷题 WA' },
          { value: 24, name: 'OJ 刷题 TLE' },
          { value: 18, name: '比赛 hack 数据' },
          { value: 12, name: '面试题复盘' },
          { value: 8, name: '课程作业' }
        ]
      }]
    });
    window.addEventListener('resize', function () { c1.resize(); });
  }

  // --- Chart: time comparison (grouped bar) ---
  var elTime = document.getElementById('chart-time');
  if (elTime) {
    var c2 = echarts.init(elTime, null, { renderer: 'svg' });
    c2.setOption({
      animation: false,
      tooltip: { trigger: 'axis', appendToBody: true, backgroundColor: bg2, borderColor: rule, textStyle: { color: ink } },
      legend: {
        top: 0,
        textStyle: { color: muted, fontFamily: 'JetMono, monospace', fontSize: 12 },
        data: ['传统手工对拍', 'CodeInsight']
      },
      grid: { left: 50, right: 20, top: 40, bottom: 30, containLabel: true },
      xAxis: {
        type: 'category',
        data: ['区间 DP', '图论最短路', '字符串哈希', '背包变种'],
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted, fontFamily: 'JetMono, monospace' }
      },
      yAxis: {
        type: 'value',
        name: '分钟',
        nameTextStyle: { color: muted, fontFamily: 'JetMono, monospace' },
        axisLine: { show: false },
        axisLabel: { color: muted, fontFamily: 'JetMono, monospace' },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      series: [
        {
          name: '传统手工对拍',
          type: 'bar',
          data: [55, 80, 45, 70],
          itemStyle: { color: danger + 'cc', borderRadius: [4, 4, 0, 0] },
          barWidth: 22
        },
        {
          name: 'CodeInsight',
          type: 'bar',
          data: [4, 7, 3, 5],
          itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] },
          barWidth: 22,
          label: { show: true, position: 'top', color: accent, fontFamily: 'JetMono, monospace', fontSize: 11, formatter: '{c}m' }
        }
      ]
    });
    window.addEventListener('resize', function () { c2.resize(); });
  }

  // --- Chart: weakness radar ---
  var elRadar = document.getElementById('chart-radar');
  if (elRadar) {
    var c3 = echarts.init(elRadar, null, { renderer: 'svg' });
    c3.setOption({
      animation: false,
      tooltip: { appendToBody: true, backgroundColor: bg2, borderColor: rule, textStyle: { color: ink } },
      legend: {
        bottom: 0,
        textStyle: { color: muted, fontFamily: 'JetMono, monospace', fontSize: 12 },
        data: ['本月', '上月']
      },
      radar: {
        indicator: [
          { name: '边界条件', max: 20 },
          { name: '数值溢出', max: 20 },
          { name: '复杂度退化', max: 20 },
          { name: '状态遗漏', max: 20 },
          { name: '输入解析', max: 20 },
          { name: '初始化遗漏', max: 20 }
        ],
        center: ['50%', '50%'],
        radius: '62%',
        axisName: { color: ink, fontFamily: 'JetMono, monospace', fontSize: 12 },
        splitLine: { lineStyle: { color: rule } },
        splitArea: { areaStyle: { color: ['transparent', bg2] } },
        axisLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'radar',
        symbol: 'circle',
        symbolSize: 5,
        data: [
          {
            value: [6, 4, 5, 7, 3, 4],
            name: '本月',
            lineStyle: { color: accent, width: 2 },
            itemStyle: { color: accent },
            areaStyle: { color: accent + '33' }
          },
          {
            value: [12, 9, 8, 11, 6, 7],
            name: '上月',
            lineStyle: { color: accent2, width: 2, type: 'dashed' },
            itemStyle: { color: accent2 },
            areaStyle: { color: accent2 + '22' }
          }
        ]
      }]
    });
    window.addEventListener('resize', function () { c3.resize(); });
  }

  // --- Chart: performance budget (stacked horizontal bar) ---
  var elPerf = document.getElementById('chart-perf');
  if (elPerf) {
    var c4 = echarts.init(elPerf, null, { renderer: 'svg' });
    c4.setOption({
      animation: false,
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, appendToBody: true, backgroundColor: bg2, borderColor: rule, textStyle: { color: ink } },
      legend: {
        top: 0,
        textStyle: { color: muted, fontFamily: 'JetMono, monospace', fontSize: 11 },
        data: ['数据生成', '用户代码', '暴力代码', 'Diff 比对']
      },
      grid: { left: 20, right: 30, top: 40, bottom: 20, containLabel: true },
      xAxis: {
        type: 'value',
        name: 'ms',
        nameTextStyle: { color: muted, fontFamily: 'JetMono, monospace' },
        axisLabel: { color: muted, fontFamily: 'JetMono, monospace' },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      yAxis: {
        type: 'category',
        data: ['n=1e3', 'n=1e4', 'n=1e5'],
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: ink, fontFamily: 'JetMono, monospace' }
      },
      series: [
        { name: '数据生成', type: 'bar', stack: 't', data: [2, 5, 18], itemStyle: { color: accent } },
        { name: '用户代码', type: 'bar', stack: 't', data: [3, 9, 35], itemStyle: { color: accent2 } },
        { name: '暴力代码', type: 'bar', stack: 't', data: [4, 12, 60], itemStyle: { color: warn } },
        {
          name: 'Diff 比对', type: 'bar', stack: 't',
          data: [1, 2, 6], itemStyle: { color: muted },
          label: { show: true, position: 'right', color: ink, fontFamily: 'JetMono, monospace', fontSize: 11, formatter: function (p) {
              var totals = [10, 28, 119];
              return totals[p.dataIndex] + ' ms';
            }
          }
        }
      ]
    });
    window.addEventListener('resize', function () { c4.resize(); });
  }
})();
