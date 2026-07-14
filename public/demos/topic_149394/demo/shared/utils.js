/**
 * VidBuddy 工具函数库
 * 提供通用的工具函数，包括时间格式化、ID生成、防抖、HTML转义等
 */
const VT_UTILS = {};

/**
 * 将秒数格式化为时间字符串
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串，格式为 MM:SS 或 H:MM:SS
 */
VT_UTILS.formatTime = function (seconds) {
  if (typeof seconds !== "number" || isNaN(seconds)) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [
    m.toString().padStart(2, "0"),
    s.toString().padStart(2, "0"),
  ];
  if (h > 0) parts.unshift(h.toString());
  return parts.join(":");
};

/**
 * 生成唯一ID
 * @param {string} [prefix=""] - ID前缀
 * @returns {string} 带前缀的唯一UUID
 */
VT_UTILS.generateId = function (prefix = "") {
  return prefix + crypto.randomUUID();
};

/**
 * 创建防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 防抖延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
VT_UTILS.debounce = function (fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
};

/**
 * HTML转义，防止XSS攻击
 * @param {string} str - 需要转义的字符串
 * @returns {string} 转义后的安全字符串
 */
VT_UTILS.escapeHtml = function (str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * 验证颜色值是否有效
 * @param {string} color - 颜色值（如 #fff, rgb(255,255,255), red）
 * @returns {boolean} 是否为有效颜色
 */
VT_UTILS.isValidColor = function (color) {
  const s = new Option().style;
  s.color = color;
  return s.color !== "";
};

/**
 * 验证键盘按键码是否有效
 * @param {string} key - 按键码（如 KeyA, Space, ArrowUp）
 * @returns {boolean} 是否为有效按键码
 */
VT_UTILS.isValidKeyCode = function (key) {
  const validKeys = [
    "KeyA", "KeyB", "KeyC", "KeyD", "KeyE", "KeyF", "KeyG", "KeyH", "KeyI",
    "KeyJ", "KeyK", "KeyL", "KeyM", "KeyN", "KeyO", "KeyP", "KeyQ", "KeyR",
    "KeyS", "KeyT", "KeyU", "KeyV", "KeyW", "KeyX", "KeyY", "KeyZ",
    "Digit0", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6",
    "Digit7", "Digit8", "Digit9",
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    "Space", "Enter", "Escape", "Tab", "Backspace", "Delete", "Insert",
    "Home", "End", "PageUp", "PageDown",
    "Minus", "Equal", "Backquote", "BracketLeft", "BracketRight", "Backslash",
    "Semicolon", "Quote", "Comma", "Period", "Slash"
  ];
  return validKeys.includes(key);
};

/**
 * 将值限制在指定范围内
 * @param {number} value - 待限制的值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的数值
 */
VT_UTILS.clamp = function (value, min, max) {
  return Math.min(Math.max(value, min), max);
};

/**
 * 将秒数格式化为中文时长描述
 * @param {number} seconds - 秒数
 * @returns {string} 中文时长描述（如 "10分钟", "1小时30分钟"）
 */
VT_UTILS.formatDuration = function (seconds) {
  if (typeof seconds !== "number" || isNaN(seconds)) return "0分钟";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}分钟`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}小时${remainingMins}分钟` : `${hours}小时`;
};

/**
 * 根据视频ID生成备选ID列表，用于跨集匹配
 * @param {string} videoId - 视频ID
 * @returns {Array<string>} 备选ID列表
 */
VT_UTILS.generateFallbackIds = function (videoId) {
  const fallbackIds = [];
  if (!videoId || typeof videoId !== "string") {
    return fallbackIds;
  }

  // B站分P视频，生成不带集数的基础ID
  if (videoId.startsWith("bili_") && videoId.includes("_p")) {
    const baseId = videoId.split("_p")[0];
    fallbackIds.push(baseId);
  }

  // 爱奇艺视频，生成简化ID
  if (videoId.startsWith("iq_")) {
    const parts = videoId.split("_");
    if (parts.length > 2) {
      fallbackIds.push(`${parts[0]}_${parts[1]}`);
    }
  }

  return fallbackIds;
};

if (typeof window !== "undefined") {
  window.VT_UTILS = VT_UTILS;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = VT_UTILS;
}

if (typeof exports !== "undefined") {
  Object.keys(VT_UTILS).forEach(key => {
    exports[key] = VT_UTILS[key];
  });
}
