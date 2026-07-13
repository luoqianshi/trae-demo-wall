// 避难所系统 - 核心数据管理
// 版本: 2.0 - 支持多存档槽

// ==================== 存档系统核心 ====================
const SAVE_KEY_PREFIX = 'gameSave_v2_';
const OLD_SHELTER_KEY = 'zombieShelter_v1'; // 旧数据键（保留作为备份）
const MAX_SAVE_SLOTS = 5;

// 当前活动存档槽（-1表示未选择）
let currentSlot = -1;

// 避难所数据（当前存档的数据）
let shelterData = null;

// ==================== 存档管理函数 ====================

// 获取存档列表（包含完整信息）
function getSaveList() {
  const saves = [];
  for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
    try {
      const data = localStorage.getItem(SAVE_KEY_PREFIX + i);
      if (data) {
        const parsed = JSON.parse(data);
        saves.push({
          slot: i,
          name: parsed.name || `存档 ${i + 1}`,
          createdAt: parsed.createdAt,
          updatedAt: parsed.updatedAt,
          hasData: true,
          // 避难所发展信息
          shelterLevel: getShelterLevel(parsed.shelter),
          facilityCount: parsed.shelter?.facilities?.length || 0,
          survivorCount: parsed.shelter?.survivors?.length || 0,
          resourceRating: getResourceRating(parsed.shelter?.resources),
          // 战斗进度信息
          battleWave: parsed.battle?.wave || 0,
          battleKills: parsed.battle?.kills || 0,
          battleLevel: parsed.battle?.level || 1
        });
      } else {
        saves.push({
          slot: i,
          name: `存档 ${i + 1}`,
          hasData: false
        });
      }
    } catch(e) {
      saves.push({
        slot: i,
        name: `存档 ${i + 1}`,
        hasData: false,
        error: true
      });
    }
  }
  return saves;
}

// 计算避难所等级（基于指挥中心等级）
function getShelterLevel(shelter) {
  if (!shelter || !shelter.facilities) return 0;
  const command = shelter.facilities.find(f => f.type === 'command');
  return command ? command.level : 0;
}

// 计算资源星级（1-5星）
function getResourceRating(resources) {
  if (!resources) return 0;
  const total = (resources.building || 0) + (resources.food || 0) + (resources.parts || 0);
  if (total >= 3000) return 5;
  if (total >= 1500) return 4;
  if (total >= 500) return 3;
  if (total >= 200) return 2;
  if (total >= 50) return 1;
  return 0;
}

// 迁移旧数据到存档1
function migrateOldData() {
  const oldData = localStorage.getItem(OLD_SHELTER_KEY);
  if (!oldData) return false;
  
  // 检查存档1是否已存在
  if (localStorage.getItem(SAVE_KEY_PREFIX + '0')) {
    console.log('[迁移] 存档1已存在，跳过迁移');
    return false;
  }
  
  try {
    // 解码旧数据 - 尝试多种格式
    let oldShelter = null;
    try {
      // 尝试1: 直接解析JSON
      oldShelter = JSON.parse(oldData);
    } catch(e1) {
      try {
        // 尝试2: URL解码后解析
        oldShelter = JSON.parse(decodeURIComponent(oldData));
      } catch(e2) {
        try {
          // 尝试3: Base64解码后解析
          oldShelter = JSON.parse(atob(oldData));
        } catch(e3) {
          // 尝试4: Base64+URL解码
          oldShelter = JSON.parse(decodeURIComponent(atob(oldData)));
        }
      }
    }
    
    if (!oldShelter) return false;
    
    // 创建新存档结构
    const newSave = {
      name: '存档 1 (迁移)',
      createdAt: oldShelter.lastSave || Date.now(),
      updatedAt: Date.now(),
      battle: {
        kills: 0,
        surviveTime: 0,
        wave: 0,
        xp: 0,
        level: 1,
        upgradePoints: 0,
        playerPos: null
      },
      shelter: oldShelter
    };
    
    localStorage.setItem(SAVE_KEY_PREFIX + '0', JSON.stringify(newSave));
    console.log('[迁移] ✅ 旧数据已迁移到存档1');
    
    // 保留旧数据作为备份（不删除）
    console.log('[迁移] ⚠️ 旧数据保留作为备份: ' + OLD_SHELTER_KEY);
    
    return true;
  } catch(e) {
    console.error('[迁移] 失败:', e);
    return false;
  }
}

// 加载指定存档槽的避难所数据
function loadShelterForSlot(slot) {
  try {
    const data = localStorage.getItem(SAVE_KEY_PREFIX + slot);
    if (data) {
      const parsed = JSON.parse(data);
      shelterData = parsed.shelter;
      currentSlot = slot;
      console.log(`[Shelter] ✅ 加载存档${slot + 1}的避难所数据`);
      return true;
    }
  } catch(e) {
    console.error(`[Shelter] ❌ 加载存档${slot + 1}失败:`, e);
  }
  return false;
}

// 保存当前避难所数据到指定存档槽
function saveShelterForSlot(slot) {
  if (!shelterData) return false;

  try {
    const existingData = localStorage.getItem(SAVE_KEY_PREFIX + slot);
    let saveData = existingData ? JSON.parse(existingData) : {
      name: `存档 ${slot + 1}`,
      createdAt: Date.now()
    };

    saveData.shelter = shelterData;
    saveData.updatedAt = Date.now();
    saveData.currentMap = window.currentMap || 'city';
    saveData.savedAt = Date.now();

    // 保存玩家数据
    if (window.player) {
      saveData.player = {
        hp: player.hp,
        maxHp: player.maxHp,
        xp: player.xp,
        level: player.level || 1,
        skills: player.skills || {},
        ammoMult: player.ammoMult || 1,
        pos: camera ? { x: camera.position.x, y: camera.position.y, z: camera.position.z } : null
      };
    }

    // 保存武器数据
    if (window.weapons) {
      saveData.weapons = weapons.map(w => ({
        id: w.id,
        ammo: w.ammo,
        reserve: w.reserve,
        level: w.level || 1,
        unlocked: w.unlocked || false
      }));
    }

    // 保存队友数据
    if (window.allies && allies.length > 0) {
      saveData.allies = allies.map(a => ({
        type: a.type,
        hp: a.hp,
        maxHp: a.maxHp,
        level: a.level || 1,
        xp: a.xp || 0
      }));
    }

    // 保存工事数据
    if (window.deployedFortifications && deployedFortifications.length > 0) {
      saveData.fortifications = deployedFortifications.map(f => ({
        type: f.type,
        x: f.mesh ? f.mesh.position.x : 0,
        z: f.mesh ? f.mesh.position.z : 0,
        health: f.health,
        maxHealth: f.maxHealth
      }));
    }

    // 保存地图进度
    saveData.mapProgress = {};
    if (window.SnowMap) {
      saveData.mapProgress.snow = {
        phase: SnowMap.phase,
        wave: SnowMap.defenseWave,
        completed: SnowMap.phase === 'complete'
      };
    }
    if (window.DesertMap) {
      saveData.mapProgress.desert = {
        phase: DesertMap.phase,
        wave: DesertMap.defenseWave,
        completed: DesertMap.phase === 'complete'
      };
    }
    if (window.SwampMap) {
      saveData.mapProgress.swamp = {
        phase: SwampMap.phase,
        wave: SwampMap.defenseWave,
        completed: SwampMap.defenseWave >= SwampMap.maxWaves
      };
    }

    localStorage.setItem(SAVE_KEY_PREFIX + slot, JSON.stringify(saveData));
    console.log(`[Shelter] ✅ 保存避难所数据到存档${slot + 1}`);
    return true;
  } catch(e) {
    console.error(`[Shelter] ❌ 保存存档${slot + 1}失败:`, e);
    return false;
  }
}

