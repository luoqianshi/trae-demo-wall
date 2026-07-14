/**
 * she-jie.js - 蛇结 3D 实现（完全重写版）
 *
 * 核心特性：
 * 1. 真实蛇结结构：两根线交替穿环，无轴线，形成斜向鳞纹
 * 2. 棕色 #8B4513 和金色 #DAA520 两色线交替编织
 * 3. 6-7个编织单元，每个单元有明确的挑压关系（z轴差≥0.15）
 * 4. 9个独立builder展示真实编织递进
 * 5. 使用 startGrowAnim 实现绳子生长动画
 * 6. tightenBuilder 支持收紧交互（tightenStep = 7）
 * 7. 复用 overUnderPts 等工具
 *
 * 步骤：0预览 1材料 2起头固定 3第一结 4第二结 5交替编织 6持续编织 7收紧整理 8收尾定型
 */
(function () {
  'use strict';

  var T = Knots3D.tools;
  var makeRope = T.makeRope;
  var makeBead = T.makeBead;
  var THREE = T.THREE;
  var overUnderPts = T.overUnderPts;
  var ropeGroup = function () { return Scene3D._.ropeGroup; };

  var COLOR_A = '#8B4513';
  var COLOR_B = '#DAA520';
  var ROPE_RADIUS = 0.10;
  var UNIT_COUNT = 6;
  var UNIT_H = 0.34;
  var KNOT_RADIUS = 0.28;
  var Z_DEPTH = 0.18;
  var TOP_Y = 1.6;

  var CAM = {
    preview:  { pos: { x: 0, y: 0.0, z: 7.0 },  target: { x: 0, y: -0.2, z: 0 } },
    material: { pos: { x: 0, y: 0.2, z: 5.5 },  target: { x: 0, y: 0.1, z: 0 } },
    prepare:  { pos: { x: 0, y: 0.1, z: 6.0 },  target: { x: 0, y: 0.0, z: 0 } },
    first:    { pos: { x: -0.4, y: 0.3, z: 5.8 },target: { x: 0, y: 0.4, z: 0 } },
    second:   { pos: { x: 0.4, y: 0.1, z: 5.8 }, target: { x: 0, y: 0.1, z: 0 } },
    weave34:  { pos: { x: 0.3, y: -0.1, z: 6.2 },target: { x: 0, y: -0.2, z: 0 } },
    weave56:  { pos: { x: 0.2, y: -0.2, z: 6.5 },target: { x: 0, y: -0.4, z: 0 } },
    tighten:  { pos: { x: 0, y: -0.1, z: 7.0 },  target: { x: 0, y: -0.3, z: 0 } },
    final:    { pos: { x: 0.4, y: 0.0, z: 7.0 }, target: { x: 0, y: -0.3, z: 0 } }
  };

  function buildSnakePath(unitCount, topY, unitH, radius, zDepth, phase) {
    var pts = [];
    var segmentsPerUnit = 16;
    var totalSegments = unitCount * segmentsPerUnit;

    for (var i = 0; i <= totalSegments; i++) {
      var t = i / totalSegments;
      var y = topY - t * unitCount * unitH;
      var angle = phase + t * unitCount * Math.PI * 2;

      var x = Math.cos(angle) * radius * 0.55;
      var z = Math.sin(angle) * radius * 0.35;

      pts.push({ x: x, y: y, z: z });
    }

    return pts;
  }

  function buildFullKnotShape(t) {
    t = Math.max(0, Math.min(1, t || 1));
    var scale = 0.8 + 0.2 * t;
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var topY = TOP_Y * scale;
    var unitH = UNIT_H * scale;
    var radius = KNOT_RADIUS * scale;
    var zD = Z_DEPTH * scale;
    var botY = topY - UNIT_COUNT * unitH;

    var topTailA = [
      { x: 0.06, y: topY + 0.35, z: 0.04 },
      { x: 0.04, y: topY + 0.12, z: 0.025 },
      { x: Math.cos(0) * radius * 0.55, y: topY, z: Math.sin(0) * radius * 0.35 }
    ];
    add(makeRope(topTailA, COLOR_A, ROPE_RADIUS * 0.9, { textureRepeat: 5, tubularSegments: 70 }));

    var topTailB = [
      { x: -0.06, y: topY + 0.3, z: -0.04 },
      { x: -0.04, y: topY + 0.08, z: -0.025 },
      { x: Math.cos(Math.PI) * radius * 0.55, y: topY, z: Math.sin(Math.PI) * radius * 0.35 }
    ];
    add(makeRope(topTailB, COLOR_B, ROPE_RADIUS * 0.9, { textureRepeat: 5, tubularSegments: 70 }));

    var pathA = buildSnakePath(UNIT_COUNT, topY, unitH, radius, zD, 0);
    var patternA = [];
    for (var i = 0; i < UNIT_COUNT * 2; i++) {
      patternA.push(i % 2 === 0 ? 1 : -1);
    }
    var finalPathA = overUnderPts(pathA, patternA, zD * 0.6);

    add(makeRope(finalPathA, COLOR_A, ROPE_RADIUS * 0.95, {
      textureRepeat: 22,
      tubularSegments: 220,
      tension: 0.3
    }));

    var pathB = buildSnakePath(UNIT_COUNT, topY, unitH, radius, zD, Math.PI);
    var patternB = [];
    for (var j = 0; j < UNIT_COUNT * 2; j++) {
      patternB.push(j % 2 === 0 ? -1 : 1);
    }
    var finalPathB = overUnderPts(pathB, patternB, zD * 0.6);

    add(makeRope(finalPathB, COLOR_B, ROPE_RADIUS * 0.95, {
      textureRepeat: 22,
      tubularSegments: 220,
      tension: 0.3
    }));

    var botTailA = [
      { x: Math.cos(UNIT_COUNT * Math.PI * 2) * radius * 0.55, y: botY, z: Math.sin(UNIT_COUNT * Math.PI * 2) * radius * 0.35 },
      { x: 0.04, y: botY - 0.1, z: 0.025 },
      { x: 0.06, y: botY - 0.3, z: 0.04 }
    ];
    add(makeRope(botTailA, COLOR_A, ROPE_RADIUS * 0.88, { textureRepeat: 4, tubularSegments: 60 }));

    var botTailB = [
      { x: Math.cos(Math.PI + UNIT_COUNT * Math.PI * 2) * radius * 0.55, y: botY, z: Math.sin(Math.PI + UNIT_COUNT * Math.PI * 2) * radius * 0.35 },
      { x: -0.04, y: botY - 0.12, z: -0.025 },
      { x: -0.06, y: botY - 0.32, z: -0.04 }
    ];
    add(makeRope(botTailB, COLOR_B, ROPE_RADIUS * 0.88, { textureRepeat: 4, tubularSegments: 60 }));

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
      new THREE.MeshStandardMaterial({ color: new THREE.Color(COLOR_A), roughness: 0.38, metalness: 0.06 })
    );
    c1.position.set(-1.0, 0.35, 0);
    c1.rotation.x = Math.PI / 2;
    c1.castShadow = true;
    add(c1);

    var c2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.09, 12, 28),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(COLOR_B), roughness: 0.38, metalness: 0.06 })
    );
    c2.position.set(0.15, 0.32, 0.08);
    c2.rotation.x = Math.PI / 2;
    c2.castShadow = true;
    add(c2);

    add(makeRope([
      { x: -0.7, y: 0.06, z: 0.06 },
      { x: -0.1, y: 0.1, z: 0.08 },
      { x: 0.55, y: 0.05, z: 0.05 }
    ], COLOR_A, 0.075, { textureRepeat: 6 }));

    add(makeRope([
      { x: -0.7, y: -0.15, z: -0.05 },
      { x: -0.1, y: -0.1, z: -0.07 },
      { x: 0.55, y: -0.14, z: -0.04 }
    ], COLOR_B, 0.075, { textureRepeat: 6 }));

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

  function buildPrepare() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var topY = TOP_Y;
    var botY = topY - UNIT_COUNT * UNIT_H;

    add(makeRope([
      { x: 0.08, y: topY + 0.35, z: 0.04 },
      { x: 0.07, y: topY + 0.1, z: 0.03 },
      { x: 0.06, y: topY - 0.05, z: 0.025 },
      { x: 0.05, y: botY + 0.1, z: 0.02 },
      { x: 0.04, y: botY - 0.1, z: 0.015 },
      { x: 0.03, y: botY - 0.3, z: 0.01 }
    ], COLOR_A, ROPE_RADIUS * 0.9, { textureRepeat: 14, tubularSegments: 120 }));

    add(makeRope([
      { x: -0.08, y: topY + 0.3, z: -0.04 },
      { x: -0.07, y: topY + 0.05, z: -0.03 },
      { x: -0.06, y: topY - 0.1, z: -0.025 },
      { x: -0.05, y: botY + 0.05, z: -0.02 },
      { x: -0.04, y: botY - 0.15, z: -0.015 },
      { x: -0.03, y: botY - 0.35, z: -0.01 }
    ], COLOR_B, ROPE_RADIUS * 0.9, { textureRepeat: 14, tubularSegments: 120 }));

    var bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.1, 10),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#8B7355'), roughness: 0.6, metalness: 0.15 })
    );
    bar.rotation.z = Math.PI / 2;
    bar.position.y = topY + 0.1;
    add(bar);

    add(makeBead(0, botY - 0.45, 0, 0.15));

    return meshes;
  }

  function buildFirstKnot() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var topY = TOP_Y;
    var centerY = topY - UNIT_H * 0.5;
    var botY = topY - UNIT_COUNT * UNIT_H;
    var r = KNOT_RADIUS;
    var zD = Z_DEPTH;

    add(makeRope([
      { x: 0.08, y: topY + 0.35, z: 0.04 },
      { x: 0.07, y: topY + 0.1, z: 0.03 },
      { x: r * 0.55, y: topY, z: 0 }
    ], COLOR_A, ROPE_RADIUS * 0.9, { textureRepeat: 5, tubularSegments: 70 }));

    add(makeRope([
      { x: -0.08, y: topY + 0.3, z: -0.04 },
      { x: -0.07, y: topY + 0.05, z: -0.03 },
      { x: -r * 0.55, y: topY - UNIT_H * 0.25, z: 0 }
    ], COLOR_B, ROPE_RADIUS * 0.9, { textureRepeat: 5, tubularSegments: 70 }));

    var tailAPts = [
      { x: 0.02, y: centerY - UNIT_H * 0.3, z: 0.01 },
      { x: 0.02, y: botY - 0.1, z: 0.01 },
      { x: 0.03, y: botY - 0.3, z: 0.01 }
    ];
    var tailA = makeRope(tailAPts, COLOR_A, ROPE_RADIUS * 0.85, {
      textureRepeat: 10,
      tubularSegments: 90
    });
    tailA.material.transparent = true;
    tailA.material.opacity = 0.35;
    tailA.material.depthWrite = false;
    add(tailA);

    var tailBPts = [
      { x: -0.02, y: centerY - UNIT_H * 0.5, z: -0.01 },
      { x: -0.02, y: botY - 0.15, z: -0.01 },
      { x: -0.03, y: botY - 0.35, z: -0.01 }
    ];
    var tailB = makeRope(tailBPts, COLOR_B, ROPE_RADIUS * 0.85, {
      textureRepeat: 10,
      tubularSegments: 90
    });
    tailB.material.transparent = true;
    tailB.material.opacity = 0.35;
    tailB.material.depthWrite = false;
    add(tailB);

    var bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.1, 10),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#8B7355'), roughness: 0.6, metalness: 0.15 })
    );
    bar.rotation.z = Math.PI / 2;
    bar.position.y = topY + 0.1;
    add(bar);

    var leftLoopPts = [];
    var loopSegs = 20;
    for (var i = 0; i <= loopSegs; i++) {
      var lt = i / loopSegs;
      var ly = topY - lt * UNIT_H * 0.9;
      var lang = lt * Math.PI;
      var lx = Math.cos(lang + Math.PI) * r * 0.55 + r * 0.1;
      var lz = Math.sin(lang) * r * 0.35;
      leftLoopPts.push({ x: lx, y: ly, z: lz });
    }
    add(makeRope(leftLoopPts, COLOR_A, ROPE_RADIUS * 0.95, {
      textureRepeat: 8,
      tubularSegments: 110,
      tension: 0.3
    }));

    var rightThreadPts = [];
    var threadSegs = 16;
    for (var j = 0; j <= threadSegs; j++) {
      var tt = j / threadSegs;
      var ty = topY - UNIT_H * 0.25 - tt * UNIT_H * 0.65;
      var tang = Math.PI + tt * Math.PI * 0.8;
      var tx = Math.cos(tang) * r * 0.55;
      var tz = Math.sin(tang) * r * 0.35 - zD * 0.3;
      rightThreadPts.push({ x: tx, y: ty, z: tz });
    }
    add(makeRope(rightThreadPts, COLOR_B, ROPE_RADIUS * 0.95, {
      textureRepeat: 8,
      tubularSegments: 110,
      tension: 0.3
    }));

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xff8800, emissiveIntensity: 0.5 })
    );
    arrow.position.set(r * 0.1, centerY - UNIT_H * 0.1, -zD * 0.5);
    arrow.rotation.z = 0.4;
    arrow.rotation.x = -0.3;
    add(arrow);

    add(makeBead(0, botY - 0.45, 0, 0.15));

    return meshes;
  }

  function buildSecondKnot() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var topY = TOP_Y;
    var y1 = topY;
    var y2 = topY - UNIT_H * 1.5;
    var botY = topY - UNIT_COUNT * UNIT_H;
    var r = KNOT_RADIUS;
    var zD = Z_DEPTH;

    var bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.1, 10),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#8B7355'), roughness: 0.6, metalness: 0.15 })
    );
    bar.rotation.z = Math.PI / 2;
    bar.position.y = topY + 0.1;
    add(bar);

    add(makeRope([
      { x: 0.08, y: topY + 0.35, z: 0.04 },
      { x: 0.07, y: topY + 0.1, z: 0.03 },
      { x: r * 0.55, y: topY, z: 0 }
    ], COLOR_A, ROPE_RADIUS * 0.9, { textureRepeat: 5, tubularSegments: 70 }));

    add(makeRope([
      { x: -0.08, y: topY + 0.3, z: -0.04 },
      { x: -0.07, y: topY + 0.05, z: -0.03 },
      { x: -r * 0.55, y: topY - UNIT_H * 0.25, z: 0 }
    ], COLOR_B, ROPE_RADIUS * 0.9, { textureRepeat: 5, tubularSegments: 70 }));

    var pathA1 = buildSnakePath(1, y1, UNIT_H, r, zD, 0);
    var patternA1 = [1, -1];
    var finalA1 = overUnderPts(pathA1, patternA1, zD * 0.55);
    add(makeRope(finalA1, COLOR_A, ROPE_RADIUS * 0.93, {
      textureRepeat: 10,
      tubularSegments: 130,
      tension: 0.3
    }));

    var pathB1 = buildSnakePath(1, y1, UNIT_H, r, zD, Math.PI);
    var patternB1 = [-1, 1];
    var finalB1 = overUnderPts(pathB1, patternB1, zD * 0.55);
    add(makeRope(finalB1, COLOR_B, ROPE_RADIUS * 0.93, {
      textureRepeat: 10,
      tubularSegments: 130,
      tension: 0.3
    }));

    var tailAPts = [
      { x: 0.02, y: y2 - UNIT_H * 0.2, z: 0.01 },
      { x: 0.02, y: botY - 0.1, z: 0.01 },
      { x: 0.03, y: botY - 0.3, z: 0.01 }
    ];
    var tailA = makeRope(tailAPts, COLOR_A, ROPE_RADIUS * 0.85, {
      textureRepeat: 9,
      tubularSegments: 80
    });
    tailA.material.transparent = true;
    tailA.material.opacity = 0.35;
    tailA.material.depthWrite = false;
    add(tailA);

    var tailBPts = [
      { x: -0.02, y: y2 - UNIT_H * 0.4, z: -0.01 },
      { x: -0.02, y: botY - 0.15, z: -0.01 },
      { x: -0.03, y: botY - 0.35, z: -0.01 }
    ];
    var tailB = makeRope(tailBPts, COLOR_B, ROPE_RADIUS * 0.85, {
      textureRepeat: 9,
      tubularSegments: 80
    });
    tailB.material.transparent = true;
    tailB.material.opacity = 0.35;
    tailB.material.depthWrite = false;
    add(tailB);

    var rightLoopPts = [];
    var loopSegs = 20;
    for (var i = 0; i <= loopSegs; i++) {
      var lt = i / loopSegs;
      var ly = y1 - UNIT_H - lt * UNIT_H * 0.9;
      var lang = Math.PI + lt * Math.PI;
      var lx = Math.cos(lang) * r * 0.55 - r * 0.1;
      var lz = Math.sin(lang + Math.PI) * r * 0.35;
      rightLoopPts.push({ x: lx, y: ly, z: lz });
    }
    add(makeRope(rightLoopPts, '#CD853F', ROPE_RADIUS * 0.95, {
      textureRepeat: 8,
      tubularSegments: 110,
      tension: 0.3
    }));

    var leftThreadPts = [];
    var threadSegs = 16;
    for (var j = 0; j <= threadSegs; j++) {
      var tt = j / threadSegs;
      var ty = y1 - UNIT_H * 1.25 - tt * UNIT_H * 0.65;
      var tang = tt * Math.PI * 0.8;
      var tx = Math.cos(tang + Math.PI) * r * 0.55;
      var tz = Math.sin(tang + Math.PI) * r * 0.35 + zD * 0.3;
      leftThreadPts.push({ x: tx, y: ty, z: tz });
    }
    add(makeRope(leftThreadPts, COLOR_A, ROPE_RADIUS * 0.95, {
      textureRepeat: 8,
      tubularSegments: 110,
      tension: 0.3
    }));

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: 0x00eeff, emissive: 0x00aaff, emissiveIntensity: 0.5 })
    );
    arrow.position.set(-r * 0.1, y2 - UNIT_H * 0.05, zD * 0.5);
    arrow.rotation.z = -0.4;
    arrow.rotation.x = 0.3;
    add(arrow);

    add(makeBead(0, botY - 0.45, 0, 0.15));

    return meshes;
  }

  function buildWeave34() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var topY = TOP_Y;
    var botY = topY - UNIT_COUNT * UNIT_H;
    var r = KNOT_RADIUS;
    var zD = Z_DEPTH;
    var weaveUnits = 3;

    var bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.1, 10),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#8B7355'), roughness: 0.6, metalness: 0.15 })
    );
    bar.rotation.z = Math.PI / 2;
    bar.position.y = topY + 0.1;
    add(bar);

    var topTailA = [
      { x: 0.08, y: topY + 0.35, z: 0.04 },
      { x: 0.07, y: topY + 0.1, z: 0.03 },
      { x: r * 0.55, y: topY, z: 0 }
    ];
    add(makeRope(topTailA, COLOR_A, ROPE_RADIUS * 0.9, { textureRepeat: 5, tubularSegments: 70 }));

    var topTailB = [
      { x: -0.08, y: topY + 0.3, z: -0.04 },
      { x: -0.07, y: topY + 0.05, z: -0.03 },
      { x: -r * 0.55, y: topY, z: 0 }
    ];
    add(makeRope(topTailB, COLOR_B, ROPE_RADIUS * 0.9, { textureRepeat: 5, tubularSegments: 70 }));

    var pathA = buildSnakePath(weaveUnits, topY, UNIT_H, r, zD, 0);
    var patternA = [];
    for (var i = 0; i < weaveUnits * 2; i++) {
      patternA.push(i % 2 === 0 ? 1 : -1);
    }
    var finalPathA = overUnderPts(pathA, patternA, zD * 0.55);
    add(makeRope(finalPathA, COLOR_A, ROPE_RADIUS * 0.94, {
      textureRepeat: 14,
      tubularSegments: 180,
      tension: 0.3
    }));

    var pathB = buildSnakePath(weaveUnits, topY, UNIT_H, r, zD, Math.PI);
    var patternB = [];
    for (var j = 0; j < weaveUnits * 2; j++) {
      patternB.push(j % 2 === 0 ? -1 : 1);
    }
    var finalPathB = overUnderPts(pathB, patternB, zD * 0.55);
    add(makeRope(finalPathB, COLOR_B, ROPE_RADIUS * 0.94, {
      textureRepeat: 14,
      tubularSegments: 180,
      tension: 0.3
    }));

    var weaveBotY = topY - weaveUnits * UNIT_H;
    var tailAPts = [
      { x: Math.cos(weaveUnits * Math.PI * 2) * r * 0.55, y: weaveBotY, z: Math.sin(weaveUnits * Math.PI * 2) * r * 0.35 },
      { x: 0.04, y: weaveBotY - 0.1, z: 0.02 },
      { x: 0.03, y: botY - 0.1, z: 0.01 },
      { x: 0.03, y: botY - 0.3, z: 0.01 }
    ];
    var tailA = makeRope(tailAPts, COLOR_A, ROPE_RADIUS * 0.88, {
      textureRepeat: 8,
      tubularSegments: 80
    });
    tailA.material.transparent = true;
    tailA.material.opacity = 0.4;
    tailA.material.depthWrite = false;
    add(tailA);

    var tailBPts = [
      { x: Math.cos(Math.PI + weaveUnits * Math.PI * 2) * r * 0.55, y: weaveBotY, z: Math.sin(Math.PI + weaveUnits * Math.PI * 2) * r * 0.35 },
      { x: -0.04, y: weaveBotY - 0.12, z: -0.02 },
      { x: -0.03, y: botY - 0.15, z: -0.01 },
      { x: -0.03, y: botY - 0.35, z: -0.01 }
    ];
    var tailB = makeRope(tailBPts, COLOR_B, ROPE_RADIUS * 0.88, {
      textureRepeat: 8,
      tubularSegments: 80
    });
    tailB.material.transparent = true;
    tailB.material.opacity = 0.4;
    tailB.material.depthWrite = false;
    add(tailB);

    add(makeBead(0, botY - 0.45, 0, 0.15));

    return meshes;
  }

  function buildWeave56() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var topY = TOP_Y;
    var botY = topY - UNIT_COUNT * UNIT_H;
    var r = KNOT_RADIUS;
    var zD = Z_DEPTH;
    var weaveUnits = 5;

    var bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.1, 10),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#8B7355'), roughness: 0.6, metalness: 0.15 })
    );
    bar.rotation.z = Math.PI / 2;
    bar.position.y = topY + 0.1;
    add(bar);

    var topTailA = [
      { x: 0.08, y: topY + 0.35, z: 0.04 },
      { x: 0.07, y: topY + 0.1, z: 0.03 },
      { x: r * 0.55, y: topY, z: 0 }
    ];
    add(makeRope(topTailA, COLOR_A, ROPE_RADIUS * 0.9, { textureRepeat: 5, tubularSegments: 70 }));

    var topTailB = [
      { x: -0.08, y: topY + 0.3, z: -0.04 },
      { x: -0.07, y: topY + 0.05, z: -0.03 },
      { x: -r * 0.55, y: topY, z: 0 }
    ];
    add(makeRope(topTailB, COLOR_B, ROPE_RADIUS * 0.9, { textureRepeat: 5, tubularSegments: 70 }));

    var pathA = buildSnakePath(weaveUnits, topY, UNIT_H, r, zD, 0);
    var patternA = [];
    for (var i = 0; i < weaveUnits * 2; i++) {
      patternA.push(i % 2 === 0 ? 1 : -1);
    }
    var finalPathA = overUnderPts(pathA, patternA, zD * 0.58);
    add(makeRope(finalPathA, COLOR_A, ROPE_RADIUS * 0.96, {
      textureRepeat: 18,
      tubularSegments: 200,
      tension: 0.3
    }));

    var pathB = buildSnakePath(weaveUnits, topY, UNIT_H, r, zD, Math.PI);
    var patternB = [];
    for (var j = 0; j < weaveUnits * 2; j++) {
      patternB.push(j % 2 === 0 ? -1 : 1);
    }
    var finalPathB = overUnderPts(pathB, patternB, zD * 0.58);
    add(makeRope(finalPathB, COLOR_B, ROPE_RADIUS * 0.96, {
      textureRepeat: 18,
      tubularSegments: 200,
      tension: 0.3
    }));

    var weaveBotY = topY - weaveUnits * UNIT_H;
    var tailAPts = [
      { x: Math.cos(weaveUnits * Math.PI * 2) * r * 0.55, y: weaveBotY, z: Math.sin(weaveUnits * Math.PI * 2) * r * 0.35 },
      { x: 0.04, y: weaveBotY - 0.08, z: 0.02 },
      { x: 0.03, y: botY - 0.08, z: 0.01 },
      { x: 0.03, y: botY - 0.28, z: 0.01 }
    ];
    var tailA = makeRope(tailAPts, COLOR_A, ROPE_RADIUS * 0.88, {
      textureRepeat: 6,
      tubularSegments: 60
    });
    tailA.material.transparent = true;
    tailA.material.opacity = 0.45;
    tailA.material.depthWrite = false;
    add(tailA);

    var tailBPts = [
      { x: Math.cos(Math.PI + weaveUnits * Math.PI * 2) * r * 0.55, y: weaveBotY, z: Math.sin(Math.PI + weaveUnits * Math.PI * 2) * r * 0.35 },
      { x: -0.04, y: weaveBotY - 0.1, z: -0.02 },
      { x: -0.03, y: botY - 0.12, z: -0.01 },
      { x: -0.03, y: botY - 0.32, z: -0.01 }
    ];
    var tailB = makeRope(tailBPts, COLOR_B, ROPE_RADIUS * 0.88, {
      textureRepeat: 6,
      tubularSegments: 60
    });
    tailB.material.transparent = true;
    tailB.material.opacity = 0.45;
    tailB.material.depthWrite = false;
    add(tailB);

    add(makeBead(0, botY - 0.45, 0, 0.15));

    return meshes;
  }

  function buildTighten() {
    return buildFullKnotShape(0.85);
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
      var col = i % 2 === 0 ? COLOR_A : COLOR_B;
      add(makeRope([
        { x: 0, y: tasselTop, z: 0 },
        { x: ex * 0.5, y: tasselTop - 0.2, z: ez * 0.5 },
        { x: ex, y: ey, z: ez }
      ], col, 0.018, { textureRepeat: 2, tubularSegments: 20, useNormalMap: false }));
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

  function animPrepare(onDone) {
    var topY = TOP_Y;
    var botY = topY - UNIT_COUNT * UNIT_H;

    var fullPtsA = [
      { x: 0.08, y: topY + 0.35, z: 0.04 },
      { x: 0.07, y: topY + 0.1, z: 0.03 },
      { x: 0.06, y: topY - 0.05, z: 0.025 },
      { x: 0.05, y: botY + 0.1, z: 0.02 },
      { x: 0.04, y: botY - 0.1, z: 0.015 },
      { x: 0.03, y: botY - 0.3, z: 0.01 }
    ];

    var fullPtsB = [
      { x: -0.08, y: topY + 0.3, z: -0.04 },
      { x: -0.07, y: topY + 0.05, z: -0.03 },
      { x: -0.06, y: topY - 0.1, z: -0.025 },
      { x: -0.05, y: botY + 0.05, z: -0.02 },
      { x: -0.04, y: botY - 0.15, z: -0.015 },
      { x: -0.03, y: botY - 0.35, z: -0.01 }
    ];

    Knots3D.anim.startGrowAnim(2, fullPtsA, COLOR_A, ROPE_RADIUS * 0.9, 800, function () {
      Knots3D.anim.startGrowAnim(2, fullPtsB, COLOR_B, ROPE_RADIUS * 0.9, 800, function () {
        var meshes = buildPrepare();
        Knots3D.anim.recordStepMeshes(2, meshes);
        if (onDone) onDone();
      });
    });
  }

  function animFirstKnot(onDone) {
    var r = KNOT_RADIUS;
    var zD = Z_DEPTH;
    var topY = TOP_Y;

    var leftLoopPts = [];
    var loopSegs = 20;
    for (var i = 0; i <= loopSegs; i++) {
      var lt = i / loopSegs;
      var ly = topY - lt * UNIT_H * 0.9;
      var lang = lt * Math.PI;
      var lx = Math.cos(lang + Math.PI) * r * 0.55 + r * 0.1;
      var lz = Math.sin(lang) * r * 0.35;
      leftLoopPts.push({ x: lx, y: ly, z: lz });
    }

    Knots3D.anim.startGrowAnim(3, leftLoopPts, COLOR_A, ROPE_RADIUS * 0.95, 1000, function () {
      var meshes = buildFirstKnot();
      Knots3D.anim.recordStepMeshes(3, meshes);
      if (onDone) onDone();
    });
  }

  function animSecondKnot(onDone) {
    var r = KNOT_RADIUS;
    var topY = TOP_Y;

    var rightLoopPts = [];
    var loopSegs = 20;
    for (var i = 0; i <= loopSegs; i++) {
      var lt = i / loopSegs;
      var ly = topY - UNIT_H - lt * UNIT_H * 0.9;
      var lang = Math.PI + lt * Math.PI;
      var lx = Math.cos(lang) * r * 0.55 - r * 0.1;
      var lz = Math.sin(lang + Math.PI) * r * 0.35;
      rightLoopPts.push({ x: lx, y: ly, z: lz });
    }

    Knots3D.anim.startGrowAnim(4, rightLoopPts, '#CD853F', ROPE_RADIUS * 0.95, 1000, function () {
      var meshes = buildSecondKnot();
      Knots3D.anim.recordStepMeshes(4, meshes);
      if (onDone) onDone();
    });
  }

  function animWeave34(onDone) {
    var r = KNOT_RADIUS;
    var zD = Z_DEPTH;
    var topY = TOP_Y;
    var weaveUnits = 3;

    var pathA = buildSnakePath(weaveUnits, topY, UNIT_H, r, zD, 0);
    var patternA = [];
    for (var i = 0; i < weaveUnits * 2; i++) {
      patternA.push(i % 2 === 0 ? 1 : -1);
    }
    var fullPts = overUnderPts(pathA, patternA, zD * 0.55);

    Knots3D.anim.startGrowAnim(5, fullPts, COLOR_A, ROPE_RADIUS * 0.94, 1400, function () {
      var meshes = buildWeave34();
      Knots3D.anim.recordStepMeshes(5, meshes);
      if (onDone) onDone();
    });
  }

  function animWeave56(onDone) {
    var r = KNOT_RADIUS;
    var zD = Z_DEPTH;
    var topY = TOP_Y;
    var weaveUnits = 5;

    var pathA = buildSnakePath(weaveUnits, topY, UNIT_H, r, zD, 0);
    var patternA = [];
    for (var i = 0; i < weaveUnits * 2; i++) {
      patternA.push(i % 2 === 0 ? 1 : -1);
    }
    var fullPts = overUnderPts(pathA, patternA, zD * 0.58);

    Knots3D.anim.startGrowAnim(6, fullPts, COLOR_A, ROPE_RADIUS * 0.96, 1600, function () {
      var meshes = buildWeave56();
      Knots3D.anim.recordStepMeshes(6, meshes);
      if (onDone) onDone();
    });
  }

  function buildSheJieShape(t) { return buildFullKnotShape(t); }

  Knots3D.register('she-jie', {
    builders: [
      buildPreview, buildMaterials, buildPrepare, buildFirstKnot, buildSecondKnot,
      buildWeave34, buildWeave56, buildTighten, buildFinal
    ],
    cameras: [
      CAM.preview, CAM.material, CAM.prepare, CAM.first, CAM.second,
      CAM.weave34, CAM.weave56, CAM.tighten, CAM.final
    ],
    anims: { 2: animPrepare, 3: animFirstKnot, 4: animSecondKnot, 5: animWeave34, 6: animWeave56 },
    tightenStep: 7,
    tightenBuilder: buildSheJieShape,
    interactions: { threadStep: 4, tightenStep: 7 }
  });

})();
