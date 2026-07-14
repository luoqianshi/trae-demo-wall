// ============ Theme Configs (萌系可爱水墨国风) ============
const THEMES = {
  lively: {
    bg:'#F7F4ED', bgSurface:'#EFE9DC', bgElevated:'#FBF9F3', bgInset:'#E8E0D0',
    textPrimary:'#2C2A26', textSecondary:'#5A5650', textMuted:'#8C857A', textInverse:'#FBF9F3',
    border:'#D6CDB8', borderLight:'#E4DCC8',
    brand:'#B5483E', brandLight:'#F5E4E0', brandDark:'#963A31',
    gold:'#B8893A', goldLight:'#F3EAD3', jade:'#5B7A6A', jadeLight:'#E8F0EA',
    indigo:'#4A5F7A', indigoLight:'#E6EBF2',
    success:'#5B7A6A', successLight:'#E8F0EA', warning:'#B8893A', warningLight:'#F3EAD3',
    error:'#B5483E', errorLight:'#F5E4E0', info:'#4A5F7A', infoLight:'#E6EBF2'
  },
  forest: {
    bg:'#F2F4EE', bgSurface:'#E8EDE2', bgElevated:'#FAFBF6', bgInset:'#DFE5D8',
    textPrimary:'#2A2E26', textSecondary:'#56594F', textMuted:'#888B7E', textInverse:'#FAFBF6',
    border:'#CFD6C2', borderLight:'#E0E5D4',
    brand:'#5B7A5A', brandLight:'#E8F0E6', brandDark:'#476148',
    gold:'#A89048', goldLight:'#F3EDD8', jade:'#7A9A6E', jadeLight:'#EAF0E6',
    indigo:'#5A7080', indigoLight:'#E8EDF2',
    success:'#5B7A5A', successLight:'#E8F0E6', warning:'#A89048', warningLight:'#F3EDD8',
    error:'#A85850', errorLight:'#F2E2E0', info:'#5A7080', infoLight:'#E8EDF2'
  },
  blue: {
    bg:'#F1F3F6', bgSurface:'#E7EBF0', bgElevated:'#FAFBFD', bgInset:'#DEE3EA',
    textPrimary:'#282A30', textSecondary:'#54565E', textMuted:'#868A94', textInverse:'#FAFBFD',
    border:'#CCD2DC', borderLight:'#DEE3EC',
    brand:'#4A6580', brandLight:'#E6ECF2', brandDark:'#3A526A',
    gold:'#A09058', goldLight:'#F2EDDC', jade:'#5A8A7A', jadeLight:'#E6F0EC',
    indigo:'#4A5A78', indigoLight:'#E6E9F2',
    success:'#5A8A7A', successLight:'#E6F0EC', warning:'#A09058', warningLight:'#F2EDDC',
    error:'#A05858', errorLight:'#F2E4E4', info:'#4A5A78', infoLight:'#E6E9F2'
  }
};

let currentTheme = 'lively';
let selectedTheme = null;

function applyThemeVars(themeName) {
  const t = THEMES[themeName];
  if (!t) return;
  const r = document.documentElement.style;
  r.setProperty('--color-bg', t.bg);
  r.setProperty('--color-bg-surface', t.bgSurface);
  r.setProperty('--color-bg-elevated', t.bgElevated);
  r.setProperty('--color-bg-inset', t.bgInset);
  r.setProperty('--color-text-primary', t.textPrimary);
  r.setProperty('--color-text-secondary', t.textSecondary);
  r.setProperty('--color-text-muted', t.textMuted);
  r.setProperty('--color-text-inverse', t.textInverse);
  r.setProperty('--color-border', t.border);
  r.setProperty('--color-border-light', t.borderLight);
  r.setProperty('--color-brand', t.brand);
  r.setProperty('--color-brand-light', t.brandLight);
  r.setProperty('--color-brand-dark', t.brandDark);
  r.setProperty('--color-gold', t.gold);
  r.setProperty('--color-gold-light', t.goldLight);
  r.setProperty('--color-jade', t.jade);
  r.setProperty('--color-jade-light', t.jadeLight);
  r.setProperty('--color-indigo', t.indigo);
  r.setProperty('--color-indigo-light', t.indigoLight);
  r.setProperty('--color-success', t.success);
  r.setProperty('--color-success-light', t.successLight);
  r.setProperty('--color-warning', t.warning);
  r.setProperty('--color-warning-light', t.warningLight);
  r.setProperty('--color-error', t.error);
  r.setProperty('--color-error-light', t.errorLight);
  r.setProperty('--color-info', t.info);
  r.setProperty('--color-info-light', t.infoLight);
  r.setProperty('--surface-card', t.bgElevated);
  r.setProperty('--surface-card-border', '1px solid ' + t.borderLight);
  r.setProperty('--surface-elevated-border', '1px solid ' + t.border);
  currentTheme = themeName;
}

