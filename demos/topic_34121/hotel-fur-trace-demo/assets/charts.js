// assets/charts.js
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var bg3 = style.getPropertyValue('--bg3').trim();
  var danger = style.getPropertyValue('--danger').trim();
  var warning = style.getPropertyValue('--warning').trim();

  // --- Chart: Admin Dashboard Trend ---
  var chartEl = document.getElementById('chart-admin-trend');
  if (chartEl) {
    var chart = echarts.init(chartEl, null, { renderer: 'svg' });
    var months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    var passRate = [96.2, 96.8, 97.1, 97.5, 97.8, 98.1, 98.3, 98.0, 98.5, 98.8, 99.0, 99.2];
    var scanCount = [3200, 3800, 4200, 5100, 5800, 6200, 6800, 7100, 7500, 7800, 8100, 8432];

    chart.setOption({
      animation: false,
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        backgroundColor: bg3,
        borderColor: rule,
        textStyle: { color: ink, fontSize: 12 },
        formatter: function(params) {
          var s = '<strong>' + params[0].axisValue + '</strong><br/>';
          params.forEach(function(p) {
            var val = p.seriesName === '清洗合格率' ? p.value + '%' : p.value.toLocaleString() + '次';
            s += '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + p.color + ';margin-right:6px"></span>' + p.seriesName + ': ' + val + '<br/>';
          });
          return s;
        }
      },
      legend: {
        data: ['清洗合格率', '旅客扫码次数'],
        top: 0,
        right: 0,
        textStyle: { color: muted, fontSize: 11 }
      },
      grid: {
        top: 40,
        left: 50,
        right: 50,
        bottom: 30
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted, fontSize: 11 },
        axisTick: { show: false }
      },
      yAxis: [
        {
          type: 'value',
          min: 95,
          max: 100,
          splitLine: { lineStyle: { color: rule, type: 'dashed' } },
          axisLabel: { color: muted, fontSize: 11, formatter: '{value}%' },
          axisLine: { show: false },
          axisTick: { show: false }
        },
        {
          type: 'value',
          splitLine: { show: false },
          axisLabel: { color: muted, fontSize: 11 },
          axisLine: { show: false },
          axisTick: { show: false }
        }
      ],
      series: [
        {
          name: '清洗合格率',
          type: 'line',
          yAxisIndex: 0,
          data: passRate,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5, color: accent3 },
          itemStyle: { color: accent3 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16,185,129,0.25)' },
                { offset: 1, color: 'rgba(16,185,129,0)' }
              ]
            }
          }
        },
        {
          name: '旅客扫码次数',
          type: 'bar',
          yAxisIndex: 1,
          data: scanCount,
          barWidth: '40%',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: accent },
                { offset: 1, color: accent2 }
              ]
            },
            borderRadius: [3, 3, 0, 0]
          }
        }
      ]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }
})();
