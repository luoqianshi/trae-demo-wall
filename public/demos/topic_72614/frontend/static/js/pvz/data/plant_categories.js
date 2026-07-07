/**
 * 植物分类系统与杂交限制规则
 *
 * 49种植物分为8大类，类别间的杂交限制规则用于减少预定义组合数量。
 * 失败组合按类别设计，玩家需探索发现。
 */

// === 植物类别定义 ===
export const PLANT_CATEGORIES = {
  shooter: {
    name_cn: '射手类',
    name_en: 'Shooter',
    description: '发射子弹攻击僵尸',
    plants: [
      'peashooter', 'snow_pea', 'repeater', 'threepeater',
      'split_pea', 'gatling_pea', 'cactus', 'starfruit'
    ]
  },
  pult: {
    name_cn: '投掷类',
    name_en: 'Pult',
    description: '投掷物攻击僵尸',
    plants: [
      'cabbage_pult', 'kernel_pult', 'melon_pult', 'winter_melon', 'cob_cannon'
    ]
  },
  mushroom: {
    name_cn: '蘑菇类',
    name_en: 'Mushroom',
    description: '蘑菇结构，部分需要咖啡豆唤醒',
    plants: [
      'puff_shroom', 'fume_shroom', 'doom_shroom', 'ice_shroom',
      'hypno_shroom', 'scaredy_shroom', 'sea_shroom', 'magnet_shroom',
      'gold_magnet', 'gloom_shroom', 'sun_shroom', 'coffee_bean'
    ]
  },
  defense: {
    name_cn: '防御类',
    name_en: 'Defense',
    description: '高HP防御植物',
    plants: [
      'wall_nut', 'tall_nut', 'pumpkin', 'spikeweed', 'spikerock', 'torchwood'
    ]
  },
  explosive: {
    name_cn: '爆炸类',
    name_en: 'Explosive',
    description: '一次性爆炸攻击',
    plants: [
      'cherry_bomb', 'potato_mine', 'jalapeno', 'squash'
    ]
  },
  producer: {
    name_cn: '产出类',
    name_en: 'Producer',
    description: '产出阳光或资源',
    plants: [
      'sunflower', 'twin_sunflower', 'marigold'
    ]
  },
  melee: {
    name_cn: '近战类',
    name_en: 'Melee',
    description: '近身攻击僵尸',
    plants: [
      'chomper', 'tangle_kelp', 'blover'
    ]
  },
  support: {
    name_cn: '辅助类',
    name_en: 'Support',
    description: '提供特殊功能支持',
    plants: [
      'lilypad', 'flower_pot', 'plantern', 'garlic',
      'umbrella_leaf', 'grave_buster', 'imitater'
    ]
  }
};

// === 植物到类别的映射（快速查询）===
export const PLANT_CATEGORY_MAP = {};
for (const [catId, cat] of Object.entries(PLANT_CATEGORIES)) {
  for (const plantId of cat.plants) {
    PLANT_CATEGORY_MAP[plantId] = catId;
  }
}

// === 杂交限制规则（按类别）===
// 格式: "类别A_类别B" => { canFuse: false, reason: "..." }
// 类别组合键名按字母序排序
export const CATEGORY_FUSION_RULES = {
  // 爆炸类内部冲突（连锁爆炸）
  explosive_explosive: {
    canFuse: false,
    reason: '爆炸类基因冲突：双重爆炸物质相互排斥，融合时会发生不可控的连锁爆炸'
  },

  // 爆炸×防御（外壳封印引爆）
  defense_explosive: {
    canFuse: false,
    reason: '外壳抑制引爆：防御类的坚硬外壳会封印爆炸能量，导致无法引爆'
  },

  // 爆炸×产出（高温焚毁）
  explosive_producer: {
    canFuse: false,
    reason: '能量焚毁：爆炸高温会瞬间焚毁产出植物的光合组织'
  },

  // 辅助类×爆炸（功能冲突）
  explosive_support: {
    canFuse: false,
    reason: '功能冲突：辅助植物的特殊机制无法承载爆炸能量'
  },

  // 辅助类×投掷（结构不兼容）
  pult_support: {
    canFuse: false,
    reason: '结构不兼容：投掷臂机制与辅助植物的功能结构无法融合'
  },

  // 辅助类×辅助（功能干扰）
  support_support: {
    canFuse: false,
    reason: '功能干扰：两种辅助功能相互干扰，无法稳定融合'
  },

  // 蘑菇×投掷（菌盖无法支撑投掷臂）
  mushroom_pult: {
    canFuse: false,
    reason: '结构冲突：蘑菇的菌盖无法稳定支撑投掷臂机构'
  },

  // 蘑菇×爆炸（菌丝易燃）
  explosive_mushroom: {
    canFuse: false,
    reason: '菌丝易燃：蘑菇的菌丝组织遇爆炸物质会瞬间燃烧殆尽'
  }
};

