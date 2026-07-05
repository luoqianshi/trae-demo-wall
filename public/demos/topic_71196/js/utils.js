// ===== 导路 - 工具函数模块 =====

// ---------- Toast通知 ----------
function initToast() {
  if (document.getElementById('toastContainer')) return;
  const div = document.createElement('div');
  div.id = 'toastContainer';
  document.body.appendChild(div);
}

function showToast(type, message, duration) {
  duration = duration || 3000;
  initToast();
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  var icons = { success: 'fa-check-circle', error: 'fa-circle-exclamation', info: 'fa-info-circle' };
  toast.innerHTML = '<i class="fa-solid ' + icons[type] + '"></i> ' + message;
  container.appendChild(toast);
  requestAnimationFrame(function() { toast.classList.add('show'); });
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 400);
  }, duration);
}

// ---------- 防抖 ----------
function debounce(fn, delay) {
  var timer = null;
  return function() {
    var args = Array.prototype.slice.call(arguments);
    var self = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(self, args); }, delay);
  };
}

// ---------- 数字滚动动画（防重复触发） ----------
var animatedNumbers = new WeakSet();
function animateNumbers() {
  document.querySelectorAll('.num-roll').forEach(function(el) {
    if (animatedNumbers.has(el)) return;
    animatedNumbers.add(el);
    var target = +el.dataset.target;
    var current = 0;
    var step = Math.max(1, Math.floor(target / 30));
    var timer = setInterval(function() {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current;
    }, 30);
  });
}

// ---------- 涟漪效果 ----------
function createRipple(e) {
  var btn = e.currentTarget;
  var ripple = document.createElement('span');
  ripple.className = 'ripple';
  var rect = btn.getBoundingClientRect();
  var size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
  btn.appendChild(ripple);
  setTimeout(function() { ripple.remove(); }, 600);
}

function bindRipple() {
  document.querySelectorAll('.btn, .login-btn, .quick-btn, .filter-tag').forEach(function(btn) {
    btn.addEventListener('click', createRipple);
  });
}

// ---------- 背景粒子 ----------
function initParticles() {
  var canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var particles = [];
  var isLight = document.documentElement.getAttribute('data-theme') === 'light';
  var color = isLight ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.12)';

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (var i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.2
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(function(p) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      var alphaStr = p.alpha.toFixed(2);
      ctx.fillStyle = color.replace(/[\d.]+\)$/, alphaStr + ')');
      ctx.fill();
    });
    // 连线
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          var lineAlpha = (0.1 * (1 - dist / 120)).toFixed(2);
          ctx.strokeStyle = color.replace(/[\d.]+\)$/, lineAlpha + ')');
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ---------- 主题切换 ----------
function toggleTheme() {
  var html = document.documentElement;
  var current = html.getAttribute('data-theme');
  var next = current === 'light' ? 'dark' : 'light';
  if (next === 'light') {
    html.setAttribute('data-theme', 'light');
  } else {
    html.removeAttribute('data-theme');
  }
  try {
    localStorage.setItem('daolu_theme', next);
  } catch(e) {}
  showToast('info', next === 'light' ? '已切换至亮色主题' : '已切换至暗色主题');
}

function initTheme() {
  var saved = '';
  try { saved = localStorage.getItem('daolu_theme') || ''; } catch(e) {}
  if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
}

// ---------- 引导 ----------
var onboardingSteps = [
  { title: '欢迎使用导路', text: '导路是AI学业导师与学生成长管理系统，帮助您高效管理学生学业预警、谈心辅导和成长档案。' },
  { title: '预警看板', text: '在预警看板中，您可以查看全班学生的学业预警状态，快速识别需要关注的学生。' },
  { title: '谈心助手', text: 'AI谈心助手可以帮您准备谈话提纲、分析学生情况，让每一次谈心更有针对性。' },
  { title: '成长档案', text: '查看学生的能力雷达图、成绩趋势和AI职业画像，全面了解学生发展状况。' },
  { title: '开始使用', text: '您可以点击右上角设置API密钥启用实时AI分析，或使用演示数据体验全部功能。' }
];

