/* ========== detail.js — 详情页（美食详情 + 打卡记录） ========== */

const DetailPage = (() => {
  'use strict';

  let unsubscribe = null;
  let container = null;
  let foodId = null;

  function onEnter(param, el) {
    container = el;
    foodId = param;
    unsubscribe = Store.subscribe(render);
    render(Store.getState());
  }

  function onLeave() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    container = null;
  }

  // 渲染详情信息行
  function renderInfoRow(label, value) {
    return `
      <div class="detail-info-row">
        <div class="di-label">${label}</div>
        <div class="di-value">${value}</div>
      </div>`;
  }

  // 渲染打卡记录区块
  function renderCheckInSection(checkIn) {
    if (!checkIn) return '';
    return `
      <div class="detail-checkin-section">
        <div class="dc-title">打卡记录</div>
        <div class="detail-checkin-card">
          <div class="dc-rating">
            ${RatingStars.render(checkIn.rating, false)}
            <span class="dc-date">${FoodCard.escapeHtml(UI.formatDate(checkIn.date))}</span>
          </div>
          <div class="dc-note">${FoodCard.escapeHtml(checkIn.note || '未填写评价')}</div>
        </div>
      </div>`;
  }

  function render(state) {
    const food = Actions.getFoodById(foodId);

    // 美食不存在
    if (!food) {
      container.innerHTML = `
        <div id="detail-nav"></div>
        <div class="detail-body">
          ${EmptyState.render('❓', '美食不存在', '可能已被删除')}
          <div style="padding: 0 var(--space-md); margin-top: var(--space-md);">
            <button class="btn btn-primary btn-block" id="detail-go-home">返回首页</button>
          </div>
        </div>`;
      NavBar.mount(container.querySelector('#detail-nav'), '美食详情', null);
      const goHomeBtn = container.querySelector('#detail-go-home');
      if (goHomeBtn) {
        goHomeBtn.addEventListener('click', () => Router.switchTab('home'));
      }
      return;
    }

    const emoji = Actions.getTagEmoji(food.tag);
    const statusBadge = food.done
      ? '<span class="detail-status-badge done">已尝试</span>'
      : '<span class="detail-status-badge pending">待探索</span>';

    // 主操作按钮：未打卡 → 去打卡，已打卡 → 撤销打卡
    const primaryBtn = food.done
      ? '<button class="btn btn-secondary" data-action="undo">撤销打卡</button>'
      : '<button class="btn btn-primary" data-action="checkin">去打卡</button>';

    const placeText = food.place ? FoodCard.escapeHtml(food.place) : '未标注';
    const noteText = food.note ? FoodCard.escapeHtml(food.note) : '暂无备注';
    const createdText = food.createdAt ? UI.formatDateTime(food.createdAt) : '';

    container.innerHTML = `
      <div id="detail-nav"></div>
      <div class="detail-body">
        <div class="detail-hero">
          <div class="detail-icon">${emoji}</div>
          <div class="detail-name">${FoodCard.escapeHtml(food.name)}</div>
          <div class="detail-tags">
            <span class="detail-tag">${FoodCard.escapeHtml(food.tag)}</span>
          </div>
          ${statusBadge}
        </div>
        <div class="detail-info">
          ${renderInfoRow('📍 地点', placeText)}
          ${renderInfoRow('🏷️ 分类', FoodCard.escapeHtml(food.tag))}
          ${renderInfoRow('📅 收藏时间', FoodCard.escapeHtml(createdText))}
          ${renderInfoRow('📝 备注', noteText)}
        </div>
        <div class="detail-actions">
          ${primaryBtn}
          <button class="btn btn-secondary" data-action="edit">编辑</button>
          <button class="btn btn-danger" data-action="delete">删除</button>
        </div>
        ${renderCheckInSection(food.checkIn)}
        <div class="page-bottom-spacer"></div>
      </div>`;

    // 挂载 NavBar
    NavBar.mount(
      container.querySelector('#detail-nav'),
      food.name,
      { text: '编辑', id: 'edit', callback: () => Router.navigate('#/edit/' + foodId) }
    );

    // 绑定操作按钮
    const checkinBtn = container.querySelector('[data-action="checkin"]');
    if (checkinBtn) {
      checkinBtn.addEventListener('click', () => Router.navigate('#/checkin/' + foodId));
    }

    const undoBtn = container.querySelector('[data-action="undo"]');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        UI.confirm({
          title: '撤销打卡',
          desc: '确定要撤销这条打卡记录吗？',
          confirmText: '撤销',
          cancelText: '取消',
          onConfirm: () => {
            Actions.undoCheckIn(foodId);
            UI.toast('已撤销打卡');
          }
        });
      });
    }

    const editBtn = container.querySelector('[data-action="edit"]');
    if (editBtn) {
      editBtn.addEventListener('click', () => Router.navigate('#/edit/' + foodId));
    }

    const deleteBtn = container.querySelector('[data-action="delete"]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        UI.confirm({
          title: '删除美食',
          desc: '确定要删除这条美食记录吗？删除后无法恢复。',
          confirmText: '删除',
          cancelText: '取消',
          danger: true,
          onConfirm: () => {
            Actions.deleteFood(foodId);
            Router.goBack();
            UI.toast('已删除');
          }
        });
      });
    }
  }

  return { onEnter, onLeave };
})();
