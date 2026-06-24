/* ============================================================
   心径官网主页交互 main.js
   功能：星空粒子背景 / 罗盘指针旋转 / 滚动入场动画 / 导航栏效果 / 平滑滚动
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. 星空粒子背景动画（Canvas） ---------- */
  function initStarfield() {
    const canvas = document.getElementById('starCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    let shootingStars = [];
    let w = 0, h = 0;
    let rafId = null;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // 根据面积生成星点数量
      const count = Math.min(180, Math.floor((w * h) / 9000));
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.4 + 0.3,
          baseAlpha: Math.random() * 0.6 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          phase: Math.random() * Math.PI * 2,
          color: Math.random() > 0.85 ? '#F59F00' : (Math.random() > 0.6 ? '#8FA5F0' : '#F5F3FF')
        });
      }
    }

    function spawnShootingStar() {
      if (Math.random() > 0.997 && shootingStars.length < 2) {
        shootingStars.push({
          x: Math.random() * w * 0.5,
          y: Math.random() * h * 0.3,
          len: Math.random() * 80 + 60,
          speed: Math.random() * 6 + 6,
          angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1),
          alpha: 1
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // 绘制静态星点
      for (const s of stars) {
        s.phase += s.twinkleSpeed;
        const alpha = s.baseAlpha + Math.sin(s.phase) * 0.3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, alpha));
        ctx.fill();
        // 较大星点加光晕
        if (s.r > 1.1) {
          ctx.globalAlpha = Math.max(0.05, alpha * 0.3);
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // 绘制流星
      spawnShootingStar();
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        const tailX = ss.x - Math.cos(ss.angle) * ss.len;
        const tailY = ss.y - Math.sin(ss.angle) * ss.len;
        const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
        grad.addColorStop(0, 'rgba(245,159,0,' + ss.alpha + ')');
        grad.addColorStop(1, 'rgba(245,159,0,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.alpha -= 0.012;
        if (ss.alpha <= 0 || ss.x > w || ss.y > h) {
          shootingStars.splice(i, 1);
        }
      }

      rafId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    let resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        cancelAnimationFrame(rafId);
        resize();
        draw();
      }, 200);
    });
  }

  /* ---------- 2. 导航栏滚动效果 ---------- */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    const onScroll = function () {
      if (window.scrollY > 30) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- 3. 滚动入场动画（IntersectionObserver） ---------- */
  function initReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    if (!('IntersectionObserver' in window)) {
      // 降级：直接显示
      reveals.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    reveals.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- 4. 平滑滚动（锚点） ---------- */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href.length < 2) return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const navHeight = 72;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  /* ---------- 5. 移动端菜单切换（简单实现） ---------- */
  function initMobileMenu() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', function () {
      // 简单切换显示
      if (links.style.display === 'flex') {
        links.style.display = '';
      } else {
        links.style.display = 'flex';
        links.style.position = 'absolute';
        links.style.top = '72px';
        links.style.right = '24px';
        links.style.flexDirection = 'column';
        links.style.background = 'rgba(14,18,38,0.98)';
        links.style.padding = '16px 24px';
        links.style.borderRadius = '14px';
        links.style.border = '1px solid rgba(200,164,92,0.2)';
        links.style.gap = '14px';
      }
    });
    // 点击链接后收起
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (window.innerWidth <= 640) {
          links.style.display = '';
          links.style.position = '';
        }
      });
    });
  }

  /* ---------- 6. 状态栏时间（demo 页用，主页无） ---------- */
  function initStatusTime() {
    const el = document.getElementById('statusTime');
    if (!el) return;
    const update = function () {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      el.textContent = h + ':' + m;
    };
    update();
    setInterval(update, 30000);
  }

  /* ---------- 启动 ---------- */
  function init() {
    initStarfield();
    initNavbar();
    initReveal();
    initSmoothScroll();
    initMobileMenu();
    initStatusTime();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
