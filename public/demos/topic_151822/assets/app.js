const DEFAULT_DATA = {
  appliances: [
    { id: 1, name: '海尔冰箱 BCD-500', brand: '海尔', category: '冰箱', emoji: '❄️', room: '厨房', purchaseDate: '2023-11-15', warrantyYears: 3, status: 'warning', usageYears: 2.67, lifecyclePercent: 60, icon: 'snowflake' },
    { id: 2, name: '美的空调 KFR-35GW', brand: '美的', category: '空调', emoji: '🌬️', room: '客厅', purchaseDate: '2022-04-01', warrantyYears: 6, status: 'warning', usageYears: 4.25, lifecyclePercent: 85, icon: 'wind' },
    { id: 3, name: '小米电视 65寸', brand: '小米', category: '电视', emoji: '📺', room: '客厅', purchaseDate: '2025-05-10', warrantyYears: 3, status: 'warranty', usageYears: 1.17, lifecyclePercent: 25, icon: 'tv' },
    { id: 4, name: '飞利浦台灯', brand: '飞利浦', category: '台灯', emoji: '💡', room: '卧室', purchaseDate: '2023-06-01', warrantyYears: 2, status: 'expired', usageYears: 3.08, lifecyclePercent: 100, icon: 'lightbulb' },
    { id: 5, name: '小天鹅洗衣机', brand: '小天鹅', category: '洗衣机', emoji: '🧺', room: '卫生间', purchaseDate: '2021-09-15', warrantyYears: 3, status: 'expired', usageYears: 4.83, lifecyclePercent: 95, icon: 'washing-machine' },
    { id: 6, name: '格兰仕微波炉', brand: '格兰仕', category: '微波炉', emoji: '⚡', room: '厨房', purchaseDate: '2022-01-10', warrantyYears: 2, status: 'expired', usageYears: 4.5, lifecyclePercent: 90, icon: 'zap' },
    { id: 7, name: '史密斯热水器', brand: '史密斯', category: '热水器', emoji: '🔥', room: '卫生间', purchaseDate: '2024-03-20', warrantyYears: 5, status: 'warranty', usageYears: 2.33, lifecyclePercent: 40, icon: 'flame' },
    { id: 8, name: '博世烤箱', brand: '博世', category: '烤箱', emoji: '🍞', room: '厨房', purchaseDate: '2023-08-01', warrantyYears: 3, status: 'warranty', usageYears: 2.92, lifecyclePercent: 55, icon: 'utensils' },
    { id: 9, name: '科沃斯扫地机', brand: '科沃斯', category: '扫地机', emoji: '🤖', room: '客厅', purchaseDate: '2024-01-15', warrantyYears: 2, status: 'warranty', usageYears: 2.5, lifecyclePercent: 35, icon: 'bot' },
    { id: 10, name: '戴森吸尘器', brand: '戴森', category: '吸尘器', emoji: '🧹', room: '客厅', purchaseDate: '2022-12-01', warrantyYears: 2, status: 'expired', usageYears: 3.67, lifecyclePercent: 80, icon: 'vacuum' },
    { id: 11, name: '松下电饭煲', brand: '松下', category: '电饭煲', emoji: '🍚', room: '厨房', purchaseDate: '2023-03-20', warrantyYears: 2, status: 'warning', usageYears: 3.25, lifecyclePercent: 75, icon: 'cooker' },
    { id: 12, name: '索尼音响', brand: '索尼', category: '音响', emoji: '🔊', room: '客厅', purchaseDate: '2024-06-01', warrantyYears: 3, status: 'warranty', usageYears: 2.08, lifecyclePercent: 30, icon: 'volume-2' },
  ],
  reminders: [
    { id: 1, title: '海尔冰箱保修即将到期', message: '距离保修到期仅剩 7 天', date: '今天', type: 'error', applianceId: 1 },
    { id: 2, title: '美的空调滤网清洗', message: '建议本周内完成滤网清洗保养', date: '周三', type: 'warning', applianceId: 2 },
    { id: 3, title: '小天鹅洗衣机检查', message: '排水管老化提醒，建议检查更换', date: '周六', type: 'warning', applianceId: 5 },
    { id: 4, title: '飞利浦台灯保修已过期', message: '保修已于 2024-06-01 过期', date: '7月10日', type: 'expired', applianceId: 4 },
    { id: 5, title: '格兰仕微波炉保养', message: '上次保养距今已超过 6 个月', date: '7月5日', type: 'expired', applianceId: 6 },
    { id: 6, title: '博世烤箱深度清洁', message: '建议每3个月进行一次深度清洁', date: '下周', type: 'warning', applianceId: 8 },
  ],
  user: { name: '小明', appliancesCount: 12, warrantyCount: 8, pendingCount: 3 },
  repairRecords: [
    { id: 1, applianceId: 1, date: '2025-03-10', cost: 800, description: '不制冷，更换压缩机' },
    { id: 2, applianceId: 1, date: '2024-06-20', cost: 150, description: '首次保养，清洗冷凝器' },
  ],
};

var APP_DATA = loadData();

function loadData() {
  var saved = localStorage.getItem('applianceManager');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return DEFAULT_DATA;
    }
  }
  saveData(DEFAULT_DATA);
  return DEFAULT_DATA;
}

function saveData(data) {
  localStorage.setItem('applianceManager', JSON.stringify(data));
}

function saveAppData() {
  saveData(APP_DATA);
}

function generateId(array) {
  if (!array || array.length === 0) return 1;
  return Math.max.apply(Math, array.map(function(item) { return item.id; })) + 1;
}

function showToast(message, type) {
  type = type || 'success';
  var toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:100;padding:12px 20px;border-radius:12px;color:white;font-size:14px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:all 0.3s ease;opacity:0;pointer-events:none;';
    document.body.appendChild(toast);
  }
  
  var colors = {
    success: 'background: linear-gradient(135deg, #2ECC71, #27AE60);',
    error: 'background: linear-gradient(135deg, #E74C3C, #C0392B);',
    warning: 'background: linear-gradient(135deg, #F39C12, #E67E22);',
    info: 'background: linear-gradient(135deg, #3498DB, #2980B9);'
  };
  
  toast.style.cssText += colors[type];
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
  }, 2500);
}

function calculateApplianceStatus(purchaseDate, warrantyYears) {
  var purchase = new Date(purchaseDate);
  var expiry = new Date(purchase);
  expiry.setFullYear(expiry.getFullYear() + warrantyYears);
  
  var now = new Date();
  var diffTime = expiry - now;
  var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'warning';
  return 'warranty';
}

function calculateUsageYears(purchaseDate) {
  var purchase = new Date(purchaseDate);
  var now = new Date();
  var diff = now - purchase;
  return diff / (1000 * 60 * 60 * 24 * 365);
}

function calculateLifecyclePercent(purchaseDate, warrantyYears) {
  var usage = calculateUsageYears(purchaseDate);
  var maxLife = 10;
  return Math.min(Math.round((usage / maxLife) * 100), 100);
}

var currentPage = 'home';
var selectedAppliance = null;
var currentFilter = 'all';
var addApplianceStep = 1;
var selectedCategory = null;
var selectedRoom = '厨房';
var searchKeyword = '';
var isEditMode = false;
var editingApplianceId = null;

var isDemoMode = true;

var TUTORIAL_STEPS = [
  {
    icon: '🏠',
    title: '欢迎使用家电生命周期管家',
    desc: '让每一台家电都被妥善管理。从购买到报废，全程跟踪保修状态、维修记录和保养提醒。',
    bgColor: 'var(--color-primary-50)',
    showTip: false
  },
  {
    icon: '📱',
    title: '轻松管理家电',
    desc: '添加你的家电信息，包括购买日期、保修期限等，系统会自动计算保修状态和使用进度。',
    bgColor: 'var(--state-success-light)',
    showTip: false
  },
  {
    icon: '🔔',
    title: '智能提醒',
    desc: '保修即将到期、需要保养时，系统会自动提醒你，再也不会错过重要时间节点。',
    bgColor: 'var(--state-warning-light)',
    showTip: false
  },
  {
    icon: '🔧',
    title: '维修记录',
    desc: '记录每一次维修和保养，追踪家电的健康状况，为换新或维修提供数据参考。',
    bgColor: 'var(--state-info-light)',
    showTip: false
  },
  {
    icon: '✨',
    title: '开始体验示范模式',
    desc: '接下来你将进入示范模式，可以浏览预置的家电数据，熟悉各项功能。',
    bgColor: 'var(--color-primary-100)',
    showTip: true,
    tip: '点击右上角的「退出示例」按钮，即可清空示范数据，开始添加你自己的家电。'
  }
];

