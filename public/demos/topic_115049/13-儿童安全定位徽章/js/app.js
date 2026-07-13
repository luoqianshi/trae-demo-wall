/* ========================================
   儿童安全定位徽章 - 主应用 JavaScript
   ======================================== */

/* ===== 数据模型 ===== */
const defaultBadges = [
  { id: 1, name: '小宝', avatar: '👦', battery: 78, childX: 42, childY: 50, online: true },
  { id: 2, name: '小美', avatar: '👧', battery: 65, childX: 55, childY: 35, online: true }
];

const appData = {
  /* 徽章列表 */
  badges: JSON.parse(localStorage.getItem('badge_badges')) || defaultBadges,
  /* 当前选中的徽章 ID */
  activeBadgeId: parseInt(localStorage.getItem('badge_activeId')) || 1,
  /* 联系人列表 */
  contacts: JSON.parse(localStorage.getItem('badge_contacts')) || [
    { id: 1, name: '爸爸', phone: '13812346789', avatar: '👨', isPrimary: true },
    { id: 2, name: '妈妈', phone: '13956781234', avatar: '👩', isPrimary: false },
    { id: 3, name: '爷爷', phone: '13787655678', avatar: '👴', isPrimary: false }
  ],
  /* 围栏设置 */
  fences: JSON.parse(localStorage.getItem('badge_fences')) || [
    { id: 1, name: '学校围栏', center: '朝阳外国语学校', radius: 500, action: 'leave', emoji: '🏫' },
    { id: 2, name: '家庭围栏', center: '望京花园', radius: 1000, action: 'both', emoji: '🏠' }
  ],
  /* 远程配置 */
  remoteConfig: JSON.parse(localStorage.getItem('badge_remote')) || {
    refreshRate: 10,
    silentStart: '22:00',
    silentEnd: '07:00'
  },
  /* 家和学校坐标 */
  homeX: 22,
  homeY: 68,
  schoolX: 62,
  schoolY: 30,
  /* 轨迹点 */
  trail: [],
  /* POI 名称映射 */
  poiNames: {
    home: '望京花园',
    school: '朝阳外国语学校'
  }
};

/* ===== 获取当前徽章 ===== */
function getActiveBadge() {
  return appData.badges.find(function(b) { return b.id === appData.activeBadgeId; }) || appData.badges[0];
}

/* ===== 保存徽章数据 ===== */
function saveBadges() {
  localStorage.setItem('badge_badges', JSON.stringify(appData.badges));
  localStorage.setItem('badge_activeId', appData.activeBadgeId);
}

/* 地标列表 */
const landmarks = [
  { emoji: '🏪', x: 35, y: 45 },
  { emoji: '🏥', x: 75, y: 25 },
  { emoji: '🌳', x: 15, y: 35 },
  { emoji: '⚽', x: 50, y: 60 },
  { emoji: '📚', x: 70, y: 55 },
  { emoji: '🏪', x: 80, y: 75 },
  { emoji: '🚌', x: 45, y: 20 },
  { emoji: '🌳', x: 25, y: 55 },
  { emoji: '🏪', x: 55, y: 80 },
  { emoji: '🏥', x: 85, y: 40 }
];

/* 通知消息列表 */
const notifications = [
  { icon: '🏫', type: 'safe', title: '孩子已到达学校', desc: '小宝已于 07:45 到达朝阳外国语学校' },
  { icon: '🔋', type: 'warn', title: '徽章电量不足', desc: '小宝的徽章电量已低于 20%，请提醒充电' },
  { icon: '🚨', type: 'danger', title: 'SOS 紧急呼叫', desc: '小宝触发了 SOS 紧急呼叫按钮' },
  { icon: '📍', type: 'info', title: '离开安全区域', desc: '小宝已离开学校围栏区域' },
  { icon: '🏠', type: 'safe', title: '孩子已到家', desc: '小宝已于 16:45 到达望京花园' },
  { icon: '🔔', type: 'warn', title: '长时间静止', desc: '小宝已 30 分钟无移动，请确认安全' },
  { icon: '🏫', type: 'info', title: '离开学校', desc: '小宝已于 15:30 离开朝阳外国语学校' }
];

let notificationIndex = 0;
let notificationTimer = null;
let deleteConfirmId = null;

/* ===== 页面切换 ===== */
function goPage(id) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.tab-item').forEach(function(t) { t.classList.remove('active'); });
  const map = { 'page-home': 0, 'page-settings': 1 };
  if (map[id] !== undefined) {
    document.querySelectorAll('.tab-item')[map[id]].classList.add('active');
  }
  /* 切换到设置页时渲染联系人列表 */
  if (id === 'page-settings') {
    renderContacts();
    renderFences();
    renderRemoteConfig();
    renderBadgeList();
  }
}

