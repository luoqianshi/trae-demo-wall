/* ============================================ */
/* utils.js - 工具函数                          */
/* 作用：存放各模块都会用到的通用小工具          */
/* 小白理解：就像工具箱，谁需要谁拿来用          */
/* ============================================ */

/**
 * 工具对象：所有工具函数都挂在 Utils 上
 * 用法：Utils.toast('提示文字')
 */
window.Utils = {

    /**
     * 显示 Toast 提示（轻量级消息提示，2秒后自动消失）
     * @param {string} msg - 要显示的消息内容
     */
    toast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.classList.remove('active');
        // 强制重新渲染，让动画重新播放
        void toast.offsetWidth;
        toast.classList.add('active');
        // 2秒后隐藏
        setTimeout(() => {
            toast.classList.remove('active');
        }, 2000);
    },

    /**
     * 显示弹窗
     * @param {string} html - 弹窗内容的HTML字符串
     */
    showModal(html) {
        const overlay = document.getElementById('modal-overlay');
        const container = document.getElementById('modal-container');
        container.innerHTML = html;
        overlay.classList.add('active');
    },

    /**
     * 关闭弹窗
     */
    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        overlay.classList.remove('active');
        document.getElementById('modal-container').innerHTML = '';
    },

    /**
     * 切换 Tab 页面
     * 小白理解：切页面时同时让顶部栏变色，增强视觉辨识
     * @param {string} tabName - Tab名称：home/food/travel/trip/ai
     */
    switchTab(tabName) {
        // 1. 隐藏所有 Tab 页面
        document.querySelectorAll('.tab-page').forEach(page => {
            page.classList.remove('active');
        });
        // 2. 取消所有 Tab 按钮的激活状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        // 3. 激活目标 Tab 页面
        const page = document.getElementById('tab-' + tabName);
        if (page) page.classList.add('active');
        // 4. 激活目标 Tab 按钮
        const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        if (btn) btn.classList.add('active');
        // 5. 记录当前 Tab（供其他模块使用）
        App.currentTab = tabName;
        // 6. 顶部栏根据当前 Tab 变色（创新点）
        const header = document.querySelector('.app-header');
        if (header) {
            header.classList.remove('theme-home', 'theme-food', 'theme-travel', 'theme-trip', 'theme-ai');
            header.classList.add('theme-' + tabName);
        }
        // 7. 更新浮动按钮显示状态（行程页和AI页隐藏FAB）
        if (typeof App !== 'undefined' && App.updateFab) {
            App.updateFab(tabName);
        }
    },

    /**
     * 振动反馈（创新点：操作时手机震一下，手感更好）
     * 小白理解：点按钮时手机轻轻震一下，像按了真实按钮
     * @param {number|number[]} pattern - 振动模式：数字(毫秒)或数组(振停交替)
     */
    vibrate(pattern = 10) {
        // 检查浏览器是否支持振动 API
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                // 不支持就算了，不报错
            }
        }
    },

    /**
     * 显示底部弹出菜单（Bottom Sheet）
     * 小白理解：从底部滑上来的菜单，比中间弹窗更适合手机操作
     * @param {string} title - 菜单标题
     * @param {Array} items - 菜单项数组 [{icon, label, action, danger}]
     */
    showBottomSheet(title, items) {
        // 先移除已存在的
        this.closeBottomSheet();

        // 创建遮罩
        const overlay = document.createElement('div');
        overlay.className = 'sheet-overlay';
        overlay.id = 'sheet-overlay';

        // 创建底部菜单
        const sheet = document.createElement('div');
        sheet.className = 'bottom-sheet';
        sheet.innerHTML = `
            <div class="sheet-handle"></div>
            ${title ? `<div class="sheet-title">${this.escapeHtml(title)}</div>` : ''}
            ${items.map((item, i) => `
                <div class="sheet-item" style="${item.danger ? 'color: var(--danger);' : ''}" data-index="${i}">
                    <span class="sheet-item-icon">${item.icon || ''}</span>
                    <span>${this.escapeHtml(item.label)}</span>
                </div>
            `).join('')}
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(sheet);

        // 触发动画
        requestAnimationFrame(() => {
            overlay.classList.add('active');
            sheet.classList.add('active');
        });

        // 绑定菜单项点击
        sheet.querySelectorAll('.sheet-item').forEach((el, i) => {
            el.addEventListener('click', () => {
                this.vibrate(8);
                this.closeBottomSheet();
                if (typeof items[i].action === 'function') {
                    setTimeout(() => items[i].action(), 200);  // 等菜单收起再执行
                }
            });
        });

        // 点击遮罩关闭
        overlay.addEventListener('click', () => this.closeBottomSheet());
    },

    /**
     * 关闭底部弹出菜单
     */
    closeBottomSheet() {
        const overlay = document.getElementById('sheet-overlay');
        const sheet = document.querySelector('.bottom-sheet');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
            // 兜底：300ms后强制移除
            setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 300);
        }
        if (sheet) {
            sheet.classList.remove('active');
            sheet.addEventListener('transitionend', () => sheet.remove(), { once: true });
            setTimeout(() => { if (sheet.parentNode) sheet.remove(); }, 300);
        }
    },

    /**
     * 绑定长按事件（创新点：长按卡片弹出快捷操作菜单）
     * 小白理解：手指按住卡片不动，0.6秒后触发长按，弹出操作菜单
     * @param {HTMLElement} element - 要绑定长按的元素
     * @param {Function} callback - 长按触发后的回调函数
     */
    bindLongPress(element, callback) {
        let timer = null;
        let triggered = false;

        const start = (e) => {
            triggered = false;
            timer = setTimeout(() => {
                triggered = true;
                element.classList.add('longpress-active');
                this.vibrate([15]);  // 长按振动反馈
                if (typeof callback === 'function') callback(e);
                setTimeout(() => element.classList.remove('longpress-active'), 300);
            }, 600);
        };

        const cancel = () => {
            if (timer) { clearTimeout(timer); timer = null; }
        };

        // 触摸事件（手机）
        element.addEventListener('touchstart', start, { passive: true });
        element.addEventListener('touchend', cancel);
        element.addEventListener('touchmove', cancel);
        element.addEventListener('touchcancel', cancel);

        // 鼠标事件（电脑）
        element.addEventListener('mousedown', start);
        element.addEventListener('mouseup', cancel);
        element.addEventListener('mouseleave', cancel);
    },

    /**
     * 生成骨架屏HTML（创新点：加载时显示灰色占位动画）
     * 小白理解：数据还没准备好时，先显示几个灰色的卡片占位，带流光动画
     * @param {number} count - 占位卡片数量
     * @returns {string} 骨架屏HTML字符串
     */
    skeletonHTML(count = 3) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-card">
                    <div style="display: flex; gap: 12px; margin-bottom: 10px;">
                        <div class="skeleton skeleton-avatar"></div>
                        <div style="flex: 1;">
                            <div class="skeleton skeleton-line medium"></div>
                            <div class="skeleton skeleton-line short"></div>
                        </div>
                    </div>
                    <div class="skeleton skeleton-line long"></div>
                    <div class="skeleton skeleton-line long"></div>
                </div>
            `;
        }
        return html;
    },

    /**
     * 格式化价格（统一显示格式）
     * @param {number|string} price - 价格
     * @returns {string} 格式化后的价格字符串
     */
    formatPrice(price) {
        if (price === 0 || price === '0' || price === '免费') {
            return '免费';
        }
        return '¥' + price;
    },

    /**
     * 根据评分返回星星字符串
     * @param {number} rating - 评分（0-5）
     * @returns {string} 星星字符串
     */
    formatRating(rating) {
        return '⭐' + rating;
    },

    /**
     * 根据余票状态返回颜色类名
     * @param {string} status - 余票状态：充足/紧张/售罄
     * @returns {string} CSS类名
     */
    getTicketStatusClass(status) {
        if (status === '充足') return 'tag-success';
        if (status === '紧张') return 'tag-warning';
        if (status === '售罄') return 'tag-danger';
        return 'tag-info';
    },

    /**
     * 防抖函数：连续操作时只执行最后一次
     * 小白理解：比如搜索输入时，停止输入300ms后才执行搜索
     * @param {Function} fn - 要执行的函数
     * @param {number} delay - 延迟时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    debounce(fn, delay = 300) {
        let timer = null;
        return function(...args) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                fn.apply(this, args);
            }, delay);
        };
    },

    /**
     * 生成唯一ID（用于景点、行程等唯一标识）
     * @returns {string} 唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    /**
     * 格式化日期
     * @param {Date} date - 日期对象
     * @returns {string} 格式化后的日期，如 "2026-07-11"
     */
    formatDate(date) {
        const d = date instanceof Date ? date : new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * 获取相对时间描述（如"3分钟前"）
     * @param {number} timestamp - 时间戳
     * @returns {string} 相对时间
     */
    timeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;

        if (diff < minute) return '刚刚';
        if (diff < hour) return Math.floor(diff / minute) + '分钟前';
        if (diff < day) return Math.floor(diff / hour) + '小时前';
        if (diff < 7 * day) return Math.floor(diff / day) + '天前';
        return this.formatDate(new Date(timestamp));
    },

    /**
     * HTML转义（防止XSS攻击，用户输入的内容要转义后再显示）
     * @param {string} str - 原始字符串
     * @returns {string} 转义后的安全字符串
     */
    escapeHtml(str) {
        if (typeof str !== 'string') return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return str.replace(/[&<>"']/g, m => map[m]);
    },

    /**
     * 深拷贝对象（防止引用类型数据被意外修改）
     * @param {*} obj - 要拷贝的对象
     * @returns {*} 拷贝后的新对象
     */
    deepCopy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
};
