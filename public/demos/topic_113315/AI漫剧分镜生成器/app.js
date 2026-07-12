/* ================================================
   AI漫剧分镜生成器 - 主脚本文件
   纯原生JavaScript实现，模块化设计
   ================================================ */

'use strict';

/* ================================================
   1. AppState - 全局状态管理
   ================================================ */
const AppState = {
    state: {
        currentTab: 'dashboard',
        currentTheme: 'sakura',
        generatedCount: 0,
        currentProject: null,
        settings: {
            compactMode: false,
            animations: true,
            historySidebar: true,
            defaultZoom: 100,
            notifyGenerate: true,
            notifyError: true,
            soundToggle: false,
            defaultStyle: '国漫',
            defaultQuality: 'high',
            maxConcurrentTasks: 6,
            charConsistency: true,
            autoSaveInterval: 180000,
            exportFormat: 'json',
            historyRetention: 30
        },
        skills: {}
    },

    listeners: {},

    init() {
        const saved = localStorage.getItem('comicai_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            } catch (e) {
                console.warn('Failed to parse saved state');
            }
        }
        this.initSkills();
    },

    initSkills() {
        if (!this.state.skills || Object.keys(this.state.skills).length === 0) {
            this.state.skills = {
                'script-analysis': { id: 'script-analysis', name: '剧本分析', icon: '📝', desc: '智能解析剧本结构，自动识别场景、角色、对话', enabled: true, category: 'core' },
                'character-consistency': { id: 'character-consistency', name: '角色一致性', icon: '👤', desc: '保持角色形象在分镜中的高度一致性', enabled: true, category: 'core' },
                'scene-generation': { id: 'scene-generation', name: '场景生成', icon: '🏞️', desc: '根据描述自动生成背景场景', enabled: true, category: 'core' },
                'camera-language': { id: 'camera-language', name: '镜头语言', icon: '🎥', desc: '专业电影级镜头语言设计与编排', enabled: true, category: 'advanced' },
                'color-grading': { id: 'color-grading', name: '色彩调校', icon: '🎨', desc: '智能色彩搭配与画面色调统一', enabled: false, category: 'advanced' },
                'speech-bubble': { id: 'speech-bubble', name: '对话气泡', icon: '💬', desc: '自动生成对话气泡与文字排版', enabled: true, category: 'basic' },
                'sound-effect': { id: 'sound-effect', name: '特效文字', icon: '💥', desc: '添加拟声词与特效文字增强表现力', enabled: false, category: 'basic' },
                'style-transfer': { id: 'style-transfer', name: '风格迁移', icon: '🖌️', desc: '将分镜转换为不同的漫画风格', enabled: false, category: 'advanced' },
                'batch-generate': { id: 'batch-generate', name: '批量生成', icon: '⚡', desc: '支持多项目批量生成与导出', enabled: true, category: 'efficiency' },
                'template-creator': { id: 'template-creator', name: '模板创建', icon: '📋', desc: '将项目保存为可复用的分镜模板', enabled: true, category: 'efficiency' }
            };
        }
    },

    get(key) {
        return this.state[key];
    },

    set(key, value) {
        this.state[key] = value;
        this.save();
        this.emit(key, value);
    },

    getSettings() {
        return this.state.settings;
    },

    setSetting(key, value) {
        this.state.settings[key] = value;
        this.save();
    },

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    },

    save() {
        try {
            localStorage.setItem('comicai_state', JSON.stringify(this.state));
        } catch (e) {
            console.warn('Failed to save state');
        }
    }
};

/* ================================================
   2. Logger - 日志系统
   ================================================ */
const Logger = {
    logs: [],
    maxLogs: 500,
    currentFilter: 'all',
    autoScroll: true,
    container: null,

    init() {
        this.container = document.getElementById('logContainer');
        this.bindEvents();
        this.info('系统启动', 'AI漫剧分镜生成器 v1.0.0 已就绪');
    },

    bindEvents() {
        const filter = document.getElementById('logLevelFilter');
        const autoScroll = document.getElementById('autoScroll');
        const clearBtn = document.getElementById('clearLogBtn');

        if (filter) {
            filter.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.render();
            });
        }
        if (autoScroll) {
            autoScroll.addEventListener('change', (e) => {
                this.autoScroll = e.target.checked;
            });
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clear());
        }
    },

    add(level, title, message = '') {
        const log = {
            id: Date.now() + Math.random(),
            level,
            title,
            message,
            time: new Date()
        };
        this.logs.push(log);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        this.render();
        HistoryManager.add(level, title, message);
    },

    info(title, message) { this.add('info', title, message); },
    success(title, message) { this.add('success', title, message); },
    warn(title, message) { this.add('warn', title, message); },
    error(title, message) { this.add('error', title, message); },
    generate(title, message) { this.add('generate', title, message); },

    render() {
        if (!this.container) return;

        const filtered = this.currentFilter === 'all'
            ? this.logs
            : this.logs.filter(l => l.level === this.currentFilter);

        if (filtered.length === 0) {
            this.container.innerHTML = '<div class="log-empty">等待创作开始...</div>';
            return;
        }

        const html = filtered.map(log => {
            const timeStr = log.time.toLocaleTimeString('zh-CN', { hour12: false });
            const levelUpper = log.level.toUpperCase();
            const fullMsg = log.message ? `${log.title} - ${log.message}` : log.title;
            return `
                <div class="log-entry">
                    <span class="log-time">${timeStr}</span>
                    <span class="log-level ${log.level}">[${levelUpper}]</span>
                    <span class="log-message">${this.escapeHtml(fullMsg)}</span>
                </div>
            `;
        }).join('');

        this.container.innerHTML = html;

        if (this.autoScroll) {
            this.container.scrollTop = this.container.scrollHeight;
        }
    },

    clear() {
        this.logs = [];
        this.render();
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

/* ================================================
   3. ThemeManager - 主题管理
   ================================================ */
const ThemeManager = {
    themes: [
        { id: 'sakura', name: '樱花粉' },
        { id: 'cyber', name: '赛博青' },
        { id: 'deepPurple', name: '深空紫' },
        { id: 'darkOrange', name: '暗夜橙' },
        { id: 'mint', name: '薄荷绿' },
        { id: 'roseGold', name: '玫瑰金' }
    ],

    currentIndex: 0,

    init() {
        const savedTheme = AppState.get('currentTheme') || 'sakura';
        this.applyTheme(savedTheme);
        this.currentIndex = this.themes.findIndex(t => t.id === savedTheme);
        if (this.currentIndex === -1) this.currentIndex = 0;

        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.cycleTheme());
        }

        this.renderThemeGrid();
    },

    applyTheme(themeId) {
        document.documentElement.setAttribute('data-theme', themeId);
        AppState.set('currentTheme', themeId);
        this.currentIndex = this.themes.findIndex(t => t.id === themeId);
        if (this.currentIndex === -1) this.currentIndex = 0;
        this.updateThemeGridActive();
        Logger.info('主题切换', `已切换到${this.getThemeName(themeId)}主题`);
    },

    cycleTheme() {
        this.currentIndex = (this.currentIndex + 1) % this.themes.length;
        this.applyTheme(this.themes[this.currentIndex].id);
    },

    getThemeName(id) {
        const theme = this.themes.find(t => t.id === id);
        return theme ? theme.name : id;
    },

    renderThemeGrid() {
        const grid = document.getElementById('themeGrid');
        if (!grid) return;

        const currentTheme = AppState.get('currentTheme');
        grid.innerHTML = this.themes.map(theme => `
            <div class="theme-card ${theme.id === currentTheme ? 'active' : ''}" data-theme="${theme.id}" title="${theme.name}">
                <div class="theme-card-preview"></div>
                <div class="theme-card-name">${theme.name}</div>
            </div>
        `).join('');

        grid.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('click', () => {
                this.applyTheme(card.dataset.theme);
            });
        });
    },

    updateThemeGridActive() {
        const grid = document.getElementById('themeGrid');
        if (!grid) return;
        const currentTheme = AppState.get('currentTheme');
        grid.querySelectorAll('.theme-card').forEach(card => {
            card.classList.toggle('active', card.dataset.theme === currentTheme);
        });
    }
};

/* ================================================
   4. NavManager - 导航管理
   ================================================ */
const NavManager = {
    pageTitles: {
        dashboard: { title: '工作台', subtitle: '开启你的漫剧创作之旅' },
        generator: { title: '分镜生成', subtitle: '输入剧本，AI自动生成专业分镜' },
        storyboard: { title: '分镜时间线', subtitle: '可视化编辑和管理你的分镜序列' },
        characters: { title: '角色库', subtitle: '管理你的原创角色，保持形象一致性' },
        scenes: { title: '场景库', subtitle: '收藏和管理场景背景素材' },
        workflow: { title: '工作流编辑器', subtitle: '可视化编排你的创作工作流' },
        assets: { title: '素材管理', subtitle: '管理你的图片、音效、字体等创作素材' },
        settings: { title: '设置', subtitle: '个性化配置你的创作环境' },
        help: { title: '帮助中心', subtitle: '新手入门教程、常见问题解答与使用技巧' }
    },

    init() {
        this.bindNavEvents();
    },

    bindNavEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                this.switchTab(tab);
            });
        });
    },

    switchTab(tabId) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabId);
        });

        document.querySelectorAll('.page').forEach(page => {
            page.classList.toggle('active', page.id === `page-${tabId}`);
        });

        const titles = this.pageTitles[tabId];
        if (titles) {
            const titleEl = document.getElementById('pageTitle');
            const subtitleEl = document.getElementById('pageSubtitle');
            if (titleEl) titleEl.textContent = titles.title;
            if (subtitleEl) subtitleEl.textContent = titles.subtitle;
        }

        AppState.set('currentTab', tabId);

        if (tabId === 'characters') CharacterManager.render();
        if (tabId === 'scenes') SceneManager.render();
        if (tabId === 'storyboard') StoryboardManager.render();
        if (tabId === 'assets') AssetManager.render();
        if (tabId === 'workflow') WorkflowEditor.renderPalette();
        if (tabId === 'settings') SettingsManager.renderSkills();
        if (tabId === 'help') HelpManager.render();
    }
};

/* ================================================
   5. DashboardTabManager - 工作台Tab管理
   ================================================ */
const DashboardTabManager = {
    init() {
        this.bindTabEvents();
        this.bindQuickGenerate();
        this.updateStats();
    },

    bindTabEvents() {
        document.querySelectorAll('.dashboard-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.dashboardTab;
                this.switchTab(tabId);
            });
        });
    },

    switchTab(tabId) {
        document.querySelectorAll('.dashboard-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.dashboardTab === tabId);
        });

        document.querySelectorAll('.dashboard-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `dashboard-${tabId}`);
        });
    },

    bindQuickGenerate() {
        const btn = document.getElementById('quickGenerateBtn');
        if (btn) {
            btn.addEventListener('click', () => this.quickGenerate());
        }
    },

    quickGenerate() {
        const script = document.getElementById('quickScript')?.value?.trim();
        if (!script) {
            Logger.warn('生成失败', '请先输入剧本描述');
            alert('请先输入剧本描述');
            return;
        }

        const style = document.getElementById('quickStyle')?.value || '日系';
        const count = parseInt(document.getElementById('quickCount')?.value || 6);
        const ratio = document.getElementById('quickRatio')?.value || '16:9';
        const quality = document.getElementById('quickQuality')?.value || 'high';

        Logger.generate('快速生成开始', `风格:${style} 格数:${count} 比例:${ratio}`);

        const btn = document.getElementById('quickGenerateBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span>⏳</span> 生成中...';
        }

        const badge = document.getElementById('quickPreviewBadge');
        if (badge) {
            badge.textContent = '生成中...';
            badge.className = 'badge badge-warning';
        }

        setTimeout(() => {
            const shots = GeneratorManager.generateMockShots(script, count, style);
            this.renderQuickPreview(shots, style, ratio);

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span>✨</span> 立即生成分镜';
            }
            if (badge) {
                badge.textContent = '生成完成';
                badge.className = 'badge badge-success';
            }

            const countVal = AppState.get('generatedCount') || 0;
            AppState.set('generatedCount', countVal + 1);
            this.updateStats();

            Logger.success('快速生成完成', `成功生成${count}格分镜`);
        }, 1500);
    },

    renderQuickPreview(shots, style, ratio) {
        const body = document.getElementById('quickPreviewBody');
        if (!body) return;

        const cols = shots.length <= 4 ? 2 : 3;
        const svg = this.generateStoryboardSVG(shots, ratio, cols);

        body.innerHTML = `
            <div style="width:100%;">
                <div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
                    <span class="badge badge-primary">${style}风格</span>
                    <span style="font-size:12px;color:var(--text-muted);">${shots.length}格 · ${ratio}</span>
                </div>
                ${svg}
            </div>
        `;
    },

    generateStoryboardSVG(shots, ratio = '16:9', cols = 3) {
        const [rw, rh] = ratio.split(':').map(Number);
        const cellW = 200;
        const cellH = cellW * rh / rw;
        const gap = 10;
        const rows = Math.ceil(shots.length / cols);
        const totalW = cols * cellW + (cols + 1) * gap;
        const totalH = rows * cellH + (rows + 1) * gap;

        let cells = '';
        shots.forEach((shot, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = gap + col * (cellW + gap);
            const y = gap + row * (cellH + gap);
            const colors = ['#ec4899', '#a855f7', '#06b6d4', '#22c55e', '#f97316', '#f43f5e', '#8b5cf6', '#14b8a6'];
            const color = colors[i % colors.length];

            cells += `
                <g transform="translate(${x}, ${y})">
                    <rect width="${cellW}" height="${cellH}" rx="6" fill="#1a1120" stroke="${color}" stroke-width="2"/>
                    <rect y="${cellH - 30}" width="${cellW}" height="30" rx="0 0 6 6" fill="rgba(0,0,0,0.5)"/>
                    <text x="10" y="${cellH - 10}" fill="white" font-size="11" font-family="sans-serif">${i + 1}. ${this.truncate(shot.title, 12)}</text>
                    <text x="${cellW / 2}" y="${cellH / 2 - 10}" text-anchor="middle" font-size="32">${shot.icon}</text>
                    <text x="${cellW / 2}" y="${cellH / 2 + 20}" text-anchor="middle" fill="#9a8aa3" font-size="10">${shot.type}</text>
                </g>
            `;
        });

        return `<svg viewBox="0 0 ${totalW} ${totalH}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">${cells}</svg>`;
    },

    truncate(str, len) {
        return str.length > len ? str.slice(0, len) + '...' : str;
    },

    updateStats() {
        const projects = ProjectManager.getProjects().length;
        const characters = CharacterManager.getCharacters().length;
        const scenes = SceneManager.getScenes().length;
        const generated = AppState.get('generatedCount') || 0;

        const statProjects = document.getElementById('statProjects');
        const statCharacters = document.getElementById('statCharacters');
        const statScenes = document.getElementById('statScenes');
        const statGenerated = document.getElementById('statGenerated');
        const projectCount = document.getElementById('projectCount');

        if (statProjects) statProjects.textContent = projects;
        if (statCharacters) statCharacters.textContent = characters;
        if (statScenes) statScenes.textContent = scenes;
        if (statGenerated) statGenerated.textContent = generated;
        if (projectCount) projectCount.textContent = projects;

        this.renderProjects();
    },

    renderProjects() {
        const grid = document.getElementById('projectGrid');
        if (!grid) return;

        const projects = ProjectManager.getProjects();
        if (projects.length === 0) {
            grid.innerHTML = `
                <div class="project-grid-empty">
                    <div style="font-size:48px;margin-bottom:12px;">🎬</div>
                    <p style="color:var(--text-muted);">暂无项目，点击上方按钮创建你的第一个分镜项目</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = projects.map(p => `
            <div class="project-card" data-project-id="${p.id}">
                <div class="project-card-thumb">${p.icon || '🎬'}</div>
                <div class="project-card-body">
                    <div class="project-card-title">${this.escapeHtml(p.name)}</div>
                    <div class="project-card-desc">${this.escapeHtml(p.description || '暂无描述')}</div>
                    <div class="project-card-meta">
                        <span>${p.shotCount || 0} 格分镜</span>
                        <span>${this.formatDate(p.updatedAt)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.projectId;
                ProjectManager.openProject(id);
            });
        });
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    }
};

/* ================================================
   5.1 ProjectManager - 项目管理
   ================================================ */
const ProjectManager = {
    projects: [],

    init() {
        this.load();
        this.bindEvents();
    },

    load() {
        const saved = localStorage.getItem('comicai_projects');
        if (saved) {
            try {
                this.projects = JSON.parse(saved);
            } catch (e) {
                this.projects = [];
            }
        }
        if (this.projects.length === 0) {
            this.createDemoProjects();
        }
    },

    createDemoProjects() {
        this.projects = [
            {
                id: 'demo-1',
                name: '校园恋爱物语',
                description: '青春校园爱情故事，讲述男女主角从相识到相恋的甜蜜过程',
                icon: '💕',
                style: '日系',
                shotCount: 12,
                createdAt: Date.now() - 86400000 * 3,
                updatedAt: Date.now() - 86400000
            },
            {
                id: 'demo-2',
                name: '雨夜追凶',
                description: '悬疑侦探故事，雨夜中的神秘追凶之旅',
                icon: '🔍',
                style: '国漫',
                shotCount: 8,
                createdAt: Date.now() - 86400000 * 7,
                updatedAt: Date.now() - 86400000 * 2
            },
            {
                id: 'demo-3',
                name: '修仙传说',
                description: '玄幻修仙题材，主角逆天改命的传奇故事',
                icon: '⚔️',
                style: '国漫',
                shotCount: 16,
                createdAt: Date.now() - 86400000 * 14,
                updatedAt: Date.now() - 86400000 * 5
            }
        ];
        this.save();
    },

    save() {
        localStorage.setItem('comicai_projects', JSON.stringify(this.projects));
    },

    getProjects() {
        return this.projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },

    createProject(name, description = '', style = '国漫') {
        const project = {
            id: 'proj-' + Date.now(),
            name,
            description,
            icon: '🎬',
            style,
            shotCount: 0,
            shots: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        this.projects.unshift(project);
        this.save();
        Logger.success('项目创建', `已创建项目「${name}」`);
        DashboardTabManager.updateStats();
        StoryboardManager.render();
        return project;
    },

    openProject(id) {
        const project = this.projects.find(p => p.id === id);
        if (project) {
            AppState.set('currentProject', project);
            NavManager.switchTab('storyboard');
            StoryboardManager.setCurrentProject(project);
            Logger.info('打开项目', `已打开项目「${project.name}」`);
        }
    },

    deleteProject(id) {
        const idx = this.projects.findIndex(p => p.id === id);
        if (idx > -1) {
            const name = this.projects[idx].name;
            this.projects.splice(idx, 1);
            this.save();
            Logger.success('项目删除', `已删除项目「${name}」`);
            DashboardTabManager.updateStats();
        }
    },

    bindEvents() {
        const newBtn = document.getElementById('newProjectBtn');
        if (newBtn) {
            newBtn.addEventListener('click', () => {
                const name = prompt('请输入项目名称：', '未命名项目');
                if (name) {
                    const desc = prompt('请输入项目描述（可选）：', '') || '';
                    this.createProject(name, desc, AppState.getSettings().defaultStyle || '国漫');
                    DashboardTabManager.renderProjects();
                }
            });
        }

        const importBtn = document.getElementById('importProjectBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        try {
                            const data = JSON.parse(ev.target.result);
                            if (Array.isArray(data)) {
                                this.projects = [...this.projects, ...data];
                            } else if (data.name) {
                                this.projects.unshift(data);
                            }
                            this.save();
                            DashboardTabManager.renderProjects();
                            Logger.success('导入成功', `已导入项目数据`);
                        } catch (err) {
                            Logger.error('导入失败', '文件格式错误');
                        }
                    };
                    reader.readAsText(file);
                };
                input.click();
            });
        }
    }
};

/* ================================================
   6. TemplateManager - 模板管理
   ================================================ */