function initOnboarding() {
  var done = false;
  try { done = localStorage.getItem('daolu_onboarding') === 'done'; } catch(e) {}
  if (done) return;
  var step = 0;
  var overlay = document.getElementById('onboardingOverlay');
  var box = overlay.querySelector('.onboarding-box');
  var title = box.querySelector('h3');
  var text = box.querySelector('p');
  var stepEl = box.querySelector('.onboarding-step');
  var nextBtn = box.querySelector('.btn-next');
  var skipBtn = box.querySelector('.btn-skip');

  function render() {
    var s = onboardingSteps[step];
    title.textContent = s.title;
    text.textContent = s.text;
    stepEl.textContent = '步骤 ' + (step + 1) + ' / ' + onboardingSteps.length;
    nextBtn.textContent = step === onboardingSteps.length - 1 ? '完成' : '下一步';
  }

  nextBtn.onclick = function() {
    step++;
    if (step >= onboardingSteps.length) {
      overlay.classList.remove('show');
      try { localStorage.setItem('daolu_onboarding', 'done'); } catch(e) {}
    } else {
      render();
    }
  };
  skipBtn.onclick = function() {
    overlay.classList.remove('show');
    try { localStorage.setItem('daolu_onboarding', 'done'); } catch(e) {}
  };

  render();
  overlay.classList.add('show');
}

// ---------- 页面加载 ----------
function hideLoader() {
  var loader = document.getElementById('pageLoader');
  if (loader) loader.classList.add('hidden');
}

// ---------- 键盘快捷键 ----------
function initKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    // Ctrl+K 聚焦搜索
    if (e.ctrlKey && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      var search = document.getElementById('searchInput');
      if (search) search.focus();
    }
    // ESC 关闭弹窗
    if (e.key === 'Escape') {
      closeModal();
      closeApiSettings();
      var np = document.getElementById('notificationPanel');
      if (np && np.classList.contains('show')) np.classList.remove('show');
      // ESC 退出演示模式
      if (demoModeActive) {
        toggleDemoMode();
      }
    }
  });
}

// ===== 通知系统 =====
var notificationHistory = [];
var notificationTimer = null;
var maxNotifications = 20;
var notificationInited = false;

function initNotificationSystem() {
  if (notificationInited) return;
  notificationInited = true;
  createNotificationPanel();
  loadNotificationHistory();
  startNotificationSimulation();
}

function createNotificationPanel() {
  if (document.getElementById('notificationPanel')) return;

  var navTools = document.querySelector('.nav-tools');
  if (navTools && !document.getElementById('notificationToggle')) {
    var toggleBtn = document.createElement('button');
    toggleBtn.id = 'notificationToggle';
    toggleBtn.className = 'nav-tool-btn';
    toggleBtn.title = '通知中心';
    toggleBtn.innerHTML = '<i class="fa-solid fa-bell"></i><span id="notificationBadge" class="notification-badge" style="display:none"></span>';
    toggleBtn.onclick = toggleNotificationPanel;
    navTools.appendChild(toggleBtn);
  }

  var panel = document.createElement('div');
  panel.id = 'notificationPanel';
  panel.className = 'notification-panel';
  panel.innerHTML =
    '<div class="notification-header">' +
      '<h3><i class="fa-solid fa-bell"></i> 通知中心</h3>' +
      '<button class="notification-close" onclick="toggleNotificationPanel()"><i class="fa-solid fa-xmark"></i></button>' +
    '</div>' +
    '<div class="notification-list" id="notificationList"></div>' +
    '<div class="notification-footer">' +
      '<button onclick="clearAllNotifications()"><i class="fa-solid fa-trash"></i> 清空全部</button>' +
    '</div>';
  document.body.appendChild(panel);
}

function toggleNotificationPanel() {
  var panel = document.getElementById('notificationPanel');
  if (panel) panel.classList.toggle('show');
}

function showNotification(type, title, message, data) {
  var notification = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    type: type,
    title: title,
    message: message,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    data: data || {},
    read: false
  };

  addNotificationToHistory(notification);
  renderNotificationItem(notification, true);
  updateNotificationBadge();

  var typeMap = { warning: 'error', todo: 'info', system: 'info' };
  showToast(typeMap[type] || 'info', title + ': ' + message);
}

function addNotificationToHistory(notification) {
  notificationHistory.unshift(notification);
  if (notificationHistory.length > maxNotifications) {
    notificationHistory = notificationHistory.slice(0, maxNotifications);
  }
  try {
    localStorage.setItem('daolu_notifications', JSON.stringify(notificationHistory));
  } catch(e) {}
}

function loadNotificationHistory() {
  try {
    var saved = localStorage.getItem('daolu_notifications');
    if (saved) {
      notificationHistory = JSON.parse(saved);
      renderAllNotifications();
      updateNotificationBadge();
    }
  } catch(e) {}
}

function renderAllNotifications() {
  var list = document.getElementById('notificationList');
  if (!list) return;
  list.innerHTML = '';
  notificationHistory.forEach(function(n) {
    renderNotificationItem(n, false);
  });
}

