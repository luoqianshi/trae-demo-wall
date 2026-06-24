(function () {
  'use strict';

  const els = {
    portSelect: document.getElementById('portSelect'),
    scanBtn: document.getElementById('scanBtn'),
    connectBtn: document.getElementById('connectBtn'),
    disconnectBtn: document.getElementById('disconnectBtn'),
    baudSelect: document.getElementById('baudSelect'),
    autoRefresh: document.getElementById('autoRefresh'),
    manualRefresh: document.getElementById('manualRefresh'),
    portStatus: document.getElementById('portStatus'),
    portLed: document.querySelector('#portStatus .led'),
    portStatusLabel: document.querySelector('#portStatus .chip-label'),
    countdown: document.getElementById('countdown'),
    rxCount: document.getElementById('rxCount'),
    rawLog: document.getElementById('rawLog'),
    clearRaw: document.getElementById('clearRaw'),
    dataTable: document.getElementById('dataTable'),
    tableHead: document.getElementById('tableHead'),
    tableBody: document.getElementById('tableBody'),
    emptyState: document.getElementById('emptyState'),
    recordCount: document.getElementById('recordCount'),
    clearTable: document.getElementById('clearTable'),
    exportBtn: document.getElementById('exportBtn'),
    mockBtn: document.getElementById('mockBtn'),
    toast: document.getElementById('toast'),
  };

  const state = {
    port: null,
    reader: null,
    inputStream: null,
    connected: false,
    rxCount: 0,
    records: [],
    columns: new Set(['__id', '__time']),
    buffer: '',
    refreshTimer: null,
    countdownTimer: null,
    countdown: 10,
    recordId: 0,
    refreshId: 0,
  };

  const MAX_RECORDS = 500;

  /* ====== Toast ====== */
  let toastTimer = null;
  function toast(msg, type = 'info') {
    els.toast.className = 'toast show ' + type;
    els.toast.innerHTML = `<div class="toast-title">${type === 'success' ? 'SUCCESS' : type === 'error' ? 'ERROR' : type === 'warn' ? 'WARNING' : 'INFO'}</div><div>${msg}</div>`;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.className = 'toast';
    }, 3200);
  }

  /* ====== Logging ====== */
  function addLog(text, tag = 'info') {
    if (els.rawLog.querySelector('.empty')) {
      els.rawLog.innerHTML = '';
    }
    const now = new Date();
    const ts = now.toTimeString().slice(0, 8);
    const line = document.createElement('div');
    line.className = 'log-line';
    const tagClass = tag === 'ok' ? 'tag-ok' : tag === 'err' ? 'tag-err' : 'tag-info';
    line.innerHTML = `<span class="ts">${ts}</span><span class="${tagClass}">›</span> ${escapeHtml(text)}`;
    els.rawLog.appendChild(line);
    while (els.rawLog.children.length > 500) {
      els.rawLog.removeChild(els.rawLog.firstChild);
    }
    els.rawLog.scrollTop = els.rawLog.scrollHeight;
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = String(s);
    return div.innerHTML;
  }

  /* ====== Port scan ====== */
  function isSerialSupported() {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  async function scanPorts() {
    if (!isSerialSupported()) {
      toast('当前浏览器不支持 Web Serial API,请使用 Chrome / Edge', 'error');
      return;
    }
    try {
      const ports = await navigator.serial.getPorts();
      populatePortSelect(ports);
      toast(`发现 ${ports.length} 个已授权端口`, 'success');
      addLog(`扫描完成,检测到 ${ports.length} 个已授权串口`, 'info');
      if (ports.length === 0) {
        addLog('无已授权端口。点击"连接"按钮可手动授权新端口', 'warn');
      }
    } catch (err) {
      addLog('扫描失败: ' + err.message, 'err');
      toast('扫描失败: ' + err.message, 'error');
    }
  }

  function populatePortSelect(ports) {
    els.portSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = ports.length === 0
      ? '-- 未检测到已授权端口,请点击连接按钮授权 --'
      : '-- 选择端口 --';
    els.portSelect.appendChild(placeholder);

    ports.forEach((port, idx) => {
      const info = port.getInfo ? port.getInfo() : {};
      const vid = info.usbVendorId != null ? info.usbVendorId.toString(16).padStart(4, '0') : '----';
      const pid = info.usbProductId != null ? info.usbProductId.toString(16).padStart(4, '0') : '----';
      const label = `端口 ${idx + 1}  (VID:${vid} PID:${pid})`;
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = label;
      opt._port = port;
      els.portSelect.appendChild(opt);
    });

    els.connectBtn.disabled = false;
  }

  async function requestPort() {
    if (!isSerialSupported()) {
      toast('当前浏览器不支持 Web Serial API', 'error');
      return null;
    }
    try {
      const port = await navigator.serial.requestPort();
      addLog('用户授权了新串口', 'ok');
      return port;
    } catch (err) {
      addLog('授权取消或失败: ' + err.message, 'err');
      return null;
    }
  }

  /* ====== Connect / Disconnect ====== */
  async function connect() {
    if (state.connected) return;
    let port = null;

    const selected = els.portSelect.options[els.portSelect.selectedIndex];
    if (selected && selected._port) {
      port = selected._port;
    } else {
      port = await requestPort();
      if (!port) return;
      const ports = await navigator.serial.getPorts();
      populatePortSelect(ports);
      const idx = Array.from(els.portSelect.options).findIndex(o => o._port === port);
      if (idx >= 0) els.portSelect.selectedIndex = idx;
    }

    try {
      const baud = parseInt(els.baudSelect.value, 10);
      await port.open({ baudRate: baud });
      state.port = port;
      state.connected = true;

      port.addEventListener('disconnect', () => {
        addLog('串口已断开连接', 'err');
        disconnect(true);
      });

      updateStatusUI();
      addLog(`已连接 @ ${baud} bps`, 'ok');
      toast('串口连接成功', 'success');

      readLoop();
      startAutoRefresh();
    } catch (err) {
      addLog('连接失败: ' + err.message, 'err');
      toast('连接失败: ' + err.message, 'error');
    }
  }

  async function disconnect(silent = false) {
    if (!state.connected) return;
    try {
      if (state.reader) {
        try { state.reader.cancel(); } catch (_) {}
        state.reader = null;
      }
      if (state.inputStream) {
        try { await state.inputStream.getReader().closed; } catch (_) {}
      }
      if (state.port) {
        try { await state.port.close(); } catch (_) {}
      }
    } catch (_) {}
    state.port = null;
    state.connected = false;
    state.buffer = '';
    stopAutoRefresh();
    updateStatusUI();
    if (!silent) {
      addLog('已断开串口', 'info');
      toast('已断开连接', 'info');
    }
  }

  function updateStatusUI() {
    if (state.connected) {
      els.portStatus.classList.add('active');
      els.portLed.classList.remove('led-off');
      els.portLed.classList.add('led-on');
      els.portStatusLabel.textContent = '已连接 · ' + els.baudSelect.value + 'bps';
      els.connectBtn.disabled = true;
      els.disconnectBtn.disabled = false;
      els.portSelect.disabled = true;
      els.baudSelect.disabled = true;
      els.scanBtn.disabled = true;
    } else {
      els.portStatus.classList.remove('active');
      els.portLed.classList.remove('led-on');
      els.portLed.classList.add('led-off');
      els.portStatusLabel.textContent = '未连接';
      els.connectBtn.disabled = els.portSelect.options.length <= 1;
      els.disconnectBtn.disabled = true;
      els.portSelect.disabled = false;
      els.baudSelect.disabled = false;
      els.scanBtn.disabled = false;
      els.countdown.textContent = '10s';
    }
  }

  /* ====== Read loop ====== */
  async function readLoop() {
    if (!state.port) return;
    try {
      const decoder = new TextDecoder('utf-8', { stream: true });
      while (state.port.readable) {
        const reader = state.port.readable.getReader();
        state.reader = reader;
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            handleChunk(chunk);
          }
        } catch (err) {
          if (err.name === 'AbortError') break;
          addLog('读取异常: ' + err.message, 'err');
        } finally {
          try { reader.releaseLock(); } catch (_) {}
        }
      }
    } catch (err) {
      addLog('读取循环终止: ' + err.message, 'err');
    }
  }

  function handleChunk(chunk) {
    state.buffer += chunk;
    state.rxCount += chunk.length;
    els.rxCount.textContent = state.rxCount;

    const lines = state.buffer.split(/\r?\n/);
    state.buffer = lines.pop();

    for (const raw of lines) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      processLine(trimmed);
    }
  }

  function processLine(line) {
    addLog(line, 'info');
    try {
      const parsed = tryParseJson(line);
      if (parsed === null) return;

      const items = unwrapArray(parsed);
      if (!items.length) return;

      for (const obj of items) {
        if (obj !== null && typeof obj === 'object') {
          addRecord(obj);
        }
      }
    } catch (_) {}
  }

  function tryParseJson(s) {
    s = s.trim();
    try {
      return JSON.parse(s);
    } catch (_) {
      const first = s.indexOf('{');
      const last = s.lastIndexOf('}');
      if (first !== -1 && last !== -1 && last > first) {
        try { return JSON.parse(s.slice(first, last + 1)); } catch (_) {}
      }
      const aFirst = s.indexOf('[');
      const aLast = s.lastIndexOf(']');
      if (aFirst !== -1 && aLast !== -1 && aLast > aFirst) {
        try { return JSON.parse(s.slice(aFirst, aLast + 1)); } catch (_) {}
      }
      return null;
    }
  }

  function unwrapArray(parsed) {
    if (Array.isArray(parsed)) {
      const result = [];
      for (const item of parsed) {
        if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
          result.push(item);
        } else {
          result.push(item);
        }
      }
      return result;
    }
    return [parsed];
  }

  /* ====== Records & Table ====== */
  function addRecord(obj) {
    state.recordId += 1;
    const record = {
      __id: state.recordId,
      __time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      __data: obj,
    };

    const flat = flatten(obj);
    record.__flat = flat;

    Object.keys(flat).forEach(k => state.columns.add(k));

    state.records.unshift(record);
    if (state.records.length > MAX_RECORDS) {
      state.records = state.records.slice(0, MAX_RECORDS);
    }

    renderTable();
  }

  function flatten(obj, prefix = '') {
    const out = {};
    if (obj === null || obj === undefined) {
      out[prefix] = '';
      return out;
    }
    if (typeof obj !== 'object') {
      out[prefix] = obj;
      return out;
    }
    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        out[prefix] = '[]';
        return out;
      }
      const allObjects = obj.every(i => i !== null && typeof i === 'object' && !Array.isArray(i));
      if (allObjects) {
        obj.forEach((item, idx) => {
          const key = prefix ? `${prefix}[${idx}]` : `[${idx}]`;
          Object.assign(out, flatten(item, key));
        });
        out[prefix + '.__length'] = obj.length;
      } else {
        out[prefix] = JSON.stringify(obj);
      }
      return out;
    }
    for (const k of Object.keys(obj)) {
      const key = prefix ? prefix + '.' + k : k;
      const v = obj[k];
      if (v !== null && typeof v === 'object') {
        Object.assign(out, flatten(v, key));
      } else {
        out[key] = v;
      }
    }
    return out;
  }

  function renderTable() {
    const cols = Array.from(state.columns);
    const priorityOrder = ['__id', '__time'];
    const lengthCols = cols.filter(c => c.endsWith('.__length'));
    const rest = cols
      .filter(c => !priorityOrder.includes(c) && !lengthCols.includes(c))
      .sort();
    const ordered = [...priorityOrder, ...rest, ...lengthCols];

    els.tableHead.innerHTML = '';
    ordered.forEach(c => {
      const th = document.createElement('th');
      th.textContent = c;
      if (c.endsWith('.__length')) {
        th.style.fontSize = '10px';
        th.style.color = 'var(--text-mute)';
      }
      els.tableHead.appendChild(th);
    });

    els.tableBody.innerHTML = '';
    state.records.forEach(rec => {
      const tr = document.createElement('tr');
      ordered.forEach(col => {
        const td = document.createElement('td');
        let val;
        if (col === '__id') {
          val = rec.__id;
          td.className = 'cell-index';
        } else if (col === '__time') {
          val = rec.__time;
          td.className = 'cell-timestamp';
        } else {
          const v = rec.__flat[col];
          val = formatCellValue(v);
          td.className = getCellClass(v);
          if (col.endsWith('.__length')) {
            td.style.color = 'var(--text-mute)';
            td.style.fontSize = '11px';
          }
        }
        td.textContent = val;
        tr.appendChild(td);
      });
      els.tableBody.appendChild(tr);
    });

    els.recordCount.textContent = state.records.length + ' 条记录';
    els.emptyState.classList.toggle('hidden', state.records.length > 0);
  }

  function formatCellValue(v) {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'string') return v;
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) return String(v);
      const s = String(v);
      if (s.indexOf('e') === -1 && s.indexOf('E') === -1) return s;
      if (v >= 1e21) return v.toFixed(0);
      const match = /\.(\d+)e[+-]/.exec(s);
      if (match) {
        const decimals = match[1].length;
        return v.toFixed(decimals);
      }
      return v.toFixed(0);
    }
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    return JSON.stringify(v);
  }

  function getCellClass(v) {
    if (v === null || v === undefined) return '';
    const t = typeof v;
    if (t === 'number') return 'cell-number';
    if (t === 'boolean') return 'cell-boolean';
    if (t === 'string') return 'cell-string';
    if (t === 'object') return Array.isArray(v) ? 'cell-array' : 'cell-object';
    return '';
  }

  /* ====== Auto refresh ====== */
  function startAutoRefresh() {
    stopAutoRefresh();
    state.countdown = 10;
    els.countdown.textContent = '10s';
    state.countdownTimer = setInterval(() => {
      state.countdown -= 1;
      if (state.countdown <= 0) {
        state.countdown = 10;
      }
      els.countdown.textContent = state.countdown + 's';
    }, 1000);

    state.refreshTimer = setInterval(() => {
      if (els.autoRefresh.checked) {
        triggerRefresh();
      }
    }, 10000);
  }

  function stopAutoRefresh() {
    if (state.refreshTimer) { clearInterval(state.refreshTimer); state.refreshTimer = null; }
    if (state.countdownTimer) { clearInterval(state.countdownTimer); state.countdownTimer = null; }
    state.countdown = 10;
  }

  function triggerRefresh() {
    state.refreshId += 1;
    state.countdown = 10;
    els.countdown.textContent = '10s';
    addLog(`自动刷新 #${state.refreshId} · 已接收 ${state.rxCount} 字节 · ${state.records.length} 条记录`, 'ok');
    toast(`自动刷新完成 · ${state.records.length} 条记录`, 'success');
    renderTable();
  }

  /* ====== Export ====== */
  function exportJson() {
    if (state.records.length === 0) {
      toast('暂无数据可导出', 'warn');
      return;
    }
    const payload = state.records.map(r => ({
      id: r.__id,
      time: r.__time,
      data: r.__data,
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serial-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('数据导出成功', 'success');
  }

  /* ====== Event bindings ====== */
  els.scanBtn.addEventListener('click', scanPorts);
  els.connectBtn.addEventListener('click', connect);
  els.disconnectBtn.addEventListener('click', () => disconnect(false));
  els.clearRaw.addEventListener('click', () => {
    els.rawLog.innerHTML = '<span class="empty">日志已清空,等待串口数据...</span>';
  });
  els.clearTable.addEventListener('click', () => {
    state.records = [];
    state.columns = new Set(['__id', '__time']);
    state.recordId = 0;
    renderTable();
    toast('数据表已清空', 'info');
  });
  els.exportBtn.addEventListener('click', exportJson);
  els.mockBtn.addEventListener('click', () => {
    const sample = '[{"host":202601073,"pole":10002,"gid":0,"pwr":{"bat_V":12.178},"slaves":[{"id":1,"hum":18},{"id":2,"hum":22},{"id":3,"hum":15}]}]';
    processLine(sample);
    state.rxCount += sample.length;
    els.rxCount.textContent = state.rxCount;
    toast('已注入模拟数据', 'success');
  });
  els.manualRefresh.addEventListener('click', triggerRefresh);
  els.autoRefresh.addEventListener('change', (e) => {
    if (e.target.checked && state.connected) {
      startAutoRefresh();
      toast('自动刷新已开启', 'success');
    } else {
      stopAutoRefresh();
      els.countdown.textContent = '10s';
      toast('自动刷新已关闭', 'warn');
    }
  });

  window.addEventListener('beforeunload', async () => {
    if (state.connected) {
      try { await disconnect(true); } catch (_) {}
    }
  });

  /* ====== Initial ====== */
  addLog('SerialWatch 初始化完成', 'ok');
  if (!isSerialSupported()) {
    addLog('浏览器不支持 Web Serial API,请使用 Chrome / Edge 浏览器', 'err');
    toast('浏览器不支持 Web Serial API', 'error');
  } else {
    addLog('提示: 点击"扫描"查看已授权端口,或直接点击"连接"授权新端口', 'info');
    scanPorts();
  }
})();
