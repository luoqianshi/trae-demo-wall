/**
 * hu-die.js - 蝴蝶结 3D 实现（完全重写版）
 *
 * 核心特性：
 * 1. 真实蝴蝶结结构：单根红绳对折，左右大翅膀（水滴形耳圈），中心束结，上方小触须，下方尾带
 * 2. 主色红色 #C41E3A，左右翅膀严格对称
 * 3. 翅膀呈水滴形（上端圆润下端收窄），触须小巧翘起
 * 4. 9个独立builder展示真实制作递进
 * 5. 使用 startGrowAnim 实现绳子生长动画
 * 6. tightenBuilder 支持收紧交互（tightenStep = 7）
 * 7. 复用 earLoopPts 等工具函数
 *
 * 步骤：0预览 1材料 2准备线 3左翅 4右翅 5中心束结 6触须 7调形 8收尾定型
 */
(function () {
  'use strict';

  var T = Knots3D.tools;
  var makeRope = T.makeRope;
  var makeBead = T.makeBead;
  var THREE = T.THREE;
  var earLoopPts = T.earLoopPts;
  var ropeGroup = function () { return Scene3D._.ropeGroup; };

  var COLOR = '#C41E3A';
  var COLOR_DARK = '#9C162D';
  var GOLD_COLOR = '#DAA520';
  var ROPE_RADIUS = 0.09;

  var WING_W = 1.1;
  var WING_H = 0.85;
  var BODY_W = 0.28;
  var BODY_H = 0.5;
  var ANTENNA_W = 0.18;
  var ANTENNA_H = 0.32;
  var TAIL_LEN = 0.9;

  var CAM = {
    preview:  { pos: { x: 0, y: 0.1, z: 6.0 },  target: { x: 0, y: 0, z: 0 } },
    material: { pos: { x: 0, y: 0.2, z: 5.5 },  target: { x: 0, y: 0.1, z: 0 } },
    prepare:  { pos: { x: 0, y: 0.1, z: 5.5 },  target: { x: 0, y: 0, z: 0 } },
    leftWing: { pos: { x: -0.5, y: 0.2, z: 5.5 },target: { x: -0.3, y: 0.1, z: 0 } },
    rightWing:{ pos: { x: 0.5, y: 0.2, z: 5.5 }, target: { x: 0.3, y: 0.1, z: 0 } },
    body:     { pos: { x: 0, y: 0.15, z: 5.0 }, target: { x: 0, y: 0.05, z: 0 } },
    antenna:  { pos: { x: 0, y: 0.3, z: 5.2 },  target: { x: 0, y: 0.2, z: 0 } },
    adjust:   { pos: { x: 0, y: 0.1, z: 5.8 },  target: { x: 0, y: 0, z: 0 } },
    final:    { pos: { x: 0.4, y: 0.15, z: 5.5 },target: { x: 0, y: 0.05, z: 0 } }
  };

  function wingShapePts(cx, cy, cz, w, h, direction, zBase) {
    direction = direction || 'out';
    zBase = zBase !== undefined ? zBase : cz;

    var segments = 60;
    var pts = [];

    var dirSign = direction === 'left' ? -1 : 1;

    for (var i = 0; i <= segments; i++) {
      var t = i / segments;
      var angle = (1 - t) * Math.PI * 1.15 + t * Math.PI * 0.15;

      var cosA = Math.cos(angle);
      var sinA = Math.sin(angle);

      var xOff = cosA * w * 0.55;
      var yOff = sinA * h * 0.55;

      var x = cx + xOff * dirSign;
      var y = cy + yOff + h * 0.1;

      var zTaper = 1 - Math.abs(cosA);
      var z = zBase + zTaper * 0.08;

      pts.push({ x: x, y: y, z: z });
    }

    for (var j = segments; j >= 0; j--) {
      var t2 = j / segments;
      var angle2 = t2 * Math.PI * 0.85;

      var cosA2 = Math.cos(angle2);
      var sinA2 = Math.sin(angle2);

      var xOff2 = cosA2 * w * 0.35;
      var yOff2 = -sinA2 * h * 0.45;

      var x2 = cx + xOff2 * dirSign;
      var y2 = cy + yOff2 + h * 0.1;

      var zTaper2 = sinA2;
      var z2 = zBase - zTaper2 * 0.06;

      pts.push({ x: x2, y: y2, z: z2 });
    }

    return pts;
  }

  function antennaPts(cx, cy, cz, w, h, direction) {
    var dirSign = direction === 'left' ? -1 : 1;
    var segments = 24;
    var pts = [];

    for (var i = 0; i <= segments; i++) {
      var t = i / segments;
      var angle = (0.5 - t) * Math.PI * 0.6;

      var r = w * (0.4 + 0.6 * (1 - t));

      var x = cx + Math.cos(angle) * r * dirSign;
      var y = cy + h * t * 1.2;
      var z = cz + Math.sin(angle) * 0.03;

      pts.push({ x: x, y: y, z: z });
    }

    return pts;
  }

  function bodyPts(cx, cy, cz, w, h) {
    var segments = 40;
    var pts = [];

    for (var i = 0; i <= segments; i++) {
      var t = i / segments;
      var angle = t * Math.PI * 2;

      var xScale = 0.6 + 0.4 * Math.abs(Math.sin(angle * 2));
      var yScale = 0.8 + 0.2 * Math.cos(angle);

      var x = cx + Math.cos(angle) * w * xScale;
      var y = cy + Math.sin(angle) * h * yScale;
      var z = cz + Math.sin(angle * 2) * 0.04;

      pts.push({ x: x, y: y, z: z });
    }

    return pts;
  }

  function buildFullKnotShape(t) {
    t = Math.max(0, Math.min(1, t || 1));
    var scale = 0.8 + 0.2 * t;
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var ww = WING_W * scale;
    var wh = WING_H * scale;
    var bw = BODY_W * scale;
    var bh = BODY_H * scale;
    var aw = ANTENNA_W * scale;
    var ah = ANTENNA_H * scale;
    var tl = TAIL_LEN * scale;
    var zFront = 0.06;
    var zBack = -0.06;

    var leftWing = wingShapePts(-bw * 0.3, 0, zFront, ww, wh, 'left', zFront);
    add(makeRope(leftWing, COLOR, ROPE_RADIUS, {
      textureRepeat: 24,
      tubularSegments: 260,
      tension: 0.28
    }));

    var rightWing = wingShapePts(bw * 0.3, 0, zBack, ww, wh, 'right', zBack);
    add(makeRope(rightWing, COLOR, ROPE_RADIUS, {
      textureRepeat: 24,
      tubularSegments: 260,
      tension: 0.28
    }));

    var body = bodyPts(0, 0, 0, bw, bh);
    add(makeRope(body, COLOR_DARK, ROPE_RADIUS * 1.05, {
      textureRepeat: 10,
      tubularSegments: 180,
      tension: 0.3
    }));

    var bodyInner = bodyPts(0, 0, 0.02, bw * 0.65, bh * 0.7);
    add(makeRope(bodyInner, COLOR, ROPE_RADIUS * 0.9, {
      textureRepeat: 8,
      tubularSegments: 140,
      tension: 0.3
    }));

    var leftAntenna = antennaPts(-bw * 0.25, bh * 0.7, 0.03, aw, ah, 'left');
    add(makeRope(leftAntenna, COLOR, ROPE_RADIUS * 0.82, {
      textureRepeat: 6,
      tubularSegments: 100,
      tension: 0.32
    }));

    var rightAntenna = antennaPts(bw * 0.25, bh * 0.7, 0.03, aw, ah, 'right');
    add(makeRope(rightAntenna, COLOR, ROPE_RADIUS * 0.82, {
      textureRepeat: 6,
      tubularSegments: 100,
      tension: 0.32
    }));

    var leftTail = [
      { x: -bw * 0.15, y: -bh * 0.8, z: 0.02 },
      { x: -bw * 0.2, y: -bh * 1.0 - tl * 0.3, z: 0.01 },
      { x: -bw * 0.25, y: -bh * 1.0 - tl * 0.6, z: 0 },
      { x: -bw * 0.3, y: -bh * 1.0 - tl, z: -0.01 }
    ];
    add(makeRope(leftTail, COLOR, ROPE_RADIUS * 0.85, {
      textureRepeat: 8,
      tubularSegments: 90,
      tension: 0.32
    }));

    var rightTail = [
      { x: bw * 0.15, y: -bh * 0.8, z: -0.02 },
      { x: bw * 0.2, y: -bh * 1.0 - tl * 0.3, z: -0.01 },
      { x: bw * 0.25, y: -bh * 1.0 - tl * 0.6, z: 0 },
      { x: bw * 0.3, y: -bh * 1.0 - tl, z: 0.01 }
    ];
    add(makeRope(rightTail, COLOR, ROPE_RADIUS * 0.85, {
      textureRepeat: 8,
      tubularSegments: 90,
      tension: 0.32
    }));

    add(makeBead(-bw * 0.3, -bh * 1.0 - tl - 0.12, -0.01, 0.12));
    add(makeBead(bw * 0.3, -bh * 1.0 - tl - 0.12, 0.01, 0.12));

    return meshes;
  }

  function buildPreview() {
    return buildFullKnotShape(1.0);
  }

  function buildMaterials() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var c1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.095, 12, 30),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(COLOR), roughness: 0.38, metalness: 0.06 })
    );
    c1.position.set(-1.0, 0.35, 0);
    c1.rotation.x = Math.PI / 2;
    c1.castShadow = true;
    add(c1);

    add(makeRope([
      { x: -0.6, y: 0.06, z: 0.06 },
      { x: 0, y: 0.1, z: 0.08 },
      { x: 0.65, y: 0.05, z: 0.05 }
    ], COLOR, 0.075, { textureRepeat: 6 }));

    add(makeBead(1.0, 0.3, 0.1, 0.13));
    add(makeBead(1.0, 0.0, -0.06, 0.11));

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
      new THREE.CylinderGeometry(0.06, 0.07, 0.3, 10),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#333333'), roughness: 0.5, metalness: 0.3 })
    );
    lighter.position.set(-0.9, -0.28, 0.1);
    add(lighter);

    return meshes;
  }

  function buildPrepare() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    add(makeRope([
      { x: -1.8, y: 0.8, z: 0.04 },
      { x: -1.2, y: 0.5, z: 0.03 },
      { x: -0.6, y: 0.2, z: 0.02 },
      { x: 0, y: 0.05, z: 0.01 },
      { x: 0.6, y: -0.15, z: 0.02 },
      { x: 1.2, y: -0.45, z: 0.03 },
      { x: 1.8, y: -0.75, z: 0.04 }
    ], COLOR, ROPE_RADIUS * 0.92, {
      textureRepeat: 12,
      tubularSegments: 140,
      tension: 0.32
    }));

    var pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.42, 8),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 })
    );
    pin.position.set(0, 0.25, 0.15);
    add(pin);

    return meshes;
  }

  function buildLeftWing() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var bw = BODY_W;
    var ww = WING_W;
    var wh = WING_H;
    var zFront = 0.06;

    add(makeRope([
      { x: -1.6, y: 0.7, z: 0.04 },
      { x: -1.0, y: 0.4, z: 0.03 },
      { x: -0.5, y: 0.15, z: 0.02 },
      { x: 0, y: 0.05, z: 0.01 },
      { x: 0.5, y: -0.15, z: 0.02 },
      { x: 1.1, y: -0.45, z: 0.03 },
      { x: 1.7, y: -0.75, z: 0.04 }
    ], COLOR, ROPE_RADIUS * 0.88, {
      textureRepeat: 10,
      tubularSegments: 120,
      tension: 0.32
    }));

    var leftWing = wingShapePts(-bw * 0.3, 0, zFront, ww, wh, 'left', zFront);
    add(makeRope(leftWing, '#E83452', ROPE_RADIUS, {
      textureRepeat: 22,
      tubularSegments: 240,
      tension: 0.28
    }));

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.065, 0.15, 8),
      new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xff8800, emissiveIntensity: 0.5 })
    );
    arrow.position.set(-ww * 0.85, wh * 0.2, zFront + 0.18);
    arrow.rotation.x = Math.PI / 2;
    arrow.rotation.z = 0.6;
    add(arrow);

    var pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.42, 8),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 })
    );
    pin.position.set(0, 0.25, 0.15);
    add(pin);

    return meshes;
  }

  function buildRightWing() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var bw = BODY_W;
    var ww = WING_W;
    var wh = WING_H;
    var zFront = 0.06;
    var zBack = -0.06;

    var leftWing = wingShapePts(-bw * 0.3, 0, zFront, ww, wh, 'left', zFront);
    add(makeRope(leftWing, COLOR, ROPE_RADIUS, {
      textureRepeat: 22,
      tubularSegments: 240,
      tension: 0.25
    }));

    var rightWing = wingShapePts(bw * 0.3, 0, zBack, ww, wh, 'right', zBack);
    add(makeRope(rightWing, '#E83452', ROPE_RADIUS, {
      textureRepeat: 22,
      tubularSegments: 240,
      tension: 0.28
    }));

    add(makeRope([
      { x: 0, y: 0.05, z: 0.01 },
      { x: 0.6, y: -0.2, z: 0.02 },
      { x: 1.2, y: -0.5, z: 0.03 },
      { x: 1.8, y: -0.8, z: 0.04 }
    ], COLOR, ROPE_RADIUS * 0.88, {
      textureRepeat: 6,
      tubularSegments: 80,
      tension: 0.32
    }));

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.065, 0.15, 8),
      new THREE.MeshStandardMaterial({ color: 0x00eeff, emissive: 0x00aaff, emissiveIntensity: 0.5 })
    );
    arrow.position.set(ww * 0.85, wh * 0.2, zBack - 0.18);
    arrow.rotation.x = -Math.PI / 2;
    arrow.rotation.z = -0.6;
    add(arrow);

    return meshes;
  }

  function buildBodyKnot() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var bw = BODY_W;
    var ww = WING_W;
    var wh = WING_H;
    var bh = BODY_H;
    var zFront = 0.06;
    var zBack = -0.06;

    var leftWing = wingShapePts(-bw * 0.35, -0.05, zFront, ww * 0.92, wh * 0.92, 'left', zFront);
    add(makeRope(leftWing, COLOR, ROPE_RADIUS, {
      textureRepeat: 22,
      tubularSegments: 240,
      tension: 0.28
    }));

    var rightWing = wingShapePts(bw * 0.35, -0.05, zBack, ww * 0.92, wh * 0.92, 'right', zBack);
    add(makeRope(rightWing, COLOR, ROPE_RADIUS, {
      textureRepeat: 22,
      tubularSegments: 240,
      tension: 0.28
    }));

    var body = bodyPts(0, -0.02, 0, bw * 1.15, bh * 0.85);
    add(makeRope(body, COLOR_DARK, ROPE_RADIUS * 1.05, {
      textureRepeat: 9,
      tubularSegments: 160,
      tension: 0.3
    }));

    var crossPts1 = [
      { x: -bw * 0.5, y: 0.1, z: zFront * 0.5 },
      { x: -bw * 0.3, y: -0.02, z: 0.02 },
      { x: 0, y: -0.05, z: 0 },
      { x: bw * 0.3, y: -0.02, z: -0.02 },
      { x: bw * 0.5, y: 0.1, z: zBack * 0.5 }
    ];
    add(makeRope(crossPts1, COLOR, ROPE_RADIUS * 0.95, {
      textureRepeat: 6,
      tubularSegments: 100,
      tension: 0.35
    }));

    var crossPts2 = [
      { x: bw * 0.5, y: -0.15, z: zBack * 0.5 },
      { x: bw * 0.3, y: -0.08, z: -0.02 },
      { x: 0, y: -0.05, z: 0 },
      { x: -bw * 0.3, y: -0.08, z: 0.02 },
      { x: -bw * 0.5, y: -0.15, z: zFront * 0.5 }
    ];
    add(makeRope(crossPts2, COLOR, ROPE_RADIUS * 0.95, {
      textureRepeat: 6,
      tubularSegments: 100,
      tension: 0.35
    }));

    var arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xff8800, emissiveIntensity: 0.5 })
    );
    arrow.position.set(0, -bh * 0.5, 0.2);
    arrow.rotation.x = Math.PI;
    add(arrow);

    return meshes;
  }

  function buildAntenna() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var bw = BODY_W;
    var ww = WING_W;
    var wh = WING_H;
    var bh = BODY_H;
    var aw = ANTENNA_W;
    var ah = ANTENNA_H;
    var zFront = 0.06;
    var zBack = -0.06;

    var leftWing = wingShapePts(-bw * 0.3, 0, zFront, ww, wh, 'left', zFront);
    add(makeRope(leftWing, COLOR, ROPE_RADIUS, {
      textureRepeat: 24,
      tubularSegments: 260,
      tension: 0.28
    }));

    var rightWing = wingShapePts(bw * 0.3, 0, zBack, ww, wh, 'right', zBack);
    add(makeRope(rightWing, COLOR, ROPE_RADIUS, {
      textureRepeat: 24,
      tubularSegments: 260,
      tension: 0.28
    }));

    var body = bodyPts(0, 0, 0, bw, bh);
    add(makeRope(body, COLOR_DARK, ROPE_RADIUS * 1.05, {
      textureRepeat: 10,
      tubularSegments: 180,
      tension: 0.3
    }));

    var bodyInner = bodyPts(0, 0, 0.02, bw * 0.65, bh * 0.7);
    add(makeRope(bodyInner, COLOR, ROPE_RADIUS * 0.9, {
      textureRepeat: 8,
      tubularSegments: 140,
      tension: 0.3
    }));

    var leftAntenna = antennaPts(-bw * 0.25, bh * 0.7, 0.03, aw, ah, 'left');
    add(makeRope(leftAntenna, '#E83452', ROPE_RADIUS * 0.82, {
      textureRepeat: 6,
      tubularSegments: 100,
      tension: 0.35
    }));

    var rightAntenna = antennaPts(bw * 0.25, bh * 0.7, 0.03, aw, ah, 'right');
    add(makeRope(rightAntenna, '#E83452', ROPE_RADIUS * 0.82, {
      textureRepeat: 6,
      tubularSegments: 100,
      tension: 0.35
    }));

    var leftTail = [
      { x: -bw * 0.15, y: -bh * 0.8, z: 0.02 },
      { x: -bw * 0.2, y: -bh * 1.0 - TAIL_LEN * 0.4, z: 0.01 },
      { x: -bw * 0.25, y: -bh * 1.0 - TAIL_LEN * 0.7, z: 0 }
    ];
    add(makeRope(leftTail, COLOR, ROPE_RADIUS * 0.85, {
      textureRepeat: 6,
      tubularSegments: 70,
      tension: 0.4
    }));

    var rightTail = [
      { x: bw * 0.15, y: -bh * 0.8, z: -0.02 },
      { x: bw * 0.2, y: -bh * 1.0 - TAIL_LEN * 0.4, z: -0.01 },
      { x: bw * 0.25, y: -bh * 1.0 - TAIL_LEN * 0.7, z: 0 }
    ];
    add(makeRope(rightTail, COLOR, ROPE_RADIUS * 0.85, {
      textureRepeat: 6,
      tubularSegments: 70,
      tension: 0.4
    }));

    var arrow1 = new THREE.Mesh(
      new THREE.ConeGeometry(0.055, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xff8800, emissiveIntensity: 0.5 })
    );
    arrow1.position.set(-aw * 0.6, bh * 0.7 + ah * 0.8, 0.12);
    arrow1.rotation.z = 0.4;
    add(arrow1);

    var arrow2 = arrow1.clone();
    arrow2.position.x = aw * 0.6;
    arrow2.rotation.z = -0.4;
    add(arrow2);

    return meshes;
  }

  function buildAdjust() {
    return buildFullKnotShape(0.92);
  }

  function buildTighten() {
    return buildFullKnotShape(0.85);
  }

  function buildFinal() {
    var meshes = buildFullKnotShape(1.0);
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var charm = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.028, 8, 16),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(GOLD_COLOR), roughness: 0.25, metalness: 0.7, emissive: new THREE.Color('#FFA500'), emissiveIntensity: 0.25 })
    );
    charm.position.set(0.8, 0.5, 0.22);
    charm.rotation.x = Math.PI / 3;
    add(charm);

    return meshes;
  }

  function animPrepare(onDone) {
    var fullPts = [
      { x: -1.8, y: 0.8, z: 0.04 },
      { x: -1.2, y: 0.5, z: 0.03 },
      { x: -0.6, y: 0.2, z: 0.02 },
      { x: 0, y: 0.05, z: 0.01 },
      { x: 0.6, y: -0.15, z: 0.02 },
      { x: 1.2, y: -0.45, z: 0.03 },
      { x: 1.8, y: -0.75, z: 0.04 }
    ];

    Knots3D.anim.startGrowAnim(2, fullPts, COLOR, ROPE_RADIUS * 0.92, 1400, function () {
      var meshes = buildPrepare();
      Knots3D.anim.recordStepMeshes(2, meshes);
      if (onDone) onDone();
    });
  }

  function animLeftWing(onDone) {
    var bw = BODY_W;
    var ww = WING_W;
    var wh = WING_H;
    var zFront = 0.06;

    var fullPts = wingShapePts(-bw * 0.3, 0, zFront, ww, wh, 'left', zFront);

    Knots3D.anim.startGrowAnim(3, fullPts, '#E83452', ROPE_RADIUS, 1800, function () {
      var meshes = buildLeftWing();
      Knots3D.anim.recordStepMeshes(3, meshes);
      if (onDone) onDone();
    });
  }

  function animRightWing(onDone) {
    var bw = BODY_W;
    var ww = WING_W;
    var wh = WING_H;
    var zBack = -0.06;

    var fullPts = wingShapePts(bw * 0.3, 0, zBack, ww, wh, 'right', zBack);

    Knots3D.anim.startGrowAnim(4, fullPts, '#E83452', ROPE_RADIUS, 1800, function () {
      var meshes = buildRightWing();
      Knots3D.anim.recordStepMeshes(4, meshes);
      if (onDone) onDone();
    });
  }

  function animBodyKnot(onDone) {
    var bw = BODY_W;
    var bh = BODY_H;

    var fullPts = bodyPts(0, -0.02, 0, bw * 1.15, bh * 0.85);

    Knots3D.anim.startGrowAnim(5, fullPts, COLOR_DARK, ROPE_RADIUS * 1.05, 1200, function () {
      var meshes = buildBodyKnot();
      Knots3D.anim.recordStepMeshes(5, meshes);
      if (onDone) onDone();
    });
  }

  function animAntenna(onDone) {
    var bw = BODY_W;
    var bh = BODY_H;
    var aw = ANTENNA_W;
    var ah = ANTENNA_H;

    var leftPts = antennaPts(-bw * 0.25, bh * 0.7, 0.03, aw, ah, 'left');

    Knots3D.anim.startGrowAnim(6, leftPts, '#E83452', ROPE_RADIUS * 0.82, 1000, function () {
      var meshes = buildAntenna();
      Knots3D.anim.recordStepMeshes(6, meshes);
      if (onDone) onDone();
    });
  }

  function buildHuDieShape(t) { return buildFullKnotShape(t); }

  Knots3D.register('hu-die', {
    builders: [
      buildPreview, buildMaterials, buildPrepare, buildLeftWing, buildRightWing,
      buildBodyKnot, buildAntenna, buildAdjust, buildFinal
    ],
    cameras: [
      CAM.preview, CAM.material, CAM.prepare, CAM.leftWing, CAM.rightWing,
      CAM.body, CAM.antenna, CAM.adjust, CAM.final
    ],
    anims: { 2: animPrepare, 3: animLeftWing, 4: animRightWing, 5: animBodyKnot, 6: animAntenna },
    tightenStep: 7,
    tightenBuilder: buildHuDieShape,
    interactions: { threadStep: 5, tightenStep: 7 }
  });

})();
