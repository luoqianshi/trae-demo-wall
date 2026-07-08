/**
 * 声纹智转 - 顶部栏组件
 */

const Header = {
    render() {
        const header = document.getElementById('header');
        header.className = 'h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6';
        
        header.innerHTML = `
            <div class="flex items-center gap-4">
                <button id="mobile-menu-btn" class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <i data-lucide="menu" class="w-5 h-5"></i>
                </button>
                <div>
                    <h2 id="header-title" class="text-lg font-semibold text-gray-900 dark:text-white">产品价值</h2>
                    <p id="header-breadcrumb" class="text-xs text-gray-500 dark:text-gray-400">大赛展示页</p>
                </div>
            </div>
            
            <div class="flex items-center gap-3">
                <!-- 搜索 -->
                <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    <i data-lucide="search" class="w-4 h-4"></i>
                    <input type="text" placeholder="搜索转写记录..." class="bg-transparent border-none outline-none text-sm w-48">
                    <kbd class="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600">Ctrl K</kbd>
                </div>
                
                <!-- 通知 -->
                <button class="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <i data-lucide="bell" class="w-5 h-5 text-gray-600 dark:text-gray-300"></i>
                    <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-warning"></span>
                </button>
                
                <!-- 主题切换 -->
                <button onclick="App.toggleTheme()" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <i data-lucide="sun" class="w-5 h-5 text-gray-600 dark:text-gray-300 hidden dark:block"></i>
                    <i data-lucide="moon" class="w-5 h-5 text-gray-600 dark:text-gray-300 block dark:hidden"></i>
                </button>
                
                <!-- 用户头像 -->
                <div class="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-ai flex items-center justify-center text-white text-sm font-medium">
                        用
                    </div>
                </div>
            </div>
        `;
        
        this.attachEvents();
    },

    attachEvents() {
        // 移动端菜单
        const mobileBtn = document.getElementById('mobile-menu-btn');
        if (mobileBtn) {
            mobileBtn.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('open');
            });
        }
    }
};
