(function () {
  'use strict';

  var ROPE_COLOR = '#C41E3A';
  var ROPE_DARK = '#8B0000';
  var ROPE_RADIUS = 0.075;
  var BEAD_COLOR = '#FFD700';

  var KNOT_SIZE = 1.3;
  var EAR_LEN = 0.35;

  function buildHuiPath(cx, cy, size, isInner, direction) {
    var pts = [];
    var s = size;
    var half = s / 2;
    var segs = 12;

    function push(x, y) {
      pts.push({ x: cx + x, y: cy + y });
    }

    function pushLine(x1, y1, x2, y2, n) {
      n = n || segs;
      for (var i = 0; i <= n; i++) {
        var t = i / n;
        push(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
      }
    }

    if (direction === 'cw') {
      push(-half + s * 0.1, half);
      pushLine(-half + s * 0.1, half, half - s * 0.1, half);
      pushLine(half - s * 0.1, half, half, half - s * 0.1);
      pushLine(half, half - s * 0.1, half, -half + s * 0.1);
      pushLine(half, -half + s * 0.1, half - s * 0.1, -half);
      pushLine(half - s * 0.1, -half, -half + s * 0.1, -half);
      pushLine(-half + s * 0.1, -half, -half, -half + s * 0.1);
      pushLine(-half, -half + s * 0.1, -half, half - s * 0.1);
      pushLine(-half, half - s * 0.1, -half + s * 0.1, half);
    } else {
      push(-half + s * 0.1, half);
      pushLine(-half + s * 0.1, half, -half, half - s * 0.1);
      pushLine(-half, half - s * 0.1, -half, -half + s * 0.1);
      pushLine(-half, -half + s * 0.1, -half + s * 0.1, -half);
      pushLine(-half + s * 0.1, -half, half - s * 0.1, -half);
      pushLine(half - s * 0.1, -half, half, -half + s * 0.1);
      pushLine(half, -half + s * 0.1, half, half - s * 0.1);
      pushLine(half, half - s * 0.1, half - s * 0.1, half);
      pushLine(half - s * 0.1, half, -half + s * 0.1, half);
    }

    return pts;
  }

  function buildEarPts(cx, cy, len, angle) {
    var pts = [];
    var segs = 16;

    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var x = cx + Math.cos(angle) * len * t;
      var y = cy + Math.sin(angle) * len * t;
      var w = len * 0.18 * Math.sin(t * Math.PI);
      var px = x + Math.cos(angle + Math.PI / 2) * w;
      var py = y + Math.sin(angle + Math.PI / 2) * w;
      pts.push({ x: px, y: py });
    }

    for (var j = segs - 1; j >= 0; j--) {
      var t2 = j / segs;
      var x2 = cx + Math.cos(angle) * len * t2;
      var y2 = cy + Math.sin(angle) * len * t2;
      var w2 = len * 0.18 * Math.sin(t2 * Math.PI);
      var px2 = x2 - Math.cos(angle + Math.PI / 2) * w2;
      var py2 = y2 - Math.sin(angle + Math.PI / 2) * w2;
      pts.push({ x: px2, y: py2 });
    }

    return pts;
  }

  function buildFullKnotShapes(t) {
    t = Math.max(0, Math.min(1, t || 1));
    var size = KNOT_SIZE * (0.65 + 0.35 * t);
    var looseness = 1 - t;
    var shapes = [];

    var outerSize = size;
    var innerSize = size * 0.5;

    var outerPathCW = buildHuiPath(0, 0, outerSize, false, 'cw');
    shapes.push({
      type: 'rope',
      points: outerPathCW,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.03
    });

    var outerPathCCW = buildHuiPath(0, 0, outerSize, false, 'ccw');
    shapes.push({
      type: 'rope',
      points: outerPathCCW,
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: -0.03
    });

    var innerPathCW = buildHuiPath(0, 0, innerSize, true, 'cw');
    shapes.push({
      type: 'rope',
      points: innerPathCW,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.9,
      z: 0.01
    });

    var innerPathCCW = buildHuiPath(0, 0, innerSize, true, 'ccw');
    shapes.push({
      type: 'rope',
      points: innerPathCCW,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.9,
      z: -0.01
    });

    var earLen = EAR_LEN * (0.7 + 0.3 * t);
    var half = outerSize / 2;

    var topEar = buildEarPts(0, half, earLen, Math.PI / 2);
    shapes.push({
      type: 'rope',
      points: topEar,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.85,
      z: 0.02
    });

    var bottomEar = buildEarPts(0, -half, earLen, -Math.PI / 2);
    shapes.push({
      type: 'rope',
      points: bottomEar,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.85,
      z: -0.02
    });

    var leftEar = buildEarPts(-half, 0, earLen, Math.PI);
    shapes.push({
      type: 'rope',
      points: leftEar,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.85,
      z: -0.02
    });

    var rightEar = buildEarPts(half, 0, earLen, 0);
    shapes.push({
      type: 'rope',
      points: rightEar,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.85,
      z: 0.02
    });

    shapes.push({
      type: 'bead',
      x: 0,
      y: -half - earLen - 0.1,
      r: 0.12,
      color: BEAD_COLOR,
      z: 0.1
    });

    shapes.push({
      type: 'tassel',
      x: 0,
      y: -half - earLen - 0.25,
      height: 0.5,
      strandCount: 16,
      radius: 0.14,
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
        { x: -0.9, y: 0.68 },
        { x: -0.5, y: 0.7 },
        { x: -0.2, y: 0.62 }
      ],
      color: ROPE_COLOR,
      radius: 0.055,
      z: 0
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -1.2, y: 0.35 },
        { x: -0.85, y: 0.43 },
        { x: -0.45, y: 0.45 },
        { x: -0.15, y: 0.37 }
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
      x: 1.0, y: 0.45, r: 0.1, color: BEAD_COLOR, z: 0.1
    });

    shapes.push({
      type: 'tassel',
      x: 1.2, y: -0.15,
      height: 0.45,
      strandCount: 14,
      radius: 0.13,
      color: ROPE_COLOR,
      z: -0.1
    });

    return shapes;
  }

  function buildAxis() {
    var shapes = [];
    var s = KNOT_SIZE * 0.6;

    shapes.push({
      type: 'rope',
      points: [
        { x: -s * 0.5, y: s * 0.7 },
        { x: -s * 0.45, y: s * 0.3 },
        { x: -s * 0.45, y: -s * 0.3 },
        { x: -s * 0.5, y: -s * 0.7 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: s * 0.5, y: s * 0.7 },
        { x: s * 0.45, y: s * 0.3 },
        { x: s * 0.45, y: -s * 0.3 },
        { x: s * 0.5, y: -s * 0.7 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: -0.02
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -s * 0.65, y: s * 0.45 },
        { x: -s * 0.2, y: s * 0.4 },
        { x: s * 0.2, y: s * 0.4 },
        { x: s * 0.65, y: s * 0.45 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.01
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -s * 0.65, y: -s * 0.45 },
        { x: -s * 0.2, y: -s * 0.4 },
        { x: s * 0.2, y: -s * 0.4 },
        { x: s * 0.65, y: -s * 0.45 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: -0.01
    });

    return shapes;
  }

  function buildRightWrap() {
    var shapes = [];
    var s = KNOT_SIZE * 0.6;

    shapes.push({
      type: 'rope',
      points: [
        { x: -s * 0.5, y: s * 0.7 },
        { x: -s * 0.45, y: s * 0.3 },
        { x: -s * 0.45, y: -s * 0.3 },
        { x: -s * 0.5, y: -s * 0.7 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -s * 0.65, y: s * 0.45 },
        { x: -s * 0.2, y: s * 0.4 },
        { x: s * 0.2, y: s * 0.4 },
        { x: s * 0.65, y: s * 0.45 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.01
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -s * 0.65, y: -s * 0.45 },
        { x: -s * 0.2, y: -s * 0.4 },
        { x: s * 0.2, y: -s * 0.4 },
        { x: s * 0.65, y: -s * 0.45 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: -0.01
    });

    var rightPath = [];
    var segs = 12;
    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      rightPath.push({ x: s * 0.5, y: s * 0.7 - s * 0.4 * t });
    }
    for (var j = 0; j <= segs; j++) {
      var t2 = j / segs;
      rightPath.push({ x: s * 0.5 - s * 0.95 * t2, y: s * 0.3 });
    }
    for (var k = 0; k <= segs; k++) {
      var t3 = k / segs;
      rightPath.push({ x: -s * 0.45, y: s * 0.3 - s * 0.6 * t3 });
    }
    for (var m = 0; m <= segs; m++) {
      var t4 = m / segs;
      rightPath.push({ x: -s * 0.45 + s * 0.95 * t4, y: -s * 0.3 });
    }
    for (var n = 0; n <= segs; n++) {
      var t5 = n / segs;
      rightPath.push({ x: s * 0.5, y: -s * 0.3 - s * 0.4 * t5 });
    }

    shapes.push({
      type: 'rope',
      points: rightPath,
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.05,
      z: 0.05
    });

    return shapes;
  }

  function buildLeftWeave() {
    var shapes = [];
    var s = KNOT_SIZE * 0.58;

    var outerPath = buildHuiPath(0, 0, s * 1.1, false, 'cw');
    shapes.push({
      type: 'rope',
      points: outerPath,
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: -0.02
    });

    var leftPath = [];
    var segs = 10;

    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      leftPath.push({ x: -s * 0.5, y: s * 0.7 - s * 0.25 * t });
    }
    for (var j = 0; j <= segs; j++) {
      var t2 = j / segs;
      leftPath.push({ x: -s * 0.5 + s * 0.25 * t2, y: s * 0.45 });
    }
    for (var k = 0; k <= segs; k++) {
      var t3 = k / segs;
      leftPath.push({ x: s * 0.4, y: s * 0.45 - s * 0.9 * t3 });
    }
    for (var m = 0; m <= segs; m++) {
      var t4 = m / segs;
      leftPath.push({ x: s * 0.4 - s * 0.85 * t4, y: -s * 0.45 });
    }
    for (var n = 0; n <= segs; n++) {
      var t5 = n / segs;
      leftPath.push({ x: -s * 0.45, y: -s * 0.45 - s * 0.25 * t5 });
    }

    shapes.push({
      type: 'rope',
      points: leftPath,
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.05,
      z: 0.05
    });

    return shapes;
  }

  function buildInitialKnot() {
    return buildFullKnotShapes(0.55);
  }

  function buildTopBottomWeave() {
    return buildFullKnotShapes(0.7);
  }

  function buildTighten() {
    return buildFullKnotShapes(0.9);
  }

  function buildFinal() {
    return buildFullKnotShapes(1.0);
  }

  function tightenBuilder(t) {
    return buildFullKnotShapes(t);
  }

  Knots2D.register('pan-chang', {
    builders: [
      buildPreview,
      buildMaterials,
      buildAxis,
      buildRightWrap,
      buildLeftWeave,
      buildInitialKnot,
      buildTopBottomWeave,
      buildTighten,
      buildFinal
    ],
    tightenStep: 7,
    tightenBuilder: tightenBuilder,
    interactions: { threadStep: 4, tightenStep: 7 }
  });

})();
