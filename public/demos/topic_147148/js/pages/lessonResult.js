/**
 * 关卡结算页 - XP/星级/升级动画/宝箱奖励
 */

window.Pages.LessonResult = {
  render() {
    const data = sessionStorage.getItem('lesson_result');
    if (!data) {
      window.location.hash = '/home';
      return;
    }
    const result = JSON.parse(data);
    const user = Store.getUser();
    const levelInfo = Store.getLevelInfo(user.xp);
    const settings = Store.getSettings();

    // 判断是否触发宝箱（连续完成 3 关）
    const showTreasure = user.consecutiveLessons > 0 && user.consecutiveLessons % 3 === 0;

    document.getElementById('app').innerHTML = `
      <div class="page page--result">
        <div class="result-card">
          <div class="result-card__header">
            <div class="result-card__owl">${Components.owl('celebrate', settings.darkMode)}</div>
            <h2 class="result-card__title">关卡完成！</h2>
            <p class="result-card__subtitle">${result.lessonTitle}</p>
          </div>

          <div class="result-card__stars">
            ${Components.stars(result.stars)}
          </div>

          <div class="result-card__stats">
            <div class="result-stat">
              <div class="result-stat__icon">⚡</div>
              <div class="result-stat__value" id="stat-xp">0</div>
              <div class="result-stat__label">总 XP</div>
            </div>
            <div class="result-stat">
              <div class="result-stat__icon">🎯</div>
              <div class="result-stat__value" id="stat-accuracy">0%</div>
              <div class="result-stat__label">正确率</div>
            </div>
            <div class="result-stat">
              <div class="result-stat__icon">⏱️</div>
              <div class="result-stat__value" id="stat-time">00:00</div>
              <div class="result-stat__label">用时</div>
            </div>
            <div class="result-stat">
              <div class="result-stat__icon">🔥</div>
              <div class="result-stat__value" id="stat-combo">0</div>
              <div class="result-stat__label">最高连击</div>
            </div>
          </div>

          <div class="result-card__level">
            <div class="level-bar">
              <div class="level-bar__info">
                <span>Lv.${levelInfo.level}</span>
                <span>${levelInfo.progress}/${levelInfo.total}</span>
              </div>
              <div class="level-bar__track">
                <div class="level-bar__fill" id="level-fill" style="width:0%"></div>
              </div>
            </div>
          </div>

          ${showTreasure ? `
            <div class="treasure-box" id="treasure-box">
              <div class="treasure-box__chest">🎁</div>
              <p class="treasure-box__text">连续完成 3 关！点击领取宝箱</p>
            </div>
          ` : ''}

          <div class="result-card__actions">
            <button class="btn btn--primary" id="btn-continue">继续学习</button>
          </div>
        </div>
      </div>
    `;

    // 播放完成音
    AudioEngine.playComplete();

    // 数字滚动动画
    setTimeout(() => {
      const xpEl = document.getElementById('stat-xp');
      Utils.animateNumber(xpEl, 0, result.xp, 1000);
      const accEl = document.getElementById('stat-accuracy');
      Utils.animateNumber(accEl, 0, result.accuracy, 800);
      accEl.textContent = result.accuracy + '%';
      setTimeout(() => { accEl.textContent = result.accuracy + '%'; }, 800);
      document.getElementById('stat-time').textContent = Utils.formatTime(result.time);
      Utils.animateNumber(document.getElementById('stat-combo'), 0, result.maxCombo, 800);

      // 经验条动画
      const fill = document.getElementById('level-fill');
      const percent = (levelInfo.progress / levelInfo.total) * 100;
      fill.style.width = percent + '%';
    }, 300);

    // 星级弹出动画
    setTimeout(() => {
      document.querySelectorAll('.star--on').forEach((star, i) => {
        setTimeout(() => star.classList.add('star--pop'), i * 200);
      });
    }, 100);

    // 彩带
    Utils.confetti(2500);

    // 宝箱事件
    if (showTreasure) {
      const chest = document.getElementById('treasure-box');
      chest.addEventListener('click', () => this.openTreasure(chest));
    }

    // 继续按钮
    document.getElementById('btn-continue').addEventListener('click', () => {
      AudioEngine.playClick();
      // 检查是否升级
      const prevLevel = result.prevLevel || levelInfo.level - 1;
      if (levelInfo.level > prevLevel) {
        this.showLevelUp(levelInfo.level);
      } else {
        window.location.hash = '/home';
      }
    });
  },

  // 开宝箱
  openTreasure(chest) {
    if (chest.classList.contains('opened')) return;
    chest.classList.add('opened');
    AudioEngine.playTreasure();
    Utils.confetti(2000);

    // 随机奖励
    const rewards = [
      { type: 'gems', amount: 30, icon: '💎', text: '30 宝石' },
      { type: 'gems', amount: 50, icon: '💎', text: '50 宝石' },
      { type: 'heart', amount: 1, icon: '❤️', text: '1 颗心' },
      { type: 'doubleXp', icon: '⚡', text: '双倍 XP 卡' }
    ];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];

    // 应用奖励
    const user = Store.getUser();
    if (reward.type === 'gems') {
      user.gems += reward.amount;
    } else if (reward.type === 'heart') {
      Store.addHeart(reward.amount);
    } else if (reward.type === 'doubleXp') {
      user.doubleXpActive = true;
    }
    Store.setUser(user);

    // 重置连续关卡计数
    user.consecutiveLessons = 0;
    Store.setUser(user);

    chest.innerHTML = `
      <div class="treasure-box__chest treasure-box__chest--open">🎉</div>
      <p class="treasure-box__reward">获得：${reward.icon} ${reward.text}</p>
    `;
  },

  // 升级动画
  showLevelUp(newLevel) {
    AudioEngine.playLevelUp();
    Utils.confetti(4000);
    const modal = document.createElement('div');
    modal.className = 'modal-overlay modal-overlay--levelup';
    modal.innerHTML = `
      <div class="levelup">
        <div class="levelup__owl">${Components.owl('celebrate')}</div>
        <div class="levelup__title">升级了！</div>
        <div class="levelup__level" id="levelup-num">Lv.${newLevel}</div>
        <div class="levelup__rewards">
          <div class="levelup__reward">❤️ +3 颗心</div>
          <div class="levelup__reward">💎 +50 宝石</div>
        </div>
        <button class="btn btn--primary" id="btn-levelup-ok">太棒了！</button>
      </div>
    `;
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('modal-overlay--show'));

    // 应用升级奖励
    Store.addHeart(3);
    const user = Store.getUser();
    user.gems += 50;
    Store.setUser(user);

    // 等级数字跳动
    const numEl = document.getElementById('levelup-num');
    numEl.classList.add('levelup__level--pop');

    document.getElementById('btn-levelup-ok').addEventListener('click', () => {
      AudioEngine.playClick();
      modal.remove();
      window.location.hash = '/home';
    });
  }
};
