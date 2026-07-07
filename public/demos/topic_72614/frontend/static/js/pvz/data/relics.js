export default [
  {
    id: 'tactical_manual',
    name_cn: '战术手册',
    name_en: 'Tactical Manual',
    tier: 'basic',
    dropRate: 0.05,
    cost: 500,
    description: '杂交成功率+5%',
    effect: { type: 'hybrid_success_bonus', value: 0.05 }
  },
  {
    id: 'mutation_garden',
    name_cn: '变异花园',
    name_en: 'Mutation Garden',
    tier: 'elite',
    dropRate: 0.1,
    cost: 2000,
    description: '变异概率+10%',
    effect: { type: 'mutation_prob_bonus', value: 0.1 }
  },
  {
    id: 'slot_expander',
    name_cn: '槽位扩展器',
    name_en: 'Slot Expander',
    tier: 'elite',
    dropRate: 0.1,
    cost: 2000,
    description: '临时增加2个杂交槽位',
    effect: { type: 'extra_slots', value: 2 }
  },
  {
    id: 'sun_amplifier',
    name_cn: '阳光增幅器',
    name_en: 'Sun Amplifier',
    tier: 'basic',
    dropRate: 0.05,
    cost: 500,
    description: '阳光产出+5%',
    effect: { type: 'sun_production_bonus', value: 0.05 }
  },
  {
    id: 'coin_magnet',
    name_cn: '金币磁铁',
    name_en: 'Coin Magnet',
    tier: 'basic',
    dropRate: 0.05,
    cost: 500,
    description: '金币掉落+5%',
    effect: { type: 'coin_drop_bonus', value: 0.05 }
  },
  {
    id: 'zombie_encyclopedia',
    name_cn: '僵尸百科',
    name_en: 'Zombie Encyclopedia',
    tier: 'elite',
    dropRate: 0.1,
    cost: 2000,
    description: '对特定类型僵尸伤害+10%',
    effect: { type: 'type_damage_bonus', value: 0.1 }
  },
  {
    id: 'frost_crystal',
    name_cn: '冰霜水晶',
    name_en: 'Frost Crystal',
    tier: 'leader',
    dropRate: 0.2,
    cost: 10000,
    description: '冰系效果+20%',
    effect: { type: 'ice_effect_bonus', value: 0.2 }
  },
  {
    id: 'fire_essence',
    name_cn: '火焰精华',
    name_en: 'Fire Essence',
    tier: 'leader',
    dropRate: 0.2,
    cost: 10000,
    description: '火焰伤害+20%',
    effect: { type: 'fire_damage_bonus', value: 0.2 }
  },
  {
    id: 'gene_scrambler',
    name_cn: '基因搅拌器',
    name_en: 'Gene Scrambler',
    tier: 'special',
    dropRate: 'unique',
    cost: 50000,
    description: '可重新随机一次杂交结果',
    effect: { type: 'reroll_hybrid', value: 1 }
  },
  {
    id: 'time_rewind',
    name_cn: '时间回溯',
    name_en: 'Time Rewind',
    tier: 'special',
    dropRate: 'unique',
    cost: 50000,
    description: '撤销上一波僵尸攻击',
    effect: { type: 'undo_wave', value: 1 }
  },
  {
    id: 'dimensional_key',
    name_cn: '维度钥匙',
    name_en: 'Dimensional Key',
    tier: 'leader',
    dropRate: 0.2,
    cost: 10000,
    description: '跨基因概率+20%',
    effect: { type: 'cross_gene_bonus', value: 0.2 }
  },
  {
    id: 'chaos_orb',
    name_cn: '混沌宝珠',
    name_en: 'Chaos Orb',
    tier: 'special',
    dropRate: 'unique',
    cost: 50000,
    description: '每波随机获得一个增益效果',
    effect: { type: 'random_buff_per_wave', value: 1 }
  },

  // ============ Phase 2: 经济类新增（8 个） ============
  {
    id: 'golden_sun',
    name_cn: '黄金太阳',
    name_en: 'Golden Sun',
    tier: 'elite',
    dropRate: 0.1,
    cost: 2000,
    description: '阳光产出+15%',
    effect: { type: 'sun_production_bonus', value: 0.15 }
  },
  {
    id: 'treasure_map',
    name_cn: '藏宝图',
    name_en: 'Treasure Map',
    tier: 'elite',
    dropRate: 0.1,
    cost: 2000,
    description: '金币掉落+20%',
    effect: { type: 'coin_drop_bonus', value: 0.2 }
  },
  {
    id: 'greed_amulet',
    name_cn: '贪婪护符',
    name_en: 'Greed Amulet',
    tier: 'leader',
    dropRate: 0.2,
    cost: 10000,
    description: '金币+50%，阳光-10%',
    effect: { type: 'coin_drop_bonus', value: 0.5, side_effect: { type: 'sun_production_bonus', value: -0.1 } }
  },
  {
    id: 'sun_idol',
    name_cn: '太阳神像',
    name_en: 'Sun Idol',
    tier: 'leader',
    dropRate: 0.2,
    cost: 10000,
    description: '阳光产出+30%',
    effect: { type: 'sun_production_bonus', value: 0.3 }
  },
  {
    id: 'bargain_book',
    name_cn: '议价手册',
    name_en: 'Bargain Book',
    tier: 'basic',
    dropRate: 0.05,
    cost: 500,
    description: '商店折扣+10%',
    effect: { type: 'shop_discount', value: 0.1 }
  },
  {
    id: 'lucky_clover',
    name_cn: '幸运草',
    name_en: 'Lucky Clover',
    tier: 'elite',
    dropRate: 0.1,
    cost: 2000,
    description: '遗物掉落率+15%',
    effect: { type: 'relic_drop_rate', value: 0.15 }
  },
  {
    id: 'coin_pouch',
    name_cn: '金币袋',
    name_en: 'Coin Pouch',
    tier: 'basic',
    dropRate: 0.05,
    cost: 500,
    description: '关卡金币奖励+10',
    effect: { type: 'flat_coin_bonus', value: 10 }
  },
  {
    id: 'savings_jar',
    name_cn: '存钱罐',
    name_en: 'Savings Jar',
    tier: 'elite',
    dropRate: 0.1,
    cost: 2000,
    description: '关卡金币奖励+30',
    effect: { type: 'flat_coin_bonus', value: 30 }
  },

  // ============ Phase 2: 战斗类新增（10 个） ============
  {
    id: 'power_glove',
    name_cn: '力量手套',
    name_en: 'Power Glove',
    tier: 'basic',
    dropRate: 0.05,
    cost: 500,
    description: '植物伤害+5%',
    effect: { type: 'plant_damage_bonus', value: 0.05 }
  },
  {
    id: 'iron_boots',
    name_cn: '铁靴',
    name_en: 'Iron Boots',
    tier: 'basic',
    dropRate: 0.05,
    cost: 500,
    description: '植物生命+10%',
    effect: { type: 'plant_hp_bonus', value: 0.1 }
  },
  {
    id: 'sniper_scope',
    name_cn: '狙击镜',
    name_en: 'Sniper Scope',
    tier: 'elite',
    dropRate: 0.1,
    cost: 2000,
    description: '植物射程+1',
    effect: { type: 'plant_range_bonus', value: 1 }
  },
  {
    id: 'rapid_fire',
    name_cn: '急射',
    name_en: 'Rapid Fire',
    tier: 'elite',
    dropRate: 0.1,
    cost: 2000,
    description: '植物攻速+10%',
    effect: { type: 'plant_attack_speed_bonus', value: 0.1 }
  },
  {
    id: 'vampire_fang',
    name_cn: '吸血鬼之牙',
    name_en: 'Vampire Fang',
    tier: 'leader',
    dropRate: 0.2,
    cost: 10000,
    description: '植物吸血5%',
    effect: { type: 'lifesteal', value: 0.05 }
  },
  {
    id: 'berserker_mark',
    name_cn: '狂战士印记',
    name_en: 'Berserker Mark',
    tier: 'leader',
    dropRate: 0.2,
    cost: 10000,
    description: '生命<30%时伤害+50%',
    effect: { type: 'damage_below_30hp', value: 0.5 }
  },
  {
    id: 'sharp_blade',
    name_cn: '锋利之刃',
    name_en: 'Sharp Blade',
    tier: 'elite',
    dropRate: 0.1,
    cost: 2000,
    description: '近战植物伤害+15%',
    effect: { type: 'melee_damage_bonus', value: 0.15 }
  },
  {
    id: 'energy_crystal',
    name_cn: '能量水晶',
    name_en: 'Energy Crystal',
    tier: 'basic',
    dropRate: 0.05,
    cost: 500,
    description: '阳光消耗-5%',
    effect: { type: 'plant_cost_reduction', value: 0.05 }
  },
  {
    id: 'critical_lens',
    name_cn: '聚光镜',
    name_en: 'Critical Lens',
    tier: 'elite',
    dropRate: 0.1,
    cost: 2000,
    description: '远程植物暴击率+10%',
    effect: { type: 'crit_chance_bonus', value: 0.1 }
  },
  {
    id: 'war_drum',
    name_cn: '战鼓',
    name_en: 'War Drum',
    tier: 'leader',
    dropRate: 0.2,
    cost: 10000,
    description: '每波开始植物伤害+3%（持续整关）',
    effect: { type: 'wave_damage_stack', value: 0.03 }
  },

  // ============ Phase 2: 防御类新增（5 个） ============
  {
    id: 'iron_wall',
    name_cn: '铁壁',
    name_en: 'Iron Wall',
    tier: 'basic',
    dropRate: 0.05,
    cost: 500,
    description: '基地生命+20',
    effect: { type: 'base_hp_bonus', value: 20 }
  },
  {
    id: 'thick_armor',
    name_cn: '厚甲',
    name_en: 'Thick Armor',
    tier: 'elite',
    dropRate: 0.1,
    cost: 2000,
    description: '基地生命+50',
    effect: { type: 'base_hp_bonus', value: 50 }
  },
  {
    id: 'mower_engine',
    name_cn: '推车引擎',
    name_en: 'Mower Engine',
    tier: 'basic',
    dropRate: 0.05,
    cost: 500,
    description: '50%几率推车自动恢复',
    effect: { type: 'mower_restore_chance', value: 0.5 }
  },
  {
    id: 'shield_generator',
    name_cn: '护盾发生器',
    name_en: 'Shield Generator',
    tier: 'elite',
    dropRate: 0.1,
    cost: 2000,
    description: '植物初始护盾100',
    effect: { type: 'plant_shield_start', value: 100 }
  },
  {
    id: 'aegis',
    name_cn: '神盾',
    name_en: 'Aegis',
    tier: 'leader',
    dropRate: 0.2,
    cost: 10000,
    description: '基地生命+100',
    effect: { type: 'base_hp_bonus', value: 100 }
  },

  // ============ Phase 2: 杂交/变异类新增（3 个） ============
  {
    id: 'lab_upgrade',
    name_cn: '实验室升级',
    name_en: 'Lab Upgrade',
    tier: 'elite',
    dropRate: 0.1,
    cost: 2000,
    description: '实验室每次刷新免费1次',
    effect: { type: 'lab_refresh_free', value: 1 }
  },
  {
    id: 'mutation_master',
    name_cn: '变异大师',
    name_en: 'Mutation Master',
    tier: 'leader',
    dropRate: 0.2,
    cost: 10000,
    description: '变异概率+25%',
    effect: { type: 'mutation_prob_bonus', value: 0.25 }
  },
  {
    id: 'hybrid_blueprint',
    name_cn: '杂交蓝图',
    name_en: 'Hybrid Blueprint',
    tier: 'elite',
    dropRate: 0.1,
    cost: 2000,
    description: '杂交成功率+10%',
    effect: { type: 'hybrid_success_bonus', value: 0.1 }
  },

  // ============ Phase 4: 特殊机制遗物（5 个） ============
  {
    id: 'phoenix_feather',
    name_cn: '凤凰之羽',
    name_en: 'Phoenix Feather',
    tier: 'leader',
    dropRate: 0.2,
    cost: 10000,
    description: '首次死亡时复活，恢复50%生命',
    effect: { type: 'revive_once', value: 0.5 }
  },
  {
    id: 'oracle_eye',
    name_cn: '神谕之眼',
    name_en: 'Oracle Eye',
    tier: 'elite',
    dropRate: 0.1,
    cost: 2000,
    description: '永久显示下一层节点信息',
    effect: { type: 'preview_next_floor', value: 1 }
  },
  {
    id: 'time_freeze',
    name_cn: '时间冰封',
    name_en: 'Time Freeze',
    tier: 'leader',
    dropRate: 0.2,
    cost: 10000,
    description: '主动：冻结所有僵尸3秒',
    effect: { type: 'freeze_zombies_3s', value: 3 }
  },
  {
    id: 'swap_doll',
    name_cn: '换位娃娃',
    name_en: 'Swap Doll',
    tier: 'leader',
    dropRate: 0.2,
    cost: 10000,
    description: '主动：交换场上两个植物位置',
    effect: { type: 'swap_plant_position', value: 1 }
  },
  {
    id: 'chaos_seed',
    name_cn: '混沌之种',
    name_en: 'Chaos Seed',
    tier: 'special',
    dropRate: 'unique',
    cost: 50000,
    description: '杂交植物可获得2个变异词条',
    effect: { type: 'multi_mutation', value: 2 }
  }
];
