/**
 * 工具函数库
 */

const Utils = {
  // 防抖
  debounce(fn, delay = 300) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // 随机打乱数组
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // 随机整数 [min, max]
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // 从数组随机取 n 个
  sample(arr, n) {
    return this.shuffle(arr).slice(0, n);
  },

  // 数字滚动动画
  animateNumber(el, from, to, duration = 800) {
    const start = performance.now();
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(from + (to - from) * eased);
      el.textContent = current;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  // 格式化时间 mm:ss
  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  },

  // 创建元素
  el(tag, className = '', html = '') {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (html) e.innerHTML = html;
    return e;
  },

  // 显示 toast 横幅
  toast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = this.el('div', 'toast-container');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = this.el('div', `toast toast--${type}`);
    toast.innerHTML = message;
    container.appendChild(toast);
    // 触发滑入动画
    requestAnimationFrame(() => toast.classList.add('toast--show'));
    setTimeout(() => {
      toast.classList.remove('toast--show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // 成就横幅
  achievementBanner(achievement) {
    const banner = this.el('div', 'achievement-banner');
    banner.innerHTML = `
      <div class="achievement-banner__icon">${achievement.icon}</div>
      <div class="achievement-banner__text">
        <div class="achievement-banner__label">🏆 成就解锁</div>
        <div class="achievement-banner__name">${achievement.name}</div>
        <div class="achievement-banner__desc">${achievement.description}</div>
      </div>
    `;
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('achievement-banner--show'));
    setTimeout(() => {
      banner.classList.remove('achievement-banner--show');
      setTimeout(() => banner.remove(), 500);
    }, 3500);
  },

  // 彩带粒子动画
  confetti(duration = 3000) {
    const container = this.el('div', 'confetti-container');
    document.body.appendChild(container);
    const colors = ['#58CC02', '#1CB0F6', '#FF9600', '#FF4B4B', '#FFD900', '#CE82FF'];
    const count = 60;
    for (let i = 0; i < count; i++) {
      const piece = this.el('div', 'confetti-piece');
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 0.5 + 's';
      piece.style.animationDuration = (Math.random() * 1.5 + 1.5) + 's';
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      container.appendChild(piece);
    }
    setTimeout(() => container.remove(), duration);
  },

  // XP 飘字
  floatXp(targetEl, amount) {
    const float = this.el('div', 'float-xp');
    float.textContent = `+${amount} XP`;
    const rect = targetEl.getBoundingClientRect();
    float.style.left = (rect.left + rect.width / 2) + 'px';
    float.style.top = rect.top + 'px';
    document.body.appendChild(float);
    requestAnimationFrame(() => float.classList.add('float-xp--show'));
    setTimeout(() => float.remove(), 1200);
  },

  // 获取所有单词键
  getAllWordKeys() {
    return Object.keys(window.APP_DATA.WORDS);
  },

  // 根据当前单词获取干扰选项
  getDistractors(correctWord, count, excludeMeaning = false) {
    const all = this.getAllWordKeys().filter(w => w !== correctWord);
    const distractors = this.sample(all, count);
    if (excludeMeaning) {
      return distractors.map(w => window.APP_DATA.WORDS[w].meaning);
    }
    return distractors.map(w => window.APP_DATA.WORDS[w].word);
  }
};

window.Utils = Utils;
