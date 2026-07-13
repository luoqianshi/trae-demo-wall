/* ============================================================
   智能冰箱食材管家 - app.js
   纯原生 JS，无任何框架
   ============================================================ */

/* ==== 静态数据：菜谱（扩展版，含食材已有标记） ==== */
const recipes = [
  {
    name: '西兰花炒五花肉', icon: '🥦', match: 95, time: '15分钟', diff: '简单',
    ingredients: [
      { name: '西兰花', have: true },
      { name: '五花肉', have: true },
      { name: '蒜末', have: false }
    ],
    steps: [
      '五花肉切片焯水',
      '西兰花切小朵焯水',
      '热锅爆香蒜末',
      '五花肉翻炒至微焦',
      '加入西兰花翻炒',
      '调味出锅'
    ]
  },
  {
    name: '番茄炒蛋', icon: '🍅', match: 90, time: '10分钟', diff: '简单',
    ingredients: [
      { name: '番茄', have: true },
      { name: '鸡蛋', have: true },
      { name: '葱花', have: false }
    ],
    steps: [
      '番茄切块',
      '鸡蛋打散',
      '先炒蛋盛出',
      '再炒番茄至出汁',
      '合并翻炒',
      '加盐糖调味'
    ]
  },
  {
    name: '五花肉焖饭', icon: '🍚', match: 85, time: '35分钟', diff: '中等',
    ingredients: [
      { name: '五花肉', have: true },
      { name: '鸡蛋', have: true },
      { name: '西兰花', have: true }
    ],
    steps: [
      '五花肉切丁腌制',
      '米饭加水放入电饭煲',
      '铺上五花肉丁和西兰花',
      '焖煮25分钟',
      '打入鸡蛋搅拌'
    ]
  },
  {
    name: '酸奶水果沙拉', icon: '🥗', match: 70, time: '5分钟', diff: '简单',
    ingredients: [
      { name: '酸奶', have: true },
      { name: '生菜', have: true },
      { name: '番茄', have: true },
      { name: '苹果', have: false }
    ],
    steps: [
      '生菜洗净撕小块',
      '番茄切块',
      '苹果去皮切块',
      '所有材料放入碗中',
      '淋上酸奶拌匀即可'
    ]
  }
];

/* ==== 购物清单默认数据 ==== */
const defaultCartItems = [
  { id: 1, name: '蒜末 50g', checked: false },
  { id: 2, name: '葱花 30g', checked: false },
  { id: 3, name: '生姜 1块', checked: false }
];

/* ==== 状态管理 ==== */
let currentUser = null;
let smsCode = '';
let smsTimer = 0;
let modalCallback = null;
let cartItems = JSON.parse(localStorage.getItem('fridge_cart') || 'null') || defaultCartItems.map(i => ({ ...i }));
let pullStartY = 0;
let pulling = false;
let cookTimer = null;
let cookSeconds = 0;
let cookCurrentStep = 0;

/* ==== 工具函数 ==== */
function isPhone(p) { return /^1[3-9]\d{9}$/.test(p); }
function isPwdValid(p) { return /^[a-zA-Z0-9]{6,20}$/.test(p); }
function maskPhone(p) { return p.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'); }

/* ==== 自定义弹窗 ==== */
function showAlert(msg, title, icon, cb) {
  document.getElementById('modalIcon').textContent = icon || 'ℹ️';
  document.getElementById('modalTitle').textContent = title || '提示';
  document.getElementById('modalContent').textContent = msg || '';
  const btns = document.getElementById('modalBtns');
  btns.innerHTML = '<div class="modal-btn primary" onclick="closeModal(true)">知道了</div>';
  modalCallback = cb || null;
  document.getElementById('modalMask').classList.add('show');
}

function showConfirm(msg, title, icon) {
  return new Promise(resolve => {
    document.getElementById('modalIcon').textContent = icon || '❓';
    document.getElementById('modalTitle').textContent = title || '确认';
    document.getElementById('modalContent').textContent = msg || '';
    const btns = document.getElementById('modalBtns');
    btns.innerHTML =
      '<div class="modal-btn" onclick="closeModal(false)">取消</div>' +
      '<div class="modal-btn primary" onclick="closeModal(true)">确定</div>';
    modalCallback = resolve;
    document.getElementById('modalMask').classList.add('show');
  });
}

function closeModal(val) {
  document.getElementById('modalMask').classList.remove('show');
  if (modalCallback) {
    const cb = modalCallback;
    modalCallback = null;
    cb(val);
  }
}

function showToast(msg, duration) {
  const t = document.getElementById('toastTip');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.classList.remove('show');
  }, duration || 2000);
}

