import { navigateTo } from '../router.js';

const items = [
  { id: 'home', label: '首页', path: '/', icon: '../../assets/icons/source/home.svg' },
  { id: 'services', label: '报修', path: '/services', icon: '../../assets/icons/source/wrench.svg' },
  { id: 'workers', label: '师傅', path: '/search', icon: '../../assets/icons/source/technician.svg' },
  { id: 'orders', label: '订单', path: '/orders', icon: '../../assets/icons/source/orders.svg' },
  { id: 'profile', label: '我的', path: '/profile', icon: '../../assets/icons/source/profile.svg' }
];

class BottomNavigation {
  constructor(container, activeId) {
    this.container = container;
    this.activeId = activeId;
    this.render();
  }

  render() {
    this.container.className = 'bottom-navigation';
    this.container.setAttribute('aria-label', '主要导航');
    this.container.innerHTML = items.map(item => {
      const active = item.id === this.activeId;
      return `
        <button class="bottom-nav-item${active ? ' active' : ''}" data-path="${item.path}" ${active ? 'aria-current="page"' : ''}>
          <img src="${item.icon}" alt="" aria-hidden="true">
          <span>${item.label}</span>
        </button>
      `;
    }).join('');

    this.container.querySelectorAll('.bottom-nav-item').forEach(button => {
      button.addEventListener('click', () => navigateTo(button.dataset.path));
    });
  }
}

export { BottomNavigation };
