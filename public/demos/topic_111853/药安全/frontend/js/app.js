// ========== API 基础封装 ==========
const API = {
    async get(url) {
        const res = await fetch(url);
        if (res.status === 401) { window.location.href = '/login.html'; return {code:401}; }
        if (res.status === 403) { try { const d = await res.json(); return {code:403, msg: d.msg || '权限不足'}; } catch(e) { return {code:403, msg:'权限不足'}; } }
        return res.json();
    },
    async post(url, data) {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.status === 401) { window.location.href = '/login.html'; return {code:401}; }
        if (res.status === 403) { try { const d = await res.json(); return {code:403, msg: d.msg || '权限不足'}; } catch(e) { return {code:403, msg:'权限不足'}; } }
        return res.json();
    },
    async put(url, data) {
        const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.status === 401) { window.location.href = '/login.html'; return {code:401}; }
        if (res.status === 403) { try { const d = await res.json(); return {code:403, msg: d.msg || '权限不足'}; } catch(e) { return {code:403, msg:'权限不足'}; } }
        return res.json();
    },
    async del(url) {
        const res = await fetch(url, { method: 'DELETE' });
        if (res.status === 401) { window.location.href = '/login.html'; return {code:401}; }
        if (res.status === 403) { try { const d = await res.json(); return {code:403, msg: d.msg || '权限不足'}; } catch(e) { return {code:403, msg:'权限不足'}; } }
        return res.json();
    },
    async postFormData(url, formData) {
        const res = await fetch(url, { method: 'POST', body: formData });
        if (res.status === 401) { window.location.href = '/login.html'; return {code:401}; }
        if (res.status === 403) { try { const d = await res.json(); return {code:403, msg: d.msg || '权限不足'}; } catch(e) { return {code:403, msg:'权限不足'}; } }
        return res.json();
    }
};

// ========== Toast ==========
function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div'); div.textContent = str; return div.innerHTML;
}

// ========== 全局状态 ==========
let currentUser = null;
let currentPage = 'dashboard';
let elderlyList = [];
let selectedElderlyId = null;
let pendingCount = 0;
let lastPendingCount = -1;   // 上一次轮询的待回复问题数（-1 表示首次加载）
let lastAlertCount = -1;     // 上一次轮询的未读告警数
let pollingInterval = null;
let drugInfoCache = null;
let mediaRecorder = null;
let audioChunks = [];
let currentReplyType = 'text';
let currentReplyImageBlob = null;
let currentReplyAudioBlob = null;

// ========== AI 服务状态检测 ==========
let aiServiceAvailable = false;

async function checkAIServiceStatus() {
    try {
        const result = await API.get('/api/ai/health');
        if (result.code === 0 && result.data) {
            aiServiceAvailable = result.data.ai_available || false;
            updateAIStatusBadge();
        }
    } catch (e) {
        aiServiceAvailable = false;
        updateAIStatusBadge();
    }
}

function updateAIStatusBadge() {
    let badge = document.getElementById('ai-status-badge');
    if (!badge) {
        // 创建 AI 状态徽标，放在页面头部
        badge = document.createElement('div');
        badge.id = 'ai-status-badge';
        badge.style.cssText = 'position:fixed;top:0.5rem;right:0.5rem;z-index:9999;padding:0.3rem 0.8rem;border-radius:980px;font-size:0.75rem;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.1);';
        document.body.appendChild(badge);
    }
    if (aiServiceAvailable) {
        badge.textContent = '✓ AI 已就绪';
        badge.style.background = '#e8f5e9';
        badge.style.color = '#2e7d32';
        badge.style.display = 'block';
    } else {
        badge.textContent = '演示模式（AI未配置）';
        badge.style.background = '#fff3e0';
        badge.style.color = '#e65100';
        badge.style.display = 'block';
        // 3秒后淡出
        setTimeout(() => { if (badge) badge.style.opacity = '0.7'; }, 3000);
    }
}

// ========== 认证 ==========
async function checkAuth() {
    const result = await API.get('/api/auth/me');
    if (result.code === 0 && result.data) {
        currentUser = result.data;
        sessionStorage.setItem('user_id', currentUser.user_id);
        sessionStorage.setItem('family_id', currentUser.family_id);
        sessionStorage.setItem('role_type', currentUser.role_type || 'admin');

        // 角色自动路由
        if (currentUser.role_type === 'member') {
            window.location.href = '/member.html';
            return false;
        } else if (currentUser.role_type === 'elderly') {
            window.location.href = '/elderly.html';
            return false;
        }
        return true;
    }
    window.location.href = '/login.html';
    return false;
}

async function handleLogout() {
    if (_sseEventSource) { _sseEventSource.close(); _sseEventSource = null; }
    if (_sseReconnectTimer) { clearTimeout(_sseReconnectTimer); _sseReconnectTimer = null; }
    await API.post('/api/auth/logout');
    sessionStorage.clear();
    window.location.href = '/login.html';
}

// ========== 侧边栏导航 ==========
function buildSidebar() {
    const nav = document.getElementById('sidebar-nav');
    const menuItems = [
        { page: 'dashboard', label: '🏠 家庭药箱' },
        { page: 'medicine', label: '💊 老人药品管理' },
        { page: 'report', label: '📊 服药报告' },
        { page: 'knowledge', label: '📚 知识库管理' },
        { page: 'pending', label: '💬 待回复问题', badge: true },
        { page: 'postcards', label: '📮 语音明信片', badge: true, badgeId: 'badge-postcard' },
        { page: 'family', label: '👨‍👩‍👦 家庭管理' }
    ];

    nav.innerHTML = menuItems.map(item => {
        let badgeHtml = '';
        if (item.badge) {
            const badgeId = item.badgeId || 'badge-pending';
            badgeHtml = `<span class="badge" id="${badgeId}" style="display:none">0</span>`;
        }
        return `<a href="#" data-page="${item.page}">${item.label}${badgeHtml}</a>`;
    }).join('');

    updateSidebarBadge();
}

function updateSidebarBadge() {
    const badge = document.getElementById('badge-pending');
    if (badge) {
        if (pendingCount > 0) {
            badge.style.display = 'inline';
            badge.textContent = pendingCount;
        } else {
            badge.style.display = 'none';
        }
    }
}

// ========== 页面切换 ==========
function switchPage(page) {
    currentPage = page;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));

    const viewMap = {
        'dashboard': 'view-dashboard',
        'medicine': 'view-medicine',
        'report': 'view-report',
        'knowledge': 'view-knowledge',
        'pending': 'view-pending',
        'postcards': 'view-postcards',
        'family': 'view-family'
    };
    const viewEl = document.getElementById(viewMap[page]);
    if (viewEl) viewEl.classList.add('active');

    const navLink = document.querySelector(`.sidebar-nav a[data-page="${page}"]`);
    if (navLink) navLink.classList.add('active');

    if (page === 'dashboard') loadDashboard();
    if (page === 'medicine') { if (!selectedElderlyId && elderlyList.length > 0) { selectedElderlyId = elderlyList[0].id; } loadMedicineView(); }
    if (page === 'report') loadComplianceReport();
    if (page === 'knowledge') loadKnowledgeList();
    if (page === 'pending') loadPendingQuestions();
    if (page === 'postcards') loadVoicePostcards();
    if (page === 'family') loadFamily();
}

// ========== 语音明信片 ==========
async function loadVoicePostcards() {
    const container = document.getElementById('view-postcards-list');
    if (!container) return;
    const result = await API.get('/api/voice-postcards?limit=50');
    if (result.code !== 0 || !result.data || result.data.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:3rem;color:#86868b;">还没有语音明信片<br><span style="font-size:0.85rem;">老人打卡后可以给家人留语音消息</span></div>';
        return;
    }
    container.innerHTML = '<h3 style="margin:1rem 0;">📮 家庭语音明信片</h3>' + result.data.map(p => {
        const time = p.created_at || '';
        const name = p.elderly_name || p.elderly_username || '老人';
        const unread = !p.is_read;
        return `<div class="postcard-item" data-id="${p.id}" style="background:#fff;border-radius:12px;padding:1rem;margin:0.5rem 0;display:flex;align-items:center;gap:1rem;border:1px solid #e8e8ed;${unread ? 'border-left:3px solid #0071e3;' : ''}">
            <div style="flex:1;">
                <div style="font-weight:600;">${escapeHtml(name)} ${unread ? '<span style="color:#0071e3;font-size:0.75rem;">新</span>' : ''}</div>
                <div style="color:#86868b;font-size:0.82rem;">${time}</div>
                ${p.note ? `<div style="color:#424245;font-size:0.88rem;margin-top:0.3rem;">${escapeHtml(p.note)}</div>` : ''}
            </div>
            <audio controls src="${p.audio_url}" style="height:36px;"></audio>
        </div>`;
    }).join('');

    // 自动标记当前页所有未读为已读（延迟3秒，给用户看到"新"标记的时间）
    setTimeout(async () => {
        for (const p of result.data) {
            if (!p.is_read) {
                try { await API.post(`/api/voice-postcards/${p.id}/read`); } catch(e) {}
            }
        }
        updatePostcardBadge();
    }, 3000);
}

async function updatePostcardBadge() {
    try {
        const r = await API.get('/api/voice-postcards/unread-count');
        if (r.code === 0 && r.data) {
            const badge = document.getElementById('badge-postcard');
            if (badge) {
                if (r.data.count > 0) { badge.style.display = 'inline'; badge.textContent = r.data.count; }
                else { badge.style.display = 'none'; }
            }
        }
    } catch(e) {}
}

// ========== 首页：家庭药箱 ==========
let cabinetMedicines = [];
async function loadDashboard() {
    // 问候语
    const hour = new Date().getHours();
    let greeting = '早上好'; if (hour >= 12 && hour < 18) greeting = '下午好'; else if (hour >= 18) greeting = '晚上好';
    document.getElementById('home-greeting').textContent = `${greeting}，${currentUser ? currentUser.username : ''}`;

    // 加载老人列表（供"老人药品管理"页使用，本页不渲染老人卡片）
    try {
        const dashResult = await API.get('/api/family/dashboard');
        if (dashResult.code === 0 && dashResult.data) {
            const data = dashResult.data;
            const rawList = Array.isArray(data) ? data : (data.elderly || []);
            elderlyList = rawList.map(e => ({
                id: e.member_id || e.id,
                elderly_name: e.name || e.elderly_name || e.username || '',
                username: e.username || e.name || e.elderly_name || '',
                is_elderly: 1,
                checked_today: e.checked_today || e.checkin_done || 0,
                total_reminders: e.total_reminders || e.checkin_total || 0,
                last_checkin_time: e.last_checkin_time || null,
                has_alert: e.has_alert || e.has_conflict || false,
                status: e.status || '',
                unread_alerts: e.unread_alerts || 0,
            }));
        }
    } catch (e) {}

    // 加载家庭药箱药品
    loadFamilyCabinet();
}

