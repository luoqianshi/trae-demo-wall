/**
 * 声纹智转 - 主应用入口
 */

const App = {
    theme: localStorage.getItem('theme') || 'light',

    init() {
        // 初始化主题
        this.applyTheme();
        
        // 渲染组件
        Sidebar.render();
        Header.render();
        
        // 初始化路由
        Router.init();
        
        // 初始化图标
        lucide.createIcons();
        
        // 键盘快捷键
        this.setupKeyboard();
        
        console.log('声纹智转 - 系统初始化完成');
    },

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
        Header.render();
        lucide.createIcons();
    },

    applyTheme() {
        if (this.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    },

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K 搜索
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.querySelector('input[type="text"]')?.focus();
            }
        });
    },

    // 全局工具函数
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="flex items-center gap-2">
                <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info'}" class="w-4 h-4"></i>
                <span>${message}</span>
            </div>
        `;
        container.appendChild(toast);
        lucide.createIcons();
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    showModal(title, content) {
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold">${title}</h3>
                    <button onclick="App.closeModal()" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="p-6">${content}</div>
            </div>
        `;
        container.classList.remove('hidden');
        container.classList.add('flex');
        lucide.createIcons();
    },

    closeModal() {
        const container = document.getElementById('modal-container');
        container.classList.add('hidden');
        container.classList.remove('flex');
    },

    // 打字机效果
    typeWriter(element, text, speed = 30) {
        let i = 0;
        element.textContent = '';
        
        return new Promise(resolve => {
            const timer = setInterval(() => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                } else {
                    clearInterval(timer);
                    resolve();
                }
            }, speed);
        });
    },

    // 数字动画
    animateNumber(element, target, duration = 2000) {
        const start = 0;
        const startTime = performance.now();
        
        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };
        
        requestAnimationFrame(update);
    }
};

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
