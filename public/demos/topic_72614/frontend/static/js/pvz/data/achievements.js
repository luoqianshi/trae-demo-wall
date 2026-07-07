// 成就系统 - 定义所有成就
// 类型: battle(战斗), collection(收集), progress(进度), special(特殊)

export const ACHIEVEMENTS = {
  // === 战斗类成就 ===
  first_blood: {
    id: 'first_blood',
    name_cn: '初次斩获',
    name_en: 'First Blood',
    description: '击败第一个僵尸',
    icon: '🧟',
    category: 'battle',
    condition: { type: 'total_kills', value: 1 }
  },
  zombie_slayer: {
    id: 'zombie_slayer',
    name_cn: '僵尸杀手',
    name_en: 'Zombie Slayer',
    description: '击败100个僵尸',
    icon: '⚔️',
    category: 'battle',
    condition: { type: 'total_kills', value: 100 }
  },
  zombie_nemesis: {
    id: 'zombie_nemesis',
    name_cn: '僵尸克星',
    name_en: 'Zombie Nemesis',
    description: '击败1000个僵尸',
    icon: '💀',
    category: 'battle',
    condition: { type: 'total_kills', value: 1000 }
  },
  boss_hunter: {
    id: 'boss_hunter',
    name_cn: 'Boss猎人',
    name_en: 'Boss Hunter',
    description: '击败第一个Boss',
    icon: '👹',
    category: 'battle',
    condition: { type: 'boss_kills', value: 1 }
  },
  boss_slayer: {
    id: 'boss_slayer',
    name_cn: 'Boss终结者',
    name_en: 'Boss Slayer',
    description: '击败5个Boss',
    icon: '🏆',
    category: 'battle',
    condition: { type: 'boss_kills', value: 5 }
  },
  flawless_victory: {
    id: 'flawless_victory',
    name_cn: '完美胜利',
    name_en: 'Flawless Victory',
    description: '不损失任何生命值完成一场战斗',
    icon: '✨',
    category: 'battle',
    condition: { type: 'flawless_battles', value: 1 }
  },

  // === 收集类成就 ===
  first_hybrid: {
    id: 'first_hybrid',
    name_cn: '初次杂交',
    name_en: 'First Hybrid',
    description: '杂交出第一株植物',
    icon: '🧬',
    category: 'collection',
    condition: { type: 'hybrids_created', value: 1 }
  },
  hybrid_master: {
    id: 'hybrid_master',
    name_cn: '杂交大师',
    name_en: 'Hybrid Master',
    description: '杂交出10株植物',
    icon: '🔬',
    category: 'collection',
    condition: { type: 'hybrids_created', value: 10 }
  },
  hybrid_legend: {
    id: 'hybrid_legend',
    name_cn: '杂交传奇',
    name_en: 'Hybrid Legend',
    description: '杂交出30株植物',
    icon: '🌟',
    category: 'collection',
    condition: { type: 'hybrids_created', value: 30 }
  },
  triple_fusion: {
    id: 'triple_fusion',
    name_cn: '三元融合',
    name_en: 'Triple Fusion',
    description: '完成一次三元杂交',
    icon: '🔺',
    category: 'collection',
    condition: { type: 'triple_fusions', value: 1 }
  },
  quad_fusion: {
    id: 'quad_fusion',
    name_cn: '四元融合',
    name_en: 'Quad Fusion',
    description: '完成一次四元杂交',
    icon: '🔷',
    category: 'collection',
    condition: { type: 'quad_fusions', value: 1 }
  },
  penta_fusion: {
    id: 'penta_fusion',
    name_cn: '五元融合',
    name_en: 'Penta Fusion',
    description: '完成一次五元杂交',
    icon: '💎',
    category: 'collection',
    condition: { type: 'penta_fusions', value: 1 }
  },
  special_collector: {
    id: 'special_collector',
    name_cn: '特殊收藏家',
    name_en: 'Special Collector',
    description: '获得5株特殊植物',
    icon: '🎁',
    category: 'collection',
    condition: { type: 'special_plants_obtained', value: 5 }
  },
  plant_diversity: {
    id: 'plant_diversity',
    name_cn: '植物多样性',
    name_en: 'Plant Diversity',
    description: '同时拥有20种不同的植物',
    icon: '🌿',
    category: 'collection',
    condition: { type: 'unique_plants', value: 20 }
  },

  // === 进度类成就 ===
  first_floor: {
    id: 'first_floor',
    name_cn: '初次攀登',
    name_en: 'First Floor',
    description: '到达第2层',
    icon: '🪜',
    category: 'progress',
    condition: { type: 'max_floor', value: 2 }
  },
  tower_climber: {
    id: 'tower_climber',
    name_cn: '塔攀登者',
    name_en: 'Tower Climber',
    description: '到达第5层',
    icon: '🏰',
    category: 'progress',
    condition: { type: 'max_floor', value: 5 }
  },
  tower_conqueror: {
    id: 'tower_conqueror',
    name_cn: '塔征服者',
    name_en: 'Tower Conqueror',
    description: '到达第10层',
    icon: '👑',
    category: 'progress',
    condition: { type: 'max_floor', value: 10 }
  },
  tower_master: {
    id: 'tower_master',
    name_cn: '塔之大师',
    name_en: 'Tower Master',
    description: '到达第20层',
    icon: '🌌',
    category: 'progress',
    condition: { type: 'max_floor', value: 20 }
  },

  // === 经济类成就 ===
  rich_man: {
    id: 'rich_man',
    name_cn: '小富翁',
    name_en: 'Rich Man',
    description: '累积获得1000金币',
    icon: '💰',
    category: 'economy',
    condition: { type: 'total_coins_earned', value: 1000 }
  },
  gold_tycoon: {
    id: 'gold_tycoon',
    name_cn: '金币大亨',
    name_en: 'Gold Tycoon',
    description: '累积获得5000金币',
    icon: '🏦',
    category: 'economy',
    condition: { type: 'total_coins_earned', value: 5000 }
  },

  // === 特殊成就 ===
  event_explorer: {
    id: 'event_explorer',
    name_cn: '事件探索者',
    name_en: 'Event Explorer',
    description: '完成10个事件',
    icon: '❓',
    category: 'special',
    condition: { type: 'events_completed', value: 10 }
  },
  lucky_gambler: {
    id: 'lucky_gambler',
    name_cn: '幸运赌徒',
    name_en: 'Lucky Gambler',
    description: '在随机事件中获得特殊植物',
    icon: '🎲',
    category: 'special',
    condition: { type: 'lucky_special_plant', value: 1 }
  },
  no_plant_left_behind: {
    id: 'no_plant_left_behind',
    name_cn: '植物守护者',
    name_en: 'No Plant Left Behind',
    description: '同时拥有50株植物（含杂交）',
    icon: '🛡️',
    category: 'collection',
    condition: { type: 'total_plants', value: 50 }
  }
};

// 成就分类
export const ACHIEVEMENT_CATEGORIES = {
  battle: { name_cn: '战斗', icon: '⚔️' },
  collection: { name_cn: '收集', icon: '📦' },
  progress: { name_cn: '进度', icon: '🪜' },
  economy: { name_cn: '经济', icon: '💰' },
  special: { name_cn: '特殊', icon: '⭐' }
};

export default ACHIEVEMENTS;
