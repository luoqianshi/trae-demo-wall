/* 邻里智联 - 社区治理后台管理系统 工具函数 & 页面路由 */

/* ===== 登录态相关 ===== */
function checkLoginAdmin() {
    const token = localStorage.getItem('admin_token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function getCurrentAdmin() {
    try {
        const u = JSON.parse(localStorage.getItem('admin_user') || 'null');
        if (!u) return null;
        return u;
    } catch (e) {
        return null;
    }
}

function setCurrentAdmin(user) {
    if (user && user.token) localStorage.setItem('admin_token', user.token);
    if (user && user.user) localStorage.setItem('admin_user', JSON.stringify(user.user));
    else if (user) localStorage.setItem('admin_user', JSON.stringify(user));
}

function logoutAdmin() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = 'login.html';
}

/* ===== 通用工具 ===== */
function showToast(msg, type) {
    type = type || 'info';
    const container = document.getElementById('toast-container') || (() => {
        const d = document.createElement('div');
        d.id = 'toast-container';
        d.style.cssText = 'position:fixed;top:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
        document.body.appendChild(d);
        return d;
    })();
    const colors = { success: '#5A8A6E', error: '#D9534F', warning: '#E8A838', info: '#5B8DB8' };
    const t = document.createElement('div');
    t.style.cssText = `padding:12px 18px;background:#fff;border-radius:6px;box-shadow:0 6px 20px rgba(0,0,0,0.12);border-left:4px solid ${colors[type]};font-size:14px;min-width:200px;transform:translateX(20px);opacity:0;transition:all 0.25s;`;
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => { t.style.transform = 'translateX(0)'; t.style.opacity = '1'; }, 10);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; setTimeout(() => t.remove(), 250); }, 2600);
}

function showConfirm(title, content, onOk) {
    const mask = document.createElement('div');
    mask.style.cssText = 'position:fixed;inset:0;background:rgba(44,36,32,0.55);display:flex;align-items:center;justify-content:center;z-index:9000;padding:20px;';
    const box = document.createElement('div');
    box.style.cssText = 'background:#fff;border-radius:10px;padding:24px;width:420px;max-width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.25);';
    box.innerHTML = `
        <h3 style="margin:0 0 12px 0;font-size:18px;color:#2c2420;">${title}</h3>
        <div style="color:#6b6159;font-size:14px;margin-bottom:20px;line-height:1.7;">${content}</div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
            <button id="cb-cancel" style="padding:8px 18px;border-radius:6px;border:1px solid #d8cfc4;background:#fff;cursor:pointer;font-size:14px;">取消</button>
            <button id="cb-ok" style="padding:8px 18px;border-radius:6px;border:1px solid #C45D3A;background:#C45D3A;color:#fff;cursor:pointer;font-size:14px;">确认</button>
        </div>
    `;
    mask.appendChild(box);
    document.body.appendChild(mask);
    mask.querySelector('#cb-cancel').onclick = () => mask.remove();
    mask.querySelector('#cb-ok').onclick = () => {
        mask.remove();
        if (typeof onOk === 'function') onOk();
    };
}

