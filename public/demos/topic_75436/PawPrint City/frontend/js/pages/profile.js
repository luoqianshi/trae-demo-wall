// 爪印城市 - 个人中心页
Router.register('profile', () => {
  const auth = getAuth();
  const isLoggedIn = auth != null;
  const displayName = auth ? auth.username : '爪印宠主';
  const displayId = auth ? `ID: ${auth.userId}` : 'ID: pawprint_demo_001';
  const displayAvatar = auth ? auth.avatar : '🐾';

  // 头像显示：如果是图片URL则显示img，否则显示emoji
  const avatarHtml = displayAvatar && displayAvatar.startsWith('data:image')
    ? `<img src="${displayAvatar}" alt="头像" class="avatar-image" />`
    : displayAvatar;

  // 获取用户统计数据
  const stats = getUserStats();

  return `
    <div class="profile-page">
      <!-- 顶部用户信息区 -->
      <div class="profile-header">
        <div class="profile-avatar-wrapper">
          <div class="profile-avatar breathing">${avatarHtml}</div>
          <div class="profile-level-badge">Lv.${stats.level}</div>
        </div>
        <div class="profile-user-info">
          <div class="profile-nickname">${displayName}</div>
          <div class="profile-id">${displayId}</div>
          <div class="profile-badges">
            ${stats.badges.map(b => `<span class="badge-item" title="${b.name}">${b.icon}</span>`).join('')}
          </div>
        </div>
        <div class="profile-actions">
          ${isLoggedIn ? '' : `<span class="profile-action-btn primary" onclick="Router.navigate('login')">登录/注册</span>`}
        </div>
      </div>

      <!-- 数据统计卡片 -->
      <div class="stats-card">
        <div class="stats-row">
          <div class="stat-item" onclick="Router.navigate('sub_favorites')">
            <div class="stat-value animate-number" data-value="${stats.favorites}">${stats.favorites}</div>
            <div class="stat-label">收藏</div>
          </div>
          <div class="stat-item" onclick="Router.navigate('sub_verifies')">
            <div class="stat-value animate-number" data-value="${stats.verifies}">${stats.verifies}</div>
            <div class="stat-label">验证</div>
          </div>
          <div class="stat-item" onclick="Router.navigate('sub_applies')">
            <div class="stat-value animate-number" data-value="${stats.applies}">${stats.applies}</div>
            <div class="stat-label">申请</div>
          </div>
          <div class="stat-item">
            <div class="stat-value animate-number" data-value="${stats.days}">${stats.days}</div>
            <div class="stat-label">天数</div>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${stats.progress}%"></div>
        </div>
        <div class="progress-text">
          <span>贡献值 ${stats.points}</span>
          <span>距离Lv.${stats.level + 1}还需 ${stats.needPoints} 点</span>
        </div>
      </div>

      <!-- 浏览历史 -->
      <div class="history-section">
        <div class="section-header">
          <span class="section-title">🦶 浏览足迹</span>
          <span class="section-action" onclick="Router.navigate('history')">查看全部</span>
        </div>
        <div class="history-list" id="history-preview">
          <div class="history-loading">加载中...</div>
        </div>
      </div>

      <!-- 功能菜单 -->
      <div class="profile-menu">
        <div class="profile-menu-item" onclick="Router.navigate('pet_profile')">
          <div class="menu-icon pet">🐕</div>
          <div class="menu-info">
            <div class="menu-name">宠物档案</div>
            <div class="menu-desc">管理您的宠物信息</div>
          </div>
          <div class="menu-arrow">›</div>
        </div>
        <div class="profile-menu-item" onclick="Router.navigate('sub_favorites')">
          <div class="menu-icon fav">🧡</div>
          <div class="menu-info">
            <div class="menu-name">我的收藏</div>
            <div class="menu-desc">查看已收藏的宠物友好场所</div>
          </div>
          <div class="menu-arrow">›</div>
        </div>
        <div class="profile-menu-item" onclick="Router.navigate('sub_verifies')">
          <div class="menu-icon verify">✅</div>
          <div class="menu-info">
            <div class="menu-name">我的验证</div>
            <div class="menu-desc">查看实地验证记录</div>
          </div>
          <div class="menu-arrow">›</div>
        </div>
        <div class="profile-menu-item" onclick="Router.navigate('sub_applies')">
          <div class="menu-icon apply">📋</div>
          <div class="menu-info">
            <div class="menu-name">我提交的商家</div>
            <div class="menu-desc">查看商家入驻申请进度</div>
          </div>
          <div class="menu-arrow">›</div>
        </div>
        <div class="profile-menu-item" onclick="Router.navigate('settings')">
          <div class="menu-icon settings">⚙️</div>
          <div class="menu-info">
            <div class="menu-name">设置</div>
            <div class="menu-desc">账号、隐私与通知设置</div>
          </div>
          <div class="menu-arrow">›</div>
        </div>
      </div>
    </div>
  `;
});

