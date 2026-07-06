/**
 * 预定义杂交植物配方数据系统
 *
 * 包含10种初始植物的两两杂交组合（C(10,2)=45对）：
 * - 10对杂交失败组合（限制规则，需玩家探索发现）
 * - 35对成功杂交配方（其中13对有稀有亚种）
 *
 * 设计原则：
 * - 杂交结果预定义，不再随机生成
 * - 杂交植物不能再二次杂交（is_hybrid: true）
 * - 保留变异效果（由杂交引擎在配方基础上叠加）
 * - 平衡性：杂交植物不过于超模
 * - 多样性：每对都有独特效果
 * - 创意：结合两种父本植物的特性
 *
 * 配方键名规则：父本id按字母序排序后用下划线连接
 * 视觉标识规则：visual.shape = 'hybrid_<父本1简称>_<父本2简称>'
 *
 * 父本简称对照：
 *   peashooter→pea  sunflower→sun  wall_nut→nut  cherry_bomb→cherry
 *   potato_mine→mine  snow_pea→snow  repeater→repeat  chomper→chomp
 *   threepeater→three  sun_shroom→shroom
 */
export default {
  // === 元数据 ===
  meta: {
    version: '1.0',
    description: '预定义杂交植物配方系统 - 10种初始植物的两两杂交组合',
    basePlants: [
      'peashooter', 'sunflower', 'wall_nut', 'cherry_bomb', 'potato_mine',
      'snow_pea', 'repeater', 'chomper', 'threepeater', 'sun_shroom'
    ],
    totalPairs: 45,
    failureCount: 10,
    successCount: 35,
    rareCount: 13,
    rareProbabilityRange: [0.10, 0.20]
  },

  // === 失败组合（10对）===
  // 玩家尝试这些组合时会返回"杂交失败"，原因需探索发现
  failures: [
    'cherry_bomb_potato_mine',
    'cherry_bomb_repeater',
    'cherry_bomb_snow_pea',
    'cherry_bomb_sun_shroom',
    'cherry_bomb_sunflower',
    'cherry_bomb_threepeater',
    'cherry_bomb_wall_nut',
    'potato_mine_sun_shroom',
    'potato_mine_sunflower',
    'potato_mine_wall_nut'
  ],

  // === 失败原因（玩家探索后发现）===
  failureReasons: {
    cherry_bomb_potato_mine: '爆炸类基因冲突：双重爆炸物质相互排斥，融合时会发生不可控的连锁爆炸',
    cherry_bomb_repeater: '爆炸与连发机制冲突：连发结构无法承受爆炸能量的反复冲击',
    cherry_bomb_snow_pea: '冰火相克：寒冰基因会熄灭樱桃的火药引信，导致无法引爆',
    cherry_bomb_sun_shroom: '能量焚毁：爆炸高温会瞬间焚毁阳光菇的光合菌盖组织',
    cherry_bomb_sunflower: '能量焚毁：爆炸高温会瞬间焚毁向日葵的光合花瓣组织',
    cherry_bomb_threepeater: '爆炸与三行机制冲突：三行能量通道无法稳定承载爆炸冲击',
    cherry_bomb_wall_nut: '外壳抑制引爆：坚果墙的坚硬外壳会封印樱桃的爆炸能量',
    potato_mine_sun_shroom: '机制冲突：地雷的引爆装置与阳光产出机制相互干扰',
    potato_mine_sunflower: '机制冲突：地雷的引爆装置与阳光产出机制相互干扰',
    potato_mine_wall_nut: '外壳封埋：坚果墙的厚重外壳会将土豆雷完全封埋，无法触发'
  },

  // === 成功配方（35对）===
  recipes: {

    // ========== 樱桃炸弹系（2对成功）==========

    cherry_bomb_chomper: {
      parents: ['cherry_bomb', 'chomper'],
      normal: {
        id: 'cherry_bomb_chomper',
        name_cn: '爆破大嘴花',
        name_en: 'Blast Chomper',
        gene_pool: 'explosive',
        category: 'attack_melee',
        is_hybrid: true,
        cost: 200,
        hp: 300,
        cooldown: 30,
        damage: 300,
        attack_speed: 30,
        range: 1,
        special: '吞噬僵尸后引发爆炸，对周围1格造成600伤害',
        explosion_damage: 600,
        explosion_range: 1,
        visual: { body: '#D32F2F', accent: '#4A148C', head: '#EF5350', shape: 'hybrid_cherry_chomp' }
      },
      rare: {
        id: 'doom_chomper',
        name_cn: '毁灭大嘴花',
        name_en: 'Doom Chomper',
        gene_pool: 'explosive',
        category: 'attack_melee',
        is_hybrid: true,
        probability: 0.12,
        cost: 275,
        hp: 300,
        cooldown: 30,
        damage: 300,
        attack_speed: 30,
        range: 1,
        special: '吞噬僵尸后引发3x3范围爆炸，造成1200伤害',
        explosion_damage: 1200,
        explosion_range: 3,
        visual: { body: '#B71C1C', accent: '#311B92', head: '#E53935', shape: 'hybrid_cherry_chomp' }
      }
    },

    cherry_bomb_peashooter: {
      parents: ['cherry_bomb', 'peashooter'],
      normal: {
        id: 'cherry_bomb_peashooter',
        name_cn: '豌豆炸弹',
        name_en: 'Pea Bomb',
        gene_pool: 'explosive',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 175,
        hp: 300,
        cooldown: 7.5,
        damage: 30,
        attack_speed: 1.5,
        range: 9,
        special: '发射爆炸豌豆，命中后小范围溅射伤害',
        splash_damage: 15,
        splash_range: 1,
        visual: { body: '#D32F2F', accent: '#2E7D32', head: '#EF5350', shape: 'hybrid_cherry_pea' }
      },
      rare: {
        id: 'burst_shooter',
        name_cn: '爆裂射手',
        name_en: 'Burst Shooter',
        gene_pool: 'explosive',
        category: 'attack_ranged',
        is_hybrid: true,
        probability: 0.15,
        cost: 225,
        hp: 300,
        cooldown: 7.5,
        damage: 35,
        attack_speed: 1.8,
        range: 9,
        special: '豌豆命中后引发3x3爆炸，造成30范围伤害',
        splash_damage: 30,
        splash_range: 3,
        visual: { body: '#B71C1C', accent: '#1B5E20', head: '#FF5252', shape: 'hybrid_cherry_pea' }
      }
    },

    // ========== 大嘴花系（8对成功）==========

    chomper_peashooter: {
      parents: ['chomper', 'peashooter'],
      normal: {
        id: 'chomper_peashooter',
        name_cn: '豌豆大嘴花',
        name_en: 'Pea Chomper',
        gene_pool: 'devour',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 200,
        hp: 300,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '远程发射豌豆，近战可吞噬僵尸（300伤害，消化30秒）',
        devour_damage: 300,
        devour_cooldown: 30,
        visual: { body: '#7E57C2', accent: '#2E7D32', head: '#9575CD', shape: 'hybrid_chomp_pea' }
      },
      rare: {
        id: 'spray_chomper',
        name_cn: '喷射大嘴花',
        name_en: 'Spray Chomper',
        gene_pool: 'devour',
        category: 'attack_ranged',
        is_hybrid: true,
        probability: 0.15,
        cost: 250,
        hp: 300,
        cooldown: 7.5,
        damage: 30,
        attack_speed: 1.2,
        range: 9,
        special: '吞噬僵尸后喷射毒液弹，造成穿透伤害',
        devour_damage: 300,
        devour_cooldown: 30,
        pierce: true,
        visual: { body: '#6A1B9A', accent: '#1B5E20', head: '#8E24AA', shape: 'hybrid_chomp_pea' }
      }
    },

    chomper_potato_mine: {
      parents: ['chomper', 'potato_mine'],
      normal: {
        id: 'chomper_potato_mine',
        name_cn: '陷阱大嘴花',
        name_en: 'Trap Chomper',
        gene_pool: 'devour',
        category: 'attack_melee',
        is_hybrid: true,
        cost: 125,
        hp: 300,
        cooldown: 30,
        damage: 300,
        attack_speed: 30,
        range: 1,
        special: '吞噬僵尸后原地埋设一颗地雷（1800伤害）',
        devour_damage: 300,
        devour_cooldown: 30,
        mine_damage: 1800,
        visual: { body: '#7E57C2', accent: '#FF9800', head: '#9575CD', shape: 'hybrid_chomp_mine' }
      }
    },

    chomper_repeater: {
      parents: ['chomper', 'repeater'],
      normal: {
        id: 'chomper_repeater',
        name_cn: '双发大嘴花',
        name_en: 'Twin Chomper',
        gene_pool: 'devour',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 250,
        hp: 300,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '远程双发豌豆，近战可吞噬僵尸（300伤害）',
        devour_damage: 300,
        devour_cooldown: 30,
        double_shot: true,
        visual: { body: '#7E57C2', accent: '#1B5E20', head: '#9575CD', shape: 'hybrid_chomp_repeat' }
      }
    },

    chomper_snow_pea: {
      parents: ['chomper', 'snow_pea'],
      normal: {
        id: 'chomper_snow_pea',
        name_cn: '冰冻大嘴花',
        name_en: 'Frost Chomper',
        gene_pool: 'devour',
        category: 'attack_melee',
        is_hybrid: true,
        cost: 200,
        hp: 300,
        cooldown: 7.5,
        damage: 300,
        attack_speed: 30,
        range: 1,
        special: '吞噬僵尸，未吞噬时吐出冰雾减速前方僵尸',
        devour_damage: 300,
        devour_cooldown: 30,
        slow_effect: true,
        slow_duration: 5,
        visual: { body: '#7E57C2', accent: '#42A5F5', head: '#9575CD', shape: 'hybrid_chomp_snow' }
      }
    },

    chomper_sun_shroom: {
      parents: ['chomper', 'sun_shroom'],
      normal: {
        id: 'chomper_sun_shroom',
        name_cn: '阳光大嘴花',
        name_en: 'Sun Chomper',
        gene_pool: 'devour',
        category: 'production',
        is_hybrid: true,
        cost: 125,
        hp: 300,
        cooldown: 7.5,
        damage: 300,
        attack_speed: 30,
        range: 1,
        special: '吞噬僵尸，同时产出25阳光（间隔30秒）',
        devour_damage: 300,
        devour_cooldown: 30,
        sun_production: 25,
        sun_interval: 30,
        is_night: true,
        visual: { body: '#7E57C2', accent: '#FFC107', head: '#9575CD', shape: 'hybrid_chomp_shroom' }
      },
      rare: {
        id: 'photosynthesis_chomper',
        name_cn: '光合吞噬者',
        name_en: 'Photo Chomper',
        gene_pool: 'devour',
        category: 'production',
        is_hybrid: true,
        probability: 0.15,
        cost: 175,
        hp: 300,
        cooldown: 7.5,
        damage: 300,
        attack_speed: 30,
        range: 1,
        special: '吞噬僵尸后额外产出50阳光',
        devour_damage: 300,
        devour_cooldown: 30,
        sun_production: 25,
        sun_interval: 30,
        devour_sun_bonus: 50,
        is_night: true,
        visual: { body: '#6A1B9A', accent: '#FF8F00', head: '#8E24AA', shape: 'hybrid_chomp_shroom' }
      }
    },

    chomper_sunflower: {
      parents: ['chomper', 'sunflower'],
      normal: {
        id: 'chomper_sunflower',
        name_cn: '向日葵大嘴花',
        name_en: 'Sunflower Chomper',
        gene_pool: 'devour',
        category: 'production',
        is_hybrid: true,
        cost: 150,
        hp: 300,
        cooldown: 7.5,
        damage: 300,
        attack_speed: 30,
        range: 1,
        special: '吞噬僵尸，同时产出25阳光（间隔30秒）',
        devour_damage: 300,
        devour_cooldown: 30,
        sun_production: 25,
        sun_interval: 30,
        visual: { body: '#7E57C2', accent: '#FFD700', head: '#9575CD', shape: 'hybrid_chomp_sun' }
      },
      rare: {
        id: 'photosynthesis_devourer',
        name_cn: '光合大嘴花',
        name_en: 'Photo Devourer',
        gene_pool: 'devour',
        category: 'production',
        is_hybrid: true,
        probability: 0.15,
        cost: 200,
        hp: 300,
        cooldown: 7.5,
        damage: 300,
        attack_speed: 30,
        range: 1,
        special: '吞噬僵尸后额外产出75阳光',
        devour_damage: 300,
        devour_cooldown: 30,
        sun_production: 25,
        sun_interval: 30,
        devour_sun_bonus: 75,
        visual: { body: '#6A1B9A', accent: '#FF8F00', head: '#8E24AA', shape: 'hybrid_chomp_sun' }
      }
    },

    chomper_threepeater: {
      parents: ['chomper', 'threepeater'],
      normal: {
        id: 'chomper_threepeater',
        name_cn: '三线大嘴花',
        name_en: 'Triple Chomper',
        gene_pool: 'devour',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 300,
        hp: 300,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '三行发射豌豆，近战可吞噬僵尸（300伤害）',
        devour_damage: 300,
        devour_cooldown: 30,
        multi_row: 3,
        visual: { body: '#7E57C2', accent: '#388E3C', head: '#9575CD', shape: 'hybrid_chomp_three' }
      }
    },

    chomper_wall_nut: {
      parents: ['chomper', 'wall_nut'],
      normal: {
        id: 'chomper_wall_nut',
        name_cn: '防御大嘴花',
        name_en: 'Defensive Chomper',
        gene_pool: 'devour',
        category: 'defense',
        is_hybrid: true,
        cost: 200,
        hp: 2000,
        cooldown: 30,
        damage: 300,
        attack_speed: 30,
        range: 1,
        special: '高耐久吞噬，消化期间提供坚固防御',
        devour_damage: 300,
        devour_cooldown: 30,
        visual: { body: '#7E57C2', accent: '#8D6E63', head: '#9575CD', shape: 'hybrid_chomp_nut' }
      },
      rare: {
        id: 'iron_chomper',
        name_cn: '铁壁大嘴花',
        name_en: 'Iron Chomper',
        gene_pool: 'devour',
        category: 'defense',
        is_hybrid: true,
        probability: 0.12,
        cost: 275,
        hp: 3000,
        cooldown: 30,
        damage: 300,
        attack_speed: 30,
        range: 1,
        special: '超高耐久，消化时反弹近战伤害',
        devour_damage: 300,
        devour_cooldown: 30,
        reflect_damage: true,
        visual: { body: '#6A1B9A', accent: '#5D4037', head: '#8E24AA', shape: 'hybrid_chomp_nut' }
      }
    },

    // ========== 豌豆射手系（7对成功）==========

    peashooter_potato_mine: {
      parents: ['peashooter', 'potato_mine'],
      normal: {
        id: 'peashooter_potato_mine',
        name_cn: '豌豆地雷',
        name_en: 'Pea Mine',
        gene_pool: 'pea',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 100,
        hp: 300,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '发射豌豆，被啃食时自爆造成1800伤害',
        explosion_damage: 1800,
        explosion_range: 1,
        visual: { body: '#4CAF50', accent: '#FF9800', head: '#66BB6A', shape: 'hybrid_pea_mine' }
      }
    },

    peashooter_repeater: {
      parents: ['peashooter', 'repeater'],
      normal: {
        id: 'peashooter_repeater',
        name_cn: '三连射手',
        name_en: 'Triple Pea',
        gene_pool: 'pea',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 250,
        hp: 300,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.0,
        range: 9,
        special: '三连发豌豆，攻速更快',
        triple_shot: true,
        visual: { body: '#2E7D32', accent: '#1B5E20', head: '#388E3C', shape: 'hybrid_pea_repeat' }
      }
    },

    peashooter_snow_pea: {
      parents: ['peashooter', 'snow_pea'],
      normal: {
        id: 'peashooter_snow_pea',
        name_cn: '霜冻豌豆',
        name_en: 'Frost Pea',
        gene_pool: 'ice',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 200,
        hp: 300,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '发射冰冻豌豆，减速命中僵尸',
        slow_effect: true,
        slow_duration: 5,
        visual: { body: '#4CAF50', accent: '#42A5F5', head: '#66BB6A', shape: 'hybrid_pea_snow' }
      },
      rare: {
        id: 'blizzard_shooter',
        name_cn: '极寒射手',
        name_en: 'Blizzard Shooter',
        gene_pool: 'ice',
        category: 'attack_ranged',
        is_hybrid: true,
        probability: 0.15,
        cost: 275,
        hp: 300,
        cooldown: 7.5,
        damage: 25,
        attack_speed: 1.5,
        range: 9,
        special: '冰冻豌豆有20%概率冻结僵尸3秒',
        slow_effect: true,
        slow_duration: 5,
        freeze_chance: 0.20,
        freeze_duration: 3,
        visual: { body: '#388E3C', accent: '#1976D2', head: '#4DD0E1', shape: 'hybrid_pea_snow' }
      }
    },

    peashooter_sun_shroom: {
      parents: ['peashooter', 'sun_shroom'],
      normal: {
        id: 'peashooter_sun_shroom',
        name_cn: '豌豆阳光菇',
        name_en: 'Pea Sun-shroom',
        gene_pool: 'pea',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 100,
        hp: 250,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '发射豌豆，同时产出25阳光（间隔30秒）',
        sun_production: 25,
        sun_interval: 30,
        is_night: true,
        visual: { body: '#4CAF50', accent: '#FFC107', head: '#66BB6A', shape: 'hybrid_pea_shroom' }
      },
      rare: {
        id: 'night_shooter',
        name_cn: '夜光射手',
        name_en: 'Night Shooter',
        gene_pool: 'pea',
        category: 'attack_ranged',
        is_hybrid: true,
        probability: 0.15,
        cost: 150,
        hp: 250,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '夜间伤害翻倍，同时产出25阳光',
        sun_production: 25,
        sun_interval: 30,
        is_night: true,
        night_damage_bonus: 2.0,
        visual: { body: '#2E7D32', accent: '#FF8F00', head: '#388E3C', shape: 'hybrid_pea_shroom' }
      }
    },

    peashooter_sunflower: {
      parents: ['peashooter', 'sunflower'],
      normal: {
        id: 'peashooter_sunflower',
        name_cn: '豌豆向日葵',
        name_en: 'Pea Sunflower',
        gene_pool: 'pea',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 125,
        hp: 250,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '发射豌豆，同时产出25阳光（间隔25秒）',
        sun_production: 25,
        sun_interval: 25,
        visual: { body: '#8BC34A', accent: '#FFD700', head: '#AED581', shape: 'hybrid_pea_sun' }
      },
      rare: {
        id: 'sun_shooter',
        name_cn: '阳光射手',
        name_en: 'Sun Shooter',
        gene_pool: 'pea',
        category: 'attack_ranged',
        is_hybrid: true,
        probability: 0.15,
        cost: 175,
        hp: 250,
        cooldown: 7.5,
        damage: 10,
        attack_speed: 2,
        range: 9,
        special: '发射阳光子弹，命中僵尸掉落10阳光',
        sun_bullet: true,
        sun_drop: 10,
        visual: { body: '#FFD700', accent: '#FF8F00', head: '#FFEB3B', shape: 'hybrid_pea_sun' }
      }
    },

    peashooter_threepeater: {
      parents: ['peashooter', 'threepeater'],
      normal: {
        id: 'peashooter_threepeater',
        name_cn: '双行射手',
        name_en: 'Dual Pea',
        gene_pool: 'pea',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 250,
        hp: 300,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '同时向上下相邻两行发射豌豆',
        multi_row: 2,
        visual: { body: '#4CAF50', accent: '#388E3C', head: '#66BB6A', shape: 'hybrid_pea_three' }
      }
    },

    peashooter_wall_nut: {
      parents: ['peashooter', 'wall_nut'],
      normal: {
        id: 'peashooter_wall_nut',
        name_cn: '坚果射手',
        name_en: 'Nut Shooter',
        gene_pool: 'pea',
        category: 'defense',
        is_hybrid: true,
        cost: 150,
        hp: 1500,
        cooldown: 30,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '高耐久，同时发射豌豆',
        visual: { body: '#4CAF50', accent: '#8D6E63', head: '#66BB6A', shape: 'hybrid_pea_nut' }
      },
      rare: {
        id: 'iron_shooter',
        name_cn: '铁壁射手',
        name_en: 'Iron Shooter',
        gene_pool: 'pea',
        category: 'defense',
        is_hybrid: true,
        probability: 0.12,
        cost: 200,
        hp: 2500,
        cooldown: 30,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '超高耐久，被攻击时有概率反击豌豆',
        counter_attack: true,
        counter_chance: 0.25,
        visual: { body: '#2E7D32', accent: '#5D4037', head: '#388E3C', shape: 'hybrid_pea_nut' }
      }
    },

    // ========== 土豆雷系（3对成功）==========

    potato_mine_repeater: {
      parents: ['potato_mine', 'repeater'],
      normal: {
        id: 'potato_mine_repeater',
        name_cn: '连发地雷',
        name_en: 'Repeater Mine',
        gene_pool: 'explosive',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 125,
        hp: 300,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '双发豌豆，被啃食时自爆造成1800伤害',
        double_shot: true,
        explosion_damage: 1800,
        explosion_range: 1,
        visual: { body: '#FF9800', accent: '#1B5E20', head: '#FFB74D', shape: 'hybrid_mine_repeat' }
      }
    },

    potato_mine_snow_pea: {
      parents: ['potato_mine', 'snow_pea'],
      normal: {
        id: 'potato_mine_snow_pea',
        name_cn: '冰冻地雷',
        name_en: 'Frost Mine',
        gene_pool: 'explosive',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 100,
        hp: 300,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '发射冰冻豌豆，被啃食时爆炸并冰冻周围僵尸',
        slow_effect: true,
        slow_duration: 5,
        explosion_damage: 1800,
        explosion_range: 1,
        freeze_on_explode: true,
        visual: { body: '#FF9800', accent: '#42A5F5', head: '#FFB74D', shape: 'hybrid_mine_snow' }
      }
    },

    potato_mine_threepeater: {
      parents: ['potato_mine', 'threepeater'],
      normal: {
        id: 'potato_mine_threepeater',
        name_cn: '三线地雷',
        name_en: 'Triple Mine',
        gene_pool: 'explosive',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 175,
        hp: 300,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '三行发射豌豆，被啃食时自爆造成1800伤害',
        multi_row: 3,
        explosion_damage: 1800,
        explosion_range: 1,
        visual: { body: '#FF9800', accent: '#388E3C', head: '#FFB74D', shape: 'hybrid_mine_three' }
      }
    },

    // ========== 双发射手系（5对成功）==========

    repeater_snow_pea: {
      parents: ['repeater', 'snow_pea'],
      normal: {
        id: 'repeater_snow_pea',
        name_cn: '双发寒冰',
        name_en: 'Twin Frost',
        gene_pool: 'ice',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 250,
        hp: 300,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '双发冰冻豌豆，减速命中僵尸',
        double_shot: true,
        slow_effect: true,
        slow_duration: 5,
        visual: { body: '#2E7D32', accent: '#42A5F5', head: '#388E3C', shape: 'hybrid_repeat_snow' }
      }
    },

    repeater_sun_shroom: {
      parents: ['repeater', 'sun_shroom'],
      normal: {
        id: 'repeater_sun_shroom',
        name_cn: '双发阳光菇',
        name_en: 'Twin Sun-shroom',
        gene_pool: 'pea',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 150,
        hp: 250,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '双发豌豆，同时产出25阳光（间隔30秒）',
        double_shot: true,
        sun_production: 25,
        sun_interval: 30,
        is_night: true,
        visual: { body: '#2E7D32', accent: '#FFC107', head: '#388E3C', shape: 'hybrid_repeat_shroom' }
      }
    },

    repeater_sunflower: {
      parents: ['repeater', 'sunflower'],
      normal: {
        id: 'repeater_sunflower',
        name_cn: '双发向日葵',
        name_en: 'Twin Sunflower Pea',
        gene_pool: 'pea',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 175,
        hp: 250,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '双发豌豆，同时产出25阳光（间隔30秒）',
        double_shot: true,
        sun_production: 25,
        sun_interval: 30,
        visual: { body: '#2E7D32', accent: '#FFD700', head: '#388E3C', shape: 'hybrid_repeat_sun' }
      }
    },

    repeater_threepeater: {
      parents: ['repeater', 'threepeater'],
      normal: {
        id: 'repeater_threepeater',
        name_cn: '六线射手',
        name_en: 'Six Pea',
        gene_pool: 'pea',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 400,
        hp: 300,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '三行双发豌豆，覆盖面广',
        multi_row: 3,
        double_shot: true,
        visual: { body: '#1B5E20', accent: '#0D3B0F', head: '#2E7D32', shape: 'hybrid_repeat_three' }
      }
    },

    repeater_wall_nut: {
      parents: ['repeater', 'wall_nut'],
      normal: {
        id: 'repeater_wall_nut',
        name_cn: '坚果双发',
        name_en: 'Nut Repeater',
        gene_pool: 'pea',
        category: 'defense',
        is_hybrid: true,
        cost: 175,
        hp: 1500,
        cooldown: 30,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '高耐久，同时双发豌豆',
        double_shot: true,
        visual: { body: '#2E7D32', accent: '#8D6E63', head: '#388E3C', shape: 'hybrid_repeat_nut' }
      }
    },

    // ========== 寒冰射手系（4对成功）==========

    snow_pea_sun_shroom: {
      parents: ['snow_pea', 'sun_shroom'],
      normal: {
        id: 'snow_pea_sun_shroom',
        name_cn: '冰光阳光菇',
        name_en: 'Frost Sun-shroom',
        gene_pool: 'ice',
        category: 'production',
        is_hybrid: true,
        cost: 125,
        hp: 250,
        cooldown: 7.5,
        damage: 0,
        attack_speed: 24,
        range: 0,
        special: '产出25阳光，冰冻光环减速周围僵尸',
        sun_production: 25,
        sun_interval: 24,
        slow_aura: true,
        slow_aura_range: 1,
        is_night: true,
        visual: { body: '#42A5F5', accent: '#FFC107', head: '#64B5F6', shape: 'hybrid_snow_shroom' }
      }
    },

    snow_pea_sunflower: {
      parents: ['snow_pea', 'sunflower'],
      normal: {
        id: 'snow_pea_sunflower',
        name_cn: '冰光向日葵',
        name_en: 'Frost Sunflower',
        gene_pool: 'ice',
        category: 'production',
        is_hybrid: true,
        cost: 175,
        hp: 250,
        cooldown: 7.5,
        damage: 0,
        attack_speed: 24,
        range: 0,
        special: '产出25阳光，冰冻光环减速周围僵尸',
        sun_production: 25,
        sun_interval: 24,
        slow_aura: true,
        slow_aura_range: 1,
        visual: { body: '#42A5F5', accent: '#FFD700', head: '#64B5F6', shape: 'hybrid_snow_sun' }
      }
    },

    snow_pea_threepeater: {
      parents: ['snow_pea', 'threepeater'],
      normal: {
        id: 'snow_pea_threepeater',
        name_cn: '三线寒冰',
        name_en: 'Triple Frost',
        gene_pool: 'ice',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 350,
        hp: 300,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '三行冰冻豌豆，减速命中僵尸',
        multi_row: 3,
        slow_effect: true,
        slow_duration: 5,
        visual: { body: '#42A5F5', accent: '#388E3C', head: '#64B5F6', shape: 'hybrid_snow_three' }
      }
    },

    snow_pea_wall_nut: {
      parents: ['snow_pea', 'wall_nut'],
      normal: {
        id: 'snow_pea_wall_nut',
        name_cn: '冰冻坚果',
        name_en: 'Frost Nut',
        gene_pool: 'defense',
        category: 'defense',
        is_hybrid: true,
        cost: 150,
        hp: 3000,
        cooldown: 30,
        damage: 0,
        attack_speed: 0,
        range: 0,
        special: '高耐久，啃咬它的僵尸被减速',
        slow_on_bite: true,
        slow_duration: 5,
        visual: { body: '#42A5F5', accent: '#8D6E63', head: '#64B5F6', shape: 'hybrid_snow_nut' }
      },
      rare: {
        id: 'ice_fortress',
        name_cn: '寒冰堡垒',
        name_en: 'Ice Fortress',
        gene_pool: 'defense',
        category: 'defense',
        is_hybrid: true,
        probability: 0.12,
        cost: 200,
        hp: 4000,
        cooldown: 30,
        damage: 0,
        attack_speed: 0,
        range: 0,
        special: '超高耐久，冰冻光环减速周围1格僵尸',
        slow_aura: true,
        slow_aura_range: 1,
        slow_duration: 5,
        visual: { body: '#1976D2', accent: '#5D4037', head: '#42A5F5', shape: 'hybrid_snow_nut' }
      }
    },

    // ========== 阳光菇系（3对成功）==========

    sun_shroom_sunflower: {
      parents: ['sun_shroom', 'sunflower'],
      normal: {
        id: 'sun_shroom_sunflower',
        name_cn: '双胞向日葵',
        name_en: 'Twin Sun',
        gene_pool: 'photosynthesis',
        category: 'production',
        is_hybrid: true,
        cost: 75,
        hp: 200,
        cooldown: 7.5,
        damage: 0,
        attack_speed: 24,
        range: 0,
        special: '产出50阳光（间隔24秒），昼夜均可生产',
        sun_production: 50,
        sun_interval: 24,
        visual: { body: '#FFC107', accent: '#FFD700', head: '#FFD54F', shape: 'hybrid_shroom_sun' }
      },
      rare: {
        id: 'eternal_sunflower',
        name_cn: '永昼向日葵',
        name_en: 'Eternal Sunflower',
        gene_pool: 'photosynthesis',
        category: 'production',
        is_hybrid: true,
        probability: 0.15,
        cost: 125,
        hp: 200,
        cooldown: 7.5,
        damage: 0,
        attack_speed: 20,
        range: 0,
        special: '产出75阳光（间隔20秒），昼夜均可生产',
        sun_production: 75,
        sun_interval: 20,
        visual: { body: '#FF8F00', accent: '#FFD700', head: '#FFC107', shape: 'hybrid_shroom_sun' }
      }
    },

    sun_shroom_threepeater: {
      parents: ['sun_shroom', 'threepeater'],
      normal: {
        id: 'sun_shroom_threepeater',
        name_cn: '三线阳光菇',
        name_en: 'Triple Sun-shroom',
        gene_pool: 'pea',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 225,
        hp: 250,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '三行发射豌豆，同时产出25阳光（间隔30秒）',
        multi_row: 3,
        sun_production: 25,
        sun_interval: 30,
        is_night: true,
        visual: { body: '#FFC107', accent: '#388E3C', head: '#FFD54F', shape: 'hybrid_shroom_three' }
      }
    },

    sun_shroom_wall_nut: {
      parents: ['sun_shroom', 'wall_nut'],
      normal: {
        id: 'sun_shroom_wall_nut',
        name_cn: '坚果阳光菇',
        name_en: 'Nut Sun-shroom',
        gene_pool: 'defense',
        category: 'production',
        is_hybrid: true,
        cost: 75,
        hp: 2000,
        cooldown: 30,
        damage: 0,
        attack_speed: 24,
        range: 0,
        special: '高耐久，产出25阳光（间隔24秒）',
        sun_production: 25,
        sun_interval: 24,
        is_night: true,
        visual: { body: '#FFC107', accent: '#8D6E63', head: '#FFD54F', shape: 'hybrid_shroom_nut' }
      }
    },

    // ========== 向日葵系（2对成功）==========

    sunflower_threepeater: {
      parents: ['sunflower', 'threepeater'],
      normal: {
        id: 'sunflower_threepeater',
        name_cn: '三线向日葵',
        name_en: 'Triple Sunflower',
        gene_pool: 'pea',
        category: 'attack_ranged',
        is_hybrid: true,
        cost: 250,
        hp: 250,
        cooldown: 7.5,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '三行发射豌豆，同时产出25阳光（间隔30秒）',
        multi_row: 3,
        sun_production: 25,
        sun_interval: 30,
        visual: { body: '#FFD700', accent: '#388E3C', head: '#FFEB3B', shape: 'hybrid_sun_three' }
      }
    },

    sunflower_wall_nut: {
      parents: ['sunflower', 'wall_nut'],
      normal: {
        id: 'sunflower_wall_nut',
        name_cn: '坚果向日葵',
        name_en: 'Nut Sunflower',
        gene_pool: 'defense',
        category: 'production',
        is_hybrid: true,
        cost: 100,
        hp: 2000,
        cooldown: 30,
        damage: 0,
        attack_speed: 24,
        range: 0,
        special: '高耐久，产出25阳光（间隔24秒）',
        sun_production: 25,
        sun_interval: 24,
        visual: { body: '#FFD700', accent: '#8D6E63', head: '#FFEB3B', shape: 'hybrid_sun_nut' }
      },
      rare: {
        id: 'iron_sunflower',
        name_cn: '铁甲向日葵',
        name_en: 'Iron Sunflower',
        gene_pool: 'defense',
        category: 'production',
        is_hybrid: true,
        probability: 0.12,
        cost: 150,
        hp: 3000,
        cooldown: 30,
        damage: 0,
        attack_speed: 24,
        range: 0,
        special: '超高耐久，产出50阳光（间隔24秒）',
        sun_production: 50,
        sun_interval: 24,
        visual: { body: '#FF8F00', accent: '#5D4037', head: '#FFC107', shape: 'hybrid_sun_nut' }
      }
    },

    // ========== 三线射手系（1对成功）==========

    threepeater_wall_nut: {
      parents: ['threepeater', 'wall_nut'],
      normal: {
        id: 'threepeater_wall_nut',
        name_cn: '坚果三线',
        name_en: 'Nut Threepeater',
        gene_pool: 'pea',
        category: 'defense',
        is_hybrid: true,
        cost: 250,
        hp: 1500,
        cooldown: 30,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '高耐久，同时三行发射豌豆',
        multi_row: 3,
        visual: { body: '#388E3C', accent: '#8D6E63', head: '#4CAF50', shape: 'hybrid_three_nut' }
      }
    }
  }
};
