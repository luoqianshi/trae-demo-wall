/* ========== tab-bar.js — 底部导航栏组件 ========== */

const TabBar = (() => {
  'use strict';

  const TABS = [
    { name: 'home', icon: '🏠', label: '首页' },
    { name: 'discover', icon: '🧭', label: '发现' },
    { name: 'profile', icon: '👤', label: '我的' }
  ];

  function render() {
    const items = TABS.map(tab => {
      const active = tab.name === 'home' ? ' active' : '';
      return `<div class="tab-item${active}" data-tab="${tab.name}">
        <span class="tab-icon">${tab.icon}</span>
        <span>${tab.label}</span>
      </div>`;
    }).join('');
    return `<div class="tab-bar">${items}</div>`;
  }

  function mount(container) {
    container.innerHTML = render();
    container.querySelectorAll('.tab-item').forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        Router.switchTab(tab);
      });
    });
  }

  function setActive(tabName) {
    const items = document.querySelectorAll('.tab-item');
    items.forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });
  }

  return { render, mount, setActive };
})();
