(function () {
  var ROPE_RADIUS = 0.07;
  var ROPE_COLOR = '#C41E3A';
  var ROPE_DARK = '#8B0000';
  var ROPE_LIGHT = '#E84A5F';
  var HIGHLIGHT_COLOR = '#FF8C00';
  var BEAD_COLOR = '#FFD700';
  var TASSEL_COLOR = '#C41E3A';

  var KNOT_W = 1.6;
  var KNOT_H = 2.8;
  var EAR_W = 0.5;
  var EAR_H = 0.4;
  var LOOP_W = 1.2;
  var LOOP_H = 0.5;
  var CENTER_W = 0.5;
  var CENTER_H = 0.6;
  var TAIL_LEN = 0.5;

  function arcPoints(cx, cy, r, startAng, endAng, steps) {
    steps = steps || 20;
    var pts = [];
    for (var i = 0; i <= steps; i++) {
      var t = startAng + (endAng - startAng) * (i / steps);
      pts.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r });
    }
    return pts;
  }

  function bezierPts(p0, p1, p2, p3, steps) {
    steps = steps || 20;
    var pts = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var mt = 1 - t;
      var x = mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x;
      var y = mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y;
      pts.push({ x: x, y: y });
    }
    return pts;
  }

  function mirrorPts(pts) {
    return pts.map(function (p) { return { x: -p.x, y: p.y }; });
  }

  function concatPts() {
    var result = [];
    for (var i = 0; i < arguments.length; i++) {
      var arr = arguments[i];
      for (var j = 0; j < arr.length; j++) {
        if (result.length === 0 ||
            Math.abs(arr[j].x - result[result.length - 1].x) > 0.001 ||
            Math.abs(arr[j].y - result[result.length - 1].y) > 0.001) {
          result.push(arr[j]);
        }
      }
    }
    return result;
  }

  function scalePts(pts, sx, sy, cx, cy) {
    cx = cx || 0;
    cy = cy || 0;
    return pts.map(function (p) {
      return { x: cx + (p.x - cx) * sx, y: cy + (p.y - cy) * sy };
    });
  }

  function buildTopHook() {
    var cx = 0;
    var cy = KNOT_H / 2 - 0.1;
    var r = 0.15;
    return arcPoints(cx, cy, r, Math.PI, 0, 12);
  }

  function buildUpperLoop(looseness) {
    looseness = looseness || 0;
    var w = LOOP_W * (1 + looseness * 0.3);
    var h = LOOP_H * (1 + looseness * 0.2);
    var cy = KNOT_H / 2 - 0.35;

    var leftPt = { x: -w / 2, y: cy };
    var rightPt = { x: w / 2, y: cy };
    var topPt = { x: 0, y: cy + h };
    var cp1l = { x: -w / 2, y: cy + h * 0.7 };
    var cp2l = { x: -w * 0.3, y: cy + h };
    var cp1r = { x: w * 0.3, y: cy + h };
    var cp2r = { x: w / 2, y: cy + h * 0.7 };

    var leftHalf = bezierPts(leftPt, cp1l, cp2l, topPt, 15);
    var rightHalf = bezierPts(topPt, cp1r, cp2r, rightPt, 15);

    return concatPts(leftHalf, rightHalf.slice(1));
  }

  function buildEar(side, looseness) {
    looseness = looseness || 0;
    var s = side === 'left' ? -1 : 1;
    var w = EAR_W * (1 + looseness * 0.3);
    var h = EAR_H * (1 + looseness * 0.2);
    var baseY = KNOT_H / 2 - 0.45;
    var baseX = s * (LOOP_W / 2 - 0.05);
    var tipX = s * (LOOP_W / 2 + w);
    var tipY = baseY + h * 0.3;

    var basePt = { x: baseX, y: baseY };
    var tipPt = { x: tipX, y: tipY };
    var botPt = { x: baseX + s * w * 0.3, y: baseY - h * 0.2 };

    var cp1 = { x: baseX + s * w * 0.3, y: baseY + h * 0.6 };
    var cp2 = { x: tipX - s * w * 0.1, y: tipY + h * 0.1 };
    var cp3 = { x: tipX + s * w * 0.05, y: tipY - h * 0.15 };
    var cp4 = { x: baseX + s * w * 0.15, y: baseY - h * 0.1 };

    var upper = bezierPts(basePt, cp1, cp2, tipPt, 12);
    var lower = bezierPts(tipPt, cp3, cp4, botPt, 12);

    return concatPts(upper, lower.slice(1));
  }

  function buildCenterBox(looseness) {
    looseness = looseness || 0;
    var w = CENTER_W * (1 + looseness * 0.4);
    var h = CENTER_H * (1 + looseness * 0.3);
    var cy = KNOT_H / 2 - 0.95;

    var tl = { x: -w / 2, y: cy + h / 2 };
    var tr = { x: w / 2, y: cy + h / 2 };
    var bl = { x: -w / 2, y: cy - h / 2 };
    var br = { x: w / 2, y: cy - h / 2 };

    return { tl: tl, tr: tr, bl: bl, br: br, cy: cy, w: w, h: h };
  }

  function buildLeftPath(looseness) {
    looseness = looseness || 0;
    var box = buildCenterBox(looseness);
    var upperLoop = buildUpperLoop(looseness);
    var leftEar = buildEar('left', looseness);

    var loopLeftPt = upperLoop[0];
    var earBasePt = leftEar[0];

    var connect1 = bezierPts(
      loopLeftPt,
      { x: loopLeftPt.x, y: loopLeftPt.y - 0.15 },
      { x: earBasePt.x - 0.05, y: earBasePt.y + 0.1 },
      earBasePt,
      8
    );

    var earEnd = leftEar[leftEar.length - 1];
    var boxLeft = { x: box.tl.x, y: box.cy + box.h * 0.2 };

    var connect2 = bezierPts(
      earEnd,
      { x: earEnd.x + 0.08, y: earEnd.y - 0.1 },
      { x: boxLeft.x + 0.05, y: boxLeft.y + 0.1 },
      boxLeft,
      8
    );

    var leftSide = bezierPts(
      boxLeft,
      { x: box.tl.x - 0.03, y: box.cy },
      { x: box.bl.x - 0.02, y: box.cy - box.h * 0.15 },
      { x: box.bl.x + 0.05, y: box.bl.y },
      10
    );

    var tailX = -0.08;
    var tailTopY = box.bl.y - 0.05;
    var tailBotY = box.bl.y - TAIL_LEN;

    var connect3 = bezierPts(
      leftSide[leftSide.length - 1],
      { x: box.bl.x - 0.05, y: box.bl.y - 0.08 },
      { x: tailX + 0.05, y: tailTopY + 0.05 },
      { x: tailX, y: tailTopY },
      6
    );

    var tail = [
      { x: tailX, y: tailTopY },
      { x: tailX - 0.01, y: tailTopY - TAIL_LEN * 0.5 },
      { x: tailX + 0.01, y: tailBotY }
    ];

    return concatPts(
      connect1, leftEar.slice(1), connect2.slice(1),
      leftSide.slice(1), connect3.slice(1), tail.slice(1)
    );
  }

  function buildRightPath(looseness) {
    var leftPts = buildLeftPath(looseness);
    return mirrorPts(leftPts);
  }

  function buildFullKnot(t) {
    t = Math.max(0, Math.min(1, t || 1));
    var looseness = (1 - t) * 0.4;
    var shapes = [];
    var zBase = 0;

    var hookPts = buildTopHook();
    shapes.push({
      type: 'rope',
      points: hookPts,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.8,
      z: zBase + 0.05
    });

    var upperLoop = buildUpperLoop(looseness);
    shapes.push({
      type: 'rope',
      points: upperLoop,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: zBase
    });

    var leftEar = buildEar('left', looseness);
    shapes.push({
      type: 'rope',
      points: leftEar,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: zBase + 0.02
    });

    var rightEar = buildEar('right', looseness);
    shapes.push({
      type: 'rope',
      points: rightEar,
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: zBase - 0.02
    });

    var leftPath = buildLeftPath(looseness);
    shapes.push({
      type: 'rope',
      points: leftPath,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: zBase + 0.03
    });

    var rightPath = buildRightPath(looseness);
    shapes.push({
      type: 'rope',
      points: rightPath,
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: zBase - 0.03
    });

    var box = buildCenterBox(looseness);
    var crossH = [
      { x: -box.w / 2 - 0.05, y: box.cy },
      { x: box.w / 2 + 0.05, y: box.cy }
    ];
    shapes.push({
      type: 'rope',
      points: crossH,
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: zBase + 0.01
    });

    var tailY = box.bl.y - TAIL_LEN - 0.15;

    shapes.push({
      type: 'bead',
      x: 0,
      y: tailY,
      r: 0.1,
      color: BEAD_COLOR,
      z: zBase + 0.1
    });

    shapes.push({
      type: 'tassel',
      x: 0,
      y: tailY - 0.12,
      height: 0.5,
      radius: 0.12,
      strandCount: 18,
      color: TASSEL_COLOR,
      z: zBase
    });

    return shapes;
  }

  function buildPreview() {
    return buildFullKnot(1);
  }

  function buildMaterials() {
    var shapes = [];

    shapes.push({
      type: 'rope',
      points: [
        { x: -0.8, y: 0.3 },
        { x: -0.5, y: 0.5 },
        { x: -0.2, y: 0.45 },
        { x: 0.1, y: 0.55 },
        { x: 0.4, y: 0.4 }
      ],
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 1.2,
      z: 0
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -0.7, y: 0.1 },
        { x: -0.4, y: 0.25 },
        { x: -0.1, y: 0.2 },
        { x: 0.2, y: 0.3 },
        { x: 0.5, y: 0.15 }
      ],
      color: ROPE_DARK,
      radius: ROPE_RADIUS * 1.2,
      z: -0.02
    });

    shapes.push({
      type: 'bead',
      x: 0.5,
      y: -0.1,
      r: 0.12,
      color: BEAD_COLOR,
      z: 0.05
    });

    shapes.push({
      type: 'tassel',
      x: 0.5,
      y: -0.3,
      height: 0.4,
      radius: 0.1,
      strandCount: 14,
      color: TASSEL_COLOR,
      z: 0
    });

    shapes.push({
      type: 'rope',
      points: [
        { x: -0.5, y: -0.3 },
        { x: -0.3, y: -0.3 },
        { x: -0.2, y: -0.5 },
        { x: -0.4, y: -0.5 }
      ],
      color: '#888',
      radius: ROPE_RADIUS * 0.6,
      z: 0.01
    });

    return shapes;
  }

  function buildFold() {
    var shapes = [];
    var hook = buildTopHook();

    shapes.push({
      type: 'rope',
      points: hook,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.9,
      z: 0
    });

    var hookLeft = hook[0];
    var hookRight = hook[hook.length - 1];

    var leftTail = [
      hookLeft,
      { x: hookLeft.x - 0.02, y: hookLeft.y - 1.0 },
      { x: hookLeft.x + 0.02, y: hookLeft.y - 2.0 }
    ];

    var rightTail = [
      hookRight,
      { x: hookRight.x + 0.02, y: hookRight.y - 1.0 },
      { x: hookRight.x - 0.02, y: hookRight.y - 2.0 }
    ];

    shapes.push({
      type: 'rope',
      points: leftTail,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    shapes.push({
      type: 'rope',
      points: rightTail,
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: -0.02
    });

    return shapes;
  }

  function buildRightLoop() {
    var shapes = [];
    var hook = buildTopHook();
    shapes.push({
      type: 'rope',
      points: hook,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS * 0.9,
      z: 0
    });

    var hookLeft = hook[0];
    var leftTail = [
      hookLeft,
      { x: hookLeft.x - 0.02, y: hookLeft.y - 1.2 },
      { x: hookLeft.x + 0.01, y: hookLeft.y - 2.0 }
    ];
    shapes.push({
      type: 'rope',
      points: leftTail,
      color: ROPE_COLOR,
      radius: ROPE_RADIUS,
      z: 0.02
    });

    var upperLoop = buildUpperLoop(0.3);
    shapes.push({
      type: 'rope',
      points: upperLoop,
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: 0
    });

    var rightEar = buildEar('right', 0.3);
    shapes.push({
      type: 'rope',
      points: rightEar,
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: -0.02
    });

    var earEnd = rightEar[rightEar.length - 1];
    var rightDown = [
      earEnd,
      { x: earEnd.x - 0.1, y: earEnd.y - 0.3 },
      { x: 0.1, y: earEnd.y - 0.8 }
    ];
    shapes.push({
      type: 'rope',
      points: rightDown,
      color: ROPE_DARK,
      radius: ROPE_RADIUS,
      z: -0.01
    });

    return shapes;
  }

  function buildLeftLoop() {
    var shapes = buildRightLoop();

    var leftEar = buildEar('left', 0.3);
    shapes.push({
      type: 'rope',
      points: leftEar,
      color: HIGHLIGHT_COLOR,
      radius: ROPE_RADIUS,
      z: 0.05
    });

    var earEnd = leftEar[leftEar.length - 1];
    var leftDown = [
      earEnd,
      { x: earEnd.x + 0.1, y: earEnd.y - 0.3 },
      { x: -0.1, y: earEnd.y - 0.7 }
    ];
    shapes.push({
      type: 'rope',
      points: leftDown,
      color: HIGHLIGHT_COLOR,
      radius: ROPE_RADIUS,
      z: 0.04
    });

    return shapes;
  }

  function buildWeave() {
    return buildFullKnot(0.3);
  }

  function buildShape() {
    return buildFullKnot(0.6);
  }

  function buildTighten() {
    return buildFullKnot(0.7);
  }

  function buildFinal() {
    return buildFullKnot(1);
  }

  function tightenBuilder(t) {
    return buildFullKnot(t);
  }

  Knots2D.register('fu-jie', {
    builders: [
      buildPreview,
      buildMaterials,
      buildFold,
      buildRightLoop,
      buildLeftLoop,
      buildWeave,
      buildShape,
      buildTighten,
      buildFinal
    ],
    tightenStep: 7,
    tightenBuilder: tightenBuilder,
    interactions: { threadStep: 4, tightenStep: 7 }
  });

})();
