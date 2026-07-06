export class HUD {
  constructor(game) {
    this.game = game;
    this.container = null;
    this.sunText = null;
    this.waveText = null;
    this.coinsText = null;
    this.visible = true;
    this.createDOM();
  }

  createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'pvz-hud';
    Object.assign(this.container.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '720px',
      height: '100px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 10px',
      boxSizing: 'border-box',
      background: 'rgba(0, 0, 0, 0.55)',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      zIndex: '10',
      pointerEvents: 'auto',
      userSelect: 'none'
    });

    // Left section: menu button + sun counter
    const leftSection = document.createElement('div');
    Object.assign(leftSection.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    });

    // Menu button
    const menuBtn = document.createElement('div');
    menuBtn.textContent = '☰';
    Object.assign(menuBtn.style, {
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '20px',
      lineHeight: '1'
    });
    menuBtn.addEventListener('click', () => {
      this.game.pause();
    });

    // Sun counter
    const sunBox = document.createElement('div');
    Object.assign(sunBox.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    });

    const sunIcon = document.createElement('span');
    sunIcon.textContent = '☀';
    Object.assign(sunIcon.style, {
      fontSize: '22px',
      color: '#FFD700'
    });

    this.sunText = document.createElement('span');
    this.sunText.textContent = '50';
    Object.assign(this.sunText.style, {
      fontWeight: 'bold',
      fontSize: '18px',
      color: '#FFD700'
    });

    sunBox.appendChild(sunIcon);
    sunBox.appendChild(this.sunText);

    leftSection.appendChild(menuBtn);
    leftSection.appendChild(sunBox);

    // Center section: wave indicator
    const centerSection = document.createElement('div');
    Object.assign(centerSection.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    });

    this.waveText = document.createElement('span');
    this.waveText.textContent = 'Wave 0/10';
    Object.assign(this.waveText.style, {
      fontWeight: 'bold',
      fontSize: '16px',
      color: '#ffffff'
    });

    centerSection.appendChild(this.waveText);

    // Right section: coins + pause button
    const rightSection = document.createElement('div');
    Object.assign(rightSection.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    });

    // Coins display
    const coinsBox = document.createElement('div');
    Object.assign(coinsBox.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    });

    const coinIcon = document.createElement('span');
    coinIcon.textContent = '🪙';
    Object.assign(coinIcon.style, {
      fontSize: '18px'
    });

    this.coinsText = document.createElement('span');
    this.coinsText.textContent = '0';
    Object.assign(this.coinsText.style, {
      fontWeight: 'bold',
      fontSize: '16px',
      color: '#FFA500'
    });

    coinsBox.appendChild(coinIcon);
    coinsBox.appendChild(this.coinsText);

    // Pause button
    const pauseBtn = document.createElement('div');
    pauseBtn.textContent = '⏸';
    Object.assign(pauseBtn.style, {
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '18px',
      lineHeight: '1'
    });
    pauseBtn.addEventListener('click', () => {
      this.game.pause();
    });

    rightSection.appendChild(coinsBox);
    rightSection.appendChild(pauseBtn);

    this.container.appendChild(leftSection);
    this.container.appendChild(centerSection);
    this.container.appendChild(rightSection);
  }

  update(deltaTime) {
    if (!this.visible) return;

    // Update sun display
    const sun = this.game.sun;
    if (this.sunText) {
      this.sunText.textContent = String(sun);
    }

    // Update wave display
    const currentWave = this.game.currentWave;
    const totalWaves = this.game.totalWaves;
    if (this.waveText) {
      this.waveText.textContent = `Wave ${currentWave}/${totalWaves}`;
    }

    // Update coins display
    const coins = this.game.coins;
    if (this.coinsText) {
      this.coinsText.textContent = String(coins);
    }
  }

  show() {
    this.visible = true;
    this.container.style.display = 'flex';
  }

  hide() {
    this.visible = false;
    this.container.style.display = 'none';
  }
}
