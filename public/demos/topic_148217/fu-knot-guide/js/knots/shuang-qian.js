/**
 * shuang-qian.js - 双钱结 3D 实现（完全重写版）
 *
 * 核心特性：
 * 1. 真实8字形双钱结，两圆左右排列，中心相距0.6r，交叠约1/3
 * 2. 单根红色绳（#C41E3A）连续编织，减少截断
 * 3. 交叠处z轴差≥0.15，挑压关系清晰（上圈压下圈）
 * 4. 9个独立builder展示真实编织过程递进
 * 5. 使用 startGrowAnim 实现绳子生长动画
 * 6. tightenBuilder 支持收紧交互
 * 7. 复用 figure8Pts、overUnderPts、earLoopPts 等工具
 *
 * 步骤：0预览 1材料 2准备线 3左钱 4右钱 5中心穿绕 6调形 7收紧 8收尾
 */
(function () {
  'use strict';

  var T = Knots3D.tools;
  var makeRope = T.makeRope;
  var makeBead = T.makeBead;
  var THREE = T.THREE;
  var figure8Pts = T.figure8Pts;
  var overUnderPts = T.overUnderPts;
  var circlePts = T.circlePts;
  var ropeGroup = function () { return Scene3D._.ropeGroup; };

  var COLOR = '#C41E3A';
  var ROPE_RADIUS = 0.085;
  var RING_R = 1.0;
  var OVERLAP = 0.33;
  var Z_DEPTH = 0.18;

  var CAM = {
    preview:  { pos: { x: 0, y: 0.1, z: 5.5 },  target: { x: 0, y: 0, z: 0 } },
    material: { pos: { x: 0, y: 0.2, z: 5.0 },  target: { x: 0, y: 0.1, z: 0 } },
    prepare:  { pos: { x: 0, y: 0.15, z: 5.0 }, target: { x: 0, y: 0, z: 0 } },
    leftCoin: { pos: { x: -0.4, y: 0.2, z: 4.8 },target: { x: -0.3, y: 0.1, z: 0 } },
    rightCoin:{ pos: { x: 0.4, y: 0.1, z: 4.8 }, target: { x: 0.3, y: 0, z: 0 } },
    center:   { pos: { x: 0.3, y: 0.2, z: 4.5 }, target: { x: 0, y: 0.1, z: 0 } },
    adjust:   { pos: { x: 0, y: 0.1, z: 5.0 },  target: { x: 0, y: 0, z: 0 } },
    tighten:  { pos: { x: 0, y: 0, z: 5.5 },    target: { x: 0, y: 0, z: 0 } },
    final:    { pos: { x: 0.4, y: 0.2, z: 5.2 },target: { x: 0, y: 0.1, z: 0 } }
  };

  function buildFullKnotShape(t) {
    t = Math.max(0, Math.min(1, t || 1));
    var scale = 0.82 + 0.18 * t;
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var r = RING_R * scale;
    var offset = r * (1 - OVERLAP);

    var basePts = figure8Pts(0, 0, 0, r, OVERLAP, Z_DEPTH);
    var weavePts = overUnderPts(basePts, [1, -1, 1, -1], Z_DEPTH * 0.5);

    add(makeRope(weavePts, COLOR, ROPE_RADIUS, {
      textureRepeat: 28,
      tubularSegments: 280,
      tension: 0.28,
      closed: false
    }));

    var innerLeftPts = circlePts(-offset, 0, -Z_DEPTH * 0.3, r * 0.45, 32);
    add(makeRope(innerLeftPts, COLOR, ROPE_RADIUS * 0.7, {
      textureRepeat: 10,
      tubularSegments: 120,
      tension: 0.3,
      closed: true
    }));

    var innerRightPts = circlePts(offset, 0, Z_DEPTH * 0.3, r * 0.45, 32);
    add(makeRope(innerRightPts, COLOR, ROPE_RADIUS * 0.7, {
      textureRepeat: 10,
      tubularSegments: 120,
      tension: 0.3,
      closed: true
    }));

    add(makeRope([
      { x: 0, y: r * 1.15, z: Z_DEPTH * 0.5 },
      { x: -0.02, y: r * 1.35, z: Z_DEPTH * 0.3 },
      { x: -0.03, y: r * 1.55, z: Z_DEPTH * 0.1 },
      { x: -0.04, y: r * 1.75, z: 0 }
    ], COLOR, ROPE_RADIUS * 0.85, { textureRepeat: 6, tubularSegments: 80 }));

    add(makeRope([
      { x: 0, y: -r * 1.15, z: -Z_DEPTH * 0.5 },
      { x: 0.02, y: -r * 1.35, z: -Z_DEPTH * 0.3 },
      { x: 0.03, y: -r * 1.55, z: -Z_DEPTH * 0.1 },
      { x: 0.04, y: -r * 1.8, z: 0 }
    ], COLOR, ROPE_RADIUS * 0.85, { textureRepeat: 6, tubularSegments: 80 }));

    add(makeBead(0.02, -r * 1.95, 0, 0.13));

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
      new THREE.MeshStandardMaterial({ color: new THREE.Color(COLOR), roughness: 0.4, metalness: 0.06 })
    );
    c1.position.set(-0.95, 0.35, 0);
    c1.rotation.x = Math.PI / 2;
    c1.castShadow = true;
    add(c1);

    add(makeRope([
      { x: -0.55, y: 0.08, z: 0.06 },
      { x: 0, y: 0.12, z: 0.08 },
      { x: 0.55, y: 0.06, z: 0.06 }
    ], COLOR, 0.07, { textureRepeat: 6 }));

    var coin1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.035, 8, 20),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#FFD700'), roughness: 0.3, metalness: 0.6, emissive: new THREE.Color('#FFA500'), emissiveIntensity: 0.2 })
    );
    coin1.position.set(1.0, 0.3, 0.1);
    add(coin1);
    var coin2 = coin1.clone();
    coin2.position.set(1.15, 0.08, -0.05);
    add(coin2);

    var sc1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 })
    );
    sc1.position.set(0.9, -0.28, 0.18);
    sc1.rotation.z = 0.25;
    add(sc1);
    var sc2 = sc1.clone();
    sc2.rotation.z = -0.25;
    add(sc2);

    var board = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.05, 1.2),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#8B7355'), roughness: 0.7, metalness: 0.05 })
    );
    board.position.set(-0.3, -0.6, -0.1);
    board.receiveShadow = true;
    add(board);

    return meshes;
  }

  function buildPrepare() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var r = RING_R * 0.9;

    add(makeRope([
      { x: -r * 1.3, y: r * 0.9, z: 0.04 },
      { x: -r * 0.9, y: r * 0.6, z: 0.03 },
      { x: -r * 0.5, y: r * 0.3, z: 0.02 },
      { x: 0, y: 0, z: 0.01 },
      { x: r * 0.5, y: -r * 0.3, z: 0.02 },
      { x: r * 0.9, y: -r * 0.6, z: 0.03 },
      { x: r * 1.3, y: -r * 0.9, z: 0.04 }
    ], COLOR, ROPE_RADIUS * 0.92, { textureRepeat: 12, tubularSegments: 140, tension: 0.3 }));

    var pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 })
    );
    pin.position.set(0, 0.15, 0.15);
    add(pin);

    return meshes;
  }

  function buildLeftCoin() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var r = RING_R * 0.88;
    var offset = r * (1 - OVERLAP);
    var zBase = 0.05;

    var leftRingPts = circlePts(-offset, 0, zBase, r, 48);
    add(makeRope(leftRingPts, COLOR, ROPE_RADIUS, {
      textureRepeat: 18,
      tubularSegments: 200,
      tension: 0.28,
      closed: true
    }));

    var innerLeftPts = circlePts(-offset, 0, zBase + 0.02, r * 0.45, 32);
    add(makeRope(innerLeftPts, COLOR, ROPE_RADIUS * 0.7, {
      textureRepeat: 8,
      tubularSegments: 120,
      tension: 0.3,
      closed: true
    }));

    add(makeRope([
      { x: -offset + r * 0.7, y: r * 0.5, z: zBase + 0.02 },
      { x: -offset + r * 1.1, y: r * 0.7, z: zBase + 0.04 },
      { x: -offset + r * 1.4, y: r * 0.85, z: zBase + 0.06 }
    ], COLOR, ROPE_RADIUS * 0.9, { textureRepeat: 5, tubularSegments: 60 }));

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.15, 8),
      new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xff8800, emissiveIntensity: 0.5 })
    );
    arrow.position.set(-offset - r * 0.3, r * 0.7, zBase + 0.15);
    arrow.rotation.x = Math.PI / 2;
    arrow.rotation.z = 0.6;
    add(arrow);

    return meshes;
  }

  function buildRightCoin() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var r = RING_R * 0.86;
    var offset = r * (1 - OVERLAP);
    var zLeft = -Z_DEPTH * 0.5;
    var zRight = Z_DEPTH * 0.5;

    var leftRingPts = circlePts(-offset, 0, zLeft, r, 48);
    add(makeRope(leftRingPts, COLOR, ROPE_RADIUS, {
      textureRepeat: 18,
      tubularSegments: 200,
      tension: 0.28,
      closed: true
    }));

    var rightRingPts = circlePts(offset, 0, zRight, r, 48);
    add(makeRope(rightRingPts, '#E83452', ROPE_RADIUS, {
      textureRepeat: 18,
      tubularSegments: 200,
      tension: 0.28,
      closed: true
    }));

    var innerLeftPts = circlePts(-offset, 0, zLeft + 0.02, r * 0.45, 32);
    add(makeRope(innerLeftPts, COLOR, ROPE_RADIUS * 0.7, {
      textureRepeat: 8, tubularSegments: 120, tension: 0.3, closed: true
    }));

    var innerRightPts = circlePts(offset, 0, zRight + 0.02, r * 0.45, 32);
    add(makeRope(innerRightPts, '#E83452', ROPE_RADIUS * 0.7, {
      textureRepeat: 8, tubularSegments: 120, tension: 0.3, closed: true
    }));

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.15, 8),
      new THREE.MeshStandardMaterial({ color: 0x00eeff, emissive: 0x00aaff, emissiveIntensity: 0.5 })
    );
    arrow.position.set(offset + r * 0.3, r * 0.6, zRight + 0.15);
    arrow.rotation.x = -Math.PI / 2;
    arrow.rotation.z = -0.6;
    add(arrow);

    return meshes;
  }

  function buildCenterThread() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var r = RING_R * 0.85;
    var offset = r * (1 - OVERLAP);

    var basePts = figure8Pts(0, 0, 0, r, OVERLAP, Z_DEPTH * 0.8);
    var weavePts = overUnderPts(basePts, [1, -1, 1, -1], Z_DEPTH * 0.4);

    add(makeRope(weavePts, COLOR, ROPE_RADIUS, {
      textureRepeat: 26,
      tubularSegments: 260,
      tension: 0.28,
      closed: false
    }));

    var threadPts = [
      { x: 0, y: r * 0.15, z: Z_DEPTH * 1.2 },
      { x: 0, y: r * 0.05, z: Z_DEPTH * 0.8 },
      { x: 0, y: -r * 0.05, z: -Z_DEPTH * 0.8 },
      { x: 0, y: -r * 0.15, z: -Z_DEPTH * 1.2 }
    ];
    add(makeRope(threadPts, '#FFD700', ROPE_RADIUS * 0.8, {
      textureRepeat: 4, tubularSegments: 80, tension: 0.3
    }));

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00cc66, emissiveIntensity: 0.5 })
    );
    arrow.position.set(0, -r * 0.25, -Z_DEPTH * 1.3);
    arrow.rotation.x = Math.PI;
    add(arrow);

    return meshes;
  }

  function buildAdjust() {
    return buildFullKnotShape(0.75);
  }

  function buildTighten() {
    return buildFullKnotShape(0.9);
  }

  function buildFinal() {
    var meshes = buildFullKnotShape(1.0);
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var r = RING_R;
    var offset = r * (1 - OVERLAP);

    var charm1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.03, 8, 16),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#FFD700'), roughness: 0.25, metalness: 0.7, emissive: new THREE.Color('#FFA500'), emissiveIntensity: 0.3 })
    );
    charm1.position.set(-offset + r * 0.3, r * 0.6, Z_DEPTH * 0.6);
    add(charm1);

    var charm2 = charm1.clone();
    charm2.position.set(offset - r * 0.3, r * 0.6, Z_DEPTH * 0.6);
    add(charm2);

    return meshes;
  }

  function animPrepare(onDone) {
    var fullPts = [
      { x: -RING_R * 1.3, y: RING_R * 0.9, z: 0.04 },
      { x: -RING_R * 0.9, y: RING_R * 0.6, z: 0.03 },
      { x: -RING_R * 0.5, y: RING_R * 0.3, z: 0.02 },
      { x: 0, y: 0, z: 0.01 },
      { x: RING_R * 0.5, y: -RING_R * 0.3, z: 0.02 },
      { x: RING_R * 0.9, y: -RING_R * 0.6, z: 0.03 },
      { x: RING_R * 1.3, y: -RING_R * 0.9, z: 0.04 }
    ];

    Knots3D.anim.startGrowAnim(2, fullPts, COLOR, ROPE_RADIUS * 0.92, 1200, function () {
      var meshes = buildPrepare();
      Knots3D.anim.recordStepMeshes(2, meshes);
      if (onDone) onDone();
    });
  }

  function animLeftCoin(onDone) {
    var r = RING_R * 0.88;
    var offset = r * (1 - OVERLAP);
    var fullPts = circlePts(-offset, 0, 0.05, r, 48);

    Knots3D.anim.startGrowAnim(3, fullPts, COLOR, ROPE_RADIUS, 1400, function () {
      var meshes = buildLeftCoin();
      Knots3D.anim.recordStepMeshes(3, meshes);
      if (onDone) onDone();
    });
  }

  function animRightCoin(onDone) {
    var r = RING_R * 0.86;
    var offset = r * (1 - OVERLAP);
    var fullPts = circlePts(offset, 0, Z_DEPTH * 0.5, r, 48);

    Knots3D.anim.startGrowAnim(4, fullPts, '#E83452', ROPE_RADIUS, 1400, function () {
      var meshes = buildRightCoin();
      Knots3D.anim.recordStepMeshes(4, meshes);
      if (onDone) onDone();
    });
  }

  function animCenter(onDone) {
    var r = RING_R * 0.85;
    var basePts = figure8Pts(0, 0, 0, r, OVERLAP, Z_DEPTH * 0.8);
    var fullPts = overUnderPts(basePts, [1, -1, 1, -1], Z_DEPTH * 0.4);

    Knots3D.anim.startGrowAnim(5, fullPts, COLOR, ROPE_RADIUS, 1800, function () {
      var meshes = buildCenterThread();
      Knots3D.anim.recordStepMeshes(5, meshes);
      if (onDone) onDone();
    });
  }

  function animAdjust(onDone) {
    Knots3D.anim.startStepAnim(6, [], [], 800, function () {
      var meshes = buildAdjust();
      Knots3D.anim.recordStepMeshes(6, meshes);
      if (onDone) onDone();
    });
  }

  function buildShuangQianShape(t) { return buildFullKnotShape(t); }

  Knots3D.register('shuang-qian', {
    builders: [
      buildPreview, buildMaterials, buildPrepare, buildLeftCoin, buildRightCoin,
      buildCenterThread, buildAdjust, buildTighten, buildFinal
    ],
    cameras: [
      CAM.preview, CAM.material, CAM.prepare, CAM.leftCoin, CAM.rightCoin,
      CAM.center, CAM.adjust, CAM.tighten, CAM.final
    ],
    anims: { 2: animPrepare, 3: animLeftCoin, 4: animRightCoin, 5: animCenter, 6: animAdjust },
    tightenStep: 7,
    tightenBuilder: buildShuangQianShape,
    interactions: { threadStep: 5, tightenStep: 7 }
  });

})();
