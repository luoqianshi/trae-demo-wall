/**
 * 知行合一盈亏记录系统 - 交易记录列表模块
 */
var TradeList = (function() {
  'use strict';

  var currentPage = 1;
  var pageSize = 20;
  var sortField = 'date';
  var sortOrder = 'desc';
  var filters = {};

  function render(container) {
    currentPage = 1;
    filters = {};

    var trades = Store.getAllTrades();
    if (trades.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-icon">📝</div>' +
        '<h3>还没有交易记录</h3>' +
        '<p>记录你的第一笔交易，开始知行合一之旅</p>' +
        '<div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">' +
        '<button class="btn btn-primary" onclick="Router.navigate(\'#app/trades/new\')">记录第一笔交易</button>' +
        '<button class="btn btn-outline" onclick="Store.importSampleData();TradeList.refresh(document.getElementById(\'app-main\'));App.showToast(\'示例数据已导入\',\'success\')">导入示例数据</button>' +
        '</div></div>';
      return;
    }

    container.innerHTML =
      '<div class="page-header"><h2>交易记录</h2>' +
      '<div class="page-actions">' +
      '<button class="btn btn-outline btn-sm" onclick="Store.importSampleData();TradeList.refresh(document.getElementById(\'app-main\'));App.showToast(\'示例数据已导入\',\'success\')">导入示例</button>' +
      '<button class="btn btn-primary btn-sm" onclick="Router.navigate(\'#app/trades/new\')">+ 新增记录</button>' +
      '</div></div>' +
      '<div class="trade-filters" id="tl-filters"></div>' +
      '<div class="trade-table-wrap" id="tl-table"></div>' +
      '<div class="pagination" id="tl-pagination"></div>';

    renderFilters(container);
    refreshTable(container);
  }

  function renderFilters(container) {
    var filtersEl = container.querySelector('#tl-filters');
    filtersEl.innerHTML =
      '<input type="date" id="tl-start" class="form-input" style="width:150px" placeholder="起始日期">' +
      '<span class="text-muted" style="font-size:0.85rem">至</span>' +
      '<input type="date" id="tl-end" class="form-input" style="width:150px" placeholder="结束日期">' +
      '<select id="tl-direction" class="form-input" style="width:100px">' +
      '<option value="">全部方向</option><option value="buy">买入</option><option value="sell">卖出</option></select>' +
      '<select id="tl-pnltype" class="form-input" style="width:100px">' +
      '<option value="">全部盈亏</option><option value="profit">盈利</option><option value="loss">亏损</option></select>' +
      '<button class="btn btn-sm btn-outline" id="tl-filter-btn">筛选</button>';

    container.querySelector('#tl-filter-btn').addEventListener('click', function() {
      filters.startDate = container.querySelector('#tl-start').value || undefined;
      filters.endDate = container.querySelector('#tl-end').value || undefined;
      filters.direction = container.querySelector('#tl-direction').value || undefined;
      filters.pnlType = container.querySelector('#tl-pnltype').value || undefined;
      currentPage = 1;
      refreshTable(container);
    });
  }

  function refreshTable(container) {
    if (!container) container = document.getElementById('app-main');
    var result = Store.getTrades({
      startDate: filters.startDate,
      endDate: filters.endDate,
      direction: filters.direction,
      pnlType: filters.pnlType,
      sort: sortField,
      order: sortOrder,
      page: currentPage,
      pageSize: pageSize
    });

    var tableEl = container.querySelector('#tl-table');
    if (!tableEl) return;

    if (result.items.length === 0) {
      tableEl.innerHTML = '<div class="empty-state" style="padding:2rem"><p>没有匹配的交易记录</p></div>';
      container.querySelector('#tl-pagination').innerHTML = '';
      return;
    }

    var html = '<table class="trade-table"><thead><tr>' +
      '<th data-sort="date">日期 <span class="sort-icon">' + (sortField === 'date' ? (sortOrder === 'desc' ? '▼' : '▲') : '⇅') + '</span></th>' +
      '<th>股票</th>' +
      '<th>方向</th>' +
      '<th data-sort="pnlAmount">盈亏金额 <span class="sort-icon">' + (sortField === 'pnlAmount' ? (sortOrder === 'desc' ? '▼' : '▲') : '⇅') + '</span></th>' +
      '<th data-sort="pnlPercent">盈亏比例 <span class="sort-icon">' + (sortField === 'pnlPercent' ? (sortOrder === 'desc' ? '▼' : '▲') : '⇅') + '</span></th>' +
      '<th>理由</th>' +
      '<th>情绪</th>' +
      '<th>操作</th>' +
      '</tr></thead><tbody>';

    result.items.forEach(function(t) {
      var emInfo = Utils.getEmotionInfo(t.emotion);
      html += '<tr>' +
        '<td>' + t.date + '</td>' +
        '<td><span style="color:var(--ink);font-family:var(--font-mono)">' + t.stockCode + '</span> <span style="font-size:0.8rem">' + (t.stockName || '') + '</span></td>' +
        '<td>' + (t.direction === 'buy' ? '📈 买入' : '📉 卖出') + '</td>' +
        '<td class="' + (t.pnlAmount >= 0 ? 'profit' : 'loss') + '" style="font-family:var(--font-mono);font-weight:600">' + Utils.formatMoney(t.pnlAmount, true) + '</td>' +
        '<td class="' + (t.pnlPercent >= 0 ? 'profit' : 'loss') + '" style="font-family:var(--font-mono)">' + Utils.formatPercent(t.pnlPercent, true) + '</td>' +
        '<td style="font-size:0.8rem">' + (t.reason || '-') + '</td>' +
        '<td><span class="emotion-cell">' + emInfo.icon + ' ' + emInfo.label + '</span></td>' +
        '<td><div class="action-btns">' +
        '<button class="btn btn-sm btn-outline" onclick="Router.navigate(\'#app/trades/edit/' + t.id + '\')">编辑</button>' +
        '<button class="btn btn-sm btn-outline" style="color:var(--accent2)" onclick="TradeList.confirmDelete(\'' + t.id + '\')">删除</button>' +
        '</div></td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    tableEl.innerHTML = html;

    // Sort handlers
    tableEl.querySelectorAll('th[data-sort]').forEach(function(th) {
      th.addEventListener('click', function() {
        var field = this.getAttribute('data-sort');
        if (sortField === field) {
          sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
        } else {
          sortField = field;
          sortOrder = 'desc';
        }
        refreshTable(container);
      });
    });

    // Pagination
    renderPagination(container, result);
  }

  function renderPagination(container, result) {
    var pagEl = container.querySelector('#tl-pagination');
    if (!pagEl || result.totalPages <= 1) {
      if (pagEl) pagEl.innerHTML = '<span class="page-info">共 ' + result.total + ' 条记录</span>';
      return;
    }

    var html = '<button ' + (currentPage <= 1 ? 'disabled' : '') + ' onclick="TradeList.goPage(' + (currentPage - 1) + ')">上一页</button>';
    var startPage = Math.max(1, currentPage - 2);
    var endPage = Math.min(result.totalPages, currentPage + 2);
    for (var i = startPage; i <= endPage; i++) {
      html += '<button class="' + (i === currentPage ? 'active' : '') + '" onclick="TradeList.goPage(' + i + ')">' + i + '</button>';
    }
    html += '<button ' + (currentPage >= result.totalPages ? 'disabled' : '') + ' onclick="TradeList.goPage(' + (currentPage + 1) + ')">下一页</button>';
    html += '<span class="page-info">共 ' + result.total + ' 条 / ' + result.totalPages + ' 页</span>';
    pagEl.innerHTML = html;
  }

  function goPage(page) {
    currentPage = page;
    refreshTable(document.getElementById('app-main'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function confirmDelete(id) {
    var trade = Store.getTradeById(id);
    if (!trade) return;
    App.showModal(
      '确认删除',
      '确定要删除 ' + (trade.stockName || trade.stockCode) + ' 在 ' + trade.date + ' 的交易记录吗？此操作不可恢复。',
      function() {
        Store.deleteTrade(id);
        App.showToast('交易记录已删除', 'success');
        refreshTable(document.getElementById('app-main'));
      }
    );
  }

  function refresh(container) {
    render(container);
  }

  return {
    render: render,
    refresh: refresh,
    goPage: goPage,
    confirmDelete: confirmDelete
  };
})();