// 为指定存档槽创建新避难所
function createNewShelterForSlot(slot) {
  shelterData = {
    version: 2,
    lastSave: Date.now(),
    lastOnline: Date.now(),
    resources: {
      building: 0,
      food: 100,
      parts: 50,
      power: 0
    },
    facilities: [
      { type: 'command', level: 1 },
      { type: 'scrapyard', level: 1 }
    ],
    survivors: [],
    technologies: {},
    loadout: [null, null, null, null, null, null, null, null],
    researchedFortifications: ['barricade_wood', 'barricade_wire', 'turret_mg', 'mine'],
    stats: {
      totalKills: 0,
      totalWaves: 0,
      highestWave: 0,
      playTime: 0,
      totalProduced: { building: 0, food: 0, parts: 0 },
      totalConsumed: { building: 0, food: 0, parts: 0 },
      battleGained: { building: 0, food: 0, parts: 0 },
      sessionStart: Date.now(),
      sessionProduced: { building: 0, food: 0, parts: 0 }
    },
    battlefieldCharge: 0,
    maxBattlefieldCharge: 100,
    powerUsedThisTick: 0
  };

  // 重置世界地图数据，避免新存档继承旧存档的解锁进度
  if (window.WorldMap && window.WorldMap.WORLD_MAP_DATA && window.WorldMap.WORLD_MAP_DATA.nodes) {
    window.WorldMap.WORLD_MAP_DATA.nodes.forEach(node => {
      node.unlocked = (node.id === 'city');
      node.currentWave = 0;
      node.completed = false;
    });
    if (typeof window.WorldMap.saveData === 'function') {
      window.WorldMap.saveData();
    }
  }
  // 同时清除旧的 worldMapData localStorage 以防万一
  try {
    localStorage.removeItem('worldMapData');
  } catch (e) {}

  currentSlot = slot;
  saveShelterForSlot(slot);
  console.log(`[Shelter] ✅ 为存档${slot + 1}创建新避难所`);
}

// ==================== 原有函数改造 ====================

// 设施定义
const FACILITY_DEFS = {
  command: {
    name: '指挥中心',
    icon: '🏢',
    maxLevel: 5,
    baseCost: { building: 200 },
    costMultiplier: 1,
    description: '提升其他设施等级上限',
    effect: (level) => `其他设施最高${level}级`
  },
  dormitory: {
    name: '宿舍',
    icon: '🏠',
    maxLevel: 5,
    baseCost: { building: 100 },
    costMultiplier: 1,
    description: '增加幸存者容量',
    effect: (level) => `+${level * 2}幸存者上限`,
    unlockAt: { command: 1 }
  },
  scrapyard: {
    name: '拆解台',
    icon: '🔧',
    maxLevel: 5,
    baseCost: { building: 50, parts: 30 },
    costMultiplier: 1,
    description: '生产建材',
    effect: (level) => `+${10 + level * 5}建材/分钟`,
    production: { building: (level) => (10 + level * 5) / 60 } // 每秒产出
  },
  farm: {
    name: '农场',
    icon: '🌾',
    maxLevel: 5,
    baseCost: { building: 80, parts: 20 },
    costMultiplier: 1,
    description: '生产食物',
    effect: (level) => `+${8 + level * 4}食物/分钟`,
    unlockAt: { command: 1 },
    production: { food: (level) => (8 + level * 4) / 60 }
  },
  workshop: {
    name: '工坊',
    icon: '⚙️',
    maxLevel: 5,
    baseCost: { building: 100, parts: 50 },
    costMultiplier: 1,
    description: '生产零件',
    effect: (level) => `+${6 + level * 3}零件/分钟`,
    unlockAt: { command: 2 },
    production: { parts: (level) => (6 + level * 3) / 60 }
  },
  powerplant: {
    name: '发电站',
    icon: '⚡',
    maxLevel: 3,
    baseCost: { building: 150, parts: 100 },
    costMultiplier: 1.5,
    description: '提供电力，为战场充能',
    effect: (level) => `+${level * 50}电力上限，+${level * 5}/秒发电`,
    unlockAt: { command: 2 },
    production: { power: (level) => level * 5 } // 每秒产出 level*5 电力
  },
  warehouse: {
    name: '仓库',
    icon: '📦',
    maxLevel: 5,
    baseCost: { building: 80 },
    costMultiplier: 1,
    description: '增加资源存储上限',
    effect: (level) => `+${level * 500}资源上限`,
    unlockAt: { command: 1 }
  },
  training: {
    name: '训练场',
    icon: '🏋️',
    maxLevel: 3,
    buildCost: { building: 120, parts: 60 },
    upgradeCost: (lv) => ({ building: 80 * lv, parts: 40 * lv }),
    production: { xp: 5 }, // 经验加成
    description: '训练场等级+1，战场经验获取+10%',
    unlockCommand: 2
  },
  medical: {
    name: '医疗站',
    icon: '🏥',
    maxLevel: 3,
    buildCost: { building: 100, parts: 80 },
    upgradeCost: (lv) => ({ building: 60 * lv, parts: 50 * lv }),
    production: { heal: 10 }, // 治疗加成
    description: '每波结束恢复生命值，Lv1恢复20/Lv2恢复40/Lv3恢复60',
    unlockCommand: 2
  },
  radio: {
    name: '通讯塔',
    icon: '📡',
    maxLevel: 3,
    buildCost: { building: 150, parts: 100 },
    upgradeCost: (lv) => ({ building: 100 * lv, parts: 80 * lv }),
    production: { airdrop: 1 },
    description: '通讯塔等级+1，空投频率提升20%',
    unlockCommand: 3
  }
};

