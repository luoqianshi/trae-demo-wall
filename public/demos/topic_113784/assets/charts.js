(function () {
  if (typeof echarts === 'undefined') return;

  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var accent4 = style.getPropertyValue('--accent4').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  var fontFamily = "Bricolage, 'PingFang SC', 'Microsoft YaHei', sans-serif";

  // ============ Chart 1 — Pain Points (horizontal bar) ============
  var painEl = document.getElementById('chart-pain');
  if (painEl) {
    var painData = [
      { name: '难以坚持·三分钟热度', value: 88 },
      { name: '抵触专业心理干预', value: 82 },
      { name: '无人共鸣·孤独内耗', value: 78 },
      { name: '生活无序·拖延严重', value: 74 },
      { name: '疏导无方法', value: 71 },
      { name: '心理健康知识盲区', value: 65 },
      { name: '情绪认知缺失', value: 60 }
    ];
    var painChart = echarts.init(painEl, null, { renderer: 'svg' });
    painChart.setOption({
      animation: false,
      textStyle: { fontFamily: fontFamily, color: ink },
      grid: { left: 140, right: 30, top: 20, bottom: 30 },
      tooltip: { trigger: 'axis', appendToBody: true, axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'value', max: 100,
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      yAxis: {
        type: 'category',
        data: painData.map(function (d) { return d.name; }),
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false },
        axisLabel: { color: ink, fontSize: 12 }
      },
      series: [{
        type: 'bar', data: painData.map(function (d) { return d.value; }),
        barWidth: 16,
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: function (p) {
            var arr = [accent2, accent4, accent, accent3];
            return arr[p.dataIndex % arr.length];
          }
        },
        label: { show: true, position: 'right', color: ink, formatter: '{c}%' }
      }]
    });
    window.addEventListener('resize', function () { painChart.resize(); });
  }

  // ============ Chart 2 — Radar 五位一体 ============
  var radarEl = document.getElementById('chart-radar');
  if (radarEl) {
    var radarChart = echarts.init(radarEl, null, { renderer: 'svg' });
    radarChart.setOption({
      animation: false,
      textStyle: { fontFamily: fontFamily, color: ink },
      tooltip: { appendToBody: true },
      legend: {
        data: ['双树心境', '传统心理 App', '自律打卡工具'],
        top: 8, textStyle: { color: ink }
      },
      radar: {
        indicator: [
          { name: '情绪预防', max: 100 },
          { name: '游戏化体验', max: 100 },
          { name: '专业心理', max: 100 },
          { name: '社区互助', max: 100 },
          { name: 'AI 私教', max: 100 }
        ],
        radius: '65%',
        splitArea: { areaStyle: { color: ['rgba(0,0,0,0)', bg2] } },
        axisName: { color: ink, fontSize: 12 },
        axisLine: { lineStyle: { color: rule } },
        splitLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'radar',
        emphasis: { focus: 'self' },
        data: [
          {
            name: '双树心境',
            value: [95, 90, 85, 88, 92],
            areaStyle: { color: 'rgba(136,184,154,0.35)' },
            lineStyle: { color: accent, width: 2 },
            itemStyle: { color: accent }
          },
          {
            name: '传统心理 App',
            value: [60, 30, 80, 25, 35],
            areaStyle: { color: 'rgba(243,164,181,0.20)' },
            lineStyle: { color: accent2, width: 2 },
            itemStyle: { color: accent2 }
          },
          {
            name: '自律打卡工具',
            value: [40, 65, 25, 50, 30],
            areaStyle: { color: 'rgba(184,164,212,0.20)' },
            lineStyle: { color: accent4, width: 2 },
            itemStyle: { color: accent4 }
          }
        ]
      }]
    });
    window.addEventListener('resize', function () { radarChart.resize(); });
  }

  // ============ Chart 3 — Yearly activity ============
  var yearlyEl = document.getElementById('chart-yearly');
  if (yearlyEl) {
    var months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    var worry = [12, 18, 22, 16, 14, 20, 25, 22, 18, 15, 12, 10];
    var happy = [8, 10, 14, 18, 22, 24, 21, 24, 27, 28, 30, 32];
    var stars = [22, 30, 42, 38, 40, 50, 58, 56, 55, 60, 65, 75];

    var yearlyChart = echarts.init(yearlyEl, null, { renderer: 'svg' });
    yearlyChart.setOption({
      animation: false,
      textStyle: { fontFamily: fontFamily, color: ink },
      tooltip: { trigger: 'axis', appendToBody: true },
      legend: { data: ['烦心事记录', '小确幸记录', '星星累计'], top: 8, textStyle: { color: ink } },
      grid: { left: 50, right: 30, top: 50, bottom: 40 },
      xAxis: {
        type: 'category', data: months,
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      series: [
        {
          name: '烦心事记录', type: 'bar', data: worry,
          itemStyle: { color: accent, borderRadius: [6, 6, 0, 0] },
          barWidth: 10
        },
        {
          name: '小确幸记录', type: 'bar', data: happy,
          itemStyle: { color: accent2, borderRadius: [6, 6, 0, 0] },
          barWidth: 10
        },
        {
          name: '星星累计', type: 'line', data: stars, smooth: true,
          symbol: 'circle', symbolSize: 8,
          lineStyle: { color: accent3, width: 3 },
          itemStyle: { color: accent3 },
          areaStyle: { color: 'rgba(246,200,115,0.18)' }
        }
      ]
    });
    window.addEventListener('resize', function () { yearlyChart.resize(); });
  }
  // ============ Chart 4 — Star types & pet stages (stacked + threshold) ============
  var starsEl = document.getElementById('chart-stars');
  if (starsEl) {
    var months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    var joy =     [4, 6, 8, 7, 9, 10, 12, 11, 13, 14, 15, 16];   // 美好星 累计每月新增
    var courage = [1, 2, 3, 2, 4, 5, 6, 5, 7, 8, 9, 10];          // 勇气星
    var grit =    [0, 0, 1, 3, 5, 7, 9, 8, 10, 11, 12, 13];       // 毅力星

    function cumsum(arr) { var s = 0; return arr.map(function (v) { s += v; return s; }); }
    var joyC = cumsum(joy), courC = cumsum(courage), gritC = cumsum(grit);

    var starsChart = echarts.init(starsEl, null, { renderer: 'svg' });
    starsChart.setOption({
      animation: false,
      textStyle: { fontFamily: fontFamily, color: ink },
      tooltip: { trigger: 'axis', appendToBody: true },
      legend: {
        data: ['美好星 (Joy)', '勇气星 (Courage)', '毅力星 (Grit)'],
        top: 8, textStyle: { color: ink }
      },
      grid: { left: 50, right: 30, top: 60, bottom: 40 },
      xAxis: {
        type: 'category', data: months,
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      series: [
        {
          name: '美好星 (Joy)', type: 'line', smooth: true,
          data: joyC, symbol: 'circle', symbolSize: 7,
          lineStyle: { color: accent2, width: 3 },
          itemStyle: { color: accent2 },
          areaStyle: { color: 'rgba(243,164,181,0.15)' },
          markLine: {
            silent: true,
            symbol: 'none',
            label: { color: accent2, fontSize: 11, formatter: '萌芽期阈值 30' },
            lineStyle: { color: accent2, type: 'dashed', opacity: 0.6 },
            data: [{ yAxis: 30 }]
          }
        },
        {
          name: '勇气星 (Courage)', type: 'line', smooth: true,
          data: courC, symbol: 'circle', symbolSize: 7,
          lineStyle: { color: accent, width: 3 },
          itemStyle: { color: accent },
          areaStyle: { color: 'rgba(136,184,154,0.15)' },
          markLine: {
            silent: true,
            symbol: 'none',
            label: { color: accent, fontSize: 11, formatter: '成熟期阈值 50' },
            lineStyle: { color: accent, type: 'dashed', opacity: 0.6 },
            data: [{ yAxis: 50 }]
          }
        },
        {
          name: '毅力星 (Grit)', type: 'line', smooth: true,
          data: gritC, symbol: 'circle', symbolSize: 7,
          lineStyle: { color: accent4, width: 3 },
          itemStyle: { color: accent4 },
          areaStyle: { color: 'rgba(184,164,212,0.15)' },
          markLine: {
            silent: true,
            symbol: 'none',
            label: { color: accent4, fontSize: 11, formatter: '幼年期阈值 30' },
            lineStyle: { color: accent4, type: 'dashed', opacity: 0.6 },
            data: [{ yAxis: 30 }]
          }
        }
      ]
    });
    window.addEventListener('resize', function () { starsChart.resize(); });
  }
})();
