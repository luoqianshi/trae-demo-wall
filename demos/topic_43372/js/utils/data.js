/* ============================================================
 * data.js  数据整理工具
 * 合并 / 拆分 / 去重 / 清理空行列 / 对比 / 一维二维互转
 * ============================================================ */
(function (global) {
  'use strict';

  var C = global.__C;

  // 读取多个文件 → 每个文件的每个 sheet 产出 { file, sheet, aoa }
  function loadFiles(files) {
    var tasks = Array.from(files).map(function (f) {
      return C.readAsBuffer(f).then(function (buf) {
        var wb = C.readWorkbook(buf);
        return wb.SheetNames.map(function (sn) {
          var sheet = wb.Sheets[sn];
          var aoa = C.sheetToArray(sheet);
          return { fileName: f.name, sheetName: sn, aoa: aoa };
        });
      });
    });
    return Promise.all(tasks).then(function (arr) {
      var out = [];
      arr.forEach(function (a) { a.forEach(function (x) { out.push(x); }); });
      return out;
    });
  }

  // ============== 合并 ==============
  function mergeFiles(files, opts) {
    opts = opts || {};
    return loadFiles(files).then(function (list) {
      var header = null;
      var rows = [];
      list.forEach(function (item, idx) {
        if (!item.aoa || item.aoa.length === 0) return;
        if (opts.useHeader) {
          if (!header) header = item.aoa[0].slice();
          for (var i = 1; i < item.aoa.length; i++) {
            var row = item.aoa[i].slice();
            if (opts.sourceCol) row.push(item.fileName + ' / ' + item.sheetName);
            rows.push(row);
          }
        } else {
          item.aoa.forEach(function (row) {
            var r = row.slice();
            if (opts.sourceCol) r.push(item.fileName + ' / ' + item.sheetName);
            rows.push(r);
          });
        }
      });
      var result = [];
      if (header) {
        var h = header.slice();
        if (opts.sourceCol) h.push('来源');
        result.push(h);
      }
      result = result.concat(rows);
      var wb = XLSX.utils.book_new();
      var ws = C.aoaToSheet(result);
      XLSX.utils.book_append_sheet(wb, ws, '合并结果');
      return { workbook: wb, aoa: result, rowCount: result.length };
    });
  }

  // ============== 按列拆分 ==============
  function splitByCol(file, colIdx, opts) {
    opts = opts || {};
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var results = {}; // key → aoa[]
      wb.SheetNames.forEach(function (sn) {
        var sheet = wb.Sheets[sn];
        var aoa = C.sheetToArray(sheet);
        if (!aoa.length) return;
        var header = opts.hasHeader ? aoa[0] : null;
        var body = opts.hasHeader ? aoa.slice(1) : aoa;
        body.forEach(function (row) {
          var key = row[colIdx];
          if (key == null || key === '') key = '__空__';
          key = String(key);
          if (!results[key]) results[key] = header ? [header.slice()] : [];
          results[key].push(row.slice());
        });
      });
      // 每个 key 生成一个独立 workbook
      var outFiles = [];
      Object.keys(results).forEach(function (key) {
        var wb2 = XLSX.utils.book_new();
        var ws = C.aoaToSheet(results[key]);
        XLSX.utils.book_append_sheet(wb2, ws, '拆分结果');
        outFiles.push({ key: key, workbook: wb2, rowCount: results[key].length });
      });
      return outFiles;
    });
  }

  // ============== 去重 ==============
  function dedupe(file, colIdxArr, opts) {
    opts = opts || {};
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var wbOut = XLSX.utils.book_new();
      var totalRemoved = 0;
      wb.SheetNames.forEach(function (sn) {
        var aoa = C.sheetToArray(wb.Sheets[sn]);
        if (!aoa.length) return;
        var header = aoa[0];
        var body = aoa.slice(1);
        var seen = new Set();
        var kept = [header];
        body.forEach(function (row) {
          var key;
          if (colIdxArr && colIdxArr.length) {
            key = colIdxArr.map(function (c) { return String(row[c] != null ? row[c] : ''); }).join('\u0001');
          } else {
            key = row.map(function (c) { return String(c != null ? c : ''); }).join('\u0001');
          }
          if (!seen.has(key)) { seen.add(key); kept.push(row); }
          else totalRemoved++;
        });
        var ws = C.aoaToSheet(kept);
        XLSX.utils.book_append_sheet(wbOut, ws, sn);
      });
      return { workbook: wbOut, removed: totalRemoved };
    });
  }

  // ============== 清理空行空列 ==============
  function cleanEmpty(file) {
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var wbOut = XLSX.utils.book_new();
      var before = 0, after = 0;
      wb.SheetNames.forEach(function (sn) {
        var aoa = C.sheetToArray(wb.Sheets[sn]);
        before += aoa.length;
        // 清理空行
        var rows = aoa.filter(function (r) { return r.some(function (c) { return c !== '' && c != null; }); });
        // 清理空列
        if (rows.length) {
          var maxCols = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
          var nonEmptyCols = [];
          for (var c = 0; c < maxCols; c++) {
            for (var r = 0; r < rows.length; r++) {
              var v = rows[r][c];
              if (v !== '' && v != null) { nonEmptyCols.push(c); break; }
            }
          }
          rows = rows.map(function (row) { return nonEmptyCols.map(function (c) { return row[c]; }); });
        }
        after += rows.length;
        var ws = C.aoaToSheet(rows);
        XLSX.utils.book_append_sheet(wbOut, ws, sn);
      });
      return { workbook: wbOut, before: before, after: after };
    });
  }

  // ============== 跨表对比 ==============
  function compare(files, keyIdx) {
    return loadFiles(files).then(function (list) {
      // 每个文件第一个 sheet
      var maps = list.map(function (item) {
        var aoa = item.aoa;
        var header = aoa[0] || [];
        var m = new Map();
        for (var i = 1; i < aoa.length; i++) {
          var row = aoa[i];
          var key = String(row[keyIdx] != null ? row[keyIdx] : '');
          if (!m.has(key)) m.set(key, []);
          m.get(key).push({ row: row, sheet: item.sheetName, rowNum: i + 1 });
        }
        return { fileName: item.fileName, sheetName: item.sheetName, header: header, map: m };
      });
      var allKeys = new Set();
      maps.forEach(function (m) { m.map.forEach(function (_, k) { allKeys.add(k); }); });
      var diffRows = [];
      maps.forEach(function (m, idx) {
        var other = maps[idx === 0 ? 1 : 0];
        if (!other) return;
        m.map.forEach(function (val, k) {
          var o = other.map.get(k);
          if (!o) {
            diffRows.push(['仅存在于 ' + m.fileName, k, JSON.stringify(val[0].row)]);
          } else {
            // 比较字段
            for (var i = 0; i < val[0].row.length; i++) {
              if (String(val[0].row[i]) !== String(o[0].row[i])) {
                diffRows.push(['字段差异', k, '列 ' + (i + 1) + '(' + (m.header[i] || '') + '): ' + val[0].row[i] + ' ≠ ' + o[0].row[i]]);
              }
            }
          }
        });
      });
      var wb = XLSX.utils.book_new();
      var header = ['类型', '关键字', '说明'];
      var body = diffRows.length ? diffRows : [['（无差异）', '', '']];
      var ws = C.aoaToSheet([header].concat(body));
      XLSX.utils.book_append_sheet(wb, ws, '对比结果');
      return { workbook: wb, diffCount: diffRows.length };
    });
  }

  // ============== 一维/二维互转 ==============
  // 一维 (3列：行、列、值) → 二维矩阵
  function pivotLongToWide(file, sheetIdx) {
    sheetIdx = sheetIdx || 0;
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var sn = wb.SheetNames[sheetIdx];
      var aoa = C.sheetToArray(wb.Sheets[sn]);
      if (aoa.length < 2) throw new Error('数据不足');
      var rows = new Set(), cols = new Set();
      var map = {};
      for (var i = 1; i < aoa.length; i++) {
        var r = String(aoa[i][0]), c = String(aoa[i][1]), v = aoa[i][2];
        rows.add(r); cols.add(c);
        map[r + '|' + c] = v;
      }
      var rowArr = Array.from(rows), colArr = Array.from(cols);
      var out = [[''].concat(colArr)];
      rowArr.forEach(function (r) {
        var row = [r];
        colArr.forEach(function (c) { row.push(map[r + '|' + c] != null ? map[r + '|' + c] : ''); });
        out.push(row);
      });
      var wb2 = XLSX.utils.book_new();
      var ws = C.aoaToSheet(out);
      XLSX.utils.book_append_sheet(wb2, ws, '透视结果');
      return { workbook: wb2 };
    });
  }

  // 二维矩阵 → 一维三列
  function pivotWideToLong(file, sheetIdx) {
    sheetIdx = sheetIdx || 0;
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var sn = wb.SheetNames[sheetIdx];
      var aoa = C.sheetToArray(wb.Sheets[sn]);
      if (aoa.length < 2) throw new Error('数据不足');
      var header = aoa[0];
      var out = [['行标识', '列标识', '值']];
      for (var r = 1; r < aoa.length; r++) {
        var rowName = aoa[r][0];
        for (var c = 1; c < header.length; c++) {
          out.push([rowName, header[c], aoa[r][c] != null ? aoa[r][c] : '']);
        }
      }
      var wb2 = XLSX.utils.book_new();
      var ws = C.aoaToSheet(out);
      XLSX.utils.book_append_sheet(wb2, ws, '逆透视结果');
      return { workbook: wb2 };
    });
  }

  // ============== 行列转置 ==============
  function transpose(file) {
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var wbOut = XLSX.utils.book_new();
      wb.SheetNames.forEach(function (sn) {
        var aoa = C.sheetToArray(wb.Sheets[sn]);
        if (!aoa.length) return;
        var maxCols = aoa.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
        var out = [];
        for (var c = 0; c < maxCols; c++) {
          var row = [];
          for (var r = 0; r < aoa.length; r++) {
            row.push(aoa[r][c] != null ? aoa[r][c] : '');
          }
          out.push(row);
        }
        var ws = C.aoaToSheet(out);
        XLSX.utils.book_append_sheet(wbOut, ws, sn);
      });
      return { workbook: wbOut };
    });
  }

  // ============== 空单元格向下填充 (FillDown) ==============
  function fillBlank(file, colIdx, opts) {
    opts = opts || {};
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var wbOut = XLSX.utils.book_new();
      var changed = 0;
      wb.SheetNames.forEach(function (sn) {
        var aoa = C.sheetToArray(wb.Sheets[sn]);
        if (!aoa.length) return;
        var startIdx = 0;
        if (opts.useHeader) startIdx = 1;
        var maxCols = aoa[0].length;
        // 对每一列从 startIdx 开始往下 fill down
        var cols = colIdx && colIdx.length ? colIdx : [];
        for (var c = 0; c < maxCols; c++) {
          if (cols.length && cols.indexOf(c) === -1) continue;
          var last = null;
          for (var r = startIdx; r < aoa.length; r++) {
            var v = aoa[r][c];
            if (v == null || v === '') {
              if (last != null) { aoa[r][c] = last; changed++; }
            } else {
              last = v;
            }
          }
        }
        var ws = C.aoaToSheet(aoa);
        XLSX.utils.book_append_sheet(wbOut, ws, sn);
      });
      return { workbook: wbOut, filled: changed };
    });
  }

  // ============== 删除指定列 / 行范围 ==============
  function rowStrip(file, opts) {
    opts = opts || {};
    // opts.stripCols: array of 0-based column indices
    // opts.stripRows: array of row numbers (1-based, inclusive, or range "1-3,5,10-15")
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var wbOut = XLSX.utils.book_new();
      var removedRows = 0, removedCols = 0;
      var removeRowsSet = null;
      if (opts.stripRows && opts.stripRows.length) {
        removeRowsSet = new Set();
        opts.stripRows.forEach(function (n) { removeRowsSet.add(n); });
      }
      wb.SheetNames.forEach(function (sn) {
        var aoa = C.sheetToArray(wb.Sheets[sn]);
        if (!aoa.length) return;
        // 先删列
        if (opts.stripCols && opts.stripCols.length) {
          var sortedCols = opts.stripCols.slice().sort(function (a, b) { return a - b; });
          for (var r = 0; r < aoa.length; r++) {
            var newRow = [];
            for (var c = 0, nextIdx = 0; c < aoa[r].length; c++) {
              if (nextIdx < sortedCols.length && sortedCols[nextIdx] === c) {
                nextIdx++;
                removedCols++;
              } else {
                newRow.push(aoa[r][c]);
              }
            }
            aoa[r] = newRow;
          }
        }
        // 再删行
        if (removeRowsSet) {
          var newAoa = [];
          for (var r = 0; r < aoa.length; r++) {
            // row 编号从 1 开始（匹配用户填写）
            if (removeRowsSet.has(r + 1)) {
              removedRows++;
            } else {
              newAoa.push(aoa[r]);
            }
          }
          aoa = newAoa;
        }
        var ws = C.aoaToSheet(aoa);
        XLSX.utils.book_append_sheet(wbOut, ws, sn);
      });
      return { workbook: wbOut, removedRows: removedRows, removedCols: removedCols };
    });
  }

  // ============== 一维→二维（带分组列、维度列、数值列） ==============
  function pivotLongToWide2(file, opts) {
    opts = opts || {};
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var sn = wb.SheetNames[0];
      var aoa = C.sheetToArray(wb.Sheets[sn]);
      if (aoa.length < 2) throw new Error('数据不足');
      var header = aoa[0];
      var groupIdx = opts.groupCols || [0];
      var dimIdx = opts.dimCol != null ? opts.dimCol : 1;
      var valIdx = opts.valCol != null ? opts.valCol : 2;

      // 收集所有维度值（唯一、保持出现顺序）
      var dimVals = [];
      var seen = new Set();
      for (var r = 1; r < aoa.length; r++) {
        var d = String(aoa[r][dimIdx]);
        if (!seen.has(d)) { seen.add(d); dimVals.push(d); }
      }

      // 输出表头：分组列 + 各维度值
      var out = [];
      var headerRow = [];
      for (var g = 0; g < groupIdx.length; g++) headerRow.push(header[groupIdx[g]] || ('分组' + (g + 1)));
      for (var dv = 0; dv < dimVals.length; dv++) headerRow.push(dimVals[dv]);
      out.push(headerRow);

      // 按分组列聚合
      var groupMap = new Map();
      for (var r = 1; r < aoa.length; r++) {
        var key = groupIdx.map(function (i) { return String(aoa[r][i] != null ? aoa[r][i] : ''); }).join('|');
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key).push(r);
      }
      groupMap.forEach(function (rowNums, key) {
        var firstRow = aoa[rowNums[0]];
        var row = groupIdx.map(function (i) { return firstRow[i]; });
        var rowVals = new Array(dimVals.length).fill('');
        for (var ri = 0; ri < rowNums.length; ri++) {
          var rIdx = rowNums[ri];
          var dval = String(aoa[rIdx][dimIdx]);
          var pos = dimVals.indexOf(dval);
          if (pos >= 0) rowVals[pos] = aoa[rIdx][valIdx];
        }
        out.push(row.concat(rowVals));
      });

      var wb2 = XLSX.utils.book_new();
      var ws = C.aoaToSheet(out);
      XLSX.utils.book_append_sheet(wb2, ws, '透视结果');
      return { workbook: wb2, aoa: out };
    });
  }

  // ============== 查找替换 ==============
  function replaceText(file, opts) {
    opts = opts || {};
    var search = opts.search;
    var replacement = opts.replacement == null ? '' : String(opts.replacement);
    var useRegex = !!opts.useRegex;
    var ignoreCase = !!opts.ignoreCase;
    var targetCols = opts.cols && opts.cols.length ? opts.cols.slice() : null; // null 代表所有列
    if (search == null || String(search) === '') throw new Error('请输入要查找的内容');
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var wbOut = XLSX.utils.book_new();
      var changed = 0;
      wb.SheetNames.forEach(function (sn) {
        var aoa = C.sheetToArray(wb.Sheets[sn]);
        for (var r = 0; r < aoa.length; r++) {
          for (var c = 0; c < aoa[r].length; c++) {
            if (targetCols && targetCols.indexOf(c) < 0) continue;
            var v = aoa[r][c];
            if (v == null || v === '') continue;
            var str = String(v);
            var newStr;
            if (useRegex) {
              try {
                var re = new RegExp(search, ignoreCase ? 'gi' : 'g');
                newStr = str.replace(re, replacement);
              } catch (e) { newStr = str; }
            } else {
              if (ignoreCase) {
                // 大小写不敏感的非正则替换
                var lower = str.toLowerCase();
                var sLower = String(search).toLowerCase();
                var idx = 0;
                var out = '';
                var pos;
                while ((pos = lower.indexOf(sLower, idx)) >= 0) {
                  out += str.substring(idx, pos) + replacement;
                  idx = pos + sLower.length;
                }
                out += str.substring(idx);
                newStr = out;
              } else {
                newStr = str.split(search).join(replacement);
              }
            }
            if (newStr !== str) {
              aoa[r][c] = newStr;
              changed++;
            }
          }
        }
        var ws = C.aoaToSheet(aoa);
        XLSX.utils.book_append_sheet(wbOut, ws, sn);
      });
      return { workbook: wbOut, changed: changed };
    });
  }

  // ============== 数值四舍五入 ==============
  function roundNumbers(file, opts) {
    opts = opts || {};
    var digits = opts.digits == null ? 2 : (opts.digits | 0);
    var targetCols = opts.cols && opts.cols.length ? opts.cols.slice() : null;
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var wbOut = XLSX.utils.book_new();
      var changed = 0;
      var factor = Math.pow(10, digits);
      wb.SheetNames.forEach(function (sn) {
        var aoa = C.sheetToArray(wb.Sheets[sn]);
        for (var r = 0; r < aoa.length; r++) {
          for (var c = 0; c < aoa[r].length; c++) {
            if (targetCols && targetCols.indexOf(c) < 0) continue;
            var v = aoa[r][c];
            if (v == null || v === '' || v instanceof Date) continue;
            if (typeof v === 'number') {
              aoa[r][c] = Math.round(v * factor) / factor;
              changed++;
            } else if (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim())) {
              var n = parseFloat(v);
              if (!isNaN(n)) {
                aoa[r][c] = Math.round(n * factor) / factor;
                changed++;
              }
            }
          }
        }
        var ws = C.aoaToSheet(aoa);
        XLSX.utils.book_append_sheet(wbOut, ws, sn);
      });
      return { workbook: wbOut, changed: changed };
    });
  }

  // ============== 大小写转换 ==============
  function changeCase(file, opts) {
    opts = opts || {};
    // 'upper' / 'lower' / 'title' / 'cap'
    var mode = opts.mode || 'upper';
    var targetCols = opts.cols && opts.cols.length ? opts.cols.slice() : null;
    return C.readAsBuffer(file).then(function (buf) {
      var wb = C.readWorkbook(buf);
      var wbOut = XLSX.utils.book_new();
      var changed = 0;
      wb.SheetNames.forEach(function (sn) {
        var aoa = C.sheetToArray(wb.Sheets[sn]);
        for (var r = 0; r < aoa.length; r++) {
          for (var c = 0; c < aoa[r].length; c++) {
            if (targetCols && targetCols.indexOf(c) < 0) continue;
            var v = aoa[r][c];
            if (v == null || v === '' || typeof v !== 'string') continue;
            var nv;
            switch (mode) {
              case 'lower': nv = v.toLowerCase(); break;
              case 'upper': nv = v.toUpperCase(); break;
              case 'title': nv = v.replace(/\w\S*/g, function (w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); }); break;
              case 'cap': nv = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase(); break;
              default: nv = v;
            }
            if (nv !== v) { aoa[r][c] = nv; changed++; }
          }
        }
        var ws = C.aoaToSheet(aoa);
        XLSX.utils.book_append_sheet(wbOut, ws, sn);
      });
      return { workbook: wbOut, changed: changed };
    });
  }

  global.__DATA = {
    loadFiles: loadFiles,
    merge: mergeFiles,
    splitByCol: splitByCol,
    dedupe: dedupe,
    cleanEmpty: cleanEmpty,
    compare: compare,
    transpose: transpose,
    fillBlank: fillBlank,
    rowStrip: rowStrip,
    pivotLongToWide: pivotLongToWide,
    pivotLongToWide2: pivotLongToWide2,
    pivotWideToLong: pivotWideToLong,
    replaceText: replaceText,
    roundNumbers: roundNumbers,
    changeCase: changeCase
  };
})(window);
