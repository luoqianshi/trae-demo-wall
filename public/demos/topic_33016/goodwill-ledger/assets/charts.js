// assets/charts.js — Goodwill Ledger Interactive Experience (Dual-Role Edition)
// Enhanced version with AI visualization, form validation, toast, filters, sorting, animations
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var gold = style.getPropertyValue('--gold').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // === Mermaid Init ===
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({ startOnLoad: true, theme: 'neutral', securityLevel: 'loose' });
  }

  // === Scroll Reveal Animation ===
  var reveals = document.querySelectorAll('.reveal');
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });
  reveals.forEach(function(el) { observer.observe(el); });

  // === Nav scroll effect ===
  var nav = document.getElementById('topNav');
  if (nav) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }

  // ==================== TOAST NOTIFICATION SYSTEM ====================
  var toastContainer = null;
  function ensureToastContainer() {
    if (toastContainer) return;
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;pointer-events:none;align-items:flex-end;';
    document.body.appendChild(toastContainer);
  }

  window.showToast = function(message, type) {
    type = type || 'info';
    ensureToastContainer();
    var toast = document.createElement('div');
    var colors = {
      success: 'background:rgba(13,148,136,0.95);border-color:rgba(13,148,136,0.5);',
      error: 'background:rgba(232,115,74,0.95);border-color:rgba(232,115,74,0.5);',
      warning: 'background:rgba(212,168,67,0.95);border-color:rgba(212,168,67,0.5);',
      info: 'background:rgba(27,42,61,0.95);border-color:rgba(255,255,255,0.2);'
    };
    var icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    toast.style.cssText = colors[type] + 'color:#fff;padding:0.75rem 1.25rem;border-radius:8px;border:1px solid;font-size:0.9rem;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,0.2);pointer-events:auto;display:flex;align-items:center;gap:0.5rem;min-width:200px;';
    toast.innerHTML = '<span style="font-size:1.1rem;">' + icons[type] + '</span><span>' + message + '</span>';
    toastContainer.appendChild(toast);
    var removeTimer = setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3500);
    toast.dataset.removeTimer = removeTimer;
  };

  // ==================== RIPPLE EFFECT ====================
  function addRipple(e) {
    var btn = e.currentTarget;
    var rect = btn.getBoundingClientRect();
    var ripple = document.createElement('span');
    var size = Math.max(rect.width, rect.height);
    ripple.style.cssText = 'position:absolute;border-radius:50%;background:rgba(255,255,255,0.4);transform:scale(0);animation:rippleAnim 0.5s ease-out;pointer-events:none;width:' + size + 'px;height:' + size + 'px;left:' + (e.clientX - rect.left - size/2) + 'px;top:' + (e.clientY - rect.top - size/2) + 'px;';
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(function() {
      if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
    }, 500);
  }

  // Add ripple CSS
  var rippleStyle = document.createElement('style');
  rippleStyle.textContent = '@keyframes rippleAnim { to { transform:scale(2.5);opacity:0; } }';
  document.head.appendChild(rippleStyle);

  function attachRipples() {
    document.querySelectorAll('.exp-btn, .task-card, .volunteer-card').forEach(function(el) {
      if (!el.dataset.rippleAttached) {
        el.dataset.rippleAttached = '1';
        el.addEventListener('click', addRipple);
      }
    });
  }

  // ==================== CARD SCALE FEEDBACK ====================
  function attachCardFeedback() {
    document.querySelectorAll('.task-card, .volunteer-card, .problem-card, .value-card, .user-card').forEach(function(card) {
      card.addEventListener('mousedown', function() { this.style.transform = 'scale(0.98)'; });
      card.addEventListener('mouseup', function() { this.style.transform = ''; });
      card.addEventListener('mouseleave', function() { this.style.transform = ''; });
    });
  }

  // ==================== KEYBOARD SHORTCUTS ====================
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var modals = document.querySelectorAll('.exp-modal.active');
      modals.forEach(function(m) { m.classList.remove('active'); });
    }
  });

  // ==================== COUNTER ANIMATION ====================
  function animateCounter(el, target, suffix, duration) {
    var start = 0;
    var startTime = null;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(eased * target);
      el.textContent = current.toLocaleString() + (suffix || '');
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Animate number with decimal support
  function animateNumber(el, fromVal, toVal, duration, suffix, decimals) {
    suffix = suffix || '';
    decimals = decimals || 0;
    var startTime = null;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = fromVal + (toVal - fromVal) * eased;
      if (decimals === 0) {
        el.textContent = Math.floor(current).toLocaleString() + suffix;
      } else {
        el.textContent = current.toFixed(decimals) + suffix;
      }
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var metricsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        animateCounter(document.getElementById('metricUsers'), 12680, '', 2000);
        animateCounter(document.getElementById('metricServices'), 8456, '', 2000);
        animateCounter(document.getElementById('metricHours'), 24350, '', 2000);
        metricsObserver.disconnect();
      }
    });
  }, { threshold: 0.3 });
  var dashSection = document.getElementById('data');
  if (dashSection) metricsObserver.observe(dashSection);

  var rateEl = document.getElementById('metricRate');
  var rateObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var startTime = null;
        function stepRate(timestamp) {
          if (!startTime) startTime = timestamp;
          var progress = Math.min((timestamp - startTime) / 2000, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          rateEl.textContent = (eased * 4.9).toFixed(1);
          if (progress < 1) requestAnimationFrame(stepRate);
        }
        requestAnimationFrame(stepRate);
        rateObserver.disconnect();
      }
    });
  }, { threshold: 0.3 });
  if (rateEl) rateObserver.observe(rateEl);

  // ==================== LIVE FEED SYSTEM ====================
  var feedNames = ['张阿姨', '李大爷', '王奶奶', '赵叔叔', '陈奶奶', '大学生小李', '志愿者小刘', '志愿者小陈', '学生小王', '居民小赵', '刘阿姨', '老孙', '周爷爷', '吴奶奶'];
  var feedActions = [
    { text: '完成了陪诊服务', hours: '+3.5h', icon: '🏥' },
    { text: '帮助了手机教学', hours: '+1.0h', icon: '📱' },
    { text: '代买了药品', hours: '+0.5h', icon: '💊' },
    { text: '提供了情感陪伴', hours: '+2.0h', icon: '💬' },
    { text: '完成了家政协助', hours: '+1.5h', icon: '🧹' },
    { text: '代办了日常事务', hours: '+0.8h', icon: '💊' },
    { text: '帮助了数字技能指导', hours: '+1.2h', icon: '📱' },
    { text: '提供了陪诊服务', hours: '+4.0h', icon: '🏥' },
    { text: '陪伴了老人散步', hours: '+1.5h', icon: '💬' },
    { text: '整理了房间', hours: '+2.0h', icon: '🧹' }
  ];

  var liveFeedEl = document.getElementById('liveFeed');

  function addFeedItem(name, action, hours, icon, timeStr) {
    var item = document.createElement('div');
    item.className = 'feed-item';
    item.innerHTML = '<div class="feed-avatar">' + icon + '</div>' +
      '<div class="feed-text"><strong>' + name + '</strong> ' + action + '</div>' +
      '<div class="feed-time">' + timeStr + '</div>' +
      '<div class="feed-hours">' + hours + '</div>';
    if (liveFeedEl) {
      liveFeedEl.insertBefore(item, liveFeedEl.firstChild);
      while (liveFeedEl.children.length > 12) {
        liveFeedEl.removeChild(liveFeedEl.lastChild);
      }
    }
  }

  function generateRandomFeed() {
    var name = feedNames[Math.floor(Math.random() * feedNames.length)];
    var action = feedActions[Math.floor(Math.random() * feedActions.length)];
    var now = new Date();
    var timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    addFeedItem(name, action.text, action.hours, action.icon, timeStr);
  }

  // Initialize feed with some items
  for (var i = 0; i < 6; i++) {
    var name = feedNames[Math.floor(Math.random() * feedNames.length)];
    var action = feedActions[Math.floor(Math.random() * feedActions.length)];
    var min = Math.floor(Math.random() * 60);
    var timeStr = (14 + Math.floor(Math.random() * 4)).toString().padStart(2, '0') + ':' + min.toString().padStart(2, '0');
    addFeedItem(name, action.text, action.hours, action.icon, timeStr);
  }

  // Auto-generate feed every 5 seconds
  setInterval(function() {
    if (Math.random() > 0.3) {
      generateRandomFeed();
    }
  }, 5000);

  // ==================== DUAL-ROLE ACCOUNT SYSTEM ====================
  var currentAccount = null;
  var selectedRoleOption = null;
  var selectedVolunteer = null;
  var selectedTask = null;
  var serviceTimerInterval = null;
  var serviceSeconds = 0;

  // Extended volunteer pool with detailed profiles
  var volunteerPool = [
    { name: '大学生小李', avatar: '🎓', tags: ['陪诊', '数字技能'], rating: 4.9, distance: '0.8km', hours: 86, matchScore: 98, age: 22, major: '医学院大四', bio: '有耐心，熟悉医院流程，擅长陪伴老人就医', completedTasks: 32, responseTime: '<5分钟' },
    { name: '志愿者小刘', avatar: '🙋', tags: ['家政', '代办'], rating: 4.8, distance: '1.2km', hours: 64, matchScore: 92, age: 35, major: '社区工作者', bio: '做事细致，擅长家务整理和日常代办事务', completedTasks: 24, responseTime: '<10分钟' },
    { name: '志愿者小陈', avatar: '🙋‍♀️', tags: ['陪伴', '数字技能'], rating: 4.7, distance: '0.5km', hours: 52, matchScore: 89, age: 28, major: 'IT工程师', bio: '擅长教老人使用智能手机和电脑，沟通能力强', completedTasks: 19, responseTime: '<8分钟' },
    { name: '学生小王', avatar: '🎓', tags: ['陪诊', '代办'], rating: 4.6, distance: '1.5km', hours: 38, matchScore: 85, age: 20, major: '护理专业', bio: '护理专业学生，有基础护理知识，责任心强', completedTasks: 14, responseTime: '<15分钟' },
    { name: '居民小赵', avatar: '🏘️', tags: ['陪伴', '家政'], rating: 4.9, distance: '0.3km', hours: 25, matchScore: 94, age: 45, major: '退休教师', bio: '退休教师，时间充裕，喜欢和人交流，擅长倾听', completedTasks: 10, responseTime: '<3分钟' },
    { name: '志愿者小张', avatar: '🙋', tags: ['数字技能', '陪伴'], rating: 4.5, distance: '2.0km', hours: 42, matchScore: 78, age: 24, major: '设计师', bio: '设计专业毕业，擅长电脑操作，周末时间充裕', completedTasks: 16, responseTime: '<20分钟' },
    { name: '退休医生老陈', avatar: '👨‍⚕️', tags: ['陪诊', '家政'], rating: 5.0, distance: '1.0km', hours: 112, matchScore: 96, age: 62, major: '退休内科医生', bio: '退休医生，医学知识丰富，特别适合陪诊需求', completedTasks: 45, responseTime: '<10分钟' },
    { name: '热心大妈周姐', avatar: '👩', tags: ['代办', '家政'], rating: 4.8, distance: '0.6km', hours: 73, matchScore: 90, age: 52, major: '家庭主妇', bio: '熟悉周边商圈和办事流程，办事效率高', completedTasks: 28, responseTime: '<5分钟' }
  ];

  var needTypeMap = {
    'medical': { label: '陪诊就医', icon: '🏥', baseHours: 3.5 },
    'digital': { label: '数字技能指导', icon: '📱', baseHours: 1.0 },
    'errand': { label: '代办事务', icon: '💊', baseHours: 0.8 },
    'cleaning': { label: '家政协助', icon: '🧹', baseHours: 2.0 },
    'company': { label: '情感陪伴', icon: '💬', baseHours: 1.5 }
  };

  // Extended task templates with richer descriptions
  var taskTemplates = [
    { type: 'medical', title: '陪诊就医', desc: '需要陪同前往市医院复诊，帮忙挂号、排队和取药。老人腿脚不便，需要搀扶。', requester: '张阿姨', location: '阳光花园社区', time: '今天 14:00', hours: 3.5, icon: '🏥', urgency: '高', distance: '0.5km' },
    { type: 'digital', title: '手机教学', desc: '想学用微信视频通话和扫码支付，希望能耐心一步步教，已经买了新手机但不太会用。', requester: '李大爷', location: '幸福家园社区', time: '明天 10:00', hours: 1.0, icon: '📱', urgency: '中', distance: '1.2km' },
    { type: 'errand', title: '代买药品', desc: '需要帮忙去社区医院取降压药，处方已开好，医保卡已备好，只需代取即可。', requester: '赵叔叔', location: '和谐小区', time: '今天 16:00', hours: 0.8, icon: '💊', urgency: '高', distance: '0.8km' },
    { type: 'cleaning', title: '家政协助', desc: '周末大扫除，需要帮忙擦窗户、拖地和整理杂物。家里面积约80平米，预计2小时完成。', requester: '王奶奶', location: '瑞景社区', time: '本周六 09:00', hours: 2.0, icon: '🧹', urgency: '低', distance: '1.5km' },
    { type: 'company', title: '情感陪伴', desc: '独居老人，子女在外地工作，希望有人能来聊聊天、散散步，分享生活趣事。', requester: '陈奶奶', location: '阳光花园社区', time: '明天 15:00', hours: 1.5, icon: '💬', urgency: '中', distance: '0.3km' },
    { type: 'digital', title: '电脑教学', desc: '想学用电脑看新闻和发邮件，家里有台式电脑但不太会用，希望能上门指导。', requester: '周爷爷', location: '幸福家园社区', time: '下周二 14:00', hours: 1.2, icon: '📱', urgency: '低', distance: '2.0km' },
    { type: 'medical', title: '陪同体检', desc: '年度体检需要陪同，地点在社区卫生服务中心，主要是排队和帮忙看报告。', requester: '吴奶奶', location: '和谐小区', time: '本周日 08:00', hours: 2.5, icon: '🏥', urgency: '中', distance: '1.0km' },
    { type: 'errand', title: '代取快递', desc: '网购了一些生活用品，快递点在小区南门，但最近腿脚不便，需要帮忙代取。', requester: '老孙', location: '瑞景社区', time: '今天 18:00', hours: 0.5, icon: '💊', urgency: '低', distance: '0.4km' },
    { type: 'cleaning', title: '换季整理', desc: '换季需要整理衣柜和清洗窗帘，一个人搬不动，需要年轻力壮的帮手。', requester: '刘阿姨', location: '阳光花园社区', time: '本周六 14:00', hours: 2.5, icon: '🧹', urgency: '中', distance: '0.7km' },
    { type: 'company', title: '下棋陪伴', desc: '喜欢下象棋但找不到对手，希望能有人来陪下棋、喝茶聊天，消磨午后时光。', requester: '李大爷', location: '幸福家园社区', time: '每天下午', hours: 1.0, icon: '💬', urgency: '低', distance: '1.2km' }
  ];

  var currentTaskFilter = 'all';
  var currentTaskSort = 'default';

  // ---- Account UI helpers ----
  function updateAccountBar() {
    var display = document.getElementById('currentUserDisplay');
    var btnCreate = document.getElementById('btnCreateAccount');
    var btnSwitch = document.getElementById('btnSwitchRole');
    var btnLogout = document.getElementById('btnLogout');

    if (!currentAccount) {
      display.innerHTML = '<div class="user-mini-avatar">👤</div><div class="user-mini-info"><div class="user-mini-name">访客模式</div><div class="user-mini-balance">请先创建临时账户</div></div>';
      if (btnCreate) btnCreate.style.display = '';
      if (btnSwitch) btnSwitch.style.display = 'none';
      if (btnLogout) btnLogout.style.display = 'none';
    } else {
      var roleLabel = currentAccount.role === 'publisher' ? '需求发布者' : '任务完成者';
      var roleIcon = currentAccount.role === 'publisher' ? '📢' : '🤝';
      display.innerHTML = '<div class="user-mini-avatar">' + roleIcon + '</div><div class="user-mini-info"><div class="user-mini-name">' + currentAccount.name + '</div><div class="user-mini-balance">' + roleLabel + ' · 余额 ' + currentAccount.balance.toFixed(1) + 'h</div></div>';
      if (btnCreate) btnCreate.style.display = 'none';
      if (btnSwitch) btnSwitch.style.display = '';
      if (btnLogout) btnLogout.style.display = '';
    }
  }

  function updateMyAccountPanel() {
    var balanceEl = document.getElementById('myBalance');
    var tasksEl = document.getElementById('myTasks');
    var rankEl = document.getElementById('myRank');
    var recordsEl = document.getElementById('myRecords');

    if (!currentAccount) {
      if (balanceEl) balanceEl.textContent = '0.0';
      if (tasksEl) tasksEl.textContent = '0';
      if (rankEl) rankEl.textContent = '-';
      if (recordsEl) recordsEl.innerHTML = '<div class="my-record-empty">暂无记录，开始体验吧！</div>';
      return;
    }

    // Animate balance change
    if (balanceEl) {
      var oldBalance = parseFloat(balanceEl.textContent) || 0;
      animateNumber(balanceEl, oldBalance, currentAccount.balance, 800, '', 1);
    }
    if (tasksEl) tasksEl.textContent = currentAccount.taskCount;

    // Calculate rank based on balance
    var rank = '-';
    if (currentAccount.balance >= 100) rank = 'Top 5%';
    else if (currentAccount.balance >= 50) rank = 'Top 15%';
    else if (currentAccount.balance >= 20) rank = 'Top 30%';
    else if (currentAccount.balance > 0) rank = 'Top 50%';
    if (rankEl) rankEl.textContent = rank;

    // Render records
    if (recordsEl) {
      if (currentAccount.records.length === 0) {
        recordsEl.innerHTML = '<div class="my-record-empty">暂无记录，开始体验吧！</div>';
      } else {
        recordsEl.innerHTML = '';
        currentAccount.records.slice().reverse().forEach(function(rec) {
          var div = document.createElement('div');
          div.className = 'my-record-item';
          div.innerHTML =
            '<div class="my-record-left">' +
              '<div class="my-record-icon">' + rec.icon + '</div>' +
              '<div class="my-record-info">' +
                '<div class="my-record-title">' + rec.title + '</div>' +
                '<div class="my-record-meta">' + rec.meta + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="my-record-hours ' + (rec.hours > 0 ? 'positive' : 'negative') + '">' + (rec.hours > 0 ? '+' : '') + rec.hours + 'h</div>';
          recordsEl.appendChild(div);
        });
      }
    }
  }

  function addAccountRecord(title, meta, hours, icon) {
    if (!currentAccount) return;
    currentAccount.records.push({ title: title, meta: meta, hours: hours, icon: icon, time: new Date() });
    currentAccount.taskCount++;
    updateMyAccountPanel();
  }

  // Calculate weekly/monthly contribution stats
  function getContributionStats() {
    if (!currentAccount || currentAccount.records.length === 0) {
      return { week: 0, month: 0 };
    }
    var now = new Date();
    var weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    var monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    var weekHours = 0;
    var monthHours = 0;
    currentAccount.records.forEach(function(rec) {
      if (rec.hours > 0) {
        if (rec.time >= weekAgo) weekHours += rec.hours;
        if (rec.time >= monthAgo) monthHours += rec.hours;
      }
    });
    return { week: weekHours, month: monthHours };
  }

  function showFlowPanel() {
    var notLogged = document.getElementById('expNotLogged');
    var pubFlow = document.getElementById('publisherFlow');
    var compFlow = document.getElementById('completerFlow');

    if (!currentAccount) {
      if (notLogged) notLogged.style.display = 'block';
      if (pubFlow) pubFlow.style.display = 'none';
      if (compFlow) compFlow.style.display = 'none';
      return;
    }

    if (notLogged) notLogged.style.display = 'none';
    if (currentAccount.role === 'publisher') {
      if (pubFlow) pubFlow.style.display = 'block';
      if (compFlow) compFlow.style.display = 'none';
      resetPublisher();
    } else {
      if (pubFlow) pubFlow.style.display = 'none';
      if (compFlow) compFlow.style.display = 'block';
      resetCompleter();
    }
  }

  // ---- Modal functions ----
  window.showCreateAccount = function() {
    var modal = document.getElementById('createAccountModal');
    if (modal) modal.classList.add('active');
    selectedRoleOption = null;
    document.querySelectorAll('.role-option').forEach(function(el) { el.classList.remove('selected'); });
    var nameInput = document.getElementById('newAccountName');
    if (nameInput) nameInput.value = '';
  };

  window.closeCreateAccount = function() {
    var modal = document.getElementById('createAccountModal');
    if (modal) modal.classList.remove('active');
  };

  window.selectRole = function(el) {
    document.querySelectorAll('.role-option').forEach(function(opt) { opt.classList.remove('selected'); });
    el.classList.add('selected');
    selectedRoleOption = el.dataset.role;
  };

  window.createAccount = function() {
    var nameInput = document.getElementById('newAccountName');
    var name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      name = '用户' + Math.floor(Math.random() * 9000 + 1000);
    }
    if (!selectedRoleOption) {
      showToast('请选择一个角色身份', 'warning');
      return;
    }

    currentAccount = {
      name: name,
      role: selectedRoleOption,
      balance: selectedRoleOption === 'publisher' ? 12.0 : 0.0,
      records: [],
      taskCount: 0
    };

    closeCreateAccount();
    updateAccountBar();
    updateMyAccountPanel();
    showFlowPanel();
    showToast('欢迎，' + name + '！账户创建成功', 'success');
  };

  window.toggleRole = function() {
    if (!currentAccount) return;
    currentAccount.role = currentAccount.role === 'publisher' ? 'completer' : 'publisher';
    updateAccountBar();
    showFlowPanel();
    showToast('已切换至' + (currentAccount.role === 'publisher' ? '需求发布者' : '任务完成者'), 'info');
  };

  window.logoutAccount = function() {
    currentAccount = null;
    selectedVolunteer = null;
    selectedTask = null;
    clearInterval(serviceTimerInterval);
    serviceTimerInterval = null;
    serviceSeconds = 0;
    updateAccountBar();
    updateMyAccountPanel();
    showFlowPanel();
    showToast('已退出账户', 'info');
  };

  // ==================== FORM VALIDATION ====================
  function validateNeedForm() {
    var needDesc = document.getElementById('pubNeedDesc');
    var desc = needDesc ? needDesc.value.trim() : '';
    if (!desc) {
      showToast('请填写需求描述', 'warning');
      if (needDesc) {
        needDesc.style.borderColor = 'var(--accent2)';
        setTimeout(function() { needDesc.style.borderColor = ''; }, 2000);
      }
      return false;
    }
    if (!currentAccount) {
      showToast('请先创建账户', 'warning');
      return false;
    }
    var needType = document.getElementById('pubNeedType').value;
    var requiredHours = needTypeMap[needType].baseHours;
    if (currentAccount.balance < requiredHours) {
      showToast('余额不足！需要 ' + requiredHours + 'h，当前余额 ' + currentAccount.balance.toFixed(1) + 'h', 'error');
      return false;
    }
    return true;
  }

  // ==================== LOADING STATE ====================
  function setButtonLoading(btnId, loading) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) {
      btn.dataset.originalText = btn.textContent;
      btn.innerHTML = '<span style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.6s linear infinite;vertical-align:middle;margin-right:6px;"></span>处理中...';
      btn.disabled = true;
    } else {
      btn.textContent = btn.dataset.originalText || btn.textContent;
      btn.disabled = false;
    }
  }

  // Add spin animation
  var spinStyle = document.createElement('style');
  spinStyle.textContent = '@keyframes spin { to { transform:rotate(360deg); } }';
  document.head.appendChild(spinStyle);

  // ==================== PUBLISHER FLOW ====================
  // AI thinking steps with detailed animation
  var aiThinkingSteps = [
    { icon: '🔍', text: '需求识别', detail: '分析需求类型与关键词...', progress: 20 },
    { icon: '⚡', text: '紧急度分析', detail: '评估时间敏感度与优先级...', progress: 40 },
    { icon: '📍', text: '地理位置计算', detail: '匹配附近可用志愿者...', progress: 60 },
    { icon: '🎯', text: '能力匹配', detail: '比对技能标签与服务记录...', progress: 80 },
    { icon: '✨', text: '生成推荐', detail: '排序并生成最优匹配方案', progress: 100 }
  ];

  window.publishNeed = function() {
    if (!validateNeedForm()) return;

    var needType = document.getElementById('pubNeedType').value;
    var needDesc = document.getElementById('pubNeedDesc').value;
    var needTime = document.getElementById('pubNeedTime').value;
    var needLocation = document.getElementById('pubNeedLocation').value;

    if (!needDesc.trim()) {
      needDesc = '需要' + needTypeMap[needType].label + '服务';
      document.getElementById('pubNeedDesc').value = needDesc;
    }

    // Hide step 1, show step 2
    document.getElementById('pubStep1').style.display = 'none';
    document.getElementById('pubStep2').classList.add('active');

    // Render detailed AI thinking animation
    renderAIThinkingAnimation();

    // Simulate AI thinking with step progression
    var currentStep = 0;
    var thinkingInterval = setInterval(function() {
      if (currentStep >= aiThinkingSteps.length) {
        clearInterval(thinkingInterval);
        setTimeout(function() {
          document.getElementById('pubStep2').classList.remove('active');
          showPubMatchResults(needType);
        }, 600);
        return;
      }
      updateAIThinkingStep(currentStep);
      currentStep++;
    }, 500);
  };

  function renderAIThinkingAnimation() {
    var step2 = document.getElementById('pubStep2');
    var stepsHtml = '<div class="ai-brain">🤖</div>' +
      '<div class="ai-thinking-steps">';
    aiThinkingSteps.forEach(function(step, idx) {
      stepsHtml += '<div class="ai-step-item" id="aiStep' + idx + '">' +
        '<div class="ai-step-icon">' + step.icon + '</div>' +
        '<div class="ai-step-text">' +
          '<div class="ai-step-title">' + step.text + '</div>' +
          '<div class="ai-step-detail">' + step.detail + '</div>' +
        '</div>' +
        '<div class="ai-step-status" id="aiStepStatus' + idx + '">⏳</div>' +
      '</div>';
    });
    stepsHtml += '</div>' +
      '<div class="ai-progress-bar"><div class="ai-progress-fill" id="aiProgressFill"></div></div>' +
      '<p style="font-size:0.75rem; opacity:0.5; margin-top:0.75rem;">预计匹配 3 位志愿者</p>';
    step2.innerHTML = stepsHtml;

    // Add AI thinking styles if not present
    if (!document.getElementById('aiThinkingStyles')) {
      var s = document.createElement('style');
      s.id = 'aiThinkingStyles';
      s.textContent =
        '.ai-thinking-steps { text-align:left; max-width:320px; margin:0 auto 1rem; }' +
        '.ai-step-item { display:flex; align-items:center; gap:0.75rem; padding:0.5rem 0; opacity:0.4; transition:all 0.3s; }' +
        '.ai-step-item.active { opacity:1; }' +
        '.ai-step-item.done { opacity:0.7; }' +
        '.ai-step-item.done .ai-step-status { color:var(--accent); }' +
        '.ai-step-icon { width:32px;height:32px;border-radius:50%;background:rgba(212,168,67,0.15);display:flex;align-items:center;justify-content:center;font-size:0.9rem;flex-shrink:0; }' +
        '.ai-step-text { flex:1; }' +
        '.ai-step-title { font-size:0.85rem;font-weight:600; }' +
        '.ai-step-detail { font-size:0.7rem;opacity:0.6; }' +
        '.ai-step-status { font-size:0.9rem;flex-shrink:0; }' +
        '.ai-progress-bar { width:100%;max-width:200px;height:4px;background:rgba(255,255,255,0.15);border-radius:2px;margin:0 auto;overflow:hidden; }' +
        '.ai-progress-fill { height:100%;background:var(--gold);width:0%;transition:width 0.4s ease-out;border-radius:2px; }';
      document.head.appendChild(s);
    }
  }

  function updateAIThinkingStep(stepIndex) {
    for (var i = 0; i < aiThinkingSteps.length; i++) {
      var el = document.getElementById('aiStep' + i);
      var statusEl = document.getElementById('aiStepStatus' + i);
      if (!el || !statusEl) continue;
      if (i < stepIndex) {
        el.classList.add('done');
        el.classList.remove('active');
        statusEl.textContent = '✓';
      } else if (i === stepIndex) {
        el.classList.add('active');
        statusEl.textContent = '⋯';
      }
    }
    var fill = document.getElementById('aiProgressFill');
    if (fill) fill.style.width = aiThinkingSteps[stepIndex].progress + '%';
  }

  function showPubMatchResults(needType) {
    var listEl = document.getElementById('pubVolunteerList');
    listEl.innerHTML = '';

    // Shuffle and pick 3 volunteers
    var shuffled = volunteerPool.slice().sort(function() { return Math.random() - 0.5; });
    var selected = shuffled.slice(0, 3);

    // Calculate and display match score explanation
    var matchExplanations = [
      '需求类型匹配度 95% + 距离 proximity 0.8km + 服务评分 4.9 + 响应速度 <5分钟',
      '技能标签完全匹配 + 距离 proximity 1.2km + 累计服务 64h + 好评率 98%',
      '地理位置最近 + 专业背景契合 + 近期活跃度高 + 用户评价优秀'
    ];

    selected.forEach(function(vol, idx) {
      var card = document.createElement('div');
      card.className = 'volunteer-card';
      card.dataset.index = idx;
      card.dataset.hours = needTypeMap[needType].baseHours;
      card.dataset.name = vol.name;
      card.dataset.icon = needTypeMap[needType].icon;
      card.onclick = function() {
        document.querySelectorAll('.volunteer-card').forEach(function(c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        selectedVolunteer = { name: vol.name, hours: needTypeMap[needType].baseHours, icon: needTypeMap[needType].icon, typeLabel: needTypeMap[needType].label };
        document.getElementById('pubBtnConfirm').disabled = false;
      };

      var tagsHtml = vol.tags.map(function(t) { return '<span class="vol-match-tag">' + t + '</span>'; }).join('');

      // Match score breakdown
      var scoreBreakdown = generateMatchScoreBreakdown(vol, needType);

      card.innerHTML =
        '<div class="vol-avatar">' + vol.avatar + '</div>' +
        '<div class="vol-info">' +
          '<h4>' + vol.name + tagsHtml + '</h4>' +
          '<p>⭐ ' + vol.rating + ' · 📍 ' + vol.distance + ' · 累计 ' + vol.hours + 'h</p>' +
          '<div class="vol-bio" style="font-size:0.7rem;opacity:0.6;margin-top:0.25rem;line-height:1.4;">' + vol.bio + '</div>' +
          '<div class="vol-match-detail" style="font-size:0.7rem;color:var(--gold);margin-top:0.35rem;padding-top:0.35rem;border-top:1px solid rgba(255,255,255,0.1);">' +
            '<div style="font-weight:600;margin-bottom:0.2rem;">匹配依据：</div>' +
            scoreBreakdown +
          '</div>' +
        '</div>' +
        '<div class="vol-score">' + vol.matchScore + '%</div>';
      listEl.appendChild(card);
    });

    document.getElementById('pubStep3').classList.add('active');
    attachRipples();
    attachCardFeedback();
  }

  function generateMatchScoreBreakdown(vol, needType) {
    var typeMatch = vol.tags.includes(needTypeMap[needType].label.substring(0, 2)) ? 35 : 20;
    var distScore = Math.max(5, 25 - parseFloat(vol.distance) * 10);
    var ratingScore = vol.rating * 6;
    var expScore = Math.min(20, vol.hours / 5);
    return '类型匹配 +' + typeMatch + ' · 距离 +' + Math.round(distScore) + ' · 评分 +' + Math.round(ratingScore) + ' · 经验 +' + Math.round(expScore);
  }

  window.confirmVolunteer = function() {
    if (!selectedVolunteer) return;
    document.getElementById('pubStep3').classList.remove('active');
    document.getElementById('pubStep4').classList.add('active');
    startPubServiceSimulation();
  };

  function startPubServiceSimulation() {
    serviceSeconds = 0;
    var steps = [
      { icon: '🚶', status: '志愿者正在前往您的位置', detail: '预计 15 分钟后到达', prog: 2 },
      { icon: '🏠', status: '志愿者已到达', detail: '正在确认服务详情', prog: 3 },
      { icon: '⏱️', status: '服务进行中', detail: '志愿者正在为您提供服务', prog: 3 },
      { icon: '✅', status: '服务即将完成', detail: '正在确认服务结果', prog: 4 }
    ];
    var currentStep = 0;

    function updateStep() {
      if (currentStep >= steps.length) {
        completePubService();
        return;
      }
      var step = steps[currentStep];
      document.getElementById('pubServiceIcon').textContent = step.icon;
      document.getElementById('pubServiceStatus').textContent = step.status;
      document.getElementById('pubServiceDetail').textContent = step.detail;

      for (var i = 1; i <= 4; i++) {
        var el = document.getElementById('pubProg' + i);
        el.classList.remove('done', 'active');
        if (i < step.prog) el.classList.add('done');
        else if (i === step.prog) el.classList.add('active');
      }

      currentStep++;
      setTimeout(updateStep, 3000 + Math.random() * 2000);
    }

    serviceTimerInterval = setInterval(function() {
      serviceSeconds++;
      var m = Math.floor(serviceSeconds / 60).toString().padStart(2, '0');
      var s = (serviceSeconds % 60).toString().padStart(2, '0');
      document.getElementById('pubServiceTimer').textContent = m + ':' + s;
    }, 1000);

    updateStep();
  }

  function completePubService() {
    clearInterval(serviceTimerInterval);
    serviceTimerInterval = null;
    document.getElementById('pubStep4').classList.remove('active');
    document.getElementById('pubStep5').classList.add('active');

    var hours = selectedVolunteer.hours;
    document.getElementById('pubHoursSpent').textContent = '-' + hours + 'h';

    // Deduct from account
    if (currentAccount) {
      currentAccount.balance -= hours;
      if (currentAccount.balance < 0) currentAccount.balance = 0;
      addAccountRecord(selectedVolunteer.typeLabel, '志愿者' + selectedVolunteer.name + '完成服务 · 刚刚', -hours, selectedVolunteer.icon);
      updateAccountBar();
    }

    // Add to live feed
    var now = new Date();
    var timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    addFeedItem(currentAccount ? currentAccount.name : '用户', '完成了' + selectedVolunteer.typeLabel, '-' + hours + 'h', selectedVolunteer.icon, timeStr);

    // Update demo section metrics
    var servicesEl = document.getElementById('metricServices');
    var hoursEl = document.getElementById('metricHours');
    if (servicesEl) {
      var currentServices = parseInt(servicesEl.textContent.replace(/,/g, '')) || 8456;
      servicesEl.textContent = (currentServices + 1).toLocaleString();
    }
    if (hoursEl) {
      var currentTotalHours = parseInt(hoursEl.textContent.replace(/,/g, '')) || 24350;
      hoursEl.textContent = (currentTotalHours + Math.round(hours)).toLocaleString();
    }

    showToast('服务完成！已扣除 ' + hours + 'h 善意时长', 'success');
  }

  window.resetPublisher = function() {
    clearInterval(serviceTimerInterval);
    serviceTimerInterval = null;
    serviceSeconds = 0;
    selectedVolunteer = null;

    document.getElementById('pubStep1').style.display = 'block';
    document.getElementById('pubStep2').classList.remove('active');
    document.getElementById('pubStep3').classList.remove('active');
    document.getElementById('pubStep4').classList.remove('active');
    document.getElementById('pubStep5').classList.remove('active');
    document.getElementById('pubBtnConfirm').disabled = true;
    document.getElementById('pubServiceTimer').textContent = '00:00';

    for (var i = 1; i <= 4; i++) {
      var el = document.getElementById('pubProg' + i);
      el.classList.remove('done', 'active');
      if (i === 1) el.classList.add('done');
      else if (i === 2) el.classList.add('active');
    }
  };

  // ==================== COMPLETER FLOW ====================
  // Task filter and sort controls
  function renderTaskControls() {
    var compStep1 = document.getElementById('compStep1');
    if (!compStep1) return;
    var existingControls = document.getElementById('taskControls');
    if (existingControls) return;

    var controls = document.createElement('div');
    controls.id = 'taskControls';
    controls.style.cssText = 'display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap;';
    controls.innerHTML =
      '<select id="taskFilter" onchange="filterTasks(this.value)" style="padding:0.4rem 0.6rem;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.1);color:#fff;font-size:0.8rem;">' +
        '<option value="all">全部类型</option>' +
        '<option value="medical">🏥 陪诊就医</option>' +
        '<option value="digital">📱 数字技能</option>' +
        '<option value="errand">💊 代办事务</option>' +
        '<option value="cleaning">🧹 家政协助</option>' +
        '<option value="company">💬 情感陪伴</option>' +
      '</select>' +
      '<select id="taskSort" onchange="sortTasks(this.value)" style="padding:0.4rem 0.6rem;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.1);color:#fff;font-size:0.8rem;">' +
        '<option value="default">默认排序</option>' +
        '<option value="reward-desc">💰 奖励从高到低</option>' +
        '<option value="reward-asc">💰 奖励从低到高</option>' +
        '<option value="distance-asc">📍 距离从近到远</option>' +
        '<option value="urgency">⚡ 紧急度优先</option>' +
      '</select>';

    var h3 = compStep1.querySelector('h3');
    if (h3 && h3.nextElementSibling) {
      compStep1.insertBefore(controls, h3.nextElementSibling.nextElementSibling);
    } else {
      compStep1.insertBefore(controls, compStep1.firstChild.nextSibling);
    }
  }

  window.filterTasks = function(filterType) {
    currentTaskFilter = filterType;
    generateTaskList();
  };

  window.sortTasks = function(sortType) {
    currentTaskSort = sortType;
    generateTaskList();
  };

  function getFilteredAndSortedTasks() {
    var tasks = taskTemplates.slice();
    // Filter
    if (currentTaskFilter !== 'all') {
      tasks = tasks.filter(function(t) { return t.type === currentTaskFilter; });
    }
    // Sort
    if (currentTaskSort === 'reward-desc') {
      tasks.sort(function(a, b) { return b.hours - a.hours; });
    } else if (currentTaskSort === 'reward-asc') {
      tasks.sort(function(a, b) { return a.hours - b.hours; });
    } else if (currentTaskSort === 'distance-asc') {
      tasks.sort(function(a, b) {
        var da = parseFloat(a.distance) || 99;
        var db = parseFloat(b.distance) || 99;
        return da - db;
      });
    } else if (currentTaskSort === 'urgency') {
      var urgencyOrder = { '高': 0, '中': 1, '低': 2 };
      tasks.sort(function(a, b) {
        return (urgencyOrder[a.urgency] || 3) - (urgencyOrder[b.urgency] || 3);
      });
    }
    return tasks;
  }

  function generateTaskList() {
    var listEl = document.getElementById('taskList');
    if (!listEl) return;
    listEl.innerHTML = '';

    renderTaskControls();

    var tasks = getFilteredAndSortedTasks();

    if (tasks.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;padding:2rem;opacity:0.6;">' +
        '<div style="font-size:2rem;margin-bottom:0.5rem;">🔍</div>' +
        '<div style="font-size:0.9rem;">暂无符合条件的任务</div>' +
        '<div style="font-size:0.75rem;opacity:0.7;margin-top:0.25rem;">试试其他筛选条件</div>' +
      '</div>';
      return;
    }

    // Show up to 5 tasks
    var displayTasks = tasks.slice(0, 5);

    displayTasks.forEach(function(task, idx) {
      var card = document.createElement('div');
      card.className = 'task-card';
      card.onclick = function() { showTaskDetail(task); };

      var urgencyBadge = '';
      if (task.urgency === '高') urgencyBadge = '<span style="background:rgba(232,115,74,0.3);color:#fff;padding:0.1rem 0.4rem;border-radius:4px;font-size:0.65rem;margin-left:0.4rem;">紧急</span>';
      else if (task.urgency === '中') urgencyBadge = '<span style="background:rgba(212,168,67,0.3);color:#fff;padding:0.1rem 0.4rem;border-radius:4px;font-size:0.65rem;margin-left:0.4rem;">一般</span>';

      card.innerHTML =
        '<div class="task-card-header">' +
          '<div class="task-type-tag">' + task.icon + ' ' + task.title + urgencyBadge + '</div>' +
          '<div class="task-card-hours">+' + task.hours + 'h</div>' +
        '</div>' +
        '<div class="task-card-desc">' + task.desc + '</div>' +
        '<div class="task-card-meta">' +
          '<span>👤 ' + task.requester + '</span>' +
          '<span>📍 ' + task.location + ' (' + task.distance + ')</span>' +
          '<span>🕐 ' + task.time + '</span>' +
        '</div>';
      listEl.appendChild(card);
    });

    attachRipples();
    attachCardFeedback();
  }

  function showTaskDetail(task) {
    selectedTask = task;
    document.getElementById('compStep1').style.display = 'none';
    document.getElementById('compStep2').style.display = 'block';

    var detailCard = document.getElementById('taskDetailCard');
    detailCard.innerHTML =
      '<div class="task-detail-header">' +
        '<div class="task-detail-icon">' + task.icon + '</div>' +
        '<div class="task-detail-info">' +
          '<h4>' + task.title + '</h4>' +
          '<p>发布者：' + task.requester + ' · ' + task.location + '</p>' +
        '</div>' +
        '<div class="task-detail-hours">+' + task.hours + 'h</div>' +
      '</div>' +
      '<div class="task-detail-body">' +
        '<p><strong>需求描述：</strong>' + task.desc + '</p>' +
        '<p><strong>期望时间：</strong>' + task.time + '</p>' +
        '<p><strong>距离：</strong>' + task.distance + '</p>' +
        '<p><strong>紧急程度：</strong>' + task.urgency + '</p>' +
        '<p><strong>善意时长奖励：</strong>+' + task.hours + ' 小时</p>' +
      '</div>';
  }

  window.backToTaskList = function() {
    selectedTask = null;
    document.getElementById('compStep1').style.display = 'block';
    document.getElementById('compStep2').style.display = 'none';
  };

  window.acceptTask = function() {
    if (!selectedTask) return;
    document.getElementById('compStep2').style.display = 'none';
    document.getElementById('compStep3').classList.add('active');
    startCompServiceSimulation();
  };

  function startCompServiceSimulation() {
    serviceSeconds = 0;
    var steps = [
      { icon: '🚶', status: '正在前往服务地点', detail: '请按时到达，提供优质服务', prog: 2 },
      { icon: '🏠', status: '已到达服务地点', detail: '与服务对象确认需求细节', prog: 3 },
      { icon: '⏱️', status: '服务进行中', detail: '请耐心完成服务', prog: 3 },
      { icon: '✅', status: '服务即将完成', detail: '请确认服务结果', prog: 4 }
    ];
    var currentStep = 0;

    function updateStep() {
      if (currentStep >= steps.length) {
        completeCompService();
        return;
      }
      var step = steps[currentStep];
      document.getElementById('compServiceIcon').textContent = step.icon;
      document.getElementById('compServiceStatus').textContent = step.status;
      document.getElementById('compServiceDetail').textContent = step.detail;

      for (var i = 1; i <= 4; i++) {
        var el = document.getElementById('compProg' + i);
        el.classList.remove('done', 'active');
        if (i < step.prog) el.classList.add('done');
        else if (i === step.prog) el.classList.add('active');
      }

      currentStep++;
      setTimeout(updateStep, 3000 + Math.random() * 2000);
    }

    serviceTimerInterval = setInterval(function() {
      serviceSeconds++;
      var m = Math.floor(serviceSeconds / 60).toString().padStart(2, '0');
      var s = (serviceSeconds % 60).toString().padStart(2, '0');
      document.getElementById('compServiceTimer').textContent = m + ':' + s;
    }, 1000);

    updateStep();
  }

  function completeCompService() {
    clearInterval(serviceTimerInterval);
    serviceTimerInterval = null;
    document.getElementById('compStep3').classList.remove('active');
    document.getElementById('compStep4').classList.add('active');

    var hours = selectedTask.hours;
    document.getElementById('compHoursEarned').textContent = '+' + hours + 'h';

    // Add to account
    if (currentAccount) {
      currentAccount.balance += hours;
      addAccountRecord(selectedTask.title, '帮助' + selectedTask.requester + '完成服务 · 刚刚', hours, selectedTask.icon);
      updateAccountBar();
    }

    // Add to live feed
    var now = new Date();
    var timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    addFeedItem(currentAccount ? currentAccount.name : '志愿者', '完成了' + selectedTask.title, '+' + hours + 'h', selectedTask.icon, timeStr);

    // Update demo section metrics
    var servicesEl = document.getElementById('metricServices');
    var hoursEl = document.getElementById('metricHours');
    if (servicesEl) {
      var currentServices = parseInt(servicesEl.textContent.replace(/,/g, '')) || 8456;
      servicesEl.textContent = (currentServices + 1).toLocaleString();
    }
    if (hoursEl) {
      var currentTotalHours = parseInt(hoursEl.textContent.replace(/,/g, '')) || 24350;
      hoursEl.textContent = (currentTotalHours + Math.round(hours)).toLocaleString();
    }

    showToast('任务完成！获得 ' + hours + 'h 善意时长', 'success');
  }

  window.resetCompleter = function() {
    clearInterval(serviceTimerInterval);
    serviceTimerInterval = null;
    serviceSeconds = 0;
    selectedTask = null;

    document.getElementById('compStep1').style.display = 'block';
    document.getElementById('compStep2').style.display = 'none';
    document.getElementById('compStep3').classList.remove('active');
    document.getElementById('compStep4').classList.remove('active');
    document.getElementById('compServiceTimer').textContent = '00:00';

    for (var i = 1; i <= 4; i++) {
      var el = document.getElementById('compProg' + i);
      el.classList.remove('done', 'active');
      if (i === 1) el.classList.add('done');
      else if (i === 2) el.classList.add('active');
    }

    generateTaskList();
  };

  // ==================== CHART: Monthly Trend ====================
  var trendEl = document.getElementById('chart-trend');
  if (trendEl && typeof echarts !== 'undefined') {
    var chartTrend = echarts.init(trendEl, null, { renderer: 'svg' });
    chartTrend.setOption({
      animation: false,
      tooltip: { trigger: 'axis', appendToBody: true, backgroundColor: '#fff', borderColor: rule, textStyle: { color: ink, fontSize: 13 } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted, fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } },
        axisLabel: { color: muted, fontSize: 12 }
      },
      series: [
        {
          name: '服务次数',
          type: 'bar',
          data: [320, 450, 580, 720, 890, 1050, 1180, 1350, 1520, 1680, 1890, 2100],
          itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] },
          barWidth: '50%'
        },
        {
          name: '善意时长(h)',
          type: 'line',
          data: [480, 680, 870, 1080, 1340, 1580, 1770, 2030, 2280, 2520, 2840, 3150],
          smooth: true,
          lineStyle: { color: gold, width: 3 },
          itemStyle: { color: gold },
          symbol: 'circle',
          symbolSize: 6,
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: gold + '30' },
                { offset: 1, color: gold + '05' }
              ]
            }
          }
        }
      ]
    });
    window.addEventListener('resize', function() { chartTrend.resize(); });
  }

  // ==================== CHART: Service Type Pie ====================
  var pieEl = document.getElementById('chart-pie');
  if (pieEl && typeof echarts !== 'undefined') {
    var chartPie = echarts.init(pieEl, null, { renderer: 'svg' });
    chartPie.setOption({
      animation: false,
      tooltip: { trigger: 'item', appendToBody: true, backgroundColor: '#fff', borderColor: rule, textStyle: { color: ink, fontSize: 13 } },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: { color: muted, fontSize: 13 }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.15)' }
        },
        labelLine: { show: false },
        data: [
          { value: 2850, name: '陪诊就医', itemStyle: { color: accent } },
          { value: 1920, name: '代办事务', itemStyle: { color: accent2 } },
          { value: 1560, name: '数字技能指导', itemStyle: { color: gold } },
          { value: 1280, name: '情感陪伴', itemStyle: { color: accent + '99' } },
          { value: 846, name: '家政协助', itemStyle: { color: accent2 + '99' } }
        ]
      }]
    });
    window.addEventListener('resize', function() { chartPie.resize(); });
  }

  // ==================== CHART: Community Network Graph ====================
  var networkEl = document.getElementById('chart-network');
  if (networkEl && typeof echarts !== 'undefined') {
    var chartNetwork = echarts.init(networkEl, null, { renderer: 'svg' });

    var categories = [
      { name: '老年人', itemStyle: { color: accent } },
      { name: '志愿者', itemStyle: { color: accent2 } },
      { name: '残障人士', itemStyle: { color: gold } },
      { name: '公益组织', itemStyle: { color: accent + '66' } }
    ];

    var nodes = [
      { name: '张阿姨', category: 0, symbolSize: 35, value: 127.5 },
      { name: '李大爷', category: 0, symbolSize: 28, value: 45 },
      { name: '王奶奶', category: 0, symbolSize: 25, value: 32 },
      { name: '赵叔叔', category: 0, symbolSize: 22, value: 18 },
      { name: '陈奶奶', category: 0, symbolSize: 20, value: 15 },
      { name: '大学生小李', category: 1, symbolSize: 30, value: 86 },
      { name: '志愿者小刘', category: 1, symbolSize: 26, value: 64 },
      { name: '志愿者小陈', category: 1, symbolSize: 24, value: 52 },
      { name: '学生小王', category: 1, symbolSize: 22, value: 38 },
      { name: '居民小赵', category: 1, symbolSize: 20, value: 25 },
      { name: '刘阿姨(轮椅)', category: 2, symbolSize: 24, value: 28 },
      { name: '老孙(视障)', category: 2, symbolSize: 22, value: 20 },
      { name: '阳光公益', category: 3, symbolSize: 32, value: 200 },
      { name: '社区服务中心', category: 3, symbolSize: 28, value: 150 }
    ];

    var links = [
      { source: '张阿姨', target: '大学生小李', lineStyle: { width: 3, color: accent + '80' } },
      { source: '张阿姨', target: '王奶奶', lineStyle: { width: 2, color: gold + '80' } },
      { source: '张阿姨', target: '赵叔叔', lineStyle: { width: 1.5, color: gold + '60' } },
      { source: '张阿姨', target: '阳光公益', lineStyle: { width: 2, color: accent + '60' } },
      { source: '李大爷', target: '志愿者小刘', lineStyle: { width: 2.5, color: accent2 + '80' } },
      { source: '李大爷', target: '社区服务中心', lineStyle: { width: 1.5, color: accent + '60' } },
      { source: '王奶奶', target: '志愿者小陈', lineStyle: { width: 2, color: accent2 + '80' } },
      { source: '王奶奶', target: '张阿姨', lineStyle: { width: 2, color: gold + '80' } },
      { source: '赵叔叔', target: '学生小王', lineStyle: { width: 1.5, color: accent2 + '60' } },
      { source: '陈奶奶', target: '居民小赵', lineStyle: { width: 2, color: accent2 + '80' } },
      { source: '陈奶奶', target: '大学生小李', lineStyle: { width: 1.5, color: accent2 + '60' } },
      { source: '大学生小李', target: '刘阿姨(轮椅)', lineStyle: { width: 2, color: accent2 + '80' } },
      { source: '大学生小李', target: '阳光公益', lineStyle: { width: 2, color: accent + '60' } },
      { source: '志愿者小刘', target: '老孙(视障)', lineStyle: { width: 2, color: accent2 + '80' } },
      { source: '志愿者小刘', target: '社区服务中心', lineStyle: { width: 1.5, color: accent + '60' } },
      { source: '志愿者小陈', target: '刘阿姨(轮椅)', lineStyle: { width: 1.5, color: accent2 + '60' } },
      { source: '学生小王', target: '阳光公益', lineStyle: { width: 1.5, color: accent + '60' } },
      { source: '居民小赵', target: '社区服务中心', lineStyle: { width: 1.5, color: accent + '60' } },
      { source: '阳光公益', target: '社区服务中心', lineStyle: { width: 3, color: accent + '80' } }
    ];

    chartNetwork.setOption({
      animation: false,
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        backgroundColor: '#fff',
        borderColor: rule,
        textStyle: { color: ink, fontSize: 13 },
        formatter: function(params) {
          if (params.dataType === 'node') {
            var cat = categories[params.data.category].name;
            return '<strong>' + params.name + '</strong><br/>类型：' + cat + '<br/>善意时长：' + params.data.value + 'h';
          }
          if (params.dataType === 'edge') {
            return params.data.source + ' ↔ ' + params.data.target;
          }
          return params.name;
        }
      },
      legend: {
        data: categories.map(function(c) { return c.name; }),
        bottom: 10,
        textStyle: { color: muted, fontSize: 13 }
      },
      series: [{
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: links,
        categories: categories,
        roam: true,
        draggable: true,
        force: {
          repulsion: 280,
          gravity: 0.1,
          edgeLength: [100, 200],
          friction: 0.6
        },
        label: {
          show: true,
          position: 'bottom',
          fontSize: 11,
          color: ink,
          formatter: function(params) {
            if (params.data.symbolSize >= 28) return params.name;
            return '';
          }
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 4 }
        },
        lineStyle: {
          curveness: 0.15,
          opacity: 0.7
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2
        }
      }]
    });
    window.addEventListener('resize', function() { chartNetwork.resize(); });
  }

  // ==================== INIT ====================
  // Attach ripple and card feedback to existing elements
  attachRipples();
  attachCardFeedback();

  // Expose contribution stats function globally
  window.getContributionStats = getContributionStats;
})();