const TemplateManager = {
    templates: [],
    hotKeywords: [],
    searchQuery: '',
    selectedKeyword: null,

    init() {
        this.load();
        this.initHotKeywords();
        this.renderTemplates();
        this.renderKeywordCloud();
        this.bindEvents();
    },

    load() {
        const saved = localStorage.getItem('comicai_templates');
        if (saved) {
            try {
                this.templates = JSON.parse(saved);
            } catch (e) {
                this.templates = [];
            }
        }
        if (this.templates.length === 0) {
            this.initPresetTemplates();
        }
    },

    initHotKeywords() {
        this.hotKeywords = [
            { word: '咕咕嘎嘎', weight: 10, trend: 'up' },
            { word: 'Doro', weight: 9, trend: 'up' },
            { word: '菲比', weight: 8, trend: 'up' },
            { word: '赛博朋克', weight: 10, trend: 'hot' },
            { word: '元宇宙', weight: 9, trend: 'hot' },
            { word: 'AI绘画', weight: 10, trend: 'hot' },
            { word: '二次元', weight: 8, trend: 'stable' },
            { word: '国潮', weight: 7, trend: 'up' },
            { word: 'NFT', weight: 6, trend: 'down' },
            { word: '赛博修仙', weight: 9, trend: 'up' },
            { word: '虚拟偶像', weight: 8, trend: 'up' },
            { word: '数字藏品', weight: 6, trend: 'stable' },
            { word: 'Midjourney', weight: 9, trend: 'hot' },
            { word: 'Stable Diffusion', weight: 8, trend: 'stable' },
            { word: '手绘风', weight: 7, trend: 'stable' },
            { word: '像素风', weight: 6, trend: 'up' },
            { word: '蒸汽朋克', weight: 7, trend: 'stable' },
            { word: '古风', weight: 8, trend: 'up' },
            { word: '仙侠', weight: 9, trend: 'hot' },
            { word: '悬疑推理', weight: 7, trend: 'stable' },
            { word: '搞笑日常', weight: 8, trend: 'up' },
            { word: '职场', weight: 6, trend: 'stable' },
            { word: '校园', weight: 9, trend: 'hot' },
            { word: '科幻', weight: 8, trend: 'up' },
            { word: '恋爱', weight: 10, trend: 'hot' },
            { word: '玄幻', weight: 9, trend: 'hot' },
            { word: '末日', weight: 7, trend: 'up' },
            { word: '重生', weight: 8, trend: 'hot' },
            { word: '穿越', weight: 9, trend: 'hot' },
            { word: '都市', weight: 7, trend: 'stable' }
        ];
    },

    initPresetTemplates() {
        this.templates = [
            { id: 'tpl-1', name: '校园恋爱开场', category: '恋爱', icon: '💕', desc: '经典校园爱情故事开篇模板', shots: 6, tags: ['校园', '恋爱', '二次元'] },
            { id: 'tpl-2', name: '初遇场景', category: '恋爱', icon: '🌸', desc: '男女主角初次相遇的经典场景', shots: 4, tags: ['恋爱', '校园', '唯美'] },
            { id: 'tpl-3', name: '告白名场面', category: '恋爱', icon: '💗', desc: '浪漫告白的分镜编排模板', shots: 8, tags: ['恋爱', '浪漫', '告白'] },
            { id: 'tpl-4', name: '热血战斗开场', category: '热血', icon: '⚔️', desc: '激烈战斗场景的开场模板', shots: 6, tags: ['热血', '战斗', '动作'] },
            { id: 'tpl-5', name: '绝招释放', category: '热血', icon: '💥', desc: '必杀技释放的多格分镜', shots: 8, tags: ['热血', '战斗', '特效'] },
            { id: 'tpl-6', name: '主角觉醒', category: '热血', icon: '🔥', desc: '主角力量觉醒的经典桥段', shots: 6, tags: ['热血', '觉醒', '成长'] },
            { id: 'tpl-7', name: '悬疑揭秘', category: '悬疑', icon: '🔍', desc: '推理揭秘场景的分镜设计', shots: 6, tags: ['悬疑', '推理', '揭秘'] },
            { id: 'tpl-8', name: '案件现场', category: '悬疑', icon: '🚨', desc: '案发现场的多视角展现', shots: 8, tags: ['悬疑', '刑侦', '惊悚'] },
            { id: 'tpl-9', name: '搞笑日常四格', category: '搞笑', icon: '😂', desc: '经典四格搞笑漫画模板', shots: 4, tags: ['搞笑', '日常', '四格'] },
            { id: 'tpl-10', name: '误会名场面', category: '搞笑', icon: '😅', desc: '因误会产生的搞笑场景', shots: 6, tags: ['搞笑', '误会', '喜剧'] },
            { id: 'tpl-11', name: '修仙渡劫', category: '玄幻', icon: '⚡', desc: '渡劫飞升的震撼场景模板', shots: 8, tags: ['玄幻', '修仙', '渡劫'] },
            { id: 'tpl-12', name: '宗门大比', category: '玄幻', icon: '🏆', desc: '宗门比武大赛的分镜编排', shots: 12, tags: ['玄幻', '比武', '竞技'] },
            { id: 'tpl-13', name: '赛博都市夜景', category: '科幻', icon: '🌆', desc: '未来都市赛博朋克风格', shots: 6, tags: ['赛博朋克', '科幻', '都市'] },
            { id: 'tpl-14', name: '太空战斗', category: '科幻', icon: '🚀', desc: '星际战争太空战斗场景', shots: 8, tags: ['科幻', '太空', '战斗'] },
            { id: 'tpl-15', name: '元宇宙入口', category: '科幻', icon: '🌀', desc: '进入虚拟世界的震撼场景', shots: 6, tags: ['元宇宙', '科幻', '虚拟'] },
            { id: 'tpl-16', name: '古风庭院', category: '古风', icon: '🏡', desc: '中国古典园林场景', shots: 4, tags: ['古风', '庭院', '唯美'] },
            { id: 'tpl-17', name: '仙侠飞行', category: '仙侠', icon: '☁️', desc: '御剑飞行腾云驾雾场景', shots: 6, tags: ['仙侠', '飞行', '玄幻'] },
            { id: 'tpl-18', name: '宫廷权谋', category: '古风', icon: '👑', desc: '宫廷斗争权谋戏码', shots: 8, tags: ['古风', '宫廷', '权谋'] },
            { id: 'tpl-19', name: '职场新人', category: '职场', icon: '💼', desc: '职场新人第一天上班', shots: 6, tags: ['职场', '新人', '都市'] },
            { id: 'tpl-20', name: '办公室恋情', category: '职场', icon: '💖', desc: '办公室浪漫爱情故事', shots: 8, tags: ['职场', '恋爱', '都市'] },
            { id: 'tpl-21', name: '创业奋斗', category: '职场', icon: '📈', desc: '创业团队奋斗历程', shots: 10, tags: ['职场', '创业', '奋斗'] },
            { id: 'tpl-22', name: '末日生存', category: '科幻', icon: '🌑', desc: '世界末日后的生存故事', shots: 8, tags: ['末日', '科幻', '生存'] },
            { id: 'tpl-23', name: '丧尸围城', category: '科幻', icon: '🧟', desc: '城市被丧尸包围的惊险场景', shots: 10, tags: ['末日', '丧尸', '恐怖'] },
            { id: 'tpl-24', name: '重生逆袭', category: '都市', icon: '⏪', desc: '重生回到过去改变命运', shots: 8, tags: ['重生', '都市', '逆袭'] },
            { id: 'tpl-25', name: '穿越古代', category: '古风', icon: '📜', desc: '现代穿越到古代的奇遇', shots: 8, tags: ['穿越', '古风', '奇幻'] },
            { id: 'tpl-26', name: '魔法学院', category: '奇幻', icon: '🏰', desc: '魔法世界学院生活', shots: 6, tags: ['奇幻', '魔法', '校园'] },
            { id: 'tpl-27', name: '精灵森林', category: '奇幻', icon: '🌲', desc: '神秘精灵居住的森林', shots: 6, tags: ['奇幻', '精灵', '自然'] },
            { id: 'tpl-28', name: '吸血鬼传说', category: '奇幻', icon: '🧛', desc: '吸血鬼与猎人的故事', shots: 8, tags: ['奇幻', '吸血鬼', '暗黑'] },
            { id: 'tpl-29', name: '狼人变身', category: '奇幻', icon: '🐺', desc: '月圆之夜狼人变身', shots: 6, tags: ['奇幻', '狼人', '变身'] },
            { id: 'tpl-30', name: '校园运动会', category: '校园', icon: '🏃', desc: '青春校园运动会场景', shots: 6, tags: ['校园', '运动', '青春'] },
            { id: 'tpl-31', name: '毕业季', category: '校园', icon: '🎓', desc: '毕业离别感人场景', shots: 8, tags: ['校园', '毕业', '青春'] },
            { id: 'tpl-32', name: '社团活动', category: '校园', icon: '🎨', desc: '丰富多彩的社团活动', shots: 6, tags: ['校园', '社团', '青春'] },
            { id: 'tpl-33', name: '夏日祭典', category: '日系', icon: '🎆', desc: '日本夏日祭典浪漫场景', shots: 6, tags: ['日系', '祭典', '浪漫'] },
            { id: 'tpl-34', name: '温泉旅行', category: '日系', icon: '♨️', desc: '温泉度假温馨场景', shots: 6, tags: ['日系', '温泉', '休闲'] },
            { id: 'tpl-35', name: '神社参拜', category: '日系', icon: '⛩️', desc: '新年神社参拜场景', shots: 4, tags: ['日系', '神社', '传统'] },
            { id: 'tpl-36', name: '悬疑密室', category: '悬疑', icon: '🔐', desc: '密室逃脱推理场景', shots: 8, tags: ['悬疑', '密室', '推理'] },
            { id: 'tpl-37', name: '连环杀人案', category: '悬疑', icon: '🔪', desc: '连环杀人案件调查', shots: 10, tags: ['悬疑', '刑侦', '惊悚'] },
            { id: 'tpl-38', name: '消失的人', category: '悬疑', icon: '👤', desc: '神秘失踪案追踪', shots: 8, tags: ['悬疑', '失踪', '神秘'] },
            { id: 'tpl-39', name: '荒岛求生', category: '冒险', icon: '🏝️', desc: '荒岛求生冒险故事', shots: 10, tags: ['冒险', '求生', '荒岛'] },
            { id: 'tpl-40', name: '古墓探险', category: '冒险', icon: '🏺', desc: '古墓探险寻宝之旅', shots: 8, tags: ['冒险', '古墓', '寻宝'] },
            { id: 'tpl-41', name: '海底世界', category: '冒险', icon: '🐠', desc: '深海探险神秘世界', shots: 6, tags: ['冒险', '海底', '奇幻'] },
            { id: 'tpl-42', name: '美食探店', category: '日常', icon: '🍜', desc: '美食探店治愈故事', shots: 6, tags: ['美食', '日常', '治愈'] },
            { id: 'tpl-43', name: '宠物日常', category: '日常', icon: '🐱', desc: '萌宠陪伴温馨日常', shots: 4, tags: ['宠物', '日常', '治愈'] },
            { id: 'tpl-44', name: '旅行日记', category: '日常', icon: '🗺️', desc: '旅行见闻记录', shots: 6, tags: ['旅行', '日常', '治愈'] },
            { id: 'tpl-45', name: '家庭聚餐', category: '日常', icon: '👨‍👩‍👧', desc: '家庭温馨聚餐场景', shots: 4, tags: ['家庭', '日常', '温馨'] },
            { id: 'tpl-46', name: '赛博修仙', category: '科幻', icon: '🧬', desc: '未来科技与修仙结合', shots: 8, tags: ['赛博修仙', '科幻', '玄幻'] },
            { id: 'tpl-47', name: '虚拟偶像', category: '科幻', icon: '🎤', desc: '虚拟偶像演唱会', shots: 8, tags: ['虚拟偶像', '科幻', '音乐'] },
            { id: 'tpl-48', name: 'AI觉醒', category: '科幻', icon: '🤖', desc: '人工智能自我觉醒', shots: 6, tags: ['AI', '科幻', '未来'] },
            { id: 'tpl-49', name: '时间倒流', category: '科幻', icon: '⏳', desc: '时间倒流回到过去', shots: 6, tags: ['时间', '科幻', '穿越'] },
            { id: 'tpl-50', name: '平行世界', category: '科幻', icon: '🔲', desc: '穿越平行世界的冒险', shots: 8, tags: ['平行世界', '科幻', '冒险'] },
            { id: 'tpl-51', name: '武侠江湖', category: '古风', icon: '🗡️', desc: '武侠世界江湖恩怨', shots: 10, tags: ['武侠', '古风', '江湖'] },
            { id: 'tpl-52', name: '神医驾到', category: '古风', icon: '💊', desc: '古代神医治病救人', shots: 6, tags: ['神医', '古风', '治愈'] },
            { id: 'tpl-53', name: '商战风云', category: '职场', icon: '💹', desc: '商业竞争激烈交锋', shots: 8, tags: ['商战', '职场', '竞争'] },
            { id: 'tpl-54', name: '电竞传奇', category: '热血', icon: '🎮', desc: '电竞选手夺冠之路', shots: 10, tags: ['电竞', '热血', '竞技'] },
            { id: 'tpl-55', name: '乐队组建', category: '热血', icon: '🎸', desc: '组建乐队追逐梦想', shots: 8, tags: ['音乐', '热血', '青春'] },
            { id: 'tpl-56', name: '恋爱喜剧', category: '恋爱', icon: '😆', desc: '轻松搞笑恋爱喜剧', shots: 6, tags: ['恋爱', '搞笑', '喜剧'] },
            { id: 'tpl-57', name: '虐心恋曲', category: '恋爱', icon: '💔', desc: '悲伤虐心爱情故事', shots: 8, tags: ['恋爱', '虐心', '悲剧'] },
            { id: 'tpl-58', name: '校园怪谈', category: '悬疑', icon: '👻', desc: '校园恐怖传说故事', shots: 6, tags: ['校园', '悬疑', '恐怖'] },
            { id: 'tpl-59', name: '超能力者', category: '科幻', icon: '✨', desc: '拥有超能力的少年', shots: 8, tags: ['超能力', '科幻', '青春'] },
            { id: 'tpl-60', name: '星际穿越', category: '科幻', icon: '🌌', desc: '穿越星际探索未知', shots: 10, tags: ['星际', '科幻', '冒险'] }
        ];
        this.save();
    },

    save() {
        localStorage.setItem('comicai_templates', JSON.stringify(this.templates));
    },

    getTemplates() {
        return this.templates;
    },

    getCategories() {
        const cats = new Set(this.templates.map(t => t.category));
        return ['all', ...Array.from(cats)];
    },

    searchTemplates(query) {
        if (!query) return this.templates;
        const q = query.toLowerCase();
        return this.templates.filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.desc.toLowerCase().includes(q) ||
            (t.tags || []).some(tag => tag.toLowerCase().includes(q))
        );
    },

    filterByKeyword(keyword) {
        if (!keyword) return this.templates;
        return this.templates.filter(t =>
            (t.tags || []).includes(keyword) ||
            t.category === keyword ||
            t.name.includes(keyword)
        );
    },

    renderKeywordCloud() {
        const container = document.getElementById('keywordCloud');
        if (!container) return;

        const sorted = [...this.hotKeywords].sort((a, b) => b.weight - a.weight);
        
        container.innerHTML = `
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
                ${sorted.map(k => `
                    <button class="keyword-tag ${k.trend === 'hot' ? 'hot' : k.trend === 'up' ? 'up' : ''}" 
                            data-keyword="${k.word}"
                            style="font-size:${12 + k.weight * 0.8}px;padding:4px 10px;border-radius:20px;">
                        ${k.word}
                        ${k.trend === 'hot' ? '🔥' : k.trend === 'up' ? '⬆' : k.trend === 'down' ? '⬇' : ''}
                    </button>
                `).join('')}
            </div>
        `;

        container.querySelectorAll('.keyword-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const keyword = tag.dataset.keyword;
                this.selectedKeyword = keyword;
                this.updateKeywordHighlight();
                this.renderTemplates();
            });
        });
    },

    updateKeywordHighlight() {
        const container = document.getElementById('keywordCloud');
        if (!container) return;
        container.querySelectorAll('.keyword-tag').forEach(tag => {
            tag.classList.toggle('active', tag.dataset.keyword === this.selectedKeyword);
        });
    },

    renderTemplates() {
        const grid = document.getElementById('templateGrid');
        if (!grid) return;

        let templates = this.templates;

        if (this.selectedKeyword) {
            templates = this.filterByKeyword(this.selectedKeyword);
        } else if (this.searchQuery) {
            templates = this.searchTemplates(this.searchQuery);
        } else {
            const filter = document.querySelector('.template-category-filter');
            const category = filter?.value || 'all';
            if (category !== 'all') {
                templates = templates.filter(t => t.category === category);
            }
        }

        if (templates.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-muted);">
                    <div style="font-size:48px;margin-bottom:12px;">🔍</div>
                    <p>没有找到匹配的模板</p>
                    <p style="font-size:12px;margin-top:4px;">尝试更换关键词或搜索条件</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = templates.map(t => `
            <div class="template-card" data-template-id="${t.id}">
                <div class="template-thumb">${t.icon}</div>
                <div class="template-info">
                    <div class="template-name">${t.name}</div>
                    <div class="template-desc">${t.desc} · ${t.shots}格</div>
                    <div class="template-tags" style="display:flex;flex-wrap:wrap;gap:3px;margin-top:6px;">
                        ${(t.tags || []).slice(0, 3).map(tag => `<span class="tag tag-xs">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.templateId;
                this.useTemplate(id);
            });
        });
    },

    bindEvents() {
        const filter = document.querySelector('.template-category-filter');
        if (filter) {
            filter.addEventListener('change', () => {
                this.selectedKeyword = null;
                this.updateKeywordHighlight();
                this.renderTemplates();
            });
        }

        const searchInput = document.getElementById('templateSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.selectedKeyword = null;
                this.updateKeywordHighlight();
                this.renderTemplates();
            });
        }

        const clearKeywordBtn = document.getElementById('clearKeywordBtn');
        if (clearKeywordBtn) {
            clearKeywordBtn.addEventListener('click', () => {
                this.selectedKeyword = null;
                this.updateKeywordHighlight();
                this.renderTemplates();
            });
        }
    },

    useTemplate(id) {
        const template = this.templates.find(t => t.id === id);
        if (template) {
            Logger.info('使用模板', `应用模板「${template.name}」`);
            const project = ProjectManager.createProject(template.name, template.desc, '日系');
            project.icon = template.icon;
            project.tags = template.tags;
            ProjectManager.save();
            NavManager.switchTab('generator');
        }
    }
};

/* ================================================
   7. GeneratorManager - 分镜生成器
   ================================================ */
const GeneratorManager = {
    currentShots: [],
    currentPage: 1,
    totalPages: 1,
    zoom: 100,
    selectedShot: null,
    descriptionTemplates: [],

    init() {
        this.initDescriptionTemplates();
        this.bindEvents();
    },

    initDescriptionTemplates() {
        this.descriptionTemplates = [
            { name: '角色特写', template: '[角色名]的面部特写，[表情描述]，[光线描述]，[背景氛围]' },
            { name: '对话场景', template: '[角色A]和[角色B]在[场景]中对话，[动作描述]，[情绪氛围]' },
            { name: '环境全景', template: '[场景]的全景镜头，[时间描述]，[天气描述]，[氛围描写]' },
            { name: '动作场景', template: '[角色]正在[动作]，[动作细节]，[速度感]，[背景动态]' },
            { name: '回忆闪回', template: '[角色]的回忆画面，[年代感]，[模糊效果]，[关键元素]' },
            { name: '悬疑场景', template: '[场景]的神秘角落，[光影效果]，[可疑元素]，[紧张氛围]' },
            { name: '恋爱场景', template: '[角色A]和[角色B]在[浪漫场景]中，[暧昧动作]，[温馨氛围]' },
            { name: '战斗场景', template: '[角色]与[敌人]激烈战斗，[招式描写]，[特效]，[破坏力]' }
        ];
    },

    bindEvents() {
        document.querySelectorAll('.script-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.scriptTab;
                document.querySelectorAll('.script-tab').forEach(t => {
                    t.classList.toggle('active', t.dataset.scriptTab === tabId);
                });
                document.querySelectorAll('.script-panel').forEach(p => {
                    p.classList.toggle('active', p.id === `script-${tabId}`);
                });
            });
        });

        const genBtn = document.getElementById('generateBtn');
        if (genBtn) {
            genBtn.addEventListener('click', () => this.generate());
        }

        const addSceneBtn = document.getElementById('addSceneBtn');
        if (addSceneBtn) {
            addSceneBtn.addEventListener('click', () => this.addSceneItem());
        }

        const zoomIn = document.getElementById('zoomInBtn');
        const zoomOut = document.getElementById('zoomOutBtn');
        const prevPage = document.getElementById('prevPageBtn');
        const nextPage = document.getElementById('nextPageBtn');

        if (zoomIn) zoomIn.addEventListener('click', () => this.zoomIn());
        if (zoomOut) zoomOut.addEventListener('click', () => this.zoomOut());
        if (prevPage) prevPage.addEventListener('click', () => this.prevPage());
        if (nextPage) nextPage.addEventListener('click', () => this.nextPage());

        const saveBtn = document.getElementById('saveProjectBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveAsProject());
        }

        const editShotBtn = document.getElementById('editShotBtn');
        if (editShotBtn) {
            editShotBtn.addEventListener('click', () => this.openShotEditor());
        }

        const arrangeBtn = document.getElementById('arrangeShotsBtn');
        if (arrangeBtn) {
            arrangeBtn.addEventListener('click', () => this.openArrangePanel());
        }

        const keywordInput = document.getElementById('shotKeywordsInput');
        if (keywordInput) {
            keywordInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addKeywordToShot(keywordInput.value);
                    keywordInput.value = '';
                }
            });
        }
    },

    generate() {
        const scriptInput = document.getElementById('scriptInput');
        const script = scriptInput?.value?.trim();
        if (!script) {
            Logger.warn('生成失败', '请先输入剧本内容');
            alert('请先输入剧本内容');
            return;
        }

        Logger.generate('分镜生成开始', '正在分析剧本并生成镜头...');

        const btn = document.getElementById('generateBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span>⏳</span> 生成中...';
        }

        const badge = document.getElementById('genStatusBadge');
        if (badge) {
            badge.textContent = '生成中...';
            badge.className = 'badge badge-warning';
        }

        setTimeout(() => {
            this.currentShots = this.generateMockShots(script, 6, '日系');
            this.currentPage = 1;
            this.totalPages = 1;
            this.selectedShot = null;
            this.renderPreview();
            this.renderShotDetail(null);

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span>✨</span> 开始生成分镜';
            }
            if (badge) {
                badge.textContent = '生成完成';
                badge.className = 'badge badge-success';
            }

            const exportBtn = document.getElementById('exportBtn');
            const saveBtn = document.getElementById('saveProjectBtn');
            if (exportBtn) exportBtn.disabled = false;
            if (saveBtn) saveBtn.disabled = false;

            const count = AppState.get('generatedCount') || 0;
            AppState.set('generatedCount', count + 1);
            DashboardTabManager.updateStats();

            Logger.success('分镜生成完成', `成功生成${this.currentShots.length}格分镜`);
        }, 2000);
    },

    generateMockShots(script, count, style) {
        const shotTypes = ['全景', '中景', '近景', '特写', '俯视', '仰视'];
        const icons = ['🏙️', '🚶', '😮', '👀', '⬇️', '⬆️', '🌙', '☀️', '💬', '⚡'];
        const actions = [
            '角色登场场景', '对话交流场景', '情绪特写', '环境描写',
            '回忆闪回', '冲突升级', '转折点', '悬念设置',
            '动作场景', '心理描写'
        ];
        const keywordsList = [
            ['校园', '青春', '阳光'],
            ['对话', '情感', '交流'],
            ['表情', '特写', '情绪'],
            ['环境', '氛围', '背景'],
            ['回忆', '闪回', '过去'],
            ['冲突', '紧张', '对抗'],
            ['转折', '意外', '惊喜'],
            ['悬念', '神秘', '未知'],
            ['动作', '速度', '力量'],
            ['心理', '内心', '思考']
        ];

        const shots = [];
        for (let i = 0; i < count; i++) {
            shots.push({
                id: 'shot-' + i,
                index: i + 1,
                title: actions[i % actions.length],
                type: shotTypes[i % shotTypes.length],
                icon: icons[i % icons.length],
                description: `第${i + 1}格分镜：${actions[i % actions.length]}的详细画面描述，包含人物动作、表情、环境氛围等元素。`,
                duration: 3 + Math.floor(Math.random() * 5),
                characters: ['林小雨', '陈默'].slice(0, 1 + Math.floor(Math.random() * 2)),
                camera: {
                    movement: ['静止', '推进', '拉远', '平移'][Math.floor(Math.random() * 4)],
                    angle: shotTypes[i % shotTypes.length]
                },
                dialogue: i % 2 === 0 ? '这是一段示例对话内容...' : '',
                style: style,
                keywords: keywordsList[i % keywordsList.length],
                customKeywords: []
            });
        }
        return shots;
    },

    renderPreview() {
        const canvas = document.getElementById('previewCanvas');
        if (!canvas) return;

        if (this.currentShots.length === 0) {
            canvas.innerHTML = `
                <div class="detail-empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
                        <rect x="2" y="2" width="20" height="20" rx="2"/>
                        <path d="M2 12h20M12 2v20"/>
                        <circle cx="7" cy="7" r="1"/><circle cx="17" cy="7" r="1"/>
                        <circle cx="7" cy="17" r="1"/><circle cx="17" cy="17" r="1"/>
                    </svg>
                    <p>输入剧本后点击"开始生成"创建你的漫剧分镜</p>
                    <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">支持多种漫画风格，AI自动编排镜头语言</p>
                </div>
            `;
            return;
        }

        const cols = 3;
        const shots = this.currentShots;
        const svg = DashboardTabManager.generateStoryboardSVG(shots, '16:9', cols);

        canvas.innerHTML = `
            <div style="width:${this.zoom}%;transform-origin:top left;">
                ${svg}
            </div>
        `;

        const currentPageEl = document.getElementById('currentPage');
        const totalPagesEl = document.getElementById('totalPages');
        const zoomLevelEl = document.getElementById('zoomLevel');
        if (currentPageEl) currentPageEl.textContent = this.currentPage;
        if (totalPagesEl) totalPagesEl.textContent = this.totalPages;
        if (zoomLevelEl) zoomLevelEl.textContent = this.zoom + '%';
    },

    renderShotDetail(shot) {
        const body = document.getElementById('shotDetailBody');
        const hint = document.getElementById('shotDetailHint');
        if (!body) return;

        if (!shot) {
            if (hint) hint.textContent = '选择分镜查看';
            body.innerHTML = `
                <div class="detail-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <p>选择一个分镜格子查看详细信息</p>
                </div>
            `;
            return;
        }

        if (hint) hint.textContent = `第${shot.index}格`;

        const allKeywords = [...(shot.keywords || []), ...(shot.customKeywords || [])];

        body.innerHTML = `
            <div style="margin-bottom:16px;">
                <div style="font-size:16px;font-weight:600;margin-bottom:4px;">${shot.title}</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <span class="tag tag-primary">${shot.type}</span>
                    <span class="tag">${shot.duration}秒</span>
                    <span class="tag">${shot.style}</span>
                </div>
            </div>
            <div style="margin-bottom:16px;">
                <div style="font-size:13px;font-weight:500;margin-bottom:6px;color:var(--text-secondary);">画面描述</div>
                <div style="font-size:13px;color:var(--text-muted);line-height:1.6;">${shot.description}</div>
            </div>
            <div style="margin-bottom:16px;">
                <div style="font-size:13px;font-weight:500;margin-bottom:6px;color:var(--text-secondary);">关键词标签</div>
                <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">
                    ${allKeywords.map(k => `
                        <span class="tag tag-secondary" data-keyword="${k}">${k} <button style="margin-left:4px;font-size:10px;cursor:pointer;opacity:0.7;" onclick="GeneratorManager.removeKeyword('${shot.id}', '${k}')">✕</button></span>
                    `).join('')}
                </div>
                <div style="display:flex;gap:4px;">
                    <input type="text" class="text-input text-input-sm" id="shotKeywordsInput" placeholder="输入关键词，回车添加">
                    <button class="btn btn-sm" onclick="GeneratorManager.addKeywordToShot(document.getElementById('shotKeywordsInput')?.value)">添加</button>
                </div>
            </div>
            <div style="margin-bottom:16px;">
                <div style="font-size:13px;font-weight:500;margin-bottom:6px;color:var(--text-secondary);">镜头信息</div>
                <div style="font-size:13px;color:var(--text-muted);">
                    <div>运镜方式：${shot.camera.movement}</div>
                    <div>镜头角度：${shot.camera.angle}</div>
                </div>
            </div>
            <div style="margin-bottom:16px;">
                <div style="font-size:13px;font-weight:500;margin-bottom:6px;color:var(--text-secondary);">出场角色</div>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                    ${shot.characters.map(c => `<span class="tag">${c}</span>`).join('')}
                </div>
            </div>
            ${shot.dialogue ? `
                <div style="margin-bottom:16px;">
                    <div style="font-size:13px;font-weight:500;margin-bottom:6px;color:var(--text-secondary);">对话内容</div>
                    <div style="font-size:13px;color:var(--text-muted);padding:8px 12px;background:var(--bg-secondary);border-radius:8px;">
                        "${shot.dialogue}"
                    </div>
                </div>
            ` : ''}
            <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-color);">
                <div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--text-secondary);">描述模板提示</div>
                <div style="display:flex;flex-wrap:wrap;gap:4px;">
                    ${this.descriptionTemplates.map(t => `
                        <button class="btn btn-ghost btn-xs" onclick="GeneratorManager.applyDescriptionTemplate('${shot.id}', \`${t.template}\`)">${t.name}</button>
                    `).join('')}
                </div>
            </div>
        `;
    },

    addKeywordToShot(keyword) {
        if (!keyword || !this.selectedShot) return;
        const shot = this.currentShots.find(s => s.id === this.selectedShot);
        if (!shot) return;
        if (!shot.customKeywords) shot.customKeywords = [];
        if (!shot.customKeywords.includes(keyword.trim())) {
            shot.customKeywords.push(keyword.trim());
            this.renderShotDetail(shot);
            Logger.info('分镜编辑', `添加关键词：${keyword}`);
        }
    },

    removeKeyword(shotId, keyword) {
        const shot = this.currentShots.find(s => s.id === shotId);
        if (!shot) return;
        if (shot.customKeywords) {
            shot.customKeywords = shot.customKeywords.filter(k => k !== keyword);
            this.renderShotDetail(shot);
        }
    },

    applyDescriptionTemplate(shotId, template) {
        const shot = this.currentShots.find(s => s.id === shotId);
        if (!shot) return;
        shot.description = template;
        this.renderShotDetail(shot);
        Logger.info('分镜编辑', `应用描述模板：${template}`);
    },

    openShotEditor() {
        if (!this.selectedShot) {
            alert('请先选择一个分镜进行编辑');
            return;
        }
        const shot = this.currentShots.find(s => s.id === this.selectedShot);
        if (!shot) return;

        const newTitle = prompt('请输入分镜标题：', shot.title);
        if (newTitle) shot.title = newTitle;

        const newDesc = prompt('请输入分镜描述：', shot.description);
        if (newDesc) shot.description = newDesc;

        const newDuration = prompt('请输入时长（秒）：', shot.duration);
        if (newDuration) shot.duration = parseInt(newDuration);

        this.renderShotDetail(shot);
        this.renderPreview();
        Logger.success('分镜编辑', `已更新第${shot.index}格分镜`);
    },

    openArrangePanel() {
        if (this.currentShots.length === 0) {
            alert('暂无分镜可排序');
            return;
        }

        let order = '';
        this.currentShots.forEach((s, i) => {
            order += `${i + 1}. ${s.title}\n`;
        });

        const newOrder = prompt('请输入新的分镜顺序（每行一个数字，代表原序号）：\n\n当前顺序：\n' + order);
        if (!newOrder) return;

        const indices = newOrder.trim().split('\n').map(line => {
            const match = line.match(/(\d+)/);
            return match ? parseInt(match[1]) - 1 : -1;
        }).filter(i => i >= 0 && i < this.currentShots.length);

        if (indices.length !== this.currentShots.length) {
            alert('顺序数量不匹配，请重新输入');
            return;
        }

        const newShots = indices.map(i => ({ ...this.currentShots[i] }));
        newShots.forEach((s, i) => { s.index = i + 1; });
        this.currentShots = newShots;

        this.renderPreview();
        this.renderShotDetail(this.selectedShot ? this.currentShots.find(s => s.title === this.selectedShot.title) : null);
        Logger.success('分镜排序', '分镜顺序已更新');
    },

    addSceneItem() {
        const list = document.getElementById('sceneList');
        if (!list) return;

        const items = list.querySelectorAll('.scene-item');
        const index = items.length + 1;

        const item = document.createElement('div');
        item.className = 'scene-item';
        item.innerHTML = `
            <div class="scene-item-header">
                <span class="scene-item-index">${index}</span>
                <input type="text" class="scene-item-title" value="场景${index}" placeholder="场景标题">
                <button class="icon-btn scene-item-delete">✕</button>
            </div>
            <div class="scene-item-body">
                <div class="form-group">
                    <label class="form-label">场景描述</label>
                    <textarea class="form-textarea form-textarea-sm" rows="2" placeholder="描述场景环境、氛围..."></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">关键词标签</label>
                    <input type="text" class="form-input form-input-sm" placeholder="用逗号分隔多个关键词">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">镜头类型</label>
                        <select class="select-input select-sm">
                            <option>全景</option><option>中景</option><option>近景</option>
                            <option>特写</option><option>俯视</option><option>仰视</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">出场角色</label>
                        <select class="select-input select-sm">
                            <option>选择角色...</option>
                        </select>
                    </div>
                </div>
            </div>
        `;

        const deleteBtn = item.querySelector('.scene-item-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                item.remove();
                this.updateSceneIndices();
            });
        }

        list.appendChild(item);
    },

    updateSceneIndices() {
        const list = document.getElementById('sceneList');
        if (!list) return;
        list.querySelectorAll('.scene-item').forEach((item, i) => {
            const idx = item.querySelector('.scene-item-index');
            if (idx) idx.textContent = i + 1;
        });
    },

    zoomIn() {
        if (this.zoom < 200) {
            this.zoom += 25;
            this.renderPreview();
        }
    },

    zoomOut() {
        if (this.zoom > 25) {
            this.zoom -= 25;
            this.renderPreview();
        }
    },

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderPreview();
        }
    },

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderPreview();
        }
    },

    saveAsProject() {
        const name = prompt('请输入项目名称：', '未命名分镜项目');
        if (!name) return;

        const project = ProjectManager.createProject(name, '从生成器创建的项目', '日系');
        project.shots = this.currentShots;
        project.shotCount = this.currentShots.length;
        ProjectManager.save();

        Logger.success('项目保存', `已保存为项目「${name}」`);
        alert('项目保存成功！');
    }
};

/* ================================================
   8. StoryboardManager - 分镜时间线
   ================================================ */
