// ========== 普通成员端 - 核心逻辑 ==========

// 全局状态
let currentUser = null;
let currentPage = 'medicines';
let allMedicines = [];
let allCategories = [];
let pollingInterval = null;
let alertPollingInterval = null;        // 迭代4 P0：异常告警轮询
let currentAlertList = [];              // 迭代4 P0：当前告警列表缓存

// ========== API 封装 ==========
const API = {
    async get(url) {
        const res = await fetch(url);
        if (res.status === 401) { window.location.href = '/login.html'; return {code:401}; }
        if (res.status === 403) { try { const d = await res.json(); return {code:403, msg: d.msg || '权限不足，该操作仅管理员可执行'}; } catch(e) { return {code:403, msg:'权限不足，该操作仅管理员可执行'}; } }
        return res.json();
    },
    async post(url, data) {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.status === 401) { window.location.href = '/login.html'; return {code:401}; }
        if (res.status === 403) { try { const d = await res.json(); return {code:403, msg: d.msg || '权限不足，该操作仅管理员可执行'}; } catch(e) { return {code:403, msg:'权限不足，该操作仅管理员可执行'}; } }
        return res.json();
    },
    async del(url) {
        const res = await fetch(url, { method: 'DELETE' });
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
    async postFormData(url, formData) {
        const res = await fetch(url, { method: 'POST', body: formData });
        if (res.status === 401) { window.location.href = '/login.html'; return {code:401}; }
        if (res.status === 403) { try { const d = await res.json(); return {code:403, msg: d.msg || '权限不足'}; } catch(e) { return {code:403, msg:'权限不足'}; } }
        return res.json();
    }
};

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div'); div.textContent = str; return div.innerHTML;
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
    if (typeof loadMedicines === 'function') loadMedicines();
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
    _cabinetSyncLastTs = 0;
    if (typeof loadMedicines === 'function') loadMedicines();
    showToast('已刷新');
}

