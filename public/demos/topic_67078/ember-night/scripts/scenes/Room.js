/**
 * Room Scene — Phase 3B
 * 房间整理：点击归位物品 + 关灯 + 铺被子
 */
class RoomScene {
  constructor(container) {
    this.container = container;
    this.itemsDone = 0;
    this.lampState = 3;
    this.autoAdvance = null;
  }

  start() {
    this.roomEl = document.createElement('div');
    this.roomEl.className = 'room-container';
    this.container.appendChild(this.roomEl);

    this.createItems();
    this.autoAdvance = setTimeout(() => this.advance(), 240000);

    // 房间场景：淡入雨声，淡出夜虫
    AudioEngine.fadeOut('env_night', 3000);
    AudioEngine.play('env_rain', { loop: true, fadeIn: 3000, volume: 0.3 });
  }

  createItems() {
    const items = [
      { id: 'book', cls: 'item-book', x: '18%', y: '48%', rot: 15, targetX: '12%', targetY: '20%' },
      { id: 'mug', cls: 'item-mug', x: '58%', y: '52%', rot: -5, targetX: '75%', targetY: '18%' },
      { id: 'slippers', cls: 'item-slippers', x: '68%', y: '70%', rot: 20, targetX: '28%', targetY: '80%' },
    ];

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = `room-item ${item.cls}`;
      el.style.left = item.x;
      el.style.top = item.y;
      el.style.transform = `rotate(${item.rot}deg)`;
      el.addEventListener('click', () => {
        if (el.classList.contains('done')) return;
        el.classList.add('done');
        el.style.left = item.targetX;
        el.style.top = item.targetY;
        el.style.transform = 'rotate(0deg)';
        AudioEngine.play('sfx_wood', { loop: false, fadeIn: 0, volume: 0.3 });
        // 触觉：物品归位轻振
        if (navigator.vibrate) navigator.vibrate(15);
        this.onItemDone();
      }, { once: true });
      this.roomEl.appendChild(el);
    });

    // 台灯
    const lamp = document.createElement('div');
    lamp.className = 'room-item item-lamp';
    lamp.style.left = '76%';
    lamp.style.top = '14%';
    lamp.innerHTML = `<div class="item-lamp-shade"></div><div class="item-lamp-base"></div>`;
    lamp.addEventListener('click', () => {
      this.lampState--;
      const shade = lamp.querySelector('.item-lamp-shade');
      if (this.lampState <= 0) {
        shade.style.opacity = '0';
        shade.style.boxShadow = 'none';
        lamp.classList.add('done');
      } else {
        shade.style.opacity = `${this.lampState * 0.3}`;
        shade.style.boxShadow = `0 0 ${this.lampState * 8}px var(--light-amber)`;
      }
      this.roomEl.style.filter = `brightness(${0.3 + this.lampState * 0.2})`;
      AudioEngine.play('sfx_wood', { loop: false, fadeIn: 0, volume: 0.2 });
      this.onItemDone();
    });
    this.roomEl.appendChild(lamp);

    // 窗帘
    const curtain = document.createElement('div');
    curtain.className = 'room-item item-curtain';
    curtain.style.left = '8%';
    curtain.style.top = '10%';
    curtain.addEventListener('click', () => {
      if (curtain.classList.contains('closed')) return;
      curtain.classList.add('closed');
      AudioEngine.play('sfx_cloth', { loop: false, fadeIn: 0, volume: 0.3 });
      this.onItemDone();
    }, { once: true });
    this.roomEl.appendChild(curtain);

    // 被子（最后一步）
    const blanket = document.createElement('div');
    blanket.className = 'room-item item-blanket';
    let pressTimer = null;
    const blanketDown = () => {
      if (blanket.classList.contains('spread')) return;
      pressTimer = setTimeout(() => {
        blanket.classList.add('spread');
        AudioEngine.play('sfx_cloth', { loop: false, fadeIn: 0, volume: 0.4 });
        // 触觉：被子铺开柔和长振
        if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
        this.onItemDone(true);
      }, 800);
    };
    const blanketUp = () => clearTimeout(pressTimer);
    blanket.addEventListener('touchstart', blanketDown);
    blanket.addEventListener('touchend', blanketUp);
    blanket.addEventListener('mousedown', blanketDown);
    blanket.addEventListener('mouseup', blanketUp);

    // 被子提示
    const hint = document.createElement('p');
    hint.className = 'text-hint';
    hint.textContent = TEXTS.room.blanketHint;
    hint.style.bottom = '8vh';
    hint.style.opacity = '0';
    hint.dataset.role = 'blanket-hint';
    this.roomEl.appendChild(hint);
    this.roomEl.appendChild(blanket);
  }

  onItemDone(isLast = false) {
    this.itemsDone++;
    DecayEngine.addCalm(4);
    DecayEngine.onUserInteract();

    // 当其他都完成后，显示被子提示
    if (this.itemsDone >= 4) {
      const hint = this.roomEl.querySelector('[data-role="blanket-hint"]');
      if (hint) hint.style.opacity = '0.5';
    }

    if (isLast) {
      setTimeout(() => this.advance(), 2500);
    }
  }

  advance() {
    clearTimeout(this.autoAdvance);
    // crossfade: 淡出雨声，Breathing 场景会淡入海浪
    AudioEngine.fadeOut('env_rain', 3000);
    StateManager.transition('BREATHING');
  }

  destroy() {
    clearTimeout(this.autoAdvance);
  }
}