var currentTutorialStep = 0;
var tutorialCompleted = false;

function initApp() {
  recalculateAllAppliances();
  lucide.createIcons();
  bindNavigation();
  bindPageEvents();
  renderHome();
  renderAppliances();
  renderReminders();
  bindAddApplianceEvents();
  bindSearchEvents();
  updateStats();
  initUserName();
  checkTutorialStatus();
}

function initUserName() {
  var name = APP_DATA.user.name || '小明';
  var profileName = document.getElementById('profile-name');
  if (profileName) profileName.textContent = name;
  var homeUsername = document.getElementById('home-username');
  if (homeUsername) homeUsername.textContent = name + '的家';
}

function recalculateAllAppliances() {
  APP_DATA.appliances.forEach(function(a) {
    a.status = calculateApplianceStatus(a.purchaseDate, a.warrantyYears);
    a.usageYears = calculateUsageYears(a.purchaseDate);
    a.lifecyclePercent = calculateLifecyclePercent(a.purchaseDate, a.warrantyYears);
  });
  saveAppData();
}

function updateStats() {
  var warrantyCount = APP_DATA.appliances.filter(function(a) { return a.status === 'warranty'; }).length;
  var pendingCount = APP_DATA.appliances.filter(function(a) { return a.status === 'warning' || a.status === 'expired'; }).length;
  var total = APP_DATA.appliances.length;
  APP_DATA.user.appliancesCount = total;
  APP_DATA.user.warrantyCount = warrantyCount;
  APP_DATA.user.pendingCount = pendingCount;
  saveAppData();

  var statTotal = document.getElementById('stat-total');
  if (statTotal) statTotal.textContent = total;
  var statWarranty = document.getElementById('stat-warranty');
  if (statWarranty) statWarranty.textContent = warrantyCount;
  var statPending = document.getElementById('stat-pending');
  if (statPending) statPending.textContent = pendingCount;

  var profileTotal = document.getElementById('profile-total');
  if (profileTotal) profileTotal.textContent = total;
  var profileWarranty = document.getElementById('profile-warranty');
  if (profileWarranty) profileWarranty.textContent = warrantyCount;
  var profilePending = document.getElementById('profile-pending');
  if (profilePending) profilePending.textContent = pendingCount;

  var profileManaged = document.getElementById('profile-managed');
  if (profileManaged) profileManaged.textContent = '已管理 ' + total + ' 台家电';
}

function bindNavigation() {
  document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var page = item.getAttribute('data-nav-key');
      navigateTo(page);
    });
  });
}

function navigateTo(page, params) {
  params = params || {};
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.bottom-nav-item').forEach(function(item) { item.classList.remove('active'); });
  
  var navItem = document.querySelector('[data-nav-key="' + page + '"]');
  if (navItem) navItem.classList.add('active');
  
  var targetPage = document.getElementById('page-' + page);
  if (targetPage) {
    targetPage.classList.add('active');
    currentPage = page;
    window.scrollTo(0, 0);
  }

  var bottomNav = document.querySelector('.bottom-nav');
  var hideNavPages = ['add-appliance', 'appliance-detail'];
  if (bottomNav) {
    bottomNav.style.display = hideNavPages.indexOf(page) !== -1 ? 'none' : 'flex';
  }

  if (page === 'appliance-detail' && params.id) {
    selectedAppliance = APP_DATA.appliances.find(function(a) { return a.id === params.id; });
    renderApplianceDetail(selectedAppliance);
  }

  if (page === 'add-appliance') {
    if (!isEditMode) {
      addApplianceStep = 1;
      selectedCategory = null;
      selectedRoom = '厨房';
    }
    updateAddApplianceStep();
    setTimeout(function() {
      var pageTitle = document.querySelector('#page-add-appliance h1');
      if (pageTitle) pageTitle.textContent = isEditMode ? '编辑家电' : '添加家电';

      if (!isEditMode) {
        document.querySelectorAll('.category-btn').forEach(function(btn) {
          btn.style.border = '1px solid var(--border)';
          btn.style.backgroundColor = 'var(--card)';
        });
        document.querySelectorAll('.room-btn').forEach(function(btn) {
          btn.style.border = '1px solid var(--border)';
          btn.style.backgroundColor = 'var(--card)';
          btn.style.color = 'var(--foreground)';
          if (btn.getAttribute('data-room') === selectedRoom) {
            btn.style.border = '2px solid var(--primary)';
            btn.style.backgroundColor = 'var(--color-primary-50)';
            btn.style.color = 'var(--primary)';
          }
        });

        var dateInput = document.getElementById('input-date');
        if (dateInput) {
          var today = new Date().toISOString().split('T')[0];
          dateInput.setAttribute('max', today);
        }
      }
    }, 10);
  }
}

function bindPageEvents() {
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-action]');
    if (btn) {
      var action = btn.getAttribute('data-action');
      handleAction(action, btn);
    }
  });

  var pageHome = document.getElementById('page-home');
  if (pageHome) {
    pageHome.addEventListener('click', function(e) {
      var card = e.target.closest('[data-link="appliance-detail"]');
      if (card) {
        var id = parseInt(card.getAttribute('data-id'));
        navigateTo('appliance-detail', { id: id });
      }
    });
  }

  var pageAppliances = document.getElementById('page-appliances');
  if (pageAppliances) {
    pageAppliances.addEventListener('click', function(e) {
      var target = e.target.closest('.appliance-card');
      if (target) {
        var id = parseInt(target.getAttribute('data-id'));
        navigateTo('appliance-detail', { id: id });
      }
    });
  }

  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var filter = btn.getAttribute('data-filter');
      setFilter(filter);
    });
  });

  var markAllRead = document.getElementById('mark-all-read');
  if (markAllRead) {
    markAllRead.addEventListener('click', function() {
      document.querySelectorAll('.reminder-card').forEach(function(card) {
        card.classList.remove('animate-breathe');
        var dot = card.querySelector('.reminder-dot');
        if (dot) dot.style.backgroundColor = 'var(--color-neutral-400)';
      });
      markAllRead.textContent = '已全部阅读';
      var bellDot = document.getElementById('bell-dot');
      if (bellDot) bellDot.style.display = 'none';
    });
  }
}

function handleAction(action, btn) {
  switch (action) {
    case 'back-home':
      navigateTo('home');
      break;
    case 'back-appliances':
      navigateTo('appliances');
      break;
    case 'back-add':
      if (isEditMode) {
        if (addApplianceStep > 1) {
          addApplianceStep--;
          updateAddApplianceStep();
        } else {
          isEditMode = false;
          editingApplianceId = null;
          if (selectedAppliance) {
            navigateTo('appliance-detail', { id: selectedAppliance.id });
          } else {
            navigateTo('appliances');
          }
        }
      } else if (addApplianceStep > 1) {
        addApplianceStep--;
        updateAddApplianceStep();
      } else {
        navigateTo('home');
      }
      break;
    case 'next-step':
      if (addApplianceStep === 3) {
        confirmAppliance();
        return;
      }
      if (isEditMode) {
        if (!validateApplianceInfo()) {
          showToast('请填写完整信息', 'warning');
          return;
        }
        addApplianceStep = 3;
        updateAddApplianceStep();
      } else if (addApplianceStep < 3) {
        if (addApplianceStep === 1 && !selectedCategory) {
          showToast('请选择家电类别', 'warning');
          return;
        }
        if (addApplianceStep === 2 && !validateApplianceInfo()) {
          showToast('请填写完整信息', 'warning');
          return;
        }
        addApplianceStep++;
        updateAddApplianceStep();
      }
      break;
    case 'confirm-appliance':
      confirmAppliance();
      break;
    case 'view-appliances':
      navigateTo('appliances');
      break;
    case 'view-reminders':
      navigateTo('reminders');
      break;
    case 'view-add':
      navigateTo('add-appliance');
      break;
    case 'view-detail':
      var id = parseInt(btn.getAttribute('data-id'));
      navigateTo('appliance-detail', { id: id });
      break;
    case 'add-repair-record':
      openRepairRecordModal(parseInt(btn.getAttribute('data-id')));
      break;
    case 'export-data':
      exportData();
      break;
    case 'clear-data':
      clearData();
      break;
    case 'toggle-search':
      toggleSearch();
      break;
    case 'edit-appliance':
      openEditAppliance(parseInt(btn.getAttribute('data-id')));
      break;
    case 'delete-appliance':
      showDeleteConfirm(parseInt(btn.getAttribute('data-id')));
      break;
    case 'show-about':
      showAbout();
      break;
    case 'show-stats':
      showStatsModal();
      break;
    case 'edit-name':
      editUserName();
      break;
    case 'exit-demo-mode':
      exitDemoMode();
      break;
    case 'show-tutorial':
      showTutorial();
      break;
    case 'next-tutorial':
      nextTutorialStep();
      break;
    case 'prev-tutorial':
      prevTutorialStep();
      break;
    case 'skip-tutorial':
      skipTutorial();
      break;
  }
}

