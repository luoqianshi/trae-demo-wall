# 游戏数值配置速查表

> 与代码中的 `CONFIG` 对象保持同步
> 版本: v2.5 | 最后更新: 2026-07-08

---

## 全局配置

```javascript
const CONFIG = {
  MAP_SIZE: 200,              // 地图半径
  CHUNK_SIZE: 40,             // 区块大小
  CHUNK_VIEW_DISTANCE: 3,     // 区块加载距离
  CHUNK_UNLOAD_DISTANCE: 5,   // 区块卸载距离
  
  PLAYER_SPEED: 8,            // 玩家基础速度 (m/s)
  SPRINT_MULT: 1.6,           // 冲刺倍率
  JUMP_FORCE: 10,             // 跳跃力度
  GRAVITY: 25,                // 重力加速度
  MOUSE_SENS: 0.002,          // 鼠标灵敏度
  
  ENEMY_SPAWN_DIST: { MIN: 40, MAX: 80 },  // 敌人刷新距离
  MAX_ENEMIES: 60,            // 最大同屏敌人
  ALLY_MAX: 8,                // 最大队友数量
  
  MAX_LEVEL: 50,              // 最高等级
  BASE_XP: 100,               // 基础升级经验
  XP_GROWTH: 1.15,            // 经验增长系数
  
  MAX_HEALTH: 100,            // 玩家基础生命
  SPAWN_INVULNERABLE_TIME: 3, // 出生无敌时间(秒)
  
  ENEMY_SPAWN_RATE: 2.0,      // 基础刷怪间隔(秒)
  ENEMY_SPAWN_RATE_MIN: 0.5,  // 最快刷怪间隔
  
  LOOT: {
    ZOMBIE_DROP: {
      CHANCE: 0.25,           // 掉落概率
      PICKUP_DIST: 2.5,       // 拾取距离
      LIFETIME: 30            // 存在时间(秒)
    }
  },
  
  FORTIFICATIONS: {
    INITIAL_PARTS: 100,       // 初始零件
    RECYCLE_RATIO: 0.8,       // 回收比例
    MIN_DEPLOY_DIST: 0.5,     // 最小部署距离
    MAX_DEPLOY_DIST: 20,      // 最大部署距离
    MIN_SPACING: 5            // 同类型最小间距
  }
};
```

---

## 武器配置

```javascript
WEAPONS: {
  pistol:   { damage: 25,  fireRate: 0.35, magazine: 12, reload: 1.2, spread: 0.015 },
  smg:      { damage: 18,  fireRate: 0.08, magazine: 30, reload: 1.8, spread: 0.05 },
  shotgun:  { damage: 15,  fireRate: 0.8,  magazine: 6,  reload: 2.2, spread: 0.1, pellets: 8 },
  sniper:   { damage: 200, fireRate: 1.3,  magazine: 5,  reload: 2.5, spread: 0.002, pierce: 3 },
  grenade:  { damage: 0,   fireRate: 1.0,  magazine: 5,  reload: 2.0, radius: 15 } // 实际爆炸伤害: CONFIG.GRENADE_DAMAGE=50, 半径=15
}
```

---

## 敌人类型配置