/* ==== Auth页面切换 ==== */
function showAuth(page) {
  document.querySelectorAll('.auth-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelector('.tab-bar').style.display = 'none';
  document.getElementById('auth-' + page).classList.add('active');
  clearFormErrors();
}

/* ==== 进入主应用 ==== */
function enterApp() {
  document.querySelectorAll('.auth-page').forEach(p => p.classList.remove('active'));
  document.querySelector('.tab-bar').style.display = 'flex';
  goPage('page-home');
  updateProfileUI();
  renderCart();
}

/* ==== 页面切换（tab页） ==== */
function goPage(id) {
  if (!currentUser) { showAuth('login'); return; }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  const map = { 'page-home': 0, 'page-add': 1, 'page-recipe': 2, 'page-mine': 3 };
  if (map[id] !== undefined) document.querySelectorAll('.tab-item')[map[id]].classList.add('active');
}

/* ==== 清除错误提示 ==== */
function clearFormErrors() {
  document.querySelectorAll('.form-error').forEach(e => e.classList.remove('show'));
}

/* ==== 登录 ==== */
function handleLogin() {
  clearFormErrors();
  const phone = document.getElementById('loginPhone').value.trim();
  const pwd = document.getElementById('loginPwd').value;
  let ok = true;
  if (!isPhone(phone)) { document.getElementById('loginPhoneErr').classList.add('show'); ok = false; }
  if (!pwd) { document.getElementById('loginPwdErr').classList.add('show'); ok = false; }
  if (!ok) return;

  const users = JSON.parse(localStorage.getItem('fridge_users') || '{}');
  if (users[phone] && users[phone].pwd === pwd) {
    currentUser = users[phone];
    localStorage.setItem('fridge_current', phone);
    if (currentUser.fridgeBound) {
      enterApp();
    } else {
      showAuth('bind');
    }
  } else {
    document.getElementById('loginPwdErr').textContent = '手机号或密码错误';
    document.getElementById('loginPwdErr').classList.add('show');
  }
}

/* ==== 注册 ==== */
function handleRegister() {
  clearFormErrors();
  const nick = document.getElementById('regNick').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const code = document.getElementById('regCode').value.trim();
  const pwd = document.getElementById('regPwd').value;
  const agree = document.getElementById('regAgree').checked;

  let ok = true;
  if (!nick) { document.getElementById('regNickErr').classList.add('show'); ok = false; }
  if (!isPhone(phone)) { document.getElementById('regPhoneErr').classList.add('show'); ok = false; }
  if (code.length !== 6 || code !== smsCode) {
    document.getElementById('regCodeErr').classList.add('show'); ok = false;
  }
  if (!isPwdValid(pwd)) { document.getElementById('regPwdErr').classList.add('show'); ok = false; }
  if (!agree) { showToast('请先同意用户协议和隐私政策'); ok = false; }
  if (!ok) return;

  const users = JSON.parse(localStorage.getItem('fridge_users') || '{}');
  if (users[phone]) {
    showAlert('该手机号已注册，请直接登录', '注册提示', '⚠️', () => { showAuth('login'); });
    return;
  }

  users[phone] = { nick, phone, pwd, fridgeBound: false, fridgeCode: '', createAt: Date.now() };
  localStorage.setItem('fridge_users', JSON.stringify(users));
  currentUser = users[phone];
  localStorage.setItem('fridge_current', phone);
  showAlert('注册成功！请绑定您的冰箱', '注册成功', '🎉', () => { showAuth('bind'); });
}

/* ==== 发送验证码 ==== */
function sendSmsCode() {
  const phone = document.getElementById('regPhone').value.trim();
  if (!isPhone(phone)) {
    document.getElementById('regPhoneErr').classList.add('show');
    return;
  }
  if (smsTimer > 0) return;
  smsCode = String(Math.floor(100000 + Math.random() * 900000));
  showAlert('验证码：' + smsCode + '\n（演示用，请手动输入）', '验证码已发送', '📱');
  smsTimer = 60;
  const btn = document.getElementById('sendCodeBtn');
  const timer = setInterval(() => {
    smsTimer--;
    btn.textContent = smsTimer + 's 后重发';
    btn.disabled = true;
    if (smsTimer <= 0) {
      clearInterval(timer);
      btn.textContent = '获取验证码';
      btn.disabled = false;
    }
  }, 1000);
}

/* ==== 绑定码输入 ==== */
function handleCodeInput(el) {
  const idx = parseInt(el.dataset.idx);
  if (el.value && idx < 5) {
    document.querySelectorAll('.code-input')[idx + 1].focus();
  }
  el.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Backspace' && !el.value && idx > 0) {
      document.querySelectorAll('.code-input')[idx - 1].focus();
    }
    el.removeEventListener('keydown', onKey);
  });
}

