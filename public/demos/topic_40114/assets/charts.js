(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var welfare = style.getPropertyValue('--welfare').trim();
  var elderly = style.getPropertyValue('--elderly').trim();
  var youth = style.getPropertyValue('--youth').trim();

  // --- Chart: Social Impact Flywheel (Circular Graph) ---
  var chart1 = echarts.init(document.getElementById('chart-flywheel'), null, { renderer: 'svg' });
  chart1.setOption({
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true },
    series: [{
      type: 'graph',
      layout: 'circular',
      circular: { rotateLabel: false },
      symbolSize: 80,
      roam: false,
      label: { show: true, fontSize: 11, color: ink, fontWeight: 700 },
      edgeSymbol: ['none', 'arrow'],
      edgeSymbolSize: [0, 10],
      data: [
        { name: 'C端弱势群体\n免费维权', itemStyle: { color: welfare }, label: { color: '#fff' } },
        { name: 'G端监管\n数据赋能', itemStyle: { color: accent2 }, label: { color: '#fff' } },
        { name: 'B端企业\n合规向善', itemStyle: { color: elderly }, label: { color: '#fff' } },
        { name: '社会影响力\n品牌背书', itemStyle: { color: youth }, label: { color: '#fff' } }
      ],
      links: [
        { source: 'C端弱势群体\n免费维权', target: 'G端监管\n数据赋能', lineStyle: { color: welfare, width: 3 } },
        { source: 'G端监管\n数据赋能', target: 'B端企业\n合规向善', lineStyle: { color: accent2, width: 3 } },
        { source: 'B端企业\n合规向善', target: '社会影响力\n品牌背书', lineStyle: { color: elderly, width: 3 } },
        { source: '社会影响力\n品牌背书', target: 'C端弱势群体\n免费维权', lineStyle: { color: youth, width: 3 } }
      ],
      lineStyle: { opacity: 0.9, curveness: 0.1 }
    }]
  });
  window.addEventListener('resize', function() { chart1.resize(); });

  // --- Chart: 3-Year Finance Forecast ---
  var chart2 = echarts.init(document.getElementById('chart-finance'), null, { renderer: 'svg' });
  chart2.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['B端收入', 'G端收入', '公益支出', '运营盈余'],
      bottom: 0,
      textStyle: { color: muted, fontSize: 11 }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['第1年', '第2年', '第3年'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      name: '金额（万元）',
      nameTextStyle: { color: muted, fontSize: 11 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: bg2, type: 'dashed' } },
      axisLabel: { color: muted, fontSize: 11 }
    },
    series: [
      {
        name: 'B端收入',
        type: 'bar',
        stack: 'income',
        barWidth: '35%',
        data: [150, 600, 1500],
        itemStyle: { color: elderly + 'cc' }
      },
      {
        name: 'G端收入',
        type: 'bar',
        stack: 'income',
        data: [50, 200, 500],
        itemStyle: { color: accent2 + 'cc' }
      },
      {
        name: '公益支出',
        type: 'bar',
        stack: 'expense',
        data: [-80, -300, -700],
        itemStyle: { color: welfare + 'cc' }
      },
      {
        name: '运营盈余',
        type: 'line',
        data: [120, 500, 1300],
        itemStyle: { color: accent },
        lineStyle: { color: accent, width: 3 },
        symbol: 'circle',
        symbolSize: 8,
        label: { show: true, position: 'top', formatter: '{c}万', color: accent, fontSize: 12, fontWeight: 700 }
      }
    ]
  });
  window.addEventListener('resize', function() { chart2.resize(); });

})();