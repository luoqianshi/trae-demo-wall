// 塔模式商店系统
import plantData from '../data/plants.js';
import hybridData from '../data/hybrids.js';
import relicData from '../data/relics.js';

// 商店物品类型
export const SHOP_ITEM_TYPES = {
  PLANT: 'plant',              // 初始植物
  HYBRID: 'hybrid',            // 杂交植物（随机）
  CARD_SLOT: 'card_slot',      // 卡槽扩展
  INITIAL_SUN: 'initial_sun',  // 初始阳光
  ENERGY: 'energy',             // 杂交能源
  RELIC: 'relic'               // 遗物（Phase 5 新增）
};

// 商店配置
export const SHOP_CONFIG = {
  maxItems: 6,                 // 基础区最多6个物品
  hybridItems: 2,              // 杂交植物数量（1-2个）
  refreshCost: 100,            // 基础区刷新花费
  premiumRefreshCost: 200,     // 高级区刷新花费
  premiumRelicCount: 3         // 高级区遗物数量
};

// 生成商店物品（基础区）
export function generateShopItems(floor, game) {
  const items = [];

  // 1. 添加初始植物（前5种基础植物）
  const basicPlants = ['peashooter', 'sunflower', 'wall_nut', 'cherry_bomb', 'potato_mine'];
  basicPlants.forEach(plantId => {
    const plant = plantData[plantId];
    if (plant && !game.unlockedPlants.includes(plantId)) {
      items.push({
        type: SHOP_ITEM_TYPES.PLANT,
        id: plantId,
        name: plant.name_cn,
        cost: plant.unlock_cost || 100,
        description: `解锁${plant.name_cn}`,
        icon: '🌱'
      });
    }
  });

  // 2. 添加杂交植物（随机1-2个，根据楼层品阶）
  const hybridCount = Math.min(SHOP_CONFIG.hybridItems, Math.floor(Math.random() * 2) + 1);
  const availableHybrids = Object.values(hybridData.hybridRecipes || {});

  for (let i = 0; i < hybridCount && availableHybrids.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableHybrids.length);
    const hybrid = availableHybrids[randomIndex];
    availableHybrids.splice(randomIndex, 1);

    // 根据楼层决定能源品阶
    let energyGrade = 'blue';
    if (floor >= 7) energyGrade = 'gold';
    else if (floor >= 4) energyGrade = 'purple';

    const hybridId = `hybrid_${Date.now()}_${i}`;
    items.push({
      type: SHOP_ITEM_TYPES.HYBRID,
      id: hybridId,
      name: hybrid.result.name_cn,
      cost: Math.floor(hybrid.result.cost * 2),
      description: `杂交植物 - ${hybrid.result.special}`,
      icon: '🧬',
      hybridData: hybrid,
      energyGrade: energyGrade
    });
  }

  // 3. 添加卡槽扩展
  if (game.cardSlots < 10) {
    items.push({
      type: SHOP_ITEM_TYPES.CARD_SLOT,
      id: 'card_slot',
      name: '卡槽扩展',
      cost: 500 + (game.cardSlots - 6) * 200,
      description: `增加1个卡槽（当前${game.cardSlots}个）`,
      icon: '🎴'
    });
  }

  // 4. 添加初始阳光
  items.push({
    type: SHOP_ITEM_TYPES.INITIAL_SUN,
    id: 'initial_sun',
    name: '初始阳光',
    cost: 200,
    description: '战斗开始时额外获得50阳光',
    icon: '☀️',
    value: 50
  });

  // 5. 添加杂交能源（根据楼层解锁更高品阶）
  const energyGrades = ['blue', 'purple', 'gold', 'red'];
  const maxGradeIndex = Math.min(Math.floor(floor / 3), 3);

  for (let i = 0; i <= maxGradeIndex; i++) {
    const grade = energyGrades[i];
    const gradeNames = {
      blue: '蓝色能源',
      purple: '紫色能源',
      gold: '金色能源',
      red: '红色能源'
    };
    const costs = { blue: 100, purple: 300, gold: 800, red: 2000 };
    const amounts = { blue: 3, purple: 2, gold: 1, red: 1 };

    items.push({
      type: SHOP_ITEM_TYPES.ENERGY,
      id: `energy_${grade}`,
      name: gradeNames[grade],
      cost: costs[grade],
      description: `获得${amounts[grade]}点${gradeNames[grade]}`,
      icon: '⚡',
      energyGrade: grade,
      amount: amounts[grade]
    });
  }

  // 限制物品数量
  return items.slice(0, SHOP_CONFIG.maxItems);
}

