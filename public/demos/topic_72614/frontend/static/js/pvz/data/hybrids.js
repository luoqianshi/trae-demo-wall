export default {
  genePools: {
    pea: {
      id: 'pea',
      name_cn: '豌豆',
      name_en: 'Pea',
      description: '发射类攻击基因,以豌豆弹幕为核心',
      coreAttribute: 'ranged_attack',
      recessiveAttribute: 'attack_speed'
    },
    photosynthesis: {
      id: 'photosynthesis',
      name_cn: '光合作用',
      name_en: 'Photosynthesis',
      description: '阳光产出基因,提升资源获取能力',
      coreAttribute: 'sun_production',
      recessiveAttribute: 'growth_speed'
    },
    ice: {
      id: 'ice',
      name_cn: '冰冻',
      name_en: 'Ice',
      description: '冰系控制基因,减速和冻结敌人',
      coreAttribute: 'slow_effect',
      recessiveAttribute: 'freeze_chance'
    },
    spike: {
      id: 'spike',
      name_cn: '尖刺',
      name_en: 'Spike',
      description: '穿刺伤害基因,造成地面或穿透伤害',
      coreAttribute: 'pierce_damage',
      recessiveAttribute: 'armor_break'
    },
    fire: {
      id: 'fire',
      name_cn: '火焰',
      name_en: 'Fire',
      description: '火焰增幅基因,提升伤害并附带灼烧',
      coreAttribute: 'fire_damage',
      recessiveAttribute: 'burn_effect'
    },
    catapult: {
      id: 'catapult',
      name_cn: '投掷',
      name_en: 'Catapult',
      description: '抛物线攻击基因,越过障碍物打击目标',
      coreAttribute: 'arc_attack',
      recessiveAttribute: 'splash_damage'
    },
    explosive: {
      id: 'explosive',
      name_cn: '爆炸',
      name_en: 'Explosive',
      description: '范围爆炸基因,造成高额AOE伤害',
      coreAttribute: 'aoe_damage',
      recessiveAttribute: 'blast_radius'
    },
    charm: {
      id: 'charm',
      name_cn: '魅惑',
      name_en: 'Charm',
      description: '精神控制基因,转化敌方单位',
      coreAttribute: 'mind_control',
      recessiveAttribute: 'confuse_chance'
    },
    devour: {
      id: 'devour',
      name_cn: '吞噬',
      name_en: 'Devour',
      description: '近战吞噬基因,一击消灭单体目标',
      coreAttribute: 'instant_kill',
      recessiveAttribute: 'digest_speed'
    },
    magnetic: {
      id: 'magnetic',
      name_cn: '磁力',
      name_en: 'Magnetic',
      description: '磁力操控基因,夺取金属物品',
      coreAttribute: 'metal_attract',
      recessiveAttribute: 'range_expand'
    },
    defense: {
      id: 'defense',
      name_cn: '防御',
      name_en: 'Defense',
      description: '高耐久防御基因,阻挡僵尸前进',
      coreAttribute: 'high_hp',
      recessiveAttribute: 'knockback_resist'
    },
    poison: {
      id: 'poison',
      name_cn: '毒素',
      name_en: 'Poison',
      description: '毒雾穿透基因,无视防具持续伤害',
      coreAttribute: 'penetrate_attack',
      recessiveAttribute: 'poison_dot'
    },
    flight: {
      id: 'flight',
      name_cn: '飞行',
      name_en: 'Flight',
      description: '空中作战基因,追踪和制空能力',
      coreAttribute: 'homing_attack',
      recessiveAttribute: 'anti_air'
    },
    support: {
      id: 'support',
      name_cn: '辅助',
      name_en: 'Support',
      description: '辅助功能基因,提供平台和增益效果',
      coreAttribute: 'utility',
      recessiveAttribute: 'buff_extend'
    },
    aquatic: {
      id: 'aquatic',
      name_cn: '水生',
      name_en: 'Aquatic',
      description: '水域适应基因,在水中作战',
      coreAttribute: 'water_adapt',
      recessiveAttribute: 'amphibious'
    },
    special: {
      id: 'special',
      name_cn: '特殊',
      name_en: 'Special',
      description: '特殊能力基因,拥有独特机制',
      coreAttribute: 'unique_ability',
      recessiveAttribute: 'flexibility'
    }
  },

  energyGrades: {
    blue: {
      id: 'blue',
      name_cn: '蓝色',
      name_en: 'Blue',
      fusionCount: 2,
      mutationProb: 0.15,
      multiAttributeProb: 0.2,
      valueFluctuation: 0.1,
      crossGeneProb: 0.05
    },
    purple: {
      id: 'purple',
      name_cn: '紫色',
      name_en: 'Purple',
      fusionCount: 3,
      mutationProb: 0.35,
      multiAttributeProb: 0.45,
      valueFluctuation: 0.2,
      crossGeneProb: 0.15
    },
    gold: {
      id: 'gold',
      name_cn: '金色',
      name_en: 'Gold',
      fusionCount: 4,
      mutationProb: 0.55,
      multiAttributeProb: 0.7,
      valueFluctuation: 0.3,
      crossGeneProb: 0.25
    },
    red: {
      id: 'red',
      name_cn: '红色',
      name_en: 'Red',
      fusionCount: 5,
      mutationProb: 0.8,
      multiAttributeProb: 0.9,
      valueFluctuation: 0.5,
      crossGeneProb: 0.4
    }
  },

  mutationTypes: {
    pierce: {
      id: 'pierce',
      name_cn: '穿透',
      name_en: 'Pierce',
      description: '攻击穿透目标,对后方敌人造成伤害',
      minGrade: 'blue',
      weight: 10
    },
    attack_speed_up: {
      id: 'attack_speed_up',
      name_cn: '攻速提升',
      name_en: 'Attack Speed Up',
      description: '攻击速度大幅提升',
      minGrade: 'blue',
      weight: 10
    },
    random_bullet: {
      id: 'random_bullet',
      name_cn: '随机弹幕',
      name_en: 'Random Bullet',
      description: '攻击时随机发射不同类型弹幕',
      minGrade: 'purple',
      weight: 8
    },
    hp_up: {
      id: 'hp_up',
      name_cn: '生命强化',
      name_en: 'HP Up',
      description: '生命值大幅提升',
      minGrade: 'blue',
      weight: 10
    },
    attack_type_change: {
      id: 'attack_type_change',
      name_cn: '攻击变异',
      name_en: 'Attack Type Change',
      description: '攻击方式发生变异,获得新的攻击模式',
      minGrade: 'purple',
      weight: 7
    },
    crush_resist: {
      id: 'crush_resist',
      name_cn: '碾压抗性',
      name_en: 'Crush Resist',
      description: '免疫碾压类攻击',
      minGrade: 'purple',
      weight: 6
    },
    reflect_bullet: {
      id: 'reflect_bullet',
      name_cn: '弹幕反射',
      name_en: 'Reflect Bullet',
      description: '有概率反射敌方弹幕',
      minGrade: 'gold',
      weight: 5
    },
    armor_break: {
      id: 'armor_break',
      name_cn: '破甲',
      name_en: 'Armor Break',
      description: '攻击无视敌方护甲',
      minGrade: 'purple',
      weight: 8
    },
    range_expand: {
      id: 'range_expand',
      name_cn: '射程扩展',
      name_en: 'Range Expand',
      description: '攻击范围大幅扩展',
      minGrade: 'blue',
      weight: 9
    },
    chain_attack: {
      id: 'chain_attack',
      name_cn: '连锁攻击',
      name_en: 'Chain Attack',
      description: '攻击在敌人间连锁传播',
      minGrade: 'gold',
      weight: 5
    },
    self_heal: {
      id: 'self_heal',
      name_cn: '自我修复',
      name_en: 'Self Heal',
      description: '持续恢复自身生命值',
      minGrade: 'purple',
      weight: 7
    },
    hidden_aoe: {
      id: 'hidden_aoe',
      name_cn: '隐藏AOE',
      name_en: 'Hidden AOE',
      description: '攻击附带范围伤害/治疗/环境效果',
      minGrade: 'gold',
      weight: 4
    },
    sun_double: {
      id: 'sun_double',
      name_cn: '阳光产量翻倍',
      name_en: 'Sun Double',
      description: '向日葵类植物阳光产量翻倍',
      minGrade: 'blue',
      weight: 8
    }
  },

  hybridFormulas: {
    dominantProb: 0.65,
    recessiveProb: 0.45,
    guaranteeOneCore: true
  },

  // 具体杂交配方
  hybridRecipes: {
    // 豌豆系杂交
    peashooter_sunflower: {
      parents: ['peashooter', 'sunflower'],
      result: {
        name_cn: '阳光豌豆',
        name_en: 'Sun Pea',
        gene_pool: 'pea',
        category: 'attack_ranged',
        cost: 125,
        hp: 300,
        damage: 20,
        attack_speed: 1.5,
        range: 9,
        special: '发射豌豆,偶尔产出阳光',
        visual: { body: '#8BC34A', accent: '#558B2F', head: '#AED581', shape: 'round' }
      }
    },
    peashooter_snow_pea: {
      parents: ['peashooter', 'snow_pea'],
      result: {
        name_cn: '冰火豌豆',
        name_en: 'Ice Fire Pea',
        gene_pool: 'pea',
        category: 'attack_ranged',
        cost: 250,
        hp: 300,
        damage: 30,
        attack_speed: 1.2,
        range: 9,
        special: '随机发射冰冻或火焰豌豆',
        visual: { body: '#00BCD4', accent: '#FF5722', head: '#4DD0E1', shape: 'round' }
      }
    },
    peashooter_repeater: {
      parents: ['peashooter', 'repeater'],
      result: {
        name_cn: '三连射手',
        name_en: 'Triple Pea',
        gene_pool: 'pea',
        category: 'attack_ranged',
        cost: 300,
        hp: 300,
        damage: 20,
        attack_speed: 1.0,
        range: 9,
        special: '三连发豌豆',
        visual: { body: '#2E7D32', accent: '#1B5E20', head: '#388E3C', shape: 'round' }
      }
    },
    peashooter_starfruit: {
      parents: ['peashooter', 'starfruit'],
      result: {
        name_cn: '星豌豆',
        name_en: 'Star Pea',
        gene_pool: 'pea',
        category: 'attack_ranged',
        cost: 200,
        hp: 300,
        damage: 20,
        attack_speed: 1.3,
        range: 9,
        special: '发射星形豌豆,五方向攻击',
        visual: { body: '#FFC107', accent: '#FF8F00', head: '#FFD54F', shape: 'star' }
      }
    },
    peashooter_split_pea: {
      parents: ['peashooter', 'split_pea'],
      result: {
        name_cn: '分裂豌豆',
        name_en: 'Split Pea',
        gene_pool: 'pea',
        category: 'attack_ranged',
        cost: 175,
        hp: 300,
        damage: 20,
        attack_speed: 1.2,
        range: 9,
        special: '前后双发,概率分裂',
        visual: { body: '#43A047', accent: '#1B5E20', head: '#66BB6A', shape: 'round' }
      }
    },
    
    // 火焰系杂交
    jalapeno_torchwood: {
      parents: ['jalapeno', 'torchwood'],
      result: {
        name_cn: '烈焰树桩',
        name_en: 'Flame Wood',
        gene_pool: 'fire',
        category: 'support',
        cost: 250,
        hp: 400,
        damage: 0,
        attack_speed: 0,
        range: 0,
        special: '豌豆变火焰豌豆,伤害x3',
        visual: { body: '#FF5722', accent: '#BF360C', head: '#FF8A65', shape: 'round' }
      }
    },
    jalapeno_cherry_bomb: {
      parents: ['jalapeno', 'cherry_bomb'],
      result: {
        name_cn: '地狱辣椒',
        name_en: 'Hell Pepper',
        gene_pool: 'explosive',
        category: 'explosive',
        cost: 200,
        hp: 300,
        damage: 2400,
        attack_speed: 0,
        range: 9,
        special: '整行火焰爆炸',
        visual: { body: '#D32F2F', accent: '#B71C1C', head: '#EF5350', shape: 'round' }
      }
    },
    jalapeno_potato_mine: {
      parents: ['jalapeno', 'potato_mine'],
      result: {
        name_cn: '火焰地雷',
        name_en: 'Flame Mine',
        gene_pool: 'explosive',
        category: 'explosive',
        cost: 150,
        hp: 300,
        damage: 1800,
        attack_speed: 0,
        range: 3,
        special: '爆炸后留下火焰地带',
        visual: { body: '#FF6F00', accent: '#E65100', head: '#FFB74D', shape: 'round' }
      }
    },
    
    // 冰冻系杂交
    snow_pea_ice_shroom: {
      parents: ['snow_pea', 'ice_shroom'],
      result: {
        name_cn: '暴雪射手',
        name_en: 'Blizzard Pea',
        gene_pool: 'ice',
        category: 'attack_ranged',
        cost: 275,
        hp: 300,
        damage: 25,
        attack_speed: 1.5,
        range: 9,
        special: '发射冰豌豆,概率冻结僵尸',
        visual: { body: '#4FC3F7', accent: '#0288D1', head: '#B3E5FC', shape: 'round' }
      }
    },
    snow_pea_winter_melon: {
      parents: ['snow_pea', 'winter_melon'],
      result: {
        name_cn: '冰霜西瓜射手',
        name_en: 'Frost Melon Shooter',
        gene_pool: 'ice',
        category: 'attack_ranged',
        cost: 350,
        hp: 300,
        damage: 60,
        attack_speed: 2.5,
        range: 9,
        special: '发射冰冻西瓜,溅射减速',
        visual: { body: '#00BCD4', accent: '#006064', head: '#4DD0E1', shape: 'round' }
      }
    },
    
    // 防御系杂交
    wall_nut_tall_nut: {
      parents: ['wall_nut', 'tall_nut'],
      result: {
        name_cn: '钢铁坚果',
        name_en: 'Steel Nut',
        gene_pool: 'defense',
        category: 'defense',
        cost: 175,
        hp: 12000,
        damage: 0,
        attack_speed: 0,
        range: 0,
        special: '超高耐久,阻挡跳跃和飞行',
        visual: { body: '#616161', accent: '#212121', head: '#757575', shape: 'tall' }
      }
    },
    wall_nut_pumpkin: {
      parents: ['wall_nut', 'pumpkin'],
      result: {
        name_cn: '双层护盾',
        name_en: 'Double Shield',
        gene_pool: 'defense',
        category: 'defense',
        cost: 150,
        hp: 8000,
        damage: 0,
        attack_speed: 0,
        range: 0,
        special: '双层防护,可套在其他植物上',
        visual: { body: '#FF9800', accent: '#E65100', head: '#FFB74D', shape: 'round' }
      }
    },
    wall_nut_spikeweed: {
      parents: ['wall_nut', 'spikeweed'],
      result: {
        name_cn: '荆棘坚果',
        name_en: 'Spiky Nut',
        gene_pool: 'defense',
        category: 'defense',
        cost: 125,
        hp: 5000,
        damage: 20,
        attack_speed: 0.5,
        range: 1,
        special: '高耐久,反弹近战伤害',
        visual: { body: '#795548', accent: '#3E2723', head: '#8D6E63', shape: 'round' }
      }
    },
    
    // 爆炸系杂交
    cherry_bomb_doom_shroom: {
      parents: ['cherry_bomb', 'doom_shroom'],
      result: {
        name_cn: '毁灭樱桃',
        name_en: 'Doom Cherry',
        gene_pool: 'explosive',
        category: 'explosive',
        cost: 275,
        hp: 300,
        damage: 4800,
        attack_speed: 0,
        range: 9,
        special: '超大范围爆炸,留下 crater',
        visual: { body: '#212121', accent: '#000000', head: '#424242', shape: 'round' }
      }
    },
    potato_mine_squash: {
      parents: ['potato_mine', 'squash'],
      result: {
        name_cn: '跳跃地雷',
        name_en: 'Jumping Mine',
        gene_pool: 'explosive',
        category: 'explosive',
        cost: 100,
        hp: 300,
        damage: 1800,
        attack_speed: 0,
        range: 3,
        special: '跳跃到僵尸身上爆炸',
        visual: { body: '#FF9800', accent: '#E65100', head: '#FFB74D', shape: 'round' }
      }
    },
    cherry_bomb_jalapeno: {
      parents: ['cherry_bomb', 'jalapeno'],
      result: {
        name_cn: '烈焰樱桃',
        name_en: 'Flame Cherry',
        gene_pool: 'explosive',
        category: 'explosive',
        cost: 225,
        hp: 300,
        damage: 2000,
        attack_speed: 0,
        range: 5,
        special: '3x3范围火焰爆炸',
        visual: { body: '#FF5722', accent: '#BF360C', head: '#FF8A65', shape: 'round' }
      }
    },
    
    // 蘑菇系杂交
    fume_shroom_scaredy_shroom: {
      parents: ['fume_shroom', 'scaredy_shroom'],
      result: {
        name_cn: '恐惧烟雾',
        name_en: 'Fear Fume',
        gene_pool: 'poison',
        category: 'attack_ranged',
        cost: 125,
        hp: 300,
        damage: 40,
        attack_speed: 1.5,
        range: 5,
        special: '穿透攻击,僵尸靠近时停止',
        visual: { body: '#7E57C2', accent: '#311B92', head: '#9575CD', shape: 'mushroom' }
      }
    },
    sun_shroom_magnet_shroom: {
      parents: ['sun_shroom', 'magnet_shroom'],
      result: {
        name_cn: '磁力阳光菇',
        name_en: 'Magnet Sun',
        gene_pool: 'magnetic',
        category: 'production',
        cost: 125,
        hp: 300,
        damage: 0,
        attack_speed: 24,
        range: 5,
        special: '产出阳光,吸取金属防具',
        visual: { body: '#FFB300', accent: '#E65100', head: '#FFC107', shape: 'mushroom' }
      }
    },
    puff_shroom_hypno_shroom: {
      parents: ['puff_shroom', 'hypno_shroom'],
      result: {
        name_cn: '催眠喷射',
        name_en: 'Hypno Puff',
        gene_pool: 'charm',
        category: 'control',
        cost: 75,
        hp: 300,
        damage: 20,
        attack_speed: 1.5,
        range: 3,
        special: '概率魅惑被击中的僵尸',
        visual: { body: '#E91E63', accent: '#880E4F', head: '#F06292', shape: 'mushroom' }
      }
    },
    doom_shroom_gloom_shroom: {
      parents: ['doom_shroom', 'gloom_shroom'],
      result: {
        name_cn: '毁灭忧郁',
        name_en: 'Doom Gloom',
        gene_pool: 'poison',
        category: 'attack_ranged',
        cost: 200,
        hp: 300,
        damage: 120,
        attack_speed: 1.2,
        range: 5,
        special: '8方向攻击,概率爆炸',
        visual: { body: '#424242', accent: '#212121', head: '#616161', shape: 'mushroom' }
      }
    },
    
    // 投掷系杂交
    melon_pult_winter_melon: {
      parents: ['melon_pult', 'winter_melon'],
      result: {
        name_cn: '冰火西瓜',
        name_en: 'Ice Fire Melon',
        gene_pool: 'catapult',
        category: 'attack_ranged',
        cost: 400,
        hp: 300,
        damage: 120,
        attack_speed: 3,
        range: 9,
        special: '随机发射冰冻或火焰西瓜,溅射伤害',
        visual: { body: '#00BCD4', accent: '#FF5722', head: '#4DD0E1', shape: 'round' }
      }
    },
    cabbage_pult_kernel_pult: {
      parents: ['cabbage_pult', 'kernel_pult'],
      result: {
        name_cn: '黄油卷心菜',
        name_en: 'Butter Cabbage',
        gene_pool: 'catapult',
        category: 'attack_ranged',
        cost: 175,
        hp: 300,
        damage: 40,
        attack_speed: 2.5,
        range: 9,
        special: '概率发射黄油眩晕,溅射伤害',
        visual: { body: '#FFC107', accent: '#FF8F00', head: '#FFD54F', shape: 'round' }
      }
    },
    melon_pult_cabbage_pult: {
      parents: ['melon_pult', 'cabbage_pult'],
      result: {
        name_cn: '重型投手',
        name_en: 'Heavy Pult',
        gene_pool: 'catapult',
        category: 'attack_ranged',
        cost: 350,
        hp: 300,
        damage: 100,
        attack_speed: 2.8,
        range: 9,
        special: '高伤害投掷,溅射范围更大',
        visual: { body: '#558B2F', accent: '#33691E', head: '#7CB342', shape: 'round' }
      }
    },
    
    // 特殊杂交
    threepeater_gatling_pea: {
      parents: ['threepeater', 'gatling_pea'],
      result: {
        name_cn: '机枪三线',
        name_en: 'Gatling Triple',
        gene_pool: 'pea',
        category: 'attack_ranged',
        cost: 500,
        hp: 300,
        damage: 20,
        attack_speed: 0.3,
        range: 9,
        special: '三行四连发豌豆',
        visual: { body: '#1B5E20', accent: '#0D3B0F', head: '#2E7D32', shape: 'round' }
      }
    },
    sunflower_twin_sunflower: {
      parents: ['sunflower', 'twin_sunflower'],
      result: {
        name_cn: '三胞向日葵',
        name_en: 'Triple Sunflower',
        gene_pool: 'photosynthesis',
        category: 'production',
        cost: 200,
        hp: 200,
        damage: 0,
        attack_speed: 24,
        range: 0,
        special: '产出150阳光',
        visual: { body: '#FFD700', accent: '#FF8F00', head: '#FFEB3B', shape: 'flower' }
      }
    },
    sunflower_marigold: {
      parents: ['sunflower', 'marigold'],
      result: {
        name_cn: '金币向日葵',
        name_en: 'Gold Sunflower',
        gene_pool: 'photosynthesis',
        category: 'production',
        cost: 100,
        hp: 200,
        damage: 0,
        attack_speed: 24,
        range: 0,
        special: '产出阳光和金币',
        visual: { body: '#FFD700', accent: '#FF8F00', head: '#FFEB3B', shape: 'flower' }
      }
    },
    chomper_wall_nut: {
      parents: ['chomper', 'wall_nut'],
      result: {
        name_cn: '防御大嘴花',
        name_en: 'Defensive Chomper',
        gene_pool: 'devour',
        category: 'attack_melee',
        cost: 200,
        hp: 2000,
        damage: 300,
        attack_speed: 25,
        range: 1,
        special: '高耐久吞噬,消化时提供防御',
        visual: { body: '#9C27B0', accent: '#4A148C', head: '#BA68C8', shape: 'round' }
      }
    },
    chomper_hypno_shroom: {
      parents: ['chomper', 'hypno_shroom'],
      result: {
        name_cn: '催眠大嘴花',
        name_en: 'Hypno Chomper',
        gene_pool: 'charm',
        category: 'attack_melee',
        cost: 175,
        hp: 300,
        damage: 300,
        attack_speed: 30,
        range: 1,
        special: '吞噬后魅惑僵尸',
        visual: { body: '#E91E63', accent: '#880E4F', head: '#F06292', shape: 'round' }
      }
    },
    
    // 水生系杂交
    lilypad_tangle_kelp: {
      parents: ['lilypad', 'tangle_kelp'],
      result: {
        name_cn: '战斗睡莲',
        name_en: 'Battle Lily',
        gene_pool: 'aquatic',
        category: 'attack_melee',
        cost: 100,
        hp: 400,
        damage: 180,
        attack_speed: 0,
        range: 1,
        special: '水上平台,拖入水下僵尸',
        visual: { body: '#009688', accent: '#004D40', head: '#4DB6AC', shape: 'flat' }
      }
    },
    lilypad_cattail: {
      parents: ['lilypad', 'cattail'],
      result: {
        name_cn: '追踪睡莲',
        name_en: 'Tracking Lily',
        gene_pool: 'flight',
        category: 'attack_ranged',
        cost: 250,
        hp: 300,
        damage: 30,
        attack_speed: 1.5,
        range: 9,
        special: '水上平台,发射追踪子弹',
        visual: { body: '#009688', accent: '#004D40', head: '#4DB6AC', shape: 'round' }
      }
    },
    
    // 辅助系杂交
    plantern_umbrella_leaf: {
      parents: ['plantern', 'umbrella_leaf'],
      result: {
        name_cn: '守护路灯',
        name_en: 'Guard Plantern',
        gene_pool: 'support',
        category: 'support',
        cost: 150,
        hp: 400,
        damage: 0,
        attack_speed: 0,
        range: 5,
        special: '照明迷雾,保护3x3免受投掷',
        visual: { body: '#CDDC39', accent: '#827717', head: '#D4E157', shape: 'round' }
      }
    },
    coffee_bean_hypno_shroom: {
      parents: ['coffee_bean', 'hypno_shroom'],
      result: {
        name_cn: '清醒催眠',
        name_en: 'Awake Hypno',
        gene_pool: 'charm',
        category: 'control',
        cost: 150,
        hp: 300,
        damage: 0,
        attack_speed: 0,
        range: 1,
        special: '魅惑僵尸,不需要咖啡豆唤醒',
        visual: { body: '#5D4037', accent: '#3E2723', head: '#795548', shape: 'round' }
      }
    },
    garlic_wall_nut: {
      parents: ['garlic', 'wall_nut'],
      result: {
        name_cn: '防御大蒜',
        name_en: 'Defensive Garlic',
        gene_pool: 'defense',
        category: 'defense',
        cost: 100,
        hp: 2000,
        damage: 0,
        attack_speed: 0,
        range: 0,
        special: '高耐久,僵尸啃咬后转向',
        visual: { body: '#FAFAFA', accent: '#9E9E9E', head: '#F5F5F5', shape: 'round' }
      }
    },
    flower_pot_lilypad: {
      parents: ['flower_pot', 'lilypad'],
      result: {
        name_cn: '万能花盆',
        name_en: 'Universal Pot',
        gene_pool: 'support',
        category: 'support',
        cost: 50,
        hp: 500,
        damage: 0,
        attack_speed: 0,
        range: 0,
        special: '可在任何地形种植',
        visual: { body: '#795548', accent: '#3E2723', head: '#8D6E63', shape: 'flat' }
      }
    },
    
    // 高级杂交 (需要紫色或更高能量)
    gatling_pea_repeater: {
      parents: ['gatling_pea', 'repeater'],
      result: {
        name_cn: '六连发豌豆',
        name_en: 'Six-shot Pea',
        gene_pool: 'pea',
        category: 'attack_ranged',
        cost: 400,
        hp: 300,
        damage: 20,
        attack_speed: 0.25,
        range: 9,
        special: '六连发豌豆',
        minGrade: 'purple',
        visual: { body: '#1B5E20', accent: '#0D3B0F', head: '#2E7D32', shape: 'round' }
      }
    },
    winter_melon_melon_pult: {
      parents: ['winter_melon', 'melon_pult'],
      result: {
        name_cn: '重型冰瓜',
        name_en: 'Heavy Ice Melon',
        gene_pool: 'ice',
        category: 'attack_ranged',
        cost: 450,
        hp: 300,
        damage: 150,
        attack_speed: 3.5,
        range: 9,
        special: '高伤害冰冻西瓜,大范围溅射',
        minGrade: 'purple',
        visual: { body: '#00BCD4', accent: '#006064', head: '#4DD0E1', shape: 'round' }
      }
    },
    
    // 终极杂交 (需要金色或更高能量)
    cob_cannon_melon_pult: {
      parents: ['cob_cannon', 'melon_pult'],
      result: {
        name_cn: '玉米西瓜炮',
        name_en: 'Corn Melon Cannon',
        gene_pool: 'catapult',
        category: 'special',
        cost: 600,
        hp: 300,
        damage: 2000,
        attack_speed: 0,
        range: 9,
        special: '手动瞄准发射爆炸西瓜',
        minGrade: 'gold',
        visual: { body: '#FFC107', accent: '#FF8F00', head: '#FFD54F', shape: 'tall' }
      }
    },
    gatling_pea_starfruit: {
      parents: ['gatling_pea', 'starfruit'],
      result: {
        name_cn: '星机枪豌豆',
        name_en: 'Star Gatling Pea',
        gene_pool: 'pea',
        category: 'attack_ranged',
        cost: 550,
        hp: 300,
        damage: 20,
        attack_speed: 0.35,
        range: 9,
        special: '四连发星形豌豆',
        minGrade: 'gold',
        visual: { body: '#FFC107', accent: '#FF8F00', head: '#FFD54F', shape: 'star' }
      }
    }
  }
};
