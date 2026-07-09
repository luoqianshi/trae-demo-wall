/**
 * 家物记 Pro — 清新浅绿版
 * 拍照AI全量识别 · 语音查找 · 归位指引 · 物品换位 · 购物查库存 · 家庭同步
 */
(function() {
'use strict';

// ===== 数据管理 =====
const DB = {
  key: 'jiwuji_v5',
  init() {
    if (!localStorage.getItem(this.key)) {
      const d = {
        items: [
          { id: 1, name: '医药箱', emoji: '💊', room: '主卧', location: '柜子·第二层', category: '药品', lastUsed: '2026-07-01', photo: null, defaultRoom: '主卧', defaultLocation: '柜子·第二层', addedBy: '妈妈', addedAt: '2026-06-01' },
          { id: 2, name: '螺丝刀套装', emoji: '🔧', room: '阳台', location: '收纳箱·第一层', category: '工具', lastUsed: '2026-06-20', photo: null, defaultRoom: '阳台', defaultLocation: '收纳箱·第一层', addedBy: '爸爸', addedAt: '2026-06-05' },
          { id: 3, name: '料理机', emoji: '🍳', room: '厨房', location: '柜子·第三层', category: '厨电', lastUsed: '2026-04-15', photo: null, defaultRoom: '厨房', defaultLocation: '柜子·第三层', addedBy: '妈妈', addedAt: '2026-05-20' },
          { id: 4, name: '冬被收纳箱', emoji: '🛏', room: '次卧', location: '床底·右侧', category: '床品', lastUsed: '2026-03-01', photo: null, defaultRoom: '次卧', defaultLocation: '床底·右侧', addedBy: '妈妈', addedAt: '2026-04-10' },
          { id: 5, name: '充电宝', emoji: '🔋', room: '客厅', location: '抽屉·第一格', category: '电子产品', lastUsed: '2026-07-05', photo: null, defaultRoom: '客厅', defaultLocation: '抽屉·第一格', addedBy: '爸爸', addedAt: '2026-06-15' },
          { id: 6, name: '儿童绘本', emoji: '📚', room: '儿童房', location: '书架·B层', category: '书籍', lastUsed: '2026-07-06', photo: null, defaultRoom: '儿童房', defaultLocation: '书架·B层', addedBy: '宝宝', addedAt: '2026-06-20' },
          { id: 7, name: '雨伞', emoji: '☂', room: '客厅', location: '门后·挂钩', category: '日用品', lastUsed: '2026-06-28', photo: null, defaultRoom: '玄关', defaultLocation: '柜子·第二层', addedBy: '妈妈', addedAt: '2026-05-15' },
          { id: 8, name: '防晒霜', emoji: '🧴', room: '主卧', location: '台面·表面', category: '日用品', lastUsed: '2026-05-10', photo: null, defaultRoom: '主卧', defaultLocation: '台面·表面', addedBy: '妈妈', addedAt: '2026-06-01' },
          { id: 9, name: '耳机', emoji: '🎧', room: '书房', location: '抽屉·第一格', category: '电子产品', lastUsed: '2026-07-02', photo: null, defaultRoom: '书房', defaultLocation: '抽屉·第一格', addedBy: '爸爸', addedAt: '2026-06-25' },
          { id: 10, name: '烘焙模具', emoji: '🧁', room: '厨房', location: '柜子·第二层', category: '厨电', lastUsed: '2026-06-30', photo: null, defaultRoom: '厨房', defaultLocation: '柜子·第二层', addedBy: '妈妈', addedAt: '2026-07-01' },
        ],
        members: [
          { name: '妈妈', avatar: '👩', online: true },
          { name: '爸爸', avatar: '👨', online: true },
          { name: '宝宝', avatar: '👧', online: false },
        ],
        activity: [
          { time: '刚刚', text: '妈妈通过拍照识别添加了 3 件物品', who: '妈妈' },
          { time: '3 分钟前', text: '宝宝语音查找了「耳机」', who: '宝宝' },
          { time: '8 分钟前', text: '妈妈将「雨伞」从客厅移到了玄关', who: '妈妈' },
          { time: '15 分钟前', text: '爸爸查询了「料理机」的库存', who: '爸爸' },
          { time: '1 小时前', text: '妈妈添加了「烘焙模具」', who: '妈妈' },
        ]
      };
      localStorage.setItem(this.key, JSON.stringify(d));
    }
  },
  get() { return JSON.parse(localStorage.getItem(this.key)); },
  set(d) { localStorage.setItem(this.key, JSON.stringify(d)); },
  addActivity(text, who) {
    const d = this.get();
    d.activity.unshift({ time: '刚刚', text, who: who || '系统' });
    if (d.activity.length > 30) d.activity.length = 30;
    this.set(d);
  }
};

let currentDetailId = null;
let currentRoomFilter = null;
let currentCatFilter = null;
let recognition = null;
let voiceTarget = null;
let currentReturnItem = null;

// 位置类型常量（用于解析与匹配）
const LOC_TYPES = ['柜子','抽屉','桌子','书架','床底','台面','挂钩','壁柜','收纳箱','门后','墙面','地面','其他'];
const LOC_TIERS = ['第一层','第二层','第三层','第四层','顶层','底层','左侧','右侧','中间','上层','下层','表面','A层','B层','C层','第一格','第二格','第三格','第四格'];

function parseLocationToSelects(location, typeId, tierId) {
  const typeEl = document.getElementById(typeId);
  const tierEl = document.getElementById(tierId);
  if (!typeEl || !tierEl) return;
  let type = '', tier = '';
  if (location.indexOf('·') !== -1) {
    const parts = location.split('·');
    type = parts[0].trim();
    tier = parts[1].trim();
  } else {
    for (let i = 0; i < LOC_TYPES.length; i++) {
      if (location.indexOf(LOC_TYPES[i]) === 0) {
        type = LOC_TYPES[i];
        tier = location.slice(type.length).trim();
        break;
      }
    }
  }
  if (type) {
    const typeOpts = Array.from(typeEl.options).map(function(o) { return o.value || o.text; });
    if (typeOpts.indexOf(type) !== -1) typeEl.value = type;
  }
  if (tier) {
    const tierOpts = Array.from(tierEl.options).map(function(o) { return o.value || o.text; });
    if (tierOpts.indexOf(tier) !== -1) tierEl.value = tier;
  }
}

function combineLocation(typeId, tierId) {
  const type = document.getElementById(typeId).value;
  const tier = document.getElementById(tierId).value;
  return type + '·' + tier;
}

// ===== 页面切换 =====
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(id);
  if (page) page.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.querySelector('.nav-item[data-page="' + id + '"]');
  if (nav) nav.classList.add('active');

  if (id === 'home') renderHome();
  if (id === 'items') renderItems();
  if (id === 'chat') renderChat();
  if (id === 'family') renderFamily();
  if (id === 'photo') resetPhotoPage();
  if (id === 'return') resetReturnPage();
  if (id === 'add') clearAddForm();
  if (id === 'detail') {}
  window.scrollTo(0, 0);
}

// ===== 首页 =====
function renderHome() {
  const d = DB.get();
  const misplaced = d.items.filter(i => i.room !== i.defaultRoom || i.location !== i.defaultLocation);
  document.getElementById('home-item-count').textContent = d.items.length;
  document.getElementById('home-misplaced-count').textContent = misplaced.length;

  const recent = document.getElementById('recent-items');
  const recentItems = [...d.items].sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || '')).slice(0, 4);
  recent.innerHTML = recentItems.length ? renderItemRows(recentItems) : emptyState('还没有物品', '去拍照添加第一件物品吧');

  const mp = document.getElementById('misplaced-items');
  if (misplaced.length === 0) {
    mp.innerHTML = emptyState('全部已归位', '所有物品都在正确的位置上');
  } else {
    mp.innerHTML = renderItemRows(misplaced, true);
  }
}

