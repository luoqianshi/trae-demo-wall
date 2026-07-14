/**
 * shuang-qian-2d.js - 双钱结 2D 实现
 *
 * 形态：两枚古铜钱交叠的8字形，两个圆环相扣
 * 主色：#C41E3A（红），暗色：#8B0000（深红）
 * 步骤：0预览 1材料 2准备线材 3绕第一圈 4绕第二圈 5中心穿绕 6调整形状 7收紧定型 8收尾
 */
(function () {
  'use strict';

  var ROPE_COLOR = '#C41E3A';
  var ROPE_DARK = '#8B0000';
  var ROPE_RADIUS = 0.08;
  var BEAD_COLOR = '#FFD700';

  var KNOT_W = 2.0;
  var KNOT_H = 1.2;
  var COIN_R = 0.45;

  function buildCoinPts(cx, cy, r, startAng, endAng, segs) {
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

    var coinR = COIN_R * (1 + looseness * 0.15);
    var w = KNOT_W * (1 + looseness * 0.08);
    var leftCx = -w * 0.28;
    var rightCx = w * 0.28;
    var cy = 0;

    var leftCoinOuter = buildCoinPts(leftCx, cy, coinR, 0, Math.PI * 2, 48);
    shapes.push({
      type: 'rope',
      points: leftCoinOuter,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: -0.03
    });

    var leftCoinInner = buildCoinPts(leftCx, cy, coinR * 0.55, 0, Math.PI * 2, 32);
    shapes.push({
      type: 'rope',
      points: leftCoinInner,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.7,
      z: -0.02
    });

    var rightCoinOuter = buildCoinPts(rightCx, cy, coinR, 0, Math.PI * 2, 48);
    shapes.push({
      type: 'rope',
      points: rightCoinOuter,
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: 0.03
    });

    var rightCoinInner = buildCoinPts(rightCx, cy, coinR * 0.55, 0, Math.PI * 2, 32);
    shapes.push({
      type: 'rope',
      points: rightCoinInner,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.7,
      z: 0.02
    });

    var overlapPts = [];
    var overlapSegs = 20;
    for (var i = 0; i <= overlapSegs; i++) {
      var tt = i / overlapSegs;
      var a = Math.PI * 0.7 + tt * Math.PI * 0.6;
      overlapPts.push({
        x: leftCx + Math.cos(a) * coinR,
        y: cy + Math.sin(a) * coinR
      });
    }
    shapes.push({
      type: 'rope',
      points: overlapPts,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 1.02,
      z: 0.05
    });

    var overlapPts2 = [];
    for (var j = 0; j <= overlapSegs; j++) {
      var jt = j / overlapSegs;
      var a2 = -Math.PI * 0.7 + jt * Math.PI * 0.6;
      overlapPts2.push({
        x: rightCx + Math.cos(a2) * coinR,
        y: cy + Math.sin(a2) * coinR
      });
    }
    shapes.push({
      type: 'rope',
      points: overlapPts2,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 1.02,
      z: 0.06
    });

    var topTailPts = [];
    var tailSegs = 8;
    for (var k = 0; k <= tailSegs; k++) {
      var kt = k / tailSegs;
      topTailPts.push({
        x: leftCx + (rightCx - leftCx) * 0.5 + (kt - 0.5) * coinR * 0.3,
        y: cy + coinR * 0.9 + kt * coinR * 0.4
      });
    }
    shapes.push({
      type: 'rope',
      points: topTailPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.8,
      z: 0.1
    });

    var botTailPts = [];
    for (var m = 0; m <= tailSegs; m++) {
      var mt = m / tailSegs;
      botTailPts.push({
        x: leftCx + (rightCx - leftCx) * 0.5 + (mt - 0.5) * coinR * 0.25,
        y: cy - coinR * 0.9 - mt * coinR * 0.35
      });
    }
    shapes.push({
      type: 'rope',
      points: botTailPts,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.8,
      z: 0.08
    });

    var tailY = cy - coinR * 1.6;
    shapes.push({
      type: 'bead',
      x: 0,
      y: tailY - 0.1,
      r: 0.11,
      color: BEAD_COLOR,
      z: 0.15
    });

    shapes.push({
      type: 'tassel',
      x: 0,
      y: tailY - 0.28,
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

  function buildPrepare() {
    var shapes = [];
    var r = COIN_R * 0.9;

    shapes.push({
      type: 'rope',
      points: [
        { x: -1.0, y: 0.3 },
        { x: -0.7, y: 0.35 },
        { x: -0.4, y: 0.32 },
        { x: -0.1, y: 0.25 },
        { x: 0.2, y: 0.18 },
        { x: 0.5, y: 0.1 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.85,
      z: 0
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -1.0, y: -0.1 },
        { x: -0.7, y: -0.05 },
        { x: -0.4, y: -0.08 },
        { x: -0.1, y: -0.15 },
        { x: 0.2, y: -0.2 },
        { x: 0.5, y: -0.25 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.8,
      z: 0.01
    });

    return shapes;
  }

  function buildFirstLoop() {
    var shapes = [];
    var r = COIN_R * 0.95;
    var cx = -0.3;
    var cy = 0;

    var coinOuter = buildCoinPts(cx, cy, r, 0, Math.PI * 2, 48);
    shapes.push({
      type: 'rope',
      points: coinOuter,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    var coinInner = buildCoinPts(cx, cy, r * 0.55, 0, Math.PI * 2, 32);
    shapes.push({
      type: 'rope',
      points: coinInner,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.65,
      z: 0.01
    });

    var tailPts = [];
    for (var i = 0; i <= 10; i++) {
      var t = i / 10;
      tailPts.push({
        x: cx + r * 0.9 + t * 0.5,
        y: cy + r * 0.3 + t * r * 0.2
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
    var r = COIN_R * 0.95;
    var leftCx = -0.3;
    var rightCx = 0.3;
    var cy = 0;

    var leftCoinOuter = buildCoinPts(leftCx, cy, r, 0, Math.PI * 2, 48);
    shapes.push({
      type: 'rope',
      points: leftCoinOuter,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: -0.02
    });

    var leftCoinInner = buildCoinPts(leftCx, cy, r * 0.55, 0, Math.PI * 2, 32);
    shapes.push({
      type: 'rope',
      points: leftCoinInner,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.65,
      z: -0.01
    });

    var rightCoinOuter = buildCoinPts(rightCx, cy, r, 0, Math.PI * 2, 48);
    shapes.push({
      type: 'rope',
      points: rightCoinOuter,
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: 0.03
    });

    var rightCoinInner = buildCoinPts(rightCx, cy, r * 0.55, 0, Math.PI * 2, 32);
    shapes.push({
      type: 'rope',
      points: rightCoinInner,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.65,
      z: 0.02
    });

    var tailPts = [];
    for (var i = 0; i <= 10; i++) {
      var t = i / 10;
      tailPts.push({
        x: rightCx - r * 0.8 - t * 0.2,
        y: cy + r * 0.4 + t * r * 0.15
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

  function buildCenterWeave() {
    var shapes = [];
    var r = COIN_R * 0.92;
    var leftCx = -0.28;
    var rightCx = 0.28;
    var cy = 0;

    var leftCoinOuter = buildCoinPts(leftCx, cy, r, 0, Math.PI * 2, 48);
    shapes.push({
      type: 'rope',
      points: leftCoinOuter,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.97,
      z: -0.03
    });

    var leftCoinInner = buildCoinPts(leftCx, cy, r * 0.55, 0, Math.PI * 2, 32);
    shapes.push({
      type: 'rope',
      points: leftCoinInner,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.62,
      z: -0.02
    });

    var rightCoinOuter = buildCoinPts(rightCx, cy, r, 0, Math.PI * 2, 48);
    shapes.push({
      type: 'rope',
      points: rightCoinOuter,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.97,
      z: 0.02
    });

    var rightCoinInner = buildCoinPts(rightCx, cy, r * 0.55, 0, Math.PI * 2, 32);
    shapes.push({
      type: 'rope',
      points: rightCoinInner,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.62,
      z: 0.01
    });

    var weavePts = [];
    var weaveSegs = 16;
    for (var i = 0; i <= weaveSegs; i++) {
      var t = i / weaveSegs;
      var a = Math.PI * 0.6 + t * Math.PI * 0.8;
      weavePts.push({
        x: leftCx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r
      });
    }
    shapes.push({
      type: 'rope',
      points: weavePts,
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.08,
      z: 0.06
    });

    var weavePts2 = [];
    for (var j = 0; j <= weaveSegs; j++) {
      var jt = j / weaveSegs;
      var a2 = -Math.PI * 0.6 - jt * Math.PI * 0.8;
      weavePts2.push({
        x: rightCx + Math.cos(a2) * r,
        y: cy + Math.sin(a2) * r
      });
    }
    shapes.push({
      type: 'rope',
      points: weavePts2,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 1.02,
      z: 0.05
    });

    return shapes;
  }

  function buildAdjustShape() {
    return buildFullKnotShapes(0.6);
  }

  function buildTighten() {
    return buildFullKnotShapes(0.88);
  }

  function buildFinal() {
    return buildFullKnotShapes(1.0);
  }

  function tightenBuilder(t) {
    return buildFullKnotShapes(t);
  }

  Knots2D.register('shuang-qian', {
    builders: [
      buildPreview,
      buildMaterials,
      buildPrepare,
      buildFirstLoop,
      buildSecondLoop,
      buildCenterWeave,
      buildAdjustShape,
      buildTighten,
      buildFinal
    ],
    tightenStep: 6,
    tightenBuilder: tightenBuilder,
    interactions: { threadStep: 5, tightenStep: 6 }
  });

})();
