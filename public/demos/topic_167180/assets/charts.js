// assets/charts.js — 邮游记提案 vs 实现对比分析报告
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // ========== Chart 1: 提案模块实现进度总览 (Heatmap) ==========
  var chartOverview = echarts.init(document.getElementById('chart-overview'), null, { renderer: 'svg' });

  var modules = ['形象生成', '专注 × 旅行', '公益联动', '手记系统', '桌面交互', '情感安全', '邮差邮局'];
  var aspects = ['核心功能', '交互深度', '社交连接', 'AI 集成', '数据闭环'];

  // 0=缺失, 0.5=部分, 1=完整, 1.5=超越
  var data = [
    // 形象生成
    [0, 1.5, 0, 1.5, 1],
    [0, 1.5, 0, 1.5, 0],
    // 专注×旅行
    [0, 1.5, 0, 1.5, 0],
    [1.5, 1, 0, 1, 1],
    // 公益联动
    [0, 1.5, 0, 1.5, 0],
    [0, 1, 0, 0.5, 0.5],
    // 手记系统
    [0, 1.5, 0, 1.5, 0],
    [1, 1.5, 0, 1, 1],
    // 桌面交互
    [0, 1.5, 0, 1.5, 0],
    [0.5, 0.5, 0, 0, 0],
    // 情感安全
    [0, 1.5, 0, 1.5, 0],
    [1, 1, 0, 0, 1],
    // 邮差邮局
    [0, 1.5, 0, 1.5, 0],
    [0, 0, 0, 0, 0],
  ];

  // Normalize data to 0-100 for heatmap
  var normalizedData = [];
  data.forEach(function(d) {
    normalizedData.push([d[1], d[0], Math.round((d[4] === undefined ? d[3] : (d[2] || d[3] || d[4])) * 100)]);
  });

  // Better: use a simpler dataset
  var heatData = [];
  var heatValues = [
    [1.0, 1.5, 0.0, 1.5, 1.0],  // 形象生成
    [1.5, 1.0, 0.0, 1.0, 1.0],  // 专注×旅行
    [1.0, 0.5, 0.0, 0.5, 0.5],  // 公益联动
    [1.0, 1.5, 0.0, 1.0, 1.0],  // 手记系统
    [0.5, 0.5, 0.0, 0.0, 0.0],  // 桌面交互
    [1.0, 1.0, 0.0, 0.0, 1.0],  // 情感安全
    [0.0, 0.0, 0.0, 0.0, 0.0],  // 邮差邮局
  ];

  for (var yi = 0; yi < modules.length; yi++) {
    for (var xi = 0; xi < aspects.length; xi++) {
      heatData.push([xi, yi, heatValues[yi][xi]]);
    }
  }

  chartOverview.setOption({
    animation: false,
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      formatter: function(p) {
        var labels = { 0: '缺失', 0.5: '部分实现', 1.0: '完整实现', 1.5: '超越提案' };
        return '<strong>' + modules[p.value[1]] + '</strong> × ' + aspects[p.value[0]] +
          '<br/>状态：' + (labels[p.value[2]] || p.value[2]);
      }
    },
    grid: { top: 60, bottom: 80, left: 90, right: 40 },
    xAxis: {
      type: 'category',
      data: aspects,
      axisLabel: { color: muted, fontSize: 11 },
      axisLine: { lineStyle: { color: rule } },
      axisTick: { show: false },
      splitArea: { show: false }
    },
    yAxis: {
      type: 'category',
      data: modules,
      axisLabel: { color: ink, fontSize: 12 },
      axisLine: { lineStyle: { color: rule } },
      axisTick: { show: false },
      splitArea: { show: false }
    },
    visualMap: {
      min: 0,
      max: 1.5,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 5,
      inRange: {
        color: ['#FDE8E8', '#FFF0E5', '#E8F5F2', '#7A9E7E']
      },
      text: ['超越', '缺失'],
      textStyle: { color: muted, fontSize: 11 },
      itemWidth: 16,
      itemHeight: 160
    },
    series: [{
      type: 'heatmap',
      data: heatData,
      label: {
        show: true,
        formatter: function(p) {
          var labels = { 0: '缺失', 0.5: '部分', 1: '完整', 1.5: '超越' };
          return labels[p.value[2]] || '';
        },
        color: ink,
        fontSize: 11,
        fontWeight: 600
      },
      itemStyle: { borderColor: '#fff', borderWidth: 3, borderRadius: 4 },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.15)' }
      }
    }]
  });

  window.addEventListener('resize', function() { chartOverview.resize(); });


  // ========== Chart 2: 提案功能实现状态矩阵 (Stacked Bar) ==========
  var chartMatrix = echarts.init(document.getElementById('chart-matrix'), null, { renderer: 'svg' });

  var matrixModules = ['形象生成', '专注 × 旅行', '公益联动', '手记系统', '桌面交互', '情感安全', '邮差邮局/社交'];

  // 各模块中四种状态的功能点数量
  var matrixDone   = [2, 3, 2, 2, 0, 3, 0]; // 已完整实现
  var matrixBeyond = [1, 1, 2, 1, 1, 1, 0]; // 超越提案
  var matrixPart   = [1, 0, 1, 0, 1, 0, 0]; // 部分实现
  var matrixMiss   = [0, 0, 0, 0, 3, 0, 4]; // 未实现

  // tooltip 详细描述映射
  var matrixDetails = {
    '形象生成': { done: '画风6种/情感6种', beyond: '程序化动画', part: '声音复刻(仅录制)', miss: '' },
    '专注 × 旅行': { done: '四模式/拍卖会/天气', beyond: '碎片收集模式', part: '', miss: '' },
    '公益联动': { done: '15目的地/集结页', beyond: '智能推荐/LBS签到', part: '真实API未对接', miss: '' },
    '手记系统': { done: '双视角/明信片/信件', beyond: '专注见证机制', part: '', miss: '' },
    '桌面交互': { done: '', beyond: '邮差心情系统', part: '声音播放无克隆', miss: '桌面微交互/双人模式' },
    '情感安全': { done: '安静模式/封存/透明', beyond: '温柔收束机制', part: '', miss: '' },
    '邮差邮局/社交': { done: '', beyond: '', part: '', miss: '偶遇/代信/纪念墙/双人' }
  };

  chartMatrix.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      appendToBody: true,
      formatter: function(params) {
        var mod = params[0].name;
        var d = matrixDetails[mod];
        var total = 0;
        var rows = params.map(function(p) {
          if (p.value > 0) {
            total += p.value;
            var detail = '';
            if (p.seriesName === '已完整实现') detail = d.done;
            if (p.seriesName === '超越提案') detail = d.beyond;
            if (p.seriesName === '部分实现') detail = d.part;
            if (p.seriesName === '未实现') detail = d.miss;
            return '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + p.color + ';margin-right:6px;"></span>' +
              p.seriesName + ' <strong>' + p.value + '项</strong>' +
              (detail ? ' <span style="color:' + muted + ';font-size:0.85em;">(' + detail + ')</span>' : '');
          }
          return '';
        }).filter(function(s) { return s !== ''; }).join('<br/>');
        return '<strong>' + mod + '</strong>（共 ' + total + ' 个功能点）<br/>' + rows;
      }
    },
    legend: {
      bottom: 5,
      textStyle: { color: muted, fontSize: 12 },
      data: ['已完整实现', '超越提案', '部分实现', '未实现']
    },
    grid: { top: 15, bottom: 50, left: 105, right: 30 },
    xAxis: {
      type: 'value',
      axisLabel: { color: muted, fontSize: 11 },
      axisLine: { lineStyle: { color: rule } },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      data: matrixModules,
      axisLabel: { color: ink, fontSize: 12, fontWeight: 600 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: '已完整实现',
        type: 'bar',
        stack: 'total',
        data: matrixDone,
        barWidth: 24,
        itemStyle: { color: accent2, borderRadius: [0, 0, 0, 0] },
        label: {
          show: true,
          position: 'inside',
          formatter: function(p) { return p.value > 0 ? p.value : ''; },
          color: '#fff',
          fontSize: 12,
          fontWeight: 700
        }
      },
      {
        name: '超越提案',
        type: 'bar',
        stack: 'total',
        data: matrixBeyond,
        itemStyle: { color: '#5A8E5E' },
        label: {
          show: true,
          position: 'inside',
          formatter: function(p) { return p.value > 0 ? p.value : ''; },
          color: '#fff',
          fontSize: 12,
          fontWeight: 700
        }
      },
      {
        name: '部分实现',
        type: 'bar',
        stack: 'total',
        data: matrixPart,
        itemStyle: { color: accent },
        label: {
          show: true,
          position: 'inside',
          formatter: function(p) { return p.value > 0 ? p.value : ''; },
          color: '#fff',
          fontSize: 12,
          fontWeight: 700
        }
      },
      {
        name: '未实现',
        type: 'bar',
        stack: 'total',
        data: matrixMiss,
        itemStyle: { color: '#B85450', borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'inside',
          formatter: function(p) { return p.value > 0 ? p.value : ''; },
          color: '#fff',
          fontSize: 12,
          fontWeight: 700
        }
      }
    ]
  });

  window.addEventListener('resize', function() { chartMatrix.resize(); });


  // ========== Chart 3: 提案外创新功能分布 (Radar) ==========
  var chartBeyond = echarts.init(document.getElementById('chart-beyond'), null, { renderer: 'svg' });

  chartBeyond.setOption({
    animation: false,
    tooltip: {
      appendToBody: true,
      trigger: 'item'
    },
    radar: {
      indicator: [
        { name: '游戏化深度', max: 5 },
        { name: '叙事沉浸感', max: 5 },
        { name: '情感连接', max: 5 },
        { name: '技术复杂度', max: 5 },
        { name: '体验完整性', max: 5 },
        { name: '原创性', max: 5 }
      ],
      radius: '65%',
      center: ['50%', '55%'],
      name: { textStyle: { color: ink, fontSize: 12, fontWeight: 600 } },
      splitArea: { areaStyle: { color: ['rgba(232,221,211,0.3)', 'rgba(255,245,235,0.3)'] } },
      axisLine: { lineStyle: { color: rule } },
      splitLine: { lineStyle: { color: rule } }
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: [4.5, 5, 4.5, 4, 4, 5],
          name: '邮游记 v34',
          lineStyle: { color: accent, width: 2 },
          itemStyle: { color: accent },
          areaStyle: { color: accent + '33' }
        },
        {
          value: [3, 3, 2, 2, 3, 2],
          name: '提案构想',
          lineStyle: { color: muted, width: 2, type: 'dashed' },
          itemStyle: { color: muted },
          areaStyle: { color: muted + '22' }
        }
      ]
    }],
    legend: {
      bottom: 5,
      textStyle: { color: muted, fontSize: 12 },
      data: ['邮游记 v34', '提案构想']
    }
  });

  window.addEventListener('resize', function() { chartBeyond.resize(); });


  // ========== Chart 4: 提案模块完成度 (Horizontal Bar) ==========
  var chartCompletion = echarts.init(document.getElementById('chart-completion'), null, { renderer: 'svg' });

  var completionData = [
    { name: '形象生成', value: 90 },
    { name: '专注 × 旅行', value: 95 },
    { name: '公益联动', value: 55 },
    { name: '手记系统', value: 85 },
    { name: '桌面交互', value: 40 },
    { name: '情感安全', value: 80 },
    { name: '邮差邮局/社交', value: 15 },
  ].reverse();

  chartCompletion.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      appendToBody: true,
      formatter: function(params) {
        return params[0].name + '：完成度 ' + params[0].value + '%';
      }
    },
    grid: { top: 20, bottom: 30, left: 110, right: 60 },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { color: muted, fontSize: 11, formatter: '{value}%' },
      axisLine: { lineStyle: { color: rule } },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      data: completionData.map(function(d) { return d.name; }),
      axisLabel: { color: ink, fontSize: 12 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [{
      type: 'bar',
      data: completionData.map(function(d) {
        var color = d.value >= 80 ? accent2 : (d.value >= 50 ? accent : '#B85450');
        return {
          value: d.value,
          itemStyle: {
            color: color,
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            formatter: d.value + '%',
            color: ink,
            fontSize: 12,
            fontWeight: 700
          }
        };
      }),
      barWidth: 22
    }]
  });

  window.addEventListener('resize', function() { chartCompletion.resize(); });

})();