// 幸存者类型定义
const SURVIVOR_TYPES = {
  scavenger: {
    name: '拾荒者', icon: '👷', specialty: '拆解',
    efficiency: { building: 1.3 },
    ability: '战场建材掉落+10%',
    battlefieldEffect: { resourceDrop: { type: 'building', bonus: 0.10 } },
    recruitCost: { food: 50 }
  },
  farmer: {
    name: '农民', icon: '👨‍🌾', specialty: '种植',
    efficiency: { food: 1.3 },
    ability: '战场每秒回复+0.5HP',
    battlefieldEffect: { hpRegen: 0.5 },
    recruitCost: { food: 30 }
  },
  engineer: {
    name: '工程师', icon: '👨‍🔧', specialty: '制造',
    efficiency: { parts: 1.3 },
    ability: '防御工事耐久+25%',
    battlefieldEffect: { fortHealthBonus: 0.25 },
    recruitCost: { parts: 40 }
  },
  doctor: {
    name: '医生', icon: '👩‍⚕️', specialty: '医疗',
    efficiency: { food: 0.8 },
    ability: '波次结束额外恢复+30HP',
    battlefieldEffect: { waveHealBonus: 30 },
    recruitCost: { food: 60, parts: 20 }
  },
  hunter: {
    name: '猎人', icon: '🏹', specialty: '战斗',
    efficiency: {},
    ability: '玩家伤害+5%/级',
    battlefieldEffect: { damageBonus: 0.05 },
    recruitCost: { food: 80, parts: 50 }
  },
  chef: {
    name: '厨师', icon: '👨‍🍳', specialty: '烹饪',
    efficiency: { food: 1.5 },
    ability: '食物消耗-20%',
    battlefieldEffect: { foodSave: 0.20 },
    recruitCost: { food: 40, parts: 30 }
  },
  mechanic: {
    name: '机械师', icon: '🔩', specialty: '维修',
    efficiency: { parts: 1.1 },
    ability: '工事自动修复+1HP/5秒',
    battlefieldEffect: { fortAutoRepair: 0.2 },
    recruitCost: { parts: 60, building: 30 }
  },
  scout: {
    name: '侦察兵', icon: '🔭', specialty: '侦查',
    efficiency: {},
    ability: '空投频率+15%，拾取范围+2米',
    battlefieldEffect: { airdropBonus: 0.15, pickupRange: 2 },
    recruitCost: { food: 40, parts: 40 }
  },
  electrician: {
    name: '电工', icon: '⚡', specialty: '发电',
    efficiency: {}, // 电工参与生产但无加成
    ability: '战场充能速度+20%/级',
    battlefieldEffect: { chargeSpeedBonus: 0.20 },
    recruitCost: { food: 50, parts: 50 }
  }
};

// 科技定义
const TECHNOLOGY_DEFS = {
  weapon_upgrade: {
    name: '武器改良',
    icon: '🔫',
    maxLevel: 3,
    cost: (level) => ({ parts: 100 * (level + 1) }),
    effect: (level) => ({ damageMult: 1 + level * 0.05 }),
    description: (level) => `伤害+${(level + 1) * 5}%`
  },
  health_upgrade: {
    name: '生命强化',
    icon: '❤️',
    maxLevel: 3,
    cost: (level) => ({ building: 100 * (level + 1) }),
    effect: (level) => ({ maxHealthBonus: (level + 1) * 20 }),
    description: (level) => `初始生命+${(level + 1) * 20}`
  },
  fortification_upgrade: {
    name: '工事强化',
    icon: '🏗️',
    maxLevel: 3,
    cost: (level) => ({ parts: 80 * (level + 1) }),
    effect: (level) => ({ fortHealthMult: 1 + level * 0.25 }),
    description: (level) => `所有工事耐久+${Math.round(level * 25)}%`
  },
  turret_speed: {
    name: '炮塔攻速',
    icon: '⚡',
    maxLevel: 3,
    cost: (level) => ({ parts: 60 * (level + 1) }),
    effect: (level) => ({ turretSpeedMult: 1 + level * 0.10 }),
    description: (level) => `炮塔攻速+${(level + 1) * 10}%`
  },
  drone_blast: {
    name: '无人机爆炸',
    icon: '💥',
    maxLevel: 3,
    cost: (level) => ({ parts: 80 * (level + 1) }),
    effect: (level) => ({ droneBlastBonus: (level + 1) * 1.0 }),
    description: (level) => `无人机爆炸范围+${(level + 1)}米`
  },
  electric_damage: {
    name: '激光塔强化',
    icon: '⚡',
    maxLevel: 3,
    cost: (level) => ({ parts: 70 * (level + 1) }),
    effect: (level) => ({ electricDamageMult: 1 + level * 0.20 }),
    description: (level) => `激光塔伤害+${(level + 1) * 20}%`
  },
  ammo_efficiency: {
    name: '霰弹弹丸',
    icon: '🔫',
    maxLevel: 3,
    cost: (level) => ({ parts: 50 * (level + 1) }),
    effect: (level) => ({ shotgunPelletBonus: [2, 5, 9][level] }),
    description: (level) => `霰弹塔弹丸+${[2, 5, 9][level]}`
  },
  scavenger_boost: {
    name: '拾荒专精',
    icon: '🔧',
    maxLevel: 3,
    cost: (level) => ({ building: 80 * (level + 1) }),
    effect: (level) => ({ scavengerBoost: level * 0.15 }),
    description: (level) => `战场零件掉落+${(level + 1) * 15}%`
  },
  power_efficiency: {
    name: '电力增效',
    icon: '🔋',
    maxLevel: 3,
    cost: (level) => ({ parts: 80 * (level + 1) }),
    effect: (level) => ({ powerOutputMult: 1 + level * 0.25 }),
    description: (level) => `发电站产出+${(level + 1) * 25}%`
  },
  energy_saving: {
    name: '节能模式',
    icon: '💡',
    maxLevel: 3,
    cost: (level) => ({ parts: 60 * (level + 1) }),
    effect: (level) => ({ powerConsumptionMult: 1 - level * 0.15 }),
    description: (level) => `设施电力消耗-${(level + 1) * 15}%`
  },
  shield_boost: {
    name: '护盾强化',
    icon: '🛡️',
    maxLevel: 3,
    cost: (level) => ({ parts: 100 * (level + 1) }),
    effect: (level) => ({ shieldCapacityMult: 1 + level * 0.50, shieldRegenMult: 1 + level * 0.30 }),
    description: (level) => `战场护盾上限+${(level + 1) * 50}%，回复速度+${(level + 1) * 30}%`
  }
};

// 工事研发定义
const FORT_RESEARCH_DEFS = {
  barricade_wood: { name: '木栅栏', icon: '🧱', researchCost: { building: 50, parts: 20 }, description: '阻挡僵尸移动的基础防御工事' },
  barricade_wire: { name: '铁丝网', icon: '🕸', researchCost: { building: 80, parts: 30 }, description: '减速并造成持续伤害的防御工事' },
  mine: { name: '地雷', icon: '💥', researchCost: { building: 60, parts: 40 }, description: '触发后造成范围爆炸的陷阱' },
  turret_mg: { name: '机枪塔', icon: '🔫', researchCost: { building: 150, parts: 80 }, description: '高射速的自动防御塔' },
  turret_electric: { name: '激光塔', icon: '⚡', researchCost: { building: 200, parts: 120 }, description: '低攻速高攻击，50%最大生命值伤害' },
  turret_shotgun: { name: '霰弹塔', icon: '📦', researchCost: { building: 180, parts: 100 }, description: '近距离范围伤害，12×6弹丸，附带击退晕眩' },
  turret_sniper: { name: '狙击塔', icon: '🔭', researchCost: { building: 250, parts: 150 }, description: '超远距离穿透攻击的防御塔' },
  turret_drone: { name: '无人机塔', icon: '🚁', researchCost: { building: 300, parts: 200 }, description: '生产攻击无人机的防御塔' },
  robo_dog: { name: '机器狗', icon: '🐕', researchCost: { building: 200, parts: 150 }, description: '自动拾取战场掉落物的机器狗' }
};

