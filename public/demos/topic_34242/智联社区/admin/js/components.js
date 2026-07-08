/* 邻里智联 - 组件库 */

/* ===== 侧边栏 ===== */
const Sidebar = {
    items: [
        { id: 'dashboard', name: '工作台', icon: '📊', page: 'dashboard.html' },
        { id: 'workorders', name: '隐患工单', icon: '🔧', page: 'workorders.html' },
        { id: 'appeals', name: '居民诉求', icon: '📝', page: 'appeals.html' },
        { id: 'shares', name: '邻里共享', icon: '🤝', page: 'shares.html' },
        { id: 'notices', name: '通知发布', icon: '📢', page: 'notices.html' },
        { id: 'elderly', name: '老人监测', icon: '👴', page: 'elderly.html' },
        { id: 'users', name: '用户管理', icon: '👥', page: 'users.html' },
        { id: 'review', name: '账号审核', icon: '✅', page: 'review.html' }
    ],
    render(activeId) {
        return `
            <aside class="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">🏘 邻里智联</div>
                    <div class="sidebar-subtitle">社区治理管理平台</div>
                </div>
                <nav class="sidebar-nav">
                    ${this.items.map(item => `
                        <a href="${item.page}" class="sidebar-item ${activeId === item.id ? 'active' : ''}">
                            <span class="sidebar-icon">${item.icon}</span>
                            <span class="sidebar-name">${item.name}</span>
                        </a>
                    `).join('')}
                </nav>
                <div class="sidebar-footer">
                    <small>v2.0.0 · Demo</small>
                </div>
            </aside>
        `;
    }
};

/* ===== 顶部栏 ===== */
const Topbar = {
    render(title) {
        const user = Auth.getCurrentUser();
        const name = user.name || '管理员';
        const avatarText = name.charAt(0);
        return `
            <header class="topbar">
                <div class="topbar-left">
                    <h1 class="page-title">${title}</h1>
                </div>
                <div class="topbar-right">
                    <div class="topbar-icon" title="通知中心" onclick="Topbar.showNotifications()">🔔</div>
                    <div class="topbar-user" onclick="Topbar.toggleUserMenu()">
                        <div class="user-avatar">${avatarText}</div>
                        <div class="user-info">
                            <span class="user-name">${name}</span>
                            <span class="user-role">${user.role === 'grid' ? '网格员' : '管理员'}</span>
                        </div>
                        <span class="user-caret">▾</span>
                    </div>
                    <div class="user-dropdown" id="userDropdown">
                        <div class="user-dropdown-item" onclick="Topbar.viewProfile()">👤 个人资料</div>
                        <div class="user-dropdown-item" onclick="Topbar.showNotifications()">📋 待办事项</div>
                        <div class="user-dropdown-divider"></div>
                        <div class="user-dropdown-item danger" onclick="Auth.logout()">🚪 退出登录</div>
                    </div>
                </div>
            </header>
        `;
    },
    toggleUserMenu() {
        const dd = document.getElementById('userDropdown');
        if (dd) dd.classList.toggle('show');
    },
    viewProfile() {
        const u = Auth.getCurrentUser();
        Modal.show({
            title: '个人资料',
            content: `
                <div style="padding:16px; text-align:center;">
                    <div class="user-avatar" style="width:80px;height:80px;font-size:2rem;margin:0 auto 16px;">${(u.name || '管').charAt(0)}</div>
                    <h3 style="margin-bottom:8px">${u.name || '管理员'}</h3>
                    <p class="text-muted">${u.role === 'grid' ? '网格员' : '系统管理员'}</p>
                    <p class="text-muted">${u.phone || '-'}</p>
                </div>
            `,
            footer: `<button class="btn btn-primary" onclick="Modal.closeAll()">关闭</button>`
        });
    },
    showNotifications() {
        Modal.show({
            title: '通知中心',
            content: `
                <ul class="task-list">
                    <li class="task-item">
                        <div class="task-content">
                            <div class="task-title">您有3条新工单待处理</div>
                            <div class="task-time">10分钟前</div>
                        </div>
                        <span class="badge badge-warning">紧急</span>
                    </li>
                    <li class="task-item">
                        <div class="task-content">
                            <div class="task-title">独居老人李国强设备离线</div>
                            <div class="task-time">30分钟前</div>
                        </div>
                        <span class="badge badge-danger">预警</span>
                    </li>
                    <li class="task-item">
                        <div class="task-content">
                            <div class="task-title">3位新用户待审核</div>
                            <div class="task-time">1小时前</div>
                        </div>
                        <span class="badge badge-info">提醒</span>
                    </li>
                </ul>
            `,
            footer: `<button class="btn btn-outline" onclick="Modal.closeAll()">关闭</button>`
        });
    }
};

document.addEventListener('click', function(e) {
    const user = e.target.closest('.topbar-user');
    const dd = document.getElementById('userDropdown');
    if (!user && dd && dd.classList.contains('show')) {
        dd.classList.remove('show');
    }
});

