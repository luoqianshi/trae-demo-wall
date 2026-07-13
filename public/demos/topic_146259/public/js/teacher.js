const API_BASE = 'http://localhost:3000/api';

// ================= 认证模块 =================
let currentUser = null;

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.headers || {}),
      'Content-Type': 'application/json'
    }
  });
  if (res.status === 401) {
    currentUser = null;
    localStorage.removeItem('cuoti_current_user');
    updateUserInfoUI();
    openLoginModal('登录已过期，请重新登录');
  } else if (res.status === 403) {
    showToast('需要教师权限', 'error');
  }
  return res;
}

function updateUserInfoUI() {
  const avatarEl = document.getElementById('teacher-avatar');
  const nameEl = document.getElementById('teacher-name');
  const btnAuth = document.getElementById('btn-auth');
  if (!avatarEl || !nameEl || !btnAuth) return;

  if (currentUser && currentUser.role === 'teacher') {
    avatarEl.textContent = currentUser.name ? currentUser.name.charAt(0) : '师';
    nameEl.textContent = `${currentUser.name} · 教师`;
    btnAuth.textContent = '退出';
  } else {
    avatarEl.textContent = '?';
    nameEl.textContent = '未登录';
    btnAuth.textContent = '登录';
  }
}

function openLoginModal(message = '请先登录后再使用老师端') {
  const modal = document.getElementById('login-modal');
  const hint = modal.querySelector('.hint');
  if (hint) hint.textContent = message;
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  modal.classList.remove('hidden');
}

function closeLoginModal() {
  document.getElementById('login-modal').classList.add('hidden');
}

async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    const hint = document.querySelector('#login-modal .hint');
    if (hint) hint.textContent = data.error || '登录失败，请检查用户名和密码';
    return false;
  }
  if (data.user.role !== 'teacher') {
    const hint = document.querySelector('#login-modal .hint');
    if (hint) hint.textContent = '该账号没有教师权限，请使用教师账号登录';
    await logout(true);
    return false;
  }
  currentUser = data.user;
  localStorage.setItem('cuoti_current_user', JSON.stringify(currentUser));
  updateUserInfoUI();
  closeLoginModal();
  showToast(`欢迎，${currentUser.name}`);
  return true;
}

async function logout(silent = false) {
  await api('/auth/logout', { method: 'POST' });
  currentUser = null;
  localStorage.removeItem('cuoti_current_user');
  updateUserInfoUI();
  if (!silent) showToast('已退出登录');
}

async function checkAuth() {
  const cached = localStorage.getItem('cuoti_current_user');
  if (cached) {
    try {
      currentUser = JSON.parse(cached);
      updateUserInfoUI();
    } catch (e) {
      currentUser = null;
    }
  }

  const res = await api('/auth/me');
  const data = await res.json();
  if (data.loggedIn) {
    if (data.user.role !== 'teacher') {
      currentUser = null;
      localStorage.removeItem('cuoti_current_user');
      updateUserInfoUI();
      openLoginModal('需要教师账号才能访问老师端');
      return false;
    }
    currentUser = data.user;
    localStorage.setItem('cuoti_current_user', JSON.stringify(currentUser));
    updateUserInfoUI();
    return true;
  } else {
    currentUser = null;
    localStorage.removeItem('cuoti_current_user');
    updateUserInfoUI();
    openLoginModal('请先登录后再使用老师端');
    return false;
  }
}

function requireTeacherAuth(message) {
  if (currentUser && currentUser.role === 'teacher') return true;
  openLoginModal(message || '请先登录教师账号');
  return false;
}

// ================= UI 工具 =================
function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// 页面切换
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
navItems.forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    pages.forEach(p => p.classList.add('hidden'));
    document.getElementById(`page-${page}`).classList.remove('hidden');

    if (page === 'dashboard') loadDashboard();
    if (page === 'heatmap') loadHeatmap();
    if (page === 'students') loadStudents();
    if (page === 'tags') loadTags();
    if (page === 'users') loadUsers();
  });
});

function getHeatColor(rate) {
  if (rate >= 60) return '#b33a25';
  if (rate >= 40) return '#e86a33';
  if (rate >= 25) return '#f9c89f';
  return '#e8f2ef';
}

