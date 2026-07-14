/**
 * scene3d-core.js - 非遗福结 3D 引擎核心
 *
 * 职责：场景初始化、渲染循环、相机/光照、天空盒、OrbitControls、动画系统
 * 依赖：three.min.js
 * 被依赖：scene3d-builders.js, scene3d-game.js
 */
var Scene3D = {};

/* 共享内部状态（各子模块通过 Scene3D._ 访问） */
Scene3D._ = {
  renderer: null, scene: null, camera: null, controls: null, animId: null,
  containerEl: null, ropeGroup: null, particleGroup: null, celebrationGroup: null,
  W: 500, H: 340, clock: new THREE.Clock(),

  // 动画系统（core 管理）
  camAnim: {
    active: false, startPos: null, endPos: null,
    startTarget: null, endTarget: null,
    t: 0, duration: 700, onComplete: null
  },
  fadeInQueue: [],

  // 步骤状态（builders 管理，core 读取）
  currentStep: -1,
  stepMeshes: {},

  // 跨模块回调
  frameCallbacks: [],   // 每帧调用
  disposeCallbacks: []  // dispose 时调用
};

(function (S) {
  'use strict';
  var _ = S._;

  /* ==================== 内置 OrbitControls ==================== */
  function createOrbitControls(camera, domElement) {
    var scope = {
      object: camera, domElement: domElement, enabled: true,
      target: new THREE.Vector3(), minDistance: 0, maxDistance: Infinity,
      minPolarAngle: 0, maxPolarAngle: Math.PI,
      enableZoom: true, enableRotate: true, enablePan: true,
      zoomSpeed: 1.0, rotateSpeed: 1.0, panSpeed: 1.0,
      enableDamping: true, dampingFactor: 0.08,
      autoRotate: false, autoRotateSpeed: 0.4
    };
    var sph = { r: 1, phi: Math.PI / 2, theta: 0 };
    var dPhi = 0, dTheta = 0, scale = 1;
    var panOff = new THREE.Vector3();
    var rot = false, pan = false, lx = 0, ly = 0;

    var off = new THREE.Vector3().copy(scope.object.position).sub(scope.target);
    sph.r = off.length();
    sph.phi = Math.acos(Math.max(-1, Math.min(1, off.y / sph.r)));
    sph.theta = Math.atan2(off.x, off.z);

    function apply() {
      sph.theta += dTheta * scope.rotateSpeed;
      sph.phi += dPhi * scope.rotateSpeed;
      sph.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, sph.phi));
      sph.r *= scale;
      sph.r = Math.max(scope.minDistance, Math.min(scope.maxDistance, sph.r));
      scope.object.position.set(
        sph.r * Math.sin(sph.phi) * Math.sin(sph.theta),
        sph.r * Math.cos(sph.phi),
        sph.r * Math.sin(sph.phi) * Math.cos(sph.theta)
      ).add(panOff).add(scope.target);
      scope.object.lookAt(scope.target);
      dTheta = 0; dPhi = 0; scale = 1; panOff.set(0, 0, 0);
    }

    function update() {
      if (!scope.enableDamping || !scope.enabled) { apply(); return; }
      dTheta *= (1 - scope.dampingFactor);
      dPhi *= (1 - scope.dampingFactor);
      if (Math.abs(dTheta) < 0.0001 && Math.abs(dPhi) < 0.0001 && scale === 1) return;
      apply();
    }
    scope.update = update;

    domElement.addEventListener('mousedown', function (e) {
      if (!scope.enabled) return; e.preventDefault();
      lx = e.clientX; ly = e.clientY;
      if (e.button === 0) rot = true; else if (e.button === 2) pan = true;
    });
    domElement.addEventListener('mousemove', function (e) {
      if (!scope.enabled) return;
      var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      if (rot && scope.enableRotate) { dTheta -= dx * 0.005; dPhi -= dy * 0.005; }
      else if (pan && scope.enablePan) { var dist = sph.r * 0.001 * scope.panSpeed; panOff.x -= dx * dist; panOff.y += dy * dist; }
    });
    domElement.addEventListener('mouseup', function () { rot = false; pan = false; });
    domElement.addEventListener('mouseleave', function () { rot = false; pan = false; });
    domElement.addEventListener('wheel', function (e) {
      if (!scope.enabled || !scope.enableZoom) return; e.preventDefault();
      scale *= e.deltaY < 0 ? 0.95 : 1.05;
    }, { passive: false });
    domElement.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    domElement.addEventListener('touchstart', function (e) {
      if (!scope.enabled || !e.touches.length) return; e.preventDefault();
      if (e.touches.length === 1) { rot = true; lx = e.touches[0].clientX; ly = e.touches[0].clientY; }
    }, { passive: false });
    domElement.addEventListener('touchmove', function (e) {
      if (!scope.enabled || !rot || !e.touches.length) return; e.preventDefault();
      var dx = e.touches[0].clientX - lx, dy = e.touches[0].clientY - ly;
      lx = e.touches[0].clientX; ly = e.touches[0].clientY;
      dTheta -= dx * 0.008; dPhi -= dy * 0.008;
    }, { passive: false });
    domElement.addEventListener('touchend', function () { rot = false; });

    return scope;
  }

  /* ==================== 兼容辅助 ==================== */
  function getSRGB() {
    if (typeof THREE.SRGBColorSpace !== 'undefined') return THREE.SRGBColorSpace;
    if (typeof THREE.sRGBEncoding !== 'undefined') return THREE.sRGBEncoding;
    return 3001;
  }
  function getToneMapping() {
    if (typeof THREE.ACESFilmicToneMapping !== 'undefined') return THREE.ACESFilmicToneMapping;
    if (typeof THREE.CineonToneMapping !== 'undefined') return THREE.CineonToneMapping;
    return 4;
  }

  /* ==================== 天空盒 ==================== */
  function createSkyTexture() {
    var cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
    var cx = cv.getContext('2d');
    var gd = cx.createLinearGradient(0, 0, 0, 512);
    gd.addColorStop(0, '#0f1729');
    gd.addColorStop(0.2, '#1a2744');
    gd.addColorStop(0.45, '#c9a86c');
    gd.addColorStop(0.7, '#f5e6d3');
    gd.addColorStop(1, '#fef6ee');
    cx.fillStyle = gd; cx.fillRect(0, 0, 512, 512);
    cx.globalAlpha = 0.06;
    for (var i = 0; i < 10; i++) {
      var rx = Math.random() * 512, ry = 80 + Math.random() * 280, rr = 50 + Math.random() * 140;
      var cg = cx.createRadialGradient(rx, ry, 0, rx, ry, rr);
      cg.addColorStop(0, '#fff'); cg.addColorStop(1, 'transparent');
      cx.fillStyle = cg; cx.fillRect(rx - rr, ry - rr, rr * 2, rr * 2);
    }
    cx.globalAlpha = 0.7;
    for (var j = 0; j < 40; j++) {
      cx.beginPath();
      cx.arc(Math.random() * 512, Math.random() * 160, 0.3 + Math.random() * 1.2, 0, Math.PI * 2);
      cx.fillStyle = '#fffbe8'; cx.fill();
    }
    var tex = new THREE.CanvasTexture(cv); tex.colorSpace = getSRGB();
    return tex;
  }

  /* ==================== 环境粒子 ==================== */
  function addAmbientParticles(scn) {
    var cnt = 60, pos = new Float32Array(cnt * 3);
    for (var i = 0; i < cnt; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({
      color: 0xFFD700, size: 0.04, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending || 2, depthWrite: false, sizeAttenuation: true
    });
    _.particleGroup = new THREE.Points(geo, mat);
    _.particleGroup.userData.isAmbient = true;
    scn.add(_.particleGroup);
  }

  /* ==================== 初始化 ==================== */
  S.init = function (container, width, height) {
    if (!container) return;

    if (typeof THREE === 'undefined') {
      container.innerHTML = '<div style="text-align:center;color:#c41e3a;padding:40px;font-size:14px;">' +
        '<p>Three.js 加载失败</p><p style="font-size:12px;color:#666;">请刷新页面重试</p></div>';
      return;
    }

    console.log('[Scene3D] Init, THREE r' + THREE.REVISION, width + 'x' + height);

    if (_.renderer && _.containerEl === container) {
      S.resize(width, height);
      return;
    }

    container.innerHTML = '';
    S.dispose();
    _.containerEl = container;
    _.W = width || 500; _.H = height || 340;

    try {
      _.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      _.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      _.renderer.setSize(_.W, _.H);
      _.renderer.shadowMap.enabled = true;
      _.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (_.renderer.outputColorSpace !== undefined) _.renderer.outputColorSpace = getSRGB();
      else _.renderer.outputEncoding = getSRGB();
      if (_.renderer.toneMapping !== undefined) {
        _.renderer.toneMapping = getToneMapping();
        _.renderer.toneMappingExposure = 0.85;
      }
      container.appendChild(_.renderer.domElement);
    } catch (e) {
      container.innerHTML = '<div style="text-align:center;color:#c41e3a;padding:40px;">WebGL不可用</div>';
      return;
    }

    _.scene = new THREE.Scene();
    _.scene.background = createSkyTexture();
    addAmbientParticles(_.scene);

    _.celebrationGroup = new THREE.Group();
    _.scene.add(_.celebrationGroup);

    _.camera = new THREE.PerspectiveCamera(42, _.W / _.H, 0.5, 50);
    _.camera.position.set(0, 0.3, 8.5);

    _.controls = createOrbitControls(_.camera, _.renderer.domElement);
    _.controls.target.set(0, -0.3, 0);
    _.controls.enableDamping = true;
    _.controls.dampingFactor = 0.06;
    _.controls.minDistance = 3.5;
    _.controls.maxDistance = 16;
    _.controls.maxPolarAngle = Math.PI * 0.72;
    _.controls.autoRotate = true;
    _.controls.autoRotateSpeed = 0.3;
    _.controls.update();

    // Lights
    _.scene.add(new THREE.AmbientLight('#fff5ee', 0.85));
    var keyLight = new THREE.DirectionalLight('#ffffff', 1.8);
    keyLight.position.set(5, 7, 8);
    keyLight.castShadow = true;
    if (keyLight.shadow && keyLight.shadow.mapSize) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
    }
    _.scene.add(keyLight);

    var fillLight = new THREE.DirectionalLight('#ffccaa', 0.6);
    fillLight.position.set(-3, 1, -2);
    _.scene.add(fillLight);

    var rimLight = new THREE.DirectionalLight('#ffffff', 0.5);
    rimLight.position.set(0, -1, 3);
    _.scene.add(rimLight);

    var bottomLight = new THREE.DirectionalLight('#ffe4b5', 0.3);
    bottomLight.position.set(2, -2, -4);
    _.scene.add(bottomLight);

    _.ropeGroup = new THREE.Group();
    _.scene.add(_.ropeGroup);

    var shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.ShadowMaterial({ opacity: 0.1 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -4.5;
    shadowPlane.receiveShadow = true;
    _.scene.add(shadowPlane);

    // 重置状态
    _.stepMeshes = {};
    _.currentStep = -1;
    _.camAnim.active = false;
    _.fadeInQueue = [];

    _.clock.start();
    S.animate();
  };

  /* ==================== 动画循环 ==================== */
  S.animate = function () {
    if (!_.renderer || !_.scene || !_.camera) return;
    _.animId = requestAnimationFrame(S.animate);

    var dt = _.clock.getDelta();

    if (_.controls) _.controls.update();
    if (_.particleGroup) _.particleGroup.rotation.y += dt * 0.03;
    if (_.camAnim.active) updateCamAnim(dt);

    // 调用子模块注册的帧回调
    for (var i = 0; i < _.frameCallbacks.length; i++) {
      _.frameCallbacks[i](dt, _.clock.elapsedTime);
    }

    // 绳结微动
    if (_.ropeGroup && !_.camAnim.active && _.currentStep >= 0) {
      _.ropeGroup.rotation.z = Math.sin(_.clock.elapsedTime * 0.8) * 0.003;
    }

    try { _.renderer.render(_.scene, _.camera); } catch (e) {}
  };

  /* ==================== 相机动画 ==================== */
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function updateCamAnim(dt) {
    _.camAnim.t += dt * 1000 / _.camAnim.duration;
    if (_.camAnim.t >= 1) _.camAnim.t = 1;

    var et = easeOutCubic(_.camAnim.t);
    _.camera.position.lerpVectors(_.camAnim.startPos, _.camAnim.endPos, et);
    if (_.controls) _.controls.target.lerpVectors(_.camAnim.startTarget, _.camAnim.endTarget, et);

    if (_.camAnim.t >= 1) {
      _.camAnim.active = false;
      if (typeof _.camAnim.onComplete === 'function') {
        var cb = _.camAnim.onComplete;
        _.camAnim.onComplete = null;
        cb();
      }
    }
  }

  function animateCamera(toPos, toTarget, duration, onDone) {
    _.camAnim.startPos = _.camera.position.clone();
    _.camAnim.endPos = new THREE.Vector3(toPos.x, toPos.y, toPos.z);
    _.camAnim.startTarget = _.controls ? _.controls.target.clone() : new THREE.Vector3(0, -0.3, 0);
    _.camAnim.endTarget = new THREE.Vector3(toTarget.x, toTarget.y, toTarget.z);
    _.camAnim.t = 0;
    _.camAnim.duration = duration || 700;
    _.camAnim.onComplete = onDone || null;
    _.camAnim.active = true;
  }
  // 暴露给子模块
  S._.animateCamera = animateCamera;

  /* ==================== 淡入动画 ==================== */
  function updateFadeIn(dt) {
    var speed = 2.5;
    var remaining = [];
    for (var i = 0; i < _.fadeInQueue.length; i++) {
      var item = _.fadeInQueue[i];
      item.opacity += dt * speed;
      if (item.opacity >= 1) {
        item.opacity = 1;
        setItemOpacity(item.obj, 1);
      } else {
        setItemOpacity(item.obj, item.opacity);
        remaining.push(item);
      }
    }
    _.fadeInQueue = remaining;
  }

  function setItemOpacity(obj, op) {
    if (obj.isMesh && obj.material) {
      obj.material.transparent = op < 1;
      obj.material.opacity = op;
      obj.material.needsUpdate = true;
      obj.visible = op > 0.01;
    } else if (obj.isGroup || obj.children) {
      obj.traverse(function (child) {
        if (child.isMesh && child.material) {
          child.material.transparent = op < 1;
          child.material.opacity = op;
          child.material.needsUpdate = true;
          child.visible = op > 0.01;
        }
      });
    }
  }

  function queueFadeIn(obj) {
    setItemOpacity(obj, 0);
    _.fadeInQueue.push({ obj: obj, opacity: 0 });
  }

  // 暴露给子模块
  S._.setItemOpacity = setItemOpacity;
  S._.queueFadeIn = queueFadeIn;
  S._.updateFadeIn = updateFadeIn;

  // 注册淡入为帧回调
  _.frameCallbacks.push(updateFadeIn);

  /* ==================== 工具函数 ==================== */
  function disposeObj(obj) {
    if (!obj) return;
    obj.children && obj.children.slice().forEach(disposeObj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(function (m) { m.dispose(); });
      else obj.material.dispose();
    }
  }
  S._.disposeObj = disposeObj;

  /* ==================== 公共 API ==================== */
  S.dispose = function () {
    if (_.animId) { cancelAnimationFrame(_.animId); _.animId = null; }
    // 调用子模块注册的清理回调
    for (var i = 0; i < _.disposeCallbacks.length; i++) {
      _.disposeCallbacks[i]();
    }
    if (_.renderer) {
      if (_.renderer.domElement && _.renderer.domElement.parentNode)
        _.renderer.domElement.parentNode.removeChild(_.renderer.domElement);
      _.renderer.dispose();
      _.renderer = null;
    }
    _.ropeGroup = null; _.scene = null; _.camera = null;
    _.controls = null; _.containerEl = null;
    _.currentStep = -1;
    _.camAnim.active = false;
    _.fadeInQueue = [];
  };

  S.resize = function (w, h) {
    if (!_.camera || !_.renderer) return;
    _.W = w; _.H = h;
    _.camera.aspect = w / h;
    _.camera.updateProjectionMatrix();
    _.renderer.setSize(w, h);
  };

})(Scene3D);