// 迭代3：分类排序规则——"其他/未分类"置底，其余按拼音
const CABINET_BOTTOM_CATEGORIES = new Set(['其他药品', '其他', '未分类']);
function cabinetCategoryCompare(a, b) {
    const na = (a || '未分类').trim() || '未分类';
    const nb = (b || '未分类').trim() || '未分类';
    const ba = CABINET_BOTTOM_CATEGORIES.has(na) ? 1 : 0;
    const bb = CABINET_BOTTOM_CATEGORIES.has(nb) ? 1 : 0;
    if (ba !== bb) return ba - bb;            // 置底组排后
    if (ba === 1) return 0;                   // 置底组内保持稳定
    return na.localeCompare(nb, 'zh-CN');     // 正常分类按拼音
}

// 阶段4：SSE 实时同步 + visibilitychange + 60s 轮询兜底
let _cabinetSyncLastTs = 0;
let _sseEventSource = null;
let _sseReconnectTimer = null;

function _cabinetSyncThrottledRefresh() {
    const now = Date.now();
    if (now - _cabinetSyncLastTs < 500) return;  // 500ms 防抖
    _cabinetSyncLastTs = now;
    if (typeof loadFamilyCabinet === 'function') loadFamilyCabinet();
    if (typeof loadElderlyMedicines === 'function' && selectedElderlyId) loadElderlyMedicines();
}

function setupSSECabinetSync() {
    // 1. 连接 SSE
    _connectSSE();

    // 2. visibilitychange 切回时主动刷新 + 重连 SSE
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            _cabinetSyncLastTs = 0;
            _cabinetSyncThrottledRefresh();
            if (!_sseEventSource || _sseEventSource.readyState === EventSource.CLOSED) {
                _connectSSE();
            }
        }
    });

    // 3. 60s 轮询兜底（SSE 断线时仍能拉取最新数据）
    setInterval(() => {
        if (!document.hidden) _cabinetSyncThrottledRefresh();
    }, 60000);
}

function _connectSSE() {
    try {
        _sseEventSource = new EventSource('/api/medicines/stream');

        _sseEventSource.addEventListener('medicine_changed', (e) => {
            _cabinetSyncLastTs = 0;  // 重置节流，立即刷新
            _cabinetSyncThrottledRefresh();
        });

        _sseEventSource.addEventListener('connected', (e) => {
            console.log('[SSE] connected');
        });

        _sseEventSource.onerror = (e) => {
            console.warn('[SSE] error, will reconnect in 5s');
            if (_sseEventSource) {
                _sseEventSource.close();
                _sseEventSource = null;
            }
            // 5s 后手动重连（EventSource 原生自动重连但有时不触发）
            if (_sseReconnectTimer) clearTimeout(_sseReconnectTimer);
            _sseReconnectTimer = setTimeout(() => _connectSSE(), 5000);
        };
    } catch (e) {
        console.warn('[SSE] connect failed:', e);
    }
}

// 需求2：手动刷新家庭药箱（绕过节流立即拉取）
function manualRefreshCabinet() {
    _cabinetSyncLastTs = 0;  // 重置节流时间戳
    if (typeof loadFamilyCabinet === 'function') loadFamilyCabinet();
    if (typeof loadElderlyMedicines === 'function' && selectedElderlyId) loadElderlyMedicines();
    showToast('已刷新');
}

// 家庭药箱：加载所有药品并填充分类筛选
async function loadFamilyCabinet() {
    const result = await API.get('/api/medicines?sort=expiry_asc');
    if (result.code !== 0) return;
    cabinetMedicines = result.data || [];
    // 填充分类
    const cats = [];
    cabinetMedicines.forEach(m => { if (m.category && !cats.includes(m.category)) cats.push(m.category); });
    const sel = document.getElementById('cabinet-category-filter');
    if (sel) sel.innerHTML = '<option value="">全部分类</option>' + cats.sort(cabinetCategoryCompare).map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    renderCabinetCards();
}

