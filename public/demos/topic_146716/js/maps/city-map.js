/**
 * City Map Module
 * 城市地图系统 - 从game.js提取
 * 负责城市地图的生成、更新和清理
 */

// ============================================================
// 城市地图配置
// ============================================================
// window.CITY_CONFIG 和 BUILDING_TYPES 由 game.js 定义并导出到 window
// 这里直接使用 window 上的定义，不再重新声明变量

// ============================================================
// CityMap 主对象
// ============================================================
const CityMap = {
  // 状态
  active: false,
  scene: null,
  camera: null,
  
  // 区块系统
  chunks: new Map(),
  chunkUpdateTimer: 0,
  lastPlayerChunk: {x: 0, z: 0},
  allChunkData: [],
  
  // 城市对象
  buildings: [],
  cityPortals: [],
  portalsActivated: false,
  
  // 初始化
  init(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.active = false;
    this.buildings = [];
    this.cityPortals = [];
    this.portalsActivated = false;
    this.chunks.clear();
    this.chunkUpdateTimer = 0;
    this.lastPlayerChunk = {x: 0, z: 0};
    this.allChunkData = [];
  },
  
  // 生成完整城市地图
  generate() {
    console.log('[CityMap] Generating city...');
    
    // 清理旧数据
    this.cleanup();
    
    // 生成地面
    this.generateGround();
    
    // 生成道路
    this.generateRoads();
    
    // 初始化区块系统
    this.initChunkSystem();
    
    // 生成城市细节（车辆、路灯等）
    this.generateDetails();
    
    // 生成传送门
    this.generatePortals();
    
    this.active = true;
    console.log('[CityMap] City generated');
  },
  
  // 生成地面
  generateGround() {
    const groundGeo = new THREE.PlaneGeometry(window.CITY_CONFIG.MAP_SIZE * 2, window.CITY_CONFIG.MAP_SIZE * 2, 10, 10);
    const groundMat = new THREE.MeshLambertMaterial({ color: window.CITY_CONFIG.GROUND_COLOR });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'cityGround';
    this.scene.add(ground);
    this.buildings.push(ground);
  },
  
  // 生成道路
  generateRoads() {
    const roadMat = new THREE.MeshLambertMaterial({ color: window.CITY_CONFIG.ROAD_COLOR });
    const chunkSize = window.CITY_CONFIG.CHUNK_SIZE;
    const range = Math.ceil(window.CITY_CONFIG.MAP_SIZE / chunkSize);
    
    for (let i = -range; i <= range; i++) {
      // 横向道路
      const roadH = new THREE.Mesh(
        new THREE.PlaneGeometry(window.CITY_CONFIG.MAP_SIZE * 2, 8),
        roadMat
      );
      roadH.rotation.x = -Math.PI / 2;
      roadH.position.set(0, 0.02, i * chunkSize);
      roadH.receiveShadow = true;
      roadH.name = 'cityRoad';
      this.scene.add(roadH);
      this.buildings.push(roadH);
      
      // 纵向道路
      const roadV = new THREE.Mesh(
        new THREE.PlaneGeometry(8, window.CITY_CONFIG.MAP_SIZE * 2),
        roadMat
      );
      roadV.rotation.x = -Math.PI / 2;
      roadV.position.set(i * chunkSize, 0.02, 0);
      roadV.receiveShadow = true;
      roadV.name = 'cityRoad';
      this.scene.add(roadV);
      this.buildings.push(roadV);
    }
  },
  
  // 初始化区块系统
  initChunkSystem() {
    this.chunks.clear();
    this.chunkUpdateTimer = 0;
    this.lastPlayerChunk = {x: 0, z: 0};
    
    // 预生成所有区块数据
    this.generateAllChunkData();
    
    // 加载初始区块
    this.updateChunks();
  },
  
  // 获取玩家所在区块
  getPlayerChunk() {
    const px = this.camera.position.x;
    const pz = this.camera.position.z;
    const cx = Math.floor(px / window.CITY_CONFIG.CHUNK_SIZE);
    const cz = Math.floor(pz / window.CITY_CONFIG.CHUNK_SIZE);
    return {x: cx, z: cz};
  },
  
  // 获取区块key
  getChunkKey(cx, cz) {
    return `${cx},${cz}`;
  },
  
  // 预生成所有区块数据
  generateAllChunkData() {
    this.allChunkData = [];
    const range = Math.ceil(window.CITY_CONFIG.MAP_SIZE / window.CITY_CONFIG.CHUNK_SIZE);
    
    for (let cx = -range; cx <= range; cx++) {
      for (let cz = -range; cz <= range; cz++) {
        const chunkData = this.generateChunkData(cx, cz);
        if (chunkData && chunkData.buildings.length > 0) {
          this.allChunkData.push(chunkData);
        }
      }
    }
  },
  
  // 生成单个区块数据
  generateChunkData(cx, cz) {
    const chunkWorldX = cx * window.CITY_CONFIG.CHUNK_SIZE;
    const chunkWorldZ = cz * window.CITY_CONFIG.CHUNK_SIZE;
    
    // 跳过中心区块（玩家出生点）
    if (cx === 0 && cz === 0) {
      return {cx, cz, buildings: [], props: []};
    }
    
    const buildings = [];
    const props = [];
    const FLOOR_H = 3;
    const ROAD_WIDTH = 8;
    const placed = [];
    
    const BUILDING_TYPES_LOCAL = [
      { type: 'RESIDENTIAL', minFloors: 4, maxFloors: 8,  minW: 10, maxW: 16, minD: 10, maxD: 16, weight: 0.4 },
      { type: 'COMMERCIAL',  minFloors: 6, maxFloors: 15, minW: 12, maxW: 20, minD: 12, maxD: 20, weight: 0.3 },
      { type: 'INDUSTRIAL',  minFloors: 2, maxFloors: 4,  minW: 14, maxW: 22, minD: 14, maxD: 22, weight: 0.15 },
      { type: 'WAREHOUSE',   minFloors: 1, maxFloors: 2,  minW: 16, maxW: 24, minD: 16, maxD: 24, weight: 0.15 }
    ];
    
    function pickBuildingType() {
      const r = Math.random();
      let acc = 0;
      for (const bt of BUILDING_TYPES_LOCAL) {
        acc += bt.weight;
        if (r <= acc) return bt;
      }
      return BUILDING_TYPES_LOCAL[0];
    }
    
    function overlaps(nx, nz, nw, nd) {
      const margin = ROAD_WIDTH / 2;
      for (const p of placed) {
        if (nx - nw / 2 - margin < p.x + p.w / 2 + margin &&
            nx + nw / 2 + margin > p.x - p.w / 2 - margin &&
            nz - nd / 2 - margin < p.z + p.d / 2 + margin &&
            nz + nd / 2 + margin > p.z - p.d / 2 - margin) {
          return true;
        }
      }
      return false;
    }
    
    const maxAttempts = 6;
    const numBuildings = 1 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numBuildings; i++) {
      const bt = pickBuildingType();
      const floors = bt.minFloors + Math.floor(Math.random() * (bt.maxFloors - bt.minFloors + 1));
      const w = bt.minW + Math.random() * (bt.maxW - bt.minW);
      const d = bt.minD + Math.random() * (bt.maxD - bt.minD);
      const h = floors * FLOOR_H;
      
      let placed_ok = false;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const px = chunkWorldX + (Math.random() - 0.5) * (window.CITY_CONFIG.CHUNK_SIZE - w - ROAD_WIDTH);
        const pz = chunkWorldZ + (Math.random() - 0.5) * (window.CITY_CONFIG.CHUNK_SIZE - d - ROAD_WIDTH);
        
        if (!overlaps(px, pz, w, d)) {
          const doorSide = Math.floor(Math.random() * 4);
          let doorX, doorZ, doorDir;
          if (doorSide === 0) { doorX = px + w / 2; doorZ = pz; doorDir = 0; }
          else if (doorSide === 1) { doorX = px - w / 2; doorZ = pz; doorDir = Math.PI; }
          else if (doorSide === 2) { doorX = px; doorZ = pz + d / 2; doorDir = Math.PI / 2; }
          else { doorX = px; doorZ = pz - d / 2; doorDir = -Math.PI / 2; }
          
          const windowsPerFloor = {
            xWalls: Math.max(1, Math.floor(w / 3)),
            zWalls: Math.max(1, Math.floor(d / 3))
          };
          
          const hasStair = floors >= 3 || Math.random() > 0.4;
          
          let stairData = null;
          if (hasStair) {
            const stairWidth = 2.5;
            const stepHeight = 0.3;
            const stepDepth = 0.5;
            const stepCount = Math.round(FLOOR_H / stepHeight);
            const stairOffsetX = (Math.random() > 0.5 ? 1 : -1) * (w / 2 - stairWidth / 2 - 1);
            const stairOffsetZ = (Math.random() > 0.5 ? 1 : -1) * (d / 2 - stepCount * stepDepth / 2 - 1);
            stairData = {
              offsetX: stairOffsetX,
              offsetZ: stairOffsetZ,
              width: stairWidth,
              stepHeight: stepHeight,
              stepDepth: stepDepth,
              stepCount: stepCount,
              direction: Math.random() > 0.5 ? 0 : Math.PI / 2
            };
          }
          
          let color;
          if (bt.type === 'RESIDENTIAL') color = 0x8899AA + Math.floor(Math.random() * 0x222222);
          else if (bt.type === 'COMMERCIAL') color = 0x667788 + Math.floor(Math.random() * 0x222222);
          else if (bt.type === 'INDUSTRIAL') color = 0x778877 + Math.floor(Math.random() * 0x111111);
          else color = 0x888877 + Math.floor(Math.random() * 0x111111);
          
          buildings.push({
            x: px, z: pz, w, h, d,
            floors, floorHeight: FLOOR_H,
            color, type: bt.type,
            doorX, doorZ, doorDir,
            windowsPerFloor,
            hasStair, stairData
          });
          
          placed.push({ x: px, z: pz, w, d });
          placed_ok = true;
          break;
        }
      }
    }
    
    if (Math.random() > 0.5) {
      props.push({
        type: 'car',
        x: chunkWorldX + (Math.random() - 0.5) * window.CITY_CONFIG.CHUNK_SIZE * 0.8,
        z: chunkWorldZ + (Math.random() - 0.5) * window.CITY_CONFIG.CHUNK_SIZE * 0.8,
        rotation: Math.random() * Math.PI * 2
      });
    }
    
    return {cx, cz, buildings, props};
  },
  
  // 加载区块
  loadChunk(cx, cz) {
    const key = this.getChunkKey(cx, cz);
    if (this.chunks.has(key)) return;
    
    const chunkData = this.allChunkData.find(c => c.cx === cx && c.cz === cz);
    if (!chunkData) return;
    
    const chunkMeshes = [];
    
    // 创建建筑
    for (const b of chunkData.buildings) {
      const building = this.createBuilding(b);
      if (building) {
        this.scene.add(building);
        chunkMeshes.push(building);
        this.buildings.push(building);
      }
    }
    
    // 创建道具
    for (const p of chunkData.props) {
      if (p.type === 'car') {
        const car = this.createSimpleCar(p.x, p.z, p.rotation);
        if (car) {
          this.scene.add(car);
          chunkMeshes.push(car);
          this.buildings.push(car);
        }
      }
    }
    
    this.chunks.set(key, {cx, cz, meshes: chunkMeshes});
  },
  
  // 卸载区块
  unloadChunk(cx, cz) {
    const key = this.getChunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (!chunk) return;
    
    for (const mesh of chunk.meshes) {
      this.scene.remove(mesh);
      const idx = this.buildings.indexOf(mesh);
      if (idx > -1) this.buildings.splice(idx, 1);
    }
    
    this.chunks.delete(key);
  },
  
  // 更新区块（动态加载/卸载）
  updateChunks() {
    const playerChunk = this.getPlayerChunk();
    const radius = window.CITY_CONFIG.CHUNK_LOAD_RADIUS;
    
    // 加载新区块
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        this.loadChunk(playerChunk.x + dx, playerChunk.z + dz);
      }
    }
    
    // 卸载远处区块
    for (const [key, chunk] of this.chunks) {
      const dx = Math.abs(chunk.cx - playerChunk.x);
      const dz = Math.abs(chunk.cz - playerChunk.z);
      if (dx > radius || dz > radius) {
        this.unloadChunk(chunk.cx, chunk.cz);
      }
    }
    
    this.lastPlayerChunk = playerChunk;
  },
  
  // 创建建筑
  createBuilding(b) {
    const group = new THREE.Group();
    
    // 主体
    const bodyGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const bodyMat = new THREE.MeshLambertMaterial({ color: b.color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = b.h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // 添加碰撞体
    if (window.addCollider) {
      window.addCollider(b.x, b.z, b.w / 2 + 0.15, b.d / 2 + 0.15, b.h, 'building_wall', true);
    }
    
    group.position.set(b.x, 0, b.z);
    group.name = 'chunk_building';
    return group;
  },
  
  // 创建简单车辆
  createSimpleCar(x, z, rotation) {
    const group = new THREE.Group();
    
    const bodyGeo = new THREE.BoxGeometry(2, 1, 4);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    group.add(body);
    
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    group.name = 'cityCar';
    
    // 碰撞体
    if (window.addCollider) {
      window.addCollider(x, z, 1.3, 2.3, 1.7, 'car', false);
    }
    
    return group;
  },
  
  // 生成城市细节
  generateDetails() {
    // 简化版：随机生成一些路灯
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * window.CITY_CONFIG.MAP_SIZE * 1.5;
      const z = (Math.random() - 0.5) * window.CITY_CONFIG.MAP_SIZE * 1.5;
      this.createLampPost(x, z);
    }
  },
  
  // 创建路灯
  createLampPost(x, z) {
    const group = new THREE.Group();
    
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 4);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 2;
    group.add(pole);
    
    const lightGeo = new THREE.SphereGeometry(0.3);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.y = 4;
    group.add(light);
    
    group.position.set(x, 0, z);
    group.name = 'cityLamp';
    this.scene.add(group);
    this.buildings.push(group);
  },
  
  // 生成传送门
  generatePortals() {
    this.cityPortals = [];
    const portalPositions = [
      { x: 50, z: 50 },
      { x: -50, z: 50 },
      { x: 50, z: -50 },
      { x: -50, z: -50 }
    ];
    
    for (const pos of portalPositions) {
      const portal = this.createPortal(pos.x, pos.z);
      if (portal) {
        this.cityPortals.push(portal);
      }
    }
  },
  
  // 创建传送门
  createPortal(x, z) {
    const group = new THREE.Group();
    
    // 基座
    const baseGeo = new THREE.CylinderGeometry(2, 2.5, 0.5, 8);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.25;
    group.add(base);
    
    // 光柱
    const pillarGeo = new THREE.CylinderGeometry(1.5, 1.5, 6, 8);
    const pillarMat = new THREE.MeshBasicMaterial({ 
      color: 0x4488ff, 
      transparent: true, 
      opacity: 0.3 
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = 3;
    group.add(pillar);
    
    group.position.set(x, 0, z);
    group.name = 'cityPortal';
    this.scene.add(group);
    this.buildings.push(group);
    
    return { mesh: group, x, z, active: false };
  },
  
  // 激活传送门
  activatePortals() {
    this.portalsActivated = true;
    for (const portal of this.cityPortals) {
      portal.active = true;
      // 改变光柱颜色表示激活
      const pillar = portal.mesh.children[1];
      if (pillar) {
        pillar.material.color.setHex(0x44ff44);
      }
    }
  },
  
  // 更新传送门
  updatePortals(dt) {
    if (!this.portalsActivated) return;
    
    for (const portal of this.cityPortals) {
      if (!portal.active) continue;
      
      // 旋转光柱
      const pillar = portal.mesh.children[1];
      if (pillar) {
        pillar.rotation.y += dt * 0.5;
      }
      
      // 检查玩家距离
      const dx = this.camera.position.x - portal.x;
      const dz = this.camera.position.z - portal.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < 3) {
        // 玩家靠近传送门，可以传送
        // 这里可以触发传送逻辑
      }
    }
  },
  
  // 更新（每帧调用）
  update(dt) {
    if (!this.active) return;
    
    // 更新区块
    this.chunkUpdateTimer += dt;
    if (this.chunkUpdateTimer >= 0.5) {
      const playerChunk = this.getPlayerChunk();
      if (playerChunk.x !== this.lastPlayerChunk.x || 
          playerChunk.z !== this.lastPlayerChunk.z) {
        this.updateChunks();
      }
      this.chunkUpdateTimer = 0;
    }
    
    // 更新传送门
    this.updatePortals(dt);
  },
  
  // 清理城市地图
  cleanup() {
    console.log('[CityMap] Cleaning up...');
    
    this.active = false;
    
    // 移除所有建筑mesh并递归dispose
    for (const b of this.buildings) {
      if (b && b.parent) {
        b.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
          }
        });
        this.scene.remove(b);
      }
    }
    this.buildings = [];
    
    // 清理区块并递归dispose
    for (const [key, chunk] of this.chunks) {
      for (const mesh of chunk.meshes) {
        mesh.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
          }
        });
        this.scene.remove(mesh);
      }
    }
    this.chunks.clear();
    
    // 清理传送门
    this.cityPortals = [];
    this.portalsActivated = false;
    
    console.log('[CityMap] Cleanup complete');
  },
  
  // 获取地图边界
  getMapBounds() {
    return {
      minX: -window.CITY_CONFIG.MAP_SIZE,
      maxX: window.CITY_CONFIG.MAP_SIZE,
      minZ: -window.CITY_CONFIG.MAP_SIZE,
      maxZ: window.CITY_CONFIG.MAP_SIZE
    };
  }
};

// 导出到全局
window.CityMap = CityMap;

// 自动注册到MapManager
if (window.MapManager && typeof MapManager.registerMap === 'function') {
  MapManager.registerMap('city', CityMap);
}
