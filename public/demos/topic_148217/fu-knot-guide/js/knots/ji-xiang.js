/**
 * ji-xiang.js - 吉祥结 3D 实现（卍字结重写版）
 *
 * 核心特性：
 * 1. 单根红绳编织，卍字（右旋）结构
 * 2. 四个方向对称耳圈，大小一致
 * 3. 中心交叉挑压关系清晰，Z轴层次分明
 * 4. 9个步骤Builder，真实编织递进
 * 5. 支持收紧交互和生长动画
 *
 * 步骤：0预览 1材料 2十字起头 3三耳弯折 4上耳穿压 5右耳穿压 6左耳穿压 7调形收紧 8收尾定型
 */
(function () {
  'use strict';

  var T = Knots3D.tools;
  var makeRope = T.makeRope;
  var makeBead = T.makeBead;
  var THREE = T.THREE;
  var arcPts = T.arcPts;
  var earLoopPts = T.earLoopPts;
  var overUnderPts = T.overUnderPts;
  var sampleCurvePts = T.sampleCurvePts;
  var ropeGroup = function () { return Scene3D._.ropeGroup; };

  var ROPE_COLOR = '#C41E3A';
  var ROPE_RADIUS = 0.085;
  var KNOT_SIZE = 0.9;
  var EAR_SIZE = 0.42;
  var Z_DEPTH = 0.18;

  var CAM = {
    preview:  { pos: { x: 0.2, y: 0.2, z: 5.2 },  target: { x: 0, y: 0, z: 0 } },
    material: { pos: { x: 0, y: 0.3, z: 5.0 },    target: { x: 0, y: 0.1, z: 0 } },
    cross:    { pos: { x: 0.1, y: 0.2, z: 5.0 },  target: { x: 0, y: 0, z: 0 } },
    threeEars:{ pos: { x: 0.2, y: 0.3, z: 4.8 },  target: { x: 0, y: 0.1, z: 0 } },
    topEar:   { pos: { x: 0.3, y: 0.2, z: 4.8 },  target: { x: 0.1, y: 0, z: 0 } },
    rightEar: { pos: { x: 0.2, y: -0.1, z: 4.8 }, target: { x: 0.1, y: -0.1, z: 0 } },
    leftEar:  { pos: { x: -0.2, y: 0.1, z: 4.8 }, target: { x: -0.1, y: 0, z: 0 } },
    adjust:   { pos: { x: 0.1, y: 0.1, z: 5.2 },  target: { x: 0, y: 0, z: 0 } },
    final:    { pos: { x: 0.3, y: 0.2, z: 5.0 },  target: { x: 0, y: 0, z: 0 } }
  };

  function buildFullPath(scale) {
    scale = scale || 1;
    var s = KNOT_SIZE * scale;
    var es = EAR_SIZE * scale;
    var zUp = Z_DEPTH * 0.5;
    var zDown = -Z_DEPTH * 0.5;
    var zMid = 0;
    var path = [];

    function linePts(x1, y1, z1, x2, y2, z2, segs) {
      segs = segs || 20;
      var pts = [];
      for (var i = 0; i <= segs; i++) {
        var t = i / segs;
        pts.push({
          x: x1 + (x2 - x1) * t,
          y: y1 + (y2 - y1) * t,
          z: z1 + (z2 - z1) * t + Math.sin(t * Math.PI) * 0.01
        });
      }
      return pts;
    }

    function cornerPts(cx, cy, cz, r, startAng, endAng, segs) {
      segs = segs || 10;
      var pts = [];
      for (var i = 0; i <= segs; i++) {
        var t = i / segs;
        var a = startAng + (endAng - startAng) * t;
        pts.push({
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r,
          z: cz + Math.sin(t * Math.PI) * 0.008
        });
      }
      return pts;
    }

    function appendPts(pts) {
      for (var i = 0; i < pts.length; i++) path.push(pts[i]);
    }

    var cr = s * 0.12;
    var armLen = s * 0.35;
    var earW = es * 0.65;
    var earH = es * 0.85;

    var startY = s * 0.55;

    // 1. 顶部横臂：从中心向右
    appendPts(linePts(0, startY, zUp, armLen - cr, startY, zUp, 14));
    // 2. 右上拐角
    appendPts(cornerPts(armLen - cr, startY - cr, zUp, cr, -Math.PI / 2, 0, 8));
    // 3. 右臂上段：向下
    appendPts(linePts(armLen, startY - cr, zUp, armLen, startY - s * 0.22, zMid, 12));

    // 4. 右耳
    var rightEar = earLoopPts(armLen + es * 0.3, startY - s * 0.32, zUp, earW, earH, 'right', zUp);
    appendPts(linePts(armLen, startY - s * 0.22, zMid, armLen + es * 0.12, startY - s * 0.32, zUp, 8));
    appendPts(rightEar);
    appendPts(linePts(armLen + es * 0.12, startY - s * 0.32, zUp, armLen, startY - s * 0.42, zMid, 8));

    // 5. 右臂下段：继续向下
    appendPts(linePts(armLen, startY - s * 0.42, zMid, armLen, -s * 0.35 + cr, zDown, 12));
    // 6. 右下拐角
    appendPts(cornerPts(armLen - cr, -s * 0.35 + cr, zDown, cr, 0, Math.PI / 2, 8));
    // 7. 底部横臂：从右向左
    appendPts(linePts(armLen - cr, -s * 0.35, zDown, -armLen * 0.25, -s * 0.35, zMid, 16));

    // 8. 下耳
    var botEar = earLoopPts(-armLen * 0.4, -s * 0.55, zDown, earW, earH, 'down', zDown);
    appendPts(linePts(-armLen * 0.25, -s * 0.35, zMid, -armLen * 0.4, -s * 0.42 - es * 0.1, zDown, 8));
    appendPts(botEar);
    appendPts(linePts(-armLen * 0.4, -s * 0.42 - es * 0.1, zDown, -armLen * 0.55, -s * 0.35, zMid, 8));

    // 9. 底部横臂继续向左
    appendPts(linePts(-armLen * 0.55, -s * 0.35, zMid, -armLen + cr, -s * 0.55, zUp, 12));
    // 10. 左下拐角
    appendPts(cornerPts(-armLen + cr, -s * 0.55 + cr, zUp, cr, Math.PI / 2, Math.PI, 8));
    // 11. 左臂下段：向上
    appendPts(linePts(-armLen, -s * 0.55 + cr, zUp, -armLen, s * 0.08, zMid, 18));

    // 12. 左耳
    var leftEar = earLoopPts(-armLen - es * 0.3, s * 0.18, zUp, earW, earH, 'left', zUp);
    appendPts(linePts(-armLen, s * 0.08, zMid, -armLen - es * 0.12, s * 0.18, zUp, 8));
    appendPts(leftEar);
    appendPts(linePts(-armLen - es * 0.12, s * 0.18, zUp, -armLen, s * 0.28, zMid, 8));

    // 13. 左臂上段：继续向上
    appendPts(linePts(-armLen, s * 0.28, zMid, -armLen, startY + cr, zDown, 12));
    // 14. 左上拐角
    appendPts(cornerPts(-armLen + cr, startY + cr, zDown, cr, Math.PI, Math.PI * 1.5, 8));
    // 15. 顶部横臂最后一段：回到起点附近
    appendPts(linePts(-armLen + cr, startY, zDown, 0, startY, zUp, 14));

    return path;
  }

  function buildFullKnotShape(t) {
    t = Math.max(0, Math.min(1, t || 1));
    var scale = 0.82 + 0.18 * t;
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var path = buildFullPath(scale);

    add(makeRope(path, ROPE_COLOR, ROPE_RADIUS, {
      textureRepeat: 28,
      tubularSegments: 280,
      tension: 0.3
    }));

    var botTailY = -KNOT_SIZE * scale * 0.55 - EAR_SIZE * scale * 0.85;
    add(makeRope([
      { x: -KNOT_SIZE * scale * 0.4, y: botTailY, z: -Z_DEPTH * 0.3 },
      { x: -KNOT_SIZE * scale * 0.38, y: botTailY - 0.35, z: -Z_DEPTH * 0.2 },
      { x: -KNOT_SIZE * scale * 0.36, y: botTailY - 0.65, z: -Z_DEPTH * 0.1 }
    ], ROPE_COLOR, ROPE_RADIUS * 0.85, { textureRepeat: 6, tubularSegments: 70 }));

    add(makeBead(-KNOT_SIZE * scale * 0.35, botTailY - 0.85, -Z_DEPTH * 0.05, 0.12));

    return meshes;
  }

  function buildPreview() { return buildFullKnotShape(1.0); }

  function buildMaterials() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var coil = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.1, 14, 34),
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

    add(makeBead(1.0, 0.4, 0.1, 0.14));
    add(makeBead(1.0, 0.05, -0.05, 0.11));

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

  function buildCross() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };
    var s = KNOT_SIZE * 0.85;
    var zTop = Z_DEPTH * 0.5;
    var zBot = -Z_DEPTH * 0.5;

    var vertPts = [
      { x: 0, y: s * 0.7, z: zBot },
      { x: 0, y: s * 0.3, z: zBot },
      { x: 0, y: 0, z: zBot },
      { x: 0, y: -s * 0.3, z: zBot },
      { x: 0, y: -s * 0.7, z: zBot }
    ];
    add(makeRope(vertPts, ROPE_COLOR, ROPE_RADIUS, { textureRepeat: 10, tubularSegments: 120, tension: 0.3 }));

    var horzPts = [
      { x: -s * 0.7, y: 0, z: zTop },
      { x: -s * 0.3, y: 0, z: zTop },
      { x: 0, y: 0, z: zTop },
      { x: s * 0.3, y: 0, z: zTop },
      { x: s * 0.7, y: 0, z: zTop }
    ];
    add(makeRope(horzPts, ROPE_COLOR, ROPE_RADIUS, { textureRepeat: 10, tubularSegments: 120, tension: 0.3 }));

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
    arrow.position.set(s * 0.5, 0.25, zTop + 0.15);
    arrow.rotation.z = -Math.PI / 4;
    add(arrow);

    return meshes;
  }

  function buildThreeEars() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };
    var s = KNOT_SIZE * 0.82;
    var es = EAR_SIZE * 0.75;
    var zTop = Z_DEPTH * 0.5;
    var zBot = -Z_DEPTH * 0.5;

    add(makeRope([
      { x: 0, y: s * 0.65, z: zBot },
      { x: 0, y: s * 0.25, z: zBot },
      { x: 0, y: 0, z: zBot },
      { x: 0, y: -s * 0.25, z: zBot },
      { x: 0, y: -s * 0.65, z: zBot }
    ], ROPE_COLOR, ROPE_RADIUS, { textureRepeat: 10, tubularSegments: 120, tension: 0.3 }));

    add(makeRope([
      { x: -s * 0.65, y: 0, z: zTop },
      { x: -s * 0.25, y: 0, z: zTop },
      { x: 0, y: 0, z: zTop },
      { x: s * 0.25, y: 0, z: zTop },
      { x: s * 0.65, y: 0, z: zTop }
    ], ROPE_COLOR, ROPE_RADIUS, { textureRepeat: 10, tubularSegments: 120, tension: 0.3 }));

    var topEar = earLoopPts(0, s * 0.65, zBot, es * 0.65, es * 0.85, 'up', zBot);
    add(makeRope(topEar, ROPE_COLOR, ROPE_RADIUS * 0.95, {
      textureRepeat: 7, tubularSegments: 90, tension: 0.3
    }));

    var rightEar = earLoopPts(s * 0.65, 0, zTop, es * 0.65, es * 0.85, 'right', zTop);
    add(makeRope(rightEar, ROPE_COLOR, ROPE_RADIUS * 0.95, {
      textureRepeat: 7, tubularSegments: 90, tension: 0.3
    }));

    var leftEar = earLoopPts(-s * 0.65, 0, zTop, es * 0.65, es * 0.85, 'left', zTop);
    add(makeRope(leftEar, ROPE_COLOR, ROPE_RADIUS * 0.95, {
      textureRepeat: 7, tubularSegments: 90, tension: 0.3
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
    arrow.position.set(0, -s * 0.75, 0.15);
    arrow.rotation.x = Math.PI;
    add(arrow);

    return meshes;
  }

  function buildTopEarWeave() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };
    var s = KNOT_SIZE * 0.8;
    var es = EAR_SIZE * 0.72;
    var zUp = Z_DEPTH * 0.5;
    var zDown = -Z_DEPTH * 0.5;
    var zMid = 0;

    add(makeRope([
      { x: 0, y: s * 0.6, z: zDown },
      { x: 0, y: s * 0.2, z: zDown },
      { x: 0, y: 0, z: zDown },
      { x: 0, y: -s * 0.2, z: zDown },
      { x: 0, y: -s * 0.6, z: zDown }
    ], ROPE_COLOR, ROPE_RADIUS, { textureRepeat: 10, tubularSegments: 120, tension: 0.3 }));

    add(makeRope([
      { x: -s * 0.6, y: 0, z: zUp },
      { x: -s * 0.2, y: 0, z: zUp },
      { x: 0, y: 0, z: zUp },
      { x: s * 0.2, y: 0, z: zUp },
      { x: s * 0.6, y: 0, z: zUp }
    ], ROPE_COLOR, ROPE_RADIUS, { textureRepeat: 10, tubularSegments: 120, tension: 0.3 }));

    var topPath = [];
    var topEar = earLoopPts(0, s * 0.6, zDown, es * 0.6, es * 0.8, 'up', zDown);
    for (var i = 0; i < topEar.length; i++) topPath.push(topEar[i]);

    topPath.push({ x: s * 0.15, y: s * 0.5, z: zDown });
    topPath.push({ x: s * 0.3, y: s * 0.35, z: zMid });
    topPath.push({ x: s * 0.42, y: s * 0.15, z: zUp });
    topPath.push({ x: s * 0.45, y: -s * 0.05, z: zUp });
    topPath.push({ x: s * 0.4, y: -s * 0.2, z: zMid });

    add(makeRope(topPath, '#FF6347', ROPE_RADIUS * 0.95, {
      textureRepeat: 10, tubularSegments: 140, tension: 0.3
    }));

    var rightEar = earLoopPts(s * 0.6, 0, zUp, es * 0.6, es * 0.8, 'right', zUp);
    add(makeRope(rightEar, ROPE_COLOR, ROPE_RADIUS * 0.95, {
      textureRepeat: 7, tubularSegments: 90, tension: 0.3
    }));

    var leftEar = earLoopPts(-s * 0.6, 0, zUp, es * 0.6, es * 0.8, 'left', zUp);
    add(makeRope(leftEar, ROPE_COLOR, ROPE_RADIUS * 0.95, {
      textureRepeat: 7, tubularSegments: 90, tension: 0.3
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
    arrow.position.set(s * 0.55, -s * 0.12, zUp + 0.2);
    arrow.rotation.z = Math.PI * 0.35;
    add(arrow);

    return meshes;
  }

  function buildRightEarWeave() {
    var meshes = [];
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };
    var s = KNOT_SIZE * 0.78;
    var es = EAR_SIZE * 0.7;
    var zUp = Z_DEPTH * 0.5;
    var zDown = -Z_DEPTH * 0.5;
    var zMid = 0;

    var leftEar = earLoopPts(-s * 0.58, 0, zUp, es * 0.58, es * 0.78, 'left', zUp);
    add(makeRope(leftEar, ROPE_COLOR, ROPE_RADIUS * 0.95, {
      textureRepeat: 7, tubularSegments: 90, tension: 0.3
    }));

    var topWeave = [];
    var topEar2 = earLoopPts(0, s * 0.58, zDown, es * 0.58, es * 0.78, 'up', zDown);
    for (var j = 0; j < topEar2.length; j++) topWeave.push(topEar2[j]);
    topWeave.push({ x: s * 0.12, y: s * 0.48, z: zDown });
    topWeave.push({ x: s * 0.28, y: s * 0.32, z: zMid });
    topWeave.push({ x: s * 0.4, y: s * 0.12, z: zUp });
    topWeave.push({ x: s * 0.43, y: -s * 0.08, z: zUp });
    topWeave.push({ x: s * 0.38, y: -s * 0.25, z: zMid });
    topWeave.push({ x: s * 0.28, y: -s * 0.4, z: zDown });
    add(makeRope(topWeave, ROPE_COLOR, ROPE_RADIUS * 0.95, {
      textureRepeat: 11, tubularSegments: 150, tension: 0.3
    }));

    var rightWeave = [];
    var rightEar2 = earLoopPts(s * 0.58, 0, zUp, es * 0.58, es * 0.78, 'right', zUp);
    for (var k = 0; k < rightEar2.length; k++) rightWeave.push(rightEar2[k]);
    rightWeave.push({ x: s * 0.48, y: -s * 0.12, z: zUp });
    rightWeave.push({ x: s * 0.35, y: -s * 0.32, z: zMid });
    rightWeave.push({ x: s * 0.18, y: -s * 0.48, z: zDown });
    rightWeave.push({ x: -s * 0.02, y: -s * 0.55, z: zDown });
    add(makeRope(rightWeave, '#FF6347', ROPE_RADIUS * 0.95, {
      textureRepeat: 10, tubularSegments: 140, tension: 0.3
    }));

    add(makeRope([
      { x: -s * 0.05, y: -s * 0.55, z: zDown },
      { x: -s * 0.22, y: -s * 0.5, z: zMid },
      { x: -s * 0.38, y: -s * 0.38, z: zUp },
      { x: -s * 0.48, y: -s * 0.2, z: zUp },
      { x: -s * 0.52, y: -s * 0.02, z: zMid }
    ], ROPE_COLOR, ROPE_RADIUS * 0.95, {
      textureRepeat: 8, tubularSegments: 110, tension: 0.3
    }));

    add(makeRope([
      { x: 0, y: s * 0.58, z: zDown },
      { x: 0, y: s * 0.15, z: zDown }
    ], ROPE_COLOR, ROPE_RADIUS, { textureRepeat: 4, tubularSegments: 50, tension: 0.3 }));

    add(makeRope([
      { x: -s * 0.58, y: 0, z: zUp },
      { x: -s * 0.15, y: 0, z: zUp }
    ], ROPE_COLOR, ROPE_RADIUS, { textureRepeat: 4, tubularSegments: 50, tension: 0.3 }));

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
    arrow.position.set(-s * 0.15, -s * 0.62, zDown + 0.2);
    arrow.rotation.z = Math.PI * 0.65;
    add(arrow);

    return meshes;
  }

  function buildLeftEarWeave() {
    var meshes = buildFullKnotShape(0.65);
    return meshes;
  }

  function buildAdjust() { return buildFullKnotShape(0.88); }

  function buildFinal() {
    var meshes = buildFullKnotShape(1.0);
    var add = function (m) { ropeGroup().add(m); meshes.push(m); };

    var charm = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.03, 8, 16),
      new THREE.MeshStandardMaterial({ color: new THREE.Color('#FFD700'), roughness: 0.25, metalness: 0.7, emissive: new THREE.Color('#FFA500'), emissiveIntensity: 0.3 })
    );
    charm.position.set(0.75, 0.55, 0.22);
    add(charm);

    return meshes;
  }

  function animCross(onDone) {
    var fullPath = buildFullPath(0.85);
    var crossPts = sampleCurvePts(fullPath, 0, 0.15, 120);
    Knots3D.anim.startGrowAnim(2, crossPts, ROPE_COLOR, ROPE_RADIUS, 1000, function () {
      var meshes = buildCross();
      Knots3D.anim.recordStepMeshes(2, meshes);
      if (onDone) onDone();
    });
  }

  function animThreeEars(onDone) {
    Knots3D.anim.startStepAnim(3, [], [], 900, function () {
      var meshes = buildThreeEars();
      Knots3D.anim.recordStepMeshes(3, meshes);
      if (onDone) onDone();
    });
  }

  function animTopEar(onDone) {
    Knots3D.anim.startStepAnim(4, [], [], 900, function () {
      var meshes = buildTopEarWeave();
      Knots3D.anim.recordStepMeshes(4, meshes);
      if (onDone) onDone();
    });
  }

  function animRightEar(onDone) {
    Knots3D.anim.startStepAnim(5, [], [], 1000, function () {
      var meshes = buildRightEarWeave();
      Knots3D.anim.recordStepMeshes(5, meshes);
      if (onDone) onDone();
    });
  }

  function animLeftEar(onDone) {
    Knots3D.anim.startStepAnim(6, [], [], 900, function () {
      var meshes = buildLeftEarWeave();
      Knots3D.anim.recordStepMeshes(6, meshes);
      if (onDone) onDone();
    });
  }

  function buildJiXiangShape(t) { return buildFullKnotShape(t); }

  Knots3D.register('ji-xiang', {
    builders: [
      buildPreview, buildMaterials, buildCross, buildThreeEars, buildTopEarWeave,
      buildRightEarWeave, buildLeftEarWeave, buildAdjust, buildFinal
    ],
    cameras: [
      CAM.preview, CAM.material, CAM.cross, CAM.threeEars, CAM.topEar,
      CAM.rightEar, CAM.leftEar, CAM.adjust, CAM.final
    ],
    anims: { 2: animCross, 3: animThreeEars, 4: animTopEar, 5: animRightEar, 6: animLeftEar },
    tightenStep: 7,
    tightenBuilder: buildJiXiangShape,
    interactions: { threadStep: 5, tightenStep: 7 }
  });

})();
