let shoppingItems = [];
let historyRecords = [];
let budget = 0;
let currentTotal = 0;
let recognition = null;
let editingItemId = null;
let pendingVoiceModify = null; // { itemId, name, quantity }
let peopleList = ['我', '室友A', '室友B']; // 参与AA分摊的人员
let selectedBuyer = '我'; // 当前选中的购买人

const mockProducts = [
    { name: '西红柿', price: 3.5 },
    { name: '鸡蛋', price: 5.8 },
    { name: '牛奶', price: 12.9 },
    { name: '黄瓜', price: 2.3 },
    { name: '土豆', price: 1.8 },
    { name: '胡萝卜', price: 2.5 },
    { name: '青菜', price: 4.2 },
    { name: '五花肉', price: 28.5 },
    { name: '苹果', price: 6.8 },
    { name: '香蕉', price: 4.5 },
    { name: '大米', price: 25.8 },
    { name: '食用油', price: 59.9 },
    { name: '酱油', price: 15.8 },
    { name: '盐', price: 3.5 },
    { name: '面条', price: 8.9 }
];

// 模拟各超市价格库（同一商品在不同超市的不同价格）
const storePriceDB = {
    '西红柿': [{ store: '永辉超市', price: 3.5 }, { store: '大润发', price: 3.8 }, { store: '华联超市', price: 3.2 }],
    '鸡蛋':   [{ store: '永辉超市', price: 5.8 }, { store: '大润发', price: 6.2 }, { store: '华联超市', price: 5.5 }],
    '牛奶':   [{ store: '永辉超市', price: 12.9 }, { store: '大润发', price: 13.5 }, { store: '盒马鲜生', price: 12.5 }],
    '黄瓜':   [{ store: '永辉超市', price: 2.3 }, { store: '大润发', price: 2.5 }, { store: '华联超市', price: 2.1 }],
    '土豆':   [{ store: '永辉超市', price: 1.8 }, { store: '大润发', price: 1.9 }, { store: '华联超市', price: 1.6 }],
    '胡萝卜': [{ store: '永辉超市', price: 2.5 }, { store: '大润发', price: 2.8 }, { store: '华联超市', price: 2.3 }],
    '青菜':   [{ store: '永辉超市', price: 4.2 }, { store: '大润发', price: 4.5 }, { store: '盒马鲜生', price: 3.9 }],
    '五花肉': [{ store: '永辉超市', price: 28.5 }, { store: '大润发', price: 29.8 }, { store: '盒马鲜生', price: 27.9 }],
    '苹果':   [{ store: '永辉超市', price: 6.8 }, { store: '大润发', price: 7.2 }, { store: '华联超市', price: 6.5 }],
    '香蕉':   [{ store: '永辉超市', price: 4.5 }, { store: '大润发', price: 4.8 }, { store: '华联超市', price: 4.2 }],
    '大米':   [{ store: '永辉超市', price: 25.8 }, { store: '大润发', price: 26.5 }, { store: '华联超市', price: 24.9 }],
    '食用油': [{ store: '永辉超市', price: 59.9 }, { store: '大润发', price: 62.0 }, { store: '盒马鲜生', price: 58.5 }],
    '酱油':   [{ store: '永辉超市', price: 15.8 }, { store: '大润发', price: 16.5 }, { store: '华联超市', price: 14.9 }],
    '盐':     [{ store: '永辉超市', price: 3.5 }, { store: '大润发', price: 3.5 }, { store: '华联超市', price: 3.0 }],
    '面条':   [{ store: '永辉超市', price: 8.9 }, { store: '大润发', price: 9.5 }, { store: '华联超市', price: 8.5 }]
};
const storeNames = ['永辉超市', '大润发', '华联超市', '盒马鲜生'];
const chartColors = ['#5bb6f0', '#07c160', '#ff976a', '#ee0a24', '#6465ff', '#ff9f00'];

function init() {
    loadData();
    updateTotal();
    renderItemsList();
    renderHistory();
    updateBudgetDisplay();
    initNavTabs();
    populateMonthFilter();
    renderTodayStats();
    renderPeopleList();
    renderBuyerSelect();
    renderAAResult();
}

function loadData() {
    const savedItems = localStorage.getItem('shoppingItems');
    const savedHistory = localStorage.getItem('historyRecords');
    const savedBudget = localStorage.getItem('budget');
    const savedPeople = localStorage.getItem('peopleList');
    if (savedItems) shoppingItems = JSON.parse(savedItems);
    if (savedHistory) historyRecords = JSON.parse(savedHistory);
    if (savedBudget) budget = parseFloat(savedBudget);
    if (savedPeople) peopleList = JSON.parse(savedPeople);
}

function saveData() {
    localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
    localStorage.setItem('historyRecords', JSON.stringify(historyRecords));
    localStorage.setItem('budget', budget.toString());
    localStorage.setItem('peopleList', JSON.stringify(peopleList));
}