/* ==== 绑定冰箱 ==== */
function handleBind() {
  const inputs = document.querySelectorAll('.code-input');
  let code = '';
  inputs.forEach(i => code += i.value);
  if (code.length !== 6) {
    showToast('请输入完整的6位绑定码');
    return;
  }
  if (!currentUser) return;

  const users = JSON.parse(localStorage.getItem('fridge_users') || '{}');
  currentUser.fridgeBound = true;
  currentUser.fridgeCode = code;
  users[currentUser.phone] = currentUser;
  localStorage.setItem('fridge_users', JSON.stringify(users));
  localStorage.setItem('fridge_current', currentUser.phone);

  showAlert('绑定成功！欢迎使用智能冰箱食材管家', '绑定成功', '🎉', () => { enterApp(); });
}

function skipBind() {
  showConfirm('确定跳过绑定吗？未绑定冰箱将无法同步食材数据', '跳过绑定', '⚠️').then(ok => {
    if (ok) enterApp();
  });
}

function goBind() {
  showAuth('bind');
}

/* ==== 退出登录 ==== */
function handleLogout() {
  showConfirm('确定退出登录吗？', '退出登录', '🚪').then(ok => {
    if (ok) {
      currentUser = null;
      localStorage.removeItem('fridge_current');
      showAuth('login');
      document.getElementById('loginPhone').value = '';
      document.getElementById('loginPwd').value = '';
    }
  });
}

/* ==== 更新个人信息UI ==== */
function updateProfileUI() {
  if (!currentUser) return;
  document.getElementById('profileName').textContent = currentUser.nick || '用户';
  document.getElementById('profilePhone').textContent = maskPhone(currentUser.phone);
  const bindEl = document.getElementById('profileBind');
  const descEl = document.getElementById('menuFridgeDesc');
  if (currentUser.fridgeBound) {
    bindEl.textContent = '已绑定冰箱';
    bindEl.classList.remove('unbound');
    descEl.textContent = 'FRG-2026X';
  } else {
    bindEl.textContent = '未绑定冰箱';
    bindEl.classList.add('unbound');
    descEl.textContent = '去绑定';
  }
}

/* ==== 区域切换 ==== */
function switchZone(el, zone) {
  document.querySelectorAll('.zone-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

/* ==== 扫描食材 ==== */
function scanFood(method) {
  const r = document.getElementById('scanResult');
  r.classList.add('show');
  const items = [
    { icon: '🥦', name: '西兰花', detail: '识别结果：西兰花 · 约 350g · 冷藏保鲜 3-5天' },
    { icon: '🥩', name: '牛腱肉', detail: '识别结果：牛腱肉 · 约 500g · 冷藏2天/冷冻30天' },
    { icon: '🥛', name: '鲜牛奶', detail: '识别结果：鲜牛奶 · 约 1L · 冷藏7天' }
  ];
  const item = items[Math.floor(Math.random() * items.length)];
  r.querySelector('.scan-icon').textContent = item.icon;
  r.querySelector('.scan-name').textContent = item.name;
  r.querySelector('.scan-detail').textContent = item.detail;
}

/* ==== 食谱详情弹窗（保留原功能） ==== */
function showRecipeDetail(name, ingredients, steps, time, diff) {
  const content = '食材：' + ingredients + '\n\n' + steps + '\n\n用时：' + time + ' · 难度：' + diff;
  showAlert(content, name, '🍳');
}

/* ============================================================
   新增功能模块
   ============================================================ */

/* ==== 1. 子页面导航系统 ==== */

/* 打开子页面：给父容器添加 sub-open，目标子页面添加 active */
function goSubPage(parentId, subId) {
  const parent = document.getElementById(parentId);
  if (parent) parent.classList.add('sub-open');
  const sub = document.getElementById(subId);
  if (sub) sub.classList.add('active');
}

/* 关闭子页面：移除所有子页面的 active 和父容器的 sub-open */
function closeSubPage(parentId) {
  document.querySelectorAll('.sub-page.active').forEach(p => p.classList.remove('active'));
  if (parentId) {
    const parent = document.getElementById(parentId);
    if (parent) parent.classList.remove('sub-open');
  } else {
    document.querySelectorAll('.sub-open').forEach(p => p.classList.remove('sub-open'));
  }
}

/* ==== 2. 下拉刷新功能 ==== */

/* 绑定下拉刷新事件到 #page-home 的 pull-refresh 容器 */
(function initPullRefresh() {
  const container = document.getElementById('page-home');
  if (!container) return;
  const pullEl = container.querySelector('.pull-refresh');

  if (pullEl) {
    pullEl.addEventListener('touchstart', function (e) {
      /* 只在页面滚动到顶部时才允许下拉 */
      if (window.scrollY > 0 || window.pageYOffset > 0) return;
      pullStartY = e.touches[0].clientY;
      pulling = true;
    }, { passive: true });

    pullEl.addEventListener('touchmove', function (e) {
      if (!pulling) return;
      const dy = e.touches[0].clientY - pullStartY;
      if (dy > 0) {
        /* 限制最大下拉距离为 100px */
        const dist = Math.min(dy * 0.5, 100);
        pullEl.style.transform = 'translateY(' + dist + 'px)';
        pullEl.style.transition = 'none';
        if (dist > 50) {
          pullEl.classList.add('pull-ready');
        } else {
          pullEl.classList.remove('pull-ready');
        }
      }
    }, { passive: true });

    pullEl.addEventListener('touchend', function () {
      if (!pulling) return;
      pulling = false;
      pullEl.style.transition = 'transform 0.3s ease';
      pullEl.style.transform = 'translateY(0)';
      pullEl.classList.remove('pull-ready');

      if (pullEl.classList.contains('pull-triggered') ||
          parseInt(pullEl.style.transform.replace(/[^0-9.-]/g, '')) > 40) {
        /* 触发刷新动画 */
        pullEl.classList.add('pull-loading');
        setTimeout(function () {
          pullEl.classList.remove('pull-loading');
          showToast('数据已同步');
        }, 1500);
      }
    });
  }
})();

/* ==== 3. 左滑删除 / 右滑标记已食用 ==== */

/* 收回所有已展开的滑动项 */
function collapseAllSwipeItems() {
  document.querySelectorAll('.food-item.swiped-left').forEach(el => {
    el.classList.remove('swiped-left');
  });
  document.querySelectorAll('.food-item.swiped-right').forEach(el => {
    el.classList.remove('swiped-right');
  });
}

/* 点击空白区域收回所有已展开的滑动项 */
(function initSwipeCollapse() {
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.food-item') && !e.target.closest('.swipe-actions')) {
      collapseAllSwipeItems();
    }
  });
})();

