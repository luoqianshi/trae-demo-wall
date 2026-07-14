(function () {
  'use strict';

  var ROPE_COLOR = '#C41E3A';
  var ROPE_DARK = '#8B0000';
  var ROPE_RADIUS = 0.07;
  var BEAD_COLOR = '#FFD700';

  var KNOT_W = 0.35;
  var KNOT_H = 1.6;
  var SEG_H = 0.18;

  function snakeScalePts(cx, cy, w, h, direction) {
    var dir = direction === 'left' ? -1 : 1;
    var pts = [];
    var segs = 16;

    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var y = cy + h * 0.5 - h * t;
      var xOff = w * 0.5 * Math.sin(t * Math.PI);
      pts.push({ x: cx + dir * xOff, y: y });
    }

    for (var j = segs - 1; j >= 0; j--) {
      var t2 = j / segs;
      var y2 = cy + h * 0.5 - h * t2;
      var xOff2 = w * 0.25 * Math.sin(t2 * Math.PI);
      pts.push({ x: cx - dir * xOff2, y: y2 });
    }

    return pts;
  }

  function buildFullKnotShapes(t) {
    t = Math.max(0, Math.min(1, t || 1));
    var scale = 0.55 + 0.45 * t;
    var shapes = [];

    var kw = KNOT_W * scale;
    var kh = KNOT_H * scale;
    var sh = SEG_H * scale;

    var segCount = Math.floor(kh / sh);
    var topY = kh * 0.45;

    for (var i = 0; i < segCount; i++) {
      var cy = topY - i * sh * 0.75;
      var isLeft = i % 2 === 0;
      var scalePts = snakeScalePts(0, cy, kw, sh, isLeft ? 'left' : 'right');
      shapes.push({
        type: 'rope',
        points: scalePts,
        color: isLeft ? ROPE_COLOR : ROPE_DARK,
        radius: ROPE_RADIUS,
        z: isLeft ? 0.01 : -0.01
      });
    }

    shapes.push({
      type: 'rope',
      points: [
        { x: -kw * 0.15, y: topY + sh * 0.8 },
        { x: -kw * 0.1, y: topY + sh * 1.2 },
        { x: -kw * 0.05, y: topY + sh * 1.5 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.85,
      z: 0.02
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: kw * 0.15, y: topY + sh * 0.8 },
        { x: kw * 0.1, y: topY + sh * 1.2 },
        { x: kw * 0.05, y: topY + sh * 1.5 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.85,
      z: -0.02
    });

    var botY = topY - segCount * sh * 0.75;

    shapes.push({
      type: 'rope',
      points: [
        { x: -kw * 0.12, y: botY - sh * 0.3 },
        { x: -kw * 0.08, y: botY - sh * 0.7 },
        { x: -kw * 0.04, y: botY - sh * 1.0 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.8,
      z: 0.01
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: kw * 0.12, y: botY - sh * 0.3 },
        { x: kw * 0.08, y: botY - sh * 0.7 },
        { x: kw * 0.04, y: botY - sh * 1.0 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.8,
      z: -0.01
    });

    shapes.push({
      type: 'bead',
      x: 0,
      y: botY - sh * 1.2,
      r: 0.1,
      color: BEAD_COLOR,
      z: 0.1
    });

    shapes.push({
      type: 'tassel',
      x: 0,
      y: botY - sh * 1.35,
      height: 0.4,
      strandCount: 12,
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
        { x: -0.1, y: 0.62 }
      ],
      color: ROPE_COLOR,
      radius: 0.05,
      z: 0
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -1.2, y: 0.35 },
        { x: -0.8, y: 0.42 },
        { x: -0.4, y: 0.44 },
        { x: -0.05, y: 0.36 }
      ],
      color: ROPE_DARK,
      radius: 0.045,
      z: 0.01
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -0.9, y: 0.05 },
        { x: -0.5, y: 0.09 },
        { x: 0, y: 0.07 },
        { x: 0.5, y: 0.03 },
        { x: 0.9, y: 0.01 }
      ],
      color: ROPE_COLOR,
      radius: 0.04,
      z: 0
    });

    shapes.push({
      type: 'bead',
      x: 1.0, y: 0.42, r: 0.09, color: BEAD_COLOR, z: 0.1
    });

    shapes.push({
      type: 'tassel',
      x: 1.15, y: -0.12,
      height: 0.38,
      strandCount: 12,
      radius: 0.11,
      color: ROPE_COLOR,
      z: -0.1
    });

    return shapes;
  }

  function buildStartFix() {
    var shapes = [];

    shapes.push({
      type: 'rope',
      points: [
        { x: -0.12, y: 0.7 },
        { x: -0.1, y: 0.4 },
        { x: -0.08, y: 0.1 },
        { x: -0.06, y: -0.2 },
        { x: -0.05, y: -0.5 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: 0.12, y: 0.7 },
        { x: 0.1, y: 0.4 },
        { x: 0.08, y: 0.1 },
        { x: 0.06, y: -0.2 },
        { x: 0.05, y: -0.5 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: -0.02
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -0.15, y: 0.6 },
        { x: 0, y: 0.65 },
        { x: 0.15, y: 0.6 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.8,
      z: 0.03
    });

    return shapes;
  }

  function buildFirstKnot() {
    var shapes = [];

    shapes.push({
      type: 'rope',
      points: [
        { x: 0.12, y: 0.7 },
        { x: 0.1, y: 0.45 },
        { x: 0.08, y: 0.1 },
        { x: 0.06, y: -0.25 },
        { x: 0.05, y: -0.55 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: -0.02
    });

    var leftPath = [];
    var segs = 12;

    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      leftPath.push({ x: -0.12, y: 0.7 - 0.25 * t });
    }

    for (var j = 0; j <= segs; j++) {
      var t2 = j / segs;
      leftPath.push({ x: -0.12 + 0.3 * t2, y: 0.45 });
    }

    for (var k = 0; k <= segs; k++) {
      var t3 = k / segs;
      leftPath.push({ x: 0.18, y: 0.45 - 0.15 * t3 });
    }

    for (var m = 0; m <= segs; m++) {
      var t4 = m / segs;
      leftPath.push({ x: 0.18 - 0.28 * t4, y: 0.3 });
    }

    for (var n = 0; n <= segs; n++) {
      var t5 = n / segs;
      leftPath.push({ x: -0.1, y: 0.3 - 0.85 * t5 });
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

  function buildSecondKnot() {
    var shapes = [];
    var kw = KNOT_W * 0.55;
    var sh = SEG_H * 0.55;
    var topY = 0.55;

    var scale1 = snakeScalePts(0, topY, kw, sh, 'left');
    shapes.push({
      type: 'rope',
      points: scale1,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    var rightPath = [];
    var segs = 10;
    var cy2 = topY - sh * 0.75;

    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      rightPath.push({ x: kw * 0.2, y: cy2 + sh * 0.3 - sh * 0.5 * t });
    }

    for (var j = 0; j <= segs; j++) {
      var t2 = j / segs;
      rightPath.push({ x: kw * 0.2 - kw * 0.6 * t2, y: cy2 - sh * 0.2 });
    }

    for (var k = 0; k <= segs; k++) {
      var t3 = k / segs;
      rightPath.push({ x: -kw * 0.4, y: cy2 - sh * 0.2 + sh * 0.4 * t3 });
    }

    for (var m = 0; m <= segs; m++) {
      var t4 = m / segs;
      rightPath.push({ x: -kw * 0.4 + kw * 0.55 * t4, y: cy2 + sh * 0.2 });
    }

    for (var n = 0; n <= segs; n++) {
      var t5 = n / segs;
      rightPath.push({ x: kw * 0.15, y: cy2 + sh * 0.2 - sh * 1.2 * t5 });
    }

    shapes.push({
      type: 'rope',
      points: rightPath,
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.05,
      z: 0.05
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -kw * 0.08, y: cy2 - sh * 1.2 },
        { x: -kw * 0.06, y: cy2 - sh * 1.8 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.85,
      z: 0.01
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: kw * 0.08, y: cy2 - sh * 1.2 },
        { x: kw * 0.06, y: cy2 - sh * 1.8 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.85,
      z: -0.01
    });

    return shapes;
  }

  function buildThirdFourth() {
    return buildFullKnotShapes(0.5);
  }

  function buildContinueWeave() {
    return buildFullKnotShapes(0.72);
  }

  function buildTightenShape() {
    return buildFullKnotShapes(0.9);
  }

  function buildFinal() {
    return buildFullKnotShapes(1.0);
  }

  function tightenBuilder(t) {
    return buildFullKnotShapes(t);
  }

  Knots2D.register('she-jie', {
    builders: [
      buildPreview,
      buildMaterials,
      buildStartFix,
      buildFirstKnot,
      buildSecondKnot,
      buildThirdFourth,
      buildContinueWeave,
      buildTightenShape,
      buildFinal
    ],
    tightenStep: 7,
    tightenBuilder: tightenBuilder,
    interactions: { threadStep: 3, tightenStep: 7 }
  });

})();