// ===== 人员管理 =====
function renderPeopleList() {
    const container = document.getElementById('aa-people-list');
    if (!container) return;
    container.innerHTML = peopleList.map(person => `
        <span class="person-tag ${selectedBuyer === person ? 'selected' : ''}" onclick="selectPerson('${person}')">
            ${person}
            <span class="remove-person" onclick="event.stopPropagation(); removePerson('${person}')">×</span>
        </span>
    `).join('');
}

function addPerson() {
    const input = document.getElementById('new-person-name');
    const name = input.value.trim();
    if (!name) { showToast('请输入姓名'); return; }
    if (peopleList.includes(name)) { showToast('该人员已存在'); return; }
    peopleList.push(name);
    saveData();
    renderPeopleList();
    renderBuyerSelect();
    input.value = '';
    showToast(`已添加 ${name}`);
}

function removePerson(name) {
    if (peopleList.length <= 1) { showToast('至少保留一个参与人'); return; }
    peopleList = peopleList.filter(p => p !== name);
    if (selectedBuyer === name) selectedBuyer = peopleList[0];
    saveData();
    renderPeopleList();
    renderBuyerSelect();
    renderAAResult();
    showToast(`已移除 ${name}`);
}

function selectPerson(name) {
    selectedBuyer = name;
    renderPeopleList();
}

// 购买人选择器（手动输入和编辑弹窗共用）
function renderBuyerSelect() {
    ['buyer-select', 'edit-buyer-select'].forEach(id => {
        const container = document.getElementById(id);
        if (!container) return;
        container.innerHTML = peopleList.map(person => `
            <span class="buyer-tag ${selectedBuyer === person ? 'selected' : ''}" onclick="selectBuyer('${person}', '${id}')">${person}</span>
        `).join('');
    });
}

function selectBuyer(name, containerId) {
    selectedBuyer = name;
    // 只更新指定容器
    const container = document.getElementById(containerId);
    if (container) {
        container.querySelectorAll('.buyer-tag').forEach(tag => {
            tag.classList.toggle('selected', tag.textContent === name);
        });
    }
}

// ===== AA分摊结果 =====
function renderAAResult() {
    const container = document.getElementById('aa-result-list');
    const totalLabel = document.getElementById('aa-total-label');
    if (!container) return;

    // 汇总当前购物车和历史账单中每个人花费
    const personTotals = {};
    peopleList.forEach(p => personTotals[p] = { amount: 0, count: 0 });

    // 当前购物车
    shoppingItems.forEach(item => {
        const buyer = item.buyer || '我';
        if (personTotals[buyer]) {
            personTotals[buyer].amount += parseFloat(item.total);
            personTotals[buyer].count++;
        }
    });

    // 历史账单（本月）
    const now = new Date();
    historyRecords.forEach(record => {
        const d = new Date(record.date);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            record.items.forEach(item => {
                const buyer = item.buyer || '我';
                if (personTotals[buyer]) {
                    personTotals[buyer].amount += parseFloat(item.total);
                    personTotals[buyer].count++;
                }
            });
        }
    });

    const totalAmount = Object.values(personTotals).reduce((s, p) => s + p.amount, 0);
    if (totalLabel) totalLabel.textContent = `总计 ¥${totalAmount.toFixed(2)}`;

    if (peopleList.length === 0 || totalAmount === 0) {
        container.innerHTML = `<div class="chart-empty">添加人员后自动计算分摊</div>`;
        return;
    }

    container.innerHTML = peopleList.map(person => {
        const data = personTotals[person];
        return `
        <div class="aa-person-item" onclick="showPersonDetail('${person}')">
            <div class="aa-person-header">
                <span class="aa-person-name">${person}</span>
                <span class="aa-person-amount">¥${data.amount.toFixed(2)}</span>
            </div>
            <div class="aa-person-count">已买 ${data.count} 件商品</div>
        </div>`;
    }).join('');
}

// 点击某个人查看详情
function showPersonDetail(person) {
    const now = new Date();
    const items = [];

    shoppingItems.forEach(item => {
        if ((item.buyer || '我') === person) items.push({ ...item, date: '今天' });
    });

    historyRecords.forEach(record => {
        const d = new Date(record.date);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            record.items.forEach(item => {
                if ((item.buyer || '我') === person) {
                    items.push({ ...item, date: record.date });
                }
            });
        }
    });

    if (items.length === 0) {
        showToast(`${person} 暂无消费记录`);
        return;
    }

    const total = items.reduce((s, i) => s + parseFloat(i.total), 0);
    let msg = `${person} 的消费明细：\n`;
    items.slice(0, 8).forEach(item => {
        msg += `${item.name} ¥${item.total}\n`;
    });
    if (items.length > 8) msg += `...共${items.length}件商品\n`;
    msg += `\n合计：¥${total.toFixed(2)}`;
    showToast(msg);
}

