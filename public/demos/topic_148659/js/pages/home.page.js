window.HomePage = function(container) {
  const esc = window.escapeHtml;
  const game = window.GameSystem;
  const state = game.state;
  const lessons = window.DemoData ? window.DemoData.lessons || [] : [];
  let destroyed = false;

  function onStateChange() {
    if (!destroyed && window.currentPage === 'home') {
      HomePage(container);
    }
  }

  function onPageChange(e) {
    if (e.detail.page !== 'home') {
      destroyed = true;
      document.removeEventListener('gameStateChange', onStateChange);
      window.removeEventListener('pageChanged', onPageChange);
    }
  }

  container.innerHTML = `
    <div class="home-page page-transition">
      <div class="game-header">
        <div class="game-status-bar">
          <div class="game-level-info">
            <span class="game-level-badge">Lv.${state.level}</span>
          </div>
          <div class="game-resources">
            <div class="game-heart-container">
              ${Array(5).fill(0).map((_, i) => `<span class="game-heart ${i < state.hearts ? '' : 'empty'}">❤️</span>`).join('')}
            </div>
            <div class="game-coin-container">
              <span class="game-coin-icon">💰</span>
              <span class="game-coin-count">${state.coins}</span>
            </div>
          </div>
        </div>
        <div class="game-xp-bar-container">
          <div class="game-xp-bar" style="width: ${game.getLevelProgress()}%;"></div>
        </div>
        <div class="game-xp-text">${state.xp} / ${game.getNextLevelXp()} XP</div>
      </div>

      <div class="game-mascot-area">
        <div class="game-mascot" id="mascot" onclick="window.Mascot.onClick()">🐰</div>
        <div class="game-mascot-text" id="mascotText">你好呀！一起学习吧~</div>
      </div>

      <div class="game-map">
        <div class="game-map-title">📋 学习路径</div>
        <div class="game-course-path">
          <div class="game-path-line"></div>
          ${lessons.map((lesson, index) => {
            const isUnlocked = game.isLessonUnlocked(lesson.id);
            const isCompleted = game.isLessonCompleted(lesson.id);
            const isCurrent = lesson.id === state.currentLessonId && !isCompleted;
            
            return `
              <div class="game-course-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''}" onclick="${isUnlocked ? `navigateTo('lesson', '${esc(lesson.id)}')` : ''}">
                <div class="game-course-card ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''}">
                  <div class="game-course-icon">${esc(lesson.icon)}</div>
                  <div class="game-course-info">
                    <div class="game-course-name">${esc(lesson.name)}</div>
                    <div class="game-course-desc">${esc(lesson.description)}</div>
                  </div>
                  <div class="game-course-status ${isCompleted ? 'completed' : isCurrent ? 'in-progress' : 'locked'}">
                    ${isCompleted ? '✓ 完成' : isCurrent ? '▶ 进行中' : '🔒 锁定'}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="game-daily-goal">
        <div class="game-daily-goal-title">
          <span>🔥</span>
          <span>每日目标</span>
          <span style="margin-left: auto; font-weight: 400;">连续 ${state.streak} 天</span>
        </div>
        <div class="game-daily-goal-bar">
          <div class="game-daily-goal-progress" style="width: ${Math.min((state.totalChars % 50) * 2, 100)}%;"></div>
        </div>
        <div class="game-daily-goal-text">今日已学 ${state.totalChars % 50} 字 / 目标 50 字</div>
      </div>

      <div class="game-course-card speak-entry-card" onclick="navigateTo('speak')">
        <div class="game-course-icon" style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);">🎤</div>
        <div class="game-course-info">
          <div class="game-course-name">语音练习</div>
          <div class="game-course-desc">跟着标准发音练习，AI评分帮你纠正</div>
        </div>
        <div class="game-course-status in-progress">▶ 开始练习</div>
      </div>

      <div style="height: 20px;"></div>
    </div>
  `;

  document.addEventListener('gameStateChange', onStateChange);
  window.addEventListener('pageChanged', onPageChange);

  setTimeout(() => {
    if (!destroyed && game.canClaimDailyBonus()) {
      game.showDailyBonusModal();
    }
  }, 500);
};