/**
 * pan-chang.js - 盘长结 3D 实现（完全重写精品版）
 *
 * 核心特性：
 * 1. 真实盘长结结构：2×2 方形回字格，四耳对称
 * 2. 单根红绳连续编织，体现"无始无终"
 * 3. 内部横格竖格交错，Z轴挑压关系清晰（≥0.18）
 * 4. 9个步骤Builder展示真实编织递进
 * 5. startGrowAnim 生长动画，tightenBuilder 收紧交互
 * 6. 复用 overUnderPts / smoothConnect / arcPts / circlePts 等工具
 * 7. 主色红色 #C41E3A，顶部挂环，底部流苏
 *
 * 步骤：0预览 1材料 2固定轴线 3右线绕框 4左线穿绕 5形成初结 6内圈穿绕 7调形 8收紧 9收尾定型
 * 实际：9个builders (索引0-8)，对应步骤0到步骤8
 */
(function () {
  'use strict';

  var T = Knots3D.tools;
  var makeRope = T.makeRope;
  var makeBead = T.makeBead;
  var makeTassel = T.makeTassel;
  var THREE = T.THREE;
  var overUnderPts = T.overUnderPts;
  var arcPts = T.arcPts;
  var circlePts = T.circlePts;
  var earLoopPts = T.earLoopPts;
  var symmetricPts = T.symmetricPts;
  var ropeGroup = function () { return Scene3D._.ropeGroup; };

  var ROPE_COLOR = '#C41E3A';
  var ROPE_DARK = '#9C162D';
  var GOLD_COLOR = '#DAA520';
  var ROPE_RADIUS = 0.085;
  var KNOT_SIZE = 1.1;
  var Z_DEPTH = 0.22;
  var EAR_SIZE = 0.38;

  var CAM = {
    preview:  { pos: { x: 0.2, y: 0.1, z: 6.8 },  target: { x: 0, y: -0.1, z: 0 } },
    material: { pos: { x: 0, y: 0.3, z: 5.5 },    target: { x: 0, y: 0.1, z: 0 } },
    axis:     { pos: { x: 0, y: 0.2, z: 6.0 },    target: { x: 0, y: 0.0, z: 0 } },
    rightWrap:{ pos: { x: 0.6, y: 0.2, z: 5.8 },  target: { x: 0.2, y: 0.0, z: 0 } },
    leftWrap: { pos: { x: -0.6, y: 0.1, z: 5.8 }, target: { x: -0.2, y: -0.1, z: 0 } },
    firstKnot:{ pos: { x: 0.4, y: 0.0, z: 6.0 },  target: { x: 0, y: -0.15, z: 0 } },
    inner:    { pos: { x: 0.3, y: -0.1, z: 5.8 }, target: { x: 0, y: -0.2, z: 0 } },
    shape:    { pos: { x: 0.1, y: 0.0, z: 6.5 },  target: { x: 0, y: -0.15, z: 0 } },
    final:    { pos: { x: 0.5, y: 0.2, z: 6.5 },  target: { x: 0, y: -0.1, z: 0 } }
  };

  /* ============================================================
   *  盘长结路径核心生成
   * ============================================================ */

  function buildPanChangPath(scale, looseness) {
    scale = scale || 1;
    looseness = looseness !== undefined ? looseness : 0;
    var s = KNOT_SIZE * scale;
    var loose = looseness * 0.22;
    var zA = Z_DEPTH * 0.6;
    var zB = -Z_DEPTH * 0.6;

    var path = [];

    function push(x, y, z) {
      path.push({ x: x, y: y, z: z });
    }

    function pushLine(x1, y1, z1, x2, y2, z2, segs) {
      segs = segs || 16;
      for (var i = 0; i <= segs; i++) {
        var t = i / segs;
        push(
          x1 + (x2 - x1) * t,
          y1 + (y2 - y1) * t,
          z1 + (z2 - z1) * t + Math.sin(t * Math.PI) * 0.008
        );
      }
    }

    function pushArc(cx, cy, cz, r, startAng, endAng, segs) {
      segs = segs || 14;
      for (var i = 0; i <= segs; i++) {
        var t = i / segs;
        var a = startAng + (endAng - startAng) * t;
        push(
          cx + Math.cos(a) * r,
          cy + Math.sin(a) * r,
          cz + Math.sin(t * Math.PI) * 0.006
        );
      }
    }

    var cornerR = s * 0.13 + loose * s * 0.05;
    var halfS = s * 0.5 + loose * s * 0.08;
    var innerS = s * 0.22 + loose * s * 0.06;
    var earW = EAR_SIZE * scale + loose * s * 0.06;
    var earH = EAR_SIZE * scale * 1.15 + loose * s * 0.05;

    // ===== 起点：顶部挂环下方（右线起点）=====
    var topLoopR = s * 0.11;
    var topLoopCy = halfS + s * 0.32;

    push(topLoopR * 0.4, topLoopCy + topLoopR * 0.25, zA * 0.3);

    // ===== 1. 向右走，进入右耳翼 =====
    pushLine(
      topLoopR * 0.3, topLoopCy, zA * 0.2,
      halfS - cornerR, topLoopCy - s * 0.1, zA,
      12
    );

    // ===== 2. 右耳翼（外凸）=====
    var rightEar = earLoopPts(
      halfS + earW * 0.15, topLoopCy - s * 0.1 - s * 0.18,
      zA, earW, earH, 'right', zA
    );
    for (var re = 0; re < rightEar.length; re++) {
      path.push(rightEar[re]);
    }

    // ===== 3. 从右耳出来，向下走右侧边 =====
    pushLine(
      halfS - cornerR, topLoopCy - s * 0.1 - s * 0.36, zA,
      halfS - cornerR, -halfS + cornerR, zA,
      18
    );

    // ===== 4. 右下角圆弧 =====
    pushArc(halfS - cornerR, -halfS + cornerR, zA, cornerR, 0, Math.PI / 2, 12);

    // ===== 5. 下侧：从右向左，挑压开始（先在上层）=====
    pushLine(
      halfS - cornerR, -halfS, zA,
      innerS, -halfS, zA,
      10
    );

    // 第一次交叉：向下穿（z从正变负）
    pushLine(
      innerS, -halfS, zA,
      -innerS * 0.3, -halfS, zB,
      8
    );

    pushLine(
      -innerS * 0.3, -halfS, zB,
      -halfS + cornerR, -halfS, zB,
      10
    );

    // ===== 6. 左下角圆弧 =====
    pushArc(-halfS + cornerR, -halfS + cornerR, zB, cornerR, Math.PI / 2, Math.PI, 12);

    // ===== 7. 左耳翼（外凸）=====
    var leftEar = earLoopPts(
      -halfS - earW * 0.15, -halfS + s * 0.18,
      zB, earW, earH, 'left', zB
    );
    for (var le = leftEar.length - 1; le >= 0; le--) {
      path.push(leftEar[le]);
    }

    // ===== 8. 左侧向上走 =====
    pushLine(
      -halfS + cornerR, -halfS + s * 0.36, zB,
      -halfS + cornerR, innerS, zB,
      14
    );

    // 第二次交叉：从下往上穿（z从负变正）
    pushLine(
      -halfS + cornerR, innerS, zB,
      -halfS + cornerR, -innerS * 0.3, zA,
      8
    );

    pushLine(
      -halfS + cornerR, -innerS * 0.3, zA,
      -halfS + cornerR, halfS - cornerR, zA,
      14
    );

    // ===== 9. 左上角圆弧 =====
    pushArc(-halfS + cornerR, halfS - cornerR, zA, cornerR, Math.PI, Math.PI * 1.5, 12);

    // ===== 10. 上侧：从左向右，形成回字上沿 =====
    pushLine(
      -halfS + cornerR, halfS, zA,
      -innerS, halfS, zA,
      10
    );

    // 第三次交叉：从上往下穿（z从正变负）
    pushLine(
      -innerS, halfS, zA,
      innerS * 0.3, halfS, zB,
      8
    );

    pushLine(
      innerS * 0.3, halfS, zB,
      halfS - cornerR, halfS, zB,
      10
    );

    // ===== 11. 右上角圆弧 =====
    pushArc(halfS - cornerR, halfS - cornerR, zB, cornerR, -Math.PI / 2, 0, 12);

    // ===== 12. 右侧向下进入内圈 =====
    pushLine(
      halfS, halfS - cornerR, zB,
      halfS, innerS, zB,
      10
    );

    // 第四次交叉：从右往左穿内圈（z从负变正）
    pushLine(
      halfS, innerS, zB,
      innerS * 0.5, innerS * 0.8, zA,
      8
    );

    // ===== 13. 内圈：右侧竖线（在上层）=====
    pushLine(
      innerS * 0.5, innerS * 0.8, zA,
      innerS * 0.4, -innerS * 0.8, zA,
      10
    );

    // 第五次交叉：内圈横过（z从正变负）
    pushLine(
      innerS * 0.4, -innerS * 0.8, zA,
      -innerS * 0.4, -innerS * 0.6, zB,
      8
    );

    // ===== 14. 内圈：左侧竖线（在下层）=====
    pushLine(
      -innerS * 0.4, -innerS * 0.6, zB,
      -innerS * 0.3, innerS * 0.5, zB,
      10
    );

    // 第六次交叉：内圈向上穿出（z从负变正）
    pushLine(
      -innerS * 0.3, innerS * 0.5, zB,
      -topLoopR * 0.2, topLoopCy - s * 0.05, zA * 0.4,
      12
    );

    // ===== 回到顶部挂环 =====
    pushLine(
      -topLoopR * 0.2, topLoopCy - s * 0.05, zA * 0.4,
      -topLoopR * 0.4, topLoopCy + topLoopR * 0.2, zA * 0.3,
      8
    );

    return path;
  }

  function buildTopLoopPath(scale) {
    scale = scale || 1;
    var s = KNOT_SIZE * scale;
    var topLoopR = s * 0.11;
    var topLoopCy = s * 0.5 + s * 0.32;

    var pts = [];
    var segs = 24;
    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var ang = Math.PI * 0.12 + t * Math.PI * 0.76;
      pts.push({
        x: Math.cos(ang) * topLoopR,
        y: topLoopCy + Math.sin(ang) * topLoopR * 0.55,
        z: Math.sin(t * Math.PI) * 0.018
      });
    }
    return pts;
  }

  function buildFullKnotShape(t) {
    t = Math.max(0, Math.min(1, t || 1));
    var scale = 0.82 + 0.18 * t;
    var looseness = 1 - t;
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var s = KNOT_SIZE * scale;
    var topLoopPts = buildTopLoopPath(scale);
    add(makeRope(topLoopPts, ROPE_COLOR, ROPE_RADIUS * 0.92, {
      textureRepeat: 5,
      tubularSegments: 70,
      tension: 0.3
    }));

    var mainPath = buildPanChangPath(scale, looseness);

    var weavePattern = [1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1];
    var finalPath = overUnderPts(mainPath, weavePattern, Z_DEPTH * 0.28);

    add(makeRope(finalPath, ROPE_COLOR, ROPE_RADIUS, {
      textureRepeat: 28,
      tubularSegments: 280,
      tension: 0.28
    }));

    var tailY = -s * 0.5 - s * 0.38;
    add(makeRope([
      { x: s * 0.02, y: -s * 0.5 - s * 0.2, z: Z_DEPTH * 0.1 },
      { x: s * 0.01, y: tailY - s * 0.05, z: Z_DEPTH * 0.05 },
      { x: 0, y: tailY - s * 0.12, z: 0 }
    ], ROPE_DARK, ROPE_RADIUS * 0.85, {
      textureRepeat: 5,
      tubularSegments: 55
    }));

    add(makeBead(0, tailY - s * 0.2, 0, 0.13));

    var tassel = makeTassel(0, tailY - s * 0.32, 0, {
      color: ROPE_COLOR,
      height: 0.65,
      strandCount: 18,
      radius: 0.15
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
    coil1.position.set(-1.05, 0.45, 0);
    coil1.rotation.x = Math.PI / 2;
    coil1.castShadow = true;
    add(coil1);

    var coil2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.095, 14, 34),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(ROPE_DARK), roughness: 0.45, metalness: 0.04 })
    );
    coil2.position.set(-1.05, 0.26, 0.04);
    coil2.rotation.x = Math.PI / 2;
    add(coil2);

    add(makeRope([
      { x: -0.55, y: 0.06, z: 0.06 },
      { x: 0, y: 0.1, z: 0.08 },
      { x: 0.6, y: 0.04, z: 0.06 }
    ], ROPE_COLOR, 0.072, { textureRepeat: 6 }));

    add(makeBead(1.05, 0.4, 0.1, 0.14));
    add(makeBead(1.05, 0.08, -0.05, 0.11));

    var sc1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 })
    );
    sc1.position.set(0.9, -0.28, 0.18);
    sc1.rotation.z = 0.28;
    add(sc1);
    var sc2 = sc1.clone();
    sc2.rotation.z = -0.28;
    add(sc2);

    var pin1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.42, 8),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 })
    );
    pin1.position.set(0.78, 0.38, 0.12);
    add(pin1);
    var pin2 = pin1.clone();
    pin2.position.set(0.92, 0.24, 0.08);
    add(pin2);

    var board = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 1.3, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xE8D5B0, roughness: 0.82 })
    );
    board.position.set(0, -0.05, -0.32);
    board.receiveShadow = true;
    add(board);

    var tasselDemo = makeTassel(1.25, -0.35, 0.1, {
      color: ROPE_COLOR, height: 0.5, strandCount: 14, radius: 0.14
    });
    add(tasselDemo);

    return meshes;
  }

  /* ============================================================
   *  步骤 2：固定轴线
   * ============================================================ */

  function buildAxis() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var s = KNOT_SIZE * 0.85;
    var halfS = s * 0.5;

    var topLoopPts = buildTopLoopPath(0.85);
    add(makeRope(topLoopPts, ROPE_COLOR, ROPE_RADIUS * 0.92, {
      textureRepeat: 5, tubularSegments: 65, tension: 0.3
    }));

    var topLoopCy = s * 0.5 + s * 0.32;
    var topLoopR = s * 0.11;

    var vAxis = [];
    function vPush(x, y, z) { vAxis.push({ x: x, y: y, z: z }); }
    function vLine(x1, y1, z1, x2, y2, z2, segs) {
      segs = segs || 14;
      for (var i = 0; i <= segs; i++) {
        var t = i / segs;
        vPush(
          x1 + (x2 - x1) * t,
          y1 + (y2 - y1) * t,
          z1 + (z2 - z1) * t + Math.sin(t * Math.PI) * 0.008
        );
      }
    }

    vPush(topLoopR * 0.4, topLoopCy + topLoopR * 0.25, 0.02);
    vLine(topLoopR * 0.25, topLoopCy, 0.015,
          s * 0.04, halfS, 0.01, 10);
    vLine(s * 0.04, halfS, 0.01,
          s * 0.02, -halfS, 0.008, 18);
    vLine(s * 0.02, -halfS, 0.008,
          0, -halfS - s * 0.25, 0, 10);

    add(makeRope(vAxis, ROPE_COLOR, ROPE_RADIUS, {
      textureRepeat: 14, tubularSegments: 160, tension: 0.3
    }));

    var leftAxis = symmetricPts(vAxis, 'x');
    add(makeRope(leftAxis, ROPE_DARK, ROPE_RADIUS, {
      textureRepeat: 14, tubularSegments: 160, tension: 0.3
    }));

    var hAxis = [];
    function hPush(x, y, z) { hAxis.push({ x: x, y: y, z: z }); }
    function hLine(x1, y1, z1, x2, y2, z2, segs) {
      segs = segs || 14;
      for (var j = 0; j <= segs; j++) {
        var t2 = j / segs;
        hPush(
          x1 + (x2 - x1) * t2,
          y1 + (y2 - y1) * t2,
          z1 + (z2 - z1) * t2 + Math.sin(t2 * Math.PI) * 0.008
        );
      }
    }

    hPush(-halfS, s * 0.04, -0.01);
    hLine(-halfS, s * 0.02, -0.008,
          halfS, s * 0.02, -0.008, 18);

    var hRope = makeRope(hAxis, ROPE_DARK, ROPE_RADIUS * 0.98, {
      textureRepeat: 12, tubularSegments: 150, tension: 0.3
    });
    hRope.material.transparent = true;
    hRope.material.opacity = 0.5;
    hRope.material.depthWrite = false;
    add(hRope);

    var pinTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.42, 8),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 })
    );
    pinTop.position.set(0, topLoopCy + topLoopR * 0.25, 0.2);
    add(pinTop);

    var pinMid = pinTop.clone();
    pinMid.position.set(0, s * 0.02, 0.22);
    add(pinMid);

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xff8800, emissiveIntensity: 0.5 })
    );
    arrow.position.set(halfS * 0.6, s * 0.15, 0.18);
    arrow.rotation.z = -Math.PI * 0.35;
    add(arrow);

    add(makeBead(0, -halfS - s * 0.35, 0, 0.13));

    return meshes;
  }

  /* ============================================================
   *  步骤 3：右线绕框
   * ============================================================ */

  function buildRightWrap() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var s = KNOT_SIZE * 0.82;
    var halfS = s * 0.5;
    var cornerR = s * 0.14;
    var zA = Z_DEPTH * 0.55;

    var topLoopPts = buildTopLoopPath(0.82);
    add(makeRope(topLoopPts, ROPE_COLOR, ROPE_RADIUS * 0.92, {
      textureRepeat: 5, tubularSegments: 65, tension: 0.3
    }));

    var topLoopCy = s * 0.5 + s * 0.32;
    var topLoopR = s * 0.11;

    var leftLine = [];
    function lp(x, y, z) { leftLine.push({ x: x, y: y, z: z }); }
    function lpLine(x1, y1, z1, x2, y2, z2, segs) {
      segs = segs || 14;
      for (var i = 0; i <= segs; i++) {
        var t = i / segs;
        lp(
          x1 + (x2 - x1) * t,
          y1 + (y2 - y1) * t,
          z1 + (z2 - z1) * t + Math.sin(t * Math.PI) * 0.008
        );
      }
    }

    lp(-topLoopR * 0.4, topLoopCy + topLoopR * 0.25, 0.02);
    lpLine(-topLoopR * 0.25, topLoopCy, 0.015,
           -s * 0.04, halfS, 0.01, 10);
    lpLine(-s * 0.04, halfS, 0.01,
           -s * 0.02, -halfS - s * 0.15, 0, 16);

    add(makeRope(leftLine, ROPE_DARK, ROPE_RADIUS * 0.98, {
      textureRepeat: 12, tubularSegments: 140, tension: 0.3
    }));

    var rightPath = [];
    function rp(x, y, z) { rightPath.push({ x: x, y: y, z: z }); }
    function rpLine(x1, y1, z1, x2, y2, z2, segs) {
      segs = segs || 14;
      for (var j = 0; j <= segs; j++) {
        var t2 = j / segs;
        rp(
          x1 + (x2 - x1) * t2,
          y1 + (y2 - y1) * t2,
          z1 + (z2 - z1) * t2 + Math.sin(t2 * Math.PI) * 0.008
        );
      }
    }
    function rpArc(cx, cy, cz, r, startAng, endAng, segs) {
      segs = segs || 12;
      for (var k = 0; k <= segs; k++) {
        var t3 = k / segs;
        var a = startAng + (endAng - startAng) * t3;
        rp(
          cx + Math.cos(a) * r,
          cy + Math.sin(a) * r,
          cz + Math.sin(t3 * Math.PI) * 0.006
        );
      }
    }

    rp(topLoopR * 0.4, topLoopCy + topLoopR * 0.25, 0.02);
    rpLine(topLoopR * 0.25, topLoopCy, 0.015,
           s * 0.06, halfS + s * 0.02, zA * 0.3, 10);

    rpLine(s * 0.06, halfS + s * 0.02, zA * 0.3,
           halfS - cornerR, halfS, zA,
           12);

    rpArc(halfS - cornerR, halfS - cornerR, zA, cornerR, -Math.PI / 2, 0, 12);

    rpLine(halfS, halfS - cornerR, zA,
           halfS, -halfS + cornerR, zA,
           18);

    rpArc(halfS - cornerR, -halfS + cornerR, zA, cornerR, 0, Math.PI / 2, 12);

    rpLine(halfS - cornerR, -halfS, zA,
           -s * 0.05, -halfS, zA * 0.6,
           14);

    add(makeRope(rightPath, ROPE_COLOR, ROPE_RADIUS, {
      textureRepeat: 22, tubularSegments: 260, tension: 0.28
    }));

    var tailPts = [
      { x: -s * 0.05, y: -halfS, z: zA * 0.6 },
      { x: -s * 0.2, y: -halfS - s * 0.12, z: zA * 0.4 },
      { x: -s * 0.3, y: -halfS - s * 0.22, z: zA * 0.25 }
    ];
    add(makeRope(tailPts, ROPE_COLOR, ROPE_RADIUS * 0.95, {
      textureRepeat: 4, tubularSegments: 50
    }));

    var pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.42, 8),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 })
    );
    pin.position.set(0, topLoopCy + topLoopR * 0.25, 0.2);
    add(pin);

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0x00eeff, emissive: 0x00aaff, emissiveIntensity: 0.5 })
    );
    arrow.position.set(halfS + s * 0.05, 0, zA + 0.18);
    arrow.rotation.x = Math.PI / 2;
    arrow.rotation.z = -Math.PI * 0.45;
    add(arrow);

    add(makeBead(0, -halfS - s * 0.35, 0, 0.13));

    return meshes;
  }

  /* ============================================================
   *  步骤 4：左线穿绕
   * ============================================================ */

  function buildLeftWrap() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var s = KNOT_SIZE * 0.8;
    var halfS = s * 0.5;
    var cornerR = s * 0.14;
    var zA = Z_DEPTH * 0.55;
    var zB = -Z_DEPTH * 0.55;

    var topLoopPts = buildTopLoopPath(0.8);
    add(makeRope(topLoopPts, ROPE_COLOR, ROPE_RADIUS * 0.92, {
      textureRepeat: 5, tubularSegments: 65, tension: 0.3
    }));

    var topLoopCy = s * 0.5 + s * 0.32;
    var topLoopR = s * 0.11;

    var rightPath = [];
    function rp(x, y, z) { rightPath.push({ x: x, y: y, z: z }); }
    function rpLine(x1, y1, z1, x2, y2, z2, segs) {
      segs = segs || 14;
      for (var i = 0; i <= segs; i++) {
        var t = i / segs;
        rp(
          x1 + (x2 - x1) * t,
          y1 + (y2 - y1) * t,
          z1 + (z2 - z1) * t + Math.sin(t * Math.PI) * 0.008
        );
      }
    }
    function rpArc(cx, cy, cz, r, startAng, endAng, segs) {
      segs = segs || 12;
      for (var j = 0; j <= segs; j++) {
        var t2 = j / segs;
        var a = startAng + (endAng - startAng) * t2;
        rp(
          cx + Math.cos(a) * r,
          cy + Math.sin(a) * r,
          cz + Math.sin(t2 * Math.PI) * 0.006
        );
      }
    }

    rp(topLoopR * 0.4, topLoopCy + topLoopR * 0.25, 0.02);
    rpLine(topLoopR * 0.25, topLoopCy, 0.015,
           s * 0.06, halfS + s * 0.02, zA * 0.3, 10);
    rpLine(s * 0.06, halfS + s * 0.02, zA * 0.3,
           halfS - cornerR, halfS, zA, 12);
    rpArc(halfS - cornerR, halfS - cornerR, zA, cornerR, -Math.PI / 2, 0, 12);
    rpLine(halfS, halfS - cornerR, zA,
           halfS, -halfS + cornerR, zA, 18);
    rpArc(halfS - cornerR, -halfS + cornerR, zA, cornerR, 0, Math.PI / 2, 12);
    rpLine(halfS - cornerR, -halfS, zA,
           -s * 0.08, -halfS, zA * 0.5, 14);

    add(makeRope(rightPath, ROPE_COLOR, ROPE_RADIUS * 0.98, {
      textureRepeat: 22, tubularSegments: 260, tension: 0.28
    }));

    var leftPath = [];
    function lp(x, y, z) { leftPath.push({ x: x, y: y, z: z }); }
    function lpLine(x1, y1, z1, x2, y2, z2, segs) {
      segs = segs || 14;
      for (var k = 0; k <= segs; k++) {
        var t3 = k / segs;
        lp(
          x1 + (x2 - x1) * t3,
          y1 + (y2 - y1) * t3,
          z1 + (z2 - z1) * t3 + Math.sin(t3 * Math.PI) * 0.008
        );
      }
    }
    function lpArc(cx, cy, cz, r, startAng, endAng, segs) {
      segs = segs || 12;
      for (var m = 0; m <= segs; m++) {
        var t4 = m / segs;
        var a2 = startAng + (endAng - startAng) * t4;
        lp(
          cx + Math.cos(a2) * r,
          cy + Math.sin(a2) * r,
          cz + Math.sin(t4 * Math.PI) * 0.006
        );
      }
    }

    lp(-topLoopR * 0.4, topLoopCy + topLoopR * 0.25, -0.02);
    lpLine(-topLoopR * 0.25, topLoopCy, -0.015,
           -s * 0.06, halfS + s * 0.02, zB * 0.3, 10);

    lpLine(-s * 0.06, halfS + s * 0.02, zB * 0.3,
           -halfS + cornerR, halfS, zB,
           12);

    lpArc(-halfS + cornerR, halfS - cornerR, zB, cornerR, -Math.PI / 2, -Math.PI, 12);

    lpLine(-halfS, halfS - cornerR, zB,
           -halfS, -halfS + cornerR, zB,
           18);

    lpArc(-halfS + cornerR, -halfS + cornerR, zB, cornerR, Math.PI, Math.PI / 2, 12);

    lpLine(-halfS + cornerR, -halfS, zB,
           s * 0.06, -halfS, zA * 0.4,
           14);

    var leftRope = makeRope(leftPath, '#E83452', ROPE_RADIUS * 1.02, {
      textureRepeat: 22, tubularSegments: 260, tension: 0.28
    });
    add(leftRope);

    var tailPts = [
      { x: s * 0.06, y: -halfS, z: zA * 0.4 },
      { x: s * 0.2, y: -halfS - s * 0.1, z: zA * 0.25 },
      { x: s * 0.3, y: -halfS - s * 0.2, z: zA * 0.15 }
    ];
    add(makeRope(tailPts, '#E83452', ROPE_RADIUS * 0.98, {
      textureRepeat: 4, tubularSegments: 50
    }));

    var pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.42, 8),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 })
    );
    pin.position.set(0, topLoopCy + topLoopR * 0.25, 0.2);
    add(pin);

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00cc66, emissiveIntensity: 0.5 })
    );
    arrow.position.set(-halfS - s * 0.05, 0, zB + 0.18);
    arrow.rotation.x = Math.PI / 2;
    arrow.rotation.z = Math.PI * 0.45;
    add(arrow);

    add(makeBead(0, -halfS - s * 0.35, 0, 0.13));

    return meshes;
  }

  /* ============================================================
   *  步骤 5：形成初结
   * ============================================================ */

  function buildFirstKnot() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var scale = 0.78;
    var looseness = 0.75;
    var s = KNOT_SIZE * scale;
    var halfS = s * 0.5;
    var cornerR = s * 0.14 + looseness * s * 0.04;
    var zA = Z_DEPTH * 0.55;
    var zB = -Z_DEPTH * 0.55;

    var topLoopPts = buildTopLoopPath(scale);
    add(makeRope(topLoopPts, ROPE_COLOR, ROPE_RADIUS * 0.92, {
      textureRepeat: 5, tubularSegments: 65, tension: 0.3
    }));

    var mainPath = buildPanChangPath(scale, looseness);
    var weavePattern = [1, -1, 1, -1, 1, -1, 1, -1, 1];
    var finalPath = overUnderPts(mainPath, weavePattern, Z_DEPTH * 0.22);

    add(makeRope(finalPath, ROPE_COLOR, ROPE_RADIUS * 0.97, {
      textureRepeat: 26,
      tubularSegments: 260,
      tension: 0.28
    }));

    var tailY = -halfS - s * 0.28;
    add(makeRope([
      { x: s * 0.04, y: -halfS - s * 0.15, z: Z_DEPTH * 0.1 },
      { x: s * 0.02, y: tailY, z: Z_DEPTH * 0.05 },
      { x: 0, y: tailY - s * 0.08, z: 0 }
    ], ROPE_DARK, ROPE_RADIUS * 0.85, {
      textureRepeat: 4, tubularSegments: 50
    }));

    add(makeBead(0, tailY - s * 0.15, 0, 0.13));

    return meshes;
  }

  /* ============================================================
   *  步骤 6：内圈穿绕（回字格形成）
   * ============================================================ */

  function buildInnerWeave() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var scale = 0.82;
    var looseness = 0.55;
    var s = KNOT_SIZE * scale;

    var topLoopPts = buildTopLoopPath(scale);
    add(makeRope(topLoopPts, ROPE_COLOR, ROPE_RADIUS * 0.92, {
      textureRepeat: 5, tubularSegments: 65, tension: 0.3
    }));

    var mainPath = buildPanChangPath(scale, looseness);
    var weavePattern = [1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1];
    var finalPath = overUnderPts(mainPath, weavePattern, Z_DEPTH * 0.25);

    add(makeRope(finalPath, ROPE_COLOR, ROPE_RADIUS * 0.98, {
      textureRepeat: 28,
      tubularSegments: 280,
      tension: 0.28
    }));

    var innerS = s * 0.22 + looseness * s * 0.04;
    var highlightPts = [];
    function hp(x, y, z) { highlightPts.push({ x: x, y: y, z: z }); }
    function hpLine(x1, y1, z1, x2, y2, z2, segs) {
      segs = segs || 10;
      for (var i = 0; i <= segs; i++) {
        var t = i / segs;
        hp(
          x1 + (x2 - x1) * t,
          y1 + (y2 - y1) * t,
          z1 + (z2 - z1) * t
        );
      }
    }

    hpLine(innerS * 0.5, innerS * 0.7, Z_DEPTH * 0.5,
           innerS * 0.4, -innerS * 0.7, Z_DEPTH * 0.5, 10);

    var highlight = makeRope(highlightPts, '#FFD700', ROPE_RADIUS * 0.6, {
      textureRepeat: 3, tubularSegments: 60, useNormalMap: false
    });
    highlight.material.emissive = new THREE.Color('#FFA500');
    highlight.material.emissiveIntensity = 0.4;
    add(highlight);

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xff8800, emissiveIntensity: 0.6 })
    );
    arrow.position.set(innerS * 0.6, -innerS * 0.5, Z_DEPTH * 0.65);
    arrow.rotation.z = Math.PI * 0.45;
    add(arrow);

    var tailY = -s * 0.5 - s * 0.3;
    add(makeRope([
      { x: s * 0.03, y: -s * 0.5 - s * 0.18, z: Z_DEPTH * 0.08 },
      { x: s * 0.01, y: tailY, z: Z_DEPTH * 0.04 },
      { x: 0, y: tailY - s * 0.1, z: 0 }
    ], ROPE_DARK, ROPE_RADIUS * 0.85, {
      textureRepeat: 4, tubularSegments: 50
    }));

    add(makeBead(0, tailY - s * 0.18, 0, 0.13));

    return meshes;
  }

  /* ============================================================
   *  步骤 7：调形
   * ============================================================ */

  function buildShape() {
    return buildFullKnotShape(0.72);
  }

  /* ============================================================
   *  步骤 8：收紧
   * ============================================================ */

  function buildTighten() {
    return buildFullKnotShape(0.92);
  }

  /* ============================================================
   *  步骤 9（索引8）：收尾定型
   * ============================================================ */

  function buildFinal() {
    var meshes = buildFullKnotShape(1.0);
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var s = KNOT_SIZE;

    var charm1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.025, 8, 16),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#FFD700'),
        roughness: 0.25,
        metalness: 0.7,
        emissive: new THREE.Color('#FFA500'),
        emissiveIntensity: 0.28
      })
    );
    charm1.position.set(s * 0.55, s * 0.15, Z_DEPTH * 0.5);
    charm1.rotation.x = Math.PI / 3;
    add(charm1);

    var charm2 = charm1.clone();
    charm2.position.set(-s * 0.55, s * 0.12, -Z_DEPTH * 0.5);
    charm2.rotation.x = -Math.PI / 4;
    add(charm2);

    return meshes;
  }

  /* ============================================================
   *  动画函数
   * ============================================================ */

  function animAxis(onDone) {
    var s = KNOT_SIZE * 0.85;
    var halfS = s * 0.5;
    var topLoopCy = s * 0.5 + s * 0.32;
    var topLoopR = s * 0.11;

    var fullPts = [];
    function push(x, y, z) { fullPts.push({ x: x, y: y, z: z }); }
    function pushLine(x1, y1, z1, x2, y2, z2, segs) {
      segs = segs || 14;
      for (var i = 0; i <= segs; i++) {
        var t = i / segs;
        push(
          x1 + (x2 - x1) * t,
          y1 + (y2 - y1) * t,
          z1 + (z2 - z1) * t + Math.sin(t * Math.PI) * 0.008
        );
      }
    }

    push(0, -halfS - s * 0.35, 0);
    pushLine(0, -halfS - s * 0.1, 0.005,
             s * 0.02, halfS, 0.01, 16);
    pushLine(s * 0.02, halfS, 0.01,
             topLoopR * 0.25, topLoopCy, 0.015, 10);

    var topLoop = buildTopLoopPath(0.85);
    for (var j = topLoop.length - 1; j >= 0; j--) {
      fullPts.push(topLoop[j]);
    }

    pushLine(-topLoopR * 0.25, topLoopCy, -0.015,
             -s * 0.02, halfS, -0.01, 10);
    pushLine(-s * 0.02, halfS, -0.01,
             0, -halfS - s * 0.25, 0, 16);

    Knots3D.anim.startGrowAnim(2, fullPts, ROPE_COLOR, ROPE_RADIUS, 1600, function () {
      var meshes = buildAxis();
      Knots3D.anim.recordStepMeshes(2, meshes);
      if (onDone) onDone();
    });
  }

  function animRightWrap(onDone) {
    var s = KNOT_SIZE * 0.82;
    var halfS = s * 0.5;
    var cornerR = s * 0.14;
    var zA = Z_DEPTH * 0.55;
    var topLoopCy = s * 0.5 + s * 0.32;
    var topLoopR = s * 0.11;

    var fullPts = [];
    function rp(x, y, z) { fullPts.push({ x: x, y: y, z: z }); }
    function rpLine(x1, y1, z1, x2, y2, z2, segs) {
      segs = segs || 14;
      for (var i = 0; i <= segs; i++) {
        var t = i / segs;
        rp(
          x1 + (x2 - x1) * t,
          y1 + (y2 - y1) * t,
          z1 + (z2 - z1) * t + Math.sin(t * Math.PI) * 0.008
        );
      }
    }
    function rpArc(cx, cy, cz, r, startAng, endAng, segs) {
      segs = segs || 12;
      for (var j = 0; j <= segs; j++) {
        var t2 = j / segs;
        var a = startAng + (endAng - startAng) * t2;
        rp(
          cx + Math.cos(a) * r,
          cy + Math.sin(a) * r,
          cz + Math.sin(t2 * Math.PI) * 0.006
        );
      }
    }

    rp(topLoopR * 0.4, topLoopCy + topLoopR * 0.25, 0.02);
    rpLine(topLoopR * 0.25, topLoopCy, 0.015,
           s * 0.06, halfS + s * 0.02, zA * 0.3, 10);
    rpLine(s * 0.06, halfS + s * 0.02, zA * 0.3,
           halfS - cornerR, halfS, zA, 12);
    rpArc(halfS - cornerR, halfS - cornerR, zA, cornerR, -Math.PI / 2, 0, 12);
    rpLine(halfS, halfS - cornerR, zA,
           halfS, -halfS + cornerR, zA, 18);
    rpArc(halfS - cornerR, -halfS + cornerR, zA, cornerR, 0, Math.PI / 2, 12);
    rpLine(halfS - cornerR, -halfS, zA,
           -s * 0.3, -halfS - s * 0.22, zA * 0.25, 16);

    Knots3D.anim.startGrowAnim(3, fullPts, ROPE_COLOR, ROPE_RADIUS, 1800, function () {
      var meshes = buildRightWrap();
      Knots3D.anim.recordStepMeshes(3, meshes);
      if (onDone) onDone();
    });
  }

  function animLeftWrap(onDone) {
    var s = KNOT_SIZE * 0.8;
    var halfS = s * 0.5;
    var cornerR = s * 0.14;
    var zA = Z_DEPTH * 0.55;
    var zB = -Z_DEPTH * 0.55;
    var topLoopCy = s * 0.5 + s * 0.32;
    var topLoopR = s * 0.11;

    var fullPts = [];
    function lp(x, y, z) { fullPts.push({ x: x, y: y, z: z }); }
    function lpLine(x1, y1, z1, x2, y2, z2, segs) {
      segs = segs || 14;
      for (var i = 0; i <= segs; i++) {
        var t = i / segs;
        lp(
          x1 + (x2 - x1) * t,
          y1 + (y2 - y1) * t,
          z1 + (z2 - z1) * t + Math.sin(t * Math.PI) * 0.008
        );
      }
    }
    function lpArc(cx, cy, cz, r, startAng, endAng, segs) {
      segs = segs || 12;
      for (var j = 0; j <= segs; j++) {
        var t2 = j / segs;
        var a = startAng + (endAng - startAng) * t2;
        lp(
          cx + Math.cos(a) * r,
          cy + Math.sin(a) * r,
          cz + Math.sin(t2 * Math.PI) * 0.006
        );
      }
    }

    lp(-topLoopR * 0.4, topLoopCy + topLoopR * 0.25, -0.02);
    lpLine(-topLoopR * 0.25, topLoopCy, -0.015,
           -s * 0.06, halfS + s * 0.02, zB * 0.3, 10);
    lpLine(-s * 0.06, halfS + s * 0.02, zB * 0.3,
           -halfS + cornerR, halfS, zB, 12);
    lpArc(-halfS + cornerR, halfS - cornerR, zB, cornerR, -Math.PI / 2, -Math.PI, 12);
    lpLine(-halfS, halfS - cornerR, zB,
           -halfS, -halfS + cornerR, zB, 18);
    lpArc(-halfS + cornerR, -halfS + cornerR, zB, cornerR, Math.PI, Math.PI / 2, 12);
    lpLine(-halfS + cornerR, -halfS, zB,
           s * 0.3, -halfS - s * 0.2, zA * 0.15, 16);

    Knots3D.anim.startGrowAnim(4, fullPts, '#E83452', ROPE_RADIUS, 1800, function () {
      var meshes = buildLeftWrap();
      Knots3D.anim.recordStepMeshes(4, meshes);
      if (onDone) onDone();
    });
  }

  function animFirstKnot(onDone) {
    Knots3D.anim.startStepAnim(5, [], [], 1000, function () {
      var meshes = buildFirstKnot();
      Knots3D.anim.recordStepMeshes(5, meshes);
      if (onDone) onDone();
    });
  }

  function animInnerWeave(onDone) {
    Knots3D.anim.startStepAnim(6, [], [], 1100, function () {
      var meshes = buildInnerWeave();
      Knots3D.anim.recordStepMeshes(6, meshes);
      if (onDone) onDone();
    });
  }

  /* ============================================================
   *  收紧 Builder
   * ============================================================ */

  function buildPanChangShape(t) {
    return buildFullKnotShape(t);
  }

  /* ============================================================
   *  注册
   * ============================================================ */

  Knots3D.register('pan-chang', {
    builders: [
      buildPreview, buildMaterials, buildAxis, buildRightWrap, buildLeftWrap,
      buildFirstKnot, buildInnerWeave, buildShape, buildFinal
    ],
    cameras: [
      CAM.preview, CAM.material, CAM.axis, CAM.rightWrap, CAM.leftWrap,
      CAM.firstKnot, CAM.inner, CAM.shape, CAM.final
    ],
    anims: { 2: animAxis, 3: animRightWrap, 4: animLeftWrap, 5: animFirstKnot, 6: animInnerWeave },
    tightenStep: 7,
    tightenBuilder: buildPanChangShape,
    interactions: { threadStep: 5, tightenStep: 7 }
  });

})();