function initNavTabs() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const btn = document.querySelector(`[data-tab="${tabName}"]`);
    const content = document.getElementById(`${tabName}-tab`);
    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');
    if (tabName === 'history') { updateBudgetDisplay(); renderHistory(); renderAAResult(); }
    if (tabName === 'stats') { renderStatsPage(); }
}

// ===== 商品列表 =====
function addItem() {
    const name = document.getElementById('item-name').value.trim();
    const price = parseFloat(document.getElementById('item-price').value);
    const quantity = parseFloat(document.getElementById('item-quantity').value) || 0;
    if (!name) { showToast('请输入商品名称'); return; }
    if (!price || price <= 0) { showToast('请输入有效的单价'); return; }
    shoppingItems.push({
        id: Date.now(), name, price, quantity,
        store: storeNames[Math.floor(Math.random() * storeNames.length)],
        buyer: selectedBuyer,
        date: new Date().toISOString(),
        total: (price * quantity).toFixed(2)
    });
    saveData(); updateTotal(); renderItemsList();
    document.getElementById('item-name').value = '';
    document.getElementById('item-price').value = '';
    document.getElementById('item-quantity').value = '1';
    showToast('添加成功');
}

function removeItem(id) {
    shoppingItems = shoppingItems.filter(item => item.id !== id);
    saveData(); updateTotal(); renderItemsList();
}

function clearAllItems() {
    if (shoppingItems.length === 0) { showToast('列表为空'); return; }
    shoppingItems = []; saveData(); updateTotal(); renderItemsList();
    showToast('已清空');
}

function updateTotal() {
    currentTotal = shoppingItems.reduce((sum, item) => sum + parseFloat(item.total), 0);
    document.getElementById('current-total').textContent = currentTotal.toFixed(2);
    document.getElementById('month-budget').textContent = budget.toFixed(0);
}

function renderItemsList() {
    const container = document.getElementById('items-list');
    if (shoppingItems.length === 0) {
        container.innerHTML = `<div class="empty-state"><span class="empty-icon">📷</span><p>拍照或手动添加商品</p></div>`;
        return;
    }
    container.innerHTML = shoppingItems.map(item => {
        const pending = item.quantity === 0;
        const qtyText = item.quantity === 0 ? '待输入' : item.quantity;
        const storeTag = item.store ? `<span class="item-store">${item.store}</span>` : '';
        const buyerTag = item.buyer ? `<span class="item-buyer">${item.buyer}</span>` : '';
        return `
        <div class="item-wrapper" data-id="${item.id}">
            <div class="item-delete-action">删除</div>
            <div class="item-card" data-id="${item.id}">
                <div class="item-info" onclick="editItem(${item.id})">
                    <div class="item-name">${item.name}${pending ? '<span class="pending-tag">待称重</span>' : ''}${buyerTag}</div>
                    <div class="item-detail">¥${item.price.toFixed(2)} × ${qtyText} ${storeTag}</div>
                </div>
                <div class="item-price" onclick="editItem(${item.id})">
                    <div class="item-total">¥${item.total}</div>
                </div>
                <button class="item-voice-btn" onclick="event.stopPropagation(); startItemVoice(${item.id})">🎤</button>
            </div>
        </div>`;
    }).join('');
    initSwipeDelete();
    renderTodayStats();
    renderAAResult();
}

// ===== 统计页面 =====
let currentPeriod = 'day'; // day | week | month

function switchPeriod(period) {
    currentPeriod = period;
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === period);
    });
    renderStatsPage();
}

