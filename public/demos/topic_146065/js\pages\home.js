/* ========== home.js — 首页（美食列表） ========== */

const HomePage = (() => {
  'use strict';

  let unsubscribe = null;
  let container = null;

  function onEnter(param, el) {
    container = el;
    unsubscribe = Store.subscribe(render);
    render(Store.getState());
    TabBar.setActive('home');
    // 显示全局 FAB
    const fab = document.getElementById('global-fab');
    if (fab) fab.classList.remove('hidden');
  }

  function onLeave() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    container = null;
    // 隐藏全局 FAB
    const fab = document.getElementById('global-fab');
    if (fab) fab.classList.add('hidden');
  }

  // 根据当前筛选返回对应的空状态标题
  function getEmptyTitle(filter) {
    if (filter === Actions.FILTER.PENDING) return '没有待探索的美食';
    if (filter === Actions.FILTER.DONE) return '还没有已尝试的美食';
    return '暂无美食收藏';
  }

  // 从事件目标解析美食 id，并还原为 store 中的数字类型（actions 使用 === 比较）
  function getFoodIdFrom(target) {
    const card = target.closest('[data-food-id]');
    if (!card) return null;
    const raw = card.getAttribute('data-food-id');
    const num = Number(raw);
    return raw !== '' && !Number.isNaN(num) ? num : raw;
  }

  function render(state) {
    const stats = Actions.getStats();
    const foods = Actions.getFilteredFoods(state.filter);

    const listHtml = foods.length === 0
      ? EmptyState.render('🍽️', getEmptyTitle(state.filter), '点击右下角 + 添加美食')
      : foods.map((food) => FoodCard.render(food, 'list')).join('');

    const html = `
      <div class="page home-page">
        <header class="home-header">
          <h1 class="home-title">美食捕手</h1>
          <p class="home-subtitle">记录每一种值得尝试的味道</p>
        </header>
        ${StatBar.render(stats)}
        ${FilterTabs.render(state.filter)}
        <div class="food-list">
          ${listHtml}
        </div>
        <div class="page-bottom-spacer"></div>
      </div>
    `;

    container.innerHTML = html;

    // 绑定筛选标签
    const filterTabs = container.querySelector('.filter-tabs');
    if (filterTabs) {
      FilterTabs.bind(filterTabs, (filter) => {
        Actions.setFilter(filter);
      });
    }

    // 列表事件委托：删除 / 切换状态 / 状态圈 / 卡片跳转详情
    const foodList = container.querySelector('.food-list');
    if (foodList) {
      foodList.addEventListener('click', (e) => {
        // 删除按钮
        const deleteBtn = e.target.closest('[data-action="delete"]');
        if (deleteBtn) {
          e.stopPropagation();
          const id = getFoodIdFrom(deleteBtn);
          if (id !== null) {
            UI.confirm({
              title: '删除美食',
              desc: '确定要删除这条美食记录吗？删除后无法恢复。',
              confirmText: '删除',
              cancelText: '取消',
              danger: true,
              onConfirm: () => {
                Actions.deleteFood(id);
                UI.toast('已删除');
              }
            });
          }
          return;
        }

        // 切换状态按钮
        const toggleBtn = e.target.closest('[data-action="toggle"]');
        if (toggleBtn) {
          e.stopPropagation();
          const id = getFoodIdFrom(toggleBtn);
          if (id !== null) Actions.toggleDone(id);
          return;
        }

        // 状态圈
        const statusBtn = e.target.closest('[data-action="status"]');
        if (statusBtn) {
          e.stopPropagation();
          const id = getFoodIdFrom(statusBtn);
          if (id !== null) Actions.toggleDone(id);
          return;
        }

        // 卡片整体 → 详情
        const card = e.target.closest('[data-food-id]');
        if (card) {
          const id = getFoodIdFrom(card);
          if (id !== null) Router.navigate(`#/detail/${id}`);
        }
      });
    }

    // 浮动按钮已在全局 DOM 中，onEnter 时显示
  }

  return { onEnter, onLeave };
})();