function emptyState(text, hint) {
  return '<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div><div class="empty-text">' + text + '</div><div class="empty-hint">' + hint + '</div></div>';
}

function renderItemRows(items, showMisplaced) {
  return items.map(function(i) {
    const isMisplaced = showMisplaced && (i.room !== i.defaultRoom || i.location !== i.defaultLocation);
    return '<div class="item-row' + (isMisplaced ? ' misplaced' : '') + '" onclick="openDetail(' + i.id + ')"><div class="item-emoji">' + i.emoji + '</div><div class="item-info"><div class="item-name">' + i.name + '</div><div class="item-loc">' + i.room + ' · ' + i.location + '</div></div><span class="item-tag">' + i.category + '</span></div>';
  }).join('');
}

// ===== 物品列表 =====
function renderItems(filterText) {
  const d = DB.get();
  let items = d.items;
  if (currentRoomFilter) items = items.filter(function(i) { return i.room === currentRoomFilter; });
  if (currentCatFilter) items = items.filter(function(i) { return i.category === currentCatFilter; });
  const txt = filterText || (document.getElementById('search-input')?.value || '');
  if (txt) {
    const f = txt.toLowerCase();
    items = items.filter(function(i) { return i.name.toLowerCase().includes(f) || i.room.toLowerCase().includes(f) || i.category.toLowerCase().includes(f); });
  }

  document.getElementById('items-total').textContent = items.length;

  const rooms = [...new Set(d.items.map(function(i) { return i.room; }))];
  const bar = document.getElementById('room-filter-bar');
  bar.innerHTML = '<span class="chip' + (!currentRoomFilter ? ' active' : '') + '" onclick="setRoomFilter(null)">全部</span>' +
    rooms.map(function(r) { return '<span class="chip' + (currentRoomFilter === r ? ' active' : '') + '" onclick="setRoomFilter(\'' + r + '\')">' + r + '</span>'; }).join('');

  const cats = [...new Set(d.items.map(function(i) { return i.category; }))];
  const cbar = document.getElementById('cat-filter-bar');
  cbar.innerHTML = '<span class="chip' + (!currentCatFilter ? ' active' : '') + '" onclick="setCatFilter(null)">全类别</span>' +
    cats.map(function(c) { return '<span class="chip' + (currentCatFilter === c ? ' active' : '') + '" onclick="setCatFilter(\'' + c + '\')">' + c + '</span>'; }).join('');

  const list = document.getElementById('items-list');
  list.innerHTML = items.length ? renderItemRows(items) : emptyState('没有找到物品', '试试其他关键词，或去添加新物品');
}

function setRoomFilter(room) {
  currentRoomFilter = room;
  renderItems();
}

function setCatFilter(cat) {
  currentCatFilter = cat;
  renderItems();
}

// ===== 物品详情 =====
function openDetail(id) {
  const d = DB.get();
  const item = d.items.find(function(i) { return i.id === id; });
  if (!item) return;
  currentDetailId = id;

  document.getElementById('detail-emoji').textContent = item.emoji;
  document.getElementById('detail-name').textContent = item.name;
  document.getElementById('detail-tag').textContent = item.category;
  document.getElementById('detail-cat').textContent = item.category;
  document.getElementById('detail-location').textContent = item.room + ' · ' + item.location;
  document.getElementById('detail-default-loc').textContent = item.defaultRoom + ' · ' + item.defaultLocation;
  document.getElementById('detail-used').textContent = item.lastUsed;

  const isMisplaced = item.room !== item.defaultRoom || item.location !== item.defaultLocation;
  const banner = document.getElementById('detail-return-banner');
  if (isMisplaced) {
    banner.classList.remove('hidden');
    document.getElementById('detail-return-loc').textContent = item.defaultRoom + ' · ' + item.defaultLocation;
  } else {
    banner.classList.add('hidden');
  }

  document.getElementById('relocate-room').value = item.room;
  parseLocationToSelects(item.location, 'relocate-loc-type', 'relocate-loc-tier');

  showPage('detail');
}

function deleteItem() {
  if (!currentDetailId) return;
  showAlert('确认删除', '删除后将无法恢复，确定要删除这个物品吗？', [
    { text: '取消', cls: 'btn-outline', action: closeAlert },
    { text: '删除', cls: 'btn-danger', action: function() {
      const d = DB.get();
      const item = d.items.find(function(i) { return i.id === currentDetailId; });
      d.items = d.items.filter(function(i) { return i.id !== currentDetailId; });
      DB.addActivity('删除了「' + (item ? item.name : '') + '」', '我');
      DB.set(d);
      closeAlert();
      backToItems();
    }}
  ]);
}

function relocateItem() {
  if (!currentDetailId) return;
  const d = DB.get();
  const item = d.items.find(function(i) { return i.id === currentDetailId; });
  if (!item) return;
  const newRoom = document.getElementById('relocate-room').value;
  const newLoc = combineLocation('relocate-loc-type', 'relocate-loc-tier');

  const oldLoc = item.room + ' · ' + item.location;
  item.room = newRoom;
  item.location = newLoc;
  item.lastUsed = new Date().toISOString().slice(0, 10);
  DB.addActivity('将「' + item.name + '」从 ' + oldLoc + ' 移到了 ' + newRoom + ' · ' + newLoc, '我');
  DB.set(d);
  showAlert('换位成功', '「' + item.name + '」已更新到 ' + newRoom + ' · ' + newLoc + '。', [{ text: '好的', cls: 'btn-primary', action: function() { closeAlert(); openDetail(currentDetailId); } }]);
}

function backToItems() {
  currentDetailId = null;
  showPage('items');
}

// ===== 手动添加物品（独立页面） =====
function clearAddForm() {
  document.getElementById('add-name').value = '';
  document.getElementById('add-room').value = '';
  document.getElementById('add-category').value = '';
  document.getElementById('add-loc-type').value = '';
  document.getElementById('add-loc-tier').value = '';
  document.getElementById('add-note').value = '';
}