```javascript
ENEMY_TYPES: {
  normal:   { hp: 50,  speed: 2.2, damage: 10, xp: 10,  size: 0.6, color: 0x8FBC8F },
  fast:     { hp: 35,  speed: 4.5, damage: 8,  xp: 15,  size: 0.5, color: 0x32CD32, crawl: true },
  fat:      { hp: 200, speed: 1.0, damage: 25, xp: 35,  size: 1.0, color: 0x8B4513 },
  ranged:   { hp: 40,  speed: 1.8, damage: 15, xp: 20,  size: 0.6, color: 0x9370DB, ranged: true, attackRange: 25 },
  exploder: { hp: 60,  speed: 3.0, damage: 50, xp: 25,  size: 0.7, color: 0xFF4500, explode: true },
  elite:    { hp: 400, speed: 2.5, damage: 30, xp: 80,  size: 0.9, color: 0x8B0000 },
  poison:   { hp: 70,  speed: 2.2, damage: 8,  xp: 22,  size: 0.6, color: 0x228B22, poison: true, attackRange: 18 },
  stealth:  { hp: 45,  speed: 3.5, damage: 18, xp: 30,  size: 0.5, color: 0x2F4F4F, stealth: true },
  
  // 特殊敌人
  tyrant:   { hp: 2000, speed: 2.0, damage: 80, xp: 300, size: 1.5, color: 0x4B0082, special: 'charge', minWave: 5 },
  licker:   { hp: 600,  speed: 7.0, damage: 50, xp: 150, size: 0.8, color: 0xDC143C, special: 'leap', minWave: 3 },
  wyvern:   { hp: 250,  speed: 8.0, damage: 35, xp: 100, size: 1.2, color: 0x228B22, flying: true, wyvern: true, attackRange: 30, attackRangeMelee: 8, minWave: 2 },
  
  // 雪山专属 (snow:true)
  frozen_walker:  { hp: 60,   speed: 2.2, damage: 12,  xp: 15,  size: 1.0,  color: 0x88aabb, snow: true },                      // 冻尸行者
  frost_wolf:     { hp: 45,   speed: 5.5, damage: 10,  xp: 20,  size: 0.75, color: 0x99bbcc, crawl: true, snow: true },          // 霜狼丧尸
  ice_armor:      { hp: 300,  speed: 0.8, damage: 35,  xp: 50,  size: 2.0,  color: 0x557788, fat: true, snow: true },            // 冰甲巨尸
  ice_vulture:    { hp: 55,   speed: 1.8, damage: 15,  xp: 30,  size: 1.1,  color: 0x66aacc, ranged: true, snow: true },         // 冰喙秃鹫
  ice_exploder:   { hp: 65,   speed: 3.2, damage: 50,  xp: 35,  size: 1.1,  color: 0x44aacc, explosive: true, snow: true },      // 冰爆腐尸
  snow_leopard:   { hp: 40,   speed: 4.0, damage: 20,  xp: 25,  size: 0.9,  color: 0x778899, stealth: true, snow: true },        // 雪豹潜行者
  polar_tyrant:   { hp: 600,  speed: 2.2, damage: 40,  xp: 120, size: 2.2,  color: 0x336699, elite: true, snow: true },          // 极地暴君
  avalanche_beast:{ hp: 1500, speed: 1.5, damage: 60,  xp: 300, size: 2.8,  color: 0x224466, tyrant: true, snow: true },         // 雪崩巨兽
  
  // 荒漠专属 (desert:true)
  dried_walker:   { hp: 70,   speed: 2.0, damage: 14,  xp: 18,  size: 1.0,  color: 0xC4A96B, desert: true },                     // 干尸行者
  scorpion:       { hp: 50,   speed: 5.0, damage: 12,  xp: 22,  size: 0.7,  color: 0xD4A843, crawl: true, desert: true },        // 毒蝎丧尸
  beetle_fat:     { hp: 350,  speed: 0.9, damage: 40,  xp: 55,  size: 2.2,  color: 0x8B7355, fat: true, desert: true },          // 甲虫巨尸
  vulture_ranged: { hp: 60,   speed: 1.6, damage: 18,  xp: 32,  size: 1.1,  color: 0xB8956B, ranged: true, desert: true },       // 秃鹫腐尸
  fire_beetle:    { hp: 75,   speed: 3.5, damage: 55,  xp: 38,  size: 1.15, color: 0xA67C52, explosive: true, desert: true },    // 自爆火甲虫
  sand_snake:     { hp: 45,   speed: 4.2, damage: 22,  xp: 28,  size: 0.9,  color: 0xC9B896, stealth: true, desert: true },      // 沙蛇潜行者
  desert_tyrant:  { hp: 700,  speed: 2.0, damage: 45,  xp: 140, size: 2.3,  color: 0x7A5C3C, elite: true, desert: true },        // 荒漠暴君
  sand_worm:      { hp: 2000, speed: 1.8, damage: 70,  xp: 400, size: 3.0,  color: 0x5C4033, tyrant: true, desert: true }        // 沙虫巨兽
}
```

**波次加成公式**:
- 生命加成: `hp * (1 + (wave - 1) * 0.15)`
- 速度加成: `speed * (1 + Math.min((wave - 1) * 0.02, 0.3))`

---

## 升级配置