/* ===== 状态栏实时时间 ===== */
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const clockEl = document.getElementById('status-clock');
  if (clockEl) {
    clockEl.textContent = h + ':' + m;
  }
}
setInterval(updateClock, 1000);
updateClock();

/* ===== 地图初始化：网格线、地标、围栏 ===== */
function initMap() {
  const mapArea = document.querySelector('.map-area');
  if (!mapArea) return;

  /* 绘制网格线 */
  const grid = document.createElement('div');
  grid.className = 'map-grid';
  for (let i = 1; i < 6; i++) {
    const hLine = document.createElement('div');
    hLine.className = 'map-grid-h';
    hLine.style.top = (i * 16.67) + '%';
    grid.appendChild(hLine);
    const vLine = document.createElement('div');
    vLine.className = 'map-grid-v';
    vLine.style.left = (i * 16.67) + '%';
    grid.appendChild(vLine);
  }
  mapArea.insertBefore(grid, mapArea.firstChild);

  /* 添加地标 emoji */
  landmarks.forEach(function(lm) {
    const el = document.createElement('div');
    el.className = 'map-landmark';
    el.textContent = lm.emoji;
    el.style.left = lm.x + '%';
    el.style.top = lm.y + '%';
    mapArea.appendChild(el);
  });

  /* 添加轨迹 Canvas */
  const trailCanvas = document.createElement('canvas');
  trailCanvas.className = 'map-trail';
  trailCanvas.id = 'trail-canvas';
  trailCanvas.width = 420;
  trailCanvas.height = 280;
  mapArea.appendChild(trailCanvas);

  /* 绘制围栏圆圈 */
  updateFenceCircles();
}

/* ===== 围栏圆圈可视化 ===== */
function updateFenceCircles() {
  const mapArea = document.querySelector('.map-area');
  if (!mapArea) return;

  /* 移除旧围栏 */
  mapArea.querySelectorAll('.map-fence').forEach(function(el) { el.remove(); });

  /* 学校围栏 */
  const schoolFence = appData.fences.find(function(f) { return f.emoji === '🏫'; });
  if (schoolFence) {
    const fence = document.createElement('div');
    fence.className = 'map-fence school-fence';
    const diameter = Math.min(schoolFence.radius / 5, 40); /* 缩放比例 */
    fence.style.width = diameter + '%';
    fence.style.height = diameter + '%';
    fence.style.left = appData.schoolX + '%';
    fence.style.top = appData.schoolY + '%';
    fence.style.transform = 'translate(-50%, -50%)';
    mapArea.appendChild(fence);
  }

  /* 家庭围栏 */
  const homeFence = appData.fences.find(function(f) { return f.emoji === '🏠'; });
  if (homeFence) {
    const fence = document.createElement('div');
    fence.className = 'map-fence home-fence';
    const diameter = Math.min(homeFence.radius / 5, 50);
    fence.style.width = diameter + '%';
    fence.style.height = diameter + '%';
    fence.style.left = appData.homeX + '%';
    fence.style.top = appData.homeY + '%';
    fence.style.transform = 'translate(-50%, -50%)';
    mapArea.appendChild(fence);
  }
}