function submitAddItem() {
  const name = document.getElementById('add-name').value.trim();
  const room = document.getElementById('add-room').value.trim();
  const location = combineLocation('add-loc-type', 'add-loc-tier');
  const category = document.getElementById('add-category').value.trim();
  const note = document.getElementById('add-note').value.trim();

  if (!name) {
    showAlert('提示', '请填写物品名称。', [{ text: '确定', cls: 'btn-primary', action: closeAlert }]);
    return;
  }

  const emojiMap = { '药品': '💊', '工具': '🔧', '厨电': '🍳', '床品': '🛏', '电子产品': '🔌', '书籍': '📚', '日用品': '🧴', '衣物': '👕', '玩具': '🧸', '其他': '📦' };
  const d = DB.get();
  d.items.push({
    id: Date.now(),
    name: name,
    emoji: emojiMap[category] || '📦',
    room: room,
    location: location,
    category: category,
    lastUsed: new Date().toISOString().slice(0, 10),
    photo: null,
    defaultRoom: room,
    defaultLocation: location,
    addedBy: '我',
    addedAt: new Date().toISOString().slice(0, 10),
    note: note || null,
  });
  DB.addActivity('手动添加了「' + name + '」到 ' + room + ' · ' + location, '我');
  DB.set(d);

  showAlert('添加成功', '「' + name + '」已记录到 ' + room + ' · ' + location, [{ text: '好的', cls: 'btn-primary', action: function() { closeAlert(); showPage('items'); } }]);
}

// ===== 拍照识别 =====
function resetPhotoPage() {
  document.getElementById('recog-loading').classList.add('hidden');
  document.getElementById('recog-results-container').classList.add('hidden');
  const area = document.getElementById('photo-area');
  area.innerHTML = '<div class="pc-icon-wrap"><svg class="icon icon-lg" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div><div class="pc-text">点击拍照或选择图片</div><div class="pc-hint">AI 将识别画面中所有物品，支持柜子、抽屉、桌面等场景</div><input type="file" accept="image/*" onchange="handlePhotoCapture(event)" id="photo-input" capture="environment">';
}

function handlePhotoCapture(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const photoData = evt.target.result;
    const area = document.getElementById('photo-area');
    area.innerHTML = '<div class="scanning-overlay" style="position:relative;width:100%;height:220px;"><img src="' + photoData + '" alt="photo" style="width:100%;height:220px;object-fit:cover;border-radius:16px;"><div class="scanning-line"></div></div>';

    document.getElementById('recog-loading').classList.remove('hidden');
    document.getElementById('recog-results-container').classList.add('hidden');

    setTimeout(function() {
      document.getElementById('recog-loading').classList.add('hidden');
      showRecognitionResults();
    }, 2200);
  };
  reader.readAsDataURL(file);
}

