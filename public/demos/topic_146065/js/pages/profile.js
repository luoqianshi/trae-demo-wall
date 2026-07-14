/* ========== profile.js — 我的页（个人中心 + 打卡历史） ========== */

const ProfilePage = (() => {
  'use strict';

  let unsubscribe = null;
  let container = null;

  function onEnter(param, el) {
    container = el;
    unsubscribe = Store.subscribe(render);
    render(Store.getState());
    TabBar.setActive('profile');
  }

  function onLeave() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    container = null;
  }

  // 星级评分：优先使用 RatingStars 组件，缺失时降级为等价 HTML
  function renderRating(rating) {
    if (typeof RatingStars !== 'undefined' && RatingStars && typeof RatingStars.render === 'function') {
      return RatingStars.render(rating, false);
    }
    const score = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<span class="rating-star${i <= score ? ' active' : ''}" data-star="${i}">★</span>`;
    }
    return `<div class="rating-stars readonly" data-rating="${score}">${stars}</div>`;
  }

  // 统计行（与 StatBar 数据一致，使用 profile-stat-item 样式）
  function renderStatsRow(stats) {
    return `
      <div class="profile-stats">
        <div class="profile-stat-item">
          <div class="ps-num">${stats.total}</div>
          <div class="ps-label">总收藏</div>
        </div>
        <div class="profile-stat-item">
          <div class="ps-num accent">${stats.pending}</div>
          <div class="ps-label">待探索</div>
        </div>
        <div class="profile-stat-item">
          <div class="ps-num green">${stats.done}</div>
          <div class="ps-label">已尝试</div>
        </div>
      </div>
    `;
  }

  // 打卡历史列表
  function renderCheckInHistory() {
    const history = Actions.getCheckInHistory();
    if (!history || history.length === 0) {
      return EmptyState.render('📝', '还没有打卡记录', '去尝试一些美食吧');
    }

    return history.map((food) => {
      const checkIn = food.checkIn || {};
      const note = checkIn.note ? FoodCard.escapeHtml(checkIn.note) : '';
      return `
        <div class="checkin-record">
          <div class="record-header">
            <div class="record-name" data-action="detail" data-food-id="${food.id}">${FoodCard.escapeHtml(food.name || '')}</div>
            <div class="record-date">${FoodCard.escapeHtml(UI.formatDate(checkIn.date || Date.now()))}</div>
          </div>
          <div class="record-rating">${renderRating(checkIn.rating || 0)}</div>
          ${note ? `<div class="record-note">${note}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function render(state) {
    const stats = Actions.getStats();

    const html = `
      <div class="page profile-page">
        <header class="profile-header">
          <div class="profile-avatar">🍜</div>
          <div class="profile-name">美食捕手</div>
          <div class="profile-desc">已探索 ${stats.done} 个美食</div>
        </header>
        ${renderStatsRow(stats)}
        <section class="profile-section">
          <div class="section-title"><span>打卡历史</span></div>
          ${renderCheckInHistory()}
        </section>
        <div class="page-bottom-spacer"></div>
      </div>
    `;

    container.innerHTML = html;

    // 事件委托：点击记录名 → 详情
    const page = container.querySelector('.profile-page');
    if (page) {
      page.addEventListener('click', (e) => {
        const name = e.target.closest('[data-action="detail"]');
        if (name) {
          const id = name.getAttribute('data-food-id');
          if (id !== null && id !== '') Router.navigate(`#/detail/${id}`);
        }
      });
    }
  }

  return { onEnter, onLeave };
})();
