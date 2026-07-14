/* ========== food-card.js — 美食卡片组件 ========== */

const FoodCard = (() => {
  'use strict';

  // mode: 'list' (首页列表, 带操作按钮) | 'simple' (发现页, 仅展示) | 'compact' (打卡历史)
  function render(food, mode) {
    mode = mode || 'list';
    const emoji = Actions.getTagEmoji(food.tag);
    const doneClass = food.done ? ' done' : '';
    const statusClass = food.done ? 'done' : 'pending';
    const statusIcon = food.done ? '✓' : '';

    // 卡片主体
    let actions = '';
    if (mode === 'list') {
      actions = `
        <div class="card-actions">
          <div class="card-action-btn" data-action="toggle" data-id="${food.id}" title="切换状态">${food.done ? '↩' : '✓'}</div>
          <div class="card-action-btn" data-action="delete" data-id="${food.id}" title="删除">🗑</div>
        </div>`;
    }

    return `
      <div class="food-card${doneClass}" data-food-id="${food.id}">
        <div class="card-icon">${emoji}</div>
        <div class="card-body">
          <div class="card-name">${escapeHtml(food.name)}</div>
          <div class="card-meta">
            <span class="card-tag">${food.tag}</span>
            ${food.place ? `<span class="card-place">📍 ${escapeHtml(food.place)}</span>` : ''}
          </div>
        </div>
        ${actions}
        <div class="card-status ${statusClass}" data-action="status" data-id="${food.id}">${statusIcon}</div>
      </div>`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { render, escapeHtml };
})();
