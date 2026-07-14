/* ========== checkin.js — 打卡页（评分 + 照片 + 备注） ========== */

const CheckInPage = (() => {
  'use strict';

  let unsubscribe = null;
  let container = null;
  let foodId = null;
  let rating = 5; // 默认 5 星

  function onEnter(param, el) {
    container = el;
    foodId = param;
    rating = 5; // 每次进入重置为默认值
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

  // 提交打卡
  function submitCheckIn() {
    const noteInput = container.querySelector('#checkin-note');
    const note = noteInput ? noteInput.value : '';

    Actions.checkIn(foodId, {
      rating: rating,
      photo: '',
      note: note
    });
    UI.toast('打卡成功！');
    Router.goBack();
  }

  function render(state) {
    const food = Actions.getFoodById(foodId);

    // 美食不存在
    if (!food) {
      container.innerHTML = `
        <div id="checkin-nav"></div>
        <div class="checkin-body">
          ${EmptyState.render('❓', '美食不存在', '可能已被删除')}
          <div style="padding: 0 var(--space-md); margin-top: var(--space-md);">
            <button class="btn btn-primary btn-block" id="checkin-go-back">返回</button>
          </div>
        </div>`;
      NavBar.mount(container.querySelector('#checkin-nav'), '打卡', null);
      const goBackBtn = container.querySelector('#checkin-go-back');
      if (goBackBtn) {
        goBackBtn.addEventListener('click', () => Router.goBack());
      }
      return;
    }

    const emoji = Actions.getTagEmoji(food.tag);
    const meta = food.place
      ? food.tag + ' · 📍 ' + food.place
      : food.tag;

    // 保留当前备注内容（防止重渲染时丢失）
    let noteValue = '';
    const existingNote = container.querySelector('#checkin-note');
    if (existingNote) {
      noteValue = existingNote.value;
    }

    container.innerHTML = `
      <div id="checkin-nav"></div>
      <div class="checkin-page">
        <div class="checkin-food-info">
          <div class="cfi-icon">${emoji}</div>
          <div class="cfi-body">
            <div class="cfi-name">${FoodCard.escapeHtml(food.name)}</div>
            <div class="cfi-meta">${FoodCard.escapeHtml(meta)}</div>
          </div>
        </div>
        <div class="checkin-rating-section">
          <div class="rating-label">给这次体验打分</div>
          ${RatingStars.render(rating, true)}
          <div class="rating-display">${RatingStars.getLabel(rating)}</div>
        </div>
        <div class="form-group">
          <label class="form-label">添加照片</label>
          <div class="photo-placeholder">
            <div class="photo-icon">📷</div>
            <div class="photo-text">点击添加照片</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="checkin-note">评价备注</label>
          <textarea class="form-textarea" id="checkin-note" placeholder="说说这次的体验..."></textarea>
        </div>
        <button class="btn btn-primary btn-block" id="checkin-submit">完成打卡</button>
        <div class="page-bottom-spacer"></div>
      </div>`;

    // 挂载 NavBar
    NavBar.mount(
      container.querySelector('#checkin-nav'),
      '打卡',
      { text: '提交', id: 'submit', callback: submitCheckIn }
    );

    // 恢复备注内容
    const noteInput = container.querySelector('#checkin-note');
    if (noteInput) noteInput.value = noteValue;

    // 绑定星级评分交互
    RatingStars.bind(container, rating, (val) => {
      rating = val;
    });

    // 绑定提交按钮
    const submitBtn = container.querySelector('#checkin-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', submitCheckIn);
    }
  }

  return { onEnter, onLeave };
})();
