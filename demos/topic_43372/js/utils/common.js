/* ============================================================
 * common.js  通用工具函数
 * 提供：日志上报（仅行为）、Toast、文件读取、下载、格式化
 * ============================================================ */
(function (global) {
  'use strict';

  var __ = {
    /* ---------- Toast ---------- */
    toast: function (msg, type) {
      var c = document.getElementById('toast-container');
      if (!c) return;
      var el = document.createElement('div');
      el.className = 'toast ' + (type || '');
      el.textContent = msg;
      c.appendChild(el);
      setTimeout(function () {
        el.style.opacity = '0';
        el.style.transition = 'opacity .3s';
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
      }, 2400);
    },

    /* ---------- 文件大小格式化 ---------- */
    fmtSize: function (n) {
      if (n == null) return '-';
      var u = ['B', 'KB', 'MB', 'GB'], i = 0;
      while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
      return n.toFixed(i === 0 ? 0 : 1) + ' ' + u[i];
    },

    /* ---------- 读取文件为 ArrayBuffer（异步）---------- */
    readAsBuffer: function (file) {
      return new Promise(function (resolve, reject) {
        var r = new FileReader();
        r.onload = function () { resolve(r.result); };
        r.onerror = function () { reject(new Error('文件读取失败')); };
        r.readAsArrayBuffer(file);
      });
    },

    /* ---------- 读取文件为文本 ---------- */
    readAsText: function (file, enc) {
      return new Promise(function (resolve, reject) {
        var r = new FileReader();
        r.onload = function () { resolve(r.result); };
        r.onerror = reject;
        r.readAsText(file, enc || 'UTF-8');
      });
    },

    /* ---------- 触发下载（Blob / Base64）---------- */
    downloadBlob: function (blob, filename) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename || 'download.bin';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    },

    downloadBase64: function (b64, mimeType, filename) {
      var blob;
      try {
        var bytes = atob(b64);
        var buf = new Uint8Array(bytes.length);
        for (var i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
        blob = new Blob([buf], { type: mimeType });
      } catch (e) {
        __.toast('导出失败：' + e.message, 'error');
        return;
      }
      __.downloadBlob(blob, filename);
    },

    /* ---------- 日期格式化 ---------- */
    formatDate: function (value, fmt) {
      var d;
      if (value instanceof Date) d = value;
      else if (typeof value === 'number') d = new Date(Math.round((value - 25569) * 86400 * 1000)); // Excel serial
      else if (typeof value === 'string') d = new Date(value.replace(/\//g, '-'));
      else return value;
      if (isNaN(d.getTime())) return value;
      var y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
      m = m < 10 ? '0' + m : '' + m;
      day = day < 10 ? '0' + day : '' + day;
      return (fmt || 'yyyy-mm-dd')
        .replace('yyyy', y)
        .replace('mm', m)
        .replace('dd', day);
    },

    /* ---------- 列字母/索引互转 ---------- */
    colLetterToIndex: function (letters) {
      if (!letters) return -1;
      letters = letters.toUpperCase().replace(/\s/g, '');
      var n = 0;
      for (var i = 0; i < letters.length; i++) {
        var c = letters.charCodeAt(i);
        if (c < 65 || c > 90) return -1;
        n = n * 26 + (c - 64);
      }
      return n - 1;
    },

    colIndexToLetter: function (idx) {
      idx = idx | 0;
      var s = '';
      while (idx >= 0) {
        s = String.fromCharCode(65 + (idx % 26)) + s;
        idx = Math.floor(idx / 26) - 1;
      }
      return s;
    },

    /* ---------- 用户输入"列名/列字母"→索引 ---------- */
    resolveColIndex: function (input, headerRow) {
      if (!input) return -1;
      input = input.trim();
      // 纯字母
      if (/^[A-Za-z]+$/.test(input)) {
        return __.colLetterToIndex(input);
      }
      // 数字
      if (/^\d+$/.test(input)) {
        var n = parseInt(input, 10);
        if (n >= 1) return n - 1;
      }
      // 当作表头名
      if (Array.isArray(headerRow)) {
        for (var i = 0; i < headerRow.length; i++) {
          if (String(headerRow[i]).trim() === input) return i;
        }
      }
      return -1;
    },

    /* ---------- 下载文件名替换非法字符 ---------- */
    safeFilename: function (name) {
      return (name || 'file').replace(/[\\\/:*?"<>|\r\n\t]+/g, '_');
    },

    /* ---------- 时间戳文件名 ---------- */
    ts: function () {
      var d = new Date();
      function p(n) { return n < 10 ? '0' + n : '' + n; }
      return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
    },

    /* ---------- 简易日志上报（仅动作，不上传文件数据）---------- */
    report: function (action, meta) {
      try {
        // 仅打印到 console，不做任何真实上报
        console.log('[action]', action, meta || '');
      } catch (e) {}
    },

    /* ---------- 等待 SheetJS 就绪（SheetJS 已通过 <script src> 同步加载）---------- */
    waitXLSX: function (timeout) {
      timeout = timeout || 2000;
      return new Promise(function (resolve) {
        if (typeof XLSX !== 'undefined') {
          resolve(true);
          return;
        }
        // 尚未加载，间隔检查
        var start = Date.now();
        (function check() {
          if (typeof XLSX !== 'undefined') { resolve(true); return; }
          if (Date.now() - start > timeout) { resolve(false); return; }
          setTimeout(check, 100);
        })();
      });
    },

    /* ---------- 解析工作簿（统一入口，支持 ArrayBuffer/Blob/File）---------- */
    readWorkbook: function (buf) {
      if (typeof XLSX === 'undefined') throw new Error('SheetJS 未加载');
      return XLSX.read(buf, { type: 'array', cellDates: true });
    },

    /* ---------- sheet 转二维数组（含空单元格）---------- */
    sheetToArray: function (sheet) {
      if (!sheet || !sheet['!ref']) return [];
      return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    },

    /* ---------- sheet 转对象数组 ---------- */
    sheetToObjects: function (sheet) {
      if (!sheet || !sheet['!ref']) return [];
      return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    },

    /* ---------- 生成 sheet ---------- */
    aoaToSheet: function (aoa) { return XLSX.utils.aoa_to_sheet(aoa); },
    jsonToSheet: function (arr) { return XLSX.utils.json_to_sheet(arr); },

    /* ---------- 导出 workbook ---------- */
    writeWorkbook: function (wb, bookType, filename) {
      var out = XLSX.write(wb, { type: 'base64', bookType: bookType || 'xlsx', bookSST: false });
      var mime = { xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xls: 'application/vnd.ms-excel', csv: 'text/csv', ods: 'application/vnd.oasis.opendocument.spreadsheetml' };
      __.downloadBase64(out, mime[bookType] || mime.xlsx, filename || ('export_' + __.ts() + '.' + (bookType || 'xlsx')));
    },

    /* ---------- ArrayBuffer → Base64 ---------- */
    arrayBufferToBase64: function (buf) {
      var bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
      var binary = '';
      for (var i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
  };

  global.__C = __;
})(window);
