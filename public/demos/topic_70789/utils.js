// ===== 工具函数模块 =====

const Utils = {
    // 格式化数字（保留指定小数位）
    formatNumber: function(num, decimals = 2) {
        return Number(num).toFixed(decimals);
    },
    
    // 计算百分比
    calculatePercentage: function(value, total) {
        if (total === 0) return 0;
        return Utils.formatNumber((value / total) * 100);
    },
    
    // 生成唯一ID
    generateId: function(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    // 防抖函数
    debounce: function(func, wait = 300) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },
    
    // 节流函数
    throttle: function(func, limit = 1000) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    },
    
    // 深拷贝对象
    deepClone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    // 获取URL参数
    getUrlParam: function(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    },
    
    // 设置URL参数
    setUrlParam: function(name, value) {
        const params = new URLSearchParams(window.location.search);
        params.set(name, value);
        window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    },
    
    // 移除URL参数
    removeUrlParam: function(name) {
        const params = new URLSearchParams(window.location.search);
        params.delete(name);
        window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    },
    
    // 检测元素是否在视口内
    isInViewport: function(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },
    
    // 平滑滚动到元素
    scrollToElement: function(elementId, offset = 0) {
        const element = document.getElementById(elementId);
        if (element) {
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    },
    
    // 数组分组
    groupBy: function(array, key) {
        return array.reduce((groups, item) => {
            const groupKey = item[key];
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(item);
            return groups;
        }, {});
    },
    
    // 数组去重
    unique: function(array, key) {
        const seen = new Set();
        return array.filter(item => {
            const value = key ? item[key] : item;
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });
    },
    
    // 数组排序（按对象属性）
    sortBy: function(array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            const valueA = a[key];
            const valueB = b[key];
            if (valueA < valueB) return order === 'asc' ? -1 : 1;
            if (valueA > valueB) return order === 'asc' ? 1 : -1;
            return 0;
        });
    },
    
    // 查找数组中最大差距的项
    findMaxGap: function(array, externalKey, internalKey) {
        let maxGap = -Infinity;
        let maxItem = null;
        
        array.forEach(item => {
            const gap = Math.abs(item[externalKey] - item[internalKey]);
            if (gap > maxGap) {
                maxGap = gap;
                maxItem = item;
            }
        });
        
        return { maxGap, maxItem };
    },
    
    // 延迟执行
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // 动画帧执行
    animateFrame: function(callback) {
        return new Promise(resolve => {
            const animate = () => {
                callback();
                resolve();
            };
            requestAnimationFrame(animate);
        });
    },
    
    // 随机整数（范围）
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // 随机数组项
    randomItem: function(array) {
        return array[Math.floor(Math.random() * array.length)];
    },
    
    // 格式化日期
    formatDate: function(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes);
    },
    
    // 文本截断
    truncateText: function(text, maxLength = 100, suffix = '...') {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + suffix;
    },
    
    // 安全获取对象属性（防undefined报错）
    getNestedValue: function(obj, path, defaultValue = undefined) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : defaultValue;
        }, obj);
    },
    
    // 计算数组平均值
    average: function(array) {
        if (!array || array.length === 0) return 0;
        const sum = array.reduce((acc, val) => acc + val, 0);
        return sum / array.length;
    },
    
    // 计算加权平均值
    weightedAverage: function(values, weights) {
        if (!values || !weights || values.length !== weights.length) return 0;
        const weightedSum = values.reduce((acc, val, index) => acc + val * weights[index], 0);
        const totalWeight = weights.reduce((acc, val) => acc + val, 0);
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    },
    
    // 验证邮箱格式
    isValidEmail: function(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },
    
    // 验证手机号格式（中国大陆）
    isValidPhone: function(phone) {
        const regex = /^1[3-9]\d{9}$/;
        return regex.test(phone.replace(/\s/g, ''));
    },
    
    // 生成随机颜色
    randomColor: function() {
        const colors = [
            '#137aa8', '#2199d4', '#0f7c4f', '#f3952f', '#ffc83a',
            '#aad4e6', '#022136', '#6b7280', '#9f7aea', '#e53e3e'
        ];
        return Utils.randomItem(colors);
    },
    
    // 获取滚动位置
    getScrollPosition: function() {
        return {
            x: window.pageXOffset || document.documentElement.scrollLeft,
            y: window.pageYOffset || document.documentElement.scrollTop
        };
    },
    
    // 设置滚动位置
    setScrollPosition: function(x, y) {
        window.scrollTo(x, y);
    },
    
    // 检测浏览器类型
    getBrowser: function() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) return 'chrome';
        if (userAgent.includes('Firefox')) return 'firefox';
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'safari';
        if (userAgent.includes('Edge')) return 'edge';
        return 'unknown';
    },
    
    // 检测设备类型
    getDeviceType: function() {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            return 'mobile';
        }
        return 'desktop';
    },
    
    // 存储数据到localStorage（带过期时间）
    setStorage: function(key, value, expiresInMinutes = 60) {
        const item = {
            value: value,
            expiresAt: Date.now() + expiresInMinutes * 60 * 1000
        };
        localStorage.setItem(key, JSON.stringify(item));
    },
    
    // 从localStorage获取数据
    getStorage: function(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;
        
        const item = JSON.parse(itemStr);
        if (Date.now() > item.expiresAt) {
            localStorage.removeItem(key);
            return null;
        }
        
        return item.value;
    },
    
    // 移除localStorage数据
    removeStorage: function(key) {
        localStorage.removeItem(key);
    },
    
    // 清空所有localStorage数据
    clearStorage: function() {
        localStorage.clear();
    },
    
    // 防抖的Promise版本
    debouncePromise: function(func, wait = 300) {
        let timeout;
        return function(...args) {
            return new Promise((resolve) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    resolve(func.apply(this, args));
                }, wait);
            });
        };
    },
    
    // 数组分块
    chunk: function(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    },
    
    // 对象转查询字符串
    objectToQueryString: function(obj) {
        return new URLSearchParams(obj).toString();
    },
    
    // 查询字符串转对象
    queryStringToObject: function(str) {
        const params = new URLSearchParams(str);
        const obj = {};
        for (const [key, value] of params) {
            obj[key] = value;
        }
        return obj;
    },
    
    // 生成范围数组
    range: function(start, end, step = 1) {
        const array = [];
        for (let i = start; i <= end; i += step) {
            array.push(i);
        }
        return array;
    },
    
    // 判断是否为空值
    isEmpty: function(value) {
        return value === null || value === undefined || value === '' ||
               (Array.isArray(value) && value.length === 0) ||
               (typeof value === 'object' && Object.keys(value).length === 0);
    },
    
    // 合并对象（深层）
    mergeDeep: function(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();
        
        if (Utils.isObject(target) && Utils.isObject(source)) {
            for (const key in source) {
                if (Utils.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    Utils.mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
        
        return Utils.mergeDeep(target, ...sources);
    },
    
    // 判断是否为对象
    isObject: function(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    },
    
    // 获取对象键值对数组
    entries: function(obj) {
        return Object.keys(obj).map(key => [key, obj[key]]);
    },
    
    // 反转对象键值
    invert: function(obj) {
        const inverted = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                inverted[obj[key]] = key;
            }
        }
        return inverted;
    }
};

// 全局暴露
window.Utils = Utils;