/* 为食材列表项绑定滑动事件 */
function initSwipeHandlers() {
  document.querySelectorAll('.food-item').forEach(function (item, index) {
    let startX = 0;
    let currentX = 0;
    let swiping = false;

    item.addEventListener('touchstart', function (e) {
      /* 先收起其他已展开的项 */
      collapseAllSwipeItems();
      startX = e.touches[0].clientX;
      swiping = true;
    }, { passive: true });

    item.addEventListener('touchmove', function (e) {
      if (!swiping) return;
      currentX = e.touches[0].clientX - startX;
      /* 限制最大滑动范围 */
      const maxSwipe = 80;
      if (currentX < -maxSwipe) currentX = -maxSwipe;
      if (currentX > maxSwipe) currentX = maxSwipe;
      item.style.transition = 'none';
    }, { passive: true });

    item.addEventListener('touchend', function () {
      if (!swiping) return;
      swiping = false;
      item.style.transition = 'transform 0.3s ease';

      const threshold = 60;
      if (currentX < -threshold) {
        /* 左滑：显示删除按钮 */
        item.classList.add('swiped-left');
        item.classList.remove('swiped-right');
      } else if (currentX > threshold) {
        /* 右滑：显示已食用按钮 */
        item.classList.add('swiped-right');
        item.classList.remove('swiped-left');
      } else {
        /* 未达到阈值，收回 */
        item.classList.remove('swiped-left', 'swiped-right');
      }
      currentX = 0;
    });
  });
}

/* 删除食材（带确认弹窗） */
function deleteFood(index) {
  showConfirm('确定删除该食材吗？删除后不可恢复。', '删除确认', '🗑️').then(function (ok) {
    if (ok) {
      const list = document.querySelectorAll('.food-item');
      if (list[index]) {
        list[index].style.transition = 'all 0.3s ease';
        list[index].style.opacity = '0';
        list[index].style.transform = 'translateX(-100%)';
        list[index].style.maxHeight = '0';
        list[index].style.padding = '0';
        list[index].style.margin = '0';
        setTimeout(function () {
          list[index].remove();
        }, 300);
        showToast('食材已删除');
      }
    }
    collapseAllSwipeItems();
  });
}

/* 标记食材已食用 */
function markEaten(index) {
  const list = document.querySelectorAll('.food-item');
  if (list[index]) {
    list[index].style.transition = 'all 0.3s ease';
    list[index].style.opacity = '0';
    list[index].style.transform = 'translateX(100%)';
    list[index].style.maxHeight = '0';
    list[index].style.padding = '0';
    list[index].style.margin = '0';
    setTimeout(function () {
      list[index].remove();
    }, 300);
    showToast('已标记为已食用');
  }
  collapseAllSwipeItems();
}

/* ==== 4. 手动添加食材表单 ==== */

/* 打开手动添加表单 */
function openManualAdd() {
  const form = document.getElementById('manualAddForm');
  const scanResult = document.getElementById('scanResult');
  if (form) form.classList.add('show');
  if (scanResult) scanResult.classList.remove('show');
}

