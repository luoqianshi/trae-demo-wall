/**
 * 知行合一盈亏记录系统 - 仪表盘模块
 */
var Dashboard = (function() {
  'use strict';

  var charts = [];

  function render(container) {
    destroy();
    var summary = Store.getSummary();
    var trades = Store.getAllTrades();

    if (trades.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-icon">📊</div>' +
        '<h3>欢迎使用知行合一</h3>' +
        '<p>开始记录你的股票交易盈亏，让每一笔交易都有迹可循</p>' +
        '<div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">' +
        '<button class="btn btn-primary" onclick="Router.navigate(\'#app/trades/new\')">记录第一笔交易</button>' +
        '<button class="btn btn-outline" onclick="Store.importSampleData();Dashboard.render(document.getElementById(\'app-main\'));App.showToast(\'示例数据已导入\',\'success\')">导入示例数据</button>' +
        '</div></div>';
      return;
    }

    var today = Utils.formatDate(new Date());
    container.innerHTML =
      '<div class="page-header"><h2>今日概览</h2><span class="text-muted" style="font-size:0.9rem">' + today + '</span></div>' +

      '<div class="stats-grid">' +
      '<div class="stat-card"><div class="stat-label">今日盈亏</div><div class="stat-value ' + (summary.todayPnL >= 0 ? 'profit' : 'loss') + '">' + Utils.formatMoney(summary.todayPnL, true) + '</div><div class="stat-sub">今日交易笔数</div></div>' +
      '<div class="stat-card"><div class="stat-label">本月盈亏</div><div class="stat-value ' + (summary.monthPnL >= 0 ? 'profit' : 'loss') + '">' + Utils.formatMoney(summary.monthPnL, true) + '</div><div class="stat-sub">本月交易笔数</div></div>' +
      '<div class="stat-card"><div class="stat-label">累计盈亏</div><div class="stat-value ' + (summary.totalPnL >= 0 ? 'profit' : 'loss') + '">' + Utils.formatMoney(summary.totalPnL, true) + '</div><div class="stat-sub">' + summary.totalTrades + '笔交易</div></div>' +
      '<div class="stat-card"><div class="stat-label">胜率</div><div class="stat-value">' + summary.winRate.toFixed(1) + '%</div><div class="stat-sub">' + summary.winTrades + '胜 / ' + summary.lossTrades + '负</div></div>' +
      '</div>' +

      '<div class="dashboard-grid">' +
      '<div class="card dashboard-full"><div class="card-header"><h3>累计收益曲线</h3></div><div id="dash-chart-cumulative" style="height:350px;"></div></div>' +
      '<div class="card"><div class="card-header"><h3>最近交易</h3></div><div id="dash-recent-trades"></div></div>' +
      '<div class="card"><div class="card-header"><h3>情绪分布</h3></div><div id="dash-chart-emotion" style="height:280px;"></div></div>' +
      '</div>' +

      '<div class="card" style="margin-top:1.5rem"><div class="card-header"><h3>风控状态</h3></div><div id="dash-risk-status"></div></div>';

    // Cumulative chart
    var curve = Store.getCumulativeCurve();
    if (curve.length > 0) {
      _renderCumulativeChart(container.querySelector('#dash-chart-cumulative'), curve);
    }

    // Recent trades
    _renderRecentTrades(container.querySelector('#dash-recent-trades'));

    // Emotion distribution
    var correlation = Store.getEmotionCorrelation();
    _renderEmotionDist(container.querySelector('#dash-chart-emotion'), correlation);

    // Risk status
    _renderRiskStatus(container.querySelector('#dash-risk-status'));
  }

  function _renderCumulativeChart(el, curve) {
    if (!el) return;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    charts.push(chart);
    var accent = '#10b981', muted = '#8b9bb4', rule = '#2a3a52', ink = '#f0f2f5';
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#1a2a42', borderColor: rule, textStyle: { color: ink }, formatter: function(p) { return p[0].name + '<br/>累计: ' + Utils.formatMoney(p[0].value, true); } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: curve.map(function(d) { return d.date; }), axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, fontSize: 11 } },
      yAxis: { type: 'value', axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, formatter: function(v) { return '¥' + v; } }, splitLine: { lineStyle: { color: rule, opacity: 0.3 } } },
      series: [{
        type: 'line', data: curve.map(function(d) { return d.value; }), smooth: true, symbol: 'none',
        lineStyle: { color: accent, width: 3 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: accent + '40' }, { offset: 1, color: accent + '05' }]
          }
        }
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  function _renderRecentTrades(el) {
    if (!el) return;
    var result = Store.getTrades({ sort: 'date', order: 'desc', page: 1, pageSize: 5 });
    if (result.items.length === 0) {
      el.innerHTML = '<p class="text-muted" style="text-align:center;padding:1rem">暂无交易记录</p>';
      return;
    }
    var html = '<ul class="recent-trades">';
    result.items.forEach(function(t) {
      var emInfo = Utils.getEmotionInfo(t.emotion);
      html += '<li class="recent-trade-item">' +
        '<div class="recent-trade-info">' +
        '<span class="recent-trade-code">' + t.stockCode + '</span>' +
        '<span class="recent-trade-name">' + (t.stockName || '') + '</span>' +
        '<span style="font-size:0.8rem">' + emInfo.icon + '</span>' +
        '</div>' +
        '<span class="recent-trade-pnl ' + (t.pnlAmount >= 0 ? 'profit' : 'loss') + '">' + Utils.formatMoney(t.pnlAmount, true) + '</span>' +
        '</li>';
    });
    html += '</ul>';
    el.innerHTML = html;
  }

  function _renderEmotionDist(el, correlation) {
    if (!el) return;
    var data = [];
    Utils.EMOTIONS.forEach(function(em) {
      var d = correlation[em.key];
      if (d && d.count > 0) {
        data.push({ value: d.count, name: em.icon + ' ' + em.label, itemStyle: { color: em.color } });
      }
    });
    if (data.length === 0) {
      el.innerHTML = '<p class="text-muted" style="text-align:center;padding:2rem">暂无数据</p>';
      return;
    }
    var chart = echarts.init(el, null, { renderer: 'svg' });
    charts.push(chart);
    var muted = '#8b9bb4', rule = '#2a3a52', ink = '#f0f2f5', bg3 = '#1a2a42';
    chart.setOption({
      tooltip: { trigger: 'item', backgroundColor: bg3, borderColor: rule, textStyle: { color: ink }, formatter: '{b}: {c}笔 ({d}%)' },
      series: [{
        type: 'pie', radius: ['35%', '65%'],
        itemStyle: { borderRadius: 5, borderColor: bg3, borderWidth: 2 },
        label: { show: true, color: muted, fontSize: 10 },
        data: data
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  function _renderRiskStatus(el) {
    if (!el) return;
    var status = Store.getRiskStatus();
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem">';
    ['daily', 'weekly', 'monthly'].forEach(function(type) {
      var s = status[type];
      if (!s) return;
      var label = type === 'daily' ? '日' : type === 'weekly' ? '周' : '月';
      var pct = Math.round(s.ratio * 100);
      var level = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'safe';
      html += '<div style="background:var(--bg);border:1px solid var(--rule);border-radius:8px;padding:1rem">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">' +
        '<span style="font-size:0.85rem;color:var(--ink)">' + label + '亏损</span>' +
        '<span style="font-family:var(--font-mono);font-size:0.85rem" class="' + (s.current < 0 ? 'loss' : 'profit') + '">' + Utils.formatMoney(s.current, true) + '</span>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;font-size:0.8rem;color:var(--muted)">' +
        '<span>上限 ' + Utils.formatMoney(s.limit) + '</span><span>' + pct + '%</span></div>' +
        '<div style="height:6px;background:var(--bg4);border-radius:3px;overflow:hidden">' +
        '<div style="height:100%;width:' + Math.min(pct, 100) + '%;background:' + (level === 'safe' ? 'var(--accent)' : level === 'warning' ? 'var(--gold)' : 'var(--accent2)') + ';border-radius:3px;transition:width 0.5s"></div>' +
        '</div></div>';
    });
    html += '</div>';
    if (!status.daily && !status.weekly && !status.monthly) {
      html = '<p class="text-muted" style="text-align:center;padding:1rem">未设置风控上限，<a href="#app/risk" style="color:var(--accent)">前往设置</a></p>';
    }
    el.innerHTML = html;
  }

  function destroy() {
    charts.forEach(function(c) { try { c.dispose(); } catch(e) {} });
    charts = [];
  }

  return { render: render, destroy: destroy };
})();
