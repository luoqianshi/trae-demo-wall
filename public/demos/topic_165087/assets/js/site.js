/* ============================================================
   DROP SNACKS V6C · 公开叙事站点共享脚本
   范围：header 状态 / 移动导航 / IntersectionObserver /
         食品对象轻微视差 / Life Opens 转场 /
         页面进入过渡 / Reduced Motion 检测
   约束：无外部依赖、不阻塞浏览器返回键、不写 localStorage
   ============================================================ */
// Progressive enhancement: 立即标记 JS 可用，不等 DOMContentLoaded
document.documentElement.classList.add('js');

(function(){
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COARSE = window.matchMedia('(pointer: coarse)').matches;

  function ready(fn){
    if(document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function $(sel, ctx){ return (ctx || document).querySelector(sel); }
  function $$(sel, ctx){ return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- Header 滚动状态 ---------- */
  function initHeaderScroll(){
    var header = $('.site-header');
    if(!header) return;
    var lastY = -1;
    function onScroll(){
      var y = window.scrollY || window.pageYOffset;
      if(y === lastY) return;
      lastY = y;
      if(y > 8) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    }
    window.addEventListener('scroll', onScroll, { passive:true });
    onScroll();
  }

  /* ---------- 移动导航开关 ---------- */
  function initMobileNav(){
    var header = $('.site-header');
    var toggle = $('.nav-toggle');
    var nav = $('.nav-list');
    if(!header || !toggle || !nav) return;

    function open(){
      header.classList.add('is-nav-open');
      toggle.setAttribute('aria-expanded','true');
      var firstLink = nav.querySelector('a');
      if(firstLink) firstLink.focus();
    }
    function close(){
      header.classList.remove('is-nav-open');
      toggle.setAttribute('aria-expanded','false');
    }
    function isOpen(){ return header.classList.contains('is-nav-open'); }

    toggle.addEventListener('click', function(){
      if(isOpen()) close(); else open();
    });
    // 点击导航项后自动关闭（移动端）
    $$('a', nav).forEach(function(a){
      a.addEventListener('click', function(){
        if(window.innerWidth <= 980) close();
      });
    });
    // Esc 关闭
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && isOpen()){
        close();
        toggle.focus();
      }
    });
    // 焦点陷阱（移动端导航打开时）
    nav.addEventListener('keydown', function(e){
      if(!isOpen()) return;
      if(e.key !== 'Tab') return;
      var links = $$('a[href], button', nav);
      if(links.length === 0) return;
      var first = links[0];
      var last = links[links.length - 1];
      if(e.shiftKey && document.activeElement === first){
        e.preventDefault(); last.focus();
      } else if(!e.shiftKey && document.activeElement === last){
        e.preventDefault(); first.focus();
      }
    });
    // 尺寸跨越时复位
    window.addEventListener('resize', function(){
      if(window.innerWidth > 980) close();
    });
  }

  /* ---------- IntersectionObserver 渐显 ---------- */
  function initReveal(){
    if(REDUCED){
      $$('[data-reveal],[data-reveal-stagger]').forEach(function(el){
        el.classList.add('is-revealed');
      });
      return;
    }
    var items = $$('[data-reveal],[data-reveal-stagger]');
    if(items.length === 0) return;
    if(!('IntersectionObserver' in window)){
      items.forEach(function(el){ el.classList.add('is-revealed'); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    }, { root:null, rootMargin:'0px 0px -10% 0px', threshold:0.12 });
    items.forEach(function(el){ io.observe(el); });
  }

  /* ---------- Hero 食品对象轻微视差（4-8px） ---------- */
  function initParallax(){
    if(REDUCED || COARSE) return;
    var nodes = $$('[data-parallax]');
    if(nodes.length === 0) return;
    var MAX = 6;
    function onMove(e){
      var x = (e.clientX / window.innerWidth - 0.5) * 2;
      var y = (e.clientY / window.innerHeight - 0.5) * 2;
      nodes.forEach(function(el){
        var depth = parseFloat(el.getAttribute('data-parallax')) || 1;
        var tx = x * MAX * depth;
        var ty = y * MAX * depth;
        el.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
      });
    }
    window.addEventListener('mousemove', onMove, { passive:true });
  }

  /* ---------- One Object Story 阶段联动 ---------- */
  function initObjectStory(){
    var stages = $$('.object-stage');
    var visual = $('.object-story__visual [data-object-stage]');
    if(stages.length === 0) return;
    if(REDUCED || !('IntersectionObserver' in window)){
      stages.forEach(function(s){ s.classList.add('is-active'); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-active');
          var idx = stages.indexOf(entry.target);
          if(idx !== -1 && visual){
            visual.setAttribute('data-stage', idx);
            // 触发 SVG 状态更新
            var event = new CustomEvent('objectstage', { detail:{ index:idx } });
            visual.dispatchEvent(event);
          }
        }
      });
    }, { root:null, rootMargin:'-30% 0px -50% 0px', threshold:0 });
    stages.forEach(function(s){ io.observe(s); });
  }

  /* ---------- Life Opens 核心转场 ---------- */
  function initLifeOpens(){
    var section = $('.life-opens');
    if(!section) return;
    var triggered = false;

    function open(){
      if(triggered) return;
      triggered = true;
      section.classList.add('is-open');
    }
    function reset(){
      triggered = false;
      section.classList.remove('is-open');
    }

    if(REDUCED || !('IntersectionObserver' in window)){
      // Reduced Motion：直接展示已展开状态（CSS 已强制覆盖可见性）
      section.classList.add('is-open');
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting && entry.intersectionRatio >= 0.5){
          open();
        }
      });
    }, { threshold:[0.5, 0.7] });
    io.observe(section);

    // 允许向上回滚后重置（让用户可重新体验）
    var resetIo = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting && entry.boundingClientRect.top > 0){
          // 章节滚出底部以下，不重置
        }
      });
    }, { threshold:0 });
  }

  /* ---------- Capture 模式高亮 ---------- */
  function initCaptureHover(){
    if(REDUCED) return;
    var cells = $$('.capture-mode');
    cells.forEach(function(c){
      c.addEventListener('mouseenter', function(){
        c.style.background = 'rgba(20,184,166,.04)';
      });
      c.addEventListener('mouseleave', function(){
        c.style.background = '';
      });
    });
  }

  /* ---------- 页面进入过渡 ---------- */
  function initPageEnter(){
    if(REDUCED) return;
    var main = $('main');
    if(!main) return;
    main.style.opacity = '0';
    main.style.transform = 'translateY(8px)';
    main.style.transition = 'opacity .4s var(--ease-soft), transform .4s var(--ease-soft)';
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        main.style.opacity = '1';
        main.style.transform = 'translateY(0)';
      });
    });
  }

  /* ---------- 当前导航高亮（基于 URL 解析） ---------- */
  function initNavCurrent(){
    var navLinks = $$('.nav-list a');
    if(navLinks.length === 0) return;

    // 清除旧的 aria-current
    navLinks.forEach(function(a){ a.removeAttribute('aria-current'); });

    // 标准化路径：去除末尾斜杠，将 /index.html 视为目录根
    function normalizePath(pathname){
      // 去除末尾斜杠
      var p = pathname.replace(/\/+$/,'');
      // 将 /index.html 视为目录根
      if(p.length >= 11 && p.substring(p.length - 11) === '/index.html'){
        p = p.substring(0, p.length - 11);
      } else if(p === 'index.html'){
        p = '';
      }
      return p;
    }

    var currentPath = normalizePath(window.location.pathname);
    var currentSegments = currentPath.split('/').filter(Boolean);
    // 当前页面所在目录的末段（如 why-now, trust）
    var currentDir = currentSegments.length > 0 ? currentSegments[currentSegments.length - 1] : '';

    var matched = false;
    navLinks.forEach(function(a){
      if(matched) return;
      var href = a.getAttribute('href') || '';
      if(!href || href.charAt(0) === '#') return;

      try {
        var targetUrl = new URL(href, window.location.href);
        var targetPath = normalizePath(targetUrl.pathname);
        var targetSegments = targetPath.split('/').filter(Boolean);
        var targetDir = targetSegments.length > 0 ? targetSegments[targetSegments.length - 1] : '';

        // 首页匹配：当前在根目录或 index.html
        if(targetSegments.length === 0){
          if(currentSegments.length === 0 || (currentSegments.length === 1 && currentSegments[0] === 'index.html')){
            a.setAttribute('aria-current','page');
            matched = true;
          }
        } else {
          // 非首页：目标目录末段与当前目录末段一致
          if(targetDir === currentDir && targetDir !== ''){
            a.setAttribute('aria-current','page');
            matched = true;
          }
        }
      } catch(e){
        // URL 解析失败，跳过
      }
    });
  }

  /* ---------- Echoes 层级切换（仅视觉演示） ---------- */
  function initEchoLayers(){
    var layers = $$('.echo-layer');
    if(layers.length === 0) return;
    layers.forEach(function(l){
      l.addEventListener('click', function(){
        layers.forEach(function(x){ x.classList.remove('echo-layer--active'); x.setAttribute('aria-pressed','false'); });
        l.classList.add('echo-layer--active');
        l.setAttribute('aria-pressed','true');
      });
    });
  }

  /* ---------- 暴露给首页使用的辅助函数 ---------- */
  window.DropSnacksSite = {
    isReducedMotion: function(){ return REDUCED; },
    isCoarsePointer: function(){ return COARSE; }
  };

  /* ---------- 启动 ---------- */
  ready(function(){
    initHeaderScroll();
    initMobileNav();
    initNavCurrent();
    initReveal();
    initParallax();
    initObjectStory();
    initLifeOpens();
    initCaptureHover();
    initEchoLayers();
    initPageEnter();
  });
})();