/* ===== Table组件 ===== */
const Table = {
    create({ columns, data, emptyText = '暂无数据', striped = true, hoverable = true }) {
        const rows = (data || []).map((row, idx) => `
            <tr class="${striped && idx % 2 === 1 ? 'alt' : ''} ${hoverable ? 'hover' : ''}">
                ${columns.map(col => {
                    const val = col.dataIndex ? row[col.dataIndex] : null;
                    const content = col.render ? col.render(val, row, idx) : (val == null ? '-' : val);
                    return `<td style="${col.width ? 'width:' + col.width : ''}">${content}</td>`;
                }).join('')}
            </tr>
        `).join('');

        return `
            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>${columns.map(c => `<th style="${c.width ? 'width:' + c.width : ''}">${c.title || ''}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${rows || `<tr><td colspan="${columns.length}" class="table-empty">${emptyText}</td></tr>`}
                    </tbody>
                </table>
            </div>
        `;
    }
};

/* ===== Modal弹窗 ===== */
const Modal = {
    show({ title, content, footer, width = '520px', maskClosable = true }) {
        this.closeAll();
        const mask = document.createElement('div');
        mask.className = 'modal-mask';
        mask.innerHTML = `
            <div class="modal" style="max-width:${width}">
                <div class="modal-header">
                    <span class="modal-title">${title || ''}</span>
                    <span class="modal-close" onclick="Modal.closeAll()">✕</span>
                </div>
                <div class="modal-body">${content || ''}</div>
                ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
            </div>
        `;
        if (maskClosable) mask.addEventListener('click', (e) => {
            if (e.target === mask) this.closeAll();
        });
        document.body.appendChild(mask);
        setTimeout(() => mask.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
    },
    confirm({ title = '确认操作', content, onOk, okText = '确认', cancelText = '取消', danger = false }) {
        this.show({
            title,
            content: content || '<p>确定要执行此操作吗？</p>',
            width: '420px',
            footer: `
                <button class="btn btn-outline" onclick="Modal.closeAll()">${cancelText}</button>
                <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" onclick="Modal._confirmOk()">${okText}</button>
            `
        });
        this._onOk = onOk;
    },
    _confirmOk() {
        if (typeof this._onOk === 'function') {
            const ret = this._onOk();
            if (ret && typeof ret.then === 'function') {
                ret.then(() => this.closeAll()).catch(() => {});
            } else {
                this.closeAll();
            }
        } else {
            this.closeAll();
        }
    },
    closeAll() {
        document.querySelectorAll('.modal-mask').forEach(m => {
            m.classList.remove('show');
            setTimeout(() => m.remove(), 150);
        });
        document.body.style.overflow = '';
    }
};

/* ===== Toast消息 ===== */
const Toast = {
    init() {
        let el = document.getElementById('toastContainer');
        if (!el) {
            el = document.createElement('div');
            el.id = 'toastContainer';
            el.className = 'toast-container';
            document.body.appendChild(el);
        }
        return el;
    },
    show(msg, type = 'info', duration = 2500) {
        const container = this.init();
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '!' : 'i';
        el.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${msg}</span>`;
        container.appendChild(el);
        setTimeout(() => el.classList.add('show'), 10);
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => el.remove(), 300);
        }, duration);
    },
    success(m) { this.show(m, 'success'); },
    error(m) { this.show(m, 'error', 3500); },
    warning(m) { this.show(m, 'warning'); },
    info(m) { this.show(m, 'info'); }
};

/* ===== Charts 简单图表（div实现） ===== */
const Charts = {
    barChart(selector, data, options = {}) {
        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!el || !data || !data.length) return;
        const max = Math.max(...data.map(d => d.value || 0), 1);
        const color = options.barColor || '#5A8A6E';
        el.innerHTML = `
            <div class="chart-bars">
                ${data.map(d => {
                    const pct = ((d.value || 0) / max) * 100;
                    return `
                        <div class="chart-bar-item">
                            <div class="chart-bar-label">${d.label || ''}</div>
                            <div class="chart-bar-track">
                                <div class="chart-bar-fill" style="width:${pct}%;background:${d.color || color}"></div>
                                <span class="chart-bar-value">${d.value || 0}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },
    pieChart(selector, data) {
        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!el || !data || !data.length) return;
        const total = data.reduce((sum, d) => sum + (d.value || 0), 0) || 1;
        const colors = ['#C45D3A', '#5A8A6E', '#E8A838', '#6B8FBF', '#A974C4', '#7FBF7E'];
        let acc = 0;
        const slices = data.map((d, i) => {
            const start = (acc / total) * 100;
            acc += (d.value || 0);
            const end = (acc / total) * 100;
            const color = d.color || colors[i % colors.length];
            return { start, end, color, label: d.label, value: d.value };
        });
        const gradientParts = slices.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ');
        el.innerHTML = `
            <div class="chart-pie">
                <div class="pie-chart">
                    <div class="pie-circle" style="background: conic-gradient(${gradientParts})"></div>
                    <div class="pie-center">
                        <div class="pie-total-label">总计</div>
                        <div class="pie-total-value">${total}</div>
                    </div>
                </div>
                <div class="pie-legend">
                    ${slices.map(s => `
                        <div class="pie-legend-item">
                            <span class="pie-legend-dot" style="background:${s.color}"></span>
                            <span>${s.label}</span>
                            <span class="text-muted">(${s.value})</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    statCards(cards) {
        return `
            <div class="stats-grid">
                ${cards.map(c => `
                    <div class="stat-card">
                        <div class="stat-icon ${c.color || 'primary'}">${c.icon || '📊'}</div>
                        <div class="stat-content">
                            <div class="stat-value">${c.value}</div>
                            <div class="stat-label">${c.label}</div>
                            ${c.change ? `<div class="stat-change ${c.changeColor || 'up'}">${c.change}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
};

/* ===== 通用布局渲染 ===== */
function renderLayout(activeId, title) {
    return Sidebar.render(activeId) + `
        <div class="main-content">
            ${Topbar.render(title)}
            <div class="content" id="pageContent"></div>
        </div>
    `;
}
