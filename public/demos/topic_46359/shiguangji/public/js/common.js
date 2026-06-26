/**
 * 食光机 - 共享前端逻辑
 * 导航渲染、认证检查、Toast、确认对话框、日期格式化等
 */

// ===== 常量映射 =====
const MEAL_TYPE_MAP = {
  breakfast: { label: '早餐', icon: '🌅' },
  lunch: { label: '午餐', icon: '☀️' },
  dinner: { label: '晚餐', icon: '🌙' },
  snack: { label: '加餐', icon: '🍪' }
};

const DIFFICULTY_MAP = {
  easy: { label: '简单', color: '#5A8A6E' },
  medium: { label: '中等', color: '#D4653B' },
  hard: { label: '进阶', color: '#C0392B' }
};

// ===== 当前用户缓存 =====
let _currentUser = null;

/**
 * 获取当前登录用户信息（带缓存）
 * @param {boolean} forceRefresh - 是否强制刷新
 * @returns {Promise<object|null>}
 */
async function getCurrentUser(forceRefresh) {
  if (!API.isLoggedIn()) return null;
  if (_currentUser && !forceRefresh) return _currentUser;
  try {
    const res = await API.getMe();
    if (res.success) {
      _currentUser = res.data;
      return _currentUser;
    }
  } catch (err) {
    _currentUser = null;
  }
  return null;
}

/**
 * 渲染导航栏
 * @param {string} currentPage - 当前页面标识: home, timeline, gallery, recommend, community, stats, dashboard, admin
 */
async function renderNav(currentPage) {
  const navEl = document.getElementById('mainNav');
  if (!navEl) return;

  const links = [
    { href: 'index.html', page: 'home', label: '首页' },
    { href: 'timeline.html', page: 'timeline', label: '时光轴' },
    { href: 'gallery.html', page: 'gallery', label: '相册' },
    { href: 'recommend.html', page: 'recommend', label: 'AI推荐' },
    { href: 'community.html', page: 'community', label: '社区' },
    { href: 'stats.html', page: 'stats', label: '数据统计' },
    { href: 'dashboard.html', page: 'dashboard', label: '我的' }
  ];

  let linksHtml = '';
  links.forEach(function (link) {
    const active = link.page === currentPage ? ' active' : '';
    linksHtml += '<li><a href="' + link.href + '" data-page="' + link.page + '" class="' + active.trim() + '">' + link.label + '</a></li>';
  });

  // 用户区域
  let userHtml = '';
  const user = await getCurrentUser();
  if (user) {
    // 已登录："+ 记录美食"按钮跳转到仪表盘
    const addBtnHref = 'dashboard.html';
    userHtml = '<div class="nav-user-area">';
    userHtml += '<span class="nav-username">👤 ' + escapeHtml(user.username) + '</span>';
    if (user.role === 'admin') {
      const adminActive = currentPage === 'admin' ? ' style="background:var(--accent2);color:white;"' : '';
      userHtml += '<a href="admin.html" class="nav-admin-link"' + adminActive + '>管理后台</a>';
    }
    userHtml += '<button class="nav-logout-btn" onclick="logout()">退出</button>';
    userHtml += '</div>';

    navEl.innerHTML =
      '<div class="nav-inner">' +
      '<a href="index.html" class="logo"><span class="logo-icon">🍳</span>食光机</a>' +
      '<div class="nav-right">' +
      '<ul class="nav-links">' + linksHtml + '</ul>' +
      '<a href="' + addBtnHref + '" class="nav-add-btn">+ 记录美食</a>' +
      userHtml +
      '</div>' +
      '</div>';
  } else {
    // 未登录："+ 记录美食"按钮跳转到时光轴添加记录
    userHtml = '<div class="nav-user-area"><a href="login.html" class="nav-login-btn">登录</a></div>';

    navEl.innerHTML =
      '<div class="nav-inner">' +
      '<a href="index.html" class="logo"><span class="logo-icon">🍳</span>食光机</a>' +
      '<div class="nav-right">' +
      '<ul class="nav-links">' + linksHtml + '</ul>' +
      '<a href="timeline.html?action=add" class="nav-add-btn">+ 记录美食</a>' +
      userHtml +
      '</div>' +
      '</div>';
  }
}

/**
 * 检查认证状态，未登录则跳转到 login.html
 * @param {object} options - { allowHome: true } 首页不强制登录
 * @returns {Promise<object|null>} 当前用户信息（已登录时）
 */
