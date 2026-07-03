// ===================== 数据存储 =====================
const STORAGE_KEYS = {
  USERS: 'souvenir_users',
  SOUVENIRS: 'souvenir_items',
  FAMILY_GROUPS: 'souvenir_family_groups',
  CURRENT_USER: 'souvenir_current_user',
  INITED: 'souvenir_inited_v3'
};

function getStorage(key, defaultVal) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ===================== 图片素材配置 =====================
const SOUVENIR_IMAGES = {
  'sv1': { src: 'assets/souvenirs/hangzhou-westlake-boat-magnet.jpg', position: 'center 55%' },
  'sv2': { src: 'assets/souvenirs/shanghai-dolphin-toy.jpg', position: 'center 60%' },
  'sv3': { src: 'assets/souvenirs/beijing-palace-lion-magnet.jpg', position: 'center 50%' },
  'sv4': { src: 'assets/souvenirs/tokyo-daruma-charm.jpg', position: 'center 35%' },
  'sv5': { src: 'assets/souvenirs/paris-eiffel-postcard.jpg', position: 'center 50%' },
  'sv6': { src: 'assets/souvenirs/xian-terracotta-ticket.jpg', position: 'center 45%' }
};

// ===================== 预置数据 =====================
const PRESET_USERS = [
  { name: '阿丸', password: '123456', createdAt: '2024-01-01' },
  { name: '爸爸', password: '123456', createdAt: '2024-01-01' },
  { name: '妈妈', password: '123456', createdAt: '2024-01-01' }
];

const PRESET_FAMILY_GROUPS = [
  { id: 'fg1', name: '暑假旅行小队', members: ['阿丸', '爸爸', '妈妈'] },
  { id: 'fg2', name: '周末散步组', members: ['阿丸', '妈妈'] }
];

const PRESET_SOUVENIRS = [
  {
    id: 'sv1', name: '杭州西湖小船冰箱贴', city: '杭州', country: '中国', region: '国内',
    date: '2026-06-15', category: '冰箱贴', mood: '', visibility: 'family',
    familyGroups: ['暑假旅行小队', '周末散步组'], photo: 'assets/souvenirs/hangzhou-westlake-boat-magnet.jpg', story: '和爸爸妈妈绕着西湖散步，湖面上的船慢慢经过，我把这枚冰箱贴当作那天晚风的纪念。',
    owner: '阿丸', createdAt: '2026-06-15'
  },
  {
    id: 'sv2', name: '海豚小玩具', city: '上海', country: '', region: '国内',
    date: '2026-03-20', category: '小玩具', mood: '', visibility: 'family',
    familyGroups: [], photo: 'assets/souvenirs/shanghai-dolphin-toy.jpg', story: '看完海边表演后，我用零花钱买下它。现在看到它，就会想起那天海风和大家一起鼓掌的样子。',
    owner: '阿丸', createdAt: '2026-03-20'
  },
  {
    id: 'sv3', name: '故宫小狮子冰箱贴', city: '北京', country: '', region: '国内',
    date: '2026-01-10', category: '冰箱贴', mood: '', visibility: 'private',
    familyGroups: [], photo: 'assets/souvenirs/beijing-palace-lion-magnet.jpg', story: '和爸爸妈妈走到红墙旁边的小店时，我一眼看中了这只小狮子。它像在帮我守住那天的阳光和糖葫芦味道。',
    owner: '阿丸', createdAt: '2026-01-10'
  },
  {
    id: 'sv4', name: '达摩挂件', city: '东京', country: '日本', region: '东亚',
    date: '2025-08-05', category: '挂件', mood: '', visibility: 'public',
    familyGroups: [], photo: 'assets/souvenirs/tokyo-daruma-charm.jpg', story: '这只达摩只有一只眼睛被画上了，另一只眼睛要等愿望实现再补。它提醒我把小目标放在心里。',
    owner: '阿丸', createdAt: '2025-08-05'
  },
  {
    id: 'sv5', name: '铁塔明信片', city: '巴黎', country: '法国', region: '欧洲',
    date: '2024-07-12', category: '明信片', mood: '', visibility: 'public',
    familyGroups: [], photo: 'assets/souvenirs/paris-eiffel-postcard.jpg', story: '明信片是妈妈写给未来的我的。长大以后再看到它，要记得一家人一起抬头看灯光的晚上。',
    owner: '妈妈', createdAt: '2024-07-12'
  },
  {
    id: 'sv6', name: '兵马俑门票', city: '西安', country: '', region: '国内',
    date: '2025-04-02', category: '票根', mood: '', visibility: 'family',
    familyGroups: ['暑假旅行小队'], photo: 'assets/souvenirs/xian-terracotta-ticket.jpg', story: '展厅里很安静，兵马俑排得整整齐齐。门票被夹在书里，记住第一次觉得历史离自己这么近。',
    owner: '爸爸', createdAt: '2025-04-02'
  }
];

