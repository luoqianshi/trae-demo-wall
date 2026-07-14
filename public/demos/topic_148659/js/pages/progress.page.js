window.ProgressPage = function(container) {
  const esc = window.escapeHtml;
  const game = window.GameSystem;
  const state = game.state;
  const badges = game.BADGES;
  let destroyed = false;

  function onStateChange() {
    if (!destroyed && window.currentPage === 'progress') {
      ProgressPage(container);
    }
  }

  function onPageChange(e) {
    if (e.detail.page !== 'progress') {
      destroyed = true;
      document.removeEventListener('gameStateChange', onStateChange);
      window.removeEventListener('pageChanged', onPageChange);
    }
  }

  container.innerHTML = `
    <div class="game-progress-container">
      <div class="game-progress-level-card">
        <div class="game-progress-level-number">${state.level}</div>
        <div class="game-progress-level-label">当前等级</div>
        <div class="game-progress-xp-bar">
          <div class="game-progress-xp-fill" style="width: ${game.getLevelProgress()}%;"></div>
        </div>
        <div class="game-progress-xp-text">${state.xp} / ${game.getNextLevelXp()} XP</div>
      </div>

      <div class="game-progress-section">
        <div class="game-progress-section-title">💰 识字币</div>
        <div style="font-size: 48px; font-weight: 700; color: #EAB308; text-align: center;">${state.coins}</div>
      </div>

      <div class="game-progress-section">
        <div class="game-progress-section-title">🏅 徽章收藏</div>
        <div class="game-badge-container">
          ${Object.keys(badges).map(badgeId => {
            const badge = badges[badgeId];
            const isUnlocked = state.badges.includes(badgeId);
            return `
              <div class="game-badge-item ${isUnlocked ? 'unlocked' : 'locked'}" onclick="BadgeDisplay.showDetail('${esc(badgeId)}')">
                <div class="game-badge-icon">${esc(badge.icon)}</div>
                <div class="game-badge-name">${esc(badge.name)}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="game-progress-section">
        <div class="game-progress-section-title">📊 学习统计</div>
        <div class="game-progress-stats">
          <div class="game-progress-stat-item">
            <div class="game-progress-stat-value">${state.totalChars}</div>
            <div class="game-progress-stat-label">已学汉字</div>
          </div>
          <div class="game-progress-stat-item">
            <div class="game-progress-stat-value">${state.totalCorrect}</div>
            <div class="game-progress-stat-label">答对题目</div>
          </div>
          <div class="game-progress-stat-item">
            <div class="game-progress-stat-value">${state.maxCombo}</div>
            <div class="game-progress-stat-label">最大连击</div>
          </div>
        </div>
      </div>

      <div class="game-progress-section">
        <div class="game-progress-section-title">🔥 连续学习</div>
        <div style="text-align: center;">
          <div style="font-size: 56px; margin-bottom: 8px;">🔥</div>
          <div style="font-size: 32px; font-weight: 700; color: #F59E0B;">${state.streak}</div>
          <div style="font-size: 14px; color: #6B7280;">天</div>
        </div>
      </div>

      <div class="game-progress-section">
        <div class="game-progress-section-title">📚 课程进度</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${(window.DemoData ? window.DemoData.lessons || [] : []).map(lesson => {
            const isCompleted = state.completedLessons.includes(lesson.id);
            return `
              <div style="background: ${isCompleted ? 'rgba(16, 185, 129, 0.1)' : '#F3F4F6'}; padding: 8px 12px; border-radius: 8px; font-size: 12px; color: ${isCompleted ? '#10B981' : '#6B7280'};">
                ${esc(lesson.icon)} ${esc(lesson.name)} ${isCompleted ? '✓' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  document.addEventListener('gameStateChange', onStateChange);
  window.addEventListener('pageChanged', onPageChange);
};