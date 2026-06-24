// 服务中心模块
window.CommunityAidDashboard = (function() {
  function init() {
    const navCenterBtn = document.getElementById('nav-center-btn');
    const serviceModal = document.getElementById('service-modal');

    if (navCenterBtn) navCenterBtn.addEventListener('click', openServiceCenter);

    if (serviceModal) {
      const closeBtn = serviceModal.querySelector('.modal-close');
      if (closeBtn) closeBtn.addEventListener('click', closeServiceCenter);

      serviceModal.addEventListener('click', function(e) {
        if (e.target === serviceModal) closeServiceCenter();
      });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const modal = document.getElementById('service-modal');
        if (modal && modal.classList.contains('show')) {
          closeServiceCenter();
        }
      }
    });

    // 监听数据变更事件
    document.addEventListener('volunteer:registered', function() {
      const modal = document.getElementById('service-modal');
      if (modal && modal.classList.contains('show')) {
        loadData();
      }
    });

    document.addEventListener('help:published', function() {
      const modal = document.getElementById('service-modal');
      if (modal && modal.classList.contains('show')) {
        loadData();
      }
    });
  }

  function openServiceCenter() {
    if (!CommunityAidData.isLoggedIn()) {
      CommunityAidUI.showToast('请先登录后再打开服务中心');
      CommunityAidUI.openModal('login-modal');
      return;
    }
    loadData();
    CommunityAidUI.openModal('service-modal');
  }

  function closeServiceCenter() {
    CommunityAidUI.closeModal('service-modal');
  }

  function loadData() {
    const volunteers = CommunityAidData.getVolunteers();
    const needs = CommunityAidData.getNeeds();
    updateStats(volunteers, needs);
    renderHeatmap(needs, volunteers);
    renderMyContent();
    renderNeeds(needs);
    renderMyAccepted(needs);
    renderVolunteers(volunteers);
  }

  function updateStats(volunteers, needs) {
    const pendingCount = needs.filter(function(n) { return n.status === 'pending'; }).length;
    const acceptedCount = needs.filter(function(n) { return n.status === 'accepted'; }).length;
    const completedCount = needs.filter(function(n) { return n.status === 'completed'; }).length;

    const statVolunteers = document.getElementById('stat-volunteers');
    const statPending = document.getElementById('stat-pending');
    const statCompleted = document.getElementById('stat-completed');

    if (statVolunteers) statVolunteers.textContent = volunteers.length;
    if (statPending) statPending.textContent = pendingCount;
    if (statCompleted) statCompleted.textContent = completedCount + acceptedCount;
  }

  function renderMyContent() {
    const container = document.getElementById('my-content-list');
    if (!container) return;

    const user = CommunityAidData.getUser();
    if (!user) {
      container.innerHTML = '<div class="no-data">请先登录</div>';
      return;
    }

    const myVolunteers = CommunityAidData.getMyVolunteers(user.username);
    const myNeeds = CommunityAidData.getMyNeeds(user.username);

    if (myVolunteers.length === 0 && myNeeds.length === 0) {
      container.innerHTML = '<div class="no-data">暂无发布内容，去成为志愿者或发布求助吧</div>';
      return;
    }

    container.innerHTML = '';

    // 渲染我的志愿者注册
    myVolunteers.forEach(function(v) {
      const item = document.createElement('div');
      item.className = 'my-content-item';
      item.innerHTML =
        '<span class="my-content-type type-volunteer">志愿者</span>' +
        '<div class="my-content-detail">' +
          '<span class="my-content-name">' + CommunityAidUI.escapeHtml(v.name) + '</span>' +
          '<span class="my-content-skill">' + CommunityAidUI.escapeHtml(v.skill) + '</span>' +
        '</div>' +
        '<span class="my-content-time">服务时长: ' + (v.hours || 0) + '小时</span>';
      container.appendChild(item);
    });

    // 渲染我的求助发布
    myNeeds.forEach(function(n) {
      var statusMap = { pending: ['待接单', 'status-pending'], accepted: ['已接单', 'status-accepted'], completed: ['已完成', 'status-completed'] };
      var statusInfo = statusMap[n.status] || [n.status, 'status-accepted'];
      var statusText = statusInfo[0];
      var statusClass = statusInfo[1];
      var item = document.createElement('div');
      item.className = 'my-content-item';
      item.innerHTML =
        '<span class="my-content-type type-help">求助</span>' +
        '<div class="my-content-detail">' +
          '<span class="my-content-name">' + CommunityAidUI.escapeHtml(n.type) + '</span>' +
          '<span class="my-content-desc">' + CommunityAidUI.escapeHtml(n.description) + '</span>' +
        '</div>' +
        '<span class="my-content-status ' + statusClass + '">' + statusText + '</span>' +
        '<span class="my-content-time">' + CommunityAidUI.escapeHtml(n.time) + '</span>';
      container.appendChild(item);
    });
  }

  // 计算用户技能与需求类型的匹配度
  // 返回 { score: 1-3, label: '高度匹配'/'可能匹配'/'通用需求' }
  function getMatchLevel(needType) {
    const user = CommunityAidData.getUser();
    if (!user) return { score: 1, label: '通用需求' };
    const myVolunteers = CommunityAidData.getMyVolunteers(user.username);
    if (myVolunteers.length === 0) return { score: 1, label: '通用需求' };
    const mySkills = myVolunteers.map(function(v) { return v.skill; });
    if (mySkills.indexOf(needType) !== -1) return { score: 3, label: '高度匹配' };
    // 关联匹配：部分类型相关
    const relatedMap = {
      '水电维修': ['家政服务', '代购跑腿'],
      '家政服务': ['水电维修', '代购跑腿', '医疗陪护'],
      '电脑维修': ['电脑维修'],
      '家教辅导': ['心理咨询'],
      '心理咨询': ['家教辅导', '医疗陪护'],
      '医疗陪护': ['家政服务', '心理咨询'],
      '法律咨询': [],
      '代购跑腿': ['家政服务'],
      '烹饪': ['家政服务'],
      '理发': ['家政服务']
    };
    for (let i = 0; i < mySkills.length; i++) {
      const related = relatedMap[mySkills[i]] || [];
      if (related.indexOf(needType) !== -1) return { score: 2, label: '可能匹配' };
    }
    return { score: 1, label: '通用需求' };
  }

  function renderNeeds(needs) {
    const needsList = document.getElementById('needs-list');
    if (!needsList) return;

    const pendingNeeds = needs.filter(function(n) { return n.status === 'pending'; });

    if (pendingNeeds.length === 0) {
      needsList.innerHTML = '<div class="no-data">暂无待接需求</div>';
      return;
    }

    // 按匹配度降序
    pendingNeeds.sort(function(a, b) {
      return getMatchLevel(b.type).score - getMatchLevel(a.type).score;
    });

    needsList.innerHTML = '';
    pendingNeeds.forEach(function(need) {
      const match = getMatchLevel(need.type);
      const stars = '★'.repeat(match.score) + '☆'.repeat(3 - match.score);
      const matchClass = match.score === 3 ? 'match-high' : (match.score === 2 ? 'match-mid' : 'match-low');
      const item = document.createElement('div');
      item.className = 'need-item';
      item.innerHTML =
        '<span class="match-badge ' + matchClass + '" title="' + match.label + '">' + stars + ' ' + match.label + '</span>' +
        '<span class="need-type">' + CommunityAidUI.escapeHtml(need.type) + '</span>' +
        '<div class="need-desc">' + CommunityAidUI.escapeHtml(need.description) + '</div>' +
        '<div class="need-time">' + CommunityAidUI.escapeHtml(need.time) + '</div>' +
        '<button class="accept-btn" data-id="' + need.id + '">接单</button>';
      needsList.appendChild(item);
    });

    // 绑定接单按钮事件
    const acceptBtns = needsList.querySelectorAll('.accept-btn');
    acceptBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        const id = parseInt(this.getAttribute('data-id'), 10);
        handleAccept(id);
      });
    });
  }

  // 渲染"我的求助（已接单/可评价）"
  function renderMyAccepted(needs) {
    const container = document.getElementById('my-accepted-list');
    if (!container) return;
    const user = CommunityAidData.getUser();
    if (!user) {
      container.innerHTML = '';
      return;
    }
    const myNeeds = needs.filter(function(n) {
      return n.createdBy === user.username && n.status === 'accepted';
    });
    if (myNeeds.length === 0) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = '<h3 style="margin-top:20px;">我发布的求助（进行中）</h3>';
    const list = document.createElement('div');
    list.className = 'my-accepted-list-inner';
    myNeeds.forEach(function(n) {
      const item = document.createElement('div');
      item.className = 'my-content-item';
      const hasRated = n.rating && n.rating > 0;
      item.innerHTML =
        '<span class="my-content-type type-help">求助</span>' +
        '<div class="my-content-detail">' +
          '<span class="my-content-name">' + CommunityAidUI.escapeHtml(n.type) + '</span>' +
          '<span class="my-content-desc">' + CommunityAidUI.escapeHtml(n.description) + '</span>' +
        '</div>' +
        '<button class="rate-btn" data-id="' + n.id + '" ' + (hasRated ? 'disabled' : '') + '>' + (hasRated ? '已评价 ' + n.rating + '★' : '评价志愿者') + '</button>';
      list.appendChild(item);
    });
    container.appendChild(list);
    // 绑定评价按钮
    list.querySelectorAll('.rate-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const id = parseInt(this.getAttribute('data-id'), 10);
        openRatingModal(id, needs);
      });
    });
  }

  // 打开评价弹窗
  function openRatingModal(needId, needs) {
    const need = needs.find(function(n) { return n.id === needId; });
    if (!need) return;
    let modal = document.getElementById('rating-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'rating-modal';
      modal.className = 'modal';
      modal.innerHTML =
        '<div class="modal-content" style="max-width:420px;">' +
          '<button class="modal-close" data-modal="rating-modal">×</button>' +
          '<h2>为志愿者打分</h2>' +
          '<p class="modal-desc" id="rating-need-info"></p>' +
          '<div class="rating-stars" id="rating-stars">' +
            '<span data-score="1">★</span>' +
            '<span data-score="2">★</span>' +
            '<span data-score="3">★</span>' +
            '<span data-score="4">★</span>' +
            '<span data-score="5">★</span>' +
          '</div>' +
          '<textarea id="rating-comment" placeholder="可选：写下您的评价（10-100字）" rows="3" maxlength="100" style="width:100%;padding:10px;border-radius:8px;border:1px solid #ddd;margin-top:12px;font-size:14px;font-family:inherit;resize:vertical;"></textarea>' +
          '<button id="rating-submit" class="btn btn-primary btn-block" style="margin-top:14px;">提交评价</button>' +
        '</div>';
      document.body.appendChild(modal);
      // 绑定关闭
      modal.querySelector('.modal-close').addEventListener('click', function() {
        CommunityAidUI.closeModal('rating-modal');
      });
      modal.addEventListener('click', function(e) {
        if (e.target === modal) CommunityAidUI.closeModal('rating-modal');
      });
      // 星星交互
      let currentScore = 0;
      const starEls = modal.querySelectorAll('#rating-stars span');
      starEls.forEach(function(s) {
        s.addEventListener('click', function() {
          const score = parseInt(this.getAttribute('data-score'), 10);
          modal.setAttribute('data-current-score', score);
          starEls.forEach(function(el, idx) {
            el.classList.toggle('active', idx < score);
          });
        });
        s.addEventListener('mouseenter', function() {
          const hoverScore = parseInt(this.getAttribute('data-score'), 10);
          starEls.forEach(function(el, idx) {
            el.classList.toggle('hover', idx < hoverScore);
          });
        });
        s.addEventListener('mouseleave', function() {
          starEls.forEach(function(el) { el.classList.remove('hover'); });
        });
      });
      // 提交评价
      modal.querySelector('#rating-submit').addEventListener('click', function() {
        const score = parseInt(modal.getAttribute('data-current-score'), 10) || 0;
        if (score === 0) {
          CommunityAidUI.showToast('请先选择评分');
          return;
        }
        const comment = modal.querySelector('#rating-comment').value.trim();
        const success = CommunityAidData.rateNeed(parseInt(modal.getAttribute('data-need-id'), 10), score, comment);
        if (success) {
          CommunityAidUI.showToast('感谢您的评价！');
          CommunityAidUI.closeModal('rating-modal');
          loadData();
        }
      });
    }
    // 填充信息
    const info = modal.querySelector('#rating-need-info');
    if (info) info.textContent = need.type + ' · ' + need.description;
    // 重置状态
    modal.setAttribute('data-need-id', needId);
    modal.setAttribute('data-current-score', '0');
    modal.querySelectorAll('#rating-stars span').forEach(function(el) { el.classList.remove('active', 'hover'); });
    modal.querySelector('#rating-comment').value = '';
    CommunityAidUI.openModal('rating-modal');
  }

  // 社区服务热度图
  function renderHeatmap(needs, volunteers) {
    const grid = document.getElementById('heatmap-grid');
    if (!grid) return;
    const types = ['水电维修', '家教辅导', '心理咨询', '家政服务', '医疗陪护', '法律咨询', '电脑维修', '代购跑腿'];
    // 统计每个类型的志愿者数和需求数
    const stats = types.map(function(t) {
      const vCount = volunteers.filter(function(v) { return v.skill === t; }).length;
      const nCount = needs.filter(function(n) { return n.type === t && n.status === 'pending'; }).length;
      return { type: t, volunteers: vCount, needs: nCount, total: vCount + nCount };
    });
    const maxTotal = Math.max.apply(null, stats.map(function(s) { return s.total; })) || 1;
    grid.innerHTML = '';
    stats.forEach(function(s) {
      const ratio = s.total / maxTotal;
      const intensity = Math.min(1, ratio + 0.15); // 至少有点颜色
      const hue = 30 + (1 - ratio) * 20;
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      cell.style.background = 'hsla(' + hue + ', 80%, ' + (88 - intensity * 30) + '%, 1)';
      cell.innerHTML =
        '<div class="heatmap-type">' + s.type + '</div>' +
        '<div class="heatmap-count">志愿 ' + s.volunteers + ' · 需求 ' + s.needs + '</div>';
      cell.title = s.type + '\n志愿者：' + s.volunteers + ' 位\n待接需求：' + s.needs + ' 条';
      grid.appendChild(cell);
    });
  }

  function renderVolunteers(volunteers) {
    const volunteersGrid = document.getElementById('volunteers-grid');
    if (!volunteersGrid) return;

    if (volunteers.length === 0) {
      volunteersGrid.innerHTML = '<div class="no-data">暂无志愿者</div>';
      return;
    }

    volunteersGrid.innerHTML = '';
    volunteers.forEach(function(v) {
      const stars = CommunityAidUI.getStarRating(v.hours || 0);
      const starStr = '★'.repeat(stars) + '☆'.repeat(5 - stars);
      const colors = CommunityAidUI.generateAvatarColor(v.name);
      const firstChar = v.name ? v.name.charAt(0) : '?';

      const card = document.createElement('div');
      card.className = 'volunteer-card';
      card.innerHTML =
        '<div class="volunteer-avatar" style="background: linear-gradient(135deg, ' + colors[0] + ', ' + colors[1] + ')">' + CommunityAidUI.escapeHtml(firstChar) + '</div>' +
        '<div class="volunteer-name">' + CommunityAidUI.escapeHtml(v.name) + '</div>' +
        '<div class="volunteer-skill">' + CommunityAidUI.escapeHtml(v.skill) + '</div>' +
        '<div class="volunteer-hours">服务时长: ' + (v.hours || 0) + '小时</div>' +
        '<div class="volunteer-stars">' + starStr + '</div>';
      volunteersGrid.appendChild(card);
    });
  }

  function handleAccept(id) {
    const success = CommunityAidData.acceptNeed(id);
    if (success) {
      CommunityAidUI.showToast('接单成功！');
      loadData();
    } else {
      CommunityAidUI.showToast('该需求已被接单');
    }
  }

  return {
    init: init,
    openServiceCenter: openServiceCenter,
    closeServiceCenter: closeServiceCenter,
    loadData: loadData,
    renderMyContent: renderMyContent,
    updateStats: updateStats,
    renderNeeds: renderNeeds,
    renderVolunteers: renderVolunteers,
    handleAccept: handleAccept
  };
})();