async function init_profile() {
  // 刷新用户统计数据
  const auth = getAuth();
  if (auth && auth.userId) {
    await refreshUserStats(auth.userId);
    // 重新渲染统计数字
    renderProfileStats();
  }

  // 数字跳动动画
  animateNumbers();

  // 加载浏览历史
  await loadHistoryPreview();
}

// 重新渲染个人中心统计数据
function renderProfileStats() {
  const stats = getUserStats();
  document.querySelectorAll('.animate-number').forEach(el => {
    const key = el.parentElement.querySelector('.stat-label')?.textContent;
    if (key === '收藏') el.dataset.value = stats.favorites;
    if (key === '验证') el.dataset.value = stats.verifies;
    if (key === '申请') el.dataset.value = stats.applies;
    if (key === '天数') el.dataset.value = stats.days;
    el.textContent = el.dataset.value;
  });
}

// 刷新用户统计数据（从后端获取最新收藏、验证、申请数量）
async function refreshUserStats(userId) {
  try {
    const [favRes, verifyRes, applyRes] = await Promise.all([
      api.getFavorites(userId),
      api.getUserVerifies(userId),
      api.getUserApplies(userId)
    ]);

    const favorites = (favRes.data || []).length;
    const verifies = (verifyRes.data || []).length;
    const applies = (applyRes.data || []).length;

    let stats = getUserStats();
    stats.favorites = favorites;
    stats.verifies = verifies;
    stats.applies = applies;

    localStorage.setItem(`pawprint_stats_${userId}`, JSON.stringify(stats));
  } catch (err) {
    console.error('刷新用户统计失败:', err);
  }
}

// 用户统计数据
function getUserStats() {
  const auth = getAuth();
  const userId = auth ? auth.userId : 'user_demo_001';

  // 从localStorage获取或生成默认数据
  let stats = localStorage.getItem(`pawprint_stats_${userId}`);
  if (stats) {
    return JSON.parse(stats);
  }

  // 默认数据
  const defaultStats = {
    level: 3,
    points: 156,
    favorites: 8,
    verifies: 12,
    applies: 2,
    days: 45,
    progress: 56,
    needPoints: 44,
    badges: [
      { icon: '🌟', name: '早起打卡达人' },
      { icon: '🏆', name: '验证先锋' },
      { icon: '🐾', name: '爪印先锋' }
    ]
  };

  localStorage.setItem(`pawprint_stats_${userId}`, JSON.stringify(defaultStats));
  return defaultStats;
}

// 数字跳动动画
function animateNumbers() {
  const numbers = document.querySelectorAll('.animate-number');
  numbers.forEach(el => {
    const target = parseInt(el.dataset.value);
    let current = 0;
    const duration = 1000;
    const step = target / (duration / 16);

    const animate = () => {
      current += step;
      if (current < target) {
        el.textContent = Math.floor(current);
        requestAnimationFrame(animate);
      } else {
        el.textContent = target;
      }
    };

    // 延迟启动动画
    setTimeout(animate, 300);
  });
}

