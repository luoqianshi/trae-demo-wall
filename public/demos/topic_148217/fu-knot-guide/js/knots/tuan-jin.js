/**
 * tuan-jin.js - 团锦结 3D 实现（六瓣花形重写版）
 *
 * 核心特性：
 * 1. 单条红绳编织，六瓣菊花形结构
 * 2. 中心圆环（花心）+ 六瓣水滴形花瓣
 * 3. 花瓣每60度均匀分布，大小一致
 * 4. 花瓣与中心环连续连接，整体圆润饱满
 * 5. 9个步骤Builder，真实编织递进
 * 6. 支持收紧交互和生长动画
 *
 * 步骤：0预览 1材料 2中心圆环 3第一瓣 4第二三瓣 5第四五瓣 6第六瓣+穿线 7调形 8收尾
 */
(function () {
  'use strict';

  var T = Knots3D.tools;
  var makeRope = T.makeRope;
  var makeBead = T.makeBead;
  var THREE = T.THREE;
  var circlePts = T.circlePts;
  var arcPts = T.arcPts;
  var ropeGroup = function () { return Scene3D._.ropeGroup; };

  var ROPE_COLOR = '#C41E3A';
  var ROPE_DARK = '#8B0000';
  var ROPE_RADIUS = 0.08;
  var KNOT_R = 1.0;
  var CENTER_R = 0.35;
  var PETAL_LEN = 0.65;
  var PETAL_W = 0.35;
  var PETAL_COUNT = 6;

  var CAM = {
    preview:  { pos: { x: 0.2, y: 0.15, z: 5.0 },  target: { x: 0, y: 0, z: 0 } },
    material: { pos: { x: 0, y: 0.25, z: 4.8 },    target: { x: 0, y: 0.05, z: 0 } },
    center:   { pos: { x: 0.1, y: 0.15, z: 4.8 },  target: { x: 0, y: 0, z: 0 } },
    petal1:   { pos: { x: 0.4, y: 0.2, z: 4.6 },   target: { x: 0.2, y: 0.1, z: 0 } },
    petal23:  { pos: { x: 0.3, y: -0.15, z: 4.6 }, target: { x: 0.15, y: -0.1, z: 0 } },
    petal45:  { pos: { x: -0.4, y: -0.1, z: 4.6 }, target: { x: -0.2, y: -0.05, z: 0 } },
    petal6:   { pos: { x: -0.3, y: 0.25, z: 4.6 }, target: { x: -0.15, y: 0.15, z: 0 } },
    adjust:   { pos: { x: 0.1, y: 0.1, z: 5.0 },   target: { x: 0, y: 0, z: 0 } },
    final:    { pos: { x: 0.35, y: 0.2, z: 4.8 },  target: { x: 0, y: 0, z: 0 } }
  };

  function petalShapePts(cx, cy, cz, length, width, angle, zOffset) {
    zOffset = zOffset || 0;
    var segs = 28;
    var pts = [];
    var cosA = Math.cos(angle);
    var sinA = Math.sin(angle);

    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var ang = t * Math.PI;
      var sinAng = Math.sin(ang);
      var cosAng = Math.cos(ang);

      var distFromBase = (1 - cosAng) * length * 0.5;
      var halfWidth = sinAng * width * 0.5;

      var localX = distFromBase;
      var localY = -halfWidth;

      var x = cx + localX * cosA - localY * sinA;
      var y = cy + localX * sinA + localY * cosA;
      var z = cz + zOffset * sinAng + Math.sin(t * Math.PI * 2) * 0.01;

      pts.push({ x: x, y: y, z: z });
    }

    for (var j = segs - 1; j >= 0; j--) {
      var t2 = j / segs;
      var ang2 = t2 * Math.PI;
      var sinAng2 = Math.sin(ang2);
      var cosAng2 = Math.cos(ang2);

      var distFromBase2 = (1 - cosAng2) * length * 0.5;
      var halfWidth2 = sinAng2 * width * 0.5;

      var localX2 = distFromBase2;
      var localY2 = halfWidth2;

      var x2 = cx + localX2 * cosA - localY2 * sinA;
      var y2 = cy + localX2 * sinA + localY2 * cosA;
      var z2 = cz + zOffset * sinAng2 + Math.sin(t2 * Math.PI * 2) * 0.01;

      pts.push({ x: x2, y: y2, z: z2 });
    }

    return pts;
  }

  function buildFullPath(scale) {
    scale = scale || 1;
    var r = KNOT_R * scale;
    var centerR = CENTER_R * scale;
    var petalLen = PETAL_LEN * scale;
    var petalW = PETAL_W * scale;
    var path = [];
    var zBase = 0.02;

    function appendPts(pts) {
      for (var i = 0; i < pts.length; i++) path.push(pts[i]);
    }

    var startAngle = -Math.PI / 2;

    for (var p = 0; p < PETAL_COUNT; p++) {
      var petalAngle = startAngle + (p / PETAL_COUNT) * Math.PI * 2;
      var zOff = (p % 2 === 0) ? 0.04 : -0.04;

      var entryArc = arcPts(0, 0, zBase + zOff * 0.3, centerR,
        petalAngle - 0.25,
        petalAngle,
        12);
      appendPts(entryArc);

      var baseX = Math.cos(petalAngle) * centerR;
      var baseY = Math.sin(petalAngle) * centerR;
      var petalPts = petalShapePts(baseX, baseY, zBase + zOff * 0.5, petalLen, petalW, petalAngle, zOff);
      appendPts(petalPts);

      var exitArc = arcPts(0, 0, zBase + zOff * 0.3, centerR,
        petalAngle,
        petalAngle + 0.25,
        12);
      appendPts(exitArc);
    }

    var closeArc = arcPts(0, 0, zBase, centerR,
      startAngle + (PETAL_COUNT / PETAL_COUNT) * Math.PI * 2 + 0.25,
      startAngle + Math.PI * 2 - 0.25,
      20);
    appendPts(closeArc);

    return path;
  }

  function buildCenterRing(scale) {
    scale = scale || 1;
    var centerR = CENTER_R * scale;
    var zBase = 0.02;
    return circlePts(0, 0, zBase, centerR, 60);
  }

  function buildPetalPath(petalIndex, scale, includeCenter) {
    scale = scale || 1;
    var r = KNOT_R * scale;
    var centerR = CENTER_R * scale;
    var petalLen = PETAL_LEN * scale;
    var petalW = PETAL_W * scale;
    var path = [];
    var zBase = 0.02;
    var startAngle = -Math.PI / 2;

    function appendPts(pts) {
      for (var i = 0; i < pts.length; i++) path.push(pts[i]);
    }

    if (includeCenter) {
      var centerPath = arcPts(0, 0, zBase, centerR,
        startAngle - 0.3,
        startAngle + (petalIndex / PETAL_COUNT) * Math.PI * 2,
        30 + petalIndex * 10);
      appendPts(centerPath);
    }

    for (var p = 0; p <= petalIndex; p++) {
      var petalAngle = startAngle + (p / PETAL_COUNT) * Math.PI * 2;
      var zOff = (p % 2 === 0) ? 0.04 : -0.04;

      var entryArc = arcPts(0, 0, zBase + zOff * 0.3, centerR,
        petalAngle - 0.25,
        petalAngle,
        10);
      appendPts(entryArc);

      var baseX = Math.cos(petalAngle) * centerR;
      var baseY = Math.sin(petalAngle) * centerR;
      var petalPts = petalShapePts(baseX, baseY, zBase + zOff * 0.5, petalLen, petalW, petalAngle, zOff);
      appendPts(petalPts);

      var exitArc = arcPts(0, 0, zBase + zOff * 0.3, centerR,
        petalAngle,
        petalAngle + 0.25,
        10);
      appendPts(exitArc);
    }

    return path;
  }

  function buildFullKnotShape(t) {
    t = Math.max(0, Math.min(1, t || 1));
    var scale = 0.85 + 0.15 * t;
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var fullPath = buildFullPath(scale);
    add(makeRope(fullPath, ROPE_COLOR, ROPE_RADIUS, {
      textureRepeat: 28,
      tubularSegments: 280,
      tension: 0.3
    }));

    var innerRing = circlePts(0, 0, -0.03, CENTER_R * scale * 0.75, 48);
    add(makeRope(innerRing, ROPE_DARK, ROPE_RADIUS * 0.9, {
      textureRepeat: 12, tubularSegments: 160, tension: 0.3
    }));

    return meshes;
  }

  function buildPreview() { return buildFullKnotShape(1.0); }

  function buildMaterials() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var coil = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.1, 14, 36),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(ROPE_COLOR), roughness: 0.4, metalness: 0.05 })
    );
    coil.position.set(-1.0, 0.45, 0);
    coil.rotation.x = Math.PI / 2;
    coil.castShadow = true;
    add(coil);

    add(makeRope([
      { x: -0.5, y: 0.08, z: 0.06 },
      { x: 0, y: 0.12, z: 0.08 },
      { x: 0.55, y: 0.06, z: 0.06 }
    ], ROPE_COLOR, 0.075, { textureRepeat: 6 }));

    add(makeBead(1.0, 0.4, 0.1, 0.15));
    add(makeBead(1.0, 0.05, -0.05, 0.12));

    var sc1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 })
    );
    sc1.position.set(0.9, -0.28, 0.18);
    sc1.rotation.z = 0.28;
    add(sc1);
    var sc2 = sc1.clone();
    sc2.rotation.z = -0.28;
    add(sc2);

    var pin1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.38, 8),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 })
    );
    pin1.position.set(0.75, 0.35, 0.12);
    add(pin1);
    var pin2 = pin1.clone();
    pin2.position.set(0.9, 0.25, 0.08);
    add(pin2);

    var board = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.2, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xE8D5B0, roughness: 0.8 })
    );
    board.position.set(0, 0, -0.3);
    board.receiveShadow = true;
    add(board);

    return meshes;
  }

  function buildCenterRingStep() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };
    var scale = 0.9;

    var centerPts = buildCenterRing(scale);
    add(makeRope(centerPts, ROPE_COLOR, ROPE_RADIUS, {
      textureRepeat: 10, tubularSegments: 150, tension: 0.3
    }));

    var pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.42, 8),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 })
    );
    pin.position.set(0, 0, 0.22);
    add(pin);

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xff8800, emissiveIntensity: 0.5 })
    );
    arrow.position.set(CENTER_R * scale * 0.8, CENTER_R * scale * 0.8, 0.15);
    arrow.rotation.z = Math.PI * 0.75;
    add(arrow);

    return meshes;
  }

  function buildPetal1Step() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };
    var scale = 0.88;
    var centerR = CENTER_R * scale;
    var petalLen = PETAL_LEN * scale;
    var petalW = PETAL_W * scale;
    var zBase = 0.02;
    var startAngle = -Math.PI / 2;

    var centerPts = arcPts(0, 0, zBase, centerR, startAngle - 0.5, startAngle + 0.3, 24);
    add(makeRope(centerPts, ROPE_COLOR, ROPE_RADIUS, {
      textureRepeat: 8, tubularSegments: 120, tension: 0.3
    }));

    var petalAngle = startAngle;
    var zOff = 0.04;
    var baseX = Math.cos(petalAngle) * centerR;
    var baseY = Math.sin(petalAngle) * centerR;
    var petalPts = petalShapePts(baseX, baseY, zBase + zOff * 0.5, petalLen, petalW, petalAngle, zOff);

    var entryArc = arcPts(0, 0, zBase + zOff * 0.3, centerR, petalAngle - 0.25, petalAngle, 10);
    var fullPetalPath = [];
    for (var i = 0; i < entryArc.length; i++) fullPetalPath.push(entryArc[i]);
    for (var j = 0; j < petalPts.length; j++) fullPetalPath.push(petalPts[j]);

    add(makeRope(fullPetalPath, ROPE_COLOR, ROPE_RADIUS * 0.98, {
      textureRepeat: 12, tubularSegments: 180, tension: 0.3
    }));

    add(makeRope([
      { x: Math.cos(petalAngle + 0.25) * centerR, y: Math.sin(petalAngle + 0.25) * centerR, z: zBase + zOff * 0.3 },
      { x: Math.cos(petalAngle + 0.5) * centerR * 0.95, y: Math.sin(petalAngle + 0.5) * centerR * 0.95, z: zBase + zOff * 0.15 },
      { x: Math.cos(petalAngle + 0.7) * centerR * 0.9, y: Math.sin(petalAngle + 0.7) * centerR * 0.9, z: zBase }
    ], ROPE_COLOR, ROPE_RADIUS * 0.9, { textureRepeat: 4, tubularSegments: 50 }));

    var pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.42, 8),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 })
    );
    pin.position.set(0, 0, 0.22);
    add(pin);

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0x00eeff, emissive: 0x00aaff, emissiveIntensity: 0.5 })
    );
    arrow.position.set(0, -(centerR + petalLen * 0.8), zBase + zOff + 0.1);
    arrow.rotation.x = Math.PI;
    add(arrow);

    return meshes;
  }

  function buildPetal23Step() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };
    var scale = 0.85;
    var path = buildPetalPath(2, scale, true);

    add(makeRope(path, ROPE_COLOR, ROPE_RADIUS, {
      textureRepeat: 20, tubularSegments: 240, tension: 0.3
    }));

    var pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.42, 8),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 })
    );
    pin.position.set(0, 0, 0.22);
    add(pin);

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0x00eeff, emissive: 0x00aaff, emissiveIntensity: 0.5 })
    );
    var arrowAngle = -Math.PI / 2 + (2.5 / PETAL_COUNT) * Math.PI * 2;
    var arrowR = CENTER_R * scale + PETAL_LEN * scale * 0.7;
    arrow.position.set(Math.cos(arrowAngle) * arrowR, Math.sin(arrowAngle) * arrowR, 0.12);
    arrow.rotation.z = arrowAngle + Math.PI / 2;
    add(arrow);

    return meshes;
  }

  function buildPetal45Step() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };
    var scale = 0.85;
    var path = buildPetalPath(4, scale, true);

    add(makeRope(path, ROPE_COLOR, ROPE_RADIUS, {
      textureRepeat: 24, tubularSegments: 260, tension: 0.3
    }));

    var pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.42, 8),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 })
    );
    pin.position.set(0, 0, 0.22);
    add(pin);

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0x00eeff, emissive: 0x00aaff, emissiveIntensity: 0.5 })
    );
    var arrowAngle = -Math.PI / 2 + (4.5 / PETAL_COUNT) * Math.PI * 2;
    var arrowR = CENTER_R * scale + PETAL_LEN * scale * 0.7;
    arrow.position.set(Math.cos(arrowAngle) * arrowR, Math.sin(arrowAngle) * arrowR, 0.12);
    arrow.rotation.z = arrowAngle + Math.PI / 2;
    add(arrow);

    return meshes;
  }

  function buildPetal6Step() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };
    var scale = 0.88;
    var fullPath = buildFullPath(scale);

    add(makeRope(fullPath, ROPE_COLOR, ROPE_RADIUS, {
      textureRepeat: 28, tubularSegments: 280, tension: 0.3
    }));

    var innerRing = circlePts(0, 0, -0.02, CENTER_R * scale * 0.8, 48);
    add(makeRope(innerRing, ROPE_DARK, ROPE_RADIUS * 0.88, {
      textureRepeat: 10, tubularSegments: 140, tension: 0.3
    }));

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xff8800, emissiveIntensity: 0.5 })
    );
    arrow.position.set(-CENTER_R * scale * 0.6, CENTER_R * scale * 0.6, 0.15);
    arrow.rotation.z = -Math.PI * 0.75;
    add(arrow);

    return meshes;
  }

  function buildAdjustStep() { return buildFullKnotShape(0.92); }

  function buildFinalStep() {
    var meshes = buildFullKnotShape(1.0);
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    add(makeBead(0, 0, 0.08, 0.18));

    var charm = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.03, 8, 16),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#FFD700'), roughness: 0.25, metalness: 0.7, emissive: new THREE.Color('#FFA500'), emissiveIntensity: 0.3 })
    );
    charm.position.set(0.75, 0.5, 0.2);
    add(charm);

    return meshes;
  }

  function animCenterRing(onDone) {
    var centerPts = buildCenterRing(0.9);
    Knots3D.anim.startGrowAnim(2, centerPts, ROPE_COLOR, ROPE_RADIUS, 1200, function () {
      var meshes = buildCenterRingStep();
      Knots3D.anim.recordStepMeshes(2, meshes);
      if (onDone) onDone();
    });
  }

  function animPetal1(onDone) {
    Knots3D.anim.startStepAnim(3, [], [], 900, function () {
      var meshes = buildPetal1Step();
      Knots3D.anim.recordStepMeshes(3, meshes);
      if (onDone) onDone();
    });
  }

  function animPetal23(onDone) {
    Knots3D.anim.startStepAnim(4, [], [], 1000, function () {
      var meshes = buildPetal23Step();
      Knots3D.anim.recordStepMeshes(4, meshes);
      if (onDone) onDone();
    });
  }

  function animPetal45(onDone) {
    Knots3D.anim.startStepAnim(5, [], [], 1000, function () {
      var meshes = buildPetal45Step();
      Knots3D.anim.recordStepMeshes(5, meshes);
      if (onDone) onDone();
    });
  }

  function animPetal6(onDone) {
    Knots3D.anim.startStepAnim(6, [], [], 1100, function () {
      var meshes = buildPetal6Step();
      Knots3D.anim.recordStepMeshes(6, meshes);
      if (onDone) onDone();
    });
  }

  function buildTuanJinShape(t) { return buildFullKnotShape(t); }

  Knots3D.register('tuan-jin', {
    builders: [
      buildPreview, buildMaterials, buildCenterRingStep, buildPetal1Step, buildPetal23Step,
      buildPetal45Step, buildPetal6Step, buildAdjustStep, buildFinalStep
    ],
    cameras: [
      CAM.preview, CAM.material, CAM.center, CAM.petal1, CAM.petal23,
      CAM.petal45, CAM.petal6, CAM.adjust, CAM.final
    ],
    anims: { 2: animCenterRing, 3: animPetal1, 4: animPetal23, 5: animPetal45, 6: animPetal6 },
    tightenStep: 7,
    tightenBuilder: buildTuanJinShape,
    interactions: { threadStep: 5, tightenStep: 7 }
  });

})();