function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.style.backgroundColor = 'var(--card)';
    btn.style.color = 'var(--foreground)';
    btn.style.border = '1px solid var(--border)';
  });
  var activeBtn = document.querySelector('[data-filter="' + filter + '"]');
  if (activeBtn) {
    activeBtn.style.backgroundColor = 'var(--primary)';
    activeBtn.style.color = 'white';
    activeBtn.style.border = 'none';
  }
  renderAppliances();
}

function renderHome() {
  var attentionList = APP_DATA.appliances
    .filter(function(a) { return a.status !== 'warranty'; })
    .slice(0, 3);

  var attentionContainer = document.getElementById('home-attention-list');
  if (attentionContainer) {
    attentionContainer.innerHTML = attentionList.map(function(appliance, index) {
      var statusMap = {
        warning: { class: 'pill-warning', text: '即将到期' },
        expired: { class: 'pill-error', text: '已过期' },
      };
      var status = statusMap[appliance.status] || { class: 'pill-info', text: '待保养' };
      return '<div class="card animate-fade-in-up flex items-center gap-3 p-[14px] mb-[10px]" data-link="appliance-detail" data-id="' + appliance.id + '" style="animation-delay: ' + (80 * (index + 2)) + 'ms;">' +
        '<span class="text-[32px] leading-none flex-shrink-0">' + appliance.emoji + '</span>' +
        '<div class="flex-1 min-w-0">' +
        '<p class="text-sm font-medium truncate" style="color: var(--foreground);">' + appliance.name + '</p>' +
        '<p class="text-xs truncate" style="color: var(--muted-foreground);">' + appliance.room + ' · ' + appliance.brand + '</p>' +
        '</div>' +
        '<span class="pill ' + status.class + ' flex-shrink-0 whitespace-nowrap">' + status.text + '</span>' +
        '</div>';
    }).join('');
  }
}

function renderAppliances() {
  var filtered = APP_DATA.appliances;
  if (currentFilter !== 'all') {
    var roomMap = { kitchen: '厨房', living: '客厅', bedroom: '卧室', bathroom: '卫生间', other: '其他' };
    filtered = filtered.filter(function(a) { return a.room === roomMap[currentFilter]; });
  }
  if (searchKeyword) {
    var keyword = searchKeyword.toLowerCase();
    filtered = filtered.filter(function(a) {
      return a.name.toLowerCase().indexOf(keyword) !== -1 ||
             a.brand.toLowerCase().indexOf(keyword) !== -1 ||
             a.category.toLowerCase().indexOf(keyword) !== -1;
    });
  }

  var container = document.getElementById('appliances-list');
  if (container) {
    if (filtered.length === 0) {
      container.innerHTML = '<div class="text-center py-12"><div class="text-[48px] mb-3">📭</div><p class="typography-caption" style="color: var(--muted-foreground);">暂无家电</p></div>';
      return;
    }
    
    container.innerHTML = filtered.map(function(appliance, index) {
      var statusMap = {
        warranty: { class: 'pill-success', text: '保修中', color: 'var(--state-success)' },
        warning: { class: 'pill-warning', text: '即将到期', color: 'var(--state-warning)' },
        expired: { class: 'pill-error', text: '已过保', color: 'var(--state-error)' },
      };
      var status = statusMap[appliance.status];
      return '<div class="card block p-4 rounded-2xl animate-fade-in-up appliance-card" data-id="' + appliance.id + '" style="animation-delay: ' + (80 * index) + 'ms;">' +
        '<div class="flex items-start justify-between">' +
        '<div class="flex items-center gap-3">' +
        '<span class="flex h-11 w-11 shrink-0 items-center justify-center text-[28px] leading-none">' + appliance.emoji + '</span>' +
        '<div class="min-w-0">' +
        '<h3 class="typography-subtitle truncate" style="color: var(--foreground);">' + appliance.name + '</h3>' +
        '<p class="typography-caption mt-0.5 truncate">' + appliance.brand + '</p>' +
        '</div>' +
        '</div>' +
        '<span class="pill ' + status.class + ' shrink-0 ml-2">' + status.text + '</span>' +
        '</div>' +
        '<div class="mt-2.5 flex items-center justify-between">' +
        '<p class="typography-caption truncate">' + appliance.room + ' · 已使用 ' + formatUsage(appliance.usageYears) + '</p>' +
        '</div>' +
        '<div class="mt-3 flex items-center gap-2.5">' +
        '<div class="progress-bar flex-1">' +
        '<div class="progress-bar-fill" style="width:' + appliance.lifecyclePercent + '%;background:' + status.color + ';"></div>' +
        '</div>' +
        '<span class="typography-caption shrink-0" style="color:' + status.color + ';">' + appliance.lifecyclePercent + '%</span>' +
        '</div>' +
        '</div>';
    }).join('');
  }
}

function formatUsage(years) {
  var y = Math.floor(years);
  var m = Math.floor((years - y) * 12);
  if (y === 0) return m + '个月';
  if (m === 0) return y + '年';
  return y + '年' + m + '个月';
}

function generateReminders() {
  var reminders = [];
  var now = new Date();

  APP_DATA.appliances.forEach(function(a) {
    var purchase = new Date(a.purchaseDate);
    var expiry = new Date(purchase);
    expiry.setFullYear(expiry.getFullYear() + a.warrantyYears);
    var diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      reminders.push({
        id: 'auto-' + a.id,
        title: a.name + ' 保修已过期',
        message: '保修已于 ' + expiry.toISOString().split('T')[0] + ' 过期',
        date: '已过期',
        type: 'expired',
        applianceId: a.id
      });
    } else if (diffDays <= 30) {
      reminders.push({
        id: 'auto-' + a.id,
        title: a.name + ' 保修即将到期',
        message: '距离保修到期仅剩 ' + diffDays + ' 天',
        date: diffDays <= 7 ? '今天' : '本周',
        type: diffDays <= 7 ? 'error' : 'warning',
        applianceId: a.id
      });
    } else if (a.usageYears > 3) {
      reminders.push({
        id: 'auto-maint-' + a.id,
        title: a.name + ' 建议保养',
        message: '已使用 ' + formatUsage(a.usageYears) + '，建议进行例行保养',
        date: '本周',
        type: 'warning',
        applianceId: a.id
      });
    }
  });

  APP_DATA.reminders = reminders;
  updateBellDot();
  return reminders;
}

function updateBellDot() {
  var bellDot = document.getElementById('bell-dot');
  if (!bellDot) return;
  var hasUrgent = APP_DATA.reminders.some(function(r) { return r.type === 'error' || r.type === 'warning'; });
  bellDot.style.display = hasUrgent ? '' : 'none';
}

