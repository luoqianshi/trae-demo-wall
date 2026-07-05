/* ============================================
   非遗数字展厅 - Three.js 3D 交互
   ============================================ */

(function () {
  const D = WF_DATA;
  let scene, camera, renderer, controls, currentModel, autoRotate = true;
  let animationId;
  let currentIndex = 0;

  /* ===== 简易轨道控制器（兼容 THREE，无外部依赖） ===== */
  function createOrbitControls(camera, domElement, opts) {
    const target = opts.target.clone();
    let distance = camera.position.distanceTo(target);
    let theta = Math.atan2(camera.position.x - target.x, camera.position.z - target.z);
    let phi = Math.acos(Math.min(1, Math.max(-1, (camera.position.y - target.y) / distance)));

    let targetTheta = theta;
    let targetPhi = phi;
    let targetDistance = distance;
    let autoRotate = opts.autoRotate !== false;
    const damping = opts.dampingFactor || 0.1;

    let isDragging = false;
    let prevX = 0, prevY = 0;

    function update() {
      if (autoRotate && !isDragging) {
        targetTheta += (opts.autoRotateSpeed || 1) * 0.002;
      }
      // 阻尼插值
      theta += (targetTheta - theta) * (1 - Math.pow(1 - damping, 2));
      phi += (targetPhi - phi) * (1 - Math.pow(1 - damping, 2));
      distance += (targetDistance - distance) * (1 - Math.pow(1 - damping, 2));

      // 限制极角
      targetPhi = Math.max(opts.minPolarAngle || 0, Math.min(opts.maxPolarAngle || Math.PI, targetPhi));
      targetDistance = Math.max(opts.minDistance || 1, Math.min(opts.maxDistance || 50, targetDistance));

      const x = target.x + distance * Math.sin(phi) * Math.sin(theta);
      const y = target.y + distance * Math.cos(phi);
      const z = target.z + distance * Math.sin(phi) * Math.cos(theta);

      camera.position.set(x, y, z);
      camera.lookAt(target);
    }

    // 鼠标拖拽
    domElement.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      domElement.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      targetTheta -= dx * 0.005;
      targetPhi -= dy * 0.005;
      prevX = e.clientX;
      prevY = e.clientY;
    });
    window.addEventListener('mouseup', () => {
      isDragging = false;
      domElement.style.cursor = 'grab';
    });

    // 滚轮缩放
    domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      targetDistance *= factor;
    }, { passive: false });

    // 触屏
    let touchStartDist = 0;
    domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevX = e.touches[0].clientX;
        prevY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    });
    domElement.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - prevX;
        const dy = e.touches[0].clientY - prevY;
        targetTheta -= dx * 0.005;
        targetPhi -= dy * 0.005;
        prevX = e.touches[0].clientX;
        prevY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        targetDistance *= touchStartDist / d;
        touchStartDist = d;
      }
    }, { passive: false });
    domElement.addEventListener('touchend', () => { isDragging = false; });

    domElement.style.cursor = 'grab';

    return {
      update,
      get autoRotate() { return autoRotate; },
      set autoRotate(v) { autoRotate = v; },
      target,
      reset() {
        targetTheta = Math.PI / 4;
        targetPhi = Math.PI / 3;
        targetDistance = (opts.minDistance + opts.maxDistance) / 2;
      }
    };
  }

  /* ===== 初始化 Three.js ===== */
  function initThree() {
    const container = document.getElementById('three-canvas');
    const w = container.clientWidth;
    const h = container.clientHeight;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x2A1F14, 8, 22);

    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(4, 3, 6);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 灯光
    const ambient = new THREE.AmbientLight(0xffe8c0, 0.5);
    scene.add(ambient);

    const main = new THREE.DirectionalLight(0xffd699, 1.4);
    main.position.set(5, 8, 5);
    main.castShadow = true;
    main.shadow.mapSize.set(1024, 1024);
    main.shadow.camera.near = 0.5;
    main.shadow.camera.far = 30;
    scene.add(main);

    const rim = new THREE.PointLight(0xC8392F, 1.2, 14);
    rim.position.set(-4, 3, -3);
    scene.add(rim);

    const fill = new THREE.PointLight(0xE8C97A, 0.8, 12);
    fill.position.set(3, 2, -4);
    scene.add(fill);

    // 展台底座
    const baseGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.4, 64);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x3A2A18, roughness: 0.8, metalness: 0.3
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -1.4;
    base.receiveShadow = true;
    scene.add(base);

    // 展台金边
    const ringGeo = new THREE.TorusGeometry(2.4, 0.04, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xC9A14A, metalness: 0.9, roughness: 0.2,
      emissive: 0xC9A14A, emissiveIntensity: 0.3
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -1.18;
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // 自定义轨道控制器（替代 OrbitControls，避免 CDN 依赖问题）
    controls = createOrbitControls(camera, renderer.domElement, {
      minDistance: 4,
      maxDistance: 12,
      maxPolarAngle: Math.PI * 0.62,
      minPolarAngle: Math.PI * 0.18,
      autoRotate: true,
      autoRotateSpeed: 1.2,
      target: new THREE.Vector3(0, 0.2, 0),
      dampingFactor: 0.08
    });

    window.addEventListener('resize', onResize);
    animate();
  }

  function onResize() {
    if (!renderer) return;
    const container = document.getElementById('three-canvas');
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  /* ===== Canvas 纹理生成工具 ===== */
  function createCanvasTex(drawFn, w = 512, h = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    drawFn(ctx, w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  }

  /* ===== 纹理加载工具 ===== */
  const texLoader = new THREE.TextureLoader();
  texLoader.crossOrigin = 'anonymous';
  function loadImgTex(path, repeat = [1, 1]) {
    const tex = texLoader.load(path);
    tex.anisotropy = 8;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    if (repeat[0] !== 1 || repeat[1] !== 1) tex.repeat.set(repeat[0], repeat[1]);
    return tex;
  }

  /* ===== 模型构建（真实图片纹理 + 博物馆展品造型） ===== */
  function buildModel(type) {
    const group = new THREE.Group();

    // 通用材质
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.75, metalness: 0.05 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xC9A14A, roughness: 0.4, metalness: 0.5 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1A1208, roughness: 0.6, metalness: 0.1 });

    // 图片路径映射
    const imgPaths = {
      kite: 'assets/images/kite.png',
      claytiger: 'assets/images/claytiger.png',
      newyearpic: 'assets/images/newyearpic.webp',
      paper: 'assets/images/paper.webp',
      silk: 'assets/images/silk.png',
      guqin: 'assets/images/guqin.png'
    };

    if (type === 'claytiger') {
      // ===== 聂家庄泥叫虎 - 真实图片展品 =====
      // 主展品：立体盒子 + 真实图片贴图（前后两面）
      const tex = loadImgTex(imgPaths.claytiger);
      const sideMat = new THREE.MeshStandardMaterial({ color: 0xD4A82A, roughness: 0.85, metalness: 0.0 });

      // 主体 - 圆角立方体（模拟泥塑厚度）
      const bodyGeo = new THREE.BoxGeometry(1.4, 1.1, 0.5, 8, 8, 4);
      // 圆角处理
      const pos = bodyGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const factor = 0.06;
        pos.setX(i, x - Math.sign(x) * factor * (1 - Math.abs(z/0.25)));
        pos.setY(i, y - Math.sign(y) * factor * (1 - Math.abs(z/0.25)));
      }
      bodyGeo.computeVertexNormals();

      // 6 面材质：前后用图片，其他用泥土色
      const bodyMats = [
        sideMat, sideMat, // 左右
        sideMat, sideMat, // 上下
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0.0 }), // 前（正面图片）
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0.0 })  // 后（背面图片）
      ];
      const body = new THREE.Mesh(bodyGeo, bodyMats);
      body.position.set(0, 0.1, 0);
      body.castShadow = true;
      group.add(body);

      // 底座（木质展台）
      const baseGeo = new THREE.CylinderGeometry(0.9, 1.0, 0.15, 32);
      const base = new THREE.Mesh(baseGeo, woodMat);
      base.position.set(0, -0.55, 0);
      base.castShadow = true;
      group.add(base);
      // 底座金边
      const baseRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.9, 0.02, 8, 48),
        goldMat
      );
      baseRing.rotation.x = Math.PI / 2;
      baseRing.position.y = -0.47;
      group.add(baseRing);

    } else if (type === 'kite') {
      // ===== 龙头蜈蚣风筝 - 真实图片展品 =====
      const tex = loadImgTex(imgPaths.kite);

      // 风筝主体（薄板，前后贴图）
      const kiteGeo = new THREE.PlaneGeometry(2.0, 2.0, 1, 1);
      const kiteMat = new THREE.MeshStandardMaterial({
        map: tex, roughness: 0.7, metalness: 0.0,
        side: THREE.DoubleSide
      });
      const kite = new THREE.Mesh(kiteGeo, kiteMat);
      kite.position.set(0, 0.3, 0);
      kite.castShadow = true;
      group.add(kite);

      // 边框（细竹框）
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x7A5C3A, roughness: 0.8, metalness: 0.0 });
      const frameTh = 0.03;
      // 上下边
      const fTop = new THREE.Mesh(new THREE.BoxGeometry(2.05, frameTh, frameTh), frameMat);
      fTop.position.set(0, 1.3, 0);
      group.add(fTop);
      const fBot = fTop.clone();
      fBot.position.y = -0.7;
      group.add(fBot);
      // 左右边
      const fL = new THREE.Mesh(new THREE.BoxGeometry(frameTh, 2.05, frameTh), frameMat);
      fL.position.set(-1.0, 0.3, 0);
      group.add(fL);
      const fR = fL.clone();
      fR.position.x = 1.0;
      group.add(fR);

      // 挂绳
      const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 });
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.6, 6), ropeMat);
      rope.position.set(0, 1.6, 0);
      group.add(rope);
      // 挂钩
      const hook = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 16, Math.PI), goldMat);
      hook.position.set(0, 1.9, 0);
      hook.rotation.x = Math.PI / 2;
      group.add(hook);

    } else if (type === 'newyearpic') {
      // ===== 杨家埠木版年画 - 装裱画框展品 =====
      const tex = loadImgTex(imgPaths.newyearpic);

      // 木背板
      const boardGeo = new THREE.BoxGeometry(1.8, 2.3, 0.08);
      const board = new THREE.Mesh(boardGeo, woodMat);
      board.position.set(0, 0, 0);
      board.castShadow = true;
      group.add(board);

      // 年画画面
      const picGeo = new THREE.PlaneGeometry(1.6, 2.1);
      const picMat = new THREE.MeshStandardMaterial({
        map: tex, roughness: 0.9, metalness: 0.0
      });
      const pic = new THREE.Mesh(picGeo, picMat);
      pic.position.set(0, 0, 0.045);
      group.add(pic);

      // 装裱木框（4 条）
      const frameW = 0.08;
      const frameD = 0.1;
      const frameMatGold = goldMat.clone();
      frameMatGold.roughness = 0.4;
      frameMatGold.metalness = 0.5;
      // 上框
      const frTop = new THREE.Mesh(new THREE.BoxGeometry(1.96, frameW, frameD), frameMatGold);
      frTop.position.set(0, 1.19, 0.02);
      group.add(frTop);
      // 下框
      const frBot = frTop.clone();
      frBot.position.y = -1.19;
      group.add(frBot);
      // 左框
      const frL = new THREE.Mesh(new THREE.BoxGeometry(frameW, 2.46, frameD), frameMatGold);
      frL.position.set(-0.94, 0, 0.02);
      group.add(frL);
      // 右框
      const frR = frL.clone();
      frR.position.x = 0.94;
      group.add(frR);

      // 挂绳
      const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 });
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.4, 6), ropeMat);
      rope.rotation.z = Math.PI / 2;
      rope.position.set(0, 1.35, 0);
      group.add(rope);

    } else if (type === 'paper') {
      // ===== 高密剪纸 - 装裱展品 =====
      const tex = loadImgTex(imgPaths.paper);

      // 宣纸背板（装裱）
      const mountGeo = new THREE.BoxGeometry(2.0, 2.0, 0.04);
      const mountMat = new THREE.MeshStandardMaterial({ color: 0xF5EFE0, roughness: 0.9, metalness: 0.0 });
      const mount = new THREE.Mesh(mountGeo, mountMat);
      mount.position.set(0, 0, 0);
      mount.castShadow = true;
      group.add(mount);

      // 剪纸画面
      const paperGeo = new THREE.PlaneGeometry(1.8, 1.8);
      const paperMat = new THREE.MeshStandardMaterial({
        map: tex, roughness: 0.85, metalness: 0.0,
        transparent: true, alphaTest: 0.3,
        side: THREE.DoubleSide
      });
      const paper = new THREE.Mesh(paperGeo, paperMat);
      paper.position.set(0, 0, 0.025);
      group.add(paper);

      // 装裱细金框
      const frameMat = goldMat.clone();
      frameMat.roughness = 0.35;
      frameMat.metalness = 0.55;
      const fT = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.04, 0.06), frameMat);
      fT.position.set(0, 1.02, 0.01);
      group.add(fT);
      const fB = fT.clone();
      fB.position.y = -1.02;
      group.add(fB);
      const fL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.08, 0.06), frameMat);
      fL.position.set(-1.02, 0, 0.01);
      group.add(fL);
      const fR = fL.clone();
      fR.position.x = 1.02;
      group.add(fR);

    } else if (type === 'silk') {
      // ===== 昌邑丝绸 - 卷轴展品 =====
      const tex = loadImgTex(imgPaths.silk);

      // 丝绸画面
      const silkGeo = new THREE.PlaneGeometry(1.5, 2.2);
      const silkMat = new THREE.MeshStandardMaterial({
        map: tex, roughness: 0.35, metalness: 0.1,
        side: THREE.DoubleSide
      });
      const silk = new THREE.Mesh(silkGeo, silkMat);
      silk.position.set(0, 0, 0);
      silk.castShadow = true;
      group.add(silk);

      // 上轴（木轴）
      const topRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 1.7, 24),
        woodMat
      );
      topRod.rotation.z = Math.PI / 2;
      topRod.position.set(0, 1.18, 0);
      topRod.castShadow = true;
      group.add(topRod);

      // 下轴
      const botRod = topRod.clone();
      botRod.position.y = -1.18;
      group.add(botRod);

      // 轴头（金色装饰）
      const capMat = goldMat.clone();
      capMat.metalness = 0.6;
      const capL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), capMat);
      capL.position.set(-0.88, 1.18, 0);
      group.add(capL);
      const capR = capL.clone();
      capR.position.x = 0.88;
      group.add(capR);
      const capBL = capL.clone();
      capBL.position.y = -1.18;
      group.add(capBL);
      const capBR = capR.clone();
      capBR.position.y = -1.18;
      group.add(capBR);

      // 挂绳
      const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 });
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 6), ropeMat);
      rope.position.set(0, 1.55, 0);
      group.add(rope);

    } else if (type === 'guqin') {
      // ===== 诸城派古琴 - 手绘贴图（避免闪烁） =====
      const qinTex = createCanvasTex((ctx, w, h) => {
        ctx.fillStyle = '#1A1208';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#2A2520';
        ctx.fillRect(8, 15, w-16, h-30);
        // 断纹
        ctx.strokeStyle = '#5C4033';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 18; i++) {
          const x = 30 + i * 35 + Math.random() * 10;
          ctx.beginPath();
          ctx.moveTo(x, 25);
          ctx.quadraticCurveTo(x + 8, h/2, x - 5, h - 25);
          ctx.stroke();
        }
        // 琴弦
        ctx.strokeStyle = '#C9A14A';
        for (let i = 0; i < 7; i++) {
          ctx.lineWidth = 2 - i * 0.2;
          ctx.beginPath();
          ctx.moveTo(20, 45 + i * 8);
          ctx.lineTo(w - 20, 45 + i * 8);
          ctx.stroke();
        }
        // 琴徽（13个）
        for (let i = 0; i < 13; i++) {
          const x = 35 + i * 28;
          const r = i === 6 ? 5 : 4;
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(x, h/2, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#B8860B';
          ctx.beginPath();
          ctx.arc(x, h/2, r * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        // 岳山
        ctx.fillStyle = '#3D3329';
        ctx.fillRect(15, 35, 5, h - 70);
        // 龙龈
        ctx.fillRect(w - 20, 38, 5, h - 76);
      });

      // 琴身（挤出造型）
      const qinGeo = new THREE.BoxGeometry(2.8, 0.08, 0.6);
      const qinMat = new THREE.MeshStandardMaterial({
        map: qinTex, roughness: 0.4, metalness: 0.1
      });
      const qin = new THREE.Mesh(qinGeo, qinMat);
      qin.position.set(0, 0.1, 0);
      qin.castShadow = true;
      group.add(qin);

      // 琴穗
      const tasselMat = new THREE.MeshStandardMaterial({ color: 0xC9A14A, roughness: 0.6, metalness: 0.15 });
      for (let i = 0; i < 6; i++) {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.01, 0.35, 6), tasselMat);
        t.position.set(-1.35 + i * 0.03, -0.15, 0.28);
        t.rotation.z = 0.1 + i * 0.02;
        group.add(t);
      }

      // 展台底座
      const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.12, 32);
      const base = new THREE.Mesh(baseGeo, woodMat);
      base.position.set(0, -0.52, 0);
      base.castShadow = true;
      group.add(base);
    }

    return group;
  }

  /* ===== 切换模型 ===== */
  function switchModel(idx) {
    currentIndex = idx;
    const item = D.heritageItems[idx];

    // 移除旧模型
    if (currentModel) {
      scene.remove(currentModel);
      currentModel.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
    }

    currentModel = buildModel(item.img);
    scene.add(currentModel);

    // 入场动画
    currentModel.scale.set(0, 0, 0);
    const startTime = performance.now();
    const animateIn = (now) => {
      const t = Math.min((now - startTime) / 600, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      currentModel.scale.set(eased, eased, eased);
      currentModel.rotation.y = (1 - eased) * Math.PI;
      if (t < 1) requestAnimationFrame(animateIn);
    };
    requestAnimationFrame(animateIn);

    // 更新信息
    updateInfo(item);
    updateTabs(idx);
    updateGallery(idx);
  }

  function updateInfo(item) {
    document.getElementById('info-cat').textContent = item.cat;
    document.getElementById('info-name').textContent = item.name;
    document.getElementById('info-en').textContent = item.en;
    document.getElementById('info-region').textContent = '📍 ' + item.region;
    document.getElementById('info-tag').textContent = item.cat.split('·')[0].trim();
    document.getElementById('info-desc').textContent = item.desc;

    const dots = document.getElementById('palette-dots');
    dots.innerHTML = item.palette.map(c => `<span class="palette-dot" style="background:${c}"></span>`).join('');

    const list = document.getElementById('steps-list');
    list.innerHTML = item.steps.map((s, i) => `<li style="animation-delay:${i * 0.08}s">${s}</li>`).join('');
  }

  function updateTabs(idx) {
    document.querySelectorAll('.hall-tab').forEach((t, i) => {
      t.classList.toggle('active', i === idx);
    });
  }

  function updateGallery(idx) {
    document.querySelectorAll('.gallery-item').forEach((g, i) => {
      g.classList.toggle('active', i === idx);
    });
  }

  /* ===== 渲染 Tabs ===== */
  function renderTabs() {
    const wrap = document.getElementById('hall-tabs');
    wrap.innerHTML = D.heritageItems.map((it, i) => `
      <button class="hall-tab ${i === 0 ? 'active' : ''}" data-idx="${i}">${it.name}</button>
    `).join('');
    wrap.querySelectorAll('.hall-tab').forEach((t, i) => {
      t.addEventListener('click', () => switchModel(i));
    });
  }

  /* ===== 同期展品 ===== */
  function renderGallery() {
    const wrap = document.getElementById('gallery-grid');
    wrap.innerHTML = D.heritageItems.map((it, i) => `
      <div class="gallery-item ${i === 0 ? 'active' : ''}" data-idx="${i}">
        ${WF.illustrationSvg(it.img, 200, 200)}
        <div class="gallery-item-name">${it.name}</div>
      </div>
    `).join('');
    wrap.querySelectorAll('.gallery-item').forEach((g, i) => {
      g.addEventListener('click', () => switchModel(i));
    });
  }

  /* ===== 工艺图集环绕 ===== */
  function renderOrbit() {
    const wrap = document.getElementById('orbit-track');
    // 每件展品只展示一张代表卡片，不重复
    wrap.innerHTML = D.heritageItems.map((it, i) => `
      <div class="orbit-card">
        ${WF.illustrationSvg(it.img, 200, 250)}
        <div class="orbit-overlay">
          <div class="orbit-title">${it.name}</div>
          <div class="orbit-steps">
            ${it.steps.map((s, idx) => `<div><span class="step-num">${idx + 1}</span>${s}</div>`).join('')}
          </div>
        </div>
      </div>
    `).join('');
  }

  /* ===== 控制按钮 ===== */
  function bindCtrl() {
    document.getElementById('reset-view').addEventListener('click', () => {
      controls.reset();
      controls.update();
      WF.toast('视角已重置', 'success');
    });

    const autoBtn = document.getElementById('auto-rotate');
    autoBtn.addEventListener('click', () => {
      autoRotate = !autoRotate;
      controls.autoRotate = autoRotate;
      autoBtn.textContent = autoRotate ? '暂停旋转' : '自动旋转';
      WF.toast(autoRotate ? '已开启自动旋转' : '已暂停自动旋转', 'success');
    });
  }

  /* ===== 初始化 ===== */
  function init() {
    if (!window.THREE) {
      document.getElementById('three-canvas').innerHTML = '<p style="color:#FFF6E6;padding:20px">Three.js 加载失败，请检查网络</p>';
      return;
    }
    initThree();
    renderTabs();
    renderGallery();
    renderOrbit();
    bindCtrl();
    switchModel(0);
  }

  // 销毁
  function destroy() {
    if (animationId) cancelAnimationFrame(animationId);
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    }
    window.removeEventListener('resize', onResize);
  }

  window.addEventListener('hashchange', destroy, { once: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