// === 特殊失败组合（个别植物对，覆盖类别规则）===
// 这些组合虽然类别允许，但特定植物对会失败
export const SPECIAL_FAILURES = {
  'corn_pult_cob_cannon': '同源冲突：玉米投手与玉米加农炮同源，杂交无新特性',
  'gold_magnet_magnet_shroom': '同源冲突：吸金磁与磁力菇同源，杂交无新特性',
  'spikeweed_spikerock': '同源冲突：地刺与地刺王同源，杂交无新特性',
  'sunflower_twin_sunflower': '同源冲突：向日葵与双子向日葵同源，杂交无新特性',
  'wall_nut_tall_nut': '同源冲突：坚果墙与高坚果同源，杂交无新特性',
  'peashooter_repeater': '同源冲突：豌豆射手与双发射手同源，杂交无新特性',
  'peashooter_gatling_pea': '同源冲突：豌豆射手与机枪射手同源，杂交无新特性',
  'repeater_gatling_pea': '同源冲突：双发射手与机枪射手同源，杂交无新特性',
  'snow_pea_winter_melon': '同源冲突：寒冰射手与冰西瓜同源，冰系基因过度叠加',
  'puff_shroom_fume_shroom': '同源冲突：小喷菇与大喷菇同源，杂交无新特性',
  'doom_shroom_ice_shroom': '元素冲突：毁灭与冰冻相互抵消，无法融合',
  'magnet_shroom_gold_magnet': '同源冲突：磁力菇与吸金磁同源',
  'melon_pult_winter_melon': '同源冲突：西瓜投手与冰西瓜同源',
  'cabbage_pult_kernel_pult': '同源冲突：卷心菜投手与玉米投手同属投掷系'
};

// === 获取植物的类别 ===
export function getPlantCategory(plantId) {
  return PLANT_CATEGORY_MAP[plantId] || null;
}

// === 生成类别组合键名（按字母序排序）===
export function categoryKey(catA, catB) {
  const [a, b] = [catA, catB].sort();
  return `${a}_${b}`;
}

// === 检查两个类别是否可以杂交 ===
export function canCategoriesFuse(catA, catB) {
  const key = categoryKey(catA, catB);
  if (CATEGORY_FUSION_RULES[key]) {
    return CATEGORY_FUSION_RULES[key];
  }
  return { canFuse: true };
}

// === 检查特定植物对是否为特殊失败组合 ===
export function getSpecialFailure(plantAId, plantBId) {
  const [a, b] = [plantAId, plantBId].sort();
  const key = `${a}_${b}`;
  return SPECIAL_FAILURES[key] || null;
}

// === 统计信息 ===
export function getCategoryStats() {
  const stats = {
    totalPlants: 0,
    categories: {},
    failureRules: Object.keys(CATEGORY_FUSION_RULES).length,
    specialFailures: Object.keys(SPECIAL_FAILURES).length
  };

  for (const [catId, cat] of Object.entries(PLANT_CATEGORIES)) {
    stats.categories[catId] = cat.plants.length;
    stats.totalPlants += cat.plants.length;
  }

  return stats;
}