function renderReminders() {
  generateReminders();
  var container = document.getElementById('reminders-list');
  if (container) {
    var today = APP_DATA.reminders.filter(function(r) { return r.date === '今天'; });
    var week = APP_DATA.reminders.filter(function(r) { return r.date === '本周'; });
    var expired = APP_DATA.reminders.filter(function(r) { return r.date === '已过期'; });

    var renderGroup = function(title, items) {
      if (items.length === 0) return '';
      return '<p class="typography-subtitle mt-4 mb-2.5">' + title + '</p>' +
        items.map(function(r, i) {
          return '<div class="card flex flex-row items-start gap-3 p-3.5 px-4 mb-2 animate-fade-in-up reminder-card" data-action="view-detail" data-id="' + r.applianceId + '">' +
            '<span class="w-2.5 h-2.5 rounded-full mt-1 shrink-0 reminder-dot ' + (r.type === 'error' ? 'animate-breathe' : '') + '" style="background-color: ' + getReminderColor(r.type) + ';"></span>' +
            '<div class="flex-1 min-w-0">' +
            '<p class="text-sm font-medium truncate" style="color: var(--foreground);">' + r.title + '</p>' +
            '<p class="text-xs mt-0.5 truncate" style="color: var(--muted-foreground);">' + r.message + '</p>' +
            '</div>' +
            '<span class="text-xs shrink-0" style="color: var(--muted-foreground);">' + r.date + '</span>' +
            '</div>';
        }).join('');
    };

    container.innerHTML = renderGroup('今天', today) + renderGroup('本周', week) + renderGroup('已过期', expired);

    if (APP_DATA.reminders.length === 0) {
      container.innerHTML = '<div class="text-center py-16"><div class="text-[48px] mb-3">✅</div><p class="typography-caption" style="color: var(--muted-foreground);">暂无提醒，一切正常</p></div>';
    }
  }
}

function getReminderColor(type) {
  var colors = {
    error: 'var(--state-error)',
    warning: 'var(--state-warning)',
    expired: 'var(--color-neutral-400)',
  };
  return colors[type] || 'var(--color-neutral-400)';
}

function renderApplianceDetail(appliance) {
  if (!appliance) return;

  var statusMap = {
    warranty: { class: 'pill-success', text: '保修中' },
    warning: { class: 'pill-warning', text: '即将到期' },
    expired: { class: 'pill-error', text: '已过保' },
  };
  var status = statusMap[appliance.status];

  var expiryDate = calculateExpiry(appliance.purchaseDate, appliance.warrantyYears);

  var records = APP_DATA.repairRecords.filter(function(r) { return r.applianceId === appliance.id; });

  var detailContainer = document.getElementById('appliance-detail-content');
  if (detailContainer) {
    detailContainer.innerHTML = '<section class="p-4 animate-fade-in-up stagger-1">' +
      '<div class="card rounded-2xl p-6 text-center" style="background: linear-gradient(135deg, var(--color-primary-50), var(--color-primary-100)); border: none;">' +
      '<div class="text-[72px] leading-none mb-3">' + appliance.emoji + '</div>' +
      '<h2 class="typography-title" style="color: var(--foreground);">' + appliance.name + '</h2>' +
      '<p class="typography-caption mt-1">' + appliance.brand + '</p>' +
      '<div class="mt-2 flex justify-center">' +
      '<span class="pill ' + status.class + '">' + status.text + '</span>' +
      '</div>' +
      '</div>' +
      '</section>' +

      '<section class="mx-4 mb-4 animate-fade-in-up stagger-2">' +
      '<div class="card p-4">' +
      '<h3 class="typography-subtitle mb-3">基本信息</h3>' +
      '<div class="border-b border-[var(--border)] py-[10px] flex justify-between items-center">' +
      '<span class="typography-body" style="color: var(--muted-foreground);">房间位置</span>' +
      '<span class="typography-body font-medium" style="color: var(--foreground);">' + appliance.room + '</span>' +
      '</div>' +
      '<div class="border-b border-[var(--border)] py-[10px] flex justify-between items-center">' +
      '<span class="typography-body" style="color: var(--muted-foreground);">购买日期</span>' +
      '<span class="typography-body font-medium" style="color: var(--foreground);">' + appliance.purchaseDate + '</span>' +
      '</div>' +
      '<div class="border-b border-[var(--border)] py-[10px] flex justify-between items-center">' +
      '<span class="typography-body" style="color: var(--muted-foreground);">保修期限</span>' +
      '<span class="typography-body font-medium" style="color: var(--foreground);">' + appliance.warrantyYears + ' 年整机保修</span>' +
      '</div>' +
      '<div class="border-b border-[var(--border)] py-[10px] flex justify-between items-center">' +
      '<span class="typography-body" style="color: var(--muted-foreground);">保修到期日</span>' +
      '<span class="typography-body font-medium" style="color: var(--foreground);">' + expiryDate + '</span>' +
      '</div>' +
      '<div class="py-[10px] flex justify-between items-center">' +
      '<span class="typography-body" style="color: var(--muted-foreground);">已使用时长</span>' +
      '<span class="typography-body font-medium" style="color: var(--foreground);">' + formatUsage(appliance.usageYears) + '</span>' +
      '</div>' +
      '</div>' +
      '</section>' +

      '<section class="mx-4 mb-4 animate-fade-in-up stagger-3">' +
      '<div class="card p-4">' +
      '<h3 class="typography-subtitle mb-4">使用进度</h3>' +
      '<p class="text-[14px] font-medium mb-2" style="color: ' + getStatusColor(appliance.status) + ';">' + getStatusText(appliance.status) + '</p>' +
      '<div class="progress-bar">' +
      '<div class="progress-bar-fill" style="width: ' + appliance.lifecyclePercent + '%; background: ' + getStatusColor(appliance.status) + ';"></div>' +
      '</div>' +
      '<div class="mt-2 flex justify-between">' +
      '<span class="typography-caption">购买日</span>' +
      '<span class="typography-caption">保修到期</span>' +
      '<span class="typography-caption truncate">建议更换(8-10年)</span>' +
      '</div>' +
      '</div>' +
      '</section>' +

      '<section class="mx-4 mb-4 animate-fade-in-up stagger-4">' +
      '<div class="card p-4">' +
      '<div class="flex items-center justify-between mb-4">' +
      '<h3 class="typography-subtitle">维修记录</h3>' +
      '<button class="text-[14px] font-semibold" style="color: var(--primary);" data-action="add-repair-record" data-id="' + appliance.id + '">添加</button>' +
      '</div>' +
      (records.length > 0 ? '<div class="relative">' +
        '<div class="absolute left-[5px] top-2 bottom-2 w-[2px] bg-[var(--border)]"></div>' +
        records.map(function(record, i) {
          return '<div class="flex gap-3 mb-4 relative">' +
            '<div class="relative z-10 mt-1 shrink-0">' +
            '<div class="w-[10px] h-[10px] rounded-full bg-[var(--primary)]' + (i > 0 ? ' opacity-50' : '') + '"></div>' +
            '</div>' +
            '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center justify-between">' +
            '<span class="text-[13px] font-medium" style="color: var(--foreground);">' + record.date + '</span>' +
            '<span class="text-[13px] font-semibold" style="color: var(--primary);">¥' + record.cost + '</span>' +
            '</div>' +
            '<p class="text-[13px] mt-0.5 truncate" style="color: var(--muted-foreground);">' + record.description + '</p>' +
            '</div>' +
            '</div>';
        }).join('') +
        '</div>' : '<p class="text-center typography-caption py-4">暂无维修记录</p>') +
      '</div>' +
      '</section>' +

      '<section class="mx-4 mb-4 animate-fade-in-up stagger-5">' +
      '<div class="rounded-2xl p-[14px] pl-4 flex items-start gap-3" style="background: var(--state-warning-light);">' +
      '<div class="text-[28px] leading-none shrink-0 mt-0.5">⚙️</div>' +
      '<div class="flex-1 min-w-0">' +
      '<p class="text-[14px] font-medium" style="color: var(--foreground);">下次保养：3 个月后</p>' +
      '<p class="text-[12px] mt-0.5" style="color: var(--muted-foreground);">建议清洗' + appliance.category + '，预计费用 100-200 元</p>' +
      '</div>' +
      '</div>' +
      '</section>' +

      '<section class="mx-4 mb-4 animate-fade-in-up stagger-6">' +
      '<button class="w-full py-3 rounded-xl text-sm font-medium" style="color: var(--state-error); background: var(--state-error-light);" data-action="delete-appliance" data-id="' + appliance.id + '">删除家电</button>' +
      '</section>';
  }

  var editBtns = document.querySelectorAll('[data-action="edit-appliance"]');
  editBtns.forEach(function(btn) { btn.setAttribute('data-id', appliance.id); });
  var addRepairBtns = document.querySelectorAll('[data-action="add-repair-record"]');
  addRepairBtns.forEach(function(btn) {
    if (btn.closest('.fixed')) {
      btn.setAttribute('data-id', appliance.id);
    }
  });
}

