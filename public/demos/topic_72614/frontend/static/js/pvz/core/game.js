const THREE = window.THREE;
import { Renderer } from './renderer.js';
import { InputManager } from './input.js';
import { AudioManager } from './audio.js';
import { SaveManager } from './save.js';
import plantData from '../data/plants.js';
import zombieData from '../data/zombies.js';
import waveData from '../data/waves.js';
import sceneData from '../data/scenes.js';
import hybridData from '../data/hybrids.js';
import relicData from '../data/relics.js';

import { generateFullTowerMap, NODE_TYPES } from '../data/tower_map.js';
import { INTRO_EVENT } from '../data/events.js';

const STATES = {
  MENU: 'menu',
  SAVE_SELECT: 'save_select',      // 存档选择界面
  SETTINGS: 'settings',            // 设置界面
  SAVE_MANAGER: 'save_manager',    // 存档管理界面
  TOWER_MAP: 'tower_map',      // 塔地图界面
  PLANT_SELECT: 'plant_select',
  PLAYING: 'playing',
  PAUSED: 'paused',
  SHOP: 'shop',
  REST: 'rest',                 // 休息处
  EVENT: 'event',               // 事件
  LAB: 'lab',
  ENCYCLOPEDIA: 'encyclopedia',
  GAME_OVER: 'game_over',
  VICTORY: 'victory',
  INTRO_DIALOGUE: 'intro_dialogue',  // 初始对话
  DIALOGUE: 'dialogue',              // 事件对话
  ACHIEVEMENTS: 'achievements'       // 成就界面
};

const MAX_DELTA_TIME = 100; // ms cap to prevent huge jumps

// 网格常量 - 必须与 renderer.js / input.js 保持一致
const CELL_SIZE = 100;
const GRID_OFFSET_X = 100;
const GRID_OFFSET_Y = 120; // HUD_HEIGHT
const VIEW_WIDTH = 1000;    // 渲染区域宽度（僵尸生成位置）
const VIEW_HEIGHT = 720;     // 渲染区域高度

export class Game {
  constructor() {
    this.state = STATES.MENU;
    this.previousState = null;

    // Subsystems (initialized in init())
    this.renderer = null;
    this.input = null;
    this.audio = null;
    this.saveManager = null;

    // Game entities
    this.plants = [];       // plants on the field
    this.zombies = [];      // zombies on the field
    this.projectiles = [];  // bullets on the field
    this.suns = [];         // collectible suns
    this.lawnMowers = [];   // one per row

    // Game configuration
    this.mode = null;       // 'tower' (杀戮之塔模式)
    this.sceneType = 'lawn';
    this.sceneConfig = null;
    this.loadout = [];      // selected plant card IDs

    // Tower mode (杀戮之塔)
    this.towerMap = [];           // 塔地图数据
    this.currentFloor = 1;        // 当前层数
    this.maxFloors = 11;          // 最大层数（与 TOWER_CONFIG.floorsPerRun 一致）
    this.currentNode = null;      // 当前节点
    this.completedNodes = [];     // 已完成的节点

    // Life system (保卫萝卜模式)
    this.baseHP = 100;            // 基地生命值
    this.maxBaseHP = 100;         // 最大基地生命值
    this.hpRegenRate = 0;         // 每秒恢复生命值（休息时生效）

    // Game progress
    this.currentWave = 0;
    this.totalWaves = waveData.wavesPerLevel;
    this.floor = 1;
    this.difficulty = 'normal';

    // Economy
    this.sun = 50;
    this.coins = 0;
    this.energy = {               // 杂交能源（按品阶）
      blue: 0,
      purple: 0,
      gold: 0,
      red: 0
    };

    // Unlocks
    this.unlockedPlants = [
      'peashooter', 'sunflower', 'wall_nut', 'cherry_bomb', 'potato_mine',
      'snow_pea', 'repeater', 'chomper', 'threepeater', 'sun_shroom'
    ];  // 初始10种植物
    this.cardSlots = 6;
    this.relics = [];
    this.hybridPlants = [];       // 已杂交的植物
    // 主动激活遗物相关状态
    this._activeRelicUses = {};   // 每关限次遗物的本关使用次数（按 relicId 索引）
    this._chaosOrbBuff = null;    // chaos_orb 当前波 buff（{type, value, waveIdx}）
    this._waveDamageStack = 0;    // 战鼓遗物每波累计伤害加成
    this._reviveUsed = false;     // phoenix_feather 复活标记（每次 startTowerMode 重置）

    // Shop configuration
    this.shopItems = [];          // 当前商店物品
    this.shopRefreshed = false;   // 是否已刷新

    // Grid state (5 rows x 9 cols)
    this.grid = [];
    for (let r = 0; r < 5; r++) {
      this.grid[r] = [];
      for (let c = 0; c < 9; c++) {
        this.grid[r][c] = null;
      }
    }

    // Wave management
    this.waveTimer = 0;
    this.waveSpawnQueue = [];
    this.waveActive = false;
    this.betweenWaves = true;
    this.betweenWaveTimer = 0;
    this.betweenWaveDuration = 15000; // 15s between waves
    this.waveWarningShown = false;
    this.waveWarningTimer = 0;
    this.waveWarningDuration = 3000; // Show warning 3s before wave starts

    // 波次阶段系统（5阶段状态机，详见 docs/wave_system_design.md）
    this.wavePhase = 'prep';   // prep | prelude_N | wave_N | clear_wait | victory
    this.isHugeWave = false;
    this.waveSpawnInterval = 3000;
    this.waveConfig = null;     // 波次配置（startBattle 时初始化）
    this.spawnQueue = [];      // 待生成僵尸队列
    this.spawnTimer = 0;       // 出怪计时器
    this.phaseSpawnedCount = 0;  // 当前阶段已生成数量
    this.phaseCleared = false;   // 当前阶段是否已清场
    this.clearWaitTimer = 0;    // 清场等待计时
    this.currentWaveIndex = 0;   // 当前主波索引（0-based）
    this.eliteZombie = null;     // 精英僵尸引用（一关一个）
    this.bossZombie = null;      // Boss 僵尸引用（一关一个）

    // Timing
    this.lastTime = 0;
    this.animFrameId = null;
    this.running = false;

    // Auto-save
    this.autoSaveTimer = 0;
    this.autoSaveInterval = 30000; // 30 seconds

    // Natural sun drop
    this.naturalSunTimer = 0;
    this.naturalSunInterval = 10000; // 10 seconds between natural sun drops

    // Auto-collect suns (自动拾取阳光)
    this.autoCollectSun = true;          // 总开关
    this.autoCollectDelay = 1.2;         // 阳光落地后多久自动拾取（秒）

    // Bound loop method
    this._loop = this._loop.bind(this);
  }

  init(canvas) {
    try {
      this.renderer = new Renderer(canvas);
      this.renderer.init();
    } catch (e) {
      console.error('PVZ: Renderer init failed', e);
      throw new Error(`WebGL 渲染器初始化失败：${e && e.message ? e.message : String(e)}`);
    }

    this.input = new InputManager(canvas, this);
    this.input.init();

    this.audio = new AudioManager();
    this.audio.init();

    this.saveManager = new SaveManager(this);
    this.saveManager.init();

    // 暴露 plantData 引用供 Lab 等系统使用（getAvailablePlants 依赖此字段）
    this.plantData = plantData;

    // Load cached save data — 存档加载失败不应阻塞游戏启动
    const cached = this.saveManager.loadFromCache();
    if (cached) {
      try {
        this.saveManager.loadSaveData(cached);
      } catch (e) {
        console.warn('PVZ: 存档加载失败，使用默认状态启动:', e);
      }
    }
  }

