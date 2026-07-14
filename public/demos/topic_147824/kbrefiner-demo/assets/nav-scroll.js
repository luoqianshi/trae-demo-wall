(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    initNavScroll();
    initSectionObserver();
    initNavLinks();
  });

  function initNavScroll() {
    var nav = document.getElementById('main-nav');
    var threshold = 200;

    window.addEventListener('scroll', function() {
      if (window.scrollY > threshold) {
        nav.classList.add('visible');
      } else {
        nav.classList.remove('visible');
      }
    });
  }

  function initNavLinks() {
    var links = document.querySelectorAll('#main-nav .nav-links a');
    links.forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var href = this.getAttribute('href');
        if (href.startsWith('#')) {
          var targetId = href.substring(1);
          if (window.AppUtils) {
            window.AppUtils.scrollTo(targetId);
          }
        }
      });
    });
  }

  function initSectionObserver() {
    var sections = document.querySelectorAll('.module-section');

    sections.forEach(function(section) {
      section.classList.add('animate-on-scroll');
    });

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    sections.forEach(function(section) {
      observer.observe(section);
    });
  }

})();