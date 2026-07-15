const NAV_LINKS = [
  { href: 'map-timeline.html', id: 'nav-map', label: '轨迹地图' },
  { href: 'trip-entry.html', id: 'nav-entry', label: '录入行程' },
  { href: 'album.html', id: 'nav-album', label: '旅途相册' },
  { href: 'playback.html', id: 'nav-playback', label: '时光回放' }
];

function renderNavigation(activePage) {
  return `
    <nav style="background: rgba(255,252,248,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid var(--color-border); position: fixed; top: 0; left: 0; right: 0; z-index: 50; box-shadow: var(--shadow-sm);">
      <div style="max-width: 1200px; margin: 0 auto; padding: 0.875rem 1.5rem; display: flex; align-items: center; justify-content: space-between;">
        <a href="index.html" style="display: flex; align-items: center; gap: 0.5rem; text-decoration: none; color: var(--color-text-primary);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="var(--color-primary-lighter)" stroke="var(--color-primary)"/>
          </svg>
          <span style="font-family: var(--font-display); font-size: var(--text-xl); font-weight: 700; color: var(--color-primary);">人生轨迹</span>
        </a>
        <div style="display: flex; align-items: center; gap: 2rem;" class="nav-links-desktop">
          ${NAV_LINKS.map(link => `
            <a href="${link.href}" class="nav-link ${activePage === link.id ? 'active' : ''}" data-dom-id="${link.id}" style="font-size: var(--text-sm); text-decoration: none; font-weight: 500;">
              ${link.label}
            </a>
          `).join('')}
        </div>
        <a href="trip-entry.html" class="btn-primary" style="text-decoration: none; font-size: var(--text-sm); padding: 0.5rem 1.25rem;">开始记录</a>
        <button class="mobile-menu-btn" onclick="toggleMobileMenu()" style="display: none; background: none; border: none; cursor: pointer; padding: 0.5rem; color: var(--color-text-primary);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="mobile-menu" id="mobileMenu" style="display: none; background: var(--color-surface-elevated); border-top: 1px solid var(--color-border); padding: 1rem 1.5rem;">
        ${NAV_LINKS.map(link => `
          <a href="${link.href}" style="display: block; padding: 0.75rem 0; color: var(--color-text-secondary); text-decoration: none; font-size: var(--text-base); border-bottom: 1px solid var(--color-border);">
            ${link.label}
          </a>
        `).join('')}
        <a href="trip-entry.html" style="display: block; margin-top: 1rem; text-align: center;" class="btn-primary">开始记录</a>
      </div>
    </nav>
  `;
}

function renderFooter() {
  return `
    <footer style="background: var(--color-neutral-50); border-top: 1px solid var(--color-border); padding: var(--space-2xl) 0;">
      <div style="max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-lg);">
        <span style="font-family: var(--font-display); font-size: var(--text-sm); color: var(--color-text-tertiary);">人生轨迹 · 时光旅行可视化</span>
        <div style="display: flex; gap: var(--space-xl); flex-wrap: wrap;">
          <a href="#" style="font-size: var(--text-sm); color: var(--color-text-tertiary); text-decoration: none; transition: color var(--transition-fast);">关于我们</a>
          <a href="#" style="font-size: var(--text-sm); color: var(--color-text-tertiary); text-decoration: none; transition: color var(--transition-fast);">使用帮助</a>
          <a href="#" style="font-size: var(--text-sm); color: var(--color-text-tertiary); text-decoration: none; transition: color var(--transition-fast);">隐私政策</a>
        </div>
        <span style="font-size: var(--text-xs); color: var(--color-text-tertiary);">© 2026 人生轨迹</span>
      </div>
    </footer>
  `;
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) {
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  }
}

function addResponsiveStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      .nav-links-desktop {
        display: none !important;
      }
      .mobile-menu-btn {
        display: block !important;
      }
      .hero-grid {
        flex-direction: column !important;
      }
      .hero-grid > div:first-child,
      .hero-grid > div:last-child {
        flex: 0 0 100% !important;
        max-width: 100% !important;
      }
      .hero-grid > div:last-child {
        margin-top: var(--space-xl);
        order: -1;
      }
      .hero-grid h1 {
        font-size: var(--text-3xl) !important;
      }
      .feature-grid {
        grid-template-columns: 1fr !important;
      }
      .steps-flow {
        flex-direction: column !important;
        align-items: center !important;
      }
      .steps-flow > div {
        max-width: 280px !important;
      }
      .step-arrow {
        transform: rotate(90deg);
        padding-top: 0 !important;
      }
      .two-col-layout {
        flex-direction: column !important;
      }
      .two-col-layout > div {
        width: 100% !important;
      }
      .masonry-grid {
        column-count: 1 !important;
      }
      .sidebar-layout {
        flex-direction: column !important;
      }
      .sidebar-layout > aside {
        width: 100% !important;
      }
    }
    @media (max-width: 1024px) {
      .masonry-grid {
        column-count: 2 !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function initPage(activeNav) {
  const navContainer = document.getElementById('nav-container');
  const footerContainer = document.getElementById('footer-container');
  
  if (navContainer) {
    navContainer.innerHTML = renderNavigation(activeNav);
  }
  if (footerContainer) {
    footerContainer.innerHTML = renderFooter();
  }
  
  addResponsiveStyles();
  
  if (window.lucide) {
    lucide.createIcons();
  }
}

function getStats() {
  const totalCities = TRIP_DATA.length + 4;
  const totalTrips = TRIP_DATA.length;
  const totalPhotos = TRIP_DATA.reduce((sum, trip) => sum + trip.photos, 0);
  const totalDistance = 23450;
  return { totalCities, totalTrips, totalPhotos, totalDistance };
}
