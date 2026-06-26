// assets/live.js
// 实时数据接入层：把后端 YOLO 推理结果（/api/stats、/api/alerts、SSE）灌入前端界面
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var success = style.getPropertyValue('--success').trim();
  var warning = style.getPropertyValue('--warning').trim();
  var danger = style.getPropertyValue('--danger').trim();

  function $(id) { return document.getElementById(id); }
  function fmt(n) { return Number(n || 0).toLocaleString(); }

  // --------------------------------------------------------------- //
  //  1. 模式标识
  // --------------------------------------------------------------- //
  function setMode(mode, model) {
    var chip = $('mode-chip');
    if (!chip) return;
    if (mode === 'simulation') {
      chip.textContent = 'SIM 模拟推理';
      chip.style.color = warning;
      chip.style.borderColor = 'rgba(245,158,11,0.35)';
      chip.style.background = 'rgba(245,158,11,0.1)';
    } else {
      chip.textContent = 'YOLO LIVE · ' + (model || 'yolo11n');
      chip.style.color = accent;
      chip.style.borderColor = 'rgba(0,240,255,0.35)';
      chip.style.background = 'rgba(0,240,255,0.1)';
    }
  }

  fetch('/api/health').then(function(r) { return r.json(); }).then(function(d) {
    setMode(d.mode, d.model);
  }).catch(function() {
    setMode('simulation', 'offline');
  });

  // --------------------------------------------------------------- //
  //  2. 实时统计轮询（1s）
  // --------------------------------------------------------------- //
  var lastTotal = 0;
  var lastDetections = [];

  function refreshStats() {
    fetch('/api/stats', { cache: 'no-store' })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var s = d.summary || {};

        // 统计卡片
        if ($('stat-total')) $('stat-total').textContent = fmt(s.total_scanned);
        if ($('stat-passrate')) $('stat-passrate').textContent = (s.pass_rate || 0) + '%';
        if ($('stat-alerts')) $('stat-alerts').textContent = fmt(s.total_alerts);
        if ($('stat-queue')) $('stat-queue').textContent = d.queue || 0;

        // 监控信息行：显示当前帧检测到的目标
        var dets = d.current_detections || [];
        lastDetections = dets;
        var detEl = $('monitor-detect');
        if (detEl) {
          var alerts = dets.filter(function(x) { return x.is_alert; });
          if (dets.length === 0) {
            detEl.textContent = 'AI DETECT: 扫描中 · 暂无目标';
            detEl.style.color = success;
          } else {
            var labels = dets.map(function(x) {
              return x.label + ' ' + Math.round(x.confidence * 100) + '%';
            }).join(' | ');
            detEl.textContent = 'AI DETECT: ' + labels;
            detEl.style.color = alerts.length ? danger : accent;
          }
        }

        // 更新「安检类型分布」饼图
        if (window.SecGateCharts && dets.length) {
          window.SecGateCharts.updateType(dets);
        }

        // 更新通道通过数
        updateChannels(d.channels || []);

        // 队列刷新：每累计检测一定数量刷新一次
        if (s.total_scanned !== lastTotal) {
          lastTotal = s.total_scanned;
          updateQueue(dets, s);
        }
      }).catch(function() { /* 离线静默 */ });
  }

  function updateChannels(channels) {
    var items = document.querySelectorAll('.channel-item');
    channels.forEach(function(ch, i) {
      if (!items[i]) return;
      var meta = items[i].querySelector('.channel-meta');
      if (meta) {
        var stTxt = ch.status === 'online' ? '在线' :
                    ch.status === 'standby' ? '待机' : '离线';
        meta.textContent = ch.equipment + ' | 通过 ' + ch.passed + ' · ' + stTxt;
      }
      var dot = items[i].querySelector('.channel-status-dot');
      if (dot) {
        dot.className = 'channel-status-dot ' + (
          ch.status === 'online' ? 'green' :
          ch.status === 'standby' ? 'orange' : 'red');
      }
    });
  }

  // 旅客编号滚动
  var passengerId = 2847;
  function updateQueue(dets, s) {
    var ql = $('queue-list');
    if (!ql) return;
    var html = '';

    // 第一项：正在扫描（基于当前帧检测）
    var scanningLabel = (dets.length
      ? dets.map(function(x){return x.label;}).join('/')
      : '行李扫描中');
    var scanningAlert = dets.some(function(x){return x.is_alert;});
    passengerId = Math.max(passengerId, s.total_scanned + 2847);
    html += queueItem('scanning', '&#x1F9D1;', '旅客 #' + (passengerId + 1),
      'A通道 | ' + scanningLabel, 'pending', '扫描中');

    // 第二项：刚完成（有告警则拦截，否则通过）
    if (dets.length) {
      var hasAlert = dets.some(function(x){return x.is_alert;});
      html += queueItem('', '&#x1F468;', '旅客 #' + passengerId,
        'A通道 | ' + (hasAlert ? '禁品检出' : '安检通过'),
        hasAlert ? 'fail' : 'pass', hasAlert ? '拦截' : '通过');
    } else {
      html += queueItem('', '&#x1F469;', '旅客 #' + passengerId,
        'B通道 | 身份验证', 'pass', '通过');
    }

    // 其余占位项
    html += queueItem('', '&#x1F468;', '旅客 #' + (passengerId - 1),
      'C通道 | VIP快速', 'pass', '通过');
    html += queueItem('', '&#x1F9D1;', '旅客 #' + (passengerId - 2),
      'B通道 | 人工复检', 'check', '复检');
    html += queueItem('', '&#x1F469;', '旅客 #' + (passengerId - 3),
      'A通道 | 随身行李', 'pass', '通过');

    ql.innerHTML = html;
  }

  function queueItem(avatarCls, icon, name, detail, resultCls, resultTxt) {
    return '' +
      '<div class="queue-item">' +
        '<div class="queue-avatar ' + avatarCls + '">' + icon + '</div>' +
        '<div class="queue-info">' +
          '<div class="queue-name">' + name + '</div>' +
          '<div class="queue-detail">' + detail + '</div>' +
        '</div>' +
        '<div class="queue-result ' + resultCls + '">' + resultTxt + '</div>' +
      '</div>';
  }

  // --------------------------------------------------------------- //
  //  3. SSE 告警推送
  // --------------------------------------------------------------- //
  function startSSE() {
    if (!window.EventSource) {
      console.warn('浏览器不支持 SSE，告警将仅通过轮询呈现');
      return;
    }
    var es = new EventSource('/api/alerts');

    es.addEventListener('hello', function() {
      console.log('[SSE] 已连接，等待告警事件…');
    });

    es.addEventListener('alert', function(e) {
      try {
        var a = JSON.parse(e.data);
        prependAlert(a);
      } catch (err) { /* ignore */ }
    });

    es.onerror = function() {
      // 断线后 3s 自动重连（EventSource 默认也会重连，这里仅打日志）
      console.warn('[SSE] 连接异常，将自动重连…');
    };
  }

  function prependAlert(a) {
    var list = $('alert-list');
    if (!list) return;

    var isCritical = a.level === 'critical';
    var item = document.createElement('div');
    item.className = 'alert-item' + (isCritical ? ' critical' : '');
    item.innerHTML =
      '<div class="alert-icon ' + (isCritical ? 'danger' : 'warning') + '">' +
        (isCritical ? '&#x26D4;' : '&#x26A0;') + '</div>' +
      '<div class="alert-content">' +
        '<div class="alert-title">' + (isCritical ? '违禁品拦截' : '可疑物品告警') +
          ' · ' + a.label + '</div>' +
        '<div class="alert-desc">YOLO 检测到 ' + a.label +
          '，置信度 ' + Math.round(a.confidence * 100) + '%，已自动拦截并通知人工复检</div>' +
      '</div>' +
      '<div class="alert-time">刚刚</div>';

    // 清除初始占位项
    var placeholder = list.querySelector('.alert-item');
    if (placeholder && placeholder.querySelector('.alert-title') &&
        placeholder.querySelector('.alert-title').textContent.indexOf('系统就绪') >= 0) {
      list.innerHTML = '';
    }

    list.insertBefore(item, list.firstChild);

    // 限制最多 8 条
    while (list.children.length > 8) {
      list.removeChild(list.lastChild);
    }
  }

  // --------------------------------------------------------------- //
  //  启动
  // --------------------------------------------------------------- //
  refreshStats();
  setInterval(refreshStats, 1000);
  startSSE();

})();