// 初始化避难所数据（支持存档槽）
function initShelter() {
  // 首先尝试迁移旧数据
  migrateOldData();
  
  // 如果已经有当前存档槽，加载对应数据
  if (currentSlot >= 0) {
    loadShelterForSlot(currentSlot);
  } else {
    // 默认加载存档1（如果存在）
    if (localStorage.getItem(SAVE_KEY_PREFIX + '0')) {
      loadShelterForSlot(0);
    }
  }
  
  // 如果没有加载到数据，创建默认数据（临时）
  if (!shelterData) {
    createNewShelter();
    console.log('[Shelter] ⚠️ 未选择存档，创建临时数据');
  }
  
  // 兼容性检查
  ensureDataCompatibility();
  
  // 启动自动保存（保存到当前存档槽）
  setInterval(() => {
    if (currentSlot >= 0) {
      saveShelterForSlot(currentSlot);
    }
  }, 30000);
  
  window.addEventListener('beforeunload', () => {
    if (currentSlot >= 0) {
      saveShelterForSlot(currentSlot);
    }
  });
  
  // 启动资源生产
  setInterval(produceResources, 1000);
}

// 数据兼容性检查
function ensureDataCompatibility() {
  if (!shelterData) return;
  
  // 确保loadout包含4种不同工事
  const allTypes = ['barricade_wood', 'barricade_wire', 'turret_mg', 'mine'];
  const uniqueTypes = [...new Set(shelterData.loadout || [])];
  if (uniqueTypes.length < 4) {
    shelterData.loadout = allTypes;
    if (currentSlot >= 0) saveShelterForSlot(currentSlot);
  }
  
  // 确保有researchedFortifications
  if (!shelterData.researchedFortifications) {
    shelterData.researchedFortifications = ['barricade_wood', 'barricade_wire', 'turret_mg', 'mine'];
    if (currentSlot >= 0) saveShelterForSlot(currentSlot);
  }
  
  // 确保stats包含新字段
  if (!shelterData.stats.totalProduced) {
    shelterData.stats.totalProduced = { building: 0, food: 0, parts: 0 };
    shelterData.stats.totalConsumed = { building: 0, food: 0, parts: 0 };
    shelterData.stats.battleGained = { building: 0, food: 0, parts: 0 };
    shelterData.stats.sessionStart = Date.now();
    shelterData.stats.sessionProduced = { building: 0, food: 0, parts: 0 };
    if (currentSlot >= 0) saveShelterForSlot(currentSlot);
  }
  
  // 确保stats包含highestWave
  if (shelterData.stats.highestWave === undefined) {
    shelterData.stats.highestWave = 0;
    if (currentSlot >= 0) saveShelterForSlot(currentSlot);
  }
  
  // 确保电力充能字段
  if (shelterData.battlefieldCharge === undefined) {
    shelterData.battlefieldCharge = 0;
    shelterData.maxBattlefieldCharge = 100;
    shelterData.powerUsedThisTick = 0;
    if (currentSlot >= 0) saveShelterForSlot(currentSlot);
  }
  
  // 计算离线收益
  calculateOfflineGains();
}

// 创建新避难所
function createNewShelter() {
  shelterData = {
    version: 1,
    lastSave: Date.now(),
    lastOnline: Date.now(),
    resources: {
      building: 0,
      food: 100,
      parts: 50,
      power: 0
    },
    facilities: [
      { type: 'command', level: 1 },
      { type: 'scrapyard', level: 1 }
    ],
    survivors: [],
    technologies: {},
    loadout: [null, null, null, null, null, null, null, null], // 8个槽位，null表示空
    researchedFortifications: ['barricade_wood', 'barricade_wire', 'turret_mg', 'mine'], // 已研发的工事
    stats: {
      totalKills: 0,
      totalWaves: 0,
      highestWave: 0,
      playTime: 0,
      totalProduced: { building: 0, food: 0, parts: 0 },  // 累计产出
      totalConsumed: { building: 0, food: 0, parts: 0 },  // 累计消耗
      battleGained: { building: 0, food: 0, parts: 0 },   // 战场获得
      sessionStart: Date.now(),                             // 本次会话开始时间
      sessionProduced: { building: 0, food: 0, parts: 0 }   // 本次会话产出
    },
    // 电力战场充能系统
    battlefieldCharge: 0,       // 战场充能点（整数）
    maxBattlefieldCharge: 100, // 充能上限
    powerUsedThisTick: 0       // 本Tick电力消耗量（用于UI显示）
  };
  saveShelter();
}

// 安全编码（支持中文）
function encodeData(obj) {
  try {
    return encodeURIComponent(JSON.stringify(obj));
  } catch(e) {
    console.error('[Shelter] Encode error:', e);
    return '';
  }
}

function decodeData(str) {
  try {
    return JSON.parse(decodeURIComponent(str));
  } catch(e) {
    console.error('[Shelter] Decode error:', e);
    return null;
  }
}

// 保存避难所数据
function saveShelter() {
  if (!shelterData) return;
  shelterData.lastSave = Date.now();
  shelterData.lastOnline = Date.now();
  // 保存到当前存档槽（如果已选择）
  if (currentSlot >= 0) {
    saveShelterForSlot(currentSlot);
  } else {
    // 兼容旧逻辑：保存到旧键（作为备份）
    localStorage.setItem('zombieShelter_v1', encodeData(shelterData));
    console.log('[Shelter] ⚠️ 保存到旧键（未选择存档槽）');
  }
}