```javascript
UPGRADES: {
  // 普通
  health_boost:     { rarity: 'common', effect: 'maxHealth', value: 25 },
  speed_boost:      { rarity: 'common', effect: 'speed', value: 0.1 },
  magazine_boost:   { rarity: 'common', effect: 'magazine', value: 0.3 },
  reload_boost:     { rarity: 'common', effect: 'reload', value: -0.25 },
  heal:             { rarity: 'common', effect: 'heal', value: 0.5 },
  ammo_boost:       { rarity: 'common', effect: 'ammoGain', value: 0.5 },
  
  // 稀有
  damage_boost:     { rarity: 'rare', effect: 'damage', value: 0.15 },
  fire_rate_boost:  { rarity: 'rare', effect: 'fireRate', value: 0.2 },
  ally_health:      { rarity: 'rare', effect: 'allyHealth', value: 0.3 },
  ally_damage:      { rarity: 'rare', effect: 'allyDamage', value: 0.25 },
  crit_chance:      { rarity: 'rare', effect: 'critChance', value: 0.1 },
  life_steal:       { rarity: 'rare', effect: 'lifeSteal', value: 0.05, desc: '击杀回血5%' },
  
  // 史诗
  recruit_ally:     { rarity: 'epic', effect: 'recruit', value: 1 },
  armor:            { rarity: 'epic', effect: 'damageReduction', value: 0.15 },
  
  // 传说
  explosive_rounds: { rarity: 'legendary', effect: 'explosive', value: true },
  chain_lightning:  { rarity: 'legendary', effect: 'chainLightning', value: true }
}
```

**稀有度权重**: 普通 50% | 稀有 35% | 史诗 12% | 传说 3%

---

## 队友职业配置

```javascript
ALLY_CLASSES: {
  warrior:  { name: '战士',   hp: 1200, speed: 4,  damage: 40,  fireRate: 0.6 },
  shooter:  { name: '射手',   hp: 70,   speed: 5,  damage: 35,  fireRate: 0.1, attackRange: 50 },
  medic:    { name: '医疗兵', hp: 300,  speed: 5.5, damage: 0,  fireRate: 1 },
  assault:  { name: '突击手', hp: 90,   speed: 10, damage: 25,  fireRate: 0.25 },
  sniper:   { name: '狙击手', hp: 65,   speed: 3,  damage: 300, fireRate: 3,   attackRange: 300, stealth: true },
  artillery:{ name: '炮兵',   hp: 100,  speed: 3,  damage: 200, fireRate: 2,   attackRange: 40 }
}
```

---

## 属性面板配置

```javascript
// 基础属性上限（15项）
STAT_LIMITS: {
  maxHp:         20,  // 最多+200生命 (每级+10)
  damage:        10,  // 最多+100%伤害 (每级+10%)
  speed:         10,  // 最多+50%速度 (每级+5%)
  critChance:    10,  // 最多+50%暴击率 (每级+5%)
  critDamage:    5,   // 最多+100%暴击伤害 (每级+20%)
  armor:         10,  // 最多+50%护甲 (每级+5%)
  lifeSteal:     10,  // 最多+20%吸血 (每级+2%)
  fireRate:      10,  // 最多+50%射速 (每级+5%)
  reloadSpeed:   10,  // 最多+50%换弹速度 (每级+5%)
  ammoCapacity:  15,  // 最多+75%弹匣容量 (每级+5%)
  quickDraw:     10,  // 瞬发手铳 (10级上限)
  doubleJump:    10,  // 二段跳 (10级解锁空中二段跳)
  climbing:      10,  // 攀爬 (10级上限，每级+1秒攀爬时间，冷却10秒)
  healthRegen:   10,  // 生命恢复 (每级+1HP/秒)
  pickupRange:   5,   // 拾取范围 (每级+1米)
  expGain:       10,  // 经验获取 (每级+10%)
}

// 精通属性上限（基础属性全满后解锁）
MASTERY_LIMITS: {
  masteryDamage:     20,  // 伤害精通（+100%伤害）
  masteryDefense:    20,  // 防御精通（+100%防御）
  masteryEfficiency: 20,  // 效率精通（+200%资源获取）
}
```

---

## 避难所配置

### 资源上限
```javascript
SHELTER: {
  MAX_BUILDING: 500,   // 建材上限
  MAX_FOOD: 500,       // 食物上限
  MAX_PARTS: 300,      // 零件上限
  MAX_POWER: 150,      // 电力上限
  
  OFFLINE_EFFICIENCY: 0.3,  // 离线效率
  MAX_OFFLINE_HOURS: 8      // 最大离线时间
}
```

