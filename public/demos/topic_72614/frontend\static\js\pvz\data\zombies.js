// 僵尸数据系统 - 基于 PvZ 原版 + PvZ2 + 杂交版/融合版创意
// 每个僵尸包含: hp, speed, difficulty(出怪预算消耗), category, abilities, weaknesses, counterTags
// difficulty: 出怪预算消耗值，越强消耗越高
// weaknesses: 被哪些植物变异克制 (ice/fire/light/area/explosion/reveal/ranged/poison/emp)
// counterTags: 地图节点提示标签 (供玩家预览)

export const ZOMBIE_CATEGORIES = {
  BASIC: 'basic',         // 基础类
  ARMORED: 'armored',     // 护甲类
  FAST: 'fast',           // 速度类
  FLYING: 'flying',       // 飞行类
  AQUATIC: 'aquatic',     // 潜水类
  SPECIAL: 'special',     // 特殊类
  ELITE: 'elite',         // 精英耦合类
  BOSS: 'boss',           // Boss类
  SUMMON: 'summon'        // 召唤物
};

// 弱点标签 -> 含义说明（供 UI 显示）
export const WEAKNESS_INFO = {
  ice:       { name: '冰冻',   icon: '❄️', desc: '冰系攻击可大幅减速' },
  fire:      { name: '火焰',   icon: '🔥', desc: '火系攻击造成额外伤害' },
  light:     { name: '光照',   icon: '☀️', desc: '光系攻击破除隐身/诅咒' },
  area:      { name: '范围',   icon: '💥', desc: '范围攻击克制分身/召唤' },
  explosion: { name: '爆炸',   icon: '💣', desc: '爆炸破除厚重护甲' },
  reveal:    { name: '显形',   icon: '👁️', desc: '显形克制潜行/幻象' },
  ranged:    { name: '远程',   icon: '🎯', desc: '远程攻击克制高速移动' },
  poison:    { name: '毒素',   icon: '☠️', desc: '毒素克制高血量' },
  emp:       { name: '电磁',   icon: '⚡', desc: '电磁克制机械单位' },
  knockback: { name: '击退',   icon: '🌀', desc: '击退克制冲锋单位' }
};

