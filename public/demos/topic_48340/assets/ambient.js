/* 公共环境动效：搪瓷杯浮起、印章脉动、背景漂移、滚动入场 */
(function () {
  'use strict';

  function initAmbient() {
    var cup = document.querySelector('.object-card');
    if (cup) {
      cup.style.transition = 'transform .8s ease';
      var t0 = 0;
      function float() {
        t0 += 0.012;
        var y = Math.sin(t0) * 6;
        var r = -2 + Math.sin(t0 * 0.6) * 0.6;
        cup.style.transform = 'rotate(' + r.toFixed(2) + 'deg) translateY(' + y.toFixed(2) + 'px)';
        requestAnimationFrame(float);
      }
      requestAnimationFrame(float);
    }
    var stamp = document.querySelector('.stamp');
    if (stamp) {
      stamp.style.animation = 'stampPulse 2.6s ease-in-out infinite';
    }
    document.body.style.animation = 'bgDrift 22s ease-in-out infinite';
  }

  function initReveal() {
    var candidates = document.querySelectorAll('section, .hero > div, .meta-strip, .quote, .card, .entry-card, .demo-shell, .memory-section, .time-item, .mech');
    candidates.forEach(function (el) { el.classList.add('will-reveal'); });
    var style = document.createElement('style');
    style.textContent = '.will-reveal{opacity:0;transform:translateY(18px);transition:opacity .7s ease, transform .7s ease}.will-reveal.in{opacity:1;transform:translateY(0)}';
    document.head.appendChild(style);

    if (!('IntersectionObserver' in window)) {
      candidates.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    candidates.forEach(function (el) { io.observe(el); });
  }

  function showToast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { el.classList.remove('show'); }, 1600);
  }

  window.__showToast = showToast;

  function init() {
    initAmbient();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
