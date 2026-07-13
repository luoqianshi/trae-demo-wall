// ============================================================
// 游戏状态管理模块 (GameState)
// 负责：集中管理所有全局游戏状态，避免散落的 let 变量
// ============================================================

const GameState = {
  // --- 核心状态 ---
  state: 'menu', // menu, playing, paused, upgrading, statPanel, dead
  scene: null,
  camera: null,
  renderer: null,
  clock: null,

  // --- 玩家 ---
  player: null,
  weapons: [],
  currentWeaponIndex: 0,
  playerVelocity: null,
  onGround: true,
  jumpCount: 0,
  footstepTimer: 0,

  // --- 输入 ---
  keys: {},
  mouseDown: false,
  rightMouseDown: false,
  isAiming: false,
  yaw: 0,
  pitch: 0,
  spacePressed: false,

  // --- 实体数组 ---
  enemies: [],
  allies: [],
  bullets: [],
  pickups: [],
  buildings: [],
  missiles: [],
  floatingTexts: [],
  particles: [],

  // --- 游戏进度 ---
  kills: 0,
  surviveTime: 0,
  wave: 1,
  enemiesRemaining: 0,
  waveActive: false,
  waveTimer: 0,
  xp: 0,
  xpToLevel: 50,
  level: 1,
  upgradePoints: 0,

  // --- 碰撞系统 ---
  colliders: [],
  stairs: [],
  spatialGrid: new Map(),

  // --- 子系统状态 ---
  dayNightCycle: {
    time: 0,
    cycleDuration: 600,
    sun: null,
    moon: null,
    ambientLight: null,
    skyColor: null,
  },
  airdropSystem: {
    timer: 0,
    active: null,
    showPrompt: false,
  },
  chunkSystem: {
    chunks: new Map(),
    chunkUpdateTimer: 0,
    lastPlayerChunk: { x: 0, z: 0 },
    allChunkData: [],
  },

  // --- 初始化 ---
  init() {
    this.state = 'menu';
    this.enemies = [];
    this.allies = [];
    this.bullets = [];
    this.pickups = [];
    this.buildings = [];
    this.missiles = [];
    this.floatingTexts = [];
    this.particles = [];
    this.colliders = [];
    this.stairs = [];
    this.spatialGrid = new Map();
    this.kills = 0;
    this.surviveTime = 0;
    this.wave = 1;
    this.enemiesRemaining = 0;
    this.waveActive = false;
    this.waveTimer = 0;
    this.xp = 0;
    this.xpToLevel = 50;
    this.level = 1;
    this.upgradePoints = 0;
    this.currentWeaponIndex = 0;
    this.onGround = true;
    this.jumpCount = 0;
    this.footstepTimer = 0;
    this.keys = {};
    this.mouseDown = false;
    this.rightMouseDown = false;
    this.isAiming = false;
    this.yaw = 0;
    this.pitch = 0;
    this.spacePressed = false;
    return this;
  },

  // --- 便捷方法 ---
  getCurrentWeapon() {
    return this.weapons[this.currentWeaponIndex] || null;
  },

  addEnemy(enemy) {
    this.enemies.push(enemy);
  },

  removeEnemy(index) {
    if (index >= 0 && index < this.enemies.length) {
      this.enemies.splice(index, 1);
    }
  },

  addBullet(bullet) {
    this.bullets.push(bullet);
  },

  clearBullets() {
    this.bullets = [];
  },

  addPickup(pickup) {
    this.pickups.push(pickup);
  },

  addParticle(particle) {
    this.particles.push(particle);
  },

  addFloatingText(text) {
    this.floatingTexts.push(text);
  },

  // --- 碰撞系统 ---
  addCollider(collider) {
    this.colliders.push(collider);
    this._addToSpatialGrid(collider, this.colliders.length - 1);
  },

  clearColliders() {
    this.colliders = [];
    this.stairs = [];
    this.spatialGrid = new Map();
  },

  _addToSpatialGrid(collider, index) {
    const SPATIAL_GRID_SIZE = 20;
    const minX = collider.x - collider.hw;
    const maxX = collider.x + collider.hw;
    const minZ = collider.z - collider.hd;
    const maxZ = collider.z + collider.hd;
    const minGX = Math.floor(minX / SPATIAL_GRID_SIZE);
    const maxGX = Math.floor(maxX / SPATIAL_GRID_SIZE);
    const minGZ = Math.floor(minZ / SPATIAL_GRID_SIZE);
    const maxGZ = Math.floor(maxZ / SPATIAL_GRID_SIZE);
    for (let gx = minGX; gx <= maxGX; gx++) {
      for (let gz = minGZ; gz <= maxGZ; gz++) {
        const key = `${gx},${gz}`;
        if (!this.spatialGrid.has(key)) {
          this.spatialGrid.set(key, []);
        }
        this.spatialGrid.get(key).push(index);
      }
    }
  },

  getCollidersInRange(x, z, radius) {
    const SPATIAL_GRID_SIZE = 20;
    const minGX = Math.floor((x - radius) / SPATIAL_GRID_SIZE);
    const maxGX = Math.floor((x + radius) / SPATIAL_GRID_SIZE);
    const minGZ = Math.floor((z - radius) / SPATIAL_GRID_SIZE);
    const maxGZ = Math.floor((z + radius) / SPATIAL_GRID_SIZE);
    const result = [];
    const seen = new Set();
    for (let gx = minGX; gx <= maxGX; gx++) {
      for (let gz = minGZ; gz <= maxGZ; gz++) {
        const key = `${gx},${gz}`;
        const indices = this.spatialGrid.get(key);
        if (indices) {
          for (const idx of indices) {
            if (!seen.has(idx)) {
              seen.add(idx);
              result.push(this.colliders[idx]);
            }
          }
        }
      }
    }
    return result;
  },
};

// 暴露到全局
window.GameState = GameState;

// 兼容性：将旧的全局变量映射到 GameState（用于逐步迁移）
// 注意：使用 window.xxx = 方式赋值，避免与 game.js 中的 let 声明冲突
// game.js 中的 let 声明会自动成为 window 属性，所以这里不需要 defineProperty
// GameState.init() 会同步这些数组到 window