// 家庭药箱：渲染药品卡片网格（分类筛选 + 搜索 + 缺货标黄/增删按钮）
function renderCabinetCards() {
    const container = document.getElementById('cabinet-grid');
    const empty = document.getElementById('cabinet-empty');
    if (!container) return;
    const searchTerm = (document.getElementById('cabinet-search').value || '').trim().toLowerCase();
    const categoryFilter = document.getElementById('cabinet-category-filter').value;

    let filtered = cabinetMedicines.filter(m => m.status === 'active');
    if (searchTerm) filtered = filtered.filter(m => (m.name||'').toLowerCase().includes(searchTerm) || (m.manufacturer||'').toLowerCase().includes(searchTerm));
    if (categoryFilter) filtered = filtered.filter(m => m.category === categoryFilter);

    // 按分类分组
    const groups = {};
    filtered.forEach(m => {
        const g = m.category || '未分类';
        if (!groups[g]) groups[g] = [];
        groups[g].push(m);
    });

    if (filtered.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    let html = '';
    Object.keys(groups).sort(cabinetCategoryCompare).forEach(groupName => {
        html += `<div class="cabinet-group"><div class="cabinet-group-title">${escapeHtml(groupName)}</div><div class="cabinet-group-grid">`;
        // 在分类组内按 name+manufacturer 二次聚合（同名同厂合并为一张卡片）
        const subGroups = {};
        const subOrder = [];
        groups[groupName].forEach(m => {
            const key = (m.name || '') + '\u0001' + (m.manufacturer || '');
            if (!subGroups[key]) { subGroups[key] = []; subOrder.push(key); }
            subGroups[key].push(m);
        });
        subOrder.forEach(key => {
            const records = subGroups[key];
            const first = records[0];
            const totalStock = records.reduce((s, m) => s + parseFloat(m.stock_quantity || 0), 0);
            const totalPack = records.reduce((s, m) => s + parseInt(m.pack_total_units || 0), 0);
            const pct = totalPack > 0 ? Math.max(0, Math.min(100, (totalStock / totalPack) * 100)) : 100;
            let stockClass = 'cab-stock-ample';
            let stockBadge = '';
            if (totalStock <= 0) { stockClass = 'cab-stock-depleted'; stockBadge = '<span class="cab-badge cab-badge-danger">已缺货</span>'; }
            else if (pct < 20) { stockClass = 'cab-stock-low'; stockBadge = '<span class="cab-badge cab-badge-warn">即将缺货</span>'; }

            // 按钮：所有药品均可编辑/删除（库存调整通过展开后的"⚙ 调整"按钮）
            const safeName = escapeHtml(first.name).replace(/'/g,"\\'");
            const ids = records.map(r => r.id).join(',');
            const actions = `<button class="btn btn-outline btn-xs" onclick="openCabinetEditModal(${first.id})">✏ 编辑</button><button class="btn btn-danger btn-xs" onclick="deleteCabinetMedicine('${ids}', '${safeName}')">🗑 删除</button>`;

            const photoHtml = first.photo_url
                ? `<div class="cab-photo" style="background-image:url('${escapeHtml(first.photo_url)}')" title="点击展开"></div>`
                : `<div class="cab-photo cab-photo-placeholder" title="点击展开">📷</div>`;

            const days = first.days_left;
            let expiryBadge = '';
            if (days !== null && days < 0) expiryBadge = '<span class="cab-badge cab-badge-expired">已过期</span>';
            else if (days !== null && days <= 30) expiryBadge = `<span class="cab-badge cab-badge-soon">剩 ${days} 天</span>`;

            // 位置列表：按 storage 第三层聚合（相同位置合并，库存求和）
            let locHtml = '';
            const locGroups = {};
            records.forEach(rec => {
                const loc = rec.storage || '未指定';
                if (!locGroups[loc]) locGroups[loc] = [];
                locGroups[loc].push(rec);
            });
            Object.keys(locGroups).forEach(loc => {
                const locRecords = locGroups[loc];
                const locStock = locRecords.reduce((s, r) => s + parseFloat(r.stock_quantity || 0), 0);
                const locName = escapeHtml(loc);
                const unitLabel = locRecords[0].unit_label || '片';
                const stockText = `${locStock}${escapeHtml(unitLabel)}`;
                const firstRec = locRecords[0];
                locHtml += `<div class="cab-location-row">
                    <span class="cab-loc-name"><span class="loc-icon">📍</span>${locName}</span>
                    <span class="cab-loc-stock ${locStock <= 0 ? 'cab-loc-empty' : ''}">${stockText}</span>
                    <button class="cab-loc-adjust-btn" onclick="openAdjustStockDialog(${firstRec.id}, ${locStock}, '${escapeHtml(first.name).replace(/'/g,"\\'")}', '${escapeHtml(unitLabel)}')" title="调整数量">⚙ 调整</button>
                </div>`;
            });

            html += `<div class="cabinet-card ${stockClass}" data-expanded="false">
                <div class="cab-card-head" onclick="toggleCabinetCardExpand(this.parentElement)">
                    ${photoHtml}
                    <div class="cab-body">
                        <div class="cab-head">
                            <span class="cab-name">${escapeHtml(first.name)}</span>
                            <div class="cab-badges">${stockBadge}${expiryBadge}</div>
                        </div>
                        <div class="cab-meta">
                            ${first.manufacturer ? `<span>🏭 ${escapeHtml(first.manufacturer)}</span>` : ''}
                            <span>📅 ${escapeHtml(first.expiry_date || '')}</span>
                        </div>
                        ${first.usage_dosage ? `<div class="cab-line">💡 ${escapeHtml(first.usage_dosage)}</div>` : ''}
                        ${first.note ? `<div class="cab-line cab-note">📝 ${escapeHtml(first.note)}</div>` : ''}
                        <div class="cab-stock-line">📦 总库存 ${totalStock}${escapeHtml(first.unit_label||'片')}${totalPack ? ' / ' + totalPack : ' / --'} <span class="cab-expand-hint">点击展开</span></div>
                    </div>
                </div>
                <div class="cab-expandable">
                    <div class="cab-locations">${locHtml}</div>
                    <div class="cab-actions">${actions}</div>
                </div>
            </div>`;
        });
        html += `</div></div>`;
    });
    container.innerHTML = html;
}

// 家庭药箱：添加药品入口（复用 add-medicine-modal）
function openCabinetAddMedicineModal() {
    document.getElementById('add-medicine-title').textContent = '添加药品到家庭药箱';
    const saveBtn = document.querySelector('#add-medicine-modal .btn-primary');
    if (saveBtn) saveBtn.setAttribute('onclick', 'submitCabinetAddMedicine()');
    _doOpenAddMedicineModal();
}

async function submitCabinetAddMedicine() {
    const name = document.getElementById('med-name').value.trim();
    const manufacturer = document.getElementById('med-manufacturer').value.trim();
    const expiryDate = document.getElementById('med-expiry').value;
    const prodDate = document.getElementById('med-prod-date').value;
    const category = document.getElementById('med-category').value;
    const shelfLife = parseInt(document.getElementById('med-shelf-life').value) || 24;
    const storage = document.getElementById('med-storage').value;
    const packTotal = parseInt(document.getElementById('med-pack-total').value) || 0;
    const unitLabel = document.getElementById('med-unit-label').value;
    const restockThreshold = parseInt(document.getElementById('med-restock-threshold').value) || 7;

    if (!name) return showToast('请填写药品名称', 'error');
    if (!expiryDate) return showToast('请选择到期日期', 'error');

    const medResult = await API.post('/api/medicines', {
        name: name,
        manufacturer: manufacturer,
        category: category,
        storage: storage,
        production_date: prodDate,
        expiry_date: expiryDate,
        shelf_life_months: shelfLife,
        pack_total_units: packTotal,
        stock_quantity: packTotal > 0 ? packTotal : 1,
        unit_label: unitLabel,
        restock_threshold_days: restockThreshold
    });

    if (medResult.code === 0) {
        showToast('药品已添加到家庭药箱');
        closeAddMedicineModal();
        loadFamilyCabinet();
    } else {
        showToast(medResult.msg || '添加失败', 'error');
    }
}
function toggleCabinetCardExpand(cardEl) {
    const expanded = cardEl.getAttribute('data-expanded') === 'true';
    cardEl.setAttribute('data-expanded', expanded ? 'false' : 'true');
}

// 需求5：调整库存对话框（替代纯 +/- 一片一片交互）
function openAdjustStockDialog(recordId, currentStock, name, unit) {
    // 移除已有对话框
    const existing = document.getElementById('adjust-stock-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'adjust-stock-modal';
    modal.className = 'adjust-stock-modal-overlay';
    modal.innerHTML = `
        <div class="adjust-stock-modal-box">
            <div class="adjust-stock-modal-header">
                <h3>调整库存 - ${escapeHtml(name)}</h3>
                <button class="modal-close" onclick="document.getElementById('adjust-stock-modal').remove()">✕</button>
            </div>
            <div class="adjust-stock-modal-body">
                <div class="adjust-stock-current">当前库存：<strong>${currentStock} ${escapeHtml(unit)}</strong></div>
                <div class="adjust-stock-form">
                    <label class="adjust-stock-radio"><input type="radio" name="adjust-mode" value="add" checked> 增加</label>
                    <label class="adjust-stock-radio"><input type="radio" name="adjust-mode" value="subtract"> 减少</label>
                </div>
                <div class="adjust-stock-input-wrap">
                    <input type="number" id="adjust-stock-qty" value="1" min="1" step="1" class="adjust-stock-input">
                    <span class="adjust-stock-unit">${escapeHtml(unit)}</span>
                </div>
            </div>
            <div class="adjust-stock-modal-footer">
                <button class="btn btn-outline" onclick="document.getElementById('adjust-stock-modal').remove()">取消</button>
                <button class="btn btn-primary" onclick="submitAdjustStockDialog(${recordId})">确认调整</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    // 点击遮罩关闭
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

async function submitAdjustStockDialog(recordId) {
    const mode = document.querySelector('input[name="adjust-mode"]:checked').value;
    const qty = parseFloat(document.getElementById('adjust-stock-qty').value);
    if (isNaN(qty) || qty <= 0) { showToast('请输入有效数量', 'error'); return; }
    const delta = mode === 'add' ? qty : -qty;
    document.getElementById('adjust-stock-modal').remove();
    const result = await API.post(`/api/medicines/${recordId}/adjust-stock`, { delta: delta });
    if (result.code === 0) {
        showToast(result.msg || '已调整');
        if (typeof loadFamilyCabinet === 'function') loadFamilyCabinet();
        if (typeof loadMedicines === 'function') loadMedicines();
        if (typeof loadElderlyMedicines === 'function' && typeof selectedElderlyId !== 'undefined' && selectedElderlyId) loadElderlyMedicines();
    } else {
        showToast(result.msg || '操作失败', 'error');
    }
}

async function deleteCabinetMedicine(medIdsStr, medName) {
    if (!confirm(`确定删除「${medName}」吗？此操作不可撤销。`)) return;
    const result = await API.post('/api/medicines/batch-delete', { ids: medIdsStr });
    if (result.code === 0) { showToast('已删除'); loadFamilyCabinet(); }
    else showToast(result.msg || '删除失败', 'error');
}

// 家庭药箱：编辑药品基本信息
function openCabinetEditModal(medId) {
    const m = cabinetMedicines.find(x => x.id === medId);
    if (!m) return;
    document.getElementById('cab-edit-id').value = m.id;
    document.getElementById('cab-edit-name').value = m.name || '';
    document.getElementById('cab-edit-manufacturer').value = m.manufacturer || '';
    document.getElementById('cab-edit-usage').value = m.usage_dosage || '';
    document.getElementById('cab-edit-storage').value = m.storage || '';
    document.getElementById('cab-edit-note').value = m.note || '';
    const photoImg = document.getElementById('cab-edit-photo');
    if (m.photo_url) { photoImg.src = m.photo_url; photoImg.style.display = 'block'; }
    else { photoImg.removeAttribute('src'); photoImg.style.display = 'none'; }
    document.getElementById('cabinet-edit-modal').style.display = 'flex';
}

function closeCabinetEditModal() {
    document.getElementById('cabinet-edit-modal').style.display = 'none';
}

async function saveCabinetEdit() {
    const id = document.getElementById('cab-edit-id').value;
    const payload = {
        name: document.getElementById('cab-edit-name').value.trim(),
        manufacturer: document.getElementById('cab-edit-manufacturer').value.trim(),
        usage_dosage: document.getElementById('cab-edit-usage').value.trim(),
        storage: document.getElementById('cab-edit-storage').value.trim(),
        note: document.getElementById('cab-edit-note').value.trim(),
    };
    if (!payload.name) { showToast('请填写药品名称', 'error'); return; }
    const result = await API.put(`/api/medicines/${id}`, payload);
    if (result.code === 0) { showToast('已保存'); closeCabinetEditModal(); loadFamilyCabinet(); }
    else showToast(result.msg || '保存失败', 'error');
}

// 家庭药箱：上传药品照片
async function onCabinetPhotoSelected(file) {
    const id = document.getElementById('cab-edit-id').value;
    if (!id || !file) return;
    const fd = new FormData();
    fd.append('photo', file);
    const result = await API.postFormData(`/api/medicines/${id}/upload-photo`, fd);
    if (result.code === 0) {
        showToast('照片已上传');
        const photoImg = document.getElementById('cab-edit-photo');
        photoImg.src = result.data.photo_url;
        photoImg.style.display = 'block';
        loadFamilyCabinet();
    } else showToast(result.msg || '上传失败', 'error');
}

// ========== 库存预警看板（迭代5：管理员端闭环）==========
async function loadInventoryAlerts() {
    const result = await API.get('/api/inventory/restock-list');
    const panel = document.getElementById('inventory-alert-panel');
    const list = document.getElementById('inventory-alert-list');
    const countEl = document.getElementById('inventory-alert-count');
    if (result.code !== 0 || !result.data) {
        panel.style.display = 'none';
        return;
    }
    const urgent = result.data.filter(i => i.status === 'pulse' || i.status === 'depleted');
    if (urgent.length === 0) {
        panel.style.display = 'none';
        return;
    }
    countEl.textContent = urgent.length;
    list.innerHTML = urgent.map(i => {
        const daysText = i.days_left !== null && i.days_left !== undefined
            ? (i.days_left <= 0 ? '已断药' : `约 ${i.days_left} 天`)
            : '数据不足';
        return `<div class="inventory-alert-item ${i.status}" onclick="openStockAdjustModal(${i.medicine_id}, '${escapeHtml(i.name)}', ${i.remaining_units || 0}, '${escapeHtml(i.unit_label || '片')}')" style="cursor:pointer" title="点击管理库存">
            <div class="inv-item-name">${escapeHtml(i.name)} <span class="inv-manage-hint">点击管理库存 →</span></div>
            <div class="inv-item-info">
                <span>剩余 ${i.remaining_units}${escapeHtml(i.unit_label || '片')}</span>
                <span class="inv-item-days">${daysText}</span>
                <span>建议补 ${i.suggest_buy}${escapeHtml(i.unit_label || '片')}</span>
            </div>
        </div>`;
    }).join('');
    panel.style.display = 'block';
}

// 库存增删管理弹窗（从预警界面跳转）
function openStockAdjustModal(medicineId, name, currentQty, unit) {
    const delta = prompt(`【库存管理】${name}\n当前库存：${currentQty}${unit}\n\n请输入调整数量（正数=补货入库，负数=损耗出库）：`);
    if (delta === null) return;
    const num = parseFloat(delta);
    if (isNaN(num) || num === 0) {
        showToast('请输入有效的非零数字', 'error');
        return;
    }
    adjustMedicineStock(medicineId, num, name);
}

// ========== AI健康周报 + 药箱精灵周记（迭代5创新）==========
async function loadWeeklyReport() {
    const container = document.getElementById('weekly-report-container');
    const entry = document.getElementById('weekly-report-entry');
    entry.style.display = 'none';
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted);">药箱精灵正在撰写本周周记...</div>';

    const result = await API.get('/api/health/weekly-report');
    if (result.code !== 0 || !result.data) {
        container.innerHTML = `<div style="padding:1.5rem;color:var(--danger);">周报生成失败：${escapeHtml(result.msg || '服务异常')}<br><button class="btn btn-outline btn-sm" style="margin-top:0.8rem" onclick="loadWeeklyReport()">重试</button></div>`;
        entry.style.display = 'block';
        return;
    }
    const d = result.data;
    const spiritDiary = d.spirit_diary || '';
    const stats = d.stats || {};
    const restock = d.restock_list || [];

    const restockHtml = restock.length > 0
        ? `<div class="report-section"><div class="report-section-title">📦 补货提醒</div>${restock.map(r => `<div class="report-restock-item">${escapeHtml(r.name)}：剩余 ${r.remaining_units}${escapeHtml(r.unit_label||'片')}，建议补 ${r.suggest_buy}${escapeHtml(r.unit_label||'片')}</div>`).join('')}</div>`
        : '';

    container.innerHTML = `
        <div class="weekly-report-card">
            <div class="report-header">
                <div class="report-spirit-avatar">🧚</div>
                <div>
                    <div class="report-title">药箱精灵周记</div>
                    <div class="report-date">${new Date().toLocaleDateString('zh-CN')} · 第 ${d.week_number || 1} 期</div>
                </div>
            </div>
            <div class="report-diary">${escapeHtml(spiritDiary).replace(/\n/g, '<br>')}</div>
            <div class="report-stats">
                <div class="report-stat"><div class="rs-num">${stats.compliance_rate || 0}%</div><div class="rs-label">本周合规率</div></div>
                <div class="report-stat"><div class="rs-num">${stats.checked_count || 0}</div><div class="rs-label">打卡次数</div></div>
                <div class="report-stat"><div class="rs-num">${stats.postcard_count || 0}</div><div class="rs-label">语音明信片</div></div>
                <div class="report-stat"><div class="rs-num">${stats.alert_count || 0}</div><div class="rs-label">冲突告警</div></div>
            </div>
            ${restockHtml}
            ${d.ai_available === false ? '<div class="report-fallback">⚠️ AI服务暂不可用，以上为结构化数据汇总</div>' : ''}
            <div style="margin-top:1rem;text-align:right;">
                <button class="btn btn-outline btn-sm" onclick="loadWeeklyReport()">🔄 重新生成</button>
            </div>
        </div>`;
}

// ========== 老人药品管理视图 ==========
function viewElderlyMedicine(uid, name) {
    selectedElderlyId = uid;
    document.getElementById('medicine-header').textContent = `${escapeHtml(name)} 的药品管理`;
    document.getElementById('medicine-subtitle').textContent = '管理用药、提醒和冲突检测';
    switchPage('medicine');
}

async function loadMedicineView() {
    if (!selectedElderlyId) return;

    // 加载老人tabs
    await renderElderlyTabs();

    // 加载药品列表
    await loadElderlyMedicines();

    // 检查冲突告警
    await checkInteractions();
}

async function renderElderlyTabs() {
    const tabsContainer = document.getElementById('elderly-tabs');
    if (elderlyList.length === 0) {
        const result = await API.get('/api/family/elderly');
        if (result.code === 0) elderlyList = result.data || [];
    }

    tabsContainer.innerHTML = elderlyList.map(elderly => `
        <button class="elderly-tab ${elderly.id === selectedElderlyId ? 'active' : ''}"
            onclick="selectElderlyTab(${elderly.id}, '${escapeHtml(elderly.elderly_name || elderly.username)}')">
            ${escapeHtml(elderly.elderly_name || elderly.username)}
        </button>
    `).join('');
}

async function selectElderlyTab(uid, name) {
    selectedElderlyId = uid;
    document.getElementById('medicine-header').textContent = `${escapeHtml(name)} 的药品管理`;
    await renderElderlyTabs();
    await loadElderlyMedicines();
    await checkInteractions();
}

async function loadElderlyMedicines() {
    if (!selectedElderlyId) return;
    const result = await API.get(`/api/members/${selectedElderlyId}/medicines`);
    const container = document.getElementById('medicine-cards');

    if (result.code !== 0 || !result.data || result.data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>该老人还没有药品，请添加</p></div>';
        return;
    }

    const medicines = result.data;
    container.innerHTML = medicines.map(m => {
        const expDays = m.days_left;
        const stockQty = m.stock_quantity || 0;
        const stockStatus = m.stock_status;
        const stockDays = (m.stock_days_left_float !== null && m.stock_days_left_float !== undefined)
            ? m.stock_days_left_float
            : m.stock_days_left;
        let cardClass = 'safe';
        let statusHtml = '';

        if (m.status === 'used') {
            // 已用完（药品停用）
            cardClass = '';
            statusHtml = '<span class="badge-used">已停用</span>';
        } else if (stockStatus === 'unknown') {
            // 无用量数据：回退到基于过期日的判定（保留原逻辑）
            if (expDays !== null && expDays < 0) {
                cardClass = 'expired';
                statusHtml = '<span class="badge-expired">已过期 ' + Math.abs(expDays) + ' 天</span>';
            } else if (expDays !== null && expDays <= 7) {
                cardClass = 'low-stock';
                statusHtml = '<span class="badge-stock-yellow">即将过期 剩 ' + expDays + ' 天</span>';
            } else if (expDays !== null && expDays <= 30) {
                cardClass = 'warning';
                statusHtml = '<span class="badge-stock-yellow">注意 剩 ' + expDays + ' 天过期</span>';
            } else {
                statusHtml = '<span class="badge-stock-unknown">数据不足</span>';
            }
        } else if (stockQty <= 0 || stockStatus === 'depleted' || stockDays < 1) {
            // 红色：余量不足
            cardClass = 'low-stock';
            statusHtml = '<span class="badge-stock-red">余量不足 已断药</span>';
        } else if (stockDays <= 5) {
            // 黄色：即将用尽（1~5天）
            cardClass = 'warning';
            const d = Math.round(stockDays);
            statusHtml = '<span class="badge-stock-yellow">即将用尽 剩 ' + d + ' 天</span>';
        } else {
            // 绿色：余量充足
            cardClass = 'safe';
            const d = Math.round(stockDays);
            statusHtml = '<span class="badge-stock-green">余量充足 剩 ' + d + ' 天</span>';
        }

        return `<div class="medicine-card ${cardClass}">
            <div class="med-header">
                <span class="med-name">${escapeHtml(m.name)}</span>
                ${statusHtml}
            </div>
            <div class="med-meta">
                ${m.manufacturer ? '<span>🏭 ' + escapeHtml(m.manufacturer) + '</span>' : ''}
                <span>📂 ${escapeHtml(m.category)}</span>
                <span>📅 ${m.expiry_date}</span>
                <span>📦 库存 ${stockQty}${escapeHtml(m.unit_label || '片')}</span>
                ${m.storage ? '<span>📍 ' + escapeHtml(m.storage) + '</span>' : ''}
            </div>
            <div class="med-actions">
                <button class="btn btn-outline btn-sm" onclick="openReminderModal(${selectedElderlyId}, ${m.id}, '${escapeHtml(m.name)}')">设置提醒</button>
                <button class="btn btn-outline btn-sm" onclick="openAddMedicineModal()">换药</button>
                <button class="btn btn-danger btn-sm" onclick="deleteElderlyMedicine(${m.record_id})">移除</button>
            </div>
        </div>`;
    }).join('');
}

// 库存增删管理
async function adjustMedicineStock(medicineId, delta, name) {
    const result = await API.post(`/api/medicines/${medicineId}/adjust-stock`, { delta: delta });
    if (result.code === 0) {
        showToast(result.msg);
        loadElderlyMedicines();
        loadDashboard();
    } else {
        showToast(result.msg || '操作失败', 'error');
    }
}

async function adjustMedicineStockCustom(medicineId, name, unit) {
    const input = prompt(`调整 ${name} 的库存（正数增加，负数减少，单位：${unit}）：`);
    if (input === null) return;
    const delta = parseFloat(input);
    if (isNaN(delta) || delta === 0) {
        showToast('请输入有效的非零数字', 'error');
        return;
    }
    await adjustMedicineStock(medicineId, delta, name);
}

async function checkInteractions() {
    if (!selectedElderlyId) return;
    const alertBanner = document.getElementById('interaction-alert');
    const alertContent = document.getElementById('interaction-alert-content');

    const result = await API.get(`/api/members/${selectedElderlyId}/interactions/unread`);
    if (result.code === 0 && result.data && result.data.length > 0) {
        const alerts = result.data;
        alertBanner.style.display = 'flex';
        alertContent.innerHTML = alerts.map(a => `
            <div style="margin-bottom:0.3rem">
                <span class="risk-label">${escapeHtml(a.risk_level || '警告')}</span>：
                ${escapeHtml(a.description || '检测到药物相互作用风险')}
                ${a.suggestion ? '<br><span style="font-size:0.8rem;color:var(--text-muted)">建议：' + escapeHtml(a.suggestion) + '</span>' : ''}
            </div>
        `).join('');
    } else {
        alertBanner.style.display = 'none';
    }
}

async function markInteractionsRead() {
    if (!selectedElderlyId) return;
    const result = await API.get(`/api/members/${selectedElderlyId}/interactions/unread`);
    if (result.code === 0 && result.data) {
        for (const alert of result.data) {
            await API.post(`/api/members/${selectedElderlyId}/interactions/${alert.id}/read`);
        }
    }
    document.getElementById('interaction-alert').style.display = 'none';
    showToast('已标记为已查看');
}

async function deleteElderlyMedicine(recordId) {
    if (!confirm('确定要从该老人处移除这个药品吗？')) return;
    const result = await API.del(`/api/member-medicines/${recordId}`);
    if (result.code === 0) {
        loadElderlyMedicines();
        showToast('已移除');
    } else {
        showToast(result.msg || '移除失败', 'error');
    }
}

// ========== AI 拍照识别添加药品 ==========
function openAddMedicineModal() {
    const saveBtn = document.querySelector('#add-medicine-modal .btn-primary');
    if (saveBtn) saveBtn.setAttribute('onclick', 'submitAddMedicine()');
    document.getElementById('add-medicine-title').textContent = '为老人添加药品';

    if (!selectedElderlyId) {
        if (elderlyList.length === 0) {
            showToast('请先在家庭管理中将成员设为老人', 'error');
            return;
        }
        if (elderlyList.length === 1) {
            selectedElderlyId = elderlyList[0].id;
        } else {
            showElderlySelectModal();
            return;
        }
    }
    _doOpenAddMedicineModal();
}

function _doOpenAddMedicineModal() {
    document.getElementById('add-medicine-modal').style.display = 'flex';
    loadStorageLocations();
    loadElderlyOptions();
    document.getElementById('med-name').value = '';
    document.getElementById('med-manufacturer').value = '';
    document.getElementById('med-category').value = '其他';
    document.getElementById('med-shelf-life').value = '24';
    document.getElementById('med-prod-date').value = '';
    document.getElementById('med-expiry').value = '';
    document.getElementById('ai-autocomplete-info').style.display = 'none';
    document.getElementById('ai-ocr-result').style.display = 'none';
    document.getElementById('ocr-placeholder').style.display = 'block';
    document.getElementById('ai-recognize-text').innerHTML = '';
    drugInfoCache = null;
    loadCategories();

    const ocrInput = document.getElementById('ocr-image-input');
    ocrInput.onchange = handleOCRImage;
}

function loadElderlyOptions() {
    const sel = document.getElementById('med-elderly-assign');
    if (!sel) return;
    sel.innerHTML = '<option value="">不分配（仅放药箱）</option>' + elderlyList.map(e =>
        `<option value="${e.id}" ${selectedElderlyId === e.id ? 'selected' : ''}>${escapeHtml(e.elderly_name || e.username)}</option>`
    ).join('');
}

function closeAddMedicineModal() {
    document.getElementById('add-medicine-modal').style.display = 'none';
}

async function loadStorageLocations() {
    const result = await API.get('/api/storage-locations');
    if (result.code === 0 && result.data) {
        const sel = document.getElementById('med-storage');
        if (sel) {
            sel.innerHTML = result.data.map(l => `<option value="${escapeHtml(l.name)}">${escapeHtml(l.name)}</option>`).join('');
        }
    }
}

function openStorageManager() {
    let overlay = document.getElementById('storage-manager-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'storage-manager-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem;';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `<div style="background:#fff;border-radius:12px;padding:1.5rem;max-width:500px;width:100%;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,0.2);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                <h3 style="margin:0;font-size:1.1rem;color:#1d1d1f;">📁 管理存储地点</h3>
                <button onclick="document.getElementById('storage-manager-overlay').remove()" style="border:none;background:none;font-size:1.2rem;cursor:pointer;color:#86868b;">&times;</button>
            </div>
            <div style="display:flex;gap:0.5rem;margin-bottom:1rem;">
                <input type="text" id="storage-new-name" placeholder="输入新地点名称" style="flex:1;padding:0.5rem;border:1px solid #e5e5ea;border-radius:8px;font-size:0.9rem;">
                <button onclick="addStorageLocation()" style="padding:0.5rem 1rem;border:none;background:#0071e3;color:#fff;border-radius:8px;font-size:0.9rem;cursor:pointer;">添加</button>
            </div>
            <div id="storage-list" style="flex:1;overflow-y:auto;"></div>
        </div>`;
        document.body.appendChild(overlay);
    }
    renderStorageList();
}

async function renderStorageList() {
    const result = await API.get('/api/storage-locations');
    const list = document.getElementById('storage-list');
    if (!list) return;

    if (result.code !== 0 || !result.data || result.data.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:#86868b;padding:2rem;">暂无存储地点</div>';
        return;
    }

    list.innerHTML = result.data.map(l => `
        <div id="storage-item-${l.id}" style="display:flex;align-items:center;gap:0.8rem;padding:0.7rem;border-bottom:1px solid #f0f0f5;">
            <span id="storage-name-${l.id}" style="flex:1;font-size:0.95rem;color:#1d1d1f;">${escapeHtml(l.name)}</span>
            <input type="text" id="storage-edit-${l.id}" value="${escapeHtml(l.name)}" style="display:none;flex:1;padding:0.3rem;border:1px solid #0071e3;border-radius:4px;font-size:0.85rem;">
            <div>
                <button onclick="editStorageLocation(${l.id})" id="storage-edit-btn-${l.id}" style="border:none;background:none;color:#0071e3;font-size:0.85rem;cursor:pointer;margin-right:0.5rem;">✏ 编辑</button>
                <button onclick="saveStorageLocation(${l.id})" id="storage-save-${l.id}" style="display:none;border:none;background:#0071e3;color:#fff;padding:0.25rem 0.5rem;border-radius:4px;font-size:0.8rem;cursor:pointer;">保存</button>
                <button onclick="deleteStorageLocation(${l.id}, '${escapeHtml(l.name).replace(/'/g,"\\'")}')" id="storage-del-btn-${l.id}" style="border:none;background:none;color:#ff3b30;font-size:0.85rem;cursor:pointer;">🗑 删除</button>
            </div>
        </div>
    `).join('');
}

async function addStorageLocation() {
    const name = document.getElementById('storage-new-name').value.trim();
    if (!name) { showToast('请输入地点名称', 'error'); return; }
    const result = await API.post('/api/storage-locations', { name: name });
    if (result.code === 0) {
        showToast('添加成功');
        document.getElementById('storage-new-name').value = '';
        renderStorageList();
        loadStorageLocations();
    } else {
        showToast(result.msg || '添加失败', 'error');
    }
}

function editStorageLocation(id) {
    const span = document.getElementById(`storage-name-${id}`);
    const input = document.getElementById(`storage-edit-${id}`);
    const editBtn = document.getElementById(`storage-edit-btn-${id}`);
    const saveBtn = document.getElementById(`storage-save-${id}`);
    const delBtn = document.getElementById(`storage-del-btn-${id}`);
    if (span && input) {
        input.style.display = 'flex';
        span.style.display = 'none';
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline';
        delBtn.style.display = 'none';
        input.focus();
        input.select();
    }
}

async function saveStorageLocation(id) {
    const input = document.getElementById(`storage-edit-${id}`);
    const name = input.value.trim();
    if (!name) { showToast('请输入地点名称', 'error'); return; }
    const result = await API.put(`/api/storage-locations/${id}`, { name: name });
    if (result.code === 0) {
        showToast('更新成功');
        renderStorageList();
        loadStorageLocations();
    } else {
        showToast(result.msg || '更新失败', 'error');
    }
}

async function deleteStorageLocation(id, name) {
    if (!confirm(`确定删除「${name}」吗？该地点下的药品将不受影响。`)) return;
    const result = await API.del(`/api/storage-locations/${id}`);
    if (result.code === 0) {
        showToast('删除成功');
        renderStorageList();
        loadStorageLocations();
    } else {
        showToast(result.msg || '删除失败', 'error');
    }
}

async function loadCategories() {
    const catResult = await API.get('/api/categories');
    if (catResult.code === 0) {
        const formCat = document.getElementById('med-category');
        formCat.innerHTML = '<option value="其他">其他</option>';
        const groupOrder = ['内服药品', '外用药品', '其他'];
        const allCategories = catResult.data;
        groupOrder.forEach(group => {
            if (allCategories[group]) {
                allCategories[group].forEach(c => {
                    formCat.innerHTML += `<option value="${c}">${c}</option>`;
                });
            }
        });
    }
}

async function handleOCRImage(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 显示加载状态
    document.getElementById('ocr-placeholder').style.display = 'none';
    document.getElementById('ai-ocr-result').style.display = 'block';
    document.getElementById('ai-ocr-loading').style.display = 'flex';
    document.getElementById('ai-recognize-text').innerHTML = '';

    const formData = new FormData();
    formData.append('image', file);

    const result = await API.postFormData('/api/ai/ocr-recognize', formData);
    document.getElementById('ai-ocr-loading').style.display = 'none';

    if (result.code === 0 && result.data) {
        const data = result.data;
        document.getElementById('ai-recognize-text').innerHTML = `
            <div class="ai-ocr-result-box">
                ${data.name ? `<div class="result-item"><span class="result-label">药品名称</span><span class="result-value">${escapeHtml(data.name)}</span></div>` : ''}
                ${data.manufacturer ? `<div class="result-item"><span class="result-label">厂商</span><span class="result-value">${escapeHtml(data.manufacturer)}</span></div>` : ''}
                ${data.category ? `<div class="result-item"><span class="result-label">分类</span><span class="result-value">${escapeHtml(data.category)}</span></div>` : ''}
                ${data.shelf_life_months ? `<div class="result-item"><span class="result-label">保质期</span><span class="result-value">${data.shelf_life_months}个月</span></div>` : ''}
                ${data.from_cache ? '<div class="result-item"><span class="result-label"></span><span class="result-value" style="color:var(--success)">✅ 来自家庭药品目录</span></div>' : ''}
            </div>
        `;

        // 自动填充表单
        if (data.name) document.getElementById('med-name').value = data.name;
        if (data.manufacturer) document.getElementById('med-manufacturer').value = data.manufacturer;
        if (data.category) document.getElementById('med-category').value = data.category;
        if (data.shelf_life_months) {
            document.getElementById('med-shelf-life').value = data.shelf_life_months;
            autoCalcExpiry();
        }
    } else {
        document.getElementById('ai-recognize-text').innerHTML = '<p style="color:var(--danger);text-align:center">识别失败：' + escapeHtml(result.msg || '请重试') + '</p>';
    }
}

// 药品名称输入时自动补全
document.addEventListener('DOMContentLoaded', () => {
    let debounceTimer;
    const medNameInput = document.getElementById('med-name');
    if (medNameInput) {
        medNameInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            const name = this.value.trim();
            if (name.length < 2) {
                document.getElementById('ai-autocomplete-info').style.display = 'none';
                drugInfoCache = null;
                return;
            }
            debounceTimer = setTimeout(() => fetchDrugInfo(name), 500);
        });
    }
});

async function fetchDrugInfo(name) {
    const result = await API.get(`/api/ai/drug-info?name=${encodeURIComponent(name)}`);
    if (result.code === 0 && result.data) {
        drugInfoCache = result.data;
        const infoDiv = document.getElementById('autocomplete-content');
        const data = result.data;
        infoDiv.innerHTML = `
            ${data.indications ? '<div><strong>适应症：</strong>' + escapeHtml(data.indications) + '</div>' : ''}
            ${data.usage_dosage ? '<div><strong>用法用量：</strong>' + escapeHtml(data.usage_dosage) + '</div>' : ''}
            ${data.adverse_reactions ? '<div><strong>不良反应：</strong>' + escapeHtml(data.adverse_reactions) + '</div>' : ''}
            ${data.storage ? '<div><strong>储存：</strong>' + escapeHtml(data.storage) + '</div>' : ''}
        `;
        if (infoDiv.innerHTML.trim()) {
            document.getElementById('ai-autocomplete-info').style.display = 'block';
        }
    }
}

function fillDrugInfo() {
    if (!drugInfoCache) return;
    // 药物信息已通过autocomplete显示，这里可以额外填充表单
    if (drugInfoCache.category) document.getElementById('med-category').value = drugInfoCache.category;
    showToast('药品信息已填充');
}

async function submitAddMedicine() {
    const name = document.getElementById('med-name').value.trim();
    const manufacturer = document.getElementById('med-manufacturer').value.trim();
    const expiryDate = document.getElementById('med-expiry').value;
    const prodDate = document.getElementById('med-prod-date').value;
    const category = document.getElementById('med-category').value;
    const shelfLife = parseInt(document.getElementById('med-shelf-life').value) || 24;
    const storage = document.getElementById('med-storage').value;
    const packTotal = parseInt(document.getElementById('med-pack-total').value) || 0;
    const unitLabel = document.getElementById('med-unit-label').value;
    const restockThreshold = parseInt(document.getElementById('med-restock-threshold').value) || 7;
    const assignElderlyId = document.getElementById('med-elderly-assign').value;

    if (!name) return showToast('请填写药品名称', 'error');
    if (!expiryDate) return showToast('请选择到期日期', 'error');

    const medResult = await API.post('/api/medicines', {
        name: name,
        manufacturer: manufacturer,
        category: category,
        storage: storage,
        production_date: prodDate,
        expiry_date: expiryDate,
        shelf_life_months: shelfLife,
        pack_total_units: packTotal,
        stock_quantity: packTotal > 0 ? packTotal : 1,
        unit_label: unitLabel,
        restock_threshold_days: restockThreshold
    });

    if (medResult.code !== 0) {
        showToast(medResult.msg || '添加失败', 'error');
        return;
    }

    const medicineId = medResult.id;
    if (!medicineId) {
        showToast('药品已添加，但未返回ID，请刷新查看', 'error');
        return;
    }

    if (assignElderlyId) {
        const assignResult = await API.post(`/api/members/${assignElderlyId}/medicines`, {
            medicine_id: medicineId,
            notes: ''
        });
        if (assignResult.code === 0) {
            showToast('药品添加成功并分配给老人');
        } else {
            showToast('药品已添加但分配失败，请手动分配', 'error');
        }
    } else {
        showToast('药品已添加到家庭药箱');
    }

    closeAddMedicineModal();
    try { await loadElderlyMedicines(); } catch(e) { console.warn('刷新老人药品列表失败:', e); }
    try { loadFamilyCabinet(); } catch(e) { console.warn('刷新家庭药箱失败:', e); }
}

function autoCalcExpiry() {
    const prodDate = document.getElementById('med-prod-date').value;
    const shelfMonths = parseInt(document.getElementById('med-shelf-life').value) || 24;
    if (prodDate) {
        const d = new Date(prodDate);
        d.setMonth(d.getMonth() + shelfMonths);
        document.getElementById('med-expiry').value = d.toISOString().split('T')[0];
    }
}

// ========== 服药提醒设置 ==========
function openReminderModal(memberId, medicineId, medicineName) {
    document.getElementById('reminder-member-id').value = memberId;
    document.getElementById('reminder-medicine-id').value = medicineId;
    document.getElementById('reminder-med-name').textContent = medicineName;
    document.getElementById('reminder-dosage').value = '';
    document.getElementById('reminder-repeat').value = 'daily';

    // 重置时间槽
    const timeSlots = document.getElementById('time-slots');
    timeSlots.innerHTML = `<div class="time-slot">
        <input type="time" class="reminder-time">
        <button class="btn btn-danger btn-sm" onclick="removeTimeSlot(this)">×</button>
    </div>`;

    document.getElementById('reminder-modal').style.display = 'flex';
    loadExistingReminders(memberId);
}

function closeReminderModal() {
    document.getElementById('reminder-modal').style.display = 'none';
}

function addTimeSlot() {
    const timeSlots = document.getElementById('time-slots');
    const slot = document.createElement('div');
    slot.className = 'time-slot';
    slot.innerHTML = '<input type="time" class="reminder-time"><button class="btn btn-danger btn-sm" onclick="removeTimeSlot(this)">×</button>';
    timeSlots.appendChild(slot);
}

function removeTimeSlot(btn) {
    const slot = btn.parentElement;
    if (document.querySelectorAll('.time-slot').length > 1) {
        slot.remove();
    }
}

async function saveReminder() {
    const memberId = document.getElementById('reminder-member-id').value;
    const medicineId = document.getElementById('reminder-medicine-id').value;
    const times = Array.from(document.querySelectorAll('.reminder-time')).map(i => i.value).filter(t => t);
    const repeatType = document.getElementById('reminder-repeat').value;
    const dosage = document.getElementById('reminder-dosage').value.trim();

    if (times.length === 0) return showToast('请选择服药时间', 'error');

    let successCount = 0;
    for (const time of times) {
        const result = await API.post('/api/reminders', {
            member_id: parseInt(memberId),
            medicine_id: parseInt(medicineId),
            remind_time: time,
            repeat_type: repeatType,
            dosage: dosage
        });
        if (result.code === 0) successCount++;
    }

    if (successCount > 0) {
        showToast(`已设置 ${successCount} 个提醒`);
        loadExistingReminders(memberId);
    } else {
        showToast('保存失败', 'error');
    }
}

async function loadExistingReminders(memberId) {
    const result = await API.get(`/api/reminders?member_id=${memberId}`);
    const container = document.getElementById('reminder-list');
    if (result.code === 0 && result.data) {
        const reminders = result.data;
        if (reminders.length === 0) {
            container.innerHTML = '<p style="font-size:0.82rem;color:var(--text-muted)">暂无提醒</p>';
            return;
        }
        container.innerHTML = reminders.map(r => `
            <div class="reminder-list-item">
                <span>🕐 ${r.remind_time} | ${r.repeat_type === 'daily' ? '每天' : r.repeat_type === 'alternate' ? '隔天' : '每周'} | ${escapeHtml(r.dosage || '')}</span>
                <button class="btn btn-danger btn-xs" onclick="deleteReminder(${r.id}, ${memberId})">删除</button>
            </div>
        `).join('');
    }
}

async function deleteReminder(id, memberId) {
    if (!confirm('确定删除此提醒吗？')) return;
    const result = await API.del(`/api/reminders/${id}`);
    if (result.code === 0) {
        showToast('已删除');
        loadExistingReminders(memberId);
    }
}

// ========== 服药报告 ==========
async function loadComplianceReport() {
    if (!selectedElderlyId && elderlyList.length > 0) {
        selectedElderlyId = elderlyList[0].id;
    }
    if (!selectedElderlyId) return;

    const result = await API.get(`/api/members/${selectedElderlyId}/compliance`);
    if (result.code !== 0 || !result.data) return;

    const data = result.data;
    // 后端返回 overall_rate（近30天整体合规率）和 daily_stats
    const overall = data.overall_rate || 0;
    // 本周合规率：取最近7天
    const dailyStats = data.daily_stats || [];
    const weeklyStats = dailyStats.slice(0, 7);
    const weeklyExpected = weeklyStats.reduce((s, r) => s + (r.expected || 0), 0);
    const weeklyDone = weeklyStats.reduce((s, r) => s + (r.done || 0), 0);
    const weekly = weeklyExpected > 0 ? Math.round((weeklyDone / weeklyExpected) * 100) : 0;
    const monthly = Math.round(overall);

    const weeklyEl = document.getElementById('weekly-compliance');
    const monthlyEl = document.getElementById('monthly-compliance');
    weeklyEl.textContent = weekly + '%';
    monthlyEl.textContent = monthly + '%';

    weeklyEl.className = 'compliance-value';
    monthlyEl.className = 'compliance-value';
    if (weekly < 60) weeklyEl.classList.add('low');
    else if (weekly < 80) weeklyEl.classList.add('warning');
    if (monthly < 60) monthlyEl.classList.add('low');
    else if (monthly < 80) monthlyEl.classList.add('warning');

    // 渲染日历热力图（后端字段：done/expected）
    renderCalendarHeatmap(dailyStats);
}

function renderCalendarHeatmap(records) {
    const container = document.getElementById('calendar-heatmap');
    const today = new Date();
    const daysToShow = 35; // 5 weeks

    let html = '';
    for (let i = daysToShow - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayNum = d.getDate();

        const record = records.find(r => r.date === dateStr);
        let cellClass = 'none';
        let tooltip = '无记录';

        if (record) {
            const done = record.done || 0;
            const expected = record.expected || 0;
            if (expected > 0 && done >= expected) {
                cellClass = 'done';
                tooltip = '全部完成';
            } else if (done > 0) {
                cellClass = 'partial';
                tooltip = '部分完成';
            } else if (expected > 0) {
                cellClass = 'missed';
                tooltip = '未服药';
            }
        } else if (d > today) {
            cellClass = 'future';
            tooltip = '未来';
        }

        html += `<div class="heatmap-cell ${cellClass}" title="${dateStr}: ${tooltip}">${dayNum}</div>`;
    }
    container.innerHTML = html;
}

// ========== 知识库管理 ==========
async function loadKnowledgeList() {
    const result = await API.get('/api/knowledge/list');
    const container = document.getElementById('knowledge-list');
    const empty = document.getElementById('knowledge-empty');

    // 加载老人筛选器
    await loadKnowledgeElderlyFilter();

    if (result.code !== 0 || !result.data || result.data.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    const elderlyFilter = document.getElementById('knowledge-elderly-filter').value;
    let items = result.data;
    if (elderlyFilter) {
        items = items.filter(item => item.elderly_id == elderlyFilter);
    }

    if (items.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="knowledge-item">
            <div class="k-header">
                <div class="k-meta">
                    <span>👤 ${escapeHtml(item.elderly_name || '老人')}</span>
                    <span>📅 ${escapeHtml(item.created_at)}</span>
                    <span>🔢 使用 ${item.use_count || 0} 次</span>
                </div>
                <span class="ai-badge">AI知识库</span>
            </div>
            <div class="k-question">❓ ${escapeHtml(item.question_text)}</div>
            <div class="k-answer">💡 ${escapeHtml(item.answer_text || '图文/语音回复')}</div>
            <div class="k-actions">
                <button class="btn btn-outline btn-sm" onclick="editKnowledge(${item.id}, '${escapeHtml(item.question_text)}', '${escapeHtml(item.answer_text || '')}')">编辑</button>
                <button class="btn btn-danger btn-sm" onclick="deleteKnowledge(${item.id})">删除</button>
            </div>
        </div>
    `).join('');
}

async function loadKnowledgeElderlyFilter() {
    const result = await API.get('/api/family/elderly');
    if (result.code === 0 && result.data) {
        const sel = document.getElementById('knowledge-elderly-filter');
        sel.innerHTML = '<option value="">所有老人</option>';
        result.data.forEach(e => {
            sel.innerHTML += `<option value="${e.id}">${escapeHtml(e.elderly_name || e.username)}</option>`;
        });
    }
}

function editKnowledge(id, question, answer) {
    document.getElementById('edit-knowledge-id').value = id;
    document.getElementById('edit-knowledge-question').value = question;
    document.getElementById('edit-knowledge-answer').value = answer;
    document.getElementById('edit-knowledge-modal').style.display = 'flex';
}

function closeEditKnowledgeModal() {
    document.getElementById('edit-knowledge-modal').style.display = 'none';
}

async function saveKnowledgeEdit() {
    const id = document.getElementById('edit-knowledge-id').value;
    const question = document.getElementById('edit-knowledge-question').value.trim();
    const answer = document.getElementById('edit-knowledge-answer').value.trim();

    if (!question || !answer) return showToast('问题和回答不能为空', 'error');

    const result = await API.put(`/api/knowledge/${id}`, {
        question_text: question,
        answer_text: answer
    });

    if (result.code === 0) {
        closeEditKnowledgeModal();
        loadKnowledgeList();
        showToast('已更新');
    } else {
        showToast(result.msg || '更新失败', 'error');
    }
}

async function deleteKnowledge(id) {
    if (!confirm('确定删除此问答记录吗？')) return;
    const result = await API.del(`/api/knowledge/${id}`);
    if (result.code === 0) {
        loadKnowledgeList();
        showToast('已删除');
    }
}

// ========== 待回复问题 ==========
async function loadPendingQuestions() {
    const result = await API.get('/api/knowledge/pending');
    const container = document.getElementById('pending-list');
    const empty = document.getElementById('pending-empty');

    if (result.code !== 0 || !result.data || result.data.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        pendingCount = 0;
        updateSidebarBadge();
        return;
    }

    empty.style.display = 'none';
    const questions = result.data;
    pendingCount = questions.length;
    updateSidebarBadge();

    container.innerHTML = questions.map(q => `
        <div class="pending-item">
            <div class="p-header">
                <div class="p-elderly">👤 ${escapeHtml(q.elderly_name || '老人')} · ${escapeHtml(q.created_at)}</div>
            </div>
            <div class="p-question">${escapeHtml(q.question_text)}</div>
            <div class="p-actions">
                <button class="btn btn-primary btn-sm" onclick="openReplyModal(${q.id}, '${escapeHtml(q.question_text)}')">回复</button>
            </div>
        </div>
    `).join('');
}

// ========== 问题回复面板 ==========
function openReplyModal(questionId, questionText) {
    document.getElementById('reply-question-id').value = questionId;
    document.getElementById('reply-question-text').textContent = questionText;
    document.getElementById('reply-modal').style.display = 'flex';

    // 重置所有回复区域
    setReplyType('text');
    document.getElementById('reply-text').value = '';
    document.getElementById('image-preview').innerHTML = '';
    document.getElementById('audio-preview').style.display = 'none';
    currentReplyImageBlob = null;
    currentReplyAudioBlob = null;
}

function closeReplyModal() {
    document.getElementById('reply-modal').style.display = 'none';
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
}

function setReplyType(type) {
    currentReplyType = type;
    document.getElementById('reply-text-area').style.display = type === 'text' ? 'block' : 'none';
    document.getElementById('reply-voice-area').style.display = type === 'voice' ? 'block' : 'none';
    document.getElementById('reply-image-area').style.display = type === 'image' ? 'block' : 'none';

    // 更新按钮状态
    document.querySelectorAll('.reply-option-buttons .btn').forEach(b => b.classList.remove('active'));
    const btnIndex = { text: 0, voice: 1, image: 2 };
    const btns = document.querySelectorAll('.reply-option-buttons .btn');
    if (btns[btnIndex[type]]) btns[btnIndex[type]].classList.add('active');
}

// 语音录制
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            currentReplyAudioBlob = audioBlob;
            const audioUrl = URL.createObjectURL(audioBlob);
            const audioPreview = document.getElementById('audio-preview');
            audioPreview.src = audioUrl;
            audioPreview.style.display = 'block';

            document.getElementById('recording-text').textContent = '录音完成';
            document.getElementById('recording-text').classList.remove('recording-active');
            document.querySelector('.recording-status .pulse-dot').style.display = 'none';
            document.getElementById('btn-start-record').disabled = false;
            document.getElementById('btn-stop-record').disabled = true;
        };

        mediaRecorder.start();
        document.getElementById('btn-start-record').disabled = true;
        document.getElementById('btn-stop-record').disabled = false;
        document.getElementById('recording-text').textContent = '正在录音...';
        document.getElementById('recording-text').classList.add('recording-active');
        document.querySelector('.recording-status .pulse-dot').style.display = 'inline-block';
    } catch (err) {
        console.error('录音失败:', err);
        showToast('录音功能不可用，请使用文字回复', 'error');
        setReplyType('text');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
}

