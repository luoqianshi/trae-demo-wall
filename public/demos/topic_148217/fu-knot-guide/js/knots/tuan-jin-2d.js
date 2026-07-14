(function () {
  'use strict';

  var ROPE_COLOR = '#C41E3A';
  var ROPE_DARK = '#8B0000';
  var ROPE_RADIUS = 0.07;
  var BEAD_COLOR = '#FFD700';

  var CENTER_R = 0.3;
  var PETAL_LEN = 0.55;
  var PETAL_COUNT = 5;

  function circlePts(cx, cy, r, segs) {
    segs = segs || 32;
    var pts = [];
    for (var i = 0; i <= segs; i++) {
      var a = (i / segs) * Math.PI * 2;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    return pts;
  }

  function petalPts(cx, cy, len, angle, width) {
    width = width || 0.2;
    var pts = [];
    var segs = 20;

    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var dist = len * t;
      var w = width * Math.sin(t * Math.PI);
      var baseX = cx + Math.cos(angle) * dist;
      var baseY = cy + Math.sin(angle) * dist;
      var perpX = Math.cos(angle + Math.PI / 2) * w;
      var perpY = Math.sin(angle + Math.PI / 2) * w;
      pts.push({ x: baseX + perpX, y: baseY + perpY });
    }

    for (var j = segs - 1; j >= 0; j--) {
      var t2 = j / segs;
      var dist2 = len * t2;
      var w2 = width * Math.sin(t2 * Math.PI);
      var baseX2 = cx + Math.cos(angle) * dist2;
      var baseY2 = cy + Math.sin(angle) * dist2;
      var perpX2 = -Math.cos(angle + Math.PI / 2) * w2;
      var perpY2 = -Math.sin(angle + Math.PI / 2) * w2;
      pts.push({ x: baseX2 + perpX2, y: baseY2 + perpY2 });
    }

    return pts;
  }

  function buildFullKnotShapes(t) {
    t = Math.max(0, Math.min(1, t || 1));
    var scale = 0.6 + 0.4 * t;
    var shapes = [];

    var centerR = CENTER_R * scale;
    var petalLen = PETAL_LEN * scale;
    var petalW = 0.2 * scale;

    var centerPts = circlePts(0, 0, centerR, 40);
    shapes.push({
      type: 'rope',
      points: centerPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    var centerPts2 = circlePts(0, 0, centerR * 0.7, 36);
    shapes.push({
      type: 'rope',
      points: centerPts2,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.85,
      z: -0.02
    });

    for (var i = 0; i < PETAL_COUNT; i++) {
      var angle = (i / PETAL_COUNT) * Math.PI * 2 - Math.PI / 2;
      var petal = petalPts(0, 0, petalLen, angle, petalW);
      shapes.push({
        type: 'rope',
        points: petal,
        color: i % 2 === 0 ? ROPE_COLOR : ROPE_DARK,
        radius: ROPE_RADIUS * 0.9,
        z: i % 2 === 0 ? 0.01 : -0.01
      });
    }

    shapes.push({
      type: 'bead',
      x: 0,
      y: -centerR - petalLen - 0.1,
      r: 0.11,
      color: BEAD_COLOR,
      z: 0.1
    });

    shapes.push({
      type: 'tassel',
      x: 0,
      y: -centerR - petalLen - 0.22,
      height: 0.45,
      strandCount: 14,
      radius: 0.13,
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
        { x: -1.1, y: 0.55 },
        { x: -0.8, y: 0.62 },
        { x: -0.4, y: 0.64 },
        { x: -0.1, y: 0.58 }
      ],
      color: ROPE_COLOR,
      radius: 0.05,
      z: 0
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -1.1, y: 0.3 },
        { x: -0.75, y: 0.37 },
        { x: -0.35, y: 0.39 },
        { x: -0.05, y: 0.33 }
      ],
      color: ROPE_DARK,
      radius: 0.045,
      z: 0.01
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -0.8, y: 0.02 },
        { x: -0.4, y: 0.07 },
        { x: 0, y: 0.05 },
        { x: 0.4, y: 0.01 },
        { x: 0.8, y: -0.01 }
      ],
      color: ROPE_COLOR,
      radius: 0.04,
      z: 0
    });

    shapes.push({
      type: 'bead',
      x: 1.0, y: 0.4, r: 0.09, color: BEAD_COLOR, z: 0.1
    });

    shapes.push({
      type: 'tassel',
      x: 1.1, y: -0.15,
      height: 0.4,
      strandCount: 12,
      radius: 0.12,
      color: ROPE_COLOR,
      z: -0.1
    });

    return shapes;
  }

  function buildCenterRing() {
    var shapes = [];
    var r = CENTER_R * 0.7;

    var centerPts = circlePts(0, 0.1, r, 36);
    shapes.push({
      type: 'rope',
      points: centerPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: r * 0.5, y: 0.1 - r * 0.9 },
        { x: r * 0.3, y: 0.1 - r - 0.3 },
        { x: r * 0.1, y: 0.1 - r - 0.5 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.8,
      z: 0.01
    });

    return shapes;
  }

  function buildFirstPetal() {
    var shapes = [];
    var r = CENTER_R * 0.65;
    var pLen = PETAL_LEN * 0.7;

    var centerPts = circlePts(0, 0.05, r, 36);
    shapes.push({
      type: 'rope',
      points: centerPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    var petal = petalPts(0, 0.05, pLen, -Math.PI / 2, 0.18);
    shapes.push({
      type: 'rope',
      points: petal,
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.05,
      z: 0.05
    });

    return shapes;
  }

  function buildTwoThreePetals() {
    var shapes = [];
    var r = CENTER_R * 0.62;
    var pLen = PETAL_LEN * 0.68;

    var centerPts = circlePts(0, 0.05, r, 36);
    shapes.push({
      type: 'rope',
      points: centerPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    var petal1 = petalPts(0, 0.05, pLen, -Math.PI / 2, 0.17);
    shapes.push({
      type: 'rope',
      points: petal1,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.95,
      z: 0.01
    });

    var petal2 = petalPts(0, 0.05, pLen, -Math.PI / 2 + Math.PI * 2 / 5, 0.17);
    shapes.push({
      type: 'rope',
      points: petal2,
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.05,
      z: 0.05
    });

    var petal3 = petalPts(0, 0.05, pLen, -Math.PI / 2 - Math.PI * 2 / 5, 0.17);
    shapes.push({
      type: 'rope',
      points: petal3,
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.05,
      z: 0.04
    });

    return shapes;
  }

  function buildFourFivePetals() {
    var shapes = [];
    var r = CENTER_R * 0.6;
    var pLen = PETAL_LEN * 0.65;

    var centerPts = circlePts(0, 0.05, r, 36);
    shapes.push({
      type: 'rope',
      points: centerPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    for (var i = 0; i < 5; i++) {
      var angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      var isHighlight = i >= 2;
      var petal = petalPts(0, 0.05, pLen, angle, 0.16);
      shapes.push({
        type: 'rope',
        points: petal,
        color: isHighlight ? '#FF6347' : ROPE_DARK,
        radius: isHighlight ? ROPE_RADIUS * 1.05 : ROPE_RADIUS * 0.95,
        z: isHighlight ? 0.05 : 0.01
      });
    }

    return shapes;
  }

  function buildThreadFix() {
    return buildFullKnotShapes(0.6);
  }

  function buildTightenShape() {
    return buildFullKnotShapes(0.85);
  }

  function buildFinalDecor() {
    return buildFullKnotShapes(1.0);
  }

  function tightenBuilder(t) {
    return buildFullKnotShapes(t);
  }

  Knots2D.register('tuan-jin', {
    builders: [
      buildPreview,
      buildMaterials,
      buildCenterRing,
      buildFirstPetal,
      buildTwoThreePetals,
      buildFourFivePetals,
      buildThreadFix,
      buildTightenShape,
      buildFinalDecor
    ],
    tightenStep: 7,
    tightenBuilder: tightenBuilder,
    interactions: { threadStep: 6, tightenStep: 7 }
  });

})();
