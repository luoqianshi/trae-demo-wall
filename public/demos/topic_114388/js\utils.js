// utils.js - 通用工具：时间、XSS 转义、ID 生成

/**
 * 把 Date 对象格式化为本地日期字符串 YYYY-MM-DD
 * 修复了原版使用 toISOString() 跨时区错位的 bug
 */
export function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * 把 Date 格式化为 HH:MM
 */
export function formatTime(date) {
    return date.toTimeString().slice(0, 5);
}

/**
 * 转义 HTML 特殊字符，防止 XSS
 * 修复了原版直接拼接 innerHTML 的漏洞
 */
export function escapeHTML(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * 生成唯一 ID
 */
export function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * 解析 HH:MM 为当天 Date
 */
export function parseTimeOfDay(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(2000, 0, 1, h, m, 0, 0);
    return d;
}

/**
 * 遍历日期区间（按天），返回 YYYY-MM-DD 数组
 * 不修改入参日期
 */
export function eachDay(startDate, endDate) {
    const days = [];
    const cur = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    // 防御性：不超过 366 天
    let guard = 0;
    while (cur <= end && guard < 366) {
        days.push(formatDate(cur));
        cur.setDate(cur.getDate() + 1);
        guard++;
    }
    return days;
}

/**
 * 简单防抖
 */
export function debounce(fn, ms = 200) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

/**
 * 时间段统计
 * - 若有 daysOfWeek：按周内指定天计算总小时
 * - 否则按每天计算
 */
export function computeSlotHours(slot) {
    const start = new Date(slot.startDate);
    const end = new Date(slot.endDate);
    const totalDays = Math.round((end - start) / 86400000) + 1;

    const from = parseTimeOfDay(slot.timeFrom);
    const to = parseTimeOfDay(slot.timeTo);
    const hoursPerDay = Math.max(0, (to - from) / 3600000);

    if (Array.isArray(slot.daysOfWeek) && slot.daysOfWeek.length > 0) {
        // 计算在 start..end 之间属于 daysOfWeek 的天数
        const matchedDays = new Set(slot.daysOfWeek);
        let count = 0;
        const cur = new Date(start);
        for (let i = 0; i < totalDays; i++) {
            // JS getDay: 0=Sun, 1=Mon, ..., 6=Sat. 转换为周一=0
            const jsDay = cur.getDay();
            const mondayIdx = (jsDay + 6) % 7;
            if (matchedDays.has(mondayIdx)) count++;
            cur.setDate(cur.getDate() + 1);
        }
        return count * hoursPerDay;
    }
    return totalDays * hoursPerDay;
}
