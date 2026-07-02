/**
 * App Entry — 晚安角落 (Ember Night)
 */
(function () {
  'use strict';

  // ═══ PC 提示（不阻断）═══
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 0 && window.innerWidth < 768);

  if (!isMobile) {
    const tip = document.createElement('div');
    tip.style.cssText = 'position:fixed;bottom:20px;right:20px;background:rgba(30,30,30,0.9);color:#E8DFD0;font-family:serif;font-size:0.8rem;padding:12px 16px;border-radius:8px;z-index:9999;opacity:1;transition:opacity 1s;';
    tip.textContent = '推荐在手机上体验';
    document.body.appendChild(tip);
    setTimeout(() => { tip.style.opacity = '0'; }, 3000);
    setTimeout(() => { tip.remove(); }, 4000);
  }

  // ═══ 初始化引擎 ═══
  AudioEngine.init();
  DecayEngine.init();

  // ═══ 预加载音频 ═══
  const audioFiles = [
    ['env_night', 'audio/env_night.mp3'],
    ['env_ocean', 'audio/env_ocean.mp3'],
    ['env_rain', 'audio/env_rain.mp3'],
    ['sfx_water', 'audio/sfx_water.mp3'],
    ['sfx_wood', 'audio/sfx_wood.mp3'],
    ['sfx_cloth', 'audio/sfx_cloth.mp3'],
    ['sfx_chime', 'audio/sfx_chime.mp3'],
  ];
  audioFiles.forEach(([name, url]) => AudioEngine.load(name, url));

  // ═══ Wake Lock ═══
  WakeLockManager.acquire();

  // ═══ Service Worker ═══
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // ═══ 防止默认滚动/缩放 ═══
  document.addEventListener('touchmove', (e) => {
    if (e.target.closest('.pier-prompt')) return; // 允许选项区域滚动
    e.preventDefault();
  }, { passive: false });

  // ═══ 启动 ═══
  StateManager.init();
})();
