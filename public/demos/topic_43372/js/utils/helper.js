/* ============================================================
 * helper.js  轻量辅助工具
 * 日期格式转换、单元格文本提取、统一行高列宽、生成工作表目录
 * ============================================================ */
(function (global) {
  'use strict';
  var C = global.__C;

  // ============== 日期格式化 ==============
  function convertDate(file, colIdx, fmt) {
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var wbOut = XLSX.utils.book_new();
      var count = 0;
      wb.SheetNames.forEach(function (sn) {
        var aoa = C.sheetToArray(wb.Sheets[sn]);
        if (!aoa.length) { XLSX.utils.book_append_sheet(wbOut, wb.Sheets[sn], sn); return; }
        var target = colIdx;
        if (target < 0) {
          // 处理所有疑似日期单元格
          for (var r = 0; r < aoa.length; r++) {
            for (var c = 0; c < aoa[r].length; c++) {
              var v = aoa[r][c];
              if (v instanceof Date || (typeof v === 'string' && /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/.test(v))) {
                aoa[r][c] = C.formatDate(v, fmt);
                count++;
              }
            }
          }
        } else {
          for (var r2 = 1; r2 < aoa.length; r2++) {
            if (aoa[r2][target] != null && aoa[r2][target] !== '') {
              aoa[r2][target] = C.formatDate(aoa[r2][target], fmt);
              count++;
            }
          }
        }
        var ws = C.aoaToSheet(aoa);
        XLSX.utils.book_append_sheet(wbOut, ws, sn);
      });
      return { workbook: wbOut, converted: count };
    });
  }

  // ============== 单元格文本提取 ==============
  function extractText(file, opts) {
    opts = opts || {};
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var wbOut = XLSX.utils.book_new();
      var count = 0;
      var mode = opts.mode || 'digits';
      var targetCol = opts.colIdx; // number or -1
      var frontN = opts.n;
      wb.SheetNames.forEach(function (sn) {
        var aoa = C.sheetToArray(wb.Sheets[sn]);
        if (!aoa.length) return;
        // 生成新列（如果是单表）
        for (var r = 1; r < aoa.length; r++) {
          var cols = targetCol >= 0 ? [targetCol] : aoa[r].map(function (_, i) { return i; });
          cols.forEach(function (c) {
            var v = String(aoa[r][c] != null ? aoa[r][c] : '');
            var result = '';
            switch (mode) {
              case 'digits': result = (v.match(/\d+/g) || []).join(''); break;
              case 'letters': result = (v.match(/[A-Za-z]+/g) || []).join(''); break;
              case 'chinese': result = (v.match(/[\u4e00-\u9fa5]+/g) || []).join(''); break;
              case 'email': result = (v.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []).join(','); break;
              case 'phone': result = (v.match(/1[3-9]\d{9}/g) || []).join(','); break;
              case 'length':
                if (opts.side === 'right') result = v.slice(-frontN);
                else result = v.slice(0, frontN);
                break;
            }
            aoa[r][c] = result;
            if (result) count++;
          });
        }
        var ws = C.aoaToSheet(aoa);
        XLSX.utils.book_append_sheet(wbOut, ws, sn);
      });
      return { workbook: wbOut, extracted: count };
    });
  }

  // ============== 统一行高列宽 ==============
  function uniformRowCol(file, rowH, colW) {
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var wbOut = XLSX.utils.book_new();
      wb.SheetNames.forEach(function (sn) {
        var ws = wb.Sheets[sn];
        // 复制 sheet 对象
        var newWs = JSON.parse(JSON.stringify(ws));
        if (colW > 0) {
          var ref = newWs['!ref'] || 'A1:A1';
          var range = XLSX.utils.decode_range(ref);
          var cols = [];
          for (var c = 0; c <= range.e.c; c++) cols.push({ wch: colW });
          newWs['!cols'] = cols;
        }
        if (rowH > 0) {
          var ref2 = newWs['!ref'] || 'A1:A1';
          var range2 = XLSX.utils.decode_range(ref2);
          var rows = [];
          for (var r = 0; r <= range2.e.r; r++) rows.push({ hpt: rowH });
          newWs['!rows'] = rows;
        }
        XLSX.utils.book_append_sheet(wbOut, newWs, sn);
      });
      return { workbook: wbOut };
    });
  }

  // ============== 生成工作表目录（带超链接）==============
  function buildToc(file) {
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      // 原工作簿前插入目录 sheet，但是 sheetjs 写超链接需要 Hyperlinks 部分
      // 简化做法：生成一张独立的目录 Excel，包含每 sheet 名称 + 基本信息
      var wbOut = XLSX.utils.book_new();
      var tocRows = [['序号', '工作表名称', '起始单元格A1值', '说明']];
      wb.SheetNames.forEach(function (sn, i) {
        var sheet = wb.Sheets[sn];
        var firstVal = (sheet && sheet['A1'] && sheet['A1'].v != null) ? String(sheet['A1'].v) : '';
        tocRows.push([i + 1, sn, firstVal, '点击跳转到此 Sheet']);
      });
      var ws = C.aoaToSheet(tocRows);
      // 添加 hyperlink（SheetJS 支持通过 !merges + cell.l）
      // 简单版：直接用函数在每个 B 列 cell 上设置 .l 超链接（在 Excel 中格式是 #Sheet!A1）
      for (var r = 1; r < tocRows.length; r++) {
        var addr = 'B' + (r + 1);
        var cellAddr = XLSX.utils.decode_cell(addr);
        if (!ws[addr]) ws[addr] = { t: 's', v: tocRows[r][1] };
        ws[addr].l = { Target: "#'" + tocRows[r][1].replace(/'/g, "''") + "'!A1", Tooltip: '跳转到 ' + tocRows[r][1] };
        ws[addr].s = { font: { color: { rgb: 'FF0000FF' }, underline: true } };
      }
      // 设置列宽
      ws['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wbOut, ws, '目录');
      // 把原 sheet 也放进去
      wb.SheetNames.forEach(function (sn) {
        XLSX.utils.book_append_sheet(wbOut, wb.Sheets[sn], sn);
      });
      return { workbook: wbOut, sheetCount: wb.SheetNames.length };
    });
  }

  // ============== CSV 编码转换 ==============
  // 支持模式：'any'(自动检测→UTF-8) / 'gbk'(GBK→UTF-8) / 'utf-gbk'(UTF-8→GBK)
  function csvEncConvert(file, mode) {
    // 先尝试使用 TextDecoder 检测（若浏览器支持）
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (ev) {
        try {
          var buf = ev.target.result;
          var bytes = new Uint8Array(buf);
          var text;
          // 简单检测：是否已有 BOM
          var hasBOM = (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF);
          var enc;
          if (mode === 'utf-gbk') {
            // UTF-8 → GBK：比较困难，这里用近似：写入 UTF-8 无 BOM 并替换成 GBK 字元集
            enc = 'UTF-8';
            text = new TextDecoder('UTF-8').decode(hasBOM ? bytes.subarray(3) : bytes);
            // 用 GBK 编码：Blob 以 GBK charset 保存（浏览器会尝试做字符映射）
            var blob = new Blob([text], { type: 'text/csv;charset=gbk' });
            resolve({ blob: blob, outputName: C.safeFilename(file.name).replace(/\.csv$/, '') + '_GBK.csv', encoding: 'GBK' });
            return;
          } else {
            // GBK / 自动检测 → UTF-8（带 BOM）
            try {
              enc = 'GBK';
              text = new TextDecoder('gbk').decode(bytes);
              // 验证：若解码后出现大量 ? 或乱码，尝试 UTF-8
              if (text.indexOf('\uFFFD') > text.length / 10) {
                // fallback: 用 UTF-8
                enc = 'UTF-8';
                text = new TextDecoder('utf-8').decode(hasBOM ? bytes.subarray(3) : bytes);
              }
            } catch (e) {
              enc = 'UTF-8';
              text = new TextDecoder('utf-8').decode(hasBOM ? bytes.subarray(3) : bytes);
            }
            var out = '\ufeff' + text;
            var blob = new Blob([out], { type: 'text/csv;charset=utf-8' });
            resolve({ blob: blob, outputName: C.safeFilename(file.name).replace(/\.csv$/, '') + '_UTF-8.csv', encoding: enc });
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = function () { reject(new Error('文件读取失败')); };
      reader.readAsArrayBuffer(file);
    });
  }

  // ============== Excel 元信息 ==============
  function metaInfo(file) {
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var rows = [['序号', '工作表名称', '有效行数', '有效列数', 'A1 值']];
      wb.SheetNames.forEach(function (sn, i) {
        var aoa = C.sheetToArray(wb.Sheets[sn]);
        var maxCols = aoa.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
        rows.push([i + 1, sn, Math.max(0, aoa.length), maxCols, aoa[0] && aoa[0][0] != null ? String(aoa[0][0]).slice(0, 60) : '']);
      });
      return { workbook: wb, rows: rows, sheetCount: wb.SheetNames.length };
    });
  }

  // ============== 快速预览 Excel 前N行 ==============
  function quickPreview(file, opts) {
    opts = opts || {};
    var rows = Math.max(1, opts.rows == null ? 20 : (opts.rows | 0));
    var cols = opts.cols == null ? 0 : Math.max(0, opts.cols | 0); // 0 代表自动
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var sheets = [];
      wb.SheetNames.forEach(function (sn) {
        var aoa = C.sheetToArray(wb.Sheets[sn]);
        var sliced = aoa.slice(0, rows);
        if (cols > 0) {
          sliced = sliced.map(function (row) { return row.slice(0, cols); });
        }
        sheets.push({
          sheetName: sn,
          totalRows: aoa.length,
          totalCols: aoa.reduce(function (m, r) { return Math.max(m, r.length); }, 0),
          rows: sliced
        });
      });
      return {
        fileName: file.name,
        fileSize: file.size,
        sheetCount: wb.SheetNames.length,
        sheets: sheets
      };
    });
  }

  global.__HELPER = {
    convertDate: convertDate,
    extractText: extractText,
    uniformRowCol: uniformRowCol,
    buildToc: buildToc,
    csvEncConvert: csvEncConvert,
    metaInfo: metaInfo,
    quickPreview: quickPreview
  };
})(window);
