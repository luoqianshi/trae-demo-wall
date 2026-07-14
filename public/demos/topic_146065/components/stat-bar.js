/* ========== stat-bar.js — 统计卡片组件 ========== */

const StatBar = (() => {
  'use strict';

  function render(stats) {
    const { total, pending, done } = stats;
    return `
      <div class="stat-bar">
        <div class="stat-item">
          <div class="stat-num">${total}</div>
          <div class="stat-label">总收藏</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-num accent">${pending}</div>
          <div class="stat-label">待探索</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-num green">${done}</div>
          <div class="stat-label">已尝试</div>
        </div>
      </div>`;
  }

  return { render };
})();