const StoryboardManager = {
    currentView: 'timeline',
    currentProject: null,
    filterType: 'all',
    searchQuery: '',

    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.querySelectorAll('.view-toggle-btn[data-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });

        const typeFilter = document.getElementById('shotTypeFilter');
        const searchInput = document.getElementById('shotSearch');
        const addShotBtn = document.getElementById('addShotBtn');
        const autoArrangeBtn = document.getElementById('autoArrangeBtn');

        if (typeFilter) typeFilter.addEventListener('change', () => { this.filterType = typeFilter.value; this.render(); });
        if (searchInput) searchInput.addEventListener('input', () => { this.searchQuery = searchInput.value; this.render(); });
        if (addShotBtn) addShotBtn.addEventListener('click', () => this.addShot());
        if (autoArrangeBtn) autoArrangeBtn.addEventListener('click', () => this.autoArrange());

        const projectSelect = document.getElementById('timelineProjectSelect');
        if (projectSelect) {
            projectSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    ProjectManager.openProject(e.target.value);
                }
            });
        }
    },

    setCurrentProject(project) {
        this.currentProject = project;
        this.render();
    },

    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('.view-toggle-btn[data-view]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        document.querySelectorAll('.timeline-view').forEach(v => {
            v.classList.toggle('active', v.id === `${view}View`);
        });
    },

    getFilteredShots() {
        if (!this.currentProject || !this.currentProject.shots) return [];

        let shots = [...this.currentProject.shots];

        if (this.filterType !== 'all') {
            shots = shots.filter(s => {
                const typeMap = { wide: '全景', medium: '中景', close: '近景', detail: '特写' };
                return s.type === typeMap[this.filterType];
            });
        }

        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            shots = shots.filter(s =>
                s.title.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q)
            );
        }

        return shots;
    },

    render() {
        this.renderProjectSelect();

        const shots = this.getFilteredShots();
        const shotCount = document.getElementById('shotCount');
        const totalDuration = document.getElementById('totalDuration');

        if (shotCount) shotCount.textContent = shots.length;
        if (totalDuration) {
            const dur = shots.reduce((sum, s) => sum + (s.duration || 0), 0);
            totalDuration.textContent = dur + 's';
        }

        this.renderTimelineView(shots);
        this.renderListView(shots);
    },

    renderProjectSelect() {
        const select = document.getElementById('timelineProjectSelect');
        if (!select) return;

        const projects = ProjectManager.getProjects();
        select.innerHTML = '<option value="">选择项目...</option>' +
            projects.map(p => `<option value="${p.id}" ${this.currentProject?.id === p.id ? 'selected' : ''}>${p.name}</option>`).join('');
    },

    renderTimelineView(shots) {
        const container = document.getElementById('timelineContainer');
        if (!container) return;

        if (shots.length === 0) {
            container.innerHTML = `
                <div class="timeline-empty">
                    <div style="font-size:48px;margin-bottom:12px;">🎬</div>
                    <p style="color:var(--text-muted);">暂无分镜，选择项目或添加新分镜开始编辑</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="shot-timeline">
                ${shots.map((shot, i) => `
                    <div class="shot-item" data-shot-id="${shot.id}" draggable="true">
                        <div class="shot-index">${shot.index || i + 1}</div>
                        <div class="shot-thumb">${shot.icon || '🎬'}</div>
                        <div class="shot-content">
                            <div class="shot-title">${this.escapeHtml(shot.title)}</div>
                            <div class="shot-desc">${this.escapeHtml(shot.description?.slice(0, 50) || '')}...</div>
                        </div>
                        <span class="shot-type">${shot.type}</span>
                        <span class="shot-duration">${shot.duration || 3}s</span>
                        <div class="shot-actions">
                            <button class="icon-btn" title="上移">⬆</button>
                            <button class="icon-btn" title="下移">⬇</button>
                            <button class="icon-btn" title="删除">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.bindShotItemEvents(container);
    },

    renderListView(shots) {
        const tbody = document.getElementById('shotTableBody');
        if (!tbody) return;

        tbody.innerHTML = shots.map((shot, i) => `
            <tr data-shot-id="${shot.id}">
                <td>${shot.index || i + 1}</td>
                <td><div class="shot-thumb" style="width:80px;height:50px;">${shot.icon || '🎬'}</div></td>
                <td>
                    <div style="font-weight:500;">${this.escapeHtml(shot.title)}</div>
                    <div style="font-size:12px;color:var(--text-muted);">${this.escapeHtml(shot.description?.slice(0, 40) || '')}...</div>
                </td>
                <td><span class="tag tag-primary">${shot.type}</span></td>
                <td>${shot.duration || 3}s</td>
                <td>${(shot.characters || []).join(', ') || '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-ghost btn-xs">编辑</button>
                        <button class="btn btn-danger btn-xs">删除</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    bindShotItemEvents(container) {
        const items = container.querySelectorAll('.shot-item');
        items.forEach(item => {
            const actions = item.querySelectorAll('.shot-actions .icon-btn');
            if (actions[0]) actions[0].addEventListener('click', (e) => { e.stopPropagation(); this.moveShot(item.dataset.shotId, -1); });
            if (actions[1]) actions[1].addEventListener('click', (e) => { e.stopPropagation(); this.moveShot(item.dataset.shotId, 1); });
            if (actions[2]) actions[2].addEventListener('click', (e) => { e.stopPropagation(); this.deleteShot(item.dataset.shotId); });
        });
    },

    addShot() {
        if (!this.currentProject) {
            const name = prompt('请先创建项目，输入项目名称：');
            if (!name) return;
            const project = ProjectManager.createProject(name, '', '日系');
            this.currentProject = project;
        }

        const newShot = {
            id: 'shot-' + Date.now(),
            index: (this.currentProject.shots?.length || 0) + 1,
            title: '新分镜',
            type: '中景',
            icon: '🎬',
            description: '点击编辑分镜描述...',
            duration: 3,
            characters: []
        };

        if (!this.currentProject.shots) this.currentProject.shots = [];
        this.currentProject.shots.push(newShot);
        this.currentProject.shotCount = this.currentProject.shots.length;
        ProjectManager.save();
        this.render();
        Logger.info('添加分镜', `已添加第${newShot.index}格分镜`);
    },

    moveShot(shotId, direction) {
        if (!this.currentProject?.shots) return;
        const idx = this.currentProject.shots.findIndex(s => s.id === shotId);
        if (idx === -1) return;

        const newIdx = idx + direction;
        if (newIdx < 0 || newIdx >= this.currentProject.shots.length) return;

        const temp = this.currentProject.shots[idx];
        this.currentProject.shots[idx] = this.currentProject.shots[newIdx];
        this.currentProject.shots[newIdx] = temp;

        this.currentProject.shots.forEach((s, i) => s.index = i + 1);
        ProjectManager.save();
        this.render();
    },

    deleteShot(shotId) {
        if (!this.currentProject?.shots) return;
        const idx = this.currentProject.shots.findIndex(s => s.id === shotId);
        if (idx === -1) return;

        if (!confirm('确定删除这个分镜吗？')) return;

        this.currentProject.shots.splice(idx, 1);
        this.currentProject.shots.forEach((s, i) => s.index = i + 1);
        this.currentProject.shotCount = this.currentProject.shots.length;
        ProjectManager.save();
        this.render();
        Logger.success('删除分镜', `已删除第${idx + 1}格分镜`);
    },

    autoArrange() {
        if (!this.currentProject?.shots || this.currentProject.shots.length === 0) {
            alert('请先添加分镜');
            return;
        }

        Logger.generate('AI智能编排', '正在优化分镜顺序和镜头语言...');

        setTimeout(() => {
            Logger.success('AI编排完成', '已根据电影语言优化分镜顺序');
        }, 1000);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
};

/* ================================================
   9. CharacterManager - 角色库
   ================================================ */
const CharacterManager = {
    characters: [],
    currentView: 'grid',
    filterGender: 'all',
    filterStyle: 'all',
    searchQuery: '',

    init() {
        this.load();
        this.bindEvents();
    },

    load() {
        const saved = localStorage.getItem('comicai_characters');
        if (saved) {
            try {
                this.characters = JSON.parse(saved);
            } catch (e) {
                this.characters = [];
            }
        }
        if (this.characters.length === 0) {
            this.initPresetCharacters();
        }
    },

    initPresetCharacters() {
        this.characters = [
            { id: 'char-1', name: '林小雨', gender: 'female', age: 17, role: '女主', personality: '活泼开朗', style: '日系', icon: '👧', desc: '普通高中生，性格开朗善良，意外卷入神秘事件' },
            { id: 'char-2', name: '陈默', gender: 'male', age: 18, role: '男主', personality: '高冷学霸', style: '日系', icon: '👦', desc: '天才少年，表面冷漠内心温柔，是小雨的青梅竹马' },
            { id: 'char-3', name: '苏晓晓', gender: 'female', age: 17, role: '女配', personality: '元气少女', style: '日系', icon: '👱‍♀️', desc: '小雨的闺蜜，活泼好动，是校园里的开心果' },
            { id: 'char-4', name: '李云飞', gender: 'male', age: 18, role: '男配', personality: '热血冲动', style: '日系', icon: '🧑', desc: '陈默的室友，体育健将，性格直来直去' },
            { id: 'char-5', name: '林雨晴', gender: 'female', age: 25, role: '姐姐', personality: '温柔知性', style: '国漫', icon: '👩', desc: '小雨的姐姐，是一名警察，负责调查神秘案件' },
            { id: 'char-6', name: '王老师', gender: 'male', age: 45, role: '老师', personality: '严肃认真', style: '国漫', icon: '👨‍🏫', desc: '高三班主任，教学严格但关心学生' },
            { id: 'char-7', name: '张小花', gender: 'female', age: 16, role: '学妹', personality: '害羞内向', style: '日系', icon: '🌸', desc: '一年级学妹，喜欢画画，暗恋陈默' },
            { id: 'char-8', name: '赵大龙', gender: 'male', age: 19, role: '反派', personality: '凶狠狡诈', style: '国漫', icon: '😈', desc: '街头小混混头目，经常找主角麻烦' },
            { id: 'char-9', name: '神秘人', gender: 'other', age: '?', role: '神秘角色', personality: '神秘莫测', style: '国漫', icon: '🎭', desc: '身份不明的神秘人物，似乎知道很多秘密' },
            { id: 'char-10', name: '陈小豆', gender: 'female', age: 10, role: '妹妹', personality: '古灵精怪', style: 'Q版', icon: '🧒', desc: '陈默的妹妹，人小鬼大，经常捉弄哥哥' },
            { id: 'char-11', name: '周大爷', gender: 'male', age: 65, role: '邻居', personality: '和蔼可亲', style: '写实', icon: '👴', desc: '看传达室的老爷爷，知道很多校园传说' },
            { id: 'char-12', name: '梦琪', gender: 'female', age: 17, role: '转学生', personality: '神秘优雅', style: '日系', icon: '💫', desc: '神秘转学生，似乎拥有某种特殊能力' }
        ];
        this.save();
    },

    save() {
        localStorage.setItem('comicai_characters', JSON.stringify(this.characters));
    },

    getCharacters() {
        return this.characters;
    },

    bindEvents() {
        document.querySelectorAll('.view-toggle-btn[data-view="grid"], .view-toggle-btn[data-view="table"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });

        const genderFilter = document.getElementById('charGenderFilter');
        const styleFilter = document.getElementById('charStyleFilter');
        const searchInput = document.getElementById('charSearch');

        if (genderFilter) genderFilter.addEventListener('change', () => { this.filterGender = genderFilter.value; this.render(); });
        if (styleFilter) styleFilter.addEventListener('change', () => { this.filterStyle = styleFilter.value; this.render(); });
        if (searchInput) searchInput.addEventListener('input', () => { this.searchQuery = searchInput.value; this.render(); });

        const addBtn = document.getElementById('addCharacterBtn');
        if (addBtn) addBtn.addEventListener('click', () => this.addCharacter());
    },

    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('.view-toggle-btn[data-view="grid"], .view-toggle-btn[data-view="table"]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        document.querySelectorAll('.device-view').forEach(v => {
            if (v.id === 'charViewGrid') v.classList.toggle('active', view === 'grid');
            if (v.id === 'charViewTable') v.classList.toggle('active', view === 'table');
        });
    },

    getFilteredCharacters() {
        let chars = [...this.characters];

        if (this.filterGender !== 'all') {
            chars = chars.filter(c => c.gender === this.filterGender);
        }

        if (this.filterStyle !== 'all') {
            chars = chars.filter(c => c.style === this.filterStyle);
        }

        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            chars = chars.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.personality?.toLowerCase().includes(q) ||
                c.desc?.toLowerCase().includes(q)
            );
        }

        return chars;
    },

    render() {
        const chars = this.getFilteredCharacters();
        const count = document.getElementById('charCount');
        if (count) count.textContent = chars.length;

        this.renderGridView(chars);
        this.renderTableView(chars);
    },

    renderGridView(chars) {
        const grid = document.getElementById('characterGrid');
        if (!grid) return;

        grid.innerHTML = chars.map(c => `
            <div class="character-card" data-char-id="${c.id}">
                <div class="character-avatar">${c.icon}</div>
                <div class="character-info">
                    <div class="character-name">${this.escapeHtml(c.name)}</div>
                    <div class="character-role">${c.role} · ${c.age}岁</div>
                    <div class="character-tags">
                        <span class="tag tag-primary">${c.style}</span>
                        <span class="tag">${this.genderLabel(c.gender)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showCharacterDetail(card.dataset.charId);
            });
        });
    },

    renderTableView(chars) {
        const tbody = document.getElementById('charTableBody');
        if (!tbody) return;

        tbody.innerHTML = chars.map(c => `
            <tr data-char-id="${c.id}">
                <td><div style="font-size:28px;width:40px;text-align:center;">${c.icon}</div></td>
                <td style="font-weight:500;">${this.escapeHtml(c.name)}</td>
                <td>${this.genderLabel(c.gender)}</td>
                <td>${c.age}</td>
                <td>${this.escapeHtml(c.personality || '')}</td>
                <td><span class="tag tag-primary">${c.style}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-ghost btn-xs">编辑</button>
                        <button class="btn btn-danger btn-xs">删除</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    genderLabel(gender) {
        const map = { male: '男', female: '女', other: '其他' };
        return map[gender] || gender;
    },

    addCharacter() {
        const name = prompt('请输入角色名称：');
        if (!name) return;

        const newChar = {
            id: 'char-' + Date.now(),
            name,
            gender: 'female',
            age: 17,
            role: '原创角色',
            personality: '待设定',
            style: '日系',
            icon: '🧑',
            desc: '新创建的角色'
        };

        this.characters.unshift(newChar);
        this.save();
        this.render();
        Logger.success('添加角色', `已添加角色「${name}」`);
    },

    showCharacterDetail(id) {
        const char = this.characters.find(c => c.id === id);
        if (char) {
            Logger.info('查看角色', `查看角色「${char.name}」详情`);
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
};

/* ================================================
   10. SceneManager - 场景库
   ================================================ */
const SceneManager = {
    scenes: [],
    currentView: 'grid',
    filterCategory: 'all',
    filterTime: 'all',
    searchQuery: '',

    init() {
        this.load();
        this.bindEvents();
    },

    load() {
        const saved = localStorage.getItem('comicai_scenes');
        if (saved) {
            try {
                this.scenes = JSON.parse(saved);
            } catch (e) {
                this.scenes = [];
            }
        }
        if (this.scenes.length === 0) {
            this.initPresetScenes();
        }
    },

    initPresetScenes() {
        this.scenes = [
            { id: 'scene-1', name: '教室', category: '室内', time: 'day', icon: '🏫', desc: '明亮的高中教室，阳光从窗户洒入' },
            { id: 'scene-2', name: '街道', category: '城市', time: 'day', icon: '🚶', desc: '繁华的城市街道，人来人往' },
            { id: 'scene-3', name: '雨夜', category: '城市', time: 'night', icon: '🌧️', desc: '下雨的夜晚街道，霓虹灯闪烁' },
            { id: 'scene-4', name: '樱花树下', category: '自然', time: 'day', icon: '🌸', desc: '樱花盛开的树下，花瓣飘落' },
            { id: 'scene-5', name: '天台', category: '室外', time: 'sunset', icon: '🌅', desc: '学校天台，夕阳西下的美景' },
            { id: 'scene-6', name: '咖啡馆', category: '室内', time: 'day', icon: '☕', desc: '温馨的咖啡馆，轻音乐环绕' },
            { id: 'scene-7', name: '学校走廊', category: '室内', time: 'day', icon: '🚪', desc: '长长的学校走廊，脚步声回响' },
            { id: 'scene-8', name: '图书馆', category: '室内', time: 'day', icon: '📚', desc: '安静的图书馆，书香弥漫' },
            { id: 'scene-9', name: '公园', category: '自然', time: 'day', icon: '🌳', desc: '绿意盎然的城市公园' },
            { id: 'scene-10', name: '地铁站', category: '城市', time: 'night', icon: '🚇', desc: '深夜的地铁站，空旷寂静' },
            { id: 'scene-11', name: '海边', category: '自然', time: 'sunset', icon: '🌊', desc: '夕阳下的海边，波光粼粼' },
            { id: 'scene-12', name: '神社', category: '奇幻', time: 'day', icon: '⛩️', desc: '古老的神社，充满神秘气息' },
            { id: 'scene-13', name: '医院走廊', category: '室内', time: 'night', icon: '🏥', desc: '深夜的医院走廊，灯光昏暗' },
            { id: 'scene-14', name: '摩天大楼', category: '城市', time: 'night', icon: '🏙️', desc: '夜晚的摩天大楼，灯火通明' },
            { id: 'scene-15', name: '森林小径', category: '自然', time: 'day', icon: '🌲', desc: '阳光透过树叶的森林小路' },
            { id: 'scene-16', name: '赛博城市', category: '科幻', time: 'night', icon: '🌆', desc: '未来感十足的赛博朋克城市' },
            { id: 'scene-17', name: '星空下的草原', category: '自然', time: 'night', icon: '🌌', desc: '繁星满天的草原，银河清晰可见' },
            { id: 'scene-18', name: '古战场', category: '奇幻', time: 'day', icon: '⚔️', desc: '古老的战场遗迹，剑影刀光' }
        ];
        this.save();
    },

    save() {
        localStorage.setItem('comicai_scenes', JSON.stringify(this.scenes));
    },

    getScenes() {
        return this.scenes;
    },

    bindEvents() {
        document.querySelectorAll('.view-toggle-btn[data-scene-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.sceneView;
                this.switchView(view);
            });
        });

        const categoryFilter = document.getElementById('sceneCategoryFilter');
        const timeFilter = document.getElementById('sceneTimeFilter');
        const searchInput = document.getElementById('sceneSearch');

        if (categoryFilter) categoryFilter.addEventListener('change', () => { this.filterCategory = categoryFilter.value; this.render(); });
        if (timeFilter) timeFilter.addEventListener('change', () => { this.filterTime = timeFilter.value; this.render(); });
        if (searchInput) searchInput.addEventListener('input', () => { this.searchQuery = searchInput.value; this.render(); });

        const addBtn = document.getElementById('addSceneLibBtn');
        if (addBtn) addBtn.addEventListener('click', () => this.addScene());
    },

    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('.view-toggle-btn[data-scene-view]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sceneView === view);
        });
        const grid = document.getElementById('sceneGrid');
        if (grid) {
            grid.style.gridTemplateColumns = view === 'masonry'
                ? 'repeat(auto-fill, minmax(200px, 1fr))'
                : 'repeat(auto-fill, minmax(240px, 1fr))';
        }
    },

    getFilteredScenes() {
        let scenes = [...this.scenes];

        if (this.filterCategory !== 'all') {
            scenes = scenes.filter(s => s.category === this.filterCategory);
        }

        if (this.filterTime !== 'all') {
            scenes = scenes.filter(s => s.time === this.filterTime);
        }

        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            scenes = scenes.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.desc?.toLowerCase().includes(q) ||
                s.category?.toLowerCase().includes(q)
            );
        }

        return scenes;
    },

    render() {
        const scenes = this.getFilteredScenes();
        const count = document.getElementById('sceneCount');
        if (count) count.textContent = scenes.length;

        const grid = document.getElementById('sceneGrid');
        if (!grid) return;

        grid.innerHTML = scenes.map(s => `
            <div class="scene-card" data-scene-id="${s.id}">
                <div class="scene-thumb">
                    <span class="scene-category">${s.category}</span>
                    ${s.icon}
                </div>
                <div class="scene-info">
                    <div class="scene-name">${this.escapeHtml(s.name)}</div>
                    <div class="scene-desc">${this.escapeHtml(s.desc || '')}</div>
                    <div class="scene-meta">
                        <span>${this.timeLabel(s.time)}</span>
                        <span>使用 ${Math.floor(Math.random() * 50) + 5} 次</span>
                    </div>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.scene-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showSceneDetail(card.dataset.sceneId);
            });
        });
    },

    timeLabel(time) {
        const map = { day: '白天', sunset: '黄昏', night: '夜晚' };
        return map[time] || time;
    },

    addScene() {
        const name = prompt('请输入场景名称：');
        if (!name) return;

        const newScene = {
            id: 'scene-' + Date.now(),
            name,
            category: '室内',
            time: 'day',
            icon: '🏞️',
            desc: '新创建的场景'
        };

        this.scenes.unshift(newScene);
        this.save();
        this.render();
        Logger.success('添加场景', `已添加场景「${name}」`);
    },

    showSceneDetail(id) {
        const scene = this.scenes.find(s => s.id === id);
        if (scene) {
            Logger.info('查看场景', `查看场景「${scene.name}」详情`);
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
};

/* ================================================
   11. WorkflowEditor - 工作流编辑器
   ================================================ */
const WorkflowEditor = {
    nodes: [],
    connections: [],
    selectedNode: null,
    nextNodeId: 1,
    connectingFrom: null,
    isConnecting: false,
    workflowTemplates: [],

    nodeTypes: [
        { group: '输入节点', items: [
            { type: 'input-script', name: '剧本输入', icon: '📝', desc: '输入剧本内容作为工作流起点' },
            { type: 'input-character', name: '角色导入', icon: '👤', desc: '从角色库导入角色设定' },
            { type: 'input-scene', name: '场景导入', icon: '🏞️', desc: '从场景库导入背景素材' }
        ]},
        { group: 'AI生成', items: [
            { type: 'ai-script-analysis', name: 'AI剧本分析', icon: '🧠', desc: '智能分析剧本结构和内容' },
            { type: 'ai-storyboard', name: 'AI分镜生成', icon: '✨', desc: '自动生成分镜画面' },
            { type: 'ai-character', name: 'AI角色生成', icon: '🎨', desc: '根据描述生成角色形象' },
            { type: 'ai-style-transfer', name: 'AI风格迁移', icon: '🖌️', desc: '将分镜转换为不同风格' }
        ]},
        { group: '处理节点', items: [
            { type: 'character-node', name: '角色处理', icon: '👤', desc: '角色一致性校验与调整' },
            { type: 'scene-node', name: '场景处理', icon: '🏞️', desc: '场景风格统一与优化' },
            { type: 'effect-node', name: '特效处理', icon: '💥', desc: '添加特效与后期处理' },
            { type: 'timeline-node', name: '时间线编辑', icon: '⏱️', desc: '分镜顺序调整与编排' }
        ]},
        { group: '输出节点', items: [
            { type: 'output-export', name: '导出输出', icon: '📤', desc: '导出最终分镜成果' },
            { type: 'output-save', name: '保存项目', icon: '💾', desc: '保存为项目文件' },
            { type: 'output-preview', name: '预览输出', icon: '👁️', desc: '预览生成分镜效果' }
        ]}
    ],

    init() {
        this.initWorkflowTemplates();
        this.renderPalette();
        this.bindCanvasEvents();
        this.renderTemplateList();
    },

    initWorkflowTemplates() {
        this.workflowTemplates = [
            {
                id: 'wf-tpl-1',
                name: '标准分镜生成',
                icon: '📋',
                desc: '从剧本输入到分镜生成的完整流程',
                nodes: [
                    { id: 'n1', type: 'input-script', name: '剧本输入', icon: '📝', desc: '输入剧本内容', x: 100, y: 100 },
                    { id: 'n2', type: 'ai-script-analysis', name: 'AI剧本分析', icon: '🧠', desc: '智能分析剧本', x: 300, y: 100 },
                    { id: 'n3', type: 'ai-storyboard', name: 'AI分镜生成', icon: '✨', desc: '自动生成分镜', x: 500, y: 100 },
                    { id: 'n4', type: 'output-export', name: '导出输出', icon: '📤', desc: '导出成果', x: 700, y: 100 }
                ],
                connections: [
                    { from: 'n1', to: 'n2' },
                    { from: 'n2', to: 'n3' },
                    { from: 'n3', to: 'n4' }
                ]
            },
            {
                id: 'wf-tpl-2',
                name: '角色驱动创作',
                icon: '👤',
                desc: '先创建角色再生成场景的工作流',
                nodes: [
                    { id: 'n1', type: 'input-character', name: '角色导入', icon: '👤', desc: '导入角色设定', x: 100, y: 80 },
                    { id: 'n2', type: 'input-scene', name: '场景导入', icon: '🏞️', desc: '导入场景素材', x: 100, y: 200 },
                    { id: 'n3', type: 'ai-character', name: 'AI角色生成', icon: '🎨', desc: '生成角色形象', x: 300, y: 80 },
                    { id: 'n4', type: 'character-node', name: '角色处理', icon: '👤', desc: '角色一致性处理', x: 500, y: 80 },
                    { id: 'n5', type: 'ai-storyboard', name: 'AI分镜生成', icon: '✨', desc: '生成分镜', x: 500, y: 200 },
                    { id: 'n6', type: 'output-save', name: '保存项目', icon: '💾', desc: '保存项目', x: 700, y: 140 }
                ],
                connections: [
                    { from: 'n1', to: 'n3' },
                    { from: 'n3', to: 'n4' },
                    { from: 'n2', to: 'n5' },
                    { from: 'n4', to: 'n5' },
                    { from: 'n5', to: 'n6' }
                ]
            },
            {
                id: 'wf-tpl-3',
                name: '风格迁移流程',
                icon: '🖌️',
                desc: '将已有分镜转换为不同风格',
                nodes: [
                    { id: 'n1', type: 'input-script', name: '剧本输入', icon: '📝', desc: '输入剧本', x: 100, y: 100 },
                    { id: 'n2', type: 'ai-storyboard', name: 'AI分镜生成', icon: '✨', desc: '生成初始分镜', x: 300, y: 100 },
                    { id: 'n3', type: 'ai-style-transfer', name: 'AI风格迁移', icon: '🖌️', desc: '转换风格', x: 500, y: 100 },
                    { id: 'n4', type: 'effect-node', name: '特效处理', icon: '💥', desc: '添加特效', x: 700, y: 100 },
                    { id: 'n5', type: 'output-preview', name: '预览输出', icon: '👁️', desc: '预览效果', x: 700, y: 200 },
                    { id: 'n6', type: 'output-export', name: '导出输出', icon: '📤', desc: '导出成果', x: 900, y: 100 }
                ],
                connections: [
                    { from: 'n1', to: 'n2' },
                    { from: 'n2', to: 'n3' },
                    { from: 'n3', to: 'n4' },
                    { from: 'n4', to: 'n5' },
                    { from: 'n4', to: 'n6' }
                ]
            },
            {
                id: 'wf-tpl-4',
                name: '全流程创作',
                icon: '🎬',
                desc: '包含剧本分析、角色生成、场景处理的完整流程',
                nodes: [
                    { id: 'n1', type: 'input-script', name: '剧本输入', icon: '📝', desc: '输入剧本', x: 80, y: 60 },
                    { id: 'n2', type: 'input-character', name: '角色导入', icon: '👤', desc: '导入角色', x: 80, y: 180 },
                    { id: 'n3', type: 'input-scene', name: '场景导入', icon: '🏞️', desc: '导入场景', x: 80, y: 300 },
                    { id: 'n4', type: 'ai-script-analysis', name: 'AI剧本分析', icon: '🧠', desc: '分析剧本', x: 280, y: 60 },
                    { id: 'n5', type: 'ai-character', name: 'AI角色生成', icon: '🎨', desc: '生成角色', x: 280, y: 180 },
                    { id: 'n6', type: 'ai-storyboard', name: 'AI分镜生成', icon: '✨', desc: '生成分镜', x: 480, y: 140 },
                    { id: 'n7', type: 'character-node', name: '角色处理', icon: '👤', desc: '角色一致性', x: 480, y: 260 },
                    { id: 'n8', type: 'timeline-node', name: '时间线编辑', icon: '⏱️', desc: '编辑分镜顺序', x: 680, y: 140 },
                    { id: 'n9', type: 'effect-node', name: '特效处理', icon: '💥', desc: '添加特效', x: 680, y: 260 },
                    { id: 'n10', type: 'output-export', name: '导出输出', icon: '📤', desc: '导出成果', x: 880, y: 200 }
                ],
                connections: [
                    { from: 'n1', to: 'n4' },
                    { from: 'n2', to: 'n5' },
                    { from: 'n4', to: 'n6' },
                    { from: 'n5', to: 'n7' },
                    { from: 'n3', to: 'n6' },
                    { from: 'n6', to: 'n8' },
                    { from: 'n7', to: 'n8' },
                    { from: 'n8', to: 'n9' },
                    { from: 'n9', to: 'n10' }
                ]
            }
        ];
    },

    renderTemplateList() {
        const list = document.getElementById('workflowTemplateList');
        if (!list) return;

        list.innerHTML = `
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">预设模板</div>
            ${this.workflowTemplates.map(tpl => `
                <button class="btn btn-ghost btn-sm btn-full" style="text-align:left;margin-bottom:4px;" onclick="WorkflowEditor.loadTemplate('${tpl.id}')">
                    <span style="margin-right:8px;">${tpl.icon}</span>
                    <span style="font-weight:500;">${tpl.name}</span>
                    <span style="font-size:11px;color:var(--text-muted);display:block;">${tpl.desc}</span>
                </button>
            `).join('')}
        `;
    },

    loadTemplate(templateId) {
        const template = this.workflowTemplates.find(t => t.id === templateId);
        if (!template) return;

        if (!confirm(`确定要加载「${template.name}」模板吗？当前工作流将被清空。`)) return;

        this.nodes = template.nodes.map(n => ({ ...n }));
        this.connections = template.connections.map(c => ({ ...c }));
        this.nextNodeId = this.nodes.length + 1;
        this.selectedNode = null;

        this.renderCanvas();
        this.renderProperties(null);
        this.updateNodeCount();
        Logger.success('工作流', `已加载模板「${template.name}」`);
    },

    renderPalette() {
        const palette = document.getElementById('workflowPalette');
        if (!palette) return;

        palette.innerHTML = this.nodeTypes.map(group => `
            <div class="palette-group">
                <div class="palette-group-title">${group.group}</div>
                ${group.items.map(item => `
                    <div class="palette-item" draggable="true" data-node-type="${item.type}" data-node-name="${item.name}" data-node-icon="${item.icon}" data-node-desc="${item.desc}">
                        <span class="palette-item-icon">${item.icon}</span>
                        <span>${item.name}</span>
                    </div>
                `).join('')}
            </div>
        `).join('');

        palette.querySelectorAll('.palette-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('nodeType', item.dataset.nodeType);
                e.dataTransfer.setData('nodeName', item.dataset.nodeName);
                e.dataTransfer.setData('nodeIcon', item.dataset.nodeIcon);
                e.dataTransfer.setData('nodeDesc', item.dataset.nodeDesc);
            });
        });

        this.updateNodeCount();
    },

    bindCanvasEvents() {
        const canvas = document.getElementById('workflowCanvas');
        if (!canvas) return;

        canvas.addEventListener('dragover', (e) => e.preventDefault());
        canvas.addEventListener('drop', (e) => this.handleDrop(e));
        canvas.addEventListener('click', (e) => {
            if (e.target === canvas || e.target.classList.contains('workflow-canvas-empty')) {
                this.selectNode(null);
                this.cancelConnection();
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            if (this.isConnecting) {
                this.cancelConnection();
            }
        });
    },

    handleDrop(e) {
        e.preventDefault();
        const type = e.dataTransfer.getData('nodeType');
        const name = e.dataTransfer.getData('nodeName');
        const icon = e.dataTransfer.getData('nodeIcon');
        const desc = e.dataTransfer.getData('nodeDesc');

        if (!type) return;

        const canvas = document.getElementById('workflowCanvas');
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left + canvas.scrollLeft - 80;
        const y = e.clientY - rect.top + canvas.scrollTop - 30;

        const node = {
            id: 'node-' + (this.nextNodeId++),
            type,
            name,
            icon,
            desc,
            x: Math.max(0, x),
            y: Math.max(0, y)
        };

        this.nodes.push(node);
        this.renderCanvas();
        this.updateNodeCount();
        Logger.info('工作流', `添加节点「${name}」`);
    },

    renderCanvas() {
        const canvas = document.getElementById('workflowCanvas');
        if (!canvas) return;

        const empty = canvas.querySelector('.workflow-canvas-empty');
        if (empty && this.nodes.length > 0) {
            empty.style.display = 'none';
        } else if (empty) {
            empty.style.display = '';
        }

        canvas.querySelectorAll('.workflow-node').forEach(n => n.remove());
        canvas.querySelectorAll('.connection-line').forEach(c => c.remove());

        this.renderConnections();

        this.nodes.forEach(node => {
            const el = document.createElement('div');
            el.className = 'workflow-node' + (this.selectedNode === node.id ? ' selected' : '');
            el.style.left = node.x + 'px';
            el.style.top = node.y + 'px';
            el.dataset.nodeId = node.id;
            el.innerHTML = `
                <div class="node-port input" title="点击连接输入"></div>
                <div class="workflow-node-header">
                    <span>${node.icon}</span>
                    <span>${node.name}</span>
                </div>
                <div class="workflow-node-body">${node.desc}</div>
                <div class="node-port output" title="点击拖拽连接"></div>
            `;

            el.addEventListener('mousedown', (e) => this.startDrag(e, node));
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectNode(node.id);
            });

            const outputPort = el.querySelector('.node-port.output');
            if (outputPort) {
                outputPort.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    this.startConnection(e, node.id);
                });
            }

            const inputPort = el.querySelector('.node-port.input');
            if (inputPort) {
                inputPort.addEventListener('mouseup', (e) => {
                    e.stopPropagation();
                    if (this.isConnecting && this.connectingFrom && this.connectingFrom !== node.id) {
                        this.createConnection(this.connectingFrom, node.id);
                    }
                });
            }

            canvas.appendChild(el);
        });
    },

    renderConnections() {
        const canvas = document.getElementById('workflowCanvas');
        if (!canvas) return;

        this.connections.forEach(conn => {
            const fromNode = this.nodes.find(n => n.id === conn.from);
            const toNode = this.nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return;

            const x1 = fromNode.x + 160;
            const y1 = fromNode.y + 40;
            const x2 = toNode.x;
            const y2 = toNode.y + 40;

            const midX = (x1 + x2) / 2;
            const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

            const line = document.createElement('div');
            line.className = 'connection-line';
            line.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 ${canvas.scrollWidth || 1000} ${canvas.scrollHeight || 600}" preserveAspectRatio="none"><path d="${path}" stroke="var(--primary-color)" stroke-width="2" fill="none"/></svg>`;
            line.style.position = 'absolute';
            line.style.top = '0';
            line.style.left = '0';
            line.style.width = '100%';
            line.style.height = '100%';
            line.style.pointerEvents = 'none';

            canvas.appendChild(line);
        });
    },

    startConnection(e, nodeId) {
        this.isConnecting = true;
        this.connectingFrom = nodeId;
    },

    createConnection(from, to) {
        if (from === to) {
            this.cancelConnection();
            return;
        }

        const exists = this.connections.some(c => c.from === from && c.to === to);
        if (exists) {
            this.cancelConnection();
            return;
        }

        this.connections.push({ from, to });
        this.cancelConnection();
        this.renderCanvas();
        Logger.info('工作流', `建立连接：${from} -> ${to}`);
    },

    cancelConnection() {
        this.isConnecting = false;
        this.connectingFrom = null;
    },

    startDrag(e, node) {
        const canvas = document.getElementById('workflowCanvas');
        if (!canvas) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const origX = node.x;
        const origY = node.y;

        const onMouseMove = (e2) => {
            node.x = origX + (e2.clientX - startX);
            node.y = origY + (e2.clientY - startY);
            node.x = Math.max(0, node.x);
            node.y = Math.max(0, node.y);
            const el = canvas.querySelector(`[data-node-id="${node.id}"]`);
            if (el) {
                el.style.left = node.x + 'px';
                el.style.top = node.y + 'px';
            }
            this.renderConnections();
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    },

    selectNode(nodeId) {
        this.selectedNode = nodeId;
        this.renderCanvas();
        this.renderProperties(nodeId);
    },

    renderProperties(nodeId) {
        const props = document.getElementById('workflowProperties');
        if (!props) return;

        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) {
            props.innerHTML = `
                <div class="workflow-properties-title">节点属性</div>
                <div class="workflow-properties-empty">选择一个节点<br>查看和编辑属性</div>
            `;
            return;
        }

        props.innerHTML = `
            <div class="workflow-properties-title">节点属性</div>
            <div style="padding:0 4px;">
                <div style="margin-bottom:12px;">
                    <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">节点名称</div>
                    <input type="text" class="text-input" value="${this.escapeHtml(node.name)}">
                </div>
                <div style="margin-bottom:12px;">
                    <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">节点类型</div>
                    <div class="tag tag-primary">${node.type}</div>
                </div>
                <div style="margin-bottom:12px;">
                    <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">节点描述</div>
                    <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">${this.escapeHtml(node.desc)}</div>
                </div>
                <div style="margin-bottom:12px;">
                    <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">位置</div>
                    <div style="font-size:12px;color:var(--text-secondary);">X: ${Math.round(node.x)}, Y: ${Math.round(node.y)}</div>
                </div>
                <div style="margin-bottom:12px;">
                    <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">连接数</div>
                    <div style="font-size:12px;color:var(--text-secondary);">
                        入度: ${this.connections.filter(c => c.to === nodeId).length} | 
                        出度: ${this.connections.filter(c => c.from === nodeId).length}
                    </div>
                </div>
                <button class="btn btn-danger btn-sm btn-full" id="deleteNodeBtn">删除节点</button>
            </div>
        `;

        const deleteBtn = document.getElementById('deleteNodeBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteNode(nodeId));
        }
    },

    deleteNode(nodeId) {
        const idx = this.nodes.findIndex(n => n.id === nodeId);
        if (idx === -1) return;

        const node = this.nodes[idx];
        this.nodes.splice(idx, 1);
        this.connections = this.connections.filter(c => c.from !== nodeId && c.to !== nodeId);
        if (this.selectedNode === nodeId) this.selectedNode = null;
        this.renderCanvas();
        this.renderProperties(null);
        this.updateNodeCount();
        Logger.info('工作流', `删除节点「${node.name}」`);
    },

    updateNodeCount() {
        const count = document.getElementById('wfNodeCount');
        if (count) count.textContent = this.nodes.length;
        const connCount = document.getElementById('wfConnCount');
        if (connCount) connCount.textContent = this.connections.length;
    },

    clearCanvas() {
        if (this.nodes.length === 0) return;
        if (!confirm('确定清空所有节点吗？')) return;
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.renderCanvas();
        this.renderProperties(null);
        this.updateNodeCount();
        Logger.info('工作流', '已清空画布');
    },

    saveWorkflow(name) {
        if (!name) return;
        const workflowData = {
            id: 'wf-' + Date.now(),
            name,
            nodes: [...this.nodes],
            connections: [...this.connections],
            createdAt: Date.now()
        };
        let workflows = [];
        const saved = localStorage.getItem('comicai_workflows');
        if (saved) {
            try { workflows = JSON.parse(saved); } catch (e) {}
        }
        workflows.unshift(workflowData);
        localStorage.setItem('comicai_workflows', JSON.stringify(workflows));
        Logger.success('工作流', `已保存工作流「${name}」`);
        alert('工作流保存成功！');
    },

    loadWorkflow(workflowData) {
        if (!workflowData) return;

        if (!confirm('确定要加载工作流吗？当前工作流将被清空。')) return;

        this.nodes = workflowData.nodes.map(n => ({ ...n }));
        this.connections = workflowData.connections.map(c => ({ ...c }));
        this.nextNodeId = this.nodes.length + 1;
        this.selectedNode = null;

        this.renderCanvas();
        this.renderProperties(null);
        this.updateNodeCount();
        Logger.success('工作流', `已加载工作流「${workflowData.name}」`);
    },

    getSavedWorkflows() {
        const saved = localStorage.getItem('comicai_workflows');
        return saved ? JSON.parse(saved) : [];
    },

    deleteWorkflow(workflowId) {
        let workflows = this.getSavedWorkflows();
        workflows = workflows.filter(w => w.id !== workflowId);
        localStorage.setItem('comicai_workflows', JSON.stringify(workflows));
        Logger.success('工作流', '已删除工作流');
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
};