// 拍照上传
document.addEventListener('DOMContentLoaded', () => {
    const replyImageInput = document.getElementById('reply-image-input');
    if (replyImageInput) {
        replyImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            currentReplyImageBlob = file;
            const reader = new FileReader();
            reader.onload = function(ev) {
                document.getElementById('image-preview').innerHTML = `<img src="${ev.target.result}" alt="预览">`;
            };
            reader.readAsDataURL(file);
        });
    }
});

async function submitReply() {
    const questionId = document.getElementById('reply-question-id').value;
    const formData = new FormData();
    formData.append('question_id', questionId);

    if (currentReplyType === 'text') {
        const text = document.getElementById('reply-text').value.trim();
        if (!text) return showToast('请输入回复内容', 'error');
        formData.append('answer_text', text);
        formData.append('answer_type', 'text');
    } else if (currentReplyType === 'voice') {
        if (!currentReplyAudioBlob) return showToast('请先录制语音', 'error');
        formData.append('audio', currentReplyAudioBlob, 'recording.webm');
        formData.append('answer_type', 'voice');
    } else if (currentReplyType === 'image') {
        if (!currentReplyImageBlob) return showToast('请先上传图片', 'error');
        formData.append('image', currentReplyImageBlob);
        formData.append('answer_type', 'image');
    }

    const result = await API.postFormData('/api/knowledge/reply', formData);
    if (result.code === 0) {
        closeReplyModal();
        loadPendingQuestions();
        showToast('回复已发送');
    } else {
        showToast(result.msg || '回复失败', 'error');
    }
}

