/* ========== filter-tabs.js — 筛选标签组件 ========== */

const FilterTabs = (() => {
  'use strict';

  const FILTERS = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待探索' },
    { value: 'done', label: '已尝试' }
  ];

  function render(currentFilter) {
    const tabs = FILTERS.map(f => {
      const active = f.value === currentFilter ? ' active' : '';
      return `<div class="filter-tab${active}" data-filter="${f.value}">${f.label}</div>`;
    }).join('');
    return `<div class="filter-tabs">${tabs}</div>`;
  }

  // 绑定点击事件
  function bind(container, callback) {
    container.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const filter = tab.dataset.filter;
        callback(filter);
      });
    });
  }

  return { render, bind };
})();
