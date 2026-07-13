/**
 * 个人中心 - 统计、成就、设置
 */

window.Pages.Profile = {
  render() {
    const user = Store.getUser();
    const settings = Store.getSettings();
    const achievements = Store.getAchievements();
    const wordbook = Store.getWordbook();
    const progress = Store.getProgress();
    const levelInfo = Store.getLevelInfo(user.xp);
    const avatar = window.APP_DATA.AVATARS[user.avatar] || '🦊';
    const masteredCount = wordbook.filter(w => w.mastery >= 3).length;

    // 成就墙
    const achievementsHtml = achievements.map(a => `
      <div class="achievement ${a.unlocked ? 'achievement--unlocked' : 'achievement--locked'}" 
           title="${a.description}">
        <div class="achievement__icon">${a.unlocked ? a.icon : '🔒'}</div>
        <div class="achievement__name">${a.name}</div>
      </div>
    `).join('');

    document.getElementById('app').innerHTML = `
      <div class="page page--profile">
        <header class="page-header">
          <button class="page-header__back" data-route="#/home">←</button>
          <h1 class="page-header__title">个人中心</h1>
        </header>

        <div class="profile-header">
          <div class="profile-header__avatar">${avatar}</div>
          <div class="profile-header__info">
            <div class="profile-header__name">${user.name}</div>
            <div class="profile-header__level">Lv.${levelInfo.level}</div>
            <div class="profile-header__xp">经验：${user.xp} XP</div>
          </div>
        </div>

        <div class="profile-stats">
          <div class="stat-card stat-card--green">
            <div class="stat-card__icon">🔥</div>
            <div class="stat-card__value">${user.streak}</div>
            <div class="stat-card__label">连胜天数</div>
          </div>
          <div class="stat-card stat-card--blue">
            <div class="stat-card__icon">📚</div>
            <div class="stat-card__value">${wordbook.length}</div>
            <div class="stat-card__label">已学单词</div>
          </div>
          <div class="stat-card stat-card--orange">
            <div class="stat-card__icon">⭐</div>
            <div class="stat-card__value">${masteredCount}</div>
            <div class="stat-card__label">已掌握</div>
          </div>
          <div class="stat-card stat-card--purple">
            <div class="stat-card__icon">📅</div>
            <div class="stat-card__value">${user.totalStudyDays}</div>
            <div class="stat-card__label">学习天数</div>
          </div>
        </div>

        <div class="profile-section">
          <h2 class="profile-section__title">等级进度</h2>
          <div class="level-progress">
            <div class="level-progress__bar">
              <div class="level-progress__fill" style="width:${(levelInfo.progress / levelInfo.total) * 100}%"></div>
            </div>
            <div class="level-progress__text">
              <span>Lv.${levelInfo.level}</span>
              <span>${levelInfo.progress} / ${levelInfo.total} XP</span>
              <span>Lv.${levelInfo.level + 1}</span>
            </div>
          </div>
        </div>

        <div class="profile-section">
          <h2 class="profile-section__title">成就墙（${achievements.filter(a => a.unlocked).length}/${achievements.length}）</h2>
          <div class="achievement-wall">
            ${achievementsHtml}
          </div>
        </div>

        <div class="profile-section">
          <h2 class="profile-section__title">设置</h2>
          <div class="settings-list">
            <div class="setting-item">
              <span>音效</span>
              <label class="switch">
                <input type="checkbox" id="setting-sound" ${settings.sound ? 'checked' : ''}>
                <span class="switch__slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <span>夜间模式</span>
              <label class="switch">
                <input type="checkbox" id="setting-dark" ${settings.darkMode ? 'checked' : ''}>
                <span class="switch__slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <span>每日目标</span>
              <select id="setting-goal" class="select">
                <option value="10" ${user.dailyGoal === 10 ? 'selected' : ''}>10 XP</option>
                <option value="20" ${user.dailyGoal === 20 ? 'selected' : ''}>20 XP</option>
                <option value="30" ${user.dailyGoal === 30 ? 'selected' : ''}>30 XP</option>
                <option value="50" ${user.dailyGoal === 50 ? 'selected' : ''}>50 XP</option>
              </select>
            </div>
            <div class="setting-item">
              <span>修改用户名</span>
              <input type="text" id="setting-name" class="input" value="${user.name}" maxlength="12">
            </div>
            <div class="setting-item">
              <span>选择头像</span>
              <div class="avatar-picker">
                ${window.APP_DATA.AVATARS.map((a, i) =>
                  `<button class="avatar-option ${i === user.avatar ? 'avatar-option--selected' : ''}" data-idx="${i}">${a}</button>`
                ).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="profile-section">
          <button class="btn btn--ghost" id="btn-reset">⚠️ 重置所有数据</button>
        </div>

        <div class="home-bottom-spacer"></div>
        ${Components.bottomNav('#/profile')}
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    // 返回
    document.querySelector('.page-header__back').addEventListener('click', () => {
      AudioEngine.playClick();
      window.location.hash = '/home';
    });

    // 音效开关
    document.getElementById('setting-sound').addEventListener('change', (e) => {
      const settings = Store.getSettings();
      settings.sound = e.target.checked;
      Store.setSettings(settings);
      AudioEngine.setEnabled(e.target.checked);
      Speech.setEnabled(e.target.checked);
      if (e.target.checked) AudioEngine.playClick();
    });

    // 夜间模式
    document.getElementById('setting-dark').addEventListener('change', (e) => {
      const settings = Store.getSettings();
      settings.darkMode = e.target.checked;
      Store.setSettings(settings);
      document.body.classList.toggle('dark-mode', e.target.checked);
      AudioEngine.playClick();
    });

    // 每日目标
    document.getElementById('setting-goal').addEventListener('change', (e) => {
      const user = Store.getUser();
      user.dailyGoal = parseInt(e.target.value);
      Store.setUser(user);
      AudioEngine.playClick();
    });

    // 用户名
    document.getElementById('setting-name').addEventListener('change', (e) => {
      const user = Store.getUser();
      user.name = e.target.value.trim() || 'Learner';
      Store.setUser(user);
      e.target.value = user.name;
    });

    // 头像选择
    document.querySelectorAll('.avatar-option').forEach(opt => {
      opt.addEventListener('click', () => {
        AudioEngine.playClick();
        const idx = parseInt(opt.getAttribute('data-idx'));
        const user = Store.getUser();
        user.avatar = idx;
        Store.setUser(user);
        document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('avatar-option--selected'));
        opt.classList.add('avatar-option--selected');
      });
    });

    // 重置数据
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (confirm('确定要重置所有数据吗？此操作不可撤销！')) {
        Store.resetAll();
        Utils.toast('数据已重置', 'info');
        setTimeout(() => window.location.hash = '/splash', 1000);
      }
    });

    Components.bindBottomNav();
  }
};
