/**
 * 末日幸存者 - 游戏配置中心
 * 最后更新：2026-05-26
 *
 * 这是游戏唯一的配置源文件，所有模块都从此文件读取配置
 */

// ==================== 游戏核心配置 ====================
const CONFIG = {
  MAP_SIZE: 200,
  PLAYER_SPEED: 8,
  SPRINT_MULT: 1.6,
  JUMP_FORCE: 10,
  GRAVITY: 25,
  MOUSE_SENS: 0.002,
  ENEMY_SPAWN_DIST: 40,
  MAX_ENEMIES: 60,
  ALLY_MAX: 8,
  PICKUP_DIST: 3,
  GRENADE_DAMAGE: 50,
  GRENADE_RADIUS: 15,
  GRENADE_FUSE_TIME: 2.0,
  GRENADE_THROW_SPEED: 25,

  // 分区分片动态加载配置
  CHUNK_SIZE: 40,
  CHUNK_VIEW_DISTANCE: 3,
  CHUNK_UNLOAD_DISTANCE: 5,
  CHUNK_UPDATE_INTERVAL: 0.5,

  // ========== 空投救援事件配置 ==========
  AIRDROP: {
    ENABLED: true,
    SPAWN_INTERVAL: 30,
    APPROACH_RADIUS: 5,
    DESCENT_SPEED: 15,
    DESCENT_START_HEIGHT: 60,
    OPEN_TIME: 1,
    LOOT_COUNT: 8,
    HORDE_COUNT: 20,
    HORDE_DELAY: 0.5,
    HORDE_RADIUS: 30,
    SIGNAL_LIFETIME: 45,
    CRATE_LIFETIME: 60,
    LOOT_TABLE: [
      { type: 'health', weight: 20, value: 50 },
      { type: 'ammo', weight: 25, value: 60 },
      { type: 'grenade', weight: 12, value: 3 },
      { type: 'building', weight: 10, value: 15 },
      { type: 'parts', weight: 10, value: 10 },
      { type: 'speed_boost', weight: 8, value: 10 },
      { type: 'damage_boost', weight: 8, value: 10 },
      { type: 'invincible', weight: 4, value: 5 },
      { type: 'instakill', weight: 3, value: 10 },
    ],
  },

  // ========== 掉落物配置 ==========
  LOOT: {
    ZOMBIE_DROP: {
      CHANCE: 0.25,
      LIFETIME: 30,
      PICKUP_DIST: 3,
      TYPES: [
        { type: 'ammo', weight: 4, color: 0xffaa00, size: 0.4, name: '弹药包', effect: 'ammo' },
        { type: 'health', weight: 1, color: 0x44ff44, size: 0.4, name: '血包', effect: 'health', value: 30 },
        { type: 'building', weight: 1, color: 0x8B6914, size: 0.45, name: '建材包', effect: 'building', min: 5, max: 14 },
        { type: 'parts', weight: 2, color: 0x6699CC, size: 0.35, name: '零件包', effect: 'parts', min: 3, max: 8 },
      ],
    },
    AIRDROP: {
      LIFETIME: 45,
      PICKUP_DIST: 3,
      ITEMS: {
        health: { color: 0x44ff44, size: 0.4, name: '血包', effect: 'health', value: 50 },
        ammo: { color: 0xffaa00, size: 0.4, name: '弹药', effect: 'ammo', value: 60 },
        grenade: { color: 0xff4400, size: 0.35, name: '手雷', effect: 'grenade', value: 3 },
        building: { color: 0x8B6914, size: 0.45, name: '建材包', effect: 'building', value: 15 },
        parts: { color: 0x6699CC, size: 0.35, name: '零件包', effect: 'parts', value: 10 },
        speed_boost: { color: 0x00ffff, size: 0.5, name: '加速', effect: 'speed_boost', duration: 10 },
        damage_boost: { color: 0xff00ff, size: 0.5, name: '伤害', effect: 'damage_boost', duration: 10 },
        invincible: { color: 0xffff00, size: 0.5, name: '无敌', effect: 'invincible', duration: 5 },
        instakill: { color: 0xffffff, size: 0.5, name: '必杀', effect: 'instakill', duration: 10 },
      },
    },
  },
};