// ===================== 初始化 =====================
function initData() {
  const inited = localStorage.getItem(STORAGE_KEYS.INITED);
  if (!inited) {
    // 清除旧数据
    localStorage.removeItem('souvenir_inited');
    setStorage(STORAGE_KEYS.USERS, PRESET_USERS);
    setStorage(STORAGE_KEYS.SOUVENIRS, PRESET_SOUVENIRS);
    setStorage(STORAGE_KEYS.FAMILY_GROUPS, PRESET_FAMILY_GROUPS);
    localStorage.setItem(STORAGE_KEYS.INITED, 'true');
  }
}

// ===================== 用户管理 =====================
function getUsers() {
  return getStorage(STORAGE_KEYS.USERS, []);
}

function saveUsers(users) {
  setStorage(STORAGE_KEYS.USERS, users);
}

function getCurrentUser() {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || '';
}

function setCurrentUser(username) {
  if (username) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, username);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

function registerUser(name, password) {
  const users = getUsers();
  if (users.find(u => u.name === name)) {
    return { success: false, msg: '该账号已存在' };
  }
  users.push({ name, password, createdAt: new Date().toISOString().split('T')[0] });
  saveUsers(users);
  return { success: true };
}

function loginUser(name, password) {
  const users = getUsers();
  const user = users.find(u => u.name === name && u.password === password);
  if (user) {
    setCurrentUser(name);
    return { success: true };
  }
  return { success: false, msg: '账号或密码错误' };
}

function deleteUser(name) {
  let users = getUsers();
  users = users.filter(u => u.name !== name);
  saveUsers(users);

  let souvenirs = getSouvenirs();
  souvenirs = souvenirs.filter(s => s.owner !== name);
  saveSouvenirs(souvenirs);

  let groups = getFamilyGroups();
  groups = groups.map(g => ({
    ...g,
    members: g.members.filter(m => m !== name)
  })).filter(g => g.members.length > 0);
  saveFamilyGroups(groups);

  if (getCurrentUser() === name) {
    setCurrentUser('');
  }
}

// ===================== 纪念品管理 =====================
function getSouvenirs() {
  return getStorage(STORAGE_KEYS.SOUVENIRS, []);
}

function saveSouvenirs(items) {
  setStorage(STORAGE_KEYS.SOUVENIRS, items);
}

function addSouvenir(data) {
  const items = getSouvenirs();
  const newItem = {
    id: generateId(),
    ...data,
    createdAt: new Date().toISOString().split('T')[0]
  };
  items.push(newItem);
  saveSouvenirs(items);
  return newItem;
}

function deleteSouvenir(id) {
  let items = getSouvenirs();
  items = items.filter(s => s.id !== id);
  saveSouvenirs(items);
}

// ===================== 家庭组管理 =====================
function getFamilyGroups() {
  return getStorage(STORAGE_KEYS.FAMILY_GROUPS, []);
}

function saveFamilyGroups(groups) {
  setStorage(STORAGE_KEYS.FAMILY_GROUPS, groups);
}

function createFamilyGroup(name, creator) {
  const groups = getFamilyGroups();
  if (groups.find(g => g.name === name)) {
    return { success: false, msg: '该家庭组已存在' };
  }
  const newGroup = { id: generateId(), name, members: creator ? [creator] : [] };
  groups.push(newGroup);
  saveFamilyGroups(groups);
  return { success: true, group: newGroup };
}