function calculateExpiry(purchaseDate, years) {
  var date = new Date(purchaseDate);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().split('T')[0];
}

function getStatusColor(status) {
  var colors = {
    warranty: 'var(--state-success)',
    warning: 'var(--state-warning)',
    expired: 'var(--state-error)',
  };
  return colors[status] || 'var(--state-info)';
}

function getStatusText(status) {
  var texts = {
    warranty: '健康使用期',
    warning: '即将过保',
    expired: '已过保',
  };
  return texts[status] || '正常使用';
}

function bindAddApplianceEvents() {
  document.querySelectorAll('.category-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.category-btn').forEach(function(b) {
        b.style.border = '1px solid var(--border)';
        b.style.backgroundColor = 'var(--card)';
      });
      btn.style.border = '2px solid var(--primary)';
      btn.style.backgroundColor = 'var(--color-primary-50)';
      selectedCategory = {
        name: btn.getAttribute('data-category'),
        emoji: btn.getAttribute('data-emoji')
      };
      updateConfirmSection();
    });
  });

  document.querySelectorAll('.room-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.room-btn').forEach(function(b) {
        b.style.border = '1px solid var(--border)';
        b.style.backgroundColor = 'var(--card)';
        b.style.color = 'var(--foreground)';
      });
      btn.style.border = '2px solid var(--primary)';
      btn.style.backgroundColor = 'var(--color-primary-50)';
      btn.style.color = 'var(--primary)';
      selectedRoom = btn.getAttribute('data-room');
      updateConfirmSection();
    });
  });

  var inputName = document.getElementById('input-name');
  if (inputName) inputName.addEventListener('input', updateConfirmSection);
  
  var inputBrand = document.getElementById('input-brand');
  if (inputBrand) inputBrand.addEventListener('input', updateConfirmSection);
  
  var inputDate = document.getElementById('input-date');
  if (inputDate) inputDate.addEventListener('change', updateConfirmSection);
  
  var inputWarranty = document.getElementById('input-warranty');
  if (inputWarranty) inputWarranty.addEventListener('change', updateConfirmSection);
}

function updateAddApplianceStep() {
  var indicators = [
    document.getElementById('step-2-indicator'),
    document.getElementById('step-3-indicator')
  ];
  
  indicators.forEach(function(el, index) {
    if (el) {
      if (addApplianceStep > index + 1) {
        el.style.backgroundColor = 'var(--primary)';
        el.style.color = 'white';
      } else {
        el.style.backgroundColor = 'var(--muted)';
        el.style.color = 'var(--muted-foreground)';
      }
    }
  });

  var stepCategory = document.getElementById('step-category');
  if (stepCategory) stepCategory.classList.toggle('hidden', addApplianceStep !== 1);
  
  var stepInfo = document.getElementById('step-info');
  if (stepInfo) stepInfo.classList.toggle('hidden', addApplianceStep !== 2);
  
  var stepConfirm = document.getElementById('step-confirm');
  if (stepConfirm) stepConfirm.classList.toggle('hidden', addApplianceStep !== 3);

  var nextBtn = document.getElementById('btn-next-step');
  if (nextBtn) {
    if (addApplianceStep === 3) {
      nextBtn.textContent = isEditMode ? '保存修改' : '保存';
    } else {
      nextBtn.textContent = '下一步';
    }
  }

  if (addApplianceStep === 3) {
    updateConfirmSection();
  }
}

function validateApplianceInfo() {
  var inputName = document.getElementById('input-name');
  var inputBrand = document.getElementById('input-brand');
  var inputDate = document.getElementById('input-date');
  var inputWarranty = document.getElementById('input-warranty');
  
  var name = inputName ? inputName.value : '';
  var brand = inputBrand ? inputBrand.value : '';
  var date = inputDate ? inputDate.value : '';
  var warranty = inputWarranty ? inputWarranty.value : '';
  
  if (!name || !brand || !date || !warranty || !selectedRoom) {
    return false;
  }

  var purchaseDate = new Date(date);
  var now = new Date();
  now.setHours(0, 0, 0, 0);
  if (purchaseDate > now) {
    showToast('购买日期不能是未来', 'warning');
    return false;
  }

  return true;
}

function updateConfirmSection() {
  var inputName = document.getElementById('input-name');
  var inputBrand = document.getElementById('input-brand');
  var inputDate = document.getElementById('input-date');
  var inputWarranty = document.getElementById('input-warranty');
  
  var name = inputName ? inputName.value : '未填写';
  var brand = inputBrand ? inputBrand.value : '未填写';
  var date = inputDate ? inputDate.value : '未选择';
  var warranty = inputWarranty ? inputWarranty.value : '3';
  var emoji = selectedCategory ? selectedCategory.emoji : '❄️';

  var expiryDate = date ? calculateExpiry(date, parseInt(warranty)) : '未计算';

  var el;
  el = document.getElementById('confirm-emoji');
  if (el) el.textContent = emoji;
  el = document.getElementById('confirm-name');
  if (el) el.textContent = name;
  el = document.getElementById('confirm-brand');
  if (el) el.textContent = brand;
  el = document.getElementById('confirm-date');
  if (el) el.textContent = date;
  el = document.getElementById('confirm-warranty');
  if (el) el.textContent = warranty + ' 年';
  el = document.getElementById('confirm-room');
  if (el) el.textContent = selectedRoom;
  el = document.getElementById('confirm-expiry');
  if (el) el.textContent = expiryDate;
}

function confirmAppliance() {
  var inputName = document.getElementById('input-name');
  var inputBrand = document.getElementById('input-brand');
  var inputDate = document.getElementById('input-date');
  var inputWarranty = document.getElementById('input-warranty');
  
  var name = inputName.value;
  var brand = inputBrand.value;
  var date = inputDate.value;
  var warrantyYears = parseInt(inputWarranty.value);

  if (isEditMode) {
    var appliance = APP_DATA.appliances.find(function(a) { return a.id === editingApplianceId; });
    if (appliance) {
      appliance.name = name;
      appliance.brand = brand;
      appliance.category = selectedCategory.name;
      appliance.emoji = selectedCategory.emoji;
      appliance.room = selectedRoom;
      appliance.purchaseDate = date;
      appliance.warrantyYears = warrantyYears;
      appliance.status = calculateApplianceStatus(date, warrantyYears);
      appliance.usageYears = calculateUsageYears(date);
      appliance.lifecyclePercent = calculateLifecyclePercent(date, warrantyYears);

      updateStats();
      saveAppData();
      showToast('修改保存成功！', 'success');
      
      isEditMode = false;
      editingApplianceId = null;
      clearApplianceInputs();

      renderAppliances();
      renderHome();
      if (selectedAppliance && selectedAppliance.id === appliance.id) {
        selectedAppliance = appliance;
        renderApplianceDetail(appliance);
      }
      navigateTo('appliance-detail', { id: appliance.id });
    }
    return;
  }

  var newAppliance = {
    id: generateId(APP_DATA.appliances),
    name: name,
    brand: brand,
    category: selectedCategory.name,
    emoji: selectedCategory.emoji,
    room: selectedRoom,
    purchaseDate: date,
    warrantyYears: warrantyYears,
    status: calculateApplianceStatus(date, warrantyYears),
    usageYears: calculateUsageYears(date),
    lifecyclePercent: calculateLifecyclePercent(date, warrantyYears),
    icon: 'other'
  };

  APP_DATA.appliances.push(newAppliance);
  updateStats();
  saveAppData();
  clearApplianceInputs();
  
  showToast('家电添加成功！', 'success');
  navigateTo('appliances');
  renderAppliances();
  renderHome();
}