/* 关闭手动添加表单 */
function closeManualAdd() {
  const form = document.getElementById('manualAddForm');
  if (form) form.classList.remove('show');
  /* 清空表单 */
  const nameInput = document.getElementById('manualFoodName');
  const weightInput = document.getElementById('manualFoodWeight');
  const zoneSelect = document.getElementById('manualFoodZone');
  if (nameInput) nameInput.value = '';
  if (weightInput) weightInput.value = '';
  if (zoneSelect) zoneSelect.selectedIndex = 0;
}

/* 快捷标签点击：自动填充食材名称 */
function fillQuickTag(tagName) {
  const nameInput = document.getElementById('manualFoodName');
  if (nameInput) nameInput.value = tagName;
}

/* 处理手动添加 */
function handleManualAdd() {
  const nameInput = document.getElementById('manualFoodName');
  const weightInput = document.getElementById('manualFoodWeight');
  const zoneSelect = document.getElementById('manualFoodZone');

  const name = (nameInput && nameInput.value.trim()) || '';
  const weight = (weightInput && weightInput.value.trim()) || '';
  const zone = (zoneSelect && zoneSelect.value) || '冷藏区';

  /* 验证 */
  if (!name) {
    showToast('请输入食材名称');
    if (nameInput) nameInput.focus();
    return;
  }

  /* 添加到最近记录列表 */
  const recentList = document.getElementById('recentFoodList');
  if (recentList) {
    const newItem = document.createElement('div');
    newItem.className = 'food-item reveal visible';
    newItem.innerHTML =
      '<div class="food-item__info">' +
        '<span class="food-item__icon">📦</span>' +
        '<div class="food-item__text">' +
          '<span class="food-item__name">' + name + '</span>' +
          '<span class="food-item__meta">' + weight + ' · ' + zone + ' · 刚刚添加</span>' +
        '</div>' +
      '</div>';
    recentList.prepend(newItem);
    /* 为新项重新初始化滑动事件 */
    initSwipeHandlers();
  }

  showToast('食材 "' + name + '" 添加成功');
  closeManualAdd();
}

/* ==== 5. 扫描结果修正功能 ==== */

/* 将扫描结果名称变为可编辑的 input，允许用户修正 */
function editScanResult() {
  const r = document.getElementById('scanResult');
  if (!r) return;
  const nameEl = r.querySelector('.scan-name');
  if (!nameEl) return;

  const currentName = nameEl.textContent;
  /* 替换为 input */
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.className = 'scan-name-edit';
  input.id = 'scanNameEdit';
  input.placeholder = '修正食材名称';

  nameEl.style.display = 'none';
  nameEl.parentNode.insertBefore(input, nameEl.nextSibling);
  input.focus();
  input.select();

  /* 更换按钮为确认按钮 */
  const editBtn = r.querySelector('.scan-edit-btn');
  if (editBtn) {
    editBtn.style.display = 'none';
  }
  const confirmBtn = r.querySelector('.scan-confirm-btn');
  if (confirmBtn) {
    confirmBtn.style.display = 'inline-block';
  }
}

/* 确认修正后的结果 */
function confirmScanEdit() {
  const r = document.getElementById('scanResult');
  if (!r) return;
  const input = document.getElementById('scanNameEdit');
  const nameEl = r.querySelector('.scan-name');
  if (!input || !nameEl) return;

  const newName = input.value.trim();
  if (!newName) {
    showToast('食材名称不能为空');
    input.focus();
    return;
  }

  nameEl.textContent = newName;
  nameEl.style.display = '';

  /* 移除 input */
  input.remove();

  /* 恢复按钮 */
  const editBtn = r.querySelector('.scan-edit-btn');
  if (editBtn) {
    editBtn.style.display = 'inline-block';
  }
  const confirmBtn = r.querySelector('.scan-confirm-btn');
  if (confirmBtn) {
    confirmBtn.style.display = 'none';
  }

  showToast('食材名称已修正为 "' + newName + '"');
}

/* ==== 6. 菜谱详情子页面 ==== */

