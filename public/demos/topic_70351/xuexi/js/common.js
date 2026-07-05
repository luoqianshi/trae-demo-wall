(function () {
  const Nav = {
    init() {
      this.bindMenuToggle();
      this.setActiveNav();
    },
    bindMenuToggle() {
      const btn = document.querySelector('[data-nav-toggle]');
      const menu = document.querySelector('[data-mobile-nav]');
      if (!btn || !menu) return;
      btn.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen);
        const icon = btn.querySelector('[data-lucide]');
        if (icon) {
          icon.setAttribute('data-lucide', isOpen ? 'x' : 'menu');
          if (window.lucide) lucide.createIcons({ attrs: { 'stroke-width': 2 } });
        }
      });
      document.addEventListener('click', (e) => {
        if (!menu.classList.contains('open')) return;
        if (menu.contains(e.target) || btn.contains(e.target)) return;
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        const icon = btn.querySelector('[data-lucide]');
        if (icon) {
          icon.setAttribute('data-lucide', 'menu');
          if (window.lucide) lucide.createIcons();
        }
      });
    },
    setActiveNav() {
      const path = window.location.pathname.split('/').pop() || 'index.html';
      const map = {
        'index.html': 'home',
        'reading.html': 'reading',
        'writing.html': 'writing',
      };
      const key = map[path] || 'home';
      document.querySelectorAll('[data-nav]').forEach((el) => {
        el.classList.toggle('active', el.dataset.nav === key);
      });
    },
  };

  const ScrollReveal = {
    init() {
      const items = document.querySelectorAll('.fade-in');
      if (!items.length) return;

      const makeVisible = (el) => el.classList.add('visible');

      const isInViewport = (el) => {
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0 && rect.width > 0 && rect.height > 0;
      };

      // Immediately reveal elements already in viewport on load
      items.forEach((el) => {
        if (isInViewport(el)) makeVisible(el);
      });

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                makeVisible(entry.target);
                io.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
        );
        items.forEach((el, i) => {
          el.style.transitionDelay = `${Math.min(i * 60, 300)}ms`;
          io.observe(el);
          // Safety fallback: ensure content becomes visible
          setTimeout(() => makeVisible(el), 2500 + i * 100);
        });
      } else {
        items.forEach((el) => makeVisible(el));
      }
    },
  };

  const SmoothScroll = {
    init() {
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
          const id = a.getAttribute('href');
          if (!id || id === '#') return;
          const target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    },
  };

  const NavScrollEffect = {
    init() {
      const nav = document.querySelector('[data-nav-bar]');
      if (!nav) return;
      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          if (window.scrollY > 8) {
            nav.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
          } else {
            nav.style.boxShadow = 'none';
          }
          ticking = false;
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    Nav.init();
    ScrollReveal.init();
    SmoothScroll.init();
    NavScrollEffect.init();
  });
})();