function clearApplianceInputs() {
  var inputName = document.getElementById('input-name');
  var inputBrand = document.getElementById('input-brand');
  var inputDate = document.getElementById('input-date');
  var inputWarranty = document.getElementById('input-warranty');
  if (inputName) inputName.value = '';
  if (inputBrand) inputBrand.value = '';
  if (inputDate) inputDate.value = '';
  if (inputWarranty) inputWarranty.value = '3';
}

function openRepairRecordModal(applianceId) {
  var modal = document.getElementById('repair-record-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'repair-record-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:100;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity 0.3s ease;pointer-events:none;';
    modal.innerHTML = '<div style="width:100%;max-width:480px;background:var(--card);border-radius:24px 24px 0 0;padding:24px;padding-bottom:calc(24px + env(safe-area-inset-bottom));transform:translateY(100%);transition:transform 0.3s ease;">' +
      '<div class="flex items-center justify-between mb-4">' +
      '<h3 class="typography-title" style="color: var(--foreground);">添加维修记录</h3>' +
      '<button id="close-repair-modal" style="width:32px;height:32px;border-radius:50%;background:var(--muted);display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;"><i data-lucide="x" class="w-5 h-5" style="color:var(--foreground);"></i></button>' +
      '</div>' +
      '<div class="space-y-4">' +
      '<div>' +
      '<label class="typography-body block mb-2" style="color: var(--muted-foreground);">维修日期</label>' +
      '<input type="date" id="repair-date" class="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)]" style="color: var(--foreground);">' +
      '</div>' +
      '<div>' +
      '<label class="typography-body block mb-2" style="color: var(--muted-foreground);">维修费用</label>' +
      '<input type="number" id="repair-cost" class="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)]" placeholder="0" style="color: var(--foreground);">' +
      '</div>' +
      '<div>' +
      '<label class="typography-body block mb-2" style="color: var(--muted-foreground);">维修说明</label>' +
      '<textarea id="repair-desc" class="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)]" rows="3" placeholder="请输入维修说明" style="color: var(--foreground);"></textarea>' +
      '</div>' +
      '</div>' +
      '<button id="save-repair-record" data-id="' + applianceId + '" class="btn-primary mt-6 w-full">保存记录</button>' +
      '</div>';
    document.body.appendChild(modal);
    lucide.createIcons();
    
    document.getElementById('close-repair-modal').addEventListener('click', closeRepairModal);
    document.getElementById('save-repair-record').addEventListener('click', function() {
      var id = parseInt(this.getAttribute('data-id'));
      saveRepairRecord(id);
    });
  }
  
  var saveBtn = document.getElementById('save-repair-record');
  if (saveBtn) saveBtn.setAttribute('data-id', applianceId);

  var dateInput = document.getElementById('repair-date');
  if (dateInput) dateInput.value = '';
  var costInput = document.getElementById('repair-cost');
  if (costInput) costInput.value = '';
  var descInput = document.getElementById('repair-desc');
  if (descInput) descInput.value = '';

  modal.style.opacity = '1';
  modal.style.pointerEvents = 'auto';
  modal.querySelector('div').style.transform = 'translateY(0)';
}

function closeRepairModal() {
  var modal = document.getElementById('repair-record-modal');
  if (modal) {
    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';
    modal.querySelector('div').style.transform = 'translateY(100%)';
  }
}

function saveRepairRecord(applianceId) {
  var repairDate = document.getElementById('repair-date').value;
  var repairCost = document.getElementById('repair-cost').value;
  var repairDesc = document.getElementById('repair-desc').value;
  
  if (!repairDate || !repairCost || !repairDesc) {
    showToast('请填写完整信息', 'warning');
    return;
  }

  var newRecord = {
    id: generateId(APP_DATA.repairRecords),
    applianceId: applianceId,
    date: repairDate,
    cost: parseInt(repairCost),
    description: repairDesc
  };

  APP_DATA.repairRecords.push(newRecord);
  saveAppData();
  
  showToast('维修记录添加成功！', 'success');
  closeRepairModal();
  
  if (selectedAppliance && selectedAppliance.id === applianceId) {
    renderApplianceDetail(selectedAppliance);
  }
}

function showActionSheet(options) {
  var title = options.title || '';
  var message = options.message || '';
  var buttons = options.buttons || [];
  var onCancel = options.onCancel || function() {};

  var sheet = document.getElementById('action-sheet');
  if (!sheet) {
    sheet = document.createElement('div');
    sheet.id = 'action-sheet';
    sheet.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity 0.3s ease;pointer-events:none;';
    sheet.innerHTML = '<div id="action-sheet-content" style="width:100%;max-width:480px;background:var(--card);border-radius:24px 24px 0 0;padding:8px;padding-bottom:calc(8px + env(safe-area-inset-bottom));transform:translateY(100%);transition:transform 0.3s ease;"></div>';
    document.body.appendChild(sheet);

    sheet.addEventListener('click', function(e) {
      if (e.target === sheet) {
        hideActionSheet();
        onCancel();
      }
    });
  }

  var content = document.getElementById('action-sheet-content');
  var html = '';
  if (title) {
    html += '<div class="text-center pt-4 pb-2 px-4"><p class="text-sm font-semibold" style="color: var(--foreground);">' + title + '</p></div>';
  }
  if (message) {
    html += '<div class="text-center pb-3 px-4"><p class="text-xs" style="color: var(--muted-foreground);">' + message + '</p></div>';
  }
  buttons.forEach(function(btn, index) {
    var color = btn.destructive ? 'var(--state-error)' : 'var(--primary)';
    var bg = index < buttons.length - 1 ? 'border-b border-[var(--border)]' : '';
    html += '<button class="action-sheet-btn w-full py-3.5 text-sm font-medium ' + bg + '" style="color: ' + color + ';" data-index="' + index + '">' + btn.text + '</button>';
  });
  html += '<button id="action-sheet-cancel" class="w-full py-3.5 text-sm font-medium mt-2 rounded-xl" style="color: var(--foreground); background: var(--muted);">取消</button>';

  content.innerHTML = html;

  content.querySelectorAll('.action-sheet-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var index = parseInt(btn.getAttribute('data-index'));
      hideActionSheet();
      if (buttons[index] && buttons[index].onClick) {
        buttons[index].onClick();
      }
    });
  });

  var cancelBtn = document.getElementById('action-sheet-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      hideActionSheet();
      onCancel();
    });
  }

  sheet.style.opacity = '1';
  sheet.style.pointerEvents = 'auto';
  content.style.transform = 'translateY(0)';
}

function hideActionSheet() {
  var sheet = document.getElementById('action-sheet');
  if (sheet) {
    var content = document.getElementById('action-sheet-content');
    sheet.style.opacity = '0';
    sheet.style.pointerEvents = 'none';
    if (content) content.style.transform = 'translateY(100%)';
  }
}

function showDeleteConfirm(applianceId) {
  var appliance = APP_DATA.appliances.find(function(a) { return a.id === applianceId; });
  if (!appliance) return;

  showActionSheet({
    title: '确认删除',
    message: '确定要删除「' + appliance.name + '」吗？此操作不可恢复。',
    buttons: [
      { text: '删除家电', destructive: true, onClick: function() { deleteAppliance(applianceId); } }
    ]
  });
}

function deleteAppliance(applianceId) {
  APP_DATA.appliances = APP_DATA.appliances.filter(function(a) { return a.id !== applianceId; });
  APP_DATA.repairRecords = APP_DATA.repairRecords.filter(function(r) { return r.applianceId !== applianceId; });

  updateStats();
  saveAppData();
  showToast('已删除家电', 'success');
  navigateTo('appliances');
  renderAppliances();
  renderHome();
  renderReminders();
  updateBellDot();
}

