/* ========== empty-state.js — 空状态组件 ========== */

const EmptyState = (() => {
  'use strict';

  function render(icon, title, desc) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${icon || '🍽️'}</div>
        <div class="empty-title">${FoodCard.escapeHtml(title || '暂无数据')}</div>
        ${desc ? `<div class="empty-desc">${FoodCard.escapeHtml(desc)}</div>` : ''}
      </div>`;
  }

  return { render };
})();