// ==================== 武器定义 ====================
const WEAPON_DEFS = [
  { name: '手枪', damage: 25, fireRate: 0.35, magSize: 12, reloadTime: 1.2, spread: 0.015, bulletSpeed: 80, auto: false, color: 0xcccccc, sound: 'pistol' },
  { name: '冲锋枪', damage: 18, fireRate: 0.08, magSize: 30, reloadTime: 1.8, spread: 0.05, bulletSpeed: 70, auto: true, color: 0x888888, sound: 'smg' },
  { name: '霰弹枪', damage: 15, fireRate: 0.8, magSize: 6, reloadTime: 2.2, spread: 0.1, bulletSpeed: 60, auto: false, pellets: 8, color: 0x886644, sound: 'shotgun' },
  { name: '狙击枪', damage: 200, fireRate: 1.3, magSize: 5, reloadTime: 2.5, spread: 0.002, bulletSpeed: 200, auto: false, color: 0x446688, sound: 'sniper', pierce: true, pierceCount: 3 },
  { name: '手雷', damage: 0, fireRate: 1.0, magSize: 5, reloadTime: 2.0, spread: 0, bulletSpeed: 0, auto: false, color: 0x336633, sound: 'grenade_throw', isGrenade: true },
];

// ==================== 敌人定义（11种） ====================
const ZOMBIE_DEFS = [
  { name: '普通僵尸', hp: 50, speed: 2.2, damage: 10, color: 0x557755, size: 1, xp: 10, attackRange: 2, attackRate: 1.2, desc: '普通行尸走肉' },
  { name: '快速僵尸', hp: 35, speed: 4.5, damage: 8, color: 0x99cc44, size: 0.85, xp: 15, attackRange: 2, attackRate: 0.5, desc: '四肢着地奔跑', crawl: true },
  { name: '胖子僵尸', hp: 200, speed: 1.0, damage: 25, color: 0x4a5a3a, size: 1.7, xp: 35, attackRange: 2.5, attackRate: 1.8, desc: '体型庞大血厚', fat: true },
  { name: '远程僵尸', hp: 40, speed: 1.8, damage: 15, color: 0x774444, size: 1, xp: 20, attackRange: 25, attackRate: 2.2, ranged: true, desc: '投掷腐肉攻击' },
  { name: '爆炸僵尸', hp: 60, speed: 3.0, damage: 50, color: 0xaa5522, size: 1.15, xp: 25, attackRange: 2.5, attackRate: 999, explosive: true, desc: '死亡时爆炸', glow: 0xff4400 },
  { name: '精英僵尸', hp: 400, speed: 2.5, damage: 30, color: 0x992222, size: 1.9, xp: 80, attackRange: 2.5, attackRate: 0.7, desc: 'BOSS级敌人', elite: true },
  { name: '毒液僵尸', hp: 70, speed: 2.2, damage: 8, color: 0x55aa55, size: 1.05, xp: 22, attackRange: 18, attackRate: 2.5, ranged: true, poison: true, desc: '喷射毒液', glow: 0x44ff44 },
  { name: '隐身僵尸', hp: 45, speed: 3.5, damage: 18, color: 0x2a3a2a, size: 0.95, xp: 30, attackRange: 2, attackRate: 0.7, stealth: true, desc: '接近时显形' },
  { name: '暴君', hp: 2000, speed: 2.0, damage: 80, color: 0x8B0000, size: 3.0, xp: 300, attackRange: 4, attackRate: 1.2, desc: '巨型BOSS，蓄力冲击攻击', tyrant: true, glow: 0xff2200 },
  { name: '舔食者', hp: 600, speed: 7.0, damage: 50, color: 0x665544, size: 1.3, xp: 150, attackRange: 3.5, attackRate: 0.3, desc: '四足爬行，跳跃攻击', licker: true },
  { name: '飞龙', hp: 250, speed: 8.0, damage: 35, color: 0x6644AA, size: 1.5, xp: 100, attackRange: 20, attackRangeMelee: 2, attackRate: 0.8, desc: '飞行俯冲撕咬', wyvern: true, ranged: true, flying: true },
  // ===== 雪山专属僵尸（v3.0 感染变异体） =====
  // 设定：病毒在极寒环境下与宿主DNA融合，产生人类+极地动物的混合变异
  // -- 基础型 --
  { name: '冻尸行者', hp: 60, speed: 2.2, damage: 12, color: 0x88aabb, size: 1, xp: 15, attackRange: 2, attackRate: 1.2, desc: '被冻僵的感染者，皮肤覆盖冰晶，关节僵硬', snow: true, skill: '无' },
  { name: '霜狼丧尸', hp: 45, speed: 5.5, damage: 10, color: 0x99bbcc, size: 0.75, xp: 20, attackRange: 2, attackRate: 0.4, desc: '人类感染者与狼DNA融合，四足奔跑，利齿撕咬', crawl: true, snow: true, skill: '狼群本能：3米内有同类时速度+30%' },
  { name: '冰甲巨尸', hp: 300, speed: 0.8, damage: 35, color: 0x557788, size: 2.0, xp: 50, attackRange: 2.5, attackRate: 2.0, desc: '感染者与熊DNA融合，体型巨大，皮肤结冰成甲', fat: true, snow: true, skill: '冰甲：正面受到的伤害减少30%' },
  // -- 特殊型 --
  { name: '冰喙秃鹫', hp: 55, speed: 1.8, damage: 15, color: 0x66aacc, size: 1.1, xp: 30, attackRange: 20, attackRate: 2.0, ranged: true, desc: '感染者与秃鹫融合，翅膀退化但喙部硬化可喷射冰片', snow: true, skill: '冰片喷射：远程喷射硬化冰片，命中减速30%持续2秒' },
  { name: '冰爆腐尸', hp: 65, speed: 3.2, damage: 50, color: 0x44aacc, size: 1.1, xp: 35, attackRange: 2.5, attackRate: 999, explosive: true, desc: '体内病毒在低温下结晶膨胀，死亡时爆裂释放冰晶碎片', glow: 0x88ccff, snow: true, skill: '冰爆：死亡时爆炸，5米内敌人冻结3秒' },
  { name: '雪豹潜行者', hp: 40, speed: 4.0, damage: 20, color: 0x778899, size: 0.9, xp: 25, attackRange: 2, attackRate: 0.6, desc: '感染者与雪豹融合，皮毛白灰相间，擅长伏击', stealth: true, snow: true, skill: '雪地伪装：距离玩家15米外半透明，接近时显形' },
  // -- BOSS型 --
  { name: '极地暴君', hp: 600, speed: 2.2, damage: 40, color: 0x336699, size: 2.2, xp: 120, attackRange: 3, attackRate: 0.8, desc: '感染者与北极熊王融合，体型巨大，双爪可撕裂地面冰层', elite: true, snow: true, skill: '冰爪撕裂：每5秒撕裂地面冰层，3米范围伤害50' },
  { name: '雪崩巨兽', hp: 1500, speed: 1.5, damage: 60, color: 0x224466, size: 2.8, xp: 300, attackRange: 4, attackRate: 1.5, desc: '大量感染者与驯鹿群融合堆积而成的巨型聚合体', tyrant: true, snow: true, skill: '践踏：蓄力1.5秒后践踏地面，10米内敌人眩晕2秒' },
  // ===== 灼热荒漠专属僵尸（v3.0 感染变异体） =====
  // 设定：病毒在高温干燥环境下与宿主DNA融合，产生人类+沙漠动物的混合变异
  // -- 基础型 --
  { name: '干尸行者', hp: 70, speed: 2.0, damage: 14, color: 0xC4A96B, size: 1, xp: 18, attackRange: 2, attackRate: 1.2, desc: '被热风烤干的感染者，皮肤龟裂如皮革，脱水但耐打', desert: true, skill: '无' },
  { name: '毒蝎丧尸', hp: 50, speed: 5.0, damage: 12, color: 0xD4A843, size: 0.7, xp: 22, attackRange: 2, attackRate: 0.5, desc: '感染者与蝎子融合，尾部变异为毒刺，四足爬行', crawl: true, desert: true, skill: '毒刺：尾部毒刺攻击，附加中毒（每秒5伤害，持续3秒）' },
  { name: '甲虫巨尸', hp: 350, speed: 0.9, damage: 40, color: 0x8B7355, size: 2.2, xp: 55, attackRange: 2.5, attackRate: 2.0, desc: '感染者与甲虫融合，背部硬化成甲壳，正面几乎无敌', fat: true, desert: true, skill: '甲壳护甲：正面受到的伤害减少25%' },
  // -- 特殊型 --
  { name: '秃鹫腐尸', hp: 60, speed: 1.6, damage: 18, color: 0xB8956B, size: 1.1, xp: 32, attackRange: 22, attackRate: 2.0, ranged: true, desc: '感染者与秃鹫融合，翅膀退化但可喷射腐蚀性胃液', desert: true, skill: '腐蚀喷吐：远程喷射胃液，命中致盲1.5秒' },
  { name: '自爆火甲虫', hp: 75, speed: 3.5, damage: 55, color: 0xA67C52, size: 1.15, xp: 38, attackRange: 2.5, attackRate: 999, explosive: true, desc: '感染者与火甲虫融合，体内充满易燃气体，高温自燃', glow: 0xFFAA00, desert: true, skill: '烈焰爆炸：死亡时爆炸并点燃5米内敌人' },
  { name: '沙蛇潜行者', hp: 45, speed: 4.2, damage: 22, color: 0xC9B896, size: 0.9, xp: 28, attackRange: 2, attackRate: 0.5, desc: '感染者与响尾蛇融合，可在沙中潜行，鳞片摩擦发出沙沙声', stealth: true, desert: true, skill: '沙潜：静止时隐身于沙中，移动时沙尘遮蔽视线' },
  // -- BOSS型 --
  { name: '荒漠暴君', hp: 700, speed: 2.0, damage: 45, color: 0x7A5C3C, size: 2.3, xp: 140, attackRange: 3, attackRate: 0.8, desc: '感染者与沙漠狼王融合，统领狼群，可召唤沙柱', elite: true, desert: true, skill: '沙柱召唤：每5秒在玩家脚下召唤沙柱（范围3米，伤害55）' },
  { name: '沙虫巨兽', hp: 2000, speed: 1.8, damage: 70, color: 0x5C4033, size: 3.0, xp: 400, attackRange: 5, attackRate: 1.8, desc: '感染者与巨型沙虫融合，可钻入沙地，破土吞噬一切', tyrant: true, desert: true, skill: '破土吞噬：钻入地下3秒后破土，15米内敌人被吞噬（秒杀）' },
];

