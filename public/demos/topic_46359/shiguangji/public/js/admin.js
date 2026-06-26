/**
 * 食光机 - 管理后台逻辑
 */

// ===== 状态管理 =====
let allUsers = [];
let allRecords = [];
let recordFilter = '';

// ===== 初始化 =====
(async function () {
  // 检查管理员权限
  const user = await checkAuth({ requireAdmin: true });
  if (!user) return;

  await renderNav('admin');

  bindEvents();

  // 加载数据
  await loadAdminStats();
  await loadUsers();
  await loadAllRecords();
})();

/**
 * 绑定事件
 */
function bindEvents() {
  // 标签页切换
  document.querySelectorAll('.admin-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.admin-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');

      const target = tab.dataset.tab;
      document.getElementById('panelUsers').style.display = target === 'users' ? '' : 'none';
      document.getElementById('panelRecords').style.display = target === 'records' ? '' : 'none';
    });
  });

  // 刷新用户
  document.getElementById('refreshUsersBtn').addEventListener('click', function () {
    loadUsers();
    loadAdminStats();
  });

  // 搜索记录
  document.getElementById('adminRecordSearch').addEventListener('input', debounce(function (e) {
    recordFilter = e.target.value.trim().toLowerCase();
    renderRecordsTable();
  }, 300));
}

/**
 * 加载管理后台统计数据
 */
async function loadAdminStats() {
  try {
    const res = await API.admin.getStats();
    if (res.success && res.data) {
      const data = res.data;
      const elUserCount = document.getElementById('adminUserCount');
      const elRecordCount = document.getElementById('adminRecordCount');
      const elTagCount = document.getElementById('adminTagCount');
      const elAvgRating = document.getElementById('adminAvgRating');

      if (elUserCount) elUserCount.textContent = data.userCount || 0;
      if (elRecordCount) elRecordCount.textContent = data.recordCount || data.totalRecords || 0;
      if (elTagCount) elTagCount.textContent = data.tagCount ? Object.keys(data.tagCount).length : 0;
      if (elAvgRating) elAvgRating.textContent = data.avgRating || '0.0';
    }
  } catch (err) {
    console.error('加载管理统计失败:', err);
  }
}

/**
 * 加载用户列表
 */
async function loadUsers() {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '<tr><td colspan="5" class="empty-row">加载中...</td></tr>';

  try {
    const res = await API.admin.getUsers();
    if (res.success && res.data) {
      allUsers = res.data;
      renderUsersTable();
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-row">加载失败: ' + escapeHtml(err.message) + '</td></tr>';
  }
}

/**
 * 渲染用户表格
 */
function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');

  if (allUsers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-row">暂无用户</td></tr>';
    return;
  }

  let html = '';
  allUsers.forEach(function (user) {
    const isAdmin = user.role === 'admin';
    const roleBadge = isAdmin
      ? '<span class="role-badge role-admin">管理员</span>'
      : '<span class="role-badge role-user">普通用户</span>';

    const createdAt = user.createdAt ? formatDateFull(user.createdAt) : '-';
    const deleteBtn = !isAdmin
      ? '<button class="btn-icon" onclick="confirmDeleteUser(' + user.id + ')" title="删除用户">🗑️</button>'
      : '<span style="font-size:0.75rem;color:var(--muted);">不可删除</span>';

    html +=
      '<tr>' +
      '<td class="col-id">' + escapeHtml(String(user.id)) + '</td>' +
      '<td class="col-username">' + escapeHtml(user.username) + '</td>' +
      '<td>' + roleBadge + '</td>' +
      '<td>' + createdAt + '</td>' +
      '<td class="action-cell">' + deleteBtn + '</td>' +
      '</tr>';
  });

  tbody.innerHTML = html;
}

/**
 * 确认删除用户
 */
function confirmDeleteUser(id) {
  const user = allUsers.find(function (u) { return u.id == id; });
  if (!user) return;

  showConfirm('确定要删除用户「' + user.username + '」吗？该用户的所有记录也将被删除，此操作不可撤销。', async function () {
    try {
      const res = await API.admin.deleteUser(id);
      if (res.success) {
        showToast('用户已删除', 'success');
        await loadUsers();
        await loadAdminStats();
      } else {
        showToast(res.message || '删除失败', 'error');
      }
    } catch (err) {
      showToast(err.message || '删除失败', 'error');
    }
  });
}

/**
 * 加载所有记录
 */
async function loadAllRecords() {
  const tbody = document.getElementById('recordsTableBody');
  tbody.innerHTML = '<tr><td colspan="8" class="empty-row">加载中...</td></tr>';

  try {
    const res = await API.admin.getRecords();
    if (res.success && res.data) {
      allRecords = res.data;
      renderRecordsTable();
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">加载失败: ' + escapeHtml(err.message) + '</td></tr>';
  }
}

/**
 * 渲染记录表格
 */
function renderRecordsTable() {
  const tbody = document.getElementById('recordsTableBody');

  let records = allRecords;
  if (recordFilter) {
    records = allRecords.filter(function (r) {
      const inName = r.dishName && r.dishName.toLowerCase().includes(recordFilter);
      const inUser = r.userId && String(r.userId).includes(recordFilter);
      return inName || inUser;
    });
  }

  if (records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">暂无记录</td></tr>';
    return;
  }

  // 按日期降序
  records.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

  let html = '';
  records.forEach(function (record) {
    const mealInfo = MEAL_TYPE_MAP[record.mealType] || MEAL_TYPE_MAP.dinner;
    const diffInfo = DIFFICULTY_MAP[record.difficulty] || DIFFICULTY_MAP.easy;
    const stars = record.rating ? '★'.repeat(record.rating) + '☆'.repeat(5 - record.rating) : '-';

    html +=
      '<tr>' +
      '<td class="col-id">' + escapeHtml(String(record.id)) + '</td>' +
      '<td><div class="dish-cell"><span class="dish-emoji">' + (record.emoji || '🍽️') + '</span>' + escapeHtml(record.dishName) + '</div></td>' +
      '<td class="col-id">' + escapeHtml(String(record.userId)) + '</td>' +
      '<td>' + formatDateFull(record.date) + '</td>' +
      '<td>' + mealInfo.icon + ' ' + mealInfo.label + '</td>' +
      '<td><span class="difficulty-badge" style="color:' + diffInfo.color + ';border-color:' + diffInfo.color + '">' + diffInfo.label + '</span></td>' +
      '<td style="color:var(--accent);">' + stars + '</td>' +
      '<td class="action-cell"><button class="btn-icon" onclick="viewAdminRecord(' + record.id + ')" title="查看详情">👁️</button></td>' +
      '</tr>';
  });

  tbody.innerHTML = html;
}

/**
 * 查看记录详情
 */
function viewAdminRecord(id) {
  const record = allRecords.find(function (r) { return r.id == id; });
  if (!record) return;

  const content = document.getElementById('detailContent');
  content.innerHTML = renderRecordDetail(record, false, false);

  document.getElementById('detailModal').classList.add('show');
}
