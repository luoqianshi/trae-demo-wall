/* FocusPaw Demo — Charts (ECharts) */
(function() {
  'use strict';

  function initCharts() {
    if (typeof echarts === 'undefined') return;

    var style = getComputedStyle(document.documentElement);
    var accent = style.getPropertyValue('--accent').trim() || '#A78BFA';
    var accent2 = style.getPropertyValue('--accent2').trim() || '#4FD1C5';
    var accent3 = style.getPropertyValue('--accent3').trim() || '#818CF8';
    var ink = style.getPropertyValue('--ink').trim() || '#E2E8F0';
    var muted = style.getPropertyValue('--muted').trim() || '#94A3B8';
    var rule = style.getPropertyValue('--rule').trim() || 'rgba(255,255,255,0.08)';

    // --- Phone mini chart: weekly focus bar chart ---
    var chartEl = document.getElementById('phoneChart1');
    if (!chartEl) return;

    var chart = echarts.init(chartEl, null, { renderer: 'svg' });
    chart.setOption({
      grid: { top: 20, left: 30, right: 10, bottom: 24 },
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        formatter: function(params) {
          return params[0].name + '<br/>专注: ' + params[0].value + ' 分钟';
        },
        backgroundColor: 'rgba(10,14,39,0.92)',
        borderWidth: 0,
        textStyle: { color: '#fff', fontSize: 11 },
      },
      xAxis: {
        type: 'category',
        data: ['一','二','三','四','五','六','日'],
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false },
        axisLabel: { color: muted, fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        max: 300,
        splitLine: { lineStyle: { color: rule, type: 'dashed' } },
        axisLabel: { color: muted, fontSize: 9, formatter: '{value}m' },
      },
      series: [{
        type: 'bar',
        data: [
          { value: 180, itemStyle: { color: accent2 } },
          { value: 220, itemStyle: { color: accent2 } },
          { value: 95,  itemStyle: { color: accent3 } },
          { value: 252, itemStyle: { color: accent } },
          { value: 268, itemStyle: { color: accent } },
          { value: 140, itemStyle: { color: accent2 } },
          { value: 252, itemStyle: { color: accent } },
        ],
        barWidth: '55%',
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        label: { show: false },
      }],
    });

    window.addEventListener('resize', function() { chart.resize(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCharts);
  } else {
    initCharts();
  }
})();