// 计算离线收益
function calculateOfflineGains() {
  const now = Date.now();
  const offlineTime = (now - shelterData.lastOnline) / 1000; // 秒
  const maxOffline = 8 * 3600; // 8小时
  const effectiveTime = Math.min(offlineTime, maxOffline);
  
  if (effectiveTime <= 0) return;
  
  // 离线效率30%
  const efficiency = 0.3;
  
  // 计算各设施产出
  let gains = { building: 0, food: 0, parts: 0 };
  
  shelterData.facilities.forEach(fac => {
    const def = FACILITY_DEFS[fac.type];
    if (def && def.production) {
      Object.keys(def.production).forEach(res => {
        if (res !== 'power') {
          const rate = def.production[res](fac.level);
          gains[res] += rate * effectiveTime * efficiency;
        }
      });
    }
  });
  
  // 应用幸存者加成
  // 加成 = 类型效率 × 技能等级 × 体力系数 × 士气系数
  const survivorBonus = { building: 0, food: 0, parts: 0 };
  shelterData.survivors.forEach(sur => {
    if (sur.status !== 'working' || !sur.workplace) return; // 只计算工作中的幸存者
    
    const type = SURVIVOR_TYPES[sur.type];
    if (type && type.efficiency) {
      // 体力系数：体力100%=1.0，体力0%=0.2
      const staminaMult = 0.2 + (sur.stamina / 100) * 0.8;
      // 士气系数：士气100%=1.0，士气0%=0.5
      const moraleMult = 0.5 + (sur.morale / 100) * 0.5;
      // 技能系数：每级+10%
      const skillMult = 1 + (sur.skill - 1) * 0.10;
      
      Object.keys(type.efficiency).forEach(res => {
        // 专长匹配工作地点时额外加成50%
        const specialtyMatch = {
          scavenger: 'scrapyard',
          farmer: 'farm',
          engineer: 'workshop',
          chef: 'farm',
          mechanic: 'workshop',
          doctor: 'farm'
        };
        const matchBonus = (specialtyMatch[sur.type] === sur.workplace) ? 1.5 : 1.0;
        
        survivorBonus[res] += (type.efficiency[res] - 1) * staminaMult * moraleMult * skillMult * matchBonus;
      });
    }
  });
  Object.keys(survivorBonus).forEach(res => {
    if (gains[res] && survivorBonus[res] > 0) {
      gains[res] *= (1 + survivorBonus[res]);
    }
  });
  
  // 食物消耗
  const foodConsumption = shelterData.survivors.length * (effectiveTime / 3600);
  gains.food -= foodConsumption;
  
  // 应用收益（受资源上限限制）
  const maxStorage = getMaxStorage();
  Object.keys(gains).forEach(res => {
    if (gains[res] > 0) {
      // 正收益：受上限限制
      const current = shelterData.resources[res] || 0;
      const max = maxStorage[res] || Infinity;
      const potentialGain = Math.floor(gains[res]);
      const actualGain = Math.min(potentialGain, max - current);
      shelterData.resources[res] = current + actualGain;
      
      // 累计统计（只统计实际获得的）
      if (actualGain > 0) {
        shelterData.stats.totalProduced[res] = (shelterData.stats.totalProduced[res] || 0) + actualGain;
        shelterData.stats.sessionProduced[res] = (shelterData.stats.sessionProduced[res] || 0) + actualGain;
      }
      // 如果有溢出，记录日志
      if (potentialGain > actualGain) {
        console.log(`[Shelter] ${res} 资源已达上限 ${max}，溢出 ${potentialGain - actualGain}`);
      }
    } else {
      // 负收益：直接扣除
      const actualLoss = Math.max(-shelterData.resources[res], Math.floor(gains[res]));
      shelterData.resources[res] += actualLoss;
      if (actualLoss < 0) {
        shelterData.stats.totalConsumed[res] = (shelterData.stats.totalConsumed[res] || 0) + Math.abs(actualLoss);
      }
    }
  });
  
  console.log(`[Shelter] Offline gains:`, gains, `Time: ${(effectiveTime/3600).toFixed(2)}h`);
}

// 扣除资源并累计消耗统计
function deductResources(cost) {
  Object.entries(cost).forEach(([res, amount]) => {
    shelterData.resources[res] -= amount;
    shelterData.stats.totalConsumed[res] = (shelterData.stats.totalConsumed[res] || 0) + amount;
  });
}

// 资源生产（每秒）
function produceResources() {
  if (!shelterData) return;
  
  let gains = { building: 0, food: 0, parts: 0 };
  let powerGain = 0; // 电力单独处理
  
  shelterData.facilities.forEach(fac => {
    const def = FACILITY_DEFS[fac.type];
    if (def && def.production) {
      Object.keys(def.production).forEach(res => {
        const prod = def.production[res];
        // 处理函数或常量两种形式
        const value = typeof prod === 'function' ? prod(fac.level) : prod;
        if (res === 'power') {
          // 电力特殊处理：发电站产出
          powerGain += value;
        } else if (gains.hasOwnProperty(res)) {
          gains[res] += value;
        }
      });
    }
  });
  
  // 获取科技加成
  const effects = getTechEffects();
  const powerOutputMult = effects.powerOutputMult || 1;
  const powerConsumptionMult = effects.powerConsumptionMult || 1;
  powerGain *= powerOutputMult;
  
  // 计算电力设施消耗（每个运行的炮塔等消耗电力）
  // 目前按发电站级别运行，无消耗时全部供电正常
  // 未来可在 fortifications.js 中动态更新消耗量
  const powerConsumption = (shelterData.powerUsedThisTick || 0) * powerConsumptionMult;
  const netPower = powerGain - powerConsumption;
  
  // 更新电力
  const maxPower = getMaxStorage().power;
  const actualPowerGain = Math.min(Math.max(netPower, -shelterData.resources.power), maxPower - shelterData.resources.power);
  shelterData.resources.power = Math.max(0, Math.min(maxPower, shelterData.resources.power + actualPowerGain));
  
  // 电力不足时：减少充能点增长（如果有战场充能）
  // 电力充足时：充能点正常增长（由战场侧调用 addBattlefieldCharge）
  // 此处只管理基础资源和电力
  
  // 应用幸存者加成（加法叠加，而非乘法叠加）
  // 例如：2个拾荒者(+30%) => 1 + 0.3 + 0.3 = 1.6x，而非 1.3 * 1.3 = 1.69x
  const survivorBonus = { building: 0, food: 0, parts: 0 };
  shelterData.survivors.forEach(sur => {
    const type = SURVIVOR_TYPES[sur.type];
    if (type && type.efficiency) {
      Object.keys(type.efficiency).forEach(res => {
        survivorBonus[res] += (type.efficiency[res] - 1);
      });
    }
  });
  Object.keys(survivorBonus).forEach(res => {
    if (gains[res] && survivorBonus[res] > 0) {
      gains[res] *= (1 + survivorBonus[res]);
    }
  });
  
  // 食物消耗（每小时1点）
  const foodConsumption = shelterData.survivors.length / 3600;
  gains.food -= foodConsumption;
  
  // 应用收益（受资源上限限制）
  const maxStorage = getMaxStorage();
  Object.keys(gains).forEach(res => {
    if (gains[res] > 0) {
      // 正收益：受上限限制
      const current = shelterData.resources[res] || 0;
      const max = maxStorage[res] || Infinity;
      const potentialGain = gains[res];
      const actualGain = Math.min(potentialGain, max - current);
      shelterData.resources[res] = current + actualGain;
      
      // 累计统计（每秒产出）
      if (actualGain > 0) {
        shelterData.stats.totalProduced[res] = (shelterData.stats.totalProduced[res] || 0) + actualGain;
        shelterData.stats.sessionProduced[res] = (shelterData.stats.sessionProduced[res] || 0) + actualGain;
      }
    } else {
      // 负收益：直接扣除
      const actualLoss = Math.max(-shelterData.resources[res], gains[res]);
      shelterData.resources[res] += actualLoss;
      if (actualLoss < 0) {
        shelterData.stats.totalConsumed[res] = (shelterData.stats.totalConsumed[res] || 0) + Math.abs(actualLoss);
      }
    }
  });
  
  // 更新幸存者属性（每秒调用一次）
  updateSurvivorStats();
}