function getRecogScenes() {
  return {
    '书桌': [
      { name: '剪刀', emoji: '✂', category: '工具', room: '书房', location: '抽屉·第二格', confidence: 'high' },
      { name: '笔记本', emoji: '📓', category: '书籍', room: '书房', location: '桌子·表面', confidence: 'high' },
      { name: '便利贴', emoji: '📝', category: '书籍', room: '书房', location: '桌子·表面', confidence: 'high' },
      { name: '胶带', emoji: '📎', category: '工具', room: '书房', location: '收纳箱·第一层', confidence: 'medium' },
      { name: '尺子', emoji: '📏', category: '工具', room: '书房', location: '收纳箱·第一层', confidence: 'high' },
      { name: '台灯', emoji: '💡', category: '电子产品', room: '书房', location: '桌子·左侧', confidence: 'high' },
      { name: 'U盘', emoji: '💾', category: '电子产品', room: '书房', location: '抽屉·第一格', confidence: 'high' },
      { name: '订书机', emoji: '📎', category: '工具', room: '书房', location: '收纳箱·第一层', confidence: 'high' },
      { name: '计算器', emoji: '🧮', category: '电子产品', room: '书房', location: '收纳箱·第一层', confidence: 'high' },
      { name: '回形针', emoji: '📎', category: '工具', room: '书房', location: '收纳箱·第二层', confidence: 'medium' },
      { name: '充电线', emoji: '🔌', category: '电子产品', room: '书房', location: '收纳箱·上层', confidence: 'high' },
      { name: '数据线', emoji: '🔗', category: '电子产品', room: '书房', location: '抽屉·第一格', confidence: 'high' },
      { name: '收纳盒', emoji: '📦', category: '日用品', room: '书房', location: '书架·B层', confidence: 'high' },
    ],
    '厨房': [
      { name: '马克杯', emoji: '☕', category: '日用品', room: '厨房', location: '挂钩·第一层', confidence: 'high' },
      { name: '水杯', emoji: '🥤', category: '日用品', room: '厨房', location: '挂钩·第一层', confidence: 'high' },
      { name: '保温杯', emoji: '🍶', category: '日用品', room: '厨房', location: '挂钩·第二层', confidence: 'high' },
      { name: '料理机', emoji: '🍳', category: '厨电', room: '厨房', location: '柜子·第三层', confidence: 'high' },
      { name: '烘焙模具', emoji: '🧁', category: '厨电', room: '厨房', location: '柜子·第二层', confidence: 'high' },
      { name: '开瓶器', emoji: '🍾', category: '厨电', room: '厨房', location: '抽屉·第一格', confidence: 'high' },
      { name: '围裙', emoji: '👗', category: '衣物', room: '厨房', location: '挂钩·表面', confidence: 'high' },
      { name: '垃圾袋', emoji: '🗑', category: '日用品', room: '厨房', location: '柜子·底层', confidence: 'high' },
      { name: '保鲜膜', emoji: '🥡', category: '日用品', room: '厨房', location: '抽屉·第二格', confidence: 'high' },
      { name: '厨房剪刀', emoji: '✂', category: '工具', room: '厨房', location: '台面·右侧', confidence: 'high' },
      { name: '洗洁精', emoji: '🧴', category: '日用品', room: '厨房', location: '台面·左侧', confidence: 'high' },
      { name: '隔热垫', emoji: '🍽', category: '日用品', room: '厨房', location: '抽屉·第三格', confidence: 'medium' },
    ],
    '客厅': [
      { name: '遥控器', emoji: '📺', category: '电子产品', room: '客厅', location: '桌子·表面', confidence: 'high' },
      { name: '纸巾', emoji: '🧻', category: '日用品', room: '客厅', location: '桌子·表面', confidence: 'high' },
      { name: '抱枕', emoji: '🛋', category: '床品', room: '客厅', location: '沙发·表面', confidence: 'high' },
      { name: '相框', emoji: '🖼', category: '日用品', room: '客厅', location: '柜子·顶层', confidence: 'high' },
      { name: '路由器', emoji: '📡', category: '电子产品', room: '客厅', location: '柜子·顶层', confidence: 'high' },
      { name: '蜡烛', emoji: '🕯', category: '日用品', room: '客厅', location: '桌子·表面', confidence: 'medium' },
      { name: '充电宝', emoji: '🔋', category: '电子产品', room: '客厅', location: '抽屉·第一格', confidence: 'high' },
      { name: '雨伞', emoji: '☂', category: '日用品', room: '客厅', location: '门后·挂钩', confidence: 'high' },
      { name: '杂志', emoji: '📰', category: '书籍', room: '客厅', location: '桌子·表面', confidence: 'medium' },
    ],
    '卧室': [
      { name: '眼镜', emoji: '👓', category: '日用品', room: '主卧', location: '桌子·表面', confidence: 'high' },
      { name: '梳子', emoji: '🪮', category: '日用品', room: '主卧', location: '台面·表面', confidence: 'high' },
      { name: '发圈', emoji: '🎀', category: '日用品', room: '主卧', location: '台面·表面', confidence: 'medium' },
      { name: '指甲剪', emoji: '💅', category: '日用品', room: '主卧', location: '桌子·第一格', confidence: 'medium' },
      { name: '香薰', emoji: '🕯', category: '日用品', room: '主卧', location: '桌子·表面', confidence: 'medium' },
      { name: '闹钟', emoji: '⏰', category: '电子产品', room: '主卧', location: '桌子·表面', confidence: 'high' },
      { name: '针线盒', emoji: '🧵', category: '工具', room: '主卧', location: '柜子·顶层', confidence: 'medium' },
      { name: '创可贴', emoji: '🩹', category: '药品', room: '主卧', location: '收纳箱·第一层', confidence: 'medium' },
      { name: '防晒霜', emoji: '🧴', category: '日用品', room: '主卧', location: '台面·表面', confidence: 'high' },
      { name: '橡皮筋', emoji: '🪢', category: '日用品', room: '主卧', location: '台面·表面', confidence: 'medium' },
      { name: '睡衣', emoji: '👕', category: '衣物', room: '主卧', location: '柜子·中层', confidence: 'high' },
      { name: '眼罩', emoji: '😴', category: '日用品', room: '主卧', location: '桌子·第一格', confidence: 'medium' },
    ],
    '卫生间': [
      { name: '吹风机', emoji: '💨', category: '电子产品', room: '卫生间', location: '壁柜·第一层', confidence: 'high' },
      { name: '牙刷', emoji: '🪥', category: '日用品', room: '卫生间', location: '台面·表面', confidence: 'high' },
      { name: '体重秤', emoji: '⚖', category: '电子产品', room: '卫生间', location: '地面·门后', confidence: 'high' },
      { name: '洗手液', emoji: '🧴', category: '日用品', room: '卫生间', location: '台面·表面', confidence: 'high' },
      { name: '棉签', emoji: '🩹', category: '日用品', room: '卫生间', location: '壁柜·第二层', confidence: 'high' },
      { name: '喷雾瓶', emoji: '🧴', category: '日用品', room: '卫生间', location: '壁柜·第二层', confidence: 'medium' },
      { name: '毛巾', emoji: '🧖', category: '日用品', room: '卫生间', location: '挂钩·第一层', confidence: 'high' },
      { name: '洗发水', emoji: '🧴', category: '日用品', room: '卫生间', location: '壁柜·第一层', confidence: 'high' },
      { name: '牙线', emoji: '🦷', category: '日用品', room: '卫生间', location: '壁柜·第三层', confidence: 'medium' },
    ],
    '阳台': [
      { name: '卷尺', emoji: '📐', category: '工具', room: '阳台', location: '收纳箱·第一层', confidence: 'high' },
      { name: '电蚊拍', emoji: '🔋', category: '电子产品', room: '阳台', location: '柜子·底层', confidence: 'medium' },
      { name: '鞋刷', emoji: '🧹', category: '日用品', room: '阳台', location: '挂钩·表面', confidence: 'medium' },
      { name: '花盆', emoji: '🪴', category: '日用品', room: '阳台', location: '台面·表面', confidence: 'high' },
      { name: '挂钩', emoji: '🪝', category: '工具', room: '玄关', location: '墙面·表面', confidence: 'medium' },
      { name: '螺丝刀', emoji: '🔧', category: '工具', room: '阳台', location: '收纳箱·第二层', confidence: 'high' },
      { name: '喷壶', emoji: '💧', category: '日用品', room: '阳台', location: '台面·下层', confidence: 'medium' },
      { name: '晾衣夹', emoji: '👔', category: '日用品', room: '阳台', location: '收纳箱·第三层', confidence: 'medium' },
    ],
    '玄关': [
      { name: '钥匙', emoji: '🔑', category: '日用品', room: '玄关', location: '挂钩·第一层', confidence: 'high' },
      { name: '拖鞋', emoji: '🩴', category: '衣物', room: '玄关', location: '柜子·底层', confidence: 'high' },
      { name: '挂钩', emoji: '🪝', category: '工具', room: '玄关', location: '墙面·左侧', confidence: 'medium' },
      { name: '鞋油', emoji: '👞', category: '日用品', room: '玄关', location: '柜子·第二层', confidence: 'medium' },
      { name: '门卡', emoji: '💳', category: '日用品', room: '玄关', location: '挂钩·第二层', confidence: 'high' },
    ],
  };
}

function matchEmojiByName(name) {
  const map = {
    '剪': '✂', '刀': '🔪', '遥控器': '📺', '充': '🔌', '线': '🔗', '杯': '☕', '水': '🥤', '本': '📓', '纸': '🧻', '贴': '📝',
    '胶': '📎', '带': '📎', '钥': '🔑', '匙': '🔑', '发': '🎀', '圈': '🎀', '甲': '💅', '尺': '📏', '皮': '🪢', '筋': '🪢',
    '台': '💡', '灯': '💡', '眼': '👓', '镜': '👓', '梳': '🪮', '风': '💨', '机': '💨', '刷': '🪥', '牙': '🪥', '拖': '🩴',
    '鞋': '🩴', '抱': '🛋', '枕': '🛋', '香': '🕯', '薰': '🕯', '烛': '🕯', '蜡': '🕯', '体': '⚖', '重': '⚖', '秤': '⚖',
    '针': '🧵', '线': '🧵', '盒': '📦', '卷': '📐', '订': '📎', '书': '📚', '保': '🍶', '温': '🍶', 'U': '💾', '盘': '💾',
    '创': '🩹', '可': '🩹', '贴': '🩹', '闹': '⏰', '钟': '⏰', '开': '🍾', '瓶': '🍾', '相': '🖼', '框': '🖼', '洗': '🧴',
    '手': '🧴', '液': '🧴', '收': '📦', '纳': '📦', '路': '📡', '由': '📡', '器': '📡', '电': '🔋', '蚊': '🔋', '拍': '🔋',
    '刷': '🧹', '鞋': '🧹', '刷': '🧹', '围': '👗', '裙': '👗', '垃': '🗑', '圾': '🗑', '袋': '🗑', '膜': '🥡', '挂': '🪝',
    '钩': '🪝', '计': '🧮', '算': '🧮', '器': '🧮', '回': '📎', '形': '📎', '针': '📎', '棉': '🩹', '签': '🩹', '花': '🪴',
    '盆': '🪴', '喷': '🧴', '雾': '🧴', '瓶': '🧴'
  };
  for (const key in map) {
    if (name.includes(key)) return map[key];
  }
  return '📦';
}

