/**
 * ping-jie-2d.js - 平安结（平结） 2D 实现
 *
 * 形态：竖直方向的鳞片状纹理，由左右两线交替编织而成
 * 主色：#C41E3A（红），暗色：#8B0000（深红）
 * 步骤：0预览 1材料 2固定轴线 3左线绕轴 4右线绕轴 5第二层 6持续编织 7收紧整理 8收尾
 */
(function () {
  'use strict';

  var ROPE_COLOR = '#C41E3A';
  var ROPE_DARK = '#8B0000';
  var ROPE_RADIUS = 0.08;
  var BEAD_COLOR = '#FFD700';

  var KNOT_W = 0.9;
  var KNOT_H = 2.0;
  var SCALE_COUNT = 8;

  function buildScalePts(cx, cy, w, h, isLeft, color) {
    var pts = [];
    var segs = 12;

    if (isLeft) {
      for (var i = 0; i <= segs; i++) {
        var t = i / segs;
        var ang = Math.PI * 0.2 + t * Math.PI * 0.6;
        pts.push({
          x: cx - w * 0.15 + Math.cos(ang) * w * 0.35,
          y: cy + h * 0.3 + Math.sin(ang) * h * 0.25
        });
      }
      for (var j = 1; j <= segs; j++) {
        var jt = j / segs;
        var ang2 = Math.PI * 0.8 + jt * Math.PI * 0.4;
        pts.push({
          x: cx - w * 0.1 + Math.cos(ang2) * w * 0.4,
          y: cy + Math.sin(ang2) * h * 0.3
        });
      }
      for (var k = 1; k <= 6; k++) {
        var kt = k / 6;
        pts.push({
          x: cx - w * 0.5 + kt * w * 0.35,
          y: cy - h * 0.3 + kt * h * 0.1
        });
      }
    } else {
      for (var i2 = 0; i2 <= segs; i2++) {
        var t2 = i2 / segs;
        var ang3 = Math.PI * 0.2 + t2 * Math.PI * 0.6;
        pts.push({
          x: cx + w * 0.15 - Math.cos(ang3) * w * 0.35,
          y: cy + h * 0.3 + Math.sin(ang3) * h * 0.25
        });
      }
      for (var j2 = 1; j2 <= segs; j2++) {
        var jt2 = j2 / segs;
        var ang4 = Math.PI * 0.8 + jt2 * Math.PI * 0.4;
        pts.push({
          x: cx + w * 0.1 - Math.cos(ang4) * w * 0.4,
          y: cy + Math.sin(ang4) * h * 0.3
        });
      }
      for (var k2 = 1; k2 <= 6; k2++) {
        var kt2 = k2 / 6;
        pts.push({
          x: cx + w * 0.5 - kt2 * w * 0.35,
          y: cy - h * 0.3 + kt2 * h * 0.1
        });
      }
    }

    return pts;
  }

  function buildFullKnotShapes(t) {
    t = Math.max(0, Math.min(1, t || 1));
    var looseness = 1 - t;
    var shapes = [];

    var w = KNOT_W * (1 - looseness * 0.15);
    var h = KNOT_H * (1 - looseness * 0.1);
    var topY = h * 0.5;
    var botY = -h * 0.5;
    var scaleH = h / SCALE_COUNT;
    var scaleW = w * 0.45;

    shapes.push({
      type: 'rope',
      points: [
        { x: -w * 0.08, y: topY + h * 0.1 },
        { x: -w * 0.06, y: topY },
        { x: -w * 0.05, y: botY },
        { x: -w * 0.06, y: botY - h * 0.15 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.7,
      z: -0.05
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: w * 0.08, y: topY + h * 0.1 },
        { x: w * 0.06, y: topY },
        { x: w * 0.05, y: botY },
        { x: w * 0.06, y: botY - h * 0.15 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.7,
      z: -0.05
    });

    for (var i = 0; i < SCALE_COUNT; i++) {
      var cy = topY - scaleH * (i + 0.5);
      var isLeft = i % 2 === 0;
      var color = isLeft ? ROPE_COLOR : ROPE_DARK;
      var z = isLeft ? 0.02 : -0.02;

      var scalePts = buildScalePts(0, cy, scaleW + looseness * scaleW * 0.1, scaleH * 1.2 + looseness * scaleH * 0.1, isLeft, color);
      shapes.push({
        type: 'rope',
        points: scalePts,
        color: color,
        radius: ROPE_RADIUS,
        z: z + i * 0.001
      });
    }

    shapes.push({
      type: 'rope',
      points: [
        { x: -w * 0.12, y: topY + h * 0.1 },
        { x: 0, y: topY + h * 0.18 },
        { x: w * 0.12, y: topY + h * 0.1 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.8,
      z: 0.1
    });

    var tailY = botY - h * 0.2;
    shapes.push({
      type: 'rope',
      points: [
        { x: -w * 0.06, y: botY - h * 0.15 },
        { x: -w * 0.04, y: tailY }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.7,
      z: -0.01
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: w * 0.06, y: botY - h * 0.15 },
        { x: w * 0.04, y: tailY - h * 0.02 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.7,
      z: -0.01
    });

    shapes.push({
      type: 'bead',
      x: 0,
      y: tailY - h * 0.15,
      r: 0.12,
      color: BEAD_COLOR,
      z: 0.1
    });

    shapes.push({
      type: 'tassel',
      x: 0,
      y: tailY - h * 0.28,
      height: 0.6,
      strandCount: 18,
      radius: 0.15,
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

  function buildAxis() {
    var shapes = [];
    var h = KNOT_H * 0.9;
    var topY = h * 0.5;
    var botY = -h * 0.5;

    shapes.push({
      type: 'rope',
      points: [
        { x: -0.08, y: topY + h * 0.15 },
        { x: -0.06, y: topY },
        { x: -0.05, y: botY },
        { x: -0.06, y: botY - h * 0.1 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.7,
      z: 0
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: 0.08, y: topY + h * 0.15 },
        { x: 0.06, y: topY },
        { x: 0.05, y: botY },
        { x: 0.06, y: botY - h * 0.1 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.7,
      z: 0.01
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -0.12, y: topY + h * 0.15 },
        { x: 0, y: topY + h * 0.22 },
        { x: 0.12, y: topY + h * 0.15 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.8,
      z: 0.1
    });

    return shapes;
  }

  function buildLeftWrap() {
    var shapes = [];
    var h = KNOT_H * 0.85;
    var topY = h * 0.5;
    var botY = -h * 0.5;
    var w = KNOT_W * 0.8;

    shapes.push({
      type: 'rope',
      points: [
        { x: -0.07, y: topY + h * 0.12 },
        { x: -0.05, y: topY },
        { x: -0.04, y: botY },
        { x: -0.05, y: botY - h * 0.08 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.65,
      z: -0.03
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: 0.07, y: topY + h * 0.12 },
        { x: 0.05, y: topY },
        { x: 0.04, y: botY },
        { x: 0.05, y: botY - h * 0.08 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.65,
      z: -0.03
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -0.1, y: topY + h * 0.12 },
        { x: 0, y: topY + h * 0.18 },
        { x: 0.1, y: topY + h * 0.12 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.75,
      z: 0.1
    });

    var scalePts = buildScalePts(0, topY - h * 0.15, w * 0.4, h * 0.2, true, ROPE_COLOR);
    shapes.push({
      type: 'rope',
      points: scalePts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.05
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -w * 0.45, y: topY - h * 0.3 },
        { x: -w * 0.5, y: topY - h * 0.4 }
      ],
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.05,
      z: 0.06
    });

    return shapes;
  }

  function buildRightWrap() {
    var shapes = [];
    var h = KNOT_H * 0.85;
    var topY = h * 0.5;
    var botY = -h * 0.5;
    var w = KNOT_W * 0.8;

    shapes.push({
      type: 'rope',
      points: [
        { x: -0.07, y: topY + h * 0.12 },
        { x: -0.05, y: topY },
        { x: -0.04, y: botY },
        { x: -0.05, y: botY - h * 0.08 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.65,
      z: -0.03
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: 0.07, y: topY + h * 0.12 },
        { x: 0.05, y: topY },
        { x: 0.04, y: botY },
        { x: 0.05, y: botY - h * 0.08 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.65,
      z: -0.03
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -0.1, y: topY + h * 0.12 },
        { x: 0, y: topY + h * 0.18 },
        { x: 0.1, y: topY + h * 0.12 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.75,
      z: 0.1
    });

    var leftScalePts = buildScalePts(0, topY - h * 0.12, w * 0.38, h * 0.18, true, ROPE_COLOR);
    shapes.push({
      type: 'rope',
      points: leftScalePts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.97,
      z: 0.02
    });

    var rightScalePts = buildScalePts(0, topY - h * 0.28, w * 0.4, h * 0.2, false, ROPE_DARK);
    shapes.push({
      type: 'rope',
      points: rightScalePts,
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: 0.05
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: w * 0.45, y: topY - h * 0.42 },
        { x: w * 0.5, y: topY - h * 0.5 }
      ],
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.05,
      z: 0.06
    });

    return shapes;
  }

  function buildSecondLayer() {
    var shapes = [];
    var h = KNOT_H * 0.8;
    var topY = h * 0.5;
    var w = KNOT_W * 0.78;
    var scaleH = h / 6;

    shapes.push({
      type: 'rope',
      points: [
        { x: -0.06, y: topY + h * 0.1 },
        { x: -0.045, y: topY },
        { x: -0.04, y: -h * 0.4 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.6,
      z: -0.04
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: 0.06, y: topY + h * 0.1 },
        { x: 0.045, y: topY },
        { x: 0.04, y: -h * 0.4 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 0.6,
      z: -0.04
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -0.09, y: topY + h * 0.1 },
        { x: 0, y: topY + h * 0.16 },
        { x: 0.09, y: topY + h * 0.1 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.7,
      z: 0.1
    });

    for (var i = 0; i < 4; i++) {
      var cy = topY - scaleH * (i + 0.5);
      var isLeft = i % 2 === 0;
      var color = isLeft ? ROPE_COLOR : ROPE_DARK;
      var z = isLeft ? 0.02 : -0.01;

      var scalePts = buildScalePts(0, cy, w * 0.38, scaleH * 1.1, isLeft, color);
      shapes.push({
        type: 'rope',
        points: scalePts,
        color: color,
        radius: ROPE_RADIUS * 0.95,
        z: z + i * 0.002
      });
    }

    var nextScalePts = buildScalePts(0, topY - scaleH * 4.5, w * 0.4, scaleH * 1.15, true, ROPE_COLOR);
    shapes.push({
      type: 'rope',
      points: nextScalePts,
      color: '#FF6347',
      radius: ROPE_RADIUS * 1.05,
      z: 0.05
    });

    return shapes;
  }

  function buildContinueWeave() {
    return buildFullKnotShapes(0.55);
  }

  function buildTighten() {
    return buildFullKnotShapes(0.85);
  }

  function buildFinal() {
    return buildFullKnotShapes(1.0);
  }

  function tightenBuilder(t) {
    return buildFullKnotShapes(t);
  }

  Knots2D.register('ping-jie', {
    builders: [
      buildPreview,
      buildMaterials,
      buildAxis,
      buildLeftWrap,
      buildRightWrap,
      buildSecondLayer,
      buildContinueWeave,
      buildTighten,
      buildFinal
    ],
    tightenStep: 7,
    tightenBuilder: tightenBuilder,
    interactions: { threadStep: 3, tightenStep: 7 }
  });

})();
