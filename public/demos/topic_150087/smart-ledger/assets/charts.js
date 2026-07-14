// ============================================
// Smart Ledger - Charts
// ============================================
(function() {
  'use strict';

  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent-2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var success = '#22c55e';
  var danger = '#ef4444';
  var warning = '#f59e0b';

  var charts = {};

  // Color palette for categories
  var categoryColors = [
    '#4f7cff', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#a855f7'
  ];

  function getChartColor(index) {
    return categoryColors[index % categoryColors.length];
  }

  // Common axis style
  function getAxisStyle() {
    return {
      axisLine: { lineStyle: { color: rule } },
      axisTick: { show: false },
      axisLabel: { color: muted, fontSize: 12 },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    };
  }

  // Common tooltip
  function getTooltip() {
    return {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: bg2,
      borderColor: rule,
      borderWidth: 1,
      textStyle: { color: ink, fontSize: 12 },
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,0.03)' } }
    };
  }

  // Common legend
  function getLegend() {
    return {
      textStyle: { color: muted, fontSize: 12 },
      itemWidth: 12,
      itemHeight: 12,
      top: 0,
      right: 0
    };
  }

  // ============================================
  // Dashboard - Trend Chart
  // ============================================
  charts.trend = null;
  function initTrendChart() {
    var el = document.getElementById('chart-trend');
    if (!el) return;
    charts.trend = echarts.init(el, null, { renderer: 'svg' });
    updateTrendChart('week');
    window.addEventListener('resize', function() { charts.trend && charts.trend.resize(); });
  }

  function updateTrendChart(period) {
    if (!charts.trend) return;
    var data = window.LedgerData ? window.LedgerData.getTrendData(period) : {
      labels: [], income: [], expense: []
    };

    var option = {
      animation: false,
      tooltip: getTooltip(),
      legend: Object.assign(getLegend(), {
        data: ['收入', '支出']
      }),
      grid: {
        left: 10,
        right: 10,
        top: 40,
        bottom: 10,
        containLabel: true
      },
      xAxis: Object.assign({
        type: 'category',
        data: data.labels,
        boundaryGap: false
      }, getAxisStyle()),
      yAxis: Object.assign({
        type: 'value'
      }, getAxisStyle()),
      series: [
        {
          name: '收入',
          type: 'line',
          data: data.income,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: success, width: 2 },
          itemStyle: { color: success },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(34,197,94,0.15)' },
                { offset: 1, color: 'rgba(34,197,94,0.01)' }
              ]
            }
          }
        },
        {
          name: '支出',
          type: 'line',
          data: data.expense,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: danger, width: 2 },
          itemStyle: { color: danger },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(239,68,68,0.15)' },
                { offset: 1, color: 'rgba(239,68,68,0.01)' }
              ]
            }
          }
        }
      ]
    };
    charts.trend.setOption(option, true);
  }

  // ============================================
  // Dashboard - Category Pie
  // ============================================
  charts.categoryPie = null;
  function initCategoryPie() {
    var el = document.getElementById('chart-category-pie');
    if (!el) return;
    charts.categoryPie = echarts.init(el, null, { renderer: 'svg' });
    updateCategoryPie();
    window.addEventListener('resize', function() { charts.categoryPie && charts.categoryPie.resize(); });
  }

  function updateCategoryPie() {
    if (!charts.categoryPie) return;
    var data = window.LedgerData ? window.LedgerData.getExpenseByCategory() : [];

    var pieData = data.map(function(item, i) {
      return {
        value: item.amount,
        name: item.name,
        itemStyle: { color: getChartColor(i) }
      };
    });

    var option = {
      animation: false,
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        backgroundColor: bg2,
        borderColor: rule,
        borderWidth: 1,
        textStyle: { color: ink, fontSize: 12 },
        formatter: '{b}: ¥{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: muted, fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 8
      },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: bg2,
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 13,
            fontWeight: 600,
            color: ink,
            formatter: '{b}\n{d}%'
          }
        },
        labelLine: { show: false },
        data: pieData.length ? pieData : [{ value: 1, name: '暂无数据', itemStyle: { color: rule } }]
      }]
    };
    charts.categoryPie.setOption(option, true);
  }

  // ============================================
  // Statistics - Compare Chart (Bar)
  // ============================================
  charts.compare = null;
  function initCompareChart() {
    var el = document.getElementById('chart-compare');
    if (!el) return;
    charts.compare = echarts.init(el, null, { renderer: 'svg' });
    updateCompareChart('day');
    window.addEventListener('resize', function() { charts.compare && charts.compare.resize(); });
  }

  function updateCompareChart(period) {
    if (!charts.compare) return;
    var data = window.LedgerData ? window.LedgerData.getTrendData(period) : {
      labels: [], income: [], expense: []
    };

    var option = {
      animation: false,
      tooltip: getTooltip(),
      legend: Object.assign(getLegend(), {
        data: ['收入', '支出']
      }),
      grid: {
        left: 10,
        right: 10,
        top: 40,
        bottom: 10,
        containLabel: true
      },
      xAxis: Object.assign({
        type: 'category',
        data: data.labels,
        axisTick: { show: false }
      }, getAxisStyle()),
      yAxis: Object.assign({
        type: 'value'
      }, getAxisStyle()),
      series: [
        {
          name: '收入',
          type: 'bar',
          data: data.income,
          barWidth: '35%',
          itemStyle: {
            color: success,
            borderRadius: [4, 4, 0, 0]
          }
        },
        {
          name: '支出',
          type: 'bar',
          data: data.expense,
          barWidth: '35%',
          itemStyle: {
            color: danger,
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    };
    charts.compare.setOption(option, true);
  }

  // ============================================
  // Statistics - Expense Pie
  // ============================================
  charts.expensePie = null;
  function initExpensePie() {
    var el = document.getElementById('chart-expense-pie');
    if (!el) return;
    charts.expensePie = echarts.init(el, null, { renderer: 'svg' });
    updateExpensePie();
    window.addEventListener('resize', function() { charts.expensePie && charts.expensePie.resize(); });
  }

  function updateExpensePie() {
    if (!charts.expensePie) return;
    var data = window.LedgerData ? window.LedgerData.getExpenseByCategory() : [];

    var pieData = data.map(function(item, i) {
      return {
        value: item.amount,
        name: item.name,
        itemStyle: { color: getChartColor(i) }
      };
    });

    var option = {
      animation: false,
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        backgroundColor: bg2,
        borderColor: rule,
        borderWidth: 1,
        textStyle: { color: ink, fontSize: 12 },
        formatter: '{b}: ¥{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: muted, fontSize: 12 },
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 10
      },
      series: [{
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: bg2,
          borderWidth: 3
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 600,
            color: ink,
            formatter: '{b}\n¥{c}\n({d}%)'
          }
        },
        labelLine: { show: false },
        data: pieData.length ? pieData : [{ value: 1, name: '暂无数据', itemStyle: { color: rule } }]
      }]
    };
    charts.expensePie.setOption(option, true);
  }

  // ============================================
  // Statistics - Category Bar (Horizontal)
  // ============================================
  charts.categoryBar = null;
  function initCategoryBar() {
    var el = document.getElementById('chart-category-bar');
    if (!el) return;
    charts.categoryBar = echarts.init(el, null, { renderer: 'svg' });
    updateCategoryBar();
    window.addEventListener('resize', function() { charts.categoryBar && charts.categoryBar.resize(); });
  }

  function updateCategoryBar() {
    if (!charts.categoryBar) return;
    var data = window.LedgerData ? window.LedgerData.getExpenseByCategory() : [];

    var categories = data.map(function(d) { return d.name; }).reverse();
    var values = data.map(function(d) { return d.amount; }).reverse();
    var colors = data.map(function(d, i) { return getChartColor(data.length - 1 - i); }).reverse();

    var option = {
      animation: false,
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        backgroundColor: bg2,
        borderColor: rule,
        borderWidth: 1,
        textStyle: { color: ink, fontSize: 12 },
        axisPointer: { type: 'shadow' },
        formatter: function(params) {
          var p = params[0];
          return p.name + ': ¥' + p.value.toFixed(2);
        }
      },
      grid: {
        left: 10,
        right: 20,
        top: 10,
        bottom: 10,
        containLabel: true
      },
      xAxis: Object.assign({
        type: 'value'
      }, getAxisStyle()),
      yAxis: Object.assign({
        type: 'category',
        data: categories,
        axisTick: { show: false }
      }, getAxisStyle()),
      series: [{
        type: 'bar',
        data: values.map(function(v, i) {
          return {
            value: v,
            itemStyle: {
              color: colors[i],
              borderRadius: [0, 4, 4, 0]
            }
          };
        }),
        barWidth: '50%',
        label: {
          show: true,
          position: 'right',
          color: ink,
          fontSize: 12,
          fontWeight: 500,
          formatter: function(p) { return '¥' + p.value.toFixed(0); }
        }
      }]
    };
    charts.categoryBar.setOption(option, true);
  }

  // ============================================
  // Public API
  // ============================================
  window.LedgerCharts = {
    init: function() {
      initTrendChart();
      initCategoryPie();
      initCompareChart();
      initExpensePie();
      initCategoryBar();
    },
    refreshAll: function() {
      updateTrendChart(window.currentTrendPeriod || 'week');
      updateCategoryPie();
      updateCompareChart(window.currentStatPeriod || 'day');
      updateExpensePie();
      updateCategoryBar();
    },
    updateTrend: updateTrendChart,
    updateCompare: updateCompareChart,
    refreshCategory: function() {
      updateCategoryPie();
      updateExpensePie();
      updateCategoryBar();
    },
    resizeStats: function() {
      if (charts.compare) { charts.compare.resize(); }
      if (charts.expensePie) { charts.expensePie.resize(); }
      if (charts.categoryBar) { charts.categoryBar.resize(); }
    }
  };

})();
