// ===== 导路 - 图表模块 =====

// ---------- 折线图 ----------
function drawLine(data) {
  var c = document.getElementById('lineCanvas');
  if (!c) return;
  var parent = c.parentElement;
  c.width = parent.offsetWidth;
  c.height = parent.offsetHeight;
  var ctx = c.getContext('2d');
  var w = c.width, h = c.height, pad = 30;
  var maxV = 100, minV = 50;
  var points = data.map(function(v, i) {
    return {
      x: pad + i * (w - 2 * pad) / (data.length - 1),
      y: pad + (maxV - Math.min(v, maxV)) / (maxV - minV) * (h - 2 * pad)
    };
  });
  ctx.clearRect(0, 0, w, h);
  // grid
  ctx.strokeStyle = 'rgba(245,158,11,0.08)';
  ctx.lineWidth = 1;
  for (var i = 0; i <= 4; i++) {
    var y = pad + i * (h - 2 * pad) / 4;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Noto Sans SC';
    ctx.fillText(Math.round(maxV - i * (maxV - minV) / 4) + '%', 4, y + 4);
  }
  // line
  ctx.beginPath();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  points.forEach(function(p, i) {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();
  // dots
  points.forEach(function(p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#0c1220';
    ctx.fill();
  });
}

// ---------- 雷达图 ----------
function drawRadar(values) {
  var dims = ['学业成绩', '出勤表现', '作业完成', '课堂参与', '职业素养'];
  var cx = 120, cy = 120, r = 90;
  var angles = [-90, -18, 54, 126, 198].map(function(a) { return a * Math.PI / 180; });
  var pts = values.map(function(v, i) {
    var rv = r * v / 100;
    return { x: cx + rv * Math.cos(angles[i]), y: cy + rv * Math.sin(angles[i]) };
  });
  var svg = document.getElementById('radarSvg');
  var polyPoints = pts.map(function(p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');
  var circlesHtml = pts.map(function(p) {
    return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="4" fill="#f59e0b"/><circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="2" fill="#0c1220"/>';
  }).join('');
  svg.innerHTML = '<polygon points="' + polyPoints + '" fill="rgba(245,158,11,0.15)" stroke="#f59e0b" stroke-width="2"/>' + circlesHtml;

  var labelHtml = dims.map(function(d, i) {
    var style = '';
    if (i === 0) style = 'top:-8px;left:50%;transform:translateX(-50%)';
    else if (i === 1) style = 'top:12%;right:0';
    else if (i === 2) style = 'bottom:12%;right:0';
    else if (i === 3) style = 'bottom:-8px;left:50%;transform:translateX(-50%)';
    else style = 'top:50%;right:-20px;transform:translateY(-50%)';
    return '<div class="radar-label" style="' + style + '"><span class="rv">' + values[i] + '分</span>' + d + '</div>';
  }).join('');
  document.getElementById('radarLabels').innerHTML = labelHtml;
}

// ---------- 柱状图 ----------
function drawProfileBars(grades, labels) {
  var max = Math.max.apply(null, grades.concat([1]));
  document.getElementById('profileBarChart').innerHTML = grades.map(function(g, i) {
    return '<div class="bar-col"><div class="bar-value">' + g + '</div><div class="bar amber" style="height:' + Math.max(4, g / max * 140) + 'px"></div><div class="bar-label">' + labels[i] + '</div></div>';
  }).join('');
}

// ---------- 时间线 ----------
function drawTimeline(items) {
  document.getElementById('profileTimeline').innerHTML = items.map(function(t) {
    return '<div class="timeline-item"><div class="time"><i class="fa-regular fa-calendar"></i> ' + t.time + '</div><div class="content">' + t.content + '</div></div>';
  }).join('');
}

// ---------- 环形进度 ----------
var ringAnimated = false;
function animateRing() {
  var fg = document.getElementById('ringFg');
  var valEl = document.getElementById('ringVal');
  if (!fg || !valEl) return;
  if (ringAnimated) {
    fg.style.strokeDashoffset = 339.292 * (1 - 78 / 100);
    valEl.textContent = '78%';
    return;
  }
  ringAnimated = true;
  var circumference = 2 * Math.PI * 54;
  var target = 78;
  fg.style.strokeDashoffset = circumference;
  valEl.textContent = '0%';
  setTimeout(function() {
    fg.style.strokeDashoffset = circumference * (1 - target / 100);
    var cur = 0;
    var step = Math.ceil(target / 30);
    var timer = setInterval(function() {
      cur += step;
      if (cur >= target) { cur = target; clearInterval(timer); }
      valEl.textContent = cur + '%';
    }, 30);
  }, 100);
}

// ---------- 图表懒加载 ----------
function initLazyCharts() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        if (el.classList.contains('stat-card')) {
          animateNumbers();
        }
        if (el.id === 'ringProgressArea') {
          animateRing();
        }
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.stats-row, #ringProgressArea').forEach(function(el) {
    observer.observe(el);
  });
}

// ========== 数据可视化（预警看板） ==========

function getVizData() {
  var pieData = [
    { label: '红色预警', value: students.filter(function(s) { return s.level === 'red'; }).length, color: 'var(--red)' },
    { label: '橙色预警', value: students.filter(function(s) { return s.level === 'orange'; }).length, color: 'var(--orange)' },
    { label: '蓝色关注', value: students.filter(function(s) { return s.level === 'blue'; }).length, color: 'var(--blue)' },
    { label: '正常', value: students.filter(function(s) { return s.level === 'normal'; }).length, color: 'var(--green)' }
  ];

  var majorMap = {};
  students.forEach(function(s) {
    if (!majorMap[s.major]) majorMap[s.major] = { name: s.major, warning: 0, total: 0 };
    majorMap[s.major].total++;
    if (s.level !== 'normal') majorMap[s.major].warning++;
  });
  var barData = Object.values(majorMap).map(function(m) {
    return { label: m.name, value: m.warning, total: m.total, color: 'var(--accent)' };
  });

  var scatterData = students.map(function(s) {
    return { x: s.attend, y: s.avg, name: s.name, level: s.level };
  });

  return { pie: pieData, bar: barData, scatter: scatterData };
}

function renderDashboardCharts() {
  var data = getVizData();
  drawPieChart('pieChartContainer', data.pie);
  drawBarChart('barChartContainer', data.bar);
  drawScatterChart('scatterChartContainer', data.scatter);
  drawRiskDistribution('riskDistContainer');
  drawRiskTrend('riskTrendContainer');
}

function drawRiskDistribution(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var dist = { '低风险': 0, '中等风险': 0, '高风险': 0, '极高风险': 0 };
  var colors = { '低风险': 'var(--green)', '中等风险': 'var(--blue)', '高风险': 'var(--orange)', '极高风险': 'var(--red)' };
  students.forEach(function(s) {
    var score = calculateRiskScore(s);
    if (score >= 80) dist['极高风险']++;
    else if (score >= 60) dist['高风险']++;
    else if (score >= 40) dist['中等风险']++;
    else dist['低风险']++;
  });
  var items = Object.keys(dist).map(function(k) { return { label: k, value: dist[k], color: colors[k] }; });
  var maxVal = Math.max.apply(null, items.map(function(d) { return d.value; }).concat([1]));

  container.innerHTML =
    '<div class="bar-chart-wrapper">' + items.map(function(d) {
      var height = d.value / maxVal * 100;
      return '<div class="viz-bar-col">' +
        '<div class="viz-bar-track">' +
          '<div class="viz-bar" style="height:' + height + '%;background:' + d.color + '">' +
            '<div class="viz-bar-tooltip">' + d.label + '<br>' + d.value + '人</div>' +
          '</div>' +
        '</div>' +
        '<div class="viz-bar-label" title="' + d.label + '">' + d.label + '</div>' +
      '</div>';
    }).join('') + '</div>';
}

function drawRiskTrend(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  // 模拟班级整体风险趋势（基于历史数据计算每周平均风险分）
  var weeks = 5;
  var weekLabels = ['第1周', '第2周', '第3周', '第4周', '第5周', '预测'];
  var avgRiskHistory = [];

  for (var w = 0; w < weeks; w++) {
    var totalRisk = 0;
    students.forEach(function(s) {
      var attHistory = s.attendanceHistory || s.attTrend || [];
      var scrHistory = s.scoreHistory || s.grades || [];
      var simStudent = Object.assign({}, s);
      simStudent.attend = attHistory[w] !== undefined ? attHistory[w] : s.attend;
      simStudent.avg = scrHistory[w] !== undefined ? scrHistory[w] : s.avg;
      totalRisk += calculateRiskScore(simStudent);
    });
    avgRiskHistory.push(Math.round(totalRisk / students.length));
  }
  // 预测下周
  var totalPredRisk = 0;
  students.forEach(function(s) {
    totalPredRisk += calculateRiskScore(s);
  });
  avgRiskHistory.push(Math.round(totalPredRisk / students.length));

  var maxRisk = Math.max.apply(null, avgRiskHistory.concat([1]));
  var minRisk = Math.min.apply(null, avgRiskHistory);

  container.innerHTML =
    '<div class="bar-chart-wrapper">' + avgRiskHistory.map(function(v, i) {
      var h = Math.max(4, (v - Math.max(0, minRisk - 10)) / (maxRisk - Math.max(0, minRisk - 10)) * 100);
      var color = v >= 80 ? 'var(--red)' : v >= 60 ? 'var(--orange)' : v >= 40 ? 'var(--blue)' : 'var(--green)';
      var isPred = i === avgRiskHistory.length - 1;
      return '<div class="viz-bar-col">' +
        '<div class="viz-bar-track">' +
          '<div class="viz-bar" style="height:' + h + '%;background:' + color + ';opacity:' + (isPred ? '0.7' : '1') + '">' +
            '<div class="viz-bar-tooltip">' + weekLabels[i] + '<br>平均风险: ' + v + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="viz-bar-label" title="' + weekLabels[i] + '">' + weekLabels[i] + (isPred ? '<br><small style="color:var(--accent)">AI</small>' : '') + '</div>' +
      '</div>';
    }).join('') + '</div>';
}

function drawPieChart(containerId, data) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var total = data.reduce(function(sum, d) { return sum + d.value; }, 0);
  if (total === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:40px;">暂无数据</div>';
    return;
  }

  var gradientParts = [];
  var currentPercent = 0;
  data.forEach(function(d) {
    var percent = d.value / total * 100;
    var nextPercent = currentPercent + percent;
    gradientParts.push(d.color + ' ' + currentPercent + '% ' + nextPercent + '%');
    currentPercent = nextPercent;
  });

  container.innerHTML =
    '<div class="pie-chart-wrapper">' +
      '<div class="pie-chart" style="background:conic-gradient(' + gradientParts.join(', ') + ')">' +
        '<div class="pie-hole">' + total + '<span>总人数</span></div>' +
      '</div>' +
      '<div class="pie-legend">' + data.map(function(d) {
        return '<div class="pie-legend-item"><span class="pie-legend-color" style="background:' + d.color + '"></span><span>' + d.label + ' (' + d.value + ')</span></div>';
      }).join('') + '</div>' +
    '</div>';
}