// ========== 家庭管理 ==========
async function loadFamily() {
    const result = await API.get('/api/family/members');
    if (result.code !== 0) return;
    const { family, members } = result.data;
    document.getElementById('family-name-display').textContent = family.name;
    document.getElementById('family-code-display').textContent = family.invite_code || family.code || '------';

    // 渲染成员列表（带管理按钮）
    document.getElementById('members-list').innerHTML = members.map(m => {
        let roleLabel = '成员';
        let roleClass = 'member';
        if (m.role === 'admin') { roleLabel = '管理员'; roleClass = 'admin'; }
        else if (m.is_elderly) { roleLabel = '老人'; roleClass = 'elderly'; }

        let actionBtns = '';
        if (m.role !== 'admin') {
            if (m.is_elderly) {
                actionBtns = `<button class="btn btn-outline btn-xs" onclick="toggleElderlyStatus(${m.id}, false, '${escapeHtml(m.username)}')">取消老人</button>`;
            } else {
                actionBtns = `<button class="btn btn-outline btn-xs" onclick="toggleElderlyStatus(${m.id}, true, '${escapeHtml(m.username)}')">设为老人</button>`;
            }
            actionBtns += ` <button class="btn btn-danger btn-xs" onclick="deleteFamilyMember(${m.id}, '${escapeHtml(m.username)}')">删除</button>`;
        }

        return `<div class="member-item">
            <span class="member-avatar">${m.username[0]}</span>
            <span style="flex:1;font-weight:600">${escapeHtml(m.username)}${m.elderly_name ? ' (' + escapeHtml(m.elderly_name) + ')' : ''}</span>
            <span class="member-role ${roleClass}">${roleLabel}</span>
            <span class="member-actions">${actionBtns}</span>
        </div>`;
    }).join('');

    // 更新 elderlyList
    elderlyList = members.filter(m => m.is_elderly);
    
    // 加载邀请申请列表
    loadInvitations();
}

