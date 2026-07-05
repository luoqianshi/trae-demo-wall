// 呼吸引导动画
const Breathing = {
  circleEl: null,
  textEl: null,
  isRunning: false,
  timer: null,
  textTimer: null,

  init() {
    this.circleEl = document.getElementById('breathing-circle');
    this.textEl = document.getElementById('breathing-text');
  },

  // 开始呼吸动画
  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // 添加动画 class
    this.circleEl.classList.add('breathing');

    // 文字交替提示
    let showInhale = true;
    this.textEl.textContent = '吸气…';

    this.textTimer = setInterval(() => {
      showInhale = !showInhale;
      this.textEl.textContent = showInhale ? '吸气…' : '呼气…';
    }, 3500); // 每 3.5 秒切换一次（与 7s 呼吸周期同步）
  },

  // 停止呼吸动画
  stop() {
    this.isRunning = false;
    this.circleEl.classList.remove('breathing');
    if (this.textTimer) {
      clearInterval(this.textTimer);
      this.textTimer = null;
    }
    this.textEl.textContent = '';
  }
};