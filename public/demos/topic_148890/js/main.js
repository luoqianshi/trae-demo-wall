(function() {
  'use strict';

  const navbar = document.getElementById('navbar');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  let scrolled = false;
  let mobileMenuOpen = false;

  function handleScroll() {
    const y = window.scrollY || window.pageYOffset;
    if (y > 40 && !scrolled) {
      navbar.classList.add('scrolled');
      scrolled = true;
    } else if (y <= 40 && scrolled) {
      navbar.classList.remove('scrolled');
      scrolled = false;
    }
  }

  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
    if (mobileMenuOpen) {
      mobileMenu.classList.add('open');
      mobileMenuBtn.classList.add('active');
      mobileMenuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    } else {
      mobileMenu.classList.remove('open');
      mobileMenuBtn.classList.remove('active');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }

  function closeMobileMenu() {
    if (mobileMenuOpen) {
      mobileMenuOpen = false;
      mobileMenu.classList.remove('open');
      mobileMenuBtn.classList.remove('active');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }

  mobileMenuBtn.addEventListener('click', toggleMobileMenu);

  mobileMenu.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', closeMobileMenu);
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileMenuOpen) {
      closeMobileMenu();
    }
  });

  function handleAnchorClick(e) {
    const targetId = e.currentTarget.getAttribute('href');
    if (targetId && targetId.startsWith('#') && targetId.length > 1) {
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const navbarHeight = navbar.offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight + 1;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', handleAnchorClick);
  });

  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');
    
    if (!('IntersectionObserver' in window)) {
      animatedElements.forEach(function(el) {
        el.classList.add('visible');
      });
      return;
    }

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(function(el) {
      observer.observe(el);
    });
  }

  function handleResize() {
    if (window.innerWidth >= 768 && mobileMenuOpen) {
      closeMobileMenu();
    }
  }

  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 100);
  });

  function setActiveNavLink() {
    const sections = document.querySelectorAll('section[id], footer[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    const navbarHeight = navbar.offsetHeight;

    let currentSection = '';

    sections.forEach(function(section) {
      const sectionTop = section.offsetTop - navbarHeight - 100;
      const sectionBottom = sectionTop + section.offsetHeight;
      const scrollY = window.scrollY;

      if (scrollY >= sectionTop && scrollY < sectionBottom) {
        currentSection = '#' + section.id;
      }
    });

    navLinks.forEach(function(link) {
      if (link.getAttribute('href') === currentSection) {
        link.style.color = 'var(--state-success)';
      } else {
        link.style.color = '';
      }
    });
  }

  window.addEventListener('scroll', function() {
    requestAnimationFrame(setActiveNavLink);
  }, { passive: true });

  document.addEventListener('DOMContentLoaded', function() {
    handleScroll();
    initScrollAnimations();
    setActiveNavLink();
  });

  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    handleScroll();
    initScrollAnimations();
    setActiveNavLink();
  }
})();