function openEditAppliance(id) {
  var appliance = APP_DATA.appliances.find(function(a) { return a.id === id; });
  if (!appliance) return;

  isEditMode = true;
  editingApplianceId = id;
  selectedCategory = { name: appliance.category, emoji: appliance.emoji };
  selectedRoom = appliance.room;

  navigateTo('add-appliance');

  setTimeout(function() {
    var inputName = document.getElementById('input-name');
    var inputBrand = document.getElementById('input-brand');
    var inputDate = document.getElementById('input-date');
    var inputWarranty = document.getElementById('input-warranty');

    if (inputName) inputName.value = appliance.name;
    if (inputBrand) inputBrand.value = appliance.brand;
    if (inputDate) inputDate.value = appliance.purchaseDate;
    if (inputWarranty) inputWarranty.value = appliance.warrantyYears;

    var pageTitle = document.querySelector('#page-add-appliance h1');
    if (pageTitle) pageTitle.textContent = '编辑家电';

    document.querySelectorAll('.category-btn').forEach(function(btn) {
      btn.style.border = '1px solid var(--border)';
      btn.style.backgroundColor = 'var(--card)';
      if (btn.getAttribute('data-category') === appliance.category) {
        btn.style.border = '2px solid var(--primary)';
        btn.style.backgroundColor = 'var(--color-primary-50)';
      }
    });

    document.querySelectorAll('.room-btn').forEach(function(btn) {
      btn.style.border = '1px solid var(--border)';
      btn.style.backgroundColor = 'var(--card)';
      btn.style.color = 'var(--foreground)';
      if (btn.getAttribute('data-room') === appliance.room) {
        btn.style.border = '2px solid var(--primary)';
        btn.style.backgroundColor = 'var(--color-primary-50)';
        btn.style.color = 'var(--primary)';
      }
    });

    addApplianceStep = 2;
    updateAddApplianceStep();
  }, 50);
}

function bindSearchEvents() {
  var searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      searchKeyword = e.target.value;
      renderAppliances();
    });
  }
}

function toggleSearch() {
  var searchBar = document.getElementById('search-bar');
  var searchInput = document.getElementById('search-input');
  if (searchBar) {
    searchBar.classList.toggle('hidden');
    if (!searchBar.classList.contains('hidden') && searchInput) {
      searchInput.focus();
    } else {
      searchKeyword = '';
      if (searchInput) searchInput.value = '';
      renderAppliances();
    }
  }
}

function exportData() {
  var dataStr = JSON.stringify(APP_DATA, null, 2);
  var blob = new Blob([dataStr], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'appliance-data.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('数据导出成功！', 'success');
}

function showStatsModal() {
  var total = APP_DATA.appliances.length;
  var warrantyCount = APP_DATA.appliances.filter(function(a) { return a.status === 'warranty'; }).length;
  var warningCount = APP_DATA.appliances.filter(function(a) { return a.status === 'warning'; }).length;
  var expiredCount = APP_DATA.appliances.filter(function(a) { return a.status === 'expired'; }).length;

  var roomCounts = {};
  APP_DATA.appliances.forEach(function(a) {
    roomCounts[a.room] = (roomCounts[a.room] || 0) + 1;
  });
  var roomHtml = '';
  Object.keys(roomCounts).forEach(function(room) {
    roomHtml += '<div class="flex items-center justify-between py-2"><span style="font-size:13px;color:var(--foreground);">' + room + '</span><span style="font-size:13px;font-weight:600;color:var(--primary);">' + roomCounts[room] + ' 台</span></div>';
  });

  var totalRepairCost = APP_DATA.repairRecords.reduce(function(sum, r) { return sum + r.cost; }, 0);

  var modal = document.getElementById('stats-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'stats-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s ease;pointer-events:none;';
    modal.innerHTML = '<div class="custom-scrollbar" style="width:88%;max-width:360px;background:var(--card);border-radius:24px;padding:24px;transform:scale(0.9);transition:transform 0.3s ease;max-height:80vh;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--muted) transparent;">' +
      '<div class="flex items-center justify-between mb-4">' +
      '<h3 style="font-size:18px;font-weight:700;color:var(--foreground);">数据统计</h3>' +
      '<button id="close-stats-modal" style="width:28px;height:28px;border-radius:50%;background:var(--muted);display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;"><i data-lucide="x" class="w-4 h-4" style="color:var(--foreground);"></i></button>' +
      '</div>' +
      '<div id="stats-content"></div>' +
      '</div>';
    document.body.appendChild(modal);
    lucide.createIcons();

    document.getElementById('close-stats-modal').addEventListener('click', function() {
      modal.style.opacity = '0';
      modal.style.pointerEvents = 'none';
      modal.querySelector('div').style.transform = 'scale(0.9)';
    });

    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
        modal.querySelector('div').style.transform = 'scale(0.9)';
      }
    });
  }

  var content = document.getElementById('stats-content');
  content.innerHTML =
    '<div class="grid grid-cols-3 gap-2 mb-5">' +
    '<div style="background:var(--color-primary-50);border-radius:12px;padding:12px;text-align:center;"><p style="font-size:20px;font-weight:700;color:var(--primary);margin:0;">' + total + '</p><p style="font-size:11px;color:var(--muted-foreground);margin-top:2px;">台家电</p></div>' +
    '<div style="background:var(--state-success-light);border-radius:12px;padding:12px;text-align:center;"><p style="font-size:20px;font-weight:700;color:var(--state-success);margin:0;">' + warrantyCount + '</p><p style="font-size:11px;color:var(--muted-foreground);margin-top:2px;">保修中</p></div>' +
    '<div style="background:var(--state-warning-light);border-radius:12px;padding:12px;text-align:center;"><p style="font-size:20px;font-weight:700;color:var(--state-warning);margin:0;">' + (warningCount + expiredCount) + '</p><p style="font-size:11px;color:var(--muted-foreground);margin-top:2px;">待关注</p></div>' +
    '</div>' +

    '<div style="background:var(--muted);border-radius:12px;padding:14px;margin-bottom:16px;">' +
    '<div class="flex items-center justify-between mb-3"><span style="font-size:13px;color:var(--muted-foreground);">保修分布</span></div>' +
    '<div class="flex gap-1 mb-1">' +
    '<div style="flex:' + warrantyCount + ';height:8px;background:var(--state-success);border-radius:4px;' + (warrantyCount === 0 ? 'display:none;' : '') + '"></div>' +
    '<div style="flex:' + warningCount + ';height:8px;background:var(--state-warning);border-radius:4px;' + (warningCount === 0 ? 'display:none;' : '') + '"></div>' +
    '<div style="flex:' + expiredCount + ';height:8px;background:var(--state-error);border-radius:4px;' + (expiredCount === 0 ? 'display:none;' : '') + '"></div>' +
    '</div>' +
    '<div class="flex justify-between"><span style="font-size:11px;color:var(--muted-foreground);">保修中 ' + warrantyCount + '</span><span style="font-size:11px;color:var(--muted-foreground);">即将到期 ' + warningCount + '</span><span style="font-size:11px;color:var(--muted-foreground);">已过保 ' + expiredCount + '</span></div>' +
    '</div>' +

    '<div style="margin-bottom:16px;">' +
    '<p style="font-size:13px;font-weight:600;color:var(--foreground);margin-bottom:4px;">房间分布</p>' +
    roomHtml +
    '</div>' +

    '<div style="background:var(--color-primary-50);border-radius:12px;padding:14px;">' +
    '<p style="font-size:12px;color:var(--muted-foreground);margin-bottom:4px;">累计维修费用</p>' +
    '<p style="font-size:22px;font-weight:700;color:var(--primary);">¥' + totalRepairCost + '</p>' +
    '<p style="font-size:11px;color:var(--muted-foreground);margin-top:2px;">共 ' + APP_DATA.repairRecords.length + ' 条维修记录</p>' +
    '</div>';

  modal.style.opacity = '1';
  modal.style.pointerEvents = 'auto';
  modal.querySelector('div').style.transform = 'scale(1)';
}

function editUserName() {
  var currentName = APP_DATA.user.name || '小明';
  var newName = prompt('请输入你的昵称', currentName);
  if (newName && newName.trim()) {
    APP_DATA.user.name = newName.trim();
    saveAppData();
    var profileName = document.getElementById('profile-name');
    if (profileName) profileName.textContent = APP_DATA.user.name;
    var homeUsername = document.getElementById('home-username');
    if (homeUsername) homeUsername.textContent = APP_DATA.user.name + '的家';
    showToast('昵称修改成功', 'success');
  }
}