async function checkAuth(options) {
  options = options || {};
  if (!API.isLoggedIn()) {
    if (!options.allowHome) {
      window.location.href = 'login.html';
    }
    return null;
  }

  const user = await getCurrentUser();
  if (!user) {
    if (!options.allowHome) {
      window.location.href = 'login.html';
    }
    return null;
  }

  // 如果需要 admin 权限
  if (options.requireAdmin && user.role !== 'admin') {
    showToast('需要管理员权限', 'error');
    setTimeout(function () { window.location.href = 'index.html'; }, 1500);
    return null;
  }

  return user;
}

/**
 * 退出登录
 */
function logout() {
  showConfirm('确定要退出登录吗？', function () {
    API.removeToken();
    _currentUser = null;
    window.location.href = 'index.html';
  });
}

// ===== Toast 通知 =====

/**
 * 显示 Toast 通知
 * @param {string} message - 消息内容
 * @param {string} type - 类型: success, error, warning, info
 * @param {number} duration - 持续时间（毫秒）
 */
function showToast(message, type, duration) {
  type = type || 'success';
  duration = duration || 3000;

  // 移除已有的 toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = '<span class="toast-icon">' + (icons[type] || '✅') + '</span><span>' + escapeHtml(message) + '</span>';

  document.body.appendChild(toast);

  setTimeout(function () { toast.classList.add('show'); }, 10);
  setTimeout(function () {
    toast.classList.remove('show');
    setTimeout(function () { toast.remove(); }, 300);
  }, duration);
}

// ===== 确认对话框 =====

let _confirmCallback = null;

/**
 * 初始化确认对话框（在页面加载时调用一次）
 */
function initConfirmModal() {
  // 如果页面已有确认模态框，直接使用
  let modal = document.getElementById('confirmModal');
  if (!modal) {
    // 动态创建确认模态框
    modal = document.createElement('div');
    modal.className = 'modal confirm-modal';
    modal.id = 'confirmModal';
    modal.innerHTML =
      '<div class="modal-overlay" onclick="closeConfirm()"></div>' +
      '<div class="modal-content">' +
      '<div class="modal-body">' +
      '<div class="confirm-icon">⚠️</div>' +
      '<p id="confirmMessage">确认操作？</p>' +
      '<div class="confirm-actions">' +
      '<button class="btn btn-secondary" onclick="closeConfirm()">取消</button>' +
      '<button class="btn btn-primary" onclick="confirmOk()">确认</button>' +
      '</div>' +
      '</div>' +
      '</div>';
    document.body.appendChild(modal);
  }
}

/**
 * 显示确认对话框
 * @param {string} message - 确认消息
 * @param {function} onConfirm - 确认回调
 */
function showConfirm(message, onConfirm) {
  initConfirmModal();
  const modal = document.getElementById('confirmModal');
  const msgEl = document.getElementById('confirmMessage');
  if (!modal || !msgEl) {
    // 降级为原生 confirm
    if (window.confirm(message)) onConfirm();
    return;
  }

  msgEl.textContent = message;
  _confirmCallback = onConfirm;
  modal.classList.add('show');
}

/** 确认对话框 - 确认按钮 */
function confirmOk() {
  const modal = document.getElementById('confirmModal');
  if (modal) modal.classList.remove('show');
  if (_confirmCallback) {
    const cb = _confirmCallback;
    _confirmCallback = null;
    cb();
  }
}

/** 确认对话框 - 取消 */
function closeConfirm() {
  const modal = document.getElementById('confirmModal');
  if (modal) modal.classList.remove('show');
  _confirmCallback = null;
}

// ===== 日期格式化 =====

/**
 * 格式化日期（相对时间）
 * @param {string} dateStr - 日期字符串
 * @returns {string} 今天/昨天/前天/N天前/YYYY.MM.DD
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((todayStart - dateStart) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays === 2) return '前天';
  if (diffDays > 2 && diffDays < 7) return diffDays + '天前';

  return formatDateFull(dateStr);
}

/**
 * 格式化日期（完整格式）
 * @param {string} dateStr - 日期字符串
 * @returns {string} YYYY.MM.DD
 */
function formatDateFull(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '.' + m + '.' + day;
}

// ===== HTML 转义 =====

/**
 * HTML 转义，防止 XSS
 * @param {string} text - 原始文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// ===== 图片路径处理 =====

/**
 * 获取记录的图片URL
 * @param {object} record - 记录对象
 * @returns {string|null} 图片URL或null（使用emoji）
 */
function getRecordImageUrl(record) {
  if (!record) return null;
  if (record.imagePath) {
    // 如果是完整URL或以/开头的路径，直接使用
    if (record.imagePath.startsWith('http') || record.imagePath.startsWith('/')) {
      return record.imagePath;
    }
    // 否则加上前导/
    return '/' + record.imagePath;
  }
  return null;
}