// ==================== 电力系统配置 ====================
const POWER_CONFIG = {
  CHARGE_PER_KILL: 1,
  CHARGE_PER_WAVE_MULT: 2,
  MAX_BATTLEFIELD_CHARGE: 100,
  SHIELD_BASE_MAX: 50,
  SHIELD_REGEN_BASE: 2,
  SHIELD_REGEN_DELAY: 5,
  EMP_RANGE: 100,
  EMP_DURATION: 3,
  SHIELD_CHARGE_COST: 30,
  EMP_COST: 50,
  FORT_REPAIR_COST: 20,
  ELECTRICIAN_CHARGE_BONUS: 0.20,
};

// ==================== 队友职业定义 ====================
// 注意：侦察兵改为狙击手，新增炮兵
const ALLY_CLASSES = [
  { name: '战士', hp: 1200, maxHp: 1200, speed: 4, damage: 40, fireRate: 0.6, color: 0x2244aa, desc: '高血量坦克', skill: 'shield', gunSize: {x:0.15, y:0.1, z:0.3}, gunColor: 0x888888 },
  { name: '射手', hp: 70, maxHp: 70, speed: 5, damage: 35, fireRate: 0.1, color: 0x22aa44, desc: '快速射击', skill: 'rapid', attackRange: 50, gunSize: {x:0.08, y:0.06, z:0.4}, gunColor: 0x333333 },
  { name: '医疗兵', hp: 300, maxHp: 300, speed: 5.5, damage: 0, fireRate: 1, color: 0x44ff44, desc: '持续治疗队友', skill: 'heal', isMedic: true, gunSize: {x:0.1, y:0.08, z:0.25}, gunColor: 0xffffff },
  { name: '突击手', hp: 90, maxHp: 90, speed: 10, damage: 25, fireRate: 0.25, color: 0xaa8822, desc: '高速闪避', skill: 'dodge', gunSize: {x:0.1, y:0.07, z:0.35}, gunColor: 0x555555 },
  { name: '狙击手', hp: 65, maxHp: 65, speed: 3, damage: 300, fireRate: 3, color: 0x882244, desc: '隐身狙击', skill: 'stealth', stealth: true, attackRange: 300, gunSize: {x:0.1, y:0.08, z:0.6}, gunColor: 0x222222 },
  { name: '炮兵', hp: 100, maxHp: 100, speed: 3, damage: 200, fireRate: 2, color: 0xff6600, desc: '导弹轰炸', skill: 'artillery', attackRange: 40, isArtillery: true, gunSize: {x:0.2, y:0.15, z:0.3}, gunColor: 0x884400 },
];