// 生成商店遗物（高级区，Phase 5 新增）
// 高级区只卖遗物，品阶随楼层提升：floor 1-3 basic, 4-6 elite, 7+ leader
export function generateShopRelics(floor, game) {
  if (!relicData || !game.relics) return [];

  // 确定本层遗物品阶范围
  let allowedTiers;
  if (floor >= 7) {
    allowedTiers = ['leader', 'elite'];
  } else if (floor >= 4) {
    allowedTiers = ['elite', 'basic'];
  } else {
    allowedTiers = ['basic'];
  }

  const owned = new Set(game.relics);
  const candidates = relicData.filter(r => {
    if (owned.has(r.id)) return false;
    if (r.dropRate === 'unique') return false;  // unique 遗物不在商店出售
    return allowedTiers.includes(r.tier);
  });

  if (candidates.length === 0) return [];

  // 随机选 N 个不重复遗物
  const count = Math.min(SHOP_CONFIG.premiumRelicCount, candidates.length);
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(r => ({
    type: SHOP_ITEM_TYPES.RELIC,
    id: r.id,
    name: r.name_cn,
    cost: r.cost,
    description: r.description,
    icon: '🗿',
    tier: r.tier,
    relicData: r
  }));
}

// 购买商店物品
export function purchaseShopItem(item, game) {
  // 应用 shop_discount 遗物加成（bargain_book 等）
  const discount = (game._getShopDiscount && game._getShopDiscount()) || 0;
  const effectiveCost = Math.max(0, Math.round(item.cost * (1 - discount)));
  if (game.coins < effectiveCost) {
    return { success: false, message: '金币不足' };
  }

  // 扣除金币（使用遗物减免后的价格）
  game.coins -= effectiveCost;

  switch (item.type) {
    case SHOP_ITEM_TYPES.PLANT:
      if (!game.unlockedPlants.includes(item.id)) {
        game.unlockedPlants.push(item.id);
        return { success: true, message: `已解锁${item.name}` };
      }
      return { success: false, message: '已拥有该植物' };

    case SHOP_ITEM_TYPES.HYBRID:
      // 将杂交植物添加到库存
      if (!game.hybridPlants) game.hybridPlants = [];
      game.hybridPlants.push({
        id: item.id,
        name: item.name,
        data: item.hybridData.result,
        energyGrade: item.energyGrade
      });
      return { success: true, message: `已获得杂交植物${item.name}` };

    case SHOP_ITEM_TYPES.CARD_SLOT:
      if (game.cardSlots < 10) {
        game.cardSlots++;
        return { success: true, message: `卡槽增加到${game.cardSlots}个` };
      }
      return { success: false, message: '已达最大卡槽数' };

    case SHOP_ITEM_TYPES.INITIAL_SUN:
      // 记录初始阳光加成
      if (!game.initialSunBonus) game.initialSunBonus = 0;
      game.initialSunBonus += item.value;
      return { success: true, message: `战斗开始时将额外获得${item.value}阳光` };

    case SHOP_ITEM_TYPES.ENERGY:
      // 添加能源
      if (!game.energy) game.energy = { blue: 0, purple: 0, gold: 0, red: 0 };
      game.energy[item.energyGrade] = (game.energy[item.energyGrade] || 0) + item.amount;
      return { success: true, message: `获得${item.amount}点${item.name}` };

    case SHOP_ITEM_TYPES.RELIC:
      // 高级区遗物购买：添加到 relics 列表
      if (!game.relics) game.relics = [];
      if (game.relics.includes(item.id)) {
        return { success: false, message: '已拥有该遗物' };
      }
      game.relics.push(item.id);
      return { success: true, message: `获得遗物：${item.name}` };

    default:
      return { success: false, message: '未知物品类型' };
  }
}