### 设施配置
```javascript
FACILITIES: {
  hq:         { maxLevel: 5, cost: { building: 200 }, unlockLevel: 1 },
  dorm:       { maxLevel: 5, cost: { building: 100 }, unlockLevel: 1, capacity: level => level * 2 },
  scrapyard:  { maxLevel: 5, cost: { building: 50, parts: 30 }, unlockLevel: 1, output: level => 10 + level * 5 },
  farm:       { maxLevel: 5, cost: { building: 80, parts: 20 }, unlockLevel: 1, output: level => 8 + level * 4 },
  workshop:   { maxLevel: 5, cost: { building: 100, parts: 50 }, unlockLevel: 2, output: level => 6 + level * 3 },
  powerplant: { maxLevel: 3, cost: { building: 150, parts: 100 }, unlockLevel: 2, capacity: level => level * 50 },
  warehouse:  { maxLevel: 5, cost: { building: 80 }, unlockLevel: 1, capacityBonus: level => level * 500 },
  training:   { maxLevel: 3, cost: { building: 120, parts: 60 }, unlockLevel: 2, xpBonus: level => level * 0.1 },
  medical:    { maxLevel: 3, cost: { building: 100, parts: 80 }, unlockLevel: 2, healPerWave: level => level * 20 },
  comms:      { maxLevel: 3, cost: { building: 150, parts: 100 }, unlockLevel: 3, airdropBonus: level => level * 0.2 }
}
```

### 幸存者配置
```javascript
SURVIVORS: {
  scavenger:  { cost: { food: 50 }, skill: '拆解', effect: { buildingDrop: 0.1 } },
  farmer:     { cost: { food: 30 }, skill: '种植', effect: { regen: 0.5 } },
  engineer:   { cost: { parts: 40 }, skill: '制造', effect: { fortHealth: 0.25 } },
  doctor:     { cost: { food: 60, parts: 20 }, skill: '医疗', effect: { waveHeal: 30 } },
  hunter:     { cost: { food: 80, parts: 50 }, skill: '战斗', effect: { damage: 0.05 } },
  cook:       { cost: { food: 40, parts: 30 }, skill: '烹饪', effect: { foodConsumption: -0.2 } },
  mechanic:   { cost: { parts: 60, building: 30 }, skill: '维修', effect: { fortRepair: 0.2 } },
  scout:      { cost: { food: 40, parts: 40 }, skill: '侦查', effect: { airdropFreq: 0.15, pickupRange: 2 } },
  electrician:{ cost: { food: 50, parts: 50 }, skill: '发电', effect: { chargeSpeed: 0.2 } }
}
```

### 科技配置
```javascript
TECH: {
  weapon_improvement: { maxLevel: 3, cost: level => parts * 100 * (level + 1), effect: { damage: 0.05 } },
  health_enhancement: { maxLevel: 3, cost: level => building * 100 * (level + 1), effect: { maxHealth: 20 } },
  fortification_boost:{ maxLevel: 3, cost: level => parts * 80 * (level + 1), effect: { fortHealth: 0.25 } },
  turret_speed:       { maxLevel: 3, cost: level => parts * 60 * (level + 1), effect: { turretFireRate: 0.1 } },
  power_efficiency:   { maxLevel: 3, cost: level => parts * 80 * (level + 1), effect: { powerOutput: 0.25 } },
  energy_saving:      { maxLevel: 3, cost: level => parts * 60 * (level + 1), effect: { powerConsumption: -0.15 } },
  shield_enhancement: { maxLevel: 3, cost: level => parts * 100 * (level + 1), effect: { shieldMax: 0.5, shieldRegen: 0.3 } }
}
```

---

## 工事配置

