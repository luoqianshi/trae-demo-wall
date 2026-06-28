/* 《AI进家-让爱到家》公用脚本 */
(function () {
  // Toast 简易封装
  window.toast = function (msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window.__toastT);
    window.__toastT = setTimeout(function () { t.classList.remove('show'); }, 1800);
  };

  // IntersectionObserver 滚动淡入
  function initFade() {
    var sections = document.querySelectorAll('section, .card, .entry-card, .quote');
    for (var i = 0; i < sections.length; i++) {
      sections[i].style.opacity = '0';
      sections[i].style.transform = 'translateY(14px)';
      sections[i].style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    }
    if (!('IntersectionObserver' in window)) {
      for (var j = 0; j < sections.length; j++) {
        sections[j].style.opacity = '1';
        sections[j].style.transform = 'none';
      }
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'none';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    for (var k = 0; k < sections.length; k++) io.observe(sections[k]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFade);
  } else {
    initFade();
  }
})();