/* 打开菜谱详情子页面，填充数据 */
function openRecipeDetail(idx) {
  const recipe = recipes[idx];
  if (!recipe) return;

  goSubPage('page-recipe', 'recipeDetail');

  /* 填充菜谱标题 */
  const titleEl = document.getElementById('recipeDetailTitle');
  if (titleEl) titleEl.textContent = recipe.name;

  /* 填充菜谱基本信息 */
  const metaEl = document.getElementById('recipeDetailMeta');
  if (metaEl) {
    metaEl.textContent = '用时 ' + recipe.time + ' · 难度 ' + recipe.diff + ' · 匹配度 ' + recipe.match + '%';
  }

  /* 填充食材列表 */
  const ingEl = document.getElementById('recipeDetailIngredients');
  if (ingEl) {
    ingEl.innerHTML = '';
    recipe.ingredients.forEach(function (ing) {
      const div = document.createElement('div');
      div.className = 'recipe-detail__ingredient' + (ing.have ? ' have' : ' missing');
      div.innerHTML =
        '<span class="ingredient-check">' + (ing.have ? '✅' : '❌') + '</span>' +
        '<span class="ingredient-name">' + ing.name + '</span>' +
        '<span class="ingredient-status">' + (ing.have ? '已有' : '缺少') + '</span>';
      ingEl.appendChild(div);
    });
  }

  /* 填充步骤列表 */
  const stepsEl = document.getElementById('recipeDetailSteps');
  if (stepsEl) {
    stepsEl.innerHTML = '';
    recipe.steps.forEach(function (step, i) {
      const div = document.createElement('div');
      div.className = 'recipe-detail__step';
      div.innerHTML =
        '<span class="step-num">' + (i + 1) + '</span>' +
        '<span class="step-text">' + step + '</span>';
      stepsEl.appendChild(div);
    });
  }

  /* 绑定加入购物清单按钮 */
  const cartBtn = document.getElementById('recipeCartBtn');
  if (cartBtn) {
    cartBtn.onclick = function () {
      addToCart(idx);
    };
  }

  /* 绑定开始烹饪按钮 */
  const cookBtn = document.getElementById('recipeCookBtn');
  if (cookBtn) {
    cookBtn.onclick = function () {
      startCooking(idx);
    };
  }
}

/* 将缺失食材加入购物清单 */
function addToCart(recipeIdx) {
  const recipe = recipes[recipeIdx];
  if (!recipe) return;

  let addedCount = 0;
  recipe.ingredients.forEach(function (ing) {
    if (!ing.have) {
      /* 检查是否已在购物清单中 */
      const exists = cartItems.some(function (item) {
        return item.name.indexOf(ing.name) !== -1;
      });
      if (!exists) {
        cartItems.push({
          id: Date.now() + Math.random(),
          name: ing.name,
          checked: false
        });
        addedCount++;
      }
    }
  });

  if (addedCount > 0) {
    saveCart();
    renderCart();
    showToast('已添加 ' + addedCount + ' 项食材到购物清单');
  } else {
    showToast('所有食材均已在购物清单中');
  }
}

/* ==== 7. 烹饪模式 ==== */

/* 进入烹饪模式 */
function startCooking(recipeIdx) {
  const recipe = recipes[recipeIdx];
  if (!recipe) return;

  cookCurrentStep = 0;
  cookSeconds = 0;

  goSubPage('page-recipe', 'cookMode');

  /* 填充烹饪模式标题 */
  const titleEl = document.getElementById('cookTitle');
  if (titleEl) titleEl.textContent = recipe.name;

  /* 渲染步骤 */
  renderCookSteps(recipe);
  updateCookTimerDisplay();
}

/* 渲染烹饪步骤 */
function renderCookSteps(recipe) {
  const stepsEl = document.getElementById('cookSteps');
  if (!stepsEl) return;

  stepsEl.innerHTML = '';
  recipe.steps.forEach(function (step, i) {
    const div = document.createElement('div');
    div.className = 'cook-step' + (i === cookCurrentStep ? ' current' : '') + (i < cookCurrentStep ? ' done' : '');
    div.innerHTML =
      '<span class="cook-step__num">' + (i + 1) + '</span>' +
      '<span class="cook-step__text">' + step + '</span>';
    stepsEl.appendChild(div);
  });

  /* 滚动当前步骤到可视区域 */
  const currentStep = stepsEl.querySelector('.cook-step.current');
  if (currentStep) {
    currentStep.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* 更新步骤进度 */
  const progressEl = document.getElementById('cookProgress');
  if (progressEl) {
    progressEl.textContent = '第 ' + (cookCurrentStep + 1) + ' 步 / 共 ' + recipe.steps.length + ' 步';
  }
}

/* 开始/暂停计时器 */
function toggleCookTimer() {
  const btn = document.getElementById('cookTimerBtn');
  if (cookTimer) {
    /* 暂停 */
    clearInterval(cookTimer);
    cookTimer = null;
    if (btn) btn.textContent = '继续';
  } else {
    /* 开始 */
    cookTimer = setInterval(function () {
      cookSeconds++;
      updateCookTimerDisplay();
    }, 1000);
    if (btn) btn.textContent = '暂停';
  }
}

/* 重置计时器 */
function resetCookTimer() {
  if (cookTimer) {
    clearInterval(cookTimer);
    cookTimer = null;
  }
  cookSeconds = 0;
  updateCookTimerDisplay();
  const btn = document.getElementById('cookTimerBtn');
  if (btn) btn.textContent = '开始计时';
}

/* 上一步 */
function prevStep() {
  if (cookCurrentStep > 0) {
    cookCurrentStep--;
    const recipe = recipes.find(function (r) {
      const titleEl = document.getElementById('cookTitle');
      return titleEl && titleEl.textContent === r.name;
    });
    if (recipe) renderCookSteps(recipe);
    /* 重置计时器 */
    resetCookTimer();
  }
}

/* 下一步 */
function nextStep() {
  const recipe = recipes.find(function (r) {
    const titleEl = document.getElementById('cookTitle');
    return titleEl && titleEl.textContent === r.name;
  });

  if (!recipe) return;

  if (cookCurrentStep < recipe.steps.length - 1) {
    cookCurrentStep++;
    renderCookSteps(recipe);
    /* 重置计时器 */
    resetCookTimer();
  } else {
    /* 最后一步完成 */
    if (cookTimer) {
      clearInterval(cookTimer);
      cookTimer = null;
    }
    showAlert('恭喜！菜品制作完成\n用时：' + formatCookTime(cookSeconds), '烹饪完成', '🎉', function () {
      closeSubPage('page-recipe');
    });
  }
}

/* 更新计时器显示 */
function updateCookTimerDisplay() {
  const displayEl = document.getElementById('cookTimerDisplay');
  if (displayEl) {
    displayEl.textContent = formatCookTime(cookSeconds);
  }
}

/* 格式化烹饪时间 */
function formatCookTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
}

