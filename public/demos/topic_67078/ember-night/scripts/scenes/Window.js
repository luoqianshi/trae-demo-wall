/**
 * Window Scene — Phase 1
 * 窗边停留，粒子，随机文案
 */
class WindowScene {
  constructor(container) {
    this.container = container;
    this.idleTimer = null;
    this.autoAdvance = null;
    this.shownIndices = JSON.parse(localStorage.getItem('ember_shown_texts') || '[]');
  }

  start() {
    this.renderWindow();
    this.createParticles(12);
    this.createSwipeHint();

    // 15秒后显示第一条文字
    this.firstTextTimer = setTimeout(() => this.showRandomText(), 15000);
    // 每30秒显示一条
    this.idleTimer = setInterval(() => this.showRandomText(), 30000);
    // 90秒自动推进
    this.autoAdvance = setTimeout(() => this.advance(), 90000);

    // 触摸事件
    this.setupInteractions();
  }

  renderWindow() {
    const frame = document.createElement('div');
    frame.className = 'window-frame';
    frame.innerHTML = `
      <div class="window-sky">
        <div class="window-light" style="top:30%;left:20%"></div>
        <div class="window-light" style="top:60%;left:70%"></div>
        <div class="window-light" style="top:45%;left:45%;width:4px;height:4px;opacity:0.4"></div>
      </div>
      <div class="window-crossbar-h"></div>
      <div class="window-crossbar-v"></div>
    `;
    this.container.appendChild(frame);
    this.windowFrame = frame;
  }

  createParticles(count) {
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = `${10 + Math.random() * 80}%`;
      p.style.top = `${5 + Math.random() * 35}%`;
      p.style.setProperty('--float-duration', `${5 + Math.random() * 3}s`);
      p.style.setProperty('--float-delay', `${Math.random() * 6}s`);
      if (Math.random() > 0.7) {
        p.style.width = '3px';
        p.style.height = '3px';
        p.style.background = '#C4D4E0';
      }
      this.container.appendChild(p);
    }
  }

  createSwipeHint() {
    const hint = document.createElement('div');
    hint.className = 'swipe-hint';
    this.container.appendChild(hint);
  }

  setupInteractions() {
    // 长按天空出流星（touch）
    let pressTimer = null;
    this.container.addEventListener('touchstart', (e) => {
      const y = e.touches[0].clientY;
      if (y < window.innerHeight * 0.3) {
        pressTimer = setTimeout(() => this.createShootingStar(e.touches[0].clientX, y), 800);
      }
      DecayEngine.onUserInteract();
    });
    this.container.addEventListener('touchend', () => clearTimeout(pressTimer));

    // 长按天空出流星（mouse）
    this.container.addEventListener('mousedown', (e) => {
      const y = e.clientY;
      if (y < window.innerHeight * 0.3) {
        pressTimer = setTimeout(() => this.createShootingStar(e.clientX, y), 800);
      }
      DecayEngine.onUserInteract();
    });
    this.container.addEventListener('mouseup', () => clearTimeout(pressTimer));

    // 上滑推进（touch）
    let startY = 0;
    this.container.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; });
    this.container.addEventListener('touchend', (e) => {
      const diff = startY - e.changedTouches[0].clientY;
      if (diff > 80) this.advance();
    });

    // 上滑推进（mouse）
    let mouseStartY = 0;
    this.container.addEventListener('mousedown', (e) => { mouseStartY = e.clientY; });
    this.container.addEventListener('mouseup', (e) => {
      const diff = mouseStartY - e.clientY;
      if (diff > 80) this.advance();
    });

    // 点击窗户
    if (this.windowFrame) {
      this.windowFrame.addEventListener('touchstart', () => {
        AudioEngine.play('sfx_wood', { loop: false, fadeIn: 0, volume: 0.3 });
      });
      this.windowFrame.addEventListener('click', () => {
        AudioEngine.play('sfx_wood', { loop: false, fadeIn: 0, volume: 0.3 });
      });
    }
  }

  createShootingStar(x, y) {
    const star = document.createElement('div');
    star.className = 'shooting-star';
    star.style.left = `${x}px`;
    star.style.top = `${y}px`;
    this.container.appendChild(star);
    AudioEngine.play('sfx_chime', { loop: false, fadeIn: 0, volume: 0.2 });
    setTimeout(() => star.remove(), 1500);
  }

  showRandomText() {
    const allTexts = TEXTS.window.texts;
    const available = allTexts.filter((_, i) => !this.shownIndices.includes(i));
    if (available.length === 0) {
      this.shownIndices = [];
      localStorage.setItem('ember_shown_texts', '[]');
      return;
    }

    const text = available[Math.floor(Math.random() * available.length)];
    const idx = allTexts.indexOf(text);
    this.shownIndices.push(idx);
    localStorage.setItem('ember_shown_texts', JSON.stringify(this.shownIndices));

    // 移除旧文字
    const old = this.container.querySelector('[data-role="window-text"]');
    if (old) old.remove();

    const el = document.createElement('p');
    el.className = 'text-guide floating-text';
    el.textContent = text;
    el.style.top = `${58 + Math.random() * 12}%`;
    el.dataset.role = 'window-text';
    this.container.appendChild(el);
    setTimeout(() => el.remove(), 8500);
  }

  advance() {
    clearInterval(this.idleTimer);
    clearTimeout(this.autoAdvance);
    clearTimeout(this.firstTextTimer);
    StateManager.transition('CHOICE');
  }

  destroy() {
    clearInterval(this.idleTimer);
    clearTimeout(this.autoAdvance);
    clearTimeout(this.firstTextTimer);
  }
}
