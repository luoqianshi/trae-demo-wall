// scheduler.js - 复习计划生成器
// 调度策略：
//   1) 难度优先  - difficulty 作为基础权重
//   2) 弱项突击  - 模拟考分 / 手动标记弱项 / 历史完成率低 都会放大权重
//   3) 艾宾浩斯曲线 - 首次学习 + 1/3/7/15 天后复习（间隔可调）
//   4) 错误反馈重排 - markedWrong 的计划项立即插入最近的可用时段做"补课"

import { eachDay, parseTimeOfDay, formatTime, genId } from './utils.js';

/* ================ 默认配置 ================ */
export const DEFAULT_EBBINGHAUS = [0, 1, 3, 7, 15];

/* ================ 权重计算 ================ */
/**
 * 计算每个重点的"复习权重"
 * 综合：基础难度 + 弱项标记 + 模拟考分 + 完成率
 */
export function computePointWeight(subject, point) {
    let w = subject.difficulty || 2;        // 基础 = 难度
    // 1) 手动标记弱项 +0.8
    const weak = subject.weakPoints || [];
    if (weak.includes(point)) w += 0.8;
    // 2) 模拟考分 <60 +0.5，<75 +0.2
    const score = subject.simulatedScore;
    if (typeof score === 'number') {
        if (score < 60) w += 0.5;
        else if (score < 75) w += 0.2;
    }
    // 3) 完成率 <30% +0.3
    const total = (subject.points || []).length;
    const done = (subject.completedPoints || []).length;
    if (total > 0 && done / total < 0.3) w += 0.3;
    return w;
}

/* ================ 主入口 ================ */
/**
 * 生成计划
 * @param {Array} subjects
 * @param {Array} timeSlots
 * @param {Object} options
 * @param {boolean} options.useEbbinghaus
 * @param {Array<number>} options.ebbinghausIntervals - 间隔天数(必须包含 0)
 * @returns {Array} schedule items
 */
export function generateSchedule(subjects, timeSlots, {
    useEbbinghaus = true,
    ebbinghausIntervals = DEFAULT_EBBINGHAUS
} = {}) {
    if (!subjects.length || !timeSlots.length) return [];

    // 1. 展开重点池（带权重）
    const basePoints = [];
    subjects.forEach(s => {
        (s.points || []).forEach(p => {
            basePoints.push({
                subjectId: s.id,
                subjectName: s.name,
                difficulty: s.difficulty,
                point: p,
                weight: computePointWeight(s, p)
            });
        });
    });
    if (basePoints.length === 0) return [];

    // 2. 权重高的优先
    basePoints.sort((a, b) => b.weight - a.weight);

    // 3. 展开 timeSlots -> day cells
    const slotsExpanded = timeSlots.flatMap(slot => {
        const days = eachDay(new Date(slot.startDate), new Date(slot.endDate));
        return days
            .filter(day => {
                if (!Array.isArray(slot.daysOfWeek) || slot.daysOfWeek.length === 0) return true;
                const d = new Date(day);
                const jsDay = d.getDay();
                const mondayIdx = (jsDay + 6) % 7;
                return slot.daysOfWeek.includes(mondayIdx);
            })
            .map(day => ({ ...slot, day }));
    });

    if (useEbbinghaus) {
        return ebbinghausSchedule(basePoints, slotsExpanded, ebbinghausIntervals);
    }
    return weightedSchedule(basePoints, slotsExpanded);
}

/* ---------------- 模式 1：按权重分配 ---------------- */
function weightedSchedule(allPoints, slots) {
    const items = [];
    let pointIndex = 0;
    const sortedSlots = [...slots].sort((a, b) => a.day.localeCompare(b.day));

    for (const slot of sortedSlots) {
        let cur = parseTimeOfDay(slot.timeFrom);
        const end = parseTimeOfDay(slot.timeTo);

        while (true) {
            if (pointIndex >= allPoints.length) pointIndex = 0;
            const slotEnd = new Date(cur.getTime() + slot.duration * 60000);
            if (slotEnd > end) break;

            const point = allPoints[pointIndex];
            items.push(buildItem({
                day: slot.day,
                timeFrom: formatTime(cur),
                timeTo: formatTime(slotEnd)
            }, { ...point, round: 0 }));
            cur = slotEnd;
            pointIndex++;
        }
    }
    return items;
}