function getHeatTextColor(rate) {
  return rate >= 25 ? '#fff' : 'var(--ink)';
}

// ================= 班级概览 =================
async function loadDashboard() {
  if (!requireTeacherAuth()) return;
  const res = await api(`/teacher/dashboard`);
  const data = await res.json();

  document.getElementById('dash-students').textContent = data.studentCount;
  document.getElementById('dash-mistakes').textContent = data.totalMistakes;
  document.getElementById('dash-mastery').textContent = data.avgMastery + '%';
  document.getElementById('dash-weak').textContent = data.weakPoints.length;

  document.getElementById('weak-points-list').innerHTML = data.weakPoints.map((w, idx) => `
    <div class="mistake-item" style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <strong style="color:var(--accent)">${idx + 1}. ${w.name}</strong>
        <div style="font-size:0.85rem;color:var(--muted)">累计错误 ${w.count} 次</div>
      </div>
      <div class="heat-cell" style="background:${getHeatColor(Math.min(100, w.count * 15))};color:${getHeatTextColor(Math.min(100, w.count * 15))}">${w.count}</div>
    </div>
  `).join('');

  const suggestion = document.getElementById('teaching-suggestion');
  if (data.weakPoints.length > 0) {
    const top = data.weakPoints.slice(0, 3).map(w => `「${w.name}」`).join('、');
    suggestion.innerHTML = `近期班级在 ${top} 等知识点上错误集中，建议在下周课堂中安排专项复习。可优先讲解典型错题，并布置 3-5 道同考点变式题进行巩固。错题率超过 40% 的知识点建议全班统一讲评，低于 40% 的可以进行小组互助或个别辅导。`;
  } else {
    suggestion.textContent = '班级整体掌握较好，建议继续保持复习节奏。';
  }
}

// ================= 错题热力图 =================
let heatmapChart = null;

async function loadHeatmap() {
  if (!requireTeacherAuth()) return;
  const res = await api(`/teacher/heatmap`);
  const data = await res.json();
  const heatmap = data.heatmap;

  renderHeatmapChart(heatmap);
  renderHeatmapTable(heatmap);
}

function renderHeatmapChart(heatmap) {
  const chartDom = document.getElementById('heatmap-chart');
  if (heatmapChart) heatmapChart.dispose();
  heatmapChart = echarts.init(chartDom);

  const option = {
    tooltip: {
      formatter: p => `${p.name}<br/>错误率：${p.value}%<br/>错题数：${heatmap[p.dataIndex].wrongCount}`
    },
    xAxis: {
      type: 'category',
      data: heatmap.map(h => h.knowledge),
      axisLabel: { rotate: 30, color: 'var(--muted)' }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%', color: 'var(--muted)' }
    },
    series: [{
      type: 'bar',
      data: heatmap.map(h => ({
        value: h.rate,
        itemStyle: { color: getHeatColor(h.rate) }
      })),
      barWidth: '50%',
      label: {
        show: true,
        position: 'top',
        formatter: '{c}%',
        color: 'var(--muted)'
      }
    }]
  };
  heatmapChart.setOption(option);
}

function renderHeatmapTable(heatmap) {
  const tbody = document.querySelector('#heatmap-table tbody');
  tbody.innerHTML = heatmap.map(h => {
    const level = h.rate >= 60 ? '高' : h.rate >= 40 ? '中高' : h.rate >= 25 ? '中' : '低';
    return `
      <tr>
        <td><strong>${h.knowledge}</strong></td>
        <td>${h.wrongCount}</td>
        <td>${h.affectedStudents.join('、')}</td>
        <td>${h.rate}%</td>
        <td><span class="heat-cell" style="background:${getHeatColor(h.rate)};color:${getHeatTextColor(h.rate)}">${level}</span></td>
      </tr>
    `;
  }).join('');
}