function renderNotificationItem(notification, animate) {
  var list = document.getElementById('notificationList');
  if (!list) return;

  var iconMap = { warning: 'fa-triangle-exclamation', todo: 'fa-list-check', system: 'fa-info-circle' };
  var colorMap = { warning: 'var(--red)', todo: 'var(--accent)', system: 'var(--blue)' };

  var item = document.createElement('div');
  item.className = 'notification-item' + (notification.read ? ' read' : '') + (animate ? ' animate-in' : '');
  item.dataset.id = notification.id;
  item.innerHTML =
    '<div class="notification-icon" style="color:' + colorMap[notification.type] + '"><i class="fa-solid ' + iconMap[notification.type] + '"></i></div>' +
    '<div class="notification-content">' +
      '<div class="notification-title">' + notification.title + '</div>' +
      '<div class="notification-message">' + notification.message + '</div>' +
      '<div class="notification-time">' + notification.time + '</div>' +
    '</div>';

  item.onclick = function() {
    notification.read = true;
    item.classList.add('read');
    updateNotificationBadge();
    handleNotificationClick(notification);
  };

  if (animate) {
    list.insertBefore(item, list.firstChild);
  } else {
    list.appendChild(item);
  }
}

function updateNotificationBadge() {
  var badge = document.getElementById('notificationBadge');
  if (!badge) return;
  var unread = notificationHistory.filter(function(n) { return !n.read; }).length;
  if (unread > 0) {
    badge.style.display = 'block';
    badge.textContent = unread > 9 ? '9+' : unread;
  } else {
    badge.style.display = 'none';
  }
}

function clearAllNotifications() {
  notificationHistory = [];
  try { localStorage.removeItem('daolu_notifications'); } catch(e) {}
  renderAllNotifications();
  updateNotificationBadge();
}

function handleNotificationClick(notification) {
  if (notification.type === 'warning' && notification.data && notification.data.studentIdx !== undefined) {
    switchPage('dashboard');
    setTimeout(function() {
      openDetail(notification.data.studentIdx);
    }, 300);
  } else if (notification.type === 'todo') {
    switchPage('workspace');
  }
}

function startNotificationSimulation() {
  if (notificationTimer) clearInterval(notificationTimer);
  setTimeout(function() { generateRandomNotification(); }, 8000);
  notificationTimer = setInterval(function() {
    generateRandomNotification();
  }, 30000);
}

function generateRandomNotification() {
  if (!students || students.length === 0) return;
  var types = ['warning', 'todo', 'system'];
  var type = types[Math.floor(Math.random() * types.length)];

  var warningTitles = ['新红色预警', '新橙色预警', '出勤率异常'];
  var todoTitles = ['待办事项到期', '谈话任务提醒', '报告提交提醒'];
  var systemTitles = ['系统消息', '数据更新', '备份完成'];

  var warningMsgs = [
    '学生 {name} 触发红色预警，请立即关注。',
    '学生 {name} 出勤率低于70%，建议约谈。',
    '学生 {name} 平均成绩下滑严重，需干预。'
  ];
  var todoMsgs = [
    '今日有 {count} 项待办事项即将到期。',
    '红色预警学生谈话任务已到期，请尽快完成。',
    '月度报告需在今日提交。'
  ];
  var systemMsgs = [
    '系统已完成每日数据备份。',
    '数据集已自动同步至云端。',
    '新版本功能已更新，请查看。'
  ];

  var title, message, data = {};

  if (type === 'warning') {
    var alertStudents = students.filter(function(s) { return s.level === 'red' || s.level === 'orange'; });
    var s = alertStudents.length > 0 ? alertStudents[Math.floor(Math.random() * alertStudents.length)] : students[Math.floor(Math.random() * students.length)];
    title = warningTitles[Math.floor(Math.random() * warningTitles.length)];
    message = warningMsgs[Math.floor(Math.random() * warningMsgs.length)].replace('{name}', s.name);
    data.studentIdx = students.indexOf(s);
  } else if (type === 'todo') {
    title = todoTitles[Math.floor(Math.random() * todoTitles.length)];
    message = todoMsgs[Math.floor(Math.random() * todoMsgs.length)].replace('{count}', Math.floor(Math.random() * 3) + 1);
  } else {
    title = systemTitles[Math.floor(Math.random() * systemTitles.length)];
    message = systemMsgs[Math.floor(Math.random() * systemMsgs.length)];
  }

  showNotification(type, title, message, data);
}

function stopNotificationSimulation() {
  if (notificationTimer) {
    clearInterval(notificationTimer);
    notificationTimer = null;
  }
}

