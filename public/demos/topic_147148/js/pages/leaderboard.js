/**
 * 排行榜 - 模拟本周学习排名
 */

window.Pages.Leaderboard = {
  render() {
    const user = Store.getUser();
    // 合并用户数据到排行榜
    const board = window.APP_DATA.LEADERBOARD.map(item =>
      item.isUser ? { ...item, xp: user.xp, name: user.name } : item
    );
    // 按 XP 降序排序
    board.sort((a, b) => b.xp - a.xp);

    const medals = ['🥇', '🥈', '🥉'];
    const listHtml = board.map((item, i) => {
      const rank = i + 1;
      const medal = medals[i] || '';
      const isUser = item.isUser;
      return `
        <div class="rank-item ${isUser ? 'rank-item--me' : ''} ${rank <= 3 ? 'rank-item--top' : ''}">
          <div class="rank-item__position">
            ${medal || `<span class="rank-item__num">${rank}</span>`}
          </div>
          <div class="rank-item__avatar">${item.avatar}</div>
          <div class="rank-item__name">${item.name}${isUser ? ' (我)' : ''}</div>
          <div class="rank-item__xp">${item.xp} XP</div>
        </div>
      `;
    }).join('');

    document.getElementById('app').innerHTML = `
      <div class="page page--leaderboard">
        <header class="page-header">
          <button class="page-header__back" data-route="#/home">←</button>
          <h1 class="page-header__title">本周排行榜</h1>
        </header>

        <div class="leaderboard-hero">
          ${Components.owl('encourage')}
          <p class="leaderboard-hero__text">坚持学习，超越对手！</p>
        </div>

        <div class="rank-list">
          ${listHtml}
        </div>

        <div class="home-bottom-spacer"></div>
        ${Components.bottomNav('#/leaderboard')}
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    document.querySelector('.page-header__back').addEventListener('click', () => {
      AudioEngine.playClick();
      window.location.hash = '/home';
    });
    Components.bindBottomNav();
  }
};
