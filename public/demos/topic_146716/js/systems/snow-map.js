/**
 * 雪山地图系统 - 霜寒禁区
 * 包含：地形生成、场景装饰、传送门、信号塔任务、电源寻找、防御波次
 */

// ==================== 配置 ====================
const SNOW_MAP_CONFIG = {
  MAP_SIZE: 300,        // 地图半径（实际600x600）
  GROUND_COLOR: 0xe8f0f8, // 雪地颜色（更白）
  ROAD_COLOR: 0xc8d8e8,   // 雪路颜色（浅蓝灰，不是深灰）
  RAIL_COLOR: 0x8899aa,   // 护栏颜色（冰蓝灰）
  // 地形
  TERRAIN_SCALE: 0.008,  // 大尺度起伏
  TERRAIN_DETAIL: 0.03,  // 小尺度细节
  TERRAIN_HEIGHT: 12,    // 最大高度差
  // 天气
  VISIBILITY: 40,         // 能见度
  SNOW_SPEED_MULT: 0.9,  // 移速倍率
  BULLET_SPREAD: 1.3,    // 子弹散布倍率
  XP_MULT: 1.2,          // 经验倍率
  // 信号塔
  TOWER_HP: 5000,
  TOWER_POS: [0, 0],     // 地图中央
  DEFENSE_WAVES: 15,
  // 电源
  POWER_COUNT: 4,
  POWER_HP: 200,          // 每个电源旁僵尸总HP（约8个普通僵尸）
  // 游荡僵尸
  WANDER_ZOMBIE_COUNT: 30,
  WANDER_DETECTION_RANGE: 35, // 视野检测范围
  WANDER_SPEED: 1.5,     // 游荡速度
  WANDER_CHASE_SPEED: 3.0, // 追击速度
};

// ==================== 改进的 Simplex Noise（支持平滑插值）====================
const SnowNoise = {
  _p: [],
  _grad3: [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],
  init() {
    const p = [];
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    this._p = [...p, ...p];
  },
  _grad(hash, x, y) {
    const h = hash & 3;
    return ((h & 1) ? -x : x) + ((h & 2) ? -y : y);
  },
  noise2D(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const p = this._p;
    const aa = p[p[X] + Y], ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
    const x1 = this._grad(aa, xf, yf) * (1 - u) + this._grad(ba, xf - 1, yf) * u;
    const x2 = this._grad(ab, xf, yf - 1) * (1 - u) + this._grad(bb, xf - 1, yf - 1) * u;
    return x1 * (1 - v) + x2 * v;
  },
  // 平滑噪声（FBM - Fractal Brownian Motion）
  fbm2D(x, y, octaves = 4, persistence = 0.5, lacunarity = 2.0) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return total / maxValue;
  }
};

