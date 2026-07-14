window.HeartSystem = {
  render: function(container) {
    const game = window.GameSystem;
    const state = game.state;
    const maxHearts = game.config.maxHearts;
    
    let heartsHtml = '';
    for (let i = 0; i < maxHearts; i++) {
      heartsHtml += `<span class="game-heart ${i < state.hearts ? '' : 'empty'}">❤️</span>`;
    }
    
    container.innerHTML = `
      <div class="game-heart-container">${heartsHtml}</div>
    `;
  },

  update: function() {
    const containers = document.querySelectorAll('.game-heart-container');
    containers.forEach(container => {
      const game = window.GameSystem;
      const state = game.state;
      const maxHearts = game.config.maxHearts;
      
      let heartsHtml = '';
      for (let i = 0; i < maxHearts; i++) {
        heartsHtml += `<span class="game-heart ${i < state.hearts ? '' : 'empty'}">❤️</span>`;
      }
      
      container.innerHTML = heartsHtml;
    });
  },

  loseHeart: function() {
    const containers = document.querySelectorAll('.game-heart-container');
    containers.forEach(container => {
      const hearts = container.querySelectorAll('.game-heart');
      const game = window.GameSystem;
      const state = game.state;
      
      for (let i = hearts.length - 1; i >= 0; i--) {
        if (!hearts[i].classList.contains('empty')) {
          hearts[i].classList.add('lost');
          setTimeout(() => {
            hearts[i].classList.remove('lost');
            hearts[i].classList.add('empty');
          }, 500);
          break;
        }
      }
    });
  }
};

document.addEventListener('gameStateChange', function() {
  window.HeartSystem.update();
});