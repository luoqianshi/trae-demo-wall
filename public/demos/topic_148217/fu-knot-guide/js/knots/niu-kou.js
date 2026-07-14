/**
 * niu-kou.js - 纽扣结 3D 实现（完全重写版）
 *
 * 核心特性：
 * 1. 真实纽扣结结构：圆球形，三圈堆叠后中心穿线收紧
 * 2. 球面均匀编织纹理，两端线头从中心穿出
 * 3. 主色红色 #C41E3A，整体呈饱满圆球形
 * 4. 9个独立builder展示真实制作递进
 * 5. 使用 startGrowAnim 实现绳子生长动画
 * 6. tightenBuilder 支持收紧交互（tightenStep = 7）
 * 7. 复用 spiralPts、circlePts 等工具函数
 *
 * 步骤：0预览 1材料 2绕第一圈 3绕第二圈 4绕第三圈 5上端穿中心 6下端反向穿 7收紧成球 8收尾定型
 */
(function () {
  'use strict';

  var T = Knots3D.tools;
  var makeRope = T.makeRope;
  var makeBead = T.makeBead;
  var THREE = T.THREE;
  var circlePts = T.circlePts;
  var spiralPts = T.spiralPts;
  var arcPts = T.arcPts;
  var ropeGroup = function () { return Scene3D._.ropeGroup; };

  var ROPE_COLOR = '#C41E3A';
  var ROPE_DARK = '#9C162D';
  var ROPE_LIGHT = '#E83452';
  var GOLD_COLOR = '#DAA520';
  var ROPE_RADIUS = 0.08;
  var KNOT_R = 0.55;
  var LOOP_R = 0.65;

  var CAM = {
    preview:  { pos: { x: 0.3, y: 0.2, z: 4.8 },  target: { x: 0, y: 0, z: 0 } },
    material: { pos: { x: 0, y: 0.2, z: 5.0 },    target: { x: 0, y: 0.1, z: 0 } },
    loop1:    { pos: { x: 0.5, y: 0.3, z: 4.5 },  target: { x: 0.1, y: 0.2, z: 0 } },
    loop2:    { pos: { x: -0.4, y: 0.2, z: 4.5 }, target: { x: -0.1, y: 0.1, z: 0 } },
    loop3:    { pos: { x: 0.3, y: -0.1, z: 4.5 }, target: { x: 0.1, y: -0.1, z: 0 } },
    threadTop:{ pos: { x: 0.2, y: 0.4, z: 4.2 },  target: { x: 0, y: 0.2, z: 0 } },
    threadBot:{ pos: { x: -0.2, y: -0.3, z: 4.2 },target: { x: 0, y: -0.2, z: 0 } },
    tighten:  { pos: { x: 0.3, y: 0.1, z: 4.8 },  target: { x: 0, y: 0, z: 0 } },
    final:    { pos: { x: 0.4, y: 0.2, z: 4.5 },  target: { x: 0, y: 0, z: 0 } }
  };

  function buildSphereWeavePts(r, turns, layers, yOffset, zPhase) {
    yOffset = yOffset || 0;
    zPhase = zPhase || 0;
    var segs = 120;
    var pts = [];
    for (var i = 0; i <= segs; i++) {
      var p = i / segs;
      var ang = p * turns * Math.PI * 2 + zPhase;
      var lat = (p - 0.5) * Math.PI;
      var rScale = Math.cos(lat);
      var x = Math.cos(ang) * r * rScale;
      var y = Math.sin(lat) * r + yOffset;
      var z = Math.sin(ang) * r * rScale;
      pts.push({ x: x, y: y, z: z });
    }
    return pts;
  }

  function buildFlatLoopPts(r, y, zOffset, startAng, endAng, segs) {
    segs = segs || 60;
    var pts = [];
    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var ang = startAng + (endAng - startAng) * t;
      pts.push({
        x: Math.cos(ang) * r,
        y: y,
        z: Math.sin(ang) * r + zOffset
      });
    }
    return pts;
  }

  function buildThreeFlatLoops(r, spacing) {
    spacing = spacing || 0.06;
    var loops = [];
    for (var i = 0; i < 3; i++) {
      var y = (i - 1) * spacing;
      var rScale = 1 - i * 0.03;
      loops.push(buildFlatLoopPts(r * rScale, y, 0, 0, Math.PI * 2, 64));
    }
    return loops;
  }

  function buildFullKnotShape(t) {
    t = Math.max(0, Math.min(1, t || 1));
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var r = KNOT_R * (0.85 + 0.15 * t);

    var weave1 = buildSphereWeavePts(r, 3.2, 1, 0, 0);
    add(makeRope(weave1, ROPE_COLOR, ROPE_RADIUS * 0.98, {
      textureRepeat: 26, tubularSegments: 260, tension: 0.28
    }));

    var weave2 = buildSphereWeavePts(r * 0.94, 3.0, 1, 0, Math.PI * 0.5);
    add(makeRope(weave2, ROPE_DARK, ROPE_RADIUS * 0.94, {
      textureRepeat: 24, tubularSegments: 240, tension: 0.28
    }));

    var weave3 = buildSphereWeavePts(r * 0.89, 2.8, 1, 0, Math.PI);
    add(makeRope(weave3, ROPE_LIGHT, ROPE_RADIUS * 0.90, {
      textureRepeat: 22, tubularSegments: 220, tension: 0.28
    }));

    var weave4 = buildSphereWeavePts(r * 0.84, 2.6, 1, 0, Math.PI * 1.5);
    add(makeRope(weave4, ROPE_COLOR, ROPE_RADIUS * 0.86, {
      textureRepeat: 20, tubularSegments: 200, tension: 0.28
    }));

    var topPts = [
      { x: 0.02, y: r * 1.08, z: 0.01 },
      { x: 0.01, y: r * 0.95, z: 0.005 },
      { x: 0, y: r * 0.82, z: 0 }
    ];
    add(makeRope(topPts, ROPE_COLOR, ROPE_RADIUS * 0.85, {
      textureRepeat: 5, tubularSegments: 60, tension: 0.3
    }));

    var botPts = [
      { x: -0.015, y: -r * 0.85, z: -0.01 },
      { x: -0.025, y: -r * 1.0, z: -0.015 },
      { x: -0.03, y: -r * 1.15, z: -0.02 }
    ];
    add(makeRope(botPts, ROPE_DARK, ROPE_RADIUS * 0.85, {
      textureRepeat: 5, tubularSegments: 60, tension: 0.3
    }));

    add(makeBead(0, -r * 1.35, 0, 0.11));

    return meshes;
  }

  function buildPreview() {
    return buildFullKnotShape(1.0);
  }

  function buildMaterials() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var c1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.09, 12, 30),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(ROPE_COLOR), roughness: 0.38, metalness: 0.06 })
    );
    c1.position.set(-1.0, 0.4, 0);
    c1.rotation.x = Math.PI / 2;
    c1.castShadow = true;
    add(c1);

    add(makeRope([
      { x: -0.6, y: 0.08, z: 0.06 },
      { x: 0, y: 0.12, z: 0.08 },
      { x: 0.6, y: 0.06, z: 0.05 }
    ], ROPE_COLOR, 0.07, { textureRepeat: 6 }));

    var btn = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 20, 16),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(ROPE_COLOR), roughness: 0.5 })
    );
    btn.position.set(1.0, 0.25, 0.1);
    add(btn);

    var pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 })
    );
    pin.position.set(0.75, 0.35, 0.18);
    pin.rotation.z = 0.3;
    add(pin);
    var pin2 = pin.clone();
    pin2.position.set(0.88, 0.3, 0.12);
    pin2.rotation.z = -0.2;
    add(pin2);

    var sc1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 })
    );
    sc1.position.set(0.85, -0.25, 0.18);
    sc1.rotation.z = 0.3;
    add(sc1);
    var sc2 = sc1.clone();
    sc2.rotation.z = -0.3;
    add(sc2);

    var lighter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.07, 0.3, 10),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#333333'), roughness: 0.5, metalness: 0.3 })
    );
    lighter.position.set(-0.9, -0.3, 0.12);
    add(lighter);

    add(makeBead(1.0, -0.15, -0.05, 0.1));

    return meshes;
  }

  function buildLoop1() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var r = LOOP_R;

    var loopPts1 = buildFlatLoopPts(r, 0.08, 0, -Math.PI * 0.3, Math.PI * 1.8, 60);
    add(makeRope(loopPts1, ROPE_COLOR, ROPE_RADIUS, {
      textureRepeat: 12, tubularSegments: 150, tension: 0.3
    }));

    var tailRight = [
      { x: Math.cos(-Math.PI * 0.3) * r, y: 0.08, z: Math.sin(-Math.PI * 0.3) * r },
      { x: Math.cos(-Math.PI * 0.4) * r * 1.2, y: 0.06, z: Math.sin(-Math.PI * 0.4) * r * 1.2 },
      { x: Math.cos(-Math.PI * 0.5) * r * 1.4, y: 0.04, z: Math.sin(-Math.PI * 0.5) * r * 1.4 }
    ];
    add(makeRope(tailRight, ROPE_COLOR, ROPE_RADIUS * 0.95, {
      textureRepeat: 5, tubularSegments: 60, tension: 0.3
    }));

    var tailLeft = [
      { x: Math.cos(Math.PI * 1.8) * r, y: 0.08, z: Math.sin(Math.PI * 1.8) * r },
      { x: Math.cos(Math.PI * 1.9) * r * 1.15, y: 0.07, z: Math.sin(Math.PI * 1.9) * r * 1.15 },
      { x: Math.cos(Math.PI * 2.0) * r * 1.3, y: 0.05, z: Math.sin(Math.PI * 2.0) * r * 1.3 }
    ];
    add(makeRope(tailLeft, ROPE_DARK, ROPE_RADIUS * 0.95, {
      textureRepeat: 5, tubularSegments: 60, tension: 0.3
    }));

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xff8800, emissiveIntensity: 0.5 })
    );
    arrow.position.set(r * 0.6, 0.25, r * 0.5);
    arrow.rotation.x = -0.8;
    arrow.rotation.y = -0.5;
    add(arrow);

    return meshes;
  }

  function buildLoop2() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var r = LOOP_R;
    var spacing = 0.06;

    var loop1 = buildFlatLoopPts(r * 0.99, -spacing * 0.5, 0, 0, Math.PI * 2, 64);
    add(makeRope(loop1, ROPE_COLOR, ROPE_RADIUS * 0.98, {
      textureRepeat: 12, tubularSegments: 150, tension: 0.28
    }));

    var loop2Pts = buildFlatLoopPts(r * 0.96, spacing * 0.5, 0, -Math.PI * 0.2, Math.PI * 1.9, 60);
    add(makeRope(loop2Pts, ROPE_LIGHT, ROPE_RADIUS, {
      textureRepeat: 12, tubularSegments: 150, tension: 0.3
    }));

    var tailRight = [
      { x: Math.cos(-Math.PI * 0.2) * r * 0.96, y: spacing * 0.5, z: Math.sin(-Math.PI * 0.2) * r * 0.96 },
      { x: Math.cos(-Math.PI * 0.35) * r * 1.15, y: spacing * 0.4, z: Math.sin(-Math.PI * 0.35) * r * 1.15 },
      { x: Math.cos(-Math.PI * 0.5) * r * 1.35, y: spacing * 0.25, z: Math.sin(-Math.PI * 0.5) * r * 1.35 }
    ];
    add(makeRope(tailRight, ROPE_LIGHT, ROPE_RADIUS * 0.95, {
      textureRepeat: 5, tubularSegments: 60, tension: 0.3
    }));

    var tailLeft = [
      { x: Math.cos(Math.PI * 1.9) * r * 0.96, y: spacing * 0.5, z: Math.sin(Math.PI * 1.9) * r * 0.96 },
      { x: Math.cos(Math.PI * 2.0) * r * 1.12, y: spacing * 0.4, z: Math.sin(Math.PI * 2.0) * r * 1.12 },
      { x: Math.cos(Math.PI * 2.1) * r * 1.28, y: spacing * 0.25, z: Math.sin(Math.PI * 2.1) * r * 1.28 }
    ];
    add(makeRope(tailLeft, ROPE_DARK, ROPE_RADIUS * 0.95, {
      textureRepeat: 5, tubularSegments: 60, tension: 0.3
    }));

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: 0x00eeff, emissive: 0x00aaff, emissiveIntensity: 0.5 })
    );
    arrow.position.set(-r * 0.5, 0.28, -r * 0.4);
    arrow.rotation.x = 0.8;
    arrow.rotation.y = 0.6;
    add(arrow);

    return meshes;
  }

  function buildLoop3() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var r = LOOP_R;
    var spacing = 0.055;

    var loop1 = buildFlatLoopPts(r * 0.99, -spacing, 0, 0, Math.PI * 2, 64);
    add(makeRope(loop1, ROPE_COLOR, ROPE_RADIUS * 0.97, {
      textureRepeat: 12, tubularSegments: 140, tension: 0.28
    }));

    var loop2 = buildFlatLoopPts(r * 0.96, 0, 0, 0, Math.PI * 2, 64);
    add(makeRope(loop2, ROPE_LIGHT, ROPE_RADIUS * 0.95, {
      textureRepeat: 12, tubularSegments: 140, tension: 0.28
    }));

    var loop3Pts = buildFlatLoopPts(r * 0.93, spacing, 0, -Math.PI * 0.15, Math.PI * 1.95, 60);
    add(makeRope(loop3Pts, ROPE_DARK, ROPE_RADIUS, {
      textureRepeat: 12, tubularSegments: 150, tension: 0.3
    }));

    var tailTop = [
      { x: Math.cos(-Math.PI * 0.15) * r * 0.93, y: spacing, z: Math.sin(-Math.PI * 0.15) * r * 0.93 },
      { x: Math.cos(-Math.PI * 0.25) * r * 1.1, y: spacing * 0.85, z: Math.sin(-Math.PI * 0.25) * r * 1.1 },
      { x: Math.cos(-Math.PI * 0.35) * r * 1.28, y: spacing * 0.65, z: Math.sin(-Math.PI * 0.35) * r * 1.28 }
    ];
    add(makeRope(tailTop, ROPE_DARK, ROPE_RADIUS * 0.95, {
      textureRepeat: 5, tubularSegments: 60, tension: 0.3
    }));

    var tailBot = [
      { x: Math.cos(Math.PI * 1.95) * r * 0.93, y: spacing, z: Math.sin(Math.PI * 1.95) * r * 0.93 },
      { x: Math.cos(Math.PI * 2.05) * r * 1.08, y: spacing * 0.8, z: Math.sin(Math.PI * 2.05) * r * 1.08 },
      { x: Math.cos(Math.PI * 2.15) * r * 1.25, y: spacing * 0.6, z: Math.sin(Math.PI * 2.15) * r * 1.25 }
    ];
    add(makeRope(tailBot, ROPE_COLOR, ROPE_RADIUS * 0.95, {
      textureRepeat: 5, tubularSegments: 60, tension: 0.3
    }));

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: 0xff88ff, emissive: 0xff00ff, emissiveIntensity: 0.4 })
    );
    arrow.position.set(r * 0.45, 0.3, r * 0.55);
    arrow.rotation.x = -0.7;
    arrow.rotation.y = -0.4;
    add(arrow);

    return meshes;
  }

  function buildThreadTop() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var r = LOOP_R * 0.92;
    var spacing = 0.05;

    var loop1 = buildFlatLoopPts(r * 0.99, -spacing, 0, 0, Math.PI * 2, 64);
    add(makeRope(loop1, ROPE_COLOR, ROPE_RADIUS * 0.96, {
      textureRepeat: 11, tubularSegments: 130, tension: 0.28
    }));

    var loop2 = buildFlatLoopPts(r * 0.96, 0, 0, 0, Math.PI * 2, 64);
    add(makeRope(loop2, ROPE_LIGHT, ROPE_RADIUS * 0.94, {
      textureRepeat: 11, tubularSegments: 130, tension: 0.28
    }));

    var loop3 = buildFlatLoopPts(r * 0.93, spacing, 0, 0, Math.PI * 2, 64);
    add(makeRope(loop3, ROPE_DARK, ROPE_RADIUS * 0.92, {
      textureRepeat: 11, tubularSegments: 130, tension: 0.28
    }));

    var threadPts = [
      { x: -0.15, y: r * 0.9, z: 0.1 },
      { x: -0.08, y: r * 0.7, z: 0.06 },
      { x: -0.04, y: r * 0.5, z: 0.03 },
      { x: -0.02, y: r * 0.3, z: 0.015 },
      { x: -0.01, y: r * 0.1, z: 0.008 },
      { x: 0, y: 0, z: 0 },
      { x: 0.005, y: -r * 0.15, z: -0.005 },
      { x: 0.01, y: -r * 0.3, z: -0.01 }
    ];
    add(makeRope(threadPts, ROPE_LIGHT, ROPE_RADIUS * 0.85, {
      textureRepeat: 8, tubularSegments: 100, tension: 0.3
    }));

    var tailTop = [
      { x: -0.15, y: r * 0.9, z: 0.1 },
      { x: -0.25, y: r * 1.05, z: 0.15 },
      { x: -0.38, y: r * 1.15, z: 0.2 }
    ];
    add(makeRope(tailTop, ROPE_LIGHT, ROPE_RADIUS * 0.9, {
      textureRepeat: 4, tubularSegments: 50, tension: 0.3
    }));

    var tailBotRight = [
      { x: r * 0.95, y: spacing * 1.2, z: 0.1 },
      { x: r * 1.1, y: spacing * 0.9, z: 0.08 },
      { x: r * 1.25, y: spacing * 0.5, z: 0.05 }
    ];
    add(makeRope(tailBotRight, ROPE_COLOR, ROPE_RADIUS * 0.9, {
      textureRepeat: 4, tubularSegments: 50, tension: 0.3
    }));

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.05, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0x88ff88, emissive: 0x00ff00, emissiveIntensity: 0.5 })
    );
    arrow.position.set(-0.03, r * 0.6, 0.04);
    arrow.rotation.x = 2.8;
    add(arrow);

    return meshes;
  }

  function buildThreadBottom() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var r = LOOP_R * 0.90;
    var spacing = 0.048;

    var loop1 = buildFlatLoopPts(r * 0.99, -spacing, 0, 0, Math.PI * 2, 64);
    add(makeRope(loop1, ROPE_COLOR, ROPE_RADIUS * 0.95, {
      textureRepeat: 11, tubularSegments: 130, tension: 0.28
    }));

    var loop2 = buildFlatLoopPts(r * 0.96, 0, 0, 0, Math.PI * 2, 64);
    add(makeRope(loop2, ROPE_LIGHT, ROPE_RADIUS * 0.93, {
      textureRepeat: 11, tubularSegments: 130, tension: 0.28
    }));

    var loop3 = buildFlatLoopPts(r * 0.93, spacing, 0, 0, Math.PI * 2, 64);
    add(makeRope(loop3, ROPE_DARK, ROPE_RADIUS * 0.91, {
      textureRepeat: 11, tubularSegments: 130, tension: 0.28
    }));

    var threadTopPts = [
      { x: -0.1, y: r * 0.85, z: 0.08 },
      { x: -0.05, y: r * 0.6, z: 0.04 },
      { x: -0.02, y: r * 0.35, z: 0.02 },
      { x: -0.01, y: r * 0.15, z: 0.01 },
      { x: 0, y: 0, z: 0 },
      { x: 0.005, y: -r * 0.2, z: -0.005 },
      { x: 0.01, y: -r * 0.4, z: -0.01 }
    ];
    add(makeRope(threadTopPts, ROPE_LIGHT, ROPE_RADIUS * 0.82, {
      textureRepeat: 7, tubularSegments: 90, tension: 0.3
    }));

    var threadBotPts = [
      { x: 0.08, y: -r * 0.8, z: -0.06 },
      { x: 0.05, y: -r * 0.6, z: -0.04 },
      { x: 0.025, y: -r * 0.4, z: -0.02 },
      { x: 0.01, y: -r * 0.2, z: -0.01 },
      { x: 0.005, y: 0, z: 0 },
      { x: 0, y: r * 0.15, z: 0.005 },
      { x: -0.005, y: r * 0.3, z: 0.01 }
    ];
    add(makeRope(threadBotPts, ROPE_DARK, ROPE_RADIUS * 0.82, {
      textureRepeat: 7, tubularSegments: 90, tension: 0.3
    }));

    var tailTop = [
      { x: -0.1, y: r * 0.85, z: 0.08 },
      { x: -0.2, y: r * 1.0, z: 0.12 },
      { x: -0.32, y: r * 1.12, z: 0.18 }
    ];
    add(makeRope(tailTop, ROPE_LIGHT, ROPE_RADIUS * 0.88, {
      textureRepeat: 4, tubularSegments: 50, tension: 0.3
    }));

    var tailBot = [
      { x: 0.08, y: -r * 0.8, z: -0.06 },
      { x: 0.18, y: -r * 0.95, z: -0.1 },
      { x: 0.3, y: -r * 1.08, z: -0.15 }
    ];
    add(makeRope(tailBot, ROPE_DARK, ROPE_RADIUS * 0.88, {
      textureRepeat: 4, tubularSegments: 50, tension: 0.3
    }));

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.05, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0xffaa44, emissive: 0xff6600, emissiveIntensity: 0.5 })
    );
    arrow.position.set(0.04, -r * 0.55, -0.04);
    arrow.rotation.x = 0.3;
    add(arrow);

    return meshes;
  }

  function buildTighten(t) {
    t = Math.max(0, Math.min(1, t || 0.5));
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var rFlat = LOOP_R * 0.88;
    var rSphere = KNOT_R;
    var spacingFlat = 0.045;
    var et = 1 - Math.cos(t * Math.PI * 0.5);

    var r = rFlat + (rSphere - rFlat) * et;
    var ySpread = spacingFlat * (1 - et) + rSphere * 0.15 * et;

    function morphLoop(loopIdx, tVal) {
      var flatY = (loopIdx - 1) * spacingFlat;
      var rScaleFlat = 1 - loopIdx * 0.03;
      var segs = 80;
      var pts = [];
      for (var i = 0; i <= segs; i++) {
        var p = i / segs;
        var ang = p * Math.PI * 2 + loopIdx * 0.3;

        var flatX = Math.cos(ang) * rFlat * rScaleFlat;
        var flatYPos = flatY;
        var flatZ = Math.sin(ang) * rFlat * rScaleFlat;

        var lat = (p - 0.5) * Math.PI + loopIdx * 0.2;
        var rScale = Math.cos(lat);
        var sphereX = Math.cos(ang + loopIdx * 0.5) * rSphere * rScale * (0.95 - loopIdx * 0.05);
        var sphereY = Math.sin(lat) * rSphere * (0.95 - loopIdx * 0.03);
        var sphereZ = Math.sin(ang + loopIdx * 0.5) * rSphere * rScale * (0.95 - loopIdx * 0.05);

        pts.push({
          x: flatX + (sphereX - flatX) * tVal,
          y: flatYPos + (sphereY - flatYPos) * tVal,
          z: flatZ + (sphereZ - flatZ) * tVal
        });
      }
      return pts;
    }

    add(makeRope(morphLoop(0, et), ROPE_COLOR, ROPE_RADIUS * (0.95 + 0.03 * et), {
      textureRepeat: 12 + 10 * et, tubularSegments: 140 + 80 * et, tension: 0.3 - 0.1 * et
    }));

    add(makeRope(morphLoop(1, et), ROPE_LIGHT, ROPE_RADIUS * (0.93 + 0.02 * et), {
      textureRepeat: 11 + 10 * et, tubularSegments: 130 + 80 * et, tension: 0.3 - 0.1 * et
    }));

    add(makeRope(morphLoop(2, et), ROPE_DARK, ROPE_RADIUS * (0.91 + 0.01 * et), {
      textureRepeat: 10 + 10 * et, tubularSegments: 120 + 80 * et, tension: 0.3 - 0.1 * et
    }));

    var topYFlat = ySpread;
    var topYSphere = rSphere * 1.05;
    var botYFlat = -ySpread;
    var botYSphere = -rSphere * 1.05;

    var topEndY = topYFlat + (topYSphere - topYFlat) * et;
    var botEndY = botYFlat + (botYSphere - botYFlat) * et;

    var topThreadPts = [
      { x: -0.08 + 0.06 * et, y: topEndY * 0.85, z: 0.06 - 0.04 * et },
      { x: -0.04 + 0.03 * et, y: topEndY * 0.55, z: 0.03 - 0.02 * et },
      { x: -0.02 + 0.015 * et, y: topEndY * 0.3, z: 0.015 - 0.01 * et },
      { x: -0.01 + 0.01 * et, y: topEndY * 0.12, z: 0.008 - 0.005 * et },
      { x: 0, y: 0, z: 0 }
    ];
    add(makeRope(topThreadPts, ROPE_LIGHT, ROPE_RADIUS * (0.8 + 0.05 * et), {
      textureRepeat: 6 + 2 * et, tubularSegments: 70 + 30 * et, tension: 0.3
    }));

    var botThreadPts = [
      { x: 0.07 - 0.05 * et, y: botEndY * 0.8, z: -0.05 + 0.03 * et },
      { x: 0.035 - 0.025 * et, y: botEndY * 0.5, z: -0.025 + 0.015 * et },
      { x: 0.02 - 0.015 * et, y: botEndY * 0.25, z: -0.015 + 0.01 * et },
      { x: 0.01 - 0.01 * et, y: botEndY * 0.1, z: -0.008 + 0.005 * et },
      { x: 0, y: 0, z: 0 }
    ];
    add(makeRope(botThreadPts, ROPE_DARK, ROPE_RADIUS * (0.8 + 0.05 * et), {
      textureRepeat: 6 + 2 * et, tubularSegments: 70 + 30 * et, tension: 0.3
    }));

    var topTailPts = [
      { x: -0.08 + 0.06 * et, y: topEndY * 0.85, z: 0.06 - 0.04 * et },
      { x: -0.16 + 0.08 * et, y: topEndY * 1.05, z: 0.1 - 0.05 * et },
      { x: -0.26 + 0.1 * et, y: topEndY * 1.2, z: 0.15 - 0.06 * et }
    ];
    add(makeRope(topTailPts, ROPE_LIGHT, ROPE_RADIUS * (0.85 + 0.05 * et), {
      textureRepeat: 3 + et, tubularSegments: 40 + 20 * et, tension: 0.3
    }));

    var botTailPts = [
      { x: 0.07 - 0.05 * et, y: botEndY * 0.8, z: -0.05 + 0.03 * et },
      { x: 0.14 - 0.07 * et, y: botEndY * 1.0, z: -0.08 + 0.04 * et },
      { x: 0.24 - 0.09 * et, y: botEndY * 1.18, z: -0.12 + 0.05 * et }
    ];
    add(makeRope(botTailPts, ROPE_DARK, ROPE_RADIUS * (0.85 + 0.05 * et), {
      textureRepeat: 3 + et, tubularSegments: 40 + 20 * et, tension: 0.3
    }));

    if (et > 0.7) {
      var beadT = (et - 0.7) / 0.3;
      add(makeBead(0, botEndY * 1.35 * beadT, 0, 0.1 * beadT + 0.02));
    }

    return meshes;
  }

  function buildTightenDefault() {
    return buildTighten(0.6);
  }

  function buildFinal() {
    var meshes = buildFullKnotShape(1.0);
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var r = KNOT_R;

    var burnTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 10, 8),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#3a1a1a'), roughness: 0.8 })
    );
    burnTop.position.set(0.015, r * 1.08, 0.01);
    add(burnTop);

    var charm = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.025, 8, 16),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#FFD700'), roughness: 0.25, metalness: 0.7, emissive: new THREE.Color('#FFA500'), emissiveIntensity: 0.25 })
    );
    charm.position.set(0.5, 0.35, 0.2);
    charm.rotation.x = Math.PI / 3;
    add(charm);

    return meshes;
  }

  function animLoop1(onDone) {
    var r = LOOP_R;
    var fullPts = buildFlatLoopPts(r, 0.08, 0, -Math.PI * 0.3, Math.PI * 1.8, 60);

    Knots3D.anim.startGrowAnim(2, fullPts, ROPE_COLOR, ROPE_RADIUS, 1400, function () {
      var meshes = buildLoop1();
      Knots3D.anim.recordStepMeshes(2, meshes);
      if (onDone) onDone();
    });
  }

  function animLoop2(onDone) {
    var r = LOOP_R;
    var spacing = 0.06;
    var fullPts = buildFlatLoopPts(r * 0.96, spacing * 0.5, 0, -Math.PI * 0.2, Math.PI * 1.9, 60);

    Knots3D.anim.startGrowAnim(3, fullPts, ROPE_LIGHT, ROPE_RADIUS, 1400, function () {
      var meshes = buildLoop2();
      Knots3D.anim.recordStepMeshes(3, meshes);
      if (onDone) onDone();
    });
  }

  function animLoop3(onDone) {
    var r = LOOP_R;
    var spacing = 0.055;
    var fullPts = buildFlatLoopPts(r * 0.93, spacing, 0, -Math.PI * 0.15, Math.PI * 1.95, 60);

    Knots3D.anim.startGrowAnim(4, fullPts, ROPE_DARK, ROPE_RADIUS, 1500, function () {
      var meshes = buildLoop3();
      Knots3D.anim.recordStepMeshes(4, meshes);
      if (onDone) onDone();
    });
  }

  function animThreadTop(onDone) {
    var r = LOOP_R * 0.92;
    var threadPts = [
      { x: -0.15, y: r * 0.9, z: 0.1 },
      { x: -0.08, y: r * 0.7, z: 0.06 },
      { x: -0.04, y: r * 0.5, z: 0.03 },
      { x: -0.02, y: r * 0.3, z: 0.015 },
      { x: -0.01, y: r * 0.1, z: 0.008 },
      { x: 0, y: 0, z: 0 },
      { x: 0.005, y: -r * 0.15, z: -0.005 },
      { x: 0.01, y: -r * 0.3, z: -0.01 }
    ];

    Knots3D.anim.startGrowAnim(5, threadPts, ROPE_LIGHT, ROPE_RADIUS * 0.85, 1600, function () {
      var meshes = buildThreadTop();
      Knots3D.anim.recordStepMeshes(5, meshes);
      if (onDone) onDone();
    });
  }

  function animThreadBottom(onDone) {
    var r = LOOP_R * 0.90;
    var threadBotPts = [
      { x: 0.08, y: -r * 0.8, z: -0.06 },
      { x: 0.05, y: -r * 0.6, z: -0.04 },
      { x: 0.025, y: -r * 0.4, z: -0.02 },
      { x: 0.01, y: -r * 0.2, z: -0.01 },
      { x: 0.005, y: 0, z: 0 },
      { x: 0, y: r * 0.15, z: 0.005 },
      { x: -0.005, y: r * 0.3, z: 0.01 }
    ];

    Knots3D.anim.startGrowAnim(6, threadBotPts, ROPE_DARK, ROPE_RADIUS * 0.82, 1600, function () {
      var meshes = buildThreadBottom();
      Knots3D.anim.recordStepMeshes(6, meshes);
      if (onDone) onDone();
    });
  }

  function buildNiuKouShape(t) { return buildTighten(t); }

  Knots3D.register('niu-kou', {
    builders: [
      buildPreview, buildMaterials, buildLoop1, buildLoop2, buildLoop3,
      buildThreadTop, buildThreadBottom, buildTightenDefault, buildFinal
    ],
    cameras: [
      CAM.preview, CAM.material, CAM.loop1, CAM.loop2, CAM.loop3,
      CAM.threadTop, CAM.threadBot, CAM.tighten, CAM.final
    ],
    anims: { 2: animLoop1, 3: animLoop2, 4: animLoop3, 5: animThreadTop, 6: animThreadBottom },
    tightenStep: 7,
    tightenBuilder: buildNiuKouShape,
    interactions: { threadStep: 5, tightenStep: 7 }
  });

})();