// ==================== 主系统 ====================
const SnowMap = {
  scene: null,
  camera: null,
  active: false,
  phase: 'explore', // explore -> power -> defend -> complete
  // 地形
  groundMesh: null,
  terrainData: [],  // 高度数据缓存
  // 信号塔
  towerMesh: null,
  towerHP: SNOW_MAP_CONFIG.TOWER_HP,
  towerMaxHP: SNOW_MAP_CONFIG.TOWER_HP,
  radioMesh: null,
  radioInteracted: false,
  // 电源
  powerNodes: [],
  activatedPowers: 0,
  // 游荡僵尸
  wanderZombies: [],
  // 防御波次
  defenseWave: 0,
  defenseWaveActive: false,
  defenseEnemies: [],
  // 震动
  shakeIntensity: 0,
  shakeTimer: 0,
  // 传送门
  portalMesh: null,

  init() {
    SnowNoise.init();
    this.scene = window.scene;
    this.camera = window.camera;
  },

  // ==================== 地形生成（改进版 - 平滑FBM + 网格纹理）====================
  generateTerrain() {
    const S = SNOW_MAP_CONFIG.MAP_SIZE;
    // 增加细分段数使地形更平滑（150段 = 每段8米）
    const segments = 150;
    const geo = new THREE.PlaneGeometry(S * 2, S * 2, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const vertices = geo.attributes.position.array;
    this.terrainData = [];

    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i], z = vertices[i + 2];
      const dist = Math.sqrt(x * x + z * z);
      
      // 中心区域超平坦（信号塔周围，扩大范围）
      const centerFlat = Math.max(0, 1 - dist / 80);
      // 边缘渐变区域
      const edgeFade = Math.max(0, 1 - (dist - S * 0.8) / (S * 0.2));
      
      // 使用FBM平滑噪声（4层叠加，更自然）
      const baseFreq = 0.004; // 降低频率，更大尺度的起伏
      const h1 = SnowNoise.fbm2D(x * baseFreq, z * baseFreq, 4, 0.5, 2.0) * SNOW_MAP_CONFIG.TERRAIN_HEIGHT * 0.6;
      // 细节层（更柔和，降低振幅）
      const h2 = SnowNoise.fbm2D(x * 0.015, z * 0.015, 3, 0.4, 2.0) * 1.2;
      
      // 道路区域平坦（十字形道路，更宽更平滑）
      const roadWidth = 12;
      const roadDist = Math.min(Math.abs(x), Math.abs(z));
      const roadFlat = roadDist < roadWidth ? Math.pow(1 - roadDist / roadWidth, 2) * 0.95 : 0;
      
      // 最终高度（平滑混合）
      let h = (h1 + h2) * (1 - centerFlat * 0.85) * edgeFade;
      // 道路平坦化
      h = h * (1 - roadFlat);
      
      vertices[i + 1] = h;
      this.terrainData.push({ x, z, h });
    }

    geo.computeVertexNormals();

    // 创建带网格纹理的雪地材质
    const mat = this.createSnowMaterial();
    this.groundMesh = new THREE.Mesh(geo, mat);
    this.groundMesh.receiveShadow = true;
    this.groundMesh.name = 'snowGround';
    this.scene.add(this.groundMesh);
    
    // 添加网格辅助线（帮助判断坡度）
    this.addTerrainGrid();
  },

  // ==================== 创建雪地材质（带纹理）====================
  createSnowMaterial() {
    // 创建程序化纹理 - 雪地表面细节
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // 基础白色
    ctx.fillStyle = '#e8eef5';
    ctx.fillRect(0, 0, 512, 512);
    
    // 添加噪点纹理（模拟雪的颗粒感）
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 2 + 0.5;
      const alpha = Math.random() * 0.3 + 0.1;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 添加阴影纹理（模拟雪的凹陷）
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 3 + 1;
      const alpha = Math.random() * 0.15;
      ctx.fillStyle = `rgba(180, 190, 200, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    
    // 使用MeshStandardMaterial支持PBR
    return new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0,
      bumpMap: texture,
      bumpScale: 0.1
    });
  },

  // ==================== 添加地形网格辅助线 ====================
  addTerrainGrid() {
    const S = SNOW_MAP_CONFIG.MAP_SIZE;
    const gridSize = 50; // 每50米一个网格
    const gridDivisions = Math.floor(S * 2 / gridSize);
    
    // 主网格（较淡）
    const gridHelper = new THREE.GridHelper(S * 2, gridDivisions, 0x88aabb, 0xaaccdd);
    gridHelper.name = 'snowGridHelper';
    gridHelper.position.y = 0.1;
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);
    
    // 保存引用以便清理
    this.gridHelper = gridHelper;

    // 生成道路
    this.generateRoads();
    // 生成装饰
    this.generateDecorations();
    // 生成信号塔
    this.generateSignalTower();
    // 生成电源节点
    this.generatePowerNodes();
    // 生成传送门（返回城市）
    this.generateReturnPortal();

    // 小地图标记
    this.minimapMarkers = [
      { x: 0, z: 0, color: '#ff4444', label: '信号塔' },
      ...this.powerNodes.map((n, i) => ({ x: n.x, z: n.z, color: '#ffaa00', label: '电源' + (i + 1) })),
      { x: 0, z: SNOW_MAP_CONFIG.MAP_SIZE - 10, color: '#4488ff', label: '传送门' }
    ];
  },

  getTerrainHeight(x, z) {
    // 与generateTerrain使用完全相同的算法
    const S = SNOW_MAP_CONFIG.MAP_SIZE;
    const dist = Math.sqrt(x * x + z * z);
    
    // 中心区域超平坦（扩大范围）
    const centerFlat = Math.max(0, 1 - dist / 80);
    // 边缘渐变
    const edgeFade = Math.max(0, 1 - (dist - S * 0.8) / (S * 0.2));
    
    // FBM平滑噪声（与generateTerrain一致）
    const baseFreq = 0.004;
    const h1 = SnowNoise.fbm2D(x * baseFreq, z * baseFreq, 4, 0.5, 2.0) * SNOW_MAP_CONFIG.TERRAIN_HEIGHT * 0.6;
    const h2 = SnowNoise.fbm2D(x * 0.015, z * 0.015, 3, 0.4, 2.0) * 1.2;
    
    // 道路平坦（与generateTerrain一致）
    const roadWidth = 12;
    const roadDist = Math.min(Math.abs(x), Math.abs(z));
    const roadFlat = roadDist < roadWidth ? Math.pow(1 - roadDist / roadWidth, 2) * 0.95 : 0;
    
    let h = (h1 + h2) * (1 - centerFlat * 0.85) * edgeFade;
    h = h * (1 - roadFlat);
    
    return h;
  },

  // 精确获取地形表面高度（通过射线检测地面mesh，用于装饰物放置）
  getTerrainHeightExact(x, z) {
    if (!this.groundMesh) return this.getTerrainHeight(x, z);
    const raycaster = new THREE.Raycaster();
    raycaster.set(new THREE.Vector3(x, 100, z), new THREE.Vector3(0, -1, 0));
    const hits = raycaster.intersectObject(this.groundMesh, false);
    if (hits.length > 0) {
      return hits[0].point.y;
    }
    return this.getTerrainHeight(x, z);
  },

  // ==================== 道路（雪路）====================
  generateRoads() {
    const S = SNOW_MAP_CONFIG.MAP_SIZE;
    // 雪路材质（浅蓝灰，与雪地融合）
    const roadMat = new THREE.MeshLambertMaterial({ 
      color: SNOW_MAP_CONFIG.ROAD_COLOR,
      emissive: 0x112233,
      emissiveIntensity: 0.1
    });

    // 主干道（十字形雪路，宽度与地形平坦区域一致）
    const road1 = new THREE.Mesh(new THREE.PlaneGeometry(12, S * 2), roadMat);
    road1.rotation.x = -Math.PI / 2;
    road1.position.y = 0.05;
    road1.name = 'snowRoad';
    road1.receiveShadow = true;
    this.scene.add(road1);

    const road2 = new THREE.Mesh(new THREE.PlaneGeometry(S * 2, 12), roadMat);
    road2.rotation.x = -Math.PI / 2;
    road2.position.y = 0.05;
    road2.name = 'snowRoad';
    road2.receiveShadow = true;
    this.scene.add(road2);

    // 护栏（冰蓝灰，贴合地形）
    const railMat = new THREE.MeshLambertMaterial({ 
      color: SNOW_MAP_CONFIG.RAIL_COLOR || 0x8899aa
    });
    for (let i = -S; i < S; i += 20) {
      // 每隔20米放一个护栏柱
      [-4.5, 4.5].forEach(offset => {
        const h1 = this.getTerrainHeight(offset, i);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.15), railMat);
        rail.position.set(offset, h1 + 0.4, i);
        rail.name = 'snowRail';
        this.scene.add(rail);
        
        const h2 = this.getTerrainHeight(i, offset);
        const rail2 = rail.clone();
        rail2.position.set(i, h2 + 0.4, offset);
        rail2.name = 'snowRail';
        this.scene.add(rail2);
      });
    }
  },

  // ==================== 场景装饰 ====================
  generateDecorations() {
    const S = SNOW_MAP_CONFIG.MAP_SIZE * 0.8;

    // 废弃汽车（80辆）
    for (let i = 0; i < 80; i++) {
      this.createAbandonedCar(
        (Math.random() - 0.5) * S * 2,
        (Math.random() - 0.5) * S * 2
      );
    }

    // 加油站（10个，分布在道路旁）
    const gasPositions = [
      [40, 40], [-40, 40], [40, -40], [-40, -40],
      [80, 0], [-80, 0],
      [120, 60], [-120, 60], [60, -120], [-60, -120]
    ];
    gasPositions.forEach(([x, z]) => this.createGasStation(x, z));

    // 雪堆（160个）
    for (let i = 0; i < 160; i++) {
      this.createSnowPile(
        (Math.random() - 0.5) * S * 2,
        (Math.random() - 0.5) * S * 2
      );
    }

    // 枯树（120棵）
    for (let i = 0; i < 120; i++) {
      this.createDeadTree(
        (Math.random() - 0.5) * S * 2,
        (Math.random() - 0.5) * S * 2
      );
    }

    // 岩石（80个）
    for (let i = 0; i < 80; i++) {
      this.createRock(
        (Math.random() - 0.5) * S * 2,
        (Math.random() - 0.5) * S * 2
      );
    }

    // 废弃小屋（16个）
    for (let i = 0; i < 16; i++) {
      this.createAbandonedCabin(
        (Math.random() - 0.5) * S * 1.8,
        (Math.random() - 0.5) * S * 1.8
      );
    }

    // 冰墙/雪墙（30个）
    for (let i = 0; i < 30; i++) {
      this.createIceWall(
        (Math.random() - 0.5) * S * 2,
        (Math.random() - 0.5) * S * 2
      );
    }

    // 倒塌电线杆（24个）
    for (let i = 0; i < 24; i++) {
      this.createFallenPole(
        (Math.random() - 0.5) * S * 2,
        (Math.random() - 0.5) * S * 2
      );
    }

    // 雪人（20个）
    for (let i = 0; i < 20; i++) {
      this.createSnowman(
        (Math.random() - 0.5) * S * 2,
        (Math.random() - 0.5) * S * 2
      );
    }

    // 丢弃的物资箱（20个）
    for (let i = 0; i < 20; i++) {
      this.createSupplyCrate(
        (Math.random() - 0.5) * S * 2,
        (Math.random() - 0.5) * S * 2
      );
    }
  },

  createAbandonedCar(x, z) {
    const group = new THREE.Group();
    const carType = Math.random();
    const bodyColor = [0x4a4a5a, 0x5a3a2a, 0x3a4a3a, 0x6a5a4a][Math.floor(Math.random() * 4)];
    const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });

    if (carType < 0.4) {
      // 轿车
      const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 4), bodyMat);
      body.position.y = 0.8;
      group.add(body);
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 2), bodyMat);
      top.position.y = 1.8;
      group.add(top);
    } else if (carType < 0.7) {
      // 卡车
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 5), bodyMat);
      body.position.y = 1.2;
      group.add(body);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 2), bodyMat);
      cabin.position.set(0, 2.5, -1.8);
      group.add(cabin);
    } else {
      // 油罐车（可爆炸）
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 6), new THREE.MeshLambertMaterial({ color: 0x8a4a2a }));
      body.position.y = 1.2;
      body.name = 'fuelTank';
      group.add(body);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 1.5), bodyMat);
      cabin.position.set(0, 2.2, -4);
      group.add(cabin);
    }

    // 随机旋转和半埋
    group.rotation.y = Math.random() * Math.PI * 2;
    const carRot = group.rotation.y;
    if (Math.random() < 0.3) group.rotation.z = Math.PI / 6; // 侧翻

    const h = this.getTerrainHeightExact(x, z);
    group.position.set(x, h, z);
    group.name = 'abandonedCar';
    this.scene.add(group);

    // 碰撞体 - 考虑旋转后的AABB投影
    if (window.addCollider) {
      const baseHw = carType < 0.4 ? 1.2 : carType < 0.7 ? 1.5 : 1.5;
      const baseHd = carType < 0.4 ? 2.2 : carType < 0.7 ? 2.8 : 3.2;
      const topY = carType < 0.4 ? 1.5 : carType < 0.7 ? 2.5 : 2.0;
      const cosR = Math.abs(Math.cos(carRot));
      const sinR = Math.abs(Math.sin(carRot));
      const hw = baseHw * cosR + baseHd * sinR;
      const hd = baseHw * sinR + baseHd * cosR;
      window.addCollider(x, z, hw, hd, h + topY, 'abandonedCar', false);
    }
  },

  createGasStation(x, z) {
    const group = new THREE.Group();
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x666666 });

    // 顶棚
    const roof = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 8), roofMat);
    roof.position.y = 4;
    group.add(roof);

    // 4根柱子
    [[-5, -3], [5, -3], [-5, 3], [5, 3]].forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 0.3), metalMat);
      pillar.position.set(px, 2, pz);
      group.add(pillar);
    });

    // 加油岛
    const islandMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
    const island = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 1.5), islandMat);
    island.position.set(0, 0.4, 0);
    group.add(island);

    // 油罐（可爆炸）
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 3, 12), new THREE.MeshLambertMaterial({ color: 0xcc4444 }));
    tank.position.set(8, 1.5, 0);
    tank.name = 'fuelTank';
    group.add(tank);

    const h = this.getTerrainHeightExact(x, z);
    group.position.set(x, h, z);
    group.name = 'gasStation';
    this.scene.add(group);

    // 碰撞体（油罐 + 主体柱子）
    if (window.addCollider) {
      window.addCollider(x + 8, z, 1.2, 1.2, h + 3, 'fuelTank', false); // 油罐可跳上
      // 4根柱子碰撞
      [[-5, -3], [5, -3], [-5, 3], [5, 3]].forEach(([px, pz]) => {
        window.addCollider(x + px, z + pz, 0.3, 0.3, h + 4, 'gasStationPillar', true);
      });
    }
  },

  createSnowPile(x, z) {
    const size = 1 + Math.random() * 3;
    const geo = new THREE.SphereGeometry(size, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const mat = new THREE.MeshLambertMaterial({ color: 0xeef4ff });
    const mesh = new THREE.Mesh(geo, mat);
    const h = this.getTerrainHeightExact(x, z);
    mesh.position.set(x, h, z);
    mesh.name = 'snowPile';
    // 所有雪堆都有碰撞（防止穿模）
    if (window.addCollider) {
      window.addCollider(x, z, size * 0.5, size * 0.5, h + size * 0.5, 'snowPile', false);
    }
    this.scene.add(mesh);
  },

  createDeadTree(x, z) {
    const group = new THREE.Group();
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });

    // 树干
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 4, 6), trunkMat);
    trunk.position.y = 2;
    group.add(trunk);

    // 枯枝
    for (let i = 0; i < 4; i++) {
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 1.5, 4), trunkMat);
      branch.position.y = 2.5 + Math.random();
      branch.rotation.z = (Math.random() - 0.5) * 1.2;
      branch.rotation.x = (Math.random() - 0.5) * 0.5;
      group.add(branch);
    }

    group.rotation.y = Math.random() * Math.PI * 2;
    const h = this.getTerrainHeightExact(x, z);
    group.position.set(x, h, z);
    // 碰撞体（树干）
    if (window.addCollider) {
      window.addCollider(x, z, 0.4, 0.4, h + 2, 'deadTree', false); // 树干可跳上
    }
    this.scene.add(group);
    group.name = 'deadTree';
  },

  createRock(x, z) {
    const size = 1 + Math.random() * 2;
    const geo = new THREE.DodecahedronGeometry(size, 0);
    const mat = new THREE.MeshLambertMaterial({ color: 0x777788 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.y = 0.6;
    const h = this.getTerrainHeightExact(x, z);
    mesh.position.set(x, h + size * 0.3, z);
    mesh.name = 'rock';
    this.scene.add(mesh);

    // 碰撞体（岩石高度约size*0.6因为scale.y=0.6）
    if (window.addCollider) {
      window.addCollider(x, z, size * 0.6, size * 0.6, h + size * 0.6, 'rock', false);
    }
  },

  // ==================== 废弃小屋 ====================
  createAbandonedCabin(x, z) {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
    const snowMat = new THREE.MeshLambertMaterial({ color: 0xddeeff });
    const w = 5 + Math.random() * 3;
    const d = 4 + Math.random() * 2;
    const h = 3 + Math.random();

    // 墙壁
    const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), woodMat);
    walls.position.y = h / 2;
    group.add(walls);

    // 屋顶（雪覆盖）
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 0.3, d + 1), snowMat);
    roof.position.y = h + 0.15;
    group.add(roof);

    // 三角屋顶
    const roofGeo = new THREE.CylinderGeometry(0, Math.sqrt(w * w + d * d) / 2 + 0.5, 2, 4);
    const roofMesh = new THREE.Mesh(roofGeo, snowMat);
    roofMesh.position.y = h + 1.15;
    roofMesh.rotation.y = Math.PI / 4;
    group.add(roofMesh);

    // 门框（破洞）
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const door = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1), doorMat);
    door.position.set(0, 1, d / 2 + 0.05);
    group.add(door);

    group.rotation.y = Math.random() * Math.PI * 2;
    const cabinRot = group.rotation.y;
    const th = this.getTerrainHeightExact(x, z);
    group.position.set(x, th, z);
    group.name = 'abandonedCabin';
    this.scene.add(group);

    // 全身碰撞（墙壁）- 考虑旋转后的AABB投影
    if (window.addCollider) {
      const cosR = Math.abs(Math.cos(cabinRot));
      const sinR = Math.abs(Math.sin(cabinRot));
      const hw = w / 2 * cosR + d / 2 * sinR;
      const hd = w / 2 * sinR + d / 2 * cosR;
      window.addCollider(x, z, hw, hd, th + h, 'building_wall', true);
    }
  },

  // ==================== 冰墙/雪墙 ====================
  createIceWall(x, z) {
    const group = new THREE.Group();
    const iceMat = new THREE.MeshLambertMaterial({ color: 0xaaccdd, transparent: true, opacity: 0.85 });
    const length = 3 + Math.random() * 5;
    const height = 1.5 + Math.random() * 2;
    const thickness = 0.4 + Math.random() * 0.3;

    const wall = new THREE.Mesh(new THREE.BoxGeometry(length, height, thickness), iceMat);
    wall.position.y = height / 2;
    group.add(wall);

    // 顶部积雪
    const snowTop = new THREE.Mesh(
      new THREE.BoxGeometry(length + 0.3, 0.2, thickness + 0.3),
      new THREE.MeshLambertMaterial({ color: 0xeef4ff })
    );
    snowTop.position.y = height + 0.1;
    group.add(snowTop);

    group.rotation.y = Math.random() * Math.PI;
    const rot = group.rotation.y;
    const th = this.getTerrainHeightExact(x, z);
    group.position.set(x, th, z);
    group.name = 'iceWall';
    this.scene.add(group);

    // 碰撞（可跳上）- 考虑旋转后的AABB投影
    if (window.addCollider) {
      const cosR = Math.abs(Math.cos(rot));
      const sinR = Math.abs(Math.sin(rot));
      const hw = length / 2 * cosR + thickness / 2 * sinR;
      const hd = length / 2 * sinR + thickness / 2 * cosR;
      window.addCollider(x, z, hw, hd, th + height, 'barricade', false);
    }
  },

  // ==================== 倒塌电线杆 ====================
  createFallenPole(x, z) {
    const group = new THREE.Group();
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    const poleLen = 6 + Math.random() * 4;

    // 主杆（横卧）
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, poleLen, 6), poleMat);
    pole.rotation.z = Math.PI / 2;
    pole.position.y = 0.15;
    group.add(pole);

    // 残留电线
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    for (let i = 0; i < 2; i++) {
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 3, 4), wireMat);
      wire.position.set((Math.random() - 0.5) * 2, 0.5 + i * 0.3, (Math.random() - 0.5) * 2);
      wire.rotation.x = Math.random() * 0.5;
      group.add(wire);
    }

    group.rotation.y = Math.random() * Math.PI * 2;
    const poleRot = group.rotation.y;
    const h = this.getTerrainHeightExact(x, z);
    group.position.set(x, h, z);
    group.name = 'fallenPole';
    this.scene.add(group);

    // 碰撞（可跳上横杆）- 考虑旋转后的AABB投影
    if (window.addCollider) {
      const cosR = Math.abs(Math.cos(poleRot));
      const sinR = Math.abs(Math.sin(poleRot));
      const hw = poleLen / 2 * cosR + 0.3 * sinR;
      const hd = poleLen / 2 * sinR + 0.3 * cosR;
      window.addCollider(x, z, hw, hd, h + 0.3, 'fallenPole', false);
    }
  },

  // ==================== 雪人 ====================
  createSnowman(x, z) {
    const group = new THREE.Group();
    const snowMat = new THREE.MeshLambertMaterial({ color: 0xeef4ff });

    // 下身（大球）
    const bottom = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), snowMat);
    bottom.position.y = 0.6;
    bottom.scale.y = 0.85;
    group.add(bottom);

    // 上身（中球）
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), snowMat);
    top.position.y = 1.5;
    top.scale.y = 0.85;
    group.add(top);

    // 头（小球）
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), snowMat);
    head.position.y = 2.2;
    group.add(head);

    // 胡萝卜鼻子
    const noseMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25, 4), noseMat);
    nose.position.set(0, 2.2, 0.25);
    nose.rotation.x = Math.PI / 2;
    group.add(nose);

    // 眼睛
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    [-0.08, 0.08].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), eyeMat);
      eye.position.set(ex, 2.3, 0.22);
      group.add(eye);
    });

    const h = this.getTerrainHeightExact(x, z);
    group.position.set(x, h, z);
    group.name = 'snowman';
    this.scene.add(group);

    // 碰撞（可跳上）
    if (window.addCollider) {
      window.addCollider(x, z, 0.6, 0.6, h + 1.2, 'snowman', false);
    }
  },

  // ==================== 丢弃的物资箱 ====================
  createSupplyCrate(x, z) {
    const group = new THREE.Group();
    const crateMat = new THREE.MeshLambertMaterial({ color: 0x6a5a3a });
    const size = 0.8 + Math.random() * 0.5;

    // 箱体
    const crate = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), crateMat);
    crate.position.y = size / 2;
    group.add(crate);

    // 十字绑带
    const strapMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const hStrap = new THREE.Mesh(new THREE.BoxGeometry(size + 0.02, 0.05, size + 0.02), strapMat);
    hStrap.position.y = size / 2;
    group.add(hStrap);
    const vStrap = new THREE.Mesh(new THREE.BoxGeometry(size + 0.02, size + 0.02, 0.05), strapMat);
    vStrap.position.y = size / 2;
    group.add(vStrap);

    // 随机倾斜
    group.rotation.z = (Math.random() - 0.5) * 0.3;
    group.rotation.y = Math.random() * Math.PI * 2;

    const h = this.getTerrainHeightExact(x, z);
    group.position.set(x, h, z);
    group.name = 'supplyCrate';
    this.scene.add(group);

    // 碰撞（可跳上）
    if (window.addCollider) {
      window.addCollider(x, z, size / 2, size / 2, h + size, 'supplyCrate', false);
    }
  },

  // ==================== 信号塔 ====================
  generateSignalTower() {
    const group = new THREE.Group();
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x888899 });
    const redMat = new THREE.MeshLambertMaterial({ color: 0xcc3333 });

    // 底座
    const base = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 6), metalMat);
    base.position.y = 0.5;
    group.add(base);

    // 塔身（4根主柱 + 横梁）
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const px = Math.cos(angle) * 2;
      const pz = Math.sin(angle) * 2;
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 25, 0.3), metalMat);
      pillar.position.set(px, 12.5, pz);
      group.add(pillar);
    }

    // 横梁（每5米一层）
    for (let h = 5; h <= 25; h += 5) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(5, 0.2, 0.2), metalMat);
      beam.position.y = h;
      group.add(beam);
      const beam2 = beam.clone();
      beam2.rotation.y = Math.PI / 2;
      group.add(beam2);
    }

    // 顶部天线
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5, 6), metalMat);
    antenna.position.y = 28;
    group.add(antenna);

    // 顶部红灯
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    light.position.y = 30.5;
    light.name = 'towerLight';
    group.add(light);

    // 血条背景（移除DoubleSide，始终面向相机）
    const hpBg = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.5), new THREE.MeshBasicMaterial({ color: 0x333333 }));
    hpBg.position.y = 32;
    hpBg.name = 'towerHPBg';
    group.add(hpBg);

    // 血条填充
    const hpFill = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.4), new THREE.MeshBasicMaterial({ color: 0x44ff44 }));
    hpFill.position.y = 32;
    hpFill.name = 'towerHPFill';
    group.add(hpFill);

    const towerH = this.getTerrainHeightExact(0, 0);
    group.position.set(0, towerH, 0);
    group.name = 'signalTower';
    this.towerMesh = group;
    this.scene.add(group);
    // 信号塔底座碰撞
    if (window.addCollider) {
      window.addCollider(0, 0, 3, 3, towerH + 1, 'signalTower', true);
    }

    // 收音机（塔底部）
    this.createRadio();
  },

  createRadio() {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });

    // 收音机主体
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.3), bodyMat);
    body.position.y = 0.2;
    group.add(body);

    // 天线
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 4), new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
    ant.position.set(0.2, 0.8, 0);
    ant.rotation.z = -0.3;
    group.add(ant);

    // 指示灯（绿色闪烁）
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
    led.position.set(-0.15, 0.35, 0.16);
    led.name = 'radioLED';
    group.add(led);

    // 交互提示标签
    const radioH = this.getTerrainHeightExact(4, 0);
    group.position.set(4, radioH, 0); // 塔旁边
    group.name = 'radio';
    this.radioMesh = group;
    this.scene.add(group);
  },

  // ==================== 电源节点 ====================
  generatePowerNodes() {
    this.powerNodes = [];
    const positions = [
      [80, 80], [-80, 80], [80, -80], [-80, -80]
    ];

    positions.forEach(([x, z], index) => {
      const group = new THREE.Group();
      const genMat = new THREE.MeshLambertMaterial({ color: 0x556655 });

      // 发电机主体
      const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 1.5), genMat);
      body.position.y = 0.75;
      group.add(body);

      // 排气管
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8), new THREE.MeshLambertMaterial({ color: 0x444444 }));
      exhaust.position.set(0.5, 2, 0);
      group.add(exhaust);

      // 控制面板
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.1), new THREE.MeshLambertMaterial({ color: 0x333344 }));
      panel.position.set(0, 1.2, 0.8);
      group.add(panel);

      // 状态灯（红色=未激活，绿色=已激活）
      const statusLight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
      statusLight.position.set(0, 1.4, 0.86);
      statusLight.name = 'powerStatus';
      group.add(statusLight);

      // 血条（显示剩余僵尸，移除DoubleSide）
      const hpBg = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.3), new THREE.MeshBasicMaterial({ color: 0x333333 }));
      hpBg.position.y = 2.5;
      group.add(hpBg);
      const hpFill = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.2), new THREE.MeshBasicMaterial({ color: 0xff4444 }));
      hpFill.position.y = 2.5;
      hpFill.name = 'powerHP';
      group.add(hpFill);

      const h = this.getTerrainHeightExact(x, z);
      group.position.set(x, h, z);
      group.name = `powerNode_${index}`;

      this.scene.add(group);
      // 电源碰撞体
      if (window.addCollider) {
        window.addCollider(x, z, 1.5, 1.2, h + 1.5, 'powerNode', true);
      }
      this.powerNodes.push({
        mesh: group,
        x, z,
        activated: false,
        zombiesCleared: false,
        zombieCount: 8, // 每个电源旁8个僵尸
        spawnedZombies: false,
        index
      });
    });
  },

  // ==================== 返回传送门 ====================
  generateReturnPortal() {
    const group = new THREE.Group();

    // 光柱
    const pillarGeo = new THREE.CylinderGeometry(1.5, 1.5, 8, 6, 1, true);
    const pillarMat = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = 4;
    group.add(pillar);

    // 底部光环
    const ringGeo = new THREE.TorusGeometry(2, 0.2, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x44aaff });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1;
    group.add(ring);

    // 顶部光环
    const ring2 = ring.clone();
    ring2.position.y = 8;
    group.add(ring2);

    // 粒子效果（简单版）
    for (let i = 0; i < 20; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 })
      );
      const angle = Math.random() * Math.PI * 2;
      const radius = 1 + Math.random();
      p.position.set(Math.cos(angle) * radius, Math.random() * 8, Math.sin(angle) * radius);
      p.name = 'portalParticle';
      group.add(p);
    }

    const portalH = this.getTerrainHeightExact(0, SNOW_MAP_CONFIG.MAP_SIZE - 10);
    group.position.set(0, portalH, SNOW_MAP_CONFIG.MAP_SIZE - 10);
    group.name = 'returnPortal';
    this.portalMesh = group;
    this.scene.add(group);
  },

  // ==================== 游荡僵尸（冰霜怪物 - 像素方块详细版）====================
  _addBox(w, h, d, x, y, z, mat, parent, name) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    if (name) mesh.name = name;
    (parent || group).add(mesh);
    return mesh;
  },

  spawnSingleWanderZombie(x, z) {
    const group = new THREE.Group();
    const self = this;

    // 随机体型变体
    const variant = Math.random();
    let sizeScale, hpMult, dmgMult, speedMult, zombieType;
    let skinColor, iceColor, eyeColor, darkColor;
    if (variant < 0.15) {
      zombieType = 'brute';
      sizeScale = 1.5; hpMult = 3.0; dmgMult = 2.0; speedMult = 0.55;
      skinColor = 0x335577; iceColor = 0x224466; eyeColor = 0xff3300; darkColor = 0x1a2a3a;
    } else if (variant < 0.35) {
      zombieType = 'stalker';
      sizeScale = 0.8; hpMult = 0.6; dmgMult = 1.3; speedMult = 1.6;
      skinColor = 0x88bbdd; iceColor = 0x6699bb; eyeColor = 0x00ffcc; darkColor = 0x335566;
    } else {
      zombieType = 'normal';
      sizeScale = 1.0; hpMult = 1.0; dmgMult = 1.0; speedMult = 1.0;
      skinColor = 0x5577aa; iceColor = 0x446688; eyeColor = 0x00ccff; darkColor = 0x223344;
    }

    const s = sizeScale;
    const bodyMat = new THREE.MeshLambertMaterial({ color: skinColor });
    const iceMat = new THREE.MeshLambertMaterial({ color: iceColor, emissive: iceColor, emissiveIntensity: 0.15 });
    const darkMat = new THREE.MeshLambertMaterial({ color: darkColor });
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const bloodMat = new THREE.MeshLambertMaterial({ color: 0x661111 });

    function addBox(w, h, d, x, y, z, mat, parent, name) {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      if (name) mesh.name = name;
      (parent || group).add(mesh);
      return mesh;
    }

    // === 腿部组 ===
    const leftLegGroup = new THREE.Group(); leftLegGroup.name = 'leftLegGroup';
    leftLegGroup.position.set(-0.12 * s, 0.55 * s, 0);
    group.add(leftLegGroup);
    // 大腿
    addBox(0.13 * s, 0.45 * s, 0.13 * s, 0, -0.22 * s, 0, darkMat, leftLegGroup, 'leftThigh');
    // 小腿
    addBox(0.11 * s, 0.40 * s, 0.11 * s, 0, -0.58 * s, 0.02 * s, bodyMat, leftLegGroup, 'leftShin');
    // 脚
    addBox(0.14 * s, 0.08 * s, 0.18 * s, 0, -0.80 * s, 0.04 * s, darkMat, leftLegGroup, 'leftFoot');

    const rightLegGroup = new THREE.Group(); rightLegGroup.name = 'rightLegGroup';
    rightLegGroup.position.set(0.12 * s, 0.55 * s, 0);
    group.add(rightLegGroup);
    addBox(0.13 * s, 0.45 * s, 0.13 * s, 0, -0.22 * s, 0, darkMat, rightLegGroup, 'rightThigh');
    addBox(0.11 * s, 0.40 * s, 0.11 * s, 0, -0.58 * s, 0.02 * s, bodyMat, rightLegGroup, 'rightShin');
    addBox(0.14 * s, 0.08 * s, 0.18 * s, 0, -0.80 * s, 0.04 * s, darkMat, rightLegGroup, 'rightFoot');

    // === 骨盆 ===
    addBox(0.30 * s, 0.18 * s, 0.22 * s, 0, 0.55 * s, 0, darkMat, group, 'pelvis');

    // === 躯干 ===
    const torso = addBox(0.38 * s, 0.55 * s, 0.24 * s, 0, 0.90 * s, 0, bodyMat, group, 'torso');
    // 肋骨纹理（横向暗色条纹）
    for (let i = 0; i < 3; i++) {
      addBox(0.40 * s, 0.03 * s, 0.25 * s, 0, 0.72 * s + i * 0.14 * s, 0, darkMat, group);
    }
    // 胸口冰晶（发光核心）
    const chestCrystal = addBox(0.08 * s, 0.10 * s, 0.10 * s, 0, 1.18 * s, 0.14 * s, iceMat, group, 'chestCrystal');
    chestCrystal.material = new THREE.MeshBasicMaterial({ color: iceColor, transparent: true, opacity: 0.7 });

    // === 肩部冰晶刺 ===
    [-1, 1].forEach(side => {
      const spikeGroup = new THREE.Group();
      spikeGroup.position.set(side * 0.22 * s, 1.20 * s, 0);
      spikeGroup.name = side === -1 ? 'leftSpike' : 'rightSpike';
      group.add(spikeGroup);
      addBox(0.04 * s, 0.20 * s, 0.04 * s, 0, 0.05 * s, 0, iceMat, spikeGroup);
      addBox(0.03 * s, 0.15 * s, 0.03 * s, 0.06 * s, 0.02 * s, 0, iceMat, spikeGroup);
      addBox(0.03 * s, 0.15 * s, 0.03 * s, -0.06 * s, 0.02 * s, 0, iceMat, spikeGroup);
    });

    // === 手臂组 ===
    const leftArmGroup = new THREE.Group(); leftArmGroup.name = 'leftArmGroup';
    leftArmGroup.position.set(-0.22 * s, 1.08 * s, 0);
    group.add(leftArmGroup);
    addBox(0.10 * s, 0.35 * s, 0.10 * s, 0, -0.15 * s, 0, bodyMat, leftArmGroup, 'leftUpperArm');
    const leftForearm = addBox(0.08 * s, 0.32 * s, 0.08 * s, 0, -0.45 * s, 0.04 * s, darkMat, leftArmGroup, 'leftForearm');
    // 爪子
    addBox(0.04 * s, 0.05 * s, 0.10 * s, 0.03 * s, -0.62 * s, 0.06 * s, iceMat, leftArmGroup);
    addBox(0.04 * s, 0.05 * s, 0.10 * s, -0.03 * s, -0.62 * s, 0.06 * s, iceMat, leftArmGroup);

    const rightArmGroup = new THREE.Group(); rightArmGroup.name = 'rightArmGroup';
    rightArmGroup.position.set(0.22 * s, 1.08 * s, 0);
    group.add(rightArmGroup);
    addBox(0.10 * s, 0.35 * s, 0.10 * s, 0, -0.15 * s, 0, bodyMat, rightArmGroup, 'rightUpperArm');
    addBox(0.08 * s, 0.32 * s, 0.08 * s, 0, -0.45 * s, 0.04 * s, darkMat, rightArmGroup, 'rightForearm');
    addBox(0.04 * s, 0.05 * s, 0.10 * s, 0.03 * s, -0.62 * s, 0.06 * s, iceMat, rightArmGroup);
    addBox(0.04 * s, 0.05 * s, 0.10 * s, -0.03 * s, -0.62 * s, 0.06 * s, iceMat, rightArmGroup);

    // === 颈部 ===
    addBox(0.10 * s, 0.10 * s, 0.10 * s, 0, 1.25 * s, 0, darkMat, group, 'neck');

    // === 头部组 ===
    const headGroup = new THREE.Group(); headGroup.name = 'headGroup';
    headGroup.position.y = 1.35 * s;
    group.add(headGroup);
    const head = addBox(0.28 * s, 0.28 * s, 0.28 * s, 0, 0, 0, bodyMat, headGroup, 'head');
    // 发光眼睛
    addBox(0.06 * s, 0.04 * s, 0.03 * s, -0.07 * s, 0.04 * s, 0.15 * s, eyeMat, headGroup, 'leftEye');
    addBox(0.06 * s, 0.04 * s, 0.03 * s, 0.07 * s, 0.04 * s, 0.15 * s, eyeMat, headGroup, 'rightEye');
    // 裂口（锯齿状嘴巴）
    addBox(0.14 * s, 0.03 * s, 0.02 * s, 0, -0.06 * s, 0.15 * s, bloodMat, headGroup, 'mouth');
    // 头顶冰刺
    addBox(0.03 * s, 0.12 * s, 0.03 * s, 0, 0.18 * s, 0, iceMat, headGroup);
    addBox(0.03 * s, 0.08 * s, 0.03 * s, 0.07 * s, 0.12 * s, 0, iceMat, headGroup);
    addBox(0.03 * s, 0.08 * s, 0.03 * s, -0.07 * s, 0.12 * s, 0, iceMat, headGroup);

    // === 背部冰刺 ===
    for (let i = 0; i < 3; i++) {
      addBox(0.04 * s, 0.12 * s, 0.04 * s, 0, 0.70 * s + i * 0.15 * s, -0.14 * s, iceMat, group);
    }

    // 获取地形高度并设置位置
    const h = this.getTerrainHeight(x, z);
    group.position.set(x, h, z);
    group.name = 'wanderZombie';
    this.scene.add(group);

    // 随机游荡方向
    const wanderAngle = Math.random() * Math.PI * 2;
    const zombie = {
      mesh: group,
      hp: 55 * hpMult,
      maxHp: 55 * hpMult,
      speed: SNOW_MAP_CONFIG.WANDER_SPEED * speedMult,
      state: 'wander',
      wanderAngle,
      wanderTimer: 3 + Math.random() * 5,
      detectionRange: SNOW_MAP_CONFIG.WANDER_DETECTION_RANGE,
      damage: 12 * dmgMult,
      attackTimer: 1.5,
      animTimer: Math.random() * Math.PI * 2,
      attackAnimTimer: 0,
      type: zombieType,
      sizeScale: s,
      iceEffectTimer: 0,
      // 骨骼引用
      bones: {
        leftLeg: leftLegGroup, rightLeg: rightLegGroup,
        leftArm: leftArmGroup, rightArm: rightArmGroup,
        head: headGroup
      }
    };
    this.wanderZombies.push(zombie);
  },

  spawnWanderZombies() {
    this.wanderZombies = [];
    const S = SNOW_MAP_CONFIG.MAP_SIZE * 0.7;

    for (let i = 0; i < SNOW_MAP_CONFIG.WANDER_ZOMBIE_COUNT; i++) {
      const x = (Math.random() - 0.5) * S * 2;
      const z = (Math.random() - 0.5) * S * 2;
      this.spawnSingleWanderZombie(x, z);
    }
  },

  updateWanderZombies(dt) {
    if (!this.camera) return;
    const playerPos = this.camera.position.clone();

    this.wanderZombies.forEach(z => {
      if (z.state === 'dead') return;

      const bones = z.bones || {};
      const s = z.sizeScale || 1.0;

      // === 行走动画（腿部+手臂摆动） ===
      z.animTimer += dt * (z.state === 'chase' ? 8 : 5);
      const walkCycle = Math.sin(z.animTimer);

      // 腿部摆动
      if (bones.leftLeg) bones.leftLeg.rotation.x = walkCycle * 0.5;
      if (bones.rightLeg) bones.rightLeg.rotation.x = -walkCycle * 0.5;

      // 手臂摆动（与腿相反）
      if (bones.leftArm) bones.leftArm.rotation.x = -walkCycle * 0.4 + 0.15;
      if (bones.rightArm) bones.rightArm.rotation.x = walkCycle * 0.4 + 0.15;

      // 头部轻微晃动
      if (bones.head) {
        bones.head.rotation.z = Math.sin(z.animTimer * 0.7) * 0.04;
        bones.head.rotation.y = Math.sin(z.animTimer * 0.5) * 0.06;
      }

      // 身体轻微上下浮动
      z.mesh.children.forEach(child => {
        if (child.name === 'torso' || child.name === 'pelvis') {
          child.position.y += Math.abs(walkCycle) * 0.02 * s;
        }
      });

      // === 攻击动画 ===
      if (z.attackAnimTimer > 0) {
        z.attackAnimTimer -= dt;
        const progress = 1 - z.attackAnimTimer / 0.35;
        const swing = Math.sin(progress * Math.PI);

        if (bones.leftArm) bones.leftArm.rotation.x = -1.2 * swing;
        if (bones.rightArm) bones.rightArm.rotation.x = -1.2 * swing;

        // 攻击时身体前倾
        const torso = z.mesh.getObjectByName('torso');
        if (torso) torso.rotation.x = -0.2 * swing;
      } else {
        // 恢复身体直立
        const torso = z.mesh.getObjectByName('torso');
        if (torso) torso.rotation.x *= 0.9;
      }

      // === 冰晶脉冲效果 ===
      z.iceEffectTimer += dt;
      const chestCrystal = z.mesh.getObjectByName('chestCrystal');
      if (chestCrystal && chestCrystal.material) {
        const pulse = 0.5 + Math.sin(z.iceEffectTimer * 3) * 0.3;
        chestCrystal.material.opacity = pulse;
        chestCrystal.scale.setScalar(0.9 + Math.sin(z.iceEffectTimer * 3) * 0.2);
      }

      const zPos = z.mesh.position.clone();
      zPos.y = 0;
      const playerPosFlat = playerPos.clone();
      playerPosFlat.y = 0;
      const dist = zPos.distanceTo(playerPosFlat);

      if (z.state === 'wander') {
        if (dist < z.detectionRange) {
          z.state = 'chase';
          return;
        }

        z.wanderTimer -= dt;
        if (z.wanderTimer <= 0) {
          z.wanderAngle = Math.random() * Math.PI * 2;
          z.wanderTimer = 3 + Math.random() * 5;
        }

        const dx = Math.cos(z.wanderAngle) * z.speed * dt;
        const dz = Math.sin(z.wanderAngle) * z.speed * dt;
        z.mesh.position.x += dx;
        z.mesh.position.z += dz;
        z.mesh.position.y = this.getTerrainHeight(z.mesh.position.x, z.mesh.position.z);

        const targetX = z.mesh.position.x + Math.cos(z.wanderAngle);
        const targetZ = z.mesh.position.z + Math.sin(z.wanderAngle);
        const currentY = z.mesh.position.y;
        z.mesh.lookAt(targetX, currentY, targetZ);

      } else if (z.state === 'chase') {
        if (dist > z.detectionRange * 2) {
          z.state = 'wander';
          return;
        }

        const dir = new THREE.Vector3().subVectors(playerPosFlat, zPos).normalize();
        const chaseSpeed = SNOW_MAP_CONFIG.WANDER_CHASE_SPEED * (z.speed / SNOW_MAP_CONFIG.WANDER_SPEED);
        z.mesh.position.x += dir.x * chaseSpeed * dt;
        z.mesh.position.z += dir.z * chaseSpeed * dt;
        z.mesh.position.y = this.getTerrainHeight(z.mesh.position.x, z.mesh.position.z);

        z.mesh.lookAt(playerPos.x, z.mesh.position.y, playerPos.z);

        if (dist < 2) {
          z.attackTimer -= dt;
          if (z.attackTimer <= 0) {
            z.attackTimer = z.type === 'brute' ? 2.0 : (z.type === 'stalker' ? 1.0 : 1.5);
            z.attackAnimTimer = 0.35;
            if (typeof window.damagePlayer === 'function') {
              window.damagePlayer(z.damage);
            }
            if (AudioSystem && AudioSystem.playSound) {
              AudioSystem.playSound('zombie_attack');
            }
          }
        }
      }

      // 确保所有子对象Y坐标随地形更新后保持正确
      if (z.mesh.position.y !== this.getTerrainHeight(z.mesh.position.x, z.mesh.position.z)) {
        z.mesh.position.y = this.getTerrainHeight(z.mesh.position.x, z.mesh.position.z);
      }
    });
  },

  damageWanderZombie(zombie, damage) {
    zombie.hp -= damage;
    if (zombie.hp <= 0) {
      zombie.state = 'dead';
      zombie.mesh.visible = false;
      return true;
    }
    return false;
  },

  // ==================== 任务系统 ====================
  startExplore() {
    this.phase = 'explore';
    this.radioInteracted = false;
    this.activatedPowers = 0;
    this.defenseWave = 0;
    this.towerHP = SNOW_MAP_CONFIG.TOWER_HP;
    this.spawnWanderZombies();
    this.updatePowerNodeVisuals();

    // 为电源节点生成守护僵尸
    this.powerNodes.forEach(node => {
      if (!node.spawnedZombies) {
        for (let i = 0; i < node.zombieCount; i++) {
          const angle = (i / node.zombieCount) * Math.PI * 2;
          const dist = 5 + Math.random() * 8;
          const zx = node.x + Math.cos(angle) * dist;
          const zz = node.z + Math.sin(angle) * dist;
          this.spawnSingleWanderZombie(zx, zz);
        }
        node.spawnedZombies = true;
      }
    });
  },

  interactRadio() {
    if (this.radioInteracted) return;
    this.radioInteracted = true;
    this.phase = 'power';

    // 显示任务弹窗
    if (typeof window.showSnowMissionDialog === 'function') {
      window.showSnowMissionDialog('radio');
    }
  },

  activatePower(index) {
    const node = this.powerNodes[index];
    if (!node || node.activated) return;

    node.activated = true;
    this.activatedPowers++;

    // 更新视觉
    const statusLight = node.mesh.getObjectByName('powerStatus');
    if (statusLight) statusLight.material.color.setHex(0x00ff00);

    // 显示提示
    if (typeof window.showToast === 'function') {
      window.showToast(`⚡ 电源 ${this.activatedPowers}/${SNOW_MAP_CONFIG.POWER_COUNT} 已激活`, 'info');
    }

    if (this.activatedPowers >= SNOW_MAP_CONFIG.POWER_COUNT) {
      // 所有电源已激活
      this.phase = 'returnToTower';
      if (typeof window.showSnowMissionDialog === 'function') {
        window.showSnowMissionDialog('allPowers');
      }
    }
  },

  startDefense() {
    this.phase = 'defend';
    this.defenseWave = 0;
    this.towerHP = SNOW_MAP_CONFIG.TOWER_HP;
    this.shakeIntensity = 2;
    this.shakeTimer = 5;
    // 显示波次信息
    const waveInfo = document.getElementById('wave-info');
    if (waveInfo) waveInfo.style.display = 'block';
    this.nextDefenseWave();
  },

  nextDefenseWave() {
    this.defenseWave++;
    if (this.defenseWave > SNOW_MAP_CONFIG.DEFENSE_WAVES) {
      this.defenseComplete();
      return;
    }

    this.defenseWaveActive = true;
    if (typeof window.showToast === 'function') {
      window.showToast(`🛡️ 信号塔防御 第 ${this.defenseWave}/${SNOW_MAP_CONFIG.DEFENSE_WAVES} 波`, 'warning');
    }

    // 生成防御波敌人
    const count = 5 + this.defenseWave * 3;
    this.spawnDefenseWaveEnemies(count);
  },

  spawnDefenseWaveEnemies(count) {
    // 使用游戏主系统的敌人生成
    if (typeof window.spawnEnemy === 'function') {
      if (!this.defenseEnemies) this.defenseEnemies = [];
      // 限制同时存在的敌人总数（防止卡顿）
      const aliveCount = this.defenseEnemies.filter(e => e && !e.dead && e.mesh).length;
      const maxAlive = 40; // 最大同时存在敌人数
      const actualCount = Math.min(count, maxAlive - aliveCount);
      if (actualCount <= 0) return;
      
      for (let i = 0; i < actualCount; i++) {
        // 在信号塔周围 40-80 米处生成（靠近道路，避免卡地形）
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 40;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const terrainH = this.getTerrainHeight(x, z);
        const pos = new THREE.Vector3(x, terrainH, z);
        // 雪山专属僵尸类型（v3.0 感染变异体）
        // 1-4波：基础型（感染者+极地动物融合）
        let types = ['冻尸行者', '霜狼丧尸', '冰甲巨尸'];
        // 5-9波：加入特殊型
        if (this.defenseWave >= 5) types.push('冰喙秃鹫', '冰爆腐尸', '雪豹潜行者');
        // 10-14波：加入BOSS型
        if (this.defenseWave >= 10) types.push('极地暴君');
        // 15波：雪崩巨兽作为最终BOSS
        if (this.defenseWave >= 15) types = ['雪崩巨兽'];
        const type = types[Math.floor(Math.random() * types.length)];
        const enemy = window.spawnEnemy(type, pos);
        if (enemy) this.defenseEnemies.push(enemy);
      }
    }
  },

  damageTower(damage) {
    this.towerHP -= damage;
    if (this.towerHP <= 0) {
      this.towerHP = 0;
      this.updateTowerHPBar();
      // 信号塔被摧毁 - 游戏失败
      this.towerDestroyed();
    } else {
      this.updateTowerHPBar();
    }
  },

  towerDestroyed() {
    this.phase = 'failed';
    this.defenseWaveActive = false;
    this.shakeIntensity = 5;
    this.shakeTimer = 3;
    
    // 清除所有波次敌人
    if (this.defenseEnemies) {
      this.defenseEnemies.forEach(e => { if (e.mesh) scene.remove(e.mesh); });
      this.defenseEnemies = [];
    }
    
    // 显示失败弹窗
    if (typeof window.showSnowMissionDialog === 'function') {
      window.showSnowMissionDialog('towerDestroyed');
    }
  },

  updateTowerHPBar() {
    if (!this.towerMesh) return;
    const fill = this.towerMesh.getObjectByName('towerHPFill');
    if (fill) {
      const pct = this.towerHP / this.towerMaxHP;
      fill.scale.x = Math.max(0.001, pct);
      fill.position.x = -(1 - pct) * 3;
      // 颜色变化
      if (pct > 0.5) fill.material.color.setHex(0x44ff44);
      else if (pct > 0.25) fill.material.color.setHex(0xffaa00);
      else fill.material.color.setHex(0xff4444);
    }
  },

  defenseComplete() {
    this.phase = 'complete';
    this.defenseWaveActive = false;
    this.shakeIntensity = 0;

    if (typeof window.showSnowMissionDialog === 'function') {
      window.showSnowMissionDialog('complete');
    }
  },

  updatePowerNodeVisuals() {
    this.powerNodes.forEach(node => {
      const hpBar = node.mesh.getObjectByName('powerHP');
      if (hpBar && !node.zombiesCleared) {
        // 显示僵尸清除进度
        const killed = node.zombieCount - this.getAliveZombiesNearPower(node);
        const pct = killed / node.zombieCount;
        hpBar.scale.x = Math.max(0.001, pct);
        hpBar.position.x = -(1 - pct) * 1.5;
      } else if (hpBar && node.zombiesCleared) {
        hpBar.material.color.setHex(0x00ff00);
        hpBar.scale.x = 1;
        hpBar.position.x = 0;
      }
    });
  },

  getAliveZombiesNearPower(node) {
    return this.wanderZombies.filter(z => {
      if (z.state === 'dead') return false;
      const dx = z.mesh.position.x - node.x;
      const dz = z.mesh.position.z - node.z;
      return Math.sqrt(dx * dx + dz * dz) < 20;
    }).length;
  },

  // ==================== 更新循环 ====================
  update(dt) {
    if (!this.active) return;

    // 更新游荡僵尸
    this.updateWanderZombies(dt);

    // 更新传送门动画
    if (this.portalMesh) {
      this.portalMesh.rotation.y += dt * 0.5;
      this.portalMesh.children.forEach(c => {
        if (c.name === 'portalParticle') {
          c.position.y += dt * 2;
          if (c.position.y > 8) c.position.y = 0;
        }
      });
    }

    // 更新信号塔血条面向玩家
    if (this.towerMesh && this.camera) {
      const hpBg = this.towerMesh.getObjectByName('towerHPBg');
      const hpFill = this.towerMesh.getObjectByName('towerHPFill');
      if (hpBg) hpBg.lookAt(this.camera.position);
      if (hpFill) hpFill.lookAt(this.camera.position);
      // 灯闪烁
      const light = this.towerMesh.getObjectByName('towerLight');
      if (light && this.phase === 'defend') {
        light.material.color.setHex(Math.sin(Date.now() * 0.01) > 0 ? 0xff0000 : 0x440000);
      }
    }

    // 更新电源血条面向玩家
    this.powerNodes.forEach(node => {
      if (this.camera) {
        node.mesh.children.forEach(c => {
          if (c.name === 'powerHP' || c.name === 'powerStatus') {
            // 面向玩家
          }
        });
        // 整体面向玩家（仅血条部分）
        const hpBar = node.mesh.getObjectByName('powerHP');
        if (hpBar) hpBar.lookAt(this.camera.position);
      }

      // 检查电源旁僵尸是否清除
      if (!node.activated && !node.zombiesCleared) {
        const alive = this.getAliveZombiesNearPower(node);
        if (alive === 0 && node.spawnedZombies) {
          node.zombiesCleared = true;
          this.updatePowerNodeVisuals();
        }
      }
    });

    // 更新收音机LED闪烁
    if (this.radioMesh && !this.radioInteracted) {
      const led = this.radioMesh.getObjectByName('radioLED');
      if (led) {
        led.material.color.setHex(Math.sin(Date.now() * 0.005) > 0 ? 0x00ff00 : 0x003300);
      }
    }

    // 画面震动
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) this.shakeIntensity = 0;
    }

    // 防御波次：检测当前波次敌人是否全部死亡，自动开启下一波
    if (this.phase === 'defend' && this.defenseWaveActive && this.defenseEnemies) {
      const aliveCount = this.defenseEnemies.filter(e => e && !e.dead && e.mesh).length;
      if (aliveCount === 0 && this.defenseEnemies.length > 0) {
        // 当前波次敌人全部死亡，延迟2秒后开启下一波
        if (!this._nextWaveTimer) this._nextWaveTimer = 0;
        this._nextWaveTimer += dt;
        if (this._nextWaveTimer > 2) {
          this._nextWaveTimer = 0;
          this.defenseWaveActive = false;
          this.nextDefenseWave();
        }
      } else {
        this._nextWaveTimer = 0;
      }
    }
  },

  // ==================== 清理 ====================
  // ====== 生成地图（MapManager接口）======
  generate(options) {
    // SnowMap的生成逻辑在init()中已完成
    // 此方法供MapManager.switchTo()调用
    console.log('[SnowMap] generate() called - already initialized');
    this.active = true;
  },

  // ====== 获取地图边界（MapManager接口）======
  getMapBounds() {
    const size = typeof SNOW_MAP_CONFIG !== 'undefined' ? SNOW_MAP_CONFIG.MAP_SIZE : 500;
    return {
      minX: -size,
      maxX: size,
      minZ: -size,
      maxZ: size
    };
  },

  cleanup() {
    // 如果未初始化或已清理，跳过
    if (!this.scene || !this.active) return;
    
    this.active = false;
    this.phase = 'explore';
    this.wanderZombies = [];
    this.powerNodes = [];
    this.defenseEnemies = [];
    this.minimapMarkers = [];
    this.radioInteracted = false;
    this.activatedPowers = 0;
    this.defenseWave = 0;
    this.towerHP = SNOW_MAP_CONFIG.TOWER_HP;

    // 清除雪山添加的碰撞体
    if (typeof window.clearColliders === 'function') {
      window.clearColliders();
    }

    // 移除网格辅助线
    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
      this.gridHelper = null;
    }

    // 移除所有雪山场景对象
    const toRemove = [];
    this.scene.traverse(child => {
      if (child.name && (
        child.name === 'snowGround' ||
        child.name === 'signalTower' ||
        child.name === 'radio' ||
        child.name === 'returnPortal' ||
        child.name === 'abandonedCar' ||
        child.name === 'gasStation' ||
        child.name === 'snowPile' ||
        child.name === 'rock' ||
        child.name === 'deadTree' ||
        child.name === 'abandonedCabin' ||
        child.name === 'iceWall' ||
        child.name === 'fallenPole' ||
        child.name === 'snowman' ||
        child.name === 'supplyCrate' ||
        child.name === 'wanderZombie' ||
        child.name.startsWith('powerNode_') ||
        child.name === 'snowRoad' ||
        child.name === 'snowRail'
      )) {
        toRemove.push(child);
      }
    });
    toRemove.forEach(obj => {
      this.scene.remove(obj);
      // 递归dispose所有子对象（Group内部的mesh也需要清理）
      obj.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      });
    });

    this.groundMesh = null;
    this.towerMesh = null;
    this.radioMesh = null;
    this.portalMesh = null;
  }
};

// 导出到全局
window.SnowMap = SnowMap;

// 自动注册到MapManager
if (window.MapManager && typeof MapManager.registerMap === 'function') {
  MapManager.registerMap('snow', SnowMap);
}
