/**
 * Pier Scene — Phase 3A
 * 码头：把烦恼扔进海里
 */
class PierScene {
  constructor(container) {
    this.container = container;
    this.throwCount = 0;
    this.maxThrows = 3;
    this.autoAdvance = null;
  }

  start() {
    this.renderPier();
    setTimeout(() => this.showPrompt(), 1500);
    this.autoAdvance = setTimeout(() => this.advance(), 240000);

    // 码头场景：淡入海浪环境音，同时淡出夜虫
    AudioEngine.fadeOut('env_night', 3000);
    AudioEngine.play('env_ocean', { loop: true, fadeIn: 3000, volume: 0.35 });
  }

  renderPier() {
    // 海面
    const water = document.createElement('div');
    water.className = 'pier-water';
    const wave = document.createElement('div');
    wave.className = 'pier-wave';
    water.appendChild(wave);
    this.container.appendChild(water);

    // 码头
    const dock = document.createElement('div');
    dock.className = 'pier-dock';
    this.container.appendChild(dock);

    // 小人 SVG
    const figure = document.createElement('div');
    figure.className = 'pier-figure';
    figure.innerHTML = `<svg width="24" height="48" viewBox="0 0 24 48" fill="none">
      <circle cx="12" cy="8" r="5" fill="#4A5568"/>
      <path d="M12 13L12 32" stroke="#4A5568" stroke-width="3" stroke-linecap="round"/>
      <path d="M12 32L8 44" stroke="#4A5568" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M12 32L16 44" stroke="#4A5568" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M12 18L7 26" stroke="#4A5568" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 18L17 26" stroke="#4A5568" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
    this.container.appendChild(figure);

    this.waterLineY = window.innerHeight * 0.42;
  }

  showPrompt() {
    // 移除旧的
    const old = this.container.querySelector('.pier-prompt');
    if (old) old.remove();

    const card = document.createElement('div');
    card.className = 'pier-prompt';

    let optionsHtml = TEXTS.pier.options.map(opt =>
      `<button class="pier-option" data-color="${opt.color}">${opt.label}</button>`
    ).join('');

    card.innerHTML = `
      <p class="pier-question">${TEXTS.pier.question}</p>
      <div class="pier-options">${optionsHtml}</div>
    `;
    this.container.appendChild(card);

    card.querySelectorAll('.pier-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.createPebble(btn.dataset.color);
      }, { once: true });
    });
  }

  createPebble(color) {
    const card = this.container.querySelector('.pier-prompt');
    if (card) {
      card.classList.add('fade-out');
      setTimeout(() => card.remove(), 800);
    }

    const pebble = document.createElement('div');
    pebble.className = 'pebble';
    pebble.style.background = color;
    pebble.style.boxShadow = `0 0 12px ${color}`;
    pebble.style.left = '50%';
    pebble.style.top = '60%';
    pebble.style.transform = 'translate(-50%, -50%)';
    this.container.appendChild(pebble);

    const hint = document.createElement('p');
    hint.className = 'pebble-hint';
    hint.textContent = '拖向海面';
    this.container.appendChild(hint);

    this.setupDrag(pebble, hint);
  }

  setupDrag(pebble, hint) {
    let isDragging = false;
    let startX, startY, lastX, lastY;
    let offsetX = 0, offsetY = 0;

    const onStart = (clientX, clientY) => {
      isDragging = true;
      startX = clientX;
      startY = clientY;
      pebble.style.transition = 'none';
      hint.style.opacity = '0';
      DecayEngine.onUserInteract();
    };

    const onMove = (clientX, clientY, e) => {
      if (!isDragging) return;
      if (e) e.preventDefault();
      lastX = clientX;
      lastY = clientY;
      offsetX = lastX - startX;
      offsetY = lastY - startY;
      pebble.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      if (lastY && lastY < this.waterLineY) {
        this.animateThrow(pebble, lastX, lastY, hint);
      } else {
        pebble.style.transition = 'transform 0.5s ease-out';
        pebble.style.transform = 'translate(-50%, -50%)';
        hint.style.opacity = '0.5';
      }
    };

    // Touch events
    pebble.addEventListener('touchstart', (e) => {
      onStart(e.touches[0].clientX, e.touches[0].clientY);
    });
    pebble.addEventListener('touchmove', (e) => {
      onMove(e.touches[0].clientX, e.touches[0].clientY, e);
    }, { passive: false });
    pebble.addEventListener('touchend', onEnd);

    // Mouse events
    pebble.addEventListener('mousedown', (e) => {
      onStart(e.clientX, e.clientY);
    });
    document.addEventListener('mousemove', (e) => {
      onMove(e.clientX, e.clientY, e);
    });
    document.addEventListener('mouseup', onEnd);
  }

  animateThrow(pebble, x, y, hint) {
    pebble.style.transition = 'transform 0.3s ease-in, opacity 0.3s';
    pebble.style.transform += ' scale(0.3)';
    pebble.style.opacity = '0';

    setTimeout(() => {
      this.createRipple(x, y);
      AudioEngine.play('sfx_water', { loop: false, fadeIn: 0, volume: 0.5 });
      // 触觉：石子入水轻振
      if (navigator.vibrate) navigator.vibrate(30);
      pebble.remove();
      hint.remove();
    }, 300);

    setTimeout(() => {
      this.throwCount++;
      DecayEngine.addCalm(5);
      this.showAfterText();
    }, 1200);
  }

  createRipple(x, y) {
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('div');
      ring.className = 'ripple-ring';
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
      ring.style.animationDelay = `${i * 0.4}s`;
      this.container.appendChild(ring);
      setTimeout(() => ring.remove(), 3500);
    }
  }

  showAfterText() {
    const texts = TEXTS.pier.afterThrow;
    const text = texts[Math.floor(Math.random() * texts.length)];
    const el = document.createElement('p');
    el.className = 'text-guide floating-text';
    el.textContent = text;
    el.style.top = '62%';
    this.container.appendChild(el);

    setTimeout(() => {
      el.remove();
      if (this.throwCount >= this.maxThrows) {
        this.showComplete();
      } else {
        this.showPrompt();
      }
    }, 4000);
  }

  showComplete() {
    const el = document.createElement('p');
    el.className = 'text-guide text-appear';
    el.textContent = TEXTS.pier.complete;
    el.style.top = '62%';
    this.container.appendChild(el);
    setTimeout(() => this.advance(), 3500);
  }

  advance() {
    clearTimeout(this.autoAdvance);
    // Breathing 场景自己会播放 env_ocean，这里不淡出，保持连贯
    StateManager.transition('BREATHING');
  }

  destroy() {
    clearTimeout(this.autoAdvance);
  }
}
