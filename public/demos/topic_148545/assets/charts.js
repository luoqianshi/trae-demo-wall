(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var danger = style.getPropertyValue('--danger').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  window.chartInstances = {};

  var palette = [accent, accent2, accent3, '#8b5cf6', '#ec4899'];

  function commonOption() {
    return {
      animation: false,
      backgroundColor: 'transparent',
      textStyle: { fontFamily: 'inherit', color: ink },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: rule,
        textStyle: { color: ink },
        appendToBody: true
      },
      grid: { left: 50, right: 20, top: 30, bottom: 30, containLabel: true },
      legend: { textStyle: { color: muted }, bottom: 0 }
    };
  }

  // --- T3 Product Type Pie ---
  var chartT3Product = echarts.init(document.getElementById('chart-t3-product'), null, { renderer: 'svg' });
  chartT3Product.setOption(Object.assign(commonOption(), {
    tooltip: { trigger: 'item', backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: rule, textStyle: { color: ink } },
    legend: { show: false },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: bg2, borderWidth: 2 },
      label: { show: true, color: ink, formatter: '{b}\n{d}%' },
      labelLine: { lineStyle: { color: muted } },
      data: [
        { value: 2403.51, name: '快车', itemStyle: { color: accent } },
        { value: 793.83, name: '优享', itemStyle: { color: accent2 } },
        { value: 314.97, name: '专车', itemStyle: { color: accent3 } }
      ]
    }]
  }));
  window.chartInstances['t3-product'] = chartT3Product;

  // --- T3 Surge Hourly Bar ---
  var chartT3Surge = echarts.init(document.getElementById('chart-t3-surge'), null, { renderer: 'svg' });
  chartT3Surge.setOption(Object.assign(commonOption(), {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: rule, textStyle: { color: ink } },
    grid: { left: 40, right: 20, top: 20, bottom: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: [7, 8, 9, 10, 13, 14, 17, 18, 19, 21, 22, 23].map(function(h) { return h + ':00'; }),
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(51,65,85,0.4)' } },
      axisLabel: { color: muted }
    },
    series: [
      {
        name: '溢价订单数',
        type: 'bar',
        data: [5, 2, 7, 1, 2, 1, 2, 1, 1, 3, 1, 1],
        itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] },
        barWidth: '50%'
      },
      {
        name: '平均溢价倍数',
        type: 'line',
        data: [1.58, 1.35, 1.4, 2.0, 1.6, 1.2, 1.6, 2.0, 1.2, 1.3, 2.0, 2.0],
        itemStyle: { color: accent3 },
        lineStyle: { width: 2 },
        symbol: 'circle',
        symbolSize: 6,
        yAxisIndex: 0
      }
    ]
  }));
  window.chartInstances['t3-surge'] = chartT3Surge;

  // --- T3 Hourly Efficiency (Combo) ---
  var chartT3Hourly = echarts.init(document.getElementById('chart-t3-hourly'), null, { renderer: 'svg' });
  chartT3Hourly.setOption(Object.assign(commonOption(), {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: rule, textStyle: { color: ink } },
    grid: { left: 50, right: 50, top: 30, bottom: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: [7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 21, 22, 23].map(function(h) { return h + ':00'; }),
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: [
      {
        type: 'value',
        name: '小时收入(元)',
        nameTextStyle: { color: muted },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(51,65,85,0.4)' } },
        axisLabel: { color: muted }
      },
      {
        type: 'value',
        name: '订单数',
        nameTextStyle: { color: muted },
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: muted }
      }
    ],
    series: [
      {
        name: '预估小时收入',
        type: 'line',
        data: [55.41, 55.26, 53.19, 44.63, 44.62, 48.52, 45.52, 44.91, 51.37, 52.24, 57.23, 52.86, 48.96, 48.28, 48.1],
        smooth: true,
        itemStyle: { color: accent },
        lineStyle: { width: 3 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
          { offset: 0, color: 'rgba(6,182,212,0.25)' },
          { offset: 1, color: 'rgba(6,182,212,0.02)' }
        ]}},
        symbol: 'circle',
        symbolSize: 5
      },
      {
        name: '总订单数',
        type: 'bar',
        data: [11, 10, 13, 5, 2, 2, 3, 2, 1, 8, 4, 6, 4, 4, 4],
        yAxisIndex: 1,
        itemStyle: { color: 'rgba(148,163,184,0.25)', borderRadius: [3, 3, 0, 0] },
        barWidth: '35%'
      },
      {
        name: '溢价订单数',
        type: 'bar',
        data: [5, 2, 7, 1, 0, 0, 2, 1, 0, 2, 1, 1, 3, 1, 1],
        yAxisIndex: 1,
        itemStyle: { color: accent3, borderRadius: [3, 3, 0, 0] },
        barWidth: '35%'
      }
    ]
  }));
  window.chartInstances['t3-hourly'] = chartT3Hourly;

  // --- Didi Product Type Pie ---
  var chartDidiProduct = echarts.init(document.getElementById('chart-didi-product'), null, { renderer: 'svg' });
  chartDidiProduct.setOption(Object.assign(commonOption(), {
    tooltip: { trigger: 'item', backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: rule, textStyle: { color: ink } },
    legend: { show: false },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: bg2, borderWidth: 2 },
      label: { show: true, color: ink, formatter: '{b}\n{d}%' },
      labelLine: { lineStyle: { color: muted } },
      data: [
        { value: 1764.94, name: '快车', itemStyle: { color: accent } },
        { value: 550.61, name: '专车', itemStyle: { color: accent2 } },
        { value: 511.05, name: '优享', itemStyle: { color: accent3 } }
      ]
    }]
  }));
  window.chartInstances['didi-product'] = chartDidiProduct;

  // --- Compare Surge Horizontal Bar ---
  var chartCompareSurge = echarts.init(document.getElementById('chart-compare-surge'), null, { renderer: 'svg' });
  chartCompareSurge.setOption(Object.assign(commonOption(), {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: rule, textStyle: { color: ink } },
    grid: { left: 80, right: 30, top: 20, bottom: 30, containLabel: true },
    xAxis: {
      type: 'value',
      max: 50,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(51,65,85,0.4)' } },
      axisLabel: { color: muted, formatter: '{value}%' }
    },
    yAxis: {
      type: 'category',
      data: ['顺路单占比', '溢价订单占比'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: ink, fontWeight: 500 }
    },
    series: [
      {
        name: 'T3',
        type: 'bar',
        data: [21.5, 34.2],
        itemStyle: { color: accent, borderRadius: [0, 4, 4, 0] },
        barWidth: 18,
        label: { show: true, position: 'right', color: accent, formatter: '{c}%' }
      },
      {
        name: '滴滴',
        type: 'bar',
        data: [17.7, 43.5],
        itemStyle: { color: accent2, borderRadius: [0, 4, 4, 0] },
        barWidth: 18,
        label: { show: true, position: 'right', color: accent2, formatter: '{c}%' }
      }
    ]
  }));
  window.chartInstances['compare-surge'] = chartCompareSurge;

  // --- T3 Carpool Comparison ---
  var chartT3Carpool = echarts.init(document.getElementById('chart-t3-carpool'), null, { renderer: 'svg' });
  chartT3Carpool.setOption(Object.assign(commonOption(), {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: rule, textStyle: { color: ink } },
    legend: { textStyle: { color: muted }, bottom: 0 },
    grid: { left: 40, right: 20, top: 20, bottom: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: ['平均单价(元)', '平均里程(km)', '平均时长(分)'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(51,65,85,0.4)' } },
      axisLabel: { color: muted }
    },
    series: [
      {
        name: '非顺路单',
        type: 'bar',
        data: [47.8, 15.6, 41.2],
        itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] },
        barWidth: '30%'
      },
      {
        name: '顺路单',
        type: 'bar',
        data: [32.3, 8.6, 24.2],
        itemStyle: { color: accent3, borderRadius: [4, 4, 0, 0] },
        barWidth: '30%'
      }
    ]
  }));
  window.chartInstances['t3-carpool'] = chartT3Carpool;

  // --- Didi Carpool Comparison ---
  var chartDidiCarpool = echarts.init(document.getElementById('chart-didi-carpool'), null, { renderer: 'svg' });
  chartDidiCarpool.setOption(Object.assign(commonOption(), {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: rule, textStyle: { color: ink } },
    legend: { textStyle: { color: muted }, bottom: 0 },
    grid: { left: 40, right: 20, top: 20, bottom: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: ['平均单价(元)', '平均里程(km)', '平均时长(分)'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(51,65,85,0.4)' } },
      axisLabel: { color: muted }
    },
    series: [
      {
        name: '非顺路单',
        type: 'bar',
        data: [44.9, 14.2, 37.9],
        itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] },
        barWidth: '30%'
      },
      {
        name: '顺路单',
        type: 'bar',
        data: [48.9, 16.4, 43.7],
        itemStyle: { color: accent3, borderRadius: [4, 4, 0, 0] },
        barWidth: '30%'
      }
    ]
  }));
  window.chartInstances['didi-carpool'] = chartDidiCarpool;

  // --- Heatmap Scatter (T3 pickup coordinates) ---
  var heatmapData = [[118.734567,32.034567,25.41,"虹悦城"],[118.796786,31.970968,40.0,"南京南站"],[118.778901,31.989012,31.19,"软件大道"],[118.745678,32.078901,63.63,"桥北"],[118.745678,32.078901,31.99,"桥北"],[118.912345,31.923456,57.66,"江宁大学城"],[118.865486,31.742222,96.36,"禄口机场"],[118.712345,32.023456,39.8,"奥体新城"],[118.712345,32.023456,17.28,"奥体新城"],[118.856789,32.056789,52.82,"中山陵"],[118.756789,32.056789,86.66,"省人民医院"],[118.865486,31.742222,83.48,"禄口机场"],[118.856789,32.056789,52.93,"中山陵"],[118.912345,31.923456,52.89,"江宁大学城"],[118.745678,32.078901,32.21,"桥北"],[118.797684,32.087778,57.87,"南京站"],[118.778262,32.048526,18.94,"新街口商圈"],[118.856789,32.056789,43.77,"中山陵"],[118.778262,32.048526,50.83,"新街口"],[118.865486,31.742222,107.86,"禄口机场"],[118.856789,32.056789,34.53,"中山陵"],[118.745678,32.078901,51.26,"桥北"],[118.778262,32.048526,60.84,"新街口"],[118.856789,32.056789,31.16,"中山陵"],[118.723456,32.012345,30.21,"河西万达"],[118.778901,31.989012,32.42,"软件大道"],[118.856789,32.056789,31.26,"中山陵"],[118.794567,32.023456,92.46,"夫子庙"],[118.865486,31.742222,102.92,"禄口机场"],[118.778262,32.048526,26.94,"新街口商圈"],[118.856789,32.056789,42.73,"中山陵"],[118.794567,32.023456,24.35,"夫子庙"],[118.778262,32.048526,18.62,"新街口"],[118.723456,32.012345,73.58,"河西万达"],[118.796786,31.970968,46.0,"南京南站"],[118.865486,31.742222,76.12,"禄口机场"],[118.745678,32.078901,25.21,"桥北"],[118.778901,31.989012,30.14,"软件大道"],[118.712345,32.023456,53.69,"奥体新城"],[118.756789,32.056789,18.72,"省人民医院"],[118.712345,32.023456,75.37,"奥体新城"],[118.796786,31.970968,31.09,"南京南站"],[118.745678,32.078901,29.13,"桥北"],[118.778901,32.045678,22.17,"鼓楼医院"],[118.778262,32.048526,27.19,"新街口"],[118.778901,31.989012,29.08,"软件大道"],[118.723456,32.012345,51.93,"河西万达"],[118.794567,32.023456,90.9,"夫子庙"],[118.723456,32.012345,27.35,"河西万达"],[118.723456,32.012345,24.83,"河西万达"],[118.778901,31.989012,27.52,"软件大道"],[118.778901,32.045678,21.71,"鼓楼医院"],[118.794567,32.023456,17.29,"夫子庙"],[118.734567,32.034567,67.89,"虹悦城"],[118.723456,32.012345,30.76,"河西CBD"],[118.778901,31.989012,26.88,"软件大道"],[118.923456,32.112345,55.45,"仙林大学城"],[118.734567,32.034567,22.78,"虹悦城"],[118.794567,32.023456,27.58,"夫子庙"],[118.778262,32.048526,16.29,"新街口商圈"],[118.778901,31.989012,46.18,"软件大道"],[118.865486,31.742222,110.49,"禄口机场"],[118.778262,32.048526,24.05,"新街口"],[118.794567,32.023456,27.79,"夫子庙"],[118.723456,32.012345,96.65,"河西万达"],[118.790123,32.078901,15.74,"玄武湖"],[118.756789,32.056789,17.55,"省人民医院"],[118.778901,32.045678,62.3,"鼓楼医院"],[118.865486,31.742222,113.41,"禄口机场"],[118.712345,32.023456,29.69,"奥体新城"],[118.912345,31.923456,63.92,"江宁大学城"],[118.756789,32.056789,18.11,"省人民医院"],[118.745678,32.078901,24.81,"桥北"],[118.923456,32.112345,52.16,"仙林大学城"],[118.723456,32.012345,19.59,"河西万达"],[118.723456,32.012345,15.14,"河西万达"],[118.923456,32.112345,56.2,"仙林大学城"],[118.794567,32.023456,24.56,"夫子庙"],[118.797684,32.087778,24.04,"南京站"]];

  var chartHeatmap = echarts.init(document.getElementById('chart-heatmap'), null, { renderer: 'svg' });
  chartHeatmap.setOption({
    animation: false,
    backgroundColor: 'transparent',
    textStyle: { fontFamily: 'inherit', color: ink },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: rule,
      textStyle: { color: ink },
      appendToBody: true,
      formatter: function(p) {
        return '<strong>' + p.data[3] + '</strong><br/>金额: ¥' + p.data[2] + '<br/>经度: ' + p.data[0] + '<br/>纬度: ' + p.data[1];
      }
    },
    grid: { left: 60, right: 30, top: 20, bottom: 50 },
    xAxis: {
      type: 'value',
      name: '经度',
      nameTextStyle: { color: muted },
      min: 118.70,
      max: 118.94,
      axisLine: { lineStyle: { color: rule } },
      splitLine: { lineStyle: { color: 'rgba(51,65,85,0.25)' } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value',
      name: '纬度',
      nameTextStyle: { color: muted },
      min: 31.72,
      max: 32.13,
      axisLine: { lineStyle: { color: rule } },
      splitLine: { lineStyle: { color: 'rgba(51,65,85,0.25)' } },
      axisLabel: { color: muted }
    },
    visualMap: {
      min: 15,
      max: 120,
      dimension: 2,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      textStyle: { color: muted },
      inRange: {
        color: [bg2, accent, accent3],
        symbolSize: [8, 28]
      },
      calculable: true
    },
    series: [{
      type: 'scatter',
      data: heatmapData,
      itemStyle: {
        shadowBlur: 10,
        shadowColor: accent + '66'
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 20,
          shadowColor: accent
        }
      }
    }]
  });
  window.chartInstances['heatmap'] = chartHeatmap;

  // Resize listeners
  window.addEventListener('resize', function() {
    Object.values(window.chartInstances).forEach(function(c) { c.resize(); });
  });
})();
