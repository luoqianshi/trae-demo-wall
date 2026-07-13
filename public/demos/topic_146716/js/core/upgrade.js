// ============================================================
// 升级系统模块 (UpgradeSystem)
// 负责：升级面板显示、升级选择、稀有度管理、升级提示
// ============================================================

const UpgradeSystem = {
  initialized: false,
  isUpgradePanelOpen: false,
  currentUpgradeChoices: [],
  upgradePoints: 0,

  init() {
    this.initialized = true;
    this._injectStyles();
    console.log('[UpgradeSystem] Initialized');
    return true;
  },

  _injectStyles() {
    if (document.getElementById('upgrade-system-styles')) return;
    const style = document.createElement('style');
    style.id = 'upgrade-system-styles';
    style.textContent = `
      @keyframes upgradeNotifAnim {
        0% { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.8); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.05); }
        80% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.9); }
      }
    `;
    document.head.appendChild(style);
  },

  // --- 核心状态 ---
  setPoints(points) {
    this.upgradePoints = points;
  },
  getPoints() {
    return this.upgradePoints;
  },
  addPoints(delta) {
    this.upgradePoints += delta;
  },

  // --- 面板显示 ---
  showPanel() {
    if (this.isUpgradePanelOpen) return;
    console.log('[UpgradeSystem] Opening panel, points:', this.upgradePoints);

    const panel = document.getElementById('upgrade-panel');
    const options = document.getElementById('upgrade-options');
    if (!panel || !options) {
      console.error('[UpgradeSystem] Panel elements not found!');
      return;
    }

    // 生成加权随机选项
    this.currentUpgradeChoices = this._generateChoices(3);
    console.log('[UpgradeSystem] Generated choices:', this.currentUpgradeChoices.map(u => u.name));

    // 渲染卡片
    options.innerHTML = '';
    this.currentUpgradeChoices.forEach((upg, index) => {
      options.appendChild(this._createCard(upg, index));
    });

    panel.style.display = 'flex';
    panel.classList.add('show');
    this.isUpgradePanelOpen = true;
  },

  closePanel() {
    console.log('[UpgradeSystem] Closing panel');
    const panel = document.getElementById('upgrade-panel');
    if (panel) {
      panel.classList.remove('show');
      panel.style.display = 'none';
    }
    this.isUpgradePanelOpen = false;
    this.currentUpgradeChoices = [];
    // 恢复游戏状态和鼠标锁定（兼容所有地图）
    if (typeof gameState !== 'undefined') gameState = 'playing';
    document.body.style.cursor = 'none';
    if (typeof renderer !== 'undefined' && renderer && renderer.domElement) {
      setTimeout(() => {
        if (typeof gameState !== 'undefined' && gameState === 'playing') {
          renderer.domElement.requestPointerLock().catch(() => {});
        }
      }, 100);
    }
  },

  isOpen() {
    return this.isUpgradePanelOpen;
  },

  // --- 选项生成 ---
  _generateChoices(count) {
    if (typeof UPGRADE_DEFS === 'undefined') {
      console.warn('[UpgradeSystem] UPGRADE_DEFS not defined');
      return [];
    }
    const weightedDefs = [...UPGRADE_DEFS].map(upg => {
      let weight = 1;
      if (upg.effect === 'recruit') weight = 3;
      return { upg, weight };
    });

    const choices = [];
    const available = [...weightedDefs];
    while (choices.length < count && available.length > 0) {
      const totalWeight = available.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;
      for (let i = 0; i < available.length; i++) {
        random -= available[i].weight;
        if (random <= 0) {
          choices.push(available[i].upg);
          available.splice(i, 1);
          break;
        }
      }
    }
    return choices;
  },

  // --- 卡片创建 ---
  _createCard(upg, index) {
    const card = document.createElement('div');
    card.className = `upgrade-card upgrade-rarity-${upg.rarity}`;
    card.setAttribute('data-upgrade-id', upg.id);
    card.setAttribute('data-index', index);

    card.style.cssText = `
      width: 220px;
      padding: 25px 20px;
      background: linear-gradient(135deg, rgba(30,30,50,0.95), rgba(20,20,40,0.95));
      border: 3px solid ${this._getRarityColor(upg.rarity)};
      border-radius: 15px;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s ease;
      user-select: none;
      position: relative;
      overflow: hidden;
    `;

    card.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 15px; filter: drop-shadow(0 0 10px rgba(255,255,255,0.3));">${upg.icon}</div>
      <div style="color: #fff; font-size: 18px; font-weight: bold; margin-bottom: 10px; text-shadow: 0 0 10px rgba(255,255,255,0.2);">${upg.name}</div>
      <div style="color: #aaa; font-size: 13px; line-height: 1.5; margin-bottom: 15px;">${upg.desc}</div>
      <div style="color: ${this._getRarityColor(upg.rarity)}; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">${this._getRarityName(upg.rarity)}</div>
    `;

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-8px) scale(1.02)';
      card.style.boxShadow = `0 10px 30px ${this._getRarityColor(upg.rarity, 0.4)}`;
      card.style.borderColor = '#ffcc00';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) scale(1)';
      card.style.boxShadow = 'none';
      card.style.borderColor = this._getRarityColor(upg.rarity);
    });

    const onSelect = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[UpgradeSystem] Card selected:', upg.name);
      this.selectUpgrade(upg, index);
    };
    card.addEventListener('mousedown', onSelect);
    card.addEventListener('click', onSelect);

    return card;
  },

  // --- 升级选择 ---
  selectUpgrade(upg, index) {
    console.log('[UpgradeSystem] Selecting upgrade:', upg.name, 'index:', index);
    if (!this.isUpgradePanelOpen) {
      console.warn('[UpgradeSystem] Panel not open, ignoring selection');
      return;
    }

    // 应用升级效果
    try {
      if (typeof player !== 'undefined' && upg.apply) {
        upg.apply(player);
      }
      console.log('[UpgradeSystem] Applied effect:', upg.id);
    } catch (err) {
      console.error('[UpgradeSystem] Error applying upgrade:', err);
    }

    this.upgradePoints--;

    // 播放音效
    if (window.AudioSystem) {
      try { AudioSystem.playSound('upgrade'); } catch (e) {}
    }

    // 显示提示
    this._showNotification(upg);

    // 关闭面板
    this.closePanel();

    // 更新HUD
    if (window.HUDSystem && HUDSystem.initialized) {
      try { HUDSystem.updateAll(); } catch (e) {}
    }
  },

  // --- 提示 ---
  _showNotification(upg) {
    const notif = document.createElement('div');
    notif.style.cssText = `
      position: fixed;
      top: 30%;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, rgba(255,200,0,0.9), rgba(255,150,0,0.9));
      color: #000;
      padding: 20px 40px;
      border-radius: 10px;
      font-size: 24px;
      font-weight: bold;
      z-index: 500;
      animation: upgradeNotifAnim 2s forwards;
      box-shadow: 0 0 30px rgba(255,200,0,0.5);
    `;
    notif.innerHTML = `${upg.icon} 获得升级: ${upg.name}`;
    document.body.appendChild(notif);
    setTimeout(() => {
      if (notif.parentNode) notif.parentNode.removeChild(notif);
    }, 2000);
  },

  // --- 稀有度工具 ---
  _getRarityColor(rarity, alpha = 1) {
    const colors = {
      'common': `rgba(150,150,150,${alpha})`,
      'rare': `rgba(50,150,255,${alpha})`,
      'epic': `rgba(180,50,255,${alpha})`,
      'legendary': `rgba(255,180,0,${alpha})`
    };
    return colors[rarity] || colors['common'];
  },

  _getRarityName(rarity) {
    const names = {
      'common': '普通',
      'rare': '稀有',
      'epic': '史诗',
      'legendary': '传说'
    };
    return names[rarity] || '普通';
  }
};

window.UpgradeSystem = UpgradeSystem;