/* ================================================
   12. AssetManager - 素材管理
   ================================================ */
const AssetManager = {
    assets: [],
    currentType: 'all',
    currentView: 'grid',
    searchQuery: '',

    init() {
        this.load();
        this.bindEvents();
    },

    load() {
        const saved = localStorage.getItem('comicai_assets');
        if (saved) {
            try {
                this.assets = JSON.parse(saved);
            } catch (e) {
                this.assets = [];
            }
        }
        if (this.assets.length === 0) {
            this.initPresetAssets();
        }
    },

    initPresetAssets() {
        this.assets = [
            { id: 'asset-1', name: '校园背景集', type: 'image', icon: '🖼️', size: '2.4 MB', date: Date.now() - 86400000 * 3 },
            { id: 'asset-2', name: '角色立绘-林小雨', type: 'image', icon: '👧', size: '856 KB', date: Date.now() - 86400000 * 2 },
            { id: 'asset-3', name: '角色立绘-陈默', type: 'image', icon: '👦', size: '789 KB', date: Date.now() - 86400000 * 2 },
            { id: 'asset-4', name: '雨声BGM', type: 'audio', icon: '🎵', size: '3.2 MB', date: Date.now() - 86400000 * 5 },
            { id: 'asset-5', name: '脚步声合集', type: 'audio', icon: '👟', size: '1.1 MB', date: Date.now() - 86400000 * 4 },
            { id: 'asset-6', name: '日系漫画字体', type: 'font', icon: '🔤', size: '5.6 MB', date: Date.now() - 86400000 * 7 },
            { id: 'asset-7', name: '标题艺术字体', type: 'font', icon: '✨', size: '2.8 MB', date: Date.now() - 86400000 * 6 },
            { id: 'asset-8', name: '项目源文件-校园恋爱', type: 'psd', icon: '🎨', size: '45.2 MB', date: Date.now() - 86400000 },
            { id: 'asset-9', name: '场景素材-教室', type: 'image', icon: '🏫', size: '1.8 MB', date: Date.now() - 86400000 * 10 },
            { id: 'asset-10', name: '场景素材-街道', type: 'image', icon: '🚶', size: '2.1 MB', date: Date.now() - 86400000 * 10 },
            { id: 'asset-11', name: '特效音效-爆炸', type: 'audio', icon: '💥', size: '560 KB', date: Date.now() - 86400000 * 8 },
            { id: 'asset-12', name: 'Q版人物素材包', type: 'image', icon: '🧸', size: '8.5 MB', date: Date.now() - 86400000 * 12 }
        ];
        this.save();
    },

    save() {
        localStorage.setItem('comicai_assets', JSON.stringify(this.assets));
    },

    bindEvents() {
        document.querySelectorAll('.asset-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const type = tab.dataset.assetType;
                this.currentType = type;
                document.querySelectorAll('.asset-tab').forEach(t => {
                    t.classList.toggle('active', t.dataset.assetType === type);
                });
                this.render();
            });
        });

        document.querySelectorAll('.view-toggle-btn[data-asset-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.assetView;
                this.currentView = view;
                document.querySelectorAll('.view-toggle-btn[data-asset-view]').forEach(b => {
                    b.classList.toggle('active', b.dataset.assetView === view);
                });
                this.render();
            });
        });

        const searchInput = document.getElementById('assetSearch');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.searchQuery = searchInput.value;
                this.render();
            });
        }

        const uploadBtn = document.getElementById('uploadAssetBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.uploadAsset());
        }
    },

    getFilteredAssets() {
        let assets = [...this.assets];
        if (this.currentType !== 'all') {
            assets = assets.filter(a => a.type === this.currentType);
        }
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            assets = assets.filter(a => a.name.toLowerCase().includes(q));
        }
        return assets;
    },

    render() {
        const grid = document.getElementById('assetsGrid');
        if (!grid) return;

        const assets = this.getFilteredAssets();

        if (assets.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-muted);">
                    <div style="font-size:48px;margin-bottom:12px;">📁</div>
                    <p>暂无素材</p>
                </div>
            `;
            return;
        }

        if (this.currentView === 'grid') {
            grid.style.display = 'grid';
            grid.innerHTML = assets.map(a => `
                <div class="asset-card" data-asset-id="${a.id}">
                    <div class="asset-thumb">
                        <span class="asset-badge">${this.typeLabel(a.type)}</span>
                        ${a.icon}
                    </div>
                    <div class="asset-info">
                        <div class="asset-name">${this.escapeHtml(a.name)}</div>
                        <div class="asset-size">${a.size}</div>
                    </div>
                </div>
            `).join('');
        } else {
            grid.style.display = 'block';
            grid.innerHTML = assets.map(a => `
                <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;margin-bottom:8px;cursor:pointer;">
                    <div style="font-size:32px;">${a.icon}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:500;margin-bottom:2px;">${this.escapeHtml(a.name)}</div>
                        <div style="font-size:12px;color:var(--text-muted);">${this.typeLabel(a.type)} · ${a.size}</div>
                    </div>
                    <div style="font-size:12px;color:var(--text-muted);">${this.formatDate(a.date)}</div>
                </div>
            `).join('');
        }
    },

    typeLabel(type) {
        const map = { image: '图片', audio: '音效', font: '字体', psd: '源文件' };
        return map[type] || type;
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    },

    uploadAsset() {
        const name = prompt('请输入素材名称：');
        if (!name) return;
        const types = ['image', 'audio', 'font', 'psd'];
        const type = prompt('请输入素材类型 (image/audio/font/psd)：', 'image');
        if (!types.includes(type)) {
            alert('无效的素材类型');
            return;
        }

        const icons = { image: '🖼️', audio: '🎵', font: '🔤', psd: '🎨' };
        const newAsset = {
            id: 'asset-' + Date.now(),
            name,
            type,
            icon: icons[type],
            size: '0 KB',
            date: Date.now()
        };

        this.assets.unshift(newAsset);
        this.save();
        this.render();
        Logger.success('上传素材', `已上传素材「${name}」`);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
};

/* ================================================
   13. SettingsManager - 设置管理
   ================================================ */
const SettingsManager = {
    init() {
        this.bindTabEvents();
        this.bindSettingEvents();
        this.renderSkills();
        this.loadSettings();
    },

    bindTabEvents() {
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.settingsTab;
                document.querySelectorAll('.settings-tab').forEach(t => {
                    t.classList.toggle('active', t.dataset.settingsTab === tabId);
                });
                document.querySelectorAll('.settings-panel').forEach(p => {
                    p.classList.toggle('active', p.dataset.settingsPanel === tabId);
                });
            });
        });
    },

    loadSettings() {
        const settings = AppState.getSettings();

        const compactMode = document.getElementById('compactMode');
        const animationsToggle = document.getElementById('animationsToggle');
        const historySidebarToggle = document.getElementById('historySidebarToggle');
        const defaultZoom = document.getElementById('defaultZoom');
        const notifyGenerate = document.getElementById('notifyGenerate');
        const notifyError = document.getElementById('notifyError');
        const soundToggle = document.getElementById('soundToggle');
        const defaultStyle = document.getElementById('defaultStyle');
        const defaultQuality = document.getElementById('defaultQuality');
        const maxConcurrentTasks = document.getElementById('maxConcurrentTasks');
        const charConsistency = document.getElementById('charConsistency');
        const autoSaveInterval = document.getElementById('autoSaveInterval');
        const exportFormat = document.getElementById('exportFormat');
        const historyRetention = document.getElementById('historyRetention');

        if (compactMode) compactMode.checked = settings.compactMode;
        if (animationsToggle) animationsToggle.checked = settings.animations;
        if (historySidebarToggle) {
            historySidebarToggle.checked = settings.historySidebar;
            this.toggleHistorySidebar(settings.historySidebar);
        }
        if (defaultZoom) defaultZoom.value = settings.defaultZoom;
        if (notifyGenerate) notifyGenerate.checked = settings.notifyGenerate;
        if (notifyError) notifyError.checked = settings.notifyError;
        if (soundToggle) soundToggle.checked = settings.soundToggle;
        if (defaultStyle) defaultStyle.value = settings.defaultStyle;
        if (defaultQuality) defaultQuality.value = settings.defaultQuality;
        if (maxConcurrentTasks) maxConcurrentTasks.value = settings.maxConcurrentTasks;
        if (charConsistency) charConsistency.checked = settings.charConsistency;
        if (autoSaveInterval) autoSaveInterval.value = settings.autoSaveInterval;
        if (exportFormat) exportFormat.value = settings.exportFormat;
        if (historyRetention) historyRetention.value = settings.historyRetention;
    },

    bindSettingEvents() {
        const compactMode = document.getElementById('compactMode');
        const animationsToggle = document.getElementById('animationsToggle');
        const historySidebarToggle = document.getElementById('historySidebarToggle');
        const defaultZoom = document.getElementById('defaultZoom');
        const notifyGenerate = document.getElementById('notifyGenerate');
        const notifyError = document.getElementById('notifyError');
        const soundToggle = document.getElementById('soundToggle');
        const defaultStyle = document.getElementById('defaultStyle');
        const defaultQuality = document.getElementById('defaultQuality');
        const maxConcurrentTasks = document.getElementById('maxConcurrentTasks');
        const charConsistency = document.getElementById('charConsistency');
        const autoSaveInterval = document.getElementById('autoSaveInterval');
        const exportFormat = document.getElementById('exportFormat');
        const historyRetention = document.getElementById('historyRetention');
        const resetDataBtn = document.getElementById('resetDataBtn');

        if (compactMode) compactMode.addEventListener('change', (e) => {
            AppState.setSetting('compactMode', e.target.checked);
            Logger.info('设置', `紧凑模式：${e.target.checked ? '开启' : '关闭'}`);
        });
        if (animationsToggle) animationsToggle.addEventListener('change', (e) => {
            AppState.setSetting('animations', e.target.checked);
        });
        if (historySidebarToggle) historySidebarToggle.addEventListener('change', (e) => {
            AppState.setSetting('historySidebar', e.target.checked);
            this.toggleHistorySidebar(e.target.checked);
        });
        if (defaultZoom) defaultZoom.addEventListener('change', (e) => {
            AppState.setSetting('defaultZoom', parseInt(e.target.value));
        });
        if (notifyGenerate) notifyGenerate.addEventListener('change', (e) => {
            AppState.setSetting('notifyGenerate', e.target.checked);
        });
        if (notifyError) notifyError.addEventListener('change', (e) => {
            AppState.setSetting('notifyError', e.target.checked);
        });
        if (soundToggle) soundToggle.addEventListener('change', (e) => {
            AppState.setSetting('soundToggle', e.target.checked);
        });
        if (defaultStyle) defaultStyle.addEventListener('change', (e) => {
            AppState.setSetting('defaultStyle', e.target.value);
        });
        if (defaultQuality) defaultQuality.addEventListener('change', (e) => {
            AppState.setSetting('defaultQuality', e.target.value);
        });
        if (maxConcurrentTasks) maxConcurrentTasks.addEventListener('change', (e) => {
            AppState.setSetting('maxConcurrentTasks', parseInt(e.target.value));
        });
        if (charConsistency) charConsistency.addEventListener('change', (e) => {
            AppState.setSetting('charConsistency', e.target.checked);
        });
        if (autoSaveInterval) autoSaveInterval.addEventListener('change', (e) => {
            AppState.setSetting('autoSaveInterval', parseInt(e.target.value));
        });
        if (exportFormat) exportFormat.addEventListener('change', (e) => {
            AppState.setSetting('exportFormat', e.target.value);
        });
        if (historyRetention) historyRetention.addEventListener('change', (e) => {
            AppState.setSetting('historyRetention', parseInt(e.target.value));
        });
        if (resetDataBtn) resetDataBtn.addEventListener('click', () => this.resetAllData());
    },

    toggleHistorySidebar(show) {
        const sidebar = document.getElementById('historySidebar');
        if (sidebar) {
            if (show) {
                sidebar.classList.remove('collapsed');
            } else {
                sidebar.classList.add('collapsed');
            }
        }
    },

    renderSkills() {
        const panel = document.querySelector('[data-settings-panel="skills"]');
        if (!panel) return;

        const skills = AppState.state.skills;
        const categories = {
            core: { name: '核心技能', icon: '⭐' },
            advanced: { name: '高级技能', icon: '💎' },
            basic: { name: '基础功能', icon: '🔧' },
            efficiency: { name: '效率工具', icon: '⚡' }
        };

        let html = '<div class="settings-grid-two-col">';

        for (const catKey in categories) {
            const cat = categories[catKey];
            const catSkills = Object.values(skills).filter(s => s.category === catKey);
            if (catSkills.length === 0) continue;

            html += `
                <div class="setting-section">
                    <h3 class="setting-section-title">${cat.icon} ${cat.name}</h3>
                    <p class="setting-section-desc">${catSkills.length} 个技能</p>
                    <div class="setting-list">
                        ${catSkills.map(skill => `
                            <div class="setting-item">
                                <div class="setting-item-info">
                                    <span class="setting-item-label">${skill.icon} ${skill.name}</span>
                                    <span class="setting-item-desc">${skill.desc}</span>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" data-skill-id="${skill.id}" ${skill.enabled ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        panel.innerHTML = html;

        panel.querySelectorAll('[data-skill-id]').forEach(input => {
            input.addEventListener('change', (e) => {
                const skillId = e.target.dataset.skillId;
                if (AppState.state.skills[skillId]) {
                    AppState.state.skills[skillId].enabled = e.target.checked;
                    AppState.save();
                    Logger.info('技能管理', `${AppState.state.skills[skillId].name}：${e.target.checked ? '启用' : '禁用'}`);
                }
            });
        });
    },

    resetAllData() {
        if (!confirm('确定要重置所有数据吗？此操作不可撤销！\n\n将清除：项目、角色、场景、素材、历史记录等所有本地数据。')) {
            return;
        }

        if (!confirm('再次确认：真的要删除所有数据吗？')) {
            return;
        }

        localStorage.clear();
        location.reload();
    }
};

/* ================================================
   14. HelpManager - 帮助中心
   ================================================ */
const HelpManager = {
    currentSection: 'getting-started',

    helpContent: {
        'getting-started': {
            title: '🚀 快速入门',
            html: `
                <h2>快速入门指南</h2>
                <p>欢迎使用AI漫剧分镜生成器！本指南将帮助您快速上手，开始创作您的第一部漫剧分镜作品。</p>
                
                <h3>第一步：创建项目</h3>
                <p>在工作台页面点击"新建项目"按钮，输入项目名称和描述，选择漫画风格，即可创建一个新的分镜项目。</p>
                
                <h3>第二步：输入剧本</h3>
                <p>切换到"分镜生成"页面，在文本模式下输入您的剧本内容。支持场景标题、角色对话、动作描述等格式。</p>
                
                <h3>第三步：生成分镜</h3>
                <p>设置好生成参数后，点击"开始生成分镜"按钮，AI将自动分析剧本并生成专业的分镜画面。</p>
                
                <h3>第四步：编辑调整</h3>
                <p>在"分镜时间线"页面中，您可以调整分镜顺序、编辑分镜详情、添加或删除分镜。</p>
                
                <div class="help-tip">
                    <p><strong>💡 小贴士：</strong>剧本描述越详细，生成的分镜效果越好。建议包含人物动作、表情、环境氛围等元素。</p>
                </div>
            `
        },
        'generator': {
            title: '✨ 分镜生成',
            html: `
                <h2>分镜生成功能详解</h2>
                
                <h3>文本模式 vs 场景模式</h3>
                <p><strong>文本模式：</strong>直接输入完整剧本，AI自动解析。适合已有完整剧本的情况。</p>
                <p><strong>场景模式：</strong>逐场添加场景，手动设置每个场景的参数。适合精细化控制。</p>
                
                <h3>生成参数说明</h3>
                <ul>
                    <li><strong>漫画风格：</strong>选择日系、国漫、美漫、韩漫等不同风格</li>
                    <li><strong>每页格数：</strong>设置每页的分镜格子数量（4/6/8格）</li>
                    <li><strong>画面比例：</strong>16:9横版、4:3标准、3:4竖屏</li>
                    <li><strong>生成质量：</strong>标准/高清/超清，影响生成速度和画质</li>
                </ul>
                
                <h3>剧本格式规范</h3>
                <ul>
                    <li>场景标题用【场景名】包裹</li>
                    <li>人物对话用 角色名：台词 的格式</li>
                    <li>动作描述用括号包裹</li>
                    <li>镜头说明用 [镜头类型] 标记</li>
                </ul>
            `
        },
        'characters': {
            title: '👤 角色管理',
            html: `
                <h2>角色库使用指南</h2>
                
                <h3>创建角色</h3>
                <p>在角色库页面点击"添加角色"按钮，填写角色信息即可创建新角色。</p>
                
                <h3>角色属性</h3>
                <ul>
                    <li><strong>姓名：</strong>角色的名称</li>
                    <li><strong>性别：</strong>男/女/其他</li>
                    <li><strong>年龄：</strong>角色年龄</li>
                    <li><strong>性格：</strong>角色的性格特点</li>
                    <li><strong>风格：</strong>日系/国漫/写实/Q版</li>
                </ul>
                
                <h3>角色一致性</h3>
                <p>启用"角色一致性"技能后，AI会在生成分镜时保持角色形象的高度一致性，确保同一角色在不同分镜中的外观统一。</p>
                
                <div class="help-tip">
                    <p><strong>💡 小贴士：</strong>为角色提供详细的外貌描述，可以显著提升角色一致性效果。</p>
                </div>
            `
        },
        'tips': {
            title: '💡 创作技巧',
            html: `
                <h2>漫剧分镜创作技巧</h2>
                
                <h3>镜头语言基础</h3>
                <ul>
                    <li><strong>全景：</strong>展示场景全貌，交代环境</li>
                    <li><strong>中景：</strong>展示人物上半身，适合对话场景</li>
                    <li><strong>近景：</strong>展示人物面部表情，传达情绪</li>
                    <li><strong>特写：</strong>突出细节，强调重要信息</li>
                    <li><strong>俯视/仰视：</strong>营造特殊氛围和视角</li>
                </ul>
                
                <h3>分镜节奏把控</h3>
                <ul>
                    <li>开场用全景建立场景</li>
                    <li>对话场景多用中景交替</li>
                    <li>情绪高潮时使用特写</li>
                    <li>动作场景多格快速切换</li>
                    <li>重要时刻给满一页单格</li>
                </ul>
                
                <h3>提升生成质量的技巧</h3>
                <ol>
                    <li>剧本描述尽量详细具体</li>
                    <li>明确指定镜头类型和角度</li>
                    <li>提供角色外貌特征描述</li>
                    <li>选择合适的漫画风格</li>
                    <li>生成后手动调整优化</li>
                </ol>
            `
        },
        'faq': {
            title: '❓ 常见问题',
            html: `
                <h2>常见问题解答</h2>
                
                <div class="faq-item open">
                    <div class="faq-question">
                        <span>Q: 如何提高分镜生成质量？</span>
                        <span>▼</span>
                    </div>
                    <div class="faq-answer">
                        A: 提高生成质量可以从以下几方面入手：<br>
                        1. 提供更详细的剧本描述<br>
                        2. 明确指定镜头类型和画面风格<br>
                        3. 选择"高清"或"超清"生成质量<br>
                        4. 使用详细设定的角色<br>
                        5. 生成后在时间线中手动调整优化
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <span>Q: 如何保持角色形象一致？</span>
                        <span>▼</span>
                    </div>
                    <div class="faq-answer">
                        A: 启用"角色一致性"技能，并在角色库中为角色添加详细的外貌描述。AI会根据角色设定在分镜中保持形象一致。
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <span>Q: 可以导出哪些格式？</span>
                        <span>▼</span>
                    </div>
                    <div class="faq-answer">
                        A: 支持JSON格式导出项目数据，也可以导出为CBZ漫画压缩包或PDF文档。
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <span>Q: 数据保存在哪里？</span>
                        <span>▼</span>
                    </div>
                    <div class="faq-answer">
                        A: 所有数据都保存在浏览器的localStorage中。建议定期导出备份，避免数据丢失。
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <span>Q: 如何使用工作流编辑器？</span>
                        <span>▼</span>
                    </div>
                    <div class="faq-answer">
                        A: 从左侧面板拖拽节点到画布上，连接各个节点形成完整的工作流。支持从输入到输出的全流程自定义编排。
                    </div>
                </div>
            `
        },
        'troubleshoot': {
            title: '🔧 故障排查',
            html: `
                <h2>故障排查指南</h2>
                
                <h3>页面加载异常</h3>
                <p><strong>问题：</strong>页面显示不正常或功能无法使用</p>
                <p><strong>解决方法：</strong></p>
                <ul>
                    <li>尝试刷新页面</li>
                    <li>清除浏览器缓存</li>
                    <li>确保使用现代浏览器（Chrome、Firefox、Edge等）</li>
                    <li>检查浏览器是否禁用了JavaScript</li>
                </ul>
                
                <h3>数据丢失</h3>
                <p><strong>问题：</strong>保存的项目或数据不见了</p>
                <p><strong>解决方法：</strong></p>
                <ul>
                    <li>数据存储在localStorage中，清除浏览器数据会导致丢失</li>
                    <li>建议定期导出重要项目进行备份</li>
                    <li>不要使用无痕模式进行创作</li>
                </ul>
                
                <h3>生成失败</h3>
                <p><strong>问题：</strong>点击生成没有反应或报错</p>
                <p><strong>解决方法：</strong></p>
                <ul>
                    <li>确保输入了剧本内容</li>
                    <li>检查网络连接（本版本为模拟生成，无需网络）</li>
                    <li>尝试刷新页面后重试</li>
                </ul>
                
                <div class="help-tip">
                    <p><strong>📞 联系支持：</strong>如果以上方法都无法解决问题，请记录具体现象并联系技术支持。</p>
                </div>
            `
        }
    },

    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.querySelectorAll('.help-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.helpSection;
                this.switchSection(section);
            });
        });
    },

    render() {
        this.switchSection(this.currentSection);
    },

    switchSection(sectionId) {
        this.currentSection = sectionId;

        document.querySelectorAll('.help-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.helpSection === sectionId);
        });

        const content = document.getElementById('helpContent');
        if (!content) return;

        const section = this.helpContent[sectionId];
        if (section) {
            content.innerHTML = `<div class="help-section active">${section.html}</div>`;
            this.bindFaqEvents(content);
        }
    },

    bindFaqEvents(container) {
        container.querySelectorAll('.faq-question').forEach(q => {
            q.addEventListener('click', () => {
                const item = q.closest('.faq-item');
                if (item) {
                    item.classList.toggle('open');
                }
            });
        });
    }
};

/* ================================================
   15. AIAssistant - AI助手
   ================================================ */
const AIAssistant = {
    isOpen: false,
    messages: [],
    aiHistory: [],
    hotKeywords: [],

    quickReplies: {
        generate: '当然可以！请告诉我你想要创作什么样的故事呢？比如是校园恋爱、热血战斗还是悬疑推理？你可以描述一下故事梗概，我来帮你生成分镜。',
        character: '好的！创建一个生动的角色需要考虑很多方面。你可以告诉我：\n1. 角色的姓名和年龄\n2. 性格特点\n3. 外貌特征\n4. 角色定位（男主/女主/配角等）\n\n或者你也可以直接说"帮我创建一个XX类型的角色"，我来给你推荐。',
        story: '构思剧情是创作的第一步！你可以从以下几个角度思考：\n\n🎯 核心主题：你想讲一个什么样的故事？\n👥 主要角色：主角是谁？有什么特点？\n🎬 故事背景：发生在什么时代什么地方？\n💥 冲突矛盾：主角面临什么挑战？\n\n先说说你的想法吧，我来帮你完善！',
        tutorial: '使用教程很简单，我来给你快速讲解：\n\n1️⃣ **创建项目** - 在工作台点击新建项目\n2️⃣ **输入剧本** - 在分镜生成页面输入剧本\n3️⃣ **设置参数** - 选择风格、格数、质量等\n4️⃣ **点击生成** - AI自动生成分镜\n5️⃣ **编辑优化** - 在时间线调整细节\n\n你现在在哪个步骤遇到问题了吗？',
        outline: '🎬 分镜大纲生成 - 请粘贴你的剧本内容，我来帮你自动生成专业的分镜大纲！',
        optimize: '✨ 剧本优化 - 请输入或粘贴你的剧本，我来分析并给出优化建议！',
        keywords: '🔑 关键词建议 - 告诉我你正在创作的内容，我来推荐热门关键词！',
        style: '🎨 风格建议 - 描述你的故事场景，我来推荐合适的漫画风格！'
    },

    styleRecommendations: {
        '校园': ['日系', '清新', '可爱', '青春'],
        '恋爱': ['日系', '唯美', '清新', '浪漫'],
        '热血': ['国漫', '热血', '写实', '动感'],
        '悬疑': ['暗黑', '写实', '冷峻', '电影感'],
        '科幻': ['赛博朋克', '未来感', '科幻', '冷峻'],
        '古风': ['国漫', '水墨', '古典', '唯美'],
        '仙侠': ['国漫', '玄幻', '唯美', '大气'],
        '搞笑': ['Q版', '日系', '搞笑', '夸张'],
        '职场': ['写实', '都市', '简约', '现代'],
        '恐怖': ['暗黑', '惊悚', '写实', '压抑']
    },

    init() {
        this.loadAIHistory();
        this.initHotKeywords();
        this.bindEvents();
        this.renderAIHistory();
    },

    initHotKeywords() {
        this.hotKeywords = [
            { word: '赛博朋克', category: '科幻', trend: 'hot' },
            { word: '元宇宙', category: '科幻', trend: 'hot' },
            { word: 'AI绘画', category: '技术', trend: 'hot' },
            { word: '二次元', category: '风格', trend: 'stable' },
            { word: '国潮', category: '风格', trend: 'up' },
            { word: '赛博修仙', category: '科幻', trend: 'up' },
            { word: '虚拟偶像', category: '科幻', trend: 'up' },
            { word: '校园', category: '场景', trend: 'hot' },
            { word: '恋爱', category: '题材', trend: 'hot' },
            { word: '仙侠', category: '题材', trend: 'hot' },
            { word: '悬疑', category: '题材', trend: 'stable' },
            { word: '搞笑', category: '题材', trend: 'up' },
            { word: '古风', category: '风格', trend: 'up' },
            { word: '末世', category: '题材', trend: 'up' },
            { word: '重生', category: '题材', trend: 'hot' },
            { word: '穿越', category: '题材', trend: 'hot' },
            { word: '手绘', category: '风格', trend: 'stable' },
            { word: '像素', category: '风格', trend: 'up' },
            { word: '蒸汽朋克', category: '科幻', trend: 'stable' },
            { word: '治愈', category: '风格', trend: 'up' }
        ];
    },

    loadAIHistory() {
        const saved = localStorage.getItem('comicai_ai_history');
        if (saved) {
            try {
                this.aiHistory = JSON.parse(saved);
            } catch (e) {
                this.aiHistory = [];
            }
        }
    },

    saveAIHistory() {
        if (this.aiHistory.length > 50) {
            this.aiHistory = this.aiHistory.slice(0, 50);
        }
        localStorage.setItem('comicai_ai_history', JSON.stringify(this.aiHistory));
    },

    addAIHistory(action, content, result) {
        this.aiHistory.unshift({
            id: Date.now(),
            action,
            content: content.slice(0, 50),
            result: result.slice(0, 100),
            timestamp: Date.now()
        });
        this.saveAIHistory();
        this.renderAIHistory();
    },

    bindEvents() {
        const fab = document.getElementById('aiFab');
        const fabTop = document.getElementById('aiFabBtn');
        const panel = document.getElementById('aiPanel');
        const closeBtn = document.getElementById('aiPanelClose');
        const minBtn = document.getElementById('aiPanelMinimize');
        const sendBtn = document.getElementById('aiSendBtn');
        const input = document.getElementById('aiInput');

        if (fab) fab.addEventListener('click', () => this.toggle());
        if (fabTop) fabTop.addEventListener('click', () => this.toggle());
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());
        if (minBtn) minBtn.addEventListener('click', () => this.close());
        if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        document.querySelectorAll('.ai-quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });

        const outlineBtn = document.getElementById('aiOutlineBtn');
        const optimizeBtn = document.getElementById('aiOptimizeBtn');
        const keywordsBtn = document.getElementById('aiKeywordsBtn');
        const styleBtn = document.getElementById('aiStyleBtn');

        if (outlineBtn) outlineBtn.addEventListener('click', () => this.handleQuickAction('outline'));
        if (optimizeBtn) optimizeBtn.addEventListener('click', () => this.handleQuickAction('optimize'));
        if (keywordsBtn) keywordsBtn.addEventListener('click', () => this.handleQuickAction('keywords'));
        if (styleBtn) styleBtn.addEventListener('click', () => this.handleQuickAction('style'));
    },

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    },

    open() {
        this.isOpen = true;
        const panel = document.getElementById('aiPanel');
        const badge = document.getElementById('aiFabBadge');
        if (panel) panel.classList.add('open');
        if (badge) badge.style.display = 'none';
    },

    close() {
        this.isOpen = false;
        const panel = document.getElementById('aiPanel');
        if (panel) panel.classList.remove('open');
    },

    handleQuickAction(action) {
        const reply = this.quickReplies[action];
        if (reply) {
            const labels = { 
                generate: '生成分镜', 
                character: '创建角色', 
                story: '构思剧情', 
                tutorial: '使用教程',
                outline: '分镜大纲生成',
                optimize: '剧本优化',
                keywords: '关键词建议',
                style: '风格建议'
            };
            this.addUserMessage(labels[action] || action);
            setTimeout(() => this.addBotMessage(reply), 500);
        }
    },

    sendMessage() {
        const input = document.getElementById('aiInput');
        const text = input?.value?.trim();
        if (!text) return;

        this.addUserMessage(text);
        if (input) input.value = '';

        setTimeout(() => {
            const reply = this.generateReply(text);
            this.addBotMessage(reply);
            this.addAIHistory('chat', text, reply);
        }, 800 + Math.random() * 1000);
    },

    addUserMessage(text) {
        this.messages.push({ role: 'user', text, time: new Date() });
        this.renderMessages();
    },

    addBotMessage(text) {
        this.messages.push({ role: 'bot', text, time: new Date() });
        this.renderMessages();
    },

    generateReply(userText) {
        const text = userText.toLowerCase();
        
        if (text.includes('你好') || text.includes('hi') || text.includes('hello')) {
            return '你好呀！我是你的创作助手🎭。有什么我可以帮你的吗？\n\n✨ **我的功能：**\n- 📝 分镜大纲生成\n- ✨ 剧本优化建议\n- 🔑 热门关键词推荐\n- 🎨 漫画风格建议\n- 👤 角色创建\n- 🎬 剧情构思';
        }

        if (text.includes('大纲') || text.includes('分镜大纲') || (text.includes('分镜') && text.includes('生成'))) {
            return this.generateStoryboardOutline(userText);
        }

        if (text.includes('优化') || text.includes('改进') || text.includes('修改')) {
            return this.optimizeScript(userText);
        }

        if (text.includes('关键词') || text.includes('标签') || text.includes('tag')) {
            return this.suggestKeywords(userText);
        }

        if (text.includes('风格') || text.includes('画风') || text.includes('样式')) {
            return this.suggestStyle(userText);
        }

        if (text.includes('角色') || text.includes('人物')) {
            return '关于角色创作，我有很多建议！一个好角色需要：\n\n🎨 **外貌特征** - 发型、五官、身材、穿搭\n💭 **性格特点** - 内向/外向、优缺点、口头禅\n🎯 **背景故事** - 过去经历、动机目标\n👥 **人物关系** - 与其他角色的关系\n\n你想创建什么样的角色呢？';
        }

        if (text.includes('场景') || text.includes('背景')) {
            return '场景是故事的重要舞台！好的场景能让读者更有代入感。\n\n你可以从这些角度设计场景：\n🏞️ **环境类型** - 室内/室外/自然/城市\n⏰ **时间光线** - 白天/黄昏/夜晚，影响氛围\n🎭 **情绪氛围** - 温馨/紧张/神秘/浪漫\n📐 **空间布局** - 场景中有什么物件摆设\n\n需要我帮你构思具体场景吗？';
        }

        if (text.includes('谢谢') || text.includes('感谢')) {
            return '不客气！能帮到你我很开心~ 😊\n\n创作过程中有任何问题随时来找我哦！祝你创作出超棒的作品！🎬✨';
        }
        
        return this.analyzeScript(userText);
    },

    generateStoryboardOutline(script) {
        const outline = [
            { shot: 1, type: '全景', desc: '开场全景，交代故事发生的地点和环境氛围' },
            { shot: 2, type: '中景', desc: '主角登场，展示人物动作和表情' },
            { shot: 3, type: '近景', desc: '角色对话场景，展现人物关系' },
            { shot: 4, type: '特写', desc: '关键细节特写，突出重要信息' },
            { shot: 5, type: '中景', desc: '剧情发展，冲突升级' },
            { shot: 6, type: '全景', desc: '场景转换，新的地点或时间' },
            { shot: 7, type: '近景', desc: '情感高潮，人物情绪爆发' },
            { shot: 8, type: '特写', desc: '结局特写，留下悬念或点明主题' }
        ];

        let result = '🎬 **分镜大纲生成完成！**\n\n根据你的剧本内容，我为你设计了以下分镜大纲：\n\n';
        result += outline.map(o => 
            `**${o.shot}. ${o.type}**\n${o.desc}\n`
        ).join('\n');
        
        result += '\n💡 **建议：**\n- 可以根据实际剧情调整分镜数量\n- 动作场景建议使用更多分镜展现速度感\n- 对话场景可以使用中景和近景交替';

        this.addAIHistory('outline', script, result);
        return result;
    },

    optimizeScript(script) {
        const issues = [
            { type: 'positive', text: '剧本结构清晰，故事主线明确' },
            { type: 'suggestion', text: '建议增加更多细节描写，让画面感更强' },
            { type: 'suggestion', text: '可以适当添加环境音效描述，增强沉浸感' },
            { type: 'suggestion', text: '对话内容可以更加个性化，体现角色性格' },
            { type: 'tip', text: '在关键情节处添加镜头语言提示，方便AI生成分镜' }
        ];

        let result = '✨ **剧本优化分析完成！**\n\n';
        result += '📊 **分析结果：**\n\n';
        
        result += issues.map(issue => {
            const prefix = issue.type === 'positive' ? '✅' : issue.type === 'suggestion' ? '💡' : '📌';
            return `${prefix} ${issue.text}`;
        }).join('\n');

        result += '\n🎯 **优化建议：**\n\n';
        result += '1. **增加画面感** - 在描述中加入具体的视觉元素\n';
        result += '2. **丰富对话** - 让每个角色的台词都有独特风格\n';
        result += '3. **设定节奏** - 明确标注哪些场景需要快速切换\n';
        result += '4. **加入情感** - 通过细节描写传达人物情绪';

        this.addAIHistory('optimize', script, result);
        return result;
    },

    suggestKeywords(content) {
        const categories = ['校园', '恋爱', '热血', '悬疑', '科幻', '古风', '仙侠', '搞笑', '职场'];
        let matchedCategory = '校园';
        
        for (const cat of categories) {
            if (content.includes(cat)) {
                matchedCategory = cat;
                break;
            }
        }

        const categoryKeywords = {
            '校园': ['青春', '校服', '教室', '操场', '运动会', '毕业', '社团', '暗恋'],
            '恋爱': ['告白', '约会', '甜蜜', '心动', '浪漫', '温馨', '暧昧', '相遇'],
            '热血': ['战斗', '绝招', '觉醒', '成长', '友情', '信念', '挑战', '胜利'],
            '悬疑': ['神秘', '推理', '案件', '真相', '线索', '危险', '反转', '解密'],
            '科幻': ['未来', '科技', 'AI', '宇宙', '机甲', '虚拟', '赛博', '时空'],
            '古风': ['江湖', '武侠', '宫廷', '诗词', '美人', '剑客', '江山', '古韵'],
            '仙侠': ['修仙', '渡劫', '御剑', '法宝', '宗门', '飞升', '灵脉', '神兽'],
            '搞笑': ['幽默', '误会', '夸张', '日常', '糗事', '反差', '呆萌', '吐槽'],
            '职场': ['职场', '奋斗', '梦想', '拼搏', '团队', '合作', '挑战', '成长']
        };

        const keywords = categoryKeywords[matchedCategory] || categoryKeywords['校园'];
        const trending = this.hotKeywords.filter(k => k.category === '题材' || k.trend === 'hot').slice(0, 5);

        let result = `🔑 **关键词推荐**\n\n根据你的内容「${matchedCategory}」题材，推荐以下关键词：\n\n`;
        result += keywords.map(k => `#${k}`).join(' ');
        result += '\n\n🔥 **热门关键词：**\n';
        result += trending.map(k => `${k.word} ${k.trend === 'hot' ? '🔥' : ''}`).join(' ');
        
        result += '\n\n💡 **使用建议：**\n- 将关键词添加到分镜描述中\n- 在搜索模板时使用关键词筛选\n- 关键词可以帮助AI更好理解你的需求';

        this.addAIHistory('keywords', content, result);
        return result;
    },

    suggestStyle(content) {
        const categories = ['校园', '恋爱', '热血', '悬疑', '科幻', '古风', '仙侠', '搞笑', '职场', '恐怖'];
        let matchedCategory = '校园';
        
        for (const cat of categories) {
            if (content.includes(cat)) {
                matchedCategory = cat;
                break;
            }
        }

        const styles = this.styleRecommendations[matchedCategory] || ['日系', '清新'];
        
        const styleDetails = {
            '日系': { desc: '典型日本漫画风格，线条流畅，表情丰富', colors: '柔和色调，粉色、蓝色为主' },
            '国漫': { desc: '中国漫画风格，注重意境和细节', colors: '水墨色调，红色、金色点缀' },
            '赛博朋克': { desc: '未来科幻风格，霓虹灯效果，高科技感', colors: '霓虹色，紫色、青色、粉色' },
            '唯美': { desc: '注重美感和氛围，画面精致', colors: '淡雅色调，大量留白' },
            '暗黑': { desc: '暗色调，神秘压抑的氛围', colors: '深色调，黑色、深灰、暗红' },
            'Q版': { desc: '可爱卡通风格，人物比例夸张', colors: '明亮鲜艳的色彩' },
            '写实': { desc: '接近真实的画风，细节丰富', colors: '自然真实的色彩' },
            '清新': { desc: '明亮清爽的风格，适合青春题材', colors: '浅色为主，绿色、蓝色' }
        };

        let result = `🎨 **风格建议**\n\n根据你的「${matchedCategory}」题材，推荐以下漫画风格：\n\n`;
        
        styles.forEach(style => {
            const detail = styleDetails[style] || { desc: '适合该题材的风格', colors: '根据场景调整' };
            result += `**${style}**\n描述：${detail.desc}\n配色：${detail.colors}\n\n`;
        });

        result += '💡 **选择建议：**\n';
        result += '- 青春校园故事推荐「日系」或「清新」风格\n';
        result += '- 古风仙侠故事推荐「国漫」或「唯美」风格\n';
        result += '- 科幻未来故事推荐「赛博朋克」风格\n';
        result += '- 悬疑恐怖故事推荐「暗黑」或「写实」风格\n';
        result += '- 搞笑日常故事推荐「Q版」或「日系」风格';

        this.addAIHistory('style', content, result);
        return result;
    },

    analyzeScript(script) {
        const length = script.length;
        const hasDialogue = script.includes('：') || script.includes(':');
        const hasScene = script.includes('【') || script.includes('[');
        const hasAction = script.includes('(') || script.includes('（');

        let result = '📝 **剧本分析完成！**\n\n';
        result += `📊 **基本信息：**\n`;
        result += `- 文本长度：${length} 字\n`;
        result += `- 包含对话：${hasDialogue ? '是' : '否'}\n`;
        result += `- 包含场景标记：${hasScene ? '是' : '否'}\n`;
        result += `- 包含动作描述：${hasAction ? '是' : '否'}\n\n`;

        result += '🎯 **AI分析结果：**\n\n';
        result += '你的剧本看起来很有潜力！根据分析：\n\n';
        
        if (length < 100) {
            result += '💡 建议增加更多细节描写，让故事更加丰满\n';
        } else if (length > 1000) {
            result += '💡 内容很丰富，可以考虑分成多个章节\n';
        }

        if (!hasScene) {
            result += '💡 建议使用【场景名】格式标记场景切换\n';
        }
        if (!hasDialogue) {
            result += '💡 可以增加角色对话，让人物更加鲜活\n';
        }
        if (!hasAction) {
            result += '💡 添加动作描述可以让画面感更强\n';
        }

        result += '\n✨ **下一步建议：**\n';
        result += '1. 点击「分镜大纲」生成专业分镜\n';
        result += '2. 点击「剧本优化」获取改进建议\n';
        result += '3. 点击「关键词建议」获取热门标签\n';
        result += '4. 点击「风格建议」选择合适画风';

        this.addAIHistory('analyze', script, result);
        return result;
    },

    renderMessages() {
        const container = document.getElementById('aiMessages');
        if (!container) return;

        container.innerHTML = this.messages.map(msg => {
            if (msg.role === 'bot') {
                return `
                    <div class="ai-message ai-message-bot">
                        <div class="ai-avatar">🎭</div>
                        <div class="ai-bubble">
                            <div class="ai-bubble-text">${this.formatMessage(msg.text)}</div>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="ai-message ai-message-user">
                        <div class="ai-avatar">😊</div>
                        <div class="ai-bubble">
                            <div class="ai-bubble-text">${this.escapeHtml(msg.text)}</div>
                        </div>
                    </div>
                `;
            }
        }).join('');

        container.scrollTop = container.scrollHeight;
    },

    renderAIHistory() {
        const container = document.getElementById('aiHistoryList');
        if (!container) return;

        if (this.aiHistory.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:12px;padding:16px;">暂无AI生成记录</div>';
            return;
        }

        container.innerHTML = `
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">AI生成记录</div>
            ${this.aiHistory.slice(0, 5).map(item => `
                <div style="padding:8px;margin-bottom:4px;background:var(--bg-secondary);border-radius:6px;font-size:12px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span class="tag tag-xs">${this.getActionLabel(item.action)}</span>
                        <span style="color:var(--text-muted);">${this.formatTime(item.timestamp)}</span>
                    </div>
                    <div style="color:var(--text-secondary);">${this.escapeHtml(item.content)}...</div>
                </div>
            `).join('')}
        `;
    },

    getActionLabel(action) {
        const labels = {
            outline: '分镜大纲',
            optimize: '剧本优化',
            keywords: '关键词',
            style: '风格建议',
            analyze: '剧本分析',
            chat: '对话'
        };
        return labels[action] || action;
    },

    formatTime(timestamp) {
        const d = new Date(timestamp);
        return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    },

    formatMessage(text) {
        return this.escapeHtml(text)
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/#(\w+)/g, '<span style="background:var(--primary-color);color:white;padding:2px 6px;border-radius:4px;font-size:11px;">#$1</span>');
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
};

/* ================================================
   16. HistoryManager - 历史记录
   ================================================ */
const HistoryManager = {
    history: [],
    currentType: 'all',
    searchQuery: '',
    selected: new Set(),

    init() {
        this.load();
        this.bindEvents();
        this.render();
    },

    load() {
        const saved = localStorage.getItem('comicai_history');
        if (saved) {
            try {
                this.history = JSON.parse(saved);
            } catch (e) {
                this.history = [];
            }
        }
    },

    save() {
        try {
            if (this.history.length > 200) {
                this.history = this.history.slice(0, 200);
            }
            localStorage.setItem('comicai_history', JSON.stringify(this.history));
        } catch (e) {
            console.warn('Failed to save history');
        }
    },

    add(level, title, message = '') {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warn: '⚠️',
            error: '❌',
            generate: '✨'
        };

        const types = {
            info: 'project',
            success: 'project',
            warn: 'project',
            error: 'project',
            generate: 'generate'
        };

        this.history.unshift({
            id: Date.now() + Math.random(),
            type: types[level] || 'project',
            icon: icons[level] || '📋',
            level,
            title,
            message,
            time: Date.now()
        });

        this.save();
        this.render();
    },

    bindEvents() {
        const toggleBtn = document.getElementById('historyToggleBtn');
        const collapseBtn = document.getElementById('historyCollapseBtn');
        const clearBtn = document.getElementById('historyClearBtn');
        const exportBtn = document.getElementById('historyExportBtn');
        const searchInput = document.getElementById('historySearch');
        const selectAll = document.getElementById('historySelectAll');
        const deleteSelected = document.getElementById('historyDeleteSelectedBtn');

        if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggleSidebar());
        if (collapseBtn) collapseBtn.addEventListener('click', () => this.toggleSidebar());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearAll());
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportHistory());
        if (searchInput) searchInput.addEventListener('input', () => {
            this.searchQuery = searchInput.value;
            this.render();
        });
        if (selectAll) selectAll.addEventListener('change', () => {
            if (selectAll.checked) {
                this.getFilteredHistory().forEach(h => this.selected.add(h.id));
            } else {
                this.selected.clear();
            }
            this.render();
        });
        if (deleteSelected) deleteSelected.addEventListener('click', () => this.deleteSelected());

        document.querySelectorAll('.history-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentType = tab.dataset.historyType;
                document.querySelectorAll('.history-tab').forEach(t => {
                    t.classList.toggle('active', t.dataset.historyType === this.currentType);
                });
                this.render();
            });
        });
    },

    toggleSidebar() {
        const sidebar = document.getElementById('historySidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
        }
    },

    getFilteredHistory() {
        let items = [...this.history];

        if (this.currentType !== 'all') {
            items = items.filter(h => h.type === this.currentType);
        }

        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            items = items.filter(h =>
                h.title.toLowerCase().includes(q) ||
                h.message?.toLowerCase().includes(q)
            );
        }

        return items;
    },

    render() {
        const list = document.getElementById('historyList');
        if (!list) return;

        const items = this.getFilteredHistory();
        const selectAll = document.getElementById('historySelectAll');
        const deleteBtn = document.getElementById('historyDeleteSelectedBtn');

        if (selectAll) {
            selectAll.checked = items.length > 0 && items.every(h => this.selected.has(h.id));
            selectAll.indeterminate = items.some(h => this.selected.has(h.id)) && !selectAll.checked;
        }
        if (deleteBtn) deleteBtn.disabled = this.selected.size === 0;

        if (items.length === 0) {
            list.innerHTML = `
                <div class="history-empty">
                    <div style="font-size:32px;margin-bottom:8px;">📭</div>
                    <div>暂无历史记录</div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">执行的操作会显示在这里</div>
                </div>
            `;
            return;
        }

        list.innerHTML = items.map(h => `
            <div class="history-item" data-history-id="${h.id}">
                <div class="history-item-checkbox">
                    <input type="checkbox" ${this.selected.has(h.id) ? 'checked' : ''} class="history-item-cb">
                </div>
                <div class="history-item-icon">${h.icon}</div>
                <div class="history-item-content">
                    <div class="history-item-title">${this.escapeHtml(h.title)}</div>
                    <div class="history-item-desc">${this.escapeHtml(h.message || '')}</div>
                </div>
                <div class="history-item-time">${this.formatTime(h.time)}</div>
            </div>
        `).join('');

        list.querySelectorAll('.history-item').forEach(item => {
            const id = parseFloat(item.dataset.historyId);
            const checkbox = item.querySelector('.history-item-cb');
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    e.stopPropagation();
                    if (e.target.checked) {
                        this.selected.add(id);
                    } else {
                        this.selected.delete(id);
                    }
                    this.render();
                });
            }
        });
    },

    formatTime(timestamp) {
        const d = new Date(timestamp);
        const now = new Date();
        const diff = now - d;

        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
        if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';

        return `${d.getMonth() + 1}/${d.getDate()}`;
    },

    clearAll() {
        if (!confirm('确定清空所有历史记录吗？')) return;
        this.history = [];
        this.selected.clear();
        this.save();
        this.render();
        Logger.info('历史记录', '已清空历史记录');
    },

    deleteSelected() {
        if (this.selected.size === 0) return;
        if (!confirm(`确定删除选中的 ${this.selected.size} 条记录吗？`)) return;

        this.history = this.history.filter(h => !this.selected.has(h.id));
        this.selected.clear();
        this.save();
        this.render();
        Logger.success('历史记录', '已删除选中的历史记录');
    },

    exportHistory() {
        const data = JSON.stringify(this.history, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'comicai_history.json';
        a.click();
        URL.revokeObjectURL(url);
        Logger.success('历史记录', '已导出历史记录');
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
};

/* ================================================
   17. KeyboardShortcuts - 快捷键
   ================================================ */
const KeyboardShortcuts = {
    init() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'k':
                        e.preventDefault();
                        this.focusSearch();
                        break;
                    case 'enter':
                        e.preventDefault();
                        this.quickGenerate();
                        break;
                    case 't':
                        e.preventDefault();
                        this.toggleTheme();
                        break;
                    case '/':
                        e.preventDefault();
                        this.toggleAI();
                        break;
                    case 'h':
                        e.preventDefault();
                        this.toggleHistory();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveProject();
                        break;
                }
            }
        });
    },

    focusSearch() {
        const search = document.getElementById('globalSearch');
        if (search) {
            search.focus();
            search.select();
        }
        Logger.info('快捷键', '全局搜索 (Ctrl+K)');
    },

    quickGenerate() {
        const currentTab = AppState.get('currentTab');
        if (currentTab === 'generator') {
            const btn = document.getElementById('generateBtn');
            if (btn && !btn.disabled) btn.click();
        } else if (currentTab === 'dashboard') {
            const activeTab = document.querySelector('.dashboard-panel.active');
            if (activeTab?.id === 'dashboard-quick') {
                const btn = document.getElementById('quickGenerateBtn');
                if (btn && !btn.disabled) btn.click();
            }
        }
        Logger.info('快捷键', '快速生成 (Ctrl+Enter)');
    },

    toggleTheme() {
        ThemeManager.cycleTheme();
    },

    toggleAI() {
        AIAssistant.toggle();
    },

    toggleHistory() {
        HistoryManager.toggleSidebar();
        Logger.info('快捷键', '切换历史记录 (Ctrl+H)');
    },

    saveProject() {
        const currentTab = AppState.get('currentTab');
        if (currentTab === 'generator') {
            const btn = document.getElementById('saveProjectBtn');
            if (btn && !btn.disabled) btn.click();
        }
        Logger.info('快捷键', '保存项目 (Ctrl+S)');
    }
};