// 加载浏览历史预览
async function loadHistoryPreview() {
  const container = document.getElementById('history-preview');
  const history = getBrowseHistory().slice(0, 3);

  if (history.length === 0) {
    container.innerHTML = `
      <div class="history-empty">
        <span class="history-empty-icon">🚶</span>
        <span class="history-empty-text">还没有浏览记录</span>
      </div>
    `;
    return;
  }

  // 加载场所详情
  const places = [];
  for (const h of history) {
    const res = await api.getPlaceDetail(h.placeId);
    if (res.data) {
      places.push(res.data);
    }
  }

  const typeIcons = { '餐饮': '🍽️', '住宿': '🏨', '公共空间': '🌳', '商业': '🛍️' };
  const typeColors = { '餐饮': '#FF8C42', '住宿': '#5DADE2', '公共空间': '#86D9C8', '商业': '#A569BD' };

  container.innerHTML = places.map(p => `
    <div class="favorite-card" onclick="Router.navigate('detail', {id:${p.id}})">
      <div class="favorite-icon" style="background:${typeColors[p.type] || '#FF8C42'}20">${typeIcons[p.type] || '🐾'}</div>
      <div class="favorite-info">
        <div class="favorite-name">${p.name}</div>
        <div class="favorite-addr">${p.address}</div>
        <div class="favorite-meta">
          <span>★ ${p.rating}</span>
          <span>${p.verifyCount || 0}人验证</span>
        </div>
      </div>
      <div class="history-time-label">${history.find(h => h.placeId === p.id)?.time || ''}</div>
    </div>
  `).join('');
}

// 获取浏览历史
function getBrowseHistory() {
  const data = localStorage.getItem('pawprint_history');
  return data ? JSON.parse(data) : [];
}

// 保存浏览历史
function saveBrowseHistory(placeId) {
  const history = getBrowseHistory();
  const time = new Date().toLocaleDateString('zh-CN');

  // 移除旧的记录，添加新的
  const idx = history.findIndex(h => h.placeId === placeId);
  if (idx > -1) {
    history.splice(idx, 1);
  }
  history.unshift({ placeId, time });

  // 最多保存20条
  if (history.length > 20) {
    history.pop();
  }

  localStorage.setItem('pawprint_history', JSON.stringify(history));
}

// 浏览历史页面
Router.register('history', () => {
  return `
    <div class="sub-page">
      <div class="nav-header" style="display:flex;align-items:center;gap:8px;">
        <span class="back-btn" onclick="Router.back()">← 返回</span>
        <span class="page-title" style="flex:1;text-align:left;">浏览足迹</span>
        <span class="clear-history-btn" onclick="clearHistory()">清空</span>
      </div>
      <div id="history-list" style="margin-top:12px;">
        <div style="text-align:center;color:var(--text-light);padding:40px;">加载中...</div>
      </div>
    </div>
  `;
});