// 更新幸存者属性
function updateSurvivorStats() {
  if (!shelterData) return;
  
  shelterData.survivors.forEach(sur => {
    // 兼容旧数据
    if (sur.exp === undefined) sur.exp = 0;
    if (sur.workplace === undefined) sur.workplace = null;
    if (sur.previousWorkplace === undefined) sur.previousWorkplace = null;
    if (sur.totalWorkTime === undefined) sur.totalWorkTime = 0;
    
    if (sur.status === 'working' && sur.workplace) {
      // 工作中：消耗体力，获得经验
      sur.stamina = Math.max(0, sur.stamina - 0.5); // 每秒消耗0.5%体力
      sur.totalWorkTime += 1;
      
      // 技能经验：基础+专长加成
      const type = SURVIVOR_TYPES[sur.type];
      let expGain = 0.1; // 基础经验/秒
      
      // 专长匹配工作地点时经验加倍
      const specialtyMatch = {
        scavenger: 'scrapyard',
        farmer: 'farm',
        engineer: 'workshop',
        chef: 'farm',
        mechanic: 'workshop',
        doctor: 'farm'
      };
      if (type && specialtyMatch[sur.type] === sur.workplace) {
        expGain *= 2; // 专长匹配，经验翻倍
      }
      
      // 士气影响经验
      expGain *= (0.5 + sur.morale / 100 * 0.5); // 士气0%=50%效率，100%=100%效率
      
      sur.exp += expGain;
      
      // 升级检查（每级需要 skill * 100 经验）
      const expNeeded = sur.skill * 100;
      if (sur.exp >= expNeeded) {
        sur.exp -= expNeeded;
        sur.skill += 1;
      }
      
      // 体力耗尽，自动休息（记住原工作岗位）
      if (sur.stamina <= 0) {
        sur.previousWorkplace = sur.workplace;
        sur.workplace = null;
        sur.status = 'resting';
      }
    } else if (sur.status === 'resting') {
      // 休息中：恢复体力和士气
      sur.stamina = Math.min(100, sur.stamina + 2); // 每秒恢复2%体力
      sur.morale = Math.min(100, sur.morale + 0.5);  // 每秒恢复0.5%士气
      
      // 体力恢复满后自动回到原工作岗位
      if (sur.stamina >= 100 && sur.previousWorkplace) {
        sur.workplace = sur.previousWorkplace;
        sur.previousWorkplace = null;
        sur.status = 'working';
      } else if (sur.stamina >= 100 && !sur.previousWorkplace) {
        // 没有原工作岗位，转为空闲
        sur.status = 'idle';
      }
    } else if (sur.status === 'idle') {
      // 空闲：缓慢恢复体力和士气
      sur.stamina = Math.min(100, sur.stamina + 1);   // 每秒恢复1%体力
      sur.morale = Math.min(100, sur.morale + 0.3);   // 每秒恢复0.3%士气
    }
    
    // 食物不足时士气下降
    if (shelterData.resources.food <= 0) {
      sur.morale = Math.max(0, sur.morale - 0.2);
    }
  });
}

// 获取资源上限
function getMaxStorage() {
  if (!shelterData || !shelterData.facilities) {
    return { building: 500, food: 500, parts: 500, power: 0 };
  }
  const warehouse = shelterData.facilities.find(f => f.type === 'warehouse');
  const bonus = warehouse ? warehouse.level * 500 : 0;
  return {
    building: 500 + bonus,
    food: 500 + bonus,
    parts: 500 + bonus,
    power: 50 * (shelterData.facilities.find(f => f.type === 'powerplant')?.level || 0)
  };
}

// 获取指挥中心等级
function getCommandLevel() {
  if (!shelterData || !shelterData.facilities) return 1;
  const cmd = shelterData.facilities.find(f => f.type === 'command');
  return cmd ? cmd.level : 1;
}

// 获取幸存者容量上限
function getMaxSurvivors() {
  if (!shelterData || !shelterData.facilities) return 0;
  const dorm = shelterData.facilities.find(f => f.type === 'dormitory');
  return dorm ? dorm.level * 2 : 0;
}

// 检查设施是否解锁
function isFacilityUnlocked(facType) {
  const def = FACILITY_DEFS[facType];
  if (!def.unlockAt) return true;
  
  const cmdLevel = getCommandLevel();
  return cmdLevel >= (def.unlockAt.command || 0);
}

// 获取建造成本
function getBuildCost(facType, level = 1) {
  const def = FACILITY_DEFS[facType];
  
  // 支持两种成本结构：buildCost/upgradeCost 或 baseCost/costMultiplier
  if (def.buildCost && level === 1) {
    return { ...def.buildCost };
  }
  if (def.upgradeCost && level > 1) {
    return def.upgradeCost(level - 1);
  }
  
  // 标准结构
  const cost = {};
  Object.keys(def.baseCost).forEach(res => {
    cost[res] = Math.floor(def.baseCost[res] * def.costMultiplier * level);
  });
  return cost;
}

// 建造设施
function buildFacility(facType) {
  const def = FACILITY_DEFS[facType];
  const cost = getBuildCost(facType);
  
  // 检查是否已存在
  if (shelterData.facilities.find(f => f.type === facType)) {
    return { success: false, message: '设施已存在' };
  }
  
  // 检查资源
  for (let res in cost) {
    if (shelterData.resources[res] < cost[res]) {
      return { success: false, message: `资源不足：需要${getResNameCN(res)}${cost[res]}，当前${Math.floor(shelterData.resources[res])}` };
    }
  }

  // 扣除资源
  deductResources(cost);
  
  // 添加设施
  shelterData.facilities.push({ type: facType, level: 1 });
  saveShelter();
  
  return { success: true, message: '建造成功' };
}

// 升级设施
function upgradeFacility(facType) {
  const fac = shelterData.facilities.find(f => f.type === facType);
  if (!fac) return { success: false, message: '设施不存在' };
  
  const def = FACILITY_DEFS[facType];
  if (fac.level >= def.maxLevel) {
    return { success: false, message: '已达最高等级' };
  }
  
  // 检查指挥中心等级限制
  const cmdLevel = getCommandLevel();
  if (fac.level >= cmdLevel && facType !== 'command') {
    return { success: false, message: '需要升级指挥中心' };
  }
  
  const cost = getBuildCost(facType, fac.level + 1);
  
  // 检查资源
  for (let res in cost) {
    if (shelterData.resources[res] < cost[res]) {
      return { success: false, message: `资源不足：需要${getResNameCN(res)}${cost[res]}，当前${Math.floor(shelterData.resources[res])}` };
    }
  }
  
  // 扣除资源
  deductResources(cost);
  
  // 执行升级
  fac.level += 1;
  saveShelter();
  
  return { success: true, message: '升级成功' };
}