/* 退出烹饪模式时清理计时器 */
(function initCookCleanup() {
  document.addEventListener('click', function (e) {
    if (e.target.closest('.cook-back-btn')) {
      if (cookTimer) {
        clearInterval(cookTimer);
        cookTimer = null;
      }
    }
  });
})();

/* ==== 8. 购物清单管理 ==== */

/* 保存购物清单到 localStorage */
function saveCart() {
  localStorage.setItem('fridge_cart', JSON.stringify(cartItems));
}

/* 勾选/取消勾选购物清单项 */
function toggleCartItem(id) {
  cartItems.forEach(function (item) {
    if (item.id === id) {
      item.checked = !item.checked;
    }
  });
  saveCart();
  renderCart();
}

/* 清除已勾选项 */
function clearCartChecked() {
  const checkedCount = cartItems.filter(function (item) { return item.checked; }).length;
  if (checkedCount === 0) {
    showToast('没有已勾选的项');
    return;
  }
  showConfirm('确定清除 ' + checkedCount + ' 项已勾选内容吗？', '清除确认', '🗑️').then(function (ok) {
    if (ok) {
      cartItems = cartItems.filter(function (item) { return !item.checked; });
      saveCart();
      renderCart();
      showToast('已清除 ' + checkedCount + ' 项');
    }
  });
}

/* 从菜谱添加缺失食材到购物清单 */
function addItemsToCart(items) {
  let addedCount = 0;
  items.forEach(function (itemName) {
    const exists = cartItems.some(function (item) {
      return item.name.indexOf(itemName) !== -1;
    });
    if (!exists) {
      cartItems.push({
        id: Date.now() + Math.random(),
        name: itemName,
        checked: false
      });
      addedCount++;
    }
  });
  if (addedCount > 0) {
    saveCart();
    renderCart();
    showToast('已添加 ' + addedCount + ' 项到购物清单');
  } else {
    showToast('所有食材均已在购物清单中');
  }
}

/* 渲染购物清单列表 */
function renderCart() {
  const listEl = document.getElementById('cartList');
  if (!listEl) return;

  listEl.innerHTML = '';

  if (cartItems.length === 0) {
    listEl.innerHTML = '<div class="cart-empty">购物清单为空</div>';
    return;
  }

  cartItems.forEach(function (item) {
    const div = document.createElement('div');
    div.className = 'cart-item' + (item.checked ? ' checked' : '');
    div.innerHTML =
      '<label class="cart-item__check">' +
        '<input type="checkbox"' + (item.checked ? ' checked' : '') +
        ' onchange="toggleCartItem(' + item.id + ')">' +
        '<span class="checkmark"></span>' +
      '</label>' +
      '<span class="cart-item__name">' + item.name + '</span>' +
      '<span class="cart-item__delete" onclick="removeCartItem(' + item.id + ')">✕</span>';
    listEl.appendChild(div);
  });
}

/* 移除单个购物清单项 */
function removeCartItem(id) {
  cartItems = cartItems.filter(function (item) { return item.id !== id; });
  saveCart();
  renderCart();
  showToast('已移除');
}

/* ==== 9. 设备管理 ==== */

/* 解绑设备 */
function unbindDevice() {
  if (!currentUser) return;
  showConfirm('确定解绑当前冰箱吗？解绑后将无法同步食材数据。', '解绑确认', '⚠️').then(function (ok) {
    if (ok) {
      const users = JSON.parse(localStorage.getItem('fridge_users') || '{}');
      currentUser.fridgeBound = false;
      currentUser.fridgeCode = '';
      users[currentUser.phone] = currentUser;
      localStorage.setItem('fridge_users', JSON.stringify(users));
      updateProfileUI();
      showToast('冰箱已解绑');
    }
  });
}

