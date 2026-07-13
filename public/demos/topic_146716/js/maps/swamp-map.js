// ============================================================
// 毒雾沼泽地图系统 - SwampMap
// ============================================================
// 核污水排放遗迹，变异生物横行的危险区域
// 包含：地形系统、废弃建筑、枯树、变异植物、水坑、毒雾粒子、变异怪物、碰撞系统

// ==================== 配置 ====================
const SWAMP_MAP_CONFIG = {
  MAP_SIZE: 200,
  GROUND_COLOR: 0x4a6a3a,
  FOG_COLOR: 0x1a2a0a,
  FOG_DENSITY: 0.015,
  POISON_DAMAGE: 2,
  POISON_RANGE: 150,
  DEFENSE_WAVES: 15,
  WANDER_MONSTER_COUNT: 12,
  WATER_COLOR: 0x2a5a3a,
  MUD_COLOR: 0x5a4a3a,
  TREE_COLOR: 0x2a1a0a,
  GLOW_COLOR: 0x44ff44,
};

// ==================== 增强噪声生成器 ====================
const SwampNoise = {
  _p: [],
  init() {
    const p = [];
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    this._p = [...p, ...p];
  },
  noise2D(x, y) {
    const n = Math.floor(x) + Math.floor(y) * 57;
    const nn = (n << 13) ^ n;
    return (1.0 - ((nn * (nn * nn * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);
  },
  fbm2D(x, y, octaves, persistence, lacunarity) {
    let total = 0, frequency = 1, amplitude = 1, maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return total / maxValue;
  }
};

// ==================== 碰撞体系统 ====================
const SwampCollision = {
  bodies: [],

  addBox(name, position, size, rotation) {
    this.bodies.push({
      type: 'box',
      name,
      position: position.clone(),
      size: { x: size.x / 2, y: size.y / 2, z: size.z / 2 },
      rotation: rotation || { x: 0, y: 0, z: 0 },
    });
    // 同时注册到全局碰撞系统（game.js使用）
    // 缓冲从0.15减小到0.03，碰撞更贴合视觉模型
    if (typeof window.addCollider === 'function') {
      const hw = size.x / 2;
      const hd = size.z / 2;
      const h = size.y;
      window.addCollider(position.x, position.z, hw + 0.03, hd + 0.03, h, name, true);
    }
  },

  addCylinder(name, position, radius, height) {
    this.bodies.push({
      type: 'cylinder',
      name,
      position: position.clone(),
      radius,
      height,
    });
    // 同时注册到全局碰撞系统（game.js使用）
    // 缓冲从0.15减小到0.03，碰撞更贴合视觉模型
    if (typeof window.addCollider === 'function') {
      window.addCollider(position.x, position.z, radius + 0.03, radius + 0.03, height, name, true);
    }
  },

  addSphere(name, position, radius) {
    this.bodies.push({
      type: 'sphere',
      name,
      position: position.clone(),
      radius,
    });
    // 同时注册到全局碰撞系统（game.js使用）
    // 缓冲从0.15减小到0.03，碰撞更贴合视觉模型
    if (typeof window.addCollider === 'function') {
      window.addCollider(position.x, position.z, radius + 0.03, radius + 0.03, radius * 2, name, true);
    }
  },

  addTrigger(name, position, radius, callback) {
    this.bodies.push({
      type: 'trigger',
      name,
      position: position.clone(),
      radius,
      callback,
      active: false,
    });
    // 触发区域不注册到全局碰撞系统（只用于事件触发，不阻挡移动）
  },

  checkCollision(point, radius) {
    const results = [];
    for (const body of this.bodies) {
      if (body.type === 'box') {
        const local = this._worldToLocal(point, body);
        if (Math.abs(local.x) < body.size.x + radius &&
            Math.abs(local.y) < body.size.y + radius &&
            Math.abs(local.z) < body.size.z + radius) {
          results.push(body);
        }
      } else if (body.type === 'cylinder') {
        const dx = point.x - body.position.x;
        const dz = point.z - body.position.z;
        const dy = point.y - body.position.y;
        if (Math.sqrt(dx * dx + dz * dz) < body.radius + radius && Math.abs(dy) < body.height / 2 + radius) {
          results.push(body);
        }
      } else if (body.type === 'sphere') {
        const dist = point.distanceTo(body.position);
        if (dist < body.radius + radius) {
          results.push(body);
        }
      } else if (body.type === 'trigger') {
        const dist = point.distanceTo(body.position);
        const inside = dist < body.radius + radius;
        if (inside && !body.active) {
          body.active = true;
          if (body.callback) body.callback('enter');
        } else if (!inside && body.active) {
          body.active = false;
          if (body.callback) body.callback('exit');
        }
      }
    }
    return results;
  },

  _worldToLocal(point, body) {
    const dx = point.x - body.position.x;
    const dy = point.y - body.position.y;
    const dz = point.z - body.position.z;
    const ry = body.rotation.y || 0;
    const cos = Math.cos(-ry);
    const sin = Math.sin(-ry);
    return new THREE.Vector3(dx * cos - dz * sin, dy, dx * sin + dz * cos);
  },

  clear() {
    this.bodies = [];
  },

  resolveCollision(point, radius, velocity) {
    const collisions = this.checkCollision(point, radius);
    const resolved = point.clone();
    for (const body of collisions) {
      if (body.type === 'box') {
        const local = this._worldToLocal(point, body);
        const overlapX = body.size.x + radius - Math.abs(local.x);
        const overlapZ = body.size.z + radius - Math.abs(local.z);
        if (overlapX < overlapZ) {
          const dir = local.x > 0 ? 1 : -1;
          resolved.x = body.position.x + (local.x + dir * overlapX) * Math.cos(body.rotation.y || 0);
          resolved.z = body.position.z + (local.x + dir * overlapX) * Math.sin(body.rotation.y || 0);
          if (velocity) velocity.x = 0;
        } else {
          const dir = local.z > 0 ? 1 : -1;
          resolved.x = body.position.x + (local.z + dir * overlapZ) * Math.sin(body.rotation.y || 0);
          resolved.z = body.position.z - (local.z + dir * overlapZ) * Math.cos(body.rotation.y || 0);
          if (velocity) velocity.z = 0;
        }
      } else if (body.type === 'cylinder') {
        const dx = point.x - body.position.x;
        const dz = point.z - body.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 0) {
          const push = (body.radius + radius) / dist;
          resolved.x = body.position.x + dx * push;
          resolved.z = body.position.z + dz * push;
          if (velocity) { velocity.x = 0; velocity.z = 0; }
        }
      } else if (body.type === 'sphere') {
        const dir = new THREE.Vector3().subVectors(point, body.position).normalize();
        resolved.copy(body.position).add(dir.multiplyScalar(body.radius + radius));
        if (velocity) velocity.copy(new THREE.Vector3(0, 0, 0));
      }
    }
    return resolved;
  },
};

// ==================== 主系统 ====================
const SwampMap = {
  config: SWAMP_MAP_CONFIG,
  active: false,
  scene: null,
  camera: null,
  renderer: null,
  swampGroup: null,
  poisonZones: [],
  mutants: [],
  buildings: [],
  terrainData: [],
  terrainMesh: null,
  waterPools: [],
  deadTrees: [],
  glowPlants: [],
  ruins: [],
  poisonParticles: null,
  poisonTime: 0,
  phase: 'explore',
  defenseWave: 0,
  defenseWaveActive: false,
  defenseEnemies: [],
  waveTimer: 0,
  waveCooldown: 0,
  shakeIntensity: 0,
  shakeTimer: 0,
  poisonDamageTimer: 0,
  lightningTimer: 0,
  nextLightning: 3 + Math.random() * 5,
  lightningLine: null,
  bubbleParticles: [],
  steamParticles: [],
  leakParticles: [],
  tongueAnimations: [],
  sacAnimations: [],

  // ====== 初始化 ======
  init(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.active = true;
    this.phase = 'explore';
    this.defenseWave = 0;
    this.defenseWaveActive = false;
    this.defenseEnemies = [];
    this.waveTimer = 0;
    this.waveCooldown = 0;
    this.shakeIntensity = 0;
    this.shakeTimer = 0;
    this.poisonDamageTimer = 0;
    this.poisonTime = 0;
    this.lightningTimer = 0;
    this.nextLightning = 3 + Math.random() * 5;
    this.poisonZones = [];
    this.mutants = [];
    this.buildings = [];
    this.waterPools = [];
    this.deadTrees = [];
    this.glowPlants = [];
    this.ruins = [];
    this.terrainData = [];
    this.terrainMesh = null;
    this.poisonParticles = null;
    this.bubbleParticles = [];
    this.steamParticles = [];
    this.leakParticles = [];
    this.tongueAnimations = [];
    this.sacAnimations = [];

    SwampNoise.init();
    SwampCollision.clear();

    if (this.scene.fog) {
      this.scene.fog.color.setHex(SWAMP_MAP_CONFIG.FOG_COLOR);
      this.scene.fog.density = SWAMP_MAP_CONFIG.FOG_DENSITY;
    } else {
      this.scene.fog = new THREE.FogExp2(SWAMP_MAP_CONFIG.FOG_COLOR, SWAMP_MAP_CONFIG.FOG_DENSITY);
    }
    if (this.scene.background) {
      this.scene.background.setHex(SWAMP_MAP_CONFIG.FOG_COLOR);
    }

    console.log('[SwampMap] 初始化完成');
  },

  // ====== 生成地图 ======
  generate(options) {
    if (!this.scene) return;

    this.swampGroup = new THREE.Group();
    this.swampGroup.name = 'swampMapRoot';
    this.scene.add(this.swampGroup);

    this.generateTerrain();
    this.generateWaterPools();
    this.generateDeadTrees();
    this.generateRuins();
    this.generateGlowPlants();
    this.generatePoisonFog();
    this.setupLighting();
    this.spawnWanderMonsters();

    if (window.player && window.player.mesh) {
      window.player.mesh.position.set(0, 2, 0);
      this.camera.position.copy(window.player.mesh.position);
    }

    const waveInfo = document.getElementById('wave-info');
    if (waveInfo) {
      // 追加地图标签，不替换原有内容（保留 wave-num 和 enemy-count）
      let mapLabel = waveInfo.querySelector('.map-label');
      if (!mapLabel) {
        mapLabel = document.createElement('div');
        mapLabel.className = 'map-label';
        mapLabel.style.cssText = 'color:#44ff44;font-size:12px;';
        waveInfo.appendChild(mapLabel);
      }
      mapLabel.textContent = '毒雾沼泽 - 探索阶段';
    }

    if (typeof showToast === 'function') {
      showToast('你进入了毒雾沼泽，小心毒雾和变异生物！', 'warning');
    }

    this.defenseStartTimer = 30;
    console.log('[SwampMap] 地图生成完成');
  },

  // ====== 生成地形（5层FBM + 泥浆 + 腐烂植被） ======
  generateTerrain() {
    const S = SWAMP_MAP_CONFIG.MAP_SIZE;
    const segments = 200; // 增加分段数以平滑边缘
    const geo = new THREE.PlaneGeometry(S * 2, S * 2, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const vertices = geo.attributes.position.array;
    this.terrainData = [];

    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      const dist = Math.sqrt(x * x + z * z);

      // 边缘衰减：使用 smootherstep 替代线性硬截断，消除锯齿边缘
      let edgeFade = 1;
      if (dist > S * 0.75) {
        const t = Math.min(1, (dist - S * 0.75) / (S * 0.25));
        edgeFade = 1 - t * t * (3 - 2 * t); // smootherstep
      }
      // 最外圈强制压平到统一高度，形成自然沉降
      if (dist > S * 0.95) {
        edgeFade *= Math.max(0, 1 - (dist - S * 0.95) / (S * 0.05));
      }

      // 5层FBM噪声
      const h1 = SwampNoise.fbm2D(x * 0.005, z * 0.005, 5, 0.5, 2.0) * 4.0;
      const h2 = SwampNoise.fbm2D(x * 0.015, z * 0.015, 5, 0.5, 2.0) * 1.5;
      const h3 = SwampNoise.fbm2D(x * 0.03, z * 0.03, 5, 0.4, 2.0) * 0.6;
      const h4 = SwampNoise.fbm2D(x * 0.08, z * 0.08, 5, 0.35, 2.0) * 0.25;
      const h5 = SwampNoise.fbm2D(x * 0.2, z * 0.2, 5, 0.3, 2.0) * 0.1;

      let h = (h1 + h2 + h3 + h4 + h5) * edgeFade;
      const centerFlat = Math.max(0, 1 - dist / 40);
      h *= (1 - centerFlat * 0.7);

      vertices[i + 1] = h;
      this.terrainData.push({ x, z, h });
    }

    geo.computeVertexNormals();

    const mat = this.createSwampMaterial();
    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.name = 'swampGround';
    this.swampGroup.add(this.terrainMesh);

    // 添加边缘泥土环，包裹地形边缘
    const rimGeo = new THREE.CylinderGeometry(S, S * 0.92, 8, 64);
    const rimMat = new THREE.MeshLambertMaterial({ color: 0x3a4a2a });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = -4;
    rim.name = 'swampRim';
    this.swampGroup.add(rim);

    // 泥浆区域（深棕色有光泽）
    this.generateMudPatches();
    // 腐烂植被（深绿色斑块）
    this.generateRottingVegetation();
    // 发光苔藓地面
    this.generateGroundMoss();
  },

  // 创建沼泽地面材质
  createSwampMaterial() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#4a6a3a';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 4 + 1;
      const alpha = Math.random() * 0.3 + 0.1;
      const r = Math.floor(60 + Math.random() * 40);
      const g = Math.floor(80 + Math.random() * 30);
      const b = Math.floor(40 + Math.random() * 20);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 8 + 3;
      const alpha = Math.random() * 0.15;
      ctx.fillStyle = `rgba(40, 90, 50, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(x, y, size, size * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);

    return new THREE.MeshLambertMaterial({
      map: texture,
      color: SWAMP_MAP_CONFIG.GROUND_COLOR,
    });
  },

  // 生成泥浆区域
  generateMudPatches() {
    const S = SWAMP_MAP_CONFIG.MAP_SIZE;
    const mudMat = new THREE.MeshPhongMaterial({
      color: 0x5a4a3a,
      shininess: 30,
      transparent: true,
      opacity: 0.85,
    });

    for (let i = 0; i < 20; i++) {
      const mx = (Math.random() - 0.5) * S * 1.6;
      const mz = (Math.random() - 0.5) * S * 1.6;
      const terrainH = this.getTerrainHeight(mx, mz);
      const patchGeo = new THREE.CircleGeometry(3 + Math.random() * 8, 16);
      const patch = new THREE.Mesh(patchGeo, mudMat);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(mx, terrainH + 0.02, mz);
      patch.name = 'mudPatch';
      this.swampGroup.add(patch);
    }
  },

  // 生成腐烂植被（深绿色斑块）
  generateRottingVegetation() {
    const S = SWAMP_MAP_CONFIG.MAP_SIZE;
    const vegMat = new THREE.MeshLambertMaterial({ color: 0x3a5a2a });

    for (let i = 0; i < 50; i++) {
      const vx = (Math.random() - 0.5) * S * 1.6;
      const vz = (Math.random() - 0.5) * S * 1.6;
      const terrainH = this.getTerrainHeight(vx, vz);
      const size = 0.5 + Math.random() * 2;
      const vegGeo = new THREE.SphereGeometry(size, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2);
      const veg = new THREE.Mesh(vegGeo, vegMat);
      veg.position.set(vx, terrainH, vz);
      veg.scale.y = 0.3;
      veg.name = 'rottingVeg';
      this.swampGroup.add(veg);
    }
  },

  // 地面发光苔藓
  generateGroundMoss() {
    const S = SWAMP_MAP_CONFIG.MAP_SIZE;
    const mossGeo = new THREE.BufferGeometry();
    const mossCount = 800;
    const positions = new Float32Array(mossCount * 3);
    const colors = new Float32Array(mossCount * 3);

    for (let i = 0; i < mossCount; i++) {
      const x = (Math.random() - 0.5) * S * 1.6;
      const z = (Math.random() - 0.5) * S * 1.6;
      const h = this.getTerrainHeight(x, z);
      positions[i * 3] = x;
      positions[i * 3 + 1] = h + 0.05;
      positions[i * 3 + 2] = z;
      colors[i * 3] = 0.3 + Math.random() * 0.2;
      colors[i * 3 + 1] = 0.5 + Math.random() * 0.3;
      colors[i * 3 + 2] = 0.2;
    }

    mossGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    mossGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mossMat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const moss = new THREE.Points(mossGeo, mossMat);
    moss.name = 'groundMoss';
    this.swampGroup.add(moss);
  },

  // ====== 生成水坑（不规则多边形 + 气泡 + 漂浮物） ======
  generateWaterPools() {
    const S = SWAMP_MAP_CONFIG.MAP_SIZE;
    const poolCount = 15;

    for (let i = 0; i < poolCount; i++) {
      const px = (Math.random() - 0.5) * S * 1.6;
      const pz = (Math.random() - 0.5) * S * 1.6;
      const baseRadius = 5 + Math.random() * 15;
      const terrainH = this.getTerrainHeight(px, pz);

      const poolGroup = new THREE.Group();
      poolGroup.position.set(px, terrainH + 0.1, pz);

      // 不规则多边形水面（多个Circle叠加）
      for (let j = 0; j < 5; j++) {
        const r = baseRadius * (0.4 + Math.random() * 0.6);
        const waterGeo = new THREE.CircleGeometry(r, 16);
        const waterMat = new THREE.MeshPhongMaterial({
          color: 0x2a5a3a,
          transparent: true,
          opacity: 0.4 + Math.random() * 0.2,
          shininess: 80,
          specular: 0x224422,
        });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.rotation.x = -Math.PI / 2;
        water.position.set((Math.random() - 0.5) * baseRadius * 0.5, 0, (Math.random() - 0.5) * baseRadius * 0.5);
        water.scale.setScalar(0.8 + Math.random() * 0.4);
        poolGroup.add(water);
      }

      // 油污反光（彩虹色条纹）
      const oilGeo = new THREE.RingGeometry(baseRadius * 0.3, baseRadius * 0.35, 16);
      const oilMat = new THREE.MeshBasicMaterial({
        color: 0x8844aa,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      });
      const oil = new THREE.Mesh(oilGeo, oilMat);
      oil.rotation.x = -Math.PI / 2;
      oil.position.y = 0.01;
      poolGroup.add(oil);

      // 泥泞边缘
      const mudEdgeGeo = new THREE.RingGeometry(baseRadius * 0.8, baseRadius * 1.1, 24);
      const mudEdgeMat = new THREE.MeshLambertMaterial({
        color: 0x3a2a1a,
        transparent: true,
        opacity: 0.5,
      });
      const mudEdge = new THREE.Mesh(mudEdgeGeo, mudEdgeMat);
      mudEdge.rotation.x = -Math.PI / 2;
      mudEdge.position.y = 0.005;
      poolGroup.add(mudEdge);

      // 气泡粒子系统
      const bubbleCount = 20;
      const bubblePositions = new Float32Array(bubbleCount * 3);
      for (let b = 0; b < bubbleCount; b++) {
        bubblePositions[b * 3] = (Math.random() - 0.5) * baseRadius * 0.8;
        bubblePositions[b * 3 + 1] = Math.random() * 0.3;
        bubblePositions[b * 3 + 2] = (Math.random() - 0.5) * baseRadius * 0.8;
      }
      const bubbleGeo = new THREE.BufferGeometry();
      bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));
      const bubbleMat = new THREE.PointsMaterial({
        size: 0.2,
        color: 0x88ccaa,
        transparent: true,
        opacity: 0.4,
      });
      const bubbles = new THREE.Points(bubbleGeo, bubbleMat);
      poolGroup.add(bubbles);
      this.bubbleParticles.push({ mesh: bubbles, baseY: 0, speed: 0.5 + Math.random() * 0.5 });

      // 漂浮枯叶
      for (let f = 0; f < 3 + Math.floor(Math.random() * 4); f++) {
        const leafGeo = new THREE.PlaneGeometry(0.3 + Math.random() * 0.3, 0.2 + Math.random() * 0.2);
        const leafMat = new THREE.MeshLambertMaterial({
          color: 0x3a2a0a,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
        });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.rotation.x = -Math.PI / 2;
        leaf.rotation.z = Math.random() * Math.PI;
        leaf.position.set((Math.random() - 0.5) * baseRadius * 0.6, 0.02, (Math.random() - 0.5) * baseRadius * 0.6);
        poolGroup.add(leaf);
      }

      // 漂浮树枝
      for (let t = 0; t < 1 + Math.floor(Math.random() * 2); t++) {
        const twigGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.8 + Math.random() * 1.2, 4);
        const twigMat = new THREE.MeshLambertMaterial({ color: 0x2a1a0a });
        const twig = new THREE.Mesh(twigGeo, twigMat);
        twig.rotation.x = Math.PI / 2;
        twig.rotation.z = Math.random() * Math.PI;
        twig.position.set((Math.random() - 0.5) * baseRadius * 0.5, 0.03, (Math.random() - 0.5) * baseRadius * 0.5);
        poolGroup.add(twig);
      }

      poolGroup.name = 'swampPool';
      this.swampGroup.add(poolGroup);
      this.waterPools.push(poolGroup);

      // 水坑触发区域（进入减速）
      SwampCollision.addTrigger('waterPool_' + i, new THREE.Vector3(px, terrainH, pz), baseRadius, (event) => {
        if (event === 'enter' && window.player) {
          if (typeof showToast === 'function') showToast('陷入沼泽水坑，移动减速！', 'warning');
        }
      });
    }
  },

  // ====== 生成枯树（扭曲主干 + 树皮 + 枯枝 + 树根 + 苔藓 + 鸟巢） ======
  generateDeadTrees() {
    const S = SWAMP_MAP_CONFIG.MAP_SIZE;
    const treeCount = 30;

    for (let i = 0; i < treeCount; i++) {
      const tx = (Math.random() - 0.5) * S * 1.6;
      const tz = (Math.random() - 0.5) * S * 1.6;
      const terrainH = this.getTerrainHeight(tx, tz);
      const tree = this.createDeadTree();
      tree.position.set(tx, terrainH, tz);
      tree.rotation.y = Math.random() * Math.PI * 2;
      tree.rotation.x = (Math.random() - 0.5) * 0.3;
      tree.rotation.z = (Math.random() - 0.5) * 0.3;
      this.swampGroup.add(tree);
      this.deadTrees.push(tree);

      // 树木碰撞体（使用圆柱体更贴合树干形状，半径0.5高度4.5）
      SwampCollision.addCylinder('deadTree_' + i, new THREE.Vector3(tx, terrainH + 2.25, tz), 0.5, 4.5);
    }
  },

  createDeadTree() {
    const group = new THREE.Group();
    group.name = 'swampTree';
    const trunkHeight = 4 + Math.random() * 6;

    // 扭曲主干（多段不同半径）
    const segments = 5;
    for (let s = 0; s < segments; s++) {
      const t = s / segments;
      const nextT = (s + 1) / segments;
      const r1 = 0.35 * (1 - t * 0.5) + Math.random() * 0.05;
      const r2 = 0.35 * (1 - nextT * 0.5) + Math.random() * 0.05;
      const segH = trunkHeight / segments;
      const segGeo = new THREE.CylinderGeometry(r2, r1, segH, 7);

      // 树皮纹理用颜色变化模拟
      const barkDarkness = 0.7 + Math.random() * 0.3;
      const barkMat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(0x2a1a0a).multiplyScalar(barkDarkness),
      });

      const seg = new THREE.Mesh(segGeo, barkMat);
      seg.position.y = segH / 2 + s * segH;
      seg.rotation.z = (Math.random() - 0.5) * 0.15;
      seg.rotation.x = (Math.random() - 0.5) * 0.1;
      seg.castShadow = true;
      group.add(seg);
    }

    // 更多更细的枯枝
    const branchCount = 4 + Math.floor(Math.random() * 6);
    for (let i = 0; i < branchCount; i++) {
      const branchLen = 0.8 + Math.random() * 3.5;
      const branchGeo = new THREE.CylinderGeometry(0.02 + Math.random() * 0.04, 0.06 + Math.random() * 0.08, branchLen, 4);
      const branchMat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(0x2a1a0a).multiplyScalar(0.8 + Math.random() * 0.4),
      });
      const branch = new THREE.Mesh(branchGeo, branchMat);
      branch.position.y = trunkHeight * (0.3 + Math.random() * 0.65);
      branch.rotation.z = (Math.random() - 0.5) * 2.5;
      branch.rotation.x = (Math.random() - 0.5) * 1.5;
      branch.position.x = Math.sin(branch.rotation.z) * branchLen * 0.35;
      branch.position.z = Math.cos(branch.rotation.x) * branchLen * 0.2;
      branch.castShadow = true;
      group.add(branch);

      // 子分支
      if (Math.random() > 0.5) {
        const subLen = branchLen * 0.4;
        const subGeo = new THREE.CylinderGeometry(0.01, 0.03, subLen, 3);
        const sub = new THREE.Mesh(subGeo, branchMat);
        sub.position.copy(branch.position);
        sub.position.y += branchLen * 0.3;
        sub.rotation.z = branch.rotation.z + (Math.random() - 0.5);
        sub.rotation.x = branch.rotation.x + (Math.random() - 0.5);
        group.add(sub);
      }
    }

    // 暴露的树根（弯曲圆柱体）
    const rootCount = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < rootCount; i++) {
      const rootLen = 0.8 + Math.random() * 2;
      const rootGeo = new THREE.CylinderGeometry(0.04, 0.1, rootLen, 4);
      const rootMat = new THREE.MeshLambertMaterial({ color: 0x1f1408 });
      const root = new THREE.Mesh(rootGeo, rootMat);
      const angle = (i / rootCount) * Math.PI * 2 + Math.random() * 0.5;
      root.position.set(Math.cos(angle) * 0.3, rootLen * 0.2, Math.sin(angle) * 0.3);
      root.rotation.z = Math.cos(angle) * 0.8;
      root.rotation.x = Math.sin(angle) * 0.8;
      root.castShadow = true;
      group.add(root);
    }

    // 树干下部苔藓（小绿色球体）
    const mossCount = 6 + Math.floor(Math.random() * 8);
    for (let i = 0; i < mossCount; i++) {
      const mossGeo = new THREE.SphereGeometry(0.06 + Math.random() * 0.1, 4, 4);
      const mossMat = new THREE.MeshLambertMaterial({ color: 0x2a5a1a });
      const moss = new THREE.Mesh(mossGeo, mossMat);
      moss.name = 'treeMoss';
      const angle = Math.random() * Math.PI * 2;
      const h = Math.random() * trunkHeight * 0.4;
      moss.position.set(Math.cos(angle) * 0.3, h, Math.sin(angle) * 0.3);
      group.add(moss);
    }

    // 2-3个树上有鸟巢
    if (Math.random() > 0.6) {
      const nestY = trunkHeight * (0.6 + Math.random() * 0.3);
      const nestGeo = new THREE.CylinderGeometry(0.25, 0.2, 0.15, 8);
      const nestMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
      const nest = new THREE.Mesh(nestGeo, nestMat);
      nest.position.set(0.3, nestY, 0);
      group.add(nest);

      // 细枝
      for (let t = 0; t < 4; t++) {
        const twigGeo = new THREE.CylinderGeometry(0.005, 0.01, 0.3, 3);
        const twigMat = new THREE.MeshLambertMaterial({ color: 0x2a1a0a });
        const twig = new THREE.Mesh(twigGeo, twigMat);
        twig.position.copy(nest.position);
        twig.rotation.z = (Math.random() - 0.5) * 1.5;
        twig.rotation.x = (Math.random() - 0.5) * 1.5;
        group.add(twig);
      }
    }

    return group;
  },

  // ====== 生成废弃建筑（核污水设施遗迹） ======
  generateRuins() {
    const S = SWAMP_MAP_CONFIG.MAP_SIZE;

    // 生成1个主建筑群
    const rx = (Math.random() - 0.5) * S * 0.6;
    const rz = (Math.random() - 0.5) * S * 0.6;
    const terrainH = this.getTerrainHeight(rx, rz);

    const mainRuin = this.createMainRuin();
    mainRuin.position.set(rx, terrainH, rz);
    this.swampGroup.add(mainRuin);
    this.ruins.push(mainRuin);

    // 2个冷却塔
    for (let i = 0; i < 2; i++) {
      const cx = rx + 20 + i * 15 + (Math.random() - 0.5) * 5;
      const cz = rz + 15 + (Math.random() - 0.5) * 5;
      const cH = this.getTerrainHeight(cx, cz);
      const tower = this.createCoolingTower(i === 1); // 第二个部分倒塌
      tower.position.set(cx, cH, cz);
      this.swampGroup.add(tower);
      this.ruins.push(tower);

      // 冷却塔碰撞
      SwampCollision.addCylinder('coolingTower_' + i, new THREE.Vector3(cx, cH + 12, cz), 9, 24);
    }

    // 3个储液罐
    for (let i = 0; i < 3; i++) {
      const tx = rx - 15 + i * 8 + (Math.random() - 0.5) * 3;
      const tz = rz - 10 + (Math.random() - 0.5) * 5;
      const tH = this.getTerrainHeight(tx, tz);
      const tank = this.createStorageTank(i === 2); // 第三个破裂
      tank.position.set(tx, tH, tz);
      this.swampGroup.add(tank);
      this.ruins.push(tank);

      // 储液罐碰撞
      SwampCollision.addCylinder('storageTank_' + i, new THREE.Vector3(tx, tH + 3.5, tz), 3.5, 7);
    }

    // 管道系统
    const pipeSystem = this.createPipeSystem(rx, rz, terrainH);
    this.swampGroup.add(pipeSystem);
    this.ruins.push(pipeSystem);

    // 围栏
    const fence = this.createBrokenFence(rx, rz, terrainH);
    this.swampGroup.add(fence);
    this.ruins.push(fence);
  },

  // 主建筑：残破混凝土结构
  createMainRuin() {
    const group = new THREE.Group();
    group.name = 'swampBuilding';
    const concreteMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

    // 主墙体（厚0.8米，高4-8米）
    const wallH = 5 + Math.random() * 3;
    const wallW = 8 + Math.random() * 6;
    const wallGeo = new THREE.BoxGeometry(wallW, wallH, 0.8);
    const wall = new THREE.Mesh(wallGeo, concreteMat);
    wall.position.y = wallH / 2;
    wall.castShadow = true;
    group.add(wall);

    // 裂缝（用深色线条模拟）
    for (let i = 0; i < 5; i++) {
      const crackGeo = new THREE.BoxGeometry(0.05, 0.5 + Math.random() * 1.5, 0.02);
      const crack = new THREE.Mesh(crackGeo, darkMat);
      crack.position.set((Math.random() - 0.5) * wallW * 0.8, 1 + Math.random() * wallH * 0.6, 0.41);
      group.add(crack);
    }

    // 第二面墙（部分倒塌）
    const wall2H = wallH * (0.3 + Math.random() * 0.5);
    const wall2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, wall2H, wallW * 0.7),
      concreteMat
    );
    wall2.position.set(wallW * 0.35, wall2H / 2, 0);
    wall2.rotation.y = Math.random() * 0.2 - 0.1;
    wall2.castShadow = true;
    group.add(wall2);

    // 倒塌部分（倾斜的Box）
    const fallenGeo = new THREE.BoxGeometry(wallW * 0.4, 0.6, wallW * 0.3);
    const fallen = new THREE.Mesh(fallenGeo, concreteMat);
    fallen.position.set(wallW * 0.3, 0.3, 3);
    fallen.rotation.z = 0.3;
    fallen.rotation.y = 0.2;
    fallen.castShadow = true;
    group.add(fallen);

    // 碎块散落
    for (let i = 0; i < 8; i++) {
      const chunkGeo = new THREE.BoxGeometry(0.3 + Math.random() * 0.5, 0.2 + Math.random() * 0.4, 0.3 + Math.random() * 0.5);
      const chunk = new THREE.Mesh(chunkGeo, concreteMat);
      chunk.position.set((Math.random() - 0.5) * wallW, 0.2, 2 + Math.random() * 4);
      chunk.rotation.set(Math.random(), Math.random(), Math.random());
      chunk.castShadow = true;
      group.add(chunk);
    }

    // 暴露的钢筋（细圆柱体，锈色）
    const rustMat = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
    for (let i = 0; i < 6; i++) {
      const rebarGeo = new THREE.CylinderGeometry(0.03, 0.03, 1 + Math.random() * 2, 4);
      const rebar = new THREE.Mesh(rebarGeo, rustMat);
      rebar.position.set((Math.random() - 0.5) * wallW * 0.7, wallH * 0.7 + Math.random() * 1, 0.45);
      rebar.rotation.z = (Math.random() - 0.5) * 0.5;
      group.add(rebar);
    }

    // 警告标志（三叶草辐射标志，用几何体模拟）
    for (let i = 0; i < 3; i++) {
      const signGroup = new THREE.Group();
      signGroup.name = 'radiationSign';
      const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 4);
      const poleMat = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 1.25;
      signGroup.add(pole);

      // 标志牌
      const boardGeo = new THREE.BoxGeometry(1.2, 1, 0.08);
      const boardMat = new THREE.MeshLambertMaterial({ color: 0x8a6a3a });
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.y = 2.3;
      signGroup.add(board);

      // 三叶草辐射标志（三个扇形）
      for (let j = 0; j < 3; j++) {
        const leafGeo = new THREE.CircleGeometry(0.15, 6, j * Math.PI * 2 / 3, Math.PI * 2 / 3 - 0.1);
        const leafMat = new THREE.MeshBasicMaterial({ color: 0xaa2222, side: THREE.DoubleSide });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(0, 2.3, 0.05);
        signGroup.add(leaf);
      }

      signGroup.position.set((Math.random() - 0.5) * wallW * 1.5, 0, 4 + Math.random() * 3);
      signGroup.rotation.y = Math.random() * Math.PI * 2;
      group.add(signGroup);
    }

    // 碰撞体
    SwampCollision.addBox('mainRuin_wall', new THREE.Vector3(0, wallH / 2, 0), { x: wallW, y: wallH, z: 0.8 }, { y: 0 });
    SwampCollision.addBox('mainRuin_wall2', new THREE.Vector3(wallW * 0.35, wall2H / 2, 0), { x: 0.8, y: wall2H, z: wallW * 0.7 }, { y: wall2.rotation.y });

    return group;
  },

  // 冷却塔（双曲面，用多个圆柱体堆叠模拟）
  createCoolingTower(collapsed) {
    const group = new THREE.Group();
    group.name = 'swampCoolingTower';
    const concreteMat = new THREE.MeshLambertMaterial({ color: 0x666666 });

    const segments = 12;
    const baseR = 8;
    const topR = 5;
    const height = 24;

    for (let i = 0; i < segments; i++) {
      if (collapsed && i > segments * 0.6) break; // 部分倒塌

      const t = i / segments;
      const r = baseR + (topR - baseR) * t;
      const segH = height / segments;
      const segGeo = new THREE.CylinderGeometry(
        baseR + (topR - baseR) * ((i + 1) / segments),
        r,
        segH,
        16, 1, true
      );
      const seg = new THREE.Mesh(segGeo, concreteMat);
      seg.position.y = segH / 2 + i * segH;
      if (collapsed && i > segments * 0.4) {
        seg.rotation.z = (i - segments * 0.4) * 0.05;
      }
      seg.castShadow = true;
      group.add(seg);
    }

    // 顶部蒸汽粒子
    const steamCount = 30;
    const steamPositions = new Float32Array(steamCount * 3);
    for (let i = 0; i < steamCount; i++) {
      steamPositions[i * 3] = (Math.random() - 0.5) * 6;
      steamPositions[i * 3 + 1] = height + Math.random() * 3;
      steamPositions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const steamGeo = new THREE.BufferGeometry();
    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));
    const steamMat = new THREE.PointsMaterial({
      size: 0.8,
      color: 0xaaaaaa,
      transparent: true,
      opacity: 0.3,
    });
    const steam = new THREE.Points(steamGeo, steamMat);
    group.add(steam);
    this.steamParticles.push({ mesh: steam, baseY: height, speed: 0.3 + Math.random() * 0.5 });

    return group;
  },

  // 储液罐（大型圆柱体，锈色）
  createStorageTank(broken) {
    const group = new THREE.Group();
    group.name = 'swampTank';
    const rustMat = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
    const tankGeo = new THREE.CylinderGeometry(3.5, 3.5, 7, 16);
    const tank = new THREE.Mesh(tankGeo, rustMat);
    tank.position.y = 3.5;
    tank.castShadow = true;
    group.add(tank);

    // 顶部半球
    const domeGeo = new THREE.SphereGeometry(3.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, rustMat);
    dome.position.y = 7;
    group.add(dome);

    // 管道连接
    const pipeGeo = new THREE.CylinderGeometry(0.2, 0.2, 4, 6);
    const pipeMat = new THREE.MeshLambertMaterial({ color: 0x4a5a4a });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(3.5, 4, 0);
    group.add(pipe);

    if (broken) {
      // 破裂效果
      const crackGeo = new THREE.BoxGeometry(1.5, 2, 0.1);
      const crackMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      const crack = new THREE.Mesh(crackGeo, crackMat);
      crack.position.set(3.5, 3, 0);
      group.add(crack);

      // 绿色液体流出（地面绿色斑块）
      const spillGeo = new THREE.CircleGeometry(4, 16);
      const spillMat = new THREE.MeshLambertMaterial({
        color: 0x22aa22,
        transparent: true,
        opacity: 0.6,
      });
      const spill = new THREE.Mesh(spillGeo, spillMat);
      spill.rotation.x = -Math.PI / 2;
      spill.position.set(5, 0.02, 0);
      group.add(spill);

      // 滴落粒子
      const leakCount = 15;
      const leakPositions = new Float32Array(leakCount * 3);
      for (let i = 0; i < leakCount; i++) {
        leakPositions[i * 3] = 3.5 + Math.random() * 0.3;
        leakPositions[i * 3 + 1] = 3 - Math.random() * 3;
        leakPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      }
      const leakGeo = new THREE.BufferGeometry();
      leakGeo.setAttribute('position', new THREE.BufferAttribute(leakPositions, 3));
      const leakMat = new THREE.PointsMaterial({
        size: 0.15,
        color: 0x33cc33,
        transparent: true,
        opacity: 0.7,
      });
      const leak = new THREE.Points(leakGeo, leakMat);
      group.add(leak);
      this.leakParticles.push({ mesh: leak, baseX: 3.5, speed: 1.5 });
    }

    return group;
  },

  // 管道系统（复杂管道网络）
  createPipeSystem(bx, bz, bH) {
    const group = new THREE.Group();
    group.name = 'swampPipe';
    const pipeMat = new THREE.MeshLambertMaterial({ color: 0x4a5a4a });

    const pipes = [
      { start: [bx - 10, bH + 2, bz], end: [bx + 10, bH + 2, bz], radius: 0.4 },
      { start: [bx, bH + 1, bz - 8], end: [bx, bH + 1, bz + 8], radius: 0.3 },
      { start: [bx - 5, bH + 3, bz - 5], end: [bx + 5, bH + 3, bz + 5], radius: 0.25 },
    ];

    pipes.forEach((p, idx) => {
      const start = new THREE.Vector3(...p.start);
      const end = new THREE.Vector3(...p.end);
      const dir = new THREE.Vector3().subVectors(end, start);
      const len = dir.length();
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

      const pipeGeo = new THREE.CylinderGeometry(p.radius, p.radius, len, 8);
      const pipe = new THREE.Mesh(pipeGeo, pipeMat);
      pipe.position.copy(mid);
      pipe.lookAt(end);
      pipe.rotateX(Math.PI / 2);
      pipe.castShadow = true;
      group.add(pipe);

      // 泄漏点（绿色粒子滴落）
      if (Math.random() > 0.5) {
        const leakX = start.x + (end.x - start.x) * 0.3;
        const leakZ = start.z + (end.z - start.z) * 0.3;
        const leakY = start.y;
        const leakCount = 8;
        const leakPositions = new Float32Array(leakCount * 3);
        for (let i = 0; i < leakCount; i++) {
          leakPositions[i * 3] = leakX + (Math.random() - 0.5) * 0.2;
          leakPositions[i * 3 + 1] = leakY - Math.random() * 2;
          leakPositions[i * 3 + 2] = leakZ + (Math.random() - 0.5) * 0.2;
        }
        const leakGeo = new THREE.BufferGeometry();
        leakGeo.setAttribute('position', new THREE.BufferAttribute(leakPositions, 3));
        const leakMat = new THREE.PointsMaterial({
          size: 0.1,
          color: 0x33cc33,
          transparent: true,
          opacity: 0.6,
        });
        const leak = new THREE.Points(leakGeo, leakMat);
        group.add(leak);
        this.leakParticles.push({ mesh: leak, baseX: leakX, speed: 1.0 });
      }
    });

    return group;
  },

  // 破损铁丝网围栏
  createBrokenFence(bx, bz, bH) {
    const group = new THREE.Group();
    group.name = 'swampFence';
    const postMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x777777, transparent: true, opacity: 0.4 });

    const postCount = 12;
    const radius = 25;

    for (let i = 0; i < postCount; i++) {
      if (Math.random() > 0.8) continue; // 部分倒塌

      const angle = (i / postCount) * Math.PI * 2;
      const px = bx + Math.cos(angle) * radius;
      const pz = bz + Math.sin(angle) * radius;
      const pH = this.getTerrainHeight(px, pz);

      const postGeo = new THREE.CylinderGeometry(0.06, 0.08, 2.5, 4);
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(px - bx, 1.25, pz - bz);
      if (Math.random() > 0.7) {
        post.rotation.z = (Math.random() - 0.5) * 0.5;
      }
      group.add(post);

      // 铁丝网
      if (i < postCount - 1 && Math.random() > 0.3) {
        const nextAngle = ((i + 1) / postCount) * Math.PI * 2;
        const nx = bx + Math.cos(nextAngle) * radius;
        const nz = bz + Math.sin(nextAngle) * radius;
        const wireGeo = new THREE.PlaneGeometry(1, 0.02);
        const wire = new THREE.Mesh(wireGeo, wireMat);
        const mx = (px + nx) / 2 - bx;
        const mz = (pz + nz) / 2 - bz;
        wire.position.set(mx, 1.8, mz);
        wire.lookAt(nx - bx, 1.8, nz - bz);
        group.add(wire);
      }
    }

    return group;
  },

  // ====== 生成变异植物（发光蘑菇群、变异藤蔓、毒草、发光苔藓） ======
  generateGlowPlants() {
    const S = SWAMP_MAP_CONFIG.MAP_SIZE;
    const plantCount = 40;

    for (let i = 0; i < plantCount; i++) {
      const px = (Math.random() - 0.5) * S * 1.6;
      const pz = (Math.random() - 0.5) * S * 1.6;
      const terrainH = this.getTerrainHeight(px, pz);
      const plant = this.createGlowPlant();
      plant.position.set(px, terrainH, pz);
      this.swampGroup.add(plant);
      this.glowPlants.push(plant);
    }
  },

  createGlowPlant() {
    const group = new THREE.Group();
    group.name = 'swampGlowPlant';
    const type = Math.random();

    if (type < 0.35) {
      // 发光蘑菇群
      group.add(this.createMushroomCluster());
    } else if (type < 0.6) {
      // 变异藤蔓
      group.add(this.createMutantVine());
    } else if (type < 0.8) {
      // 毒草
      group.add(this.createPoisonGrass());
    } else {
      // 捕虫草
      group.add(this.createVenusFlytrap());
    }

    return group;
  },

  // 发光蘑菇群
  createMushroomCluster() {
    const group = new THREE.Group();
    group.name = 'swampMushroom';
    const clusterSize = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < clusterSize; i++) {
      const isLarge = i === 0 && Math.random() > 0.5;
      const stemH = isLarge ? 1 + Math.random() * 1 : 0.2 + Math.random() * 0.4;
      const capR = isLarge ? 0.5 + Math.random() * 0.5 : 0.08 + Math.random() * 0.12;

      const stemGeo = new THREE.CylinderGeometry(capR * 0.3, capR * 0.4, stemH, 6);
      const stemMat = new THREE.MeshLambertMaterial({ color: 0x445533 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set((Math.random() - 0.5) * 0.8, stemH / 2, (Math.random() - 0.5) * 0.8);
      group.add(stem);

      const capGeo = new THREE.SphereGeometry(capR, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      const glowIntensity = 0.4 + Math.random() * 0.6;
      const capMat = new THREE.MeshBasicMaterial({
        color: SWAMP_MAP_CONFIG.GLOW_COLOR,
        transparent: true,
        opacity: glowIntensity,
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.copy(stem.position);
      cap.position.y += stemH / 2;
      group.add(cap);

      if (isLarge) {
        const light = new THREE.PointLight(0x44ff44, 0.5, 8);
        light.position.copy(cap.position);
        light.position.y += 0.3;
        group.add(light);
      }
    }

    // 菌丝网络（细线）
    for (let i = 0; i < 5; i++) {
      const myceliumGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.5 + Math.random() * 1, 3);
      const myceliumMat = new THREE.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.3 });
      const mycelium = new THREE.Mesh(myceliumGeo, myceliumMat);
      mycelium.rotation.z = Math.PI / 2;
      mycelium.rotation.y = Math.random() * Math.PI;
      mycelium.position.set((Math.random() - 0.5) * 0.5, 0.02, (Math.random() - 0.5) * 0.5);
      group.add(mycelium);
    }

    return group;
  },

  // 变异藤蔓
  createMutantVine() {
    const group = new THREE.Group();
    group.name = 'swampVine';
    const vineCount = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < vineCount; i++) {
      const vineLen = 1.5 + Math.random() * 2.5;
      const vineRadius = 0.05 + Math.random() * 0.1;
      const vineGeo = new THREE.CylinderGeometry(vineRadius * 0.6, vineRadius, vineLen, 5);
      const vineMat = new THREE.MeshLambertMaterial({ color: 0x2a5a1a });
      const vine = new THREE.Mesh(vineGeo, vineMat);
      vine.position.set((Math.random() - 0.5) * 0.5, vineLen / 2, (Math.random() - 0.5) * 0.5);
      vine.rotation.z = (Math.random() - 0.5) * 0.8;
      vine.rotation.x = (Math.random() - 0.5) * 0.4;
      group.add(vine);

      // 发光果实
      const fruitCount = 1 + Math.floor(Math.random() * 3);
      for (let j = 0; j < fruitCount; j++) {
        const fruitGeo = new THREE.SphereGeometry(0.08 + Math.random() * 0.06, 6, 6);
        const fruitMat = new THREE.MeshBasicMaterial({
          color: 0x88ff44,
          transparent: true,
          opacity: 0.7,
        });
        const fruit = new THREE.Mesh(fruitGeo, fruitMat);
        fruit.name = 'vineFruit';
        fruit.position.copy(vine.position);
        fruit.position.y += (Math.random() - 0.5) * vineLen * 0.6;
        fruit.position.x += (Math.random() - 0.5) * 0.2;
        group.add(fruit);
      }
    }

    return group;
  },

  // 毒草
  createPoisonGrass() {
    const group = new THREE.Group();
    group.name = 'swampPoisonGrass';
    const grassCount = 8 + Math.floor(Math.random() * 12);

    for (let i = 0; i < grassCount; i++) {
      const grassH = 0.8 + Math.random() * 1.2;
      const grassGeo = new THREE.CylinderGeometry(0.01, 0.03, grassH, 3);
      const isPurple = Math.random() > 0.5;
      const grassMat = new THREE.MeshLambertMaterial({
        color: isPurple ? 0x4a1a4a : 0x1a1a1a,
      });
      const grass = new THREE.Mesh(grassGeo, grassMat);
      grass.position.set((Math.random() - 0.5) * 0.6, grassH / 2, (Math.random() - 0.5) * 0.6);
      grass.rotation.z = (Math.random() - 0.5) * 0.4;
      group.add(grass);
    }

    return group;
  },

  // 捕虫草
  createVenusFlytrap() {
    const group = new THREE.Group();
    group.name = 'swampFlytrap';

    // 茎
    const stemGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.8, 4);
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x2a4a1a });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.4;
    group.add(stem);

    // 两个叶片
    for (let i = 0; i < 2; i++) {
      const leafGeo = new THREE.SphereGeometry(0.25, 8, 6, 0, Math.PI, 0, Math.PI / 2);
      const leafMat = new THREE.MeshLambertMaterial({
        color: i === 0 ? 0x3a1a3a : 0x1a3a1a,
        side: THREE.DoubleSide,
      });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.y = 0.8;
      leaf.rotation.y = i * Math.PI;
      leaf.rotation.x = -0.3;
      group.add(leaf);

      // 叶片内侧刺
      for (let s = 0; s < 5; s++) {
        const spikeGeo = new THREE.ConeGeometry(0.01, 0.06, 3);
        const spikeMat = new THREE.MeshLambertMaterial({ color: 0xaa4444 });
        const spike = new THREE.Mesh(spikeGeo, spikeMat);
        const angle = (s / 5) * Math.PI;
        spike.position.set(
          Math.cos(angle) * 0.15 * (i === 0 ? 1 : -1),
          0.82,
          Math.sin(angle) * 0.15
        );
        spike.rotation.z = i === 0 ? -0.5 : 0.5;
        group.add(spike);
      }
    }

    // 触发毛
    for (let i = 0; i < 3; i++) {
      const hairGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.08, 3);
      const hairMat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.set((Math.random() - 0.5) * 0.1, 0.82, (Math.random() - 0.5) * 0.1);
      group.add(hair);
    }

    return group;
  },

  // ====== 生成毒雾粒子系统（1000个 + billboard + 风向 + 闪电） ======
  generatePoisonFog() {
    const particleCount = 1000;
    const S = SWAMP_MAP_CONFIG.MAP_SIZE;

    // 使用小型平面替代点（billboard雾团）
    const fogGroup = new THREE.Group();

    for (let i = 0; i < particleCount; i++) {
      const size = 1.5 + Math.random() * 3;
      const planeGeo = new THREE.PlaneGeometry(size, size);
      const y = Math.random() * 8 + 0.5;
      const greenRatio = y / 10;
      const fogMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.05 + greenRatio * 0.1, 0.3 + greenRatio * 0.3, 0.05 + greenRatio * 0.1),
        transparent: true,
        opacity: 0.15 + Math.random() * 0.15,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const plane = new THREE.Mesh(planeGeo, fogMat);
      plane.position.set(
        (Math.random() - 0.5) * S * 2,
        y,
        (Math.random() - 0.5) * S * 2
      );
      plane.rotation.y = Math.random() * Math.PI;
      plane.userData = {
        baseX: plane.position.x,
        baseZ: plane.position.z,
        baseY: plane.position.y,
        speed: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
      };
      fogGroup.add(plane);
    }

    fogGroup.name = 'poisonFog';
    this.swampGroup.add(fogGroup);
    this.poisonParticles = fogGroup;

    // 闪电效果线
    const lightningGeo = new THREE.BufferGeometry();
    const lightningPositions = new Float32Array(6);
    lightningGeo.setAttribute('position', new THREE.BufferAttribute(lightningPositions, 3));
    const lightningMat = new THREE.LineBasicMaterial({
      color: 0x44ff44,
      transparent: true,
      opacity: 0,
    });
    this.lightningLine = new THREE.Line(lightningGeo, lightningMat);
    this.lightningLine.name = 'swampLightning';
    this.swampGroup.add(this.lightningLine);
  },

  // ====== 设置环境光 ======
  setupLighting() {
    const existingLights = [];
    this.swampGroup.traverse(child => {
      if (child.isLight) existingLights.push(child);
    });
    existingLights.forEach(l => this.swampGroup.remove(l));

    const ambient = new THREE.AmbientLight(0x3a5a3a, 0.8);
    this.swampGroup.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x4a6a4a, 0.6);
    dirLight.position.set(50, 80, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    this.swampGroup.add(dirLight);

    const glowLight1 = new THREE.PointLight(0x44ff44, 0.5, 30);
    glowLight1.position.set(20, 3, 20);
    this.swampGroup.add(glowLight1);

    const glowLight2 = new THREE.PointLight(0x44ff44, 0.3, 25);
    glowLight2.position.set(-30, 3, -15);
    this.swampGroup.add(glowLight2);

    const fillLight = new THREE.PointLight(0x5a7a4a, 0.4, 60);
    fillLight.position.set(0, 15, 0);
    this.swampGroup.add(fillLight);
  },

  // ====== 生成游荡怪物（深度模型） ======
  spawnWanderMonsters() {
    if (!this.scene) return;
    this.mutants = [];
    const S = SWAMP_MAP_CONFIG.MAP_SIZE;
    const monsterTypes = this.getSwampMonsterTypes();

    for (let i = 0; i < SWAMP_MAP_CONFIG.WANDER_MONSTER_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * (S * 0.7);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const terrainH = this.getTerrainHeight(x, z);
      const typeInfo = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];

      const mesh = this.createMutantMesh(typeInfo);
      mesh.position.set(x, terrainH, z);
      this.swampGroup.add(mesh);

      this.mutants.push({
        mesh: mesh,
        type: typeInfo.name,
        hp: typeInfo.hp,
        maxHp: typeInfo.hp,
        speed: typeInfo.speed,
        damage: typeInfo.damage,
        attackRange: typeInfo.attackRange || 3,
        state: 'wander',
        wanderTarget: new THREE.Vector3(
          (Math.random() - 0.5) * S,
          terrainH,
          (Math.random() - 0.5) * S
        ),
        wanderTimer: 0,
        attackCooldown: 0,
      });
    }
  },

  // 创建变异怪物mesh（深度模型）
  createMutantMesh(typeInfo) {
    const group = new THREE.Group();
    group.name = 'swampMonster';

    switch (typeInfo.name) {
      case '变异蛙人':
        return this.createMutantFrogman(group);
      case '毒液喷射者':
        return this.createVenomSpitter(group);
      case '沼泽巨蠕虫':
        return this.createGiantWorm(group);
      case '辐射僵尸':
        return this.createRadiationZombie(group);
      default:
        return this.createBasicMutant(group, typeInfo);
    }
  },

  // 变异蛙人
  createMutantFrogman(group) {
    const bodyColor = 0x44aa44;
    const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });

    // 身体（有疙瘩）
    const bodyGeo = new THREE.SphereGeometry(0.5, 10, 8);
    bodyGeo.scale(1, 1.3, 0.8);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);

    // 疙瘩（小球体覆盖）
    for (let i = 0; i < 15; i++) {
      const bumpGeo = new THREE.SphereGeometry(0.06 + Math.random() * 0.04, 4, 4);
      const bumpMat = new THREE.MeshLambertMaterial({ color: 0x338833 });
      const bump = new THREE.Mesh(bumpGeo, bumpMat);
      bump.name = 'frogman_bump';
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      bump.position.set(
        body.position.x + Math.sin(phi) * Math.cos(theta) * 0.45,
        body.position.y + Math.cos(phi) * 0.6,
        body.position.z + Math.sin(phi) * Math.sin(theta) * 0.35
      );
      group.add(bump);
    }

    // 巨大凸出眼睛
    const eyeGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.name = 'frogman_eye';
    leftEye.position.set(-0.2, 1.6, 0.35);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.name = 'frogman_eye';
    rightEye.position.set(0.2, 1.6, 0.35);
    group.add(rightEye);

    // 瞳孔
    const pupilGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.name = 'frogman_pupil';
    leftPupil.position.set(-0.2, 1.6, 0.5);
    group.add(leftPupil);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.name = 'frogman_pupil';
    rightPupil.position.set(0.2, 1.6, 0.5);
    group.add(rightPupil);

    // 长舌头（可伸缩动画）
    const tongueGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.8, 4);
    const tongueMat = new THREE.MeshBasicMaterial({ color: 0xff6666 });
    const tongue = new THREE.Mesh(tongueGeo, tongueMat);
    tongue.rotation.x = Math.PI / 2;
    tongue.position.set(0, 1.3, 0.6);
    tongue.visible = false;
    group.add(tongue);
    this.tongueAnimations.push({ mesh: tongue, timer: 0, nextAttack: 2 + Math.random() * 3 });

    // 蹼（手脚扁平几何体）
    for (let side = -1; side <= 1; side += 2) {
      const webGeo = new THREE.BoxGeometry(0.15, 0.02, 0.25);
      const webMat = new THREE.MeshLambertMaterial({ color: 0x339933, transparent: true, opacity: 0.7 });
      const web = new THREE.Mesh(webGeo, webMat);
      web.position.set(side * 0.4, 0.1, 0.2);
      group.add(web);
    }

    // 腿
    for (let side = -1; side <= 1; side += 2) {
      const legGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.8, 6);
      const leg = new THREE.Mesh(legGeo, bodyMat);
      leg.position.set(side * 0.3, 0.4, 0);
      group.add(leg);
    }

    return group;
  },

  // 毒液喷射者
  createVenomSpitter(group) {
    const bodyColor = 0x8844aa;
    const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });

    // 身体
    const bodyGeo = new THREE.SphereGeometry(0.55, 10, 8);
    bodyGeo.scale(1, 1.2, 0.9);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.1;
    body.castShadow = true;
    group.add(body);

    // 脓包（透明球体）
    for (let i = 0; i < 10; i++) {
      const pustuleGeo = new THREE.SphereGeometry(0.08 + Math.random() * 0.06, 6, 6);
      const pustuleMat = new THREE.MeshBasicMaterial({
        color: 0xaa66aa,
        transparent: true,
        opacity: 0.5,
      });
      const pustule = new THREE.Mesh(pustuleGeo, pustuleMat);
      pustule.name = 'spitter_pustule';
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      pustule.position.set(
        Math.sin(phi) * Math.cos(theta) * 0.5,
        1.1 + Math.cos(phi) * 0.55,
        Math.sin(phi) * Math.sin(theta) * 0.4
      );
      group.add(pustule);
    }

    // 背部喷射囊（膨胀动画）
    const sacGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const sacMat = new THREE.MeshLambertMaterial({ color: 0xaa55aa });
    const sac = new THREE.Mesh(sacGeo, sacMat);
    sac.name = 'spitter_sac';
    sac.position.set(0, 1.5, -0.3);
    group.add(sac);
    this.sacAnimations.push({ mesh: sac, baseScale: 1, timer: 0 });

    // 头
    const headGeo = new THREE.SphereGeometry(0.25, 8, 6);
    const headMat = new THREE.MeshLambertMaterial({ color: 0x9955aa });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.7, 0.3);
    group.add(head);

    // 眼睛
    const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.name = 'spitter_eye';
    leftEye.position.set(-0.1, 1.75, 0.5);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.name = 'spitter_eye';
    rightEye.position.set(0.1, 1.75, 0.5);
    group.add(rightEye);

    // 长尾巴（多段圆柱体）
    const tailSegments = 6;
    let tailParent = group;
    let tailY = 0.6;
    let tailZ = -0.4;
    for (let i = 0; i < tailSegments; i++) {
      const tailGeo = new THREE.CylinderGeometry(0.06 - i * 0.008, 0.08 - i * 0.008, 0.5, 5);
      const tailMat = new THREE.MeshLambertMaterial({ color: 0x774488 });
      const tail = new THREE.Mesh(tailGeo, tailMat);
      tail.position.set(0, tailY, tailZ);
      tail.rotation.x = 0.3 + i * 0.1;
      group.add(tail);
      tailY -= 0.35;
      tailZ -= 0.3;
    }

    return group;
  },

  // 沼泽巨蠕虫
  createGiantWorm(group) {
    const bodyColor = 0x886644;
    const segments = 10;
    const segmentLength = 0.6;

    for (let i = 0; i < segments; i++) {
      const radius = 0.35 - i * 0.02;
      const segGeo = new THREE.CylinderGeometry(radius * 0.9, radius, segmentLength, 8);
      const segMat = new THREE.MeshLambertMaterial({ color: bodyColor });
      const seg = new THREE.Mesh(segGeo, segMat);
      seg.position.set(0, 0.5, -i * segmentLength * 0.8);
      seg.rotation.x = 0.2;
      seg.castShadow = true;
      group.add(seg);

      // 环节纹理（环状）
      const ringGeo = new THREE.TorusGeometry(radius + 0.01, 0.015, 4, 12);
      const ringMat = new THREE.MeshLambertMaterial({ color: 0x6a5030 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(seg.position);
      ring.position.y += segmentLength / 2;
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
    }

    // 大口器
    const mouthGeo = new THREE.ConeGeometry(0.3, 0.5, 8);
    const mouthMat = new THREE.MeshLambertMaterial({ color: 0x553322 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, 0.5, 0.4);
    mouth.rotation.x = -Math.PI / 2;
    group.add(mouth);

    // 牙齿（圆锥体）
    for (let i = 0; i < 8; i++) {
      const toothGeo = new THREE.ConeGeometry(0.03, 0.12, 4);
      const toothMat = new THREE.MeshBasicMaterial({ color: 0xdddddd });
      const tooth = new THREE.Mesh(toothGeo, toothMat);
      const angle = (i / 8) * Math.PI * 2;
      tooth.position.set(
        Math.cos(angle) * 0.22,
        0.5,
        0.5 + Math.sin(angle) * 0.22
      );
      tooth.rotation.z = Math.cos(angle) * 0.5;
      tooth.rotation.x = Math.sin(angle) * 0.5 - 0.3;
      group.add(tooth);
    }

    return group;
  },

  // 辐射僵尸
  createRadiationZombie(group) {
    // 身体（腐烂效果 - 部分透明）
    const bodyGeo = new THREE.BoxGeometry(0.7, 1.4, 0.5);
    const bodyMat = new THREE.MeshLambertMaterial({
      color: 0x668844,
      transparent: true,
      opacity: 0.85,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.3;
    body.castShadow = true;
    group.add(body);

    // 可见骨骼
    const boneGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4);
    const boneMat = new THREE.MeshBasicMaterial({ color: 0xdddddd });
    const spine = new THREE.Mesh(boneGeo, boneMat);
    spine.position.set(0, 1.3, 0.05);
    group.add(spine);

    // 肋骨
    for (let i = 0; i < 4; i++) {
      const ribGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 3);
      const rib = new THREE.Mesh(ribGeo, boneMat);
      rib.rotation.z = Math.PI / 2;
      rib.position.set(0, 1.0 + i * 0.2, 0.08);
      group.add(rib);
    }

    // 发光血管（绿色发光线条）
    for (let i = 0; i < 5; i++) {
      const veinGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.3 + Math.random() * 0.5, 3);
      const veinMat = new THREE.MeshBasicMaterial({ color: 0x44ff44 });
      const vein = new THREE.Mesh(veinGeo, veinMat);
      vein.position.set(
        (Math.random() - 0.5) * 0.6,
        0.8 + Math.random() * 1.0,
        0.28
      );
      vein.rotation.z = (Math.random() - 0.5) * 0.5;
      group.add(vein);
    }

    // 头
    const headGeo = new THREE.SphereGeometry(0.22, 8, 6);
    const headMat = new THREE.MeshLambertMaterial({ color: 0x557755 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.15;
    group.add(head);

    // 发光眼睛
    const eyeGeo = new THREE.SphereGeometry(0.05, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x44ff44 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.name = 'zombie_eye';
    leftEye.position.set(-0.08, 2.2, 0.18);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.name = 'zombie_eye';
    rightEye.position.set(0.08, 2.2, 0.18);
    group.add(rightEye);

    // 变异肢体（额外肢体 - 不对称）
    const extraArmGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.0, 5);
    const extraArmMat = new THREE.MeshLambertMaterial({ color: 0x557755 });
    const extraArm = new THREE.Mesh(extraArmGeo, extraArmMat);
    extraArm.position.set(0.45, 1.4, 0.1);
    extraArm.rotation.z = -0.5;
    group.add(extraArm);

    // 正常手臂
    for (let side = -1; side <= 1; side += 2) {
      if (side === 1) continue; // 跳过右侧，用变异肢体代替
      const armGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.0, 5);
      const arm = new THREE.Mesh(armGeo, extraArmMat);
      arm.position.set(side * 0.4, 1.4, 0);
      arm.rotation.z = side * 0.2;
      group.add(arm);
    }

    // 腿
    for (let side = -1; side <= 1; side += 2) {
      const legGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.0, 5);
      const leg = new THREE.Mesh(legGeo, extraArmMat);
      leg.position.set(side * 0.2, 0.5, 0);
      group.add(leg);
    }

    return group;
  },

  createBasicMutant(group, typeInfo) {
    const colors = {
      '变异蛙人': 0x44aa44,
      '毒液喷射者': 0xaa44aa,
      '沼泽巨蠕虫': 0x886644,
      '辐射僵尸': 0x668844
    };
    const color = colors[typeInfo.name] || 0x446644;
    const size = typeInfo.name === '沼泽巨蠕虫' ? 1.5 : typeInfo.name === '辐射僵尸' ? 1.2 : 1;

    const bodyGeo = new THREE.BoxGeometry(0.8 * size, 1.5 * size, 0.6 * size);
    const bodyMat = new THREE.MeshLambertMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.2 * size;
    body.castShadow = true;
    group.add(body);

    const headGeo = new THREE.SphereGeometry(0.3 * size, 8, 6);
    const headMat = new THREE.MeshLambertMaterial({ color: 0x557755 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.2 * size;
    group.add(head);

    const eyeGeo = new THREE.SphereGeometry(0.06 * size, 4, 4);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.name = 'mutant_eye';
    leftEye.position.set(-0.1 * size, 2.3 * size, 0.25 * size);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.name = 'mutant_eye';
    rightEye.position.set(0.1 * size, 2.3 * size, 0.25 * size);
    group.add(rightEye);

    return group;
  },

  getSwampMonsterTypes() {
    return [
      { name: '变异蛙人', hp: 80, speed: 5, damage: 15, attackRange: 3, type: 'melee' },
      { name: '毒液喷射者', hp: 60, speed: 3, damage: 20, attackRange: 15, type: 'ranged' },
      { name: '沼泽巨蠕虫', hp: 200, speed: 2, damage: 30, attackRange: 5, type: 'underground' },
      { name: '辐射僵尸', hp: 300, speed: 1.5, damage: 25, attackRange: 3, type: 'tank' },
    ];
  },

  // ====== 每帧更新 ======
  update(dt) {
    if (!this.active || !this.scene) return;

    if (this.phase === 'explore') {
      if (!this.defenseStartTimer) this.defenseStartTimer = 30;
      this.defenseStartTimer -= dt;
      if (this.defenseStartTimer <= 0) {
        this.phase = 'defend';
        this.defenseWave = 0;
        this.waveCooldown = 5;
        if (typeof showToast === 'function') {
          showToast('变异生物正在靠近！准备防御！', 'warning');
        }
      }
    }

    this.updatePoisonFog(dt);
    this.updateWaterPools(dt);
    this.updateGlowPlants(dt);
    this.updateMutants(dt);
    this.updatePoisonDamage(dt);
    this.updateWaveSystem(dt);
    this.updateShake(dt);
    this.updateBoundary();
    this.updateParticles(dt);
    this.updateLightning(dt);
    this.updateCollisionFeedback();
  },

  // 更新毒雾粒子（风向流动）
  updatePoisonFog(dt) {
    if (!this.poisonParticles) return;
    this.poisonTime += dt;

    const windX = Math.sin(this.poisonTime * 0.1) * 0.3;
    const windZ = Math.cos(this.poisonTime * 0.08) * 0.2;

    this.poisonParticles.children.forEach(child => {
      if (!child.userData) return;
      const data = child.userData;
      child.position.x = data.baseX + Math.sin(this.poisonTime * data.speed + data.phase) * 3 + windX * this.poisonTime;
      child.position.y = data.baseY + Math.sin(this.poisonTime * 0.3 + data.phase) * 0.5;
      child.position.z = data.baseZ + Math.cos(this.poisonTime * data.speed * 0.7 + data.phase) * 2 + windZ * this.poisonTime;

      // Billboard效果
      if (this.camera) {
        child.lookAt(this.camera.position);
      }

      const S = SWAMP_MAP_CONFIG.MAP_SIZE;
      if (Math.abs(child.position.x) > S || Math.abs(child.position.z) > S) {
        child.position.x = (Math.random() - 0.5) * S * 2;
        child.position.z = (Math.random() - 0.5) * S * 2;
        data.baseX = child.position.x;
        data.baseZ = child.position.z;
      }
    });
  },

  // 更新水面波纹
  updateWaterPools(dt) {
    this.waterPools.forEach(pool => {
      pool.traverse(child => {
        if (child.isMesh && child.material && child.material.opacity !== undefined && child.name !== 'mudPatch') {
          if (child.material.color && child.material.color.g > 0.3 && child.material.color.r < 0.3) {
            child.material.opacity = 0.5 + Math.sin(Date.now() * 0.001 + pool.position.x) * 0.1;
          }
        }
      });
    });
  },

  // 更新变异植物发光闪烁
  updateGlowPlants(dt) {
    const time = Date.now() * 0.001;
    this.glowPlants.forEach((plant, idx) => {
      plant.traverse(child => {
        if (child.isMesh && child.material && child.material.opacity !== undefined) {
          if (child.material.color && child.material.color.g > 0.5 && child.material.color.r < 0.5) {
            child.material.opacity = 0.3 + Math.sin(time * 2 + idx) * 0.2;
          }
        }
      });
    });
  },

  // 更新粒子效果（气泡、蒸汽、泄漏）
  updateParticles(dt) {
    // 气泡
    this.bubbleParticles.forEach(bubble => {
      const positions = bubble.mesh.geometry.attributes.position.array;
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] += bubble.speed * dt * 0.3;
        if (positions[i * 3 + 1] > 0.5) {
          positions[i * 3 + 1] = 0;
          positions[i * 3] = (Math.random() - 0.5) * 8;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
        }
      }
      bubble.mesh.geometry.attributes.position.needsUpdate = true;
    });

    // 蒸汽
    this.steamParticles.forEach(steam => {
      const positions = steam.mesh.geometry.attributes.position.array;
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] += steam.speed * dt;
        positions[i * 3] += Math.sin(Date.now() * 0.001 + i) * 0.01;
        if (positions[i * 3 + 1] > steam.baseY + 8) {
          positions[i * 3 + 1] = steam.baseY;
          positions[i * 3] = (Math.random() - 0.5) * 6;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
        }
      }
      steam.mesh.geometry.attributes.position.needsUpdate = true;
    });

    // 泄漏
    this.leakParticles.forEach(leak => {
      const positions = leak.mesh.geometry.attributes.position.array;
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] -= leak.speed * dt;
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 3 + Math.random() * 2;
          positions[i * 3] = leak.baseX + (Math.random() - 0.5) * 0.2;
        }
      }
      leak.mesh.geometry.attributes.position.needsUpdate = true;
    });

    // 舌头动画
    this.tongueAnimations.forEach(ta => {
      ta.timer += dt;
      if (ta.timer > ta.nextAttack) {
        ta.mesh.visible = true;
        ta.mesh.position.z += dt * 8;
        if (ta.mesh.position.z > 2.5) {
          ta.mesh.visible = false;
          ta.mesh.position.z = 0.6;
          ta.timer = 0;
          ta.nextAttack = 2 + Math.random() * 3;
        }
      }
    });

    // 喷射囊膨胀动画
    this.sacAnimations.forEach(sa => {
      sa.timer += dt;
      const scale = sa.baseScale + Math.sin(sa.timer * 2) * 0.15;
      sa.mesh.scale.setScalar(scale);
    });
  },

  // 闪电效果
  updateLightning(dt) {
    this.lightningTimer += dt;
    if (this.lightningTimer > this.nextLightning) {
      this.lightningTimer = 0;
      this.nextLightning = 3 + Math.random() * 7;

      // 生成闪电
      const S = SWAMP_MAP_CONFIG.MAP_SIZE;
      const sx = (Math.random() - 0.5) * S;
      const sz = (Math.random() - 0.5) * S;
      const ex = sx + (Math.random() - 0.5) * 10;
      const ez = sz + (Math.random() - 0.5) * 10;

      const positions = this.lightningLine.geometry.attributes.position.array;
      positions[0] = sx;
      positions[1] = 15 + Math.random() * 5;
      positions[2] = sz;
      positions[3] = ex;
      positions[4] = 2 + Math.random() * 3;
      positions[5] = ez;
      this.lightningLine.geometry.attributes.position.needsUpdate = true;

      this.lightningLine.material.opacity = 1;

      // 闪烁效果
      let flash = 0;
      const flashInterval = setInterval(() => {
        flash++;
        this.lightningLine.material.opacity = flash % 2 === 0 ? 1 : 0.3;
        if (flash > 5) {
          clearInterval(flashInterval);
          this.lightningLine.material.opacity = 0;
        }
      }, 50);
    }
  },

  // 碰撞反馈
  updateCollisionFeedback() {
    if (!window.player || !window.player.mesh) return;
    const playerPos = window.player.mesh.position;
    const collisions = SwampCollision.checkCollision(playerPos, 0.5);

    for (const body of collisions) {
      if (body.type === 'box' || body.type === 'cylinder' || body.type === 'sphere') {
        const resolved = SwampCollision.resolveCollision(playerPos, 0.5, window.player.velocity);
        window.player.mesh.position.copy(resolved);

        // 碰撞视觉反馈
        if (typeof showToast === 'function' && Math.random() > 0.95) {
          showToast('撞到障碍物！', 'warning');
        }
      }
    }
  },

  // 更新怪物AI
  updateMutants(dt) {
    if (!window.player || !window.player.mesh) return;
    const playerPos = window.player.mesh.position;

    this.mutants.forEach(mutant => {
      if (!mutant.mesh) return;
      const mesh = mutant.mesh;
      const meshPos = mesh.position;
      const distToPlayer = meshPos.distanceTo(playerPos);

      if (distToPlayer < 25) {
        mutant.state = 'chase';
      } else if (distToPlayer > 40) {
        mutant.state = 'wander';
      }

      if (mutant.attackCooldown > 0) {
        mutant.attackCooldown -= dt;
      }

      switch (mutant.state) {
        case 'wander':
          this.updateWanderAI(mutant, dt);
          break;
        case 'chase':
          this.updateChaseAI(mutant, dt, playerPos);
          break;
      }

      const terrainH = this.getTerrainHeight(meshPos.x, meshPos.z);
      meshPos.y = terrainH;
    });
  },

  updateWanderAI(mutant, dt) {
    mutant.wanderTimer += dt;
    if (mutant.wanderTimer > 3 + Math.random() * 2) {
      mutant.wanderTimer = 0;
      const S = SWAMP_MAP_CONFIG.MAP_SIZE;
      mutant.wanderTarget.set(
        (Math.random() - 0.5) * S,
        0,
        (Math.random() - 0.5) * S
      );
    }

    const dir = new THREE.Vector3().subVectors(mutant.wanderTarget, mutant.mesh.position);
    dir.y = 0;
    if (dir.length() > 1) {
      dir.normalize();
      mutant.mesh.position.add(dir.multiplyScalar(mutant.speed * 0.3 * dt));
      mutant.mesh.lookAt(
        mutant.mesh.position.x + dir.x,
        mutant.mesh.position.y,
        mutant.mesh.position.z + dir.z
      );
    }
  },

  updateChaseAI(mutant, dt, playerPos) {
    const dir = new THREE.Vector3().subVectors(playerPos, mutant.mesh.position);
    dir.y = 0;
    const dist = dir.length();

    if (dist > mutant.attackRange) {
      dir.normalize();
      mutant.mesh.position.add(dir.multiplyScalar(mutant.speed * dt));
      mutant.mesh.lookAt(
        mutant.mesh.position.x + dir.x,
        mutant.mesh.position.y,
        mutant.mesh.position.z + dir.z
      );
    } else if (mutant.attackCooldown <= 0) {
      if (window.player && window.player.hp !== undefined) {
        window.player.hp -= mutant.damage;
        if (typeof showToast === 'function') {
          showToast(`被${mutant.type}攻击！-${mutant.damage}HP`, 'error');
        }
      }
      mutant.attackCooldown = 2;
    }
  },

  updatePoisonDamage(dt) {
    if (!window.player || !window.player.mesh) return;
    const playerPos = window.player.mesh.position;
    const distFromCenter = Math.sqrt(playerPos.x * playerPos.x + playerPos.z * playerPos.z);

    if (distFromCenter > 30) {
      this.poisonDamageTimer += dt;
      if (this.poisonDamageTimer >= 1) {
        this.poisonDamageTimer -= 1;
        const damage = SWAMP_MAP_CONFIG.POISON_DAMAGE;
        if (window.player.hp !== undefined) {
          window.player.hp -= damage;
        }
        if (typeof showToast === 'function' && Math.random() > 0.7) {
          showToast('毒雾侵蚀中...持续掉血！', 'warning');
        }
      }
    } else {
      this.poisonDamageTimer = 0;
    }
  },

  updateWaveSystem(dt) {
    if (this.phase !== 'defend') return;

    if (!this.defenseWaveActive) {
      this.waveCooldown += dt;
      if (this.waveCooldown >= 10) {
        this.waveCooldown = 0;
        this.startDefenseWave();
      }
    } else {
      const aliveEnemies = this.defenseEnemies.filter(e => e && e.mesh && e.hp > 0);
      if (aliveEnemies.length === 0) {
        this.defenseWaveActive = false;
        this.defenseWave++;

        if (this.defenseWave >= SWAMP_MAP_CONFIG.DEFENSE_WAVES) {
          this.phase = 'complete';
          if (typeof showToast === 'function') {
            showToast('恭喜！毒雾沼泽防御成功！', 'success');
          }
        } else {
          if (typeof showToast === 'function') {
            showToast(`第 ${this.defenseWave} 波已清除！准备下一波...`, 'success');
          }
          this.waveCooldown = 0;
        }
      }

      const waveInfo = document.getElementById('wave-info');
      if (waveInfo) {
        // 更新地图标签，不替换原有内容（保留 wave-num 和 enemy-count）
        let mapLabel = waveInfo.querySelector('.map-label');
        if (!mapLabel) {
          mapLabel = document.createElement('div');
          mapLabel.className = 'map-label';
          mapLabel.style.cssText = 'color:#44ff44;font-size:12px;';
          waveInfo.appendChild(mapLabel);
        }
        mapLabel.textContent = `毒雾沼泽 - 第 ${this.defenseWave + 1}/${SWAMP_MAP_CONFIG.DEFENSE_WAVES} 波`;
        // 更新 enemy-count
        const ec = document.getElementById('enemy-count');
        if (ec) ec.textContent = `剩余敌人: ${aliveEnemies.length}`;
      }
    }
  },

  startDefenseWave() {
    this.defenseWaveActive = true;
    const S = SWAMP_MAP_CONFIG.MAP_SIZE;
    const monsterTypes = this.getSwampMonsterTypes();
    const baseCount = 5 + this.defenseWave * 2;
    const hpMult = 1 + this.defenseWave * 0.15;

    for (let i = 0; i < baseCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = S * 0.6 + Math.random() * S * 0.3;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const terrainH = this.getTerrainHeight(x, z);
      const typeInfo = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];

      const mesh = this.createMutantMesh(typeInfo);
      mesh.position.set(x, terrainH, z);
      this.swampGroup.add(mesh);

      this.defenseEnemies.push({
        mesh: mesh,
        hp: Math.floor(typeInfo.hp * hpMult),
        maxHp: Math.floor(typeInfo.hp * hpMult),
        type: typeInfo.name,
      });
    }

    if (typeof showToast === 'function') {
      showToast(`第 ${this.defenseWave + 1} 波来袭！${baseCount}个变异生物！`, 'warning');
    }

    console.log('[SwampMap] 第', this.defenseWave + 1, '波开始，敌人数量:', baseCount);
  },

  updateShake(dt) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.camera) {
        this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
        this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity * 0.5;
        this.camera.position.z += (Math.random() - 0.5) * this.shakeIntensity;
      }
    }
  },

  updateBoundary() {
    if (!window.player || !window.player.mesh) return;
    const S = SWAMP_MAP_CONFIG.MAP_SIZE;
    const pos = window.player.mesh.position;

    pos.x = Math.max(-S, Math.min(S, pos.x));
    pos.z = Math.max(-S, Math.min(S, pos.z));

    const terrainH = this.getTerrainHeight(pos.x, pos.z);
    if (pos.y < terrainH) {
      pos.y = terrainH;
    }
  },

  getMapBounds() {
    const S = SWAMP_MAP_CONFIG.MAP_SIZE;
    return {
      minX: -S,
      maxX: S,
      minZ: -S,
      maxZ: S,
    };
  },

  getTerrainHeight(x, z) {
    // 使用与 generateTerrain 完全相同的5层FBM噪声和边缘衰减计算
    const h1 = SwampNoise.fbm2D(x * 0.005, z * 0.005, 5, 0.5, 2.0) * 4.0;
    const h2 = SwampNoise.fbm2D(x * 0.015, z * 0.015, 5, 0.5, 2.0) * 1.5;
    const h3 = SwampNoise.fbm2D(x * 0.03, z * 0.03, 5, 0.4, 2.0) * 0.6;
    const h4 = SwampNoise.fbm2D(x * 0.08, z * 0.08, 5, 0.35, 2.0) * 0.25;
    const h5 = SwampNoise.fbm2D(x * 0.2, z * 0.2, 5, 0.3, 2.0) * 0.1;

    let h = h1 + h2 + h3 + h4 + h5;

    const dist = Math.sqrt(x * x + z * z);
    const S = SWAMP_MAP_CONFIG.MAP_SIZE;

    // 使用与 generateTerrain 完全相同的 smootherstep 边缘衰减
    let edgeFade = 1;
    if (dist > S * 0.75) {
      const t = Math.min(1, (dist - S * 0.75) / (S * 0.25));
      edgeFade = 1 - t * t * (3 - 2 * t);
    }
    if (dist > S * 0.95) {
      edgeFade *= Math.max(0, 1 - (dist - S * 0.95) / (S * 0.05));
    }

    const centerFlat = Math.max(0, 1 - dist / 40);
    h *= (1 - centerFlat * 0.7) * edgeFade;

    return Math.max(0, h);
  },

  cleanup() {
    if (!this.scene || !this.active) return;

    this.active = false;
    this.phase = 'explore';

    if (this.swampGroup) {
      this.swampGroup.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.scene.remove(this.swampGroup);
    }

    this.poisonZones = [];
    this.mutants = [];
    this.buildings = [];
    this.waterPools = [];
    this.deadTrees = [];
    this.glowPlants = [];
    this.ruins = [];
    this.defenseEnemies = [];
    this.terrainData = [];
    this.terrainMesh = null;
    this.poisonParticles = null;
    this.swampGroup = null;
    this.bubbleParticles = [];
    this.steamParticles = [];
    this.leakParticles = [];
    this.tongueAnimations = [];
    this.sacAnimations = [];
    this.lightningLine = null;

    SwampCollision.clear();

    if (this.scene.fog) {
      this.scene.fog.color.setHex(0x000000);
      this.scene.fog.density = 0.01;
    }

    console.log('[SwampMap] 清理完成');
  },
};

window.SwampMap = SwampMap;

if (window.MapManager && typeof MapManager.registerMap === 'function') {
  MapManager.registerMap('swamp', SwampMap);
}