function showAbout() {
  var modal = document.getElementById('about-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'about-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s ease;pointer-events:none;';
    modal.innerHTML = '<div style="width:85%;max-width:340px;background:var(--card);border-radius:24px;padding:32px 24px;text-align:center;transform:scale(0.9);transition:transform 0.3s ease;">' +
      '<div style="width:64px;height:64px;border-radius:20px;background:var(--color-primary-50);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;"><span style="font-size:32px;">🏠</span></div>' +
      '<h3 style="font-size:18px;font-weight:700;color:var(--foreground);margin-bottom:8px;">家电生命周期管家</h3>' +
      '<p style="font-size:13px;color:var(--muted-foreground);line-height:1.6;margin-bottom:16px;">让每一台家电都被妥善管理。从购买到报废，全程跟踪保修状态、维修记录和保养提醒，帮你把家打理得井井有条。</p>' +
      '<div style="padding:12px;background:var(--muted);border-radius:12px;margin-bottom:20px;">' +
      '<p style="font-size:12px;color:var(--muted-foreground);">版本 v1.0.0</p>' +
      '</div>' +
      '<button id="close-about-modal" style="width:100%;padding:12px;border-radius:12px;background:var(--primary);color:white;font-size:14px;font-weight:600;border:none;cursor:pointer;">知道了</button>' +
      '</div>';
    document.body.appendChild(modal);

    document.getElementById('close-about-modal').addEventListener('click', function() {
      modal.style.opacity = '0';
      modal.style.pointerEvents = 'none';
      modal.querySelector('div').style.transform = 'scale(0.9)';
    });

    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
        modal.querySelector('div').style.transform = 'scale(0.9)';
      }
    });
  }

  modal.style.opacity = '1';
  modal.style.pointerEvents = 'auto';
  modal.querySelector('div').style.transform = 'scale(1)';
}

function clearData() {
  showActionSheet({
    title: '清除所有数据',
    message: '确定要清除所有数据吗？此操作不可恢复。',
    buttons: [
      { text: '清除数据', destructive: true, onClick: function() {
        localStorage.removeItem('applianceManager');
        APP_DATA = JSON.parse(JSON.stringify(DEFAULT_DATA));
        recalculateAllAppliances();
        saveAppData();
        renderHome();
        renderAppliances();
        renderReminders();
        updateStats();
        initUserName();
        isDemoMode = true;
        localStorage.setItem('demoMode', 'true');
        tutorialCompleted = false;
        localStorage.removeItem('tutorialCompleted');
        updateExitDemoBtn();
        showToast('数据已清除', 'info');
        navigateTo('home');
        showTutorial();
      }}
    ]
  });
}

function checkDemoMode() {
  var saved = localStorage.getItem('demoMode');
  if (saved === 'false') {
    isDemoMode = false;
  } else {
    isDemoMode = true;
  }
  updateExitDemoBtn();
}

function updateExitDemoBtn() {
  var btn = document.getElementById('exit-demo-btn');
  if (btn) {
    btn.style.display = isDemoMode ? 'flex' : 'none';
  }
}

function exitDemoMode() {
  showActionSheet({
    title: '退出示例模式',
    message: '退出后将清空所有示例家电数据，你可以开始添加自己的家电了。确定要退出吗？',
    buttons: [
      { text: '退出并清空数据', onClick: function() {
        isDemoMode = false;
        localStorage.setItem('demoMode', 'false');
        clearAllApplianceData();
        updateExitDemoBtn();
        showToast('已退出示例模式', 'success');
        navigateTo('home');
      }}
    ]
  });
}

function clearAllApplianceData() {
  APP_DATA.appliances = [];
  APP_DATA.reminders = [];
  APP_DATA.repairRecords = [];
  APP_DATA.user.appliancesCount = 0;
  APP_DATA.user.warrantyCount = 0;
  APP_DATA.user.pendingCount = 0;
  saveAppData();
  renderHome();
  renderAppliances();
  renderReminders();
  updateStats();
  updateBellDot();
}

function checkTutorialStatus() {
  var saved = localStorage.getItem('tutorialCompleted');
  if (saved === 'true') {
    tutorialCompleted = true;
    checkDemoMode();
  } else {
    showTutorial();
  }
}

function checkDemoMode() {
  var saved = localStorage.getItem('demoMode');
  if (saved === 'false') {
    isDemoMode = false;
  } else {
    isDemoMode = true;
  }
  updateExitDemoBtn();
}

function updateExitDemoBtn() {
  var btn = document.getElementById('exit-demo-btn');
  if (btn) {
    btn.style.display = isDemoMode ? 'flex' : 'none';
  }
}

function showTutorial() {
  currentTutorialStep = 0;
  var overlay = document.getElementById('tutorial-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
  }
  renderTutorialDots();
  updateTutorialStep();
}

function hideTutorial() {
  var overlay = document.getElementById('tutorial-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

function renderTutorialDots() {
  var dotsContainer = document.getElementById('tutorial-dots');
  if (!dotsContainer) return;
  
  var html = '';
  for (var i = 0; i < TUTORIAL_STEPS.length; i++) {
    html += '<div class="tutorial-dot ' + (i === currentTutorialStep ? 'active' : '') + '"></div>';
  }
  dotsContainer.innerHTML = html;
}

function updateTutorialStep() {
  var step = TUTORIAL_STEPS[currentTutorialStep];
  if (!step) return;

  var iconEl = document.getElementById('tutorial-icon');
  var titleEl = document.getElementById('tutorial-title');
  var descEl = document.getElementById('tutorial-desc');
  var tipEl = document.getElementById('tutorial-tip');
  var nextBtn = document.getElementById('tutorial-next-btn');
  var prevBtn = document.getElementById('tutorial-prev-btn');
  var skipBtn = document.querySelector('.tutorial-skip');

  if (iconEl) {
    iconEl.textContent = step.icon;
    iconEl.style.background = step.bgColor;
  }
  if (titleEl) titleEl.textContent = step.title;
  if (descEl) descEl.textContent = step.desc;

  if (tipEl) {
    if (step.showTip && step.tip) {
      tipEl.style.display = 'block';
      tipEl.textContent = step.tip;
    } else {
      tipEl.style.display = 'none';
    }
  }

  if (nextBtn) {
    if (currentTutorialStep === TUTORIAL_STEPS.length - 1) {
      nextBtn.textContent = '开始体验';
    } else {
      nextBtn.textContent = '下一步';
    }
  }

  if (prevBtn) {
    prevBtn.style.display = currentTutorialStep > 0 ? 'block' : 'none';
  }

  if (skipBtn) {
    skipBtn.style.display = currentTutorialStep < TUTORIAL_STEPS.length - 1 ? 'block' : 'none';
  }

  renderTutorialDots();
}

function nextTutorialStep() {
  if (currentTutorialStep < TUTORIAL_STEPS.length - 1) {
    currentTutorialStep++;
    updateTutorialStep();
  } else {
    completeTutorial();
  }
}

function prevTutorialStep() {
  if (currentTutorialStep > 0) {
    currentTutorialStep--;
    updateTutorialStep();
  }
}

function skipTutorial() {
  showActionSheet({
    title: '跳过新手教程',
    message: '跳过教程后，你将直接进入示范模式。可以随时在"我的"页面重新查看教程。',
    buttons: [
      { text: '跳过教程', onClick: function() {
        tutorialCompleted = true;
        localStorage.setItem('tutorialCompleted', 'true');
        hideTutorial();
        checkDemoMode();
        showToast('已跳过教程', 'info');
      }}
    ]
  });
}

function completeTutorial() {
  tutorialCompleted = true;
  localStorage.setItem('tutorialCompleted', 'true');
  isDemoMode = true;
  localStorage.setItem('demoMode', 'true');
  hideTutorial();
  updateExitDemoBtn();
  showToast('欢迎开始体验！', 'success');
  navigateTo('home');
}

document.addEventListener('DOMContentLoaded', initApp);