// 招募幸存者
function recruitSurvivor(type) {
  const def = SURVIVOR_TYPES[type];
  
  // 检查宿舍容量
  const dorm = shelterData.facilities.find(f => f.type === 'dormitory');
  if (!dorm) {
    return { success: false, message: '需要先建造宿舍才能招募幸存者' };
  }
  const maxSurvivors = dorm.level * 2;
  if (shelterData.survivors.length >= maxSurvivors) {
    return { success: false, message: '宿舍已满，请升级宿舍' };
  }
  
  // 检查资源
  for (let res in def.recruitCost) {
    if (shelterData.resources[res] < def.recruitCost[res]) {
      return { success: false, message: `资源不足：需要${getResNameCN(res)}${def.recruitCost[res]}，当前${Math.floor(shelterData.resources[res])}` };
    }
  }
  
  // 扣除资源
  deductResources(def.recruitCost);
  
  // 添加幸存者
  const newName = generateSurvivorName();
  shelterData.survivors.push({
    type: type,
    name: newName,
    stamina: 100,
    morale: 80,
    skill: 1,
    exp: 0,           // 技能经验值
    status: 'idle',    // idle, working, resting
    workplace: null,  // 当前工作地点
    previousWorkplace: null, // 休息前的工作地点（用于自动恢复）
    totalWorkTime: 0  // 累计工作秒数
  });
  
  saveShelter();
  return { success: true, message: `${def.name}「${newName}」招募成功！` };
}

// 生成幸存者名字
function generateSurvivorName() {
  const surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
  const names = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明'];
  return surnames[Math.floor(Math.random() * surnames.length)] + 
         names[Math.floor(Math.random() * names.length)];
}

// 研究科技
function researchTech(techId) {
  const def = TECHNOLOGY_DEFS[techId];
  const currentLevel = shelterData.technologies[techId] || 0;
  
  if (currentLevel >= def.maxLevel) {
    return { success: false, message: '已达最高等级' };
  }
  
  const cost = def.cost(currentLevel);
  
  // 检查资源
  for (let res in cost) {
    if (shelterData.resources[res] < cost[res]) {
      return { success: false, message: `资源不足：需要${getResNameCN(res)}${cost[res]}，当前${Math.floor(shelterData.resources[res])}` };
    }
  }
  
  // 扣除资源
  deductResources(cost);
  
  // 升级科技
  shelterData.technologies[techId] = currentLevel + 1;
  saveShelter();
  
  return { success: true, message: '研究成功' };
}

// 获取科技效果
function getTechEffects() {
  const techs = shelterData.technologies;
  return {
    damageMult: 1 + (techs.weapon_upgrade || 0) * 0.05,
    maxHealthBonus: (techs.health_upgrade || 0) * 20,
    fortHealthMult: 1 + (techs.fortification_upgrade || 0) * 0.25,
    turretSpeedMult: 1 + (techs.turret_speed || 0) * 0.10,
    droneBlastBonus: (techs.drone_blast || 0) * 1.0, // 每级+1米
    electricDamageMult: 1 + (techs.electric_damage || 0) * 0.20,
    shotgunPelletBonus: [0, 2, 5, 9][techs.ammo_efficiency || 0],
    scavengerBoost: (techs.scavenger_boost || 0) * 0.15,
    // 电力科技加成
    powerOutputMult: 1 + (techs.power_efficiency || 0) * 0.25,
    powerConsumptionMult: 1 - (techs.energy_saving || 0) * 0.15,
    shieldCapacityMult: 1 + (techs.shield_boost || 0) * 0.50,
    shieldRegenMult: 1 + (techs.shield_boost || 0) * 0.30
  };
}

// 添加战场资源（受资源上限限制）
function addBattleResources(resources) {
  if (!shelterData) return { overflow: false, _noData: true };
  
  const maxStorage = getMaxStorage();
  let hasOverflow = false;
  
  // 合并 debugResourceBonus 临时加成（building/food/parts）
  if (typeof debugResourceBonus !== 'undefined') {
    if (debugResourceBonus.building > 0) resources.building = (resources.building || 0) + debugResourceBonus.building;
    if (debugResourceBonus.food > 0) resources.food = (resources.food || 0) + debugResourceBonus.food;
    if (debugResourceBonus.parts > 0) resources.parts = (resources.parts || 0) + debugResourceBonus.parts;
  }
  
  Object.keys(resources).forEach(res => {
    if (resources[res] > 0) {
      // 正收益：受上限限制
      const current = shelterData.resources[res] || 0;
      const max = maxStorage[res] || Infinity;
      const potentialGain = resources[res];
      const actualGain = Math.min(potentialGain, max - current);
      shelterData.resources[res] = current + actualGain;
      
      if (potentialGain > actualGain) hasOverflow = true;
      
      // 累计战场获得（只统计实际获得的）
      if (actualGain > 0) {
        shelterData.stats.battleGained[res] = (shelterData.stats.battleGained[res] || 0) + actualGain;
        shelterData.stats.totalProduced[res] = (shelterData.stats.totalProduced[res] || 0) + actualGain;
      }
    } else {
      // 负收益：直接扣除
      const actualLoss = Math.max(-shelterData.resources[res], resources[res]);
      shelterData.resources[res] += actualLoss;
    }
  });
  
  // 传入 building 资源时，累加击杀数（building 资源量 = 击杀数）
  if (resources.building && resources.building > 0) {
    shelterData.stats.totalKills += resources.building;
  }
  
  saveShelter();
  return { overflow: hasOverflow };
}

// 更新最高波次
function updateWave(wave) {
  if (!shelterData) return;
  if (wave > (shelterData.stats.highestWave || 0)) {
    shelterData.stats.highestWave = wave;
    saveShelter();
  }
}

// 更新战斗统计（游戏结束/返回避难所时调用）
function updateBattleStats(waves, playTime) {
  if (!shelterData) return;
  
  if (typeof waves === 'number' && waves > 0) {
    shelterData.stats.totalWaves += waves;
  }
  if (typeof playTime === 'number' && playTime > 0) {
    shelterData.stats.playTime += playTime;
  }
  
  saveShelter();
}

// ========== 战场充能系统 ==========

// 获取战场充能状态（供game.js使用）
function getBattlefieldCharge() {
  if (!shelterData) return { current: 0, max: 100 };
  return {
    current: Math.floor(shelterData.battlefieldCharge || 0),
    max: shelterData.maxBattlefieldCharge || 100
  };
}

// 添加战场充能（战场侧每波或击杀时调用）
// 返回实际增加的充能点
function addBattlefieldCharge(amount) {
  if (!shelterData) return 0;
  const maxCharge = shelterData.maxBattlefieldCharge || 100;
  const prev = Math.floor(shelterData.battlefieldCharge);
  shelterData.battlefieldCharge = Math.min(maxCharge, (shelterData.battlefieldCharge || 0) + amount);
  const actual = Math.floor(shelterData.battlefieldCharge) - prev;
  return actual;
}

// 消耗战场充能点（用于护盾充能/EMP/工事修复）
// 返回是否成功
function useBattlefieldCharge(amount) {
  if (!shelterData) return false;
  if ((shelterData.battlefieldCharge || 0) < amount) return false;
  shelterData.battlefieldCharge -= amount;
  saveShelter();
  return true;
}

// 获取护盾充能消耗
function getShieldChargeCost() {
  // 固定消耗30充能点
  return 30;
}