/* 添加/绑定设备（跳转到绑定页面） */
function addDevice() {
  showAuth('bind');
}

/* ==== 10. 个人资料编辑 ==== */

/* 保存昵称修改到 localStorage */
function saveProfile() {
  if (!currentUser) return;
  const nickInput = document.getElementById('profileNickEdit');
  const newNick = (nickInput && nickInput.value.trim()) || '';
  if (!newNick) {
    showToast('昵称不能为空');
    if (nickInput) nickInput.focus();
    return;
  }

  const users = JSON.parse(localStorage.getItem('fridge_users') || '{}');
  currentUser.nick = newNick;
  users[currentUser.phone] = currentUser;
  localStorage.setItem('fridge_users', JSON.stringify(users));
  updateProfileUI();
  showToast('昵称修改成功');

  /* 关闭编辑弹窗 */
  const editPanel = document.getElementById('profileEditPanel');
  if (editPanel) editPanel.classList.remove('show');
}

/* ==== 11. FAQ折叠 ==== */

/* 切换FAQ展开/折叠 */
function toggleFAQ(el) {
  const content = el.nextElementSibling;
  const icon = el.querySelector('.faq-arrow');

  if (content) {
    content.classList.toggle('expanded');
  }
  if (icon) {
    icon.classList.toggle('rotated');
  }
  el.classList.toggle('active');
}

/* ==== 12. 反馈提交 ==== */

/* 提交反馈 */
function submitFeedback() {
  const contentEl = document.getElementById('feedbackContent');
  const typeEl = document.getElementById('feedbackType');

  const content = (contentEl && contentEl.value.trim()) || '';
  const type = (typeEl && typeEl.value) || '建议';

  if (!content) {
    showToast('请输入反馈内容');
    if (contentEl) contentEl.focus();
    return;
  }

  /* 模拟保存反馈到 localStorage */
  const feedbacks = JSON.parse(localStorage.getItem('fridge_feedbacks') || '[]');
  feedbacks.push({
    content: content,
    type: type,
    time: Date.now(),
    user: currentUser ? currentUser.phone : 'anonymous'
  });
  localStorage.setItem('fridge_feedbacks', JSON.stringify(feedbacks));

  /* 清空表单 */
  if (contentEl) contentEl.value = '';
  if (typeEl) typeEl.selectedIndex = 0;

  showToast('感谢您的反馈');
}

/* ==== 13. Toggle开关 ==== */

/* 通过 onclick 切换 checked class */
function toggleSwitch(el) {
  el.classList.toggle('checked');

  /* 如果是通知开关，保存设置到 localStorage */
  if (el.dataset.setting === 'notification') {
    const isOn = el.classList.contains('checked');
    localStorage.setItem('fridge_notification', isOn ? 'on' : 'off');
    showToast(isOn ? '通知已开启' : '通知已关闭');
  }

  /* 如果是保鲜提醒开关 */
  if (el.dataset.setting === 'expirtyAlert') {
    const isOn = el.classList.contains('checked');
    localStorage.setItem('fridge_expirty_alert', isOn ? 'on' : 'off');
    showToast(isOn ? '保鲜提醒已开启' : '保鲜提醒已关闭');
  }

  /* 如果是自动同步开关 */
  if (el.dataset.setting === 'autoSync') {
    const isOn = el.classList.contains('checked');
    localStorage.setItem('fridge_auto_sync', isOn ? 'on' : 'off');
    showToast(isOn ? '自动同步已开启' : '自动同步已关闭');
  }
}

/* ==== 14. 食材管理搜索和筛选 ==== */

/* 搜索食材 */
function searchFood(keyword) {
  const items = document.querySelectorAll('.food-item');
  const kw = (keyword || '').trim().toLowerCase();

  items.forEach(function (item) {
    if (!kw) {
      /* 关键词为空，显示所有 */
      item.style.display = '';
      return;
    }
    const nameEl = item.querySelector('.food-item__name');
    const name = nameEl ? nameEl.textContent.toLowerCase() : '';
    if (name.indexOf(kw) !== -1) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

/* 按区域筛选 */
function filterByZone(zone) {
  const items = document.querySelectorAll('.food-item');
  items.forEach(function (item) {
    if (zone === 'all') {
      item.style.display = '';
      return;
    }
    const metaEl = item.querySelector('.food-item__meta');
    const meta = metaEl ? metaEl.textContent : '';
    if (meta.indexOf(zone) !== -1) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

/* ==== 初始化：检查登录状态 ==== */
(function init() {
  const savedPhone = localStorage.getItem('fridge_current');
  if (savedPhone) {
    const users = JSON.parse(localStorage.getItem('fridge_users') || '{}');
    if (users[savedPhone]) {
      currentUser = users[savedPhone];
      enterApp();
      return;
    }
  }
  showAuth('login');
})();
