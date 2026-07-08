import { store } from './store.js';
import {
  ITEM_CATEGORIES,
  SUB_CATEGORIES,
  CYCLES,
  CURRENCIES,
  ALERT_DAYS,
  SUB_STATUS,
  fmtMonthDay,
  daysBetween,
  monthlyAmount,
  cycleToDays,
  todayStr,
} from './data.js';

/* ============ DOM refs ============ */
const els = {
  pages: {
    login: document.getElementById('page-login'),
    remind: document.getElementById('page-remind'),
    items: document.getElementById('page-items'),
    subs: document.getElementById('page-subs'),
    me: document.getElementById('page-me'),
    about: document.getElementById('page-about'),
  },
  contents: {
    remind: document.getElementById('remind-content'),
    items: document.getElementById('items-content'),
    subs: document.getElementById('subs-content'),
    me: document.getElementById('me-content'),
    about: document.getElementById('about-content'),
  },
  tabbar: document.getElementById('tabbar'),
  loginBtn: document.getElementById('login-btn'),
  aboutBack: document.getElementById('about-back'),
  sheet: {
    overlay: document.getElementById('sheet-overlay'),
    panel: document.getElementById('sheet'),
    title: document.getElementById('sheet-title'),
    body: document.getElementById('sheet-body'),
    footer: document.getElementById('sheet-footer'),
    close: document.getElementById('sheet-close'),
  },
  action: {
    overlay: document.getElementById('action-overlay'),
    panel: document.getElementById('action-sheet'),
    items: document.getElementById('action-items'),
    cancel: document.getElementById('action-cancel'),
  },
  toast: document.getElementById('toast'),
};

let actionCallback = null;
let searchTimer = null;

/* ============ utils ============ */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  setTimeout(() => els.toast.classList.remove('show'), 1800);
}

function showPage(page) {
  if (page === 'login') {
    els.tabbar.style.display = 'none';
  } else {
    els.tabbar.style.display = 'flex';
  }

  Object.keys(els.pages).forEach((k) => {
    const p = els.pages[k];
    if (k === page) {
      p.classList.add('active');
      p.style.display = 'block';
    } else {
      p.classList.remove('active');
      p.style.display = 'none';
    }
  });

  store.setPage(page);
  updateTabbar(page);
  renderCurrentPage();
}

function updateTabbar(page) {
  const tabs = els.tabbar.querySelectorAll('.tab-item');
  tabs.forEach((tab) => {
    const p = tab.dataset.page;
    const icon = tab.querySelector('.tab-icon');
    const isActive = p === page;
    tab.classList.toggle('active', isActive);
    icon.src = `static/tabbar/${p}${isActive ? '-active' : ''}.png`;
  });
}

/* ============ Sheet ============ */
function openSheet(title, bodyHtml, footerHtml = '') {
  els.sheet.title.textContent = title;
  els.sheet.body.innerHTML = bodyHtml;
  els.sheet.footer.innerHTML = footerHtml;
  els.sheet.overlay.classList.add('show');
  els.sheet.panel.classList.add('show');
}

function closeSheet() {
  els.sheet.overlay.classList.remove('show');
  els.sheet.panel.classList.remove('show');
  store.state.itemSheetVisible = false;
  store.state.subSheetVisible = false;
  store.state.typeSheetVisible = false;
}

/* ============ ActionSheet ============ */
function openActionSheet(items, callback) {
  actionCallback = callback;
  store.state.actionItems = items;
  store.state.actionVisible = true;
  els.action.items.innerHTML = items
    .map(
      (it, i) =>
        `<div class="action-item ${it.type || ''}" data-idx="${i}">${escapeHtml(
          it.label
        )}</div>`
    )
    .join('');
  els.action.overlay.classList.add('show');
  els.action.panel.classList.add('show');
}

function closeActionSheet() {
  els.action.overlay.classList.remove('show');
  els.action.panel.classList.remove('show');
  actionCallback = null;
  store.state.actionVisible = false;
  store.state.actionItems = [];
}