function addFamilyMember(groupId, memberName) {
  const groups = getFamilyGroups();
  const group = groups.find(g => g.id === groupId);
  if (!group) return { success: false, msg: '家庭组不存在' };
  if (group.members.includes(memberName)) {
    return { success: false, msg: '该成员已在家庭组中' };
  }
  group.members.push(memberName);
  saveFamilyGroups(groups);
  return { success: true };
}

function deleteFamilyGroup(groupId) {
  let groups = getFamilyGroups();
  groups = groups.filter(g => g.id !== groupId);
  saveFamilyGroups(groups);
}

// ===================== 可见性判断 =====================
function canViewSouvenir(item, username) {
  if (!username) return false;
  if (item.owner === username) return true;
  if (item.visibility === 'public') return true;
  if (item.visibility === 'private') return false;
  if (item.visibility === 'family') {
    const groups = getFamilyGroups();
    const itemGroups = item.familyGroups || [];
    for (const gName of itemGroups) {
      const g = groups.find(grp => grp.name === gName);
      if (g && g.members.includes(username)) return true;
    }
    return false;
  }
  return false;
}

function getVisibilityLabel(v) {
  return v === 'public' ? '公开' : v === 'family' ? '家庭组' : '私密';
}

function getVisibilityClass(v) {
  return v === 'public' ? 'vis-public' : v === 'family' ? 'vis-family' : 'vis-private';
}

// ===================== 全局状态 =====================
let currentFilter = 'all';
let currentSearch = '';
let uploadedPhotoBase64 = '';
let currentDetailId = null;

// ===================== DOM 元素缓存 =====================
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

// ===================== 登录页渲染 =====================
function renderExistingAccounts() {
  const users = getUsers();
  const container = $('#existing-accounts-list');
  if (!container) return;
  if (users.length === 0) {
    container.innerHTML = '<span style="color:#999;font-size:13px;">暂无账号</span>';
    return;
  }
  container.innerHTML = users.map(u => `
    <div class="account-chip" data-name="${u.name}">
      <div class="account-chip-main">
        <div class="account-avatar">👤</div>
        <span class="account-name">${u.name}</span>
      </div>
      <button class="chip-delete" data-name="${u.name}" title="删除账号">删除</button>
    </div>
  `).join('');

  container.querySelectorAll('.account-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      if (e.target.classList.contains('chip-delete')) return;
      const name = chip.dataset.name;
      $('#login-username').value = name;
      $('#login-password').value = '';
      $('#login-password').focus();
    });
  });

  container.querySelectorAll('.chip-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = btn.dataset.name;
      if (confirm(`确定要删除账号「${name}」吗？该账号的收藏和家庭组绑定也会一并清理。`)) {
        deleteUser(name);
        renderExistingAccounts();
      }
    });
  });
}

function showLoginPage() {
  $('#login-page').classList.remove('hidden');
  $('#app').classList.add('hidden');
  renderExistingAccounts();
}

function showApp() {
  $('#login-page').classList.add('hidden');
  $('#app').classList.remove('hidden');
  const user = getCurrentUser();
  $('#sidebar-user').textContent = user;
  updateSidebarFamilies();
  switchPage('cabinet');
}

function updateSidebarFamilies() {
  const user = getCurrentUser();
  const groups = getFamilyGroups().filter(g => g.members.includes(user));
  const el = $('#sidebar-families');
  if (groups.length === 0) {
    el.textContent = '暂无家庭组';
  } else {
    el.textContent = groups.map(g => g.name).join('、');
  }
}

// ===================== 页面切换 =====================
function switchPage(page) {
  if (page === 'logout') {
    setCurrentUser('');
    showLoginPage();
    return;
  }

  $$('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  $$('.page-content').forEach(el => {
    el.classList.toggle('active', el.id === 'page-' + page);
  });

  if (page === 'cabinet') renderCabinet();
  if (page === 'map') renderMap();
  if (page === 'add') renderAddForm();
  if (page === 'family') renderFamily();
}