// 获取EMP消耗
function getEMPCost() {
  // 固定消耗50充能点
  return 50;
}

// 获取工事修复消耗
function getFortRepairCost() {
  // 固定消耗20充能点
  return 20;
}

// 获取充能倍率（电工加成）
function getChargeSpeedMult() {
  const effects = getTechEffects();
  let mult = 1;
  if (shelterData && shelterData.survivors) {
    shelterData.survivors.forEach(sur => {
      const def = SURVIVOR_TYPES[sur.type];
      if (def && def.battlefieldEffect && def.battlefieldEffect.chargeSpeedBonus) {
        const skillMult = 1 + (sur.skill - 1) * 0.10;
        mult += def.battlefieldEffect.chargeSpeedBonus * skillMult;
      }
    });
  }
  return Math.min(mult, 2.0); // 最多2倍
}

// 获取电力信息（供电状态）
function getPowerStatus() {
  if (!shelterData) return { current: 0, max: 0, consumption: 0, surplus: 0 };
  const maxPower = getMaxStorage().power;
  const consumption = shelterData.powerUsedThisTick || 0;
  return {
    current: Math.floor(shelterData.resources.power),
    max: maxPower,
    consumption: Math.floor(consumption),
    surplus: Math.floor(shelterData.resources.power - consumption)
  };
}

// 更新工事电力消耗
function updatePowerConsumption(amount) {
  if (!shelterData) return;
  shelterData.powerUsedThisTick = Math.max(0, amount);
}

// 研发工事
function researchFortification(fortType) {
  if (!shelterData) return { success: false, message: '数据未初始化' };
  if (!FORT_RESEARCH_DEFS[fortType]) return { success: false, message: '工事类型不存在' };
  if (shelterData.researchedFortifications.includes(fortType)) {
    return { success: false, message: '该工事已研发' };
  }

  const cost = FORT_RESEARCH_DEFS[fortType].researchCost;
  // 检查资源是否足够
  for (const [res, amount] of Object.entries(cost)) {
    if (shelterData.resources[res] < amount) {
      return { success: false, message: `资源不足：需要${getResNameCN(res)}${amount}，当前${Math.floor(shelterData.resources[res])}` };
    }
  }

  // 扣除资源
  deductResources(cost);

  // 添加到已研发列表
  shelterData.researchedFortifications.push(fortType);
  saveShelter();
  return { success: true, message: `${FORT_RESEARCH_DEFS[fortType].name}研发成功！` };
}

// 检查工事是否已研发
function isFortificationResearched(fortType) {
  if (!shelterData) return false;
  return shelterData.researchedFortifications.includes(fortType);
}

// 获取已研发的工事列表
function getResearchedFortifications() {
  if (!shelterData) return [];
  return shelterData.researchedFortifications;
}

// 获取工事研发定义
function getFortResearchDefs() {
  return FORT_RESEARCH_DEFS;
}

// 资源名称中文映射
function getResNameCN(key) {
  const names = { building: '建材', food: '食物', parts: '零件', power: '电力' };
  return names[key] || key;
}

// 设置携带的工事
function setLoadout(loadout) {
  if (loadout.length > 8) {
    return { success: false, message: '最多携带8个工事' };
  }
  shelterData.loadout = loadout;
  saveShelter();
  return { success: true };
}

// 获取携带的工事
// 注意: shelter-ui.js 中的 LOCAL_FORT_DEFS 可能与实际工事定义不同步，
// 如果工事类型发生变化，需要同步更新 shelter-ui.js 中的 LOCAL_FORT_DEFS。
function getLoadout() {
  // 过滤掉 null，只返回已配置的工事
  return shelterData ? shelterData.loadout.filter(item => item !== null) : [];
}

// 导出函数
window.ShelterSystem = {
  init: initShelter,
  getData: () => shelterData,
  getDefs: () => ({ facilities: FACILITY_DEFS, survivors: SURVIVOR_TYPES, techs: TECHNOLOGY_DEFS }),
  getMaxStorage,
  getCommandLevel,
  getMaxSurvivors,
  isFacilityUnlocked,
  getBuildCost,
  buildFacility,
  upgradeFacility,
  recruitSurvivor,
  researchTech,
  getTechEffects,
  addBattleResources,
  updateBattleStats,
  updateWave,
  researchFortification,
  isFortificationResearched,
  getResearchedFortifications,
  getFortResearchDefs,
  setLoadout,
  getLoadout,
  save: saveShelter,
  // 电力系统
  getBattlefieldCharge,
  addBattlefieldCharge,
  useBattlefieldCharge,
  getShieldChargeCost,
  getEMPCost,
  getFortRepairCost,
  getChargeSpeedMult,
  getPowerStatus,
  updatePowerConsumption,
  // 存档系统（新增）
  getSaveList,
  getCurrentSlot: () => currentSlot,
  setCurrentSlot: (slot) => { currentSlot = slot; },
  loadShelterForSlot,
  saveShelterForSlot,
  createNewShelterForSlot,
  migrateOldData,
  getShelterLevel,
  getResourceRating,
  // 测试预设快捷函数
  applyTestPreset: function() {
    if (!shelterData) return false;
    shelterData.resources.building = 5000;
    shelterData.resources.food = 5000;
    shelterData.resources.parts = 5000;
    saveShelter();
    console.log('[测试脚本] ✅ 已应用：建材=5000, 食物=5000, 零件=5000');
    return true;
  },
  // 调试：手动触发一次资源生产
  debugProduce: function() {
    if (!shelterData) return null;
    const before = { ...shelterData.resources };
    produceResources();
    const after = { ...shelterData.resources };
    return { before, after, diff: {
      building: after.building - before.building,
      food: after.food - before.food,
      parts: after.parts - before.parts
    }};
  },
  // 清理缓存并重新初始化数据
  resetData: function() {
    // 清除所有存档缓存
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      localStorage.removeItem(SAVE_KEY_PREFIX + i);
    }
    localStorage.removeItem('zombieShelter_v1');
    console.log('[Shelter] ✅ 所有存档缓存已清理');
    // 重新初始化数据
    createNewShelter();
    currentSlot = -1;
    console.log('[Shelter] ✅ 数据已重置为初始值');
    return {
      resources: { ...shelterData.resources },
      message: '缓存已清理，数据已重置。请刷新页面重新加载。'
    };
  },
  // 仅清理缓存（下次加载时自动创建新数据）
  clearCache: function() {
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      localStorage.removeItem(SAVE_KEY_PREFIX + i);
    }
    localStorage.removeItem('zombieShelter_v1');
    console.log('[Shelter] ✅ 缓存已清理，刷新页面后将创建新数据');
    return { message: '缓存已清理，刷新页面后将创建新数据' };
  },
  // 删除指定存档
  deleteSaveSlot: function(slot) {
    if (slot < 0 || slot >= MAX_SAVE_SLOTS) return false;
    localStorage.removeItem(SAVE_KEY_PREFIX + slot);
    console.log(`[Shelter] ✅ 存档${slot + 1}已删除`);
    return true;
  }
};