// ========== 家庭管理 - 设为/取消老人 ==========
async function toggleElderlyStatus(uid, makeElderly, username) {
    if (makeElderly) {
        const name = prompt('请输入老人称呼（如：爸爸、妈妈）：', username);
        if (!name) return;
        const result = await API.post('/api/family/elderly/add', { user_id: uid, elderly_name: name.trim() });
        if (result.code === 0) { showToast(result.msg); loadFamily(); loadDashboard(); }
        else showToast(result.msg, 'error');
    } else {
        if (!confirm(`确定取消 ${username} 的老人身份吗？`)) return;
        const result = await API.post(`/api/family/elderly/${uid}/remove`);
        if (result.code === 0) { showToast(result.msg); loadFamily(); loadDashboard(); }
        else showToast(result.msg, 'error');
    }
}

// ========== 家庭管理 - 删除成员 ==========
async function deleteFamilyMember(uid, username) {
    if (!confirm(`确定要删除成员 "${username}" 吗？此操作不可恢复！`)) return;
    const result = await API.del(`/api/family/members/${uid}`);
    if (result.code === 0) { showToast(result.msg); loadFamily(); loadDashboard(); }
    else showToast(result.msg, 'error');
}

// ========== 家庭管理 - 编辑家庭名称 ==========
function editFamilyName() {
    const current = document.getElementById('family-name-display').textContent;
    const newName = prompt('请输入新的家庭名称：', current);
    if (!newName || newName.trim() === current) return;
    API.put('/api/family/name', { name: newName.trim() }).then(r => {
        if (r.code === 0) { showToast(r.msg); loadFamily(); }
        else showToast(r.msg, 'error');
    });
}

