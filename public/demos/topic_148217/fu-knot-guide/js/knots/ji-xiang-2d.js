/**
 * ji-xiang-2d.js - 吉祥结 2D 实现
 *
 * 形态：卍字花形，四个方向各伸出一个耳翼，对称美观
 * 主色：#C41E3A（红），暗色：#8B0000（深红）
 * 步骤：0预览 1材料 2十字摆线 3三耳起头 4上耳穿线 5右耳穿线 6左耳穿线 7收紧调形 8收尾
 */
(function () {
  'use strict';

  var ROPE_COLOR = '#C41E3A';
  var ROPE_DARK = '#8B0000';
  var ROPE_RADIUS = 0.08;
  var BEAD_COLOR = '#FFD700';

  var KNOT_SIZE = 1.6;
  var EAR_LEN = 0.55;
  var CENTER_R = 0.25;

  function buildEarPts(cx, cy, len, width, angle) {
    var pts = [];
    var segs = 16;
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);

    function rotate(x, y) {
      return {
        x: cx + x * cos - y * sin,
        y: cy + x * sin + y * cos
      };
    }

    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var ang = Math.PI * 0.3 + t * Math.PI * 0.4;
      var rx = width * 0.5;
      var ry = len * 0.3;
      pts.push(rotate(
        Math.cos(ang) * rx,
        len * 0.3 + Math.sin(ang) * ry
      ));
    }

    for (var j = 1; j <= segs; j++) {
      var jt = j / segs;
      var ang2 = Math.PI * 0.7 + jt * Math.PI * 0.5;
      var rx2 = width * 0.45;
      var ry2 = len * 0.35;
      pts.push(rotate(
        Math.cos(ang2) * rx2,
        Math.sin(ang2) * ry2
      ));
    }

    var tipPt = rotate(0, -len * 0.5);
    var lastPt = pts[pts.length - 1];
    for (var k = 1; k <= 8; k++) {
      var kt = k / 8;
      pts.push({
        x: lastPt.x + (tipPt.x - lastPt.x) * kt,
        y: lastPt.y + (tipPt.y - lastPt.y) * kt
      });
    }

    var innerPt = rotate(width * 0.15, len * 0.15);
    for (var m = 1; m <= 10; m++) {
      var mt = m / 10;
      var t1 = 1 - mt;
      pts.push({
        x: t1 * t1 * tipPt.x + 2 * t1 * mt * (tipPt.x + width * 0.1) + mt * mt * innerPt.x,
        y: t1 * t1 * tipPt.y + 2 * t1 * mt * (tipPt.y + len * 0.2) + mt * mt * innerPt.y
      });
    }

    return pts;
  }

  function buildCenterCrossPts(r, looseness) {
    looseness = looseness !== undefined ? looseness : 0;
    var pts = [];
    var segs = 8;

    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      pts.push({
        x: -r + t * r * 2,
        y: r * (0.1 + looseness * 0.1)
      });
    }

    for (var j = 1; j <= segs; j++) {
      var jt = j / segs;
      pts.push({
        x: r * (0.1 + looseness * 0.1),
        y: r - jt * r * 2
      });
    }

    for (var k = 1; k <= segs; k++) {
      var kt = k / segs;
      pts.push({
        x: r - kt * r * 2,
        y: -r * (0.1 + looseness * 0.1)
      });
    }

    for (var m = 1; m <= segs; m++) {
      var mt = m / segs;
      pts.push({
        x: -r * (0.1 + looseness * 0.1),
        y: -r + mt * r * 2
      });
    }

    return pts;
  }

  function buildFullKnotShapes(t) {
    t = Math.max(0, Math.min(1, t || 1));
    var looseness = 1 - t;
    var shapes = [];

    var size = KNOT_SIZE * (1 + looseness * 0.12);
    var earLen = EAR_LEN * (1 + looseness * 0.15);
    var earW = 0.35 * (1 + looseness * 0.1);
    var centerR = CENTER_R * (1 + looseness * 0.1);

    var topEarPts = buildEarPts(0, size * 0.35, earLen, earW, 0);
    shapes.push({
      type: 'rope',
      points: topEarPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.04
    });

    var rightEarPts = buildEarPts(size * 0.35, 0, earLen, earW, -Math.PI / 2);
    shapes.push({
      type: 'rope',
      points: rightEarPts,
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    var bottomEarPts = buildEarPts(0, -size * 0.35, earLen, earW, Math.PI);
    shapes.push({
      type: 'rope',
      points: bottomEarPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: -0.02
    });

    var leftEarPts = buildEarPts(-size * 0.35, 0, earLen, earW, Math.PI / 2);
    shapes.push({
      type: 'rope',
      points: leftEarPts,
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: -0.04
    });

    var centerPts = buildCenterCrossPts(centerR, looseness);
    shapes.push({
      type: 'rope',
      points: centerPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.9,
      z: 0.01
    });

    var centerPts2 = buildCenterCrossPts(centerR * 0.7, looseness);
    shapes.push({
      type: 'rope',
      points: centerPts2,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.75,
      z: 0.03
    });

    var topTailPts = [];
    for (var i = 0; i <= 8; i++) {
      var it = i / 8;
      topTailPts.push({
        x: -0.05 + it * 0.1,
        y: size * 0.35 + earLen * 0.5 + it * 0.15
      });
    }
    shapes.push({
      type: 'rope',
      points: topTailPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.75,
      z: 0.1
    });

    var botTailY = -size * 0.35 - earLen * 0.5 - 0.15;
    shapes.push({
      type: 'rope',
      points: [
        { x: -0.04, y: -size * 0.35 - earLen * 0.5 },
        { x: -0.03, y: botTailY }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.7,
      z: 0.05
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: 0.04, y: -size * 0.35 - earLen * 0.5 },
        { x: 0.03, y: botTailY - 0.02 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.7,
      z: 0.04
    });

    shapes.push({
      type: 'bead',
      x: 0,
      y: botTailY - 0.15,
      r: 0.12,
      color: BEAD_COLOR,
      z: 0.15
    });

    shapes.push({
      type: 'tassel',
      x: 0,
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

  function buildCross() {
    var shapes = [];
    var len = KNOT_SIZE * 0.6;

    shapes.push({
      type: 'rope',
      points: [
        { x: -len * 0.5, y: 0 },
        { x: -len * 0.3, y: 0.02 },
        { x: -len * 0.1, y: -0.01 },
        { x: 0.1, y: 0.01 },
        { x: len * 0.3, y: -0.02 },
        { x: len * 0.5, y: 0 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.85,
      z: 0
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: 0, y: len * 0.5 },
        { x: 0.02, y: len * 0.3 },
        { x: -0.01, y: len * 0.1 },
        { x: 0.01, y: -len * 0.1 },
        { x: -0.02, y: -len * 0.3 },
        { x: 0, y: -len * 0.5 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.85,
      z: 0.02
    });

    return shapes;
  }

  function buildThreeEars() {
    var shapes = [];
    var size = KNOT_SIZE * 0.7;
    var earLen = EAR_LEN * 0.8;
    var earW = 0.32;

    shapes.push({
      type: 'rope',
      points: [
        { x: -size * 0.4, y: 0 },
        { x: size * 0.4, y: 0 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.75,
      z: -0.02
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: 0, y: -size * 0.4 },
        { x: 0, y: size * 0.4 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.75,
      z: 0
    });

    var topEarPts = buildEarPts(0, size * 0.3, earLen, earW, 0);
    shapes.push({
      type: 'rope',
      points: topEarPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.04
    });

    var rightEarPts = buildEarPts(size * 0.3, 0, earLen, earW, -Math.PI / 2);
    shapes.push({
      type: 'rope',
      points: rightEarPts,
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    var bottomEarPts = buildEarPts(0, -size * 0.3, earLen, earW, Math.PI);
    shapes.push({
      type: 'rope',
      points: bottomEarPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: -0.02
    });

    return shapes;
  }

  function buildTopEar() {
    var shapes = [];
    var size = KNOT_SIZE * 0.68;
    var earLen = EAR_LEN * 0.78;
    var earW = 0.31;
    var centerR = CENTER_R * 0.85;

    shapes.push({
      type: 'rope',
      points: [
        { x: -size * 0.38, y: 0 },
        { x: size * 0.38, y: 0 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.7,
      z: -0.03
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: 0, y: -size * 0.38 },
        { x: 0, y: size * 0.38 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.7,
      z: -0.01
    });

    var topEarPts = buildEarPts(0, size * 0.28, earLen, earW, 0);
    shapes.push({
      type: 'rope',
      points: topEarPts,
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.08,
      z: 0.06
    });

    var rightEarPts = buildEarPts(size * 0.28, 0, earLen * 0.95, earW * 0.95, -Math.PI / 2);
    shapes.push({
      type: 'rope',
      points: rightEarPts,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.95,
      z: 0.02
    });

    var bottomEarPts = buildEarPts(0, -size * 0.28, earLen * 0.95, earW * 0.95, Math.PI);
    shapes.push({
      type: 'rope',
      points: bottomEarPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.95,
      z: -0.02
    });

    var centerPts = buildCenterCrossPts(centerR, 0.3);
    shapes.push({
      type: 'rope',
      points: centerPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.8,
      z: 0.01
    });

    return shapes;
  }

  function buildRightEar() {
    var shapes = [];
    var size = KNOT_SIZE * 0.72;
    var earLen = EAR_LEN * 0.82;
    var earW = 0.32;
    var centerR = CENTER_R * 0.88;

    var topEarPts = buildEarPts(0, size * 0.3, earLen, earW, 0);
    shapes.push({
      type: 'rope',
      points: topEarPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.97,
      z: 0.04
    });

    var rightEarPts = buildEarPts(size * 0.3, 0, earLen, earW, -Math.PI / 2);
    shapes.push({
      type: 'rope',
      points: rightEarPts,
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.08,
      z: 0.06
    });

    var bottomEarPts = buildEarPts(0, -size * 0.3, earLen * 0.97, earW * 0.97, Math.PI);
    shapes.push({
      type: 'rope',
      points: bottomEarPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.93,
      z: -0.02
    });

    var centerPts = buildCenterCrossPts(centerR, 0.25);
    shapes.push({
      type: 'rope',
      points: centerPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.82,
      z: 0.01
    });

    return shapes;
  }

  function buildLeftEar() {
    var shapes = [];
    var size = KNOT_SIZE * 0.76;
    var earLen = EAR_LEN * 0.86;
    var earW = 0.33;
    var centerR = CENTER_R * 0.9;

    var topEarPts = buildEarPts(0, size * 0.32, earLen, earW, 0);
    shapes.push({
      type: 'rope',
      points: topEarPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.95,
      z: 0.04
    });

    var rightEarPts = buildEarPts(size * 0.32, 0, earLen, earW, -Math.PI / 2);
    shapes.push({
      type: 'rope',
      points: rightEarPts,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.95,
      z: 0.02
    });

    var bottomEarPts = buildEarPts(0, -size * 0.32, earLen, earW, Math.PI);
    shapes.push({
      type: 'rope',
      points: bottomEarPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.95,
      z: -0.02
    });

    var leftEarPts = buildEarPts(-size * 0.32, 0, earLen, earW, Math.PI / 2);
    shapes.push({
      type: 'rope',
      points: leftEarPts,
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.08,
      z: 0.06
    });

    var centerPts = buildCenterCrossPts(centerR, 0.2);
    shapes.push({
      type: 'rope',
      points: centerPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.85,
      z: 0.01
    });

    var centerPts2 = buildCenterCrossPts(centerR * 0.72, 0.2);
    shapes.push({
      type: 'rope',
      points: centerPts2,
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.7,
      z: 0.03
    });

    return shapes;
  }

  function buildTighten() {
    return buildFullKnotShapes(0.78);
  }

  function buildFinal() {
    return buildFullKnotShapes(1.0);
  }

  function tightenBuilder(t) {
    return buildFullKnotShapes(t);
  }

  Knots2D.register('ji-xiang', {
    builders: [
      buildPreview,
      buildMaterials,
      buildCross,
      buildThreeEars,
      buildTopEar,
      buildRightEar,
      buildLeftEar,
      buildTighten,
      buildFinal
    ],
    tightenStep: 7,
    tightenBuilder: tightenBuilder,
    interactions: { threadStep: 4, tightenStep: 7 }
  });

})();
