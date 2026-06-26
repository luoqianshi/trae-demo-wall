// assets/charts.js
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var bg = style.getPropertyValue('--bg').trim();
  var success = style.getPropertyValue('--success').trim();
  var warning = style.getPropertyValue('--warning').trim();
  var danger = style.getPropertyValue('--danger').trim();

  // --- Chart: 24h Flow ---
  var chartFlow = echarts.init(document.getElementById('chart-flow'), null, { renderer: 'svg' });
  var hours = [];
  var flowData = [];
  var alertData = [];
  for (var i = 0; i < 24; i++) {
    hours.push(i + ':00');
    // Simulate realistic airport flow pattern
    var base = 60;
    if (i >= 5 && i <= 8) base = 120 + Math.random() * 80; // morning rush
    else if (i >= 11 && i <= 14) base = 150 + Math.random() * 100; // noon peak
    else if (i >= 17 && i <= 20) base = 180 + Math.random() * 120; // evening rush
    else if (i >= 1 && i <= 4) base = 10 + Math.random() * 20; // night low
    else base = 50 + Math.random() * 60;
    flowData.push(Math.round(base));
    alertData.push(Math.round(Math.random() * 5));
  }

  chartFlow.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: 'rgba(10,14,26,0.95)',
      borderColor: rule,
      textStyle: { color: ink, fontFamily: 'GeistMono', fontSize: 11 },
      axisPointer: { type: 'cross', crossStyle: { color: muted } }
    },
    legend: {
      data: ['安检人数', '告警数'],
      top: 0,
      right: 0,
      textStyle: { color: muted, fontFamily: 'Outfit', fontSize: 11 },
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 3
    },
    grid: { left: 40, right: 16, top: 36, bottom: 28 },
    xAxis: {
      type: 'category',
      data: hours,
      axisLine: { lineStyle: { color: rule } },
      axisTick: { show: false },
      axisLabel: { color: muted, fontFamily: 'GeistMono', fontSize: 9, interval: 2 },
      splitLine: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: muted, fontFamily: 'GeistMono', fontSize: 9 },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: muted, fontFamily: 'GeistMono', fontSize: 9 },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '安检人数',
        type: 'bar',
        data: flowData,
        barWidth: '50%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: accent },
            { offset: 1, color: accent + '33' }
          ]),
          borderRadius: [2, 2, 0, 0]
        }
      },
      {
        name: '告警数',
        type: 'line',
        yAxisIndex: 1,
        data: alertData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color: accent2, width: 2 },
        itemStyle: { color: accent2, borderColor: bg, borderWidth: 2 }
      }
    ]
  });
  window.addEventListener('resize', function() { chartFlow.resize(); });

  // --- Chart: Type Distribution ---
  var chartType = echarts.init(document.getElementById('chart-type'), null, { renderer: 'svg' });
  chartType.setOption({
    animation: false,
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      backgroundColor: 'rgba(10,14,26,0.95)',
      borderColor: rule,
      textStyle: { color: ink, fontFamily: 'GeistMono', fontSize: 11 },
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: ['42%', '70%'],
        center: ['50%', '52%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: bg, borderWidth: 3 },
        label: {
          color: muted,
          fontFamily: 'Outfit',
          fontSize: 11,
          formatter: '{b}\n{d}%'
        },
        labelLine: { lineStyle: { color: rule }, length: 12, length2: 8 },
        emphasis: {
          label: { fontSize: 13, fontWeight: 'bold', color: ink },
          itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.3)' }
        },
        data: [
          { value: 1142, name: 'X光安检', itemStyle: { color: accent } },
          { value: 687, name: '毫米波扫描', itemStyle: { color: accent2 } },
          { value: 523, name: '金属探测', itemStyle: { color: success } },
          { value: 312, name: 'CT扫描', itemStyle: { color: warning } },
          { value: 183, name: '人工复检', itemStyle: { color: danger } }
        ]
      }
    ]
  });
  window.addEventListener('resize', function() { chartType.resize(); });

  // --- Real-time clock update ---
  function updateClock() {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    var h = String(now.getHours()).padStart(2, '0');
    var min = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');
    var el = document.getElementById('datetime');
    if (el) el.textContent = y + '-' + m + '-' + d + ' ' + h + ':' + min + ':' + s;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // --- 暴露图表实例与接口给 live.js（实时数据由 live.js 统一接管，避免重复更新 stat-*）---
  window.SecGateCharts = {
    flowChart: chartFlow,
    typeChart: chartType,
    // 用最新一帧检测结果刷新「安检类型分布」饼图
    updateType: function(detections) {
      if (!detections || !detections.length) return;
      var colorMap = {
        '刀具': accent, '剪刀': accent, '瓶装液体': accent2,
        '玻璃容器': accent2, '餐具(叉)': warning, '棍棒物': danger,
        '球状物': success, '可疑背包': '#a855f7', '可疑手提包': '#a855f7',
        '行李箱': '#a855f7', '人员': success, '笔记本电脑': muted
      };
      var counts = {};
      detections.forEach(function(d) {
        counts[d.label] = (counts[d.label] || 0) + 1;
      });
      var data = Object.keys(counts).map(function(k) {
        return { name: k, value: counts[k], itemStyle: { color: colorMap[k] || accent } };
      });
      chartType.setOption({ series: [{ data: data }] });
    }
  };

})();
