function initCommandNav(activePage) {
    const pages = [
        { id: 'dashboard', name: '主控大屏', icon: 'fa-desktop', file: 'dashboard.html' },
        { id: 'monitoring', name: '实时监控', icon: 'fa-satellite-dish', file: 'monitoring.html' },
        { id: 'alerts', name: '告警中心', icon: 'fa-bell', file: 'alerts.html' },
        { id: 'resources', name: '资源调度', icon: 'fa-map-marked-alt', file: 'resources.html' },
        { id: 'video', name: '视频联动', icon: 'fa-video', file: 'video.html' }
    ];
    
    const navHtml = pages.map(page => `
        <a href="${page.file}" class="command-nav-item ${page.id === activePage ? 'active' : ''}">
            <i class="fas ${page.icon} mr-2"></i>${page.name}
        </a>
    `).join('');
    
    return navHtml;
}

function getCommandHeader(activePage, pageTitle) {
    const currentTime = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    
    return `
    <header class="command-nav px-6 py-3 sticky top-0 z-50">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <div class="command-logo">
                    <i class="fas fa-trophy text-2xl text-white"></i>
                </div>
                <div>
                    <h1 class="command-title">赛事智慧调度系统</h1>
                    <p class="command-subtitle">SMART EVENT DISPATCH SYSTEM</p>
                </div>
            </div>
            
            <nav class="flex items-center space-x-1">
                ${initCommandNav(activePage)}
            </nav>
            
            <div class="flex items-center space-x-4">
                <div class="text-right">
                    <div class="text-xs text-cyan-300/60 tracking-widest">系统时间</div>
                    <div class="command-time" id="navCurrentTime">${currentTime}</div>
                </div>
                
                <div class="h-8 w-px bg-slate-700"></div>
                
                <div class="command-status">
                    <div class="command-status-dot bg-emerald-500"></div>
                    <span class="text-purple-300 text-xs font-medium">系统运行中</span>
                </div>
                
                <button class="command-system-btn" onclick="goToSystemSelect()">
                    <i class="fas fa-th-large"></i>
                    <span>系统</span>
                </button>
            </div>
        </div>
    </header>`;
}

function updateNavTime() {
    const timeEl = document.getElementById('navCurrentTime');
    if (timeEl) {
        timeEl.textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    }
}

setInterval(updateNavTime, 1000);