// ---------- 演示模式 ----------
var demoModeActive = false;
var demoCurrentStep = 0;
var demoAutoTimer = null;
var demoPaused = false;
var demoScript = [
  {
    text: '步骤1：登录系统',
    detail: '使用演示账号 teacher001 / 123456 登录系统，点击"登录系统"按钮进入主界面',
    action: function() {
      showDemoStep('步骤1：登录系统', '使用演示账号 teacher001 / 123456 登录系统，点击"登录系统"按钮进入主界面');
      highlightElement('#loginBtn');
      setTimeout(function() {
        if (document.getElementById('loginPage').style.display !== 'none') {
          doLogin();
        }
      }, 1500);
    }
  },
  {
    text: '步骤2：查看预警看板',
    detail: '系统自动加载学生数据，展示红色/橙色/蓝色三级预警统计。可按预警等级筛选、搜索学生姓名，或切换不同数据集',
    action: function() {
      showDemoStep('步骤2：查看预警看板', '系统自动加载学生数据，展示红色/橙色/蓝色三级预警统计。可按预警等级筛选、搜索学生姓名，或切换不同数据集');
      highlightElement('#page-dashboard .stats-row');
      setTimeout(function() {
        switchPage('dashboard');
        setTimeout(function() {
          var firstRow = document.querySelector('#studentTableBody tr');
          if (firstRow) highlightElement(firstRow);
        }, 600);
      }, 800);
    }
  },
  {
    text: '步骤3：查看学生详情',
    detail: '点击学生操作栏的"详情"按钮，查看该学生的完整信息：出勤率、成绩趋势、预警分析及AI谈心提纲',
    action: function() {
      showDemoStep('步骤3：查看学生详情', '点击学生操作栏的"详情"按钮，查看该学生的完整信息：出勤率、成绩趋势、预警分析及AI谈心提纲');
      setTimeout(function() {
        var firstBtn = document.querySelector('#studentTableBody tr .btn-primary');
        if (firstBtn) {
          highlightElement(firstBtn);
          setTimeout(function() { firstBtn.click(); }, 1200);
        }
      }, 600);
    }
  },
  {
    text: '步骤4：使用谈心助手',
    detail: 'AI谈心助手可帮助生成个性化谈话提纲。支持快捷按钮一键查询，也可直接输入问题获取AI分析建议',
    action: function() {
      showDemoStep('步骤4：使用谈心助手', 'AI谈心助手可帮助生成个性化谈话提纲。支持快捷按钮一键查询，也可直接输入问题获取AI分析建议');
      setTimeout(function() {
        closeModal();
        setTimeout(function() {
          switchPage('chat');
          setTimeout(function() {
            highlightElement('.chat-input-row');
          }, 600);
        }, 400);
      }, 600);
    }
  },
  {
    text: '步骤5：查看成长档案',
    detail: '查看学生的综合能力雷达图、成绩趋势曲线、成长时间线以及AI智能评价，全面了解学生发展状况',
    action: function() {
      showDemoStep('步骤5：查看成长档案', '查看学生的综合能力雷达图、成绩趋势曲线、成长时间线以及AI智能评价，全面了解学生发展状况');
      setTimeout(function() {
        switchPage('profile');
        setTimeout(function() {
          highlightElement('.profile-header');
        }, 600);
      }, 800);
    }
  }
];

function toggleDemoMode() {
  demoModeActive = !demoModeActive;
  var btn = document.getElementById('demoModeBtn');
  if (btn) {
    btn.classList.toggle('active', demoModeActive);
    btn.innerHTML = demoModeActive ? '<i class="fa-solid fa-stop"></i> 停止演示' : '<i class="fa-solid fa-play"></i> 演示模式';
  }
  if (demoModeActive) {
    showToast('info', '演示模式已开启');
    initDemoClickHighlight();
    showDemoControls();
    demoCurrentStep = 0;
    demoPaused = false;
  } else {
    showToast('info', '演示模式已关闭');
    hideDemoStep();
    clearHighlight();
    hideDemoControls();
    closeDemoFinish();
    if (demoAutoTimer) clearTimeout(demoAutoTimer);
  }
}

function initDemoClickHighlight() {
  if (document._demoClickHandler) return;
  document._demoClickHandler = function(e) {
    if (!demoModeActive) return;
    createClickHighlight(e.clientX, e.clientY);
  };
  document.addEventListener('click', document._demoClickHandler, true);
}

function createClickHighlight(x, y) {
  var ring = document.createElement('div');
  ring.className = 'demo-click-ring';
  ring.style.left = (x - 15) + 'px';
  ring.style.top = (y - 15) + 'px';
  document.body.appendChild(ring);
  setTimeout(function() { ring.remove(); }, 800);
}

