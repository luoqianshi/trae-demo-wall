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

const ENERGY_COLORS = {
  blue: '#42A5F5',
  purple: '#AB47BC',
  gold: '#FFD700',
  red: '#FF5722'
};

const ENERGY_NAMES = {
  blue: '蓝色',
  purple: '紫色',
  gold: '金色',
  red: '红色'
};

export class HybridUI {
  constructor(game) {
    this.game = game;
    this.container = null;
    this.fusionPlants = [];
    this.selectedEnergy = null;
    this.result = null;
    this.plantGrid = null;
    this.energyBtns = {};
    this.resultPanel = null;
    this.mutationPanel = null;
    this.fuseBtn = null;
    this.confirmBtn = null;
    this.createDOM();
  }

  createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'pvz-hybrid-ui';
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

    // Title
    const title = document.createElement('div');
    title.textContent = '杂交实验室';
    Object.assign(title.style, {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#AB47BC',
      marginBottom: '10px',
      textShadow: '0 0 10px rgba(171, 71, 188, 0.5)'
    });
    this.container.appendChild(title);

    // === Select Plants Section ===
    const plantSection = this._createSection('选择植物');
    this.container.appendChild(plantSection.label);

    // Fusion slots display
    this.fusionSlotsDisplay = document.createElement('div');
    Object.assign(this.fusionSlotsDisplay.style, {
      display: 'flex',
      gap: '6px',
      marginBottom: '8px',
      minHeight: '50px',
      padding: '4px',
      background: 'rgba(171, 71, 188, 0.1)',
      borderRadius: '4px',
      border: '1px dashed rgba(171, 71, 188, 0.3)',
      width: '100%',
      boxSizing: 'border-box'
    });
    plantSection.content.appendChild(this.fusionSlotsDisplay);

    // Plant grid
    this.plantGrid = document.createElement('div');
    Object.assign(this.plantGrid.style, {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      maxHeight: '120px',
      overflowY: 'auto',
      width: '100%',
      boxSizing: 'border-box'
    });
    plantSection.content.appendChild(this.plantGrid);
    this.container.appendChild(plantSection.content);

    // === Select Energy Section ===
    const energySection = this._createSection('选择能源');
    this.container.appendChild(energySection.label);

    const energyRow = document.createElement('div');
    Object.assign(energyRow.style, {
      display: 'flex',
      gap: '8px',
      marginBottom: '4px'
    });

    for (const grade of ['blue', 'purple', 'gold', 'red']) {
      const btn = document.createElement('div');
      btn.textContent = `${ENERGY_NAMES[grade]}能源`;
      Object.assign(btn.style, {
        padding: '8px 14px',
        background: ENERGY_COLORS[grade],
        color: '#ffffff',
        fontSize: '13px',
        fontWeight: 'bold',
        borderRadius: '4px',
        cursor: 'pointer',
        border: '2px solid transparent',
        transition: 'border-color 0.15s, opacity 0.15s',
        opacity: '0.7'
      });

      const countSpan = document.createElement('span');
      countSpan.textContent = ' (0)';
      countSpan.style.fontSize = '11px';
      btn.appendChild(countSpan);
      btn._countSpan = countSpan;
      btn._grade = grade;

      btn.addEventListener('click', () => this.onEnergySelect(grade));
      btn.addEventListener('mouseenter', () => {
        btn.style.opacity = '1';
      });
      btn.addEventListener('mouseleave', () => {
        if (this.selectedEnergy !== grade) btn.style.opacity = '0.7';
      });

      this.energyBtns[grade] = btn;
      energyRow.appendChild(btn);
    }

    energySection.content.appendChild(energyRow);
    this.container.appendChild(energySection.content);

    // === Result Section ===
    const resultSection = this._createSection('融合结果');
    this.container.appendChild(resultSection.label);

    this.resultPanel = document.createElement('div');
    Object.assign(this.resultPanel.style, {
      width: '100%',
      minHeight: '60px',
      padding: '8px',
      boxSizing: 'border-box',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '6px',
      color: '#cccccc',
      fontSize: '13px',
      lineHeight: '1.6'
    });
    this.resultPanel.textContent = '等待融合...';
    resultSection.content.appendChild(this.resultPanel);
    this.container.appendChild(resultSection.content);

    // === Mutation Info Section ===
    const mutationSection = this._createSection('变异信息');
    this.container.appendChild(mutationSection.label);

    this.mutationPanel = document.createElement('div');
    Object.assign(this.mutationPanel.style, {
      width: '100%',
      minHeight: '40px',
      padding: '8px',
      boxSizing: 'border-box',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '6px',
      color: '#cccccc',
      fontSize: '13px',
      lineHeight: '1.6'
    });
    this.mutationPanel.textContent = '无变异';
    mutationSection.content.appendChild(this.mutationPanel);
    this.container.appendChild(mutationSection.content);

