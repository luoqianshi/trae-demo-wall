// 全局加载状态管理
class GlobalLoading {
    constructor() {
        this.overlay = null;
        this.init();
    }
    
    init() {
        // 创建加载遮罩层
        this.overlay = document.createElement('div');
        this.overlay.id = 'globalLoadingOverlay';
        this.overlay.className = 'global-loading-overlay';
        this.overlay.innerHTML = `
            <div class="global-loading-content">
                <div class="global-loading-spinner"></div>
                <div class="global-loading-text" id="globalLoadingText">加载中...</div>
            </div>
        `;
        document.body.appendChild(this.overlay);
    }
    
    show(text = '加载中...') {
        const loadingText = this.overlay.querySelector('#globalLoadingText');
        if (loadingText) {
            loadingText.textContent = text;
        }
        this.overlay.classList.add('active');
    }
    
    hide() {
        this.overlay.classList.remove('active');
    }
    
    // 模拟异步加载
    async simulateLoading(duration = 2000, text = '加载中...') {
        this.show(text);
        return new Promise(resolve => {
            setTimeout(() => {
                this.hide();
                resolve();
            }, duration);
        });
    }
}

// 按钮加载状态
class ButtonLoading {
    static setLoading(button, loadingText = '处理中...') {
        if (!button) return;
        
        const originalText = button.innerHTML;
        button.dataset.originalText = originalText;
        button.classList.add('btn-loading');
        button.innerHTML = `<span class="btn-text">${loadingText}</span>`;
    }
    
    static reset(button) {
        if (!button) return;
        
        button.classList.remove('btn-loading');
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }
    }
}

// 骨架屏加载
class SkeletonLoader {
    static createSkeleton(container, cardCount = 3) {
        if (!container) return;
        
        const skeletonHTML = `
            <div class="skeleton-container">
                ${Array(cardCount).fill(0).map(() => `
                    <div class="skeleton-card">
                        <div class="skeleton-line short"></div>
                        <div class="skeleton-line medium"></div>
                        <div class="skeleton-line"></div>
                    </div>
                `).join('')}
            </div>
        `;
        container.innerHTML = skeletonHTML;
    }
    
    static removeSkeleton(container, contentHTML) {
        if (!container) return;
        container.innerHTML = contentHTML;
    }
}

// 页面加载完成后初始化
let globalLoading;
document.addEventListener('DOMContentLoaded', function() {
    globalLoading = new GlobalLoading();
});

// 便捷函数
function showGlobalLoading(text) {
    if (globalLoading) {
        globalLoading.show(text);
    }
}

function hideGlobalLoading() {
    if (globalLoading) {
        globalLoading.hide();
    }
}

// 为所有页面跳转添加加载效果
function navigateWithLoading(url, loadingText = '跳转中...') {
    showGlobalLoading(loadingText);
    setTimeout(() => {
        window.location.href = url;
    }, 500);
}
