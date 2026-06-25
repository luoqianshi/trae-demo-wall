/* ============================================
   AI 立体回忆馆 — Three.js 3D 查看器
   ============================================ */

const Viewer3D = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  currentModel: null,
  modelData: null,
  animationId: null,
  isInitialized: false,
  autoRotate: false,
  wireframe: false,
  lights: {
    ambient: null,
    directional: null,
    back: null
  },

  /**
   * 初始化 3D 场景
   */
  init() {
    if (this.isInitialized) return;

    const container = document.getElementById('viewer-canvas-wrap');
    const canvas = document.getElementById('viewer-canvas');
    if (!container || !canvas) return;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1E1A16);

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    this.camera.position.set(2.5, 1.8, 2.5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Controls
    this.controls = new THREE.OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 10;
    this.controls.target.set(0, 0, 0);

    // Lights
    this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.lights.ambient);

    this.lights.directional = new THREE.DirectionalLight(0xffffff, 1.2);
    this.lights.directional.position.set(3, 4, 2);
    this.lights.directional.castShadow = true;
    this.lights.directional.shadow.mapSize.set(1024, 1024);
    this.scene.add(this.lights.directional);

    this.lights.back = new THREE.DirectionalLight(0xF3A87A, 0.4);
    this.lights.back.position.set(-2, 2, -3);
    this.scene.add(this.lights.back);

    // Ground plane (subtle)
    const groundGeo = new THREE.PlaneGeometry(10, 10);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1E1A16,
      roughness: 1,
      metalness: 0
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.5;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid helper
    const grid = new THREE.GridHelper(8, 20, 0x3A2A1E, 0x2A1F18);
    grid.position.y = -1.49;
    this.scene.add(grid);

    // Start render loop
    this._animate();

    // Resize handler
    this._resizeHandler = Utils.debounce(() => this._onResize(), 200);
    window.addEventListener('resize', this._resizeHandler);

    this.isInitialized = true;
  },

  /**
   * 加载模型数据到场景
   */
  loadModel(modelData) {
    if (!this.isInitialized) this.init();
    if (!this.scene) return;

    // Remove existing model
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      this.currentModel = null;
    }

    this.modelData = modelData;
    const geometry = modelData.geometry;

    try {
      let mesh;
      switch (geometry.type) {
        case 'sculpture':
          mesh = this._createSculpture(geometry.params);
          break;
        case 'voxel':
          mesh = this._createVoxel(geometry.params);
          break;
        case 'lowpoly':
          mesh = this._createLowPoly(geometry.params);
          break;
        case 'relief':
          mesh = this._createRelief(geometry.params);
          break;
        default:
          mesh = this._createSculpture(geometry.params);
      }

      if (mesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.currentModel = mesh;
        this.scene.add(mesh);

        // Center and fit camera
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fitDist = maxDim * 2;

        this.controls.target.copy(center);
        this.camera.position.set(
          center.x + fitDist * 0.7,
          center.y + fitDist * 0.5,
          center.z + fitDist * 0.7
        );
        this.camera.lookAt(center);
        this.controls.update();

        // Update model info
        this._updateModelInfo(mesh, modelData);
      }
    } catch (err) {
      console.error('Error loading model:', err);
      Utils.showToast('模型加载失败: ' + err.message);
    }
  },

  // --- Model Builders ---

  _createSculpture(params) {
    const group = new THREE.Group();
    const baseGeo = new THREE.IcosahedronGeometry(params.mainRadius, params.detail);
    const positions = baseGeo.attributes.position;

    // Apply distortions
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      let offset = 0;
      params.distortions.forEach(d => {
        offset += d.amp * Math.sin(d.freq * x + d.phase) *
                  Math.cos(d.freq * y + d.phase) *
                  Math.sin(d.freq * z + d.phase);
      });
      const len = Math.sqrt(x * x + y * y + z * z);
      const safeLen = Math.max(len, 0.001);
      const scale = (safeLen + offset) / safeLen;
      positions.setXYZ(i, x * scale, y * scale, z * scale);
    }
    baseGeo.computeVertexNormals();

    const colors = params.colors;
    const colorAttr = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const t = (y + params.mainRadius * 1.3) / (params.mainRadius * 2.6);
      const ci = Math.min(Math.floor(t * colors.length), colors.length - 1);
      const c = new THREE.Color(colors[Math.max(0, ci)]);
      colorAttr[i * 3] = c.r;
      colorAttr[i * 3 + 1] = c.g;
      colorAttr[i * 3 + 2] = c.b;
    }
    baseGeo.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.4,
      metalness: 0.1,
      flatShading: false
    });

    group.add(new THREE.Mesh(baseGeo, mat));
    return group;
  },

  _createVoxel(params) {
    const group = new THREE.Group();
    const geo = new THREE.BoxGeometry(1, 1, 1);

    params.voxels.forEach(v => {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(v.color),
        roughness: 0.6,
        metalness: 0.05
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(v.x, v.y, v.z);
      mesh.scale.setScalar(v.size);
      mesh.castShadow = true;
      group.add(mesh);
    });

    return group;
  },

  _createLowPoly(params) {
    const geo = new THREE.BufferGeometry();
    const vertices = params.vertices;
    const faces = params.faces;
    const positions = [];
    const colors = [];

    faces.forEach((face, fi) => {
      const ci = fi % params.colors.length;
      const c = new THREE.Color(params.colors[ci]);
      face.forEach(idx => {
        const v = vertices[idx];
        if (v) {
          positions.push(v.x, v.y, v.z);
          // Slight color variation
          colors.push(
            c.r + (Math.random() - 0.5) * 0.1,
            c.g + (Math.random() - 0.5) * 0.1,
            c.b + (Math.random() - 0.5) * 0.1
          );
        }
      });
    });

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.5,
      metalness: 0.1,
      flatShading: true
    });

    return new THREE.Mesh(geo, mat);
  },

  _createRelief(params) {
    const { gridW, gridH, heights, depth, colors: relColors } = params;
    const geo = new THREE.PlaneGeometry(3, 3, gridW - 1, gridH - 1);
    const positions = geo.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const hi = i % (gridW * gridH);
      const h = heights[hi] !== undefined ? heights[hi] : 0;
      positions.setZ(i, h * depth);
    }
    geo.computeVertexNormals();

    // Color based on height
    const colorAttr = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
      const hi = i % (gridW * gridH);
      const h = heights[hi] !== undefined ? heights[hi] : 0;
      const t = (h + 0.3) / 0.8;
      const ci = Math.min(Math.floor(t * relColors.length), relColors.length - 1);
      const c = new THREE.Color(relColors[Math.max(0, ci)]);
      colorAttr[i * 3] = c.r;
      colorAttr[i * 3 + 1] = c.g;
      colorAttr[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.5,
      metalness: 0.15,
      side: THREE.DoubleSide,
      flatShading: true
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 6;
    return mesh;
  },

  // --- Controls ---

  resetCamera() {
    if (!this.currentModel || !this.camera) return;
    const box = new THREE.Box3().setFromObject(this.currentModel);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fitDist = maxDim * 2;
    this.controls.target.copy(center);
    this.camera.position.set(
      center.x + fitDist * 0.7,
      center.y + fitDist * 0.5,
      center.z + fitDist * 0.7
    );
    this.controls.update();
  },

  toggleWireframe() {
    this.wireframe = !this.wireframe;
    if (this.currentModel) {
      this.currentModel.traverse(child => {
        if (child.isMesh && child.material) {
          child.material.wireframe = this.wireframe;
        }
      });
    }
    return this.wireframe;
  },

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    if (this.controls) {
      this.controls.autoRotate = this.autoRotate;
      this.controls.autoRotateSpeed = 2;
    }
    return this.autoRotate;
  },

  setAmbientIntensity(val) {
    if (this.lights.ambient) this.lights.ambient.intensity = val;
  },

  setDirectionalIntensity(val) {
    if (this.lights.directional) this.lights.directional.intensity = val;
  },

  setBacklightIntensity(val) {
    if (this.lights.back) this.lights.back.intensity = val;
  },

  setBackground(type) {
    if (!this.scene) return;
    switch (type) {
      case 'gradient':
        this.scene.background = new THREE.Color(0x1E1A16);
        break;
      case 'dark':
        this.scene.background = new THREE.Color(0x111111);
        break;
      case 'light':
        this.scene.background = new THREE.Color(0xFAF5EF);
        break;
      case 'studio':
        this.scene.background = new THREE.Color(0x888888);
        break;
    }
  },

  // --- Export ---

  exportOBJ() {
    if (!this.currentModel) {
      Utils.showToast('请先加载模型');
      return;
    }
    try {
      const exporter = new THREE.OBJExporter();
      const objString = exporter.parse(this.currentModel);
      const name = (this.modelData && this.modelData.name) || 'model';
      Utils.downloadText(objString, `${name}.obj`, 'text/plain');
      Utils.showToast('OBJ 文件已下载');
    } catch (e) {
      Utils.showToast('导出失败: ' + e.message);
    }
  },

  exportGLB() {
    if (!this.currentModel) {
      Utils.showToast('请先加载模型');
      return;
    }
    try {
      const exporter = new THREE.GLTFExporter();
      exporter.parse(this.currentModel, (result) => {
        const output = new Uint8Array(result);
        const blob = new Blob([output], { type: 'application/octet-stream' });
        const name = (this.modelData && this.modelData.name) || 'model';
        Utils.downloadBlob(blob, `${name}.glb`);
        Utils.showToast('GLB 文件已下载');
      }, (error) => {
        Utils.showToast('导出失败: ' + error.message);
      }, { binary: true });
    } catch (e) {
      Utils.showToast('导出失败: ' + e.message);
    }
  },

  exportSTL() {
    if (!this.currentModel) {
      Utils.showToast('请先加载模型');
      return;
    }
    try {
      // Simple STL export (ASCII)
      const name = (this.modelData && this.modelData.name) || 'model';
      let stl = 'solid ' + name + '\n';
      this.currentModel.traverse(child => {
        if (child.isMesh && child.geometry) {
          const geo = child.geometry;
          const pos = geo.attributes.position;
          const normal = geo.attributes.normal;
          for (let i = 0; i < pos.count; i += 3) {
            if (normal) {
              const nx = (normal.getX(i) + normal.getX(i+1) + normal.getX(i+2)) / 3;
              const ny = (normal.getY(i) + normal.getY(i+1) + normal.getY(i+2)) / 3;
              const nz = (normal.getZ(i) + normal.getZ(i+1) + normal.getZ(i+2)) / 3;
              stl += `facet normal ${nx} ${ny} ${nz}\n  outer loop\n`;
            } else {
              stl += `facet normal 0 0 0\n  outer loop\n`;
            }
            for (let j = 0; j < 3; j++) {
              const idx = i + j;
              stl += `    vertex ${pos.getX(idx)} ${pos.getY(idx)} ${pos.getZ(idx)}\n`;
            }
            stl += `  endloop\nendfacet\n`;
          }
        }
      });
      stl += 'endsolid ' + name + '\n';
      Utils.downloadText(stl, `${name}.stl`, 'text/plain');
      Utils.showToast('STL 文件已下载');
    } catch (e) {
      Utils.showToast('导出失败: ' + e.message);
    }
  },

  // --- Internal ---

  _animate() {
    this.animationId = requestAnimationFrame(() => this._animate());
    if (this.controls) this.controls.update();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  },

  _onResize() {
    const container = document.getElementById('viewer-canvas-wrap');
    if (!container || !this.camera || !this.renderer) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  },

  _updateModelInfo(mesh, modelData) {
    let vertices = 0, faces = 0;
    mesh.traverse(child => {
      if (child.isMesh && child.geometry) {
        const geo = child.geometry;
        vertices += geo.attributes.position ? geo.attributes.position.count : 0;
        faces += geo.index ? geo.index.count / 3 : (geo.attributes.position ? geo.attributes.position.count / 3 : 0);
      }
    });

    const nameEl = document.getElementById('viewer-model-name');
    const vertEl = document.getElementById('info-vertices');
    const faceEl = document.getElementById('info-faces');
    const formatEl = document.getElementById('info-format');
    const sizeEl = document.getElementById('info-size');

    if (nameEl) nameEl.textContent = modelData.name || '未命名模型';
    if (vertEl) vertEl.textContent = vertices.toLocaleString();
    if (faceEl) faceEl.textContent = Math.floor(faces).toLocaleString();
    if (formatEl) formatEl.textContent = modelData.style || '3D';
    if (sizeEl) sizeEl.textContent = Utils.formatSize(JSON.stringify(modelData.geometry).length);
  },

  /**
   * 渲染模型缩略图到 canvas
   */
  renderThumbnail(modelData, canvas, width, height) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = width || 200;
    canvas.height = height || 150;

    // Create a mini scene for thumbnail
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2A1F18);

    const camera = new THREE.PerspectiveCamera(40, canvas.width / canvas.height, 0.1, 50);
    camera.position.set(2, 1.5, 2);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.width, canvas.height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(3, 4, 2);
    scene.add(dirLight);

    // Build model
    let thumbModel;
    const geo = modelData.geometry;
    try {
      switch (geo.type) {
        case 'sculpture': thumbModel = this._createSculpture(geo.params); break;
        case 'voxel': thumbModel = this._createVoxel(geo.params); break;
        case 'lowpoly': thumbModel = this._createLowPoly(geo.params); break;
        case 'relief': thumbModel = this._createRelief(geo.params); break;
        default: thumbModel = this._createSculpture(geo.params);
      }
    } catch (e) {
      // Fallback: simple sphere
      const sGeo = new THREE.IcosahedronGeometry(0.8, 2);
      const sMat = new THREE.MeshStandardMaterial({ color: 0xE87040, roughness: 0.5 });
      thumbModel = new THREE.Mesh(sGeo, sMat);
    }

    if (thumbModel) {
      scene.add(thumbModel);
      renderer.render(scene, camera);
      renderer.dispose();
      scene.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      });
    }
  },

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
    if (this.renderer) this.renderer.dispose();
    this.isInitialized = false;
  }
};
