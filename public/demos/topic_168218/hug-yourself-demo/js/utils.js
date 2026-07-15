/**
 * utils.js - 工具函数集合
 * 零外部依赖，原生 ES6+
 */
'use strict';

/**
 * Promise 延迟函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 设备震动 API 封装
 * 兼容 iOS Safari（不支持 Navigator.vibrate 时静默降级）
 * @param {number|number[]} pattern - 震动模式，单次时长(ms)或交替数组
 * @returns {boolean} 是否成功触发震动
 */
const vibrate = (pattern) => {
  if (!navigator || typeof navigator.vibrate !== 'function') {
    // iOS 或不支持震动的设备，静默降级
    return false;
  }
  try {
    return navigator.vibrate(pattern);
  } catch (e) {
    // 某些浏览器在非用户交互上下文中会抛出异常
    return false;
  }
};

/**
 * 生成唯一 ID（基于时间戳 + 随机数）
 * 格式：前缀_xxxxxxxx-xxxx
 * @param {string} [prefix='id'] - ID 前缀
 * @returns {string} 唯一 ID
 */
const generateId = (prefix = 'id') => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const shortRandom = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${timestamp}-${randomPart}-${shortRandom}`;
};

/**
 * 日期格式化
 * @param {Date|string|number} date - 日期对象、时间戳或日期字符串
 * @param {string} [format='YYYY-MM-DD HH:mm:ss'] - 格式模板
 * @returns {string} 格式化后的日期字符串
 *
 * 格式说明：
 *   YYYY - 四位年份
 *   MM   - 两位月份 (01-12)
 *   DD   - 两位日期 (01-31)
 *   HH   - 两位小时 (00-23)
 *   mm   - 两位分钟 (00-59)
 *   ss   - 两位秒钟 (00-59)
 */
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) {
    console.warn('[utils.formatDate] 无效日期:', date);
    return '';
  }

  const pad = (num) => String(num).padStart(2, '0');

  const tokens = {
    YYYY: d.getFullYear(),
    MM: pad(d.getMonth() + 1),
    DD: pad(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
  };

  let result = format;
  for (const [token, value] of Object.entries(tokens)) {
    result = result.replace(token, value);
  }
  return result;
};

/**
 * 防抖函数
 * 在连续触发时，只执行最后一次调用
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟毫秒数
 * @returns {Function} 防抖包装函数
 */
const debounce = (fn, delay = 300) => {
  let timer = null;

  const debounced = function (...args) {
    const context = this;
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      fn.apply(context, args);
    }, delay);
  };

  // 提供取消方法
  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
};

/**
 * 节流函数
 * 在指定时间间隔内只执行一次
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 间隔毫秒数
 * @returns {Function} 节流包装函数
 */
const throttle = (fn, delay = 300) => {
  let lastTime = 0;
  let timer = null;

  const throttled = function (...args) {
    const context = this;
    const now = Date.now();
    const remaining = delay - (now - lastTime);

    if (remaining <= 0) {
      // 到达执行窗口，立即执行
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      lastTime = now;
      fn.apply(context, args);
    } else if (timer === null) {
      // 在剩余时间后执行最后一次调用
      timer = setTimeout(() => {
        lastTime = Date.now();
        timer = null;
        fn.apply(context, args);
      }, remaining);
    }
  };

  // 提供取消方法
  throttled.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    lastTime = 0;
  };

  return throttled;
};

/**
 * 滚动元素到底部
 * 使用 requestAnimationFrame 确保在 DOM 更新后执行
 * @param {HTMLElement} el - 目标 DOM 元素
 * @param {boolean} [smooth=true] - 是否使用平滑滚动
 */
const scrollToBottom = (el, smooth = true) => {
  if (!el || typeof el.scrollTop === 'undefined') {
    console.warn('[utils.scrollToBottom] 无效元素:', el);
    return;
  }

  requestAnimationFrame(() => {
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  });
};

/**
 * 滚动当前活动页面视图到顶部
 * 页面切换后使用内部滚动的 .page-view，因此需要滚动该元素
 * @param {boolean} [smooth=true] - 是否平滑滚动
 */
const scrollPageToTop = (smooth = true) => {
  const pageView = document.querySelector('.page-view:last-child');
  if (pageView) {
    pageView.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  }
};

// 暴露到全局
window.sleep = sleep;
window.vibrate = vibrate;
window.generateId = generateId;
window.formatDate = formatDate;
window.debounce = debounce;
window.throttle = throttle;
window.scrollToBottom = scrollToBottom;
window.scrollPageToTop = scrollPageToTop;