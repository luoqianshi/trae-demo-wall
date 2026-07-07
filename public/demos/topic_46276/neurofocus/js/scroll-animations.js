/* ================================================================
   脑衡 NeuroFocus — Scroll Animations v3.0
   原生 JS · requestAnimationFrame · IntersectionObserver
   ================================================================ */

var ScrollAnim = (function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth < 960;

  var dom = {};
  var ticking = false;

  /* ---------- Init ---------- */
  function init() {
    cacheDom();
    if (prefersReducedMotion) {
      revealAll();
      return;
    }
    initScrollProgress();
    initNavbarScroll();
    initRevealObserver();
    initStaggerReveal();
    initCountUp();
    initScienceLightUp();
    initHeroScroll();
  }

  /* ---------- Cache DOM ---------- */
  function cacheDom() {
    dom.scrollProgress = document.getElementById('scrollProgress');
    dom.navbar = document.getElementById('navbar');
    dom.hero = document.getElementById('hero');
    dom.heroStage = document.getElementById('heroHeadphoneStage');
    dom.revealEls = document.querySelectorAll('.reveal');
  }

  /* ---------- Reveal All (reduced motion) ---------- */
  function revealAll() {
    if (dom.revealEls) {
      dom.revealEls.forEach(function (el) { el.classList.add('revealed'); });
    }
  }

  /* ---------- Scroll Progress Bar ---------- */
  function initScrollProgress() {
    if (!dom.scrollProgress) return;
    window.addEventListener('scroll', requestTick, { passive: true });
  }

  function updateScrollProgress() {
    if (!dom.scrollProgress) return;
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    dom.scrollProgress.style.width = progress + '%';
  }

  /* ---------- Navbar Scroll State ---------- */
  function initNavbarScroll() {
    if (!dom.navbar) return;
  }

  function updateNavbar() {
    if (!dom.navbar) return;
    if (window.scrollY > 20) {
      dom.navbar.classList.add('scrolled');
    } else {
      dom.navbar.classList.remove('scrolled');
    }
  }

  /* ---------- Reveal Observer (fade-up) ---------- */
  function initRevealObserver() {
    if (!dom.revealEls || dom.revealEls.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      revealAll();
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    dom.revealEls.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- iOS Stagger Reveal ---------- */
  function initStaggerReveal() {
    var staggerItems = document.querySelectorAll('.ios-stagger');
    if (staggerItems.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      staggerItems.forEach(function (item) { item.classList.add('ios-visible'); });
      return;
    }

    var staggerObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('ios-visible');
          staggerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    staggerItems.forEach(function (item) {
      staggerObserver.observe(item);
    });
  }

  /* ---------- v28 Count-up Numbers ---------- */
  function initCountUp() {
    var countEls = document.querySelectorAll('[data-count-target]');
    if (countEls.length === 0) return;

    function setCountValue(el, val) {
      var prefix = el.dataset.countPrefix || '';
      var suffix = el.dataset.countSuffix || '';
      var decimals = parseFloat(el.dataset.countTarget) % 1 !== 0 ? 1 : 0;
      var text = prefix + val.toFixed(decimals) + suffix;
      if (el.children.length > 0) {
        el.firstChild.nodeValue = text;
      } else {
        el.textContent = text;
      }
    }

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      countEls.forEach(function(el) {
        setCountValue(el, parseFloat(el.dataset.countTarget));
      });
      return;
    }
    var countObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseFloat(el.dataset.countTarget);
          var duration = 1200;
          var start = performance.now();
          function frame(now) {
            var progress = Math.min(1, (now - start) / duration);
            var eased = 1 - Math.pow(1 - progress, 3);
            setCountValue(el, target * eased);
            if (progress < 1) {
              requestAnimationFrame(frame);
            } else {
              setCountValue(el, target);
            }
          }
          requestAnimationFrame(frame);
          countObserver.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    countEls.forEach(function(el) { countObserver.observe(el); });
  }

  /* ---------- v28 Science Mechanism Light-up ---------- */
  function initScienceLightUp() {
    var mechs = document.querySelectorAll('.science-mechanism');
    if (mechs.length === 0) return;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      mechs.forEach(function(m) { m.classList.add('lit'); });
      return;
    }
    var mechObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var container = entry.target;
          var items = container.querySelectorAll('.science-mechanism');
          items.forEach(function(item, i) {
            setTimeout(function() {
              item.classList.add('lit');
            }, i * 200);
          });
          mechObserver.unobserve(container);
        }
      });
    }, { threshold: 0.2 });
    var containers = document.querySelectorAll('.science-mechanisms-container');
    if (containers.length > 0) {
      containers.forEach(function(c) { mechObserver.observe(c); });
    } else {
      mechs.forEach(function(m) { mechObserver.observe(m); });
    }
  }

  /* ---------- Hero Scroll Parallax ---------- */
  function initHeroScroll() {
    if (!dom.hero || !dom.heroStage) return;
  }

  function updateHeroParallax() {
    if (!dom.hero || !dom.heroStage) return;
    var heroRect = dom.hero.getBoundingClientRect();
    var heroHeight = dom.hero.offsetHeight;

    if (heroRect.bottom < 0) return;

    var progress = Math.min(1, Math.max(0, -heroRect.top / heroHeight));

    var scale = 1 + progress * 0.08;
    var tx = progress * 20;
    var ty = -progress * 15;
    var opacity = 1 - progress * 0.3;
    dom.heroStage.style.transform = 'translate3d(' + tx + 'px, ' + ty + 'px, 0) scale(' + scale + ')';
    dom.heroStage.style.opacity = opacity;

    var floatCards = dom.heroStage.querySelectorAll('.float-card');
    floatCards.forEach(function (card, i) {
      card.style.transform = 'translateY(' + (-progress * 12) + 'px)';
    });
  }

  /* ---------- Collapsible (Why Brain Break / EEG Basis) ---------- */
  function toggleCollapse(button) {
    var container = button.parentElement;
    container.classList.toggle('open');
  }

  /* ---------- FAQ Accordion ---------- */
  function toggleFAQ(button) {
    var item = button.parentElement;
    var wasOpen = item.classList.contains('open');

    var allItems = document.querySelectorAll('#faqList .faq-item');
    allItems.forEach(function (i) { i.classList.remove('open'); });

    if (!wasOpen) {
      item.classList.add('open');
    }
  }

  /* ---------- Scroll Throttle (rAF) ---------- */
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(tick);
      ticking = true;
    }
  }

  function tick() {
    updateScrollProgress();
    updateNavbar();
    updateHeroParallax();
    ticking = false;
  }

  /* ---------- Re-init on navigate to home ---------- */
  function reinit() {
    if (prefersReducedMotion) {
      revealAll();
      return;
    }

    if (dom.revealEls) {
      dom.revealEls.forEach(function (el) {
        if (!el.classList.contains('revealed')) {
          var rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add('revealed');
          }
        }
      });
    }

    if (dom.heroStage) {
      dom.heroStage.style.transform = '';
      dom.heroStage.style.opacity = '';
    }
  }

  /* ---------- Public API ---------- */
  return {
    init: init,
    reinit: reinit,
    toggleFAQ: toggleFAQ,
    toggleCollapse: toggleCollapse
  };
})();
