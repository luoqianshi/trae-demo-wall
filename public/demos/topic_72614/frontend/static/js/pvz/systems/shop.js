import relicData from '../data/relics.js';
import plantData from '../data/plants.js';

const CARD_SLOT_COST = 500;
const MAX_CARD_SLOTS = 10;
const DEFAULT_CARD_SLOTS = 6;

export class Shop {
  constructor(game) {
    this.game = game;
    this.items = {
      relics: [],
      plantUnlocks: [],
      cardSlots: 0
    };
    this.ownedRelics = [];
    this.unlockedPlants = [];
    this.maxCardSlots = DEFAULT_CARD_SLOTS;
    this.refreshShop();
  }

  refreshShop() {
    this.items.relics = this.getAvailableRelics();
    this.items.plantUnlocks = this.getAvailablePlants();
  }

  buyItem(itemId) {
    const relic = relicData.find(r => r.id === itemId);
    if (relic) {
      return this._buyRelic(relic);
    }

    const plant = Object.values(plantData).find(p => p.id === itemId);
    if (plant && plant.unlock_cost > 0) {
      return this._buyPlantUnlock(plant);
    }

    if (itemId === 'card_slot') {
      return this._buyCardSlot();
    }

    return { success: false, reason: '物品不存在' };
  }

  _buyRelic(relic) {
    if (this.ownedRelics.includes(relic.id)) {
      return { success: false, reason: '已拥有该遗物' };
    }
    if (!this.game || !this.game.economy) {
      return { success: false, reason: '经济系统未初始化' };
    }
    // 应用 shop_discount 遗物加成（bargain_book 等）
    const discount = (this.game._getShopDiscount && this.game._getShopDiscount()) || 0;
    const effectiveCost = Math.max(0, Math.round(relic.cost * (1 - discount)));
    if (!this.game.economy.spendCoins(effectiveCost)) {
      return { success: false, reason: '金币不足' };
    }
    this.ownedRelics.push(relic.id);
    this.refreshShop();
    return { success: true, item: relic };
  }

  _buyPlantUnlock(plant) {
    if (this.unlockedPlants.includes(plant.id)) {
      return { success: false, reason: '已解锁该植物' };
    }
    if (!this.game || !this.game.economy) {
      return { success: false, reason: '经济系统未初始化' };
    }
    if (!this.game.economy.spendCoins(plant.unlock_cost)) {
      return { success: false, reason: '金币不足' };
    }
    this.unlockedPlants.push(plant.id);
    this.refreshShop();
    return { success: true, item: plant };
  }

  _buyCardSlot() {
    const currentSlots = this.game.cardSlots || DEFAULT_CARD_SLOTS;
    if (currentSlots >= MAX_CARD_SLOTS) {
      return { success: false, reason: '已达到最大卡槽数量' };
    }
    const cost = this.getCardSlotCost();
    if (!this.game || !this.game.economy) {
      return { success: false, reason: '经济系统未初始化' };
    }
    if (!this.game.economy.spendCoins(cost)) {
      return { success: false, reason: '金币不足' };
    }
    this.game.cardSlots = currentSlots + 1;
    this.maxCardSlots = this.game.cardSlots;
    return { success: true, item: { id: 'card_slot', cost, newMax: this.game.cardSlots } };
  }

  getAvailableRelics() {
    return relicData.filter(r => !this.ownedRelics.includes(r.id));
  }

  getAvailablePlants() {
    return Object.values(plantData).filter(p =>
      p.unlock_cost > 0 && !this.unlockedPlants.includes(p.id)
    );
  }

  getCardSlotCost() {
    const currentSlots = this.game.cardSlots || DEFAULT_CARD_SLOTS;
    const extraSlots = currentSlots - DEFAULT_CARD_SLOTS;
    return CARD_SLOT_COST + extraSlots * 200;
  }

  canAfford(itemId) {
    if (!this.game || !this.game.economy) return false;

    if (itemId === 'card_slot') {
      return this.game.economy.canAffordCoins(this.getCardSlotCost());
    }

    const relic = relicData.find(r => r.id === itemId);
    if (relic) {
      return this.game.economy.canAffordCoins(relic.cost);
    }

    const plant = Object.values(plantData).find(p => p.id === itemId);
    if (plant && plant.unlock_cost > 0) {
      return this.game.economy.canAffordCoins(plant.unlock_cost);
    }

    return false;
  }

  serialize() {
    return {
      ownedRelics: [...this.ownedRelics],
      unlockedPlants: [...this.unlockedPlants],
      maxCardSlots: this.maxCardSlots
    };
  }

  deserialize(data) {
    this.ownedRelics = data.ownedRelics || [];
    this.unlockedPlants = data.unlockedPlants || [];
    // cardSlots 由 game.cardSlots 管理，shop 不再独立维护
    this.maxCardSlots = this.game.cardSlots || DEFAULT_CARD_SLOTS;
    this.refreshShop();
  }
}
