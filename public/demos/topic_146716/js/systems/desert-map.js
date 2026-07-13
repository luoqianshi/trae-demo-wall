// ============================================================
// 灼热荒漠地图系统 - DesertMap
// ============================================================
// 基于线框图设计：沙漠中的废弃基地，包含前联院、取水点、补给点、联络塔
// 线框图布局（俯视图，X向右，Z向下/南）：
//   基地范围：x∈[-40,40], z∈[-40,40]（80x80）
//   城墙：围绕基地四周，城门在南墙中间
//   取水点（水井）：基地内西北角 (-25, -25)
//   前联院+前园：基地内东北角 (20, -20)
//   居住点（6栋民房）：基地内东南区域 (20~35, 10~30)
//   联络员（前哨站）：基地内西南角 (-25, 25)
//   补给点：基地内中央偏南 (0, 15) 和 (-15, 20)
//   联络塔：基地外左下/西南 (-70, 50)
//   弹药补给：基地外南侧 (-30, 55), (30, 55)

const DESERT_MAP_CONFIG = {
  MAP_SIZE: 350,
  TOWER_HP: 1500,
  DEFENSE_WAVES: 20,
  WANDER_ZOMBIE_COUNT: 10,
  WANDER_SPEED: 2.5,
  WANDER_DETECTION_RANGE: 25,
  SAND_COLOR: 0xC4A352,      // 深沙黄色
  SAND_DARK: 0xA08040,       // 暗沙色
  WALL_COLOR: 0x8B7355,      // 土黄色围墙
  SKY_COLOR: 0xC4945A,       // 昏黄天空
  FOG_COLOR: 0xB88040,       // 沙尘雾色
  FOG_DENSITY: 0.015,        // 沙尘浓度
  BASE_SIZE: 80,             // 基地围墙尺寸
};