// 获取指定周期内的所有商品（当前购物车 + 历史记录）
function getPeriodItems(period) {
    const now = new Date();
    let items = [];

    const isInPeriod = (dateStr) => {
        if (!dateStr) return true;
        const d = new Date(dateStr);
        if (period === 'day') return d.toDateString() === now.toDateString();
        if (period === 'week') {
            const diff = (now - d) / (1000 * 60 * 60 * 24);
            return diff <= 7 && diff >= 0;
        }
        if (period === 'month') {
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        return true;
    };

    // 当前购物车的商品
    shoppingItems.forEach(item => {
        if (isInPeriod(item.date)) items.push({ ...item });
    });

    // 历史记录中的商品
    historyRecords.forEach(record => {
        if (isInPeriod(record.date)) {
            record.items.forEach(it => {
                items.push({
                    ...it,
                    date: record.date,
                    store: it.store || '永辉超市'
                });
            });
        }
    });

    return items;
}

function renderStatsPage() {
    const items = getPeriodItems(currentPeriod);
    const chartContainer = document.getElementById('stats-chart');
    if (!chartContainer) return;

    // 统计卡片
    document.getElementById('stat-items').textContent = items.length;
    const totalSpent = items.reduce((sum, item) => sum + parseFloat(item.total), 0);
    document.getElementById('stat-total').textContent = `¥${totalSpent.toFixed(2)}`;
    const avgPrice = items.length > 0 ? (totalSpent / items.length).toFixed(2) : '0.00';
    document.getElementById('stat-avg').textContent = `¥${avgPrice}`;

    let savedAmount = 0;
    items.forEach(item => {
        const db = storePriceDB[item.name];
        if (db) {
            const maxPrice = Math.max(...db.map(d => d.price));
            const diff = maxPrice - item.price;
            if (diff > 0) savedAmount += diff * (item.quantity || 0);
        }
    });
    document.getElementById('stat-saved').textContent = `¥${savedAmount.toFixed(2)}`;

    // 花费排行柱状图（按金额从大到小）
    if (items.length === 0) {
        chartContainer.innerHTML = `<div class="chart-empty">暂无数据</div>`;
    } else {
        const sorted = [...items].sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
        const maxAmount = parseFloat(sorted[0].total);
        chartContainer.innerHTML = sorted.slice(0, 10).map((item, idx) => {
            const amount = parseFloat(item.total);
            const widthPct = maxAmount > 0 ? (amount / maxAmount * 100) : 0;
            const color = chartColors[idx % chartColors.length];
            return `
            <div class="chart-bar-item">
                <div class="chart-bar-header">
                    <span class="chart-bar-name">${item.name} <span class="chart-bar-store">${item.store || ''}</span></span>
                    <span class="chart-bar-amount">¥${amount.toFixed(2)}</span>
                </div>
                <div class="chart-bar-track">
                    <div class="chart-bar-fill" style="width:${widthPct}%; background:${color};"></div>
                </div>
            </div>`;
        }).join('');
    }

    // 价格对比
    renderPriceCompare(items);

    // 超市分布
    renderStoreStats(items);
}

// 旧函数名保留兼容（购物列表渲染时调用）
function renderTodayStats() {
    renderStatsPage();
}

// 价格对比：相同商品在不同超市哪个最便宜
function renderPriceCompare(items) {
    const container = document.getElementById('price-compare');
    const listContainer = document.getElementById('compare-list');
    if (!container || !listContainer) return;

    const compareItems = items.filter(item => storePriceDB[item.name]);
    if (compareItems.length === 0) {
        container.style.display = 'none';
        return;
    }

    // 去重：同名商品只显示一次（取第一个）
    const seen = {};
    const uniqueItems = [];
    compareItems.forEach(item => {
        if (!seen[item.name]) {
            seen[item.name] = true;
            uniqueItems.push(item);
        }
    });

    container.style.display = 'block';
    listContainer.innerHTML = uniqueItems.map(item => {
        const db = storePriceDB[item.name];
        const prices = [...db];
        prices.push({ store: item.store || '当前超市', price: item.price });
        prices.sort((a, b) => a.price - b.price);
        const lowest = prices[0];
        const maxPrice = prices[prices.length - 1].price;
        const savings = (maxPrice - item.price) * (item.quantity || 0);

        return `
        <div class="compare-item">
            <div class="compare-item-header">
                <span class="compare-item-name">${item.name}</span>
                ${savings > 0 ? `<span class="compare-item-save">比最贵省¥${savings.toFixed(2)}</span>` : ''}
            </div>
            <div class="compare-prices">
                ${prices.map(p => {
                    const isLowest = p.price === lowest.price;
                    const isMine = p.store === (item.store || '当前超市') && Math.abs(p.price - item.price) < 0.01;
                    return `<span class="compare-price-tag ${isLowest ? 'lowest' : ''}">${p.store} ¥${p.price.toFixed(2)}${isMine ? ' ✓' : ''}</span>`;
                }).join('')}
            </div>
        </div>`;
    }).join('');
}

// 超市消费分布
function renderStoreStats(items) {
    const container = document.getElementById('store-stats');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `<div class="chart-empty">暂无数据</div>`;
        return;
    }

    const storeMap = {};
    items.forEach(item => {
        const store = item.store || '其他';
        if (!storeMap[store]) storeMap[store] = 0;
        storeMap[store] += parseFloat(item.total);
    });

    const stores = Object.entries(storeMap).sort((a, b) => b[1] - a[1]);
    const maxAmount = stores[0][1];

    container.innerHTML = stores.map(([store, amount], idx) => {
        const widthPct = maxAmount > 0 ? (amount / maxAmount * 100) : 0;
        const color = chartColors[idx % chartColors.length];
        return `
        <div class="store-stat-item">
            <div class="store-stat-header">
                <span class="store-stat-name">${store}</span>
                <span class="store-stat-amount">¥${amount.toFixed(2)}</span>
            </div>
            <div class="store-stat-track">
                <div class="store-stat-fill" style="width:${widthPct}%; background:${color};"></div>
            </div>
        </div>`;
    }).join('');
}

