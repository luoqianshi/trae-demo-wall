(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart 1: Daily Generation vs Consumption Curve ---
  var chart1 = echarts.init(document.getElementById('chart-daily-curve'), null, { renderer: 'svg' });
  chart1.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: bg2,
      borderColor: rule,
      textStyle: { color: ink }
    },
    legend: {
      data: ['光伏发电量 (kW)', '用户用电量 (kW)'],
      top: 10,
      textStyle: { color: muted }
    },
    grid: { left: 60, right: 30, top: 60, bottom: 50 },
    xAxis: {
      type: 'category',
      data: ['00:00','01:00','02:00','03:00','04:00','05:00','06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value',
      name: '功率 (kW)',
      nameTextStyle: { color: muted },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } },
      axisLabel: { color: muted }
    },
    series: [
      {
        name: '光伏发电量 (kW)',
        type: 'line',
        smooth: true,
        data: [0,0,0,0,0,0.2,1.5,4.2,7.8,9.5,10.2,10.8,11.0,10.5,9.8,8.2,5.5,2.8,0.8,0,0,0,0,0],
        lineStyle: { color: accent, width: 3 },
        itemStyle: { color: accent },
        areaStyle: { color: accent + '22' },
        symbol: 'none'
      },
      {
        name: '用户用电量 (kW)',
        type: 'line',
        smooth: true,
        data: [1.2,0.8,0.6,0.5,0.5,0.8,2.5,4.0,3.5,2.8,2.5,2.8,3.2,3.0,2.8,2.5,2.8,3.5,5.2,6.8,5.5,3.2,2.0,1.5],
        lineStyle: { color: accent2, width: 3 },
        itemStyle: { color: accent2 },
        areaStyle: { color: accent2 + '22' },
        symbol: 'none'
      }
    ]
  });
  window.addEventListener('resize', function() { chart1.resize(); });

  // --- Chart 2: Annual Cost Comparison ---
  var chart2 = echarts.init(document.getElementById('chart-cost-compare'), null, { renderer: 'svg' });
  chart2.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: bg2,
      borderColor: rule,
      textStyle: { color: ink }
    },
    legend: {
      data: ['无光伏（纯电网购电）', '有光伏无储能', '有光伏+储能（绿电智储）'],
      top: 10,
      textStyle: { color: muted }
    },
    grid: { left: 60, right: 30, top: 60, bottom: 50 },
    xAxis: {
      type: 'category',
      data: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value',
      name: '电费支出 (元)',
      nameTextStyle: { color: muted },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } },
      axisLabel: { color: muted }
    },
    series: [
      {
        name: '无光伏（纯电网购电）',
        type: 'bar',
        data: [420,380,360,340,380,520,680,650,480,390,400,450],
        itemStyle: { color: muted + '66' },
        barGap: '10%'
      },
      {
        name: '有光伏无储能',
        type: 'bar',
        data: [280,250,220,190,210,320,450,420,290,240,260,300],
        itemStyle: { color: accent2 + 'aa' }
      },
      {
        name: '有光伏+储能（绿电智储）',
        type: 'bar',
        data: [120,100,80,60,70,140,220,200,110,90,100,130],
        itemStyle: { color: accent }
      }
    ]
  });
  window.addEventListener('resize', function() { chart2.resize(); });

  // --- Chart 3: ROI Payback Analysis ---
  var chart3 = echarts.init(document.getElementById('chart-roi'), null, { renderer: 'svg' });
  var years = ['第0年','第1年','第2年','第3年','第4年','第5年','第6年','第7年','第8年','第9年','第10年','第11年','第12年','第13年','第14年','第15年'];
  var cumulativeCash = [-45000, -36500, -28000, -19500, -11000, -2500, 6000, 14500, 23000, 31500, 40000, 48500, 57000, 65500, 74000, 82500];
  var annualSave = [0, 8500, 8500, 8500, 8500, 8500, 8500, 8500, 8500, 8500, 8500, 8500, 8500, 8500, 8500, 8500];

  chart3.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: bg2,
      borderColor: rule,
      textStyle: { color: ink }
    },
    legend: {
      data: ['累计净收益 (元)', '年度节省 (元)'],
      top: 10,
      textStyle: { color: muted }
    },
    grid: { left: 70, right: 60, top: 60, bottom: 50 },
    xAxis: {
      type: 'category',
      data: years,
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, rotate: 30 }
    },
    yAxis: [
      {
        type: 'value',
        name: '累计净收益 (元)',
        nameTextStyle: { color: muted },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } },
        axisLabel: { color: muted }
      },
      {
        type: 'value',
        name: '年度节省 (元)',
        nameTextStyle: { color: muted },
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: muted }
      }
    ],
    series: [
      {
        name: '累计净收益 (元)',
        type: 'line',
        smooth: true,
        data: cumulativeCash,
        lineStyle: { color: accent, width: 3 },
        itemStyle: { color: accent },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: accent + '44' },
              { offset: 1, color: accent + '08' }
            ]
          }
        },
        markLine: {
          silent: true,
          data: [{ yAxis: 0, label: { formatter: '盈亏平衡点', color: ink } }],
          lineStyle: { color: ink, type: 'dashed', width: 2 }
        },
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: '年度节省 (元)',
        type: 'bar',
        yAxisIndex: 1,
        data: annualSave,
        itemStyle: { color: accent2 + '77' },
        barWidth: '40%'
      }
    ]
  });
  window.addEventListener('resize', function() { chart3.resize(); });
})();