function showRecognitionResults() {
  const d = DB.get();
  const existingNames = new Set(d.items.map(function(i) { return i.name; }));
  const scenes = getRecogScenes();

  // 随机选一个场景（书桌/厨房/客厅/卧室/卫生间/阳台/玄关）
  const sceneNames = Object.keys(scenes);
  const pickedScene = sceneNames[Math.floor(Math.random() * sceneNames.length)];
  const sceneItems = scenes[pickedScene];

  // 从该场景中随机抽取9个（不足则全取）
  const shuffled = sceneItems.sort(function() { return Math.random() - 0.5; });
  const recognized = shuffled.slice(0, Math.min(9, shuffled.length));
  recognized.forEach(function(r) {
    r._inDb = existingNames.has(r.name);
  });

  const container = document.getElementById('recog-results-container');
  container.innerHTML = renderRecogPanel(recognized, pickedScene);
  container.classList.remove('hidden');
  container._recognized = recognized;
  container._addedIndices = new Set();
}

function renderRecogPanel(recognized, sceneName) {
  return '<div class="recog-panel"><div class="recog-header"><div class="recog-title">识别结果</div><span class="recog-badge">AI 识别</span></div><div class="recog-count">检测到「' + sceneName + '」场景，共识别到 ' + recognized.length + ' 件物品</div><div id="recog-items">' + recognized.map(function(r, i) { return renderRecogItem(r, i); }).join('') + '</div><div class="recog-actions"><button class="btn btn-outline btn-sm" onclick="resetPhotoPage()">重新拍照</button><button class="btn btn-primary btn-sm" onclick="confirmRecogItems()">全部确认入库</button></div></div>';
}

function renderRecogItem(r, i, isAdded) {
  if (isAdded) {
    return '<div class="recog-item" data-idx="' + i + '" style="opacity:0.6;"><div class="ri-emoji">' + r.emoji + '</div><div class="ri-info"><div class="ri-name">' + r.name + '</div><div class="ri-suggest">已添加至 ' + r.room + ' · ' + r.location + '</div></div><span class="ri-btn ri-btn-done">已入库</span></div>';
  }
  if (r._inDb) {
    return '<div class="recog-item" data-idx="' + i + '" style="opacity:0.6;"><div class="ri-emoji">' + r.emoji + '</div><div class="ri-info"><div class="ri-name">' + r.name + '</div><div class="ri-suggest">建议存放：' + r.room + ' · ' + r.location + '</div></div><span class="ri-confidence ' + r.confidence + '">' + (r.confidence === 'high' ? '高' : '中') + '</span><span class="ri-btn ri-btn-done">已在库</span></div>';
  }
  return '<div class="recog-item" data-idx="' + i + '"><div class="ri-emoji">' + r.emoji + '</div><div class="ri-info"><div class="ri-name">' + r.name + '</div><div class="ri-suggest">建议存放：' + r.room + ' · ' + r.location + '</div></div><span class="ri-confidence ' + r.confidence + '">' + (r.confidence === 'high' ? '高' : '中') + '</span><span class="ri-edit" onclick="editRecogItem(' + i + ')">修改</span><button class="ri-btn ri-btn-add" onclick="addRecogSingle(' + i + ')">添加</button><button class="ri-btn ri-btn-del" onclick="delRecogSingle(' + i + ')">删除</button></div>';
}

function addRecogSingle(idx) {
  const container = document.getElementById('recog-results-container');
  const items = container._recognized;
  const r = items[idx];
  const d = DB.get();
  if (d.items.some(function(i) { return i.name === r.name; })) return;

  d.items.push({
    id: Date.now() + Math.random(),
    name: r.name,
    emoji: r.emoji,
    room: r.room,
    location: r.location,
    category: r.category,
    lastUsed: new Date().toISOString().slice(0, 10),
    photo: null,
    defaultRoom: r.room,
    defaultLocation: r.location,
    addedBy: '我',
    addedAt: new Date().toISOString().slice(0, 10),
  });
  DB.addActivity('通过拍照识别添加了「' + r.name + '」', '我');
  DB.set(d);

  container._addedIndices.add(idx);
  const el = document.querySelector('.recog-item[data-idx="' + idx + '"]');
  if (el) el.outerHTML = renderRecogItem(r, idx, true);
}

function delRecogSingle(idx) {
  const container = document.getElementById('recog-results-container');
  const el = document.querySelector('.recog-item[data-idx="' + idx + '"]');
  if (el) el.remove();
}

function editRecogItem(idx) {
  const container = document.getElementById('recog-results-container');
  const items = container._recognized;
  const item = items[idx];
  const el = document.querySelector('.recog-item[data-idx="' + idx + '"]');
  el.innerHTML = '<div class="ri-emoji">' + item.emoji + '</div><div class="ri-info"><input value="' + item.name + '" onchange="updateRecogName(' + idx + ', this.value)" style="width:100%;"><div class="ri-suggest">建议存放：' + item.room + ' · ' + item.location + '</div></div><span class="ri-edit" onclick="saveRecogEdit(' + idx + ')">确定</span>';
  el.querySelector('input').focus();
}

function updateRecogName(idx, val) {
  const container = document.getElementById('recog-results-container');
  container._recognized[idx].name = val;
  container._recognized[idx].emoji = matchEmojiByName(val);
}

function saveRecogEdit(idx) {
  const container = document.getElementById('recog-results-container');
  const item = container._recognized[idx];
  item.emoji = matchEmojiByName(item.name);
  const el = document.querySelector('.recog-item[data-idx="' + idx + '"]');
  el.outerHTML = renderRecogItem(item, idx);
}

function confirmRecogItems() {
  const container = document.getElementById('recog-results-container');
  const items = container._recognized;
  const d = DB.get();
  let count = 0;
  const names = [];

  items.forEach(function(r, idx) {
    if (container._addedIndices && container._addedIndices.has(idx)) return;
    if (d.items.some(function(i) { return i.name === r.name; })) return;
    d.items.push({
      id: Date.now() + Math.random(),
      name: r.name,
      emoji: r.emoji,
      room: r.room,
      location: r.location,
      category: r.category,
      lastUsed: new Date().toISOString().slice(0, 10),
      photo: null,
      defaultRoom: r.room,
      defaultLocation: r.location,
      addedBy: '我',
      addedAt: new Date().toISOString().slice(0, 10),
    });
    names.push(r.name);
    count++;
  });

  if (count > 0) {
    DB.addActivity('通过拍照识别批量添加了 ' + count + ' 件物品', '我');
  }
  DB.set(d);
  resetPhotoPage();
  showAlert('入库完成', 'AI 识别并添加了 ' + count + ' 件物品。\n\n如有识别错误，可到物品列表修改。', [{ text: '确定', cls: 'btn-primary', action: closeAlert }]);
}

