/**
 * cards.js — 卡片渲染
 * 将数据渲染为可视化卡片，嵌入聊天流中
 */
var Cards = (function() {
  'use strict';

  // ===== 卡片容器 =====

  function createCardWrapper(type) {
    var card = document.createElement('div');
    card.className = 'card card-' + type;
    card.setAttribute('data-card-type', type);
    return card;
  }

  // ===== 今日时间线 =====

  function renderTimeline() {
    var card = createCardWrapper('timeline');
    var allEvents = LTStorage.getTodayEvents();
    // 只展示已完成的工作/休息段，过滤掉 work_start 和 rest_start 中间状态
    var events = allEvents.filter(function(e) {
      return e.type === 'work' || e.type === 'rest';
    });
    var stats = computeStats(events);

    if (events.length === 0) {
      card.innerHTML = [
        '<div class="card-header">',
        '  <span class="card-title">📊 今日数据</span>',
        '  <span class="card-date">' + TimeService.today() + '</span>',
        '</div>',
        '<div class="card-empty">',
        '  <p>今天还没有记录呢～</p>',
        '  <p class="card-hint">点击「💼 开始工作」开始记录吧</p>',
        '</div>'
      ].join('');
      return card;
    }

    // 统计摘要
    var summaryHtml = [
      '<div class="card-header">',
      '  <span class="card-title">📊 今日数据</span>',
      '  <span class="card-date">' + TimeService.today() + '</span>',
      '</div>',
      '<div class="card-stats">',
      '  <div class="stat-item">',
      '    <span class="stat-value">' + TimeService.durationString(stats.totalWorkMinutes) + '</span>',
      '    <span class="stat-label">工作时长</span>',
      '  </div>',
      '  <div class="stat-item">',
      '    <span class="stat-value">' + stats.restCount + '次</span>',
      '    <span class="stat-label">休息次数</span>',
      '  </div>',
      '  <div class="stat-item">',
      '    <span class="stat-value">' + (stats.avgEfficiency ? stats.avgEfficiency + '分' : '--') + '</span>',
      '    <span class="stat-label">平均效率</span>',
      '  </div>',
      '</div>'
    ].join('');

    // 时间线
    var timelineHtml = '<div class="card-timeline">';
    events.forEach(function(e, i) {
      var isWork = e.type === 'work';
      var cls = isWork ? 'tl-work' : 'tl-rest';
      var icon = isWork ? '💼' : '☕';
      var label = isWork ? '工作' : '休息';
      var duration = TimeService.durationString(e.duration || 0);
      var time = (e.startTime || '') + ' - ' + (e.endTime || '');

      var meta = '';
      if (isWork && e.metadata) {
        var parts = [];
        if (e.metadata.activity) {
          parts.push(e.metadata.activity);
        }
        if (e.metadata.efficiency) {
          parts.push('效率 ' + e.metadata.efficiency + '分');
        }
        if (parts.length > 0) {
          meta = '<span class="tl-meta">' + parts.join(' · ') + '</span>';
        }
      }

      timelineHtml += [
        '<div class="tl-item ' + cls + '">',
        '  <div class="tl-dot"></div>',
        '  <div class="tl-content">',
        '    <div class="tl-top">',
        '      <span class="tl-icon">' + icon + '</span>',
        '      <span class="tl-label">' + label + '</span>',
        '      <span class="tl-duration">' + duration + '</span>',
        '    </div>',
        '    <div class="tl-time">' + time + '</div>',
        '    ' + meta,
        '  </div>',
        '</div>'
      ].join('');
    });
    timelineHtml += '</div>';

    card.innerHTML = summaryHtml + timelineHtml;
    return card;
  }

  // ===== 效率热力图 =====

  function renderHeatmap() {
    var card = createCardWrapper('heatmap');
    var events = LTStorage.getWeekEvents(7);
    var days = groupEventsByDay(events);

    var dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    var hours = [];
    for (var h = 6; h <= 23; h++) hours.push(h);

    // 构建热力图数据
    var heatData = {};
    var dayKeys = [];

    for (var d = 6; d >= 0; d--) {
      var date = TimeService.daysAgo(d);
      dayKeys.push(date);
      heatData[date] = {};
      for (var h = 6; h <= 23; h++) {
        heatData[date][h] = 0;
      }
    }

    events.forEach(function(e) {
      if (!heatData[e.date]) return;
      var startH = e.startHour || 0;
      var endH = e.endHour || 0;
      for (var h = startH; h <= endH && h <= 23; h++) {
        if (h >= 6 && e.type === 'work') {
          heatData[e.date][h] = Math.min(heatData[e.date][h] + 1, 4);
        }
      }
    });

    // 渲染
    var html = [
      '<div class="card-header">',
      '  <span class="card-title">🔥 效率热力图</span>',
      '  <span class="card-subtitle">近7天工作时段分布</span>',
      '</div>',
      '<div class="heatmap-grid">',
      '  <div class="heatmap-header">',
      '    <div class="heatmap-label"></div>'
    ];

    hours.forEach(function(h) {
      html.push('    <div class="heatmap-col-label">' + h + ':00</div>');
    });

    html.push('  </div>');

    dayKeys.forEach(function(date, idx) {
      html.push('  <div class="heatmap-row">');
      html.push('    <div class="heatmap-row-label">' + dayNames[idx] + '</div>');
      hours.forEach(function(h) {
        var level = heatData[date][h];
        var cls = 'heatmap-cell level-' + level;
        var title = date + ' ' + h + ':00 - 工作' + level + '段';
        html.push('    <div class="' + cls + '" title="' + title + '"></div>');
      });
      html.push('  </div>');
    });

    html.push('</div>');

    // 图例
    html.push([
      '<div class="heatmap-legend">',
      '  <span>少</span>',
      '  <span class="legend-cell level-0"></span>',
      '  <span class="legend-cell level-1"></span>',
      '  <span class="legend-cell level-2"></span>',
      '  <span class="legend-cell level-3"></span>',
      '  <span class="legend-cell level-4"></span>',
      '  <span>多</span>',
      '</div>'
    ].join(''));

    card.innerHTML = html.join('\n');
    return card;
  }

  // ===== AI 规划 =====

  function renderPlan() {
    var card = createCardWrapper('plan');
    var profile = State.getProfile();
    var settings = State.getSettings();
    var wakeUp = profile.wakeUpTime || Config.DEFAULTS.WAKE_UP_TIME;
    var sleep = profile.sleepTime || Config.DEFAULTS.SLEEP_TIME;

    // 生成默认规划建议
    var planSegments = generateDefaultPlan(wakeUp, sleep);

    var html = [
      '<div class="card-header">',
      '  <span class="card-title">📋 今日规划建议</span>',
      '  <span class="card-subtitle">基于你的作息 ' + wakeUp + '-' + sleep + '</span>',
      '</div>',
      '<div class="plan-segments">'
    ];

    planSegments.forEach(function(seg) {
      var cls = seg.type === 'work' ? 'plan-work' : 'plan-rest';
      var icon = seg.type === 'work' ? '💼' : '☕';
      html.push([
        '<div class="plan-segment ' + cls + '">',
        '  <span class="plan-icon">' + icon + '</span>',
        '  <span class="plan-time">' + seg.time + '</span>',
        '  <span class="plan-label">' + seg.label + '</span>',
        '  <span class="plan-duration">' + seg.duration + '</span>',
        '</div>'
      ].join(''));
    });

    html.push('</div>');
    html.push('<div class="card-footer">');
    html.push('  <span class="card-hint">💡 这是参考建议，你可以按自己的节奏调整</span>');
    html.push('</div>');

    card.innerHTML = html.join('\n');
    return card;
  }

  function generateDefaultPlan(wakeUp, sleep) {
    var w = TimeService.parseTimeString(wakeUp);
    var s = TimeService.parseTimeString(sleep);
    var wakeMin = w.hours * 60 + w.minutes;
    var sleepMin = s.hours * 60 + s.minutes;
    if (sleepMin <= wakeMin) sleepMin += 24 * 60;

    var segments = [];
    var current = wakeMin;
    var hour = 0;

    while (current < sleepMin - 30) {
      hour++;
      var isWork = true;
      // 每工作 90 分钟安排一次休息
      if (hour % 3 === 0 && hour > 0) {
        isWork = false;
      }

      var segStart = current;
      var segEnd;
      var duration;

      if (isWork) {
        segEnd = current + 90;
        duration = '90分钟';
      } else {
        segEnd = current + 30;
        duration = '30分钟';
      }

      if (segEnd > sleepMin) {
        segEnd = sleepMin;
        duration = Math.round((segEnd - segStart)) + '分钟';
      }

      segments.push({
        type: isWork ? 'work' : 'rest',
        time: formatMinutes(segStart) + ' - ' + formatMinutes(segEnd),
        label: isWork ? '专注工作' : '休息放松',
        duration: duration
      });

      current = segEnd;
    }

    return segments;
  }

  function formatMinutes(minutes) {
    var h = Math.floor(minutes / 60) % 24;
    var m = minutes % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  // ===== 能力展示 =====

  function renderCapability() {
    var card = createCardWrapper('capability');
    var capabilities = [
      { icon: '☕', title: '休息记录', desc: '休息时点一下，我自动帮你记录时间段' },
      { icon: '📊', title: '数据可视化', desc: '时间线、热力图、周报，一目了然' },
      { icon: '📋', title: 'AI 规划', desc: '根据你的作息，AI 生成每日规划建议' },
      { icon: '💬', title: '陪伴聊天', desc: '休息时聊聊天，帮你放松和反思' },
      { icon: '📝', title: '周报总结', desc: '每周自动总结时间分布和效率趋势' }
    ];

    var html = [
      '<div class="card-header">',
      '  <span class="card-title">🌟 我能做什么</span>',
      '</div>',
      '<div class="capability-list">'
    ];

    capabilities.forEach(function(cap) {
      html.push([
        '<div class="capability-item">',
        '  <span class="cap-icon">' + cap.icon + '</span>',
        '  <div class="cap-info">',
        '    <span class="cap-title">' + cap.title + '</span>',
        '    <span class="cap-desc">' + cap.desc + '</span>',
        '  </div>',
        '</div>'
      ].join(''));
    });

    html.push('</div>');

    card.innerHTML = html.join('\n');
    return card;
  }

  // ===== 周报 =====

  function renderReport() {
    var card = createCardWrapper('report');
    var stats = AIEngine.buildContext().week;

    if (stats.totalWorkHours === 0) {
      card.innerHTML = [
        '<div class="card-header">',
        '  <span class="card-title">📝 周报</span>',
        '</div>',
        '<div class="card-empty">',
        '  <p>本周暂无数据～</p>',
        '</div>'
      ].join('');
      return card;
    }

    var trendIcon = stats.trend === 'increasing' ? '📈' : (stats.trend === 'decreasing' ? '📉' : '➡️');
    var trendText = stats.trend === 'increasing' ? '上升中' : (stats.trend === 'decreasing' ? '下降中' : '保持稳定');

    var html = [
      '<div class="card-header">',
      '  <span class="card-title">📝 本周总结</span>',
      '</div>',
      '<div class="card-stats">',
      '  <div class="stat-item">',
      '    <span class="stat-value">' + stats.totalWorkHours + 'h</span>',
      '    <span class="stat-label">总工作时长</span>',
      '  </div>',
      '  <div class="stat-item">',
      '    <span class="stat-value">' + stats.avgDailyWorkHours + 'h/天</span>',
      '    <span class="stat-label">日均工作</span>',
      '  </div>',
      '  <div class="stat-item">',
      '    <span class="stat-value">' + stats.avgDailyRestCount + '次/天</span>',
      '    <span class="stat-label">日均休息</span>',
      '  </div>',
      '</div>',
      '<div class="card-stats">',
      '  <div class="stat-item">',
      '    <span class="stat-value">' + (stats.avgEfficiency ? stats.avgEfficiency + '分' : '--') + '</span>',
      '    <span class="stat-label">平均效率</span>',
      '  </div>',
      '  <div class="stat-item">',
      '    <span class="stat-value">' + trendIcon + ' ' + trendText + '</span>',
      '    <span class="stat-label">趋势</span>',
      '  </div>',
      '  <div class="stat-item">',
      '    <span class="stat-value">' + stats.totalRestHours + 'h</span>',
      '    <span class="stat-label">总休息时长</span>',
      '  </div>',
      '</div>'
    ].join('');

    card.innerHTML = html;
    return card;
  }

  // ===== 24小时节奏环 =====

  function renderRing() {
    var card = createCardWrapper('ring');
    var events = LTStorage.getTodayEvents();
    if (!events || events.length === 0) {
      card.innerHTML = '<div class="card-header"><span class="card-title">🕐 24小时节奏环</span></div><div class="card-empty"><p>暂无今天的数据～</p><p style="font-size:11px;color:var(--text-muted);margin-top:4px">点击「💼 开始工作」开始记录</p></div>';
      return card;
    }

    var now = new Date(TimeService.now());
    var currentHour = now.getHours();
    var currentMinute = now.getMinutes();

    // 计算每小时状态
    var hours = [];
    for (var h = 0; h < 24; h++) {
      hours.push({ hour: h, type: 'empty', efficiency: 0, activity: null });
    }

    events.forEach(function(e) {
      var startH = e.startHour || 0;
      var endH = e.endHour || (startH + 1);
      for (var h = startH; h <= endH && h < 24; h++) {
        if (e.type === 'work') {
          hours[h].type = 'work';
          hours[h].efficiency = e.metadata && e.metadata.efficiency ? e.metadata.efficiency : 3;
        } else if (e.type === 'rest') {
          hours[h].type = 'rest';
          hours[h].activity = e.metadata && e.metadata.activity ? e.metadata.activity : null;
        }
      }
    });

    // 标记睡眠时段（基于用户设置）
    var profile = State.getProfile();
    var sleepH = profile.sleepTime ? parseInt(profile.sleepTime) : 23;
    var wakeH = profile.wakeUpTime ? parseInt(profile.wakeUpTime) : 7;
    for (var h = sleepH; h < 24; h++) {
      if (hours[h].type === 'empty') hours[h].type = 'sleep';
    }
    for (var h = 0; h < wakeH; h++) {
      if (hours[h].type === 'empty') hours[h].type = 'sleep';
    }

    // SVG 参数
    var size = 240;
    var cx = size / 2;
    var cy = size / 2;
    var outerR = 105;
    var innerR = 75;
    var ringWidth = outerR - innerR;

    // 小时标签（12点位=0点，顺时针）
    var hourLabels = '';
    for (var h = 0; h < 24; h++) {
      var angle = (h / 24) * Math.PI * 2 - Math.PI / 2;
      var labelR = outerR + 12;
      var lx = cx + labelR * Math.cos(angle);
      var ly = cy + labelR * Math.sin(angle);
      var showLabel = (h % 3 === 0);
      if (showLabel) {
        hourLabels += '<text x="' + lx.toFixed(1) + '" y="' + (ly + 4).toFixed(1) + '" text-anchor="middle" class="ring-hour-label">' + h + '</text>';
      }
    }

    // 绘制每小时的弧段
    var arcs = '';
    for (var h = 0; h < 24; h++) {
      var startAngle = (h / 24) * Math.PI * 2 - Math.PI / 2;
      var endAngle = ((h + 1) / 24) * Math.PI * 2 - Math.PI / 2;
      var x1 = cx + outerR * Math.cos(startAngle);
      var y1 = cy + outerR * Math.sin(startAngle);
      var x2 = cx + outerR * Math.cos(endAngle);
      var y2 = cy + outerR * Math.sin(endAngle);
      var x3 = cx + innerR * Math.cos(endAngle);
      var y3 = cy + innerR * Math.sin(endAngle);
      var x4 = cx + innerR * Math.cos(startAngle);
      var y4 = cy + innerR * Math.sin(startAngle);

      var color;
      var opacity = 1;
      if (hours[h].type === 'work') {
        var eff = hours[h].efficiency;
        if (eff >= 5) color = '#F59E0B';
        else if (eff >= 4) color = '#FBBF24';
        else if (eff >= 3) color = '#FCD34D';
        else if (eff >= 2) color = '#FDE68A';
        else color = '#FEF3C7';
        opacity = 0.85;
      } else if (hours[h].type === 'rest') {
        color = '#2DD4BF';
        opacity = 0.7;
      } else if (hours[h].type === 'sleep') {
        color = '#374151';
        opacity = 0.5;
      } else {
        color = '#374151';
        opacity = 0.25;
      }

      var largeArc = 0;
      var path = 'M ' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
        ' A ' + outerR + ' ' + outerR + ' 0 ' + largeArc + ' 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1) +
        ' L ' + x3.toFixed(1) + ' ' + y3.toFixed(1) +
        ' A ' + innerR + ' ' + innerR + ' 0 ' + largeArc + ' 0 ' + x4.toFixed(1) + ' ' + y4.toFixed(1) + ' Z';

      arcs += '<path d="' + path + '" fill="' + color + '" opacity="' + opacity + '" stroke="rgba(0,0,0,0.2)" stroke-width="0.5"/>';
    }

    // 当前时间指针
    var pointerAngle = ((currentHour + currentMinute / 60) / 24) * Math.PI * 2 - Math.PI / 2;
    var pointerLen = outerR - 2;
    var px = cx + pointerLen * Math.cos(pointerAngle);
    var py = cy + pointerLen * Math.sin(pointerAngle);
    var pointer = '<line x1="' + cx + '" y1="' + cy + '" x2="' + px.toFixed(1) + '" y2="' + py.toFixed(1) + '" stroke="white" stroke-width="2" stroke-linecap="round"><animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/></line>';
    var pointerDot = '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="white" opacity="0.9"/>';

    // 中心文字
    var stats = computeStats(events);
    var workHours = (stats.totalWorkMinutes / 60).toFixed(1);
    var restCount = stats.restCount;

    var svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" class="ring-svg" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><filter id="ringGlow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      hourLabels +
      arcs +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (innerR - 1) + '" fill="var(--bg-primary)"/>' +
      pointer +
      pointerDot +
      '</svg>';

    // Bug #8 修复：数据不足时显示引导提示
    var dataHint = '';
    if (stats.totalWorkMinutes < 30) {
      dataHint = '<p style="text-align:center;font-size:11px;color:var(--text-muted);margin-top:8px;padding:0 12px;">记录更多数据后，环会显示完整的节奏变化～</p>';
    }

    // 组装 HTML
    var html = [
      '<div class="card-header">',
      '  <span class="card-title">🕐 24小时节奏环</span>',
      '</div>',
      '<div class="ring-container">',
      '  <div class="ring-wrap">',
      '    <div class="ring-center-text">',
      '      <span class="ring-work-hours">' + workHours + 'h</span>',
      '      <span class="ring-work-label">工作时长</span>',
      '      <span class="ring-rest-count">' + restCount + '次休息</span>',
      '    </div>',
      '    ' + svg,
      '  </div>',
      '  <div class="ring-legend">',
      '    <span class="ring-legend-item"><span class="ring-dot" style="background:#F59E0B"></span>高效</span>',
      '    <span class="ring-legend-item"><span class="ring-dot" style="background:#FCD34D"></span>一般</span>',
      '    <span class="ring-legend-item"><span class="ring-dot" style="background:#2DD4BF"></span>休息</span>',
      '    <span class="ring-legend-item"><span class="ring-dot" style="background:#374151"></span>睡眠</span>',
      '  </div>',
      dataHint,
      '</div>'
    ].join('');

    card.innerHTML = html;
    return card;
  }

  // ===== 工具函数 =====

  function computeStats(events) {
    var stats = {
      totalWorkMinutes: 0,
      totalRestMinutes: 0,
      restCount: 0,
      avgEfficiency: null,
      workSegments: [],
      restSegments: []
    };

    var efficiencies = [];
    events.forEach(function(e) {
      if (e.type === 'work') {
        stats.totalWorkMinutes += (e.duration || 0);
        if (e.metadata && e.metadata.efficiency) {
          efficiencies.push(e.metadata.efficiency);
        }
      } else if (e.type === 'rest') {
        stats.totalRestMinutes += (e.duration || 0);
        stats.restCount++;
      }
    });

    if (efficiencies.length > 0) {
      stats.avgEfficiency = Math.round(efficiencies.reduce(function(a, b) { return a + b; }, 0) / efficiencies.length * 10) / 10;
    }

    return stats;
  }

  function groupEventsByDay(events) {
    var days = {};
    events.forEach(function(e) {
      if (!days[e.date]) days[e.date] = [];
      days[e.date].push(e);
    });
    return days;
  }

  // ===== 公开 API =====
  return {
    renderTimeline: renderTimeline,
    renderHeatmap: renderHeatmap,
    renderPlan: renderPlan,
    renderCapability: renderCapability,
    renderReport: renderReport,
    renderRing: renderRing
  };
})();