/* ================================================
   18. StorageManager - 存储管理系统
   ================================================ */
const StorageManager = {
    dbName: 'ComicAI',
    dbVersion: 1,
    db: null,
    storageType: 'local',
    customStorageName: 'comicai_data',
    cloudSyncEnabled: false,
    lastSyncTime: null,

    init() {
        this.loadSettings();
        this.initIndexedDB();
        this.bindEvents();
        this.renderStorageSettings();
    },

    loadSettings() {
        const saved = localStorage.getItem('comicai_storage_settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.storageType = settings.storageType || 'local';
                this.customStorageName = settings.customStorageName || 'comicai_data';
                this.cloudSyncEnabled = settings.cloudSyncEnabled || false;
                this.lastSyncTime = settings.lastSyncTime || null;
            } catch (e) {}
        }
    },

    saveSettings() {
        const settings = {
            storageType: this.storageType,
            customStorageName: this.customStorageName,
            cloudSyncEnabled: this.cloudSyncEnabled,
            lastSyncTime: this.lastSyncTime
        };
        localStorage.setItem('comicai_storage_settings', JSON.stringify(settings));
    },

    initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('projects')) {
                    const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
                    projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                    projectStore.createIndex('name', 'name', { unique: false });
                }
                if (!db.objectStoreNames.contains('characters')) {
                    const charStore = db.createObjectStore('characters', { keyPath: 'id' });
                    charStore.createIndex('name', 'name', { unique: false });
                }
                if (!db.objectStoreNames.contains('scenes')) {
                    const sceneStore = db.createObjectStore('scenes', { keyPath: 'id' });
                    sceneStore.createIndex('category', 'category', { unique: false });
                }
                if (!db.objectStoreNames.contains('templates')) {
                    const tplStore = db.createObjectStore('templates', { keyPath: 'id' });
                    tplStore.createIndex('category', 'category', { unique: false });
                }
                if (!db.objectStoreNames.contains('workflows')) {
                    const wfStore = db.createObjectStore('workflows', { keyPath: 'id' });
                    wfStore.createIndex('name', 'name', { unique: false });
                }
                if (!db.objectStoreNames.contains('aiHistory')) {
                    const aiStore = db.createObjectStore('aiHistory', { keyPath: 'id' });
                    aiStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    },

    async saveToIndexedDB(storeName, data) {
        if (!this.db) await this.initIndexedDB();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = Array.isArray(data) 
                ? Promise.all(data.map(item => store.put(item)))
                : store.put(data);
            
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async loadFromIndexedDB(storeName) {
        if (!this.db) await this.initIndexedDB();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async exportAllData() {
        const data = {
            version: '1.0',
            exportTime: Date.now(),
            projects: ProjectManager.getProjects(),
            characters: CharacterManager.getCharacters(),
            scenes: SceneManager.getScenes(),
            templates: TemplateManager.getTemplates(),
            workflows: this.getWorkflows(),
            aiHistory: this.getAIHistory(),
            settings: AppState.getSettings()
        };
        return data;
    },

    async importData(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            if (data.projects && Array.isArray(data.projects)) {
                ProjectManager.projects = data.projects;
                ProjectManager.save();
            }
            if (data.characters && Array.isArray(data.characters)) {
                CharacterManager.characters = data.characters;
                CharacterManager.save();
            }
            if (data.scenes && Array.isArray(data.scenes)) {
                SceneManager.scenes = data.scenes;
                SceneManager.save();
            }
            if (data.templates && Array.isArray(data.templates)) {
                TemplateManager.templates = data.templates;
                TemplateManager.save();
            }
            if (data.settings) {
                Object.assign(AppState.state.settings, data.settings);
                AppState.save();
            }

            await this.saveToIndexedDB('projects', ProjectManager.projects);
            await this.saveToIndexedDB('characters', CharacterManager.characters);
            await this.saveToIndexedDB('scenes', SceneManager.scenes);
            await this.saveToIndexedDB('templates', TemplateManager.templates);

            Logger.success('数据导入', '成功导入所有数据');
            return true;
        } catch (e) {
            Logger.error('数据导入', `导入失败: ${e.message}`);
            return false;
        }
    },

    downloadExportFile() {
        this.exportAllData().then(data => {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `comicai_backup_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            Logger.success('数据导出', '成功导出数据文件');
        });
    },

    uploadImportFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                this.importData(event.target.result).then(success => {
                    if (success) {
                        alert('数据导入成功！');
                        location.reload();
                    } else {
                        alert('数据导入失败，请检查文件格式');
                    }
                });
            };
            reader.readAsText(file);
        };
        input.click();
    },

    getWorkflows() {
        const saved = localStorage.getItem('comicai_workflows');
        return saved ? JSON.parse(saved) : [];
    },

    getAIHistory() {
        const saved = localStorage.getItem('comicai_ai_history');
        return saved ? JSON.parse(saved) : [];
    },

    simulateCloudUpload() {
        return new Promise((resolve) => {
            Logger.info('云端同步', '正在上传数据到云端...');
            setTimeout(() => {
                this.lastSyncTime = Date.now();
                this.saveSettings();
                Logger.success('云端同步', '数据已成功上传到云端');
                resolve(true);
            }, 1500);
        });
    },

    simulateCloudDownload() {
        return new Promise((resolve) => {
            Logger.info('云端同步', '正在从云端下载数据...');
            setTimeout(() => {
                this.lastSyncTime = Date.now();
                this.saveSettings();
                Logger.success('云端同步', '已从云端同步最新数据');
                resolve(true);
            }, 1500);
        });
    },

    async syncWithCloud() {
        if (!this.cloudSyncEnabled) {
            Logger.warn('云端同步', '云端同步未启用');
            return;
        }
        await this.simulateCloudUpload();
    },

    renderStorageSettings() {
        const panel = document.querySelector('[data-settings-panel="storage"]');
        if (!panel) return;

        const lastSyncStr = this.lastSyncTime 
            ? new Date(this.lastSyncTime).toLocaleString('zh-CN') 
            : '从未同步';

        panel.innerHTML = `
            <div class="setting-section">
                <h3 class="setting-section-title">💾 存储位置</h3>
                <p class="setting-section-desc">选择数据存储的位置和方式</p>
                <div class="setting-list">
                    <div class="setting-item">
                        <div class="setting-item-info">
                            <span class="setting-item-label">存储类型</span>
                            <span class="setting-item-desc">选择数据存储方式</span>
                        </div>
                        <select class="select-input" id="storageTypeSelect">
                            <option value="local" ${this.storageType === 'local' ? 'selected' : ''}>本地存储 (localStorage)</option>
                            <option value="indexeddb" ${this.storageType === 'indexeddb' ? 'selected' : ''}>IndexedDB (大容量)</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <div class="setting-item-info">
                            <span class="setting-item-label">自定义存储名称</span>
                            <span class="setting-item-desc">设置本地存储的键名</span>
                        </div>
                        <input type="text" class="text-input" id="customStorageName" value="${this.customStorageName}">
                    </div>
                </div>
            </div>

            <div class="setting-section">
                <h3 class="setting-section-title">☁️ 云端同步</h3>
                <p class="setting-section-desc">同步数据到云端，跨设备访问</p>
                <div class="setting-list">
                    <div class="setting-item">
                        <div class="setting-item-info">
                            <span class="setting-item-label">启用云端同步</span>
                            <span class="setting-item-desc">开启后自动同步数据到云端</span>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="cloudSyncToggle" ${this.cloudSyncEnabled ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <div class="setting-item-info">
                            <span class="setting-item-label">最后同步时间</span>
                            <span class="setting-item-desc">${lastSyncStr}</span>
                        </div>
                    </div>
                </div>
                <div style="display:flex;gap:8px;margin-top:12px;">
                    <button class="btn btn-primary btn-sm" id="uploadCloudBtn">⬆ 上传到云端</button>
                    <button class="btn btn-secondary btn-sm" id="downloadCloudBtn">⬇ 从云端下载</button>
                </div>
            </div>

            <div class="setting-section">
                <h3 class="setting-section-title">📤 数据导入/导出</h3>
                <p class="setting-section-desc">备份或恢复所有数据</p>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-primary btn-sm btn-full" id="exportDataBtn">📥 导出数据 (JSON)</button>
                    <button class="btn btn-secondary btn-sm btn-full" id="importDataBtn">📤 导入数据 (JSON)</button>
                </div>
                <div style="margin-top:8px;padding:8px 12px;background:var(--bg-secondary);border-radius:6px;font-size:12px;color:var(--text-muted);">
                    <p>💡 建议定期导出数据备份，以防浏览器数据丢失</p>
                    <p style="margin-top:4px;">导出格式为JSON，可以在其他设备上导入</p>
                </div>
            </div>

            <div class="setting-section">
                <h3 class="setting-section-title">📊 存储统计</h3>
                <p class="setting-section-desc">当前数据存储使用情况</p>
                <div class="setting-list">
                    <div class="setting-item">
                        <div class="setting-item-info">
                            <span class="setting-item-label">项目数量</span>
                            <span class="setting-item-desc">${ProjectManager.getProjects().length} 个项目</span>
                        </div>
                    </div>
                    <div class="setting-item">
                        <div class="setting-item-info">
                            <span class="setting-item-label">角色数量</span>
                            <span class="setting-item-desc">${CharacterManager.getCharacters().length} 个角色</span>
                        </div>
                    </div>
                    <div class="setting-item">
                        <div class="setting-item-info">
                            <span class="setting-item-label">场景数量</span>
                            <span class="setting-item-desc">${SceneManager.getScenes().length} 个场景</span>
                        </div>
                    </div>
                    <div class="setting-item">
                        <div class="setting-item-info">
                            <span class="setting-item-label">模板数量</span>
                            <span class="setting-item-desc">${TemplateManager.getTemplates().length} 个模板</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const storageTypeSelect = document.getElementById('storageTypeSelect');
        const customStorageName = document.getElementById('customStorageName');
        const cloudSyncToggle = document.getElementById('cloudSyncToggle');
        const uploadCloudBtn = document.getElementById('uploadCloudBtn');
        const downloadCloudBtn = document.getElementById('downloadCloudBtn');
        const exportDataBtn = document.getElementById('exportDataBtn');
        const importDataBtn = document.getElementById('importDataBtn');

        if (storageTypeSelect) storageTypeSelect.addEventListener('change', (e) => {
            this.storageType = e.target.value;
            this.saveSettings();
            Logger.info('存储设置', `存储类型已切换为${e.target.value}`);
        });

        if (customStorageName) customStorageName.addEventListener('change', (e) => {
            this.customStorageName = e.target.value;
            this.saveSettings();
        });

        if (cloudSyncToggle) cloudSyncToggle.addEventListener('change', (e) => {
            this.cloudSyncEnabled = e.target.checked;
            this.saveSettings();
            Logger.info('存储设置', `云端同步：${e.target.checked ? '开启' : '关闭'}`);
        });

        if (uploadCloudBtn) uploadCloudBtn.addEventListener('click', () => this.simulateCloudUpload());
        if (downloadCloudBtn) downloadCloudBtn.addEventListener('click', () => this.simulateCloudDownload());
        if (exportDataBtn) exportDataBtn.addEventListener('click', () => this.downloadExportFile());
        if (importDataBtn) importDataBtn.addEventListener('click', () => this.uploadImportFile());
    }
};

/* ================================================
   19. SkillManager - 技能系统
   ================================================ */
const SkillManager = {
    init() {
    },

    getSkills() {
        return AppState.state.skills;
    },

    isEnabled(skillId) {
        return AppState.state.skills[skillId]?.enabled || false;
    },

    enable(skillId) {
        if (AppState.state.skills[skillId]) {
            AppState.state.skills[skillId].enabled = true;
            AppState.save();
            Logger.info('技能管理', `启用技能：${AppState.state.skills[skillId].name}`);
        }
    },

    disable(skillId) {
        if (AppState.state.skills[skillId]) {
            AppState.state.skills[skillId].enabled = false;
            AppState.save();
            Logger.info('技能管理', `禁用技能：${AppState.state.skills[skillId].name}`);
        }
    },

    toggle(skillId) {
        if (this.isEnabled(skillId)) {
            this.disable(skillId);
        } else {
            this.enable(skillId);
        }
    }
};

/* ================================================
   19. FileRecognitionManager - 文件上传与智能识别
   ================================================ */
const FileRecognitionManager = {
    // 快速生成面板的文件列表
    quickFiles: [],
    // 分镜生成页面的文件列表
    genFiles: [],
    // 识别结果缓存
    recognitionCache: { quick: null, gen: null },

    // 图片识别模拟数据库 - 场景元素
    sceneElements: [
        { icon: '🌃', name: '城市夜景', keywords: ['赛博朋克', '霓虹灯', '都市'] },
        { icon: '🌧️', name: '雨天', keywords: ['雨夜', '忧伤', '氛围感'] },
        { icon: '🏫', name: '学校', keywords: ['校园', '青春', '日常'] },
        { icon: '🌸', name: '樱花', keywords: ['春天', '浪漫', '日系'] },
        { icon: '☕', name: '咖啡馆', keywords: ['都市', '休闲', '对话'] },
        { icon: '🏰', name: '城堡', keywords: ['奇幻', '中世纪', '史诗'] },
        { icon: '⚔️', name: '武器', keywords: ['战斗', '热血', '动作'] },
        { icon: '🎭', name: '面具', keywords: ['神秘', '悬疑', '身份'] },
        { icon: '🌙', name: '月亮', keywords: ['夜晚', '思念', '孤独'] },
        { icon: '🔥', name: '火焰', keywords: ['热血', '战斗', '毁灭'] },
        { icon: '❄️', name: '冰雪', keywords: ['寒冷', '纯净', '奇幻'] },
        { icon: '🌿', name: '森林', keywords: ['自然', '冒险', '治愈'] },
        { icon: '⛰️', name: '山脉', keywords: ['壮阔', '冒险', '远景'] },
        { icon: '🌊', name: '海洋', keywords: ['广阔', '自由', '夏日'] },
        { icon: '🚗', name: '车辆', keywords: ['都市', '追逐', '速度'] },
        { icon: '📱', name: '手机', keywords: ['现代', '日常', '通讯'] }
    ],

    // 图片识别模拟数据库 - 人物特征
    characterTraits: [
        { icon: '👧', name: '少女', keywords: ['青春', '可爱', '元气'] },
        { icon: '👨', name: '青年男性', keywords: ['帅气', '沉稳', '主角'] },
        { icon: '👵', name: '老者', keywords: ['智慧', '导师', '神秘'] },
        { icon: '🧒', name: '儿童', keywords: ['天真', '活泼', '治愈'] },
        { icon: '👩‍🦰', name: '红发女性', keywords: ['热情', '火辣', '个性'] },
        { icon: '👨‍🦱', name: '卷发男性', keywords: ['文艺', '温柔', '可靠'] }
    ],

    // 色彩情绪映射
    colorMoods: [
        { colors: ['红色', '橙色'], mood: '热血', keywords: ['战斗', '激情', '冲突'] },
        { colors: ['蓝色', '青色'], mood: '冷静', keywords: ['沉稳', '科技', '孤独'] },
        { colors: ['粉色', '紫色'], mood: '浪漫', keywords: ['恋爱', '梦幻', '少女'] },
        { colors: ['绿色', '黄色'], mood: '活力', keywords: ['青春', '自然', '希望'] },
        { colors: ['黑色', '灰色'], mood: '压抑', keywords: ['悬疑', '黑暗', '紧张'] },
        { colors: ['金色', '白色'], mood: '神圣', keywords: ['光芒', '希望', '觉醒'] }
    ],

    // 构图类型
    compositionTypes: [
        { name: '三分法构图', desc: '画面按3×3分割，主体在交叉点上', keywords: ['平衡', '经典'] },
        { name: '对称构图', desc: '左右或上下对称，营造庄重感', keywords: ['庄严', '正式'] },
        { name: '对角线构图', desc: '主体沿对角线排列，增强动感', keywords: ['动感', '速度'] },
        { name: '框架构图', desc: '利用前景元素形成框架', keywords: ['聚焦', '层次'] },
        { name: '留白构图', desc: '大面积留白，突出主体', keywords: ['简约', '意境'] }
    ],

    init() {
        this.bindQuickUpload();
        this.bindGenUpload();
    },

    // ========== 快速生成面板的上传 ==========
    bindQuickUpload() {
        const area = document.getElementById('quickUploadArea');
        const input = document.getElementById('quickFileInput');
        if (!area || !input) return;

        area.addEventListener('click', () => input.click());

        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('dragover');
        });

        area.addEventListener('dragleave', () => {
            area.classList.remove('dragover');
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                this.handleFiles(e.dataTransfer.files, 'quick');
            }
        });

        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFiles(e.target.files, 'quick');
            }
        });

        const clearBtn = document.getElementById('quickClearRecognition');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearRecognition('quick'));
        }
    },

    // ========== 分镜生成页面的上传 ==========
    bindGenUpload() {
        const area = document.getElementById('genUploadArea');
        const input = document.getElementById('genFileInput');
        if (!area || !input) return;

        area.addEventListener('click', () => input.click());

        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('dragover');
        });

        area.addEventListener('dragleave', () => {
            area.classList.remove('dragover');
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                this.handleFiles(e.dataTransfer.files, 'gen');
            }
        });

        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFiles(e.dataTransfer.files, 'gen');
            }
        });

        // 上传按钮（剧本输入面板顶部）
        const uploadBtn = document.getElementById('uploadScriptBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                NavManager.switchTab('generator');
                setTimeout(() => {
                    const genArea = document.getElementById('genUploadArea');
                    if (genArea) genArea.click();
                }, 200);
            });
        }

        const clearFilesBtn = document.getElementById('genClearFilesBtn');
        if (clearFilesBtn) {
            clearFilesBtn.addEventListener('click', () => {
                this.genFiles = [];
                this.renderFileList('gen');
                this.clearRecognition('gen');
                Logger.info('文件管理', '已清空所有文件');
            });
        }

        const applyBtn = document.getElementById('applyRecognitionBtn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyToScript());
        }

        const clearRecBtn = document.getElementById('genClearRecognitionBtn');
        if (clearRecBtn) {
            clearRecBtn.addEventListener('click', () => this.clearRecognition('gen'));
        }
    },

    // ========== 处理上传的文件 ==========
    handleFiles(fileList, target) {
        const files = Array.from(fileList);
        Logger.info('文件上传', `正在处理 ${files.length} 个文件...`);

        files.forEach(file => {
            const fileObj = {
                id: 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
                name: file.name,
                size: file.size,
                type: file.type,
                file: file,
                status: 'processing'
            };

            if (target === 'quick') {
                this.quickFiles.push(fileObj);
            } else {
                this.genFiles.push(fileObj);
            }

            this.renderFileList(target);

            // 根据文件类型处理
            if (file.type.startsWith('image/')) {
                this.processImage(fileObj, target);
            } else if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|json)$/i)) {
                this.processText(fileObj, target);
            } else if (file.name.match(/\.(pdf|doc|docx)$/i)) {
                this.processDocument(fileObj, target);
            } else {
                fileObj.status = 'done';
                this.renderFileList(target);
                Logger.warn('文件识别', `不支持的文件类型：${file.name}`);
            }
        });
    },

    // ========== 渲染文件列表 ==========
    renderFileList(target) {
        const listEl = document.getElementById(target === 'quick' ? 'quickFileList' : 'genFileList');
        if (!listEl) return;

        const files = target === 'quick' ? this.quickFiles : this.genFiles;
        if (files.length === 0) {
            listEl.innerHTML = '';
            return;
        }

        listEl.innerHTML = files.map(f => {
            const sizeStr = f.size < 1024 ? f.size + 'B' : f.size < 1024 * 1024 ? (f.size / 1024).toFixed(1) + 'KB' : (f.size / 1024 / 1024).toFixed(1) + 'MB';
            const isImage = f.type.startsWith('image/');
            const icon = isImage ? '🖼️' : f.name.match(/\.(txt|md)$/i) ? '📄' : f.name.match(/\.(pdf|doc|docx)$/i) ? '📕' : f.name.match(/\.json$/i) ? '📋' : '📎';

            let thumb = '';
            if (isImage && f.dataUrl) {
                thumb = `<img class="upload-file-thumb" src="${f.dataUrl}" alt="${f.name}">`;
            } else {
                thumb = `<div class="upload-file-icon">${icon}</div>`;
            }

            const statusDot = f.status === 'processing'
                ? '<span class="status-dot processing"></span><span style="font-size:11px;color:var(--warning);">识别中...</span>'
                : '<span class="status-dot done"></span><span style="font-size:11px;color:var(--success);">已完成</span>';

            return `
                <div class="upload-file-item" data-file-id="${f.id}">
                    ${thumb}
                    <div class="upload-file-info">
                        <div class="upload-file-name">${f.name}</div>
                        <div class="upload-file-meta">${sizeStr} · ${f.type || '未知类型'}</div>
                    </div>
                    <div class="upload-file-status">
                        ${statusDot}
                        <button class="upload-file-remove" onclick="FileRecognitionManager.removeFile('${f.id}', '${target}')">✕</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // ========== 移除文件 ==========
    removeFile(fileId, target) {
        if (target === 'quick') {
            this.quickFiles = this.quickFiles.filter(f => f.id !== fileId);
        } else {
            this.genFiles = this.genFiles.filter(f => f.id !== fileId);
        }
        this.renderFileList(target);
        Logger.info('文件管理', '已移除文件');
    },

    // ========== 处理图片文件 ==========
    processImage(fileObj, target) {
        const reader = new FileReader();
        reader.onload = (e) => {
            fileObj.dataUrl = e.target.result;
            fileObj.status = 'processing';
            this.renderFileList(target);

            // 显示识别加载动画
            this.showRecognitionLoading(target);

            // 模拟AI图片识别过程
            Logger.generate('图片识别', `正在识别图片「${fileObj.name}」...`);

            setTimeout(() => {
                const result = this.mockImageRecognition(fileObj);
                fileObj.status = 'done';
                this.renderFileList(target);
                this.showRecognitionResult(result, target, fileObj);
                Logger.success('图片识别完成', `已识别「${fileObj.name}」: ${result.sceneTags.length}个场景元素, ${result.characterTags.length}个人物特征`);
            }, 2000);
        };
        reader.readAsDataURL(fileObj.file);
    },

    // ========== 处理文本文件 ==========
    processText(fileObj, target) {
        const reader = new FileReader();
        reader.onload = (e) => {
            fileObj.text = e.target.result;
            fileObj.status = 'processing';
            this.renderFileList(target);

            this.showRecognitionLoading(target);

            Logger.generate('文字识别', `正在分析文档「${fileObj.name}」...`);

            setTimeout(() => {
                const result = this.mockTextRecognition(fileObj.text, fileObj.name);
                fileObj.status = 'done';
                this.renderFileList(target);
                this.showRecognitionResult(result, target, fileObj);
                Logger.success('文字识别完成', `已提取${result.wordCount}字, 识别${result.keywords.length}个关键词`);
            }, 1500);
        };
        reader.readAsText(fileObj.file);
    },

    // ========== 处理文档文件（PDF/DOC） ==========
    processDocument(fileObj, target) {
        this.showRecognitionLoading(target);

        Logger.generate('文档识别', `正在解析文档「${fileObj.name}」...`);

        setTimeout(() => {
            // 模拟文档解析
            const result = this.mockDocumentRecognition(fileObj.name);
            fileObj.status = 'done';
            this.renderFileList(target);
            this.showRecognitionResult(result, target, fileObj);
            Logger.success('文档识别完成', `已解析文档「${fileObj.name}」`);
        }, 2000);
    },

    // ========== 显示识别加载动画 ==========
    showRecognitionLoading(target) {
        const resultEl = document.getElementById(target === 'quick' ? 'quickRecognitionResult' : 'genRecognitionResult');
        const bodyEl = document.getElementById(target === 'quick' ? 'quickRecognitionBody' : 'genRecognitionBody');
        if (!resultEl || !bodyEl) return;

        resultEl.style.display = 'block';
        bodyEl.innerHTML = `
            <div class="recognition-loading">
                <div class="recognition-loading-spinner"></div>
                <div class="recognition-loading-text">AI正在智能识别中...</div>
                <div class="recognition-loading-steps">
                    正在分析画面构成 · 提取文字内容 · 生成联想推荐
                </div>
            </div>
        `;

        // 隐藏联想区
        const sugEl = document.getElementById(target === 'quick' ? 'quickSuggestions' : 'genSuggestions');
        if (sugEl) sugEl.style.display = 'none';
    },

    // ========== 显示识别结果 ==========
    showRecognitionResult(result, target, fileObj) {
        const resultEl = document.getElementById(target === 'quick' ? 'quickRecognitionResult' : 'genRecognitionResult');
        const bodyEl = document.getElementById(target === 'quick' ? 'quickRecognitionBody' : 'genRecognitionBody');
        const sugEl = document.getElementById(target === 'quick' ? 'quickSuggestions' : 'genSuggestions');
        const sugTagsEl = document.getElementById(target === 'quick' ? 'quickSuggestions' : 'genSuggestionTags');

        if (!resultEl || !bodyEl) return;

        resultEl.style.display = 'block';
        this.recognitionCache[target] = result;

        let html = '';

        // 图片预览
        if (result.type === 'image' && fileObj.dataUrl) {
            html += `<img class="recognition-image-preview" src="${fileObj.dataUrl}" alt="预览">`;
        }

        // 场景元素检测
        if (result.sceneTags && result.sceneTags.length > 0) {
            html += `
                <div class="recognition-section">
                    <div class="recognition-section-title">🏞️ 场景元素检测</div>
                    <div class="detected-items">
                        ${result.sceneTags.map(s => `
                            <div class="detected-item">
                                <div class="detected-item-icon">${s.icon}</div>
                                <div class="detected-item-name">${s.name}</div>
                                <div class="detected-item-confidence">${s.confidence}%</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 人物特征检测
        if (result.characterTags && result.characterTags.length > 0) {
            html += `
                <div class="recognition-section">
                    <div class="recognition-section-title">👤 人物特征检测</div>
                    <div class="recognition-tags">
                        ${result.characterTags.map(c => `
                            <span class="recognition-tag" onclick="FileRecognitionManager.addTagToInput('${c.name}', '${target}')">
                                ${c.icon} ${c.name}
                                <span class="tag-confidence">${c.confidence}%</span>
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 色彩情绪分析
        if (result.colorMood) {
            html += `
                <div class="recognition-section">
                    <div class="recognition-section-title">🎨 色彩情绪分析</div>
                    <div class="recognition-text">
                        主色调：<strong>${result.colorMood.colors.join('、')}</strong><br>
                        情绪基调：<strong>${result.colorMood.mood}</strong><br>
                        关联关键词：${result.colorMood.keywords.join('、')}
                    </div>
                </div>
            `;
        }

        // 构图分析
        if (result.composition) {
            html += `
                <div class="recognition-section">
                    <div class="recognition-section-title">📐 构图分析</div>
                    <div class="recognition-text">
                        <strong>${result.composition.name}</strong>：${result.composition.desc}<br>
                        关键词：${result.composition.keywords.join('、')}
                    </div>
                </div>
            `;
        }

        // 提取的文字内容
        if (result.extractedText) {
            const previewText = result.extractedText.length > 500
                ? result.extractedText.substring(0, 500) + '...'
                : result.extractedText;
            html += `
                <div class="recognition-section">
                    <div class="recognition-section-title">📝 提取的文字内容 (${result.wordCount}字)</div>
                    <div class="recognition-text" style="white-space:pre-wrap;">${this.escapeHtml(previewText)}</div>
                </div>
            `;
        }

        // 关键词
        if (result.keywords && result.keywords.length > 0) {
            html += `
                <div class="recognition-section">
                    <div class="recognition-section-title">🏷️ 识别关键词</div>
                    <div class="recognition-tags">
                        ${result.keywords.map(k => `
                            <span class="recognition-tag" onclick="FileRecognitionManager.addTagToInput('${k}', '${target}')">
                                ${k}
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 场景描述建议
        if (result.sceneDescription) {
            html += `
                <div class="recognition-section">
                    <div class="recognition-section-title">✨ AI场景描述建议</div>
                    <div class="recognition-text">${result.sceneDescription}</div>
                </div>
            `;
        }

        bodyEl.innerHTML = html;

        // 渲染联想推荐
        if (sugEl && sugTagsEl && result.suggestions && result.suggestions.length > 0) {
            sugEl.style.display = 'block';
            sugTagsEl.innerHTML = result.suggestions.map(s => `
                <span class="suggestion-tag" onclick="FileRecognitionManager.applySuggestion('${s.text}', '${target}')">
                    ${s.icon || '💡'} ${s.text}
                    <span class="suggestion-type">${s.type}</span>
                </span>
            `).join('');
        } else if (sugEl) {
            sugEl.style.display = 'none';
        }
    },

    // ========== 模拟图片识别 ==========
    mockImageRecognition(fileObj) {
        // 随机选择3-5个场景元素
        const shuffled = [...this.sceneElements].sort(() => Math.random() - 0.5);
        const sceneCount = 3 + Math.floor(Math.random() * 3);
        const sceneTags = shuffled.slice(0, sceneCount).map(s => ({
            ...s,
            confidence: 75 + Math.floor(Math.random() * 24)
        }));

        // 随机选择1-3个人物特征
        const charShuffled = [...this.characterTraits].sort(() => Math.random() - 0.5);
        const charCount = 1 + Math.floor(Math.random() * 3);
        const characterTags = charShuffled.slice(0, charCount).map(c => ({
            ...c,
            confidence: 70 + Math.floor(Math.random() * 29)
        }));

        // 色彩情绪
        const colorMood = this.colorMoods[Math.floor(Math.random() * this.colorMoods.length)];

        // 构图
        const composition = this.compositionTypes[Math.floor(Math.random() * this.compositionTypes.length)];

        // 汇总关键词
        const keywords = [];
        sceneTags.forEach(s => keywords.push(...s.keywords));
        characterTags.forEach(c => keywords.push(...c.keywords));
        keywords.push(...colorMood.keywords);
        const uniqueKeywords = [...new Set(keywords)].slice(0, 12);

        // 生成场景描述建议
        const sceneDesc = this.generateSceneDescription(sceneTags, characterTags, colorMood, composition);

        // 联想推荐
        const suggestions = this.generateSuggestions(uniqueKeywords, 'image');

        return {
            type: 'image',
            sceneTags,
            characterTags,
            colorMood,
            composition,
            keywords: uniqueKeywords,
            sceneDescription: sceneDesc,
            suggestions
        };
    },

    // ========== 模拟文字识别 ==========
    mockTextRecognition(text, fileName) {
        const wordCount = text.length;

        // 提取关键词（模拟）
        const allKeywords = [
            '校园', '恋爱', '战斗', '热血', '悬疑', '推理', '友情', '成长',
            '冒险', '奇幻', '科幻', '都市', '古风', '修仙', '机甲', '魔法',
            '雨夜', '樱花', '夕阳', '教室', '天台', '街道', '咖啡馆',
            '告白', '离别', '重逢', '误会', '真相', '觉醒', '逆袭', '守护'
        ];

        // 根据文本内容匹配关键词
        const keywords = [];
        allKeywords.forEach(kw => {
            if (text.includes(kw)) {
                keywords.push(kw);
            }
        });

        // 如果匹配太少，随机补充
        if (keywords.length < 5) {
            const extra = allKeywords.sort(() => Math.random() - 0.5).slice(0, 8 - keywords.length);
            keywords.push(...extra);
        }

        const uniqueKeywords = [...new Set(keywords)].slice(0, 15);

        // 生成场景描述建议
        const sentences = text.split(/[。！？\n.!?]/).filter(s => s.trim().length > 5);
        const firstSentence = sentences[0]?.trim() || text.substring(0, 50);

        // 联想推荐
        const suggestions = this.generateSuggestions(uniqueKeywords, 'text');

        return {
            type: 'text',
            extractedText: text,
            wordCount,
            keywords: uniqueKeywords,
            suggestions
        };
    },

    // ========== 模拟文档识别 ==========
    mockDocumentRecognition(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        const mockText = `【文档标题】${fileName.replace(/\.[^.]+$/, '')}

第一章 序章
暗夜中，一道身影从高楼的边缘纵身跃下。风声呼啸，衣袂翻飞。
月光洒落在她的银发上，如同流淌的水银。

"终于回来了..."她低声呢喃，落地的瞬间，地面出现了细微的裂痕。

第二章 相遇
校园的樱花树下，少年正倚靠着树干看书。
一片花瓣飘落在书页上，他抬起头——
"你...在看我吗？"

第三章 觉醒
封印的力量开始涌动，古老的符文在体内觉醒。
"这是...什么力量？"`;

        const keywords = ['觉醒', '校园', '樱花', '月光', '暗夜', '力量', '封印', '相遇', '神秘', '符文'];
        const suggestions = this.generateSuggestions(keywords, 'document');

        return {
            type: 'document',
            extractedText: mockText,
            wordCount: mockText.length,
            keywords,
            suggestions
        };
    },

    // ========== 生成场景描述建议 ==========
    generateSceneDescription(sceneTags, characterTags, colorMood, composition) {
        const sceneName = sceneTags[0]?.name || '场景';
        const charName = characterTags[0]?.name || '角色';
        const mood = colorMood?.mood || '氛围';

        const templates = [
            `【${sceneName} - ${mood}氛围】\n[${composition.name}]\n${charName}站在${sceneName}中，${colorMood.colors.join('与')}交织的光影洒落在身上。${sceneTags[1] ? sceneTags[1].name + '若隐若现，' : ''}整体画面${mood}而富有层次感。`,
            `[全景镜头]\n画面展现${sceneName}的全貌，${colorMood.colors.join('色调')}渲染出${mood}的情绪。${charName}位于画面的视觉中心，${composition.name}使构图更加稳定有力。`,
            `[近景镜头]\n${charName}的特写，背景是模糊的${sceneName}。${colorMood.mood}的色调烘托出角色的内心情感，${sceneTags[1]?.name || '环境元素'}作为点缀增强画面故事感。`
        ];

        return templates[Math.floor(Math.random() * templates.length)];
    },

    // ========== 生成联想推荐 ==========
    generateSuggestions(keywords, sourceType) {
        const suggestions = [];

        // 风格推荐
        const styleMap = {
            '赛博朋克': { icon: '🌃', text: '赛博朋克风格', type: '风格' },
            '日系': { icon: '🌸', text: '日系漫画风格', type: '风格' },
            '热血': { icon: '🔥', text: '热血战斗风格', type: '风格' },
            '恋爱': { icon: '💕', text: '恋爱少女风格', type: '风格' },
            '悬疑': { icon: '🔍', text: '悬疑暗黑风格', type: '风格' },
            '奇幻': { icon: '⚔️', text: '奇幻冒险风格', type: '风格' },
            '古风': { icon: '🎋', text: '古风水墨风格', type: '风格' }
        };

        keywords.forEach(kw => {
            if (styleMap[kw]) {
                suggestions.push(styleMap[kw]);
            }
        });

        // 镜头推荐
        if (keywords.includes('战斗') || keywords.includes('热血')) {
            suggestions.push({ icon: '🎥', text: '使用动态分镜，多角度切换', type: '镜头' });
        }
        if (keywords.includes('恋爱') || keywords.includes('浪漫')) {
            suggestions.push({ icon: '🎥', text: '使用柔焦近景，营造暧昧氛围', type: '镜头' });
        }
        if (keywords.includes('悬疑') || keywords.includes('紧张')) {
            suggestions.push({ icon: '🎥', text: '使用特写和仰视镜头增强压迫感', type: '镜头' });
        }

        // 剧情推荐
        if (keywords.includes('校园') && keywords.includes('恋爱')) {
            suggestions.push({ icon: '📖', text: '推荐模板：校园恋爱开场', type: '剧情' });
        }
        if (keywords.includes('战斗') && keywords.includes('觉醒')) {
            suggestions.push({ icon: '📖', text: '推荐模板：主角觉醒', type: '剧情' });
        }
        if (keywords.includes('雨夜') || keywords.includes('暗夜')) {
            suggestions.push({ icon: '📖', text: '推荐场景：雨夜追凶', type: '剧情' });
        }

        // 关键词推荐
        const hotKw = ['咕咕嘎嘎', 'Doro', '菲比', '氛围感', '镜头语言', '情绪张力'];
        hotKw.forEach(kw => {
            if (Math.random() > 0.5) {
                suggestions.push({ icon: '🔥', text: kw, type: '热词' });
            }
        });

        // 确保至少有3个推荐
        if (suggestions.length < 3) {
            suggestions.push({ icon: '💡', text: '尝试添加更多细节描述', type: '提示' });
            suggestions.push({ icon: '🎨', text: '尝试不同的漫画风格', type: '提示' });
            suggestions.push({ icon: '📷', text: '参考经典漫画构图', type: '提示' });
        }

        return suggestions.slice(0, 8);
    },

    // ========== 点击识别标签添加到输入框 ==========
    addTagToInput(tag, target) {
        if (target === 'quick') {
            const input = document.getElementById('quickScript');
            if (input) {
                const current = input.value.trim();
                input.value = current + (current ? ' ' : '') + `#${tag}#`;
                input.focus();
                Logger.info('关键词添加', `已添加关键词「${tag}」到剧本描述`);
            }
        } else {
            const input = document.getElementById('scriptInput');
            if (input) {
                const current = input.value.trim();
                input.value = current + (current ? '\n' : '') + `[关键词: ${tag}]`;
                input.focus();
                Logger.info('关键词添加', `已添加关键词「${tag}」到剧本输入`);
            }
        }
    },

    // ========== 应用联想推荐 ==========
    applySuggestion(text, target) {
        if (target === 'quick') {
            const input = document.getElementById('quickScript');
            if (input) {
                const current = input.value.trim();
                if (text.includes('风格')) {
                    // 尝试切换风格选择
                    const styleSelect = document.getElementById('quickStyle');
                    if (styleSelect) {
                        const opt = Array.from(styleSelect.options).find(o => text.includes(o.text.replace('风格', '')));
                        if (opt) {
                            styleSelect.value = opt.value;
                            Logger.info('联想应用', `已切换风格为「${opt.text}」`);
                            return;
                        }
                    }
                }
                input.value = current + (current ? ' ' : '') + text;
                input.focus();
                Logger.info('联想应用', `已应用推荐「${text}」`);
            }
        } else {
            const input = document.getElementById('scriptInput');
            if (input) {
                const current = input.value.trim();
                input.value = current + (current ? '\n' : '') + `[参考: ${text}]`;
                input.focus();
                Logger.info('联想应用', `已应用推荐「${text}」`);
            }
        }
    },

    // ========== 应用识别结果到剧本 ==========
    applyToScript() {
        const cache = this.recognitionCache.gen;
        if (!cache) {
            Logger.warn('应用失败', '没有可用的识别结果');
            return;
        }

        const input = document.getElementById('scriptInput');
        if (!input) return;

        let appendText = '\n\n--- 来自文件识别 ---\n';

        if (cache.sceneDescription) {
            appendText += cache.sceneDescription + '\n\n';
        }

        if (cache.keywords && cache.keywords.length > 0) {
            appendText += `[关键词: ${cache.keywords.join(', ')}]\n`;
        }

        if (cache.extractedText) {
            const preview = cache.extractedText.substring(0, 200);
            appendText += `[参考文本]: ${preview}...\n`;
        }

        input.value += appendText;
        input.focus();
        Logger.success('识别应用', '已将识别结果应用到剧本输入');
    },

    // ========== 清除识别结果 ==========
    clearRecognition(target) {
        const resultEl = document.getElementById(target === 'quick' ? 'quickRecognitionResult' : 'genRecognitionResult');
        if (resultEl) {
            resultEl.style.display = 'none';
        }
        this.recognitionCache[target] = null;
        Logger.info('识别清除', '已清除识别结果');
    },

    // ========== HTML转义 ==========
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

/* ================================================
   20. IntegrationManager - 外部连接管理
   ================================================ */
const IntegrationManager = {
    // 预置平台列表
    presetPlatforms: [
        // AI绘图
        { id: 'midjourney', name: 'Midjourney', category: 'ai-draw', icon: '🎨', color: '#7289DA',
          desc: '强大的AI图像生成平台，通过Discord接口生成分镜画面',
          url: 'https://discord.com/api/v1', authType: 'bearer',
          features: ['文生图', '风格迁移', '图像变体', ' upscale放大'],
          connected: false },
        { id: 'stable-diffusion', name: 'Stable Diffusion', category: 'ai-draw', icon: '🤖', color: '#FF6B35',
          desc: '开源AI绘画模型，支持本地部署和API调用',
          url: 'http://127.0.0.1:7860/api/v1', authType: 'none',
          features: ['文生图', '图生图', 'ControlNet', 'LoRA加载'],
          connected: false },
        { id: 'dalle3', name: 'DALL·E 3', category: 'ai-draw', icon: '🖼️', color: '#10A37F',
          desc: 'OpenAI的图像生成模型，理解复杂提示词',
          url: 'https://api.openai.com/v1/images/generations', authType: 'bearer',
          features: ['高质量生成', '长文本理解', '多分辨率', '风格预设'],
          connected: false },
        { id: 'comfyui', name: 'ComfyUI', category: 'ai-draw', icon: '⚙️', color: '#9B59B6',
          desc: '节点式AI绘画工作流引擎，灵活组合生成流程',
          url: 'http://127.0.0.1:8188/api', authType: 'none',
          features: ['节点工作流', '自定义模型', '批量生成', 'API调用'],
          connected: false },
        { id: 'niji-journey', name: 'Niji Journey', category: 'ai-draw', icon: '🌸', color: '#FF69B4',
          desc: '专注于二次元/动漫风格的AI绘画平台',
          url: 'https://discord.com/api/v1', authType: 'bearer',
          features: ['二次元风格', '动漫角色', '插画生成', '风格多样'],
          connected: false },

        // 漫画平台
        { id: 'pixiv', name: 'Pixiv', category: 'comic-platform', icon: '📚', color: '#0096FA',
          desc: '全球最大插画分享社区，获取灵感和参考素材',
          url: 'https://app-api.pixiv.net/v1', authType: 'bearer',
          features: ['作品参考', '热门排行', '作者关注', '标签搜索'],
          connected: false },
        { id: 'kuaikan', name: '快看漫画', category: 'comic-platform', icon: '📖', color: '#FF4757',
          desc: '国产漫画平台，支持分镜作品发布',
          url: 'https://api.kuaikan.com/v1', authType: 'api-key',
          features: ['作品发布', '数据分析', '读者互动', '创作工具'],
          connected: false },
        { id: 'bilibili-comic', name: '哔哩哔哩漫画', category: 'comic-platform', icon: '🎬', color: '#FB7299',
          desc: 'B站漫画创作平台，支持投稿和社区互动',
          url: 'https://api.bilibili.com/v1', authType: 'oauth',
          features: ['漫画投稿', '社区互动', '创作激励', '数据分析'],
          connected: false },
        { id: 'tencent-comic', name: '腾讯动漫', category: 'comic-platform', icon: '🐉', color: '#12B7F5',
          desc: '腾讯旗下动漫平台，支持原创作品发布',
          url: 'https://api.ac.qq.com/v1', authType: 'oauth',
          features: ['原创投稿', '签约机会', '读者数据', '创作辅助'],
          connected: false },

        // 云存储
        { id: 'oss-aliyun', name: '阿里云OSS', category: 'cloud-storage', icon: '☁️', color: '#FF6A00',
          desc: '阿里云对象存储，存储分镜图片和项目文件',
          url: 'https://oss-cn-hangzhou.aliyuncs.com', authType: 'api-key',
          features: ['大文件存储', 'CDN加速', '自动备份', '权限管理'],
          connected: false },
        { id: 'oss-tencent', name: '腾讯云COS', category: 'cloud-storage', icon: '🌩️', color: '#00A4FF',
          desc: '腾讯云对象存储，支持分镜素材云端同步',
          url: 'https://cos.ap-guangzhou.myqcloud.com', authType: 'api-key',
          features: ['云端同步', '多端访问', '版本控制', '数据加密'],
          connected: false },
        { id: 'github', name: 'GitHub', category: 'cloud-storage', icon: '🐙', color: '#181717',
          desc: '代码托管平台，可存储项目配置和版本管理',
          url: 'https://api.github.com/v3', authType: 'bearer',
          features: ['版本管理', '团队协作', 'Actions自动化', 'Pages部署'],
          connected: false },
        { id: 'onedrive', name: 'OneDrive', category: 'cloud-storage', icon: '📁', color: '#0078D4',
          desc: '微软云存储，支持跨设备文件同步',
          url: 'https://graph.microsoft.com/v1.0', authType: 'oauth',
          features: ['跨设备同步', '大容量存储', 'Office集成', '分享协作'],
          connected: false },

        // 社交平台
        { id: 'discord', name: 'Discord', category: 'social', icon: '💬', color: '#5865F2',
          desc: '社区聊天平台，可推送分镜生成通知',
          url: 'https://discord.com/api/v1', authType: 'bearer',
          features: ['Webhook通知', 'Bot机器人', '社区互动', '文件分享'],
          connected: false },
        { id: 'feishu', name: '飞书', category: 'social', icon: '🐦', color: '#3370FF',
          desc: '字节协作平台，支持团队创作协作',
          url: 'https://open.feishu.cn/open-apis', authType: 'bearer',
          features: ['消息推送', '文档协作', '日历提醒', '机器人通知'],
          connected: false },
        { id: 'wechat-work', name: '企业微信', category: 'social', icon: '💬', color: '#07C160',
          desc: '企业微信机器人，推送创作进度通知',
          url: 'https://qyapi.weixin.qq.com/cgi-bin', authType: 'api-key',
          features: ['群消息推送', '应用消息', '审批流程', '数据统计'],
          connected: false },
        { id: 'xiaohongshu', name: '小红书', category: 'social', icon: '📕', color: '#FE2C55',
          desc: '内容分享平台，分享分镜作品获取灵感',
          url: 'https://api.xiaohongshu.com/v1', authType: 'oauth',
          features: ['作品分享', '话题互动', '灵感获取', '数据反馈'],
          connected: false },

        // 工具软件
        { id: 'photoshop', name: 'Adobe Photoshop', category: 'tool', icon: '🖌️', color: '#31A8FF',
          desc: '专业图像编辑软件，通过插件接口连接',
          url: 'http://localhost:8080/api', authType: 'none',
          features: ['图像编辑', '批量处理', '滤镜效果', '脚本自动化'],
          connected: false },
        { id: 'clip-studio', name: 'CLIP STUDIO', category: 'tool', icon: '✏️', color: '#FF7F00',
          desc: '专业漫画创作软件，支持分镜页面导出',
          url: 'http://localhost:8081/api', authType: 'none',
          features: ['漫画分镜', '网点素材', '笔刷工具', '页面导出'],
          connected: false },
        { id: 'figma', name: 'Figma', category: 'tool', icon: '🎯', color: '#F24E1E',
          desc: '设计协作平台，可设计分镜排版模板',
          url: 'https://api.figma.com/v1', authType: 'bearer',
          features: ['设计模板', '团队协作', '自动布局', '插件扩展'],
          connected: false },
        { id: 'vscode', name: 'VS Code', category: 'tool', icon: '💻', color: '#007ACC',
          desc: '代码编辑器，可编辑分镜JSON配置和脚本',
          url: 'http://localhost:9222', authType: 'none',
          features: ['JSON编辑', '脚本编写', '插件扩展', '终端集成'],
          connected: false },

        // Webhook
        { id: 'zapier', name: 'Zapier', category: 'webhook', icon: '⚡', color: '#FF4A00',
          desc: '自动化工作流平台，连接各种应用',
          url: 'https://hooks.zapier.com/hooks/catch', authType: 'none',
          features: ['应用集成', '自动触发', '条件过滤', '多步流程'],
          connected: false },
        { id: 'ifttt', name: 'IFTTT', category: 'webhook', icon: '🔗', color: '#000000',
          desc: '条件触发自动化平台',
          url: 'https://maker.ifttt.com/trigger', authType: 'api-key',
          features: ['条件触发', '多平台', '简单易用', '定时任务'],
          connected: false },
        { id: 'n8n', name: 'n8n', category: 'webhook', icon: '🔄', color: '#FF6D5A',
          desc: '开源自动化工作流引擎，可自部署',
          url: 'http://localhost:5678/api/v1', authType: 'api-key',
          features: ['可视化流程', '自定义节点', '自部署', 'API集成'],
          connected: false }
    ],

    // 自定义连接列表
    customIntegrations: [],
    // Webhook列表
    webhooks: [],
    // 当前筛选分类
    currentCategory: 'all',
    // 搜索关键词
    searchKeyword: '',

    init() {
        this.loadFromStorage();
        this.bindEvents();
        this.renderPlatforms();
        this.renderWebhooks();
        this.updateStats();
    },

    // ========== 事件绑定 ==========
    bindEvents() {
        // 分类筛选
        document.querySelectorAll('.integration-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.integration-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentCategory = tab.dataset.integCategory;
                this.renderPlatforms();
            });
        });

        // 搜索
        const searchInput = document.getElementById('integrationSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchKeyword = e.target.value.toLowerCase().trim();
                this.renderPlatforms();
            });
        }

        // 添加连接按钮（滚动到自定义表单）
        const addBtn = document.getElementById('addIntegrationBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const form = document.querySelector('.custom-integration-form');
                if (form) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const nameInput = document.getElementById('customIntegName');
                    if (nameInput) nameInput.focus();
                }
            });
        }

        // 刷新状态
        const refreshBtn = document.getElementById('refreshIntegrationsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAllStatus());
        }

        // 保存自定义连接
        const saveBtn = document.getElementById('saveCustomIntegrationBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveCustomIntegration());
        }

        // 测试连接
        const testBtn = document.getElementById('testCustomIntegrationBtn');
        if (testBtn) {
            testBtn.addEventListener('click', () => this.testCustomConnection());
        }

        // 导出配置
        const exportBtn = document.getElementById('exportIntegrationsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportConfig());
        }

        // 导入配置
        const importBtn = document.getElementById('importIntegrationsBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importConfig());
        }

        // 添加Webhook
        const addWebhookBtn = document.getElementById('addWebhookBtn');
        if (addWebhookBtn) {
            addWebhookBtn.addEventListener('click', () => this.addWebhook());
        }
    },

    // ========== 渲染平台卡片 ==========
    renderPlatforms() {
        const grid = document.getElementById('integrationGrid');
        if (!grid) return;

        // 合并预置和自定义平台
        const allPlatforms = [...this.presetPlatforms, ...this.customIntegrations];

        // 筛选
        let filtered = allPlatforms.filter(p => {
            const categoryMatch = this.currentCategory === 'all' || p.category === this.currentCategory;
            const searchMatch = !this.searchKeyword ||
                p.name.toLowerCase().includes(this.searchKeyword) ||
                p.desc.toLowerCase().includes(this.searchKeyword) ||
                (p.features && p.features.some(f => f.toLowerCase().includes(this.searchKeyword)));
            return categoryMatch && searchMatch;
        });

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-muted);">
                    <div style="font-size:40px;margin-bottom:8px;">🔍</div>
                    <div>没有找到匹配的连接</div>
                    <div style="font-size:12px;margin-top:4px;">尝试其他关键词或添加自定义连接</div>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(p => {
            const categoryLabels = {
                'ai-draw': 'AI绘图', 'comic-platform': '漫画平台',
                'cloud-storage': '云存储', 'social': '社交平台',
                'tool': '工具软件', 'webhook': 'Webhook'
            };
            const statusClass = p.connected ? 'connected' : 'disconnected';
            const statusText = p.connected ? '已连接' : '未连接';
            const isCustom = p.custom === true;

            return `
                <div class="integration-card" style="--card-accent:${p.color};" data-platform-id="${p.id}">
                    <div class="integration-card-header">
                        <div class="integration-card-icon" style="background:${p.color}20;color:${p.color};">
                            ${p.icon}
                        </div>
                        <div class="integration-card-info">
                            <div class="integration-card-name">
                                ${p.name}
                                ${isCustom ? '<span class="badge badge-primary" style="font-size:10px;">自定义</span>' : ''}
                            </div>
                            <div class="integration-card-desc">${p.desc}</div>
                        </div>
                    </div>
                    <div class="integration-card-status ${statusClass}">
                        <span class="status-dot"></span> ${statusText}
                    </div>
                    <div class="integration-card-meta">
                        <span>📂 ${categoryLabels[p.category] || '其他'}</span>
                        <span>🔐 ${this.getAuthLabel(p.authType)}</span>
                        <span>⚡ ${p.features ? p.features.length : 0}项功能</span>
                    </div>
                    ${p.features ? `
                        <div style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:4px;">
                            ${p.features.map(f => `<span class="recognition-tag" style="font-size:10px;padding:2px 8px;">${f}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="integration-card-actions">
                        ${p.connected ? `
                            <button class="btn btn-ghost btn-sm" onclick="IntegrationManager.disconnect('${p.id}')">
                                <span>⏸️</span> 断开
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="IntegrationManager.openPlatform('${p.id}')">
                                <span>🔗</span> 打开
                            </button>
                        ` : `
                            <button class="btn btn-primary btn-sm" onclick="IntegrationManager.connect('${p.id}')">
                                <span>🔌</span> 连接
                            </button>
                            ${isCustom ? `
                                <button class="btn btn-ghost btn-sm" onclick="IntegrationManager.editCustom('${p.id}')">
                                    <span>✏️</span> 编辑
                                </button>
                                <button class="btn btn-ghost btn-sm" onclick="IntegrationManager.deleteCustom('${p.id}')">
                                    <span>🗑️</span>
                                </button>
                            ` : `
                                <button class="btn btn-ghost btn-sm" onclick="IntegrationManager.viewDetails('${p.id}')">
                                    <span>ℹ️</span> 详情
                                </button>
                            `}
                        `}
                    </div>
                </div>
            `;
        }).join('');
    },

    // ========== 获取认证方式标签 ==========
    getAuthLabel(authType) {
        const labels = {
            'none': '无认证', 'bearer': 'Bearer Token',
            'api-key': 'API Key', 'basic': 'Basic Auth', 'oauth': 'OAuth 2.0'
        };
        return labels[authType] || '未知';
    },

    // ========== 连接平台 ==========
    connect(platformId) {
        const platform = [...this.presetPlatforms, ...this.customIntegrations].find(p => p.id === platformId);
        if (!platform) return;

        // 显示连接中状态
        Logger.info('外部连接', `正在连接「${platform.name}」...`);

        // 更新UI为connecting状态
        const card = document.querySelector(`[data-platform-id="${platformId}"] .integration-card-status`);
        if (card) {
            card.className = 'integration-card-status connecting';
            card.innerHTML = '<span class="status-dot"></span> 连接中...';
        }

        // 模拟连接过程
        setTimeout(() => {
            platform.connected = true;
            this.renderPlatforms();
            this.updateStats();
            this.saveToStorage();
            Logger.success('外部连接', `「${platform.name}」连接成功！`);
            Toast.show(`「${platform.name}」已连接`, 'success');
        }, 1500);
    },

    // ========== 断开连接 ==========
    disconnect(platformId) {
        const platform = [...this.presetPlatforms, ...this.customIntegrations].find(p => p.id === platformId);
        if (!platform) return;

        platform.connected = false;
        this.renderPlatforms();
        this.updateStats();
        this.saveToStorage();
        Logger.info('外部连接', `已断开「${platform.name}」`);
        Toast.show(`已断开「${platform.name}」`, 'info');
    },

    // ========== 打开平台 ==========
    openPlatform(platformId) {
        const platform = [...this.presetPlatforms, ...this.customIntegrations].find(p => p.id === platformId);
        if (!platform) return;

        // 提取域名打开
        let openUrl = platform.url;
        if (openUrl.includes('discord.com')) openUrl = 'https://discord.com';
        else if (openUrl.includes('openai.com')) openUrl = 'https://platform.openai.com';
        else if (openUrl.includes('github.com')) openUrl = 'https://github.com';
        else if (openUrl.includes('figma.com')) openUrl = 'https://www.figma.com';
        else if (openUrl.includes('pixiv.net')) openUrl = 'https://www.pixiv.net';
        else if (openUrl.includes('graph.microsoft.com')) openUrl = 'https://onedrive.live.com';
        else if (openUrl.includes('feishu.cn')) openUrl = 'https://www.feishu.cn';
        else if (openUrl.includes('qyapi.weixin.qq.com')) openUrl = 'https://work.weixin.qq.com';

        Logger.info('外部连接', `正在打开「${platform.name}」: ${openUrl}`);
        Toast.show(`正在打开「${platform.name}」`, 'info');
        window.open(openUrl, '_blank');
    },

    // ========== 查看详情 ==========
    viewDetails(platformId) {
        const platform = [...this.presetPlatforms, ...this.customIntegrations].find(p => p.id === platformId);
        if (!platform) return;

        const categoryLabels = {
            'ai-draw': 'AI绘图', 'comic-platform': '漫画平台',
            'cloud-storage': '云存储', 'social': '社交平台',
            'tool': '工具软件', 'webhook': 'Webhook'
        };

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;';
        modal.innerHTML = `
            <div style="background:var(--bg-card);border-radius:var(--radius-lg);padding:32px;max-width:500px;width:90%;border:1px solid var(--border-color);">
                <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
                    <div style="width:56px;height:56px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:28px;background:${platform.color}20;color:${platform.color};">
                        ${platform.icon}
                    </div>
                    <div>
                        <h3 style="margin:0;font-size:20px;color:var(--text-primary);">${platform.name}</h3>
                        <div style="font-size:12px;color:var(--text-muted);">${categoryLabels[platform.category]}</div>
                    </div>
                </div>
                <p style="color:var(--text-secondary);font-size:14px;line-height:1.6;margin-bottom:16px;">${platform.desc}</p>
                <div style="background:var(--bg-tertiary);border-radius:var(--radius-md);padding:12px 16px;margin-bottom:16px;">
                    <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">API地址</div>
                    <div style="font-size:13px;color:var(--text-primary);font-family:monospace;word-break:break-all;">${platform.url}</div>
                </div>
                <div style="margin-bottom:16px;">
                    <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">功能特性</div>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;">
                        ${platform.features.map(f => `<span class="recognition-tag" style="font-size:11px;">${f}</span>`).join('')}
                    </div>
                </div>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                    <button class="btn btn-primary" onclick="IntegrationManager.connect('${platform.id}');this.closest('.modal-overlay').remove();">
                        🔌 连接
                    </button>
                </div>
            </div>
        `;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        document.body.appendChild(modal);
    },

    // ========== 保存自定义连接 ==========
    saveCustomIntegration() {
        const name = document.getElementById('customIntegName').value.trim();
        const type = document.getElementById('customIntegType').value;
        const url = document.getElementById('customIntegUrl').value.trim();
        const key = document.getElementById('customIntegKey').value.trim();
        const auth = document.getElementById('customIntegAuth').value;
        const desc = document.getElementById('customIntegDesc').value.trim();

        if (!name) {
            Toast.show('请输入连接名称', 'warning');
            return;
        }
        if (!url) {
            Toast.show('请输入API地址', 'warning');
            return;
        }

        const categoryIcons = {
            'ai-draw': '🎨', 'comic-platform': '📚', 'cloud-storage': '☁️',
            'social': '💬', 'tool': '🛠️', 'webhook': '🔗'
        };
        const categoryColors = {
            'ai-draw': '#FF6B35', 'comic-platform': '#FF4757', 'cloud-storage': '#00A4FF',
            'social': '#5865F2', 'tool': '#007ACC', 'webhook': '#FF4A00'
        };

        const integration = {
            id: 'custom-' + Date.now(),
            name,
            category: type,
            icon: categoryIcons[type] || '🔌',
            color: categoryColors[type] || '#7289DA',
            desc: desc || '自定义外部连接',
            url,
            authType: auth,
            apiKey: key,
            features: ['自定义功能'],
            connected: false,
            custom: true
        };

        this.customIntegrations.push(integration);
        this.saveToStorage();
        this.renderPlatforms();
        this.updateStats();

        // 清空表单
        document.getElementById('customIntegName').value = '';
        document.getElementById('customIntegUrl').value = '';
        document.getElementById('customIntegKey').value = '';
        document.getElementById('customIntegDesc').value = '';

        Logger.success('外部连接', `自定义连接「${name}」已保存`);
        Toast.show(`自定义连接「${name}」已保存`, 'success');
    },

    // ========== 测试自定义连接 ==========
    testCustomConnection() {
        const url = document.getElementById('customIntegUrl').value.trim();
        if (!url) {
            Toast.show('请先输入API地址', 'warning');
            return;
        }

        Toast.show('正在测试连接...', 'info');
        Logger.info('外部连接', `正在测试连接: ${url}`);

        setTimeout(() => {
            // 模拟测试结果
            const success = Math.random() > 0.3;
            if (success) {
                Toast.show('连接测试成功！', 'success');
                Logger.success('外部连接', `连接测试成功: ${url}`);
            } else {
                Toast.show('连接测试失败，请检查地址和密钥', 'error');
                Logger.error('外部连接', `连接测试失败: ${url}`);
            }
        }, 1500);
    },

    // ========== 编辑自定义连接 ==========
    editCustom(id) {
        const integ = this.customIntegrations.find(i => i.id === id);
        if (!integ) return;

        document.getElementById('customIntegName').value = integ.name;
        document.getElementById('customIntegType').value = integ.category;
        document.getElementById('customIntegUrl').value = integ.url;
        document.getElementById('customIntegKey').value = integ.apiKey || '';
        document.getElementById('customIntegAuth').value = integ.authType;
        document.getElementById('customIntegDesc').value = integ.desc;

        // 删除旧的，保存时创建新的
        this.customIntegrations = this.customIntegrations.filter(i => i.id !== id);
        this.renderPlatforms();

        const form = document.querySelector('.custom-integration-form');
        if (form) form.scrollIntoView({ behavior: 'smooth' });

        Toast.show('已加载连接信息，修改后点击保存', 'info');
    },

    // ========== 删除自定义连接 ==========
    deleteCustom(id) {
        this.customIntegrations = this.customIntegrations.filter(i => i.id !== id);
        this.saveToStorage();
        this.renderPlatforms();
        this.updateStats();
        Logger.info('外部连接', '已删除自定义连接');
        Toast.show('已删除', 'info');
    },

    // ========== 刷新所有状态 ==========
    refreshAllStatus() {
        Toast.show('正在刷新连接状态...', 'info');
        const connected = [...this.presetPlatforms, ...this.customIntegrations].filter(p => p.connected);

        setTimeout(() => {
            Logger.success('外部连接', `状态刷新完成，${connected.length}个平台处于连接状态`);
            Toast.show(`已刷新，${connected.length}个平台已连接`, 'success');
            this.renderPlatforms();
        }, 1000);
    },

    // ========== Webhook管理 ==========
    addWebhook() {
        const name = `Webhook ${this.webhooks.length + 1}`;
        const webhook = {
            id: 'wh-' + Date.now(),
            name,
            url: 'https://hooks.example.com/webhook',
            events: ['生成完成', '保存项目'],
            active: true
        };
        this.webhooks.push(webhook);
        this.saveToStorage();
        this.renderWebhooks();
        Logger.info('外部连接', `已添加Webhook: ${name}`);
        Toast.show(`Webhook已添加`, 'success');
    },

    renderWebhooks() {
        const list = document.getElementById('webhookList');
        if (!list) return;

        if (this.webhooks.length === 0) {
            list.innerHTML = `
                <div class="webhook-empty">
                    <div style="font-size:32px;margin-bottom:8px;">🔗</div>
                    <div>暂无Webhook</div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">添加Webhook实现分镜生成完成后自动推送通知</div>
                </div>
            `;
            return;
        }

        list.innerHTML = this.webhooks.map(wh => `
            <div class="webhook-item">
                <div class="webhook-icon">🔗</div>
                <div class="webhook-info">
                    <div class="webhook-name">${wh.name}</div>
                    <div class="webhook-url">${wh.url}</div>
                </div>
                <div class="webhook-events">
                    ${wh.events.map(e => `<span class="webhook-event-tag">${e}</span>`).join('')}
                </div>
                <div class="webhook-toggle ${wh.active ? 'active' : ''}" onclick="IntegrationManager.toggleWebhook('${wh.id}')"></div>
                <button class="upload-file-remove" onclick="IntegrationManager.deleteWebhook('${wh.id}')">✕</button>
            </div>
        `).join('');
    },

    toggleWebhook(id) {
        const wh = this.webhooks.find(w => w.id === id);
        if (wh) {
            wh.active = !wh.active;
            this.saveToStorage();
            this.renderWebhooks();
            Logger.info('外部连接', `Webhook「${wh.name}」已${wh.active ? '启用' : '禁用'}`);
        }
    },

    deleteWebhook(id) {
        this.webhooks = this.webhooks.filter(w => w.id !== id);
        this.saveToStorage();
        this.renderWebhooks();
        Toast.show('Webhook已删除', 'info');
    },

    // ========== 导出/导入配置 ==========
    exportConfig() {
        const config = {
            customIntegrations: this.customIntegrations,
            webhooks: this.webhooks,
            connectedPlatforms: [...this.presetPlatforms, ...this.customIntegrations]
                .filter(p => p.connected)
                .map(p => p.id)
        };
        const json = JSON.stringify(config, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `integrations-config-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Logger.success('外部连接', '配置已导出');
        Toast.show('配置已导出', 'success');
    },

    importConfig() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const config = JSON.parse(ev.target.result);
                    if (config.customIntegrations) {
                        this.customIntegrations = config.customIntegrations;
                    }
                    if (config.webhooks) {
                        this.webhooks = config.webhooks;
                    }
                    if (config.connectedPlatforms) {
                        config.connectedPlatforms.forEach(id => {
                            const p = this.presetPlatforms.find(pp => pp.id === id);
                            if (p) p.connected = true;
                        });
                    }
                    this.saveToStorage();
                    this.renderPlatforms();
                    this.renderWebhooks();
                    this.updateStats();
                    Logger.success('外部连接', '配置已导入');
                    Toast.show('配置已导入', 'success');
                } catch (err) {
                    Toast.show('导入失败：文件格式错误', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    // ========== 更新统计 ==========
    updateStats() {
        const all = [...this.presetPlatforms, ...this.customIntegrations];
        const total = all.length;
        const active = all.filter(p => p.connected).length;
        const inactive = total - active;
        const categories = new Set(all.map(p => p.category));

        document.getElementById('integTotalCount').textContent = total;
        document.getElementById('integActiveCount').textContent = active;
        document.getElementById('integInactiveCount').textContent = inactive;
        document.getElementById('integCategoryCount').textContent = categories.size;
    },

    // ========== 本地存储 ==========
    saveToStorage() {
        try {
            localStorage.setItem('ai_comic_integrations', JSON.stringify({
                customIntegrations: this.customIntegrations,
                webhooks: this.webhooks,
                connectedPlatforms: this.presetPlatforms.filter(p => p.connected).map(p => p.id)
            }));
        } catch (e) {
            Logger.error('外部连接', '保存配置失败');
        }
    },

    loadFromStorage() {
        try {
            const data = localStorage.getItem('ai_comic_integrations');
            if (data) {
                const config = JSON.parse(data);
                this.customIntegrations = config.customIntegrations || [];
                this.webhooks = config.webhooks || [];
                if (config.connectedPlatforms) {
                    config.connectedPlatforms.forEach(id => {
                        const p = this.presetPlatforms.find(pp => pp.id === id);
                        if (p) p.connected = true;
                    });
                }
            }
        } catch (e) {
            Logger.error('外部连接', '加载配置失败');
        }
    }
};

/* ================================================
   21. 应用初始化
   ================================================ */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 AI漫剧分镜生成器 正在初始化...');

    AppState.init();
    Logger.init();
    ThemeManager.init();
    NavManager.init();
    ProjectManager.init();
    TemplateManager.init();
    DashboardTabManager.init();
    GeneratorManager.init();
    StoryboardManager.init();
    CharacterManager.init();
    SceneManager.init();
    WorkflowEditor.init();
    AssetManager.init();
    SettingsManager.init();
    HelpManager.init();
    AIAssistant.init();
    HistoryManager.init();
    KeyboardShortcuts.init();
    SkillManager.init();
    FileRecognitionManager.init();
    IntegrationManager.init();

    const currentTab = AppState.get('currentTab') || 'dashboard';
    NavManager.switchTab(currentTab);

    const newProjectBtn = document.getElementById('newProjectBtn');
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', () => {
            const name = prompt('请输入项目名称：', '未命名项目');
            if (name) {
                ProjectManager.createProject(name, '', '国漫');
            }
        });
    }

    const importProjectBtn = document.getElementById('importProjectBtn');
    if (importProjectBtn) {
        importProjectBtn.addEventListener('click', () => {
            alert('导入功能开发中...');
        });
    }

    const loadScriptBtn = document.getElementById('loadScriptBtn');
    if (loadScriptBtn) {
        loadScriptBtn.addEventListener('click', () => {
            const sample = `【雨夜街道 - 外景 - 夜】
[全景镜头]
雨水冲刷着昏暗的街道，霓虹灯在水洼中折射出斑斓的光影。

林小雨：（喘着气，回头看）
不行，必须甩掉他们...

[近景镜头]
林小雨的特写，雨水顺着她的脸颊流下，眼神中带着坚定。

陈默：（从拐角处走出）
别跑了，跟我走。

[中景镜头]
两人对视，雨声渐大，气氛紧张而微妙。`;
            const input = document.getElementById('scriptInput');
            if (input) {
                input.value = sample;
                Logger.info('加载剧本', '已加载示例剧本');
            }
        });
    }

    const clearScriptBtn = document.getElementById('clearScriptBtn');
    if (clearScriptBtn) {
        clearScriptBtn.addEventListener('click', () => {
            const input = document.getElementById('scriptInput');
            if (input) {
                input.value = '';
                Logger.info('清空剧本', '剧本内容已清空');
            }
        });
    }

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            alert('导出功能开发中...');
        });
    }

    const batchGenCharBtn = document.getElementById('batchGenCharBtn');
    if (batchGenCharBtn) {
        batchGenCharBtn.addEventListener('click', () => {
            Logger.generate('批量生成角色', '正在批量生成角色...');
            setTimeout(() => {
                Logger.success('批量生成', '成功生成3个新角色');
            }, 1500);
        });
    }

    const importCharacterBtn = document.getElementById('importCharacterBtn');
    if (importCharacterBtn) importCharacterBtn.addEventListener('click', () => alert('导入功能开发中...'));
    const exportCharacterBtn = document.getElementById('exportCharacterBtn');
    if (exportCharacterBtn) exportCharacterBtn.addEventListener('click', () => alert('导出功能开发中...'));

    const importSceneBtn = document.getElementById('importSceneBtn');
    if (importSceneBtn) importSceneBtn.addEventListener('click', () => alert('导入功能开发中...'));
    const aiGenSceneBtn = document.getElementById('aiGenSceneBtn');
    if (aiGenSceneBtn) {
        aiGenSceneBtn.addEventListener('click', () => {
            const desc = prompt('请描述要生成的场景：');
            if (desc) {
                Logger.generate('AI生成场景', `正在生成：${desc}`);
                setTimeout(() => {
                    const newScene = {
                        id: 'scene-' + Date.now(),
                        name: desc.slice(0, 8),
                        category: '室外',
                        time: 'day',
                        icon: '🏞️',
                        desc: desc
                    };
                    SceneManager.scenes.unshift(newScene);
                    SceneManager.save();
                    SceneManager.render();
                    Logger.success('场景生成', `成功生成场景「${newScene.name}」`);
                }, 1500);
            }
        });
    }

    const newFolderBtn = document.getElementById('newFolderBtn');
    if (newFolderBtn) newFolderBtn.addEventListener('click', () => alert('新建文件夹功能开发中...'));

    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                Logger.info('全局搜索', `搜索：${globalSearch.value}`);
            }
        });
    }

    console.log('✅ AI漫剧分镜生成器 初始化完成！');
    console.log('📋 快捷键：Ctrl+K 搜索 | Ctrl+Enter 生成 | Ctrl+T 切换主题 | Ctrl+/ AI助手 | Ctrl+H 历史 | Ctrl+S 保存');

    // ===== 自动填入「咕咕嘎嘎·雨归」提示词并生成 =====
    const guguScript = `【咕咕嘎嘎·雨归】

[全景镜头 - 俯视]
雨幕中的街道全景俯瞰，灰蓝色的天空下着细密的中雨。街道两旁是低矮的民居和小商店，暖黄色的路灯在雨中晕开光圈。画面中央，一个Q版小人独自撑着一把透明雨伞，走在湿漉漉的人行道上。地面水洼反射着路灯光芒，形成一片片暖黄色的光斑。整体氛围孤独但温馨。

[中景镜头 - 平视跟拍]
主角Q版小人侧身行走的中景，透明雨伞上雨滴弹跳飞溅。小人穿着连帽卫衣和雨靴，背着书包，低着头慢慢走。雨伞上的水珠汇聚成流滑落。旁边经过的店铺橱窗透出暖光，映在小人脸上。小人的表情呆萌，嘴巴微张，像在自言自语"咕咕嘎嘎..."。

[近景特写 - 正面]
主角的正面面部特写，雨伞遮住大半头顶，露出呆萌的脸。眼睛半睁半闭，像在发呆又像在走神，嘴角微微下垂又带着一丝傻笑。头顶上方浮现一个思考气泡，里面画着"咕咕嘎嘎"几个字，字迹歪歪扭扭。雨滴在伞边形成珠帘效果，背景虚化。

[俯视特写 - 脚部]
俯视角度拍摄脚部特写，一双可爱的雨靴踩进水洼，水花四溅。靴子上有小鸭子图案。水洼中倒映出路灯和小人的身影。雨滴打在水洼上形成一圈圈涟漪。画面构图采用对角线，增强行走的前进感。

[仰视镜头 - 低角度]
从地面仰拍，小人的透明雨伞占满画面上半部分，雨滴打在伞面上弹跳。透过透明伞可以看到灰蓝色的雨幕天空。小人低头向下看的脸出现在伞沿下方，表情有些疲惫但嘴角挂着呆萌的微笑。路灯的光从侧面打过来，在脸上形成暖冷光交界。

[远景镜头 - 缓慢拉远]
画面拉远，小人走到了一栋小房子前，房门亮着暖黄色的光。小人收起雨伞，回头看了看身后的雨幕街道，脸上露出满足的微笑。身后是长长的湿漉漉的街道，路灯连成一串光带。画面上方浮现文字"咕咕嘎嘎...到家啦~"。整体色调从冷蓝过渡到暖黄，象征从孤独到温暖。

[关键词: 咕咕嘎嘎, 雨天, 一个人, 打伞, 回家, 治愈, 孤独, 呆萌, 氛围感, 水洼倒影, 路灯, 雨滴, Q版, 日系, 冷暖对比]`;

    // 切换到工作台-快速生成面板
    NavManager.switchTab('dashboard');
    DashboardTabManager.switchTab('quick');

    // 填入剧本
    const quickScriptInput = document.getElementById('quickScript');
    if (quickScriptInput) {
        quickScriptInput.value = guguScript;
    }

    // 设置参数
    const quickStyle = document.getElementById('quickStyle');
    if (quickStyle) quickStyle.value = '日系';
    const quickCount = document.getElementById('quickCount');
    if (quickCount) quickCount.value = '6';
    const quickRatio = document.getElementById('quickRatio');
    if (quickRatio) quickRatio.value = '16:9';
    const quickQuality = document.getElementById('quickQuality');
    if (quickQuality) quickQuality.value = 'high';

    Logger.info('咕咕嘎嘎·雨归', '已自动填入提示词，即将开始生成分镜...');

    // 延迟触发生成
    setTimeout(() => {
        DashboardTabManager.quickGenerate();
    }, 800);
});
