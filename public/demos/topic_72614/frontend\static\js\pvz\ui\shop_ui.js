import plantData from '../data/plants.js';
import relicData from '../data/relics.js';

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

const TIER_COLORS = {
  basic: '#4CAF50',
  elite: '#AB47BC',
  leader: '#FF9800',
  special: '#FF5722'
};

const TAB_IDS = ['relics', 'plants', 'cardSlots'];
const TAB_NAMES = {
  relics: '遗物',
  plants: '植物',
  cardSlots: '卡槽'
};

export class ShopUI {
  constructor(game) {
    this.game = game;
    this.container = null;
    this.activeTab = 'relics';
    this.tabBtns = {};
    this.tabPanels = {};
    this.coinsDisplay = null;
    this.createDOM();
  }

  createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'pvz-shop-ui';
    Object.assign(this.container.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '720px',
      height: '500px',
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'rgba(10, 10, 30, 0.92)',
      zIndex: '100',
      pointerEvents: 'auto',
      userSelect: 'none',
      fontFamily: 'Arial, sans-serif',
      overflowY: 'auto',
      padding: '10px',
      boxSizing: 'border-box'
    });

    // Header: title + coins
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: '10px'
    });

    const title = document.createElement('div');
    title.textContent = '商店';
    Object.assign(title.style, {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#FFA500'
    });
    header.appendChild(title);

    const coinsBox = document.createElement('div');
    Object.assign(coinsBox.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    });

    const coinIcon = document.createElement('span');
    coinIcon.textContent = '🪙';
    coinIcon.style.fontSize = '18px';

    this.coinsDisplay = document.createElement('span');
    this.coinsDisplay.textContent = '0';
    Object.assign(this.coinsDisplay.style, {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#FFA500'
    });

    coinsBox.appendChild(coinIcon);
    coinsBox.appendChild(this.coinsDisplay);
    header.appendChild(coinsBox);
    this.container.appendChild(header);

    // Tab navigation
    const tabBar = document.createElement('div');
    Object.assign(tabBar.style, {
      display: 'flex',
      gap: '4px',
      width: '100%',
      marginBottom: '10px'
    });

    for (const tabId of TAB_IDS) {
      const tabBtn = document.createElement('div');
      tabBtn.textContent = TAB_NAMES[tabId];
      Object.assign(tabBtn.style, {
        flex: '1',
        padding: '8px 0',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.1)',
        color: '#cccccc',
        fontSize: '14px',
        fontWeight: 'bold',
        borderRadius: '4px 4px 0 0',
        cursor: 'pointer',
        border: '2px solid transparent',
        borderBottom: 'none',
        transition: 'background 0.15s, color 0.15s'
      });

      tabBtn.addEventListener('click', () => this._switchTab(tabId));
      this.tabBtns[tabId] = tabBtn;
      tabBar.appendChild(tabBtn);
    }
    this.container.appendChild(tabBar);

    // Tab content area
    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, {
      width: '100%',
      flex: '1',
      position: 'relative',
      minHeight: '300px'
    });

    // Relics panel
    this.tabPanels.relics = document.createElement('div');
    Object.assign(this.tabPanels.relics.style, {
      display: 'none',
      flexWrap: 'wrap',
      gap: '8px',
      width: '100%',
      boxSizing: 'border-box',
      padding: '8px',
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '0 0 6px 6px'
    });
    contentArea.appendChild(this.tabPanels.relics);

    // Plants panel
    this.tabPanels.plants = document.createElement('div');
    Object.assign(this.tabPanels.plants.style, {
      display: 'none',
      flexWrap: 'wrap',
      gap: '8px',
      width: '100%',
      boxSizing: 'border-box',
      padding: '8px',
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '0 0 6px 6px'
    });
    contentArea.appendChild(this.tabPanels.plants);

    // Card slots panel
    this.tabPanels.cardSlots = document.createElement('div');
    Object.assign(this.tabPanels.cardSlots.style, {
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
      boxSizing: 'border-box',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '0 0 6px 6px'
    });
    contentArea.appendChild(this.tabPanels.cardSlots);

    this.container.appendChild(contentArea);

    // Back button
    const backBtn = document.createElement('div');
    backBtn.textContent = '返回';
    Object.assign(backBtn.style, {
      padding: '10px 30px',
      background: '#757575',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: 'bold',
      borderRadius: '6px',
      cursor: 'pointer',
      border: '2px solid #616161',
      marginTop: '10px'
    });
    backBtn.addEventListener('click', () => this._onBack());
    this.container.appendChild(backBtn);

    // Default tab
    this._switchTab('relics');
  }

  _switchTab(tabId) {
    this.activeTab = tabId;

    // Update tab button styles
    for (const id of TAB_IDS) {
      const btn = this.tabBtns[id];
      if (id === tabId) {
        btn.style.background = 'rgba(255, 255, 255, 0.15)';
        btn.style.color = '#ffffff';
        btn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      } else {
        btn.style.background = 'rgba(255, 255, 255, 0.1)';
        btn.style.color = '#cccccc';
        btn.style.borderColor = 'transparent';
      }
    }

    // Show/hide panels
    for (const id of TAB_IDS) {
      const panel = this.tabPanels[id];
      panel.style.display = id === tabId ? 'flex' : 'none';
    }

    // Refresh content for active tab
    this.refresh();
  }

  refresh() {
    // Update coins display
    const coins = this.game.coins || 0;
    if (this.coinsDisplay) {
      this.coinsDisplay.textContent = String(coins);
    }

    // Refresh active tab content
    switch (this.activeTab) {
      case 'relics':
        this._renderRelics();
        break;
      case 'plants':
        this._renderPlants();
        break;
      case 'cardSlots':
        this._renderCardSlots();
        break;
    }
  }

  _renderRelics() {
    const panel = this.tabPanels.relics;
    panel.innerHTML = '';

    const ownedRelics = (this.game.shop && this.game.shop.ownedRelics) || [];
    const availableRelics = relicData.filter(r => !ownedRelics.includes(r.id));

    if (availableRelics.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.textContent = '所有遗物已拥有';
      Object.assign(emptyMsg.style, {
        color: '#999999',
        fontSize: '14px',
        padding: '20px',
        width: '100%',
        textAlign: 'center'
      });
      panel.appendChild(emptyMsg);
      return;
    }

    for (const relic of availableRelics) {
      const card = this._createRelicCard(relic);
      panel.appendChild(card);
    }
  }

  _createRelicCard(relic) {
    const card = document.createElement('div');
    const tierColor = TIER_COLORS[relic.tier] || '#666666';

    Object.assign(card.style, {
      width: '160px',
      padding: '10px',
      background: 'rgba(255, 255, 255, 0.06)',
      borderRadius: '6px',
      border: `2px solid ${tierColor}`,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    });

    // Name
    const nameEl = document.createElement('div');
    nameEl.textContent = relic.name_cn;
    Object.assign(nameEl.style, {
      fontSize: '14px',
      fontWeight: 'bold',
      color: tierColor
    });
    card.appendChild(nameEl);

    // Description
    const descEl = document.createElement('div');
    descEl.textContent = relic.description;
    Object.assign(descEl.style, {
      fontSize: '11px',
      color: '#cccccc',
      lineHeight: '1.4'
    });
    card.appendChild(descEl);

    // Price + Buy button
    const priceRow = document.createElement('div');
    Object.assign(priceRow.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: '4px'
    });

    const priceEl = document.createElement('span');
    priceEl.textContent = `🪙 ${relic.cost}`;
    Object.assign(priceEl.style, {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#FFA500'
    });
    priceRow.appendChild(priceEl);

    const buyBtn = document.createElement('div');
    buyBtn.textContent = '购买';
    Object.assign(buyBtn.style, {
      padding: '4px 12px',
      background: '#4CAF50',
      color: '#ffffff',
      fontSize: '12px',
      fontWeight: 'bold',
      borderRadius: '4px',
      cursor: 'pointer',
      border: '1px solid #388E3C'
    });
    buyBtn.addEventListener('click', () => this.onBuyRelic(relic.id));
    priceRow.appendChild(buyBtn);

    card.appendChild(priceRow);
    return card;
  }

  _renderPlants() {
    const panel = this.tabPanels.plants;
    panel.innerHTML = '';

    const unlockedPlants = this.game.unlockedPlants || [];
    const buyablePlants = Object.values(plantData).filter(
      p => p.unlock_cost > 0 && !unlockedPlants.includes(p.id)
    );

    if (buyablePlants.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.textContent = '所有植物已解锁';
      Object.assign(emptyMsg.style, {
        color: '#999999',
        fontSize: '14px',
        padding: '20px',
        width: '100%',
        textAlign: 'center'
      });
      panel.appendChild(emptyMsg);
      return;
    }

    for (const plant of buyablePlants) {
      const card = this._createPlantCard(plant);
      panel.appendChild(card);
    }
  }

  _createPlantCard(plant) {
    const card = document.createElement('div');
    const bgColor = GENE_POOL_COLORS[plant.gene_pool] || '#666666';

    Object.assign(card.style, {
      width: '130px',
      padding: '8px',
      background: bgColor,
      borderRadius: '6px',
      border: '2px solid rgba(255,255,255,0.2)',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px'
    });

    // Name
    const nameEl = document.createElement('div');
    nameEl.textContent = plant.name_cn;
    Object.assign(nameEl.style, {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#ffffff',
      textShadow: '1px 1px 2px rgba(0,0,0,0.6)'
    });
    card.appendChild(nameEl);

    // Category
    const catEl = document.createElement('div');
    catEl.textContent = plant.category;
    Object.assign(catEl.style, {
      fontSize: '10px',
      color: 'rgba(255,255,255,0.7)'
    });
    card.appendChild(catEl);

    // Price + Buy
    const priceRow = document.createElement('div');
    Object.assign(priceRow.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: '2px'
    });

    const priceEl = document.createElement('span');
    priceEl.textContent = `🪙 ${plant.unlock_cost}`;
    Object.assign(priceEl.style, {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#FFD700'
    });
    priceRow.appendChild(priceEl);

    const buyBtn = document.createElement('div');
    buyBtn.textContent = '购买';
    Object.assign(buyBtn.style, {
      padding: '3px 10px',
      background: '#4CAF50',
      color: '#ffffff',
      fontSize: '11px',
      fontWeight: 'bold',
      borderRadius: '3px',
      cursor: 'pointer',
      border: '1px solid #388E3C'
    });
    buyBtn.addEventListener('click', () => this.onBuyPlant(plant.id));
    priceRow.appendChild(buyBtn);

    card.appendChild(priceRow);
    return card;
  }

  _renderCardSlots() {
    const panel = this.tabPanels.cardSlots;
    panel.innerHTML = '';

    const currentSlots = this.game.cardSlots || 6;
    const maxSlots = 10;
    const cost = this.game.shop ? this.game.shop.getCardSlotCost() : 500;

    // Current slots display
    const slotsInfo = document.createElement('div');
    slotsInfo.innerHTML = `
      <div style="font-size:18px;color:#ffffff;font-weight:bold;margin-bottom:8px;">卡槽信息</div>
      <div style="font-size:14px;color:#cccccc;">当前卡槽: <span style="color:#4CAF50;font-weight:bold;">${currentSlots}</span></div>
      <div style="font-size:14px;color:#cccccc;">最大卡槽: <span style="color:#FF9800;font-weight:bold;">${maxSlots}</span></div>
    `;
    panel.appendChild(slotsInfo);

    // Visual slot display
    const slotsVisual = document.createElement('div');
    Object.assign(slotsVisual.style, {
      display: 'flex',
      gap: '4px',
      flexWrap: 'wrap',
      justifyContent: 'center',
      margin: '12px 0'
    });

    for (let i = 0; i < maxSlots; i++) {
      const slotBox = document.createElement('div');
      Object.assign(slotBox.style, {
        width: '36px',
        height: '36px',
        borderRadius: '4px',
        border: '2px solid',
        borderColor: i < currentSlots ? '#4CAF50' : '#555555',
        background: i < currentSlots ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        color: i < currentSlots ? '#4CAF50' : '#555555'
      });
      slotBox.textContent = i < currentSlots ? '✓' : '🔒';
      slotsVisual.appendChild(slotBox);
    }
    panel.appendChild(slotsVisual);

    // Buy button
    if (currentSlots < maxSlots) {
      const buyRow = document.createElement('div');
      Object.assign(buyRow.style, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px'
      });

      const costText = document.createElement('div');
      costText.textContent = `购买一个卡槽: 🪙 ${cost}`;
      Object.assign(costText.style, {
        fontSize: '14px',
        color: '#FFA500',
        fontWeight: 'bold'
      });
      buyRow.appendChild(costText);

      const buyBtn = document.createElement('div');
      buyBtn.textContent = '购买卡槽';
      Object.assign(buyBtn.style, {
        padding: '10px 30px',
        background: '#4CAF50',
        color: '#ffffff',
        fontSize: '16px',
        fontWeight: 'bold',
        borderRadius: '6px',
        cursor: 'pointer',
        border: '2px solid #388E3C'
      });
      buyBtn.addEventListener('click', () => this.onBuyCardSlot());
      buyRow.appendChild(buyBtn);

      panel.appendChild(buyRow);
    } else {
      const maxMsg = document.createElement('div');
      maxMsg.textContent = '已达到最大卡槽数量';
      Object.assign(maxMsg.style, {
        fontSize: '14px',
        color: '#999999',
        marginTop: '8px'
      });
      panel.appendChild(maxMsg);
    }
  }

  onBuyRelic(relicId) {
    if (!this.game.shop) return;
    const result = this.game.shop.buyItem(relicId);
    if (result.success) {
      if (this.game.relics) {
        this.game.relics.push(relicId);
      }
    }
    this.refresh();
  }

  onBuyPlant(plantId) {
    if (!this.game.shop) return;
    const result = this.game.shop.buyItem(plantId);
    if (result.success) {
      if (!this.game.unlockedPlants.includes(plantId)) {
        this.game.unlockedPlants.push(plantId);
      }
    }
    this.refresh();
  }

  onBuyCardSlot() {
    if (!this.game.shop) return;
    const result = this.game.shop.buyItem('card_slot');
    if (result.success) {
      this.game.cardSlots = result.item.newMax;
    }
    this.refresh();
  }

  _onBack() {
    this.hide();
    this.game.setState('menu');
  }

  show() {
    this.container.style.display = 'flex';
    this.refresh();
  }

  hide() {
    this.container.style.display = 'none';
  }
}