  /**
   * Start the render loop (runs even in menu / non-playing states).
   * The actual game logic only ticks when state === PLAYING.
   */
  run() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.animFrameId = requestAnimationFrame(this._loop);
  }

  startGame(mode, sceneType, loadout) {
    this.mode = mode;
    this.sceneType = sceneType;
    this.sceneConfig = sceneData[sceneType] || sceneData.lawn;
    this.loadout = loadout || this.unlockedPlants.slice(0, this.getEffectiveCardSlots());

    // Reset game state
    this.plants = [];
    this.zombies = [];
    this.projectiles = [];
    this.suns = [];
    this.currentWave = 0;
    this.sun = 50;
    this.waveTimer = 0;
    this.waveSpawnQueue = [];
    this.waveActive = false;
    this.betweenWaves = true;
    this.betweenWaveTimer = 0;
    this.autoSaveTimer = 0;
    this.naturalSunTimer = 0;

    // 波次阶段系统（5阶段状态机，详见 docs/wave_system_design.md）
    this.wavePhase = 'prep';
    this.isHugeWave = false;
    this.waveSpawnInterval = 3000;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.phaseSpawnedCount = 0;
    this.clearWaitTimer = 0;
    this.currentWaveIndex = 0;
    this.eliteZombie = null;
    this.bossZombie = null;

    // 初始化准备阶段队列（如果 waveConfig 已存在）
    if (this.waveConfig) {
      this._initPrepQueue();
    }

    // 强制开启自动拾取阳光（防止旧存档覆盖为 false）
    this.autoCollectSun = true;
    this.autoCollectDelay = 0.5; // 阳光落地后 0.5 秒自动拾取

    // Reset grid
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 9; c++) {
        this.grid[r][c] = null;
      }
    }

    // Setup scene background
    this.renderer.setSceneBackground(sceneType);

    // Setup lawn mowers (one per row)
    this.lawnMowers = [];
    for (let r = 0; r < this.sceneConfig.rows; r++) {
      this.lawnMowers.push({
        row: r,
        x: 40, // left side of grid
        active: false,
        triggered: false
      });
    }

    // Add lawn mower sprites
    if (this.renderer) {
      this.renderer.clearLawnMowers();
      for (const mower of this.lawnMowers) {
        this.renderer.addLawnMowerSprite(mower);
      }
    }

    // Transition to playing
    this.setState(STATES.PLAYING);

    // Start the game loop if not already running
    if (!this.running) {
      this.running = true;
      this.lastTime = performance.now();
      this.animFrameId = requestAnimationFrame(this._loop);
    }
  }

  // 启动塔模式（杀戮之塔）
  startTowerMode(loadout) {
    this.mode = 'tower';
    this.currentFloor = 1;
    this.towerMap = generateFullTowerMap(1);
    this.completedNodes = [];
    // 应用 base_hp_bonus 遗物加成（iron_wall / thick_armor / aegis 等）
    const hpBonus = this._getBaseHpBonus();
    this.maxBaseHP = 100 + hpBonus;
    this.baseHP = this.maxBaseHP; // 重置生命值
    this.loadout = loadout || this.unlockedPlants.slice(0, this.getEffectiveCardSlots());

    // 重置复活标记（phoenix_feather 在新一轮塔模式中可再次触发）
    this._reviveUsed = false;

    // 新存档首次进入时触发初始对话
    if (!this.introCompleted) {
      this.currentDialogue = INTRO_EVENT;
      this.dialogueIndex = 0;
      this.setState(STATES.INTRO_DIALOGUE);
    } else {
      this.setState(STATES.TOWER_MAP);
    }
  }

  // 推进对话到下一段
  advanceDialogue() {
    if (!this.currentDialogue) return;
    if (this.dialogueIndex < this.currentDialogue.dialogues.length - 1) {
      this.dialogueIndex++;
    }
  }

  // 处理对话选项选择
  handleDialogueChoice(choiceIndex) {
    if (!this.currentDialogue || !this.currentDialogue.choices) return;
    const choice = this.currentDialogue.choices[choiceIndex];
    if (!choice) return;

    const effect = choice.effect;
    const wasIntro = this.state === STATES.INTRO_DIALOGUE;

    // 清除对话状态
    this.currentDialogue = null;
    this.dialogueIndex = 0;

    // 根据效果执行对应逻辑
    switch (effect) {
      case 'initial_plant_select':
        // 初始对话:进入植物选择界面
        this.introCompleted = false; // 保持 false，在植物确认时才设为 true
        this.setState(STATES.PLANT_SELECT);
        break;
      default:
        // 通用效果:返回塔地图
        if (wasIntro) {
          this.introCompleted = true;
        }
        this.setState(STATES.TOWER_MAP);
        break;
    }
  }

  // 进入节点
  enterNode(nodeId) {
    const floorData = this.towerMap[this.currentFloor - 1];
    if (!floorData) return false;

    const node = floorData.nodes.find(n => n.id === nodeId);
    if (!node || node.completed || !node.accessible) return false;

    this.currentNode = node;

    switch (node.type) {
      case NODE_TYPES.BATTLE:
      case NODE_TYPES.ELITE:
        this.startBattle(node);
        break;
      case NODE_TYPES.BOSS:
        this.startBossBattle(node);
        break;
      case NODE_TYPES.EVENT:
        this.startEvent(node);
        break;
      case NODE_TYPES.SHOP:
        this.enterShop(node);
        break;
      case NODE_TYPES.REST:
        this.enterRest(node);
        break;
    }
    return true;
  }

  // 开始战斗
  startBattle(node) {
    const isElite = node.type === NODE_TYPES.ELITE;
    const isBoss = node.type === NODE_TYPES.BOSS;
    this.sceneType = 'lawn';
    this.sceneConfig = sceneData.lawn;
    // 波次数：普通2，精英3，Boss4
    this.totalWaves = isBoss ? 4 : (isElite ? 3 : 2);
    this.pendingBattleNode = node;
    // 初始化波次配置
    this._initWaveConfig(node);
    this.setState(STATES.PLANT_SELECT);
  }

  // 初始化波次配置（详见 docs/wave_system_design.md）
  _initWaveConfig(node) {
    const floor = this.currentFloor || 1;
    const nodeType = node ? node.type : NODE_TYPES.BATTLE;
    const isBoss = nodeType === NODE_TYPES.BOSS;
    const isElite = nodeType === NODE_TYPES.ELITE;

    // 重置关卡内待发放奖励（僵尸金币/遗物掉落暂存）
    this._pendingCoins = 0;
    this._pendingRelicDrop = false;
    this._pendingRelicTier = null;

    // 重置每关限次遗物的本关使用计数
    this._activeRelicUses = {};
    this._chaosOrbBuff = null;
    this._waveDamageStack = 0;

    // 总波次
    const totalWaves = isBoss ? 4 : (isElite ? 3 : 2);

    // 各波出怪数量（基础值随层数递增）
    const baseCount = 6 + Math.floor(floor * 1.5);
    const waveCounts = [];
    for (let i = 0; i < totalWaves; i++) {
      // 后面的波次出怪更多
      waveCounts.push(baseCount + i * 2);
    }

    // 前置波倍数：第一波前置 1.5x，其余 2x
    const preludeMultipliers = [1.5];
    for (let i = 1; i < totalWaves; i++) {
      preludeMultipliers.push(2.0);
    }

    // 准备阶段出怪数：初始5只，层级越高越少
    let prepCount = 5;
    if (floor >= 7) prepCount = 3;
    else if (floor >= 4) prepCount = 4;

    // 前置波持续时间（秒）：随层数递减
    const preludeDuration = Math.max(8, 12 - floor * 0.3);
    // 主波持续时间：3-5秒
    const waveDuration = 4;
    // 清场等待超时：60s（floor 1） → 35s（floor 10）
    const clearWaitTimeout = Math.max(35, 60 - (floor - 1) * (25 / 9));

    this.waveConfig = {
      nodeType,
      isBoss,
      isElite,
      totalWaves,
      prepCount,
      waveCounts,           // [8, 10] 各波数量
      preludeMultipliers,   // [1.5, 2.0]
      preludeDuration,
      waveDuration,
      clearWaitTimeout,
      floor,
    };

    // 重置阶段状态
    this.wavePhase = 'prep';
    this.isHugeWave = false;
    this.currentWaveIndex = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.phaseSpawnedCount = 0;
    this.clearWaitTimer = 0;
    this.eliteZombie = null;
    this.bossZombie = null;

    console.log('[waveConfig] 初始化:', this.waveConfig);

    // 初始化准备阶段出怪队列
    this._initPrepQueue();
  }

  // 初始化准备阶段出怪队列
  _initPrepQueue() {
    const cfg = this.waveConfig;
    if (!cfg) return;

    const pool = waveData.getSpawnPool
      ? waveData.getSpawnPool(cfg.floor)
      : ['normal', 'cone', 'flag'];

    this.spawnQueue = [];
    for (let i = 0; i < cfg.prepCount; i++) {
      const type = pool[this._randomInt(0, pool.length - 1)];
      const row = this._randomInt(0, this.sceneConfig.rows - 1);
      this.spawnQueue.push({ type, row, isElite: false, isBoss: false });
    }

    this.wavePhase = 'prep';
    this.spawnTimer = 0;
    this.phaseSpawnedCount = 0;
    console.log(`[wave] prep 阶段启动: ${cfg.prepCount} 只`);
  }

  // 确认植物选择后开始战斗
  confirmPlantSelect() {
    if (this.pendingBattleNode) {
      const node = this.pendingBattleNode;
      this.pendingBattleNode = null;
      this.startGame('tower', this.sceneType, this.loadout);
      // 标记节点为进行中（战斗结束后标记完成）
    } else {
      this.startGame(this.mode || 'adventure', this.sceneType, this.loadout);
    }
  }

  // 开始Boss战
  startBossBattle(node) {
    this.sceneType = 'lawn';
    this.sceneConfig = sceneData.lawn;
    this.totalWaves = 1; // Boss只有一波
    this.pendingBattleNode = node;
    this.setState(STATES.PLANT_SELECT);
  }

  // 开始事件
  startEvent(node) {
    this.currentEvent = node;
    this.setState(STATES.EVENT);
  }

  // 处理事件选择
  handleEventChoice(choiceIndex) {
    if (!this.currentEvent) return;

    const eventDesc = EVENT_DESCRIPTIONS[this.currentEvent.eventType];
    if (!eventDesc) return;

    const choice = eventDesc.choices[choiceIndex];
    if (!choice) return;

    // 应用效果
    switch (choice.effect) {
      case 'gain_coins':
        if (this.economy) {
          this.economy.addCoins(choice.value || 100);
        }
        break;
      case 'lose_hp':
        this.baseHP = Math.max(1, this.baseHP - (choice.value || 10));
        break;
      case 'lose_coins':
        if (this.economy) {
          this.economy.spendCoins(choice.value || 50);
        }
        break;
      case 'gain_hp':
        this.baseHP = Math.min(this.maxBaseHP, this.baseHP + (choice.value || 5));
        break;
      case 'gain_plant':
        // 随机解锁一个植物
        const lockedPlants = this.unlockedPlants.filter(p => !this.unlockedPlants.includes(p));
        if (lockedPlants.length > 0) {
          const randomPlant = lockedPlants[Math.floor(Math.random() * lockedPlants.length)];
          this.unlockedPlants.push(randomPlant);
        }
        break;
      case 'random_buff':
        // 随机增益
        const buffType = Math.random();
        if (buffType < 0.5) {
          if (this.economy) this.economy.addCoins(50);
        } else {
          this.baseHP = Math.min(this.maxBaseHP, this.baseHP + 10);
        }
        break;
      case 'gain_relic':
        // Phase 5: 事件奖励遗物（祭坛/喷泉/英雄/贤者）
        this._grantRandomRelic('basic');
        break;
      case 'gain_relic_blessed':
        // 安葬英雄：获得遗物并回血
        this._grantRandomRelic('basic');
        this.baseHP = Math.min(this.maxBaseHP, this.baseHP + 10);
        break;
      case 'gain_relic_chance':
        // 50%几率获得遗物
        if (Math.random() < (choice.value || 0.5)) {
          this._grantRandomRelic('basic');
        }
        break;
      case 'nothing':
        // 无效果
        break;
    }

    // 标记事件节点完成（必须调用 completeNode，否则节点可被重复进入且下一层不解锁）
    if (this.currentNode) {
      this.completeNode(this.currentNode.id);
      this.currentNode = null;
    }
    this.currentEvent = null;

    // 返回塔地图
    this.setState(STATES.TOWER_MAP);
  }

  // 解锁下一个节点
  unlockNextNode() {
    const floorData = this.towerMap[this.currentFloor - 1];
    if (!floorData) return;

    // 找到第一个未完成的节点并解锁
    for (const node of floorData.nodes) {
      if (!node.completed && node.locked) {
        node.locked = false;
        break;
      }
    }
  }

  // 进入商店
  enterShop(node) {
    // 商店节点进入即视为完成（购物后离开）
    this.completeNode(node.id);
    this.setState(STATES.SHOP);
  }

  // 进入休息处
  enterRest(node) {
    // 自动恢复生命值
    const healAmount = Math.floor(this.maxBaseHP * 0.3); // 恢复30%
    this.baseHP = Math.min(this.baseHP + healAmount, this.maxBaseHP);
    console.log('[enterRest] node=', node.id, 'currentFloor=', this.currentFloor, 'nextNodes=', node.nextNodes);
    // 标记节点完成并解锁下一层可达节点
    this.completeNode(node.id);
    this.setState(STATES.REST);
  }

  // 完成节点：标记当前节点完成，并解锁下一层与之相连的节点
  completeNode(nodeId) {
    const floorData = this.towerMap[this.currentFloor - 1];
    if (!floorData) {
      console.warn('[completeNode] no floorData for floor', this.currentFloor);
      return;
    }

    const node = floorData.nodes.find(n => n.id === nodeId);
    if (!node) {
      console.warn('[completeNode] node not found:', nodeId, 'in floor', this.currentFloor);
      return;
    }
    if (node.completed) {
      console.warn('[completeNode] node already completed:', nodeId);
      return;
    }

    node.completed = true;
    if (!this.completedNodes.includes(nodeId)) {
      this.completedNodes.push(nodeId);
    }

    // 解锁下一层中与该节点 nextNodes 相连的节点
    const nextFloorData = this.towerMap[this.currentFloor];
    if (nextFloorData) {
      let unlockedCount = 0;
      if (node.nextNodes && node.nextNodes.length > 0) {
        for (const nextNodeId of node.nextNodes) {
          const nextNode = nextFloorData.nodes.find(n => n.id === nextNodeId);
          if (nextNode && !nextNode.completed) {
            nextNode.accessible = true;
            unlockedCount++;
          }
        }
      } else {
        // Fallback: nextNodes 为空（旧存档），解锁下一层所有未完成节点
        nextFloorData.nodes.forEach(n => {
          if (!n.completed) n.accessible = true;
        });
        unlockedCount = nextFloorData.nodes.filter(n => !n.completed).length;
      }
      console.log('[completeNode] 解锁下一层 (F', this.currentFloor + 1, ') 节点数:', unlockedCount,
        'nextFloor nodes=', nextFloorData.nodes.map(n => ({ id: n.id, type: n.type, completed: n.completed, accessible: n.accessible })));
    } else {
      console.warn('[completeNode] 没有下一层 (currentFloor=', this.currentFloor, ', maxFloors=', this.maxFloors, ')');
    }

    // 同层其他未完成节点锁定（杀戮之塔风格：选定路径后同层其他节点不可选）
    floorData.nodes.forEach(n => {
      if (!n.completed) n.accessible = false;
    });
  }

  // 解锁下一层节点（旧接口，保留向后兼容）
  unlockNextNode() {
    // completeNode 已经处理了下一层可达节点的解锁
  }

  // 进入下一层
  nextFloor() {
    if (this.currentFloor >= this.maxFloors) {
      // 通关
      this.setState(STATES.VICTORY);
      return false;
    }
    const before = this.currentFloor;
    this.currentFloor++;
    console.log('[nextFloor] 推进: F', before, '-> F', this.currentFloor);
    // 确保新层至少有一个 accessible 节点
    const newFloorData = this.towerMap[this.currentFloor - 1];
    if (newFloorData) {
      const hasAccessible = newFloorData.nodes.some(n => !n.completed && n.accessible);
      if (!hasAccessible) {
        // 没有可达节点，解锁所有未完成节点
        newFloorData.nodes.forEach(n => {
          if (!n.completed) n.accessible = true;
        });
      }
      const accessibleCount = newFloorData.nodes.filter(n => n.accessible).length;
      console.log('[nextFloor] 新层 F', this.currentFloor, 'accessible 节点数:', accessibleCount);
    }
    return true;
  }

  // 统一的僵尸伤害接口：优先扣护盾，再扣护甲，最后扣生命
  damageZombie(zombie, amount) {
    if (!zombie || amount <= 0) return;
    // 应用 type_damage_bonus 遗物加成（zombie_encyclopedia 等线性叠加）
    const dmgBonus = this._getRelicEffectSum('type_damage_bonus');
    // 应用混沌宝珠 damage_up buff
    const chaosDmg = this.getChaosOrbBuff('damage_up');
    const totalMult = 1 + dmgBonus + chaosDmg;
    if (totalMult > 1) {
      amount = Math.round(amount * totalMult);
    }
    let remaining = amount;
    let changed = false;
    // 1. 先扣护盾（青色）
    if (zombie.shieldHp && zombie.shieldHp > 0) {
      const absorbed = Math.min(remaining, zombie.shieldHp);
      zombie.shieldHp -= absorbed;
      remaining -= absorbed;
      changed = true;
    }
    // 2. 再扣护甲（灰色）
    if (remaining > 0 && zombie.armorHp && zombie.armorHp > 0) {
      const absorbed = Math.min(remaining, zombie.armorHp);
      zombie.armorHp -= absorbed;
      remaining -= absorbed;
      changed = true;
    }
    // 3. 最后扣生命
    if (remaining > 0) {
      zombie.hp -= remaining;
      changed = true;
    }
    // 4. 重绘 sprite 以更新血条/护盾条/护甲条
    if (changed && this.renderer && this.renderer.redrawSprite) {
      this.renderer.redrawSprite(zombie);
    }
  }

  // 受到伤害（保卫萝卜模式）
  takeDamage(amount) {
    this.baseHP -= amount;
    if (this.baseHP <= 0) {
      this.baseHP = 0;
      this.gameOver(false);
    }
  }

  // 恢复生命值
  heal(amount) {
    this.baseHP = Math.min(this.baseHP + amount, this.maxBaseHP);
  }

  // 添加能源
  addEnergy(grade, amount) {
    if (this.energy[grade] !== undefined) {
      this.energy[grade] += amount;
    }
  }

  _loop(timestamp) {
    if (!this.running) return;

    const rawDelta = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // Cap deltaTime to prevent huge jumps (e.g., tab switch)
    const deltaTime = Math.min(rawDelta, MAX_DELTA_TIME);

    this.update(deltaTime);

    this.animFrameId = requestAnimationFrame(this._loop);
  }

  update(deltaTime) {
    if (this.state !== STATES.PLAYING) {
      // Still render even when not playing (menu animations, etc.)
      if (this.renderer) {
        this.renderer.update(deltaTime);
      }
      return;
    }

    const dt = deltaTime / 1000; // convert to seconds

    // Update wave management
    this._updateWaves(dt);

    // 更新精英/Boss AI（技能冷却、特殊行为）
    this._updateEliteBossAI(dt);

    // Update all plants
    for (let i = this.plants.length - 1; i >= 0; i--) {
      const plant = this.plants[i];
      this._updatePlant(plant, dt);
      if (plant.hp <= 0) {
        this._removePlant(plant, i);
      }
    }

    // Update all zombies
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const zombie = this.zombies[i];
      this._updateZombie(zombie, dt);
      if (zombie.hp <= 0) {
        this._removeZombie(zombie, i);
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      this._updateProjectile(proj, dt);
      if (proj.dead || proj.x > VIEW_WIDTH || proj.x < 0) {
        // Remove the sprite from scene before removing from array
        if (proj.sprite && this.renderer) {
          this.renderer.removeSprite(proj);
        }
        this.projectiles.splice(i, 1);
      }
    }

    // Update suns (falling, timeout, auto-collect)
    for (let i = this.suns.length - 1; i >= 0; i--) {
      const sun = this.suns[i];
      sun.lifetime -= dt;
      if (sun.falling) {
        sun.y += sun.fallSpeed * dt;
        if (sun.y >= sun.targetY) {
          sun.y = sun.targetY;
          sun.falling = false;
          sun.settleTimer = 0;
        }
      } else {
        // 已落地，累计停留时间用于自动拾取
        sun.settleTimer = (sun.settleTimer || 0) + dt;
      }

      // 自动拾取：阳光落地后立即收集（0 延迟）
      if (this.autoCollectSun && !sun.falling) {
        this.collectSun(i);
        continue;
      }

      if (sun.lifetime <= 0) {
        // 即将超时消失，若开启自动拾取则最后兜底收集一次
        if (this.autoCollectSun) {
          this.collectSun(i);
          continue;
        }
        if (sun.sprite && this.renderer) {
          this.renderer.removeSprite(sun);
        }
        this.suns.splice(i, 1);
      }
    }

    // Update lawn mowers
    this._updateLawnMowers(dt);
    if (this.renderer) {
      this.renderer.updateLawnMowers();
    }

    // Check collisions
    this._checkCollisions();

    // Check win/lose conditions
    this._checkWinLose();

    // Auto-save
    this.autoSaveTimer += deltaTime;
    if (this.autoSaveTimer >= this.autoSaveInterval) {
      this.autoSaveTimer = 0;
      this.saveManager.autoSave();
    }

    // Natural sun drop
    this.naturalSunTimer += deltaTime;
    if (this.naturalSunTimer >= this.naturalSunInterval) {
      this.naturalSunTimer = 0;
      this._dropNaturalSun();
    }

    // Update HUD
    if (typeof window.updatePVZHUD === 'function') {
      window.updatePVZHUD(this);
    }

    // Render
    this.renderer.update(deltaTime);
  }

  _updateWaves(dt) {
    if (!this.waveConfig) {
      // 旧存档兜底：没初始化 waveConfig 时直接返回
      return;
    }

    const phase = this.wavePhase;

    // === 阶段：准备阶段 prep ===
    // 均匀出怪，每次只出一个，当且仅当场上无僵尸才出下一只
    if (phase === 'prep') {
      // 如果队列还有，且场上无僵尸，生成下一只
      if (this.spawnQueue.length > 0 && this.zombies.length === 0) {
        this._spawnNextFromQueue();
      }
      // 队列空且场上无僵尸 → 准备阶段结束
      if (this.spawnQueue.length === 0 && this.zombies.length === 0) {
        console.log('[wave] prep 阶段结束，进入 prelude_1');
        this._startPreludePhase(0);
      }
      return;
    }

    // === 阶段：前置波 prelude_N ===
    // 均匀平滑出怪，按时间间隔
    if (phase.startsWith && phase.startsWith('prelude_')) {
      const waveIdx = parseInt(phase.split('_')[1], 10);
      if (this.spawnQueue.length > 0) {
        this.spawnTimer += dt * 1000;
        if (this.spawnTimer >= this.waveSpawnInterval) {
          this.spawnTimer = 0;
          this._spawnNextFromQueue();
        }
      } else if (this.zombies.length === 0) {
        // 前置波清场完成 → 进入主波
        console.log(`[wave] prelude_${waveIdx} 清场完成，进入 wave_${waveIdx}`);
        this._startMainWave(waveIdx);
      } else {
        // 队列空但场上还有僵尸 → 等待清场
        this.clearWaitTimer += dt;
        if (this.clearWaitTimer >= this.waveConfig.clearWaitTimeout) {
          console.log(`[wave] prelude_${waveIdx} 清场超时，强制进入 wave_${waveIdx}`);
          this._startMainWave(waveIdx);
        }
      }
      return;
    }

    // === 阶段：主波 wave_N ===
    // 一次性密集出怪（每秒15只，3-5秒内出完）
    if (phase.startsWith && phase.startsWith('wave_')) {
      const waveIdx = parseInt(phase.split('_')[1], 10);
      if (this.spawnQueue.length > 0) {
        this.spawnTimer += dt * 1000;
        // 主波出怪间隔：1/15 秒（每秒15只）
        const mainInterval = 1000 / 15;
        while (this.spawnTimer >= mainInterval && this.spawnQueue.length > 0) {
          this.spawnTimer -= mainInterval;
          this._spawnNextFromQueue();
        }
      } else if (this.zombies.length === 0) {
        // 主波清场完成
        const isLastWave = (waveIdx + 1 >= this.waveConfig.totalWaves);
        if (isLastWave) {
          // 最后一波清场完成，检查精英/Boss 是否存活
          const eliteAlive = this.eliteZombie && this.eliteZombie.hp > 0;
          const bossAlive = this.bossZombie && this.bossZombie.hp > 0;
          if (this.waveConfig.isBoss && bossAlive) {
            console.log('[wave] 最后一波清场，但 Boss 仍存活，无法胜利');
            // 继续等待 Boss 被消灭
          } else if (this.waveConfig.isElite && eliteAlive) {
            console.log('[wave] 最后一波清场，但精英仍存活，无法胜利');
            // 继续等待精英被消灭
          } else {
            console.log('[wave] 最后一波清场完成，胜利');
            this.gameOver(true);
          }
        } else {
          // 进入下一波前置
          console.log(`[wave] wave_${waveIdx} 清场完成，进入 prelude_${waveIdx + 1}`);
          this._startPreludePhase(waveIdx + 1);
        }
      } else {
        // 队列空但场上还有僵尸 → 等待清场
        this.clearWaitTimer += dt;
        if (this.clearWaitTimer >= this.waveConfig.clearWaitTimeout) {
          console.log(`[wave] wave_${waveIdx} 清场超时，强制推进`);
          const isLast = (waveIdx + 1 >= this.waveConfig.totalWaves);
          if (isLast) {
            // 超时强制胜利（即使精英/Boss 存活）
            this.gameOver(true);
          } else {
            this._startPreludePhase(waveIdx + 1);
          }
        }
      }
      return;
    }
  }

  // 从出怪队列生成下一只僵尸
  _spawnNextFromQueue() {
    if (this.spawnQueue.length === 0) return;
    const spawn = this.spawnQueue.shift();
    this._spawnZombie(spawn.type, spawn.row, spawn.isElite || false, spawn.isBoss || false);
    this.phaseSpawnedCount++;
  }

  // 启动前置波阶段
  _startPreludePhase(waveIdx) {
    const cfg = this.waveConfig;
    if (!cfg) return;

    // 前置波数量 = 主波数量 × 倍数
    const mainWaveCount = cfg.waveCounts[waveIdx] || 8;
    const multiplier = cfg.preludeMultipliers[waveIdx] || 2.0;
    const preludeCount = Math.floor(mainWaveCount * multiplier);

    // 出怪池
    const pool = waveData.getSpawnPool
      ? waveData.getSpawnPool(cfg.floor)
      : ['normal', 'cone', 'flag'];

    // 生成出怪队列
    this.spawnQueue = [];
    for (let i = 0; i < preludeCount; i++) {
      const type = pool[this._randomInt(0, pool.length - 1)];
      const row = this._randomInt(0, this.sceneConfig.rows - 1);
      this.spawnQueue.push({ type, row, isElite: false, isBoss: false });
    }

    // 出怪间隔：总数 / 持续时间
    this.waveSpawnInterval = (cfg.preludeDuration * 1000) / preludeCount;
    this.spawnTimer = 0;
    this.phaseSpawnedCount = 0;
    this.clearWaitTimer = 0;
    this.wavePhase = `prelude_${waveIdx}`;
    this.isHugeWave = false;
    this.currentWaveIndex = waveIdx;

    // 混沌宝珠：每波刷新随机 buff
    this._applyChaosOrbBuff();
    // 战鼓遗物：每波累计伤害加成
    this._waveDamageStack += this._getRelicEffectSum('wave_damage_stack');

    console.log(`[wave] prelude_${waveIdx} 启动: ${preludeCount} 只, 间隔 ${this.waveSpawnInterval}ms`);
  }

  // 启动主波阶段
  _startMainWave(waveIdx) {
    const cfg = this.waveConfig;
    if (!cfg) return;

    const isLastWave = (waveIdx + 1 >= cfg.totalWaves);
    const mainWaveCount = cfg.waveCounts[waveIdx] || 8;

    // 出怪池
    const pool = waveData.getSpawnPool
      ? waveData.getSpawnPool(cfg.floor)
      : ['normal', 'cone', 'flag'];

    // 生成出怪队列
    this.spawnQueue = [];
    for (let i = 0; i < mainWaveCount; i++) {
      const type = pool[this._randomInt(0, pool.length - 1)];
      const row = this._randomInt(0, this.sceneConfig.rows - 1);
      this.spawnQueue.push({ type, row, isElite: false, isBoss: false });
    }

    // 最后一波生成精英/Boss（一关一个）
    if (isLastWave) {
      if (cfg.isBoss && !this.bossZombie) {
        // Boss 在最后一波中段出现
        const bossRow = this._randomInt(0, this.sceneConfig.rows - 1);
        this.spawnQueue.push({ type: 'boss_zombie', row: bossRow, isElite: false, isBoss: true });
        console.log('[wave] Boss 加入最后一波');
      } else if (cfg.isElite && !this.eliteZombie) {
        const eliteRow = this._randomInt(0, this.sceneConfig.rows - 1);
        this.spawnQueue.push({ type: 'elite_zombie', row: eliteRow, isElite: true, isBoss: false });
        console.log('[wave] 精英加入最后一波');
      }
    }

    this.spawnTimer = 0;
    this.phaseSpawnedCount = 0;
    this.clearWaitTimer = 0;
    this.wavePhase = `wave_${waveIdx}`;
    this.isHugeWave = isLastWave;
    this.currentWaveIndex = waveIdx;
    this.currentWave = waveIdx + 1;  // 1-indexed，兼容旧 UI

    if (isLastWave) {
      this._showWaveWarning();
      if (this.audio) this.audio.playSound('boss_alert');
    }

    // 混沌宝珠：每波刷新随机 buff
    this._applyChaosOrbBuff();
    // 战鼓遗物：每波累计伤害加成
    this._waveDamageStack += this._getRelicEffectSum('wave_damage_stack');

    console.log(`[wave] wave_${waveIdx} 启动: ${mainWaveCount} 只, 一大波=${isLastWave}`);
  }

  _showWaveWarning() {
    if (this.renderer && this.renderer.showWaveWarning) {
      this.renderer.showWaveWarning(this.currentWaveIndex + 1);
    }
    if (this.audio) {
      this.audio.playSound('wave_warning');
    }
  }

  _spawnZombie(type, row, isElite = false, isBoss = false) {
    const torsoData = zombieData.torsos[type] || zombieData.torsos.normal;
    const scaling = waveData.difficultyScaling[this.difficulty] || waveData.difficultyScaling.normal;

    const zombie = {
      type,
      row,
      x: VIEW_WIDTH, // spawn at right edge
      hp: torsoData.hp * scaling.zombieHpMultiplier,
      maxHp: torsoData.hp * scaling.zombieHpMultiplier,
      speed: torsoData.speed * scaling.zombieSpeedMultiplier,
      isElite,
      isBoss,
      eating: false,
      eatTarget: null,
      eatTimer: 0,
      frozen: false,
      frozenTimer: 0,
      slowed: false,
      slowTimer: 0,
      sprite: null
    };

    // 为护甲类僵尸分配独立护甲血量（显示灰色护甲条）
    // 护甲类型的额外血量占总hp的比例
    const armorRatios = {
      armor_cone: 0.45,      // 路障：45% 为护甲
      armor_brick: 0.50,     // 砖块：50%
      armor_bronze: 0.55,    // 青铜：55%
      armor_bucket: 0.65,    // 铁桶：65%
      armor_iron: 0.75,      // 钢铁：75%
      armor_gold: 0.70,
      armor_ice: 0.50,
      armor_stone: 0.60
    };
    if (torsoData.abilities) {
      for (const ability of torsoData.abilities) {
        if (armorRatios[ability]) {
          const ratio = armorRatios[ability];
          zombie.armorMaxHp = Math.round(zombie.maxHp * ratio);
          zombie.armorHp = zombie.armorMaxHp;
          // 从生命值中扣除护甲部分，使护甲破后剩余生命体量合理
          break;
        }
        // 护盾类（如盾牌僵尸）
        if (ability === 'shield_block' || ability === 'shield') {
          zombie.shieldMaxHp = Math.round(zombie.maxHp * 0.40);
          zombie.shieldHp = zombie.shieldMaxHp;
          break;
        }
      }
    }

    if (isElite) {
      zombie.hp *= zombieData.eliteMultiplier.hp;
      zombie.maxHp *= zombieData.eliteMultiplier.hp;
      zombie.speed *= zombieData.eliteMultiplier.speed;
      if (zombie.armorMaxHp) {
        zombie.armorHp *= zombieData.eliteMultiplier.hp;
        zombie.armorMaxHp *= zombieData.eliteMultiplier.hp;
      }
      if (zombie.shieldMaxHp) {
        zombie.shieldHp *= zombieData.eliteMultiplier.hp;
        zombie.shieldMaxHp *= zombieData.eliteMultiplier.hp;
      }
    }

    if (isBoss) {
      const bossId = Object.keys(zombieData.bosses)[0];
      const bossData = zombieData.bosses[bossId];
      zombie.hp = bossData.hp * scaling.zombieHpMultiplier;
      zombie.maxHp = bossData.hp * scaling.zombieHpMultiplier;
      zombie.speed *= zombieData.bossMultiplier.speed;
      zombie.bossId = bossId;
      zombie.phase = bossData.phases[0];
    }

    // 全局基础移速降低 40%（用户要求：所有僵尸移动速度过快）
    zombie.speed *= 0.6;

    // 给僵尸绑定伤害接口（优先扣护盾/护甲，再扣生命）
    const self = this;
    zombie.takeDamage = function(amount) { self.damageZombie(this, amount); };

    // 精英/Boss 特殊初始化
    if (isBoss) {
      zombie.isBoss = true;
      zombie.hp = 2000 + (this.currentFloor || 1) * 300;
      zombie.maxHp = zombie.hp;
      zombie.speed = 8;  // Boss 慢速
      zombie.bossElapsedSec = 0;  // 在场时间（用于技能冷却递减）
      zombie.skills = this._pickBossSkills();
      zombie.skillCooldowns = zombie.skills.map(s => s.initialCooldown || 5);
      this.bossZombie = zombie;
      console.log('[Boss] 生成 Boss, hp=', zombie.hp, 'skills=', zombie.skills.map(s => s.id));
    } else if (isElite) {
      zombie.isElite = true;
      zombie.hp = 800 + (this.currentFloor || 1) * 150;
      zombie.maxHp = zombie.hp;
      zombie.speed = 12;
      zombie.eliteElapsedSec = 0;
      zombie.skills = this._pickEliteSkills();
      zombie.skillCooldowns = zombie.skills.map(s => s.initialCooldown || 5);
      this.eliteZombie = zombie;
      console.log('[Elite] 生成精英, hp=', zombie.hp, 'skills=', zombie.skills.map(s => s.id));
    }

    this.zombies.push(zombie);
    this.renderer.addSprite(zombie);
  }

  // 精英技能池（2个技能）
  _pickEliteSkills() {
    const pool = [
      { id: 'summon_minions', name: '召唤喽啰', cooldown: 15, initialCooldown: 8,
        effect: (z) => this._eliteSummonMinions(z) },
      { id: 'heal_self', name: '自愈', cooldown: 20, initialCooldown: 12,
        effect: (z) => this._eliteHealSelf(z) },
      { id: 'rage_mode', name: '狂暴', cooldown: 25, initialCooldown: 15,
        effect: (z) => this._eliteRageMode(z) },
      { id: 'throw_imp', name: '投掷小鬼', cooldown: 12, initialCooldown: 6,
        effect: (z) => this._eliteThrowImp(z) },
      { id: 'shield_self', name: '护盾', cooldown: 18, initialCooldown: 10,
        effect: (z) => this._eliteShieldSelf(z) },
    ];
    // 随机选2个不重复技能
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  }

  // Boss 技能池（3个技能）
  _pickBossSkills() {
    const pool = [
      { id: 'earthquake', name: '地震', cooldown: 30, initialCooldown: 15,
        effect: (z) => this._bossEarthquake(z) },
      { id: 'summon_elite', name: '召唤精英', cooldown: 40, initialCooldown: 25,
        effect: (z) => this._bossSummonElite(z) },
      { id: 'meteor', name: '陨石打击', cooldown: 25, initialCooldown: 12,
        effect: (z) => this._bossMeteor(z) },
      { id: 'ice_nova', name: '冰霜新星', cooldown: 20, initialCooldown: 10,
        effect: (z) => this._bossIceNova(z) },
      { id: 'life_steal', name: '生命汲取', cooldown: 15, initialCooldown: 8,
        effect: (z) => this._bossLifeSteal(z) },
    ];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  // === 精英技能实现 ===
  _eliteSummonMinions(z) {
    console.log('[Elite] 召唤喽啰');
    const count = 2 + this._randomInt(0, 1);
    for (let i = 0; i < count; i++) {
      const row = z.row;
      const x = z.x - 40 - i * 30;
      this._spawnZombieAt('normal', row, x);
    }
  }

  _eliteHealSelf(z) {
    const heal = Math.floor(z.maxHp * 0.10);
    z.hp = Math.min(z.maxHp, z.hp + heal);
    console.log('[Elite] 自愈 +', heal);
  }

  _eliteRageMode(z) {
    z.rageTimer = 5;  // 5秒狂暴
    console.log('[Elite] 狂暴 5s');
  }

  _eliteThrowImp(z) {
    // 在左侧投掷一个小鬼
    const impX = z.x - 200;
    if (impX > GRID_OFFSET_X) {
      this._spawnZombieAt('normal', z.row, impX);
      console.log('[Elite] 投掷小鬼到 x=', impX);
    }
  }

  _eliteShieldSelf(z) {
    z.shieldHp = (z.shieldHp || 0) + 500;
    z.shieldMaxHp = Math.max(z.shieldMaxHp || 0, z.shieldHp);
    console.log('[Elite] 护盾 +500');
  }

  // === Boss 技能实现 ===
  _bossEarthquake(z) {
    console.log('[Boss] 地震 - 全屏植物眩晕2秒');
    for (const p of this.plants) {
      p.stunned = true;
      p.stunTimer = 2;
    }
  }

  _bossSummonElite(z) {
    console.log('[Boss] 召唤精英');
    // 召唤一个普通精英僵尸作为小怪
    const row = z.row;
    this._spawnZombieAt('normal', row, z.x - 50);
  }

  _bossMeteor(z) {
    console.log('[Boss] 陨石打击 - 随机3个格子');
    for (let i = 0; i < 3; i++) {
      const r = this._randomInt(0, 4);
      const c = this._randomInt(0, 8);
      if (this.grid[r] && this.grid[r][c]) {
        const plant = this.grid[r][c];
        plant.hp = 0;
      }
    }
  }

  _bossIceNova(z) {
    console.log('[Boss] 冰霜新星 - 全屏植物冻结5秒');
    // 应用 ice_effect_bonus 遗物加成（frost_crystal 等线性叠加，延长冻结时长）
    const iceBonus = this._getRelicEffectSum('ice_effect_bonus');
    const frozenDuration = 5 * (1 + iceBonus);
    for (const p of this.plants) {
      p.frozen = true;
      p.frozenTimer = frozenDuration;
      if (this.renderer && this.renderer.redrawSprite) this.renderer.redrawSprite(p);
    }
  }

  _bossLifeSteal(z) {
    let totalDmg = 0;
    for (const p of this.plants) {
      if (p.row === z.row && p.hp > 0) {
        const dmg = 50;
        p.hp -= dmg;
        totalDmg += dmg;
        if (this.renderer && this.renderer.redrawSprite) {
          this.renderer.redrawSprite(p);
        }
      }
    }
    z.hp = Math.min(z.maxHp, z.hp + totalDmg);
    if (this.renderer && this.renderer.redrawSprite) {
      this.renderer.redrawSprite(z);
    }
    console.log('[Boss] 生命汲取 dmg=', totalDmg);
  }

  // 在指定位置生成僵尸（用于技能召唤）
  _spawnZombieAt(type, row, x) {
    const torsoData = zombieData.torsos[type] || zombieData.torsos.normal;
    const scaling = waveData.difficultyScaling[this.difficulty] || waveData.difficultyScaling.normal;
    const zombie = {
      type, row, x,
      hp: torsoData.hp * scaling.zombieHpMultiplier * 0.5,  // 召唤的僵尸血量减半
      maxHp: torsoData.hp * scaling.zombieHpMultiplier * 0.5,
      speed: torsoData.speed * scaling.zombieSpeedMultiplier * 0.6,  // 全局降速 40%
      isElite: false, isBoss: false,
      eating: false, eatTarget: null, eatTimer: 0,
      frozen: false, frozenTimer: 0,
      slowed: false, slowTimer: 0, sprite: null
    };
    const self = this;
    zombie.takeDamage = function(amount) { self.damageZombie(this, amount); };
    this.zombies.push(zombie);
    this.renderer.addSprite(zombie);
  }

  // 更新精英/Boss AI（技能冷却、特殊行为）
  _updateEliteBossAI(dt) {
    const updateOne = (z, isBossFlag) => {
      if (!z || z.hp <= 0) return;
      const elapsedKey = isBossFlag ? 'bossElapsedSec' : 'eliteElapsedSec';
      z[elapsedKey] = (z[elapsedKey] || 0) + dt;

      // 技能冷却递减：随在场时间最多减为原来 1/2
      const reductionFactor = Math.max(0.5, 1 - z[elapsedKey] / 120);

      for (let i = 0; i < z.skills.length; i++) {
        const skill = z.skills[i];
        z.skillCooldowns[i] -= dt;
        if (z.skillCooldowns[i] <= 0) {
          // 释放技能
          console.log(`[${isBossFlag ? 'Boss' : 'Elite'}] 释放技能: ${skill.name}`);
          skill.effect(z);
          // 重置冷却（应用递减）
          z.skillCooldowns[i] = skill.cooldown * reductionFactor;
        }
      }

      // 无植物时直接前进（无视小推车）
      const hasPlantInRow = this.plants.some(p => p.row === z.row && p.hp > 0);
      if (!hasPlantInRow) {
        z.ignoreMower = true;
        z.eating = false;
        z.eatTarget = null;
      }
    };

    if (this.bossZombie) updateOne(this.bossZombie, true);
    if (this.eliteZombie) updateOne(this.eliteZombie, false);
  }

  _updatePlant(plant, dt) {
    if (plant.frozen) {
      plant.frozenTimer -= dt;
      if (plant.frozenTimer <= 0) {
        plant.frozen = false;
        if (this.renderer && this.renderer.redrawSprite) this.renderer.redrawSprite(plant);
      }
      return;
    }
    // 灼烧状态衰减
    if (plant.burningTimer && plant.burningTimer > 0) {
      plant.burningTimer -= dt;
      if (plant.burningTimer <= 0) {
        plant.burningTimer = 0;
        if (this.renderer && this.renderer.redrawSprite) this.renderer.redrawSprite(plant);
      } else if (Math.floor(plant.burningTimer * 4) !== Math.floor((plant.burningTimer + dt) * 4)) {
        // 每 0.25s 重绘一次火焰动画
        if (this.renderer && this.renderer.redrawSprite) this.renderer.redrawSprite(plant);
      }
    }

    // Handle explosive plants
    if (plant.isExplosive) {
      this._updateExplosivePlant(plant, dt);
      return; // Explosive plants don't attack normally
    }

    // 窝瓜：延迟索敌 + 跳跃 + 压扁动画
    if (plant.id === 'squash') {
      this._updateSquash(plant, dt);
      return;
    }

    plant.attackTimer -= dt;
    if (plant.attackTimer <= 0 && plant.data.attack_speed > 0) {
      this._plantAttack(plant);
      // 应用 plant_attack_speed_bonus 遗物加成（rapid_fire 等）：攻速乘数
      const aspdMult = this._getPlantAttackSpeedMultiplier();
      plant.attackTimer = plant.data.attack_speed * aspdMult;
    }

    // Sun production
    if (plant.data.category === 'production' && plant.data.attack_speed > 0) {
      plant.produceTimer -= dt;
      if (plant.produceTimer <= 0) {
        this._produceSun(plant);
        plant.produceTimer = plant.data.attack_speed;
      }
    }
  }

  // 窝瓜更新逻辑：idle(等待) -> targeting(锁定) -> jumping(跳跃) -> squashed(压扁) -> 移除
  _updateSquash(plant, dt) {
    plant.stateTimer -= dt;

    switch (plant.state) {
      case 'idle': {
        // 检测同行前方2格内的僵尸
        const target = this.zombies.find(z =>
          z.hp > 0 &&
          z.row === plant.row &&
          z.x > plant.x &&
          z.x <= plant.x + (plant.data.range || 2) * CELL_SIZE
        );
        if (target) {
          plant.targetZombie = target;
          plant.state = 'targeting';
          plant.stateTimer = 0.5; // 0.5秒延迟索敌（蓄力前摇）
        }
        break;
      }
      case 'targeting': {
        // 蓄力阶段：确认目标仍在范围内
        const t = plant.targetZombie;
        if (!t || t.hp <= 0 || t.row !== plant.row ||
            t.x <= plant.x || t.x > plant.x + (plant.data.range || 2) * CELL_SIZE + 60) {
          // 目标丢失，回到 idle
          plant.state = 'idle';
          plant.targetZombie = null;
          break;
        }
        if (plant.stateTimer <= 0) {
          plant.state = 'jumping';
          plant.stateTimer = 0.35; // 跳跃过程0.35秒
        }
        break;
      }
      case 'jumping': {
        if (plant.stateTimer <= 0) {
          // 落地：对目标及周围1格内的所有僵尸造成伤害（压扁）
          const range = CELL_SIZE; // 压扁范围
          for (const z of this.zombies) {
            if (z.hp > 0 && z.row === plant.row &&
                z.x > plant.x - range && z.x < plant.x + range) {
              this.damageZombie(z, plant.data.damage);
            }
          }
          plant.state = 'squashed';
          plant.stateTimer = 0.5; // 压扁停留0.5秒
        }
        break;
      }
      case 'squashed': {
        if (plant.stateTimer <= 0) {
          // 移除窝瓜
          plant.hp = 0; // 标记为死亡，_removePlant 会在主循环中清理
        }
        break;
      }
    }
  }

  _plantAttack(plant) {
    const data = plant.data;
    if (data.damage <= 0) return;

    // 应用遗物加成：伤害乘数 + 射程加成
    const dmgMult = this._getPlantDamageMultiplier(plant);
    const effectiveDamage = Math.round(data.damage * dmgMult);
    const rangeBonus = this._getPlantRangeBonus();
    const effectiveRange = data.range + rangeBonus;

    // 近战植物（大嘴花等）：直接对范围内僵尸造成伤害
    if (data.category === 'attack_melee') {
      const range = effectiveRange * CELL_SIZE;
      let totalDealt = 0;
      for (const zombie of this.zombies) {
        if (zombie.hp <= 0) continue;
        if (zombie.row === plant.row &&
            zombie.x > plant.x - 20 &&
            zombie.x <= plant.x + range) {
          const before = zombie.hp;
          this.damageZombie(zombie, effectiveDamage);
          totalDealt += (before - zombie.hp);
        }
      }
      // 植物吸血（vampire_fang 等）
      if (totalDealt > 0) this._applyLifesteal(plant, totalDealt);
      if (this.renderer && this.renderer.addPlantAttackEffect) {
        this.renderer.addPlantAttackEffect(plant.x + CELL_SIZE / 2, plant.y + CELL_SIZE / 2, plant.id);
      }
      return;
    }

    // Check if any zombie in range on same row
    const hasTarget = this.zombies.some(z =>
      z.row === plant.row && z.x > plant.x && z.x <= plant.x + effectiveRange * CELL_SIZE
    );
    if (!hasTarget && data.category === 'attack_ranged') return;

    // 暴击判定（critical_lens 等）
    let finalDamage = effectiveDamage;
    const critChance = this._getCritChanceBonus();
    if (critChance > 0 && Math.random() < critChance) {
      finalDamage = Math.round(effectiveDamage * 2);  // 暴击 2 倍伤害
    }

    const proj = {
      x: plant.x + CELL_SIZE / 2,
      y: plant.row * CELL_SIZE + GRID_OFFSET_Y + CELL_SIZE / 2,
      row: plant.row,
      speed: 300, // pixels per second
      damage: finalDamage,
      type: data.gene_pool,
      effect: null,
      dead: false,
      sprite: null
    };

    // Apply special effects
    if (data.gene_pool === 'ice') {
      proj.effect = 'slow';
    } else if (data.gene_pool === 'fire') {
      proj.effect = 'burn';
      proj.damage *= 2;
    }

    this.projectiles.push(proj);
    this.renderer.addSprite(proj);
    this.audio.playSound('shoot');

    // Add plant attack visual effect
    if (this.renderer && this.renderer.addPlantAttackEffect) {
      this.renderer.addPlantAttackEffect(plant.x + CELL_SIZE / 2, plant.y + CELL_SIZE / 2, plant.id);
    }
  }

  // 植物吸血：按造成伤害的比例回血（vampire_fang 等遗物）
  _applyLifesteal(plant, damageDealt) {
    const ratio = this._getLifestealRatio();
    if (ratio <= 0 || !plant || plant.hp <= 0) return;
    const heal = Math.max(1, Math.round(damageDealt * ratio));
    plant.hp = Math.min(plant.maxHp, plant.hp + heal);
    if (this.renderer && this.renderer.redrawSprite) this.renderer.redrawSprite(plant);
  }

  // 根据 ID 查找遗物数据（relicData 是数组，不是字典）
  _findRelicById(relicId) {
    if (!relicData) return null;
    return relicData.find(r => r.id === relicId) || null;
  }

  // 判断是否持有某个遗物
  _hasRelic(relicId) {
    return !!(this.relics && Array.isArray(this.relics) && this.relics.includes(relicId));
  }

  // 线性叠加所有同类遗物效果数值（basic/elite/leader 同类效果可叠加）
  _getRelicEffectSum(effectType) {
    let sum = 0;
    if (!this.relics || !Array.isArray(this.relics)) return 0;
    for (const relicId of this.relics) {
      const r = this._findRelicById(relicId);
      if (r && r.effect && r.effect.type === effectType) {
        sum += r.effect.value || 0;
      }
    }
    return sum;
  }

  // 计算遗物阳光加成（0.05 = +5% per sun_amplifier）
  _getSunProductionBonus() {
    return this._getRelicEffectSum('sun_production_bonus');
  }

  // ============ 主动激活遗物 ============

  // 基因搅拌器：免费重投一次上次杂交结果（一次性消耗）
  useRerollHybrid() {
    if (!this._hasRelic('gene_scrambler')) return { ok: false, reason: '未持有基因搅拌器' };
    if (!this.lab || typeof this.lab.rerollLastHybrid !== 'function') {
      return { ok: false, reason: '当前无法重投杂交' };
    }
    const result = this.lab.rerollLastHybrid();
    if (!result || result.error) {
      return { ok: false, reason: result ? result.error : '重投失败' };
    }
    // 一次性消耗：从 relics 中移除
    this.relics = this.relics.filter(id => id !== 'gene_scrambler');
    return { ok: true, result };
  }

  // 时间回溯：撤销当前波次（一次性消耗）
  // 实现：移除本波生成的所有僵尸，回退到上一阶段入口
  useUndoWave() {
    if (!this._hasRelic('time_rewind')) return { ok: false, reason: '未持有时间回溯' };
    if (this.state !== STATES.PLAYING) return { ok: false, reason: '仅战斗中可用' };
    if (!this.waveConfig) return { ok: false, reason: '无波次配置' };
    if (this.wavePhase === 'prep' || this.wavePhase === 'victory') {
      return { ok: false, reason: '当前阶段无法回溯' };
    }

    // 移除场上所有非精英/非Boss僵尸（本波生成的）
    const removedCount = this.zombies.length;
    this.zombies = this.zombies.filter(z => {
      if (z.isBoss || z.isElite) return true;  // 保留 Boss/精英（不重复刷）
      // 移除 sprite
      if (this.renderer && this.renderer.removeSprite && z.sprite) {
        this.renderer.removeSprite(z.sprite);
      }
      return false;
    });
    // 清空待生成队列
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.phaseSpawnedCount = 0;

    // 回退阶段：回到当前波次的前置阶段
    const waveIdx = this.currentWaveIndex;
    this._startPreludePhase(waveIdx);
    console.log(`[relic] 时间回溯：移除 ${removedCount - this.zombies.length} 只僵尸，回退到 prelude_${waveIdx}`);

    // 一次性消耗
    this.relics = this.relics.filter(id => id !== 'time_rewind');
    return { ok: true };
  }

  // 混沌宝珠：每波开始时随机 buff（被动，每波切换时刷新）
  _applyChaosOrbBuff() {
    if (!this._hasRelic('chaos_orb')) {
      this._chaosOrbBuff = null;
      return;
    }
    const buffs = [
      { type: 'damage_up',     value: 0.2, label: '伤害+20%' },
      { type: 'attack_speed',  value: 0.15, label: '攻速+15%' },
      { type: 'sun_up',        value: 0.3, label: '阳光+30%' },
      { type: 'hp_regen',      value: 5, label: '植物每秒回血5' },
    ];
    const buff = buffs[Math.floor(Math.random() * buffs.length)];
    buff.waveIdx = this.currentWaveIndex;
    this._chaosOrbBuff = buff;
    console.log(`[relic] 混沌宝珠：${buff.label}（波次 ${buff.waveIdx}）`);
  }

  // 获取混沌宝珠 buff 值（供各系统查询）
  getChaosOrbBuff(buffType) {
    if (!this._chaosOrbBuff || this._chaosOrbBuff.type !== buffType) return 0;
    return this._chaosOrbBuff.value;
  }

  // 返回所有持有的"主动激活"遗物（用于 UI 渲染按钮）
  getActiveRelics() {
    const activeIds = ['gene_scrambler', 'time_rewind', 'time_freeze', 'swap_doll'];
    if (!this.relics) return [];
    return this.relics.filter(id => activeIds.includes(id));
  }

  // 卡槽实际数量 = 基础 cardSlots + extra_slots 遗物加成（slot_expander 等线性叠加）
  getEffectiveCardSlots() {
    return this.cardSlots + this._getRelicEffectSum('extra_slots');
  }

  // ============ Phase 2: 植物/基地遗物加成查询 ============

  // 植物伤害加成（plant_damage_bonus + 近战 melee_damage_bonus + 战鼓 wave_damage_stack 累计）
  _getPlantDamageMultiplier(plant) {
    let mult = 1 + this._getRelicEffectSum('plant_damage_bonus');
    if (plant && plant.data && plant.data.category === 'attack_melee') {
      mult += this._getRelicEffectSum('melee_damage_bonus');
    }
    // 战鼓：每波累计加成
    if (this._waveDamageStack) {
      mult += this._waveDamageStack;
    }
    // 狂战士印记：植物生命<30%时伤害+50%
    if (plant && plant.maxHp && plant.hp > 0 && plant.hp / plant.maxHp < 0.3) {
      mult += this._getRelicEffectSum('damage_below_30hp');
    }
    return mult;
  }

  // 植物生命加成（iron_boots 等）
  _getPlantHpBonus() {
    return this._getRelicEffectSum('plant_hp_bonus');
  }

  // 植物射程加成（sniper_scope 等）
  _getPlantRangeBonus() {
    return this._getRelicEffectSum('plant_range_bonus');
  }

  // 植物攻速加成（rapid_fire 等）：返回攻速乘数（越小越快）
  _getPlantAttackSpeedMultiplier() {
    return 1 - this._getRelicEffectSum('plant_attack_speed_bonus');
  }

  // 植物阳光消耗减少（energy_crystal 等）
  _getPlantCostReduction() {
    return this._getRelicEffectSum('plant_cost_reduction');
  }

  // 植物吸血比例（vampire_fang 等）
  _getLifestealRatio() {
    return this._getRelicEffectSum('lifesteal');
  }

  // 暴击率加成（critical_lens 等）
  _getCritChanceBonus() {
    return this._getRelicEffectSum('crit_chance_bonus');
  }

  // 植物初始护盾（shield_generator 等）
  _getPlantShieldStart() {
    return this._getRelicEffectSum('plant_shield_start');
  }

  // 基地生命加成（iron_wall / thick_armor / aegis 等）
  _getBaseHpBonus() {
    return this._getRelicEffectSum('base_hp_bonus');
  }

  // 关卡基础金币加成（coin_pouch / savings_jar 等）
  _getFlatCoinBonus() {
    return this._getRelicEffectSum('flat_coin_bonus');
  }

  // 遗物掉落率加成（lucky_clover 等）
  _getRelicDropRateBonus() {
    return this._getRelicEffectSum('relic_drop_rate');
  }

  // 商店折扣（bargain_book 等）
  _getShopDiscount() {
    return this._getRelicEffectSum('shop_discount');
  }

  // 实验室免费刷新次数（lab_upgrade 等）
  _getLabRefreshFree() {
    return this._getRelicEffectSum('lab_refresh_free');
  }

  _produceSun(plant) {
    // 基础产出：向日葵 25 / 双子向日葵 50 / 阳光菇 25
    const baseAmount = plant.data.id === 'twin_sunflower' ? 50 :
                       plant.data.id === 'sun_shroom' ? 25 : 25;
    // 遗物加成：sun_amplifier +5% each
    const bonus = this._getSunProductionBonus();
    // 混沌宝珠 sun_up buff
    const chaosSun = this.getChaosOrbBuff('sun_up');
    const amount = Math.round(baseAmount * (1 + bonus + chaosSun));
    const sun = {
      x: plant.x + 20 + Math.random() * 40,
      y: plant.row * CELL_SIZE + GRID_OFFSET_Y,
      targetY: plant.row * CELL_SIZE + GRID_OFFSET_Y + CELL_SIZE / 2 + Math.random() * 30,
      amount: amount,
      value: amount,                 // 兼容渲染器（renderer 读取 value 字段）
      falling: true,
      fallSpeed: 40,
      lifetime: 10,
      settleTimer: 0,
      sprite: null
    };
    this.suns.push(sun);
    if (this.renderer) this.renderer.addSprite(sun);
  }

  _dropNaturalSun() {
    const col = this._randomInt(0, 8);
    const x = GRID_OFFSET_X + col * CELL_SIZE + 20 + Math.random() * 40;
    const targetRow = this._randomInt(0, 4);
    const targetY = GRID_OFFSET_Y + targetRow * CELL_SIZE + CELL_SIZE / 2 + Math.random() * 30;

    // 自然阳光：25% 几率 50 阳光，75% 几率 25 阳光
    const isLarge = Math.random() < 0.25;
    let baseAmount = isLarge ? 50 : 25;
    // 遗物加成
    const bonus = this._getSunProductionBonus();
    // 混沌宝珠 sun_up buff
    const chaosSun = this.getChaosOrbBuff('sun_up');
    const amount = Math.round(baseAmount * (1 + bonus + chaosSun));

    const sun = {
      x: x,
      y: 50,
      targetY: targetY,
      amount: amount,
      value: amount,                 // 兼容渲染器
      falling: true,
      fallSpeed: 60,
      lifetime: 12,
      settleTimer: 0,
      sprite: null
    };
    this.suns.push(sun);
    if (this.renderer) this.renderer.addSprite(sun);
  }

  _updateExplosivePlant(plant, dt) {
    // Potato Mine arming logic
    if (plant.id === 'potato_mine' && !plant.isArmed) {
      plant.armTimer -= dt;
      if (plant.armTimer <= 0) {
        plant.isArmed = true;
        // 重绘 sprite 显示武装状态（红灯亮起）
        if (this.renderer && this.renderer.redrawSprite) {
          this.renderer.redrawSprite(plant);
        }
      }
      return;
    }

    // Fuse-based explosions (Cherry Bomb, Doom-shroom, Jalapeno)
    if (plant.explodeOnFuse) {
      plant.fuseTimer -= dt;
      // 樱桃炸弹倒计时闪烁重绘
      if (this.renderer && this.renderer.redrawSprite && plant.fuseTimer > 0) {
        this.renderer.redrawSprite(plant);
      }
      if (plant.fuseTimer <= 0) {
        this._triggerExplosion(plant);
      }
      return;
    }

    // Contact-based explosions (Potato Mine when armed)
    if (plant.explodeOnContact && plant.isArmed) {
      // 检测同格或相邻格的僵尸（必须比啃食范围更宽，确保武装后立即爆炸）
      // 僵尸啃食起始位置 z.x <= plant.x + 60，所以爆炸检测也覆盖该范围
      const zombieOnPlant = this.zombies.find(z =>
        z.row === plant.row &&
        z.hp > 0 &&
        z.x >= plant.x - 30 &&
        z.x <= plant.x + CELL_SIZE  // 整个格子范围内的僵尸都触发
      );
      if (zombieOnPlant) {
        this._triggerExplosion(plant);
      }
    }
  }

  _triggerExplosion(plant) {
    const data = plant.data;
    const damage = data.damage;

    if (plant.isRowExplosion) {
      // Jalapeno: damage all zombies in the entire row
      // 应用 fire_damage_bonus 遗物加成（fire_essence 等线性叠加，提升火焰伤害）
      const fireBonus = this._getRelicEffectSum('fire_damage_bonus');
      const fireDamage = fireBonus > 0 ? Math.round(damage * (1 + fireBonus)) : damage;
      for (const zombie of this.zombies) {
        if (zombie.row === plant.row && zombie.hp > 0) {
          this.damageZombie(zombie, fireDamage);
          // Apply burn effect for Jalapeno
          zombie.burning = true;
          zombie.burnTimer = 3;
        }
      }
      // Add visual effect for row explosion
      this.renderer.addExplosionEffect(plant.x, plant.y, 'row', plant.row);
    } else {
      // Area explosion (Cherry Bomb, Potato Mine, Doom-shroom)
      const range = data.range || 1;
      const centerX = plant.x + CELL_SIZE / 2;
      const centerY = plant.y + CELL_SIZE / 2;

      for (const zombie of this.zombies) {
        if (zombie.hp <= 0) continue;

        // Calculate distance from plant center to zombie
        const zombieX = zombie.x + 30;
        const zombieY = zombie.row * CELL_SIZE + GRID_OFFSET_Y + CELL_SIZE / 2;
        const dx = Math.abs(zombieX - centerX);
        const dy = Math.abs(zombieY - centerY);

        // Check if zombie is within explosion range (in grid cells)
        const rangeInPixels = range * CELL_SIZE;
        if (dx <= rangeInPixels && dy <= rangeInPixels) {
          this.damageZombie(zombie, damage);

          // Doom-shroom leaves a crater that blocks planting
          if (plant.id === 'doom_shroom') {
            this._createCrater(plant.row, plant.col);
          }
        }
      }

      // Add visual effect for area explosion
      this.renderer.addExplosionEffect(centerX, centerY, 'area', range);
    }

    // Play explosion sound
    this.audio.playSound('explosion');

    // Remove the explosive plant after detonation
    const plantIndex = this.plants.indexOf(plant);
    if (plantIndex !== -1) {
      this._removePlant(plant, plantIndex);
    }
  }

  _createCrater(row, col) {
    // Mark grid cell as having a crater (blocks planting for some time)
    if (!this.craters) this.craters = [];
    this.craters.push({
      row,
      col,
      timer: 30 // 30 seconds duration
    });
    // Visual effect handled by renderer
  }

  _updateZombie(zombie, dt) {
    // Frozen check
    if (zombie.frozen) {
      zombie.frozenTimer -= dt;
      if (zombie.frozenTimer <= 0) zombie.frozen = false;
      return;
    }

    // Slow effect
    let speedMult = 1;
    if (zombie.slowed) {
      zombie.slowTimer -= dt;
      if (zombie.slowTimer <= 0) {
        zombie.slowed = false;
      } else {
        speedMult = 0.5;
      }
    }

    if (zombie.eating) {
      zombie.eatTimer -= dt;
      if (zombie.eatTimer <= 0) {
        zombie.eatTimer = 0.5; // bite every 0.5s
        if (zombie.eatTarget) {
          zombie.eatTarget.hp -= 100;
          if (this.renderer && this.renderer.redrawSprite) {
            this.renderer.redrawSprite(zombie.eatTarget);
          }
          this.audio.playSound('chomp');
        }
      }
    } else {
      // Move left
      zombie.x -= zombie.speed * speedMult * 30 * dt;
    }
  }

  _updateProjectile(proj, dt) {
    proj.x += proj.speed * dt;

    // Check collision with zombies
    for (const zombie of this.zombies) {
      if (zombie.row === proj.row &&
          Math.abs(zombie.x - proj.x) < 30 &&
          zombie.hp > 0) {
        this.damageZombie(zombie, proj.damage);

        // Add damage number
        if (this.renderer && this.renderer.showDamageNumber) {
          this.renderer.showDamageNumber(zombie.x + 30, zombie.row * CELL_SIZE + GRID_OFFSET_Y + CELL_SIZE / 2, proj.damage);
        }

        // Add hit spark effect
        if (this.renderer && this.renderer.addHitSpark) {
          this.renderer.addHitSpark(proj.x, proj.y);
        }

        if (proj.effect === 'slow') {
          zombie.slowed = true;
          // 应用 ice_effect_bonus 遗物加成（frost_crystal 等线性叠加，延长减速时长）
          const iceBonus = this._getRelicEffectSum('ice_effect_bonus');
          zombie.slowTimer = 3 * (1 + iceBonus);
        } else if (proj.effect === 'burn') {
          // Burn could be expanded
        }

        proj.dead = true;
        break;
      }
    }
  }

  _updateLawnMowers(dt) {
    for (const mower of this.lawnMowers) {
      if (mower.triggered && mower.active) {
        mower.x += 400 * dt;
        // Kill all zombies in its path
        for (let i = this.zombies.length - 1; i >= 0; i--) {
          const z = this.zombies[i];
          if (z.row === mower.row && Math.abs(z.x - mower.x) < 40) {
            z.hp = 0;
            this.audio.playSound('explosion');
          }
        }
        // Remove mower when off screen
        if (mower.x > VIEW_WIDTH) {
          mower.active = false;
        }
      }
    }
  }

  _checkCollisions() {
    for (const zombie of this.zombies) {
      if (zombie.eating || zombie.hp <= 0) continue;

      // Check if zombie reached a plant
      const col = Math.floor((zombie.x - GRID_OFFSET_X) / CELL_SIZE);
      const row = zombie.row;
      if (col >= 0 && col < 9 && this.grid[row] && this.grid[row][col]) {
        const plant = this.grid[row][col];
        if (plant && zombie.x <= plant.x + CELL_SIZE * 0.6) {
          zombie.eating = true;
          zombie.eatTarget = plant;
          zombie.eatTimer = 0;
        }
      }

      // Check if zombie reached the left edge (lawn mower trigger)
      if (zombie.x <= GRID_OFFSET_X) {
        // 精英/Boss 无视小推车，直接进入屋子扣 100 血
        if (zombie.isBoss || zombie.isElite || zombie.ignoreMower) {
          if (zombie.x <= 0) {
            // 进入屋子
            this.baseHP = Math.max(0, this.baseHP - 100);
            console.log(`[Elite/Boss] 进入屋子扣 100 血, baseHP=${this.baseHP}`);
            // 从场上移除
            zombie.hp = 0;
            if (this.baseHP <= 0) {
              this.gameOver(false);
            }
          }
        } else {
          const mower = this.lawnMowers.find(m => m.row === zombie.row && !m.triggered);
          if (mower) {
            mower.triggered = true;
            mower.active = true;
            this.audio.playSound('explosion');
            // mower_engine 遗物：触发后按几率立即恢复（可再用一次）
            const restoreChance = this._getRelicEffectSum('mower_restore_chance');
            if (restoreChance > 0 && Math.random() < restoreChance) {
              mower.triggered = false;
              mower.active = false;
              console.log(`[relic] 推车引擎触发：行 ${mower.row} 推车自动恢复`);
            }
          } else if (zombie.x <= 0) {
            // No mower left - game over
            this.gameOver(false);
          }
        }
      }
    }
  }

  _checkWinLose() {
    // Lose: zombie reached left edge with no mower
    const zombieAtLeft = this.zombies.find(z => z.x <= 0 && z.hp > 0);
    if (zombieAtLeft) {
      const hasMower = this.lawnMowers.find(m => m.row === zombieAtLeft.row && !m.triggered);
      if (!hasMower) {
        this.gameOver(false);
      }
    }
  }

  _removePlant(plant, index) {
    this.grid[plant.row][plant.col] = null;
    this.renderer.removeSprite(plant);
    this.plants.splice(index, 1);

    // Stop any zombie eating this plant
    for (const z of this.zombies) {
      if (z.eatTarget === plant) {
        z.eating = false;
        z.eatTarget = null;
      }
    }
  }

  _removeZombie(zombie, index) {
    // Add death explosion effect
    if (this.renderer && this.renderer.addDeathExplosion) {
      this.renderer.addDeathExplosion(zombie.x + 30, zombie.row * CELL_SIZE + GRID_OFFSET_Y + CELL_SIZE / 2);
    }

    this.renderer.removeSprite(zombie);
    this.zombies.splice(index, 1);
    this.audio.playSound('zombie_die');

    // 金币掉落：暂存到 _pendingCoins，关卡胜利时统一发放（用户要求"统一到通过此关领取"）
    // 标准：普通 2-6 / 精英 20 / Boss 100 / 雪人 100 / 宝藏 40
    let coinDrop = 0;
    if (zombie.isBoss) {
      coinDrop = 100;
    } else if (zombie.isElite) {
      coinDrop = 20;
    } else if (zombie.type === 'yeti') {
      coinDrop = 100;
    } else if (zombie.type === 'treasure_hunter') {
      coinDrop = 40;
    } else {
      // 普通僵尸 2-6 金币
      coinDrop = 2 + Math.floor(Math.random() * 5);
    }
    // 应用 coin_drop_bonus 遗物加成
    const coinBonus = this._getCoinDropBonus();
    coinDrop = Math.round(coinDrop * (1 + coinBonus));
    this._pendingCoins = (this._pendingCoins || 0) + coinDrop;

    // 精英/Boss/雪人/宝藏僵尸有几率掉落遗物
    if (zombie.isBoss) {
      this._pendingRelicDrop = true;
      this._pendingRelicTier = 'leader';
    } else if (zombie.type === 'yeti') {
      // 雪人 100% 掉落遗物（leader 品阶）
      this._pendingRelicDrop = true;
      this._pendingRelicTier = 'leader';
    } else if (zombie.type === 'treasure_hunter') {
      // 宝藏僵尸 60% 掉落遗物（elite 品阶）
      if (Math.random() < (0.6 + this._getRelicDropRateBonus())) {
        this._pendingRelicDrop = true;
        this._pendingRelicTier = 'elite';
      }
    } else if (zombie.isElite && Math.random() < (0.25 + this._getRelicDropRateBonus())) {
      this._pendingRelicDrop = true;
      this._pendingRelicTier = 'elite';
    }
  }

  // 遗物金币掉落加成
  _getCoinDropBonus() {
    let bonus = 0;
    if (this.relics && Array.isArray(this.relics)) {
      for (const relicId of this.relics) {
        const rData = this._findRelicById(relicId);
        if (rData && rData.effect && rData.effect.type === 'coin_drop_bonus') {
          bonus += rData.effect.value || 0;
        }
      }
    }
    return bonus;
  }

  placePlant(plantId, row, col) {
    if (this.state !== STATES.PLAYING) return false;
    if (row < 0 || row >= 5 || col < 0 || col >= 9) return false;
    if (this.grid[row][col]) return false;

    const data = plantData[plantId];
    if (!data) return false;

    // 应用 plant_cost_reduction 遗物加成（energy_crystal 等）
    const costReduction = this._getPlantCostReduction();
    const effectiveCost = Math.max(0, Math.round(data.cost * (1 - costReduction)));
    if (this.sun < effectiveCost) return false;

    // Check aquatic requirement
    const isWaterRow = this.sceneConfig.waterRows.includes(row);
    if (data.is_aquatic && !isWaterRow && plantId !== 'lilypad') return false;
    if (!data.is_aquatic && isWaterRow && plantId !== 'lilypad' && plantId !== 'tangle_kelp' && plantId !== 'sea_shroom') return false;

    // Deduct sun（使用遗物减免后的消耗）
    this.sun -= effectiveCost;

    // 应用遗物加成：植物生命/护盾
    const hpBonus = this._getPlantHpBonus();
    const effectiveHp = Math.round(data.hp * (1 + hpBonus));
    const shieldStart = this._getPlantShieldStart();

    const plant = {
      id: plantId,
      data,
      row,
      col,
      x: GRID_OFFSET_X + col * CELL_SIZE,
      y: GRID_OFFSET_Y + row * CELL_SIZE,
      hp: effectiveHp,
      maxHp: effectiveHp,
      attackTimer: data.attack_speed,
      produceTimer: data.attack_speed,
      frozen: false,
      frozenTimer: 0,
      sprite: null
    };

    // 应用植物初始护盾（shield_generator 等遗物）
    if (shieldStart > 0) {
      plant.shieldHp = shieldStart;
      plant.maxShieldHp = shieldStart;
    }

    // 大嘴花：种下后短时间内即可首次攻击（避免等 30s 才咬）
    if (plantId === 'chomper') {
      plant.attackTimer = 1.0; // 1 秒后即可首次攻击
    }

    // Initialize explosive plant properties
    if (data.category === 'explosive') {
      plant.isExplosive = true;
      plant.fuseTimer = 0;

      // Cherry Bomb and Doom-shroom explode immediately (short fuse)
      if (plantId === 'cherry_bomb' || plantId === 'doom_shroom') {
        plant.fuseTimer = 1.0; // 1 second fuse
        plant.explodeOnFuse = true;
      }

      // Potato Mine needs arming time
      if (plantId === 'potato_mine') {
        plant.isArmed = false;
        plant.armTimer = 7; // 7 seconds to arm（原 10s，降低 30%）
        plant.explodeOnContact = true;
      }

      // Jalapeno explodes immediately (burns entire row)
      if (plantId === 'jalapeno') {
        plant.fuseTimer = 0.5; // 0.5 second fuse
        plant.explodeOnFuse = true;
        plant.isRowExplosion = true;
      }
    }

    // 窝瓜：近战跳跃攻击，带延迟索敌和压扁动画
    if (plantId === 'squash') {
      plant.state = 'idle';       // idle -> targeting -> jumping -> squashed -> remove
      plant.stateTimer = 0;
      plant.targetZombie = null;
    }

    this.plants.push(plant);
    this.grid[row][col] = plant;
    this.renderer.addSprite(plant);
    this.audio.playSound('plant');

    return true;
  }

  collectSun(sunIndex) {
    if (sunIndex < 0 || sunIndex >= this.suns.length) return;
    const sun = this.suns[sunIndex];
    // Fix: use 'amount' instead of 'value' to match sun object property
    const sunAmount = sun.amount || sun.value || 25;
    this.sun += sunAmount;
    this.suns.splice(sunIndex, 1);
    if (this.renderer && this.renderer.removeSprite) {
      this.renderer.removeSprite(sun);
    }
    this.audio.playSound('sun_collect');
  }

  pause() {
    if (this.state === STATES.PLAYING) {
      this.previousState = this.state;
      this.setState(STATES.PAUSED);
    }
  }

  resume() {
    if (this.state === STATES.PAUSED) {
      this.setState(this.previousState || STATES.PLAYING);
    }
  }

  gameOver(won) {
    if (won) {
      // 战斗胜利：标记当前节点完成并解锁下一层可达节点
      if (this.currentNode) {
        this.completeNode(this.currentNode.id);
        this.currentNode = null;
      }

      // === 杀戮尖塔式关卡奖励系统 ===
      // 1. 金币：基础 + 节点类型加成 + 僵尸掉落累计
      const pendingFromKills = this._pendingCoins || 0;
      let nodeBaseCoins = 5 + this.floor;
      let isEliteNode = false;
      let isBossNode = false;
      if (this.waveConfig) {
        if (this.waveConfig.isBoss) {
          nodeBaseCoins = 50 + this.floor * 5;
          isBossNode = true;
        } else if (this.waveConfig.isElite) {
          nodeBaseCoins = 25 + this.floor * 2;
          isEliteNode = true;
        }
      }
      // 应用遗物加成：百分比加成 + 固定加成（coin_pouch / savings_jar 等）
      const coinBonus = this._getCoinDropBonus();
      const flatBonus = this._getFlatCoinBonus();
      const totalCoins = Math.round((nodeBaseCoins + pendingFromKills) * (1 + coinBonus)) + flatBonus;
      this.coins += totalCoins;

      // 2. 植物卡片：从 unlockedPlants 中随机选 3 个供玩家选 1
      // 优先选择未在 loadout 中的，确保选择有意义
      const candidatePool = this.unlockedPlants.slice();
      const shuffled = candidatePool.sort(() => Math.random() - 0.5);
      const cardChoices = shuffled.slice(0, Math.min(3, shuffled.length));

      // 3. 遗物：基于僵尸掉落标记决定是否奖励
      let relicReward = null;
      if (this._pendingRelicDrop) {
        const tier = this._pendingRelicTier || 'basic';
        // 从对应 tier 的遗物中随机一个（未拥有的）
        const owned = new Set(this.relics || []);
        const candidates = relicData.filter(r =>
          (r.tier === tier || (tier === 'leader' && r.tier === 'elite')) &&
          !owned.has(r.id) &&
          r.dropRate !== 'unique'  // unique 遗物只能通过特殊事件获得
        );
        if (candidates.length > 0) {
          relicReward = candidates[Math.floor(Math.random() * candidates.length)];
        }
      }

      // 4. 存储到 _lastVictoryRewards 供 UI 使用
      this._lastVictoryRewards = {
        coins: totalCoins,
        baseCoins: nodeBaseCoins,
        killCoins: pendingFromKills,
        flatBonus: flatBonus,
        cardChoices: cardChoices,
        relic: relicReward,
        nodeType: isBossNode ? 'boss' : (isEliteNode ? 'elite' : 'battle'),
      };

      // 兼容旧 UI 代码
      this._lastVictoryCoins = totalCoins;
      this._lastVictoryPlants = cardChoices;

      // 重置待发放奖励
      this._pendingCoins = 0;
      this._pendingRelicDrop = false;
      this._pendingRelicTier = null;

      this.setState(STATES.VICTORY);
      this.audio.playSound('coin');
    } else {
      // phoenix_feather 遗物：首次死亡时复活，恢复 50% 基地生命
      if (this._hasRelic('phoenix_feather') && !this._reviveUsed) {
        this._reviveUsed = true;
        // 移除遗物（一次性消耗）
        this.relics = this.relics.filter(id => id !== 'phoenix_feather');
        // 恢复基地生命 50%（由遗物 value 决定）
        const reviveRatio = this._findRelicById('phoenix_feather')?.effect?.value || 0.5;
        this.baseHP = Math.max(1, Math.round(this.maxBaseHP * reviveRatio));
        // 清场：移除场上所有僵尸（保留植物）
        for (const z of this.zombies) {
          if (this.renderer && this.renderer.removeSprite && z.sprite) {
            this.renderer.removeSprite(z.sprite);
          }
        }
        this.zombies = [];
        this.spawnQueue = [];
        this.wavePhase = 'prep';
        console.log('[relic] 凤凰之羽触发：复活，恢复基地生命至', this.baseHP);
        // 不进入 GAME_OVER，继续游戏
        return;
      }
      this.setState(STATES.GAME_OVER);
    }
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  // ============ Phase 4: 特殊机制遗物 ============

  // time_freeze 遗物：主动冻结所有僵尸 3 秒
  useTimeFreeze() {
    if (!this._hasRelic('time_freeze')) return { ok: false, reason: '未持有时间冰封' };
    if (this.state !== STATES.PLAYING) return { ok: false, reason: '仅战斗中可用' };
    const freezeDuration = this._findRelicById('time_freeze')?.effect?.value || 3;
    for (const z of this.zombies) {
      z.frozen = true;
      z.frozenTimer = (z.frozenTimer || 0) + freezeDuration;
      if (this.renderer && this.renderer.redrawSprite && z.sprite) {
        this.renderer.redrawSprite(z);
      }
    }
    console.log(`[relic] 时间冰封：冻结 ${this.zombies.length} 只僵尸 ${freezeDuration} 秒`);
    // 一次性消耗
    this.relics = this.relics.filter(id => id !== 'time_freeze');
    return { ok: true, frozenCount: this.zombies.length };
  }

  // swap_doll 遗物：主动交换场上两个植物位置
  useSwapDoll(plantA, plantB) {
    if (!this._hasRelic('swap_doll')) return { ok: false, reason: '未持有换位娃娃' };
    if (this.state !== STATES.PLAYING) return { ok: false, reason: '仅战斗中可用' };
    if (!plantA || !plantB || plantA === plantB) {
      return { ok: false, reason: '请选择两个不同的植物' };
    }
    if (plantA.row !== plantB.row && plantA.col !== plantB.col) {
      // 允许任意位置交换，不限制同行同列
    }
    // 交换网格位置
    const tempRow = plantA.row, tempCol = plantA.col;
    const tempX = plantA.x, tempY = plantA.y;
    plantA.row = plantB.row;
    plantA.col = plantB.col;
    plantA.x = plantB.x;
    plantA.y = plantB.y;
    plantB.row = tempRow;
    plantB.col = tempCol;
    plantB.x = tempX;
    plantB.y = tempY;
    // 更新网格引用
    this.grid[plantA.row][plantA.col] = plantA;
    this.grid[plantB.row][plantB.col] = plantB;
    // 重绘 sprite 位置
    if (this.renderer) {
      if (this.renderer.redrawSprite) this.renderer.redrawSprite(plantA);
      if (this.renderer.redrawSprite) this.renderer.redrawSprite(plantB);
      if (plantA.sprite) plantA.sprite.position.set(plantA.x, plantA.y, 0);
      if (plantB.sprite) plantB.sprite.position.set(plantB.x, plantB.y, 0);
    }
    console.log(`[relic] 换位娃娃：交换 (${plantA.row},${plantA.col}) <-> (${plantB.row},${plantB.col})`);
    // 一次性消耗
    this.relics = this.relics.filter(id => id !== 'swap_doll');
    return { ok: true };
  }

  // oracle_eye 遗物：查询下一层节点信息（被动，UI 调用此方法获取数据）
  getNextFloorPreview() {
    if (!this._hasRelic('oracle_eye')) return null;
    if (!this.towerMap || this.currentFloor >= this.towerMap.length) return null;
    const nextFloor = this.towerMap[this.currentFloor];  // currentFloor 是 1-based，towerMap[0] 是第1层
    if (!nextFloor) return null;
    return {
      floor: this.currentFloor + 1,
      nodes: nextFloor.nodes.map(n => ({
        type: n.type,
        id: n.id,
        eventType: n.eventType,
        completed: n.completed,
        accessible: n.accessible
      }))
    };
  }

  // ============ Phase 5: 遗物获取渠道扩展 ============

  // 通用方法：按品阶随机发放遗物（用于事件/雪人/宝藏僵尸等渠道）
  // tier 可为 'basic' / 'elite' / 'leader' / 'special'
  // 返回发放的遗物数据，若无可发放则返回 null
  _grantRandomRelic(tier = 'basic') {
    if (!relicData || !this.relics) return null;
    const owned = new Set(this.relics);
    // 候选：同 tier 或更低 tier（leader 也包含 elite），且未持有，且非 unique
    const candidates = relicData.filter(r => {
      if (owned.has(r.id)) return false;
      if (r.dropRate === 'unique') return false;
      if (tier === 'leader') {
        return r.tier === 'leader' || r.tier === 'elite' || r.tier === 'basic';
      }
      if (tier === 'elite') {
        return r.tier === 'elite' || r.tier === 'basic';
      }
      if (tier === 'special') {
        return r.tier === 'special' || r.tier === 'leader' || r.tier === 'elite' || r.tier === 'basic';
      }
      return r.tier === tier;
    });
    if (candidates.length === 0) return null;
    const relic = candidates[Math.floor(Math.random() * candidates.length)];
    this.relics.push(relic.id);
    console.log(`[relic] 获得遗物：${relic.name_cn} (${relic.tier})，来源：${tier} 渠道`);
    return relic;
  }

  // 处理胜利后玩家选择植物卡片
  selectVictoryPlant(plantId) {
    if (!this._lastVictoryRewards || !this._lastVictoryRewards.cardChoices.includes(plantId)) {
      return false;
    }
    // 添加到实验室库存
    if (!this.lab) {
      // 动态加载 Lab
      try {
        // Lab 已在 main.js 中创建，这里兜底
        this.lab = window.__gameLab;
      } catch (e) { /* ignore */ }
    }
    if (this.lab && this.lab.addPlant) {
      this.lab.addPlant(plantId, 1);
    } else {
      // 兜底：直接加到 unlockedPlants
      if (!this.unlockedPlants.includes(plantId)) {
        this.unlockedPlants.push(plantId);
      }
    }
    // 标记已领取
    this._lastVictoryRewards.cardChoices = [];
    this._lastVictoryRewards.selectedPlant = plantId;
    return true;
  }

  // 处理胜利后遗物领取
  claimVictoryRelic() {
    if (!this._lastVictoryRewards || !this._lastVictoryRewards.relic) {
      return false;
    }
    const relic = this._lastVictoryRewards.relic;
    if (!this.relics.includes(relic.id)) {
      this.relics.push(relic.id);
    }
    this._lastVictoryRewards.relic = null;
    return true;
  }

  getState() {
    return this.state;
  }

  setState(newState) {
    this.state = newState;
  }

  getGridPosition(worldX, worldY) {
    const col = Math.floor((worldX - GRID_OFFSET_X) / CELL_SIZE);
    const row = Math.floor((worldY - GRID_OFFSET_Y) / CELL_SIZE);
    return { row, col };
  }

  _randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  _getPlantData(plantId) {
    return plantData[plantId];
  }
}

export { STATES };