function manualAddItem() {
  showPage('add');
}

// ===== 归位指引 =====
function resetReturnPage() {
  document.getElementById('return-loading').classList.add('hidden');
  document.getElementById('return-result-container').classList.add('hidden');
  document.getElementById('return-chat-area').classList.add('hidden');
  currentReturnItem = null;
  const area = document.getElementById('return-photo-area');
  area.innerHTML = '<div class="pc-icon-wrap"><svg class="icon icon-lg" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg></div><div class="pc-text">拍下已使用的物品</div><div class="pc-hint">AI 将识别物品并告诉你它应该放回哪里</div><input type="file" accept="image/*" onchange="handleReturnPhoto(event)" id="return-photo-input" capture="environment">';
}

function handleReturnPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const photoData = evt.target.result;
    const area = document.getElementById('return-photo-area');
    area.innerHTML = '<div class="scanning-overlay" style="position:relative;width:100%;height:220px;"><img src="' + photoData + '" alt="photo" style="width:100%;height:220px;object-fit:cover;border-radius:16px;filter:brightness(0.7);"><div class="scanning-line"></div></div>';

    document.getElementById('return-loading').classList.remove('hidden');
    document.getElementById('return-result-container').classList.add('hidden');
    document.getElementById('return-chat-area').classList.add('hidden');

    setTimeout(function() {
      document.getElementById('return-loading').classList.add('hidden');
      showReturnResult();
    }, 2000);
  };
  reader.readAsDataURL(file);
}

function showReturnResult(itemOverride) {
  const d = DB.get();
  let item;
  if (itemOverride) {
    item = itemOverride;
  } else {
    const candidates = d.items;
    item = candidates[Math.floor(Math.random() * candidates.length)];
  }
  currentReturnItem = item;
  const isMisplaced = item.room !== item.defaultRoom || item.location !== item.defaultLocation;

  const container = document.getElementById('return-result-container');
  container.innerHTML = '<div class="return-card"><div class="return-icon-wrap"><svg class="icon icon-lg" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg></div><div class="return-item-name">' + item.emoji + ' ' + item.name + '</div><div class="return-item-cat">' + item.category + '</div>' +
    (isMisplaced ?
    '<div class="return-location"><div class="rl-label">当前位置</div><div class="rl-from">' + item.room + ' · ' + item.location + '</div><div class="rl-arrow"><svg class="icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg></div><div class="rl-label">应放回</div><div class="rl-value">' + item.defaultRoom + ' · ' + item.defaultLocation + '</div></div>' :
    '<div class="return-location"><div class="rl-label">默认存放位置</div><div class="rl-value">' + item.defaultRoom + ' · ' + item.defaultLocation + '</div></div>') +
    '<div style="font-size:0.8rem;color:var(--text-secondary);margin-top:8px;">' + (isMisplaced ? '该物品需要归位，请放回默认位置。' : '该物品已在正确位置，无需移动。') + '</div></div>' +
    '<div style="display:flex;gap:8px;"><button class="btn btn-outline btn-sm" onclick="resetReturnPage()">重新拍照</button><button class="btn btn-primary btn-sm" onclick="showPage(\'home\')">返回首页</button></div>';
  container.classList.remove('hidden');
  document.getElementById('return-chat-area').classList.remove('hidden');
}

