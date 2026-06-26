/**
 * 知行合一盈亏记录系统 - 数据导出模块
 */
var ExportModule = (function() {
  'use strict';

  function render(container) {
    var trades = Store.getAllTrades();
    var summary = Store.getSummary();

    container.innerHTML =
      '<div class="page-header"><h2>数据导出</h2></div>' +
      '<div class="stats-grid" style="margin-bottom:2rem">' +
      '<div class="stat-card"><div class="stat-label">总交易笔数</div><div class="stat-value">' + summary.totalTrades + '</div></div>' +
      '<div class="stat-card"><div class="stat-label">总盈亏</div><div class="stat-value ' + (summary.totalPnL >= 0 ? 'profit' : 'loss') + '">' + Utils.formatMoney(summary.totalPnL, true) + '</div></div>' +
      '<div class="stat-card"><div class="stat-label">胜率</div><div class="stat-value">' + summary.winRate.toFixed(1) + '%</div></div>' +
      '</div>' +
      '<div class="dashboard-grid">' +
      '<div class="card"><div class="card-header"><h3>📊 CSV 导出</h3></div>' +
      '<p class="text-muted" style="font-size:0.85rem;margin-bottom:1rem">导出所有交易记录为 CSV 格式，可用 Excel 打开进行进一步分析</p>' +
      '<button class="btn btn-primary" id="export-csv-btn"' + (trades.length === 0 ? ' disabled' : '') + '>导出 CSV 文件</button>' +
      '</div>' +
      '<div class="card"><div class="card-header"><h3>🖨️ 打印报告</h3></div>' +
      '<p class="text-muted" style="font-size:0.85rem;margin-bottom:1rem">打印交易报告，可在打印对话框中选择"另存为 PDF"生成 PDF 文件</p>' +
      '<button class="btn btn-primary" id="export-print-btn"' + (trades.length === 0 ? ' disabled' : '') + '>打印报告</button>' +
      '</div>' +
      '</div>' +
      '<div class="card" style="margin-top:1.5rem"><div class="card-header"><h3>💾 数据管理</h3></div>' +
      '<div style="display:flex;gap:1rem;flex-wrap:wrap">' +
      '<button class="btn btn-outline" id="export-json-btn">导出全部数据 (JSON)</button>' +
      '<button class="btn btn-outline" id="import-json-btn">导入数据</button>' +
      '<input type="file" id="import-json-file" accept=".json" style="display:none">' +
      '<button class="btn btn-danger btn-sm" id="clear-data-btn">清空所有数据</button>' +
      '</div></div>';

    // CSV Export
    container.querySelector('#export-csv-btn').addEventListener('click', function() {
      if (trades.length === 0) return;
      exportCSV(trades);
      App.showToast('CSV 文件已导出', 'success');
    });

    // Print Report
    container.querySelector('#export-print-btn').addEventListener('click', function() {
      if (trades.length === 0) return;
      printReport(trades, summary);
    });

    // JSON Export
    container.querySelector('#export-json-btn').addEventListener('click', function() {
      var data = Store.exportAllData();
      var json = JSON.stringify(data, null, 2);
      download(json, 'application/json', '知行合一_全部数据_' + Utils.formatDate(new Date()) + '.json');
      App.showToast('数据已导出', 'success');
    });

    // JSON Import
    var importBtn = container.querySelector('#import-json-btn');
    var importFile = container.querySelector('#import-json-file');
    importBtn.addEventListener('click', function() { importFile.click(); });
    importFile.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        var count = Store.importData(ev.target.result);
        if (count) {
          App.showToast('成功导入 ' + count + ' 条记录', 'success');
          render(container);
        } else {
          App.showToast('导入失败，文件格式不正确', 'error');
        }
      };
      reader.readAsText(file);
    });

    // Clear Data
    container.querySelector('#clear-data-btn').addEventListener('click', function() {
      App.showModal(
        '确认清空数据',
        '此操作将删除所有交易记录和设置，且不可恢复。确定要继续吗？',
        function() {
          Store.clearAllData();
          App.showToast('所有数据已清空', 'warning');
          render(container);
        }
      );
    });
  }

  function exportCSV(trades) {
    var headers = ['日期', '股票代码', '股票名称', '操作', '盈亏金额', '盈亏比例', '买入价', '卖出价', '成交股数', '交易理由', '情绪', '备注'];
    var sorted = trades.slice().sort(function(a, b) { return b.date.localeCompare(a.date); });
    var rows = sorted.map(function(t) {
      var emInfo = Utils.getEmotionInfo(t.emotion);
      return [
        t.date,
        t.stockCode,
        t.stockName,
        t.direction === 'buy' ? '买入' : '卖出',
        t.pnlAmount,
        t.pnlPercent + '%',
        t.costPrice || '',
        t.sellPrice || '',
        t.shares || '',
        t.reason,
        emInfo.label,
        '"' + (t.notes || '').replace(/"/g, '""') + '"'
      ];
    });
    var csv = '\uFEFF' + [headers.join(','), ...rows.map(function(r) { return r.join(','); })].join('\n');
    download(csv, 'text/csv', '知行合一_交易记录_' + Utils.formatDate(new Date()) + '.csv');
  }

  function printReport(trades, summary) {
    var printWin = window.open('', '_blank');
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>知行合一交易报告</title>' +
      '<style>body{font-family:"Microsoft YaHei",sans-serif;color:#222;padding:2rem}' +
      'h1{color:#10b981;border-bottom:2px solid #10b981;padding-bottom:0.5rem}' +
      'table{width:100%;border-collapse:collapse;margin:1rem 0}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:0.85rem}' +
      'th{background:#f5f5f5}.profit{color:#10b981}.loss{color:#ef4444}' +
      '.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin:1rem 0}' +
      '.summary-item{border:1px solid #ddd;border-radius:8px;padding:1rem;text-align:center}' +
      '.summary-value{font-size:1.5rem;font-weight:700}.summary-label{font-size:0.8rem;color:#666}' +
      '</style></head><body>' +
      '<h1>知行合一交易报告</h1>' +
      '<p>生成时间: ' + Utils.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss') + '</p>' +
      '<div class="summary">' +
      '<div class="summary-item"><div class="summary-value">' + summary.totalTrades + '</div><div class="summary-label">总交易笔数</div></div>' +
      '<div class="summary-item"><div class="summary-value ' + (summary.totalPnL >= 0 ? 'profit' : 'loss') + '">' + Utils.formatMoney(summary.totalPnL, true) + '</div><div class="summary-label">总盈亏</div></div>' +
      '<div class="summary-item"><div class="summary-value">' + summary.winRate.toFixed(1) + '%</div><div class="summary-label">胜率</div></div>' +
      '<div class="summary-item"><div class="summary-value">' + summary.profitFactor.toFixed(2) + '</div><div class="summary-label">盈亏比</div></div>' +
      '</div>' +
      '<table><thead><tr><th>日期</th><th>股票</th><th>操作</th><th>盈亏</th><th>比例</th><th>理由</th><th>情绪</th></tr></thead><tbody>';
    var sorted = trades.slice().sort(function(a, b) { return b.date.localeCompare(a.date); });
    sorted.forEach(function(t) {
      var emInfo = Utils.getEmotionInfo(t.emotion);
      html += '<tr><td>' + t.date + '</td><td>' + t.stockCode + ' ' + t.stockName + '</td><td>' + (t.direction === 'buy' ? '买入' : '卖出') + '</td>' +
        '<td class="' + (t.pnlAmount >= 0 ? 'profit' : 'loss') + '">' + Utils.formatMoney(t.pnlAmount, true) + '</td>' +
        '<td class="' + (t.pnlPercent >= 0 ? 'profit' : 'loss') + '">' + Utils.formatPercent(t.pnlPercent, true) + '</td>' +
        '<td>' + t.reason + '</td><td>' + emInfo.icon + emInfo.label + '</td></tr>';
    });
    html += '</tbody></table></body></html>';
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    printWin.print();
  }

  function download(content, mimeType, filename) {
    var blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return { render: render };
})();