function selectThemeCard(name) {
  selectedTheme = name;
  document.querySelectorAll('.theme-card').forEach(c => {
    c.style.borderColor = 'var(--color-border-light)';
    c.style.background = 'var(--color-bg-elevated)';
  });
  const cardMap = { lively:'theme-card-lively', forest:'theme-card-forest', blue:'theme-card-blue' };
  const card = document.querySelector('[data-dom-id="'+cardMap[name]+'"]');
  if (card) {
    card.style.borderColor = THEMES[name].brand;
    card.style.background = THEMES[name].brandLight;
  }
  const btn = document.getElementById('themeConfirmBtn');
  btn.disabled = false;
  btn.classList.remove('cursor-not-allowed','opacity-50');
}

function applyTheme() {
  if (!selectedTheme) return;
  applyThemeVars(selectedTheme);
  navigateTo('sprite-select');
}

let navHistory = ['theme-select'];

function navigateTo(pageId) {
  const currentPage = document.querySelector('.proto-page.active');
  if (currentPage) {
    const currentId = currentPage.id.replace('page-', '');
    if (currentId !== pageId) navHistory.push(pageId);
  } else {
    navHistory.push(pageId);
  }
  document.querySelectorAll('.proto-page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + pageId);
  if (page) {
    page.classList.add('active');
    const pc = document.getElementById('phoneContent');
    if (pc) pc.scrollTop = 0;
  }
  const switchBtn = document.getElementById('themeSwitchBtn');
  if (switchBtn) {
    switchBtn.style.display = (pageId === 'theme-select') ? 'none' : 'flex';
  }
  if (window.lucide) lucide.createIcons();
  // 刷新精灵伙伴元素（贯穿全系统）
  refreshSpriteCompanions();
  // 进入家庭页时初始化家庭视图
  if (pageId === 'family' && typeof renderFamilyView === 'function') {
    renderFamilyView();
  }
}

function goBack() {
  if (navHistory.length > 1) {
    navHistory.pop();
    const prevPage = navHistory[navHistory.length - 1];
    document.querySelectorAll('.proto-page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('page-' + prevPage);
    if (page) {
      page.style.animation = 'none';
      page.offsetHeight;
      page.style.animation = '';
      page.classList.add('active');
      document.getElementById('phoneContent').scrollTop = 0;
    }
    const switchBtn = document.getElementById('themeSwitchBtn');
    if (switchBtn) {
      switchBtn.style.display = (prevPage === 'theme-select') ? 'none' : 'flex';
    }
    if (window.lucide) lucide.createIcons();
    refreshSpriteCompanions();
  }
}

let spriteSelected = false;
// === 精灵全局状态（贯穿整个系统）===
const SPRITE_LIBRARY = {
  '1': { name:'貔貅', img:'assets/貔貅.jpg', meaning:'守财', trait:'守护宝物，招财进宝', greeting:'小貔貅守好你的宝物啦' },
  '2': { name:'九色鹿', img:'assets/九色鹿.jpg', meaning:'仁善', trait:'善良仁慈，守护安宁', greeting:'九色鹿伴你安宁收纳' },
  '3': { name:'麒麟', img:'assets/麒麟.jpg', meaning:'祥瑞', trait:'祥瑞太平，仁厚祥和', greeting:'麒麟送来祥瑞之收纳' },
  '4': { name:'白泽', img:'assets/白泽.jpg', meaning:'通晓', trait:'通晓万物，智慧吉祥', greeting:'白泽通晓你家万物所在' },
  '5': { name:'当康', img:'assets/当康.jpg', meaning:'丰足', trait:'丰收富足，丰衣足食', greeting:'当康祝你家丰衣足食' },
  '6': { name:'锦鲤', img:'assets/锦鲤.jpg', meaning:'幸运', trait:'好运连连，顺遂如意', greeting:'锦鲤附体，收纳顺遂' }
};
let currentSprite = SPRITE_LIBRARY['1']; // 默认貔貅

function toggleSprite(card) {
  document.querySelectorAll('.sprite-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  spriteSelected = true;
  // 记录选择的精灵
  const id = card.getAttribute('data-dom-id').replace('select-sprite-','');
  if (SPRITE_LIBRARY[id]) currentSprite = SPRITE_LIBRARY[id];
  const btn = document.getElementById('selectConfirmBtn');
  btn.disabled = false;
  btn.classList.remove('cursor-not-allowed','opacity-50');
}

// 刷新所有精灵伙伴元素（页面切换后调用）
function refreshSpriteCompanions() {
  // 1. 更新所有 .sprite-companion-img 图片
  document.querySelectorAll('.sprite-companion-img').forEach(el => {
    el.setAttribute('src', currentSprite.img);
    el.setAttribute('alt', currentSprite.name);
  });
  // 2. 更新所有 .sprite-companion-name 文字
  document.querySelectorAll('.sprite-companion-name').forEach(el => {
    el.textContent = currentSprite.name;
  });
  // 3. 更新所有 .sprite-companion-greeting 问候语
  document.querySelectorAll('.sprite-companion-greeting').forEach(el => {
    el.textContent = currentSprite.greeting;
  });
  // 4. 更新所有 .sprite-companion-meaning 意义标签
  document.querySelectorAll('.sprite-companion-meaning').forEach(el => {
    el.textContent = currentSprite.meaning;
  });
}

function toggleFurniture(el) {
  const isSelected = el.style.borderWidth === '2px';
  const iconDiv = el.querySelector('div');
  const label = el.querySelector('span');
  if (isSelected) {
    el.style.border = '1px solid var(--color-border-light)';
    el.style.background = 'var(--color-bg-elevated)';
    iconDiv.style.background = 'var(--color-bg-elevated)';
    iconDiv.style.border = '1px solid var(--color-border)';
    iconDiv.innerHTML = '';
    label.style.color = 'var(--color-text-secondary)';
    label.style.fontWeight = '400';
  } else {
    el.style.border = '2px solid var(--color-brand)';
    el.style.background = 'var(--color-brand-light)';
    iconDiv.style.background = 'var(--color-brand)';
    iconDiv.style.border = 'none';
    iconDiv.innerHTML = '<i data-lucide="check" style="width:12px;height:12px; color:var(--color-text-inverse);"></i>';
    label.style.color = 'var(--color-brand)';
    label.style.fontWeight = '500';
  }
  if (window.lucide) lucide.createIcons();
}

function deleteRoom(btn) {
  const roomItem = btn.closest('.config-room-item');
  if (roomItem) {
    roomItem.classList.add('fade-out');
    setTimeout(() => roomItem.remove(), 400);
  }
}

let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toastMsg');
  t.textContent = msg;
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

document.addEventListener('DOMContentLoaded', function() {
  const switchBtn = document.getElementById('themeSwitchBtn');
  if (switchBtn) switchBtn.style.display = 'none';
  if (window.lucide) lucide.createIcons();
  if (switchBtn) {
    switchBtn.addEventListener('click', function() {
      navigateTo('theme-select');
    });
  }
});

// ============ Family Management ============
const ROLE_CONFIG = {
  '妈妈': { color: 'var(--color-brand)', light: 'var(--color-brand-light)', tag: '管理员' },
  '爸爸': { color: 'var(--color-indigo)', light: 'var(--color-indigo-light)', tag: '成员' },
  '宝宝': { color: 'var(--color-gold)', light: 'var(--color-gold-light)', tag: '小帮手' },
  '爷爷': { color: 'var(--color-jade)', light: 'var(--color-jade-light)', tag: '长辈' },
  '奶奶': { color: '#C26B8E', light: '#FAEEF3', tag: '长辈' },
  '其他': { color: 'var(--color-text-muted)', light: 'var(--color-bg-inset)', tag: '成员' }
};

let familyState = {
  exists: false,
  name: '',
  members: [],
  inviteCode: '838261'
};
let inviteSelectedRole = '爸爸';

function renderFamilyView() {
  const empty = document.getElementById('family-empty');
  const content = document.getElementById('family-content');
  if (!empty || !content) return;
  if (familyState.exists) {
    empty.style.display = 'none';
    content.style.display = 'block';
    document.getElementById('family-name-display').textContent = familyState.name;
    document.getElementById('family-summary').textContent = familyState.members.length + '位成员 · 共同管理 ' + (83 + familyState.members.length * 5) + ' 件物品';
    renderMembersList();
  } else {
    empty.style.display = 'flex';
    content.style.display = 'none';
  }
  if (window.lucide) lucide.createIcons();
}

function renderMembersList() {
  const list = document.getElementById('family-members-list');
  if (!list) return;
  list.innerHTML = '';
  familyState.members.forEach(m => {
    const cfg = ROLE_CONFIG[m.role] || ROLE_CONFIG['其他'];
    const div = document.createElement('div');
    div.className = 'flex items-center gap-3 p-3';
    div.style.cssText = 'background:var(--color-bg-elevated); border:1px solid var(--color-border-light); border-radius:var(--radius-lg);';
    div.innerHTML =
      '<div class="family-avatar" style="background:' + cfg.color + ';">' + m.name.charAt(0) + '</div>' +
      '<div class="flex-1 min-w-0">' +
        '<div class="flex items-center gap-2">' +
          '<span class="font-medium text-sm" style="color:var(--color-text-primary);">' + m.name + '</span>' +
          '<span class="role-tag" style="background:' + cfg.light + '; color:' + cfg.color + ';">' + cfg.tag + '</span>' +
        '</div>' +
        '<p class="mt-0.5 text-xs" style="color:var(--color-text-muted);">收纳了 ' + (Math.floor(Math.random() * 30) + 5) + ' 件物品</p>' +
      '</div>' +
      '<i data-lucide="chevron-right" style="width:16px;height:16px; color:var(--color-text-muted);"></i>';
    list.appendChild(div);
  });
  if (window.lucide) lucide.createIcons();
}

// ===== Create / Edit Family =====
function openCreateFamilyModal() {
  const m = document.getElementById('create-family-modal');
  const title = document.getElementById('create-family-title');
  const input = document.getElementById('create-family-input');
  if (familyState.exists) {
    title.textContent = '编辑家庭';
    input.value = familyState.name;
  } else {
    title.textContent = '创建家庭';
    input.value = '';
  }
  m.style.display = 'block';
  if (window.lucide) lucide.createIcons();
}
function closeCreateFamilyModal() {
  document.getElementById('create-family-modal').style.display = 'none';
}
function submitCreateFamily() {
  const name = document.getElementById('create-family-input').value.trim();
  const role = document.getElementById('create-family-role').value;
  if (!name) { showToast('请输入家庭名称'); return; }
  if (!familyState.exists) {
    familyState.exists = true;
    familyState.name = name;
    familyState.members = [{ name: role, role: role }];
    showToast('家庭创建成功');
  } else {
    familyState.name = name;
    showToast('家庭信息已更新');
  }
  closeCreateFamilyModal();
  renderFamilyView();
}

// ===== Join Family =====
function openJoinFamilyModal() {
  document.getElementById('join-family-input').value = '';
  document.getElementById('join-family-modal').style.display = 'block';
  if (window.lucide) lucide.createIcons();
}
function closeJoinFamilyModal() {
  document.getElementById('join-family-modal').style.display = 'none';
}
function submitJoinFamily() {
  const code = document.getElementById('join-family-input').value.trim();
  if (code.length !== 6) { showToast('请输入6位邀请码'); return; }
  familyState.exists = true;
  familyState.name = '温馨小家';
  familyState.members = [{ name: '我', role: '宝宝' }];
  showToast('已加入家庭');
  closeJoinFamilyModal();
  renderFamilyView();
}

// ===== Invite Member =====
function openInviteModal() {
  document.getElementById('invite-name-input').value = '';
  document.getElementById('invite-code-display').textContent = familyState.inviteCode;
  renderRoleOptions();
  document.getElementById('invite-modal').style.display = 'block';
  if (window.lucide) lucide.createIcons();
}
function closeInviteModal() {
  document.getElementById('invite-modal').style.display = 'none';
}
function renderRoleOptions() {
  const container = document.getElementById('invite-role-options');
  if (!container) return;
  container.innerHTML = '';
  Object.keys(ROLE_CONFIG).forEach(role => {
    const cfg = ROLE_CONFIG[role];
    const isSelected = role === inviteSelectedRole;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = role;
    btn.className = 'py-2 text-xs font-medium';
    btn.style.cssText = 'border-radius:var(--radius-md); border:1px solid ' + (isSelected ? cfg.color : 'var(--color-border)') + '; background:' + (isSelected ? cfg.color : 'var(--color-bg)') + '; color:' + (isSelected ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)') + ';';
    btn.onclick = function() { inviteSelectedRole = role; renderRoleOptions(); };
    container.appendChild(btn);
  });
}
function submitInvite() {
  const name = document.getElementById('invite-name-input').value.trim();
  if (!name) { showToast('请输入成员昵称'); return; }
  familyState.members.push({ name: name, role: inviteSelectedRole });
  showToast('已邀请 ' + name + ' 加入家庭');
  closeInviteModal();
  renderFamilyView();
}