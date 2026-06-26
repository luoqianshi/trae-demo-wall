/**
 * 知行合一盈亏记录系统 - 胜率分析模块
 */
var WinRate = (function() {
  'use strict';

  var charts = [];

  function render(container) {
    destroy();
    var stats = Store.getWinRateStats();
    var trades = Store.getAllTrades();

    if (trades.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">🎯</div><h3>暂无胜率数据</h3><p>记录更多交易后即可分析胜率</p><button class="btn btn-primary" onclick="Router.navigate(\'#app/trades/new\')">记录第一笔交易</button></div>';
      return;
    }

    container.innerHTML =
      '<div class="page-header"><h2>胜率分析</h2></div>' +
      '<div class="winrate-metrics" id="winrate-metrics"></div>' +
      '<div class="dashboard-grid">' +
      '<div class="card"><div class="card-header"><h3>盈亏分布</h3></div><div id="chart-distribution" style="height:300px;"></div></div>' +
      '<div class="card"><div class="card-header"><h3>盈亏比仪表盘</h3></div><div id="chart-gauge" style="height:300px;"></div></div>' +
      '</div>' +
      '<div class="card" style="margin-top:1.5rem"><div class="card-header"><h3>胜率走势</h3></div><div id="chart-winrate-trend" style="height:300px;"></div></div>' +
      '<div class="insight-card" id="winrate-insight"></div>';

    // Metrics
    var metricsEl = container.querySelector('#winrate-metrics');
    metricsEl.innerHTML =
      '<div class="metric-item"><div class="metric-value profit">' + stats.winRate.toFixed(1) + '%</div><div class="metric-label">胜率</div></div>' +
      '<div class="metric-item"><div class="metric-value">' + stats.profitFactor.toFixed(2) + '</div><div class="metric-label">盈亏比</div></div>' +
      '<div class="metric-item"><div class="metric-value">' + stats.totalTrades + '</div><div class="metric-label">总交易笔数</div></div>' +
      '<div class="metric-item"><div class="metric-value profit">' + stats.winTrades + '</div><div class="metric-label">盈利笔数</div></div>' +
      '<div class="metric-item"><div class="metric-value loss">' + stats.lossTrades + '</div><div class="metric-label">亏损笔数</div></div>' +
      '<div class="metric-item"><div class="metric-value">' + Utils.formatMoney(stats.avgWinAmount) + '</div><div class="metric-label">平均盈利</div></div>' +
      '<div class="metric-item"><div class="metric-value">' + Utils.formatMoney(stats.avgLossAmount) + '</div><div class="metric-label">平均亏损</div></div>' +
      '<div class="metric-item"><div class="metric-value profit">+' + Utils.formatMoney(stats.maxSingleWin) + '</div><div class="metric-label">最大单笔盈利</div></div>' +
      '<div class="metric-item"><div class="metric-value loss">' + Utils.formatMoney(stats.maxSingleLoss) + '</div><div class="metric-label">最大单笔亏损</div></div>' +
      '<div class="metric-item"><div class="metric-value">' + stats.consecutiveWins + '</div><div class="metric-label">最长连胜</div></div>' +
      '<div class="metric-item"><div class="metric-value">' + stats.consecutiveLosses + '</div><div class="metric-label">最长连亏</div></div>' +
      '<div class="metric-item"><div class="metric-value ' + (stats.expectancy >= 0 ? 'profit' : 'loss') + '">' + Utils.formatMoney(stats.expectancy, true) + '</div><div class="metric-label">期望值</div></div>';

    // Distribution chart
    _renderDistribution(container.querySelector('#chart-distribution'));

    // Gauge chart
    _renderGauge(container.querySelector('#chart-gauge'), stats.profitFactor);

    // Win rate trend
    _renderWinRateTrend(container.querySelector('#chart-winrate-trend'));

    // Insight
    _renderInsight(container.querySelector('#winrate-insight'), stats);
  }

  function _renderDistribution(el) {
    if (!el) return;
    var dist = Store.getPnLDistribution(10);
    var chart = echarts.init(el, null, { renderer: 'svg' });
    charts.push(chart);
    var accent = '#10b981', accent2 = '#ef4444', muted = '#8b9bb4', rule = '#2a3a52', ink = '#f0f2f5', bg3 = '#1a2a42';
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: bg3, borderColor: rule, textStyle: { color: ink } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: dist.map(function(d) { return d.range; }), axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, fontSize: 10, rotate: 30 } },
      yAxis: { type: 'value', axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule, opacity: 0.3 } } },
      series: [{
        type: 'bar',
        data: dist.map(function(d) {
          var mid = (d.low + d.high) / 2;
          return { value: d.count, itemStyle: { color: mid >= 0 ? accent : accent2 } };
        }),
        barMaxWidth: 40
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  function _renderGauge(el, pf) {
    if (!el) return;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    charts.push(chart);
    var accent = '#10b981', gold = '#f59e0b', accent2 = '#ef4444', muted = '#8b9bb4';
    chart.setOption({
      series: [{
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 3,
        splitNumber: 6,
        axisLine: { lineStyle: { width: 15, color: [[0.33, accent2], [0.67, gold], [1, accent]] } },
        pointer: { width: 5, length: '60%' },
        axisTick: { length: 8, lineStyle: { color: 'auto' } },
        splitLine: { length: 15, lineStyle: { color: 'auto' } },
        axisLabel: { color: muted, fontSize: 11, distance: 20 },
        detail: { valueAnimation: true, formatter: '{value}', fontSize: 24, offsetCenter: [0, '70%'], color: accent },
        data: [{ value: Math.min(pf, 3).toFixed(2) }]
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  function _renderWinRateTrend(el) {
    if (!el) return;
    var trades = Store.getAllTrades().sort(function(a, b) { return a.date.localeCompare(b.date); });
    if (trades.length < 2) return;
    // Calculate rolling win rate by groups of 5 trades
    var windowSize = Math.max(5, Math.floor(trades.length / 8));
    var data = [];
    for (var i = windowSize - 1; i < trades.length; i++) {
      var wins = 0;
      for (var j = i - windowSize + 1; j <= i; j++) {
        if (trades[j].pnlAmount > 0) wins++;
      }
      data.push({ date: trades[i].date, rate: (wins / windowSize * 100).toFixed(1) });
    }

    var chart = echarts.init(el, null, { renderer: 'svg' });
    charts.push(chart);
    var gold = '#f59e0b', muted = '#8b9bb4', rule = '#2a3a52', ink = '#f0f2f5', bg3 = '#1a2a42';
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: bg3, borderColor: rule, textStyle: { color: ink }, formatter: function(p) { return p[0].name + '<br/>胜率: ' + p[0].value + '%'; } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: data.map(function(d) { return d.date; }), axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted } },
      yAxis: { type: 'value', min: 0, max: 100, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, formatter: '{value}%' }, splitLine: { lineStyle: { color: rule, opacity: 0.3 } } },
      series: [{
        type: 'line', data: data.map(function(d) { return d.rate; }), smooth: true, symbol: 'circle', symbolSize: 6,
        lineStyle: { color: gold, width: 3 },
        itemStyle: { color: gold },
        markLine: { silent: true, lineStyle: { color: muted, type: 'dashed' }, data: [{ yAxis: 50 }], label: { formatter: '50%基准线', color: muted } }
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  function _renderInsight(el, stats) {
    if (!el) return;
    var insights = [];
    if (stats.winRate > 60) insights.push('你的胜率超过60%，交易策略较为有效，继续坚持。');
    else if (stats.winRate < 40) insights.push('胜率低于40%，建议审视交易策略，减少冲动交易。');
    if (stats.profitFactor > 2) insights.push('盈亏比大于2，说明盈利时赚得多、亏损时亏得少，这是好的交易习惯。');
    else if (stats.profitFactor < 1 && stats.profitFactor > 0) insights.push('盈亏比低于1，意味着平均亏损大于平均盈利，需要改善止损策略。');
    if (stats.consecutiveLosses >= 3) insights.push('最长连亏' + stats.consecutiveLosses + '笔，注意连亏时的情绪管理，避免报复性交易。');
    if (stats.expectancy > 0) insights.push('期望值为正(' + Utils.formatMoney(stats.expectancy, true) + ')，长期来看你的交易是盈利的。');
    else insights.push('期望值为负(' + Utils.formatMoney(stats.expectancy, true) + ')，长期来看需要优化策略才能盈利。');

    el.innerHTML = '<h4>💡 交易洞察</h4><p>' + insights.join('<br>') + '</p>';
  }

  function destroy() {
    charts.forEach(function(c) { try { c.dispose(); } catch(e) {} });
    charts = [];
  }

  return { render: render, destroy: destroy };
})();
