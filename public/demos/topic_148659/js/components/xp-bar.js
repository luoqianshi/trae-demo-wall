window.XPBar = {
  render: function(container) {
    const game = window.GameSystem;
    const state = game.state;
    const progress = game.getLevelProgress();
    const nextLevelXp = game.getNextLevelXp();
    
    container.innerHTML = `
      <div class="game-level-info">
        <span class="game-level-badge">Lv.${state.level}</span>
      </div>
      <div class="game-xp-bar-container">
        <div class="game-xp-bar" style="width: ${progress}%;"></div>
      </div>
      <div class="game-xp-text">${state.xp} / ${nextLevelXp} XP</div>
    `;
  },

  update: function() {
    const containers = document.querySelectorAll('.game-xp-bar-container');
    containers.forEach(container => {
      const game = window.GameSystem;
      const state = game.state;
      const progress = game.getLevelProgress();
      const nextLevelXp = game.getNextLevelXp();
      
      const bar = container.querySelector('.game-xp-bar');
      if (bar) bar.style.width = `${progress}%`;
      
      const text = container.parentElement.querySelector('.game-xp-text');
      if (text) text.textContent = `${state.xp} / ${nextLevelXp} XP`;
      
      const badge = container.parentElement.querySelector('.game-level-badge');
      if (badge) badge.textContent = `Lv.${state.level}`;
    });
  }
};

document.addEventListener('gameStateChange', function() {
  window.XPBar.update();
});