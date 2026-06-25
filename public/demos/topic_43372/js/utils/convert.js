/* ============================================================
 * convert.js  格式转换：Excel ⇄ CSV ⇄ JSON
 * ============================================================ */
(function (global) {
  'use strict';
  var C = global.__C;

  // CSV 字符串 → 二维数组（兼容分隔符自动检测）
  function parseCSV(text, sep) {
    if (!sep || sep === 'auto' || sep === '自动') {
      // 启发式：按行读取前 5 行，对比 ',' / '\t' / ';' 的"一致性"
      var lines = text.split(/\r?\n/).slice(0, 10).filter(function (l) { return l.length > 0; });
      if (!lines.length) { sep = ','; }
      else {
        var candidates = [',', '\t', ';'];
        var bestSep = ',';
        var bestScore = -1;
        for (var ci = 0; ci < candidates.length; ci++) {
          var s = candidates[ci];
          var counts = [];
          for (var li = 0; li < lines.length; li++) {
            var cnt = 0;
            for (var pi = 0; pi < lines[li].length; pi++) if (lines[li].charAt(pi) === s) cnt++;
            counts.push(cnt);
          }
          var avg = counts.reduce(function (a, b) { return a + b; }, 0) / counts.length;
          if (avg < 1) continue;
          // 方差：各行列数越一致越好
          var variance = 0;
          for (var vi = 0; vi < counts.length; vi++) variance += Math.pow(counts[vi] - avg, 2);
          variance /= counts.length;
          var score = avg - variance * 0.5;
          if (score > bestScore) { bestScore = score; bestSep = s; }
        }
        sep = bestSep;
      }
    }
    // 正则 CSV：支持双引号包裹
    var rows = [];
    var cur = [];
    var field = '';
    var inQuote = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (inQuote) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuote = false;
        } else field += ch;
      } else {
        if (ch === '"') inQuote = true;
        else if (ch === sep) { cur.push(field); field = ''; }
        else if (ch === '\n') { cur.push(field); field = ''; rows.push(cur); cur = []; }
        else if (ch === '\r') { /* skip */ }
        else field += ch;
      }
    }
    if (field !== '' || cur.length) { cur.push(field); rows.push(cur); }
    // 清理全空行
    return rows.filter(function (r) { return r.length > 1 || (r.length === 1 && r[0] !== ''); });
  }

  // 二维数组 → CSV 文本
  function toCSV(aoa, sep) {
    sep = sep || ',';
    return aoa.map(function (row) {
      return row.map(function (c) {
        var s = c == null ? '' : String(c);
        if (s.indexOf(sep) >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0) {
          s = '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      }).join(sep);
    }).join('\r\n');
  }

  // Excel → 多 sheet CSV（数组形式）
  function xlsxToCSVs(file, sep) {
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var out = [];
      wb.SheetNames.forEach(function (sn) {
        var aoa = C.sheetToArray(wb.Sheets[sn]);
        out.push({ sheetName: sn, csv: toCSV(aoa, sep) });
      });
      return out;
    });
  }

  // Excel → JSON（对象数组）
  function xlsxToJSONs(file) {
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var out = [];
      wb.SheetNames.forEach(function (sn) {
        out.push({ sheetName: sn, json: C.sheetToObjects(wb.Sheets[sn]) });
      });
      return out;
    });
  }

  // CSV → Excel（单 sheet）
  function csvToXlsx(file, sep) {
    return C.readAsText(file).then(function (text) {
      var aoa = parseCSV(text, sep);
      var wb = XLSX.utils.book_new();
      var ws = C.aoaToSheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      return { workbook: wb, rowCount: aoa.length };
    });
  }

  // JSON → Excel（支持对象数组或 {sheetName, json:[]} 数组）
  function jsonToXlsx(file) {
    return C.readAsText(file).then(function (text) {
      var data;
      try { data = JSON.parse(text); }
      catch (e) { throw new Error('JSON 解析失败: ' + e.message); }
      var wb = XLSX.utils.book_new();
      if (Array.isArray(data) && data.length && typeof data[0] === 'object' && data[0].sheetName && Array.isArray(data[0].json)) {
        data.forEach(function (item, i) {
          var ws = C.jsonToSheet(item.json);
          XLSX.utils.book_append_sheet(wb, ws, item.sheetName || ('Sheet' + (i + 1)));
        });
      } else if (Array.isArray(data)) {
        var ws = Array.isArray(data[0])
          ? C.aoaToSheet(data)          // 二维数组
          : C.jsonToSheet(data);        // 对象数组
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      } else {
        throw new Error('JSON 必须为数组');
      }
      return { workbook: wb };
    });
  }

  // PDF 导出（浏览器打印 HTML）：生成可打印的 HTML 并打开新窗口
  function xlsxToPDFView(file) {
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var html = '<html><head><meta charset="utf-8"><title>' + (file.name || '导出') + '</title>' +
        '<style>body{font-family:Calibri,sans-serif;padding:16px;}h2{color:#22a75d;margin:20px 0 8px;}' +
        'table{border-collapse:collapse;width:100%;font-size:12px;}td,th{border:1px solid #ccc;padding:4px 8px;}' +
        'th{background:#e8f7ef;color:#1b8749;}tr:nth-child(even) td{background:#f7f9fb;}' +
        '@media print{.no-print{display:none;}}.no-print{padding:8px 16px;background:#22a75d;color:#fff;border:0;border-radius:4px;cursor:pointer;margin-bottom:12px;}' +
        '</style></head><body>' +
        '<button class="no-print" onclick="window.print()">打印 / 另存为 PDF</button>';
      wb.SheetNames.forEach(function (sn) {
        html += '<h2>' + sn + '</h2><table>';
        var aoa = C.sheetToArray(wb.Sheets[sn]);
        aoa.forEach(function (row, i) {
          html += '<tr>';
          row.forEach(function (c) { html += (i === 0 ? '<th>' : '<td>') + (c == null ? '' : String(c)) + (i === 0 ? '</th>' : '</td>'); });
          html += '</tr>';
        });
        html += '</table>';
      });
      html += '</body></html>';
      var w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); }
      else {
        var blob = new Blob([html], { type: 'text/html' });
        C.downloadBlob(blob, C.safeFilename(file.name).replace(/\.[^.]+$/, '') + '_可打印.html');
      }
      return true;
    });
  }

  // Excel → Markdown 表格（多 sheet，| 分隔）
  function xlsxToMarkdown(file) {
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var items = [];
      wb.SheetNames.forEach(function (sn) {
        var aoa = C.sheetToArray(wb.Sheets[sn]);
        var text = '';
        if (aoa.length) {
          // 表头
          text += '| ' + aoa[0].map(function (c) { return String(c == null ? '' : c).replace(/\|/g, '\\|'); }).join(' | ') + ' |\n';
          // 分隔线
          text += '|' + aoa[0].map(function () { return '---|'; }).join('') + '\n';
          // 数据
          for (var r = 1; r < aoa.length; r++) {
            text += '| ' + aoa[r].map(function (c) { return String(c == null ? '' : c).replace(/\|/g, '\\|').replace(/\r?\n/g, ' '); }).join(' | ') + ' |\n';
          }
        }
        items.push({ sheetName: sn, markdown: text });
      });
      return items;
    });
  }

  // Excel → HTML Table（单个文件，纯 table，可选择带样式）
  function xlsxToHTMLTable(file) {
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var text = '';
      wb.SheetNames.forEach(function (sn) {
        var aoa = C.sheetToArray(wb.Sheets[sn]);
        text += '<h2>' + sn + '</h2>\n';
        if (aoa.length) {
          text += '<table border="1" style="border-collapse:collapse;">\n';
          text += '<thead><tr>';
          aoa[0].forEach(function (c) { text += '<th>' + (c == null ? '' : String(c)) + '</th>'; });
          text += '</tr></thead><tbody>\n';
          for (var r = 1; r < aoa.length; r++) {
            text += '<tr>';
            for (var c = 0; c < aoa[r].length; c++) {
              text += '<td>' + (aoa[r][c] == null ? '' : String(aoa[r][c])) + '</td>';
            }
            text += '</tr>\n';
          }
          text += '</tbody></table>\n';
        }
      });
      return text;
    });
  }

  global.__CONV = {
    parseCSV: parseCSV,
    toCSV: toCSV,
    xlsxToCSVs: xlsxToCSVs,
    xlsxToJSONs: xlsxToJSONs,
    csvToXlsx: csvToXlsx,
    jsonToXlsx: jsonToXlsx,
    xlsxToPDFView: xlsxToPDFView,
    xlsxToMarkdown: xlsxToMarkdown,
    xlsxToHTMLTable: xlsxToHTMLTable
  };
})(window);