/* ============ render cards ============ */
function renderItemCard(item) {
  const cat = ITEM_CATEGORIES.find((c) => c.value === item.category) || ITEM_CATEGORIES[5];
  const d = daysBetween(item.dueDate);
  let dueClass = '';
  let dueText = '';
  if (d === null) {
    dueText = `<div class="item-sub">📍 ${escapeHtml(item.location || '未设置位置')}</div>`;
  } else if (d < 0) {
    dueClass = 'danger';
    dueText = `<span class="num">${-d}</span><span class="unit">天前过期</span>`;
  } else if (d === 0) {
    dueClass = 'danger';
    dueText = `<span class="num">今天</span><span class="unit">到期</span>`;
  } else if (d <= 7) {
    dueText = `<span class="num">${d}</span><span class="unit">天后到期</span>`;
  } else {
    dueClass = 'safe';
    dueText = `<span class="num">${d}</span><span class="unit">天后到期</span>`;
  }

  return `
    <div class="item-card" data-id="${item.id}" data-type="item">
      <div class="item-icon" style="background:${cat.bg}">${cat.emoji}</div>
      <div class="item-info">
        <div class="item-name">${escapeHtml(item.name)}</div>
        <div class="item-meta">
          <span class="badge">${escapeHtml(item.category || '其他')}</span>
          ${item.quantity > 1 ? `<span>×${item.quantity}</span>` : ''}
          ${item.dueDate ? `<span class="inline-item">📅 ${fmtMonthDay(item.dueDate)}</span>` : ''}
          ${item.location && item.dueDate ? `<span class="inline-item">📍 ${escapeHtml(item.location)}</span>` : ''}
        </div>
      </div>
      <div class="item-action">
        <div class="item-due ${dueClass}">${dueText}</div>
      </div>
    </div>
  `;
}

function renderSubCard(sub) {
  const d = daysBetween(sub.renewDate);
  let dueClass = '';
  let dueText = '';
  if (d < 0) {
    dueClass = 'danger';
    dueText = `<span class="num">${-d}</span><span class="unit">天前</span>`;
  } else if (d === 0) {
    dueClass = 'danger';
    dueText = `<span class="num">今天</span><span class="unit">续费</span>`;
  } else if (d <= 7) {
    dueText = `<span class="num">${d}</span><span class="unit">天后</span>`;
  } else {
    dueClass = 'safe';
    dueText = `<span class="num">${d}</span><span class="unit">天后</span>`;
  }

  let statusClass = '';
  if (sub.status === '试用') statusClass = 'warn';
  else if (sub.status === '活跃') statusClass = 'success';

  const initial = (sub.name || '?').slice(0, 1);

  return `
    <div class="item-card" data-id="${sub.id}" data-type="sub">
      <div class="item-icon sub">${escapeHtml(initial)}</div>
      <div class="item-info">
        <div class="item-name">${escapeHtml(sub.name)}</div>
        <div class="item-meta">
          <span class="badge ${statusClass}">${escapeHtml(sub.status)}</span>
          <span>${sub.currency}${sub.amount}/${sub.cycle}</span>
          <span class="inline-item">📅 ${fmtMonthDay(sub.renewDate)}</span>
        </div>
      </div>
      <div class="item-action">
        <div class="item-due ${dueClass}">${dueText}</div>
        <div class="item-sub">≈ ${sub.currency}${monthlyAmount(sub.amount, sub.cycle)}/月</div>
      </div>
    </div>
  `;
}

function renderEmpty(icon, text, tip) {
  return `
    <div class="empty">
      <div class="empty-icon">${icon}</div>
      <div class="empty-text">${escapeHtml(text)}</div>
      <div class="empty-tip">${escapeHtml(tip)}</div>
    </div>
  `;
}

function bindCardClicks(containerSelector, pageType) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.querySelectorAll('.item-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = Number(card.dataset.id);
      const type = card.dataset.type;
      if (type === 'item') {
        const item = store.state.items.find((i) => i.id === id);
        openItemAction(item, pageType);
      } else {
        const sub = store.state.subs.find((s) => s.id === id);
        openSubAction(sub, pageType);
      }
    });
  });
}

/* ============ Action handlers ============ */
function openItemAction(item, pageType) {
  store.state.actionTarget = { type: 'item', id: item.id, pageType };
  openActionSheet(
    [
      { key: 'edit', label: '编辑物品', type: 'primary' },
      { key: 'done', label: '标记已处理（顺延 30 天）', type: 'primary' },
      { key: 'delete', label: '删除物品', type: 'danger' },
    ],
    (key) => handleItemAction(key, item, pageType)
  );
}

function openSubAction(sub, pageType) {
  store.state.actionTarget = { type: 'sub', id: sub.id, pageType };
  openActionSheet(
    [
      { key: 'edit', label: '编辑订阅', type: 'primary' },
      { key: 'done', label: '已续费（按周期顺延）', type: 'primary' },
      { key: 'delete', label: '删除订阅', type: 'danger' },
    ],
    (key) => handleSubAction(key, sub, pageType)
  );
}

