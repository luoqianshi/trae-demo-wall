import plantData from '../data/plants.js';

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

export class PlantSelect {
  constructor(game) {
    this.game = game;
    this.container = null;
    this.selectedSection = null;
    this.availableSection = null;
    this.selectedPlants = [];
    this.maxSlots = game.maxLoadoutSize || 10;
    this.confirmBtn = null;
    this.createDOM();
  }

  createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'pvz-plant-select';
    Object.assign(this.container.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '720px',
      height: '500px',
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'rgba(0, 0, 0, 0.85)',
      zIndex: '100',
      pointerEvents: 'auto',
      userSelect: 'none',
      fontFamily: 'Arial, sans-serif',
      overflowY: 'auto',
      padding: '10px',
      boxSizing: 'border-box'
    });

    // Title
    const title = document.createElement('div');
    title.textContent = '选择植物';
    Object.assign(title.style, {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: '8px'
    });
    this.container.appendChild(title);

    // Counter
    this.counterText = document.createElement('div');
    this.counterText.textContent = `已选: 0/${this.maxSlots}`;
    Object.assign(this.counterText.style, {
      fontSize: '14px',
      color: '#cccccc',
      marginBottom: '8px'
    });
    this.container.appendChild(this.counterText);

    // Selected section
    const selectedLabel = document.createElement('div');
    selectedLabel.textContent = '已选';
    Object.assign(selectedLabel.style, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#4CAF50',
      alignSelf: 'flex-start',
      marginBottom: '4px'
    });
    this.container.appendChild(selectedLabel);

    this.selectedSection = document.createElement('div');
    Object.assign(this.selectedSection.style, {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      width: '100%',
      minHeight: '90px',
      padding: '6px',
      boxSizing: 'border-box',
      background: 'rgba(76, 175, 80, 0.15)',
      borderRadius: '6px',
      border: '1px dashed rgba(76, 175, 80, 0.4)',
      marginBottom: '12px'
    });
    this.container.appendChild(this.selectedSection);

    // Available section
    const availableLabel = document.createElement('div');
    availableLabel.textContent = '可选';
    Object.assign(availableLabel.style, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff',
      alignSelf: 'flex-start',
      marginBottom: '4px'
    });
    this.container.appendChild(availableLabel);

    this.availableSection = document.createElement('div');
    Object.assign(this.availableSection.style, {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      width: '100%',
      padding: '6px',
      boxSizing: 'border-box',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '6px',
      marginBottom: '12px'
    });
    this.container.appendChild(this.availableSection);

    // Button row
    const btnRow = document.createElement('div');
    Object.assign(btnRow.style, {
      display: 'flex',
      gap: '12px',
      marginTop: '8px'
    });

    // Cancel button
    const cancelBtn = document.createElement('div');
    cancelBtn.textContent = '返回';
    Object.assign(cancelBtn.style, {
      padding: '10px 30px',
      background: '#757575',
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: 'bold',
      borderRadius: '6px',
      cursor: 'pointer',
      border: '2px solid #616161'
    });
    cancelBtn.addEventListener('click', () => this.onCancel());
    btnRow.appendChild(cancelBtn);

    // Confirm button
    this.confirmBtn = document.createElement('div');
    this.confirmBtn.textContent = '确认出战';
    Object.assign(this.confirmBtn.style, {
      padding: '10px 30px',
      background: '#4CAF50',
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: 'bold',
      borderRadius: '6px',
      cursor: 'pointer',
      border: '2px solid #388E3C',
      opacity: '0.5',
      pointerEvents: 'none'
    });
    this.confirmBtn.addEventListener('click', () => this.onConfirm());
    btnRow.appendChild(this.confirmBtn);

    this.container.appendChild(btnRow);
  }

  render() {
    this.selectedPlants = [];
    this.selectedSection.innerHTML = '';
    this.availableSection.innerHTML = '';

    const unlockedPlants = this.game.unlockedPlants || [];
    const hybridPlants = this.game.hybridPlants || [];
    const allPlantIds = [...unlockedPlants];

    // Add hybrid plants
    for (const hybrid of hybridPlants) {
      if (hybrid.id) {
        allPlantIds.push(hybrid.id);
      }
    }

    // 过滤掉库存为0的基础植物（杂交消耗后不可选）
    const lab = this.game.lab;
    const plantInventory = lab ? lab.plantInventory : {};

    for (const plantId of allPlantIds) {
      const data = plantData[plantId];
      if (!data) continue;

      // 基础植物（非杂交、非特殊）需要检查库存
      if (!data.is_hybrid && !data.is_special && data.can_hybridize !== false) {
        const count = plantInventory[plantId];
        if (count !== undefined && count <= 0) continue; // 库存为0，跳过
      }

      const card = this._createPlantCard(data, false);
      this.availableSection.appendChild(card);
    }

    this._updateCounter();
  }

  _createPlantCard(data, isSelected) {
    const card = document.createElement('div');
    const bgColor = GENE_POOL_COLORS[data.gene_pool] || '#666666';

    Object.assign(card.style, {
      width: '80px',
      height: '80px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: bgColor,
      borderRadius: '6px',
      cursor: 'pointer',
      border: isSelected ? '2px solid #FFD700' : '2px solid rgba(255,255,255,0.2)',
      boxSizing: 'border-box',
      transition: 'transform 0.15s, border-color 0.15s',
      position: 'relative'
    });

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'scale(1.05)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'scale(1)';
    });

    // Name
    const nameEl = document.createElement('div');
    nameEl.textContent = data.name_cn;
    Object.assign(nameEl.style, {
      fontSize: '11px',
      fontWeight: 'bold',
      color: '#ffffff',
      textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '72px',
      textAlign: 'center'
    });

    // Cost
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

    card.addEventListener('click', () => {
      this.onPlantClick(data.id);
    });

    card._plantId = data.id;
    return card;
  }

  onPlantClick(plantId) {
    const idx = this.selectedPlants.indexOf(plantId);
    if (idx >= 0) {
      // Deselect
      this.selectedPlants.splice(idx, 1);
    } else {
      // Select
      if (this.selectedPlants.length >= this.maxSlots) return;
      this.selectedPlants.push(plantId);
    }
    this._refreshDisplay();
  }

  _refreshDisplay() {
    // Rebuild selected section
    this.selectedSection.innerHTML = '';
    for (const plantId of this.selectedPlants) {
      const data = plantData[plantId];
      if (!data) continue;
      const card = this._createPlantCard(data, true);
      this.selectedSection.appendChild(card);
    }

    // Update available section card styles
    const availCards = this.availableSection.children;
    for (let i = 0; i < availCards.length; i++) {
      const card = availCards[i];
      const isSelected = this.selectedPlants.includes(card._plantId);
      card.style.borderColor = isSelected ? '#FFD700' : 'rgba(255,255,255,0.2)';
      card.style.opacity = isSelected ? '0.5' : '1';
    }

    this._updateCounter();
  }

  _updateCounter() {
    this.counterText.textContent = `已选: ${this.selectedPlants.length}/${this.maxSlots}`;

    const canConfirm = this.selectedPlants.length > 0;
    if (this.confirmBtn) {
      this.confirmBtn.style.opacity = canConfirm ? '1' : '0.5';
      this.confirmBtn.style.pointerEvents = canConfirm ? 'auto' : 'none';
    }
  }

  onConfirm() {
    if (this.selectedPlants.length === 0) return;

    this.game.loadout = [...this.selectedPlants];
    this.hide();
    this.game.startGame(this.game.mode, this.game.sceneType, this.game.loadout);
  }

  onCancel() {
    this.hide();
    this.game.setState('menu');
  }

  show() {
    this.container.style.display = 'flex';
    this.render();
  }

  hide() {
    this.container.style.display = 'none';
  }
}
