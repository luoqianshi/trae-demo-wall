/* ========== discover.js — 发现页（分类浏览） ========== */

const DiscoverPage = (() => {
  'use strict';

  let unsubscribe = null;
  let container = null;

  function onEnter(param, el) {
    container = el;
    unsubscribe = Store.subscribe(render);
    render(Store.getState());
    TabBar.setActive('discover');
  }

  function onLeave() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    container = null;
  }

  // 分类九宫格：仅展示数量 > 0 的分类
  function renderCategoryGrid(counts) {
    const items = Actions.TAGS
      .map((tag) => ({ tag, count: counts[tag] || 0 }))
      .filter((item) => item.count > 0);

    if (items.length === 0) {
      return EmptyState.render('🧭', '还没有美食', '去首页添加一些吧');
    }

    return `
      <div class="category-grid">
        ${items.map((item) => `
          <div class="category-item" data-tag="${FoodCard.escapeHtml(item.tag)}">
            <div class="cat-icon">${Actions.getTagEmoji(item.tag)}</div>
            <div class="cat-name">${FoodCard.escapeHtml(item.tag)}</div>
            <div class="cat-count">${item.count}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 选中分类后的美食列表区块
  function renderCategorySection(category) {
    const foods = Actions.getFoodsByCategory(category);
    const listHtml = foods.length > 0
      ? foods.map((food) => FoodCard.render(food, 'simple')).join('')
      : EmptyState.render('🍽️', '该分类暂无美食', '');

    return `
      <section class="discover-section">
        <div class="section-title">
          <span>${FoodCard.escapeHtml(category)}的美食</span>
          <span class="section-more" data-action="back">返回全部</span>
        </div>
        <div class="discover-list">
          ${listHtml}
        </div>
      </section>
    `;
  }

  function render(state) {
    const counts = Actions.getCategoryCounts();
    const category = state.discoverCategory;

    const html = `
      <div class="page discover-page">
        <header class="discover-header">
          <h1 class="discover-title">发现</h1>
          <p class="discover-desc">按分类浏览美食</p>
        </header>
        ${renderCategoryGrid(counts)}
        ${category ? renderCategorySection(category) : ''}
        <div class="page-bottom-spacer"></div>
      </div>
    `;

    container.innerHTML = html;

    // 事件委托：返回全部 / 选择分类 / 卡片跳转详情
    const page = container.querySelector('.discover-page');
    if (page) {
      page.addEventListener('click', (e) => {
        // 返回全部
        const backLink = e.target.closest('[data-action="back"]');
        if (backLink) {
          Actions.setDiscoverCategory(null);
          return;
        }

        // 选择分类
        const catItem = e.target.closest('[data-tag]');
        if (catItem) {
          const tag = catItem.getAttribute('data-tag');
          if (tag) Actions.setDiscoverCategory(tag);
          return;
        }

        // 美食卡片 → 详情
        const card = e.target.closest('[data-food-id]');
        if (card) {
          const id = card.getAttribute('data-food-id');
          Router.navigate(`#/detail/${id}`);
        }
      });
    }
  }

  return { onEnter, onLeave };
})();
