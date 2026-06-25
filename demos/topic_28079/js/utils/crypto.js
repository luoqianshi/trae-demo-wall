/* ============================================================
 * crypto.js  Excel 加解密核心
 *
 * 【移除编辑保护】
 *   1. 用 JSZip 读取 xlsx（ZIP 包）
 *   2. 在 xl/worksheets/sheet*.xml 中删除 <sheetProtection ... />
 *   3. 在 xl/workbook.xml 中删除 <workbookProtection ... />
 *   4. 用 JSZip 重新打包输出
 *
 * 【暴力穷举打开密码】
 *   1. 用 SheetJS XLSX.read(buf, {password}) 逐个尝试
 *   2. 支持：数字 / 大小写字母 / 常用符号 / 自定义字符集 / 字典文件
 *   3. 可暂停 / 终止
 *
 * 【加密检测】
 *   - OOXML 加密包含 EncryptedPackage / EncryptionInfo
 *   - 旧版 XLS 二进制加密：尝试 XLSX.read 抛加密错误即判定为加密
 *
 * ============================================================ */
(function (global) {
  'use strict';

  /* ---------- 全局引用（等待 SheetJS + JSZip 就绪）---------- */
  var _XLSX = null;
  var _JSZip = null;

  function waitDeps(timeout) {
    timeout = timeout || 10000;
    return new Promise(function (resolve) {
      var start = Date.now();
      (function tick() {
        _XLSX = typeof XLSX !== 'undefined' ? XLSX : null;
        _JSZip = typeof JSZip !== 'undefined' ? JSZip : null;
        if (_XLSX) {
          if (_JSZip) { resolve(true); return; }
          if (!window.__jszipLoading) {
            window.__jszipLoading = true;
            console.log('Loading JSZip for crypto...');
            var s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
            s.onload = function () { _JSZip = JSZip; resolve(true); };
            s.onerror = function () { _JSZip = null; resolve(true); };
            document.head.appendChild(s);
          } else {
            if (Date.now() - start > timeout) { resolve(true); return; }
            setTimeout(tick, 200);
          }
          return;
        }
        if (Date.now() - start > timeout) { resolve(false); return; }
        setTimeout(tick, 80);
      })();
    });
  }

  /* ---------- 检测文件是否加密 ---------- */
  function isEncrypted(buf) {
    if (!_XLSX) return false;
    // 方法1: 解析 ZIP 结构查找加密标识（更可靠，避免 false negative）
    try {
      if (buf && (buf.byteLength || buf.length)) {
        var view = new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer || buf, 0, Math.min(4, buf.byteLength || buf.length));
        // PK\x03\x04 或 PK\x05\x06 都是 ZIP
        if (view[0] === 0x50 && view[1] === 0x4b) {
          // 扫描 Central Directory，查找 entry 名包含 "EncryptedPackage" 或 "EncryptionInfo"
          var bytes = new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer || buf);
          var len = bytes.length;
          // 从尾部找 EOCD 签名
          var eocd = -1;
          for (var i = Math.max(0, len - 2048); i < len - 22; i++) {
            if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) {
              eocd = i; break;
            }
          }
          if (eocd >= 0) {
            var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
            var cdOff = dv.getUint32(eocd + 16, true);
            var cdSize = dv.getUint32(eocd + 12, true);
            var cdEnd = cdOff + cdSize;
            var p = cdOff;
            while (p < cdEnd && p + 46 <= len) {
              if (dv.getUint32(p, true) !== 0x02014b50) break;
              var nameLen = dv.getUint16(p + 28, true);
              var extraLen = dv.getUint16(p + 30, true);
              var commentLen = dv.getUint16(p + 32, true);
              var name = '';
              for (var ci = 0; ci < nameLen; ci++) {
                name += String.fromCharCode(bytes[p + 46 + ci]);
              }
              var lower = name.toLowerCase();
              if (lower.indexOf('encryptedpackage') >= 0 || lower.indexOf('encryptioninfo') >= 0) {
                return true;
              }
              p += 46 + nameLen + extraLen + commentLen;
            }
          }
        }
      }
    } catch (e) { /* ignore */ }

    // 方法2: 尝试 SheetJS 读取，若报错包含 password/encrypted 则为加密
    try {
      var wb = _XLSX.read(buf, { type: 'array' });
      return false; // 能读 => 未加密（或只是 edit protection，不影响打开）
    } catch (e) {
      var msg = String(e.message || '').toLowerCase();
      return msg.indexOf('password') >= 0 || msg.indexOf('encrypted') >= 0 || msg.indexOf('encrypt') >= 0 || msg.indexOf('pass') >= 0;
    }
  }

  /* ---------- 移除编辑保护 ---------- */
  function removeProtection(buf) {
    if (!_XLSX || !_JSZip) {
      return Promise.reject(new Error('SheetJS 或 JSZip 未加载'));
    }
    return _JSZip.loadAsync(buf).then(function (zip) {
      var changed = false;
      var tasks = [];

      zip.forEach(function (path, file) {
        if (file.dir) return;
        var pl = path.toLowerCase();

        if (/^xl\/worksheets\/sheet[^\/]*\.xml$/i.test(pl) || /^xl\/workbook\.xml$/i.test(pl)) {
          tasks.push(
            file.async('string').then(function (content) {
              var reSelf = /<(sheetProtection|workbookProtection)\b[^>]*?\/>/gi;
              var reBlock = /<(sheetProtection|workbookProtection)\b[^>]*?>[\s\S]*?<\/(sheetProtection|workbookProtection)>/gi;
              var newContent = content.replace(reBlock, '').replace(reSelf, '');
              if (newContent !== content) {
                zip.file(path, newContent);
                changed = true;
              }
            })
          );
        }
      });

      return Promise.all(tasks).then(function () {
        if (!changed) return { changed: false };
        return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } })
          .then(function (bytes) { return { changed: true, bytes: bytes }; });
      });
    });
  }

  /* ---------- 用密码尝试打开（SheetJS 原生）---------- */
  function tryDecrypt(buf, password) {
    if (!_XLSX) throw new Error('SheetJS 未加载');
    try {
      var wb = _XLSX.read(buf, { type: 'array', password: String(password) });
      return { password: String(password), workbook: wb };
    } catch (e) {
      return null;
    }
  }

  /* ---------- 字符集 ---------- */
  var CHARSET = {
    digits: '0123456789',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    common: '!@#$%^&*()-_=+[]{};:,.<>/?`~|',
    space: ' '
  };

  function getCharset(flags) {
    if (flags == null) return CHARSET.digits;
    if (typeof flags === 'string') {
      // 自定义字符集字符串（含非关键字则直接当作字符集）
      var knownKeys = ['digits', 'lower', 'upper', 'common', 'space'];
      var parts = flags.split(/[,，\s]+/).filter(Boolean);
      var isAllKeys = parts.every(function (p) { return knownKeys.indexOf(p.toLowerCase()) >= 0; });
      if (isAllKeys && parts.length) {
        var out = '';
        parts.forEach(function (p) { if (CHARSET[p.toLowerCase()]) out += CHARSET[p.toLowerCase()]; });
        return out || CHARSET.digits;
      }
      return flags; // 自定义字符集
    }
    if (Array.isArray(flags)) {
      var s = '';
      flags.forEach(function (k) {
        if (CHARSET[k]) s += CHARSET[k];
      });
      return s || CHARSET.digits;
    }
    if (typeof flags === 'object') {
      var s2 = '';
      for (var k in flags) if (flags[k]) { if (CHARSET[k]) s2 += CHARSET[k]; }
      return s2 || CHARSET.digits;
    }
    return CHARSET.digits;
  }

  /* ---------- 通用：根据候选数生成密码（先短后长）---------- */
  function passwordFromIndex(index, minLen, maxLen, charset) {
    var base = charset.length;
    var remaining = index;
    for (var len = minLen; len <= maxLen; len++) {
      var size = Math.pow(base, len);
      if (remaining < size) {
        var out = '';
        var v = remaining;
        for (var i = 0; i < len; i++) {
          out = charset.charAt(v % base) + out;
          v = Math.floor(v / base);
        }
        return out;
      }
      remaining -= size;
    }
    return null;
  }

  function countCandidates(minLen, maxLen, charset) {
    minLen = Math.max(1, minLen | 0);
    maxLen = Math.max(minLen, maxLen | 0);
    charset = charset || CHARSET.digits;
    var base = charset.length;
    var total = 0;
    for (var len = minLen; len <= maxLen; len++) total += Math.pow(base, len);
    return total;
  }

  /* ---------- 简单的 iterator（数字向后兼容）---------- */
  function bruteIterator(minLen, maxLen, charset) {
    charset = charset || CHARSET.digits;
    var total = countCandidates(minLen, maxLen, charset);
    var i = 0;
    return {
      next: function () {
        if (i >= total) return { done: true, value: null };
        return { done: false, value: passwordFromIndex(i++, minLen, maxLen, charset) };
      },
      total: total
    };
  }

  /* ---------- 字典穷举：传入字符串数组 ---------- */
  function dictionaryIterator(list) {
    var i = 0;
    var seen = {};
    var deduped = [];
    for (var k = 0; k < list.length; k++) {
      var v = String(list[k] == null ? '' : list[k]).trim();
      if (!v) continue;
      if (seen[v]) continue;
      seen[v] = true;
      deduped.push(v);
    }
    return {
      next: function () {
        if (i >= deduped.length) return { done: true, value: null };
        return { done: false, value: deduped[i++] };
      },
      total: deduped.length
    };
  }

  function createBrutePool(opts) {
    opts = opts || {};
    var buf = opts.buf;
    var charset = opts.charset || CHARSET.digits;
    var minLen = Math.max(1, (opts.minLen | 0) || 1);
    var maxLen = Math.max(minLen, (opts.maxLen | 0) || 4);
    var wordlist = opts.wordlist || [];
    var onProgress = opts.onProgress || function () {};
    var onFound = opts.onFound || function () {};
    var onDone = opts.onDone || function () {};
    var onError = opts.onError || function () {};
    var onLog = opts.onLog || function () {};

    var state = { started: false, stopped: false, found: false, total: 0, tried: 0, startT: 0 };

    // 字典模式 vs 生成模式
    if (wordlist.length > 0) {
      state.total = wordlist.length;
    } else {
      state.total = countCandidates(minLen, maxLen, charset);
    }

    // ---------- 主线程分批穷举（不依赖 Worker，永远可用） ----------
    function runMainThread() {
      if (state.started) return;
      state.started = true;
      state.startT = Date.now();
      onLog(wordlist.length ? '字典穷举模式（' + state.total + ' 个候选）' : '生成穷举模式（' + charset.length + ' 字符集）');

      var iterCount = 0;
      var lastVal = null;
      var batchSize = wordlist.length ? Math.max(100, Math.min(1000, wordlist.length / 10)) : 100;

      function step() {
        if (state.stopped || state.found) return;
        var foundPwd = null;
        for (var i = 0; i < batchSize; i++) {
          var pwd;
          if (wordlist.length > 0) {
            if (iterCount >= wordlist.length) { foundPwd = 'done'; break; }
            pwd = wordlist[iterCount];
          } else {
            pwd = passwordFromIndex(iterCount, minLen, maxLen, charset);
            if (!pwd) { foundPwd = 'done'; break; }
          }
          lastVal = pwd;
          iterCount++;
          try {
            var wb = _XLSX.read(buf, { type: 'array', password: pwd });
            if (wb) { foundPwd = pwd; break; }
          } catch (e) { /* 继续 */ }
        }
        state.tried = iterCount;
        var elapsed = (Date.now() - state.startT) / 1000;
        var speed = elapsed > 0 ? Math.round(iterCount / elapsed) : 0;
        onProgress({ tried: iterCount, total: state.total, current: lastVal || '-', speed: speed });

        if (foundPwd && foundPwd !== 'done') {
          state.found = true;
          onFound(foundPwd);
          return;
        }
        if (foundPwd === 'done' || iterCount >= state.total) {
          onDone(iterCount);
          return;
        }
        setTimeout(step, 0);
      }
      step();
    }

    function _stopAll() {
      if (state.stopped) return;
      state.stopped = true;
      onLog('已停止');
    }

    return {
      start: function () {
        if (!buf) { onError('缺少文件数据'); return; }
        runMainThread();
      },
      stop: _stopAll,
      total: state.total
    };
  }

  /* ---------- 导出 ---------- */
  var __api = {
    waitDeps: waitDeps,
    isEncrypted: isEncrypted,
    removeProtection: removeProtection,
    tryDecrypt: tryDecrypt,
    charset: CHARSET,
    getCharset: getCharset,
    passwordFromIndex: passwordFromIndex,
    countCandidates: countCandidates,
    countCandidates2: countCandidates, // 别名（兼容旧调用）
    bruteIterator: bruteIterator,
    dictionaryIterator: dictionaryIterator,
    createBrutePool: createBrutePool
  };
  global.__CRYPTO = __api;
})(window);
