// reminder.js - 复习提醒系统
// 修复：原版只在 timeFrom 精确分钟时触发，加入 ±1 分钟容差 + 提前 5 分钟预提醒

import { formatDate, formatTime, escapeHTML } from './utils.js';

const CHECK_INTERVAL_MS = 30000; // 30 秒检查一次

let timerId = null;
let scheduleRef = null;
let onUpdate = null;

export function startReminder(schedule, updateCallback) {
    scheduleRef = schedule;
    onUpdate = updateCallback;
    stopReminder();
    timerId = setInterval(checkAndRemind, CHECK_INTERVAL_MS);
    // 立即检查一次
    checkAndRemind();
}

export function stopReminder() {
    if (timerId != null) {
        clearInterval(timerId);
        timerId = null;
    }
}

export function refreshReminderRef(schedule) {
    scheduleRef = schedule;
}

function checkAndRemind() {
    if (!scheduleRef || scheduleRef.length === 0) return;
    const now = new Date();
    const today = formatDate(now);
    const cur = formatTime(now);

    // 提前 5 分钟 或 ±1 分钟
    const upcoming = scheduleRef.find(item => {
        if (item.completed || item.date !== today) return false;
        const diff = minutesBetween(cur, item.timeFrom);
        return diff >= -1 && diff <= 5;
    });

    if (upcoming && !upcoming._notified) {
        upcoming._notified = true;
        showReminder(upcoming, minutesBetween(cur, upcoming.timeFrom) > 0);
        if (typeof onUpdate === 'function') onUpdate();
    }
}

function minutesBetween(t1, t2) {
    const [h1, m1] = t1.split(':').map(Number);
    const [h2, m2] = t2.split(':').map(Number);
    return (h2 * 60 + m2) - (h1 * 60 + m1);
}

function showReminder(item, isUpcoming) {
    const title = isUpcoming ? '⏰ 即将开始' : '🔔 复习时间到';
    const banner = document.createElement('div');
    banner.className = 'reminder-banner';
    banner.setAttribute('role', 'alert');
    banner.innerHTML = `
        <div style="font-weight:600; margin-bottom:4px;">${escapeHTML(title)}</div>
        <div>${escapeHTML(item.subjectName)} · ${escapeHTML(item.timeFrom)} - ${escapeHTML(item.timeTo)}</div>
        <div style="font-size:13px; opacity:0.9; margin-top:4px;">📌 ${escapeHTML(item.point)}</div>
    `;
    document.body.appendChild(banner);

    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            new Notification(title, {
                body: `${item.subjectName} - ${item.point}`,
                icon: '📚'
            });
        } catch (err) {
            console.warn('通知失败：', err);
        }
    }

    setTimeout(() => banner.remove(), 10000);
}

export function requestNotificationPermission() {
    if (!('Notification' in window)) return Promise.resolve('unsupported');
    if (Notification.permission === 'default') {
        return Notification.requestPermission();
    }
    return Promise.resolve(Notification.permission);
}
