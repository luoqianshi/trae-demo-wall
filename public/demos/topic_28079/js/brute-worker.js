/* ============================================================
 * brute-worker.js  暴力穷举 Web Worker
 *
 * 入口消息：
 *   {
 *     type: 'start',
 *     buf: ArrayBuffer,            // Excel 文件二进制（可转换）
 *     charset: string,             // 字符集，例如 '0123456789'
 *     minLen: number,
 *     maxLen: number,
 *     rangeStart: number,          // 本次 worker 负责的起始索引（含）
 *     rangeEnd: number,            // 本次 worker 负责的结束索引（不含）
 *     chunkSize: number,           // 每批尝试的数量（影响进度消息频率）
 *     xlsxUrls: string[]           // SheetJS 的加载 URL（可选，默认 CDN）
 *   }
 *
 * 对外消息：
 *   { type: 'ready' }
 *   { type: 'log', text: string }
 *   { type: 'progress', tried: number, current: string, rangeStart, rangeEnd }
 *   { type: 'found', password: string }
 *   { type: 'done', tried: number }
 *   { type: 'error', message: string }
 *   { type: 'stopped' }
 * ============================================================ */
'use strict';

var STATE = {
  xlsxReady: false,
  running: false,
  stopFlag: false,
  buf: null,
  charset: '',
  minLen: 1,
  maxLen: 4,
  rangeStart: 0,
  rangeEnd: 0,
  chunkSize: 1000,
  wordlist: null // 字典模式：若存在，优先使用字典
};

/* ---------- SheetJS 加载（Worker 内，15 秒超时）---------- */
var loadTimeout = setTimeout(function () {
  self.postMessage({ type: 'error', message: 'SheetJS 加载超时（网络问题），请用 HTTP 服务器打开页面，或使用 Node.js 模式' });
}, 15000);

(function loadSheetJS() {
  if (typeof XLSX !== 'undefined') {
    clearTimeout(loadTimeout);
    STATE.xlsxReady = true;
    self.postMessage({ type: 'ready' });
    return;
  }
  var urls = [
    'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
  ];
  var i = 0;
  function tryLoad() {
    if (i >= urls.length) {
      clearTimeout(loadTimeout);
      self.postMessage({ type: 'error', message: 'SheetJS CDN 全部加载失败。请用 HTTP 服务器打开页面，或使用 Node.js 模式。' });
      return;
    }
    try {
      importScripts(urls[i]);
      if (typeof XLSX !== 'undefined') {
        clearTimeout(loadTimeout);
        STATE.xlsxReady = true;
        self.postMessage({ type: 'ready' });
      } else {
        i++; tryLoad();
      }
    } catch (e) {
      i++; tryLoad();
    }
  }
  tryLoad();
})();

/* ---------- 根据索引生成密码（与主线程算法一致）---------- */
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

/* ---------- 尝试解密 ---------- */
function tryDecrypt(bufUint8, password) {
  try {
    // XLSX.read 支持 Uint8Array / ArrayBuffer / string
    var wb = XLSX.read(bufUint8, { type: 'array', password: password });
    return wb != null;
  } catch (e) {
    return false;
  }
}

/* ---------- 主循环 ---------- */
function run() {
  if (STATE.stopFlag) {
    self.postMessage({ type: 'stopped' });
    return;
  }
  var buf = STATE.buf; // Uint8Array
  var charset = STATE.charset;
  var start = STATE.rangeStart;
  var end = STATE.rangeEnd;
  var chunk = STATE.chunkSize;
  var wordlist = STATE.wordlist;

  var tried = 0;
  var current = '';
  var totalInRange = end - start;

  // 使用分段 setTimeout 以支持中途停止并释放少量调度
  function tick(pos) {
    if (STATE.stopFlag) {
      self.postMessage({ type: 'stopped' });
      return;
    }
    var segEnd = Math.min(pos + chunk, end);
    var foundPwd = null;
    if (wordlist && wordlist.length) {
      // 字典模式
      for (var i2 = pos; i2 < segEnd; i2++) {
        var pwd2 = wordlist[i2];
        if (pwd2 == null || pwd2 === '') continue;
        current = pwd2;
        if (tryDecrypt(buf, pwd2)) {
          foundPwd = pwd2;
          tried = i2 - start + 1;
          break;
        }
      }
    } else {
      for (var idx = pos; idx < segEnd; idx++) {
        var pwd = passwordFromIndex(idx, STATE.minLen, STATE.maxLen, charset);
        if (pwd == null) break;
        current = pwd;
        if (tryDecrypt(buf, pwd)) {
          foundPwd = pwd;
          tried = idx - start + 1;
          break;
        }
      }
    }
    if (foundPwd != null) {
      self.postMessage({ type: 'found', password: foundPwd });
      return;
    }
    tried = segEnd - start;
    self.postMessage({
      type: 'progress',
      tried: tried,
      current: current,
      rangeStart: start,
      rangeEnd: end,
      totalInRange: totalInRange
    });
    if (segEnd >= end) {
      self.postMessage({ type: 'done', tried: tried });
      return;
    }
    setTimeout(function () { tick(segEnd); }, 0);
  }
  tick(start);
}

/* ---------- 消息处理 ---------- */
self.addEventListener('message', function (e) {
  var msg = e.data || {};
  if (msg.type === 'start') {
    if (!STATE.xlsxReady) {
      self.postMessage({ type: 'error', message: 'SheetJS 未就绪，请稍后重试' });
      return;
    }
    // 接收文件数据：msg.buf 应为 ArrayBuffer；转为 Uint8Array 使用
    var ab = msg.buf;
    if (!ab) {
      self.postMessage({ type: 'error', message: '缺少文件数据' });
      return;
    }
    STATE.buf = new Uint8Array(ab);
    STATE.charset = String(msg.charset || '0123456789');
    STATE.minLen = Math.max(1, (msg.minLen | 0) || 1);
    STATE.maxLen = Math.max(STATE.minLen, (msg.maxLen | 0) || 4);
    STATE.rangeStart = Math.max(0, (msg.rangeStart | 0) || 0);
    STATE.rangeEnd = Math.max(STATE.rangeStart, (msg.rangeEnd | 0) || 0);
    STATE.chunkSize = Math.max(100, (msg.chunkSize | 0) || 1000);
    STATE.wordlist = (Array.isArray(msg.wordlist) && msg.wordlist.length) ? msg.wordlist.slice() : null;
    STATE.stopFlag = false;
    STATE.running = true;
    run();
    return;
  }
  if (msg.type === 'stop') {
    STATE.stopFlag = true;
    return;
  }
  if (msg.type === 'ping') {
    self.postMessage({ type: 'pong', ready: STATE.xlsxReady });
  }
});
