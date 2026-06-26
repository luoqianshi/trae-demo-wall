/**
 * 知行合一盈亏记录系统 - 情绪追踪模块
 */
var EmotionTracker = (function() {
  'use strict';

  var charts = [];

  function render(container) {
    destroy();
    var trades = Store.getAllTrades();
    var correlation = Store.getEmotionCorrelation();

    if (trades.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">💡</div><h3>暂无情绪数据</h3><p>记录交易时选择情绪标签后即可分析</p><button class="btn btn-primary" onclick="Router.navigate(\'#app/trades/new\')">记录第一笔交易</button></div>';
      return;
    }

    container.innerHTML =
      '<div class="page-header"><h2>情绪追踪</h2></div>' +
      '<div class="emotion-grid" id="emotion-cards"></div>' +
      '<div class="dashboard-grid" style="margin-top:1.5rem">' +
      '<div class="card"><div class="card-header"><h3>情绪-盈亏雷达图</h3></div><div id="chart-radar" style="height:350px;"></div></div>' +
      '<div class="card"><div class="card-header"><h3>情绪分布</h3></div><div id="chart-emotion-dist" style="height:350px;"></div></div>' +
      '</div>' +
      '<div class="insight-card" id="emotion-insight"></div>';

    // Emotion cards
    var cardsEl = container.querySelector('#emotion-cards');
    var cardsHtml = '';
    Utils.EMOTIONS.forEach(function(em) {
      var data = correlation[em.key];
      if (!data || data.count === 0) return;
      cardsHtml +=
        '<div class="emotion-card" style="border-color:' + em.color + '30">' +
        '<div class="emotion-icon">' + em.icon + '</div>' +
        '<div class="emotion-label">' + em.label + '</div>' +
        '<div class="emotion-stats">' +
        '<span>交易次数: ' + data.count + '笔</span>' +
        '<span>平均盈亏: <span class="' + (data.avgPnL >= 0 ? 'profit' : 'loss') + '">' + Utils.formatMoney(data.avgPnL, true) + '</span></span>' +
        '<span>胜率: ' + data.winRate.toFixed(0) + '%</span>' +
        '<span>总盈亏: <span class="' + (data.totalPnL >= 0 ? 'profit' : 'loss') + '">' + Utils.formatMoney(data.totalPnL, true) + '</span></span>' +
        '</div></div>';
    });
    if (!cardsHtml) {
      cardsHtml = '<div class="empty-state" style="padding:2rem"><p>还没有情绪记录数据</p></div>';
    }
    cardsEl.innerHTML = cardsHtml;

    // Radar chart
    _renderRadar(container.querySelector('#chart-radar'), correlation);

    // Emotion distribution pie
    _renderDistPie(container.querySelector('#chart-emotion-dist'), correlation);

    // Insight
    _renderInsight(container.querySelector('#emotion-insight'), correlation);
  }

  function _renderRadar(el, correlation) {
    if (!el) return;
    // Build radar data: only include emotions that have data
    var indicators = [];
    var values = [];
    Utils.EMOTIONS.forEach(function(em) {
      var data = correlation[em.key];
      if (!data || data.count === 0) return;
      indicators.push({ name: em.label, max: 100 });
      values.push(data.winRate);
    });
    if (indicators.length < 3) return;

    var chart = echarts.init(el, null, { renderer: 'svg' });
    charts.push(chart);
    var accent = '#10b981', muted = '#8b9bb4', rule = '#2a3a52', ink = '#f0f2f5', bg3 = '#1a2a42';
    chart.setOption({
      tooltip: { backgroundColor: bg3, borderColor: rule, textStyle: { color: ink } },
      radar: {
        indicator: indicators,
        axisName: { color: muted, fontSize: 12 },
        splitArea: { areaStyle: { color: ['rgba(16,185,129,0.05)', 'rgba(16,185,129,0.1)'] } },
        axisLine: { lineStyle: { color: rule } },
        splitLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'radar',
        data: [{
          value: values,
          name: '胜率(%)',
          areaStyle: { color: accent + '30' },
          lineStyle: { color: accent, width: 2 },
          itemStyle: { color: accent }
        }]
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  function _renderDistPie(el, correlation) {
    if (!el) return;
    var data = [];
    Utils.EMOTIONS.forEach(function(em) {
      var d = correlation[em.key];
      if (d && d.count > 0) {
        data.push({ value: d.count, name: em.label + ' ' + em.icon, itemStyle: { color: em.color } });
      }
    });
    if (data.length === 0) return;

    var chart = echarts.init(el, null, { renderer: 'svg' });
    charts.push(chart);
    var muted = '#8b9bb4', rule = '#2a3a52', ink = '#f0f2f5', bg3 = '#1a2a42';
    chart.setOption({
      tooltip: { trigger: 'item', backgroundColor: bg3, borderColor: rule, textStyle: { color: ink }, formatter: '{b}: {c}笔 ({d}%)' },
      legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { color: muted } },
      series: [{
        type: 'pie', radius: ['40%', '70%'], center: ['40%', '50%'],
        itemStyle: { borderRadius: 6, borderColor: bg3, borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold', color: ink } },
        data: data
      }]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }

  function _renderInsight(el, correlation) {
    if (!el) return;
    var insights = [];
    var bestEmotion = null, worstEmotion = null;
    var bestRate = -1, worstRate = 101;

    Utils.EMOTIONS.forEach(function(em) {
      var data = correlation[em.key];
      if (!data || data.count < 1) return;
      if (data.winRate > bestRate) { bestRate = data.winRate; bestEmotion = em; }
      if (data.winRate < worstRate) { worstRate = data.winRate; worstEmotion = em; }
    });

    if (bestEmotion) {
      insights.push('你在「' + bestEmotion.label + '」状态下交易胜率最高(' + bestRate.toFixed(0) + '%)');
    }
    if (worstEmotion && worstEmotion !== bestEmotion) {
      insights.push('而在「' + worstEmotion.label + '」状态下胜率仅' + worstRate.toFixed(0) + '%，建议在该情绪下谨慎交易或暂停操作');
    }

    // Check if negative emotions correlate with losses
    var negEmotions = ['fear', 'fomo', 'impulsive', 'greedy'];
    var negPnL = 0, negCount = 0;
    negEmotions.forEach(function(key) {
      if (correlation[key]) { negPnL += correlation[key].totalPnL; negCount += correlation[key].count; }
    });
    if (negCount > 0 && negPnL < 0) {
      insights.push('恐惧、FOMO、冲动和贪婪等负面情绪下共' + negCount + '笔交易，累计亏损' + Utils.formatMoney(Math.abs(negPnL)) + '，说明情绪管理对交易结果影响重大');
    }

    if (insights.length === 0) {
      insights.push('数据积累不足，继续记录交易情绪后将获得更精准的洞察');
    }

    el.innerHTML = '<h4>💡 情绪洞察</h4><p>' + insights.join('<br>') + '</p>';
  }

  function destroy() {
    charts.forEach(function(c) { try { c.dispose(); } catch(e) {} });
    charts = [];
  }

  return { render: render, destroy: destroy };
})();