function formatDate(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return String(ts);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getStatusLabel(status) {
    const map = {
        pending: '待处理', processing: '处理中', completed: '已完成', closed: '已关闭',
        active: '正常', inactive: '已禁用',
        available: '可借用', borrowed: '已借出',
        draft: '草稿', published: '已发布',
        online: '在线', offline: '离线',
        normal: '正常', warning: '关注', danger: '预警'
    };
    return map[status] || status || '-';
}

function getPriorityLabel(priority) {
    const map = { urgent: '紧急', high: '高', normal: '普通', low: '低' };
    return map[priority] || priority || '普通';
}

function getRoleLabel(role) {
    const map = { admin: '系统管理员', grid: '网格员', resident: '居民' };
    return map[role] || role || '-';
}

function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/* ===== 公共布局 ===== */
function renderLayout(active, pageTitle) {
    const admin = getCurrentAdmin() || { name: '管理员', role: 'admin', phone: '' };
    const menus = [
        { key: 'dashboard', icon: '📊', label: '工作台', url: 'dashboard.html' },
        { key: 'detection', icon: '🛡️', label: '隐患检测', url: 'detection.html' },
        { key: 'workorders', icon: '🔧', label: '工单管理', url: 'workorders.html' },
        { key: 'appeals', icon: '📝', label: '诉求管理', url: 'appeals.html' },
        { key: 'shares', icon: '🤝', label: '共享物品', url: 'shares.html' },
        { key: 'notices', icon: '📢', label: '通知发布', url: 'notices.html' },
        { key: 'elderly', icon: '👴', label: '独居老人', url: 'elderly.html' },
        { key: 'complaints', icon: '⚠️', label: '投诉举报', url: 'complaints.html' },
        { key: 'users', icon: '👥', label: '用户管理', url: 'users.html' },
        { key: 'review', icon: '✅', label: '用户审核', url: 'review.html' }
    ];
    return `
    <div style="display:flex;min-height:100vh;background:#FDF8F3;">
        <aside style="width:220px;background:#2C2420;color:#fff;flex-shrink:0;display:flex;flex-direction:column;">
            <div style="padding:20px 18px;border-bottom:1px solid rgba(255,255,255,0.08);">
                <div style="font-size:18px;font-weight:700;color:#C45D3A;letter-spacing:0.5px;">🏘 邻里智联</div>
                <div style="font-size:12px;color:rgba(255,255,255,0.55);margin-top:4px;">社区治理管理系统</div>
            </div>
            <nav style="flex:1;padding:10px 0;overflow-y:auto;">
                ${menus.map(m => `
                    <a href="${m.url}" style="display:flex;align-items:center;gap:12px;padding:11px 20px;color:${active === m.key ? '#C45D3A' : 'rgba(255,255,255,0.80)'};text-decoration:none;font-size:14px;background:${active === m.key ? 'rgba(196,93,58,0.18)' : 'transparent'};border-left:3px solid ${active === m.key ? '#C45D3A' : 'transparent'};font-weight:${active === m.key ? '600' : '400'};">
                        <span style="font-size:16px;width:20px;text-align:center;">${m.icon}</span><span>${m.label}</span>
                    </a>
                `).join('')}
            </nav>
            <div style="padding:14px 20px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:rgba(255,255,255,0.4);">© 2026 邻里智联</div>
        </aside>
        <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
            <header style="background:#fff;padding:16px 28px;border-bottom:1px solid #f0e6db;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                <div style="font-size:18px;font-weight:600;color:#2C2420;">${pageTitle}</div>
                <div style="display:flex;align-items:center;gap:14px;">
                    <span style="font-size:13px;color:#6b6159;">${getRoleLabel(admin.role)} · ${escapeHtml(admin.name || '管理员')}</span>
                    <button onclick="logoutAdmin()" style="padding:6px 14px;border-radius:6px;border:1px solid #D9534F;background:#fff;color:#D9534F;font-size:13px;cursor:pointer;">退出登录</button>
                </div>
            </header>
            <main id="pageContent" style="padding:24px 28px;flex:1;"></main>
        </div>
    </div>`;
}

/* ===== 简易徽章 ===== */
function badge(label, color) {
    color = color || '#5B8DB8';
    return `<span style="padding:2px 10px;border-radius:10px;font-size:11.5px;color:${color};background:${color}20;white-space:nowrap;display:inline-block;">${label}</span>`;
}

/* =========================================================
 * 1. 登录页
 * ========================================================= */
function initLoginPage() {
    if (getCurrentAdmin() && localStorage.getItem('admin_token')) {
        window.location.href = 'dashboard.html';
        return;
    }

    document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#FDF8F3 0%,#E8D8CA 100%);padding:20px;">
      <div style="background:#fff;padding:40px;border-radius:12px;box-shadow:0 10px 40px rgba(196,93,58,0.15);width:100%;max-width:420px;">
        <div style="text-align:center;margin-bottom:28px;">
            <div style="width:64px;height:64px;margin:0 auto 12px;background:#C45D3A;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:2rem;color:#fff;">🏘</div>
            <h1 style="font-size:1.6rem;margin-bottom:4px;color:#2C2420;">邻里智联</h1>
            <p style="font-size:13px;color:#8B7B70;margin:0;">社区治理后台管理系统</p>
        </div>
        <form id="loginForm" style="display:flex;flex-direction:column;gap:16px;">
            <div>
                <label style="display:block;margin-bottom:6px;font-size:13px;color:#2C2420;">手机号</label>
                <input type="tel" name="phone" placeholder="请输入手机号" maxlength="11" required style="width:100%;padding:10px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:14px;box-sizing:border-box;">
            </div>
            <div>
                <label style="display:block;margin-bottom:6px;font-size:13px;color:#2C2420;">登录密码</label>
                <input type="password" name="password" placeholder="请输入密码" required style="width:100%;padding:10px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:14px;box-sizing:border-box;">
            </div>
            <button type="submit" id="loginBtn" style="padding:11px 18px;background:#C45D3A;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;">登 录</button>
        </form>
        <div style="margin-top:20px;padding:12px 14px;background:#FAF5EE;border-left:4px solid #E8A838;border-radius:4px;font-size:12.5px;color:#8A5B00;line-height:1.7;">
            <strong>演示账号：</strong><br>
            · 管理员：13800138000 / admin123<br>
            · 网格员：13800138001 / grid123
        </div>
      </div>
    </div>`;

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = e.target.phone.value.trim();
        const password = e.target.password.value.trim();
        if (!/^1\d{10}$/.test(phone)) { showToast('请输入正确的手机号', 'warning'); return; }
        if (!password) { showToast('请输入密码', 'warning'); return; }
        const btn = document.getElementById('loginBtn');
        btn.disabled = true; btn.textContent = '登录中...';
        try {
            const data = await window.AuthAPI.login(phone, password);
            if (data && data.token) {
                localStorage.setItem('admin_token', data.token);
                if (data.user) localStorage.setItem('admin_user', JSON.stringify(data.user));
                else localStorage.setItem('admin_user', JSON.stringify({ name: '管理员', role: 'admin', phone }));
                showToast('登录成功', 'success');
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
            } else if (data && data.user) {
                localStorage.setItem('admin_token', 'demo-' + Date.now());
                localStorage.setItem('admin_user', JSON.stringify(data.user));
                showToast('登录成功', 'success');
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
            } else {
                showToast('登录失败，请检查账号密码', 'error');
                btn.disabled = false; btn.textContent = '登 录';
            }
        } catch (err) {
            showToast('登录异常：' + err.message, 'error');
            btn.disabled = false; btn.textContent = '登 录';
        }
    });
}

/* =========================================================
 * 2. 工作台（仪表盘）
 * ========================================================= */
async function initDashboardPage() {
    if (!checkLoginAdmin()) return;
    document.body.innerHTML = renderLayout('dashboard', '工作台');
    const content = document.getElementById('pageContent');
    content.innerHTML = '<div style="padding:40px;text-align:center;color:#8B7B70;">数据加载中...</div>';

    const [overview, woStats, appealByType, elderlyStatus, shareByCat, detectionStats] = await Promise.all([
        window.DashboardAPI.overview(),
        window.WorkOrderAPI.getStats(),
        window.DashboardAPI.appealByType(),
        window.DashboardAPI.elderlyStatus(),
        window.DashboardAPI.shareByCategory(),
        window.DetectionAPI.getStats()
    ]).catch(() => [null, null, null, null, null, null]);

    const ov = overview || {};
    const ds = detectionStats || {};
    const cards = [
        { icon: '🛡️', title: 'AI隐患检测', value: ds.todayAlerts || 0, sub: `告警中 ${ds.active || 0} · 已处理 ${ds.resolved || 0}`, color: '#D9534F' },
        { icon: '📋', title: '工单总数', value: ov.workOrderTotal || 0, sub: `待处理 ${woStats ? (woStats.pending || 0) : 0}`, color: '#C45D3A' },
        { icon: '📝', title: '诉求总数', value: ov.appealTotal || 0, sub: `待处理 ${ov.pendingAppeal || 0}`, color: '#5B8DB8' },
        { icon: '🤝', title: '共享物品', value: ov.shareTotal || 0, sub: `通知 ${ov.noticeTotal || 0}`, color: '#E8A838' },
        { icon: '👴', title: '独居老人', value: ov.elderlyTotal || 0, sub: `预警 ${ov.elderlyAlert || 0}`, color: '#D9534F' },
        { icon: '👥', title: '用户总数', value: ov.residentTotal || 0, sub: `今日活跃 ${ov.todayActive || 0}`, color: '#5A8A6E' }
    ];

    // Build detection type data for pie chart
    const detBreakdown = (ds.breakdown && ds.breakdown.length) ? ds.breakdown : [
        { label: '楼道杂物堆积', count: 5, color: '#E8A838' },
        { label: '楼道电动车', count: 3, color: '#D9534F' },
        { label: '电梯电动车', count: 2, color: '#C45D3A' },
        { label: '儿童靠近电梯井', count: 1, color: '#A8433A' },
        { label: '可疑人员徘徊', count: 2, color: '#5B8DB8' },
        { label: '消防通道占用', count: 1, color: '#8B7B70' }
    ];
    const detTypeData = { labels: detBreakdown.map(x => x.label), counts: detBreakdown.map(x => x.count) };
    const detColors = detBreakdown.map(x => x.color);

    content.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px;margin-bottom:20px;">
            ${cards.map(c => `
                <div style="background:#fff;padding:18px 20px;border-radius:10px;border:1px solid #f0e6db;box-shadow:0 2px 8px rgba(196,93,58,0.06);cursor:pointer;" onclick="window.location.href='detection.html';">
                    <div style="display:flex;align-items:center;gap:14px;">
                        <div style="width:48px;height:48px;border-radius:10px;background:${c.color}20;color:${c.color};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">${c.icon}</div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:13px;color:#8B7B70;">${c.title}</div>
                            <div style="font-size:22px;font-weight:700;color:#2C2420;margin-top:2px;">${c.value}</div>
                            <div style="font-size:12px;color:#8B7B70;margin-top:4px;">${c.sub}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:16px;">
            <div style="background:#fff;padding:20px;border-radius:10px;border:1px solid #f0e6db;">${renderPie('AI隐患识别类型占比', detTypeData, detColors)}</div>
            <div style="background:#fff;padding:20px;border-radius:10px;border:1px solid #f0e6db;">${renderChart('诉求类型分布', appealByType, '#5B8DB8')}</div>
            <div style="background:#fff;padding:20px;border-radius:10px;border:1px solid #f0e6db;">${renderPie('独居老人状态分布', elderlyStatus, ['#5A8A6E', '#E8A838', '#D9534F'])}</div>
            <div style="background:#fff;padding:20px;border-radius:10px;border:1px solid #f0e6db;">${renderPie('共享物品分类占比', shareByCat, ['#C45D3A', '#5B8DB8', '#5A8A6E', '#E8A838', '#8B7B70', '#6b6159'])}</div>
            <div style="background:#fff;padding:20px;border-radius:10px;border:1px solid #f0e6db;">
                <div style="font-size:15px;font-weight:600;color:#2C2420;margin-bottom:14px;">工单状态统计</div>
                ${renderChartData([
                    { label: '待处理', value: woStats ? (woStats.pending || 0) : 0, color: '#E8A838' },
                    { label: '处理中', value: woStats ? (woStats.processing || 0) : 0, color: '#5B8DB8' },
                    { label: '已完成', value: woStats ? (woStats.completed || 0) : 0, color: '#5A8A6E' },
                    { label: '紧急工单', value: woStats ? (woStats.urgent || 0) : 0, color: '#D9534F' }
                ])}
            </div>
        </div>
    `;
}

function renderChart(title, data, defaultColor) {
    let rows = '';
    if (data && data.labels && data.labels.length) {
        const max = Math.max.apply(null, data.counts.concat([1]));
        rows = data.labels.map((lbl, i) => {
            const v = data.counts[i] || 0;
            const pct = Math.round((v / max) * 100);
            return `<div style="margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span style="color:#6b6159;">${escapeHtml(lbl)}</span><span style="font-weight:600;color:#2C2420;">${v}</span></div>
                <div style="background:#f5efe6;border-radius:4px;height:10px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:${defaultColor};transition:width 0.6s;"></div></div>
            </div>`;
        }).join('');
    } else {
        rows = '<div style="color:#8B7B70;font-size:13px;padding:20px 0;text-align:center;">暂无数据</div>';
    }
    return `<div style="font-size:15px;font-weight:600;color:#2C2420;margin-bottom:14px;">${title}</div>${rows}`;
}

function renderChartData(items) {
    const max = Math.max.apply(null, items.map(i => i.value).concat([1]));
    return items.map(it => {
        const pct = Math.round((it.value / max) * 100);
        return `<div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span style="color:#6b6159;">${it.label}</span><span style="font-weight:600;color:#2C2420;">${it.value}</span></div>
            <div style="background:#f5efe6;border-radius:4px;height:10px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:${it.color};transition:width 0.6s;"></div></div>
        </div>`;
    }).join('');
}

function renderPie(title, data, colors) {
    let html = `<div style="font-size:15px;font-weight:600;color:#2C2420;margin-bottom:14px;">${title}</div>`;
    if (!data || !data.labels || data.labels.length === 0) return html + '<div style="color:#8B7B70;font-size:13px;padding:20px 0;text-align:center;">暂无数据</div>';
    const total = data.counts.reduce((a, b) => a + (b || 0), 0) || 1;
    let accDeg = 0;
    const slices = data.labels.map((label, i) => {
        const v = data.counts[i] || 0;
        const pct = v / total;
        const deg = pct * 360;
        const start = accDeg;
        accDeg += deg;
        return { label, v, pct, start, deg, color: colors[i % colors.length] };
    });
    const gradient = slices.map(s => `${s.color} ${s.start}deg ${s.start + s.deg}deg`).join(', ');
    html += `<div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">
        <div style="width:130px;height:130px;border-radius:50%;background:conic-gradient(${gradient});position:relative;flex-shrink:0;">
            <div style="position:absolute;inset:28px;background:#fff;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 0 0 1px #f0e6db;">
                <div style="font-size:12px;color:#8B7B70;">总数</div>
                <div style="font-size:22px;font-weight:700;color:#C45D3A;">${total}</div>
            </div>
        </div>
        <div style="flex:1;min-width:160px;display:flex;flex-direction:column;gap:8px;">
            ${slices.map(s => `<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#2C2420;">
                <span style="width:12px;height:12px;background:${s.color};border-radius:3px;display:inline-block;flex-shrink:0;"></span>
                <span style="flex:1;">${escapeHtml(s.label)}</span>
                <span style="font-weight:600;">${s.v}</span>
                <span style="color:#8B7B70;font-size:12px;">${Math.round(s.pct * 100)}%</span>
            </div>`).join('')}
        </div>
    </div>`;
    return html;
}

/* =========================================================
 * 3. 工单管理
 * ========================================================= */
async function initWorkOrdersPage() {
    if (!checkLoginAdmin()) return;
    document.body.innerHTML = renderLayout('workorders', '工单管理');
    const content = document.getElementById('pageContent');
    content.innerHTML = '<div style="padding:40px;text-align:center;color:#8B7B70;">数据加载中...</div>';

    let state = { list: [], status: 'all', keyword: '' };
    const data = await window.WorkOrderAPI.list({});
    if (data && Array.isArray(data.list)) state.list = data.list;

    const typeMap = { hazard: '消防隐患', repair: '报修维修', elevator: '电梯', consult: '咨询', other: '其他' };

    function statusBadge(s) {
        const map = { pending: ['待处理', '#E8A838'], processing: ['处理中', '#5B8DB8'], completed: ['已完成', '#5A8A6E'], closed: ['已关闭', '#6b6159'] };
        const [l, c] = map[s] || map.pending;
        return badge(l, c);
    }
    function priBadge(p) {
        const map = { urgent: ['紧急', '#D9534F'], high: ['高', '#E8A838'], normal: ['普通', '#5B8DB8'], low: ['低', '#6b6159'] };
        const [l, c] = map[p] || map.normal;
        return badge(l, c);
    }

    function render() {
        const filtered = state.list.filter(o => {
            if (state.status !== 'all' && o.status !== state.status) return false;
            if (state.keyword) {
                const kw = state.keyword.toLowerCase();
                const hay = [o.order_no, o.title, o.description, o.location, o.reporter].filter(Boolean).join(' ').toLowerCase();
                if (!hay.includes(kw)) return false;
            }
            return true;
        });
        content.innerHTML = `
            <div style="background:#fff;padding:16px 20px;border-radius:10px;border:1px solid #f0e6db;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
                <span style="font-size:13px;color:#6b6159;">状态：</span>
                <select id="wo-status" style="padding:7px 10px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;background:#fff;">
                    <option value="all" ${state.status === 'all' ? 'selected' : ''}>全部</option>
                    <option value="pending" ${state.status === 'pending' ? 'selected' : ''}>待处理</option>
                    <option value="processing" ${state.status === 'processing' ? 'selected' : ''}>处理中</option>
                    <option value="completed" ${state.status === 'completed' ? 'selected' : ''}>已完成</option>
                </select>
                <input type="text" id="wo-keyword" value="${escapeHtml(state.keyword)}" placeholder="搜索编号/标题/位置/报修人" style="flex:1;min-width:200px;padding:7px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;">
                <button id="wo-search" style="padding:7px 16px;background:#C45D3A;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;">搜索</button>
                <span style="color:#8B7B70;font-size:13px;margin-left:auto;">共 ${filtered.length} 条</span>
            </div>
            <div style="background:#fff;border-radius:10px;border:1px solid #f0e6db;overflow:hidden;">
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                    <thead style="background:#FAF5EE;">
                        <tr>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">编号</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">类型</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">标题/描述</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">位置</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">优先级</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">状态</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">创建时间</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.length === 0 ? `<tr><td colspan="8" style="padding:40px;text-align:center;color:#8B7B70;">暂无工单数据</td></tr>` : filtered.map(o => `
                            <tr style="border-bottom:1px solid #f0e6db;">
                                <td style="padding:12px 14px;font-weight:500;color:#2C2420;font-size:13px;">${escapeHtml(o.order_no || 'WO' + o.id)}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${escapeHtml(typeMap[o.type] || o.type || '其他')}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#2C2420;">${escapeHtml(o.title || o.description || '-')}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${escapeHtml(o.location || '-')}</td>
                                <td style="padding:12px 14px;">${priBadge(o.priority)}</td>
                                <td style="padding:12px 14px;">${statusBadge(o.status)}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${formatDate(o.create_time)}</td>
                                <td style="padding:12px 14px;font-size:13px;">
                                    <button onclick="viewWorkorder(${o.id})" style="padding:4px 10px;border-radius:4px;border:1px solid #d8cfc4;background:#fff;color:#2C2420;cursor:pointer;font-size:12px;margin-right:4px;">查看</button>
                                    ${o.status !== 'completed' && o.status !== 'closed' ? `<button onclick="processWorkorder(${o.id})" style="padding:4px 10px;border-radius:4px;border:1px solid #C45D3A;background:#C45D3A;color:#fff;cursor:pointer;font-size:12px;">处理</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('wo-status').onchange = (e) => { state.status = e.target.value; render(); };
        document.getElementById('wo-keyword').oninput = (e) => { state.keyword = e.target.value; };
        document.getElementById('wo-search').onclick = () => render();
    }

    window.viewWorkorder = async (id) => {
        const wo = state.list.find(x => x.id === id) || (await window.WorkOrderAPI.detail(id));
        if (!wo) { showToast('获取工单详情失败', 'error'); return; }
        showConfirm(`工单详情 - ${wo.order_no || 'WO' + wo.id}`, `
            <div style="line-height:2;font-size:13px;">
                <div><strong>类型：</strong>${escapeHtml(typeMap[wo.type] || wo.type || '其他')} ｜ <strong>优先级：</strong>${priBadge(wo.priority)} ｜ <strong>状态：</strong>${statusBadge(wo.status)}</div>
                <div><strong>位置：</strong>${escapeHtml(wo.location || '-')}</div>
                <div><strong>报修人：</strong>${escapeHtml(wo.reporter || '-')}（${escapeHtml(wo.phone || '-')}）</div>
                <div><strong>创建时间：</strong>${formatDate(wo.create_time)}</div>
                <div style="margin-top:10px;"><strong>描述：</strong><div style="background:#FAF5EE;padding:10px;border-radius:6px;margin-top:6px;line-height:1.7;">${escapeHtml(wo.description || '-')}</div></div>
                ${wo.handle_result ? `<div style="margin-top:10px;"><strong>处理结果：</strong><div style="background:#E3F0E6;padding:10px;border-radius:6px;margin-top:6px;line-height:1.7;">${escapeHtml(wo.handle_result)}</div></div>` : ''}
            </div>
        `);
    };

    window.processWorkorder = (id) => {
        showConfirm('处理工单', `
            <div>
                <div style="margin-bottom:12px;">
                    <label style="display:block;margin-bottom:6px;font-size:13px;">更新状态</label>
                    <select id="proc-status" style="width:100%;padding:8px 10px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;">
                        <option value="processing">处理中</option>
                        <option value="completed">已完成</option>
                    </select>
                </div>
                <div>
                    <label style="display:block;margin-bottom:6px;font-size:13px;">处理说明 *</label>
                    <textarea id="proc-result" rows="4" placeholder="请输入处理过程和结果..." style="width:100%;padding:8px 10px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;box-sizing:border-box;resize:vertical;"></textarea>
                </div>
            </div>
        `, async () => {
            const s = document.getElementById('proc-status').value;
            const result = document.getElementById('proc-result').value.trim();
            if (!result) { showToast('请填写处理说明', 'warning'); return; }
            try {
                if (s === 'completed') await window.WorkOrderAPI.complete(id, result);
                else await window.WorkOrderAPI.process(id, result);
                const idx = state.list.findIndex(x => x.id === id);
                if (idx >= 0) { state.list[idx].status = s; state.list[idx].handle_result = result; }
                showToast('工单处理成功', 'success');
                render();
            } catch (e) { showToast('处理失败：' + e.message, 'error'); }
        });
    };

    render();
}

/* =========================================================
 * 4. 诉求管理
 * ========================================================= */
async function initAppealsPage() {
    if (!checkLoginAdmin()) return;
    document.body.innerHTML = renderLayout('appeals', '诉求管理');
    const content = document.getElementById('pageContent');
    content.innerHTML = '<div style="padding:40px;text-align:center;color:#8B7B70;">数据加载中...</div>';

    let state = { list: [], status: 'all', keyword: '' };
    const data = await window.AppealAPI.list({});
    if (data && Array.isArray(data.list)) state.list = data.list;

    const typeMap = { consult: '咨询', complaint: '投诉', repair: '报修', policy: '政策', neighbor: '邻里' };

    function statusBadge(s) {
        const map = { pending: ['待处理', '#E8A838'], processing: ['处理中', '#5B8DB8'], completed: ['已完成', '#5A8A6E'], closed: ['已关闭', '#6b6159'] };
        const [l, c] = map[s] || map.pending;
        return badge(l, c);
    }

    function render() {
        const filtered = state.list.filter(a => {
            if (state.status !== 'all' && a.status !== state.status) return false;
            if (state.keyword) {
                const kw = state.keyword.toLowerCase();
                const hay = [a.appeal_no, a.title, a.content, a.building, a.user_name].filter(Boolean).join(' ').toLowerCase();
                if (!hay.includes(kw)) return false;
            }
            return true;
        });
        content.innerHTML = `
            <div style="background:#fff;padding:16px 20px;border-radius:10px;border:1px solid #f0e6db;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
                <span style="font-size:13px;color:#6b6159;">状态：</span>
                <select id="appeal-status" style="padding:7px 10px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;background:#fff;">
                    <option value="all" ${state.status === 'all' ? 'selected' : ''}>全部</option>
                    <option value="pending" ${state.status === 'pending' ? 'selected' : ''}>待处理</option>
                    <option value="processing" ${state.status === 'processing' ? 'selected' : ''}>处理中</option>
                    <option value="completed" ${state.status === 'completed' ? 'selected' : ''}>已完成</option>
                </select>
                <input type="text" id="appeal-keyword" value="${escapeHtml(state.keyword)}" placeholder="搜索标题/内容/居民/位置" style="flex:1;min-width:200px;padding:7px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;">
                <button id="appeal-search" style="padding:7px 16px;background:#C45D3A;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;">搜索</button>
                <span style="color:#8B7B70;font-size:13px;margin-left:auto;">共 ${filtered.length} 条</span>
            </div>
            <div style="background:#fff;border-radius:10px;border:1px solid #f0e6db;overflow:hidden;">
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                    <thead style="background:#FAF5EE;">
                        <tr>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">编号</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">类型</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">标题</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">居民</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">位置</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">状态</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">时间</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.length === 0 ? `<tr><td colspan="8" style="padding:40px;text-align:center;color:#8B7B70;">暂无诉求数据</td></tr>` : filtered.map(a => `
                            <tr style="border-bottom:1px solid #f0e6db;">
                                <td style="padding:12px 14px;font-weight:500;font-size:13px;">${escapeHtml(a.appeal_no || 'AP' + a.id)}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${escapeHtml(typeMap[a.type] || a.type || '其他')}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#2C2420;">${escapeHtml(a.title || a.content || '-')}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${escapeHtml(a.user_name || '-')}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${escapeHtml(a.building || '-')}</td>
                                <td style="padding:12px 14px;">${statusBadge(a.status)}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${formatDate(a.create_time)}</td>
                                <td style="padding:12px 14px;font-size:13px;">
                                    <button onclick="viewAppeal(${a.id})" style="padding:4px 10px;border-radius:4px;border:1px solid #d8cfc4;background:#fff;color:#2C2420;cursor:pointer;font-size:12px;margin-right:4px;">查看</button>
                                    ${a.status !== 'completed' && a.status !== 'closed' ? `<button onclick="replyAppeal(${a.id})" style="padding:4px 10px;border-radius:4px;border:1px solid #C45D3A;background:#C45D3A;color:#fff;cursor:pointer;font-size:12px;">回复</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('appeal-status').onchange = (e) => { state.status = e.target.value; render(); };
        document.getElementById('appeal-keyword').oninput = (e) => { state.keyword = e.target.value; };
        document.getElementById('appeal-search').onclick = () => render();
    }

    window.viewAppeal = async (id) => {
        const a = state.list.find(x => x.id === id) || (await window.AppealAPI.detail(id));
        if (!a) { showToast('获取诉求详情失败', 'error'); return; }
        showConfirm(`诉求详情 - ${a.appeal_no || 'AP' + a.id}`, `
            <div style="line-height:2;font-size:13px;">
                <div><strong>类型：</strong>${escapeHtml(typeMap[a.type] || a.type || '其他')} ｜ <strong>状态：</strong>${statusBadge(a.status)}</div>
                <div><strong>居民：</strong>${escapeHtml(a.user_name || '-')}（${escapeHtml(a.phone || '-')}）</div>
                <div><strong>位置：</strong>${escapeHtml(a.building || '-')} ｜ <strong>提交时间：</strong>${formatDate(a.create_time)}</div>
                <div style="margin-top:10px;"><strong>标题：</strong><div style="font-weight:600;margin-top:4px;">${escapeHtml(a.title || '-')}</div></div>
                <div style="margin-top:10px;"><strong>内容：</strong><div style="background:#FAF5EE;padding:10px;border-radius:6px;margin-top:6px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(a.content || '-')}</div></div>
                ${a.handle_result ? `<div style="margin-top:10px;"><strong>处理结果：</strong><div style="background:#E3F0E6;padding:10px;border-radius:6px;margin-top:6px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(a.handle_result)}</div></div>` : ''}
            </div>
        `);
    };

    window.replyAppeal = (id) => {
        showConfirm('回复诉求', `
            <div>
                <div style="margin-bottom:12px;">
                    <label style="display:block;margin-bottom:6px;font-size:13px;">状态</label>
                    <select id="reply-status" style="width:100%;padding:8px 10px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;">
                        <option value="processing">处理中</option>
                        <option value="completed">已完成</option>
                    </select>
                </div>
                <div>
                    <label style="display:block;margin-bottom:6px;font-size:13px;">回复内容 *</label>
                    <textarea id="reply-content" rows="4" placeholder="请输入回复内容..." style="width:100%;padding:8px 10px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;box-sizing:border-box;resize:vertical;"></textarea>
                </div>
            </div>
        `, async () => {
            const s = document.getElementById('reply-status').value;
            const content = document.getElementById('reply-content').value.trim();
            if (!content) { showToast('请填写回复内容', 'warning'); return; }
            try {
                if (s === 'completed') await window.AppealAPI.close(id, content);
                else await window.AppealAPI.reply(id, content);
                const idx = state.list.findIndex(x => x.id === id);
                if (idx >= 0) { state.list[idx].status = s; state.list[idx].handle_result = content; }
                showToast('回复成功', 'success');
                render();
            } catch (e) { showToast('回复失败：' + e.message, 'error'); }
        });
    };

    render();
}

/* =========================================================
 * 5. 共享物品
 * ========================================================= */
async function initSharesPage() {
    if (!checkLoginAdmin()) return;
    document.body.innerHTML = renderLayout('shares', '共享物品管理');
    const content = document.getElementById('pageContent');
    content.innerHTML = '<div style="padding:40px;text-align:center;color:#8B7B70;">数据加载中...</div>';

    let state = { list: [], status: 'all', keyword: '' };
    const data = await window.ShareAPI.list({});
    if (data && Array.isArray(data.list)) state.list = data.list;

    const catMap = { tools: '工具', books: '图书', baby: '母婴儿童', outdoor: '户外用品', kitchen: '厨房', other: '其他' };

    function statusBadge(s) {
        const map = { available: ['可借用', '#5A8A6E'], borrowed: ['已借出', '#5B8DB8'], pending: ['待审核', '#E8A838'], removed: ['已下架', '#6b6159'], posting_ban: ['禁止发布', '#D9534F'] };
        const [l, c] = map[s] || map.available;
        return badge(l, c);
    }

    function render() {
        const filtered = state.list.filter(s => {
            if (state.status !== 'all' && s.status !== state.status) return false;
            if (state.keyword) {
                const kw = state.keyword.toLowerCase();
                const hay = [s.name, s.category, s.description, s.owner_name, s.location].filter(Boolean).join(' ').toLowerCase();
                if (!hay.includes(kw)) return false;
            }
            return true;
        });
        content.innerHTML = `
            <div style="background:#fff;padding:16px 20px;border-radius:10px;border:1px solid #f0e6db;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
                <span style="font-size:13px;color:#6b6159;">状态：</span>
                <select id="share-status" style="padding:7px 10px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;background:#fff;">
                    <option value="all" ${state.status === 'all' ? 'selected' : ''}>全部</option>
                    <option value="available" ${state.status === 'available' ? 'selected' : ''}>可借用</option>
                    <option value="borrowed" ${state.status === 'borrowed' ? 'selected' : ''}>已借出</option>
                    <option value="pending" ${state.status === 'pending' ? 'selected' : ''}>待审核</option>
                    <option value="removed" ${state.status === 'removed' ? 'selected' : ''}>已下架</option>
                    <option value="posting_ban" ${state.status === 'posting_ban' ? 'selected' : ''}>禁止发布</option>
                </select>
                <input type="text" id="share-keyword" value="${escapeHtml(state.keyword)}" placeholder="搜索名称/持有人/位置" style="flex:1;min-width:200px;padding:7px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;">
                <button id="share-search" style="padding:7px 16px;background:#C45D3A;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;">搜索</button>
                <span style="color:#8B7B70;font-size:13px;margin-left:auto;">共 ${filtered.length} 件</span>
            </div>
            <div style="background:#fff;border-radius:10px;border:1px solid #f0e6db;overflow:hidden;">
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                    <thead style="background:#FAF5EE;">
                        <tr>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">ID</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">物品名称</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">分类</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">持有人</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">积分</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">状态</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">借用人</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">发布时间</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.length === 0 ? `<tr><td colspan="9" style="padding:40px;text-align:center;color:#8B7B70;">暂无共享物品</td></tr>` : filtered.map(s => `
                            <tr style="border-bottom:1px solid #f0e6db;">
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${s.id}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#2C2420;font-weight:500;">${escapeHtml(s.name || '-')}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${escapeHtml(catMap[s.category] || s.category || '其他')}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${escapeHtml(s.owner_name || '-')}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#C45D3A;font-weight:600;">${s.points_cost || s.points || 0}</td>
                                <td style="padding:12px 14px;">${statusBadge(s.status)}${s.remove_reason ? `<div style="font-size:11px;color:#6b6159;margin-top:3px;">下架：${escapeHtml(s.remove_reason)}</div>` : ''}${s.ban_reason ? `<div style="font-size:11px;color:#6b6159;margin-top:3px;">禁发：${escapeHtml(s.ban_reason)}</div>` : ''}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${escapeHtml(s.borrower_name || '-')}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${formatDate(s.create_time)}</td>
                                <td style="padding:12px 14px;font-size:13px;">
                                    ${s.status === 'pending' ? `<button onclick="approveShare(${s.id})" style="padding:4px 10px;border-radius:4px;border:1px solid #5A8A6E;background:#5A8A6E;color:#fff;cursor:pointer;font-size:12px;margin-right:4px;">通过</button>` : ''}
                                    ${s.status === 'removed' || s.status === 'posting_ban' ? `<button onclick="restoreShare(${s.id})" style="padding:4px 10px;border-radius:4px;border:1px solid #5A8A6E;background:#5A8A6E;color:#fff;cursor:pointer;font-size:12px;margin-right:4px;">恢复</button>` : ''}
                                    ${s.status !== 'removed' && s.status !== 'posting_ban' ? `<button onclick="removeShare(${s.id})" style="padding:4px 10px;border-radius:4px;border:1px solid #D9534F;background:#fff;color:#D9534F;cursor:pointer;font-size:12px;margin-right:4px;">下架</button>` : ''}
                                    ${s.status !== 'posting_ban' && s.status !== 'removed' ? `<button onclick="banPostShare(${s.id})" style="padding:4px 10px;border-radius:4px;border:1px solid #E8A838;background:#fff;color:#E8A838;cursor:pointer;font-size:12px;">禁发</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('share-status').onchange = (e) => { state.status = e.target.value; render(); };
        document.getElementById('share-keyword').oninput = (e) => { state.keyword = e.target.value; };
        document.getElementById('share-search').onclick = () => render();
    }

    window.approveShare = async (id) => {
        const idx = state.list.findIndex(x => x.id === id);
        if (idx >= 0) state.list[idx].status = 'available';
        showToast('审核通过', 'success');
        render();
    };

    window.removeShare = async (id) => {
        const s = state.list.find(x => x.id === id);
        if (!s) return;
        const mask = document.createElement('div');
        mask.style.cssText = 'position:fixed;inset:0;background:rgba(44,36,32,0.55);display:flex;align-items:center;justify-content:center;z-index:9500;padding:20px;';
        mask.innerHTML = `
            <div style="background:#fff;border-radius:12px;padding:24px;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.25);">
                <h3 style="margin:0 0 12px 0;font-size:18px;color:#2C2420;">下架物品</h3>
                <p style="font-size:13px;color:#6b6159;margin:0 0 12px 0;">确认下架物品 <strong>${escapeHtml(s.name)}</strong> 吗？</p>
                <div><label style="display:block;margin-bottom:6px;font-size:13px;font-weight:500;color:#2C2420;">下架原因</label><textarea id="rs-reason" rows="2" placeholder="请填写下架原因" style="width:100%;padding:8px 10px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;box-sizing:border-box;resize:vertical;"></textarea></div>
                <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
                    <button id="rs-cancel" style="padding:9px 18px;border-radius:6px;border:1px solid #d8cfc4;background:#fff;color:#2C2420;cursor:pointer;font-size:13px;">取消</button>
                    <button id="rs-confirm" style="padding:9px 18px;border-radius:6px;border:1px solid #D9534F;background:#D9534F;color:#fff;cursor:pointer;font-size:13px;font-weight:500;">确认下架</button>
                </div>
            </div>
        `;
        document.body.appendChild(mask);
        mask.querySelector('#rs-cancel').onclick = () => mask.remove();
        mask.querySelector('#rs-confirm').onclick = async () => {
            const reason = mask.querySelector('#rs-reason').value.trim() || '管理员下架';
            try {
                await window.ComplaintAPI.removeItem(id, reason);
                const idx = state.list.findIndex(x => x.id === id);
                if (idx >= 0) {
                    state.list[idx].status = 'removed';
                    state.list[idx].remove_reason = reason;
                    state.list[idx].removed_by = '管理员';
                }
                showToast('物品已下架', 'success');
                render();
                mask.remove();
            } catch (e) { showToast('操作失败：' + e.message, 'error'); }
        };
    };

    window.restoreShare = async (id) => {
        try {
            await window.ComplaintAPI.restoreItem(id);
            const idx = state.list.findIndex(x => x.id === id);
            if (idx >= 0) {
                state.list[idx].status = 'available';
                delete state.list[idx].remove_reason;
                delete state.list[idx].removed_by;
                delete state.list[idx].ban_reason;
                delete state.list[idx].banned_by;
                delete state.list[idx].banned_until;
            }
            showToast('物品已恢复', 'success');
            render();
        } catch (e) { showToast('操作失败：' + e.message, 'error'); }
    };

    window.banPostShare = async (id) => {
        const s = state.list.find(x => x.id === id);
        if (!s) return;
        const mask = document.createElement('div');
        mask.style.cssText = 'position:fixed;inset:0;background:rgba(44,36,32,0.55);display:flex;align-items:center;justify-content:center;z-index:9500;padding:20px;';
        mask.innerHTML = `
            <div style="background:#fff;border-radius:12px;padding:24px;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.25);">
                <h3 style="margin:0 0 12px 0;font-size:18px;color:#2C2420;">禁止发布 <span style="color:#C45D3A;">${escapeHtml(s.name)}</span></h3>
                <div style="display:flex;flex-direction:column;gap:14px;">
                    <div>
                        <label style="display:block;margin-bottom:6px;font-size:13px;font-weight:500;color:#2C2420;">禁发天数（到期自动解除）</label>
                        <select id="bps-days" style="width:100%;padding:9px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;background:#fff;">
                            <option value="3">3 天</option><option value="7" selected>7 天</option><option value="14">14 天</option><option value="30">30 天</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block;margin-bottom:6px;font-size:13px;font-weight:500;color:#2C2420;">禁发原因 *</label>
                        <textarea id="bps-reason" rows="2" placeholder="请填写禁发原因" style="width:100%;padding:8px 10px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;box-sizing:border-box;resize:vertical;"></textarea>
                    </div>
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
                    <button id="bps-cancel" style="padding:9px 18px;border-radius:6px;border:1px solid #d8cfc4;background:#fff;color:#2C2420;cursor:pointer;font-size:13px;">取消</button>
                    <button id="bps-confirm" style="padding:9px 18px;border-radius:6px;border:1px solid #D9534F;background:#D9534F;color:#fff;cursor:pointer;font-size:13px;font-weight:500;">确认禁发</button>
                </div>
            </div>
        `;
        document.body.appendChild(mask);
        mask.querySelector('#bps-cancel').onclick = () => mask.remove();
        mask.querySelector('#bps-confirm').onclick = async () => {
            const days = parseInt(mask.querySelector('#bps-days').value) || 7;
            const reason = mask.querySelector('#bps-reason').value.trim();
            if (!reason) { showToast('请填写禁发原因', 'warning'); return; }
            try {
                await window.ComplaintAPI.banItemPost(id, { ban_days: days, reason: reason, operator: '管理员' });
                const idx = state.list.findIndex(x => x.id === id);
                if (idx >= 0) {
                    state.list[idx].status = 'posting_ban';
                    state.list[idx].ban_reason = reason;
                    state.list[idx].banned_by = '管理员';
                    state.list[idx].banned_until = Date.now() + days * 86400000;
                }
                showToast('已禁止该物品发布' + days + '天', 'success');
                render();
                mask.remove();
            } catch (e) { showToast('操作失败：' + e.message, 'error'); }
        };
    };

    render();
}

/* =========================================================
 * 6. 通知发布
 * ========================================================= */
async function initNoticesPage() {
    if (!checkLoginAdmin()) return;
    document.body.innerHTML = renderLayout('notices', '通知发布管理');
    const content = document.getElementById('pageContent');
    content.innerHTML = '<div style="padding:40px;text-align:center;color:#8B7B70;">数据加载中...</div>';

    let state = { list: [], keyword: '' };
    const data = await window.NoticeAPI.list({});
    if (data && Array.isArray(data.list)) state.list = data.list;

    function render() {
        const filtered = state.list.filter(n => {
            if (!state.keyword) return true;
            const kw = state.keyword.toLowerCase();
            return [n.title, n.content, n.category].filter(Boolean).join(' ').toLowerCase().includes(kw);
        });
        content.innerHTML = `
            <div style="background:#fff;padding:20px;border-radius:10px;border:1px solid #f0e6db;margin-bottom:16px;">
                <h3 style="margin:0 0 14px 0;font-size:15px;color:#2C2420;">📢 发布新通知</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                    <input type="text" id="n-title" placeholder="通知标题 *" style="padding:8px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;">
                    <select id="n-category" style="padding:8px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;background:#fff;">
                        <option value="notice">普通通知</option>
                        <option value="water">停水通知</option>
                        <option value="power">停电通知</option>
                        <option value="event">社区活动</option>
                        <option value="maintain">维护通知</option>
                    </select>
                </div>
                <textarea id="n-content" rows="4" placeholder="通知内容 *" style="width:100%;padding:8px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;box-sizing:border-box;resize:vertical;margin-bottom:12px;"></textarea>
                <div style="text-align:right;">
                    <button id="n-publish" style="padding:8px 18px;background:#C45D3A;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">立即发布</button>
                </div>
            </div>

            <div style="background:#fff;padding:16px 20px;border-radius:10px;border:1px solid #f0e6db;margin-bottom:16px;display:flex;gap:12px;align-items:center;">
                <input type="text" id="n-keyword" value="${escapeHtml(state.keyword)}" placeholder="搜索标题/内容" style="flex:1;padding:7px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;">
                <button id="n-search" style="padding:7px 16px;background:#C45D3A;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;">搜索</button>
                <span style="color:#8B7B70;font-size:13px;">共 ${filtered.length} 条</span>
            </div>

            <div style="background:#fff;border-radius:10px;border:1px solid #f0e6db;overflow:hidden;">
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                    <thead style="background:#FAF5EE;">
                        <tr>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">ID</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">标题</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">类型</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">状态</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">发布时间</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">浏览量</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.length === 0 ? `<tr><td colspan="7" style="padding:40px;text-align:center;color:#8B7B70;">暂无通知</td></tr>` : filtered.map(n => `
                            <tr style="border-bottom:1px solid #f0e6db;">
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${n.id}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#2C2420;font-weight:500;">${escapeHtml(n.title || '-')}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${escapeHtml(n.category || '通知')}</td>
                                <td style="padding:12px 14px;font-size:13px;">${badge(n.status === 'published' ? '已发布' : '草稿', n.status === 'published' ? '#5A8A6E' : '#E8A838')}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${formatDate(n.create_time)}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#C45D3A;font-weight:600;">${n.views || 0}</td>
                                <td style="padding:12px 14px;font-size:13px;">
                                    <button onclick="viewNotice(${n.id})" style="padding:4px 10px;border-radius:4px;border:1px solid #d8cfc4;background:#fff;color:#2C2420;cursor:pointer;font-size:12px;margin-right:4px;">查看</button>
                                    <button onclick="removeNotice(${n.id})" style="padding:4px 10px;border-radius:4px;border:1px solid #D9534F;background:#D9534F;color:#fff;cursor:pointer;font-size:12px;">删除</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('n-keyword').oninput = (e) => { state.keyword = e.target.value; };
        document.getElementById('n-search').onclick = () => render();
        document.getElementById('n-publish').onclick = async () => {
            const title = document.getElementById('n-title').value.trim();
            const category = document.getElementById('n-category').value;
            const contentTxt = document.getElementById('n-content').value.trim();
            if (!title || !contentTxt) { showToast('请填写标题和内容', 'warning'); return; }
            try {
                await window.NoticeAPI.publish({ title, category, content: contentTxt, status: 'published' });
                state.list.unshift({ id: Date.now(), title, category, content: contentTxt, status: 'published', create_time: Date.now(), views: 0 });
                showToast('发布成功', 'success');
                render();
            } catch (e) { showToast('发布失败：' + e.message, 'error'); }
        };
    }

    window.viewNotice = (id) => {
        const n = state.list.find(x => x.id === id);
        if (!n) return;
        showConfirm('通知详情 - ' + escapeHtml(n.title), `
            <div style="line-height:1.9;font-size:13px;">
                <div><strong>类型：</strong>${escapeHtml(n.category || '通知')} ｜ <strong>状态：</strong>${badge(n.status === 'published' ? '已发布' : '草稿', n.status === 'published' ? '#5A8A6E' : '#E8A838')}</div>
                <div><strong>发布时间：</strong>${formatDate(n.create_time)} ｜ <strong>浏览量：</strong>${n.views || 0}</div>
                <div style="margin-top:10px;padding:12px 14px;background:#FAF5EE;border-radius:6px;white-space:pre-wrap;">${escapeHtml(n.content || '')}</div>
            </div>
        `);
    };

    window.removeNotice = (id) => {
        showConfirm('删除通知', '<p>确定要删除该通知吗？此操作不可撤销。</p>', async () => {
            try {
                await window.NoticeAPI.remove(id);
                const idx = state.list.findIndex(x => x.id === id);
                if (idx >= 0) state.list.splice(idx, 1);
                showToast('删除成功', 'success');
                render();
            } catch (e) { showToast('删除失败：' + e.message, 'error'); }
        });
    };

    render();
}

/* =========================================================
 * 7. 独居老人
 * ========================================================= */
async function initElderlyPage() {
    if (!checkLoginAdmin()) return;
    document.body.innerHTML = renderLayout('elderly', '独居老人监测');
    const content = document.getElementById('pageContent');
    content.innerHTML = '<div style="padding:40px;text-align:center;color:#8B7B70;">数据加载中...</div>';

    let state = { list: [] };
    const data = await window.ElderlyAPI.list();
    if (data && Array.isArray(data.list)) state.list = data.list;

    function alertBadge(a) {
        const map = { normal: ['正常', '#5A8A6E'], warning: ['关注', '#E8A838'], danger: ['预警', '#D9534F'] };
        const [l, c] = map[a] || map.normal;
        return badge(l, c);
    }

    function render() {
        content.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;">
                ${state.list.map(e => `
                    <div style="background:#fff;padding:20px;border-radius:10px;border:1px solid #f0e6db;border-left:5px solid ${e.alert_level === 'danger' ? '#D9534F' : e.alert_level === 'warning' ? '#E8A838' : '#5A8A6E'};box-shadow:0 2px 8px rgba(196,93,58,0.05);">
                        <div style="display:flex;align-items:flex-start;gap:14px;">
                            <div style="width:50px;height:50px;border-radius:50%;background:${e.alert_level === 'danger' ? '#F8D7DA' : e.alert_level === 'warning' ? '#FBF1D9' : '#E3F0E6'};color:${e.alert_level === 'danger' ? '#D9534F' : e.alert_level === 'warning' ? '#E8A838' : '#5A8A6E'};display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">👴</div>
                            <div style="flex:1;min-width:0;">
                                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
                                    <h3 style="margin:0;font-size:16px;color:#2C2420;">${escapeHtml(e.name || '-')}</h3>${alertBadge(e.alert_level)}
                                </div>
                                <div style="font-size:13px;color:#6b6159;line-height:1.9;">
                                    <div>年龄：${e.age || '-'}岁 ｜ 状态：${e.device_status === 'online' ? '设备在线' : '设备离线'}</div>
                                    <div>住址：${escapeHtml(e.building || '-')}</div>
                                    <div>电话：${escapeHtml(e.phone || '-')}</div>
                                    <div>紧急联系人：${escapeHtml(e.emergency_contact || '-')}</div>
                                    <div>最近活动：${formatDate(e.last_activity)}</div>
                                </div>
                                ${e.health_note ? `<div style="margin-top:10px;padding:10px 12px;background:#FAF5EE;border-radius:6px;font-size:12.5px;color:#6b6159;line-height:1.7;">健康备注：${escapeHtml(e.health_note)}</div>` : ''}
                                <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap;">
                                    ${e.alert_level !== 'normal' ? `<button onclick="dismissAlert(${e.id})" style="padding:5px 12px;border-radius:4px;border:1px solid #5A8A6E;background:#5A8A6E;color:#fff;cursor:pointer;font-size:12px;">解除预警</button>` : ''}
                                    <button onclick="viewElderly(${e.id})" style="padding:5px 12px;border-radius:4px;border:1px solid #d8cfc4;background:#fff;color:#2C2420;cursor:pointer;font-size:12px;">详情</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    window.dismissAlert = (id) => {
        showConfirm('解除预警', '<p>确定解除该老人当前预警状态吗？请确认已上门查看或联系。</p>', async () => {
            try {
                await window.ElderlyAPI.dismissAlert(id, '管理员解除');
                const idx = state.list.findIndex(x => x.id === id);
                if (idx >= 0) state.list[idx].alert_level = 'normal';
                showToast('已解除预警', 'success');
                render();
            } catch (e) { showToast('操作失败：' + e.message, 'error'); }
        });
    };

    window.viewElderly = async (id) => {
        const e = state.list.find(x => x.id === id) || (await window.ElderlyAPI.detail(id));
        if (!e) { showToast('获取失败', 'error'); return; }
        showConfirm('老人详情 - ' + escapeHtml(e.name || ''), `
            <div style="line-height:2;font-size:13px;">
                <div><strong>姓名：</strong>${escapeHtml(e.name || '-')} ｜ <strong>年龄：</strong>${e.age || '-'}岁</div>
                <div><strong>联系电话：</strong>${escapeHtml(e.phone || '-')}</div>
                <div><strong>住址：</strong>${escapeHtml(e.building || '-')}</div>
                <div><strong>紧急联系人：</strong>${escapeHtml(e.emergency_contact || '-')}</div>
                <div><strong>设备状态：</strong>${badge(e.device_status === 'online' ? '在线' : '离线', e.device_status === 'online' ? '#5A8A6E' : '#6b6159')} ｜ <strong>预警等级：</strong>${alertBadge(e.alert_level)}</div>
                <div><strong>最近活动时间：</strong>${formatDate(e.last_activity)}</div>
                ${e.health_note ? `<div style="margin-top:10px;padding:12px 14px;background:#FAF5EE;border-radius:6px;line-height:1.7;"><strong>健康备注：</strong>${escapeHtml(e.health_note)}</div>` : ''}
            </div>
        `);
    };

    render();
}

/* =========================================================
 * 8. 用户管理
 * ========================================================= */
async function initUsersPage() {
    if (!checkLoginAdmin()) return;
    document.body.innerHTML = renderLayout('users', '用户管理');
    const content = document.getElementById('pageContent');
    content.innerHTML = '<div style="padding:40px;text-align:center;color:#8B7B70;">数据加载中...</div>';

    let state = { list: [], keyword: '', status: 'all' };
    const data = await window.UserAPI.list({});
    if (data && Array.isArray(data.list)) state.list = data.list;

    function roleBadge(r) {
        const map = { admin: ['管理员', '#D9534F'], grid: ['网格员', '#5B8DB8'], resident: ['居民', '#5A8A6E'] };
        const [l, c] = map[r] || map.resident;
        return badge(l, c);
    }

    function render() {
        const filtered = state.list.filter(u => {
            if (state.status !== 'all' && u.status !== state.status) return false;
            if (state.keyword) {
                const kw = state.keyword.toLowerCase();
                if (![u.name, u.phone, u.building].filter(Boolean).join(' ').toLowerCase().includes(kw)) return false;
            }
            return true;
        });
        function userStatusBadge(u) {
            const s = u.status;
            if (s === 'banned') {
                const until = u.banned_until ? formatDate(u.banned_until) : '';
                return badge('封禁中' + (until ? ' (' + until + ')' : ''), '#D9534F');
            }
            if (s === 'permanent_ban') return badge('永久封禁', '#6b6159');
            if (s === 'inactive') return badge('已禁用', '#8B7B70');
            if (s === 'pending') return badge('待审核', '#E8A838');
            return badge('正常', '#5A8A6E');
        }
        content.innerHTML = `
            <div style="background:#fff;padding:16px 20px;border-radius:10px;border:1px solid #f0e6db;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
                <select id="u-status" style="padding:7px 10px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;background:#fff;">
                    <option value="all" ${state.status === 'all' ? 'selected' : ''}>全部状态</option>
                    <option value="active" ${state.status === 'active' ? 'selected' : ''}>正常</option>
                    <option value="banned" ${state.status === 'banned' ? 'selected' : ''}>临时封号</option>
                    <option value="permanent_ban" ${state.status === 'permanent_ban' ? 'selected' : ''}>永久封禁</option>
                    <option value="inactive" ${state.status === 'inactive' ? 'selected' : ''}>已禁用</option>
                </select>
                <input type="text" id="u-keyword" value="${escapeHtml(state.keyword)}" placeholder="搜索姓名/手机号/住址" style="flex:1;min-width:200px;padding:7px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;">
                <button id="u-search" style="padding:7px 16px;background:#C45D3A;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;">搜索</button>
                <span style="color:#8B7B70;font-size:13px;margin-left:auto;">共 ${filtered.length} 人</span>
            </div>
            <div style="background:#fff;border-radius:10px;border:1px solid #f0e6db;overflow:hidden;">
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                    <thead style="background:#FAF5EE;">
                        <tr>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">ID</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">姓名</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">手机号</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">住址</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">角色</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">积分</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">注册时间</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">状态</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.length === 0 ? `<tr><td colspan="9" style="padding:40px;text-align:center;color:#8B7B70;">暂无用户</td></tr>` : filtered.map(u => `
                            <tr style="border-bottom:1px solid #f0e6db;">
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${u.id}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#2C2420;font-weight:500;">${escapeHtml(u.name || '-')}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${escapeHtml(u.phone || '-')}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${escapeHtml(u.building || '-')}</td>
                                <td style="padding:12px 14px;">${roleBadge(u.role)}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#C45D3A;font-weight:600;">${u.points || 0}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${formatDate(u.create_time)}</td>
                                <td style="padding:12px 14px;font-size:13px;">${userStatusBadge(u)}${u.ban_reason ? `<div style="font-size:11px;color:#6b6159;margin-top:3px;">原因：${escapeHtml(u.ban_reason)}</div>` : ''}</td>
                                <td style="padding:12px 14px;font-size:13px;">
                                    ${u.role !== 'admin' ? `
                                        <button onclick="window.viewUser(${u.id})" style="padding:5px 12px;border-radius:5px;border:1px solid #5B8DB8;background:#fff;color:#5B8DB8;cursor:pointer;font-size:12px;margin-right:4px;">详情</button>
                                        ${(u.status === 'banned' || u.status === 'permanent_ban') ? `
                                            <button onclick="window.unbanUser(${u.id})" style="padding:5px 12px;border-radius:5px;border:1px solid #5A8A6E;background:#5A8A6E;color:#fff;cursor:pointer;font-size:12px;margin-right:4px;">解除封禁</button>
                                        ` : `
                                            <button onclick="window.banUserDialog(${u.id})" style="padding:5px 12px;border-radius:5px;border:1px solid #D9534F;background:#fff;color:#D9534F;cursor:pointer;font-size:12px;">封号</button>
                                        `}
                                    ` : '<span style="color:#6b6159;font-size:12px;">系统账户</span>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('u-status').onchange = (e) => { state.status = e.target.value; render(); };
        document.getElementById('u-keyword').oninput = (e) => { state.keyword = e.target.value; };
        document.getElementById('u-search').onclick = () => render();

        window.viewUser = (id) => {
            const u = state.list.find(x => x.id === id);
            if (!u) return;
            let extra = '';
            if (u.status === 'banned' || u.status === 'permanent_ban') {
                extra = `<div style="margin-top:10px;background:#FFF5EE;border:1px solid #F5DCC8;border-radius:6px;padding:10px;line-height:2;">
                    <div style="font-weight:600;color:#C45D3A;margin-bottom:4px;">⚠️ 处罚记录</div>
                    <div><strong>状态：</strong>${u.status === 'permanent_ban' ? '永久封禁' : '临时封号'}</div>
                    ${u.ban_reason ? `<div><strong>原因：</strong>${escapeHtml(u.ban_reason)}</div>` : ''}
                    ${u.banned_by ? `<div><strong>操作人：</strong>${escapeHtml(u.banned_by)}</div>` : ''}
                    ${u.banned_until ? `<div><strong>到期时间：</strong>${formatDate(u.banned_until)}</div>` : '<div><strong>到期时间：</strong>永不解除</div>'}
                </div>`;
            }
            showConfirm(`用户详情 · ${u.name}`, `
                <div style="line-height:2.2;font-size:13px;">
                    <div><strong>ID：</strong>${u.id}</div>
                    <div><strong>姓名：</strong>${escapeHtml(u.name || '-')}</div>
                    <div><strong>手机号：</strong>${escapeHtml(u.phone || '-')}</div>
                    <div><strong>住址：</strong>${escapeHtml(u.building || '-')}</div>
                    <div><strong>角色：</strong>${roleBadge(u.role)}</div>
                    <div><strong>积分：</strong><span style="color:#C45D3A;font-weight:600;">${u.points || 0} 分</span></div>
                    <div><strong>注册：</strong>${formatDate(u.create_time)}</div>
                    <div><strong>状态：</strong>${userStatusBadge(u)}</div>
                    ${extra}
                </div>
            `);
        };

        window.banUserDialog = (id) => {
            const u = state.list.find(x => x.id === id);
            if (!u) return;
            const dialogId = 'ban-user-' + id;
            const mask = document.createElement('div');
            mask.id = dialogId;
            mask.style.cssText = 'position:fixed;inset:0;background:rgba(44,36,32,0.55);display:flex;align-items:center;justify-content:center;z-index:9500;padding:20px;';
            mask.innerHTML = `
                <div style="background:#fff;border-radius:12px;padding:24px;width:100%;max-width:480px;box-shadow:0 20px 60px rgba(0,0,0,0.25);">
                    <h3 style="margin:0 0 12px 0;font-size:18px;color:#2C2420;">对 <span style="color:#C45D3A;">${escapeHtml(u.name)}</span> 执行封号</h3>
                    <div style="display:flex;flex-direction:column;gap:14px;">
                        <div>
                            <label style="display:block;margin-bottom:6px;font-size:13px;font-weight:500;color:#2C2420;">封号方式</label>
                            <select id="bu-type" style="width:100%;padding:9px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;background:#fff;">
                                <option value="temporary">临时封号（可选天数，到期自动解除）</option>
                                <option value="permanent">永久封号（永不自动解除）</option>
                            </select>
                        </div>
                        <div id="bu-days-wrap">
                            <label style="display:block;margin-bottom:6px;font-size:13px;font-weight:500;color:#2C2420;">封禁天数</label>
                            <select id="bu-days" style="width:100%;padding:9px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;background:#fff;">
                                <option value="3">3 天</option>
                                <option value="7" selected>7 天</option>
                                <option value="14">14 天</option>
                                <option value="30">30 天</option>
                            </select>
                        </div>
                        <div>
                            <label style="display:block;margin-bottom:6px;font-size:13px;font-weight:500;color:#2C2420;">封号原因 *</label>
                            <textarea id="bu-reason" rows="2" placeholder="请说明封号原因（将记录在案）" style="width:100%;padding:9px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;box-sizing:border-box;resize:vertical;"></textarea>
                        </div>
                    </div>
                    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
                        <button id="bu-cancel" style="padding:9px 18px;border-radius:6px;border:1px solid #d8cfc4;background:#fff;color:#2C2420;cursor:pointer;font-size:13px;">取消</button>
                        <button id="bu-confirm" style="padding:9px 18px;border-radius:6px;border:1px solid #D9534F;background:#D9534F;color:#fff;cursor:pointer;font-size:13px;font-weight:500;">确认封号</button>
                    </div>
                </div>
            `;
            document.body.appendChild(mask);
            mask.querySelector('#bu-type').onchange = (e) => {
                mask.querySelector('#bu-days-wrap').style.display = (e.target.value === 'permanent') ? 'none' : 'block';
            };
            mask.querySelector('#bu-cancel').onclick = () => mask.remove();
            mask.querySelector('#bu-confirm').onclick = async () => {
                const type = mask.querySelector('#bu-type').value;
                const days = parseInt(mask.querySelector('#bu-days').value) || 7;
                const reason = mask.querySelector('#bu-reason').value.trim();
                if (!reason) { showToast('请填写封号原因', 'warning'); return; }
                try {
                    await window.ComplaintAPI.banUser(id, {
                        ban_days: type === 'permanent' ? -1 : days,
                        permanent: type === 'permanent',
                        reason: reason,
                        operator: '管理员'
                    });
                    const idx = state.list.findIndex(x => x.id === id);
                    if (idx >= 0) {
                        state.list[idx].status = type === 'permanent' ? 'permanent_ban' : 'banned';
                        state.list[idx].ban_reason = reason;
                        state.list[idx].banned_by = '管理员';
                        state.list[idx].ban_time = Date.now();
                        if (type !== 'permanent') state.list[idx].banned_until = Date.now() + days * 86400000;
                    }
                    showToast(type === 'permanent' ? '已永久封号' : ('已封号' + days + '天'), 'success');
                    render();
                    mask.remove();
                } catch (e) { showToast('操作失败：' + e.message, 'error'); }
            };
        };

        window.unbanUser = (id) => {
            const u = state.list.find(x => x.id === id);
            if (!u) return;
            showConfirm('解除封禁', `<p>确认解除用户 <strong>${escapeHtml(u.name)}</strong> 的封禁吗？解除后该用户可正常登录。</p>`, async () => {
                try {
                    await window.ComplaintAPI.unbanUser(id);
                    const idx = state.list.findIndex(x => x.id === id);
                    if (idx >= 0) {
                        state.list[idx].status = 'active';
                        delete state.list[idx].ban_reason;
                        delete state.list[idx].banned_until;
                        delete state.list[idx].banned_by;
                        delete state.list[idx].ban_time;
                    }
                    showToast('已解除封禁', 'success');
                    render();
                } catch (e) { showToast('操作失败：' + e.message, 'error'); }
            });
        };

        window.toggleUser = (id, currentStatus) => {
            const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
            const action = nextStatus === 'inactive' ? '禁用' : '启用';
            showConfirm(`${action}账户`, `<p>确认要${action}该账户吗？${nextStatus === 'inactive' ? '被禁用的账户将无法登录系统。' : '启用后该账户可正常登录。'}</p>`, () => {
                const idx = state.list.findIndex(u => u.id === id);
                if (idx >= 0) {
                    state.list[idx].status = nextStatus;
                    render();
                    showToast('操作成功', 'success');
                }
            });
        };
    }
    render();
}

/* =========================================================
 * 9. 用户审核
 * ========================================================= */
async function initReviewPage() {
    if (!checkLoginAdmin()) return;
    document.body.innerHTML = renderLayout('review', '用户审核');
    const content = document.getElementById('pageContent');
    content.innerHTML = '<div style="padding:40px;text-align:center;color:#8B7B70;">数据加载中...</div>';

    let state = { list: [] };
    const allData = await window.UserAPI.list({});
    if (allData && Array.isArray(allData.list)) {
        state.list = allData.list.filter(u => u.status === 'pending' || u.status === undefined || u.id > 100);
    }
    if (state.list.length === 0) {
        state.list = [
            { id: 901, name: '周建军', phone: '13900139101', building: '4号楼1单元301', role: 'resident', id_card: '110101198001011234', status: 'pending', create_time: Date.now() - 3600000 * 5 },
            { id: 902, name: '吴静', phone: '13900139102', building: '6号楼2单元502', role: 'resident', id_card: '110101199003034567', status: 'pending', create_time: Date.now() - 86400000 },
            { id: 903, name: '孙涛', phone: '13900139103', building: '7号楼3单元201', role: 'grid', id_card: '110101198505057890', status: 'pending', create_time: Date.now() - 3600000 * 18 }
        ];
    }

    function roleBadge(r) {
        const map = { grid: ['网格员', '#5B8DB8'], resident: ['居民', '#5A8A6E'] };
        const [l, c] = map[r] || map.resident;
        return badge(l, c);
    }

    function render() {
        content.innerHTML = `
            <div style="background:#fff;padding:16px 20px;border-radius:10px;border:1px solid #f0e6db;margin-bottom:16px;">
                <div style="font-size:13px;color:#6b6159;">共 <span style="color:#C45D3A;font-weight:700;font-size:16px;">${state.list.length}</span> 位待审核用户</div>
            </div>
            <div style="background:#fff;border-radius:10px;border:1px solid #f0e6db;overflow:hidden;">
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                    <thead style="background:#FAF5EE;">
                        <tr>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">ID</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">姓名</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">手机号</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">住址</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">申请角色</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">身份证号</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">申请时间</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.list.length === 0 ? `<tr><td colspan="8" style="padding:60px;text-align:center;color:#5A8A6E;font-size:14px;">✅ 暂无待审核用户，工作辛苦啦！</td></tr>` : state.list.map(u => `
                            <tr style="border-bottom:1px solid #f0e6db;">
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${u.id}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#2C2420;font-weight:500;">${escapeHtml(u.name)}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${escapeHtml(u.phone)}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${escapeHtml(u.building)}</td>
                                <td style="padding:12px 14px;">${roleBadge(u.role)}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;font-family:monospace;">${escapeHtml(u.id_card || '-')}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${formatDate(u.create_time)}</td>
                                <td style="padding:12px 14px;font-size:13px;">
                                    <button onclick="doApprove(${u.id})" style="padding:4px 10px;border-radius:4px;border:1px solid #5A8A6E;background:#5A8A6E;color:#fff;cursor:pointer;font-size:12px;margin-right:4px;">通过</button>
                                    <button onclick="doReject(${u.id})" style="padding:4px 10px;border-radius:4px;border:1px solid #D9534F;background:#D9534F;color:#fff;cursor:pointer;font-size:12px;">拒绝</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    window.doApprove = (id) => {
        const u = state.list.find(x => x.id === id);
        showConfirm('审核通过', `<p>确认通过用户 <strong>${escapeHtml(u ? u.name : '')}</strong> 的注册申请吗？</p>`, async () => {
            try {
                await window.UserAPI.review(id, true, '审核通过');
                state.list = state.list.filter(x => x.id !== id);
                showToast('已通过用户申请', 'success');
                render();
            } catch (e) { showToast('操作失败：' + e.message, 'error'); }
        });
    };

    window.doReject = (id) => {
        const u = state.list.find(x => x.id === id);
        showConfirm('拒绝申请', `<p>确认拒绝用户 <strong>${escapeHtml(u ? u.name : '')}</strong> 的注册申请吗？</p>`, async () => {
            try {
                await window.UserAPI.review(id, false, '审核拒绝');
                state.list = state.list.filter(x => x.id !== id);
                showToast('已拒绝', 'success');
                render();
            } catch (e) { showToast('操作失败：' + e.message, 'error'); }
        });
    };

    render();
}


/* =========================================================
 * 10. AI隐患检测面板
 * ========================================================= */
async function initDetectionPage() {
    if (!checkLoginAdmin()) return;
    document.body.innerHTML = renderLayout('detection', 'AI隐患检测面板');
    const content = document.getElementById('pageContent');
    content.innerHTML = '<div style="padding:40px;text-align:center;color:#8B7B70;">数据加载中...</div>';

    const [stats, cams, events] = await Promise.all([
        window.DetectionAPI.getStats(),
        window.DetectionAPI.getCameras(),
        window.DetectionAPI.getEvents()
    ]).catch(() => [null, [], []]);

    const s = stats || {};

    // 顶部统计卡片
    const cardData = [
        { icon: '📹', title: '监控摄像头', value: s.totalCameras || 18, sub: '在线 ' + (s.onlineCameras || 16) + ' 台', color: '#5B8DB8' },
        { icon: '⚠️', title: '今日AI识别告警', value: s.todayAlerts || 14, sub: '较昨日 ' + (s.compare || '+3'), color: '#E8A838' },
        { icon: '🛑', title: '高优先级', value: s.highRisk || 2, sub: '需立即处理', color: '#D9534F' },
        { icon: '✅', title: '已处理', value: s.resolved || 12, sub: '今日处理率 ' + (s.rate || '85%'), color: '#5A8A6E' }
    ];

    function typeLabel(t) {
        const map = {
            child: ['儿童靠近电梯井', '#D9534F'],
            clutter: ['楼道杂物堆积', '#E8A838'],
            ev_bike: ['楼道电动车', '#D9534F'],
            ev_lift: ['电梯内电动车', '#D9534F'],
            fire: ['烟雾/火情', '#D9534F'],
            fall: ['老人摔倒', '#D9534F'],
            intruder: ['可疑人员', '#E8A838']
        };
        return map[t] || ['其他异常', '#6b6159'];
    }

    function statusBadge(st) {
        const map = { active: ['告警中', '#D9534F'], acknowledged: ['已确认', '#E8A838'], resolved: ['已处理', '#5A8A6E'] };
        const [l, c] = map[st] || map.active;
        return badge(l, c);
    }

    content.innerHTML = `
        <!-- 顶部统计 -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:16px;">
            ${cardData.map(c => `
                <div style="background:#fff;padding:18px 20px;border-radius:10px;border:1px solid #f0e6db;box-shadow:0 2px 8px rgba(196,93,58,0.06);">
                    <div style="display:flex;align-items:center;gap:14px;">
                        <div style="width:48px;height:48px;border-radius:10px;background:${c.color}20;color:${c.color};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">${c.icon}</div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:13px;color:#6b6159;">${c.title}</div>
                            <div style="font-size:22px;font-weight:700;color:#2C2420;margin-top:2px;">${c.value}</div>
                            <div style="font-size:12px;color:#8B7B70;margin-top:4px;">${c.sub}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>

        <!-- 摄像头网格 -->
        <div style="background:#fff;padding:20px;border-radius:10px;border:1px solid #f0e6db;margin-bottom:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
                <h3 style="margin:0;font-size:16px;color:#2C2420;">📹 社区监控摄像头（点击卡片可管理设备）</h3>
                <div style="display:flex;align-items:center;gap:15px;flex-wrap:wrap;">
                    <div style="font-size:12px;color:#6b6159;">
                        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#5A8A6E;margin-right:4px;"></span>在线
                        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#D9534F;margin-left:12px;margin-right:4px;"></span>告警
                        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#6b6159;margin-left:12px;margin-right:4px;"></span>离线
                    </div>
                    <button id="btn-add-camera" style="padding:7px 14px;background:#C45D3A;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;">➕ 添加设备</button>
                </div>
            </div>
            <div id="camera-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">
                ${(cams && cams.length ? cams : []).map(cam => {
                    const borderColor = cam.status === 'alert' ? '#D9534F' : cam.status === 'online' ? '#5B8DB8' : '#6b6159';
                    const statusIcon = cam.status === 'alert' ? '🔴' : cam.status === 'online' ? '🟢' : '⚫';
                    return `
                    <div style="border:2px solid ${borderColor};border-radius:10px;overflow:hidden;background:#1a1a1a;cursor:pointer;box-shadow:0 2px 8px rgba(196,93,58,0.1);" onclick="window.openCameraDialog('${cam.id}')">
                        <div style="position:relative;aspect-ratio:16/10;background:linear-gradient(135deg,#2a2a2a 0%,#1a1a1a 100%);display:flex;align-items:center;justify-content:center;">
                            <div style="font-size:48px;opacity:0.4;">${cam.icon || '📹'}</div>
                            <div style="position:absolute;top:8px;left:8px;color:#fff;font-size:11px;background:rgba(0,0,0,0.6);padding:3px 8px;border-radius:4px;letter-spacing:0.5px;">
                                ${statusIcon} ${cam.status === 'alert' ? 'AI 识别告警' : cam.status === 'online' ? '实时监控中' : '设备离线'}
                            </div>
                            ${cam.lastDetect ? `<div style="position:absolute;top:8px;right:8px;color:#D9534F;font-size:10px;background:rgba(217,83,79,0.15);padding:3px 8px;border-radius:4px;white-space:nowrap;">⚠️ ${escapeHtml(cam.lastDetect)}</div>` : ''}
                            <div style="position:absolute;bottom:8px;right:8px;color:#fff;font-size:10px;background:rgba(0,0,0,0.6);padding:3px 8px;border-radius:4px;font-family:monospace;">LIVE</div>
                        </div>
                        <div style="padding:10px 12px;background:#fff;border-top:1px solid #f0e6db;">
                            <div style="font-size:13px;font-weight:600;color:#2C2420;margin-bottom:3px;">${escapeHtml(cam.name)}</div>
                            <div style="font-size:12px;color:#6b6159;">📍 ${escapeHtml(cam.location)}</div>
                            <div style="font-size:11px;color:#8B7B70;margin-top:5px;">识别类型: ${(cam.types || ['杂物','电动车']).map(t => `<span style="display:inline-block;background:#F8F9FA;color:#2C2420;padding:2px 6px;border-radius:3px;margin-right:3px;margin-top:3px;">${t}</span>`).join('')}</div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>

        <!-- AI识别事件列表 -->
        <div style="background:#fff;padding:20px;border-radius:10px;border:1px solid #f0e6db;margin-bottom:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <h3 style="margin:0;font-size:16px;color:#2C2420;">⚠️ AI 识别告警记录（自动派单）</h3>
                <div style="font-size:12px;color:#6b6159;">
                    模型: 社区安全 YOLO-v8 · 准确率 96.3% · 响应 < 1.5s
                </div>
            </div>
            <div style="border:1px solid #f0e6db;border-radius:8px;overflow:hidden;">
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                    <thead style="background:#FAF5EE;">
                        <tr>
                            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#2C2420;border-bottom:2px solid #f0e6db;">告警时间</th>
                            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#2C2420;border-bottom:2px solid #f0e6db;">识别类型</th>
                            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#2C2420;border-bottom:2px solid #f0e6db;">摄像头/位置</th>
                            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#2C2420;border-bottom:2px solid #f0e6db;">置信度</th>
                            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#2C2420;border-bottom:2px solid #f0e6db;">状态</th>
                            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#2C2420;border-bottom:2px solid #f0e6db;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(events && events.length ? events : []).map(e => {
                            const [tl, tc] = typeLabel(e.type);
                            return `
                            <tr style="border-bottom:1px solid #f0e6db;">
                                <td style="padding:10px 12px;font-size:12px;color:#6b6159;font-family:monospace;">${formatDate(e.time)}</td>
                                <td style="padding:10px 12px;font-size:13px;">
                                    ${badge(tl, tc)}
                                </td>
                                <td style="padding:10px 12px;font-size:13px;color:#2C2420;">${escapeHtml(e.camera)} · ${escapeHtml(e.location)}</td>
                                <td style="padding:10px 12px;">
                                    <div style="display:flex;align-items:center;gap:6px;">
                                        <div style="flex:1;background:#f5efe6;border-radius:3px;height:8px;overflow:hidden;max-width:80px;">
                                            <div style="height:100%;width:${Math.round(e.confidence * 100)}%;background:${e.confidence > 0.85 ? '#D9534F' : e.confidence > 0.7 ? '#E8A838' : '#5B8DB8'};"></div>
                                        </div>
                                        <span style="font-size:12px;font-weight:600;color:#2C2420;">${Math.round(e.confidence * 100)}%</span>
                                    </div>
                                </td>
                                <td style="padding:10px 12px;font-size:13px;">${statusBadge(e.status)}</td>
                                <td style="padding:10px 12px;font-size:13px;">
                                    <button onclick="viewEvent(${e.id})" style="padding:4px 10px;border-radius:4px;border:1px solid #5B8DB8;background:#fff;color:#5B8DB8;cursor:pointer;font-size:12px;margin-right:4px;">详情</button>
                                    ${e.status !== 'resolved' ? `<button onclick="resolveEvent(${e.id})" style="padding:4px 10px;border-radius:4px;border:1px solid #5A8A6E;background:#5A8A6E;color:#fff;cursor:pointer;font-size:12px;">标记处理</button>` : ''}
                                    ${e.orderId ? `<a href="workorders.html" style="display:inline-block;padding:4px 10px;border-radius:4px;border:1px solid #C45D3A;color:#C45D3A;font-size:12px;text-decoration:none;">查看工单</a>` : ''}
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 识别类型分布 -->
        <div style="background:#fff;padding:20px;border-radius:10px;border:1px solid #f0e6db;">
            <h3 style="margin:0 0 14px 0;font-size:16px;color:#2C2420;">📈 今日识别类型分布（AI 识别统计）</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
                ${(s.breakdown || [
                    { label: '楼道杂物堆积', count: 5, color: '#E8A838', icon: '📦' },
                    { label: '楼道内电动车', count: 3, color: '#D9534F', icon: '🛵' },
                    { label: '电梯内电动车', count: 2, color: '#D9534F', icon: '🎢' },
                    { label: '儿童靠近电梯井', count: 1, color: '#D9534F', icon: '👶' },
                    { label: '可疑人员徘徊', count: 2, color: '#E8A838', icon: '👀' },
                    { label: '消防通道占用', count: 1, color: '#D9534F', icon: '🚧' }
                ]).map(item => `
                    <div style="padding:14px;border:1px solid #f0e6db;border-radius:8px;background:#FAF9F7;">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                            <span style="font-size:20px;">${item.icon}</span>
                            <span style="font-size:13px;font-weight:600;color:#2C2420;flex:1;">${item.label}</span>
                            <span style="font-size:16px;font-weight:700;color:${item.color};">${item.count}</span>
                        </div>
                        <div style="background:#f5efe6;border-radius:3px;height:8px;overflow:hidden;">
                            <div style="height:100%;width:${Math.min(100, Math.round((item.count / (s.todayAlerts || 14)) * 100))}%;background:${item.color};"></div>
                        </div>
                        <div style="font-size:11px;color:#8B7B70;margin-top:6px;">占比 ${Math.round((item.count / (s.todayAlerts || 14)) * 100)}%</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // 事件操作
    window.viewEvent = (id) => {
        const ev = (events || []).find(e => e.id === id);
        if (!ev) return;
        const [tl] = typeLabel(ev.type);
        showConfirm(`AI 识别告警详情 - #${id}`, `
            <div style="line-height:2;font-size:13px;">
                <div><strong>识别类型：</strong>${tl}</div>
                <div><strong>发生时间：</strong>${formatDate(ev.time)}</div>
                <div><strong>摄像头：</strong>${escapeHtml(ev.camera)} (${escapeHtml(ev.location)})</div>
                <div><strong>AI 置信度：</strong>${Math.round(ev.confidence * 100)}%</div>
                <div><strong>状态：</strong>${statusBadge(ev.status)}</div>
                ${ev.description ? `<div style="margin-top:8px;padding:10px 12px;background:#FAF5EE;border-radius:6px;line-height:1.7;"><strong>AI 描述：</strong>${escapeHtml(ev.description)}</div>` : ''}
                <div style="margin-top:10px;padding:10px 12px;background:#FFF5F0;border-left:3px solid #E8A838;border-radius:4px;font-size:12.5px;line-height:1.7;">
                    💡 <strong>系统建议：</strong>自动派发给对应网格网格员，同时通知物业保安前往核实；如 10 分钟内未响应，将升级通知值班主管。
                </div>
            </div>
        `);
    };

    window.resolveEvent = (id) => {
        showConfirm('标记处理', '<p>确认该安全隐患已处理完毕吗？操作后状态将更新为「已处理」，并关闭相关工单。</p>', () => {
            const idx = (events || []).findIndex(e => e.id === id);
            if (idx >= 0 && events[idx]) events[idx].status = 'resolved';
            showToast('已标记为处理', 'success');
            initDetectionPage();
        });
    };

    window.cameraState = { list: cams || [] };

    // 渲染摄像头网格
    function renderCameraGrid() {
        const grid = document.getElementById('camera-grid');
        if (!grid) return;
        const list = window.cameraState.list;
        grid.innerHTML = list.map(cam => {
            const borderColor = cam.status === 'alert' ? '#D9534F' : cam.status === 'online' ? '#5B8DB8' : '#6b6159';
            const statusIcon = cam.status === 'alert' ? '🔴' : cam.status === 'online' ? '🟢' : '⚫';
            return `
                <div style="border:2px solid ${borderColor};border-radius:10px;overflow:hidden;background:#1a1a1a;cursor:pointer;box-shadow:0 2px 8px rgba(196,93,58,0.1);" onclick="window.openCameraDialog('${cam.id}')">
                    <div style="position:relative;aspect-ratio:16/10;background:linear-gradient(135deg,#2a2a2a 0%,#1a1a1a 100%);display:flex;align-items:center;justify-content:center;">
                        <div style="font-size:48px;opacity:0.4;">${cam.icon || '📹'}</div>
                        <div style="position:absolute;top:8px;left:8px;color:#fff;font-size:11px;background:rgba(0,0,0,0.6);padding:3px 8px;border-radius:4px;letter-spacing:0.5px;">
                            ${statusIcon} ${cam.status === 'alert' ? 'AI 识别告警' : cam.status === 'online' ? '实时监控中' : '设备离线'}
                        </div>
                        ${cam.lastDetect ? `<div style="position:absolute;top:8px;right:8px;color:#D9534F;font-size:10px;background:rgba(217,83,79,0.15);padding:3px 8px;border-radius:4px;white-space:nowrap;">⚠️ ${escapeHtml(cam.lastDetect)}</div>` : ''}
                        <div style="position:absolute;bottom:8px;right:8px;color:#fff;font-size:10px;background:rgba(0,0,0,0.6);padding:3px 8px;border-radius:4px;font-family:monospace;">LIVE</div>
                    </div>
                    <div style="padding:10px 12px;background:#fff;border-top:1px solid #f0e6db;">
                        <div style="font-size:13px;font-weight:600;color:#2C2420;margin-bottom:3px;">${escapeHtml(cam.name)}</div>
                        <div style="font-size:12px;color:#6b6159;">📍 ${escapeHtml(cam.location)}</div>
                        <div style="font-size:11px;color:#8B7B70;margin-top:5px;">识别类型: ${(cam.types || ['杂物','电动车']).map(t => `<span style="display:inline-block;background:#F8F9FA;color:#2C2420;padding:2px 6px;border-radius:3px;margin-right:3px;margin-top:3px;">${t}</span>`).join('')}</div>
                    </div>
                </div>`;
        }).join('');
    }

    // 添加设备按钮
    const addBtn = document.getElementById('btn-add-camera');
    if (addBtn) {
        addBtn.onclick = () => {
            const modalId = 'cam-add-modal';
            const modalHTML = `
                <div id="${modalId}" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;">
                    <div style="background:#fff;border-radius:12px;max-width:520px;width:100%;overflow:hidden;">
                        <div style="padding:18px 22px;border-bottom:1px solid #f0e6db;display:flex;align-items:center;justify-content:space-between;">
                            <h3 style="margin:0;font-size:17px;color:#2C2420;">➕ 添加监控设备</h3>
                            <button onclick="document.getElementById('${modalId}').remove()" style="background:none;border:none;font-size:22px;color:#6b6159;cursor:pointer;">×</button>
                        </div>
                        <div style="padding:22px;">
                            <div style="margin-bottom:14px;">
                                <label style="display:block;font-size:13px;color:#2C2420;margin-bottom:6px;font-weight:500;">设备名称 <span style="color:#D9534F;">*</span></label>
                                <input id="cam-input-name" type="text" placeholder="例：8号楼2单元楼道摄像头" style="width:100%;padding:9px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:14px;">
                            </div>
                            <div style="margin-bottom:14px;">
                                <label style="display:block;font-size:13px;color:#2C2420;margin-bottom:6px;font-weight:500;">安装位置 <span style="color:#D9534F;">*</span></label>
                                <input id="cam-input-loc" type="text" placeholder="例：8号楼2单元 2-3层" style="width:100%;padding:9px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:14px;">
                            </div>
                            <div style="margin-bottom:14px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                                <div>
                                    <label style="display:block;font-size:13px;color:#2C2420;margin-bottom:6px;font-weight:500;">设备编号</label>
                                    <input id="cam-input-id" type="text" placeholder="如 CAM013（可自动生成）" style="width:100%;padding:9px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:14px;">
                                </div>
                                <div>
                                    <label style="display:block;font-size:13px;color:#2C2420;margin-bottom:6px;font-weight:500;">设备状态</label>
                                    <select id="cam-input-status" style="width:100%;padding:9px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:14px;background:#fff;">
                                        <option value="online">在线</option>
                                        <option value="offline">离线</option>
                                        <option value="alert">告警</option>
                                    </select>
                                </div>
                            </div>
                            <div style="margin-bottom:14px;">
                                <label style="display:block;font-size:13px;color:#2C2420;margin-bottom:6px;font-weight:500;">启用的AI识别类型</label>
                                <div id="cam-types-wrap" style="display:flex;flex-wrap:wrap;gap:8px;padding:10px;border:1px solid #f0e6db;border-radius:6px;background:#FAF9F7;">
                                    ${['杂物','电动车','儿童','可疑人员','电梯监控','消防通道','烟雾','老人摔倒'].map(t => `
                                        <label style="display:flex;align-items:center;gap:4px;font-size:12px;color:#2C2420;cursor:pointer;padding:3px 8px;background:#fff;border:1px solid #f0e6db;border-radius:4px;">
                                            <input type="checkbox" class="cam-type-check" value="${t}" ${['杂物','电动车'].includes(t) ? 'checked' : ''}> ${t}
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                            <div style="margin-bottom:6px;">
                                <label style="display:block;font-size:13px;color:#2C2420;margin-bottom:6px;font-weight:500;">设备图标（可选）</label>
                                <div style="display:flex;flex-wrap:wrap;gap:8px;">
                                    ${['📹','🏢','🚗','🛗','🌳','🚧','🚪'].map((ic, i) => `
                                        <label style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border:2px solid ${i === 0 ? '#C45D3A' : '#f0e6db'};border-radius:6px;cursor:pointer;font-size:20px;background:${i === 0 ? '#FFF5F0' : '#fff'};" class="cam-icon-label">
                                            <input type="radio" name="cam-icon-radio" value="${ic}" style="display:none;" ${i === 0 ? 'checked' : ''}>
                                            <span>${ic}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                            <div style="margin-top:22px;display:flex;gap:10px;justify-content:flex-end;">
                                <button onclick="document.getElementById('${modalId}').remove()" style="padding:9px 18px;border:1px solid #d8cfc4;background:#fff;border-radius:6px;font-size:14px;cursor:pointer;color:#2C2420;">取消</button>
                                <button id="cam-save-btn" style="padding:9px 18px;border:none;background:#C45D3A;color:#fff;border-radius:6px;font-size:14px;cursor:pointer;font-weight:500;">保存添加</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // 图标选中样式切换
            document.querySelectorAll('.cam-icon-label').forEach(lab => {
                lab.querySelector('input').addEventListener('change', (ev) => {
                    document.querySelectorAll('.cam-icon-label').forEach(l => {
                        l.style.border = '2px solid #f0e6db';
                        l.style.background = '#fff';
                    });
                    if (ev.target.checked) {
                        lab.style.border = '2px solid #C45D3A';
                        lab.style.background = '#FFF5F0';
                    }
                });
            });

            document.getElementById('cam-save-btn').onclick = () => {
                const name = document.getElementById('cam-input-name').value.trim();
                const location = document.getElementById('cam-input-loc').value.trim();
                if (!name || !location) {
                    showToast('请填写设备名称和安装位置', 'warning');
                    return;
                }
                const status = document.getElementById('cam-input-status').value;
                let camId = document.getElementById('cam-input-id').value.trim();
                if (!camId) camId = 'CAM' + String(window.cameraState.list.length + 1).padStart(3, '0');
                const types = Array.from(document.querySelectorAll('.cam-type-check:checked')).map(i => i.value);
                const iconInput = document.querySelector('input[name="cam-icon-radio"]:checked');
                const icon = iconInput ? iconInput.value : '📹';

                window.cameraState.list.push({ id: camId, name, location, status, types, icon });
                document.getElementById(modalId).remove();
                renderCameraGrid();
                showToast('设备添加成功', 'success');
            };
        };
    }

    // 设备管理弹窗（编辑 / 删除 / 切换状态）
    window.openCameraDialog = (id) => {
        const cam = window.cameraState.list.find(c => c.id === id);
        if (!cam) return;
        const modalId = 'cam-edit-' + id;
        const existingModal = document.getElementById(modalId);
        if (existingModal) existingModal.remove();

        const modalHTML = `
            <div id="${modalId}" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;">
                <div style="background:#fff;border-radius:12px;max-width:560px;width:100%;overflow:hidden;">
                    <div style="padding:18px 22px;border-bottom:1px solid #f0e6db;display:flex;align-items:center;justify-content:space-between;">
                        <h3 style="margin:0;font-size:17px;color:#2C2420;">📹 设备管理 · ${escapeHtml(cam.name)}</h3>
                        <button onclick="document.getElementById('${modalId}').remove()" style="background:none;border:none;font-size:22px;color:#6b6159;cursor:pointer;">×</button>
                    </div>
                    <div style="padding:22px;">
                        <div style="background:#FAF9F7;padding:14px 16px;border-radius:8px;margin-bottom:16px;border:1px solid #f0e6db;">
                            <div style="font-size:13px;line-height:2;color:#2C2420;">
                                <div><strong>设备编号：</strong>${cam.id}</div>
                                <div><strong>当前状态：</strong>${badge(cam.status === 'alert' ? 'AI 告警' : cam.status === 'online' ? '在线' : '离线', cam.status === 'alert' ? '#D9534F' : cam.status === 'online' ? '#5A8A6E' : '#6b6159')}</div>
                                <div><strong>AI 识别能力：</strong>${(cam.types || []).join(' · ')}</div>
                            </div>
                        </div>

                        <div style="margin-bottom:14px;">
                            <label style="display:block;font-size:13px;color:#2C2420;margin-bottom:6px;font-weight:500;">设备名称（可编辑）</label>
                            <input id="cam-edit-name" type="text" value="${escapeHtml(cam.name)}" style="width:100%;padding:9px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:14px;">
                        </div>
                        <div style="margin-bottom:14px;">
                            <label style="display:block;font-size:13px;color:#2C2420;margin-bottom:6px;font-weight:500;">安装位置（可编辑）</label>
                            <input id="cam-edit-loc" type="text" value="${escapeHtml(cam.location)}" style="width:100%;padding:9px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:14px;">
                        </div>
                        <div style="margin-bottom:14px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                            <div>
                                <label style="display:block;font-size:13px;color:#2C2420;margin-bottom:6px;font-weight:500;">切换状态</label>
                                <select id="cam-edit-status" style="width:100%;padding:9px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:14px;background:#fff;">
                                    <option value="online" ${cam.status === 'online' ? 'selected' : ''}>🟢 在线</option>
                                    <option value="offline" ${cam.status === 'offline' ? 'selected' : ''}>⚫ 离线</option>
                                    <option value="alert" ${cam.status === 'alert' ? 'selected' : ''}>🔴 告警</option>
                                </select>
                            </div>
                            <div>
                                <label style="display:block;font-size:13px;color:#2C2420;margin-bottom:6px;font-weight:500;">最近检测信息</label>
                                <input id="cam-edit-detect" type="text" value="${escapeHtml(cam.lastDetect || '')}" placeholder="如：检测到电动车充电" style="width:100%;padding:9px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:14px;">
                            </div>
                        </div>
                        <div style="margin-bottom:16px;">
                            <label style="display:block;font-size:13px;color:#2C2420;margin-bottom:6px;font-weight:500;">AI 识别类型（可编辑）</label>
                            <div style="display:flex;flex-wrap:wrap;gap:8px;padding:10px;border:1px solid #f0e6db;border-radius:6px;background:#FAF9F7;">
                                ${['杂物','电动车','儿童','可疑人员','电梯监控','消防通道','烟雾','老人摔倒'].map(t => `
                                    <label style="display:flex;align-items:center;gap:4px;font-size:12px;color:#2C2420;cursor:pointer;padding:3px 8px;background:#fff;border:1px solid #f0e6db;border-radius:4px;">
                                        <input type="checkbox" class="cam-edit-type-check" value="${t}" ${(cam.types || []).includes(t) ? 'checked' : ''}> ${t}
                                    </label>
                                `).join('')}
                            </div>
                        </div>

                        <div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">
                            <button id="cam-delete-btn" style="padding:9px 16px;border:1px solid #D9534F;background:#fff;border-radius:6px;font-size:13px;cursor:pointer;color:#D9534F;">🗑 删除设备</button>
                            <button onclick="document.getElementById('${modalId}').remove()" style="padding:9px 16px;border:1px solid #d8cfc4;background:#fff;border-radius:6px;font-size:13px;cursor:pointer;color:#2C2420;">取消</button>
                            <button id="cam-update-btn" style="padding:9px 18px;border:none;background:#C45D3A;color:#fff;border-radius:6px;font-size:13px;cursor:pointer;font-weight:500;">💾 保存修改</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('cam-update-btn').onclick = () => {
            const newName = document.getElementById('cam-edit-name').value.trim();
            const newLoc = document.getElementById('cam-edit-loc').value.trim();
            if (!newName || !newLoc) { showToast('名称和位置不能为空', 'warning'); return; }
            cam.name = newName;
            cam.location = newLoc;
            cam.status = document.getElementById('cam-edit-status').value;
            cam.lastDetect = document.getElementById('cam-edit-detect').value.trim() || null;
            cam.types = Array.from(document.querySelectorAll('.cam-edit-type-check:checked')).map(i => i.value);
            document.getElementById(modalId).remove();
            renderCameraGrid();
            showToast('已保存设备信息', 'success');
        };

        document.getElementById('cam-delete-btn').onclick = () => {
            showConfirm('删除设备', `<p>确认删除设备「${escapeHtml(cam.name)}」吗？删除后相关的 AI 识别记录将不可恢复。</p>`, () => {
                window.cameraState.list = window.cameraState.list.filter(c => c.id !== id);
                document.getElementById(modalId).remove();
                renderCameraGrid();
                showToast('设备已删除', 'success');
            });
        };
    };
}

/* =========================================================
 * 10. 投诉举报管理
 * ========================================================= */
async function initComplaintsPage() {
    if (!checkLoginAdmin()) return;
    document.body.innerHTML = renderLayout('complaints', '投诉举报管理');
    const content = document.getElementById('pageContent');
    content.innerHTML = '<div style="padding:40px;text-align:center;color:#8B7B70;">数据加载中...</div>';

    let state = { list: [], status: 'all', type: 'all', keyword: '', stats: null };
    const [listData, statsData] = await Promise.all([
        window.ComplaintAPI.list({}),
        window.ComplaintAPI.getStats()
    ]).catch(() => [null, null]);
    if (listData && Array.isArray(listData.list)) state.list = listData.list;
    if (statsData) state.stats = statsData;

    function typeBadge(t) {
        const map = { item: ['物品投诉', '#5B8DB8'], user: ['用户投诉', '#C45D3A'] };
        const [l, c] = map[t] || ['其他', '#6b6159'];
        return badge(l, c);
    }

    function statusBadge(s) {
        const map = {
            pending: ['待处理', '#E8A838'],
            processing: ['处理中', '#5B8DB8'],
            resolved: ['已处理', '#5A8A6E'],
            rejected: ['已驳回', '#6b6159']
        };
        const [l, c] = map[s] || ['未知', '#6b6159'];
        return badge(l, c);
    }

    function priBadge(p) {
        const map = { urgent: ['紧急', '#D9534F'], high: ['高', '#E8A838'], medium: ['普通', '#5B8DB8'], low: ['低', '#6b6159'] };
        const [l, c] = map[p] || map.medium;
        return badge(l, c);
    }

    function render() {
        const stats = state.stats || {};
        const filtered = state.list.filter(c => {
            if (state.status !== 'all' && c.status !== state.status) return false;
            if (state.type !== 'all' && c.type !== state.type) return false;
            if (state.keyword) {
                const kw = state.keyword.toLowerCase();
                const hay = [c.complaint_no, c.target_item_name, c.target_user_name, c.reason, c.reason_detail, c.reporter_name].filter(Boolean).join(' ').toLowerCase();
                if (!hay.includes(kw)) return false;
            }
            return true;
        });

        content.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px;">
                <div style="background:#fff;padding:16px 18px;border-radius:10px;border:1px solid #f0e6db;">
                    <div style="font-size:13px;color:#8B7B70;margin-bottom:6px;">投诉总数</div>
                    <div style="font-size:26px;font-weight:700;color:#2C2420;">${stats.total || filtered.length || 0}</div>
                </div>
                <div style="background:#fff;padding:16px 18px;border-radius:10px;border:1px solid #f0e6db;">
                    <div style="font-size:13px;color:#8B7B70;margin-bottom:6px;">待处理</div>
                    <div style="font-size:26px;font-weight:700;color:#E8A838;">${stats.pending !== undefined ? stats.pending : filtered.filter(c => c.status === 'pending').length}</div>
                </div>
                <div style="background:#fff;padding:16px 18px;border-radius:10px;border:1px solid #f0e6db;">
                    <div style="font-size:13px;color:#8B7B70;margin-bottom:6px;">处理中</div>
                    <div style="font-size:26px;font-weight:700;color:#5B8DB8;">${stats.processing !== undefined ? stats.processing : filtered.filter(c => c.status === 'processing').length}</div>
                </div>
                <div style="background:#fff;padding:16px 18px;border-radius:10px;border:1px solid #f0e6db;">
                    <div style="font-size:13px;color:#8B7B70;margin-bottom:6px;">已处理</div>
                    <div style="font-size:26px;font-weight:700;color:#5A8A6E;">${stats.resolved !== undefined ? stats.resolved : filtered.filter(c => c.status === 'resolved').length}</div>
                </div>
            </div>

            <div style="background:#fff;padding:16px 20px;border-radius:10px;border:1px solid #f0e6db;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
                <span style="font-size:13px;color:#6b6159;">状态：</span>
                <select id="c-status" style="padding:7px 10px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;background:#fff;">
                    <option value="all" ${state.status === 'all' ? 'selected' : ''}>全部</option>
                    <option value="pending" ${state.status === 'pending' ? 'selected' : ''}>待处理</option>
                    <option value="processing" ${state.status === 'processing' ? 'selected' : ''}>处理中</option>
                    <option value="resolved" ${state.status === 'resolved' ? 'selected' : ''}>已处理</option>
                    <option value="rejected" ${state.status === 'rejected' ? 'selected' : ''}>已驳回</option>
                </select>
                <span style="font-size:13px;color:#6b6159;">类型：</span>
                <select id="c-type" style="padding:7px 10px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;background:#fff;">
                    <option value="all" ${state.type === 'all' ? 'selected' : ''}>全部</option>
                    <option value="item" ${state.type === 'item' ? 'selected' : ''}>物品投诉</option>
                    <option value="user" ${state.type === 'user' ? 'selected' : ''}>用户投诉</option>
                </select>
                <input type="text" id="c-keyword" value="${escapeHtml(state.keyword)}" placeholder="搜索编号/标题/投诉人/被投诉人" style="flex:1;min-width:200px;padding:7px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;">
                <button id="c-search" style="padding:7px 16px;background:#C45D3A;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;">搜索</button>
                <span style="color:#8B7B70;font-size:13px;margin-left:auto;">共 ${filtered.length} 条</span>
            </div>

            <div style="background:#fff;border-radius:10px;border:1px solid #f0e6db;overflow:hidden;">
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                    <thead style="background:#FAF5EE;">
                        <tr>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">编号</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">类型</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">投诉对象</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">投诉原因</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">投诉人</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">优先级</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">状态</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">时间</th>
                            <th style="padding:12px 14px;text-align:left;font-size:13px;color:#2C2420;border-bottom:2px solid #f0e6db;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.length === 0 ? `<tr><td colspan="9" style="padding:60px;text-align:center;color:#8B7B70;">暂无投诉数据</td></tr>` : filtered.map(c => {
                            const target = c.type === 'item'
                                ? `${escapeHtml(c.target_item_name || '物品#' + c.target_item_id)}`
                                : `${escapeHtml(c.target_user_name || '用户#' + c.target_user_id)}${c.target_user_phone ? ` (${escapeHtml(c.target_user_phone)})` : ''}`;
                            return `
                            <tr style="border-bottom:1px solid #f0e6db;">
                                <td style="padding:12px 14px;font-weight:500;color:#2C2420;font-size:13px;">${escapeHtml(c.complaint_no || 'TS' + c.id)}</td>
                                <td style="padding:12px 14px;">${typeBadge(c.type)}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#2C2420;">${target}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${escapeHtml(c.reason || '-')}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${escapeHtml(c.reporter_name || '-')}</td>
                                <td style="padding:12px 14px;">${priBadge(c.priority)}</td>
                                <td style="padding:12px 14px;">${statusBadge(c.status)}</td>
                                <td style="padding:12px 14px;font-size:13px;color:#6b6159;">${formatDate(c.create_time)}</td>
                                <td style="padding:12px 14px;font-size:13px;">
                                    <button onclick="window.viewComplaint(${c.id})" style="padding:4px 10px;border-radius:4px;border:1px solid #5B8DB8;background:#fff;color:#5B8DB8;cursor:pointer;font-size:12px;margin-right:4px;">查看</button>
                                    ${c.status !== 'resolved' && c.status !== 'rejected' ? `<button onclick="window.handleComplaint(${c.id})" style="padding:4px 10px;border-radius:4px;border:1px solid #C45D3A;background:#C45D3A;color:#fff;cursor:pointer;font-size:12px;">处理</button>` : ''}
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('c-status').onchange = (e) => { state.status = e.target.value; render(); };
        document.getElementById('c-type').onchange = (e) => { state.type = e.target.value; render(); };
        document.getElementById('c-keyword').oninput = (e) => { state.keyword = e.target.value; };
        document.getElementById('c-search').onclick = () => render();

        window.viewComplaint = async (id) => {
            const c = state.list.find(x => x.id === id) || (await window.ComplaintAPI.detail(id));
            if (!c) { showToast('获取投诉详情失败', 'error'); return; }
            const targetBlock = c.type === 'item'
                ? `<div><strong>被投诉物品：</strong>${escapeHtml(c.target_item_name || '#' + c.target_item_id)}</div>`
                : `<div><strong>被投诉用户：</strong>${escapeHtml(c.target_user_name || '#' + c.target_user_id)} ${escapeHtml(c.target_user_phone || '')}</div>`;
            let punishmentBlock = '';
            if (c.punishment) {
                const p = c.punishment;
                const typeMap = { ban_user: '临时封号', permanent_ban: '永久封号', remove_item: '下架物品', ban_post: '禁止发布' };
                punishmentBlock = `<div style="margin-top:12px;background:#FFF5EE;border:1px solid #F5DCC8;border-radius:6px;padding:12px;line-height:2;">
                    <div style="font-weight:600;color:#C45D3A;margin-bottom:4px;">📌 已执行处罚</div>
                    <div><strong>处罚类型：</strong>${escapeHtml(typeMap[p.type] || p.type)}</div>
                    ${p.ban_days ? `<div><strong>期限：</strong>${p.ban_days} 天</div>` : ''}
                    <div><strong>原因：</strong>${escapeHtml(p.reason || '-')}</div>
                </div>`;
            }
            showConfirm(`投诉详情 · ${c.complaint_no || 'TS' + c.id}`, `
                <div style="line-height:2.2;font-size:13px;">
                    <div><strong>类型：</strong>${typeBadge(c.type)} ｜ <strong>优先级：</strong>${priBadge(c.priority)} ｜ <strong>状态：</strong>${statusBadge(c.status)}</div>
                    ${targetBlock}
                    <div><strong>投诉人：</strong>${escapeHtml(c.reporter_name || '-')} ${c.reporter_phone ? escapeHtml('(' + c.reporter_phone + ')') : ''}</div>
                    <div><strong>提交时间：</strong>${formatDate(c.create_time)}</div>
                    ${c.handle_time ? `<div><strong>处理时间：</strong>${formatDate(c.handle_time)}</div>` : ''}
                    <div style="margin-top:8px;"><strong>投诉原因：</strong><div style="background:#FAF5EE;padding:10px;border-radius:6px;margin-top:4px;">${escapeHtml(c.reason || '-')}</div></div>
                    <div style="margin-top:8px;"><strong>详细描述：</strong><div style="background:#FAF5EE;padding:10px;border-radius:6px;margin-top:4px;white-space:pre-wrap;">${escapeHtml(c.reason_detail || '无')}</div></div>
                    ${c.handle_result ? `<div style="margin-top:8px;"><strong>处理结果：</strong><div style="background:#E3F0E6;padding:10px;border-radius:6px;margin-top:4px;white-space:pre-wrap;">${escapeHtml(c.handle_result)}</div></div>` : ''}
                    ${punishmentBlock}
                </div>
            `);
        };

        window.handleComplaint = (id) => {
            const c = state.list.find(x => x.id === id);
            if (!c) return;
            const targetInfo = c.type === 'item'
                ? `被投诉物品：<strong>${escapeHtml(c.target_item_name || '#' + c.target_item_id)}</strong>`
                : `被投诉用户：<strong>${escapeHtml(c.target_user_name || '#' + c.target_user_id)}</strong>`;
            const actionOptions = c.type === 'item'
                ? `
                    <option value="remove_item">下架物品</option>
                    <option value="ban_post">禁止该物品发布</option>
                    <option value="none">仅标记处理，不处罚</option>
                ` : `
                    <option value="ban_user">临时封号（可选天数）</option>
                    <option value="permanent_ban">永久封号</option>
                    <option value="none">仅标记处理，不处罚</option>
                `;
            const dialogId = 'complaint-handle-' + id;
            const mask = document.createElement('div');
            mask.id = dialogId;
            mask.style.cssText = 'position:fixed;inset:0;background:rgba(44,36,32,0.55);display:flex;align-items:center;justify-content:center;z-index:9500;padding:20px;';
            mask.innerHTML = `
                <div style="background:#fff;border-radius:12px;padding:24px;width:100%;max-width:560px;box-shadow:0 20px 60px rgba(0,0,0,0.25);">
                    <h3 style="margin:0 0 16px 0;font-size:18px;color:#2C2420;">处理投诉 · ${escapeHtml(c.complaint_no || 'TS' + c.id)}</h3>
                    <div style="font-size:13px;color:#6b6159;margin-bottom:16px;line-height:1.8;">${targetInfo}<br>投诉原因：<strong>${escapeHtml(c.reason || '-')}</strong></div>
                    <div style="display:flex;flex-direction:column;gap:14px;">
                        <div>
                            <label style="display:block;margin-bottom:6px;font-size:13px;color:#2C2420;font-weight:500;">处罚方式</label>
                            <select id="ch-action" style="width:100%;padding:9px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;background:#fff;">
                                ${actionOptions}
                            </select>
                        </div>
                        <div id="ch-days-wrap" style="display:none;">
                            <label style="display:block;margin-bottom:6px;font-size:13px;color:#2C2420;font-weight:500;">封禁天数（到期自动解除）</label>
                            <select id="ch-days" style="width:100%;padding:9px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;background:#fff;">
                                <option value="3">3 天</option>
                                <option value="7" selected>7 天</option>
                                <option value="14">14 天</option>
                                <option value="30">30 天</option>
                            </select>
                        </div>
                        <div>
                            <label style="display:block;margin-bottom:6px;font-size:13px;color:#2C2420;font-weight:500;">处罚说明（留作记录）</label>
                            <textarea id="ch-reason" rows="2" placeholder="请简要填写处罚说明" style="width:100%;padding:9px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;box-sizing:border-box;resize:vertical;">${escapeHtml(c.reason || '')}</textarea>
                        </div>
                        <div>
                            <label style="display:block;margin-bottom:6px;font-size:13px;color:#2C2420;font-weight:500;">处理结果描述 *</label>
                            <textarea id="ch-result" rows="3" placeholder="请输入对投诉人的处理说明..." style="width:100%;padding:9px 12px;border:1px solid #d8cfc4;border-radius:6px;font-size:13px;box-sizing:border-box;resize:vertical;"></textarea>
                        </div>
                    </div>
                    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
                        <button id="ch-reject" style="padding:9px 18px;border-radius:6px;border:1px solid #6b6159;background:#fff;color:#6b6159;cursor:pointer;font-size:13px;">驳回投诉</button>
                        <button id="ch-cancel" style="padding:9px 18px;border-radius:6px;border:1px solid #d8cfc4;background:#fff;color:#2C2420;cursor:pointer;font-size:13px;">取消</button>
                        <button id="ch-submit" style="padding:9px 18px;border-radius:6px;border:1px solid #C45D3A;background:#C45D3A;color:#fff;cursor:pointer;font-size:13px;font-weight:500;">确认处理</button>
                    </div>
                </div>
            `;
            document.body.appendChild(mask);

            const actionSel = mask.querySelector('#ch-action');
            actionSel.onchange = () => {
                const wrap = mask.querySelector('#ch-days-wrap');
                if (actionSel.value === 'ban_user' || actionSel.value === 'ban_post' || actionSel.value === 'remove_item') {
                    wrap.style.display = (actionSel.value === 'ban_user' || actionSel.value === 'ban_post') ? 'block' : 'none';
                    if (actionSel.value === 'remove_item') wrap.style.display = 'none';
                } else {
                    wrap.style.display = 'none';
                }
            };
            mask.querySelector('#ch-cancel').onclick = () => mask.remove();
            mask.querySelector('#ch-reject').onclick = async () => {
                const result = mask.querySelector('#ch-result').value.trim() || '投诉内容不成立';
                try {
                    await window.ComplaintAPI.reject(id, result);
                    const idx = state.list.findIndex(x => x.id === id);
                    if (idx >= 0) {
                        state.list[idx].status = 'rejected';
                        state.list[idx].handle_time = Date.now();
                        state.list[idx].handle_result = result;
                    }
                    showToast('已驳回投诉', 'success');
                    render();
                    mask.remove();
                } catch (e) { showToast('操作失败：' + e.message, 'error'); }
            };
            mask.querySelector('#ch-submit').onclick = async () => {
                const action = mask.querySelector('#ch-action').value;
                const days = parseInt(mask.querySelector('#ch-days').value) || 7;
                const reason = mask.querySelector('#ch-reason').value.trim() || c.reason || '';
                const result = mask.querySelector('#ch-result').value.trim();
                if (!result) { showToast('请填写处理结果说明', 'warning'); return; }
                try {
                    const punishment = action === 'none' ? null : {
                        type: action,
                        ban_days: (action === 'ban_user' || action === 'ban_post') ? days : null,
                        reason: reason,
                        target_item_id: c.type === 'item' ? c.target_item_id : null,
                        target_user_id: c.type === 'user' ? c.target_user_id : null
                    };
                    await window.ComplaintAPI.resolve(id, {
                        result: result,
                        punishment: punishment,
                        operator: '管理员'
                    });
                    const idx = state.list.findIndex(x => x.id === id);
                    if (idx >= 0) {
                        state.list[idx].status = 'resolved';
                        state.list[idx].handle_time = Date.now();
                        state.list[idx].handle_result = result;
                        state.list[idx].punishment = punishment;
                    }
                    showToast('投诉处理成功' + (punishment ? '，处罚已执行' : ''), 'success');
                    render();
                    mask.remove();
                } catch (e) { showToast('操作失败：' + e.message, 'error'); }
            };
        };
    }

    render();
}

/* =========================================================
 * 路由：页面自动初始化
 * ========================================================= */
window.initApp = function () {
    const id = (document.body.getAttribute('data-page') || '').trim();
    const routes = {
        login: initLoginPage,
        dashboard: initDashboardPage,
        detection: initDetectionPage,
        workorders: initWorkOrdersPage,
        appeals: initAppealsPage,
        shares: initSharesPage,
        notices: initNoticesPage,
        elderly: initElderlyPage,
        users: initUsersPage,
        review: initReviewPage,
        complaints: initComplaintsPage
    };
    if (id && routes[id]) { routes[id](); return; }
    const urlParams = new URLSearchParams(window.location.search);
    const pageId = urlParams.get('page') || urlParams.get('p');
    if (pageId && routes[pageId]) { routes[pageId](); return; }
    initLoginPage();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initApp);
} else {
    window.initApp();
}