// ===================== 展柜页面 =====================
function getFilteredSouvenirs() {
  const user = getCurrentUser();
  let items = getSouvenirs();

  items = items.filter(s => canViewSouvenir(s, user));

  if (currentFilter !== 'all') {
    items = items.filter(s => s.visibility === currentFilter);
  }

  if (currentSearch.trim()) {
    const kw = currentSearch.trim().toLowerCase();
    items = items.filter(s =>
      (s.name && s.name.toLowerCase().includes(kw)) ||
      (s.city && s.city.toLowerCase().includes(kw)) ||
      (s.story && s.story.toLowerCase().includes(kw)) ||
      (s.country && s.country.toLowerCase().includes(kw))
    );
  }

  return items;
}

function renderCabinet() {
  const user = getCurrentUser();
  const items = getFilteredSouvenirs();
  const allMyItems = getSouvenirs().filter(s => s.owner === user);
  const visibleItems = getSouvenirs().filter(s => canViewSouvenir(s, user));
  const groups = getFamilyGroups().filter(g => g.members.includes(user));

  $('#stat-total').textContent = allMyItems.length;
  $('#stat-visible').textContent = visibleItems.length;
  $('#stat-family').textContent = groups.length;

  const recentItem = visibleItems.length > 0 ? visibleItems[visibleItems.length - 1] : null;
  $('#stat-recent-text').textContent = recentItem ? recentItem.name : '—';

  const container = $('#cabinet-content');
  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🗃️</div>
        <div class="empty-state-text">还没有符合条件的收藏</div>
      </div>
    `;
    return;
  }

  const yearMap = {};
  items.forEach(item => {
    const year = item.date ? item.date.split('-')[0] : '未知';
    if (!yearMap[year]) yearMap[year] = [];
    yearMap[year].push(item);
  });

  const years = Object.keys(yearMap).sort((a, b) => b.localeCompare(a));

  container.innerHTML = years.map(year => `
    <div class="year-section">
      <div class="year-header">
        <span class="year-badge">${year}年</span>
        <span class="year-line"></span>
        <span class="year-count">${yearMap[year].length} 件</span>
      </div>
      <div class="souvenir-grid">
        ${yearMap[year].map(item => renderSouvenirCard(item)).join('')}
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.souvenir-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('card-delete')) return;
      openDetail(card.dataset.id);
    });
  });

  container.querySelectorAll('.card-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('确定要删除这件纪念品吗？')) {
        deleteSouvenir(btn.dataset.id);
        renderCabinet();
      }
    });
  });
}

function renderSouvenirCard(item) {
  const imgConfig = SOUVENIR_IMAGES[item.id];
  const position = imgConfig ? imgConfig.position : 'center';
  const photoHtml = item.photo
    ? `<img src="${item.photo}" alt="${item.name}" style="object-position: ${position}">`
    : `<div style="color:var(--text-light);font-size:13px;">📷 照片占位</div>`;

  return `
    <div class="souvenir-card" data-id="${item.id}">
      <button class="card-delete" data-id="${item.id}" title="删除">删除</button>
      <div class="card-photo">${photoHtml}</div>
      <div class="card-body">
        <div class="card-name">${item.name}</div>
        <div class="card-meta">
          <span class="card-city">${item.city}</span>
          <span class="card-visibility ${getVisibilityClass(item.visibility)}">${getVisibilityLabel(item.visibility)}</span>
        </div>
        <div class="card-owner">${item.owner}</div>
      </div>
    </div>
  `;
}

