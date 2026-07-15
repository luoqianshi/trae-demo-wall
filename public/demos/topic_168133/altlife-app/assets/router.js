/**
 * AltLife App - Global Router
 * 处理 data-target-page-id 跳转、返回按钮、Tab栏激活状态、手机外壳包裹
 * 同时兼容两种运行环境：
 *   1. Canvas预览（iframe中）：阻止<a>默认跳转，让SDK通过data-dom-id+interactions接管
 *   2. 浏览器直开（顶级窗口）：允许href正常跳转，页面外包裹手机边框
 */
(function() {
  'use strict';

  const IS_IFRAME = window.self !== window.top;

  // pageId -> html文件映射
  const PAGE_MAP = {
    'page-index': '01-index.html',
    'page-splash': '01-index.html',
    'page-01-index': '01-index.html',
    'page-home': '02-home.html',
    'page-02-home': '02-home.html',
    'page-search': '03-search.html',
    'page-03-search': '03-search.html',
    'page-notifications': '04-notifications.html',
    'page-04-notifications': '04-notifications.html',
    'page-discover': '05-discover.html',
    'page-05-discover': '05-discover.html',
    'page-test': '06-test.html',
    'page-06-test': '06-test.html',
    'page-auction': '07-auction-detail.html',
    'page-auction-detail': '07-auction-detail.html',
    'page-07-auction-detail': '07-auction-detail.html',
    'page-life-detail': '08-life-detail.html',
    'page-08-life-detail': '08-life-detail.html',
    'page-host': '09-host-profile.html',
    'page-host-profile': '09-host-profile.html',
    'page-09-host-profile': '09-host-profile.html',
    'page-chat': '10-chat.html',
    'page-10-chat': '10-chat.html',
    'page-booking': '11-booking.html',
    'page-11-booking': '11-booking.html',
    'page-success': '12-success.html',
    'page-12-success': '12-success.html',
    'page-review': '13-review.html',
    'page-13-review': '13-review.html',
    'page-memory': '14-memory.html',
    'page-14-memory': '14-memory.html',
    'page-orders': '15-orders.html',
    'page-15-orders': '15-orders.html',
    'page-favorites': '16-favorites.html',
    'page-16-favorites': '16-favorites.html',
    'page-profile': '17-profile.html',
    'page-17-profile': '17-profile.html',
    'page-settings': '18-settings.html',
    'page-18-settings': '18-settings.html',
    'page-publish': '19-publish.html',
    'page-19-publish': '19-publish.html',
    'page-publish-form': '20-publish-form.html',
    'page-20-publish-form': '20-publish-form.html'
  };

  function navigateTo(pageId) {
    const target = PAGE_MAP[pageId];
    if (target) {
      window.location.href = target;
    } else {
      console.warn('[Router] Unknown pageId:', pageId);
    }
  }

  // 手机外壳包裹（仅顶级窗口）
  function wrapWithPhoneFrame() {
    if (IS_IFRAME) return;

    // 避免重复包裹
    if (document.getElementById('__altlife_phone_stage')) return;

    // 创建外层舞台（灰色背景，居中）
    const stage = document.createElement('div');
    stage.id = '__altlife_phone_stage';
    Object.assign(stage.style, {
      position: 'fixed',
      inset: '0',
      background: 'linear-gradient(135deg, #e8e4df 0%, #d4cec7 50%, #c8c0b8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflow: 'auto',
      zIndex: '99999'
    });

    // 创建手机外壳（深色边框）
    const phone = document.createElement('div');
    phone.id = '__altlife_phone_frame';
    Object.assign(phone.style, {
      position: 'relative',
      width: '390px',
      height: '844px',
      background: '#1a1a1a',
      borderRadius: '54px',
      padding: '12px',
      boxShadow: '0 0 0 2px #333, 0 30px 60px rgba(0,0,0,0.35), 0 10px 30px rgba(0,0,0,0.25), inset 0 0 2px rgba(255,255,255,0.08)',
      flexShrink: '0'
    });

    // 侧边按钮（静音/音量）
    const btnLeft1 = document.createElement('div');
    Object.assign(btnLeft1.style, { position:'absolute', left:'-3px', top:'110px', width:'3px', height:'30px', background:'#2a2a2a', borderRadius:'2px 0 0 2px' });
    const btnLeft2 = document.createElement('div');
    Object.assign(btnLeft2.style, { position:'absolute', left:'-3px', top:'160px', width:'3px', height:'55px', background:'#2a2a2a', borderRadius:'2px 0 0 2px' });
    const btnLeft3 = document.createElement('div');
    Object.assign(btnLeft3.style, { position:'absolute', left:'-3px', top:'225px', width:'3px', height:'55px', background:'#2a2a2a', borderRadius:'2px 0 0 2px' });
    const btnRight = document.createElement('div');
    Object.assign(btnRight.style, { position:'absolute', right:'-3px', top:'180px', width:'3px', height:'90px', background:'#2a2a2a', borderRadius:'0 2px 2px 0' });
    phone.appendChild(btnLeft1);
    phone.appendChild(btnLeft2);
    phone.appendChild(btnLeft3);
    phone.appendChild(btnRight);

    // 保存body内容
    const bodyChildren = Array.from(document.body.childNodes);

    // 提前检测页面是否自带状态栏
    const hasStatusBar = bodyChildren.some(function(n) {
      return n.nodeType === 1 && (
        (n.classList && n.classList.contains('status-bar')) ||
        (n.querySelector && n.querySelector('.status-bar'))
      );
    });

    // 屏幕容器
    const screen = document.createElement('div');
    screen.id = '__altlife_phone_screen';
    Object.assign(screen.style, {
      position: 'relative',
      width: '100%',
      height: '100%',
      background: '#fff',
      borderRadius: '42px',
      overflow: 'hidden',
      transform: 'translateZ(0)',
      webkitTransform: 'translateZ(0)',
      isolation: 'isolate'
    });

    // 把body的背景色迁移到screen
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent') {
      screen.style.background = bodyBg;
    }
    const bodyBgImage = window.getComputedStyle(document.body).backgroundImage;
    if (bodyBgImage && bodyBgImage !== 'none') {
      screen.style.backgroundImage = bodyBgImage;
      screen.style.backgroundSize = window.getComputedStyle(document.body).backgroundSize;
      screen.style.backgroundPosition = window.getComputedStyle(document.body).backgroundPosition;
    }

    // 灵动岛（顶部）
    const dynamicIsland = document.createElement('div');
    Object.assign(dynamicIsland.style, {
      position: 'absolute',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '120px',
      height: '32px',
      background: '#000',
      borderRadius: '18px',
      zIndex: '100001'
    });
    screen.appendChild(dynamicIsland);

    // 顶部内容遮挡层（挡住状态栏区域下的滚动内容，仅在有状态栏的页面添加）
    // z-index=25 低于sticky header的z-30=30，确保header滚动到顶部时在mask上方
    let topMask = null;
    if (hasStatusBar) {
      topMask = document.createElement('div');
      topMask.id = '__altlife_top_mask';
      Object.assign(topMask.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '54px',
        background: screen.style.background || '#fff',
        zIndex: '25'
      });
      screen.appendChild(topMask);
    }

    // Home indicator（底部）
    const homeIndicator = document.createElement('div');
    Object.assign(homeIndicator.style, {
      position: 'absolute',
      bottom: '8px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '134px',
      height: '5px',
      background: '#000',
      borderRadius: '3px',
      zIndex: '100001',
      opacity: '0.85'
    });
    // 启动页是深色背景，home indicator应该是白色，通过JS动态切换
    homeIndicator.id = '__altlife_home_indicator';
    screen.appendChild(homeIndicator);

    // 将body原有内容移入screen
    const contentWrap = document.createElement('div');
    contentWrap.id = '__altlife_content';
    Object.assign(contentWrap.style, {
      position: 'absolute',
      inset: '0',
      overflowY: 'auto',
      overflowX: 'hidden',
      webkitOverflowScrolling: 'touch',
      paddingBottom: '24px',
      boxSizing: 'border-box'
    });
    if (hasStatusBar) {
      contentWrap.style.paddingTop = '54px';
    }

    bodyChildren.forEach(child => {
      if (child.nodeType === 1 || child.nodeType === 3) {
        contentWrap.appendChild(child);
      }
    });
    screen.appendChild(contentWrap);

    // ===== 提升固定元素到screen层级，使其不随内容滚动 =====
    // 1. 提升status-bar到screen顶部
    const statusBar = contentWrap.querySelector('.status-bar');
    if (statusBar) {
      screen.appendChild(statusBar);
      Object.assign(statusBar.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        zIndex: '100002'
      });
    }
    // 2. 提升底部Tab栏到screen底部
    const tabBar = contentWrap.querySelector('nav[aria-label="底部导航"], nav.fixed.bottom-0, .tab-bar, [data-tab-bar]');
    if (tabBar) {
      screen.appendChild(tabBar);
      Object.assign(tabBar.style, {
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        zIndex: '100000'
      });
      // 确保内容区底部留出Tab栏高度（Tab栏原高56px，加安全区）
      contentWrap.style.paddingBottom = 'calc(56px + 24px)';
    }

    phone.appendChild(screen);
    stage.appendChild(phone);

    // 清空body并添加stage
    // 保留script/link/style等head相关标签不动，但body里除了我们加的都要移走
    // 实际上DOMContentLoaded时body已包含所有可见内容，直接清空body后append stage即可
    // 但要注意：后续执行的内联script可能还会往body加东西，所以我们把contentWrap作为"新body"
    document.body.innerHTML = '';
    document.body.appendChild(stage);

    // 重写appendChild等方法，让后续动态添加的元素也进入screen
    const originalAppendChild = document.body.appendChild.bind(document.body);
    document.body.appendChild = function(node) {
      // script标签直接添加到body（保持执行）
      if (node.tagName === 'SCRIPT') {
        return originalAppendChild(node);
      }
      return contentWrap.appendChild(node);
    };

    // 检测是否是深色背景页面（启动页/深色主题页面），更新home indicator颜色
    function updateHomeIndicator() {
      try {
        // 检查第一个main/主要容器的背景色
        const main = contentWrap.querySelector('main');
        if (!main) return;
        const bg = window.getComputedStyle(main).backgroundColor;
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        // 解析rgb判断深浅
        const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          const r = parseInt(match[1]), g = parseInt(match[2]), b = parseInt(match[3]);
          const brightness = (r*299 + g*587 + b*114) / 1000;
          homeIndicator.style.background = brightness < 100 ? '#fff' : '#000';
        } else {
          // 启动页body是深色
          const bodyMatch = (bodyBg || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (bodyMatch) {
            const r = parseInt(bodyMatch[1]), g = parseInt(bodyMatch[2]), b = parseInt(bodyMatch[3]);
            const brightness = (r*299 + g*587 + b*114) / 1000;
            homeIndicator.style.background = brightness < 100 ? '#fff' : '#000';
          }
        }
      } catch(e) {}
    }
    setTimeout(updateHomeIndicator, 100);
    setTimeout(updateHomeIndicator, 500);

    // 阻止body滚动，让screen内部滚动
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  // DOM ready后
  document.addEventListener('DOMContentLoaded', function() {

    // ====== 顶级窗口：包裹手机外壳 ======
    if (!IS_IFRAME) {
      wrapWithPhoneFrame();
    }

    // ====== iframe环境（Canvas预览）处理 ======
    if (IS_IFRAME) {
      document.querySelectorAll('a[data-dom-id]').forEach(function(el) {
        el.addEventListener('click', function(e) {
          e.preventDefault();
        }, true);
      });

      document.querySelectorAll('[data-target-page-id]').forEach(function(el) {
        el.addEventListener('click', function(e) {
          e.preventDefault();
        }, true);
      });

      document.querySelectorAll('a[href]').forEach(function(el) {
        const href = el.getAttribute('href');
        if (href && href.endsWith('.html') && href !== '#') {
          if (!el.hasAttribute('data-dom-id') && !el.hasAttribute('data-target-page-id')) {
            el.addEventListener('click', function(e) {
              e.preventDefault();
              console.warn('[Router] Link to', href, 'has no data-dom-id; navigation blocked in canvas preview');
            }, true);
          }
        }
      });
    }

    // ====== 顶级窗口（浏览器直开）处理 ======
    document.querySelectorAll('[data-target-page-id]').forEach(function(el) {
      if (el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href') !== '#' && el.getAttribute('href').endsWith('.html')) {
        return;
      }
      el.style.cursor = 'pointer';
      el.addEventListener('click', function(e) {
        e.preventDefault();
        const pageId = el.getAttribute('data-target-page-id');
        navigateTo(pageId);
      });
    });

    // 返回按钮
    document.querySelectorAll('[data-action="back"], .btn-back, [data-dom-id="btn-back"], [data-dom-id="btn-close-publish"]').forEach(function(el) {
      if (el._backBound) return;
      el._backBound = true;
      el.style.cursor = 'pointer';
      el.addEventListener('click', function(e) {
        if (el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href') !== '#' && el.getAttribute('href').endsWith('.html')) return;
        if (IS_IFRAME) return;
        e.preventDefault();
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = '02-home.html';
        }
      });
    });

    // data-navigate
    document.querySelectorAll('[data-navigate]').forEach(function(el) {
      if (IS_IFRAME) return;
      el.style.cursor = 'pointer';
      el.addEventListener('click', function(e) {
        e.preventDefault();
        const href = el.getAttribute('data-navigate');
        window.location.href = href;
      });
    });
  });

  // AltLife.go(url) - 兼容canvas预览和浏览器直开
  function go(url) {
    if (IS_IFRAME) {
      console.log('[Router] go() in iframe, navigation deferred to canvas SDK:', url);
      return;
    }
    window.location.href = url;
  }

  window.AltLife = {
    go: go,
    navigateTo: navigateTo,
    goBack: function() {
      if (IS_IFRAME) return;
      if (window.history.length > 1) window.history.back();
      else window.location.href = '02-home.html';
    },
    PAGE_MAP: PAGE_MAP,
    isIframe: IS_IFRAME
  };
})();
