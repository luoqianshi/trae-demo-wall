/**
 * 知行合一盈亏记录系统 - 盈亏统计模块
 */
var Statistics = (function() {
  'use strict';

  var charts = [];

  function render(container) {
    destroy();
    var trades = Store.getAllTrades();
    if (trades.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><h3>暂无统计数据</h3><p>记录交易后即可查看盈亏统计</p><button class="btn btn-primary" onclick="Router.navigate(\'#app/trades/new\')">记录第一笔交易</button></div>';
      return;
    }

    var period = 'month';
    container.innerHTML =
      '<div class="page-header"><h2>盈亏统计</h2>' +
      '<div class="period-switcher">' +
      '<button class="period-btn" data-period="day">日</button>' +
      '<button class="period-btn" data-period="week">周</button>' +
      '<button class="period-btn active" data-period="month">月</button>' +
      '<button class="period-btn" data-period="year">年</button>' +
      '</div></div>' +
      '<div class="stats-grid" id="stats-summary"></div>' +
      '<div class="dashboard-grid">' +
      '<div class="card dashboard-full"><div class="card-header"><h3>盈亏趋势</h3></div><div id="chart-pnl-trend" style="height:350px;"></div></div>' +
      '<div class="card"><div class="card-header"><h3>盈亏分布</h3></div><div id="chart-pnl-dist" style="height:300px;"></div></div>' +
      '<div class="card"><div class="card-header"><h3>累计收益曲线</h3></div><div id="chart-cumulative" style="height:300px;"></div></div>' +
      '</div>' +
      '<div class="card" style="margin-top:1.5rem"><div class="card-header"><h3>最大回撤</h3></div><div id="drawdown-info"></div></div>';

    updateStats(container, period);

    // Period switcher
    container.querySelectorAll('.period-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        container.querySelectorAll('.period-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        period = btn.getAttribute('data-period');
        updateStats(container, period);
      });
    });
  }

  function updateStats(container, period) {
    var trades = Store.getAllTrades();
    var pnlMap = {};
    var sortedTrades = trades.slice().sort(function(a, b) { return a.date.localeCompare(b.date); });

    // Group trades by period
    sortedTrades.forEach(function(t) {
      var key;
      switch (period) {
        case 'day': key = t.date; break;
        case 'week': key = Utils.formatDate(Utils.getWeekStart(t.date)); break;
        case 'month': key = t.date.substring(0, 7); break;
        case 'year': key = t.date.substring(0, 4); break;
      }
      if (!pnlMap[key]) pnlMap[key] = 0;
      pnlMap[key] += t.pnlAmount;
    });

    var keys = Object.keys(pnlMap).sort();
    var values = keys.map(function(k) { return pnlMap[k]; });

    // Summary stats
    var totalPnL = values.reduce(function(s, v) { return s + v; }, 0);
    var profitPeriods = values.filter(function(v) { return v > 0; }).length;
    var lossPeriods = values.filter(function(v) { return v < 0; }).length;
    var bestPeriod = values.length > 0 ? Math.max.apply(null, values) : 0;
    var worstPeriod = values.length > 0 ? Math.min.apply(null, values) : 0;

    var summaryEl = container.querySelector('#stats-summary');
    if (summaryEl) {
      summaryEl.innerHTML =
        '<div class="stat-card"><div class="stat-label">总盈亏</div><div class="stat-value ' + (totalPnL >= 0 ? 'profit' : 'loss') + '">' + Utils.formatMoney(totalPnL, true) + '</div><div class="stat-sub">' + trades.length + '笔交易</div></div>' +
        '<div class="stat-card"><div class="stat-label">盈利' + (period === 'day' ? '天数' : period === 'week' ? '周数' : period === 'month' ? '月数' : '年数') + '</div><div class="stat-value profit">' + profitPeriods + '</div><div class="stat-sub">占比 ' + (values.length > 0 ? Math.round(profitPeriods / values.length * 100) : 0) + '%</div></div>' +
        '<div class="stat-card"><div class="stat-label">最佳' + (period === 'day' ? '日' : period === 'week' ? '周' : period === 'month' ? '月' : '年') + '</div><div class="stat-value profit">+' + Utils.formatMoney(bestPeriod) + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">最差' + (period === 'day' ? '日' : period === 'week' ? '周' : period === 'month' ? '月' : '年') + '</div><div class="stat-value loss">' + Utils.formatMoney(worstPeriod) + '</div></div>';
    }

    // PnL Trend Bar Chart
    _renderPnLTrend(container.querySelector('#chart-pnl-trend'), keys, values, period);

    // PnL Distribution Pie Chart
    var profitCount = trades.filter(function(t) { return t.pnlAmount > 0; }).length;
    var lossCount = trades.filter(function(t) { return t.pnlAmount < 0; }).length;
    var evenCount = trades.filter(function(t) { return t.pnlAmount === 0; }).length;
    _renderPnLDist(container.querySelector('#chart-pnl-dist'), profitCount, lossCount, evenCount);

    // Cumulative Curve
    var curve = Store.getCumulativeCurve();
    _renderCumulative(container.querySelector('#chart-cumulative'), curve);

    // Max Drawdown
    var dd = Store.getMaxDrawdown();
    var ddEl = container.querySelector('#drawdown-info');
    if (ddEl) {
      ddEl.innerHTML =
        '<div class="stats-grid">' +
        '<div class="stat-card"><div class="stat-label">最大回撤金额</div><div class="stat-value loss">' + Utils.formatMoney(dd.maxDrawdown) + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">回撤起始</div><div class="stat-value">' + (dd.startDate || '-') + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">回撤结束</div><div class="stat-value">' + (dd.endDate || '-') + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">峰值</div><div class="stat-value profit">' + Utils.formatMoney(dd.peak) + '</div></div>' +
        '</div>';
    }
  }

  function _renderPnLTrend(el, keys, values, period) {
    if (!el) return;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    charts.push(chart);
    var accent = '#10b981', accent2 = '#ef4444', ink = '#f0f2f5', muted = '#8b9bb4', rule = '#2a3a52';
    var periodLabel = period === 'day' ? '日' : period === 'week' ? '周' : period === 'month' ? '月' : '年';
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#1a2a42', borderColor: rule, textStyle: { color: ink } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: keys, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, fontSize: 11 } },
      yAxis: { type: 'value', axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, formatter: '¥{value}' }, splitLine: { lineStyle: { color: rule, opacity: 0.3 } } },
      series: [{
        type: 'bar',
        data: values.map(function(v) { return { value: v, itemStyle: { color: v >= 0 ? accent : accent2 } }; }),
        barMaxWidth: 40,
        label: { show: true, position: 'top', color: ink, fontSize: 11, formatter: function(p) { return p.value >= 0 ? '+' + p.value : '' + p.value; } }
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  function _renderPnLDist(el, profit, loss, even) {
    if (!el) return;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    charts.push(chart);
    var accent = '#10b981', accent2 = '#ef4444', muted = '#8b9bb4', rule = '#2a3a52', bg3 = '#1a2a42', ink = '#f0f2f5';
    chart.setOption({
      tooltip: { trigger: 'item', backgroundColor: bg3, borderColor: rule, textStyle: { color: ink }, formatter: '{b}: {c}笔 ({d}%)' },
      legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { color: muted } },
      series: [{
        type: 'pie', radius: ['40%', '70%'], center: ['40%', '50%'],
        itemStyle: { borderRadius: 8, borderColor: bg3, borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold', color: ink } },
        data: [
          { value: profit, name: '盈利交易', itemStyle: { color: accent } },
          { value: loss, name: '亏损交易', itemStyle: { color: accent2 } },
          { value: even, name: '持平交易', itemStyle: { color: muted } }
        ]
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  function _renderCumulative(el, curve) {
    if (!el) return;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    charts.push(chart);
    var accent = '#10b981', muted = '#8b9bb4', rule = '#2a3a52', ink = '#f0f2f5';
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#1a2a42', borderColor: rule, textStyle: { color: ink } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: curve.map(function(d) { return d.date; }), axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, fontSize: 11 } },
      yAxis: { type: 'value', axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, formatter: '¥{value}' }, splitLine: { lineStyle: { color: rule, opacity: 0.3 } } },
      series: [{
        type: 'line', data: curve.map(function(d) { return d.value; }), smooth: true, symbol: 'none',
        lineStyle: { color: accent, width: 3 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: accent + '40' }, { offset: 1, color: accent + '05' }] } }
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  function destroy() {
    charts.forEach(function(c) { try { c.dispose(); } catch(e) {} });
    charts = [];
  }

  return { render: render, destroy: destroy };
})();