function copyInviteCode() {
    const code = document.getElementById('family-code-display').textContent;
    navigator.clipboard.writeText(code).then(() => showToast('邀请码已复制'));
}

async function loadInvitations() {
    const result = await API.get('/api/family/invitation/list');
    if (result.code !== 0 || !result.data) return;
    
    const invitations = result.data;
    const pendingCount = invitations.filter(i => i.status === 'pending').length;
    const countEl = document.getElementById('invitation-count');
    if (countEl) {
        countEl.textContent = pendingCount > 0 ? `(${pendingCount} 待处理)` : '';
    }
    
    const list = document.getElementById('invitations-list');
    if (!list) return;
    
    if (invitations.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:#86868b;padding:2rem;">暂无加入申请</div>';
        return;
    }
    
    list.innerHTML = invitations.map(i => {
        const statusLabel = i.status === 'pending' ? '待审批' : (i.status === 'approved' ? '已通过' : '已拒绝');
        const statusClass = i.status === 'pending' ? 'invite-pending' : (i.status === 'approved' ? 'invite-approved' : 'invite-rejected');
        const actions = i.status === 'pending' 
            ? `<button class="btn btn-primary btn-xs" onclick="approveInvitation(${i.id})">✅ 通过</button>
               <button class="btn btn-danger btn-xs" onclick="rejectInvitation(${i.id})">❌ 拒绝</button>`
            : '';
        return `<div class="invitation-item">
            <div style="flex:1;">
                <div style="font-weight:600;">${escapeHtml(i.applicant_username)}</div>
                <div style="font-size:0.8rem;color:#86868b;">申请时间：${escapeHtml(i.created_at)}</div>
            </div>
            <div>
                <span class="invite-status ${statusClass}">${statusLabel}</span>
            </div>
            <div>${actions}</div>
        </div>`;
    }).join('');
}