function drawBarChart(containerId, data) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var maxVal = Math.max.apply(null, data.map(function(d) { return d.value; }).concat([1]));

  container.innerHTML =
    '<div class="bar-chart-wrapper">' + data.map(function(d) {
      var height = d.value / maxVal * 100;
      return '<div class="viz-bar-col">' +
        '<div class="viz-bar-track">' +
          '<div class="viz-bar" style="height:' + height + '%;background:' + d.color + '">' +
            '<div class="viz-bar-tooltip">' + d.label + '<br>预警: ' + d.value + '人<br>总计: ' + d.total + '人</div>' +
          '</div>' +
        '</div>' +
        '<div class="viz-bar-label" title="' + d.label + '">' + d.label + '</div>' +
      '</div>';
    }).join('') + '</div>';
}

function drawScatterChart(containerId, data) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var canvasId = containerId + 'Canvas';
  var tooltipId = canvasId + 'Tooltip';
  container.innerHTML = '<canvas id="' + canvasId + '" class="scatter-canvas"></canvas><div class="scatter-tooltip" id="' + tooltipId + '"></div>';

  var canvas = document.getElementById(canvasId);
  var parent = canvas.parentElement;
  canvas.width = parent.offsetWidth || 600;
  canvas.height = 300;
  var ctx = canvas.getContext('2d');

  var w = canvas.width, h = canvas.height;
  var pad = { top: 20, right: 20, bottom: 40, left: 50 };
  var plotW = w - pad.left - pad.right;
  var plotH = h - pad.top - pad.bottom;

  var colorMap = { red: '#ef4444', orange: '#f97316', blue: '#3b82f6', normal: '#10b981' };

  function draw() {
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#1e3a5f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, h - pad.bottom);
    ctx.lineTo(w - pad.right, h - pad.bottom);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(245,158,11,0.08)';
    for (var i = 0; i <= 5; i++) {
      var y = pad.top + i * plotH / 5;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      var x = pad.left + i * plotW / 5;
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, h - pad.bottom);
      ctx.stroke();
    }

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#94a3b8';
    ctx.font = '11px Noto Sans SC';
    ctx.textAlign = 'center';
    for (var i = 0; i <= 5; i++) {
      var val = Math.round(i * 100 / 5);
      ctx.fillText(val + '%', pad.left + i * plotW / 5, h - pad.bottom + 16);
    }
    ctx.textAlign = 'right';
    for (var i = 0; i <= 5; i++) {
      var val = Math.round(100 - i * 100 / 5);
      ctx.fillText(val, pad.left - 8, pad.top + i * plotH / 5 + 4);
    }

    ctx.save();
    ctx.translate(12, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#94a3b8';
    ctx.fillText('平均成绩', 0, 0);
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.fillText('出勤率', w / 2, h - 4);

    data.forEach(function(d) {
      var px = pad.left + (d.x / 100) * plotW;
      var py = pad.top + ((100 - d.y) / 100) * plotH;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = colorMap[d.level] || '#94a3b8';
      ctx.fill();
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--card').trim() || '#182340';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  draw();

  var tooltip = document.getElementById(tooltipId);
  canvas.addEventListener('mousemove', function(e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    var found = null;
    data.forEach(function(d) {
      var px = pad.left + (d.x / 100) * plotW;
      var py = pad.top + ((100 - d.y) / 100) * plotH;
      var dist = Math.sqrt((mx - px) * (mx - px) + (my - py) * (my - py));
      if (dist < 10) found = d;
    });

    if (found) {
      tooltip.style.display = 'block';
      tooltip.style.left = (mx + 12) + 'px';
      tooltip.style.top = (my - 10) + 'px';
      var levelText = { red: '红色预警', orange: '橙色预警', blue: '蓝色关注', normal: '正常' };
      tooltip.innerHTML = '<strong>' + found.name + '</strong><br>出勤率: ' + found.x + '%<br>平均成绩: ' + found.y + '<br>等级: ' + levelText[found.level];
    } else {
      tooltip.style.display = 'none';
    }
  });

  canvas.addEventListener('mouseleave', function() {
    tooltip.style.display = 'none';
  });
}

function toggleDashboardView() {
  var tableWrap = document.querySelector('#page-dashboard .table-wrap');
  var vizWrap = document.getElementById('dashboardViz');
  var btn = document.getElementById('viewToggleBtn');

  if (!vizWrap) return;

  if (vizWrap.style.display === 'none') {
    vizWrap.style.display = 'block';
    if (tableWrap) tableWrap.style.display = 'none';
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-table"></i> 切换表格视图';
      renderDashboardCharts();
    }
  } else {
    vizWrap.style.display = 'none';
    if (tableWrap) tableWrap.style.display = 'block';
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-chart-pie"></i> 切换图表视图';
    }
  }
}
