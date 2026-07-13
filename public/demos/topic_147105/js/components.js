/**
 * UI 组件库 - 可复用组件
 * 猫头鹰吉祥物、进度条、反馈条、底部导航、用户栏
 */

// 页面模块容器（提前初始化，供后续页面脚本注册）
window.Pages = window.Pages || {};

const Components = {
  /**
   * 猫头鹰 SVG 吉祥物
   * mood: happy / sad / celebrate / encourage / sleep
   * darkMode: 是否戴墨镜
   */
  owl(mood = 'happy', darkMode = false) {
    const eyes = {
      happy: '<circle cx="35" cy="50" r="8" fill="#fff"/><circle cx="65" cy="50" r="8" fill="#fff"/><circle cx="35" cy="50" r="4" fill="#3C3C3C"/><circle cx="65" cy="50" r="4" fill="#3C3C3C"/>',
      sad: '<circle cx="35" cy="52" r="7" fill="#fff"/><circle cx="65" cy="52" r="7" fill="#fff"/><circle cx="35" cy="54" r="3.5" fill="#3C3C3C"/><circle cx="65" cy="54" r="3.5" fill="#3C3C3C"/>',
      celebrate: '<path d="M28 50 L40 45 L40 55 Z" fill="#fff"/><path d="M72 50 L60 45 L60 55 Z" fill="#fff"/><circle cx="40" cy="50" r="3.5" fill="#3C3C3C"/><circle cx="60" cy="50" r="3.5" fill="#3C3C3C"/>',
      encourage: '<circle cx="35" cy="50" r="8" fill="#fff"/><circle cx="65" cy="50" r="8" fill="#fff"/><circle cx="37" cy="48" r="4" fill="#3C3C3C"/><circle cx="67" cy="48" r="4" fill="#3C3C3C"/>',
      sleep: '<path d="M28 50 Q35 46 42 50" stroke="#3C3C3C" stroke-width="2" fill="none"/><path d="M58 50 Q65 46 72 50" stroke="#3C3C3C" stroke-width="2" fill="none"/>'
    };
    const beak = mood === 'sad'
      ? '<path d="M50 58 L45 64 L55 64 Z" fill="#FF9600"/>'
      : '<path d="M50 56 L45 62 L55 62 Z" fill="#FF9600"/>';
    const glasses = darkMode
      ? '<rect x="22" y="42" width="20" height="14" rx="4" fill="#3C3C3C" opacity="0.85"/><rect x="58" y="42" width="20" height="14" rx="4" fill="#3C3C3C" opacity="0.85"/><line x1="42" y1="49" x2="58" y2="49" stroke="#3C3C3C" stroke-width="2"/>'
      : '';
    return `
      <svg class="owl owl--${mood}" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
        <!-- 身体 -->
        <ellipse cx="50" cy="70" rx="38" ry="42" fill="#58CC02"/>
        <!-- 肚子 -->
        <ellipse cx="50" cy="78" rx="25" ry="30" fill="#A8E060"/>
        <!-- 耳朵 -->
        <path d="M20 35 L28 55 L15 55 Z" fill="#58CC02"/>
        <path d="M80 35 L72 55 L85 55 Z" fill="#58CC02"/>
        <!-- 脸 -->
        <ellipse cx="50" cy="55" rx="32" ry="28" fill="#7BE030"/>
        <!-- 眼睛 -->
        ${eyes[mood] || eyes.happy}
        ${glasses}
        <!-- 嘴 -->
        ${beak}
        <!-- 翅膀 -->
        <ellipse cx="18" cy="75" rx="8" ry="18" fill="#4AB800" transform="rotate(-15 18 75)"/>
        <ellipse cx="82" cy="75" rx="8" ry="18" fill="#4AB800" transform="rotate(15 82 75)"/>
        <!-- 脚 -->
        <ellipse cx="40" cy="112" rx="7" ry="4" fill="#FF9600"/>
        <ellipse cx="60" cy="112" rx="7" ry="4" fill="#FF9600"/>
      </svg>
    `;
  },

  // 顶部用户信息栏
  userBar() {
    const user = Store.getUser();
    const settings = Store.getSettings();
    const avatar = window.APP_DATA.AVATARS[user.avatar] || '🦊';
    const levelInfo = Store.getLevelInfo(user.xp);
    return `
      <header class="user-bar">
        <div class="user-bar__left" data-route="#/profile">
          <div class="user-bar__avatar">${avatar}</div>
          <div class="user-bar__info">
            <div class="user-bar__name">${user.name}</div>
            <div class="user-bar__level">Lv.${levelInfo.level}</div>
          </div>
        </div>
        <div class="user-bar__right">
          <div class="user-bar__stat" title="连胜">
            <span class="user-bar__icon">🔥</span>
            <span class="user-bar__value">${user.streak}</span>
          </div>
          <div class="user-bar__stat" title="宝石">
            <span class="user-bar__icon">💎</span>
            <span class="user-bar__value">${user.gems}</span>
          </div>
          <div class="user-bar__stat" title="生命值">
            <span class="user-bar__icon">❤️</span>
            <span class="user-bar__value">${user.hearts}</span>
          </div>
        </div>
      </header>
    `;
  },

  // 每日目标环形进度
  dailyGoal() {
    const user = Store.getUser();
    const percent = Math.min(100, (user.todayXp / user.dailyGoal) * 100);
    const offset = 251.2 - (251.2 * percent / 100);
    return `
      <div class="daily-goal">
        <svg class="daily-goal__ring" viewBox="0 0 100 100">
          <circle class="daily-goal__bg" cx="50" cy="50" r="40" />
          <circle class="daily-goal__progress" cx="50" cy="50" r="40"
                  style="stroke-dashoffset:${offset}" />
        </svg>
        <div class="daily-goal__center">
          <div class="daily-goal__xp">${user.todayXp}</div>
          <div class="daily-goal__label">/ ${user.dailyGoal} XP</div>
        </div>
      </div>
    `;
  },

  // 学习界面顶部进度条
  lessonHeader(progress, hearts, onExit) {
    const heartsHtml = Array.from({ length: 5 }, (_, i) =>
      `<span class="hearts__icon ${i < hearts ? 'hearts__icon--full' : ''}">${i < hearts ? '❤️' : '🖤'}</span>`
    ).join('');
    return `
      <header class="lesson-header">
        <button class="lesson-header__exit" id="lesson-exit">✕</button>
        <div class="lesson-header__progress">
          <div class="lesson-header__bar" style="width:${progress}%"></div>
        </div>
        <div class="hearts">${heartsHtml}</div>
      </header>
    `;
  },

  // 底部反馈条
  feedbackBar(correct, correctAnswer = '', xp = 10, onContinue) {
    const cls = correct ? 'feedback feedback--correct' : 'feedback feedback--wrong';
    const title = correct ? 'Correct!' : 'Oops!';
    const subtitle = correct
      ? `<div class="feedback__xp">+${xp} XP</div>`
      : `<div class="feedback__answer">正确答案：<strong>${correctAnswer}</strong></div>`;
    return `
      <div class="${cls}" id="feedback-bar">
        <div class="feedback__icon">${correct ? '✓' : '✗'}</div>
        <div class="feedback__content">
          <div class="feedback__title">${title}</div>
          ${subtitle}
        </div>
        <button class="feedback__btn" id="feedback-continue">继续</button>
      </div>
    `;
  },

  // 底部导航栏
  bottomNav(currentRoute) {
    const items = [
      { route: '#/home', icon: '🗺️', label: '课程' },
      { route: '#/wordbook', icon: '📖', label: '单词本' },
      { route: '#/leaderboard', icon: '🏆', label: '排行' },
      { route: '#/shop', icon: '🛒', label: '商店' },
      { route: '#/profile', icon: '👤', label: '我的' }
    ];
    const itemsHtml = items.map(item => {
      const active = currentRoute === item.route ? 'bottom-nav__item--active' : '';
      return `<div class="bottom-nav__item ${active}" data-route="${item.route}">
        <div class="bottom-nav__icon">${item.icon}</div>
        <div class="bottom-nav__label">${item.label}</div>
      </div>`;
    }).join('');
    return `<nav class="bottom-nav">${itemsHtml}</nav>`;
  },

  // 3D 按压按钮
  button(text, type = 'primary', id = '') {
    return `<button class="btn btn--${type}" ${id ? `id="${id}"` : ''}>${text}</button>`;
  },

  // 星级评分
  stars(count) {
    return Array.from({ length: 3 }, (_, i) =>
      `<span class="star ${i < count ? 'star--on' : ''}">${i < count ? '⭐' : '☆'}</span>`
    ).join('');
  },

  // 绑定底部导航事件
  bindBottomNav() {
    document.querySelectorAll('.bottom-nav__item').forEach(item => {
      item.addEventListener('click', () => {
        const route = item.getAttribute('data-route');
        AudioEngine.playClick();
        window.location.hash = route;
      });
    });
  }
};

window.Components = Components;