// ===== 归位页AI对话 =====
function sendReturnChat() {
  const input = document.getElementById('return-chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  const reply = generateReturnReply(text);
  showAlert('AI 反馈', reply, [{ text: '知道了', cls: 'btn-primary', action: closeAlert }]);
}

function generateReturnReply(text) {
  const d = DB.get();
  const t = text.toLowerCase();
  const item = currentReturnItem;

  // 重新识别
  if (t.includes('不是') || t.includes('错了') || t.includes('重新') || t.includes('识别')) {
    // 从已有物品中换一个
    const candidates = d.items.filter(function(i) { return i.id !== (item ? item.id : -1); });
    if (candidates.length > 0) {
      const newItem = candidates[Math.floor(Math.random() * candidates.length)];
      showReturnResult(newItem);
      return '已重新识别。这是「' + newItem.name + '」，' + (newItem.room !== newItem.defaultRoom || newItem.location !== newItem.defaultLocation ? '应放回 ' + newItem.defaultRoom + ' · ' + newItem.defaultLocation : '已在正确位置。');
    }
    return '抱歉，未能重新识别。请尝试重新拍照。';
  }

  // 纠正物品名称
  if (t.includes('是') && item) {
    for (const i of d.items) {
      if (t.includes(i.name.toLowerCase()) && i.name !== item.name) {
        showReturnResult(i);
        return '好的，已更正为「' + i.name + '」。' + (i.room !== i.defaultRoom || i.location !== i.defaultLocation ? '应放回 ' + i.defaultRoom + ' · ' + i.defaultLocation + '。' : '已在正确位置。');
      }
    }
  }

  // 更新归位位置
  if ((t.includes('放回') || t.includes('应该') || t.includes('位置')) && item) {
    const roomMatch = t.match(/(客厅|主卧|次卧|厨房|儿童房|书房|阳台|玄关|卫生间)/);
    if (roomMatch) {
      const newRoom = roomMatch[1];
      item.defaultRoom = newRoom;
      if (!item.defaultLocation.includes(newRoom)) {
        item.defaultLocation = newRoom + ' 默认位置';
      }
      DB.set(d);
      showReturnResult(item);
      return '已更新「' + item.name + '」的默认存放位置为 ' + newRoom + '。';
    }
  }

  // 查找物品
  for (const i of d.items) {
    if (t.includes(i.name.toLowerCase())) {
      showReturnResult(i);
      return '这是「' + i.name + '」，' + (i.room !== i.defaultRoom || i.location !== i.defaultLocation ? '应放回 ' + i.defaultRoom + ' · ' + i.defaultLocation + '。' : '已在正确位置。');
    }
  }

  return '抱歉，我没理解。你可以说：\n"这不是XX" / "重新识别" / "它应该放回主卧" / 直接说物品名称。';
}

function toggleReturnVoice() {
  initSpeech();
  if (!recognition) { showAlert('不支持', '您的浏览器不支持语音识别，请使用 Chrome 浏览器。', [{ text: '知道了', cls: 'btn-primary', action: closeAlert }]); return; }
  const btn = document.getElementById('return-voice-btn');
  if (voiceTarget === 'return') { recognition.stop(); btn.classList.remove('listening'); voiceTarget = null; return; }
  voiceTarget = 'return';
  btn.classList.add('listening');
  recognition.start();
}

// ===== 语音 (Web Speech API) =====
function initSpeech() {
  if (recognition) return;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;
  recognition = new SpeechRecognition();
  recognition.lang = 'zh-CN';
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.onresult = function(e) {
    const text = e.results[0][0].transcript;
    if (voiceTarget === 'search') {
      document.getElementById('search-input').value = text;
      renderItems(text);
      document.getElementById('voice-btn').classList.remove('listening');
    } else if (voiceTarget === 'chat') {
      addChatMessage('user', text);
      document.getElementById('chat-voice-btn').classList.remove('listening');
      setTimeout(function() { addChatMessage('ai', generateReply(text)); }, 600);
    } else if (voiceTarget === 'return') {
      document.getElementById('return-chat-input').value = text;
      document.getElementById('return-voice-btn').classList.remove('listening');
      setTimeout(function() { sendReturnChat(); }, 300);
    }
    voiceTarget = null;
  };
  recognition.onerror = function() {
    if (voiceTarget === 'search') document.getElementById('voice-btn').classList.remove('listening');
    if (voiceTarget === 'chat') document.getElementById('chat-voice-btn').classList.remove('listening');
    if (voiceTarget === 'return') document.getElementById('return-voice-btn').classList.remove('listening');
    voiceTarget = null;
  };
  recognition.onend = function() {
    if (voiceTarget === 'search') document.getElementById('voice-btn').classList.remove('listening');
    if (voiceTarget === 'chat') document.getElementById('chat-voice-btn').classList.remove('listening');
    if (voiceTarget === 'return') document.getElementById('return-voice-btn').classList.remove('listening');
    voiceTarget = null;
  };
}

function toggleVoiceSearch() {
  initSpeech();
  if (!recognition) { showAlert('不支持', '您的浏览器不支持语音识别，请使用 Chrome 浏览器。', [{ text: '知道了', cls: 'btn-primary', action: closeAlert }]); return; }
  const btn = document.getElementById('voice-btn');
  if (voiceTarget === 'search') { recognition.stop(); btn.classList.remove('listening'); voiceTarget = null; return; }
  voiceTarget = 'search';
  btn.classList.add('listening');
  recognition.start();
}

function toggleChatVoice() {
  initSpeech();
  if (!recognition) { showAlert('不支持', '您的浏览器不支持语音识别，请使用 Chrome 浏览器。', [{ text: '知道了', cls: 'btn-primary', action: closeAlert }]); return; }
  const btn = document.getElementById('chat-voice-btn');
  if (voiceTarget === 'chat') { recognition.stop(); btn.classList.remove('listening'); voiceTarget = null; return; }
  voiceTarget = 'chat';
  btn.classList.add('listening');
  recognition.start();
}

// ===== AI 对话 =====
function renderChat() {
  const msgs = document.getElementById('chat-msgs');
  if (msgs.children.length === 0) {
    addChatMessage('ai', '你好，我是家物记 AI 助手。\n\n你可以用语音或文字问我：\n"我的钥匙在哪？"\n"哪些物品没有归位？"\n"医药箱应该放回哪里？"\n"家里还有充电宝吗？"\n"我想买料理机，家里还有吗？"\n\n我会直接告诉你物品所在的具体位置。');
  }
}

function addChatMessage(role, text) {
  const msgs = document.getElementById('chat-msgs');
  const el = document.createElement('div');
  el.className = 'chat-msg ' + role;
  if (role === 'ai') {
    el.innerHTML = '<div class="ai-label">AI 助手</div>' + text.replace(/\n/g, '<br>');
  } else {
    el.textContent = text;
  }
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  addChatMessage('user', text);
  input.value = '';
  setTimeout(function() { addChatMessage('ai', generateReply(text)); }, 500);
}

function quickChat(text) {
  showPage('chat');
  setTimeout(function() { addChatMessage('user', text); setTimeout(function() { addChatMessage('ai', generateReply(text)); }, 500); }, 300);
}

function generateReply(text) {
  const d = DB.get();
  const t = text.toLowerCase();

  // 购物前查库存/防重复购买
  if (t.includes('买') || (t.includes('有') && t.includes('吗'))) {
    for (const item of d.items) {
      if (t.includes(item.name.toLowerCase())) {
        const days = Math.floor((Date.now() - new Date(item.lastUsed)) / 86400000);
        let r = item.emoji + ' 家里已有 ' + item.name + '。\n';
        r += '存放位置：' + item.room + ' · ' + item.location + '\n';
        r += '上次使用：' + item.lastUsed;
        if (days > 60) {
          r += '\n\n已 ' + days + ' 天未使用，建议确认是否还需要再购买。';
        } else {
          r += '\n\n无需重复购买。';
        }
        return r;
      }
    }
    return '没有找到这个物品的记录，家里应该没有。你可以购买后拍照入库。';
  }

  // 归位查询
  if (t.includes('归位') || t.includes('放回') || t.includes('应该放') || t.includes('放哪里')) {
    const misplaced = d.items.filter(function(i) { return i.room !== i.defaultRoom || i.location !== i.defaultLocation; });
    for (const item of d.items) {
      if (t.includes(item.name.toLowerCase())) {
        return item.emoji + ' ' + item.name + ' 的默认位置是 ' + item.defaultRoom + ' · ' + item.defaultLocation + '。\n\n当前它在 ' + item.room + ' · ' + item.location + '，' + ((item.room === item.defaultRoom && item.location === item.defaultLocation) ? '位置正确。' : '使用后请放回 ' + item.defaultRoom + ' · ' + item.defaultLocation + '。');
      }
    }
    if (misplaced.length === 0) return '所有物品都在正确位置，没有需要归位的。';
    let r = '以下 ' + misplaced.length + ' 件物品需要归位：\n';
    misplaced.forEach(function(i) { r += '\n' + i.emoji + ' ' + i.name + ' \u2192 应放回 ' + i.defaultRoom + ' · ' + i.defaultLocation; });
    return r;
  }

  // 未归位查询
  if (t.includes('未归位') || t.includes('没归位') || t.includes('不在位')) {
    const misplaced = d.items.filter(function(i) { return i.room !== i.defaultRoom || i.location !== i.defaultLocation; });
    if (misplaced.length === 0) return '所有物品都在正确位置。';
    let r = '以下 ' + misplaced.length + ' 件物品需要归位：\n';
    misplaced.forEach(function(i) { r += '\n' + i.emoji + ' ' + i.name + ' \u2192 应放回 ' + i.defaultRoom + ' · ' + i.defaultLocation; });
    return r;
  }

  // 查找物品
  for (const item of d.items) {
    if (t.includes(item.name.toLowerCase())) {
      const days = Math.floor((Date.now() - new Date(item.lastUsed)) / 86400000);
      let r = item.emoji + ' ' + item.name + ' 在 ' + item.room + ' · ' + item.location + '。';
      if (days > 90) r += '\n\n已 ' + days + ' 天未使用，可以考虑是否需要保留。';
      return r;
    }
  }

  // 统计查询
  if (t.includes('多少') || t.includes('几个') || t.includes('统计')) {
    return '家里共有 ' + d.items.length + ' 件物品，分布在不同房间。\n\n你可以说「未归位物品」查看需要归位的物品，或者说物品名称直接查找。';
  }

  return '请告诉我你想找什么物品，或者问：\n"哪些物品没有归位？"\n"XX在哪？"\n"我想买XX，家里还有吗？"\n\n你也可以直接说物品名称，比如"钥匙""医药箱""充电宝"。';
}

// ===== 家庭页面 =====
function renderFamily() {
  const d = DB.get();
  const list = document.getElementById('family-list');
  list.innerHTML = d.members.map(function(m, idx) {
    const initial = m.name.charAt(0);
    return '<div class="family-member"><div class="fm-avatar ' + (m.online ? 'online' : 'offline') + '">' + initial + '</div><div class="fm-info"><div class="fm-name" onclick="renameMember(' + idx + ')" style="cursor:pointer;">' + m.name + '</div><div class="fm-status">' + (m.online ? '在线' : '离线') + '</div></div><span class="fm-badge ' + (m.online ? 'online' : 'offline') + '">' + (m.online ? '在线' : '离线') + '</span><button class="btn btn-xs btn-outline" onclick="removeMember(' + idx + ')" style="width:auto;margin-left:4px;">删除</button></div>';
  }).join('');

  const log = document.getElementById('activity-log');
  log.innerHTML = d.activity.map(function(a) { return '<div class="al-item"><span class="al-time">' + a.time + '</span><span>' + a.text + '</span></div>'; }).join('');
}

function renameMember(idx) {
  const d = DB.get();
  const member = d.members[idx];
  showAlertInput('修改名字', '请输入新的名字（当前：' + member.name + '）：', '', function(newName) {
    if (!newName || !newName.trim()) return;
    const oldName = member.name;
    member.name = newName.trim();
    DB.addActivity('将「' + oldName + '」改名为「' + newName.trim() + '」', '我');
    DB.set(d);
    renderFamily();
  });
}

function addFamilyMember() {
  showAlertInput('添加家庭成员', '请输入新成员的名字：', '', function(name) {
    if (!name || !name.trim()) return;
    const avatars = ['👩', '👨', '👧', '👦', '👵', '👴'];
    const d = DB.get();
    d.members.push({ name: name.trim(), avatar: avatars[Math.floor(Math.random() * avatars.length)], online: true });
    DB.addActivity('添加了家庭成员「' + name.trim() + '」', '我');
    DB.set(d);
    renderFamily();
  });
}

function removeMember(idx) {
  const d = DB.get();
  const member = d.members[idx];
  showAlert('确认删除', '确定要删除成员「' + member.name + '」吗？', [
    { text: '取消', cls: 'btn-outline', action: closeAlert },
    { text: '删除', cls: 'btn-danger', action: function() {
      const d2 = DB.get();
      d2.members.splice(idx, 1);
      DB.addActivity('删除了家庭成员「' + member.name + '」', '我');
      DB.set(d2);
      closeAlert();
      renderFamily();
    }}
  ]);
}

// ===== 弹窗 =====
function showAlert(title, msg, buttons) {
  const overlay = document.getElementById('alert-overlay');
  document.getElementById('alert-title').textContent = title;
  document.getElementById('alert-msg').innerHTML = msg.replace(/\n/g, '<br>');
  document.getElementById('alert-icon').textContent = '';
  document.getElementById('alert-input-wrap').innerHTML = '';
  const btns = document.getElementById('alert-btns');
  btns.innerHTML = buttons.map(function(b, i) { return '<button class="btn ' + b.cls + '" data-alert-idx="' + i + '">' + b.text + '</button>'; }).join('');
  btns.querySelectorAll('button').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.dataset.alertIdx);
      buttons[idx].action();
    });
  });
  overlay.classList.add('active');
}