// ===== 记录详情渲染 =====

/**
 * 渲染记录详情HTML（用于详情模态框）
 * @param {object} record - 记录对象
 * @param {function} onEdit - 编辑回调
 * @param {function} onDelete - 删除回调
 * @returns {string} HTML字符串
 */
function renderRecordDetail(record, onEdit, onDelete) {
  const mealInfo = MEAL_TYPE_MAP[record.mealType] || MEAL_TYPE_MAP.dinner;
  const diffInfo = DIFFICULTY_MAP[record.difficulty] || DIFFICULTY_MAP.easy;
  const imgUrl = getRecordImageUrl(record);

  const imageHtml = imgUrl
    ? '<img src="' + imgUrl + '" alt="' + escapeHtml(record.dishName) + '" class="detail-image">'
    : '<div class="detail-emoji" style="background:linear-gradient(135deg, var(--accent), var(--accent-light));">' + (record.emoji || '🍽️') + '</div>';

  const tagsHtml = (record.tags && record.tags.length > 0)
    ? '<div class="detail-tags">' + record.tags.map(function (t) { return '<span class="tag-chip">' + escapeHtml(t) + '</span>'; }).join('') + '</div>'
    : '';

  const starsHtml = record.rating
    ? '<div class="detail-rating">' + '★'.repeat(record.rating) + '☆'.repeat(5 - record.rating) + '</div>'
    : '';

  const cookTimeHtml = record.cookTime ? '<span class="meta-item">⏱️ ' + record.cookTime + '分钟</span>' : '';
  const caloriesHtml = record.calories ? '<span class="meta-item">🔥 ' + record.calories + '千卡</span>' : '';

  const editBtn = onEdit ? '<button class="btn btn-primary btn-sm" id="detailEditBtn">✏️ 编辑</button>' : '';
  const deleteBtn = onDelete ? '<button class="btn btn-secondary btn-sm" id="detailDeleteBtn">🗑️ 删除</button>' : '';

  return (
    '<div class="detail-modal-content">' +
    imageHtml +
    '<div class="detail-body">' +
    '<h2 class="detail-title">' + escapeHtml(record.dishName) + '</h2>' +
    '<div class="detail-meta">' +
    '<span class="meta-item">📅 ' + formatDateFull(record.date) + '</span>' +
    '<span class="meta-item">' + mealInfo.icon + ' ' + mealInfo.label + '</span>' +
    '<span class="difficulty-badge" style="color:' + diffInfo.color + ';border-color:' + diffInfo.color + '">' + diffInfo.label + '</span>' +
    cookTimeHtml + caloriesHtml +
    '</div>' +
    starsHtml +
    tagsHtml +
    (record.notes ? '<div class="detail-notes"><h4>烹饪笔记</h4><p>' + escapeHtml(record.notes) + '</p></div>' : '') +
    '<div class="detail-actions">' + editBtn + deleteBtn + '</div>' +
    '</div>' +
    '</div>'
  );
}

// ===== 工具函数 =====

/**
 * 防抖函数
 * @param {function} fn - 要防抖的函数
 * @param {number} delay - 延迟毫秒
 * @returns {function} 防抖后的函数
 */
function debounce(fn, delay) {
  let timer;
  return function () {
    const ctx = this;
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
  };
}

/**
 * 获取 URL 查询参数
 * @param {string} key - 参数名
 * @returns {string|null} 参数值
 */
function getQueryParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

/**
 * 创建空状态 HTML
 * @param {string} title - 标题
 * @param {string} desc - 描述
 * @param {string} icon - 图标emoji
 * @returns {string} HTML字符串
 */
function createEmptyState(title, desc, icon) {
  return (
    '<div class="empty-state">' +
    '<div class="empty-icon">' + (icon || '🍽️') + '</div>' +
    '<h3>' + escapeHtml(title) + '</h3>' +
    '<p>' + escapeHtml(desc) + '</p>' +
    '</div>'
  );
}

/**
 * 创建加载状态 HTML
 * @param {string} text - 加载文本
 * @returns {string} HTML字符串
 */
function createLoadingState(text) {
  return (
    '<div class="loading-state">' +
    '<div class="loading-spinner"></div>' +
    '<div class="loading-text">' + escapeHtml(text || '加载中...') + '</div>' +
    '</div>'
  );
}

/**
 * 关闭所有模态框
 */
function closeAllModals() {
  document.querySelectorAll('.modal').forEach(function (m) {
    m.classList.remove('show');
  });
}

// ESC 键关闭模态框
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeAllModals();
});
