export class ItemSystem {
  constructor(game) {
    this.game = game;
    this.items = [];
    this.maxItems = 2;
    
    this.itemTypes = {
      brush: { id: 'brush', name: '一笔描摹', icon: '✒️', effect: 'autoComplete' },
      weaken: { id: 'weaken', name: '弱化妖力', icon: '💀', effect: 'bossHp1' },
      doubleScore: { id: 'doubleScore', name: '双倍积分', icon: '✨', effect: 'doubleScore' },
      doubleReward: { id: 'doubleReward', name: '双倍道具', icon: '🎁', effect: 'doubleReward' },
    };
  }

  addItem(itemId) {
    if (this.items.length >= this.maxItems) return false;
    if (this.items.includes(itemId)) return false;
    
    this.items.push(itemId);
    this.updateUI();
    return true;
  }

  removeItem(itemId) {
    const index = this.items.indexOf(itemId);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.updateUI();
    }
  }

  hasItem(itemId) {
    return this.items.includes(itemId);
  }

  canAddItem(itemId) {
    return this.items.length < this.maxItems && !this.items.includes(itemId);
  }

  getRandomReward() {
    const keys = Object.keys(this.itemTypes);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return this.itemTypes[randomKey];
  }

  useItem(itemId) {
    const item = this.itemTypes[itemId];
    if (!item) return;
    
    switch (item.effect) {
      case 'autoComplete':
        this.game.drawModal.autoComplete = true;
        break;
      case 'bossHp1':
        this.game.monsters.forEach(m => {
          if (m.isBoss) m.hp = 1;
        });
        break;
      case 'doubleScore':
        this.game.score *= 2;
        this.game.hud.updateScore();
        break;
      case 'doubleReward':
        break;
    }
    
    this.removeItem(itemId);
  }

  clear() {
    this.items = [];
    this.updateUI();
  }

  updateUI() {
    const slots = document.querySelectorAll('.item-slot');
    slots.forEach((slot, index) => {
      const itemId = this.items[index];
      if (itemId) {
        slot.textContent = this.itemTypes[itemId].icon;
        slot.dataset.item = itemId;
      } else {
        slot.textContent = '';
        slot.dataset.item = 'null';
      }
    });
  }
}