export default {
  // ==================== 基础类 (8) ====================
  torsos: {
    // --- 基础类 ---
    normal: {
      id: 'normal', name_cn: '普通僵尸', name_en: 'Normal Zombie',
      hp: 270, speed: 1.0, difficulty: 1, category: ZOMBIE_CATEGORIES.BASIC,
      abilities: [], weaknesses: [], counterTags: [],
      description: '最基础的僵尸，无特殊能力'
    },
    flag: {
      id: 'flag', name_cn: '旗帜僵尸', name_en: 'Flag Zombie',
      hp: 270, speed: 1.5, difficulty: 1, category: ZOMBIE_CATEGORIES.BASIC,
      abilities: ['signal_wave'], weaknesses: [], counterTags: [],
      description: '标志波次开始，移动较快'
    },
    cone: {
      id: 'cone', name_cn: '路障僵尸', name_en: 'Cone Zombie',
      hp: 560, speed: 0.9, difficulty: 2, category: ZOMBIE_CATEGORIES.BASIC,
      abilities: ['armor_cone'], weaknesses: ['explosion'], counterTags: ['护甲'],
      description: '路障提供额外防护，爆炸可破'
    },
    bucket: {
      id: 'bucket', name_cn: '铁桶僵尸', name_en: 'Bucket Zombie',
      hp: 1300, speed: 0.8, difficulty: 4, category: ZOMBIE_CATEGORIES.BASIC,
      abilities: ['armor_bucket'], weaknesses: ['explosion', 'poison'], counterTags: ['重甲'],
      description: '铁桶提供强大防护，爆炸/毒素可克'
    },
    brick: {
      id: 'brick', name_cn: '砖块僵尸', name_en: 'Brick Zombie',
      hp: 800, speed: 0.85, difficulty: 3, category: ZOMBIE_CATEGORIES.BASIC,
      abilities: ['armor_brick'], weaknesses: ['explosion'], counterTags: ['护甲'],
      description: '砖头护甲，中等防护'
    },
    cone_bronze: {
      id: 'cone_bronze', name_cn: '青铜路障', name_en: 'Bronze Cone Zombie',
      hp: 1100, speed: 0.85, difficulty: 5, category: ZOMBIE_CATEGORIES.BASIC,
      abilities: ['armor_bronze'], weaknesses: ['explosion', 'fire'], counterTags: ['重甲'],
      description: '青铜路障，火焰可熔'
    },
    bucket_iron: {
      id: 'bucket_iron', name_cn: '钢铁僵尸', name_en: 'Iron Zombie',
      hp: 2200, speed: 0.75, difficulty: 7, category: ZOMBIE_CATEGORIES.BASIC,
      abilities: ['armor_iron'], weaknesses: ['explosion', 'poison', 'emp'], counterTags: ['重甲', '硬壳'],
      description: '钢铁护甲，极难破除'
    },
    flag_elite: {
      id: 'flag_elite', name_cn: '精英旗手', name_en: 'Elite Flag Zombie',
      hp: 450, speed: 1.6, difficulty: 3, category: ZOMBIE_CATEGORIES.BASIC,
      abilities: ['signal_wave', 'rally'], weaknesses: ['ranged'], counterTags: ['指挥'],
      description: '精英旗手，激励周围僵尸加速'
    },

    // --- 速度类 ---
    pole: {
      id: 'pole', name_cn: '撑杆僵尸', name_en: 'Pole Vaulting Zombie',
      hp: 500, speed: 1.6, difficulty: 3, category: ZOMBIE_CATEGORIES.FAST,
      abilities: ['vault'], weaknesses: ['knockback', 'ranged'], counterTags: ['跳跃'],
      description: '撑杆跳过第一株植物'
    },
    pogo: {
      id: 'pogo', name_cn: '弹跳僵尸', name_en: 'Pogo Zombie',
      hp: 500, speed: 1.7, difficulty: 4, category: ZOMBIE_CATEGORIES.FAST,
      abilities: ['multi_jump'], weaknesses: ['knockback', 'ice'], counterTags: ['跳跃'],
      description: '连续跳跃前进，冰冻可制'
    },
    ricochet: {
      id: 'ricochet', name_cn: '弹跳僵尸', name_en: 'Ricochet Zombie',
      hp: 450, speed: 1.5, difficulty: 5, category: ZOMBIE_CATEGORIES.FAST,
      abilities: ['bounce'], weaknesses: ['knockback', 'ice'], counterTags: ['跳跃'],
      description: '在植物间弹跳前进'
    },
    sprinter: {
      id: 'sprinter', name_cn: '冲刺僵尸', name_en: 'Sprinter Zombie',
      hp: 350, speed: 1.4, difficulty: 4, category: ZOMBIE_CATEGORIES.FAST,
      abilities: ['dash'], weaknesses: ['knockback', 'ice'], counterTags: ['冲刺'],
      description: '间歇性高速冲刺'
    },
    cheetah: {
      id: 'cheetah', name_cn: '猎豹僵尸', name_en: 'Cheetah Zombie',
      hp: 600, speed: 1.9, difficulty: 6, category: ZOMBIE_CATEGORIES.FAST,
      abilities: ['charge_fast'], weaknesses: ['knockback', 'ice', 'ranged'], counterTags: ['冲刺', '高速'],
      description: '极速冲锋，击退/冰冻可制'
    },
    football: {
      id: 'football', name_cn: '橄榄球僵尸', name_en: 'Football Zombie',
      hp: 1600, speed: 1.8, difficulty: 6, category: ZOMBIE_CATEGORIES.FAST,
      abilities: ['charge'], weaknesses: ['knockback', 'explosion'], counterTags: ['冲锋', '护甲'],
      description: '高速冲锋撞击植物'
    },
    all_star: {
      id: 'all_star', name_cn: '全明星僵尸', name_en: 'All-Star Zombie',
      hp: 1800, speed: 2.0, difficulty: 8, category: ZOMBIE_CATEGORIES.FAST,
      abilities: ['charge', 'armor_heavy'], weaknesses: ['knockback', 'explosion', 'ice'], counterTags: ['冲锋', '重甲'],
      description: '高速冲锋+重甲，多弱点'
    },
    lightning: {
      id: 'lightning', name_cn: '闪电僵尸', name_en: 'Lightning Zombie',
      hp: 500, speed: 1.5, difficulty: 7, category: ZOMBIE_CATEGORIES.FAST,
      abilities: ['teleport'], weaknesses: ['ice', 'reveal'], counterTags: ['瞬移'],
      description: '瞬移前进，冰冻/显形可制'
    },

    // --- 飞行类 ---
    balloon: {
      id: 'balloon', name_cn: '气球僵尸', name_en: 'Balloon Zombie',
      hp: 300, speed: 1.5, difficulty: 3, category: ZOMBIE_CATEGORIES.FLYING,
      abilities: ['flying'], weaknesses: ['ranged', 'explosion'], counterTags: ['飞行'],
      description: '飞行越过植物，远程可击落'
    },
    bungee: {
      id: 'bungee', name_cn: '蹦极僵尸', name_en: 'Bungee Zombie',
      hp: 400, speed: 0, difficulty: 4, category: ZOMBIE_CATEGORIES.FLYING,
      abilities: ['steal'], weaknesses: ['ranged', 'explosion'], counterTags: ['偷取'],
      description: '从天而降偷取植物'
    },
    parrot: {
      id: 'parrot', name_cn: '鹦鹉僵尸', name_en: 'Parrot Zombie',
      hp: 350, speed: 1.8, difficulty: 5, category: ZOMBIE_CATEGORIES.FLYING,
      abilities: ['flying', 'steal'], weaknesses: ['ranged', 'ice'], counterTags: ['飞行', '偷取'],
      description: '飞行偷取植物，速度极快'
    },
    drone: {
      id: 'drone', name_cn: '无人机僵尸', name_en: 'Drone Zombie',
      hp: 500, speed: 1.3, difficulty: 6, category: ZOMBIE_CATEGORIES.FLYING,
      abilities: ['flying', 'ranged_attack'], weaknesses: ['emp', 'ranged'], counterTags: ['飞行', '远程'],
      description: '飞行+远程攻击，电磁可制'
    },
    bat: {
      id: 'bat', name_cn: '蝙蝠僵尸', name_en: 'Bat Zombie',
      hp: 250, speed: 1.6, difficulty: 4, category: ZOMBIE_CATEGORIES.FLYING,
      abilities: ['flying', 'swarm'], weaknesses: ['light', 'area'], counterTags: ['飞行', '群聚'],
      description: '飞行+群聚，光照/范围可克'
    },
    jetpack: {
      id: 'jetpack', name_cn: '喷气僵尸', name_en: 'Jetpack Zombie',
      hp: 700, speed: 2.0, difficulty: 7, category: ZOMBIE_CATEGORIES.FLYING,
      abilities: ['flying', 'dash'], weaknesses: ['emp', 'ice', 'explosion'], counterTags: ['飞行', '高速'],
      description: '高速飞行，电磁/冰冻可制'
    },

    // --- 潜水类 ---
    diver: {
      id: 'diver', name_cn: '潜水僵尸', name_en: 'Ducky Tube Zombie',
      hp: 400, speed: 1.2, difficulty: 3, category: ZOMBIE_CATEGORIES.AQUATIC,
      abilities: ['underwater'], weaknesses: ['explosion', 'area'], counterTags: ['潜水'],
      description: '在水池中潜行移动'
    },
    snorkel: {
      id: 'snorkel', name_cn: '浮潜僵尸', name_en: 'Snorkel Zombie',
      hp: 300, speed: 1.1, difficulty: 2, category: ZOMBIE_CATEGORIES.AQUATIC,
      abilities: ['underwater'], weaknesses: ['explosion'], counterTags: ['潜水'],
      description: '浅水潜行'
    },
    frogman: {
      id: 'frogman', name_cn: '蛙人僵尸', name_en: 'Frogman Zombie',
      hp: 650, speed: 1.4, difficulty: 5, category: ZOMBIE_CATEGORIES.AQUATIC,
      abilities: ['underwater', 'ambush'], weaknesses: ['explosion', 'ice'], counterTags: ['潜水', '突袭'],
      description: '潜水突袭，上岸后加速'
    },
    kraken: {
      id: 'kraken', name_cn: '海妖僵尸', name_en: 'Kraken Zombie',
      hp: 2400, speed: 0.7, difficulty: 8, category: ZOMBIE_CATEGORIES.AQUATIC,
      abilities: ['underwater', 'tentacle_grab'], weaknesses: ['explosion', 'fire', 'poison'], counterTags: ['潜水', '触手'],
      description: '触手抓取植物，多弱点'
    },

    // --- 护甲类 ---
    screen: {
      id: 'screen', name_cn: '纱窗僵尸', name_en: 'Screen Door Zombie',
      hp: 1100, speed: 0.9, difficulty: 4, category: ZOMBIE_CATEGORIES.ARMORED,
      abilities: ['block_projectile'], weaknesses: ['explosion', 'area'], counterTags: ['挡弹'],
      description: '纱窗抵挡子弹，爆炸/范围可破'
    },
    knight: {
      id: 'knight', name_cn: '骑士僵尸', name_en: 'Knight Zombie',
      hp: 1500, speed: 0.85, difficulty: 6, category: ZOMBIE_CATEGORIES.ARMORED,
      abilities: ['shield_block'], weaknesses: ['explosion', 'poison', 'fire'], counterTags: ['盾牌'],
      description: '盾牌格挡正面攻击'
    },
    bronze: {
      id: 'bronze', name_cn: '青铜僵尸', name_en: 'Bronze Zombie',
      hp: 1400, speed: 0.8, difficulty: 5, category: ZOMBIE_CATEGORIES.ARMORED,
      abilities: ['armor_bronze'], weaknesses: ['fire', 'explosion'], counterTags: ['护甲'],
      description: '青铜护甲，火焰可熔'
    },
    iron: {
      id: 'iron', name_cn: '铁甲僵尸', name_en: 'Iron Armor Zombie',
      hp: 2000, speed: 0.75, difficulty: 7, category: ZOMBIE_CATEGORIES.ARMORED,
      abilities: ['armor_iron'], weaknesses: ['explosion', 'poison', 'emp'], counterTags: ['重甲'],
      description: '铁甲防护，极难破除'
    },
    gold: {
      id: 'gold', name_cn: '黄金僵尸', name_en: 'Gold Zombie',
      hp: 2600, speed: 0.7, difficulty: 9, category: ZOMBIE_CATEGORIES.ARMORED,
      abilities: ['armor_gold', 'drop_treasure'], weaknesses: ['explosion', 'poison'], counterTags: ['重甲', '宝藏'],
      description: '黄金护甲，死亡掉落宝藏'
    },
    crystal: {
      id: 'crystal', name_cn: '水晶僵尸', name_en: 'Crystal Zombie',
      hp: 1800, speed: 0.8, difficulty: 8, category: ZOMBIE_CATEGORIES.ARMORED,
      abilities: ['reflect_projectile'], weaknesses: ['explosion', 'poison', 'area'], counterTags: ['反射'],
      description: '反射子弹，需范围/爆炸'
    },

    // --- 特殊类 ---
    newspaper: {
      id: 'newspaper', name_cn: '报纸僵尸', name_en: 'Newspaper Zombie',
      hp: 350, speed: 1.0, difficulty: 3, category: ZOMBIE_CATEGORIES.SPECIAL,
      abilities: ['rage_on_break'], rageSpeed: 2.5, rageHp: 200, weaknesses: ['ice', 'knockback'], counterTags: ['狂暴'],
      description: '报纸被打破后狂暴加速'
    },
    dancer: {
      id: 'dancer', name_cn: '舞王僵尸', name_en: 'Dancing Zombie',
      hp: 800, speed: 1.3, difficulty: 5, category: ZOMBIE_CATEGORIES.SPECIAL,
      abilities: ['summon_backup'], weaknesses: ['area', 'ranged'], counterTags: ['召唤'],
      description: '召唤伴舞僵尸'
    },
    backup: {
      id: 'backup', name_cn: '伴舞僵尸', name_en: 'Backup Dancer',
      hp: 270, speed: 1.4, difficulty: 1, category: ZOMBIE_CATEGORIES.SUMMON,
      abilities: [], weaknesses: ['area'], counterTags: [],
      description: '被舞王召唤'
    },
    yeti: {
      id: 'yeti', name_cn: '雪人僵尸', name_en: 'Yeti',
      hp: 2000, speed: 0.7, difficulty: 6, category: ZOMBIE_CATEGORIES.SPECIAL,
      abilities: ['flee', 'drop_diamond'], weaknesses: ['fire', 'ranged'], counterTags: ['稀有', '逃跑'],
      description: '稀有僵尸，逃跑时掉落钻石'
    },
    ladder: {
      id: 'ladder', name_cn: '梯子僵尸', name_en: 'Ladder Zombie',
      hp: 800, speed: 1.1, difficulty: 4, category: ZOMBIE_CATEGORIES.SPECIAL,
      abilities: ['ladder_vault'], weaknesses: ['explosion', 'knockback'], counterTags: ['搭梯'],
      description: '搭梯子越过坚果'
    },
    catapult: {
      id: 'catapult', name_cn: '投石车僵尸', name_en: 'Catapult Zombie',
      hp: 1200, speed: 0.6, difficulty: 6, category: ZOMBIE_CATEGORIES.SPECIAL,
      abilities: ['ranged_attack'], weaknesses: ['ranged', 'explosion'], counterTags: ['远程'],
      description: '远程投掷篮球'
    },
    miner: {
      id: 'miner', name_cn: '矿工僵尸', name_en: 'Digger Zombie',
      hp: 400, speed: 1.3, difficulty: 5, category: ZOMBIE_CATEGORIES.SPECIAL,
      abilities: ['dig'], weaknesses: ['explosion', 'area'], counterTags: ['挖洞'],
      description: '从地下挖掘到最左侧'
    },
    zamboni: {
      id: 'zamboni', name_cn: '冰车僵尸', name_en: 'Zomboni',
      hp: 1500, speed: 0.8, difficulty: 6, category: ZOMBIE_CATEGORIES.SPECIAL,
      abilities: ['freeze_trail', 'crush'], weaknesses: ['fire', 'explosion'], counterTags: ['冰冻', '碾压'],
      description: '留下冰道，碾压植物'
    },
    jack_in_box: {
      id: 'jack_in_box', name_cn: '玩偶匣僵尸', name_en: 'Jack-in-the-Box Zombie',
      hp: 500, speed: 1.2, difficulty: 4, category: ZOMBIE_CATEGORIES.SPECIAL,
      abilities: ['explode'], weaknesses: ['ice', 'ranged'], counterTags: ['自爆'],
      description: '匣子爆炸造成范围伤害'
    },
    chicken_wrangler: {
      id: 'chicken_wrangler', name_cn: '养鸡人僵尸', name_en: 'Chicken Wrangler Zombie',
      hp: 600, speed: 1.0, difficulty: 5, category: ZOMBIE_CATEGORIES.SPECIAL,
      abilities: ['release_chickens'], weaknesses: ['area', 'fire'], counterTags: ['释放'],
      description: '释放鸡群攻击植物'
    },
    ghost: {
      id: 'ghost', name_cn: '幽灵僵尸', name_en: 'Ghost Zombie',
      hp: 200, speed: 1.3, difficulty: 4, category: ZOMBIE_CATEGORIES.SPECIAL,
      abilities: ['phase'], weaknesses: ['light', 'reveal'], counterTags: ['穿透'],
      description: '穿透植物，光照可显形'
    },
    treasure_hunter: {
      id: 'treasure_hunter', name_cn: '宝藏猎人僵尸', name_en: 'Treasure Hunter Zombie',
      hp: 550, speed: 1.1, difficulty: 5, category: ZOMBIE_CATEGORIES.SPECIAL,
      abilities: ['dig', 'drop_treasure'], weaknesses: ['explosion', 'ice'], counterTags: ['挖洞', '宝藏'],
      description: '挖掘地道绕过防线'
    },
    wizard: {
      id: 'wizard', name_cn: '巫师僵尸', name_en: 'Wizard Zombie',
      hp: 700, speed: 0.9, difficulty: 6, category: ZOMBIE_CATEGORIES.SPECIAL,
      abilities: ['transform_sheep'], weaknesses: ['light', 'ranged'], counterTags: ['变形'],
      description: '将植物变成绵羊'
    },
    octo: {
      id: 'octo', name_cn: '章鱼僵尸', name_en: 'Octo Zombie',
      hp: 800, speed: 0.7, difficulty: 6, category: ZOMBIE_CATEGORIES.SPECIAL,
      abilities: ['bind'], weaknesses: ['fire', 'explosion'], counterTags: ['束缚'],
      description: '投掷章鱼束缚植物'
    },
    smurf: {
      id: 'smurf', name_cn: '蓝精灵僵尸', name_en: 'Smurf Zombie',
      hp: 300, speed: 1.4, difficulty: 3, category: ZOMBIE_CATEGORIES.SPECIAL,
      abilities: ['ride'], weaknesses: ['knockback', 'area'], counterTags: ['骑乘'],
      description: '骑在其他僵尸头上'
    },
    imp: {
      id: 'imp', name_cn: '小鬼僵尸', name_en: 'Imp',
      hp: 150, speed: 2.0, difficulty: 2, category: ZOMBIE_CATEGORIES.SUMMON,
      abilities: [], weaknesses: ['area', 'ranged'], counterTags: [],
      description: '被巨人投掷的小型僵尸'
    },
    chicken: {
      id: 'chicken', name_cn: '鸡僵尸', name_en: 'Chicken Zombie',
      hp: 120, speed: 2.2, difficulty: 1, category: ZOMBIE_CATEGORIES.SUMMON,
      abilities: [], weaknesses: ['area', 'fire'], counterTags: [],
      description: '被养鸡人释放，极速'
    },
    sheep: {
      id: 'sheep', name_cn: '绵羊', name_en: 'Sheep',
      hp: 100, speed: 0, difficulty: 1, category: ZOMBIE_CATEGORIES.SUMMON,
      abilities: ['passive'], weaknesses: [], counterTags: [],
      description: '被巫师变形的植物，无攻击力'
    },
    ice_block: {
      id: 'ice_block', name_cn: '冰块僵尸', name_en: 'Ice Block Zombie',
      hp: 1200, speed: 0.7, difficulty: 5, category: ZOMBIE_CATEGORIES.SPECIAL,
      abilities: ['armor_ice'], weaknesses: ['fire', 'explosion'], counterTags: ['冰甲'],
      description: '冰块护甲，火焰可融'
    },

    // --- 精英耦合类 (强大但有明显弱点) ---
    berserker: {
      id: 'berserker', name_cn: '狂战士僵尸', name_en: 'Berserker Zombie',
      hp: 1800, speed: 1.5, difficulty: 8, category: ZOMBIE_CATEGORIES.ELITE,
      abilities: ['rage_on_damage', 'speed_up'], weaknesses: ['ice', 'knockback', 'poison'], counterTags: ['狂暴', '高速'],
      description: '受伤后狂暴加速+增伤，冰冻/击退可制'
    },
    necromancer: {
      id: 'necromancer', name_cn: '死灵法师', name_en: 'Necromancer Zombie',
      hp: 1500, speed: 0.9, difficulty: 9, category: ZOMBIE_CATEGORIES.ELITE,
      abilities: ['summon_undead', 'curse'], weaknesses: ['light', 'ranged', 'area'], counterTags: ['召唤', '诅咒'],
      description: '召唤亡灵+诅咒植物，光照可破'
    },
    phoenix: {
      id: 'phoenix', name_cn: '凤凰僵尸', name_en: 'Phoenix Zombie',
      hp: 1600, speed: 1.3, difficulty: 9, category: ZOMBIE_CATEGORIES.ELITE,
      abilities: ['rebirth', 'burn_aura'], weaknesses: ['ice', 'poison'], counterTags: ['重生', '灼烧'],
      description: '死亡后重生一次，冰冻可禁'
    },
    titan: {
      id: 'titan', name_cn: '泰坦僵尸', name_en: 'Titan Zombie',
      hp: 3500, speed: 0.6, difficulty: 10, category: ZOMBIE_CATEGORIES.ELITE,
      abilities: ['smash', 'armor_heavy'], weaknesses: ['poison', 'explosion', 'debuff'], counterTags: ['巨体', '重甲'],
      description: '巨型+重甲+砸击，毒素/爆炸可克'
    },
    illusionist: {
      id: 'illusionist', name_cn: '幻术师', name_en: 'Illusionist Zombie',
      hp: 1200, speed: 1.1, difficulty: 8, category: ZOMBIE_CATEGORIES.ELITE,
      abilities: ['clone', 'confuse'], weaknesses: ['reveal', 'area', 'light'], counterTags: ['分身', '混乱'],
      description: '制造分身+混乱植物，显形/范围可克'
    },
    venom_spitter: {
      id: 'venom_spitter', name_cn: '毒液僵尸', name_en: 'Venom Spitter Zombie',
      hp: 1100, speed: 0.9, difficulty: 7, category: ZOMBIE_CATEGORIES.ELITE,
      abilities: ['ranged_attack', 'poison'], weaknesses: ['fire', 'explosion'], counterTags: ['远程', '毒素'],
      description: '远程毒液攻击，火焰可克'
    },
    stone_golem: {
      id: 'stone_golem', name_cn: '石像僵尸', name_en: 'Stone Golem Zombie',
      hp: 3000, speed: 0.5, difficulty: 8, category: ZOMBIE_CATEGORIES.ELITE,
      abilities: ['armor_stone', 'crush'], weaknesses: ['explosion', 'poison', 'ice'], counterTags: ['石甲', '碾压'],
      description: '石甲+碾压，爆炸/毒素可克'
    },
    vampire: {
      id: 'vampire', name_cn: '吸血鬼僵尸', name_en: 'Vampire Zombie',
      hp: 1400, speed: 1.6, difficulty: 9, category: ZOMBIE_CATEGORIES.ELITE,
      abilities: ['lifesteal', 'fast'], weaknesses: ['light', 'fire', 'poison'], counterTags: ['吸血', '高速'],
      description: '攻击回血+高速，光照/火焰可克'
    },
    mecha: {
      id: 'mecha', name_cn: '机械僵尸', name_en: 'Mecha Zombie',
      hp: 2800, speed: 0.8, difficulty: 10, category: ZOMBIE_CATEGORIES.ELITE,
      abilities: ['shield', 'laser'], weaknesses: ['emp', 'ice', 'poison'], counterTags: ['护盾', '激光'],
      description: '能量护盾+激光，电磁/冰冻可克'
    },
    shadow: {
      id: 'shadow', name_cn: '暗影僵尸', name_en: 'Shadow Zombie',
      hp: 1000, speed: 1.7, difficulty: 8, category: ZOMBIE_CATEGORIES.ELITE,
      abilities: ['stealth', 'backstab'], weaknesses: ['reveal', 'light', 'area'], counterTags: ['潜行', '背刺'],
      description: '潜行+背刺高伤，显形/光照可克'
    }
  },

  // ==================== Boss类 ====================
  bosses: {
    gargantuar: {
      id: 'gargantuar', name_cn: '巨人僵尸', name_en: 'Gargantuar',
      hp: 3000, speed: 0.5, difficulty: 20, category: ZOMBIE_CATEGORIES.BOSS,
      abilities: ['smash', 'throw_imp'], weaknesses: ['poison', 'explosion'], counterTags: ['Boss', '投掷'],
      phases: [
        { id: 'idle', name_cn: '待机', threshold: 1.0, description: '缓慢前进' },
        { id: 'smash', name_cn: '砸击', threshold: 0.8, description: '3x3范围砸击' },
        { id: 'throw', name_cn: '投掷', threshold: 0.5, description: '投掷小鬼僵尸' },
        { id: 'rage', name_cn: '狂暴', threshold: 0.2, description: '加速狂暴' }
      ]
    },
    frost_giant: {
      id: 'frost_giant', name_cn: '冰霜巨人', name_en: 'Frost Giant',
      hp: 5000, speed: 0.5, difficulty: 25, category: ZOMBIE_CATEGORIES.BOSS,
      abilities: ['freeze_aura', 'smash', 'ice_breath'], weaknesses: ['fire', 'explosion'], counterTags: ['Boss', '冰冻'],
      phases: [
        { id: 'idle', name_cn: '待机', threshold: 1.0, description: '缓慢前进' },
        { id: 'jump_freeze', name_cn: '跳跃冰冻', threshold: 0.8, description: '跳跃落地冰冻周围植物' },
        { id: 'advance', name_cn: '推进', threshold: 0.6, description: '加速前进' },
        { id: 'ice_breath', name_cn: '冰息', threshold: 0.4, description: '冰息冻结一行' },
        { id: 'full_freeze', name_cn: '全屏冰冻', threshold: 0.2, description: '全屏冰冻攻击' }
      ]
    },
    zombot: {
      id: 'zombot', name_cn: '僵尸机器人', name_en: 'Zombot',
      hp: 8000, speed: 0.4, difficulty: 35, category: ZOMBIE_CATEGORIES.BOSS,
      abilities: ['laser', 'summon', 'missile'], weaknesses: ['emp', 'fire', 'explosion'], counterTags: ['Boss', '机械'],
      phases: [
        { id: 'idle', name_cn: '待机', threshold: 1.0, description: '缓慢前进' },
        { id: 'laser', name_cn: '激光', threshold: 0.8, description: '激光扫射一行' },
        { id: 'summon', name_cn: '召唤', threshold: 0.6, description: '召唤机械僵尸' },
        { id: 'missile', name_cn: '导弹', threshold: 0.4, description: '导弹轰炸全场' },
        { id: 'overload', name_cn: '过载', threshold: 0.2, description: '全屏激光过载' }
      ]
    },
    edgar_ii: {
      id: 'edgar_ii', name_cn: '埃德加二世', name_en: 'Edgar II',
      hp: 15000, speed: 0.3, difficulty: 40, category: ZOMBIE_CATEGORIES.BOSS,
      abilities: ['jam', 'summon_elite', 'dance', 'final'], weaknesses: ['emp', 'fire', 'poison'], counterTags: ['Boss', '终极'],
      phases: [
        { id: 'idle', name_cn: '待机', threshold: 1.0, description: '缓慢前进' },
        { id: 'jam', name_cn: '干扰', threshold: 0.8, description: '释放干扰波影响植物攻速' },
        { id: 'summon_elite', name_cn: '召唤精英', threshold: 0.6, description: '召唤精英僵尸' },
        { id: 'dance', name_cn: '舞动', threshold: 0.4, description: '召唤伴舞僵尸群' },
        { id: 'final', name_cn: '终极', threshold: 0.1, description: '全屏终极攻击' }
      ]
    },
    dragon_lord: {
      id: 'dragon_lord', name_cn: '龙领主', name_en: 'Dragon Lord',
      hp: 20000, speed: 0.5, difficulty: 50, category: ZOMBIE_CATEGORIES.BOSS,
      abilities: ['flying', 'fire_breath', 'summon', 'tail_sweep'], weaknesses: ['ice', 'emp', 'poison'], counterTags: ['Boss', '飞行', '火焰'],
      phases: [
        { id: 'idle', name_cn: '待机', threshold: 1.0, description: '飞行前进' },
        { id: 'fire_breath', name_cn: '龙息', threshold: 0.8, description: '火焰扫射三行' },
        { id: 'summon', name_cn: '召唤', threshold: 0.6, description: '召唤凤凰僵尸' },
        { id: 'tail_sweep', name_cn: '尾扫', threshold: 0.4, description: '尾扫全场植物' },
        { id: 'inferno', name_cn: '地狱火', threshold: 0.2, description: '全屏地狱火' }
      ]
    }
  },

  // 精英/BOSS 倍率
  eliteMultiplier: { hp: 1.5, speed: 1.3 },
  bossMultiplier: { hp: 3, speed: 1.5 },

  // 楼层 HP 缩放（每层递增）
  hpScaling: {
    baseMultiplier: 1.0,
    perFloorIncrease: 0.12,    // 每层 +12% HP
    maxFloorMultiplier: 3.0    // 上限 3 倍（约第 17 层达到上限）
  },

  // 出怪预算系统
  spawnSystem: {
    tickInterval: 3,           // 每 3 秒补充一次预算
    baseBudgetPerFloor: 2.5,   // 第 1 层基础预算/每 tick
    floorBudgetGrowth: 0.55,   // 每层预算增长
    // 关卡内进度阶梯式递增（陡峭）
    progressSteps: [
      { progress: 0.0, multiplier: 1.0 },
      { progress: 0.2, multiplier: 1.4 },
      { progress: 0.4, multiplier: 1.9 },
      { progress: 0.6, multiplier: 2.6 },
      { progress: 0.8, multiplier: 3.5 },
      { progress: 1.0, multiplier: 4.5 }
    ],
    maxBudgetMultiplier: 4.5,
    waveBudgetMultiplier: 5.0, // 波次瞬间给 5 倍预算
    spawnChancePerTick: 0.75,  // 每个 tick 75% 概率出怪（若预算允许）
    earlyFloorProtection: {
      maxFloor: 3,             // 前 3 层保护
      budgetMultiplier: 0.55   // 预算降至 55%
    }
  },

  // 出怪池配置（按楼层解锁）
  spawnPools: {
    // 第 1-2 层：仅基础
    floor_1_2: ['normal', 'flag', 'cone'],
    // 第 3-4 层：+速度+护甲
    floor_3_4: ['normal', 'flag', 'cone', 'bucket', 'brick', 'pole', 'newspaper', 'snorkel'],
    // 第 5-6 层：+飞行+特殊
    floor_5_6: ['normal', 'cone', 'bucket', 'brick', 'cone_bronze', 'pole', 'pogo', 'sprinter',
                'balloon', 'bungee', 'diver', 'screen', 'newspaper', 'dancer', 'ladder', 'jack_in_box', 'ghost', 'smurf', 'ice_block'],
    // 第 7-8 层：+精英护甲+更多特殊
    floor_7_8: ['normal', 'cone', 'bucket', 'brick', 'cone_bronze', 'bucket_iron', 'bronze', 'iron',
                'football', 'cheetah', 'all_star', 'ricochet', 'lightning',
                'balloon', 'parrot', 'drone', 'bat', 'jetpack', 'frogman', 'kraken',
                'screen', 'knight', 'crystal', 'yeti', 'catapult', 'miner', 'zamboni',
                'chicken_wrangler', 'treasure_hunter', 'wizard', 'octo', 'venom_spitter', 'stone_golem'],
    // 第 9-10 层：+精英耦合类
    floor_9_10: ['normal', 'cone', 'bucket', 'bucket_iron', 'iron', 'gold', 'crystal',
                 'football', 'all_star', 'cheetah', 'lightning', 'jetpack', 'kraken',
                 'knight', 'yeti', 'zamboni', 'wizard', 'octo',
                 'berserker', 'necromancer', 'phoenix', 'titan', 'illusionist', 'vampire', 'mecha', 'shadow'],
    // 第 11+ 层：全部
    floor_11_plus: ['normal', 'cone', 'bucket', 'brick', 'cone_bronze', 'bucket_iron', 'bronze', 'iron', 'gold', 'crystal',
                    'pole', 'pogo', 'ricochet', 'sprinter', 'cheetah', 'football', 'all_star', 'lightning',
                    'balloon', 'bungee', 'parrot', 'drone', 'bat', 'jetpack',
                    'diver', 'snorkel', 'frogman', 'kraken',
                    'screen', 'knight', 'crystal', 'newspaper', 'dancer', 'yeti', 'ladder', 'catapult',
                    'miner', 'zamboni', 'jack_in_box', 'chicken_wrangler', 'ghost', 'treasure_hunter',
                    'wizard', 'octo', 'smurf', 'ice_block',
                    'berserker', 'necromancer', 'phoenix', 'titan', 'illusionist', 'venom_spitter',
                    'stone_golem', 'vampire', 'mecha', 'shadow']
  },

  // Boss 出现楼层
  bossSchedule: {
    10: 'gargantuar',
    20: 'frost_giant',
    30: 'zombot',
    40: 'edgar_ii',
    50: 'dragon_lord'
  }
};