// ===================== 详情面板 =====================
function openDetail(id) {
  const items = getSouvenirs();
  const item = items.find(s => s.id === id);
  if (!item) return;

  currentDetailId = id;
  const panel = $('#cabinet-detail-panel');

  const imgConfig = SOUVENIR_IMAGES[item.id];
  const position = imgConfig ? imgConfig.position : 'center';
  const photoHtml = item.photo
    ? `<img src="${item.photo}" alt="${item.name}" style="object-position: ${position}">`
    : `<div style="color:var(--text-light);font-size:13px;">📷 暂无照片</div>`;

  const familyGroupsText = (item.familyGroups || []).join('、') || '无';
  const categoryText = item.category === '其他' ? (item.categoryOther || '其他') : (item.category || '未分类');
  const visibilityText = item.visibility === 'public' ? '公开，所有人可见' : item.visibility === 'family' ? '家庭组公开' : '私密，仅自己可见';

  panel.innerHTML = `
    <div class="detail-photo">${photoHtml}</div>
    <div class="detail-name">${item.name}</div>
    <div class="detail-tags">
      ${item.city ? `<span class="detail-tag">${item.city}</span>` : ''}
      ${item.region ? `<span class="detail-tag">${item.region}</span>` : ''}
      ${categoryText ? `<span class="detail-tag">${categoryText}</span>` : ''}
    </div>
    <table class="detail-table">
      <tr><td>城市</td><td>${item.city}${item.country ? ' · ' + item.country : ''}</td></tr>
      <tr><td>区域</td><td>${item.region}</td></tr>
      <tr><td>日期</td><td>${item.date}</td></tr>
      <tr><td>可见</td><td>${visibilityText}</td></tr>
      ${item.visibility === 'family' ? `<tr><td>家庭组</td><td>${familyGroupsText}</td></tr>` : ''}
      <tr><td>主人</td><td>${item.owner}</td></tr>
    </table>
    ${item.story ? `<div class="detail-story">${item.story}</div>` : ''}
    <div class="detail-actions">
      <button class="btn btn-danger" id="detail-delete-btn">删除这件</button>
    </div>
  `;

  $('#detail-delete-btn').addEventListener('click', () => {
    if (confirm('确定要删除这件纪念品吗？')) {
      deleteSouvenir(currentDetailId);
      currentDetailId = null;
      renderCabinet();
      showDetailPlaceholder();
    }
  });
}

function showDetailPlaceholder() {
  const panel = $('#cabinet-detail-panel');
  panel.innerHTML = `
    <div class="detail-panel-placeholder">
      <div class="placeholder-icon">📷</div>
      <div class="placeholder-text">选择一件纪念品</div>
      <div class="placeholder-sub">看看它的故事和旅行回忆</div>
    </div>
  `;
}

// ===================== 地图页面 =====================
const REGION_ORDER = [
  '国内', '东亚', '东南亚', '南亚', '中亚', '西亚/中东',
  '欧洲', '非洲', '北美洲', '南美洲', '大洋洲', '南极洲'
];

function renderMap() {
  const user = getCurrentUser();
  const items = getSouvenirs().filter(s => canViewSouvenir(s, user));

  const allMyItems = getSouvenirs().filter(s => s.owner === user);
  const visibleItems = getSouvenirs().filter(s => canViewSouvenir(s, user));
  const groups = getFamilyGroups().filter(g => g.members.includes(user));

  $('#map-stat-total').textContent = allMyItems.length;
  $('#map-stat-visible').textContent = visibleItems.length;
  $('#map-stat-family').textContent = groups.length;

  const recentItem = visibleItems.length > 0 ? visibleItems[visibleItems.length - 1] : null;
  $('#map-stat-recent-text').textContent = recentItem ? recentItem.name : '—';

  const regionCounts = {};
  REGION_ORDER.forEach(r => regionCounts[r] = 0);
  items.forEach(item => {
    if (regionCounts[item.region] !== undefined) {
      regionCounts[item.region]++;
    }
  });

  const statsContainer = $('#region-stats');
  statsContainer.innerHTML = REGION_ORDER.map(region => {
    const count = regionCounts[region];
    return count > 0
      ? `<span class="region-stat-item"><span>${region}</span><span class="count">${count}</span></span>`
      : `<span class="region-stat-item" style="opacity:0.5"><span>${region}</span><span class="count">0</span></span>`;
  }).join('');

  const regionPlaces = {};
  REGION_ORDER.forEach(r => regionPlaces[r] = new Set());
  items.forEach(item => {
    if (regionPlaces[item.region]) {
      regionPlaces[item.region].add(item.city);
    }
  });

  const placesContainer = $('#region-places');
  const regionsWithPlaces = REGION_ORDER.filter(r => regionPlaces[r].size > 0);

  if (regionsWithPlaces.length === 0) {
    placesContainer.innerHTML = '<div class="empty-state" style="padding:20px;"><div class="empty-state-text">还没有地点记录</div></div>';
  } else {
    placesContainer.innerHTML = regionsWithPlaces.map(region => {
      const cities = Array.from(regionPlaces[region]);
      return `
        <div class="place-item">
          <div class="place-item-name">${region}</div>
          <div class="place-item-meta">${cities.join('、')}</div>
        </div>
      `;
    }).join('');
  }
}

