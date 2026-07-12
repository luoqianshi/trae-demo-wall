/* ============================================================
 * 背景动画：星空 / 云雾 / 仙鹤 / 花瓣
 * 延后到首屏渲染之后再生成，避免抢占主线程
 * ============================================================ */
(function () {
  'use strict';
  
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function start() {
    if (prefersReducedMotion) {
      document.querySelectorAll('.bg-stars, .bg-clouds, .bg-crane, .bg-petals').forEach(el => {
        el.style.display = 'none';
      });
      return;
    }

    // 星空（从60颗减少到30颗）
    const stars = document.getElementById('bgStars');
    if (stars) {
      const n = 30;
      for (let i = 0; i < n; i++) {
        const s = document.createElement('i');
        s.style.left = Math.random() * 100 + '%';
        s.style.top = Math.random() * 60 + '%';
        s.style.animationDelay = (Math.random() * 5) + 's';
        s.style.animationDuration = (3 + Math.random() * 4) + 's';
        s.style.transform = 'scale(' + (0.6 + Math.random() * 0.8) + ')';
        stars.appendChild(s);
      }
    }

    // 云雾（从5朵减少到3朵）
    const clouds = document.getElementById('bgClouds');
    if (clouds) {
      const n = 3;
      for (let i = 0; i < n; i++) {
        const c = document.createElement('div');
        c.className = 'cloud';
        c.style.top = (10 + Math.random() * 35) + '%';
        c.style.width = (200 + Math.random() * 150) + 'px';
        c.style.height = (80 + Math.random() * 50) + 'px';
        c.style.opacity = (0.3 + Math.random() * 0.25).toFixed(2);
        c.style.animationDuration = (80 + Math.random() * 70) + 's';
        c.style.animationDelay = (-Math.random() * 80) + 's';
        clouds.appendChild(c);
      }
    }

    // 仙鹤（SVG）
    const crane = document.getElementById('bgCrane');
    if (crane) {
      crane.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20,55 Q35,30 55,38 Q70,44 82,30"/>
          <path d="M55,38 Q58,50 50,62 Q46,70 42,80"/>
          <path d="M55,38 Q62,48 70,58"/>
          <circle cx="82" cy="30" r="3" fill="#c23a2b" stroke="none"/>
          <path d="M84,30 L90,28"/>
        </g></svg>`;
    }

    // 花瓣（从18片减少到10片）
    const petals = document.getElementById('bgPetals');
    if (petals) {
      const n = 10;
      for (let i = 0; i < n; i++) {
        const p = document.createElement('span');
        p.className = 'petal';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (12 + Math.random() * 10) + 's';
        p.style.animationDelay = (-Math.random() * 15) + 's';
        p.style.opacity = (0.35 + Math.random() * 0.35).toFixed(2);
        const sz = 10 + Math.random() * 8;
        p.style.width = sz + 'px';
        p.style.height = sz + 'px';
        const hues = [
          'linear-gradient(135deg,#f4b0c0,#e88aa0)',
          'linear-gradient(135deg,#f5d76e,#e8a87c)',
          'linear-gradient(135deg,#e8d4b8,#d4b896)'
        ];
        p.style.background = hues[i % hues.length];
        petals.appendChild(p);
      }
    }

    // 滚动入场动画：首屏元素直接显示，仅在视口外的才做入场
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.12 });
    document.querySelectorAll('.panel, .action-card, .footer').forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) return;
      el.classList.add('reveal');
      el.style.transitionDelay = (i * 0.05) + 's';
      io.observe(el);
    });
  }
  // 延后执行：先让首屏内容渲染，背景动画稍后再补
  if (window.requestIdleCallback) requestIdleCallback(start, { timeout: 1000 });
  else setTimeout(start, 100);
})();
