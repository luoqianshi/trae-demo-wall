/**
 * 学智云学习平台 - 辅助函数工具
 */

const Helpers = {
    /**
     * 生成唯一ID
     * @returns {string} UUID格式的ID
     */
    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * 获取今天的日期（YYYY-MM-DD格式）
     * @returns {string} 今天的日期
     */
    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    },

    /**
     * 获取本周的开始日期（周一）
     * @returns {Date} 本周开始日期
     */
    getWeekStart() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 周日返回-6，其他返回1-dayOfWeek
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() + diff);
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    },

    /**
     * 获取本周的结束日期（周日）
     * @returns {Date} 本周结束日期
     */
    getWeekEnd() {
        const weekStart = this.getWeekStart();
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return weekEnd;
    },

    /**
     * 格式化时间（分钟转为小时和分钟）
     * @param {number} minutes - 分钟数
     * @returns {string} 格式化的时间字符串
     */
    formatTime(minutes) {
        if (minutes < 60) {
            return `${minutes}分钟`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (mins === 0) {
            return `${hours}小时`;
        }
        return `${hours}小时${mins}分钟`;
    },

    /**
     * 格式化日期（YYYY-MM-DD转为中文格式）
     * @param {string} dateStr - 日期字符串
     * @returns {string} 格式化的日期字符串
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}年${month}月${day}日`;
    },

    /**
     * 格式化时间戳（转为HH:MM:SS）
     * @param {number} timestamp - 时间戳（秒）
     * @returns {string} 格式化的时间字符串
     */
    formatTimestamp(timestamp) {
        const hours = Math.floor(timestamp / 3600);
        const minutes = Math.floor((timestamp % 3600) / 60);
        const seconds = timestamp % 60;

        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },

    /**
     * 格式化计时器显示
     * @param {number} seconds - 秒数
     * @returns {string} 格式化的时间字符串
     */
    formatTimer(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    },

    /**
     * 获取学科名称（中文）
     * @param {string} subject - 学科英文名称
     * @returns {string} 学科中文名称
     */
    getSubjectName(subject) {
        const subjectNames = {
            chinese: '语文',
            math: '数学',
            english: '英语',
            physics: '物理',
            chemistry: '化学',
            biology: '生物',
            science: '科学'
        };
        return subjectNames[subject] || subject;
    },

    /**
     * 获取学科图标（Element UI图标）
     * @param {string} subject - 学科英文名称
     * @returns {string} 图标名称
     */
    getSubjectIcon(subject) {
        const subjectIcons = {
            chinese: 'el-icon-document',
            math: 'el-icon-c-scale-to-original',
            english: 'el-icon-chat-line-square',
            physics: 'el-icon-connection',
            chemistry: 'el-icon-magic-stick',
            biology: 'el-icon-s-flag',
            science: 'el-icon-flask-round'
        };
        return subjectIcons[subject] || 'el-icon-document';
    },

    /**
     * 获取学科颜色
     * @param {string} subject - 学科英文名称
     * @returns {string} CSS颜色变量名
     */
    getSubjectColor(subject) {
        const subjectColors = {
            chinese: 'var(--chinese-color)',
            math: 'var(--math-color)',
            english: 'var(--english-color)',
            physics: 'var(--physics-color)',
            chemistry: 'var(--chemistry-color)',
            biology: 'var(--biology-color)',
            science: 'var(--science-color)'
        };
        return subjectColors[subject] || 'var(--primary-color)';
    },

    /**
     * 获取年级名称（中文）
     * @param {number} grade - 年级数字（1-9）
     * @returns {string} 年级中文名称
     */
    getGradeName(grade) {
        if (grade >= 1 && grade <= 6) {
            return `${grade}年级`;
        } else if (grade === 7) {
            return '七年级';
        } else if (grade === 8) {
            return '八年级';
        } else if (grade === 9) {
            return '九年级';
        }
        return `${grade}年级`;
    },

    /**
     * 获取难度等级描述
     * @param {number} difficulty - 难度等级（1-5）
     * @returns {string} 难度描述
     */
    getDifficultyName(difficulty) {
        const difficultyNames = {
            1: '简单',
            2: '较易',
            3: '中等',
            4: '较难',
            5: '困难'
        };
        return difficultyNames[difficulty] || '未知';
    },

    /**
     * 获取难度颜色
     * @param {number} difficulty - 难度等级（1-5）
     * @returns {string} CSS颜色
     */
    getDifficultyColor(difficulty) {
        const difficultyColors = {
            1: '#27AE60', // 绿色
            2: '#2ECC71', // 浅绿色
            3: '#F39C12', // 橙色
            4: '#E67E22', // 深橙色
            5: '#E74C3C'  // 红色
        };
        return difficultyColors[difficulty] || '#7F8C8D';
    },

    /**
     * 生成星级评分HTML
     * @param {number} rating - 评分（1-5）
     * @returns {string} 星级HTML字符串
     */
    generateStarsHTML(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                html += '<i class="el-icon-star-on star"></i>';
            } else {
                html += '<i class="el-icon-star-off star empty"></i>';
            }
        }
        return html;
    },

    /**
     * 深拷贝对象
     * @param {object} obj - 要拷贝的对象
     * @returns {object} 拷贝后的对象
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        if (obj instanceof Object) {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
        return obj;
    },

    /**
     * 防抖函数
     * @param {function} func - 要执行的函数
     * @param {number} wait - 等待时间（毫秒）
     * @returns {function} 防抖后的函数
     */
    debounce(func, wait = 300) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(this, args);
            }, wait);
        };
    },

    /**
     * 节流函数
     * @param {function} func - 要执行的函数
     * @param {number} wait - 等待时间（毫秒）
     * @returns {function} 节流后的函数
     */
    throttle(func, wait = 300) {
        let lastTime = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastTime >= wait) {
                lastTime = now;
                func.apply(this, args);
            }
        };
    },

    /**
     * 检查是否为移动设备
     * @returns {boolean} 是否为移动设备
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * 检查是否为触摸设备
     * @returns {boolean} 是否为触摸设备
     */
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    /**
     * 滚动到顶部
     */
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    },

    /**
     * 滚动到指定元素
     * @param {string|HTMLElement} selector - 元素选择器或元素对象
     */
    scrollToElement(selector) {
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    },

    /**
     * 复制文本到剪贴板
     * @param {string} text - 要复制的文本
     * @returns {Promise<boolean>} 是否复制成功
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Copy failed:', error);
            // 使用传统方法
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textarea);
                return true;
            } catch (e) {
                document.body.removeChild(textarea);
                return false;
            }
        }
    },

    /**
     * 验证手机号格式
     * @param {string} phone - 手机号
     * @returns {boolean} 是否为有效手机号
     */
    validatePhone(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    },

    /**
     * 验证邮箱格式
     * @param {string} email - 邮箱地址
     * @returns {boolean} 是否为有效邮箱
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * 安全获取嵌套对象属性
     * @param {object} obj - 对象
     * @param {string} path - 属性路径（如 'a.b.c'）
     * @param {any} defaultValue - 默认值
     * @returns {any} 属性值
     */
    getNestedProperty(obj, path, defaultValue = undefined) {
        const keys = path.split('.');
        let result = obj;
        for (const key of keys) {
            if (result && typeof result === 'object' && key in result) {
                result = result[key];
            } else {
                return defaultValue;
            }
        }
        return result;
    },

    /**
     * 设置嵌套对象属性
     * @param {object} obj - 对象
     * @param {string} path - 属性路径（如 'a.b.c'）
     * @param {any} value - 属性值
     */
    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }
        current[keys[keys.length - 1]] = value;
    },

    /**
     * 解析URL参数
     * @param {string} url - URL地址
     * @returns {object} 参数对象
     */
    parseUrlParams(url) {
        const params = {};
        const queryString = url.split('?')[1];
        if (queryString) {
            const pairs = queryString.split('&');
            pairs.forEach(pair => {
                const [key, value] = pair.split('=');
                params[key] = decodeURIComponent(value || '');
            });
        }
        return params;
    },

    /**
     * 构建URL参数
     * @param {object} params - 参数对象
     * @returns {string} URL参数字符串
     */
    buildUrlParams(params) {
        const pairs = [];
        for (const key in params) {
            if (params.hasOwnProperty(key) && params[key] !== undefined) {
                pairs.push(`${key}=${encodeURIComponent(params[key])}`);
            }
        }
        return pairs.join('&');
    },

    /**
     * 显示加载状态
     * @param {boolean} show - 是否显示
     * @param {string} message - 加载消息
     */
    showLoading(show = true, message = '加载中...') {
        if (show) {
            if (typeof ElementUI !== 'undefined' && ElementUI.Loading) {
                ElementUI.Loading.service({
                    lock: true,
                    text: message,
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.7)'
                });
            }
        } else {
            if (typeof ElementUI !== 'undefined' && ElementUI.Loading) {
                ElementUI.Loading.service().close();
            }
        }
    },

    /**
     * 显示消息提示
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型（success/warning/error/info）
     */
    showMessage(message, type = 'info') {
        if (typeof ElementUI !== 'undefined' && ElementUI.Message) {
            ElementUI.Message({
                message,
                type,
                duration: 3000
            });
        } else {
            console.log(`[${type}] ${message}`);
        }
    },

    /**
     * 显示确认对话框
     * @param {string} message - 确认消息
     * @param {string} title - 标题
     * @returns {Promise<boolean>} 用户选择
     */
    async showConfirm(message, title = '提示') {
        if (typeof ElementUI !== 'undefined' && ElementUI.MessageBox) {
            try {
                await ElementUI.MessageBox.confirm(message, title, {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                return true;
            } catch {
                return false;
            }
        }
        return confirm(message);
    }
};

// 导出Helpers对象（兼容模块化和全局使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Helpers;
} else {
    window.Helpers = Helpers;
}