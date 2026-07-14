/**
 * fu-jie.js - 如意福结 3D 实现（精品典藏版）
 *
 * 核心特性：
 * 1. 单根红绳对折编织，真实如意福结结构
 * 2. 上下双大环 + 左右双耳翼，菱形对称
 * 3. 中心结体交织，Z轴挑压关系清晰（≥0.18）
 * 4. 9个步骤Builder，每步真实编织递进
 * 5. startGrowAnim 生长动画，tightenBuilder 收紧交互
 * 6. 复用 earLoopPts / overUnderPts / smoothConnect 等工具
 * 7. 主色 #C41E3A，左右严格对称
 *
 * 步骤：0预览 1材料 2对折起线 3右线弯环 4左线穿环 5形成初结 6调形整理 7收紧 8收尾定型
 */
(function () {
  'use strict';

  var T = Knots3D.tools;
  var makeRope = T.makeRope;
  var makeBead = T.makeBead;
  var makeTassel = T.makeTassel;
  var THREE = T.THREE;
  var earLoopPts = T.earLoopPts;
  var overUnderPts = T.overUnderPts;
  var arcPts = T.arcPts;
  var symmetricPts = T.symmetricPts;
  var ropeGroup = function () { return Scene3D._.ropeGroup; };

  var ROPE_COLOR = '#C41E3A';
  var ROPE_DARK = '#8B0000';
  var ROPE_RADIUS = 0.085;
  var KNOT_W = 1.4;
  var KNOT_H = 1.9;
  var Z_DEPTH = 0.2;
  var EAR_W = 0.42;
  var EAR_H = 0.55;

  var CAM = {
    preview:  { pos: { x: 0.1, y: 0.2, z: 6.8 },  target: { x: 0, y: -0.1, z: 0 } },
    material: { pos: { x: 0, y: 0.3, z: 5.5 },    target: { x: 0, y: 0.1, z: 0 } },
    fold:     { pos: { x: 0, y: 0.4, z: 6.0 },    target: { x: 0, y: 0.1, z: 0 } },
    rightLoop:{ pos: { x: 0.5, y: 0.3, z: 5.8 },  target: { x: 0.2, y: 0.0, z: 0 } },
    leftLoop: { pos: { x: -0.5, y: 0.2, z: 5.8 }, target: { x: -0.2, y: -0.1, z: 0 } },
    weave:    { pos: { x: 0.3, y: 0.1, z: 5.5 },  target: { x: 0, y: -0.2, z: 0 } },
    shape:    { pos: { x: 0.1, y: 0.15, z: 6.2 }, target: { x: 0, y: -0.15, z: 0 } },
    tighten:  { pos: { x: 0, y: 0.1, z: 7.0 },    target: { x: 0, y: -0.2, z: 0 } },
    final:    { pos: { x: 0.6, y: 0.3, z: 6.5 },  target: { x: 0, y: -0.1, z: 0 } }
  };

  /* ============================================================
   *  完整福结路径生成
   * ============================================================ */

  function buildMainPath(isLeft, scale, looseness) {
    scale = scale || 1;
    looseness = looseness !== undefined ? looseness : 0;
    var w = KNOT_W * scale;
    var h = KNOT_H * scale;
    var ew = EAR_W * scale;
    var eh = EAR_H * scale;
    var loose = looseness * 0.18;

    var topY = h * 0.5;
    var midY = 0;
    var botY = -h * 0.6;

    var zA = Z_DEPTH * 0.5;
    var zB = -Z_DEPTH * 0.5;

    var sideSign = isLeft ? -1 : 1;
    var zSign = isLeft ? 1 : -1;

    var path = [];

    function push(x, y, z) {
      path.push({ x: x * sideSign, y: y, z: z * zSign });
    }

    function pushLine(x1, y1, z1, x2, y2, z2, segs) {
      segs = segs || 12;
      for (var i = 0; i <= segs; i++) {
        var t = i / segs;
        push(
          x1 + (x2 - x1) * t,
          y1 + (y2 - y1) * t,
          z1 + (z2 - z1) * t + Math.sin(t * Math.PI) * 0.006
        );
      }
    }

    function pushArc(cx, cy, cz, r, startAng, endAng, segs) {
      segs = segs || 12;
      for (var i = 0; i <= segs; i++) {
        var t = i / segs;
        var a = startAng + (endAng - startAng) * t;
        push(
          cx + Math.cos(a) * r,
          cy + Math.sin(a) * r,
          cz + Math.sin(t * Math.PI) * 0.005
        );
      }
    }

    // 起点：顶部挂环侧点
    var loopR = w * 0.09;
    var loopCy = topY + h * 0.18;

    push(loopR * 0.3, loopCy + loopR * 0.3, 0);

    // 1. 从上挂环侧点向下到上弧起点
    pushLine(
      loopR * 0.4, loopCy, 0,
      w * 0.22, topY + h * 0.02, zA,
      10
    );

    // 2. 上大环（半圆弧，从一侧到另一侧）
    var topArcR = w * 0.4 + loose * w * 0.12;
    var topArcCy = topY + h * 0.1;
    if (isLeft) {
      pushArc(0, topArcCy, zA, topArcR, Math.PI, 0.15, 18);
    } else {
      pushArc(0, topArcCy, zA, topArcR, 0.15, Math.PI, 18);
    }

    // 3. 从上弧末端向下到耳翼上方
    pushLine(
      w * 0.22, topY - h * 0.02, zA,
      w * 0.28, midY - h * 0.05, zA * 0.7,
      10
    );

    // 4. 耳翼
    var earCx = w * 0.42 + loose * w * 0.06;
    var earCy = midY - h * 0.02;
    var earPts = earLoopPts(
      earCx * sideSign, earCy, zA * zSign,
      ew + loose * ew * 0.2, eh + loose * eh * 0.15,
      isLeft ? 'left' : 'right',
      zA * zSign
    );
    if (isLeft) {
      for (var ei = earPts.length - 1; ei >= 0; ei--) {
        path.push(earPts[ei]);
      }
    } else {
      for (var ei2 = 0; ei2 < earPts.length; ei2++) {
        path.push(earPts[ei2]);
      }
    }

    // 5. 从耳翼下方出来，向内走，进入中心交织
    pushLine(
      w * 0.28, midY - h * 0.12, zA * 0.7,
      w * 0.1, midY - h * 0.2, zB,
      10
    );

    // 6. 中心下部交织：从一侧到另一侧，先压后挑
    pushLine(
      w * 0.1, midY - h * 0.2, zB,
      w * 0.03, midY - h * 0.22, zB,
      4
    );
    pushLine(
      w * 0.03, midY - h * 0.22, zB,
      -w * 0.03, midY - h * 0.18, zA,
      5
    );
    pushLine(
      -w * 0.03, midY - h * 0.18, zA,
      -w * 0.12, midY - h * 0.1, zA,
      6
    );

    // 7. 向上走，绕到另一侧上部
    pushLine(
      -w * 0.12, midY - h * 0.1, zA,
      -w * 0.2, midY + h * 0.02, zB,
      10
    );

    // 8. 中心上部交织：从另一侧回来，先挑后压
    pushLine(
      -w * 0.2, midY + h * 0.02, zB,
      -w * 0.05, midY + h * 0.12, zB,
      6
    );
    pushLine(
      -w * 0.05, midY + h * 0.12, zB,
      w * 0.05, midY + h * 0.15, zA,
      5
    );
    pushLine(
      w * 0.05, midY + h * 0.15, zA,
      w * 0.15, midY + h * 0.08, zA,
      5
    );

    // 9. 向下走到下弧起点
    pushLine(
      w * 0.15, midY + h * 0.08, zA,
      w * 0.2, botY + h * 0.08, zB,
      10
    );

    // 10. 下大环（半圆弧）
    var botArcR = w * 0.35 + loose * w * 0.1;
    var botArcCy = botY - h * 0.05;
    if (isLeft) {
      pushArc(0, botArcCy, zB, botArcR, -Math.PI * 0.8, -Math.PI * 0.1, 16);
    } else {
      pushArc(0, botArcCy, zB, botArcR, -Math.PI * 0.1, -Math.PI * 0.8, 16);
    }

    // 11. 尾绳向下
    pushLine(
      w * 0.18, botY + h * 0.02, zB,
      w * 0.1, botY - h * 0.15, 0,
      8
    );

    return path;
  }

  function buildLeftPath(scale, looseness) {
    return buildMainPath(true, scale, looseness);
  }

  function buildRightPath(scale, looseness) {
    return buildMainPath(false, scale, looseness);
  }

  function buildTopLoopPath(scale) {
    scale = scale || 1;
    var w = KNOT_W * scale;
    var h = KNOT_H * scale;
    var topY = h * 0.5;
    var loopR = w * 0.09;
    var loopCy = topY + h * 0.18;

    var pts = [];
    var segs = 22;
    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var ang = Math.PI * 0.15 + t * Math.PI * 0.7;
      pts.push({
        x: Math.cos(ang) * loopR,
        y: loopCy + Math.sin(ang) * loopR * 0.55,
        z: Math.sin(t * Math.PI) * 0.018
      });
    }
    return pts;
  }

  function buildFullKnotShape(t) {
    t = Math.max(0, Math.min(1, t || 1));
    var scale = 0.8 + 0.2 * t;
    var looseness = 1 - t;
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var w = KNOT_W * scale;
    var h = KNOT_H * scale;
    var topY = h * 0.5;
    var botY = -h * 0.6;

    var topLoopPts = buildTopLoopPath(scale);
    add(makeRope(topLoopPts, ROPE_COLOR, ROPE_RADIUS * 0.92, {
      textureRepeat: 5,
      tubularSegments: 75,
      tension: 0.3
    }));

    var leftPath = buildLeftPath(scale, looseness);
    var leftWeave = overUnderPts(leftPath, [1, -1, 1, -1, 1], Z_DEPTH * 0.25);
    add(makeRope(leftWeave, ROPE_COLOR, ROPE_RADIUS, {
      textureRepeat: 28,
      tubularSegments: 280,
      tension: 0.28
    }));

    var rightPath = buildRightPath(scale, looseness);
    var rightWeave = overUnderPts(rightPath, [-1, 1, -1, 1, -1], Z_DEPTH * 0.25);
    add(makeRope(rightWeave, ROPE_DARK, ROPE_RADIUS, {
      textureRepeat: 28,
      tubularSegments: 280,
      tension: 0.28
    }));

    var tailY = botY - h * 0.18;
    add(makeRope([
      { x: -w * 0.1, y: botY - h * 0.15, z: Z_DEPTH * 0.15 },
      { x: -w * 0.06, y: tailY, z: Z_DEPTH * 0.08 },
      { x: -w * 0.03, y: tailY - h * 0.12, z: 0 }
    ], ROPE_COLOR, ROPE_RADIUS * 0.85, { textureRepeat: 5, tubularSegments: 55 }));

    add(makeRope([
      { x: w * 0.1, y: botY - h * 0.15, z: -Z_DEPTH * 0.15 },
      { x: w * 0.06, y: tailY - h * 0.02, z: -Z_DEPTH * 0.08 },
      { x: w * 0.03, y: tailY - h * 0.14, z: 0 }
    ], ROPE_DARK, ROPE_RADIUS * 0.85, { textureRepeat: 5, tubularSegments: 55 }));

    add(makeBead(0, tailY - h * 0.22, 0, 0.14));

    var tassel = makeTassel(0, tailY - h * 0.35, 0, {
      color: ROPE_COLOR,
      height: 0.72,
      strandCount: 20,
      radius: 0.17
    });
    add(tassel);

    return meshes;
  }

  /* ============================================================
   *  步骤 0：预览
   * ============================================================ */

  function buildPreview() {
    return buildFullKnotShape(1.0);
  }

  /* ============================================================
   *  步骤 1：材料
   * ============================================================ */

  function buildMaterials() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var coil1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.1, 14, 36),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(ROPE_COLOR), roughness: 0.4, metalness: 0.05 })
    );
    coil1.position.set(-1.05, 0.48, 0);
    coil1.rotation.x = Math.PI / 2;
    coil1.castShadow = true;
    add(coil1);

    var coil2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.43, 0.095, 14, 34),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(ROPE_DARK), roughness: 0.45, metalness: 0.04 })
    );
    coil2.position.set(-1.05, 0.28, 0.05);
    coil2.rotation.x = Math.PI / 2;
    add(coil2);

    add(makeRope([
      { x: -0.55, y: 0.08, z: 0.07 },
      { x: 0, y: 0.12, z: 0.09 },
      { x: 0.58, y: 0.06, z: 0.07 }
    ], ROPE_COLOR, 0.072, { textureRepeat: 6 }));

    add(makeBead(1.05, 0.42, 0.1, 0.15));
    add(makeBead(1.05, 0.08, -0.05, 0.11));

    var sc1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 })
    );
    sc1.position.set(0.9, -0.26, 0.18);
    sc1.rotation.z = 0.28;
    add(sc1);
    var sc2 = sc1.clone();
    sc2.rotation.z = -0.28;
    add(sc2);

    var pin1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 })
    );
    pin1.position.set(0.78, 0.38, 0.12);
    add(pin1);
    var pin2 = pin1.clone();
    pin2.position.set(0.92, 0.26, 0.08);
    add(pin2);

    var board = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.2, 0.055),
      new THREE.MeshStandardMaterial({ color: 0xE8D5B0, roughness: 0.8 })
    );
    board.position.set(0, 0, -0.3);
    board.receiveShadow = true;
    add(board);

    var tasselDemo = makeTassel(1.2, -0.35, 0.1, {
      color: ROPE_COLOR, height: 0.5, strandCount: 16, radius: 0.15
    });
    add(tasselDemo);

    return meshes;
  }

  /* ============================================================
   *  步骤 2：对折起线
   * ============================================================ */

  function buildFold() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var h = KNOT_H * 0.88;
    var topY = h * 0.5;
    var foldY = h * 0.3;

    var loopR = h * 0.09;
    var loopCy = topY + h * 0.16;

    var topLoop = [];
    var segs = 20;
    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var ang = Math.PI * 0.12 + t * Math.PI * 0.76;
      topLoop.push({
        x: Math.cos(ang) * loopR,
        y: loopCy + Math.sin(ang) * loopR * 0.55,
        z: Math.sin(t * Math.PI) * 0.015
      });
    }
    add(makeRope(topLoop, ROPE_COLOR, ROPE_RADIUS * 0.93, {
      textureRepeat: 5, tubularSegments: 70, tension: 0.3
    }));

    add(makeRope([
      { x: -loopR * 0.35, y: loopCy + loopR * 0.25, z: 0.01 },
      { x: -h * 0.07, y: topY + h * 0.02, z: 0.02 },
      { x: -h * 0.09, y: foldY + h * 0.05, z: 0.03 },
      { x: -h * 0.11, y: foldY - h * 0.1, z: 0.035 },
      { x: -h * 0.13, y: foldY - h * 0.4, z: 0.03 },
      { x: -h * 0.15, y: -h * 0.55, z: 0.02 }
    ], ROPE_COLOR, ROPE_RADIUS, { textureRepeat: 10, tubularSegments: 120, tension: 0.3 }));

    add(makeRope([
      { x: loopR * 0.35, y: loopCy + loopR * 0.25, z: -0.01 },
      { x: h * 0.07, y: topY + h * 0.02, z: -0.02 },
      { x: h * 0.09, y: foldY + h * 0.05, z: -0.03 },
      { x: h * 0.11, y: foldY - h * 0.1, z: -0.035 },
      { x: h * 0.13, y: foldY - h * 0.4, z: -0.03 },
      { x: h * 0.15, y: -h * 0.58, z: -0.02 }
    ], ROPE_DARK, ROPE_RADIUS, { textureRepeat: 10, tubularSegments: 120, tension: 0.3 }));

    var pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 })
    );
    pin.position.set(0, loopCy + loopR * 0.3, 0.18);
    add(pin);

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xff8800, emissiveIntensity: 0.5 })
    );
    arrow.position.set(-h * 0.24, foldY + h * 0.08, 0.15);
    arrow.rotation.z = Math.PI * 0.35;
    add(arrow);

    return meshes;
  }

  /* ============================================================
   *  步骤 3：右线弯环
   * ============================================================ */

  function buildRightLoop() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var scale = 0.82;
    var w = KNOT_W * scale;
    var h = KNOT_H * scale;
    var ew = EAR_W * scale * 0.85;
    var eh = EAR_H * scale * 0.85;
    var topY = h * 0.5;
    var midY = 0;
    var zA = Z_DEPTH * 0.5;

    var loopR = w * 0.085;
    var loopCy = topY + h * 0.16;

    var topLoop = [];
    var segs1 = 18;
    for (var i = 0; i <= segs1; i++) {
      var t1 = i / segs1;
      var ang1 = Math.PI * 0.12 + t1 * Math.PI * 0.76;
      topLoop.push({
        x: Math.cos(ang1) * loopR,
        y: loopCy + Math.sin(ang1) * loopR * 0.55,
        z: Math.sin(t1 * Math.PI) * 0.012
      });
    }
    add(makeRope(topLoop, ROPE_COLOR, ROPE_RADIUS * 0.92, {
      textureRepeat: 5, tubularSegments: 65, tension: 0.3
    }));

    add(makeRope([
      { x: -loopR * 0.35, y: loopCy + loopR * 0.25, z: 0.01 },
      { x: -h * 0.07, y: topY + h * 0.02, z: 0.02 },
      { x: -h * 0.09, y: midY - h * 0.05, z: 0.03 },
      { x: -h * 0.11, y: -h * 0.35, z: 0.025 },
      { x: -h * 0.13, y: -h * 0.55, z: 0.02 }
    ], ROPE_COLOR, ROPE_RADIUS, { textureRepeat: 9, tubularSegments: 110, tension: 0.3 }));

    var rightPath = [];
    function rp(x, y, z) { rightPath.push({ x: x, y: y, z: z }); }
    function rpLine(x1, y1, z1, x2, y2, z2, segs) {
      segs = segs || 10;
      for (var j = 0; j <= segs; j++) {
        var tt = j / segs;
        rp(
          x1 + (x2 - x1) * tt,
          y1 + (y2 - y1) * tt,
          z1 + (z2 - z1) * tt + Math.sin(tt * Math.PI) * 0.006
        );
      }
    }

    rp(loopR * 0.35, loopCy + loopR * 0.25, -0.01);
    rpLine(h * 0.07, topY + h * 0.02, -0.02, w * 0.2, topY - h * 0.01, zA, 10);

    var topArcR = w * 0.38;
    var topArcCy = topY + h * 0.08;
    for (var ai = 0; ai <= 14; ai++) {
      var at = ai / 14;
      var aa = 0.15 + at * (Math.PI - 0.3);
      rp(
        Math.cos(aa) * topArcR,
        topArcCy + Math.sin(aa) * topArcR * 0.5,
        zA + Math.sin(at * Math.PI) * 0.008
      );
    }

    rpLine(-w * 0.2, topY - h * 0.01, zA, -w * 0.26, midY - h * 0.04, zA * 0.7, 8);

    var rightEar = earLoopPts(-w * 0.4, midY - h * 0.02, zA, ew, eh, 'left', zA);
    for (var re = rightEar.length - 1; re >= 0; re--) {
      rightPath.push(rightEar[re]);
    }

    rpLine(-w * 0.26, midY - h * 0.12, zA * 0.7, -w * 0.12, midY - h * 0.2, zA * 0.4, 8);
    rpLine(-w * 0.12, midY - h * 0.2, zA * 0.4, -w * 0.08, -h * 0.5, zA * 0.2, 10);

    add(makeRope(rightPath, ROPE_DARK, ROPE_RADIUS, {
      textureRepeat: 18, tubularSegments: 220, tension: 0.28
    }));

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0x00eeff, emissive: 0x00aaff, emissiveIntensity: 0.5 })
    );
    arrow.position.set(-w * 0.48, midY - h * 0.02, zA + 0.18);
    arrow.rotation.x = Math.PI / 2;
    arrow.rotation.z = 0.3;
    add(arrow);

    var pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.38, 8),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 })
    );
    pin.position.set(0, loopCy + loopR * 0.25, 0.18);
    add(pin);

    return meshes;
  }

  /* ============================================================
   *  步骤 4：左线穿环
   * ============================================================ */

  function buildLeftLoop() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var scale = 0.8;
    var w = KNOT_W * scale;
    var h = KNOT_H * scale;
    var ew = EAR_W * scale * 0.8;
    var eh = EAR_H * scale * 0.8;
    var topY = h * 0.5;
    var midY = 0;
    var zA = Z_DEPTH * 0.5;
    var zB = -Z_DEPTH * 0.5;

    var loopR = w * 0.08;
    var loopCy = topY + h * 0.15;

    var topLoop = [];
    var segs1 = 16;
    for (var i = 0; i <= segs1; i++) {
      var t1 = i / segs1;
      var ang1 = Math.PI * 0.12 + t1 * Math.PI * 0.76;
      topLoop.push({
        x: Math.cos(ang1) * loopR,
        y: loopCy + Math.sin(ang1) * loopR * 0.55,
        z: Math.sin(t1 * Math.PI) * 0.01
      });
    }
    add(makeRope(topLoop, ROPE_COLOR, ROPE_RADIUS * 0.92, {
      textureRepeat: 5, tubularSegments: 60, tension: 0.3
    }));

    var rightPath = [];
    function rp(x, y, z) { rightPath.push({ x: x, y: y, z: z }); }
    function rpLine(x1, y1, z1, x2, y2, z2, segs) {
      segs = segs || 10;
      for (var j = 0; j <= segs; j++) {
        var tt = j / segs;
        rp(
          x1 + (x2 - x1) * tt,
          y1 + (y2 - y1) * tt,
          z1 + (z2 - z1) * tt + Math.sin(tt * Math.PI) * 0.006
        );
      }
    }

    rp(loopR * 0.35, loopCy + loopR * 0.25, -0.01);
    rpLine(h * 0.065, topY + h * 0.02, -0.02, w * 0.18, topY - h * 0.01, zA, 8);

    var topArcR = w * 0.36;
    var topArcCy = topY + h * 0.07;
    for (var ai = 0; ai <= 12; ai++) {
      var at = ai / 12;
      var aa = 0.15 + at * (Math.PI - 0.3);
      rp(
        Math.cos(aa) * topArcR,
        topArcCy + Math.sin(aa) * topArcR * 0.48,
        zA + Math.sin(at * Math.PI) * 0.006
      );
    }

    rpLine(-w * 0.18, topY - h * 0.01, zA, -w * 0.24, midY - h * 0.04, zA * 0.6, 8);

    var rightEar = earLoopPts(-w * 0.38, midY - h * 0.02, zA, ew, eh, 'left', zA);
    for (var re = rightEar.length - 1; re >= 0; re--) {
      rightPath.push(rightEar[re]);
    }

    rpLine(-w * 0.24, midY - h * 0.12, zA * 0.6, -w * 0.1, midY - h * 0.22, zB, 10);

    add(makeRope(rightPath, ROPE_DARK, ROPE_RADIUS, {
      textureRepeat: 16, tubularSegments: 200, tension: 0.28
    }));

    add(makeRope([
      { x: -loopR * 0.3, y: loopCy + loopR * 0.2, z: 0.01 },
      { x: -h * 0.06, y: topY + h * 0.01, z: 0.015 },
      { x: -h * 0.08, y: midY - h * 0.03, z: 0.02 },
      { x: -h * 0.1, y: -h * 0.3, z: 0.018 },
      { x: -h * 0.12, y: -h * 0.52, z: 0.015 }
    ], ROPE_COLOR, ROPE_RADIUS, { textureRepeat: 8, tubularSegments: 100, tension: 0.3 }));

    var leftPath = [];
    function lp(x, y, z) { leftPath.push({ x: x, y: y, z: z }); }
    function lpLine(x1, y1, z1, x2, y2, z2, segs) {
      segs = segs || 10;
      for (var k = 0; k <= segs; k++) {
        var tt2 = k / segs;
        lp(
          x1 + (x2 - x1) * tt2,
          y1 + (y2 - y1) * tt2,
          z1 + (z2 - z1) * tt2 + Math.sin(tt2 * Math.PI) * 0.006
        );
      }
    }

    lp(-loopR * 0.3, loopCy + loopR * 0.2, 0.01);
    lpLine(-h * 0.06, topY + h * 0.01, 0.015, -w * 0.16, topY - h * 0.02, zB, 8);

    var leftArcR = w * 0.34;
    var leftArcCy = topY + h * 0.06;
    for (var ai2 = 0; ai2 <= 12; ai2++) {
      var at2 = ai2 / 12;
      var aa2 = Math.PI - 0.15 - at2 * (Math.PI - 0.3);
      lp(
        -Math.cos(aa2) * leftArcR,
        leftArcCy + Math.sin(aa2) * leftArcR * 0.48,
        zB + Math.sin(at2 * Math.PI) * 0.006
      );
    }

    lpLine(w * 0.16, topY - h * 0.02, zB, w * 0.22, midY - h * 0.05, zB * 0.6, 8);

    var leftEar = earLoopPts(w * 0.36, midY - h * 0.03, zB, ew * 0.95, eh * 0.95, 'right', zB);
    for (var le = 0; le < leftEar.length; le++) {
      leftPath.push(leftEar[le]);
    }

    lpLine(w * 0.22, midY - h * 0.13, zB * 0.6, w * 0.1, midY - h * 0.22, zA, 10);

    lpLine(w * 0.1, midY - h * 0.22, zA, -w * 0.05, midY - h * 0.15, zA * 0.7, 8);

    add(makeRope(leftPath, '#FF6347', ROPE_RADIUS * 1.02, {
      textureRepeat: 17, tubularSegments: 210, tension: 0.28
    }));

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.065, 0.15, 8),
      new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00cc66, emissiveIntensity: 0.5 })
    );
    arrow.position.set(-w * 0.08, midY - h * 0.18, zA + 0.2);
    arrow.rotation.z = Math.PI * 0.3;
    add(arrow);

    return meshes;
  }

  /* ============================================================
   *  步骤 5：形成初结
   * ============================================================ */

  function buildWeave() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var scale = 0.78;
    var looseness = 0.65;
    var w = KNOT_W * scale;
    var h = KNOT_H * scale;

    var topLoopPts = buildTopLoopPath(scale);
    add(makeRope(topLoopPts, ROPE_COLOR, ROPE_RADIUS * 0.92, {
      textureRepeat: 5, tubularSegments: 65, tension: 0.3
    }));

    var leftPath = buildLeftPath(scale, looseness);
    add(makeRope(leftPath, ROPE_COLOR, ROPE_RADIUS * 0.97, {
      textureRepeat: 26,
      tubularSegments: 260,
      tension: 0.28
    }));

    var rightPath = buildRightPath(scale, looseness);
    add(makeRope(rightPath, ROPE_DARK, ROPE_RADIUS * 0.97, {
      textureRepeat: 26,
      tubularSegments: 260,
      tension: 0.28
    }));

    var tailY = -h * 0.6 - h * 0.12;
    add(makeRope([
      { x: -w * 0.1, y: -h * 0.6 - h * 0.1, z: Z_DEPTH * 0.12 },
      { x: -w * 0.06, y: tailY, z: Z_DEPTH * 0.06 }
    ], ROPE_COLOR, ROPE_RADIUS * 0.82, { textureRepeat: 4, tubularSegments: 45 }));

    add(makeRope([
      { x: w * 0.1, y: -h * 0.6 - h * 0.1, z: -Z_DEPTH * 0.12 },
      { x: w * 0.06, y: tailY - h * 0.02, z: -Z_DEPTH * 0.06 }
    ], ROPE_DARK, ROPE_RADIUS * 0.82, { textureRepeat: 4, tubularSegments: 45 }));

    return meshes;
  }

  /* ============================================================
   *  步骤 6：调形整理
   * ============================================================ */

  function buildShape() {
    return buildFullKnotShape(0.75);
  }

  /* ============================================================
   *  步骤 7：收紧
   * ============================================================ */

  function buildTighten() {
    return buildFullKnotShape(0.92);
  }

  /* ============================================================
   *  步骤 8：收尾定型
   * ============================================================ */

  function buildFinal() {
    var meshes = buildFullKnotShape(1.0);
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var h = KNOT_H;
    var w = KNOT_W;

    var charm1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.028, 8, 16),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#FFD700'), roughness: 0.25, metalness: 0.7, emissive: new THREE.Color('#FFA500'), emissiveIntensity: 0.3 })
    );
    charm1.position.set(w * 0.5, h * 0.1, Z_DEPTH * 0.6);
    add(charm1);

    var charm2 = charm1.clone();
    charm2.position.set(-w * 0.5, h * 0.08, -Z_DEPTH * 0.6);
    add(charm2);

    return meshes;
  }

  /* ============================================================
   *  动画函数
   * ============================================================ */

  function animFold(onDone) {
    var h = KNOT_H * 0.88;
    var topY = h * 0.5;
    var foldY = h * 0.3;
    var loopR = h * 0.09;
    var loopCy = topY + h * 0.16;

    var fullPts = [
      { x: -h * 0.15, y: -h * 0.55, z: 0.02 },
      { x: -h * 0.13, y: foldY - h * 0.4, z: 0.03 },
      { x: -h * 0.11, y: foldY - h * 0.1, z: 0.035 },
      { x: -h * 0.09, y: foldY + h * 0.05, z: 0.03 },
      { x: -h * 0.07, y: topY + h * 0.02, z: 0.02 },
      { x: -loopR * 0.35, y: loopCy + loopR * 0.25, z: 0.01 }
    ];

    var topLoopPts = buildTopLoopPath(0.88);
    for (var i = topLoopPts.length - 1; i >= 0; i--) {
      fullPts.push(topLoopPts[i]);
    }

    fullPts.push({ x: loopR * 0.35, y: loopCy + loopR * 0.25, z: -0.01 });
    fullPts.push({ x: h * 0.07, y: topY + h * 0.02, z: -0.02 });
    fullPts.push({ x: h * 0.09, y: foldY + h * 0.05, z: -0.03 });
    fullPts.push({ x: h * 0.11, y: foldY - h * 0.1, z: -0.035 });
    fullPts.push({ x: h * 0.13, y: foldY - h * 0.4, z: -0.03 });
    fullPts.push({ x: h * 0.15, y: -h * 0.58, z: -0.02 });

    Knots3D.anim.startGrowAnim(2, fullPts, ROPE_COLOR, ROPE_RADIUS, 1500, function () {
      var meshes = buildFold();
      Knots3D.anim.recordStepMeshes(2, meshes);
      if (onDone) onDone();
    });
  }

  function animRightLoop(onDone) {
    Knots3D.anim.startStepAnim(3, [], [], 1000, function () {
      var meshes = buildRightLoop();
      Knots3D.anim.recordStepMeshes(3, meshes);
      if (onDone) onDone();
    });
  }

  function animLeftLoop(onDone) {
    Knots3D.anim.startStepAnim(4, [], [], 1100, function () {
      var meshes = buildLeftLoop();
      Knots3D.anim.recordStepMeshes(4, meshes);
      if (onDone) onDone();
    });
  }

  function animWeave(onDone) {
    Knots3D.anim.startStepAnim(5, [], [], 1000, function () {
      var meshes = buildWeave();
      Knots3D.anim.recordStepMeshes(5, meshes);
      if (onDone) onDone();
    });
  }

  function animShape(onDone) {
    Knots3D.anim.startStepAnim(6, [], [], 900, function () {
      var meshes = buildShape();
      Knots3D.anim.recordStepMeshes(6, meshes);
      if (onDone) onDone();
    });
  }

  /* ============================================================
   *  收紧 Builder
   * ============================================================ */

  function buildFuJieShape(t) {
    return buildFullKnotShape(t);
  }

  /* ============================================================
   *  注册
   * ============================================================ */

  Knots3D.register('fu-jie', {
    builders: [
      buildPreview, buildMaterials, buildFold, buildRightLoop, buildLeftLoop,
      buildWeave, buildShape, buildTighten, buildFinal
    ],
    cameras: [
      CAM.preview, CAM.material, CAM.fold, CAM.rightLoop, CAM.leftLoop,
      CAM.weave, CAM.shape, CAM.tighten, CAM.final
    ],
    anims: { 2: animFold, 3: animRightLoop, 4: animLeftLoop, 5: animWeave, 6: animShape },
    tightenStep: 7,
    tightenBuilder: buildFuJieShape,
    interactions: { threadStep: 4, tightenStep: 7 }
  });

})();
