/**
 * niu-kou-2d.js - 纽扣结 2D 实现
 *
 * 形态：圆球形，像一颗纽扣或珠子，表面有螺旋缠绕的纹理
 * 主色：#C41E3A（红），暗色：#8B0000（深红）
 * 步骤：0预览 1材料 2绕第一圈 3绕第二圈 4绕第三圈 5上端穿中心 6下端反向穿 7收紧成球 8收尾
 */
(function () {
  'use strict';

  var ROPE_COLOR = '#C41E3A';
  var ROPE_DARK = '#8B0000';
  var ROPE_RADIUS = 0.08;
  var BEAD_COLOR = '#FFD700';

  var KNOT_R = 0.55;
  var SPIRAL_COUNT = 6;

  function buildSpiralPts(cx, cy, r, startAng, endAng, turns, segs) {
    segs = segs || 60;
    var pts = [];
    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var a = startAng + (endAng - startAng) * t;
      var currentR = r * (0.3 + 0.7 * t);
      pts.push({
        x: cx + Math.cos(a + turns * t * Math.PI * 2) * currentR * 0.95,
        y: cy + Math.sin(a + turns * t * Math.PI * 2) * currentR * 0.8
      });
    }
    return pts;
  }

  function buildCirclePts(cx, cy, r, startAng, endAng, segs) {
    segs = segs || 32;
    var pts = [];
    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var a = startAng + (endAng - startAng) * t;
      pts.push({
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r
      });
    }
    return pts;
  }

  function buildFullKnotShapes(t) {
    t = Math.max(0, Math.min(1, t || 1));
    var looseness = 1 - t;
    var shapes = [];

    var r = KNOT_R * (1 + looseness * 0.2);
    var cx = 0;
    var cy = 0;

    var baseCirclePts = buildCirclePts(cx, cy, r, 0, Math.PI * 2, 48);
    shapes.push({
      type: 'rope',
      points: baseCirclePts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 1.1,
      z: -0.05
    });

    for (var i = 0; i < SPIRAL_COUNT; i++) {
      var startAng = (i / SPIRAL_COUNT) * Math.PI * 2;
      var endAng = startAng + Math.PI * 1.5;
      var isDark = i % 2 === 0;
      var color = isDark ? ROPE_DARK : ROPE_COLOR;
      var z = -0.03 + i * 0.012;

      var spiralPts = buildSpiralPts(cx, cy, r, startAng, endAng, 0.8, 40);
      shapes.push({
        type: 'rope',
        points: spiralPts,
        color: color,
        radius: ROPE_RADIUS * (0.9 + looseness * 0.1),
        z: z
      });
    }

    var topHolePts = buildCirclePts(cx, cy + r * 0.1, r * 0.25, 0, Math.PI * 2, 24);
    shapes.push({
      type: 'rope',
      points: topHolePts,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.6,
      z: 0.05
    });

    var botHolePts = buildCirclePts(cx, cy - r * 0.1, r * 0.22, 0, Math.PI * 2, 24);
    shapes.push({
      type: 'rope',
      points: botHolePts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.55,
      z: 0.04
    });

    var topTailPts = [];
    var tailSegs = 8;
    for (var j = 0; j <= tailSegs; j++) {
      var jt = j / tailSegs;
      topTailPts.push({
        x: cx - r * 0.08 + jt * r * 0.1,
        y: cy + r * 0.9 + jt * r * 0.5
      });
    }
    shapes.push({
      type: 'rope',
      points: topTailPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.8,
      z: 0.1
    });

    var botTailY = cy - r * 0.9 - r * 0.4;
    shapes.push({
      type: 'rope',
      points: [
        { x: cx - r * 0.06, y: cy - r * 0.85 },
        { x: cx - r * 0.04, y: botTailY }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.75,
      z: 0.08
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: cx + r * 0.06, y: cy - r * 0.85 },
        { x: cx + r * 0.04, y: botTailY - 0.02 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.75,
      z: 0.07
    });

    shapes.push({
      type: 'bead',
      x: cx,
      y: botTailY - 0.15,
      r: 0.12,
      color: BEAD_COLOR,
      z: 0.15
    });

    shapes.push({
      type: 'tassel',
      x: cx,
      y: botTailY - 0.32,
      height: 0.55,
      strandCount: 16,
      radius: 0.14,
      color: ROPE_COLOR,
      z: -0.05
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
        { x: -1.2, y: 0.7 },
        { x: -0.9, y: 0.75 },
        { x: -0.6, y: 0.72 },
        { x: -0.3, y: 0.65 }
      ],
      color: ROPE_COLOR,
      radius: 0.06,
      z: 0
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -1.2, y: 0.45 },
        { x: -0.85, y: 0.52 },
        { x: -0.5, y: 0.5 },
        { x: -0.2, y: 0.42 }
      ],
      color: ROPE_DARK,
      radius: 0.055,
      z: 0.01
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -1.0, y: 0.15 },
        { x: -0.6, y: 0.2 },
        { x: -0.2, y: 0.18 },
        { x: 0.2, y: 0.12 },
        { x: 0.6, y: 0.08 }
      ],
      color: ROPE_COLOR,
      radius: 0.05,
      z: 0
    });

    shapes.push({
      type: 'bead',
      x: 0.9, y: 0.55, r: 0.11, color: BEAD_COLOR, z: 0.1
    });

    shapes.push({
      type: 'tassel',
      x: 1.1, y: -0.15,
      height: 0.45,
      strandCount: 14,
      radius: 0.13,
      color: ROPE_COLOR,
      z: -0.1
    });

    return shapes;
  }

  function buildFirstLoop() {
    var shapes = [];
    var r = KNOT_R * 0.9;

    var circlePts = buildCirclePts(0, 0, r, 0, Math.PI * 1.8, 36);
    shapes.push({
      type: 'rope',
      points: circlePts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    var tailPts = [];
    for (var i = 0; i <= 10; i++) {
      var t = i / 10;
      tailPts.push({
        x: r * 0.95 + t * 0.2,
        y: r * 0.2 + t * r * 0.3
      });
    }
    shapes.push({
      type: 'rope',
      points: tailPts,
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.05,
      z: 0.05
    });

    return shapes;
  }

  function buildSecondLoop() {
    var shapes = [];
    var r = KNOT_R * 0.92;

    var firstLoop = buildCirclePts(0, 0, r, 0, Math.PI * 2, 48);
    shapes.push({
      type: 'rope',
      points: firstLoop,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.97,
      z: -0.02
    });

    var secondLoop = buildCirclePts(0, 0, r * 0.88, Math.PI * 0.3, Math.PI * 2.1, 40);
    shapes.push({
      type: 'rope',
      points: secondLoop,
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    var tailPts = [];
    for (var i = 0; i <= 10; i++) {
      var t = i / 10;
      tailPts.push({
        x: -r * 0.7 + t * 0.15,
        y: r * 0.45 + t * r * 0.25
      });
    }
    shapes.push({
      type: 'rope',
      points: tailPts,
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.05,
      z: 0.06
    });

    return shapes;
  }

  function buildThirdLoop() {
    var shapes = [];
    var r = KNOT_R * 0.9;

    var firstLoop = buildCirclePts(0, 0, r, 0, Math.PI * 2, 48);
    shapes.push({
      type: 'rope',
      points: firstLoop,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.95,
      z: -0.04
    });

    var secondLoop = buildCirclePts(0, 0, r * 0.86, Math.PI * 0.3, Math.PI * 2.3, 44);
    shapes.push({
      type: 'rope',
      points: secondLoop,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.95,
      z: 0
    });

    var thirdSpiral = buildSpiralPts(0, 0, r * 0.8, Math.PI * 0.6, Math.PI * 2.4, 0.6, 40);
    shapes.push({
      type: 'rope',
      points: thirdSpiral,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.04
    });

    var tailPts = [];
    for (var i = 0; i <= 10; i++) {
      var t = i / 10;
      tailPts.push({
        x: r * 0.6 - t * 0.1,
        y: -r * 0.4 - t * r * 0.2
      });
    }
    shapes.push({
      type: 'rope',
      points: tailPts,
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.05,
      z: 0.07
    });

    return shapes;
  }

  function buildTopThread() {
    var shapes = [];
    var r = KNOT_R * 0.88;

    var baseCircle = buildCirclePts(0, 0, r, 0, Math.PI * 2, 48);
    shapes.push({
      type: 'rope',
      points: baseCircle,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.93,
      z: -0.04
    });

    for (var i = 0; i < 3; i++) {
      var startAng = (i / 3) * Math.PI * 2;
      var isDark = i % 2 === 0;
      var color = isDark ? ROPE_DARK : ROPE_COLOR;
      var z = -0.02 + i * 0.015;

      var spiralPts = buildSpiralPts(0, 0, r, startAng, startAng + Math.PI * 1.6, 0.7, 36);
      shapes.push({
        type: 'rope',
        points: spiralPts,
        color: color,
        radius: ROPE_RADIUS * 0.95,
        z: z
      });
    }

    var threadPts = [];
    for (var j = 0; j <= 12; j++) {
      var jt = j / 12;
      threadPts.push({
        x: -r * 0.15 + jt * r * 0.2,
        y: r * 0.9 + jt * r * 0.3
      });
    }
    shapes.push({
      type: 'rope',
      points: threadPts,
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.08,
      z: 0.08
    });

    var topHolePts = buildCirclePts(0, r * 0.1, r * 0.28, 0, Math.PI * 2, 24);
    shapes.push({
      type: 'rope',
      points: topHolePts,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.55,
      z: 0.06
    });

    return shapes;
  }

  function buildBottomThread() {
    var shapes = [];
    var r = KNOT_R * 0.86;

    var baseCircle = buildCirclePts(0, 0, r, 0, Math.PI * 2, 48);
    shapes.push({
      type: 'rope',
      points: baseCircle,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.92,
      z: -0.05
    });

    for (var i = 0; i < 4; i++) {
      var startAng = (i / 4) * Math.PI * 2;
      var isDark = i % 2 === 0;
      var color = isDark ? ROPE_DARK : ROPE_COLOR;
      var z = -0.03 + i * 0.014;

      var spiralPts = buildSpiralPts(0, 0, r, startAng, startAng + Math.PI * 1.5, 0.75, 38);
      shapes.push({
        type: 'rope',
        points: spiralPts,
        color: color,
        radius: ROPE_RADIUS * 0.93,
        z: z
      });
    }

    var topThreadPts = [];
    for (var j = 0; j <= 10; j++) {
      var jt = j / 10;
      topThreadPts.push({
        x: -r * 0.1 + jt * r * 0.15,
        y: r * 0.85 + jt * r * 0.35
      });
    }
    shapes.push({
      type: 'rope',
      points: topThreadPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.8,
      z: 0.07
    });

    var botThreadPts = [];
    for (var k = 0; k <= 12; k++) {
      var kt = k / 12;
      botThreadPts.push({
        x: r * 0.12 - kt * r * 0.18,
        y: -r * 0.85 - kt * r * 0.3
      });
    }
    shapes.push({
      type: 'rope',
      points: botThreadPts,
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.08,
      z: 0.09
    });

    var topHolePts = buildCirclePts(0, r * 0.1, r * 0.26, 0, Math.PI * 2, 24);
    shapes.push({
      type: 'rope',
      points: topHolePts,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.55,
      z: 0.05
    });

    var botHolePts = buildCirclePts(0, -r * 0.1, r * 0.24, 0, Math.PI * 2, 24);
    shapes.push({
      type: 'rope',
      points: botHolePts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.5,
      z: 0.04
    });

    return shapes;
  }

  function buildTighten() {
    return buildFullKnotShapes(0.82);
  }

  function buildFinal() {
    return buildFullKnotShapes(1.0);
  }

  function tightenBuilder(t) {
    return buildFullKnotShapes(t);
  }

  Knots2D.register('niu-kou', {
    builders: [
      buildPreview,
      buildMaterials,
      buildFirstLoop,
      buildSecondLoop,
      buildThirdLoop,
      buildTopThread,
      buildBottomThread,
      buildTighten,
      buildFinal
    ],
    tightenStep: 7,
    tightenBuilder: tightenBuilder,
    interactions: { threadStep: 5, tightenStep: 7 }
  });

})();
