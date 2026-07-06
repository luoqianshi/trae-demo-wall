// 出怪系统 - 基于预算的动态出怪
// 出怪预算参数: 基础值随楼层递增 + 关卡内阶梯式陡峭递增(有上限)
// 每个敌人有难度消耗值, 每 tick 补充预算, 随机消耗出怪(不归零, 不一定必出)
// 波次瞬间给多倍预算, 集中爆发出怪

export default {
  // 每关波次数（塔模式每场战斗 3 波）
  wavesPerLevel: 3,
  // 波次间隔（秒）
  waveInterval: 22,
  // 首波延迟（秒，给玩家布阵时间）
  firstWaveDelay: 15,

  // === 出怪预算系统 ===
  spawnBudget: {
    // 每 tick 补充预算的间隔（秒）
    tickInterval: 3,
    // 第 1 层基础预算（每 tick 补充量）
    baseBudgetFloor1: 2.0,
    // 每层预算增长系数（线性）
    floorBudgetGrowth: 0.5,
    // 关卡内进度阶梯式递增（陡峭曲线）
    progressCurve: [
      { progress: 0.00, multiplier: 1.0 },   // 关卡开始
      { progress: 0.15, multiplier: 1.3 },
      { progress: 0.30, multiplier: 1.7 },
      { progress: 0.50, multiplier: 2.2 },
      { progress: 0.70, multiplier: 3.0 },
      { progress: 0.85, multiplier: 3.8 },
      { progress: 1.00, multiplier: 4.5 }    // 关卡结束（上限）
    ],
    // 预算累积上限（避免囤积过多）
    maxAccumulated: 30,
    // 每个 tick 出怪概率（若预算允许）
    spawnChancePerTick: 0.4,
    // 波次爆发：瞬间补充多倍预算（降低以避免首波压制玩家）
    waveBudgetBurst: 2.5,
    // 出怪最小间隔（毫秒，避免僵尸扎堆出现）
    minSpawnInterval: 2500,
    // 前期保护：低楼层预算降低
    earlyFloorProtection: {
      maxFloor: 3,
      budgetMultiplier: 0.5   // 前 3 层预算仅 50%
    }
  },

  // === 楼层 HP 缩放 ===
  hpScaling: {
    baseMultiplier: 1.0,
    perFloorIncrease: 0.12,   // 每层 +12% HP
    maxMultiplier: 3.0        // 上限 3 倍
  },

  // === 速度缩放（轻微）===
  speedScaling: {
    baseMultiplier: 1.0,
    perFloorIncrease: 0.02,   // 每层 +2% 速度
    maxMultiplier: 1.5        // 上限 1.5 倍
  },

  // === 难度等级（保留兼容旧代码）===
  difficultyScaling: {
    easy:      { zombieHpMultiplier: 0.8, zombieSpeedMultiplier: 0.9, sunReduction: 0 },
    normal:    { zombieHpMultiplier: 1.0, zombieSpeedMultiplier: 1.0, sunReduction: 0 },
    hard:      { zombieHpMultiplier: 1.3, zombieSpeedMultiplier: 1.1, sunReduction: 0.1 },
    nightmare: { zombieHpMultiplier: 1.8, zombieSpeedMultiplier: 1.3, sunReduction: 0.2 }
  },

  // === 计算楼层 HP 倍率 ===
  getFloorHpMultiplier(floor) {
    const mult = this.hpScaling.baseMultiplier + (floor - 1) * this.hpScaling.perFloorIncrease;
    return Math.min(mult, this.hpScaling.maxMultiplier);
  },

  // === 计算楼层速度倍率 ===
  getFloorSpeedMultiplier(floor) {
    const mult = this.speedScaling.baseMultiplier + (floor - 1) * this.speedScaling.perFloorIncrease;
    return Math.min(mult, this.speedScaling.maxMultiplier);
  },

  // === 计算某楼层某进度的出怪预算（每 tick 补充量）===
  getBudgetPerTick(floor, progress) {
    const cfg = this.spawnBudget;
    // 基础预算随楼层线性增长
    let base = cfg.baseBudgetFloor1 + (floor - 1) * cfg.floorBudgetGrowth;
    // 前期保护
    if (floor <= cfg.earlyFloorProtection.maxFloor) {
      base *= cfg.earlyFloorProtection.budgetMultiplier;
    }
    // 关卡内进度阶梯式递增
    let progressMult = 1.0;
    for (let i = cfg.progressCurve.length - 1; i >= 0; i--) {
      if (progress >= cfg.progressCurve[i].progress) {
        progressMult = cfg.progressCurve[i].multiplier;
        break;
      }
    }
    return base * progressMult;
  },

  // === 获取出怪池（按楼层）===
  getSpawnPool(floor) {
    const pools = {
      1: ['normal', 'flag', 'cone'],
      2: ['normal', 'flag', 'cone'],
      3: ['normal', 'flag', 'cone', 'bucket', 'brick', 'pole', 'newspaper', 'snorkel'],
      4: ['normal', 'flag', 'cone', 'bucket', 'brick', 'pole', 'newspaper', 'snorkel'],
      5: ['normal', 'cone', 'bucket', 'brick', 'cone_bronze', 'pole', 'pogo', 'sprinter',
          'balloon', 'bungee', 'diver', 'screen', 'newspaper', 'dancer', 'ladder', 'jack_in_box', 'ghost', 'smurf', 'ice_block'],
      6: ['normal', 'cone', 'bucket', 'brick', 'cone_bronze', 'pole', 'pogo', 'sprinter',
          'balloon', 'bungee', 'diver', 'screen', 'newspaper', 'dancer', 'ladder', 'jack_in_box', 'ghost', 'smurf', 'ice_block'],
      7: ['normal', 'cone', 'bucket', 'brick', 'cone_bronze', 'bucket_iron', 'bronze', 'iron',
          'football', 'cheetah', 'all_star', 'ricochet', 'lightning',
          'balloon', 'parrot', 'drone', 'bat', 'jetpack', 'frogman', 'kraken',
          'screen', 'knight', 'crystal', 'yeti', 'catapult', 'miner', 'zamboni',
          'chicken_wrangler', 'treasure_hunter', 'wizard', 'octo', 'venom_spitter', 'stone_golem'],
      8: ['normal', 'cone', 'bucket', 'brick', 'cone_bronze', 'bucket_iron', 'bronze', 'iron',
          'football', 'cheetah', 'all_star', 'ricochet', 'lightning',
          'balloon', 'parrot', 'drone', 'bat', 'jetpack', 'frogman', 'kraken',
          'screen', 'knight', 'crystal', 'yeti', 'catapult', 'miner', 'zamboni',
          'chicken_wrangler', 'treasure_hunter', 'wizard', 'octo', 'venom_spitter', 'stone_golem'],
      9: ['normal', 'cone', 'bucket', 'bucket_iron', 'iron', 'gold', 'crystal',
          'football', 'all_star', 'cheetah', 'lightning', 'jetpack', 'kraken',
          'knight', 'yeti', 'zamboni', 'wizard', 'octo',
          'berserker', 'necromancer', 'phoenix', 'titan', 'illusionist', 'vampire', 'mecha', 'shadow'],
      10: ['normal', 'cone', 'bucket', 'bucket_iron', 'iron', 'gold', 'crystal',
           'football', 'all_star', 'cheetah', 'lightning', 'jetpack', 'kraken',
           'knight', 'yeti', 'zamboni', 'wizard', 'octo',
           'berserker', 'necromancer', 'phoenix', 'titan', 'illusionist', 'vampire', 'mecha', 'shadow']
    };
    if (floor <= 10) return pools[floor] || pools[1];
    // 11+ 层：全部
    return ['normal', 'cone', 'bucket', 'brick', 'cone_bronze', 'bucket_iron', 'bronze', 'iron', 'gold', 'crystal',
            'pole', 'pogo', 'ricochet', 'sprinter', 'cheetah', 'football', 'all_star', 'lightning',
            'balloon', 'bungee', 'parrot', 'drone', 'bat', 'jetpack',
            'diver', 'snorkel', 'frogman', 'kraken',
            'screen', 'knight', 'crystal', 'newspaper', 'dancer', 'yeti', 'ladder', 'catapult',
            'miner', 'zamboni', 'jack_in_box', 'chicken_wrangler', 'ghost', 'treasure_hunter',
            'wizard', 'octo', 'smurf', 'ice_block',
            'berserker', 'necromancer', 'phoenix', 'titan', 'illusionist', 'venom_spitter',
            'stone_golem', 'vampire', 'mecha', 'shadow'];
  },

  // === Boss 调度（每 10 层一个 Boss）===
  getBossForFloor(floor) {
    const schedule = {
      10: 'gargantuar',
      20: 'frost_giant',
      30: 'zombot',
      40: 'edgar_ii',
      50: 'dragon_lord'
    };
    if (schedule[floor]) return schedule[floor];
    // 50 层以上循环 dragon_lord
    if (floor > 50 && floor % 10 === 0) return 'dragon_lord';
    return null;
  },

  // === 判断是否为 Boss 楼层 ===
  isBossFloor(floor) {
    return floor % 10 === 0;
  },

  // === 获取楼层特殊僵尸提示（特性标签）===
  // 返回该楼层可能出现的特殊僵尸的特性标签（去重）
  getFloorZombieHints(floor) {
    const pool = this.getSpawnPool(floor);
    const hints = new Set();
    for (const type of pool) {
      // 只提示有特殊标签的僵尸（非基础类）
      if (type === 'normal' || type === 'flag' || type === 'cone') continue;
      // 这里需要从 zombies.js 获取 counterTags，但为避免循环依赖，硬编码关键标签
      const tagMap = {
        bucket: ['重甲'], brick: ['护甲'], cone_bronze: ['重甲'], bucket_iron: ['重甲', '硬壳'],
        flag_elite: ['指挥'],
        pole: ['跳跃'], pogo: ['跳跃'], ricochet: ['跳跃'], sprinter: ['冲刺'], cheetah: ['冲刺', '高速'],
        football: ['冲锋', '护甲'], all_star: ['冲锋', '重甲'], lightning: ['瞬移'],
        balloon: ['飞行'], bungee: ['偷取'], parrot: ['飞行', '偷取'], drone: ['飞行', '远程'],
        bat: ['飞行', '群聚'], jetpack: ['飞行', '高速'],
        diver: ['潜水'], snorkel: ['潜水'], frogman: ['潜水', '突袭'], kraken: ['潜水', '触手'],
        screen: ['挡弹'], knight: ['盾牌'], bronze: ['护甲'], iron: ['重甲'], gold: ['重甲', '宝藏'],
        crystal: ['反射'],
        newspaper: ['狂暴'], dancer: ['召唤'], yeti: ['稀有', '逃跑'], ladder: ['搭梯'],
        catapult: ['远程'], miner: ['挖洞'], zamboni: ['冰冻', '碾压'], jack_in_box: ['自爆'],
        chicken_wrangler: ['释放'], ghost: ['穿透'], treasure_hunter: ['挖洞', '宝藏'],
        wizard: ['变形'], octo: ['束缚'], smurf: ['骑乘'], ice_block: ['冰甲'],
        berserker: ['狂暴', '高速'], necromancer: ['召唤', '诅咒'], phoenix: ['重生', '灼烧'],
        titan: ['巨体', '重甲'], illusionist: ['分身', '混乱'], venom_spitter: ['远程', '毒素'],
        stone_golem: ['石甲', '碾压'], vampire: ['吸血', '高速'], mecha: ['护盾', '激光'],
        shadow: ['潜行', '背刺']
      };
      if (tagMap[type]) {
        tagMap[type].forEach(t => hints.add(t));
      }
    }
    // Boss 楼层额外提示
    const bossId = this.getBossForFloor(floor);
    if (bossId) {
      hints.add('Boss');
      if (bossId === 'gargantuar') hints.add('投掷');
      if (bossId === 'frost_giant') hints.add('冰冻');
      if (bossId === 'zombot') hints.add('机械');
      if (bossId === 'edgar_ii') hints.add('终极');
      if (bossId === 'dragon_lord') { hints.add('飞行'); hints.add('火焰'); }
    }
    return Array.from(hints);
  },

  // === 获取楼层僵尸类型预览（用于选植物界面）===
  getFloorZombiePreview(floor) {
    const pool = this.getSpawnPool(floor);
    // 返回去重的僵尸类型（最多显示 8 种代表性僵尸）
    const preview = [];
    const seen = new Set();
    // 优先选择特殊僵尸
    const priorityOrder = ['boss', 'flying', 'aquatic', 'elite', 'armored', 'fast', 'special', 'basic'];
    // 简化：从池中随机选 8 种
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    for (const type of shuffled) {
      if (seen.has(type)) continue;
      seen.add(type);
      preview.push(type);
      if (preview.length >= 8) break;
    }
    return preview;
  },

  // === 旧版波次模板（保留兼容，但 game.js 不再使用）===
  waveTemplates: [
    { wave: 1, minZombies: 2, maxZombies: 3, zombieTypes: ['normal'], hasElite: false, hasBoss: false }
  ],
  graveWaveIndex: 6
};
