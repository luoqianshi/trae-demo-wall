/**
 * FridgeMate 库存管理模块
 * 首页库存总览 UI 与交互
 */

const Inventory = (() => {
  // ========== 渲染 ==========
  function render() {
    FridgeDB.refreshStatus();
    const foods = FridgeDB.getFoods();
    const stats = FridgeDB.getStats();

    const container = document.getElementById('inventory-content');
    if (!container) return;

    let html = '';

    // 警告条
    if (stats.urgent > 0) {
      const urgentFoods = foods.filter(f => f.status === '临期' || f.status === '已过期');
      const names = urgentFoods.map(f => f.name).join('、');
      html += `<div class="inv-alert">⚠️ ${names}${stats.urgent > 1 ? '等' : ''}需关注</div>`;
    }

    // 按位置分组
    const config = FridgeDB.getFridgeConfig();
    const grouped = {};
    const zoneIcons = { '冷藏': '❄️', '冷冻': '🧊', '变温': '🌡️' };

    for (const zone of config.zones) {
      for (const loc of zone.locations) {
        const items = foods.filter(f => f.location === loc);
        if (items.length > 0) {
          if (!grouped[zone.zone]) grouped[zone.zone] = { icon: zoneIcons[zone.zone] || '📦', items: {} };
          grouped[zone.zone].items[loc] = items;
        }
      }
    }

    for (const [zoneName, zoneData] of Object.entries(grouped)) {
      html += `<div class="inv-zone"><div class="inv-zone-header">${zoneData.icon} ${zoneName}</div>`;
      for (const [loc, items] of Object.entries(zoneData.items)) {
        html += `<div class="inv-group"><div class="inv-group-header">📦 ${loc}</div>`;
        for (const item of items) {
          const badgeClass = getBadgeClass(item.status);
          const badgeText = getBadgeText(item.status);
          const daysText = item.expiry_date ? getDaysText(item) : '';

          html += `
          <div class="inv-item" data-id="${item.id}">
            <div class="iv-emoji">${item.emoji}</div>
            <div class="iv-info">
              <div class="iv-name">${item.name}</div>
              <div class="iv-meta">${item.quantity}${item.unit}${daysText ? ' · ' + daysText : ''}</div>
            </div>
            <span class="iv-badge ${badgeClass}">${badgeText}</span>
            <div class="iv-actions">
              <button class="iv-btn iv-btn-eat" data-action="consume" data-id="${item.id}" title="吃掉了">🍽️</button>
              <button class="iv-btn iv-btn-edit" data-action="edit" data-id="${item.id}" title="编辑">✏️</button>
              <button class="iv-btn iv-btn-del" data-action="delete" data-id="${item.id}" title="删除">🗑️</button>
            </div>
          </div>`;
        }
        html += `</div>`;
      }
      html += `</div>`;
    }

    if (foods.length === 0) {
      html = `<div class="inv-empty">
        <div class="inv-empty-icon">🧊</div>
        <div>冰箱空空如也～</div>
        <div class="inv-empty-hint">点击右下角 + 按钮添加食材</div>
      </div>`;
    }

    container.innerHTML = html;

    // 统计
    const totalEl = document.getElementById('stat-total');
    const urgentEl = document.getElementById('stat-urgent');
    if (totalEl) totalEl.textContent = stats.total;
    if (urgentEl) urgentEl.textContent = stats.urgent;
  }

  function getBadgeClass(status) {
    const map = { '新鲜': 'fresh', '临期': 'soon', '已过期': 'urgent', '已吃完': 'gone' };
    return map[status] || 'fresh';
  }

  function getBadgeText(status) {
    const map = { '新鲜': '新鲜', '临期': '临期', '已过期': '过期', '已吃完': '已吃完' };
    return map[status] || status;
  }

  function getDaysText(item) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(item.expiry_date);
    expiry.setHours(0, 0, 0, 0);
    const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `过期${Math.abs(diff)}天`;
    if (diff === 0) return '今天过期';
    if (diff === 1) return '明天过期';
    return `${diff}天后过期`;
  }

  // ========== 事件 ==========
  function handleAction(action, id) {
    switch (action) {
      case 'consume':
        FridgeDB.consumeFood(id);
        break;
      case 'delete':
        if (confirm('确定删除这个食材吗？')) {
          FridgeDB.deleteFood(id);
        }
        break;
      case 'edit':
        showEditForm(id);
        return;
    }
    render();
    if (typeof Chat !== 'undefined') Chat.refreshContext();
  }

  // ========== 添加表单 ==========
  function showAddForm() {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('food-form');

    title.textContent = '添加食材';
    form.innerHTML = buildFormHTML({});
    form.dataset.mode = 'add';
    form.dataset.id = '';
    modal.classList.add('show');

    bindFormEvents();
  }

  function showEditForm(id) {
    const foods = FridgeDB.getFoods();
    const food = foods.find(f => f.id === id);
    if (!food) return;

    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('food-form');

    title.textContent = '编辑食材';
    form.innerHTML = buildFormHTML(food);
    form.dataset.mode = 'edit';
    form.dataset.id = id;
    modal.classList.add('show');

    bindFormEvents();
  }

  function buildFormHTML(food) {
    const val = (key, def = '') => food[key] || def;

    const catOpts = FridgeDB.CATEGORIES.map(c =>
      `<option value="${c}" ${val('category') === c ? 'selected' : ''}>${c}</option>`
    ).join('');

    const locOpts = FridgeDB.locations.map(l =>
      `<option value="${l}" ${val('location') === l ? 'selected' : ''}>${l}</option>`
    ).join('');

    const statusOpts = ['新鲜', '临期', '已过期', '已吃完'].map(s =>
      `<option value="${s}" ${val('status') === s ? 'selected' : ''}>${s}</option>`
    ).join('');

    return `
      <div class="form-row">
        <label>名称 *</label>
        <input type="text" name="name" value="${val('name')}" required placeholder="如：五花肉">
      </div>
      <div class="form-row">
        <label>图标</label>
        <input type="text" name="emoji" value="${val('emoji', '📦')}" placeholder="📦" maxlength="2">
      </div>
      <div class="form-row form-row-2col">
        <div>
          <label>数量</label>
          <input type="number" name="quantity" value="${val('quantity', 1)}" min="0" step="0.5">
        </div>
        <div>
          <label>单位</label>
          <input type="text" name="unit" value="${val('unit', '个')}" placeholder="个/盒/把">
        </div>
      </div>
      <div class="form-row">
        <label>分类</label>
        <select name="category">${catOpts}</select>
      </div>
      <div class="form-row">
        <label>存放位置</label>
        <select name="location">${locOpts}</select>
      </div>
      <div class="form-row">
        <label>过期日期</label>
        <input type="date" name="expiry_date" value="${val('expiry_date')}">
      </div>
      <div class="form-row">
        <label>状态</label>
        <select name="status">${statusOpts}</select>
      </div>
      <div class="form-row">
        <label>备注</label>
        <input type="text" name="note" value="${val('note')}" placeholder="可选">
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-cancel" onclick="Inventory.closeModal()">取消</button>
        <button type="submit" class="btn btn-primary">${food.id ? '保存' : '添加'}</button>
      </div>`;
  }

  function bindFormEvents() {
    const form = document.getElementById('food-form');
    form.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());
      data.quantity = parseFloat(data.quantity) || 1;

      if (!data.name.trim()) return;

      if (form.dataset.mode === 'edit') {
        FridgeDB.updateFood(parseInt(form.dataset.id), data);
      } else {
        FridgeDB.addFood(data);
      }

      closeModal();
      render();
      if (typeof Chat !== 'undefined') Chat.refreshContext();
    };
  }

  function closeModal() {
    document.getElementById('modal').classList.remove('show');
  }

  // ========== 委托事件 ==========
  function initEvents() {
    document.getElementById('inventory-content').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      handleAction(btn.dataset.action, parseInt(btn.dataset.id));
    });

    document.getElementById('btn-add-food').addEventListener('click', showAddForm);
    document.getElementById('modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
  }

  return { render, initEvents, showAddForm, closeModal };
})();