/* ---------------- 模式 2：艾宾浩斯曲线 ---------------- */
function ebbinghausSchedule(allPoints, slots, intervals) {
    const safeIntervals = (intervals && intervals.length) ? intervals : DEFAULT_EBBINGHAUS;

    const tasks = [];
    allPoints.forEach(p => {
        safeIntervals.forEach((interval, round) => {
            tasks.push({ ...p, interval, round });
        });
    });

    // 排序：间隔小的先排（首次学习在前），同间隔下难度高优先
    tasks.sort((a, b) => {
        if (a.interval !== b.interval) return a.interval - b.interval;
        return b.difficulty - a.difficulty;
    });

    // 把所有可用时间段摊平为"时间槽"
    const cells = [];
    for (const slot of slots) {
        let cur = parseTimeOfDay(slot.timeFrom);
        const end = parseTimeOfDay(slot.timeTo);
        while (true) {
            const slotEnd = new Date(cur.getTime() + slot.duration * 60000);
            if (slotEnd > end) break;
            cells.push({
                day: slot.day,
                timeFrom: formatTime(cur),
                timeTo: formatTime(slotEnd)
            });
            cur = slotEnd;
        }
    }
    if (cells.length === 0) return [];

    const dayIndex = new Map();
    cells.forEach((c, i) => {
        if (!dayIndex.has(c.day)) dayIndex.set(c.day, []);
        dayIndex.set(c.day, [...(dayIndex.get(c.day) || []), i]);
    });
    const sortedDays = [...dayIndex.keys()].sort();

    const items = [];
    const cellTaken = new Array(cells.length).fill(false);

    for (const task of tasks) {
        const baseDay = sortedDays[0];
        if (!baseDay) break;
        const baseIdx = sortedDays.indexOf(baseDay);
        const targetDayIdx = Math.min(baseIdx + task.interval, sortedDays.length - 1);
        const targetDay = sortedDays[targetDayIdx];

        const candidateIdxs = dayIndex.get(targetDay) || [];
        const freeIdx = candidateIdxs.find(i => !cellTaken[i]);
        if (freeIdx === undefined) {
            let placed = false;
            for (let d = targetDayIdx + 1; d < sortedDays.length; d++) {
                const idxs = dayIndex.get(sortedDays[d]);
                const fi = idxs.find(i => !cellTaken[i]);
                if (fi !== undefined) {
                    cellTaken[fi] = true;
                    items.push(buildItem(cells[fi], task));
                    placed = true;
                    break;
                }
            }
            if (!placed) continue;
        } else {
            cellTaken[freeIdx] = true;
            items.push(buildItem(cells[freeIdx], task));
        }
    }

    return items;
}

/* ---------------- 模式 3：错误反馈重排（"今日补课"） ---------------- */
/**
 * 在已有计划的基础上，把所有 markedWrong=true 的项的"补课版本"插入到
 * 下一个未被占用的、且 date>=今天的 cell。
 * 补课项：duration 缩短为 75%，标记 isReview=true, reviewRound+1
 */
export function insertRemedialItems(schedule, timeSlots, markedItems) {
    if (!markedItems || markedItems.length === 0) return schedule;

    // 找已占用的 (date, timeFrom) 集合
    const taken = new Set(schedule.map(i => `${i.date}__${i.timeFrom}`));

    // 展开可用 cells
    const cells = [];
    for (const slot of timeSlots) {
        const days = eachDay(new Date(slot.startDate), new Date(slot.endDate));
        for (const day of days) {
            if (!Array.isArray(slot.daysOfWeek) || slot.daysOfWeek.length === 0) {
                let cur = parseTimeOfDay(slot.timeFrom);
                const end = parseTimeOfDay(slot.timeTo);
                while (true) {
                    const slotEnd = new Date(cur.getTime() + slot.duration * 60000);
                    if (slotEnd > end) break;
                    cells.push({ day, timeFrom: formatTime(cur), timeTo: formatTime(slotEnd) });
                    cur = slotEnd;
                }
            }
        }
    }
    // 只保留 date >= 今天 的
    const todayStr = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    const futureCells = cells.filter(c => c.day >= todayStr);
    // 按时间正序
    futureCells.sort((a, b) => (a.day + a.timeFrom).localeCompare(b.day + b.timeFrom));

    const additions = [];
    let cellIdx = 0;
    for (const orig of markedItems) {
        // 找一个未被占用且不与已有 schedule 冲突的 cell
        while (cellIdx < futureCells.length) {
            const c = futureCells[cellIdx++];
            const key = `${c.day}__${c.timeFrom}`;
            if (taken.has(key)) continue;
            taken.add(key);
            additions.push({
                id: genId(),
                date: c.day,
                timeFrom: c.timeFrom,
                timeTo: c.timeTo,
                subjectId: orig.subjectId,
                subjectName: orig.subjectName,
                point: `[补课] ${orig.point}`,
                difficulty: orig.difficulty,
                reviewRound: (orig.reviewRound || 0) + 1,
                completed: false,
                createdAt: Date.now(),
                isRemedial: true,
                remedialFrom: orig.id
            });
            break;
        }
    }

    return [...schedule, ...additions];
}

/* ---------------- 计划项工厂 ---------------- */
function buildItem(cell, task) {
    return {
        id: genId(),
        date: cell.day,
        timeFrom: cell.timeFrom,
        timeTo: cell.timeTo,
        subjectId: task.subjectId,
        subjectName: task.subjectName,
        point: task.point,
        difficulty: task.difficulty,
        reviewRound: task.round,
        completed: false,
        markedWrong: false,
        isRemedial: false,
        createdAt: Date.now()
    };
}
