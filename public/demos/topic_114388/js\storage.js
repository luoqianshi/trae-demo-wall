// storage.js - 本地持久化 + 导入导出

const KEYS = {
    subjects: 'study_subjects',
    timeSlots: 'study_timeslots',
    schedule: 'study_schedule',
    settings: 'study_settings',
    theme: 'study_theme'
};

/* ---------------- 默认数据 ---------------- */
function defaultSubjects() {
    return [
        { id: '1', name: '高等数学', difficulty: 3, points: ['第一章 函数与极限', '第二章 导数与微分', '第三章 积分', '第四章 微分方程'] },
        { id: '2', name: '大学英语', difficulty: 2, points: ['听力理解', '阅读理解', '完形填空', '写作模板'] },
        { id: '3', name: '数据结构', difficulty: 3, points: ['链表与树', '排序算法', '图论基础', '动态规划'] },
        { id: '4', name: '计算机网络', difficulty: 2, points: ['TCP/IP 协议', 'HTTP 协议', '网络层', '应用层'] }
    ];
}

function defaultTimeSlots() {
    const today = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 14);
    return [
        { id: '1', startDate: fmt(today), endDate: fmt(end), timeFrom: '08:00', timeTo: '12:00', duration: 60 },
        { id: '2', startDate: fmt(today), endDate: fmt(end), timeFrom: '14:00', timeTo: '18:00', duration: 60 },
        { id: '3', startDate: fmt(today), endDate: fmt(end), timeFrom: '19:00', timeTo: '22:00', duration: 60 }
    ];
}

function fmt(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/* ---------------- 通用存取 ---------------- */
function read(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (raw == null) return fallback;
        return JSON.parse(raw);
    } catch (err) {
        console.warn('localStorage 读取失败：', key, err);
        return fallback;
    }
}

function write(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
        console.error('localStorage 写入失败：', key, err);
    }
}

/* ---------------- 数据加载 ---------------- */
export function loadAll() {
    let subjects = read(KEYS.subjects, null);
    let timeSlots = read(KEYS.timeSlots, null);
    const schedule = read(KEYS.schedule, []);
    const settings = read(KEYS.settings, { useEbbinghaus: true });

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
        subjects = defaultSubjects();
        write(KEYS.subjects, subjects);
    }
    if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
        timeSlots = defaultTimeSlots();
        write(KEYS.timeSlots, timeSlots);
    }

    return { subjects, timeSlots, schedule, settings };
}

export function saveSubjects(subjects) { write(KEYS.subjects, subjects); }
export function saveTimeSlots(timeSlots) { write(KEYS.timeSlots, timeSlots); }
export function saveSchedule(schedule) { write(KEYS.schedule, schedule); }
export function saveSettings(settings) { write(KEYS.settings, settings); }
export function saveTheme(theme) { localStorage.setItem(KEYS.theme, theme); }
export function loadTheme() { return localStorage.getItem(KEYS.theme) || 'auto'; }

/* ---------------- 导入 / 导出 ---------------- */
export function exportData({ subjects, timeSlots, schedule, settings }) {
    // 同时导出 localStorage 中的扩展数据
    const extraKeys = ['wrong_book', 'study_notes', 'checkin_days', 'discussion_posts', 'achievements_unlocked', 'quizHistory'];
    const extraData = {};
    extraKeys.forEach(key => {
        const val = localStorage.getItem(key);
        if (val) {
            try { extraData[key] = JSON.parse(val); } catch { /* skip */ }
        }
    });
    const payload = {
        version: 2,
        exportedAt: new Date().toISOString(),
        subjects,
        timeSlots,
        schedule,
        settings,
        extra: extraData
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-plan-${fmt(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function importData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data || typeof data !== 'object') throw new Error('文件格式不正确');
                resolve({
                    subjects: Array.isArray(data.subjects) ? data.subjects : [],
                    timeSlots: Array.isArray(data.timeSlots) ? data.timeSlots : [],
                    schedule: Array.isArray(data.schedule) ? data.schedule : [],
                    settings: data.settings && typeof data.settings === 'object' ? data.settings : { useEbbinghaus: true }
                });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(reader.error || new Error('文件读取失败'));
        reader.readAsText(file, 'utf-8');
    });
}

export function clearAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}