### 工事研发
```javascript
FORTIFICATION_TYPES: {
  barricade:    { name: '木栅栏', icon: '🧱', researchCost: { building: 50, parts: 20 }, unlocked: true },
  barbed_wire:  { name: '铁丝网', icon: '🕸️', researchCost: { building: 80, parts: 30 }, unlocked: true },
  mine:         { name: '地雷', icon: '💥', researchCost: { building: 60, parts: 40 }, unlocked: true },
  turret_mg:    { name: '机枪塔', icon: '🔫', researchCost: { building: 150, parts: 80 }, unlocked: true },
  turret_elec:  { name: '电塔', icon: '⚡', researchCost: { building: 200, parts: 120 }, unlocked: false },
  turret_shot:  { name: '霰弹塔', icon: '📦', researchCost: { building: 180, parts: 100 }, unlocked: false },
  turret_snipe: { name: '狙击塔', icon: '🔭', researchCost: { building: 250, parts: 150 }, unlocked: false },
  drone_tower:  { name: '无人机塔', icon: '🚁', researchCost: { building: 300, parts: 200 }, unlocked: false }
}
```

### 工事战场属性
```javascript
FORTIFICATIONS: {
  barricade:    { type: 'barricade', health: 500, cost: 20, size: 2 },
  barbed_wire:  { type: 'barricade', health: 300, cost: 30, size: 2, slow: 0.5, damage: 2 },
  mine:         { type: 'trap', health: 1, cost: 15, triggerRadius: 3, damage: 150 },
  turret_mg:    { type: 'turret', health: 800, cost: 80, damage: 15, fireRate: 0.1, range: 25 },
  turret_elec:  { type: 'turret', health: 600, cost: 100, damage: 150, fireRate: 2.5, range: 20, laser: true },
  turret_shot:  { type: 'turret', health: 600, cost: 100, damage: 12, pellets: 6, fireRate: 0.8, range: 15 },
  turret_snipe: { type: 'turret', health: 500, cost: 120, damage: 60, fireRate: 2.0, range: 60, pierce: true },
  drone_tower:  { type: 'drone', health: 400, cost: 150, damage: 80, fireRate: 8.0, range: 40, explosionRadius: 3 },
  robo_dog:     { type: 'dog', health: 300, cost: 200, speed: 5, dogSpeed: 5, pickupRange: 20 }
}
```

---

## 流场寻路配置

```javascript
FLOWFIELD: {
  CELL_SIZE: 2,           // 格子大小 (米)
  MAP_HALF: 200,          // 地图半径
  GRID_SIZE: 200,         // 网格尺寸
  UPDATE_INTERVAL: 0.3,   // 更新间隔 (秒)
  TARGET_THRESHOLD: 4,    // 目标移动超过4米才更新
  BUFFER_CELLS: 1         // 障碍物缓冲格数
}
```

---

## 天气配置

| 天气类型 | 解锁波次 | 触发概率 | 特殊效果 |
|----------|----------|----------|----------|
| clear (晴朗) | 默认 | 20% | 正常 |
| rain (雨天) | 3波 | 15% | 视野降低 |
| fog (浓雾) | 7波 | 15% | 视野大幅降低 |
| storm (雷暴) | 5波 | 15% | 闪电伤害 |
| snow (大雪) | 6波 | 15% | 移动减速 |
| bloodmoon (血月) | 4波 | 20% | 敌人强化 |

---

## 调试命令行

游戏中按 `/` 键打开命令面板，所有命令仅本场有效。

### 天气命令
| 命令 | 效果 |
|------|------|
| `rain` | 切换雨天 |
| `fog` | 切换浓雾 |
| `storm` | 切换雷暴 |
| `snow` | 切换大雪 |
| `bloodmoon` | 切换血月 |
| `normal` | 切换晴天 |

### 游戏命令
| 命令 | 效果 |
|------|------|
| `kill` | 清除所有敌人 |
| `wave N` | 跳转到第N波 |
| `spawn N` | 随机生成N个敌人 |
| `add 怪物 N` | 生成N个指定怪物 |

### 资源命令
| 命令 | 效果 |
|------|------|
| `bld N` | 增加N建材到避难所 |
| `food N` | 增加N食物到避难所 |
| `part N` | 增加N零件到避难所 |
| `xp N` | 增加N经验值 |

### 队友命令
| 命令 | 效果 |
|------|------|
| `ally N` | 添加N个随机队友 |
| `ally 名称` | 添加指定类型队友 |

可用队友名称：战士、射手、医疗兵、突击手、狙击手、炮兵

### 其他命令
| 命令 | 效果 |
|------|------|
| `god` | 无敌开关 |
| `heal` | 恢复满血 |
| `weather` | 显示当前天气信息 |

---

*文档版本: v2.4*  
*最后更新: 2026-07-07*
