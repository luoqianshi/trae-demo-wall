(function() {
  var style = getComputedStyle(document.documentElement);
  var blue500 = style.getPropertyValue('--blue-500').trim();
  var blue600 = style.getPropertyValue('--blue-600').trim();
  var blue100 = style.getPropertyValue('--blue-100').trim();
  var red500 = style.getPropertyValue('--red-500').trim();
  var red100 = style.getPropertyValue('--red-100').trim();
  var green500 = style.getPropertyValue('--green-500').trim();
  var green100 = style.getPropertyValue('--green-100').trim();
  var yellow500 = style.getPropertyValue('--yellow-500').trim();
  var purple500 = style.getPropertyValue('--purple-500').trim();
  var orange500 = style.getPropertyValue('--orange-500').trim();
  var cyan500 = style.getPropertyValue('--cyan-500').trim();
  var gray800 = style.getPropertyValue('--gray-800').trim();
  var gray500 = style.getPropertyValue('--gray-500').trim();
  var gray400 = style.getPropertyValue('--gray-400').trim();
  var gray200 = style.getPropertyValue('--gray-200').trim();
  var gray100 = style.getPropertyValue('--gray-100').trim();
  var gray50 = style.getPropertyValue('--gray-50').trim();
  var white = style.getPropertyValue('--white').trim();

  function makeDates(n) {
    var arr = [];
    var d = new Date();
    d.setDate(d.getDate() - n);
    for (var i = 0; i < n; i++) {
      d.setDate(d.getDate() + 1);
      arr.push((d.getMonth() + 1) + '/' + d.getDate());
    }
    return arr;
  }

  function randWalk(n, start, vol) {
    var arr = [start];
    for (var i = 1; i < n; i++) {
      arr.push(arr[i - 1] + (Math.random() - 0.48) * vol);
    }
    return arr;
  }

  var dates = makeDates(60);
  var shData = randWalk(60, 4150, 35);
  shData[shData.length - 1] = 4082.07;

  var tooltipStyle = {
    backgroundColor: white,
    borderColor: gray200,
    borderWidth: 1,
    textStyle: { color: gray800, fontSize: 12 },
    extraCssText: 'border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);'
  };
  var gridStyle = { strokeDasharray: '3 3', stroke: gray200 };
  var axisLabelStyle = { color: gray400, fontSize: 11 };

  // --- Chart: Market Trend ---
  var chartMarket = echarts.init(document.getElementById('chart-market'), null, { renderer: 'svg' });
  chartMarket.setOption({
    animation: true,
    tooltip: Object.assign({ trigger: 'axis' }, tooltipStyle),
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category', data: dates,
      axisLine: { lineStyle: { color: gray200 } },
      axisLabel: axisLabelStyle
    },
    yAxis: {
      type: 'value', scale: true,
      axisLine: { show: false },
      splitLine: gridStyle,
      axisLabel: axisLabelStyle
    },
    series: [{
      type: 'line', data: shData, smooth: true, symbol: 'none',
      lineStyle: { color: blue500, width: 2 },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: blue500 + '30' },
            { offset: 1, color: blue500 + '05' }
          ]
        }
      },
      markLine: {
        silent: true, symbol: 'none',
        lineStyle: { color: green500, type: 'dashed', width: 1 },
        data: [{ yAxis: 4082.07, label: { formatter: '最新 4082.07', color: green500, fontSize: 10 } }]
      }
    }]
  });
  window.addEventListener('resize', function() { chartMarket.resize(); });

  // --- Chart: Sector Flow ---
  var sectors = ['半导体', '黄金', '银行', '医药', '新能源', '白酒', '房地产', '证券', '军工', '传媒'];
  var sectorVals = [28.5, 22.1, -5.3, -8.7, -12.4, -15.2, -18.6, -21.3, -9.5, -6.8];
  var chartSector = echarts.init(document.getElementById('chart-sector'), null, { renderer: 'svg' });
  chartSector.setOption({
    animation: true,
    tooltip: Object.assign({
      trigger: 'axis',
      formatter: function(p) { return p[0].name + '<br/>净流入: ' + p[0].value + ' 亿'; }
    }, tooltipStyle),
    grid: { left: 60, right: 20, top: 10, bottom: 20 },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: gray200 } },
      splitLine: gridStyle,
      axisLabel: axisLabelStyle
    },
    yAxis: {
      type: 'category', data: sectors, inverse: true,
      axisLine: { lineStyle: { color: gray200 } },
      axisLabel: axisLabelStyle
    },
    series: [{
      type: 'bar', data: sectorVals,
      itemStyle: {
        color: function(p) { return p.value >= 0 ? red500 : green500; },
        borderRadius: [0, 4, 4, 0]
      },
      label: {
        show: true, position: 'right', fontSize: 11,
        color: gray500,
        formatter: function(p) { return p.value > 0 ? '+' + p.value : p.value; }
      }
    }]
  });
  window.addEventListener('resize', function() { chartSector.resize(); });

  // --- Chart: Backtest Compare ---
  var days90 = makeDates(90);
  var trendData = [], meanData = [], momData = [];
  for (var i = 0; i < 90; i++) {
    if (i === 0) { trendData.push(0); meanData.push(0); momData.push(0); }
    else {
      trendData.push(trendData[i-1] + (Math.random() - 0.42) * 1.2);
      meanData.push(meanData[i-1] + (Math.random() - 0.48) * 0.8);
      momData.push(momData[i-1] + (Math.random() - 0.45) * 1.0);
    }
  }
  var chartBacktest = echarts.init(document.getElementById('chart-backtest'), null, { renderer: 'svg' });
  chartBacktest.setOption({
    animation: true,
    tooltip: Object.assign({ trigger: 'axis' }, tooltipStyle),
    legend: { data: ['趋势跟随', '均值回归', '动量轮动'], textStyle: { color: gray500 }, top: 0 },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category', data: days90,
      axisLine: { lineStyle: { color: gray200 } },
      axisLabel: axisLabelStyle
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: gridStyle,
      axisLabel: axisLabelStyle,
      formatter: '{value}%'
    },
    series: [
      { name: '趋势跟随', type: 'line', data: trendData, smooth: true, symbol: 'none', lineStyle: { color: blue500, width: 2 } },
      { name: '均值回归', type: 'line', data: meanData, smooth: true, symbol: 'none', lineStyle: { color: purple500, width: 2 } },
      { name: '动量轮动', type: 'line', data: momData, smooth: true, symbol: 'none', lineStyle: { color: gray400, width: 2 } }
    ]
  });
  window.addEventListener('resize', function() { chartBacktest.resize(); });

  // --- Chart: Storage Pie ---
  var chartStorage = echarts.init(document.getElementById('chart-storage'), null, { renderer: 'svg' });
  chartStorage.setOption({
    animation: true,
    tooltip: Object.assign({ trigger: 'item' }, tooltipStyle),
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: gray500, fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['35%', '50%'],
      label: { show: false },
      data: [
        { value: 180, name: '股票数据', itemStyle: { color: blue500 } },
        { value: 120, name: '另类数据', itemStyle: { color: purple500 } },
        { value: 85, name: '基金数据', itemStyle: { color: orange500 } },
        { value: 45, name: '期货数据', itemStyle: { color: cyan500 } },
        { value: 37.1, name: '其他', itemStyle: { color: gray300 } }
      ]
    }]
  });
  window.addEventListener('resize', function() { chartStorage.resize(); });

  // --- Chart: Factor IC-IR Scatter ---
  var factorData = [
    { name: 'ROE_TTM', ic: 0.056, ir: 1.62 },
    { name: 'PE_TTM', ic: 0.048, ir: 1.35 },
    { name: 'REV_5D', ic: 0.045, ir: 1.28 },
    { name: 'PB_LF', ic: 0.041, ir: 1.18 },
    { name: 'GP_MARGIN', ic: 0.039, ir: 1.12 },
    { name: 'MOM_20D', ic: 0.038, ir: 1.05 },
    { name: 'REV_GROWTH', ic: 0.035, ir: 0.98 },
    { name: 'VOL_20D', ic: -0.032, ir: -0.92 }
  ];
  var chartFactor = echarts.init(document.getElementById('chart-factor-icir'), null, { renderer: 'svg' });
  chartFactor.setOption({
    animation: true,
    tooltip: Object.assign({
      trigger: 'item',
      formatter: function(p) { return p.data.name + '<br/>IC: ' + p.data.ic + '<br/>IR: ' + p.data.ir; }
    }, tooltipStyle),
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'value', name: 'IC', nameTextStyle: { color: gray500, fontSize: 11 },
      axisLine: { lineStyle: { color: gray200 } },
      splitLine: gridStyle,
      axisLabel: axisLabelStyle
    },
    yAxis: {
      type: 'value', name: 'IR', nameTextStyle: { color: gray500, fontSize: 11 },
      axisLine: { lineStyle: { color: gray200 } },
      splitLine: gridStyle,
      axisLabel: axisLabelStyle
    },
    series: [{
      type: 'scatter',
      data: factorData.map(function(f) { return { name: f.name, value: [f.ic, f.ir], ic: f.ic, ir: f.ir }; }),
      symbolSize: 14,
      itemStyle: { color: blue500 },
      label: { show: true, formatter: function(p) { return p.data.name; }, position: 'top', fontSize: 10, color: gray500 }
    }]
  });
  window.addEventListener('resize', function() { chartFactor.resize(); });

  // --- Mini sparklines ---
  function createMiniSparkline(container, data, color) {
    var el = (typeof container === 'string') ? document.getElementById(container) : container;
    if (!el) return;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      grid: { left: 0, right: 0, top: 2, bottom: 2 },
      xAxis: { type: 'category', show: false, data: data.map(function(_, i) { return i; }) },
      yAxis: { type: 'value', show: false },
      series: [{
        type: 'line', data: data, smooth: true, symbol: 'none',
        lineStyle: { color: color, width: 1.5 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color + '20' },
              { offset: 1, color: color + '02' }
            ]
          }
        }
      }]
    });
  }

  window.createMiniSparkline = createMiniSparkline;

})();
