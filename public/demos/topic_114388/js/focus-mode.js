// focus-mode.js - 番茄钟专注模式

import { escapeHTML } from './utils.js';

const DEFAULT_MINUTES = 25;
let timerId = null;
let remaining = 0;
let isRunning = false;
let totalFocusedToday = 0;
const STORAGE_KEY = 'study_focus_stats';

function loadStats() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return { sessions: [], totalMinutes: 0, lastDate: '' };
}

function saveStats(stats) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
}

export function initFocusMode() {
    const stats = loadStats();
    const today = getTodayKey();
    if (stats.lastDate !== today) {
        stats.lastDate = today;
    }
    totalFocusedToday = stats.sessions
        .filter(s => s.date === today)
        .reduce((sum, s) => sum + s.minutes, 0);

    bindControls();
    updateDisplay();
    updateStatsDisplay();
}

function bindControls() {
    const startBtn = document.getElementById('focusStart');
    const pauseBtn = document.getElementById('focusPause');
    const resetBtn = document.getElementById('focusReset');
    const presetBtns = document.querySelectorAll('[data-focus-preset]');

    if (startBtn) startBtn.addEventListener('click', startFocus);
    if (pauseBtn) pauseBtn.addEventListener('click', pauseFocus);
    if (resetBtn) resetBtn.addEventListener('click', resetFocus);

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isRunning) return;
            const mins = parseInt(btn.dataset.focusPreset, 10);
            remaining = mins * 60;
            updateDisplay();
            // 更新选中状态
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // 默认选中25分钟
    if (!remaining) remaining = DEFAULT_MINUTES * 60;
}

function startFocus() {
    if (isRunning) return;
    isRunning = true;
    const display = document.getElementById('focusTimer');
    if (display) display.classList.add('running');
    updateButtons();
    timerId = setInterval(() => {
        remaining--;
        updateDisplay();
        if (remaining <= 0) {
            completeFocus();
        }
    }, 1000);
}

function pauseFocus() {
    if (!isRunning) return;
    isRunning = false;
    const display = document.getElementById('focusTimer');
    if (display) display.classList.remove('running');
    clearInterval(timerId);
    timerId = null;
    updateButtons();
}

function resetFocus() {
    isRunning = false;
    const display = document.getElementById('focusTimer');
    if (display) display.classList.remove('running');
    clearInterval(timerId);
    timerId = null;
    const activePreset = document.querySelector('[data-focus-preset].active');
    const mins = activePreset ? parseInt(activePreset.dataset.focusPreset, 10) : DEFAULT_MINUTES;
    remaining = mins * 60;
    updateDisplay();
    updateButtons();
}

function completeFocus() {
    pauseFocus();
    const activePreset = document.querySelector('[data-focus-preset].active');
    const mins = activePreset ? parseInt(activePreset.dataset.focusPreset, 10) : DEFAULT_MINUTES;

    const stats = loadStats();
    const today = getTodayKey();
    stats.sessions.push({ date: today, minutes: mins, timestamp: Date.now() });
    stats.totalMinutes += mins;
    stats.lastDate = today;
    saveStats(stats);

    totalFocusedToday += mins;
    updateStatsDisplay();

    // 播放提示音（简单的beep）
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.value = 0.1;
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        }
    } catch {}

    // 显示完成效果
    const display = document.getElementById('focusTimer');
    if (display) {
        display.classList.add('focus-complete');
        setTimeout(() => display.classList.remove('focus-complete'), 2000);
    }

    // 浏览器通知
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('专注完成！', { body: `恭喜完成 ${mins} 分钟专注学习！`, icon: '🍅' });
    }
}

function updateDisplay() {
    const display = document.getElementById('focusTimer');
    if (!display) return;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateButtons() {
    const startBtn = document.getElementById('focusStart');
    const pauseBtn = document.getElementById('focusPause');
    if (startBtn) startBtn.disabled = isRunning;
    if (pauseBtn) pauseBtn.disabled = !isRunning;
}

function updateStatsDisplay() {
    const el = document.getElementById('focusStats');
    if (!el) return;
    const stats = loadStats();
    const sessions = stats.sessions.filter(s => s.date === getTodayKey()).length;
    el.innerHTML = `
        <div class="focus-stat">
            <div class="focus-stat-value">${totalFocusedToday}</div>
            <div class="focus-stat-label">今日专注(分钟)</div>
        </div>
        <div class="focus-stat">
            <div class="focus-stat-value">${sessions}</div>
            <div class="focus-stat-label">今日次数</div>
        </div>
        <div class="focus-stat">
            <div class="focus-stat-value">${stats.totalMinutes}</div>
            <div class="focus-stat-label">累计专注(分钟)</div>
        </div>
    `;
}

// 暴露给全局快捷键使用
window._focusToggle = () => { isRunning ? pauseFocus() : startFocus(); };