function initSwipeDelete() {
    document.querySelectorAll('.item-card').forEach(card => {
        let startX = 0, currentX = 0, isSwiping = false;
        const wrapper = card.closest('.item-wrapper');
        const deleteWidth = 72;

        card.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('item-voice-btn')) return;
            startX = e.touches[0].clientX;
            isSwiping = true;
            card.classList.add('swiping');
        }, { passive: true });

        card.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;
            currentX = e.touches[0].clientX - startX;
            if (currentX < 0) {
                const translate = Math.max(currentX, -deleteWidth);
                card.style.transform = `translateX(${translate}px)`;
            }
        }, { passive: true });

        card.addEventListener('touchend', () => {
            if (!isSwiping) return;
            isSwiping = false;
            card.classList.remove('swiping');
            if (currentX < -deleteWidth / 2) {
                card.style.transform = `translateX(-${deleteWidth}px)`;
                const id = parseInt(card.dataset.id);
                setTimeout(() => {
                    removeItem(id);
                    showToast('已删除');
                }, 200);
            } else {
                card.style.transform = 'translateX(0)';
            }
            currentX = 0;
        });

        // 鼠标支持（桌面端测试）
        let mouseStartX = 0, mouseCurrentX = 0, mouseSwiping = false;
        card.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('item-voice-btn')) return;
            mouseStartX = e.clientX;
            mouseSwiping = true;
            card.classList.add('swiping');
        });
        card.addEventListener('mousemove', (e) => {
            if (!mouseSwiping) return;
            mouseCurrentX = e.clientX - mouseStartX;
            if (mouseCurrentX < 0) {
                const translate = Math.max(mouseCurrentX, -deleteWidth);
                card.style.transform = `translateX(${translate}px)`;
            }
        });
        card.addEventListener('mouseup', () => {
            if (!mouseSwiping) return;
            mouseSwiping = false;
            card.classList.remove('swiping');
            if (mouseCurrentX < -deleteWidth / 2) {
                card.style.transform = `translateX(-${deleteWidth}px)`;
                const id = parseInt(card.dataset.id);
                setTimeout(() => { removeItem(id); showToast('已删除'); }, 200);
            } else {
                card.style.transform = 'translateX(0)';
            }
            mouseCurrentX = 0;
        });
        card.addEventListener('mouseleave', () => {
            if (mouseSwiping) {
                mouseSwiping = false;
                card.classList.remove('swiping');
                card.style.transform = 'translateX(0)';
                mouseCurrentX = 0;
            }
        });
    });
}

// ===== 编辑商品 =====
function editItem(id) {
    const item = shoppingItems.find(i => i.id === id);
    if (!item) return;
    editingItemId = id;
    document.getElementById('edit-name').value = item.name;
    document.getElementById('edit-price').value = item.price;
    document.getElementById('edit-quantity').value = item.quantity;
    // 设置购买人
    selectedBuyer = item.buyer || '我';
    renderBuyerSelect();
    document.getElementById('edit-modal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
    editingItemId = null;
}

function saveEditItem() {
    const name = document.getElementById('edit-name').value.trim();
    const price = parseFloat(document.getElementById('edit-price').value);
    const quantity = parseFloat(document.getElementById('edit-quantity').value) || 0;
    if (!name) { showToast('请输入商品名称'); return; }
    if (!price || price <= 0) { showToast('请输入有效的单价'); return; }
    const item = shoppingItems.find(i => i.id === editingItemId);
    if (item) {
        item.name = name;
        item.price = price;
        item.quantity = quantity;
        item.buyer = selectedBuyer;
        item.total = (price * quantity).toFixed(2);
    }
    saveData(); updateTotal(); renderItemsList();
    renderAAResult();
    showToast('修改成功');
    closeEditModal();
}

// 编辑弹窗语音输入
let editVoiceRecognition = null;
function startEditVoice() {
    if (!checkSpeechSupport()) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    editVoiceRecognition = new SR();
    editVoiceRecognition.lang = 'zh-CN';
    editVoiceRecognition.interimResults = false;
    const btn = document.getElementById('edit-voice-btn');
    btn.classList.add('recording'); btn.textContent = '🔴';
    editVoiceRecognition.onresult = (e) => {
        const text = e.results[0][0].transcript.trim();
        const num = extractNumber(text);
        if (num !== null) {
            document.getElementById('edit-quantity').value = num;
            showToast(`识别到重量：${num}`);
            // 语音询问确认
            const itemName = document.getElementById('edit-name').value;
            speakText(`是否将${itemName}的重量修改为${num}？`);
        } else {
            showToast('未识别到数量');
        }
    };
    editVoiceRecognition.onerror = () => showToast('语音识别出错');
    editVoiceRecognition.onend = () => { btn.classList.remove('recording'); btn.textContent = '🎤'; };
    editVoiceRecognition.start();
}

// ===== 拍照识价 =====
function openCamera() {
    showCaptureStage();
    document.getElementById('camera-frame').classList.remove('captured');
    document.getElementById('camera-modal').classList.add('active');
}

function closeCamera() {
    document.getElementById('camera-modal').classList.remove('active');
    setTimeout(() => showCaptureStage(), 250);
}

function showCaptureStage() {
    document.getElementById('capture-stage').style.display = 'block';
    document.getElementById('recognizing-stage').style.display = 'none';
    document.getElementById('recognize-result-stage').style.display = 'none';
}

function showRecognizingStage() {
    document.getElementById('capture-stage').style.display = 'none';
    document.getElementById('recognizing-stage').style.display = 'block';
    document.getElementById('recognize-result-stage').style.display = 'none';
}

function showRecognizeResultStage() {
    document.getElementById('capture-stage').style.display = 'none';
    document.getElementById('recognizing-stage').style.display = 'none';
    document.getElementById('recognize-result-stage').style.display = 'block';
}

function capturePrice() {
    document.getElementById('camera-frame').classList.add('captured');
    showRecognizingStage();
    setTimeout(() => {
        const product = mockProducts[Math.floor(Math.random() * mockProducts.length)];
        const price = (product.price * (0.9 + Math.random() * 0.2)).toFixed(2);
        // 自动加入列表，重量初始为0
        const store = storeNames[Math.floor(Math.random() * storeNames.length)];
        shoppingItems.push({
            id: Date.now(),
            name: product.name,
            price: parseFloat(price),
            quantity: 0,
            store: store,
            buyer: selectedBuyer,
            date: new Date().toISOString(),
            total: '0.00'
        });
        saveData(); updateTotal(); renderItemsList();
        document.getElementById('recognize-success-text').textContent = `${product.name} ¥${price}/斤`;
        showRecognizeResultStage();
    }, 1500);
}

function continueCapture() {
    showCaptureStage();
    document.getElementById('camera-frame').classList.remove('captured');
}

// ===== 语音输入 =====
function checkSpeechSupport() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('当前浏览器不支持语音识别');
        return false;
    }
    return true;
}

