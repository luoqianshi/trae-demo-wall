(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: Forgetting Curve ---
  var chartForgetting = echarts.init(document.getElementById('chart-forgetting'), null, { renderer: 'svg' });

  // Generate data for forgetting curve
  var days = [];
  var retentionNoReview = [];
  var retentionWithReview = [];

  for (var i = 0; i <= 30; i++) {
    days.push(i);
    // Ebbinghaus forgetting curve: R = e^(-t/S) where S is memory strength
    // No review: rapid decay
    var rNoReview = Math.exp(-i / 1.5) * 100;
    retentionNoReview.push(rNoReview.toFixed(1));

    // With spaced review at days 1, 3, 7, 14
    var rWithReview;
    if (i <= 1) {
      rWithReview = Math.exp(-i / 2.5) * 100;
    } else if (i <= 3) {
      rWithReview = Math.exp(-(i - 1) / 3.5) * 85 + 15;
    } else if (i <= 7) {
      rWithReview = Math.exp(-(i - 3) / 5) * 80 + 20;
    } else if (i <= 14) {
      rWithReview = Math.exp(-(i - 7) / 7) * 78 + 22;
    } else {
      rWithReview = Math.exp(-(i - 14) / 10) * 75 + 25;
    }
    retentionWithReview.push(Math.min(rWithReview, 100).toFixed(1));
  }

  chartForgetting.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: 'rgba(250,248,243,0.95)',
      borderColor: rule,
      textStyle: { color: ink },
      formatter: function(params) {
        var result = '第 ' + params[0].axisValue + ' 天<br/>';
        params.forEach(function(item) {
          result += item.marker + ' ' + item.seriesName + ': ' + item.value + '%<br/>';
        });
        return result;
      }
    },
    legend: {
      data: ['未复习', '间隔复习'],
      top: 0,
      right: 0,
      textStyle: { color: muted }
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
      boundaryGap: false,
      data: days,
      name: '天数',
      nameTextStyle: { color: muted },
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, interval: 4 }
    },
    yAxis: {
      type: 'value',
      name: '记忆留存率 (%)',
      min: 0,
      max: 100,
      nameTextStyle: { color: muted },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } },
      axisLabel: { color: muted }
    },
    series: [
      {
        name: '未复习',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#7BA3C9', width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(123,163,201,0.25)' },
              { offset: 1, color: 'rgba(123,163,201,0.02)' }
            ]
          }
        },
        data: retentionNoReview
      },
      {
        name: '间隔复习',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: accent2, width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(196,154,59,0.2)' },
              { offset: 1, color: 'rgba(196,154,59,0.02)' }
            ]
          }
        },
        data: retentionWithReview,
        markPoint: {
          data: [
            { coord: [1, retentionWithReview[1]], value: '第1次复习', itemStyle: { color: accent2 } },
            { coord: [3, retentionWithReview[3]], value: '第2次复习', itemStyle: { color: accent2 } },
            { coord: [7, retentionWithReview[7]], value: '第3次复习', itemStyle: { color: accent2 } },
            { coord: [14, retentionWithReview[14]], value: '第4次复习', itemStyle: { color: accent2 } }
          ],
          label: { color: ink, fontSize: 11 }
        }
      }
    ]
  });

  window.addEventListener('resize', function() {
    chartForgetting.resize();
  });
})();
