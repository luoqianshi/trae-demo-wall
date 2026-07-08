/**
 * 声纹智转 - 路由系统
 */

const Router = {
    routes: {
        'showcase': { name: '产品价值', icon: 'sparkles', module: 'Showcase' },
        'realtime': { name: '实时转写', icon: 'mic', module: 'Realtime' },
        'offline': { name: '离线转写', icon: 'upload', module: 'Offline' },
        'summary': { name: '智能摘要', icon: 'file-text', module: 'Summary' },
        'qa': { name: 'AI问答', icon: 'message-circle', module: 'QA' },
        'history': { name: '历史记录', icon: 'clock', module: 'History' },
        'notes': { name: '标记笔记', icon: 'bookmark', module: 'Notes' },
        'tasks': { name: '待办管理', icon: 'check-square', module: 'Tasks' },
        'speakers': { name: '说话人', icon: 'users', module: 'Speakers' },
        'translate': { name: '翻译中心', icon: 'languages', module: 'Translate' },
        'team': { name: '团队协作', icon: 'user-plus', module: 'Team' },
        'templates': { name: '模板中心', icon: 'layout', module: 'Templates' },
        'export': { name: '导出集成', icon: 'download', module: 'Export' },
        'plugins': { name: '插件扩展', icon: 'puzzle', module: 'Plugins' },
        'dashboard': { name: '数据看板', icon: 'bar-chart-2', module: 'Dashboard' },
        'settings': { name: '系统设置', icon: 'settings', module: 'Settings' }
    },

    currentRoute: 'showcase',

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    },

    handleRoute() {
        const hash = window.location.hash.replace('#/', '') || 'showcase';
        const route = this.routes[hash];
        
        if (!route) {
            this.navigate('showcase');
            return;
        }

        this.currentRoute = hash;
        this.renderPage(route);
        this.updateSidebarActive();
        this.updateHeader(route);
    },

    renderPage(route) {
        const content = document.getElementById('content');
        const moduleName = route.module;
        // 模块可能以 Module 后缀导出
        const moduleObj = window[moduleName + 'Module'] || window[moduleName];
        
        // 检查模块是否存在
        if (moduleObj && typeof moduleObj.render === 'function') {
            const wrapper = document.createElement('div');
            wrapper.className = 'page-transition';
            
            // 传入 wrapper 作为 container，兼容 render(container) 和 render() 两种签名
            const result = moduleObj.render(wrapper);
            
            content.innerHTML = '';
            
            // 模块可能返回 HTMLElement（如 showcase.js），也可能直接写入 wrapper（如 realtime.js）
            if (result instanceof HTMLElement) {
                content.appendChild(result);
            } else if (typeof result === 'string') {
                wrapper.innerHTML = result;
                content.appendChild(wrapper);
            } else {
                // 模块已直接写入 wrapper（render(container) 模式），返回 undefined
                content.appendChild(wrapper);
            }
            
            // 执行模块初始化
            if (typeof moduleObj.init === 'function') {
                setTimeout(() => moduleObj.init(), 0);
            }
        } else {
            content.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <i data-lucide="construction" class="w-16 h-16 mx-auto mb-4 text-gray-300"></i>
                        <h2 class="text-xl font-semibold text-gray-500">模块开发中</h2>
                        <p class="text-gray-400 mt-2">${route.name} 模块即将上线</p>
                    </div>
                </div>
            `;
        }
        
        // 初始化图标
        setTimeout(() => lucide.createIcons(), 50);
    },

    navigate(route) {
        window.location.hash = `#/${route}`;
    },

    updateSidebarActive() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('bg-secondary/20', 'text-secondary', 'border-r-2', 'border-secondary');
            item.classList.add('text-gray-400');
            
            if (item.dataset.route === this.currentRoute) {
                item.classList.add('bg-secondary/20', 'text-secondary', 'border-r-2', 'border-secondary');
                item.classList.remove('text-gray-400');
            }
        });
    },

    updateHeader(route) {
        const headerTitle = document.getElementById('header-title');
        const headerBreadcrumb = document.getElementById('header-breadcrumb');
        
        if (headerTitle) headerTitle.textContent = route.name;
        if (headerBreadcrumb) {
            const group = this.getRouteGroup(this.currentRoute);
            headerBreadcrumb.textContent = group ? `${group} / ${route.name}` : route.name;
        }
    },

    getRouteGroup(route) {
        const groups = {
            core: ['realtime', 'offline', 'summary', 'qa'],
            manage: ['history', 'notes', 'tasks', 'speakers', 'translate'],
            collaborate: ['team', 'templates', 'export', 'plugins'],
            system: ['dashboard', 'settings']
        };
        
        for (const [group, routes] of Object.entries(groups)) {
            if (routes.includes(route)) return this.getGroupName(group);
        }
        return '';
    },

    getGroupName(group) {
        const names = {
            core: '核心转写',
            manage: '内容管理',
            collaborate: '协作集成',
            system: '系统'
        };
        return names[group] || '';
    }
};