// ===================== 新增收藏页面 =====================
function renderAddForm() {
  uploadedPhotoBase64 = '';
  $('#add-form').reset();
  $('#other-category-row').classList.add('hidden');
  $('#family-select-row').classList.add('hidden');
  $('#photo-preview').classList.add('hidden');
  $('#photo-preview').innerHTML = '';
  renderFamilyCheckboxes();
}

function renderFamilyCheckboxes() {
  const user = getCurrentUser();
  const groups = getFamilyGroups().filter(g => g.members.includes(user));
  const container = $('#family-checkboxes');
  if (groups.length === 0) {
    container.innerHTML = '<span style="color:#999;font-size:13px;">你还没有加入任何家庭组</span>';
    return;
  }
  container.innerHTML = groups.map(g => `
    <label class="family-checkbox-item">
      <input type="checkbox" value="${g.name}">
      <span>${g.name}</span>
    </label>
  `).join('');
}

function handleAddSubmit(e) {
  e.preventDefault();

  const name = $('#add-name').value.trim();
  const city = $('#add-city').value.trim();
  const region = $('#add-region').value;
  const date = $('#add-date').value;
  const visibility = $('#add-visibility').value;

  if (!name || !city || !region || !date || !visibility) {
    alert('请填写所有必填项');
    return;
  }

  let category = $('#add-category').value;
  let categoryOther = '';
  if (category === '其他') {
    categoryOther = $('#add-category-other').value.trim();
    if (!categoryOther) {
      alert('请填写具体分类');
      return;
    }
  }

  let familyGroups = [];
  if (visibility === 'family') {
    const checked = $$('#family-checkboxes input:checked');
    familyGroups = Array.from(checked).map(cb => cb.value);
    if (familyGroups.length === 0) {
      alert('请选择至少一个家庭组');
      return;
    }
  }

  const data = {
    name,
    city,
    country: $('#add-country').value.trim(),
    region,
    date,
    category,
    categoryOther,
    mood: $('#add-mood').value.trim(),
    visibility,
    familyGroups,
    photo: uploadedPhotoBase64,
    story: $('#add-story').value.trim(),
    owner: getCurrentUser()
  };

  addSouvenir(data);
  alert('收藏已保存！');
  switchPage('cabinet');
}

