(function() {
  'use strict';

  // ========== Clock ==========
  function updateClock() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');
    var el = document.getElementById('clock');
    if (el) el.textContent = h + ':' + m + ':' + s;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // ========== Navigation ==========
  var navItems = document.querySelectorAll('.nav-item');
  var modules = document.querySelectorAll('.module');
  var pageTitle = document.getElementById('page-title');
  var titles = {
    overview: '行情分析',
    watchlist: '自选股查询',
    single: '单股回测',
    sector: '板块分析',
    hot: '热点追踪',
    backtest: '策略回测',
    portfolio: '组合管理',
    sentiment: '市场情绪',
    event: '事件驱动',
    risk: '风险管理',
    datacenter: '数据中心',
    factor: '因子库',
    ai: 'AI 投研助理',
    knowledge: '知识库',
    settings: '系统设置'
  };

  navItems.forEach(function(item) {
    item.addEventListener('click', function() {
      var mod = item.dataset.module;
      navItems.forEach(function(n) { n.classList.remove('active'); });
      item.classList.add('active');
      modules.forEach(function(m) { m.classList.remove('active'); });
      var target = document.getElementById('mod-' + mod);
      if (target) target.classList.add('active');
      if (pageTitle) pageTitle.textContent = titles[mod] || 'Quant Monitor';
      setTimeout(function() {
        if (window.echarts) {
          ['chart-market','chart-sector','chart-backtest','chart-storage','chart-factor-icir','chart-kline','chart-portfolio','chart-updown','chart-sentiment-history'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) { var c = echarts.getInstanceByDom(el); if (c) c.resize(); }
          });
        }
      }, 50);
    });
  });

  // ========== Toast ==========
  function showToast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 3000);
  }

  // ========== Sparkline SVG helper ==========
  function drawSparkline(container, data, color) {
    if (!container) return;
    var w = container.clientWidth || 120;
    var h = container.clientHeight || 36;
    var min = Math.min.apply(null, data);
    var max = Math.max.apply(null, data);
    var range = max - min || 1;
    var points = data.map(function(v, i) {
      var x = (i / (data.length - 1)) * w;
      var y = h - ((v - min) / range) * (h - 4) - 2;
      return x + ',' + y;
    }).join(' ');
    var svg = '<svg width="' + w + '" height="' + h + '" style="overflow:visible">' +
      '<polyline points="' + points + '" fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="' + w + '" cy="' + (h - ((data[data.length-1] - min) / range) * (h - 4) - 2) + '" r="2.5" fill="' + color + '"/>' +
      '</svg>';
    container.innerHTML = svg;
  }

  // ========== 1. 行情分析 ==========
  var metrics = [
    { label: '上证指数', value: '4082.07', change: '-51.95', pct: '-1.26%', up: false,
      extra: '成交额 8468亿 | 换手率 1.05%',
      spark: [4120,4115,4118,4105,4102,4098,4095,4100,4092,4088,4085,4090,4082,4078,4085,4080,4075,4082,4078,4082] },
    { label: '深证成指', value: '12856.72', change: '-182.81', pct: '-1.28%', up: false,
      extra: '成交额 1.12万亿 | 振幅 1.35%',
      spark: [12980,12960,12970,12940,12930,12910,12900,12920,12890,12880,12875,12890,12870,12860,12880,12870,12855,12870,12860,12856] },
    { label: '创业板指', value: '2489.56', change: '-35.62', pct: '-1.41%', up: false,
      extra: '成交额 3125亿 | 市盈率 28.6x',
      spark: [2510,2505,2512,2500,2495,2490,2488,2495,2485,2480,2478,2490,2480,2475,2485,2480,2472,2480,2475,2489] },
    { label: '市场情绪', value: '谨慎', change: '', pct: '偏空', up: false,
      extra: 'VIX等价 28.3 | 北向净流出 45亿',
      spark: [55,58,60,57,62,65,63,68,70,72,68,65,62,58,55,52,48,45,42,38] }
  ];

  var omContainer = document.getElementById('overview-metrics');
  if (omContainer) {
    metrics.forEach(function(m, idx) {
      var colorClass = m.up ? 'text-up' : 'text-down';
      var sparkColor = m.up ? 'var(--red-500)' : 'var(--green-500)';
      var html = '<div class="metric-card">' +
        '<div class="mc-top">' +
          '<div>' +
            '<div class="mc-label">' + m.label + '</div>' +
            '<div class="mc-value" style="color:' + (m.up ? 'var(--red-500)' : 'var(--gray-800)') + '">' + m.value + '</div>' +
            '<div class="mc-change ' + colorClass + '">' + (m.change ? m.change + ' ' : '') + m.pct + '</div>' +
            '<div class="mc-extra">' + m.extra + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="mc-spark" id="spark-metric-' + idx + '"></div>' +
      '</div>';
      omContainer.insertAdjacentHTML('beforeend', html);
    });
    setTimeout(function() {
      metrics.forEach(function(m, idx) {
        var el = document.getElementById('spark-metric-' + idx);
        if (el) drawSparkline(el, m.spark, m.up ? 'var(--red-500)' : 'var(--green-500)');
      });
    }, 100);
  }

  // ========== 2. 自选股查询 ==========
  var watchlist = [
    { name: '贵州茅台', code: '600519', price: 1688.00, change: -1.52, pct: '-0.09%', vol: '12.5万手', cap: '2.12万亿' },
    { name: '宁德时代', code: '300750', price: 198.50, change: -2.68, pct: '-1.33%', vol: '45.2万手', cap: '8725亿' },
    { name: '中国平安', code: '601318', price: 45.20, change: 0.55, pct: '+1.24%', vol: '89.6万手', cap: '8256亿' },
    { name: '招商银行', code: '600036', price: 35.80, change: 0.46, pct: '+1.31%', vol: '67.3万手', cap: '9032亿' },
    { name: '紫金矿业', code: '601899', price: 12.85, change: 0.21, pct: '+1.66%', vol: '156.8万手', cap: '3385亿' }
  ];

  function renderWatchlist() {
    var tbody = document.querySelector('#watchlist-table tbody');
    if (!tbody) return;
    tbody.innerHTML = watchlist.map(function(s) {
      var color = s.change >= 0 ? 'text-up' : 'text-down';
      return '<tr><td><strong>' + s.name + '</strong></td><td>' + s.code + '</td><td>' + s.price.toFixed(2) + '</td>' +
        '<td class="' + color + '">' + (s.change >= 0 ? '+' : '') + s.change.toFixed(2) + '</td>' +
        '<td class="' + color + '">' + s.pct + '</td><td>' + s.vol + '</td><td>' + s.cap + '</td>' +
        '<td><button class="btn btn-sm btn-secondary" onclick="removeStock(\'' + s.code + '\')">删除</button></td></tr>';
    }).join('');
  }
  renderWatchlist();

  window.removeStock = function(code) {
    watchlist = watchlist.filter(function(s) { return s.code !== code; });
    renderWatchlist();
    showToast('已删除自选股');
  };

  var btnAddStock = document.getElementById('btn-add-stock');
  if (btnAddStock) {
    btnAddStock.addEventListener('click', function() {
      var input = document.getElementById('stock-search-input');
      var name = input.value.trim();
      if (!name) { showToast('请输入股票代码或名称'); return; }
      watchlist.push({ name: name, code: '000001', price: 10.00, change: 0.00, pct: '0.00%', vol: '0万手', cap: '0亿' });
      renderWatchlist();
      input.value = '';
      showToast('已添加自选股: ' + name);
    });
  }

  var btnRefreshWatchlist = document.getElementById('btn-refresh-watchlist');
  if (btnRefreshWatchlist) {
    btnRefreshWatchlist.addEventListener('click', function() {
      showToast('行情已刷新');
    });
  }

  // 热门股票
  var hotStocks = [
    { name: '北方华创', code: '002371', price: 285.60, pct: '+5.23%' },
    { name: '中芯国际', code: '688981', price: 58.20, pct: '+4.18%' },
    { name: '山东黄金', code: '600547', price: 28.50, pct: '+3.85%' },
    { name: '中国中免', code: '601888', price: 72.30, pct: '+3.12%' }
  ];
  var hotStocksEl = document.getElementById('hot-stocks');
  if (hotStocksEl) {
    hotStocksEl.innerHTML = hotStocks.map(function(s) {
      return '<div class="card" style="text-align:center;cursor:pointer" onclick="showToast(\'' + s.name + ' ' + s.pct + '\')">' +
        '<div style="font-size:14px;font-weight:600">' + s.name + '</div>' +
        '<div style="font-size:12px;color:var(--gray-400)">' + s.code + '</div>' +
        '<div style="font-size:18px;font-weight:700;color:var(--red-500);margin-top:6px">' + s.pct + '</div></div>';
    }).join('');
  }

  // ========== 3. 单股回测 ==========
  var btnSingleSearch = document.getElementById('btn-single-search');
  if (btnSingleSearch) {
    btnSingleSearch.addEventListener('click', function() {
      var input = document.getElementById('single-stock-input');
      var code = input.value.trim();
      if (!code) { showToast('请输入股票代码'); return; }
      var detail = document.getElementById('single-detail');
      detail.innerHTML = '<h3>' + code + ' <span style="font-size:14px;color:var(--gray-400);font-weight:400">模拟数据</span></h3>' +
        '<div class="grid-4" style="margin-top:12px">' +
        '<div><div style="font-size:11px;color:var(--gray-400)">现价</div><div style="font-size:18px;font-weight:700">45.20</div></div>' +
        '<div><div style="font-size:11px;color:var(--gray-400)">涨跌</div><div style="font-size:18px;font-weight:700;color:var(--red-500)">+1.24%</div></div>' +
        '<div><div style="font-size:11px;color:var(--gray-400)">市值</div><div style="font-size:18px;font-weight:700">8256亿</div></div>' +
        '<div><div style="font-size:11px;color:var(--gray-400)">市盈率</div><div style="font-size:18px;font-weight:700">8.5x</div></div></div>';
      showToast('已加载 ' + code + ' 数据');
    });
  }

  var btnSingleBacktest = document.getElementById('btn-single-backtest');
  if (btnSingleBacktest) {
    btnSingleBacktest.addEventListener('click', function() {
      showToast('单股回测运行中...');
      setTimeout(function() { showToast('回测完成：总收益 +12.35%'); }, 1500);
    });
  }

  // ========== 4. 板块分析 ==========
  var heatmapData = [
    { name: '半导体', pct: 2.35 }, { name: '黄金', pct: 2.65 }, { name: '银行', pct: 0.85 },
    { name: '医药', pct: -0.42 }, { name: '新能源', pct: -1.85 }, { name: '白酒', pct: -2.12 },
    { name: '房地产', pct: -1.56 }, { name: '证券', pct: -0.78 }, { name: '军工', pct: -0.95 },
    { name: '传媒', pct: -1.23 }, { name: '计算机', pct: -1.67 }, { name: '电子', pct: 1.25 },
    { name: '化工', pct: -0.35 }, { name: '钢铁', pct: 0.12 }, { name: '煤炭', pct: 0.56 },
    { name: '石油', pct: 1.85 }, { name: '电力', pct: 0.32 }, { name: '农业', pct: -0.68 }
  ];

  var heatmapGrid = document.getElementById('heatmap-grid');
  if (heatmapGrid) {
    heatmapData.forEach(function(h) {
      var color, textColor;
      if (h.pct >= 2) { color = '#DC2626'; textColor = '#fff'; }
      else if (h.pct >= 1) { color = '#EF4444'; textColor = '#fff'; }
      else if (h.pct > 0) { color = '#FCA5A5'; textColor = '#7F1D1D'; }
      else if (h.pct === 0) { color = '#E5E7EB'; textColor = '#374151'; }
      else if (h.pct > -1) { color = '#86EFAC'; textColor = '#14532D'; }
      else if (h.pct > -2) { color = '#22C55E'; textColor = '#fff'; }
      else { color = '#16A34A'; textColor = '#fff'; }
      var html = '<div class="heatmap-cell" style="background:' + color + ';color:' + textColor + '">' +
        '<div class="heatmap-name">' + h.name + '</div>' +
        '<div class="heatmap-pct">' + (h.pct >= 0 ? '+' : '') + h.pct.toFixed(2) + '%</div>' +
      '</div>';
      heatmapGrid.insertAdjacentHTML('beforeend', html);
    });
  }

  // 板块涨跌榜
  var sectorGainers = [
    { name: '半导体', pct: '+2.35%', leader: '北方华创' },
    { name: '黄金', pct: '+2.65%', leader: '山东黄金' },
    { name: '电子', pct: '+1.25%', leader: '立讯精密' },
    { name: '石油', pct: '+1.85%', leader: '中国石油' },
    { name: '银行', pct: '+0.85%', leader: '招商银行' }
  ];
  var sectorLosers = [
    { name: '白酒', pct: '-2.12%', leader: '贵州茅台' },
    { name: '新能源', pct: '-1.85%', leader: '宁德时代' },
    { name: '计算机', pct: '-1.67%', leader: '金山办公' },
    { name: '房地产', pct: '-1.56%', leader: '万科A' },
    { name: '传媒', pct: '-1.23%', leader: '分众传媒' }
  ];

  function renderSectorRank(id, data, up) {
    var tbody = document.querySelector('#' + id + ' tbody');
    if (!tbody) return;
    tbody.innerHTML = data.map(function(s) {
      return '<tr><td><strong>' + s.name + '</strong></td>' +
        '<td class="' + (up ? 'text-up' : 'text-down') + '">' + s.pct + '</td>' +
        '<td>' + s.leader + '</td></tr>';
    }).join('');
  }
  renderSectorRank('top-gainers', sectorGainers, true);
  renderSectorRank('top-losers', sectorLosers, false);

  // ========== 5. 热点追踪 ==========
  var hotConcepts = [
    { rank: 1, name: '半导体', heat: 98, pct: '+2.35%', leader: '北方华创' },
    { rank: 2, name: '黄金', heat: 95, pct: '+2.65%', leader: '山东黄金' },
    { rank: 3, name: 'AI算力', heat: 92, pct: '+1.85%', leader: '中际旭创' },
    { rank: 4, name: '消费电子', heat: 88, pct: '+1.25%', leader: '立讯精密' },
    { rank: 5, name: '石油石化', heat: 85, pct: '+1.85%', leader: '中国石油' },
    { rank: 6, name: '创新药', heat: 78, pct: '-0.42%', leader: '恒瑞医药' },
    { rank: 7, name: '光伏', heat: 72, pct: '-1.85%', leader: '隆基绿能' },
    { rank: 8, name: '白酒', heat: 65, pct: '-2.12%', leader: '贵州茅台' }
  ];

  var hotConceptsBody = document.querySelector('#hot-concepts tbody');
  if (hotConceptsBody) {
    hotConceptsBody.innerHTML = hotConcepts.map(function(c) {
      var color = c.pct.startsWith('+') ? 'text-up' : 'text-down';
      return '<tr><td>' + c.rank + '</td><td><strong>' + c.name + '</strong></td>' +
        '<td><div style="width:80px;height:6px;background:var(--gray-100);border-radius:3px;display:inline-block;vertical-align:middle;margin-right:6px"><div style="width:' + c.heat + '%;height:100%;background:var(--blue-500);border-radius:3px"></div></div>' + c.heat + '</td>' +
        '<td class="' + color + '">' + c.pct + '</td><td>' + c.leader + '</td></tr>';
    }).join('');
  }

  // ========== 6. 策略回测 ==========
  var strategies = [
    { name: '双均线策略', type: '趋势跟踪', status: '运行中', statusClass: 'tag-green', return: '未回测', sharpe: '-', maxDD: '-', winRate: '-', allocation: 100 },
    { name: '动量突破', type: '动量策略', status: '运行中', statusClass: 'tag-green', return: '未回测', sharpe: '-', maxDD: '-', winRate: '-', allocation: 80 },
    { name: 'RSI超买超卖', type: '均值回归', status: '已暂停', statusClass: 'tag-yellow', return: '未回测', sharpe: '-', maxDD: '-', winRate: '-', allocation: 60 }
  ];

  function renderStrategyList() {
    var tbody = document.querySelector('#strategy-list-table tbody');
    if (!tbody) return;
    tbody.innerHTML = strategies.map(function(s, i) {
      return '<tr><td><strong>' + s.name + '</strong></td><td>' + s.type + '</td><td><span class="tag ' + s.statusClass + '">' + s.status + '</span></td>' +
        '<td>' + s.return + '</td><td>' + s.sharpe + '</td><td>' + s.maxDD + '</td><td>' + s.winRate + '</td>' +
        '<td><button class="btn btn-sm btn-secondary">编辑</button> <button class="btn btn-sm btn-secondary" onclick="runBacktest(' + i + ')">回测</button></td></tr>';
    }).join('');
  }
  renderStrategyList();

  window.runBacktest = function(idx) {
    var s = strategies[idx];
    s.return = ['+8.42%', '+12.18%', '+6.75%'][idx];
    s.sharpe = ['1.35', '1.68', '1.02'][idx];
    s.maxDD = ['-5.21%', '-3.87%', '-7.34%'][idx];
    s.winRate = ['58.3%', '62.7%', '54.1%'][idx];
    renderStrategyList();
    showToast('策略 "' + s.name + '" 回测完成');
    var chart = echarts.getInstanceByDom(document.getElementById('chart-backtest'));
    if (chart) {
      var newData = [];
      for (var i = 0; i < 90; i++) { newData.push((Math.random() - 0.45) * 15); }
      chart.setOption({ series: [{ data: newData }] });
    }
  };

  var btnNewStrategy = document.getElementById('btn-new-strategy');
  if (btnNewStrategy) {
    btnNewStrategy.addEventListener('click', function() {
      document.getElementById('modal-new-strat').classList.add('show');
    });
  }

  var btnRunAll = document.getElementById('btn-run-all');
  if (btnRunAll) {
    btnRunAll.addEventListener('click', function() {
      strategies.forEach(function(s, i) {
        setTimeout(function() {
          s.return = ['+8.42%', '+12.18%', '+6.75%'][i];
          s.sharpe = ['1.35', '1.68', '1.02'][i];
          s.maxDD = ['-5.21%', '-3.87%', '-7.34%'][i];
          s.winRate = ['58.3%', '62.7%', '54.1%'][i];
          renderStrategyList();
        }, i * 300);
      });
      showToast('全部策略回测完成');
    });
  }

  window.saveNewStrat = function() {
    document.getElementById('modal-new-strat').classList.remove('show');
    showToast('策略创建成功');
  };
  window.closeNewStratModal = function() {
    document.getElementById('modal-new-strat').classList.remove('show');
  };

  // 策略仓位配置
  var allocEl = document.getElementById('strategy-allocation');
  if (allocEl) {
    strategies.forEach(function(s) {
      allocEl.insertAdjacentHTML('beforeend',
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' +
        '<div style="width:100px;font-size:12px">' + s.name + '</div>' +
        '<div style="flex:1;height:8px;background:var(--gray-100);border-radius:4px;overflow:hidden">' +
        '<div style="width:' + s.allocation + '%;height:100%;background:var(--blue-500);border-radius:4px"></div></div>' +
        '<div style="width:40px;font-size:12px;text-align:right">' + s.allocation + '%</div></div>');
    });
  }

  // ========== 7. 组合管理 ==========
  var holdings = [
    { name: '贵州茅台', code: '600519', weight: '18%', cost: 1650.00, price: 1688.00, pnl: '+2.30%' },
    { name: '宁德时代', code: '300750', weight: '15%', cost: 205.00, price: 198.50, pnl: '-3.17%' },
    { name: '中国平安', code: '601318', weight: '12%', cost: 44.00, price: 45.20, pnl: '+2.73%' },
    { name: '紫金矿业', code: '601899', weight: '10%', cost: 12.00, price: 12.85, pnl: '+7.08%' },
    { name: '招商银行', code: '600036', weight: '8%', cost: 34.50, price: 35.80, pnl: '+3.77%' }
  ];

  var portfolioBody = document.querySelector('#portfolio-holdings tbody');
  if (portfolioBody) {
    portfolioBody.innerHTML = holdings.map(function(h) {
      var color = h.pnl.startsWith('+') ? 'text-up' : 'text-down';
      return '<tr><td><strong>' + h.name + '</strong><br><span style="font-size:11px;color:var(--gray-400)">' + h.code + '</span></td>' +
        '<td>' + h.weight + '</td><td>' + h.cost.toFixed(2) + '</td><td>' + h.price.toFixed(2) + '</td>' +
        '<td class="' + color + '">' + h.pnl + '</td></tr>';
    }).join('');
  }

  // ========== 8. 市场情绪 ==========
  // 涨跌分布图
  var chartUpdown = echarts.init(document.getElementById('chart-updown'), null, { renderer: 'svg' });
  chartUpdown.setOption({
    animation: true,
    tooltip: { trigger: 'axis', backgroundColor: '#fff', borderColor: '#E5E7EB', borderWidth: 1, textStyle: { color: '#1F2937', fontSize: 12 } },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: ['跌停', '-7%', '-5%', '-3%', '-1%', '0%', '+1%', '+3%', '+5%', '+7%', '涨停'], axisLine: { lineStyle: { color: '#E5E7EB' } }, axisLabel: { color: '#9CA3AF', fontSize: 11 } },
    yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#F3F4F6' } }, axisLabel: { color: '#9CA3AF', fontSize: 11 } },
    series: [{ type: 'bar', data: [12, 45, 128, 356, 892, 456, 678, 234, 89, 34, 15], itemStyle: { color: function(p) { return p.dataIndex < 5 ? '#22C55E' : p.dataIndex === 5 ? '#9CA3AF' : '#EF4444'; }, borderRadius: [4, 4, 0, 0] } }]
  });

  // 情绪历史
  var chartSentimentHistory = echarts.init(document.getElementById('chart-sentiment-history'), null, { renderer: 'svg' });
  var sentimentDates = [];
  var sentimentData = [];
  for (var i = 0; i < 30; i++) {
    sentimentDates.push((i + 1) + '日');
    sentimentData.push(30 + Math.random() * 40);
  }
  chartSentimentHistory.setOption({
    animation: true,
    tooltip: { trigger: 'axis', backgroundColor: '#fff', borderColor: '#E5E7EB', borderWidth: 1, textStyle: { color: '#1F2937', fontSize: 12 } },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: sentimentDates, axisLine: { lineStyle: { color: '#E5E7EB' } }, axisLabel: { color: '#9CA3AF', fontSize: 11 } },
    yAxis: { type: 'value', min: 0, max: 100, axisLine: { show: false }, splitLine: { lineStyle: { color: '#F3F4F6' } }, axisLabel: { color: '#9CA3AF', fontSize: 11 } },
    series: [{ type: 'line', data: sentimentData, smooth: true, symbol: 'none', lineStyle: { color: '#3B82F6', width: 2 }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#3B82F630' }, { offset: 1, color: '#3B82F605' }] } } }]
  });

  // ========== 9. 事件驱动 ==========
  var events = [
    { time: '09:30', content: 'A股开盘，三大指数集体低开' },
    { time: '10:15', content: '半导体板块异动拉升，北方华创涨停' },
    { time: '11:00', content: '北向资金净流出超30亿元' },
    { time: '13:30', content: '黄金板块持续走强，山东黄金涨超4%' },
    { time: '14:00', content: '白酒板块持续下探，茅台跌幅扩大至2.8%' },
    { time: '15:00', content: '收盘：沪指跌1.26%，深成指跌1.28%' }
  ];

  var timelineEl = document.getElementById('event-timeline');
  if (timelineEl) {
    timelineEl.innerHTML = events.map(function(e) {
      return '<div class="timeline-item"><div class="timeline-time">' + e.time + '</div><div class="timeline-content">' + e.content + '</div></div>';
    }).join('');
  }

  // ========== 10. 风险管理 ==========
  var riskItems = [
    { name: '市场风险', score: 78, level: 'high' },
    { name: '集中度风险', score: 82, level: 'high' },
    { name: '流动性风险', score: 45, level: 'low' },
    { name: '信用风险', score: 35, level: 'low' },
    { name: '操作风险', score: 58, level: 'mid' }
  ];

  var riskItemsEl = document.getElementById('risk-items');
  if (riskItemsEl) {
    riskItemsEl.innerHTML = riskItems.map(function(r) {
      var barClass = r.level === 'high' ? 'risk-high' : r.level === 'mid' ? 'risk-mid' : 'risk-low';
      return '<div class="risk-item">' +
        '<div class="risk-name">' + r.name + '</div>' +
        '<div class="risk-bar-wrap"><div class="risk-bar ' + barClass + '" style="width:' + r.score + '%"></div></div>' +
        '<div class="risk-score">' + r.score + '</div></div>';
    }).join('');
  }

  // ========== 11. 数据中心 ==========
  var dataTables = [
    { name: 'stock_daily', type: '股票数据', rows: '4500万', updated: '2026-06-19' },
    { name: 'stock_minute', type: '股票数据', rows: '8.9亿', updated: '2026-06-19' },
    { name: 'stock_valuation', type: '股票数据', rows: '5,200', updated: '2026-06-19' },
    { name: 'stock_financial', type: '股票数据', rows: '12.5万', updated: '2026-06-18' },
    { name: 'index_daily', type: '指数数据', rows: '250万', updated: '2026-06-19' },
    { name: 'index_weight', type: '指数数据', rows: '1.5万', updated: '2026-06-19' }
  ];

  var dtBody = document.querySelector('#data-tables tbody');
  if (dtBody) {
    dtBody.innerHTML = dataTables.map(function(t) {
      return '<tr><td><strong>' + t.name + '</strong></td><td><span class="tag tag-blue">' + t.type + '</span></td>' +
        '<td>' + t.rows + '</td><td>' + t.updated + '</td>' +
        '<td><button class="btn btn-sm btn-secondary">预览</button></td></tr>';
    }).join('');
  }

  var btnRunSql = document.getElementById('btn-run-sql');
  if (btnRunSql) {
    btnRunSql.addEventListener('click', function() {
      var result = document.getElementById('sql-result');
      result.innerHTML = '<div class="shimmer" style="height:120px"></div>';
      setTimeout(function() {
        result.innerHTML = '<table class="data-table"><thead><tr><th>code</th><th>name</th><th>close</th><th>change_pct</th><th>volume</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>600519</td><td>贵州茅台</td><td>1688.00</td><td class="text-down">-0.09%</td><td>12.5万</td></tr>' +
          '<tr><td>300750</td><td>宁德时代</td><td>198.50</td><td class="text-down">-1.33%</td><td>45.2万</td></tr>' +
          '<tr><td>601318</td><td>中国平安</td><td>45.20</td><td class="text-up">+1.24%</td><td>89.6万</td></tr>' +
          '<tr><td>600036</td><td>招商银行</td><td>35.80</td><td class="text-up">+1.31%</td><td>67.3万</td></tr>' +
          '<tr><td>601899</td><td>紫金矿业</td><td>12.85</td><td class="text-up">+1.66%</td><td>156.8万</td></tr>' +
          '</tbody></table>' +
          '<div style="margin-top:8px;font-size:11px;color:var(--gray-400)">查询成功 · 耗时 0.23s · 返回 5 行</div>';
        showToast('SQL 查询执行成功');
      }, 800);
    });
  }

  var btnImportData = document.getElementById('btn-import-data');
  if (btnImportData) {
    btnImportData.addEventListener('click', function() {
      showToast('导入功能演示：请选择 CSV/Excel 文件');
    });
  }
  var btnExportData = document.getElementById('btn-export-data');
  if (btnExportData) {
    btnExportData.addEventListener('click', function() {
      showToast('导出功能演示：数据已导出为 CSV');
    });
  }
  var btnSqlQuery = document.getElementById('btn-sql-query');
  if (btnSqlQuery) {
    btnSqlQuery.addEventListener('click', function() {
      document.getElementById('sql-editor').focus();
    });
  }

  // ========== 12. 因子库 ==========
  var factors = [
    { code: 'ROE_TTM', name: '净资产收益率', type: 'quality', typeName: '质量因子', ic: 0.056, ir: 1.62, winRate: 68, desc: '过去12个月净利润计算的净资产收益率' },
    { code: 'PE_TTM', name: '滚动市盈率', type: 'value', typeName: '价值因子', ic: 0.048, ir: 1.35, winRate: 65, desc: '过去12个月净利润计算的市盈率倒数' },
    { code: 'REV_5D', name: '5日反转', type: 'tech', typeName: '技术因子', ic: 0.045, ir: 1.28, winRate: 63, desc: '过去5个交易日收益率反转因子' },
    { code: 'PB_LF', name: '市净率', type: 'value', typeName: '价值因子', ic: 0.041, ir: 1.18, winRate: 62, desc: '最新股价除以每股净资产' },
    { code: 'GP_MARGIN', name: '毛利率', type: 'quality', typeName: '质量因子', ic: 0.039, ir: 1.12, winRate: 60, desc: '毛利润除以营业收入' },
    { code: 'MOM_20D', name: '20日动量', type: 'momentum', typeName: '动量因子', ic: 0.038, ir: 1.05, winRate: 58, desc: '过去20个交易日累计收益率' },
    { code: 'REV_GROWTH', name: '营收增速', type: 'growth', typeName: '成长因子', ic: 0.035, ir: 0.98, winRate: 57, desc: '营业收入同比增长率' },
    { code: 'VOL_20D', name: '20日波动率', type: 'volatility', typeName: '波动因子', ic: -0.032, ir: -0.92, winRate: 45, desc: '过去20个交易日收益率标准差' }
  ];

  function renderFactors(filter) {
    var list = document.getElementById('factor-list');
    if (!list) return;
    var filtered = filter === 'all' ? factors : factors.filter(function(f) { return f.type === filter; });
    list.innerHTML = filtered.map(function(f) {
      var icColor = f.ic >= 0.04 ? 'text-up' : f.ic >= 0 ? '' : 'text-down';
      return '<div class="kb-card" style="margin-bottom:8px">' +
        '<div style="display:flex;align-items:center;justify-content:space-between">' +
          '<div><div class="kb-title">' + f.code + ' <span style="font-size:12px;color:var(--gray-400);font-weight:400">' + f.name + '</span></div>' +
          '<div class="kb-meta"><span class="tag tag-blue">' + f.typeName + '</span></div></div>' +
          '<div style="text-align:right;font-size:12px">' +
            '<div>IC: <span class="' + icColor + '">' + (f.ic > 0 ? '+' : '') + f.ic.toFixed(3) + '</span></div>' +
            '<div>IR: ' + f.ir.toFixed(2) + '</div>' +
            '<div>胜率: ' + f.winRate + '%</div></div></div>' +
        '<div style="font-size:12px;color:var(--gray-500);margin-top:6px">' + f.desc + '</div>' +
        '<div class="kb-actions"><button class="btn btn-sm btn-secondary" onclick="showFactorDetail(\'' + f.code + '\')">详情</button>' +
        '<button class="btn btn-sm btn-secondary" onclick="runFactorBacktest(\'' + f.code + '\')">回测</button></div></div>';
    }).join('');
  }
  renderFactors('all');

  document.querySelectorAll('.factor-filter').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.factor-filter').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderFactors(btn.dataset.filter);
    });
  });

  window.showFactorDetail = function(code) {
    var f = factors.find(function(x) { return x.code === code; });
    showToast('因子 ' + f.code + ' 详情: IC=' + f.ic + ', IR=' + f.ir);
  };
  window.runFactorBacktest = function(code) {
    showToast('因子 ' + code + ' 回测运行中...');
    setTimeout(function() {
      showToast('因子 ' + code + ' 回测完成');
    }, 1500);
  };

  var btnNewFactor = document.getElementById('btn-new-factor');
  if (btnNewFactor) {
    btnNewFactor.addEventListener('click', function() {
      document.getElementById('modal-factor').classList.add('show');
    });
  }
  window.saveFactor = function() {
    document.getElementById('modal-factor').classList.remove('show');
    showToast('因子创建成功');
  };
  window.closeFactorModal = function() {
    document.getElementById('modal-factor').classList.remove('show');
  };

  // ========== 13. AI 投研助理 ==========
  var aiData = {
    '今天市场主要风险是什么？': {
      conclusion: '今日市场面临多重风险叠加，建议保持谨慎，不宜激进操作。',
      basis: ['地缘政治扰动：中东局势紧张推高油价，对全球通胀预期构成压力', '科技股估值回调：AI 概念板块前期涨幅过大，近期获利盘抛压明显', '流动性收紧预期：美联储会议纪要偏鹰，市场对降息时点预期延后', '汇率波动：美元指数走强，新兴市场资金外流压力加大'],
      risk: '若中东冲突升级，油价可能突破 90 美元/桶，进一步推升全球通胀预期，对风险资产形成压制。',
      action: '控制仓位在 60%-70%，增配黄金和短债对冲。关注明日北向资金流向，若持续流出需进一步降仓。'
    },
    '当前组合适合加仓吗？': {
      conclusion: '当前不建议大幅加仓，建议维持现有仓位，等待更明确的企稳信号。',
      basis: ['上证指数跌破 4100 点关键支撑位，技术面偏弱', '组合风险评分 72 分，处于高风险区间', '波动率指标处于近 3 个月 85% 分位，市场不确定性高', '北向资金连续 3 日净流出，外资情绪偏空'],
      risk: '若强行加仓，可能面临进一步下探导致的浮亏扩大。当前支撑位 4050 点若失守，下行空间可能打开至 3980 点。',
      action: '维持现有仓位，等待市场企稳信号（如放量阳线、北向资金回流）后再考虑加仓。可优先配置防御性资产（高股息、黄金）。'
    },
    '哪个策略最近表现最好？': {
      conclusion: '近 90 日表现最优的是均值回归策略，风险调整后收益最佳。',
      basis: ['均值回归策略：+12.18%（近90日），夏普比率 1.68，最大回撤仅 -3.87%', '趋势跟随策略：+8.42%（近90日），夏普比率 1.35，但近期触发减仓信号', '动量轮动策略：+6.75%（近90日），夏普比率 1.02，板块轮动加速导致信号不稳定'],
      risk: '均值回归策略在强趋势行情中可能逆势扛单，需警惕若市场进入单边下跌，策略可能面临连续亏损。',
      action: '可适度增配均值回归策略仓位，但需设置硬止损。同时保持趋势跟随策略的减仓防御，不追高动量轮动策略。'
    },
    '如果明天波动率继续上升怎么办？': {
      conclusion: '若波动率继续上升，建议进一步降低权益仓位，增配波动率对冲工具。',
      basis: ['当前 VIX 等价指标 28.3，已处于近 3 个月 85% 分位', '波动率上升通常伴随风险资产普跌，尤其是高估值成长股', '历史数据显示，VIX 突破 30 后，A 股在随后 5 个交易日内平均下跌 2.1%'],
      risk: '波动率持续上升可能引发程序化交易止损盘涌出，形成负反馈循环，加剧市场下跌。',
      action: '将权益仓位降至 50% 以下；增配黄金（10%-15%）和短久期利率债；可考虑买入虚值认沽期权对冲尾部风险。'
    },
    '生成今日投研日报': {
      conclusion: '今日 A 股三大指数集体低开低走，市场情绪偏向谨慎。',
      basis: ['上证指数收跌 -1.26%，深成指跌 -1.28%，创业板指跌 -1.41%', '两市合计成交约 1.97 万亿元，较前一交易日放量约 8%', '北向资金净流出 45.2 亿元，主力资金整体呈净流出状态', '板块方面，黄金、半导体逆势上涨；科技权重股承压'],
      risk: '组合风险评分 72 分（高风险）。科技股权重过高（42%），集中度风险突出。',
      action: '控制仓位在 60%-70%，减仓科技板块，增配黄金和公用事业。关注 4050 点支撑。'
    }
  };

  function renderAIResult(q) {
    var data = aiData[q];
    if (!data) return;
    var panel = document.getElementById('ai-result-panel');
    var basisHtml = data.basis.map(function(b) { return '<li>' + b + '</li>'; }).join('');
    panel.innerHTML = '<div class="ai-r-header"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>AI 分析结果</div>' +
      '<div class="ai-r-section"><h5>结论</h5><p>' + data.conclusion + '</p></div>' +
      '<div class="ai-r-section"><h5>依据</h5><ul>' + basisHtml + '</ul></div>' +
      '<div class="ai-r-section"><h5>风险</h5><p>' + data.risk + '</p></div>' +
      '<div class="ai-r-section"><h5>建议动作</h5><p>' + data.action + '</p></div>';
  }

  document.querySelectorAll('.ai-q-item').forEach(function(item) {
    item.addEventListener('click', function() {
      document.querySelectorAll('.ai-q-item').forEach(function(q) { q.classList.remove('active'); });
      item.classList.add('active');
      renderAIResult(item.dataset.q);
    });
  });

  var btnAiSend = document.getElementById('btn-ai-send');
  if (btnAiSend) {
    btnAiSend.addEventListener('click', function() {
      showToast('AI 分析生成中...');
      setTimeout(function() {
        renderAIResult('今天市场主要风险是什么？');
        showToast('AI 分析完成');
      }, 1200);
    });
  }
  var btnAiStop = document.getElementById('btn-ai-stop');
  if (btnAiStop) {
    btnAiStop.addEventListener('click', function() {
      showToast('已停止生成');
    });
  }
  var btnAiRegen = document.getElementById('btn-ai-regen');
  if (btnAiRegen) {
    btnAiRegen.addEventListener('click', function() {
      showToast('重新生成中...');
      setTimeout(function() { showToast('重新生成完成'); }, 1000);
    });
  }

  // ========== 14. 知识库 ==========
  var kbArticles = [
    { id: 1, title: '双均线策略详解：从原理到实践', category: 'strategy', catName: '交易策略', views: 1256, date: '2024-01-10', tags: ['均线','趋势跟踪','入门'], content: '双均线策略是最经典的趋势跟踪策略之一...' },
    { id: 2, title: 'MACD指标的高级应用技巧', category: 'tech', catName: '技术分析', views: 987, date: '2024-01-08', tags: ['MACD','技术指标','背离'], content: 'MACD（Moving Average Convergence Divergence）...' },
    { id: 3, title: '如何分析上市公司财务报表', category: 'fundamental', catName: '基本面分析', views: 2345, date: '2024-01-05', tags: ['财报','基本面','价值投资'], content: '财务报表分析是价值投资的核心技能...' },
    { id: 4, title: 'VaR模型在风险控制中的应用', category: 'risk', catName: '风险管理', views: 756, date: '2024-01-03', tags: ['VaR','风控','量化'], content: 'VaR（Value at Risk）是衡量投资组合风险的重要工具...' },
    { id: 5, title: '因子投资入门指南', category: 'strategy', catName: '交易策略', views: 1567, date: '2024-01-01', tags: ['因子','多因子','选股'], content: '因子投资是现代量化投资的基石...' }
  ];

  var favorites = [1, 3, 5];

  function renderKB(filter) {
    var list = document.getElementById('kb-list');
    if (!list) return;
    var filtered = filter === 'all' ? kbArticles : kbArticles.filter(function(a) { return a.category === filter; });
    list.innerHTML = filtered.map(function(a) {
      var isFav = favorites.indexOf(a.id) >= 0;
      return '<div class="kb-card" onclick="showKbDetail(' + a.id + ')">' +
        '<div class="kb-title">' + a.title + '</div>' +
        '<div class="kb-meta"><span class="tag tag-blue">' + a.catName + '</span> · ' + a.views + ' 阅读 · ' + a.date + '</div>' +
        '<div class="kb-tags">' + a.tags.map(function(t) { return '<span class="tag tag-gray">' + t + '</span>'; }).join('') + '</div>' +
        '<div class="kb-actions">' +
        '<button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();toggleFav(' + a.id + ')">' + (isFav ? '取消收藏' : '收藏') + '</button>' +
        '<button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();showKbDetail(' + a.id + ')">阅读</button></div></div>';
    }).join('');
  }
  renderKB('all');

  function renderFavorites() {
    var el = document.getElementById('kb-favorites');
    if (!el) return;
    var favs = kbArticles.filter(function(a) { return favorites.indexOf(a.id) >= 0; });
    el.innerHTML = favs.map(function(a) {
      return '<div style="padding:8px 0;border-bottom:1px solid var(--gray-100);font-size:13px;cursor:pointer" onclick="showKbDetail(' + a.id + ')">' + a.title + '</div>';
    }).join('');
  }
  renderFavorites();

  window.toggleFav = function(id) {
    var idx = favorites.indexOf(id);
    if (idx >= 0) { favorites.splice(idx, 1); showToast('已取消收藏'); }
    else { favorites.push(id); showToast('已收藏'); }
    renderKB(document.querySelector('.kb-filter.active').dataset.filter);
    renderFavorites();
  };

  window.showKbDetail = function(id) {
    var a = kbArticles.find(function(x) { return x.id === id; });
    showToast('打开文章: ' + a.title);
  };

  document.querySelectorAll('.kb-filter').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.kb-filter').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderKB(btn.dataset.filter);
    });
  });

  var btnNewKb = document.getElementById('btn-new-kb');
  if (btnNewKb) {
    btnNewKb.addEventListener('click', function() {
      document.getElementById('modal-kb').classList.add('show');
    });
  }
  window.saveKb = function() {
    document.getElementById('modal-kb').classList.remove('show');
    showToast('文章保存成功');
  };
  window.closeKbModal = function() {
    document.getElementById('modal-kb').classList.remove('show');
  };

  // ========== 15. 系统设置 ==========
  document.querySelectorAll('.settings-nav-item').forEach(function(item) {
    item.addEventListener('click', function() {
      document.querySelectorAll('.settings-nav-item').forEach(function(i) { i.classList.remove('active'); });
      item.classList.add('active');
      document.querySelectorAll('.settings-section').forEach(function(s) { s.classList.remove('active'); });
      document.getElementById('settings-' + item.dataset.settings).classList.add('active');
    });
  });

  var tempSlider = document.getElementById('temp-slider');
  if (tempSlider) {
    tempSlider.addEventListener('input', function() {
      document.getElementById('temp-val').textContent = (this.value / 10).toFixed(1);
    });
  }

  var btnTestApi = document.getElementById('btn-test-api');
  if (btnTestApi) {
    btnTestApi.addEventListener('click', function() {
      var key = document.getElementById('api-key-input').value;
      if (!key) { showToast('请先输入 API Key'); return; }
      showToast('正在测试 API 连接...');
      setTimeout(function() {
        showToast('API 连接测试成功');
      }, 1500);
    });
  }

  var btnSaveSettings = document.getElementById('btn-save-settings');
  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', function() {
      showToast('设置已保存');
    });
  }

  var btnClearCache = document.getElementById('btn-clear-cache');
  if (btnClearCache) {
    btnClearCache.addEventListener('click', function() {
      showToast('缓存已清理');
    });
  }

  // ========== Modal close handlers ==========
  window.closeModal = function() {
    document.getElementById('modal-strategy').classList.remove('show');
  };
  var modalStrategy = document.getElementById('modal-strategy');
  if (modalStrategy) {
    modalStrategy.addEventListener('click', function(e) { if (e.target === this) closeModal(); });
  }
  var modalFactor = document.getElementById('modal-factor');
  if (modalFactor) {
    modalFactor.addEventListener('click', function(e) { if (e.target === this) closeFactorModal(); });
  }
  var modalKb = document.getElementById('modal-kb');
  if (modalKb) {
    modalKb.addEventListener('click', function(e) { if (e.target === this) closeKbModal(); });
  }
  var modalNewStrat = document.getElementById('modal-new-strat');
  if (modalNewStrat) {
    modalNewStrat.addEventListener('click', function(e) { if (e.target === this) closeNewStratModal(); });
  }

})();
