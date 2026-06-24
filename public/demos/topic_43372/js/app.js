/* ============================================================
 * app.js  表速达主应用逻辑
 * 视图切换 + 四大模块所有功能事件绑定
 * ============================================================ */
(function (global) {
  'use strict';
  var C = global.__C;

  // ============== FAQ 数据 ==============
  var FAQ_DATA = [
    { q: '本工具是否会把我的 Excel 上传到服务器？', a: '不会。所有解析、处理均在您本机浏览器内存中完成，不会向任何后端提交原始文件或数据。SheetJS/JSZip 首次加载时会请求 CDN（可本地保存后离线使用）。' },
    { q: '为什么移除编辑保护时文件大小会有变化？', a: '重新打包了 OOXML 压缩包，移除了 <sheetProtection> / <workbookProtection> 节点；压缩率差异导致文件大小略有不同，内容完全一致。' },
    { q: '暴力穷举能破解什么样的密码？', a: '仅能尝试 1~10 位数字。现代 Excel 使用 AES 强加密，无论数字/字母/组合，如果密码超过一定长度，理论上不可能在浏览器内破解。' },
    { q: '为什么"已加密"的文件 SheetJS 仍能打开？', a: '文件"设置了打开密码"才是真正的加密文件；工作表保护、工作簿保护、单元格锁定都不是真正的加密，可直接移除。' },
    { q: '批量合并时表头不一致怎么办？', a: '勾选"首行为表头"后以第一个文件的表头为准，其它文件按列位置合并。建议先统一列顺序，或使用"不识别表头"模式合并全部行。' },
    { q: '按列拆分后，为什么有些列为空？', a: '若该列存在空值，空值会被归类到名为 "__空__" 的分组文件中，便于识别未填写该字段的行。' },
    { q: '跨表对比时必须上传两个文件吗？', a: '是的，跨表对比至少需要两个文件（或一个文件的两个 sheet）。基准列建议选择唯一标识列，如"工号""订单号"等。' },
    { q: 'CSV 导入乱码怎么处理？', a: '请确认 CSV 保存为 UTF-8 编码；Excel 默认另存为 CSV 是 GBK 编码。您可以使用辅助工具的"CSV 编码转换"将 CSV 转为 UTF-8 后再操作。' },
    { q: '导出 PDF 时弹出的是打印窗口？', a: '是的。Excel→PDF 使用浏览器原生打印功能，您在打印对话框中选择"另存为 PDF"即可，样式可自由调整。' },
    { q: 'Markdown / HTML 表格导出的结果是否正确？', a: '导出时会转义单元格中的 | 和换行等特殊字符。若原表格含有复杂合并单元格，导出会按单元格值平铺。' },
    { q: '"空单元格向下填充"适用于什么场景？', a: '适用于从报表/数据透视表中复制出的表格，其中第一列是"分组值"但只有第一行有值，其他行是空白。填充后每行都会有分组值，便于后续处理。' },
    { q: '我想把本工具分享给同事，怎么办？', a: '本工具完全前端，您可以把整个项目目录复制给同事，在浏览器中打开 index.html 即可使用；也可以部署到任意静态服务器或本地 http server。' }
  ];

  // ============== 全局工具 ==============
  var uploaders = {};

  function parseColRef(text, headerRow) {
    if (text == null || text === '') return -1;
    text = String(text).trim();
    if (/^[A-Za-z]+$/.test(text)) return C.colLetterToIndex(text);
    if (/^\d+$/.test(text)) return parseInt(text, 10) - 1;
    if (headerRow) {
      for (var i = 0; i < headerRow.length; i++) {
        if (String(headerRow[i]).trim() === text) return i;
      }
    }
    return -1;
  }

  function parseColList(text, headerRow) {
    if (!text) return null;
    return text.split(/[,，]/).map(function (s) { return parseColRef(s.trim(), headerRow); }).filter(function (n) { return n >= 0; });
  }

  function parseRowRange(text) {
    if (!text) return null;
    var result = [];
    text.split(/[,，]/).forEach(function (p) {
      p = p.trim();
      if (p.indexOf('-') >= 0) {
        var range = p.split('-').map(function (s) { return parseInt(s, 10); });
        if (!isNaN(range[0]) && !isNaN(range[1])) {
          for (var i = range[0]; i <= range[1]; i++) result.push(i);
        }
      } else {
        var n = parseInt(p, 10);
        if (!isNaN(n)) result.push(n);
      }
    });
    return result;
  }

  // ============== 视图切换 ==============
  function switchView(name) {
    var sections = document.querySelectorAll('.view');
    sections.forEach(function (s) { s.classList.remove('active'); });
    var target = document.getElementById('view-' + name);
    if (target) target.classList.add('active');
    var links = document.querySelectorAll('.nav-link');
    links.forEach(function (l) {
      l.classList.toggle('active', l.getAttribute('data-view') === name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function bindNav() {
    document.querySelectorAll('[data-view]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        var v = el.getAttribute('data-view');
        if (v) switchView(v);
      });
    });
  }

  // ============== 教程弹窗 ==============
  function bindTutorial() {
    var btn = document.getElementById('btn-tutorial');
    var modal = document.getElementById('tutorial-modal');
    if (!btn || !modal) return;
    btn.addEventListener('click', function () { modal.classList.remove('hidden'); });
    modal.addEventListener('click', function (e) {
      if (e.target.classList.contains('modal') || e.target.classList.contains('modal-mask') || e.target.id === 'btn-tutorial-close') {
        modal.classList.add('hidden');
      }
    });
    var closeBtn = document.getElementById('btn-tutorial-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { modal.classList.add('hidden'); });
  }

  // ============== FAQ 渲染 ==============
  function renderFAQ() {
    var list = document.getElementById('faq-list');
    if (!list) return;
    FAQ_DATA.forEach(function (item, i) {
      var el = document.createElement('div');
      el.className = 'faq-item';
      el.innerHTML = '<div class="faq-q">' + (i + 1) + '. ' + item.q + '</div><div class="faq-a"><p>' + item.a + '</p></div>';
      el.querySelector('.faq-q').addEventListener('click', function () {
        el.classList.toggle('open');
      });
      list.appendChild(el);
    });
  }

  // ============== 模块 A: 密码工具 ==============
  function bindCrypto() {
    uploaders.crypto = global.__UPLOADER.init('#crypto-uploader', '#crypto-file', '#crypto-filelist', {
      multiple: true, onFiles: function (files) {
        var info = document.getElementById('crypto-file-info');
        if (info && files.length) {
          var html = '<p><b>📋 文件信息</b></p><ul>';
          files.forEach(function (f) { html += '<li>' + f.name + '（' + C.fmtSize(f.size) + '）</li>'; });
          html += '</ul>';
          info.innerHTML = html;
          info.classList.remove('hidden');
        } else if (info) {
          info.classList.add('hidden');
        }
      }
    });

    var radios = document.querySelectorAll('input[name="cryptoMode"]');
    var brutePanel = document.getElementById('crypto-brute-panel');
    var bruteNodePanel = document.getElementById('crypto-brute-node-panel');
    var knownPanel = document.getElementById('crypto-known-panel');
    var dictPanel = document.getElementById('crypto-dict-panel');
    function getMode() {
      for (var i = 0; i < radios.length; i++) if (radios[i].checked) return radios[i].value;
      return 'unprotect';
    }
    function showCryptoPanels() {
      var m = getMode();
      if (brutePanel) brutePanel.classList.toggle('hidden', m !== 'brute');
      if (bruteNodePanel) bruteNodePanel.classList.toggle('hidden', m !== 'brute-node');
      if (knownPanel) knownPanel.classList.toggle('hidden', m !== 'known');
      if (dictPanel) dictPanel.classList.toggle('hidden', m !== 'dictionary');
    }
    radios.forEach(function (r) { r.addEventListener('change', showCryptoPanels); });
    showCryptoPanels();

    // 字典文件上传
    var dictFileInput = document.getElementById('dict-file');
    var dictFileInfo = document.getElementById('dict-filelist');
    if (dictFileInput) {
      dictFileInput.addEventListener('change', function () {
        if (!dictFileInfo) return;
        var f = dictFileInput.files[0];
        if (f) dictFileInfo.innerHTML = '<div>📄 ' + f.name + '（' + C.fmtSize(f.size) + '）</div>';
        else dictFileInfo.innerHTML = '';
      });
    }

    var btnStart = document.getElementById('btn-crypto-start');
    var btnPause = document.getElementById('btn-crypto-pause');
    var btnStop = document.getElementById('btn-crypto-stop');
    var btnClear = document.getElementById('btn-crypto-clear');
    var bruteCtrl = { paused: false, stopped: false };

    if (btnStart) btnStart.addEventListener('click', function () {
      var files = uploaders.crypto ? uploaders.crypto.getFiles() : [];
      if (!files.length) { C.toast('请先上传 Excel 文件', 'warning'); return; }
      global.__DISCLAIM.require().then(function (ok) {
        if (!ok) return;
        (global.__CRYPTO.waitDeps ? global.__CRYPTO.waitDeps() : C.waitXLSX()).then(function (ready) {
          if (!ready) {
            C.toast('依赖库加载失败，请检查网络', 'error');
            if (btnStart) btnStart.disabled = false;
            return;
          }
          var m = getMode();
          if (m === 'unprotect') doRemoveProtection(files);
          else if (m === 'known') doKnownPassword(files);
          else if (m === 'brute-node') doBruteForceNode(files);
          else if (m === 'dictionary') doDictionary(files);
          else doBruteForce(files);
        });
      });
    });

    if (btnPause) btnPause.addEventListener('click', function () {
      if (bruteCtrl.pool && !bruteCtrl.stopped) {
        bruteCtrl.pool.stop();
        bruteCtrl.stopped = true;
        if (btnStart) btnStart.disabled = false;
        if (btnPause) btnPause.disabled = true;
        C.toast('已停止所有 Worker', 'warning');
      } else {
        C.toast('当前没有运行中的穷举', '');
      }
    });
    if (btnStop) btnStop.addEventListener('click', function () {
      bruteCtrl.stopped = true;
      if (bruteCtrl.pool) bruteCtrl.pool.stop();
      if (btnStart) btnStart.disabled = false;
      if (btnPause) btnPause.disabled = true;
      if (btnStop) btnStop.disabled = true;
      C.toast('已终止穷举', 'warning');
    });
    if (btnClear) btnClear.addEventListener('click', function () {
      if (uploaders.crypto) uploaders.crypto.clear();
      var ids = ['crypto-result', 'crypto-progress', 'crypto-file-info'];
      ids.forEach(function (id) { var el = document.getElementById(id); if (el) el.classList.add('hidden'); });
    });

    function doRemoveProtection(files) {
      btnStart.disabled = true;
      var resultBody = document.getElementById('crypto-result-body');
      var resultPanel = document.getElementById('crypto-result');
      resultBody.innerHTML = '<p>正在处理中，请稍候...</p>';
      resultPanel.classList.remove('hidden');
      Promise.all(files.map(function (f) {
        return global.__CRYPTO.removeProtection(f)
          .then(function (r) { return { file: f, result: r }; })
          .catch(function (err) { return { file: f, error: err.message }; });
      })).then(function (items) {
        btnStart.disabled = false;
        var html = '<h3>处理结果</h3>';
        items.forEach(function (it, idx) {
          if (it.error) html += '<div class="result-summary" style="border-left-color:#e8572a;">❌ ' + it.file.name + ' 失败：' + it.error + '</div>';
          else if (!it.result.changed) html += '<div class="result-summary" style="border-left-color:#f3a93c;">⚠️ ' + it.file.name + ' 未检测到保护</div>';
          else {
            html += '<div class="result-summary">✅ ' + it.file.name + ' 已移除保护</div>';
            html += '<div><button class="btn btn-primary" data-download="' + idx + '">⬇ 下载已解锁文件</button></div>';
          }
        });
        resultBody.innerHTML = html;
        resultBody.querySelectorAll('[data-download]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var idx = parseInt(btn.getAttribute('data-download'), 10);
            var it = items[idx];
            var fname = C.safeFilename(it.file.name).replace(/\.[^.]+$/, '_已解锁.xlsx');
            var blob = new Blob([it.result.bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            C.downloadBlob(blob, fname);
          });
        });
      });
    }

    function doKnownPassword(files) {
      var pwdEl = document.getElementById('pwd-known');
      var pwd = pwdEl ? pwdEl.value.trim() : '';
      if (!pwd) { C.toast('请输入密码', 'warning'); return; }
      btnStart.disabled = true;
      var resultBody = document.getElementById('crypto-result-body');
      document.getElementById('crypto-result').classList.remove('hidden');
      resultBody.innerHTML = '<p>正在尝试密码...</p>';
      Promise.all(files.map(function (f) {
        return global.__CRYPTO.tryDecrypt(f, pwd).then(function (r) { return { file: f, result: r }; });
      })).then(function (items) {
        btnStart.disabled = false;
        var html = '';
        items.forEach(function (it, i) {
          if (it.result && it.result.workbook) {
            html += '<div class="result-summary">✅ ' + it.file.name + '：密码正确</div>';
            html += '<div><button class="btn btn-primary" data-pwd-dl="' + i + '">⬇ 下载已解锁文件</button></div>';
          } else {
            html += '<div class="result-summary" style="border-left-color:#e8572a;">❌ ' + it.file.name + '：该密码无法解锁</div>';
          }
        });
        resultBody.innerHTML = html;
        resultBody.querySelectorAll('[data-pwd-dl]').forEach(function (btn) {
          btn.onclick = function () {
            var it = items[parseInt(btn.getAttribute('data-pwd-dl'), 10)];
            C.writeWorkbook(it.result.workbook, 'xlsx', C.safeFilename(it.file.name).replace(/\.[^.]+$/, '_已解锁.xlsx'));
          };
        });
      }).catch(function (e) {
        btnStart.disabled = false;
        resultBody.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">失败：' + e.message + '</div>';
      });
    }

    function doBruteForce(files) {
      var minLen = parseInt(document.getElementById('pwd-min').value, 10) || 1;
      var maxLen = parseInt(document.getElementById('pwd-max').value, 10) || 4;
      if (minLen < 1 || maxLen > 10 || minLen > maxLen) {
        C.toast('密码长度需在 1~10 之间', 'warning');
        return;
      }
      var customCharset = (document.getElementById('pwd-charset-custom').value || '').trim();
      var charset;
      if (customCharset) {
        charset = customCharset;
      } else {
        var flags = [];
        if (document.getElementById('pwd-charset-digits').checked) flags.push('digits');
        if (document.getElementById('pwd-charset-lower').checked) flags.push('lower');
        if (document.getElementById('pwd-charset-upper').checked) flags.push('upper');
        if (document.getElementById('pwd-charset-common').checked) flags.push('common');
        if (flags.length === 0) { C.toast('请至少选择一类字符或填写自定义字符集', 'warning'); return; }
        charset = window.__CRYPTO.getCharset(flags);
      }
      var file = files[0];
      btnStart.disabled = true;
      if (btnPause) { btnPause.disabled = false; btnPause.textContent = '⏹ 停止'; btnPause.style.display = 'inline-block'; }
      if (btnStop) { btnStop.disabled = false; btnStop.style.display = 'inline-block'; }
      var resultPanel = document.getElementById('crypto-result');
      var resultBody = document.getElementById('crypto-result-body');
      resultPanel.classList.remove('hidden');
      resultBody.innerHTML = '<p>正在穷举：' + file.name + '（字符集大小：' + charset.length + '）</p>';
      var progress = global.__PROGRESS.bind('#crypto-progress');
      progress.show();
      progress.setProgress(0, '准备中...');

      C.readAsBuffer(file).then(function (buf) {
        if (!global.__CRYPTO.isEncrypted(buf)) {
          btnStart.disabled = false;
          if (btnPause) btnPause.disabled = true;
          if (btnStop) btnStop.disabled = true;
          resultBody.innerHTML = '<div class="result-summary" style="border-left-color:#f3a93c;">⚠️ 该文件未检测到加密。</div>';
          return;
        }
        var total = global.__CRYPTO.countCandidates(minLen, maxLen, charset);
        document.getElementById('crypto-total').textContent = total.toLocaleString();
        document.getElementById('crypto-tried').textContent = '0';
        document.getElementById('crypto-eta').textContent = '-';
        document.getElementById('crypto-log').textContent = '启动中...';

        var startTime = Date.now();
        var pool = global.__CRYPTO.createBrutePool({
          buf: buf,
          charset: charset,
          minLen: minLen,
          maxLen: maxLen,
          onProgress: function (info) {
            var pct = info.total > 0 ? (info.tried / info.total) * 100 : 0;
            progress.setProgress(pct, '穷举中（字符集=' + charset.length + '）');
            progress.setInfo(info.current || '-', info.speed || 0);
            document.getElementById('crypto-tried').textContent = (info.tried || 0).toLocaleString();
            if (info.speed > 0 && info.total > info.tried) {
              var remainSec = Math.round((info.total - info.tried) / info.speed);
              var h = Math.floor(remainSec / 3600);
              var m = Math.floor((remainSec % 3600) / 60);
              var s = remainSec % 60;
              document.getElementById('crypto-eta').textContent = (h > 0 ? h + 'h ' : '') + (m > 0 ? m + 'm ' : '') + s + 's';
            }
          },
          onFound: function (password) {
            btnStart.disabled = false;
            if (btnPause) { btnPause.disabled = true; btnPause.style.display = 'none'; }
            if (btnStop) { btnStop.disabled = true; btnStop.style.display = 'none'; }
            var seconds = ((Date.now() - startTime) / 1000).toFixed(1);
            var tried = parseInt(document.getElementById('crypto-tried').textContent.replace(/[^\d]/g, ''), 10) || 0;
            var speed = parseInt(document.getElementById('crypto-speed').textContent.replace(/[^\d]/g, ''), 10) || 0;
            resultBody.innerHTML = '<div class="result-summary">' +
              '✅ 成功！密码：<strong style="font-size:18px;color:#22a75d;">' + password + '</strong><br>' +
              '尝试次数：' + tried + ' / 耗时：' + seconds + ' 秒 / 速度：' + speed.toLocaleString() + ' 次/秒</div>' +
              '<div style="margin-top:12px;"><button id="btn-download-decrypted" class="btn btn-primary">⬇ 下载已解锁文件</button></div>';
            document.getElementById('btn-download-decrypted').onclick = function () {
              var r = global.__CRYPTO.tryDecrypt(buf, password);
              if (r && r.workbook) {
                var out = XLSX.write(r.workbook, { type: 'base64', bookType: 'xlsx' });
                C.downloadBase64(out, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', C.safeFilename(file.name).replace(/\.[^.]+$/, '') + '_已解锁.xlsx');
              } else {
                C.toast('已找到密码但写出文件失败', 'warning');
              }
            };
          },
          onDone: function (tried) {
            btnStart.disabled = false;
            if (btnPause) { btnPause.disabled = true; btnPause.style.display = 'none'; }
            if (btnStop) { btnStop.disabled = true; btnStop.style.display = 'none'; }
            var sec2 = ((Date.now() - startTime) / 1000).toFixed(1);
            resultBody.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 未找到密码（共尝试 ' + (tried || 0).toLocaleString() + ' 次，耗时 ' + sec2 + ' 秒）</div>';
          },
          onError: function (msg) {
            btnStart.disabled = false;
            C.toast('出错：' + msg, 'error');
            document.getElementById('crypto-log').textContent = String(msg);
          },
          onLog: function (text) {
            document.getElementById('crypto-log').textContent = String(text);
          }
        });

        bruteCtrl.pool = pool;
        bruteCtrl.stopped = false;
        pool.start();
      });
    }

    /* ---------- 字典穷举 ---------- */
    function doDictionary(files) {
      var dictFileInput = document.getElementById('dict-file');
      if (!dictFileInput || !dictFileInput.files || !dictFileInput.files.length) {
        C.toast('请先上传密码字典（.txt）', 'warning');
        return;
      }
      var dictFile = dictFileInput.files[0];
      var reader = new FileReader();
      reader.onload = function () {
        var text = reader.result;
        var lines = String(text).split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
        if (!lines.length) { C.toast('密码字典为空', 'warning'); return; }
        // 去重
        var seen = {};
        var wordlist = [];
        for (var i = 0; i < lines.length; i++) {
          if (!seen[lines[i]]) { seen[lines[i]] = true; wordlist.push(lines[i]); }
        }
        var file = files[0];
        btnStart.disabled = true;
        var resultPanel = document.getElementById('crypto-result');
        var resultBody = document.getElementById('crypto-result-body');
        resultPanel.classList.remove('hidden');
        resultBody.innerHTML = '<p>正在使用字典穷举：' + file.name + '（共 ' + wordlist.length + ' 个候选密码）</p>';
        var progress = global.__PROGRESS.bind('#crypto-progress');
        progress.show();
        progress.setProgress(0, '准备中...');
        document.getElementById('crypto-total').textContent = wordlist.length.toLocaleString();
        document.getElementById('crypto-tried').textContent = '0';

        C.readAsBuffer(file).then(function (buf) {
          if (!global.__CRYPTO.isEncrypted(buf)) {
            btnStart.disabled = false;
            resultBody.innerHTML = '<div class="result-summary" style="border-left-color:#f3a93c;">⚠️ 该文件未检测到加密。</div>';
            return;
          }
          // 使用 worker 分发 wordlist
          var workerCount = Math.max(1, Math.min(16, (navigator.hardwareConcurrency || 2)));
          var startTime = Date.now();
          var pool = global.__CRYPTO.createBrutePool({
            workerUrl: 'js/brute-worker.js',
            workerCount: workerCount,
            chunkSize: 500,
            buf: buf,
            wordlist: wordlist,
            charset: '',
            minLen: 0,
            maxLen: 0,
            onProgress: function (info) {
              var pct = info.total > 0 ? (info.tried / info.total) * 100 : 0;
              progress.setProgress(pct, '字典穷举中');
              progress.setInfo(info.current || '-', info.speed || 0);
              document.getElementById('crypto-tried').textContent = (info.tried || 0).toLocaleString();
            },
            onFound: function (password) {
              btnStart.disabled = false;
              var seconds = ((Date.now() - startTime) / 1000).toFixed(1);
              var tried = parseInt(document.getElementById('crypto-tried').textContent.replace(/[^\d]/g, ''), 10) || 0;
              resultBody.innerHTML = '<div class="result-summary">' +
                '✅ 成功！密码：<strong style="font-size:18px;color:#22a75d;">' + password + '</strong><br>' +
                '尝试次数：' + tried + ' / 耗时：' + seconds + ' 秒</div>' +
                '<div style="margin-top:12px;"><button id="btn-download-decrypted" class="btn btn-primary">⬇ 下载已解锁文件</button></div>';
              document.getElementById('btn-download-decrypted').onclick = function () {
                var r = global.__CRYPTO.tryDecrypt(buf, password);
                if (r && r.workbook) {
                  var out = XLSX.write(r.workbook, { type: 'base64', bookType: 'xlsx' });
                  C.downloadBase64(out, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', C.safeFilename(file.name).replace(/\.[^.]+$/, '') + '_已解锁.xlsx');
                } else {
                  C.toast('已找到密码但写出文件失败', 'warning');
                }
              };
            },
            onDone: function (tried) {
              btnStart.disabled = false;
              var sec2 = ((Date.now() - startTime) / 1000).toFixed(1);
              resultBody.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 字典中未找到匹配密码（共尝试 ' + (tried || 0).toLocaleString() + ' 次，耗时 ' + sec2 + ' 秒）</div>';
            },
            onError: function (msg) {
              btnStart.disabled = false;
              C.toast('出错：' + msg, 'error');
            },
            onLog: function (text) {
              document.getElementById('crypto-log').textContent = String(text);
            }
          });
          bruteCtrl.pool = pool;
          bruteCtrl.stopped = false;
          pool.start();
        });
      };
      reader.onerror = function () { C.toast('读取字典文件失败', 'error'); };
      reader.readAsText(dictFile, 'UTF-8');
    }

    /* ---------- Node.js 多进程穷举（WebSocket 客户端）---------- */
    function doBruteForceNode(files) {
      var serverUrl = (document.getElementById('node-server').value || 'ws://localhost:8765').trim();
      var workerCount = parseInt(document.getElementById('node-workers').value, 10) || 0;
      var minLen = parseInt(document.getElementById('node-min').value, 10) || 1;
      var maxLen = parseInt(document.getElementById('node-max').value, 10) || 4;
      if (minLen < 1 || maxLen > 10 || minLen > maxLen) { C.toast('密码长度需在 1~10 之间', 'warning'); return; }
      var customCharset = (document.getElementById('node-charset-custom').value || '').trim();
      var charset;
      if (customCharset) {
        charset = customCharset;
      } else {
        var flags = [];
        if (document.getElementById('node-charset-digits').checked) flags.push('digits');
        if (document.getElementById('node-charset-lower').checked) flags.push('lower');
        if (document.getElementById('node-charset-upper').checked) flags.push('upper');
        if (document.getElementById('node-charset-common').checked) flags.push('common');
        if (flags.length === 0) { C.toast('请至少选择一类字符', 'warning'); return; }
        charset = window.__CRYPTO.getCharset(flags);
      }
      var file = files[0];
      btnStart.disabled = true;
      if (btnPause) { btnPause.disabled = false; btnPause.textContent = '⏹ 停止'; btnPause.style.display = 'inline-block'; }
      if (btnStop) { btnStop.disabled = false; btnStop.style.display = 'inline-block'; }
      var resultPanel = document.getElementById('crypto-result');
      var resultBody = document.getElementById('crypto-result-body');
      resultPanel.classList.remove('hidden');
      resultBody.innerHTML = '<p>正在连接 Node.js 服务器：' + serverUrl + '</p>';
      var progress = global.__PROGRESS.bind('#crypto-progress');
      progress.show();
      progress.setProgress(0, '连接服务器中...');
      document.getElementById('crypto-tried').textContent = '0';
      document.getElementById('crypto-eta').textContent = '-';
      document.getElementById('crypto-log').textContent = '连接中...';

      C.readAsBuffer(file).then(function (buf) {
        var base64 = C.arrayBufferToBase64(buf);
        var taskId = 't' + Date.now();
        var ws;
        try {
          ws = new WebSocket(serverUrl);
        } catch (e) {
          btnStart.disabled = false;
          C.toast('WebSocket 连接失败：' + e.message, 'error');
          return;
        }
        var startTime = Date.now();
        var total = 0;
        var tried = 0;
        var origPause = btnPause.onclick;
        var origStop = btnStop.onclick;

        ws.onopen = function () {
          document.getElementById('crypto-log').textContent = '已连接，发送任务...';
          ws.send(JSON.stringify({ type: 'start', taskId: taskId, buf: base64, charset: charset, minLen: minLen, maxLen: maxLen, workerCount: workerCount }));
        };
        ws.onmessage = function (ev) {
          var msg;
          try { msg = JSON.parse(ev.data); } catch (e) { return; }
          if (msg.type === 'ready') {
            total = msg.total || 0;
            document.getElementById('crypto-total').textContent = total.toLocaleString();
            progress.setProgress(0, 'Node.js 穷举中（' + charset.length + ' 字符集）');
          } else if (msg.type === 'progress') {
            tried = msg.tried || 0;
            var pct = total > 0 ? (tried / total) * 100 : 0;
            var elapsed = (Date.now() - startTime) / 1000;
            var speed = elapsed > 0 ? Math.round(tried / elapsed) : 0;
            progress.setProgress(pct, '穷举中');
            progress.setInfo(msg.current || '-', speed);
            document.getElementById('crypto-tried').textContent = tried.toLocaleString();
            if (speed > 0 && total > tried) {
              var remainSec = Math.round((total - tried) / speed);
              var h = Math.floor(remainSec / 3600);
              var m = Math.floor((remainSec % 3600) / 60);
              var s = remainSec % 60;
              document.getElementById('crypto-eta').textContent = (h > 0 ? h + 'h ' : '') + (m > 0 ? m + 'm ' : '') + s + 's';
            }
          } else if (msg.type === 'found') {
            btnStart.disabled = false;
            if (btnPause) { btnPause.disabled = true; btnPause.style.display = 'none'; }
            if (btnStop) { btnStop.disabled = true; btnStop.style.display = 'none'; }
            btnPause.onclick = origPause;
            btnStop.onclick = origStop;
            var seconds = ((Date.now() - startTime) / 1000).toFixed(1);
            resultBody.innerHTML = '<div class="result-summary">' +
              '✅ 成功！密码：<strong style="font-size:18px;color:#22a75d;">' + msg.password + '</strong><br>' +
              '尝试次数：' + tried.toLocaleString() + ' / 耗时：' + seconds + ' 秒</div>' +
              '<div style="margin-top:12px;"><button id="btn-download-decrypted" class="btn btn-primary">⬇ 下载已解锁文件</button></div>';
            document.getElementById('btn-download-decrypted').onclick = function () {
              var r = global.__CRYPTO.tryDecrypt(buf, msg.password);
              if (r && r.workbook) {
                var out = XLSX.write(r.workbook, { type: 'base64', bookType: 'xlsx' });
                C.downloadBase64(out, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', C.safeFilename(file.name).replace(/\.[^.]+$/, '') + '_已解锁.xlsx');
              }
            };
            ws.close();
          } else if (msg.type === 'done') {
            btnStart.disabled = false;
            if (btnPause) { btnPause.disabled = true; btnPause.style.display = 'none'; }
            if (btnStop) { btnStop.disabled = true; btnStop.style.display = 'none'; }
            btnPause.onclick = origPause;
            btnStop.onclick = origStop;
            var sec2 = ((Date.now() - startTime) / 1000).toFixed(1);
            resultBody.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 未找到密码（共尝试 ' + (msg.tried || tried).toLocaleString() + ' 次，耗时 ' + sec2 + ' 秒）</div>';
            ws.close();
          } else if (msg.type === 'error') {
            document.getElementById('crypto-log').textContent = '错误：' + msg.message;
            C.toast('服务器错误：' + msg.message, 'error');
          } else if (msg.type === 'stopped') {
            btnStart.disabled = false;
            if (btnPause) { btnPause.disabled = true; btnPause.style.display = 'none'; }
            if (btnStop) { btnStop.disabled = true; btnStop.style.display = 'none'; }
            btnPause.onclick = origPause;
            btnStop.onclick = origStop;
          }
        };
        ws.onerror = function () {
          btnStart.disabled = false;
          C.toast('无法连接到服务器 ' + serverUrl + '，请确认已运行 node server-node.js', 'error');
          document.getElementById('crypto-log').textContent = '连接失败，请检查服务器是否运行';
        };
        ws.onclose = function () {};

        btnPause.onclick = function () {
          if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'stop' }));
          btnStart.disabled = false;
          if (btnPause) btnPause.disabled = true;
          btnPause.onclick = origPause;
          C.toast('已停止', 'warning');
        };
        btnStop.onclick = function () {
          if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'stop' }));
          btnStart.disabled = false;
          if (btnPause) btnPause.disabled = true;
          if (btnStop) btnStop.disabled = true;
          btnPause.onclick = origPause;
          btnStop.onclick = origStop;
        };
      });
    }
  }

  // ============== 模块 B: 数据整理 ==============
  function bindData() {
    uploaders.data = global.__UPLOADER.init('#data-uploader', '#data-file', '#data-filelist', { multiple: true, onFiles: function () {} });
    var modeRadios = document.querySelectorAll('input[name="dataMode"]');
    function getMode() {
      for (var i = 0; i < modeRadios.length; i++) if (modeRadios[i].checked) return modeRadios[i].value;
      return 'merge';
    }
    function showPanels() {
      var ids = ['merge', 'split', 'dedup', 'compare', 'transpose', 'one2two', 'fillblank', 'rowstrip', 'clean', 'replace', 'round', 'case'];
      var cur = getMode();
      ids.forEach(function (k) {
        var p = document.getElementById('data-param-' + k);
        if (p) p.classList.toggle('hidden', k !== cur);
      });
    }
    modeRadios.forEach(function (r) { r.addEventListener('change', showPanels); });
    showPanels();

    document.getElementById('btn-data-start').addEventListener('click', function () {
      var files = uploaders.data ? uploaders.data.getFiles() : [];
      if (!files.length) { C.toast('请先上传文件', 'warning'); return; }
      C.waitXLSX().then(function (ok) {
        if (!ok) return;
        var m = getMode();
        var panel = document.getElementById('data-result');
        panel.classList.remove('hidden');
        var body = document.getElementById('data-result-body');
        body.innerHTML = '<p>处理中...</p>';
        switch (m) {
          case 'merge': doMerge(files, body); break;
          case 'split': doSplit(files, body); break;
          case 'dedup': doDedup(files, body); break;
          case 'clean': doClean(files, body); break;
          case 'compare': doCompare(files, body); break;
          case 'transpose': doTranspose(files, body); break;
          case 'one2two': doOne2Two(files, body); break;
          case 'fillblank': doFillBlank(files, body); break;
          case 'rowstrip': doRowStrip(files, body); break;
          case 'replace': doReplace(files, body); break;
          case 'round': doRound(files, body); break;
          case 'case': doCaseChange(files, body); break;
        }
      });
    });
    document.getElementById('btn-data-clear').addEventListener('click', function () {
      if (uploaders.data) uploaders.data.clear();
      document.getElementById('data-result').classList.add('hidden');
    });

    function doMerge(files, body) {
      var useHeader = document.getElementById('merge-header').checked;
      var src = document.getElementById('merge-source').value.trim();
      var opt = { useHeader: useHeader };
      if (src) opt.sourceCol = src;
      global.__DATA.merge(files, opt).then(function (res) {
        body.innerHTML = '<div class="result-summary">✅ 合并完成，共 ' + res.rowCount + ' 行数据</div>' +
          '<button id="btn-dl" class="btn btn-primary" style="margin:8px 0;">⬇ 下载合并结果</button>';
        document.getElementById('btn-dl').onclick = function () {
          C.writeWorkbook(res.workbook, 'xlsx', '合并结果_' + C.ts() + '.xlsx');
        };
      }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doSplit(files, body) {
      var colText = document.getElementById('split-col').value.trim();
      var hasHeader = document.getElementById('split-header').checked;
      Promise.all(files.map(function (f) {
        return C.readAsBuffer(f).then(function (buf) {
          var wb = C.readWorkbook(buf);
          var aoa = C.sheetToArray(wb.Sheets[wb.SheetNames[0]]);
          var colIdx;
          if (/^[A-Za-z]+$/.test(colText)) colIdx = C.colLetterToIndex(colText);
          else if (/^\d+$/.test(colText)) colIdx = parseInt(colText, 10) - 1;
          else if (hasHeader) {
            colIdx = -1;
            for (var i = 0; i < (aoa[0] || []).length; i++) if (String(aoa[0][i]).trim() === colText) { colIdx = i; break; }
          }
          if (colIdx < 0) throw new Error('无法识别目标列：' + colText);
          return global.__DATA.splitByCol(f, colIdx, { hasHeader: hasHeader }).then(function (items) { return { file: f, items: items }; });
        });
      })).then(function (results) {
        var html = '<div class="result-summary">✅ 按列拆分完成</div>';
        results.forEach(function (res, idx) {
          html += '<div style="margin:8px 0;"><b>' + res.file.name + '</b>：' + res.items.length + ' 个分组</div><div>';
          res.items.forEach(function (it, i) {
            html += '<button class="btn btn-ghost" style="margin:4px;" data-split-dl="' + idx + '_' + i + '">⬇ ' + it.key + '（' + it.rowCount + '行）</button>';
          });
          html += '</div>';
        });
        body.innerHTML = html;
        body.querySelectorAll('[data-split-dl]').forEach(function (btn) {
          btn.onclick = function () {
            var ids = btn.getAttribute('data-split-dl').split('_');
            var res = results[parseInt(ids[0], 10)];
            var it = res.items[parseInt(ids[1], 10)];
            C.writeWorkbook(it.workbook, 'xlsx', C.safeFilename(res.file.name).replace(/\.[^.]+$/, '') + '_' + C.safeFilename(String(it.key)) + '.xlsx');
          };
        });
      }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doDedup(files, body) {
      var colText = document.getElementById('dedup-cols').value.trim();
      Promise.all(files.map(function (f) {
        return C.readAsBuffer(f).then(function (buf) {
          var wb = C.readWorkbook(buf);
          var firstAoa = C.sheetToArray(wb.Sheets[wb.SheetNames[0]]);
          var cols = parseColList(colText, firstAoa[0]);
          return global.__DATA.dedupe(f, cols, {}).then(function (r) { return { file: f, result: r }; });
        });
      })).then(function (items) {
        var html = '<div class="result-summary">✅ 去重完成</div>';
        items.forEach(function (it, i) {
          html += '<div class="result-summary" style="border-left-color:#22a75d;">' + it.file.name + '：移除 ' + it.result.removed + ' 条重复</div>';
          html += '<button class="btn btn-primary" style="margin:8px;" data-dedup-dl="' + i + '">⬇ 下载 ' + it.file.name + '</button>';
        });
        body.innerHTML = html;
        body.querySelectorAll('[data-dedup-dl]').forEach(function (btn) {
          btn.onclick = function () {
            var it = items[parseInt(btn.getAttribute('data-dedup-dl'), 10)];
            C.writeWorkbook(it.result.workbook, 'xlsx', C.safeFilename(it.file.name).replace(/\.[^.]+$/, '') + '_已去重.xlsx');
          };
        });
      }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doClean(files, body) {
      Promise.all(files.map(function (f) { return global.__DATA.cleanEmpty(f).then(function (r) { return { file: f, result: r }; }); })).then(function (items) {
        var html = '<div class="result-summary">✅ 清理完成</div>';
        items.forEach(function (it, i) {
          html += '<div class="result-summary" style="border-left-color:#22a75d;">' + it.file.name + '：清理前 ' + it.result.before + ' 行，清理后 ' + it.result.after + ' 行</div>';
          html += '<button class="btn btn-primary" style="margin:8px;" data-clean-dl="' + i + '">⬇ 下载 ' + it.file.name + '</button>';
        });
        body.innerHTML = html;
        body.querySelectorAll('[data-clean-dl]').forEach(function (btn) {
          btn.onclick = function () {
            var it = items[parseInt(btn.getAttribute('data-clean-dl'), 10)];
            C.writeWorkbook(it.result.workbook, 'xlsx', C.safeFilename(it.file.name).replace(/\.[^.]+$/, '') + '_已清理.xlsx');
          };
        });
      }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doCompare(files, body) {
      if (files.length < 2) { C.toast('对比至少需要 2 个文件', 'warning'); return; }
      var keyText = document.getElementById('cmp-key').value.trim();
      C.readAsBuffer(files[0]).then(function (buf) {
        var wb = C.readWorkbook(buf);
        var headerRow = C.sheetToArray(wb.Sheets[wb.SheetNames[0]])[0] || [];
        var keyIdx = parseColRef(keyText, headerRow);
        if (keyIdx < 0) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 无法识别基准列：' + keyText + '</div>'; return; }
        return global.__DATA.compare(files.slice(0, 2), keyIdx).then(function (res) {
          var aoa = C.sheetToArray(res.workbook.Sheets['对比结果']);
          body.innerHTML = '<div class="result-summary">✅ 对比完成，差异 ' + Math.max(0, aoa.length - 1) + ' 行</div>' +
            '<button id="btn-cmp-dl" class="btn btn-primary" style="margin:8px 0;">⬇ 下载对比结果</button>';
          document.getElementById('btn-cmp-dl').onclick = function () { C.writeWorkbook(res.workbook, 'xlsx', '对比结果_' + C.ts() + '.xlsx'); };
        });
      }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doTranspose(files, body) {
      Promise.all(files.map(function (f) { return global.__DATA.transpose(f).then(function (r) { return { file: f, result: r }; }); })).then(function (items) {
        var html = '<div class="result-summary">✅ 行列转置完成</div>';
        items.forEach(function (it, i) {
          html += '<button class="btn btn-primary" style="margin:8px;" data-tp-dl="' + i + '">⬇ 下载 ' + it.file.name + '</button>';
        });
        body.innerHTML = html;
        body.querySelectorAll('[data-tp-dl]').forEach(function (btn) {
          btn.onclick = function () {
            var it = items[parseInt(btn.getAttribute('data-tp-dl'), 10)];
            C.writeWorkbook(it.result.workbook, 'xlsx', C.safeFilename(it.file.name).replace(/\.[^.]+$/, '') + '_转置.xlsx');
          };
        });
      }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doOne2Two(files, body) {
      var groupText = document.getElementById('group-cols').value.trim();
      var dimText = document.getElementById('dim-col').value.trim();
      var valText = document.getElementById('value-col').value.trim();
      if (!dimText || !valText) { body.innerHTML = '<div class="result-summary" style="border-left-color:#f3a93c;">⚠️ 请填写维度列与数值列</div>'; return; }
      Promise.all(files.map(function (f) {
        return C.readAsBuffer(f).then(function (buf) {
          var wb = C.readWorkbook(buf);
          var headerRow = C.sheetToArray(wb.Sheets[wb.SheetNames[0]])[0];
          var dimIdx = parseColRef(dimText, headerRow);
          var valIdx = parseColRef(valText, headerRow);
          var groupCols = groupText ? parseColList(groupText, headerRow) : [0];
          if (dimIdx < 0 || valIdx < 0) throw new Error('列引用无效，请检查维度列/数值列');
          return global.__DATA.pivotLongToWide2(f, { groupCols: groupCols, dimCol: dimIdx, valCol: valIdx }).then(function (r) { return { file: f, result: r }; });
        });
      })).then(function (items) {
        var html = '<div class="result-summary">✅ 透视完成</div>';
        items.forEach(function (it, i) {
          html += '<button class="btn btn-primary" style="margin:8px;" data-pivot-dl="' + i + '">⬇ 下载 ' + it.file.name + '</button>';
        });
        body.innerHTML = html;
        body.querySelectorAll('[data-pivot-dl]').forEach(function (btn) {
          btn.onclick = function () {
            var it = items[parseInt(btn.getAttribute('data-pivot-dl'), 10)];
            C.writeWorkbook(it.result.workbook, 'xlsx', C.safeFilename(it.file.name).replace(/\.[^.]+$/, '') + '_透视.xlsx');
          };
        });
      }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doFillBlank(files, body) {
      var colText = document.getElementById('fill-col').value.trim();
      var useHeader = document.getElementById('fill-header').checked;
      Promise.all(files.map(function (f) {
        return C.readAsBuffer(f).then(function (buf) {
          var wb = C.readWorkbook(buf);
          var firstAoa = C.sheetToArray(wb.Sheets[wb.SheetNames[0]]);
          var cols = parseColList(colText, firstAoa[0]);
          return global.__DATA.fillBlank(f, cols, { useHeader: useHeader }).then(function (r) { return { file: f, result: r }; });
        });
      })).then(function (items) {
        var html = '<div class="result-summary">✅ 空单元格向下填充完成</div>';
        items.forEach(function (it, i) {
          html += '<div class="result-summary" style="border-left-color:#22a75d;">' + it.file.name + '：共填充 ' + (it.result.filled || 0) + ' 个单元格</div>';
          html += '<button class="btn btn-primary" style="margin:8px;" data-fill-dl="' + i + '">⬇ 下载 ' + it.file.name + '</button>';
        });
        body.innerHTML = html;
        body.querySelectorAll('[data-fill-dl]').forEach(function (btn) {
          btn.onclick = function () {
            var it = items[parseInt(btn.getAttribute('data-fill-dl'), 10)];
            C.writeWorkbook(it.result.workbook, 'xlsx', C.safeFilename(it.file.name).replace(/\.[^.]+$/, '') + '_已填充.xlsx');
          };
        });
      }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doRowStrip(files, body) {
      var stripColText = document.getElementById('strip-cols').value.trim();
      var stripRowText = document.getElementById('strip-rows').value.trim();
      var rowsToDel = parseRowRange(stripRowText);
      Promise.all(files.map(function (f) {
        return C.readAsBuffer(f).then(function (buf) {
          var wb = C.readWorkbook(buf);
          var firstAoa = C.sheetToArray(wb.Sheets[wb.SheetNames[0]]);
          var cols = parseColList(stripColText, firstAoa[0]);
          return global.__DATA.rowStrip(f, { stripCols: cols, stripRows: rowsToDel }).then(function (r) { return { file: f, result: r }; });
        });
      })).then(function (items) {
        var html = '<div class="result-summary">✅ 删除完成</div>';
        items.forEach(function (it, i) {
          html += '<div class="result-summary" style="border-left-color:#22a75d;">' + it.file.name + '：删除列 ' + (it.result.removedCols || 0) + ' 个，删除行 ' + (it.result.removedRows || 0) + ' 个</div>';
          html += '<button class="btn btn-primary" style="margin:8px;" data-rs-dl="' + i + '">⬇ 下载 ' + it.file.name + '</button>';
        });
        body.innerHTML = html;
        body.querySelectorAll('[data-rs-dl]').forEach(function (btn) {
          btn.onclick = function () {
            var it = items[parseInt(btn.getAttribute('data-rs-dl'), 10)];
            C.writeWorkbook(it.result.workbook, 'xlsx', C.safeFilename(it.file.name).replace(/\.[^.]+$/, '') + '_已处理.xlsx');
          };
        });
      }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doReplace(files, body) {
      var search = document.getElementById('rp-search').value;
      var replEl = document.getElementById('rp-repl');
      var replacement = replEl ? replEl.value : '';
      var useRegex = document.getElementById('rp-regex').checked;
      var ignoreCase = document.getElementById('rp-icase').checked;
      var colText = document.getElementById('rp-cols') ? document.getElementById('rp-cols').value.trim() : '';
      if (search === '') { C.toast('请输入要查找的内容', 'warning'); return; }
      Promise.all(files.map(function (f) {
        return C.readAsBuffer(f).then(function (buf) {
          var wb = C.readWorkbook(buf);
          var header = C.sheetToArray(wb.Sheets[wb.SheetNames[0]])[0];
          var cols = parseColList(colText, header);
          return global.__DATA.replaceText(f, { search: search, replacement: replacement, useRegex: useRegex, ignoreCase: ignoreCase, cols: cols }).then(function (r) { return { file: f, result: r }; });
        });
      })).then(function (items) {
        var html = '<div class="result-summary">✅ 查找替换完成</div>';
        items.forEach(function (it, i) {
          html += '<div class="result-summary" style="border-left-color:#22a75d;">' + it.file.name + '：替换 ' + (it.result.changed || 0) + ' 处</div>';
          html += '<button class="btn btn-primary" style="margin:8px;" data-rp-dl="' + i + '">⬇ 下载 ' + it.file.name + '</button>';
        });
        body.innerHTML = html;
        body.querySelectorAll('[data-rp-dl]').forEach(function (btn) {
          btn.onclick = function () {
            var it = items[parseInt(btn.getAttribute('data-rp-dl'), 10)];
            C.writeWorkbook(it.result.workbook, 'xlsx', C.safeFilename(it.file.name).replace(/\.[^.]+$/, '') + '_已替换.xlsx');
          };
        });
      }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doRound(files, body) {
      var digits = parseInt(document.getElementById('round-digits').value, 10);
      if (isNaN(digits)) digits = 2;
      var colText = document.getElementById('round-cols') ? document.getElementById('round-cols').value.trim() : '';
      Promise.all(files.map(function (f) {
        return C.readAsBuffer(f).then(function (buf) {
          var wb = C.readWorkbook(buf);
          var header = C.sheetToArray(wb.Sheets[wb.SheetNames[0]])[0];
          var cols = parseColList(colText, header);
          return global.__DATA.roundNumbers(f, { digits: digits, cols: cols }).then(function (r) { return { file: f, result: r }; });
        });
      })).then(function (items) {
        var html = '<div class="result-summary">✅ 数值四舍五入完成</div>';
        items.forEach(function (it, i) {
          html += '<div class="result-summary" style="border-left-color:#22a75d;">' + it.file.name + '：共处理 ' + (it.result.changed || 0) + ' 个单元格</div>';
          html += '<button class="btn btn-primary" style="margin:8px;" data-rd-dl="' + i + '">⬇ 下载 ' + it.file.name + '</button>';
        });
        body.innerHTML = html;
        body.querySelectorAll('[data-rd-dl]').forEach(function (btn) {
          btn.onclick = function () {
            var it = items[parseInt(btn.getAttribute('data-rd-dl'), 10)];
            C.writeWorkbook(it.result.workbook, 'xlsx', C.safeFilename(it.file.name).replace(/\.[^.]+$/, '') + '_已四舍五入.xlsx');
          };
        });
      }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doCaseChange(files, body) {
      var mode = document.getElementById('case-mode').value;
      var colText = document.getElementById('case-cols') ? document.getElementById('case-cols').value.trim() : '';
      Promise.all(files.map(function (f) {
        return C.readAsBuffer(f).then(function (buf) {
          var wb = C.readWorkbook(buf);
          var header = C.sheetToArray(wb.Sheets[wb.SheetNames[0]])[0];
          var cols = parseColList(colText, header);
          return global.__DATA.changeCase(f, { mode: mode, cols: cols }).then(function (r) { return { file: f, result: r }; });
        });
      })).then(function (items) {
        var html = '<div class="result-summary">✅ 大小写转换完成</div>';
        items.forEach(function (it, i) {
          html += '<div class="result-summary" style="border-left-color:#22a75d;">' + it.file.name + '：共处理 ' + (it.result.changed || 0) + ' 个单元格</div>';
          html += '<button class="btn btn-primary" style="margin:8px;" data-cs-dl="' + i + '">⬇ 下载 ' + it.file.name + '</button>';
        });
        body.innerHTML = html;
        body.querySelectorAll('[data-cs-dl]').forEach(function (btn) {
          btn.onclick = function () {
            var it = items[parseInt(btn.getAttribute('data-cs-dl'), 10)];
            C.writeWorkbook(it.result.workbook, 'xlsx', C.safeFilename(it.file.name).replace(/\.[^.]+$/, '') + '_已转换.xlsx');
          };
        });
      }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }
  }

  // ============== 模块 C: 格式转换 ==============
  function bindConvert() {
    uploaders.convert = global.__UPLOADER.init('#conv-uploader', '#conv-file', '#conv-filelist', { multiple: true, onFiles: function () {} });
    var btn = document.getElementById('btn-conv-start');
    var btnClear = document.getElementById('btn-conv-clear');
    if (btn) btn.addEventListener('click', function () {
      var files = uploaders.convert ? uploaders.convert.getFiles() : [];
      if (!files.length) { C.toast('请先上传文件', 'warning'); return; }
      C.waitXLSX().then(function (ok) {
        if (!ok) return;
        var mode = document.querySelector('input[name="convMode"]:checked');
        var m = mode ? mode.value : 'xlsx2csv';
        var body = document.getElementById('conv-result-body');
        document.getElementById('conv-result').classList.remove('hidden');
        body.innerHTML = '<p>转换中...</p>';
        switch (m) {
          case 'xlsx2csv': doXlsx2Csv(files, body); break;
          case 'xlsx2json': doXlsx2Json(files, body); break;
          case 'xlsx2md': doXlsx2Md(files, body); break;
          case 'xlsx2html': doXlsx2Html(files, body); break;
          case 'csv2xlsx': doCsv2Xlsx(files, body); break;
          case 'json2xlsx': doJson2Xlsx(files, body); break;
          case 'xlsx2pdf': doXlsx2Pdf(files); break;
        }
      });
    });
    if (btnClear) btnClear.addEventListener('click', function () {
      if (uploaders.convert) uploaders.convert.clear();
      document.getElementById('conv-result').classList.add('hidden');
    });

    function doXlsx2Csv(files, body) {
      var sep = document.getElementById('conv-sep').value;
      Promise.all(files.map(function (f) { return global.__CONV.xlsxToCSVs(f, sep).then(function (items) { return { file: f, items: items }; }); }))
        .then(function (results) {
          var html = '<div class="result-summary">✅ Excel→CSV 完成</div>';
          results.forEach(function (res) {
            html += '<div style="margin:8px 0;"><b>' + res.file.name + '</b>：' + res.items.length + ' 个 sheet</div><div>';
            res.items.forEach(function (item) {
              html += '<button class="btn btn-ghost" style="margin:4px;" data-xlsx2csv="' + res.file.name + '|' + item.sheetName + '" data-csv-sep="' + sep + '" data-csv-text="' + encodeURIComponent(item.csv) + '">⬇ ' + item.sheetName + '.csv</button>';
            });
            html += '</div>';
          });
          body.innerHTML = html;
          body.querySelectorAll('[data-xlsx2csv]').forEach(function (btn) {
            btn.onclick = function () {
              var parts = btn.getAttribute('data-xlsx2csv').split('|');
              var text = decodeURIComponent(btn.getAttribute('data-csv-text'));
              var blob = new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' });
              C.downloadBlob(blob, C.safeFilename(parts[0]).replace(/\.[^.]+$/, '') + '_' + C.safeFilename(parts[1]) + '.csv');
            };
          });
        }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doXlsx2Json(files, body) {
      Promise.all(files.map(function (f) { return global.__CONV.xlsxToJSONs(f).then(function (items) { return { file: f, items: items }; }); }))
        .then(function (results) {
          var html = '<div class="result-summary">✅ Excel→JSON 完成</div>';
          results.forEach(function (res, idx) {
            html += '<div style="margin:8px 0;"><b>' + res.file.name + '</b></div><div>';
            res.items.forEach(function (item, i) {
              html += '<button class="btn btn-ghost" style="margin:4px;" data-dl-json="' + idx + '_' + i + '">⬇ ' + item.sheetName + '.json</button>';
            });
            html += '</div>';
          });
          body.innerHTML = html;
          body.querySelectorAll('[data-dl-json]').forEach(function (btn) {
            btn.onclick = function () {
              var ids = btn.getAttribute('data-dl-json').split('_');
              var res = results[parseInt(ids[0], 10)];
              var item = res.items[parseInt(ids[1], 10)];
              var blob = new Blob([JSON.stringify(item.json, null, 2)], { type: 'application/json;charset=utf-8' });
              C.downloadBlob(blob, C.safeFilename(res.file.name).replace(/\.[^.]+$/, '') + '_' + C.safeFilename(item.sheetName) + '.json');
            };
          });
        }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doXlsx2Md(files, body) {
      Promise.all(files.map(function (f) { return global.__CONV.xlsxToMarkdown(f).then(function (items) { return { file: f, items: items }; }); }))
        .then(function (results) {
          var html = '<div class="result-summary">✅ Excel→Markdown 完成</div>';
          results.forEach(function (res, idx) {
            html += '<div style="margin:8px 0;"><b>' + res.file.name + '</b>：' + res.items.length + ' 个 sheet</div><div>';
            res.items.forEach(function (item, i) {
              html += '<button class="btn btn-ghost" style="margin:4px;" data-dl-md="' + idx + '_' + i + '">⬇ ' + item.sheetName + '.md</button>';
            });
            html += '</div>';
          });
          body.innerHTML = html;
          body.querySelectorAll('[data-dl-md]').forEach(function (btn) {
            btn.onclick = function () {
              var ids = btn.getAttribute('data-dl-md').split('_');
              var res = results[parseInt(ids[0], 10)];
              var item = res.items[parseInt(ids[1], 10)];
              var blob = new Blob([item.markdown], { type: 'text/markdown;charset=utf-8' });
              C.downloadBlob(blob, C.safeFilename(res.file.name).replace(/\.[^.]+$/, '') + '_' + C.safeFilename(item.sheetName) + '.md');
            };
          });
        }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doXlsx2Html(files, body) {
      Promise.all(files.map(function (f) { return global.__CONV.xlsxToHTMLTable(f).then(function (t) { return { file: f, html: t }; }); }))
        .then(function (results) {
          var html = '<div class="result-summary">✅ Excel→HTML 完成</div>';
          results.forEach(function (it, i) {
            html += '<button class="btn btn-primary" style="margin:8px;" data-dl-html="' + i + '">⬇ 下载 ' + it.file.name + '.html</button>';
          });
          body.innerHTML = html;
          body.querySelectorAll('[data-dl-html]').forEach(function (btn) {
            btn.onclick = function () {
              var it = results[parseInt(btn.getAttribute('data-dl-html'), 10)];
              var full = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + it.file.name + '</title>' +
                '<style>body{font-family:sans-serif;padding:20px;}table{border-collapse:collapse;margin:10px 0;}' +
                'td,th{border:1px solid #ccc;padding:4px 8px;}th{background:#f0f7ff;}</style></head><body>' +
                it.html + '</body></html>';
              var blob = new Blob([full], { type: 'text/html;charset=utf-8' });
              C.downloadBlob(blob, C.safeFilename(it.file.name).replace(/\.[^.]+$/, '') + '.html');
            };
          });
        }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doCsv2Xlsx(files, body) {
      var sep = document.getElementById('conv-sep').value;
      Promise.all(files.map(function (f) { return global.__CONV.csvToXlsx(f, sep).then(function (r) { return { file: f, result: r }; }); }))
        .then(function (items) {
          var html = '<div class="result-summary">✅ CSV→Excel 完成</div>';
          items.forEach(function (it, i) {
            html += '<button class="btn btn-primary" style="margin:8px;" data-csv2xlsx-dl="' + i + '">⬇ 下载 ' + it.file.name + '.xlsx</button>';
          });
          body.innerHTML = html;
          body.querySelectorAll('[data-csv2xlsx-dl]').forEach(function (btn) {
            btn.onclick = function () {
              var it = items[parseInt(btn.getAttribute('data-csv2xlsx-dl'), 10)];
              C.writeWorkbook(it.result.workbook, 'xlsx', C.safeFilename(it.file.name).replace(/\.[^.]+$/, '') + '.xlsx');
            };
          });
        }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doJson2Xlsx(files, body) {
      Promise.all(files.map(function (f) { return global.__CONV.jsonToXlsx(f).then(function (r) { return { file: f, result: r }; }); }))
        .then(function (items) {
          var html = '<div class="result-summary">✅ JSON→Excel 完成</div>';
          items.forEach(function (it, i) {
            html += '<button class="btn btn-primary" style="margin:8px;" data-json2xlsx-dl="' + i + '">⬇ 下载 ' + it.file.name + '.xlsx</button>';
          });
          body.innerHTML = html;
          body.querySelectorAll('[data-json2xlsx-dl]').forEach(function (btn) {
            btn.onclick = function () {
              var it = items[parseInt(btn.getAttribute('data-json2xlsx-dl'), 10)];
              C.writeWorkbook(it.result.workbook, 'xlsx', C.safeFilename(it.file.name).replace(/\.[^.]+$/, '') + '.xlsx');
            };
          });
        }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doXlsx2Pdf(files) {
      (function loop(i) {
        if (i >= files.length) return;
        global.__CONV.xlsxToPDFView(files[i]).then(function () {
          if (i + 1 < files.length && confirm('已打开 ' + files[i].name + ' 的打印预览，是否继续下一个？')) loop(i + 1);
        }).catch(function (e) { C.toast(files[i].name + ' 失败：' + e.message, 'error'); });
      })(0);
    }
  }

  // ============== 模块 D: 辅助工具 ==============
  function bindHelper() {
    uploaders.helper = global.__UPLOADER.init('#helper-uploader', '#helper-file', '#helper-filelist', { multiple: true, onFiles: function () {} });
    var modeRadios = document.querySelectorAll('input[name="helperMode"]');
    function getMode() {
      for (var i = 0; i < modeRadios.length; i++) if (modeRadios[i].checked) return modeRadios[i].value;
      return 'date';
    }
    function showPanels() {
      var m = getMode();
      var panels = [
        { id: 'helper-date-panel', mode: 'date' },
        { id: 'helper-extract-panel', mode: 'extract' },
        { id: 'helper-size-panel', mode: 'size' },
        { id: 'helper-csvenc-panel', mode: 'csvenc' },
        { id: 'helper-meta-panel', mode: 'meta' },
        { id: 'helper-preview-panel', mode: 'preview' },
      ];
      panels.forEach(function (p) {
        var el = document.getElementById(p.id);
        if (el) el.classList.toggle('hidden', p.mode !== m);
      });
    }
    modeRadios.forEach(function (r) { r.addEventListener('change', showPanels); });
    showPanels();

    var btnStart = document.getElementById('btn-helper-start');
    var btnClear = document.getElementById('btn-helper-clear');
    if (btnStart) btnStart.addEventListener('click', function () {
      var files = uploaders.helper ? uploaders.helper.getFiles() : [];
      if (!files.length) { C.toast('请先上传文件', 'warning'); return; }
      var m = getMode();
      // CSV 编码不需要 SheetJS
      if (m === 'csvenc') {
        var body = document.getElementById('helper-result-body');
        document.getElementById('helper-result').classList.remove('hidden');
        doCsvEnc(files, body);
        return;
      }
      C.waitXLSX().then(function (ok) {
        if (!ok) return;
        var body = document.getElementById('helper-result-body');
        document.getElementById('helper-result').classList.remove('hidden');
        body.innerHTML = '<p>处理中...</p>';
        switch (m) {
          case 'date': doDateConv(files, body); break;
          case 'extract': doExtract(files, body); break;
          case 'size': doSize(files, body); break;
          case 'toc': doToc(files, body); break;
          case 'meta': doMeta(files, body); break;
          case 'preview': doPreview(files, body); break;
        }
      });
    });
    if (btnClear) btnClear.addEventListener('click', function () {
      if (uploaders.helper) uploaders.helper.clear();
      document.getElementById('helper-result').classList.add('hidden');
    });

    function parseColInput(val, f) {
      return C.readAsBuffer(f).then(function (buf) {
        var wb = C.readWorkbook(buf);
        var header = C.sheetToArray(wb.Sheets[wb.SheetNames[0]])[0] || [];
        return parseColRef(val, header);
      });
    }

    function doDateConv(files, body) {
      var fmt = document.getElementById('date-fmt').value;
      var colText = document.getElementById('date-col').value.trim();
      Promise.all(files.map(function (f) {
        return (colText ? parseColInput(colText, f) : Promise.resolve(-1)).then(function (colIdx) {
          return global.__HELPER.convertDate(f, colIdx, fmt);
        }).then(function (r) { return { file: f, result: r }; });
      })).then(function (items) {
        var html = '<div class="result-summary">✅ 日期格式转换完成</div>';
        items.forEach(function (it, i) {
          html += '<div class="result-summary" style="border-left-color:#22a75d;">' + it.file.name + '：转换 ' + (it.result.converted || 0) + ' 个单元格</div>';
          html += '<button class="btn btn-primary" style="margin:8px;" data-dl-date="' + i + '">⬇ 下载 ' + it.file.name + '</button>';
        });
        body.innerHTML = html;
        body.querySelectorAll('[data-dl-date]').forEach(function (btn) {
          btn.onclick = function () {
            var it = items[parseInt(btn.getAttribute('data-dl-date'), 10)];
            C.writeWorkbook(it.result.workbook, 'xlsx', C.safeFilename(it.file.name).replace(/\.[^.]+$/, '') + '_日期.xlsx');
          };
        });
      }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doExtract(files, body) {
      var mode = document.getElementById('extract-mode').value;
      var colText = document.getElementById('extract-col').value.trim();
      var n = parseInt(document.getElementById('extract-n').value, 10) || 3;
      Promise.all(files.map(function (f) {
        return (colText ? parseColInput(colText, f) : Promise.resolve(-1)).then(function (colIdx) {
          return global.__HELPER.extractText(f, { mode: mode, colIdx: colIdx, n: n }).then(function (r) { return { file: f, result: r }; });
        });
      })).then(function (items) {
        var html = '<div class="result-summary">✅ 文本提取完成</div>';
        items.forEach(function (it, i) {
          html += '<div class="result-summary" style="border-left-color:#22a75d;">' + it.file.name + '：提取 ' + (it.result.extracted || 0) + ' 个单元格</div>';
          html += '<button class="btn btn-primary" style="margin:8px;" data-dl-ex="' + i + '">⬇ 下载 ' + it.file.name + '</button>';
        });
        body.innerHTML = html;
        body.querySelectorAll('[data-dl-ex]').forEach(function (btn) {
          btn.onclick = function () {
            var it = items[parseInt(btn.getAttribute('data-dl-ex'), 10)];
            C.writeWorkbook(it.result.workbook, 'xlsx', C.safeFilename(it.file.name).replace(/\.[^.]+$/, '') + '_提取.xlsx');
          };
        });
      }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doSize(files, body) {
      var rh = parseFloat(document.getElementById('row-h').value) || 0;
      var cw = parseFloat(document.getElementById('col-w').value) || 0;
      Promise.all(files.map(function (f) { return global.__HELPER.uniformRowCol(f, rh, cw).then(function (r) { return { file: f, result: r }; }); }))
        .then(function (items) {
          var html = '<div class="result-summary">✅ 行高列宽设置完成</div>';
          items.forEach(function (it, i) {
            html += '<button class="btn btn-primary" style="margin:8px;" data-dl-sz="' + i + '">⬇ 下载 ' + it.file.name + '</button>';
          });
          body.innerHTML = html;
          body.querySelectorAll('[data-dl-sz]').forEach(function (btn) {
            btn.onclick = function () {
              var it = items[parseInt(btn.getAttribute('data-dl-sz'), 10)];
              C.writeWorkbook(it.result.workbook, 'xlsx', C.safeFilename(it.file.name).replace(/\.[^.]+$/, '') + '_尺寸.xlsx');
            };
          });
        }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doToc(files, body) {
      Promise.all(files.map(function (f) { return global.__HELPER.buildToc(f).then(function (r) { return { file: f, result: r }; }); }))
        .then(function (items) {
          var html = '<div class="result-summary">✅ 工作表目录生成完成</div>';
          items.forEach(function (it, i) {
            html += '<div class="result-summary" style="border-left-color:#22a75d;">' + it.file.name + '：共 ' + (it.result.sheetCount || 0) + ' 个工作表</div>';
            html += '<button class="btn btn-primary" style="margin:8px;" data-dl-toc="' + i + '">⬇ 下载（含目录） ' + it.file.name + '</button>';
          });
          body.innerHTML = html;
          body.querySelectorAll('[data-dl-toc]').forEach(function (btn) {
            btn.onclick = function () {
              var it = items[parseInt(btn.getAttribute('data-dl-toc'), 10)];
              C.writeWorkbook(it.result.workbook, 'xlsx', C.safeFilename(it.file.name).replace(/\.[^.]+$/, '') + '_目录.xlsx');
            };
          });
        }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doCsvEnc(files, body) {
      var mode = document.getElementById('csvenc-dir').value;
      Promise.all(files.map(function (f) { return global.__HELPER.csvEncConvert(f, mode).then(function (r) { return { file: f, result: r }; }); }))
        .then(function (items) {
          var html = '<div class="result-summary">✅ CSV 编码转换完成</div>';
          items.forEach(function (it, i) {
            html += '<div class="result-summary" style="border-left-color:#22a75d;">' + it.file.name + ' → ' + it.result.outputName + '</div>';
            html += '<button class="btn btn-primary" style="margin:8px;" data-dl-ce="' + i + '">⬇ 下载</button>';
          });
          body.innerHTML = html;
          body.querySelectorAll('[data-dl-ce]').forEach(function (btn) {
            btn.onclick = function () {
              var it = items[parseInt(btn.getAttribute('data-dl-ce'), 10)];
              C.downloadBlob(it.result.blob, it.result.outputName);
            };
          });
        }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doMeta(files, body) {
      Promise.all(files.map(function (f) { return global.__HELPER.metaInfo(f).then(function (r) { return { file: f, result: r }; }); }))
        .then(function (items) {
          var html = '<div class="result-summary">✅ 元信息查看完成</div>';
          items.forEach(function (it) {
            html += '<div class="panel" style="margin:12px 0;padding:12px 16px;">';
            html += '<h3 style="margin:0 0 8px 0;">' + it.file.name + '（' + C.fmtSize(it.file.size) + '）</h3>';
            html += '<table class="preview-table" style="margin-top:0;"><thead><tr>';
            var header = it.result.rows[0];
            for (var c = 0; c < header.length; c++) html += '<th>' + header[c] + '</th>';
            html += '</tr></thead><tbody>';
            for (var r = 1; r < it.result.rows.length; r++) {
              html += '<tr>';
              for (var c = 0; c < it.result.rows[r].length; c++) html += '<td>' + (it.result.rows[r][c] != null ? String(it.result.rows[r][c]) : '') + '</td>';
              html += '</tr>';
            }
            html += '</tbody></table></div>';
          });
          body.innerHTML = html;
        }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }

    function doPreview(files, body) {
      var rowsN = parseInt(document.getElementById('preview-rows').value, 10) || 20;
      var colsN = parseInt(document.getElementById('preview-cols').value, 10) || 0;
      Promise.all(files.map(function (f) { return global.__HELPER.quickPreview(f, { rows: rowsN, cols: colsN }).then(function (r) { return { file: f, result: r }; }); }))
        .then(function (items) {
          var html = '<div class="result-summary">✅ 预览生成完成（仅前 ' + rowsN + ' 行）</div>';
          items.forEach(function (it) {
            html += '<div class="panel" style="margin:12px 0;padding:12px 16px;">';
            html += '<h3 style="margin:0 0 8px 0;">' + it.file.name + '（' + C.fmtSize(it.file.size) + '）</h3>';
            it.result.sheets.forEach(function (sheet) {
              html += '<div style="margin:8px 0;"><b>表：</b>' + sheet.sheetName + '（全表 ' + sheet.totalRows + ' 行）</div>';
              html += '<div style="overflow-x:auto;"><table class="preview-table" style="margin-top:0;">';
              if (sheet.rows && sheet.rows.length) {
                for (var r = 0; r < sheet.rows.length; r++) {
                  html += (r === 0 ? '<thead>' : '') + '<tr>';
                  for (var c = 0; c < sheet.rows[r].length; c++) {
                    html += (r === 0 ? '<th>' : '<td>') + (sheet.rows[r][c] == null ? '' : String(sheet.rows[r][c]).replace(/</g, '&lt;')) + (r === 0 ? '</th>' : '</td>');
                  }
                  html += '</tr>' + (r === 0 ? '</thead><tbody>' : '');
                }
                html += '</tbody>';
              }
              html += '</table></div>';
            });
            html += '</div>';
          });
          body.innerHTML = html;
        }).catch(function (e) { body.innerHTML = '<div class="result-summary" style="border-left-color:#e8572a;">❌ 失败：' + e.message + '</div>'; });
    }
  }

  // ============== 启动 ==============
  function init() {
    bindNav();
    bindTutorial();
    renderFAQ();
    bindCrypto();
    bindData();
    bindConvert();
    bindHelper();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);