function speakText(text, callback) {
    if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        utter.rate = 1.1;
        if (callback) utter.onend = callback;
        speechSynthesis.speak(utter);
    } else if (callback) {
        callback();
    }
}

function extractNumber(text) {
    const match = text.match(/[\d.]+/);
    if (match) {
        const num = parseFloat(match[0]);
        return num > 0 ? num : null;
    }
    return convertChineseNumber(text) || null;
}

function convertChineseNumber(text) {
    const map = { '一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10 };
    let result = 0;
    for (const char of text) {
        if (map[char] !== undefined) result = result === 0 ? map[char] : result * 10 + map[char];
    }
    return result > 0 ? result : null;
}

// 全局语音：说商品名+重量 → 匹配列表 → 语音确认
function startVoiceInput() {
    if (!checkSpeechSupport()) return;
    if (shoppingItems.length === 0) { showToast('请先拍照添加商品'); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = 'zh-CN';
    recognition.interimResults = true;
    document.getElementById('voice-modal').classList.add('active');
    document.getElementById('voice-confirm-section').style.display = 'none';
    document.getElementById('voice-stop-btn').style.display = 'block';
    document.getElementById('voice-status-text').textContent = '请说商品名和重量，如"土豆2斤"';
    document.getElementById('voice-input-display').textContent = '';

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
        document.getElementById('voice-input-display').textContent = transcript;
        if (event.results[event.results.length - 1].isFinal) {
            processGlobalVoiceInput(transcript);
        }
    };
    recognition.onerror = () => { showToast('语音识别出错'); stopVoiceInput(); };
    recognition.onend = () => {};
    recognition.start();
}

function stopVoiceInput() {
    if (recognition) { recognition.stop(); recognition = null; }
    document.getElementById('voice-modal').classList.remove('active');
    document.getElementById('voice-confirm-section').style.display = 'none';
}

function processGlobalVoiceInput(text) {
    // 尝试匹配列表中的商品名
    let matchedItem = null;
    let matchedName = '';
    for (const item of shoppingItems) {
        if (text.includes(item.name) || item.name.includes(text.replace(/[\d.斤个份袋瓶公斤kg]/g, '').trim())) {
            matchedItem = item;
            matchedName = item.name;
            break;
        }
    }
    // 模糊匹配：语音可能识别错（如"土洞"→"土豆"）
    if (!matchedItem) {
        const cleanText = text.replace(/[\d.斤个份袋瓶公斤kg]/g, '').trim();
        const fuzzy = fuzzyMatchProduct(cleanText);
        if (fuzzy) { matchedItem = fuzzy; matchedName = fuzzy.name; }
    }

    const num = extractNumber(text);

    if (matchedItem && num !== null) {
        // 找到商品和数量，语音确认
        pendingVoiceModify = { itemId: matchedItem.id, name: matchedItem.name, quantity: num };
        recognition.stop();
        recognition = null;
        showVoiceConfirm(matchedItem.name, num);
    } else if (matchedItem && num === null) {
        // 只找到商品，没有数量
        recognition.stop();
        recognition = null;
        startItemVoice(matchedItem.id);
    } else {
        showToast('未匹配到商品，请重试');
        if (recognition) { recognition.stop(); recognition = null; }
        document.getElementById('voice-modal').classList.remove('active');
    }
}

function fuzzyMatchProduct(text) {
    // 简单模糊匹配：检查每个商品名是否有部分匹配
    for (const item of shoppingItems) {
        const name = item.name;
        // 检查是否有公共字符
        for (let i = 0; i < name.length; i++) {
            if (text.includes(name[i])) return item;
        }
    }
    return null;
}

function showVoiceConfirm(name, quantity) {
    document.getElementById('voice-status-text').textContent = '确认修改';
    document.getElementById('voice-input-display').textContent = '';
    document.getElementById('voice-confirm-text').textContent = `是否将${name}的重量修改为${quantity}？`;
    document.getElementById('voice-confirm-section').style.display = 'block';
    document.getElementById('voice-stop-btn').style.display = 'none';
    // 同时语音播报
    speakText(`是否将${name}的重量修改为${quantity}？`);
}

function confirmVoiceModify() {
    if (!pendingVoiceModify) return;
    const item = shoppingItems.find(i => i.id === pendingVoiceModify.itemId);
    if (item) {
        item.quantity = pendingVoiceModify.quantity;
        item.total = (item.price * item.quantity).toFixed(2);
    }
    saveData(); updateTotal(); renderItemsList();
    showToast(`${pendingVoiceModify.name} 已更新为 ${pendingVoiceModify.quantity}`);
    pendingVoiceModify = null;
    document.getElementById('voice-modal').classList.remove('active');
    document.getElementById('voice-confirm-section').style.display = 'none';
}

function rejectVoiceModify() {
    pendingVoiceModify = null;
    document.getElementById('voice-confirm-section').style.display = 'none';
    document.getElementById('voice-modal').classList.remove('active');
    showToast('已取消修改');
}

// 单项语音输入：直接对该商品说重量
let itemVoiceRecognition = null;
function startItemVoice(id) {
    if (!checkSpeechSupport()) return;
    const item = shoppingItems.find(i => i.id === id);
    if (!item) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    itemVoiceRecognition = new SR();
    itemVoiceRecognition.lang = 'zh-CN';
    itemVoiceRecognition.interimResults = false;
    document.getElementById('voice-modal').classList.add('active');
    document.getElementById('voice-confirm-section').style.display = 'none';
    document.getElementById('voice-stop-btn').style.display = 'block';
    document.getElementById('voice-status-text').textContent = `请说${item.name}的重量`;
    document.getElementById('voice-input-display').textContent = '';

    itemVoiceRecognition.onresult = (e) => {
        const text = e.results[0][0].transcript.trim();
        const num = extractNumber(text);
        if (num !== null) {
            pendingVoiceModify = { itemId: id, name: item.name, quantity: num };
            itemVoiceRecognition.stop();
            itemVoiceRecognition = null;
            showVoiceConfirm(item.name, num);
        } else {
            showToast('未识别到数量');
        }
    };
    itemVoiceRecognition.onerror = () => showToast('语音识别出错');
    itemVoiceRecognition.onend = () => {
        if (pendingVoiceModify === null) {
            // 没有待确认的修改，关闭弹窗
            setTimeout(() => {
                if (document.getElementById('voice-confirm-section').style.display === 'none') {
                    document.getElementById('voice-modal').classList.remove('active');
                }
            }, 500);
        }
    };
    itemVoiceRecognition.start();
}

// ===== 手动输入折叠 =====
function toggleManualInput() {
    const section = document.getElementById('manual-input-section');
    const text = document.getElementById('manual-toggle-text');
    section.classList.toggle('show');
    text.textContent = section.classList.contains('show') ? '收起手动输入' : '手动输入商品';
}

// ===== 小票对账 =====
function uploadReceipt() { showToast('请选择小票图片'); }

function compareReceipt() {
    const receiptTotal = parseFloat(document.getElementById('receipt-total').value);
    if (!receiptTotal || receiptTotal <= 0) { showToast('请输入小票金额'); return; }
    if (shoppingItems.length === 0) { showToast('请先添加商品'); return; }
    const diff = receiptTotal - currentTotal;
    const c = document.getElementById('compare-result');
    if (Math.abs(diff) < 0.01) {
        c.innerHTML = `<div class="result-card success"><div class="result-icon">✅</div><div class="result-title">金额一致</div><div class="result-detail">小票 ¥${receiptTotal.toFixed(2)} = 计算 ¥${currentTotal.toFixed(2)}</div></div>`;
    } else if (diff > 0) {
        c.innerHTML = `<div class="result-card error"><div class="result-icon">⚠️</div><div class="result-title">可能多收了</div><div class="result-detail">小票 ¥${receiptTotal.toFixed(2)} > 计算 ¥${currentTotal.toFixed(2)}</div><div class="result-detail" style="color:var(--danger);font-weight:600;margin-top:8px;">差额：+¥${diff.toFixed(2)}</div></div>`;
    } else {
        c.innerHTML = `<div class="result-card warning"><div class="result-icon">ℹ️</div><div class="result-title">金额有差异</div><div class="result-detail">小票 ¥${receiptTotal.toFixed(2)} < 计算 ¥${currentTotal.toFixed(2)}</div><div class="result-detail" style="color:var(--warn);font-weight:600;margin-top:8px;">差额：-¥${Math.abs(diff).toFixed(2)}</div></div>`;
    }
}

// ===== 保存账单 =====
function saveShoppingList() {
    if (shoppingItems.length === 0) { showToast('没有可保存的商品'); return; }
    const pending = shoppingItems.filter(i => i.quantity === 0);
    if (pending.length > 0) { showToast(`还有${pending.length}件商品未输入重量`); return; }
    historyRecords.unshift({
        id: Date.now(),
        date: new Date().toLocaleString('zh-CN'),
        items: [...shoppingItems],
        total: currentTotal.toFixed(2)
    });
    shoppingItems = []; saveData(); updateTotal(); renderItemsList();
    renderHistory(); populateMonthFilter(); renderAAResult();
    showToast('账单保存成功');
}

// ===== 预算 =====
function setBudget() {
    const v = parseFloat(document.getElementById('budget-input').value);
    if (!v || v <= 0) { showToast('请输入有效的预算金额'); return; }
    budget = v; saveData(); updateBudgetDisplay();
    showToast('预算设置成功');
    document.getElementById('budget-input').value = '';
}

function updateBudgetDisplay() {
    const used = getCurrentMonthUsed();
    const bar = document.getElementById('budget-progress');
    const pct = budget > 0 ? (used / budget) * 100 : 0;
    bar.style.width = `${Math.min(pct, 100)}%`;
    bar.className = 'progress-fill' + (pct >= 100 ? ' error' : pct >= 80 ? ' warning' : '');
    document.getElementById('used-budget').textContent = used.toFixed(2);
    document.getElementById('set-budget').textContent = budget.toFixed(0);
    document.getElementById('month-budget').textContent = budget.toFixed(0);
}

function getCurrentMonthUsed() {
    const now = new Date();
    return historyRecords.reduce((sum, r) => {
        const d = new Date(r.date);
        return (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) ? sum + parseFloat(r.total) : sum;
    }, 0);
}

// ===== 历史记录 =====
function renderHistory() {
    const c = document.getElementById('history-list');
    if (historyRecords.length === 0) {
        c.innerHTML = `<div class="empty-state"><span class="empty-icon">📚</span><p>暂无历史记录</p></div>`;
        return;
    }
    c.innerHTML = historyRecords.map(r => `<div class="history-item" onclick="showRecordDetail(${r.id})"><div class="history-date">${r.date}</div><div class="history-summary"><div class="history-items">${r.items.length} 件商品</div><div class="history-total">¥${r.total}</div></div></div>`).join('');
}

function showRecordDetail(id) {
    const r = historyRecords.find(x => x.id === id);
    if (!r) return;
    showToast(r.items.map(i => `${i.name}: ¥${i.total}`).join('\n') + `\n\n总计：¥${r.total}`);
}

function populateMonthFilter() {
    const filter = document.getElementById('month-filter');
    const months = new Set();
    historyRecords.forEach(r => {
        const d = new Date(r.date);
        months.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
    });
    filter.innerHTML = '<option value="all">全部月份</option>' + Array.from(months).sort().reverse().map(m => {
        const [y, mn] = m.split('-');
        return `<option value="${m}">${y}年${mn}月</option>`;
    }).join('');
}

function filterHistory() {
    const v = document.getElementById('month-filter').value;
    const records = v === 'all' ? historyRecords : historyRecords.filter(r => {
        const d = new Date(r.date);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` === v;
    });
    const c = document.getElementById('history-list');
    if (records.length === 0) {
        c.innerHTML = `<div class="empty-state"><span class="empty-icon">📚</span><p>该月份暂无记录</p></div>`;
        return;
    }
    c.innerHTML = records.map(r => `<div class="history-item" onclick="showRecordDetail(${r.id})"><div class="history-date">${r.date}</div><div class="history-summary"><div class="history-items">${r.items.length} 件商品</div><div class="history-total">¥${r.total}</div></div></div>`).join('');
}

// ===== Toast =====
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

document.addEventListener('DOMContentLoaded', init);