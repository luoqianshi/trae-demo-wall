export class Menu {
  constructor(game) {
    this.game = game;
    this.container = null;
    this.screens = {};
    this.currentScreen = null;
    this.createDOM();
  }

  createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'pvz-menu';
    Object.assign(this.container.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '1000px',
      height: '620px',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '100',
      pointerEvents: 'auto',
      userSelect: 'none',
      fontFamily: 'Arial, sans-serif'
    });

    // === Main Menu ===
    this.screens.main = this._createScreen('main');
    this._addTitle(this.screens.main, '植物大战僵尸');
    this._addButton(this.screens.main, '冒险模式', () => this._onModeSelect('adventure'));
    this._addButton(this.screens.main, '无尽模式', () => this._onModeSelect('survival'));
    this._addButton(this.screens.main, '挑战模式', () => this._onModeSelect('challenge'));

    this.continueBtn = this._addButton(this.screens.main, '继续游戏', () => this._onContinue(), true);
    this._addButton(this.screens.main, '图鉴', () => this._onEncyclopedia());
    this._addButton(this.screens.main, '设置', () => this._onSettings());

    // === Pause Menu ===
    this.screens.pause = this._createScreen('pause');
    this._addTitle(this.screens.pause, '暂停');
    this._addButton(this.screens.pause, '继续', () => this._onResume());
    this._addButton(this.screens.pause, '保存', () => this._onSave());
    this._addButton(this.screens.pause, '返回主菜单', () => this._onQuitToMenu());

    // === Game Over ===
    this.screens.gameOver = this._createScreen('gameOver');
    this._addTitle(this.screens.gameOver, '游戏结束');
    this._addButton(this.screens.gameOver, '重新开始', () => this._onRestart());
    this._addButton(this.screens.gameOver, '返回主菜单', () => this._onQuitToMenu());

    // === Victory ===
    this.screens.victory = this._createScreen('victory');
    this._addTitle(this.screens.victory, '胜利!');
    this._addButton(this.screens.victory, '下一关', () => this._onNextLevel());
    this._addButton(this.screens.victory, '商店', () => this._onShop());
    this._addButton(this.screens.victory, '返回主菜单', () => this._onQuitToMenu());

    // Add all screens to container
    for (const key of Object.keys(this.screens)) {
      this.container.appendChild(this.screens[key]);
    }
  }

  _createScreen(name) {
    const screen = document.createElement('div');
    screen.dataset.screen = name;
    Object.assign(screen.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      background: 'rgba(0, 0, 0, 0.75)',
      zIndex: '101'
    });
    return screen;
  }

  _addTitle(screen, text) {
    const title = document.createElement('div');
    title.textContent = text;
    Object.assign(title.style, {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: '16px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
    });
    screen.appendChild(title);
  }

  _addButton(screen, text, onClick, hidden = false) {
    const btn = document.createElement('div');
    btn.textContent = text;
    Object.assign(btn.style, {
      width: '200px',
      padding: '10px 0',
      textAlign: 'center',
      background: '#4CAF50',
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: 'bold',
      borderRadius: '6px',
      cursor: 'pointer',
      border: '2px solid #388E3C',
      transition: 'background 0.2s'
    });
    if (hidden) {
      btn.style.display = 'none';
    }
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#66BB6A';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = '#4CAF50';
    });
    btn.addEventListener('click', onClick);
    screen.appendChild(btn);
    return btn;
  }

  show(screen) {
    this.container.style.display = 'flex';

    // Hide all screens first
    for (const key of Object.keys(this.screens)) {
      this.screens[key].style.display = 'none';
    }

    // Show requested screen
    if (this.screens[screen]) {
      this.screens[screen].style.display = 'flex';
      this.currentScreen = screen;
    }

    // Update continue button visibility
    if (screen === 'main' && this.continueBtn) {
      const hasSave = this._hasSaveData();
      this.continueBtn.style.display = hasSave ? 'block' : 'none';
    }
  }

  hide() {
    this.container.style.display = 'none';
    this.currentScreen = null;
  }

  _hasSaveData() {
    try {
      const listRaw = localStorage.getItem('pvz_saves');
      if (listRaw) {
        const slots = JSON.parse(listRaw);
        return slots && slots.length > 0;
      }
    } catch (e) {
      // ignore
    }
    return false;
  }

  // === Action handlers ===

  _onModeSelect(mode) {
    this.hide();
    this.game.mode = mode;
    this.game.setState('plant_select');
  }

  _onContinue() {
    this.hide();
    if (this.game.saveManager) {
      this.game.saveManager.load('autosave');
    }
    this.game.setState('playing');
    if (!this.game.running) {
      this.game.running = true;
      this.game.lastTime = performance.now();
      this.game.animFrameId = requestAnimationFrame(this.game._loop);
    }
  }

  _onEncyclopedia() {
    // Placeholder for encyclopedia screen
  }

  _onSettings() {
    // Placeholder for settings screen
  }

  _onResume() {
    this.hide();
    this.game.resume();
  }

  _onSave() {
    if (this.game.saveManager) {
      this.game.saveManager.save('manual', 'Manual Save');
    }
  }

  _onQuitToMenu() {
    this.hide();
    this.game.running = false;
    if (this.game.animFrameId) {
      cancelAnimationFrame(this.game.animFrameId);
      this.game.animFrameId = null;
    }
    this.game.setState('menu');
    this.show('main');
  }

  _onRestart() {
    this.hide();
    this.game.startGame(this.game.mode, this.game.sceneType, this.game.loadout);
  }

  _onNextLevel() {
    this.hide();
    this.game.floor++;
    this.game.setState('plant_select');
  }

  _onShop() {
    this.hide();
    this.game.setState('shop');
  }
}