    // === Button Row ===
    const btnRow = document.createElement('div');
    Object.assign(btnRow.style, {
      display: 'flex',
      gap: '12px',
      marginTop: '10px'
    });

    // Back button
    const backBtn = document.createElement('div');
    backBtn.textContent = '返回';
    Object.assign(backBtn.style, {
      padding: '10px 24px',
      background: '#757575',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: 'bold',
      borderRadius: '6px',
      cursor: 'pointer',
      border: '2px solid #616161'
    });
    backBtn.addEventListener('click', () => this._onBack());
    btnRow.appendChild(backBtn);

    // Fuse button
    this.fuseBtn = document.createElement('div');
    this.fuseBtn.textContent = '融合';
    Object.assign(this.fuseBtn.style, {
      padding: '10px 30px',
      background: 'linear-gradient(135deg, #AB47BC, #7E57C2)',
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: 'bold',
      borderRadius: '6px',
      cursor: 'pointer',
      border: '2px solid #8E24AA',
      textShadow: '0 0 8px rgba(171, 71, 188, 0.6)',
      boxShadow: '0 0 12px rgba(171, 71, 188, 0.4)',
      transition: 'box-shadow 0.2s'
    });
    this.fuseBtn.addEventListener('mouseenter', () => {
      this.fuseBtn.style.boxShadow = '0 0 20px rgba(171, 71, 188, 0.8)';
    });
    this.fuseBtn.addEventListener('mouseleave', () => {
      this.fuseBtn.style.boxShadow = '0 0 12px rgba(171, 71, 188, 0.4)';
    });
    this.fuseBtn.addEventListener('click', () => this.onFuse());
    btnRow.appendChild(this.fuseBtn);

    // Confirm result button
    this.confirmBtn = document.createElement('div');
    this.confirmBtn.textContent = '确认收入';
    Object.assign(this.confirmBtn.style, {
      padding: '10px 24px',
      background: '#4CAF50',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: 'bold',
      borderRadius: '6px',
      cursor: 'pointer',
      border: '2px solid #388E3C',
      display: 'none'
    });
    this.confirmBtn.addEventListener('click', () => this.onConfirmResult());
    btnRow.appendChild(this.confirmBtn);

