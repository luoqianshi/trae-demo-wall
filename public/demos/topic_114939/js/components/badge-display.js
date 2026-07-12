window.BadgeDisplay = {
  render: function(container) {
    const game = window.GameSystem;
    const badges = game.BADGES;
    const unlocked = game.state.badges;
    
    let html = '';
    Object.keys(badges).forEach(badgeId => {
      const badge = badges[badgeId];
      const isUnlocked = unlocked.includes(badgeId);
      html += `
        <div class="game-badge-item ${isUnlocked ? 'unlocked' : 'locked'}" onclick="BadgeDisplay.showDetail('${badgeId}')">
          <div class="game-badge-icon">${badge.icon}</div>
          <div class="game-badge-name">${badge.name}</div>
        </div>
      `;
    });
    
    container.innerHTML = `<div class="game-badge-container">${html}</div>`;
  },

  showDetail: function(badgeId) {
    const game = window.GameSystem;
    const badge = game.BADGES[badgeId];
    if (!badge) return;
    
    const isUnlocked = game.state.badges.includes(badgeId);
    
    const modal = document.createElement('div');
    modal.className = 'game-modal-overlay';
    modal.innerHTML = `
      <div style="background: white; border-radius: 20px; padding: 24px; text-align: center; max-width: 280px; animation: modalAppear 0.3s ease-out;">
        <div style="font-size: 64px; margin-bottom: 12px;">${badge.icon}</div>
        <div style="font-size: 20px; font-weight: 700; color: #1F2937; margin-bottom: 8px;">${badge.name}</div>
        <div style="font-size: 14px; color: #6B7280; margin-bottom: 16px;">
          ${isUnlocked ? '✓ 已获得' : '🔒 未解锁'}
        </div>
        <div style="background: #F3F4F6; padding: 12px; border-radius: 12px; font-size: 13px; color: #6B7280;">
          ${this.getConditionText(badge.condition)}
        </div>
        <button style="margin-top: 20px; background: #58CC02; color: white; border: none; padding: 12px 32px; border-radius: 12px; font-weight: 600; cursor: pointer;" onclick="document.querySelector('.game-modal-overlay').remove()">关闭</button>
      </div>
    `;
    
    document.body.appendChild(modal);
  },

  getConditionText: function(condition) {
    const conditions = {
      'streak >= 7': '连续学习7天',
      'totalChars >= 500': '累计学习500个汉字',
      'consecutiveCorrect >= 20': '连续答对20题',
      'dailyMinutes >= 30': '单日学习超过30分钟',
      'completedLessons >= 10': '完成所有课程',
      'maxCombo >= 10': '达成10连击',
      'streak >= 30': '连续学习30天',
      'totalWrong >= 100': '累计答错100题'
    };
    return conditions[condition] || condition;
  },

  update: function() {
    const containers = document.querySelectorAll('.game-badge-container');
    containers.forEach(container => {
      this.render(container.parentElement);
    });
  }
};

document.addEventListener('gameStateChange', function() {
  window.BadgeDisplay.update();
});