// ================= 学生错题 =================
async function loadStudents() {
  if (!requireTeacherAuth()) return;
  const res = await api(`/teacher/students`);
  const data = await res.json();
  const tbody = document.querySelector('#students-table tbody');
  tbody.innerHTML = data.students.map(s => `
    <tr>
      <td><strong>${s.name}</strong></td>
      <td>${s.mistakes}</td>
      <td>${s.weakPoints.length > 0 ? [...new Set(s.weakPoints)].join('、') : '暂无'}</td>
      <td><button class="btn btn-secondary btn-sm" data-id="${s.id}" data-name="${s.name}">查看详情</button></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => loadStudentDetail(btn.dataset.id, btn.dataset.name));
  });
}

let editingMistakeId = null;
let editingStudentId = null;

async function loadStudentDetail(studentId, studentName) {
  if (!requireTeacherAuth()) return;
  const res = await api(`/teacher/students/${studentId}/mistakes`);
  const data = await res.json();
  const detail = document.getElementById('student-detail');
  const list = document.getElementById('detail-mistakes-list');

  document.getElementById('detail-student-name').textContent = `${studentName} 的错题详情`;

  if (data.list.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:var(--muted);padding:1rem 0">该学生暂无错题</p>';
  } else {
    list.innerHTML = data.list.map(m => `
      <div class="mistake-item" data-id="${m.id}">
        <div class="mistake-header">
          <div class="mistake-title">${m.title}</div>
          <button class="btn btn-secondary btn-sm" data-id="${m.id}" data-next="${m.nextReviewAt}">修改复习时间</button>
        </div>
        ${m.image ? `<div style="margin:0.6rem 0"><img src="${m.image}" style="max-width:100%;max-height:200px;border-radius:8px;border:1px solid var(--rule);cursor:pointer" onclick="window.open('${m.image}', '_blank')" title="点击查看大图"></div>` : ''}
        <div class="mistake-meta">
          <span class="tag tag-primary">${m.knowledge}</span>
          <span class="tag tag-danger">${m.reason}</span>
          <span class="tag">难度 ${'★'.repeat(m.difficulty)}</span>
          <span class="tag tag-success">掌握度 ${m.mastery}%</span>
          <span class="tag">录入时间：${m.createdAt}</span>
          <span class="tag ${m.nextReviewAt <= new Date().toISOString().slice(0, 10) ? 'tag-success' : ''}">下次复习：${m.nextReviewAt}</span>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.mistake-header button').forEach(btn => {
      btn.addEventListener('click', () => openEditReviewDate(studentId, btn.dataset.id, btn.dataset.next));
    });
  }

  detail.classList.remove('hidden');
  detail.scrollIntoView({ behavior: 'smooth' });
}

function openEditReviewDate(studentId, mistakeId, currentDate) {
  editingStudentId = studentId;
  editingMistakeId = mistakeId;
  document.getElementById('edit-review-date-input').value = currentDate;
  document.getElementById('edit-review-date-modal').classList.remove('hidden');
}

function closeEditReviewDate() {
  editingStudentId = null;
  editingMistakeId = null;
  document.getElementById('edit-review-date-modal').classList.add('hidden');
}

async function saveEditReviewDate() {
  if (!requireTeacherAuth()) return;
  if (!editingMistakeId) return;
  const nextReviewAt = document.getElementById('edit-review-date-input').value;
  if (!nextReviewAt) return showToast('请选择复习时间', 'error');

  const res = await api(`/teacher/mistakes/${editingMistakeId}/review-date`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nextReviewAt })
  });
  const data = await res.json();
  if (data.success) {
    showToast('复习时间已更新');
    const studentId = editingStudentId;
    closeEditReviewDate();
    const nameEl = document.getElementById('detail-student-name');
    if (nameEl && studentId) {
      loadStudentDetail(studentId, nameEl.textContent.replace(' 的错题详情', ''));
    }
  } else {
    showToast(data.error || '更新失败', 'error');
  }
}

document.getElementById('btn-close-detail').addEventListener('click', () => {
  document.getElementById('student-detail').classList.add('hidden');
});

window.addEventListener('resize', () => {
  if (heatmapChart) heatmapChart.resize();
});

// ================= 标签管理 =================
async function loadTags() {
  if (!requireTeacherAuth()) return;
  const res = await api(`/teacher/tags`);
  const data = await res.json();
  renderTagList('knowledge-list', data.knowledge, deleteKnowledge);
  renderTagList('reason-list', data.reasons, deleteReason);
}

