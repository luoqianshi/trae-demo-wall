// ai-assistant.js - AI 智能规划助手
// 前端规则引擎，模拟智能分析与对话式规划

import { escapeHTML, genId, formatDate } from './utils.js';
import { generateSchedule } from './scheduler.js';

const ADVICE_TEMPLATES = [
    {
        id: 'difficulty-imbalance',
        check: (subjects) => {
            const hard = subjects.filter(s => s.difficulty === 3);
            const easy = subjects.filter(s => s.difficulty === 1);
            if (hard.length > subjects.length * 0.6) return { level: 'warning', text: `困难科目占比过高（${hard.length}/${subjects.length}），建议适当增加复习时长或拆分重点。` };
            if (easy.length > subjects.length * 0.6) return { level: 'info', text: '整体难度偏低，可以适当增加挑战内容提升复习深度。' };
            return null;
        }
    },
    {
        id: 'time-coverage',
        check: (subjects, timeSlots) => {
            const totalHours = timeSlots.reduce((s, t) => {
                const days = Math.ceil((new Date(t.endDate) - new Date(t.startDate)) / 86400000) + 1;
                const from = new Date(`2000-01-01T${t.timeFrom}`);
                const to = new Date(`2000-01-01T${t.timeTo}`);
                const h = (to - from) / 3600000;
                return s + days * h;
            }, 0);
            const totalPoints = subjects.reduce((s, x) => s + x.points.length, 0);
            const needHours = totalPoints * 1.5; // 每个重点约需1.5小时
            if (totalHours < needHours * 0.7) {
                return { level: 'danger', text: `时间严重不足！可用 ${Math.round(totalHours)}h 但建议至少 ${Math.round(needHours)}h，建议延长复习周期或增加每日时长。` };
            }
            if (totalHours > needHours * 2) {
                return { level: 'info', text: `时间非常充裕（${Math.round(totalHours)}h），可以考虑加入更多练习或模拟测试。` };
            }
            return { level: 'success', text: `时间规划合理，${Math.round(totalHours)}h 可以覆盖 ${totalPoints} 个复习重点。` };
        }
    },
    {
        id: 'subject-balance',
        check: (subjects) => {
            if (subjects.length < 3) return { level: 'info', text: `目前只有 ${subjects.length} 个科目，建议检查是否有遗漏的考试科目。` };
            return null;
        }
    }
];

export function analyze(subjects, timeSlots) {
    const advices = [];
    ADVICE_TEMPLATES.forEach(t => {
        const result = t.check(subjects, timeSlots);
        if (result) advices.push({ id: t.id, ...result });
    });

    // 生成个性化计划建议
    const planSuggestion = generatePlanSuggestion(subjects, timeSlots);

    return { advices, planSuggestion };
}

function generatePlanSuggestion(subjects, timeSlots) {
    if (!subjects.length || !timeSlots.length) return null;

    const sorted = [...subjects].sort((a, b) => b.difficulty - a.difficulty);
    const topHard = sorted[0];
    const days = timeSlots.length > 0
        ? Math.ceil((new Date(timeSlots[0].endDate) - new Date(timeSlots[0].startDate)) / 86400000) + 1
        : 14;

    return {
        title: `${days}天冲刺方案`,
        steps: [
            `第一阶段（前 ${Math.ceil(days * 0.4)} 天）：重点攻克 ${escapeHTML(topHard.name)}，每天分配 40% 时间给该科目`,
            `第二阶段（中间 ${Math.ceil(days * 0.35)} 天）：均衡复习，按难度轮转各科目`,
            `第三阶段（最后 ${Math.floor(days * 0.25)} 天）：查漏补缺，集中刷错题和薄弱点`
        ],
        tip: `建议将 ${escapeHTML(topHard.name)} 安排在每天精力最好的时段（通常是上午），因为该科目难度最高、需要最大专注力。`
    };
}

export function chatResponse(message, { subjects, timeSlots, schedule }) {
    const msg = message.toLowerCase();

    if (msg.includes('时间') || msg.includes('不够')) {
        const totalHours = timeSlots.reduce((s, t) => {
            const days = Math.ceil((new Date(t.endDate) - new Date(t.startDate)) / 86400000) + 1;
            const from = new Date(`2000-01-01T${t.timeFrom}`);
            const to = new Date(`2000-01-01T${t.timeTo}`);
            return s + days * ((to - from) / 3600000);
        }, 0);
        return `你当前可支配的总复习时间约为 ${Math.round(totalHours)} 小时。如果感觉不够，可以尝试：1）延长每日复习时段；2）压缩简单科目的时间；3）优先保证困难科目的深度学习。`;
    }

    if (msg.includes('难') || msg.includes('薄弱')) {
        const hard = [...subjects].sort((a, b) => b.difficulty - a.difficulty)[0];
        if (hard) {
            return `你的薄弱科目可能是「${hard.name}」（难度${'⭐'.repeat(hard.difficulty)}）。建议：将其放在每天第一个复习时段，利用最清醒的头脑攻克难点。`;
        }
    }

    if (msg.includes('计划') || msg.includes('生成')) {
        return '点击下方「生成复习计划」按钮，我会根据你的科目难度和时间自动安排最优复习顺序。建议开启艾宾浩斯曲线模式，记忆效果提升30%以上！';
    }

    if (msg.includes('完成') || msg.includes('进度')) {
        const total = schedule.length;
        const done = schedule.filter(s => s.completed).length;
        const pct = total > 0 ? Math.round(done / total * 100) : 0;
        return `当前总进度 ${done}/${total}（${pct}%）。${pct < 30 ? '起步良好，继续保持！' : pct < 70 ? '已经完成大半，胜利在望！' : '冲刺阶段，再坚持一下！'}`;
    }

    if (msg.includes('你好') || msg.includes('帮助') || msg.includes('？') || msg.includes('?')) {
        return '我是你的 AI 复习助手！可以帮你分析复习策略、诊断时间分配、推荐学习顺序。直接问我「时间够不够」「哪个最难」「怎么安排」都可以~';
    }

    return '这是个好问题！我的建议是基于你当前的科目和时间数据做分析。你可以尝试点击「智能分析」获取完整的诊断报告。';
}

export function renderAIReport({ advices, planSuggestion }, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const levelIcon = { danger: '🔴', warning: '🟡', success: '🟢', info: '🔵' };
    const levelClass = { danger: 'ai-danger', warning: 'ai-warning', success: 'ai-success', info: 'ai-info' };

    const adviceHTML = advices.length
        ? advices.map(a => `
            <div class="ai-advice ${levelClass[a.level]}">
                <div class="ai-advice-icon">${levelIcon[a.level]}</div>
                <div class="ai-advice-text">${escapeHTML(a.text)}</div>
            </div>
        `).join('')
        : '<div class="ai-empty">暂无分析数据，请先添加科目和时间。</div>';

    const planHTML = planSuggestion
        ? `
            <div class="ai-plan-card">
                <div class="ai-plan-title">📋 ${escapeHTML(planSuggestion.title)}</div>
                <ol class="ai-plan-steps">
                    ${planSuggestion.steps.map(s => `<li>${escapeHTML(s)}</li>`).join('')}
                </ol>
                <div class="ai-plan-tip">💡 ${escapeHTML(planSuggestion.tip)}</div>
            </div>
        `
        : '';

    container.innerHTML = adviceHTML + planHTML;
}
