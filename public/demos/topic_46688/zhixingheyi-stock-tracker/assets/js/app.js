/**
 * 知行合一盈亏记录系统 - 应用主控制器
 */
var App = (function() {
  'use strict';

  var currentView = null;
  var currentViewDestroy = null;

  // === 路由注册 ===
  function init() {
    Router.register('landing', function(route) {
      showLanding();
    });

    Router.register('app/dashboard', function(route) {
      showApp('dashboard');
    });

    Router.register('app/trades', function(route) {
      if (route.param === 'new') {
        showApp('trade-form', { mode: 'new' });
      } else if (route.param && route.param.indexOf('edit/') === 0) {
        var id = route.param.replace('edit/', '');
        showApp('trade-form', { mode: 'edit', editId: id });
      } else {
        showApp('trade-list');
      }
    });

    Router.register('app/statistics', function(route) {
      showApp('statistics');
    });

    Router.register('app/winrate', function(route) {
      showApp('winrate');
    });

    Router.register('app/emotion', function(route) {
      showApp('emotion');
    });

    Router.register('app/risk', function(route) {
      showApp('risk');
    });

    Router.register('app/export', function(route) {
      showApp('export');
    });

    // Subscribe to store changes for risk alerts
    Store.subscribe(function(eventType, data) {
      updateRiskAlerts();
      updateSidebarRisk();
    });

    Router.init();
  }

  // === 落地页模式 ===
  function showLanding() {
    var landingEl = document.getElementById('landing-view');
    var appEl = document.getElementById('app-view');
    if (landingEl) landingEl.classList.remove('hidden');
    if (appEl) appEl.classList.remove('active');

    // CTA button handler
    var ctaBtn = document.querySelector('.cta-button');
    if (ctaBtn) {
      ctaBtn.onclick = function(e) {
        e.preventDefault();
        Router.navigate('#app/dashboard');
      };
    }

    // Landing nav start button
    var startBtn = document.getElementById('nav-start-btn');
    if (startBtn) {
      startBtn.onclick = function(e) {
        e.preventDefault();
        Router.navigate('#app/dashboard');
      };
    }

    // Fade in animation
    initFadeIn();
  }

  // === 应用模式 ===
  function showApp(view, options) {
    var landingEl = document.getElementById('landing-view');
    var appEl = document.getElementById('app-view');
    if (landingEl) landingEl.classList.add('hidden');
    if (appEl) appEl.classList.add('active');

    // First-time onboarding guide
    if (!Store.isLandingViewed()) {
      Store.setLandingViewed(true);
      showOnboarding();
    }

    // Destroy previous view's charts
    if (currentViewDestroy) {
      currentViewDestroy();
      currentViewDestroy = null;
    }

    // Update navigation
    updateNav(view);
    updateSidebar(view);

    // Render view
    var mainEl = document.getElementById('app-main');
    if (!mainEl) return;

    switch (view) {
      case 'dashboard':
        currentViewDestroy = Dashboard.destroy.bind(Dashboard);
        Dashboard.render(mainEl);
        break;
      case 'trade-list':
        TradeList.render(mainEl);
        break;
      case 'trade-form':
        TradeForm.render(mainEl, options || {});
        break;
      case 'statistics':
        currentViewDestroy = Statistics.destroy.bind(Statistics);
        Statistics.render(mainEl);
        break;
      case 'winrate':
        currentViewDestroy = WinRate.destroy.bind(WinRate);
        WinRate.render(mainEl);
        break;
      case 'emotion':
        currentViewDestroy = EmotionTracker.destroy.bind(EmotionTracker);
        EmotionTracker.render(mainEl);
        break;
      case 'risk':
        RiskControl.render(mainEl);
        break;
      case 'export':
        ExportModule.render(mainEl);
        break;
    }
    currentView = view;

    // Update risk alerts
    updateRiskAlerts();
    updateSidebarRisk();
  }

  // === 导航更新 ===
  function updateNav(activeView) {
    var tabs = document.querySelectorAll('.app-nav .nav-tab');
    tabs.forEach(function(tab) {
      var view = tab.getAttribute('data-view');
      if (view === activeView || (view === 'trades' && (activeView === 'trade-list' || activeView === 'trade-form'))) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  function updateSidebar(activeView) {
    var items = document.querySelectorAll('.sidebar-item');
    items.forEach(function(item) {
      var view = item.getAttribute('data-view');
      if (view === activeView || (view === 'trades' && (activeView === 'trade-list' || activeView === 'trade-form'))) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // === 风控提醒更新 ===
  function updateRiskAlerts() {
    var bar = document.getElementById('risk-alert-bar');
    if (!bar) return;
    var alerts = Store.checkRiskAlerts();
    // Show the most severe alert
    var danger = alerts.filter(function(a) { return a.level === 'danger'; });
    var warning = alerts.filter(function(a) { return a.level === 'warning'; });

    if (danger.length > 0) {
      bar.className = 'risk-alert-bar danger';
      bar.textContent = '⚠️ ' + danger[0].message;
    } else if (warning.length > 0) {
      bar.className = 'risk-alert-bar warning';
      bar.textContent = '⚠️ ' + warning[0].message;
    } else {
      bar.className = 'risk-alert-bar';
    }
  }

  function updateSidebarRisk() {
    var container = document.getElementById('sidebar-risk-bars');
    if (!container) return;
    var status = Store.getRiskStatus();
    var html = '';
    ['daily', 'weekly', 'monthly'].forEach(function(type) {
      var s = status[type];
      if (!s) return;
      var label = type === 'daily' ? '日' : type === 'weekly' ? '周' : '月';
      var pct = Math.round(s.ratio * 100);
      var level = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'safe';
      html += '<div class="risk-bar"><div class="risk-bar-label"><span>' + label + '亏损</span><span>' + pct + '%</span></div><div class="risk-bar-track"><div class="risk-bar-fill ' + level + '" style="width:' + Math.min(pct, 100) + '%"></div></div></div>';
    });
    container.innerHTML = html || '<p style="font-size:0.75rem;color:var(--muted);text-align:center">未设置风控</p>';
  }

  // === Toast 提示 ===
  function showToast(message, type) {
    type = type || 'success';
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    var icon = type === 'success' ? '✓' : type === 'error' ? '✗' : '⚠';
    toast.innerHTML = '<span>' + icon + '</span><span>' + message + '</span>';
    container.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s';
      setTimeout(function() { container.removeChild(toast); }, 300);
    }, 3000);
  }

  // === Modal 对话框 ===
  function showModal(title, message, onConfirm, onCancel) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal">' +
      '<h3>' + title + '</h3>' +
      '<p>' + message + '</p>' +
      '<div class="modal-actions">' +
      '<button class="btn btn-secondary" id="modal-cancel">取消</button>' +
      '<button class="btn btn-primary" id="modal-confirm">我确认</button>' +
      '</div></div>';
    document.body.appendChild(overlay);

    overlay.querySelector('#modal-cancel').addEventListener('click', function() {
      document.body.removeChild(overlay);
      if (onCancel) onCancel();
    });
    overlay.querySelector('#modal-confirm').addEventListener('click', function() {
      document.body.removeChild(overlay);
      if (onConfirm) onConfirm();
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        if (onCancel) onCancel();
      }
    });
  }

  // === 成功动画 ===
  function showSuccessAnimation(isProfit) {
    var anim = document.createElement('div');
    anim.className = 'success-animation';
    var centerX = window.innerWidth / 2;
    var centerY = window.innerHeight / 2;
    var color = isProfit ? '#10b981' : '#ef4444';
    for (var i = 0; i < 20; i++) {
      var particle = document.createElement('div');
      particle.className = 'success-particle';
      var angle = (Math.PI * 2 / 20) * i;
      var dist = 50 + Math.random() * 100;
      particle.style.cssText = 'left:' + centerX + 'px;top:' + centerY + 'px;background:' + color + ';--tx:' + Math.cos(angle) * dist + 'px;--ty:' + Math.sin(angle) * dist + 'px;animation-duration:' + (1 + Math.random()) + 's;';
      anim.appendChild(particle);
    }
    document.body.appendChild(anim);
    setTimeout(function() { document.body.removeChild(anim); }, 2000);
  }

  // === Fade In Animation (Landing) ===
  function initFadeIn() {
    var observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, observerOptions);
    document.querySelectorAll('.fade-in').forEach(function(el) { observer.observe(el); });

    // Smooth scroll for landing nav links
    document.querySelectorAll('.landing-nav a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        var target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // === 首次使用引导 ===
  function showOnboarding() {
    var overlay = document.createElement('div');
    overlay.className = 'onboarding-overlay';
    overlay.innerHTML =
      '<div class="onboarding-card">' +
      '<h2>🧊 欢迎使用知行合一</h2>' +
      '<p style="color:var(--muted);margin-bottom:1.5rem;font-size:0.9rem">手动记录每一笔盈亏，唤醒对金钱的敏感度</p>' +
      '<div class="onboarding-steps">' +
      '<div class="onboarding-step"><div class="onboarding-step-num">1</div><div class="onboarding-step-text">完成股票交易后，打开行合一记录盈亏</div></div>' +
      '<div class="onboarding-step"><div class="onboarding-step-num">2</div><div class="onboarding-step-text">选择情绪标签，写下交易心得</div></div>' +
      '<div class="onboarding-step"><div class="onboarding-step-num">3</div><div class="onboarding-step-text">查看数据分析，持续优化策略</div></div>' +
      '</div>' +
      '<button class="btn btn-primary" style="width:100%" id="onboarding-start">开始体验</button>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#onboarding-start').addEventListener('click', function() {
      document.body.removeChild(overlay);
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) document.body.removeChild(overlay);
    });
  }

  return {
    init: init,
    showLanding: showLanding,
    showApp: showApp,
    showToast: showToast,
    showModal: showModal,
    showSuccessAnimation: showSuccessAnimation
  };
})();