function showAlertInput(title, msg, placeholder, onConfirm) {
  const overlay = document.getElementById('alert-overlay');
  document.getElementById('alert-title').textContent = title;
  document.getElementById('alert-msg').textContent = msg;
  document.getElementById('alert-icon').textContent = '';
  document.getElementById('alert-input-wrap').innerHTML = '<input type="text" class="alert-input" id="alert-input-field" placeholder="' + (placeholder || '') + '" autofocus>';
  const btns = document.getElementById('alert-btns');
  btns.innerHTML = '<button class="btn btn-outline" data-alert-cancel>取消</button><button class="btn btn-primary" data-alert-confirm>添加</button>';

  btns.querySelector('[data-alert-cancel]').addEventListener('click', closeAlert);
  btns.querySelector('[data-alert-confirm]').addEventListener('click', function() {
    const val = document.getElementById('alert-input-field').value.trim();
    closeAlert();
    if (val) onConfirm(val);
  });

  overlay.classList.add('active');
  setTimeout(function() {
    const input = document.getElementById('alert-input-field');
    if (input) input.focus();
  }, 100);
}

function closeAlert() {
  document.getElementById('alert-overlay').classList.remove('active');
}

// ===== 键盘 / 全局 =====
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (document.getElementById('alert-overlay').classList.contains('active')) {
      closeAlert();
    }
  }
});

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
  DB.init();

  document.querySelectorAll('.nav-item').forEach(function(btn) {
    btn.addEventListener('click', function() { showPage(btn.dataset.page); });
  });

  var searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.addEventListener('input', function(e) { renderItems(e.target.value); });

  var chatInput = document.getElementById('chat-input');
  if (chatInput) chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendChat();
  });

  var returnChatInput = document.getElementById('return-chat-input');
  if (returnChatInput) returnChatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendReturnChat();
  });

  showPage('home');
});

// ===== 暴露到全局 =====
window.showPage = showPage;
window.openDetail = openDetail;
window.deleteItem = deleteItem;
window.relocateItem = relocateItem;
window.backToItems = backToItems;
window.handlePhotoCapture = handlePhotoCapture;
window.handleReturnPhoto = handleReturnPhoto;
window.editRecogItem = editRecogItem;
window.updateRecogName = updateRecogName;
window.saveRecogEdit = saveRecogEdit;
window.confirmRecogItems = confirmRecogItems;
window.addRecogSingle = addRecogSingle;
window.delRecogSingle = delRecogSingle;
window.resetPhotoPage = resetPhotoPage;
window.resetReturnPage = resetReturnPage;
window.manualAddItem = manualAddItem;
window.submitAddItem = submitAddItem;
window.toggleVoiceSearch = toggleVoiceSearch;
window.toggleChatVoice = toggleChatVoice;
window.toggleReturnVoice = toggleReturnVoice;
window.sendChat = sendChat;
window.sendReturnChat = sendReturnChat;
window.quickChat = quickChat;
window.setRoomFilter = setRoomFilter;
window.setCatFilter = setCatFilter;
window.addFamilyMember = addFamilyMember;
window.removeMember = removeMember;
window.renameMember = renameMember;
window.showAlert = showAlert;
window.closeAlert = closeAlert;

})();