    this.container.appendChild(btnRow);
  }

  _createSection(titleText) {
    const label = document.createElement('div');
    label.textContent = titleText;
    Object.assign(label.style, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#AB47BC',
      alignSelf: 'flex-start',
      marginTop: '6px',
      marginBottom: '4px'
    });

    const content = document.createElement('div');
    Object.assign(content.style, {
      width: '100%',
      boxSizing: 'border-box'
    });

    return { label, content };
  }

  _getMaxFusionSlots() {
    if (this.game.lab) {
      // 使用当前选中的能源等级来确定最大融合槽位数
      const energyGrade = this.game._labSelectedEnergy || 'blue';
      return this.game.lab.getFusionSlots(energyGrade);
    }
    return 2;
  }

  onPlantSelect(plantId) {
    const maxSlots = this._getMaxFusionSlots();
    const idx = this.fusionPlants.indexOf(plantId);
    if (idx >= 0) {
      this.fusionPlants.splice(idx, 1);
    } else {
      if (this.fusionPlants.length >= maxSlots) return;
      this.fusionPlants.push(plantId);
    }
    this._refreshPlantDisplay();
  }

  onEnergySelect(grade) {
    this.selectedEnergy = grade;

    // Update button highlights
    for (const g of Object.keys(this.energyBtns)) {
      const btn = this.energyBtns[g];
      if (g === grade) {
        btn.style.borderColor = '#ffffff';
        btn.style.opacity = '1';
      } else {
        btn.style.borderColor = 'transparent';
        btn.style.opacity = '0.7';
      }
    }
  }

  onFuse() {
    if (!this.game.lab) return;
    if (this.fusionPlants.length < 2) return;
    if (!this.selectedEnergy) return;

    const plants = this.fusionPlants.map(id => plantData[id]).filter(Boolean);
    const fuseResult = this.game.lab.fuse(plants, this.selectedEnergy);

    if (fuseResult.error) {
      this.resultPanel.textContent = `融合失败: ${fuseResult.error}`;
      this.resultPanel.style.color = '#FF5722';
      return;
    }

    this.result = fuseResult;

    // Display result
    this.resultPanel.style.color = '#FFD700';
    this.resultPanel.innerHTML = `
      <div style="font-size:16px;font-weight:bold;margin-bottom:4px;">${fuseResult.name}</div>
      <div>基因池: ${fuseResult.genePool.join(', ')}</div>
      <div>生命: ${fuseResult.stats.hp} | 伤害: ${fuseResult.stats.damage} | 攻速: ${fuseResult.stats.attackSpeed}s</div>
      <div>射程: ${fuseResult.stats.range} | 费用: ${fuseResult.stats.cost}</div>
      <div>特殊: ${fuseResult.stats.special}</div>
    `;

    // Display mutation info
    if (fuseResult.mutations && fuseResult.mutations.length > 0) {
      this.mutationPanel.style.color = '#AB47BC';
      this.mutationPanel.innerHTML = fuseResult.mutations.map(m =>
        `<div><strong>${m.name_cn}</strong>: ${m.description}</div>`
      ).join('');
    } else {
      this.mutationPanel.style.color = '#999999';
      this.mutationPanel.textContent = '无变异';
    }

    // Show confirm button
    this.confirmBtn.style.display = 'block';
  }

  onConfirmResult() {
    if (!this.result) return;

    if (!this.game.hybridPlants) {
      this.game.hybridPlants = [];
    }
    this.game.hybridPlants.push(this.result);

    // Reset state
    this.result = null;
    this.fusionPlants = [];
    this.selectedEnergy = null;
    this.confirmBtn.style.display = 'none';
    this.resultPanel.textContent = '等待融合...';
    this.resultPanel.style.color = '#cccccc';
    this.mutationPanel.textContent = '无变异';
    this.mutationPanel.style.color = '#cccccc';

    for (const g of Object.keys(this.energyBtns)) {
      this.energyBtns[g].style.borderColor = 'transparent';
      this.energyBtns[g].style.opacity = '0.7';
    }

    this._refreshPlantDisplay();
  }

  _onBack() {
    this.hide();
    this.game.setState('menu');
  }

  _refreshPlantDisplay() {
    // Refresh fusion slots display
    this.fusionSlotsDisplay.innerHTML = '';
    const maxSlots = this._getMaxFusionSlots();

    for (let i = 0; i < maxSlots; i++) {
      const slot = document.createElement('div');
      Object.assign(slot.style, {
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(171, 71, 188, 0.15)',
        borderRadius: '4px',
        border: '1px dashed rgba(171, 71, 188, 0.4)',
        fontSize: '10px',
        color: '#999999'
      });

      if (i < this.fusionPlants.length) {
        const data = plantData[this.fusionPlants[i]];
        if (data) {
          slot.textContent = data.name_cn;
          slot.style.background = GENE_POOL_COLORS[data.gene_pool] || '#666';
          slot.style.color = '#ffffff';
          slot.style.border = '1px solid rgba(255,255,255,0.3)';
          slot.style.cursor = 'pointer';
          slot.addEventListener('click', () => this.onPlantSelect(this.fusionPlants[i]));
        }
      } else {
        slot.textContent = `空${i + 1}`;
      }

      this.fusionSlotsDisplay.appendChild(slot);
    }

    // Refresh plant grid
    const gridCards = this.plantGrid.children;
    for (let i = 0; i < gridCards.length; i++) {
      const card = gridCards[i];
      const isInFusion = this.fusionPlants.includes(card._plantId);
      card.style.opacity = isInFusion ? '0.4' : '1';
      card.style.borderColor = isInFusion ? '#FFD700' : 'rgba(255,255,255,0.2)';
    }
  }

  _updateEnergyCounts() {
    const energy = this.game.energy || { blue: 0, purple: 0, gold: 0, red: 0 };
    for (const grade of Object.keys(this.energyBtns)) {
      const btn = this.energyBtns[grade];
      const count = energy[grade] || 0;
      btn._countSpan.textContent = ` (${count})`;
    }
  }

  show() {
    this.container.style.display = 'flex';
    this._renderPlantGrid();
    this._updateEnergyCounts();
    this._refreshPlantDisplay();
  }

  hide() {
    this.container.style.display = 'none';
  }

  _renderPlantGrid() {
    this.plantGrid.innerHTML = '';

    const unlockedPlants = this.game.unlockedPlants || [];
    for (const plantId of unlockedPlants) {
      const data = plantData[plantId];
      if (!data) continue;

      const card = document.createElement('div');
      const bgColor = GENE_POOL_COLORS[data.gene_pool] || '#666666';

      Object.assign(card.style, {
        width: '60px',
        height: '60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgColor,
        borderRadius: '4px',
        cursor: 'pointer',
        border: '2px solid rgba(255,255,255,0.2)',
        boxSizing: 'border-box',
        transition: 'transform 0.1s, opacity 0.1s'
      });

      const nameEl = document.createElement('div');
      nameEl.textContent = data.name_cn;
      Object.assign(nameEl.style, {
        fontSize: '9px',
        fontWeight: 'bold',
        color: '#ffffff',
        textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '54px',
        textAlign: 'center'
      });

      card.appendChild(nameEl);
      card._plantId = plantId;

      card.addEventListener('click', () => this.onPlantSelect(plantId));

      this.plantGrid.appendChild(card);
    }
  }
}