async function init_history() {
  const container = document.getElementById('history-list');
  const history = getBrowseHistory();

  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🚶</div>
        <p>还没有浏览记录</p>
        <p style="font-size:12px;margin-top:4px;">去首页发现宠物友好的去处吧</p>
      </div>
    `;
    return;
  }

  const places = [];
  for (const h of history) {
    const res = await api.getPlaceDetail(h.placeId);
    if (res.data) {
      places.push({ ...res.data, browseTime: h.time });
    }
  }

  const typeIcons = { '餐饮': '🍽️', '住宿': '🏨', '公共空间': '🌳', '商业': '🛍️' };
  const typeColors = { '餐饮': '#FF8C42', '住宿': '#5DADE2', '公共空间': '#86D9C8', '商业': '#A569BD' };

  container.innerHTML = places.map(p => `
    <div class="favorite-card" onclick="goToDetail(${p.id})">
      <div class="favorite-icon" style="background:${typeColors[p.type] || '#FF8C42'}20">${typeIcons[p.type] || '🐾'}</div>
      <div class="favorite-info">
        <div class="favorite-name">${p.name}</div>
        <div class="favorite-addr">${p.address}</div>
        <div class="favorite-meta">
          <span>★ ${p.rating}</span>
          <span>${p.verifyCount || 0}人验证</span>
        </div>
      </div>
      <div class="history-time-label">${p.browseTime}</div>
    </div>
  `).join('');

  window.goToDetail = function(id) {
    Router.navigate('detail', { id });
  };
}

function clearHistory() {
  Modal.show('清空浏览记录', `
    <div style="text-align:center;padding:20px 0;">
      <div style="font-size:48px;margin-bottom:16px;">🗑️</div>
      <div style="font-size:16px;font-weight:500;margin-bottom:8px;">确定要清空所有浏览记录吗？</div>
      <div style="font-size:13px;color:var(--text-light);">清空后将无法恢复</div>
    </div>
    <div style="display:flex;gap:12px;margin-top:16px;">
      <button class="btn btn-outline btn-block" onclick="Modal.close()">取消</button>
      <button class="btn btn-primary btn-block" style="background:#E74C3C" onclick="confirmClearHistory()">确认清空</button>
    </div>
  `);
}

function confirmClearHistory() {
  localStorage.removeItem('pawprint_history');
  Modal.close();
  showToast('浏览记录已清空');
  Router.navigate('history');
}

function handleLogout() {
  // 显示确认弹窗
  Modal.show('退出登录', `
    <div style="text-align:center;padding:20px 0;">
      <div style="font-size:48px;margin-bottom:16px;">👋</div>
      <div style="font-size:16px;font-weight:500;margin-bottom:8px;">确定要退出登录吗？</div>
      <div style="font-size:13px;color:var(--text-light);">退出后需要重新登录才能查看个人数据</div>
    </div>
    <div style="display:flex;gap:12px;margin-top:16px;">
      <button class="btn btn-outline btn-block" onclick="Modal.close()">取消</button>
      <button class="btn btn-primary btn-block logout-confirm-btn" onclick="confirmLogout()">确认退出</button>
    </div>
  `);
}

function confirmLogout() {
  // 清除所有用户数据
  clearAuth();
  localStorage.removeItem('pawprint_history');
  localStorage.removeItem('pawprint_settings');
  // 清除用户统计数据
  const keys = Object.keys(localStorage).filter(k => k.startsWith('pawprint_stats_'));
  keys.forEach(k => localStorage.removeItem(k));
  
  Modal.close();
  showToast('已退出登录');
  // 刷新页面
  Router.navigate('profile');
}

// ========== 子页面路由 ==========

// 我的收藏页面
Router.register('sub_favorites', () => {
  return `
    <div class="sub-page">
      <div class="nav-header" style="display:flex;align-items:center;gap:8px;">
        <span class="back-btn" onclick="Router.back()">← 返回</span>
        <span class="page-title" style="flex:1;text-align:left;">我的收藏</span>
      </div>
      <div id="favorites-list" style="margin-top:12px;">
        <div style="text-align:center;color:var(--text-light);padding:40px;">加载中...</div>
      </div>
    </div>
  `;
});

async function init_sub_favorites() {
  const container = document.getElementById('favorites-list');
  const res = await api.getFavorites();

  if (!res.data || res.data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🧡</div>
        <p>还没有收藏的场所</p>
        <p style="font-size:12px;margin-top:4px;">去首页发现宠物友好的去处吧</p>
      </div>
    `;
    return;
  }

  const typeIcons = { '餐饮': '🍽️', '住宿': '🏨', '公共空间': '🌳', '商业': '🛍️' };
  const typeColors = { '餐饮': '#FF8C42', '住宿': '#5DADE2', '公共空间': '#86D9C8', '商业': '#A569BD' };

  container.innerHTML = res.data.map(p => `
    <div class="favorite-card" onclick="goToDetail(${p.id})">
      <div class="favorite-icon" style="background:${typeColors[p.type] || '#FF8C42'}20">${typeIcons[p.type] || '🐾'}</div>
      <div class="favorite-info">
        <div class="favorite-name">${p.name}</div>
        <div class="favorite-addr">${p.address}</div>
        <div class="favorite-meta">
          <span>★ ${p.rating}</span>
          <span>${p.verifyCount || 0}人验证</span>
        </div>
      </div>
      <div class="favorite-unfav" onclick="event.stopPropagation();removeFavorite(${p.id})">取消收藏</div>
    </div>
  `).join('');

  window.goToDetail = function(id) {
    Router.navigate('detail', { id });
  };
}