// ===================== 家庭组页面 =====================
function renderFamily() {
  const user = getCurrentUser();
  const allUsers = getUsers();
  const groups = getFamilyGroups();
  const container = $('#family-list-area');

  // 更新添加成员下拉框
  const familySelect = $('#select-family-for-add');
  const userSelect = $('#select-user-for-add');

  familySelect.innerHTML = '<option value="">选择家庭组</option>' +
    groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');

  userSelect.innerHTML = '<option value="">选择账号</option>' +
    allUsers.map(u => `<option value="${u.name}">${u.name}</option>`).join('');

  if (groups.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👨‍👩‍👧</div>
        <div class="empty-state-text">还没有家庭组</div>
      </div>
    `;
    return;
  }

  container.innerHTML = groups.map(group => {
    return `
      <div class="family-card" data-id="${group.id}">
        <div class="family-card-header">
          <span class="family-name">${group.name}</span>
          <button class="btn btn-danger btn-delete-group" data-id="${group.id}" style="padding:4px 10px;font-size:11px;">解散</button>
        </div>
        <div class="family-members">
          ${group.members.map(m => `
            <span class="member-tag ${m === user ? 'me' : ''}">${m}${m === user ? ' (我)' : ''}</span>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-delete-group').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('确定要解散这个家庭组吗？')) {
        deleteFamilyGroup(btn.dataset.id);
        renderFamily();
        updateSidebarFamilies();
      }
    });
  });
}

// ===================== 事件绑定 =====================
function bindEvents() {
  // 登录
  $('.btn-login-submit').addEventListener('click', () => {
    const name = $('#login-username').value.trim();
    const pwd = $('#login-password').value;
    if (!name || !pwd) {
      alert('请输入账号和密码');
      return;
    }
    const result = loginUser(name, pwd);
    if (result.success) {
      showApp();
    } else {
      alert(result.msg);
    }
  });

  // 注册（使用同一个表单）
  $('.btn-register-submit').addEventListener('click', () => {
    const name = $('#login-username').value.trim();
    const pwd = $('#login-password').value;
    if (!name || !pwd) {
      alert('请输入账号和密码');
      return;
    }
    const result = registerUser(name, pwd);
    if (result.success) {
      alert('注册成功！已自动登录');
      loginUser(name, pwd);
      showApp();
      renderExistingAccounts();
    } else {
      alert(result.msg);
    }
  });

  // 清空输入
  $('#btn-clear-input').addEventListener('click', () => {
    $('#login-username').value = '';
    $('#login-password').value = '';
  });

  // 导航
  $$('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      switchPage(item.dataset.page);
    });
  });

  // 快速新增按钮
  $$('.btn-add-quick').forEach(btn => {
    btn.addEventListener('click', () => {
      switchPage(btn.dataset.page);
    });
  });

  // 展柜筛选
  $$('#page-cabinet .filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('#page-cabinet .filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderCabinet();
    });
  });

  // 展柜搜索
  $('#cabinet-search').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderCabinet();
  });

  // 地图搜索
  $('#map-search').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderMap();
  });

  // 地图筛选
  $$('#page-map .filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('#page-map .filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderMap();
    });
  });

  // 详情关闭（已改为右侧面板，无需侧边栏关闭）

  // 新增表单
  $('#add-form').addEventListener('submit', handleAddSubmit);
  $('.btn-cancel').addEventListener('click', () => {
    $('#add-form').reset();
    $('#other-category-row').classList.add('hidden');
    $('#family-select-row').classList.add('hidden');
    $('#photo-preview').classList.add('hidden');
    uploadedPhotoBase64 = '';
  });

  // 分类选择
  $('#add-category').addEventListener('change', (e) => {
    if (e.target.value === '其他') {
      $('#other-category-row').classList.remove('hidden');
    } else {
      $('#other-category-row').classList.add('hidden');
    }
  });

  // 可见范围选择
  $('#add-visibility').addEventListener('change', (e) => {
    if (e.target.value === 'family') {
      $('#family-select-row').classList.remove('hidden');
      renderFamilyCheckboxes();
    } else {
      $('#family-select-row').classList.add('hidden');
    }
  });

  // 照片上传
  $('#add-photo').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      uploadedPhotoBase64 = ev.target.result;
      const preview = $('#photo-preview');
      preview.innerHTML = `<img src="${uploadedPhotoBase64}" alt="预览">`;
      preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  });

  // 创建家庭组
  $('#btn-create-family').addEventListener('click', () => {
    const name = $('#new-family-name').value.trim();
    if (!name) {
      alert('请输入家庭组名称');
      return;
    }
    const result = createFamilyGroup(name, getCurrentUser());
    if (result.success) {
      $('#new-family-name').value = '';
      renderFamily();
      updateSidebarFamilies();
    } else {
      alert(result.msg);
    }
  });

  // 全局添加成员
  $('#btn-add-member-global').addEventListener('click', () => {
    const groupId = $('#select-family-for-add').value;
    const memberName = $('#select-user-for-add').value;
    if (!groupId || !memberName) {
      alert('请选择家庭组和账号');
      return;
    }
    const result = addFamilyMember(groupId, memberName);
    if (result.success) {
      renderFamily();
      updateSidebarFamilies();
    } else {
      alert(result.msg);
    }
  });
}

// ===================== 启动 =====================
document.addEventListener('DOMContentLoaded', () => {
  initData();
  bindEvents();

  const user = getCurrentUser();
  if (user) {
    showApp();
  } else {
    showLoginPage();
  }
});
