/* ========== rating-stars.js — 星级评分组件 ========== */

const RatingStars = (() => {
  'use strict';

  const RATING_LABELS = ['', '很差', '一般', '还行', '不错', '超赞'];

  // interactive: 是否可交互
  function render(rating, interactive) {
    const cls = interactive ? '' : ' readonly';
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      const active = i <= rating ? ' active' : '';
      stars += `<span class="rating-star${active}" data-star="${i}">★</span>`;
    }
    return `<div class="rating-stars${cls}" data-rating="${rating}">${stars}</div>`;
  }

  // 绑定交互事件
  function bind(container, currentRating, callback) {
    const stars = container.querySelectorAll('.rating-star');
    const display = container.querySelector('.rating-display');

    stars.forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.star, 10);
        // 更新星星状态
        stars.forEach((s, i) => {
          s.classList.toggle('active', i < val);
        });
        // 更新显示文字
        if (display) {
          display.textContent = RATING_LABELS[val];
        }
        if (callback) callback(val);
      });

      // 悬停效果
      star.addEventListener('mouseenter', () => {
        const val = parseInt(star.dataset.star, 10);
        stars.forEach((s, i) => {
          s.style.color = i < val ? 'var(--star)' : '';
        });
      });
    });

    // 鼠标离开恢复
    const ratingContainer = container.querySelector('.rating-stars');
    if (ratingContainer) {
      ratingContainer.addEventListener('mouseleave', () => {
        stars.forEach((s, i) => {
          s.style.color = '';
        });
      });
    }
  }

  function getLabel(rating) {
    return RATING_LABELS[rating] || '';
  }

  return { render, bind, getLabel };
})();
