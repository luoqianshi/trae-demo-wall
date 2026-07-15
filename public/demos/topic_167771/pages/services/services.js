import { NavigationBar } from '../../components/navigation-bar.js';
import { BottomNavigation } from '../../components/bottom-navigation.js';
import { repairShortcuts } from '../../mock/repairShortcuts.js';
import { navigateTo } from '../../router.js';

function renderShortcuts() {
  const grid = document.getElementById('shortcut-grid');
  grid.innerHTML = repairShortcuts.map(item => `
    <button class="shortcut-card" data-id="${item.id}" aria-label="${item.title}，${item.description}">
      <span class="shortcut-icon-wrap tone-${item.id}"><img src="${item.iconPath}" alt=""></span>
      <strong>${item.title}</strong>
      <small>${item.description}</small>
    </button>
  `).join('');

  grid.querySelectorAll('.shortcut-card').forEach(card => {
    card.addEventListener('click', () => {
      const item = repairShortcuts.find(shortcut => shortcut.id === card.dataset.id);
      if (!item) return;
      navigateTo(item.action === 'repair' ? `/repair?serviceType=${encodeURIComponent(item.serviceType)}` : item.target);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  new NavigationBar(document.getElementById('navigation-bar'), { title: '报修服务', back: false, background: '#FFFDF9' });
  new BottomNavigation(document.getElementById('bottom-navigation'), 'services');
  renderShortcuts();
  document.getElementById('other-entry').addEventListener('click', () => navigateTo('/repair?serviceType=other'));
});