async function removeFavorite(placeId) {
  Modal.show('取消收藏', `
    <div style="text-align:center;padding:20px 0;">
      <div style="font-size:48px;margin-bottom:16px;">💔</div>
      <div style="font-size:16px;font-weight:500;margin-bottom:8px;">确定要取消收藏吗？</div>
      <div style="font-size:13px;color:var(--text-light);">取消后可再次收藏该场所</div>
    </div>
    <div style="display:flex;gap:12px;margin-top:16px;">
      <button class="btn btn-outline btn-block" onclick="Modal.close()">取消</button>
      <button class="btn btn-primary btn-block" style="background:#E74C3C" onclick="confirmRemoveFavorite(${placeId})">确认取消</button>
    </div>
  `);
}

async function confirmRemoveFavorite(placeId) {
  await api.toggleFavorite(placeId, 'remove');
  Modal.close();
  showToast('已取消收藏');
  init_sub_favorites();
}

// 我的验证页面
Router.register('sub_verifies', () => {
  return `
    <div class="sub-page">
      <div class="nav-header" style="display:flex;align-items:center;gap:8px;">
        <span class="back-btn" onclick="Router.back()">← 返回</span>
        <span class="page-title" style="flex:1;text-align:left;">我的验证</span>
      </div>
      <div id="verifies-list" style="margin-top:12px;">
        <div style="text-align:center;color:var(--text-light);padding:40px;">加载中...</div>
      </div>
    </div>
  `;
});

async function init_sub_verifies() {
  const container = document.getElementById('verifies-list');
  const res = await api.getUserVerifies();

  if (!res.data || res.data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✅</div>
        <p>还没有验证记录</p>
        <p style="font-size:12px;margin-top:4px;">去场所详情页提交实地验证吧</p>
      </div>
    `;
    return;
  }

  container.innerHTML = res.data.map(v => `
    <div class="verify-card" onclick="goToDetail(${v.placeId})">
      <div class="verify-header">
        <span class="verify-place">${v.placeName || '场所 #' + v.placeId}</span>
        <span class="verify-time">${v.time}</span>
      </div>
      <div class="verify-content">${v.content}</div>
      <div class="verify-tags">
        ${v.tags ? v.tags.map(t => `<span class="verify-tag">${t}</span>`).join('') : ''}
      </div>
    </div>
  `).join('');

  window.goToDetail = function(id) {
    Router.navigate('detail', { id });
  };
}

// 我提交的商家页面
Router.register('sub_applies', () => {
  return `
    <div class="sub-page">
      <div class="nav-header" style="display:flex;align-items:center;gap:8px;">
        <span class="back-btn" onclick="Router.back()">← 返回</span>
        <span class="page-title" style="flex:1;text-align:left;">我提交的商家</span>
      </div>
      <div id="applies-list" style="margin-top:12px;">
        <div style="text-align:center;color:var(--text-light);padding:40px;">加载中...</div>
      </div>
    </div>
  `;
});

async function init_sub_applies() {
  const container = document.getElementById('applies-list');
  const res = await api.getUserApplies();

  if (!res.data || res.data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>还没有提交商家申请</p>
        <p style="font-size:12px;margin-top:4px;">去发布页提交商家入驻申请吧</p>
      </div>
    `;
    return;
  }

  const statusColors = {
    '审核中': '#F39C12',
    '已通过': '#27AE60',
    '已拒绝': '#E74C3C'
  };
  const statusTexts = {
    '审核中': '审核中',
    '已通过': '已通过',
    '已拒绝': '已拒绝'
  };

  container.innerHTML = res.data.map(a => `
    <div class="apply-card">
      <div class="apply-header">
        <span class="apply-name">${a.name}</span>
        <span class="apply-status" style="background:${statusColors[a.status] || '#F39C12'}20;color:${statusColors[a.status] || '#F39C12'}">${statusTexts[a.status] || '审核中'}</span>
      </div>
      <div class="apply-info">
        <span>${a.type}</span>
        <span>${a.address}</span>
      </div>
      <div class="apply-no">申请单号：${a.applyNo}</div>
      <div class="apply-time">提交时间：${a.submitTime}</div>
    </div>
  `).join('');
}