function showDemoStep(text, detail) {
  var bar = document.getElementById('demoStepBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'demoStepBar';
    bar.className = 'demo-step-bar';
    document.body.appendChild(bar);
  }
  bar.innerHTML = text;
  if (detail) {
    bar.innerHTML += '<div class="demo-step-detail">' + detail + '</div>';
  }
  // 步骤进度指示
  bar.innerHTML += '<div class="demo-step-progress">' + (demoCurrentStep + 1) + ' / ' + demoScript.length + '</div>';
  bar.classList.add('show');
}

function showStepComplete() {
  var check = document.createElement('div');
  check.className = 'demo-step-complete';
  check.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
  document.body.appendChild(check);
  setTimeout(function() { check.remove(); }, 1200);
}

function showDemoFinish() {
  var overlay = document.getElementById('demoFinishOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'demoFinishOverlay';
    overlay.className = 'demo-finish-overlay';
    overlay.innerHTML =
      '<div class="demo-finish-box">' +
        '<div class="demo-finish-icon"><i class="fa-solid fa-circle-check"></i></div>' +
        '<h2>演示完成</h2>' +
        '<p>感谢观看</p>' +
        '<p class="demo-finish-sub">您可以关闭演示模式继续体验，或点击"了解导路"查看产品介绍</p>' +
        '<div class="demo-finish-actions">' +
          '<button onclick="closeDemoFinish();toggleDemoMode()" class="demo-finish-btn demo-finish-btn-primary"><i class="fa-solid fa-play"></i> 继续体验</button>' +
          '<a href="about.html" class="demo-finish-btn demo-finish-btn-outline"><i class="fa-solid fa-info-circle"></i> 了解导路</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
  }
  requestAnimationFrame(function() {
    overlay.classList.add('show');
  });
}

function closeDemoFinish() {
  var overlay = document.getElementById('demoFinishOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    setTimeout(function() { overlay.remove(); }, 400);
  }
}

function hideDemoStep() {
  var bar = document.getElementById('demoStepBar');
  if (bar) bar.classList.remove('show');
}

function highlightElement(selector) {
  clearHighlight();
  var el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!el) return;
  el.classList.add('demo-highlight');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearHighlight() {
  document.querySelectorAll('.demo-highlight').forEach(function(el) {
    el.classList.remove('demo-highlight');
  });
}

function showDemoControls() {
  var panel = document.getElementById('demoControlPanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'demoControlPanel';
    panel.className = 'demo-control-panel';
    panel.innerHTML =
      '<button onclick="runDemoScript()" title="自动播放"><i class="fa-solid fa-play"></i> 自动播放</button>' +
      '<button onclick="nextDemoStep()" title="下一步"><i class="fa-solid fa-forward-step"></i> 下一步</button>' +
      '<button onclick="toggleDemoPause()" id="demoPauseBtn" title="暂停/继续"><i class="fa-solid fa-pause"></i> 暂停</button>';
    document.body.appendChild(panel);
  }
  panel.classList.add('show');
}

function hideDemoControls() {
  var panel = document.getElementById('demoControlPanel');
  if (panel) panel.classList.remove('show');
}

function runDemoScript() {
  if (!demoModeActive) return;
  demoCurrentStep = 0;
  demoPaused = false;
  updatePauseBtn();
  executeDemoStep();
}

function executeDemoStep() {
  if (!demoModeActive || demoPaused) return;
  if (demoCurrentStep >= demoScript.length) {
    hideDemoStep();
    clearHighlight();
    hideDemoControls();
    showDemoFinish();
    return;
  }
  var step = demoScript[demoCurrentStep];
  step.action();
  // 显示步骤完成动画
  setTimeout(function() {
    showStepComplete();
  }, 3500);
  demoCurrentStep++;
  demoAutoTimer = setTimeout(executeDemoStep, 4500);
}

function nextDemoStep() {
  if (!demoModeActive) return;
  if (demoAutoTimer) clearTimeout(demoAutoTimer);
  demoPaused = false;
  updatePauseBtn();
  executeDemoStep();
}

function toggleDemoPause() {
  demoPaused = !demoPaused;
  updatePauseBtn();
  if (!demoPaused) {
    executeDemoStep();
  } else {
    if (demoAutoTimer) clearTimeout(demoAutoTimer);
  }
}

function updatePauseBtn() {
  var btn = document.getElementById('demoPauseBtn');
  if (btn) {
    btn.innerHTML = demoPaused ? '<i class="fa-solid fa-play"></i> 继续' : '<i class="fa-solid fa-pause"></i> 暂停';
  }
}
