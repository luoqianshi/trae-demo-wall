// assets/charts.js
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // Store chart instances for resize
  var charts = [];

  // --- Chart: 全年温度预测曲线 ---
  function initYearChart(data) {
    var el = document.getElementById('chart-year');
    if (!el) return;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    charts.push(chart);

    var dates = data.map(function(d) { return d.date.slice(5); });
    var temps = data.map(function(d) { return d.pred_temp; });
    var anomalies = data.map(function(d) { return d.anomaly; });

    chart.setOption({
      animation: false,
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        formatter: function(params) {
          var idx = params[0].dataIndex;
          var d = data[idx];
          return '<strong>' + d.date + '</strong><br/>' +
            '预测温度: <strong>' + d.pred_temp + '°C</strong><br/>' +
            '异常指数: ' + d.anomaly.toFixed(2) + '<br/>' +
            '干支: ' + d.year_ganzhi + ' ' + d.month_ganzhi + ' ' + d.day_ganzhi + '<br/>' +
            '运气: ' + d.suiyun + ' | ' + d.sitian + '<br/>' +
            '规则触发: ' + d.rule_count + ' 条';
        }
      },
      grid: { left: 50, right: 20, top: 40, bottom: 40 },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { interval: 29, color: muted, fontSize: 10 },
        axisLine: { lineStyle: { color: rule } },
        splitLine: { show: false }
      },
      yAxis: [
        {
          type: 'value',
          name: '温度 (°C)',
          nameTextStyle: { color: muted, fontSize: 11 },
          axisLabel: { color: muted },
          splitLine: { lineStyle: { color: rule, type: 'dashed' } }
        },
        {
          type: 'value',
          name: '异常指数',
          nameTextStyle: { color: muted, fontSize: 11 },
          axisLabel: { color: muted },
          splitLine: { show: false },
          min: -3, max: 3
        }
      ],
      series: [
        {
          name: '预测温度',
          type: 'line',
          data: temps,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: accent, width: 2 },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: accent + '40' },
                { offset: 1, color: accent + '05' }
              ]
            }
          },
          markLine: {
            silent: true,
            data: [
              { yAxis: 25, label: { formatter: '25°C 舒适线', color: muted, fontSize: 10 } }
            ],
            lineStyle: { color: rule, type: 'dashed' }
          }
        },
        {
          name: '异常指数',
          type: 'bar',
          yAxisIndex: 1,
          data: anomalies,
          itemStyle: {
            color: function(p) {
              return p.value >= 0 ? accent2 + '80' : accent + '80';
            }
          },
          barWidth: '60%'
        }
      ]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  // --- Chart: 月度平均温度 ---
  function initMonthChart(data) {
    var el = document.getElementById('chart-month');
    if (!el) return;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    charts.push(chart);

    var monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    var monthly = [];
    for (var m = 1; m <= 12; m++) {
      var days = data.filter(function(d) { return d.month === m; });
      var avg = days.reduce(function(s, d) { return s + d.pred_temp; }, 0) / days.length;
      monthly.push(parseFloat(avg.toFixed(1)));
    }

    chart.setOption({
      animation: false,
      tooltip: { trigger: 'axis', appendToBody: true },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: monthNames,
        axisLabel: { color: muted },
        axisLine: { lineStyle: { color: rule } }
      },
      yAxis: {
        type: 'value',
        name: '温度 (°C)',
        nameTextStyle: { color: muted },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      series: [{
        type: 'bar',
        data: monthly,
        itemStyle: {
          color: function(p) {
            var colors = ['#3b82f6','#3b82f6','#60a5fa','#f59e0b','#f97316','#ef4444',
                          '#ef4444','#ef4444','#f97316','#f59e0b','#60a5fa','#3b82f6'];
            return colors[p.dataIndex] || accent;
          },
          borderRadius: [4,4,0,0]
        },
        barWidth: '60%',
        label: {
          show: true,
          position: 'top',
          formatter: function(p) { return p.value + '°C'; },
          color: muted,
          fontSize: 10
        }
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  // --- Chart: 特征重要性 ---
  function initFeatureChart(features) {
    var el = document.getElementById('chart-features');
    if (!el) return;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    charts.push(chart);

    var names = features.map(function(f) { return f.name; }).reverse();
    var values = features.map(function(f) { return f.importance; }).reverse();

    chart.setOption({
      animation: false,
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        formatter: function(p) {
          return p[0].name + ': ' + (p[0].value * 100).toFixed(1) + '%';
        }
      },
      grid: { left: 120, right: 40, top: 10, bottom: 20 },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: muted,
          formatter: function(v) { return (v * 100).toFixed(0) + '%'; }
        },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLabel: { color: ink, fontSize: 11 },
        axisLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'bar',
        data: values,
        barWidth: '65%',
        itemStyle: {
          color: function(p) {
            return p.value >= 0.03 ? accent : accent2;
          },
          borderRadius: [0, 4, 4, 0]
        },
        label: {
          show: true,
          position: 'right',
          formatter: function(p) { return (p.value * 100).toFixed(1) + '%'; },
          color: muted,
          fontSize: 10
        }
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  // --- Chart: 规则触发分布 ---
  function initRuleChart(data) {
    var el = document.getElementById('chart-rules');
    if (!el) return;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    charts.push(chart);

    var sources = {};
    data.forEach(function(d) {
      d.rules.forEach(function(r) {
        var src = r.id.split('_')[0];
        sources[src] = (sources[src] || 0) + 1;
      });
    });

    var srcNames = { ky: '开元占经', ys: '乙巳占', lj: '娄景书', wb: '武备志' };
    var names = Object.keys(sources).map(function(k) { return srcNames[k] || k; });
    var vals = Object.keys(sources).map(function(k) { return sources[k]; });

    chart.setOption({
      animation: false,
      tooltip: { trigger: 'item', appendToBody: true },
      series: [{
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['50%', '50%'],
        data: names.map(function(n, i) {
          return { name: n, value: vals[i] };
        }),
        label: { color: ink, fontSize: 11 },
        labelLine: { lineStyle: { color: rule } },
        itemStyle: {
          color: function(p) {
            var colors = [accent, accent2, '#f59e0b', '#8b5cf6'];
            return colors[p.dataIndex % colors.length];
          },
          borderRadius: 4
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' }
        }
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  // Expose init functions globally
  window.initYearChart = initYearChart;
  window.initMonthChart = initMonthChart;
  window.initFeatureChart = initFeatureChart;
  window.initRuleChart = initRuleChart;
})();
