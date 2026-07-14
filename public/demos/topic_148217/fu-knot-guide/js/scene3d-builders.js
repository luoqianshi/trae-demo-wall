/**
 * scene3d-builders.js - 非遗福结 3D 调度器 & 工具库
 *
 * 职责：
 *   1. 提供 Knots3D 注册中心，各绳结文件通过 Knots3D.register(id, impl) 注册
 *   2. 提供通用构建工具（makeRope/makeBead/makeTassel）供各绳结文件复用
 *   3. 提供编织动画引擎（startStepAnim/lerpPts/rebuildRopeGeo 等）
 *   4. 实现 Scene3D.renderStep / goToStep 调度：根据 knotId 查找对应实现
 *
 * 各绳结文件接口：
 *   Knots3D.register('fu-jie', {
 *     builders: [fn, fn, ...],   // 每个步骤的构建函数，返回 mesh 数组
 *     cameras:  [{pos, target}, ...], // 每个步骤的相机位置
 *     anims: { 2: fn(onDone), 3: fn(onDone), ... }  // 步骤动画（可选）
 *   });
 */
var Knots3D = Knots3D || {};

(function (S) {
  'use strict';
  var _ = S._;

  /* ==================== 注册中心 ==================== */
  var registry = {};
  var currentKnotId = null;

  /**
   * 注册绳结 3D 实现
   * @param {string} id - 绳结 id（与 data.js 中的 id 对应）
   * @param {Object} impl - 实现 { builders, cameras, anims }
   */
  Knots3D.register = function (id, impl) {
    registry[id] = impl;
    console.log('[Knots3D] registered:', id);
  };

  /** 获取绳结实现 */
  Knots3D.get = function (id) {
    return registry[id] || null;
  };

  /** 设置当前绳结 */
  Knots3D.setCurrent = function (id) {
    currentKnotId = id;
  };

  Knots3D.getCurrent = function () {
    return currentKnotId;
  };

  /** 获取当前实现（若无则返回第一个注册的，作为 fallback） */
  function currentImpl() {
    if (currentKnotId && registry[currentKnotId]) return registry[currentKnotId];
    // fallback：取第一个注册的
    var keys = Object.keys(registry);
    if (keys.length) {
      currentKnotId = keys[0];
      return registry[currentKnotId];
    }
    return null;
  }

  /* ==================== 通用构建工具 ====================
   * 这些工具函数供所有绳结文件复用
   */

  /* ---------- 绳纹纹理生成器 ---------- */
  var _ropeTextureCache = {};

  function createRopeTexture(baseColor, twistCount, thickness) {
    twistCount = twistCount || 8;
    thickness = thickness || 0.35;
    baseColor = baseColor || '#C41E3A';

    var cacheKey = baseColor + '_' + twistCount + '_' + thickness;
    if (_ropeTextureCache[cacheKey]) return _ropeTextureCache[cacheKey];

    var cv = document.createElement('canvas');
    cv.width = 256; cv.height = 64;
    var ctx = cv.getContext('2d');

    var base = new THREE.Color(baseColor);
    var dark = base.clone().multiplyScalar(0.65);
    var light = base.clone().multiplyScalar(1.15).lerp(new THREE.Color(0xffffff), 0.15);
    var highlight = base.clone().lerp(new THREE.Color(0xffd700), 0.1);

    function c2h(c) {
      return '#' + c.getHexString();
    }

    var bg = ctx.createLinearGradient(0, 0, 0, 64);
    bg.addColorStop(0, c2h(dark));
    bg.addColorStop(0.5, c2h(base));
    bg.addColorStop(1, c2h(dark));
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 64);

    var strands = 3;
    var strandH = 64 / strands * 1.4;
    for (var s = 0; s < strands; s++) {
      var sg = ctx.createLinearGradient(0, s * 20 - 5, 0, s * 20 + strandH);
      sg.addColorStop(0, 'transparent');
      sg.addColorStop(0.3, c2h(light) + 'cc');
      sg.addColorStop(0.5, c2h(highlight) + '88');
      sg.addColorStop(0.7, c2h(light) + 'cc');
      sg.addColorStop(1, 'transparent');
      ctx.fillStyle = sg;
      ctx.beginPath();
      var offset = s * 85;
      for (var x = -60; x < 320; x += 2) {
        var y = 32 + Math.sin((x + offset) / 40 * Math.PI) * 18 + (s - 1) * 6;
        if (x === -60) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineWidth = strandH * thickness;
      ctx.strokeStyle = sg;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    ctx.globalAlpha = 0.15;
    for (var i = 0; i < 200; i++) {
      var fx = Math.random() * 256;
      var fy = Math.random() * 64;
      ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
      ctx.fillRect(fx, fy, 1, 1);
    }
    ctx.globalAlpha = 1;

    var tex = new THREE.CanvasTexture(cv);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(twistCount, 1);
    if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace || 3001;

    _ropeTextureCache[cacheKey] = tex;
    return tex;
  }

  function createRopeNormalMap() {
    if (_ropeTextureCache['_normal']) return _ropeTextureCache['_normal'];
    var cv = document.createElement('canvas');
    cv.width = 256; cv.height = 64;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, 256, 64);
    ctx.globalAlpha = 0.25;
    for (var s = 0; s < 3; s++) {
      var offset = s * 85;
      ctx.beginPath();
      for (var x = -60; x < 320; x += 2) {
        var y = 32 + Math.sin((x + offset) / 40 * Math.PI) * 18 + (s - 1) * 6;
        if (x === -60) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#c0c0ff';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    var tex = new THREE.CanvasTexture(cv);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 1);
    _ropeTextureCache['_normal'] = tex;
    return tex;
  }

  function makeRope(pts, colorHex, radius, options) {
    radius = radius || 0.11;
    colorHex = colorHex || '#C41E3A';
    options = options || {};

    var tubularSegments = options.tubularSegments || 160;
    var radialSegments = options.radialSegments || 20;
    var tension = options.tension !== undefined ? options.tension : 0.35;
    var closed = options.closed || false;
    var useTexture = options.useTexture !== false;
    var textureRepeat = options.textureRepeat || 12;
    var curveType = options.curveType || 'centripetal';
    var useNormalMap = options.useNormalMap !== false;

    var vpts = pts.map(function (p) { return new THREE.Vector3(p.x, p.y, p.z); });

    if (closed && vpts.length > 2) {
      var first = vpts[0];
      var last = vpts[vpts.length - 1];
      if (first.distanceTo(last) > 0.001) {
        vpts.push(first.clone());
      }
    }

    var curve = new THREE.CatmullRomCurve3(vpts, closed, curveType, tension);
    var geo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed);

    var matParams = {
      color: new THREE.Color(colorHex),
      roughness: 0.35,
      metalness: 0.05
    };

    if (useTexture) {
      var tex = createRopeTexture(colorHex);
      tex = tex.clone();
      tex.repeat.set(textureRepeat, 1);
      tex.needsUpdate = true;
      matParams.map = tex;
      matParams.roughness = 0.4;
    }

    if (useNormalMap && useTexture) {
      var normalTex = createRopeNormalMap();
      normalTex = normalTex.clone();
      normalTex.repeat.set(textureRepeat, 1);
      normalTex.needsUpdate = true;
      matParams.normalMap = normalTex;
      matParams.normalScale = new THREE.Vector2(0.15, 0.15);
    }

    var mat = new THREE.MeshStandardMaterial(matParams);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.userData.radius = radius;
    mesh.userData.colorHex = colorHex;
    mesh.userData.options = options;
    return mesh;
  }

  function rebuildRopeGeo(mesh, pts, radius) {
    if (mesh.geometry) mesh.geometry.dispose();
    radius = radius || mesh.userData.radius || 0.11;
    var colorHex = mesh.userData.colorHex || '#C41E3A';
    var options = mesh.userData.options || {};
    var vpts = pts.map(function (p) { return new THREE.Vector3(p.x, p.y, p.z); });
    var curveType = options.curveType || 'centripetal';
    var tension = options.tension !== undefined ? options.tension : 0.35;
    var tubularSegments = options.tubularSegments || 160;
    var radialSegments = options.radialSegments || 20;
    var curve = new THREE.CatmullRomCurve3(vpts, false, curveType, tension);
    mesh.geometry = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
  }

  function sampleCurvePts(pts, startT, endT, segCount, options) {
    options = options || {};
    var curveType = options.curveType || 'centripetal';
    var tension = options.tension !== undefined ? options.tension : 0.35;
    var closed = options.closed || false;
    segCount = segCount || 100;

    var vpts = pts.map(function (p) { return new THREE.Vector3(p.x, p.y, p.z); });
    var curve = new THREE.CatmullRomCurve3(vpts, closed, curveType, tension);

    var result = [];
    var tStart = Math.max(0, Math.min(1, startT));
    var tEnd = Math.max(0, Math.min(1, endT));
    if (tStart === tEnd) {
      var p = curve.getPointAt(tStart);
      return [{ x: p.x, y: p.y, z: p.z }];
    }

    var steps = Math.max(2, Math.round(segCount * Math.abs(tEnd - tStart)));
    for (var i = 0; i <= steps; i++) {
      var t = tStart + (tEnd - tStart) * (i / steps);
      var pt = curve.getPointAt(t);
      result.push({ x: pt.x, y: pt.y, z: pt.z });
    }
    return result;
  }

  function partialRope(pts, startT, endT, colorHex, radius, options) {
    options = options || {};
    var segCount = options.tubularSegments || 160;
    var sampledPts = sampleCurvePts(pts, startT, endT, segCount, options);
    var ropeOpts = {};
    for (var key in options) {
      if (options.hasOwnProperty(key)) ropeOpts[key] = options[key];
    }
    ropeOpts.tubularSegments = Math.max(8, Math.round(segCount * Math.abs(endT - startT)));
    return makeRope(sampledPts, colorHex, radius, ropeOpts);
  }

  function makeContinuousRope(segments, colorHex, radius, options) {
    var allPts = [];
    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      for (var j = 0; j < seg.length; j++) {
        if (i > 0 && j === 0) continue;
        allPts.push(seg[j]);
      }
    }
    return makeRope(allPts, colorHex, radius, options);
  }

  function loopPts(cx, cy, cz, r, startAngle, endAngle, heightOffset, segments) {
    segments = segments || 32;
    heightOffset = heightOffset || 0;
    var pts = [];
    for (var i = 0; i <= segments; i++) {
      var t = i / segments;
      var a = startAngle + (endAngle - startAngle) * t;
      var h = heightOffset * Math.sin((a - startAngle) / (endAngle - startAngle) * Math.PI);
      pts.push({
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r,
        z: cz + h
      });
    }
    return pts;
  }

  function weavePts(points, zPattern, zDepth) {
    zDepth = zDepth || 0.25;
    return points.map(function (p, i) {
      var patternIdx = i % zPattern.length;
      var zOffset = zPattern[patternIdx] * zDepth;
      return {
        x: p.x,
        y: p.y,
        z: (p.z || 0) + zOffset
      };
    });
  }

  function overUnderPts(basePts, pattern, zDepth) {
    zDepth = zDepth !== undefined ? zDepth : 0.2;
    var n = basePts.length;
    if (n === 0 || !pattern || pattern.length === 0) return basePts.slice();

    var segCount = pattern.length;
    var segLen = (n - 1) / segCount;

    var zOffsets = [];
    for (var i = 0; i < n; i++) {
      var segIdx = Math.floor(i / segLen);
      if (segIdx >= segCount) segIdx = segCount - 1;
      var segStart = segIdx * segLen;
      var segEnd = (segIdx + 1) * segLen;
      var t = (i - segStart) / (segEnd - segStart);
      var smoothT = 0.5 - 0.5 * Math.cos(t * Math.PI);

      var currZ = pattern[segIdx] * zDepth;
      var nextIdx = (segIdx + 1) % segCount;
      var nextZ = pattern[nextIdx] * zDepth;

      var zOffset = currZ + (nextZ - currZ) * smoothT;
      zOffsets.push(zOffset);
    }

    return basePts.map(function (p, i) {
      return {
        x: p.x,
        y: p.y,
        z: (p.z || 0) + zOffsets[i]
      };
    });
  }

  function smoothConnect(segments, blendRadius) {
    blendRadius = blendRadius || 8;
    if (!segments || segments.length === 0) return [];
    if (segments.length === 1) return segments[0].slice();

    var result = [];

    for (var s = 0; s < segments.length; s++) {
      var seg = segments[s];
      if (!seg || seg.length === 0) continue;

      if (s === 0) {
        var takeEnd = Math.min(seg.length - 1, blendRadius);
        for (var i = 0; i <= seg.length - takeEnd - 1; i++) {
          result.push(seg[i]);
        }
      } else {
        var prevSeg = segments[s - 1];
        if (!prevSeg || prevSeg.length === 0) continue;

        var prevTake = Math.min(prevSeg.length - 1, blendRadius);
        var currTake = Math.min(seg.length - 1, blendRadius);
        var minTake = Math.min(prevTake, currTake);

        var prevStartIdx = prevSeg.length - minTake - 1;
        var p0 = prevSeg[prevStartIdx];
        var p1 = prevSeg[prevSeg.length - 1];
        var p2 = seg[0];
        var p3 = seg[minTake];

        var vpts0 = new THREE.Vector3(p0.x, p0.y, p0.z);
        var vpts1 = new THREE.Vector3(p1.x, p1.y, p1.z);
        var vpts2 = new THREE.Vector3(p2.x, p2.y, p2.z);
        var vpts3 = new THREE.Vector3(p3.x, p3.y, p3.z);

        var curve = new THREE.CubicBezierCurve3(vpts1, vpts1, vpts2, vpts2);
        var blendSteps = minTake * 2;
        for (var b = 1; b <= blendSteps; b++) {
          var bt = b / blendSteps;
          var pt = curve.getPoint(bt);
          result.push({ x: pt.x, y: pt.y, z: pt.z });
        }

        var restStart = minTake;
        var restEnd = seg.length - 1;
        if (s < segments.length - 1) {
          restEnd = seg.length - minTake - 1;
        }
        for (var j = restStart; j <= restEnd; j++) {
          result.push(seg[j]);
        }
      }
    }

    return result;
  }

  function earLoopPts(cx, cy, cz, width, height, direction, zBase) {
    zBase = zBase !== undefined ? zBase : (cz || 0);
    var segments = 48;
    var pts = [];

    var dirAngle = 0;
    if (direction === 'up') dirAngle = -Math.PI / 2;
    else if (direction === 'down') dirAngle = Math.PI / 2;
    else if (direction === 'left') dirAngle = Math.PI;
    else if (direction === 'right') dirAngle = 0;

    var cosA = Math.cos(dirAngle);
    var sinA = Math.sin(dirAngle);

    for (var i = 0; i <= segments; i++) {
      var t = i / segments;
      var angle = (t - 0.5) * Math.PI;

      var widthFactor = Math.sin(angle);
      var xOffset = widthFactor * width * 0.5;

      var tipFactor = 1 - Math.abs(widthFactor);
      var yOffset = -tipFactor * height;

      var x = cx + xOffset * cosA - yOffset * sinA;
      var y = cy + xOffset * sinA + yOffset * cosA;

      var zTaper = 1 - tipFactor;
      var z = zBase + zTaper * 0;

      pts.push({ x: x, y: y, z: z });
    }

    return pts;
  }

  function figure8Pts(cx, cy, cz, r, overlap, zDepth) {
    overlap = overlap !== undefined ? overlap : 0.3;
    zDepth = zDepth !== undefined ? zDepth : 0.15;
    var segmentsPerLoop = 48;
    var pts = [];

    var offset = r * (1 - overlap);
    var leftCx = cx - offset;
    var rightCx = cx + offset;

    for (var i = 0; i <= segmentsPerLoop; i++) {
      var t = i / segmentsPerLoop;
      var angle = -Math.PI / 2 + t * Math.PI * 2;
      var x = leftCx + Math.cos(angle) * r;
      var y = cy + Math.sin(angle) * r;
      var z = cz;

      if (t > 0.25 && t < 0.75) {
        var crossT = (t - 0.25) / 0.5;
        var smoothT = 0.5 - 0.5 * Math.cos(crossT * Math.PI);
        z = cz - zDepth * smoothT;
      }

      pts.push({ x: x, y: y, z: z });
    }

    for (var j = 1; j <= segmentsPerLoop; j++) {
      var t2 = j / segmentsPerLoop;
      var angle2 = Math.PI / 2 + t2 * Math.PI * 2;
      var x2 = rightCx + Math.cos(angle2) * r;
      var y2 = cy + Math.sin(angle2) * r;
      var z2 = cz;

      if (t2 > 0.25 && t2 < 0.75) {
        var crossT2 = (t2 - 0.25) / 0.5;
        var smoothT2 = 0.5 - 0.5 * Math.cos(crossT2 * Math.PI);
        z2 = cz + zDepth * smoothT2;
      }

      pts.push({ x: x2, y: y2, z: z2 });
    }

    return pts;
  }

  function symmetricPts(pts, axis) {
    axis = axis || 'x';
    return pts.map(function (p) {
      var np = { x: p.x, y: p.y, z: p.z };
      if (axis === 'x') np.x = -p.x;
      else if (axis === 'y') np.y = -p.y;
      else if (axis === 'z') np.z = -p.z;
      return np;
    });
  }

  function lerpPtsArr(from, to, t) {
    return from.map(function (p, i) {
      return {
        x: p.x + (to[i].x - p.x) * t,
        y: p.y + (to[i].y - p.y) * t,
        z: p.z + (to[i].z - p.z) * t
      };
    });
  }

  function resamplePtsAlongPath(pts, count, options) {
    count = count || 100;
    if (pts.length < 2) return pts.slice();
    return sampleCurvePts(pts, 0, 1, count, options);
  }

  function lerpPtsAlongPath(fromPts, toPts, t, options) {
    options = options || {};
    var sampleCount = options.sampleCount || 120;

    var fromSampled = resamplePtsAlongPath(fromPts, sampleCount, options);
    var toSampled = resamplePtsAlongPath(toPts, sampleCount, options);

    var result = [];
    for (var i = 0; i < fromSampled.length; i++) {
      var fp = fromSampled[i];
      var tp = toSampled[i];
      result.push({
        x: fp.x + (tp.x - fp.x) * t,
        y: fp.y + (tp.y - fp.y) * t,
        z: fp.z + (tp.z - fp.z) * t
      });
    }
    return result;
  }

  function circlePts(cx, cy, cz, r, segments) {
    segments = segments || 48;
    var pts = [];
    for (var i = 0; i <= segments; i++) {
      var a = (i / segments) * Math.PI * 2;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, z: cz });
    }
    return pts;
  }

  function arcPts(cx, cy, cz, r, startAngle, endAngle, segments) {
    segments = segments || 24;
    var pts = [];
    for (var i = 0; i <= segments; i++) {
      var a = startAngle + (endAngle - startAngle) * (i / segments);
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, z: cz });
    }
    return pts;
  }

  function spiralPts(cx, cy, cz, rStart, rEnd, height, turns, segments) {
    segments = segments || 80;
    var pts = [];
    for (var i = 0; i <= segments; i++) {
      var t = i / segments;
      var a = t * turns * Math.PI * 2;
      var r = rStart + (rEnd - rStart) * t;
      pts.push({
        x: cx + Math.cos(a) * r,
        y: cy + height * (t - 0.5) * 2,
        z: cz + Math.sin(a) * r
      });
    }
    return pts;
  }

  function smoothJoinPts(p1, p2, p3, smoothness) {
    smoothness = smoothness || 0.5;
    var pts = [];
    var steps = 6;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var m1x = p1.x + (p2.x - p1.x) * (1 - smoothness * 0.5);
      var m1y = p1.y + (p2.y - p1.y) * (1 - smoothness * 0.5);
      var m1z = p1.z + (p2.z - p1.z) * (1 - smoothness * 0.5);
      var m2x = p2.x + (p3.x - p2.x) * (smoothness * 0.5);
      var m2y = p2.y + (p3.y - p2.y) * (smoothness * 0.5);
      var m2z = p2.z + (p3.z - p2.z) * (smoothness * 0.5);
      var q1x = m1x + (m2x - m1x) * t;
      var q1y = m1y + (m2y - m1y) * t;
      var q1z = m1z + (m2z - m1z) * t;
      pts.push({ x: p1.x + (m1x - p1.x) * t + (q1x - (p1.x + (m1x - p1.x) * t)) * t,
                 y: p1.y + (m1y - p1.y) * t + (q1y - (p1.y + (m1y - p1.y) * t)) * t,
                 z: p1.z + (m1z - p1.z) * t + (q1z - (p1.z + (m1z - p1.z) * t)) * t });
    }
    return pts;
  }

  function makeBead(x, y, z, r) {
    r = r || 0.18;
    var geo = new THREE.SphereGeometry(r, 20, 12);
    var mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#D4A843'), roughness: 0.12, metalness: 0.88
    });
    var b = new THREE.Mesh(geo, mat);
    b.position.set(x, y, z); b.castShadow = true;
    return b;
  }

  function makeTassel(x, y, z, lenOrOpts, count) {
    var opts = {};
    if (typeof lenOrOpts === 'object' && lenOrOpts !== null) {
      opts = lenOrOpts;
    } else {
      opts.height = lenOrOpts;
      opts.strandCount = count;
    }
    var height = opts.height || 1.0;
    var strandCount = opts.strandCount || 16;
    var color = opts.color || '#C9A84B';
    var radius = opts.radius || 0.07;
    var grp = new THREE.Group();
    for (var i = 0; i < strandCount; i++) {
      var ang = (i / strandCount) * Math.PI * 2;
      var spr = radius * 0.7 + Math.random() * radius * 0.8;
      var ex = x + Math.cos(ang) * spr;
      var ez = z + Math.sin(ang) * spr;
      var ey = y - height * (0.55 + Math.random() * 0.45);
      var cv = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, y, z),
        new THREE.Vector3((x + ex) / 2, (y + ey) / 2 + 0.05, (z + ez) / 2),
        new THREE.Vector3(ex, ey, ez)
      ]);
      var g = new THREE.TubeGeometry(cv, 5, 0.018, 4, false);
      var m = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color), roughness: 0.45, metalness: 0.25
      });
      grp.add(new THREE.Mesh(g, m));
    }
    grp.add(makeBead(x, y, z, 0.14));
    return grp;
  }

  // 暴露工具给绳结文件使用
  Knots3D.tools = {
    makeRope: makeRope,
    makeBead: makeBead,
    makeTassel: makeTassel,
    makeContinuousRope: makeContinuousRope,
    createRopeTexture: createRopeTexture,
    createRopeNormalMap: createRopeNormalMap,
    circlePts: circlePts,
    arcPts: arcPts,
    spiralPts: spiralPts,
    smoothJoinPts: smoothJoinPts,
    loopPts: loopPts,
    weavePts: weavePts,
    overUnderPts: overUnderPts,
    smoothConnect: smoothConnect,
    earLoopPts: earLoopPts,
    figure8Pts: figure8Pts,
    symmetricPts: symmetricPts,
    lerpPtsArr: lerpPtsArr,
    lerpPtsAlongPath: lerpPtsAlongPath,
    rebuildRopeGeo: rebuildRopeGeo,
    partialRope: partialRope,
    sampleCurvePts: sampleCurvePts,
    resamplePtsAlongPath: resamplePtsAlongPath,
    THREE: THREE
  };

  /* ==================== 编织动画引擎 ====================
   * 通用动画系统，各绳结文件通过 startStepAnim 启动动画
   */

  var stepAnim = {
    active: false,
    t: 0,
    duration: 0,
    ropes: [],
    beads: [],
    onDone: null
  };

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function easeOutBack(t) {
    var c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function lerpPts(from, to, t) {
    return from.map(function (p, i) {
      return {
        x: p.x + (to[i].x - p.x) * t,
        y: p.y + (to[i].y - p.y) * t,
        z: p.z + (to[i].z - p.z) * t
      };
    });
  }

  function updateStepAnim(dt) {
    if (!stepAnim.active) return;

    stepAnim.t += dt * 1000;
    var elapsed = stepAnim.t;
    var allDone = true;

    stepAnim.ropes.forEach(function (r) {
      var localElapsed = elapsed - r.delay;
      if (localElapsed < 0) { allDone = false; return; }
      var localT = Math.min(1, localElapsed / r.duration);
      var et = easeInOutCubic(localT);

      if (localT < 1) allDone = false;

      var pts = lerpPts(r.startPts, r.endPts, et);
      rebuildRopeGeo(r.mesh, pts, r.radius);

      if (localT < 0.3) {
        var drawT = localT / 0.3;
        _.setItemOpacity(r.mesh, drawT);
      } else {
        _.setItemOpacity(r.mesh, 1);
      }
    });

    stepAnim.beads.forEach(function (b) {
      var localElapsed = elapsed - b.delay;
      if (localElapsed < 0) { allDone = false; b.mesh.visible = false; return; }
      var localT = Math.min(1, localElapsed / 600);
      b.mesh.visible = true;
      if (localT < 1) allDone = false;

      var et = easeOutBack(localT);
      b.mesh.position.lerpVectors(b.startPos, b.endPos, et);
      var sc = localT < 1 ? 0.3 + 0.7 * easeOutBack(localT) : 1;
      b.mesh.scale.setScalar(sc);
    });

    if (allDone) {
      stepAnim.active = false;
      if (stepAnim.onDone) {
        var cb = stepAnim.onDone;
        stepAnim.onDone = null;
        cb();
      }
    }
  }

  /**
   * 启动步骤动画（供绳结文件调用）
   * @param {number} stepIdx - 目标步骤
   * @param {Array} ropeAnims - 绳子动画定义
   * @param {Array} beadAnims - 珠子动画定义
   * @param {number} totalDuration - 总时长(ms)
   * @param {Function} onDone - 完成回调
   */
  function startStepAnim(stepIdx, ropeAnims, beadAnims, totalDuration, onDone) {
    var meshes = [];
    stepAnim.ropes = [];
    stepAnim.beads = [];

    ropeAnims.forEach(function (ra) {
      var mesh = makeRope(ra.startPts, ra.color, ra.radius);
      _.ropeGroup.add(mesh);
      meshes.push(mesh);
      _.setItemOpacity(mesh, 0);

      stepAnim.ropes.push({
        mesh: mesh,
        startPts: ra.startPts,
        endPts: ra.endPts,
        radius: ra.radius,
        color: ra.color,
        delay: ra.delay || 0,
        duration: ra.duration || (totalDuration * 0.7)
      });
    });

    if (beadAnims) {
      beadAnims.forEach(function (ba) {
        var bead = makeBead(0, 0, 0, ba.radius || 0.19);
        bead.position.copy(ba.startPos);
        bead.visible = false;
        bead.scale.setScalar(0.01);
        _.ropeGroup.add(bead);
        meshes.push(bead);

        stepAnim.beads.push({
          mesh: bead,
          startPos: ba.startPos.clone(),
          endPos: ba.endPos.clone(),
          delay: ba.delay || 0,
          radius: ba.radius || 0.19
        });
      });
    }

    _.stepMeshes[stepIdx] = meshes;
    stepAnim.active = true;
    stepAnim.t = 0;
    stepAnim.duration = totalDuration;
    stepAnim.onDone = onDone || null;
  }

  var growAnim = {
    active: false,
    startTime: 0,
    duration: 0,
    mesh: null,
    fullPts: null,
    color: null,
    radius: 0,
    stepIdx: 0,
    onDone: null,
    rafId: null
  };

  function startGrowAnim(stepIdx, fullPts, color, radius, duration, onDone) {
    if (growAnim.active) {
      stopGrowAnim();
    }

    var mesh = partialRope(fullPts, 0, 0.001, color, radius);
    _.ropeGroup.add(mesh);
    _.setItemOpacity(mesh, 1);

    _.stepMeshes[stepIdx] = [mesh];

    growAnim.active = true;
    growAnim.startTime = performance.now();
    growAnim.duration = duration || 1500;
    growAnim.mesh = mesh;
    growAnim.fullPts = fullPts;
    growAnim.color = color;
    growAnim.radius = radius;
    growAnim.stepIdx = stepIdx;
    growAnim.onDone = onDone || null;

    function tick() {
      if (!growAnim.active) return;

      var now = performance.now();
      var elapsed = now - growAnim.startTime;
      var t = Math.min(1, elapsed / growAnim.duration);
      var et = easeInOutCubic(t);

      var currentPts = sampleCurvePts(growAnim.fullPts, 0, et, 160);
      rebuildRopeGeo(growAnim.mesh, currentPts, growAnim.radius);

      if (t < 1) {
        growAnim.rafId = requestAnimationFrame(tick);
      } else {
        growAnim.active = false;
        growAnim.rafId = null;
        if (growAnim.onDone) {
          var cb = growAnim.onDone;
          growAnim.onDone = null;
          cb();
        }
      }
    }

    growAnim.rafId = requestAnimationFrame(tick);
  }

  function stopGrowAnim() {
    if (growAnim.rafId) {
      cancelAnimationFrame(growAnim.rafId);
      growAnim.rafId = null;
    }
    growAnim.active = false;
    growAnim.onDone = null;
    growAnim.mesh = null;
    growAnim.fullPts = null;
  }

  // 暴露给绳结文件：用于自定义动画（如 animCross/animThread 中需要静态mesh+动画mesh混合的场景）
  Knots3D.anim = {
    startStepAnim: startStepAnim,
    startGrowAnim: startGrowAnim,
    stopGrowAnim: stopGrowAnim,
    easeInOutCubic: easeInOutCubic,
    easeOutBack: easeOutBack,
    setItemOpacity: function (m, op) { _.setItemOpacity(m, op); },
    queueFadeIn: function (m) { _.queueFadeIn(m); },
    recordStepMeshes: function (stepIdx, arr) { _.stepMeshes[stepIdx] = arr; },
    setRopes: function (arr) { stepAnim.ropes = arr; },
    setBeads: function (arr) { stepAnim.beads = arr; },
    setActive: function (v) { stepAnim.active = v; },
    setT: function (v) { stepAnim.t = v; },
    setDuration: function (v) { stepAnim.duration = v; },
    setOnDone: function (fn) { stepAnim.onDone = fn; },
    isActive: function () { return stepAnim.active; },
    isGrowActive: function () { return growAnim.active; },
    stop: function () { stepAnim.active = false; stepAnim.onDone = null; stepAnim.ropes = []; stepAnim.beads = []; stopGrowAnim(); }
  };

  /* ==================== 步骤管理（调度） ==================== */

  function removeStepsFrom(stepIdx) {
    var maxStep = 20; // 安全上限
    for (var i = stepIdx; i <= maxStep; i++) {
      var list = _.stepMeshes[i];
      if (!list) continue;
      list.forEach(function (m) {
        _.fadeInQueue = _.fadeInQueue.filter(function (item) { return item.obj !== m; });
        if (m.parent) m.parent.remove(m);
        _.disposeObj(m);
      });
      delete _.stepMeshes[i];
    }
    if (stepAnim.active) {
      stepAnim.active = false;
      stepAnim.onDone = null;
    }
    if (growAnim.active) {
      stopGrowAnim();
    }
  }

  function clearAllSteps() {
    var maxStep = 20;
    for (var i = 0; i <= maxStep; i++) {
      var list = _.stepMeshes[i];
      if (!list) continue;
      list.forEach(function (m) {
        if (m.parent) m.parent.remove(m);
        _.disposeObj(m);
      });
    }
    _.stepMeshes = {};
    _.fadeInQueue = [];
    stepAnim.active = false;
    stepAnim.onDone = null;
    stepAnim.ropes = [];
    stepAnim.beads = [];
    stopGrowAnim();
  }

  /** 渲染指定步骤（直接跳转，无动画） */
  S.renderStep = function (stepIdx, totalSteps, knotId) {
    if (!_.ropeGroup || !_.renderer) return;
    if (knotId) Knots3D.setCurrent(knotId);

    var impl = currentImpl();
    if (!impl) { console.warn('[Scene3D] no knot impl registered'); return; }

    clearAllSteps();
    _.currentStep = stepIdx;

    var builder = impl.builders[stepIdx];
    if (builder) {
      var meshes = builder();
      _.stepMeshes[stepIdx] = meshes;
      meshes.forEach(function (m) { _.queueFadeIn(m); });
    }

    var cam = impl.cameras[Math.min(stepIdx, impl.cameras.length - 1)];
    if (cam) {
      _.camera.position.set(cam.pos.x, cam.pos.y, cam.pos.z);
      if (_.controls) _.controls.target.set(cam.target.x, cam.target.y, cam.target.z);
    }
  };

  /** 前进到下一步（带编织动画），后退时直接显示最终状态 */
  S.goToStep = function (fromIdx, toIdx, totalSteps, onDone, knotId) {
    if (!_.ropeGroup || !_.renderer) return;
    if (knotId) Knots3D.setCurrent(knotId);

    var impl = currentImpl();
    if (!impl) { console.warn('[Scene3D] no knot impl registered'); return; }

    if (fromIdx === toIdx) { if (onDone) onDone(); return; }

    stepAnim.active = false;
    stepAnim.onDone = null;

    clearAllSteps();
    _.currentStep = toIdx;

    // 后退：直接构建最终状态，不播放动画
    if (toIdx < fromIdx) {
      var builder = impl.builders[toIdx];
      if (builder) {
        var meshes = builder();
        _.stepMeshes[toIdx] = meshes;
        meshes.forEach(function (m) { _.queueFadeIn(m); });
      }
      var cam = impl.cameras[Math.min(toIdx, impl.cameras.length - 1)];
      if (cam) {
        _.animateCamera(cam.pos, cam.target, 600, onDone);
      } else {
        if (onDone) onDone();
      }
      return;
    }

    // 前进：相机动画（并行）
    var cam = impl.cameras[Math.min(toIdx, impl.cameras.length - 1)];
    var camDone = false;
    var animDone = false;
    var callOnDone = function () {
      if (camDone && animDone && onDone) onDone();
    };

    if (cam) {
      _.animateCamera(cam.pos, cam.target, 800, function () {
        camDone = true;
        callOnDone();
      });
    } else {
      camDone = true;
    }

    // 如果该步骤有动画定义，调用之；否则用 builder 直接构建
    if (impl.anims && impl.anims[toIdx]) {
      impl.anims[toIdx](function () { animDone = true; callOnDone(); });
    } else {
      var builder2 = impl.builders[toIdx];
      if (builder2) {
        var meshes2 = builder2();
        _.stepMeshes[toIdx] = meshes2;
        meshes2.forEach(function (m) { _.queueFadeIn(m); });
      }
      animDone = true;
      callOnDone();
    }
  };

  /** 过渡到步骤（兼容旧 API） */
  S.transitionTo = function (fromIdx, toIdx, totalSteps, onComplete, knotId) {
    S.goToStep(fromIdx, toIdx, totalSteps, onComplete, knotId);
  };

  /** 是否正在过渡 */
  S.isTransitioning = function () {
    return _.camAnim.active || _.fadeInQueue.length > 0 || stepAnim.active;
  };

  /** 收紧步骤动态更新（默认实现：调用 impl.tightenBuilder） */
  S.renderTighten = function (percent) {
    if (!_.ropeGroup) return;
    var impl = currentImpl();
    if (!impl || !impl.tightenBuilder) return;

    // 找到 tighten 步骤索引（默认第5步，可通过 impl.tightenStep 指定）
    var tightenIdx = impl.tightenStep !== undefined ? impl.tightenStep : 5;
    removeStepsFrom(tightenIdx);
    _.currentStep = tightenIdx;

    var t = Math.max(0, Math.min(1, percent / 100));
    var meshes = impl.tightenBuilder(t);
    _.stepMeshes[tightenIdx] = meshes;
  };

  /* ==================== 注册帧/dispose 回调 ==================== */
  _.frameCallbacks.push(updateStepAnim);

  _.disposeCallbacks.push(function () {
    clearAllSteps();
    stepAnim.active = false;
    stepAnim.ropes = [];
    stepAnim.beads = [];
  });

  // 暴露 Knots3D 给全局（绳结文件需要访问）
  S.Knots3D = Knots3D;

})(Scene3D);