function handleItemAction(key, item, pageType) {
  if (key === 'edit') {
    openItemForm({ ...item });
  } else if (key === 'done') {
    store.extendItem(item.id, 30);
    showToast('已顺延 30 天');
    renderCurrentPage();
  } else if (key === 'delete') {
    if (window.confirm('确定删除吗？此操作不可撤销。')) {
      store.deleteItem(item.id);
      showToast('已删除');
      renderCurrentPage();
    }
  }
}

function handleSubAction(key, sub, pageType) {
  if (key === 'edit') {
    openSubForm({ ...sub });
  } else if (key === 'done') {
    store.renewSub(sub.id);
    showToast('已续费');
    renderCurrentPage();
  } else if (key === 'delete') {
    if (window.confirm('确定删除吗？此操作不可撤销。')) {
      store.deleteSub(sub.id);
      showToast('已删除');
      renderCurrentPage();
    }
  }
}

/* ============ Forms ============ */
function optionsHtml(arr, selected, labelKey = 'label', valueKey = 'value') {
  return arr
    .map(
      (it, i) =>
        `<option value="${it[valueKey]}" ${i === selected ? 'selected' : ''}>${
          it[labelKey]
        }</option>`
    )
    .join('');
}

function openItemForm(item = null) {
  const isEdit = !!item;
  const data = item || {
    id: null,
    name: '',
    category: '其他',
    quantity: 1,
    dueDate: '',
    location: '',
    note: '',
  };
  store.state.editingItem = data;

  const catIdx = Math.max(
    0,
    ITEM_CATEGORIES.findIndex((c) => c.value === data.category)
  );

  const body = `
    <div class="form-row">
      <label class="form-label">物品名称 *</label>
      <input class="form-input" id="item-name" value="${escapeHtml(data.name)}" placeholder="如：维生素 C、护照、充电器">
    </div>
    <div class="form-row">
      <label class="form-label">分类</label>
      <select class="form-select" id="item-category">
        ${ITEM_CATEGORIES.map((c, i) => `<option value="${c.value}" ${i === catIdx ? 'selected' : ''}>${c.value}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <label class="form-label">数量</label>
      <input class="form-input" id="item-quantity" type="number" value="${data.quantity}" placeholder="1">
    </div>
    <div class="form-row">
      <label class="form-label">到期日期</label>
      <input class="form-input" id="item-dueDate" type="date" value="${data.dueDate || ''}">
    </div>
    <div class="form-row">
      <label class="form-label">存放位置</label>
      <input class="form-input" id="item-location" value="${escapeHtml(data.location)}" placeholder="如：冰箱冷藏室、主卧衣柜">
    </div>
    <div class="form-row">
      <label class="form-label">备注</label>
      <textarea class="form-textarea" id="item-note" placeholder="可选">${escapeHtml(data.note)}</textarea>
    </div>
  `;

  const footer = `
    <div class="form-actions">
      <div class="btn btn-ghost" id="item-cancel">取消</div>
      <div class="btn btn-primary" id="item-save">保存</div>
    </div>
  `;

  openSheet(isEdit ? '编辑物品' : '添加物品', body, footer);
  store.state.itemSheetVisible = true;

  document.getElementById('item-cancel').addEventListener('click', closeSheet);
  document.getElementById('item-save').addEventListener('click', saveItem);
}

function saveItem() {
  const name = document.getElementById('item-name').value.trim();
  if (!name) {
    showToast('请填写物品名称');
    return;
  }
  const data = {
    ...store.state.editingItem,
    name,
    category: document.getElementById('item-category').value,
    quantity: Number(document.getElementById('item-quantity').value) || 1,
    dueDate: document.getElementById('item-dueDate').value,
    location: document.getElementById('item-location').value.trim(),
    note: document.getElementById('item-note').value.trim(),
  };
  if (data.id) store.updateItem(data);
  else store.addItem(data);
  showToast(data.id ? '已更新' : '已添加');
  closeSheet();
  renderCurrentPage();
}

function openSubForm(sub = null) {
  const isEdit = !!sub;
  const data = sub || {
    id: null,
    name: '',
    amount: 0,
    cycle: '月',
    currency: '¥',
    renewDate: todayStr(),
    alertDays: 3,
    paymentMethod: '支付宝',
    status: '活跃',
    note: '',
  };
  store.state.editingSub = data;

  const cycleIdx = Math.max(0, CYCLES.findIndex((c) => c.value === data.cycle));
  const currencyIdx = Math.max(0, CURRENCIES.findIndex((c) => c.value === data.currency));
  const alertIdx = Math.max(0, ALERT_DAYS.findIndex((a) => a.value === data.alertDays));
  const payIdx = Math.max(0, SUB_CATEGORIES.indexOf(data.paymentMethod));
  const statusIdx = Math.max(0, SUB_STATUS.findIndex((s) => s.value === data.status));

  const body = `
    <div class="form-row">
      <label class="form-label">服务名称 *</label>
      <input class="form-input" id="sub-name" value="${escapeHtml(data.name)}" placeholder="如：ChatGPT Plus、Netflix">
    </div>
    <div class="form-row form-grid-3">
      <div>
        <label class="form-label">金额</label>
        <input class="form-input" id="sub-amount" type="number" value="${data.amount}" placeholder="0">
      </div>
      <div>
        <label class="form-label">周期</label>
        <select class="form-select" id="sub-cycle">
          ${CYCLES.map((c, i) => `<option value="${c.value}" ${i === cycleIdx ? 'selected' : ''}>${c.label}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="form-label">币种</label>
        <select class="form-select" id="sub-currency">
          ${CURRENCIES.map((c, i) => `<option value="${c.value}" ${i === currencyIdx ? 'selected' : ''}>${c.value}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <label class="form-label">下次续费日 *</label>
      <input class="form-input" id="sub-renewDate" type="date" value="${data.renewDate}">
    </div>
    <div class="form-row form-grid-2">
      <div>
        <label class="form-label">提前提醒</label>
        <select class="form-select" id="sub-alertDays">
          ${ALERT_DAYS.map((a, i) => `<option value="${a.value}" ${i === alertIdx ? 'selected' : ''}>${a.label}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="form-label">付款方式</label>
        <select class="form-select" id="sub-paymentMethod">
          ${SUB_CATEGORIES.map((p, i) => `<option value="${p}" ${i === payIdx ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <label class="form-label">状态</label>
      <select class="form-select" id="sub-status">
        ${SUB_STATUS.map((s, i) => `<option value="${s.value}" ${i === statusIdx ? 'selected' : ''}>${s.value}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <label class="form-label">备注</label>
      <textarea class="form-textarea" id="sub-note" placeholder="可选">${escapeHtml(data.note)}</textarea>
    </div>
  `;

  const footer = `
    <div class="form-actions">
      <div class="btn btn-ghost" id="sub-cancel">取消</div>
      <div class="btn btn-primary" id="sub-save">保存</div>
    </div>
  `;

  openSheet(isEdit ? '编辑订阅' : '添加订阅', body, footer);
  store.state.subSheetVisible = true;

  document.getElementById('sub-cancel').addEventListener('click', closeSheet);
  document.getElementById('sub-save').addEventListener('click', saveSub);
}

function saveSub() {
  const name = document.getElementById('sub-name').value.trim();
  if (!name) {
    showToast('请填写服务名称');
    return;
  }
  const renewDate = document.getElementById('sub-renewDate').value;
  if (!renewDate) {
    showToast('请选择续费日');
    return;
  }
  const data = {
    ...store.state.editingSub,
    name,
    amount: Number(document.getElementById('sub-amount').value) || 0,
    cycle: document.getElementById('sub-cycle').value,
    currency: document.getElementById('sub-currency').value,
    renewDate,
    alertDays: Number(document.getElementById('sub-alertDays').value),
    paymentMethod: document.getElementById('sub-paymentMethod').value,
    status: document.getElementById('sub-status').value,
    note: document.getElementById('sub-note').value.trim(),
  };
  if (data.id) store.updateSub(data);
  else store.addSub(data);
  showToast(data.id ? '已更新' : '已添加');
  closeSheet();
  renderCurrentPage();
}

function openTypeSheet() {
  const body = `
    <div class="type-grid">
      <div class="type-card" data-type="item">
        <div class="type-icon">📦</div>
        <div class="type-name">物品</div>
        <div class="type-desc">到期 / 存放位置</div>
      </div>
      <div class="type-card" data-type="sub">
        <div class="type-icon">💎</div>
        <div class="type-name">订阅</div>
        <div class="type-desc">续费 / 账单追踪</div>
      </div>
    </div>
  `;
  openSheet('添加什么？', body, '');
  store.state.typeSheetVisible = true;

  document.querySelectorAll('.type-card').forEach((card) => {
    card.addEventListener('click', () => {
      const type = card.dataset.type;
      closeSheet();
      setTimeout(() => {
        if (type === 'item') openItemForm();
        else openSubForm();
      }, 250);
    });
  });
}

/* ============ Page renders ============ */
function renderRemind() {
  const summary = store.remindSummary;
  const groups = store.remindGroups;
  const hasGroups = Object.keys(groups).length > 0;
  const kw = store.state.keyword;

  let listHtml = '';
  if (hasGroups) {
    listHtml = `<div class="groups">`;
    Object.entries(groups).forEach(([title, list]) => {
      listHtml += `<div class="time-group">
        <div class="time-group-header">${escapeHtml(title)} · ${list.length}</div>
        <div class="list">`;
      list.forEach((vo) => {
        if (vo.type === 'item') listHtml += renderItemCard(vo);
        else listHtml += renderSubCard(vo);
      });
      listHtml += `</div></div>`;
    });
    listHtml += `</div>`;
  } else {
    listHtml = renderEmpty(kw ? '🔍' : '🎉', kw ? '没找到提醒' : '未来 30 天都很安心', '需要时点击右下角 + 添加');
  }

  els.contents.remind.innerHTML = `
    <div class="summary-card green">
      <div class="summary-title">未来 7 天 · 需要你关注</div>
      <div class="summary-value">${summary.in7Days || 0}</div>
      <div class="summary-sub">项即将到期或续费</div>
      <div class="summary-stats">
        <div class="summary-stat"><span class="stat-num">${summary.overdue || 0}</span>已过期</div>
        <div class="summary-stat"><span class="stat-num">${summary.today || 0}</span>今天</div>
      </div>
    </div>
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input type="text" id="remind-search" value="${escapeHtml(kw)}" placeholder="搜索提醒...">
    </div>
    ${listHtml}
  `;

  bindSearch('remind-search');
  bindCardClicks('#remind-content', 'remind');
}

function renderItems() {
  const items = store.filteredItems;
  const kw = store.state.keyword;
  const listHtml = items.length
    ? `<div class="list">${items.map(renderItemCard).join('')}</div>`
    : renderEmpty(kw ? '🔍' : '📦', kw ? '没找到物品' : '物品柜空空如也', '点击右下角 + 添加第一件物品');

  els.contents.items.innerHTML = `
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input type="text" id="items-search" value="${escapeHtml(kw)}" placeholder="搜索物品...">
    </div>
    ${listHtml}
  `;

  bindSearch('items-search');
  bindCardClicks('#items-content', 'items');
}

function renderSubs() {
  const subs = store.filteredSubs;
  const kw = store.state.keyword;
  const listHtml = subs.length
    ? `<div class="list">${subs.map(renderSubCard).join('')}</div>`
    : renderEmpty(kw ? '🔍' : '💎', kw ? '没找到订阅' : '还没有任何订阅', '点击右下角 + 添加订阅');

  els.contents.subs.innerHTML = `
    <div class="summary-card orange">
      <div class="summary-title">每月订阅支出</div>
      <div class="summary-value"><span class="prefix">¥</span>${store.monthly}</div>
      <div class="summary-sub">共 ${store.activeCount} 个活跃订阅 · 年化 ¥${store.yearly}</div>
    </div>
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input type="text" id="subs-search" value="${escapeHtml(kw)}" placeholder="搜索订阅...">
    </div>
    ${listHtml}
  `;

  bindSearch('subs-search');
  bindCardClicks('#subs-content', 'subs');
}

function renderMe() {
  const ov = store.overview;
  const nickname = store.state.userInfo.nickname || '生活管家';
  const avatarChar = nickname.slice(0, 1);

  els.contents.me.innerHTML = `
    <div class="profile-card">
      <div class="avatar">${escapeHtml(avatarChar)}</div>
      <div>
        <div class="profile-name">${escapeHtml(nickname)}</div>
        <div class="profile-tip">让每一件物品都被记住</div>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">📦 物品总数</div>
        <div class="stat-value primary">${ov.itemCount}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">🔔 订阅总数</div>
        <div class="stat-value accent">${ov.subCount}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">💰 月均支出</div>
        <div class="stat-value accent">¥${ov.monthlyTotal}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">⏰ 30天内到期</div>
        <div class="stat-value primary">${ov.soonCount}</div>
      </div>
    </div>
    <div class="menu-list">
      <div class="menu-item" id="go-about">
        <div class="menu-icon">ℹ️</div>
        <div class="menu-text">关于小管家</div>
        <div class="menu-arrow">›</div>
      </div>
      <div class="menu-item" id="do-logout">
        <div class="menu-icon logout">🚪</div>
        <div class="menu-text logout">退出登录</div>
        <div class="menu-arrow">›</div>
      </div>
    </div>
    <div class="footer">零物小管家 · v0.1</div>
  `;

  document.getElementById('go-about').addEventListener('click', () => showPage('about'));
  document.getElementById('do-logout').addEventListener('click', () => {
    if (window.confirm('确定退出登录吗？')) {
      showPage('login');
    }
  });
}

function renderAbout() {
  els.contents.about.innerHTML = `
    <div class="content">
      <div class="hero">你好，我是<span class="brand">零物小管家</span></div>
      <div class="hero-sub">你的生活小帮手，帮你记住每一件该记住的事</div>

      <div class="block">
        <div class="block-title">我能为你做什么</div>
        <div class="block-line">📦 管理物品：记录食品、药品、日用品等的保质期与存放位置，到期前主动提醒，告别翻箱倒柜和过期浪费。</div>
        <div class="block-line">💎 管理订阅：汇总视频、音乐、云服务等会员订阅，追踪每月支出，续费日前提前通知，让每一笔花费都心中有数。</div>
        <div class="block-line">🔔 提醒中心：到期、续费、待处理事项集中呈现，重要日程不再遗漏，生活自然井井有条。</div>
      </div>

      <div class="block">
        <div class="block-title">这些时刻，我会派上用场</div>
        <div class="bullet">· 冰箱里的食材、药箱中的药品快要过期了</div>
        <div class="bullet">· 各种 App 会员、视频网站的续费日记不清</div>
        <div class="bullet">· 想找某件东西，却想不起它放在哪儿</div>
        <div class="bullet">· 想搞清楚每个月到底为订阅服务花了多少钱</div>
      </div>

      <div class="block">
        <div class="block-title">使用小贴士</div>
        <div class="bullet">· 点击右下角 <span class="strong">+</span> 快速添加物品或订阅</div>
        <div class="bullet">· 在「物品柜」和「订阅中心」随时查看、编辑或删除记录</div>
        <div class="bullet">· 使用同一账号登录，数据会自动同步到不同设备</div>
      </div>

      <div class="footer">零物小管家 · v0.1</div>
    </div>
  `;
}

function renderCurrentPage() {
  const page = store.state.currentPage;
  if (page === 'remind') renderRemind();
  else if (page === 'items') renderItems();
  else if (page === 'subs') renderSubs();
  else if (page === 'me') renderMe();
  else if (page === 'about') renderAbout();
}

function bindSearch(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      store.setKeyword(e.target.value);
      renderCurrentPage();
    }, 300);
  });
}

/* ============ Event bindings ============ */
els.loginBtn.addEventListener('click', () => {
  els.loginBtn.disabled = true;
  els.loginBtn.textContent = '登录中...';
  setTimeout(() => {
    store.initData();
    showToast('登录成功');
    showPage('remind');
    els.loginBtn.disabled = false;
    els.loginBtn.textContent = '微信一键登录';
  }, 600);
});

els.tabbar.querySelectorAll('.tab-item').forEach((tab) => {
  tab.addEventListener('click', () => {
    const page = tab.dataset.page;
    if (page !== store.state.currentPage) {
      store.setKeyword('');
      showPage(page);
    }
  });
});

document.querySelectorAll('.fab').forEach((fab) => {
  fab.addEventListener('click', () => {
    const page = fab.dataset.page;
    if (page === 'remind') {
      openTypeSheet();
    } else if (page === 'items') {
      openItemForm();
    } else if (page === 'subs') {
      openSubForm();
    }
  });
});

els.aboutBack.addEventListener('click', () => {
  showPage(store.state.prevPage || 'me');
});

els.sheet.overlay.addEventListener('click', closeSheet);
els.sheet.close.addEventListener('click', closeSheet);

els.action.overlay.addEventListener('click', closeActionSheet);
els.action.cancel.addEventListener('click', closeActionSheet);
els.action.items.addEventListener('click', (e) => {
  const item = e.target.closest('.action-item');
  if (!item || !actionCallback) return;
  const idx = Number(item.dataset.idx);
  const selected = store.state.actionItems[idx];
  if (selected) {
    closeActionSheet();
    actionCallback(selected.key);
  }
});

/* ============ init ============ */
showPage('login');
