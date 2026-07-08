/**
 * 声纹智转 - 侧边栏组件
 */

const Sidebar = {
    groups: [
        {
            name: '核心转写',
            icon: 'zap',
            routes: ['realtime', 'offline', 'summary', 'qa']
        },
        {
            name: '内容管理',
            icon: 'folder',
            routes: ['history', 'notes', 'tasks', 'speakers', 'translate']
        },
        {
            name: '协作集成',
            icon: 'share-2',
            routes: ['team', 'templates', 'export', 'plugins']
        },
        {
            name: '系统',
            icon: 'cpu',
            routes: ['dashboard', 'settings']
        }
    ],

    collapsed: {},

    render() {
        const sidebar = document.getElementById('sidebar');
        sidebar.className = 'w-64 bg-primary text-white flex flex-col h-screen transition-all duration-300';
        
        sidebar.innerHTML = `
            <!-- Logo -->
            <div class="flex items-center gap-3 px-4 py-5 border-b border-white/10">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-ai flex items-center justify-center flex-shrink-0">
                    <i data-lucide="waves" class="w-6 h-6 text-white"></i>
                </div>
                <div>
                    <h1 class="font-bold text-lg tracking-tight">声纹智转</h1>
                    <p class="text-xs text-gray-400">实时录音转写系统</p>
                </div>
            </div>
            
            <!-- 大赛入口 -->
            <a href="#/showcase" class="mx-3 mt-4 mb-2 p-3 rounded-xl bg-gradient-to-r from-secondary/20 to-ai/20 border border-secondary/30 hover:from-secondary/30 hover:to-ai/30 transition-all group">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                        <i data-lucide="sparkles" class="w-4 h-4 text-secondary"></i>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-white group-hover:text-secondary transition-colors">产品价值</p>
                        <p class="text-xs text-gray-400">大赛展示页</p>
                    </div>
                </div>
            </a>
            
            <!-- 导航分组 -->
            <nav class="flex-1 overflow-y-auto px-2 py-2 space-y-1">
                ${this.groups.map((group, idx) => this.renderGroup(group, idx)).join('')}
            </nav>
            
            <!-- 底部信息 -->
            <div class="px-4 py-3 border-t border-white/10">
                <div class="flex items-center gap-2 text-xs text-gray-400">
                    <div class="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                    <span>系统运行正常</span>
                </div>
                <div class="text-xs text-gray-500 mt-1">延迟 <span class="text-secondary font-mono">&lt;200ms</span></div>
            </div>
        `;
        
        this.attachEvents();
    },

    renderGroup(group, idx) {
        const isCollapsed = this.collapsed[idx];
        
        return `
            <div class="group-section mb-1">
                <button onclick="Sidebar.toggleGroup(${idx})" class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors">
                    <span class="flex items-center gap-2">
                        <i data-lucide="${group.icon}" class="w-3.5 h-3.5"></i>
                        ${group.name}
                    </span>
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5 transition-transform ${isCollapsed ? '-rotate-90' : ''}"></i>
                </button>
                <div class="space-y-0.5 ${isCollapsed ? 'hidden' : ''}">
                    ${group.routes.map(route => {
                        const routeInfo = Router.routes[route];
                        return `
                            <a href="#/${route}" 
                               data-route="${route}"
                               class="nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all ${Router.currentRoute === route ? 'bg-secondary/20 text-secondary border-r-2 border-secondary' : ''}">
                                <i data-lucide="${routeInfo.icon}" class="w-4 h-4"></i>
                                <span>${routeInfo.name}</span>
                            </a>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    toggleGroup(idx) {
        this.collapsed[idx] = !this.collapsed[idx];
        this.render();
        lucide.createIcons();
    },

    attachEvents() {
        // 导航点击事件由路由系统处理
    }
};
