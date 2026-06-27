/**
 * views/history.js · 历史 & 周报 Tab
 */
import { state } from '../state.js';
import { $, $$, el, fmtDate, mondayOf, hpLevel, pad2 } from '../utils.js';

export function mountHistory() {
    renderHeatmap();
    renderWeekChart();
    renderReport();
}

/** 按日聚合 HP */
function dailyAgg() {
    const map = {};
    (state.history || []).forEach(h => {
        map[h.date] = (map[h.date] || 0) + h.hp;
    });
    return map;
}

/* ----- 4 周热力图 ----- */
function renderHeatmap() {
    const host = $('#hxCal');
    if (!host) return;
    host.className = 'heatmap';
    host.innerHTML = '';
    const agg = dailyAgg();
    const today = new Date();
    const thisMonday = mondayOf(today);
    // 4 周：本周 + 前 3 周
    const weeks = [];
    for (let w = 3; w >= 0; w--) {
        const start = new Date(thisMonday);
        start.setDate(start.getDate() - 7 * w);
        weeks.push(start);
    }

    weeks.forEach((monday, idx) => {
        const label = el('div', { class: 'week-label' }, `W-${3 - idx}`);
        host.appendChild(label);
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(d.getDate() + i);
            const key = fmtDate(d);
            const hp = agg[key] || 0;
            const lvl = hpLevel(hp);
            const cell = el('div', {
                class: `cell l${lvl}`,
                dataset: { tip: `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} · ${hp} HP` },
            });
            host.appendChild(cell);
        }
    });
}

/* ----- 本周柱状图 ----- */
function renderWeekChart() {
    const host = $('#hxChartWrap');
    if (!host) return;
    host.className = 'week-chart';
    host.innerHTML = '';
    const agg = dailyAgg();
    const today = new Date();
    const monday = mondayOf(today);
    const todayKey = fmtDate(today);
    const dayNames = ['一', '二', '三', '四', '五', '六', '日'];
    const vals = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday); d.setDate(d.getDate() + i);
        vals.push({ key: fmtDate(d), label: dayNames[i], hp: agg[fmtDate(d)] || 0 });
    }
    const max = Math.max(20, ...vals.map(v => v.hp));
    vals.forEach(v => {
        const h = `${(v.hp / max * 100).toFixed(1)}%`;
        const isToday = v.key === todayKey;
        const node = el('div', { class: `week-bar ${isToday ? 'is-today' : ''}` }, [
            el('div', { class: 'bar', style: { height: h } }, [
                v.hp > 0 ? el('span', { class: 'val' }, String(v.hp)) : null,
            ]),
            el('div', { class: 'day' }, v.label),
        ]);
        host.appendChild(node);
    });
}

/* ----- 周报数据 ----- */
function renderReport() {
    const host = $('#hxReportWrap');
    if (!host) return;
    const today = new Date();
    const monday = mondayOf(today);
    const weekKeys = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday); d.setDate(d.getDate() + i);
        weekKeys.push(fmtDate(d));
    }
    const inWeek = (state.history || []).filter(h => weekKeys.includes(h.date));
    const totalHp = inWeek.reduce((a, b) => a + b.hp, 0);
    const cards = inWeek.length;
    const days = new Set(inWeek.map(h => h.date)).size;
    const byDay = {};
    inWeek.forEach(h => { byDay[h.date] = (byDay[h.date] || 0) + h.hp; });
    let bestDay = '—', bestHp = 0;
    Object.entries(byDay).forEach(([d, hp]) => { if (hp > bestHp) { bestHp = hp; bestDay = d.slice(5).replace('-', '/'); } });

    host.innerHTML = '';
    const grid = el('div', { class: 'report-grid' }, [
        cell('本周 HP', totalHp, 'HP'),
        cell('完成卡牌', cards, '张'),
        cell('活跃天数', days, '天'),
        cell('最佳一天', bestDay === '—' ? '—' : bestHp, bestDay === '—' ? '' : ` · ${bestDay}`),
    ]);
    host.appendChild(grid);
    host.appendChild(el('div', { class: 'cheer' }, [
        el('span', { class: 'emoji' }, weeklyCheerEmoji(totalHp, days)),
        weeklyCheerLine(totalHp, days),
    ]));
}

function cell(k, v, u) {
    return el('div', { class: 'report-cell' }, [
        el('div', { class: 'k' }, k),
        el('div', { class: '' }, [
            el('span', { class: 'v' }, String(v)),
            u ? el('span', { class: 'u' }, u) : null,
        ]),
    ]);
}

function weeklyCheerLine(hp, days) {
    if (hp === 0) return '本周还是一片空白哦，先来抽张卡，开个头吧 ~';
    if (hp < 50) return `本周 ${hp} HP，先动起来再说，坚持比强度更重要 💪`;
    if (hp < 150) return `${days} 天 ${hp} HP，已经超过大多数人啦，继续保持 🌱`;
    if (hp < 300) return `${days} 天 ${hp} HP，节奏稳，状态好 ✨`;
    return `${days} 天 ${hp} HP，本周硬核回血玩家 🏆`;
}
function weeklyCheerEmoji(hp, days) {
    if (hp === 0) return '🌱';
    if (hp < 50) return '💪';
    if (hp < 150) return '🌿';
    if (hp < 300) return '🌳';
    return '🏆';
}
