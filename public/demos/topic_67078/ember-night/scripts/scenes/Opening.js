/**
 * Opening Scene — Phase 0
 * 全黑 → "睡不着吗？" → "没关系。" → 等待触摸
 */
class OpeningScene {
  constructor(container) {
    this.container = container;
    this.timers = [];
    this.autoAdvanceTimer = null;
  }

  start() {
    this.container.style.display = 'flex';
    this.container.style.alignItems = 'center';
    this.container.style.justifyContent = 'center';

    // 时间线
    TEXTS.opening.lines.forEach(({ text, delay }) => {
      const t = setTimeout(() => this.showText(text), delay);
      this.timers.push(t);
      const t2 = setTimeout(() => this.hideCurrentText(), delay + 3000);
      this.timers.push(t2);
    });

    // 显示提示
    const hintTimer = setTimeout(() => this.showHint(), TEXTS.opening.hintDelay);
    this.timers.push(hintTimer);

    // 15秒无操作自动进入
    this.autoAdvanceTimer = setTimeout(() => this.advance(), 15000);

    // 监听触摸/点击
    this.touchHandler = () => this.onTouch();
    this.container.addEventListener('touchstart', this.touchHandler, { once: true });
    this.container.addEventListener('click', this.touchHandler, { once: true });
  }

  showText(text) {
    this.hideCurrentText();
    const el = document.createElement('p');
    el.className = 'text-guide text-appear';
    el.textContent = text;
    el.dataset.role = 'opening-text';
    this.container.appendChild(el);
  }

  hideCurrentText() {
    const existing = this.container.querySelector('[data-role="opening-text"]');
    if (existing) {
      existing.classList.remove('text-appear');
      existing.classList.add('text-disappear');
      setTimeout(() => existing.remove(), 1500);
    }
  }

  showHint() {
    const el = document.createElement('p');
    el.className = 'text-hint text-appear';
    el.textContent = TEXTS.opening.hint;
    el.style.bottom = '15vh';
    el.dataset.role = 'hint';
    this.container.appendChild(el);
  }

  async onTouch() {
    clearTimeout(this.autoAdvanceTimer);
    // 请求传感器权限
    await SensorManager.requestPermission();
    // 启动音频上下文
    await AudioEngine.resume();
    // 开始播放环境音
    AudioEngine.play('env_night', { loop: true, fadeIn: 3000, volume: 0.4 });
    this.advance();
  }

  advance() {
    this.timers.forEach(t => clearTimeout(t));
    this.container.removeEventListener('touchstart', this.touchHandler);
    this.container.removeEventListener('click', this.touchHandler);
    StateManager.transition('WINDOW');
  }

  destroy() {
    this.timers.forEach(t => clearTimeout(t));
    clearTimeout(this.autoAdvanceTimer);
  }
}
