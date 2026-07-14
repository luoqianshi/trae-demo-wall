/**
 * ping-jie.js - 平结（平安结） 3D 实现（完全重写版）
 *
 * 核心特性：
 * 1. 真实平结结构：垂直轴线 + 左右交替穿环的编织线，形成鳞片状横向纹理
 * 2. 轴线用稍深色（#9C162D），编织线用红色（#C41E3A）
 * 3. 5-6个编织单元，每个单元有明确的挑压关系（z轴差≥0.15）
 * 4. 9个独立builder展示真实编织递进
 * 5. 使用 startGrowAnim 实现绳子生长动画
 * 6. tightenBuilder 支持收紧交互（tightenStep = 7）
 * 7. 复用 overUnderPts 等工具
 *
 * 步骤：0预览 1材料 2固定轴线 3左线穿环 4右线穿环 5交替编织 6持续编织 7收紧整理 8收尾定型
 */
(function () {
  'use strict';

  var T = Knots3D.tools;
  var makeRope = T.makeRope;
  var makeBead = T.makeBead;
  var THREE = T.THREE;
  var overUnderPts = T.overUnderPts;
  var ropeGroup = function () { return Scene3D._.ropeGroup; };

  var ROPE_COLOR = '#C41E3A';
  var AXIS_COLOR = '#9C162D';
  var GOLD_COLOR = '#DAA520';
  var ROPE_RADIUS = 0.10;
  var UNIT_COUNT = 5;
  var UNIT_H = 0.32;
  var WEAVE_WIDTH = 0.72;
  var Z_DEPTH = 0.18;
  var TOP_Y = 1.5;

  var CAM = {
    preview:  { pos: { x: 0, y: 0.0, z: 7.0 },  target: { x: 0, y: -0.2, z: 0 } },
    material: { pos: { x: 0, y: 0.2, z: 5.5 },  target: { x: 0, y: 0.1, z: 0 } },
    axis:     { pos: { x: 0, y: 0.1, z: 6.0 },  target: { x: 0, y: 0.0, z: 0 } },
    leftLoop: { pos: { x: -0.4, y: 0.2, z: 5.8 },target: { x: 0, y: 0.3, z: 0 } },
    rightLoop:{ pos: { x: 0.4, y: 0.1, z: 5.8 }, target: { x: 0, y: 0.0, z: 0 } },
    weave23:  { pos: { x: 0.3, y: -0.1, z: 6.2 },target: { x: 0, y: -0.2, z: 0 } },
    weave45:  { pos: { x: 0.2, y: -0.2, z: 6.5 },target: { x: 0, y: -0.4, z: 0 } },
    tighten:  { pos: { x: 0, y: -0.1, z: 7.0 },  target: { x: 0, y: -0.3, z: 0 } },
    final:    { pos: { x: 0.4, y: 0.0, z: 7.0 }, target: { x: 0, y: -0.3, z: 0 } }
  };

  function buildWeavePath(unitCount, topY, unitH, width, zDepth) {
    var pts = [];
    pts.push({ x: -width * 0.85, y: topY + unitH * 0.25, z: -zDepth * 0.3 });

    for (var i = 0; i < unitCount; i++) {
      var yC = topY - i * unitH;

      pts.push({ x: -width * 0.55, y: yC + unitH * 0.12, z: zDepth * 0.25 });
      pts.push({ x: -width * 0.3, y: yC + unitH * 0.22, z: zDepth * 0.75 });
      pts.push({ x: -width * 0.1, y: yC + unitH * 0.26, z: zDepth });
      pts.push({ x: 0, y: yC + unitH * 0.28, z: zDepth });
      pts.push({ x: width * 0.1, y: yC + unitH * 0.26, z: zDepth });
      pts.push({ x: width * 0.3, y: yC + unitH * 0.22, z: zDepth * 0.75 });
      pts.push({ x: width * 0.55, y: yC + unitH * 0.12, z: zDepth * 0.25 });

      pts.push({ x: width * 0.7, y: yC - unitH * 0.05, z: -zDepth * 0.15 });
      pts.push({ x: width * 0.6, y: yC - unitH * 0.22, z: -zDepth * 0.7 });
      pts.push({ x: width * 0.35, y: yC - unitH * 0.3, z: -zDepth * 0.9 });
      pts.push({ x: 0, y: yC - unitH * 0.32, z: -zDepth });
      pts.push({ x: -width * 0.35, y: yC - unitH * 0.3, z: -zDepth * 0.9 });
      pts.push({ x: -width * 0.6, y: yC - unitH * 0.22, z: -zDepth * 0.7 });
      pts.push({ x: -width * 0.7, y: yC - unitH * 0.05, z: -zDepth * 0.15 });
    }

    var botY = topY - unitCount * unitH;
    pts.push({ x: -width * 0.85, y: botY - unitH * 0.18, z: zDepth * 0.2 });

    return pts;
  }

  function buildAxisPts(topY, botY) {
    return [
      { x: 0, y: topY + 0.35, z: 0 },
      { x: 0, y: topY + 0.08, z: 0 },
      { x: 0, y: botY - 0.08, z: 0 },
      { x: 0, y: botY - 0.35, z: 0 }
    ];
  }

  function buildFullKnotShape(t) {
    t = Math.max(0, Math.min(1, t || 1));
    var scale = 0.82 + 0.18 * t;
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var topY = TOP_Y * scale;
    var botY = topY - UNIT_COUNT * UNIT_H * scale;
    var w = WEAVE_WIDTH * scale;
    var unitH = UNIT_H * scale;
    var zD = Z_DEPTH * scale;

    add(makeRope(buildAxisPts(topY, botY), AXIS_COLOR, ROPE_RADIUS * 0.88, {
      textureRepeat: 14,
      tubularSegments: 120
    }));

    var weavePts = buildWeavePath(UNIT_COUNT, topY, unitH, w, zD);
    var finalPts = overUnderPts(weavePts, [1, -1, 1, -1, 1, -1], zD * 0.3);

    add(makeRope(finalPts, ROPE_COLOR, ROPE_RADIUS, {
      textureRepeat: 22,
      tubularSegments: 240,
      tension: 0.28
    }));

    add(makeBead(0, botY - 0.42, 0, 0.14));

    return meshes;
  }

  function buildPreview() {
    return buildFullKnotShape(1.0);
  }

  function buildMaterials() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var c1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.1, 12, 30),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(ROPE_COLOR), roughness: 0.38, metalness: 0.06 })
    );
    c1.position.set(-1.0, 0.35, 0);
    c1.rotation.x = Math.PI / 2;
    c1.castShadow = true;
    add(c1);

    var c2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.09, 12, 28),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(GOLD_COLOR), roughness: 0.38, metalness: 0.06 })
    );
    c2.position.set(0.15, 0.32, 0.08);
    c2.rotation.x = Math.PI / 2;
    c2.castShadow = true;
    add(c2);

    add(makeRope([
      { x: -0.7, y: 0.06, z: 0.06 },
      { x: -0.1, y: 0.1, z: 0.08 },
      { x: 0.55, y: 0.05, z: 0.05 }
    ], ROPE_COLOR, 0.075, { textureRepeat: 6 }));

    add(makeRope([
      { x: -0.7, y: -0.15, z: -0.05 },
      { x: -0.1, y: -0.1, z: -0.07 },
      { x: 0.55, y: -0.14, z: -0.04 }
    ], GOLD_COLOR, 0.075, { textureRepeat: 6 }));

    var clip = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.06, 0.12),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#666666'), roughness: 0.4, metalness: 0.6 })
    );
    clip.position.set(0.95, 0.25, 0);
    add(clip);

    var sc1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.32, 8),
      new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 })
    );
    sc1.position.set(0.95, -0.25, 0.16);
    sc1.rotation.z = 0.3;
    add(sc1);
    var sc2 = sc1.clone();
    sc2.rotation.z = -0.3;
    add(sc2);

    var lighter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.07, 0.28, 10),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#333333'), roughness: 0.5, metalness: 0.3 })
    );
    lighter.position.set(-0.9, -0.3, 0.1);
    add(lighter);

    return meshes;
  }

  function buildAxis() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var topY = TOP_Y;
    var botY = topY - UNIT_COUNT * UNIT_H;

    add(makeRope(buildAxisPts(topY, botY), AXIS_COLOR, ROPE_RADIUS * 0.9, {
      textureRepeat: 12,
      tubularSegments: 110
    }));

    var bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.1, 10),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#8B7355'), roughness: 0.6, metalness: 0.15 })
    );
    bar.rotation.z = Math.PI / 2;
    bar.position.y = topY + 0.1;
    add(bar);

    add(makeRope([
      { x: -WEAVE_WIDTH * 0.9, y: topY - UNIT_H * 0.3, z: -Z_DEPTH * 0.2 },
      { x: -WEAVE_WIDTH * 0.5, y: topY - UNIT_H * 0.15, z: -Z_DEPTH * 0.1 },
      { x: 0, y: topY - UNIT_H * 0.05, z: 0 }
    ], ROPE_COLOR, ROPE_RADIUS * 0.85, {
      textureRepeat: 6,
      tubularSegments: 80,
      tension: 0.3
    }));

    add(makeBead(0, botY - 0.4, 0, 0.15));

    return meshes;
  }

  function buildLeftLoop() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var topY = TOP_Y;
    var botY = topY - UNIT_COUNT * UNIT_H;
    var w = WEAVE_WIDTH;
    var zD = Z_DEPTH;

    var axisTopPts = [
      { x: 0, y: topY + 0.35, z: 0 },
      { x: 0, y: topY + 0.08, z: 0 },
      { x: 0, y: topY - UNIT_H * 0.2, z: 0 }
    ];
    add(makeRope(axisTopPts, AXIS_COLOR, ROPE_RADIUS * 0.9, {
      textureRepeat: 5,
      tubularSegments: 70
    }));

    var axisBotPts = [
      { x: 0, y: topY - UNIT_H * 0.5, z: 0 },
      { x: 0, y: botY - 0.08, z: 0 },
      { x: 0, y: botY - 0.35, z: 0 }
    ];
    var axisBot = makeRope(axisBotPts, AXIS_COLOR, ROPE_RADIUS * 0.85, {
      textureRepeat: 10,
      tubularSegments: 100
    });
    axisBot.material.transparent = true;
    axisBot.material.opacity = 0.35;
    axisBot.material.depthWrite = false;
    add(axisBot);

    var bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.1, 10),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#8B7355'), roughness: 0.6, metalness: 0.15 })
    );
    bar.rotation.z = Math.PI / 2;
    bar.position.y = topY + 0.1;
    add(bar);

    var leftLoopPts = [
      { x: -w * 0.85, y: topY - UNIT_H * 0.1, z: -zD * 0.25 },
      { x: -w * 0.6, y: topY + UNIT_H * 0.02, z: zD * 0.2 },
      { x: -w * 0.35, y: topY + UNIT_H * 0.18, z: zD * 0.7 },
      { x: -w * 0.12, y: topY + UNIT_H * 0.24, z: zD },
      { x: 0, y: topY + UNIT_H * 0.26, z: zD },
      { x: w * 0.08, y: topY + UNIT_H * 0.22, z: zD * 0.85 },
      { x: w * 0.2, y: topY + UNIT_H * 0.12, z: zD * 0.5 },
      { x: w * 0.28, y: topY - UNIT_H * 0.02, z: zD * 0.15 },
      { x: w * 0.3, y: topY - UNIT_H * 0.2, z: -zD * 0.15 }
    ];
    add(makeRope(leftLoopPts, ROPE_COLOR, ROPE_RADIUS, {
      textureRepeat: 10,
      tubularSegments: 130,
      tension: 0.3
    }));

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xff8800, emissiveIntensity: 0.5 })
    );
    arrow.position.set(w * 0.15, topY - UNIT_H * 0.28, zD * 0.1);
    arrow.rotation.z = -0.6;
    arrow.rotation.x = 0.3;
    add(arrow);

    add(makeBead(0, botY - 0.4, 0, 0.15));

    return meshes;
  }

  function buildRightLoop() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var topY = TOP_Y;
    var botY = topY - UNIT_COUNT * UNIT_H;
    var w = WEAVE_WIDTH;
    var zD = Z_DEPTH;

    var axisTopPts = [
      { x: 0, y: topY + 0.35, z: 0 },
      { x: 0, y: topY + 0.08, z: 0 },
      { x: 0, y: topY - UNIT_H * 0.7, z: 0 }
    ];
    add(makeRope(axisTopPts, AXIS_COLOR, ROPE_RADIUS * 0.9, {
      textureRepeat: 7,
      tubularSegments: 90
    }));

    var axisBotPts = [
      { x: 0, y: topY - UNIT_H * 1.0, z: 0 },
      { x: 0, y: botY - 0.08, z: 0 },
      { x: 0, y: botY - 0.35, z: 0 }
    ];
    var axisBot = makeRope(axisBotPts, AXIS_COLOR, ROPE_RADIUS * 0.85, {
      textureRepeat: 9,
      tubularSegments: 90
    });
    axisBot.material.transparent = true;
    axisBot.material.opacity = 0.35;
    axisBot.material.depthWrite = false;
    add(axisBot);

    var bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.1, 10),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#8B7355'), roughness: 0.6, metalness: 0.15 })
    );
    bar.rotation.z = Math.PI / 2;
    bar.position.y = topY + 0.1;
    add(bar);

    var unit1Pts = buildWeavePath(1, topY, UNIT_H, w, zD);
    var unit1Final = overUnderPts(unit1Pts, [1, -1], zD * 0.25);
    add(makeRope(unit1Final, ROPE_COLOR, ROPE_RADIUS * 0.95, {
      textureRepeat: 10,
      tubularSegments: 150,
      tension: 0.28
    }));

    var rightLoopPts = [
      { x: w * 0.85, y: topY - UNIT_H * 0.9, z: zD * 0.2 },
      { x: w * 0.6, y: topY - UNIT_H * 0.75, z: zD * 0.6 },
      { x: w * 0.35, y: topY - UNIT_H * 0.62, z: zD * 0.9 },
      { x: w * 0.12, y: topY - UNIT_H * 0.58, z: zD },
      { x: 0, y: topY - UNIT_H * 0.56, z: zD },
      { x: -w * 0.08, y: topY - UNIT_H * 0.6, z: zD * 0.8 },
      { x: -w * 0.2, y: topY - UNIT_H * 0.72, z: zD * 0.45 },
      { x: -w * 0.28, y: topY - UNIT_H * 0.88, z: zD * 0.1 },
      { x: -w * 0.3, y: topY - UNIT_H * 1.05, z: -zD * 0.2 }
    ];
    add(makeRope(rightLoopPts, '#E83452', ROPE_RADIUS, {
      textureRepeat: 10,
      tubularSegments: 130,
      tension: 0.3
    }));

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: 0x00eeff, emissive: 0x00aaff, emissiveIntensity: 0.5 })
    );
    arrow.position.set(-w * 0.15, topY - UNIT_H * 1.12, -zD * 0.15);
    arrow.rotation.z = 0.6;
    arrow.rotation.x = -0.3;
    add(arrow);

    add(makeBead(0, botY - 0.4, 0, 0.15));

    return meshes;
  }

  function buildWeave23() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var topY = TOP_Y;
    var botY = topY - UNIT_COUNT * UNIT_H;

    var axisTopPts = [
      { x: 0, y: topY + 0.35, z: 0 },
      { x: 0, y: topY + 0.08, z: 0 },
      { x: 0, y: topY - 2.5 * UNIT_H, z: 0 }
    ];
    add(makeRope(axisTopPts, AXIS_COLOR, ROPE_RADIUS * 0.9, {
      textureRepeat: 9,
      tubularSegments: 100
    }));

    var axisBotPts = [
      { x: 0, y: topY - 3.2 * UNIT_H, z: 0 },
      { x: 0, y: botY - 0.08, z: 0 },
      { x: 0, y: botY - 0.35, z: 0 }
    ];
    var axisBot = makeRope(axisBotPts, AXIS_COLOR, ROPE_RADIUS * 0.85, {
      textureRepeat: 8,
      tubularSegments: 80
    });
    axisBot.material.transparent = true;
    axisBot.material.opacity = 0.35;
    axisBot.material.depthWrite = false;
    add(axisBot);

    var bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.1, 10),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#8B7355'), roughness: 0.6, metalness: 0.15 })
    );
    bar.rotation.z = Math.PI / 2;
    bar.position.y = topY + 0.1;
    add(bar);

    var weavePts = buildWeavePath(2, topY, UNIT_H, WEAVE_WIDTH, Z_DEPTH);
    var finalPts = overUnderPts(weavePts, [1, -1, 1, -1], Z_DEPTH * 0.25);
    add(makeRope(finalPts, ROPE_COLOR, ROPE_RADIUS * 0.97, {
      textureRepeat: 14,
      tubularSegments: 180,
      tension: 0.28
    }));

    var tailPts = [
      { x: -WEAVE_WIDTH * 0.7, y: topY - 2 * UNIT_H - UNIT_H * 0.3, z: Z_DEPTH * 0.15 },
      { x: -WEAVE_WIDTH * 0.45, y: topY - 2 * UNIT_H - UNIT_H * 0.45, z: Z_DEPTH * 0.05 }
    ];
    add(makeRope(tailPts, ROPE_COLOR, ROPE_RADIUS * 0.9, {
      textureRepeat: 4,
      tubularSegments: 50
    }));

    add(makeBead(0, botY - 0.4, 0, 0.15));

    return meshes;
  }

  function buildWeave45() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var topY = TOP_Y;
    var botY = topY - UNIT_COUNT * UNIT_H;

    var axisTopPts = [
      { x: 0, y: topY + 0.35, z: 0 },
      { x: 0, y: topY + 0.08, z: 0 },
      { x: 0, y: topY - 4.5 * UNIT_H, z: 0 }
    ];
    add(makeRope(axisTopPts, AXIS_COLOR, ROPE_RADIUS * 0.9, {
      textureRepeat: 12,
      tubularSegments: 110
    }));

    var axisBotPts = [
      { x: 0, y: topY - 5.0 * UNIT_H, z: 0 },
      { x: 0, y: botY - 0.08, z: 0 },
      { x: 0, y: botY - 0.35, z: 0 }
    ];
    var axisBot = makeRope(axisBotPts, AXIS_COLOR, ROPE_RADIUS * 0.85, {
      textureRepeat: 5,
      tubularSegments: 60
    });
    axisBot.material.transparent = true;
    axisBot.material.opacity = 0.35;
    axisBot.material.depthWrite = false;
    add(axisBot);

    var bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.1, 10),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#8B7355'), roughness: 0.6, metalness: 0.15 })
    );
    bar.rotation.z = Math.PI / 2;
    bar.position.y = topY + 0.1;
    add(bar);

    var weavePts = buildWeavePath(4, topY, UNIT_H, WEAVE_WIDTH, Z_DEPTH);
    var finalPts = overUnderPts(weavePts, [1, -1, 1, -1, 1, -1, 1, -1], Z_DEPTH * 0.28);
    add(makeRope(finalPts, ROPE_COLOR, ROPE_RADIUS * 0.98, {
      textureRepeat: 18,
      tubularSegments: 220,
      tension: 0.28
    }));

    var tailPts = [
      { x: -WEAVE_WIDTH * 0.7, y: topY - 4 * UNIT_H - UNIT_H * 0.2, z: Z_DEPTH * 0.15 },
      { x: -WEAVE_WIDTH * 0.5, y: topY - 4 * UNIT_H - UNIT_H * 0.4, z: Z_DEPTH * 0.08 }
    ];
    add(makeRope(tailPts, ROPE_COLOR, ROPE_RADIUS * 0.9, {
      textureRepeat: 4,
      tubularSegments: 50
    }));

    add(makeBead(0, botY - 0.4, 0, 0.15));

    return meshes;
  }

  function buildTighten() {
    return buildFullKnotShape(0.88);
  }

  function buildFinal() {
    var meshes = buildFullKnotShape(1.0);
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var botY = TOP_Y - UNIT_COUNT * UNIT_H;

    var tasselTop = botY - 0.45;
    for (var i = 0; i < 8; i++) {
      var ang = (i / 8) * Math.PI * 2;
      var ex = Math.cos(ang) * 0.08;
      var ez = Math.sin(ang) * 0.06;
      var ey = tasselTop - 0.45 - Math.random() * 0.15;
      add(makeRope([
        { x: 0, y: tasselTop, z: 0 },
        { x: ex * 0.5, y: tasselTop - 0.2, z: ez * 0.5 },
        { x: ex, y: ey, z: ez }
      ], ROPE_COLOR, 0.018, { textureRepeat: 2, tubularSegments: 20, useNormalMap: false }));
    }

    var charm = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.025, 8, 16),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#FFD700'), roughness: 0.25, metalness: 0.7, emissive: new THREE.Color('#FFA500'), emissiveIntensity: 0.25 })
    );
    charm.position.set(0.55, 0.25, 0.2);
    charm.rotation.x = Math.PI / 3;
    add(charm);

    return meshes;
  }

  function animAxis(onDone) {
    var topY = TOP_Y;
    var botY = topY - UNIT_COUNT * UNIT_H;
    var fullPts = buildAxisPts(topY, botY);

    Knots3D.anim.startGrowAnim(2, fullPts, AXIS_COLOR, ROPE_RADIUS * 0.9, 1200, function () {
      var meshes = buildAxis();
      Knots3D.anim.recordStepMeshes(2, meshes);
      if (onDone) onDone();
    });
  }

  function animLeftLoop(onDone) {
    var w = WEAVE_WIDTH;
    var zD = Z_DEPTH;
    var topY = TOP_Y;

    var fullPts = [
      { x: -w * 0.85, y: topY - UNIT_H * 0.1, z: -zD * 0.25 },
      { x: -w * 0.6, y: topY + UNIT_H * 0.02, z: zD * 0.2 },
      { x: -w * 0.35, y: topY + UNIT_H * 0.18, z: zD * 0.7 },
      { x: -w * 0.12, y: topY + UNIT_H * 0.24, z: zD },
      { x: 0, y: topY + UNIT_H * 0.26, z: zD },
      { x: w * 0.08, y: topY + UNIT_H * 0.22, z: zD * 0.85 },
      { x: w * 0.2, y: topY + UNIT_H * 0.12, z: zD * 0.5 },
      { x: w * 0.28, y: topY - UNIT_H * 0.02, z: zD * 0.15 },
      { x: w * 0.3, y: topY - UNIT_H * 0.2, z: -zD * 0.15 }
    ];

    Knots3D.anim.startGrowAnim(3, fullPts, ROPE_COLOR, ROPE_RADIUS, 1400, function () {
      var meshes = buildLeftLoop();
      Knots3D.anim.recordStepMeshes(3, meshes);
      if (onDone) onDone();
    });
  }

  function animRightLoop(onDone) {
    var w = WEAVE_WIDTH;
    var zD = Z_DEPTH;
    var topY = TOP_Y;

    var rightLoopPts = [
      { x: w * 0.85, y: topY - UNIT_H * 0.9, z: zD * 0.2 },
      { x: w * 0.6, y: topY - UNIT_H * 0.75, z: zD * 0.6 },
      { x: w * 0.35, y: topY - UNIT_H * 0.62, z: zD * 0.9 },
      { x: w * 0.12, y: topY - UNIT_H * 0.58, z: zD },
      { x: 0, y: topY - UNIT_H * 0.56, z: zD },
      { x: -w * 0.08, y: topY - UNIT_H * 0.6, z: zD * 0.8 },
      { x: -w * 0.2, y: topY - UNIT_H * 0.72, z: zD * 0.45 },
      { x: -w * 0.28, y: topY - UNIT_H * 0.88, z: zD * 0.1 },
      { x: -w * 0.3, y: topY - UNIT_H * 1.05, z: -zD * 0.2 }
    ];

    Knots3D.anim.startGrowAnim(4, rightLoopPts, '#E83452', ROPE_RADIUS, 1400, function () {
      var meshes = buildRightLoop();
      Knots3D.anim.recordStepMeshes(4, meshes);
      if (onDone) onDone();
    });
  }

  function animWeave23(onDone) {
    var weavePts = buildWeavePath(2, TOP_Y, UNIT_H, WEAVE_WIDTH, Z_DEPTH);
    var fullPts = overUnderPts(weavePts, [1, -1, 1, -1], Z_DEPTH * 0.25);

    Knots3D.anim.startGrowAnim(5, fullPts, ROPE_COLOR, ROPE_RADIUS, 1600, function () {
      var meshes = buildWeave23();
      Knots3D.anim.recordStepMeshes(5, meshes);
      if (onDone) onDone();
    });
  }

  function animWeave45(onDone) {
    var weavePts = buildWeavePath(4, TOP_Y, UNIT_H, WEAVE_WIDTH, Z_DEPTH);
    var fullPts = overUnderPts(weavePts, [1, -1, 1, -1, 1, -1, 1, -1], Z_DEPTH * 0.28);

    Knots3D.anim.startGrowAnim(6, fullPts, ROPE_COLOR, ROPE_RADIUS, 1800, function () {
      var meshes = buildWeave45();
      Knots3D.anim.recordStepMeshes(6, meshes);
      if (onDone) onDone();
    });
  }

  function buildPingJieShape(t) { return buildFullKnotShape(t); }

  Knots3D.register('ping-jie', {
    builders: [
      buildPreview, buildMaterials, buildAxis, buildLeftLoop, buildRightLoop,
      buildWeave23, buildWeave45, buildTighten, buildFinal
    ],
    cameras: [
      CAM.preview, CAM.material, CAM.axis, CAM.leftLoop, CAM.rightLoop,
      CAM.weave23, CAM.weave45, CAM.tighten, CAM.final
    ],
    anims: { 2: animAxis, 3: animLeftLoop, 4: animRightLoop, 5: animWeave23, 6: animWeave45 },
    tightenStep: 7,
    tightenBuilder: buildPingJieShape,
    interactions: { threadStep: 4, tightenStep: 7 }
  });

})();
