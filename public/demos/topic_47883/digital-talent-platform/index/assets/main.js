(function() {
  'use strict';

  // Mobile menu toggle
  var navToggle = document.getElementById('navToggle');
  var navMenu = document.getElementById('navMenu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });

    // Close menu when clicking a link
    var navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        navMenu.classList.remove('active');
      });
    });
  }

  // Navbar background on scroll
  var navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        navbar.style.background = 'rgba(15, 23, 42, 0.95)';
      } else {
        navbar.style.background = 'rgba(15, 23, 42, 0.85)';
      }
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        var offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
    });
  });

  // Login Modal Logic
  var loginModal = document.getElementById('loginModal');
  var openLoginBtns = document.querySelectorAll('[data-open-login]');
  var closeLoginBtn = document.getElementById('closeLogin');
  var loginForm = document.getElementById('loginForm');

  function openModal() {
    if (loginModal) {
      loginModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (loginModal) {
      loginModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  openLoginBtns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      openModal();
    });
  });

  if (closeLoginBtn) {
    closeLoginBtn.addEventListener('click', closeModal);
  }

  if (loginModal) {
    loginModal.addEventListener('click', function(e) {
      if (e.target === loginModal) {
        closeModal();
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      alert('登录功能正在开发中，敬请期待！');
      closeModal();
    });
  }

  // Intersection Observer for fade-in animations
  var observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe section elements for animation
  var animatedElements = document.querySelectorAll('.about-card, .portal-card, .chain-item, .loop-step, .feature-card');
  animatedElements.forEach(function(el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
})();