function renderTagList(containerId, items, onDelete) {
  const container = document.getElementById(containerId);
  if (items.length === 0) {
    container.innerHTML = '<p style="color:var(--muted);font-size:0.9rem">暂无标签</p>';
    return;
  }
  container.innerHTML = items.map(item => `
    <div class="mistake-item" style="display:flex;justify-content:space-between;align-items:center;padding:0.7rem 1rem;margin-bottom:0.5rem">
      <span style="font-weight:500">${item}</span>
      <button class="btn btn-danger btn-sm" data-name="${item}">删除</button>
    </div>
  `).join('');

  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => onDelete(btn.dataset.name));
  });
}

async function addKnowledge() {
  if (!requireTeacherAuth()) return;
  const input = document.getElementById('input-knowledge');
  const name = input.value.trim();
  if (!name) return showToast('请输入知识点名称', 'error');

  const res = await api(`/teacher/knowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  const data = await res.json();
  if (data.success) {
    input.value = '';
    renderTagList('knowledge-list', data.knowledge, deleteKnowledge);
    showToast('知识点已添加');
  } else {
    showToast(data.error || '添加失败', 'error');
  }
}

async function deleteKnowledge(name) {
  if (!requireTeacherAuth()) return;
  if (!confirm(`确定删除知识点「${name}」？`)) return;
  const res = await api(`/teacher/knowledge`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  const data = await res.json();
  if (data.success) {
    renderTagList('knowledge-list', data.knowledge, deleteKnowledge);
    showToast('知识点已删除');
  }
}

async function addReason() {
  if (!requireTeacherAuth()) return;
  const input = document.getElementById('input-reason');
  const name = input.value.trim();
  if (!name) return showToast('请输入错因名称', 'error');

  const res = await api(`/teacher/reason`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  const data = await res.json();
  if (data.success) {
    input.value = '';
    renderTagList('reason-list', data.reasons, deleteReason);
    showToast('错因已添加');
  } else {
    showToast(data.error || '添加失败', 'error');
  }
}

async function deleteReason(name) {
  if (!requireTeacherAuth()) return;
  if (!confirm(`确定删除错因「${name}」？`)) return;
  const res = await api(`/teacher/reason`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  const data = await res.json();
  if (data.success) {
    renderTagList('reason-list', data.reasons, deleteReason);
    showToast('错因已删除');
  }
}

document.getElementById('btn-add-knowledge').addEventListener('click', addKnowledge);
document.getElementById('input-knowledge').addEventListener('keypress', e => {
  if (e.key === 'Enter') addKnowledge();
});
document.getElementById('btn-add-reason').addEventListener('click', addReason);
document.getElementById('input-reason').addEventListener('keypress', e => {
  if (e.key === 'Enter') addReason();
});

document.getElementById('btn-cancel-edit-review-date').addEventListener('click', closeEditReviewDate);
document.getElementById('btn-save-edit-review-date').addEventListener('click', saveEditReviewDate);
document.getElementById('edit-review-date-modal').addEventListener('click', e => {
  if (e.target.id === 'edit-review-date-modal') closeEditReviewDate();
});

// ================= 用户管理 =================
let editingUserId = null;

async function loadUsers() {
  if (!requireTeacherAuth()) return;
  const res = await api('/auth/users');
  const data = await res.json();
  const tbody = document.querySelector('#users-table tbody');
  if (!data.users || data.users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted)">暂无用户</td></tr>';
    return;
  }
  tbody.innerHTML = data.users.map(u => `
    <tr>
      <td><strong>${u.name}</strong></td>
      <td>${u.username}</td>
      <td>${u.classId}</td>
      <td>${u.role === 'teacher' ? '教师' : '学生'}</td>
      <td>
        <button class="btn btn-secondary btn-sm" data-id="${u.id}">编辑</button>
        ${u.id !== currentUser.id ? `<button class="btn btn-danger btn-sm" data-id="${u.id}" style="margin-left:0.4rem">删除</button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-secondary').forEach(btn => {
    btn.addEventListener('click', () => openUserModal(btn.dataset.id));
  });
  tbody.querySelectorAll('.btn-danger').forEach(btn => {
    btn.addEventListener('click', () => deleteUser(btn.dataset.id));
  });
}

function openUserModal(userId = null) {
  if (!requireTeacherAuth()) return;
  editingUserId = userId;
  const modal = document.getElementById('user-modal');
  const title = document.getElementById('user-modal-title');
  const passwordInput = document.getElementById('user-password');
  const hint = document.getElementById('password-hint');

  if (userId) {
    title.textContent = '编辑用户';
    passwordInput.placeholder = '留空则不修改密码';
    hint.textContent = '（留空表示不修改）';
    const rows = document.querySelectorAll('#users-table tbody tr');
    let target = null;
    rows.forEach(row => {
      const editBtn = row.querySelector('.btn-secondary');
      if (editBtn && editBtn.dataset.id === userId) {
        const cells = row.querySelectorAll('td');
        target = {
          name: cells[0].textContent.trim(),
          username: cells[1].textContent.trim(),
          classId: cells[2].textContent.trim(),
          role: cells[3].textContent.trim() === '教师' ? 'teacher' : 'student'
        };
      }
    });
    if (target) {
      document.getElementById('user-name').value = target.name;
      document.getElementById('user-username').value = target.username;
      document.getElementById('user-class').value = target.classId;
      document.getElementById('user-role').value = target.role;
    }
  } else {
    title.textContent = '新增用户';
    passwordInput.placeholder = '请输入密码';
    hint.textContent = '（不少于6位）';
    document.getElementById('user-name').value = '';
    document.getElementById('user-username').value = '';
    document.getElementById('user-password').value = '';
    document.getElementById('user-class').value = 'c301';
    document.getElementById('user-role').value = 'student';
  }
  document.getElementById('user-id').value = userId || '';
  modal.classList.remove('hidden');
}

function closeUserModal() {
  editingUserId = null;
  document.getElementById('user-modal').classList.add('hidden');
}

async function saveUser() {
  if (!requireTeacherAuth()) return;
  const name = document.getElementById('user-name').value.trim();
  const username = document.getElementById('user-username').value.trim();
  const password = document.getElementById('user-password').value;
  const classId = document.getElementById('user-class').value.trim();
  const role = document.getElementById('user-role').value;

  if (!name || !username || !classId) {
    showToast('姓名、用户名、班级不能为空', 'error');
    return;
  }
  if (!editingUserId && !password) {
    showToast('新增用户时必须设置密码', 'error');
    return;
  }

  const payload = { name, username, classId, role };
  if (password) payload.password = password;

  let res;
  if (editingUserId) {
    res = await api(`/auth/users/${editingUserId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  } else {
    res = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
  const data = await res.json();
  if (!res.ok || !data.success) {
    showToast(data.error || '保存失败', 'error');
    return;
  }
  closeUserModal();
  await loadUsers();
  showToast(editingUserId ? '用户已更新' : '用户已添加');
}

async function deleteUser(userId) {
  if (!requireTeacherAuth()) return;
  if (userId === currentUser.id) {
    showToast('不能删除当前登录账号', 'error');
    return;
  }
  if (!confirm('确定删除该用户？此操作不可恢复')) return;
  const res = await api(`/auth/users/${userId}`, { method: 'DELETE' });
  const data = await res.json();
  if (data.success) {
    await loadUsers();
    showToast('用户已删除');
  } else {
    showToast(data.error || '删除失败', 'error');
  }
}

document.getElementById('btn-add-user').addEventListener('click', () => openUserModal());
document.getElementById('btn-save-user').addEventListener('click', saveUser);
document.getElementById('btn-cancel-user').addEventListener('click', closeUserModal);
document.getElementById('user-modal').addEventListener('click', e => {
  if (e.target.id === 'user-modal') closeUserModal();
});

// 登录/退出按钮
document.getElementById('btn-auth').addEventListener('click', () => {
  if (currentUser) {
    logout();
  } else {
    openLoginModal();
  }
});

// 登录弹窗按钮
document.getElementById('btn-login-submit').addEventListener('click', async () => {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  if (!username || !password) {
    showToast('请输入用户名和密码', 'error');
    return;
  }
  const ok = await login(username, password);
  if (ok) {
    loadDashboard();
  }
});

document.getElementById('btn-cancel-login').addEventListener('click', closeLoginModal);
document.getElementById('login-modal').addEventListener('click', e => {
  if (e.target.id === 'login-modal') closeLoginModal();
});

// 初始加载：先检查教师权限
(async function init() {
  const ok = await checkAuth();
  if (ok) {
    loadDashboard();
  }
})();
