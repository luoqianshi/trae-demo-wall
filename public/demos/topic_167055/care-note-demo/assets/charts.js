// assets/charts.js — Care Note Demo Charts (v3) — mood improves over time
var chartsInited = {};

function initCharts() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var warning = '#e67e22';

  // Mood data: score 1=平静 3=焦躁 — TREND: improving (anxiety decreases over time)
  function makeMoodData() {
    var days = [], moodData = [];
    for (var i = 29; i >= 0; i--) {
      var d = new Date(); d.setDate(d.getDate() - i);
      days.push((d.getMonth() + 1) + '/' + d.getDate());
      // Early days: high anxiety (high scores), later days: much calmer (low scores)
      var base = 2.2 - (29 - i) * 0.035; // linear decrease from ~2.2 to ~1.2
      var noise = Math.sin(i * 1.3) * 0.3 + Math.random() * 0.25 - 0.12;
      moodData.push(Math.max(1, Math.min(3, base + noise)));
    }
    return { days: days, data: moodData };
  }

  function makeMoodChartOptions(days, data) {
    return {
      animation: false,
      tooltip: { trigger: 'axis', appendToBody: true,
        formatter: function(p) {
          var v = p[0].value;
          var label = v >= 2.5 ? '焦躁' : v >= 1.8 ? '一般' : '平静';
          return p[0].axisValue + '<br/>情绪评分: ' + v.toFixed(1) + ' (' + label + ')';
        }
      },
      grid: { left: 50, right: 20, top: 30, bottom: 40 },
      xAxis: { type: 'category', data: days, axisLabel: { color: muted, fontSize: 10, interval: 4 }, axisLine: { lineStyle: { color: rule } } },
      yAxis: { type: 'value', min: 1, max: 3, splitNumber: 3,
        axisLabel: { color: muted, fontSize: 10, formatter: function(v) { var l = { 1: '平静', 2: '一般', 3: '焦躁' }; return l[v] || ''; } },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      series: [{
        type: 'line', data: data, smooth: true,
        lineStyle: { color: accent, width: 2 },
        itemStyle: { color: accent },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: accent + '30' }, { offset: 1, color: accent + '05' }] } },
        symbolSize: 4
      }],
      markLine: { silent: true, data: [{ yAxis: 2.2, label: { formatter: '关注线', color: warning, fontSize: 10 }, lineStyle: { color: warning, type: 'dashed' } }] }
    };
  }

  function initMoodChart(elId) {
    var el = document.getElementById(elId);
    if (!el || chartsInited[elId]) return;
    chartsInited[elId] = true;
    var d = makeMoodData();
    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption(makeMoodChartOptions(d.days, d.data));
    window.addEventListener('resize', function() { chart.resize(); });
  }

  function initVolumeChart() {
    var el = document.getElementById('chart-volume');
    if (!el || chartsInited['chart-volume']) return;
    chartsInited['chart-volume'] = true;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      tooltip: { trigger: 'axis', appendToBody: true },
      grid: { left: 50, right: 20, top: 30, bottom: 40 },
      xAxis: { type: 'category', data: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周', '第8周'],
        axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: rule } } },
      yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10 },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } } },
      series: [{
        type: 'bar', data: [12, 18, 25, 32, 38, 45, 52, 58],
        itemStyle: { color: accent2, borderRadius: [4, 4, 0, 0] },
        barWidth: '50%'
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  function initHeatmap() {
    var el = document.getElementById('chart-heatmap');
    if (!el || chartsInited['chart-heatmap']) return;
    chartsInited['chart-heatmap'] = true;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    var weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    var timeSlots = ['6-8时', '8-10时', '10-12时', '12-14时', '14-16时', '16-18时', '18-20时'];
    var heatData = [
      [0,0,0],[0,1,1],[0,2,0],[0,3,2],[0,4,3],[0,5,1],[0,6,0],
      [1,0,1],[1,1,0],[1,2,1],[1,3,1],[1,4,2],[1,5,1],[1,6,0],
      [2,0,0],[2,1,1],[2,2,0],[2,3,3],[2,4,4],[2,5,2],[2,6,1],
      [3,0,1],[3,1,0],[3,2,2],[3,3,1],[3,4,3],[3,5,1],[3,6,0],
      [4,0,0],[4,1,1],[4,2,1],[4,3,2],[4,4,4],[4,5,2],[4,6,1],
      [5,0,1],[5,1,0],[5,2,0],[5,3,1],[5,4,2],[5,5,3],[5,6,1],
      [6,0,0],[6,1,1],[6,2,0],[6,3,1],[6,4,1],[6,5,2],[6,6,0]
    ];
    chart.setOption({
      animation: false,
      tooltip: { appendToBody: true,
        formatter: function(p) { return weekDays[p.value[0]] + ' ' + timeSlots[p.value[1]] + '<br/>焦躁次数: ' + p.value[2]; }
      },
      grid: { left: 50, right: 30, top: 10, bottom: 40 },
      xAxis: { type: 'category', data: timeSlots, axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: rule } }, splitArea: { show: false } },
      yAxis: { type: 'category', data: weekDays, axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: rule } }, splitArea: { show: false } },
      visualMap: { min: 0, max: 4, show: false, inRange: { color: ['#f5f0eb', '#fde8d0', '#f5b041', '#e67e22', '#c0392b'] } },
      series: [{ type: 'heatmap', data: heatData, label: { show: true, fontSize: 10, color: ink }, itemStyle: { borderWidth: 2, borderColor: '#fff' } }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  // --- Chart: Category pie ---
  function initCategoryChart() {
    var el = document.getElementById('chart-category');
    if (!el || chartsInited['chart-category']) return;
    chartsInited['chart-category'] = true;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c}条 ({d}%)' },
      legend: { bottom: 0, textStyle: { color: muted, fontSize: 10 }, itemWidth: 10, itemHeight: 10, itemGap: 8 },
      series: [{
        type: 'pie', radius: ['42%', '70%'], center: ['50%', '45%'],
        label: { show: true, color: ink, fontSize: 11, formatter: '{b}\n{d}%' },
        labelLine: { lineStyle: { color: rule } },
        data: [
          { value: 42, name: '情绪行为', itemStyle: { color: accent } },
          { value: 35, name: '日常照顾', itemStyle: { color: accent2 } },
          { value: 28, name: '社会互动', itemStyle: { color: '#e67e22' } },
          { value: 20, name: '交班要点', itemStyle: { color: '#7b5ea7' } },
          { value: 15, name: '身体状况', itemStyle: { color: '#27ae60' } },
          { value: 10, name: '医疗突发', itemStyle: { color: '#c0392b' } }
        ]
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  // --- Chart: Floor comparison bar ---
  function initFloorChart() {
    var el = document.getElementById('chart-floor');
    if (!el || chartsInited['chart-floor']) return;
    chartsInited['chart-floor'] = true;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      tooltip: { trigger: 'axis', appendToBody: true },
      legend: { top: 0, textStyle: { color: muted, fontSize: 10 }, itemWidth: 10, itemHeight: 10, itemGap: 12 },
      grid: { left: 45, right: 15, top: 35, bottom: 40 },
      xAxis: { type: 'category', data: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
        axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: rule } } },
      yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10 },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } } },
      series: [
        { name: '一楼', type: 'bar', stack: 'total', data: [4, 6, 8, 11, 13, 16, 18, 21], itemStyle: { color: accent, borderRadius: [0,0,0,0] } },
        { name: '二楼', type: 'bar', stack: 'total', data: [5, 7, 10, 13, 15, 18, 21, 23], itemStyle: { color: accent2 } },
        { name: '三楼', type: 'bar', stack: 'total', data: [3, 5, 7, 8, 10, 11, 13, 14], itemStyle: { color: '#7b5ea7', borderRadius: [4,4,0,0] } }
      ]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  initMoodChart('chart-mood');
  initMoodChart('chart-mood2');
  initVolumeChart();
  initHeatmap();
  initCategoryChart();
  initFloorChart();
}
