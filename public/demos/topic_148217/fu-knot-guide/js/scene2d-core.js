/**
 * scene2d-core.js - 非遗福结 2D 引擎核心
 *
 * 职责：Canvas 2D 绳结绘制引擎，提供与 Scene3D 兼容的 API
 * 依赖：无（纯 Canvas 2D）
 * 被依赖：各绳结 2D 实现文件
 */
var Scene2D = {};
var Knots2D = Knots2D || {};

(function (S) {
  'use strict';

  var _ = {
    canvas: null,
    ctx: null,
    containerEl: null,
    W: 500,
    H: 340,
    animId: null,
    lastTime: 0,

    currentStep: -1,
    currentKnotId: null,
    stepShapes: {},

    frameCallbacks: [],
    disposeCallbacks: [],

    transition: {
      active: false,
      fromIdx: 0,
      toIdx: 0,
      t: 0,
      duration: 800,
      onComplete: null,
      fromShapes: null,
      toShapes: null
    },

    tightenValue: 0,

    game: {
      combo: 0,
      maxCombo: 0,
      totalXP: 0,
      stepXP: 15,
      comboBonus: 5,
      celebrating: false,
      celebrateTimer: 0,
      particles: []
    },

    scale: 60,
    offsetX: 0,
    offsetY: 0
  };

  S._ = _;

  /* ==================== Knots2D 注册系统 ==================== */

  var registry = {};

  Knots2D.register = function (id, impl) {
    registry[id] = impl;
    console.log('[Knots2D] registered:', id);
  };

  Knots2D.get = function (id) {
    return registry[id] || null;
  };

  Knots2D.setCurrent = function (id) {
    _.currentKnotId = id;
  };

  Knots2D.getCurrent = function () {
    return _.currentKnotId;
  };

  function currentImpl() {
    if (_.currentKnotId && registry[_.currentKnotId]) return registry[_.currentKnotId];
    var keys = Object.keys(registry);
    if (keys.length) {
      _.currentKnotId = keys[0];
      return registry[_.currentKnotId];
    }
    return null;
  }

  /* ==================== 工具函数 ==================== */

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function easeOutBack(t) {
    var c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function smoothPath(points, tension) {
    tension = tension !== undefined ? tension : 0.35;
    if (points.length < 3) return points.slice();

    var result = [];
    var n = points.length;

    for (var i = 0; i < n - 1; i++) {
      var p0 = points[Math.max(0, i - 1)];
      var p1 = points[i];
      var p2 = points[i + 1];
      var p3 = points[Math.min(n - 1, i + 2)];

      var cp1x = p1.x + (p2.x - p0.x) * tension / 6;
      var cp1y = p1.y + (p2.y - p0.y) * tension / 6;
      var cp2x = p2.x - (p3.x - p1.x) * tension / 6;
      var cp2y = p2.y - (p3.y - p1.y) * tension / 6;

      if (i === 0) result.push({ x: p1.x, y: p1.y });

      var steps = 10;
      for (var s = 1; s <= steps; s++) {
        var t = s / steps;
        var mt = 1 - t;
        var x = mt * mt * mt * p1.x + 3 * mt * mt * t * cp1x + 3 * mt * t * t * cp2x + t * t * t * p2.x;
        var y = mt * mt * mt * p1.y + 3 * mt * mt * t * cp1y + 3 * mt * t * t * cp2y + t * t * t * p2.y;
        result.push({ x: x, y: y });
      }
    }

    return result;
  }

  function lerpPoints(fromPts, toPts, t) {
    var result = [];
    var len = Math.min(fromPts.length, toPts.length);
    for (var i = 0; i < len; i++) {
      result.push({
        x: lerp(fromPts[i].x, toPts[i].x, t),
        y: lerp(fromPts[i].y, toPts[i].y, t)
      });
    }
    return result;
  }

  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (x) {
      var hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  function shadeColor(hex, percent) {
    var c = hexToRgb(hex);
    var amt = Math.round(2.55 * percent);
    return rgbToHex(c.r + amt, c.g + amt, c.b + amt);
  }

  /* ==================== 绳结绘制工具 ==================== */

  function drawRope(ctx, points, color, radius, options) {
    options = options || {};
    if (points.length < 2) return;

    var smoothed = smoothPath(points, options.tension);
    var baseColor = color || '#C41E3A';
    var r = radius || 10;
    var darkColor = shadeColor(baseColor, -30);
    var lightColor = shadeColor(baseColor, 20);
    var highlightColor = shadeColor(baseColor, 40);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(smoothed[0].x, smoothed[0].y);
    for (var i = 1; i < smoothed.length; i++) {
      ctx.lineTo(smoothed[i].x, smoothed[i].y);
    }
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = r * 2 + 2;
    ctx.globalAlpha = 0.3;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.moveTo(smoothed[0].x, smoothed[0].y);
    for (var j = 1; j < smoothed.length; j++) {
      ctx.lineTo(smoothed[j].x, smoothed[j].y);
    }
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = r * 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(smoothed[0].x, smoothed[0].y);
    for (var k = 1; k < smoothed.length; k++) {
      ctx.lineTo(smoothed[k].x, smoothed[k].y);
    }
    var grad = ctx.createLinearGradient(0, -r, 0, r);
    grad.addColorStop(0, highlightColor);
    grad.addColorStop(0.3, lightColor);
    grad.addColorStop(0.5, baseColor);
    grad.addColorStop(0.7, baseColor);
    grad.addColorStop(1, darkColor);
    ctx.strokeStyle = grad;
    ctx.lineWidth = r * 1.6;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(smoothed[0].x, smoothed[0].y);
    for (var m = 1; m < smoothed.length; m++) {
      ctx.lineTo(smoothed[m].x, smoothed[m].y);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = r * 0.6;
    ctx.stroke();

    ctx.restore();
  }

  function drawBead(ctx, x, y, r, color) {
    color = color || '#DAA520';
    var darkColor = shadeColor(color, -30);
    var lightColor = shadeColor(color, 30);
    var highlightColor = shadeColor(color, 60);

    ctx.save();

    var shadowGrad = ctx.createRadialGradient(x + 2, y + 3, 0, x + 2, y + 3, r * 1.2);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0.3)');
    shadowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(x + 2, y + 3, r * 1.2, 0, Math.PI * 2);
    ctx.fill();

    var grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    grad.addColorStop(0, highlightColor);
    grad.addColorStop(0.3, lightColor);
    grad.addColorStop(0.7, color);
    grad.addColorStop(1, darkColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawTassel(ctx, x, y, height, radius, strandCount, color) {
    color = color || '#C9A84B';
    strandCount = strandCount || 12;
    radius = radius || 10;

    ctx.save();
    for (var i = 0; i < strandCount; i++) {
      var ang = (i / strandCount) * Math.PI * 2;
      var offsetX = Math.cos(ang) * radius * 0.8 + (Math.random() - 0.5) * radius * 0.4;
      var endY = y - height * (0.7 + Math.random() * 0.3);
      var endX = x + offsetX * 0.5 + (Math.random() - 0.5) * radius * 0.6;
      var cpY = y - height * 0.5;

      ctx.beginPath();
      ctx.moveTo(x + offsetX * 0.3, y);
      ctx.quadraticCurveTo(x + offsetX * 0.6, cpY, endX, endY);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, radius * 0.2);
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    drawBead(ctx, x, y + radius * 0.5, radius, '#DAA520');
    ctx.restore();
  }

  function overUnderPts2D(basePts, pattern, zDepth) {
    zDepth = zDepth !== undefined ? zDepth : 0.2;
    var n = basePts.length;
    if (n === 0 || !pattern || pattern.length === 0) return basePts.slice();

    var segCount = pattern.length;
    var segLen = (n - 1) / segCount;

    var zOffsets = [];
    for (var i = 0; i < n; i++) {
      var segIdx = Math.floor(i / segLen);
      if (segIdx >= segCount) segIdx = segCount - 1;
      var segStart = segIdx * segLen;
      var segEnd = (segIdx + 1) * segLen;
      var t = (i - segStart) / (segEnd - segStart);
      var smoothT = 0.5 - 0.5 * Math.cos(t * Math.PI);

      var currZ = pattern[segIdx] * zDepth;
      var nextIdx = (segIdx + 1) % segCount;
      var nextZ = pattern[nextIdx] * zDepth;

      zOffsets.push(currZ + (nextZ - currZ) * smoothT);
    }

    return basePts.map(function (p, i) {
      return {
        x: p.x,
        y: p.y,
        z: (p.z || 0) + zOffsets[i]
      };
    });
  }

  function circlePts2D(cx, cy, r, segments) {
    segments = segments || 48;
    var pts = [];
    for (var i = 0; i <= segments; i++) {
      var a = (i / segments) * Math.PI * 2;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, z: 0 });
    }
    return pts;
  }

  function arcPts2D(cx, cy, r, startAngle, endAngle, segments) {
    segments = segments || 24;
    var pts = [];
    for (var i = 0; i <= segments; i++) {
      var a = startAngle + (endAngle - startAngle) * (i / segments);
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, z: 0 });
    }
    return pts;
  }

  function symmetricPts2D(pts, axis) {
    axis = axis || 'x';
    return pts.map(function (p) {
      var np = { x: p.x, y: p.y, z: p.z };
      if (axis === 'x') np.x = -p.x;
      else if (axis === 'y') np.y = -p.y;
      return np;
    });
  }

  Knots2D.tools = {
    drawRope: drawRope,
    drawBead: drawBead,
    drawTassel: drawTassel,
    lerp: lerp,
    smoothPath: smoothPath,
    lerpPoints: lerpPoints,
    overUnderPts: overUnderPts2D,
    circlePts: circlePts2D,
    arcPts: arcPts2D,
    symmetricPts: symmetricPts2D,
    shadeColor: shadeColor,
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    easeInOutCubic: easeInOutCubic,
    easeOutBack: easeOutBack
  };

  /* ==================== 坐标系统 ==================== */

  function worldToScreen(wx, wy) {
    return {
      x: _.W / 2 + _.offsetX + wx * _.scale,
      y: _.H / 2 + _.offsetY - wy * _.scale
    };
  }

  function screenToWorld(sx, sy) {
    return {
      x: (sx - _.W / 2 - _.offsetX) / _.scale,
      y: (_.H / 2 + _.offsetY - sy) / _.scale
    };
  }

  function transformPoints(points) {
    return points.map(function (p) {
      var s = worldToScreen(p.x, p.y);
      return { x: s.x, y: s.y, z: p.z || 0 };
    });
  }

  /* ==================== 背景绘制 ==================== */

  function drawBackground(ctx) {
    var grad = ctx.createLinearGradient(0, 0, 0, _.H);
    grad.addColorStop(0, '#FDF6E3');
    grad.addColorStop(0.5, '#F5E6D3');
    grad.addColorStop(1, '#E8D4B8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, _.W, _.H);

    ctx.globalAlpha = 0.04;
    for (var i = 0; i < 15; i++) {
      var rx = Math.random() * _.W;
      var ry = Math.random() * _.H;
      var rr = 30 + Math.random() * 80;
      var rg = ctx.createRadialGradient(rx, ry, 0, rx, ry, rr);
      rg.addColorStop(0, '#fff');
      rg.addColorStop(1, 'transparent');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(rx, ry, rr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = '#C41E3A';
    ctx.lineWidth = 1;
    for (var j = 0; j < 3; j++) {
      var yPos = _.H * (0.2 + j * 0.3);
      ctx.beginPath();
      ctx.moveTo(0, yPos);
      ctx.lineTo(_.W, yPos);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* ==================== 形状渲染 ==================== */

  function renderShapes(shapes) {
    if (!shapes || !shapes.length) return;

    var sorted = shapes.slice().sort(function (a, b) {
      var za = a.z || 0;
      var zb = b.z || 0;
      return za - zb;
    });

    for (var i = 0; i < sorted.length; i++) {
      var shape = sorted[i];
      renderShape(shape);
    }
  }

  function renderShape(shape) {
    var ctx = _.ctx;
    if (!shape || !shape.type) return;

    var screenPts = shape.points ? transformPoints(shape.points) : null;
    var scale = _.scale;

    ctx.save();
    if (shape.opacity !== undefined) ctx.globalAlpha = shape.opacity;

    switch (shape.type) {
      case 'rope':
        var radius = (shape.radius || 0.08) * scale;
        drawRope(ctx, screenPts, shape.color, radius, { tension: shape.tension });
        break;

      case 'bead':
        var pos = worldToScreen(shape.x || 0, shape.y || 0);
        var beadR = (shape.r || shape.radius || 0.1) * scale;
        drawBead(ctx, pos.x, pos.y, beadR, shape.color);
        break;

      case 'tassel':
        var tPos = worldToScreen(shape.x || 0, shape.y || 0);
        var tHeight = (shape.height || 0.5) * scale;
        var tRad = (shape.radius || 0.1) * scale;
        drawTassel(ctx, tPos.x, tPos.y, tHeight, tRad, shape.strandCount || 12, shape.color);
        break;

      case 'circle':
        var cPos = worldToScreen(shape.x || 0, shape.y || 0);
        var cR = (shape.r || shape.radius || 0.1) * scale;
        ctx.fillStyle = shape.color || '#C41E3A';
        ctx.beginPath();
        ctx.arc(cPos.x, cPos.y, cR, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }

  /* ==================== 步骤管理 ==================== */

  function clearAllSteps() {
    _.stepShapes = {};
    _.currentStep = -1;
  }

  function buildStepShapes(stepIdx) {
    var impl = currentImpl();
    if (!impl || !impl.builders || !impl.builders[stepIdx]) return [];
    return impl.builders[stepIdx]();
  }

  S.renderStep = function (stepIdx, totalSteps, knotId) {
    if (!_.ctx) return;
    if (knotId) Knots2D.setCurrent(knotId);

    var impl = currentImpl();
    if (!impl) {
      console.warn('[Scene2D] no knot impl registered');
      return;
    }

    clearAllSteps();
    _.currentStep = stepIdx;

    var shapes = buildStepShapes(stepIdx);
    _.stepShapes[stepIdx] = shapes;
  };

  S.transitionTo = function (fromIdx, toIdx, totalSteps, onComplete, knotId) {
    if (!_.ctx) return;
    if (knotId) Knots2D.setCurrent(knotId);

    var impl = currentImpl();
    if (!impl) {
      console.warn('[Scene2D] no knot impl registered');
      if (onComplete) onComplete();
      return;
    }

    if (fromIdx === toIdx) {
      if (onComplete) onComplete();
      return;
    }

    _.transition.fromShapes = buildStepShapes(fromIdx);
    _.transition.toShapes = buildStepShapes(toIdx);
    _.transition.fromIdx = fromIdx;
    _.transition.toIdx = toIdx;
    _.transition.t = 0;
    _.transition.duration = 800;
    _.transition.onComplete = onComplete || null;
    _.transition.active = true;

    _.currentStep = toIdx;
  };

  S.isTransitioning = function () {
    return _.transition.active;
  };

  /* ==================== 收紧动画 ==================== */

  S.renderTighten = function (percent) {
    if (!_.ctx) return;
    var impl = currentImpl();
    if (!impl || !impl.tightenBuilder) return;

    _.tightenValue = percent;
    var tightenIdx = impl.tightenStep !== undefined ? impl.tightenStep : 5;

    clearAllSteps();
    _.currentStep = tightenIdx;

    var t = Math.max(0, Math.min(1, percent / 100));
    var shapes = impl.tightenBuilder(t);
    _.stepShapes[tightenIdx] = shapes;
  };

  /* ==================== 游戏化系统 ==================== */

  S.celebrateStep = function (stepIdx) {
    _.game.combo++;
    if (_.game.combo > _.game.maxCombo) _.game.maxCombo = _.game.combo;
    var xpEarned = _.game.stepXP + (_.game.combo > 1 ? _.game.comboBonus * (_.game.combo - 1) : 0);
    _.game.totalXP += xpEarned;
    _.game.celebrating = true;
    _.game.celebrateTimer = 1.5;

    spawnCelebrationParticles();

    return {
      combo: _.game.combo,
      xpEarned: xpEarned,
      totalXP: _.game.totalXP,
      maxCombo: _.game.maxCombo
    };
  };

  S.resetCombo = function () {
    _.game.combo = 0;
  };

  S.getGameState = function () {
    return {
      combo: _.game.combo,
      maxCombo: _.game.maxCombo,
      totalXP: _.game.totalXP,
      stepXP: _.game.stepXP,
      comboBonus: _.game.comboBonus
    };
  };

  function spawnCelebrationParticles() {
    _.game.particles = [];
    var count = 40;
    var palette = ['#FFD700', '#FF4444', '#FF8C00', '#FF69B4', '#FFFFFF'];

    for (var i = 0; i < count; i++) {
      _.game.particles.push({
        x: (Math.random() - 0.5) * 0.5,
        y: -0.5 + Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 3,
        vy: 1.5 + Math.random() * 2.5,
        color: palette[Math.floor(Math.random() * palette.length)],
        life: 1,
        size: 3 + Math.random() * 4
      });
    }
  }

  function updateCelebration(dt) {
    if (_.game.celebrating) {
      _.game.celebrateTimer -= dt;
      if (_.game.celebrateTimer <= 0) {
        _.game.celebrating = false;
      }
    }

    var particles = _.game.particles;
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 3 * dt;
      p.vx *= 0.98;
      p.life -= dt * 1.2;

      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function drawCelebration() {
    var ctx = _.ctx;
    var particles = _.game.particles;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var pos = worldToScreen(p.x, p.y);
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ==================== 渲染循环 ==================== */

  function render() {
    if (!_.ctx) return;

    drawBackground(_.ctx);

    if (_.transition.active && _.transition.fromShapes && _.transition.toShapes) {
      var t = easeInOutCubic(_.transition.t);

      var maxLen = Math.max(_.transition.fromShapes.length, _.transition.toShapes.length);
      var interpShapes = [];

      for (var i = 0; i < maxLen; i++) {
        var fromShape = _.transition.fromShapes[i];
        var toShape = _.transition.toShapes[i];

        if (fromShape && toShape && fromShape.type === toShape.type &&
            fromShape.points && toShape.points &&
            fromShape.points.length === toShape.points.length) {
          var interpPts = lerpPoints(fromShape.points, toShape.points, t);
          interpShapes.push({
            type: fromShape.type,
            points: interpPts,
            color: toShape.color || fromShape.color,
            radius: toShape.radius || fromShape.radius,
            z: (fromShape.z || 0) + ((toShape.z || 0) - (fromShape.z || 0)) * t,
            tension: fromShape.tension
          });
        } else if (toShape) {
          interpShapes.push(Object.assign({}, toShape, { opacity: t }));
        } else if (fromShape) {
          interpShapes.push(Object.assign({}, fromShape, { opacity: 1 - t }));
        }
      }

      renderShapes(interpShapes);
    } else if (_.currentStep >= 0 && _.stepShapes[_.currentStep]) {
      renderShapes(_.stepShapes[_.currentStep]);
    }

    drawCelebration();
  }

  function animate(timestamp) {
    if (!_.ctx) return;
    _.animId = requestAnimationFrame(animate);

    var dt = (timestamp - _.lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    _.lastTime = timestamp;

    if (_.transition.active) {
      _.transition.t += dt * 1000 / _.transition.duration;
      if (_.transition.t >= 1) {
        _.transition.t = 1;
        _.transition.active = false;
        _.stepShapes[_.transition.toIdx] = _.transition.toShapes;
        if (_.transition.onComplete) {
          var cb = _.transition.onComplete;
          _.transition.onComplete = null;
          cb();
        }
      }
    }

    updateCelebration(dt);

    for (var i = 0; i < _.frameCallbacks.length; i++) {
      _.frameCallbacks[i](dt, timestamp / 1000);
    }

    render();
  }

  /* ==================== 公共 API ==================== */

  S.init = function (container, width, height) {
    if (!container) return;

    console.log('[Scene2D] Init', (width || 500) + 'x' + (height || 340));

    if (_.canvas && _.containerEl === container) {
      S.resize(width, height);
      return;
    }

    container.innerHTML = '';
    S.dispose();
    _.containerEl = container;
    _.W = width || 500;
    _.H = height || 340;

    _.canvas = document.createElement('canvas');
    _.canvas.width = _.W;
    _.canvas.height = _.H;
    _.canvas.style.display = 'block';
    _.canvas.style.width = '100%';
    _.canvas.style.height = '100%';
    container.appendChild(_.canvas);

    _.ctx = _.canvas.getContext('2d');

    clearAllSteps();
    _.tightenValue = 0;
    _.game.combo = 0;
    _.game.maxCombo = 0;
    _.game.totalXP = 0;
    _.game.particles = [];
    _.transition.active = false;

    _.scale = Math.min(_.W, _.H) / 8;
    _.offsetX = 0;
    _.offsetY = 0;

    _.lastTime = performance.now();
    _.animId = requestAnimationFrame(animate);
  };

  S.resize = function (w, h) {
    if (!_.canvas || !_.ctx) return;
    _.W = w;
    _.H = h;
    _.canvas.width = w;
    _.canvas.height = h;
    _.scale = Math.min(w, h) / 8;
  };

  S.dispose = function () {
    if (_.animId) {
      cancelAnimationFrame(_.animId);
      _.animId = null;
    }

    for (var i = 0; i < _.disposeCallbacks.length; i++) {
      _.disposeCallbacks[i]();
    }

    if (_.canvas && _.canvas.parentNode) {
      _.canvas.parentNode.removeChild(_.canvas);
    }
    _.canvas = null;
    _.ctx = null;
    _.containerEl = null;

    clearAllSteps();
    _.transition.active = false;
    _.game.particles = [];
  };

  S.Knots2D = Knots2D;

})(Scene2D);