/* ===== 轨迹绘制 ===== */
function drawTrail() {
  const canvas = document.getElementById('trail-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (appData.trail.length < 2) return;

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const first = appData.trail[0];
  ctx.moveTo((first.x / 100) * w, (first.y / 100) * h);

  for (let i = 1; i < appData.trail.length; i++) {
    const pt = appData.trail[i];
    ctx.lineTo((pt.x / 100) * w, (pt.y / 100) * h);
  }
  ctx.stroke();

  /* 轨迹节点小点 */
  appData.trail.forEach(function(pt) {
    ctx.beginPath();
    ctx.arc((pt.x / 100) * w, (pt.y / 100) * h, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(52, 211, 153, 0.3)';
    ctx.fill();
  });
}

/* ===== 模拟孩子位置移动 ===== */
function updateChildPosition() {
  const badge = getActiveBadge();
  if (!badge) return;

  badge.childX += Math.random() * 3 - 1.5;
  badge.childY += Math.random() * 3 - 1.5;
  badge.childX = Math.max(10, Math.min(90, badge.childX));
  badge.childY = Math.max(10, Math.min(90, badge.childY));

  const dotEl = document.querySelector('.map-dot.child');
  const ringEl = document.querySelector('.map-dot.ring');

  if (dotEl) {
    dotEl.style.top = badge.childY + '%';
    dotEl.style.left = badge.childX + '%';
    dotEl.textContent = badge.avatar;
  }
  if (ringEl) {
    ringEl.style.top = badge.childY + '%';
    ringEl.style.left = badge.childX + '%';
    ringEl.style.transform = 'translate(-50%, -50%)';
  }

  /* 添加轨迹点 */
  appData.trail.push({ x: badge.childX, y: badge.childY });
  if (appData.trail.length > 60) appData.trail.shift();
  drawTrail();

  /* 更新距离显示 */
  updateDistances();
  /* 更新地图信息 */
  updateMapInfo();
}

setInterval(updateChildPosition, 3000);

/* ===== 实时距离计算 ===== */
function calcDistance(x1, y1, x2, y2) {
  const dx = (x1 - x2) * 0.04;
  const dy = (y1 - y2) * 0.04;
  return Math.sqrt(dx * dx + dy * dy);
}

function updateDistances() {
  const badge = getActiveBadge();
  if (!badge) return;

  const distHome = calcDistance(badge.childX, badge.childY, appData.homeX, appData.homeY);
  const distSchool = calcDistance(badge.childX, badge.childY, appData.schoolX, appData.schoolY);

  const distHomeEl = document.getElementById('dist-home');
  const distSchoolEl = document.getElementById('dist-school');
  const mapInfoEl = document.querySelector('.map-info');

  const homeStr = distHome >= 1 ? distHome.toFixed(1) + 'km' : Math.round(distHome * 1000) + 'm';
  const schoolStr = distSchool >= 1 ? distSchool.toFixed(1) + 'km' : Math.round(distSchool * 1000) + 'm';

  if (distHomeEl) distHomeEl.textContent = homeStr;
  if (distSchoolEl) distSchoolEl.textContent = schoolStr;
  if (mapInfoEl) {
    mapInfoEl.innerHTML = badge.avatar + ' ' + badge.name + '<br>距家 ' + homeStr + '<br>距学校 ' + schoolStr;
  }
}

/* ===== 更新地图标签时间 ===== */
function updateMapInfo() {
  const mapLabelEl = document.querySelector('.map-label');
  if (mapLabelEl) {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    mapLabelEl.innerHTML = '📍 望京街道 · ' + h + ':' + m + ' 更新';
  }

  /* 位置卡片时间更新 */
  const locTimeEl = document.getElementById('loc-update-time');
  if (locTimeEl) {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    locTimeEl.textContent = h + ':' + m + ':' + s + ' 更新';
  }
}
setInterval(updateMapInfo, 1000);

/* ===== 电量动态变化 ===== */
function updateBattery() {
  const badge = getActiveBadge();
  if (!badge) return;

  badge.battery = Math.max(5, badge.battery - 0.05);
  saveBadges();

  const batteryEl = document.getElementById('battery-text');
  const batteryIconEl = document.getElementById('battery-icon');

  if (batteryEl) {
    batteryEl.textContent = Math.round(badge.battery) + '%';
  }
  if (batteryIconEl) {
    if (badge.battery > 50) {
      batteryIconEl.textContent = '🔋';
      batteryEl.parentElement.className = 'device-battery device-battery--high';
    } else if (badge.battery > 20) {
      batteryIconEl.textContent = '🪫';
      batteryEl.parentElement.className = 'device-battery device-battery--medium';
    } else {
      batteryIconEl.textContent = '🪫';
      batteryEl.parentElement.className = 'device-battery device-battery--low';
    }
  }
}
setInterval(updateBattery, 5000);

/* ===== POI 点击切换视野 ===== */
function focusPOI(type) {
  const mapArea = document.querySelector('.map-area');
  if (!mapArea) return;

  const badge = getActiveBadge();
  let targetX, targetY;
  if (type === 'school') {
    targetX = appData.schoolX;
    targetY = appData.schoolY;
  } else if (type === 'home') {
    targetX = appData.homeX;
    targetY = appData.homeY;
  } else {
    targetX = badge.childX;
    targetY = badge.childY;
  }

  const offsetX = 50 - targetX;
  const offsetY = 50 - targetY;

  const scale = 1.3;
  mapArea.style.transition = 'transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1)';
  mapArea.style.transform = 'scale(' + scale + ') translate(' + (offsetX * 0.5) + '%, ' + (offsetY * 0.5) + '%)';

  setTimeout(function() {
    mapArea.style.transform = 'scale(1) translate(0%, 0%)';
  }, 2500);
}

/* ===== 通用弹窗系统 ===== */
function showModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function hideModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* 点击遮罩关闭弹窗 */
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

/* ===== SOS 报警弹窗 ===== */
function handleSOS() {
  /* 填充 SOS 弹窗数据 */
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');

  const sosLocation = document.getElementById('sos-location');
  const sosContacts = document.getElementById('sos-contacts');
  const sosTime = document.getElementById('sos-time');

  if (sosLocation) sosLocation.textContent = '朝阳区望京街道 (模拟坐标)';
  if (sosTime) sosTime.textContent = h + ':' + m;

  /* 渲染联系人列表 */
  const primaryContacts = appData.contacts.filter(function(c) { return c.isPrimary; });
  const otherContacts = appData.contacts.filter(function(c) { return !c.isPrimary; });
  if (sosContacts) {
    sosContacts.textContent = primaryContacts.concat(otherContacts).map(function(c) { return c.name + ' ' + c.phone; }).join('、');
  }

  showModal('modal-sos');
}

/* SOS 拨打按钮 */
document.addEventListener('click', function(e) {
  const sosCallBtn = e.target.closest('.sos-call-btn');
  if (sosCallBtn) {
    const primaryContact = appData.contacts.find(function(c) { return c.isPrimary; });
    if (primaryContact) {
      showToast('📞 正在拨打 ' + primaryContact.name + '...', 'success');
    } else {
      showToast('⚠️ 请先设置主联系人', 'warn');
    }
  }
});

/* ===== 围栏编辑弹窗 ===== */
let editingFenceId = null;

function openFenceEditor(fenceId) {
  editingFenceId = fenceId;
  const fence = appData.fences.find(function(f) { return f.id === fenceId; });
  if (!fence) return;

  const nameInput = document.getElementById('fence-name');
  const radiusSlider = document.getElementById('fence-radius');
  const radiusValue = document.getElementById('fence-radius-value');
  const actionItems = document.querySelectorAll('.fence-action-item');

  if (nameInput) nameInput.value = fence.name;
  if (radiusSlider) {
    radiusSlider.value = fence.radius;
    if (radiusValue) radiusValue.textContent = fence.radius + 'm';
  }

  /* 设置触发动作选中状态 */
  actionItems.forEach(function(item) {
    item.classList.remove('selected');
    if (item.dataset.value === fence.action) {
      item.classList.add('selected');
    }
  });

  showModal('modal-fence');
}

function saveFence() {
  const fence = appData.fences.find(function(f) { return f.id === editingFenceId; });
  if (!fence) return;

  const nameInput = document.getElementById('fence-name');
  const radiusSlider = document.getElementById('fence-radius');
  const selectedAction = document.querySelector('.fence-action-item.selected');

  if (nameInput) fence.name = nameInput.value;
  if (radiusSlider) fence.radius = parseInt(radiusSlider.value);
  if (selectedAction) fence.action = selectedAction.dataset.value;

  localStorage.setItem('badge_fences', JSON.stringify(appData.fences));

  hideModal('modal-fence');
  renderFences();
  updateFenceCircles();
}

/* 围栏半径滑块实时更新 */
document.addEventListener('input', function(e) {
  if (e.target.id === 'fence-radius') {
    const valueEl = document.getElementById('fence-radius-value');
    if (valueEl) valueEl.textContent = e.target.value + 'm';
  }
});

/* 触发动作选择 */
document.addEventListener('click', function(e) {
  const item = e.target.closest('.fence-action-item');
  if (item) {
    document.querySelectorAll('.fence-action-item').forEach(function(i) { i.classList.remove('selected'); });
    item.classList.add('selected');
  }
});

/* ===== 联系人管理弹窗 ===== */
function openContactManager() {
  renderModalContacts();
  showModal('modal-contact');
}

function renderModalContacts() {
  const container = document.getElementById('modal-contact-list');
  if (!container) return;

  container.innerHTML = '';
  appData.contacts.forEach(function(contact) {
    const item = document.createElement('div');
    item.className = 'modal-contact-item';
    item.id = 'modal-contact-' + contact.id;

    let actionsHtml = '';
    if (!contact.isPrimary) {
      actionsHtml += '<button class="modal-contact-set-primary" title="设为主联系人" onclick="setPrimaryContact(' + contact.id + ')">★</button>';
    }
    actionsHtml += '<button class="modal-contact-delete" title="删除" onclick="confirmDeleteContact(' + contact.id + ')">✕</button>';

    item.innerHTML =
      '<div class="modal-contact-avatar">' + contact.avatar + '</div>' +
      '<div class="modal-contact-info">' +
        '<div class="modal-contact-name">' + contact.name + (contact.isPrimary ? ' <span class="modal-contact-primary">主联系人</span>' : '') + '</div>' +
        '<div class="modal-contact-phone">' + contact.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:4px">' + actionsHtml + '</div>';

    container.appendChild(item);
  });
}

function setPrimaryContact(id) {
  appData.contacts.forEach(function(c) { c.isPrimary = false; });
  const contact = appData.contacts.find(function(c) { return c.id === id; });
  if (contact) contact.isPrimary = true;
  localStorage.setItem('badge_contacts', JSON.stringify(appData.contacts));
  renderModalContacts();
  renderContacts();
}

function confirmDeleteContact(id) {
  deleteConfirmId = id;
  const item = document.getElementById('modal-contact-' + id);
  if (item) {
    /* 检查是否已有确认行 */
    if (item.querySelector('.confirm-delete')) return;
    const confirmDiv = document.createElement('div');
    confirmDiv.className = 'confirm-delete';
    confirmDiv.innerHTML = '确认删除？<button class="confirm-delete__btn confirm-delete__btn--yes" onclick="deleteContact(' + id + ')">删除</button><button class="confirm-delete__btn confirm-delete__btn--no" onclick="cancelDelete()">取消</button>';
    item.appendChild(confirmDiv);
  }
}

function cancelDelete() {
  deleteConfirmId = null;
  document.querySelectorAll('.confirm-delete').forEach(function(el) { el.remove(); });
}

function deleteContact(id) {
  appData.contacts = appData.contacts.filter(function(c) { return c.id !== id; });
  /* 如果删除的是主联系人，自动设置第一个为主联系人 */
  if (appData.contacts.length > 0 && !appData.contacts.some(function(c) { return c.isPrimary; })) {
    appData.contacts[0].isPrimary = true;
  }
  localStorage.setItem('badge_contacts', JSON.stringify(appData.contacts));
  renderModalContacts();
  renderContacts();
  cancelDelete();
}

function addContact() {
  const nameInput = document.getElementById('new-contact-name');
  const phoneInput = document.getElementById('new-contact-phone');

  const name = nameInput ? nameInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';

  if (!name || !phone) {
    showNotification('⚠️', 'info', '提示', '请填写称呼和手机号');
    return;
  }
  if (!/^1\d{10}$/.test(phone)) {
    showNotification('⚠️', 'warn', '格式错误', '手机号应为 11 位数字');
    return;
  }

  const avatarMap = { '爸爸': '👨', '妈妈': '👩', '爷爷': '👴', '奶奶': '👵', '外公': '👨‍🦳', '外婆': '👩‍🦳', '哥哥': '🧑', '姐姐': '👧', '叔叔': '🧔', '阿姨': '👩‍🦰' };
  const avatar = avatarMap[name] || '👤';

  const newContact = {
    id: Date.now(),
    name: name,
    phone: phone,
    avatar: avatar,
    isPrimary: appData.contacts.length === 0
  };

  appData.contacts.push(newContact);
  localStorage.setItem('badge_contacts', JSON.stringify(appData.contacts));

  if (nameInput) nameInput.value = '';
  if (phoneInput) phoneInput.value = '';

  renderModalContacts();
  renderContacts();
}

/* ===== 渲染设置页联系人列表 ===== */
function renderContacts() {
  const container = document.getElementById('settings-contacts');
  if (!container) return;

  container.innerHTML = '';
  appData.contacts.forEach(function(contact) {
    const item = document.createElement('div');
    item.className = 'contact-item';

    const tagHtml = contact.isPrimary ? '<span class="contact-tag">主联系人</span>' : '';

    item.innerHTML =
      '<div class="contact-avatar">' + contact.avatar + '</div>' +
      '<div class="contact-info">' +
        '<div class="contact-name">' + contact.name + '</div>' +
        '<div class="contact-phone">' + contact.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') + '</div>' +
      '</div>' +
      '<div class="contact-actions">' +
        tagHtml +
      '</div>';

    container.appendChild(item);
  });

  /* 添加联系人按钮 */
  const addBtn = document.createElement('button');
  addBtn.className = 'add-contact-btn';
  addBtn.textContent = '+ 添加联系人';
  addBtn.onclick = openContactManager;
  container.appendChild(addBtn);
}

/* ===== 渲染围栏卡片 ===== */
function renderFences() {
  const container = document.getElementById('settings-fences');
  if (!container) return;

  container.innerHTML = '';
  appData.fences.forEach(function(fence) {
    const actionText = fence.action === 'leave' ? '离开时通知' : fence.action === 'arrive' ? '到达时通知' : '离开和到达都通知';
    const card = document.createElement('div');
    card.className = 'zone-card';
    card.onclick = function() { openFenceEditor(fence.id); };
    card.innerHTML =
      '<div class="zone-header">' +
        '<div class="zone-name">' + fence.emoji + ' ' + fence.name + '</div>' +
        '<div class="zone-radius">半径 ' + fence.radius + 'm</div>' +
      '</div>' +
      '<div class="zone-desc">中心：' + fence.center + ' · ' + actionText + '</div>';
    container.appendChild(card);
  });

  /* 添加围栏按钮 */
  const addCard = document.createElement('div');
  addCard.className = 'zone-card';
  addCard.onclick = function() { addNewFence(); };
  addCard.innerHTML = '<div class="zone-header"><div class="zone-name" style="color:var(--muted)">+ 添加围栏</div></div>';
  container.appendChild(addCard);
}

function addNewFence() {
  const newFence = {
    id: Date.now(),
    name: '新围栏',
    center: '自定义位置',
    radius: 500,
    action: 'leave',
    emoji: '📍'
  };
  appData.fences.push(newFence);
  localStorage.setItem('badge_fences', JSON.stringify(appData.fences));
  openFenceEditor(newFence.id);
}

/* ===== 远程配置 ===== */
function renderRemoteConfig() {
  const refreshEl = document.getElementById('remote-refresh');
  const silentStartEl = document.getElementById('remote-silent-start');
  const silentEndEl = document.getElementById('remote-silent-end');

  if (refreshEl) refreshEl.value = appData.remoteConfig.refreshRate;
  if (silentStartEl) silentStartEl.value = appData.remoteConfig.silentStart;
  if (silentEndEl) silentEndEl.value = appData.remoteConfig.silentEnd;
}

function saveRemoteConfig() {
  const refreshEl = document.getElementById('remote-refresh');
  const silentStartEl = document.getElementById('remote-silent-start');
  const silentEndEl = document.getElementById('remote-silent-end');

  if (refreshEl) appData.remoteConfig.refreshRate = parseInt(refreshEl.value);
  if (silentStartEl) appData.remoteConfig.silentStart = silentStartEl.value;
  if (silentEndEl) appData.remoteConfig.silentEnd = silentEndEl.value;

  localStorage.setItem('badge_remote', JSON.stringify(appData.remoteConfig));
  showNotification('✅', 'safe', '保存成功', '远程配置已更新');
}

/* ===== 通知推送模拟 ===== */
function showNotification(icon, type, title, desc) {
  const bar = document.getElementById('notification-bar');
  if (!bar) return;

  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');

  bar.innerHTML =
    '<div class="notification-bar__icon notification-bar__icon--' + type + '">' + icon + '</div>' +
    '<div class="notification-bar__content">' +
      '<div class="notification-bar__title">' + title + '</div>' +
      '<div class="notification-bar__desc">' + desc + '</div>' +
    '</div>' +
    '<div class="notification-bar__time">' + h + ':' + m + '</div>' +
    '<div class="notification-bar__close" onclick="hideNotification(event)">✕</div>';

  bar.classList.add('show');

  /* 5秒后自动隐藏 */
  if (notificationTimer) clearTimeout(notificationTimer);
  notificationTimer = setTimeout(function() {
    bar.classList.remove('show');
  }, 5000);
}

function hideNotification(e) {
  if (e) e.stopPropagation();
  const bar = document.getElementById('notification-bar');
  if (bar) bar.classList.remove('show');
}

function autoNotification() {
  const notif = notifications[notificationIndex % notifications.length];
  showNotification(notif.icon, notif.type, notif.title, notif.desc);
  notificationIndex++;
}

/* 15秒后开始第一次推送，之后每 20 秒推送一次 */
setTimeout(function() {
  autoNotification();
  setInterval(autoNotification, 20000);
}, 15000);

/* ===== 开关切换（带持久化） ===== */
const alertSettings = JSON.parse(localStorage.getItem('badge_alerts')) || {
  leaveFence: true,
  sos: true,
  lowBattery: true,
  arriveLeave: true,
  longStill: false
};

function saveAlertSettings() {
  localStorage.setItem('badge_alerts', JSON.stringify(alertSettings));
}

/* 初始化开关状态 */
function initAlertToggles() {
  const toggles = document.querySelectorAll('.alert-toggle');
  const keys = ['leaveFence', 'sos', 'lowBattery', 'arriveLeave', 'longStill'];
  toggles.forEach(function(toggle, index) {
    const key = keys[index];
    if (alertSettings[key] !== undefined) {
      toggle.classList.toggle('on', alertSettings[key]);
    }
    
    toggle.addEventListener('click', function() {
      const isOn = toggle.classList.contains('on');
      alertSettings[key] = isOn;
      saveAlertSettings();
      
      const names = ['离开安全围栏', 'SOS 紧急呼叫', '低电量提醒', '到达/离开通知', '长时间静止提醒'];
      showToast('🔔 ' + names[index] + (isOn ? '已开启' : '已关闭'), isOn ? 'success' : 'info');
    });
  });
}

/* DOMContentLoaded 时初始化开关 */
document.addEventListener('DOMContentLoaded', function() {
  initAlertToggles();
});

/* ===== SOS 按钮 ===== */
document.querySelector('.sos-btn').addEventListener('click', handleSOS);

/* ===== 地图点位点击（POI） ===== */
document.querySelector('.map-dot.school').addEventListener('click', function() {
  focusPOI('school');
});

document.querySelector('.map-dot.home').addEventListener('click', function() {
  focusPOI('home');
});

document.querySelector('.map-dot.child').addEventListener('click', function() {
  focusPOI('child');
});

/* ===== 退出登录 ===== */
function handleLogout() {
  /* 用自定义弹窗代替 confirm */
  const modal = document.createElement('div');
  modal.className = 'modal-overlay active';
  modal.id = 'modal-logout-confirm';
  modal.innerHTML =
    '<div class="modal" style="transform:translateY(0)">' +
      '<div class="modal-handle"></div>' +
      '<div class="modal-header">' +
        '<span class="modal-header__title">退出登录</span>' +
        '<button class="modal-close" onclick="document.getElementById(\'modal-logout-confirm\').remove();document.body.style.overflow=\'\'">✕</button>' +
      '</div>' +
      '<div class="modal-body" style="text-align:center;padding:1.5rem">' +
        '<p style="font-size:0.9rem;color:var(--muted)">确定要退出登录吗？</p>' +
      '</div>' +
      '<div class="modal-footer">' +
        '<button class="btn-cancel" onclick="document.getElementById(\'modal-logout-confirm\').remove();document.body.style.overflow=\'\'">取消</button>' +
        '<button class="btn-save" style="background:linear-gradient(135deg,var(--danger),#e11d48)" onclick="doLogout()">确认退出</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

function doLogout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('username');
  window.location.href = '../index.html';
}

/* ===== 徽章管理 ===== */
let pendingDeleteBadgeId = null;
let selectedAvatar = '👦';

/* 渲染首页徽章切换器 */
function renderBadgeSelector() {
  const container = document.getElementById('badge-selector');
  if (!container) return;

  container.innerHTML = '';
  appData.badges.forEach(function(badge) {
    const item = document.createElement('div');
    item.className = 'badge-chip' + (badge.id === appData.activeBadgeId ? ' active' : '');
    item.innerHTML =
      '<span class="badge-chip__avatar">' + badge.avatar + '</span>' +
      '<span class="badge-chip__name">' + badge.name + '</span>' +
      '<span class="badge-chip__battery">' + Math.round(badge.battery) + '%</span>';
    item.onclick = function() { switchBadge(badge.id); };
    container.appendChild(item);
  });
}

/* 切换当前徽章 */
function switchBadge(badgeId) {
  appData.activeBadgeId = badgeId;
  saveBadges();
  appData.trail = [];

  /* 更新地图点位 */
  const badge = getActiveBadge();
  const dotEl = document.querySelector('.map-dot.child');
  const ringEl = document.querySelector('.map-dot.ring');
  if (dotEl) {
    dotEl.style.top = badge.childY + '%';
    dotEl.style.left = badge.childX + '%';
    dotEl.textContent = badge.avatar;
  }
  if (ringEl) {
    ringEl.style.top = badge.childY + '%';
    ringEl.style.left = badge.childX + '%';
  }

  /* 清除旧轨迹 */
  const canvas = document.getElementById('trail-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  renderBadgeSelector();
  renderDeviceCard();
  updateDistances();
  updateBattery();
  showToast('🔄 已切换到 ' + badge.name, 'success');
}

/* 渲染设备卡片 */
function renderDeviceCard() {
  const container = document.getElementById('device-card-container');
  if (!container) return;

  const badge = getActiveBadge();
  const batteryClass = badge.battery > 50 ? 'device-battery--high' : badge.battery > 20 ? 'device-battery--medium' : 'device-battery--low';
  const batteryIcon = badge.battery > 50 ? '🔋' : '🪫';

  container.innerHTML =
    '<div class="device-card">' +
      '<div class="device-header">' +
        '<div class="device-avatar">' + badge.avatar + '</div>' +
        '<div class="device-info">' +
          '<div class="device-name">' + badge.name + '的徽章</div>' +
          '<div class="device-status">' +
            '<div class="dot"></div>' +
            '<span>' + (badge.online ? '在线' : '离线') + '</span>' +
            '<span class="device-battery ' + batteryClass + '">' +
              '<span class="device-battery__icon" id="battery-icon">' + batteryIcon + '</span>' +
              '<span id="battery-text">' + Math.round(badge.battery) + '%</span>' +
            '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="device-meta">' +
        '<div class="device-meta-item"><div class="dm-num">GPS</div><div class="dm-label">定位精度</div></div>' +
        '<div class="device-meta-item"><div class="dm-num">2.1km</div><div class="dm-label">今日活动范围</div></div>' +
        '<div class="device-meta-item"><div class="dm-num">7天</div><div class="dm-label">续航</div></div>' +
      '</div>' +
    '</div>';
}

/* 渲染设置页徽章列表 */
function renderBadgeList() {
  const container = document.getElementById('settings-badges');
  if (!container) return;

  container.innerHTML = '';
  appData.badges.forEach(function(badge) {
    const item = document.createElement('div');
    item.className = 'badge-manage-item';
    item.innerHTML =
      '<div class="badge-manage-avatar">' + badge.avatar + '</div>' +
      '<div class="badge-manage-info">' +
        '<div class="badge-manage-name">' + badge.name + (badge.id === appData.activeBadgeId ? ' <span class="badge-manage-tag">当前</span>' : '') + '</div>' +
        '<div class="badge-manage-desc">电量 ' + Math.round(badge.battery) + '% · ' + (badge.online ? '在线' : '离线') + '</div>' +
      '</div>' +
      '<div class="badge-manage-actions">' +
        (badge.id !== appData.activeBadgeId ? '<button class="badge-switch-btn" onclick="switchBadge(' + badge.id + ')">切换</button>' : '') +
        '<button class="badge-delete-btn" onclick="openDeleteBadge(' + badge.id + ')">✕</button>' +
      '</div>';
    container.appendChild(item);
  });

  /* 添加徽章按钮 */
  const addBtn = document.createElement('button');
  addBtn.className = 'add-badge-btn';
  addBtn.textContent = '+ 添加徽章';
  addBtn.onclick = openAddBadge;
  container.appendChild(addBtn);
}

/* 打开添加徽章弹窗 */
function openAddBadge() {
  document.getElementById('badge-name-input').value = '';
  selectedAvatar = '👦';
  document.querySelectorAll('.avatar-item').forEach(function(item) {
    item.classList.toggle('selected', item.dataset.avatar === selectedAvatar);
  });
  showModal('modal-badge');
}

/* 头像选择 */
document.addEventListener('click', function(e) {
  const avatarItem = e.target.closest('.avatar-item');
  if (avatarItem) {
    document.querySelectorAll('.avatar-item').forEach(function(i) { i.classList.remove('selected'); });
    avatarItem.classList.add('selected');
    selectedAvatar = avatarItem.dataset.avatar;
  }
});

/* 添加徽章 */
function addBadge() {
  const nameInput = document.getElementById('badge-name-input');
  const name = nameInput ? nameInput.value.trim() : '';

  if (!name) {
    showToast('⚠️ 请输入孩子昵称', 'warn');
    return;
  }
  if (name.length > 10) {
    showToast('⚠️ 昵称最多 10 个字符', 'warn');
    return;
  }

  const newBadge = {
    id: Date.now(),
    name: name,
    avatar: selectedAvatar,
    battery: 100,
    childX: 30 + Math.random() * 40,
    childY: 30 + Math.random() * 40,
    online: true
  };

  appData.badges.push(newBadge);
  appData.activeBadgeId = newBadge.id;
  saveBadges();

  hideModal('modal-badge');
  appData.trail = [];
  renderBadgeSelector();
  renderDeviceCard();
  renderBadgeList();
  updateDistances();
  updateBattery();

  /* 更新地图点位 */
  const dotEl = document.querySelector('.map-dot.child');
  const ringEl = document.querySelector('.map-dot.ring');
  if (dotEl) {
    dotEl.style.top = newBadge.childY + '%';
    dotEl.style.left = newBadge.childX + '%';
    dotEl.textContent = newBadge.avatar;
  }
  if (ringEl) {
    ringEl.style.top = newBadge.childY + '%';
    ringEl.style.left = newBadge.childX + '%';
  }

  showToast('✅ 已添加 ' + name + ' 的徽章', 'success');
}

/* 打开删除确认弹窗 */
function openDeleteBadge(badgeId) {
  if (appData.badges.length <= 1) {
    showToast('⚠️ 至少保留一个徽章', 'warn');
    return;
  }
  pendingDeleteBadgeId = badgeId;
  const badge = appData.badges.find(function(b) { return b.id === badgeId; });
  const nameEl = document.getElementById('delete-badge-name');
  if (nameEl && badge) nameEl.textContent = badge.name;
  showModal('modal-badge-delete');
}

/* 确认删除徽章 */
function confirmDeleteBadge() {
  if (!pendingDeleteBadgeId) return;

  const wasActive = pendingDeleteBadgeId === appData.activeBadgeId;
  appData.badges = appData.badges.filter(function(b) { return b.id !== pendingDeleteBadgeId; });

  /* 如果删除的是当前徽章，切换到第一个 */
  if (wasActive) {
    appData.activeBadgeId = appData.badges[0].id;
    appData.trail = [];
  }

  saveBadges();
  hideModal('modal-badge-delete');
  pendingDeleteBadgeId = null;

  renderBadgeSelector();
  renderDeviceCard();
  renderBadgeList();
  updateDistances();
  updateBattery();

  /* 更新地图点位 */
  if (wasActive) {
    const badge = getActiveBadge();
    const dotEl = document.querySelector('.map-dot.child');
    const ringEl = document.querySelector('.map-dot.ring');
    if (dotEl) {
      dotEl.style.top = badge.childY + '%';
      dotEl.style.left = badge.childX + '%';
      dotEl.textContent = badge.avatar;
    }
    if (ringEl) {
      ringEl.style.top = badge.childY + '%';
      ringEl.style.left = badge.childX + '%';
    }
  }

  showToast('🗑️ 徽章已删除', 'info');
}

/* ===== 初始化 ===== */
document.addEventListener('DOMContentLoaded', function() {
  initMap();
  renderBadgeSelector();
  renderDeviceCard();
  updateDistances();
  updateBattery();
});
