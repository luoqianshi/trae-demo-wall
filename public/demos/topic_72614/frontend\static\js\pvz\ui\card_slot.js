import plantData from '../data/plants.js';

const CARD_WIDTH = 60;
const CARD_HEIGHT = 70;

const GENE_POOL_COLORS = {
  pea: '#4CAF50',
  photosynthesis: '#FFD700',
  ice: '#42A5F5',
  spike: '#8D6E63',
  fire: '#FF5722',
  catapult: '#AB47BC',
  explosive: '#FF9800',
  charm: '#EC407A',
  devour: '#7E57C2',
  magnetic: '#78909C',
  defense: '#8BC34A',
  poison: '#66BB6A',
  flight: '#29B6F6',
  support: '#26A69A',
  aquatic: '#00BCD4',
  special: '#FFC107'
};

export class CardSlot {
  constructor(game) {
    this.game = game;
    this.container = null;
    this.cardSlots = [];
    this.selectedSlot = -1;
    this.maxSlots = game.cardSlots || 6;
    this.cardElements = [];
    this.createDOM();
  }

  createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'pvz-card-slot';
    Object.assign(this.container.style, {
      position: 'absolute',
      top: '100px',
      left: '0',
      width: '720px',
      height: `${CARD_HEIGHT + 10}px`,
      display: 'flex',
      alignItems: 'center',
      padding: '5px 10px',
      boxSizing: 'border-box',
      gap: '4px',
      background: 'rgba(0, 0, 0, 0.4)',
      zIndex: '9',
      pointerEvents: 'auto',
      userSelect: 'none',
      fontFamily: 'Arial, sans-serif',
      overflowX: 'auto'
    });
  }

  renderCards(loadout) {
    // Clear existing cards
    this.container.innerHTML = '';
    this.cardElements = [];
    this.cardSlots = [];
    this.selectedSlot = -1;

    const plants = loadout || this.game.loadout || [];
    // 战斗中只显示 cardSlots 数量的卡槽（其余为预备槽位，通过商店升级解锁）
    const maxSlots = this.game.cardSlots || 6;

    for (let i = 0; i < Math.min(plants.length, maxSlots); i++) {
      const plantId = plants[i];
      const data = plantData[plantId];
      if (!data) continue;

      const slot = {
        plantId,
        cooldownRemaining: 0,
        isAvailable: true
      };
      this.cardSlots.push(slot);

      const card = this._createCard(slot, data, i);
      this.cardElements.push(card);
      this.container.appendChild(card);
    }
  }

  _createCard(slot, data, index) {
    const card = document.createElement('div');
    card.dataset.index = index;
    const bgColor = GENE_POOL_COLORS[data.gene_pool] || '#666666';

    Object.assign(card.style, {
      width: `${CARD_WIDTH}px`,
      height: `${CARD_HEIGHT}px`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: bgColor,
      borderRadius: '4px',
      cursor: 'pointer',
      position: 'relative',
      border: '2px solid rgba(255,255,255,0.3)',
      boxSizing: 'border-box',
      transition: 'border-color 0.15s, opacity 0.15s',
      overflow: 'hidden'
    });

    // Plant name
    const nameEl = document.createElement('div');
    nameEl.textContent = data.name_cn;
    Object.assign(nameEl.style, {
      fontSize: '10px',
      fontWeight: 'bold',
      color: '#ffffff',
      textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '54px',
      textAlign: 'center'
    });

    // Sun cost
    const costEl = document.createElement('div');
    costEl.textContent = `☀${data.cost}`;
    Object.assign(costEl.style, {
      fontSize: '10px',
      color: '#FFD700',
      fontWeight: 'bold',
      marginTop: '2px'
    });

    card.appendChild(nameEl);
    card.appendChild(costEl);

    // Cooldown overlay
    const cooldownOverlay = document.createElement('div');
    Object.assign(cooldownOverlay.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '0%',
      background: 'rgba(0, 0, 0, 0.6)',
      transition: 'height 0.1s linear',
      pointerEvents: 'none'
    });
    card.appendChild(cooldownOverlay);

    // Unavailable overlay (insufficient sun)
    const unavailOverlay = document.createElement('div');
    Object.assign(unavailOverlay.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.45)',
      display: 'none',
      pointerEvents: 'none'
    });
    card.appendChild(unavailOverlay);

    // Click handler
    card.addEventListener('click', () => {
      this.onCardClick(index);
    });

    // Store references
    card._cooldownOverlay = cooldownOverlay;
    card._unavailOverlay = unavailOverlay;
    card._slotData = slot;

    return card;
  }

  update(deltaTime) {
    const dt = deltaTime / 1000;

    for (let i = 0; i < this.cardSlots.length; i++) {
      const slot = this.cardSlots[i];
      const card = this.cardElements[i];
      if (!card) continue;

      // Update cooldown
      if (slot.cooldownRemaining > 0) {
        slot.cooldownRemaining -= dt;
        if (slot.cooldownRemaining <= 0) {
          slot.cooldownRemaining = 0;
          slot.isAvailable = true;
        }
      }

      // Update cooldown overlay
      const data = plantData[slot.plantId];
      if (data && data.cooldown > 0) {
        const pct = Math.min(100, (slot.cooldownRemaining / data.cooldown) * 100);
        card._cooldownOverlay.style.height = `${pct}%`;
      } else {
        card._cooldownOverlay.style.height = '0%';
      }

      // Update sun affordability overlay
      const canAfford = this.game.sun >= (data ? data.cost : 0);
      card._unavailOverlay.style.display = canAfford ? 'none' : 'block';

      // Update selected highlight
      if (i === this.selectedSlot) {
        card.style.borderColor = '#FFD700';
        card.style.boxShadow = '0 0 8px rgba(255, 215, 0, 0.6)';
      } else {
        card.style.borderColor = 'rgba(255,255,255,0.3)';
        card.style.boxShadow = 'none';
      }
    }
  }

  selectCard(index) {
    if (index < 0 || index >= this.cardSlots.length) return;
    const slot = this.cardSlots[index];
    if (!slot.isAvailable) return;

    const data = plantData[slot.plantId];
    if (data && this.game.sun < data.cost) return;

    this.selectedSlot = index;
    if (this.game.input) {
      this.game.input.selectPlant(slot.plantId);
    }
  }

  deselectCard() {
    this.selectedSlot = -1;
    if (this.game.input) {
      this.game.input.deselectPlant();
    }
  }

  onCardClick(index) {
    if (index === this.selectedSlot) {
      this.deselectCard();
    } else {
      this.selectCard(index);
    }
  }

  setCooldown(plantId, duration) {
    for (let i = 0; i < this.cardSlots.length; i++) {
      if (this.cardSlots[i].plantId === plantId) {
        this.cardSlots[i].cooldownRemaining = duration;
        this.cardSlots[i].isAvailable = false;
        break;
      }
    }
  }

  show() {
    this.container.style.display = 'flex';
  }

  hide() {
    this.container.style.display = 'none';
  }
}
