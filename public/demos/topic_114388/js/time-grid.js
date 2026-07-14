// time-grid.js - 7x24 时间网格（热力图）管理
// 数据结构：state.timeGrid[day 0-6][hour 0-23] = true/false

import { escapeHTML } from './utils.js';

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

let gridState = [[]]; // 7 行 x 24 列
let isDragging = false;
let dragMode = null; // 'set' | 'clear'

/* ---------------- 初始化 ---------------- */
export function initTimeGrid() {
    // 7x24 全 false
    gridState = Array.from({ length: 7 }, () => Array(24).fill(false));
    // 暴露同步 API 供 app.js 调用
    if (typeof window !== 'undefined') {
        window.__timeGridApi = { setCell, getGrid, clearAll, initTimeGrid };
    }
}

export function getGrid() {
    return gridState.map(row => [...row]);
}

export function setCell(day, hour, value) {
    if (day < 0 || day > 6 || hour < 0 || hour > 23) return;
    gridState[day][hour] = value;
}

export function clearAll() {
    gridState = Array.from({ length: 7 }, () => Array(24).fill(false));
}

export function isEmpty() {
    return gridState.every(row => row.every(c => !c));
}

/**
 * 把热力图状态转换成一组"时间段"片段（按连续小时合并）
 * 返回 [{ day, timeFrom, timeTo, hour, hour+1 }, ...] 供 scheduler 使用
 */
export function toSegments() {
    const segs = [];
    for (let d = 0; d < 7; d++) {
        let runStart = -1;
        for (let h = 0; h <= 24; h++) {
            const on = h < 24 && gridState[d][h];
            if (on && runStart === -1) {
                runStart = h; // 进入一段连续区间
            } else if (!on && runStart !== -1) {
                // 区间结束，记录一段
                segs.push({
                    day: d,
                    timeFrom: `${String(runStart).padStart(2, '0')}:00`,
                    timeTo: `${String(h).padStart(2, '0')}:00`
                });
                runStart = -1;
            }
        }
    }
    return segs;
}

/* ---------------- 渲染热力图 ---------------- */
export function renderHeatmap(containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    grid.innerHTML = '';

    // 表头：星期
    const header = document.createElement('div');
    header.className = 'heatmap-header';
    header.appendChild(makeCell('', 'corner'));
    DAYS.forEach(d => header.appendChild(makeCell(d, 'day-label')));
    grid.appendChild(header);

    // 24 行
    HOURS.forEach(h => {
        const row = document.createElement('div');
        row.className = 'heatmap-row';
        const hourLabel = makeCell(`${String(h).padStart(2, '0')}:00`, 'hour-label');
        row.appendChild(hourLabel);

        for (let d = 0; d < 7; d++) {
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell' + (gridState[d][h] ? ' active' : '');
            cell.dataset.day = d;
            cell.dataset.hour = h;
            cell.title = `${DAYS[d]} ${String(h).padStart(2, '0')}:00`;
            cell.setAttribute('role', 'button');
            cell.setAttribute('aria-pressed', gridState[d][h] ? 'true' : 'false');
            row.appendChild(cell);
        }
        grid.appendChild(row);
    });

    bindCellEvents(grid);
}

function makeCell(text, cls) {
    const el = document.createElement('div');
    el.className = `heatmap-cell-static ${cls}`;
    el.textContent = text;
    return el;
}

function bindCellEvents(grid) {
    const cells = grid.querySelectorAll('.heatmap-cell');

    cells.forEach(cell => {
        cell.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            const d = parseInt(cell.dataset.day, 10);
            const h = parseInt(cell.dataset.hour, 10);
            isDragging = true;
            // 反转当前值：根据按下时的状态决定是设还是清
            dragMode = gridState[d][h] ? 'clear' : 'set';
            toggleCell(cell, d, h, dragMode);
        });

        cell.addEventListener('pointerenter', (e) => {
            if (!isDragging) return;
            const d = parseInt(cell.dataset.day, 10);
            const h = parseInt(cell.dataset.hour, 10);
            toggleCell(cell, d, h, dragMode);
        });
    });

    document.addEventListener('pointerup', () => {
        isDragging = false;
        dragMode = null;
    });
}

function toggleCell(cell, d, h, mode) {
    const newVal = mode === 'set';
    if (gridState[d][h] === newVal) return;
    gridState[d][h] = newVal;
    cell.classList.toggle('active', newVal);
    cell.setAttribute('aria-pressed', newVal ? 'true' : 'false');
    // 同步更新底部统计
    const summary = document.getElementById('heatmapSummary');
    if (summary) renderSummary('heatmapSummary');
    // 触发自定义事件，让外部（如 app.js）能监听
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('timegrid:change', { detail: { day: d, hour: h, value: newVal } }));
    }
}

/* ---------------- 渲染统计 ---------------- */
export function renderSummary(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (isEmpty()) {
        el.innerHTML = '<div class="empty-hint">还没有设置任何可复习时段，点击网格开始添加 ⬆️</div>';
        return;
    }

    // 统计每天的可用小时
    const perDay = gridState.map((row, i) => {
        const hours = row.filter(Boolean).length;
        return { day: DAYS[i], hours };
    });
    const totalHours = perDay.reduce((s, x) => s + x.hours, 0);
    const days = perDay.filter(x => x.hours > 0).length;
    const avg = days > 0 ? (totalHours / days).toFixed(1) : 0;

    // 找出最高的一天
    const max = Math.max(...perDay.map(x => x.hours));
    const min = Math.min(...perDay.filter(x => x.hours > 0).map(x => x.hours));

    el.innerHTML = `
        <div class="heatmap-stats">
            <div class="hs-stat">
                <div class="hs-value">${totalHours}</div>
                <div class="hs-label">每周总小时</div>
            </div>
            <div class="hs-stat">
                <div class="hs-value">${days}</div>
                <div class="hs-label">有安排的天</div>
            </div>
            <div class="hs-stat">
                <div class="hs-value">${avg}</div>
                <div class="hs-label">日均小时</div>
            </div>
        </div>
        <div class="heatmap-days">
            ${perDay.map(d => `
                <div class="hday ${d.hours > 0 ? 'active' : ''}">
                    <div class="hday-name">${escapeHTML(d.day)}</div>
                    <div class="hday-bar"><div class="hday-fill" style="height: ${(d.hours / Math.max(max, 1)) * 100}%"></div></div>
                    <div class="hday-hours">${d.hours}h</div>
                </div>
            `).join('')}
        </div>
    `;
}
