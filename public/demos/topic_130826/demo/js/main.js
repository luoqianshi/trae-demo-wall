(function () {
  'use strict';

  var navItems = [
    { id: 'index', label: '项目首页', href: 'index.html' },
    { id: 'explore', label: '就业体验', href: 'explore.html' },
    { id: 'create', label: '创业体验', href: 'create.html' },
    { id: 'archive', label: '成长档案', href: 'archive.html' },
    { id: 'value', label: '价值意义', href: 'value.html' },
  ];

  var currentPage = document.body.dataset.page || 'index';

  function renderNav() {
    var navRoot = document.getElementById('nav-root');
    if (!navRoot) return;

    var desktopLinks = navItems.map(function (item) {
      var isActive = item.id === currentPage;
      var cls = isActive
        ? 'px-4 py-2 rounded-lg text-sm font-medium text-amber-600 nav-link is-active'
        : 'px-4 py-2 rounded-lg text-sm font-medium text-[#3D3229] hover:text-amber-600 hover:bg-amber-50 transition-colors nav-link';
      return '<a href="' + item.href + '" data-page="' + item.id + '" class="' + cls + '">' + item.label + '</a>';
    }).join('');

    var mobileLinks = navItems.map(function (item) {
      var isActive = item.id === currentPage;
      var cls = isActive
        ? 'px-4 py-2.5 rounded-lg text-sm font-medium text-amber-600 bg-amber-50'
        : 'px-4 py-2.5 rounded-lg text-sm font-medium text-[#3D3229] hover:text-amber-600 hover:bg-amber-50 transition-colors';
      return '<a href="' + item.href + '" data-page="' + item.id + '" class="' + cls + '">' + item.label + '</a>';
    }).join('');

    navRoot.innerHTML =
      '<nav class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-amber-100 shadow-sm">' +
        '<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">' +
          '<div class="flex items-center justify-between h-16">' +
            '<a href="index.html" class="flex items-center gap-2 group">' +
              '<span class="inline-block w-8 h-8 rounded-full bg-amber-400 flex-shrink-0" aria-hidden="true"></span>' +
              '<span class="text-xl font-bold text-[#3D3229] tracking-tight">人生预演</span>' +
            '</a>' +
            '<div class="hidden md:flex items-center gap-1">' + desktopLinks + '</div>' +
            '<button id="mobile-menu-btn" class="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-[#3D3229] hover:bg-amber-50 hover:text-amber-600 transition-colors" aria-label="打开菜单" aria-expanded="false">' +
              '<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">' +
                '<path id="hamburger-icon" stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>' +
                '<path id="close-icon" class="hidden" stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>' +
              '</svg>' +
            '</button>' +
          '</div>' +
          '<div id="mobile-menu" class="md:hidden pb-0 border-t border-amber-100 mt-1 pt-3">' +
            '<div class="flex flex-col gap-1 pb-4">' + mobileLinks + '</div>' +
          '</div>' +
        '</div>' +
      '</nav>';

    initMobileMenu();
  }

  function renderFooter() {
    var footerRoot = document.getElementById('footer-root');
    if (!footerRoot) return;
    footerRoot.innerHTML =
      '<footer class="bg-[#FFF8ED] border-t border-amber-100 mt-auto">' +
        '<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">' +
          '<div class="flex flex-col items-center gap-3">' +
            '<div class="flex items-center gap-2 mb-1">' +
              '<span class="inline-block w-5 h-5 rounded-full bg-amber-400" aria-hidden="true"></span>' +
              '<span class="text-base font-bold text-[#3D3229]">人生预演</span>' +
            '</div>' +
            '<p class="text-sm text-[#3D3229]/70 leading-relaxed max-w-md">体验所有职业、创造无限可能</p>' +
            '<div class="flex items-center gap-2 mt-1">' +
              '<span class="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">#学习工作</span>' +
              '<span class="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">#社会公益</span>' +
            '</div>' +
            '<div class="w-12 h-px bg-amber-200 my-3"></div>' +
            '<p class="text-xs text-[#3D3229]/40">&copy; 2026 人生预演. All rights reserved.</p>' +
          '</div>' +
        '</div>' +
      '</footer>';
  }

  function initMobileMenu() {
    var btn = document.getElementById('mobile-menu-btn');
    var menu = document.getElementById('mobile-menu');
    var hamburger = document.getElementById('hamburger-icon');
    var closeIcon = document.getElementById('close-icon');
    if (!btn || !menu) return;

    btn.addEventListener('click', function () {
      var isOpen = menu.classList.contains('is-open');
      menu.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
      if (hamburger && closeIcon) {
        hamburger.classList.toggle('hidden', !isOpen);
        closeIcon.classList.toggle('hidden', isOpen);
      }
    });
  }

  function initScrollReveal() {
    var elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    if (!window.IntersectionObserver) {
      elements.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(function (el) { observer.observe(el); });
  }

  function parseTarget(str) {
    var num = parseFloat(str);
    var suffix = str.replace(/[\d.]/g, '').trim();
    return { value: num, suffix: suffix };
  }

  function animateCounter(el) {
    var target = el.dataset.target;
    if (!target) return;
    var parsed = parseTarget(target);
    var duration = 1200;
    var start = null;
    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = parsed.value * eased;
      if (Number.isInteger(parsed.value)) {
        el.textContent = Math.floor(current) + parsed.suffix;
      } else {
        el.textContent = current.toFixed(1) + parsed.suffix;
      }
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = parsed.value + parsed.suffix;
      }
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    // 成长档案页有自己管理的 counters，跳过
    if (currentPage === 'archive') return;
    var counters = document.querySelectorAll('.counter');
    if (!counters.length) return;

    if (!window.IntersectionObserver) {
      counters.forEach(animateCounter);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (c) { observer.observe(c); });
  }

  function initDecisionQuiz() {
    var container = document.getElementById('decision-quiz');
    if (!container) return;

    var options = container.querySelectorAll('.quiz-option');
    var feedback = document.getElementById('quiz-feedback');
    if (!feedback) return;

    options.forEach(function (btn) {
      btn.addEventListener('click', function () {
        options.forEach(function (b) { b.classList.remove('selected', 'ring-2', 'ring-amber-500'); });
        btn.classList.add('selected', 'ring-2', 'ring-amber-500');

        var text = btn.dataset.feedback || '这是一个值得思考的选择，每个决策都会塑造不同的创业路径。';
        feedback.innerHTML = '<div class="flex items-start gap-3"><div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0"><i data-lucide="sparkles" class="w-4 h-4 text-amber-600"></i></div><div><p class="text-sm font-semibold text-[var(--foreground)]">AI 顾问反馈</p><p class="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">' + text + '</p></div></div>';
        feedback.classList.add('is-visible');
        if (window.lucide && window.lucide.createIcons) {
          window.lucide.createIcons();
        }
      });
    });
  }

  function initIcons() {
    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderNav();
    renderFooter();
    initScrollReveal();
    initCounters();
    initDecisionQuiz();
    initIcons();
  });
})();
