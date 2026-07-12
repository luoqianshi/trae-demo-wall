// PipeAI Demo - ECharts
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var bg = style.getPropertyValue('--bg').trim();

  window.initCharts = function() {
    var d = DEMO_DATA;

    // --- 1. Medium Distribution (Pie) ---
    var medMap = {};
    d.pipeLines.forEach(function(p) { medMap[p.medium || '未知'] = (medMap[p.medium || '未知'] || 0) + 1; });
    var medData = Object.keys(medMap).map(function(k) { return { name: k, value: medMap[k] }; });
    medData.sort(function(a, b) { return b.value - a.value; });

    var c1 = echarts.init(document.getElementById('chart-medium'), null, { renderer: 'svg' });
    c1.setOption({
      animation: false,
      tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}: {c} 条 ({d}%)' },
      color: [accent, accent2, '#a78bfa', '#34d399', '#fbbf24', '#f87171'],
      series: [{
        type: 'pie', radius: ['40%', '70%'], center: ['50%', '55%'],
        label: { color: muted, fontSize: 11 },
        data: medData
      }]
    });
    window.addEventListener('resize', function() { c1.resize(); });

    // --- 2. Nominal Diameter Distribution (Bar) ---
    var dnMap = {};
    d.pipeLines.forEach(function(p) { dnMap[p.nominalSize || '未知'] = (dnMap[p.nominalSize || '未知'] || 0) + 1; });
    var dnKeys = Object.keys(dnMap).sort(function(a, b) {
      return parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, ''));
    });

    var c2 = echarts.init(document.getElementById('chart-diameter'), null, { renderer: 'svg' });
    c2.setOption({
      animation: false,
      tooltip: { trigger: 'axis', appendToBody: true },
      grid: { left: 60, right: 20, top: 20, bottom: 40 },
      xAxis: { type: 'category', data: dnKeys, axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: rule } } },
      yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } }, axisLine: { show: false } },
      series: [{
        type: 'bar', data: dnKeys.map(function(k) { return dnMap[k]; }),
        itemStyle: { color: accent, borderRadius: [3, 3, 0, 0] },
        label: { show: true, position: 'top', color: muted, fontSize: 10 }
      }]
    });
    window.addEventListener('resize', function() { c2.resize(); });

    // --- 3. Summary Category Stats (Bar) ---
    var catMap = {};
    var detCount = {};
    d.summaryTable.forEach(function(r) {
      if (r.rowType === 'category') { catMap[r.category] = 0; detCount[r.category] = 0; }
      if (r.rowType === 'detail' && r.category) { detCount[r.category] = (detCount[r.category] || 0) + 1; }
    });
    var catKeys = Object.keys(catMap);

    var c3 = echarts.init(document.getElementById('chart-summary-cat'), null, { renderer: 'svg' });
    c3.setOption({
      animation: false,
      tooltip: { trigger: 'axis', appendToBody: true },
      grid: { left: 80, right: 20, top: 20, bottom: 40 },
      xAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } }, axisLine: { show: false } },
      yAxis: { type: 'category', data: catKeys, axisLabel: { color: ink, fontSize: 11 }, axisLine: { lineStyle: { color: rule } } },
      series: [{
        type: 'bar', data: catKeys.map(function(k) { return detCount[k] || 0; }),
        itemStyle: { color: accent2, borderRadius: [0, 3, 3, 0] },
        label: { show: true, position: 'right', color: muted, fontSize: 10 }
      }]
    });
    window.addEventListener('resize', function() { c3.resize(); });

    // --- 4. Pipe Length (Bar) ---
    var plData = d.pipeCharTable.filter(function(r) { return r.pipeSpec && r.pipeSpec.indexOf('×') > -1; }).map(function(r) {
      return { lineNo: r.lineNo, spec: r.pipeSpec, medium: r.medium };
    });
    // Group by spec
    var specMap = {};
    d.pipeLines.forEach(function(p) {
      if (p.pipeSpec) { specMap[p.pipeSpec] = (specMap[p.pipeSpec] || 0) + (p.length || 0); }
    });
    var specKeys = Object.keys(specMap).sort(function(a, b) { return specMap[b] - specMap[a]; }).slice(0, 10);

    var c4 = echarts.init(document.getElementById('chart-length'), null, { renderer: 'svg' });
    c4.setOption({
      animation: false,
      tooltip: { trigger: 'axis', appendToBody: true },
      grid: { left: 90, right: 20, top: 20, bottom: 40 },
      xAxis: { type: 'value', name: '长度(m)', nameTextStyle: { color: muted, fontSize: 10 }, axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: rule } }, axisLine: { show: false } },
      yAxis: { type: 'category', data: specKeys, axisLabel: { color: ink, fontSize: 10 }, axisLine: { lineStyle: { color: rule } } },
      series: [{
        type: 'bar', data: specKeys.map(function(k) { return specMap[k]; }),
        itemStyle: { color: '#a78bfa', borderRadius: [0, 3, 3, 0] },
        label: { show: true, position: 'right', color: muted, fontSize: 10, formatter: '{c}m' }
      }]
    });
    window.addEventListener('resize', function() { c4.resize(); });
  };
})();