function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// ========== 认证与路由 ==========
async function checkAuth() {
    const result = await API.get('/api/auth/me');
    if (result.code === 0 && result.data) {
        currentUser = result.data;
        currentUser.id = currentUser.user_id;
        sessionStorage.setItem('user_id', currentUser.id);
        sessionStorage.setItem('family_id', currentUser.family_id);
        sessionStorage.setItem('role_type', currentUser.role_type || 'member');

        if (currentUser.role_type === 'admin') {
            window.location.href = '/';
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

// ========== 页面切换 ==========
function switchPage(page) {
    currentPage = page;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));

    document.getElementById('view-' + page).classList.add('active');
    document.querySelector(`.sidebar-nav a[data-page="${page}"]`).classList.add('active');

    if (page === 'medicines') loadMedicines();
    if (page === 'family') loadFamily();
    if (page === 'videos') loadMedicationVideos();
    if (page === 'postcards') loadVoicePostcards();
}

// ========== 家庭药箱看板（与 admin 端一致） ==========
let cabinetMedicines = [];
async function loadMedicines() {
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

function renderCabinetCards() {
    const container = document.getElementById('cabinet-grid');
    const empty = document.getElementById('cabinet-empty');
    if (!container) return;
    const searchTerm = (document.getElementById('cabinet-search').value || '').trim().toLowerCase();
    const categoryFilter = document.getElementById('cabinet-category-filter').value;

    let filtered = cabinetMedicines.filter(m => m.status === 'active');
    if (searchTerm) filtered = filtered.filter(m => (m.name||'').toLowerCase().includes(searchTerm) || (m.manufacturer||'').toLowerCase().includes(searchTerm));
    if (categoryFilter) filtered = filtered.filter(m => m.category === categoryFilter);

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

// 家庭药箱：库存调整
// 需求4：卡片折叠/展开切换
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

// 家庭药箱：删除药品（仅缺货时显示删除按钮）
async function deleteCabinetMedicine(medIdsStr, medName) {
    if (!confirm(`确定删除「${medName}」吗？此操作不可撤销。`)) return;
    const result = await API.post('/api/medicines/batch-delete', { ids: medIdsStr });
    if (result.code === 0) { showToast('已删除'); loadMedicines(); }
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
    if (result.code === 0) { showToast('已保存'); closeCabinetEditModal(); loadMedicines(); }
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
        loadMedicines();
    } else showToast(result.msg || '上传失败', 'error');
}

// ========== 健康罗盘（迭代4创新：5维雷达画像）==========
async function loadCompass() {
    const result = await API.get('/api/family/compass');
    const container = document.getElementById('compass-container');
    if (result.code !== 0 || !result.data) {
        container.innerHTML = '';
        return;
    }
    renderCompass(result.data, container);
}

function renderCompass(data, container) {
    const axes = data.axes || {};
    const overall = data.overall || 0;
    const insight = data.insight || '';
    // 5维标签映射
    const axisLabels = {
        adherence: '依从性',
        inventory: '库存',
        safety: '安全',
        engagement: '参与',
        connection: '联结'
    };
    const axisKeys = ['adherence', 'inventory', 'safety', 'engagement', 'connection'];

    // SVG 雷达图参数
    const size = 200;
    const cx = size / 2, cy = size / 2;
    const r = 75;
    // 5个轴角度（从顶部开始，顺时针）
    const angles = axisKeys.map((_, i) => (-90 + i * 72) * Math.PI / 180);

    // 背景网格（20/40/60/80/100 同心五边形）
    let gridSvg = '';
    for (let level = 20; level <= 100; level += 20) {
        const pts = angles.map(a => {
            const x = cx + (r * level / 100) * Math.cos(a);
            const y = cy + (r * level / 100) * Math.sin(a);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');
        gridSvg += `<polygon points="${pts}" fill="none" stroke="#e5e5ea" stroke-width="1"/>`;
    }
    // 轴线
    let axisLines = '';
    angles.forEach(a => {
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        axisLines += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e5e5ea" stroke-width="1"/>`;
    });
    // 数据多边形
    const dataPts = axisKeys.map((k, i) => {
        const v = Math.max(0, Math.min(100, axes[k] || 0));
        const x = cx + (r * v / 100) * Math.cos(angles[i]);
        const y = cy + (r * v / 100) * Math.sin(angles[i]);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    // 数据点
    const dots = axisKeys.map((k, i) => {
        const v = Math.max(0, Math.min(100, axes[k] || 0));
        const x = cx + (r * v / 100) * Math.cos(angles[i]);
        const y = cy + (r * v / 100) * Math.sin(angles[i]);
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#0071e3"/>`;
    }).join('');
    // 轴标签
    const labels = axisKeys.map((k, i) => {
        const x = cx + (r + 14) * Math.cos(angles[i]);
        const y = cy + (r + 14) * Math.sin(angles[i]);
        return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#86868b">${axisLabels[k]}</text>`;
    }).join('');

    // 综合分颜色
    let overallColor = '#34c759';
    if (overall < 60) overallColor = '#ff3b30';
    else if (overall < 80) overallColor = '#ff9500';

    const chipsHtml = axisKeys.map(k => {
        const v = axes[k] || 0;
        let chipColor = '#34c759';
        if (v < 60) chipColor = '#ff3b30';
        else if (v < 80) chipColor = '#ff9500';
        return `<span class="compass-axis-chip">${axisLabels[k]} <span class="axis-val" style="color:${chipColor}">${v}</span></span>`;
    }).join('');

    container.innerHTML = `
        <div class="compass-card">
            <div class="compass-radar">
                <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                    ${gridSvg}
                    ${axisLines}
                    <polygon points="${dataPts}" fill="rgba(0,113,227,0.15)" stroke="#0071e3" stroke-width="2"/>
                    ${dots}
                    ${labels}
                    <text x="${cx}" y="${cy-4}" text-anchor="middle" font-size="22" font-weight="800" fill="${overallColor}">${overall}</text>
                    <text x="${cx}" y="${cy+12}" text-anchor="middle" font-size="9" fill="#86868b">综合分</text>
                </svg>
            </div>
            <div class="compass-info">
                <div class="compass-overall" style="color:${overallColor}">${overall}<span style="font-size:1rem;color:#86868b;font-weight:600;"> / 100</span></div>
                <div class="compass-overall-label">家庭健康综合评分</div>
                <div class="compass-insight">💡 ${escapeHtml(insight)}</div>
                <div class="compass-axes">${chipsHtml}</div>
            </div>
        </div>`;
}

// ========== 库存补货清单（迭代4：库存心跳预警）==========
async function loadRestockList() {
    const result = await API.get('/api/inventory/restock-list');
    const banner = document.getElementById('restock-banner');
    const list = document.getElementById('restock-list');
    const countEl = document.getElementById('restock-count');
    if (result.code !== 0 || !result.data || result.data.length === 0) {
        banner.style.display = 'none';
        return;
    }
    const items = result.data;
    // 仅展示 pulse/depleted 状态（紧急补货）
    const urgent = items.filter(i => i.status === 'pulse' || i.status === 'depleted');
    if (urgent.length === 0) {
        banner.style.display = 'none';
        return;
    }
    countEl.textContent = urgent.length;
    list.innerHTML = urgent.map(i => {
        const daysText = i.days_left !== null && i.days_left !== undefined
            ? (i.days_left <= 0 ? '已断药' : `约 ${i.days_left} 天后用完`)
            : '消耗数据不足';
        return `<div class="restock-item ${i.status}">
            <div class="restock-item-name">${escapeHtml(i.name)}</div>
            <div class="restock-item-info">
                <span>剩余 ${i.remaining_units}${escapeHtml(i.unit_label || '片')}</span>
                <span class="restock-item-days">${daysText}</span>
                <span>建议补 ${i.suggest_buy}${escapeHtml(i.unit_label || '片')}</span>
            </div>
        </div>`;
    }).join('');
    banner.style.display = 'block';
}

function updateStats() {
    const active = allMedicines.filter(m => m.status === 'active');
    const near = active.filter(m => m.days_left !== null && m.days_left >= 0 && m.days_left <= 30);
    const expired = active.filter(m => m.days_left !== null && m.days_left < 0);

    document.getElementById('stat-total').textContent = active.length;
    document.getElementById('stat-near').textContent = near.length;
    document.getElementById('stat-expired').textContent = expired.length;
}

function checkExpiring() {
    const active = allMedicines.filter(m => m.status === 'active');
    const near = active.filter(m => m.days_left !== null && m.days_left >= 0 && m.days_left <= 30);

    const banner = document.getElementById('expiring-banner');
    const content = document.getElementById('expiring-banner-content');

    if (near.length > 0) {
        banner.style.display = 'flex';
        const names = near.slice(0, 3).map(m => escapeHtml(m.name)).join('、');
        content.innerHTML = `<strong>${near.length}</strong> 个药品即将过期，请提醒管理员处理：${names}${near.length > 3 ? '等' : ''}`;
    } else {
        banner.style.display = 'none';
    }
}

function renderMedicines() {
    const container = document.getElementById('medicine-grid');
    const empty = document.getElementById('medicine-empty');
    const searchTerm = document.getElementById('search-input').value.trim().toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;

    let filtered = allMedicines.filter(m => m.status === 'active');
    if (searchTerm) {
        filtered = filtered.filter(m => m.name.toLowerCase().includes(searchTerm) || (m.manufacturer && m.manufacturer.toLowerCase().includes(searchTerm)));
    }
    if (categoryFilter) {
        filtered = filtered.filter(m => m.category === categoryFilter);
    }

    if (filtered.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    container.innerHTML = filtered.map(m => {
        const days = m.days_left;
        let cardClass = 'safe';
        let statusHtml = '';
        if (days !== null && days < 0) {
            cardClass = 'expired';
            statusHtml = '<span class="badge-expired">已过期</span>';
        } else if (days !== null && days <= 30) {
            cardClass = 'warning';
            statusHtml = '<span class="badge-warning">剩 ' + days + ' 天</span>';
        } else {
            statusHtml = '<span class="badge-safe">' + (days !== null ? '剩 ' + days + ' 天' : '--') + '</span>';
        }

        // 库存心跳展示（迭代4：库存预警 + 心跳引擎）
        let stockHtml = '';
        const stockQty = parseFloat(m.stock_quantity || 0);
        const packTotal = parseInt(m.pack_total_units || 0);
        if (packTotal > 0 || stockQty > 0) {
            const pct = packTotal > 0 ? Math.max(0, Math.min(100, (stockQty / packTotal) * 100)) : 100;
            let stockClass = 'stock-ample';
            if (pct < 20) stockClass = 'stock-pulse';
            else if (pct < 50) stockClass = 'stock-watch';
            stockHtml = `<div class="card-stock ${stockClass}" title="当前库存">
                <span class="stock-dot"></span>库存 ${stockQty}${escapeHtml(m.unit_label || '片')} / ${packTotal || '--'}
                <div class="stock-bar"><div class="stock-bar-fill" style="width:${pct}%"></div></div>
            </div>`;
        }

        return `<div class="member-medicine-card ${cardClass}">
            <div class="card-header">
                <span class="card-name">${escapeHtml(m.name)}</span>
                ${statusHtml}
            </div>
            <div class="card-meta">
                ${m.manufacturer ? '<span>🏭 ' + escapeHtml(m.manufacturer) + '</span>' : ''}
                <span>📂 ${escapeHtml(m.category)}</span>
                <span>📅 ${m.expiry_date}</span>
            </div>
            ${m.storage ? `<div class="card-location">📍 ${escapeHtml(m.storage)}</div>` : ''}
            ${m.usage_dosage ? `<div class="card-usage">💡 ${escapeHtml(m.usage_dosage)}</div>` : ''}
            ${stockHtml}
            <div class="card-actions">
                <button class="btn-detail" onclick="showMedicineDetail(${m.id})">📄 查看说明书</button>
                <button class="btn-detail" onclick="deleteFamilyMedicine(${m.id}, '${escapeHtml(m.name).replace(/'/g, "\\'")}')" style="color:var(--danger)">🗑 删除</button>
            </div>
        </div>`;
    }).join('');
}

// ========== 家庭药箱：添加/删除药品（admin 和 member 均可操作） ==========
function openMemberAddMedicineModal() {
    const modal = document.getElementById('member-add-medicine-modal');
    if (!modal) return;
    document.getElementById('m-med-name').value = '';
    document.getElementById('m-med-manufacturer').value = '';
    document.getElementById('m-med-category').value = '其他';
    document.getElementById('m-med-shelf-life').value = '24';
    document.getElementById('m-med-prod-date').value = '';
    document.getElementById('m-med-expiry').value = '';
    document.getElementById('m-med-pack-total').value = '1';
    document.getElementById('m-med-unit').value = '片';
    document.getElementById('m-med-restock-threshold').value = '7';
    loadStorageLocations();
    modal.style.display = 'flex';
}

function closeMemberAddMedicineModal() {
    document.getElementById('member-add-medicine-modal').style.display = 'none';
}

function memberAutoCalcExpiry() {
    const prodDate = document.getElementById('m-med-prod-date').value;
    const shelfMonths = parseInt(document.getElementById('m-med-shelf-life').value) || 24;
    if (prodDate) {
        const d = new Date(prodDate);
        d.setMonth(d.getMonth() + shelfMonths);
        document.getElementById('m-med-expiry').value = d.toISOString().split('T')[0];
    }
}

async function submitMemberAddMedicine() {
    const name = document.getElementById('m-med-name').value.trim();
    const manufacturer = document.getElementById('m-med-manufacturer').value.trim();
    const category = document.getElementById('m-med-category').value;
    const shelfLife = parseInt(document.getElementById('m-med-shelf-life').value) || 24;
    const prodDate = document.getElementById('m-med-prod-date').value;
    const expiryDate = document.getElementById('m-med-expiry').value;
    const storage = document.getElementById('m-med-storage').value;
    const packTotal = parseInt(document.getElementById('m-med-pack-total').value) || 0;
    const unit = document.getElementById('m-med-unit').value;
    const restockThreshold = parseInt(document.getElementById('m-med-restock-threshold').value) || 7;

    if (!name) return showToast('请填写药品名称', 'error');
    if (!expiryDate) return showToast('请选择到期日期', 'error');

    const result = await API.post('/api/medicines', {
        name: name,
        manufacturer: manufacturer,
        category: category,
        storage: storage,
        production_date: prodDate,
        expiry_date: expiryDate,
        shelf_life_months: shelfLife,
        pack_total_units: packTotal,
        stock_quantity: packTotal > 0 ? packTotal : 1,
        unit_label: unit,
        restock_threshold_days: restockThreshold
    });

    if (result.code === 0) {
        showToast('药品已添加到家庭药箱');
        closeMemberAddMedicineModal();
        await loadMedicines();
    } else {
        showToast(result.msg || '添加失败', 'error');
    }
}

async function deleteFamilyMedicine(medId, medName) {
    if (!confirm(`确认从家庭药箱删除「${medName}」？\n该操作会移除所有老人的此药品分配。`)) return;
    const result = await API.del(`/api/medicines/${medId}`);
    if (result.code === 0) {
        showToast('已删除');
        await loadMedicines();
    } else {
        showToast(result.msg || '删除失败', 'error');
    }
}

// ========== 存储地点管理 ==========
async function loadStorageLocations() {
    const result = await API.get('/api/storage-locations');
    if (result.code === 0 && result.data) {
        const sel = document.getElementById('med-storage') || document.getElementById('m-med-storage');
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

// ========== 药品说明书详情（迭代4：spec 兑现"查看说明书"）==========
async function showMedicineDetail(mid) {
    const result = await API.get(`/api/medicines/${mid}`);
    if (result.code !== 0 || !result.data) {
        showToast('获取药品详情失败', 'error');
        return;
    }
    const m = result.data;
    const sections = [
        { label: '适应症', value: m.indications },
        { label: '用法用量', value: m.usage_dosage },
        { label: '不良反应', value: m.adverse_reactions },
        { label: '禁忌', value: m.contraindications },
        { label: '贮藏', value: m.storage },
        { label: '批准文号', value: m.approval_number },
        { label: '生产日期', value: m.production_date },
        { label: '有效期至', value: m.expiry_date },
    ].filter(s => s.value);

    const stockQty = parseFloat(m.stock_quantity || 0);
    const packTotal = parseInt(m.pack_total_units || 0);

    const html = `
        <div class="modal-overlay" id="medicine-detail-modal" onclick="if(event.target.id==='medicine-detail-modal')this.remove()">
            <div class="modal-box">
                <div class="modal-header">
                    <h2>${escapeHtml(m.name)}</h2>
                    <button class="modal-close" onclick="document.getElementById('medicine-detail-modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="modal-meta">
                        ${m.manufacturer ? '<span>🏭 ' + escapeHtml(m.manufacturer) + '</span>' : ''}
                        <span>📂 ${escapeHtml(m.category)}</span>
                        ${packTotal > 0 ? `<span>📦 ${stockQty}/${packTotal} ${escapeHtml(m.unit_label || '片')}</span>` : ''}
                    </div>
                    ${sections.length ? sections.map(s => `
                        <div class="modal-section">
                            <div class="modal-section-title">${s.label}</div>
                            <div class="modal-section-content">${escapeHtml(s.value)}</div>
                        </div>
                    `).join('') : '<div class="modal-empty">暂无详细说明书信息</div>'}
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function filterMedicines() {
    renderMedicines();
}

// ========== 老人服药状态 ==========
async function loadElderlyStatus() {
    const grid = document.getElementById('elderly-status-grid');
    const empty = document.getElementById('elderly-empty');

    const result = await API.get('/api/family/elderly');
    if (result.code !== 0 || !result.data || result.data.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    const elderlyList = result.data;

    // 为每个老人加载打卡状态
    let html = '';
    for (const elderly of elderlyList) {
        const statusResult = await API.get(`/api/checkin/status/${elderly.id}`);
        let completed = 0, total = 0, statusClass = 'all-done', statusText = '全部完成';

        if (statusResult.code === 0 && statusResult.data) {
            // 后端返回 checked_today / total_reminders
            completed = statusResult.data.checked_today || 0;
            total = statusResult.data.total_reminders || 0;
            if (total === 0) {
                statusClass = 'all-done';
                statusText = '暂无提醒';
            } else if (completed === 0) {
                statusClass = 'overdue';
                statusText = '未服药';
            } else if (completed < total) {
                statusClass = 'partial';
                statusText = '部分完成';
            }
        }

        html += `<div class="elderly-status-card">
            <div class="status-header">
                <div class="status-avatar">${(elderly.elderly_name || elderly.username)[0].toUpperCase()}</div>
                <div class="status-name">${escapeHtml(elderly.elderly_name || elderly.username)}</div>
            </div>
            <div class="status-summary">
                <div class="status-item">
                    <div class="status-num">${completed}</div>
                    <div class="status-label">已完成</div>
                </div>
                <div class="status-item">
                    <div class="status-num">${total}</div>
                    <div class="status-label">应服药</div>
                </div>
            </div>
            <div class="status-indicator ${statusClass}">
                ${statusClass === 'all-done' ? '✅' : statusClass === 'partial' ? '⏳' : '❌'} ${statusText}
            </div>
        </div>`;
    }
    grid.innerHTML = html;
}

// ========== 定时轮询 ==========
function startPolling() {
    pollingInterval = setInterval(() => {
        if (currentPage === 'elderly') loadElderlyStatus();
    }, 30000);
}

// ========== 服药视频存档 ==========
async function loadMedicationVideos() {
    const result = await API.get('/api/medication-videos');
    const container = document.getElementById('video-grid');
    const empty = document.getElementById('video-empty');

    if (result.code !== 0 || !result.data || result.data.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    // 筛选与排序
    const sceneFilter = document.getElementById('video-scene-filter') ? document.getElementById('video-scene-filter').value : '';
    const sortMode = document.getElementById('video-sort-filter') ? document.getElementById('video-sort-filter').value : 'latest';

    let videos = result.data.slice();
    if (sceneFilter) {
        videos = videos.filter(v => (v.scene_type || 'unknown') === sceneFilter);
    }
    // 异常优先排序：refused_unwell > unknown > delay > already_taken > taken
    if (sortMode === 'abnormal') {
        const priority = { 'refused_unwell': 0, 'unknown': 1, 'delay': 2, 'already_taken': 3, 'taken': 4 };
        videos.sort((a, b) => {
            const pa = priority[a.scene_type] !== undefined ? priority[a.scene_type] : 1;
            const pb = priority[b.scene_type] !== undefined ? priority[b.scene_type] : 1;
            if (pa !== pb) return pa - pb;
            return (b.created_at || '').localeCompare(a.created_at || '');
        });
    } else {
        videos.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    }

    empty.style.display = 'none';
    const sceneLabels = {
        'taken': { label: '已服药', class: 'success' },
        'delay': { label: '延迟服药', class: 'warning' },
        'already_taken': { label: '已提前服药', class: 'warning' },
        'refused_unwell': { label: '身体不适', class: 'danger' },
        'unknown': { label: '待确认', class: 'muted' },
    };

    container.innerHTML = videos.map(v => {
        const scene = sceneLabels[v.scene_type] || sceneLabels['unknown'];
        const elderlyName = v.elderly_name || v.elderly_username || '老人';
        const analysis = v.scene_analysis ? `<div class="video-analysis">💡 ${escapeHtml(v.scene_analysis)}</div>` : '';
        return `<div class="video-card ${scene.class === 'danger' ? 'video-card-alert' : ''}">
            <div class="video-card-header">
                <span class="video-scene-badge ${scene.class}">${scene.label}</span>
                <span class="video-time">${escapeHtml(v.created_at || '')}</span>
            </div>
            <div class="video-card-body">
                <div class="video-info">
                    <div class="video-medicine">💊 ${escapeHtml(v.medicine_name || '药品')}</div>
                    <div class="video-elderly">👤 ${escapeHtml(elderlyName)}</div>
                    ${v.transcript ? `<div class="video-transcript">"${escapeHtml(v.transcript)}"</div>` : ''}
                    ${analysis}
                </div>
                ${v.video_url ? `<video controls preload="none" class="video-player" src="${v.video_url}"></video>` : '<div class="video-no-preview">无视频记录</div>'}
            </div>
        </div>`;
    }).join('');
}

// ========== 初始化 ==========
async function init() {
    const authed = await checkAuth();
    if (!authed) return;

    // 账户信息统一显示在右上角顶部操作栏（左下角不再显示）
    const topUserM = document.getElementById('top-username-m');
    const topAvatarM = document.getElementById('top-avatar-m');
    if (topUserM) topUserM.textContent = currentUser.username;
    if (topAvatarM) topAvatarM.textContent = currentUser.username[0].toUpperCase();

    const hour = new Date().getHours();
    let greeting = '早上好'; if (hour >= 12 && hour < 18) greeting = '下午好'; else if (hour >= 18) greeting = '晚上好';
    document.getElementById('member-greeting').textContent = `${greeting}，${currentUser.username}`;

    await loadMedicines();
    // 阶段4：建立 SSE 实时同步监听
    setupSSECabinetSync();

    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            switchPage(this.dataset.page);
        });
    });

    // 点击页面其他位置关闭告警面板
    document.addEventListener('click', function(e) {
        const bar = document.getElementById('scene-alert-bar');
        const panel = document.getElementById('alert-panel');
        if (panel && panel.style.display === 'block' && bar && !bar.contains(e.target)) {
            panel.style.display = 'none';
        }
    });

    // 点击遮罩关闭添加药品模态框
    const addModal = document.getElementById('member-add-medicine-modal');
    if (addModal) {
        addModal.addEventListener('click', function(e) {
            if (e.target === this) this.style.display = 'none';
        });
    }

    // 点击遮罩关闭药品编辑模态框
    const cabModal = document.getElementById('cabinet-edit-modal');
    if (cabModal) {
        cabModal.addEventListener('click', function(e) {
            if (e.target === this) this.style.display = 'none';
        });
    }

    startPolling();
    // 迭代4 P0：启动异常告警轮询（30秒一次）
    loadSceneAlerts();
    alertPollingInterval = setInterval(loadSceneAlerts, 30000);
}

init();

// ========== 异常场景告警（迭代4 P0：异常实时通道） ==========
async function loadSceneAlerts() {
    const result = await API.get('/api/scene-alerts?unread=1&limit=20');
    const badge = document.getElementById('alert-badge');
    if (result.code !== 0 || !result.data) {
        if (badge) badge.style.display = 'none';
        return;
    }
    currentAlertList = result.data;
    const count = result.data.length;
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
        const hasCritical = result.data.some(a => a.severity === 'critical');
        badge.classList.toggle('critical', hasCritical);
    } else {
        badge.style.display = 'none';
    }
    renderAlertPanel(currentAlertList);
}

function renderAlertPanel(alerts) {
    const list = document.getElementById('alert-panel-list');
    if (!list) return;
    if (!alerts || alerts.length === 0) {
        list.innerHTML = '<div class="alert-empty">暂无异常告警</div>';
        return;
    }
    const sceneLabels = {
        'refused_unwell': '身体不适',
        'unknown': '待确认',
        'missed': '未服药',
        'already_taken': '已提前服药',
        'delay': '延迟'
    };
    list.innerHTML = alerts.map(a => {
        const sevClass = a.severity === 'critical' ? 'critical' : (a.severity === 'warning' ? 'warning' : 'info');
        const sceneLabel = sceneLabels[a.scene_type] || a.scene_type;
        const elderlyName = a.elderly_name || a.elderly_username || '老人';
        const claimBtn = a.claimed_by
            ? `<span class="alert-claimed">已认领：${escapeHtml(a.claimed_by_username || '其他成员')}</span>`
            : `<button class="alert-claim-btn" onclick="claimAlert(${a.id})">我来处理</button>`;
        const videoLink = a.video_url
            ? `<a href="${a.video_url}" target="_blank" class="alert-video-link">查看视频</a>`
            : '';
        return `<div class="alert-item ${sevClass}">
            <div class="alert-item-header">
                <span class="alert-severity-badge ${sevClass}">${sceneLabel}</span>
                <span class="alert-time">${escapeHtml((a.created_at || '').slice(5, 16))}</span>
            </div>
            <div class="alert-message">${escapeHtml(a.message)}</div>
            <div class="alert-meta">
                <span>👤 ${escapeHtml(elderlyName)}</span>
                ${a.medicine_name ? `<span>💊 ${escapeHtml(a.medicine_name)}</span>` : ''}
            </div>
            <div class="alert-actions">
                ${claimBtn}
                ${videoLink}
                <button class="alert-read-btn" onclick="markAlertRead(${a.id})">标为已读</button>
            </div>
        </div>`;
    }).join('');
}

function toggleAlertPanel() {
    const panel = document.getElementById('alert-panel');
    if (!panel) return;
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    if (panel.style.display === 'block') {
        renderAlertPanel(currentAlertList);
    }
}

async function markAlertRead(id) {
    const result = await API.post(`/api/scene-alerts/${id}/read`, {});
    if (result.code === 0) {
        showToast('已标记为已读');
        loadSceneAlerts();
    }
}

async function markAllAlertsRead() {
    const tasks = currentAlertList.map(a => API.post(`/api/scene-alerts/${a.id}/read`, {}));
    await Promise.all(tasks);
    showToast('全部已读');
    loadSceneAlerts();
}

async function claimAlert(id) {
    const result = await API.post(`/api/scene-alerts/${id}/claim`, {});
    if (result.code === 0) {
        showToast('认领成功');
        loadSceneAlerts();
    } else {
        showToast(result.msg || '认领失败', 'error');
    }
}

// ========== 语音明信片（迭代4 P0：情感联结前端入口） ==========
async function loadVoicePostcards() {
    const result = await API.get('/api/voice-postcards?limit=30');
    const container = document.getElementById('postcard-grid');
    const empty = document.getElementById('postcard-empty');

    if (result.code !== 0 || !result.data || result.data.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    container.innerHTML = result.data.map(p => {
        const elderlyName = p.elderly_name || p.elderly_username || '老人';
        const isRead = p.is_read === 1;
        const duration = p.duration_seconds ? `${Math.floor(p.duration_seconds/60)}:${String(p.duration_seconds%60).padStart(2,'0')}` : '';
        return `<div class="postcard-card ${isRead ? '' : 'unread'}">
            <div class="postcard-header">
                <span class="postcard-avatar">🎤</span>
                <div class="postcard-from">
                    <div class="postcard-name">${escapeHtml(elderlyName)}</div>
                    <div class="postcard-time">${escapeHtml((p.created_at || '').slice(0, 16))}</div>
                </div>
                ${isRead ? '' : '<span class="postcard-unread-dot">新</span>'}
            </div>
            ${p.note ? `<div class="postcard-note">"${escapeHtml(p.note)}"</div>` : ''}
            ${p.audio_url ? `<div class="postcard-player">
                <audio controls preload="none" src="${p.audio_url}" onplay="markPostcardRead(${p.id})"></audio>
            </div>` : '<div class="postcard-no-audio">无音频</div>'}
            ${duration ? `<div class="postcard-duration">时长 ${duration}</div>` : ''}
        </div>`;
    }).join('');
}

async function markPostcardRead(id) {
    const result = await API.post(`/api/voice-postcards/${id}/read`, {});
    if (result.code === 0) {
        // 静默刷新，不打断播放
        setTimeout(() => { if (currentPage === 'postcards') loadVoicePostcards(); }, 1000);
    }
}

async function loadFamily() {
    const result = await API.get('/api/family/info');
    if (result.code !== 0 || !result.data) return;
    const data = result.data;

    document.getElementById('family-name').textContent = data.name || '未命名家庭';
    document.getElementById('family-invite-code').textContent = data.invite_code || '-';
    document.getElementById('family-admin').textContent = data.admin_name || '-';
    document.getElementById('family-member-count').textContent = data.members ? data.members.length + ' 人' : '-';

    const membersList = document.getElementById('family-members-list');
    if (!membersList) return;

    if (!data.members || data.members.length === 0) {
        membersList.innerHTML = '<div class="family-empty">暂无家庭成员</div>';
        return;
    }

    membersList.innerHTML = data.members.map(m => {
        const roleText = m.role_type === 'admin' ? '管理员' : (m.role_type === 'elderly' ? '老人' : '普通成员');
        const roleColor = m.role_type === 'admin' ? '#0071e3' : (m.role_type === 'elderly' ? '#34c759' : '#86868b');
        const avatar = (m.elderly_name || m.username || '?')[0].toUpperCase();
        return `<div class="family-member-item">
            <div class="family-member-avatar" style="background:${roleColor}">${avatar}</div>
            <div class="family-member-info">
                <div class="family-member-name">${escapeHtml(m.elderly_name || m.username)}</div>
                <div class="family-member-role" style="color:${roleColor}">${roleText}</div>
            </div>
            ${m.role_type === 'elderly' ? '<div class="family-member-status">👵 老人</div>' : ''}
        </div>`;
    }).join('');
}

function copyFamilyCode() {
    const code = document.getElementById('family-invite-code').textContent;
    if (code && code !== '-') {
        navigator.clipboard.writeText(code).then(() => showToast('邀请码已复制'));
    } else {
        showToast('暂无邀请码', 'error');
    }
}

function openJoinFamilyDialog() {
    const existing = document.getElementById('join-family-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'join-family-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <h2>申请加入家庭</h2>
            <div class="form-group">
                <label>邀请码</label>
                <input type="text" id="join-invite-code" placeholder="输入6位家庭邀请码" maxlength="6" style="text-transform:uppercase;letter-spacing:4px;text-align:center;font-size:1.2rem">
            </div>
            <div class="form-group">
                <label>用户名</label>
                <input type="text" id="join-username" placeholder="设置您的用户名">
            </div>
            <div class="form-group">
                <label>密码</label>
                <input type="password" id="join-password" placeholder="设置密码（至少3位）" minlength="3">
            </div>
            <div class="form-actions">
                <button class="btn btn-outline" onclick="document.getElementById('join-family-modal').remove()">取消</button>
                <button class="btn btn-primary" onclick="submitJoinFamily()">提交申请</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

async function submitJoinFamily() {
    const inviteCode = document.getElementById('join-invite-code').value.trim().toUpperCase();
    const username = document.getElementById('join-username').value.trim();
    const password = document.getElementById('join-password').value;

    if (!inviteCode || !username || !password) {
        showToast('请填写完整信息', 'error');
        return;
    }
    if (password.length < 3) {
        showToast('密码至少3位', 'error');
        return;
    }

    const result = await API.post('/api/family/invitation/apply', {
        invite_code: inviteCode,
        username: username,
        password: password
    });

    if (result.code === 0) {
        showToast(result.msg);
        document.getElementById('join-family-modal').remove();
    } else {
        showToast(result.msg || '申请失败', 'error');
    }
}