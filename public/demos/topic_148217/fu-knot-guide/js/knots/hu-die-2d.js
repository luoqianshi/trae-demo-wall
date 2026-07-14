(function () {
  'use strict';

  var ROPE_COLOR = '#C41E3A';
  var ROPE_DARK = '#8B0000';
  var ROPE_RADIUS = 0.075;
  var BEAD_COLOR = '#FFD700';

  var WING_W = 0.65;
  var WING_H = 0.5;
  var BODY_W = 0.18;
  var BODY_H = 0.28;
  var ANTENNA_LEN = 0.25;
  var TAIL_LEN = 0.5;

  function wingPts(cx, cy, w, h, side) {
    var dir = side === 'right' ? 1 : -1;
    var pts = [];
    var segs = 24;

    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var ang = Math.PI + t * Math.PI;
      var rx = w * 0.6;
      var ry = h * 0.55;
      pts.push({
        x: cx + dir * w * 0.15 + Math.cos(ang) * rx * dir,
        y: cy + h * 0.05 + Math.sin(ang) * ry
      });
    }

    for (var j = segs - 1; j >= 0; j--) {
      var t2 = j / segs;
      var ang2 = Math.PI * 0.15 + t2 * Math.PI * 0.7;
      var rx2 = w * 0.42;
      var ry2 = h * 0.42;
      pts.push({
        x: cx + dir * w * 0.08 + Math.cos(ang2) * rx2 * dir,
        y: cy - h * 0.1 + Math.sin(ang2) * ry2
      });
    }

    return pts;
  }

  function bodyPts(cx, cy, w, h) {
    var pts = [];
    var segs = 20;

    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var ang = Math.PI / 2 + t * Math.PI * 2;
      var rx = w;
      var ry = h;
      pts.push({
        x: cx + Math.cos(ang) * rx,
        y: cy + Math.sin(ang) * ry
      });
    }

    return pts;
  }

  function antennaPts(cx, cy, len, side) {
    var dir = side === 'right' ? 1 : -1;
    var pts = [];
    var segs = 12;

    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var x = cx + dir * len * 0.3 * t;
      var y = cy + len * t;
      pts.push({ x: x, y: y });
    }

    for (var j = segs - 1; j >= 0; j--) {
      var t2 = j / segs;
      var x2 = cx + dir * len * 0.3 * t2 + dir * 0.04;
      var y2 = cy + len * t2;
      pts.push({ x: x2, y: y2 });
    }

    return pts;
  }

  function tailPts(cx, cy, len, side) {
    var dir = side === 'right' ? 1 : -1;
    var pts = [];
    var segs = 16;

    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var x = cx + dir * 0.04 + dir * Math.sin(t * Math.PI * 1.5) * 0.06;
      var y = cy - len * t;
      pts.push({ x: x, y: y });
    }

    return pts;
  }

  function buildFullKnotShapes(t) {
    t = Math.max(0, Math.min(1, t || 1));
    var scale = 0.6 + 0.4 * t;
    var shapes = [];

    var ww = WING_W * scale;
    var wh = WING_H * scale;
    var bw = BODY_W * scale;
    var bh = BODY_H * scale;
    var al = ANTENNA_LEN * scale;
    var tl = TAIL_LEN * scale;

    var leftWing = wingPts(-ww * 0.1, 0, ww, wh, 'left');
    shapes.push({
      type: 'rope',
      points: leftWing,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    var rightWing = wingPts(ww * 0.1, 0, ww, wh, 'right');
    shapes.push({
      type: 'rope',
      points: rightWing,
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: -0.02
    });

    var body = bodyPts(0, 0, bw, bh);
    shapes.push({
      type: 'rope',
      points: body,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 1.1,
      z: 0.05
    });

    var leftAntenna = antennaPts(-bw * 0.3, bh * 0.7, al, 'left');
    shapes.push({
      type: 'rope',
      points: leftAntenna,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.6,
      z: 0.03
    });

    var rightAntenna = antennaPts(bw * 0.3, bh * 0.7, al, 'right');
    shapes.push({
      type: 'rope',
      points: rightAntenna,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.6,
      z: -0.03
    });

    var leftTail = tailPts(-bw * 0.25, -bh * 0.6, tl, 'left');
    shapes.push({
      type: 'rope',
      points: leftTail,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.75,
      z: 0.01
    });

    var rightTail = tailPts(bw * 0.25, -bh * 0.6, tl, 'right');
    shapes.push({
      type: 'rope',
      points: rightTail,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.75,
      z: -0.01
    });

    shapes.push({
      type: 'bead',
      x: 0,
      y: -bh * 0.6 - tl - 0.1,
      r: 0.1,
      color: BEAD_COLOR,
      z: 0.1
    });

    shapes.push({
      type: 'tassel',
      x: 0,
      y: -bh * 0.6 - tl - 0.22,
      height: 0.4,
      strandCount: 14,
      radius: 0.12,
      color: ROPE_COLOR,
      z: -0.1
    });

    return shapes;
  }

  function buildPreview() {
    return buildFullKnotShapes(1.0);
  }

  function buildMaterials() {
    var shapes = [];

    shapes.push({
      type: 'rope',
      points: [
        { x: -1.2, y: 0.6 },
        { x: -0.85, y: 0.68 },
        { x: -0.45, y: 0.7 },
        { x: -0.1, y: 0.6 }
      ],
      color: ROPE_COLOR,
      radius: 0.055,
      z: 0
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -1.2, y: 0.35 },
        { x: -0.8, y: 0.43 },
        { x: -0.4, y: 0.45 },
        { x: -0.05, y: 0.35 }
      ],
      color: ROPE_DARK,
      radius: 0.05,
      z: 0.01
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -0.9, y: 0.05 },
        { x: -0.5, y: 0.1 },
        { x: 0, y: 0.08 },
        { x: 0.5, y: 0.04 },
        { x: 0.9, y: 0.02 }
      ],
      color: ROPE_COLOR,
      radius: 0.045,
      z: 0
    });

    shapes.push({
      type: 'bead',
      x: 1.0, y: 0.45, r: 0.09, color: BEAD_COLOR, z: 0.1
    });

    shapes.push({
      type: 'tassel',
      x: 1.15, y: -0.1,
      height: 0.4,
      strandCount: 12,
      radius: 0.12,
      color: ROPE_COLOR,
      z: -0.1
    });

    return shapes;
  }

  function buildPrepare() {
    var shapes = [];

    shapes.push({
      type: 'rope',
      points: [
        { x: -0.6, y: 0.7 },
        { x: -0.5, y: 0.3 },
        { x: -0.45, y: -0.1 },
        { x: -0.4, y: -0.5 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: 0.6, y: 0.7 },
        { x: 0.5, y: 0.3 },
        { x: 0.45, y: -0.1 },
        { x: 0.4, y: -0.5 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: -0.02
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -0.3, y: 0.1 },
        { x: 0, y: 0.15 },
        { x: 0.3, y: 0.1 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.9,
      z: 0.01
    });

    return shapes;
  }

  function buildLeftWing() {
    var shapes = [];
    var ww = WING_W * 0.65;
    var wh = WING_H * 0.65;
    var bw = BODY_W * 0.65;
    var bh = BODY_H * 0.65;

    shapes.push({
      type: 'rope',
      points: [
        { x: 0.5, y: 0.6 },
        { x: 0.42, y: 0.2 },
        { x: 0.38, y: -0.2 },
        { x: 0.32, y: -0.55 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: -0.02
    });

    var leftWing = wingPts(-ww * 0.1, 0, ww, wh, 'left');
    shapes.push({
      type: 'rope',
      points: leftWing,
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.05,
      z: 0.05
    });

    var body = bodyPts(0, 0, bw * 0.8, bh * 0.8);
    shapes.push({
      type: 'rope',
      points: body,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.95,
      z: 0.03
    });

    return shapes;
  }

  function buildRightWing() {
    var shapes = [];
    var ww = WING_W * 0.62;
    var wh = WING_H * 0.62;
    var bw = BODY_W * 0.62;
    var bh = BODY_H * 0.62;

    var leftWing = wingPts(-ww * 0.1, 0, ww, wh, 'left');
    shapes.push({
      type: 'rope',
      points: leftWing,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    var rightWing = wingPts(ww * 0.1, 0, ww, wh, 'right');
    shapes.push({
      type: 'rope',
      points: rightWing,
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.05,
      z: 0.05
    });

    var body = bodyPts(0, 0, bw * 0.85, bh * 0.85);
    shapes.push({
      type: 'rope',
      points: body,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 1.0,
      z: 0.04
    });

    return shapes;
  }

  function buildCenterKnot() {
    return buildFullKnotShapes(0.55);
  }

  function buildAntennae() {
    return buildFullKnotShapes(0.75);
  }

  function buildAdjustShape() {
    return buildFullKnotShapes(0.9);
  }

  function buildFinal() {
    return buildFullKnotShapes(1.0);
  }

  function tightenBuilder(t) {
    return buildFullKnotShapes(t);
  }

  Knots2D.register('hu-die', {
    builders: [
      buildPreview,
      buildMaterials,
      buildPrepare,
      buildLeftWing,
      buildRightWing,
      buildCenterKnot,
      buildAntennae,
      buildAdjustShape,
      buildFinal
    ],
    tightenStep: 7,
    tightenBuilder: tightenBuilder,
    interactions: { threadStep: 5, tightenStep: 7 }
  });

})();
