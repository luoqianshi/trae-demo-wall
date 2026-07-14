// dashboard.js - 可视化仪表盘
// 使用 Chart.js 绘制学习热力图、科目雷达图、复习趋势图

import { escapeHTML, formatDate } from './utils.js';

let charts = {};

export function initDashboard({ subjects, schedule }) {
    renderHeatmap(subjects, schedule);
    renderRadar(subjects);
    renderTrend(schedule);
    renderSubjectStats(subjects, schedule);
}

export function destroyDashboard() {
    Object.values(charts).forEach(c => c && typeof c.destroy === 'function' && c.destroy());
    charts = {};
}

/* ---------------- 学习热力图（Canvas 手动绘制 GitHub 风格） ---------------- */
function renderHeatmap(subjects, schedule) {
    const canvas = document.getElementById('heatmapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;

    // 以周为单位显示最近 12 周
    const cellSize = 14;
    const gap = 3;
    const weeks = 12;
    const width = weeks * (cellSize + gap) + 40;
    const height = 7 * (cellSize + gap) + 30;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // 统计每天的学习量（完成的任务数）
    const today = new Date();
    const dayMap = new Map();
    for (let w = 0; w < weeks; w++) {
        for (let d = 0; d < 7; d++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (weeks * 7 - w * 7 - d));
            const key = formatDate(date);
            const count = schedule.filter(s => s.date === key && s.completed).length;
            dayMap.set(`${w},${d}`, count);
        }
    }

    // 颜色等级
    const getColor = (count) => {
        if (count === 0) return 'rgba(229, 231, 235, 0.4)';
        if (count <= 2) return '#a5b4fc';
        if (count <= 4) return '#818cf8';
        if (count <= 6) return '#6366f1';
        return '#4f46e5';
    };

    // 绘制单元格
    for (let w = 0; w < weeks; w++) {
        for (let d = 0; d < 7; d++) {
            const count = dayMap.get(`${w},${d}`) || 0;
            const x = 35 + w * (cellSize + gap);
            const y = 20 + d * (cellSize + gap);
            ctx.fillStyle = getColor(count);
            ctx.beginPath();
            ctx.roundRect(x, y, cellSize, cellSize, 3);
            ctx.fill();
        }
    }

    // 标签
    ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#9ca3af' : '#6b7280';
    ctx.font = '11px sans-serif';
    const days = ['一', '三', '五', '日'];
    [0, 2, 4, 6].forEach((d, i) => {
        ctx.fillText(days[i], 4, 28 + d * (cellSize + gap));
    });

    // 月份标签
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    for (let w = 0; w < weeks; w += 3) {
        const date = new Date(today);
        date.setDate(date.getDate() - (weeks * 7 - w * 7));
        ctx.fillText(months[date.getMonth()], 35 + w * (cellSize + gap), 14);
    }
}

/* ---------------- 科目能力雷达图 ---------------- */
function renderRadar(subjects) {
    const canvas = document.getElementById('radarCanvas');
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');

    if (charts.radar) charts.radar.destroy();

    const labels = subjects.map(s => s.name);
    const data = subjects.map(s => {
        const total = s.points.length || 1;
        const done = (s.completedPoints || []).length;
        return Math.round((done / total) * 100);
    });

    charts.radar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels,
            datasets: [{
                label: '掌握度 (%)',
                data,
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderColor: '#667eea',
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#667eea',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { stepSize: 25, display: false },
                    grid: { color: 'rgba(0,0,0,0.08)' },
                    angleLines: { color: 'rgba(0,0,0,0.08)' },
                    pointLabels: {
                        font: { size: 12, family: 'system-ui' },
                        color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#d1d5db' : '#374151'
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

/* ---------------- 复习趋势图（每日完成量） ---------------- */
function renderTrend(schedule) {
    const canvas = document.getElementById('trendCanvas');
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');

    if (charts.trend) charts.trend.destroy();

    // 按日期统计完成/未完成
    const dateMap = new Map();
    schedule.forEach(s => {
        if (!dateMap.has(s.date)) dateMap.set(s.date, { completed: 0, total: 0 });
        const d = dateMap.get(s.date);
        d.total++;
        if (s.completed) d.completed++;
    });

    const sortedDates = [...dateMap.keys()].sort();
    const completed = sortedDates.map(d => dateMap.get(d).completed);
    const total = sortedDates.map(d => dateMap.get(d).total);

    charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates.map(d => d.slice(5)), // MM-DD
            datasets: [
                {
                    label: '已完成',
                    data: completed,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3
                },
                {
                    label: '计划总量',
                    data: total,
                    borderColor: '#9ca3af',
                    borderDash: [5, 5],
                    tension: 0.4,
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#9ca3af' : '#6b7280', font: { size: 11 } }
                },
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#9ca3af' : '#6b7280' },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                }
            },
            plugins: {
                legend: { labels: { color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#e5e7eb' : '#374151' } }
            }
        }
    });
}

/* ---------------- 科目统计卡片 ---------------- */
function renderSubjectStats(subjects, schedule) {
    const container = document.getElementById('subjectStats');
    if (!container) return;

    if (subjects.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="emoji">📊</div><div>暂无数据</div></div>';
        return;
    }

    container.innerHTML = subjects.map(s => {
        const total = s.points.length;
        const done = (s.completedPoints || []).length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const scheduleCount = schedule.filter(x => x.subjectId === s.id).length;
        const scheduleDone = schedule.filter(x => x.subjectId === s.id && x.completed).length;

        return `
            <div class="dashboard-subject-card">
                <div class="ds-header">
                    <span class="ds-name">${escapeHTML(s.name)}</span>
                    <span class="ds-pct">${pct}%</span>
                </div>
                <div class="ds-bar-track">
                    <div class="ds-bar-fill" style="width: ${pct}%"></div>
                </div>
                <div class="ds-meta">
                    重点 ${done}/${total} · 计划 ${scheduleDone}/${scheduleCount}
                </div>
            </div>
        `;
    }).join('');
}