async function approveInvitation(id) {
    const result = await API.post(`/api/family/invitation/${id}/approve`);
    if (result.code === 0) {
        showToast(result.msg);
        loadInvitations();
        loadFamily();
    } else {
        showToast(result.msg || '审批失败', 'error');
    }
}

async function rejectInvitation(id) {
    if (!confirm('确定拒绝此申请吗？')) return;
    const result = await API.post(`/api/family/invitation/${id}/reject`);
    if (result.code === 0) {
        showToast(result.msg);
        loadInvitations();
    } else {
        showToast(result.msg || '操作失败', 'error');
    }
}

// ========== 老人选择弹窗（强制选择） ==========
function showElderlySelectModal() {
    const content = document.getElementById('select-elderly-list');
    content.innerHTML = elderlyList.map(e => `
        <div class="select-elderly-item" onclick="selectElderlyAndProceed(${e.id}, '${escapeHtml(e.elderly_name || e.username)}')">
            <span class="member-avatar">${(e.elderly_name || e.username)[0]}</span>
            <span style="flex:1;font-weight:600">${escapeHtml(e.elderly_name || e.username)}</span>
            <span>→</span>
        </div>
    `).join('');
    document.getElementById('select-elderly-modal').style.display = 'flex';
}

function selectElderlyAndProceed(uid, name) {
    selectedElderlyId = uid;
    document.getElementById('select-elderly-modal').style.display = 'none';
    _doOpenAddMedicineModal();
}

function closeElderlySelectModal() {
    document.getElementById('select-elderly-modal').style.display = 'none';
}

// ========== 帮助引导 ==========
function showHelp(page) {
    const tips = {
        'dashboard': '<h4>仪表盘使用指南</h4><p>点击任一老人卡片进入该老人的药品管理页面，查看服药进度和打卡状态。</p><p>环形图显示今日服药完成率，颜色从灰→橙→绿表示进度。</p>',
        'medicine': '<h4>药品管理指南</h4><p>上方可切换不同老人。点击"+添加药品"通过AI拍照录入药品。</p><p>每款药品可设置服药提醒（支持多时段），系统会自动检测药物相互作用。</p>',
        'report': '<h4>服药报告指南</h4><p>查看老人的服药合规率统计。热力图中绿色表示全部完成，黄色表示部分完成，红色表示未服药。</p>',
        'knowledge': '<h4>知识库管理指南</h4><p>查看所有老人问答记录。点击编辑可修改问题和回答内容。</p><p>筛选器可按老人过滤记录。</p>',
        'pending': '<h4>待回复问题指南</h4><p>老人通过语音或文字提问后显示在此。支持文字、语音录音、拍照三种回复方式。</p>',
        'family': '<h4>家庭管理指南</h4><p>每位成员可设为"老人"角色，系统会自动为其创建服药管理功能。</p><p>邀请码可分享给家人加入同一家庭药箱。</p>'
    };
    showToast(tips[page] || '', 'success');
    // 长文本用模态框展示
    if (tips[page]) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `<div class="modal">
            <div class="help-content">${tips[page]}</div>
            <div class="form-actions"><button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">知道了</button></div>
        </div>`;
        modal.addEventListener('click', function(e) { if (e.target === this) this.remove(); });
        document.body.appendChild(modal);
    }
}

// ========== 定时轮询 ==========
function startPolling() {
    pollingInterval = setInterval(async () => {
        // 检查待回复问题
        const pendingResult = await API.get('/api/knowledge/pending');
        if (pendingResult.code === 0 && pendingResult.data) {
            const newCount = pendingResult.data.length;
            if (newCount !== pendingCount) {
                // 仅在非首次加载且数量增加时触发通知
                if (lastPendingCount >= 0 && newCount > lastPendingCount) {
                    const delta = newCount - lastPendingCount;
                    showAdminNotification('新提问待回复', `有 ${delta} 条新的老人提问等待你的回复`);
                }
                pendingCount = newCount;
                lastPendingCount = newCount;
                updateSidebarBadge();
                if (currentPage === 'pending') loadPendingQuestions();
            }
        }

        // 检查未读冲突告警总数（遍历老人列表聚合）
        if (elderlyList && elderlyList.length > 0) {
            let totalAlerts = 0;
            for (const e of elderlyList) {
                const eid = e.id || e.member_id;
                if (!eid) continue;
                try {
                    const r = await API.get(`/api/members/${eid}/interactions/unread`);
                    if (r.code === 0 && r.data) {
                        totalAlerts += Array.isArray(r.data) ? r.data.length : (r.data.count || 0);
                    }
                } catch(err) {}
            }
            if (lastAlertCount >= 0 && totalAlerts > lastAlertCount) {
                const delta = totalAlerts - lastAlertCount;
                showAdminNotification('药物冲突告警', `检测到 ${delta} 条新的药物相互作用告警，请及时处理`);
            }
            lastAlertCount = totalAlerts;
        }

        // 检查未读语音明信片
        try {
            const pcResult = await API.get('/api/voice-postcards/unread-count');
            if (pcResult.code === 0 && pcResult.data) {
                const pcCount = pcResult.data.count || 0;
                updatePostcardBadge();
                // 新明信片通知（首次加载不触发）
                if (typeof window._lastPostcardCount === 'undefined') {
                    window._lastPostcardCount = pcCount;
                } else if (pcCount > window._lastPostcardCount) {
                    const delta = pcCount - window._lastPostcardCount;
                    showAdminNotification('新的语音明信片', `收到 ${delta} 条老人留言，点击「语音明信片」收听`);
                }
                window._lastPostcardCount = pcCount;
            }
        } catch(err) {}

        // 如果当前是仪表盘，刷新数据
        if (currentPage === 'dashboard') {
            loadDashboard();
        }
    }, 30000); // 30秒轮询
}

// 管理员端浏览器通知
function showAdminNotification(title, body) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        const n = new Notification(title, {
            body: body,
            icon: '/icons/icon.svg',
            tag: 'admin-alert',
        });
        setTimeout(() => n.close(), 10000);
    } else if (Notification.permission === 'default') {
        // 首次需要用户授权，延迟请求
        Notification.requestPermission().then(perm => {
            if (perm === 'granted') showAdminNotification(title, body);
        });
    }
}

function requestAdminNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// ========== 初始化 ==========
async function init() {
    const authed = await checkAuth();
    if (!authed) return;

    buildSidebar();

    // 账户信息统一显示在右上角顶部操作栏（左下角不再显示）
    const topUser = document.getElementById('top-username');
    const topAvatar = document.getElementById('top-avatar');
    if (topUser) topUser.textContent = currentUser.username;
    if (topAvatar) topAvatar.textContent = currentUser.username[0].toUpperCase();

    // 加载数据
    await loadDashboard();
    await loadFamily();
    // 阶段4：建立 SSE 实时同步监听
    setupSSECabinetSync();
    // 检测 AI 服务状态
    checkAIServiceStatus();

    // 首次用户交互时请求通知权限（浏览器策略要求用户手势触发）
    document.addEventListener('click', function requestOnce() {
        requestAdminNotificationPermission();
        document.removeEventListener('click', requestOnce);
    }, { once: true });

    // 事件绑定
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page) switchPage(page);
        });
    });

    // 模态框关闭事件
    const modals = ['add-medicine-modal', 'reminder-modal', 'reply-modal', 'edit-knowledge-modal', 'form-modal', 'detail-modal', 'assign-modal', 'select-elderly-modal'];
    modals.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.style.display = 'none';
                }
            });
        }
    });

    // ESC 关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            modals.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
        }
    });

    // 开始轮询
    startPolling();
}

init();