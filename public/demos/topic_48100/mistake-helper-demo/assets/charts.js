// assets/charts.js
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accentDark = style.getPropertyValue('--accent-dark').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var bg = style.getPropertyValue('--bg').trim();

  // === Cloud Functions Radar Chart ===
  var chartEl = document.getElementById('chart-cloud-functions');
  if (chartEl) {
    var chart = echarts.init(chartEl, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        formatter: function(params) {
          if (params.seriesType === 'radar') {
            var detail = params.data.details || {};
            var html = '<strong>' + params.name + '</strong><br/>';
            for (var key in detail) {
              html += key + ': ' + detail[key] + '<br/>';
            }
            return html;
          }
          return params.name + ': ' + params.value;
        }
      },
      legend: {
        bottom: 0,
        textStyle: { color: muted, fontSize: 12 }
      },
      radar: {
        indicator: [
          { name: 'AI能力', max: 5 },
          { name: '数据处理', max: 5 },
          { name: '用户交互', max: 5 },
          { name: '算法复杂度', max: 5 },
          { name: 'API数量', max: 5 },
          { name: '核心程度', max: 5 }
        ],
        shape: 'circle',
        splitNumber: 5,
        axisName: {
          color: ink,
          fontSize: 12
        },
        splitLine: {
          lineStyle: { color: rule }
        },
        splitArea: {
          show: false
        },
        axisLine: {
          lineStyle: { color: rule }
        }
      },
      series: [{
        type: 'radar',
        data: [
          {
            value: [5, 4, 2, 5, 3, 5],
            name: 'aiSolveService',
            details: { 'AI能力': '多模态VL+文本', '数据处理': '图片转base64', 'API': 'solveByImage/solve/generateSimilar' },
            areaStyle: { color: accent + '30' },
            lineStyle: { color: accent, width: 2 },
            itemStyle: { color: accent }
          },
          {
            value: [0, 4, 3, 3, 5, 5],
            name: 'mistakeService',
            details: { 'AI能力': '无', 'API': 'add/update/delete/list/detail/search' },
            areaStyle: { color: accent2 + '30' },
            lineStyle: { color: accent2, width: 2 },
            itemStyle: { color: accent2 }
          },
          {
            value: [1, 4, 4, 4, 4, 4],
            name: 'exerciseService',
            details: { 'AI能力': '组卷算法', 'API': 'generate/submit/getHistory/getStats' },
            areaStyle: { color: '#34C75930' },
            lineStyle: { color: '#34C759', width: 2 },
            itemStyle: { color: '#34C759' }
          },
          {
            value: [1, 3, 4, 5, 4, 4],
            name: 'reviewService',
            details: { '算法': '艾宾浩斯曲线', 'API': 'getTodayReview/submitReview/getStats/getStreak' },
            areaStyle: { color: '#AF52DE30' },
            lineStyle: { color: '#AF52DE', width: 2 },
            itemStyle: { color: '#AF52DE' }
          },
          {
            value: [3, 4, 1, 3, 1, 3],
            name: 'ocrService',
            details: { 'AI能力': '腾讯云OCR', 'API': 'recognize' },
            areaStyle: { color: '#FF950030' },
            lineStyle: { color: '#FF9500', width: 2 },
            itemStyle: { color: '#FF9500' }
          },
          {
            value: [0, 3, 3, 2, 4, 3],
            name: 'userService',
            details: { 'API': 'login/updateInfo/updateSettings/getUserInfo' },
            areaStyle: { color: '#FF3B3030' },
            lineStyle: { color: '#FF3B30', width: 2 },
            itemStyle: { color: '#FF3B30' }
          }
        ]
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }
})();
