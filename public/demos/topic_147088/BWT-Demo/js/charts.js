/**
 * BWT Demo - SVG Chart Library
 * 纯 SVG 实现的图表组件库，无外部依赖
 * Palette: primary=#00D4AA, danger=#FF6B6B, warning=#FFB84D
 */

(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const PALETTE = {
    primary: '#00D4AA',
    danger: '#FF6B6B',
    warning: '#FFB84D',
    trackBg: 'rgba(255,255,255,0.08)',
    trackBgDark: 'rgba(255,255,255,0.05)',
    textPrimary: '#E8F5F0',
    textMuted: 'rgba(255,255,255,0.45)',
    glowPrimary: 'rgba(0,212,170,0.4)',
    glowDanger: 'rgba(255,107,107,0.4)',
  };

  /* ========== 工具函数 ========== */

  /** 创建 SVG 元素并设置属性 */
  function svgEl(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      for (var k in attrs) {
        if (attrs.hasOwnProperty(k)) {
          el.setAttribute(k, attrs[k]);
        }
      }
    }
    return el;
  }

  /** 将弧度转为度 */
  function rad2deg(rad) {
    return rad * 180 / Math.PI;
  }

  /** 将角度转为弧度 */
  function deg2rad(deg) {
    return deg * Math.PI / 180;
  }

  /** 计算圆弧路径（适用于 <path> 的 d 属性） */
  function arcPath(cx, cy, r, startAngle, endAngle) {
    var start = polarToCartesian(cx, cy, r, endAngle);
    var end = polarToCartesian(cx, cy, r, startAngle);
    var largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return 'M ' + start.x + ' ' + start.y + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 0 ' + end.x + ' ' + end.y;
  }

  /** 极坐标 -> 笛卡尔坐标（0° = 12 点钟方向，顺时针） */
  function polarToCartesian(cx, cy, r, angleDeg) {
    var rad = deg2rad(angleDeg - 90);
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  }

  /** 缓动函数：easeOutCubic */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /** 缓动函数：easeOutQuart */
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  /** 正态分布随机数（Box-Muller） */
  function gaussRandom(mean, stdDev) {
    var u1 = Math.random();
    var u2 = Math.random();
    var z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
  }

  /** 限制数值在 [min, max] 范围 */
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  /** 创建 SVG defs 中的滤镜（发光效果） */
  function createGlowFilter(svg, id, color) {
    var defs = svg.querySelector('defs') || svgEl('defs');
    if (!defs.parentNode) svg.insertBefore(defs, svg.firstChild);

    var filter = svgEl('filter', {
      id: id,
      x: '-50%', y: '-50%', width: '200%', height: '200%'
    });
    filter.appendChild(svgEl('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '4', result: 'blur' }));
    filter.appendChild(svgEl('feComposite', { in: 'SourceGraphic', in2: 'blur', operator: 'over' }));
    defs.appendChild(filter);
    return filter;
  }

  /* ========================================================
   *  RingChart - 圆环进度图
   * ======================================================== */
  function RingChart(containerId, config) {
    this.containerId = containerId;
    this.value = clamp(config.value || 0, 0, 100);
    this.label = config.label || '';
    this.color = config.color || PALETTE.primary;
    this.size = config.size || 180;
    this.strokeWidth = config.strokeWidth || 12;
    this._svg = null;
    this._progressCircle = null;
    this._valueText = null;
  }

  RingChart.prototype.init = function () {
    var container = document.getElementById(this.containerId);
    if (!container) return;

    var size = this.size;
    var sw = this.strokeWidth;
    var radius = (size - sw * 2) / 2;
    radius = Math.max(1, radius);
    var circumference = 2 * Math.PI * radius;
    var cx = size / 2;
    var cy = size / 2;

    // 创建 SVG
    var svg = svgEl('svg', {
      width: size, height: size,
      viewBox: '0 0 ' + size + ' ' + size,
      style: 'display:block;margin:auto;'
    });

    // 发光滤镜
    createGlowFilter(svg, 'glow-ring-' + this.containerId, this.color);

    // 背景轨道
    var track = svgEl('circle', {
      cx: cx, cy: cy, r: radius,
      fill: 'none',
      stroke: PALETTE.trackBg,
      'stroke-width': sw
    });
    svg.appendChild(track);

    // 进度弧
    var progress = svgEl('circle', {
      cx: cx, cy: cy, r: radius,
      fill: 'none',
      stroke: this.color,
      'stroke-width': sw,
      'stroke-linecap': 'round',
      'stroke-dasharray': circumference,
      'stroke-dashoffset': circumference,
      filter: 'url(#glow-ring-' + this.containerId + ')',
      transform: 'rotate(-90 ' + cx + ' ' + cy + ')'
    });
    svg.appendChild(progress);
    this._progressCircle = progress;
    this._circumference = circumference;

    // 中心数值文本
    var valueText = svgEl('text', {
      x: cx, y: cy - 6,
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      fill: '#ffffff',
      'font-family': '"JetBrains Mono", "Fira Code", monospace',
      'font-size': Math.round(size * 0.2),
      'font-weight': '700'
    });
    valueText.textContent = '0';
    svg.appendChild(valueText);
    this._valueText = valueText;

    // 标签文本
    if (this.label) {
      var labelText = svgEl('text', {
        x: cx, y: cy + size * 0.12,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        fill: PALETTE.textMuted,
        'font-family': '"Inter", "Noto Sans SC", sans-serif',
        'font-size': Math.round(size * 0.08)
      });
      labelText.textContent = this.label;
      svg.appendChild(labelText);
    }

    this._svg = svg;
    container.appendChild(svg);
  };

  RingChart.prototype.animate = function () {
    var self = this;
    var targetOffset = this._circumference * (1 - this.value / 100);
    var duration = 1200;
    var startTime = null;

    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = clamp((ts - startTime) / duration, 0, 1);
      var eased = easeOutCubic(progress);

      // 进度弧动画
      var currentOffset = self._circumference - (self._circumference - targetOffset) * eased;
      self._progressCircle.setAttribute('stroke-dashoffset', currentOffset);

      // 数值计数器动画
      var currentVal = Math.round(self.value * eased);
      self._valueText.textContent = currentVal;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  };

  /* ========================================================
   *  RadarChart - 雷达图
   * ======================================================== */
  function RadarChart(containerId, config) {
    this.containerId = containerId;
    this.dimensions = config.dimensions || [];
    this.datasets = config.datasets || [];
    this.size = config.size || 300;
    this.maxValue = config.maxValue || 100;
    this._svg = null;
    this._datasetPaths = [];
    this._datasetFills = [];
    this._legendContainer = null;
  }

  RadarChart.prototype._getPoint = function (index, value, cx, cy, radius) {
    var angle = (360 / this.dimensions.length) * index - 90;
    var ratio = clamp(value / this.maxValue, 0, 1);
    var pos = polarToCartesian(cx, cy, radius * ratio, angle);
    return pos.x + ',' + pos.y;
  };

  RadarChart.prototype.init = function () {
    var container = document.getElementById(this.containerId);
    if (!container) return;

    var n = this.dimensions.length;
    if (n < 3) return;

    var size = this.size;
    var cx = size / 2;
    var cy = size / 2;
    var maxRadius = size * 0.38;
    var levels = 5;

    // 创建 SVG
    var svg = svgEl('svg', {
      width: size, height: size + 50, // 额外空间给图例
      viewBox: '0 0 ' + size + ' ' + (size + 50),
      style: 'display:block;margin:auto;'
    });

    var group = svgEl('g', { transform: 'translate(0, 10)' });
    svg.appendChild(group);

    // 绘制网格层级
    for (var lv = 1; lv <= levels; lv++) {
      var r = maxRadius * lv / levels;
      var points = [];
      for (var i = 0; i < n; i++) {
        points.push(this._getPoint(i, this.maxValue * lv / levels, cx, cy, maxRadius));
      }
      var polygon = svgEl('polygon', {
        points: points.join(' '),
        fill: 'none',
        stroke: 'rgba(255,255,255,0.06)',
        'stroke-width': '1'
      });
      group.appendChild(polygon);
    }

    // 绘制轴线
    for (var i = 0; i < n; i++) {
      var outerPoint = polarToCartesian(cx, cy, maxRadius, (360 / n) * i - 90);
      var line = svgEl('line', {
        x1: cx, y1: cy,
        x2: outerPoint.x, y2: outerPoint.y,
        stroke: 'rgba(255,255,255,0.08)',
        'stroke-width': '1'
      });
      group.appendChild(line);
    }

    // 绘制数据集多边形
    this._datasetPaths = [];
    this._datasetFills = [];
    for (var d = 0; d < this.datasets.length; d++) {
      var ds = this.datasets[d];
      var dataPoints = [];
      for (var i = 0; i < n; i++) {
        dataPoints.push(this._getPoint(i, ds.values[i] || 0, cx, cy, maxRadius));
      }
      var pointsStr = dataPoints.join(' ');

      // 填充
      var fill = svgEl('polygon', {
        points: pointsStr,
        fill: ds.color || PALETTE.primary,
        'fill-opacity': '0.12',
        stroke: 'none',
        'data-dataset': d,
        style: 'transition: fill-opacity 0.3s;'
      });
      group.appendChild(fill);
      this._datasetFills.push(fill);

      // 边框
      var path = svgEl('polygon', {
        points: pointsStr,
        fill: 'none',
        stroke: ds.color || PALETTE.primary,
        'stroke-width': '2',
        'stroke-linejoin': 'round',
        'data-dataset': d,
        style: 'transition: opacity 0.3s;'
      });
      group.appendChild(path);
      this._datasetPaths.push(path);

      // 顶点圆点
      for (var i = 0; i < n; i++) {
        var pt = this._getPoint(i, ds.values[i] || 0, cx, cy, maxRadius);
        var parts = pt.split(',');
        var dot = svgEl('circle', {
          cx: parts[0], cy: parts[1], r: '3',
          fill: ds.color || PALETTE.primary,
          'data-dataset': d,
          style: 'transition: opacity 0.3s;'
        });
        group.appendChild(dot);
      }
    }

    // 绘制维度标签
    for (var i = 0; i < n; i++) {
      var labelPos = polarToCartesian(cx, cy, maxRadius + 20, (360 / n) * i - 90);
      var label = svgEl('text', {
        x: labelPos.x, y: labelPos.y,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        fill: PALETTE.textPrimary,
        'font-family': '"Inter", "Noto Sans SC", sans-serif',
        'font-size': '12'
      });
      label.textContent = this.dimensions[i];
      group.appendChild(label);
    }

    // 图例
    var legendY = size + 20;
    var legendGroup = svgEl('g', { transform: 'translate(0,' + legendY + ')' });
    svg.appendChild(legendGroup);

    var totalLegendWidth = this.datasets.reduce(function (sum, ds) {
      return sum + ds.name.length * 12 + 30;
    }, 0);
    var legendStartX = (size - totalLegendWidth) / 2;

    var lx = legendStartX;
    for (var d = 0; d < this.datasets.length; d++) {
      var ds = this.datasets[d];
      var rect = svgEl('rect', {
        x: lx, y: -6, width: 12, height: 12, rx: 2,
        fill: ds.color || PALETTE.primary
      });
      legendGroup.appendChild(rect);
      var txt = svgEl('text', {
        x: lx + 18, y: 0,
        'dominant-baseline': 'middle',
        fill: PALETTE.textMuted,
        'font-family': '"Inter", "Noto Sans SC", sans-serif',
        'font-size': '12'
      });
      txt.textContent = ds.name;
      legendGroup.appendChild(txt);
      lx += ds.name.length * 12 + 30;
    }

    this._svg = group;

    // 鼠标悬停交互：高亮数据集，暗化其他
    var self = this;
    group.addEventListener('mousemove', function (e) {
      var target = e.target;
      var dsIndex = target.getAttribute('data-dataset');
      if (dsIndex === null) return;
      self._highlightDataset(parseInt(dsIndex));
    });
    group.addEventListener('mouseleave', function () {
      self._resetHighlight();
    });

    container.appendChild(svg);
  };

  RadarChart.prototype._highlightDataset = function (index) {
    for (var d = 0; d < this.datasets.length; d++) {
      var isTarget = d === index;
      if (this._datasetFills[d]) {
        this._datasetFills[d].setAttribute('fill-opacity', isTarget ? '0.25' : '0.05');
      }
      if (this._datasetPaths[d]) {
        this._datasetPaths[d].style.opacity = isTarget ? '1' : '0.2';
      }
      // 顶点圆点
      var dots = this._svg.querySelectorAll('circle[data-dataset="' + d + '"]');
      for (var i = 0; i < dots.length; i++) {
        dots[i].style.opacity = isTarget ? '1' : '0.2';
      }
    }
  };

  RadarChart.prototype._resetHighlight = function () {
    for (var d = 0; d < this.datasets.length; d++) {
      if (this._datasetFills[d]) {
        this._datasetFills[d].setAttribute('fill-opacity', '0.12');
      }
      if (this._datasetPaths[d]) {
        this._datasetPaths[d].style.opacity = '1';
      }
      var dots = this._svg.querySelectorAll('circle[data-dataset="' + d + '"]');
      for (var i = 0; i < dots.length; i++) {
        dots[i].style.opacity = '1';
      }
    }
  };

  RadarChart.prototype.animate = function () {
    var self = this;
    var duration = 1000;
    var startTime = null;
    var n = this.dimensions.length;
    var size = this.size;
    var cx = size / 2;
    var cy = size / 2;
    var maxRadius = size * 0.38;

    // 初始：所有数据集缩到中心
    for (var d = 0; d < this.datasets.length; d++) {
      var centerPoints = [];
      for (var i = 0; i < n; i++) {
        centerPoints.push(cx + ',' + cy);
      }
      this._datasetPaths[d].setAttribute('points', centerPoints.join(' '));
      this._datasetFills[d].setAttribute('points', centerPoints.join(' '));
    }

    // 保存目标点
    var targetPoints = [];
    for (var d = 0; d < this.datasets.length; d++) {
      var ds = this.datasets[d];
      var pts = [];
      for (var i = 0; i < n; i++) {
        pts.push(self._getPoint(i, ds.values[i] || 0, cx, cy, maxRadius));
      }
      targetPoints.push(pts);
    }

    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = clamp((ts - startTime) / duration, 0, 1);
      var eased = easeOutQuart(progress);

      for (var d = 0; d < self.datasets.length; d++) {
        var interpPoints = [];
        for (var i = 0; i < n; i++) {
          // 从中心插值到目标位置
          var targetParts = targetPoints[d][i].split(',');
          var tx = parseFloat(targetParts[0]);
          var ty = parseFloat(targetParts[1]);
          var ix = cx + (tx - cx) * eased;
          var iy = cy + (ty - cy) * eased;
          interpPoints.push(ix + ',' + iy);
        }
        self._datasetPaths[d].setAttribute('points', interpPoints.join(' '));
        self._datasetFills[d].setAttribute('points', interpPoints.join(' '));
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  };

  /* ========================================================
   *  GaugeChart - 半圆仪表图
   * ======================================================== */
  function GaugeChart(containerId, config) {
    this.containerId = containerId;
    this.value = clamp(config.value || 0, 0, 100);
    this.label = config.label || '';
    this.minLabel = config.minLabel || '低';
    this.maxLabel = config.maxLabel || '高';
    this._svg = null;
    this._needle = null;
    this._valueText = null;
  }

  GaugeChart.prototype._getColorForValue = function (val) {
    if (val < 33) return PALETTE.primary;
    if (val < 66) return PALETTE.warning;
    return PALETTE.danger;
  };

  GaugeChart.prototype._getGradientColor = function (val) {
    // 绿 -> 黄 -> 红 渐变
    if (val <= 50) {
      var t = val / 50;
      var r = Math.round(0 + t * 255);
      var g = Math.round(212 - t * (212 - 184));
      var b = Math.round(170 - t * (170 - 77));
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    } else {
      var t = (val - 50) / 50;
      var r = 255;
      var g = Math.round(184 - t * (184 - 107));
      var b = Math.round(77 + t * (107 - 77));
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }
  };

  GaugeChart.prototype.init = function () {
    var container = document.getElementById(this.containerId);
    if (!container) return;

    var width = 260;
    var height = 160;
    var cx = width / 2;
    var cy = height - 20;
    var radius = 100;
    var sw = 14;

    var svg = svgEl('svg', {
      width: width, height: height + 30,
      viewBox: '0 0 ' + width + ' ' + (height + 30),
      style: 'display:block;margin:auto;'
    });

    // 发光滤镜
    createGlowFilter(svg, 'glow-gauge-' + this.containerId, this._getGradientColor(this.value));

    // 渐变弧定义
    var defs = svg.querySelector('defs') || svgEl('defs');
    if (!defs.parentNode) svg.insertBefore(defs, svg.firstChild);

    var gradient = svgEl('linearGradient', {
      id: 'gauge-grad-' + this.containerId,
      x1: '0%', y1: '50%', x2: '100%', y2: '50%'
    });
    gradient.appendChild(svgEl('stop', { offset: '0%', 'stop-color': PALETTE.primary }));
    gradient.appendChild(svgEl('stop', { offset: '50%', 'stop-color': PALETTE.warning }));
    gradient.appendChild(svgEl('stop', { offset: '100%', 'stop-color': PALETTE.danger }));
    defs.appendChild(gradient);

    // 背景弧（180度，从9点钟到3点钟）
    var trackArc = svgEl('path', {
      d: arcPath(cx, cy, radius, 180, 0),
      fill: 'none',
      stroke: PALETTE.trackBg,
      'stroke-width': sw,
      'stroke-linecap': 'round'
    });
    svg.appendChild(trackArc);

    // 渐变色弧（根据值填充）
    var valueAngle = -180 + (this.value / 100) * 180;
    var gradArc = svgEl('path', {
      d: arcPath(cx, cy, radius, 180, valueAngle),
      fill: 'none',
      stroke: 'url(#gauge-grad-' + this.containerId + ')',
      'stroke-width': sw,
      'stroke-linecap': 'round',
      filter: 'url(#glow-gauge-' + this.containerId + ')'
    });
    svg.appendChild(gradArc);
    this._gradArc = gradArc;

    // 刻度线（10个主刻度）
    for (var i = 0; i <= 10; i++) {
      var angle = -180 + (i / 10) * 180;
      var outerPos = polarToCartesian(cx, cy, radius + sw / 2 + 4, angle);
      var innerPos = polarToCartesian(cx, cy, radius + sw / 2 + (i % 5 === 0 ? 12 : 8), angle);
      var tick = svgEl('line', {
        x1: outerPos.x, y1: outerPos.y,
        x2: innerPos.x, y2: innerPos.y,
        stroke: i % 5 === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
        'stroke-width': i % 5 === 0 ? '2' : '1'
      });
      svg.appendChild(tick);

      // 刻度数字
      if (i % 5 === 0) {
        var numPos = polarToCartesian(cx, cy, radius + sw / 2 + 22, angle);
        var numText = svgEl('text', {
          x: numPos.x, y: numPos.y,
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          fill: PALETTE.textMuted,
          'font-family': '"JetBrains Mono", "Fira Code", monospace',
          'font-size': '11'
        });
        numText.textContent = i * 10;
        svg.appendChild(numText);
      }
    }

    // 指针（初始在0位置）
    var needleAngle = -180 + (0 / 100) * 180; // 从0开始
    var needleLen = radius - sw;
    var needleTip = polarToCartesian(cx, cy, needleLen, needleAngle);
    var needle = svgEl('line', {
      x1: cx, y1: cy,
      x2: needleTip.x, y2: needleTip.y,
      stroke: '#ffffff',
      'stroke-width': '2.5',
      'stroke-linecap': 'round',
      filter: 'url(#glow-gauge-' + this.containerId + ')'
    });
    svg.appendChild(needle);
    this._needle = needle;

    // 中心圆点
    svg.appendChild(svgEl('circle', {
      cx: cx, cy: cy, r: '6',
      fill: '#ffffff'
    }));
    svg.appendChild(svgEl('circle', {
      cx: cx, cy: cy, r: '3',
      fill: this._getGradientColor(this.value)
    }));

    // 数值文本
    var valueText = svgEl('text', {
      x: cx, y: cy + 25,
      'text-anchor': 'middle',
      fill: '#ffffff',
      'font-family': '"JetBrains Mono", "Fira Code", monospace',
      'font-size': '24',
      'font-weight': '700'
    });
    valueText.textContent = '0';
    svg.appendChild(valueText);
    this._valueText = valueText;

    // 标签文本
    if (this.label) {
      var labelText = svgEl('text', {
        x: cx, y: cy + 44,
        'text-anchor': 'middle',
        fill: PALETTE.textMuted,
        'font-family': '"Inter", "Noto Sans SC", sans-serif',
        'font-size': '12'
      });
      labelText.textContent = this.label;
      svg.appendChild(labelText);
    }

    // 最小/最大标签
    var minPos = polarToCartesian(cx, cy, radius + sw / 2 + 36, 180);
    var maxPos = polarToCartesian(cx, cy, radius + sw / 2 + 36, 0);
    var minText = svgEl('text', {
      x: minPos.x, y: minPos.y,
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
      fill: PALETTE.textMuted,
      'font-family': '"Inter", "Noto Sans SC", sans-serif',
      'font-size': '12'
    });
    minText.textContent = this.minLabel;
    svg.appendChild(minText);

    var maxText = svgEl('text', {
      x: maxPos.x, y: maxPos.y,
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
      fill: PALETTE.textMuted,
      'font-family': '"Inter", "Noto Sans SC", sans-serif',
      'font-size': '12'
    });
    maxText.textContent = this.maxLabel;
    svg.appendChild(maxText);

    this._svg = svg;
    this._cx = cx;
    this._cy = cy;
    this._needleLen = needleLen;
    this._radius = radius;
    this._sw = sw;
    container.appendChild(svg);
  };

  GaugeChart.prototype.animate = function () {
    var self = this;
    var duration = 1500;
    var startTime = null;

    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = clamp((ts - startTime) / duration, 0, 1);
      var eased = easeOutCubic(progress);
      var currentVal = self.value * eased;

      // 更新指针位置
      var angle = -180 + (currentVal / 100) * 180;
      var tip = polarToCartesian(self._cx, self._cy, self._needleLen, angle);
      self._needle.setAttribute('x2', tip.x);
      self._needle.setAttribute('y2', tip.y);

      // 更新渐变弧
      self._gradArc.setAttribute('d', arcPath(self._cx, self._cy, self._radius, 180, angle));

      // 更新数值
      self._valueText.textContent = Math.round(currentVal);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  };

  /* ========================================================
   *  PriceAxis - 价格定位图
   * ======================================================== */
  function PriceAxis(containerId, config) {
    this.containerId = containerId;
    this.currentPrice = config.currentPrice || 0;
    this.marketMin = config.marketMin || 0;
    this.marketMax = config.marketMax || 100;
    this.marketAvg = config.marketAvg || 50;
    this.label = config.label || '';
    this._svg = null;
    this._dots = [];
    this._currentDot = null;
    this._currentGlow = null;
  }

  PriceAxis.prototype._priceToX = function (price, width, padding) {
    var ratio = clamp((price - this.marketMin) / (this.marketMax - this.marketMin), 0, 1);
    return padding + ratio * (width - padding * 2);
  };

  PriceAxis.prototype.init = function () {
    var container = document.getElementById(this.containerId);
    if (!container) return;

    var width = 360;
    var height = 100;
    var padding = 40;
    var axisY = 50;

    var svg = svgEl('svg', {
      width: width, height: height + 30,
      viewBox: '0 0 ' + width + ' ' + (height + 30),
      style: 'display:block;margin:auto;'
    });

    // 发光滤镜
    createGlowFilter(svg, 'glow-price-' + this.containerId, PALETTE.primary);

    // 标签
    if (this.label) {
      var titleText = svgEl('text', {
        x: width / 2, y: 14,
        'text-anchor': 'middle',
        fill: PALETTE.textMuted,
        'font-family': '"Inter", "Noto Sans SC", sans-serif',
        'font-size': '12'
      });
      titleText.textContent = this.label;
      svg.appendChild(titleText);
    }

    // 水平轴线
    svg.appendChild(svgEl('line', {
      x1: padding, y1: axisY,
      x2: width - padding, y2: axisY,
      stroke: 'rgba(255,255,255,0.15)',
      'stroke-width': '1'
    }));

    // 市场平均价虚线
    var avgX = this._priceToX(this.marketAvg, width, padding);
    svg.appendChild(svgEl('line', {
      x1: avgX, y1: axisY - 25,
      x2: avgX, y2: axisY + 25,
      stroke: PALETTE.warning,
      'stroke-width': '1',
      'stroke-dasharray': '3,3',
      opacity: '0.7'
    }));
    var avgLabel = svgEl('text', {
      x: avgX, y: axisY - 30,
      'text-anchor': 'middle',
      fill: PALETTE.warning,
      'font-family': '"JetBrains Mono", "Fira Code", monospace',
      'font-size': '10'
    });
    avgLabel.textContent = '均价 ¥' + this.marketAvg;
    svg.appendChild(avgLabel);

    // 价格范围标签
    var minX = this._priceToX(this.marketMin, width, padding);
    var maxX = this._priceToX(this.marketMax, width, padding);
    var minLabel = svgEl('text', {
      x: minX, y: axisY + 20,
      'text-anchor': 'start',
      fill: PALETTE.textMuted,
      'font-family': '"JetBrains Mono", "Fira Code", monospace',
      'font-size': '10'
    });
    minLabel.textContent = '¥' + this.marketMin;
    svg.appendChild(minLabel);

    var maxLabel = svgEl('text', {
      x: maxX, y: axisY + 20,
      'text-anchor': 'end',
      fill: PALETTE.textMuted,
      'font-family': '"JetBrains Mono", "Fira Code", monospace',
      'font-size': '10'
    });
    maxLabel.textContent = '¥' + this.marketMax;
    svg.appendChild(maxLabel);

    // 生成正态分布的市场散点（25个）
    var range = this.marketMax - this.marketMin;
    var stdDev = range * 0.15;
    var dots = [];
    for (var i = 0; i < 25; i++) {
      var price = gaussRandom(this.marketAvg, stdDev);
      price = clamp(price, this.marketMin, this.marketMax);
      var dx = this._priceToX(price, width, padding);
      // 随机上下偏移模拟分布形态
      var dy = axisY + (Math.random() - 0.5) * 16;
      var dot = svgEl('circle', {
        cx: dx, cy: dy, r: '3',
        fill: 'rgba(255,255,255,0.15)',
        opacity: '0',
        style: 'transition: opacity 0.3s;'
      });
      svg.appendChild(dot);
      dots.push(dot);
    }
    this._dots = dots;

    // 当前产品标记（发光大圆点）
    var currentX = this._priceToX(this.currentPrice, width, padding);

    // 发光外圈
    var glowDot = svgEl('circle', {
      cx: currentX, cy: axisY, r: '12',
      fill: PALETTE.primary,
      opacity: '0',
      filter: 'url(#glow-price-' + this.containerId + ')'
    });
    svg.appendChild(glowDot);
    this._currentGlow = glowDot;

    // 实心圆
    var currentDot = svgEl('circle', {
      cx: currentX, cy: axisY, r: '6',
      fill: PALETTE.primary,
      stroke: '#ffffff',
      'stroke-width': '2',
      opacity: '0'
    });
    svg.appendChild(currentDot);
    this._currentDot = currentDot;

    // 价格标签
    var priceLabel = svgEl('text', {
      x: currentX, y: axisY - 20,
      'text-anchor': 'middle',
      fill: PALETTE.primary,
      'font-family': '"JetBrains Mono", "Fira Code", monospace',
      'font-size': '13',
      'font-weight': '700',
      opacity: '0'
    });
    priceLabel.textContent = '¥' + this.currentPrice;
    svg.appendChild(priceLabel);
    this._priceLabel = priceLabel;

    this._svg = svg;
    container.appendChild(svg);
  };

  PriceAxis.prototype.animate = function () {
    var self = this;
    var dots = this._dots;
    var dotInterval = 40; // 每个散点间隔 ms
    var totalDotTime = dots.length * dotInterval;
    var startTime = null;

    // 第一阶段：散点逐个出现
    function dotPhase(ts) {
      if (!startTime) startTime = ts;
      var elapsed = ts - startTime;

      for (var i = 0; i < dots.length; i++) {
        if (elapsed >= i * dotInterval) {
          dots[i].setAttribute('opacity', '1');
        }
      }

      if (elapsed < totalDotTime + 200) {
        requestAnimationFrame(dotPhase);
      } else {
        // 第二阶段：当前价格点脉冲出现
        self._pulsePhase();
      }
    }
    requestAnimationFrame(dotPhase);
  };

  PriceAxis.prototype._pulsePhase = function () {
    var self = this;
    var duration = 800;
    var startTime = null;
    var pulseCount = 0;

    function pulse(ts) {
      if (!startTime) startTime = ts;
      var elapsed = ts - startTime;

      // 淡入
      var fadeIn = clamp(elapsed / 300, 0, 1);
      self._currentDot.setAttribute('opacity', fadeIn);
      self._currentGlow.setAttribute('opacity', fadeIn * 0.3);
      self._priceLabel.setAttribute('opacity', fadeIn);

      // 脉冲效果
      if (elapsed > 300) {
        pulseCount = Math.floor((elapsed - 300) / 600);
        var pulseProgress = ((elapsed - 300) % 600) / 600;
        var pulseScale = 1 + pulseProgress * 0.8;
        var pulseOpacity = 0.3 * (1 - pulseProgress);
        self._currentGlow.setAttribute('r', 12 * pulseScale);
        self._currentGlow.setAttribute('opacity', pulseOpacity);
      }

      // 持续脉冲 3 秒
      if (elapsed < 3000) {
        requestAnimationFrame(pulse);
      } else {
        // 最终状态
        self._currentGlow.setAttribute('r', '12');
        self._currentGlow.setAttribute('opacity', '0.25');
      }
    }
    requestAnimationFrame(pulse);
  };

  /* ========================================================
   *  DecisionRings - 决策树轮图
   * ======================================================== */
  function DecisionRings(containerId, config) {
    this.containerId = containerId;
    this.months = config.months || [];
    this._svg = null;
    this._ringGroups = [];
    this._tooltip = null;
    this._currentRotation = 0;
  }

  DecisionRings.prototype._getTypeColor = function (type) {
    switch (type) {
      case 'buy': return PALETTE.primary;
      case 'wait': return PALETTE.warning;
      case 'skip': return PALETTE.danger;
      default: return 'rgba(255,255,255,0.2)';
    }
  };

  DecisionRings.prototype._getTypeLabel = function (type) {
    switch (type) {
      case 'buy': return '入手';
      case 'wait': return '观望';
      case 'skip': return '跳过';
      default: return type;
    }
  };

  DecisionRings.prototype.init = function () {
    var container = document.getElementById(this.containerId);
    if (!container) return;

    var size = 280;
    var cx = size / 2;
    var cy = size / 2;
    var innerRadius = 30;
    var ringWidth = 16;
    var ringGap = 3;

    var svg = svgEl('svg', {
      width: size, height: size + 30,
      viewBox: '0 0 ' + size + ' ' + (size + 30),
      style: 'display:block;margin:auto;'
    });

    // 发光滤镜
    createGlowFilter(svg, 'glow-ring-decision-' + this.containerId, PALETTE.primary);

    // 图例
    var legendY = size + 15;
    var legendItems = [
      { label: '入手', color: PALETTE.primary },
      { label: '观望', color: PALETTE.warning },
      { label: '跳过', color: PALETTE.danger }
    ];
    var legendStartX = (size - legendItems.length * 80) / 2;
    for (var li = 0; li < legendItems.length; li++) {
      var lx = legendStartX + li * 80;
      svg.appendChild(svgEl('circle', {
        cx: lx + 6, cy: legendY, r: '5',
        fill: legendItems[li].color
      }));
      var lt = svgEl('text', {
        x: lx + 16, y: legendY,
        'dominant-baseline': 'middle',
        fill: PALETTE.textMuted,
        'font-family': '"Inter", "Noto Sans SC", sans-serif',
        'font-size': '11'
      });
      lt.textContent = legendItems[li].label;
      svg.appendChild(lt);
    }

    // 中心标签
    var centerLabel = svgEl('text', {
      x: cx, y: cy,
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
      fill: PALETTE.textMuted,
      'font-family': '"Inter", "Noto Sans SC", sans-serif',
      'font-size': '10'
    });
    centerLabel.textContent = '决策轨迹';
    svg.appendChild(centerLabel);

    // 绘制各月环
    var self = this;
    this._ringGroups = [];

    for (var m = 0; m < this.months.length; m++) {
      var month = this.months[m];
      var r = innerRadius + m * (ringWidth + ringGap);
      var group = svgEl('g', {
        'data-month': m,
        style: 'cursor:pointer; transition: opacity 0.3s;'
      });

      // 计算该月决策总权重
      var totalWeight = 0;
      for (var d = 0; d < month.decisions.length; d++) {
        totalWeight += month.decisions[d].weight;
      }
      if (totalWeight === 0) totalWeight = 1;

      // 绘制分段弧
      var currentAngle = 0;
      for (var d = 0; d < month.decisions.length; d++) {
        var decision = month.decisions[d];
        var sweepAngle = (decision.weight / totalWeight) * 360;
        var color = self._getTypeColor(decision.type);

        var arc = svgEl('path', {
          d: self._ringArcPath(cx, cy, r, ringWidth, currentAngle, currentAngle + sweepAngle - 0.5),
          fill: color,
          opacity: '0.7',
          stroke: 'none'
        });
        group.appendChild(arc);
        currentAngle += sweepAngle;
      }

      // 月份标签（放在环的右侧）
      var labelAngle = 0; // 3 点钟方向
      var labelPos = polarToCartesian(cx, cy, r + ringWidth / 2, labelAngle - 90 + 360);
      var monthLabel = svgEl('text', {
        x: labelPos.x, y: labelPos.y,
        'text-anchor': 'start',
        'dominant-baseline': 'middle',
        fill: 'rgba(255,255,255,0.3)',
        'font-family': '"JetBrains Mono", "Fira Code", monospace',
        'font-size': '8',
        opacity: m % 2 === 0 ? '1' : '0' // 偶数月显示标签，避免拥挤
      });
      monthLabel.textContent = month.label;
      group.appendChild(monthLabel);

      // 悬停事件
      (function (monthData, monthIndex) {
        group.addEventListener('mouseenter', function (e) {
          self._showTooltip(e, monthData, monthIndex);
          // 高亮当前环，暗化其他
          for (var i = 0; i < self._ringGroups.length; i++) {
            if (i === monthIndex) {
              self._ringGroups[i].style.opacity = '1';
            } else {
              self._ringGroups[i].style.opacity = '0.25';
            }
          }
        });
        group.addEventListener('mouseleave', function () {
          self._hideTooltip();
          for (var i = 0; i < self._ringGroups.length; i++) {
            self._ringGroups[i].style.opacity = '1';
          }
        });
      })(month, m);

      svg.appendChild(group);
      this._ringGroups.push(group);
    }

    // 创建浮动提示框
    var tooltip = document.createElement('div');
    tooltip.style.cssText = 'position:absolute;background:rgba(15,25,40,0.95);border:1px solid rgba(0,212,170,0.3);' +
      'border-radius:8px;padding:8px 12px;font-size:12px;color:#E8F5F0;pointer-events:none;' +
      'opacity:0;transition:opacity 0.2s;z-index:100;white-space:nowrap;font-family:"Inter","Noto Sans SC",sans-serif;';
    tooltip.style.display = 'none';
    container.style.position = 'relative';
    container.appendChild(tooltip);
    this._tooltip = tooltip;

    this._svg = svg;
    this._cx = cx;
    this._cy = cy;
    container.appendChild(svg);
  };

  DecisionRings.prototype._ringArcPath = function (cx, cy, radius, width, startAngle, endAngle) {
    var outerR = Math.max(1, radius + width / 2);
    var innerR = Math.max(1, radius - width / 2);
    var startRad = deg2rad(startAngle - 90);
    var endRad = deg2rad(endAngle - 90);

    var outerStart = { x: cx + outerR * Math.cos(startRad), y: cy + outerR * Math.sin(startRad) };
    var outerEnd = { x: cx + outerR * Math.cos(endRad), y: cy + outerR * Math.sin(endRad) };
    var innerEnd = { x: cx + innerR * Math.cos(endRad), y: cy + innerR * Math.sin(endRad) };
    var innerStart = { x: cx + innerR * Math.cos(startRad), y: cy + innerR * Math.sin(startRad) };

    var largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return 'M ' + outerStart.x + ' ' + outerStart.y +
      ' A ' + outerR + ' ' + outerR + ' 0 ' + largeArc + ' 1 ' + outerEnd.x + ' ' + outerEnd.y +
      ' L ' + innerEnd.x + ' ' + innerEnd.y +
      ' A ' + innerR + ' ' + innerR + ' 0 ' + largeArc + ' 0 ' + innerStart.x + ' ' + innerStart.y +
      ' Z';
  };

  DecisionRings.prototype._showTooltip = function (e, monthData, monthIndex) {
    var tooltip = this._tooltip;
    var totalWeight = 0;
    for (var d = 0; d < monthData.decisions.length; d++) {
      totalWeight += monthData.decisions[d].weight;
    }

    var html = '<div style="font-weight:600;margin-bottom:4px;color:#fff;">' + monthData.label + '</div>';
    for (var d = 0; d < monthData.decisions.length; d++) {
      var dec = monthData.decisions[d];
      var color = this._getTypeColor(dec.type);
      var pct = totalWeight > 0 ? Math.round(dec.weight / totalWeight * 100) : 0;
      html += '<div style="display:flex;align-items:center;gap:6px;margin-top:2px;">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:' + color + ';display:inline-block;"></span>' +
        '<span>' + this._getTypeLabel(dec.type) + '</span>' +
        '<span style="color:rgba(255,255,255,0.5);font-family:monospace;">' + pct + '%</span>' +
        '</div>';
    }
    tooltip.innerHTML = html;
    tooltip.style.display = 'block';

    var rect = e.target.closest('[data-month]').getBoundingClientRect();
    var containerRect = document.getElementById(this.containerId).getBoundingClientRect();
    tooltip.style.left = (rect.right - containerRect.left + 10) + 'px';
    tooltip.style.top = (rect.top - containerRect.top) + 'px';
    tooltip.style.opacity = '1';
  };

  DecisionRings.prototype._hideTooltip = function () {
    if (this._tooltip) {
      this._tooltip.style.opacity = '0';
      setTimeout(function () {
        this._tooltip.style.display = 'none';
      }.bind(this), 200);
    }
  };

  DecisionRings.prototype.animate = function () {
    // 缓慢自动旋转动画
    var self = this;
    this._autoRotateId = setInterval(function () {
      self._currentRotation += 0.15;
      if (self._svg) {
        // 旋转所有环组
        var groups = self._svg.querySelectorAll('[data-month]');
        for (var i = 0; i < groups.length; i++) {
          groups[i].setAttribute('transform', 'rotate(' + self._currentRotation + ' ' + self._cx + ' ' + self._cy + ')');
        }
      }
    }, 50);
  };

  /* ========== 导出 ========== */
  window.BWTCharts = {
    RingChart: RingChart,
    RadarChart: RadarChart,
    GaugeChart: GaugeChart,
    PriceAxis: PriceAxis,
    DecisionRings: DecisionRings
  };

})();
