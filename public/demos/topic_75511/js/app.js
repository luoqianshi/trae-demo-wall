// ONE TOW MORE - 主框架逻辑
// 品牌名：ONE TOW MORE

class App {
    constructor() {
        this.currentPage = 'dashboard';
        this.statsPeriod = 'week';
        this.init();
    }

    init() {
        this.initNavigation();
        this.initIcons();
        this.initModal();
        this.initStatsToggle();
        this.loadDashboardData();
    }

    initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const pages = document.querySelectorAll('.page');
        const pageTitle = document.getElementById('page-title');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = item.dataset.page;

                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                pages.forEach(page => page.classList.remove('active'));
                const targetEl = document.getElementById(`${targetPage}-page`);
                if (targetEl) targetEl.classList.add('active');

                const titles = {
                    'dashboard': '工作台',
                    'knowledge': '知识库管理',
                    'chat': '智能问答',
                    'agent': 'AI Agent',
                    'skills': 'Skill 系统',
                    'workshop': '创意工坊',
                    'settings': '系统设置'
                };
                pageTitle.textContent = titles[targetPage] || targetPage;
                this.currentPage = targetPage;
            });
        });
    }

    initIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    initModal() {
        const overlay = document.getElementById('modal-overlay');
        const closeBtn = document.getElementById('modal-close');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.closeModal();
            });
        }
    }

    openModal(title, content, opts = {}) {
        const overlay = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modal = document.getElementById('modal');

        modalTitle.textContent = title;
        modalBody.innerHTML = content;

        if (opts.wide) {
            modal.style.maxWidth = '800px';
        } else if (opts.extraWide) {
            modal.style.maxWidth = '960px';
        } else {
            modal.style.maxWidth = '600px';
        }

        overlay.classList.add('active');
        this.initIcons();
    }

    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.classList.remove('active');
    }

    initStatsToggle() {
        const toggle = document.getElementById('stats-period-toggle');
        if (!toggle) return;

        toggle.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                toggle.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.statsPeriod = btn.dataset.period;
                this.loadDashboardData();
            });
        });
    }

    loadDashboardData() {
        this.renderStatCards();
        this.renderGrowthIndicators();
        this.renderRecentKnowledgeBases();
        this.renderRecentChats();
        this.renderAgentTaskStatus();
        this.renderTodoReminders();
        this.renderQuickEntries();
    }

    renderStatCards() {
        const data = {
            week: { kb: 8, doc: 1247, chat: 563, agent: 23 },
            month: { kb: 8, doc: 3892, chat: 2156, agent: 87 },
            all: { kb: 8, doc: 12580, chat: 9874, agent: 342 }
        };
        const d = data[this.statsPeriod] || data.week;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = typeof val === 'number' ? val.toLocaleString() : val;
        };
        setVal('kb-count', d.kb);
        setVal('doc-count', d.doc);
        setVal('chat-count', d.chat);
        setVal('agent-count', d.agent);
    }

    renderGrowthIndicators() {
        const container = document.getElementById('growth-indicators');
        if (!container) return;

        const indicators = [
            { label: '知识库容量', value: '2.4 GB', change: 12.5, up: true },
            { label: '问答准确率', value: '94.7%', change: 3.2, up: true },
            { label: 'Agent成功率', value: '87.3%', change: -1.8, up: false },
            { label: '活跃Skill数', value: '10', change: 2, up: true }
        ];

        container.innerHTML = indicators.map(ind => `
            <div class="growth-item">
                <div class="growth-label">${ind.label}</div>
                <div class="growth-value">${ind.value}</div>
                <div class="growth-change ${ind.up ? 'up' : 'down'}">
                    <i data-lucide="${ind.up ? 'trending-up' : 'trending-down'}"></i>
                    ${Math.abs(ind.change)}%
                </div>
            </div>
        `).join('');

        this.initIcons();
    }

    renderRecentKnowledgeBases() {
        const container = document.getElementById('recent-kb');
        if (!container) return;

        const kbData = [
            { title: '技术文档库', meta: '234 个文档 · 2小时前', icon: 'file-code' },
            { title: '产品需求库', meta: '56 个文档 · 5小时前', icon: 'clipboard-list' },
            { title: '市场调研库', meta: '128 个文档 · 1天前', icon: 'bar-chart-3' },
            { title: '法律法规库', meta: '89 个文档 · 2天前', icon: 'scale' },
            { title: '医学文献库', meta: '456 个文档 · 3天前', icon: 'heart-pulse' },
            { title: '金融研报库', meta: '312 个文档 · 1周前', icon: 'trending-up' }
        ];

        container.innerHTML = kbData.map(kb => `
            <div class="recent-item">
                <i data-lucide="${kb.icon}"></i>
                <div class="recent-info">
                    <div class="recent-title">${kb.title}</div>
                    <div class="recent-meta">${kb.meta}</div>
                </div>
            </div>
        `).join('');

        this.initIcons();
    }

    renderRecentChats() {
        const container = document.getElementById('recent-chats');
        if (!container) return;

        const chatData = [
            { title: '技术架构讨论', preview: '关于微服务架构的最佳实践...', time: '10分钟前' },
            { title: '数据分析咨询', preview: '如何分析用户行为数据？', time: '1小时前' },
            { title: '产品方案评估', preview: '新功能的技术可行性分析', time: '3小时前' },
            { title: '法规合规咨询', preview: '数据安全法对企业的影响', time: '5小时前' },
            { title: '竞品对比分析', preview: '主流竞品功能特性对比', time: '1天前' }
        ];

        container.innerHTML = chatData.map(chat => `
            <div class="recent-item">
                <i data-lucide="message-square"></i>
                <div class="recent-info">
                    <div class="recent-title">${chat.title}</div>
                    <div class="recent-meta">${chat.preview} · ${chat.time}</div>
                </div>
            </div>
        `).join('');

        this.initIcons();
    }

    renderAgentTaskStatus() {
        const container = document.getElementById('agent-status');
        if (!container) return;

        const agentData = [
            { name: '文档自动分类任务', desc: '正在处理技术文档库的分类...', status: 'running', progress: 65 },
            { name: '知识图谱构建', desc: '构建产品知识图谱关系...', status: 'running', progress: 32 },
            { name: '数据清洗任务', desc: '清洗市场调研数据...', status: 'completed', progress: 100 },
            { name: '智能摘要生成', desc: '为法律法规库生成智能摘要...', status: 'completed', progress: 100 },
            { name: '竞品分析报告', desc: '分析竞争对手产品特性...', status: 'failed', progress: 45 }
        ];

        container.innerHTML = agentData.map(agent => `
            <div class="agent-item">
                <div class="agent-status-icon ${agent.status}">
                    <i data-lucide="${agent.status === 'running' ? 'loader-2' : agent.status === 'completed' ? 'check-circle' : 'x-circle'}"></i>
                </div>
                <div class="agent-info">
                    <div class="agent-name">${agent.name}</div>
                    <div class="agent-desc">${agent.desc}</div>
                    <div style="margin-top: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <div style="flex: 1; height: 4px; background: var(--bg-secondary); border-radius: 2px; overflow: hidden;">
                                <div style="width: ${agent.progress}%; height: 100%; background: ${agent.status === 'running' ? 'var(--accent)' : agent.status === 'completed' ? 'var(--success)' : 'var(--danger)'}; border-radius: 2px; transition: width 0.3s ease;"></div>
                            </div>
                            <span style="font-size: 12px; color: var(--text-muted); min-width: 36px;">${agent.progress}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        this.initIcons();
    }

    renderTodoReminders() {
        const container = document.getElementById('todo-reminders');
        if (!container) return;

        const todos = [
            { text: '更新技术文档库索引', priority: 'high', done: false },
            { text: '审核新上传的法规文件', priority: 'medium', done: false },
            { text: '检查Agent任务执行日志', priority: 'low', done: true },
            { text: '优化知识库检索参数', priority: 'medium', done: false }
        ];

        container.innerHTML = todos.map(todo => `
            <div class="todo-item ${todo.done ? 'done' : ''}" style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: var(--radius-sm); background: var(--bg-secondary); margin-bottom: 8px;">
                <div style="width: 18px; height: 18px; border-radius: 4px; border: 2px solid ${todo.done ? 'var(--success)' : 'var(--text-muted)'}; background: ${todo.done ? 'var(--success)' : 'transparent'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    ${todo.done ? '<i data-lucide="check" style="width: 12px; height: 12px; color: white;"></i>' : ''}
                </div>
                <span style="flex: 1; font-size: 13px; ${todo.done ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${todo.text}</span>
                <span style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; background: ${todo.priority === 'high' ? 'rgba(239,68,68,0.15); color: var(--danger);' : todo.priority === 'medium' ? 'rgba(245,158,11,0.15); color: var(--warning);' : 'rgba(107,114,128,0.15); color: var(--text-muted);'}">${todo.priority === 'high' ? '紧急' : todo.priority === 'medium' ? '一般' : '低'}</span>
            </div>
        `).join('');

        this.initIcons();
    }

    renderQuickEntries() {
        const container = document.getElementById('quick-entries');
        if (!container) return;

        const entries = [
            { label: '新建知识库', icon: 'plus-circle', color: '#3B82F6' },
            { label: '开始对话', icon: 'message-circle', color: '#8B5CF6' },
            { label: '创建任务', icon: 'play-circle', color: '#10B981' },
            { label: '浏览工坊', icon: 'shopping-bag', color: '#F59E0B' }
        ];

        container.innerHTML = entries.map(entry => `
            <div class="quick-entry" style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md); cursor: pointer; transition: var(--transition);">
                <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: ${entry.color}20; color: ${entry.color}; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="${entry.icon}"></i>
                </div>
                <span style="font-size: 12px; color: var(--text-secondary);">${entry.label}</span>
            </div>
        `).join('');

        this.initIcons();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