const DesertNoise = {
  // 简化FBM噪声
  fbm2D(x, y, octaves, persistence, lacunarity) {
    let total = 0, frequency = 1, amplitude = 1, maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return total / maxValue;
  },
  noise2D(x, y) {
    const n = Math.floor(x) + Math.floor(y) * 57;
    const nn = (n << 13) ^ n;
    return (1.0 - ((nn * (nn * nn * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);
  }
};

const DesertMap = {
  scene: null,
  camera: null,
  active: false,
  phase: 'explore', // explore, power, returnToTower, defend, complete, failed
  wanderZombies: [],
  defenseEnemies: [],
  powerNodes: [],
  defenseWave: 0,
  defenseWaveActive: false,
  towerHP: DESERT_MAP_CONFIG.TOWER_HP,
  towerMaxHP: DESERT_MAP_CONFIG.TOWER_HP,
  minimapMarkers: [],
  radioInteracted: false,
  activatedPowers: 0,
  shakeIntensity: 0,
  shakeTimer: 0,
  terrainData: null,
  terrainMesh: null,
  towerMesh: null,
  radioMesh: null,
  portalMesh: null,

  init(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.active = true;
    this.phase = 'explore';
    this.wanderZombies = [];
    this.defenseEnemies = [];
    this.powerNodes = [];
    this.minimapMarkers = [];
    this.radioInteracted = false;
    this.activatedPowers = 0;
    this.defenseWave = 0;
    this.defenseWaveActive = false;
    this.towerHP = DESERT_MAP_CONFIG.TOWER_HP;
    this.towerMaxHP = DESERT_MAP_CONFIG.TOWER_HP;
    this.shakeIntensity = 0;
    this.shakeTimer = 0;
    this.terrainData = null;
    this.terrainMesh = null;
    this.towerMesh = null;
    this.radioMesh = null;
    this.portalMesh = null;
    this.desertMonsters = [];
    this.monsterParticles = [];
    this.poisonPools = [];

    // 尝试读取保存的沙漠状态
    const slot = window.ShelterSystem ? window.ShelterSystem.getCurrentSlot() : -1;
    if (slot >= 0) {
      try {
        const raw = localStorage.getItem('gameSave_v2_' + slot);
        if (raw) {
          const data = JSON.parse(raw);
          if (data.mapProgress && data.mapProgress.desert) {
            this.phase = data.mapProgress.desert.phase || 'explore';
            this.defenseWave = data.mapProgress.desert.wave || 0;
            if (data.mapProgress.desert.completed) {
              this.phase = 'complete';
            }
          }
        }
      } catch(e) {}
    }
    this.npcs = [];  // Track NPCs for facing player
    this.npcDialogOpen = false;
    // 保留已有的 campManager 数据（捐赠和村民），避免每次进入地图重置
    const existingCampManager = this.npcInteraction && this.npcInteraction.campManager ? this.npcInteraction.campManager : null;
    // 尝试从存档恢复沙漠地图状态
    let savedVillagers = null;
    let savedDesertState = null;
    try {
      const slot = window.ShelterSystem ? window.ShelterSystem.getCurrentSlot() : -1;
      if (slot >= 0) {
        const raw = localStorage.getItem('gameSave_v2_' + slot);
        if (raw) {
          const data = JSON.parse(raw);
          if (data.desertState) {
            savedDesertState = data.desertState;
            if (data.desertState.villagers) savedVillagers = data.desertState.villagers;
          } else if (data.desertVillagers) {
            // 兼容旧存档
            savedVillagers = data.desertVillagers;
          }
        }
      }
    } catch(e) {}
    this.npcInteraction = {
      armsDealer: {
        // 按武器类型定价
        ammoPrices: {
          '手枪': 1,
          '冲锋枪': 2,
          '霰弹枪': 3,
          '狙击枪': 3,
          '手雷': 5
        }
      },
      bountyHunter: {                     // 黄皮：怪物清理任务
        activeQuests: [],                   // 当前接取的任务（最多3个）
        maxActiveQuests: 3,                 // 最多同时接3个任务
        completedCount: 0,                  // 已完成任务总数
        // 任务模板池（接取时随机生成）
        questTemplates: [
          { type: 'scorpion', name: '蝎子猎杀令', desc: '击杀{target}只蝎子' },
          { type: 'sandworm', name: '沙虫清除令', desc: '击杀{target}只沙虫' },
          { type: 'vulture', name: '秃鹫围剿令', desc: '击杀{target}只秃鹫' },
          { type: 'mixed', name: '荒漠清剿令', desc: '击杀{target}只任意沙漠怪物', types: ['scorpion', 'sandworm', 'vulture'] },
        ],
        // 奖励范围（随机）
        rewardRanges: {
          scorpion: { building: [10, 25], parts: [5, 15] },
          sandworm: { building: [30, 60], parts: [20, 40] },
          vulture: { building: [15, 35], parts: [10, 25] },
          mixed: { building: [40, 70], parts: [25, 45] },
        },
        // 目标数量范围（随机）
        targetRanges: {
          scorpion: [5, 15],
          sandworm: [2, 5],
          vulture: [4, 10],
          mixed: [10, 20],
        }
      },
      campManager: existingCampManager || {                       // 红皮：捐赠食物
        totalDonated: savedDesertState ? (savedDesertState.totalDonated || 0) : 0,
        prosperityLevel: savedDesertState ? (savedDesertState.prosperityLevel || 0) : 0,               // 0-5级繁荣度
        thresholds: [500, 1500, 3000, 5000, 8000], // 每级需要的累计食物（×10）
        villagers: savedVillagers || []    // 村民列表（优先从存档恢复）
      }
    };

    // 播放沙漠背景音乐
    this._playDesertBGM();

    console.log('[DesertMap] 初始化完成');
  },

  // 播放沙漠背景音乐
  _playDesertBGM() {
    if (this._desertBGM) return; // 已在播放
    try {
      // 先停止其他地图音乐，避免重叠
      if (window.AudioSystem) {
        AudioSystem.stopBGM();
        AudioSystem.stopBackgroundMusic();
      }
      this._desertBGM = new Audio('assets/music/desert_bg.mp3');
      this._desertBGM.loop = true;
      const masterVol = (window.gameSettings ? window.gameSettings.masterVol : 70) / 100;
      const musicVol = (window.gameSettings ? window.gameSettings.musicVol : 30) / 100;
      this._desertBGM.volume = 0;
      this._desertBGM.play().catch(() => {});
      // 渐入
      let vol = 0;
      const targetVol = 0.25 * masterVol * musicVol;
      const fadeIn = setInterval(() => {
        if (!this._desertBGM) { clearInterval(fadeIn); return; }
        vol = Math.min(targetVol, vol + 0.02);
        this._desertBGM.volume = vol;
        if (vol >= targetVol) clearInterval(fadeIn);
      }, 50);
    } catch(e) {}
  },

  // 停止沙漠背景音乐（渐出）
  _stopDesertBGM() {
    if (this._desertBGM) {
      const audio = this._desertBGM;
      this._desertBGM = null;
      let vol = audio.volume || 0.25;
      const fadeOut = setInterval(() => {
        vol = Math.max(0, vol - 0.03);
        audio.volume = vol;
        if (vol <= 0) {
          try { audio.pause(); audio.currentTime = 0; } catch(e) {}
          clearInterval(fadeOut);
        }
      }, 50);
    }
  },

  generate() {
    // 兼容接口：加载存档时调用
    this.generateTerrain();
  },

  generateTerrain() {
    console.log('[DesertMap] generateTerrain called, scene=', this.scene ? 'valid' : 'null');
    if (!this.scene) {
      console.error('[DesertMap] scene is null!');
      return;
    }
    const S = DESERT_MAP_CONFIG.MAP_SIZE;
    // 沙漠地图：完全平坦的平面
    const geo = new THREE.PlaneGeometry(S * 2, S * 2);
    geo.rotateX(-Math.PI / 2);

    // 沙漠材质 - 深沙黄色
    const sandMat = new THREE.MeshLambertMaterial({
      color: DESERT_MAP_CONFIG.SAND_COLOR
    });
    this.terrainMesh = new THREE.Mesh(geo, sandMat);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.name = 'desertTerrain';
    this.scene.add(this.terrainMesh);

    // 设置沙尘暴效果：昏黄天空 + 浓雾
    if (this.scene.fog) {
      this.scene.fog.color.setHex(DESERT_MAP_CONFIG.FOG_COLOR);
      this.scene.fog.density = DESERT_MAP_CONFIG.FOG_DENSITY;
    } else {
      this.scene.fog = new THREE.FogExp2(DESERT_MAP_CONFIG.FOG_COLOR, DESERT_MAP_CONFIG.FOG_DENSITY);
    }
    // 限制雾的近裁剪面，使近处物体更清晰，远处迅速被雾遮挡（能见度约30-40米）
    if (this.scene.fog.near !== undefined) {
      this.scene.fog.near = 15;
      this.scene.fog.far = 45;
    }
    // 设置背景色为昏黄
    if (window.renderer) {
      window.renderer.setClearColor(DESERT_MAP_CONFIG.SKY_COLOR);
    }

    // 沙漠地图自动触发沙尘暴天气
    if (window.WeatherSystem) {
      WeatherSystem.forceWeather('sandstorm');
    }

    // ===== 城墙和城门（基地外围）=====
    this.createBaseWalls();

    // ===== 基地内建筑（严格按线框图布局）=====
    // 左上：取水点（水井）
    this.createWaterPoint(-25, -25);

    // 右上：前联院建筑
    this.createFrontBuilding(20, -20);

    // 右下：居住点（6栋民房，2行3列）
    this.createResidentialArea();

    // 左下：联络员（前哨站）
    this.createOutpost(-25, 25);

    // 基地内补给点
    this.createSupplyCrate(0, 15);
    this.createSupplyCrate(-15, 20);

    // ===== 基地外建筑 =====
    // 联络塔 - 基地外左下/西南方向
    this.createCommTower(-70, 50);

    // 弹药补给 - 基地外南侧
    this.createSupplyCrate(-30, 55);
    this.createSupplyCrate(30, 55);

    // 沙漠装饰（仙人掌、石头）- 只在基地外生成
    this.createDesertDecorations();

    // 沙尘粒子系统（只在基地外生成）
    this.createSandParticles();

    // NPC - 3个功能NPC
    this.createNPC(-5, 5, 'arms_dealer');      // 绿皮军火商
    this.createNPC(10, -10, 'bounty_hunter');   // 黄皮赏金猎人
    this.createNPC(-10, 15, 'camp_manager');    // 红皮营地管理者

    // 营地篝火（夜间照亮营地）
    this._createCampfire(0, 0);      // 营地中心
    this._createCampfire(-15, -10);   // 西北
    this._createCampfire(15, -10);    // 东北
    this._createCampfire(-15, 15);    // 西南
    this._createCampfire(15, 15);     // 东南
    this._createCampfire(0, -20);     // 北侧

    // 沙漠怪物
    this.spawnDesertMonsters();

    // 恢复已保存的村民（从存档加载时）
    const cm = this.npcInteraction.campManager;
    if (cm.villagers && cm.villagers.length > 0) {
      const savedVillagers = cm.villagers.slice();
      cm.villagers = [];
      this.npcs = this.npcs.filter(n => !n.isVillager);
      for (const sv of savedVillagers) {
        const data = typeof sv === 'object' ? {
          name: sv.name,
          x: sv.x,
          z: sv.z,
          house: sv.house,
          state: sv.state,
          stateTimer: sv.stateTimer,
          targetX: sv.targetX,
          targetZ: sv.targetZ,
          speed: sv.speed,
        } : null;
        if (data && data.name) this._spawnVillager(data);
      }
    }

    // 调试：输出所有碰撞体信息
    this._debugLogColliders();
  },

  // 营地篝火（夜间照亮营地）
  _createCampfire(x, z) {
    const group = new THREE.Group();
    // 火堆底座（石头圈）
    const stoneGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.3, 8);
    const stoneMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    const stones = new THREE.Mesh(stoneGeo, stoneMat);
    stones.position.y = 0.15;
    stones.castShadow = true;
    group.add(stones);
    // 木柴
    for (let i = 0; i < 4; i++) {
      const logGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.0, 6);
      const logMat = new THREE.MeshLambertMaterial({ color: 0x4A3728 });
      const log = new THREE.Mesh(logGeo, logMat);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = (i / 4) * Math.PI;
      log.position.y = 0.35;
      group.add(log);
    }
    // 火焰光源（PointLight）
    const fireLight = new THREE.PointLight(0xff6600, 0, 18, 1.5);
    fireLight.position.y = 1.0;
    group.add(fireLight);

    // ====== 3D 粒子火焰系统 ======
    // 1. 核心火焰锥体（多个旋转的半透明锥体模拟火苗主体）
    const flameCones = [];
    const coneCount = 8;
    for (let i = 0; i < coneCount; i++) {
      const h = 1.2 + Math.random() * 1.0;
      const coneGeo = new THREE.ConeGeometry(0.25 + Math.random() * 0.25, h, 6);
      const hue = 0.05 + Math.random() * 0.08;
      const coneMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.3),
        transparent: true,
        opacity: 0.4 + Math.random() * 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(
        (Math.random() - 0.5) * 0.5,
        0.4 + Math.random() * 0.3,
        (Math.random() - 0.5) * 0.5
      );
      cone.rotation.x = (Math.random() - 0.5) * 0.3;
      cone.rotation.z = (Math.random() - 0.5) * 0.3;
      group.add(cone);
      flameCones.push({
        mesh: cone,
        baseH: h,
        baseY: cone.position.y,
        baseOp: coneMat.opacity,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2,
      });
    }

    // 2. 火焰粒子（小方块组成的粒子云）
    const particleCount = 50;
    const pGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const fireParticles = [];
    for (let i = 0; i < particleCount; i++) {
      const pMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 1, 0.4 + Math.random() * 0.4),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const p = new THREE.Mesh(pGeo, pMat);
      p.visible = false;
      group.add(p);
      fireParticles.push({
        mesh: p,
        life: 0,
        maxLife: 0.3 + Math.random() * 0.8,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0.8 + Math.random() * 2.0,
        vz: (Math.random() - 0.5) * 0.5,
        active: false,
        timer: Math.random() * 0.5,
        baseScale: 0.8 + Math.random() * 1.5,
      });
    }

    // 3. 火星粒子（向上飘散的小亮点）
    const emberCount = 16;
    const embers = [];
    const emberGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    for (let i = 0; i < emberCount; i++) {
      const eMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.08, 1, 0.6 + Math.random() * 0.4),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const e = new THREE.Mesh(emberGeo, eMat);
      e.visible = false;
      group.add(e);
      embers.push({
        mesh: e,
        life: 0,
        maxLife: 0.8 + Math.random() * 2,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 1.5 + Math.random() * 3.0,
        vz: (Math.random() - 0.5) * 0.8,
        active: false,
        timer: Math.random() * 2,
        baseScale: 0.5 + Math.random() * 1.0,
      });
    }

    // 4. 烟雾粒子（灰色半透明方块向上飘散）
    const smokeCount = 10;
    const smokes = [];
    const smokeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    for (let i = 0; i < smokeCount; i++) {
      const sMat = new THREE.MeshBasicMaterial({
        color: 0x555555,
        transparent: true,
        opacity: 0,
        blending: THREE.NormalBlending,
        depthWrite: false,
      });
      const s = new THREE.Mesh(smokeGeo, sMat);
      s.visible = false;
      group.add(s);
      smokes.push({
        mesh: s,
        life: 0,
        maxLife: 1.5 + Math.random() * 2,
        vx: (Math.random() - 0.5) * 0.3,
        vy: 0.8 + Math.random() * 0.8,
        vz: (Math.random() - 0.5) * 0.3,
        active: false,
        timer: Math.random() * 3,
        baseScale: 0.8 + Math.random() * 2.0,
      });
    }

    group.position.set(x, 0, z);
    group.name = 'campfire';
    this.scene.add(group);
    this.campfires = this.campfires || [];
    this.campfires.push({
      group, light: fireLight,
      flameCones, fireParticles, embers, smokes,
      baseIntensity: 3, currentIntensity: 0,
    });
  },

  createSandParticles() {
    const particleCount = 200;
    const mapSize = DESERT_MAP_CONFIG.MAP_SIZE;
    const rng = (seed) => {
      let s = seed;
      return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
    };
    const rand = rng(77);

    // 使用简单的 BoxGeometry 作为沙尘粒子
    const particleGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0xD4B06A,
      transparent: true,
      opacity: 0.6
    });

    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const mesh = new THREE.Mesh(particleGeo, particleMat);
      // 只在基地外生成（|x| > 45 或 |z| > 45）
      let px, pz;
      do {
        px = (rand() - 0.5) * mapSize * 1.6;
        pz = (rand() - 0.5) * mapSize * 1.6;
      } while (Math.abs(px) <= 45 && Math.abs(pz) <= 45);

      const py = 0.5 + rand() * 8; // 高度 0.5 ~ 8.5
      mesh.position.set(px, py, pz);
      mesh.name = 'sandParticle';
      this.scene.add(mesh);

      particles.push({
        mesh: mesh,
        vx: (rand() - 0.5) * 2,   // 水平漂移速度
        vz: (rand() - 0.5) * 2,
        vy: (rand() - 0.5) * 0.3, // 垂直轻微浮动
        baseY: py,
        phase: rand() * Math.PI * 2
      });
    }

    this.sandParticles = particles;
  },

  updateSandParticles(dt) {
    if (!this.sandParticles || this.sandParticles.length === 0) return;
    const windX = 1.5; // 风向：X轴正方向
    const windZ = 0.5;
    const mapSize = DESERT_MAP_CONFIG.MAP_SIZE;

    for (const p of this.sandParticles) {
      if (!p.mesh) continue;
      // 随风漂移
      p.mesh.position.x += (p.vx + windX) * dt;
      p.mesh.position.z += (p.vz + windZ) * dt;
      // 垂直轻微浮动（正弦波动）
      p.phase += dt * 0.5;
      p.mesh.position.y = p.baseY + Math.sin(p.phase) * 0.3;

      // 边界循环：超出地图范围后从另一侧重新进入
      const halfMap = mapSize * 0.8;
      if (p.mesh.position.x > halfMap) p.mesh.position.x = -halfMap;
      if (p.mesh.position.x < -halfMap) p.mesh.position.x = halfMap;
      if (p.mesh.position.z > halfMap) p.mesh.position.z = -halfMap;
      if (p.mesh.position.z < -halfMap) p.mesh.position.z = halfMap;

      // 确保粒子始终保持在基地外
      if (Math.abs(p.mesh.position.x) <= 45 && Math.abs(p.mesh.position.z) <= 45) {
        // 如果飘入基地内部，将其移到基地外
        if (Math.abs(p.mesh.position.x) > Math.abs(p.mesh.position.z)) {
          p.mesh.position.x = p.mesh.position.x > 0 ? 46 : -46;
        } else {
          p.mesh.position.z = p.mesh.position.z > 0 ? 46 : -46;
        }
      }
    }
  },

  // 调试：输出所有碰撞体位置
  _debugLogColliders() {
    setTimeout(() => {
      if (typeof window.colliders !== 'undefined') {
        console.log('[DesertMap] ===== 碰撞体调试信息 =====');
        console.log('[DesertMap] 总碰撞体数量:', window.colliders.length);
        window.colliders.forEach((c, i) => {
          console.log(`[DesertMap] 碰撞体#${i}: type=${c.type}, x=${c.x.toFixed(1)}, z=${c.z.toFixed(1)}, hw=${c.hw.toFixed(1)}, hd=${c.hd.toFixed(1)}, topY=${c.topY}`);
        });
        console.log('[DesertMap] ===== 碰撞体调试结束 =====');
      }
    }, 1000);
  },

  // ====== 城墙系统 ======
  // 基地围墙：围绕80x80基地，城门在南墙中间
  // 所有城墙直接在世界坐标生成，不使用Group旋转
  createBaseWalls() {
    const size = DESERT_MAP_CONFIG.BASE_SIZE; // 80
    const half = size / 2; // 40
    const gateWidth = 10; // 大门宽度
    const wallThick = 3;  // 城墙厚度

    // --- 北墙（沿X轴，从(-40,-40)到(40,-40)，深度向南(z+方向)3米）---
    this.createWallAxis(-40, -40, 40, -40, wallThick, 'south');

    // --- 南墙左段（沿X轴，从(-40,37)到(-5,37)，深度向北(z-方向)3米）---
    const southSideLen = (size - gateWidth) / 2; // 35
    this.createWallAxis(-40, 40, -40 + southSideLen, 40, wallThick, 'north');
    // --- 南墙右段（沿X轴，从(5,37)到(40,37)，深度向北(z-方向)3米）---
    this.createWallAxis(40 - southSideLen, 40, 40, 40, wallThick, 'north');

    // --- 西墙（沿Z轴，从(-40,-40)到(-40,40)，深度向东(x+方向)3米）---
    this.createWallAxis(-40, -40, -40, 40, wallThick, 'east');

    // --- 东墙（沿Z轴，从(37,-40)到(37,40)，深度向西(x-方向)3米）---
    this.createWallAxis(40 - wallThick, -40, 40 - wallThick, 40, wallThick, 'west');

    // --- 城门楼（南墙中间，门洞上方）---
    // 城门楼模型宽10，深8，大门在中间
    // 放在南墙门洞位置：x=0（居中），z=40-8=32（城门楼背面与城墙对齐）
    this.createGateTower(0, 32, 0);
  },

  createCommTower(x, z) {
    const group = new THREE.Group();

    // 塔身
    const towerMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
    const tower = new THREE.Mesh(new THREE.BoxGeometry(3, 15, 3), towerMat);
    tower.position.y = 7.5;
    tower.castShadow = true;
    group.add(tower);

    // 天线
    const antennaMat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5), antennaMat);
    antenna.position.y = 17.5;
    group.add(antenna);

    // 顶部平台
    const platform = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 5), towerMat);
    platform.position.y = 15;
    group.add(platform);

    // 信号灯光
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.3), lightMat);
    light.position.y = 20;
    light.name = 'towerLight';
    group.add(light);

    // 血条背景
    const hpBg = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 0.6),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    hpBg.position.y = 18;
    hpBg.name = 'towerHPBg';
    group.add(hpBg);

    // 血条填充
    const hpFill = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 0.6),
      new THREE.MeshBasicMaterial({ color: 0x44ff44 })
    );
    hpFill.position.set(0, 18, 0.01);
    hpFill.name = 'towerHPFill';
    group.add(hpFill);

    group.position.set(x, 0, z);
    group.name = 'contactTower';
    this.towerMesh = group;
    this.scene.add(group);
    // 联络塔碰撞体
    if (typeof window.addCollider === 'function') {
      window.addCollider(x, z, 2, 2, 15, 'tower', true);
    }
  },

  createWaterPoint(x, z) {
    const group = new THREE.Group();
    const blocks = [
      // 圆形井台（八边形近似）
      { x: 0.5, y: 0, z: 0, w: 1.5, h: 0.3, d: 2, color: 0xB8A888 },
      { x: 0, y: 0, z: 0.5, w: 2, h: 0.3, d: 1.5, color: 0xB8A888 },
      { x: 0.2, y: 0, z: 0.2, w: 1.6, h: 0.3, d: 1.6, color: 0xA09070 },
      // 井沿凸起
      { x: -0.1, y: 0.3, z: -0.1, w: 2.2, h: 0.2, d: 2.2, color: 0xC2B280 },
      { x: 0, y: 0.5, z: 0, w: 2, h: 0.15, d: 2, color: 0xD4C09E },
      // 井口内凹
      { x: 0.3, y: 0.3, z: 0.3, w: 1.4, h: 0.5, d: 1.4, color: 0x4A4A4A },
      // 水面
      { x: 0.4, y: 0.5, z: 0.4, w: 1.2, h: 0.08, d: 1.2, color: 0x4488BB },
      { x: 0.5, y: 0.52, z: 0.5, w: 1, h: 0.05, d: 1, color: 0x55AACC },
      // 木质支架（A字形）
      { x: -0.4, y: 0.65, z: 0.8, w: 0.25, h: 2.8, d: 0.25, color: 0x6B4226 },
      { x: 2.15, y: 0.65, z: 0.8, w: 0.25, h: 2.8, d: 0.25, color: 0x6B4226 },
      { x: -0.4, y: 3.3, z: 0.8, w: 2.8, h: 0.2, d: 0.2, color: 0x5C4033 },
      // 斜撑
      { x: -0.3, y: 2, z: 0.8, w: 0.15, h: 1.8, d: 0.15, color: 0x6B4226 },
      { x: 2.05, y: 2, z: 0.8, w: 0.15, h: 1.8, d: 0.15, color: 0x6B4226 },
      // 辘轳
      { x: 0.9, y: 3.1, z: 0.75, w: 0.5, h: 0.5, d: 0.3, color: 0x8B7355 },
      { x: 0.95, y: 3.15, z: 0.9, w: 0.4, h: 0.4, d: 0.15, color: 0xA08060 },
      // 摇柄
      { x: 1.3, y: 3.2, z: 0.85, w: 0.4, h: 0.08, d: 0.08, color: 0x6B4226 },
      { x: 1.65, y: 3.1, z: 0.85, w: 0.08, h: 0.3, d: 0.08, color: 0x6B4226 },
      // 水桶
      { x: 0.85, y: 1.8, z: 0.85, w: 0.35, h: 0.45, d: 0.35, color: 0x6B4226 },
      { x: 0.9, y: 1.75, z: 0.9, w: 0.25, h: 0.05, d: 0.25, color: 0x5C4033 },
      // 绳子
      { x: 1.05, y: 2.25, z: 0.95, w: 0.05, h: 0.8, d: 0.05, color: 0x8B7355 },
      // 石阶
      { x: 2.1, y: 0, z: 0.5, w: 0.6, h: 0.15, d: 1, color: 0x9E8B6B },
      { x: -0.7, y: 0, z: 0.5, w: 0.6, h: 0.15, d: 1, color: 0x9E8B6B }
    ];
    blocks.forEach(b => {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mat = new THREE.MeshLambertMaterial({ color: b.color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x + b.w/2, b.y + b.h/2, b.z + b.d/2);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });
    group.position.set(x, 0, z);
    group.name = 'waterPoint';
    this.scene.add(group);
    // 碰撞体：井台范围
    if (typeof window.addCollider === 'function') {
      window.addCollider(x + 1, z + 1, 1.5, 1.5, 3.5, 'well', true);
    }
  },

  createNPC(x, z, type) {
    const group = new THREE.Group();
    let blocks, skinColor, clothColor, name, emoji;
    
    switch(type) {
      case 'arms_dealer': // 绿皮军火商
        skinColor = 0x4CAF50; clothColor = 0x2E7D32; name = '军火商·老赵'; emoji = '🔫';
        blocks = [
          { x:0.3,y:0,z:0.3,w:1.4,h:1.6,d:1.4,color:clothColor},
          { x:0.4,y:0.1,z:0.4,w:1.2,h:1.4,d:1.2,color:0x388E3C},
          { x:0.25,y:0.9,z:0.25,w:1.5,h:0.15,d:1.5,color:0x1B5E20},
          { x:0.5,y:1.6,z:0.5,w:1,h:1,d:1,color:skinColor},
          { x:0.4,y:2.0,z:0.4,w:1.2,h:0.4,d:1.2,color:0x2E7D32},
          { x:0.6,y:1.7,z:1.45,w:0.8,h:0.5,d:0.05,color:skinColor},
          { x:0.73,y:1.84,z:1.50,w:0.18,h:0.15,d:0.05,color:0x1a1a1a,isFace:true},
          { x:1.09,y:1.84,z:1.50,w:0.18,h:0.15,d:0.05,color:0x1a1a1a,isFace:true},
          { x:0.85,y:1.54,z:1.50,w:0.30,h:0.15,d:0.05,color:0x0d3d0d,isFace:true},
          { x:-0.1,y:0.8,z:0.5,w:0.4,h:0.8,d:0.4,color:skinColor},
          { x:1.7,y:0.8,z:0.5,w:0.4,h:0.8,d:0.4,color:skinColor},
          { x:-0.15,y:1.1,z:0.45,w:0.5,h:0.5,d:0.5,color:clothColor},
          { x:1.65,y:1.1,z:0.45,w:0.5,h:0.5,d:0.5,color:clothColor},
          // 背包（弹药箱）
          { x:0.4,y:0.8,z:-0.4,w:1.2,h:0.8,d:0.4,color:0x5D4037},
          { x:0.5,y:0.9,z:-0.45,w:1,h:0.6,d:0.3,color:0x795548},
          { x:0.8,y:1.55,z:-0.15,w:0.4,h:0.1,d:0.1,color:0xFFC107},
          { x:0.1,y:0,z:0.1,w:1.8,h:0.05,d:1.8,color:0x2A2A2A}
        ];
        break;
      case 'bounty_hunter': // 黄皮赏金猎人（拿棍）
        skinColor = 0xFFC107; clothColor = 0xF57F17; name = '赏金猎人·阿狼'; emoji = '⚔️';
        blocks = [
          { x:0.3,y:0,z:0.3,w:1.4,h:1.7,d:1.4,color:clothColor},
          { x:0.4,y:0.1,z:0.4,w:1.2,h:1.5,d:1.2,color:0xFFA000},
          { x:0.25,y:0.9,z:0.25,w:1.5,h:0.15,d:1.5,color:0xE65100},
          { x:0.5,y:1.6,z:0.5,w:1,h:1,d:1,color:skinColor},
          { x:0.4,y:2.0,z:0.4,w:1.2,h:0.4,d:1.2,color:0xF57F17},
          { x:0.6,y:1.7,z:1.45,w:0.8,h:0.5,d:0.05,color:skinColor},
          { x:0.73,y:1.84,z:1.50,w:0.18,h:0.15,d:0.05,color:0x1a1a1a,isFace:true},
          { x:1.09,y:1.84,z:1.50,w:0.18,h:0.15,d:0.05,color:0x1a1a1a,isFace:true},
          { x:0.85,y:1.54,z:1.50,w:0.30,h:0.15,d:0.05,color:0x7a5a00,isFace:true},
          { x:-0.1,y:0.8,z:0.5,w:0.4,h:0.8,d:0.4,color:skinColor},
          { x:1.7,y:0.8,z:0.5,w:0.4,h:0.8,d:0.4,color:skinColor},
          { x:-0.15,y:1.1,z:0.45,w:0.5,h:0.5,d:0.5,color:clothColor},
          { x:1.65,y:1.1,z:0.45,w:0.5,h:0.5,d:0.5,color:clothColor},
          // 铁棍
          { x:1.6,y:0.5,z:0.5,w:0.08,h:2.5,d:0.08,color:0x9E9E9E},
          { x:1.6,y:1.8,z:0.5,w:0.15,h:0.15,d:0.15,color:0x757575},
          // 腰带
          { x:0.4,y:0.85,z:0.4,w:1.3,h:0.12,d:1.3,color:0x5D4037},
          { x:0.1,y:0,z:0.1,w:1.8,h:0.05,d:1.8,color:0x2A2A2A}
        ];
        break;
      case 'camp_manager': // 红皮营地管理者
        skinColor = 0xF44336; clothColor = 0xC62828; name = '营地长·红姐'; emoji = '🏠';
        blocks = [
          { x:0.3,y:0,z:0.3,w:1.5,h:1.6,d:1.5,color:clothColor},
          { x:0.4,y:0.1,z:0.4,w:1.3,h:1.4,d:1.3,color:0xD32F2F},
          { x:0.25,y:0.9,z:0.25,w:1.6,h:0.15,d:1.6,color:0xB71C1C},
          { x:0.5,y:1.6,z:0.5,w:1,h:1,d:1,color:skinColor},
          { x:0.4,y:2.1,z:0.4,w:1.3,h:0.5,d:1.3,color:0xC62828},
          { x:0.6,y:1.7,z:1.5,w:0.8,h:0.5,d:0.05,color:skinColor},
          { x:0.73,y:1.84,z:1.55,w:0.18,h:0.15,d:0.05,color:0x1a1a1a,isFace:true},
          { x:1.09,y:1.84,z:1.55,w:0.18,h:0.15,d:0.05,color:0x1a1a1a,isFace:true},
          { x:0.85,y:1.54,z:1.55,w:0.30,h:0.15,d:0.05,color:0x7a0000,isFace:true},
          { x:-0.1,y:0.8,z:0.5,w:0.4,h:0.8,d:0.4,color:skinColor},
          { x:1.7,y:0.8,z:0.5,w:0.4,h:0.8,d:0.4,color:skinColor},
          { x:-0.15,y:1.1,z:0.45,w:0.5,h:0.5,d:0.5,color:clothColor},
          { x:1.65,y:1.1,z:0.45,w:0.5,h:0.5,d:0.5,color:clothColor},
          // 围裙
          { x:0.4,y:0.5,z:0.85,w:1.3,h:0.8,d:0.15,color:0xEF9A9A},
          { x:0.5,y:0.3,z:0.9,w:0.3,h:0.3,d:0.05,color:0xFFCDD2},
          { x:1.3,y:0.3,z:0.9,w:0.3,h:0.3,d:0.05,color:0xFFCDD2},
          { x:0.1,y:0,z:0.1,w:1.8,h:0.05,d:1.8,color:0x2A2A2A}
        ];
        break;
      default:
        // 保留原有的 guide/merchant 逻辑作为后备
        const isGuide = type === 'guide';
        blocks = isGuide ? [
          // 向导：长袍、头巾、法杖
          { x: 0.3, y: 0, z: 0.3, w: 1.4, h: 1.6, d: 1.4, color: 0x8B6914 },
          { x: 0.4, y: 0.1, z: 0.4, w: 1.2, h: 1.4, d: 1.2, color: 0xA07828 },
          { x: 0.25, y: 0.9, z: 0.25, w: 1.5, h: 0.15, d: 1.5, color: 0x6B4226 },
          { x: 0.5, y: 1.6, z: 0.5, w: 1, h: 1, d: 1, color: 0xD4A574 },
          { x: 0.4, y: 2.0, z: 0.4, w: 1.2, h: 0.4, d: 1.2, color: 0xC2B280 },
          { x: 0.6, y: 1.7, z: 1.45, w: 0.8, h: 0.5, d: 0.05, color: 0xD4A574 },
          { x: 0.72, y: 1.84, z: 1.50, w: 0.20, h: 0.15, d: 0.05, color: 0x2C1810, isFace: true },
          { x: 1.08, y: 1.84, z: 1.50, w: 0.20, h: 0.15, d: 0.05, color: 0x2C1810, isFace: true },
          { x: 0.80, y: 1.54, z: 1.50, w: 0.40, h: 0.15, d: 0.05, color: 0x4A3728, isFace: true },
          { x: -0.1, y: 0.8, z: 0.5, w: 0.4, h: 0.9, d: 0.4, color: 0xD4A574 },
          { x: 1.7, y: 0.8, z: 0.5, w: 0.4, h: 0.9, d: 0.4, color: 0xD4A574 },
          { x: -0.15, y: 1.1, z: 0.45, w: 0.5, h: 0.5, d: 0.5, color: 0xA07828 },
          { x: 1.65, y: 1.1, z: 0.45, w: 0.5, h: 0.5, d: 0.5, color: 0xA07828 },
          { x: 1.8, y: 0, z: 0.6, w: 0.1, h: 3.2, d: 0.1, color: 0x6B4226 },
          { x: 1.75, y: 3.1, z: 0.55, w: 0.2, h: 0.2, d: 0.2, color: 0x4488BB },
          { x: 1.78, y: 3.15, z: 0.58, w: 0.14, h: 0.14, d: 0.14, color: 0x55AACC },
          { x: 0.1, y: 0, z: 0.1, w: 1.8, h: 0.05, d: 1.8, color: 0x2A2A2A }
        ] : [
          // 商人：外套、帽子、围裙、货物袋
          { x: 0.2, y: 0, z: 0.2, w: 1.6, h: 1.5, d: 1.6, color: 0x4A6741 },
          { x: 0.3, y: 0.1, z: 0.3, w: 1.4, h: 1.3, d: 1.4, color: 0x5A7751 },
          { x: 0.25, y: 0, z: 0.85, w: 1.5, h: 1.2, d: 0.15, color: 0x8B4513 },
          { x: 0.35, y: 0.5, z: 0.9, w: 1.3, h: 0.6, d: 0.05, color: 0xA0522D },
          { x: 0.4, y: 0.3, z: 0.95, w: 0.3, h: 0.3, d: 0.05, color: 0x6B3E1F },
          { x: 1.3, y: 0.3, z: 0.95, w: 0.3, h: 0.3, d: 0.05, color: 0x6B3E1F },
          { x: 0.5, y: 1.5, z: 0.5, w: 1, h: 1, d: 1, color: 0xD4A574 },
          { x: 0.3, y: 2.2, z: 0.3, w: 1.4, h: 0.2, d: 1.4, color: 0x4A3728 },
          { x: 0.4, y: 2.0, z: 0.4, w: 1.2, h: 0.3, d: 1.2, color: 0x5C4033 },
          { x: 0.1, y: 2.15, z: 0.1, w: 1.8, h: 0.1, d: 1.8, color: 0x3D2B1F },
          { x: 0.6, y: 1.6, z: 1.45, w: 0.8, h: 0.5, d: 0.05, color: 0xD4A574 },
          { x: 0.73, y: 1.74, z: 1.50, w: 0.18, h: 0.15, d: 0.05, color: 0x2C1810, isFace: true },
          { x: 1.09, y: 1.74, z: 1.50, w: 0.18, h: 0.15, d: 0.05, color: 0x2C1810, isFace: true },
          { x: 0.85, y: 1.54, z: 1.50, w: 0.30, h: 0.15, d: 0.05, color: 0x4A3728, isFace: true },
          { x: -0.1, y: 0.7, z: 0.5, w: 0.4, h: 0.8, d: 0.4, color: 0xD4A574 },
          { x: 1.7, y: 0.7, z: 0.5, w: 0.4, h: 0.8, d: 0.4, color: 0xD4A574 },
          { x: -0.15, y: 1.0, z: 0.45, w: 0.5, h: 0.5, d: 0.5, color: 0x4A6741 },
          { x: 1.65, y: 1.0, z: 0.45, w: 0.5, h: 0.5, d: 0.5, color: 0x4A6741 },
          { x: 0.4, y: 0.8, z: -0.3, w: 1.2, h: 0.8, d: 0.4, color: 0x8B7355 },
          { x: 0.5, y: 0.9, z: -0.35, w: 1, h: 0.6, d: 0.3, color: 0xA09070 },
          { x: 0.8, y: 1.55, z: -0.15, w: 0.4, h: 0.1, d: 0.1, color: 0x6B4226 },
          { x: 0.1, y: 0, z: 0.1, w: 1.8, h: 0.05, d: 1.8, color: 0x2A2A2A }
        ];
        skinColor = isGuide ? 0x8B6914 : 0x4A6741;
        clothColor = isGuide ? 0x6B4226 : 0x4A3728;
        name = isGuide ? '向导' : '商人';
        emoji = isGuide ? '🧭' : '💰';
    }
    
    // 创建方块模型
    blocks.forEach(b => {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mat = new THREE.MeshLambertMaterial({ color: b.color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x + b.w/2, b.y + b.h/2, b.z + b.d/2);
      mesh.castShadow = true;
      group.add(mesh);
    });
    group.position.set(x, 0, z);
    group.name = 'npc_' + type;
    this.scene.add(group);

    // 创建NPC头顶名字标签
    const nameLabel = this._createNPCLabel(name, type);
    nameLabel.position.set(0, 2.8, 0);
    group.add(nameLabel);

    this.npcs.push({ mesh: group, type: type, name: name, emoji: emoji, x: x, z: z });
    if (typeof window.addCollider === 'function') {
      window.addCollider(x + 1, z + 1, 1.2, 1.2, 2.5, 'npc', true);
    }
    return group;
  },

  _createNPCLabel(text, type) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;

    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.roundRect(0, 0, 256, 64, 8);
    ctx.fill();

    // 边框颜色根据类型
    const borderColors = {
      arms_dealer: '#4CAF50',
      bounty_hunter: '#FFC107',
      camp_manager: '#F44336',
      villager: '#8B6914'
    };
    ctx.strokeStyle = borderColors[type] || '#8B6914';
    ctx.lineWidth = 2;
    ctx.roundRect(0, 0, 256, 64, 8);
    ctx.stroke();

    // 文字
    ctx.fillStyle = '#eecc88';
    ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(3, 0.75, 1);
    return sprite;
  },

  createSupplyPoints() {
    // 基地外弹药补给（南侧）
    this.createSupplyCrate(-20, 50);
  },

  createSupplyCrate(x, z) {
    const supplyMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 1.5), supplyMat);
    box.position.set(x, 0.75, z);
    box.name = 'supplyBox';
    this.scene.add(box);
    if (typeof window.addCollider === 'function') {
      window.addCollider(x, z, 1, 0.75, 1.5, 'supply', true);
    }
  },

  createFrontBuilding(x, z) {
    const buildingMat = new THREE.MeshLambertMaterial({ color: 0x9E8B6B });

    // 主建筑
    const main = new THREE.Mesh(new THREE.BoxGeometry(20, 6, 12), buildingMat);
    main.position.set(x, 3, z);
    main.castShadow = true;
    main.name = 'frontBuilding';
    this.scene.add(main);
    // 建筑碰撞体（精确匹配建筑尺寸）
    if (typeof window.addCollider === 'function') {
      window.addCollider(x, z, 10, 6, 6, 'building', true);
    }

    // 屋顶
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x7A6A4F });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(14, 4, 4), roofMat);
    roof.position.set(x, 8, z);
    roof.rotation.y = Math.PI / 4;
    this.scene.add(roof);
  },

  createDesertDecorations() {
    const baseSize = DESERT_MAP_CONFIG.BASE_SIZE;
    const mapSize = DESERT_MAP_CONFIG.MAP_SIZE;
    const rng = (seed) => {
      let s = seed;
      return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
    };
    const rand = rng(42);

    // 仙人掌（只在基地外生成，|x|>50 或 |z|>50）
    const cactusMat = new THREE.MeshLambertMaterial({ color: 0x2D5A27 });
    const cactusCount = 80;
    for (let i = 0; i < cactusCount; i++) {
      const cx = (rand() - 0.5) * mapSize * 1.8;
      const cz = (rand() - 0.5) * mapSize * 1.8;
      // 避免基地内部（基地围墙区域：x从-50到50，z从-50到50）
      if (cx > -50 && cx < 50 && cz > -50 && cz < 50) continue;

      const group = new THREE.Group();
      const scale = 0.7 + rand() * 0.6; // 随机缩放 0.7 ~ 1.3
      const height = (1.5 + rand() * 3) * scale;
      // 主干
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, height, 6), cactusMat);
      trunk.position.y = height / 2;
      trunk.castShadow = true;
      group.add(trunk);
      // 随机分支
      if (rand() > 0.4) {
        const branchH = height * 0.5;
        const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.18 * scale, branchH, 6), cactusMat);
        branch.position.set(0.4 * scale, height * 0.6, 0);
        branch.rotation.z = -Math.PI / 4;
        branch.castShadow = true;
        group.add(branch);
      }
      if (rand() > 0.5) {
        const branchH = height * 0.4;
        const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * scale, 0.15 * scale, branchH, 6), cactusMat);
        branch.position.set(-0.35 * scale, height * 0.45, 0);
        branch.rotation.z = Math.PI / 4;
        branch.castShadow = true;
        group.add(branch);
      }
      group.position.set(cx, 0, cz);
      group.name = 'desertCactus';
      this.scene.add(group);
      // 碰撞体
      if (typeof window.addCollider === 'function') {
        window.addCollider(cx, cz, 0.4 * scale, 0.4 * scale, height, 'cactus', true);
      }
    }

    // 黄色石头（只在基地外生成，|x|>50 或 |z|>50）
    const rockColors = [0xC4A352, 0xB89040, 0xD4B06A, 0xA08030];
    const rockCount = 120;
    for (let i = 0; i < rockCount; i++) {
      const rx = (rand() - 0.5) * mapSize * 1.8;
      const rz = (rand() - 0.5) * mapSize * 1.8;
      // 避免基地内部
      if (rx > -50 && rx < 50 && rz > -50 && rz < 50) continue;

      const color = rockColors[Math.floor(rand() * rockColors.length)];
      const rockMat = new THREE.MeshLambertMaterial({ color });
      const scale = 0.7 + rand() * 0.6; // 随机缩放 0.7 ~ 1.3
      const sx = (0.5 + rand() * 2) * scale;
      const sy = (0.3 + rand() * 1.2) * scale;
      const sz = (0.5 + rand() * 2) * scale;
      const rock = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), rockMat);
      rock.position.set(rx, sy / 2, rz);
      rock.rotation.y = rand() * Math.PI;
      rock.castShadow = true;
      rock.receiveShadow = true;
      rock.name = 'desertRock';
      this.scene.add(rock);
      // 碰撞体
      if (typeof window.addCollider === 'function') {
        window.addCollider(rx, rz, sx / 2, sz / 2, sy, 'rock', true);
      }
    }
  },

  createSandParticles() {
    const particleCount = 200;
    const mapSize = DESERT_MAP_CONFIG.MAP_SIZE;
    const rng = (seed) => {
      let s = seed;
      return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
    };
    const rand = rng(77);

    // 使用简单的 BoxGeometry 作为沙尘粒子
    const particleGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0xD4B06A,
      transparent: true,
      opacity: 0.6
    });

    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const mesh = new THREE.Mesh(particleGeo, particleMat);
      // 只在基地外生成（|x| > 45 或 |z| > 45）
      let px, pz;
      do {
        px = (rand() - 0.5) * mapSize * 1.6;
        pz = (rand() - 0.5) * mapSize * 1.6;
      } while (Math.abs(px) <= 45 && Math.abs(pz) <= 45);

      const py = 0.5 + rand() * 8; // 高度 0.5 ~ 8.5
      mesh.position.set(px, py, pz);
      mesh.name = 'sandParticle';
      this.scene.add(mesh);

      particles.push({
        mesh: mesh,
        vx: (rand() - 0.5) * 2,   // 水平漂移速度
        vz: (rand() - 0.5) * 2,
        vy: (rand() - 0.5) * 0.3, // 垂直轻微浮动
        baseY: py,
        phase: rand() * Math.PI * 2
      });
    }

    this.sandParticles = particles;
  },

  updateSandParticles(dt) {
    if (!this.sandParticles || this.sandParticles.length === 0) return;
    const windX = 1.5; // 风向：X轴正方向
    const windZ = 0.5;
    const mapSize = DESERT_MAP_CONFIG.MAP_SIZE;

    for (const p of this.sandParticles) {
      // 随风漂移
      p.mesh.position.x += (p.vx + windX) * dt;
      p.mesh.position.z += (p.vz + windZ) * dt;
      // 垂直轻微浮动（正弦波动）
      p.phase += dt * 0.5;
      p.mesh.position.y = p.baseY + Math.sin(p.phase) * 0.3;

      // 边界循环：超出地图范围后从另一侧重新进入
      const halfMap = mapSize * 0.8;
      if (p.mesh.position.x > halfMap) p.mesh.position.x = -halfMap;
      if (p.mesh.position.x < -halfMap) p.mesh.position.x = halfMap;
      if (p.mesh.position.z > halfMap) p.mesh.position.z = -halfMap;
      if (p.mesh.position.z < -halfMap) p.mesh.position.z = halfMap;

      // 确保粒子始终保持在基地外
      if (Math.abs(p.mesh.position.x) <= 45 && Math.abs(p.mesh.position.z) <= 45) {
        // 如果飘入基地内部，将其移到基地外
        if (Math.abs(p.mesh.position.x) > Math.abs(p.mesh.position.z)) {
          p.mesh.position.x = p.mesh.position.x > 0 ? 46 : -46;
        } else {
          p.mesh.position.z = p.mesh.position.z > 0 ? 46 : -46;
        }
      }
    }
  },

  getTerrainHeight(x, z) {
    return 0; // 沙漠地图完全平坦
  },

  // ====== 沙漠怪物系统 ======
  // 别名函数，兼容 game.js 中的调用
  spawnWanderZombies() {
    return this.spawnDesertMonsters();
  },

  spawnDesertMonsters() {
    if (!this.scene) return;
    this.desertMonsters = [];
    this.monsterParticles = [];

    const monsterTypes = [
      { type: 'scorpion', countMin: 5, countMax: 8, createModel: () => MonsterBones.createScorpion() },
      { type: 'sandworm', countMin: 5, countMax: 8, createModel: () => MonsterBones.createSandworm() },
      { type: 'vulture', countMin: 5, countMax: 8, createModel: () => MonsterBones.createVulture() },
    ];

    const rng = (seed) => {
      let s = seed;
      return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
    };
    const rand = rng(12345);

    for (const mt of monsterTypes) {
      const count = mt.countMin + Math.floor(rand() * (mt.countMax - mt.countMin + 1));
      for (let i = 0; i < count; i++) {
        // 在基地围墙外生成（|x| > 50 或 |z| > 50）
        let px, pz;
        let attempts = 0;
        do {
          const angle = rand() * Math.PI * 2;
          const dist = 55 + rand() * 120; // 距离中心 55~175
          px = Math.cos(angle) * dist;
          pz = Math.sin(angle) * dist;
          attempts++;
        } while ((Math.abs(px) <= 50 && Math.abs(pz) <= 50) && attempts < 30);

        const spawnPos = new THREE.Vector3(px, 0, pz);
        const result = mt.createModel();
        const mesh = result.group;
        const bones = result.bones;
        mesh.position.set(px, 0, pz);

        // 根据类型设置属性
        let hp, speed, damage, attackRange, attackRate, detectionRange, chaseLimit;
        let flyHeight = 0;
        if (mt.type === 'scorpion') {
          hp = 800; speed = 6.0; damage = 150; attackRange = 2.5; attackRate = 1.5;
          detectionRange = 20; chaseLimit = 40;
        } else if (mt.type === 'sandworm') {
          hp = 600; speed = 8.0; damage = 200; attackRange = 3.0; attackRate = 2.0;
          detectionRange = 20; chaseLimit = 40;
        } else { // vulture
          hp = 500; speed = 7.0; damage = 120; attackRange = 2.0; attackRate = 1.2;
          detectionRange = 20; chaseLimit = 40;
          flyHeight = 6 + rand() * 4; // 6~10
          mesh.position.y = flyHeight;
        }

        this.scene.add(mesh);

        const monster = {
          mesh: mesh,
          bones: bones,
          type: mt.type,
          hp: hp,
          maxHp: hp,
          speed: speed,
          damage: damage,
          attackRange: attackRange,
          attackRate: attackRate,
          spawnPos: spawnPos.clone(),
          state: 'wander',
          attackTimer: 0,
          animTimer: rand() * Math.PI * 2,
          targetPos: new THREE.Vector3(
            px + (rand() - 0.5) * 20,
            0,
            pz + (rand() - 0.5) * 20
          ),
          detectionRange: detectionRange,
          chaseLimit: chaseLimit,
          flyHeight: flyHeight,
          burrowTimer: 0,
          diveTimer: 0,
          originalY: mesh.position.y,
          dead: false,
          // VFX动画状态
          attackAnimTimer: 0,
          isAttacking: false,
          hitFlashTimer: 0,
          deathTimer: 0,
          wingSlapTimer: 0,
          originalMaterials: null, // 用于被击中闪烁时保存原始材质
        };
        this.desertMonsters.push(monster);
      }
    }
    console.log(`[DesertMap] 生成沙漠怪物: ${this.desertMonsters.length} 只`);
  },

  // ========== 怪物VFX粒子系统 ==========

  // 生成单个粒子方块
  _spawnParticle(position, color, size, velocity, lifetime) {
    const geo = new THREE.BoxGeometry(size, size, size);
    const mat = new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: 1.0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    this.scene.add(mesh);
    const particle = {
      mesh: mesh,
      velocity: velocity.clone(),
      lifetime: lifetime,
      maxLifetime: lifetime,
      gravity: -9.8,
    };
    this.monsterParticles.push(particle);
    return particle;
  },

  // 生成一组粒子爆发
  _spawnParticleBurst(position, color, count, speed, size, lifetime) {
    for (let i = 0; i < count; i++) {
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * speed,
        Math.random() * speed * 0.7 + speed * 0.3,
        (Math.random() - 0.5) * speed
      );
      this._spawnParticle(position, color, size || 0.15, vel, lifetime || 0.6);
    }
  },

  // 创建死亡爆炸粒子效果
  createDeathExplosion(position, color1, color2, count) {
    if (!this.scene) return;
    const particleCount = count || 18;
    // 主色粒子
    for (let i = 0; i < particleCount; i++) {
      const speed = 3.0 + Math.random() * 4.0;
      const angle = Math.random() * Math.PI * 2;
      const elevation = Math.random() * Math.PI * 0.5;
      const vel = new THREE.Vector3(
        Math.cos(angle) * Math.cos(elevation) * speed,
        Math.sin(elevation) * speed + 2.0,
        Math.sin(angle) * Math.cos(elevation) * speed
      );
      const size = 0.08 + Math.random() * 0.14;
      const lifetime = 1.0 + Math.random() * 1.0;
      this._spawnParticle(position, color1, size, vel, lifetime);
    }
    // 辅色粒子
    if (color2) {
      for (let i = 0; i < Math.floor(particleCount * 0.5); i++) {
        const speed = 2.0 + Math.random() * 3.0;
        const angle = Math.random() * Math.PI * 2;
        const elevation = Math.random() * Math.PI * 0.4;
        const vel = new THREE.Vector3(
          Math.cos(angle) * Math.cos(elevation) * speed,
          Math.sin(elevation) * speed + 1.5,
          Math.sin(angle) * Math.cos(elevation) * speed
        );
        const size = 0.06 + Math.random() * 0.10;
        const lifetime = 0.8 + Math.random() * 0.8;
        this._spawnParticle(position, color2, size, vel, lifetime);
      }
    }
  },

  // 更新所有活跃粒子
  _updateParticles(dt) {
    for (let i = this.monsterParticles.length - 1; i >= 0; i--) {
      const p = this.monsterParticles[i];
      p.lifetime -= dt;
      if (p.lifetime <= 0) {
        this.scene.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mesh.material) p.mesh.material.dispose();
        this.monsterParticles.splice(i, 1);
        continue;
      }
      // 扩展球体效果（被击中闪烁）
      if (p.isExpanding) {
        const expandAmount = p.expandRate * dt;
        p.mesh.scale.x += expandAmount;
        p.mesh.scale.y += expandAmount;
        p.mesh.scale.z += expandAmount;
        const ratio = p.lifetime / p.maxLifetime;
        p.mesh.material.opacity = ratio * 0.6;
        continue;
      }
      // 更新位置
      p.velocity.y += p.gravity * dt;
      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;
      // 防止粒子穿过地面
      if (p.mesh.position.y < 0.05) {
        p.mesh.position.y = 0.05;
        p.velocity.y = 0;
        p.velocity.x *= 0.8;
        p.velocity.z *= 0.8;
      }
      // 淡出
      const ratio = p.lifetime / p.maxLifetime;
      p.mesh.material.opacity = ratio;
    }
  },

  // ========== 毒池系统 ==========
  createPoisonPool(position, duration, damagePerSecond) {
    if (!this.scene) return null;
    const radius = 2.5;
    const geo = new THREE.CircleGeometry(radius, 24);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshLambertMaterial({
      color: 0x44AA22,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(position.x, 0.03, position.z);
    mesh.name = 'poisonPool';
    this.scene.add(mesh);

    // 绿色上升粒子
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.8;
      const pos = new THREE.Vector3(
        position.x + Math.cos(angle) * dist,
        0.1,
        position.z + Math.sin(angle) * dist
      );
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 1.5 + 0.8,
        (Math.random() - 0.5) * 0.5
      );
      const p = this._spawnParticle(pos, 0x55CC33, 0.12 + Math.random() * 0.08, vel, 0.8 + Math.random() * 0.6);
      p.gravity = -1.5; // 轻重力，缓慢上升后飘落
    }

    const pool = {
      mesh: mesh,
      position: position.clone(),
      radius: radius,
      lifetime: duration,
      maxLifetime: duration,
      damagePerSecond: damagePerSecond,
    };
    this.poisonPools.push(pool);
    return pool;
  },

  updatePoisonPools(dt) {
    if (!this.poisonPools || this.poisonPools.length === 0) return;
    const playerPos = this.camera ? this.camera.position : null;

    for (let i = this.poisonPools.length - 1; i >= 0; i--) {
      const pool = this.poisonPools[i];
      pool.lifetime -= dt;

      // 视觉脉动
      const pulse = 1.0 + Math.sin(pool.lifetime * 4) * 0.08;
      pool.mesh.scale.set(pulse, 1, pulse);

      // 透明度随时间衰减
      const lifeRatio = Math.max(0, pool.lifetime / pool.maxLifetime);
      pool.mesh.material.opacity = 0.55 * lifeRatio;

      // 检测玩家是否在毒池内
      if (playerPos && typeof window.damagePlayer === 'function') {
        const dx = playerPos.x - pool.position.x;
        const dz = playerPos.z - pool.position.z;
        const distSq = dx * dx + dz * dz;
        if (distSq < pool.radius * pool.radius) {
          window.damagePlayer(pool.damagePerSecond * dt);
        }
      }

      if (pool.lifetime <= 0) {
        this.scene.remove(pool.mesh);
        if (pool.mesh.geometry) pool.mesh.geometry.dispose();
        if (pool.mesh.material) pool.mesh.material.dispose();
        this.poisonPools.splice(i, 1);
      }
    }
  },

  updateDesertMonsters(dt) {
    if (!this.desertMonsters || this.desertMonsters.length === 0) return;
    if (!this.camera) return;

    const playerPos = this.camera.position;

    for (const m of this.desertMonsters) {
      if (!m.mesh) continue;

      // 死亡怪物播放死亡动画
      if (m.dead) {
        m.deathTimer -= dt;
        // 死亡动画更新
        const deathProgress = 1.0 - (m.deathTimer / 0.8);
        m.mesh.scale.setScalar(Math.max(0.01, 1.0 - deathProgress));
        m.mesh.rotation.x += dt * 3.0;
        m.mesh.rotation.z += dt * 1.5;

        if (m.type === 'scorpion' && m.bones) {
          if (m.bones.tailRoot) {
            m.bones.tailRoot.rotation.x = Math.min(1.5, deathProgress * 2.0);
          }
          if (m.bones.legs) {
            m.bones.legs.forEach((leg, i) => {
              const side = i % 2 === 0 ? 1 : -1;
              const splayAmt = deathProgress * 0.8;
              leg.upper.rotation.z = side * (0.5 + splayAmt);
              leg.lower.rotation.z = side * (-0.8 - splayAmt * 0.5);
            });
          }
        } else if (m.type === 'sandworm' && m.bones) {
          if (m.bones.jawUpper) m.bones.jawUpper.rotation.x = -0.8;
          if (m.bones.jawLower) m.bones.jawLower.rotation.x = 0.8;
          if (m.bones.segments) {
            m.bones.segments.forEach(seg => seg.scale.set(1.0, 1.0, 1.0));
          }
        } else if (m.type === 'vulture') {
          if (m.bones) {
            if (m.bones.leftWing) {
              m.bones.leftWing.root.rotation.z = -0.5 - deathProgress * 1.0;
              m.bones.leftWing.seg2.rotation.z = -0.3;
              m.bones.leftWing.seg3.rotation.z = -0.2;
            }
            if (m.bones.rightWing) {
              m.bones.rightWing.root.rotation.z = 0.5 + deathProgress * 1.0;
              m.bones.rightWing.seg2.rotation.z = 0.3;
              m.bones.rightWing.seg3.rotation.z = 0.2;
            }
          }
          m.mesh.position.y -= dt * 5.0;
          if (m.mesh.position.y < 0.2) m.mesh.position.y = 0.2;
        } else {
          m.mesh.position.y -= dt * 2.0;
          if (m.mesh.position.y < 0) m.mesh.position.y = 0;
        }

        if (m.deathTimer <= 0) {
          this.scene.remove(m.mesh);
          m.mesh = null;
        }
        continue;
      }

      m.animTimer += dt;
      if (m.attackTimer > 0) m.attackTimer -= dt;

      const distToPlayer = m.mesh.position.distanceTo(playerPos);
      const distToSpawn = m.mesh.position.distanceTo(m.spawnPos);

      // 状态机
      switch (m.state) {
        case 'wander': {
          // 在出生点附近随机游荡
          const wanderSpeed = m.speed * 0.4;
          const dir = new THREE.Vector3().subVectors(m.targetPos, m.mesh.position);
          dir.y = 0;
          const distToTarget = dir.length();
          if (distToTarget > 0.5) {
            // 直接朝目标移动
            dir.normalize();
            m.mesh.position.x += dir.x * wanderSpeed * dt;
            m.mesh.position.z += dir.z * wanderSpeed * dt;
            m.mesh.lookAt(m.mesh.position.x + dir.x, m.mesh.position.y, m.mesh.position.z + dir.z);
          } else {
            // 到达目标，选择新目标
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 15;
            m.targetPos.set(
              m.spawnPos.x + Math.cos(angle) * radius,
              m.type === 'vulture' ? m.flyHeight : 0,
              m.spawnPos.z + Math.sin(angle) * radius
            );
          }

          // 检测玩家
          if (distToPlayer < m.detectionRange && distToPlayer > m.attackRange) {
            m.state = 'chase';
          }
          break;
        }

        case 'chase': {
          // 追击玩家
          if (distToSpawn > m.chaseLimit) {
            // 超出追击范围，返回游荡
            m.state = 'wander';
            m.targetPos.set(
              m.spawnPos.x + (Math.random() - 0.5) * 10,
              m.type === 'vulture' ? m.flyHeight : 0,
              m.spawnPos.z + (Math.random() - 0.5) * 10
            );
            break;
          }

          if (distToPlayer <= m.attackRange) {
            m.state = 'attack';
            break;
          }

          if (distToPlayer > m.detectionRange) {
            m.state = 'wander';
            break;
          }

          // 移动逻辑：秃鹫飞行越墙，其他怪物直接追击+碰撞检测
          const dir = new THREE.Vector3();
          if (m.type === 'vulture') {
            // 秃鹫直接飞向玩家
            dir.subVectors(playerPos, m.mesh.position);
            dir.y = 0; dir.normalize();
          } else if (m._mustUseGate && m.targetPos) {
            // 防御波次怪物：优先朝大门移动，进入城内后再追击玩家
            const distToGate = m.mesh.position.distanceTo(m.targetPos);
            if (distToGate > 3) {
              // 还没到大门口，朝大门移动
              dir.subVectors(m.targetPos, m.mesh.position);
              dir.y = 0; dir.normalize();
            } else {
              // 已通过大门，朝玩家移动
              dir.subVectors(playerPos, m.mesh.position);
              dir.y = 0; dir.normalize();
            }
          } else {
            // 普通怪物直接朝玩家方向移动
            dir.subVectors(playerPos, m.mesh.position);
            dir.y = 0; dir.normalize();
          }

          // 计算新位置
          const newX = m.mesh.position.x + dir.x * m.speed * dt;
          const newZ = m.mesh.position.z + dir.z * m.speed * dt;

          // 非飞行怪物：碰撞检测（建筑、城墙等）
          if (m.type !== 'vulture' && typeof window.colliders !== 'undefined') {
            const MONSTER_RADIUS = 0.5;
            let blocked = false;
            // 检查新位置是否与碰撞体重叠
            for (const c of window.colliders) {
              if (!c.solid) continue;
              // 防御波次怪物：如果是大门碰撞体且正朝大门移动，允许通过
              if (m._mustUseGate && c.type === 'door') {
                const distToGate = m.mesh.position.distanceTo(m.targetPos);
                if (distToGate > 3) continue; // 还没到大门口，允许穿过门碰撞体
              }
              if (Math.abs(newX - c.x) < (c.hw + MONSTER_RADIUS) && Math.abs(newZ - c.z) < (c.hd + MONSTER_RADIUS)) {
                // 检查Y轴：怪物脚底低于碰撞体顶部则阻挡
                if (m.mesh.position.y < c.topY) {
                  blocked = true;
                  break;
                }
              }
            }
            if (!blocked) {
              m.mesh.position.x = newX;
              m.mesh.position.z = newZ;
            }
          } else {
            m.mesh.position.x = newX;
            m.mesh.position.z = newZ;
          }
          m.mesh.lookAt(m.mesh.position.x + dir.x, m.mesh.position.y, m.mesh.position.z + dir.z);

          // 沙虫特殊：进入追击后概率钻地
          if (m.type === 'sandworm' && Math.random() < 0.3 * dt) {
            m.state = 'burrow';
            m.burrowTimer = 1.0 + Math.random(); // 1~2秒
          }
          break;
        }

        case 'attack': {
          // 面向玩家
          const dir = new THREE.Vector3().subVectors(playerPos, m.mesh.position);
          dir.y = 0;
          dir.normalize();
          m.mesh.lookAt(m.mesh.position.x + dir.x, m.mesh.position.y, m.mesh.position.z + dir.z);

          if (distToPlayer > m.attackRange * 1.5) {
            m.state = 'chase';
            break;
          }

          if (distToSpawn > m.chaseLimit) {
            m.state = 'wander';
            break;
          }

          if (m.attackTimer <= 0) {
            m.attackTimer = m.attackRate;
            // 造成伤害
            if (typeof window.damagePlayer === 'function') {
              window.damagePlayer(m.damage);
            }
            // 攻击音效（30%概率播放，避免连续叫）
            if (window.AudioSystem && Math.random() < 0.3) {
              AudioSystem.playSound('zombie_attack', 0.5);
            }
            // 沙虫击退
            if (m.type === 'sandworm') {
              const knockDir = new THREE.Vector3().subVectors(playerPos, m.mesh.position).normalize();
              if (window.camera) {
                window.camera.position.x += knockDir.x * 3;
                window.camera.position.z += knockDir.z * 3;
              }
            }

            // ===== 攻击VFX =====
            // 蝎子攻击动画: 随机选择 tail (60%) 或 pincer (40%)
            if (m.type === 'scorpion' && m.mesh.userData.tailGroup) {
              m.isAttacking = true;
              m.attackType = Math.random() < 0.6 ? 'tail' : 'pincer';
              m.attackAnimTimer = 0.35; // 攻击动画时长 0.35 秒
              if (m.attackType === 'tail') {
                // 获取毒刺尖端世界坐标
                const stingerTip = m.mesh.userData.stingerTipRef;
                if (stingerTip) {
                  const worldPos = new THREE.Vector3();
                  stingerTip.getWorldPosition(worldPos);
                  // 红色粒子爆发（3-5个小红色方块）
                  this._spawnParticleBurst(worldPos, 0xFF2222, 4, 3.0, 0.12, 0.5);
                }
              } else {
                // 钳子攻击: 在钳子前方产生沙土粒子 + 钳子尖端碎片
                const pinchPos = m.mesh.position.clone();
                pinchPos.y += 0.5;
                const dir = new THREE.Vector3().subVectors(playerPos, m.mesh.position).normalize();
                pinchPos.x += dir.x * 1.2;
                pinchPos.z += dir.z * 1.2;
                this._spawnParticleBurst(pinchPos, 0xC4A35A, 5, 2.5, 0.14, 0.4);
                // 钳子尖端碎片粒子 (3-4个)
                const clawTipOffset = new THREE.Vector3(dir.z, 0, -dir.x).multiplyScalar(0.3);
                const leftTip = pinchPos.clone().add(clawTipOffset);
                const rightTip = pinchPos.clone().sub(clawTipOffset);
                this._spawnParticleBurst(leftTip, 0x8B7355, 2, 2.0, 0.08, 0.3);
                this._spawnParticleBurst(rightTip, 0x8B7355, 2, 2.0, 0.08, 0.3);
              }
            }
            // 沙虫毒液喷射攻击
            if (m.type === 'sandworm') {
              m.isAttacking = true;
              m.attackAnimTimer = 0.5;
              // 在玩家位置创建毒池 (稍微靠前，预判玩家位置)
              const dir = new THREE.Vector3().subVectors(playerPos, m.mesh.position).normalize();
              const poolPos = playerPos.clone();
              poolPos.x += dir.x * 1.0;
              poolPos.z += dir.z * 1.0;
              this.createPoisonPool(poolPos, 4.0, 8);
              // 绿色毒液喷射粒子 burst
              const mouthPos = m.mesh.position.clone();
              mouthPos.y += 1.5;
              mouthPos.x += dir.x * 1.5;
              mouthPos.z += dir.z * 1.5;
              this._spawnParticleBurst(mouthPos, 0x44CC22, 10, 5.0, 0.18, 0.7);
            }
          }

          // ===== 攻击动画更新 =====
          if (m.attackAnimTimer > 0) {
            m.attackAnimTimer -= dt;
            if (m.attackAnimTimer <= 0) {
              m.isAttacking = false;
            }
            // 蝎子攻击动画 (tail / pincer) - 由 bones.updateAnim 处理
            // 沙虫毒液喷射动画 - 由 bones.updateAnim 处理
          } else {
            // 重置动画状态
            if (m.type === 'scorpion' && m.mesh.userData.tailGroup) {
              m.mesh.userData.tailGroup.rotation.x = 0;
            }
            if (m.type === 'sandworm') {
              const jawUpper = m.mesh.userData.jawUpper;
              const jawLower = m.mesh.userData.jawLower;
              if (jawUpper) jawUpper.position.y = 1.5;
              if (jawLower) jawLower.position.y = 1.5;
            }
          }
          break;
        }

        case 'burrow': {
          // 沙虫钻地
          m.burrowTimer -= dt;
          // 缩小Y轴模拟钻地
          m.mesh.scale.y = Math.max(0.1, m.mesh.scale.y - dt * 2);
          if (m.burrowTimer <= 0) {
            // 在玩家附近出现
            const emergeAngle = Math.random() * Math.PI * 2;
            const emergeDist = 2.0 + Math.random() * 2;
            m.mesh.position.x = playerPos.x + Math.cos(emergeAngle) * emergeDist;
            m.mesh.position.z = playerPos.z + Math.sin(emergeAngle) * emergeDist;
            m.mesh.scale.y = 1.0;
            m.state = 'attack';
            m.attackTimer = 0; // 立即攻击
          }
          break;
        }

        case 'dive': {
          // 秃鹫俯冲
          m.diveTimer -= dt;
          const diveDir = new THREE.Vector3().subVectors(playerPos, m.mesh.position);
          diveDir.y = 0;
          diveDir.normalize();
          m.mesh.position.x += diveDir.x * m.speed * 1.5 * dt;
          m.mesh.position.z += diveDir.z * m.speed * 1.5 * dt;
          // 向下俯冲（加速下降）
          if (m.mesh.position.y > 1.5) {
            m.mesh.position.y -= m.speed * 2.0 * dt; // 加速俯冲
          }
          m.mesh.lookAt(m.mesh.position.x + diveDir.x, m.mesh.position.y, m.mesh.position.z + diveDir.z);

          if (distToPlayer <= m.attackRange && m.attackTimer <= 0) {
            m.attackTimer = m.attackRate;
            if (typeof window.damagePlayer === 'function') {
              window.damagePlayer(m.damage);
            }
            // ===== 秃鹫俯冲命中VFX =====
            // 翅膀拍击效果
            m.wingSlapTimer = 0.3;
            // 灰色羽毛粒子爆发
            this._spawnParticleBurst(m.mesh.position.clone(), 0x888888, 4, 3.0, 0.1, 0.5);
          }

          // 翅膀拍击动画
          if (m.wingSlapTimer > 0) {
            m.wingSlapTimer -= dt;
            const rightWing = m.mesh.userData.rightWing;
            const leftWing = m.mesh.userData.leftWing;
            if (rightWing && leftWing) {
              const slapProgress = 1.0 - (m.wingSlapTimer / 0.3);
              const scaleX = slapProgress < 0.5
                ? 1.0 + slapProgress * 2 * 0.5  // 展开翅膀 (scale.x *= 1.5)
                : 1.0 + (1.0 - (slapProgress - 0.5) * 2) * 0.5; // 收回
              rightWing.scale.x = scaleX;
              leftWing.scale.x = scaleX;
            }
          } else {
            // 重置翅膀缩放
            const rightWing = m.mesh.userData.rightWing;
            const leftWing = m.mesh.userData.leftWing;
            if (rightWing) rightWing.scale.x = 1.0;
            if (leftWing) leftWing.scale.x = 1.0;
          }

          if (m.diveTimer <= 0 || m.mesh.position.y <= 1.5) {
            m.state = 'chase';
          }
          break;
        }
      }

      // 秃鹫特殊：在chase状态下如果高度不够则飞起，如果够高则可能俯冲
      if (m.type === 'vulture') {
        if (m.state === 'chase' && m.mesh.position.y < m.flyHeight - 1 && m.state !== 'dive') {
          m.mesh.position.y = Math.min(m.flyHeight, m.mesh.position.y + m.speed * 0.5 * dt);
        }
        if (m.state === 'chase' && m.mesh.position.y >= m.flyHeight - 1 && Math.random() < 0.4 * dt) {
          m.state = 'dive';
          m.diveTimer = 1.5;
        }
        if (m.state === 'wander') {
          const targetY = m.flyHeight + Math.sin(m.animTimer * 0.5) * 1.5;
          m.mesh.position.y += (targetY - m.mesh.position.y) * dt;
        }
      }

      // Call bone animation update
      if (m.bones && m.bones.updateAnim) {
        if (m.type === 'scorpion') {
          m.bones.updateAnim(dt, m.state, m.speed, m.animTimer, m.isAttacking, m.attackAnimTimer, m.attackType);
        } else if (m.type === 'vulture') {
          m.bones.updateAnim(dt, m.state, m.speed, m.animTimer, m.isAttacking, m.attackAnimTimer, m.wingSlapTimer || 0);
        } else {
          m.bones.updateAnim(dt, m.state, m.speed, m.animTimer, m.isAttacking, m.attackAnimTimer);
        }
      }

      // ===== 被击中闪烁效果 =====
      if (m.hitFlashTimer > 0) {
        m.hitFlashTimer -= dt;
        if (m.hitFlashTimer <= 0) {
          // 恢复原始材质
          m.mesh.traverse(child => {
            if (child.isMesh && child.material && child.material._originalEmissive !== undefined) {
              child.material.emissive.setHex(child.material._originalEmissive);
              child.material.emissiveIntensity = child.material._originalEmissiveIntensity || 0;
              delete child.material._originalEmissive;
              delete child.material._originalEmissiveIntensity;
            }
          });
        }
      }

      // ===== 死亡检测与效果 =====
      if (m.hp <= 0 && !m.dead) {
        m.dead = true;
        m.deathTimer = 0.8; // 死亡动画时长 0.8 秒
        // 更新悬赏任务击杀计数
        if (DesertMap.onMonsterKilled) DesertMap.onMonsterKilled(m.type);

        // 经验值奖励
        const monsterXP = { scorpion: 20, sandworm: 40, vulture: 30 };
        const xpGain = monsterXP[m.type] || 15;
        if (window.player) {
          window.player.xp = (window.player.xp || 0) + xpGain;
          if (typeof window.checkLevelUp === 'function') window.checkLevelUp();
        }
        if (typeof window.addKillFeed === 'function') {
          const names = { scorpion: '沙漠蝎子', sandworm: '沙虫', vulture: '秃鹫' };
          window.addKillFeed(m.lastAttacker || '玩家', names[m.type] || m.type);
        }

        // 根据怪物类型设置死亡特效参数
        let color1, color2, particleCount = 18;
        if (m.type === 'scorpion') {
          color1 = 0x44CC22; // 绿色血液
          color2 = 0xC4A35A; // 黄色
        } else if (m.type === 'sandworm') {
          color1 = 0xB8860B; // 棕黄色
          color2 = 0xC4A35A; // 沙色
        } else if (m.type === 'vulture') {
          color1 = 0x2F2F2F; // 灰黑色羽毛
          color2 = 0x111111; // 深黑
          particleCount = 22;
        }

        // 死亡爆炸粒子
        this.createDeathExplosion(m.mesh.position.clone(), color1, color2, particleCount);

        // 生成掉落物（30%概率）
        if (typeof spawnPickup === 'function' && Math.random() < 0.3) {
          spawnPickup(m.mesh.position.clone());
        }

        // 怪物类型专属死亡动画初始化
        if (m.type === 'scorpion') {
          m.deathAnim = {
            tailDrop: true,
            legsSplay: true,
          };
        } else if (m.type === 'sandworm') {
          m.deathAnim = {
            stopUndulate: true,
            mouthOpen: true,
          };
        } else if (m.type === 'vulture') {
          m.deathAnim = {
            wingsLimp: true,
            fallToGround: true,
          };
        }
      }

    }

    // ===== 更新粒子系统 =====
    this._updateParticles(dt);
  },

  // 对沙漠怪物造成伤害并触发被击中VFX
  // monsterIndex: desertMonsters数组中的索引, damageAmount: 伤害值
  damageDesertMonster(monsterIndex, damageAmount) {
    if (!this.desertMonsters || monsterIndex < 0 || monsterIndex >= this.desertMonsters.length) return;
    const m = this.desertMonsters[monsterIndex];
    if (m.dead || !m.mesh) return;

    m.hp -= damageAmount;

    // 触发被击中闪烁效果
    m.hitFlashTimer = 0.15;
    m.mesh.traverse(child => {
      if (child.isMesh && child.material) {
        // 保存原始emissive值
        if (child.material._originalEmissive === undefined) {
          child.material._originalEmissive = child.material.emissive ? child.material.emissive.getHex() : 0x000000;
          child.material._originalEmissiveIntensity = child.material.emissiveIntensity || 0;
        }
        // 设置红色闪烁
        if (child.material.emissive) {
          child.material.emissive.setHex(0xFF0000);
          child.material.emissiveIntensity = 0.8;
        }
      }
    });

    // 在命中位置创建红色透明球体
    const hitSphereGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const hitSphereMat = new THREE.MeshBasicMaterial({ color: 0xFF0000, transparent: true, opacity: 0.6 });
    const hitSphere = new THREE.Mesh(hitSphereGeo, hitSphereMat);
    hitSphere.position.copy(m.mesh.position);
    hitSphere.position.y += 1.0;
    this.scene.add(hitSphere);
    this.monsterParticles.push({
      mesh: hitSphere,
      velocity: new THREE.Vector3(0, 0, 0),
      lifetime: 0.2,
      maxLifetime: 0.2,
      gravity: 0,
      isExpanding: true,
      expandRate: 3.0,
    });
  },

  // L键任务面板
  showQuestPanel() {
    if (typeof window.pauseGameState === 'function') window.pauseGameState();
    if (document.pointerLockElement) document.exitPointerLock();
    document.body.style.cursor = 'default';

    const overlay = document.getElementById('quest-panel-overlay');
    const content = document.getElementById('quest-panel-content');
    if (!overlay || !content) return;
    overlay.style.display = 'flex';

    const bh = this.npcInteraction.bountyHunter;
    const monsterNames = { scorpion: '蝎子', sandworm: '沙虫', vulture: '秃鹫', mixed: '任意怪物' };

    let html = `<p style="color:#aaa;font-size:12px;">已完成悬赏: ${bh.completedCount} | 当前任务: ${bh.activeQuests.length}/${bh.maxActiveQuests}</p>`;

    if (bh.activeQuests.length === 0) {
      html += `<div style="text-align:center;padding:30px 0;color:#888;">`;
      html += `<p style="font-size:16px;">📋 暂无进行中的任务</p>`;
      html += `<p style="font-size:13px;margin-top:8px;">前往营地找赏金猎人接取悬赏任务</p>`;
      html += `</div>`;
    } else {
      bh.activeQuests.forEach((quest, idx) => {
        const mType = monsterNames[quest.type] || quest.type;
        const isComplete = quest.killed >= quest.target;
        const progressPct = Math.min(100, Math.floor(quest.killed / quest.target * 100));

        html += `<div style="margin:10px 0;padding:14px;border-radius:8px;background:rgba(${isComplete ? '80,200,80' : '255,255,255'},0.05);border:1px solid rgba(${isComplete ? '80,200,80' : '139,105,20'},0.3);">`;
        html += `<div style="display:flex;justify-content:space-between;align-items:center;">`;
        html += `<span style="color:${isComplete ? '#88ee88' : '#eecc88'};font-weight:bold;">${isComplete ? '✅' : '📋'} ${quest.name}</span>`;
        if (isComplete) {
          html += `<span style="color:#88ee88;font-size:12px;background:rgba(80,200,80,0.15);padding:2px 8px;border-radius:4px;">可交付</span>`;
        }
        html += `</div>`;
        html += `<div style="margin:8px 0;">`;
        html += `<div style="background:rgba(255,255,255,0.1);border-radius:4px;height:8px;overflow:hidden;">`;
        html += `<div style="background:${isComplete ? '#88ee88' : '#c4a352'};height:100%;width:${progressPct}%;border-radius:4px;"></div>`;
        html += `</div>`;
        html += `<div style="color:#aaa;font-size:12px;margin-top:4px;">进度: ${quest.killed}/${quest.target} ${mType} (${progressPct}%)</div>`;
        html += `</div>`;
        html += `<div style="color:#aaa;font-size:12px;">奖励: 🏗️${quest.reward.building}建材 ⚙️${quest.reward.parts}零件</div>`;
        html += `</div>`;
      });
    }

    content.innerHTML = html;
  },

  hideQuestPanel() {
    const overlay = document.getElementById('quest-panel-overlay');
    if (overlay) overlay.style.display = 'none';
    if (typeof window.resumeGameState === 'function') window.resumeGameState();
    document.body.style.cursor = 'none';
    const canvas = window.renderer ? renderer.domElement : null;
    if (canvas) {
      if (document.pointerLockElement) document.exitPointerLock();
      setTimeout(() => {
        setTimeout(() => {
          if (window.gameState === 'playing' && !window.shelterPauseState) {
            canvas.requestPointerLock().catch(() => {});
          }
        }, 50);
      }, 50);
    }
  },

  // 显示任务引导标记（箭头指向目标位置）
  showQuestMarker(type) {
    if (this._questMarker) {
      this.scene.remove(this._questMarker);
      this._questMarker = null;
    }
    if (type === 'tower') {
      // 在联络塔位置创建浮动箭头标记
      const arrowGeo = new THREE.ConeGeometry(0.5, 1.5, 4);
      const arrowMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.8 });
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.position.set(-25, 8, 25);
      arrow.name = 'questMarker';
      this.scene.add(arrow);
      this._questMarker = arrow;
      this._questMarkerType = 'tower';
      this._questMarkerTime = 0;
      if (typeof showToast === 'function') {
        showToast('📌 任务更新：前往联络塔启动防御', 'info');
      }
    }
  },

  // 更新任务引导标记动画
  _updateQuestMarker(dt) {
    if (!this._questMarker) return;
    this._questMarkerTime += dt;
    const arrow = this._questMarker;
    // 上下浮动
    arrow.position.y = 8 + Math.sin(this._questMarkerTime * 3) * 1;
    // 旋转
    arrow.rotation.y += dt * 2;
    // 透明度脉冲
    arrow.material.opacity = 0.5 + Math.sin(this._questMarkerTime * 4) * 0.3;
    // 冷却倒计时
    if (this._questMarkerCooldown > 0) {
      this._questMarkerCooldown -= dt;
      return;
    }
    // 检查玩家是否到达联络塔附近，到达后显示防御开始对话框（不自动启动）
    if (this._questMarkerType === 'tower' && window.camera) {
      const dx = window.camera.position.x - (-25);
      const dz = window.camera.position.z - 25;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 8) {
        // 显示防御开始对话框，不自动启动防御
        if (typeof window.showDesertMissionDialog === 'function') {
          window.showDesertMissionDialog('defendStart');
        }
        // 移除标记并进入冷却，防止重复弹窗
        this.scene.remove(this._questMarker);
        this._questMarker = null;
        this._questMarkerType = null;
        this._questMarkerCooldown = 3; // 3秒冷却
      }
    }
  },

  // 防御波次（由任务系统触发）
  startDefense() {
    this.phase = 'defend';
    this.defenseWave = 0;
    this.towerHP = DESERT_MAP_CONFIG.TOWER_HP;
    this.towerMaxHP = DESERT_MAP_CONFIG.TOWER_HP;
    this.shakeIntensity = 0;
    this.shakeTimer = 0;
    this._nextWaveTimer = 0;
    const waveInfo = document.getElementById('wave-info');
    if (waveInfo) waveInfo.style.display = 'block';
    // 自动启动第一波
    this.nextDefenseWave();
  },

  nextDefenseWave() {
    this.defenseWave++;
    if (this.defenseWave > DESERT_MAP_CONFIG.DEFENSE_WAVES) {
      this.defenseComplete();
      return;
    }

    this.defenseWaveActive = true;
    if (typeof window.showToast === 'function') {
      window.showToast(`🛡️ 基地防御 第 ${this.defenseWave}/${DESERT_MAP_CONFIG.DEFENSE_WAVES} 波`, 'warning');
    }

    const count = 6 + this.defenseWave * 3;
    this.spawnDefenseWaveEnemies(count);
  },

  spawnDefenseWaveEnemies(count) {
    if (typeof window.spawnEnemy === 'function') {
      if (!this.defenseEnemies) this.defenseEnemies = [];
      // 基地大门在南墙 z=40, x:[-5,5]
      const gateX = 0, gateZ = 40;
      for (let i = 0; i < count; i++) {
        let x, z;
        // 在大门正前方远处生成（z > 60，确保在城墙外很远）
        const angle = (Math.random() - 0.5) * Math.PI * 0.6; // 窄扇形，正对大门
        const dist = 50 + Math.random() * 40; // 距离50-90米，确保在城外远处
        x = gateX + Math.sin(angle) * dist;
        z = gateZ + Math.cos(angle) * dist;
        const terrainH = this.getTerrainHeight(x, z);
        const pos = new THREE.Vector3(x, terrainH, z);

        // 荒漠专属僵尸（v3.0 感染变异体）
        let types = ['干尸行者', '毒蝎丧尸', '甲虫巨尸'];
        if (this.defenseWave >= 5) types.push('秃鹫腐尸', '自爆火甲虫', '沙蛇潜行者');
        if (this.defenseWave >= 10) types.push('荒漠暴君');
        if (this.defenseWave >= 20) types = ['沙虫巨兽'];
        const type = types[Math.floor(Math.random() * types.length)];
        const enemy = window.spawnEnemy(type, pos);
        if (enemy) {
          // 设置怪物的出生点和目标点为大门，强制从大门进入
          enemy.spawnPos = new THREE.Vector3(x, terrainH, z);
          enemy.targetPos = new THREE.Vector3(gateX + (Math.random() - 0.5) * 4, terrainH, gateZ);
          enemy._mustUseGate = true; // 标记必须从大门进入
          this.defenseEnemies.push(enemy);
        }
      }
    }
  },

  damageTower(damage) {
    this.towerHP -= damage;
    if (this.towerHP <= 0) {
      this.towerHP = 0;
      this.updateTowerHPBar();
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
    if (this.defenseEnemies) {
      this.defenseEnemies.forEach(e => { if (e.mesh) this.scene.remove(e.mesh); });
      this.defenseEnemies = [];
    }
    if (typeof window.showDesertMissionDialog === 'function') {
      window.showDesertMissionDialog('towerDestroyed');
    }
  },

  updateTowerHPBar() {
    if (!this.towerMesh) return;
    const fill = this.towerMesh.getObjectByName('towerHPFill');
    if (fill) {
      const pct = this.towerHP / this.towerMaxHP;
      fill.scale.x = Math.max(0.001, pct);
      fill.position.x = -(1 - pct) * 3;
      if (pct > 0.5) fill.material.color.setHex(0x44ff44);
      else if (pct > 0.25) fill.material.color.setHex(0xffaa00);
      else fill.material.color.setHex(0xff4444);
    }
  },

  defenseComplete() {
    this.phase = 'complete';
    this.defenseWaveActive = false;
    this.shakeIntensity = 0;
    const waveInfo = document.getElementById('wave-info');
    if (waveInfo) waveInfo.style.display = 'none';
    if (typeof window.showDesertMissionDialog === 'function') {
      window.showDesertMissionDialog('complete');
    }
    // 触发直升机救援剧情
    this.onDefenseComplete();
  },

  // ===== 直升机救援系统 =====
  onDefenseComplete() {
    if (typeof window.showToast === 'function') {
      window.showToast('🚁 直升机救援即将到达！请前往停机坪等待...', 'success');
    }
    this.createHelicopterLandingZone();
    this.helicopterArrivalTimer = 15; // 15秒后到达
    this.helicopterArrived = false;
    this.playerBoarded = false;
    this.helicopterFlightPhase = 'waiting'; // waiting, boarding, takeoff, flying, arrived
    this.helicopterFlightTimer = 0;
    this.helicopterAltitude = 0;
    this.helicopterForwardDist = 0;
    this.helicopterSoundPlayed = false;
  },

  createHelicopterLandingZone() {
    if (!this.scene) return;
    // 停机坪标记 - H字母
    const markerGroup = new THREE.Group();
    
    // 外圈
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(4, 4.5, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.15;
    markerGroup.add(ring);
    
    // 内圈
    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(2, 2.3, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.15;
    markerGroup.add(innerRing);
    
    // H字母标记（用两个竖条和一个横条）
    const hMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.6 });
    const hLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 2), hMat);
    hLeft.position.set(-0.8, 0.16, 0);
    markerGroup.add(hLeft);
    const hRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 2), hMat);
    hRight.position.set(0.8, 0.16, 0);
    markerGroup.add(hRight);
    const hMid = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.3), hMat);
    hMid.position.set(0, 0.16, 0);
    markerGroup.add(hMid);
    
    // 垂直光束
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 60, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.05, side: THREE.DoubleSide })
    );
    beam.position.y = 30;
    markerGroup.add(beam);
    
    markerGroup.position.set(0, 0, 0);
    this.scene.add(markerGroup);
    this.helicopterMarker = markerGroup;
  },

  createHelicopterModel() {
    const heli = new THREE.Group();
    const militaryGreen = 0x4a5a3a;
    const darkGreen = 0x3a4a2a;
    const metalGray = 0x666666;
    const glassBlue = 0x3388aa;
    
    // 机身主体（流线型）
    const bodyGeo = new THREE.BoxGeometry(3, 2.5, 7);
    const bodyMat = new THREE.MeshLambertMaterial({ color: militaryGreen });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    heli.add(body);
    
    // 机头（锥形）
    const noseGeo = new THREE.ConeGeometry(1.5, 3, 4);
    const noseMat = new THREE.MeshLambertMaterial({ color: militaryGreen });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.rotation.x = Math.PI / 2;
    nose.rotation.y = Math.PI / 4;
    nose.position.z = 5;
    heli.add(nose);
    
    // 驾驶舱玻璃
    const cockpitGeo = new THREE.BoxGeometry(2.2, 1.5, 2);
    const cockpitMat = new THREE.MeshLambertMaterial({ color: glassBlue, transparent: true, opacity: 0.6 });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 0.5, 3.5);
    heli.add(cockpit);
    
    // 尾梁
    const tailGeo = new THREE.BoxGeometry(1, 1.2, 6);
    const tailMat = new THREE.MeshLambertMaterial({ color: darkGreen });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, 0.3, -6.5);
    heli.add(tail);
    
    // 尾翼（水平）
    const tailFinGeo = new THREE.BoxGeometry(3, 0.15, 1.2);
    const tailFinMat = new THREE.MeshLambertMaterial({ color: darkGreen });
    const tailFin = new THREE.Mesh(tailFinGeo, tailFinMat);
    tailFin.position.set(0, 0.3, -9);
    heli.add(tailFin);
    
    // 尾旋翼
    const tailRotorGeo = new THREE.BoxGeometry(2, 0.1, 0.3);
    const tailRotorMat = new THREE.MeshLambertMaterial({ color: metalGray });
    const tailRotor = new THREE.Mesh(tailRotorGeo, tailRotorMat);
    tailRotor.position.set(0, 0.3, -9.5);
    heli.add(tailRotor);
    this.helicopterTailRotor = tailRotor;
    
    // 主旋翼轴
    const rotorShaftGeo = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    const rotorShaftMat = new THREE.MeshLambertMaterial({ color: metalGray });
    const rotorShaft = new THREE.Mesh(rotorShaftGeo, rotorShaftMat);
    rotorShaft.position.y = 2;
    heli.add(rotorShaft);
    
    // 主旋翼（4片桨叶）
    const rotorGroup = new THREE.Group();
    rotorGroup.position.y = 2.5;
    const bladeMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.05, 6),
        bladeMat
      );
      blade.rotation.y = (Math.PI / 2) * i;
      blade.position.x = Math.cos((Math.PI / 2) * i) * 3;
      blade.position.z = Math.sin((Math.PI / 2) * i) * 3;
      rotorGroup.add(blade);
    }
    // 旋翼中心
    const rotorHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8),
      new THREE.MeshLambertMaterial({ color: metalGray })
    );
    rotorGroup.add(rotorHub);
    heli.add(rotorGroup);
    this.helicopterRotor = rotorGroup;
    
    // 起落架（两个滑橇）
    const skidMat = new THREE.MeshLambertMaterial({ color: metalGray });
    const skidGeo = new THREE.CylinderGeometry(0.1, 0.1, 6, 6);
    const leftSkid = new THREE.Mesh(skidGeo, skidMat);
    leftSkid.rotation.z = Math.PI / 2;
    leftSkid.position.set(-1.5, -2, 0);
    heli.add(leftSkid);
    const rightSkid = new THREE.Mesh(skidGeo, skidMat);
    rightSkid.rotation.z = Math.PI / 2;
    rightSkid.position.set(1.5, -2, 0);
    heli.add(rightSkid);
    // 滑橇支撑
    const strutGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 4);
    const leftStrut = new THREE.Mesh(strutGeo, skidMat);
    leftStrut.position.set(-1.5, -1.2, 0);
    heli.add(leftStrut);
    const rightStrut = new THREE.Mesh(strutGeo, skidMat);
    rightStrut.position.set(1.5, -1.2, 0);
    heli.add(rightStrut);
    
    // 侧面门
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x5a6a4a });
    const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 2.5), doorMat);
    leftDoor.position.set(-1.55, -0.2, 0);
    heli.add(leftDoor);
    const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 2.5), doorMat);
    rightDoor.position.set(1.55, -0.2, 0);
    heli.add(rightDoor);
    
    // 军用标记（红十字）
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.1), crossMat);
    crossH.position.set(0, 0, -3.55);
    heli.add(crossH);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.2), crossMat);
    crossV.position.set(0, 0, -3.55);
    heli.add(crossV);
    
    // 初始位置：高空远处飞来
    heli.position.set(80, 40, -60);
    this.scene.add(heli);
    this.helicopterModel = heli;
  },

  updateHelicopter(dt) {
    if (!this.helicopterArrived && this.helicopterArrivalTimer > 0) {
      this.helicopterArrivalTimer -= dt;
      // 标记闪烁
      if (this.helicopterMarker) {
        this.helicopterMarker.children.forEach(child => {
          if (child.material && child.material.opacity !== undefined && child.type !== 'Mesh') {
            // skip
          }
        });
        const ring = this.helicopterMarker.children[0];
        if (ring && ring.material) {
          ring.material.opacity = 0.4 + Math.sin(Date.now() * 0.005) * 0.3;
        }
      }
      if (this.helicopterArrivalTimer <= 0) {
        this.helicopterArrivalTimer = 0;
        this.helicopterArrived = true;
        this.createHelicopterModel();
        if (typeof window.showToast === 'function') {
          window.showToast('🚁 直升机已到达！请前往停机坪，按 E 登机！', 'success');
        }
      }
      return;
    }
    
    if (!this.helicopterArrived || !this.helicopterModel) return;
    
    const heli = this.helicopterModel;
    
    // 旋翼旋转
    if (this.helicopterRotor) {
      this.helicopterRotor.rotation.y += 15 * dt; // 快速旋转
    }
    if (this.helicopterTailRotor) {
      this.helicopterTailRotor.rotation.x += 20 * dt;
    }
    
    switch (this.helicopterFlightPhase) {
      case 'waiting':
        // 直升机悬停在停机坪上方
        this._helicopterLerp(heli.position, { x: 0, y: 8, z: 0 }, dt * 2);
        // 检查玩家是否在停机坪范围内，显示E提示
        this._checkBoardingPrompt();
        break;
        
      case 'boarding':
        this.helicopterFlightTimer -= dt;
        if (this.helicopterFlightTimer <= 0) {
          this.helicopterFlightPhase = 'takeoff';
          this.helicopterFlightTimer = 0;
          if (typeof window.showToast === 'function') {
            window.showToast('🚁 正在起飞...', 'info');
          }
        }
        break;
        
      case 'takeoff':
        // 上升
        this.helicopterAltitude += 5 * dt;
        heli.position.y = 8 + this.helicopterAltitude;
        // 相机跟随
        this._updateFlightCamera(dt);
        if (this.helicopterAltitude >= 30) {
          this.helicopterFlightPhase = 'flying';
          this.helicopterFlightTimer = 10; // 10秒飞行
          if (typeof window.showToast === 'function') {
            window.showToast('正在飞往孤岛基地...', 'info');
          }
          // 显示飞行HUD
          this._showFlightHUD();
        }
        break;
        
      case 'flying':
        this.helicopterFlightTimer -= dt;
        // 前进飞行
        this.helicopterForwardDist += 15 * dt;
        heli.position.z = -this.helicopterForwardDist;
        heli.position.y = 38 + Math.sin(Date.now() * 0.001) * 0.5; // 轻微上下浮动
        // 相机跟随
        this._updateFlightCamera(dt);
        // 更新飞行HUD
        this._updateFlightHUD();
        if (this.helicopterFlightTimer <= 0) {
          this.helicopterFlightPhase = 'arrived';
          this._hideFlightHUD();
          this.onHelicopterLeft();
        }
        break;
    }
  },
  
  _helicopterLerp(current, target, factor) {
    current.x += (target.x - current.x) * factor;
    current.y += (target.y - current.y) * factor;
    current.z += (target.z - current.z) * factor;
  },
  
  _checkBoardingPrompt() {
    const playerPos = this.camera ? this.camera.position : (window.camera ? window.camera.position : null);
    if (!playerPos) return;
    const dx = playerPos.x;
    const dz = playerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    // 显示/隐藏E提示
    const prompt = document.getElementById('helicopter-board-prompt');
    if (dist < 6) {
      if (!prompt) {
        const div = document.createElement('div');
        div.id = 'helicopter-board-prompt';
        div.style.cssText = 'position:fixed;bottom:120px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#44ff88;padding:12px 24px;border-radius:8px;font-size:18px;z-index:1000;border:2px solid #44ff88;pointer-events:none;';
        div.textContent = '按 E 登上直升机';
        document.body.appendChild(div);
      }
    } else {
      if (prompt) prompt.remove();
    }
  },
  
  _showFlightHUD() {
    if (document.getElementById('flight-hud')) return;
    const hud = document.createElement('div');
    hud.id = 'flight-hud';
    hud.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#44ff88;font-size:20px;z-index:1000;text-align:center;pointer-events:none;text-shadow:0 0 10px rgba(68,255,136,0.5);';
    hud.innerHTML = '<div style="font-size:14px;opacity:0.7;">正在飞往孤岛基地...</div><div id="flight-countdown" style="font-size:28px;margin-top:8px;">10</div>';
    document.body.appendChild(hud);
  },
  
  _updateFlightHUD() {
    const countdown = document.getElementById('flight-countdown');
    if (countdown) {
      countdown.textContent = Math.max(0, Math.ceil(this.helicopterFlightTimer));
    }
  },
  
  _hideFlightHUD() {
    const hud = document.getElementById('flight-hud');
    if (hud) hud.remove();
    const prompt = document.getElementById('helicopter-board-prompt');
    if (prompt) prompt.remove();
  },
  
  _updateFlightCamera(dt) {
    if (!this.camera || !this.helicopterModel) return;
    const heliPos = this.helicopterModel.position;
    // 相机在直升机内部，稍微偏后偏上
    const targetCamX = heliPos.x;
    const targetCamY = heliPos.y + 2;
    const targetCamZ = heliPos.z + 3;
    
    this.camera.position.x += (targetCamX - this.camera.position.x) * 3 * dt;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 3 * dt;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 3 * dt;
    
    // 看向前方（直升机飞行方向）
    const lookTarget = new THREE.Vector3(heliPos.x, heliPos.y, heliPos.z - 20);
    this.camera.lookAt(lookTarget);
  },
  
  onPlayerBoardHelicopter() {
    this.helicopterFlightPhase = 'boarding';
    this.helicopterFlightTimer = 2; // 2秒登机动画
    if (typeof window.showToast === 'function') {
      window.showToast('🚁 正在登机...', 'info');
    }
    // 隐藏E提示
    const prompt = document.getElementById('helicopter-board-prompt');
    if (prompt) prompt.remove();
    // 锁定玩家控制
    if (document.pointerLockElement) document.exitPointerLock();
    document.body.style.cursor = 'none';
  },
  
  onHelicopterLeft() {
    // 解锁孤岛基地
    if (window.WorldMap && typeof WorldMap.unlockNode === 'function') {
      WorldMap.unlockNode('island');
    }
    // 保存进度
    if (window.WorldMap && typeof WorldMap.saveData === 'function') {
      WorldMap.saveData();
    }
    // 切换地图
    if (window.MapManager && typeof MapManager.switchTo === 'function') {
      MapManager.switchTo('island');
    }
    // 清理
    this._cleanupHelicopter();
  },
  
  _cleanupHelicopter() {
    if (this.helicopterModel && this.scene) this.scene.remove(this.helicopterModel);
    if (this.helicopterMarker && this.scene) this.scene.remove(this.helicopterMarker);
    this.helicopterModel = null;
    this.helicopterRotor = null;
    this.helicopterTailRotor = null;
    this.helicopterMarker = null;
    this.helicopterArrived = false;
    this.playerBoarded = false;
    this.helicopterFlightPhase = 'waiting';
    this._hideFlightHUD();
  },

  update(dt) {
    if (!this.active) return;

    // 沙漠地图特色天气：有概率自动切换为沙尘暴
    if (window.WeatherSystem && WeatherSystem.currentWeather !== 'sandstorm') {
      if (!this._sandstormCheckTimer) this._sandstormCheckTimer = 0;
      this._sandstormCheckTimer += dt;
      if (this._sandstormCheckTimer > 30) { // 每30秒检查一次
        this._sandstormCheckTimer = 0;
        if (Math.random() < 0.3) { // 30%概率切换为沙尘暴
          WeatherSystem.forceWeather('sandstorm');
        }
      }
    }

    // 更新沙尘粒子
    this.updateSandParticles(dt);

    // 更新沙漠怪物AI
    this.updateDesertMonsters(dt);

    // 更新毒池
    this.updatePoisonPools(dt);

    // NPCs face the player
    if (this.camera && this.npcs) {
      this.npcs.forEach(npc => {
        if (npc.mesh) {
          const dx = this.camera.position.x - npc.mesh.position.x;
          const dz = this.camera.position.z - npc.mesh.position.z;
          npc.mesh.rotation.y = Math.atan2(dx, dz);
        }
      });
    }

    // 村民AI状态机更新
    this._updateVillagers(dt);

    // 画面震动
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) this.shakeIntensity = 0;
    }

    // 更新任务引导标记
    this._updateQuestMarker(dt);

    // 直升机系统更新
    if (this.helicopterFlightPhase && this.helicopterFlightPhase !== 'arrived') {
      this.updateHelicopter(dt);
    }

    // 篝火动画和昼夜联动 + 驱散迷雾效果
    if (this.campfires) {
      const dayNight = window.dayNightCycle;
      let nightFactor = 0;
      if (dayNight) {
        const t = dayNight.timeOfDay;
        if (t <= 0.2) nightFactor = 1;
        else if (t <= 0.3) nightFactor = 1 - (t - 0.2) / 0.1;
        else if (t <= 0.7) nightFactor = 0;
        else if (t <= 0.8) nightFactor = (t - 0.7) / 0.1;
        else nightFactor = 1;
      } else {
        nightFactor = 0.5;
      }

      // 篝火驱散迷雾：检查玩家是否在篝火附近，降低附近迷雾密度
      const playerPos = window.camera ? window.camera.position : null;
      if (playerPos && this.scene && this.scene.fog) {
        let nearestCampfireDist = Infinity;
        for (const cf of this.campfires) {
          const dx = cf.group.position.x - playerPos.x;
          const dz = cf.group.position.z - playerPos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < nearestCampfireDist) nearestCampfireDist = dist;
        }
        // 在篝火15米范围内，迷雾密度降低（驱散效果）
        const dispelRadius = 15;
        if (nearestCampfireDist < dispelRadius) {
          const dispelFactor = 1 - (nearestCampfireDist / dispelRadius);
          const baseDensity = DESERT_MAP_CONFIG.FOG_DENSITY;
          this.scene.fog.density = baseDensity * (1 - dispelFactor * 0.7);
        } else {
          this.scene.fog.density = DESERT_MAP_CONFIG.FOG_DENSITY;
        }
      }

      const now = Date.now() * 0.001;
      for (const cf of this.campfires) {
        // 平滑过渡光照强度
        const targetIntensity = cf.baseIntensity * nightFactor;
        cf.currentIntensity += (targetIntensity - cf.currentIntensity) * dt * 2;
        const intensity = cf.currentIntensity;

        // 光照闪烁
        const flicker = 0.85 + Math.sin(now * 5 + cf.group.position.x * 3) * 0.1
                      + Math.sin(now * 13 + cf.group.position.z * 7) * 0.05;
        cf.light.intensity = intensity * flicker;
        const warmth = 0.5 + nightFactor * 0.5;
        cf.light.color.setRGB(1, 0.4 * warmth, 0.1 * warmth);

        const fireActive = nightFactor > 0.05;

        // === 1. 火焰锥体动画 ===
        if (cf.flameCones) {
          for (const c of cf.flameCones) {
            c.mesh.visible = fireActive;
            if (!fireActive) continue;
            const t = now + c.phase;
            // 高度随机伸缩（模拟火苗窜动）
            const hScale = 0.7 + Math.sin(t * 6) * 0.2 + Math.sin(t * 11) * 0.1;
            c.mesh.scale.y = hScale;
            c.mesh.scale.x = 0.8 + Math.sin(t * 8) * 0.15;
            c.mesh.scale.z = 0.8 + Math.sin(t * 7 + 1) * 0.15;
            // 位置微移
            c.mesh.position.y = c.baseY + Math.sin(t * 5) * 0.08;
            c.mesh.position.x = Math.sin(t * 4) * 0.03;
            // 旋转
            c.mesh.rotation.y += c.rotSpeed * dt;
            // 透明度闪烁
            c.mesh.material.opacity = c.baseOp * (0.6 + Math.sin(t * 9) * 0.4);
          }
        }

        // === 2. 火焰粒子动画 ===
        if (cf.fireParticles) {
          for (const p of cf.fireParticles) {
            if (!p.active) {
              p.timer -= dt;
              if (p.timer <= 0 && fireActive) {
                p.active = true;
                p.life = 0;
                p.maxLife = 0.3 + Math.random() * 0.6;
                p.vx = (Math.random() - 0.5) * 0.5;
                p.vy = 0.8 + Math.random() * 2;
                p.vz = (Math.random() - 0.5) * 0.5;
                p.mesh.position.set(
                  (Math.random() - 0.5) * 0.4,
                  0.2 + Math.random() * 0.3,
                  (Math.random() - 0.5) * 0.4
                );
                p.mesh.visible = true;
                p.mesh.scale.setScalar(p.baseScale);
                // 随机颜色
                p.mesh.material.color.setHSL(0.05 + Math.random() * 0.08, 1, 0.4 + Math.random() * 0.4);
              }
            } else {
              p.life += dt;
              const progress = p.life / p.maxLife;
              if (progress >= 1) {
                p.active = false;
                p.mesh.visible = false;
                p.timer = Math.random() * 0.3;
              } else {
                p.mesh.position.x += p.vx * dt;
                p.mesh.position.y += p.vy * dt;
                p.mesh.position.z += p.vz * dt;
                // 向上加速
                p.vy += dt * 0.5;
                // 变小变暗
                const s = (1 - progress) * p.baseScale;
                p.mesh.scale.setScalar(s);
                p.mesh.material.opacity = (1 - progress) * nightFactor;
              }
            }
          }
        }

        // === 3. 火星粒子动画 ===
        if (cf.embers && nightFactor > 0.3) {
          for (const e of cf.embers) {
            if (!e.active) {
              e.timer -= dt;
              if (e.timer <= 0) {
                e.active = true;
                e.life = 0;
                e.maxLife = 0.5 + Math.random() * 1.5;
                e.vx = (Math.random() - 0.5) * 0.8;
                e.vy = 1.5 + Math.random() * 3;
                e.vz = (Math.random() - 0.5) * 0.8;
                e.mesh.position.set(
                  (Math.random() - 0.5) * 0.4,
                  0.5 + Math.random() * 0.5,
                  (Math.random() - 0.5) * 0.4
                );
                e.mesh.visible = true;
                e.mesh.scale.setScalar(e.baseScale);
              }
            } else {
              e.life += dt;
              const progress = e.life / e.maxLife;
              if (progress >= 1) {
                e.active = false;
                e.mesh.visible = false;
                e.timer = 0.3 + Math.random() * 1.5;
              } else {
                e.mesh.position.x += e.vx * dt;
                e.mesh.position.y += e.vy * dt;
                e.mesh.position.z += e.vz * dt;
                e.vy += dt * 0.3;
                e.vx += Math.sin(now * 3 + e.life * 5) * 0.2 * dt;
                const s = (1 - progress) * e.baseScale;
                e.mesh.scale.setScalar(s);
                e.mesh.material.opacity = (1 - progress) * nightFactor;
              }
            }
          }
        } else if (cf.embers) {
          for (const e of cf.embers) {
            e.mesh.visible = false;
            e.active = false;
          }
        }

        // === 4. 烟雾粒子动画 ===
        if (cf.smokes && nightFactor > 0.2) {
          for (const s of cf.smokes) {
            if (!s.active) {
              s.timer -= dt;
              if (s.timer <= 0) {
                s.active = true;
                s.life = 0;
                s.maxLife = 2 + Math.random() * 3;
                s.vx = (Math.random() - 0.5) * 0.2;
                s.vy = 0.5 + Math.random() * 0.5;
                s.vz = (Math.random() - 0.5) * 0.2;
                s.mesh.position.set(
                  (Math.random() - 0.5) * 0.3,
                  0.8 + Math.random() * 0.3,
                  (Math.random() - 0.5) * 0.3
                );
                s.mesh.visible = true;
                s.mesh.scale.setScalar(s.baseScale);
                s.mesh.material.opacity = 0.15;
              }
            } else {
              s.life += dt;
              const progress = s.life / s.maxLife;
              if (progress >= 1) {
                s.active = false;
                s.mesh.visible = false;
                s.timer = 1 + Math.random() * 2;
              } else {
                s.mesh.position.x += s.vx * dt;
                s.mesh.position.y += s.vy * dt;
                s.mesh.position.z += s.vz * dt;
                s.vx += Math.sin(now + s.life) * 0.05 * dt;
                const sScale = s.baseScale * (1 + progress * 2);
                s.mesh.scale.setScalar(sScale);
                s.mesh.material.opacity = 0.15 * (1 - progress) * nightFactor;
              }
            }
          }
        } else if (cf.smokes) {
          for (const s of cf.smokes) {
            s.mesh.visible = false;
            s.active = false;
          }
        }
      }
    }

    // 防御波次自动推进
    if (this.phase === 'defend' && this.defenseWaveActive && this.defenseEnemies) {
      const aliveCount = this.defenseEnemies.filter(e => e && !e.dead && e.mesh).length;
      if (aliveCount === 0 && this.defenseEnemies.length > 0) {
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

    // 更新防御阶段波次面板
    this.updateDefenseUI();

    // 更新孤岛基地剧情系统
    if (window.IslandStory && IslandStory.phase !== 'idle') {
      IslandStory.update(dt);
    }
  },

  // 更新防御阶段顶部波次面板（与顶部红色波次一致）
  updateDefenseUI() {
    if (!this.active || !this.defenseWaveActive) return;
    const waveNumEl = document.getElementById('wave-num');
    const enemyCountEl = document.getElementById('enemy-count');
    if (waveNumEl) waveNumEl.textContent = `第 ${this.defenseWave} 波`;
    if (enemyCountEl) {
      const waveEnemies = this.defenseEnemies ? this.defenseEnemies.filter(e => e && !e.dead && e.mesh).length : 0;
      const wanderEnemies = this.wanderZombies ? this.wanderZombies.filter(z => z && !z.dead && z.mesh).length : 0;
      enemyCountEl.textContent = `剩余敌人: ${waveEnemies + wanderEnemies}`;
    }
  },

  // 检查新位置是否与房屋或城墙碰撞体重叠
  _checkVillagerCollision(newX, newZ, villagerRadius) {
    if (typeof window.colliders === 'undefined' || !window.colliders) return false;
    const r = villagerRadius || 0.5;
    for (const c of window.colliders) {
      if (c.type === 'house' || c.type === 'cityWall') {
        if (Math.abs(newX - c.x) < (c.hw + r) && Math.abs(newZ - c.z) < (c.hd + r)) {
          return true; // 碰撞
        }
      }
    }
    return false;
  },

  // 获取房屋的门对象
  _getHouseDoor(house) {
    // 在场景中查找对应的房屋group
    const houseX = house.x;
    const houseZ = house.z;
    for (let i = 0; i < this.scene.children.length; i++) {
      const child = this.scene.children[i];
      if (child.name === 'desertHouse' &&
          Math.abs(child.position.x - houseX) < 0.1 &&
          Math.abs(child.position.z - houseZ) < 0.1) {
        return child.userData.door || null;
      }
    }
    return null;
  },

  // 设置门的打开/关闭状态
  _setDoorOpen(house, open) {
    const door = this._getHouseDoor(house);
    if (!door) return;
    const targetRot = open ? -Math.PI / 2 : 0;
    door.userData.targetRotation = targetRot;
    // 更新门的碰撞体：开门时移除，关门时添加
    this._updateDoorCollider(house, door, open);
  },

  // 更新门的碰撞体
  _updateDoorCollider(house, door, open) {
    if (!window.colliders) return;
    // 门的世界位置
    const worldPos = new THREE.Vector3();
    door.getWorldPosition(worldPos);
    // 查找并移除旧的门碰撞体
    for (let i = window.colliders.length - 1; i >= 0; i--) {
      const c = window.colliders[i];
      if (c && c.type === 'door' && c._houseKey === house.x + '_' + house.z) {
        window.colliders.splice(i, 1);
      }
    }
    // 关门时添加门碰撞体
    if (!open && typeof window.addCollider === 'function') {
      const collider = window.addCollider(worldPos.x, worldPos.z, 0.6, 0.15, 1.8, 'door', true);
      if (collider) collider._houseKey = house.x + '_' + house.z;
    }
  },

  // 更新门动画
  _updateDoors(dt) {
    for (let i = 0; i < this.scene.children.length; i++) {
      const child = this.scene.children[i];
      if (child.name === 'desertHouse' && child.userData.door) {
        const door = child.userData.door;
        if (door.userData.targetRotation !== undefined) {
          const diff = door.userData.targetRotation - door.rotation.y;
          if (Math.abs(diff) > 0.01) {
            door.rotation.y += diff * Math.min(1, dt * 5);
          } else {
            door.rotation.y = door.userData.targetRotation;
            // 门动画完成，更新碰撞体
            const house = child.userData.houseData;
            if (house) {
              this._updateDoorCollider(house, door, door.userData.targetRotation !== 0);
            }
          }
        }
      }
    }
  },

  // 村民AI状态机
  _updateVillagers(dt) {
    if (!this.npcs) return;

    // 更新门动画
    this._updateDoors(dt);

    for (const npc of this.npcs) {
      if (!npc.isVillager || !npc.mesh || !npc.house) continue;

      const house = npc.house;
      const pos = npc.mesh.position;
      const speed = npc.speed * dt;
      const doorX = house.doorX;
      const doorZ = house.doorZ;

      // 更新状态计时器
      if (npc.stateTimer > 0) {
        npc.stateTimer -= dt;
      }

      switch (npc.state) {
        case 'outside': {
          // 在房屋外游荡，范围限制在营地道路/空地
          const dx = npc.targetX - pos.x;
          const dz = npc.targetZ - pos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist > 0.3) {
            const moveX = (dx / dist) * speed;
            const moveZ = (dz / dist) * speed;
            const newX = pos.x + moveX;
            const newZ = pos.z + moveZ;

            // 碰撞检测：检查新位置是否与房屋或城墙重叠
            if (!this._checkVillagerCollision(newX, newZ, 0.5)) {
              pos.x = newX;
              pos.z = newZ;
              npc.mesh.lookAt(npc.targetX, pos.y, npc.targetZ);
            } else {
              // 碰撞，选择新目标
              npc.targetX = Math.max(5, Math.min(38, house.doorX + (Math.random() - 0.5) * 12));
              npc.targetZ = Math.max(5, Math.min(35, house.doorZ + (Math.random() - 0.5) * 12));
            }
          }

          // 随机决定回家（每30-60秒有概率）
          if (npc.stateTimer <= 0) {
            if (Math.random() < 0.4) {
              npc.state = 'going_home';
              npc.targetX = doorX;
              npc.targetZ = doorZ;
            } else {
              // 继续游荡，选择新目标
              npc.targetX = Math.max(5, Math.min(38, house.doorX + (Math.random() - 0.5) * 12));
              npc.targetZ = Math.max(5, Math.min(35, house.doorZ + (Math.random() - 0.5) * 12));
              npc.stateTimer = 10 + Math.random() * 15;
            }
          }
          break;
        }

        case 'going_home': {
          const dx = doorX - pos.x;
          const dz = doorZ - pos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist > 0.5) {
            const moveX = (dx / dist) * speed;
            const moveZ = (dz / dist) * speed;
            const newX = pos.x + moveX;
            const newZ = pos.z + moveZ;

            if (!this._checkVillagerCollision(newX, newZ, 0.5)) {
              pos.x = newX;
              pos.z = newZ;
              npc.mesh.lookAt(doorX, pos.y, doorZ);
            } else {
              // 被阻挡，尝试绕路：稍微偏移目标
              npc.targetX = doorX + (Math.random() - 0.5) * 2;
              npc.targetZ = doorZ + (Math.random() - 0.5) * 2;
            }
          } else {
            // 到达门前
            npc.state = 'entering';
            npc.stateTimer = 1.0; // 开门动画时间
            this._setDoorOpen(house, true);
          }
          break;
        }

        case 'entering': {
          // 播放开门动画，然后进入房屋内
          if (npc.stateTimer <= 0) {
            npc.state = 'inside';
            // 进入房屋内部随机位置
            npc.targetX = house.x + 1 + Math.random() * 3;
            npc.targetZ = house.z + 1 + Math.random() * 2.5;
            npc.stateTimer = 10 + Math.random() * 20; // 在屋内待10-30秒
            // 进入后关门
            this._setDoorOpen(house, false);
          }
          break;
        }

        case 'inside': {
          // 在房屋内随机走动
          const dx = npc.targetX - pos.x;
          const dz = npc.targetZ - pos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist > 0.3) {
            const moveX = (dx / dist) * speed;
            const moveZ = (dz / dist) * speed;
            pos.x += moveX;
            pos.z += moveZ;
            npc.mesh.lookAt(npc.targetX, pos.y, npc.targetZ);
          } else {
            // 到达内部目标，选择新内部目标
            npc.targetX = house.x + 0.5 + Math.random() * 4;
            npc.targetZ = house.z + 0.5 + Math.random() * 3;
          }

          // 限制在房屋内部
          pos.x = Math.max(house.x + 0.3, Math.min(house.x + 4.7, pos.x));
          pos.z = Math.max(house.z + 0.3, Math.min(house.z + 3.7, pos.z));

          // 随机决定出门
          if (npc.stateTimer <= 0 && Math.random() < 0.3) {
            npc.state = 'exiting';
            npc.targetX = doorX;
            npc.targetZ = doorZ;
            this._setDoorOpen(house, true);
          }
          break;
        }

        case 'exiting': {
          const dx = doorX - pos.x;
          const dz = doorZ - pos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist > 0.5) {
            const moveX = (dx / dist) * speed;
            const moveZ = (dz / dist) * speed;
            pos.x += moveX;
            pos.z += moveZ;
            npc.mesh.lookAt(doorX, pos.y, doorZ);
          } else {
            // 走到门外
            npc.state = 'outside';
            npc.targetX = doorX + (Math.random() - 0.5) * 6;
            npc.targetZ = doorZ + 1.5 + Math.random() * 4;
            npc.stateTimer = 15 + Math.random() * 30; // 在外面待15-45秒
            this._setDoorOpen(house, false);
          }
          break;
        }
      }

      // 更新村民位置记录
      npc.x = pos.x;
      npc.z = pos.z;

      // 更新碰撞体位置
      if (npc.collider) {
        npc.collider.x = pos.x;
        npc.collider.z = pos.z;
      }

      // 骨骼动画
      if (npc.bones) {
        npc.animTime += dt;
        // 只有真正在移动时才播放行走动画（距离目标>0.3且状态为移动态）
        const dx = npc.targetX - pos.x;
        const dz = npc.targetZ - pos.z;
        const distToTarget = Math.sqrt(dx * dx + dz * dz);
        const isMoving = distToTarget > 0.3 && (npc.state === 'outside' || npc.state === 'going_home' || npc.state === 'exiting');
        const isIdle = !isMoving && (npc.state === 'entering' || npc.state === 'inside' || npc.state === 'outside');
        if (isMoving) {
          this._animateVillagerWalk(npc.bones, npc.animTime, npc.speed);
        } else if (isIdle) {
          this._animateVillagerIdle(npc.bones, npc.animTime);
        }
      }
    }
  },

  // ====== 通用建筑生成器 ======
  // 从方块数据生成建筑模型，每个方块有碰撞体
  buildFromBlocks(blockData, offsetX, offsetZ, namePrefix) {
    const group = new THREE.Group();
    blockData.forEach(b => {
      const mat = new THREE.MeshLambertMaterial({ color: b.color || 0x9E8B6B });
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x + (offsetX || 0), b.y, b.z + (offsetZ || 0));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = namePrefix || 'building_block';
      group.add(mesh);
    });
    this.scene.add(group);
    return group;
  },

  // ====== 沙漠怪物模型构建器 ======
  createScorpionModel() {
    const group = new THREE.Group();

    // === 材质定义 ===
    const matSandYellow = new THREE.MeshLambertMaterial({ color: 0xC4A35A });
    const matSandDark = new THREE.MeshLambertMaterial({ color: 0xB8935A });
    const matBrown = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    const matDarkBrown = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
    const matTail1 = new THREE.MeshLambertMaterial({ color: 0xA07840 });
    const matTail2 = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    const matTail3 = new THREE.MeshLambertMaterial({ color: 0x7B5B3A });
    const matTail4 = new THREE.MeshLambertMaterial({ color: 0x6B4226 });
    const matStinger = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    const matEye = new THREE.MeshLambertMaterial({ color: 0x111111 });

    function addBlock(w, h, d, x, y, z, mat) {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      return mesh;
    }

    // === 头胸部 (cephalothorax) ===
    // 宽扁身体 3x0.8x2.5, 中心在 Y=0.5 (被腿支撑)
    const thorax = addBlock(3, 0.8, 2.5, 0, 0.5, 0, matSandYellow);
    group.add(thorax);

    // === 腹部 (mesosoma) - 5节, 逐渐变窄, 在胸部后方 ===
    const abdomenZStart = -1.25; // 胸部后端
    const abdomenWidths = [2.4, 2.1, 1.8, 1.5, 1.2];
    const abdomenHeights = [0.7, 0.65, 0.6, 0.55, 0.5];
    const abdomenColors = [matSandYellow, matSandDark, matSandYellow, matSandDark, matSandYellow];
    for (let i = 0; i < 5; i++) {
      const seg = addBlock(
        abdomenWidths[i], abdomenHeights[i], 0.4,
        0, 0.5 - (0.7 - abdomenHeights[i]) / 2,
        abdomenZStart - 0.2 - i * 0.45,
        abdomenColors[i]
      );
      group.add(seg);
    }

    // === 尾巴 (metasoma) - 5节弯曲向上, 使用嵌套Group实现弧线 ===
    const tailBaseZ = abdomenZStart - 0.2 - 4 * 0.45 - 0.2; // 腹部末端
    const tailBaseY = 0.5;
    const tailColors = [matTail1, matTail2, matTail3, matTail4, matTail4];
    const tailSizes = [
      { w: 0.5, h: 0.5, d: 0.5 },
      { w: 0.45, h: 0.45, d: 0.45 },
      { w: 0.4, h: 0.4, d: 0.4 },
      { w: 0.35, h: 0.35, d: 0.35 },
      { w: 0.3, h: 0.3, d: 0.3 },
    ];
    const tailAngles = [25, 30, 35, 40, 45]; // 每节旋转角度(度)
    const tailLengths = [0.5, 0.5, 0.5, 0.5, 0.5];

    // 创建尾巴根组，用于攻击动画
    const scorpionTailGroup = new THREE.Group();
    group.add(scorpionTailGroup);

    let tailParent = scorpionTailGroup;
    for (let i = 0; i < 5; i++) {
      const segGroup = new THREE.Group();
      segGroup.position.set(0, tailLengths[i] / 2, -tailLengths[i] / 2);
      const seg = addBlock(tailSizes[i].w, tailSizes[i].h, tailSizes[i].d, 0, 0, 0, tailColors[i]);
      segGroup.add(seg);
      // 旋转使尾巴向上弯曲
      segGroup.rotation.x = -tailAngles[i] * Math.PI / 180;
      tailParent.add(segGroup);
      // 下一节的挂载点在当前节末端
      const nextGroup = new THREE.Group();
      nextGroup.position.set(0, tailLengths[i] / 2, -tailLengths[i] / 2);
      segGroup.add(nextGroup);
      tailParent = nextGroup;
    }
    // 尾巴根组定位到腹部末端
    tailParent.parent.parent.parent.parent.parent.position.set(0, tailBaseY, tailBaseZ);

    // === 毒刺 (stinger) ===
    const stingerGroup = new THREE.Group();
    const stinger = addBlock(0.15, 0.4, 0.15, 0, 0.2, -0.2, matStinger);
    stingerGroup.add(stinger);
    // 尖端
    const stingerTip = addBlock(0.08, 0.25, 0.08, 0, 0.5, -0.25, matStinger);
    stingerGroup.add(stingerTip);
    tailParent.add(stingerGroup);

    // 存储尾巴组引用，用于攻击动画
    group.userData.tailGroup = scorpionTailGroup;
    group.userData.stingerTipRef = stingerTip;

    // === 钳子 (Pincers) - 左右各一个, 每个有3段+双爪 ===
    function createPincer(side) {
      // side: 1 = right, -1 = left
      const pincerGroup = new THREE.Group();

      // 上臂 - 从胸部前端侧面伸出
      const upperArm = addBlock(0.5, 0.5, 1.5, side * 0.8, 0.5, 0.8, matBrown);
      pincerGroup.add(upperArm);

      // 下臂 - 从上臂末端向前延伸
      const lowerArm = addBlock(0.4, 0.4, 1.2, side * 0.8, 0.5, 1.8, matBrown);
      pincerGroup.add(lowerArm);

      // 关节球
      const joint = addBlock(0.5, 0.5, 0.5, side * 0.8, 0.5, 2.3, matBrown);
      pincerGroup.add(joint);

      // 上爪 - 张开状态
      const upperClaw = addBlock(0.3, 0.15, 1.0, side * 0.8, 0.7, 2.9, matBrown);
      pincerGroup.add(upperClaw);

      // 下爪 - 张开状态
      const lowerClaw = addBlock(0.3, 0.15, 1.0, side * 0.8, 0.3, 2.9, matBrown);
      pincerGroup.add(lowerClaw);

      // 爪尖内侧突起 (上)
      const upperTip = addBlock(0.25, 0.12, 0.3, side * 0.8, 0.65, 3.35, matBrown);
      pincerGroup.add(upperTip);

      // 爪尖内侧突起 (下)
      const lowerTip = addBlock(0.25, 0.12, 0.3, side * 0.8, 0.35, 3.35, matBrown);
      pincerGroup.add(lowerTip);

      return pincerGroup;
    }

    group.add(createPincer(1));   // 右钳
    group.add(createPincer(-1));  // 左钳

    // === 8条腿 - 每侧4条, 每条腿2段 ===
    function createLeg(side, zOffset, upperLen, lowerLen) {
      const legGroup = new THREE.Group();
      // 上腿 - 向外下方延伸
      const upper = addBlock(0.15, 0.15, upperLen, side * 0.5, 0.35, zOffset, matDarkBrown);
      upper.rotation.z = side * -0.5; // 向外倾斜
      legGroup.add(upper);
      // 下腿 - 向下延伸到地面
      const lower = addBlock(0.15, 0.15, lowerLen, side * (0.5 + upperLen * 0.7), 0.15, zOffset, matDarkBrown);
      legGroup.add(lower);
      return legGroup;
    }

    // 右侧4条腿 (side=1)
    const legZPositions = [0.8, 0.3, -0.3, -0.8];
    const legUpperLens = [0.8, 0.9, 0.9, 0.8];
    const legLowerLens = [0.4, 0.45, 0.45, 0.4];
    for (let i = 0; i < 4; i++) {
      group.add(createLeg(1, legZPositions[i], legUpperLens[i], legLowerLens[i]));
      group.add(createLeg(-1, legZPositions[i], legUpperLens[i], legLowerLens[i]));
    }

    // === 眼睛 ===
    const leftEye = addBlock(0.12, 0.12, 0.12, -0.3, 0.95, 1.2, matEye);
    group.add(leftEye);
    const rightEye = addBlock(0.12, 0.12, 0.12, 0.3, 0.95, 1.2, matEye);
    group.add(rightEye);

    group.name = 'desertMonster_scorpion';
    return group;
  },

  createSandwormModel() {
    const group = new THREE.Group();

    // === 材质定义 ===
    const matGoldenrod = new THREE.MeshLambertMaterial({ color: 0xB8860B });
    const matDarkGoldenrod = new THREE.MeshLambertMaterial({ color: 0xA07840 });
    const matDarkBrown = new THREE.MeshLambertMaterial({ color: 0x6B4226 });
    const matMouthRim = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    const matMouthInterior = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    const matTooth = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });

    function addBlock(w, h, d, x, y, z, mat) {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      return mesh;
    }

    // === 头部 - 大方块头 2x2x2 ===
    const headY = 1.5;
    const headZ = 0;
    group.add(addBlock(2, 2, 2, 0, headY, headZ, matGoldenrod));

    // === 上下颌组 (用于攻击咬合动画) ===
    const mouthZ = headZ + 1.05; // 头部前面
    const sandwormJawUpper = new THREE.Group();
    const sandwormJawLower = new THREE.Group();
    sandwormJawUpper.position.set(0, headY, mouthZ);
    sandwormJawLower.position.set(0, headY, mouthZ);
    group.add(sandwormJawUpper);
    group.add(sandwormJawLower);

    // === 圆形口腔 - 8个小方块排列成环状 (半径~0.8) ===
    const mouthRadius = 0.8;
    const mouthBlockSize = 0.3;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const mx = Math.cos(angle) * mouthRadius;
      const my = Math.sin(angle) * mouthRadius;
      // 上半部分放入上颌，下半部分放入下颌
      if (Math.sin(angle) >= 0) {
        sandwormJawUpper.add(addBlock(mouthBlockSize, mouthBlockSize, 0.2, mx, my, 0, matMouthRim));
      } else {
        sandwormJawLower.add(addBlock(mouthBlockSize, mouthBlockSize, 0.2, mx, my, 0, matMouthRim));
      }
    }

    // === 口腔内部 ===
    sandwormJawUpper.add(addBlock(1.2, 0.6, 0.15, 0, 0.3, 0.1, matMouthInterior));
    sandwormJawLower.add(addBlock(1.2, 0.6, 0.15, 0, -0.3, 0.1, matMouthInterior));

    // === 牙齿 - 8个小尖牙指向内 ===
    const toothCount = 8;
    for (let i = 0; i < toothCount; i++) {
      const angle = (i / toothCount) * Math.PI * 2;
      const tx = Math.cos(angle) * 0.55;
      const ty = Math.sin(angle) * 0.55;
      // 牙齿指向中心, 稍微旋转
      const tooth = addBlock(0.1, 0.15, 0.05, tx, ty, 0.15, matTooth);
      tooth.rotation.y = -angle;
      if (Math.sin(angle) >= 0) {
        sandwormJawUpper.add(tooth);
      } else {
        sandwormJawLower.add(tooth);
      }
    }

    // 存储上下颌引用，用于攻击动画
    group.userData.jawUpper = sandwormJawUpper;
    group.userData.jawLower = sandwormJawLower;

    // === 身体节段 - 6节, 从大到小, Y逐渐降低(从沙中升起) ===
    const segments = [
      { w: 1.8, h: 1.8, d: 1.2, y: 1.2, color: matGoldenrod },
      { w: 1.6, h: 1.6, d: 1.2, y: 0.9, color: matDarkGoldenrod },
      { w: 1.4, h: 1.4, d: 1.2, y: 0.6, color: matGoldenrod },
      { w: 1.2, h: 1.2, d: 1.2, y: 0.35, color: matDarkGoldenrod },
      { w: 1.0, h: 1.0, d: 1.0, y: 0.15, color: matGoldenrod },
      { w: 0.7, h: 0.7, d: 0.8, y: 0.05, color: matDarkGoldenrod },
    ];

    let segZ = headZ - 1.2; // 头部后方开始
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      // 确保Y >= 0
      const segY = Math.max(0, seg.y) + seg.h / 2;
      group.add(addBlock(seg.w, seg.h, seg.d, 0, segY, segZ - seg.d / 2, seg.color));

      // 节段环纹 - 每节前后各一个深色环
      const ringW = seg.w + 0.1;
      const ringH = seg.h + 0.1;
      const ringD = 0.08;
      group.add(addBlock(ringW, ringH, ringD, 0, segY, segZ - 0.1, matDarkBrown));
      group.add(addBlock(ringW, ringH, ringD, 0, segY, segZ - seg.d + 0.1, matDarkBrown));

      segZ -= seg.d;
    }

    group.name = 'desertMonster_sandworm';
    return group;
  },

  createVultureModel() {
    const group = new THREE.Group();

    // === 材质定义 ===
    const matBody = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });       // 深灰黑身体
    const matHeadSkin = new THREE.MeshLambertMaterial({ color: 0x7B8FA1 });    // 秃头铅蓝色皮肤
    const matNeckSkin = new THREE.MeshLambertMaterial({ color: 0x6B7B8D });   // 蓝灰色颈部皮肤
    const matRuff = new THREE.MeshLambertMaterial({ color: 0xC4B49A });        // 浅棕色羽毛领
    const matBeak = new THREE.MeshLambertMaterial({ color: 0x3E2723 });        // 深棕色喙
    const matEye = new THREE.MeshLambertMaterial({ color: 0x5D4037 });          // 棕色眼睛
    const matWingInner = new THREE.MeshLambertMaterial({ color: 0x3B2F2F });   // 翅膀内侧
    const matWingMid = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });     // 翅膀中段
    const matWingOuter = new THREE.MeshLambertMaterial({ color: 0x1A1A2E });   // 翅膀外侧深色
    const matWingTip = new THREE.MeshLambertMaterial({ color: 0x111111 });    // 黑色翼尖
    const matTail = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });        // 尾巴
    const matLeg = new THREE.MeshLambertMaterial({ color: 0x808080 });          // 灰色腿

    function addBlock(w, h, d, x, y, z, mat) {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      return mesh;
    }

    // === 身体 - 椭圆躯干 1.2x1x1.5 ===
    group.add(addBlock(1.2, 1.0, 1.5, 0, 0, 0, matBody));

    // === 秃头 - 无羽毛皮肤色, 在身体前上方 ===
    group.add(addBlock(0.6, 0.7, 0.8, 0, 0.85, 0.9, matHeadSkin));

    // === 颈部 - 长细颈连接头和身体 ===
    group.add(addBlock(0.3, 0.8, 0.3, 0, 0.5, 0.7, matNeckSkin));

    // === 颈部羽毛领 (ruff) - 环绕颈基部的环状羽毛 ===
    const ruffRadius = 0.5;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const rx = Math.cos(angle) * ruffRadius;
      const ry = Math.sin(angle) * ruffRadius * 0.6 + 0.3;
      group.add(addBlock(0.25, 0.2, 0.15, rx, ry, 0.5, matRuff));
    }

    // === 钩状喙 - 3段向下弯曲 ===
    // 基部
    group.add(addBlock(0.25, 0.2, 0.3, 0, 0.75, 1.45, matBeak));
    // 中段 - 稍低
    group.add(addBlock(0.2, 0.15, 0.25, 0, 0.6, 1.65, matBeak));
    // 尖端 - 更低(钩状弯曲)
    group.add(addBlock(0.15, 0.1, 0.15, 0, 0.45, 1.8, matBeak));

    // === 眼睛 - 头部两侧 ===
    group.add(addBlock(0.1, 0.1, 0.1, -0.3, 0.95, 1.0, matEye));
    group.add(addBlock(0.1, 0.1, 0.1, 0.3, 0.95, 1.0, matEye));

    // === 翅膀 - 每侧5段, 水平展开(飞行姿态) ===
    function createWing(side) {
      // side: 1 = right, -1 = left
      const wingGroup = new THREE.Group();

      // 内翼
      wingGroup.add(addBlock(1.5, 0.15, 0.8, side * 1.1, 0.1, 0, matWingInner));
      // 中翼
      wingGroup.add(addBlock(1.2, 0.12, 0.7, side * 2.2, 0.12, -0.1, matWingMid));
      // 外翼
      wingGroup.add(addBlock(1.0, 0.1, 0.6, side * 3.1, 0.14, -0.15, matWingOuter));
      // 初级飞羽1
      wingGroup.add(addBlock(0.8, 0.08, 0.15, side * 3.8, 0.15, -0.2, matWingOuter));
      // 初级飞羽2 (黑色翼尖)
      wingGroup.add(addBlock(0.6, 0.08, 0.12, side * 4.3, 0.16, -0.22, matWingTip));

      return wingGroup;
    }

    const rightWing = createWing(1);
    const leftWing = createWing(-1);
    group.add(rightWing);   // 右翼
    group.add(leftWing);    // 左翼

    // 存储翅膀引用，用于俯冲攻击动画
    group.userData.rightWing = rightWing;
    group.userData.leftWing = leftWing;

    // === 尾巴 - 短扇形 ===
    group.add(addBlock(0.8, 0.15, 0.5, 0, 0.05, -0.9, matTail));
    group.add(addBlock(0.6, 0.12, 0.4, 0, 0.08, -1.2, matTail));
    group.add(addBlock(0.4, 0.1, 0.3, 0, 0.1, -1.45, matTail));

    // === 腿 - 细长下垂 ===
    // 左腿
    group.add(addBlock(0.12, 1.0, 0.12, -0.2, -0.5, 0.1, matLeg));
    // 左爪
    group.add(addBlock(0.15, 0.1, 0.1, -0.2, -1.05, 0.15, matLeg));
    // 右腿
    group.add(addBlock(0.12, 1.0, 0.12, 0.2, -0.5, 0.1, matLeg));
    // 右爪
    group.add(addBlock(0.15, 0.1, 0.1, 0.2, -1.05, 0.15, matLeg));

    group.name = 'desertMonster_vulture';
    return group;
  },

  // 生成单个民房（基于方块模型的精细木屋）
  // 模型尺寸：宽5，深4，高4.8
  // 方块从(0,0,0)开始，实际占据x∈[0,5], z∈[0,4]
  // 模型中心在 (x+2.5, z+2.0)
  createHouse(x, z, rotation, style) {
    const group = new THREE.Group();
    
    // 颜色根据风格调整
    const isStone = style === 'stone';
    const wallColor = isStone ? 0xA09070 : 0xC17F3A;
    const roofColor = isStone ? 0x706050 : 0xD4953A;
    const ridgeColor = isStone ? 0x605040 : 0xE8A84A;
    const cornerColor = isStone ? 0x807060 : 0x8B5A2B;
    const doorColor = 0x6B3E1F;
    const windowColor = 0x87CEEB;
    const foundationColor = 0x4A4A4A;
    const chimneyColor = 0x8B5A3C;
    
    // 方块模型数据（与desert-house.json一致）
    const blocks = [
      // 地基
      { x: -0.2, y: 0, z: -0.2, w: 5.4, h: 0.3, d: 4.4, color: foundationColor },
      // 正面墙（带门框）
      { x: 0, y: 0.3, z: 3.8, w: 1.4, h: 2.5, d: 0.3, color: wallColor },
      { x: 2.6, y: 0.3, z: 3.8, w: 2.4, h: 2.5, d: 0.3, color: wallColor },
      { x: 1.4, y: 2.0, z: 3.8, w: 1.2, h: 0.8, d: 0.3, color: wallColor },
      // 背面墙
      { x: 0, y: 0.3, z: 0, w: 5, h: 2.5, d: 0.3, color: wallColor },
      // 左侧墙
      { x: 0, y: 0.3, z: 0.3, w: 0.3, h: 2.5, d: 3.5, color: wallColor },
      // 右侧墙
      { x: 4.7, y: 0.3, z: 0.3, w: 0.3, h: 2.5, d: 3.5, color: wallColor },
      // 角落加固木柱（移到墙外侧，避免Z-fighting闪烁）
      { x: -0.2, y: 0.3, z: -0.2, w: 0.4, h: 2.5, d: 0.4, color: cornerColor },
      { x: 5.0, y: 0.3, z: -0.2, w: 0.4, h: 2.5, d: 0.4, color: cornerColor },
      { x: -0.2, y: 0.3, z: 4.1, w: 0.4, h: 2.5, d: 0.4, color: cornerColor },
      { x: 5.0, y: 0.3, z: 4.1, w: 0.4, h: 2.5, d: 0.4, color: cornerColor },
      // 门
      { x: 1.5, y: 0.3, z: 4.1, w: 1.0, h: 1.7, d: 0.1, color: doorColor },
      // 门把手
      { x: 2.2, y: 1.1, z: 4.15, w: 0.1, h: 0.1, d: 0.05, color: 0xC0C0C0 },
      // 门前台阶
      { x: 1.3, y: 0, z: 4.2, w: 1.4, h: 0.15, d: 0.4, color: 0x9E9E9E },
      // 窗户
      { x: 3.2, y: 1.0, z: 4.1, w: 1.0, h: 0.8, d: 0.1, color: windowColor },
      // 窗框
      { x: 3.1, y: 0.9, z: 4.15, w: 1.2, h: 0.1, d: 0.05, color: cornerColor },
      { x: 3.1, y: 1.8, z: 4.15, w: 1.2, h: 0.1, d: 0.05, color: cornerColor },
      { x: 3.1, y: 0.9, z: 4.15, w: 0.1, h: 1.0, d: 0.05, color: cornerColor },
      { x: 4.2, y: 0.9, z: 4.15, w: 0.1, h: 1.0, d: 0.05, color: cornerColor },
      // 屋顶底层（宽檐）
      { x: -0.5, y: 2.8, z: -0.5, w: 6.0, h: 0.3, d: 5.0, color: roofColor },
      // 屋顶中层
      { x: -0.2, y: 3.1, z: -0.2, w: 5.4, h: 0.4, d: 4.4, color: roofColor },
      // 屋顶顶层（屋脊）
      { x: 0.2, y: 3.5, z: 0.0, w: 4.6, h: 0.4, d: 4.0, color: ridgeColor },
      // 屋脊线
      { x: 2.2, y: 3.9, z: 0.0, w: 0.6, h: 0.2, d: 4.0, color: roofColor },
      // 老虎窗底座
      { x: 3.0, y: 3.5, z: 1.5, w: 1.2, h: 0.4, d: 1.0, color: roofColor },
      // 老虎窗窗框
      { x: 3.1, y: 3.7, z: 1.6, w: 1.0, h: 0.6, d: 0.8, color: wallColor },
      // 老虎窗玻璃
      { x: 3.2, y: 3.8, z: 2.3, w: 0.8, h: 0.4, d: 0.1, color: windowColor },
      // 老虎窗屋顶
      { x: 2.9, y: 4.3, z: 1.4, w: 1.4, h: 0.2, d: 1.2, color: ridgeColor },
      // 烟囱
      { x: 4.0, y: 2.8, z: 0.5, w: 0.5, h: 1.5, d: 0.5, color: chimneyColor },
      { x: 4.0, y: 4.3, z: 0.5, w: 0.5, h: 0.3, d: 0.5, color: 0x6B4226 },
      { x: 3.9, y: 4.6, z: 0.4, w: 0.7, h: 0.2, d: 0.7, color: chimneyColor }
    ];
    
    // 创建所有方块
    let doorMesh = null;
    blocks.forEach(b => {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mat = new THREE.MeshLambertMaterial({ color: b.color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x + b.w / 2, b.y + b.h / 2, b.z + b.d / 2);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      // 识别门方块并保存引用（用于动画）
      if (b.x === 1.5 && b.z === 4.1 && b.w === 1.0 && b.h === 1.7 && b.d === 0.1) {
        doorMesh = mesh;
        mesh.name = 'houseDoor';
      }
    });

    // 将门保存为可引用对象
    if (doorMesh) {
      group.userData.door = doorMesh;
      doorMesh.userData.originalRotation = 0;
      doorMesh.userData.targetRotation = 0;
    }

    group.position.set(x, 0, z);
    if (rotation) group.rotation.y = rotation;
    group.name = 'desertHouse';
    // 保存房屋数据供门动画使用
    group.userData.houseData = { x, z, rotation, doorX: x + 2.0, doorZ: z + 4.1 };
    this.scene.add(group);

    // 碰撞体：模型方块从(0,0)开始，实际中心在(x+2.5, z+2.0)
    // 模型占据范围：x∈[x, x+5], z∈[z, z+4]
    if (typeof window.addCollider === 'function') {
      const w = 5.4, h = 4.8, d = 4.8; // 略大于实际模型，包含屋檐
      let hw = w / 2, hd = d / 2;
      let offsetX = 2.5; // 模型中心偏移
      let offsetZ = 2.0;
      let cx = x, cz = z;
      if (rotation && rotation !== 0) {
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        cx = x + offsetX * cos - offsetZ * sin;
        cz = z + offsetX * sin + offsetZ * cos;
        const absCos = Math.abs(cos);
        const absSin = Math.abs(sin);
        const newHw = hw * absCos + hd * absSin;
        const newHd = hw * absSin + hd * absCos;
        hw = newHw;
        hd = newHd;
      } else {
        cx = x + offsetX;
        cz = z + offsetZ;
      }
      window.addCollider(cx, cz, hw, hd, h, 'house', true);
    }
    return group;
  },

  // 居民区（基地内东南区域）
  // 6栋民房，2行3列，确保在城墙内且不与城墙重叠
  // 东墙内侧在x=37，民房最右边缘需<37，留2米间距=>x<=30
  // 南墙内侧在z=37，民房最下边缘需<37，留2米间距=>z<=30
  createResidentialArea() {
    // 第一行（北侧，z=8）：x=8, 18, 28
    this.createHouse(8, 8, 0, 'sand');
    this.createHouse(18, 8, 0, 'sand');
    this.createHouse(28, 8, 0, 'sand');

    // 第二行（南侧，z=22）：x=8, 18, 28
    this.createHouse(8, 22, 0, 'sand');
    this.createHouse(18, 22, 0, 'sand');
    this.createHouse(28, 22, 0, 'sand');
  },

  // 前哨站（联络员）- 基地内西南角
  createOutpost(x, z) {
    const group = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x6B5335 });

    // 主体（小型碉堡）
    const body = new THREE.Mesh(new THREE.BoxGeometry(6, 3.5, 5), mat);
    body.position.y = 1.75;
    body.castShadow = true;
    group.add(body);

    // 平顶
    const roof = new THREE.Mesh(new THREE.BoxGeometry(7, 0.4, 6), roofMat);
    roof.position.y = 3.7;
    roof.castShadow = true;
    group.add(roof);

    // 城垛（4个）
    const merlonMat = new THREE.MeshLambertMaterial({ color: 0x7A6345 });
    [[-2.5, 0], [2.5, 0], [-2.5, 2], [2.5, 2]].forEach(([mx, mz]) => {
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.8), merlonMat);
      merlon.position.set(mx, 4.4, mz - 2.8);
      merlon.castShadow = true;
      group.add(merlon);
    });

    // 门
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x4A3728 });
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.2), doorMat);
    door.position.set(0, 1.25, 2.6);
    group.add(door);

    // 窗户
    const winMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
    [-1.5, 1.5].forEach(wx => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.15), winMat);
      win.position.set(wx, 2, 2.6);
      group.add(win);
    });

    group.position.set(x, 0, z);
    group.name = 'desertOutpost';
    this.scene.add(group);

    // 碰撞体（精确匹配）
    if (typeof window.addCollider === 'function') {
      window.addCollider(x, z, 3.5, 3, 3.5, 'outpost', true);
    }
  },

  // ====== 城楼生成器 ======
  // 城门楼模型：宽10，深8，高10
  // 方块从(0,0,0)开始，实际占据x∈[0,10], z∈[0,8]
  // 模型中心在 (x+5, z+4)
  // 大门在正面墙中间：x∈[3.5,6.5], z≈7.5
  createGateTower(x, z, rotation) {
    const group = new THREE.Group();

    // 城楼方块数据
    const blocks = [
      // 台基（深沙色）
      { x: 0, y: 0, z: 0, w: 10, h: 1.5, d: 8, color: '#A09070' },
      { x: -0.2, y: 1.5, z: -0.2, w: 10.4, h: 0.2, d: 8.4, color: '#B8A888' },
      // 城墙主体（土黄色）
      { x: 0, y: 1.7, z: 0, w: 0.5, h: 4, d: 8, color: '#C2B280' },
      { x: 9.5, y: 1.7, z: 0, w: 0.5, h: 4, d: 8, color: '#C2B280' },
      { x: 0, y: 1.7, z: 0, w: 10, h: 4, d: 0.5, color: '#C2B280' },
      { x: 0, y: 1.7, z: 7.5, w: 3.5, h: 4, d: 0.5, color: '#C2B280' },
      { x: 6.5, y: 1.7, z: 7.5, w: 3.5, h: 4, d: 0.5, color: '#C2B280' },
      { x: 3.5, y: 3.7, z: 7.5, w: 3, h: 2, d: 0.5, color: '#C2B280' },
      // 城门洞
      { x: 3.5, y: 1.7, z: 7.3, w: 3, h: 2.5, d: 0.8, color: '#5C4033' },
      { x: 3.5, y: 4.0, z: 7.3, w: 3.4, h: 0.3, d: 0.8, color: '#8B7355' },
      // 城垛（前墙）
      { x: 0.5, y: 5.7, z: 7.5, w: 1, h: 0.6, d: 0.5, color: '#B8A888' },
      { x: 2.0, y: 5.7, z: 7.5, w: 1, h: 0.6, d: 0.5, color: '#B8A888' },
      { x: 6.5, y: 5.7, z: 7.5, w: 1, h: 0.6, d: 0.5, color: '#B8A888' },
      { x: 8.0, y: 5.7, z: 7.5, w: 1, h: 0.6, d: 0.5, color: '#B8A888' },
      { x: 9.0, y: 5.7, z: 7.5, w: 1, h: 0.6, d: 0.5, color: '#B8A888' },
      // 城垛（后墙）
      { x: 0.5, y: 5.7, z: 0, w: 1, h: 0.6, d: 0.5, color: '#B8A888' },
      { x: 2.0, y: 5.7, z: 0, w: 1, h: 0.6, d: 0.5, color: '#B8A888' },
      { x: 3.5, y: 5.7, z: 0, w: 1, h: 0.6, d: 0.5, color: '#B8A888' },
      { x: 5.0, y: 5.7, z: 0, w: 1, h: 0.6, d: 0.5, color: '#B8A888' },
      { x: 6.5, y: 5.7, z: 0, w: 1, h: 0.6, d: 0.5, color: '#B8A888' },
      { x: 8.0, y: 5.7, z: 0, w: 1, h: 0.6, d: 0.5, color: '#B8A888' },
      { x: 9.0, y: 5.7, z: 0, w: 1, h: 0.6, d: 0.5, color: '#B8A888' },
      // 城垛（左墙）
      { x: 0, y: 5.7, z: 1, w: 0.5, h: 0.6, d: 1, color: '#B8A888' },
      { x: 0, y: 5.7, z: 3, w: 0.5, h: 0.6, d: 1, color: '#B8A888' },
      { x: 0, y: 5.7, z: 5, w: 0.5, h: 0.6, d: 1, color: '#B8A888' },
      { x: 0, y: 5.7, z: 7, w: 0.5, h: 0.6, d: 1, color: '#B8A888' },
      // 城垛（右墙）
      { x: 9.5, y: 5.7, z: 1, w: 0.5, h: 0.6, d: 1, color: '#B8A888' },
      { x: 9.5, y: 5.7, z: 3, w: 0.5, h: 0.6, d: 1, color: '#B8A888' },
      { x: 9.5, y: 5.7, z: 5, w: 0.5, h: 0.6, d: 1, color: '#B8A888' },
      { x: 9.5, y: 5.7, z: 7, w: 0.5, h: 0.6, d: 1, color: '#B8A888' },
      // 一层柱廊
      { x: 1, y: 1.7, z: 2, w: 0.4, h: 4, d: 0.4, color: '#8B7355' },
      { x: 8.6, y: 1.7, z: 2, w: 0.4, h: 4, d: 0.4, color: '#8B7355' },
      { x: 1, y: 1.7, z: 6, w: 0.4, h: 4, d: 0.4, color: '#8B7355' },
      { x: 8.6, y: 1.7, z: 6, w: 0.4, h: 4, d: 0.4, color: '#8B7355' },
      // 二层楼体
      { x: 1, y: 5.7, z: 1, w: 8, h: 2.5, d: 6, color: '#C2B280' },
      { x: 0.8, y: 6.5, z: 3.5, w: 0.1, h: 1.2, d: 1.5, color: '#87CEEB' },
      { x: 9.1, y: 6.5, z: 3.5, w: 0.1, h: 1.2, d: 1.5, color: '#87CEEB' },
      // 重檐屋顶（下层）
      { x: -0.5, y: 8.2, z: -0.5, w: 11, h: 0.3, d: 9, color: '#8B6914' },
      // 重檐屋顶（上层）
      { x: 0, y: 8.5, z: 0, w: 10, h: 0.4, d: 8, color: '#A07828' },
      { x: 0.5, y: 8.9, z: 0.5, w: 9, h: 0.4, d: 7, color: '#A07828' },
      { x: 1, y: 9.3, z: 1, w: 8, h: 0.4, d: 6, color: '#B8922E' },
      // 屋脊
      { x: 4.5, y: 9.7, z: 1, w: 1, h: 0.3, d: 6, color: '#A07828' },
      // 屋脊装饰
      { x: 4.5, y: 10.0, z: 4, w: 0.6, h: 0.6, d: 0.6, color: '#8B6914' },
      { x: 4.5, y: 10.0, z: 1, w: 0.6, h: 0.6, d: 0.6, color: '#8B6914' }
    ];

    // 创建所有方块
    blocks.forEach(b => {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mat = new THREE.MeshLambertMaterial({ color: b.color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x + b.w / 2, b.y + b.h / 2, b.z + b.d / 2);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });

    group.position.set(x, 0, z);
    if (rotation) group.rotation.y = rotation;
    group.name = 'gateTower';
    this.scene.add(group);

    // 碰撞体：城门楼拆分为4个碰撞体，确保大门通道可通行
    // 使用角点包围盒法计算世界坐标，避免旋转公式错误
    // 模型局部：x∈[0,10], z∈[0,8]
    if (typeof window.addCollider === 'function') {
      const cos = rotation ? Math.cos(rotation) : 1;
      const sin = rotation ? Math.sin(rotation) : 0;

      // 辅助函数：将局部包围盒转为碰撞体
      const addBoxCollider = (minLx, minLz, maxLx, maxLz, topY) => {
        const corners = [
          { lx: minLx, lz: minLz },
          { lx: maxLx, lz: minLz },
          { lx: minLx, lz: maxLz },
          { lx: maxLx, lz: maxLz }
        ];
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (const c of corners) {
          const wx = x + c.lx * cos - c.lz * sin;
          const wz = z + c.lx * sin + c.lz * cos;
          minX = Math.min(minX, wx);
          maxX = Math.max(maxX, wx);
          minZ = Math.min(minZ, wz);
          maxZ = Math.max(maxZ, wz);
        }
        const cx = (minX + maxX) / 2;
        const cz = (minZ + maxZ) / 2;
        const hw = (maxX - minX) / 2 + 0.05;
        const hd = (maxZ - minZ) / 2 + 0.05;
        window.addCollider(cx, cz, hw, hd, topY, 'gateTower', true);
      };

      // 左侧墙体：局部x∈[0,3.5], z∈[0,8], 高度到5.7（一层）
      addBoxCollider(0, 0, 3.5, 8, 5.7);
      // 右侧墙体：局部x∈[6.5,10], z∈[0,8], 高度到5.7
      addBoxCollider(6.5, 0, 10, 8, 5.7);
      // 后侧墙体：局部x∈[3.5,6.5], z∈[0,2], 高度到5.7（堵住门洞后面）
      addBoxCollider(3.5, 0, 6.5, 2, 5.7);
      // 门洞上方横梁：局部x∈[3.5,6.5], z∈[2,8], 高度从4.2到10
      addBoxCollider(3.5, 2, 6.5, 8, 10);
      // 二层楼体：局部x∈[1,9], z∈[1,7], 高度从5.7到8.2
      addBoxCollider(1, 1, 9, 7, 8.2);
    }
    return group;
  },

  // ====== 城墙段生成器（无旋转版本）======
  // 直接在世界坐标生成城墙方块，不使用Group旋转
  // startX, startZ: 城墙起点（内侧边角）
  // endX, endZ: 城墙终点（内侧边角）
  // thickness: 城墙厚度（从起点向direction方向延伸）
  // direction: 'south'(z+), 'north'(z-), 'east'(x+), 'west'(x-)
  createWallAxis(startX, startZ, endX, endZ, thickness, direction) {
    const group = new THREE.Group();

    // 计算城墙长度（起终点之间的距离）
    const dx = endX - startX;
    const dz = endZ - startZ;
    const wallLength = Math.sqrt(dx * dx + dz * dz);

    // 确定城墙主轴方向（单位向量）
    const axisX = dx / wallLength;
    const axisZ = dz / wallLength;
    // 垂直方向（外侧方向，从内侧指向外侧）
    // south: (0,1), north: (0,-1), east: (1,0), west: (-1,0)
    let outX, outZ;
    if (direction === 'south') { outX = 0; outZ = 1; }
    else if (direction === 'north') { outX = 0; outZ = -1; }
    else if (direction === 'east') { outX = 1; outZ = 0; }
    else { outX = -1; outZ = 0; }

    // 辅助函数：将局部坐标(沿轴距离, 厚度偏移)转为世界坐标
    const toWorld = (along, thickOffset) => {
      return {
        x: startX + axisX * along + outX * thickOffset,
        z: startZ + axisZ * along + outZ * thickOffset
      };
    };

    // 判断城墙是否沿Z轴（垂直方向）
    const isVertical = Math.abs(axisZ) > 0.5;

    // 创建方块并添加到group
    // 对于沿X轴的城墙：w=长度(X轴), d=厚度(Z轴)
    // 对于沿Z轴的城墙：w=厚度(X轴), d=长度(Z轴)
    const addBlock = (alongStart, thickStart, len, h, thick, color) => {
      const geo = new THREE.BoxGeometry(
        isVertical ? thick : len,
        h,
        isVertical ? len : thick
      );
      const mat = new THREE.MeshLambertMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      const center = toWorld(
        alongStart + len / 2,
        thickStart + thick / 2
      );
      mesh.position.set(center.x, h / 2, center.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    };

    // 墙体主体
    addBlock(0, 0, wallLength, 4, thickness, '#C2B280');
    // 墙体底部加深色（基础）
    addBlock(0, -0.1, wallLength, 0.5, thickness + 0.2, '#A09070');
    // 墙顶走道（内侧缩进）
    addBlock(0, 0.3, wallLength, 0.2, thickness - 0.6, '#D4C09E');

    // 垛口（外侧锯齿）
    const merlonSpacing = 1.5;
    const merlonCount = Math.floor(wallLength / merlonSpacing);
    for (let i = 0; i < merlonCount; i++) {
      const pos = i * merlonSpacing;
      addBlock(pos, thickness - 0.5, 0.8, 0.8, 0.5, '#B8A888');
    }

    // 内侧矮墙
    addBlock(0, 0, wallLength, 0.5, 0.3, '#B8A888');

    // 墙面装饰线（外侧）
    addBlock(0, thickness - 0.2, wallLength, 0.1, 0.1, '#8B7355');
    addBlock(0, thickness - 0.2, wallLength, 0.1, 0.1, '#8B7355');

    group.position.set(0, 0, 0);
    group.name = 'cityWall';
    this.scene.add(group);

    // 碰撞体：直接用起终点和厚度计算AABB
    if (typeof window.addCollider === 'function') {
      let minX, maxX, minZ, maxZ;
      if (direction === 'south') {
        minX = Math.min(startX, endX);
        maxX = Math.max(startX, endX);
        minZ = startZ;
        maxZ = startZ + thickness;
      } else if (direction === 'north') {
        minX = Math.min(startX, endX);
        maxX = Math.max(startX, endX);
        minZ = startZ - thickness;
        maxZ = startZ;
      } else if (direction === 'east') {
        minX = startX;
        maxX = startX + thickness;
        minZ = Math.min(startZ, endZ);
        maxZ = Math.max(startZ, endZ);
      } else { // west
        minX = startX - thickness;
        maxX = startX;
        minZ = Math.min(startZ, endZ);
        maxZ = Math.max(startZ, endZ);
      }
      const cx = (minX + maxX) / 2;
      const cz = (minZ + maxZ) / 2;
      const hw = (maxX - minX) / 2 + 0.1;
      const hd = (maxZ - minZ) / 2 + 0.1;
      window.addCollider(cx, cz, hw, hd, 4, 'cityWall', true);
    }
    return group;
  },

  // ====== NPC对话系统 ======

  // 检查玩家是否靠近NPC
  getNearbyNPC(playerPos, maxDist) {
    if (!this.npcs) return null;
    for (const npc of this.npcs) {
      if (!npc.mesh || !npc.name) continue;
      const dx = playerPos.x - npc.x;
      const dz = playerPos.z - npc.z;
      if (Math.sqrt(dx*dx + dz*dz) < maxDist) return npc;
    }
    return null;
  },

  // 打开NPC对话面板
  openNPCDialog(npc) {
    this.npcDialogOpen = true;
    // 释放鼠标指针锁定，确保可以操作对话框
    if (document.pointerLockElement) document.exitPointerLock();
    // 恢复鼠标指针显示（body默认cursor:none）
    document.body.style.cursor = 'default';
    const overlay = document.getElementById('npc-dialog-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    document.getElementById('npc-dialog-portrait').textContent = npc.emoji || '👤';
    document.getElementById('npc-dialog-name').textContent = npc.name || 'NPC';

    const content = document.getElementById('npc-dialog-content');
    const actions = document.getElementById('npc-dialog-actions');
    content.innerHTML = '';
    actions.innerHTML = '';

    switch(npc.type) {
      case 'arms_dealer': this._showArmsDealerDialog(content, actions); break;
      case 'bounty_hunter': this._showBountyHunterDialog(content, actions); break;
      case 'camp_manager': this._showCampManagerDialog(content, actions); break;
      default: this._showVillagerDialog(npc, content, actions); break;
    }

    // 绑定对话框关闭事件（确保 requestPointerLock 在用户手势上下文中）
    this._bindDialogCloseEvents();
  },

  // 关闭NPC对话面板（注意：实际的全局函数在init中绑定到window.closeNPCDialog）
  closeNPCDialog() {
    this.npcDialogOpen = false;
    // 恢复游戏状态
    if (typeof window.resumeGameState === 'function') {
      window.resumeGameState();
    }
    // 隐藏overlay
    const overlay = document.getElementById('npc-dialog-overlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.cursor = 'none';
    // 请求pointer lock（必须在用户手势同步上下文中）
    if (window.renderer && window.renderer.domElement) {
      window.renderer.domElement.requestPointerLock().catch(() => {});
    }
  },

  // 绑定对话框关闭事件（使用 addEventListener 确保 requestPointerLock 在用户手势上下文中）
  _bindDialogCloseEvents() {
    const overlay = document.getElementById('npc-dialog-overlay');
    if (!overlay || overlay._dialogEventsBound) return;
    overlay._dialogEventsBound = true;

    // 关闭按钮（X）- 使用全局函数确保requestPointerLock在用户手势上下文中
    const closeBtn = overlay.querySelector('.npc-dialog-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof window.closeNPCDialog === 'function') window.closeNPCDialog();
      });
    }

    // 点击遮罩层关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        if (typeof window.closeNPCDialog === 'function') window.closeNPCDialog();
      }
    });

    // ESC 键关闭
    const escHandler = (e) => {
      if (e.key === 'Escape' && this.npcDialogOpen) {
        if (typeof window.closeNPCDialog === 'function') window.closeNPCDialog();
      }
    };
    document.addEventListener('keydown', escHandler);
    overlay._escHandler = escHandler;

    // 动态生成的"离开"按钮（使用事件委托）- 已由内联onclick处理
    // 内联onclick="closeNPCDialog()"直接调用全局函数
  },

  // 在对话框关闭后请求指针锁定（必须在用户交互的事件处理函数中同步调用）
  _requestPointerLockAfterDialog() {
    const canvas = window.renderer ? renderer.domElement : null;
    if (!canvas) return;
    // 直接请求 pointer lock（此时仍在用户点击的同步上下文中）
    canvas.requestPointerLock().catch(() => {
      // 如果失败，设置标志让 pointerlockchange 监听器重试
      window._needReLock = true;
    });
  },

  // 绿皮军火商：建材换子弹（点击武器后选择兑换数量）
  _showArmsDealerDialog(content, actions) {
    const prices = this.npcInteraction.armsDealer.ammoPrices;
    const buildingCount = this._getBuildingCount();

    let html = `<p>「嘿，幸存者！子弹不多了吧？」</p>`;
    html += `<p>「我可以帮你补给弹药，点击武器选择兑换数量。」</p>`;
    html += `<div style="background:rgba(139,105,20,0.15);border:1px solid rgba(139,105,20,0.3);border-radius:8px;padding:10px 14px;margin:10px 0;">`;
    html += `<span style="color:#eecc88;font-size:14px;">🏗️ 当前建材: <b style="color:#fff;font-size:16px;">${buildingCount}</b></span>`;
    html += `</div>`;

    // 武器列表（可点击）
    html += `<div style="margin:10px 0;">`;
    const weaponNames = Object.keys(prices);
    weaponNames.forEach(name => {
      const price = prices[name];
      const maxBatch = Math.floor(buildingCount / price);
      const canAfford = maxBatch > 0;
      html += `<div onclick="DesertMap._showAmmoQuantityPicker('${name}')" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;margin:4px 0;background:rgba(${canAfford ? '139,105,20' : '80,80,80'},0.15);border-radius:6px;border:1px solid rgba(${canAfford ? '139,105,20' : '100,100,100'},0.3);cursor:${canAfford ? 'pointer' : 'not-allowed'};transition:all 0.2s;${canAfford ? '' : 'opacity:0.5;'}" ${canAfford ? 'onmouseover="this.style.background=\'rgba(139,105,20,0.3)\'" onmouseout="this.style.background=\'rgba(139,105,20,0.15)\'"' : ''}>`;
      html += `<span style="color:#ddd;font-size:14px;">🔫 ${name}</span>`;
      html += `<span style="color:#aaa;font-size:12px;">单价: 🏗️${price} | 可兑换: <b style="color:${canAfford ? '#88ee88' : '#ff6666'}">${maxBatch}</b>次</span>`;
      html += `</div>`;
    });
    html += `</div>`;

    content.innerHTML = html;
    actions.innerHTML = `<button class="npc-dialog-btn npc-dialog-btn-secondary" onclick="closeNPCDialog()" >离开</button>`;
  },

  // 点击武器后弹出数量选择面板
  _showAmmoQuantityPicker(weaponName) {
    const prices = this.npcInteraction.armsDealer.ammoPrices;
    const price = prices[weaponName];
    if (!price) return;
    const buildingCount = this._getBuildingCount();
    const maxBatch = Math.floor(buildingCount / price);

    if (maxBatch <= 0) {
      if (window.showToast) showToast('建材不足!', 'error');
      return;
    }

    const content = document.getElementById('npc-dialog-content');
    const actions = document.getElementById('npc-dialog-actions');

    // 计算推荐数量选项
    const quantities = [];
    if (maxBatch >= 1) quantities.push(1);
    if (maxBatch >= 3) quantities.push(3);
    if (maxBatch >= 5) quantities.push(5);
    if (maxBatch >= 10) quantities.push(10);
    if (maxBatch >= 20) quantities.push(20);
    quantities.push(maxBatch); // 最大数量

    let html = `<p>「选择 <b style="color:#eecc88;">${weaponName}</b> 的兑换数量」</p>`;
    html += `<p style="color:#aaa;font-size:12px;">单价: 🏗️${price}建材 | 当前建材: ${buildingCount} | 最多兑换: ${maxBatch}次</p>`;

    // 数量选择按钮网格
    html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:15px 0;">`;
    quantities.forEach(q => {
      const totalCost = price * q;
      html += `<div onclick="DesertMap.exchangeAmmoFor('${weaponName}',${q})" style="text-align:center;padding:12px 8px;background:rgba(139,105,20,0.15);border:1px solid rgba(139,105,20,0.3);border-radius:8px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='rgba(139,105,20,0.35)'" onmouseout="this.style.background='rgba(139,105,20,0.15)'">`;
      html += `<div style="color:#eecc88;font-size:18px;font-weight:bold;">x${q}</div>`;
      html += `<div style="color:#aaa;font-size:11px;">🏗️${totalCost}建材</div>`;
      html += `</div>`;
    });
    html += `</div>`;

    content.innerHTML = html;
    actions.innerHTML = `
      <button class="npc-dialog-btn npc-dialog-btn-secondary" onclick="DesertMap._showArmsDealerDialog(document.getElementById('npc-dialog-content'),document.getElementById('npc-dialog-actions'))">← 返回</button>
      <button class="npc-dialog-btn npc-dialog-btn-secondary" onclick="closeNPCDialog()" >离开</button>
    `;
  },

  exchangeAmmoFor(weaponName, count) {
    count = count || 1;
    const prices = this.npcInteraction.armsDealer.ammoPrices;
    const price = prices[weaponName];
    if (!price) return;

    const buildingCount = this._getBuildingCount();
    const totalCost = price * count;
    if (buildingCount < totalCost) {
      if (window.showToast) showToast('建材不足!', 'error');
      return;
    }

    // 扣除建材
    if (typeof addBattleResources === 'function') {
      addBattleResources({ building: -totalCost });
    } else if (typeof window.addBattleResources === 'function') {
      window.addBattleResources({ building: -totalCost });
    }

    // 找到对应武器并补充弹药
    if (window.weapons) {
      const w = window.weapons.find(we => we.name === weaponName);
      if (w) {
        w.reserve = Math.min(w.reserve + w.magSize * 5 * count, w.magSize * 20); // 补充弹药，上限20个弹匣
        w.currentMag = w.magSize; // 当前弹匣补满
        if (window.showToast) showToast(`${weaponName} 弹药已补充 x${count}!`, 'success');
      }
    }
    // 刷新弹药UI显示
    if (typeof window.updateAmmo === 'function') window.updateAmmo();

    // 刷新面板
    const npc = this.npcs.find(n => n.type === 'arms_dealer');
    if (npc) this.openNPCDialog(npc);
  },

  _getBuildingCount() {
    // 尝试多种方式获取建材数量
    if (typeof shelterData !== 'undefined' && shelterData && shelterData.resources) {
      return Math.floor(shelterData.resources.building || 0);
    }
    if (window.ShelterSystem && ShelterSystem.shelterData && ShelterSystem.shelterData.resources) {
      return Math.floor(ShelterSystem.shelterData.resources.building || 0);
    }
    return 0;
  },

  // 黄皮赏金猎人：怪物清理任务（支持多任务）
  _showBountyHunterDialog(content, actions) {
    const bh = this.npcInteraction.bountyHunter;
    const monsterNames = { scorpion: '蝎子', sandworm: '沙虫', vulture: '秃鹫', mixed: '任意怪物' };
    
    let html = `<p>「想赚些建材和零件？接个悬赏吧。」</p>`;
    html += `<p style="color:#aaa;font-size:12px;">已完成悬赏: ${bh.completedCount} | 当前任务: ${bh.activeQuests.length}/${bh.maxActiveQuests}</p>`;
    
    if (bh.activeQuests.length === 0) {
      html += `<p style="color:#888;">「目前没有可交付的任务，接一个吧！」</p>`;
    }
    
    // 显示所有当前任务
    bh.activeQuests.forEach((quest, idx) => {
      const mType = monsterNames[quest.type] || quest.type;
      const isComplete = quest.killed >= quest.target;
      const progressPct = Math.min(100, Math.floor(quest.killed / quest.target * 100));
      
      html += `<div class="npc-dialog-quest" style="margin:8px 0;padding:12px;border-radius:8px;background:rgba(${isComplete ? '80,200,80' : '255,255,255'},0.05);border:1px solid rgba(${isComplete ? '80,200,80' : '139,105,20'},0.3);">`;
      html += `<div class="npc-dialog-quest-title" style="color:${isComplete ? '#88ee88' : '#eecc88'};">${isComplete ? '✅' : '📋'} ${quest.name}</div>`;
      html += `<div style="margin:6px 0;">`;
      html += `<div style="background:rgba(255,255,255,0.1);border-radius:4px;height:8px;overflow:hidden;">`;
      html += `<div style="background:${isComplete ? '#88ee88' : '#c4a352'};height:100%;width:${progressPct}%;transition:width 0.3s;border-radius:4px;"></div>`;
      html += `</div>`;
      html += `<div class="npc-dialog-quest-progress" style="color:#aaa;font-size:12px;margin-top:4px;">进度: ${quest.killed}/${quest.target} ${mType} (${progressPct}%)</div>`;
      html += `</div>`;
      html += `<div class="npc-dialog-reward">奖励: 🏗️${quest.reward.building}建材 ⚙️${quest.reward.parts}零件</div>`;
      html += `</div>`;
    });
    
    content.innerHTML = html;
    
    // 按钮
    let btns = '';
    // 可交付的任务
    const completableQuests = bh.activeQuests.filter(q => q.killed >= q.target && !q.claimed);
    if (completableQuests.length > 0) {
      btns += `<button class="npc-dialog-btn npc-dialog-btn-success" onclick="DesertMap.claimAllBountyRewards()">🎁 领取所有奖励 (${completableQuests.length})</button>`;
    }
    // 接取新任务
    if (bh.activeQuests.length < bh.maxActiveQuests) {
      btns += `<button class="npc-dialog-btn npc-dialog-btn-primary" onclick="DesertMap.acceptBountyQuest()">📜 接取新悬赏</button>`;
    } else {
      btns += `<button class="npc-dialog-btn" disabled style="opacity:0.5;">📜 任务已满 (${bh.maxActiveQuests}/${bh.maxActiveQuests})</button>`;
    }
    btns += `<button class="npc-dialog-btn npc-dialog-btn-secondary" onclick="closeNPCDialog()" >离开</button>`;
    actions.innerHTML = btns;
  },

  // 生成随机赏金任务
  _generateRandomQuest() {
    const bh = this.npcInteraction.bountyHunter;
    const template = bh.questTemplates[Math.floor(Math.random() * bh.questTemplates.length)];
    const targetRange = bh.targetRanges[template.type] || [5, 10];
    const rewardRange = bh.rewardRanges[template.type] || { building: [10, 30], parts: [5, 20] };
    
    const target = targetRange[0] + Math.floor(Math.random() * (targetRange[1] - targetRange[0] + 1));
    const buildingReward = rewardRange.building[0] + Math.floor(Math.random() * (rewardRange.building[1] - rewardRange.building[0] + 1));
    const partsReward = rewardRange.parts[0] + Math.floor(Math.random() * (rewardRange.parts[1] - rewardRange.parts[0] + 1));
    
    return {
      type: template.type,
      name: template.name,
      desc: template.desc.replace('{target}', target),
      target: target,
      reward: { building: buildingReward, parts: partsReward },
      killed: 0,
      claimed: false,
      types: template.types || null
    };
  },

  // 接取新悬赏
  acceptBountyQuest() {
    const bh = this.npcInteraction.bountyHunter;
    if (bh.activeQuests.length >= bh.maxActiveQuests) {
      if (window.showToast) showToast('任务已满!', 'error');
      return;
    }
    const quest = this._generateRandomQuest();
    bh.activeQuests.push(quest);
    if (window.showToast) showToast(`接取悬赏: ${quest.name} (${quest.desc})`, 'info');
    
    const npc = this.npcs.find(n => n.type === 'bounty_hunter');
    if (npc) this.openNPCDialog(npc);
  },

  // 领取所有可交付的奖励
  claimAllBountyRewards() {
    const bh = this.npcInteraction.bountyHunter;
    let totalBuilding = 0, totalParts = 0, claimedCount = 0;
    
    bh.activeQuests.forEach(quest => {
      if (quest.killed >= quest.target && !quest.claimed) {
        quest.claimed = true;
        totalBuilding += quest.reward.building;
        totalParts += quest.reward.parts;
        claimedCount++;
      }
    });
    
    if (claimedCount === 0) return;
    
    // 发放奖励
    if (typeof addBattleResources === 'function') {
      addBattleResources({ building: totalBuilding, parts: totalParts });
    } else if (typeof window.addBattleResources === 'function') {
      window.addBattleResources({ building: totalBuilding, parts: totalParts });
    }
    
    bh.completedCount += claimedCount;
    if (window.showToast) showToast(`交付${claimedCount}个悬赏! +${totalBuilding}建材 +${totalParts}零件`, 'success');
    
    // 移除已交付的任务
    bh.activeQuests = bh.activeQuests.filter(q => !q.claimed);
    
    const npc = this.npcs.find(n => n.type === 'bounty_hunter');
    if (npc) this.openNPCDialog(npc);
  },

  // 兼容旧接口
  claimBountyReward() {
    this.claimAllBountyRewards();
  },
  nextBountyQuest() {
    this.acceptBountyQuest();
  },

  // 红皮营地管理者：捐赠食物
  _showCampManagerDialog(content, actions) {
    const cm = this.npcInteraction.campManager;
    const foodCount = this._getFoodCount();
    const nextThreshold = cm.prosperityLevel < cm.thresholds.length ? cm.thresholds[cm.prosperityLevel] : Infinity;
    const villagerCount = cm.villagers.length;
    
    let html = `<p>「欢迎来到我们的营地！」</p>`;
    html += `<p>「这里虽然条件艰苦，但至少没有丧尸。」</p>`;
    html += `<p>「如果你有多余的食物，可以捐给营地，让我们变得更强大。」</p>`;
    html += `<p style="color:#eecc88;">📊 营地繁荣度: ${'★'.repeat(cm.prosperityLevel)}${'☆'.repeat(5-cm.prosperityLevel)} (${cm.prosperityLevel}/5)</p>`;
    html += `<p style="color:#aaa;">👥 村民数量: ${villagerCount}人</p>`;
    html += `<p style="color:#aaa;">🍞 当前食物: ${foodCount}</p>`;
    
    if (cm.prosperityLevel < 5) {
      html += `<p style="color:#888;font-size:12px;">下一级繁荣需要累计捐赠: ${nextThreshold}食物 (已捐${cm.totalDonated})</p>`;
    } else {
      html += `<p style="color:#88ee88;">🎉 营地已达到最高繁荣度!</p>`;
    }
    
    content.innerHTML = html;
    
    let btns = '';
    if (foodCount >= 10 && cm.prosperityLevel < 5) {
      btns += `<button class="npc-dialog-btn npc-dialog-btn-primary" onclick="DesertMap.donateFood(10)">🍞 捐赠10食物</button>`;
    }
    if (foodCount >= 50 && cm.prosperityLevel < 5) {
      btns += `<button class="npc-dialog-btn npc-dialog-btn-primary" onclick="DesertMap.donateFood(50)">🍞 捐赠50食物</button>`;
    }
    if (foodCount >= 100 && cm.prosperityLevel < 5) {
      btns += `<button class="npc-dialog-btn npc-dialog-btn-primary" onclick="DesertMap.donateFood(100)">🍞 捐赠100食物</button>`;
    }
    btns += `<button class="npc-dialog-btn npc-dialog-btn-secondary" onclick="closeNPCDialog()" >离开</button>`;
    actions.innerHTML = btns;
  },

  donateFood(amount) {
    const cm = this.npcInteraction.campManager;
    const foodCount = this._getFoodCount();
    if (foodCount < amount) {
      if (window.showToast) showToast('食物不足!', 'error');
      return;
    }
    // 扣除食物
    if (typeof addBattleResources === 'function') {
      addBattleResources({ food: -amount });
    } else if (typeof window.addBattleResources === 'function') {
      window.addBattleResources({ food: -amount });
    }
    cm.totalDonated += amount;
    
    // 检查是否升级繁荣度
    const oldLevel = cm.prosperityLevel;
    while (cm.prosperityLevel < cm.thresholds.length && cm.totalDonated >= cm.thresholds[cm.prosperityLevel]) {
      cm.prosperityLevel++;
      // 添加新村民
      this._spawnVillager();
      if (window.showToast) showToast(`营地繁荣度提升到 ${cm.prosperityLevel} 级! 新村民加入了!`, 'success');
    }
    
    if (oldLevel === cm.prosperityLevel) {
      if (window.showToast) showToast(`感谢捐赠 ${amount} 食物!`, 'info');
    }
    
    const npc = this.npcs.find(n => n.type === 'camp_manager');
    if (npc) this.openNPCDialog(npc);
  },

  _getFoodCount() {
    // 尝试多种方式获取食物数量
    if (typeof shelterData !== 'undefined' && shelterData && shelterData.resources) {
      return Math.floor(shelterData.resources.food || 0);
    }
    if (window.ShelterSystem && ShelterSystem.shelterData && ShelterSystem.shelterData.resources) {
      return Math.floor(ShelterSystem.shelterData.resources.food || 0);
    }
    return 0;
  },

  // 房屋列表（6个房屋）
  _getHouses() {
    return [
      { x: 8, z: 8, doorX: 10.5, doorZ: 12 },
      { x: 18, z: 8, doorX: 20.5, doorZ: 12 },
      { x: 28, z: 8, doorX: 30.5, doorZ: 12 },
      { x: 8, z: 22, doorX: 10.5, doorZ: 26 },
      { x: 18, z: 22, doorX: 20.5, doorZ: 26 },
      { x: 28, z: 22, doorX: 30.5, doorZ: 26 },
    ];
  },

  // 创建村民骨骼模型
  _createVillagerModel(skinColor, clothColor, villagerName) {
    const group = new THREE.Group();
    const bones = {};

    // 判断村民类型
    const elderlyNames = ['老张', '赵婶', '老孙', '老周'];
    const femaleNames = ['阿花', '阿秀', '小红', '春花'];
    const strongMaleNames = ['大刘', '铁柱', '阿强'];
    const intellectualNames = ['小陈', '老周'];
    const militaryName = '老周';
    const nurseName = '秀兰';
    const isElderly = elderlyNames.includes(villagerName);
    const isFemale = femaleNames.includes(villagerName);
    const isStrongMale = strongMaleNames.includes(villagerName);
    const isIntellectual = intellectualNames.includes(villagerName);
    const isMilitary = villagerName === militaryName;
    const isNurse = villagerName === nurseName;

    // 身体参数根据类型调整
    const bodyW = isStrongMale ? 1.2 : 1.0;
    const bodyH = isStrongMale ? 1.4 : 1.2;
    const bodyD = 0.6;
    // bodyY = 腿部pivot高度，脚底到pivot距离=0.85，所以bodyY=0.85让脚底刚好在y=0
    const bodyY = 0.85;

    // 身体（躯干）
    const bodyGeo = new THREE.BoxGeometry(bodyW, bodyH, bodyD);
    const bodyMat = new THREE.MeshLambertMaterial({ color: clothColor });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = bodyY;
    body.castShadow = true;
    // 老年人驼背效果
    if (isElderly) {
      body.rotation.x = 0.15;
    }
    group.add(body);
    bones.body = body;

    // 头部（稍微圆润一点）
    const headGeo = new THREE.BoxGeometry(0.65, 0.72, 0.68);
    const headMat = new THREE.MeshLambertMaterial({ color: skinColor });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = bodyY + bodyH / 2 + 0.46;
    head.castShadow = true;
    group.add(head);
    bones.head = head;

    // 鼻子
    const noseGeo = new THREE.BoxGeometry(0.1, 0.12, 0.08);
    const noseMat = new THREE.MeshLambertMaterial({ color: skinColor });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, -0.02, 0.36);
    head.add(nose);

    // 耳朵
    const earGeo = new THREE.BoxGeometry(0.08, 0.15, 0.1);
    const earMat = new THREE.MeshLambertMaterial({ color: skinColor });
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(-0.36, 0, 0);
    head.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.position.set(0.36, 0, 0);
    head.add(rightEar);

    // 眼睛（稍微大一点，带眼白）
    const eyeWhiteGeo = new THREE.BoxGeometry(0.14, 0.12, 0.04);
    const eyeWhiteMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEyeWhite.position.set(-0.15, 0.06, 0.35);
    head.add(leftEyeWhite);
    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEyeWhite.position.set(0.15, 0.06, 0.35);
    head.add(rightEyeWhite);

    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.05);
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.15, 0.06, 0.37);
    head.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.15, 0.06, 0.37);
    head.add(rightEye);

    // 眉毛
    const browGeo = new THREE.BoxGeometry(0.16, 0.03, 0.03);
    const browMat = new THREE.MeshLambertMaterial({ color: 0x2a1a0a });
    const leftBrow = new THREE.Mesh(browGeo, browMat);
    leftBrow.position.set(-0.15, 0.14, 0.36);
    head.add(leftBrow);
    const rightBrow = new THREE.Mesh(browGeo, browMat);
    rightBrow.position.set(0.15, 0.14, 0.36);
    head.add(rightBrow);

    // 嘴巴
    const mouthGeo = new THREE.BoxGeometry(0.18, 0.05, 0.04);
    const mouthMat = new THREE.MeshLambertMaterial({ color: 0x8a4a3a });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -0.18, 0.36);
    head.add(mouth);

    // 知识分子戴眼镜
    if (isIntellectual) {
      const glassMat = new THREE.MeshLambertMaterial({ color: 0x333333, transparent: true, opacity: 0.7 });
      const glassGeo = new THREE.BoxGeometry(0.22, 0.14, 0.02);
      const leftGlass = new THREE.Mesh(glassGeo, glassMat);
      leftGlass.position.set(-0.15, 0.05, 0.39);
      head.add(leftGlass);
      const rightGlass = new THREE.Mesh(glassGeo, glassMat);
      rightGlass.position.set(0.15, 0.05, 0.39);
      head.add(rightGlass);
      // 镜桥
      const bridgeGeo = new THREE.BoxGeometry(0.12, 0.03, 0.02);
      const bridge = new THREE.Mesh(bridgeGeo, glassMat);
      bridge.position.set(0, 0.05, 0.39);
      head.add(bridge);
    }

    // 军人戴军帽
    if (isMilitary) {
      const hatGeo = new THREE.BoxGeometry(0.8, 0.2, 0.8);
      const hatMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
      const hat = new THREE.Mesh(hatGeo, hatMat);
      hat.position.y = 0.4;
      head.add(hat);
      // 帽檐
      const brimGeo = new THREE.BoxGeometry(0.9, 0.05, 0.3);
      const brim = new THREE.Mesh(brimGeo, hatMat);
      brim.position.set(0, 0.32, 0.35);
      head.add(brim);
    }

    // 女性长头发
    if (isFemale) {
      const hairMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      const hairBackGeo = new THREE.BoxGeometry(0.6, 0.5, 0.15);
      const hairBack = new THREE.Mesh(hairBackGeo, hairMat);
      hairBack.position.set(0, -0.2, -0.35);
      head.add(hairBack);
      const hairSideGeo = new THREE.BoxGeometry(0.1, 0.35, 0.15);
      const hairSideL = new THREE.Mesh(hairSideGeo, hairMat);
      hairSideL.position.set(-0.35, -0.15, -0.15);
      head.add(hairSideL);
      const hairSideR = new THREE.Mesh(hairSideGeo, hairMat);
      hairSideR.position.set(0.35, -0.15, -0.15);
      head.add(hairSideR);
    }

    // 护士白围裙+红十字
    if (isNurse) {
      const apronGeo = new THREE.BoxGeometry(bodyW * 0.9, bodyH * 0.7, 0.08);
      const apronMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
      const apron = new THREE.Mesh(apronGeo, apronMat);
      apron.position.set(0, -bodyH * 0.1, bodyD / 2 + 0.04);
      body.add(apron);
      // 红十字
      const crossH = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.06, 0.02),
        new THREE.MeshLambertMaterial({ color: 0xFF0000 })
      );
      crossH.position.set(0, 0.1, 0.05);
      apron.add(crossH);
      const crossV = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.2, 0.02),
        new THREE.MeshLambertMaterial({ color: 0xFF0000 })
      );
      crossV.position.set(0, 0.1, 0.05);
      apron.add(crossV);
      // 护士帽
      const nurseHatGeo = new THREE.BoxGeometry(0.5, 0.15, 0.5);
      const nurseHatMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
      const nurseHat = new THREE.Mesh(nurseHatGeo, nurseHatMat);
      nurseHat.position.y = 0.42;
      head.add(nurseHat);
    }

    // 女性裙摆
    if (isFemale) {
      const skirtGeo = new THREE.BoxGeometry(bodyW * 1.3, 0.5, bodyD * 1.2);
      const skirtMat = new THREE.MeshLambertMaterial({ color: clothColor });
      const skirt = new THREE.Mesh(skirtGeo, skirtMat);
      skirt.position.y = -bodyH / 2 - 0.15;
      body.add(skirt);
    }

    // 腰带
    const beltGeo = new THREE.BoxGeometry(bodyW + 0.05, 0.1, bodyD + 0.05);
    const beltMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = -bodyH * 0.15;
    body.add(belt);
    // 腰带扣
    const buckleGeo = new THREE.BoxGeometry(0.15, 0.12, 0.05);
    const buckleMat = new THREE.MeshLambertMaterial({ color: 0xC0A040 });
    const buckle = new THREE.Mesh(buckleGeo, buckleMat);
    buckle.position.set(0, -bodyH * 0.15, bodyD / 2 + 0.03);
    body.add(buckle);

    // 左臂
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-(bodyW / 2 + 0.15), bodyY + bodyH / 2 - 0.1, 0);
    const leftUpperArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.5, 0.25),
      new THREE.MeshLambertMaterial({ color: clothColor })
    );
    leftUpperArm.position.y = -0.25;
    leftUpperArm.castShadow = true;
    leftArmGroup.add(leftUpperArm);
    const leftLowerArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.45, 0.2),
      new THREE.MeshLambertMaterial({ color: skinColor })
    );
    leftLowerArm.position.y = -0.6;
    leftLowerArm.castShadow = true;
    leftArmGroup.add(leftLowerArm);
    const leftHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.15, 0.15),
      new THREE.MeshLambertMaterial({ color: skinColor })
    );
    leftHand.position.y = -0.85;
    leftArmGroup.add(leftHand);
    group.add(leftArmGroup);
    bones.leftArm = leftArmGroup;

    // 右臂
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(bodyW / 2 + 0.15, bodyY + bodyH / 2 - 0.1, 0);
    const rightUpperArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.5, 0.25),
      new THREE.MeshLambertMaterial({ color: clothColor })
    );
    rightUpperArm.position.y = -0.25;
    rightUpperArm.castShadow = true;
    rightArmGroup.add(rightUpperArm);
    const rightLowerArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.45, 0.2),
      new THREE.MeshLambertMaterial({ color: skinColor })
    );
    rightLowerArm.position.y = -0.6;
    rightLowerArm.castShadow = true;
    rightArmGroup.add(rightLowerArm);
    const rightHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.15, 0.15),
      new THREE.MeshLambertMaterial({ color: skinColor })
    );
    rightHand.position.y = -0.85;
    rightArmGroup.add(rightHand);
    group.add(rightArmGroup);
    bones.rightArm = rightArmGroup;

    // 左腿
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.25, bodyY - bodyH / 2, 0);
    const leftUpperLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.5, 0.3),
      new THREE.MeshLambertMaterial({ color: clothColor })
    );
    leftUpperLeg.position.y = -0.25;
    leftUpperLeg.castShadow = true;
    leftLegGroup.add(leftUpperLeg);
    const leftLowerLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.45, 0.25),
      new THREE.MeshLambertMaterial({ color: clothColor })
    );
    leftLowerLeg.position.y = -0.6;
    leftLowerLeg.castShadow = true;
    leftLegGroup.add(leftLowerLeg);
    // 鞋子
    const shoeGeo = new THREE.BoxGeometry(0.28, 0.1, 0.38);
    const shoeMat = new THREE.MeshLambertMaterial({ color: 0x2a1a0a });
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(0, -0.88, 0.05);
    leftLegGroup.add(leftShoe);
    const leftFoot = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.12, 0.35),
      new THREE.MeshLambertMaterial({ color: 0x3a2a1a })
    );
    leftFoot.position.set(0, -0.85, 0.05);
    leftLegGroup.add(leftFoot);
    group.add(leftLegGroup);
    bones.leftLeg = leftLegGroup;

    // 右腿
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.25, bodyY - bodyH / 2, 0);
    const rightUpperLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.5, 0.3),
      new THREE.MeshLambertMaterial({ color: clothColor })
    );
    rightUpperLeg.position.y = -0.25;
    rightUpperLeg.castShadow = true;
    rightLegGroup.add(rightUpperLeg);
    const rightLowerLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.45, 0.25),
      new THREE.MeshLambertMaterial({ color: clothColor })
    );
    rightLowerLeg.position.y = -0.6;
    rightLowerLeg.castShadow = true;
    rightLegGroup.add(rightLowerLeg);
    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0, -0.88, 0.05);
    rightLegGroup.add(rightShoe);
    const rightFoot = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.12, 0.35),
      new THREE.MeshLambertMaterial({ color: 0x3a2a1a })
    );
    rightFoot.position.set(0, -0.85, 0.05);
    rightLegGroup.add(rightFoot);
    group.add(rightLegGroup);
    bones.rightLeg = rightLegGroup;

    // 老年人拄拐杖
    if (isElderly) {
      const caneGeo = new THREE.BoxGeometry(0.06, 1.6, 0.06);
      const caneMat = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
      const cane = new THREE.Mesh(caneGeo, caneMat);
      cane.position.set(0.4, -0.6, 0.2);
      rightArmGroup.add(cane);
    }

    return { group, bones };
  },

  // 村民行走动画
  _animateVillagerWalk(bones, time, speed) {
    const freq = speed * 8;
    const swing = Math.sin(time * freq) * 0.5;
    // 手臂前后摆动
    bones.leftArm.rotation.x = swing;
    bones.rightArm.rotation.x = -swing;
    // 腿前后摆动
    bones.leftLeg.rotation.x = -swing;
    bones.rightLeg.rotation.x = swing;
    // 身体轻微上下起伏（基于初始位置，不累加）
    if (bones._baseBodyY === undefined) bones._baseBodyY = bones.body.position.y;
    bones.body.position.y = bones._baseBodyY + Math.abs(Math.sin(time * freq)) * 0.05;
    // 头部轻微晃动
    bones.head.rotation.y = Math.sin(time * freq * 0.5) * 0.1;
  },

  // 村民待机动画
  _animateVillagerIdle(bones, time) {
    // 轻微呼吸起伏（基于初始位置，不累加）
    if (bones._baseBodyY === undefined) bones._baseBodyY = bones.body.position.y;
    bones.body.position.y = bones._baseBodyY + Math.sin(time * 2) * 0.02;
    // 待机时四肢完全静止，只有呼吸起伏
    bones.leftArm.rotation.x = 0;
    bones.rightArm.rotation.x = 0;
    bones.leftLeg.rotation.x = 0;
    bones.rightLeg.rotation.x = 0;
    // 头部左右看
    bones.head.rotation.y = Math.sin(time * 0.8) * 0.15;
  },

  // 生成新村民
  _spawnVillager(savedData) {
    const villagerColors = [
      { skin: 0xE8B87A, cloth: 0x8D6E63, name: '老张' },
      { skin: 0xD4A06A, cloth: 0x5C6BC0, name: '小李' },
      { skin: 0xC68E5A, cloth: 0x7E57C2, name: '阿花' },
      { skin: 0xF0C8A0, cloth: 0xEF5350, name: '小王' },
      { skin: 0xDEB887, cloth: 0x26A69A, name: '大刘' },
      { skin: 0xCD853F, cloth: 0xFF7043, name: '赵婶' },
      { skin: 0xD2B48C, cloth: 0x42A5F5, name: '小陈' },
      { skin: 0xBC8F6F, cloth: 0x66BB6A, name: '老孙' },
      { skin: 0xF5DEB3, cloth: 0xAB47BC, name: '阿秀' },
      { skin: 0xDAA520, cloth: 0xFFA726, name: '铁柱' },
      { skin: 0xC0A882, cloth: 0x78909C, name: '秀兰' },
      { skin: 0xE0C8A0, cloth: 0x8D6E63, name: '阿强' },
      { skin: 0xCC9966, cloth: 0xEC407A, name: '小红' },
      { skin: 0xBFA07A, cloth: 0x5C6BC0, name: '老周' },
      { skin: 0xD4A76A, cloth: 0x29B6F6, name: '春花' },
    ];

    const cm = this.npcInteraction.campManager;
    const colorSet = savedData ?
      (villagerColors.find(c => c.name === savedData.name) || villagerColors[cm.villagers.length % villagerColors.length]) :
      villagerColors[cm.villagers.length % villagerColors.length];

    // 按顺序分配房屋，循环使用
    const houses = this._getHouses();
    const houseIndex = cm.villagers.length % houses.length;
    const house = savedData && savedData.house ? savedData.house : houses[houseIndex];

    // 初始位置在房屋门前（或从存档恢复）
    const vx = savedData ? (savedData.x || house.doorX) : house.doorX;
    const vz = savedData ? (savedData.z || house.doorZ + 1.5) : house.doorZ + 1.5;

    // 使用骨骼模型系统创建村民
    const { group, bones } = this._createVillagerModel(colorSet.skin, colorSet.cloth, colorSet.name);
    group.position.set(vx, 0, vz);
    group.name = 'npc_villager_' + colorSet.name;
    this.scene.add(group);

    // 村民名字标签
    const nameLabel = this._createNPCLabel(colorSet.name, 'villager');
    nameLabel.position.set(0, 2.3, 0);
    group.add(nameLabel);

    // 添加碰撞体并保存引用以便后续更新
    let collider = null;
    if (typeof window.addCollider === 'function') {
      window.addCollider(vx, vz, 0.5, 0.5, 2, 'npc', true);
      // 找到刚添加的碰撞体
      if (typeof window.colliders !== 'undefined') {
        collider = window.colliders[window.colliders.length - 1];
      }
    }

    const villager = {
      mesh: group, type: 'villager', name: colorSet.name,
      emoji: '👤', x: vx, z: vz, isVillager: true,
      house: house,
      collider: collider,
      bones: bones,
      animTime: Math.random() * 100,
      // 状态机数据
      state: savedData ? (savedData.state || 'outside') : 'outside',
      stateTimer: savedData ? (savedData.stateTimer || 5 + Math.random() * 10) : 5 + Math.random() * 10,
      targetX: savedData ? (savedData.targetX || vx) : vx,
      targetZ: savedData ? (savedData.targetZ || vz) : vz,
      speed: savedData ? (savedData.speed || 1.5 + Math.random() * 0.5) : 1.5 + Math.random() * 0.5,
      doorOpenTimer: 0,
    };
    this.npcs.push(villager);
    cm.villagers.push(villager);
  },

  // 村民对话（从语料库随机选择）
  _showVillagerDialog(npc, content, actions) {
    const dialogue = this._getVillagerDialogue(npc.name);
    content.innerHTML = `<p>${dialogue}</p>`;
    actions.innerHTML = `
      <button class="npc-dialog-btn npc-dialog-btn-secondary" onclick="closeNPCDialog()" >离开</button>
    `;
  },

  // 村民语料库（丰富背景故事）
  _getVillagerDialogue(name) {
    // 使用外部语料库 NPC_DIALOGUES（定义在 js/data/npc-dialogues.js）
    const dialogues = (typeof window !== 'undefined' && window.NPC_DIALOGUES) ? window.NPC_DIALOGUES : {};

    // 获取该NPC的对话列表
    let npcDialogues = dialogues[name];
    if (!npcDialogues || npcDialogues.length === 0) {
      // 通用对话
      npcDialogues = [
        `你好啊，我是${name}。欢迎来到我们的营地。`,
        `这里虽然条件艰苦，但至少安全。外面的怪物可不好对付。`,
        `有空多来营地转转，大家都很乐意聊天。`,
        `你看起来是个有经验的幸存者，我们正需要这样的人。`,
        `沙漠里的夜晚很冷，记得多穿点。篝火旁边是最暖和的地方。`,
        `听说城里的情况越来越糟了，幸亏我们逃到了这里。`,
        `如果你在外面发现了有用的物资，记得带回来分享给大家。`,
        `活着就是最大的幸运，别浪费每一天。`,
      ];
    }

    // 随机选择一条（尽量不重复）
    if (!this._lastDialogueIdx) this._lastDialogueIdx = {};
    if (!this._lastDialogueIdx[name]) this._lastDialogueIdx[name] = -1;
    let idx;
    if (npcDialogues.length <= 1) {
      idx = 0;
    } else {
      do {
        idx = Math.floor(Math.random() * npcDialogues.length);
      } while (idx === this._lastDialogueIdx[name]);
    }
    this._lastDialogueIdx[name] = idx;
    return npcDialogues[idx];
  },

  // 更新怪物击杀计数（在怪物死亡时调用）
  onMonsterKilled(type) {
    const bh = this.npcInteraction.bountyHunter;
    // 更新所有活跃任务的击杀计数
    bh.activeQuests.forEach(quest => {
      if (quest.claimed) return;
      if (quest.type === 'mixed' && quest.types && quest.types.includes(type)) {
        quest.killed++;
      } else if (quest.type === type) {
        quest.killed++;
      }
    });
  },

  cleanup() {
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
    this.towerHP = DESERT_MAP_CONFIG.TOWER_HP;

    // 清理沙漠怪物
    if (this.desertMonsters) {
      this.desertMonsters.forEach(m => {
        if (m.mesh && m.mesh.parent) {
          this.scene.remove(m.mesh);
        }
      });
      this.desertMonsters = [];
    }

    // 清理怪物粒子
    if (this.monsterParticles) {
      this.monsterParticles.forEach(p => {
        if (p.mesh) {
          this.scene.remove(p.mesh);
          if (p.mesh.geometry) p.mesh.geometry.dispose();
          if (p.mesh.material) p.mesh.material.dispose();
        }
      });
      this.monsterParticles = [];
    }

    // 清理毒池
    if (this.poisonPools) {
      this.poisonPools.forEach(pool => {
        if (pool.mesh) {
          this.scene.remove(pool.mesh);
          if (pool.mesh.geometry) pool.mesh.geometry.dispose();
          if (pool.mesh.material) pool.mesh.material.dispose();
        }
      });
      this.poisonPools = [];
    }

    // 清理直升机
    this._cleanupHelicopter();

    // 清理任务标记
    if (this._questMarker) {
      this.scene.remove(this._questMarker);
      if (this._questMarker.geometry) this._questMarker.geometry.dispose();
      if (this._questMarker.material) this._questMarker.material.dispose();
      this._questMarker = null;
      this._questMarkerType = null;
    }

    if (typeof window.clearColliders === 'function') window.clearColliders();

    const toRemove = [];
    this.scene.traverse(child => {
      if (child.name && (
        child.name === 'desertTerrain' ||
        child.name === 'baseWall' ||
        child.name === 'baseGate' ||
        child.name === 'contactTower' ||
        child.name === 'waterPoint' ||
        child.name === 'supplyBox' ||
        child.name === 'frontBuilding' ||
        child.name === 'desertZombie' ||
        child.name === 'gateTower' ||
        child.name === 'cityWall' ||
        child.name === 'desertHouse' ||
        child.name === 'desertOutpost' ||
        child.name === 'desertCactus' ||
        child.name === 'desertRock' ||
        child.name === 'sandParticle' ||
        child.name === 'campfire' ||
        child.name.startsWith('npc_') ||
        child.name.startsWith('desertMonster_')
      )) {
        // 只收集场景的直接子对象，避免对子对象的子对象调用scene.remove()无效
        if (child.parent === this.scene) {
          toRemove.push(child);
        }
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
    this.npcDialogOpen = false;
    this.npcInteraction.bountyHunter.activeQuests = [];
    this.npcInteraction.bountyHunter.completedCount = 0;
    // 保存沙漠地图状态到存档
    const cm = this.npcInteraction.campManager;
    const villagers = cm && cm.villagers ? cm.villagers : [];
    try {
      const slot = window.ShelterSystem ? window.ShelterSystem.getCurrentSlot() : -1;
      if (slot >= 0) {
        const raw = localStorage.getItem('gameSave_v2_' + slot);
        const data = raw ? JSON.parse(raw) : {};
        // 保存完整的沙漠状态
        data.desertState = {
          phase: this.phase,
          wave: this.defenseWave,
          towerHP: this.towerHP,
          completed: this.phase === 'complete',
          totalDonated: cm ? cm.totalDonated : 0,
          prosperityLevel: cm ? cm.prosperityLevel : 0,
          villagers: villagers  // 保留原有数据
        };
        // 同时更新 mapProgress 中的沙漠进度（供 shelter.js 统一保存）
        if (!data.mapProgress) data.mapProgress = {};
        data.mapProgress.desert = {
          phase: this.phase,
          wave: this.defenseWave,
          completed: this.phase === 'complete'
        };
        localStorage.setItem('gameSave_v2_' + slot, JSON.stringify(data));
      }
    } catch(e) {}
    // 停止沙漠背景音乐
    this._stopDesertBGM();
    // 注意：不重置 campManager 的捐赠和村民数据，这些应该持久化
    this.npcs = [];
  },

  // ====== 获取地图边界（MapManager接口）======
  getMapBounds() {
    const size = typeof DESERT_MAP_CONFIG !== 'undefined' ? DESERT_MAP_CONFIG.MAP_SIZE : 500;
    return {
      minX: -size,
      maxX: size,
      minZ: -size,
      maxZ: size
    };
  }
};

window.DesertMap = DesertMap;

// 自动注册到MapManager
if (window.MapManager && typeof MapManager.registerMap === 'function') {
  MapManager.registerMap('desert', DesertMap);
}