// ==================== 波次与敌人出现规则 ====================
const WAVE_CONFIG = {
  ENEMY_UNLOCK: {
    10: '飞龙',    // 10波后解锁
    8: '舔食者',   // 8波后解锁
    5: '暴君',     // 5波后解锁
  },
  SPAWN_CHANCE: {
    飞龙: { minWave: 10, chance: 0.35, minDistance: 30 },  // 10波后，35%概率，30m外
    舔食者: { minWave: 8, chance: 0.25 },                   // 8波后，25%概率
    暴君: { minWave: 5, interval: 5 },                      // 5波后，每5波一次
  },
  BOSS_WAVE_INTERVAL: 5,
  WAVE_INTERVAL: 3,
  SPAWN_INTERVAL: 0.5,
};

// ==================== 升级定义 ====================
const UPGRADE_DEFS = [
  {
    name: '生命强化', effect: 'maxHp', value: 25, rarity: 'common', desc: '最大生命+25', icon: '❤️',
    apply: function(player) {
      player._upgradeMaxHpBonus = (player._upgradeMaxHpBonus || 0) + this.value;
      player.maxHp += this.value;
      player.hp += this.value; // 同时恢复新增的生命值
    }
  },
  {
    name: '疾步如风', effect: 'speed', value: 0.1, rarity: 'common', desc: '移动速度+10%', icon: '💨',
    apply: function(player) {
      player._upgradeSpeedBonus = (player._upgradeSpeedBonus || 0) + this.value;
    }
  },
  { 
    name: '弹匣扩容', effect: 'magSize', value: 0.3, rarity: 'common', desc: '弹匣容量+30%', icon: '📦',
    apply: function(player) {
      player.magMult *= (1 + this.value);
      // 更新当前武器弹匣
      if (typeof window.weapons !== 'undefined') {
        window.weapons.forEach(w => {
          w.magSize = Math.floor(w.baseMagSize * player.magMult);
        });
      }
    }
  },
  { 
    name: '快速换弹', effect: 'reloadSpeed', value: 0.25, rarity: 'common', desc: '换弹速度+25%', icon: '🔄',
    apply: function(player) {
      player.reloadMult *= (1 + this.value);
    }
  },
  { 
    name: '急救包', effect: 'heal', value: 0.5, rarity: 'common', desc: '恢复全场友方50%生命', icon: '🏥',
    apply: function(player) {
      // 恢复玩家50%生命
      player.hp = Math.min(player.hp + player.maxHp * this.value, player.maxHp);
      // 恢复所有友方单位50%生命（包括AI队友和炮塔）
      if (typeof window.allies !== 'undefined') {
        window.allies.forEach(ally => {
          if (ally && ally.hp !== undefined && ally.maxHp !== undefined) {
            ally.hp = Math.min(ally.hp + ally.maxHp * this.value, ally.maxHp);
          }
        });
      }
      // 恢复所有炮塔50%生命（基于科技加成后的最大血量）
      if (typeof window.deployedFortifications !== 'undefined') {
        window.deployedFortifications.forEach(fort => {
          if (fort && fort.health !== undefined) {
            const maxHP = fort.maxHealth || (fort.def && fort.def.health) || 600;
            fort.health = Math.min(fort.health + maxHP * this.value, maxHP);
          }
        });
      }
      // 恢复机器狗50%生命（基于科技加成后的最大血量）
      if (typeof window.deployedFortifications !== 'undefined') {
        window.deployedFortifications.forEach(fort => {
          if (fort && fort.def && fort.def.type === 'robo_dog' && fort.health !== undefined) {
            const maxHP = fort.maxHealth || (fort.def && fort.def.health) || 300;
            fort.health = Math.min(fort.health + maxHP * this.value, maxHP);
          }
        });
      }
    }
  },
  { 
    name: '弹药专家', effect: 'ammoMult', value: 0.5, rarity: 'common', desc: '弹药获取+50%', icon: '🎯',
    apply: function(player) {
      player.ammoMult += this.value;
    }
  },
  {
    name: '伤害提升', effect: 'damage', value: 0.15, rarity: 'rare', desc: '所有武器伤害+15%', icon: '⚔️',
    apply: function(player) {
      player._upgradeDmgBonus = (player._upgradeDmgBonus || 0) + this.value;
    }
  },
  { 
    name: '急速射击', effect: 'fireRate', value: 0.2, rarity: 'rare', desc: '射速+20%', icon: '🔥',
    apply: function(player) {
      player.fireRateMult *= (1 + this.value);
    }
  },
  { 
    name: '队友强化', effect: 'allyHp', value: 0.3, rarity: 'rare', desc: '队友生命+30%', icon: '🛡️',
    apply: function(player) {
      // 初始化全局队友血量倍率
      if (typeof window.allyHpMult === 'undefined') window.allyHpMult = 1;
      window.allyHpMult *= (1 + this.value);
      // 同时对已存在的队友生效
      if (typeof window.allies !== 'undefined') {
        window.allies.forEach(ally => {
          if (ally && ally.maxHp !== undefined) {
            const oldMax = ally.maxHp;
            ally.maxHp *= (1 + this.value);
            ally.hp += (ally.maxHp - oldMax); // 增加相应血量
          }
        });
      }
    }
  },
  { 
    name: '队友武装', effect: 'allyDamage', value: 0.25, rarity: 'rare', desc: '队友伤害+25%', icon: '🔫',
    apply: function(player) {
      // 更新全局伤害倍率，确保后续招募的队友也能获得加成
      window.allyDamageMult = (window.allyDamageMult || 1) * (1 + this.value);
      // 给当前所有队友应用加成
      if (typeof window.allies !== 'undefined') {
        window.allies.forEach(ally => {
          if (ally && ally.dmgMult !== undefined) {
            ally.dmgMult *= (1 + this.value);
          }
        });
      }
    }
  },
  {
    name: '吸血本能', effect: 'lifeSteal', value: 0.05, rarity: 'rare', desc: '击杀回血5%', icon: '🧛',
    apply: function(player) {
      player._upgradeLifeStealBonus = (player._upgradeLifeStealBonus || 0) + this.value;
    }
  },
  { 
    name: '致命一击', effect: 'critChance', value: 0.1, rarity: 'rare', desc: '暴击率+10%', icon: '💥',
    apply: function(player) {
      player.critChanceUpgrade = (player.critChanceUpgrade || 0) + this.value;
      player.critChance += this.value;
    }
  },

  { 
    name: '招募队友', effect: 'recruit', value: 1, rarity: 'epic', desc: '获得一名AI队友（2M范围内）', icon: '🤝',
    apply: function(player) {
      console.log('[Recruit] Applying recruit upgrade, window.spawnAlly:', typeof window.spawnAlly);
      if (typeof window.spawnAlly === 'function' && window.camera) {
        // 在玩家5M外随机位置生成
        const angle = Math.random() * Math.PI * 2;
        const dist = 5 + Math.random() * 3; // 5-8米范围内
        const spawnPos = {
          x: window.camera.position.x + Math.cos(angle) * dist,
          z: window.camera.position.z + Math.sin(angle) * dist
        };
        console.log('[Recruit] Spawning ally at:', spawnPos);
        window.spawnAlly(spawnPos);
      } else {
        console.warn('[Recruit] Cannot spawn ally: spawnAlly is', typeof window.spawnAlly, 'camera is', window.camera);
      }
    }
  },
  {
    name: '护甲强化', effect: 'armor', value: 0.15, rarity: 'epic', desc: '受到伤害-15%', icon: '🛡️',
    apply: function(player) {
      player._upgradeArmorBonus = (player._upgradeArmorBonus || 0) + this.value;
    }
  },
  { 
    name: '爆裂弹头', effect: 'explosive', value: 1, rarity: 'legendary', desc: '子弹爆炸范围伤害', icon: '💣',
    apply: function(player) {
      player.explosiveRounds = true;
    }
  },
  { 
    name: '连锁闪电', effect: 'chainLightning', value: 1, rarity: 'legendary', desc: '击中时电击附近敌人', icon: '⚡',
    apply: function(player) {
      player.chainLightning = true;
    }
  },
];

// 导出到全局
window.CONFIG = CONFIG;
window.WEAPON_DEFS = WEAPON_DEFS;
window.ZOMBIE_DEFS = ZOMBIE_DEFS;
window.POWER_CONFIG = POWER_CONFIG;
window.ALLY_CLASSES = ALLY_CLASSES;
window.WAVE_CONFIG = WAVE_CONFIG;
window.UPGRADE_DEFS = UPGRADE_DEFS;
