window.StorePage = function(container) {
  const game = window.GameSystem;
  const state = game.state;
  let destroyed = false;

  const items = [
    { id: 'restore_heart', name: '恢复1颗红心', desc: '立即恢复1颗红心', icon: '❤️', price: game.config.priceRestoreHeart },
    { id: 'restore_all_hearts', name: '恢复全部红心', desc: '立即恢复所有红心', icon: '💖', price: game.config.priceRestoreAllHearts },
    { id: 'xp_boost', name: 'XP翻倍卡', desc: '1小时内XP翻倍', icon: '⚡', price: game.config.priceXpBoost },
    { id: 'streak_protector', name: '连胜保护器', desc: '今日失败不中断连胜', icon: '🛡️', price: game.config.priceStreakProtector }
  ];

  function buyItem(itemId) {
    if (destroyed) return;
    const success = game.buyItem(itemId);
    if (success) {
      StorePage(container);
    } else {
      game.showToast('💰 识字币不足！');
    }
  }

  function onStateChange() {
    if (!destroyed && window.currentPage === 'store') {
      StorePage(container);
    }
  }

  function onPageChange(e) {
    if (e.detail.page !== 'store') {
      destroyed = true;
      document.removeEventListener('gameStateChange', onStateChange);
      window.removeEventListener('pageChanged', onPageChange);
    }
  }

  container.innerHTML = `
    <div class="game-store-container">
      <div class="game-store-header">
        <div class="game-store-title">🏪 识字商店</div>
        <div class="game-store-coin-balance">
          <span>💰</span>
          <span style="font-weight: 700;">${state.coins}</span>
          <span>识字币</span>
        </div>
      </div>

      ${items.map(item => {
        const canAfford = state.coins >= item.price;
        return `
          <div class="game-store-item">
            <div class="game-store-item-icon">${item.icon}</div>
            <div class="game-store-item-info">
              <div class="game-store-item-name">${item.name}</div>
              <div class="game-store-item-desc">${item.desc}</div>
            </div>
            <div class="game-store-item-price">
              <span class="game-store-item-price-icon">💰</span>
              <span class="game-store-item-price-value">${item.price}</span>
            </div>
            <button class="game-store-item-btn ${canAfford ? '' : 'disabled'}" onclick="${canAfford ? `buyItem('${item.id}')` : ''}">
              ${canAfford ? '购买' : '余额不足'}
            </button>
          </div>
        `;
      }).join('')}

      <div style="margin-top: 20px; text-align: center;">
        <div style="font-size: 13px; color: #6B7280;">
          💡 提示：完成课程、答对题目都可以获得识字币！
        </div>
      </div>
    </div>
  `;

  document.addEventListener('gameStateChange', onStateChange);
  window.addEventListener('pageChanged', onPageChange);
};