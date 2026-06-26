(function() {
  // Only initialize if landing charts exist in DOM
  if (!document.getElementById('chart-monthly')) return;

  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var bg3 = style.getPropertyValue('--bg3').trim();
  var gold = style.getPropertyValue('--gold').trim();

  // Common chart config
  var commonGrid = {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '10%',
    containLabel: true
  };

  var commonTooltip = {
    trigger: 'axis',
    backgroundColor: bg3,
    borderColor: rule,
    textStyle: { color: ink },
    appendToBody: true
  };

  // --- Chart: Monthly Profit/Loss ---
  var chartMonthly = echarts.init(document.getElementById('chart-monthly'), null, { renderer: 'svg' });
  chartMonthly.setOption({
    animation: false,
    tooltip: commonTooltip,
    grid: commonGrid,
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, formatter: '¥{value}' },
      splitLine: { lineStyle: { color: rule, opacity: 0.3 } }
    },
    series: [{
      type: 'bar',
      data: [
        { value: 3200, itemStyle: { color: accent } },
        { value: -1500, itemStyle: { color: accent2 } },
        { value: 4800, itemStyle: { color: accent } },
        { value: 2100, itemStyle: { color: accent } },
        { value: -800, itemStyle: { color: accent2 } },
        { value: 5600, itemStyle: { color: accent } }
      ],
      barWidth: '50%',
      label: {
        show: true,
        position: 'top',
        color: ink,
        formatter: function(p) {
          return p.value >= 0 ? '+' + p.value : p.value;
        }
      }
    }]
  });
  window.addEventListener('resize', function() { chartMonthly.resize(); });

  // --- Chart: Profit/Loss Distribution (Pie) ---
  var chartPie = echarts.init(document.getElementById('chart-pie'), null, { renderer: 'svg' });
  chartPie.setOption({
    animation: false,
    tooltip: {
      trigger: 'item',
      backgroundColor: bg3,
      borderColor: rule,
      textStyle: { color: ink },
      appendToBody: true,
      formatter: '{b}: {c}笔 ({d}%)'
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
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: bg3,
        borderWidth: 2
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold',
          color: ink
        }
      },
      data: [
        { value: 18, name: '盈利交易', itemStyle: { color: accent } },
        { value: 12, name: '亏损交易', itemStyle: { color: accent2 } },
        { value: 5, name: '持平交易', itemStyle: { color: muted } }
      ]
    }]
  });
  window.addEventListener('resize', function() { chartPie.resize(); });

  // --- Chart: Cumulative Returns ---
  var chartCumulative = echarts.init(document.getElementById('chart-cumulative'), null, { renderer: 'svg' });
  var days = [];
  var cumulativeData = [];
  var base = 0;
  for (var i = 1; i <= 30; i++) {
    days.push(i + '日');
    base += (Math.random() - 0.35) * 2000;
    cumulativeData.push(Math.round(base));
  }
  chartCumulative.setOption({
    animation: false,
    tooltip: commonTooltip,
    grid: commonGrid,
    xAxis: {
      type: 'category',
      data: days,
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, formatter: '¥{value}' },
      splitLine: { lineStyle: { color: rule, opacity: 0.3 } }
    },
    series: [{
      type: 'line',
      data: cumulativeData,
      smooth: true,
      symbol: 'none',
      lineStyle: {
        color: accent,
        width: 3
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: accent + '40' },
            { offset: 1, color: accent + '05' }
          ]
        }
      }
    }]
  });
  window.addEventListener('resize', function() { chartCumulative.resize(); });

  // --- Chart: Win Rate Trend ---
  var chartWinrate = echarts.init(document.getElementById('chart-winrate'), null, { renderer: 'svg' });
  var weeks = ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周', '第8周'];
  var winrateData = [45, 52, 48, 60, 55, 63, 58, 65];
  chartWinrate.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      backgroundColor: bg3,
      borderColor: rule,
      textStyle: { color: ink },
      appendToBody: true,
      formatter: function(params) {
        return params[0].name + '<br/>胜率: ' + params[0].value + '%';
      }
    },
    grid: commonGrid,
    xAxis: {
      type: 'category',
      data: weeks,
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: rule, opacity: 0.3 } }
    },
    series: [{
      type: 'line',
      data: winrateData,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        color: gold,
        width: 3
      },
      itemStyle: {
        color: gold,
        borderColor: bg3,
        borderWidth: 2
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: gold + '30' },
            { offset: 1, color: gold + '05' }
          ]
        }
      },
      markLine: {
        silent: true,
        lineStyle: { color: muted, type: 'dashed' },
        data: [{ yAxis: 50 }],
        label: { formatter: '50%基准线', color: muted }
      }
    }]
  });
  window.addEventListener('resize', function() { chartWinrate.resize(); });

})();
